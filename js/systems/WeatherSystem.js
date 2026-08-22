// === WEATHER SYSTEM ===
// 계절별 날씨 생성 — 1~3일마다 변경
// 날씨 효과는 경미한 수준 (병균 위험, 체온 미세 조정 등)

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData from '../data/GameData.js';
import { uiIcon } from '../ui/UiIcon.js';

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
    { id: 'sunny',     name: '맑음',     icon: '☀️',  weight: 20, tempMod: 0 },
    { id: 'windy',     name: '바람',     icon: '🍃',  weight: 20, tempMod: -0.2 },
    { id: 'cloudy',    name: '흐림',     icon: '⛅',  weight: 20, tempMod: -0.1 },
    { id: 'foggy',     name: '안개',     icon: '🌫',  weight: 15, tempMod: 0 },
    { id: 'acid_rain', name: '산성비',   icon: '☢️',  weight: 25, tempMod: -0.3,
      contaminateRisk: 0.010, gardenKill: true },
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

// 날씨별 위젯 힌트 태그 (구 env_* 카드 tags에서 이관 — 미등록 날씨는 힌트 없음)
const WEATHER_HINTS = {
  rainy:     ['water_source'],
  hot:       ['heat', 'danger'],
  storm:     ['danger'],
  monsoon:   ['water_source', 'danger'],
  clear:     ['cold'],
  snow:      ['cold', 'water_source'],
  blizzard:  ['cold', 'danger'],
  overcast:  ['cold'],
  acid_rain: ['danger', 'contamination'],
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
  acid_rain: -4,
};

// 비 계열 날씨 id. 마른 개울 재충수, NPC 비 대사 등 여러 곳이 같은 목록을 봐야 하므로
// 상수로 두고 export한다 (각자 리터럴을 들고 있다가 'rain'/'rainy'로 어긋난 적이 있다).
export const RAINY_WEATHER_IDS = ['rainy', 'storm', 'monsoon'];

/** 주어진 날씨 id가 비 계열인지. 소비처가 필드명·값을 직접 다루지 않게 한다. */
export function isRainyWeather(weatherId) {
  return RAINY_WEATHER_IDS.includes(weatherId);
}

// 몸이 젖는 날씨. 방수 장비(onWear.waterproof)가 체온 하강을 막는 대상이다.
// 산성비는 여기 넣지 않는다 — 산을 막는 것은 acidImmunity의 몫이다.
export const WET_WEATHER_IDS = [...RAINY_WEATHER_IDS, 'snow', 'blizzard'];

/** 젖는 날씨인지 (비·눈 계열). */
export function isWetWeather(weatherId) {
  return WET_WEATHER_IDS.includes(weatherId);
}

/** 산성비 계열인지. 날씨 테이블은 id가 아니라 gardenKill 플래그로 산성을 표시한다. */
export function isAcidWeather(weather) {
  return weather?.gardenKill === true || weather?.id === 'acid_rain';
}

/**
 * 날씨 패널티가 면제되는 안전 지대인지 (베이스캠프 완공 + 메인 화면).
 * 체온 보정·식량 오염·산성비 노출이 같은 기준을 봐야 해서 한곳에 둔다.
 */
export function isWeatherSheltered(gs = GameState) {
  return gs?.basecamp?.buildStage >= 3 && gs?.ui?.currentState === 'main';
}

// 알림을 띄우는 날씨 — 눈에 띄는 것만. 전환(_changeWeather)과 초기화(_initWeather)가
// 같은 목록을 봐야 세이브를 산성비 한복판에서 열었을 때도 안내가 나간다.
const NOTABLE_WEATHER_IDS = ['hot', 'storm', 'monsoon', 'blizzard', 'snow', 'acid_rain'];

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

  // GM/디버그용: 날씨를 즉시 강제 설정 (모든 계절 테이블에서 id 탐색)
  setWeather(weatherId) {
    const gs = GameState;
    let def = null;
    for (const table of Object.values(WEATHER_TABLES)) {
      const found = table.find(w => w.id === weatherId);
      if (found) { def = found; break; }
    }
    if (!def) return false;
    const prev = gs.weather?.id;
    if (!gs.weather) gs.weather = {};
    Object.assign(gs.weather, def);
    gs.weather.tpRemaining = this._rollDuration();
    gs.weather.tempJitter  = 0;
    EventBus.emit('weatherChanged', { weather: gs.weather });
    this._updateWeatherHUD(gs.weather);
    this._updateTemperatureHUD(this.getOutdoorTemperature());
    this._renderWeatherWidget(gs);
    if (isRainyWeather(weatherId) && !isRainyWeather(prev)) {
      this._refillDryStreams(gs);
    }
    EventBus.emit('notify', { message: `🌤 [GM] 날씨 → ${def.icon} ${def.name}`, type: 'info' });
    return true;
  },

  // 비 집수: 바닥(middle)에 둔 양동이를 3 TP마다 1/4씩 채운다.
  // 비/장마/폭풍 → 오염도 30(빗물 수준), 산성비 → 80(고오염).
  _fillBuckets(gs) {
    const w = gs.weather;
    const isAcid    = w?.gardenKill === true || w?.id === 'acid_rain';
    const isRainy   = isRainyWeather(w?.id);
    if (!isRainy && !isAcid) return;
    const fillContam = isAcid ? 80 : 30;

    for (const id of gs.board.middle) {
      if (!id) continue;
      const inst = gs.cards[id];
      if (!inst) continue;
      const defId = inst.definitionId;
      if (defId !== 'empty_bucket' && defId !== 'water_bucket') continue;
      // 이미 가득 찬 물 양동이는 건너뜀
      if (defId === 'water_bucket' && (inst._fillLevel ?? 1) >= 4) continue;

      // 3 TP마다 한 단계
      inst._rainTick = (inst._rainTick ?? 0) + 1;
      if (inst._rainTick < 3) continue;
      inst._rainTick = 0;

      if (defId === 'empty_bucket') {
        inst.definitionId = 'water_bucket';
        inst._fillLevel   = 1;
        inst.contamination = fillContam;
      } else {
        inst._fillLevel    = (inst._fillLevel ?? 1) + 1;
        inst.contamination = Math.max(inst.contamination ?? 0, fillContam);
      }
      EventBus.emit('boardChanged', {});
    }
  },

  // ── 내부 ─────────────────────────────────────────────────────

  _onTP() {
    const gs = GameState;
    if (!gs.weather || !gs.weather.id) this._initWeather(gs);

    // 베이스캠프 완공 + 베이스캠프 화면: 날씨 패널티 면제 (안전 지대 효과)
    const inSafeZone = isWeatherSheltered(gs);

    // 체온에 날씨 영향 적용 (미세 조정 — 계절 효과와 별도)
    // 방수 장비를 입으면 비·눈으로 인한 체온 하강만 면제된다. 폭염(양수)과 산성비는 그대로다.
    const weather = gs.weather;
    // 집계값은 StatSystem.onTP가 같은 TP에 먼저 캐시한다 (DiseaseSystem과 같은 경로).
    // 직접 import하면 StatSystem → WeatherSystem 순환이 생긴다.
    const shedsWet = weather.tempMod < 0
      && isWetWeather(weather.id)
      && gs.player?.armorEffects?.waterproof === true;
    if (!inSafeZone && !shedsWet && weather.tempMod && weather.tempMod !== 0) {
      gs.modStat('temperature', weather.tempMod);
    }

    // 비/장마: 보드의 식량 오염 미세 위험 (안전 지대에서는 차단)
    if (!inSafeZone && weather.contaminateRisk > 0 && Math.random() < weather.contaminateRisk) {
      for (const card of gs.getBoardCards()) {
        const def = GameData?.items[card.definitionId];
        if (def?.type === 'consumable' && (def.subtype === 'food' || def.subtype === 'drink') && !card._weatherProtected) {
          card.contamination = Math.min(100, (card.contamination ?? 0) + 3);
        }
      }
    }

    // 계절 이벤트 남은 시간 틱
    this._tickSeasonEvents(gs);

    // 비 집수: 바닥(middle)에 둔 양동이 채우기
    this._fillBuckets(gs);

    // 젖은 천 자연 건조 (48TP)
    this._tickWetCloth(gs);

    // TP 카운트다운 → 날씨 변경
    gs.weather.tpRemaining--;
    if (gs.weather.tpRemaining <= 0) {
      this._changeWeather(gs);
    } else {
      // 시간대 변화에 따른 기온 갱신 (시간이 바뀔 때)
      this._updateTemperatureHUD(this.getOutdoorTemperature());
    }

    // 사이드바 위젯 갱신
    this._renderWeatherWidget(gs);
  },

  _initWeather(gs) {
    if (!gs.weather) gs.weather = {};
    const season = gs.season?.current ?? 'spring';
    const w = this._rollWeather(season);
    Object.assign(gs.weather, w);
    gs.weather.tpRemaining = this._rollDuration();
    gs.weather.tempJitter  = parseFloat((Math.random() * 4 - 2).toFixed(1));
    // 시작·로드 시점부터 위험 날씨면 전환 알림이 없어 그냥 지나간다 — 여기서 한 번 알린다
    if (NOTABLE_WEATHER_IDS.includes(w.id)) {
      EventBus.emit('notify', { message: `🌤 날씨: ${w.icon} ${w.name}`, type: 'info' });
    }
    // 구버전 세이브 호환: environment 행 orphan 정리
    this._cleanupEnvironmentRow(gs);
  },

  _changeWeather(gs) {
    const season = gs.season?.current ?? 'spring';
    const prev   = gs.weather.id;
    const w      = this._rollWeather(season);
    Object.assign(gs.weather, w);
    gs.weather.tpRemaining = this._rollDuration();
    gs.weather.tempJitter  = parseFloat((Math.random() * 4 - 2).toFixed(1));

    // 날씨 변경 알림 (눈에 띄는 날씨만)
    if (NOTABLE_WEATHER_IDS.includes(w.id) && w.id !== prev) {
      EventBus.emit('notify', { message: `🌤 날씨 변화: ${w.icon} ${w.name}`, type: 'info' });
    }

    EventBus.emit('weatherChanged', { weather: gs.weather });
    this._updateWeatherHUD(gs.weather);
    this._updateTemperatureHUD(this.getOutdoorTemperature());
    if (isRainyWeather(w.id) && !isRainyWeather(prev)) {
      this._refillDryStreams(gs);
    }
  },

  _refillDryStreams(gs) {
    const dryStreams = GameState.getBoardCards()
      .filter(c => c.definitionId === 'dry_stream');
    if (dryStreams.length === 0) return;
    for (const card of dryStreams) {
      card.definitionId = 'stream_spring';
      card.quantity = 10;
    }
    EventBus.emit('notify', { message: '비가 내려 개울이 다시 차올랐다.', type: 'info' });
    EventBus.emit('boardUpdate');
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
    // 1~3일 (72~216 TP)
    return 72 + Math.floor(Math.random() * 145);
  },

  _updateWeatherHUD(weather) {
    const el = document.getElementById('weather-display');
    if (!el) return;
    el.innerHTML = uiIcon('weather');
    el.append(` ${weather.name}`);
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
    el.innerHTML = `${uiIcon('temperature')} ${temp}°C`;

    let cls = 'bc-temp-display';
    if      (temp <= -5) cls += ' temp-very-cold';
    else if (temp <   5) cls += ' temp-cold';
    else if (temp >=  34) cls += ' temp-extreme';
    else if (temp >=  26) cls += ' temp-hot';
    else                  cls += ' temp-normal';
    el.className = cls;
  },

  // ── environment 행 정리 ─────────────────────────────────────
  // 날씨·계절 이벤트 모두 카드가 아닌 HUD·위젯 상태로 전환됨.
  // 구버전 세이브에 남아 있던 environment 행 카드(날씨 slot 0, 이벤트 slot 1~2)를 제거.
  // 진행 중이던 이벤트의 남은 시간은 이관하지 않는다(표시 1회 유실, 효과와는 무관).

  _cleanupEnvironmentRow(gs) {
    const envRow = gs.board?.environment;
    if (!envRow) return;
    for (let i = 0; i < envRow.length; i++) {
      const oldId = envRow[i];
      if (oldId && gs.cards[oldId]) {
        delete gs.cards[oldId];
      }
      if (envRow[i] != null) envRow[i] = null;
    }
  },

  // 젖은 천: 48TP 후 자동으로 마른 천으로 복귀
  _tickWetCloth(gs) {
    let changed = false;
    for (const card of gs.getBoardCards?.() ?? []) {
      if (card.definitionId !== 'wet_cloth') continue;
      if (card._wetTpRemaining == null) card._wetTpRemaining = 48;
      card._wetTpRemaining--;
      if (card._wetTpRemaining <= 0) {
        card.definitionId = 'cloth';
        delete card._wetTpRemaining;
        changed = true;
      }
    }
    if (changed) EventBus.emit('boardChanged', {});
  },

  // 진행 중 계절 이벤트(season.activeEvents)의 남은 시간을 매 TP 갱신
  _tickSeasonEvents(gs) {
    const active = gs.season?.activeEvents;
    if (!Array.isArray(active) || active.length === 0) return;
    for (const evt of active) {
      evt.tpRemaining = (evt.tpRemaining ?? 0) - 1;
    }
    gs.season.activeEvents = active.filter(evt => evt.tpRemaining > 0);
  },

  // Basecamp 입장 시 표시 갱신용
  renderHUD() {
    const gs = GameState;
    if (!gs.weather) this._initWeather(gs);
    // 구버전 세이브 호환: environment 행 orphan 카드 정리
    this._cleanupEnvironmentRow(gs);
    this._updateWeatherHUD(gs.weather);
    this._updateTemperatureHUD(this.getOutdoorTemperature());
    this._renderWeatherWidget(gs);
  },

  // ── 사이드바 날씨 위젯 렌더링 ─────────────────────────────────
  _renderWeatherWidget(gs) {
    const el = document.getElementById('weather-widget');
    if (!el) return;

    const hintMap = {
      water_source:  { icon: '💧', label: '물 수집 가능' },
      heat:          { icon: '🔥', label: '고온 주의' },
      cold:          { icon: '🧊', label: '저온 주의' },
      contamination: { icon: '☢️', label: '오염 위험' },
      danger:        { icon: '⚠️', label: '위험 날씨' },
    };

    const hints = (WEATHER_HINTS[gs.weather?.id] ?? [])
      .filter(t => hintMap[t])
      .map(t => `<span class="ww-hint ww-hint-${t}">${hintMap[t].icon} ${hintMap[t].label}</span>`)
      .join('');

    // 진행 중 계절 이벤트 목록 (season.activeEvents)
    let eventsHtml = '';
    for (const evt of gs.season?.activeEvents ?? []) {
      const pct = evt.tpTotal > 0
        ? Math.round((evt.tpRemaining / evt.tpTotal) * 100)
        : 0;
      const daysLeft = Math.max(1, Math.ceil((evt.tpRemaining ?? 0) / 72));
      eventsHtml += `
        <div class="ww-event${evt.danger ? ' ww-event-danger' : ''}">
          <span class="ww-event-icon">${evt.icon ?? '⚡'}</span>
          <span class="ww-event-name">${evt.name}</span>
          <span class="ww-event-days">${daysLeft}일</span>
          <div class="ww-event-bar">
            <div class="ww-event-fill${evt.danger ? ' danger' : ''}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }

    el.innerHTML = hints || eventsHtml
      ? `${hints ? `<div class="ww-hints">${hints}</div>` : ''}${eventsHtml}`
      : '';
  },
};

export default WeatherSystem;
