// === EQUIPMENT MODAL ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';
import I18n            from '../core/I18n.js';

const SLOT_META = {
  head:        { i18nKey: 'equip.head',       icon: '⛑️',  row: 1 },
  face:        { i18nKey: 'equip.face',       icon: '😷',  row: 2, col: 'left' },
  body:        { i18nKey: 'equip.body',       icon: '🦺',  row: 3 },
  offhand:     { i18nKey: 'equip.offhand',    icon: '🛡️',  row: 2, col: 'right' },
  hands:       { i18nKey: 'equip.hands',      icon: '🧤',  row: 4, col: 'left' },
  backpack:    { i18nKey: 'equip.backpack',   icon: '🎒',  row: 4, col: 'right' },
  weapon_main: { i18nKey: 'equip.weaponMain', icon: '⚔️',  row: 5, col: 'left' },
  weapon_sub:  { i18nKey: 'equip.weaponSub',  icon: '🗡️',  row: 5, col: 'right' },
  belt:        { i18nKey: 'equip.belt',       icon: '📎',  row: 6, col: 'left',  locked: true },
  accessory:   { i18nKey: 'equip.accessory',  icon: '💎',  row: 6, col: 'right', locked: true },
  boots:       { i18nKey: 'equip.boots',      icon: '👟',  row: 7 },
};

/** Get localized label for a slot */
function slotLabel(slotId) {
  const meta = SLOT_META[slotId];
  return meta ? I18n.t(meta.i18nKey) : slotId;
}

const TAB_KEYS = ['equip.tabArmor', 'equip.tabWeapons', 'equip.tabBags', 'equip.tabInventory'];

const EquipmentModal = {
  _initialized: false,
  _overlay:     null,
  _selectedId:  null,
  _activeTab:   0,
  _slotMenuId:  null,

  init() {
    // _overlay는 Basecamp가 매번 DOM을 재빌드하므로 항상 새로 캐시
    this._overlay = document.getElementById('equip-modal');
    if (!this._overlay) return;

    // 이벤트 리스너는 최초 1회만 등록
    if (!this._initialized) {
      this._initialized = true;

      // Escape 키
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this._overlay?.classList.contains('open')) this.close();
      });

      // 장착 변경 시 자동 재렌더
      EventBus.on('equipChanged', () => {
        if (this._overlay?.classList.contains('open')) this._render();
      });
      EventBus.on('languageChanged', () => {
        if (this._overlay?.classList.contains('open')) this._render();
      });
    }

    // 오버레이 클릭으로 닫기 (DOM 재빌드 후 매번 재바인딩)
    this._overlay.addEventListener('click', e => {
      if (e.target === this._overlay) this.close();
    });
  },

  open() {
    if (!this._initialized) this.init();
    this._selectedId = null;
    this._slotMenuId = null;
    this._render();
    this._overlay?.classList.add('open');
  },

  close() {
    this._overlay?.classList.remove('open');
    this._selectedId = null;
    this._slotMenuId = null;
  },

  // ── 렌더링 ───────────────────────────────────────────

  _render() {
    const box = this._overlay?.querySelector('.equip-modal-box');
    if (!box) return;

    box.innerHTML = `
      <div class="equip-modal-header">
        <span class="equip-modal-title">${I18n.t('equip.title')}</span>
        <button class="equip-modal-close" id="equip-close-btn">${I18n.t('equip.close')}</button>
      </div>
      <div class="equip-modal-body">
        ${this._renderEffectsPanel()}
        ${this._renderCharPanel()}
        ${this._renderInvPanel()}
      </div>
    `;

    box.querySelector('#equip-close-btn')?.addEventListener('click', () => this.close());
    this._bindSlotEvents(box);
    this._bindInvEvents(box);
    this._bindTabEvents(box);
  },

  // ── 효과 패널 (왼쪽) ─────────────────────────────────

  _renderEffectsPanel() {
    const fx = EquipmentSystem ? this._getEffects() : null;
    const none = I18n.t('equip.none');
    const rows = fx ? [
      { label: I18n.t('equip.dmgReduce'),  value: fx.damageReduction   > 0 ? `-${Math.round(fx.damageReduction*100)}%`   : none, cls: fx.damageReduction   > 0 ? 'good' : '' },
      { label: I18n.t('equip.critReduce'), value: fx.critReduction     > 0 ? `-${Math.round(fx.critReduction*100)}%`     : none, cls: fx.critReduction     > 0 ? 'good' : '' },
      { label: I18n.t('equip.radResist'),  value: fx.radiationMult     < 1 ? `×${fx.radiationMult.toFixed(2)}`           : none, cls: fx.radiationMult     < 1 ? 'good' : '' },
      { label: I18n.t('equip.contResist'), value: fx.contaminationMult < 1 ? `×${fx.contaminationMult.toFixed(2)}`       : none, cls: fx.contaminationMult < 1 ? 'good' : '' },
      { label: I18n.t('equip.infResist'),  value: fx.infectionMult     < 1 ? `×${fx.infectionMult.toFixed(2)}`           : none, cls: fx.infectionMult     < 1 ? 'good' : '' },
    ] : [];

    const extraSlots = GameState.player.extraSlots ?? 0;
    if (extraSlots > 0) {
      rows.push({ label: I18n.t('equip.bagSlots'), value: `+${extraSlots}${I18n.t('equip.slotUnit')}`, cls: 'info' });
    }

    return `
      <div class="equip-effects-panel">
        <div class="equip-effects-title">${I18n.t('equip.effectTitle')}</div>
        ${rows.map(r => `
          <div class="equip-effect-row">
            <span class="equip-effect-label">${r.label}</span>
            <span class="equip-effect-value ${r.cls}">${r.value}</span>
          </div>`).join('')}
        ${rows.length === 0 ? `<div style="font-size:10px;color:var(--text-dim);text-align:center;margin-top:12px;">${I18n.t('equip.noEquip')}</div>` : ''}
      </div>
    `;
  },

  _getEffects() {
    const result = { damageReduction:0, critReduction:0, radiationMult:1, contaminationMult:1, infectionMult:1 };
    const eq = GameState.player.equipped;
    if (!eq) return result;
    for (const id of Object.values(eq)) {
      if (!id) continue;
      const w = GameState.getCardDef(id)?.onWear;
      if (!w) continue;
      if (w.damageReduction)   result.damageReduction   += w.damageReduction;
      if (w.critReduction)     result.critReduction     += w.critReduction;
      if (w.radiationMult)     result.radiationMult     *= w.radiationMult;
      if (w.contaminationMult) result.contaminationMult *= w.contaminationMult;
      if (w.infectionMult)     result.infectionMult     *= w.infectionMult;
    }
    result.damageReduction = Math.min(0.75, result.damageReduction);
    result.critReduction   = Math.min(0.90, result.critReduction);
    return result;
  },

  // ── 캐릭터 & 슬롯 패널 (중앙) ───────────────────────

  _renderCharPanel() {
    // 그리드 배열: [row1-left, row1-center, row1-right] × 6행
    const grid = this._buildSlotGrid();
    const rowsHtml = grid.map(row =>
      row.map(cell => cell === 'CHAR' ? this._charSilhouette() : (cell ? this._renderSlot(cell) : '<div></div>'))
         .join('')
    ).join('');

    return `
      <div class="equip-char-panel">
        <div class="equip-char-grid">${rowsHtml}</div>
      </div>
    `;
  },

  _buildSlotGrid() {
    // 7행 × 3열 [left, center, right]
    return [
      [null,          'head',       null       ],  // 행1
      ['face',        'CHAR',       'offhand'  ],  // 행2
      [null,          'body',       null       ],  // 행3
      ['hands',       'CHAR2',      'backpack' ],  // 행4 (CHAR2 = 실루엣 아랫부분)
      ['weapon_main', null,         'weapon_sub'], // 행5
      ['belt',        'accessory',  null       ],  // 행6
      [null,          'boots',      null       ],  // 행7
    ];
  },

  _charSilhouette() {
    return `<div class="equip-char-silhouette">👤</div>`;
  },

  _renderSlot(slotId) {
    if (slotId === 'CHAR2') return `<div style="height:108px;"></div>`;

    const meta       = SLOT_META[slotId];
    const equipped   = GameState.player.equipped?.[slotId];
    const isLocked   = meta?.locked;
    const isMenuOpen = this._slotMenuId === slotId;

    let innerHtml = '';

    if (isMenuOpen && equipped) {
      innerHtml = this._renderSlotMenu(slotId, equipped);
    } else if (equipped && GameState.cards[equipped]) {
      innerHtml = this._buildMiniCard(equipped);
    } else {
      innerHtml = `
        <div class="equip-slot-empty-icon">${isLocked ? '🔒' : (meta?.icon ?? '?')}</div>
        <div class="equip-slot-label">${meta ? I18n.t(meta.i18nKey) : slotId}</div>
      `;
    }

    // 유효 슬롯 하이라이트 여부
    const isHighlighted = this._selectedId
      ? EquipmentSystem.getSlotsForDef(GameState.getCardDef(this._selectedId)).includes(slotId)
      : false;

    const cls = [
      'equip-slot',
      equipped ? 'has-item' : '',
      isLocked ? 'locked' : '',
      isHighlighted ? 'highlight-valid' : '',
    ].filter(Boolean).join(' ');

    return `<div class="${cls}" data-slot="${slotId}">${innerHtml}</div>`;
  },

  _renderSlotMenu(slotId, instanceId) {
    const def = GameState.getCardDef(instanceId);
    return `
      <div class="equip-slot-menu">
        <div style="font-size:9px;color:var(--text-dim);margin-bottom:2px;">${def ? I18n.itemName(def.id ?? instanceId, def.name) : I18n.t('equip.equipped')}</div>
        <button class="equip-slot-menu-btn danger" data-action="unequip" data-slot="${slotId}">${I18n.t('equip.unequip')}</button>
        <button class="equip-slot-menu-btn" data-action="cancel-menu">${I18n.t('equip.cancel')}</button>
      </div>
    `;
  },

  _buildMiniCard(instanceId) {
    const def  = GameState.getCardDef(instanceId);
    const inst = GameState.cards[instanceId];
    if (!def || !inst) return '';
    const durPct = inst.durability != null ? `${Math.round(inst.durability)}%` : '';
    return `
      <div class="equip-mini-card">
        <div class="equip-mini-icon">${def.icon ?? '?'}</div>
        <div class="equip-mini-name">${I18n.itemName(def.id ?? inst.definitionId, def.name)}</div>
        ${durPct ? `<div class="equip-mini-dur">${durPct}</div>` : ''}
      </div>
    `;
  },

  // ── 인벤토리 패널 (오른쪽) ──────────────────────────

  _renderInvPanel() {
    const tabsHtml = TAB_KEYS.map((key, i) =>
      `<button class="equip-inv-tab${this._activeTab === i ? ' active' : ''}" data-tab="${i}">${I18n.t(key)}</button>`
    ).join('');

    const items = this._getFilteredItems();
    const isEmpty = items.length === 0;
    const emptyMsg = this._activeTab === 3 ? I18n.t('equip.emptyInv') : I18n.t('equip.noEquippable');
    const listHtml = isEmpty
      ? `<div class="equip-inv-empty">${emptyMsg}</div>`
      : items.map(c => this._buildInvRow(c.instanceId, { isInventory: !!c.isInventory })).join('');

    return `
      <div class="equip-inv-panel">
        <div class="equip-inv-tabs">${tabsHtml}</div>
        <div class="equip-inv-list">${listHtml}</div>
      </div>
    `;
  },

  _getFilteredItems() {
    const tab = this._activeTab;

    // 소지품 탭: bottom row 전체 (장착 가능 여부 무관)
    if (tab === 3) {
      return GameState.board.bottom
        .filter(id => id && GameState.cards[id])
        .map(id => ({ instanceId: id, isInventory: true }));
    }

    const equippable = EquipmentSystem.getEquippableBoardItems();
    return equippable.filter(c => {
      const def = GameState.getCardDef(c.instanceId);
      if (!def) return false;
      if (tab === 0) return def.type === 'armor';
      if (tab === 1) return def.type === 'weapon';
      if (tab === 2) return def.type === 'tool' || def.subtype === 'bag';
      return true;
    });
  },

  _buildInvRow(instanceId, opts = {}) {
    const def  = GameState.getCardDef(instanceId);
    const inst = GameState.cards[instanceId];
    if (!def || !inst) return '';

    const isSelected   = this._selectedId === instanceId;
    const durStr       = inst.durability != null ? ` · ${Math.round(inst.durability)}%` : '';
    const equipSlots   = EquipmentSystem.getSlotsForDef(def);
    const slotsLabel   = equipSlots.map(s => slotLabel(s)).join(', ');
    const qtyStr       = (inst.quantity ?? 1) > 1 ? ` ×${inst.quantity}` : '';

    // 소지품 탭: 장착 슬롯 없으면 아이템 타입 표시
    const subLabel = opts.isInventory
      ? (slotsLabel || def.subtype || def.type)
      : slotsLabel;

    return `
      <div class="equip-inv-row${isSelected ? ' selected' : ''}${opts.isInventory ? ' inv-item' : ''}" data-inv-id="${instanceId}">
        <div class="equip-inv-icon">${def.icon ?? '?'}</div>
        <div class="equip-inv-info">
          <div class="equip-inv-name">${I18n.itemName(def.id ?? inst.definitionId, def.name)}${qtyStr}</div>
          <div class="equip-inv-sub">${subLabel}${durStr}</div>
        </div>
      </div>
    `;
  },

  // ── 이벤트 바인딩 ────────────────────────────────────

  _bindSlotEvents(box) {
    box.querySelectorAll('.equip-slot').forEach(el => {
      el.addEventListener('click', e => {
        const slotId = el.dataset.slot;
        if (!slotId) return;

        // 슬롯 메뉴 버튼 처리
        const btn = e.target.closest('[data-action]');
        if (btn) {
          const action = btn.dataset.action;
          if (action === 'unequip') {
            EquipmentSystem.unequip(btn.dataset.slot);
            this._slotMenuId = null;
          } else if (action === 'cancel-menu') {
            this._slotMenuId = null;
          }
          this._render();
          return;
        }

        const meta = SLOT_META[slotId];
        if (meta?.locked) return;

        // 아이템 선택 후 빈 슬롯 클릭 → 장착
        if (this._selectedId) {
          const ok = EquipmentSystem.equip(this._selectedId, slotId);
          if (ok) this._selectedId = null;
          else    this._selectedId = null;
          this._render();
          return;
        }

        // 장착된 슬롯 클릭 → 메뉴 토글
        const equipped = GameState.player.equipped?.[slotId];
        if (equipped) {
          this._slotMenuId = this._slotMenuId === slotId ? null : slotId;
          this._render();
        }
      });
    });
  },

  _bindInvEvents(box) {
    box.querySelectorAll('.equip-inv-row').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.invId;
        const def = GameState.getCardDef(id);
        // 소지품 탭에서 장착 불가 아이템은 선택 무시
        if (def && EquipmentSystem.getSlotsForDef(def).length === 0) return;

        if (this._selectedId === id) {
          this._selectedId = null;
        } else {
          this._selectedId = id;
          this._slotMenuId = null;
        }
        this._render();
      });
    });
  },

  _bindTabEvents(box) {
    box.querySelectorAll('.equip-inv-tab').forEach(el => {
      el.addEventListener('click', () => {
        this._activeTab  = parseInt(el.dataset.tab, 10);
        this._selectedId = null;
        this._render();
      });
    });
  },
};

export default EquipmentModal;
