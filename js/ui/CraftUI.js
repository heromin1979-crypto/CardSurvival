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

// 전체 레시피 (히든 포함)
const ALL_BLUEPRINTS = { ...BLUEPRINTS_BASE, ...HIDDEN_RECIPES };

const CraftUI = {
  _panel: null,
  _selectedBp: null,

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
    }
    // Panel is set from Basecamp when opening the craft modal
    // Do not auto-render here; render() guard checks basecampMode
  },

  render() {
    if (!this._panel) return;
    if (GameState.ui.basecampMode !== 'CRAFT') return;

    this._panel.innerHTML = `
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
  },

  _renderBlueprintList() {
    // 히든 레시피는 해금된 것만 표시
    const visibleBlueprints = Object.values(ALL_BLUEPRINTS).filter(bp => {
      if (!bp.hidden) return true;
      return (GameState.flags.hiddenRecipesUnlocked ?? []).includes(bp.id);
    });

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
