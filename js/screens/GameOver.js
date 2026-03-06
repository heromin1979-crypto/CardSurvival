// === GAME OVER SCREEN ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine   from '../core/TickEngine.js';

const GameOver = {
  _el: null,

  init() {
    this._el = document.getElementById('screen-game-over');
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'game_over') {
        TickEngine.stop();
        this._render(data);
      }
    });
  },

  _render(data = {}) {
    if (!this._el) return;
    const gs    = GameState;
    const cause = data.cause ?? gs.player.deathCause ?? '알 수 없음';

    this._el.innerHTML = `
      <div class="game-over-title">DEAD</div>
      <div class="game-over-cause">
        사망 원인: <strong>${cause}</strong><br>
        ${gs.player.name} — Day ${gs.time.day}
      </div>
      <div class="game-over-stats">
        <div class="mini-stat"><span>생존 일수</span><span class="mini-stat-val">${gs.time.day}</span></div>
        <div class="mini-stat"><span>총 TP</span><span class="mini-stat-val">${Math.floor(gs.time.totalTP)}</span></div>
        <div class="mini-stat"><span>방문 장소</span><span class="mini-stat-val">${gs.location.nodesVisited.length}</span></div>
      </div>
      <div style="margin-top:32px;display:flex;gap:12px;">
        <button class="menu-btn primary" id="btn-restart">다시 시작</button>
      </div>
    `;

    this._el.querySelector('#btn-restart')?.addEventListener('click', () => {
      TickEngine.start();
      StateMachine.transition('main_menu');
    });
  },
};

export default GameOver;
