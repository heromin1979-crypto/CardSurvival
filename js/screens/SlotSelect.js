// === SLOT SELECT SCREEN — new game / continue ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import StateMachine  from '../core/StateMachine.js';
import SaveManager   from '../persistence/SaveManager.js';
import I18n          from '../core/I18n.js';
import { CHARACTERS }  from '../data/characters.js';
import { DISTRICTS }   from '../data/districts.js';

const SLOT_COUNT = 6;

const SlotSelect = {
  _el: null,
  _mode: 'continue',
  _selectedSlot: null,

  init() {
    this._el = document.getElementById('screen-slot-select');
    if (!this._el) return;

    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'slot_select') {
        this._mode = (data?.mode === 'new') ? 'new' : 'continue';
        this._selectedSlot = null;
        this._render();
      }
    });

    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
    });
  },

  _render() {
    if (!this._el) return;
    const t = k => I18n.t(k);

    const slotsHtml = Array.from({ length: SLOT_COUNT }, (_, i) => this._buildSlotCard(i)).join('');

    this._el.innerHTML = `
      <div class="slot-select-frame">
        <div class="slot-select-grid">${slotsHtml}</div>

        <footer class="slot-select-footer">
          <div class="slot-footer-center">
            <button class="slot-img-btn slot-img-btn--load" id="ss-btn-primary">
              <span class="visually-hidden">${t('slotSelect.btnLoad')}</span>
            </button>
            <button class="slot-img-btn slot-img-btn--delete" id="ss-btn-delete">
              <span class="visually-hidden">${t('slotSelect.btnDelete')}</span>
            </button>
          </div>
          <button class="slot-img-btn slot-img-btn--back" id="ss-btn-back">
            <span class="visually-hidden">${t('slotSelect.btnBack')}</span>
          </button>
        </footer>
      </div>
    `;

    this._bindEvents();
  },

  _buildSlotCard(slot) {
    const t    = k => I18n.t(k);
    const meta = SaveManager.getMeta(slot);
    const isSelected = this._selectedSlot === slot;

    if (!meta) {
      return `
        <div class="slot-card empty ${isSelected ? 'selected' : ''}" data-slot="${slot}">
          <div class="slot-card-empty-content">
            <span class="slot-card-empty-icon">+</span>
            <span class="slot-card-empty-label">${t('menu.slot')} ${slot + 1}</span>
          </div>
        </div>
      `;
    }

    const isDead = !!meta.isDead;
    const char   = CHARACTERS.find(c => c.id === meta.characterId);
    const charName = char ? I18n.characterName(char.id, char.name) : (meta.playerName ?? '—');

    const districtInfo = DISTRICTS[meta.district];
    const districtLabel = districtInfo
      ? I18n.districtName(meta.district, districtInfo.name)
      : t('slotSelect.locationUnknown');

    const lmSrc = meta.district ? `assets/images/landmarks/lm_${meta.district}.png` : null;
    const thumbHtml = lmSrc
      ? `<img class="slot-card-lm-img" src="${lmSrc}" alt="" onerror="this.style.display='none'">`
      : `<div class="slot-card-lm-fallback">${districtInfo?.icon ?? '📍'}</div>`;

    const dayText = I18n.t('slotSelect.dayLabel', { n: meta.day ?? 1 });

    const savedAt = meta.savedAt ? new Date(meta.savedAt) : null;
    const timeStr = savedAt
      ? `${savedAt.getFullYear()}.${String(savedAt.getMonth() + 1).padStart(2, '0')}.${String(savedAt.getDate()).padStart(2, '0')} ${String(savedAt.getHours()).padStart(2, '0')}:${String(savedAt.getMinutes()).padStart(2, '0')}`
      : '—';

    const deadFlag = isDead ? `<span class="slot-card-dead-flag">${t('menu.dead')}</span>` : '';

    return `
      <div class="slot-card occupied ${isSelected ? 'selected' : ''} ${isDead ? 'is-dead' : ''}" data-slot="${slot}">
        <div class="slot-card-lm">${thumbHtml}</div>
        <div class="slot-card-info">
          <div class="slot-info-day">${dayText}${deadFlag}</div>
          <div class="slot-info-loc">${districtInfo?.icon ?? '📍'} ${districtLabel}</div>
          <div class="slot-info-char">${charName}</div>
          <div class="slot-info-time">${timeStr}</div>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    this._el.querySelectorAll('.slot-card').forEach(card => {
      card.addEventListener('click', () => {
        const slot = parseInt(card.dataset.slot, 10);
        this._selectedSlot = slot;
        this._render();
      });
    });

    document.getElementById('ss-btn-back')?.addEventListener('click', () => {
      StateMachine.transition('main_menu');
    });

    document.getElementById('ss-btn-delete')?.addEventListener('click', () => {
      this._handleDelete();
    });

    document.getElementById('ss-btn-primary')?.addEventListener('click', () => {
      this._handlePrimary();
    });
  },

  _handleDelete() {
    const t = k => I18n.t(k);
    const slot = this._selectedSlot;
    if (slot === null) {
      EventBus.emit('notify', { message: t('slotSelect.selectFirst'), type: 'warn' });
      return;
    }
    const meta = SaveManager.getMeta(slot);
    if (!meta) {
      EventBus.emit('notify', { message: t('slotSelect.selectFirst'), type: 'warn' });
      return;
    }
    const msg = I18n.t('menu.deleteConfirm', { slot: `${t('menu.slot')} ${slot + 1}` });
    if (confirm(msg)) {
      SaveManager.deleteSave(slot);
      this._selectedSlot = null;
      this._render();
    }
  },

  _handlePrimary() {
    const t = k => I18n.t(k);
    const slot = this._selectedSlot;
    if (slot === null) {
      EventBus.emit('notify', { message: t('slotSelect.selectFirst'), type: 'warn' });
      return;
    }

    const meta = SaveManager.getMeta(slot);

    if (this._mode === 'new') {
      if (meta && !confirm(t('slotSelect.confirmOverwrite'))) return;
      GameState.ui.saveSlot = slot;
      StateMachine.transition('char_create');
      return;
    }

    if (!meta) {
      EventBus.emit('notify', { message: t('slotSelect.selectFirst'), type: 'warn' });
      return;
    }
    if (meta.isDead) {
      EventBus.emit('notify', { message: t('slotSelect.cannotLoadDead'), type: 'warn' });
      return;
    }
    if (SaveManager.load(slot)) {
      GameState.ui.saveSlot = slot;
      GameState.ui.currentState = 'slot_select';
      StateMachine.transition('main');
    }
  },
};

export default SlotSelect;
