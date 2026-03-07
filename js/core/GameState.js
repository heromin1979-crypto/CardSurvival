// === CENTRAL GAME STATE SINGLETON ===
import EventBus from './EventBus.js';

const GameState = {
  // ── time ──────────────────────────────────────────────
  time: {
    totalTP:    0,
    day:        1,
    tpInDay:    0,   // 0-95 (96 TP/day at 15-min intervals)
    hour:       6,   // game hour (0-23)
    isPaused:   false,
    tickRateMs: 3000, // real ms per mini-tick (5 mini = 1 TP)
  },

  // ── stats ─────────────────────────────────────────────
  stats: {
    hydration:   { current: 200, max: 288, decayPerTP: 2.0 },
    nutrition:   { current: 80,  max: 100, decayPerTP: 0.5 },
    temperature: { current: 50,  max: 100, decayPerTP: 0   },
    morale:      { current: 70,  max: 100, decayPerTP: 0.2 },
    radiation:   { current: 0,   max: 100, decayPerTP: 0   },
    infection:   { current: 0,   max: 100, decayPerTP: 0   },
    fatigue:     { current: 10,  max: 100, decayPerTP: 0.8 },
    stamina:     { current: 100, max: 100 },  // 스태미나: 이동·과적에 의해 소모, 휴식 시 회복
  },

  // ── player ────────────────────────────────────────────
  player: {
    name:                'Survivor',
    traits:              [],
    characterId:         null,
    hp:                  { current: 100, max: 100 },
    xp:                  0,
    isAlive:             true,
    deathCause:          null,
    encounterRateReduct: 0,   // barricade onTick으로 매 TP 갱신
    encumbrance:{
      current:   0,
      max:       30,    // 캐릭터 선택 시 덮어씀
      tier:      0,     // 0=free,1=light,2=heavy,3=overloaded,4=immobile(>200%)
      tpMult:    1.0,
      weightPct: 0,     // current/max 비율 (0.0~) — StatSystem·ExploreSystem에서 참조
    },
    // ── 캐릭터 능력 효과 기본값 ──────────────────────────
    healBonus:               1.0,   // 의료 아이템 치료량 배수
    noiseReduct:             0,     // 소음 감소율 (0~1)
    exploreBonus:            0,     // 탐색 추가 아이템 수
    combatDmgBonus:          1.0,   // 전투 데미지 배수
    critBonus:               0,     // 크리티컬 확률 추가
    craftSaveChance:         0,     // 제작 재료 절약 확률
    dismantleBonus:          0,     // 분해 재료 추가 확률
    dismantleExtraItem:      0,     // 분해 시 추가 획득 수
    structureDurabilityBonus:1.0,   // 구조물 내구도 배수
    medicalUsesBonus:        0,     // 의료 아이템 사용 횟수 보너스
    encounterRateReduct:     0,     // 조우 확률 감소율
    bandageHpBonus:          0,     // 붕대 추가 HP 회복
    craftSuccessBonus:       0,     // 제작 성공률 추가 (공학자)
    // ── 장착 슬롯 ────────────────────────────────────────
    diseases:    [],     // [{ id, tpElapsed, tpDuration, fatalTp }] 활성 질병 목록
    equipped: {
      head:        null,  // 헬멧 등
      body:        null,  // 방어구 (조끼/풀바디/의복)
      hands:       null,  // 장갑
      offhand:     null,  // 방패
      face:        null,  // 방독면
      weapon_main: null,  // 주무기
      weapon_sub:  null,  // 보조무기
      backpack:    null,  // 가방 (인벤토리 확장)
      belt:        null,  // 허리띠 (잠금 예비)
      accessory:   null,  // 액세서리 (잠금 예비)
    },
    extraSlots:  0,       // 가방 장착으로 추가된 인벤토리 슬롯 수
  },

  // ── board ─────────────────────────────────────────────
  // Each row: array of slot entries (null | instanceId)
  board: {
    top:    [null, null, null, null, null, null, null, null], // 8칸: [현재구][랜드마크][인접구×6]
    middle: [null, null, null, null, null, null, null, null],  // 8칸
    bottom: [null, null, null, null, null, null, null, null],  // 소지품 8칸 (가방으로 확장 가능)
  },

  // ── card instances ────────────────────────────────────
  cards: {},  // { [instanceId]: CardInstance }
  _nextId: 1,

  // ── location ──────────────────────────────────────────
  location: {
    currentDistrict:    'mapo',  // 현재 위치한 구(gu)
    currentNode:        'mapo',  // currentDistrict 와 동기화
    isExploring:        false,
    travelCostTP:       0,
    nodesVisited:       [],
    districtsVisited:   [],      // 방문한 구 목록
    districtsLooted:    [],      // 루팅 완료한 구 목록 (재방문 시 희귀 리스폰)
    currentLandmark:    null,    // 랜드마크 내부 진입 시 districtId (null = 랜드마크 밖)
    currentSubLocation: null,    // 현재 세부 장소 ID (null = 랜드마크 로비 또는 밖)
  },

  // ── 위치별 바닥 아이템 저장 ──────────────────────────
  // { [districtId]: instanceId[] } — 각 지역에 남겨진 바닥 아이템
  locationFloors: {},

  // ── noise ─────────────────────────────────────────────
  noise: {
    level:          0,
    decayPerTP:     1.0,
    influxThreshold:60,
    influxTriggered:false,
  },

  // ── crafting ──────────────────────────────────────────
  crafting: {
    activeQueue: [],   // [{ blueprintId, stageIndex, tpRemaining, tpTotal, reservedItemIds }]
    maxQueueSize: 3,
  },

  // ── combat respawn (전투 소음 재조우 타이머) ──────────
  combatRespawn: {
    active:      false,
    tpRemaining: 0,
    nodeId:      null,
    dangerLevel: 0,
  },

  // ── combat ────────────────────────────────────────────
  combat: {
    active:       false,
    enemies:      [],
    playerAction: null,
    log:          [],
    outcome:      null,   // 'victory'|'defeat'|'fled'
    rewards:      [],
    round:        0,
    xpGained:     0,
    lastHit:      null,   // { target:'player'|'enemy', damage, isCrit }
    playerStatus: [],     // [{ id, name, duration, effect }]
    enemyStatus:  [],     // [{ id, name, duration, effect }]
    targetIndex:  0,      // 현재 공격 대상 (enemies 배열 인덱스)
  },

  // ── UI ────────────────────────────────────────────────
  ui: {
    currentState:  'main_menu',
    basecampMode:  'INVENTORY',  // 'INVENTORY'|'CRAFT'|'STATUS'
    saveSlot:      0,            // 현재 사용 중인 세이브 슬롯
    modalOpen:     false,
    notifications: [],
  },

  // ── pending loot (탐색 후 플레이어 확인 전까지 보관) ───
  pendingLoot: [],  // [{ definitionId, quantity, contamination }]

  // ── weather ───────────────────────────────────────────
  // WeatherSystem이 매 TP마다 업데이트
  weather: {
    id:          'sunny',
    name:        '맑음',
    icon:        '☀️',
    tempMod:     0,
    tpRemaining: 96,
    tempJitter:  0,
  },

  // ── season ────────────────────────────────────────────
  // SeasonSystem이 매 TP마다 동기화
  season: {
    current:         'spring',  // 'spring'|'summer'|'autumn'|'winter'
    eventsTriggered: [],        // 이미 발동된 이벤트 id 목록
  },

  // ── flags ─────────────────────────────────────────────
  flags: {
    tutorialSeen: false,
    firstBlood:   false,
    // ── 엔딩 추적 ──────────────────────────────────────
    totalKills:          0,    // 누적 처치 수
    totalItemsFound:     0,    // 누적 발견 아이템 수
    totalCrafted:        0,    // 누적 제작 횟수
    totalMedicalCrafted: 0,    // 의료 카테고리 제작 횟수
    structuresBuilt:     0,    // 구조물 카테고리 제작 횟수
    despairTicks:        0,    // 사기 0 연속 TP 수
    nukeZoneEntered:     0,    // 방사선 구역 진입 횟수
    lastEnemyCount:      0,    // 마지막 전투 적 수 (군중사 판별용)
    yeongdeungpoVisited: false, // 영등포구 방문 여부 (KBS 거점)
    seodaemunVisited:    false, // 서대문구 방문 여부 (세브란스 병원)
    songpaVisited:       false, // 송파구 방문 여부 (롯데타워)
    jongnoVisited:       false, // 종로구 방문 여부 (광화문)
    infectionCured:      false, // 감염이 50 이상에서 0으로 회복된 이력
    collapseCount:       0,    // 피로 붕괴 횟수 (2회째 → 사망)
    survivedSummer:      false, // Day 180 이후 생존 플래그 (여름 생존 엔딩)
    diseaseDeathId:      null,  // 질병 사망 시 질병 ID (엔딩 선택용)
  },

  // ── HELPERS ───────────────────────────────────────────
  createCardInstance(definitionId, overrides = {}) {
    const { items } = window.__GAME_DATA__;
    const def = items[definitionId];
    if (!def) return null;

    const id = 'c' + (this._nextId++);
    const instance = {
      instanceId:    id,
      definitionId,
      quantity:      overrides.quantity      ?? (def.stackable ? 1 : 1),
      durability:    overrides.durability    ?? def.defaultDurability ?? 100,
      contamination: overrides.contamination ?? def.defaultContamination ?? 0,
      ...overrides,
    };
    this.cards[id] = instance;
    this._updateEncumbrance();
    return instance;
  },

  removeCardInstance(instanceId) {
    delete this.cards[instanceId];
    // remove from board if present
    for (const row of ['top', 'middle', 'bottom']) {
      this.board[row] = this.board[row].map(v => v === instanceId ? null : v);
    }
    // clear from equipped slots if present
    if (this.player.equipped) {
      for (const slot of Object.keys(this.player.equipped)) {
        if (this.player.equipped[slot] === instanceId) {
          this.player.equipped[slot] = null;
        }
      }
    }
    this._updateEncumbrance();
  },

  getCardDef(instanceId) {
    const inst = this.cards[instanceId];
    if (!inst) return null;
    return window.__GAME_DATA__.items[inst.definitionId];
  },

  // find first empty slot in a row (returns index or -1)
  findEmptySlot(row) {
    return this.board[row].findIndex(v => v === null);
  },

  // place a card instance in first available slot of a row
  // 일반 아이템은 top(장소) 행에 절대 배치하지 않음
  placeCardInRow(instanceId, preferredRow = null) {
    const def = window.__GAME_DATA__?.items[this.cards[instanceId]?.definitionId];
    const isLocation = def?.type === 'location';

    // 장소 카드: top 우선, 일반 카드: middle/bottom만 허용
    const rows = isLocation
      ? (preferredRow ? [preferredRow, ...['top','middle','bottom'].filter(r => r !== preferredRow)] : ['top', 'middle', 'bottom'])
      : (preferredRow === 'top' ? ['middle', 'bottom'] : (preferredRow ? [preferredRow, ...['middle','bottom'].filter(r => r !== preferredRow)] : ['middle', 'bottom']));

    for (const row of rows) {
      const idx = this.findEmptySlot(row);
      if (idx !== -1) {
        this.board[row][idx] = instanceId;
        EventBus.emit('cardPlaced', { instanceId, row, slot: idx });
        return { row, slot: idx };
      }
    }
    return null;
  },

  // get all cards currently on the board
  getBoardCards() {
    const result = [];
    for (const row of ['top', 'middle', 'bottom']) {
      for (const id of this.board[row]) {
        if (id) result.push(this.cards[id]);
      }
    }
    return result;
  },

  // get all card instances (board + inventory equivalent)
  getAllCards() {
    return Object.values(this.cards);
  },

  // find instances by definition id
  findByDef(definitionId) {
    return Object.values(this.cards).filter(c => c.definitionId === definitionId);
  },

  // count total quantity of a def on the board
  countOnBoard(definitionId) {
    return this.getBoardCards()
      .filter(c => c.definitionId === definitionId)
      .reduce((sum, c) => sum + (c.quantity ?? 1), 0);
  },

  setStat(stat, value) {
    const s = this.stats[stat];
    if (!s) return;
    const old = s.current;
    s.current = Math.max(0, Math.min(s.max, value));
    if (old !== s.current) {
      EventBus.emit('statChanged', { stat, oldVal: old, newVal: s.current });
    }
    // critical threshold checks
    const pct = s.current / s.max;
    if ((stat === 'hydration' || stat === 'nutrition') && pct < 0.1) {
      EventBus.emit('statCritical', { stat, value: s.current });
    }
    if ((stat === 'radiation' || stat === 'infection') && s.current > 70) {
      EventBus.emit('statCritical', { stat, value: s.current });
    }
    if (stat === 'fatigue' && s.current >= 95) {
      EventBus.emit('statCritical', { stat, value: s.current });
    }
  },

  modStat(stat, delta) {
    const s = this.stats[stat];
    if (!s) return;
    this.setStat(stat, s.current + delta);
  },

  _updateEncumbrance() {
    const total = Object.values(this.cards).reduce((sum, c) => {
      const def = window.__GAME_DATA__?.items[c.definitionId];
      return sum + ((def?.weight ?? 0) * (c.quantity ?? 1));
    }, 0);
    const enc = this.player.encumbrance;
    enc.current   = parseFloat(total.toFixed(2));
    const pct     = enc.max > 0 ? enc.current / enc.max : 0;
    enc.weightPct = pct;
    if      (pct <= 0.50) { enc.tier = 0; enc.tpMult = 1.0; }
    else if (pct <= 0.75) { enc.tier = 1; enc.tpMult = 1.2; }
    else if (pct <= 1.00) { enc.tier = 2; enc.tpMult = 1.5; }
    else if (pct <= 2.00) { enc.tier = 3; enc.tpMult = 2.0; }
    else                  { enc.tier = 4; enc.tpMult = 3.0; } // >200% — 이동 불가
  },

  serialize() {
    return JSON.stringify({
      time:     this.time,
      stats:    this.stats,
      player:   this.player,
      board:    this.board,
      cards:    this.cards,
      _nextId:  this._nextId,
      location: this.location,
      noise:    this.noise,
      crafting: this.crafting,
      combat:   this.combat,
      ui:            { currentState: this.ui.currentState, basecampMode: this.ui.basecampMode },
      flags:         this.flags,
      combatRespawn: this.combatRespawn,
      season:         this.season,
      weather:        this.weather,
      locationFloors: this.locationFloors,
    });
  },

  deserialize(jsonStr) {
    const d = JSON.parse(jsonStr);
    Object.assign(this.time,     d.time);
    Object.assign(this.stats,    d.stats);
    Object.assign(this.player,   d.player);
    // 구버전 세이브 호환: equipped 필드 자동 생성
    const equippedDefaults = {
      head:null, body:null, hands:null, offhand:null,
      face:null, weapon_main:null, weapon_sub:null,
      backpack:null, belt:null, accessory:null,
    };
    if (!this.player.equipped) {
      this.player.equipped = { ...equippedDefaults };
    } else {
      this.player.equipped = { ...equippedDefaults, ...this.player.equipped };
    }
    if (this.player.extraSlots === undefined) this.player.extraSlots = 0;
    if (!this.player.gender) this.player.gender = 'M';
    // 구버전 세이브 호환: stamina 필드 자동 생성
    if (!this.stats.stamina) this.stats.stamina = { current: 100, max: 100 };
    // 구버전 세이브 호환: encumbrance weightPct 필드
    if (this.player.encumbrance.weightPct === undefined) this.player.encumbrance.weightPct = 0;
    // 구버전 세이브 호환: top 행이 부족하면 7칸으로 확장
    if (d.board?.top && d.board.top.length < 7) {
      while (d.board.top.length < 7) d.board.top.push(null);
    }
    Object.assign(this.board,    d.board);
    this.cards   = d.cards;
    this._nextId = d._nextId;
    Object.assign(this.location, d.location);
    Object.assign(this.noise,    d.noise);
    Object.assign(this.crafting, d.crafting);
    Object.assign(this.combat,   d.combat);
    Object.assign(this.ui,       d.ui);
    if (d.flags) Object.assign(this.flags, d.flags);
    if (d.combatRespawn) Object.assign(this.combatRespawn, d.combatRespawn);
    // 구버전 세이브 호환: 엔딩 추적 플래그 기본값 보장
    const ef = this.flags;
    if (ef.totalKills          === undefined) ef.totalKills          = 0;
    if (ef.totalItemsFound     === undefined) ef.totalItemsFound     = 0;
    if (ef.totalCrafted        === undefined) ef.totalCrafted        = 0;
    if (ef.totalMedicalCrafted === undefined) ef.totalMedicalCrafted = 0;
    if (ef.structuresBuilt     === undefined) ef.structuresBuilt     = 0;
    if (ef.despairTicks        === undefined) ef.despairTicks        = 0;
    if (ef.nukeZoneEntered     === undefined) ef.nukeZoneEntered     = 0;
    if (ef.lastEnemyCount      === undefined) ef.lastEnemyCount      = 0;
    if (ef.yeongdeungpoVisited === undefined) ef.yeongdeungpoVisited = false;
    if (ef.seodaemunVisited    === undefined) ef.seodaemunVisited    = false;
    if (ef.songpaVisited       === undefined) ef.songpaVisited       = false;
    if (ef.jongnoVisited       === undefined) ef.jongnoVisited       = false;
    if (ef.infectionCured      === undefined) ef.infectionCured      = false;
    if (ef.collapseCount       === undefined) ef.collapseCount       = 0;
    if (ef.survivedSummer      === undefined) ef.survivedSummer      = false;
    // season 필드 복원 (구버전 세이브 호환)
    if (d.season) {
      Object.assign(this.season, d.season);
      if (!this.season.eventsTriggered) this.season.eventsTriggered = [];
    }
    // weather 필드 복원
    if (d.weather) Object.assign(this.weather, d.weather);
    // locationFloors 복원 (구버전 세이브 호환)
    this.locationFloors = d.locationFloors ?? {};
    // diseases 필드 복원 (구버전 세이브 호환)
    if (!this.player.diseases) this.player.diseases = [];
    // 구버전 세이브 호환: 필드 없으면 기본값
    if (!this.location.currentDistrict)  this.location.currentDistrict  = 'mapo';
    if (!this.location.currentNode)      this.location.currentNode      = this.location.currentDistrict;
    if (!this.location.districtsVisited) this.location.districtsVisited = [];
    if (!this.location.districtsLooted)  this.location.districtsLooted  = [];
    // 구버전 세이브 호환: 랜드마크 진입 상태 필드
    if (this.location.currentLandmark    === undefined) this.location.currentLandmark    = null;
    if (this.location.currentSubLocation === undefined) this.location.currentSubLocation = null;
    this._updateEncumbrance();
  },
};

export default GameState;
