// === HEADER BAR ===
// 메인 보드 상단 중앙 HUD 칩. Day | HH:MM | Temp 만 띄운다.
// 띠의 왼쪽은 온보딩 안내 칩, 오른쪽은 알림 패널(#notification-container)이 쓰는 자리라
// 가운데만 점유한다.
//
// 사이드바의 day/time/temp는 그대로 유지 (이중 표시 — 회귀 안전).

import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import WeatherSystem from '../systems/WeatherSystem.js';

// 하루 72 TP · 3 TP = 1시간 (TickEngine의 hour 산식과 같은 분모를 쓴다)
const TP_PER_HOUR   = 3;
const MIN_PER_TP    = 60 / TP_PER_HOUR;

const HeaderBar = {
  _el: null,

  init() {
    // TP 진행 / 일자 변경 / 날씨 변화 시 갱신
    EventBus.on('tpAdvance',   () => this.render());
    EventBus.on('dayChange',   () => this.render());
    EventBus.on('weatherChange', () => this.render());
    EventBus.on('seasonChange',  () => this.render());
    EventBus.on('languageChanged', () => this.render());
    EventBus.on('stateTransition', ({ to }) => {
      // 메인 화면에서만 렌더
      if (to === 'main') this.render();
    });

    this.render();
  },

  render() {
    // Main._buildLayout()이 매번 헤더 노드를 새로 만든다. 참조를 캐시하면
    // 떨어져 나간 노드에 계속 그리게 되어 화면에는 아무것도 안 나온다.
    this._el = document.getElementById('game-header');
    if (!this._el) return;

    const gs = GameState;
    const day = gs.time?.day ?? 1;
    const hour = gs.time?.hour ?? 6;
    const hh = String(hour).padStart(2, '0');
    const mm = String(((gs.time?.tpInDay ?? 0) % TP_PER_HOUR) * MIN_PER_TP).padStart(2, '0');

    // 사이드바 온도(#outdoor-temp)와 같은 계산을 쓴다 — 한 화면에 두 숫자가 갈리면 안 된다
    const temp = WeatherSystem.getOutdoorTemperature();
    const tempClass = temp <= -1 ? 'cold' : temp >= 30 ? 'hot' : 'normal';
    const isNight = hour >= 20 || hour < 6;
    const dayClass = isNight ? 'night' : 'day';

    const timeOfDay = hour >= 5 && hour < 7  ? 'dawn'
                    : hour >= 7 && hour < 17  ? 'day'
                    : hour >= 17 && hour < 20 ? 'dusk'
                    : 'night';
    document.getElementById('screen-main')?.setAttribute('data-time-of-day', timeOfDay);

    this._el.innerHTML = `
      <div class="game-header__inner">
        <div class="game-header__center ${dayClass}">
          <span class="game-header__day">Day ${day}</span>
          <span class="game-header__sep">|</span>
          <span class="game-header__time">${hh}:${mm}</span>
          <span class="game-header__sep">|</span>
          <span class="game-header__temp game-header__temp--${tempClass}">${temp}°C</span>
        </div>
      </div>
    `;
  },
};

export default HeaderBar;
