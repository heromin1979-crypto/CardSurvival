// === locationCardFactory.js ===
// districts.js를 단일 진리로 location/landmark 카드를 derive.
// 카드 ID 불변 (loc_*, lm_*). quest objective·NPC spawnLandmark·HospitalSiegeSystem 호환.
//
// 사용:
//   import { buildAllLocationCards, buildAllLandmarkCards } from './locationCardFactory.js';
//   const ITEMS_LOCATION = buildAllLocationCards();

import { DISTRICTS } from './districts.js';
import { LOCATION_CARD_META, LANDMARK_CARD_META } from './locationCardMeta.js';

// 이벤트 전용 랜드마크 — landmarks.js LANDMARK_DATA에서 메타 추출.
// 순환 의존 회피를 위해 정적 메타 보유. landmarks.js 본문 변경 시 본 표 갱신 필요.
const EVENT_LANDMARK_META = {
  lm_raider_camp_small:  { name: '소규모 약탈자 캠프', icon: '🏴', desc: '도봉산 기슭에 자리 잡은 약탈자 임시 캠프. 인질로 잡힌 민간인이 숨겨져 있다.' },
  lm_raider_camp_medium: { name: '중규모 약탈자 캠프', icon: '🏴', desc: '약탈자 무리의 중간 규모 거점. 다수 인질 보유.' },
  lm_raider_camp_large:  { name: '대규모 약탈자 캠프', icon: '🏴', desc: '약탈자 본거지. 약탈자 두목과 인질 다수.' },
  lm_power_station:      { name: '구로 발전소',         icon: '⚡', desc: '구로 화력 발전소. 붕괴 전 서울 서남부 전력 공급의 핵심 시설.' },
  lm_water_plant:        { name: '은평 정수장',         icon: '💧', desc: '은평구 상수도 정수장. 펌프와 배관이 파손돼 수도 공급이 끊긴 상태.' },
  lm_comms_tower:        { name: '통신 중계탑',         icon: '📡', desc: '서울 통신 중계탑. 비상 방송망 복구의 핵심 시설.' },
};

function buildEventLandmarkCard(landmarkId, meta) {
  return {
    id: landmarkId,
    name: meta.name,
    type: 'location',
    subtype: 'event_landmark',
    rarity: 'unique',
    weight: 0,
    stackable: false,
    maxStack: 1,
    defaultDurability: 100,
    defaultContamination: 0,
    landmark: true,
    icon: meta.icon,
    description: meta.desc,
    landmarkBonus: null,
    tags: ['location', 'landmark', 'event'],
    requiresSlot: 'top',
    dismantle: [],
  };
}

export function buildAllEventLandmarkCards() {
  const out = {};
  for (const [id, meta] of Object.entries(EVENT_LANDMARK_META)) {
    out[id] = buildEventLandmarkCard(id, meta);
  }
  return out;
}

export function buildLocationCard(districtId, meta) {
  const d = DISTRICTS[districtId];
  if (!d) throw new Error(`[locationCardFactory] unknown district: ${districtId}`);

  return {
    id: `loc_${districtId}`,
    name: d.name,
    type: 'location',
    subtype: meta.subtype,
    rarity: meta.rarity,
    weight: 0,
    stackable: false,
    maxStack: 1,
    defaultDurability: 100,
    defaultContamination: 0,
    icon: d.icon,
    description: d.description,
    nodeId: districtId,
    districtId,
    dangerLevel: d.dangerLevel,
    encounterChance: d.encounterChance,
    travelCostTP: d.travelCostTP,
    tags: meta.tags,
    requiresSlot: 'top',
    dismantle: [],
  };
}

export function buildLandmarkCard(landmarkId, meta) {
  // landmark은 districts.js의 landmark 필드와 직접 매칭 안 됨 (lm_boramae_hospital 등 특수 포함)
  // 카드 메타는 LANDMARK_CARD_META 그대로 사용.
  return {
    id: landmarkId,
    name: meta.name,
    type: 'location',
    subtype: meta.subtype ?? 'landmark',
    rarity: meta.rarity,
    weight: 0,
    stackable: false,
    maxStack: 1,
    defaultDurability: 100,
    defaultContamination: 0,
    landmark: true,
    icon: meta.icon,
    description: meta.description,
    landmarkBonus: meta.landmarkBonus,
    ...(meta.districtId ? { districtId: meta.districtId } : {}),
    tags: meta.tags,
    requiresSlot: 'top',
    dismantle: [],
  };
}

export function buildAllLocationCards() {
  const out = {};
  for (const [districtId, meta] of Object.entries(LOCATION_CARD_META)) {
    out[`loc_${districtId}`] = buildLocationCard(districtId, meta);
  }
  return out;
}

// basecamp_landmark는 특수 필드(safeZone·weatherProtection 등) 보유 → items.js에서 별도 정의 유지.
const FACTORY_SKIP = new Set(['basecamp_landmark']);

export function buildAllLandmarkCards() {
  const out = {};
  for (const [lmId, meta] of Object.entries(LANDMARK_CARD_META)) {
    if (FACTORY_SKIP.has(lmId)) continue;
    out[lmId] = buildLandmarkCard(lmId, meta);
  }
  return out;
}
