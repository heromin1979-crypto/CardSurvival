// === DATA EDITOR — main app ===
import {
  DATA_FILES,
  ITEM_FILE_KEYS,
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

// ─── 필드 설명 (마우스 오버 툴팁) ────────────────────────────
const FIELD_HELP = {
  // 장소(구)
  dangerLevel: '위험도 등급(1~4). 높을수록 조우·전투 위험이 큽니다.',
  travelCostTP: '이 구역으로 이동할 때 드는 시간(TP). 1TP = 게임 내 15분.',
  radiation: '방사선 수치. 높으면 피폭 위험이 있습니다.',
  encounterChance: '탐색 시 적과 마주칠 확률(0~1). 예: 0.15 = 15%.',
  noiseGen: '활동 시 발생하는 소음. 높을수록 적을 끌어들입니다.',
  fishingQuality: '낚시 품질(높을수록 좋은 어획). 낚시 가능 구역에만 적용.',
  hasFishing: '이 구역에서 낚시가 가능한지 여부.',
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
  icon: '퀘스트 아이콘(이모지).',
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
  weight: '아이템 1개의 무게(kg). 소지 무게 한도에 영향을 줍니다.',
  tags: '분류 태그. 검색·필터·레시피 조건 등에 사용됩니다.',
  defaultDurability: '기본 내구도. 사용·장비하면 닳습니다.',
  defaultContamination: '기본 오염도(0 = 깨끗).',
  dismantle: '분해 시 얻는 산출물 목록.',
  dismantleTP: '분해에 드는 시간(TP).',
  stackable: '같은 칸에 여러 개를 겹쳐 보관할 수 있는지 여부.',
  maxStack: '한 칸에 겹칠 수 있는 최대 수량.',
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
  isHangang: '한강 수변 자원 여부.',
  safeZone: '안전지대(조우/위협 차단) 여부.',
  weatherProtection: '날씨 패널티 차단 여부.',
  contaminationShield: '식량 오염 차단 여부.',
  npcShelter: 'NPC가 합류·거주 가능한지 여부.',
};
function helpForItem(key) { return ITEM_HELP[key] ?? FIELD_HELP[key] ?? ''; }


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
  } catch (e) {
    console.warn('item id 목록 로드 실패 (검증 비활성):', e);
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

  const q = state.files.quests?.data || {};
  const qIds = new Set(Object.keys(q));
  for (const [key, quest] of Object.entries(q)) {
    if (badItem(quest.objective?.definitionId)) issues.push({ fileKey: 'quests', entityKey: key, path: 'objective.definitionId', id: quest.objective.definitionId, msg: '존재하지 않는 아이템 ID' });
    if (quest.objective?.districtId && !d[quest.objective.districtId]) issues.push({ fileKey: 'quests', entityKey: key, path: 'objective.districtId', id: quest.objective.districtId, msg: '존재하지 않는 구(district) ID' });
    (quest.reward?.items || []).forEach((it, i) => {
      if (badItem(it.definitionId)) issues.push({ fileKey: 'quests', entityKey: key, path: `reward.items[${i}].definitionId`, id: it.definitionId, msg: '존재하지 않는 아이템 ID' });
    });
    if (quest.prerequisite && !qIds.has(quest.prerequisite)) issues.push({ fileKey: 'quests', entityKey: key, path: 'prerequisite', id: quest.prerequisite, msg: '존재하지 않는 선행 퀘스트 ID' });
  }
  return issues;
}

// 해당 엔티티가 있는 탭으로 이동 + 선택
function gotoEntity(fileKey, entityKey) {
  state.sel[fileKey] = entityKey;
  switchTab(fileKey);
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

    detailWrap.append(el('h2', { text: `${it.icon || ''} ${it.name || it.id}` }));
    detailWrap.append(el('div', { class: 'sub', text: `${it.id}  ·  ${DATA_FILES[fk].label}` }));

    // id 외 모든 필드 편집 (id는 객체 키라 읽기 전용 — 헤더에 표시)
    const scalars = el('div', { class: 'field-row' });
    const nested = [];
    for (const k of Object.keys(it)) {
      if (k === 'id') continue;
      const child = it[k];
      if (child !== null && typeof child === 'object') nested.push(objNode(it, k, 0, fk, helpForItem));
      else scalars.append(scalarInput(it, k, fk, helpForItem(k)));
    }
    if (scalars.children.length) detailWrap.append(scalars);
    nested.forEach((n) => detailWrap.append(n));
  };

  const renderList = () => {
    const q = (state.itemSearch || '').trim().toLowerCase();
    listBox.innerHTML = '';
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

  search.addEventListener('input', () => { state.itemSearch = search.value; renderList(); });
  renderList();
  renderDetail();
  view.append(el('div', {}, [
    el('div', { class: 'hint', style: 'margin-bottom:8px' }, '※ 아이템 정의 소스를 직접 편집합니다. stackable·maxStack은 stackConfig.js가 런타임에 덮어쓸 수 있습니다.'),
    el('div', { class: 'field', style: 'margin-bottom:10px' }, [search]),
    el('div', { class: 'list-layout' }, [listBox, detailWrap]),
  ]));
}

// ─── 변경 사항(diff) + 되돌리기 ──────────────────────────────
// original 스냅샷과 현재 data를 비교해 엔티티(구/랜드마크/퀘스트)별 변경 목록 생성
// (diffValue는 serialize.js의 순수 함수)
function entityTitle(fileKey, key) {
  const e = state.files[fileKey].data[key] || state.files[fileKey].original[key] || {};
  if (fileKey === 'quests') return `${e.icon || ''} ${e.title || key} · ${e.characterId || ''}`;
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
function lootTableEditor(rows, idKey, extraCols, fileKey) {
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
    const tr = el('tr', {}, [
      el('td', {}, idInput),
      nameCell,
      el('td', {}, wInput),
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
function scalarInput(obj, key, fileKey, help) {
  const v = obj[key];
  const lbl = help !== undefined ? labelEl(key, help) : fieldLabel(key);
  // 불리언 → 체크박스
  if (typeof v === 'boolean') {
    const cb = el('input', { type: 'checkbox', ...(v ? { checked: true } : {}) });
    cb.addEventListener('change', () => { obj[key] = cb.checked; markDirty(fileKey); });
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
  });
  return el('div', { class: 'field' }, [lbl, inp]);
}

// item-reward rows: [{definitionId, qty}]
function itemRows(arr, fileKey) {
  const wrap = el('div');
  arr.forEach((it, idx) => {
    const id = el('input', { class: 'id', value: it.definitionId ?? '', list: 'item-ids' });
    const nm = el('span', { class: 'chain-badge', text: itemName(it.definitionId) });
    id.addEventListener('input', () => {
      it.definitionId = id.value.trim(); nm.textContent = itemName(it.definitionId); markDirty(fileKey);
    });
    const qty = el('input', { class: 'num', type: 'number', value: it.qty ?? 1 });
    qty.addEventListener('input', () => { it.qty = Number(qty.value); markDirty(fileKey); });
    wrap.append(el('div', { class: 'field-row' }, [
      el('div', { class: 'field' }, [fieldLabel('item', 'definitionId'), id]),
      el('div', { class: 'field' }, [fieldLabel('이름', '__name'), nm]),
      el('div', { class: 'field' }, [fieldLabel('qty', 'qty'), qty]),
      el('button', { class: 'ghost danger', text: '✕',
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
  if (!state.files[state.tab]) {
    view.append(el('div', { class: 'empty', text: '데이터 불러오는 중… (serve.js가 떠 있어야 합니다)' }));
    return;
  }
  if (state.tab === 'districts') return renderListTab('districts', (d) => d.name);
  if (state.tab === 'landmarks') return renderListTab('landmarks', (d) => d.name);
  if (state.tab === 'quests') return renderQuestsTab();
}

let rerenderDetail = () => {};

function renderListTab(fileKey, labelFn) {
  const data = state.files[fileKey].data;
  const keys = Object.keys(data);
  if (!state.sel[fileKey] || !data[state.sel[fileKey]]) state.sel[fileKey] = keys[0];

  const sidebar = el('div', { class: 'sidebar' },
    keys.map((k) => el('button', {
      class: 'side-item' + (k === state.sel[fileKey] ? ' active' : ''),
      text: `${data[k].icon ? data[k].icon + ' ' : ''}${labelFn(data[k]) || k}`,
      onclick: () => { state.sel[fileKey] = k; rerenderDetail(); },
    })));

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b, i) =>
      b.classList.toggle('active', keys[i] === state.sel[fileKey]));
    detailWrap.innerHTML = '';
    if (fileKey === 'districts') renderDistrictDetail(detailWrap, data[state.sel[fileKey]]);
    else renderLandmarkDetail(detailWrap, data[state.sel[fileKey]]);
  };
  rerenderDetail();
  view.append(el('div', { class: 'list-layout' }, [sidebar, detailWrap]));
}

function renderDistrictDetail(root, dist) {
  root.append(el('h2', { text: `${dist.icon || ''} ${dist.name || dist.id}` }));
  root.append(el('div', { class: 'sub', text: dist.description || '' }));

  const numKeys = ['dangerLevel', 'travelCostTP', 'radiation', 'encounterChance', 'noiseGen', 'fishingQuality'];
  const fr = el('div', { class: 'field-row' });
  for (const k of numKeys) if (k in dist) fr.append(scalarInput(dist, k, 'districts'));
  root.append(fr);

  const fs = el('fieldset', {}, el('legend', { text: 'lootTable (탐색 드랍 가중치)' }));
  fs.append(lootTableEditor(
    dist.lootTable || (dist.lootTable = []),
    'definitionId',
    [{ key: 'minQty', label: 'min' }, { key: 'maxQty', label: 'max' }, { key: 'contamChance', label: '오염%' }],
    'districts',
  ));
  root.append(fs);
}

function renderLandmarkDetail(root, lm) {
  root.append(el('h2', { text: `${lm.icon || ''} ${lm.name || ''}` }));
  root.append(el('div', { class: 'sub', text: lm.desc || '' }));
  const subs = lm.subLocations || [];
  if (!subs.length) {
    root.append(el('div', { class: 'hint', text: '세부 장소 없음.' }));
    return;
  }
  for (const sub of subs) {
    const fs = el('fieldset', {}, el('legend', { text: `${sub.icon || ''} ${sub.name || sub.id}` }));
    const fr = el('div', { class: 'field-row' });
    if ('dangerMod' in sub) fr.append(scalarInput(sub, 'dangerMod', 'landmarks'));
    // lootCount is a [min,max] tuple
    if (Array.isArray(sub.lootCount)) {
      const mk = (i, label) => {
        const inp = el('input', { type: 'number', value: sub.lootCount[i] ?? 0 });
        inp.addEventListener('input', () => { sub.lootCount[i] = Number(inp.value); markDirty('landmarks'); });
        return el('div', { class: 'field' }, [fieldLabel(label, 'lootCount'), inp]);
      };
      fr.append(mk(0, 'lootCount min'), mk(1, 'lootCount max'));
    }
    fs.append(fr);
    fs.append(lootTableEditor(
      sub.lootTable || (sub.lootTable = []),
      'id', [], 'landmarks',
    ));
    root.append(fs);
  }
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
    // 스칼라 배열 → 인덱스별 인풋 + 개별 삭제(✕) + 추가(+)
    if (v.every((x) => x === null || typeof x !== 'object')) {
      const row = el('div', { class: 'field-row' });
      v.forEach((x, i) => {
        const isNum = typeof x === 'number';
        const inp = el('input', { class: 'num', type: isNum ? 'number' : 'text', step: 'any', value: x });
        inp.addEventListener('input', () => { v[i] = isNum ? Number(inp.value) : inp.value; markDirty(fileKey); });
        const rm = el('button', { class: 'ghost danger mini', text: '✕', title: '삭제',
          onclick: () => { v.splice(i, 1); markDirty(fileKey); rerenderDetail(); } });
        row.append(el('div', { class: 'field' }, [el('label', { text: `[${i}]` }), el('div', { class: 'inline-row' }, [inp, rm])]));
      });
      // 마지막 칸에 작은 + (인풋 한 칸 크기)
      const add = el('button', { class: 'ghost add-inline', text: '+', title: '추가',
        onclick: () => { v.push(typeof v[0] === 'number' ? 0 : ''); markDirty(fileKey); rerenderDetail(); } });
      row.append(el('div', { class: 'field' }, [el('label', { text: ' ' }), add]));
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

  const sidebar = el('div', { class: 'sidebar' },
    cats.map((c) => el('button', {
      class: 'side-item' + (c === state.sel.balance ? ' active' : ''),
      text: BAL_CAT_LABEL[c] ? `${BAL_CAT_LABEL[c]} (${c})` : c,
      onclick: () => { state.sel.balance = c; rerenderDetail(); },
    })));

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b, i) =>
      b.classList.toggle('active', cats[i] === state.sel.balance));
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
  if (!state.files.quests) { view.append(el('div', { class: 'empty', text: '데이터 불러오는 중…' })); return; }
  const data = state.files.quests.data;
  const ids = Object.keys(data);
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
function renderQuestsTab() {
  const data = state.files.quests.data;
  const ids = Object.keys(data);
  // group by characterId
  const groups = {};
  for (const id of ids) {
    const c = data[id].characterId || '(공통)';
    (groups[c] = groups[c] || []).push(id);
  }
  if (!state.sel.quests || !data[state.sel.quests]) state.sel.quests = ids[0];

  const sidebar = el('div', { class: 'sidebar' });
  for (const [char, qids] of Object.entries(groups)) {
    sidebar.append(el('div', { class: 'side-group', text: char }));
    for (const id of qids) {
      sidebar.append(el('button', {
        class: 'side-item' + (id === state.sel.quests ? ' active' : ''),
        text: `${data[id].icon || ''} ${data[id].title || id}`,
        onclick: () => { state.sel.quests = id; rerenderDetail(); },
      }));
    }
  }

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b) => b.classList.remove('active'));
    detailWrap.innerHTML = '';
    renderQuestDetail(detailWrap, data[state.sel.quests], data);
    // re-highlight
    [...sidebar.querySelectorAll('.side-item')].forEach((b) => {
      if (b.textContent.includes(data[state.sel.quests].title || state.sel.quests)) {
        b.classList.add('active');
      }
    });
  };
  rerenderDetail();
  view.append(el('div', { class: 'list-layout' }, [sidebar, detailWrap]));
}

function renderQuestDetail(root, q, allQuests) {
  root.append(el('h2', { html: `${q.icon || ''} ${q.title || q.id} <span class="chain-badge">${q.id}</span>` }));
  root.append(el('div', { class: 'sub', text: `캐릭터: ${q.characterId || '-'}` }));

  // basic fields
  const fr1 = el('div', { class: 'field-row' });
  for (const k of ['title', 'icon', 'dayTrigger']) {
    if (k in q) fr1.append(scalarInput(q, k, 'quests'));
  }
  // deadlineDays with ∞ toggle
  if ('deadlineDays' in q) {
    const isInf = q.deadlineDays === Infinity;
    const num = el('input', { type: 'number', value: isInf ? '' : q.deadlineDays, disabled: isInf });
    const chk = el('input', { type: 'checkbox', ...(isInf ? { checked: true } : {}) });
    chk.addEventListener('change', () => {
      if (chk.checked) { q.deadlineDays = Infinity; num.disabled = true; num.value = ''; }
      else { q.deadlineDays = Number(num.value) || 0; num.disabled = false; }
      markDirty('quests');
    });
    num.addEventListener('input', () => { q.deadlineDays = Number(num.value); markDirty('quests'); });
    fr1.append(el('div', { class: 'field' }, [
      fieldLabel('deadlineDays'),
      el('div', { class: 'field-row' }, [num, el('label', { class: 'hint' }, [chk, ' ∞'])]),
    ]));
  }
  root.append(fr1);

  // desc
  if ('desc' in q) {
    const ta = el('textarea', { text: q.desc });
    ta.addEventListener('input', () => { q.desc = ta.value; markDirty('quests'); });
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
    q.prerequisite = sel.value || null; markDirty('quests');
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
    objectiveEditor(q),
  ]));

  // reward + failPenalty
  root.append(el('fieldset', {}, [
    el('legend', { text: '보상 (reward)' }),
    objectFields(q.reward, 'quests'),
  ]));
  if (q.failPenalty) {
    root.append(el('fieldset', {}, [
      el('legend', { text: '실패 패널티 (failPenalty)' }),
      objectFields(q.failPenalty, 'quests'),
    ]));
  }
}

const OBJ_TYPES = ['collect_item', 'collect_item_type', 'craft_item', 'build_structure', 'survive_days', 'visit_district'];
function objectiveEditor(q) {
  const o = q.objective || (q.objective = { type: 'collect_item', count: 1 });
  const wrap = el('div');
  const typeSel = el('select');
  for (const t of OBJ_TYPES) {
    typeSel.append(el('option', { value: t, ...(o.type === t ? { selected: true } : {}) }, t));
  }
  if (!OBJ_TYPES.includes(o.type)) {
    typeSel.append(el('option', { value: o.type, selected: true }, o.type));
  }
  typeSel.addEventListener('change', () => { o.type = typeSel.value; markDirty('quests'); rerenderDetail(); });
  wrap.append(el('div', { class: 'field' }, [fieldLabel('type'), typeSel]));

  // render all non-type keys generically (preserves any variant fields)
  const fr = el('div', { class: 'field-row' });
  for (const key of Object.keys(o)) {
    if (key === 'type') continue;
    if (key === 'definitionId') {
      const inp = el('input', { class: 'id', value: o[key] ?? '', list: 'item-ids' });
      const nm = el('span', { class: 'chain-badge', text: itemName(o[key]) });
      inp.addEventListener('input', () => { o[key] = inp.value.trim(); nm.textContent = itemName(o[key]); markDirty('quests'); });
      fr.append(el('div', { class: 'field' }, [fieldLabel(key), el('div', { class: 'field-row' }, [inp, nm])]));
    } else if (key === 'districtId') {
      const inp = el('input', { class: 'id', value: o[key] ?? '' });
      const nm = el('span', { class: 'chain-badge', text: districtName(o[key]) });
      inp.addEventListener('input', () => { o[key] = inp.value.trim(); nm.textContent = districtName(o[key]); markDirty('quests'); });
      fr.append(el('div', { class: 'field' }, [fieldLabel(key), el('div', { class: 'field-row' }, [inp, nm])]));
    } else {
      fr.append(scalarInput(o, key, 'quests'));
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
