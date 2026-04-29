// === MAIN MENU SCREEN ===
import EventBus      from '../core/EventBus.js';
import StateMachine  from '../core/StateMachine.js';
import SaveManager   from '../persistence/SaveManager.js';
import I18n          from '../core/I18n.js';
import SettingsModal from '../ui/SettingsModal.js';

const SLOT_COUNT = 6;

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

    const hasAnySave = this._anyOccupiedSlot();
    const continueAttrs = hasAnySave
      ? ''
      : `disabled aria-disabled="true" title="${t('menu.noSavesHint')}"`;

    this._el.innerHTML = `
      <div class="main-menu-stack">
        <button class="menu-img-btn menu-img-btn--new-game" id="mm-btn-new" aria-label="${t('menu.newGame')}">
          <span class="visually-hidden">${t('menu.newGame')}</span>
        </button>
        <button class="menu-img-btn menu-img-btn--continue ${hasAnySave ? '' : 'is-disabled'}"
                id="mm-btn-continue" aria-label="${t('menu.continue')}" ${continueAttrs}>
          <span class="visually-hidden">${t('menu.continue')}</span>
        </button>
        <button class="menu-img-btn menu-img-btn--gallery" id="mm-btn-gallery" aria-label="${t('menu.gallery')}">
          <span class="visually-hidden">${t('menu.gallery')}</span>
        </button>
        <button class="menu-img-btn menu-img-btn--settings" id="mm-btn-settings" aria-label="${t('menu.settings')}">
          <span class="visually-hidden">${t('menu.settings')}</span>
        </button>
      </div>

      <div class="main-menu-version">v0.2 prototype</div>
    `;

    this._bindEvents();
  },

  _anyOccupiedSlot() {
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (SaveManager.hasSave(i)) return true;
    }
    return false;
  },

  _bindEvents() {
    document.getElementById('mm-btn-new')?.addEventListener('click', () => {
      StateMachine.transition('slot_select', { mode: 'new' });
    });

    const continueBtn = document.getElementById('mm-btn-continue');
    if (continueBtn && !continueBtn.disabled) {
      continueBtn.addEventListener('click', () => {
        StateMachine.transition('slot_select', { mode: 'continue' });
      });
    }

    document.getElementById('mm-btn-gallery')?.addEventListener('click', () => {
      StateMachine.transition('ending_gallery');
    });

    document.getElementById('mm-btn-settings')?.addEventListener('click', () => {
      SettingsModal.open();
    });
  },
};

export default MainMenu;
