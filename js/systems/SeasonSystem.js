// === SEASON SYSTEM ===
// 4계절 진행: 봄(Day 1-90) → 여름(91-180) → 가을(181-270) → 겨울(271+)
// StatSystem.onTP()에서 getModifiers()를 호출하여 계절별 스탯 보정 적용
// ExploreSystem._arriveAtDistrict()에서 getSeasonalLootBonus()로 추가 루팅

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import SEASONAL_EVENTS from '../data/seasonalEvents.js';

// ── 계절 정의 ──────────────────────────────────────────────────

const SEASONS = [
  { id: 'spring', name: '봄',   icon: '🌸', start: 1,   end: 90  },
  { id: 'summer', name: '여름', icon: '☀️', start: 91,  end: 180 },
  { id: 'autumn', name: '가을', icon: '🍂', start: 181, end: 270 },
  { id: 'winter', name: '겨울', icon: '❄️', start: 271, end: Infinity },
];

// ── 계절별 스탯 보정값 ─────────────────────────────────────────
// hydrationDecayMult : 수분 소모 배수
// tempDecayPerTP     : TP당 체온 변화 (음수 = 하락)
// tempRisePerTP      : TP당 체온 상승 (여름 더위, 방치 시 열사병)
// infectionChanceMult: 감염 위험 배수 (ContaminationSystem 연동)
// encounterMult      : 조우 확률 배수 (겨울 좀비 둔화)
// lootBonus          : 탐색 보너스 아이템 수 (가을 수확)

const SEASON_MODIFIERS = {
  spring: {
    hydrationDecayMult:  1.0,
    tempDecayPerTP:      0,
    tempRisePerTP:       0,
    infectionChanceMult: 1.5,   // 봄비·꽃가루로 감염 위험 증가
    encounterMult:       1.0,
    lootBonus:           0,
  },
  summer: {
    hydrationDecayMult:  1.5,   // 폭염으로 수분 소모 급증
    tempDecayPerTP:      0,
    tempRisePerTP:       0.3,   // TP당 체온 +0.3 (방치 시 열사병)
    infectionChanceMult: 1.2,
    encounterMult:       1.0,
    lootBonus:           0,
  },
  autumn: {
    hydrationDecayMult:  0.9,   // 선선해서 수분 유지 쉬움
    tempDecayPerTP:      -0.3,  // 기온 하강 시작
    tempRisePerTP:       0,
    infectionChanceMult: 1.3,   // 환절기 병 위험
    encounterMult:       1.0,
    lootBonus:           1,     // 수확기 — 탐색마다 아이템 +1
  },
  winter: {
    hydrationDecayMult:  0.8,
    tempDecayPerTP:      -1.5,  // 혹한 — 캠프파이어 없으면 체온 급감
    tempRisePerTP:       0,
    infectionChanceMult: 1.0,
    encounterMult:       0.8,   // 좀비 행동 둔화
    lootBonus:           0,
  },
};

// ── 계절별 보너스 루팅 아이템 ─────────────────────────────────
// 각 계절에 탐색 성공 시 추가로 발견할 수 있는 아이템

const SEASON_LOOT = {
  spring: [
    { id: 'vitamins',  qty: 1, chance: 0.40 },  // 봄 나물·비타민
    { id: 'rainwater', qty: 1, chance: 0.35 },  // 봄비 빗물 수집
    { id: 'gauze',     qty: 1, chance: 0.25 },  // 약국 재고 남음
  ],
  summer: [
    { id: 'rainwater',    qty: 1, chance: 0.50 },  // 장마철 빗물
    { id: 'sports_drink', qty: 1, chance: 0.30 },  // 더위 대비 음료
    { id: 'empty_bottle', qty: 1, chance: 0.20 },  // 빗물 수집용 병
  ],
  autumn: [
    { id: 'canned_food',  qty: 1, chance: 0.45 },  // 수확 식량 비축
    { id: 'energy_bar',   qty: 1, chance: 0.35 },  // 에너지 바
    { id: 'rice',         qty: 1, chance: 0.20 },  // 쌀 수확
  ],
  winter: [
    { id: 'wood',    qty: 1, chance: 0.50 },  // 땔감 확보
    { id: 'cloth',   qty: 1, chance: 0.35 },  // 방한복 재료
    { id: 'charcoal',qty: 1, chance: 0.25 },  // 숯 (캠프파이어 연료)
  ],
};

// ── SeasonSystem ───────────────────────────────────────────────

const SeasonSystem = {
  _lastEventDay: 0,

  init() {
    EventBus.on('tpAdvance', () => this._onTP());
  },

  // 날수 → 계절 객체 반환
  getCurrentSeason(day) {
    return SEASONS.find(s => day >= s.start && day <= s.end) ?? SEASONS[SEASONS.length - 1];
  },

  // 현재 계절 스탯 보정값 (StatSystem에서 호출)
  getModifiers() {
    const season = this.getCurrentSeason(GameState.time.day);
    return SEASON_MODIFIERS[season.id];
  },

  // 현재 계절 UI 정보 (Basecamp 배지용)
  getSeasonInfo() {
    const day    = GameState.time.day;
    const season = this.getCurrentSeason(day);
    const dayInSeason = day - season.start + 1;
    return { ...season, dayInSeason };
  },

  // 탐색 시 계절 보너스 아이템 롤 (ExploreSystem에서 호출)
  // returns [{ definitionId, quantity }] 배열 (0~2개)
  rollSeasonalLoot() {
    const season = this.getCurrentSeason(GameState.time.day);
    const table  = SEASON_LOOT[season.id] ?? [];
    const result = [];
    for (const entry of table) {
      if (Math.random() < entry.chance) {
        result.push({ definitionId: entry.id, quantity: entry.qty });
      }
    }
    return result.slice(0, 2);  // 최대 2개
  },

  // ── 내부: TP마다 계절 필드 동기화 + 이벤트 체크 ──────────

  _onTP() {
    const gs = GameState;
    if (!gs.player.isAlive) return;

    const day = gs.time.day;

    // season 필드 초기화 (구버전 세이브 대비)
    if (!gs.season) {
      gs.season = { current: 'spring', eventsTriggered: [] };
    }

    const season = this.getCurrentSeason(day);
    gs.season.current = season.id;

    // 여름 생존 플래그 (Day 180 → 181 경계 통과 시)
    if (day >= 181 && !gs.flags.survivedSummer) {
      gs.flags.survivedSummer = true;
    }

    // 하루에 한 번만 이벤트 체크
    if (day <= this._lastEventDay) return;
    this._lastEventDay = day;
    this._checkDayEvents(day, gs);

    // Basecamp 계절 배지 갱신
    this._updateSeasonBadge(season);
  },

  _checkDayEvents(day, gs) {
    if (!gs.season.eventsTriggered) gs.season.eventsTriggered = [];
    const triggered = gs.season.eventsTriggered;

    const event = SEASONAL_EVENTS.find(e => e.day === day && !triggered.includes(e.id));
    if (!event) return;

    triggered.push(event.id);
    EventBus.emit('notify', { message: event.message, type: event.type });
    this._applyEventEffects(event.effects, gs);
  },

  _applyEventEffects(effects, gs) {
    if (!effects) return;

    // 음식/수분 카드에 오염도 추가
    if (effects.contaminateFood > 0) {
      for (const card of gs.getBoardCards()) {
        const def = window.__GAME_DATA__?.items[card.definitionId];
        if (def?.type === 'consumable') {
          card.contamination = Math.min(100, (card.contamination ?? 0) + effects.contaminateFood);
        }
      }
    }

    // 즉시 스탯 변화
    if (effects.infection)   gs.modStat('infection',   effects.infection);
    if (effects.temperature) gs.modStat('temperature', effects.temperature);
    if (effects.morale)      gs.modStat('morale',      effects.morale);

    // 구조물 내구도 감소 (태풍 등)
    if (effects.structureDamage > 0) {
      for (const card of gs.getBoardCards()) {
        const def = window.__GAME_DATA__?.items[card.definitionId];
        if (def?.subtype === '구조물') {
          card.durability = Math.max(10, (card.durability ?? 100) - effects.structureDamage);
        }
      }
    }

    EventBus.emit('boardChanged', {});
  },

  _updateSeasonBadge(season) {
    const badge = document.getElementById('season-badge');
    if (!badge) return;
    badge.textContent = `${season.icon} ${season.name}`;
    badge.dataset.season = season.id;
  },
};

export default SeasonSystem;
