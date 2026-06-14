// === DATA EDITOR — main app ===
import {
  DATA_FILES,
  ITEM_FILE_KEYS,
  QUEST_FILE_KEYS,
  extractValue,
  spliceObjectLiteral,
  diffValue,
} from './serialize.js';
import {
  getInfo,
  getFileText,
  saveFiles,
  pushChanges,
} from './api.js';

const state = {
  branch: '?',          // current local git branch (from serve.js)
  gitAvailable: false,  // git executable found on server PATH
  gitReason: '',        // why git unavailable (if so)
  commitMsg: 'data: 에디터에서 데이터 수정',
  files: {},            // key -> { text, data }
  itemIds: new Set(),   // valid item definition ids (for validation/autocomplete)
  itemNames: new Map(), // item id -> 표시 이름
  items: {},            // full item definitions (read-only 참조용)
  itemSearch: '',       // 아이템 탭 검색어
  tab: 'balance',
  sel: {},              // tab -> selected sub-key
};

const $ = (sel, root = document) => root.querySelector(sel);
const view = $('#view');

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c) node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

function status(msg, kind = 'info') {
  const s = $('#status');
  s.hidden = false;
  s.className = `status ${kind}`;
  s.textContent = msg;
}

// 편집 핸들러가 호출 — 실제 변경 여부를 다시 계산해 UI 동기화
function markDirty() {
  refreshChangeCount();
}

// 원본 대비 변경된 파일 키 목록 (플래그가 아니라 실제 diff 기반)
function changedFileKeys() {
  return [...new Set(computeChanges().map((g) => g.fileKey))];
}

// id → 표시 이름 헬퍼
function itemName(id) {
  return id && state.itemNames.get(id) ? state.itemNames.get(id) : '';
}
function districtName(id) {
  return state.files.districts?.data?.[id]?.name || '';
}

// ─── 랜드마크/세부장소 연결·삭제 안전 ─────────────────────────
// 시스템 코드가 하드코딩으로 의존하는 ID — 에디터에서 삭제 차단.
// 출처: HospitalSiegeSystem.js / FishingSystem.js / ExploreSystem.js / locationCardFactory.js(이벤트 랜드마크)
const PROTECTED_LANDMARKS = new Set([
  'lm_boramae_hospital', 'lm_dongjak', 'basecamp',
  'lm_raider_camp_small', 'lm_raider_camp_medium', 'lm_raider_camp_large',
  'lm_power_station', 'lm_water_plant', 'lm_comms_tower',
  // 한강 구별 독립 랜드마크 — locationCardFactory.js buildAllHangangCards() 의존
  'hangang_gangnam', 'hangang_gangdong', 'hangang_gwangjin', 'hangang_mapo', 'hangang_seocho',
  'hangang_seongdong', 'hangang_songpa', 'hangang_yeongdeungpo', 'hangang_yongsan', 'hangang_junggoo',
]);
// HospitalSiegeSystem.js BORAMAE_SUB_LOCATIONS
const PROTECTED_SUBLOCATIONS = new Set([
  'boramae_emergency', 'boramae_surgery', 'boramae_pharmacy',
  'boramae_morgue', 'boramae_rooftop', 'boramae_cafeteria',
]);

// 랜드마크 키 ↔ 가능한 참조 id 집합 (키 자체 · lm_접두 · 무접두). getLandmarkData 폴백 규칙과 동일.
function landmarkIdVariants(key) {
  const stripped = String(key).replace(/^lm_/, '');
  return new Set([key, stripped, `lm_${stripped}`]);
}
function isProtectedLandmark(key) {
  if (!key) return false;
  for (const v of landmarkIdVariants(key)) if (PROTECTED_LANDMARKS.has(v)) return true;
  return false;
}

// 구의 연결 랜드마크를 배열로 정규화해 읽기 (landmarks 배열 우선, 없으면 단일 landmark)
function districtLandmarks(dist) {
  if (!dist) return [];
  if (Array.isArray(dist.landmarks)) return dist.landmarks.slice();
  return dist.landmark ? [dist.landmark] : [];
}
// 구의 연결 랜드마크 쓰기 — 개수에 따라 단일/배열 정규화 (diff 최소화, 게임 코드 호환)
function setDistrictLandmarks(dist, arr) {
  const list = arr.filter(Boolean);
  if (list.length === 0) { delete dist.landmark; delete dist.landmarks; }
  else if (list.length === 1) { dist.landmark = list[0]; delete dist.landmarks; }
  else { dist.landmarks = list; delete dist.landmark; }
}

// 구 연결 후보가 되는 랜드마크 카드 id 목록.
// items.js의 landmark:true 카드 + 에디터에서 새로 만든 LANDMARK_CARD_META 항목(아직 items.js 미반영).
function landmarkCardIds() {
  const ids = new Set(Object.keys(state.items || {}).filter((id) => state.items[id]?.landmark === true));
  for (const id of Object.keys(state.files.landmarkMeta?.data || {})) ids.add(id);
  return [...ids];
}

// 이 랜드마크(LANDMARK_DATA 키)를 참조하는 위치 목록 (퀘스트/NPC/구) — 정보/경고용
function landmarkReferencedBy(key) {
  const ids = landmarkIdVariants(key);
  const refs = [];
  const quests = state.refQuests || {};
  for (const [qid, q] of Object.entries(quests)) {
    if (ids.has(q?.objective?.landmarkId)) refs.push(`퀘스트 「${q.title || qid}」 objective`);
    if (ids.has(q?.locationHint?.landmarkId)) refs.push(`퀘스트 「${q.title || qid}」 locationHint`);
  }
  const npcs = state.refNpcs || {};
  for (const [nid, n] of Object.entries(npcs)) {
    if (ids.has(n?.spawnLandmark)) refs.push(`NPC 「${n.name || nid}」 spawnLandmark`);
  }
  const dists = state.files.districts?.data || {};
  for (const [did, d] of Object.entries(dists)) {
    if (districtLandmarks(d).some((l) => ids.has(l))) refs.push(`구 「${d.name || did}」 연결`);
  }
  return refs;
}

// 삭제 가드 — { ok, reason?, refs? }
function canDeleteLandmark(key) {
  if (isProtectedLandmark(key)) {
    return { ok: false, reason: '시스템이 하드코딩으로 의존하는 보호 랜드마크입니다 (병원 공성·낚시·이벤트 등).' };
  }
  return { ok: true, refs: landmarkReferencedBy(key) };
}
function canDeleteSubLocation(sub) {
  if (sub?.id && PROTECTED_SUBLOCATIONS.has(sub.id)) {
    return { ok: false, reason: '병원 공성 시스템(HospitalSiegeSystem)이 하드코딩으로 의존하는 세부장소입니다.' };
  }
  const refs = [];
  if (sub?.firstEnterReward) refs.push('1회 한정 보상(firstEnterReward) 보유 — 삭제 시 보상 진입점이 사라집니다');
  return { ok: true, refs };
}

// ─── 필드 설명 (마우스 오버 툴팁) ────────────────────────────
const FIELD_HELP = {
  // 장소(구)
  dangerLevel: '위험도 등급(1~4). 높을수록 조우·전투 위험이 큽니다.',
  travelCostTP: '이 구역으로 이동할 때 드는 시간(TP). 1TP = 게임 내 15분.',
  radiation: '방사선 수치. 높으면 피폭 위험이 있습니다.',
  encounterChance: '탐색 시 적과 마주칠 확률(0~1). 예: 0.15 = 15%.',
  noiseGen: '활동 시 발생하는 소음. 높을수록 적을 끌어들입니다.',
  fishingQuality: '낚시 품질(높을수록 좋은 어획). 낚시 가능 구역에만 적용.',
  hasFishing: '낚시 가능 여부 — 랜드마크: 안에서 낚시·통발 사용 가능 / 구: 시뮬레이터 AI 판정용.',
  preserved: '보존 식품 여부 — true면 부패 안 함(건조·훈연·발효·통조림). tags에 \'preserved\'/\'fermented\'가 있어도 동일하게 부패 면제.',
  spoilDays: '부패 일수 — 이 일수에 걸쳐 contamination이 0→100으로 누적(여름 2배·겨울 0.5배). 미지정 시 subtype 기본(food_raw 2·carcass 1·food 5·drink 7). 비음식·preserved는 부패 안 함.',
  cls: '자원 클래스 — 표면(surface): 지역 자원 레벨에 비례해 나오고 시간 경과로 재생 / 탐사(expedition): 자원 레벨 무관, 매 탐색 독립 추첨. 미지정 시 표면. (특수/광물 자원은 lootTable이 아니라 explorationYields로 다룸)',
  exploreIncrement: '탐사 1회당 지역 탐사도 상승%(이 구). 비우면 전역 기본값(gameBalance.explore.explorationPerExplore). 100%까지 누적.',
  explorationYields: '탐사도 임계값 특수자원 — [{at:30, items:[{definitionId,qty}]}] 형태. 탐사도가 at% 통과 시 items를 1회 고정 지급(확률 아님). 100% 후 종료.',
  at: '이 특수자원이 지급되는 탐사도 임계값(%). 탐사도가 이 값을 통과하는 탐사에서 1회 산출.',
  // ── 숨은 장소(POI) ──
  district: '이 숨은 장소가 속한 구 ID. 해당 구에서만 발견 시도.',
  unlockConditions: '해금 조건(모두 AND). 충족 시 구 진입에서 발견·보상 지급.',
  explorationThreshold: '구 탐사도 이 % 이상이어야 해금(Phase 3). 비우면 탐사도 조건 없음.',
  minVisits: '해당 구 최소 방문 횟수.',
  minDay: '최소 게임 일차(Day).',
  requiredItems: '발견하려면 보드에 보유해야 하는 아이템 ID 목록(예: lockpick).',
  requiredCharacter: '특정 캐릭터(직업) 전용. null이면 제한 없음.',
  minKills: '누적 최소 처치 수.',
  weather: '특정 날씨에서만 발견(예: rainy). null이면 날씨 제한 없음.',
  season: '특정 계절에서만 발견(spring/summer/autumn/winter). null이면 계절 제한 없음.',
  minCraftLevel: '최소 제작 숙련도.',
  maxNoise: '소음이 이 값 이하일 때만(은신 조건). null이면 제한 없음.',
  minDistrictsVisited: '방문한 구 수 최소치.',
  minItemsFound: '누적 발견 아이템 수 최소치.',
  customCheck: '특수 커스텀 조건(코드). 보통 null.',
  rewards: '최초 발견 시 1회 확정 지급 보상 [{definitionId, qty}].',
  bossId: '진입 시 스폰되는 보스 ID. null이면 없음.',
  repeatable: '재방문 가능 여부. true면 쿨다운 후 재탐색 가능.',
  repeatCooldownDays: '재방문 가능까지의 쿨다운 일수(repeatable=true일 때).',
  discoveryMessage: '발견 순간 표시되는 메시지.',
  seasons: '제철 — 켠 계절에만 추첨된다. 기본은 4계절 전부 켜짐(사철). 전부 끄면 어느 계절에도 안 나온다.',
  harvest: '텃밭 자동 수확 설정 — itemId(산출 작물)·harvestDays(수확 주기 일)·qty(수확량). GardenSystem이 주기마다 자동 산출.',
  itemId: '산출/대상 아이템의 ID. (📦 아이템 탭에서 검색해 확인)',
  harvestDays: '수확 주기(일). 이 일수마다 작물 1회 자동 산출(계절 배율 적용, 겨울 정지).',
  forage: '살살 채취(부분·재생) 설정 — regrowDays(재생 일)·yieldMult(수율 배율). 분해(뿌리째·소멸) 대신 노드를 남기고 일부만 거둔다. dismantle 테이블을 산출원으로 사용.',
  regrowDays: '살살 채취 후 다시 채취 가능해질 때까지의 일수.',
  yieldMult: '살살 채취 수율 배율(분해 대비). 예: 0.5 = 절반만 거둠.',
  isBasecampLandmark: '거점(베이스캠프) 랜드마크 여부 — 사이드바 거점 버튼 교체 트리거.',
  districtId: '이 랜드마크가 속한 구 ID.',
  districts: '이 랜드마크가 연결된 구 ID 목록.',
  enemyCount: '습격/캠프 전투의 적 수.',
  enemyType: '적 유형 ID.',
  rescueNpcId: '구출 대상 NPC ID.',
  hasLeader: '리더급 적 포함 여부.',
  hasBoss: '보스급 적 포함 여부.',
  // 드랍 테이블
  definitionId: '드랍되는 아이템의 고유 ID입니다. (📦 아이템 탭에서 검색해 확인)',
  id: '드랍되는 아이템의 고유 ID입니다. (📦 아이템 탭에서 검색해 확인)',
  weight: '추첨 가중치. 클수록 더 자주 나옵니다. 드랍 확률 = 이 값 ÷ 같은 표의 weight 합계.',
  minQty: '한 번 드랍될 때의 최소 수량.',
  maxQty: '한 번 드랍될 때의 최대 수량.',
  contamChance: '오염(불결) 상태로 나올 확률(0~1). 예: 0.1 = 10%.',
  // 랜드마크
  dangerMod: '이 세부장소의 추가 위험도 보정값(클수록 위험).',
  lootCount: '탐색 1회에 나오는 아이템 개수 범위 [최소, 최대].',
  // 퀘스트 기본
  title: '퀘스트 제목(화면에 표시되는 이름).',
  icon: '아이콘(이모지).',
  // 공용 — 여러 탭에서 쓰이는 기본 필드
  name: '표시 이름 — 카드·항목에 보이는 이름.',
  description: '설명 문구(카드 상세에 표시).',
  dayTrigger: '이 퀘스트가 시작(활성화)되는 게임 일차(Day).',
  deadlineDays: '시작 후 완료 제한 일수. ∞(무한)면 기한이 없습니다.',
  desc: '퀘스트 설명 문구.',
  prerequisite: '이 퀘스트보다 먼저 완료해야 하는 선행 퀘스트. 비우면 선행 조건이 없습니다.',
  // 목표(objective)
  type: '목표 종류: collect_item(특정 아이템 수집) · collect_item_type(분류별 수집) · craft_item(제작) · build_structure(건설) · survive_days(생존) · visit_district(특정 구 방문).',
  count: '목표 달성에 필요한 수량/횟수.',
  itemType: '수집해야 할 아이템 분류(예: food, water, medical).',
  category: '제작해야 할 아이템 카테고리(예: structure).',
  districtId: '방문해야 할 구(district)의 ID.',
  days: '버텨야 하는 생존 일수.',
  // 보상/패널티
  morale: '사기(정신력) 변화량. 보상은 +값, 실패 패널티는 -값.',
  items: '지급(보상) 또는 차감되는 아이템 목록.',
  qty: '아이템 수량.',
  trust: 'NPC 신뢰도 변화량.',
  skillXp: '스킬 경험치 보상량.',
  // 드랍 테이블 표시 열
  __name: '아이템 ID에 연결된 표시 이름(자동).',
  __pct: '같은 표의 weight 합계 대비 이 항목의 드랍 확률.',
  // 공용 변수(밸런스) — 탐색/재고
  lootCountMin: '모든 구 공통 — 1회 탐색 시 추첨 횟수(나오는 아이템 종류 수)의 하한.',
  lootCountMax: '모든 구 공통 — 1회 탐색 시 추첨 횟수(나오는 아이템 종류 수)의 상한.',
  stockDecayPerDay: '세부 장소(서브로케이션)의 일일 재고가 하루에 줄어드는 양. 재고가 줄면 드랍이 감소합니다.',
  survivalRateTargetMin: '밸런스 설계 목표 — 100일 생존율 하한(0~1).',
  survivalRateTargetMax: '밸런스 설계 목표 — 100일 생존율 상한(0~1).',
};
function helpFor(key) { return FIELD_HELP[key] || ''; }

// 공용 변수 탭의 카테고리(최상위 키) 한글 라벨
const BAL_CAT_LABEL = {
  design: '설계 목표', stats: '스탯 감소율(/TP)', hydration: '수분', armor: '방어력',
  noise: '소음', travel: '이동', crafting: '제작', quality: '제작 품질', combat: '전투',
  campfire: '모닥불', explore: '탐색 루팅', encounter: '조우', disease: '질병',
  moraleTiers: '사기 구간', raidEvents: '레이드 이벤트', hordeWaves: '무리 웨이브',
  hospitalSiege: '병원 공성', patientIntake: '환자 유입', raiderEvents: '약탈자 이벤트',
  night: '야간', medicalStation: '의료소', fishing: '낚시', seasonal: '계절 보너스 루팅',
  npc: 'NPC', body: '신체 부상', skills: '스킬 계수', traits: '특성 효과',
  spoilage: '음식 부패', theft: '동물 도난',
};

// 공용 변수(밸런스) leaf 키 설명 — 공통 사전보다 우선
const BAL_HELP = {
  // design
  survivalRateTargetMin: '밸런스 목표 — 100일 생존율 하한(0~1).',
  survivalRateTargetMax: '밸런스 목표 — 100일 생존율 상한(0~1).',
  // stats
  hydrationDecayPerTP: 'TP당 수분 감소량.',
  nutritionDecayPerTP: 'TP당 포만감(영양) 감소량.',
  moraleDecayPerTP: 'TP당 사기 자연 감소량.',
  fatigueGainPerTP: 'TP당 피로 증가량.',
  staminaRegenPerTP: 'TP당 스태미나 자연 회복량(과적이 아닐 때).',
  weightMultipliers: '무게비율(max 이하)별 스태미나 소모 배율(mult) 표.',
  staminaDrainTiers: '과적 구간(max 이하)별 스태미나 변화량(delta)/TP.',
  mult: '배율.',
  delta: '변화량(/TP).',
  max: '이 구간의 상한값(또는 최대값).',
  // hydration
  startValue: '시작 시 값.',
  // armor
  damageReductionCap: '피해 감소율 상한(0~1).',
  critReductionCap: '치명타 감소율 상한(0~1).',
  specialDmgReductCap: '적 특수스킬 피해 감소 상한(0~1).',
  // noise
  baseDecayPerTP: 'TP당 기본 소음 감소량.',
  influxThreshold: '이 소음 이상이면 적이 유입되기 시작.',
  flushReductionMult: '소음 플러시 후 influxThreshold 대비 잔존 비율.',
  bonusDecay: '해당 소음 구간에서 추가로 감소하는 양.',
  // travel
  baseCostTP: '기본 이동 TP 비용.',
  baseStaminaDrain: '이동 시 기본 스태미나 소모.',
  exploreStaminaDrain: '탐색 시 스태미나 소모.',
  explorationPerExplore: '탐사 1회당 지역 탐사도 상승%(전역 기본). 100%까지 누적. 구별로 districts 탭의 exploreIncrement로 덮어쓸 수 있음.',
  explorationYieldBonusMax: '탐사도가 높을수록 일반 루팅에 보너스 픽이 붙는 최대 확률(0~1). 예: 0.5 = 탐사도 100%일 때 +50% 확률로 추가 아이템. 탐사도에 비례해 0→이 값까지 선형 증가.',
  // 부패(spoilage) — Phase 4
  daysBySubtype: 'subtype별 기본 부패 일수 — 이 일수에 걸쳐 음식 contamination이 0→100으로 누적된다. 아이템 개별 spoilDays로 덮어쓸 수 있음. (food_raw·carcass·food·drink)',
  food_raw: '날것/조리 안 한 음식의 기본 부패 일수.',
  carcass: '사체(손질 전 고기)의 기본 부패 일수 — 가장 빨리 상함.',
  food: '일반(조리된) 음식의 기본 부패 일수.',
  drink: '음료의 기본 부패 일수.',
  defaultDays: 'daysBySubtype에 해당 없는 음식의 기본 부패 일수.',
  seasonMult: '계절별 부패 속도 배율 — 여름 빠르게(2배), 겨울 느리게(0.5배). 부패 누적량에 곱해진다.',
  // 도난(theft) — Phase 4
  dailyChance: '바닥에 음식이 있을 때 하루 1회 동물 도난이 발생할 확률(0~1). 발생 시 음식 1스택이 둥지(animal_nest)로 옮겨져 회수 대상이 됨. 베이스캠프는 안전(제외).',
  lowStaminaThreshold: '이 비율 미만이면 저스태미나 페널티(0~1).',
  lowStaminaPenalty: '저스태미나 시 소모 배율.',
  immobileWeightPct: '이 무게비율 이상이면 이동 불가.',
  // crafting
  maxQueueSize: '제작 큐 최대 개수.',
  baseFailureChance: '기본 제작 실패 확률.',
  minFailureChance: '스킬 최대 시 최소 실패 확률.',
  failureRefundRate: '실패 시 재료 반환 비율.',
  failureXpMult: '실패 시 획득 XP 배율.',
  chefTeamBonusHigh: '팀 평균사기 >85 품질 점수 보너스.',
  chefTeamBonusMid: '팀 평균사기 >70 품질 점수 보너스.',
  xpBase: '스킬별 제작 기본 XP.',
  // quality
  skillBonusPerLevel: '요구 레벨 초과 1레벨당 품질 보너스.',
  focusBonusSolo: '큐 1개(집중) 품질 보너스.',
  focusPenaltyFull: '큐 가득 참 품질 페널티.',
  moraleBonusHigh: '사기 높음 품질 보너스.',
  moralePenaltyLow: '사기 낮음 품질 페널티.',
  moralePenaltyDespair: '절망 상태 품질 페널티.',
  // combat
  fleeChance: '전투 도주 성공 확률.',
  fleeNoise: '도주 시 발생 소음.',
  fleeFatigue: '도주 시 피로 증가.',
  unarmedBaseDmg: '맨손 기본 피해 범위 [최소, 최대].',
  unarmedStunChance: '맨손 기절 유발 확률.',
  unarmedStunDmg: '맨손 기절 추가 피해.',
  masteryCounterChance: '방어 마스터리 반격 확률.',
  masteryCounterDmg: '방어 마스터리 반격 피해.',
  ammoSaveChance: '원거리 마스터리 탄약 미소모 확률.',
  enemyDropChance: '적 처치 시 전리품 드롭 확률.',
  killXp: '처치 시 전투 XP.',
  hitXp: '명중 시 XP.',
  critBonusXp: '치명타 추가 XP.',
  defenseXp: '피격 시 방어 XP.',
  combatLogMaxEntries: '전투 로그 최대 보관 줄 수.',
  guardDamageReduction: '방어 시 피해 감소율.',
  guardCounterBonus: '방어 후 반격 피해 보너스.',
  guardDuration: '방어 지속 턴 수.',
  nightAccuracyPenalty: '야간 전투 명중률 페널티.',
  nightLitPenalty: '광원 보유 시 적용되는 야간 페널티(완화값).',
  weaponWeaknessMult: '약점 속성 피해 배율.',
  weaponResistanceMult: '저항 속성 피해 배율.',
  companionAttackCooldown: '동료 공격 쿨다운(턴).',
  companionHealCooldown: '동료 치유 쿨다운(턴).',
  baseUnarmedAccuracy: '맨손 공격 기본 명중률.',
  defaultCritMultiplier: '무기 미지정 시 치명타 배율.',
  noAmmoMeleeDamage: '탄약 없는 원거리무기 → 근접 전환 피해 범위.',
  noAmmoAccuracy: '탄약 없는 근접 전환 명중률.',
  noAmmoNoise: '탄약 없는 근접 전환 소음.',
  defaultStealthDifficulty: '적 은신 난이도 기본값.',
  enemyDefaultDamage: '적 공격 기본 피해 범위(미지정 시).',
  enemyBaseAccuracy: '적 공격 기본 명중률(미지정 시).',
  enemySpecialSkillChance: '적이 특수스킬을 쓸 확률.',
  fleeFailedDamageMult: '도주 실패 시 받는 피해 배율.',
  companionTargetChance: '적이 플레이어 대신 동료를 노릴 확률.',
  doctorZombieMedDropChance: '의사 — 좀비 처치 시 의료품 추가 드롭 확률.',
  attackDamage: '동료 자율 공격 피해 범위.',
  attackAccuracy: '동료 자율 공격 명중률.',
  healAmount: '회복량.',
  healThreshold: '플레이어 HP가 이 비율 미만이면 자동 치유(0~1).',
  holdDamageReduct: 'hold 자세 피해 경감율.',
  resistBonus: '상태이상 저항 보너스.',
  atkMult: '적 공격력 배율.',
  duration: '지속 턴 수.',
  cooldown: '쿨다운(턴).',
  // campfire
  tempBoostPerTP: 'TP당 체온 상승량.',
  fuelConsumePerTP: 'TP당 연료(내구도) 소모.',
  noFuelTempBoost: '연료 없을 때 체온 상승량.',
  // encounter
  reductionCap: '조우 확률 감소 상한(0~1).',
  structureReductCap: '구조물 조우 감소 상한(0~1).',
  respawnNoiseThreshold: '이 소음 이상이면 적 리스폰.',
  earlyGameGraceDays: '초반 조우 완화 적용 일수.',
  earlyGameEncounterMult: '초반 조우 확률 배율.',
  landmarkDangerReduct: '랜드마크 세부장소 기본 위험도 감소.',
  exposureDecayRate: '비노출 시 노출 카운터 감소율(/TP).',
  // moraleTiers
  threshold: '이 값 이상이면 해당 구간 적용.',
  dmgMult: '피해 배율.',
  accBonus: '명중률 보정.',
  staminaRegenMult: '스태미나 회복 배율.',
  craftFailMult: '제작 실패율 배율.',
  fatigueGainMult: '피로 증가 배율.',
  blockExplore: '탐색 차단 여부.',
  // events (raid/horde/siege/raider)
  startDay: '이 이벤트가 시작되는 일차.',
  baseChancePerTP: 'TP당 기본 발생 확률.',
  dayScaling: '일차마다 증가하는 확률.',
  maxChance: '최대 발생 확률(/TP).',
  minEnemies: '최소 적 수.',
  maxEnemies: '최대 적 수.',
  intervalDays: '발생 간격(일).',
  intervalVariance: '간격 랜덤 변동(±일).',
  baseEnemies: '첫 발생 시 적 수.',
  enemiesPerWave: '웨이브마다 증가 적 수.',
  baseDangerLevel: '기본 위험도.',
  dangerScaling: '웨이브/습격마다 위험도 증가.',
  structureDamage: '패배/도주 시 구조물 내구도 감소(%).',
  victoryMorale: '승리 시 사기 변화.',
  defeatMorale: '패배 시 사기 변화.',
  dangerModDelta: '패배 시 세부장소 위험도 증가량.',
  casualtiesMin: '패배 시 최소 사망자.',
  casualtiesMax: '패배 시 최대 사망자.',
  minGapWithHordeDays: '습격-호드 최소 간격(일).',
  numEnemies: '적 수.',
  moraleMultiplier: '사기 손실 배율.',
  casualtiesReduce: '사망자 감소량.',
  defeatMoraleMultiplier: '패배 사기 손실 배율.',
  baseScore: '기본 점수.',
  skillMult: '스킬 레벨당 점수 배율.',
  trustMult: '신뢰 NPC 수당 점수 배율.',
  partialVictoryMorale: '부분 승리 사기.',
  partialVictoryStructureMult: '부분 승리 구조물 피해 배율.',
  partialVictoryDangerMult: '부분 승리 위험도 배율.',
  cooldownTP: '쿨다운(TP).',
  demandItems: '요구 아이템 최소 수.',
  demandItemsMax: '요구 아이템 최대 수.',
  surrenderMorale: '굴복 시 사기 변화.',
  refuseMorale: '거부 시 사기 변화.',
  // patientIntake
  moraleDeath: '환자 사망 시 사기 변화.',
  moraleDepart: '환자 이탈 시 사기 변화.',
  cumulativeMoraleBonusPer: '누적 치료 환자 1명당 사기 보너스.',
  cumulativeMoraleBonusCap: '누적 환자 사기 보너스 상한.',
  // night
  startHour: '야간 시작 시각(시).',
  endHour: '야간 종료 시각(시).',
  encounterMult: '조우 확률 배율.',
  travelCostMult: '이동 비용 배율.',
  darkSleepFatigueMult: '어둠 수면 피로 회복 배율.',
  darkSleepAnxietyGain: '어둠 수면 불안 증가.',
  darkNightmareBonus: '어둠 수면 악몽 확률 증가.',
  litSleepAnxietyDrop: '광원 수면 불안 감소.',
  lightDrainPerTP: '야간 광원 카드 내구도 감소(/TP).',
  // medicalStation
  durabilityDecayPerTP: '의료 구조물 내구도 감소(/TP).',
  // fishing
  tpCostPerCast: '낚시 1회 TP 비용.',
  baseCatchChance: '기본 어획 확률(Lv.0).',
  maxCatchChance: '최대 어획 확률(Lv.20).',
  baitWormBonus: '지렁이 미끼 어획률 보너스.',
  baitInsectBonus: '곤충 미끼 어획률 보너스.',
  rodBasicBonus: '기본 낚싯대 어획률 보너스.',
  rodImprovedBonus: '개량 낚싯대 어획률 보너스.',
  rareFishChanceMax: 'Lv.20 희귀어 확률.',
  nonRareSmallChance: '희귀어 아닐 때 소형어 확률(아니면 중형).',
  trapMediumChance: '통발 수확 시 중형어 확률(아니면 소형).',
  trapCheckIntervalTP: '통발 자동 수확 주기(TP).',
  trapBaseCatch: '통발 기본 어획률.',
  trapMaxCatch: '통발 최대 어획률.',
  xpPerCast: '낚시 시도 XP.',
  xpPerRareFish: '희귀어 XP.',
  xpPerTrapHarvest: '통발 수확 XP.',
  // npc
  trustCombatBonusPer5: '전투 보너스 = 1.0 + (신뢰/5) × 이 값.',
  safetyAdd: '야간 경계 시 안전도 가산.',
  encounterReduce: '야간 경계 시 조우 확률 감소.',
  // body
  hitTables: '무기 타입별 부위 피격 확률 표.',
  injuryHealTP: '부상 타입별 기본 치유 TP.',
  naturalHealRate: 'severity당 TP마다 치유 진행량.',
  headConcussionChance: '머리 피격 시 뇌진탕 확률(아니면 열상).',
  highDmgFractureChance: '피해 ≥25 골절 확률(아니면 출혈).',
  midDmgBleedingChance: '피해 ≥15 출혈 확률.',
  midDmgLacerationChance: '피해 ≥15 (누적)열상 확률.',
  lowDmgLacerationChance: '저피해 열상 확률(아니면 출혈).',
  severeChanceHighDmg: '피해 ≥30 시 중상(sev3) 확률.',
  severeChanceMidDmg: '피해 ≥18 시 중상(sev2) 확률.',
  head: '머리 피격 확률.', torso: '몸통 피격 확률.',
  leftArm: '왼팔 피격 확률.', rightArm: '오른팔 피격 확률.',
  leftLeg: '왼다리 피격 확률.', rightLeg: '오른다리 피격 확률.',
  laceration: '열상 치유 TP.', bleeding: '출혈 치유 TP.',
  fracture: '골절 치유 TP.', concussion: '뇌진탕 치유 TP.',
  // quality tiers / labels
  label: '표시 이름.', notify: '발생 시 알림 문구.', name: '표시 이름.',
  // explore (추가)
  respawnLootDays: '구역 루팅 리스폰까지 경과 일수.',
  respawnLootChance: '리스폰 시 각 아이템 드롭 확률.',
  respawnLootQtyDivisor: '리스폰 수량 = 원수량 ÷ 이 값.',
  masteryRareLootChance: '탐색 마스터리 희귀 루팅 확률.',
  subLocationNoiseMult: '세부장소 탐색 소음 배율(구 소음 대비).',
  nightHospitalAmbushChance: '야간 보라매 응급실/수술실 잠복 환자 조우 확률.',
  indoorRadiationMult: '건물 내부 방사선 노출 배율.',
  lootCountMin: '모든 구 공통 — 1회 탐색 추첨 횟수 하한.',
  lootCountMax: '모든 구 공통 — 1회 탐색 추첨 횟수 상한.',
  stockDecayPerDay: '세부 장소 일일 재고 감소량.',
  // disease (추가)
  coldExposureTpThreshold: '저체온증 발병 누적 저온 TP.',
  heatExposureTpThreshold: '열사병 발병 누적 고온 TP.',
  sepsisExposureTpThreshold: '패혈증 발병 누적 고감염 TP.',
  commonColdChance: 'TP당 감기 발병 확률(계절 보정 전).',
  influenzaChance: 'TP당 독감 발병 확률.',
  radiationSicknessChance: 'TP당 방사선 질환 발병 확률.',
  waterContamSevereThreshold: '물 오염 "심함" 임계.',
  contamMildThreshold: '음식/물 오염 "중간" 임계.',
  choleraChanceSevereWater: '심한 오염수 콜레라 확률.',
  dysenteryChanceSevereWater: '심한 오염수 이질 확률.',
  dysenteryChanceContamFood: '오염 음식/물 이질 확률.',
  // crafting xpBase 스킬별
  building: '건축 제작 기본 XP.', weaponcraft: '무기 제작 기본 XP.',
  armorcraft: '방어구 제작 기본 XP.', medicine: '의약 제작 기본 XP.',
  cooking: '요리 제작 기본 XP.', crafting: '일반 제작 기본 XP.',
  xpBase: '스킬별 제작 기본 XP.',
  // quality 등급/임계
  normal: '품질 등급(라벨/배율/알림).', good: '품질 등급(라벨/배율/알림).',
  excellent: '품질 등급(라벨/배율/알림).', masterwork: '품질 등급(라벨/배율/알림).',
  tiers: '제작 품질 등급 정의.', thresholds: '품질 점수 임계값.',
  // events 중첩
  streakBonus: '연승 누적 추가 사기.', at2: '2연승 시 추가 사기.', at5: '5연승 시 추가 사기.',
  tutorial: '튜토리얼(첫) 습격 완화 설정.', tutorialWarningDay: '습격 예고 알림 일차.',
  skipStructureDmg: '구조물 피해 생략 여부.', skipDangerMod: '위험도 증가 생략 여부.',
  skipCasualties: '사망자 생략 여부.',
  doctorPrivilege: '의사 전용 패배 완화.', doctorEvacuation: '의사 전용 대피 미니게임.',
  stageWeights: '대피 단계별 선택지 가중치.', stage1: '1단계 선택 가중치.', stage2: '2단계 선택 가중치.',
  A: '선택지 A 가중치.', B: '선택지 B 가중치.', C: '선택지 C 가중치.', D: '선택지 D 가중치.',
  victoryItems: '승리 보상 아이템.',
  moraleMilestones: '누적 치료 환자 수 도달 시 일회성 사기 보너스(횟수: 보너스).',
  // combat 중첩
  companionAuto: '동료 자율 행동 설정.', classSkills: '직업별 동료 스킬.',
  scaledDecayBreakpoints: '소음 구간별 추가 감소.',
  // explore / seasonal 루팅 풀
  masteryRarePool: '탐색 마스터리 희귀 루팅 후보 아이템 ID 목록.',
  seasonLoot: '계절별 탐색 보너스 루팅 테이블.',
  maxCount: '1회 탐색당 계절 보너스 최대 획득 개수.',
  spring: '봄 보너스 루팅.', summer: '여름 보너스 루팅.',
  autumn: '가을 보너스 루팅.', winter: '겨울 보너스 루팅.',
  qty: '획득 수량.', chance: '드롭 확률(0~1).',
  // 스킬/특성
  scavenging: '탐색 스킬 보너스 계수.',
  maxExtraLootChance: '탐색 Lv.20 시 추가 루팅 확률(레벨 비례).',
  lv20RareLootChance: '탐색 Lv.20 도달 시 희귀 루팅 확률.',
  scavenger: '스캐빈저 특성 효과.', medic: '의무병 특성 효과.', silent: '침묵 특성 효과.',
  bonusLootCount: '탐색 시 추가로 발견하는 아이템 수.',
  healMultiplier: '의료 아이템 회복 배율.',
  noiseMult: '소음 발생 배율.',
};
function helpForBalance(key) { return BAL_HELP[key] ?? FIELD_HELP[key] ?? ''; }

// 아이템 탭 전용 설명 (공통 사전보다 우선 — 예: weight는 '무게'로 다름)
const ITEM_HELP = {
  subtype: '세부 분류(예: food·weapon·tool·material 등). type 안의 하위 갈래.',
  rarity: '희귀도 등급(common·uncommon·rare·unique 등).',
  // 소비·사용·착용 효과(onConsume/onUse/onWear/onTick) 하위 필드 — +증가 / -감소
  hp: '효과 발동 시 HP 변화(+회복 / -피해).',
  heal: '부상 치유량.',
  hydration: '수분 변화(+회복).',
  thirst: '갈증 변화(보통 -로 갈증 해소).',
  hunger: '허기 변화(보통 -로 허기 해소).',
  fatigue: '피로 변화(-회복 / +증가).',
  stamina: '스태미나 변화.',
  infection: '감염 수치 변화(+악화 / -완화).',
  contamination: '오염 수치 변화.',
  warmth: '체온 보온 효과.',
  temperature: '체온 변화.',
  trauma: '정신적 트라우마 변화.',
  noise: '효과 발동 시 발생/감소하는 소음.',
  damageReduction: '착용 시 받는 피해 감소율(0~1).',
  critReduction: '착용 시 치명타 피해 감소율(0~1).',
  encounterReduction: '소지·사용 시 조우 확률 감소.',
  noiseReduction: '소음 감소량.',
  exploreBonus: '탐색 보너스.',
  scoutBonus: '정찰(주변 정보) 보너스.',
  stealthBonus: '은신 보너스.',
  durabilityPerUse: '사용 1회당 소모되는 내구도.',
  radiationMult: '방사선 피폭 배율(착용/소지 시).',
  contaminationMult: '오염 증가 배율.',
  infectionMult: '감염 증가 배율.',
  fatigueMult: '피로 증가 배율.',
  removeStatus: '제거하는 상태이상.',
  cureAllDiseases: '모든 질병을 치료하는지 여부.',
  craftSuccessBonus: '제작 성공률 보너스.',
  powerGeneration: '전력 생산량.',
  structurePowerDays: '구조물 전력 지속 일수.',
  unlockBonus: '해금 관련 보너스.',
  permanentInfectionImmunity: '영구 감염 면역 부여 여부.',
  // 전투·무기·투척·효과 공용 하위 필드
  chance: '효과·드롭·상태이상이 발동할 확률(0~1).',
  accuracy: '명중률(0~1).',
  critChance: '치명타 확률(0~1).',
  critMultiplier: '치명타 피해 배율.',
  critBonus: '치명타 확률/피해 보너스.',
  critMultiplierBonus: '치명타 배율 보너스.',
  noiseOnUse: '사용 시 발생하는 소음.',
  noiseOnAttack: '공격 시 발생하는 소음.',
  durabilityLoss: '사용 시 잃는 내구도.',
  duration: '효과 지속 시간(턴/TP).',
  requiresAmmo: '사용에 탄약이 필요한지 여부.',
  statusInflict: '적에게 유발하는 상태이상.',
  movePenalty: '착용 시 이동/행동 페널티.',
  skipTurn: '사용 시 턴을 소모하는지 여부.',
  aoe: '광역(범위) 효과 여부/범위.',
  successRate: '성공 확률(0~1).',
  tpToTrigger: '발동까지 걸리는 TP.',
  hpPerRound: '라운드당 HP 변화(지속 피해/회복).',
  hpHeal: 'HP 회복량.',
  hpRegenPerTP: 'TP당 HP 자연 회복량.',
  injuryTypes: '치료 가능한 부상 종류.',
  severityDec: '부상 심각도 감소량.',
  skillLevel: '요구 스킬 레벨.',
  infectionResist: '감염 저항 보너스.',
  infectionResistDuration: '감염 저항 지속 시간.',
  moraleDecayReduction: '사기 자연 감소 완화량.',
  earlyWarning: '습격 등 조기 경보 효과.',
  targetCard: '효과 대상 카드 지정.',
  baitTags: '미끼로 쓰일 때 매칭되는 태그.',
  parts: '부위/부품 정보.',
  amount: '수치/수량.',
  penalty: '페널티 수치.',
  // 전투 지속 피해(DoT)
  poisonDamage: '중독 피해량.',
  burnDuration: '화상 지속 라운드.',
  burnDmgPerRound: '화상 라운드당 피해.',
  bleedDuration: '출혈 지속 라운드.',
  bleedDmgPerRound: '출혈 라운드당 피해.',
  bleed: '출혈 유발 여부/수치.',
  // 전설·특수 효과(주로 고유 아이템)
  acidImmunity: '산성 피해 면역.',
  attacksPerRoundOnCrit: '치명타 시 라운드당 추가 공격 횟수.',
  autoDefense: '자동 방어 발동 여부.',
  baseDamagePerAttack: '공격당 기본 피해.',
  buildingBonus: '건축 작업 보너스.',
  coldImmunity: '추위(저체온) 면역.',
  coldResistMult: '추위 저항 배율.',
  contaminationImmunity: '오염 면역.',
  craftSpeedBonus: '제작 속도 보너스.',
  craftTimeReduction: '제작 시간 감소.',
  cureAllBleeding: '모든 출혈 치료 여부.',
  cureAllPoisons: '모든 중독 치료 여부.',
  cureDespair: '절망 상태 치료 여부.',
  defenseReduction: '대상 방어력 감소.',
  deployTrap: '함정 설치 여부.',
  detectHiddenDisease: '숨은 질병 탐지.',
  digBonus: '채굴/발굴 보너스.',
  electronicUnlock: '전자 잠금 해제 가능.',
  enablesAdvancedMedical: '고급 의료 제작/행동 해금.',
  enablesAmmoCraft: '탄약 제작 해금.',
  enablesBroadcast: '방송 송출 해금.',
  enablesLegendaryCraft: '전설 등급 제작 해금.',
  enablesMilitaryComm: '군 통신 해금.',
  enablesWaterPurification: '정수 기능 해금.',
  enemyFleeChance: '적 도주 유발 확률.',
  fireStart: '불 피우기 가능 여부.',
  food_decay: '음식 부패 관련 효과.',
  guaranteedStun: '확정 기절 유발 여부.',
  herb: '약초 관련 효과/산출.',
  highGroundAccess: '고지대 접근 가능.',
  honey: '꿀 관련 산출/효과.',
  hypothermiaChanceMult: '저체온증 발병 확률 배율.',
  infectionResistBuff: '감염 저항 버프.',
  infectionSpreadBlock: '감염 확산 차단.',
  maxOccupants: '수용 가능 최대 인원.',
  nightVision: '야간 시야 확보.',
  onKill: '적 처치 시 발동하는 효과.',
  permanentDiseaseResist: '영구 질병 저항.',
  permanentInfectionResist: '영구 감염 저항.',
  purifyRate: '정수 속도/효율.',
  restHealMult: '휴식 시 회복 배율.',
  revealAllHiddenLocations: '모든 숨은 장소 공개.',
  revealHiddenLocations: '숨은 장소 공개.',
  severityMin: '효과가 적용되는 최소 심각도.',
  shelterBonus: '은신처 보너스.',
  special: '특수 효과 정보.',
  specialEffect: '특수 효과.',
  survivorSignal: '생존자 신호 효과.',
  temperatureImmunity: '온도(체온) 피해 면역.',
  temperatureMin: '효과 적용 최소 온도.',
  temporaryAttackBoost: '일시 공격력 상승.',
  temporaryStaminaBoost: '일시 스태미나 상승.',
  travelCostReduction: '이동 비용(TP) 감소.',
  waterproof: '방수 여부.',
  woodChopBonus: '벌목 보너스.',
  zombieRepelTP: '좀비 퇴치 효과 지속 TP.',
  weight: '아이템 1개의 무게(kg). 소지 무게 한도에 영향을 줍니다.',
  tags: '분류 태그. 검색·필터·레시피 조건 등에 사용됩니다.',
  defaultDurability: '기본 내구도. 사용·장비하면 닳습니다.',
  defaultContamination: '기본 오염도(0 = 깨끗).',
  dismantle: '분해 시 얻는 산출물 목록.',
  dismantleTP: '분해에 드는 시간(TP).',
  stackable: '같은 칸에 여러 개를 겹쳐 보관할 수 있는지 여부.',
  maxStack: '한 칸에 겹칠 수 있는 최대 수량.',
  immovable: '이동 불가 — 필드 바닥에 고정. 드래그로 옮기거나 배낭에 담을 수 없고, 다른 아이템을 얹어도 밀려나지 않는다(분해는 카드 클릭). 캠프파이어 등 설치형 구조물에 적합.',
  onConsume: '먹기/소비할 때 발생하는 효과.',
  onUse: '사용할 때 발생하는 효과.',
  onWear: '착용할 때 적용되는 효과.',
  onTick: '시간이 흐를 때(TP마다) 적용되는 효과.',
  onTrigger: '특정 조건에서 발동하는 효과.',
  leaveOnConsume: '소비 후 남는 잔여물(예: 빈 캔).',
  requiredForBlueprints: '이 아이템을 재료로 쓰는 설계도(레시피) 목록.',
  nutrition: '섭취 시 회복하는 포만감(영양).',
  legendary: '전설(고유) 아이템 여부.',
  isRare: '희귀 아이템 여부.',
  requiresSlot: '장착·배치에 필요한 슬롯.',
  equipSlot: '장비 슬롯(머리/몸/손/무기 등).',
  combat: '전투 관련 능력치(공격력 등).',
  weaponType: '무기 종류(근접/원거리/투척 등).',
  damage: '공격력(피해량).',
  armor: '방어구의 방어 수치.',
  defense: '방어력 수치.',
  bagSlots: '가방류: 추가로 늘어나는 보관 칸 수.',
  storageCapacity: '보관 용량.',
  repairRecipe: '수리에 필요한 재료.',
  repairAmount: '수리 시 회복되는 내구도.',
  effect: '특수 효과 정보.',
  multiTarget: '여러 대상에게 적용되는지 여부.',
  throwableEffect: '투척 시 효과.',
  treatPart: '치료 대상 부위.',
  diagnose: '진단 관련 정보.',
  infectionRisk: '감염 위험도.',
  bleedChance: '출혈 유발 확률.',
  trapData: '함정 설정 데이터.',
  craftingTool: '제작에 도구로 사용됩니다.',
  fragmentOf: '이 조각이 모여 완성되는 아이템.',
  landmark: '랜드마크(거점/장소) 카드 여부.',
  landmarkBonus: '이 랜드마크가 주는 보너스 설명.',
  nodeId: '연결된 노드(장소) ID.',
  eventDuration: '이벤트 지속 시간.',
  warmthBonus: '체온 유지 보너스.',
  waterCapacity: '담을 수 있는 물의 양.',
  kindlingUses: '불쏘시개 사용 가능 횟수.',
  sleepFatigueMult: '수면 시 피로 회복 배율.',
  companionMoraleBoost: '동료 사기 상승 효과.',
  isStructure: '구조물 여부.',
  hasFishing: '낚시 가능 랜드마크 여부 — 카드 안에서 낚시·통발 사용 가능, 항상 진입 가능 카드로 렌더.',
  safeZone: '안전지대(조우/위협 차단) 여부.',
  weatherProtection: '날씨 패널티 차단 여부.',
  contaminationShield: '식량 오염 차단 여부.',
  npcShelter: 'NPC가 합류·거주 가능한지 여부.',
};
function helpForItem(key) { return ITEM_HELP[key] ?? FIELD_HELP[key] ?? ''; }

// 태그 설명 — 코드에서 동작을 좌우하는 태그는 정확히, 그 외 분류 태그는 용도 위주로.
// (모든 태그는 공통적으로 퀘스트 목표 itemType·레시피/비밀조합 조건·검색에도 쓰일 수 있음)
const TAG_HELP = {
  // ── 동작에 직접 영향 ──
  preserved: '보존 식품 — 시간이 지나도 부패하지 않음(부패 면제). preserved 필드와 동일.',
  fermented: '발효 식품 — preserved와 동일하게 부패 면제.',
  bait: '낚시·통발·덫의 미끼로 사용 가능(FishingSystem·TrapSystem).',
  silent: '무기: 공격 소음이 없고 치명타 시 은밀 처치(CombatSystem).',
  blade: '근접 무기: 절단 계열 보정 대상(출혈 등).',
  knife: '칼류 — 절단 보정 + 해체/요리 도구.',
  throwable: '투척 가능 무기로 취급(전투 투척 행동).',
  medical: '의료 아이템 — 치료 행동·소음 계산·전투 사용 대상.',
  bandage: '붕대류 — 출혈·부상 치료에 사용.',
  antibiotic: '항생제 — 세균성 질병 치료(DiseaseSystem).',
  antidote: '해독제 — 중독 치료(DiseaseSystem).',
  rad_blocker: '방사선 차단 — 피폭 완화(DiseaseSystem).',
  drinkable: '마실 수 있음 — 오염 시 음용 경고(ContaminationSystem).',
  water: '수분 보충 음용원(StatSystem 갈증 해소 판정).',
  water_source: '환경 카드: 물을 수집할 수 있는 수원.',
  light: '광원 — 밤에 시야 확보(NightSystem).',
  light_source: '전투 중 광원으로 인정 — 야간 전투 페널티 완화(CombatSystem).',
  heat: '열원 분류. 환경 카드의 열기 경고 표시에 사용. (실제 난방=체온 회복은 campfire 전용 하드코딩 로직 — 태그가 아니라 아이템 id로 동작)',
  cold: '냉기 — 환경 카드 추위 경고.',
  contamination: '오염원 — 환경 카드 오염 경고.',
  contaminated: '오염된 상태 — 섭취 시 방사선·감염 위험.',
  danger: '위험 요소 — 위험 강조 표시(환경/날씨 이벤트).',
  structure: '설치 구조물 — 바닥 설치형(전투 대상 제외 등).',
  // ── 상위 분류(타입성) ──
  material: '재료 — 제작 원료.',
  crafted: '제작으로 만들어진 아이템.',
  craftable: '제작 가능한 아이템.',
  food: '음식 분류(퀘스트 목표·레시피 조건에 사용).',
  food_raw: '날것 식재료 — 빨리 부패(부패 일수 기본 2일).',
  cooked: '조리된 음식.',
  edible: '먹을 수 있는 것.',
  consumable: '소비형 아이템(1회성).',
  drink: '음료 분류.',
  meat: '고기류.', fish: '생선류.', seafood: '해산물.',
  carcass: '사체 — 손질 전 고기(가장 빨리 부패).',
  herb: '약초.', plant: '식물.', mushroom: '버섯.', seed: '씨앗.',
  weapon: '무기.', melee: '근접 무기.', ranged: '원거리 무기.', firearm: '총기.',
  unarmed: '맨손 무기.', ammo: '탄약.', ammo_part: '탄약 부품.', explosive: '폭발물.',
  armor: '방어구.', armor_part: '방어구 부품.', shield: '방패(보조 장비).',
  clothing: '의류.', boots: '신발.', vest: '조끼.', head: '머리 장비.',
  hands: '손 장비.', fullbody: '전신 장비.', offhand: '보조손 장비.', accessory: '장신구.',
  tool: '도구.', utility: '유틸리티 도구.', container: '용기.', storage: '보관 용도.',
  bag: '가방 — 보관 칸 확장.', trap: '함정.',
  metal: '금속 재료.', wood: '목재.', textile: '섬유/천.', chemical: '화학 물질.',
  fuel: '연료.', kindling: '불쏘시개.', fire: '발화 관련.', organic: '유기물.',
  electronic: '전자 부품.', tech: '기술/전자 장비.', fragment: '조각(모으면 완성).',
  natural: '자연물.', environment: '환경 오브젝트(바닥 고정형).',
  location: '장소(구) 카드.', landmark: '랜드마크 카드.',
  legendary: '전설(고유) 아이템.', rare: '희귀 아이템.', rare_ingredient: '희귀 재료.',
  boss_drop: '보스 처치 드랍.', event: '이벤트 관련.', seasonal: '계절성.',
  keepsake: '유품/기념품(서사용).', key_item: '핵심 진행 아이템.', document: '문서/기록물.',
  healing: '치유 효과.', stimulant: '각성·흥분제.', stamina: '스태미나 관련.',
  diagnostic: '진단 도구.', antiseptic: '소독제.', anesthetic: '마취제.', splint: '부목.',
  fishing: '낚시 관련 도구/미끼.', forage: '채집 가능 노드.', farm: '농경 관련.',
  building: '건축 관련.', cooking: '요리 관련.', salvage: '해체로 얻는 부산물.',
  weather: '날씨 이벤트.',
  weather_resistant: '⚠️ 코드 미연결(설명용 라벨) — "비·눈에 꺼지지 않음"은 플레이버일 뿐 실제 로직 없음(날씨로 불이 꺼지는 처리 자체가 미구현).',
  radiation: '방사선 관련.', toxic: '독성.', poison: '중독 유발.',
};
function helpForTag(t) { return TAG_HELP[t] || ''; }


// 설명이 있으면 점선 밑줄 + 마우스 오버 툴팁을 단 라벨 생성
function labelEl(text, help) {
  return el('label', help ? { text, title: help, class: 'has-help' } : { text });
}
function fieldLabel(text, key = text) {
  return labelEl(text, helpFor(key));
}


// 변경/검증 배지 + 변경됨 표시 + 저장 버튼 상태를 실제 diff로 동기화
function refreshChangeCount() {
  const changes = computeChanges();
  const n = changes.reduce((s, g) => s + g.changes.length, 0);
  const changedFiles = new Set(changes.map((g) => g.fileKey)).size;
  const badge = $('#change-count');
  if (badge) badge.textContent = n ? `(${n})` : '';
  const vbadge = $('#validate-count');
  if (vbadge) { const vn = collectIssues().length; vbadge.textContent = vn ? `(${vn})` : ''; }
  // 변경이 있을 때만 "변경됨" 표시 + 저장 버튼 활성화
  $('#dirty').hidden = changedFiles === 0;
  $('#save-btn').disabled = changedFiles === 0;
}

// ─── tab switching ───────────────────────────────────────────
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === tab));
  render();
}

// ─── data loading (로컬 파일에서) ────────────────────────────
async function loadAll() {
  status('로컬 데이터 불러오는 중…', 'info');
  // serve.js 연결 확인 (git이 없어도 읽기/저장은 가능)
  let info;
  try {
    info = await getInfo();
  } catch (e) {
    status(`serve.js에 연결할 수 없습니다. 저장소 루트에서 'node serve.js' 실행 후 http://localhost:8080/tools/editor/ 로 접속하세요. (${e.message})`, 'err');
    return;
  }
  state.gitAvailable = info.git !== false && !!info.branch;
  state.branch = info.branch || '(git 없음)';
  state.gitReason = info.reason || '';
  // valid item ids + 표시 이름 (로컬 items.js — 자동완성/검증/이름표시용)
  try {
    const items = (await import('../../js/data/items.js')).default;
    state.items = items;
    state.itemIds = new Set(Object.keys(items));
    state.itemNames = new Map(Object.entries(items).map(([id, it]) => [id, it?.name || id]));
    const dl = $('#item-ids');
    dl.innerHTML = '';
    for (const id of [...state.itemIds].sort()) {
      dl.append(el('option', { value: id, label: state.itemNames.get(id) || id }));
    }
    // 태그 자동완성 — 전체 아이템 tags 합집합
    const tagSet = new Set();
    for (const it of Object.values(items)) {
      if (Array.isArray(it?.tags)) for (const t of it.tags) if (t) tagSet.add(t);
    }
    const tdl = $('#tag-list');
    if (tdl) { tdl.innerHTML = ''; for (const t of [...tagSet].sort()) tdl.append(el('option', { value: t })); }
  } catch (e) {
    console.warn('item id 목록 로드 실패 (검증 비활성):', e);
  }
  // 필드명 자동완성 — 알려진 필드(ITEM_HELP/FIELD_HELP) 합집합
  const fdl = $('#field-keys');
  if (fdl) {
    fdl.innerHTML = '';
    const keys = new Set([...Object.keys(ITEM_HELP), ...Object.keys(FIELD_HELP)]);
    for (const k of [...keys].sort()) fdl.append(el('option', { value: k }));
  }
  // 삭제 안전 검증용 — 실제 게임이 쓰는 퀘스트(폴더 병합본) + NPC 정의를 읽기전용 import.
  // 실패해도 검증만 약화되고 편집 기능은 유지된다.
  try {
    state.refQuests = (await import('../../js/data/mainQuests/index.js')).default || {};
  } catch (e) {
    state.refQuests = {};
    console.warn('mainQuests/index.js 로드 실패 (랜드마크 참조 검증 약화):', e);
  }
  try {
    state.refNpcs = (await import('../../js/data/npcs.js')).default || {};
  } catch (e) {
    state.refNpcs = {};
    console.warn('npcs.js 로드 실패 (spawnLandmark 검증 약화):', e);
  }
  // editable data blocks (로컬 파일 원문 → 파싱). original = 원본 스냅샷(되돌리기용)
  try {
    for (const [key, cfg] of Object.entries(DATA_FILES)) {
      const text = await getFileText(cfg.path);
      const data = extractValue(text, cfg.decl);
      state.files[key] = { text, data, original: structuredClone(data) };
    }
  } catch (e) {
    status(`데이터 로드 실패: ${e.message}`, 'err');
    return;
  }
  // 로드 직후 = 변경 없음. 저장 버튼은 변경이 생기면 자동 활성화된다.
  $('#save-btn').title = '변경 저장 + 커밋 + 푸시';
  refreshChangeCount();
  if (state.gitAvailable) {
    status(`불러오기 완료 (브랜치: ${state.branch}). 탭에서 편집하세요.`, 'ok');
  } else {
    status(`불러오기 완료. ⚠️ git 사용 불가(${state.gitReason}) — 저장은 로컬 디스크에만 기록되고 푸시는 생략됩니다. 수동 커밋이 필요합니다.`, 'info');
  }
  render();
}

// ─── 저장 + 커밋 + 푸시 (로컬 git) ───────────────────────────
// dirty가 없어도 호출 가능 — 이전에 밀려있던 로컬 커밋을 푸시(동기화)하는 용도로도 쓰인다.
async function saveAll() {
  const issues = collectIssues();
  if (issues.length) {
    const ok = confirm(
      `검증 문제 ${issues.length}건이 있습니다.\n` +
      issues.slice(0, 5).map((i) => `· ${entityTitle(i.fileKey, i.entityKey)} ▸ ${i.path}: ${i.msg} (${i.id})`).join('\n') +
      (issues.length > 5 ? `\n… 외 ${issues.length - 5}건` : '') +
      '\n\n[확인]=무시하고 저장/푸시,  [취소]=⚠️검증 탭에서 위치 확인');
    if (!ok) { switchTab('validate'); return; }
  }
  const changed = changedFileKeys();
  if (!changed.length) { status('변경된 내용이 없습니다.', 'info'); return; }
  // 커밋 제목/본문 — baseline 갱신 전에 변경 요약을 캡처
  const summary = changeSummaryLines();
  const MAX_BODY = 100;
  const bodyText = summary.slice(0, MAX_BODY).join('\n')
    + (summary.length > MAX_BODY ? `\n- …외 ${summary.length - MAX_BODY}건` : '');
  const subject = (state.commitMsg && state.commitMsg !== DEFAULT_COMMIT_MSG)
    ? state.commitMsg : autoSubject();
  $('#save-btn').disabled = true;
  status('로컬 파일 기록 중…', 'info');
  try {
    // 1) 변경된 파일을 스플라이스해 디스크에 기록 (실제 텍스트가 바뀐 것만)
    const files = [];
    for (const key of changed) {
      const cfg = DATA_FILES[key];
      const f = state.files[key];
      const newText = spliceObjectLiteral(f.text, cfg.decl, f.data);
      if (newText === f.text) continue; // 이미 디스크/커밋에 반영된 경우 (푸시만 필요)
      f.text = newText;
      files.push({ path: cfg.path, content: newText });
    }
    if (files.length) await saveFiles(files);

    // 2) git이 없으면 디스크 기록까지만 — 변경 baseline 갱신 후 종료
    if (!state.gitAvailable) {
      for (const key of changed) state.files[key].original = structuredClone(state.files[key].data);
      refreshChangeCount();
      status(`💾 로컬 파일 ${files.length}개 저장 완료. git 사용 불가로 푸시 생략 — 수동으로 커밋/푸시하세요.`, 'info');
      return;
    }

    // 3) git add/commit/push (이미 커밋만 되고 안 밀린 게 있으면 함께 flush)
    status('git 커밋 & 푸시 중…', 'info');
    const result = await pushChanges(subject, files.map((f) => f.path), bodyText);

    // 성공 → 변경 baseline 갱신 (이제 "변경 없음" → 버튼 비활성화)
    for (const key of changed) state.files[key].original = structuredClone(state.files[key].data);
    refreshChangeCount();

    if (result.committed && result.pushed) {
      status(`✅ 커밋 + 푸시 완료 → ${result.branch}  (${changed.length}개 파일)`, 'ok');
    } else if (!result.committed && result.pushed) {
      status(`✅ 밀려있던 로컬 커밋을 푸시했습니다 → ${result.branch}`, 'ok');
    } else {
      status('✅ 저장 완료 (원격은 이미 최신).', 'ok');
    }
  } catch (e) {
    // 파일은 디스크에 기록됨. baseline은 갱신하지 않아 변경 표시/버튼 유지 → 재시도 가능
    refreshChangeCount();
    status(`💾 파일은 저장됨. 커밋/푸시 실패: ${e.message}${e.detail ? `\n${e.detail}` : ''}`, 'err');
  }
}
$('#save-btn').addEventListener('click', saveAll);

// 데이터 무결성 검사 — 위치(파일/엔티티/필드)까지 포함한 상세 이슈 목록
// 각 이슈: { fileKey, entityKey, path, id, msg }
function collectIssues() {
  const issues = [];
  const itemsKnown = state.itemIds.size > 0;
  const badItem = (id) => itemsKnown && id && !state.itemIds.has(id);

  const d = state.files.districts?.data || {};
  for (const [key, dist] of Object.entries(d)) {
    (dist.lootTable || []).forEach((r, i) => {
      if (badItem(r.definitionId)) issues.push({ fileKey: 'districts', entityKey: key, path: `lootTable[${i}].definitionId`, id: r.definitionId, msg: '존재하지 않는 아이템 ID' });
    });
  }

  const lm = state.files.landmarks?.data || {};
  for (const [key, m] of Object.entries(lm)) {
    (m.subLocations || []).forEach((sub, si) => {
      (sub.lootTable || []).forEach((r, i) => {
        if (badItem(r.id)) issues.push({ fileKey: 'landmarks', entityKey: key, path: `${sub.name || `세부장소#${si}`} ▸ lootTable[${i}].id`, id: r.id, msg: '존재하지 않는 아이템 ID' });
      });
    });
  }

  // ── 랜드마크/세부장소 구조 검증 (연결·참조 무결성) ──
  const lmMeta = state.files.landmarkMeta?.data || {};
  // 알려진 랜드마크 id의 모든 변형(키·lm_접두·무접두) 집합
  const knownLandmark = new Set();
  for (const id of landmarkCardIds()) for (const v of landmarkIdVariants(id)) knownLandmark.add(v);
  for (const id of Object.keys(lmMeta)) for (const v of landmarkIdVariants(id)) knownLandmark.add(v);
  for (const k of Object.keys(lm)) for (const v of landmarkIdVariants(k)) knownLandmark.add(v);

  // 1) 구의 연결 랜드마크에 카드 정의가 없음
  for (const [dkey, dist] of Object.entries(d)) {
    districtLandmarks(dist).forEach((lmId, i) => {
      if (lmId && !knownLandmark.has(lmId)) {
        issues.push({ fileKey: 'districts', entityKey: dkey, path: `연결 랜드마크[${i}]`, id: lmId, msg: '랜드마크 카드 정의 없음 (items/LANDMARK_CARD_META 누락)' });
      }
    });
  }

  // 2) 퀘스트/NPC가 존재하지 않는 랜드마크를 참조 (실사용 소스 스캔)
  for (const [qid, q] of Object.entries(state.refQuests || {})) {
    const lid = q?.objective?.landmarkId;
    if (lid && !knownLandmark.has(lid)) issues.push({ fileKey: 'landmarks', entityKey: lid.replace(/^lm_/, ''), path: `퀘스트 ${q.title || qid} ▸ objective.landmarkId`, id: lid, msg: '퀘스트가 참조하는 랜드마크가 없음' });
    const hid = q?.locationHint?.landmarkId;
    if (hid && !knownLandmark.has(hid)) issues.push({ fileKey: 'landmarks', entityKey: hid.replace(/^lm_/, ''), path: `퀘스트 ${q.title || qid} ▸ locationHint.landmarkId`, id: hid, msg: '퀘스트가 참조하는 랜드마크가 없음' });
  }
  for (const [nid, n] of Object.entries(state.refNpcs || {})) {
    const lid = n?.spawnLandmark;
    if (lid && !knownLandmark.has(lid)) issues.push({ fileKey: 'landmarks', entityKey: lid.replace(/^lm_/, ''), path: `NPC ${n.name || nid} ▸ spawnLandmark`, id: lid, msg: 'NPC가 참조하는 랜드마크가 없음' });
  }

  // 3) 미연결 랜드마크 (어떤 구에서도 참조되지 않음 — 보호/이벤트 제외, 정보성)
  const connected = new Set();
  for (const dist of Object.values(d)) for (const lmId of districtLandmarks(dist)) for (const v of landmarkIdVariants(lmId)) connected.add(v);
  for (const k of Object.keys(lm)) {
    if (isProtectedLandmark(k)) continue;
    if (lm[k]?.isBasecampLandmark) continue;
    if (![...landmarkIdVariants(k)].some((v) => connected.has(v))) {
      issues.push({ fileKey: 'landmarks', entityKey: k, path: '(구 연결 없음)', id: k, msg: '미연결 랜드마크 — 어떤 구에서도 참조되지 않습니다' });
    }
  }

  // 퀘스트 — 19개 소스 파일 병합 검증. fileKey는 퀘스트별 실제 소스 파일.
  const qIdx = buildQuestIndex();
  const qIds = new Set(Object.keys(qIdx));
  for (const [key, fk] of Object.entries(qIdx)) {
    const quest = state.files[fk].data[key];
    if (badItem(quest.objective?.definitionId)) issues.push({ fileKey: fk, entityKey: key, path: 'objective.definitionId', id: quest.objective.definitionId, msg: '존재하지 않는 아이템 ID' });
    if (quest.objective?.districtId && !d[quest.objective.districtId]) issues.push({ fileKey: fk, entityKey: key, path: 'objective.districtId', id: quest.objective.districtId, msg: '존재하지 않는 구(district) ID' });
    (quest.reward?.items || []).forEach((it, i) => {
      if (badItem(it.definitionId)) issues.push({ fileKey: fk, entityKey: key, path: `reward.items[${i}].definitionId`, id: it.definitionId, msg: '존재하지 않는 아이템 ID' });
    });
    if (quest.prerequisite && !qIds.has(quest.prerequisite)) issues.push({ fileKey: fk, entityKey: key, path: 'prerequisite', id: quest.prerequisite, msg: '존재하지 않는 선행 퀘스트 ID' });
  }
  return issues;
}

// 해당 엔티티가 있는 탭으로 이동 + 선택.
// 퀘스트·아이템은 소스 파일이 여러 개라 fileKey가 곧 탭이 아니다 → 논리 탭으로 매핑.
function gotoEntity(fileKey, entityKey) {
  const tab = QUEST_FILE_KEYS.includes(fileKey) ? 'quests'
            : ITEM_FILE_KEYS.includes(fileKey) ? 'items'
            : fileKey;
  state.sel[tab] = entityKey;
  switchTab(tab);
}

function renderValidationTab() {
  const issues = collectIssues();
  const wrap = el('div', { class: 'detail' });
  wrap.append(el('h2', { text: `⚠️ 검증 (${issues.length})` }));
  if (state.itemIds.size === 0) {
    wrap.append(el('p', { class: 'hint', text: '※ items.js 로드 실패로 아이템 ID 검증이 비활성화돼 있습니다.' }));
  }
  if (!issues.length) {
    wrap.append(el('div', { class: 'empty', text: '문제가 없습니다. 👍' }));
    view.append(wrap);
    return;
  }
  for (const it of issues) {
    const loc = `[${DATA_FILES[it.fileKey].label.split(' ')[0]}] ${entityTitle(it.fileKey, it.entityKey)}`;
    const row = el('fieldset', {}, [
      el('legend', { text: it.msg }),
      el('div', {}, [el('code', { text: it.id || '(빈 값)' })]),
      el('div', { class: 'hint', text: `${loc}  ▸  ${it.path}` }),
      el('button', { class: 'ghost', text: '→ 해당 위치로 이동', onclick: () => gotoEntity(it.fileKey, it.entityKey) }),
    ]);
    wrap.append(row);
  }
  view.append(wrap);
}

// ─── 아이템 탭 (소스 직접 편집) ───────────────────────────────
// 편집 가능한 아이템 소스 파일에서 id → fileKey 인덱스 구성
function buildItemIndex() {
  const idx = {};
  for (const fk of ITEM_FILE_KEYS) {
    const d = state.files[fk]?.data;
    if (!d) continue;
    for (const id of Object.keys(d)) idx[id] = fk;
  }
  return idx;
}

// 퀘스트 id → 소속 소스 파일 키 인덱스 (게임 실사용 19파일 병합).
function buildQuestIndex() {
  const idx = {};
  for (const fk of QUEST_FILE_KEYS) {
    const d = state.files[fk]?.data;
    if (!d) continue;
    for (const id of Object.keys(d)) idx[id] = fk;
  }
  return idx;
}

// 19파일을 단일 { qid: quest } 맵으로 병합 (편집 중인 라이브 데이터 참조 — 흐름/탭 공용).
function mergedQuestData(idx = buildQuestIndex()) {
  const out = {};
  for (const [qid, fk] of Object.entries(idx)) out[qid] = state.files[fk].data[qid];
  return out;
}

function renderItemsTab() {
  const idx = buildItemIndex();
  const ids = Object.keys(idx).sort();
  if (!ids.length) {
    view.append(el('div', { class: 'empty', text: '아이템 소스를 불러오지 못했습니다. (serve.js 연결 확인)' }));
    return;
  }
  if (!state.sel.items || !idx[state.sel.items]) state.sel.items = ids[0];

  const search = el('input', { value: state.itemSearch || '', placeholder: '이름·ID·종류 검색…' });
  const listBox = el('div', { class: 'sidebar' });
  const detailWrap = el('div', { class: 'detail' });

  const renderDetail = () => {
    detailWrap.innerHTML = '';
    const fk = idx[state.sel.items];
    const it = fk && state.files[fk]?.data?.[state.sel.items];
    if (!it) { detailWrap.append(el('div', { class: 'hint', text: '아이템을 선택하세요.' })); return; }

    detailWrap.append(el('div', { class: 'field-row', style: 'align-items:center;justify-content:space-between' }, [
      el('h2', { text: `${it.icon || ''} ${it.name || it.id}` }),
      el('button', {
        class: 'ghost', text: '📋 복사',
        title: '이 아이템을 복사 — 같은 설정의 새 아이템 생성 (아래 붙여넣기 패널)',
        onclick: () => copyItem(state.sel.items),
      }),
    ]));
    detailWrap.append(el('div', { class: 'sub', text: `${it.id}  ·  ${DATA_FILES[fk].label}` }));

    // 선택 플래그 — 필드가 없어도 켜고 끌 수 있게 항상 노출(끄면 필드 삭제)
    const ITEM_FLAGS = new Set(['immovable']);
    const flagRow = el('div', { class: 'field-row' });
    flagRow.append(optionalFlag(it, 'immovable', fk, helpForItem('immovable')));
    detailWrap.append(flagRow);

    // id·플래그 외 모든 필드 편집 (id는 객체 키라 읽기 전용 — 헤더에 표시)
    const scalars = el('div', { class: 'field-row' });
    const nested = [];
    for (const k of Object.keys(it)) {
      if (k === 'id' || ITEM_FLAGS.has(k)) continue;
      const child = it[k];
      if (child !== null && typeof child === 'object') nested.push(objNode(it, k, 0, fk, helpForItem));
      else scalars.append(scalarInput(it, k, fk, helpForItem(k)));
    }
    if (scalars.children.length) detailWrap.append(scalars);
    nested.forEach((n) => detailWrap.append(n));
    // 새 최상위 필드 추가 (onTick·onWear·armor·combat 등 — 그룹{}으로 넣고 안에서 하위값 추가)
    detailWrap.append(el('div', { class: 'add-key-wrap' }, [
      el('span', { class: 'side-group', text: '필드 추가' }),
      addKeyControl(it, fk, helpForItem),
    ]));
  };

  const renderList = () => {
    const q = (state.itemSearch || '').trim().toLowerCase();
    listBox.innerHTML = '';
    listBox.append(el('button', { class: 'ghost row-add', text: '+ 새 아이템 추가', onclick: createItem }));
    const matched = ids.filter((id) => {
      if (!q) return true;
      const it = state.files[idx[id]].data[id];
      return id.toLowerCase().includes(q)
        || (it.name || '').toLowerCase().includes(q)
        || (it.type || '').toLowerCase().includes(q)
        || (it.subtype || '').toLowerCase().includes(q);
    });
    listBox.append(el('div', { class: 'side-group', text: `${matched.length} / ${ids.length}개` }));
    for (const id of matched.slice(0, 500)) {
      const it = state.files[idx[id]].data[id];
      listBox.append(el('button', {
        class: 'side-item' + (id === state.sel.items ? ' active' : ''),
        text: `${it.icon || ''} ${it.name || id}`,
        onclick: () => { state.sel.items = id; renderList(); renderDetail(); },
      }));
    }
    if (matched.length > 500) listBox.append(el('div', { class: 'hint', text: '※ 상위 500개만 표시 — 검색으로 좁히세요.' }));
  };

  // objNode의 +/✕가 호출하는 전역 rerenderDetail을 아이템 상세 갱신에 연결
  rerenderDetail = () => { renderList(); renderDetail(); };
  search.addEventListener('input', () => { state.itemSearch = search.value; renderList(); });
  renderList();
  renderDetail();
  const helpBtn = el('button', {
    class: 'ghost' + (state.itemHelpOpen ? ' active' : ''),
    text: state.itemHelpOpen ? '❓ 도움말 닫기' : '❓ 태그·필드 도움말',
    onclick: () => { state.itemHelpOpen = !state.itemHelpOpen; render(); },
  });
  view.append(el('div', {}, [
    el('div', { class: 'field-row', style: 'align-items:center;gap:10px;margin-bottom:8px' }, [
      helpBtn,
      el('div', { class: 'hint', style: 'margin:0' }, '※ 아이템 정의 소스를 직접 편집합니다. stackable·maxStack은 stackConfig.js가 런타임에 덮어쓸 수 있습니다.'),
    ]),
    el('div', { class: 'field', style: 'margin-bottom:10px' }, [search]),
    ...(state.itemHelpOpen ? [renderItemHelpPanel()] : []),
    renderItemClipboardPanel(),
    el('div', { class: 'list-layout' }, [listBox, detailWrap]),
  ]));
}

// 전 아이템 id 집합 (복제 시 충돌 검사 — 집계본 + 편집 소스 양쪽)
function allItemIds() {
  const ids = new Set(state.itemIds);
  for (const id of Object.keys(buildItemIndex())) ids.add(id);
  return ids;
}

// 신규 아이템 생성 — 현재 선택 아이템과 같은 소스 파일에 최소 골격으로 추가
function createItem() {
  const raw = (prompt('새 아이템 ID (영문/숫자/밑줄, 예: my_item)') || '').trim();
  if (!raw) return;
  const id = raw.replace(/[^A-Za-z0-9_]/g, '');
  if (!id) { alert('ID는 영문/숫자/밑줄만 사용하세요.'); return; }
  if (allItemIds().has(id)) { alert('이미 존재하는 아이템 ID입니다.'); return; }
  const fk = buildItemIndex()[state.sel.items] || 'items_misc'; // 보던 아이템과 같은 소스 파일
  if (!state.files[fk]) { alert('아이템 소스 파일을 찾을 수 없습니다.'); return; }
  const name = (prompt('아이템 이름', '새 아이템') || '새 아이템').trim();
  const icon = (prompt('아이콘 (이모지)', '📦') || '📦').trim();
  state.files[fk].data[id] = { id, name, icon, type: 'material', weight: 0.1, stackable: true, maxStack: 20, tags: [] };
  state.sel.items = id;
  markDirty(fk);
  status(`아이템 「${name}」(${id}) 생성 → ${DATA_FILES[fk].label}. 복잡한 효과(onConsume 등)는 비슷한 아이템을 📋 복사하는 게 편합니다. ⚠️ stackConfig·CardFactory(CARD_IMAGES)·드랍 등록은 별도입니다.`, 'ok');
  render();
}

function copyItem(id) {
  const fk = buildItemIndex()[id];
  const it = fk && state.files[fk]?.data?.[id];
  if (!it) return;
  state.itemClipboard = { id, fileKey: fk, item: structuredClone(it), name: it.name || id };
  status(`아이템 「${it.name || id}」 복사됨 — 아래 패널에서 붙여넣으면 같은 설정의 새 아이템이 생성됩니다.`, 'ok');
  render();
}

function pasteItem(count) {
  const clip = state.itemClipboard;
  if (!clip) return;
  const fk = clip.fileKey;
  const data = state.files[fk]?.data;
  if (!data) return;
  const used = allItemIds();
  let lastId = null;
  for (let i = 0; i < count; i++) {
    let id = `${clip.id}_copy`, n = 2;
    while (used.has(id)) id = `${clip.id}_copy${n++}`;
    used.add(id);
    const clone = structuredClone(clip.item);
    clone.id = id; // 내부 id를 새 키와 동기화
    if ('name' in clone) clone.name = `${clip.name}${count > 1 ? ` (복사 ${i + 1})` : ' (복사)'}`;
    data[id] = clone;
    lastId = id;
  }
  markDirty(fk);
  if (lastId) state.sel.items = lastId;
  status(`아이템 「${clip.name}」 복제본 ${count}개 생성 (소스: ${DATA_FILES[fk].label}). ⚠️ 새 아이템은 stackConfig.js·CardFactory(CARD_IMAGES)·구/랜드마크 드랍에 자동 등록되지 않습니다 — 필요 시 등록하세요.`, 'ok');
  render();
}

// 아이템 탭 도움말 — 쓸 수 있는 필드(ITEM_HELP)와 현재 사용 중인 태그 목록을 정리해 보여준다.
// 「필드 추가」 / tags 입력 시 무엇이 있는지 참고용. 필터로 필드·태그·설명을 동시 검색.
function renderItemHelpPanel() {
  const wrap = el('div', { class: 'help-panel' });

  // 현재 사용 중인 태그 → 사용 아이템 수 집계
  const tagCount = {};
  for (const it of Object.values(state.items || {})) {
    if (Array.isArray(it?.tags)) for (const t of it.tags) if (t) tagCount[t] = (tagCount[t] || 0) + 1;
  }

  const filter   = el('input', { class: 'help-filter', placeholder: '🔍 필드·태그·설명 검색…', value: state.itemHelpQuery || '' });
  const fieldsBox = el('div', { class: 'help-fields' });
  const tagsBox   = el('div', { class: 'help-tags' });

  const draw = () => {
    const q = (state.itemHelpQuery || '').trim().toLowerCase();
    // ── 필드 ──
    fieldsBox.innerHTML = '';
    const fkeys = Object.keys(ITEM_HELP)
      .filter((k) => !q || k.toLowerCase().includes(q) || ITEM_HELP[k].toLowerCase().includes(q))
      .sort();
    fieldsBox.append(el('div', { class: 'side-group', text: `필드 ${fkeys.length}개` }));
    for (const k of fkeys) {
      fieldsBox.append(el('div', { class: 'help-row' }, [
        el('code', { class: 'help-key', text: k }),
        el('span', { class: 'help-desc', text: ITEM_HELP[k] }),
      ]));
    }
    // ── 태그 (사용 빈도순) — 설명 있으면 같이, 검색은 태그명+설명 ──
    tagsBox.innerHTML = '';
    const tkeys = Object.keys(tagCount)
      .filter((t) => !q || t.toLowerCase().includes(q) || helpForTag(t).toLowerCase().includes(q))
      .sort((a, b) => tagCount[b] - tagCount[a] || a.localeCompare(b));
    const described = tkeys.filter((t) => helpForTag(t)).length;
    tagsBox.append(el('div', { class: 'side-group', text: `태그 ${tkeys.length}종 (설명 ${described}) · 사용 중` }));
    for (const t of tkeys) {
      const desc = helpForTag(t);
      tagsBox.append(el('div', { class: 'help-row' }, [
        el('code', { class: 'help-key', title: `${tagCount[t]}개 아이템에서 사용`, text: `${t} ×${tagCount[t]}` }),
        el('span', { class: desc ? 'help-desc' : 'help-desc muted', text: desc || '(분류·검색용 태그)' }),
      ]));
    }
  };
  filter.addEventListener('input', () => { state.itemHelpQuery = filter.value; draw(); });
  draw();

  wrap.append(
    el('div', { class: 'hint', text: '※ 아이템에 쓸 수 있는 필드 설명과 현재 사용 중인 태그입니다. 「필드 추가」·tags 입력 시 참고하세요. (효과 그룹 onTick·onWear 등은 그룹{}으로 추가 후 안에 하위 필드를 넣습니다.)' }),
    el('div', { class: 'field', style: 'margin:6px 0 10px' }, [filter]),
    el('div', { class: 'help-cols' }, [fieldsBox, tagsBox]),
  );
  return wrap;
}

// 클립보드가 있을 때 아이템 탭에 뜨는 붙여넣기(복제) 패널
function renderItemClipboardPanel() {
  const clip = state.itemClipboard;
  if (!clip) return null;
  const fs = el('fieldset', { style: 'margin-bottom:10px' }, el('legend', { text: '📋 붙여넣기 (아이템 복제)' }));
  fs.append(el('div', { class: 'hint', text: `복사됨: 아이템 「${clip.name}」 (${clip.id}) — 붙여넣으면 같은 설정의 새 아이템이 생성됩니다 (ID 자동 생성, 이름에 "(복사)" 표기). 소스: ${DATA_FILES[clip.fileKey].label}.` }));
  const cnt = el('input', { type: 'number', value: 1, min: 1, style: 'width:70px' });
  const pasteBtn = el('button', {
    class: 'primary', text: '붙여넣기',
    onclick: () => { const n = Math.max(1, Math.floor(Number(cnt.value) || 1)); pasteItem(n); },
  });
  const clearBtn = el('button', { class: 'ghost', text: '복사 취소', onclick: () => { state.itemClipboard = null; render(); } });
  fs.append(el('div', { class: 'field-row', style: 'margin-top:8px;align-items:flex-end' }, [
    el('div', { class: 'field' }, [el('label', { text: '개수' }), cnt]),
    pasteBtn, clearBtn,
  ]));
  return fs;
}

// ─── 변경 사항(diff) + 되돌리기 ──────────────────────────────
// original 스냅샷과 현재 data를 비교해 엔티티(구/랜드마크/퀘스트)별 변경 목록 생성
// (diffValue는 serialize.js의 순수 함수)
function entityTitle(fileKey, key) {
  const e = state.files[fileKey].data[key] || state.files[fileKey].original[key] || {};
  if (QUEST_FILE_KEYS.includes(fileKey)) return `${e.icon || ''} ${e.title || key} · ${e.characterId || ''}`;
  return `${e.icon || ''} ${e.name || key}`;
}

function computeChanges() {
  const groups = [];
  for (const fileKey of Object.keys(DATA_FILES)) {
    const f = state.files[fileKey];
    if (!f) continue;
    const keys = new Set([...Object.keys(f.original || {}), ...Object.keys(f.data || {})]);
    for (const key of keys) {
      const diffs = [];
      diffValue(f.original?.[key], f.data?.[key], '', diffs);
      if (diffs.length) groups.push({ fileKey, entityKey: key, title: entityTitle(fileKey, key), changes: diffs });
    }
  }
  return groups;
}

function fmtVal(v) {
  if (v === undefined) return '(없음)';
  if (v === null) return 'null';
  if (v === Infinity) return '∞';
  if (typeof v === 'object') return Array.isArray(v) ? `[${v.length}개]` : '{객체}';
  if (typeof v === 'string') return v.length > 40 ? `"${v.slice(0, 40)}…"` : `"${v}"`;
  return String(v);
}

function revertEntity(fileKey, key) {
  const f = state.files[fileKey];
  if (f.original && key in f.original) f.data[key] = structuredClone(f.original[key]);
  else delete f.data[key];
  refreshChangeCount();
  render();
}

function revertAll() {
  for (const fileKey of Object.keys(DATA_FILES)) {
    const f = state.files[fileKey];
    if (f) f.data = structuredClone(f.original);
  }
  refreshChangeCount();
  render();
}

function changeRow(g, c) {
  const parts = [];
  if (c.kind === 'added') parts.push('➕ ');
  if (c.kind === 'removed') parts.push('➖ ');
  parts.push(el('code', { text: c.path || '(항목)' }));
  // lootTable 행이면 해당 아이템 이름 표시
  const m = /lootTable\[(\d+)\]/.exec(c.path || '');
  if (m) {
    const row = state.files[g.fileKey].data[g.entityKey]?.lootTable?.[m[1]]
      || state.files[g.fileKey].original[g.entityKey]?.lootTable?.[m[1]];
    const id = row?.definitionId || row?.id;
    if (id) parts.push(el('span', { class: 'chain-badge', text: itemName(id) || id }));
  }
  parts.push(`  ${fmtVal(c.old)} → `);
  parts.push(el('b', { text: fmtVal(c.new) }));
  return el('div', { class: 'hint' }, parts);
}

function renderChangesTab() {
  const groups = computeChanges();
  const total = groups.reduce((s, g) => s + g.changes.length, 0);
  const wrap = el('div', { class: 'detail' });
  wrap.append(el('h2', { text: `🔧 변경 사항 (${total})` }));
  if (!groups.length) {
    wrap.append(el('div', { class: 'empty', text: '변경된 내용이 없습니다.' }));
    view.append(wrap);
    return;
  }
  wrap.append(el('div', { class: 'field-row' }, [
    el('button', { class: 'ghost danger', text: '⟲ 전체 되돌리기',
      onclick: () => { if (confirm('모든 변경을 원본으로 되돌릴까요?')) revertAll(); } }),
  ]));
  for (const g of groups) {
    const fs = el('fieldset', {}, el('legend', {
      text: `[${DATA_FILES[g.fileKey].label.split(' ')[0]}] ${g.title}`,
    }));
    fs.append(el('button', { class: 'ghost', text: '↩ 이 항목 되돌리기',
      onclick: () => revertEntity(g.fileKey, g.entityKey) }));
    for (const c of g.changes) fs.append(changeRow(g, c));
    wrap.append(fs);
  }
  view.append(wrap);
}

// 변경 요약을 커밋 본문용 텍스트 줄 목록으로 (사람이 읽기 좋게)
// 예) - [장소] 🏥 강남구 ▸ lootTable[3].weight (천 조각): 25 → 40
function changeSummaryLines() {
  const lines = [];
  for (const g of computeChanges()) {
    const fileLabel = DATA_FILES[g.fileKey].label.split(' ')[0];
    for (const c of g.changes) {
      let ctx = '';
      const m = /lootTable\[(\d+)\]/.exec(c.path || '');
      if (m) {
        const row = state.files[g.fileKey].data[g.entityKey]?.lootTable?.[m[1]]
          || state.files[g.fileKey].original[g.entityKey]?.lootTable?.[m[1]];
        const id = row?.definitionId || row?.id;
        if (id) ctx = ` (${itemName(id) || id})`;
      }
      const mark = c.kind === 'added' ? '추가 ' : c.kind === 'removed' ? '삭제 ' : '';
      lines.push(`- [${fileLabel}] ${g.title} ▸ ${c.path}${ctx}: ${mark}${fmtVal(c.old)} → ${fmtVal(c.new)}`);
    }
  }
  return lines;
}

// 커밋 제목 자동 생성 (사용자가 기본 메시지를 그대로 둔 경우)
const DEFAULT_COMMIT_MSG = 'data: 에디터에서 데이터 수정';
function autoSubject() {
  const groups = computeChanges();
  if (!groups.length) return DEFAULT_COMMIT_MSG;
  const fileLabels = [...new Set(groups.map((g) => DATA_FILES[g.fileKey].label.split(' ')[0]))];
  const totalChanges = groups.reduce((s, g) => s + g.changes.length, 0);
  return `data: ${fileLabels.join('·')} ${groups.length}개 항목 ${totalChanges}건 수정`;
}

// ─── reusable loot-table editor ──────────────────────────────
// rows: array of objects. idKey = 'definitionId' (districts) | 'id' (landmarks).
// extraCols: list of {key, label} numeric columns to show.
// opts.classCol: true면 자원 클래스(cls) 드롭다운 열 추가 (구 드랍 전용 — surface/expedition/mineral)
function lootTableEditor(rows, idKey, extraCols, fileKey, opts = {}) {
  const total = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0) || 1;
  const tbl = el('table', { class: 'loot' });
  const th = (text, key) => {
    const help = helpFor(key);
    return el('th', help ? { text, title: help, class: 'has-help' } : { text });
  };
  const head = el('tr', {}, [
    th('아이템 ID', idKey),
    th('이름', '__name'),
    th('weight', 'weight'),
    opts.classCol ? th('자원', 'cls') : null,
    opts.classCol ? th('제철', 'seasons') : null,
    ...extraCols.map((c) => th(c.label, c.key)),
    th('%', '__pct'),
    el('th', {}),
  ]);
  tbl.append(el('thead', {}, head));
  const body = el('tbody');

  const redrawPct = () => {
    const t = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0) || 1;
    [...body.querySelectorAll('tr')].forEach((tr, i) => {
      const pct = ((Number(rows[i].weight) || 0) / t) * 100;
      tr.querySelector('.pct').textContent = pct.toFixed(1) + '%';
    });
  };

  rows.forEach((row, idx) => {
    const idInput = el('input', { class: 'id', value: row[idKey] ?? '', list: 'item-ids' });
    if (state.itemIds.size && row[idKey] && !state.itemIds.has(row[idKey])) {
      idInput.classList.add('ref-bad');
    }
    const nameCell = el('td', { class: 'name-cell', text: itemName(row[idKey]) });
    idInput.addEventListener('input', () => {
      row[idKey] = idInput.value.trim();
      idInput.classList.toggle('ref-bad',
        state.itemIds.size && row[idKey] && !state.itemIds.has(row[idKey]));
      nameCell.textContent = itemName(row[idKey]);
      markDirty(fileKey);
    });
    const wInput = el('input', { class: 'num', type: 'number', value: row.weight ?? 0 });
    wInput.addEventListener('input', () => {
      row.weight = Number(wInput.value); markDirty(fileKey); redrawPct();
    });
    // 자원 클래스 드롭다운 (구 드랍 전용). 기본 surface는 필드 미기록(diff 최소화).
    let clsCell = null;
    if (opts.classCol) {
      const sel = el('select');
      for (const [val, label] of [['surface', '표면'], ['expedition', '탐사']]) {
        sel.append(el('option', { value: val, ...((row.cls ?? 'surface') === val ? { selected: true } : {}) }, label));
      }
      sel.addEventListener('change', () => {
        if (sel.value === 'surface') delete row.cls; else row.cls = sel.value;
        markDirty(fileKey);
      });
      clsCell = el('td', {}, sel);
    }
    // 제철(seasons) 토글 — 4계절 체크. 기본(미지정) = 전부 켜짐(사철).
    // 전부 끄면 빈 배열([]) → 절대 안 나옴. 다시 4개 모두 켜면 필드 삭제(사철, diff 최소화).
    let seasonCell = null;
    if (opts.classCol) {
      const ALL = ['spring', 'summer', 'autumn', 'winter'];
      const wrap = el('div', { class: 'season-toggles', style: 'display:flex;gap:2px' });
      const curSet = () => (Array.isArray(row.seasons) ? row.seasons : ALL.slice());
      const paint = (b, on) => {
        b.classList.toggle('on', on);
        b.style.cssText = `font-size:10px;padding:1px 3px;${on ? 'background:var(--accent,#4a8);color:#fff' : 'opacity:.4'}`;
      };
      const btns = {};
      for (const [val, label] of [['spring', '봄'], ['summer', '여름'], ['autumn', '가을'], ['winter', '겨울']]) {
        const b = el('button', { class: 'season-tog', title: label, text: label[0] });
        paint(b, curSet().includes(val));
        b.addEventListener('click', () => {
          let s = curSet();
          s = s.includes(val) ? s.filter(x => x !== val) : [...s, val];
          if (s.length === ALL.length) delete row.seasons;       // 전부 온 = 사철(기본)
          else row.seasons = ALL.filter(x => s.includes(x));     // 일부 또는 [] (전부 끔 = 안 나옴)
          markDirty(fileKey);
          for (const v of ALL) paint(btns[v], curSet().includes(v));
        });
        btns[val] = b;
        wrap.append(b);
      }
      seasonCell = el('td', {}, wrap);
    }
    const tr = el('tr', {}, [
      el('td', {}, idInput),
      nameCell,
      el('td', {}, wInput),
      clsCell,
      seasonCell,
      ...extraCols.map((c) => {
        const inp = el('input', { class: 'num', type: 'number', step: 'any', value: row[c.key] ?? '' });
        inp.addEventListener('input', () => {
          if (inp.value === '') delete row[c.key];
          else row[c.key] = Number(inp.value);
          markDirty(fileKey);
        });
        return el('td', {}, inp);
      }),
      el('td', { class: 'pct', text: (((Number(row.weight) || 0) / total) * 100).toFixed(1) + '%' }),
      el('td', {}, el('button', {
        class: 'ghost danger', text: '✕',
        onclick: () => { rows.splice(idx, 1); markDirty(fileKey); rerenderDetail(); },
      })),
    ]);
    body.append(tr);
  });
  tbl.append(body);

  const addBtn = el('button', {
    class: 'ghost row-add', text: '+ 행 추가',
    onclick: () => {
      const nr = { [idKey]: '', weight: 1 };
      for (const c of extraCols) if (c.required) nr[c.key] = 1;
      rows.push(nr); markDirty(fileKey); rerenderDetail();
    },
  });
  return el('div', {}, [tbl, addBtn]);
}

// ─── generic scalar / object field editors ───────────────────
// onAfter: 값 변경 직후 호출되는 선택 콜백 (예: 사이드바 라벨·제목 즉시 갱신)
function scalarInput(obj, key, fileKey, help, onAfter) {
  const v = obj[key];
  const lbl = help !== undefined ? labelEl(key, help) : fieldLabel(key);
  // 불리언 → 체크박스
  if (typeof v === 'boolean') {
    const cb = el('input', { type: 'checkbox', ...(v ? { checked: true } : {}) });
    cb.addEventListener('change', () => { obj[key] = cb.checked; markDirty(fileKey); onAfter?.(); });
    return el('div', { class: 'field' }, [lbl, el('label', { class: 'hint' }, [cb, ' (켜기/끄기)'])]);
  }
  const isNum = typeof v === 'number' && v !== Infinity && v !== -Infinity;
  const inp = el('input', {
    type: isNum ? 'number' : 'text',
    step: 'any',
    value: v === Infinity ? '' : (v ?? ''),
  });
  if (v === Infinity) inp.placeholder = '∞ (Infinity)';
  inp.addEventListener('input', () => {
    obj[key] = isNum ? Number(inp.value) : inp.value;
    markDirty(fileKey);
    onAfter?.();
  });
  return el('div', { class: 'field' }, [lbl, inp]);
}

// 선택적 불리언 플래그 체크박스 — 체크 시 true 기록, 해제 시 필드 자체를 삭제 (diff 오염 방지)
function optionalFlag(obj, key, fileKey, help) {
  const cb = el('input', { type: 'checkbox', ...(obj[key] ? { checked: true } : {}) });
  cb.addEventListener('change', () => {
    if (cb.checked) obj[key] = true; else delete obj[key];
    markDirty(fileKey);
  });
  return el('div', { class: 'field' }, [labelEl(key, help || helpFor(key)), el('label', { class: 'hint' }, [cb, ' (켜기/끄기)'])]);
}

// 객체에 새 필드(키)를 추가하는 인라인 컨트롤 — 필드명 자동완성(#field-keys) + 타입 선택
//   onTick·onWear 같은 효과 그룹은 '그룹{}'으로 추가 → 그 안에서 다시 +필드로 하위값(temperature 등) 추가
function addKeyControl(obj, fileKey, helpFn) {
  const name = el('input', { class: 'add-key-name', list: 'field-keys', placeholder: '필드명 (예: onWear)' });
  const type = el('select', { class: 'add-key-type' });
  for (const [v, l] of [['text', '텍스트'], ['number', '숫자'], ['bool', '켜기/끄기'], ['object', '그룹 {}'], ['array', '목록 []']]) {
    type.append(el('option', { value: v }, l));
  }
  const DEFAULTS = { text: '', number: 0, bool: true, object: {}, array: [] };
  const commit = () => {
    const k = name.value.trim();
    if (!k) return;
    if (Object.prototype.hasOwnProperty.call(obj, k)) { status(`이미 "${k}" 필드가 있습니다.`, 'warn'); return; }
    obj[k] = structuredClone(DEFAULTS[type.value]);
    markDirty(fileKey);
    rerenderDetail();
  };
  const add = el('button', { class: 'ghost mini', text: '+ 필드', onclick: commit });
  name.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  // 알려진 필드면 입력 중 설명을 title로 미리보기
  name.addEventListener('input', () => { name.title = helpFn?.(name.value.trim()) || ''; });
  return el('div', { class: 'add-key-row' }, [name, type, add]);
}

// 사이드바의 특정 항목(data-key) 라벨을 즉시 갱신 — 이름/아이콘 편집 시 전체 재렌더 없이 반영
function refreshSidebarLabel(dataKey, text) {
  const btn = document.querySelector(`.sidebar .side-item[data-key="${dataKey}"]`);
  if (btn) btn.textContent = text;
}

// item-reward rows: [{definitionId, qty}]
function itemRows(arr, fileKey) {
  const wrap = el('div');
  arr.forEach((it, idx) => {
    const id = el('input', { class: 'id', value: it.definitionId ?? '', list: 'item-ids' });
    const nm = el('div', { class: 'ro-name', text: itemName(it.definitionId) });
    id.addEventListener('input', () => {
      it.definitionId = id.value.trim(); nm.textContent = itemName(it.definitionId); markDirty(fileKey);
    });
    const qty = el('input', { class: 'num', type: 'number', value: it.qty ?? 1 });
    qty.addEventListener('input', () => { it.qty = Number(qty.value); markDirty(fileKey); });
    wrap.append(el('div', { class: 'field-row item-row', style: 'align-items:flex-end' }, [
      el('div', { class: 'field id-col' }, [fieldLabel('item', 'definitionId'), id]),
      el('div', { class: 'field name-col' }, [fieldLabel('이름', '__name'), nm]),
      el('div', { class: 'field' }, [fieldLabel('qty', 'qty'), qty]),
      el('button', { class: 'ghost danger mini', text: '✕',
        onclick: () => { arr.splice(idx, 1); markDirty(fileKey); rerenderDetail(); } }),
    ]));
  });
  wrap.append(el('button', { class: 'ghost row-add', text: '+ 아이템',
    onclick: () => { arr.push({ definitionId: '', qty: 1 }); markDirty(fileKey); rerenderDetail(); } }));
  return wrap;
}

// render an arbitrary object's fields (scalars + special 'items' array)
function objectFields(obj, fileKey) {
  if (!obj) return el('div', { class: 'hint', text: '(없음)' });
  const wrap = el('div');
  const scalars = el('div', { class: 'field-row' });
  for (const key of Object.keys(obj)) {
    if (key === 'items' && Array.isArray(obj.items)) continue;
    scalars.append(scalarInput(obj, key, fileKey));
  }
  if (scalars.children.length) wrap.append(scalars);
  if (Array.isArray(obj.items)) {
    wrap.append(el('div', { class: 'hint', text: 'items' }));
    wrap.append(itemRows(obj.items, fileKey));
  }
  return wrap;
}

// ─── rendering ───────────────────────────────────────────────
function render() {
  view.innerHTML = '';
  if (state.tab === 'settings') return renderSettings();
  if (state.tab === 'balance') return renderBalanceTab();
  if (state.tab === 'items') return renderItemsTab();
  if (state.tab === 'flow') return renderFlowTab();
  if (state.tab === 'changes') return renderChangesTab();
  if (state.tab === 'validate') return renderValidationTab();
  // 세부장소·퀘스트는 단일 state.files 키가 없다(세부장소=landmarks.js 내부, 퀘스트=19파일 병합)
  // → 파일 가드보다 먼저 처리.
  if (state.tab === 'sublocations') return renderSubLocationsTab();
  if (state.tab === 'quests') return renderQuestsTab();
  if (!state.files[state.tab]) {
    view.append(el('div', { class: 'empty', text: '데이터 불러오는 중… (serve.js가 떠 있어야 합니다)' }));
    return;
  }
  if (state.tab === 'districts') return renderListTab('districts', (d) => d.name);
  if (state.tab === 'landmarks') return renderListTab('landmarks', (d) => d.name);
  if (state.tab === 'hidden') return renderListTab('hidden', (d) => d.name);
}

let rerenderDetail = () => {};

// 사이드바 상단 검색 입력 — 질의를 state.search[tabKey]에 저장(탭 전환해도 유지).
// 반환: { wrap(=DOM), onInput(fn) } — fn은 입력마다 호출돼 목록을 다시 그린다.
function sideSearchInput(tabKey) {
  state.search = state.search || {};
  const inp = el('input', { value: state.search[tabKey] || '', placeholder: '🔍 이름·ID 검색…' });
  const wrap = el('div', { class: 'side-search' }, [inp]);
  return {
    wrap,
    onInput(fn) { inp.addEventListener('input', () => { state.search[tabKey] = inp.value; fn(); }); },
  };
}

function renderListTab(fileKey, labelFn) {
  const data = state.files[fileKey].data;
  const keys = Object.keys(data);
  if (!state.sel[fileKey] || !data[state.sel[fileKey]]) state.sel[fileKey] = keys[0];

  const sidebar = el('div', { class: 'sidebar' });
  if (fileKey === 'landmarks') {
    sidebar.append(el('button', { class: 'ghost row-add', text: '+ 랜드마크 추가', onclick: createLandmark }));
  } else if (fileKey === 'districts') {
    sidebar.append(el('button', { class: 'ghost row-add', text: '+ 장소(구) 추가', onclick: createDistrict }));
  } else if (fileKey === 'hidden') {
    sidebar.append(el('button', { class: 'ghost row-add', text: '+ 숨은 장소 추가', onclick: createHidden }));
  }
  const search = sideSearchInput(fileKey);
  sidebar.append(search.wrap);
  const listBox = el('div');
  sidebar.append(listBox);
  const renderList = () => {
    const q = (state.search[fileKey] || '').trim().toLowerCase();
    listBox.innerHTML = '';
    const matched = keys.filter((k) => !q || k.toLowerCase().includes(q) || (labelFn(data[k]) || '').toLowerCase().includes(q));
    if (!matched.length) { listBox.append(el('div', { class: 'hint', style: 'padding:6px 10px', text: '검색 결과 없음' })); return; }
    for (const k of matched) {
      listBox.append(el('button', {
        class: 'side-item' + (k === state.sel[fileKey] ? ' active' : ''),
        'data-key': k,
        text: `${data[k].icon ? data[k].icon + ' ' : ''}${labelFn(data[k]) || k}`,
        onclick: () => { state.sel[fileKey] = k; rerenderDetail(); },
      }));
    }
  };
  search.onInput(renderList);
  renderList();

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b) =>
      b.classList.toggle('active', b.dataset.key === state.sel[fileKey]));
    detailWrap.innerHTML = '';
    if (fileKey === 'districts') renderDistrictDetail(detailWrap, data[state.sel[fileKey]]);
    else if (fileKey === 'hidden') renderHiddenDetail(detailWrap, data[state.sel[fileKey]]);
    else renderLandmarkDetail(detailWrap, data[state.sel[fileKey]]);
  };
  rerenderDetail();
  const panel = fileKey === 'landmarks' ? renderLandmarkClipboardPanel()
    : fileKey === 'districts' ? renderDistrictClipboardPanel() : null;
  view.append(el('div', {}, [panel, el('div', { class: 'list-layout' }, [sidebar, detailWrap])]));
}

function renderDistrictDetail(root, dist) {
  const key = state.sel.districts;
  const h2 = el('h2', { text: `${dist.icon || ''} ${dist.name || dist.id}` });
  root.append(el('div', { class: 'field-row', style: 'align-items:center;justify-content:space-between' }, [
    h2,
    el('button', {
      class: 'ghost', text: '📋 복사',
      title: '이 구를 복사 — 같은 설정의 새 구 생성 (아래 붙여넣기 패널)',
      onclick: () => copyDistrict(key),
    }),
  ]));
  root.append(el('div', { class: 'sub', text: `DISTRICTS.${key}` }));

  // 이름/아이콘 편집 시 제목·왼쪽 리스트 라벨을 즉시 갱신
  const syncLabels = () => {
    h2.textContent = `${dist.icon || ''} ${dist.name || dist.id}`;
    refreshSidebarLabel(key, `${dist.icon ? dist.icon + ' ' : ''}${dist.name || key}`);
  };

  // 이름 / 아이콘 / 설명 편집
  if (!('name' in dist)) dist.name = '';
  if (!('icon' in dist)) dist.icon = '';
  const hdr = el('div', { class: 'field-row' });
  hdr.append(scalarInput(dist, 'name', 'districts', undefined, syncLabels));
  hdr.append(scalarInput(dist, 'icon', 'districts', undefined, syncLabels));
  root.append(hdr);
  const descTa = el('textarea', { text: dist.description || '' });
  descTa.addEventListener('input', () => { dist.description = descTa.value; markDirty('districts'); });
  root.append(el('div', { class: 'field grow' }, [labelEl('description', '구 카드 설명(상세에 표시)'), descTa]));

  const numKeys = ['dangerLevel', 'travelCostTP', 'radiation', 'encounterChance', 'noiseGen', 'fishingQuality'];
  const fr = el('div', { class: 'field-row' });
  for (const k of numKeys) if (k in dist) fr.append(scalarInput(dist, k, 'districts'));
  // 탐사 1회당 탐사도 상승%(선택) — 비우면 전역 기본값(gameBalance.explore.explorationPerExplore).
  const incInp = el('input', { type: 'number', step: '1', min: '1', max: '100', value: dist.exploreIncrement ?? '' });
  incInp.placeholder = '기본값';
  incInp.addEventListener('input', () => {
    if (incInp.value === '') delete dist.exploreIncrement;
    else dist.exploreIncrement = Number(incInp.value);
    markDirty('districts');
  });
  fr.append(el('div', { class: 'field' }, [labelEl('exploreIncrement', helpFor('exploreIncrement')), incInp]));
  root.append(fr);

  renderDistrictLandmarks(root, dist);
  renderExplorationYields(root, dist);

  const fs = el('fieldset', {}, el('legend', { text: 'lootTable (탐색 드랍 가중치)' }));
  fs.append(lootTableEditor(
    dist.lootTable || (dist.lootTable = []),
    'definitionId',
    [{ key: 'minQty', label: 'min' }, { key: 'maxQty', label: 'max' }, { key: 'contamChance', label: '오염%' }],
    'districts',
    { classCol: true },
  ));
  root.append(fs);
}

// 구 상세 — 연결된 랜드마크(top 슬롯 카드) 추가/해제
function renderDistrictLandmarks(root, dist) {
  const fs = el('fieldset', {}, el('legend', { text: '연결된 랜드마크 (top 슬롯 카드)' }));
  fs.append(el('div', { class: 'hint', text: '구에 입장하면 상단 슬롯에 뜨는 랜드마크 카드. 구당 여러 개 연결 가능합니다.' }));

  const current = districtLandmarks(dist);
  const chips = el('div', { class: 'arr-row' });
  if (!current.length) chips.append(el('span', { class: 'hint', text: '연결된 랜드마크 없음.' }));
  current.forEach((lmId) => {
    const known = state.items?.[lmId]?.landmark === true;
    const chip = el('span', { class: 'arr-item', title: known ? lmId : `${lmId} — 카드 정의 없음 (lm_* 아이템 누락)` }, [
      el('span', { style: known ? '' : 'color:var(--err,#e66)', text: (itemName(lmId) || lmId) + (known ? '' : ' ⚠') }),
      el('button', {
        class: 'ghost danger mini', text: '✕', title: '연결 해제',
        onclick: () => { setDistrictLandmarks(dist, current.filter((x) => x !== lmId)); markDirty('districts'); rerenderDetail(); },
      }),
    ]);
    chips.append(chip);
  });
  fs.append(chips);

  const candidates = landmarkCardIds().filter((id) => !current.includes(id)).sort();
  if (candidates.length) {
    const sel = el('select');
    sel.append(el('option', { value: '' }, '+ 랜드마크 연결…'));
    for (const id of candidates) sel.append(el('option', { value: id }, `${itemName(id) || id}  (${id})`));
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      setDistrictLandmarks(dist, [...current, sel.value]);
      markDirty('districts'); rerenderDetail();
    });
    fs.append(el('div', { class: 'field', style: 'margin-top:8px;max-width:380px' }, [sel]));
  }
  root.append(fs);
}

// 구 상세 — 탐사도 임계값 특수자원(explorationYields) 편집기
function renderExplorationYields(root, dist) {
  const fs = el('fieldset', {}, el('legend', { text: '탐사도 임계값 특수자원 (explorationYields)' }));
  fs.append(el('div', { class: 'hint', text: '탐사도(%)가 임계값(at)을 통과하면 정해진 아이템을 1회 고정 지급(확률 아님). 100%까지 누적, 100% 후 특수자원 종료.' }));
  const list = dist.explorationYields || (dist.explorationYields = []);
  list.forEach((y, idx) => {
    const box = el('fieldset', {}, el('legend', { text: `임계값 ${y.at ?? 0}%` }));
    const atInp = el('input', { type: 'number', min: '1', max: '100', value: y.at ?? 0, style: 'max-width:90px' });
    atInp.addEventListener('input', () => { y.at = Number(atInp.value); markDirty('districts'); });
    const head = el('div', { class: 'field-row', style: 'align-items:flex-end' }, [
      el('div', { class: 'field' }, [labelEl('at (%)', helpFor('at')), atInp]),
      el('button', { class: 'ghost danger mini', text: '✕ 임계값 삭제',
        onclick: () => { list.splice(idx, 1); markDirty('districts'); rerenderDetail(); } }),
    ]);
    box.append(head);
    box.append(itemRows(y.items || (y.items = []), 'districts'));  // {definitionId, qty} 행 편집 재사용
    fs.append(box);
  });
  fs.append(el('button', { class: 'ghost row-add', text: '+ 임계값 추가',
    onclick: () => { list.push({ at: 50, items: [] }); markDirty('districts'); rerenderDetail(); } }));
  root.append(fs);
}

// ─── 숨은 장소(POI) 상세 ──────────────────────────────────────
function renderHiddenDetail(root, loc) {
  if (!loc) { root.append(el('div', { class: 'hint', text: '항목을 선택하세요.' })); return; }
  const key = state.sel.hidden;

  const h2 = el('h2', { text: `${loc.icon || ''} ${loc.name || ''}` });
  root.append(el('div', { class: 'field-row', style: 'align-items:center;justify-content:space-between' }, [
    h2,
    el('button', { class: 'ghost danger', text: '🗑 숨은 장소 삭제', onclick: () => deleteHidden(key) }),
  ]));
  root.append(el('div', { class: 'sub', text: `HIDDEN_LOCATIONS.${key}` }));

  const syncLabels = () => {
    h2.textContent = `${loc.icon || ''} ${loc.name || ''}`;
    refreshSidebarLabel(key, `${loc.icon ? loc.icon + ' ' : ''}${loc.name || key}`);
  };

  // 헤더: 이름·아이콘·소속 구
  if (!('name' in loc)) loc.name = '';
  if (!('icon' in loc)) loc.icon = '';
  const fr = el('div', { class: 'field-row' });
  fr.append(scalarInput(loc, 'name', 'hidden', undefined, syncLabels));
  fr.append(scalarInput(loc, 'icon', 'hidden', undefined, syncLabels));
  const distSel = el('select');
  const dkeys = Object.keys(state.files.districts?.data ?? {});
  distSel.append(el('option', { value: '' }, '(구 선택)'));
  for (const dk of dkeys) distSel.append(el('option', { value: dk, ...(loc.district === dk ? { selected: true } : {}) }, dk));
  if (loc.district && !dkeys.includes(loc.district)) distSel.append(el('option', { value: loc.district, selected: true }, `${loc.district} ⚠`));
  distSel.addEventListener('change', () => { loc.district = distSel.value; markDirty('hidden'); });
  fr.append(el('div', { class: 'field' }, [labelEl('district', helpFor('district')), distSel]));
  root.append(fr);

  const ta = el('textarea', { text: loc.description || '' });
  ta.addEventListener('input', () => { loc.description = ta.value; markDirty('hidden'); });
  root.append(el('div', { class: 'field grow' }, [labelEl('description', '설명'), ta]));

  // 해금 조건 (중첩 객체 자동 렌더)
  if (loc.unlockConditions && typeof loc.unlockConditions === 'object') {
    root.append(el('fieldset', {}, [
      el('legend', { text: '해금 조건 (unlockConditions) — 모두 충족(AND) 시 발견' }),
      objNode(loc, 'unlockConditions', 0, 'hidden', helpForItem),
    ]));
  }

  // 확정 보상
  root.append(el('fieldset', {}, [
    el('legend', { text: '확정 보상 (rewards) — 최초 발견 시 1회' }),
    itemRows(loc.rewards || (loc.rewards = []), 'hidden'),
  ]));

  // 추가 루팅
  root.append(el('fieldset', {}, [
    el('legend', { text: '추가 루팅 (lootTable)' }),
    lootTableEditor(loc.lootTable || (loc.lootTable = []), 'definitionId',
      [{ key: 'minQty', label: 'min' }, { key: 'maxQty', label: 'max' }], 'hidden'),
  ]));

  // 기타 설정
  const fr2 = el('div', { class: 'field-row' });
  for (const k of ['dangerLevel', 'encounterChance', 'bossId', 'repeatable', 'repeatCooldownDays']) {
    if (k in loc) fr2.append(scalarInput(loc, k, 'hidden', helpFor(k)));
  }
  if (fr2.children.length) root.append(fr2);

  if ('discoveryMessage' in loc) {
    const dm = el('textarea', { text: loc.discoveryMessage || '' });
    dm.addEventListener('input', () => { loc.discoveryMessage = dm.value; markDirty('hidden'); });
    root.append(el('div', { class: 'field grow' }, [labelEl('discoveryMessage', helpFor('discoveryMessage')), dm]));
  }
}

// 신규 숨은 장소 생성 — 기본 골격
function createHidden() {
  const raw = (prompt('새 숨은 장소 ID (영문/숫자/밑줄, 예: hidden_my_spot)') || '').trim();
  if (!raw) return;
  const idk = raw.replace(/[^A-Za-z0-9_]/g, '');
  if (!idk) { alert('ID는 영문/숫자/밑줄만 사용하세요.'); return; }
  if (state.files.hidden.data[idk]) { alert('이미 존재하는 ID입니다.'); return; }
  const name = (prompt('이름', '새 숨은 장소') || '새 숨은 장소').trim();
  const icon = (prompt('아이콘(이모지)', '❓') || '❓').trim();
  state.files.hidden.data[idk] = {
    id: idk, name, icon, district: '', description: '',
    unlockConditions: {
      explorationThreshold: 50, minDay: 1, requiredItems: [], requiredCharacter: null,
      minKills: 0, weather: null, season: null, minCraftLevel: 0, customCheck: null,
    },
    rewards: [], lootTable: [],
    dangerLevel: 1, encounterChance: 0.1, bossId: null, repeatable: false, repeatCooldownDays: 0,
    discoveryMessage: '',
  };
  state.sel.hidden = idk;
  markDirty('hidden');
  status(`숨은 장소 「${name}」(${idk}) 생성. 소속 구·해금 조건·보상을 설정하세요.`, 'ok');
  render();
}

function deleteHidden(key) {
  if (!key || !state.files.hidden.data[key]) return;
  if (!confirm(`숨은 장소 「${state.files.hidden.data[key].name || key}」을(를) 삭제할까요?`)) return;
  delete state.files.hidden.data[key];
  state.sel.hidden = Object.keys(state.files.hidden.data)[0] ?? null;
  markDirty('hidden');
  status('숨은 장소를 삭제했습니다.', 'ok');
  render();
}

function renderLandmarkDetail(root, lm) {
  const key = state.sel.landmarks;
  const protectedLm = isProtectedLandmark(key);

  const h2 = el('h2', { text: `${lm.icon || ''} ${lm.name || ''}` });
  const head = el('div', { class: 'field-row', style: 'align-items:center;justify-content:space-between' }, [
    h2,
    el('div', { class: 'field-row' }, [
      el('button', {
        class: 'ghost', text: '📋 복사',
        title: '이 랜드마크를 복사 — 여러 구에 한 번에 연결 (아래 붙여넣기 패널)',
        onclick: () => copyLandmark(key),
      }),
      el('button', {
        class: 'ghost danger', text: '🗑 랜드마크 삭제',
        ...(protectedLm ? { disabled: true, title: '시스템 의존 보호 랜드마크 — 삭제 불가' } : {}),
        onclick: () => deleteLandmark(key),
      }),
    ]),
  ]);
  root.append(head);
  root.append(el('div', { class: 'sub', text: `LANDMARK_DATA.${key}` }));

  // 이름/아이콘 편집 시 제목·왼쪽 리스트 라벨 즉시 갱신
  const syncLabels = () => {
    h2.textContent = `${lm.icon || ''} ${lm.name || ''}`;
    refreshSidebarLabel(key, `${lm.icon ? lm.icon + ' ' : ''}${lm.name || key}`);
  };

  // 헤더 필드 편집 (name / icon / desc)
  if (!('name' in lm)) lm.name = '';
  if (!('icon' in lm)) lm.icon = '';
  const fr = el('div', { class: 'field-row' });
  fr.append(scalarInput(lm, 'name', 'landmarks', undefined, syncLabels));
  fr.append(scalarInput(lm, 'icon', 'landmarks', undefined, syncLabels));
  root.append(fr);
  const ta = el('textarea', { text: lm.desc || '' });
  ta.addEventListener('input', () => { lm.desc = ta.value; markDirty('landmarks'); });
  root.append(el('div', { class: 'field grow' }, [labelEl('desc', '랜드마크 카드 설명'), ta]));

  // 기능 플래그 — 체크 시 true 기록, 해제 시 필드 삭제
  const flagRow = el('div', { class: 'field-row' });
  flagRow.append(optionalFlag(lm, 'hasFishing', 'landmarks',
    '낚시 가능 — 이 랜드마크 안에서 낚시·통발 사용 가능 (한강 계열). 카드도 항상 진입 가능으로 렌더.'));
  flagRow.append(optionalFlag(lm, 'isBasecampLandmark', 'landmarks'));
  root.append(el('fieldset', {}, [el('legend', { text: '기능 플래그' }), flagRow]));

  // 기타 필드 — 수제 폼이 다루지 않는 필드 자동 노출 (레이더 캠프 등)
  const HANDLED = new Set(['name', 'icon', 'desc', 'subLocations', 'hasFishing', 'isBasecampLandmark']);
  const extras = Object.keys(lm).filter((k) => !HANDLED.has(k));
  if (extras.length) {
    const exRow = el('div', { class: 'field-row' });
    for (const k of extras) {
      const v = lm[k];
      if (v && typeof v === 'object') {
        exRow.append(el('div', { class: 'field' }, [fieldLabel(k), el('div', { class: 'hint', text: JSON.stringify(v) })]));
      } else {
        exRow.append(scalarInput(lm, k, 'landmarks', helpFor(k)));
      }
    }
    root.append(el('fieldset', {}, [el('legend', { text: '기타 필드' }), exRow]));
  }

  // 세부장소 — 편집/추가/삭제/이동은 전용 탭
  const subs = lm.subLocations || [];
  const subFs = el('fieldset', {}, el('legend', { text: `세부장소 (${subs.length})` }));
  subFs.append(el('button', {
    class: 'ghost', text: '→ 세부장소 탭에서 편집·추가',
    onclick: () => { state.sel.sublocations = `${key}::0`; switchTab('sublocations'); },
  }));
  if (!subs.length) {
    subFs.append(el('div', { class: 'hint', text: '세부 장소 없음.' }));
  }
  for (const sub of subs) {
    const fs = el('fieldset', {}, el('legend', { text: `${sub.icon || ''} ${sub.name || sub.id}` }));
    const sfr = el('div', { class: 'field-row' });
    if ('dangerMod' in sub) sfr.append(scalarInput(sub, 'dangerMod', 'landmarks'));
    if (Array.isArray(sub.lootCount)) {
      const mk = (i, label) => {
        const inp = el('input', { type: 'number', value: sub.lootCount[i] ?? 0 });
        inp.addEventListener('input', () => { sub.lootCount[i] = Number(inp.value); markDirty('landmarks'); });
        return el('div', { class: 'field' }, [fieldLabel(label, 'lootCount'), inp]);
      };
      sfr.append(mk(0, 'lootCount min'), mk(1, 'lootCount max'));
    }
    fs.append(sfr);
    fs.append(lootTableEditor(sub.lootTable || (sub.lootTable = []), 'id', [], 'landmarks'));
    subFs.append(fs);
  }
  root.append(subFs);
}

// 신규 구(장소) 생성 — 기본값으로 빈 구 추가 (인접·랜드마크·드랍은 상세에서 설정)
function createDistrict() {
  const raw = (prompt('새 구(장소) 키 (영문/숫자/밑줄, 예: my_district)') || '').trim();
  if (!raw) return;
  const key = raw.replace(/[^A-Za-z0-9_]/g, '');
  if (!key) { alert('키는 영문/숫자/밑줄만 사용하세요.'); return; }
  if (state.files.districts.data[key]) { alert('이미 존재하는 구 키입니다.'); return; }
  const name = (prompt('구 이름', '새 장소') || '새 장소').trim();
  const icon = (prompt('아이콘 (이모지)', '🏙️') || '🏙️').trim();
  state.files.districts.data[key] = {
    id: key, name, icon, description: '',
    dangerLevel: 1, travelCostTP: 1, radiation: 0, encounterChance: 0.1, noiseGen: 0,
    adjacentDistricts: [], lootTable: [],
  };
  state.sel.districts = key;
  markDirty('districts');
  status(`장소 「${name}」(${key}) 생성. ⚠️ 인접 구(adjacentDistricts)·연결 랜드마크가 비어 있습니다 — 상세에서 설정하세요.`, 'ok');
  render();
}

// 신규 랜드마크 생성 — LANDMARK_DATA + LANDMARK_CARD_META 동시 기록
function createLandmark() {
  const raw = (prompt('새 랜드마크 키 (영문/숫자/밑줄, 예: my_place)') || '').trim();
  if (!raw) return;
  const key = raw.replace(/[^A-Za-z0-9_]/g, '');
  if (!key) { alert('키는 영문/숫자/밑줄만 사용하세요.'); return; }
  if (state.files.landmarks.data[key]) { alert('이미 존재하는 랜드마크 키입니다.'); return; }
  const name = (prompt('랜드마크 이름', '새 랜드마크') || '새 랜드마크').trim();
  const icon = (prompt('아이콘 (이모지)', '📍') || '📍').trim();
  const cardId = key.startsWith('lm_') ? key : `lm_${key}`;
  state.files.landmarks.data[key] = { name, icon, desc: '', subLocations: [] };
  if (state.files.landmarkMeta) {
    state.files.landmarkMeta.data[cardId] = {
      name, subtype: 'landmark', rarity: 'common',
      tags: ['location', 'landmark'], icon, description: '',
      landmarkBonus: null, districtId: null,
    };
    markDirty('landmarkMeta');
  }
  state.sel.landmarks = key;
  markDirty('landmarks');
  status(`랜드마크 「${name}」(${cardId}) 생성. 카드 이미지(CardFactory CARD_IMAGES)·로케일은 선택사항 — 미등록 시 아이콘/이름으로 폴백됩니다. 구에 연결하려면 장소 탭에서 추가하세요.`, 'ok');
  render();
}

// 랜드마크 삭제 — 보호/참조 가드 후 LANDMARK_DATA + CARD_META + 구 연결에서 제거
function deleteLandmark(key) {
  const verdict = canDeleteLandmark(key);
  if (!verdict.ok) { alert(`삭제 불가: ${verdict.reason}`); status(`삭제 차단: ${key} — ${verdict.reason}`, 'err'); return; }
  const refs = verdict.refs || [];
  const nm = state.files.landmarks.data[key]?.name || key;
  const msg = `랜드마크 「${nm}」을(를) 삭제할까요?`
    + (refs.length ? `\n\n⚠️ 다음에서 참조 중:\n${refs.map((r) => '· ' + r).join('\n')}\n\n삭제하면 위 참조가 깨질 수 있습니다.` : '');
  if (!confirm(msg)) return;
  delete state.files.landmarks.data[key];
  const cardId = key.startsWith('lm_') ? key : `lm_${key}`;
  if (state.files.landmarkMeta?.data?.[cardId]) { delete state.files.landmarkMeta.data[cardId]; markDirty('landmarkMeta'); }
  // 구 연결에서 제거
  const ids = landmarkIdVariants(key);
  const dists = state.files.districts?.data || {};
  let touchedDist = false;
  for (const d of Object.values(dists)) {
    const cur = districtLandmarks(d);
    const next = cur.filter((l) => !ids.has(l));
    if (next.length !== cur.length) { setDistrictLandmarks(d, next); touchedDist = true; }
  }
  if (touchedDist) markDirty('districts');
  state.sel.landmarks = Object.keys(state.files.landmarks.data)[0];
  markDirty('landmarks');
  status(`랜드마크 「${nm}」 삭제 완료.`, 'ok');
  render();
}

// ─── 랜드마크 복사 → 여러 구에 연결 ──────────────────────────
// 랜드마크는 구가 "참조"로 연결한다(LANDMARK_DATA 복제 아님). 복사 후 여러 구의
// 연결 목록(top 슬롯 카드)에 같은 카드 id를 추가한다.

// LANDMARK_DATA 키 → 구 연결에 저장할 카드 id (실제 존재하는 카드 변형 우선, 없으면 lm_ 접두)
function landmarkCardIdFor(key) {
  const variants = landmarkIdVariants(key);
  for (const c of landmarkCardIds()) if (variants.has(c)) return c;
  return `lm_${String(key).replace(/^lm_/, '')}`;
}

function copyLandmark(key) {
  const lm = state.files.landmarks.data[key];
  if (!lm) return;
  state.lmClipboard = { key, name: lm.name || key, cardId: landmarkCardIdFor(key) };
  status(`랜드마크 「${lm.name || key}」 복사됨 — 아래 "📋 구에 연결" 패널에서 구를 골라 연결하세요.`, 'ok');
  render();
}

function connectLandmarkToDistricts(cardId, distKeys) {
  if (!cardId || !distKeys.length) return;
  const data = state.files.districts.data;
  let added = 0;
  for (const dk of distKeys) {
    const dist = data[dk];
    if (!dist) continue;
    const cur = districtLandmarks(dist);
    if (cur.some((l) => landmarkIdVariants(l).has(cardId))) continue; // 이미 연결됨
    setDistrictLandmarks(dist, [...cur, cardId]);
    added++;
  }
  if (added) markDirty('districts');
  const skipped = distKeys.length - added;
  status(`랜드마크를 ${added}개 구에 연결했습니다${skipped ? ` (이미 연결된 ${skipped}개 제외)` : ''}.`, added ? 'ok' : 'info');
  render();
}

// 클립보드가 있을 때 랜드마크 탭 상단에 뜨는 "구에 연결" 패널 (구 다중 선택)
function renderLandmarkClipboardPanel() {
  const clip = state.lmClipboard;
  if (!clip) return null;
  const dists = state.files.districts?.data || {};
  const distKeys = Object.keys(dists);
  const fs = el('fieldset', { style: 'margin-bottom:10px' }, el('legend', { text: '📋 구에 연결' }));
  fs.append(el('div', { class: 'hint', text: `복사됨: 랜드마크 「${clip.name}」 — 연결할 구를 선택하세요 (여러 곳 동시 가능). 같은 랜드마크 카드가 선택한 구들의 top 슬롯에 표시됩니다.` }));
  const checks = [];
  const list = el('div', { class: 'arr-row', style: 'flex-wrap:wrap;gap:6px;margin-top:6px' });
  for (const dk of distKeys) {
    const connected = districtLandmarks(dists[dk]).some((l) => landmarkIdVariants(l).has(clip.cardId));
    const cb = el('input', { type: 'checkbox', ...(connected ? { disabled: true } : {}) });
    checks.push({ cb, key: dk, connected });
    list.append(el('label', {
      class: 'arr-item',
      style: connected ? 'opacity:.5' : 'cursor:pointer',
      title: connected ? '이미 연결됨' : '',
    }, [cb, ` ${dists[dk].icon || ''} ${dists[dk].name || dk}${connected ? ' ✓' : ''}`]));
  }
  fs.append(list);
  const selectAll = el('button', {
    class: 'ghost mini', text: '전체 선택/해제',
    onclick: () => { const sel = checks.filter((c) => !c.connected); const all = sel.every((c) => c.cb.checked); sel.forEach((c) => { c.cb.checked = !all; }); },
  });
  const connectBtn = el('button', {
    class: 'primary', text: '선택한 구에 연결',
    onclick: () => {
      const targets = checks.filter((c) => c.cb.checked && !c.connected).map((c) => c.key);
      if (!targets.length) { status('연결할 구를 하나 이상 선택하세요.', 'err'); return; }
      connectLandmarkToDistricts(clip.cardId, targets);
    },
  });
  const clearBtn = el('button', { class: 'ghost', text: '복사 취소', onclick: () => { state.lmClipboard = null; render(); } });
  fs.append(el('div', { class: 'field-row', style: 'margin-top:8px' }, [selectAll, connectBtn, clearBtn]));
  return fs;
}

// ─── 구(장소) 복사 → 붙여넣기(복제) ──────────────────────────
// 구는 최상위 항목이라 붙여넣기 = 같은 설정의 새 구를 생성한다(고유 키·id 자동).

function copyDistrict(key) {
  const dist = state.files.districts.data[key];
  if (!dist) return;
  state.distClipboard = { key, dist: structuredClone(dist), name: dist.name || key };
  status(`장소 「${dist.name || key}」 복사됨 — 아래 패널에서 붙여넣으면 같은 설정의 새 구가 생성됩니다.`, 'ok');
  render();
}

function pasteDistrict(count) {
  const clip = state.distClipboard;
  if (!clip) return;
  const data = state.files.districts.data;
  const used = new Set(Object.keys(data));
  let lastKey = null;
  for (let i = 0; i < count; i++) {
    let k = `${clip.key}_copy`, n = 2;
    while (used.has(k)) k = `${clip.key}_copy${n++}`;
    used.add(k);
    const clone = structuredClone(clip.dist);
    clone.id = k; // 내부 id는 키와 동기화
    clone.name = `${clip.name}${count > 1 ? ` (복사 ${i + 1})` : ' (복사)'}`;
    data[k] = clone;
    lastKey = k;
  }
  markDirty('districts');
  if (lastKey) state.sel.districts = lastKey;
  status(`장소 「${clip.name}」 복제본 ${count}개 생성. ⚠️ 새 구는 인접(adjacentDistricts)·퀘스트 참조가 자동 연결되지 않으니 이름·ID와 함께 확인하세요.`, 'ok');
  render();
}

// 클립보드가 있을 때 장소 탭 상단에 뜨는 붙여넣기(복제) 패널
function renderDistrictClipboardPanel() {
  const clip = state.distClipboard;
  if (!clip) return null;
  const fs = el('fieldset', { style: 'margin-bottom:10px' }, el('legend', { text: '📋 붙여넣기 (구 복제)' }));
  fs.append(el('div', { class: 'hint', text: `복사됨: 장소 「${clip.name}」 — 붙여넣으면 같은 설정의 새 구가 생성됩니다 (ID 자동 생성, 이름에 "(복사)" 표기). 생성 후 이름·ID·인접 구를 확인하세요.` }));
  const cnt = el('input', { type: 'number', value: 1, min: 1, style: 'width:70px' });
  const pasteBtn = el('button', {
    class: 'primary', text: '붙여넣기',
    onclick: () => { const n = Math.max(1, Math.floor(Number(cnt.value) || 1)); pasteDistrict(n); },
  });
  const clearBtn = el('button', { class: 'ghost', text: '복사 취소', onclick: () => { state.distClipboard = null; render(); } });
  fs.append(el('div', { class: 'field-row', style: 'margin-top:8px;align-items:flex-end' }, [
    el('div', { class: 'field' }, [el('label', { text: '개수' }), cnt]),
    pasteBtn, clearBtn,
  ]));
  return fs;
}

// ─── 세부장소(sublocations) 전용 탭 ──────────────────────────
// 세부장소는 LANDMARK_DATA[키].subLocations 안에 산다 → fileKey는 항상 'landmarks'.
// 선택 키는 '<lmKey>::<index>' (인덱스 기반 — id 편집 중에도 안정적; 추가/삭제/이동은 render()로 재구성).

function renderSubLocationsTab() {
  const data = state.files.landmarks?.data;
  if (!data) { view.append(el('div', { class: 'empty', text: '데이터 불러오는 중…' })); return; }
  const lmKeys = Object.keys(data);

  // 선택 유효성 보정
  const valid = (ck) => {
    if (!ck) return false;
    const [k, i] = ck.split('::');
    return data[k] && Array.isArray(data[k].subLocations) && data[k].subLocations[Number(i)];
  };
  if (!valid(state.sel.sublocations)) {
    const firstWithSub = lmKeys.find((k) => (data[k].subLocations || []).length);
    state.sel.sublocations = firstWithSub ? `${firstWithSub}::0` : '';
  }

  const sidebar = el('div', { class: 'sidebar' });
  const search = sideSearchInput('sublocations');
  sidebar.append(search.wrap);
  const listBox = el('div');
  sidebar.append(listBox);

  const renderList = () => {
    const q = (state.search.sublocations || '').trim().toLowerCase();
    listBox.innerHTML = '';
    let any = false;
    for (const lmKey of lmKeys) {
      const lm = data[lmKey];
      const lmMatch = !q || lmKey.toLowerCase().includes(q) || (lm.name || '').toLowerCase().includes(q);
      const subs = lm.subLocations || [];
      const visible = subs
        .map((sub, idx) => ({ sub, idx }))
        .filter(({ sub }) => lmMatch || (sub.name || '').toLowerCase().includes(q) || (sub.id || '').toLowerCase().includes(q));
      if (q && !lmMatch && !visible.length) continue; // 이 랜드마크는 검색과 무관 → 그룹 숨김
      any = true;
      listBox.append(el('div', { class: 'side-group', style: 'display:flex;align-items:center;justify-content:space-between;gap:6px' }, [
        el('span', { text: `${lm.icon || ''} ${lm.name || lmKey}` }),
        el('button', { class: 'ghost mini', text: '+', title: '이 랜드마크에 세부장소 추가', onclick: () => addSubLocation(lmKey) }),
      ]));
      if (!subs.length) { listBox.append(el('div', { class: 'hint', style: 'padding:2px 12px', text: '(없음)' })); continue; }
      for (const { sub, idx } of visible) {
        const ck = `${lmKey}::${idx}`;
        const selBtn = el('button', {
          class: 'side-item' + (ck === state.sel.sublocations ? ' active' : ''),
          'data-key': ck,
          style: 'flex:1;min-width:0',
          text: `${sub.icon || ''} ${sub.name || sub.id}`,
          onclick: () => { state.sel.sublocations = ck; rerenderDetail(); },
        });
        const up = el('button', {
          class: 'ghost mini', text: '▲', title: '위로 이동',
          ...(idx === 0 ? { disabled: true } : {}),
          onclick: () => moveSubLocationOrder(lmKey, idx, -1),
        });
        const down = el('button', {
          class: 'ghost mini', text: '▼', title: '아래로 이동',
          ...(idx === subs.length - 1 ? { disabled: true } : {}),
          onclick: () => moveSubLocationOrder(lmKey, idx, 1),
        });
        listBox.append(el('div', { style: 'display:flex;align-items:center;gap:2px' }, [selBtn, up, down]));
      }
    }
    if (!any) listBox.append(el('div', { class: 'hint', style: 'padding:6px 10px', text: '검색 결과 없음' }));
  };
  search.onInput(renderList);
  renderList();

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b) =>
      b.classList.toggle('active', b.dataset.key === state.sel.sublocations));
    detailWrap.innerHTML = '';
    renderSubLocationDetail(detailWrap);
  };
  rerenderDetail();
  view.append(el('div', {}, [
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      '세부장소를 추가하면 게임 로딩 시 registerSubLocationItems()가 sl_<id> 위치 카드를 자동 생성합니다 — 별도 아이템 등록은 필요 없습니다. 같은 세부장소를 여러 랜드마크에 넣으려면 상세에서 📋 복사 후 아래 패널에서 붙여넣으세요.'),
    renderSubClipboardPanel(),
    el('div', { class: 'list-layout' }, [sidebar, detailWrap]),
  ]));
}

function renderSubLocationDetail(root) {
  const cur = state.sel.sublocations;
  const data = state.files.landmarks.data;
  if (!cur) { root.append(el('div', { class: 'hint', text: '세부장소를 선택하거나 사이드바의 + 로 추가하세요.' })); return; }
  const [lmKey, idxStr] = cur.split('::');
  const idx = Number(idxStr);
  const lm = data[lmKey];
  const sub = lm?.subLocations?.[idx];
  if (!sub) { root.append(el('div', { class: 'hint', text: '세부장소를 선택하세요.' })); return; }

  const isProt = PROTECTED_SUBLOCATIONS.has(sub.id);

  const h2 = el('h2', { text: `${sub.icon || ''} ${sub.name || sub.id}` });
  root.append(el('div', { class: 'field-row', style: 'align-items:center;justify-content:space-between' }, [
    h2,
    el('div', { class: 'field-row' }, [
      el('button', {
        class: 'ghost', text: '📋 복사',
        title: '이 세부장소를 복사 — 다른 랜드마크에 붙여넣기 (아래 붙여넣기 패널)',
        onclick: () => copySubLocation(lmKey, idx),
      }),
      el('button', {
        class: 'ghost danger', text: '🗑 세부장소 삭제',
        ...(isProt ? { disabled: true, title: '병원 공성 시스템 의존 — 삭제 불가' } : {}),
        onclick: () => deleteSubLocation(lmKey, idx),
      }),
    ]),
  ]));
  root.append(el('div', { class: 'sub', text: `${lm.name || lmKey} ▸ ${sub.id}` }));

  // 이름/아이콘/id 편집 시 제목·왼쪽 리스트 라벨 즉시 갱신 (사이드바 data-key = "<lmKey>::<idx>")
  const syncLabels = () => {
    h2.textContent = `${sub.icon || ''} ${sub.name || sub.id}`;
    refreshSidebarLabel(`${lmKey}::${idx}`, `${sub.icon || ''} ${sub.name || sub.id}`);
  };

  // 소속 랜드마크 (이동)
  const moveSel = el('select');
  for (const k of Object.keys(data)) {
    moveSel.append(el('option', { value: k, ...(k === lmKey ? { selected: true } : {}) }, `${data[k].icon || ''} ${data[k].name || k}`));
  }
  moveSel.addEventListener('change', () => { if (moveSel.value !== lmKey) moveSubLocation(lmKey, idx, moveSel.value); });
  root.append(el('fieldset', {}, [
    el('legend', { text: '소속 랜드마크' }),
    el('div', { class: 'field', style: 'max-width:380px' }, [labelEl('landmark', '다른 랜드마크로 이동'), moveSel]),
  ]));

  // 기본 필드 (id / name / icon / dangerMod)
  const fr = el('div', { class: 'field-row' });
  const idInp = el('input', { value: sub.id ?? '', ...(isProt ? { disabled: true } : {}) });
  idInp.addEventListener('input', () => { sub.id = idInp.value.trim(); markDirty('landmarks'); syncLabels(); });
  fr.append(el('div', { class: 'field' }, [
    labelEl('id', isProt ? '보호 세부장소 — id 변경 불가' : '파생 아이템 sl_<id>의 기준. 변경 시 진행 중 세이브/참조가 깨질 수 있습니다.'),
    idInp,
  ]));
  if (!('name' in sub)) sub.name = '';
  if (!('icon' in sub)) sub.icon = '';
  if (!('dangerMod' in sub)) sub.dangerMod = 0;
  fr.append(scalarInput(sub, 'name', 'landmarks', undefined, syncLabels));
  fr.append(scalarInput(sub, 'icon', 'landmarks', undefined, syncLabels));
  fr.append(scalarInput(sub, 'dangerMod', 'landmarks'));
  root.append(fr);

  // desc
  const ta = el('textarea', { text: sub.desc || '' });
  ta.addEventListener('input', () => { sub.desc = ta.value; markDirty('landmarks'); });
  root.append(el('div', { class: 'field grow' }, [labelEl('desc', '세부장소 설명'), ta]));

  // lootCount [min,max]
  if (!Array.isArray(sub.lootCount)) sub.lootCount = [1, 2];
  const mk = (i, label) => {
    const inp = el('input', { type: 'number', value: sub.lootCount[i] ?? 0 });
    inp.addEventListener('input', () => { sub.lootCount[i] = Number(inp.value); markDirty('landmarks'); });
    return el('div', { class: 'field' }, [fieldLabel(label, 'lootCount'), inp]);
  };
  root.append(el('div', { class: 'field-row' }, [mk(0, 'lootCount min'), mk(1, 'lootCount max')]));

  if (sub.firstEnterReward) {
    root.append(el('div', { class: 'hint', text: '⚠️ 이 세부장소에는 1회 한정 보상(firstEnterReward)이 있습니다 — 삭제 시 보상 진입점이 사라집니다.' }));
  }

  const fs = el('fieldset', {}, el('legend', { text: 'lootTable (세부장소 드랍)' }));
  fs.append(lootTableEditor(sub.lootTable || (sub.lootTable = []), 'id', [], 'landmarks'));
  root.append(fs);
}

// 세부장소 추가 — 고유 id 생성 후 해당 항목 선택
function addSubLocation(lmKey) {
  const lm = state.files.landmarks.data[lmKey];
  if (!lm) return;
  if (!Array.isArray(lm.subLocations)) lm.subLocations = [];
  const used = new Set(lm.subLocations.map((s) => s.id));
  let id = `${lmKey}_new`;
  let n = 2;
  while (used.has(id)) id = `${lmKey}_new${n++}`;
  lm.subLocations.push({ id, name: '새 세부장소', icon: '📍', desc: '', dangerMod: 0, lootTable: [], lootCount: [1, 2] });
  state.sel.sublocations = `${lmKey}::${lm.subLocations.length - 1}`;
  markDirty('landmarks');
  render();
}

// 세부장소 삭제 — 보호/참조 가드
function deleteSubLocation(lmKey, idx) {
  const lm = state.files.landmarks.data[lmKey];
  const sub = lm?.subLocations?.[idx];
  if (!sub) return;
  const verdict = canDeleteSubLocation(sub);
  if (!verdict.ok) { alert(`삭제 불가: ${verdict.reason}`); status(`삭제 차단: ${sub.id} — ${verdict.reason}`, 'err'); return; }
  const refs = verdict.refs || [];
  const msg = `세부장소 「${sub.name || sub.id}」을(를) 삭제할까요?`
    + (refs.length ? `\n\n⚠️ ${refs.join('\n⚠️ ')}` : '');
  if (!confirm(msg)) return;
  lm.subLocations.splice(idx, 1);
  state.sel.sublocations = lm.subLocations.length ? `${lmKey}::${Math.max(0, idx - 1)}` : '';
  markDirty('landmarks');
  status(`세부장소 「${sub.name || sub.id}」 삭제 완료.`, 'ok');
  render();
}

// 세부장소를 다른 랜드마크로 이동
function moveSubLocation(fromKey, idx, toKey) {
  const from = state.files.landmarks.data[fromKey];
  const to = state.files.landmarks.data[toKey];
  if (!from || !to) return;
  const [sub] = from.subLocations.splice(idx, 1);
  if (!sub) return;
  if (!Array.isArray(to.subLocations)) to.subLocations = [];
  to.subLocations.push(sub);
  state.sel.sublocations = `${toKey}::${to.subLocations.length - 1}`;
  markDirty('landmarks');
  status(`세부장소 「${sub.name || sub.id}」 → 「${to.name || toKey}」 이동.`, 'ok');
  render();
}

// 같은 랜드마크 안에서 세부장소 순서를 위/아래로 교환 (dir: -1 위, +1 아래)
function moveSubLocationOrder(lmKey, idx, dir) {
  const subs = state.files.landmarks.data[lmKey]?.subLocations;
  if (!subs) return;
  const j = idx + dir;
  if (j < 0 || j >= subs.length) return;
  [subs[idx], subs[j]] = [subs[j], subs[idx]];
  state.sel.sublocations = `${lmKey}::${j}`; // 선택이 이동한 항목을 따라가도록
  markDirty('landmarks');
  render();
}

// ─── 세부장소 복사/붙여넣기 ──────────────────────────────────
// 한 세부장소를 클립보드에 담아 여러 랜드마크에 한 번에 복제한다.
// 파생 위치 카드 sl_<id>가 전역에서 충돌하지 않도록 붙여넣을 때 id를 항상 고유화한다.

// 전 랜드마크의 세부장소 id 집합 (충돌 검사용)
function allSubLocationIds() {
  const ids = new Set();
  for (const lm of Object.values(state.files.landmarks?.data || {})) {
    for (const s of lm.subLocations || []) if (s?.id) ids.add(s.id);
  }
  return ids;
}
// base가 이미 쓰였으면 _2, _3… 뒤에 붙여 고유 id 반환
function uniqueSubId(base, used) {
  let id = base, n = 2;
  while (used.has(id)) id = `${base}_${n++}`;
  return id;
}

// 세부장소를 클립보드에 복사 (깊은 복제 — 이후 원본 편집과 분리)
function copySubLocation(lmKey, idx) {
  const sub = state.files.landmarks.data[lmKey]?.subLocations?.[idx];
  if (!sub) return;
  state.subClipboard = { sub: structuredClone(sub), fromLmKey: lmKey, fromName: sub.name || sub.id };
  status(`세부장소 「${sub.name || sub.id}」 복사됨 — 아래 "📋 붙여넣기" 패널에서 랜드마크를 골라 넣으세요.`, 'ok');
  render();
}

// 클립보드의 세부장소를 선택한 랜드마크들에 복제 (각각 고유 id 부여)
function pasteSubLocationInto(lmKeys) {
  const clip = state.subClipboard;
  if (!clip || !lmKeys.length) return;
  const data = state.files.landmarks.data;
  const used = allSubLocationIds();
  // 원본 id에서 출처 랜드마크 접두사를 떼어 깔끔한 베이스명 추출 (예: boramae_emergency → emergency)
  const base = clip.sub.id?.startsWith(clip.fromLmKey + '_')
    ? clip.sub.id.slice(clip.fromLmKey.length + 1) : (clip.sub.id || 'sub');
  let lastTarget = null, lastIdx = 0;
  for (const lmKey of lmKeys) {
    const lm = data[lmKey];
    if (!lm) continue;
    if (!Array.isArray(lm.subLocations)) lm.subLocations = [];
    const clone = structuredClone(clip.sub);
    clone.id = uniqueSubId(`${lmKey}_${base}`, used);
    used.add(clone.id);
    lm.subLocations.push(clone);
    lastTarget = lmKey; lastIdx = lm.subLocations.length - 1;
  }
  markDirty('landmarks');
  if (lastTarget) state.sel.sublocations = `${lastTarget}::${lastIdx}`;
  const warn = clip.sub.firstEnterReward
    ? ' ⚠️ 1회 한정 보상(firstEnterReward)이 함께 복사됐습니다 — claimKey가 공유되면 한 곳에서만 수령됩니다. 필요 시 개별 수정하세요.' : '';
  status(`세부장소 「${clip.fromName}」을(를) ${lmKeys.length}개 랜드마크에 붙여넣었습니다. (id 자동 고유화)${warn}`, 'ok');
  render();
}

// 클립보드가 있을 때 표시되는 붙여넣기 패널 (랜드마크 다중 선택 → 일괄 붙여넣기)
function renderSubClipboardPanel() {
  const clip = state.subClipboard;
  if (!clip) return null;
  const data = state.files.landmarks.data;
  const lmKeys = Object.keys(data);
  const fs = el('fieldset', { style: 'margin-bottom:10px' }, el('legend', { text: '📋 붙여넣기' }));
  fs.append(el('div', { class: 'hint', text: `복사됨: 「${clip.fromName}」 — 넣을 랜드마크를 선택하세요 (여러 곳 동시 가능). 붙여넣을 때 id는 자동으로 고유화됩니다.` }));
  const checks = [];
  const list = el('div', { class: 'arr-row', style: 'flex-wrap:wrap;gap:6px;margin-top:6px' });
  for (const k of lmKeys) {
    const cb = el('input', { type: 'checkbox' });
    checks.push({ cb, key: k });
    list.append(el('label', { class: 'arr-item', style: 'cursor:pointer' }, [cb, ` ${data[k].icon || ''} ${data[k].name || k}`]));
  }
  fs.append(list);
  const selectAll = el('button', {
    class: 'ghost mini', text: '전체 선택/해제',
    onclick: () => { const all = checks.every((c) => c.cb.checked); checks.forEach((c) => { c.cb.checked = !all; }); },
  });
  const pasteBtn = el('button', {
    class: 'primary', text: '선택한 곳에 붙여넣기',
    onclick: () => {
      const targets = checks.filter((c) => c.cb.checked).map((c) => c.key);
      if (!targets.length) { status('붙여넣을 랜드마크를 하나 이상 선택하세요.', 'err'); return; }
      pasteSubLocationInto(targets);
    },
  });
  const clearBtn = el('button', {
    class: 'ghost', text: '복사 취소',
    onclick: () => { state.subClipboard = null; render(); },
  });
  fs.append(el('div', { class: 'field-row', style: 'margin-top:8px' }, [selectAll, pasteBtn, clearBtn]));
  return fs;
}

// ─── 공용 변수(밸런스) 탭 ────────────────────────────────────
// 중첩 객체/배열을 재귀적으로 편집. 스칼라는 scalarInput, 배열/객체는 들여쓴 박스.
// 범용 재귀 편집 노드: 스칼라/배열/객체를 fileKey 데이터로 편집 (라벨 설명은 helpFn(key))
function objNode(obj, key, depth, fileKey, helpFn) {
  const v = obj[key];
  // 스칼라(숫자/문자/불리언/Infinity)
  if (v === null || typeof v !== 'object') {
    return scalarInput(obj, key, fileKey, helpFn(key));
  }
  // 배열
  if (Array.isArray(v)) {
    // 스칼라 배열 → 균일한 칩(입력+✕) 가로 나열 + 같은 높이의 +
    if (v.every((x) => x === null || typeof x !== 'object')) {
      const numeric = v.some((x) => typeof x === 'number');
      const row = el('div', { class: 'arr-row' });
      v.forEach((x, i) => {
        const isNum = typeof x === 'number';
        const inp = el('input', { class: 'arr-input', type: isNum ? 'number' : 'text', step: 'any', value: x,
          ...(key === 'tags' ? { list: 'tag-list' } : {}) });
        inp.addEventListener('input', () => { v[i] = isNum ? Number(inp.value) : inp.value; markDirty(fileKey); });
        const rm = el('button', { class: 'ghost danger mini', text: '✕', title: '삭제',
          onclick: () => { v.splice(i, 1); markDirty(fileKey); rerenderDetail(); } });
        row.append(el('span', { class: 'arr-item' }, [inp, rm]));
      });
      row.append(el('button', { class: 'ghost mini arr-add', text: '+', title: '추가',
        onclick: () => { v.push(numeric ? 0 : ''); markDirty(fileKey); rerenderDetail(); } }));
      return el('div', { class: 'field grow' }, [labelEl(key, helpFn(key)), row]);
    }
    // 객체 배열 → 각 원소를 가로 카드로 + 삭제/추가
    const fs = el('fieldset', {}, el('legend', {}, [labelEl(key, helpFn(key))]));
    const boxes = el('div', { class: 'obj-array' });
    v.forEach((item, i) => {
      const sub = el('div', { class: 'bal-sub' });
      sub.append(el('div', { class: 'sub-head' }, [
        el('span', { class: 'side-group', text: `#${i}` }),
        el('button', { class: 'ghost danger mini', text: '✕', title: '이 항목 삭제',
          onclick: () => { v.splice(i, 1); markDirty(fileKey); rerenderDetail(); } }),
      ]));
      for (const k of Object.keys(item)) sub.append(objNode(item, k, depth + 1, fileKey, helpFn));
      boxes.append(sub);
    });
    // 다음 카드 자리에 카드 크기의 + 타일
    boxes.append(el('button', { class: 'bal-sub add-card', text: '+', title: '항목 추가',
      onclick: () => { v.push(v.length ? structuredClone(v[v.length - 1]) : {}); markDirty(fileKey); rerenderDetail(); } }));
    fs.append(boxes);
    return fs;
  }
  // 중첩 객체 → 박스 + 재귀
  const fs = el('fieldset', {}, el('legend', {}, [labelEl(key, helpFn(key))]));
  const scalars = el('div', { class: 'field-row' });
  const nested = [];
  for (const k of Object.keys(v)) {
    const child = v[k];
    if (child !== null && typeof child === 'object') nested.push(objNode(v, k, depth + 1, fileKey, helpFn));
    else scalars.append(scalarInput(v, k, fileKey, helpFn(k)));
  }
  if (scalars.children.length) fs.append(scalars);
  nested.forEach((n) => fs.append(n));
  // 아이템 컨텍스트: 이 그룹 안에 새 하위 필드 추가 (예: onTick 안에 temperature)
  if (helpFn === helpForItem) fs.append(addKeyControl(v, fileKey, helpFn));
  return fs;
}

function balanceNode(obj, key, depth) {
  return objNode(obj, key, depth, 'balance', helpForBalance);
}

function renderBalanceTab() {
  if (!state.files.balance) { view.append(el('div', { class: 'empty', text: '데이터 불러오는 중…' })); return; }
  const data = state.files.balance.data;
  const cats = Object.keys(data);
  if (!state.sel.balance || !data[state.sel.balance]) state.sel.balance = cats[0];

  const sidebar = el('div', { class: 'sidebar' });
  const search = sideSearchInput('balance');
  sidebar.append(search.wrap);
  const listBox = el('div');
  sidebar.append(listBox);
  const renderList = () => {
    const q = (state.search.balance || '').trim().toLowerCase();
    listBox.innerHTML = '';
    const matched = cats.filter((c) => !q || c.toLowerCase().includes(q) || (BAL_CAT_LABEL[c] || '').toLowerCase().includes(q));
    if (!matched.length) { listBox.append(el('div', { class: 'hint', style: 'padding:6px 10px', text: '검색 결과 없음' })); return; }
    for (const c of matched) {
      listBox.append(el('button', {
        class: 'side-item' + (c === state.sel.balance ? ' active' : ''),
        'data-key': c,
        text: BAL_CAT_LABEL[c] ? `${BAL_CAT_LABEL[c]} (${c})` : c,
        onclick: () => { state.sel.balance = c; rerenderDetail(); },
      }));
    }
  };
  search.onInput(renderList);
  renderList();

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b) =>
      b.classList.toggle('active', b.dataset.key === state.sel.balance));
    detailWrap.innerHTML = '';
    const cat = state.sel.balance;
    detailWrap.append(el('h2', { text: BAL_CAT_LABEL[cat] ? `${BAL_CAT_LABEL[cat]}` : cat }));
    detailWrap.append(el('div', { class: 'sub', text: `BALANCE.${cat}` }));
    const obj = data[cat];
    const scalars = el('div', { class: 'field-row' });
    const nested = [];
    for (const k of Object.keys(obj)) {
      const child = obj[k];
      if (child !== null && typeof child === 'object') nested.push(balanceNode(obj, k, 0));
      else scalars.append(scalarInput(obj, k, 'balance', helpForBalance(k)));
    }
    if (scalars.children.length) detailWrap.append(scalars);
    nested.forEach((n) => detailWrap.append(n));
  };
  rerenderDetail();
  view.append(el('div', { class: 'list-layout' }, [sidebar, detailWrap]));
}

// ─── 퀘스트 흐름(체인) 탭 ────────────────────────────────────
// objective를 사람이 읽는 한 줄 요약으로
function objectiveSummary(o) {
  if (!o) return '';
  switch (o.type) {
    case 'collect_item': return `${itemName(o.definitionId) || o.definitionId || '?'} ${o.count ?? ''}개 수집`;
    case 'collect_item_type': return `${o.itemType || '?'} 분류 ${o.count ?? ''}개 수집`;
    case 'craft_item': return `${o.category || '?'} ${o.count ?? ''}개 제작`;
    case 'build_structure': return `구조물 ${o.count ?? ''}개 건설`;
    case 'survive_days': return `${o.days ?? o.count ?? '?'}일 생존`;
    case 'visit_district': return `${districtName(o.districtId) || o.districtId || '?'} 방문`;
    default: return o.type || '';
  }
}

function flowNode(q, depth) {
  const day = q.dayTrigger != null ? `D${q.dayTrigger}` : '';
  const dl = (q.deadlineDays != null && q.deadlineDays !== Infinity) ? `⏳${q.deadlineDays}일` : '';
  const btn = el('button', {
    class: 'flow-node', onclick: () => gotoEntity('quests', q.id),
    title: q.desc || '',
  }, [
    el('span', { class: 'flow-day', text: day }),
    el('span', { class: 'flow-title', text: `${q.icon || ''} ${q.title || q.id}` }),
    el('span', { class: 'flow-obj', text: objectiveSummary(q.objective) }),
    dl ? el('span', { class: 'flow-dl', text: dl }) : null,
  ]);
  return el('div', {
    class: 'flow-row' + (depth > 0 ? ' flow-child' : ''),
    style: `margin-left:${depth * 22}px`,
  }, [depth > 0 ? el('span', { class: 'flow-arrow', text: '↳' }) : null, btn]);
}

function renderFlowTab() {
  const data = mergedQuestData();
  const ids = Object.keys(data);
  if (!ids.length) { view.append(el('div', { class: 'empty', text: '데이터 불러오는 중…' })); return; }
  const groups = {};
  for (const id of ids) { const c = data[id].characterId || '(공통)'; (groups[c] = groups[c] || []).push(id); }

  const wrap = el('div', { class: 'detail' });
  wrap.append(el('h2', { text: '🔗 퀘스트 흐름' }));
  wrap.append(el('p', { class: 'hint', text: '선행(prerequisite) 관계를 따라 이어지는 체인입니다. 분기는 들여쓰기(↳)로 갈라지고, 각 노드의 D=시작 일차 · ⏳=완료 기한입니다. 노드를 클릭하면 편집 화면으로 이동합니다.' }));

  const sortFn = (a, b) => ((data[a].dayTrigger ?? 9999) - (data[b].dayTrigger ?? 9999)) || a.localeCompare(b);

  for (const [char, qids] of Object.entries(groups)) {
    const fs = el('fieldset', {}, el('legend', { text: char === '(공통)' ? `공통 퀘스트 (${qids.length})` : `${char} (${qids.length})` }));
    const inGroup = new Set(qids);
    const childrenOf = {};
    const roots = [];
    for (const id of qids) {
      const pre = data[id].prerequisite;
      if (pre && inGroup.has(pre)) (childrenOf[pre] = childrenOf[pre] || []).push(id);
      else roots.push(id);
    }
    roots.sort(sortFn);
    const seen = new Set();
    const walk = (id, depth) => {
      if (seen.has(id)) return;
      seen.add(id);
      fs.append(flowNode(data[id], depth));
      for (const k of (childrenOf[id] || []).slice().sort(sortFn)) walk(k, depth + 1);
    };
    for (const r of roots) walk(r, 0);
    for (const id of [...qids].sort(sortFn)) if (!seen.has(id)) walk(id, 0); // 순환 안전망
    wrap.append(fs);
  }
  view.append(wrap);
}

// ─── quests tab ──────────────────────────────────────────────
// 신규 퀘스트 생성 — 현재 선택된 퀘스트와 같은 소스 파일에 추가(아이템 탭 선례).
// 선택이 없으면 공통 파일(q_global)에 추가. 상세에서 조건·보상 설정.
function createQuest() {
  const idx = buildQuestIndex();
  const targetFk = (state.sel.quests && idx[state.sel.quests]) || 'q_global';
  if (!state.files[targetFk]?.data) { alert('퀘스트 소스를 불러오지 못했습니다. (serve.js 연결 확인)'); return; }
  const fileLabel = DATA_FILES[targetFk].label;
  const raw = (prompt(`새 퀘스트 ID (영문/숫자/밑줄, 예: mq_my_quest)\n\n추가 위치: ${fileLabel}`) || '').trim();
  if (!raw) return;
  const id = raw.replace(/[^A-Za-z0-9_]/g, '');
  if (!id) { alert('ID는 영문/숫자/밑줄만 사용하세요.'); return; }
  if (idx[id]) { alert(`이미 존재하는 퀘스트 ID입니다. (${DATA_FILES[idx[id]].label})`); return; }
  const title = (prompt('퀘스트 제목', '새 퀘스트') || '새 퀘스트').trim();
  const characterId = (prompt('캐릭터 ID (공통 퀘스트면 비워두기)', '') || '').trim();
  state.files[targetFk].data[id] = {
    id, title, icon: '📜', characterId,
    dayTrigger: 1, deadlineDays: Infinity, desc: '',
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: '', count: 1 },
    reward: { morale: 0, items: [] },
  };
  state.sel.quests = id;
  markDirty(targetFk);
  status(`퀘스트 「${title}」(${id}) 생성 → ${fileLabel}. 목표·보상을 상세에서 설정하세요.`, 'ok');
  render();
}

function renderQuestsTab() {
  const idx = buildQuestIndex();
  const data = mergedQuestData(idx);
  const ids = Object.keys(data);
  if (!ids.length) { view.append(el('div', { class: 'empty', text: '퀘스트 소스를 불러오지 못했습니다. (serve.js 연결 확인)' })); return; }
  // group by characterId
  const groups = {};
  for (const id of ids) {
    const c = data[id].characterId || '(공통)';
    (groups[c] = groups[c] || []).push(id);
  }
  if (!state.sel.quests || !data[state.sel.quests]) state.sel.quests = ids[0];

  const sidebar = el('div', { class: 'sidebar' });
  sidebar.append(el('button', { class: 'ghost row-add', text: '+ 새 퀘스트 추가', onclick: createQuest }));
  const search = sideSearchInput('quests');
  sidebar.append(search.wrap);
  const listBox = el('div');
  sidebar.append(listBox);
  const renderList = () => {
    const q = (state.search.quests || '').trim().toLowerCase();
    listBox.innerHTML = '';
    let any = false;
    for (const [char, qids] of Object.entries(groups)) {
      const matched = qids.filter((id) => !q || id.toLowerCase().includes(q) || (data[id].title || '').toLowerCase().includes(q) || char.toLowerCase().includes(q));
      if (!matched.length) continue;
      any = true;
      listBox.append(el('div', { class: 'side-group', text: char }));
      for (const id of matched) {
        listBox.append(el('button', {
          class: 'side-item' + (id === state.sel.quests ? ' active' : ''),
          'data-key': id,
          text: `${data[id].icon || ''} ${data[id].title || id}`,
          onclick: () => { state.sel.quests = id; rerenderDetail(); },
        }));
      }
    }
    if (!any) listBox.append(el('div', { class: 'hint', style: 'padding:6px 10px', text: '검색 결과 없음' }));
  };
  search.onInput(renderList);
  renderList();

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    detailWrap.innerHTML = '';
    const fk = idx[state.sel.quests];
    renderQuestDetail(detailWrap, data[state.sel.quests], data, fk);
    sidebar.querySelectorAll('.side-item').forEach((b) => b.classList.toggle('active', b.dataset.key === state.sel.quests));
  };
  rerenderDetail();
  view.append(el('div', { class: 'list-layout' }, [sidebar, detailWrap]));
}

function renderQuestDetail(root, q, allQuests, fileKey) {
  root.append(el('div', { class: 'sub', text: `소스: ${DATA_FILES[fileKey]?.label || fileKey}` }));
  root.append(el('h2', { html: `${q.icon || ''} ${q.title || q.id} <span class="chain-badge">${q.id}</span>` }));
  root.append(el('div', { class: 'sub', text: `캐릭터: ${q.characterId || '-'}` }));

  // basic fields
  const fr1 = el('div', { class: 'field-row' });
  for (const k of ['title', 'icon', 'dayTrigger']) {
    if (k in q) fr1.append(scalarInput(q, k, fileKey));
  }
  // deadlineDays with ∞ toggle
  if ('deadlineDays' in q) {
    const isInf = q.deadlineDays === Infinity;
    const num = el('input', { type: 'number', value: isInf ? '' : q.deadlineDays, disabled: isInf });
    const chk = el('input', { type: 'checkbox', ...(isInf ? { checked: true } : {}) });
    chk.addEventListener('change', () => {
      if (chk.checked) { q.deadlineDays = Infinity; num.disabled = true; num.value = ''; }
      else { q.deadlineDays = Number(num.value) || 0; num.disabled = false; }
      markDirty(fileKey);
    });
    num.addEventListener('input', () => { q.deadlineDays = Number(num.value); markDirty(fileKey); });
    fr1.append(el('div', { class: 'field' }, [
      fieldLabel('deadlineDays'),
      el('div', { class: 'field-row' }, [num, el('label', { class: 'hint' }, [chk, ' ∞'])]),
    ]));
  }
  root.append(fr1);

  // desc
  if ('desc' in q) {
    const ta = el('textarea', { text: q.desc });
    ta.addEventListener('input', () => { q.desc = ta.value; markDirty(fileKey); });
    root.append(el('div', { class: 'field grow' }, [fieldLabel('desc'), ta]));
  }

  // prerequisite (chain linkage)
  const sameChar = Object.keys(allQuests).filter((id) => allQuests[id].characterId === q.characterId && id !== q.id);
  const sel = el('select');
  sel.append(el('option', { value: '', ...(q.prerequisite == null ? { selected: true } : {}) }, '(없음)'));
  for (const id of sameChar) {
    sel.append(el('option', { value: id, ...(q.prerequisite === id ? { selected: true } : {}) },
      `${allQuests[id].title || id}`));
  }
  sel.addEventListener('change', () => {
    q.prerequisite = sel.value || null; markDirty(fileKey);
  });
  // downstream (what depends on this)
  const downstream = Object.values(allQuests).filter((x) => x.prerequisite === q.id).map((x) => x.title || x.id);
  root.append(el('fieldset', {}, [
    el('legend', { text: '연계 (체인)' }),
    el('div', { class: 'field' }, [fieldLabel('prerequisite (선행 퀘스트)', 'prerequisite'), sel]),
    el('div', { class: 'hint', text: `→ 이 퀘스트를 선행으로 하는 후속: ${downstream.length ? downstream.join(', ') : '없음'}` }),
  ]));

  // objective (condition)
  root.append(el('fieldset', {}, [
    el('legend', { text: '목표 조건 (objective)' }),
    objectiveEditor(q, fileKey),
  ]));

  // reward + failPenalty
  root.append(el('fieldset', {}, [
    el('legend', { text: '보상 (reward)' }),
    objectFields(q.reward, fileKey),
  ]));
  if (q.failPenalty) {
    root.append(el('fieldset', {}, [
      el('legend', { text: '실패 패널티 (failPenalty)' }),
      objectFields(q.failPenalty, fileKey),
    ]));
  }
}

const OBJ_TYPES = ['collect_item', 'collect_item_type', 'craft_item', 'build_structure', 'survive_days', 'visit_district'];
function objectiveEditor(q, fileKey) {
  const o = q.objective || (q.objective = { type: 'collect_item', count: 1 });
  const wrap = el('div');
  const typeSel = el('select');
  for (const t of OBJ_TYPES) {
    typeSel.append(el('option', { value: t, ...(o.type === t ? { selected: true } : {}) }, t));
  }
  if (!OBJ_TYPES.includes(o.type)) {
    typeSel.append(el('option', { value: o.type, selected: true }, o.type));
  }
  typeSel.addEventListener('change', () => { o.type = typeSel.value; markDirty(fileKey); rerenderDetail(); });
  wrap.append(el('div', { class: 'field' }, [fieldLabel('type'), typeSel]));

  // render all non-type keys generically (preserves any variant fields)
  const fr = el('div', { class: 'field-row' });
  for (const key of Object.keys(o)) {
    if (key === 'type') continue;
    if (key === 'definitionId') {
      const inp = el('input', { class: 'id', value: o[key] ?? '', list: 'item-ids' });
      const nm = el('span', { class: 'chain-badge', text: itemName(o[key]) });
      inp.addEventListener('input', () => { o[key] = inp.value.trim(); nm.textContent = itemName(o[key]); markDirty(fileKey); });
      fr.append(el('div', { class: 'field' }, [fieldLabel(key), el('div', { class: 'field-row' }, [inp, nm])]));
    } else if (key === 'districtId') {
      const inp = el('input', { class: 'id', value: o[key] ?? '' });
      const nm = el('span', { class: 'chain-badge', text: districtName(o[key]) });
      inp.addEventListener('input', () => { o[key] = inp.value.trim(); nm.textContent = districtName(o[key]); markDirty(fileKey); });
      fr.append(el('div', { class: 'field' }, [fieldLabel(key), el('div', { class: 'field-row' }, [inp, nm])]));
    } else {
      fr.append(scalarInput(o, key, fileKey));
    }
  }
  wrap.append(fr);
  return wrap;
}

// ─── settings tab ────────────────────────────────────────────
function renderSettings() {
  const box = el('div', { class: 'detail settings-box' });
  box.append(el('h2', { text: '⚙️ 설정 (로컬)' }));

  box.append(el('div', { class: 'field' }, [
    el('label', { text: '현재 git 브랜치 (로컬)' }),
    el('input', { value: state.branch, disabled: true }),
  ]));

  if (!state.gitAvailable) {
    box.append(el('p', { class: 'hint', html:
      `⚠️ <b>git을 찾을 수 없습니다</b> (${state.gitReason || '미설치/PATH 미설정'}).<br>` +
      '저장하면 로컬 파일에는 기록되지만 <b>자동 푸시는 생략</b>됩니다. ' +
      '아래 중 하나로 해결하세요:<br>' +
      '· <b>Windows</b>: <a href="https://git-scm.com/download/win" target="_blank">Git for Windows</a> 설치 시 ' +
      '"Git from the command line…" 옵션 선택 → <b>터미널을 새로 열고</b> <code>node serve.js</code> 재실행<br>' +
      '· 이미 설치했다면 <code>git --version</code>이 되는 터미널에서 serve.js를 실행<br>' +
      '· 또는 저장 후 직접 <code>git add -A && git commit && git push</code>' }));
  }

  const msg = el('input', { value: state.commitMsg });
  msg.addEventListener('input', () => { state.commitMsg = msg.value; });
  box.append(el('div', { class: 'field' }, [el('label', { text: '커밋 메시지' }), msg]));

  box.append(el('div', { class: 'field-row' }, [
    el('button', { class: 'primary', text: '🔄 로컬에서 다시 불러오기', onclick: () => loadAll() }),
  ]));

  box.append(el('p', { class: 'hint', html:
    '이 에디터는 <b>로컬 serve.js</b>를 통해 동작합니다. 저장소 루트에서 ' +
    '<code>node serve.js</code> 실행 후 <code>http://localhost:8080/tools/editor/</code> 로 접속하세요.<br><br>' +
    '· 데이터는 로컬 파일에서 읽고, 수정 후 <b>[저장 (커밋&푸시)]</b>를 누르면 ' +
    '로컬 디스크에 기록 → 현재 브랜치로 <code>git commit</code> + <code>git push</code> 합니다.<br>' +
    '· 변경된 데이터 블록만 재직렬화됩니다(헤더·함수·export 보존). ' +
    '⚠️ 데이터 블록 내부의 인라인 주석은 보존되지 않습니다 — push 후 <code>git diff</code> 확인 권장.<br>' +
    '· 무결성 검증: <code>node js/data/validate.js</code>' }));
  view.append(box);
}

// 상단 "변경됨" 배지 클릭 → 변경 탭으로 이동
const dirtyFlag = $('#dirty');
if (dirtyFlag) { dirtyFlag.style.cursor = 'pointer'; dirtyFlag.addEventListener('click', () => switchTab('changes')); }

// ─── boot ────────────────────────────────────────────────────
switchTab('balance');
loadAll();
