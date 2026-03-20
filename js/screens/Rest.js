// === REST SCREEN ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import I18n        from '../core/I18n.js';
import TickEngine   from '../core/TickEngine.js';

const REST_OPTIONS = [
  {
    id: 'nap',
    icon: '😴',
    tpCost: 4,
    effect: { fatigue: -40, stamina: 30, hp: 10 },
  },
  {
    id: 'sleep',
    icon: '🛌',
    tpCost: 8,
    effect: { fatigue: -80, stamina: 70, hp: 30, hydration: -20, nutrition: -10 },
  },
  {
    id: 'meditate',
    icon: '🧘',
    tpCost: 2,
    effect: { morale: 20, fatigue: -10, stamina: 15 },
  },
];

const Rest = {
  _el: null,

  init() {
    this._el = document.getElementById('screen-rest');
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'rest') this._render(data);
    });
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
    });
  },

  _render(data = {}) {
    if (!this._el) return;

    const forced = data?.forced;

    const optHtml = REST_OPTIONS.map(opt => `
      <div class="rest-option-card" data-rest-id="${opt.id}">
        <div class="rest-option-icon">${opt.icon}</div>
        <div class="rest-option-name">${I18n.t('rest.' + opt.id)}</div>
        <div class="rest-option-cost">${I18n.t('rest.' + opt.id + 'Cost')}</div>
        <div class="rest-option-desc">${I18n.t('rest.' + opt.id + 'Desc')}</div>
      </div>
    `).join('');

    this._el.innerHTML = `
      <div class="rest-header">${I18n.t('rest.title')}</div>
      ${forced ? `<div style="color:var(--text-danger);font-size:12px;">${I18n.t('rest.forced')}</div>` : ''}
      <div class="rest-options">${optHtml}</div>
      <button class="toolbar-btn" id="btn-skip-rest">${I18n.t('rest.cancel')}</button>
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
    TickEngine.skipTP(opt.tpCost, I18n.t('rest.' + opt.id));

    // Apply effects
    for (const [key, val] of Object.entries(opt.effect)) {
      if (key === 'hp') {
        gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + val);
      } else {
        gs.modStat(key, val);
      }
    }

    EventBus.emit('notify', { message: I18n.t('rest.complete', { name: I18n.t('rest.' + opt.id) }), type: 'good' });
    StateMachine.transition('basecamp');
  },
};

export default Rest;
