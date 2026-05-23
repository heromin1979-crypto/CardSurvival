// === REST SCREEN ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import I18n        from '../core/I18n.js';
import TickEngine   from '../core/TickEngine.js';
import NightSystem  from '../systems/NightSystem.js';
import MentalSystem from '../systems/MentalSystem.js';
import SeasonSystem from '../systems/SeasonSystem.js';
import BALANCE      from '../data/gameBalance.js';

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
    effect: { fatigue: -80, stamina: 70, hp: 30 },
  },
  {
    id: 'meditate',
    icon: '🧘',
    tpCost: 2,
    effect: { morale: 20, fatigue: -10, stamina: 15 },
  },
];

// TP 소모로 발생하는 자연 감소량(수분·영양) 표시용 문자열.
// 수분은 계절 배율(SeasonSystem)을 반영하므로 렌더 시점에 계산한다.
function naturalDecayText(tpCost) {
  const seasonMod = SeasonSystem.getModifiers();
  const hydration = Math.round(tpCost * BALANCE.stats.hydrationDecayPerTP * (seasonMod.hydrationDecayMult ?? 1.0));
  const nutrition = Math.round(tpCost * BALANCE.stats.nutritionDecayPerTP);
  return `${I18n.t('stat.hydration')} -${hydration}, ${I18n.t('stat.nutrition')} -${nutrition}`;
}

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
        <div class="rest-option-name">${I18n.t('rest.' + opt.id)}</div>
        <div class="rest-option-cost">${I18n.t('rest.' + opt.id + 'Cost')}</div>
        <div class="rest-option-desc">${I18n.t('rest.' + opt.id + 'Desc')}, ${naturalDecayText(opt.tpCost)}</div>
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
      StateMachine.transition('main');
    });
  },

  _doRest(opt) {
    const gs = GameState;

    // Skip TP for rest duration
    TickEngine.skipTP(opt.tpCost, I18n.t('rest.' + opt.id));

    // ── 수면 품질 판정 ──────────────────────────────────────
    const sleepQ = NightSystem.getSleepQuality();

    // Apply effects (fatigue 회복에 수면 품질 반영)
    for (const [key, val] of Object.entries(opt.effect)) {
      if (key === 'hp') {
        gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + val);
      } else if (key === 'fatigue') {
        // 음수(회복)일 때만 품질 배율 적용
        const adjusted = val < 0 ? Math.round(val * sleepQ.fatigueMult) : val;
        gs.modStat(key, adjusted);
      } else {
        gs.modStat(key, val);
      }
    }

    // ── 수면 품질별 추가 효과 ────────────────────────────────
    if (sleepQ.quality === 'dark') {
      // 어둠 수면: 불안 증가 + 악몽 확률 상승
      if (gs.mental) MentalSystem.modifyAnxiety(sleepQ.anxietyDelta);
      // 악몽 추가 확률 (트라우마 기반 nightmareChance에 보너스)
      if (Math.random() < sleepQ.nightmareBonus) {
        gs.modStat('fatigue', 3);
        if (gs.mental) MentalSystem.modifyAnxiety(5);
        EventBus.emit('notify', { message: I18n.t('night.darkNightmare'), type: 'danger' });
      }
      EventBus.emit('notify', { message: I18n.t('night.darkSleep'), type: 'warn' });
    } else if (sleepQ.quality === 'lit') {
      // 광원 수면: 불안 감소
      if (gs.mental) MentalSystem.modifyAnxiety(sleepQ.anxietyDelta);
      EventBus.emit('notify', { message: I18n.t('night.litSleep'), type: 'good' });
    }

    EventBus.emit('notify', { message: I18n.t('rest.complete', { name: I18n.t('rest.' + opt.id) }), type: 'good' });
    StateMachine.transition('main');
  },
};

export default Rest;
