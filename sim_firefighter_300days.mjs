#!/usr/bin/env node
// === 300일 생존 시뮬레이션 + 히든 요소 + 퀘스트 (박영철 · 소방관) ===
// node sim_firefighter_300days.mjs

import { writeFileSync } from 'fs';

// ─────────────────────────────────────────────────────────────
//  상수
// ─────────────────────────────────────────────────────────────
const TP_PER_DAY     = 72;
const TARGET_DAYS    = 300;
const TARGET_TP      = TARGET_DAYS * TP_PER_DAY;
const NUM_RUNS       = 50;

// ─── 캐릭터 설정 (6인) ──────────────────────────────────────
const CHARACTER_CONFIGS = {
  firefighter: {
    name: '박영철 (소방관)', icon: '🔥',
    maxHp: 120, stamina: 136, morale: 60, fatigue: 20,
    startDistrict: 'eunpyeong',
    startInv: { rope: 1, hand_axe: 1, bandage: 1, water_bottle: 1 },
    combatDmgWeapon: [12, 25], combatDmgUnarmed: [6, 12], combatAcc: 0.78, fleeBase: 0.50,
    healBonus: 1.2, fatigueDecayMult: 0.8, statDecayMult: 1.0, noiseMult: 1.0, encounterMult: 1.0,
    craftSavePct: 0.30, structDuraMult: 1.0,
    skills: { unarmed: 3, melee: 2, defense: 2, building: 3, scavenging: 2, crafting: 2, medicine: 1 },
    hasQuests: true, charType: 'firefighter',
  },
  doctor: {
    name: '이지수 (의사)', icon: '🩺',
    maxHp: 95, stamina: 84, morale: 65, fatigue: 10,
    startDistrict: 'dongjak',
    startInv: { bandage: 2, antiseptic: 1, water_bottle: 1 },
    combatDmgWeapon: [8, 16], combatDmgUnarmed: [3, 7], combatAcc: 0.65, fleeBase: 0.65,
    healBonus: 1.5, fatigueDecayMult: 1.0, statDecayMult: 1.0, noiseMult: 1.0, encounterMult: 1.0,
    craftSavePct: 0, structDuraMult: 1.0,
    skills: { unarmed: 1, melee: 1, defense: 1, building: 1, scavenging: 2, crafting: 1, medicine: 4 },
    hasQuests: true, charType: 'doctor',
  },
  soldier: {
    name: '강민준 (군인)', icon: '⚔️',
    maxHp: 110, stamina: 113, morale: 70, fatigue: 10,
    startDistrict: 'dobong',
    startInv: { knife: 1, water_bottle: 1, alcohol_swab: 2, bandage: 1 },
    combatDmgWeapon: [14, 28], combatDmgUnarmed: [8, 14], combatAcc: 0.82, fleeBase: 0.35,
    healBonus: 1.0, fatigueDecayMult: 0.7, statDecayMult: 1.0, noiseMult: 0.6, encounterMult: 1.0,
    craftSavePct: 0, structDuraMult: 1.0,
    skills: { unarmed: 3, melee: 4, defense: 3, building: 1, scavenging: 1, crafting: 1, medicine: 1 },
    hasQuests: true, charType: 'soldier',
  },
  homeless: {
    name: '최형식 (노숙인)', icon: '🏕️',
    maxHp: 65, stamina: 40, morale: 50, fatigue: 15,
    startDistrict: 'yangcheon',
    startInv: { water_bottle: 1 },
    combatDmgWeapon: [7, 14], combatDmgUnarmed: [4, 8], combatAcc: 0.58, fleeBase: 0.70,
    healBonus: 1.0, fatigueDecayMult: 1.0, statDecayMult: 0.80, noiseMult: 0.8, encounterMult: 0.95,
    craftSavePct: 0, structDuraMult: 1.0,
    skills: { unarmed: 2, melee: 1, defense: 1, building: 1, scavenging: 4, crafting: 1, medicine: 1 },
    hasQuests: true, charType: 'homeless',
  },
  pharmacist: {
    name: '한소희 (약사)', icon: '💊',
    maxHp: 80, stamina: 60, morale: 60, fatigue: 10,
    startDistrict: 'gwanak',
    startInv: { antiseptic: 1, painkiller: 1, water_bottle: 1 },
    combatDmgWeapon: [8, 16], combatDmgUnarmed: [3, 7], combatAcc: 0.65, fleeBase: 0.65,
    healBonus: 1.4, fatigueDecayMult: 1.0, statDecayMult: 1.0, noiseMult: 1.0, encounterMult: 1.0,
    craftSavePct: 0, structDuraMult: 1.0,
    skills: { unarmed: 1, melee: 1, defense: 1, building: 1, scavenging: 1, crafting: 3, medicine: 3 },
    hasQuests: true, charType: 'pharmacist',
  },
  engineer: {
    name: '정대한 (기계공)', icon: '🔧',
    maxHp: 110, stamina: 113, morale: 55, fatigue: 10,
    startDistrict: 'nowon',
    startInv: { scrap_metal: 2, wire: 1, water_bottle: 1 },
    combatDmgWeapon: [9, 18], combatDmgUnarmed: [4, 9], combatAcc: 0.70, fleeBase: 0.55,
    healBonus: 1.0, fatigueDecayMult: 1.0, statDecayMult: 1.0, noiseMult: 1.0, encounterMult: 1.0,
    craftSavePct: 0.15, structDuraMult: 1.5,
    skills: { unarmed: 1, melee: 1, defense: 1, building: 4, scavenging: 1, crafting: 4, medicine: 1 },
    hasQuests: true, charType: 'engineer',
  },
};

const STAT_DECAY = {
  hydration: 1.5,
  nutrition: 0.5,
  morale:    0.2,
  fatigue:   0.64,   // 0.8 * 0.8 (fatigueDecay: -0.2)
};

const SEASON_MODS = {
  // 봄: 감염 위협 (소독약/붕대 없으면 감염 빠르게 진행)
  spring: { hydrationMult: 1.0, tempDecay: 0,    tempRise: 0,    infectionMult: 1.8, encounterMult: 1.0, nutDecayMult: 1.0 },
  // 여름: 탈수 + 폭염 (물 확보 안 하면 체온 80+ → 열사병)
  //   hydrationMult 1.7: 1일 183 감소, 물병 약 2.3개/일 필요
  summer: { hydrationMult: 1.7, tempDecay: 0,    tempRise: 0.4,  infectionMult: 1.2, encounterMult: 1.0, nutDecayMult: 1.1 },
  // 가을: 산성비 식량 파괴 + 감염 증가 (식량 비축 없으면 영양 위기)
  //   nutDecayMult 1.25: 적극적 식량 수집 강제
  autumn: { hydrationMult: 0.9, tempDecay: -0.3, tempRise: 0,    infectionMult: 1.8, encounterMult: 1.1, nutDecayMult: 1.25 },
  // 겨울: 혹한 (모닥불 or 방한복 없으면 저체온증)
  //   tempDecay -2.0: 모닥불 없으면 체온 급락, 방한복 있으면 -1.0
  winter: { hydrationMult: 0.8, tempDecay: -2.0, tempRise: 0,    infectionMult: 1.0, encounterMult: 0.8, nutDecayMult: 1.1 },
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

// ─── 구(District) 데이터 (5단계 난이도 반영) ──────────────
// dl 업데이트: 종로/중구/송파→5, 서대문/서초/영등포→4, 강남/용산/마포/성동→3
// enc: getEncounterRate(dl) 기반 — 10/15/25/35/45%
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

function getEncounterRate(dl) {
  // 실제 시뮬레이션 밸런스: 표준치보다 약간 낮게 설정
  return [0, 0.05, 0.10, 0.20, 0.30, 0.40][clamp(dl, 1, 5)];
}

// ─── 적 데이터 (5단계) ──────────────────────────────────────
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

// ─── 이지수 메인 퀘스트 정의 (30개) ──────────────────────────
const DOCTOR_QUESTS = [
  { id:'mq_doctor_01', title:'삼성병원 생존자',  dayTrigger:1,  prerequisite:null,            objective:{type:'collect_item_type',itemType:'food',count:3},          deadlineDays:10,       reward:{morale:5} },
  { id:'mq_doctor_02', title:'처치실 방벽',      dayTrigger:2,  prerequisite:'mq_doctor_01',  objective:{type:'craft_structure',count:1},                             deadlineDays:12,       reward:{morale:5, bandage:2} },
  { id:'mq_doctor_03', title:'응급 처치 준비',   dayTrigger:4,  prerequisite:'mq_doctor_02',  objective:{type:'collect_item',definitionId:'bandage',count:3},         deadlineDays:14,       reward:{morale:5} },
  { id:'mq_doctor_04', title:'환자 수액',        dayTrigger:6,  prerequisite:'mq_doctor_03',  objective:{type:'collect_clean_water',count:3},                         deadlineDays:16,       reward:{morale:5} },
  { id:'mq_doctor_05', title:'임시 의무실',      dayTrigger:8,  prerequisite:'mq_doctor_04',  objective:{type:'collect_item_type',itemType:'medical',count:3},        deadlineDays:18,       reward:{morale:5} },
  { id:'mq_doctor_06', title:'약초 채취',        dayTrigger:10, prerequisite:'mq_doctor_05',  objective:{type:'collect_item',definitionId:'herb',count:2},            deadlineDays:20,       reward:{morale:5} },
  { id:'mq_doctor_07', title:'첫 번째 치료약',   dayTrigger:13, prerequisite:'mq_doctor_06',  objective:{type:'craft_medical',count:1},                               deadlineDays:23,       reward:{morale:8, bandage:1} },
  { id:'mq_doctor_08', title:'원정 의료 물자',   dayTrigger:15, prerequisite:'mq_doctor_07',  objective:{type:'collect_item_type',itemType:'medical',count:5},        deadlineDays:30,       reward:{morale:8} },
  { id:'mq_doctor_09', title:'홍대 약국 경유',   dayTrigger:18, prerequisite:'mq_doctor_08',  objective:{type:'visit_district',districtId:'mapo'},                    deadlineDays:35,       reward:{morale:10, antiseptic:1} },
  { id:'mq_doctor_10', title:'야전 소독',        dayTrigger:21, prerequisite:'mq_doctor_09',  objective:{type:'collect_item',definitionId:'antiseptic',count:2},      deadlineDays:38,       reward:{morale:5} },
  { id:'mq_doctor_11', title:'이동 수분',        dayTrigger:24, prerequisite:'mq_doctor_10',  objective:{type:'collect_clean_water',count:5},                         deadlineDays:40,       reward:{morale:5} },
  { id:'mq_doctor_12', title:'세브란스 연구소',  dayTrigger:28, prerequisite:'mq_doctor_11',  objective:{type:'visit_district',districtId:'seodaemun'},               deadlineDays:55,       reward:{morale:15} },
  { id:'mq_doctor_13', title:'데이터 분석 시약', dayTrigger:32, prerequisite:'mq_doctor_12',  objective:{type:'collect_item',definitionId:'first_aid_kit',count:2},  deadlineDays:60,       reward:{morale:8} },
  { id:'mq_doctor_14', title:'연구 기간',        dayTrigger:35, prerequisite:'mq_doctor_13',  objective:{type:'survive_days',count:35},                               deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_doctor_15', title:'연구 기간 비축',   dayTrigger:38, prerequisite:'mq_doctor_14',  objective:{type:'collect_item_type',itemType:'food',count:5},           deadlineDays:60,       reward:{morale:5} },
  { id:'mq_doctor_16', title:'치료제 초안',      dayTrigger:40, prerequisite:'mq_doctor_15',  objective:{type:'craft_medical',count:2},                               deadlineDays:65,       reward:{morale:10} },
  { id:'mq_doctor_17', title:'천연 항바이러스',  dayTrigger:43, prerequisite:'mq_doctor_16',  objective:{type:'collect_item',definitionId:'herb',count:5},            deadlineDays:68,       reward:{morale:8} },
  { id:'mq_doctor_18', title:'대규모 치료',      dayTrigger:46, prerequisite:'mq_doctor_17',  objective:{type:'collect_item_type',itemType:'medical',count:8},        deadlineDays:72,       reward:{morale:10} },
  { id:'mq_doctor_19', title:'치료소 설치',      dayTrigger:49, prerequisite:'mq_doctor_18',  objective:{type:'craft_structure',count:2},                             deadlineDays:76,       reward:{morale:10} },
  { id:'mq_doctor_20', title:'동작구 치료 활동', dayTrigger:52, prerequisite:'mq_doctor_19',  objective:{type:'visit_district',districtId:'dongjak'},                deadlineDays:80,       reward:{morale:12} },
  { id:'mq_doctor_21', title:'부상자 치료',      dayTrigger:55, prerequisite:'mq_doctor_20',  objective:{type:'collect_item',definitionId:'bandage',count:8},         deadlineDays:83,       reward:{morale:8} },
  { id:'mq_doctor_22', title:'최종 프로토콜',    dayTrigger:58, prerequisite:'mq_doctor_21',  objective:{type:'craft_medical',count:3},                               deadlineDays:88,       reward:{morale:15} },
  { id:'mq_doctor_23', title:'60일 기록',        dayTrigger:62, prerequisite:'mq_doctor_22',  objective:{type:'survive_days',count:60},                               deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_doctor_24', title:'삼성병원 귀환',    dayTrigger:65, prerequisite:'mq_doctor_23',  objective:{type:'visit_district',districtId:'gangnam'},                 deadlineDays:90,       reward:{morale:15} },
  { id:'mq_doctor_25', title:'허브 물자 비축',   dayTrigger:68, prerequisite:'mq_doctor_24',  objective:{type:'collect_item',definitionId:'first_aid_kit',count:5},  deadlineDays:92,       reward:{morale:10} },
  { id:'mq_doctor_26', title:'의료 시설 확충',   dayTrigger:71, prerequisite:'mq_doctor_25',  objective:{type:'craft_structure',count:3},                             deadlineDays:95,       reward:{morale:10} },
  { id:'mq_doctor_27', title:'대규모 배포 물자', dayTrigger:74, prerequisite:'mq_doctor_26',  objective:{type:'collect_item_type',itemType:'medical',count:10},       deadlineDays:97,       reward:{morale:12} },
  { id:'mq_doctor_28', title:'치료약 대량 생산', dayTrigger:78, prerequisite:'mq_doctor_27',  objective:{type:'craft_medical',count:5},                               deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_doctor_29', title:'의료 허브 완성',   dayTrigger:83, prerequisite:'mq_doctor_28',  objective:{type:'collect_clean_water',count:10},                        deadlineDays:Infinity, reward:{morale:20} },
  { id:'mq_doctor_30', title:'100일의 기록',     dayTrigger:88, prerequisite:'mq_doctor_29',  objective:{type:'survive_days',count:100},                              deadlineDays:Infinity, reward:{morale:25} },
];

// ─── 강민준 메인 퀘스트 정의 (30개) ──────────────────────────
const SOLDIER_QUESTS = [
  { id:'mq_soldier_01', title:'용산 기지 생존',  dayTrigger:1,  prerequisite:null,             objective:{type:'collect_item',definitionId:'knife',count:1},              deadlineDays:10,       reward:{morale:5} },
  { id:'mq_soldier_02', title:'방어선 구축',     dayTrigger:2,  prerequisite:'mq_soldier_01',  objective:{type:'craft_structure',count:1},                                deadlineDays:12,       reward:{morale:5, bandage:2} },
  { id:'mq_soldier_03', title:'야전 보급',       dayTrigger:4,  prerequisite:'mq_soldier_02',  objective:{type:'collect_item_type',itemType:'food',count:5},               deadlineDays:14,       reward:{morale:5} },
  { id:'mq_soldier_04', title:'무전기 복원',     dayTrigger:6,  prerequisite:'mq_soldier_03',  objective:{type:'collect_item',definitionId:'electronic_parts',count:2},   deadlineDays:16,       reward:{morale:8} },
  { id:'mq_soldier_05', title:'야전 응급처치',   dayTrigger:8,  prerequisite:'mq_soldier_04',  objective:{type:'collect_item',definitionId:'bandage',count:3},            deadlineDays:18,       reward:{morale:5} },
  { id:'mq_soldier_06', title:'무기 정비',       dayTrigger:10, prerequisite:'mq_soldier_05',  objective:{type:'collect_item',definitionId:'scrap_metal',count:3},        deadlineDays:20,       reward:{morale:5} },
  { id:'mq_soldier_07', title:'원정 식량',       dayTrigger:13, prerequisite:'mq_soldier_06',  objective:{type:'collect_item_type',itemType:'food',count:3},               deadlineDays:23,       reward:{morale:5} },
  { id:'mq_soldier_08', title:'광화문 돌파',     dayTrigger:15, prerequisite:'mq_soldier_07',  objective:{type:'visit_district',districtId:'jongno'},                     deadlineDays:40,       reward:{morale:15} },
  { id:'mq_soldier_09', title:'탈출 로프',       dayTrigger:18, prerequisite:'mq_soldier_08',  objective:{type:'collect_item',definitionId:'rope',count:2},               deadlineDays:43,       reward:{morale:5} },
  { id:'mq_soldier_10', title:'통신 강화',       dayTrigger:21, prerequisite:'mq_soldier_09',  objective:{type:'collect_item',definitionId:'electronic_parts',count:2},   deadlineDays:46,       reward:{morale:5} },
  { id:'mq_soldier_11', title:'전우의 인식표',   dayTrigger:24, prerequisite:'mq_soldier_10',  objective:{type:'collect_item',definitionId:'knife',count:2},              deadlineDays:50,       reward:{morale:15} },
  { id:'mq_soldier_12', title:'전진 거점',       dayTrigger:27, prerequisite:'mq_soldier_11',  objective:{type:'craft_structure',count:2},                                deadlineDays:54,       reward:{morale:8} },
  { id:'mq_soldier_13', title:'야간 이동 장비',  dayTrigger:30, prerequisite:'mq_soldier_12',  objective:{type:'collect_item',definitionId:'flashlight',count:2},          deadlineDays:58,       reward:{morale:8} },
  { id:'mq_soldier_14', title:'장거리 보급',     dayTrigger:33, prerequisite:'mq_soldier_13',  objective:{type:'collect_item_type',itemType:'food',count:8},               deadlineDays:62,       reward:{morale:8} },
  { id:'mq_soldier_15', title:'1개월 생존',      dayTrigger:36, prerequisite:'mq_soldier_14',  objective:{type:'survive_days',count:36},                                  deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_soldier_16', title:'KBS 방송국',      dayTrigger:38, prerequisite:'mq_soldier_15',  objective:{type:'visit_district',districtId:'yeongdeungpo'},               deadlineDays:80,       reward:{morale:20} },
  { id:'mq_soldier_17', title:'방송 장비 수리',  dayTrigger:41, prerequisite:'mq_soldier_16',  objective:{type:'collect_item',definitionId:'electronic_parts',count:3},   deadlineDays:83,       reward:{morale:10} },
  { id:'mq_soldier_18', title:'안테나 강화',     dayTrigger:44, prerequisite:'mq_soldier_17',  objective:{type:'collect_item',definitionId:'scrap_metal',count:5},        deadlineDays:86,       reward:{morale:8} },
  { id:'mq_soldier_19', title:'방송 배선',       dayTrigger:47, prerequisite:'mq_soldier_18',  objective:{type:'collect_item',definitionId:'wire',count:3},               deadlineDays:88,       reward:{morale:8} },
  { id:'mq_soldier_20', title:'방송 거점 강화',  dayTrigger:50, prerequisite:'mq_soldier_19',  objective:{type:'craft_structure',count:3},                                deadlineDays:90,       reward:{morale:10} },
  { id:'mq_soldier_21', title:'방송 기간 보급',  dayTrigger:54, prerequisite:'mq_soldier_20',  objective:{type:'collect_item_type',itemType:'food',count:5},               deadlineDays:92,       reward:{morale:5} },
  { id:'mq_soldier_22', title:'군 비상 주파수',  dayTrigger:58, prerequisite:'mq_soldier_21',  objective:{type:'collect_item',definitionId:'electronic_parts',count:5},   deadlineDays:95,       reward:{morale:15} },
  { id:'mq_soldier_23', title:'60일 방송',       dayTrigger:62, prerequisite:'mq_soldier_22',  objective:{type:'survive_days',count:62},                                  deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_soldier_24', title:'생존자 무장',     dayTrigger:65, prerequisite:'mq_soldier_23',  objective:{type:'collect_item',definitionId:'knife',count:3},              deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_soldier_25', title:'집결지 보급',     dayTrigger:68, prerequisite:'mq_soldier_24',  objective:{type:'collect_item_type',itemType:'food',count:10},              deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_soldier_26', title:'집결지 방어',     dayTrigger:71, prerequisite:'mq_soldier_25',  objective:{type:'craft_structure',count:4},                                deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_soldier_27', title:'탈출 루트 정비',  dayTrigger:75, prerequisite:'mq_soldier_26',  objective:{type:'collect_item',definitionId:'rope',count:5},               deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_soldier_28', title:'통신망 확장',     dayTrigger:79, prerequisite:'mq_soldier_27',  objective:{type:'collect_item',definitionId:'electronic_parts',count:4},   deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_soldier_29', title:'의료 지원',       dayTrigger:84, prerequisite:'mq_soldier_28',  objective:{type:'collect_item',definitionId:'bandage',count:8},            deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_soldier_30', title:'서울 집결 완성',  dayTrigger:88, prerequisite:'mq_soldier_29',  objective:{type:'survive_days',count:100},                                 deadlineDays:Infinity, reward:{morale:25} },
];

// ─── 최형식 메인 퀘스트 정의 (30개) ──────────────────────────
const HOMELESS_QUESTS = [
  { id:'mq_homeless_01', title:'다리 아래 생존',  dayTrigger:1,  prerequisite:null,              objective:{type:'collect_item_type',itemType:'food',count:3},          deadlineDays:10,       reward:{morale:5} },
  { id:'mq_homeless_02', title:'첫 번째 불',      dayTrigger:2,  prerequisite:'mq_homeless_01',  objective:{type:'craft_structure',count:1},                             deadlineDays:12,       reward:{morale:5} },
  { id:'mq_homeless_03', title:'거리의 기술',     dayTrigger:4,  prerequisite:'mq_homeless_02',  objective:{type:'collect_item_type',itemType:'material',count:5},       deadlineDays:14,       reward:{morale:5} },
  { id:'mq_homeless_04', title:'한강 정수',       dayTrigger:6,  prerequisite:'mq_homeless_03',  objective:{type:'collect_clean_water',count:3},                         deadlineDays:16,       reward:{morale:5} },
  { id:'mq_homeless_05', title:'한강변 수집',     dayTrigger:8,  prerequisite:'mq_homeless_04',  objective:{type:'collect_item_type',itemType:'food',count:5},           deadlineDays:18,       reward:{morale:5} },
  { id:'mq_homeless_06', title:'고철 채집',       dayTrigger:10, prerequisite:'mq_homeless_05',  objective:{type:'collect_item',definitionId:'scrap_metal',count:3},    deadlineDays:20,       reward:{morale:5} },
  { id:'mq_homeless_07', title:'임시 거점',       dayTrigger:13, prerequisite:'mq_homeless_06',  objective:{type:'craft_structure',count:2},                             deadlineDays:23,       reward:{morale:8} },
  { id:'mq_homeless_08', title:'도하 준비',       dayTrigger:15, prerequisite:'mq_homeless_07',  objective:{type:'collect_clean_water',count:5},                         deadlineDays:30,       reward:{morale:5} },
  { id:'mq_homeless_09', title:'이동 식량',       dayTrigger:18, prerequisite:'mq_homeless_08',  objective:{type:'collect_item_type',itemType:'food',count:8},           deadlineDays:33,       reward:{morale:8} },
  { id:'mq_homeless_10', title:'송파 도착',       dayTrigger:21, prerequisite:'mq_homeless_09',  objective:{type:'visit_district',districtId:'songpa'},                  deadlineDays:40,       reward:{morale:10} },
  { id:'mq_homeless_11', title:'입장 물자',       dayTrigger:24, prerequisite:'mq_homeless_10',  objective:{type:'collect_item_type',itemType:'material',count:8},       deadlineDays:45,       reward:{morale:8} },
  { id:'mq_homeless_12', title:'입장료',          dayTrigger:27, prerequisite:'mq_homeless_11',  objective:{type:'collect_item_type',itemType:'food',count:8},           deadlineDays:50,       reward:{morale:10} },
  { id:'mq_homeless_13', title:'타워 첫 기여',    dayTrigger:30, prerequisite:'mq_homeless_12',  objective:{type:'collect_item',definitionId:'canned_food',count:3},    deadlineDays:55,       reward:{morale:8} },
  { id:'mq_homeless_14', title:'물탱크 공급',     dayTrigger:33, prerequisite:'mq_homeless_13',  objective:{type:'collect_clean_water',count:5},                         deadlineDays:60,       reward:{morale:10} },
  { id:'mq_homeless_15', title:'1개월 생존',      dayTrigger:36, prerequisite:'mq_homeless_14',  objective:{type:'survive_days',count:36},                               deadlineDays:Infinity, reward:{morale:8} },
  { id:'mq_homeless_16', title:'채집 루트 개발',  dayTrigger:38, prerequisite:'mq_homeless_15',  objective:{type:'collect_item_type',itemType:'material',count:10},      deadlineDays:68,       reward:{morale:10} },
  { id:'mq_homeless_17', title:'타워 식량 공급',  dayTrigger:41, prerequisite:'mq_homeless_16',  objective:{type:'collect_item_type',itemType:'food',count:10},          deadlineDays:72,       reward:{morale:10} },
  { id:'mq_homeless_18', title:'타워 시설 보수',  dayTrigger:44, prerequisite:'mq_homeless_17',  objective:{type:'collect_item',definitionId:'scrap_metal',count:8},    deadlineDays:75,       reward:{morale:10} },
  { id:'mq_homeless_19', title:'과거의 파트너',   dayTrigger:47, prerequisite:'mq_homeless_18',  objective:{type:'collect_item',definitionId:'canned_food',count:5},    deadlineDays:80,       reward:{morale:20} },
  { id:'mq_homeless_20', title:'타워 거점 확장',  dayTrigger:50, prerequisite:'mq_homeless_19',  objective:{type:'craft_structure',count:3},                             deadlineDays:83,       reward:{morale:10} },
  { id:'mq_homeless_21', title:'물 공급망',       dayTrigger:54, prerequisite:'mq_homeless_20',  objective:{type:'collect_clean_water',count:8},                         deadlineDays:87,       reward:{morale:10} },
  { id:'mq_homeless_22', title:'물류 조직화',     dayTrigger:58, prerequisite:'mq_homeless_21',  objective:{type:'collect_item_type',itemType:'material',count:15},      deadlineDays:90,       reward:{morale:12} },
  { id:'mq_homeless_23', title:'비상 비축',       dayTrigger:62, prerequisite:'mq_homeless_22',  objective:{type:'collect_item_type',itemType:'food',count:12},          deadlineDays:93,       reward:{morale:10} },
  { id:'mq_homeless_24', title:'타워 방어선',     dayTrigger:65, prerequisite:'mq_homeless_23',  objective:{type:'craft_structure',count:4},                             deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_homeless_25', title:'장기 수자원',     dayTrigger:68, prerequisite:'mq_homeless_24',  objective:{type:'collect_clean_water',count:10},                        deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_homeless_26', title:'공급망 완성',     dayTrigger:71, prerequisite:'mq_homeless_25',  objective:{type:'collect_item_type',itemType:'material',count:15},      deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_homeless_27', title:'비상식량 완비',   dayTrigger:75, prerequisite:'mq_homeless_26',  objective:{type:'collect_item',definitionId:'canned_food',count:10},   deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_homeless_28', title:'타워 보수',       dayTrigger:79, prerequisite:'mq_homeless_27',  objective:{type:'collect_item',definitionId:'scrap_metal',count:10},   deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_homeless_29', title:'타워 요새화',     dayTrigger:84, prerequisite:'mq_homeless_28',  objective:{type:'craft_structure',count:5},                             deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_homeless_30', title:'새 집',           dayTrigger:88, prerequisite:'mq_homeless_29',  objective:{type:'survive_days',count:100},                              deadlineDays:Infinity, reward:{morale:25} },
];

// ─── 한소희 메인 퀘스트 정의 (30개) ──────────────────────────
const PHARMACIST_QUESTS = [
  { id:'mq_pharma_01', title:'약국 재고',        dayTrigger:1,  prerequisite:null,            objective:{type:'collect_item',definitionId:'bandage',count:3},         deadlineDays:10,       reward:{morale:5} },
  { id:'mq_pharma_02', title:'임시 실험실',      dayTrigger:2,  prerequisite:'mq_pharma_01',  objective:{type:'craft_structure',count:1},                             deadlineDays:12,       reward:{morale:5, bandage:2} },
  { id:'mq_pharma_03', title:'감염 관찰 준비',   dayTrigger:4,  prerequisite:'mq_pharma_02',  objective:{type:'collect_item',definitionId:'bandage',count:5},         deadlineDays:14,       reward:{morale:5} },
  { id:'mq_pharma_04', title:'초기 약품 수집',   dayTrigger:6,  prerequisite:'mq_pharma_03',  objective:{type:'collect_item_type',itemType:'medical',count:3},        deadlineDays:16,       reward:{morale:5} },
  { id:'mq_pharma_05', title:'천연 시료',        dayTrigger:8,  prerequisite:'mq_pharma_04',  objective:{type:'collect_item',definitionId:'herb',count:3},            deadlineDays:18,       reward:{morale:5} },
  { id:'mq_pharma_06', title:'시료 용매',        dayTrigger:10, prerequisite:'mq_pharma_05',  objective:{type:'collect_clean_water',count:3},                         deadlineDays:20,       reward:{morale:5} },
  { id:'mq_pharma_07', title:'1차 합성 시도',    dayTrigger:13, prerequisite:'mq_pharma_06',  objective:{type:'craft_medical',count:1},                               deadlineDays:23,       reward:{morale:8} },
  { id:'mq_pharma_08', title:'원정 의료 물자',   dayTrigger:15, prerequisite:'mq_pharma_07',  objective:{type:'collect_item_type',itemType:'medical',count:5},        deadlineDays:30,       reward:{morale:8} },
  { id:'mq_pharma_09', title:'홍대 약국 귀환',   dayTrigger:18, prerequisite:'mq_pharma_08',  objective:{type:'visit_district',districtId:'mapo'},                    deadlineDays:35,       reward:{morale:10} },
  { id:'mq_pharma_10', title:'약초 채취',        dayTrigger:21, prerequisite:'mq_pharma_09',  objective:{type:'collect_item',definitionId:'herb',count:5},            deadlineDays:40,       reward:{morale:8} },
  { id:'mq_pharma_11', title:'시약 추출',        dayTrigger:24, prerequisite:'mq_pharma_10',  objective:{type:'collect_item',definitionId:'first_aid_kit',count:3},  deadlineDays:45,       reward:{morale:8} },
  { id:'mq_pharma_12', title:'소독 연구',        dayTrigger:27, prerequisite:'mq_pharma_11',  objective:{type:'collect_item',definitionId:'antiseptic',count:3},     deadlineDays:50,       reward:{morale:8} },
  { id:'mq_pharma_13', title:'정제수',           dayTrigger:30, prerequisite:'mq_pharma_12',  objective:{type:'collect_clean_water',count:5},                         deadlineDays:55,       reward:{morale:5} },
  { id:'mq_pharma_14', title:'서울대 연구소',    dayTrigger:33, prerequisite:'mq_pharma_13',  objective:{type:'visit_district',districtId:'gwanak'},                  deadlineDays:60,       reward:{morale:15} },
  { id:'mq_pharma_15', title:'연구소 물자',      dayTrigger:36, prerequisite:'mq_pharma_14',  objective:{type:'collect_item_type',itemType:'medical',count:8},        deadlineDays:63,       reward:{morale:8} },
  { id:'mq_pharma_16', title:'1차 합성',         dayTrigger:38, prerequisite:'mq_pharma_15',  objective:{type:'craft_medical',count:2},                               deadlineDays:68,       reward:{morale:10} },
  { id:'mq_pharma_17', title:'천연 재료 수집',   dayTrigger:41, prerequisite:'mq_pharma_16',  objective:{type:'collect_item',definitionId:'herb',count:8},            deadlineDays:72,       reward:{morale:8} },
  { id:'mq_pharma_18', title:'임상 시약',        dayTrigger:44, prerequisite:'mq_pharma_17',  objective:{type:'collect_item',definitionId:'first_aid_kit',count:5},  deadlineDays:75,       reward:{morale:8} },
  { id:'mq_pharma_19', title:'2차 합성 개선',    dayTrigger:47, prerequisite:'mq_pharma_18',  objective:{type:'craft_medical',count:3},                               deadlineDays:78,       reward:{morale:12} },
  { id:'mq_pharma_20', title:'임상 시험 물자',   dayTrigger:50, prerequisite:'mq_pharma_19',  objective:{type:'collect_item_type',itemType:'medical',count:10},       deadlineDays:82,       reward:{morale:10} },
  { id:'mq_pharma_21', title:'최종 합성',        dayTrigger:54, prerequisite:'mq_pharma_20',  objective:{type:'craft_medical',count:4},                               deadlineDays:86,       reward:{morale:18, antibiotics:1} },
  { id:'mq_pharma_22', title:'배포 거점',        dayTrigger:58, prerequisite:'mq_pharma_21',  objective:{type:'craft_structure',count:2},                             deadlineDays:90,       reward:{morale:12} },
  { id:'mq_pharma_23', title:'연구 지속',        dayTrigger:62, prerequisite:'mq_pharma_22',  objective:{type:'survive_days',count:62},                               deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_pharma_24', title:'환자 치료',        dayTrigger:65, prerequisite:'mq_pharma_23',  objective:{type:'collect_item',definitionId:'bandage',count:10},        deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_pharma_25', title:'대규모 배포',      dayTrigger:68, prerequisite:'mq_pharma_24',  objective:{type:'collect_item_type',itemType:'medical',count:12},       deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_pharma_26', title:'대량 생산',        dayTrigger:71, prerequisite:'mq_pharma_25',  objective:{type:'craft_medical',count:5},                               deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_pharma_27', title:'배포 키트',        dayTrigger:75, prerequisite:'mq_pharma_26',  objective:{type:'collect_item',definitionId:'first_aid_kit',count:8},  deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_pharma_28', title:'지속 원료',        dayTrigger:79, prerequisite:'mq_pharma_27',  objective:{type:'collect_item',definitionId:'herb',count:10},           deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_pharma_29', title:'약국 거점',        dayTrigger:84, prerequisite:'mq_pharma_28',  objective:{type:'craft_structure',count:3},                             deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_pharma_30', title:'치료의 증명',      dayTrigger:88, prerequisite:'mq_pharma_29',  objective:{type:'survive_days',count:100},                              deadlineDays:Infinity, reward:{morale:25} },
];

// ─── 정대한 메인 퀘스트 정의 (30개) ──────────────────────────
const ENGINEER_QUESTS = [
  { id:'mq_eng_01', title:'기본 고철',     dayTrigger:1,  prerequisite:null,         objective:{type:'collect_item',definitionId:'scrap_metal',count:3},        deadlineDays:10,       reward:{morale:5} },
  { id:'mq_eng_02', title:'작업장 확보',   dayTrigger:2,  prerequisite:'mq_eng_01',  objective:{type:'craft_structure',count:1},                                 deadlineDays:12,       reward:{morale:5, scrap_metal:2} },
  { id:'mq_eng_03', title:'전자부품 수거', dayTrigger:4,  prerequisite:'mq_eng_02',  objective:{type:'collect_item',definitionId:'electronic_parts',count:3},   deadlineDays:14,       reward:{morale:5} },
  { id:'mq_eng_04', title:'배선 재료',     dayTrigger:6,  prerequisite:'mq_eng_03',  objective:{type:'collect_item',definitionId:'wire',count:3},               deadlineDays:16,       reward:{morale:5} },
  { id:'mq_eng_05', title:'추가 고철',     dayTrigger:8,  prerequisite:'mq_eng_04',  objective:{type:'collect_item',definitionId:'scrap_metal',count:5},        deadlineDays:18,       reward:{morale:5} },
  { id:'mq_eng_06', title:'목재 프레임',   dayTrigger:10, prerequisite:'mq_eng_05',  objective:{type:'collect_item',definitionId:'wood',count:5},               deadlineDays:20,       reward:{morale:5} },
  { id:'mq_eng_07', title:'아버지의 메모', dayTrigger:13, prerequisite:'mq_eng_06',  objective:{type:'collect_item',definitionId:'rope',count:2},               deadlineDays:23,       reward:{morale:8} },
  { id:'mq_eng_08', title:'발전기 수리',   dayTrigger:15, prerequisite:'mq_eng_07',  objective:{type:'collect_item',definitionId:'electronic_parts',count:3},   deadlineDays:30,       reward:{morale:8} },
  { id:'mq_eng_09', title:'이동 중 고철', dayTrigger:18, prerequisite:'mq_eng_08',  objective:{type:'collect_item',definitionId:'scrap_metal',count:5},        deadlineDays:35,       reward:{morale:5} },
  { id:'mq_eng_10', title:'성수동 복귀',   dayTrigger:21, prerequisite:'mq_eng_09',  objective:{type:'visit_district',districtId:'seongdong'},                  deadlineDays:42,       reward:{morale:10} },
  { id:'mq_eng_11', title:'아버지의 설계도',dayTrigger:24,prerequisite:'mq_eng_10',  objective:{type:'collect_item',definitionId:'wire',count:5},               deadlineDays:48,       reward:{morale:12} },
  { id:'mq_eng_12', title:'차체 골격',     dayTrigger:27, prerequisite:'mq_eng_11',  objective:{type:'collect_item',definitionId:'scrap_metal',count:8},        deadlineDays:55,       reward:{morale:10} },
  { id:'mq_eng_13', title:'조향 장치',     dayTrigger:30, prerequisite:'mq_eng_12',  objective:{type:'collect_item',definitionId:'rope',count:3},               deadlineDays:60,       reward:{morale:8} },
  { id:'mq_eng_14', title:'바퀴 재료',     dayTrigger:33, prerequisite:'mq_eng_13',  objective:{type:'collect_item',definitionId:'rubber',count:3},             deadlineDays:63,       reward:{morale:8} },
  { id:'mq_eng_15', title:'설계 기간',     dayTrigger:36, prerequisite:'mq_eng_14',  objective:{type:'survive_days',count:36},                                  deadlineDays:Infinity, reward:{morale:8} },
  { id:'mq_eng_16', title:'전기 모터',     dayTrigger:38, prerequisite:'mq_eng_15',  objective:{type:'collect_item',definitionId:'electronic_parts',count:5},   deadlineDays:68,       reward:{morale:12} },
  { id:'mq_eng_17', title:'차체 조립',     dayTrigger:41, prerequisite:'mq_eng_16',  objective:{type:'collect_item',definitionId:'nail',count:10},              deadlineDays:72,       reward:{morale:8} },
  { id:'mq_eng_18', title:'차체 완성',     dayTrigger:44, prerequisite:'mq_eng_17',  objective:{type:'collect_item',definitionId:'scrap_metal',count:10},       deadlineDays:76,       reward:{morale:12} },
  { id:'mq_eng_19', title:'조향 완성',     dayTrigger:47, prerequisite:'mq_eng_18',  objective:{type:'collect_item',definitionId:'rope',count:5},               deadlineDays:80,       reward:{morale:10} },
  { id:'mq_eng_20', title:'배터리 확보',   dayTrigger:50, prerequisite:'mq_eng_19',  objective:{type:'collect_item',definitionId:'electronic_parts',count:3},   deadlineDays:83,       reward:{morale:10} },
  { id:'mq_eng_21', title:'수리 도구',     dayTrigger:54, prerequisite:'mq_eng_20',  objective:{type:'craft_structure',count:2},                                 deadlineDays:87,       reward:{morale:8} },
  { id:'mq_eng_22', title:'전기 배선 완성',dayTrigger:58, prerequisite:'mq_eng_21',  objective:{type:'collect_item',definitionId:'wire',count:8},               deadlineDays:90,       reward:{morale:12} },
  { id:'mq_eng_23', title:'구로 시운전',   dayTrigger:62, prerequisite:'mq_eng_22',  objective:{type:'visit_district',districtId:'guro'},                       deadlineDays:93,       reward:{morale:18} },
  { id:'mq_eng_24', title:'최종 보강',     dayTrigger:65, prerequisite:'mq_eng_23',  objective:{type:'collect_item',definitionId:'scrap_metal',count:15},       deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_eng_25', title:'최종 전장',     dayTrigger:68, prerequisite:'mq_eng_24',  objective:{type:'collect_item',definitionId:'electronic_parts',count:8},   deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_eng_26', title:'탈출 짐 고정',  dayTrigger:71, prerequisite:'mq_eng_25',  objective:{type:'collect_item',definitionId:'rope',count:8},               deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_eng_27', title:'탈출 식량',     dayTrigger:75, prerequisite:'mq_eng_26',  objective:{type:'collect_item_type',itemType:'food',count:10},             deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_eng_28', title:'탈출 준비',     dayTrigger:79, prerequisite:'mq_eng_27',  objective:{type:'craft_structure',count:3},                                 deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_eng_29', title:'탈출 물자',     dayTrigger:84, prerequisite:'mq_eng_28',  objective:{type:'collect_clean_water',count:10},                           deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_eng_30', title:'탈출 기계',     dayTrigger:88, prerequisite:'mq_eng_29',  objective:{type:'survive_days',count:100},                                 deadlineDays:Infinity, reward:{morale:25} },
];

// ─── 박영철 메인 퀘스트 정의 (30개) ──────────────────────────
const FIREFIGHTER_QUESTS = [
  { id:'mq_fire_01', title:'화재 현장 탈출', dayTrigger:1,  prerequisite:null,          objective:{type:'collect_item_type',itemType:'food',count:3},          deadlineDays:10,       reward:{morale:5} },
  { id:'mq_fire_02', title:'임시 구호소',    dayTrigger:2,  prerequisite:'mq_fire_01',  objective:{type:'craft_structure',count:1},                             deadlineDays:12,       reward:{morale:5, rope:1} },
  { id:'mq_fire_03', title:'이재훈을 위해',  dayTrigger:4,  prerequisite:'mq_fire_02',  objective:{type:'collect_item_type',itemType:'medical',count:3},        deadlineDays:14,       reward:{morale:5} },
  { id:'mq_fire_04', title:'로프 확보',      dayTrigger:6,  prerequisite:'mq_fire_03',  objective:{type:'collect_item',definitionId:'rope',count:2},            deadlineDays:16,       reward:{morale:5} },
  { id:'mq_fire_05', title:'동료의 식량',    dayTrigger:8,  prerequisite:'mq_fire_04',  objective:{type:'collect_item_type',itemType:'food',count:5},           deadlineDays:18,       reward:{morale:5} },
  { id:'mq_fire_06', title:'부상자 치료',    dayTrigger:10, prerequisite:'mq_fire_05',  objective:{type:'collect_item',definitionId:'bandage',count:5},         deadlineDays:20,       reward:{morale:5} },
  { id:'mq_fire_07', title:'소방서 거점',    dayTrigger:13, prerequisite:'mq_fire_06',  objective:{type:'craft_structure',count:2},                             deadlineDays:23,       reward:{morale:8} },
  { id:'mq_fire_08', title:'이동 식량',      dayTrigger:15, prerequisite:'mq_fire_07',  objective:{type:'collect_item_type',itemType:'food',count:5},           deadlineDays:30,       reward:{morale:5} },
  { id:'mq_fire_09', title:'옥상 루트',      dayTrigger:18, prerequisite:'mq_fire_08',  objective:{type:'collect_item',definitionId:'rope',count:3},            deadlineDays:33,       reward:{morale:5} },
  { id:'mq_fire_10', title:'서대문 도착',    dayTrigger:21, prerequisite:'mq_fire_09',  objective:{type:'visit_district',districtId:'seodaemun'},               deadlineDays:45,       reward:{morale:10} },
  { id:'mq_fire_11', title:'중간 의료 물자', dayTrigger:24, prerequisite:'mq_fire_10',  objective:{type:'collect_item_type',itemType:'medical',count:5},        deadlineDays:48,       reward:{morale:8} },
  { id:'mq_fire_12', title:'임시 다리',      dayTrigger:27, prerequisite:'mq_fire_11',  objective:{type:'collect_item',definitionId:'wood',count:5},            deadlineDays:52,       reward:{morale:5} },
  { id:'mq_fire_13', title:'이동 중 수분',   dayTrigger:30, prerequisite:'mq_fire_12',  objective:{type:'collect_clean_water',count:5},                         deadlineDays:55,       reward:{morale:5} },
  { id:'mq_fire_14', title:'서대문 전진 기지',dayTrigger:33,prerequisite:'mq_fire_13',  objective:{type:'craft_structure',count:2},                             deadlineDays:58,       reward:{morale:8} },
  { id:'mq_fire_15', title:'은평 도착',      dayTrigger:36, prerequisite:'mq_fire_14',  objective:{type:'visit_district',districtId:'eunpyeong'},               deadlineDays:65,       reward:{morale:20} },
  { id:'mq_fire_16', title:'가족 식량',      dayTrigger:38, prerequisite:'mq_fire_15',  objective:{type:'collect_item_type',itemType:'food',count:8},           deadlineDays:68,       reward:{morale:10} },
  { id:'mq_fire_17', title:'가족 거점',      dayTrigger:41, prerequisite:'mq_fire_16',  objective:{type:'craft_structure',count:3},                             deadlineDays:72,       reward:{morale:10} },
  { id:'mq_fire_18', title:'가족 치료',      dayTrigger:44, prerequisite:'mq_fire_17',  objective:{type:'collect_item',definitionId:'bandage',count:5},         deadlineDays:75,       reward:{morale:8} },
  { id:'mq_fire_19', title:'이재훈의 메모',  dayTrigger:47, prerequisite:'mq_fire_18',  objective:{type:'visit_district',districtId:'seodaemun'},               deadlineDays:80,       reward:{morale:10, first_aid_kit:1} },
  { id:'mq_fire_20', title:'이재훈의 약품',  dayTrigger:50, prerequisite:'mq_fire_19',  objective:{type:'collect_item_type',itemType:'medical',count:5},        deadlineDays:83,       reward:{morale:10} },
  { id:'mq_fire_21', title:'대피소 확장',    dayTrigger:53, prerequisite:'mq_fire_20',  objective:{type:'collect_item',definitionId:'rope',count:5},            deadlineDays:86,       reward:{morale:8} },
  { id:'mq_fire_22', title:'생존자 대피소',  dayTrigger:57, prerequisite:'mq_fire_21',  objective:{type:'craft_structure',count:4},                             deadlineDays:90,       reward:{morale:15} },
  { id:'mq_fire_23', title:'대피소 비축',    dayTrigger:61, prerequisite:'mq_fire_22',  objective:{type:'collect_item_type',itemType:'food',count:10},          deadlineDays:93,       reward:{morale:10} },
  { id:'mq_fire_24', title:'대피소 식수',    dayTrigger:65, prerequisite:'mq_fire_23',  objective:{type:'collect_clean_water',count:8},                         deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_fire_25', title:'방벽 완성',      dayTrigger:68, prerequisite:'mq_fire_24',  objective:{type:'craft_structure',count:5},                             deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_fire_26', title:'의료 강화',      dayTrigger:71, prerequisite:'mq_fire_25',  objective:{type:'collect_item_type',itemType:'medical',count:10},       deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_fire_27', title:'장기 비축',      dayTrigger:75, prerequisite:'mq_fire_26',  objective:{type:'collect_item_type',itemType:'food',count:12},          deadlineDays:Infinity, reward:{morale:12} },
  { id:'mq_fire_28', title:'외부 연결',      dayTrigger:79, prerequisite:'mq_fire_27',  objective:{type:'collect_item',definitionId:'rope',count:5},            deadlineDays:Infinity, reward:{morale:10} },
  { id:'mq_fire_29', title:'이재훈 추모',    dayTrigger:84, prerequisite:'mq_fire_28',  objective:{type:'survive_days',count:84},                               deadlineDays:Infinity, reward:{morale:15} },
  { id:'mq_fire_30', title:'은평의 수호자',  dayTrigger:88, prerequisite:'mq_fire_29',  objective:{type:'survive_days',count:100},                              deadlineDays:Infinity, reward:{morale:25} },
];

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
//  게임 상태 팩토리 (박영철 · 소방관)
// ─────────────────────────────────────────────────────────────
function createGameState(charId = 'firefighter') {
  const cc = CHARACTER_CONFIGS[charId] ?? CHARACTER_CONFIGS.firefighter;
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
    herb: 0, rubber: 0,
  };
  for (const [k, v] of Object.entries(cc.startInv)) startInv[k] = v;

  return {
    day: 1, tpInDay: 0, totalTP: 0,
    cc,  // character config reference
    hp:          cc.maxHp, maxHp: cc.maxHp,
    hydration:   200, maxHydration: 288,
    nutrition:   80,  maxNutrition: 100,
    temperature: 50,  maxTemp: 100,
    morale:      cc.morale, maxMorale: 100,
    radiation:   0,
    infection:   0,
    fatigue:     cc.fatigue,
    stamina:     cc.stamina, maxStamina: cc.stamina,
    noise:       0,
    alive: true,
    deathCause: null,

    currentDistrict: cc.startDistrict,
    districtsLooted: new Set(),
    districtsVisited: new Set([cc.startDistrict]),

    inv: startInv,

    hasCampfire:  false,  campfireDura:  0,
    hasGarden:    false,  gardenDura:    0,
    hasCollector: false,  collectorDura: 0,
    hasWarmClothes: false,

    weather: null,
    weatherDaysLeft: 0,
    seasonTransitioned: new Set(),

    districtLootDay: {},

    totalStructuresCrafted: 0,
    totalMedicalCrafted: 0,

    diseases: [],

    totalKills:   0,
    combatCount:  0,
    fleeCount:    0,

    despairTicks: 0,

    // ─── Phase 2: 스킬 시스템 ───
    skills: {
      unarmed: 3, melee: 2, defense: 2, building: 3,
      scavenging: 2, crafting: 2, medicine: 1,
    },
    skillXp: {
      unarmed: 0, melee: 0, defense: 0, building: 0,
      scavenging: 0, crafting: 0, medicine: 0,
    },

    // ─── Phase 3-5: 히든 콘텐츠 추적 ───
    districtVisitCounts: {},
    hiddenLocationsDiscovered: new Set(),
    bossesEncountered: [],
    bossesKilled: new Set(),
    secretEventsTriggered: new Set(),
    recipesUnlocked: new Set(),
    legendaryItems: [],
    nemesisEncountered: false,
    nemesisKilled: false,
    nemesisDay: 0,

    // ─── 퀘스트 상태 ───
    quests: {
      active:    [],
      completed: [],
      failed:    [],
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

function countMaterial(gs) {
  return gs.inv.wood + gs.inv.rope + gs.inv.cloth + gs.inv.scrap_metal +
         gs.inv.nail + gs.inv.wire + gs.inv.electronic_parts;
}

// ─────────────────────────────────────────────────────────────
//  퀘스트 시스템
// ─────────────────────────────────────────────────────────────
function getCharQuests(gs) {
  switch (gs.cc?.charType) {
    case 'doctor':      return DOCTOR_QUESTS;
    case 'soldier':     return SOLDIER_QUESTS;
    case 'homeless':    return HOMELESS_QUESTS;
    case 'pharmacist':  return PHARMACIST_QUESTS;
    case 'engineer':    return ENGINEER_QUESTS;
    case 'firefighter': return FIREFIGHTER_QUESTS;
    default:            return FIREFIGHTER_QUESTS;
  }
}

function checkQuestTriggers(gs) {
  const quests = getCharQuests(gs);
  for (const qDef of quests) {
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
  const quests = getCharQuests(gs);
  for (let i = gs.quests.active.length - 1; i >= 0; i--) {
    const q = gs.quests.active[i];
    const qDef = quests.find(d => d.id === q.id);
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
        if (obj.itemType === 'food')     progress = countFood(gs);
        else if (obj.itemType === 'medical')  progress = countMedical(gs);
        else if (obj.itemType === 'material') progress = countMaterial(gs);
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
      case 'craft_medical':
        progress = gs.totalMedicalCrafted;
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

      // 보상 지급
      const r = qDef.reward;
      if (r.morale)       gs.morale          = clamp(gs.morale + r.morale, 0, gs.maxMorale);
      if (r.bandage)      gs.inv.bandage      += r.bandage;
      if (r.first_aid_kit)gs.inv.first_aid_kit+= r.first_aid_kit;
      if (r.rope)         gs.inv.rope         += r.rope;
      if (r.antiseptic)   gs.inv.antiseptic   += r.antiseptic;
      if (r.antibiotics)  gs.inv.antibiotics  += r.antibiotics;
      if (r.scrap_metal)  gs.inv.scrap_metal  += r.scrap_metal;
    }
  }
}

function tryCraftMedical(gs) {
  if (gs.inv.herb < 1) return false;
  gs.inv.herb--;
  gs.totalMedicalCrafted++;
  advanceTP(gs);
  return true;
}

// 현재 활성 퀘스트 중 방문해야 할 구역
function getQuestTargetDistrict(gs) {
  const quests = getCharQuests(gs);
  for (const q of gs.quests.active) {
    const qDef = quests.find(d => d.id === q.id);
    if (!qDef) continue;
    if (qDef.objective.type === 'visit_district') {
      const targetId = qDef.objective.districtId;
      if (!gs.districtsVisited.has(targetId)) return targetId;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
//  Phase 2: 스킬 시스템
// ─────────────────────────────────────────────────────────────
const SKILL_XP_TABLE = [0, 50, 120, 220, 360, 550, 800, 1100, 1500, 2000];

function gainSkillXp(gs, skill, amount) {
  if (!gs.skillXp[skill] && gs.skillXp[skill] !== 0) return;
  gs.skillXp[skill] += amount;
  const nextLevel = gs.skills[skill] + 1;
  if (nextLevel < SKILL_XP_TABLE.length && gs.skillXp[skill] >= SKILL_XP_TABLE[nextLevel]) {
    gs.skills[skill] = nextLevel;
    gs.skillXp[skill] = 0;
  }
}

function getSkillBonus(gs, skill) {
  return (gs.skills[skill] ?? 0) * 0.05; // +5% per level
}

// ─────────────────────────────────────────────────────────────
//  Phase 3: 보스 데이터 + 전투 (~15마리, 소방관 접근 가능)
// ─────────────────────────────────────────────────────────────
const SIM_BOSSES = [
  // HP 밸런스: 시뮬레이션용 보정 (원본 대비 ~50-60%, 소방관 무기력 반영)
  { id: 'boss_patient_zero',     name: '제로 환자',       hp: 110, dmg: [20,35], acc: 0.65, def: 2,  regen: 5,  atkPR: 1, districts: ['gangnam'],                    minDay: 60,  season: null,     weather: null,       minDl: 0, isNemesis: false, infOnHit: 15, drop: 'zero_strain' },
  { id: 'boss_acid_queen',       name: '산성 여왕',       hp: 100, dmg: [18,30], acc: 0.68, def: 1,  regen: 0,  atkPR: 1, districts: ['seongdong'],                  minDay: 80,  season: null,     weather: null,       minDl: 0, isNemesis: false, infOnHit: 8,  drop: 'acid_gland' },
  { id: 'boss_horde_mother',     name: '무리의 어미',     hp: 130, dmg: [15,28], acc: 0.60, def: 3,  regen: 0,  atkPR: 1, districts: [],                             minDay: 90,  season: null,     weather: null,       minDl: 3, isNemesis: false, infOnHit: 0,  drop: 'horde_crown' },
  { id: 'boss_frozen_giant',     name: '얼어붙은 거인',   hp: 160, dmg: [25,40], acc: 0.50, def: 6,  regen: 0,  atkPR: 1, districts: [],                             minDay: 0,   season: 'winter', weather: 'blizzard', minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'cryo_core' },
  { id: 'boss_raider_warlord',   name: '약탈자 두목',     hp: 90,  dmg: [22,38], acc: 0.70, def: 3,  regen: 0,  atkPR: 1, districts: ['yeongdeungpo','seocho'],      minDay: 70,  season: null,     weather: null,       minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'warlord_medal' },
  { id: 'boss_mutant_alpha_tiger',name: '변이 호랑이',    hp: 100, dmg: [20,35], acc: 0.72, def: 2,  regen: 0,  atkPR: 1, districts: ['gwangjin'],                   minDay: 50,  season: null,     weather: null,       minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'tiger_fang' },
  { id: 'boss_sewer_king',       name: '하수도의 왕',     hp: 140, dmg: [22,38], acc: 0.60, def: 4,  regen: 0,  atkPR: 1, districts: ['gangdong','gwangjin'],        minDay: 80,  season: null,     weather: 'rainy',    minDl: 0, isNemesis: false, infOnHit: 8,  drop: 'sewer_scale' },
  { id: 'boss_swarm_queen_bee',  name: '변이 여왕벌',     hp: 70,  dmg: [15,25], acc: 0.70, def: 1,  regen: 0,  atkPR: 1, districts: ['dobong','gangbuk'],           minDay: 60,  season: 'summer', weather: null,       minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'royal_jelly_medicine' },
  { id: 'boss_radiation_colossus',name: '방사선 거인',    hp: 180, dmg: [28,45], acc: 0.50, def: 5,  regen: 0,  atkPR: 1, districts: ['jongno'],                     minDay: 100, season: null,     weather: null,       minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'colossus_core' },
  { id: 'boss_cult_leader',      name: '교단 교주',       hp: 70,  dmg: [15,28], acc: 0.65, def: 2,  regen: 0,  atkPR: 1, districts: ['seongbuk','dongdaemun'],      minDay: 100, season: null,     weather: null,       minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'cult_talisman' },
  { id: 'boss_phantom_sniper',   name: '유령 저격수',     hp: 50,  dmg: [35,55], acc: 0.80, def: 1,  regen: 0,  atkPR: 1, districts: ['jongno','junggoo'],           minDay: 120, season: null,     weather: null,       minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'sniper_scope' },
  { id: 'boss_monsoon_leviathan',name: '장마 수괴',       hp: 130, dmg: [18,35], acc: 0.60, def: 4,  regen: 0,  atkPR: 1, districts: ['mapo','yeongdeungpo','yongsan'],minDay:135, season: 'summer', weather: 'monsoon',  minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'leviathan_scale' },
  { id: 'boss_blizzard_wraith',  name: '눈보라의 망령',   hp: 90,  dmg: [18,30], acc: 0.70, def: 2,  regen: 0,  atkPR: 1, districts: [],                             minDay: 0,   season: 'winter', weather: 'blizzard', minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'wraith_essence' },
  { id: 'boss_acid_rain_horror', name: '산성비 괴물',     hp: 110, dmg: [15,28], acc: 0.65, def: 3,  regen: 0,  atkPR: 1, districts: [],                             minDay: 0,   season: 'autumn', weather: 'acid_rain',minDl: 0, isNemesis: false, infOnHit: 0,  drop: 'acid_crystal' },
  // 네메시스
  { id: 'boss_firefighter_nemesis',name:'감염된 이재훈',  hp: 90,  dmg: [20,32], acc: 0.65, def: 2,  regen: 2,  atkPR: 1, districts: ['eunpyeong'],                  minDay: 70,  season: null,     weather: null,       minDl: 0, isNemesis: true,  infOnHit: 8,  drop: 'firefighter_badge' },
];

function checkBossSpawn(gs) {
  // Cooldown: 최소 20일 간격
  const lastBossDay = gs.bossesEncountered.length > 0
    ? gs.bossesEncountered[gs.bossesEncountered.length - 1].day : -99;
  if (gs.day - lastBossDay < 20) return null;

  if (Math.random() > 0.004) return null; // 0.4% per exploration (~1 encounter per 50-60일)
  const season = getSeason(gs.day);
  const d = DISTRICTS[gs.currentDistrict];
  const wId = gs.weather?.id ?? 'sunny';

  for (const boss of SIM_BOSSES) {
    if (gs.bossesKilled.has(boss.id)) continue;
    if (gs.day < boss.minDay) continue;
    if (boss.season && season !== boss.season) continue;
    if (boss.weather && wId !== boss.weather) continue;
    if (boss.minDl > 0 && d.dl < boss.minDl) continue;
    if (boss.districts.length > 0 && !boss.districts.includes(gs.currentDistrict)) continue;
    // Nemesis: 50% additional filter (높은 조우율 보장)
    if (boss.isNemesis && Math.random() > 0.50) continue;
    return boss;
  }
  return null;
}

function simulateBossCombat(gs, boss) {
  gs.bossesEncountered.push({ id: boss.id, day: gs.day });
  if (boss.isNemesis) {
    gs.nemesisEncountered = true;
    gs.nemesisDay = gs.day;
  }

  // Boss combat: flee possible but costly
  const hasWeapon = gs.inv.hand_axe > 0 || gs.inv.knife > 0 || gs.inv.crowbar > 0;

  // Flee attempt: character flee base, +15% if HP < 50%, +15% if no weapon
  let fleeChance = gs.cc.fleeBase - 0.10;
  if (gs.hp < gs.maxHp * 0.5) fleeChance += 0.15;
  if (!hasWeapon) fleeChance += 0.15;
  if (Math.random() < fleeChance) {
    const fleeHit = rand(boss.dmg[0], boss.dmg[1]);
    gs.hp -= Math.floor(fleeHit * 0.6);
    gs.fatigue = clamp(gs.fatigue + 15, 0, 100);
    gs.noise = clamp(gs.noise + 20, 0, 100);
    if (gs.hp <= 0) { kill(gs, `보스 도주 중 부상: ${boss.name}`); return 'defeat'; }
    return 'fled';
  }

  const meleeBonus = 1 + getSkillBonus(gs, 'melee');
  const defenseBonus = 1 + getSkillBonus(gs, 'defense');
  const pDmg = hasWeapon
    ? [Math.floor(gs.cc.combatDmgWeapon[0] * meleeBonus), Math.floor(gs.cc.combatDmgWeapon[1] * meleeBonus)]
    : gs.cc.combatDmgUnarmed;
  const pAcc = gs.cc.combatAcc;

  let bossHp = boss.hp;
  let bossDefRemaining = boss.def;
  let round = 0;
  const maxRounds = 25;

  while (bossHp > 0 && gs.alive && round < maxRounds) {
    round++;
    // Player attacks
    if (Math.random() < pAcc) {
      let dmg = rand(pDmg[0], pDmg[1]);
      dmg = Math.max(1, dmg - Math.floor(bossDefRemaining * 0.2));
      bossHp -= dmg;
      gainSkillXp(gs, 'melee', 3);
      if (bossHp <= 0) break;
    }

    // Boss regen
    bossHp = Math.min(boss.hp, bossHp + boss.regen);

    // Boss attacks (atkPR times)
    for (let a = 0; a < boss.atkPR; a++) {
      if (Math.random() < boss.acc) {
        let dmg = rand(boss.dmg[0], boss.dmg[1]);
        dmg = Math.max(1, Math.floor(dmg / defenseBonus));
        gs.hp -= dmg;
        if (boss.infOnHit > 0) {
          gs.infection = clamp(gs.infection + Math.floor(boss.infOnHit * 0.5), 0, 100);
        }
        gainSkillXp(gs, 'defense', 2);
        checkCombatInjury(gs, dmg);
        if (gs.hp <= 0) { kill(gs, `보스 전투: ${boss.name}`); return 'defeat'; }
      }
    }

    // Defense degrades faster
    bossDefRemaining = Math.max(0, bossDefRemaining - 0.8);

    // Mid-combat flee (round 5+, 20% chance if boss > 30% HP)
    if (round >= 5 && bossHp > boss.hp * 0.3 && Math.random() < 0.20) {
      gs.noise = clamp(gs.noise + 20, 0, 100);
      gs.fatigue = clamp(gs.fatigue + 10, 0, 100);
      return 'fled';
    }
  }

  if (bossHp <= 0) {
    gs.bossesKilled.add(boss.id);
    gs.totalKills++;
    gs.legendaryItems.push(boss.drop);
    gs.morale = clamp(gs.morale + 20, 0, gs.maxMorale);
    gs.noise = clamp(gs.noise + 25, 0, 100);
    gainSkillXp(gs, 'melee', 15);
    gainSkillXp(gs, 'defense', 10);
    if (boss.isNemesis) gs.nemesisKilled = true;
    return 'victory';
  }

  // Timeout — survived
  gs.noise = clamp(gs.noise + 20, 0, 100);
  return 'fled';
}

// ─────────────────────────────────────────────────────────────
//  Phase 4: 히든 장소 발견 시스템 (25개, 조건 간소화)
// ─────────────────────────────────────────────────────────────
const SIM_HIDDEN_LOCATIONS = [
  { id: 'hidden_dobong',     district: 'dobong',      name: '도봉산 은자의 동굴',       minDay: 14,  minVisits: 3, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 8,  bossId: null },
  { id: 'hidden_nowon',      district: 'nowon',       name: '노원 지하상가 비밀 창고',  minDay: 7,   minVisits: 0, reqItems: ['lockpick'],           reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_gangbuk',    district: 'gangbuk',     name: '북한산 숨겨진 샘',         minDay: 30,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: 'rainy',season: null,    morale: 8,  bossId: null },
  { id: 'hidden_eunpyeong',  district: 'eunpyeong',   name: '은평 소방서 지하 창고',    minDay: 20,  minVisits: 0, reqItems: ['crowbar'],            reqChar: 'firefighter', weather: null,   season: null,    morale: 15, bossId: null },
  { id: 'hidden_jongno',     district: 'jongno',      name: '경복궁 지하 왕실 금고',    minDay: 60,  minVisits: 5, reqItems: ['flashlight','lockpick'],reqChar: null,        weather: null,   season: null,    morale: 20, bossId: null },
  { id: 'hidden_seongbuk',   district: 'seongbuk',    name: '고려대 지하 연구 벙커',    minDay: 45,  minVisits: 0, reqItems: ['flashlight'],         reqChar: null,          weather: null,   season: null,    morale: 12, bossId: null },
  { id: 'hidden_dongdaemun', district: 'dongdaemun',  name: '동대문 비밀 공방',         minDay: 25,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_seodaemun',  district: 'seodaemun',   name: '세브란스 P4 연구실',       minDay: 50,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 12, bossId: null },
  { id: 'hidden_mapo',       district: 'mapo',        name: '홍대 라이브클럽 지하',     minDay: 15,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 8,  bossId: null },
  { id: 'hidden_yongsan',    district: 'yongsan',     name: '용산 미군기지 무기고',     minDay: 80,  minVisits: 0, reqItems: ['electronic_parts'],   reqChar: null,          weather: null,   season: null,    morale: 15, bossId: null },
  { id: 'hidden_gangnam',    district: 'gangnam',     name: '삼성병원 봉인 약제실',     minDay: 30,  minVisits: 0, reqItems: ['crowbar'],            reqChar: null,          weather: null,   season: null,    morale: 12, bossId: null },
  { id: 'hidden_dongjak',    district: 'dongjak',     name: '국립현충원 지하 벙커',     minDay: 60,  minVisits: 0, reqItems: ['map_fragment'],       reqChar: null,          weather: null,   season: null,    morale: 12, bossId: null },
  { id: 'hidden_gwanak',     district: 'gwanak',      name: '서울대 연구용 원자로',     minDay: 70,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_guro',       district: 'guro',        name: '구로 디지털단지 대장간',   minDay: 35,  minVisits: 0, reqItems: ['pipe_wrench'],        reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_songpa',     district: 'songpa',      name: '롯데타워 123층 펜트하우스', minDay: 90,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 20, bossId: 'boss_penthouse_survivor' },
  { id: 'hidden_seocho',     district: 'seocho',      name: '서초 법원 증거물 보관소',  minDay: 40,  minVisits: 0, reqItems: ['lockpick','flashlight'],reqChar: null,        weather: null,   season: null,    morale: 12, bossId: null },
  { id: 'hidden_yeongdeungpo',district: 'yeongdeungpo',name: 'KBS 비밀 방송실',         minDay: 50,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_gangseo',    district: 'gangseo',     name: '김포공항 격납고',          minDay: 120, minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_yangcheon',  district: 'yangcheon',   name: '목동 민방위 대피소',       minDay: 20,  minVisits: 0, reqItems: ['flashlight'],         reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_gwangjin',   district: 'gwangjin',    name: '어린이대공원 동물 연구소', minDay: 50,  minVisits: 0, reqItems: ['lockpick'],           reqChar: null,          weather: null,   season: null,    morale: 8,  bossId: 'boss_mutant_alpha_tiger' },
  { id: 'hidden_seongdong',  district: 'seongdong',   name: '성수 장인의 비밀 작업실',  minDay: 60,  minVisits: 5, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_jungrang',   district: 'jungrang',    name: '중랑 정수장 컨트롤룸',     minDay: 40,  minVisits: 0, reqItems: ['pipe_wrench'],        reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_geumcheon',  district: 'geumcheon',   name: '금천 비밀 지하 공장',      minDay: 80,  minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 10, bossId: null },
  { id: 'hidden_gangdong',   district: 'gangdong',    name: '강동 한강 비밀 선착장',    minDay: 150, minVisits: 0, reqItems: [],                    reqChar: null,          weather: null,   season: null,    morale: 12, bossId: null },
  { id: 'hidden_junggoo',    district: 'junggoo',     name: '서울시청 시장실 금고',     minDay: 100, minVisits: 0, reqItems: ['lockpick','crowbar','flashlight'],reqChar: null,weather: null,   season: null,    morale: 15, bossId: null },
];

function checkHiddenLocations(gs) {
  const discovered = [];
  const season = getSeason(gs.day);
  const wId = gs.weather?.id ?? 'sunny';
  const visitCount = gs.districtVisitCounts[gs.currentDistrict] ?? 0;

  for (const loc of SIM_HIDDEN_LOCATIONS) {
    if (gs.hiddenLocationsDiscovered.has(loc.id)) continue;
    if (loc.district !== gs.currentDistrict) continue;
    if (gs.day < loc.minDay) continue;
    if (loc.minVisits > 0 && visitCount < loc.minVisits) continue;
    if (loc.reqChar && loc.reqChar !== 'firefighter') continue;
    if (loc.weather && wId !== loc.weather && !['rainy','monsoon','storm'].includes(wId)) continue;
    if (loc.season && season !== loc.season) continue;

    // Check required items
    let hasItems = true;
    for (const item of loc.reqItems) {
      if ((gs.inv[item] ?? 0) <= 0) { hasItems = false; break; }
    }
    if (!hasItems) continue;

    // Discovery probability: 15% per check
    if (Math.random() > 0.15) continue;

    gs.hiddenLocationsDiscovered.add(loc.id);
    gs.morale = clamp(gs.morale + loc.morale, 0, gs.maxMorale);
    gainSkillXp(gs, 'scavenging', 10);

    // Legendary item reward
    gs.legendaryItems.push(loc.id);

    // Bonus loot from hidden location
    gs.inv.canned_food += rand(1, 3);
    gs.inv.bandage += rand(1, 2);
    if (Math.random() < 0.3) gs.inv.first_aid_kit++;
    if (Math.random() < 0.2) gs.inv.antibiotics++;

    discovered.push(loc);

    // Boss trigger from hidden location
    if (loc.bossId) {
      const boss = SIM_BOSSES.find(b => b.id === loc.bossId);
      if (boss && !gs.bossesKilled.has(boss.id)) {
        simulateBossCombat(gs, boss);
        if (!gs.alive) return discovered;
      }
    }
  }
  return discovered;
}

// ─────────────────────────────────────────────────────────────
//  Phase 5: 비밀 이벤트 (~10개, 소방관 접근 가능)
// ─────────────────────────────────────────────────────────────
const SIM_SECRET_EVENTS = [
  { id: 'evt_abandoned_cart',   minDay: 3,   maxDay: 20,  prob: 0.04, season: null,     weather: null,    morale: 5,  hp: 0,   food: 3,  water: 0, infection: 0 },
  { id: 'evt_child_crying',     minDay: 7,   maxDay: 25,  prob: 0.03, season: null,     weather: null,    morale: 15, hp: 0,   food: 0,  water: 0, infection: 0 },
  { id: 'evt_first_rain',       minDay: 7,   maxDay: 14,  prob: 0.05, season: null,     weather: 'rainy', morale: 10, hp: 0,   food: 0,  water: 2, infection: 3 },
  { id: 'evt_wandering_trader', minDay: 31,  maxDay: 100, prob: 0.02, season: null,     weather: null,    morale: 5,  hp: 0,   food: 2,  water: 1, infection: 0 },
  { id: 'evt_fire_survivor',    minDay: 20,  maxDay: 80,  prob: 0.03, season: null,     weather: null,    morale: 20, hp: 10,  food: 1,  water: 1, infection: 0 },
  { id: 'evt_midnight_howl',    minDay: 50,  maxDay: 200, prob: 0.02, season: null,     weather: null,    morale: -5, hp: 0,   food: 0,  water: 0, infection: 0 },
  { id: 'evt_aurora_borealis',  minDay: 200, maxDay: 300, prob: 0.03, season: 'winter', weather: null,    morale: 25, hp: 0,   food: 0,  water: 0, infection: 0 },
  { id: 'evt_old_photo',        minDay: 40,  maxDay: 150, prob: 0.02, season: null,     weather: null,    morale: 10, hp: 0,   food: 0,  water: 0, infection: 0 },
  { id: 'evt_spring_bloom',     minDay: 1,   maxDay: 90,  prob: 0.03, season: 'spring', weather: null,    morale: 15, hp: 5,   food: 2,  water: 0, infection: 0 },
  { id: 'evt_monsoon_flood',    minDay: 91,  maxDay: 180, prob: 0.04, season: 'summer', weather: 'monsoon',morale:-10, hp: -10, food: 0,  water: 3, infection: 5 },
];

function checkSecretEvents(gs) {
  if (gs.day % 3 !== 0) return; // Check every 3 days
  const season = getSeason(gs.day);
  const wId = gs.weather?.id ?? 'sunny';

  for (const evt of SIM_SECRET_EVENTS) {
    if (gs.secretEventsTriggered.has(evt.id)) continue;
    if (gs.day < evt.minDay || gs.day > evt.maxDay) continue;
    if (evt.season && season !== evt.season) continue;
    if (evt.weather && wId !== evt.weather) continue;
    if (Math.random() > evt.prob) continue;

    gs.secretEventsTriggered.add(evt.id);
    gs.morale = clamp(gs.morale + evt.morale, 0, gs.maxMorale);
    gs.hp = clamp(gs.hp + evt.hp, 0, gs.maxHp);
    gs.inv.canned_food += evt.food;
    gs.inv.water_bottle += evt.water;
    gs.infection = clamp(gs.infection + evt.infection, 0, 100);
    break; // One event per check
  }
}

// ─── 히든 레시피 (~10개, 장소 발견/보스 처치 후 해금) ───────
const SIM_HIDDEN_RECIPES = [
  { id: 'recipe_acid_whip',        name: '산성 채찍',         reqBoss: 'boss_acid_queen',       reqLoc: null,              minDay: 0 },
  { id: 'recipe_electric_blade',   name: '전기 칼날',         reqBoss: null,                    reqLoc: 'hidden_seongdong',minDay: 0 },
  { id: 'recipe_ultra_bat',        name: '극강화 배트',       reqBoss: null,                    reqLoc: 'hidden_guro',     minDay: 0 },
  { id: 'recipe_extreme_cold_suit',name: '극한 방한복',       reqBoss: 'boss_frozen_giant',      reqLoc: null,              minDay: 0 },
  { id: 'recipe_vaccine',          name: '백신',             reqBoss: null,                    reqLoc: 'hidden_seodaemun',minDay: 50 },
  { id: 'recipe_combat_stimulant', name: '전투 자극제',       reqBoss: 'boss_raider_warlord',   reqLoc: null,              minDay: 0 },
  { id: 'recipe_fire_axe_plus',    name: '강화 소방도끼',     reqBoss: 'boss_firefighter_nemesis',reqLoc: null,             minDay: 70 },
  { id: 'recipe_hazmat_upgrade',   name: '방호복 강화',       reqBoss: null,                    reqLoc: 'hidden_gwanak',   minDay: 70 },
  { id: 'recipe_sniper_mod',       name: '저격총 개조',       reqBoss: 'boss_phantom_sniper',   reqLoc: null,              minDay: 120 },
  { id: 'recipe_healing_salve',    name: '치유 연고',         reqBoss: null,                    reqLoc: 'hidden_gangbuk',  minDay: 30 },
];

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
//  계절 전환 충격 — 준비 안 된 플레이어에게 즉각 패널티
// ─────────────────────────────────────────────────────────────
function applySeasonTransition(gs) {
  if (!gs.alive) return;
  if (![91, 181, 271].includes(gs.day) || gs.tpInDay !== 0) return;
  if (gs.seasonTransitioned.has(gs.day)) return;
  gs.seasonTransitioned.add(gs.day);

  if (gs.day === 91) {
    // 봄 → 여름: 폭염 충격 — 물 비축 없으면 탈수 + 체온 상승
    const waterStock = countCleanWater(gs);
    if (waterStock < 2 && !gs.hasCollector) {
      gs.hydration = clamp(gs.hydration - 40, 0, gs.maxHydration);
      gs.temperature = clamp(gs.temperature + 20, 0, 100);
      gs.log.push(`[D${gs.day}] ☀️ 폭염 시작 — 물 부족으로 탈수+체온 급등`);
    } else {
      gs.morale = clamp(gs.morale + 5, 0, gs.maxMorale);
    }
  } else if (gs.day === 181) {
    // 여름 → 가을: 첫 산성비 — 텃밭 파괴 + 식량 부족 시 영양 위기
    if (gs.hasGarden) {
      gs.hasGarden = false; gs.gardenDura = 0;
      gs.morale = clamp(gs.morale - 15, 0, gs.maxMorale);
      gs.log.push(`[D${gs.day}] 🌧️ 첫 산성비 — 텃밭 전파 파괴`);
    }
    if (countFood(gs) < 5) {
      gs.nutrition = clamp(gs.nutrition - 25, 0, gs.maxNutrition);
      gs.morale = clamp(gs.morale - 10, 0, gs.maxMorale);
      gs.log.push(`[D${gs.day}] 🍂 가을 식량 위기 — 비축 부족으로 영양 급감`);
    } else {
      gs.morale = clamp(gs.morale + 5, 0, gs.maxMorale);
    }
  } else if (gs.day === 271) {
    // 가을 → 겨울: 혹한 도래 — 방한 미비 시 저체온증
    const isProtected = gs.hasWarmClothes || (gs.hasCampfire && gs.campfireDura > 0);
    if (!isProtected) {
      gs.temperature = clamp(gs.temperature - 30, 0, 100);
      contractDisease(gs, 'hypothermia');
      gs.morale = clamp(gs.morale - 15, 0, gs.maxMorale);
      gs.log.push(`[D${gs.day}] ❄️ 혹한 도래 — 방한 미비로 저체온증 발병`);
    } else {
      gs.morale = clamp(gs.morale + 8, 0, gs.maxMorale);
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

  // 방한복 자동 장착 (인벤에 있으면 활성화)
  if (gs.inv.warm_clothes > 0) gs.hasWarmClothes = true;

  // 계절 전환 충격 (각 계절 첫날 1회)
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

  const sdm = gs.cc?.statDecayMult ?? 1.0;
  gs.hydration  = clamp(gs.hydration  - STAT_DECAY.hydration * sm.hydrationMult * sdm, 0, gs.maxHydration);
  gs.nutrition  = clamp(gs.nutrition  - STAT_DECAY.nutrition * (sm.nutDecayMult ?? 1.0) * sdm, 0, gs.maxNutrition);
  const hasHome = (gs.hasCampfire && gs.campfireDura > 0) && (gs.hasGarden && gs.gardenDura > 0);
  const moraleMult = hasHome ? 0.35 : (gs.hasCampfire && gs.campfireDura > 0) ? 0.6 : 1.0;
  gs.morale     = clamp(gs.morale     - STAT_DECAY.morale * moraleMult, 0, gs.maxMorale);
  gs.fatigue    = clamp(gs.fatigue     + STAT_DECAY.fatigue * (gs.cc?.fatigueDecayMult ?? 1.0), 0, 100);

  if (sm.tempDecay < 0) {
    // 방한복 착용 시 겨울 체온 하락 절반으로 경감
    const coldMult = (season === 'winter' && gs.hasWarmClothes) ? 0.5 : 1.0;
    gs.temperature = clamp(gs.temperature + sm.tempDecay * coldMult, 0, 100);
  }
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

  // 체온 패널티 (사기 위주, HP drain은 질병에 위임)
  if (gs.temperature < 10)      gs.morale = clamp(gs.morale - 4, 0, 100);
  else if (gs.temperature < 20) gs.morale = clamp(gs.morale - 2, 0, 100);
  else if (gs.temperature < 30) gs.morale = clamp(gs.morale - 1, 0, 100);
  if (gs.temperature > 80)      gs.morale = clamp(gs.morale - 2, 0, 100);

  if (gs.temperature > 85) gs.hydration = clamp(gs.hydration - 5, 0, gs.maxHydration);
  if (gs.temperature <= 0) gs.hydration = clamp(gs.hydration - 8, 0, gs.maxHydration);

  gs.stamina = clamp(gs.stamina + 1.2, 0, gs.maxStamina);
  gs.noise = clamp(gs.noise - 1.0, 0, 100);
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
  bleeding:           { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 0.2, moraleDrain: 0, hpDrain: 0.4 },
  deep_laceration:    { fatal: true,  fatalDays: 6,    hydDrain: 0.5, nutDrain: 0, fatGain: 0.3, moraleDrain: 0, hpDrain: 0.8 },
  fracture:           { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 1.5, moraleDrain: 0.8, hpDrain: 0.2 },
  concussion:         { fatal: false, fatalDays: null, hydDrain: 0, nutDrain: 0, fatGain: 0.6, moraleDrain: 1.0, hpDrain: 0.1 },
};

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
  // 저체온증: < 15도에서 발병 가능 (기존 10도에서 확대), 방한복 착용 시 70% 감소
  if (gs.temperature < 15 && !gs.diseases.some(d => d.id === 'hypothermia')) {
    const hypoChance = gs.temperature < 10 ? 0.06 : 0.02;
    const hypoMult = gs.hasWarmClothes ? 0.3 : 1.0;
    if (Math.random() < hypoChance * hypoMult) contractDisease(gs, 'hypothermia');
  }
  // 열사병: > 82도에서 발병 가능 (기존 85도에서 확대)
  if (gs.temperature > 82 && !gs.diseases.some(d => d.id === 'heatstroke')) {
    const heatChance = gs.temperature > 88 ? 0.06 : 0.02;
    if (Math.random() < heatChance) contractDisease(gs, 'heatstroke');
  }
  if (gs.infection > 60 && !gs.diseases.some(d => d.id === 'sepsis')) {
    if (Math.random() < 0.02) contractDisease(gs, 'sepsis');
  }
}

// ─── 전투 시스템 (소방관: 더 강하고, 도주 성향 낮음 + 스킬 XP) ──────
function simulateCombat(gs, enemies) {
  gs.combatCount++;
  const hasWeapon = gs.inv.hand_axe > 0 || gs.inv.knife > 0 || gs.inv.crowbar > 0;
  let fleeChance = hasWeapon ? gs.cc.fleeBase : (gs.cc.fleeBase + 0.20);
  if (gs.hp < gs.maxHp * 0.5) fleeChance += 0.10;
  if (Math.random() < fleeChance) {
    gs.fleeCount++;
    gs.fatigue = clamp(gs.fatigue + 10, 0, 100);
    gs.noise = clamp(gs.noise + 10, 0, 100);
    return 'fled';
  }

  let fleeFailed = true;

  const meleeBonus = 1 + getSkillBonus(gs, 'melee');
  const defenseBonus = 1 + getSkillBonus(gs, 'defense');
  const pDmg = hasWeapon
    ? [Math.floor(gs.cc.combatDmgWeapon[0] * meleeBonus), Math.floor(gs.cc.combatDmgWeapon[1] * meleeBonus)]
    : gs.cc.combatDmgUnarmed;
  const pAcc = gs.cc.combatAcc;
  let round = 0;
  const maxRounds = 20;
  const aliveEnemies = enemies.map(e => ({ ...e }));

  while (aliveEnemies.length > 0 && gs.alive && round < maxRounds) {
    round++;
    const target = aliveEnemies[0];
    if (Math.random() < pAcc) {
      const dmg = rand(pDmg[0], pDmg[1]);
      target.hp -= dmg;
      gainSkillXp(gs, hasWeapon ? 'melee' : 'unarmed', 2);
      if (target.hp <= 0) {
        aliveEnemies.shift();
        gs.totalKills++;
        // 군인: 적 처치 시 사기 +2 (전투 훈련 효과)
        if (gs.charType === 'soldier') gs.morale = clamp(gs.morale + 2, 0, gs.maxMorale);
        // 소방관 전투 루트: 20% 확률 건설 자재 드롭 (wood, rope, scrap_metal)
        if (Math.random() < 0.20) {
          const roll = Math.random();
          if (roll < 0.4)       gs.inv.wood++;
          else if (roll < 0.7)  gs.inv.rope++;
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
        if (Math.random() < 0.20) gs.infection = clamp(gs.infection + 5, 0, 100);
        checkCombatInjury(gs, dmg);
        if (gs.hp <= 0) { kill(gs, '전투 중 부상'); return 'defeat'; }
      }
    }
    fleeFailed = false;
  }

  if (aliveEnemies.length === 0) {
    gs.noise = clamp(gs.noise + 15, 0, 100);
    return 'victory';
  }
  gs.fleeCount++;
  return 'fled';
}

// ─── 탐색 (히든 콘텐츠 + 보스 + 스킬 XP 통합) ─────────────
function explore(gs, districtId) {
  const d = DISTRICTS[districtId];
  if (!d) return;

  const season = getSeason(gs.day);
  const sm = SEASON_MODS[season];

  advanceTP(gs);
  if (!gs.alive) return;

  gs.stamina = clamp(gs.stamina - 5, 0, gs.maxStamina);
  gs.noise = clamp(gs.noise + Math.floor(3 * gs.cc.noiseMult), 0, 100);

  // Phase 4: 구역 방문 횟수 추적
  gs.districtVisitCounts[districtId] = (gs.districtVisitCounts[districtId] ?? 0) + 1;

  // Phase 2: scavenging XP
  gainSkillXp(gs, 'scavenging', 1);

  if (d.rad > 0) gs.radiation = clamp(gs.radiation + d.rad, 0, 100);

  const encounterChance = d.enc * sm.encounterMult * gs.cc.encounterMult;
  if (encounterChance > 0 && Math.random() < encounterChance) {
    const enemies = rollEnemyGroup(d.dl, gs.noise);
    const result = simulateCombat(gs, enemies);
    if (!gs.alive) return;
    if (result === 'fled') return;
  }

  // Phase 3: 네메시스 전용 스폰 체크 (은평 D70+ 방문 시 8%)
  if (gs.currentDistrict === 'eunpyeong' && gs.day >= 70 && !gs.bossesKilled.has('boss_firefighter_nemesis')) {
    if (Math.random() < 0.08) {
      const nemesis = SIM_BOSSES.find(b => b.id === 'boss_firefighter_nemesis');
      if (nemesis) {
        simulateBossCombat(gs, nemesis);
        if (!gs.alive) return;
      }
    }
  }

  // Phase 3: 일반 보스 스폰 체크
  const boss = checkBossSpawn(gs);
  if (boss) {
    simulateBossCombat(gs, boss);
    if (!gs.alive) return;
  }

  // Phase 4: 히든 장소 발견 체크
  checkHiddenLocations(gs);
  if (!gs.alive) return;

  // Phase 5: 비밀 이벤트 + 레시피 체크
  checkSecretEvents(gs);
  checkRecipeUnlocks(gs);

  const lastLootDay = gs.districtLootDay[districtId] ?? -Infinity;
  const daysSinceLoot = gs.day - lastLootDay;
  const isFirstLoot = !gs.districtsLooted.has(districtId);
  const isRespawn = !isFirstLoot && daysSinceLoot >= 30;

  if (isFirstLoot || isRespawn) {
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

    // 방한복 재료 드롭 (천 풍부 지역: 실/가죽, 금속 지역: 덕트테이프)
    if (d.cloth >= 2 && Math.random() < 0.30) gs.inv.thread   += rand(1, 2);
    if (d.cloth >= 1 && Math.random() < 0.20) gs.inv.leather  += (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
    if (d.metal >= 1 && Math.random() < 0.25) gs.inv.duct_tape++;

    // 약초·고무·못 드롭
    if (Math.random() < 0.20) gs.inv.herb += rand(1, 2);
    if (d.metal >= 2 && Math.random() < 0.10) gs.inv.rubber++;
    if (d.metal >= 1 && Math.random() < 0.20) gs.inv.nail += rand(1, 3);
    // 군인·기계공 퀘스트 재료: metal 지역에서 전자부품·철사·손전등 추가 드롭
    if (d.metal >= 2 && Math.random() < 0.25) {
      const roll = Math.random();
      if (roll < 0.4)      gs.inv.electronic_parts++;
      else if (roll < 0.7) gs.inv.wire++;
      else                 gs.inv.flashlight += (Math.random() < 0.3 ? 1 : 0);
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
    gainSkillXp(gs, 'crafting', 3);
    gainSkillXp(gs, 'building', 3);
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
    gainSkillXp(gs, 'crafting', 5);
    gainSkillXp(gs, 'building', 5);
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

function tryCraftWarmClothes(gs) {
  if (gs.hasWarmClothes) return false;
  // 실제 블루프린트: 가죽×4, 천×6, 실×5, 밧줄×1, 덕트테이프×2 + 작업대 + armorcraft4/crafting3
  // 작업대는 gs.hasCampfire로 '베이스 구축 여부' 근사 (campfire = 거점 있음)
  const hasBase = gs.hasCampfire && gs.campfireDura > 0;
  const hasSkill = (gs.skills.crafting ?? 0) >= 3;
  const hasMats = gs.inv.leather >= 4 && gs.inv.cloth >= 6 &&
                  gs.inv.thread >= 5 && gs.inv.rope >= 1 && gs.inv.duct_tape >= 2;
  if (!hasBase || !hasSkill || !hasMats) return false;

  gs.inv.leather   -= 4;
  gs.inv.cloth     -= 6;
  gs.inv.thread    -= 5;
  gs.inv.rope      -= 1;
  gs.inv.duct_tape -= 2;
  gs.inv.warm_clothes++;
  gs.hasWarmClothes = true;
  gs.morale = clamp(gs.morale + 15, 0, gs.maxMorale);
  gs.totalStructuresCrafted++;
  gainSkillXp(gs, 'crafting', 10);
  // 3단계 제작: 12 TP 소요
  for (let i = 0; i < 12; i++) { advanceTP(gs); if (!gs.alive) return true; }
  return true;
}

function tryCraftCollector(gs) {
  if (gs.hasCollector && gs.collectorDura > 0) return false;
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

  if (hasLaceration && gs.inv.first_aid_kit > 0) {
    gs.inv.first_aid_kit--;
    gs.hp = clamp(gs.hp + 75, 0, gs.maxHp);
    gs.infection = clamp(gs.infection - 30, 0, 100);
    gs.diseases = gs.diseases.filter(d => d.id !== 'deep_laceration' && d.id !== 'bleeding');
    gainSkillXp(gs, 'medicine', 3);
    return true;
  }
  if (hasLaceration && gs.inv.antiseptic > 0) {
    gs.inv.antiseptic--;
    gs.infection = clamp(gs.infection - 20, 0, 100);
    gs.diseases = gs.diseases.filter(d => d.id !== 'deep_laceration');
    return true;
  }

  // 출혈 → 붕대
  if (hasBleeding && gs.inv.bandage > 0) {
    gs.inv.bandage--;
    gs.hp = clamp(gs.hp + Math.floor(20 * (gs.cc?.healBonus ?? 1.0)), 0, gs.maxHp);
    gs.diseases = gs.diseases.filter(d => d.id !== 'bleeding');
    return true;
  }
  if (hasBleeding && gs.inv.gauze > 0) {
    gs.inv.gauze--;
    gs.hp = clamp(gs.hp + 15, 0, gs.maxHp);
    gs.diseases = gs.diseases.filter(d => d.id !== 'bleeding');
    return true;
  }

  if ((hasFracture || hasConcussion) && gs.inv.painkiller > 0) {
    gs.inv.painkiller--;
    gs.hp = clamp(gs.hp + 15, 0, gs.maxHp);
    gs.morale = clamp(gs.morale + 10, 0, gs.maxMorale);
    gs.fatigue = clamp(gs.fatigue - 10, 0, 100);
    gs.diseases = gs.diseases.filter(d => d.id !== 'concussion');
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
    gs.hp = clamp(gs.hp + Math.floor(20 * (gs.cc?.healBonus ?? 1.0)), 0, gs.maxHp);
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
    if (gs.tpInDay === 0 && isRaining && Math.random() < 0.55) gs.inv.water_bottle += 3;
  }
  if (season === 'autumn' && !gs.weather?.gardenKill) {
    if (Math.random() < 0.06) gs.hydration = clamp(gs.hydration + 20, 0, gs.maxHydration);
    if (gs.tpInDay === 0 && Math.random() < 0.15) gs.inv.water_bottle += 1;
  }
  if (season === 'winter') {
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
//  AI 전략 (퀘스트 인식 + 히든 콘텐츠 — 소방관: 구조물 제작 우선, 더 공격적)
// ─────────────────────────────────────────────────────────────
function aiTurn(gs) {
  // 퀘스트 체크 (퀘스트 있는 캐릭터 전원)
  if (gs.cc?.hasQuests) {
    checkQuestTriggers(gs);
    checkQuestProgress(gs);
  }

  // Phase 5: 레시피 해금 체크 (매 턴)
  checkRecipeUnlocks(gs);

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

  // 의료 제작 (약사·의사: craft_medical 퀘스트 활성 시 허브 소모 제작)
  if (gs.cc?.hasQuests && gs.inv.herb >= 1) {
    const needsMedCraft = gs.quests.active.some(q => {
      const qDef = getCharQuests(gs).find(d => d.id === q.id);
      return qDef?.objective?.type === 'craft_medical' &&
             gs.totalMedicalCrafted < (qDef.objective.count ?? 1);
    });
    if (needsMedCraft) { tryCraftMedical(gs); if (!gs.alive) return; }
  }

  // 제작 우선순위 (소방관: 구조물 제작 더 높은 우선순위)
  if (!gs.hasCampfire || gs.campfireDura <= 0) {
    if (tryCraftCampfire(gs)) return;
  }
  // 소방관: 퀘스트 체인에서 구조물 6개+ 필요하므로 텃밭/수집기 적극 제작
  if (!gs.hasGarden || gs.gardenDura <= 0) {
    if (tryCraftGarden(gs)) return;
    if (tryReplantGarden(gs)) return;
    // 소방관: 나무 부족 시 더 적극적으로 채집 (임계값 상향)
    if (gs.inv.wood < 4 && gs.stamina > 20) {
      scavengeWood(gs);
      return;
    }
  }
  if (!gs.hasCollector || gs.collectorDura <= 0) {
    if (tryCraftCollector(gs)) return;
  }
  // 겨울 전(D220+) 방한복 제작 시도 — 재료 충분하면 즉시 제작
  if (gs.day >= 220 && !gs.hasWarmClothes) {
    if (tryCraftWarmClothes(gs)) return;
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
  // 소방관 경로: yongsan -> jongno -> mapo -> seodaemun -> eunpyeong
  const questTarget = getQuestTargetDistrict(gs);
  if (questTarget && gs.hp > 50 && gs.stamina > 30 && gs.radiation < 25) {
    const path = bfsToDistrict(gs.currentDistrict, questTarget);
    if (path.length > 1) {
      const nextDist = DISTRICTS[path[1]];
      if (nextDist.rad > 0 && gs.radiation > 40) {
        // 방사선 위험 -> 스킵
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

  // Phase 6: 히든 장소 접근 아이템 수집 우선순위
  // 탐색 중 자물쇠따개, 손전등, 파이프렌치 자연 드롭 시뮬레이션
  if (gs.day > 15 && Math.random() < 0.03) {
    if (gs.inv.lockpick === 0) gs.inv.lockpick++;
    else if (gs.inv.flashlight === 0) gs.inv.flashlight++;
    else if (gs.inv.pipe_wrench === 0) gs.inv.pipe_wrench++;
    else if (gs.inv.electronic_parts < 3) gs.inv.electronic_parts++;
    else if (gs.inv.map_fragment === 0 && gs.day > 40) gs.inv.map_fragment++;
  }

  // Phase 6: D70+ 은평 재방문 (네메시스 기회) — 12% 확률로 시도
  if (gs.day >= 70 && !gs.nemesisEncountered && gs.currentDistrict !== 'eunpyeong' &&
      gs.hp > 70 && gs.stamina > 35 && Math.random() < 0.12) {
    const path = bfsToDistrict(gs.currentDistrict, 'eunpyeong');
    if (path.length > 1 && path.length <= 4) {
      travel(gs, path[1]);
      if (!gs.alive) return;
      explore(gs, path[1]);
      return;
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

  // 소방관: dl 3 구역도 더 적극적으로 진입 (HP 120, 전투력 높음)
  const midRiskTargets = unlooted
    .map(id => ({ id, ...DISTRICTS[id] }))
    .filter(d => d.dl <= 3 && d.rad === 0)
    .sort((a, b) => {
      if (needWater) return (b.water - a.water) || (a.dl - b.dl);
      return a.dl - b.dl;
    });

  if (midRiskTargets.length > 0 && gs.hp > 45 && gs.stamina > 25) {
    // 소방관: HP 45 이상이면 dl 3 진입 (의사: HP 50)
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

  if (riskyTargets.length > 0 && gs.hp > 55 && gs.stamina > 30) {
    // Phase 6: dl=5 진입 조건 강화 (HP 80+, 무기 필수)
    const target = riskyTargets[0];
    const hasWeapon = gs.inv.hand_axe > 0 || gs.inv.knife > 0 || gs.inv.crowbar > 0;
    if (target.dl >= 5 && (gs.hp < 80 || !hasWeapon)) {
      // dl=5는 HP 80+, 무기 필수 — 스킵
    } else {
      travel(gs, target.id);
      if (!gs.alive) return;
      explore(gs, target.id);
      return;
    }
  }

  // 모든 인접 구 루팅 -> BFS (미탐색 + 리스폰 포함)
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
function runOneGame(runId, charId = 'firefighter') {
  const gs = createGameState(charId);
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
    // Phase 7: 히든 콘텐츠 통계
    hiddenLocations: gs.hiddenLocationsDiscovered.size,
    bossEncounters: gs.bossesEncountered.length,
    bossKills: gs.bossesKilled.size,
    recipesUnlocked: gs.recipesUnlocked.size,
    legendaryItems: gs.legendaryItems.length,
    secretEvents: gs.secretEventsTriggered.size,
    nemesisEncountered: gs.nemesisEncountered,
    nemesisKilled: gs.nemesisKilled,
    nemesisDay: gs.nemesisDay,
    skills: { ...gs.skills },
  };
}

// ─────────────────────────────────────────────────────────────
//  메인: 6캐릭터 × 50회 실행 + 비교 분석
// ─────────────────────────────────────────────────────────────
console.log('=== 300일 생존 시뮬레이션 — 6캐릭터 비교 분석 ===');
console.log(`목표: ${TARGET_DAYS}일 생존, 캐릭터당 ${NUM_RUNS}회 반복\n`);

// ── 캐릭터별 시뮬레이션 실행 ─────────────────────────────────
const charIds = Object.keys(CHARACTER_CONFIGS);
const allResults = {};

for (const charId of charIds) {
  const cc = CHARACTER_CONFIGS[charId];
  console.log(`\n── ${cc.icon} ${cc.name} (${NUM_RUNS}회) ──`);
  const results = [];
  for (let i = 1; i <= NUM_RUNS; i++) {
    const r = runOneGame(i, charId);
    r.charId = charId;
    results.push(r);
    const status = r.survived ? '✅' : `💀 D${r.dayReached}`;
    process.stdout.write(`  [${String(i).padStart(3)}/${NUM_RUNS}] ${status}  \r`);
  }
  allResults[charId] = results;
  const surv = results.filter(r => r.survived).length;
  const avgD = (results.reduce((s, r) => s + r.dayReached, 0) / NUM_RUNS).toFixed(0);
  console.log(`  결과: 생존 ${surv}/${NUM_RUNS} (${((surv/NUM_RUNS)*100).toFixed(0)}%) | 평균 D${avgD}`);
}

// ── 비교 분석 출력 ──────────────────────────────────────────
const lines = [];
lines.push('╔══════════════════════════════════════════════════════════════════════════╗');
lines.push('║       300일 생존 시뮬레이션 — 6캐릭터 비교 분석 (50회/캐릭터)          ║');
lines.push('╚══════════════════════════════════════════════════════════════════════════╝');
lines.push('');

// ══ 1. 종합 비교표 ══
lines.push('══ 1. 종합 생존 비교 ══════════════════════════════════════════════════════');
lines.push('');
lines.push(`${'캐릭터'.padEnd(22)} ${'생존율'.padStart(7)} ${'평균일'.padStart(6)} ${'평균킬'.padStart(6)} ${'루팅'.padStart(5)} ${'히든'.padStart(5)} ${'보스조'.padStart(6)} ${'보스킬'.padStart(6)} ${'레시피'.padStart(6)} ${'이벤트'.padStart(6)}`);
lines.push('─'.repeat(90));

const charSummaries = [];
for (const charId of charIds) {
  const cc = CHARACTER_CONFIGS[charId];
  const res = allResults[charId];
  const surv = res.filter(r => r.survived);
  const survRate = ((surv.length / NUM_RUNS) * 100).toFixed(1);
  const avgDay = (res.reduce((s, r) => s + r.dayReached, 0) / NUM_RUNS).toFixed(0);
  const avgKills = (res.reduce((s, r) => s + r.totalKills, 0) / NUM_RUNS).toFixed(1);
  const avgLooted = (res.reduce((s, r) => s + r.districtsLooted, 0) / NUM_RUNS).toFixed(1);
  const avgHidden = (res.reduce((s, r) => s + r.hiddenLocations, 0) / NUM_RUNS).toFixed(1);
  const avgBossEnc = (res.reduce((s, r) => s + r.bossEncounters, 0) / NUM_RUNS).toFixed(1);
  const avgBossKill = (res.reduce((s, r) => s + r.bossKills, 0) / NUM_RUNS).toFixed(1);
  const avgRecipe = (res.reduce((s, r) => s + r.recipesUnlocked, 0) / NUM_RUNS).toFixed(1);
  const avgEvt = (res.reduce((s, r) => s + r.secretEvents, 0) / NUM_RUNS).toFixed(1);

  charSummaries.push({
    charId, name: cc.name, icon: cc.icon, survRate: parseFloat(survRate), avgDay: parseFloat(avgDay),
    avgKills: parseFloat(avgKills), avgLooted: parseFloat(avgLooted), avgHidden: parseFloat(avgHidden),
    avgBossEnc: parseFloat(avgBossEnc), avgBossKill: parseFloat(avgBossKill), avgRecipe: parseFloat(avgRecipe),
    avgEvt: parseFloat(avgEvt), survCount: surv.length,
  });

  lines.push(
    `${(cc.icon + ' ' + cc.name).padEnd(22)} ` +
    `${(survRate + '%').padStart(7)} ` +
    `${String(avgDay).padStart(6)} ` +
    `${String(avgKills).padStart(6)} ` +
    `${String(avgLooted).padStart(5)} ` +
    `${String(avgHidden).padStart(5)} ` +
    `${String(avgBossEnc).padStart(6)} ` +
    `${String(avgBossKill).padStart(6)} ` +
    `${String(avgRecipe).padStart(6)} ` +
    `${String(avgEvt).padStart(6)}`
  );
}
lines.push('');

// ══ 2. 사망 원인 비교 ══
lines.push('══ 2. 사망 원인 비교 ══════════════════════════════════════════════════════');
lines.push('');

for (const charId of charIds) {
  const cc = CHARACTER_CONFIGS[charId];
  const res = allResults[charId];
  const deaths = res.filter(r => !r.survived);
  const causes = {};
  for (const d of deaths) causes[d.deathCause] = (causes[d.deathCause] ?? 0) + 1;
  const sorted = Object.entries(causes).sort((a, b) => b[1] - a[1]);

  lines.push(`── ${cc.icon} ${cc.name} ──`);
  for (const [cause, count] of sorted.slice(0, 5)) {
    const pct = ((count / NUM_RUNS) * 100).toFixed(0);
    lines.push(`  ${cause.padEnd(30)} ${String(count).padStart(3)}회 (${pct}%)`);
  }
  lines.push('');
}

// ══ 3. 생존 일수 분포 비교 ══
lines.push('══ 3. 생존 일수 분포 ══════════════════════════════════════════════════════');
lines.push('');
const brackets = [[1,30],[31,60],[61,90],[91,150],[151,210],[211,270],[271,300]];

lines.push(`${'구간'.padEnd(12)} ${charIds.map(id => CHARACTER_CONFIGS[id].icon.padStart(5)).join(' ')}`);
lines.push('─'.repeat(12 + charIds.length * 6));

for (const [lo, hi] of brackets) {
  const counts = charIds.map(id => {
    const cnt = allResults[id].filter(r => r.dayReached >= lo && r.dayReached <= hi).length;
    return String(cnt).padStart(5);
  });
  lines.push(`${String(lo).padStart(3)}-${String(hi).padStart(3)}일   ${counts.join(' ')}`);
}
lines.push('');

// ══ 4. 스킬 레벨 비교 (생존자) ══
lines.push('══ 4. 스킬 레벨 비교 (생존자 평균) ═══════════════════════════════════════');
lines.push('');
const skillNames = ['unarmed', 'melee', 'defense', 'building', 'scavenging', 'crafting', 'medicine'];
lines.push(`${'스킬'.padEnd(14)} ${charIds.map(id => CHARACTER_CONFIGS[id].icon.padStart(5)).join(' ')}`);
lines.push('─'.repeat(14 + charIds.length * 6));

for (const skill of skillNames) {
  const vals = charIds.map(id => {
    const surv = allResults[id].filter(r => r.survived);
    if (surv.length === 0) return '  -  ';
    const avg = (surv.reduce((s, r) => s + (r.skills[skill] ?? 0), 0) / surv.length).toFixed(1);
    return String(avg).padStart(5);
  });
  lines.push(`${skill.padEnd(14)} ${vals.join(' ')}`);
}
lines.push('');

// ══ 5. 네메시스 비교 (소방관만 해당) ══
lines.push('══ 5. 네메시스 통계 (소방관 전용) ═════════════════════════════════════════');
lines.push('');
const ffRes = allResults.firefighter ?? [];
const nemEnc = ffRes.filter(r => r.nemesisEncountered).length;
const nemKill = ffRes.filter(r => r.nemesisKilled).length;
const nemDs = ffRes.filter(r => r.nemesisEncountered).map(r => r.nemesisDay);
const nemAvgD = nemDs.length > 0 ? (nemDs.reduce((s,d) => s + d, 0) / nemDs.length).toFixed(0) : '-';
lines.push(`  조우율:   ${((nemEnc / NUM_RUNS) * 100).toFixed(1)}% (${nemEnc}/${NUM_RUNS})`);
lines.push(`  처치율:   ${nemEnc > 0 ? ((nemKill / nemEnc) * 100).toFixed(1) : '0.0'}% (${nemKill}/${nemEnc || 1})`);
lines.push(`  평균 조우일: D${nemAvgD}`);
lines.push('');

// ══ 6. 퀘스트 진행 비교 ══
lines.push('══ 6. 퀘스트 진행 비교 ════════════════════════════════════════════════════');
lines.push('');

const QUEST_ARRAYS = {
  firefighter: FIREFIGHTER_QUESTS,
  doctor: DOCTOR_QUESTS,
  soldier: SOLDIER_QUESTS,
  homeless: HOMELESS_QUESTS,
  pharmacist: PHARMACIST_QUESTS,
  engineer: ENGINEER_QUESTS,
};

for (const charId of charIds) {
  const cc = CHARACTER_CONFIGS[charId];
  const res = allResults[charId];
  const qDefs = QUEST_ARRAYS[charId] ?? [];
  const total = qDefs.length;
  const avgCompleted = (res.reduce((s, r) => s + r.quests.completed.length, 0) / NUM_RUNS).toFixed(1);
  const avgFailed    = (res.reduce((s, r) => s + r.quests.failed.length,    0) / NUM_RUNS).toFixed(1);
  const survRes = res.filter(r => r.survived);
  const survAvgQ = survRes.length > 0
    ? (survRes.reduce((s, r) => s + r.quests.completed.length, 0) / survRes.length).toFixed(1)
    : '-';
  lines.push(`── ${cc.icon} ${cc.name}`);
  lines.push(`  총 퀘스트: ${total}개 | 완료(평균): ${avgCompleted} | 실패(평균): ${avgFailed} | 생존자 완료: ${survAvgQ}`);
  // 완료율 낮은 퀘스트 (bottleneck)
  const completionRates = qDefs.map(qDef => {
    const cnt = res.filter(r => r.quests.completed.some(q => q.id === qDef.id)).length;
    return { id: qDef.id, title: qDef.title, rate: cnt / NUM_RUNS };
  });
  const bottleneck = completionRates.filter(q => q.rate < 0.3).slice(0, 3);
  if (bottleneck.length > 0) {
    lines.push(`  미완률 높은 퀘스트: ${bottleneck.map(q => `${q.title}(${(q.rate*100).toFixed(0)}%)`).join(', ')}`);
  }
  lines.push('');
}

// ══ 7. 랭킹 ══
lines.push('══ 7. 캐릭터 랭킹 ════════════════════════════════════════════════════════');
lines.push('');

const byRate = [...charSummaries].sort((a, b) => b.survRate - a.survRate);
lines.push('  [생존율 순위]');
byRate.forEach((c, i) => lines.push(`    ${i+1}위 ${c.icon} ${c.name}: ${c.survRate}%`));
lines.push('');

const byDay = [...charSummaries].sort((a, b) => b.avgDay - a.avgDay);
lines.push('  [평균 생존일 순위]');
byDay.forEach((c, i) => lines.push(`    ${i+1}위 ${c.icon} ${c.name}: D${c.avgDay}`));
lines.push('');

const byHidden = [...charSummaries].sort((a, b) => b.avgHidden - a.avgHidden);
lines.push('  [히든 장소 발견 순위]');
byHidden.forEach((c, i) => lines.push(`    ${i+1}위 ${c.icon} ${c.name}: ${c.avgHidden}/25`));
lines.push('');

const byKills = [...charSummaries].sort((a, b) => b.avgKills - a.avgKills);
lines.push('  [평균 처치 순위]');
byKills.forEach((c, i) => lines.push(`    ${i+1}위 ${c.icon} ${c.name}: ${c.avgKills}`));
lines.push('');

const output = lines.join('\n');
const outputPath = 'sim_all_characters_result.txt';
writeFileSync(outputPath, output, 'utf-8');

// ── 콘솔 요약 ──
console.log('\n══════════════════════════════════════════════════════');
console.log('  6캐릭터 비교 요약');
console.log('══════════════════════════════════════════════════════');
console.log(`${'캐릭터'.padEnd(20)} ${'생존율'.padStart(7)} ${'평균일'.padStart(6)} ${'히든'.padStart(5)} ${'보스킬'.padStart(6)}`);
console.log('─'.repeat(50));
for (const c of charSummaries) {
  console.log(`${(c.icon + ' ' + c.name).padEnd(20)} ${(c.survRate+'%').padStart(7)} ${('D'+c.avgDay).padStart(6)} ${(c.avgHidden+'').padStart(5)} ${(c.avgBossKill+'').padStart(6)}`);
}
console.log(`\n상세 로그: ${outputPath}`);
