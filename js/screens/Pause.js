// === PAUSE SCREEN ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine   from '../core/TickEngine.js';
import SaveManager  from '../persistence/SaveManager.js';

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
    this._el.innerHTML = `
      <div class="menu-box" style="align-items:center;gap:16px;">
        <div class="menu-title">일시 정지</div>
        <button class="menu-btn primary" id="btn-resume">계속 (ESC)</button>
        <button class="menu-btn" id="btn-save-pause">저장</button>
        <button class="menu-btn danger" id="btn-quit">메인 메뉴로</button>
      </div>
    `;

    this._el.querySelector('#btn-resume')?.addEventListener('click', () => this._unpause());

    this._el.querySelector('#btn-save-pause')?.addEventListener('click', () => {
      SaveManager.save(0);
    });

    this._el.querySelector('#btn-quit')?.addEventListener('click', () => {
      TickEngine.setPaused(false);
      StateMachine.transition('main_menu');
    });
  },
};

export default Pause;
