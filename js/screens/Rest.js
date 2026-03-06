// === REST SCREEN ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine   from '../core/TickEngine.js';

const REST_OPTIONS = [
  {
    id: 'nap',
    icon: '😴',
    name: '짧은 수면',
    cost: '4 TP',
    tpCost: 4,
    desc: '피로 -40, 소량 HP 회복',
    effect: { fatigue: -40, hp: 10 },
  },
  {
    id: 'sleep',
    icon: '🛌',
    name: '완전 수면',
    cost: '8 TP',
    tpCost: 8,
    desc: '피로 초기화, HP 30 회복',
    effect: { fatigue: -80, hp: 30, hydration: -20, nutrition: -10 },
  },
  {
    id: 'meditate',
    icon: '🧘',
    name: '명상',
    cost: '2 TP',
    tpCost: 2,
    desc: '사기 +20, 피로 -10',
    effect: { morale: 20, fatigue: -10 },
  },
];

const Rest = {
  _el: null,

  init() {
    this._el = document.getElementById('screen-rest');
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'rest') this._render(data);
    });
  },

  _render(data = {}) {
    if (!this._el) return;

    const forced = data?.forced;

    const optHtml = REST_OPTIONS.map(opt => `
      <div class="rest-option-card" data-rest-id="${opt.id}">
        <div class="rest-option-icon">${opt.icon}</div>
        <div class="rest-option-name">${opt.name}</div>
        <div class="rest-option-cost">${opt.cost}</div>
        <div class="rest-option-desc">${opt.desc}</div>
      </div>
    `).join('');

    this._el.innerHTML = `
      <div class="rest-header">💤 휴식</div>
      ${forced ? '<div style="color:var(--text-danger);font-size:12px;">극도의 피로! 즉시 휴식 필요.</div>' : ''}
      <div class="rest-options">${optHtml}</div>
      <button class="toolbar-btn" id="btn-skip-rest">← 취소</button>
    `;

    this._el.querySelectorAll('.rest-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const opt = REST_OPTIONS.find(o => o.id === card.dataset.restId);
        if (opt) this._doRest(opt);
      });
    });

    this._el.querySelector('#btn-skip-rest')?.addEventListener('click', () => {
      StateMachine.transition('basecamp');
    });
  },

  _doRest(opt) {
    const gs = GameState;

    // Skip TP for rest duration
    TickEngine.skipTP(opt.tpCost, opt.name);

    // Apply effects
    for (const [key, val] of Object.entries(opt.effect)) {
      if (key === 'hp') {
        gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + val);
      } else {
        gs.modStat(key, val);
      }
    }

    EventBus.emit('notify', { message: `${opt.name} 완료. 몸 상태가 나아졌다.`, type: 'good' });
    StateMachine.transition('basecamp');
  },
};

export default Rest;
