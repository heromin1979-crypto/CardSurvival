// === ITEM / CARD DEFINITIONS ===
// Game items split across 7 sub-files:
//   items_base.js       — 기초재료·가공재료·수분·식량
//   items_combat.js     — 근접무기·원거리/투척·의복/방어구
//   items_misc.js       — 가방·특수·식량·무기·재료·기타
//   items_tech.js       — 전자부품·에너지·첨단장비
//   items_medical.js    — 의료 아이템 (소모품)
//   items_tools.js      — 도구 (가방 제외)
//   items_structures.js — 구조물·환경 오브젝트
// Location cards remain here (31)
// stackConfig.js overrides stackable/maxStack at runtime.

import STACK_CONFIG      from './stackConfig.js';
import ITEMS_BASE        from './items_base.js';
import ITEMS_COMBAT      from './items_combat.js';
import ITEMS_MISC        from './items_misc.js';
import ITEMS_TECH        from './items_tech.js';
import ITEMS_MEDICAL     from './items_medical.js';
import ITEMS_TOOLS       from './items_tools.js';
import ITEMS_STRUCTURES  from './items_structures.js';
import LEGENDARY_ITEMS   from './legendaryItems.js';
import { buildAllLocationCards, buildAllLandmarkCards, buildAllEventLandmarkCards, buildAllHangangCards } from './locationCardFactory.js';


// ─── 장소 카드 (25개 구) ─────────────────────────────────────
// districts.js를 단일 진리로 derive (이슈 4 마이그레이션).
const ITEMS_LOCATION = buildAllLocationCards();

// ─── 랜드마크 카드 (정식 25 + 이벤트 전용) ──────────────────
// 정식 25 랜드마크는 LANDMARK_CARD_META에서 derive.
// 이벤트 전용(lm_raider_camp_*, lm_power_station 등)은 landmarks.js의 LANDMARK_DATA가 별도 관리.
// basecamp_landmark는 특수 필드(safeZone·weatherProtection 등) 보유 → 여기서 별도 정의.
const ITEMS_LANDMARK = {
  ...buildAllLandmarkCards(),
  ...buildAllEventLandmarkCards(),
  ...buildAllHangangCards(),

  // 베이스캠프 랜드마크 — 직접 건설한 안전 거점. 팩토리로 derive 불가 (특수 플래그).
  basecamp_landmark: {
    id: 'basecamp_landmark',
    name: '베이스캠프',
    type: 'location',
    subtype: 'shelter',
    rarity: 'unique',
    weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    landmark: true,
    icon: '🏕',
    description: '직접 건설한 안전 거점. 비바람과 혹한·혹서를 차단하고, NPC가 합류할 수 있는 숙소 역할을 한다.',
    landmarkBonus: '날씨 패널티 면역 · 식량 오염 차단 · 체온 ±완충 · 조우 -10%',
    safeZone: true,
    weatherProtection: true,
    contaminationShield: true,
    npcShelter: true,
    tags: ['location', 'landmark', 'shelter', 'safe'],
    requiresSlot: 'top',
    dismantle: [],
  },
};


// ─── 전체 병합 ────────────────────────────────────────────────
const ITEMS = {
  ...ITEMS_BASE,
  ...ITEMS_COMBAT,
  ...ITEMS_MISC,
  ...ITEMS_TECH,
  ...ITEMS_MEDICAL,
  ...ITEMS_TOOLS,
  ...ITEMS_STRUCTURES,
  ...LEGENDARY_ITEMS,
  ...ITEMS_LOCATION,
  ...ITEMS_LANDMARK,
};

// stackConfig.js 의 설정을 덮어씌워 적용
for (const [id, cfg] of Object.entries(STACK_CONFIG)) {
  if (ITEMS[id]) {
    ITEMS[id].stackable = cfg.stackable;
    ITEMS[id].maxStack  = cfg.maxStack;
  }
}

for (const def of Object.values(ITEMS)) {
  if (def.type === 'consumable' && !def.onConsume && def.onUse) {
    def.onConsume = { ...def.onUse };
  }
}

export default ITEMS;
