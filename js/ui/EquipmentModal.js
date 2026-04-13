// === EQUIPMENT MODAL ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';
import I18n            from '../core/I18n.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import StatRenderer    from './StatRenderer.js';

// ── 부상 타입 → 이모지 매핑 ────────────────────────────────────
const INJURY_ICONS = {
  bleeding:   '\uD83E\uDE78',  // 🩸
  fracture:   '\uD83E\uDDB4',  // 🦴
  laceration: '\uD83D\uDD2A',  // 🔪
  concussion: '\uD83D\uDCAB',  // 💫
};

// ── 부위 키 → 다이어그램 위치 메타 ──────────────────────────────
const BODY_PARTS = [
  { key: 'head',     gridArea: 'bp-head'  },
  { key: 'leftArm',  gridArea: 'bp-larm'  },
  { key: 'torso',    gridArea: 'bp-torso' },
  { key: 'rightArm', gridArea: 'bp-rarm'  },
  { key: 'leftLeg',  gridArea: 'bp-lleg'  },
  { key: 'rightLeg', gridArea: 'bp-rleg'  },
];

const SLOT_META = {
  head:        { i18nKey: 'equip.head',       icon: '⛑️',  row: 1 },
  face:        { i18nKey: 'equip.face',       icon: '😷',  row: 2, col: 'left' },
  body:        { i18nKey: 'equip.body',       icon: '🦺',  row: 3 },
  hands:       { i18nKey: 'equip.hands',      icon: '🧤',  row: 4, col: 'left' },
  backpack:    { i18nKey: 'equip.backpack',   icon: '🎒',  row: 4, col: 'right' },
  weapon_main: { i18nKey: 'equip.weaponMain', icon: '⚔️',  row: 5, col: 'left' },
  weapon_sub:  { i18nKey: 'equip.weaponSub',  icon: '🛡️⚔',  row: 5, col: 'right' },
  boots:       { i18nKey: 'equip.boots',      icon: '👟',  row: 6 },
};

/** Get localized label for a slot */
function slotLabel(slotId) {
  const meta = SLOT_META[slotId];
  return meta ? I18n.t(meta.i18nKey) : slotId;
}

const TAB_KEYS = ['equip.tabArmor', 'equip.tabWeapons', 'equip.tabBags', 'equip.tabInventory'];

const EquipmentModal = {
  _initialized:    false,
  _overlay:        null,
  _selectedId:     null,
  _activeTab:      0,
  _activeMainTab:  'status',   // 메인 탭 상태 유지 (status | equip)
  _slotMenuId:     null,
  _bodyDetailPart: null,   // 클릭된 신체 부위 키 (상세 팝업용)

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
    this._bodyDetailPart = null;
    this._render();
    this._overlay?.classList.add('open');
  },

  close() {
    this._overlay?.classList.remove('open');
    this._selectedId = null;
    this._slotMenuId = null;
    this._bodyDetailPart = null;
  },

  // ── 렌더링 ───────────────────────────────────────────

  _render() {
    const box = this._overlay?.querySelector('.equip-modal-box');
    if (!box) return;

    box.innerHTML = `
      <div class="equip-modal-header">
        <span class="equip-modal-title">${I18n.t('equip.title')}</span>
        <div class="equip-header-tabs">
          <button class="equip-tab-btn${this._activeMainTab === 'status' ? ' active' : ''}" data-tab="status">📊 캐릭터 상태</button>
          <button class="equip-tab-btn${this._activeMainTab === 'equip' ? ' active' : ''}" data-tab="equip">⚙️ 장비</button>
        </div>
        <button class="equip-modal-close" id="equip-close-btn">${I18n.t('equip.close')}</button>
      </div>
      <div class="equip-modal-body" id="equip-modal-body" data-active-tab="${this._activeMainTab}">
        <!-- 캐릭터 상태 탭 (기본) -->
        <div class="equip-tab-content" data-tab-content="status" style="display:${this._activeMainTab === 'status' ? '' : 'none'}">
          <div class="char-status-panel">
            <div class="char-status-title">📊 캐릭터 전체 상태</div>
            <div class="char-status-bars stat-bars">
              ${StatRenderer.buildFullStatsHTML()}
            </div>
          </div>
        </div>
        <!-- 장비 탭 -->
        <div class="equip-tab-content equip-tab-3panel" data-tab-content="equip" style="display:${this._activeMainTab === 'equip' ? '' : 'none'};">
          <div class="equip-left-col">
            ${this._renderEffectsPanel()}
            ${this._renderBodyDiagram()}
          </div>
          ${this._renderCharPanel()}
          ${this._renderInvPanel()}
        </div>
      </div>
    `;

    box.querySelector('#equip-close-btn')?.addEventListener('click', () => this.close());

    // 탭 전환
    box.querySelectorAll('.equip-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this._activeMainTab = tab;
        box.querySelectorAll('.equip-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        box.querySelectorAll('.equip-tab-content').forEach(c => {
          c.style.display = c.dataset.tabContent === tab ? '' : 'none';
        });
        if (tab === 'status') {
          box.querySelector('.char-status-bars').innerHTML = StatRenderer.buildFullStatsHTML();
        }
      });
    });

    this._bindSlotEvents(box);
    this._bindInvEvents(box);
    this._bindTabEvents(box);
    this._bindBodyEvents(box);
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
    return `
      <div class="equip-char-panel">
        <div class="equip-char-layout">
          <div class="equip-char-figure">
            <div class="equip-char-silhouette">👤</div>
          </div>
          <div class="equip-char-grid">
            <div class="equip-grid-full">${this._renderSlot('head')}</div>
            ${this._renderSlot('face')}
            ${this._renderSlot('body')}
            ${this._renderSlot('hands')}
            ${this._renderSlot('backpack')}
            ${this._renderSlot('weapon_main')}
            ${this._renderSlot('weapon_sub')}
            <div class="equip-grid-full">${this._renderSlot('boots')}</div>
          </div>
        </div>
      </div>
    `;
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

  // ── 신체 다이어그램 ─────────────────────────────────

  _getBodySystem() {
    return SystemRegistry.get('BodySystem');
  },

  _renderBodyDiagram() {
    const bs = this._getBodySystem();
    if (bs) bs.ensureInitialized();
    const body = GameState.body;
    if (!body) return '';

    const partsHtml = BODY_PARTS.map(({ key, gridArea }) => {
      const part = body[key];
      if (!part) return '';
      const hp = Math.round(part.hp);
      const colorCls = hp > 70 ? 'hp-good' : hp > 40 ? 'hp-warn' : hp > 20 ? 'hp-orange' : 'hp-crit';
      const injuryIcons = part.injuries.map(inj => {
        const icon = INJURY_ICONS[inj.type] ?? '?';
        const dots = '\u2022'.repeat(Math.min(3, Math.max(1, Math.ceil(inj.severity))));
        return `<span class="body-injury-icon" title="${I18n.t('body.injury.' + inj.type)}">${icon}<sub>${dots}</sub></span>`;
      }).join('');
      const isActive = this._bodyDetailPart === key;

      return `
        <div class="body-part ${colorCls}${isActive ? ' active' : ''}" style="grid-area:${gridArea}" data-bodypart="${key}">
          <div class="body-part-name">${I18n.t('body.' + key)}</div>
          <div class="body-part-hp">${hp}%</div>
          ${injuryIcons ? `<div class="body-part-injuries">${injuryIcons}</div>` : ''}
        </div>`;
    }).join('');

    // 신체 효과 요약
    const effects = bs ? bs.getEffects() : null;
    const effectRows = this._buildBodyEffectRows(effects);

    // 상세 팝업
    const detailHtml = this._bodyDetailPart ? this._renderBodyDetail(this._bodyDetailPart) : '';

    return `
      <div class="body-diagram-section">
        <div class="body-diagram-title">${I18n.t('body.statusTitle')}</div>
        <div class="body-diagram-grid">
          ${partsHtml}
        </div>
        ${effectRows}
        ${detailHtml}
      </div>
    `;
  },

  _buildBodyEffectRows(effects) {
    if (!effects) return '';
    const rows = [];
    if (effects.accuracyPenalty > 0) {
      rows.push({ label: I18n.t('body.effectAccuracy', { val: `-${Math.round(effects.accuracyPenalty * 100)}` }), cls: 'warn' });
    }
    if (effects.fatigueMult > 1.0) {
      rows.push({ label: I18n.t('body.effectFatigue', { val: effects.fatigueMult.toFixed(1) }), cls: 'warn' });
    }
    if (effects.carryPenalty > 0) {
      rows.push({ label: I18n.t('body.effectCarry', { val: `-${Math.round(effects.carryPenalty * 100)}` }), cls: 'warn' });
    }
    if (effects.damagePenalty > 0) {
      rows.push({ label: I18n.t('body.effectDamage', { val: `-${Math.round(effects.damagePenalty * 100)}` }), cls: 'warn' });
    }
    if (effects.moveTpExtra > 0) {
      rows.push({ label: I18n.t('body.effectMove', { val: effects.moveTpExtra }), cls: 'warn' });
    }
    if (effects.fleePenalty > 0) {
      rows.push({ label: I18n.t('body.effectFlee', { val: `-${Math.round(effects.fleePenalty * 100)}` }), cls: 'warn' });
    }

    if (rows.length === 0) return '';

    return `
      <div class="body-effects-list">
        ${rows.map(r => `<div class="body-effect-row ${r.cls}">${r.label}</div>`).join('')}
      </div>`;
  },

  _renderBodyDetail(partKey) {
    const part = GameState.body?.[partKey];
    if (!part) return '';

    const isDoctor = GameState.player.characterId === 'doctor';
    const partName = I18n.t('body.' + partKey);
    const hp = Math.round(part.hp);

    let injuriesHtml = '';
    if (part.injuries.length === 0) {
      injuriesHtml = `<div class="body-detail-normal">${I18n.t('body.noInjury')}</div>`;
    } else {
      const medicineLv = GameState.player.skills?.medicine?.level ?? 0;
      injuriesHtml = part.injuries.map((inj, idx) => {
        const icon = INJURY_ICONS[inj.type] ?? '?';
        const sevCeil = Math.min(3, Math.max(1, Math.ceil(inj.severity)));
        const sevKey = `body.severity${sevCeil}`;
        const typeName = I18n.t('body.injury.' + inj.type);
        const sevName = I18n.t(sevKey);
        const tpLeft = I18n.t('body.tpRemaining', { tp: inj.tpRemaining });
        const requiredLv = sevCeil >= 3 ? 5 : 3;
        const canTreat = isDoctor && medicineLv >= requiredLv;
        return `
          <div class="body-detail-injury">
            <span class="body-detail-icon">${icon}</span>
            <span class="body-detail-info">
              <span class="body-detail-type">${typeName} (${sevName})</span>
              <span class="body-detail-tp">${tpLeft}</span>
            </span>
            ${canTreat ? `<button class="body-detail-treat" data-treat-part="${partKey}" data-treat-idx="${idx}">${I18n.t('body.doctorHeal')}</button>` : ''}
          </div>`;
      }).join('');
    }

    return `
      <div class="body-detail-popup">
        <div class="body-detail-header">${partName} — ${I18n.t('body.hpLabel', { current: hp })}</div>
        ${injuriesHtml}
      </div>`;
  },

  _bindBodyEvents(box) {
    box.querySelectorAll('.body-part').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.bodypart;
        this._bodyDetailPart = this._bodyDetailPart === key ? null : key;
        this._render();
      });
    });

    // 치료 버튼 클릭 → BodySystem.treatInjury
    box.querySelectorAll('[data-treat-part]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const bs = this._getBodySystem();
        if (!bs) return;
        const partKey = btn.dataset.treatPart;
        const idx = parseInt(btn.dataset.treatIdx, 10);
        bs.treatInjury(partKey, idx);
        this._render();
      });
    });
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
