// === WEATHER SYSTEM ===
// 계절별 날씨 생성 — 1~3일마다 변경
// 날씨 효과는 경미한 수준 (병균 위험, 체온 미세 조정 등)

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

// ── 계절별 날씨 테이블 ─────────────────────────────────────────

const WEATHER_TABLES = {
  spring: [
    { id: 'sunny',   name: '맑음',   icon: '☀️',  weight: 30, tempMod: 0 },
    { id: 'cloudy',  name: '흐림',   icon: '🌤',  weight: 25, tempMod: 0 },
    { id: 'rainy',   name: '비',     icon: '🌧',  weight: 30, tempMod: -0.1, contaminateRisk: 0.004 },
    { id: 'foggy',   name: '안개',   icon: '🌫',  weight: 15, tempMod: 0 },
  ],
  summer: [
    { id: 'hot',     name: '폭염',   icon: '🌡',  weight: 35, tempMod: 0.4 },
    { id: 'sunny',   name: '맑음',   icon: '☀️',  weight: 20, tempMod: 0.2 },
    { id: 'storm',   name: '폭풍',   icon: '🌩',  weight: 20, tempMod: -0.2, encounterReduce: 0.20 },
    { id: 'monsoon', name: '장마',   icon: '🌊',  weight: 25, tempMod: -0.1, contaminateRisk: 0.008 },
  ],
  autumn: [
    { id: 'sunny',   name: '맑음',   icon: '☀️',  weight: 30, tempMod: 0 },
    { id: 'windy',   name: '바람',   icon: '🍃',  weight: 25, tempMod: -0.2 },
    { id: 'cloudy',  name: '흐림',   icon: '⛅',  weight: 30, tempMod: -0.1 },
    { id: 'foggy',   name: '안개',   icon: '🌫',  weight: 15, tempMod: 0 },
  ],
  winter: [
    { id: 'clear',   name: '맑고 추움', icon: '❄️', weight: 25, tempMod: -0.3 },
    { id: 'snow',    name: '눈',        icon: '🌨', weight: 35, tempMod: -0.4 },
    { id: 'blizzard',name: '폭설',      icon: '⛄', weight: 20, tempMod: -0.6, encounterReduce: 0.30 },
    { id: 'overcast',name: '흐림',      icon: '☁️', weight: 20, tempMod: -0.2 },
  ],
};

// ── 서울 계절별 일평균 기온 ─────────────────────────────────────
// 실제 서울 기후 기반: 봄13°C / 여름27°C / 가을14°C / 겨울1°C

const SEASON_BASE_TEMP = {
  spring: 13,
  summer: 27,
  autumn: 14,
  winter:  1,
};

// 날씨별 기온 보정 (°C)
const WEATHER_TEMP_ADJ = {
  hot:      +8,
  sunny:    +2,
  clear:     0,
  cloudy:   -1,
  overcast: -1,
  rainy:    -3,
  monsoon:  -2,
  storm:    -5,
  foggy:    -1,
  windy:    -3,
  snow:     -5,
  blizzard: -10,
};

// ── WeatherSystem ──────────────────────────────────────────────

const WeatherSystem = {
  _tpUntilChange: 0,

  init() {
    EventBus.on('tpAdvance', () => this._onTP());
  },

  // 현재 날씨 반환
  getCurrent() {
    const gs = GameState;
    if (!gs.weather || !gs.weather.id) this._initWeather(gs);
    return gs.weather;
  },

  // ── 내부 ─────────────────────────────────────────────────────

  _onTP() {
    const gs = GameState;
    if (!gs.weather || !gs.weather.id) this._initWeather(gs);

    // 체온에 날씨 영향 적용 (미세 조정 — 계절 효과와 별도)
    const weather = gs.weather;
    if (weather.tempMod && weather.tempMod !== 0) {
      gs.modStat('temperature', weather.tempMod);
    }

    // 비/장마: 보드의 식량 오염 미세 위험
    if (weather.contaminateRisk > 0 && Math.random() < weather.contaminateRisk) {
      for (const card of gs.getBoardCards()) {
        const def = window.__GAME_DATA__?.items[card.definitionId];
        if (def?.type === 'consumable' && (def.subtype === 'food' || def.subtype === 'drink') && !card._weatherProtected) {
          card.contamination = Math.min(100, (card.contamination ?? 0) + 3);
        }
      }
    }

    // TP 카운트다운 → 날씨 변경
    gs.weather.tpRemaining--;
    if (gs.weather.tpRemaining <= 0) {
      this._changeWeather(gs);
    } else {
      // 시간대 변화에 따른 기온 갱신 (시간이 바뀔 때)
      this._updateTemperatureHUD(this.getOutdoorTemperature());
    }
  },

  _initWeather(gs) {
    if (!gs.weather) gs.weather = {};
    const season = gs.season?.current ?? 'spring';
    const w = this._rollWeather(season);
    Object.assign(gs.weather, w);
    gs.weather.tpRemaining = this._rollDuration();
    gs.weather.tempJitter  = parseFloat((Math.random() * 4 - 2).toFixed(1));
  },

  _changeWeather(gs) {
    const season = gs.season?.current ?? 'spring';
    const prev   = gs.weather.id;
    const w      = this._rollWeather(season);
    Object.assign(gs.weather, w);
    gs.weather.tpRemaining = this._rollDuration();
    gs.weather.tempJitter  = parseFloat((Math.random() * 4 - 2).toFixed(1));

    // 날씨 변경 알림 (눈에 띄는 날씨만)
    const notifyIds = ['hot', 'storm', 'monsoon', 'blizzard', 'snow'];
    if (notifyIds.includes(w.id) && w.id !== prev) {
      EventBus.emit('notify', { message: `🌤 날씨 변화: ${w.icon} ${w.name}`, type: 'info' });
    }

    EventBus.emit('weatherChanged', { weather: gs.weather });
    this._updateWeatherHUD(gs.weather);
    this._updateTemperatureHUD(this.getOutdoorTemperature());
  },

  _rollWeather(season) {
    const table      = WEATHER_TABLES[season] ?? WEATHER_TABLES.spring;
    const totalW     = table.reduce((s, w) => s + w.weight, 0);
    let   roll       = Math.random() * totalW;
    for (const w of table) {
      roll -= w.weight;
      if (roll <= 0) return { ...w };
    }
    return { ...table[0] };
  },

  _rollDuration() {
    // 1~3일 (96~288 TP)
    return 96 + Math.floor(Math.random() * 193);
  },

  _updateWeatherHUD(weather) {
    const el = document.getElementById('weather-display');
    if (!el) return;
    el.textContent = `${weather.icon} ${weather.name}`;
    el.dataset.weather = weather.id;
  },

  // ── 온도 계산 & HUD 갱신 ──────────────────────────────────────

  // 시간대별 기온 오프셋 (°C)
  _getTimeOffset(hour) {
    if (hour <  5) return -5;   // 새벽
    if (hour <  8) return -3;   // 이른 아침
    if (hour < 12) return  0;   // 오전
    if (hour < 15) return +4;   // 낮 (최고 기온)
    if (hour < 18) return +3;   // 오후
    if (hour < 21) return  0;   // 저녁
    return -3;                  // 밤
  },

  // 현재 실외 기온 계산 (°C, 정수 반환)
  getOutdoorTemperature() {
    const gs       = GameState;
    const season   = gs.season?.current ?? 'spring';
    const hour     = gs.time?.hour ?? 12;
    const base     = SEASON_BASE_TEMP[season] ?? 13;
    const timeOff  = this._getTimeOffset(hour);
    const wId      = gs.weather?.id ?? 'sunny';
    const wAdj     = WEATHER_TEMP_ADJ[wId] ?? 0;
    const jitter   = gs.weather?.tempJitter ?? 0;
    return Math.round(base + timeOff + wAdj + jitter);
  },

  _updateTemperatureHUD(temp) {
    const el = document.getElementById('outdoor-temp');
    if (!el) return;
    el.textContent = `🌡 ${temp}°C`;

    let cls = 'bc-temp-display';
    if      (temp <= -5) cls += ' temp-very-cold';
    else if (temp <   5) cls += ' temp-cold';
    else if (temp >=  34) cls += ' temp-extreme';
    else if (temp >=  26) cls += ' temp-hot';
    else                  cls += ' temp-normal';
    el.className = cls;
  },

  // Basecamp 입장 시 표시 갱신용
  renderHUD() {
    const gs = GameState;
    if (!gs.weather) this._initWeather(gs);
    this._updateWeatherHUD(gs.weather);
    this._updateTemperatureHUD(this.getOutdoorTemperature());
  },
};

export default WeatherSystem;
