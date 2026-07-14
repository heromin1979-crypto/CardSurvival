// === CRAFT UI ===
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import CraftSystem from '../systems/CraftSystem.js';
import BLUEPRINTS_BASE from '../data/blueprints.js';
import BLUEPRINTS_ADV  from '../data/blueprints_advanced.js';
import HIDDEN_RECIPES  from '../data/hiddenRecipes.js';
import { SKILL_DEFS }  from '../data/skillDefs.js';
import SkillSystem     from '../systems/SkillSystem.js';
import I18n            from '../core/I18n.js';
import GameData        from '../data/GameData.js';
import CraftTreeUI     from './CraftTreeUI.js';
import CardFactory     from './CardFactory.js';
import SecretCombinationSystem from '../systems/SecretCombinationSystem.js';
import SECRET_COMBINATIONS     from '../data/secretCombinations.js';
import { en as EN_LOCALE }     from '../data/locales.js';

// 목업의 이중 표기(한/영) 스탯 라벨 — 표시 전용
const STAT_EN = {
  damage: 'DAMAGE', accuracy: 'ACCURACY', crit: 'CRITICAL',
  defense: 'DEFENSE', reduction: 'REDUCTION', movePenalty: 'MOBILITY', weight: 'WEIGHT',
};

function enItemName(id) {
  return EN_LOCALE[`_item.${id}`] ?? '';
}

// 전체 레시피 — CraftSystem과 동일한 3중 병합 (advanced 누락 시 62종이 목록에서 사라진다)
const ALL_BLUEPRINTS = { ...BLUEPRINTS_BASE, ...BLUEPRINTS_ADV, ...HIDDEN_RECIPES };

// 카테고리 탭 정의 (표시 순서대로) — 'secret'은 발견된 비밀 조합 갤러리
const CATEGORY_TABS = [
  { key: 'all',        icon: '📋', labelKey: 'craft.tab.all' },
  { key: 'weapon',     icon: '⚔️', labelKey: 'craft.tab.weapon' },
  { key: 'armor',      icon: '🛡️', labelKey: 'craft.tab.armor' },
  { key: 'tool',       icon: '🔧', labelKey: 'craft.tab.tool' },
  { key: 'structure',  icon: '🏠', labelKey: 'craft.tab.structure' },
  { key: 'food',       icon: '🍲', labelKey: 'craft.tab.food' },
  { key: 'medical',    icon: '🩹', labelKey: 'craft.tab.medical' },
  { key: 'material',   icon: '📦', labelKey: 'craft.tab.material' },
  { key: 'upgrade',    icon: '⬆️', labelKey: 'craft.tab.upgrade' },
  { key: 'consumable', icon: '🧪', labelKey: 'craft.tab.consumable' },
  { key: 'secret',     icon: '🔮', labelKey: 'craft.tab.secret' },
];

// 스펙 게이지 정규화 기준 — 카테고리 내 상대 비교용 상한 (표시 전용)
const SPEC_REF = {
  damage: 60, accuracy: 1, critChance: 0.5,
  defense: 8, damageReduction: 0.5, movePenalty: 0.3,
  consume: 50,
};

const CRAFT_BLUEPRINT_IMAGES = Object.freeze({
  weapon: 'assets/images/ui/crafting-blueprints/weapon.png',
  armor: 'assets/images/ui/crafting-blueprints/armor.png',
  tool: 'assets/images/ui/crafting-blueprints/tool.png',
  structure: 'assets/images/ui/crafting-blueprints/structure.png',
  food: 'assets/images/ui/crafting-blueprints/food.png',
  medical: 'assets/images/ui/crafting-blueprints/medical.png',
  material: 'assets/images/ui/crafting-blueprints/material.png',
  upgrade: 'assets/images/ui/crafting-blueprints/upgrade.png',
  consumable: 'assets/images/ui/crafting-blueprints/consumable.png',
});

const CraftUI = {
  _panel: null,
  _selectedBp: null,
  _completedBp: null,
  _viewMode: 'list',
  _categoryFilter: 'all',
  _statusFilter: 'craftable',
  _searchTerm: '',
  _sortMode: 'name',
  _craftableOnly: false,

  _listenersRegistered: false,

  init() {
    if (!this._listenersRegistered) {
      this._listenersRegistered = true;
      EventBus.on('tpAdvance',    () => { if (GameState.ui.basecampMode === 'CRAFT') this.renderQueue(); });
      EventBus.on('craftComplete', ({ blueprintId } = {}) => {
        this._completedBp = blueprintId ?? null;
        this.render();
      });
      EventBus.on('craftStarted', () => {
        const hadCompletedBp = Boolean(this._completedBp);
        this._completedBp = null;
        if (hadCompletedBp) {
          this.render();
          return;
        }
        this.renderQueue();
      });
      EventBus.on('boardChanged', () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('cardPlaced',   () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('cardRemoved',  () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('craftTreeSelectRecipe', ({ recipeId }) => {
        this._viewMode = 'list';
        this._selectBlueprint(recipeId);
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
        <button class="craft-view-tab ${this._viewMode !== 'tree' ? 'active' : ''}" data-view="list">📋 레시피</button>
        <button class="craft-view-tab ${this._viewMode === 'tree' ? 'active' : ''}" data-view="tree">🌳 테크 트리</button>
      </div>
    `;

    if (this._viewMode === 'tree') {
      this._panel.innerHTML = tabHtml;
      const treeContainer = document.createElement('div');
      this._panel.appendChild(treeContainer);
      CraftTreeUI.render(treeContainer);
    } else {
      const categoryTabHtml = `
        <div class="craft-category-tabs">
          ${CATEGORY_TABS.map(tab => `
            <button class="craft-category-tab ${this._categoryFilter === tab.key ? 'active' : ''}"
                    data-category="${tab.key}"
                    title="${I18n.t(tab.labelKey)}">
              ${tab.icon}<span class="cat-label">${I18n.t(tab.labelKey)}</span>
            </button>
          `).join('')}
        </div>
      `;

      if (this._categoryFilter === 'secret') {
        this._panel.innerHTML = `
          ${tabHtml}
          ${categoryTabHtml}
          <div class="craft-panel">${this._renderSecretList()}</div>
        `;
      } else {
        const groups = this._classifyBlueprints();
        const selected = this._selectedVisibleBlueprint(groups);
        this._panel.innerHTML = `
          ${tabHtml}
          ${categoryTabHtml}
          <div class="craft-workbench craft-workbench--spec">
            <div class="craft-col craft-list-col">
              <div class="craft-side-header">${I18n.t('craft.blueprints')} <span>BLUEPRINTS</span></div>
              <div class="craft-list-controls">
                <select class="craft-sort-select">
                  <option value="name" ${this._sortMode === 'name' ? 'selected' : ''}>${I18n.t('craft.sortName')}</option>
                  <option value="tp" ${this._sortMode === 'tp' ? 'selected' : ''}>${I18n.t('craft.sortTp')}</option>
                </select>
                <label><input type="checkbox" class="craft-craftable-only" ${this._craftableOnly ? 'checked' : ''}>${I18n.t('craft.craftableOnly')}</label>
              </div>
              <input type="search" class="craft-search" placeholder="${I18n.t('craft.searchPh')}"
                     value="${this._escapeAttr(this._searchTerm)}">
              ${this._renderStatusTabs(groups)}
              <div class="blueprint-list">${this._renderListItems(groups)}</div>
            </div>
            <div class="craft-col craft-spec-col">
              ${this._renderSpecSheet(selected)}
            </div>
            <div class="craft-col craft-stage-col">
              ${this._renderStagePanel(selected)}
              ${this._renderQueue()}
            </div>
          </div>
        `;
        this._attachWorkbenchHandlers();
      }
      this._attachQueueHandlers();
    }

    // Attach view tab handlers
    this._panel.querySelectorAll('.craft-view-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._viewMode = btn.dataset.view;
        this.render();
      });
    });
    this._panel.querySelectorAll('.craft-category-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._categoryFilter = btn.dataset.category;
        this._selectBlueprint(null);
        this.render();
      });
    });
  },

  _attachWorkbenchHandlers() {
    this._panel.querySelectorAll('.blueprint-item').forEach(el => {
      el.addEventListener('click', () => {
        if (el.dataset.locked === '1') return;
        this._selectBlueprint(el.dataset.bpId);
        this.render();
      });
    });
    this._panel.querySelectorAll('.craft-status-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._statusFilter = btn.dataset.status;
        this._selectBlueprint(null);
        this.render();
      });
    });
    // 검색은 목록만 부분 갱신 — 전체 재렌더 시 입력 포커스가 날아간다
    const search = this._panel.querySelector('.craft-search');
    search?.addEventListener('input', () => {
      this._searchTerm = search.value;
      const list = this._panel.querySelector('.blueprint-list');
      if (list) {
        list.innerHTML = this._renderListItems(this._classifyBlueprints());
        list.querySelectorAll('.blueprint-item').forEach(el => {
          el.addEventListener('click', () => {
            if (el.dataset.locked === '1') return;
            this._selectBlueprint(el.dataset.bpId);
            this.render();
          });
        });
      }
    });
    const startBtn = this._panel.querySelector('#craft-start-btn');
    startBtn?.addEventListener('click', () => {
      if (this._selectedBp) {
        CraftSystem.startBlueprint(this._selectedBp);
        this.render();
      }
    });
    this._panel.querySelector('.craft-sort-select')?.addEventListener('change', (e) => {
      this._sortMode = e.target.value;
      this.render();
    });
    this._panel.querySelector('.craft-craftable-only')?.addEventListener('change', (e) => {
      this._craftableOnly = e.target.checked;
      if (this._craftableOnly) this._statusFilter = 'craftable';
      this._selectBlueprint(null);
      this.render();
    });
  },

  // 상태 3분류: 제작 가능 / 재료 부족 / 잠금(사유 노출) — 시도형 hidden은 발견의 재미를 위해 비노출
  _classifyBlueprints() {
    const unlockedHidden = GameState.flags.hiddenRecipesUnlocked ?? [];
    const term = this._searchTerm.trim().toLowerCase();
    const groups = { craftable: [], lacking: [], locked: [] };

    for (const bp of Object.values(ALL_BLUEPRINTS)) {
      if (this._categoryFilter !== 'all' && bp.category !== this._categoryFilter) continue;
      if (term && !I18n.blueprintName(bp.id, bp.name).toLowerCase().includes(term)) continue;

      if (bp.hidden && !unlockedHidden.includes(bp.id)) {
        const reason = this._hiddenLockHint(bp);
        if (reason) groups.locked.push({ bp, reason, mystery: true });
        continue;
      }

      const skillReason = this._skillLockReason(bp);
      if (skillReason) {
        groups.locked.push({ bp, reason: skillReason, mystery: false });
        continue;
      }

      const check = CraftSystem.canStartBlueprint(bp.id);
      if (check.ok) groups.craftable.push({ bp });
      else groups.lacking.push({ bp, reason: check.reason });
    }
    const totalTp = (bp) => (bp.stages ?? []).reduce((sum, st) => sum + (st.tpCost ?? 0), 0);
    const sorter = this._sortMode === 'tp'
      ? (a, b) => totalTp(a.bp) - totalTp(b.bp)
      : (a, b) => I18n.blueprintName(a.bp.id, a.bp.name).localeCompare(I18n.blueprintName(b.bp.id, b.bp.name), 'ko');
    for (const key of Object.keys(groups)) groups[key].sort(sorter);
    return groups;
  },

  _skillLockReason(bp) {
    if (!bp.requiredSkills) return null;
    for (const [skillId, minLevel] of Object.entries(bp.requiredSkills)) {
      if (SkillSystem.getLevel(skillId) < minLevel) {
        const def = SKILL_DEFS[skillId];
        return I18n.t('craft.lockedSkill', { skill: def?.name ?? skillId, lv: minLevel });
      }
    }
    return null;
  },

  // 조건형 hidden만 모호한 사유로 존재를 암시 — 시도형(조합 발견)은 null 반환으로 비노출
  _hiddenLockHint(bp) {
    const c = bp.unlockConditions;
    if (!c) return null;
    if (c.minCraftLevel) return I18n.t('craft.lockedSkill', { skill: I18n.t('craft.craftSkill'), lv: c.minCraftLevel });
    if (c.bossKillId) return I18n.t('craft.lockedBoss');
    if (c.hiddenLocationId) return I18n.t('craft.lockedPlace');
    if (c.requiredCharacter) return I18n.t('craft.lockedCharacter');
    if (c.minDay > 0) return I18n.t('craft.lockedTime');
    return null;
  },

  _selectedVisibleBlueprint(groups) {
    const pool = groups[this._statusFilter] ?? [];
    if (this._selectedBp && pool.some(e => e.bp.id === this._selectedBp)) {
      return ALL_BLUEPRINTS[this._selectedBp];
    }
    // 탭 전환 직후에는 첫 항목을 자동 선택해 스펙 시트가 비지 않게 한다
    if (this._statusFilter !== 'locked' && pool.length > 0) {
      this._selectBlueprint(pool[0].bp.id);
      return pool[0].bp;
    }
    return null;
  },

  _selectBlueprint(blueprintId) {
    if (this._completedBp && this._completedBp !== blueprintId) {
      this._completedBp = null;
    }
    this._selectedBp = blueprintId;
  },

  _blueprintImage(category) {
    return CRAFT_BLUEPRINT_IMAGES[category] ?? CRAFT_BLUEPRINT_IMAGES.tool;
  },

  _renderStatusTabs(groups) {
    const tabs = [
      { key: 'craftable', label: I18n.t('craft.ready'),         count: groups.craftable.length },
      ...(this._craftableOnly ? [] : [
        { key: 'lacking',   label: I18n.t('craft.statusLacking'), count: groups.lacking.length },
        { key: 'locked',    label: I18n.t('craft.statusLocked'),  count: groups.locked.length },
      ]),
    ];
    return `
      <div class="craft-status-tabs">
        ${tabs.map(t => `
          <button class="craft-status-tab ${this._statusFilter === t.key ? 'active' : ''} status-${t.key}"
                  data-status="${t.key}">${t.label} (${t.count})</button>
        `).join('')}
      </div>`;
  },

  _renderListItems(groups) {
    const entries = groups[this._statusFilter] ?? [];
    if (entries.length === 0) {
      return `<div class="craft-empty-msg">${I18n.t('craft.emptyList')}</div>`;
    }
    return entries.map(({ bp, reason, mystery }) => {
      const isSelected = this._selectedBp === bp.id;
      const locked = this._statusFilter === 'locked';
      const name = mystery ? '???' : I18n.blueprintName(bp.id, bp.name);
      const outDef = GameData.items[(Array.isArray(bp.output) ? bp.output[0] : bp.output)?.definitionId];
      const img = !mystery && outDef ? CardFactory.images[outDef.id] : null;
      const icon = mystery ? '❔' : (outDef?.icon ?? '📦');

      const matIcons = locked ? '' : (bp.stages?.[0]?.requiredItems ?? []).slice(0, 3).map(req => {
        const def = GameData.items[req.definitionId];
        const met = GameState.countOnBoard(req.definitionId) >= req.qty;
        return `<span class="bp-mat-icon ${met ? 'met' : 'unmet'}" title="${I18n.itemName(req.definitionId, def?.name ?? req.definitionId)}">${def?.icon ?? '▫'}</span>`;
      }).join('');

      return `
        <div class="blueprint-item bp-status-${this._statusFilter} ${isSelected ? 'selected' : ''}"
             data-bp-id="${bp.id}" ${locked ? 'data-locked="1"' : ''}>
          <span class="bp-item-icon ${img ? 'bp-item-icon--img' : ''}">${img ? `<img src="${img}" alt="">` : icon}</span>
          <div class="bp-item-body">
            <div class="blueprint-name">${locked ? '' : `<span class="bp-status-prefix">[${this._statusFilter === 'craftable' ? 'Craftable' : 'Lacking'}]</span>`}${name}</div>
            ${locked
              ? `<div class="bp-lock-reason">🔒 ${reason}</div>`
              : `<div class="bp-mat-row">${matIcons}</div>`}
          </div>
          <span class="bp-item-mark">${locked ? '🔒' : this._statusFilter === 'craftable' ? '✔' : '✖'}</span>
        </div>`;
    }).join('');
  },

  // ── 중앙: 아이템 스펙 시트 ────────────────────────────────
  _renderSpecSheet(bp) {
    if (!bp) {
      return `<div class="craft-spec-empty">${I18n.t('craft.selectPrompt')}</div>`;
    }
    const out = (Array.isArray(bp.output) ? bp.output : [bp.output])[0];
    const def = out ? GameData.items[out.definitionId] : null;
    if (!def) return `<div class="craft-spec-empty">${I18n.t('craft.selectPrompt')}</div>`;

    const qtyLabel = out.qty > 1 ? ` ×${out.qty}` : '';
    return `
      <div class="craft-spec-sheet">
        <div class="spec-sheet-title">
          <span class="spec-sheet-label">ITEM SPEC SHEET:</span>
          <span class="spec-sheet-name">${I18n.itemName(def.id, def.name)}${qtyLabel}</span>
          ${enItemName(def.id) ? `<span class="spec-sheet-name-en">/ ${enItemName(def.id)}</span>` : ''}
          <span class="preview-rarity rarity-${def.rarity ?? 'common'}">${def.rarity ?? 'common'}</span>
        </div>
        <div class="spec-blueprint-frame">
          <div class="spec-blueprint-grid"></div>
          <div class="spec-sheet-figure">
            <img class="spec-figure-img" src="${this._blueprintImage(bp.category)}" alt="">
            <div class="spec-figure-callout callout-1"><span>${def.type ?? 'component'}</span></div>
            <div class="spec-figure-callout callout-2"><span>${(def.tags ?? [def.rarity ?? 'common'])[0]}</span></div>
            <div class="spec-figure-callout callout-3"><span>${I18n.itemName((bp.stages?.[0]?.requiredItems ?? [])[0]?.definitionId, GameData.items[(bp.stages?.[0]?.requiredItems ?? [])[0]?.definitionId]?.name ?? 'material')}</span></div>
            <div class="spec-figure-callout callout-4"><span>${def.weaponType ?? def.slot ?? def.subtype ?? 'field use'}</span></div>
          </div>
        </div>
        <div class="spec-sheet-desc">${def.description ?? ''}</div>
        <div class="spec-sheet-grid">
          <div class="spec-sheet-block">
            <div class="spec-block-label">${I18n.t('craft.specs')} / SPECS</div>
            ${this._renderSpecGauges(def)}
          </div>
          <div class="spec-sheet-block">
            <div class="spec-block-label">${I18n.t('craft.properties')} / PROPERTIES</div>
            ${this._renderProperties(def)}
            <div class="spec-block-label" style="margin-top:10px;">${I18n.t('craft.materials')} / MATERIALS REQUIRED</div>
            ${this._renderMaterialGauges(bp)}
          </div>
        </div>
      </div>`;
  },

  _gauge(label, value, refMax, text, delta = null) {
    const pct = Math.max(0, Math.min(100, (value / refMax) * 100));
    const deltaHtml = delta === null || delta === 0 ? ''
      : `<span class="spec-delta ${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}</span>`;
    return `
      <div class="spec-gauge-row">
        <span class="spec-gauge-label">${label}</span>
        <span class="spec-gauge-track"><i style="width:${pct.toFixed(0)}%"></i></span>
        <span class="spec-gauge-value">${text}${deltaHtml}</span>
      </div>`;
  },

  _renderSpecGauges(def) {
    const rows = [];
    const eq = this._equippedCompare(def);
    if (def.combat) {
      const c = def.combat;
      const avg = (c.damage[0] + c.damage[1]) / 2;
      rows.push(this._gauge(`${I18n.t('craft.stat.damage')} / ${STAT_EN.damage}`, avg, SPEC_REF.damage, `${c.damage[0]}~${c.damage[1]}`, eq?.damage ?? null));
      rows.push(this._gauge(`${I18n.t('craft.stat.accuracy')} / ${STAT_EN.accuracy}`, c.accuracy, SPEC_REF.accuracy, `${Math.round(c.accuracy * 100)}%`, eq?.accuracy ?? null));
      if (c.critChance > 0) rows.push(this._gauge(`${I18n.t('craft.stat.crit')} / ${STAT_EN.crit}`, c.critChance, SPEC_REF.critChance, `${Math.round(c.critChance * 100)}%`));
    }
    if (def.armor) {
      const a = def.armor;
      rows.push(this._gauge(`${I18n.t('craft.stat.defense')} / ${STAT_EN.defense}`, a.defense, SPEC_REF.defense, `${a.defense}`, eq?.defense ?? null));
      rows.push(this._gauge(`${I18n.t('craft.stat.reduction')} / ${STAT_EN.reduction}`, a.damageReduction, SPEC_REF.damageReduction, `-${Math.round(a.damageReduction * 100)}%`, eq?.damageReduction ?? null));
      if (a.movePenalty > 0) rows.push(this._gauge(`${I18n.t('craft.stat.movePenalty')} / ${STAT_EN.movePenalty}`, a.movePenalty, SPEC_REF.movePenalty, `-${Math.round(a.movePenalty * 100)}%`));
    }
    if (def.onConsume) {
      const oc = def.onConsume;
      const entries = [
        ['hp', '❤️'], ['nutrition', '🍖'], ['hydration', '💧'],
        ['morale', '😊'], ['infection', '🦠'], ['contamination', '☢️'],
      ];
      for (const [key, icon] of entries) {
        if (oc[key]) rows.push(this._gauge(icon, Math.abs(oc[key]), SPEC_REF.consume, `${oc[key] > 0 ? '+' : ''}${oc[key]}`));
      }
    }
    if (def.weight != null) {
      rows.push(`<div class="spec-gauge-row"><span class="spec-gauge-label">${I18n.t('craft.stat.weight')} / ${STAT_EN.weight}</span><span class="spec-gauge-track"></span><span class="spec-gauge-value">${def.weight}kg</span></div>`);
    }
    return rows.join('') || `<div class="craft-empty-msg">-</div>`;
  },

  // 장착 중 아이템 대비 증감 — 무기는 weapon_main, 방어구는 슬롯 일치 기준
  _equippedCompare(def) {
    const equipped = GameState.player?.equipped ?? {};
    const defFor = (instanceId) => {
      if (!instanceId || !GameState.cards?.[instanceId]) return null;
      return GameState.getCardDef(instanceId);
    };
    if (def.combat) {
      const cur = defFor(equipped.weapon_main);
      if (!cur?.combat) return null;
      const avg = (arr) => (arr[0] + arr[1]) / 2;
      return {
        damage: Math.round(avg(def.combat.damage) - avg(cur.combat.damage)),
        accuracy: Math.round((def.combat.accuracy - cur.combat.accuracy) * 100),
      };
    }
    if (def.armor) {
      const slot = def.slot ?? 'body';
      const cur = defFor(equipped[slot]);
      if (!cur?.armor) return null;
      return {
        defense: def.armor.defense - cur.armor.defense,
        damageReduction: Math.round((def.armor.damageReduction - cur.armor.damageReduction) * 100),
      };
    }
    return null;
  },

  _renderProperties(def) {
    const props = [];
    if (def.combat?.requiresAmmo) props.push(I18n.t('craft.prop.ammo', { ammo: I18n.itemName(def.combat.requiresAmmo, GameData.items[def.combat.requiresAmmo]?.name ?? def.combat.requiresAmmo) }));
    if (def.weaponType) props.push(I18n.t('craft.prop.weaponType', { type: def.weaponType }));
    for (const tag of (def.tags ?? []).slice(0, 5)) props.push(tag);
    if (props.length === 0) return `<div class="craft-empty-msg">-</div>`;
    return `<ul class="spec-props">${props.map(p => `<li>${p}</li>`).join('')}</ul>`;
  },

  _renderMaterialGauges(bp) {
    const stages = bp.stages ?? [];
    return stages.map((stage, idx) => {
      const rows = (stage.requiredItems ?? []).map(req => {
        const def = GameData.items[req.definitionId];
        const count = GameState.countOnBoard(req.definitionId);
        const met = count >= req.qty;
        const pct = Math.max(0, Math.min(100, (count / req.qty) * 100));
        const enName = enItemName(req.definitionId);
        return `
          <div class="spec-gauge-row mat ${met ? 'met' : 'unmet'}">
            <span class="spec-gauge-label" title="${I18n.itemName(req.definitionId, def?.name ?? req.definitionId)}${enName ? ' / ' + enName : ''}">${def?.icon ?? '▫'} ${I18n.itemName(req.definitionId, def?.name ?? req.definitionId)}${enName ? ` / ${enName}` : ''}</span>
            <span class="spec-gauge-track"><i style="width:${pct.toFixed(0)}%"></i></span>
            <span class="spec-gauge-value">${Math.min(count, req.qty)}/${req.qty} ${met ? `(${I18n.t('craft.owned')})` : ''}</span>
          </div>`;
      }).join('');
      const stageLabel = stages.length > 1 ? `<div class="spec-stage-label">${idx + 1}. ${stage.label ?? ''}</div>` : '';
      return stageLabel + rows;
    }).join('');
  },

  // ── 우측: 제작 단계 패널 ─────────────────────────────────
  _renderStagePanel(bp) {
    if (!bp) return '';
    const check = CraftSystem.canStartBlueprint(bp.id);
    const queueEntry = (GameState.crafting?.activeQueue ?? []).find(e => e.blueprintId === bp.id);
    const stages = bp.stages ?? [];
    const stageProgress = queueEntry ? CraftSystem.getQueueProgress(queueEntry) : 0;
    const allDone = this._completedBp === bp.id;
    const header = allDone
      ? 'CRAFTING COMPLETE / 제작 완료'
      : 'CRAFTING STAGES / 제작 단계';

    const steps = stages.map((stage, idx) => {
      let state = 'pending';
      if (queueEntry) {
        if (idx < queueEntry.stageIndex || (idx === queueEntry.stageIndex && !queueEntry.awaitingNext && stageProgress >= 1)) state = 'done';
        else if (idx === queueEntry.stageIndex) state = 'active';
      }
      const pct = state === 'done' ? 100
        : state === 'active' ? Math.round(stageProgress * 100)
        : 0;
      return `
        <div class="craft-stage-step ${state}">
          <span class="stage-step-num">${String(idx + 1).padStart(2, '0')}</span>
          <div class="stage-step-body">
            <div class="stage-step-label">
              <span>${stage.label ?? ''} ${state === 'done' ? '✔' : ''}</span>
              <span class="stage-step-state">${pct}% ${state === 'done' ? 'Done' : state === 'active' ? 'In progress' : 'Ready'}</span>
              <span class="stage-step-tp">${stage.tpCost}TP</span>
            </div>
            <div class="craft-progress-track"><div class="craft-progress-fill" style="width:${pct}%"></div></div>
          </div>
        </div>`;
    }).join('');

    const skillReqs = this._renderSkillReqs(bp);
    const action = queueEntry
      ? ''
      : check.ok
        ? `<button class="craft-item-btn" id="craft-start-btn"><span class="craft-item-btn-icon">⚙</span><span>${I18n.t('craft.craftItem')}<small>CRAFT ITEM</small></span></button>`
        : `<button class="craft-item-btn disabled" id="craft-start-btn" disabled><span class="craft-item-btn-icon">⚙</span><span>${I18n.t('craft.craftItem')}<small>CRAFT ITEM</small></span></button><div class="craft-check-reason">${check.reason}</div>`;

    return `
      <div class="craft-stage-panel">
        <div class="craft-stage-header">
          <span class="craft-stage-header-main">${header}</span>
        </div>
        <div class="craft-stage-tools">
          <span>생물/보안성 ▼</span>
          <label><input type="checkbox" checked> 보유 증언 보기</label>
          <input type="search" class="craft-stage-search" placeholder="${I18n.t('craft.searchPh')}">
        </div>
        ${steps}
        ${skillReqs}
        ${action}
      </div>`;
  },

  _renderSecretList() {
    const progress = SecretCombinationSystem.getProgress();
    const hints   = SecretCombinationSystem.getUnlockedHints();
    const found   = GameState.discoveries?.foundCombinations ?? [];
    const hintIds = GameState.discoveries?.unlockedHints ?? [];
    const items   = GameData?.items ?? {};
    const pct     = progress.total > 0 ? Math.round((progress.found / progress.total) * 100) : 0;

    const header = `
      <div class="sg-progress" style="margin-bottom:8px;">
        <span>${I18n.t('secret.progress', { found: progress.found, total: progress.total })}</span>
        <div class="sg-progress-bar">
          <div class="sg-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>`;

    const cards = SECRET_COMBINATIONS.map(combo => {
      const isFound = found.includes(combo.id);
      const hasHint = hintIds.includes(combo.id);
      if (isFound) {
        const srcDef = items[combo.source?.id];
        const tgtDef = items[combo.target?.id];
        const resultDef = combo.result?.spawnItem ? items[combo.result.spawnItem] : null;
        const icon = resultDef?.icon ?? '?';
        const srcName = srcDef ? I18n.itemName(srcDef.id, srcDef.name) : (combo.source?.tag ?? '?');
        const tgtName = tgtDef ? I18n.itemName(tgtDef.id, tgtDef.name) : (combo.target?.tag ?? '?');
        return `
          <div class="sg-combo-card sg-found">
            <div class="sg-combo-icon">${icon}</div>
            <div class="sg-combo-info">
              <div class="sg-combo-name">${combo.name}</div>
              <div class="sg-combo-recipe">${srcName} + ${tgtName}</div>
            </div>
            <div class="sg-combo-badge sg-badge-found">${I18n.t('secret.discovered')}</div>
          </div>`;
      }
      if (hasHint) {
        const hintEntry = hints.find(h => h.id === combo.id);
        return `
          <div class="sg-combo-card sg-hint">
            <div class="sg-combo-icon">?</div>
            <div class="sg-combo-info">
              <div class="sg-combo-name">???</div>
              <div class="sg-combo-hint">${hintEntry?.hint ?? combo.hint}</div>
            </div>
            <div class="sg-combo-badge sg-badge-hint">${I18n.t('secret.hintOnly')}</div>
          </div>`;
      }
      return `
        <div class="sg-combo-card sg-unknown">
          <div class="sg-combo-icon">?</div>
          <div class="sg-combo-info">
            <div class="sg-combo-name">???</div>
          </div>
          <div class="sg-combo-badge sg-badge-unknown">${I18n.t('secret.unknown')}</div>
        </div>`;
    }).join('');

    return header + `<div class="sg-combo-list">${cards}</div>`;
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
    // 진행 중 제작이 없으면 큐 영역 자체를 숨긴다 (최상단에 빈 라벨이 뜨지 않도록)
    if (!queue.length) return '';

    const items = queue.map((entry) => {
      const bp   = ALL_BLUEPRINTS[entry.blueprintId];
      const pct  = CraftSystem.getQueueProgress(entry) * 100;
      const name = I18n.blueprintName(entry.blueprintId, bp?.name ?? entry.blueprintId);

      // 다음 단계 대기: 필요 재료 + "이어서 제작" 버튼
      if (entry.awaitingNext) {
        const nextStage = bp?.stages?.[entry.stageIndex + 1];
        const reqList   = nextStage?.requiredItems ?? [];
        const reqsHtml  = reqList.map(req => {
          const def   = GameData.items[req.definitionId];
          const count = GameState.countOnBoard(req.definitionId);
          const met   = count >= req.qty;
          return `<div class="blueprint-req ${met ? 'met' : 'unmet'}">${I18n.itemName(req.definitionId, def?.name ?? req.definitionId)} ×${req.qty} <span>${count}/${req.qty}</span></div>`;
        }).join('');
        const canContinue = reqList.every(req => GameState.countOnBoard(req.definitionId) >= req.qty);

        return `
          <div class="craft-queue-item">
            <div class="craft-queue-item-name">${name}</div>
            <div class="craft-progress-track">
              <div class="craft-progress-fill" style="width:${pct.toFixed(1)}%"></div>
            </div>
            <div style="font-size:9px;color:var(--text-dim);margin-top:2px;">${I18n.t('craft.awaitingNext', { label: nextStage?.label ?? '' })}</div>
            <div class="blueprint-req-list">${reqsHtml}</div>
            <button class="toolbar-btn craft-continue-btn" data-craft-card="${entry.craftCardId}" ${canContinue ? '' : 'disabled'} style="margin-top:4px;width:100%">${I18n.t('craft.continueCraft')}</button>
          </div>
        `;
      }

      // 진행 중(즉시 소비 직후) — 단계 라벨만 표시
      const stage = bp?.stages?.[entry.stageIndex];
      return `
        <div class="craft-queue-item">
          <div class="craft-queue-item-name">
            ${name}
            <span style="color:var(--text-dim);font-size:9px;"> — ${stage?.label ?? ''}</span>
          </div>
          <div class="craft-progress-track">
            <div class="craft-progress-fill" style="width:${pct.toFixed(1)}%"></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="craft-queue" style="margin-bottom:12px;">
        <div class="craft-queue-label">${I18n.t('craft.queueLabel', { current: queue.length, max: GameState.crafting.maxQueueSize })}</div>
        ${items}
      </div>
    `;
  },

  _attachQueueHandlers() {
    this._panel?.querySelectorAll('.craft-continue-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cardId = btn.dataset.craftCard;
        if (cardId && CraftSystem.advanceCraftStage(cardId)) this.render();
      });
    });
  },

  renderQueue() {
    // Lightweight update: just re-render the queue part
    const queueEl = this._panel?.querySelector('.craft-queue');
    if (queueEl) {
      queueEl.outerHTML = this._renderQueue();
      this._attachQueueHandlers();
    } else this.render();
  },

  _escapeAttr(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  },
};

export default CraftUI;
