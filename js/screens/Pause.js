// === PAUSE SCREEN ===
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine   from '../core/TickEngine.js';
import SaveManager  from '../persistence/SaveManager.js';
import I18n         from '../core/I18n.js';
import SettingsModal from '../ui/SettingsModal.js';

const Pause = {
  _el: null,

  init() {
    this._el = document.getElementById('screen-pause');

    // ESC toggles pause from any game state
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (GameState.ui.currentState === 'pause') {
        this._unpause();
      } else if (['basecamp','explore','rest'].includes(GameState.ui.currentState)) {
        this._pause();
      }
    });

    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'pause') this._render();
    });

    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
    });
  },

  _pause() {
    TickEngine.setPaused(true);
    StateMachine.transition('pause');
  },

  _unpause() {
    TickEngine.setPaused(false);
    StateMachine.unpause();
  },

  _render() {
    if (!this._el) return;
    const t = k => I18n.t(k);
    this._el.innerHTML = `
      <div class="menu-box" style="align-items:center;gap:16px;">
        <div class="menu-title">${t('pause.title')}</div>
        <button class="menu-btn primary" id="btn-resume">${t('pause.resume')}</button>
        <button class="menu-btn" id="btn-save-pause">${t('pause.save')}</button>
        <button class="menu-btn" id="btn-pause-settings">⚙️ ${t('pause.settings')}</button>
        <button class="menu-btn danger" id="btn-quit">${t('pause.quit')}</button>
      </div>
    `;

    this._el.querySelector('#btn-resume')?.addEventListener('click', () => this._unpause());

    this._el.querySelector('#btn-save-pause')?.addEventListener('click', () => {
      SaveManager.save(0);
    });

    this._el.querySelector('#btn-pause-settings')?.addEventListener('click', () => {
      SettingsModal.open();
    });

    this._el.querySelector('#btn-quit')?.addEventListener('click', () => {
      TickEngine.setPaused(false);
      StateMachine.transition('main_menu');
    });
  },
};

export default Pause;
