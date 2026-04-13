// === MAIN MENU SCREEN ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import StateMachine  from '../core/StateMachine.js';
import SaveManager   from '../persistence/SaveManager.js';
import EndingSystem  from '../systems/EndingSystem.js';
import I18n          from '../core/I18n.js';
import SettingsModal from '../ui/SettingsModal.js';

const SLOT_COUNT = 3;

const MainMenu = {
  _el: null,

  init() {
    this._el = document.getElementById('screen-main-menu');
    this._render();
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'main_menu') this._render();
    });
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
    });
  },

  _render() {
    if (!this._el) return;
    const t = k => I18n.t(k);

    const slotsHtml   = Array.from({ length: SLOT_COUNT }, (_, i) => this._buildSlotCard(i)).join('');
    const unlocked    = EndingSystem.getUnlocked().length;
    const totalEndings = 24;
    const pct         = Math.round((unlocked / totalEndings) * 100);

    this._el.innerHTML = `
      <div style="text-align:center;margin-bottom:28px;">
        <div class="main-menu-title-big">RUINED CITY</div>
        <div class="main-menu-subtitle">CARD SURVIVAL · 2099</div>
      </div>

      <div class="save-slots-grid">${slotsHtml}</div>

      <div class="mm-gallery-row">
        <button class="mm-gallery-btn" id="mm-gallery-btn">
          <span class="mm-gallery-icon">📖</span>
          <span class="mm-gallery-label">${t('menu.gallery')}</span>
          <span class="mm-gallery-count">${unlocked} / ${totalEndings}</span>
          <div class="mm-gallery-bar">
            <div class="mm-gallery-fill" style="width:${pct}%"></div>
          </div>
        </button>
      </div>

      <div class="mm-settings-row">
        <button class="mm-settings-btn" id="mm-settings-btn">
          <span class="mm-settings-icon">⚙️</span>
          <span>${t('menu.settings')}</span>
        </button>
      </div>

      <div class="main-menu-version">v0.2 prototype</div>
    `;

    this._bindSlotEvents();
  },

  _buildSlotCard(slot) {
    const t    = k => I18n.t(k);
    const meta = SaveManager.getMeta(slot);
    if (meta) {
      const saved   = this._relativeTime(meta.savedAt);
      const dayStr  = `Day ${meta.day}`;
      const nameStr = meta.playerName ?? 'Survivor';
      const isDead  = !!meta.isDead;
      const icon    = isDead ? '💀' : '🧍';
      const loadBtn = isDead
        ? `<button class="menu-btn save-slot-load disabled" data-slot="${slot}" disabled title="${t('menu.deadTooltip')}">${t('menu.continueBlock')}</button>`
        : `<button class="menu-btn primary save-slot-load" data-slot="${slot}">${t('menu.continue')}</button>`;
      return `
        <div class="save-slot-card occupied${isDead ? ' is-dead' : ''}" data-slot="${slot}">
          <div class="save-slot-header">
            <span class="save-slot-num">${t('menu.slot')} ${slot + 1}</span>
            <button class="save-slot-delete" data-slot="${slot}" title="${t('menu.delete')}">✕</button>
          </div>
          <div class="save-slot-icon">${icon}</div>
          <div class="save-slot-name">${nameStr}</div>
          <div class="save-slot-day">${dayStr}${isDead ? ` — ${t('menu.dead')}` : ''}</div>
          <div class="save-slot-time">${saved}</div>
          ${loadBtn}
        </div>
      `;
    } else {
      return `
        <div class="save-slot-card empty" data-slot="${slot}">
          <div class="save-slot-header">
            <span class="save-slot-num">${t('menu.slot')} ${slot + 1}</span>
          </div>
          <div class="save-slot-icon">➕</div>
          <div class="save-slot-name" style="color:var(--text-dim);">${t('menu.emptySlot')}</div>
          <div class="save-slot-day" style="color:var(--text-dim);">—</div>
          <div class="save-slot-time"></div>
          <button class="menu-btn save-slot-new" data-slot="${slot}">${t('menu.newGame')}</button>
        </div>
      `;
    }
  },

  _bindSlotEvents() {
    const t = k => I18n.t(k);

    // 엔딩 갤러리 버튼
    document.getElementById('mm-gallery-btn')?.addEventListener('click', () => {
      StateMachine.transition('ending_gallery');
    });

    // 설정 버튼
    document.getElementById('mm-settings-btn')?.addEventListener('click', () => {
      SettingsModal.open();
    });

    // 이어하기
    this._el.querySelectorAll('.save-slot-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot, 10);
        if (SaveManager.load(slot)) {
          GameState.ui.saveSlot = slot;
          GameState.ui.currentState = 'main_menu';
          StateMachine.transition('main');
        }
      });
    });

    // 새 게임
    this._el.querySelectorAll('.save-slot-new').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot, 10);
        GameState.ui.saveSlot = slot;
        StateMachine.transition('char_create');
      });
    });

    // 삭제
    this._el.querySelectorAll('.save-slot-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = parseInt(btn.dataset.slot, 10);
        const msg = `${t('menu.slot')} ${slot + 1}${t('menu.deleteConfirm')}`;
        if (confirm(msg)) {
          SaveManager.deleteSave(slot);
          this._render();
        }
      });
    });
  },

  _relativeTime(isoStr) {
    if (!isoStr) return '';
    const t    = k => I18n.t(k);
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days  > 0)  return `${days}${t('time.daysAgo')}`;
    if (hours > 0)  return `${hours}${t('time.hoursAgo')}`;
    if (mins  > 0)  return `${mins}${t('time.minsAgo')}`;
    return t('time.justNow');
  },
};

export default MainMenu;
