#!/usr/bin/env node
// === 300일 생존 시뮬레이션 + 퀘스트 추적 (이지수 · 의사) ===
// node sim_jisu_300days.mjs

import { writeFileSync } from 'fs';

// ─────────────────────────────────────────────────────────────
//  상수
// ─────────────────────────────────────────────────────────────
const TP_PER_DAY     = 72;
const TARGET_DAYS    = 300;
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

// ─── 날씨 시스템 ───────────────────────────────────────────
const WEATHER_TABLES = {
  spring: [
    { id: 'sunny',  weight: 25 },
    { id: 'rainy',  weight: 30 },
    { id: 'cloudy', weight: 25 },
    { id: 'windy',  weight: 15 },
    { id: 'foggy',  weight: 5  },
  ],
  summer: [
    { id: 'sunny',   weight: 20 },
    { id: 'hot',     weight: 25 },
    { id: 'rainy',   weight: 15 },
    { id: 'monsoon', weight: 20 },
    { id: 'storm',   weight: 10 },
    { id: 'cloudy',  weight: 10 },
  ],
  autumn: [
    { id: 'sunny',     weight: 20 },
    { id: 'windy',     weight: 20 },
    { id: 'cloudy',    weight: 20 },
    { id: 'foggy',     weight: 15 },
    { id: 'acid_rain', weight: 25, gardenKill: true },
  ],
  winter: [
    { id: 'snow',     weight: 35 },
    { id: 'blizzard', weight: 20 },
    { id: 'cloudy',   weight: 20 },
    { id: 'windy',    weight: 15 },
    { id: 'sunny',    weight: 10 },
  ],
};

function rollWeather(season) {
  const table = WEATHER_TABLES[season];
  const tw = table.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * tw;
  for (const w of table) {
    r -= w.weight;
    if (r <= 0) return { ...w };
  }
  return { ...table[0] };
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
    objective: { type: 'collect_item', definitionId: 'first_aid_kit', count: 2 },
    deadlineDays: 120,
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

function bfsPath(from, targetSet, avoidRad = true) {
  const targets = new Set(targetSet);
  const visited = new Set([from]);
  const queue = [[from]];
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (targets.has(node) && node !== from) return path;
    for (const neighbor of (DISTRICTS[node]?.adj ?? [])) {
      if (!visited.has(neighbor)) {
        // 방사선 구역 회피 (목적지가 아닌 경유지일 때)
        if (avoidRad && (DISTRICTS[neighbor]?.rad ?? 0) > 0 && !targets.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  // 방사선 회피로 경로 없으면 제한 없이 재시도
  if (avoidRad) return bfsPath(from, targetSet, false);
  return [from];
}

// BFS to specific single district (방사선 경유 회피)
function bfsToDistrict(from, targetId, avoidRad = true) {
  if (from === targetId) return [from];
  const visited = new Set([from]);
  const queue = [[from]];
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (node === targetId) return path;
    for (const neighbor of (DISTRICTS[node]?.adj ?? [])) {
      if (!visited.has(neighbor)) {
        if (avoidRad && (DISTRICTS[neighbor]?.rad ?? 0) > 0 && neighbor !== targetId) continue;
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  if (avoidRad) return bfsToDistrict(from, targetId, false);
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
      bandage: 2, antiseptic: 1, painkiller: 1, gauze: 0,
      canned_food: 1, water_bottle: 2, energy_bar: 0, rice: 0,
      contaminated_water: 0, boiled_water: 0, purified_water: 0,
      wood: 0, rope: 0, cloth: 0, scrap_metal: 0, nail: 0,
      first_aid_kit: 0, antibiotics: 0,
      knife: 1, crowbar: 0,   // 의사 시작 메스
    },

    hasCampfire:  false,  campfireDura:  0,
    hasGarden:    false,  gardenDura:    0,
    hasCollector: false,  collectorDura: 0,

    // 날씨 (1-3일 지속)
    weather: null,
    weatherDaysLeft: 0,

    // 구역 루팅 날짜 추적 (30일 리스폰)
    districtLootDay: {},

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

  // 날씨 업데이트 (하루 시작 시)
  if (gs.tpInDay === 0 || !gs.weather) {
    if (gs.weatherDaysLeft <= 0) {
      gs.weather = rollWeather(season);
      gs.weatherDaysLeft = rand(1, 3);
    }
    if (gs.tpInDay === 0) gs.weatherDaysLeft--;
  }

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
    const isAcidRain = gs.weather?.gardenKill === true;
    const gardenYield = isAcidRain ? 0 : 0.55;  // 산성비 시 수확 0
    gs.nutrition = clamp(gs.nutrition + gardenYield, 0, gs.maxNutrition);
    gs.morale = clamp(gs.morale + (isAcidRain ? -0.1 : 0.05), 0, gs.maxMorale);
    gs.gardenDura -= 0.3;
    if (gs.gardenDura <= 0) gs.hasGarden = false;
  }

  // 빗물 수집기: 날씨 연동
  if (gs.hasCollector && gs.collectorDura > 0) {
    const COLLECTOR_MULT = {
      rainy: 2.0, monsoon: 2.5, storm: 1.5,
      snow: 0.5, blizzard: 0.3,
      cloudy: 0.3, foggy: 0.2,
      sunny: 0.1, hot: 0.0, windy: 0.1,
    };
    const isAcid = gs.weather?.gardenKill === true;
    const wMult = isAcid ? 0 : (COLLECTOR_MULT[gs.weather?.id] ?? 0.1);
    const hydGain = 0.3 * wMult;
    if (hydGain > 0) gs.hydration = clamp(gs.hydration + hydGain, 0, gs.maxHydration);
    if (!isAcid) {
      gs.collectorDura -= 0.5;
      if (gs.collectorDura <= 0) gs.hasCollector = false;
    }
  }

  if (gs.temperature < 10)      gs.morale = clamp(gs.morale - 2, 0, 100);
  else if (gs.temperature < 20) gs.morale = clamp(gs.morale - 1, 0, 100);
  if (gs.temperature > 80)      gs.morale = clamp(gs.morale - 1, 0, 100);

  if (gs.temperature > 85) gs.hydration = clamp(gs.hydration - 3, 0, gs.maxHydration);
  if (gs.temperature <= 0) gs.hydration = clamp(gs.hydration - 5, 0, gs.maxHydration);

  gs.stamina = clamp(gs.stamina + 1.2, 0, gs.maxStamina);
  gs.noise = clamp(gs.noise - 1.0, 0, 100);
  // 방사선 자연 감소 (0.02/TP ≈ 1.92/일)
  if (gs.radiation > 0) gs.radiation = clamp(gs.radiation - 0.02, 0, 100);

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
  common_cold:        { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 0.4, moraleDrain: 0.4, hpDrain: 0.1, escalateDays: 5 },
  influenza:          { fatal: true,  fatalDays: 7,    hydDrain: 2.0, nutDrain: 0, fatGain: 0.7, moraleDrain: 1.2, hpDrain: 0.5 },
  dysentery:          { fatal: true,  fatalDays: 6,    hydDrain: 3.0, nutDrain: 1.0, fatGain: 0, moraleDrain: 0, hpDrain: 0.7 },
  cholera:            { fatal: true,  fatalDays: 4,    hydDrain: 6.0, nutDrain: 0.5, fatGain: 0, moraleDrain: 0, hpDrain: 2.5 },
  hypothermia:        { fatal: true,  fatalDays: 5,    hydDrain: 0, nutDrain: 0, fatGain: 1.2, moraleDrain: 1.2, hpDrain: 0.7 },
  heatstroke:         { fatal: true,  fatalDays: 3,    hydDrain: 3.0, nutDrain: 0, fatGain: 0, moraleDrain: 2.5, hpDrain: 1.2 },
  sepsis:             { fatal: true,  fatalDays: 3,    hydDrain: 0, nutDrain: 0, fatGain: 2.0, moraleDrain: 2.0, hpDrain: 3.5 },
  radiation_sickness: { fatal: true,  fatalDays: 7,    hydDrain: 0, nutDrain: 0.8, fatGain: 0.3, moraleDrain: 0.8, hpDrain: 1.5 },
  // 전투 부상 질병
  bleeding:           { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 0.2, moraleDrain: 0, hpDrain: 0.4 },
  deep_laceration:    { fatal: true,  fatalDays: 6,    hydDrain: 0.5, nutDrain: 0, fatGain: 0.3, moraleDrain: 0, hpDrain: 0.8 },
  fracture:           { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 1.5, moraleDrain: 0.8, hpDrain: 0.2 },
  concussion:         { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 0.6, moraleDrain: 1.0, hpDrain: 0.1 },
};

// 전투 부상 판정 테이블
const COMBAT_INJURIES = [
  { id: 'bleeding',        triggerDamage: 0,  chance: 0.20 },
  { id: 'deep_laceration', triggerDamage: 15, chance: 0.20 },
  { id: 'fracture',        triggerDamage: 20, chance: 0.15 },
  { id: 'concussion',      triggerDamage: 12, chance: 0.10 },
];

function checkCombatInjury(gs, damage) {
  for (const inj of COMBAT_INJURIES) {
    if (damage < inj.triggerDamage) continue;
    if (gs.diseases.some(d => d.id === inj.id)) continue;
    if (Math.random() < inj.chance) {
      contractDisease(gs, inj.id);
    }
  }
}

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
  // 감기: 체온 35 미만 (↑30), 확률 0.4% (↑0.2%)
  if (gs.temperature < 35 && !gs.diseases.some(d => d.id === 'common_cold' || d.id === 'influenza')) {
    if (Math.random() < 0.004 * mult) contractDisease(gs, 'common_cold');
  }
  // 감기 → 독감 악화 (5일)
  const cold = gs.diseases.find(d => d.id === 'common_cold');
  if (cold && cold.tpElapsed >= 5 * TP_PER_DAY) {
    gs.diseases = gs.diseases.filter(d => d.id !== 'common_cold');
    contractDisease(gs, 'influenza');
  }
  // 독감: 감염 25+ (↑30), 확률 0.4% (↑0.2%)
  if (gs.infection > 25 && !gs.diseases.some(d => d.id === 'influenza' || d.id === 'common_cold')) {
    if (Math.random() < 0.004 * mult) contractDisease(gs, 'influenza');
  }
  // 방사선 질환: 50+ (↑60), 확률 0.5% (↑0.3%)
  if (gs.radiation > 50 && !gs.diseases.some(d => d.id === 'radiation_sickness')) {
    if (Math.random() < 0.005 * mult) contractDisease(gs, 'radiation_sickness');
  }
  // 저체온증: 체온 < 10, 확률 3% (↑2%)
  if (gs.temperature < 10 && !gs.diseases.some(d => d.id === 'hypothermia')) {
    if (Math.random() < 0.03) contractDisease(gs, 'hypothermia');
  }
  // 열사병: 체온 > 85, 확률 3% (↑2%)
  if (gs.temperature > 85 && !gs.diseases.some(d => d.id === 'heatstroke')) {
    if (Math.random() < 0.03) contractDisease(gs, 'heatstroke');
  }
  // 패혈증: 감염 60+ (↑70), 확률 2%
  if (gs.infection > 60 && !gs.diseases.some(d => d.id === 'sepsis')) {
    if (Math.random() < 0.02) contractDisease(gs, 'sepsis');
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

  // 회피 실패 → 1.5배 피해 (첫 라운드 적 공격)
  let fleeFailed = true;

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
        // 의사 전투 루트: 좀비 처치 시 30% 확률 의료품 드롭
        if (Math.random() < 0.30) {
          const roll = Math.random();
          if (roll < 0.4)       gs.inv.bandage++;
          else if (roll < 0.7)  gs.inv.antiseptic++;
          else                  gs.inv.antibiotics++;
        }
      }
    }
    for (const enemy of aliveEnemies) {
      if (Math.random() < enemy.acc) {
        let dmg = rand(enemy.dmg[0], enemy.dmg[1]);
        if (fleeFailed) dmg = Math.floor(dmg * 1.5);  // 회피 실패 페널티
        gs.hp -= dmg;
        if (Math.random() < 0.20) gs.infection = clamp(gs.infection + 5, 0, 100);
        // 전투 부상 질병 판정
        checkCombatInjury(gs, dmg);
        if (gs.hp <= 0) { kill(gs, '전투 중 부상'); return 'defeat'; }
      }
    }
    fleeFailed = false;  // 첫 라운드만 패널티
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

  const lastLootDay = gs.districtLootDay[districtId] ?? -Infinity;
  const daysSinceLoot = gs.day - lastLootDay;
  const isFirstLoot = !gs.districtsLooted.has(districtId);
  const isRespawn = !isFirstLoot && daysSinceLoot >= 30;

  if (isFirstLoot || isRespawn) {
    // 리스폰: 50% 확률, 절반 수량
    const respawnFilter = (qty) => isRespawn ? (Math.random() < 0.5 ? Math.max(1, Math.floor(qty / 2)) : 0) : qty;

    gs.districtsLooted.add(districtId);
    gs.districtLootDay[districtId] = gs.day;

    const lootCount = rand(2, 5);
    gs.inv.canned_food += respawnFilter(Math.max(d.food > 0 ? 1 : 0, Math.floor(d.food * lootCount / 3)));
    gs.inv.water_bottle += respawnFilter(Math.max(d.water > 0 ? 1 : 0, Math.floor(d.water * lootCount / 2)));
    gs.inv.scrap_metal += respawnFilter(Math.max(d.metal > 0 ? 1 : 0, Math.floor(d.metal * lootCount / 3)));
    gs.inv.cloth += respawnFilter(Math.max(d.cloth > 0 ? 1 : 0, Math.floor(d.cloth * lootCount / 3)));
    gs.inv.rope += respawnFilter(Math.max(d.rope > 0 ? 1 : 0, Math.floor(d.rope * lootCount / 3)));
    gs.inv.wood += respawnFilter(Math.max(d.wood > 0 ? 1 : 0, Math.floor(d.wood * lootCount / 3)));
    gs.inv.bandage += respawnFilter(Math.max(d.medical > 0 ? 1 : 0, Math.floor(d.medical * lootCount / 5)));
    gs.inv.first_aid_kit += (d.medical >= 2 && Math.random() < (isRespawn ? 0.15 : 0.3)) ? 1 : 0;

    if (Math.random() < 0.4) {
      gs.inv.contaminated_water += respawnFilter(rand(1, 2));
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

    gs.morale = clamp(gs.morale + (isRespawn ? 4 : 8), 0, gs.maxMorale);

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
    gs.hasGarden = true; gs.gardenDura = 144;
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
    gs.hasGarden = true; gs.gardenDura = 144;
    gs.totalStructuresCrafted++;
    for (let i = 0; i < 3; i++) { advanceTP(gs); if (!gs.alive) return true; }
    return true;
  }
  return false;
}

function tryCraftCollector(gs) {
  if (gs.hasCollector && gs.collectorDura > 0) return false;
  // empty_bottle 2 + cloth 1 + rope 1 → rain_collector (3 TP)
  // 시뮬에서는 water_bottle을 empty_bottle 대용으로 사용하지 않음
  // 대신 cloth + rope + scrap_metal로 대체 (시뮬 간소화)
  if (gs.inv.cloth >= 1 && gs.inv.rope >= 1) {
    gs.inv.cloth--; gs.inv.rope--;
    gs.hasCollector = true; gs.collectorDura = 160;
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
  // ── 1. 전투 부상 우선 치료 ──
  const hasBleeding = gs.diseases.some(d => d.id === 'bleeding');
  const hasLaceration = gs.diseases.some(d => d.id === 'deep_laceration');
  const hasFracture = gs.diseases.some(d => d.id === 'fracture');
  const hasConcussion = gs.diseases.some(d => d.id === 'concussion');

  // 깊은 열상 → 구급상자 또는 소독약 우선
  if (hasLaceration && gs.inv.first_aid_kit > 0) {
    gs.inv.first_aid_kit--;
    gs.hp = clamp(gs.hp + 75, 0, gs.maxHp);
    gs.infection = clamp(gs.infection - 30, 0, 100);
    gs.diseases = gs.diseases.filter(d => d.id !== 'deep_laceration' && d.id !== 'bleeding');
    return true;
  }
  if (hasLaceration && gs.inv.antiseptic > 0) {
    gs.inv.antiseptic--;
    gs.infection = clamp(gs.infection - 20, 0, 100);
    gs.diseases = gs.diseases.filter(d => d.id !== 'deep_laceration');
    return true;
  }

  // 출혈 → 붕대 또는 거즈
  if (hasBleeding && gs.inv.bandage > 0) {
    gs.inv.bandage--;
    gs.hp = clamp(gs.hp + 28, 0, gs.maxHp);
    gs.diseases = gs.diseases.filter(d => d.id !== 'bleeding');
    return true;
  }
  if (hasBleeding && gs.inv.gauze > 0) {
    gs.inv.gauze--;
    gs.hp = clamp(gs.hp + 15, 0, gs.maxHp);
    gs.diseases = gs.diseases.filter(d => d.id !== 'bleeding');
    return true;
  }

  // 골절/뇌진탕 → 진통제
  if ((hasFracture || hasConcussion) && gs.inv.painkiller > 0) {
    gs.inv.painkiller--;
    gs.hp = clamp(gs.hp + 15, 0, gs.maxHp);
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    gs.fatigue = clamp(gs.fatigue - 10, 0, 100);
    gs.diseases = gs.diseases.filter(d => d.id !== 'concussion');
    // 골절은 즉시 완치 안됨 — tpElapsed를 3일분 앞당김 (빠른 회복)
    const frac = gs.diseases.find(d => d.id === 'fracture');
    if (frac) frac.tpElapsed += 3 * TP_PER_DAY;
    return true;
  }

  // ── 2. 기존 의료 소비 로직 ──
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
  const wId = gs.weather?.id ?? 'sunny';
  const isRaining = ['rainy', 'monsoon', 'storm'].includes(wId);

  // 봄/여름 빗물 강화 (비 올 때 수분 보급 + 가끔 아이템)
  if (season === 'spring') {
    const chance = isRaining ? 0.18 : 0.08;
    const amount = isRaining ? 45 : 30;
    if (Math.random() < chance) gs.hydration = clamp(gs.hydration + amount, 0, gs.maxHydration);
    // 하루 1회 아이템 드롭 (tpInDay === 0)
    if (gs.tpInDay === 0 && isRaining && Math.random() < 0.40) gs.inv.water_bottle += 2;
  }
  if (season === 'summer') {
    const chance = isRaining ? 0.22 : 0.10;
    const amount = isRaining ? 50 : 35;
    if (Math.random() < chance) gs.hydration = clamp(gs.hydration + amount, 0, gs.maxHydration);
    if (gs.tpInDay === 0 && isRaining && Math.random() < 0.55) gs.inv.water_bottle += 3;
  }
  if (season === 'autumn' && !gs.weather?.gardenKill) {
    if (Math.random() < 0.06) gs.hydration = clamp(gs.hydration + 20, 0, gs.maxHydration);
    if (gs.tpInDay === 0 && Math.random() < 0.15) gs.inv.water_bottle += 1;
  }
  if (season === 'winter') {
    // 겨울: 눈 녹여서 소량 오염수
    if (gs.tpInDay === 0 && Math.random() < 0.30) gs.inv.contaminated_water += 1;
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
  // 빗물 수집기 제작 (텃밭 다음 우선순위)
  if (!gs.hasCollector || gs.collectorDura <= 0) {
    if (tryCraftCollector(gs)) return;
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

  // 방사선 높으면 이동/탐색 자제하고 휴식으로 감소 대기
  if (gs.radiation > 40) {
    rest(gs);
    return;
  }

  // ★ 퀘스트 목표 구역 이동 (visit_district) — 방사선 경유 회피
  const questTarget = getQuestTargetDistrict(gs);
  if (questTarget && gs.hp > 50 && gs.stamina > 30 && gs.radiation < 25) {
    const path = bfsToDistrict(gs.currentDistrict, questTarget);
    if (path.length > 1) {
      const nextDist = DISTRICTS[path[1]];
      // 다음 칸 방사선 구역이면 방사선 40 이상일 때 스킵
      if (nextDist.rad > 0 && gs.radiation > 40) {
        // 방사선 위험 → 스킵
      } else {
        travel(gs, path[1]);
        if (!gs.alive) return;
        const lootDay = gs.districtLootDay[path[1]] ?? -Infinity;
        const canLoot = !gs.districtsLooted.has(path[1]) || (gs.day - lootDay) >= 30;
        if (canLoot) explore(gs, path[1]);
        return;
      }
    }
  }

  // 탐색 전략 (미탐색 + 30일 리스폰 구역)
  const adj = DISTRICTS[gs.currentDistrict]?.adj ?? [];
  const unlooted = adj.filter(id => {
    if (!gs.districtsLooted.has(id)) return true;
    const lastDay = gs.districtLootDay[id] ?? 0;
    return (gs.day - lastDay) >= 30;
  });
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

  // 모든 인접 구 루팅 → BFS (미탐색 + 리스폰 포함)
  const allUnlooted = Object.keys(DISTRICTS).filter(id => {
    if ((DISTRICTS[id].rad ?? 0) > 0) return false;
    if (!gs.districtsLooted.has(id)) return true;
    const lastDay = gs.districtLootDay[id] ?? 0;
    return (gs.day - lastDay) >= 30;
  });
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
      if (gs.day % 30 === 0 || gs.day === 1) {
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
    hadCollector: gs.hasCollector || gs.collectorDura > 0,
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
console.log('=== 300일 생존 시뮬레이션 + 퀘스트 추적 (이지수 · 의사) ===');
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
lines.push('║   300일 생존 시뮬레이션 + 퀘스트 (이지수 · 의사)          ║');
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
  [1,10], [11,30], [31,60], [61,90],
  [91,120], [121,150], [151,180],
  [181,210], [211,240], [241,270],
  [271,300],
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
lines.push('  상세 이벤트 로그 (30일 간격, 처음 5회 + 마지막 5회)');
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

// ── 계절별 사망 분석 ────────────────────────────────────────
lines.push('── 계절별 사망 분석 ──');
const seasonDeaths = { spring: 0, summer: 0, autumn: 0, winter: 0 };
const seasonNames = { spring: '봄 (1~90일)', summer: '여름 (91~180일)', autumn: '가을 (181~270일)', winter: '겨울 (271~300일)' };
for (const r of deaths) {
  const s = getSeason(r.dayReached);
  seasonDeaths[s]++;
}
for (const [s, name] of Object.entries(seasonNames)) {
  const cnt = seasonDeaths[s];
  const bar = '█'.repeat(cnt);
  lines.push(`  ${name.padEnd(20)} ${String(cnt).padStart(3)}회 ${bar}`);
}
lines.push('');

const output = lines.join('\n');
const outputPath = 'sim_jisu_300days_result.txt';
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
console.log(`\n── 계절별 사망 ──`);
for (const [s, name] of Object.entries(seasonNames)) {
  if (seasonDeaths[s] > 0) console.log(`  ${name}: ${seasonDeaths[s]}회`);
}
console.log(`\n상세 로그 저장: ${outputPath}`);
