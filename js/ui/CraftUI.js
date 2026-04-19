// === CRAFT UI ===
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import CraftSystem from '../systems/CraftSystem.js';
import BLUEPRINTS_BASE from '../data/blueprints.js';
import HIDDEN_RECIPES  from '../data/hiddenRecipes.js';
import { SKILL_DEFS }  from '../data/skillDefs.js';
import SkillSystem     from '../systems/SkillSystem.js';
import I18n            from '../core/I18n.js';
import GameData        from '../data/GameData.js';
import CraftTreeUI     from './CraftTreeUI.js';

// 전체 레시피 (히든 포함)
const ALL_BLUEPRINTS = { ...BLUEPRINTS_BASE, ...HIDDEN_RECIPES };

const CraftUI = {
  _panel: null,
  _selectedBp: null,
  _viewMode: 'list',

  _listenersRegistered: false,

  init() {
    if (!this._listenersRegistered) {
      this._listenersRegistered = true;
      EventBus.on('tpAdvance',    () => { if (GameState.ui.basecampMode === 'CRAFT') this.renderQueue(); });
      EventBus.on('craftComplete',() => this.render());
      EventBus.on('craftStarted', () => this.renderQueue());
      EventBus.on('boardChanged', () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('cardPlaced',   () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('cardRemoved',  () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('craftTreeSelectRecipe', ({ recipeId }) => {
        this._viewMode = 'list';
        this._selectedBp = recipeId;
        this.render();
      });
    }
    // Panel is set from Basecamp when opening the craft modal
    // Do not auto-render here; render() guard checks basecampMode
  },

  render() {
    if (!this._panel) return;
    if (GameState.ui.basecampMode !== 'CRAFT') return;

    // View mode tabs
    const tabHtml = `
      <div class="craft-view-tabs">
        <button class="craft-view-tab ${this._viewMode !== 'tree' ? 'active' : ''}" data-view="list">\uD83D\uDCCB \uB808\uC2DC\uD53C</button>
        <button class="craft-view-tab ${this._viewMode === 'tree' ? 'active' : ''}" data-view="tree">\uD83C\uDF33 \uD14C\uD06C \uD2B8\uB9AC</button>
      </div>
    `;

    if (this._viewMode === 'tree') {
      this._panel.innerHTML = tabHtml;
      const treeContainer = document.createElement('div');
      this._panel.appendChild(treeContainer);
      CraftTreeUI.render(treeContainer);
    } else {
      this._panel.innerHTML = `
        ${tabHtml}
        <div class="craft-panel">
          <div style="font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
            ${I18n.t('craft.blueprints')}
          </div>
          ${this._renderBlueprintList()}
          ${this._renderQueue()}
        </div>
      `;

      // Attach click handlers
      this._panel.querySelectorAll('.blueprint-item').forEach(el => {
        el.addEventListener('click', () => {
          this._selectedBp = el.dataset.bpId;
          this.render();
        });
      });

      const startBtn = this._panel.querySelector('#craft-start-btn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (this._selectedBp) {
            CraftSystem.startBlueprint(this._selectedBp);
            this.render();
          }
        });
      }
    }

    // Attach view tab handlers
    this._panel.querySelectorAll('.craft-view-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._viewMode = btn.dataset.view;
        this.render();
      });
    });
  },

  _renderBlueprintList() {
    const unlockedHidden = GameState.flags.hiddenRecipesUnlocked ?? [];
    const visibleBlueprints = Object.values(ALL_BLUEPRINTS).filter(bp => {
      // 히든 레시피: 해금된 것만 표시
      if (bp.hidden) return unlockedHidden.includes(bp.id);
      // 일반 레시피: 요구 스킬을 모두 달성해야 표시
      if (bp.requiredSkills) {
        for (const [skillId, minLevel] of Object.entries(bp.requiredSkills)) {
          if (SkillSystem.getLevel(skillId) < minLevel) return false;
        }
      }
      return true;
    });

    if (visibleBlueprints.length === 0) {
      return `<div style="text-align:center;padding:20px;color:var(--text-dim);font-size:10px;">
        스킬을 높여 새로운 레시피를 해금하세요
      </div>`;
    }

    return visibleBlueprints.map(bp => {
      const isSelected = this._selectedBp === bp.id;
      const check      = CraftSystem.canStartBlueprint(bp.id);

      const reqs = (bp.stages?.[0]?.requiredItems ?? []).map(req => {
        const def   = GameData.items[req.definitionId];
        const count = GameState.countOnBoard(req.definitionId);
        const met   = count >= req.qty;
        return `<div class="blueprint-req ${met ? 'met' : 'unmet'}">
          ${I18n.itemName(req.definitionId, def?.name ?? req.definitionId)} ×${req.qty}
          <span>${count}/${req.qty}</span>
        </div>`;
      }).join('');

      return `
        <div class="blueprint-item ${isSelected ? 'selected' : ''}" data-bp-id="${bp.id}">
          <div class="blueprint-name">${I18n.blueprintName(bp.id, bp.name)}</div>
          <div class="blueprint-cost">${bp.stages.map(s => `${s.label} (${s.tpCost}TP)`).join(' → ')}</div>
          ${this._renderSkillReqs(bp)}
          ${isSelected ? `
            ${this._renderOutputPreview(bp)}
            <div class="blueprint-req-list">${reqs}</div>
            ${check.ok
              ? `<button class="toolbar-btn" id="craft-start-btn" style="margin-top:6px;width:100%">${I18n.t('craft.startCraft')}</button>`
              : `<div style="font-size:9px;color:var(--text-danger);margin-top:4px;">${check.reason}</div>`
            }
          ` : ''}
        </div>
      `;
    }).join('');
  },

  _renderSkillReqs(bp) {
    if (!bp.requiredSkills || Object.keys(bp.requiredSkills).length === 0) return '';
    const reqs = Object.entries(bp.requiredSkills).map(([skillId, minLevel]) => {
      const met = SkillSystem.getLevel(skillId) >= minLevel;
      const def = SKILL_DEFS[skillId];
      return `<span class="blueprint-skill-req ${met ? 'met' : 'unmet'}">${def?.icon ?? ''}${def?.name ?? skillId} Lv.${minLevel}</span>`;
    }).join('');
    return `<div class="blueprint-skill-reqs">${reqs}</div>`;
  },

  _renderOutputPreview(bp) {
    const outputs = Array.isArray(bp.output) ? bp.output : [bp.output];
    if (!outputs.length || !outputs[0]) return '';

    const out = outputs[0];
    const def = GameData.items[out.definitionId];
    if (!def) return '';

    let statsHtml = '';

    // Weapon stats
    if (def.combat) {
      const c = def.combat;
      statsHtml += `<div class="preview-stat">\u2694\uFE0F ${c.damage[0]}~${c.damage[1]}</div>`;
      statsHtml += `<div class="preview-stat">\uD83C\uDFAF ${Math.round(c.accuracy * 100)}%</div>`;
      if (c.critChance > 0) statsHtml += `<div class="preview-stat">\uD83D\uDCA5 ${Math.round(c.critChance * 100)}% \u00D7${c.critMultiplier}</div>`;
    }

    // Armor stats
    if (def.armor) {
      const a = def.armor;
      statsHtml += `<div class="preview-stat">\uD83D\uDEE1\uFE0F ${a.defense}</div>`;
      statsHtml += `<div class="preview-stat">\uD83D\uDD3D -${Math.round(a.damageReduction * 100)}%</div>`;
      if (a.movePenalty > 0) statsHtml += `<div class="preview-stat">\uD83E\uDDBF -${Math.round(a.movePenalty * 100)}%</div>`;
    }

    // Consumable effects
    if (def.onConsume) {
      const oc = def.onConsume;
      if (oc.hp) statsHtml += `<div class="preview-stat">\u2764\uFE0F +${oc.hp}</div>`;
      if (oc.nutrition) statsHtml += `<div class="preview-stat">\uD83C\uDF56 +${oc.nutrition}</div>`;
      if (oc.hydration) statsHtml += `<div class="preview-stat">\uD83D\uDCA7 +${oc.hydration}</div>`;
      if (oc.morale) statsHtml += `<div class="preview-stat">${oc.morale > 0 ? '\uD83D\uDE0A' : '\uD83D\uDE1F'} ${oc.morale > 0 ? '+' : ''}${oc.morale}</div>`;
      if (oc.infection) statsHtml += `<div class="preview-stat">\uD83E\uDDA0 ${oc.infection}</div>`;
      if (oc.contamination) statsHtml += `<div class="preview-stat">\u2622\uFE0F ${oc.contamination}</div>`;
    }

    const qtyLabel = out.qty > 1 ? ` \u00D7${out.qty}` : '';

    return `
      <div class="blueprint-output-preview">
        <div class="preview-header">
          <span class="preview-icon">${def.icon ?? '\uD83D\uDCE6'}</span>
          <span class="preview-name">${def.name}${qtyLabel}</span>
          <span class="preview-rarity rarity-${def.rarity ?? 'common'}">${def.rarity ?? 'common'}</span>
        </div>
        <div class="preview-desc">${def.description ?? ''}</div>
        ${statsHtml ? `<div class="preview-stats">${statsHtml}</div>` : ''}
      </div>
    `;
  },

  _renderQueue() {
    const queue = GameState.crafting.activeQueue;
    if (!queue.length) return `<div class="craft-queue-label" style="margin-top:12px;">${I18n.t('craft.emptyQueue')}</div>`;

    const items = queue.map((entry, i) => {
      const bp      = ALL_BLUEPRINTS[entry.blueprintId];
      const stage   = bp?.stages[entry.stageIndex];
      const pct     = CraftSystem.getQueueProgress(entry) * 100;

      return `
        <div class="craft-queue-item">
          <div class="craft-queue-item-name">
            ${I18n.blueprintName(entry.blueprintId, bp?.name ?? entry.blueprintId)}
            <span style="color:var(--text-dim);font-size:9px;"> — ${stage?.label ?? ''}</span>
          </div>
          <div class="craft-progress-track">
            <div class="craft-progress-fill" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <div style="font-size:9px;color:var(--text-dim);margin-top:2px;">
            ${I18n.t('craft.tpRemaining', { tp: entry.tpRemaining })}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="craft-queue" style="margin-top:12px;">
        <div class="craft-queue-label">${I18n.t('craft.queueLabel', { current: queue.length, max: GameState.crafting.maxQueueSize })}</div>
        ${items}
      </div>
    `;
  },

  renderQueue() {
    // Lightweight update: just re-render the queue part
    const queueEl = this._panel?.querySelector('.craft-queue');
    if (queueEl) queueEl.outerHTML = this._renderQueue();
    else this.render();
  },
};

export default CraftUI;
