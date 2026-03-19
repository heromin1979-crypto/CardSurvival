#!/usr/bin/env node
// === 100일 생존 시뮬레이션 + 퀘스트 추적 (이지수 · 의사) ===
// node sim_jisu_quests.mjs

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

// ─── 구(District) 데이터 ──────────────────────────────────
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

// ─── 적 데이터 ────────────────────────────────────────────
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

// ─── 이지수 메인 퀘스트 정의 ───────────────────────────────
const DOCTOR_QUESTS = [
  {
    id: 'mq_doctor_01', title: '삼성병원 생존자', icon: '🏥',
    dayTrigger: 1, prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    deadlineDays: 10,
    reward: { morale: 5 },
  },
  {
    id: 'mq_doctor_02', title: '첫 번째 거점', icon: '🏗️',
    dayTrigger: 3, prerequisite: 'mq_doctor_01',
    objective: { type: 'craft_structure', count: 1 },
    deadlineDays: 15,
    reward: { morale: 5, bandage: 2 },
  },
  {
    id: 'mq_doctor_03', title: '무전의 신호', icon: '📻',
    dayTrigger: 7, prerequisite: 'mq_doctor_02',
    objective: { type: 'collect_clean_water', count: 5 },
    deadlineDays: 25,
    reward: { morale: 10 },
  },
  {
    id: 'mq_doctor_04', title: '여정의 준비', icon: '💊',
    dayTrigger: 12, prerequisite: 'mq_doctor_03',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 5 },
    deadlineDays: 35,
    reward: { morale: 5, first_aid_kit: 1 },
  },
  {
    id: 'mq_doctor_05', title: '세브란스 연구소', icon: '🔬',
    dayTrigger: 20, prerequisite: 'mq_doctor_04',
    objective: { type: 'visit_district', districtId: 'seodaemun' },
    deadlineDays: 60,
    reward: { morale: 15 },
  },
  {
    id: 'mq_doctor_06', title: '감염 패턴 분석', icon: '📊',
    dayTrigger: 35, prerequisite: 'mq_doctor_05',
    objective: { type: 'collect_item', definitionId: 'first_aid_kit', count: 3 },
    deadlineDays: 75,
    reward: { morale: 10 },
  },
  {
    id: 'mq_doctor_07', title: '구원의 주파수', icon: '📡',
    dayTrigger: 55, prerequisite: 'mq_doctor_06',
    objective: { type: 'visit_district', districtId: 'yeongdeungpo' },
    deadlineDays: 90,
    reward: { morale: 20 },
  },
  {
    id: 'mq_doctor_08', title: '100일의 기록', icon: '📖',
    dayTrigger: 70, prerequisite: 'mq_doctor_07',
    objective: { type: 'survive_days', count: 100 },
    deadlineDays: Infinity,
    reward: { morale: 25 },
  },
];

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

// BFS to specific single district
function bfsToDistrict(from, targetId) {
  if (from === targetId) return [from];
  const visited = new Set([from]);
  const queue = [[from]];
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (node === targetId) return path;
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
    stamina:     84,  maxStamina: 84,
    noise:       0,
    alive: true,
    deathCause: null,

    currentDistrict: 'dongjak',
    districtsLooted: new Set(),
    districtsVisited: new Set(['dongjak']),

    inv: {
      bandage: 2, antiseptic: 1, painkiller: 1,
      canned_food: 1, water_bottle: 2, energy_bar: 0, rice: 0,
      contaminated_water: 0, boiled_water: 0, purified_water: 0,
      wood: 0, rope: 0, cloth: 0, scrap_metal: 0, nail: 0,
      first_aid_kit: 0, antibiotics: 0,
      knife: 0, crowbar: 0,
    },

    hasCampfire: false,  campfireDura: 0,
    hasGarden:   false,  gardenDura:   0,

    // 제작 횟수 (퀘스트용)
    totalStructuresCrafted: 0,

    diseases: [],

    totalKills:   0,
    combatCount:  0,
    fleeCount:    0,

    despairTicks: 0,

    // ─── 퀘스트 상태 ───
    quests: {
      active:    [],  // [{ id, startDay, deadline, progress }]
      completed: [],  // [{ id, completedDay }]
      failed:    [],  // [{ id, failedDay, reason }]
    },

    log: [],
  };
}

// ─── 인벤토리 헬퍼 ────────────────────────────────────────
function countFood(gs) {
  return gs.inv.canned_food + gs.inv.energy_bar + gs.inv.rice;
}

function countCleanWater(gs) {
  return gs.inv.water_bottle + gs.inv.purified_water + gs.inv.boiled_water;
}

function countMedical(gs) {
  return gs.inv.bandage + gs.inv.antiseptic + gs.inv.painkiller +
         gs.inv.first_aid_kit + gs.inv.antibiotics;
}

// ─────────────────────────────────────────────────────────────
//  퀘스트 시스템
// ─────────────────────────────────────────────────────────────
function checkQuestTriggers(gs) {
  for (const qDef of DOCTOR_QUESTS) {
    // 이미 활성/완료/실패면 스킵
    if (gs.quests.active.find(q => q.id === qDef.id)) continue;
    if (gs.quests.completed.find(q => q.id === qDef.id)) continue;
    if (gs.quests.failed.find(q => q.id === qDef.id)) continue;

    // 날짜 조건
    if (gs.day < qDef.dayTrigger) continue;
    // 선행 퀘스트 조건
    if (qDef.prerequisite && !gs.quests.completed.find(q => q.id === qDef.prerequisite)) continue;

    // 활성화
    gs.quests.active.push({
      id: qDef.id,
      startDay: gs.day,
      deadline: qDef.deadlineDays === Infinity ? Infinity : gs.day + qDef.deadlineDays,
      progress: 0,
    });
  }
}

function checkQuestProgress(gs) {
  for (let i = gs.quests.active.length - 1; i >= 0; i--) {
    const q = gs.quests.active[i];
    const qDef = DOCTOR_QUESTS.find(d => d.id === q.id);
    if (!qDef) continue;

    // 기한 체크
    if (q.deadline !== Infinity && gs.day > q.deadline) {
      gs.quests.active.splice(i, 1);
      gs.quests.failed.push({ id: q.id, failedDay: gs.day, reason: '기한 만료' });
      gs.morale = clamp(gs.morale - 5, 0, gs.maxMorale);
      continue;
    }

    // 진행도 체크
    const obj = qDef.objective;
    let progress = 0;
    let target = obj.count ?? 1;

    switch (obj.type) {
      case 'collect_item_type':
        if (obj.itemType === 'food') progress = countFood(gs);
        else if (obj.itemType === 'medical') progress = countMedical(gs);
        break;
      case 'collect_clean_water':
        progress = countCleanWater(gs);
        break;
      case 'collect_item':
        progress = gs.inv[obj.definitionId] ?? 0;
        break;
      case 'craft_structure':
        progress = gs.totalStructuresCrafted;
        break;
      case 'visit_district':
        progress = gs.districtsVisited.has(obj.districtId) ? 1 : 0;
        target = 1;
        break;
      case 'survive_days':
        progress = gs.day;
        target = obj.count;
        break;
    }

    q.progress = Math.min(target, progress);

    // 완료 체크
    if (q.progress >= target) {
      gs.quests.active.splice(i, 1);
      gs.quests.completed.push({ id: q.id, completedDay: gs.day });

      // 보상 지급
      if (qDef.reward.morale) gs.morale = clamp(gs.morale + qDef.reward.morale, 0, gs.maxMorale);
      if (qDef.reward.bandage) gs.inv.bandage += qDef.reward.bandage;
      if (qDef.reward.first_aid_kit) gs.inv.first_aid_kit += qDef.reward.first_aid_kit;
    }
  }
}

// 현재 활성 퀘스트 중 방문해야 할 구역
function getQuestTargetDistrict(gs) {
  for (const q of gs.quests.active) {
    const qDef = DOCTOR_QUESTS.find(d => d.id === q.id);
    if (!qDef) continue;
    if (qDef.objective.type === 'visit_district') {
      const targetId = qDef.objective.districtId;
      if (!gs.districtsVisited.has(targetId)) return targetId;
    }
  }
  return null;
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
    gs.morale = clamp(gs.morale + 3, 0, gs.maxMorale);
  }

  const season = getSeason(gs.day);
  const sm = SEASON_MODS[season];

  gs.hydration  = clamp(gs.hydration  - STAT_DECAY.hydration * sm.hydrationMult, 0, gs.maxHydration);
  gs.nutrition  = clamp(gs.nutrition   - STAT_DECAY.nutrition, 0, gs.maxNutrition);
  const hasHome = (gs.hasCampfire && gs.campfireDura > 0) && (gs.hasGarden && gs.gardenDura > 0);
  const moraleMult = hasHome ? 0.35 : (gs.hasCampfire && gs.campfireDura > 0) ? 0.6 : 1.0;
  gs.morale     = clamp(gs.morale     - STAT_DECAY.morale * moraleMult, 0, gs.maxMorale);
  gs.fatigue    = clamp(gs.fatigue     + STAT_DECAY.fatigue,   0, 100);

  if (sm.tempDecay < 0) gs.temperature = clamp(gs.temperature + sm.tempDecay, 0, 100);
  if (sm.tempRise > 0 && gs.temperature < 85)
    gs.temperature = clamp(gs.temperature + sm.tempRise, 0, 100);

  if (gs.hasCampfire && gs.campfireDura > 0) {
    const s = getSeason(gs.day);
    const heatCap = (s === 'summer') ? 45 : 55;
    if (gs.temperature < heatCap) gs.temperature = clamp(gs.temperature + 2, 0, heatCap);
    gs.campfireDura -= 0.5;
    if (gs.campfireDura <= 0) gs.hasCampfire = false;
  }

  if (gs.temperature > 70) {
    gs.temperature = clamp(gs.temperature - 0.5, 0, 100);
  }

  if (gs.hasGarden && gs.gardenDura > 0) {
    gs.nutrition = clamp(gs.nutrition + 0.55, 0, gs.maxNutrition);
    gs.morale = clamp(gs.morale + 0.05, 0, gs.maxMorale);
    gs.gardenDura -= 0.3;
    if (gs.gardenDura <= 0) gs.hasGarden = false;
  }

  if (gs.temperature < 10)      gs.morale = clamp(gs.morale - 2, 0, 100);
  else if (gs.temperature < 20) gs.morale = clamp(gs.morale - 1, 0, 100);
  if (gs.temperature > 80)      gs.morale = clamp(gs.morale - 1, 0, 100);

  if (gs.temperature > 85) gs.hydration = clamp(gs.hydration - 3, 0, gs.maxHydration);
  if (gs.temperature <= 0) gs.hydration = clamp(gs.hydration - 5, 0, gs.maxHydration);

  gs.stamina = clamp(gs.stamina + 1.2, 0, gs.maxStamina);
  gs.noise = clamp(gs.noise - 1.0, 0, 100);

  checkRainCollection(gs);
  progressDiseases(gs);

  if (gs.morale <= 0) {
    gs.despairTicks++;
    if (gs.despairTicks >= 48) { kill(gs, '절망 (사기 0 지속)'); return; }
  } else {
    gs.despairTicks = 0;
  }

  if (gs.hp <= 0)            kill(gs, '부상 과다');
  if (gs.hydration <= 0)     kill(gs, '탈수');
  if (gs.nutrition <= 0)     kill(gs, '아사');
  if (gs.radiation >= 100)   kill(gs, '방사선 중독');
  if (gs.infection >= 100)   kill(gs, '감염 쇼크');
  if (gs.fatigue >= 100)     gs.fatigue = 95;
}

function kill(gs, cause) {
  if (!gs.alive) return;
  gs.alive = false;
  gs.deathCause = cause;
}

// ─── 질병 시스템 ──────────────────────────────────────────
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
    gs.hydration  = clamp(gs.hydration  - def.hydDrain,    0, gs.maxHydration);
    gs.nutrition  = clamp(gs.nutrition  - def.nutDrain,    0, gs.maxNutrition);
    gs.fatigue    = clamp(gs.fatigue    + def.fatGain,     0, 100);
    gs.morale     = clamp(gs.morale    - def.moraleDrain, 0, gs.maxMorale);
    gs.hp         = clamp(gs.hp        + (-def.hpDrain),   0, gs.maxHp);
    if (d.id === 'hypothermia' && gs.temperature > 45) { toRemove.push(d.id); continue; }
    if (d.id === 'heatstroke'  && gs.temperature < 60) { toRemove.push(d.id); continue; }
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
  if (gs.temperature < 30 && !gs.diseases.some(d => d.id === 'common_cold' || d.id === 'influenza')) {
    if (Math.random() < 0.002 * mult) contractDisease(gs, 'common_cold');
  }
  if (gs.infection > 30 && !gs.diseases.some(d => d.id === 'influenza' || d.id === 'common_cold')) {
    if (Math.random() < 0.002 * mult) contractDisease(gs, 'influenza');
  }
  if (gs.radiation > 60 && !gs.diseases.some(d => d.id === 'radiation_sickness')) {
    if (Math.random() < 0.003 * mult) contractDisease(gs, 'radiation_sickness');
  }
  if (gs.temperature < 10 && !gs.diseases.some(d => d.id === 'hypothermia')) {
    if (Math.random() < 0.02) contractDisease(gs, 'hypothermia');
  }
  if (gs.temperature > 85 && !gs.diseases.some(d => d.id === 'heatstroke')) {
    if (Math.random() < 0.02) contractDisease(gs, 'heatstroke');
  }
}

// ─── 전투 시스템 ──────────────────────────────────────────
function simulateCombat(gs, enemies) {
  gs.combatCount++;
  const hasWeapon = gs.inv.knife > 0 || gs.inv.crowbar > 0;
  let fleeChance = hasWeapon ? 0.65 : 0.80;
  if (gs.hp < gs.maxHp * 0.5) fleeChance += 0.10;
  if (Math.random() < fleeChance) {
    gs.fleeCount++;
    gs.fatigue = clamp(gs.fatigue + 10, 0, 100);
    gs.noise = clamp(gs.noise + 10, 0, 100);
    return 'fled';
  }

  const pDmg = hasWeapon ? [8, 15] : [3, 7];
  const pAcc = 0.70;
  let round = 0;
  const maxRounds = 20;
  const aliveEnemies = enemies.map(e => ({ ...e }));

  while (aliveEnemies.length > 0 && gs.alive && round < maxRounds) {
    round++;
    const target = aliveEnemies[0];
    if (Math.random() < pAcc) {
      const dmg = rand(pDmg[0], pDmg[1]);
      target.hp -= dmg;
      if (target.hp <= 0) {
        aliveEnemies.shift();
        gs.totalKills++;
      }
    }
    for (const enemy of aliveEnemies) {
      if (Math.random() < enemy.acc) {
        const dmg = rand(enemy.dmg[0], enemy.dmg[1]);
        gs.hp -= dmg;
        if (Math.random() < 0.20) gs.infection = clamp(gs.infection + 5, 0, 100);
        if (gs.hp <= 0) { kill(gs, '전투 중 부상'); return 'defeat'; }
      }
    }
  }

  if (aliveEnemies.length === 0) {
    gs.noise = clamp(gs.noise + 15, 0, 100);
    return 'victory';
  }
  gs.fleeCount++;
  return 'fled';
}

// ─── 탐색 ─────────────────────────────────────────────────
function explore(gs, districtId) {
  const d = DISTRICTS[districtId];
  if (!d) return;

  const season = getSeason(gs.day);
  const sm = SEASON_MODS[season];

  advanceTP(gs);
  if (!gs.alive) return;

  gs.stamina = clamp(gs.stamina - 5, 0, gs.maxStamina);
  gs.noise = clamp(gs.noise + 3, 0, 100);

  if (d.rad > 0) gs.radiation = clamp(gs.radiation + d.rad, 0, 100);

  const encounterChance = d.enc * sm.encounterMult;
  if (encounterChance > 0 && Math.random() < encounterChance) {
    const enemies = rollEnemyGroup(d.dl, gs.noise);
    const result = simulateCombat(gs, enemies);
    if (!gs.alive) return;
    if (result === 'fled') return;
  }

  if (!gs.districtsLooted.has(districtId)) {
    gs.districtsLooted.add(districtId);
    const lootCount = rand(2, 5);
    gs.inv.canned_food += Math.max(d.food > 0 ? 1 : 0, Math.floor(d.food * lootCount / 3));
    gs.inv.water_bottle += Math.max(d.water > 0 ? 1 : 0, Math.floor(d.water * lootCount / 2));
    gs.inv.scrap_metal += Math.max(d.metal > 0 ? 1 : 0, Math.floor(d.metal * lootCount / 3));
    gs.inv.cloth += Math.max(d.cloth > 0 ? 1 : 0, Math.floor(d.cloth * lootCount / 3));
    gs.inv.rope += Math.max(d.rope > 0 ? 1 : 0, Math.floor(d.rope * lootCount / 3));
    gs.inv.wood += Math.max(d.wood > 0 ? 1 : 0, Math.floor(d.wood * lootCount / 3));
    gs.inv.bandage += Math.max(d.medical > 0 ? 1 : 0, Math.floor(d.medical * lootCount / 5));
    gs.inv.first_aid_kit += (d.medical >= 2 && Math.random() < 0.3) ? 1 : 0;

    if (Math.random() < 0.4) {
      gs.inv.contaminated_water += rand(1, 2);
    }
    if (d.metal >= 2 && Math.random() < 0.30) {
      gs.inv.crowbar++;
    } else if (d.dl >= 3 && Math.random() < 0.20) {
      gs.inv.knife++;
    }

    if (season === 'autumn') {
      gs.inv.canned_food += rand(0, 2);
      gs.inv.energy_bar += rand(0, 1);
    }
    if (season === 'winter') gs.inv.wood += rand(0, 2);
    if (season === 'spring') gs.inv.bandage += (Math.random() < 0.25 ? 1 : 0);

    gs.morale = clamp(gs.morale + 8, 0, gs.maxMorale);

    if (Math.random() < 0.15) {
      gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    }
  }
}

// ─── 이동 ─────────────────────────────────────────────────
function travel(gs, districtId) {
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
    gs.morale = clamp(gs.morale + 8, 0, gs.maxMorale);
    gs.totalStructuresCrafted++;
    advanceTP(gs);
    return true;
  }
  return false;
}

function tryCraftGarden(gs) {
  if (gs.hasGarden && gs.gardenDura > 0) return false;
  if (gs.inv.wood >= 3 && gs.inv.rope >= 1 && gs.inv.cloth >= 2) {
    gs.inv.wood -= 3; gs.inv.rope--; gs.inv.cloth -= 2;
    gs.hasGarden = true; gs.gardenDura = 192;
    gs.morale = clamp(gs.morale + 12, 0, gs.maxMorale);
    gs.totalStructuresCrafted++;
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
  if (gs.inv.wood >= 2) {
    gs.inv.wood -= 2;
    gs.hasGarden = true; gs.gardenDura = 192;
    gs.totalStructuresCrafted++;
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
  if (gs.infection > 50 && gs.inv.antibiotics > 0) {
    gs.inv.antibiotics--;
    gs.infection = clamp(gs.infection - 45, 0, 100);
    gs.diseases = gs.diseases.filter(d => !['influenza','dysentery','cholera','sepsis'].includes(d.id));
    return true;
  }
  if (gs.hp < gs.maxHp * 0.4 && gs.inv.first_aid_kit > 0) {
    gs.inv.first_aid_kit--;
    gs.hp = clamp(gs.hp + 75, 0, gs.maxHp);
    gs.infection = clamp(gs.infection - 30, 0, 100);
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    return true;
  }
  if (gs.hp < gs.maxHp * 0.6 && gs.inv.bandage > 0) {
    gs.inv.bandage--;
    gs.hp = clamp(gs.hp + 28, 0, gs.maxHp);
    gs.infection = clamp(gs.infection - 5, 0, 100);
    return true;
  }
  if (gs.infection > 30 && gs.inv.antiseptic > 0) {
    gs.inv.antiseptic--;
    gs.infection = clamp(gs.infection - 20, 0, 100);
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

function tryBoilWater(gs) {
  if (!gs.hasCampfire || gs.campfireDura <= 0) return false;
  if (gs.inv.contaminated_water <= 0) return false;
  gs.inv.contaminated_water--;
  gs.inv.boiled_water++;
  advanceTP(gs);
  return true;
}

function checkRainCollection(gs) {
  const season = getSeason(gs.day);
  if (season === 'spring' && Math.random() < 0.12) {
    gs.hydration = clamp(gs.hydration + 35, 0, gs.maxHydration);
  }
  if (season === 'summer' && Math.random() < 0.15) {
    gs.hydration = clamp(gs.hydration + 40, 0, gs.maxHydration);
  }
  if (season === 'autumn' && Math.random() < 0.08) {
    gs.hydration = clamp(gs.hydration + 25, 0, gs.maxHydration);
  }
}

function forage(gs) {
  advanceTP(gs); if (!gs.alive) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.stamina = clamp(gs.stamina - 5, 0, gs.maxStamina);
  gs.nutrition = clamp(gs.nutrition + rand(3, 8), 0, gs.maxNutrition);
  gs.morale = clamp(gs.morale + 5, 0, gs.maxMorale);
  const season = getSeason(gs.day);
  if (season === 'spring' || season === 'summer') {
    gs.nutrition = clamp(gs.nutrition + rand(2, 5), 0, gs.maxNutrition);
  }
}

function scavengeWood(gs) {
  advanceTP(gs); if (!gs.alive) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.stamina = clamp(gs.stamina - 8, 0, gs.maxStamina);
  gs.noise = clamp(gs.noise + 5, 0, 100);
  gs.inv.wood += rand(1, 2);
  if (Math.random() < 0.25) gs.inv.rope++;
}

function rest(gs) {
  const shelterBonus = (gs.hasCampfire && gs.campfireDura > 0) ? 0.5 : 0;
  const gardenBonus  = (gs.hasGarden && gs.gardenDura > 0) ? 0.3 : 0;
  for (let i = 0; i < 8; i++) {
    advanceTP(gs);
    if (!gs.alive) return;
    gs.fatigue = clamp(gs.fatigue - 3, 0, 100);
    gs.hp      = clamp(gs.hp + 0.5, 0, gs.maxHp);
    gs.morale  = clamp(gs.morale + 0.5 + shelterBonus + gardenBonus, 0, gs.maxMorale);
    checkRainCollection(gs);
  }
}

// ─────────────────────────────────────────────────────────────
//  AI 전략 (퀘스트 인식)
// ─────────────────────────────────────────────────────────────
function aiTurn(gs) {
  // 퀘스트 체크
  checkQuestTriggers(gs);
  checkQuestProgress(gs);

  // 질병 체크
  checkEnvironmentDisease(gs);

  // 위급 소비
  if (gs.hydration < 150) consumeWater(gs);
  if (gs.nutrition < 40)  consumeFood(gs);
  if (gs.hp < gs.maxHp * 0.5) consumeMedical(gs);
  if (gs.infection > 40)  consumeMedical(gs);

  // 사기 관리
  if (gs.morale < 40) {
    if (gs.inv.canned_food > 2 || gs.inv.energy_bar > 1) consumeFood(gs);
    if (gs.inv.water_bottle > 1 || gs.inv.boiled_water > 1) consumeWater(gs);
  }

  // 피로 높으면 휴식
  if (gs.fatigue > 75 || gs.stamina < 15) {
    rest(gs);
    return;
  }

  // 물 끓이기
  if (gs.inv.contaminated_water > 0 && gs.hasCampfire && gs.campfireDura > 0) {
    tryBoilWater(gs);
    if (!gs.alive) return;
  }

  // 제작 우선순위
  if (!gs.hasCampfire || gs.campfireDura <= 0) {
    if (tryCraftCampfire(gs)) return;
  }
  if (!gs.hasGarden || gs.gardenDura <= 0) {
    if (tryCraftGarden(gs)) return;
    if (tryReplantGarden(gs)) return;
    if (gs.inv.wood < 3 && gs.stamina > 20) {
      scavengeWood(gs);
      return;
    }
  }
  tryRefuelCampfire(gs);
  if (gs.hasGarden && gs.gardenDura < 30 && gs.inv.wood < 2 && gs.stamina > 20) {
    scavengeWood(gs);
    return;
  }
  if (gs.hasCampfire && gs.campfireDura < 15 && gs.inv.wood < 1 && gs.stamina > 20) {
    scavengeWood(gs);
    return;
  }

  // ★ 퀘스트 목표 구역 이동 (visit_district)
  const questTarget = getQuestTargetDistrict(gs);
  if (questTarget && gs.hp > 50 && gs.stamina > 30) {
    const path = bfsToDistrict(gs.currentDistrict, questTarget);
    if (path.length > 1) {
      // 경로상 방사선 구역 회피: 다음 칸이 방사선 구역이면 HP 충분할 때만
      const nextDist = DISTRICTS[path[1]];
      if (nextDist.rad > 0 && gs.radiation > 40) {
        // 방사선 위험 → 스킵
      } else {
        travel(gs, path[1]);
        if (!gs.alive) return;
        // 도착한 구에서 루팅 안 했으면 탐색
        if (!gs.districtsLooted.has(path[1])) {
          explore(gs, path[1]);
        }
        return;
      }
    }
  }

  // 탐색 전략
  const adj = DISTRICTS[gs.currentDistrict]?.adj ?? [];
  const unlooted = adj.filter(id => !gs.districtsLooted.has(id));
  const needWater = gs.hydration < 180 && gs.inv.water_bottle <= 1;

  const sortedTargets = unlooted
    .map(id => ({ id, ...DISTRICTS[id] }))
    .filter(d => d.dl <= 2 && d.rad === 0)
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

  // 모든 인접 구 루팅 → BFS
  const allUnlooted = Object.keys(DISTRICTS).filter(id => !gs.districtsLooted.has(id) && (DISTRICTS[id].rad ?? 0) === 0);
  if (allUnlooted.length > 0 && gs.stamina > 30 && gs.hp > 50) {
    const path = bfsPath(gs.currentDistrict, allUnlooted);
    if (path.length > 1) {
      travel(gs, path[1]);
      if (!gs.alive) return;
      if (!gs.districtsLooted.has(path[1])) {
        explore(gs, path[1]);
      }
      return;
    }
  }

  // 영양 위험 시 채집
  if (gs.nutrition < 30 && gs.inv.canned_food === 0 && gs.inv.energy_bar === 0 && gs.stamina > 15) {
    forage(gs);
    return;
  }

  // 사기 관리
  if (gs.morale < 50 && gs.stamina > 20) {
    forage(gs);
    return;
  }

  // 대기
  rest(gs);
}

// ─────────────────────────────────────────────────────────────
//  단일 게임 실행
// ─────────────────────────────────────────────────────────────
function runOneGame(runId) {
  const gs = createGameState();
  const events = [];

  explore(gs, 'dongjak');

  let lastLogDay = 0;

  while (gs.alive && gs.totalTP < TARGET_TP) {
    aiTurn(gs);

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

  // 최종 퀘스트 체크
  checkQuestTriggers(gs);
  checkQuestProgress(gs);

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
    districtsVisited: [...gs.districtsVisited],
    hadGarden: gs.hasGarden || gs.gardenDura > 0 || gs.inv.wood >= 2,
    hadCampfire: gs.hasCampfire || gs.campfireDura > 0,
    finalHp: Math.round(gs.hp),
    finalNutrition: Math.round(gs.nutrition),
    finalHydration: Math.round(gs.hydration),
    events,
    quests: {
      completed: gs.quests.completed,
      failed:    gs.quests.failed,
      active:    gs.quests.active,
    },
  };
}

// ─────────────────────────────────────────────────────────────
//  메인: 100회 실행 + 결과 생성
// ─────────────────────────────────────────────────────────────
console.log('=== 100일 생존 시뮬레이션 + 퀘스트 추적 (이지수 · 의사) ===');
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

// ── 퀘스트 통계 ─────────────────────────────────────────────
const questStats = {};
for (const qDef of DOCTOR_QUESTS) {
  questStats[qDef.id] = {
    title: qDef.title,
    icon: qDef.icon,
    completed: 0,
    failed: 0,
    notReached: 0,
    avgCompleteDay: [],
  };
}

for (const r of results) {
  for (const qDef of DOCTOR_QUESTS) {
    const qStat = questStats[qDef.id];
    const completed = r.quests.completed.find(q => q.id === qDef.id);
    const failed = r.quests.failed.find(q => q.id === qDef.id);
    if (completed) {
      qStat.completed++;
      qStat.avgCompleteDay.push(completed.completedDay);
    } else if (failed) {
      qStat.failed++;
    } else {
      qStat.notReached++;
    }
  }
}

// ── 텍스트 로그 작성 ────────────────────────────────────────
const lines = [];
lines.push('╔══════════════════════════════════════════════════════════════╗');
lines.push('║   100일 생존 시뮬레이션 + 퀘스트 (이지수 · 의사)          ║');
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

// ══ 퀘스트 진행 현황 ══════════════════════════════════════
lines.push('══════════════════════════════════════════════════════════════');
lines.push('  메인 퀘스트 진행 현황 (이지수 · 의사)');
lines.push('══════════════════════════════════════════════════════════════');
lines.push('');
lines.push(`${'퀘스트'.padEnd(22)} ${'완료'.padStart(5)} ${'실패'.padStart(5)} ${'미도달'.padStart(6)} ${'완료율'.padStart(6)} ${'평균완료일'.padStart(8)}`);
lines.push('─'.repeat(62));

for (const qDef of DOCTOR_QUESTS) {
  const qs = questStats[qDef.id];
  const compRate = ((qs.completed / NUM_RUNS) * 100).toFixed(1);
  const avgDay = qs.avgCompleteDay.length > 0
    ? (qs.avgCompleteDay.reduce((s, d) => s + d, 0) / qs.avgCompleteDay.length).toFixed(1)
    : '-';
  lines.push(
    `${(qDef.icon + ' ' + qDef.title).padEnd(22)} ` +
    `${String(qs.completed).padStart(5)} ` +
    `${String(qs.failed).padStart(5)} ` +
    `${String(qs.notReached).padStart(6)} ` +
    `${(compRate + '%').padStart(6)} ` +
    `${String(avgDay).padStart(8)}`
  );
}
lines.push('');

// ── 퀘스트 체인 진행 깊이 분석 ──────────────────────────────
lines.push('── 퀘스트 체인 진행 깊이 ──');
const depthCounts = new Array(DOCTOR_QUESTS.length + 1).fill(0);
for (const r of results) {
  const depth = r.quests.completed.length;
  depthCounts[depth]++;
}
for (let i = 0; i <= DOCTOR_QUESTS.length; i++) {
  if (depthCounts[i] > 0) {
    const bar = '█'.repeat(depthCounts[i]);
    const label = i === DOCTOR_QUESTS.length ? '전체 완료 ✅' : `${i}단계 완료`;
    lines.push(`  ${label.padEnd(14)} ${String(depthCounts[i]).padStart(3)}회 ${bar}`);
  }
}
lines.push('');

// ── 개별 실행 요약 ──────────────────────────────────────────
lines.push('══════════════════════════════════════════════════════════════');
lines.push('  개별 실행 결과 (100회)');
lines.push('══════════════════════════════════════════════════════════════');
lines.push('');
lines.push(`${'#'.padStart(4)} ${'결과'.padEnd(6)} ${'일'.padStart(4)} ${'HP'.padStart(4)} ${'수분'.padStart(5)} ${'영양'.padStart(5)} ${'루팅'.padStart(4)} ${'킬'.padStart(4)} ${'퀘완'.padStart(4)} ${'사망 원인 / 퀘스트'}`);
lines.push('─'.repeat(95));

for (const r of results) {
  const status = r.survived ? '생존' : '사망';
  const questCompleted = r.quests.completed.length;
  const lastQuest = r.quests.completed.length > 0
    ? DOCTOR_QUESTS.find(q => q.id === r.quests.completed[r.quests.completed.length - 1].id)?.title ?? ''
    : '';
  const failedQuests = r.quests.failed.map(f => DOCTOR_QUESTS.find(q => q.id === f.id)?.title ?? '').join(', ');

  let info = '';
  if (r.survived) {
    info = `Q${questCompleted}/8 최종: ${lastQuest || '없음'}`;
  } else {
    info = `${r.deathCause} | Q${questCompleted}/8`;
    if (failedQuests) info += ` 실패:[${failedQuests}]`;
  }

  lines.push(
    `${String(r.runId).padStart(4)} ` +
    `${status.padEnd(6)} ` +
    `${String(r.dayReached).padStart(4)} ` +
    `${String(r.finalHp).padStart(4)} ` +
    `${String(r.finalHydration).padStart(5)} ` +
    `${String(r.finalNutrition).padStart(5)} ` +
    `${String(r.districtsLooted).padStart(4)} ` +
    `${String(r.totalKills).padStart(4)} ` +
    `${String(questCompleted).padStart(4)} ` +
    `${info}`
  );
}
lines.push('');

// ── 상세 이벤트 로그 (처음 5회 + 마지막 5회) ─────────────
lines.push('══════════════════════════════════════════════════════════════');
lines.push('  상세 이벤트 로그 (10일 간격, 처음 5회 + 마지막 5회)');
lines.push('══════════════════════════════════════════════════════════════');

const detailRuns = [...results.slice(0, 5), ...results.slice(-5)];
for (const r of detailRuns) {
  lines.push('');
  lines.push(`── Run #${r.runId} [${r.survived ? '생존' : '사망: ' + r.deathCause}] ──`);
  lines.push(`  퀘스트 완료: ${r.quests.completed.map(q => DOCTOR_QUESTS.find(d => d.id === q.id)?.title ?? q.id).join(' → ') || '없음'}`);
  lines.push(`  퀘스트 실패: ${r.quests.failed.map(q => `${DOCTOR_QUESTS.find(d => d.id === q.id)?.title ?? q.id}(${q.failedDay}일,${q.reason})`).join(', ') || '없음'}`);
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
const outputPath = 'sim_jisu_quests_result.txt';
writeFileSync(outputPath, output, 'utf-8');

console.log(`\n=== 결과 요약 ===`);
console.log(`생존율: ${survRate}% (${survived.length}/${NUM_RUNS})`);
console.log(`평균 생존일: ${avgDay}일`);
console.log(`\n사망 원인 TOP 5:`);
for (const [cause, count] of sortedCauses.slice(0, 5)) {
  console.log(`  ${cause}: ${count}회`);
}
console.log(`\n── 퀘스트 진행 요약 ──`);
for (const qDef of DOCTOR_QUESTS) {
  const qs = questStats[qDef.id];
  const compRate = ((qs.completed / NUM_RUNS) * 100).toFixed(0);
  console.log(`  ${qDef.icon} ${qDef.title}: 완료 ${qs.completed}회(${compRate}%) / 실패 ${qs.failed}회`);
}
console.log(`\n상세 로그 저장: ${outputPath}`);
