// === CENTRAL GAME STATE SINGLETON ===
import EventBus  from './EventBus.js';
import GameData  from '../data/GameData.js';
import { lookupBagExtraSlots } from '../data/bagSlots.js';

// 페이지 단위 행 정의 — 압축·해금 트리거가 참조
const MIDDLE_PAGE_SIZE = 10;
const BOTTOM_PAGE1_SIZE = 20;

const GameState = {
  // ── time ──────────────────────────────────────────────
  time: {
    totalTP:    0,
    day:        1,
    tpInDay:    0,   // 0-71 (72 TP/day at 20-min intervals)
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
    stamina:     { current: 100, max: 100, decayPerTP: 0 },  // 스태미나: _updateStamina()가 별도 관리
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
    strength:                60,    // 체력(힘): 스태미나 상한의 기반 (캐릭터 생성 시 덮어씀)
    endurance:               60,    // 인내심: 체력→스태미나 변환 효율 (캐릭터 생성 시 덮어씀)
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
    // ── 스킬 숙련도 ─────────────────────────────────────────
    skills: {
      unarmed:     { xp: 0, level: 0 },  // 맨손격투
      melee:       { xp: 0, level: 0 },  // 근접무기
      ranged:      { xp: 0, level: 0 },  // 원거리무기
      defense:     { xp: 0, level: 0 },  // 방어술
      scavenging:  { xp: 0, level: 0 },  // 탐색
      medicine:    { xp: 0, level: 0 },  // 의료
      cooking:     { xp: 0, level: 0 },  // 요리
      harvesting:  { xp: 0, level: 0 },  // 자원채취
      crafting:    { xp: 0, level: 0 },  // 기초제작
      weaponcraft: { xp: 0, level: 0 },  // 무기제작
      armorcraft:  { xp: 0, level: 0 },  // 방어구제작
      building:    { xp: 0, level: 0 },  // 건설
    },
    equipped: {
      head:        null,  // 헬멧 등
      body:        null,  // 방어구 (조끼/풀바디/의복)
      hands:       null,  // 장갑
      face:        null,  // 방독면
      weapon_main: null,  // 주무기
      weapon_sub:  null,  // 보조무기 또는 방패 (겸용 슬롯)
      backpack:    null,  // 가방 (인벤토리 확장)
      boots:       null,  // 신발
      belt:        null,  // 허리띠 (잠금 예비)
      accessory:   null,  // 액세서리 (잠금 예비)
    },
    extraSlots:  0,       // 가방 장착으로 추가된 휴대 page2 슬롯 수 (0 = page2 미해금)
    middlePage3Unlocked: false,  // 1페이지 만차 → 2페이지 오버플로우 시 영속 해금
  },

  // ── board ─────────────────────────────────────────────
  // Each row: array of slot entries (null | instanceId)
  // middle: page1(0~9) + page2(10~19) 항상, page3(20~29)은 middlePage3Unlocked 시
  // bottom: page1(0~19) + page2(20~20+extraSlots-1, 가방 장착 시)
  board: {
    top:         [null, null, null, null, null, null, null, null, null, null], // 10칸
    environment: [null, null, null],  // 3칸
    middle:      [null,null,null,null,null,null,null,null,null,null,
                  null,null,null,null,null,null,null,null,null,null],  // 바닥 20칸 (page1 10 + page2 10)
    bottom:      [null,null,null,null,null,null,null,null,null,null,
                  null,null,null,null,null,null,null,null,null,null],  // 휴대 page1 20칸
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
    installedStructures: {},     // { districtId: { id, durability, maxDurability } } — 구역 고정 구조물
  },

  // ── 위치별 바닥 아이템 저장 ──────────────────────────
  // { [districtId]: instanceId[] } — 각 지역에 남겨진 바닥 아이템
  locationFloors: {},

  // ── 랜드마크 탐색 이력 ─────────────────────────────
  // { [subLocId]: visitCount } — 세부 장소별 탐색 횟수
  landmarkHistory: {},

  // ── 지하철역 탐색 이력 ─────────────────────────────
  // { [districtId]: visitCount } — 역별 탐색 횟수
  subwayStationVisits: {},

  // ── 서브로케이션 재고 (W3-2 Phase A) ──────────────
  // { [subLocId]: { stock, baseStock, lastDecayDay } }
  // stock        = 남은 루팅 잠재력 (0~baseStock, 정수)
  // baseStock    = 초기값 (lootCount[1] = max 기준, lazy-init)
  // lastDecayDay = 마지막 -1/일 감소 적용 day (같은 day 중복 차감 방지)
  subLocationStock: {},

  // ── 베이스캠프 거점 ────────────────────────────────
  basecamp: {
    built:      false, // 안전 가옥 건설 여부 (Day 7+ 이후 건설 가능)
    buildStage: 0,     // 건설 단계 0=미시작, 1=기초, 2=설비, 3=완공(랜드마크)
    level:      0,     // 강화 단계 0-5 (built=true 이후에만 진행)
    xp:         0,     // 거점 경험치
    landmarkCardInstanceId: null, // 완공 시 생성된 랜드마크 카드 instanceId
  },

  // ── 퀘스트 ────────────────────────────────────────
  quests: {
    active:    [],    // [{ id, progress, startDay }]
    completed: [],    // [id, ...]
  },

  // subObjective 완료 플래그: { [questId]: { [subId]: true } }
  // QuestSystem._reevaluateSubObjectives()가 갱신, 완료 알림 1회성 가드.
  subObjectiveProgress: {},

  // QuestSystem._progress의 외부 참조용 미러 (DailyFocus 등). null = 아직 한 번도 갱신 안 됨.
  questProgress: null,

  // ── noise ─────────────────────────────────────────────
  noise: {
    level:          0,
    decayPerTP:     1.0,
    influxThreshold:60,
    influxTriggered:false,
  },

  // ── crafting ──────────────────────────────────────────
  crafting: {
    // 스테이지 단위 즉시 소비 모델: 각 단계 시작 시 TickEngine.skipTP(tpCost)로 시간을 즉시 소비하고
    // 멈춘다. awaitingNext=true면 다음 단계 재료 투입(카드 드롭/버튼)을 기다리는 상태.
    activeQueue: [],   // [{ blueprintId, stageIndex, craftCardId, awaitingNext }]
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
    bottomPage:    0,            // 휴대 행 현재 페이지 (0 또는 1)
    middlePage:    0,            // 바닥 행 현재 페이지 (0~2)
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
    tpRemaining: 72,
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
    tutorialSeen:         false,
    firstBlood:           false,
    firstNightHintShown:  false,
    // ── 엔딩 추적 ──────────────────────────────────────
    totalKills:          0,    // 누적 처치 수
    totalItemsFound:     0,    // 누적 발견 아이템 수
    totalCrafted:        0,    // 누적 제작 횟수
    totalMedicalCrafted: 0,    // 의료 카테고리 제작 횟수
    totalFoodCrafted:    0,    // 음식 카테고리 제작 횟수
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
    // ── 서울 지도 조각 ────────────────────────────────
    mapFragments:  [],     // 수집한 조각 ['north','center','south']
    mapUnlocked:   false,  // 3개 완성 시 true → 전체 지도 해금
    // ── 숨겨진 요소 추적 ──────────────────────────────
    hiddenLocationsDiscovered: [],  // 발견한 히든 장소 ID 배열
    bossesKilled:              [],  // 처치한 보스 ID 배열
    legendaryItemsFound:       [],  // 획득한 전설 아이템 ID 배열
    secretEventsTriggered:     [],  // 발생한 비밀 이벤트 ID 배열
    hiddenRecipesUnlocked:     [],  // 해금한 레시피 ID 배열
    eventChainProgress:        {},  // { chainId: stepNumber }
    stealthKills:              0,   // 무소음 무기 크리킬 카운터
    diseaseCured:              0,   // 질병 치료 카운터
    meleeKills:                0,   // 근접무기 킬 카운터
    // ── 보라매병원 습격 스케줄 ────────────────────────
    nextSiegeDay:              null, // 다음 습격 예정일 (null = 초기화 대기)
    siegeCount:                0,    // 누적 습격 횟수
    // ── sublocation 1회 한정 자동 보상 수령 이력 ──────
    // 'districtId:subLocationId' 키 배열. ExploreSystem._grantFirstEnterReward 참조.
    firstEnterRewardsClaimed:  [],
  },

  // ── 런타임 랜드마크 오버라이드 ────────────────────────
  // { [landmarkId]: { [subLocationId]: { dangerModDelta: number } } }
  // HospitalSiegeSystem 등이 누적 위험도 증가를 런타임에 반영할 때 사용.
  landmarkOverrides: {},

  // ── HELPERS ───────────────────────────────────────────
  createCardInstance(definitionId, overrides = {}) {
    const { items } = GameData;
    const def = items[definitionId];
    if (!def) return null;

    const id = 'c' + (this._nextId++);
    // 엔지니어 능력: 구조물 카드 생성 시 내구도 보너스 적용
    const isStructure = def.type === 'structure' || def.subtype === 'structure';
    const durBonus = isStructure ? (this.player?.structureDurabilityBonus ?? 1.0) : 1.0;
    const baseDur = overrides.durability ?? def.defaultDurability ?? 100;
    const instance = {
      instanceId:    id,
      definitionId,
      quantity:      overrides.quantity      ?? (def.stackable ? 1 : 1),
      durability:    Math.round(baseDur * durBonus),
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
    for (const row of ['top', 'environment', 'middle', 'bottom']) {
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
    // 빈 칸이 생기면 middle·bottom 자동 압축
    this._compactRow('middle');
    this._compactRow('bottom');
    this._updateEncumbrance();
    // 슬롯이 비었으므로 대기 루트 자동 배치 시도
    this.flushPendingLoot();
  },

  // 대기 중인 루트를 빈 슬롯에 순서대로 배치
  flushPendingLoot() {
    if (!this.pendingLoot?.length) return;
    const placed = [];
    const remaining = [];
    for (const entry of this.pendingLoot) {
      const inst = this.createCardInstance(entry.definitionId, {
        quantity:      entry.quantity,
        contamination: entry.contamination ?? 0,
      });
      if (!inst) continue;
      const result = this.placeCardInRow(inst.instanceId, 'middle');
      if (result) {
        placed.push(entry);
      } else {
        this.removeCardInstanceSilent(inst.instanceId);
        remaining.push(entry);
      }
    }
    this.pendingLoot = remaining;
    if (placed.length > 0) {
      const names = placed.map(e => {
        const def = GameData?.items[e.definitionId];
        return `${def?.icon ?? ''} ${def?.name ?? e.definitionId}`;
      });
      EventBus.emit('notify', { message: `📦 대기 아이템 배치: ${names.join(', ')}`, type: 'good' });
    }
  },

  // removeCardInstance의 silent 버전 (pendingLoot flush 재귀 방지)
  removeCardInstanceSilent(instanceId) {
    delete this.cards[instanceId];
    for (const row of ['top', 'environment', 'middle', 'bottom']) {
      this.board[row] = this.board[row].map(v => v === instanceId ? null : v);
    }
    this._compactRow('middle');
    this._compactRow('bottom');
    this._updateEncumbrance();
  },

  getCardDef(instanceId) {
    const inst = this.cards[instanceId];
    if (!inst) return null;
    return GameData.items[inst.definitionId];
  },

  // 페이지 단위 행의 페이지 경계 배열을 반환 — _compactRowPaged·렌더링 공통
  // 각 항목 = { start, size }
  _getPageRanges(row) {
    if (row === 'middle') {
      const total = this.board.middle?.length ?? 20;
      const ranges = [];
      for (let start = 0; start < total; start += MIDDLE_PAGE_SIZE) {
        ranges.push({ start, size: MIDDLE_PAGE_SIZE });
      }
      return ranges;
    }
    if (row === 'bottom') {
      const extra = this.player?.extraSlots ?? 0;
      const ranges = [{ start: 0, size: BOTTOM_PAGE1_SIZE }];
      if (extra > 0) ranges.push({ start: BOTTOM_PAGE1_SIZE, size: extra });
      return ranges;
    }
    return null;
  },

  // find first empty slot in a row (returns index or -1)
  // 페이지 단위 행은 page1 → page2 → page3 순으로 빈 슬롯 탐색.
  // bottom: page1(20) → page2(extraSlots). middle: 활성 페이지 모두 순차.
  findEmptySlot(row) {
    const arr = this.board[row];
    const pages = this._getPageRanges(row);
    if (pages) {
      for (const { start, size } of pages) {
        for (let i = start; i < start + size; i++) {
          if (arr[i] === null) return i;
        }
      }
      return -1;
    }
    return arr.findIndex(v => v === null);
  },

  // middle·bottom 행의 null + 유효하지 않은 참조(cards[]에 없는 board 항목)를 뒤로 밀어
  // 빈 칸 압축. 페이지 경계 보존 — 페이지 1의 빈 칸이 페이지 2 카드를 끌어오지 않는다.
  // orphan 필터링: instanceId 문자열이 아니거나 cards[]에 매핑이 없는 항목은
  // 시각적으로 빈 슬롯이지만 findEmptySlot이 건너뛰는 invisible occupant가 되므로
  // 압축 시 함께 제거한다.
  _compactRow(row) {
    const arr   = this.board[row];
    const isValid = (v) => typeof v === 'string' && this.cards[v] != null;
    const pages = this._getPageRanges(row);
    if (pages) {
      const next = [...arr];
      for (const { start, size } of pages) {
        const slice  = arr.slice(start, start + size);
        const filled = slice.filter(isValid);
        const padded = [...filled, ...Array(size - filled.length).fill(null)];
        for (let i = 0; i < size; i++) next[start + i] = padded[i];
      }
      this.board[row] = next;
      return;
    }
    const filled = arr.filter(isValid);
    this.board[row] = [...filled, ...Array(arr.length - filled.length).fill(null)];
  },

  // 1페이지 만차 상태에서 카드가 페이지 2(슬롯 10~19)에 떨어지면 영속 해금.
  // 이미 해금되어 있거나 다른 페이지·다른 행이면 no-op.
  _maybeUnlockMiddlePage3(row, slot) {
    if (row !== 'middle') return;
    if (this.player?.middlePage3Unlocked) return;
    if (slot < MIDDLE_PAGE_SIZE || slot >= MIDDLE_PAGE_SIZE * 2) return;
    const page1Full = this.board.middle.slice(0, MIDDLE_PAGE_SIZE).every(v => v !== null);
    if (!page1Full) return;
    this.player.middlePage3Unlocked = true;
    this.board.middle = [
      ...this.board.middle,
      ...Array(MIDDLE_PAGE_SIZE).fill(null),
    ];
    EventBus.emit('middlePage3Unlocked', {});
  },

  // place a card instance in first available slot of a row
  // 일반 아이템은 top(장소) 행에 절대 배치하지 않음
  // NPC 카드는 middle만 허용(bottom 폴백 금지) — 빈칸 없으면 pendingLoot 보관
  placeCardInRow(instanceId, preferredRow = null) {
    const inst = this.cards[instanceId];
    const def  = GameData?.items[inst?.definitionId];
    const isLocation = def?.type === 'location';
    const isNPC      = def?.type === 'npc';

    if (isNPC) {
      const idx = this.findEmptySlot('middle');
      if (idx !== -1) {
        this.board.middle[idx] = instanceId;
        this._maybeUnlockMiddlePage3('middle', idx);
        EventBus.emit('cardPlaced', { instanceId, row: 'middle', slot: idx });
        return { row: 'middle', slot: idx };
      }
      this.pendingLoot = [...(this.pendingLoot ?? []), {
        definitionId: inst.definitionId,
        quantity:     1,
        contamination: 0,
      }];
      this.removeCardInstanceSilent(instanceId);
      return null;
    }

    // 장소 카드: top 우선, 일반 카드: middle/bottom만 허용
    const rows = isLocation
      ? (preferredRow ? [preferredRow, ...['top','middle','bottom'].filter(r => r !== preferredRow)] : ['top', 'middle', 'bottom'])
      : (preferredRow === 'top' ? ['middle', 'bottom'] : (preferredRow ? [preferredRow, ...['middle','bottom'].filter(r => r !== preferredRow)] : ['middle', 'bottom']));

    // 스택 아이템: 기존 스택에 먼저 합산
    if (!isLocation && def?.stackable && inst) {
      for (const row of rows) {
        for (const existingId of this.board[row]) {
          if (!existingId || existingId === instanceId) continue;
          const existing = this.cards[existingId];
          if (!existing || existing.definitionId !== inst.definitionId) continue;
          const maxStack  = def.maxStack ?? 99;
          const available = maxStack - (existing.quantity ?? 1);
          if (available <= 0) continue;
          const transfer  = Math.min(available, inst.quantity ?? 1);
          existing.quantity = (existing.quantity ?? 1) + transfer;
          inst.quantity     = (inst.quantity     ?? 1) - transfer;
          if (inst.quantity <= 0) {
            // 완전히 합산됨 — 새 인스턴스 제거
            delete this.cards[instanceId];
            this._updateEncumbrance();
            const slot = this.board[row].indexOf(existingId);
            EventBus.emit('cardPlaced', { instanceId: existingId, row, slot });
            return { row, slot, instanceId: existingId };
          }
        }
      }
      // 수량이 남았으면 아래 빈 슬롯 배치로 이어짐
    }

    for (const row of rows) {
      const idx = this.findEmptySlot(row);
      if (idx !== -1) {
        this.board[row][idx] = instanceId;
        this._maybeUnlockMiddlePage3(row, idx);
        EventBus.emit('cardPlaced', { instanceId, row, slot: idx });
        return { row, slot: idx };
      }
    }
    return null;
  },

  // get all cards currently on the board
  getBoardCards() {
    const result = [];
    for (const row of ['top', 'environment', 'middle', 'bottom']) {
      for (const id of this.board[row]) {
        if (id && this.cards[id] && !this.cards[id]._crafting) result.push(this.cards[id]);
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
    // 감염 증가분에 한해 rateMultiplier 적용 (의사 -35% 등)
    let d = delta;
    if (stat === 'infection' && d > 0) {
      const mult = s.rateMultiplier ?? 1.0;
      d = d * mult;
    }
    this.setStat(stat, s.current + d);
  },

  // ── 서브로케이션 재고 헬퍼 (W3-2 Phase A) ──────────────
  // 최초 진입 시 호출 — baseStock 지정 (lootCount[1] = max 권장)
  // 이미 초기화된 경우 no-op.
  initSubLocationStock(subLocId, baseStock) {
    if (!subLocId || baseStock == null || baseStock < 0) return;
    if (this.subLocationStock[subLocId]) return;
    this.subLocationStock = {
      ...this.subLocationStock,
      [subLocId]: {
        stock:        baseStock,
        baseStock:    baseStock,
        lastDecayDay: null,
      },
    };
  },

  // 방문/소비 시 차감 (min 0). 미초기화 sub-loc은 no-op.
  consumeSubLocationStock(subLocId, amount = 1) {
    const entry = this.subLocationStock?.[subLocId];
    if (!entry) return;
    const next = Math.max(0, (entry.stock ?? 0) - Math.max(0, amount));
    this.subLocationStock = {
      ...this.subLocationStock,
      [subLocId]: { ...entry, stock: next },
    };
  },

  // 현재 재고 비율 조회 (UI/로직용). 미초기화 = 1.0, baseStock 0 = 1.0.
  getSubLocationStockRatio(subLocId) {
    const entry = this.subLocationStock?.[subLocId];
    if (!entry) return 1.0;
    if (!entry.baseStock || entry.baseStock <= 0) return 1.0;
    return Math.max(0, Math.min(1, entry.stock / entry.baseStock));
  },

  // 일자 경과 자동 감소 — 같은 day 중복 호출 방지.
  // 건너뛴 day 수와 무관하게 1회 호출당 decayAmount만 차감 (정책 채택안).
  decaySubLocationStock(subLocId, currentDay, decayAmount = 1) {
    const entry = this.subLocationStock?.[subLocId];
    if (!entry) return;
    if (entry.lastDecayDay === currentDay) return;
    const next = Math.max(0, (entry.stock ?? 0) - Math.max(0, decayAmount));
    this.subLocationStock = {
      ...this.subLocationStock,
      [subLocId]: { ...entry, stock: next, lastDecayDay: currentDay },
    };
  },

  // 초기화된 모든 sub-loc 일괄 감소 (TickEngine day rollover에서 호출 예정).
  decayAllSubLocationStocks(currentDay, decayAmount = 1) {
    const next = { ...this.subLocationStock };
    for (const id of Object.keys(next)) {
      const entry = next[id];
      if (!entry || entry.lastDecayDay === currentDay) continue;
      const stock = Math.max(0, (entry.stock ?? 0) - Math.max(0, decayAmount));
      next[id] = { ...entry, stock, lastDecayDay: currentDay };
    }
    this.subLocationStock = next;
  },

  // 런타임 dangerMod 오버라이드 조회 — 없으면 0
  getLandmarkDangerModDelta(landmarkId, subLocationId) {
    const lm = this.landmarkOverrides?.[landmarkId];
    if (!lm) return 0;
    const sub = lm[subLocationId];
    return sub?.dangerModDelta ?? 0;
  },

  addLandmarkDangerMod(landmarkId, subLocationId, delta) {
    const overrides = { ...(this.landmarkOverrides ?? {}) };
    const lmEntry = { ...(overrides[landmarkId] ?? {}) };
    const subEntry = { ...(lmEntry[subLocationId] ?? {}) };
    subEntry.dangerModDelta = (subEntry.dangerModDelta ?? 0) + delta;
    lmEntry[subLocationId] = subEntry;
    overrides[landmarkId] = lmEntry;
    this.landmarkOverrides = overrides;
  },

  _updateEncumbrance() {
    // 적재량은 플레이어가 실제 소지한 카드만 합산: 휴대(bottom) + 장착(equipped).
    // 바닥(middle)·장소(top)·environment·타지역 locationFloors 잔존 인스턴스를
    // 포함하면 바닥에 스폰된 잔해(wrecked_bus 등)만으로 이동이 차단된다.
    const carriedIds = new Set([
      ...this.board.bottom.filter(Boolean),
      ...Object.values(this.player.equipped ?? {}).filter(Boolean),
    ]);
    let total = 0;
    for (const id of carriedIds) {
      const c = this.cards[id];
      if (!c) continue;
      const def = GameData?.items[c.definitionId];
      total += (def?.weight ?? 0) * (c.quantity ?? 1);
    }
    const enc = this.player.encumbrance;
    enc.current   = parseFloat(total.toFixed(2));
    const pct     = enc.max > 0 ? enc.current / enc.max : 0;
    enc.weightPct = pct;
    // tpMult는 이동·탐색 TP 비용 배율(EncumbranceSystem.applyCost)에 쓰인다.
    // TP는 정수 올림이라 1.2 같은 소수 배율도 1TP 행동을 2TP로 만들어 버리므로
    // 과적(>100%) 구간에서만 배율을 부여한다.
    if      (pct <= 0.50) { enc.tier = 0; enc.tpMult = 1.0; }
    else if (pct <= 0.75) { enc.tier = 1; enc.tpMult = 1.0; }
    else if (pct <= 1.00) { enc.tier = 2; enc.tpMult = 1.0; }
    else if (pct <= 2.00) { enc.tier = 3; enc.tpMult = 1.2; }
    else                  { enc.tier = 4; enc.tpMult = 1.2; } // >200% — 이동 불가
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
      ui:            {
        currentState: this.ui.currentState,
        basecampMode: this.ui.basecampMode,
        bottomPage:   this.ui.bottomPage ?? 0,
        middlePage:   this.ui.middlePage ?? 0,
      },
      flags:           this.flags,
      combatRespawn:   this.combatRespawn,
      season:          this.season,
      weather:         this.weather,
      locationFloors:  this.locationFloors,
      pendingLoot:     this.pendingLoot ?? [],
      landmarkHistory:     this.landmarkHistory,
      subwayStationVisits: this.subwayStationVisits,
      subLocationStock:    this.subLocationStock ?? {},
      basecamp:            this.basecamp,
      quests:          this.quests,
      ecology:         this.ecology ?? null,
      mental:          this.mental ?? null,
      discoveries:     this.discoveries ?? null,
      npcs:            this.npcs ?? null,
      companions:      this.companions ?? null,
      body:            this.body ?? null,
      landmarkOverrides: this.landmarkOverrides ?? {},
      hospital:          this.hospital ?? null,
    });
  },

  deserialize(jsonStr) {
    const d = JSON.parse(jsonStr);
    Object.assign(this.time,     d.time);
    Object.assign(this.stats,    d.stats);
    Object.assign(this.player,   d.player);
    // 구버전 세이브 호환: equipped 필드 자동 생성
    const equippedDefaults = {
      head:null, body:null, hands:null,
      face:null, weapon_main:null, weapon_sub:null,
      backpack:null, boots:null, belt:null, accessory:null,
    };
    if (!this.player.equipped) {
      this.player.equipped = { ...equippedDefaults };
    } else {
      this.player.equipped = { ...equippedDefaults, ...this.player.equipped };
    }
    // 구버전 세이브 호환: offhand 슬롯 → weapon_sub로 마이그레이션
    if (this.player.equipped.offhand && !this.player.equipped.weapon_sub) {
      this.player.equipped.weapon_sub = this.player.equipped.offhand;
    }
    delete this.player.equipped.offhand;
    if (this.player.extraSlots === undefined) this.player.extraSlots = 0;
    if (this.player.middlePage3Unlocked === undefined) this.player.middlePage3Unlocked = false;
    if (!this.player.gender) this.player.gender = 'M';
    // 구버전 세이브 호환: stamina 필드 자동 생성 + decayPerTP 누락 보정
    if (!this.stats.stamina) this.stats.stamina = { current: 100, max: 100, decayPerTP: 0 };
    if (this.stats.stamina.decayPerTP == null) this.stats.stamina.decayPerTP = 0;
    // 구버전 세이브 호환: strength/endurance 필드 (체력·인내심)
    if (this.player.strength  == null) this.player.strength  = 60;
    if (this.player.endurance == null) this.player.endurance = 60;
    // 구버전 세이브 호환: encumbrance weightPct 필드
    if (this.player.encumbrance.weightPct === undefined) this.player.encumbrance.weightPct = 0;
    // 구버전 세이브 호환: top 행 10칸으로 확장
    if (d.board?.top && d.board.top.length < 10) while (d.board.top.length < 10) d.board.top.push(null);
    // 페이지 단위 마이그레이션: middle 길이 10 → 20 (+ page3 해금 시 30)
    if (d.board?.middle) {
      const mLen = d.board.middle.length;
      if (this.player.middlePage3Unlocked) {
        while (d.board.middle.length < 30) d.board.middle.push(null);
      } else if (mLen >= 30) {
        // 길이 30이지만 플래그 누락 — 길이를 신뢰해 해금 상태로 복원
        this.player.middlePage3Unlocked = true;
      } else {
        while (d.board.middle.length < 20) d.board.middle.push(null);
      }
    }
    // 페이지 단위 마이그레이션: bottom
    // 구포맷: length === 20 (page1=0~9, page2=10~10+oldExtra-1, 나머지 잠금)
    // 신포맷: length === 20 + extraSlots (page1=0~19, page2=20~)
    if (d.board?.bottom) {
      const equippedBagId = this.player.equipped?.backpack;
      const bagDefId = equippedBagId
        ? (this.cards?.[equippedBagId]?.definitionId ?? d.cards?.[equippedBagId]?.definitionId)
        : null;
      const bagDef   = bagDefId ? GameData?.items?.[bagDefId] : null;
      const newExtra = lookupBagExtraSlots(bagDef);
      const oldArr   = d.board.bottom.slice();
      const newLen   = BOTTOM_PAGE1_SIZE + newExtra;
      const newArr   = Array(newLen).fill(null);
      const isOldFormat = oldArr.length === 20 && (this.player.extraSlots ?? 0) <= 10;
      const orphans = [];

      if (isOldFormat) {
        const oldExtra = this.player.extraSlots ?? 0;
        // page1 앞쪽: 구 0~9 → 신 0~9
        for (let i = 0; i < 10; i++) newArr[i] = oldArr[i] ?? null;
        // page2: 구 10~10+oldExtra-1 → 신 20~20+min(oldExtra,newExtra)-1
        const carry = Math.min(oldExtra, newExtra);
        for (let i = 0; i < carry; i++) {
          newArr[BOTTOM_PAGE1_SIZE + i] = oldArr[10 + i] ?? null;
        }
        // 신 page2가 더 작으면 초과 카드는 orphan
        for (let i = carry; i < oldExtra; i++) {
          if (oldArr[10 + i] != null) orphans.push(oldArr[10 + i]);
        }
        // 구 잠긴 슬롯(10+oldExtra ~ 19) 카드도 orphan
        for (let i = 10 + oldExtra; i < 20; i++) {
          if (oldArr[i] != null) orphans.push(oldArr[i]);
        }
      } else {
        // 신포맷: page1 그대로 복사, page2는 newExtra 길이까지만
        for (let i = 0; i < 20 && i < oldArr.length; i++) newArr[i] = oldArr[i] ?? null;
        const oldExtraNew = Math.max(0, oldArr.length - 20);
        const carry = Math.min(oldExtraNew, newExtra);
        for (let i = 0; i < carry; i++) {
          newArr[BOTTOM_PAGE1_SIZE + i] = oldArr[20 + i] ?? null;
        }
        for (let i = carry; i < oldExtraNew; i++) {
          if (oldArr[20 + i] != null) orphans.push(oldArr[20 + i]);
        }
      }

      // orphan 회수: 신 page1의 빈자리(10~19 우선, 그 다음 0~9)
      let cursor = 10;
      for (const id of orphans) {
        while (cursor < 20 && newArr[cursor] != null) cursor++;
        if (cursor >= 20) {
          cursor = 0;
          while (cursor < 10 && newArr[cursor] != null) cursor++;
        }
        if (cursor < 20) newArr[cursor++] = id;
        else if (this.cards?.[id]) {
          this.pendingLoot = [...(this.pendingLoot ?? []), {
            definitionId: this.cards[id].definitionId,
            quantity:     this.cards[id].quantity ?? 1,
            contamination: this.cards[id].contamination ?? 0,
          }];
        }
      }

      d.board.bottom = newArr;
      this.player.extraSlots = newExtra;
    }
    // 구버전 세이브 호환: environment 행이 없으면 자동 생성
    if (!d.board.environment) d.board.environment = [null, null, null];
    while (d.board.environment.length < 3) d.board.environment.push(null);
    Object.assign(this.board,    d.board);
    this.cards   = d.cards;
    this._nextId = d._nextId;
    // 구버전 세이브 호환: middle/bottom에 흩어진 빈 슬롯이 남아 있을 수 있어
    // 페이지 단위로 한 번 압축해 가운데 구멍을 정리한다 (consolidate/오프닝 버그 자가 치유).
    this._compactRow('middle');
    this._compactRow('bottom');
    Object.assign(this.location, d.location);
    Object.assign(this.noise,    d.noise);
    Object.assign(this.crafting, d.crafting);
    // 구버전 세이브 호환: 제작이 외부 TP로 자동 진행되던 옛 모델 → 즉시 소비 모델로 정규화.
    // 진행 중이던 제작은 "현재 단계 대기(awaitingNext)" 상태로 전환해 '이어서 제작'으로 재개 가능하게 한다.
    if (Array.isArray(this.crafting.activeQueue)) {
      for (const entry of this.crafting.activeQueue) {
        if (entry.awaitingNext === undefined) entry.awaitingNext = true;
        const ce = entry.craftCardId ? this.cards[entry.craftCardId]?._craftEntry : null;
        if (ce && ce.awaitingNext === undefined) ce.awaitingNext = true;
      }
    }
    Object.assign(this.combat,   d.combat);
    // 저장 파일에서 encounter/combat 상태로 복원 시 이후 화면 불일치 문제 방지:
    // ui.currentState가 encounter/combat이면 'main'으로 강제 복원 (전투 데이터 없이는 화면 렌더 불가)
    const savedState = d.ui?.currentState;
    if (savedState === 'encounter' || savedState === 'combat' || savedState === 'combat_result') {
      console.warn(`[GameState] 저장된 state "${savedState}"는 불완전. 'main'으로 복원.`);
      d.ui = { ...d.ui, currentState: 'main' };
    }
    Object.assign(this.ui,       d.ui);
    if (this.ui.bottomPage == null) this.ui.bottomPage = 0;
    if (this.ui.middlePage == null) this.ui.middlePage = 0;
    // 페이지 인덱스 클램프: 가방 해제·page3 미해금 등으로 범위 밖이면 0
    const maxBottomPage = (this.player.extraSlots ?? 0) > 0 ? 1 : 0;
    const maxMiddlePage = this.player.middlePage3Unlocked ? 2 : 1;
    if (this.ui.bottomPage > maxBottomPage) this.ui.bottomPage = 0;
    if (this.ui.middlePage > maxMiddlePage) this.ui.middlePage = 0;
    if (d.flags) Object.assign(this.flags, d.flags);
    // 구버전 세이브 호환: 지도 조각 필드
    if (!this.flags.mapFragments) this.flags.mapFragments = [];
    if (this.flags.mapUnlocked === undefined) this.flags.mapUnlocked = false;
    if (d.combatRespawn) Object.assign(this.combatRespawn, d.combatRespawn);
    // 구버전 세이브 호환: 엔딩 추적 플래그 기본값 보장
    const ef = this.flags;
    if (ef.totalKills          === undefined) ef.totalKills          = 0;
    if (ef.totalItemsFound     === undefined) ef.totalItemsFound     = 0;
    if (ef.totalCrafted        === undefined) ef.totalCrafted        = 0;
    if (ef.totalMedicalCrafted === undefined) ef.totalMedicalCrafted = 0;
    if (ef.totalFoodCrafted    === undefined) ef.totalFoodCrafted    = 0;
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
    // 구버전 세이브 호환: 숨겨진 요소 추적 필드
    if (!ef.hiddenLocationsDiscovered)  ef.hiddenLocationsDiscovered  = [];
    if (!ef.bossesKilled)               ef.bossesKilled               = [];
    if (!ef.legendaryItemsFound)        ef.legendaryItemsFound        = [];
    if (!ef.secretEventsTriggered)      ef.secretEventsTriggered      = [];
    if (!ef.hiddenRecipesUnlocked)      ef.hiddenRecipesUnlocked      = [];
    if (!ef.eventChainProgress)         ef.eventChainProgress         = {};
    if (ef.stealthKills  === undefined) ef.stealthKills               = 0;
    if (ef.diseaseCured  === undefined) ef.diseaseCured               = 0;
    if (ef.meleeKills    === undefined) ef.meleeKills                 = 0;
    if (!ef._hiddenLocationLastVisit)   ef._hiddenLocationLastVisit   = {};
    if (!ef.districtExploration)        ef.districtExploration        = {};  // 지역 탐사도(%) — Phase 3
    // season 필드 복원 (구버전 세이브 호환)
    if (d.season) {
      Object.assign(this.season, d.season);
      if (!this.season.eventsTriggered) this.season.eventsTriggered = [];
    }
    // weather 필드 복원
    if (d.weather) Object.assign(this.weather, d.weather);
    // locationFloors 복원 (구버전 세이브 호환)
    this.locationFloors  = d.locationFloors  ?? {};
    this.pendingLoot     = d.pendingLoot     ?? [];
    // 랜드마크 탐색 이력 복원
    this.landmarkHistory     = d.landmarkHistory     ?? {};
    this.subwayStationVisits = d.subwayStationVisits ?? {};
    // 서브로케이션 재고 복원 (W3-2 Phase A — 구버전 세이브 호환)
    this.subLocationStock    = d.subLocationStock    ?? {};
    // 베이스캠프 복원 (구버전 세이브 마이그레이션)
    if (d.basecamp) {
      Object.assign(this.basecamp, d.basecamp);
      if (this.basecamp.level > 0 && !this.basecamp.built) this.basecamp.built = true;
      // 구버전: built=true지만 buildStage가 없으면 3으로 마이그레이션
      if (this.basecamp.built && !this.basecamp.buildStage) this.basecamp.buildStage = 3;
      if (!this.basecamp.landmarkCardInstanceId) this.basecamp.landmarkCardInstanceId = null;
    }
    // 퀘스트 복원
    if (d.quests) Object.assign(this.quests, d.quests);
    // 생태계 복원 (구버전 세이브 호환: EcologySystem.ensureInitialized()가 처리)
    if (d.ecology) this.ecology = d.ecology;
    // 심리 상태 복원 (구버전 세이브 호환: MentalSystem.ensureInitialized()가 처리)
    if (d.mental) this.mental = d.mental;
    // 발견 기록 복원
    if (d.discoveries) this.discoveries = d.discoveries;
    // NPC 시스템 복원 (구버전 세이브 호환: NPCSystem.ensureInitialized()가 처리)
    if (d.npcs) this.npcs = d.npcs;
    if (d.companions) this.companions = d.companions;
    // 신체 부위 부상 시스템 복원 (구버전 세이브 호환: BodySystem.ensureInitialized()가 처리)
    if (d.body) this.body = d.body;
    // 런타임 랜드마크 오버라이드 (HospitalSiegeSystem 등에서 누적)
    this.landmarkOverrides = d.landmarkOverrides ?? {};
    if (d.hospital) this.hospital = d.hospital;
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
    // 구버전 세이브 호환: 구역 고정 구조물 필드
    if (!this.location.installedStructures) this.location.installedStructures = {};
    // 구버전 마이그레이션: 문자열 형태 → 객체 형태 { id, durability, maxDurability }
    for (const [distId, val] of Object.entries(this.location.installedStructures)) {
      if (typeof val === 'string') {
        const sDef = GameData?.items?.[val];
        const dur = sDef?.defaultDurability ?? 100;
        this.location.installedStructures[distId] = { id: val, durability: dur, maxDurability: dur };
      }
    }
    // 구버전 세이브 호환: skills 필드 자동 생성
    const allSkillIds = ['unarmed','melee','ranged','defense','scavenging','medicine','cooking','harvesting','crafting','weaponcraft','armorcraft','building'];
    if (!this.player.skills) {
      this.player.skills = Object.fromEntries(allSkillIds.map(id => [id, { xp: 0, level: 0 }]));
    } else {
      for (const id of allSkillIds) {
        if (!this.player.skills[id]) this.player.skills[id] = { xp: 0, level: 0 };
      }
    }
    this._updateEncumbrance();
  },
};

export default GameState;
