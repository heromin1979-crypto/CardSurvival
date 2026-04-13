#!/usr/bin/env node
// === 300일 생존 시뮬레이션 (강민준 · 군인) — 50회 ===
// node testdata/sim_soldier_50runs.mjs

import { writeFileSync } from 'fs';

// ─────────────────────────────────────────────────────────────
//  상수
// ─────────────────────────────────────────────────────────────
const TP_PER_DAY  = 72;
const TARGET_DAYS = 300;
const TARGET_TP   = TARGET_DAYS * TP_PER_DAY;
const NUM_RUNS    = 50;

// ─── 캐릭터 설정 (군인) ──────────────────────────────────────
const CHARACTER_CONFIG = {
  name: '강민준 (군인)', icon: '⚔️',
  maxHp: 110, stamina: 113, morale: 70, fatigue: 10,
  startDistrict: 'dobong',
  startInv: { knife: 1, water_bottle: 1, alcohol_swab: 2, bandage: 1 },
  combatDmgWeapon: [14, 28], combatDmgUnarmed: [8, 14], combatAcc: 0.82, fleeBase: 0.35,
  healBonus: 1.0, fatigueDecayMult: 0.7, statDecayMult: 1.0, noiseMult: 0.6, encounterMult: 1.0,
  craftSavePct: 0, structDuraMult: 1.0,
  skills: { unarmed: 3, melee: 4, defense: 3, building: 1, scavenging: 1, crafting: 1, medicine: 1 },
  hasQuests: true, charType: 'soldier',
};

// ─── 강민준 메인 퀘스트 정의 (30개) ──────────────────────────
const SOLDIER_QUESTS = [
  // Phase 1: 생존 — 용산 기지 (Day 1–14)
  { id:'mq_soldier_01', title:'용산 기지 생존',    icon:'🔪', dayTrigger:1,  prerequisite:null,            objective:{type:'collect_item',definitionId:'knife',count:1},              deadlineDays:10,       reward:{morale:5} },
  { id:'mq_soldier_02', title:'방어선 구축',        icon:'🏗️', dayTrigger:2,  prerequisite:'mq_soldier_01', objective:{type:'craft_structure',count:1},                                deadlineDays:12,       reward:{morale:5, bandage:2} },
  { id:'mq_soldier_03', title:'야전 보급',          icon:'🍖', dayTrigger:4,  prerequisite:'mq_soldier_02', objective:{type:'collect_item_type',itemType:'food',count:5},               deadlineDays:14,       reward:{morale:5} },
  { id:'mq_soldier_04', title:'무전기 복원',        icon:'📡', dayTrigger:6,  prerequisite:'mq_soldier_03', objective:{type:'collect_item',definitionId:'electronic_parts',count:2},   deadlineDays:16,       reward:{morale:8} },
  { id:'mq_soldier_05', title:'야전 응급처치',      icon:'🩹', dayTrigger:8,  prerequisite:'mq_soldier_04', objective:{type:'collect_item',definitionId:'bandage',count:3},            deadlineDays:18,       reward:{morale:5} },
  { id:'mq_soldier_06', title:'무기 정비',          icon:'⚙️', dayTrigger:10, prerequisite:'mq_soldier_05', objective:{type:'collect_item',definitionId:'scrap_metal',count:3},        deadlineDays:20,       reward:{morale:5} },
  { id:'mq_soldier_07', title:'원정 식량',          icon:'🎒', dayTrigger:13, prerequisite:'mq_soldier_06', objective:{type:'collect_item_type',itemType:'food',count:3},               deadlineDays:23,       reward:{morale:5} },
  // Phase 2: 목적 — 광화문 + 정찰 (Day 15–40)
  { id:'mq_soldier_08', title:'광화문 돌파',        icon:'🏛️', dayTrigger:15, prerequisite:'mq_soldier_07', objective:{type:'visit_district',districtId:'jongno'},                     deadlineDays:40,       reward:{morale:15} },
  { id:'mq_soldier_09', title:'탈출 로프',          icon:'🧗', dayTrigger:18, prerequisite:'mq_soldier_08', objective:{type:'collect_item',definitionId:'rope',count:2},               deadlineDays:43,       reward:{morale:5} },
  { id:'mq_soldier_10', title:'통신 강화',          icon:'📻', dayTrigger:21, prerequisite:'mq_soldier_09', objective:{type:'collect_item',definitionId:'electronic_parts',count:2},   deadlineDays:46,       reward:{morale:5} },
  { id:'mq_soldier_11', title:'전우의 인식표',      icon:'🎖️', dayTrigger:24, prerequisite:'mq_soldier_10', objective:{type:'collect_item',definitionId:'knife',count:2},              deadlineDays:50,       reward:{morale:15} },
  { id:'mq_soldier_12', title:'전진 거점',          icon:'🏕️', dayTrigger:27, prerequisite:'mq_soldier_11', objective:{type:'craft_structure',count:2},                                deadlineDays:54,       reward:{morale:8} },
  { id:'mq_soldier_13', title:'야간 이동 장비',     icon:'🔦', dayTrigger:30, prerequisite:'mq_soldier_12', objective:{type:'collect_item',definitionId:'flashlight',count:2},          deadlineDays:58,       reward:{morale:8} },
  { id:'mq_soldier_14', title:'장거리 보급',        icon:'🥫', dayTrigger:33, prerequisite:'mq_soldier_13', objective:{type:'collect_item_type',itemType:'food',count:8},               deadlineDays:62,       reward:{morale:8} },
  { id:'mq_soldier_15', title:'1개월 생존',         icon:'⏱️', dayTrigger:36, prerequisite:'mq_soldier_14', objective:{type:'survive_days',count:36},                                  deadlineDays:Infinity, reward:{morale:10} },
  // Phase 3: 위기 — KBS 방송 (Day 38–65)
  { id:'mq_soldier_16', title:'KBS 방송국',         icon:'📡', dayTrigger:38, prerequisite:'mq_soldier_15', objective:{type:'visit_district',districtId:'yeongdeungpo'},               deadlineDays:80,       reward:{morale:20} },
  { id:'mq_soldier_17', title:'방송 장비 수리',     icon:'🔧', dayTrigger:41, prerequisite:'mq_soldier_16', objective:{type:'collect_item',definitionId:'electronic_parts',count:3},   deadlineDays:83,       reward:{morale:10} },
  { id:'mq_soldier_18', title:'안테나 강화',        icon:'📶', dayTrigger:44, prerequisite:'mq_soldier_17', objective:{type:'collect_item',definitionId:'scrap_metal',count:5},        deadlineDays:86,       reward:{morale:8} },
  { id:'mq_soldier_19', title:'방송 배선',          icon:'🔌', dayTrigger:47, prerequisite:'mq_soldier_18', objective:{type:'collect_item',definitionId:'wire',count:3},               deadlineDays:88,       reward:{morale:8} },
  { id:'mq_soldier_20', title:'방송 거점 강화',     icon:'🛡️', dayTrigger:50, prerequisite:'mq_soldier_19', objective:{type:'craft_structure',count:3},                                deadlineDays:90,       reward:{morale:10} },
  { id:'mq_soldier_21', title:'방송 기간 보급',     icon:'🍱', dayTrigger:54, prerequisite:'mq_soldier_20', objective:{type:'collect_item_type',itemType:'food',count:5},               deadlineDays:92,       reward:{morale:5} },
  { id:'mq_soldier_22', title:'군 비상 주파수',     icon:'📻', dayTrigger:58, prerequisite:'mq_soldier_21', objective:{type:'collect_item',definitionId:'electronic_parts',count:5},   deadlineDays:95,       reward:{morale:15} },
  { id:'mq_soldier_23', title:'60일 방송',          icon:'📡', dayTrigger:62, prerequisite:'mq_soldier_22', objective:{type:'survive_days',count:62},                                  deadlineDays:Infinity, reward:{morale:12} },
  // Phase 4: 해결 — 집결 + 조직화 (Day 65–100)
  { id:'mq_soldier_24', title:'생존자 무장',        icon:'⚔️', dayTrigger:65, prerequisite:'mq_soldier_23', objective:{type:'collect_item',definitionId:'knife',count:3},              deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_soldier_25', title:'집결지 보급',        icon:'🥫', dayTrigger:68, prerequisite:'mq_soldier_24', objective:{type:'collect_item_type',itemType:'food',count:10},              deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_soldier_26', title:'집결지 방어',        icon:'🏰', dayTrigger:71, prerequisite:'mq_soldier_25', objective:{type:'craft_structure',count:4},                                deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_soldier_27', title:'탈출 루트 정비',     icon:'🧗', dayTrigger:75, prerequisite:'mq_soldier_26', objective:{type:'collect_item',definitionId:'rope',count:5},               deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_soldier_28', title:'통신망 확장',        icon:'🌐', dayTrigger:79, prerequisite:'mq_soldier_27', objective:{type:'collect_item',definitionId:'electronic_parts',count:4},   deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_soldier_29', title:'의료 지원',          icon:'🏥', dayTrigger:84, prerequisite:'mq_soldier_28', objective:{type:'collect_item',definitionId:'bandage',count:8},            deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_soldier_30', title:'서울 집결 완성',     icon:'📖', dayTrigger:88, prerequisite:'mq_soldier_29', objective:{type:'survive_days',count:100},                                 deadlineDays:Infinity, reward:{morale:25} },
];

const STAT_DECAY = {
  hydration: 1.5,
  nutrition: 0.5,
  morale:    0.2,
  fatigue:   0.448,   // 0.64 * 0.7 (fatigueDecayMult)
};

const SEASON_MODS = {
  spring: { hydrationMult: 1.0, tempDecay: 0,    tempRise: 0,    infectionMult: 1.8, encounterMult: 1.0, nutDecayMult: 1.0 },
  summer: { hydrationMult: 1.7, tempDecay: 0,    tempRise: 0.4,  infectionMult: 1.2, encounterMult: 1.0, nutDecayMult: 1.1 },
  autumn: { hydrationMult: 0.9, tempDecay: -0.3, tempRise: 0,    infectionMult: 1.8, encounterMult: 1.1, nutDecayMult: 1.25 },
  winter: { hydrationMult: 0.8, tempDecay: -2.0, tempRise: 0,    infectionMult: 1.0, encounterMult: 0.8, nutDecayMult: 1.1 },
};

function getSeason(day) {
  if (day <= 90)  return 'spring';
  if (day <= 180) return 'summer';
  if (day <= 270) return 'autumn';
  return 'winter';
}

const WEATHER_TABLES = {
  spring: [
    { id: 'sunny',  weight: 25 }, { id: 'rainy',  weight: 30 },
    { id: 'cloudy', weight: 25 }, { id: 'windy',  weight: 15 },
    { id: 'foggy',  weight: 5  },
  ],
  summer: [
    { id: 'sunny',   weight: 20 }, { id: 'hot',     weight: 25 },
    { id: 'rainy',   weight: 15 }, { id: 'monsoon', weight: 20 },
    { id: 'storm',   weight: 10 }, { id: 'cloudy',  weight: 10 },
  ],
  autumn: [
    { id: 'sunny',     weight: 20 }, { id: 'windy',     weight: 20 },
    { id: 'cloudy',    weight: 20 }, { id: 'foggy',     weight: 15 },
    { id: 'acid_rain', weight: 25, gardenKill: true },
  ],
  winter: [
    { id: 'snow',     weight: 35 }, { id: 'blizzard', weight: 20 },
    { id: 'cloudy',   weight: 20 }, { id: 'windy',    weight: 15 },
    { id: 'sunny',    weight: 10 },
  ],
};

function rollWeather(season) {
  const table = WEATHER_TABLES[season];
  const tw = table.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * tw;
  for (const w of table) { r -= w.weight; if (r <= 0) return { ...w }; }
  return { ...table[0] };
}

// ─── 구(District) 데이터 ──────────────────────────────────────
const DISTRICTS = {
  gangnam:       { name: '강남구',   dl: 3, enc: 0.20, rad: 0,  adj: ['seocho','songpa','dongjak'],                food: 1, water: 0, metal: 0, cloth: 1, rope: 0, medical: 2, wood: 0 },
  gangdong:      { name: '강동구',   dl: 2, enc: 0.10, rad: 0,  adj: ['songpa','geumcheon','gwangjin'],            food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 1, wood: 0 },
  gangbuk:       { name: '강북구',   dl: 2, enc: 0.05, rad: 0,  adj: ['dobong','seongbuk','jungrang','dongdaemun'],food: 1, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
  gangseo:       { name: '강서구',   dl: 2, enc: 0.10, rad: 0,  adj: ['yeongdeungpo','yangcheon'],                 food: 1, water: 0, metal: 2, cloth: 0, rope: 1, medical: 0, wood: 0 },
  gwanak:        { name: '관악구',   dl: 1, enc: 0.05, rad: 0,  adj: ['dongjak','geumcheon','songpa'],             food: 0, water: 1, metal: 1, cloth: 1, rope: 0, medical: 1, wood: 0 },
  gwangjin:      { name: '광진구',   dl: 2, enc: 0.08, rad: 0,  adj: ['seongdong','gangdong'],                     food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
  guro:          { name: '구로구',   dl: 2, enc: 0.10, rad: 0,  adj: ['yangcheon','dongjak','seocho'],             food: 0, water: 0, metal: 3, cloth: 0, rope: 1, medical: 0, wood: 0 },
  geumcheon:     { name: '금천구',   dl: 2, enc: 0.10, rad: 5,  adj: ['gwanak','gangdong'],                        food: 0, water: 0, metal: 4, cloth: 0, rope: 1, medical: 0, wood: 0 },
  nowon:         { name: '노원구',   dl: 1, enc: 0.03, rad: 0,  adj: ['dobong','jungrang'],                        food: 2, water: 1, metal: 0, cloth: 1, rope: 0, medical: 0, wood: 0 },
  dobong:        { name: '도봉구',   dl: 1, enc: 0.03, rad: 0,  adj: ['nowon','gangbuk'],                          food: 1, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 1 },
  dongdaemun:    { name: '동대문구', dl: 2, enc: 0.10, rad: 0,  adj: ['jongno','gangbuk','seongdong','junggoo'],   food: 1, water: 0, metal: 0, cloth: 3, rope: 1, medical: 0, wood: 0 },
  dongjak:       { name: '동작구',   dl: 1, enc: 0.05, rad: 0,  adj: ['guro','gwanak','gangnam'],                  food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 1, wood: 0 },
  mapo:          { name: '마포구',   dl: 3, enc: 0.15, rad: 3,  adj: ['seodaemun','jongno','yeongdeungpo'],        food: 1, water: 1, metal: 1, cloth: 1, rope: 1, medical: 0, wood: 0 },
  seodaemun:     { name: '서대문구', dl: 4, enc: 0.25, rad: 0,  adj: ['eunpyeong','seongbuk','mapo'],              food: 0, water: 1, metal: 0, cloth: 1, rope: 0, medical: 2, wood: 0 },
  seocho:        { name: '서초구',   dl: 4, enc: 0.30, rad: 0,  adj: ['gangnam','guro'],                           food: 2, water: 1, metal: 0, cloth: 0, rope: 0, medical: 1, wood: 0 },
  seongdong:     { name: '성동구',   dl: 3, enc: 0.15, rad: 5,  adj: ['dongdaemun','jungrang','gwangjin'],         food: 0, water: 0, metal: 4, cloth: 0, rope: 1, medical: 0, wood: 0 },
  seongbuk:      { name: '성북구',   dl: 2, enc: 0.08, rad: 0,  adj: ['seodaemun','gangbuk','jongno'],             food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
  songpa:        { name: '송파구',   dl: 5, enc: 0.40, rad: 0,  adj: ['gangnam','gangdong','gwanak'],              food: 2, water: 1, metal: 1, cloth: 1, rope: 0, medical: 0, wood: 0 },
  yangcheon:     { name: '양천구',   dl: 1, enc: 0.03, rad: 0,  adj: ['gangseo','guro'],                           food: 2, water: 1, metal: 0, cloth: 1, rope: 0, medical: 0, wood: 0 },
  yeongdeungpo:  { name: '영등포구', dl: 4, enc: 0.30, rad: 0,  adj: ['gangseo','mapo'],                           food: 0, water: 0, metal: 1, cloth: 0, rope: 0, medical: 1, wood: 0 },
  yongsan:       { name: '용산구',   dl: 3, enc: 0.20, rad: 0,  adj: ['jongno','junggoo'],                         food: 0, water: 0, metal: 1, cloth: 0, rope: 0, medical: 0, wood: 0 },
  eunpyeong:     { name: '은평구',   dl: 1, enc: 0.03, rad: 0,  adj: ['seodaemun'],                                food: 2, water: 1, metal: 0, cloth: 0, rope: 1, medical: 1, wood: 0 },
  jongno:        { name: '종로구',   dl: 5, enc: 0.40, rad: 10, adj: ['mapo','seongbuk','dongdaemun','yongsan'],   food: 0, water: 0, metal: 1, cloth: 0, rope: 0, medical: 1, wood: 0 },
  junggoo:       { name: '중구',     dl: 5, enc: 0.40, rad: 0,  adj: ['yongsan','dongdaemun'],                     food: 2, water: 1, metal: 0, cloth: 2, rope: 0, medical: 0, wood: 0 },
  jungrang:      { name: '중랑구',   dl: 2, enc: 0.05, rad: 0,  adj: ['nowon','gangbuk','seongdong'],              food: 2, water: 1, metal: 0, cloth: 1, rope: 1, medical: 0, wood: 0 },
};

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
  5: [{ id: 'zombie_brute',  w: 30, hp: [60,90], dmg: [20,35], acc: 0.55 },
      { id: 'zombie_horde',  w: 30, hp: [80,120],dmg: [6,12],  acc: 0.65 },
      { id: 'raider_elite',  w: 20, hp: [50,75], dmg: [18,28], acc: 0.72 },
      { id: 'zombie_acid',   w: 15, hp: [28,45], dmg: [8,14],  acc: 0.72 },
      { id: 'zombie_runner', w: 5,  hp: [18,28], dmg: [12,20], acc: 0.75 }],
};

// ─── 보스 ──────────────────────────────────────────────────────
const SIM_BOSSES = [
  { id: 'boss_patient_zero',     name: '제로 환자',      hp: 110, dmg: [20,35], acc: 0.65, def: 2,  regen: 5,  atkPR: 1, districts: ['gangnam'],                    minDay: 60,  season: null,     weather: null,       isNemesis: false, infOnHit: 15 },
  { id: 'boss_acid_queen',       name: '산성 여왕',      hp: 100, dmg: [18,30], acc: 0.68, def: 1,  regen: 0,  atkPR: 1, districts: ['seongdong'],                  minDay: 80,  season: null,     weather: null,       isNemesis: false, infOnHit: 8  },
  { id: 'boss_horde_mother',     name: '무리의 어미',    hp: 130, dmg: [15,28], acc: 0.60, def: 3,  regen: 0,  atkPR: 1, districts: [],                             minDay: 90,  season: null,     weather: null,       isNemesis: false, infOnHit: 0, minDl: 3 },
  { id: 'boss_frozen_giant',     name: '얼어붙은 거인',  hp: 160, dmg: [25,40], acc: 0.50, def: 6,  regen: 0,  atkPR: 1, districts: [],                             minDay: 0,   season: 'winter', weather: 'blizzard', isNemesis: false, infOnHit: 0  },
  { id: 'boss_raider_warlord',   name: '약탈자 두목',    hp: 90,  dmg: [22,38], acc: 0.70, def: 3,  regen: 0,  atkPR: 1, districts: ['yeongdeungpo','seocho'],      minDay: 70,  season: null,     weather: null,       isNemesis: false, infOnHit: 0  },
  { id: 'boss_mutant_alpha_tiger',name: '변이 호랑이',   hp: 100, dmg: [20,35], acc: 0.72, def: 2,  regen: 0,  atkPR: 1, districts: ['gwangjin'],                   minDay: 50,  season: null,     weather: null,       isNemesis: false, infOnHit: 0  },
  { id: 'boss_sewer_king',       name: '하수도의 왕',    hp: 140, dmg: [22,38], acc: 0.60, def: 4,  regen: 0,  atkPR: 1, districts: ['gangdong','gwangjin'],        minDay: 80,  season: null,     weather: 'rainy',    isNemesis: false, infOnHit: 8  },
  { id: 'boss_swarm_queen_bee',  name: '변이 여왕벌',    hp: 70,  dmg: [15,25], acc: 0.70, def: 1,  regen: 0,  atkPR: 1, districts: ['dobong','gangbuk'],           minDay: 60,  season: 'summer', weather: null,       isNemesis: false, infOnHit: 0  },
  { id: 'boss_radiation_colossus',name: '방사선 거인',   hp: 180, dmg: [28,45], acc: 0.50, def: 5,  regen: 0,  atkPR: 1, districts: ['jongno'],                     minDay: 100, season: null,     weather: null,       isNemesis: false, infOnHit: 0  },
  { id: 'boss_cult_leader',      name: '교단 교주',      hp: 70,  dmg: [15,28], acc: 0.65, def: 2,  regen: 0,  atkPR: 1, districts: ['seongbuk','dongdaemun'],      minDay: 100, season: null,     weather: null,       isNemesis: false, infOnHit: 0  },
  { id: 'boss_phantom_sniper',   name: '유령 저격수',    hp: 50,  dmg: [35,55], acc: 0.80, def: 1,  regen: 0,  atkPR: 1, districts: ['jongno','junggoo'],           minDay: 120, season: null,     weather: null,       isNemesis: false, infOnHit: 0  },
  { id: 'boss_monsoon_leviathan',name: '장마 수괴',      hp: 130, dmg: [18,35], acc: 0.60, def: 4,  regen: 0,  atkPR: 1, districts: ['mapo','yeongdeungpo','yongsan'],minDay:135, season: 'summer', weather: 'monsoon',  isNemesis: false, infOnHit: 0  },
  { id: 'boss_blizzard_wraith',  name: '눈보라의 망령',  hp: 90,  dmg: [18,30], acc: 0.70, def: 2,  regen: 0,  atkPR: 1, districts: [],                             minDay: 0,   season: 'winter', weather: 'blizzard', isNemesis: false, infOnHit: 0  },
  { id: 'boss_acid_rain_horror', name: '산성비 괴물',    hp: 110, dmg: [15,28], acc: 0.65, def: 3,  regen: 0,  atkPR: 1, districts: [],                             minDay: 0,   season: 'autumn', weather: 'acid_rain',isNemesis: false, infOnHit: 0  },
];

// ─── 히든 레시피 ───────────────────────────────────────────────
const SIM_HIDDEN_RECIPES = [
  { id: 'recipe_acid_whip',         reqBoss: 'boss_acid_queen',       reqLoc: null,               minDay: 0   },
  { id: 'recipe_electric_blade',    reqBoss: null,                    reqLoc: 'hidden_seongdong', minDay: 0   },
  { id: 'recipe_ultra_bat',         reqBoss: null,                    reqLoc: 'hidden_guro',      minDay: 0   },
  { id: 'recipe_extreme_cold_suit', reqBoss: 'boss_frozen_giant',     reqLoc: null,               minDay: 0   },
  { id: 'recipe_vaccine',           reqBoss: null,                    reqLoc: 'hidden_seodaemun', minDay: 50  },
  { id: 'recipe_combat_stimulant',  reqBoss: 'boss_raider_warlord',   reqLoc: null,               minDay: 0   },
  { id: 'recipe_sniper_mod',        reqBoss: 'boss_phantom_sniper',   reqLoc: null,               minDay: 120 },
  { id: 'recipe_healing_salve',     reqBoss: null,                    reqLoc: 'hidden_gangbuk',   minDay: 30  },
];

// ─── 질병 ──────────────────────────────────────────────────────
const DISEASE_DEFS = {
  common_cold:       { hpDrain: 0.3, fatigueDrain: 1.0, moraleDrain: 0.5, fatalDays: null },
  influenza:         { hpDrain: 1.0, fatigueDrain: 2.0, moraleDrain: 1.0, fatalDays: 20 },
  dysentery:         { hpDrain: 2.0, fatigueDrain: 1.5, moraleDrain: 1.5, fatalDays: 10 },
  cholera:           { hpDrain: 3.0, fatigueDrain: 2.0, moraleDrain: 2.0, fatalDays: 7  },
  sepsis:            { hpDrain: 4.0, fatigueDrain: 3.0, moraleDrain: 3.0, fatalDays: 5  },
  radiation_sickness:{ hpDrain: 2.0, fatigueDrain: 1.0, moraleDrain: 2.0, fatalDays: 30 },
  hypothermia:       { hpDrain: 3.0, fatigueDrain: 2.0, moraleDrain: 3.0, fatalDays: 5  },
  heatstroke:        { hpDrain: 3.0, fatigueDrain: 2.0, moraleDrain: 2.0, fatalDays: 5  },
  bleeding:          { hpDrain: 2.5, fatigueDrain: 1.5, moraleDrain: 1.0, fatalDays: 8  },
  deep_laceration:   { hpDrain: 3.5, fatigueDrain: 2.0, moraleDrain: 1.5, fatalDays: 6  },
  fracture:          { hpDrain: 0.5, fatigueDrain: 3.0, moraleDrain: 2.0, fatalDays: null },
  concussion:        { hpDrain: 1.0, fatigueDrain: 2.5, moraleDrain: 2.0, fatalDays: null },
};

// ─────────────────────────────────────────────────────────────
//  유틸리티
// ─────────────────────────────────────────────────────────────
function rand(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function rollEnemy(dl) {
  const table = ENEMY_TABLES[clamp(dl, 1, 5)];
  const tw = table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * tw;
  for (const e of table) { r -= e.w; if (r <= 0) return { ...e, hp: rand(e.hp[0], e.hp[1]) }; }
  return { ...table[0], hp: rand(table[0].hp[0], table[0].hp[1]) };
}

function rollEnemyGroup(dl, noise) {
  let count, edl;
  if (noise < 30)       { count = 1; edl = Math.max(1, dl - 1); }
  else if (noise < 65)  { count = 2; edl = dl; }
  else                  { count = 3; edl = Math.min(5, dl + 1); }
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
        if (avoidRad && (DISTRICTS[neighbor]?.rad ?? 0) > 0 && !targets.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  if (avoidRad) return bfsPath(from, targetSet, false);
  return [from];
}

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
//  퀘스트 시스템
// ─────────────────────────────────────────────────────────────
function checkQuestTriggers(gs) {
  for (const qDef of SOLDIER_QUESTS) {
    if (gs.quests.active.find(q => q.id === qDef.id)) continue;
    if (gs.quests.completed.find(q => q.id === qDef.id)) continue;
    if (gs.quests.failed.find(q => q.id === qDef.id)) continue;
    if (gs.day < qDef.dayTrigger) continue;
    if (qDef.prerequisite && !gs.quests.completed.find(q => q.id === qDef.prerequisite)) continue;
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
    const qDef = SOLDIER_QUESTS.find(d => d.id === q.id);
    if (!qDef) continue;

    if (q.deadline !== Infinity && gs.day > q.deadline) {
      gs.quests.active.splice(i, 1);
      gs.quests.failed.push({ id: q.id, failedDay: gs.day, reason: '기한 만료' });
      gs.morale = clamp(gs.morale - 5, 0, gs.maxMorale);
      continue;
    }

    const obj = qDef.objective;
    let progress = 0;
    let target = obj.count ?? 1;

    switch (obj.type) {
      case 'collect_item_type':
        if (obj.itemType === 'food') progress = countFood(gs);
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

    if (q.progress >= target) {
      gs.quests.active.splice(i, 1);
      gs.quests.completed.push({ id: q.id, completedDay: gs.day });
      if (qDef.reward.morale) gs.morale = clamp(gs.morale + qDef.reward.morale, 0, gs.maxMorale);
      if (qDef.reward.bandage) gs.inv.bandage += qDef.reward.bandage;
      if (qDef.reward.first_aid_kit) gs.inv.first_aid_kit += qDef.reward.first_aid_kit;
    }
  }
}

function getQuestTargetDistrict(gs) {
  for (const q of gs.quests.active) {
    const qDef = SOLDIER_QUESTS.find(d => d.id === q.id);
    if (!qDef) continue;
    if (qDef.objective.type === 'visit_district') {
      const targetId = qDef.objective.districtId;
      if (!gs.districtsVisited.has(targetId)) return targetId;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
//  게임 상태 초기화
// ─────────────────────────────────────────────────────────────
function createGameState() {
  const cc = CHARACTER_CONFIG;
  const startInv = {
    bandage: 0, antiseptic: 0, painkiller: 0, gauze: 0,
    canned_food: 0, water_bottle: 0, energy_bar: 0, rice: 0,
    contaminated_water: 0, boiled_water: 0, purified_water: 0,
    wood: 0, rope: 0, cloth: 0, scrap_metal: 0, nail: 0,
    first_aid_kit: 0, antibiotics: 0,
    knife: 0, crowbar: 0, hand_axe: 0, wire: 0,
    lockpick: 0, flashlight: 0, pipe_wrench: 0,
    electronic_parts: 0, map_fragment: 0,
    alcohol_swab: 0, warm_clothes: 0,
    leather: 0, thread: 0, duct_tape: 0,
  };
  for (const [k, v] of Object.entries(cc.startInv)) startInv[k] = v;

  return {
    day: 1, tpInDay: 0, totalTP: 0,
    cc,
    hp: cc.maxHp, maxHp: cc.maxHp,
    hydration: 200, maxHydration: 288,
    nutrition: 80,  maxNutrition: 100,
    temperature: 50,
    morale: cc.morale, maxMorale: 100,
    radiation: 0, infection: 0,
    fatigue: cc.fatigue,
    stamina: cc.stamina, maxStamina: cc.stamina,
    noise: 0,
    alive: true, deathCause: null,

    currentDistrict: cc.startDistrict,
    districtsLooted: new Set(),
    districtsVisited: new Set([cc.startDistrict]),
    districtLootDay: {},
    districtVisitCounts: {},

    inv: startInv,

    hasCampfire: false,  campfireDura: 0,
    hasGarden:   false,  gardenDura:   0,
    hasCollector: false, collectorDura: 0,
    hasWarmClothes: false,

    weather: null, weatherDaysLeft: 0,
    seasonTransitioned: new Set(),

    diseases: [],
    totalKills: 0, combatCount: 0, fleeCount: 0,
    despairTicks: 0, totalStructuresCrafted: 0,

    quests: {
      active:    [],
      completed: [],
      failed:    [],
    },

    // 군인 스킬: cc.skills 에서 직접 로드
    skills: { ...cc.skills },
    skillXp: { unarmed: 0, melee: 0, defense: 0, building: 0, scavenging: 0, crafting: 0, medicine: 0 },

    hiddenLocationsDiscovered: new Set(),
    bossesEncountered: [],
    bossesKilled: new Set(),
    secretEventsTriggered: new Set(),
    recipesUnlocked: new Set(),
    legendaryItems: [],

    log: [],
  };
}

// ─── 인벤토리 헬퍼 ────────────────────────────────────────────
function countFood(gs) { return gs.inv.canned_food + gs.inv.energy_bar + gs.inv.rice; }
function countCleanWater(gs) { return gs.inv.water_bottle + gs.inv.purified_water + gs.inv.boiled_water; }

// ─────────────────────────────────────────────────────────────
//  스킬 시스템
// ─────────────────────────────────────────────────────────────
const SKILL_XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400];

function gainSkillXp(gs, skill, amount) {
  if (!(skill in gs.skillXp)) return;
  gs.skillXp[skill] = (gs.skillXp[skill] ?? 0) + amount;
  const curLv = gs.skills[skill] ?? 1;
  if (curLv < 5) {
    const threshold = SKILL_XP_THRESHOLDS[curLv] ?? 9999;
    if (gs.skillXp[skill] >= threshold) {
      gs.skills[skill] = curLv + 1;
      gs.skillXp[skill] = 0;
    }
  }
}

function getSkillBonus(gs, skill) {
  return ((gs.skills[skill] ?? 1) - 1) * 0.08;
}

// ─────────────────────────────────────────────────────────────
//  질병 시스템
// ─────────────────────────────────────────────────────────────
function kill(gs, cause) {
  gs.alive = false;
  gs.deathCause = cause;
}

function contractDisease(gs, diseaseId) {
  if (gs.diseases.some(d => d.id === diseaseId)) return;
  const def = DISEASE_DEFS[diseaseId];
  if (!def) return;
  const fatalTp = def.fatalDays ? def.fatalDays * TP_PER_DAY : null;
  gs.diseases.push({ id: diseaseId, tpElapsed: 0, fatalTp });
}

function checkCombatInjury(gs, dmg) {
  if (dmg >= 20) {
    if (Math.random() < 0.25) contractDisease(gs, 'bleeding');
    if (Math.random() < 0.15) contractDisease(gs, 'deep_laceration');
  }
  if (dmg >= 30) {
    if (Math.random() < 0.10) contractDisease(gs, 'fracture');
    if (Math.random() < 0.10) contractDisease(gs, 'concussion');
  }
}

function progressDiseases(gs) {
  if (!gs.alive || gs.diseases.length === 0) return;
  const toRemove = [];
  for (const d of gs.diseases) {
    const def = DISEASE_DEFS[d.id];
    if (!def) { toRemove.push(d.id); continue; }
    d.tpElapsed++;
    gs.hp     = clamp(gs.hp     - def.hpDrain     / TP_PER_DAY, 0, gs.maxHp);
    gs.fatigue= clamp(gs.fatigue+ def.fatigueDrain / TP_PER_DAY, 0, 100);
    gs.morale = clamp(gs.morale - def.moraleDrain  / TP_PER_DAY, 0, 100);
    if (gs.hp <= 0) { kill(gs, `질병 사망: ${d.id}`); return; }
    if (d.fatalTp !== null && d.tpElapsed >= d.fatalTp) {
      kill(gs, `치명적 질병: ${d.id}`);
      return;
    }
    const naturalCureTP = 15 * TP_PER_DAY;
    if (['common_cold', 'influenza'].includes(d.id) && d.tpElapsed >= naturalCureTP) {
      toRemove.push(d.id);
    }
  }
  gs.diseases = gs.diseases.filter(d => !toRemove.includes(d.id));
}

function checkEnvironmentDisease(gs) {
  const sm = SEASON_MODS[getSeason(gs.day)];
  const mult = sm.infectionMult;
  if (gs.temperature < 35 && !gs.diseases.some(d => d.id === 'common_cold' || d.id === 'influenza')) {
    if (Math.random() < 0.004 * mult) contractDisease(gs, 'common_cold');
  }
  const cold = gs.diseases.find(d => d.id === 'common_cold');
  if (cold && cold.tpElapsed >= 5 * TP_PER_DAY) {
    gs.diseases = gs.diseases.filter(d => d.id !== 'common_cold');
    contractDisease(gs, 'influenza');
  }
  if (gs.infection > 25 && !gs.diseases.some(d => d.id === 'influenza' || d.id === 'common_cold')) {
    if (Math.random() < 0.004 * mult) contractDisease(gs, 'influenza');
  }
  if (gs.radiation > 50 && !gs.diseases.some(d => d.id === 'radiation_sickness')) {
    if (Math.random() < 0.005 * mult) contractDisease(gs, 'radiation_sickness');
  }
  if (gs.temperature < 15 && !gs.diseases.some(d => d.id === 'hypothermia')) {
    const hypoChance = gs.temperature < 10 ? 0.06 : 0.02;
    const hypoMult = gs.hasWarmClothes ? 0.3 : 1.0;
    if (Math.random() < hypoChance * hypoMult) contractDisease(gs, 'hypothermia');
  }
  if (gs.temperature > 82 && !gs.diseases.some(d => d.id === 'heatstroke')) {
    const heatChance = gs.temperature > 88 ? 0.06 : 0.02;
    if (Math.random() < heatChance) contractDisease(gs, 'heatstroke');
  }
  if (gs.infection > 60 && !gs.diseases.some(d => d.id === 'sepsis')) {
    if (Math.random() < 0.02) contractDisease(gs, 'sepsis');
  }
}

// ─────────────────────────────────────────────────────────────
//  전투 시스템
// ─────────────────────────────────────────────────────────────
function simulateCombat(gs, enemies) {
  gs.combatCount++;
  const cc = gs.cc;
  const hasWeapon = gs.inv.knife > 0 || gs.inv.hand_axe > 0 || gs.inv.crowbar > 0;
  // 군인: 기본적으로 싸움 (도주 확률 매우 낮음)
  let fleeChance = hasWeapon ? cc.fleeBase : (cc.fleeBase + 0.15);
  if (gs.hp < gs.maxHp * 0.30) fleeChance += 0.15; // 매우 위험할 때만 +도주
  if (Math.random() < fleeChance) {
    gs.fleeCount++;
    gs.fatigue = clamp(gs.fatigue + 8, 0, 100);
    gs.noise = clamp(gs.noise + 8, 0, 100);
    return 'fled';
  }

  let fleeFailed = true;
  const meleeBonus = 1 + getSkillBonus(gs, 'melee');
  const defenseBonus = 1 + getSkillBonus(gs, 'defense');
  const pDmg = hasWeapon
    ? [Math.floor(cc.combatDmgWeapon[0] * meleeBonus), Math.floor(cc.combatDmgWeapon[1] * meleeBonus)]
    : cc.combatDmgUnarmed;
  const pAcc = cc.combatAcc;
  let round = 0;
  const aliveEnemies = enemies.map(e => ({ ...e }));

  while (aliveEnemies.length > 0 && gs.alive && round < 20) {
    round++;
    const target = aliveEnemies[0];
    if (Math.random() < pAcc) {
      const dmg = rand(pDmg[0], pDmg[1]);
      target.hp -= dmg;
      gainSkillXp(gs, hasWeapon ? 'melee' : 'unarmed', 2);
      if (target.hp <= 0) {
        aliveEnemies.shift();
        gs.totalKills++;
        // 군인: 적 처치 시 사기 +2
        gs.morale = clamp(gs.morale + 2, 0, gs.maxMorale);
        // 전투 루트: 20% 확률 자원 드롭
        if (Math.random() < 0.20) {
          const roll = Math.random();
          if (roll < 0.35)      gs.inv.canned_food++;
          else if (roll < 0.55) gs.inv.bandage++;
          else if (roll < 0.70) gs.inv.knife = Math.min(gs.inv.knife + 1, 2);
          else                  gs.inv.scrap_metal++;
        }
      }
    }
    for (const enemy of aliveEnemies) {
      if (Math.random() < enemy.acc) {
        let dmg = rand(enemy.dmg[0], enemy.dmg[1]);
        if (fleeFailed) dmg = Math.floor(dmg * 1.5);
        dmg = Math.max(1, Math.floor(dmg / defenseBonus));
        gs.hp -= dmg;
        gainSkillXp(gs, 'defense', 1);
        if (Math.random() < 0.15) gs.infection = clamp(gs.infection + 4, 0, 100);
        checkCombatInjury(gs, dmg);
        if (gs.hp <= 0) { kill(gs, '전투 중 부상'); return 'defeat'; }
      }
    }
    fleeFailed = false;
  }

  if (aliveEnemies.length === 0) {
    gs.noise = clamp(gs.noise + 12, 0, 100);
    return 'victory';
  }
  gs.fleeCount++;
  return 'fled';
}

function checkBossSpawn(gs) {
  const lastBossDay = gs.bossesEncountered.length > 0
    ? gs.bossesEncountered[gs.bossesEncountered.length - 1].day : -99;
  if (gs.day - lastBossDay < 20) return null;
  if (Math.random() > 0.004) return null;
  const season = getSeason(gs.day);
  const d = DISTRICTS[gs.currentDistrict];
  const wId = gs.weather?.id ?? 'sunny';

  for (const boss of SIM_BOSSES) {
    if (gs.bossesKilled.has(boss.id)) continue;
    if (gs.day < boss.minDay) continue;
    if (boss.season && season !== boss.season) continue;
    if (boss.weather && wId !== boss.weather) continue;
    if ((boss.minDl ?? 0) > 0 && d.dl < boss.minDl) continue;
    if (boss.districts.length > 0 && !boss.districts.includes(gs.currentDistrict)) continue;
    return boss;
  }
  return null;
}

function simulateBossCombat(gs, boss) {
  gs.bossesEncountered.push({ id: boss.id, day: gs.day });

  const cc = gs.cc;
  const hasWeapon = gs.inv.knife > 0 || gs.inv.hand_axe > 0 || gs.inv.crowbar > 0;
  // 군인: 보스도 싸움 (도주 확률 최소화)
  let fleeChance = cc.fleeBase - 0.15;
  if (gs.hp < gs.maxHp * 0.40) fleeChance += 0.15;
  if (!hasWeapon) fleeChance += 0.10;
  if (Math.random() < Math.max(0, fleeChance)) {
    const fleeHit = rand(boss.dmg[0], boss.dmg[1]);
    gs.hp -= Math.floor(fleeHit * 0.6);
    gs.fatigue = clamp(gs.fatigue + 15, 0, 100);
    if (gs.hp <= 0) { kill(gs, `보스 도주 중 부상: ${boss.name}`); return 'defeat'; }
    return 'fled';
  }

  const meleeBonus = 1 + getSkillBonus(gs, 'melee');
  const defenseBonus = 1 + getSkillBonus(gs, 'defense');
  const pDmg = hasWeapon
    ? [Math.floor(cc.combatDmgWeapon[0] * meleeBonus), Math.floor(cc.combatDmgWeapon[1] * meleeBonus)]
    : cc.combatDmgUnarmed;

  let bossHp = boss.hp;
  let round = 0;

  while (bossHp > 0 && gs.alive && round < 25) {
    round++;
    if (Math.random() < cc.combatAcc) {
      const dmg = Math.max(1, rand(pDmg[0], pDmg[1]) - Math.floor((boss.def ?? 0) * 0.2));
      bossHp -= dmg;
      gainSkillXp(gs, 'melee', 3);
      if (bossHp <= 0) break;
    }
    bossHp = Math.min(boss.hp, bossHp + (boss.regen ?? 0));
    for (let a = 0; a < (boss.atkPR ?? 1); a++) {
      if (Math.random() < boss.acc) {
        let dmg = Math.max(1, Math.floor(rand(boss.dmg[0], boss.dmg[1]) / defenseBonus));
        gs.hp -= dmg;
        gainSkillXp(gs, 'defense', 2);
        if ((boss.infOnHit ?? 0) > 0) gs.infection = clamp(gs.infection + boss.infOnHit, 0, 100);
        checkCombatInjury(gs, dmg);
        if (gs.hp <= 0) { kill(gs, `보스에게 사망: ${boss.name}`); return 'defeat'; }
      }
    }
  }

  if (bossHp <= 0) {
    gs.bossesKilled.add(boss.id);
    gs.totalKills += 3;
    gs.morale = clamp(gs.morale + 15, 0, gs.maxMorale);
    gs.log.push(`[D${gs.day}] ⚔️ 보스 처치: ${boss.name}`);
    return 'victory';
  }
  gs.fleeCount++;
  return 'fled';
}

function checkRecipeUnlocks(gs) {
  for (const recipe of SIM_HIDDEN_RECIPES) {
    if (gs.recipesUnlocked.has(recipe.id)) continue;
    if (gs.day < recipe.minDay) continue;
    if (recipe.reqBoss && !gs.bossesKilled.has(recipe.reqBoss)) continue;
    if (recipe.reqLoc && !gs.hiddenLocationsDiscovered.has(recipe.reqLoc)) continue;
    gs.recipesUnlocked.add(recipe.id);
  }
}

// ─────────────────────────────────────────────────────────────
//  계절 전환 충격
// ─────────────────────────────────────────────────────────────
function applySeasonTransition(gs) {
  if (!gs.alive) return;
  if (![91, 181, 271].includes(gs.day) || gs.tpInDay !== 0) return;
  if (gs.seasonTransitioned.has(gs.day)) return;
  gs.seasonTransitioned.add(gs.day);

  if (gs.day === 91) {
    const waterStock = countCleanWater(gs);
    if (waterStock < 2 && !gs.hasCollector) {
      gs.hydration = clamp(gs.hydration - 35, 0, gs.maxHydration);
      gs.temperature = clamp(gs.temperature + 18, 0, 100);
      gs.log.push(`[D${gs.day}] ☀️ 폭염 시작 — 물 부족`);
    } else {
      gs.morale = clamp(gs.morale + 5, 0, gs.maxMorale);
    }
  } else if (gs.day === 181) {
    if (gs.hasGarden) {
      gs.hasGarden = false; gs.gardenDura = 0;
      gs.morale = clamp(gs.morale - 15, 0, gs.maxMorale);
      gs.log.push(`[D${gs.day}] 🌧️ 첫 산성비 — 텃밭 파괴`);
    }
    const foodStock = countFood(gs);
    if (foodStock < 4) {
      gs.nutrition = clamp(gs.nutrition - 20, 0, gs.maxNutrition);
      gs.morale = clamp(gs.morale - 10, 0, gs.maxMorale);
      gs.log.push(`[D${gs.day}] 🍂 가을 식량 위기`);
    }
  } else if (gs.day === 271) {
    const isProtected = gs.hasWarmClothes || (gs.hasCampfire && gs.campfireDura > 0);
    if (!isProtected) {
      gs.temperature = clamp(gs.temperature - 25, 0, 100);
      contractDisease(gs, 'hypothermia');
      gs.morale = clamp(gs.morale - 15, 0, gs.maxMorale);
      gs.log.push(`[D${gs.day}] ❄️ 혹한 도래 — 저체온증 발병`);
    } else {
      gs.morale = clamp(gs.morale + 8, 0, gs.maxMorale);
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  빗물 수집
// ─────────────────────────────────────────────────────────────
function checkRainCollection(gs) {
  const season = getSeason(gs.day);
  const wId = gs.weather?.id ?? 'sunny';
  const isRaining = ['rainy', 'monsoon', 'storm'].includes(wId);
  const isAcid = gs.weather?.gardenKill === true;
  if (isAcid) return;

  if (season === 'spring') {
    const chance = isRaining ? 0.18 : 0.08;
    const amount = isRaining ? 45 : 30;
    if (Math.random() < chance) gs.hydration = clamp(gs.hydration + amount, 0, gs.maxHydration);
    if (gs.tpInDay === 0 && isRaining && Math.random() < 0.40) gs.inv.water_bottle += 2;
  }
  if (season === 'summer') {
    const chance = isRaining ? 0.22 : 0.10;
    const amount = isRaining ? 50 : 35;
    if (Math.random() < chance) gs.hydration = clamp(gs.hydration + amount, 0, gs.maxHydration);
  }
  if (season === 'winter') {
    if (wId === 'snow' && Math.random() < 0.35) {
      gs.inv.contaminated_water = (gs.inv.contaminated_water ?? 0) + 1;
    }
  }
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

  if (gs.inv.warm_clothes > 0) gs.hasWarmClothes = true;

  applySeasonTransition(gs);
  if (!gs.alive) return;

  const season = getSeason(gs.day);
  const sm = SEASON_MODS[season];

  if (gs.tpInDay === 0 || !gs.weather) {
    if (gs.weatherDaysLeft <= 0) {
      gs.weather = rollWeather(season);
      gs.weatherDaysLeft = rand(1, 3);
    }
    if (gs.tpInDay === 0) gs.weatherDaysLeft--;
  }

  gs.hydration = clamp(gs.hydration - STAT_DECAY.hydration * sm.hydrationMult, 0, gs.maxHydration);
  gs.nutrition = clamp(gs.nutrition - STAT_DECAY.nutrition * (sm.nutDecayMult ?? 1.0), 0, gs.maxNutrition);
  const hasHome = (gs.hasCampfire && gs.campfireDura > 0) && (gs.hasGarden && gs.gardenDura > 0);
  const moraleMult = hasHome ? 0.35 : (gs.hasCampfire && gs.campfireDura > 0) ? 0.6 : 1.0;
  gs.morale  = clamp(gs.morale  - STAT_DECAY.morale * moraleMult, 0, gs.maxMorale);
  gs.fatigue = clamp(gs.fatigue + STAT_DECAY.fatigue, 0, 100);

  if (sm.tempDecay < 0) {
    const coldMult = (season === 'winter' && gs.hasWarmClothes) ? 0.5 : 1.0;
    gs.temperature = clamp(gs.temperature + sm.tempDecay * coldMult, 0, 100);
  }
  if (sm.tempRise > 0 && gs.temperature < 85)
    gs.temperature = clamp(gs.temperature + sm.tempRise, 0, 100);

  if (gs.hasCampfire && gs.campfireDura > 0) {
    const heatCap = (season === 'summer') ? 45 : 55;
    if (gs.temperature < heatCap) gs.temperature = clamp(gs.temperature + 2, 0, heatCap);
    gs.campfireDura -= 0.5;
    if (gs.campfireDura <= 0) gs.hasCampfire = false;
  }
  if (gs.temperature > 70) gs.temperature = clamp(gs.temperature - 0.5, 0, 100);

  if (gs.hasGarden && gs.gardenDura > 0) {
    const isAcidRain = gs.weather?.gardenKill === true;
    const gardenYield = isAcidRain ? 0 : 0.55;
    gs.nutrition = clamp(gs.nutrition + gardenYield, 0, gs.maxNutrition);
    gs.morale = clamp(gs.morale + (isAcidRain ? -0.1 : 0.05), 0, gs.maxMorale);
    gs.gardenDura -= 0.3;
    if (gs.gardenDura <= 0) gs.hasGarden = false;
  }

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

  // 체온 패널티
  if (gs.temperature < 10)      gs.morale = clamp(gs.morale - 4, 0, 100);
  else if (gs.temperature < 20) gs.morale = clamp(gs.morale - 2, 0, 100);
  else if (gs.temperature < 30) gs.morale = clamp(gs.morale - 1, 0, 100);
  if (gs.temperature > 80)      gs.morale = clamp(gs.morale - 2, 0, 100);
  if (gs.temperature > 85) gs.hydration = clamp(gs.hydration - 5, 0, gs.maxHydration);
  if (gs.temperature <= 0) gs.hydration = clamp(gs.hydration - 8, 0, gs.maxHydration);

  gs.stamina = clamp(gs.stamina + 1.2, 0, gs.maxStamina);
  gs.noise   = clamp(gs.noise - 1.0, 0, 100);
  if (gs.radiation > 0) gs.radiation = clamp(gs.radiation - 0.02, 0, 100);

  checkRainCollection(gs);
  progressDiseases(gs);

  if (gs.morale <= 0) {
    gs.despairTicks++;
    if (gs.despairTicks > 15) { kill(gs, '절망으로 인한 사망'); return; }
  } else {
    gs.despairTicks = 0;
  }
  if (gs.hydration <= 0) { kill(gs, '탈수 사망'); return; }
  if (gs.nutrition  <= 0) { kill(gs, '굶주림 사망'); return; }
}

// ─────────────────────────────────────────────────────────────
//  이동 / 탐색 / 채집
// ─────────────────────────────────────────────────────────────
function travel(gs, targetId) {
  if (gs.currentDistrict === targetId) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.currentDistrict = targetId;
  gs.districtsVisited.add(targetId);
  gs.stamina = clamp(gs.stamina - 4, 0, gs.maxStamina);
  gs.noise   = clamp(gs.noise   + Math.floor(3 * gs.cc.noiseMult), 0, 100);
}

function explore(gs, districtId) {
  const d = DISTRICTS[districtId];
  if (!d) return;
  const season = getSeason(gs.day);
  const sm = SEASON_MODS[season];

  advanceTP(gs); if (!gs.alive) return;

  gs.stamina = clamp(gs.stamina - 5, 0, gs.maxStamina);
  gs.noise   = clamp(gs.noise   + Math.floor(3 * gs.cc.noiseMult), 0, 100);
  gs.districtVisitCounts[districtId] = (gs.districtVisitCounts[districtId] ?? 0) + 1;
  gainSkillXp(gs, 'scavenging', 1);

  if (d.rad > 0) gs.radiation = clamp(gs.radiation + d.rad, 0, 100);

  // 보스 스폰 체크
  const boss = checkBossSpawn(gs);
  if (boss) {
    simulateBossCombat(gs, boss);
    if (!gs.alive) return;
  }

  // 일반 조우
  const encounterChance = d.enc * sm.encounterMult * gs.cc.encounterMult;
  if (encounterChance > 0 && Math.random() < encounterChance) {
    const enemies = rollEnemyGroup(d.dl, gs.noise);
    const result = simulateCombat(gs, enemies);
    if (!gs.alive) return;
    if (result === 'fled') return;
  }

  // 루팅
  gs.districtsLooted.add(districtId);
  gs.districtLootDay[districtId] = gs.day;
  gainSkillXp(gs, 'scavenging', 3);

  const scavBonus = 1 + getSkillBonus(gs, 'scavenging');
  if (d.food > 0 && Math.random() < 0.5 * scavBonus) {
    const roll = Math.random();
    if (roll < 0.55)      gs.inv.canned_food += rand(1, d.food);
    else if (roll < 0.80) gs.inv.energy_bar  += 1;
    else                  gs.inv.rice         += rand(1, 2);
  }
  if (d.water > 0 && Math.random() < 0.6 * scavBonus) {
    const roll = Math.random();
    if (roll < 0.5) gs.inv.water_bottle     += rand(1, d.water);
    else            gs.inv.contaminated_water += rand(1, 2);
  }
  if (d.metal > 0 && Math.random() < 0.55 * scavBonus) gs.inv.scrap_metal += rand(1, d.metal);
  if (d.cloth > 0 && Math.random() < 0.50 * scavBonus) {
    const roll = Math.random();
    if (roll < 0.5) gs.inv.cloth += rand(1, d.cloth);
    else            gs.inv.leather++;
  }
  if (d.rope  > 0 && Math.random() < 0.50 * scavBonus) gs.inv.rope += rand(1, d.rope);
  if (d.wood  > 0 && Math.random() < 0.55 * scavBonus) gs.inv.wood += rand(1, d.wood);
  if (d.medical > 0 && Math.random() < 0.45 * scavBonus) {
    const roll = Math.random();
    if (roll < 0.40)      gs.inv.bandage     += rand(1, d.medical);
    else if (roll < 0.65) gs.inv.antiseptic  += 1;
    else if (roll < 0.82) gs.inv.painkiller  += 1;
    else if (roll < 0.92) gs.inv.first_aid_kit++;
    else                  gs.inv.antibiotics++;
  }

  // 전자 부품 / 철사 / 손전등 드롭 (퀘스트 재료)
  if (d.metal > 0 && Math.random() < 0.25) {
    const roll = Math.random();
    if (roll < 0.50)      gs.inv.electronic_parts++;
    else if (roll < 0.80) gs.inv.wire++;
    else                  gs.inv.flashlight++;
  }

  // 무기 드롭 (군인: 추가 무기 드롭 확률 20%)
  if (Math.random() < 0.08) {
    const roll = Math.random();
    if (roll < 0.45)      gs.inv.knife++;
    else if (roll < 0.75) gs.inv.crowbar++;
    else                  gs.inv.hand_axe++;
  }

  // 히든 장소 발견 (군인: 낮은 scavenging 스킬이지만 군사 본능으로 약간 보정)
  const hiddenTargets = {
    'hidden_seongdong': 'seongdong', 'hidden_guro': 'guro',
    'hidden_seodaemun': 'seodaemun', 'hidden_gwanak': 'gwanak',
    'hidden_gangbuk': 'gangbuk',
  };
  for (const [locId, reqDistrict] of Object.entries(hiddenTargets)) {
    if (gs.hiddenLocationsDiscovered.has(locId)) continue;
    if (districtId !== reqDistrict) continue;
    const visits = gs.districtVisitCounts[districtId] ?? 0;
    if (visits >= 2 && Math.random() < 0.15) {
      gs.hiddenLocationsDiscovered.add(locId);
      gs.morale = clamp(gs.morale + 8, 0, gs.maxMorale);
      gs.log.push(`[D${gs.day}] 🔍 히든 장소 발견: ${locId}`);
    }
  }

  checkRecipeUnlocks(gs);
}

function forage(gs) {
  advanceTP(gs); if (!gs.alive) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.stamina = clamp(gs.stamina - 5, 0, gs.maxStamina);
  gs.nutrition = clamp(gs.nutrition + rand(3, 8), 0, gs.maxNutrition);
  gs.morale = clamp(gs.morale + 5, 0, gs.maxMorale);
  const season = getSeason(gs.day);
  if (season === 'spring' || season === 'summer')
    gs.nutrition = clamp(gs.nutrition + rand(2, 5), 0, gs.maxNutrition);
}

function scavengeWood(gs) {
  advanceTP(gs); if (!gs.alive) return;
  advanceTP(gs); if (!gs.alive) return;
  gs.stamina = clamp(gs.stamina - 8, 0, gs.maxStamina);
  gs.noise   = clamp(gs.noise + 5, 0, 100);
  gs.inv.wood += rand(1, 2);
  if (Math.random() < 0.25) gs.inv.rope++;
}

function rest(gs) {
  const shelterBonus = (gs.hasCampfire && gs.campfireDura > 0) ? 0.5 : 0;
  const gardenBonus  = (gs.hasGarden && gs.gardenDura > 0) ? 0.3 : 0;
  for (let i = 0; i < 8; i++) {
    advanceTP(gs); if (!gs.alive) return;
    gs.fatigue = clamp(gs.fatigue - 3, 0, 100);
    gs.hp      = clamp(gs.hp + 0.5, 0, gs.maxHp);
    gs.morale  = clamp(gs.morale + 0.5 + shelterBonus + gardenBonus, 0, gs.maxMorale);
    checkRainCollection(gs);
  }
}

// ─────────────────────────────────────────────────────────────
//  제작 함수
// ─────────────────────────────────────────────────────────────
function tryCraftCampfire(gs) {
  const saveChance = gs.cc.craftSavePct ?? 0;
  const woodNeed = Math.random() < saveChance ? 2 : 3;
  const ropeNeed = Math.random() < saveChance ? 0 : 1;
  if (gs.inv.wood < woodNeed) return false;
  if (ropeNeed > 0 && gs.inv.rope < ropeNeed) return false;
  advanceTP(gs); if (!gs.alive) return false;
  gs.inv.wood -= woodNeed;
  gs.inv.rope -= ropeNeed;
  gs.hasCampfire = true;
  gs.campfireDura = 50 * gs.cc.structDuraMult;
  gs.totalStructuresCrafted++;
  gainSkillXp(gs, 'building', 5);
  return true;
}

function tryCraftGarden(gs) {
  const saveChance = gs.cc.craftSavePct ?? 0;
  const woodNeed = Math.random() < saveChance ? 3 : 4;
  if (gs.inv.wood < woodNeed || gs.inv.rope < 1) return false;
  advanceTP(gs); if (!gs.alive) return false;
  gs.inv.wood -= woodNeed;
  gs.inv.rope--;
  gs.hasGarden = true;
  gs.gardenDura = 60 * gs.cc.structDuraMult;
  gs.totalStructuresCrafted++;
  gainSkillXp(gs, 'building', 8);
  return true;
}

function tryReplantGarden(gs) {
  if (gs.hasGarden && gs.gardenDura > 15) return false;
  if (gs.inv.wood < 2 || gs.inv.rope < 1) return false;
  advanceTP(gs); if (!gs.alive) return false;
  gs.inv.wood -= 2;
  gs.inv.rope--;
  gs.hasGarden = true;
  gs.gardenDura = (gs.gardenDura > 0 ? gs.gardenDura : 0) + 45 * gs.cc.structDuraMult;
  gainSkillXp(gs, 'building', 4);
  return true;
}

function tryCraftCollector(gs) {
  const saveChance = gs.cc.craftSavePct ?? 0;
  const metalNeed = Math.random() < saveChance ? 1 : 2;
  if (gs.inv.scrap_metal < metalNeed || gs.inv.cloth < 1) return false;
  advanceTP(gs); if (!gs.alive) return false;
  gs.inv.scrap_metal -= metalNeed;
  gs.inv.cloth--;
  gs.hasCollector = true;
  gs.collectorDura = 80 * gs.cc.structDuraMult;
  gs.totalStructuresCrafted++;
  gainSkillXp(gs, 'building', 5);
  return true;
}

function tryCraftWarmClothes(gs) {
  if (gs.inv.cloth < 3 || gs.inv.leather < 1) return false;
  advanceTP(gs); if (!gs.alive) return false;
  gs.inv.cloth -= 3;
  gs.inv.leather--;
  gs.hasWarmClothes = true;
  gs.inv.warm_clothes++;
  gainSkillXp(gs, 'crafting', 10);
  return true;
}

function tryRefuelCampfire(gs) {
  if (!gs.hasCampfire) return false;
  if (gs.campfireDura > 20) return false;
  if (gs.inv.wood < 2) return false;
  gs.inv.wood -= 2;
  gs.campfireDura += 30;
  return true;
}

function tryBoilWater(gs) {
  if (!gs.hasCampfire || gs.campfireDura <= 0) return false;
  if (gs.inv.contaminated_water <= 0) return false;
  gs.inv.contaminated_water--;
  gs.inv.boiled_water++;
  advanceTP(gs);
  return true;
}

function consumeFood(gs) {
  if (gs.inv.canned_food > 0) {
    gs.inv.canned_food--;
    gs.nutrition = clamp(gs.nutrition + 35, 0, gs.maxNutrition);
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
    return true;
  }
  return false;
}

function consumeWater(gs) {
  if (gs.inv.water_bottle > 0) {
    gs.inv.water_bottle--;
    gs.hydration = clamp(gs.hydration + 80, 0, gs.maxHydration);
    return true;
  }
  if (gs.inv.purified_water > 0) {
    gs.inv.purified_water--;
    gs.hydration = clamp(gs.hydration + 90, 0, gs.maxHydration);
    return true;
  }
  if (gs.inv.boiled_water > 0) {
    gs.inv.boiled_water--;
    gs.hydration = clamp(gs.hydration + 65, 0, gs.maxHydration);
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
  const hasBleeding     = gs.diseases.some(d => d.id === 'bleeding');
  const hasLaceration   = gs.diseases.some(d => d.id === 'deep_laceration');
  const hasFracture     = gs.diseases.some(d => d.id === 'fracture');
  const hasConcussion   = gs.diseases.some(d => d.id === 'concussion');

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
  if (hasBleeding && gs.inv.bandage > 0) {
    gs.inv.bandage--;
    gs.hp = clamp(gs.hp + 20, 0, gs.maxHp);
    gs.diseases = gs.diseases.filter(d => d.id !== 'bleeding');
    return true;
  }
  if ((hasFracture || hasConcussion) && gs.inv.painkiller > 0) {
    gs.inv.painkiller--;
    gs.hp = clamp(gs.hp + 15, 0, gs.maxHp);
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    gs.fatigue = clamp(gs.fatigue - 10, 0, 100);
    gs.diseases = gs.diseases.filter(d => d.id !== 'concussion');
    return true;
  }
  if (gs.infection > 50 && gs.inv.antibiotics > 0) {
    gs.inv.antibiotics--;
    gs.infection = clamp(gs.infection - 45, 0, 100);
    gs.diseases = gs.diseases.filter(d => !['influenza','dysentery','cholera','sepsis'].includes(d.id));
    return true;
  }
  if (gs.hp < gs.maxHp * 0.40 && gs.inv.first_aid_kit > 0) {
    gs.inv.first_aid_kit--;
    gs.hp = clamp(gs.hp + 75, 0, gs.maxHp);
    gs.infection = clamp(gs.infection - 30, 0, 100);
    return true;
  }
  if (gs.hp < gs.maxHp * 0.60 && gs.inv.bandage > 0) {
    gs.inv.bandage--;
    gs.hp = clamp(gs.hp + 20, 0, gs.maxHp);
    gs.infection = clamp(gs.infection - 5, 0, 100);
    return true;
  }
  if (gs.infection > 30 && gs.inv.antiseptic > 0) {
    gs.inv.antiseptic--;
    gs.infection = clamp(gs.infection - 20, 0, 100);
    return true;
  }
  if (gs.infection > 30 && gs.inv.alcohol_swab > 0) {
    gs.inv.alcohol_swab--;
    gs.infection = clamp(gs.infection - 10, 0, 100);
    return true;
  }
  if (gs.fatigue > 70 && gs.inv.painkiller > 0) {
    gs.inv.painkiller--;
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    gs.fatigue = clamp(gs.fatigue - 10, 0, 100);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
//  AI 전략 — 군인: 공격적 탐색, 전투 우선, 구조물은 최소한
// ─────────────────────────────────────────────────────────────
function aiTurn(gs) {
  checkQuestTriggers(gs);
  checkQuestProgress(gs);
  checkRecipeUnlocks(gs);
  checkEnvironmentDisease(gs);

  // 위급 소비
  if (gs.hydration < 120) consumeWater(gs);
  if (gs.nutrition < 35)  consumeFood(gs);
  if (gs.hp < gs.maxHp * 0.45) consumeMedical(gs);
  if (gs.infection > 35)  consumeMedical(gs);

  // 사기 관리
  if (gs.morale < 35) {
    if (countFood(gs) > 1)        consumeFood(gs);
    if (countCleanWater(gs) > 1)  consumeWater(gs);
  }

  // 피로 / 스태미나
  if (gs.fatigue > 80 || gs.stamina < 12) {
    rest(gs); return;
  }

  // 물 끓이기
  if (gs.inv.contaminated_water > 0 && gs.hasCampfire && gs.campfireDura > 0) {
    tryBoilWater(gs); if (!gs.alive) return;
  }

  // 방사선 경계
  if (gs.radiation > 45) { rest(gs); return; }

  // ─── 최소 생존 구조물: 모닥불 (군인도 체온 관리 필요) ──────
  if (!gs.hasCampfire || gs.campfireDura <= 0) {
    // 재료 있으면 제작, 없으면 나무 채집 후 제작
    if (gs.inv.wood >= 3) {
      if (tryCraftCampfire(gs)) return;
    } else if (gs.stamina > 20 && gs.day < 20) {
      scavengeWood(gs); return;
    }
  }
  tryRefuelCampfire(gs);

  // ─── 겨울 준비 (D210+): 방한복 + 텃밭 보충 ─────────────────
  if (gs.day >= 210 && !gs.hasWarmClothes) {
    if (tryCraftWarmClothes(gs)) return;
  }
  if (gs.day >= 170 && (!gs.hasGarden || gs.gardenDura < 15)) {
    if (tryCraftGarden(gs) || tryReplantGarden(gs)) return;
    if (gs.inv.wood < 4 && gs.stamina > 20) { scavengeWood(gs); return; }
  }
  if (gs.day >= 100 && (!gs.hasCollector || gs.collectorDura <= 0)) {
    if (tryCraftCollector(gs)) return;
  }

  // ★ 퀘스트 목표 구역 이동 (visit_district)
  const questTarget = getQuestTargetDistrict(gs);
  if (questTarget && gs.hp > 50 && gs.stamina > 30) {
    const path = bfsToDistrict(gs.currentDistrict, questTarget);
    if (path.length > 1) {
      const nextDist = DISTRICTS[path[1]];
      if (!(nextDist.rad > 0 && gs.radiation > 40)) {
        travel(gs, path[1]);
        if (!gs.alive) return;
        if (!gs.districtsLooted.has(path[1])) explore(gs, path[1]);
        return;
      }
    }
  }

  // ─── 군인 핵심 전략: 공격적 탐색 ────────────────────────────
  const adj = DISTRICTS[gs.currentDistrict]?.adj ?? [];
  const needWater = gs.hydration < 160 && countCleanWater(gs) <= 1;
  const needFood  = gs.nutrition < 50  && countFood(gs) <= 1;

  // 30일 리스폰 + 미방문 구역 리스트
  const candidates = adj.filter(id => {
    if (!gs.districtsLooted.has(id)) return true;
    const lastDay = gs.districtLootDay[id] ?? 0;
    return (gs.day - lastDay) >= 30;
  }).map(id => ({ id, ...DISTRICTS[id] }));

  // 우선순위 정렬: 군인은 dl 4까지 적극 진입 (HP 50+ 이면)
  const sorted = candidates
    .filter(d => d.rad === 0 || gs.radiation < 15)
    .sort((a, b) => {
      // 물/식량 긴급 시 해당 자원 우선
      if (needWater) return (b.water - a.water) || (a.enc - b.enc);
      if (needFood)  return (b.food - a.food)   || (a.enc - b.enc);
      // 일반: 낮은 dl 우선이지만 dl 4도 허용 (HP 조건 확인)
      return a.dl - b.dl;
    });

  for (const target of sorted) {
    // dl 4: HP 50+ 이면 진입
    if (target.dl === 4 && gs.hp < 50) continue;
    // dl 5: HP 70+ + 무기 보유 시만
    if (target.dl === 5) {
      const hasWeapon = gs.inv.knife > 0 || gs.inv.hand_axe > 0 || gs.inv.crowbar > 0;
      if (gs.hp < 70 || !hasWeapon) continue;
    }
    if (gs.stamina > 20) {
      travel(gs, target.id); if (!gs.alive) return;
      explore(gs, target.id); return;
    }
  }

  // 인접 구역에 갈 곳 없으면 BFS로 더 넓게 탐색
  const allIds = Object.keys(DISTRICTS);
  const unlooted = allIds.filter(id => {
    if (DISTRICTS[id].rad > 0 && gs.radiation > 20) return false;
    if (!gs.districtsLooted.has(id)) return true;
    const lastDay = gs.districtLootDay[id] ?? 0;
    return (gs.day - lastDay) >= 30;
  });

  if (unlooted.length > 0 && gs.stamina > 25 && gs.hp > 45) {
    const path = bfsPath(gs.currentDistrict, unlooted);
    if (path.length > 1) {
      travel(gs, path[1]); if (!gs.alive) return;
      if (!gs.districtsLooted.has(path[1])) explore(gs, path[1]);
      return;
    }
  }

  // 채집 / 휴식
  if (gs.nutrition < 40 && countFood(gs) === 0 && gs.stamina > 12) {
    forage(gs); return;
  }
  if (gs.morale < 50 && gs.stamina > 20) {
    forage(gs); return;
  }
  rest(gs);
}

// ─────────────────────────────────────────────────────────────
//  단일 게임 실행
// ─────────────────────────────────────────────────────────────
function runOneGame(runId) {
  const gs = createGameState();
  const events = [];

  explore(gs, gs.cc.startDistrict);

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

  const survived = gs.alive && gs.totalTP >= TARGET_TP;
  return {
    runId, survived,
    dayReached: gs.day,
    deathCause: gs.deathCause,
    totalKills: gs.totalKills,
    combatCount: gs.combatCount,
    fleeCount: gs.fleeCount,
    districtsLooted: gs.districtsLooted.size,
    districtsVisited: [...gs.districtsVisited],
    hadGarden:    gs.hasGarden   || gs.gardenDura   > 0 || gs.inv.wood >= 2,
    hadCampfire:  gs.hasCampfire || gs.campfireDura  > 0,
    hadCollector: gs.hasCollector|| gs.collectorDura > 0,
    finalHp:        Math.round(gs.hp),
    finalNutrition: Math.round(gs.nutrition),
    finalHydration: Math.round(gs.hydration),
    events,
    hiddenLocations: gs.hiddenLocationsDiscovered.size,
    bossEncounters:  gs.bossesEncountered.length,
    bossKills:       gs.bossesKilled.size,
    recipesUnlocked: gs.recipesUnlocked.size,
    legendaryItems:  gs.legendaryItems.length,
    secretEvents:    gs.secretEventsTriggered.size,
    skills: { ...gs.skills },
    quests: { completed: [...gs.quests.completed], failed: [...gs.quests.failed] },
  };
}

// ─────────────────────────────────────────────────────────────
//  메인: 50회 실행 + 분석
// ─────────────────────────────────────────────────────────────
console.log('=== ⚔️ 강민준 (군인) 300일 생존 시뮬레이션 — 50회 ===');
console.log(`목표: ${TARGET_DAYS}일, 반복: ${NUM_RUNS}회\n`);

const results = [];
for (let i = 1; i <= NUM_RUNS; i++) {
  const r = runOneGame(i);
  results.push(r);
  const status = r.survived ? '✅' : `💀 D${r.dayReached}`;
  process.stdout.write(`  [${String(i).padStart(3)}/${NUM_RUNS}] ${status}  \r`);
}

const survived = results.filter(r => r.survived);
const deaths   = results.filter(r => !r.survived);

console.log(`\n  결과: 생존 ${survived.length}/${NUM_RUNS} (${((survived.length/NUM_RUNS)*100).toFixed(1)}%) | 평균 D${(results.reduce((s,r)=>s+r.dayReached,0)/NUM_RUNS).toFixed(0)}`);

// ── 분석 ──────────────────────────────────────────────────────
const lines = [];
const cc = CHARACTER_CONFIG;

lines.push('╔══════════════════════════════════════════════════════════════════════════╗');
lines.push('║      ⚔️  강민준 (군인) — 300일 생존 시뮬레이션 결과 (50회)          ║');
lines.push('╚══════════════════════════════════════════════════════════════════════════╝');
lines.push('');

// ── 1. 종합 요약 ──────────────────────────────────────────────
const survCount  = survived.length;
const survRate   = ((survCount / NUM_RUNS) * 100).toFixed(1);
const avgDay     = (results.reduce((s,r) => s + r.dayReached, 0) / NUM_RUNS).toFixed(1);
const avgKills   = (results.reduce((s,r) => s + r.totalKills, 0) / NUM_RUNS).toFixed(1);
const avgCombat  = (results.reduce((s,r) => s + r.combatCount, 0) / NUM_RUNS).toFixed(1);
const avgFlee    = (results.reduce((s,r) => s + r.fleeCount, 0) / NUM_RUNS).toFixed(1);
const avgLooted  = (results.reduce((s,r) => s + r.districtsLooted, 0) / NUM_RUNS).toFixed(1);
const avgHidden  = (results.reduce((s,r) => s + r.hiddenLocations, 0) / NUM_RUNS).toFixed(1);
const avgBossEnc = (results.reduce((s,r) => s + r.bossEncounters, 0) / NUM_RUNS).toFixed(1);
const avgBossKill= (results.reduce((s,r) => s + r.bossKills, 0) / NUM_RUNS).toFixed(1);
const avgRecipe  = (results.reduce((s,r) => s + r.recipesUnlocked, 0) / NUM_RUNS).toFixed(1);

lines.push('══ 1. 종합 요약 ════════════════════════════════════════════════════════════');
lines.push('');
lines.push(`  생존율:        ${survRate}%  (${survCount}/${NUM_RUNS}회)`);
lines.push(`  평균 생존일:   D${avgDay}`);
lines.push(`  평균 처치수:   ${avgKills} 킬`);
lines.push(`  평균 전투횟수: ${avgCombat}회 (도주 ${avgFlee}회, 도주율 ${avgCombat>0?((parseFloat(avgFlee)/parseFloat(avgCombat))*100).toFixed(1):'0.0'}%)`);
lines.push(`  평균 루팅구역: ${avgLooted}/${Object.keys(DISTRICTS).length}개`);
lines.push(`  히든 장소:     ${avgHidden} / 5개`);
lines.push(`  보스 조우:     ${avgBossEnc}회 / 처치 ${avgBossKill}회`);
lines.push(`  레시피 해금:   ${avgRecipe}개`);
lines.push('');

// 생존자 vs 사망자 비교
if (survived.length > 0) {
  const sAvgKills  = (survived.reduce((s,r) => s + r.totalKills, 0) / survived.length).toFixed(1);
  const sAvgLooted = (survived.reduce((s,r) => s + r.districtsLooted, 0) / survived.length).toFixed(1);
  const sAvgHp     = (survived.reduce((s,r) => s + r.finalHp, 0) / survived.length).toFixed(0);
  const sAvgNut    = (survived.reduce((s,r) => s + r.finalNutrition, 0) / survived.length).toFixed(0);
  const sAvgHyd    = (survived.reduce((s,r) => s + r.finalHydration, 0) / survived.length).toFixed(0);
  lines.push('  [생존자 최종 상태 평균]');
  lines.push(`  HP: ${sAvgHp} | 영양: ${sAvgNut} | 수분: ${sAvgHyd}`);
  lines.push(`  처치: ${sAvgKills} | 루팅: ${sAvgLooted} 구역`);
  lines.push('');
}

// ── 2. 사망 원인 분석 ─────────────────────────────────────────
lines.push('══ 2. 사망 원인 분석 ══════════════════════════════════════════════════════');
lines.push('');
const causes = {};
for (const d of deaths) causes[d.deathCause ?? '알 수 없음'] = (causes[d.deathCause ?? '알 수 없음'] ?? 0) + 1;
const sortedCauses = Object.entries(causes).sort((a, b) => b[1] - a[1]);
if (sortedCauses.length === 0) {
  lines.push('  사망 없음 (전원 생존)');
} else {
  for (const [cause, count] of sortedCauses) {
    const pct = ((count / NUM_RUNS) * 100).toFixed(1);
    lines.push(`  ${cause.padEnd(35)} ${String(count).padStart(3)}회 (${pct}%)`);
  }
}
lines.push('');

// ── 3. 생존 일수 분포 ─────────────────────────────────────────
lines.push('══ 3. 생존 일수 분포 ══════════════════════════════════════════════════════');
lines.push('');
const brackets = [[1,30],[31,60],[61,90],[91,120],[121,150],[151,180],[181,210],[211,240],[241,270],[271,300]];
for (const [lo, hi] of brackets) {
  const cnt = results.filter(r => r.dayReached >= lo && r.dayReached <= hi).length;
  const bar = '█'.repeat(cnt);
  lines.push(`  D${String(lo).padStart(3)}-${String(hi).padEnd(3)}  ${String(cnt).padStart(2)}회  ${bar}`);
}
lines.push('');

// ── 4. 스킬 성장 분석 (생존자) ───────────────────────────────
lines.push('══ 4. 스킬 성장 분석 (생존자 평균) ════════════════════════════════════════');
lines.push('');
const skillNames = ['unarmed', 'melee', 'defense', 'building', 'scavenging', 'crafting', 'medicine'];
if (survived.length > 0) {
  lines.push(`  ${'스킬'.padEnd(12)} ${'시작'.padStart(5)} ${'최종 평균'.padStart(10)}`);
  lines.push('  ' + '─'.repeat(30));
  for (const skill of skillNames) {
    const startLv = cc.skills[skill] ?? 1;
    const avgFinal = (survived.reduce((s,r) => s + (r.skills[skill] ?? startLv), 0) / survived.length).toFixed(2);
    lines.push(`  ${skill.padEnd(12)} ${String(startLv).padStart(5)} ${String(avgFinal).padStart(10)}`);
  }
} else {
  lines.push('  (생존자 없음)');
}
lines.push('');

// ── 5. 시즌별 위험 분석 ──────────────────────────────────────
lines.push('══ 5. 시즌별 위험 분석 ════════════════════════════════════════════════════');
lines.push('');
const bySeasonDeath = { spring: 0, summer: 0, autumn: 0, winter: 0 };
for (const d of deaths) {
  if (d.dayReached <= 90)       bySeasonDeath.spring++;
  else if (d.dayReached <= 180) bySeasonDeath.summer++;
  else if (d.dayReached <= 270) bySeasonDeath.autumn++;
  else                          bySeasonDeath.winter++;
}
for (const [season, cnt] of Object.entries(bySeasonDeath)) {
  const pct = ((cnt / NUM_RUNS) * 100).toFixed(1);
  const label = { spring: '봄(D1-90)', summer: '여름(D91-180)', autumn: '가을(D181-270)', winter: '겨울(D271-300)' }[season];
  lines.push(`  ${label.padEnd(18)} ${String(cnt).padStart(3)}회 사망 (${pct}%)`);
}
lines.push('');

// ── 6. 퀘스트 달성 분석 ──────────────────────────────────────
lines.push('══ 6. 퀘스트 달성 분석 ════════════════════════════════════════════════════');
lines.push('');
const avgQuestDone = (results.reduce((s,r) => s + r.quests.completed.length, 0) / NUM_RUNS).toFixed(1);
const fullQuestComp = results.filter(r => r.quests.completed.length >= SOLDIER_QUESTS.length).length;
lines.push(`  평균 완료 퀘스트: ${avgQuestDone} / ${SOLDIER_QUESTS.length}`);
lines.push(`  전체 완료 (${SOLDIER_QUESTS.length}/30): ${fullQuestComp}회 (${((fullQuestComp/NUM_RUNS)*100).toFixed(1)}%)`);
const depthCounts = {};
for (const r of results) {
  const depth = r.quests.completed.length;
  depthCounts[depth] = (depthCounts[depth] ?? 0) + 1;
}
for (let i = 0; i <= SOLDIER_QUESTS.length; i++) {
  if (depthCounts[i] > 0) {
    const bar = '█'.repeat(depthCounts[i]);
    const label = i === SOLDIER_QUESTS.length ? '전체 완료 ✅' : `${i}단계 완료`;
    lines.push(`  ${label.padEnd(14)} ${String(depthCounts[i]).padStart(3)}회 ${bar}`);
  }
}
lines.push('');

// ── 7. 전투 분석 ─────────────────────────────────────────────
lines.push('══ 7. 전투 분석 (군인 특화) ════════════════════════════════════════════════');
lines.push('');
const totalCombats = results.reduce((s,r) => s + r.combatCount, 0);
const totalKills   = results.reduce((s,r) => s + r.totalKills, 0);
const totalFlees   = results.reduce((s,r) => s + r.fleeCount, 0);
const combatDeaths = deaths.filter(d => d.deathCause?.includes('전투')).length;

lines.push(`  총 전투 횟수:   ${totalCombats}회 (평균 ${(totalCombats/NUM_RUNS).toFixed(1)}회/게임)`);
lines.push(`  총 처치:        ${totalKills} 킬 (평균 ${(totalKills/NUM_RUNS).toFixed(1)}/게임)`);
lines.push(`  총 도주:        ${totalFlees}회 (도주율 ${totalCombats>0?((totalFlees/totalCombats)*100).toFixed(1):'0.0'}%)`);
lines.push(`  전투 사망:      ${combatDeaths}/${deaths.length}회 (사망 중 ${deaths.length>0?((combatDeaths/deaths.length)*100).toFixed(1):'0.0'}%)`);

// 보스 킬 분포
const bossKillDist = {};
for (const r of results) {
  const k = r.bossKills;
  bossKillDist[k] = (bossKillDist[k] ?? 0) + 1;
}
lines.push('');
lines.push('  [보스 처치 분포]');
for (const [k, cnt] of Object.entries(bossKillDist).sort((a,b)=>+a[0]-+b[0])) {
  lines.push(`  ${String(k).padStart(2)}킬: ${String(cnt).padStart(3)}회`);
}
lines.push('');

// ── 7. 30일 체크포인트 요약 (생존자 평균) ───────────────────
lines.push('══ 7. 30일 체크포인트 요약 (생존자 평균) ══════════════════════════════════');
lines.push('');
const checkDays = [1, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
lines.push(`  ${'Day'.padEnd(5)} ${'HP'.padStart(5)} ${'수분'.padStart(6)} ${'영양'.padStart(6)} ${'사기'.padStart(6)} ${'피로'.padStart(6)} ${'온도'.padStart(6)} ${'구역'.padStart(6)}`);
lines.push('  ' + '─'.repeat(55));
for (const day of checkDays) {
  const evts = survived.flatMap(r => r.events.filter(e => e.day === day));
  if (evts.length === 0) continue;
  const avg = (arr, k) => (arr.reduce((s,e) => s + (e[k]??0), 0) / arr.length).toFixed(0);
  lines.push(
    `  D${String(day).padEnd(4)} ` +
    `${avg(evts,'hp').padStart(5)} ` +
    `${avg(evts,'hyd').padStart(6)} ` +
    `${avg(evts,'nut').padStart(6)} ` +
    `${avg(evts,'mor').padStart(6)} ` +
    `${avg(evts,'fat').padStart(6)} ` +
    `${avg(evts,'temp').padStart(6)} ` +
    `${String(Math.round(evts.reduce((s,e)=>s+(e.looted??0),0)/evts.length)).padStart(6)}`
  );
}
lines.push('');

// ── 8. 주요 이벤트 로그 (첫 10회) ─────────────────────────
lines.push('══ 8. 대표 게임 로그 (10회 샘플) ═══════════════════════════════════════');
for (let i = 0; i < Math.min(10, results.length); i++) {
  const r = results[i];
  const tag = r.survived ? '✅ 생존' : `💀 D${r.dayReached} (${r.deathCause})`;
  lines.push('');
  lines.push(`  ── 게임 #${i+1}: ${tag} | 처치 ${r.totalKills} | 루팅 ${r.districtsLooted} | 보스 ${r.bossKills}`);
  if (r.events.length > 0) {
    for (const e of r.events.slice(0, 6)) {
      lines.push(`     D${String(e.day).padEnd(4)} HP:${e.hp} 수분:${e.hyd} 영양:${e.nut} 사기:${e.mor} 피로:${e.fat} 온도:${e.temp} [${e.loc}]`);
    }
  }
}
lines.push('');

const output = lines.join('\n');
const outputPath = 'testdata/sim_soldier_50runs_result.txt';
writeFileSync(outputPath, output, 'utf-8');

console.log('\n══════════════════════════════════════════════');
console.log(`  생존율:   ${survRate}%`);
console.log(`  평균일:   D${avgDay}`);
console.log(`  평균킬:   ${avgKills}`);
console.log(`  보스킬:   ${avgBossKill}`);
console.log(`  히든:     ${avgHidden}/5`);
console.log(`\n결과 저장: ${outputPath}`);
