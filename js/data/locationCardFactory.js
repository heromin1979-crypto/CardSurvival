// === locationCardFactory.js ===
// districts.js를 단일 진리로 location/landmark 카드를 derive.
// 카드 ID 불변 (loc_*, lm_*). quest objective·NPC spawnLandmark·HospitalSiegeSystem 호환.
//
// 사용:
//   import { buildAllLocationCards, buildAllLandmarkCards } from './locationCardFactory.js';
//   const ITEMS_LOCATION = buildAllLocationCards();

import { DISTRICTS } from './districts.js';
import { LOCATION_CARD_META, LANDMARK_CARD_META } from './locationCardMeta.js';
import LANDMARK_DATA from './landmarks.js';

// 이벤트 전용 랜드마크 ID. landmarks.js LANDMARK_DATA에서 name·icon·desc를 derive.
// landmarks.js의 GameData import 제거로 순환 의존 해소 — 단일 진리.
const EVENT_LANDMARK_IDS = [
  'lm_raider_camp_small', 'lm_raider_camp_medium', 'lm_raider_camp_large',
  'lm_power_station', 'lm_water_plant', 'lm_comms_tower',
];

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
  for (const id of EVENT_LANDMARK_IDS) {
    const data = LANDMARK_DATA[id];
    if (!data) throw new Error(`[locationCardFactory] event landmark missing in landmarks.js: ${id}`);
    out[id] = buildEventLandmarkCard(id, { name: data.name, icon: data.icon, desc: data.desc });
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
