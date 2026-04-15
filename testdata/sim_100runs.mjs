#!/usr/bin/env node
// === 100일 생존 몬테카를로 시뮬레이션 (이지수 · 의사) ===
// 헤드리스 시뮬레이션 — 브라우저 불필요
// 사용법: node sim_100runs.mjs

import { writeFileSync } from 'fs';

// ─────────────────────────────────────────────────────────────
//  상수
// ─────────────────────────────────────────────────────────────
const TP_PER_DAY     = 96;
const TARGET_DAYS    = 100;
const TARGET_TP      = TARGET_DAYS * TP_PER_DAY;
const NUM_RUNS       = 100;

const STAT_DECAY = {
  hydration: 1.5,
  nutrition: 0.5,
  morale:    0.2,
  fatigue:   0.8,
};

const SEASON_MODS = {
  spring: { hydrationMult: 1.0, tempDecay: 0,    tempRise: 0,    infectionMult: 1.5, encounterMult: 1.0 },
  summer: { hydrationMult: 1.5, tempDecay: 0,    tempRise: 0.3,  infectionMult: 1.2, encounterMult: 1.0 },
  autumn: { hydrationMult: 0.9, tempDecay: -0.3, tempRise: 0,    infectionMult: 1.3, encounterMult: 1.0 },
  winter: { hydrationMult: 0.8, tempDecay: -1.5, tempRise: 0,    infectionMult: 1.0, encounterMult: 0.8 },
};

function getSeason(day) {
  if (day <= 90)  return 'spring';
  if (day <= 180) return 'summer';
  if (day <= 270) return 'autumn';
  return 'winter';
}

// ─── 구(District) 데이터 (간소화) ──────────────────────────
const DISTRICTS = {
  gangnam:       { name: '강남구',   dl: 3, enc: 0.35, rad: 0,  adj: ['seocho','songpa','dongjak'],                food: 1, water: 0, metal: 0, cloth: 1, rope: 0, medical: 2, wood: 0 },
  gangdong:      { name: '강동구',   dl: 2, enc: 0.15, rad: 0,  adj: ['songpa','geumcheon','gwangjin'],            food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 1, wood: 0 },
  gangbuk:       { name: '강북구',   dl: 2, enc: 0.00, rad: 0,  adj: ['dobong','seongbuk','jungrang','dongdaemun'],food: 1, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
  gangseo:       { name: '강서구',   dl: 2, enc: 0.20, rad: 0,  adj: ['yeongdeungpo','yangcheon'],                 food: 1, water: 0, metal: 2, cloth: 0, rope: 1, medical: 0, wood: 0 },
  gwanak:        { name: '관악구',   dl: 1, enc: 0.05, rad: 0,  adj: ['dongjak','geumcheon','songpa'],             food: 0, water: 1, metal: 1, cloth: 1, rope: 0, medical: 1, wood: 0 },
  gwangjin:      { name: '광진구',   dl: 2, enc: 0.05, rad: 0,  adj: ['seongdong','gangdong'],                     food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
  guro:          { name: '구로구',   dl: 2, enc: 0.20, rad: 0,  adj: ['yangcheon','dongjak','seocho'],             food: 0, water: 0, metal: 3, cloth: 0, rope: 1, medical: 0, wood: 0 },
  geumcheon:     { name: '금천구',   dl: 2, enc: 0.20, rad: 5,  adj: ['gwanak','gangdong'],                        food: 0, water: 0, metal: 4, cloth: 0, rope: 1, medical: 0, wood: 0 },
  nowon:         { name: '노원구',   dl: 1, enc: 0.00, rad: 0,  adj: ['dobong','jungrang'],                        food: 2, water: 1, metal: 0, cloth: 1, rope: 0, medical: 0, wood: 0 },
  dobong:        { name: '도봉구',   dl: 1, enc: 0.00, rad: 0,  adj: ['nowon','gangbuk'],                          food: 1, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 1 },
  dongdaemun:    { name: '동대문구', dl: 2, enc: 0.10, rad: 0,  adj: ['jongno','gangbuk','seongdong','junggoo'],   food: 1, water: 0, metal: 0, cloth: 3, rope: 1, medical: 0, wood: 0 },
  dongjak:       { name: '동작구',   dl: 1, enc: 0.05, rad: 0,  adj: ['guro','gwanak','gangnam'],                  food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 1, wood: 0 },
  mapo:          { name: '마포구',   dl: 2, enc: 0.10, rad: 3,  adj: ['seodaemun','jongno','yeongdeungpo'],        food: 1, water: 1, metal: 1, cloth: 1, rope: 1, medical: 0, wood: 0 },
  seodaemun:     { name: '서대문구', dl: 3, enc: 0.20, rad: 0,  adj: ['eunpyeong','seongbuk','mapo'],              food: 0, water: 1, metal: 0, cloth: 1, rope: 0, medical: 2, wood: 0 },
  seocho:        { name: '서초구',   dl: 3, enc: 0.30, rad: 0,  adj: ['gangnam','guro'],                           food: 2, water: 1, metal: 0, cloth: 0, rope: 0, medical: 1, wood: 0 },
  seongdong:     { name: '성동구',   dl: 2, enc: 0.10, rad: 5,  adj: ['dongdaemun','jungrang','gwangjin'],         food: 0, water: 0, metal: 4, cloth: 0, rope: 1, medical: 0, wood: 0 },
  seongbuk:      { name: '성북구',   dl: 2, enc: 0.05, rad: 0,  adj: ['seodaemun','gangbuk','jongno'],             food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
  songpa:        { name: '송파구',   dl: 3, enc: 0.30, rad: 0,  adj: ['gangnam','gangdong','gwanak'],              food: 2, water: 1, metal: 1, cloth: 1, rope: 0, medical: 0, wood: 0 },
  yangcheon:     { name: '양천구',   dl: 1, enc: 0.00, rad: 0,  adj: ['gangseo','guro'],                           food: 2, water: 1, metal: 0, cloth: 1, rope: 0, medical: 0, wood: 0 },
  yeongdeungpo:  { name: '영등포구', dl: 3, enc: 0.35, rad: 0,  adj: ['gangseo','mapo'],                           food: 0, water: 0, metal: 1, cloth: 0, rope: 0, medical: 1, wood: 0 },
  yongsan:       { name: '용산구',   dl: 3, enc: 0.25, rad: 0,  adj: ['jongno','junggoo'],                         food: 0, water: 0, metal: 1, cloth: 0, rope: 0, medical: 0, wood: 0 },
  eunpyeong:     { name: '은평구',   dl: 1, enc: 0.00, rad: 0,  adj: ['seodaemun'],                                food: 2, water: 1, metal: 0, cloth: 0, rope: 1, medical: 1, wood: 0 },
  jongno:        { name: '종로구',   dl: 4, enc: 0.40, rad: 10, adj: ['mapo','seongbuk','dongdaemun','yongsan'],   food: 0, water: 0, metal: 1, cloth: 0, rope: 0, medical: 1, wood: 0 },
  junggoo:       { name: '중구',     dl: 3, enc: 0.25, rad: 0,  adj: ['yongsan','dongdaemun'],                     food: 2, water: 1, metal: 0, cloth: 2, rope: 0, medical: 0, wood: 0 },
  jungrang:      { name: '중랑구',   dl: 2, enc: 0.03, rad: 0,  adj: ['nowon','gangbuk','seongdong'],              food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
};

// ─── 적 데이터 (간소화) ────────────────────────────────────
const ENEMY_TABLES = {
  1: [{ id: 'zombie_common', w: 60, hp: [25,40], dmg: [8,15], acc: 0.60 },
      { id: 'zombie_runner', w: 20, hp: [18,28], dmg: [12,20], acc: 0.75 },
      { id: 'rabid_dog',     w: 15, hp: [20,35], dmg: [10,18], acc: 0.80 },
      { id: 'zombie_acid',   w: 5,  hp: [28,45], dmg: [8,14],  acc: 0.72 }],
  2: [{ id: 'zombie_common', w: 30, hp: [25,40], dmg: [8,15], acc: 0.60 },
      { id: 'zombie_runner', w: 25, hp: [18,28], dmg: [12,20], acc: 0.75 },
      { id: 'raider',        w: 25, hp: [35,55], dmg: [14,22], acc: 0.68 },
      { id: 'rabid_dog',     w: 10, hp: [20,35], dmg: [10,18], acc: 0.80 },
      { id: 'zombie_acid',   w: 10, hp: [28,45], dmg: [8,14],  acc: 0.72 }],
  3: [{ id: 'zombie_common', w: 20, hp: [25,40], dmg: [8,15], acc: 0.60 },
      { id: 'zombie_runner', w: 20, hp: [18,28], dmg: [12,20], acc: 0.75 },
      { id: 'zombie_brute',  w: 15, hp: [60,90], dmg: [20,35], acc: 0.55 },
      { id: 'zombie_horde',  w: 10, hp: [80,120],dmg: [6,12],  acc: 0.65 },
      { id: 'zombie_acid',   w: 15, hp: [28,45], dmg: [8,14],  acc: 0.72 },
      { id: 'raider',        w: 15, hp: [35,55], dmg: [14,22], acc: 0.68 },
      { id: 'rabid_dog',     w: 5,  hp: [20,35], dmg: [10,18], acc: 0.80 }],
  4: [{ id: 'zombie_runner', w: 15, hp: [18,28], dmg: [12,20], acc: 0.75 },
      { id: 'zombie_brute',  w: 25, hp: [60,90], dmg: [20,35], acc: 0.55 },
      { id: 'zombie_horde',  w: 30, hp: [80,120],dmg: [6,12],  acc: 0.65 },
      { id: 'zombie_acid',   w: 20, hp: [28,45], dmg: [8,14],  acc: 0.72 },
      { id: 'raider',        w: 10, hp: [35,55], dmg: [14,22], acc: 0.68 }],
};

// ─────────────────────────────────────────────────────────────
//  유틸리티
// ─────────────────────────────────────────────────────────────
function rand(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function rollEnemy(dl) {
  const table = ENEMY_TABLES[clamp(dl, 1, 4)];
  const tw = table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * tw;
  for (const e of table) { r -= e.w; if (r <= 0) return { ...e, hp: rand(e.hp[0], e.hp[1]) }; }
  return { ...table[0], hp: rand(table[0].hp[0], table[0].hp[1]) };
}

function rollEnemyGroup(dl, noise) {
  let count, edl;
  if (noise < 30)       { count = 1; edl = Math.max(1, dl - 1); }
  else if (noise < 65)  { count = 2; edl = dl; }
  else                  { count = 3; edl = Math.min(4, dl + 1); }
  return Array.from({ length: count }, () => rollEnemy(edl));
}

// ─────────────────────────────────────────────────────────────
//  게임 상태 팩토리 (이지수 · 의사)
// ─────────────────────────────────────────────────────────────
function createGameState() {
  return {
    day: 1, tpInDay: 0, totalTP: 0,
    hp:          95,  maxHp: 95,
    hydration:   200, maxHydration: 288,
    nutrition:   80,  maxNutrition: 100,
    temperature: 50,  maxTemp: 100,
    morale:      70,  maxMorale: 100,
    radiation:   0,
    infection:   0,
    fatigue:     10,
    stamina:     84,  maxStamina: 84, // endurance(72) * ~1.17
    noise:       0,
    alive: true,
    deathCause: null,

    // 위치 (이지수 homeDist: gangnam → 인접 안전한 동작구에서 시작)
    currentDistrict: 'dongjak',
    districtsLooted: new Set(),
    districtsVisited: new Set(['dongjak']),

    // 인벤토리 (단순 카운트)
    inv: {
      bandage: 2, antiseptic: 1, painkiller: 1,   // 시작 아이템
      canned_food: 1, water_bottle: 2, energy_bar: 0, rice: 0,  // 현실적 초기 보급
      contaminated_water: 0, boiled_water: 0, purified_water: 0,
      wood: 0, rope: 0, cloth: 0, scrap_metal: 0, nail: 0,
      first_aid_kit: 0, antibiotics: 0,
      knife: 0, crowbar: 0,
      circuit_board: 0, sand: 0, wild_wheat: 0, worm: 0,
      herb_powder: 0, crude_medicine: 0, meat_stew: 0,
      preserved_ration: 0, mortar_mix: 0, brick: 0,
    },

    // 구조물
    hasCampfire: false,  campfireDura: 0,
    hasGarden:   false,  gardenDura:   0,

    // 질병
    diseases: [], // [{ id, tpElapsed, fatalTp }]

    // 전투 통계
    totalKills:   0,
    combatCount:  0,
    fleeCount:    0,

    // 절망 카운터
    despairTicks: 0,

    // 로그
    log: [],
  };
}

// ─────────────────────────────────────────────────────────────
//  핵심 시뮬레이션 — 1 TP 진행
// ─────────────────────────────────────────────────────────────
function advanceTP(gs) {
  gs.totalTP++;
  gs.tpInDay++;
  if (gs.tpInDay >= TP_PER_DAY) {
    gs.tpInDay = 0;
    gs.day++;
    // 일출 사기 회복 (새 날 = 희망)
    gs.morale = clamp(gs.morale + 3, 0, gs.maxMorale);
  }

  const season = getSeason(gs.day);
  const sm = SEASON_MODS[season];

  // 스탯 감소
  gs.hydration  = clamp(gs.hydration  - STAT_DECAY.hydration * sm.hydrationMult, 0, gs.maxHydration);
  gs.nutrition  = clamp(gs.nutrition   - STAT_DECAY.nutrition, 0, gs.maxNutrition);
  // 사기 감소: 캠프파이어+텃밭 모두 → "집" 안정감 (35%), 캠프파이어만 → 60%
  const hasHome = (gs.hasCampfire && gs.campfireDura > 0) && (gs.hasGarden && gs.gardenDura > 0);
  const moraleMult = hasHome ? 0.35 : (gs.hasCampfire && gs.campfireDura > 0) ? 0.6 : 1.0;
  gs.morale     = clamp(gs.morale     - STAT_DECAY.morale * moraleMult, 0, gs.maxMorale);
  gs.fatigue    = clamp(gs.fatigue     + STAT_DECAY.fatigue,   0, 100);

  // 계절 체온
  if (sm.tempDecay < 0) gs.temperature = clamp(gs.temperature + sm.tempDecay, 0, 100);
  if (sm.tempRise > 0 && gs.temperature < 85)
    gs.temperature = clamp(gs.temperature + sm.tempRise, 0, 100);

  // 캠프파이어 효과 (체온 55 이상 또는 여름이면 가열 안 함)
  if (gs.hasCampfire && gs.campfireDura > 0) {
    const season = getSeason(gs.day);
    const heatCap = (season === 'summer') ? 45 : 55;
    if (gs.temperature < heatCap) gs.temperature = clamp(gs.temperature + 2, 0, heatCap);
    gs.campfireDura -= 0.5;
    if (gs.campfireDura <= 0) gs.hasCampfire = false;
  }

  // 여름 그늘 찾기 (체온 > 70이면 자연 냉각 가속)
  if (gs.temperature > 70) {
    gs.temperature = clamp(gs.temperature - 0.5, 0, 100);
  }

  // 텃밭 효과 (영양 감소를 완전 상쇄 + 사기 소폭 회복)
  if (gs.hasGarden && gs.gardenDura > 0) {
    gs.nutrition = clamp(gs.nutrition + 0.55, 0, gs.maxNutrition);
    gs.morale = clamp(gs.morale + 0.05, 0, gs.maxMorale); // 텃밭 돌보기 = 정서 안정
    gs.gardenDura -= 0.3;
    if (gs.gardenDura <= 0) gs.hasGarden = false;
  }

  // 체온 → 사기 영향
  if (gs.temperature < 10)      gs.morale = clamp(gs.morale - 2, 0, 100);
  else if (gs.temperature < 20) gs.morale = clamp(gs.morale - 1, 0, 100);
  if (gs.temperature > 80)      gs.morale = clamp(gs.morale - 1, 0, 100);

  // 열사병 추가 탈수
  if (gs.temperature > 85) gs.hydration = clamp(gs.hydration - 3, 0, gs.maxHydration);

  // 극한 추위 탈수
  if (gs.temperature <= 0) gs.hydration = clamp(gs.hydration - 5, 0, gs.maxHydration);

  // 스태미나 자연 회복
  gs.stamina = clamp(gs.stamina + 1.2, 0, gs.maxStamina);

  // 소음 자연 감소
  gs.noise = clamp(gs.noise - 1.0, 0, 100);

  // 비 수집 (매 TP마다 확률적)
  checkRainCollection(gs);

  // 질병 진행
  progressDiseases(gs);

  // 절망 추적
  if (gs.morale <= 0) {
    gs.despairTicks++;
    if (gs.despairTicks >= 48) { kill(gs, '절망 (사기 0 지속)'); return; }
  } else {
    gs.despairTicks = 0;
  }

  // 사망 체크
  if (gs.hp <= 0)            kill(gs, '부상 과다');
  if (gs.hydration <= 0)     kill(gs, '탈수');
  if (gs.nutrition <= 0)     kill(gs, '아사');
  if (gs.radiation >= 100)   kill(gs, '방사선 중독');
  if (gs.infection >= 100)   kill(gs, '감염 쇼크');
  if (gs.fatigue >= 100) {
    gs.fatigue = 95; // 붕괴 → 강제 휴식 (간소화)
  }
}

function kill(gs, cause) {
  if (!gs.alive) return;
  gs.alive = false;
  gs.deathCause = cause;
}

// ─── 질병 시스템 (간소화) ──────────────────────────────────
const DISEASE_DEFS = {
  common_cold:        { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 0.3, moraleDrain: 0.3, hpDrain: 0 },
  influenza:          { fatal: true,  fatalDays: 10,   hydDrain: 1.5, nutDrain: 0, fatGain: 0.5, moraleDrain: 1.0, hpDrain: 0.3 },
  dysentery:          { fatal: true,  fatalDays: 8,    hydDrain: 2.5, nutDrain: 0.8, fatGain: 0, moraleDrain: 0, hpDrain: 0.5 },
  cholera:            { fatal: true,  fatalDays: 5,    hydDrain: 5.0, nutDrain: 0, fatGain: 0, moraleDrain: 0, hpDrain: 2.0 },
  hypothermia:        { fatal: true,  fatalDays: 7,    hydDrain: 0, nutDrain: 0, fatGain: 1.0, moraleDrain: 1.0, hpDrain: 0.5 },
  heatstroke:         { fatal: true,  fatalDays: 4,    hydDrain: 2.5, nutDrain: 0, fatGain: 0, moraleDrain: 2.0, hpDrain: 1.0 },
  sepsis:             { fatal: true,  fatalDays: 4,    hydDrain: 0, nutDrain: 0, fatGain: 1.5, moraleDrain: 1.5, hpDrain: 3.0 },
  radiation_sickness: { fatal: true,  fatalDays: 10,   hydDrain: 0, nutDrain: 0.5, fatGain: 0, moraleDrain: 0.5, hpDrain: 1.0 },
};

function progressDiseases(gs) {
  const toRemove = [];
  for (const d of gs.diseases) {
    const def = DISEASE_DEFS[d.id];
    if (!def) { toRemove.push(d.id); continue; }
    d.tpElapsed++;

    // 증상 적용
    gs.hydration  = clamp(gs.hydration  - def.hydDrain,    0, gs.maxHydration);
    gs.nutrition  = clamp(gs.nutrition  - def.nutDrain,    0, gs.maxNutrition);
    gs.fatigue    = clamp(gs.fatigue    + def.fatGain,     0, 100);
    gs.morale     = clamp(gs.morale    - def.moraleDrain, 0, gs.maxMorale);
    gs.hp         = clamp(gs.hp        + (-def.hpDrain),   0, gs.maxHp);

    // 자연 치유 (체온 기반)
    if (d.id === 'hypothermia' && gs.temperature > 45) { toRemove.push(d.id); continue; }
    if (d.id === 'heatstroke'  && gs.temperature < 60) { toRemove.push(d.id); continue; }

    // 치명 사망
    if (def.fatal && d.fatalTp && d.tpElapsed >= d.fatalTp) {
      kill(gs, `질병: ${d.id}`);
      return;
    }
  }
  gs.diseases = gs.diseases.filter(d => !toRemove.includes(d.id));
}

function contractDisease(gs, diseaseId) {
  if (gs.diseases.some(d => d.id === diseaseId)) return;
  const def = DISEASE_DEFS[diseaseId];
  if (!def) return;
  const fatalTp = def.fatalDays ? def.fatalDays * TP_PER_DAY : null;
  gs.diseases.push({ id: diseaseId, tpElapsed: 0, fatalTp });
}

function checkEnvironmentDisease(gs) {
  const sm = SEASON_MODS[getSeason(gs.day)];
  const mult = sm.infectionMult;

  // 감기 (체온 < 30)
  if (gs.temperature < 30 && !gs.diseases.some(d => d.id === 'common_cold' || d.id === 'influenza')) {
    if (Math.random() < 0.002 * mult) contractDisease(gs, 'common_cold');
  }
  // 독감 (감염 > 30)
  if (gs.infection > 30 && !gs.diseases.some(d => d.id === 'influenza' || d.id === 'common_cold')) {
    if (Math.random() < 0.002 * mult) contractDisease(gs, 'influenza');
  }
  // 방사선 질환 (방사선 > 60)
  if (gs.radiation > 60 && !gs.diseases.some(d => d.id === 'radiation_sickness')) {
    if (Math.random() < 0.003 * mult) contractDisease(gs, 'radiation_sickness');
  }
  // 저체온증 (체온 < 20 연속 96TP → 간소화: 체온 < 10이면 2% 확률)
  if (gs.temperature < 10 && !gs.diseases.some(d => d.id === 'hypothermia')) {
    if (Math.random() < 0.02) contractDisease(gs, 'hypothermia');
  }
  // 열사병 (체온 > 85이면 2% 확률)
  if (gs.temperature > 85 && !gs.diseases.some(d => d.id === 'heatstroke')) {
    if (Math.random() < 0.02) contractDisease(gs, 'heatstroke');
  }
}

// ─── 전투 시스템 (간소화) ──────────────────────────────────
function simulateCombat(gs, enemies) {
  gs.combatCount++;
  // 도주 시도: 무기 없으면 80%, 있으면 65%, 체력 낮으면 +10%
  const hasWeapon = gs.inv.knife > 0 || gs.inv.crowbar > 0;
  let fleeChance = hasWeapon ? 0.65 : 0.80;
  if (gs.hp < gs.maxHp * 0.5) fleeChance += 0.10;
  if (Math.random() < fleeChance) {
    gs.fleeCount++;
    gs.fatigue = clamp(gs.fatigue + 10, 0, 100);
    gs.noise = clamp(gs.noise + 10, 0, 100);
    return 'fled';
  }

  // 전투 시뮬레이션
  const pDmg = hasWeapon ? [8, 15] : [3, 7];
  const pAcc = 0.70;

  let round = 0;
  const maxRounds = 20;
  const aliveEnemies = enemies.map(e => ({ ...e }));

  while (aliveEnemies.length > 0 && gs.alive && round < maxRounds) {
    round++;
    // 플레이어 공격
    const target = aliveEnemies[0];
    if (Math.random() < pAcc) {
      const dmg = rand(pDmg[0], pDmg[1]);
      target.hp -= dmg;
      if (target.hp <= 0) {
        aliveEnemies.shift();
        gs.totalKills++;
      }
    }

    // 적 공격
    for (const enemy of aliveEnemies) {
      if (Math.random() < enemy.acc) {
        const dmg = rand(enemy.dmg[0], enemy.dmg[1]);
        gs.hp -= dmg;
        // 감염 확률
        if (Math.random() < 0.20) gs.infection = clamp(gs.infection + 5, 0, 100);
        if (gs.hp <= 0) { kill(gs, '전투 중 부상'); return 'defeat'; }
      }
    }
  }

  if (aliveEnemies.length === 0) {
    gs.noise = clamp(gs.noise + 15, 0, 100);
    return 'victory';
  }
  // 라운드 초과 → 도주 처리
  gs.fleeCount++;
  return 'fled';
}

// ─── 탐색 ─────────────────────────────────────────────────
function explore(gs, districtId) {
  const d = DISTRICTS[districtId];
  if (!d) return;

  const season = getSeason(gs.day);
  const sm = SEASON_MODS[season];

  // TP 소비 (탐색 1TP)
  advanceTP(gs);
  if (!gs.alive) return;

  // 스태미나 소모
  gs.stamina = clamp(gs.stamina - 5, 0, gs.maxStamina);

  // 소음
  gs.noise = clamp(gs.noise + 3, 0, 100);

  // 방사선
  if (d.rad > 0) gs.radiation = clamp(gs.radiation + d.rad, 0, 100);

  // 조우 체크
  const encounterChance = d.enc * sm.encounterMult;
  if (encounterChance > 0 && Math.random() < encounterChance) {
    const enemies = rollEnemyGroup(d.dl, gs.noise);
    const result = simulateCombat(gs, enemies);
    if (!gs.alive) return;
    if (result === 'fled') return; // 도주 시 루팅 없음
  }

  // 첫 방문만 루팅
  if (!gs.districtsLooted.has(districtId)) {
    gs.districtsLooted.add(districtId);
    // 루팅 아이템 (2~5개, 간소화)
    const lootCount = rand(2, 5);
    gs.inv.canned_food += Math.max(d.food > 0 ? 1 : 0, Math.floor(d.food * lootCount / 3));
    gs.inv.water_bottle += Math.max(d.water > 0 ? 1 : 0, Math.floor(d.water * lootCount / 2));
    gs.inv.scrap_metal += Math.max(d.metal > 0 ? 1 : 0, Math.floor(d.metal * lootCount / 3));
    gs.inv.cloth += Math.max(d.cloth > 0 ? 1 : 0, Math.floor(d.cloth * lootCount / 3));
    gs.inv.rope += Math.max(d.rope > 0 ? 1 : 0, Math.floor(d.rope * lootCount / 3));
    gs.inv.wood += Math.max(d.wood > 0 ? 1 : 0, Math.floor(d.wood * lootCount / 3));
    gs.inv.bandage += Math.max(d.medical > 0 ? 1 : 0, Math.floor(d.medical * lootCount / 5));
    gs.inv.first_aid_kit += (d.medical >= 2 && Math.random() < 0.3) ? 1 : 0;

    // 오염수 (강·웅덩이 — 대부분 지역에서 발견)
    if (Math.random() < 0.4) {
      gs.inv.contaminated_water += rand(1, 2);
    }
    // 무기 (금속 지역이나 위험 지역에서 확률적 획득)
    if (d.metal >= 2 && Math.random() < 0.30) {
      gs.inv.crowbar++;
    } else if (d.dl >= 3 && Math.random() < 0.20) {
      gs.inv.knife++;
    }

    // 계절 보너스
    if (season === 'autumn') {
      gs.inv.canned_food += rand(0, 2);
      gs.inv.energy_bar += rand(0, 1);
    }
    if (season === 'winter') gs.inv.wood += rand(0, 2);
    if (season === 'spring') gs.inv.bandage += (Math.random() < 0.25 ? 1 : 0);

    // 신규 원재료
    if (d.metal >= 2 && Math.random() < 0.15) gs.inv.circuit_board++;
    if (Math.random() < 0.20) gs.inv.sand += rand(1, 2);
    if (d.food >= 1 && Math.random() < 0.15) gs.inv.wild_wheat += rand(1, 2);
    if (d.food >= 1 && Math.random() < 0.20) gs.inv.worm += rand(1, 2);

    // 탐색 성공 → 사기 회복
    gs.morale = clamp(gs.morale + 8, 0, gs.maxMorale);

    // 위안거리 발견 (책, 음악, 사진 등 — 15% 확률)
    if (Math.random() < 0.15) {
      gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    }
  }
}

// ─── 이동 ─────────────────────────────────────────────────
function travel(gs, districtId) {
  // 2TP 소비
  advanceTP(gs); if (!gs.alive) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.stamina = clamp(gs.stamina - 10, 0, gs.maxStamina);
  gs.currentDistrict = districtId;
  gs.districtsVisited.add(districtId);
  const d = DISTRICTS[districtId];
  if (d.rad > 0) gs.radiation = clamp(gs.radiation + d.rad, 0, 100);
}

// ─── 제작 ─────────────────────────────────────────────────
function tryCraftCampfire(gs) {
  if (gs.hasCampfire && gs.campfireDura > 0) return false;
  if (gs.inv.scrap_metal >= 1 && gs.inv.cloth >= 1) {
    gs.inv.scrap_metal--; gs.inv.cloth--;
    gs.hasCampfire = true; gs.campfireDura = 50;
    gs.morale = clamp(gs.morale + 8, 0, gs.maxMorale); // 제작 성공 사기 회복
    advanceTP(gs); // 1 TP
    return true;
  }
  return false;
}

function tryCraftGarden(gs) {
  if (gs.hasGarden && gs.gardenDura > 0) return false;
  if (gs.inv.wood >= 3 && gs.inv.rope >= 1 && gs.inv.cloth >= 2) {
    gs.inv.wood -= 3; gs.inv.rope--; gs.inv.cloth -= 2;
    gs.hasGarden = true; gs.gardenDura = 192; // ~4일 유지
    gs.morale = clamp(gs.morale + 12, 0, gs.maxMorale); // 텃밭 제작 사기 회복
    // 5 TP 소비
    for (let i = 0; i < 5; i++) { advanceTP(gs); if (!gs.alive) return true; }
    return true;
  }
  return false;
}

function tryRefuelCampfire(gs) {
  if (!gs.hasCampfire) return false;
  if (gs.campfireDura > 10) return false;
  if (gs.inv.wood >= 1) {
    gs.inv.wood--;
    gs.campfireDura = clamp(gs.campfireDura + 30, 0, 80);
    return true;
  }
  return false;
}

function tryReplantGarden(gs) {
  if (gs.hasGarden && gs.gardenDura > 0) return false;
  // 재식: 나무 2개만 (씨앗은 이전 텃밭에서 회수)
  if (gs.inv.wood >= 2) {
    gs.inv.wood -= 2;
    gs.hasGarden = true; gs.gardenDura = 192;
    for (let i = 0; i < 3; i++) { advanceTP(gs); if (!gs.alive) return true; }
    return true;
  }
  return false;
}

// ─── 소비 ─────────────────────────────────────────────────
function consumeFood(gs) {
  if (gs.inv.canned_food > 0) {
    gs.inv.canned_food--;
    gs.nutrition = clamp(gs.nutrition + 30, 0, gs.maxNutrition);
    gs.hydration = clamp(gs.hydration + 10, 0, gs.maxHydration);
    gs.morale    = clamp(gs.morale + 3, 0, gs.maxMorale);
    return true;
  }
  if (gs.inv.energy_bar > 0) {
    gs.inv.energy_bar--;
    gs.nutrition = clamp(gs.nutrition + 20, 0, gs.maxNutrition);
    gs.morale    = clamp(gs.morale + 2, 0, gs.maxMorale);
    return true;
  }
  if (gs.inv.meat_stew > 0) {
    gs.inv.meat_stew--;
    gs.nutrition = clamp(gs.nutrition + 35, 0, gs.maxNutrition);
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    return true;
  }
  if (gs.inv.preserved_ration > 0) {
    gs.inv.preserved_ration--;
    gs.nutrition = clamp(gs.nutrition + 40, 0, gs.maxNutrition);
    return true;
  }
  if (gs.inv.rice > 0) {
    gs.inv.rice--;
    gs.nutrition = clamp(gs.nutrition + 10, 0, gs.maxNutrition);
    gs.morale    = clamp(gs.morale + 1, 0, gs.maxMorale);
    return true;
  }
  return false;
}

function consumeWater(gs) {
  if (gs.inv.water_bottle > 0) {
    gs.inv.water_bottle--;
    gs.hydration = clamp(gs.hydration + 80, 0, gs.maxHydration);
    gs.morale    = clamp(gs.morale + 2, 0, gs.maxMorale);
    return true;
  }
  if (gs.inv.purified_water > 0) {
    gs.inv.purified_water--;
    gs.hydration = clamp(gs.hydration + 90, 0, gs.maxHydration);
    gs.morale    = clamp(gs.morale + 2, 0, gs.maxMorale);
    return true;
  }
  if (gs.inv.boiled_water > 0) {
    gs.inv.boiled_water--;
    gs.hydration = clamp(gs.hydration + 65, 0, gs.maxHydration);
    gs.morale    = clamp(gs.morale + 1, 0, gs.maxMorale);
    return true;
  }
  if (gs.inv.contaminated_water > 0) {
    gs.inv.contaminated_water--;
    gs.hydration = clamp(gs.hydration + 60, 0, gs.maxHydration);
    gs.radiation = clamp(gs.radiation + 10, 0, 100);
    gs.infection = clamp(gs.infection + 15, 0, 100);
    return true;
  }
  return false;
}

function consumeMedical(gs) {
  // 치료 우선순위: 항생제 > 구급키트 > 붕대 > 소독약 > 진통제
  if (gs.infection > 50 && gs.inv.antibiotics > 0) {
    gs.inv.antibiotics--;
    gs.infection = clamp(gs.infection - 45, 0, 100);
    // 질병 치료
    gs.diseases = gs.diseases.filter(d => !['influenza','dysentery','cholera','sepsis'].includes(d.id));
    return true;
  }
  if (gs.hp < gs.maxHp * 0.4 && gs.inv.first_aid_kit > 0) {
    gs.inv.first_aid_kit--;
    gs.hp = clamp(gs.hp + 75, 0, gs.maxHp); // 50 * 1.5 healBonus
    gs.infection = clamp(gs.infection - 30, 0, 100);
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    return true;
  }
  if (gs.hp < gs.maxHp * 0.6 && gs.inv.bandage > 0) {
    gs.inv.bandage--;
    gs.hp = clamp(gs.hp + 28, 0, gs.maxHp); // (15+5) * 1.5 - 약간 반올림
    gs.infection = clamp(gs.infection - 5, 0, 100);
    return true;
  }
  if (gs.infection > 30 && gs.inv.antiseptic > 0) {
    gs.inv.antiseptic--;
    gs.infection = clamp(gs.infection - 20, 0, 100);
    return true;
  }
  if (gs.inv.crude_medicine > 0) {
    gs.inv.crude_medicine--;
    gs.hp = clamp(gs.hp + 15, 0, gs.maxHp);
    gs.infection = clamp(gs.infection - 10, 0, 100);
    return true;
  }
  if (gs.fatigue > 70 && gs.inv.painkiller > 0) {
    gs.inv.painkiller--;
    gs.hp = clamp(gs.hp + 15, 0, gs.maxHp);
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    gs.fatigue = clamp(gs.fatigue - 10, 0, 100);
    return true;
  }
  return false;
}

// ─── 물 끓이기 (캠프파이어 필요, 오염수 → 끓인물) ────────
function tryBoilWater(gs) {
  if (!gs.hasCampfire || gs.campfireDura <= 0) return false;
  if (gs.inv.contaminated_water <= 0) return false;
  gs.inv.contaminated_water--;
  gs.inv.boiled_water++;
  advanceTP(gs); // 1TP
  return true;
}

// ─── 비 수집 (봄·여름에 확률적 수분 회복) ─────────────────
function checkRainCollection(gs) {
  const season = getSeason(gs.day);
  // 봄: 12% 확률 (+35 수분), 여름: 15% (장마 + 소나기)
  if (season === 'spring' && Math.random() < 0.12) {
    gs.hydration = clamp(gs.hydration + 35, 0, gs.maxHydration);
  }
  if (season === 'summer' && Math.random() < 0.15) {
    gs.hydration = clamp(gs.hydration + 40, 0, gs.maxHydration);
  }
  // 가을: 8% 확률
  if (season === 'autumn' && Math.random() < 0.08) {
    gs.hydration = clamp(gs.hydration + 25, 0, gs.maxHydration);
  }
}

// ─── 채집 (벌레·열매·야생풀 — 2 TP) ──────────────────────
function forage(gs) {
  advanceTP(gs); if (!gs.alive) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.stamina = clamp(gs.stamina - 5, 0, gs.maxStamina);
  // 소량 영양 직접 회복 + 자연 속 채집 = 사기 회복 (생존 활동 = 목적의식)
  gs.nutrition = clamp(gs.nutrition + rand(3, 8), 0, gs.maxNutrition);
  gs.morale = clamp(gs.morale + 5, 0, gs.maxMorale);
  // 봄·여름엔 더 많이 채집 가능
  const season = getSeason(gs.day);
  if (season === 'spring' || season === 'summer') {
    gs.nutrition = clamp(gs.nutrition + rand(2, 5), 0, gs.maxNutrition);
  }
}

// ─── 나무 수집 (공원·건물 해체 — 2 TP) ────────────────────
function scavengeWood(gs) {
  advanceTP(gs); if (!gs.alive) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.stamina = clamp(gs.stamina - 8, 0, gs.maxStamina);
  gs.noise = clamp(gs.noise + 5, 0, 100);
  // 나무 1~2개 획득 (공원, 가구 해체 등)
  gs.inv.wood += rand(1, 2);
  // 25% 확률로 로프도 획득
  if (Math.random() < 0.25) gs.inv.rope++;
}

// ─── 휴식 (8 TP = 2시간) ─────────────────────────────────
function rest(gs) {
  // 캠프파이어/텃밭 있으면 안정감 보너스
  const shelterBonus = (gs.hasCampfire && gs.campfireDura > 0) ? 0.5 : 0;
  const gardenBonus  = (gs.hasGarden && gs.gardenDura > 0) ? 0.3 : 0;
  for (let i = 0; i < 8; i++) {
    advanceTP(gs);
    if (!gs.alive) return;
    gs.fatigue = clamp(gs.fatigue - 3, 0, 100);
    gs.hp      = clamp(gs.hp + 0.5, 0, gs.maxHp);
    gs.morale  = clamp(gs.morale + 0.5 + shelterBonus + gardenBonus, 0, gs.maxMorale);
    // 휴식 중 비 수집
    checkRainCollection(gs);
  }
}

// ─────────────────────────────────────────────────────────────
//  AI 전략 — 한 "턴" (대략 6~12 TP 사용)
// ─────────────────────────────────────────────────────────────
function aiTurn(gs) {
  // 0) 질병 체크 (매 턴)
  checkEnvironmentDisease(gs);

  // 1) 위급 소비 — 수분은 1일 치(144) 이하면 즉시 음용
  if (gs.hydration < 150) consumeWater(gs);
  if (gs.nutrition < 40)  consumeFood(gs);
  if (gs.hp < gs.maxHp * 0.5) consumeMedical(gs);
  if (gs.infection > 40)  consumeMedical(gs);

  // 1.5) 사기 관리 — 사기가 낮으면 음식/물 먹어서 사기 회복
  if (gs.morale < 40) {
    if (gs.inv.canned_food > 2 || gs.inv.energy_bar > 1) consumeFood(gs);
    if (gs.inv.water_bottle > 1 || gs.inv.boiled_water > 1) consumeWater(gs);
  }

  // 2) 피로 높으면 휴식
  if (gs.fatigue > 75 || gs.stamina < 15) {
    rest(gs);
    return;
  }

  // 2.5) 물 끓이기 (캠프파이어 있고 오염수 있으면)
  if (gs.inv.contaminated_water > 0 && gs.hasCampfire && gs.campfireDura > 0) {
    tryBoilWater(gs);
    if (!gs.alive) return;
  }

  // 3) 제작 우선순위
  if (!gs.hasCampfire || gs.campfireDura <= 0) {
    if (tryCraftCampfire(gs)) return;
  }
  if (!gs.hasGarden || gs.gardenDura <= 0) {
    if (tryCraftGarden(gs)) return;
    if (tryReplantGarden(gs)) return;
    // 재료 부족 시 나무 수집
    if (gs.inv.wood < 3 && gs.stamina > 20) {
      scavengeWood(gs);
      return;
    }
  }
  tryRefuelCampfire(gs);
  // 텃밭 내구도 낮으면 미리 나무 수집
  if (gs.hasGarden && gs.gardenDura < 30 && gs.inv.wood < 2 && gs.stamina > 20) {
    scavengeWood(gs);
    return;
  }
  // 캠프파이어 연료 부족 시 나무 수집
  if (gs.hasCampfire && gs.campfireDura < 15 && gs.inv.wood < 1 && gs.stamina > 20) {
    scavengeWood(gs);
    return;
  }

  // 4) 탐색 전략: 수분 부족 시 물 있는 구 우선, 그 외 안전한 미방문 인접 구
  const adj = DISTRICTS[gs.currentDistrict]?.adj ?? [];
  const unlooted = adj.filter(id => !gs.districtsLooted.has(id));

  // 수분 부족 시 물 있는 구 최우선
  const needWater = gs.hydration < 180 && gs.inv.water_bottle <= 1;

  // 위험도 기준 정렬 (낮은 위험 우선, 방사선 회피, 수분 부족 시 물 가중치)
  const sortedTargets = unlooted
    .map(id => ({ id, ...DISTRICTS[id] }))
    .filter(d => d.dl <= 2 && d.rad === 0) // 위험도 2 이하, 방사선 없는 곳만
    .sort((a, b) => {
      if (needWater) return (b.water - a.water) || (a.enc - b.enc);
      return a.enc - b.enc;
    });

  if (sortedTargets.length > 0 && gs.stamina > 25) {
    const target = sortedTargets[0];
    travel(gs, target.id);
    if (!gs.alive) return;
    explore(gs, target.id);
    return;
  }

  // dl 3까지 확장 (수분/식량 위급 시, 방사선 회피)
  const midRiskTargets = unlooted
    .map(id => ({ id, ...DISTRICTS[id] }))
    .filter(d => d.dl <= 3 && d.rad === 0)
    .sort((a, b) => {
      if (needWater) return (b.water - a.water) || (a.dl - b.dl);
      return a.dl - b.dl;
    });

  if (midRiskTargets.length > 0 && gs.hp > 50 && gs.stamina > 25) {
    const target = midRiskTargets[0];
    travel(gs, target.id);
    if (!gs.alive) return;
    explore(gs, target.id);
    return;
  }

  // 위험한 곳도 루팅 안 된 곳이면 (HP 충분 시, 방사선 회피)
  const riskyTargets = unlooted
    .map(id => ({ id, ...DISTRICTS[id] }))
    .filter(d => d.rad === 0)
    .sort((a, b) => a.dl - b.dl);

  if (riskyTargets.length > 0 && gs.hp > 60 && gs.stamina > 30) {
    const target = riskyTargets[0];
    travel(gs, target.id);
    if (!gs.alive) return;
    explore(gs, target.id);
    return;
  }

  // 5) 모든 인접 구 루팅 완료 → 다른 구로 이동 시도 (방사선 회피)
  const allUnlooted = Object.keys(DISTRICTS).filter(id => !gs.districtsLooted.has(id) && (DISTRICTS[id].rad ?? 0) === 0);
  if (allUnlooted.length > 0 && gs.stamina > 30 && gs.hp > 50) {
    // BFS로 가장 가까운 미루팅 구 찾기
    const path = bfsPath(gs.currentDistrict, allUnlooted);
    if (path.length > 1) {
      travel(gs, path[1]); // 한 칸만 이동
      if (!gs.alive) return;
      if (gs.districtsLooted.has(path[1])) return;
      explore(gs, path[1]);
      return;
    }
  }

  // 6) 영양 위험 시 채집
  if (gs.nutrition < 30 && gs.inv.canned_food === 0 && gs.inv.energy_bar === 0 && gs.stamina > 15) {
    forage(gs);
    return;
  }

  // 7) 사기 관리: 채집/산책으로 사기 유지 (활동적 생존 = 사기 유지)
  if (gs.morale < 50 && gs.stamina > 20) {
    forage(gs);
    return;
  }

  // 8) 할 게 없으면 대기 (휴식)
  rest(gs);
}

function bfsPath(from, targetSet) {
  const targets = new Set(targetSet);
  const visited = new Set([from]);
  const queue = [[from]];
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (targets.has(node) && node !== from) return path;
    for (const neighbor of (DISTRICTS[node]?.adj ?? [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return [from];
}

// ─────────────────────────────────────────────────────────────
//  단일 게임 실행
// ─────────────────────────────────────────────────────────────
function runOneGame(runId) {
  const gs = createGameState();
  const events = [];

  // 초기 탐색 (시작 지역)
  explore(gs, 'dongjak');

  let lastLogDay = 0;

  while (gs.alive && gs.totalTP < TARGET_TP) {
    const dayBefore = gs.day;
    aiTurn(gs);

    // 주요 이벤트 기록 (일 단위)
    if (gs.day !== lastLogDay) {
      lastLogDay = gs.day;
      if (gs.day % 10 === 0 || gs.day === 1) {
        events.push({
          day: gs.day,
          hp: Math.round(gs.hp),
          hyd: Math.round(gs.hydration),
          nut: Math.round(gs.nutrition),
          temp: Math.round(gs.temperature),
          mor: Math.round(gs.morale),
          fat: Math.round(gs.fatigue),
          rad: Math.round(gs.radiation),
          inf: Math.round(gs.infection),
          loc: gs.currentDistrict,
          looted: gs.districtsLooted.size,
          campfire: gs.hasCampfire,
          garden: gs.hasGarden,
          diseases: gs.diseases.map(d => d.id).join(',') || 'none',
        });
      }
    }
  }

  const survived = gs.alive && gs.totalTP >= TARGET_TP;
  return {
    runId,
    survived,
    dayReached: gs.day,
    deathCause: gs.deathCause,
    totalKills: gs.totalKills,
    combatCount: gs.combatCount,
    fleeCount: gs.fleeCount,
    districtsLooted: gs.districtsLooted.size,
    hadGarden: gs.hasGarden || gs.gardenDura > 0 || gs.inv.wood >= 2,
    hadCampfire: gs.hasCampfire || gs.campfireDura > 0,
    finalHp: Math.round(gs.hp),
    finalNutrition: Math.round(gs.nutrition),
    finalHydration: Math.round(gs.hydration),
    events,
  };
}

// ─────────────────────────────────────────────────────────────
//  메인: 100회 실행 + 로그 생성
// ─────────────────────────────────────────────────────────────
console.log('=== 100일 생존 시뮬레이션 시작 (이지수 · 의사) ===');
console.log(`목표: ${TARGET_DAYS}일 생존, ${NUM_RUNS}회 반복\n`);

const results = [];
for (let i = 1; i <= NUM_RUNS; i++) {
  const r = runOneGame(i);
  results.push(r);
  const status = r.survived ? '✅ 생존' : `💀 ${r.deathCause} (${r.dayReached}일)`;
  process.stdout.write(`  [${String(i).padStart(3)}/${NUM_RUNS}] ${status}\r`);
}
console.log('');

// ── 통계 ────────────────────────────────────────────────────
const survived  = results.filter(r => r.survived);
const deaths    = results.filter(r => !r.survived);
const avgDay    = (results.reduce((s, r) => s + r.dayReached, 0) / NUM_RUNS).toFixed(1);
const survRate  = ((survived.length / NUM_RUNS) * 100).toFixed(1);

const deathCauses = {};
for (const d of deaths) {
  deathCauses[d.deathCause] = (deathCauses[d.deathCause] ?? 0) + 1;
}

// ── 텍스트 로그 작성 ────────────────────────────────────────
const lines = [];
lines.push('╔══════════════════════════════════════════════════════════════╗');
lines.push('║   100일 생존 시뮬레이션 결과 (이지수 · 의사)               ║');
lines.push('╚══════════════════════════════════════════════════════════════╝');
lines.push('');
lines.push(`실행 횟수:     ${NUM_RUNS}회`);
lines.push(`생존 성공:     ${survived.length}회 (${survRate}%)`);
lines.push(`사망:          ${deaths.length}회`);
lines.push(`평균 생존일:   ${avgDay}일`);
lines.push('');

if (survived.length > 0) {
  const avgKills  = (survived.reduce((s, r) => s + r.totalKills, 0) / survived.length).toFixed(1);
  const avgLooted = (survived.reduce((s, r) => s + r.districtsLooted, 0) / survived.length).toFixed(1);
  lines.push('── 생존 성공 통계 ──');
  lines.push(`  평균 처치:        ${avgKills}마리`);
  lines.push(`  평균 루팅 구역:   ${avgLooted}개`);
  lines.push('');
}

lines.push('── 사망 원인 분석 ──');
const sortedCauses = Object.entries(deathCauses).sort((a, b) => b[1] - a[1]);
for (const [cause, count] of sortedCauses) {
  const pct = ((count / NUM_RUNS) * 100).toFixed(1);
  lines.push(`  ${cause.padEnd(25)} ${String(count).padStart(3)}회 (${pct}%)`);
}
lines.push('');

// ── 생존 일수 분포 ──────────────────────────────────────────
lines.push('── 생존 일수 분포 ──');
const brackets = [
  [1,10], [11,20], [21,30], [31,40], [41,50],
  [51,60], [61,70], [71,80], [81,90], [91,100],
];
for (const [lo, hi] of brackets) {
  const count = results.filter(r => r.dayReached >= lo && r.dayReached <= hi).length;
  const bar = '█'.repeat(count);
  lines.push(`  ${String(lo).padStart(3)}-${String(hi).padStart(3)}일: ${String(count).padStart(3)}회 ${bar}`);
}
lines.push('');

// ── 개별 실행 요약 ──────────────────────────────────────────
lines.push('══════════════════════════════════════════════════════════════');
lines.push('  개별 실행 결과 (100회)');
lines.push('══════════════════════════════════════════════════════════════');
lines.push('');
lines.push(`${'#'.padStart(4)} ${'결과'.padEnd(6)} ${'일'.padStart(4)} ${'HP'.padStart(4)} ${'수분'.padStart(5)} ${'영양'.padStart(5)} ${'루팅'.padStart(4)} ${'킬'.padStart(4)} ${'전투'.padStart(4)} ${'사망 원인 / 상태'}`);
lines.push('─'.repeat(85));

for (const r of results) {
  const status = r.survived ? '생존' : '사망';
  const cause  = r.survived ? `HP${r.finalHp} 수분${r.finalHydration} 영양${r.finalNutrition}` : r.deathCause;
  lines.push(
    `${String(r.runId).padStart(4)} ` +
    `${status.padEnd(6)} ` +
    `${String(r.dayReached).padStart(4)} ` +
    `${String(r.finalHp).padStart(4)} ` +
    `${String(r.finalHydration).padStart(5)} ` +
    `${String(r.finalNutrition).padStart(5)} ` +
    `${String(r.districtsLooted).padStart(4)} ` +
    `${String(r.totalKills).padStart(4)} ` +
    `${String(r.combatCount).padStart(4)} ` +
    `${cause}`
  );
}
lines.push('');

// ── 상세 이벤트 로그 (처음 5회 + 마지막 5회) ─────────────
lines.push('══════════════════════════════════════════════════════════════');
lines.push('  상세 이벤트 로그 (10일 간격 스냅샷, 처음 5회 + 마지막 5회)');
lines.push('══════════════════════════════════════════════════════════════');

const detailRuns = [...results.slice(0, 5), ...results.slice(-5)];
for (const r of detailRuns) {
  lines.push('');
  lines.push(`── Run #${r.runId} [${r.survived ? '생존' : '사망: ' + r.deathCause}] ──`);
  lines.push(`${'Day'.padStart(5)} ${'HP'.padStart(4)} ${'수분'.padStart(5)} ${'영양'.padStart(5)} ${'체온'.padStart(5)} ${'사기'.padStart(5)} ${'피로'.padStart(5)} ${'방사'.padStart(5)} ${'감염'.padStart(5)} ${'위치'.padEnd(12)} ${'루팅'.padStart(4)} ${'캠프'.padStart(4)} ${'텃밭'.padStart(4)} ${'질병'}`);
  for (const e of r.events) {
    lines.push(
      `${String(e.day).padStart(5)} ` +
      `${String(e.hp).padStart(4)} ` +
      `${String(e.hyd).padStart(5)} ` +
      `${String(e.nut).padStart(5)} ` +
      `${String(e.temp).padStart(5)} ` +
      `${String(e.mor).padStart(5)} ` +
      `${String(e.fat).padStart(5)} ` +
      `${String(e.rad).padStart(5)} ` +
      `${String(e.inf).padStart(5)} ` +
      `${e.loc.padEnd(12)} ` +
      `${String(e.looted).padStart(4)} ` +
      `${(e.campfire ? 'Y' : 'N').padStart(4)} ` +
      `${(e.garden ? 'Y' : 'N').padStart(4)} ` +
      `${e.diseases}`
    );
  }
}

const output = lines.join('\n');
const outputPath = 'sim_result_100runs.txt';
writeFileSync(outputPath, output, 'utf-8');

console.log(`\n=== 결과 요약 ===`);
console.log(`생존율: ${survRate}% (${survived.length}/${NUM_RUNS})`);
console.log(`평균 생존일: ${avgDay}일`);
console.log(`\n사망 원인 TOP 5:`);
for (const [cause, count] of sortedCauses.slice(0, 5)) {
  console.log(`  ${cause}: ${count}회`);
}
console.log(`\n상세 로그 저장: ${outputPath}`);
