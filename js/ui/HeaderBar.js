// === HEADER BAR ===
// 메인 보드 상단 거대 헤더. Day | HH:MM | Temp 중앙 표시 + 우측 계절/날씨.
// 트랙 C (AD_GUIDE_UI_REVAMP.md). screen-main grid의 첫 행에 위치.
//
// 사이드바의 day/time/temp는 그대로 유지 (이중 표시 — 회귀 안전).
// 다음 트랙(D-2 사이드바 콕핏)에서 정리 예정.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';

const HeaderBar = {
  _el: null,

  init() {
    this._el = document.getElementById('game-header');
    if (!this._el) return;

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
    if (!this._el) return;
    const gs = GameState;
    const day = gs.time?.day ?? 1;
    const hour = gs.time?.hour ?? 6;
    const minute = Math.floor((gs.time?.tpInDay ?? 0) * (60 / 18));  // 1 tpInDay 단위 = 60/18분 (대략 — 게임 내 tp 비율 따름)
    const hh = String(hour).padStart(2, '0');
    const mm = String(Math.min(59, minute)).padStart(2, '0');

    const temp = Math.round(gs.weather?.temp ?? gs.stats?.temperature?.outdoor ?? 0);
    const tempClass = temp <= -1 ? 'cold' : temp >= 30 ? 'hot' : 'normal';
    const isNight = hour >= 20 || hour < 6;
    const dayClass = isNight ? 'night' : 'day';

    const seasonId = gs.season?.current ?? 'spring';
    const seasonIcons = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
    const seasonLabels = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
    const seasonIcon = seasonIcons[seasonId] ?? '🌸';
    const seasonLabel = seasonLabels[seasonId] ?? '봄';

    const weatherId = gs.weather?.id ?? 'sunny';
    const weatherIcons = { sunny: '☀️', cloudy: '☁️', rain: '🌧', snow: '🌨', storm: '⛈', heatwave: '🥵', coldwave: '🥶' };
    const weatherIcon = weatherIcons[weatherId] ?? '☀️';

    this._el.innerHTML = `
      <div class="game-header__inner">
        <div class="game-header__center ${dayClass}">
          <span class="game-header__day">Day ${day}</span>
          <span class="game-header__sep">|</span>
          <span class="game-header__time">${hh}:${mm}</span>
          <span class="game-header__sep">|</span>
          <span class="game-header__temp game-header__temp--${tempClass}">${temp}°C</span>
        </div>
        <div class="game-header__right">
          <span class="game-header__season" title="${seasonLabel}">${seasonIcon}</span>
          <span class="game-header__weather" title="${weatherId}">${weatherIcon}</span>
        </div>
      </div>
    `;
  },
};

export default HeaderBar;
