// === ITEM / CARD DEFINITIONS ===
// Game items split across 3 sub-files:
//   items_base.js   — 기초재료·가공재료·수분·식량 (41)
//   items_combat.js — 근접무기·원거리/투척·의복/방어구 (25)
//   items_misc.js   — 의료·도구·구조물·특수 (34)
// Location cards remain here (31)
// stackConfig.js overrides stackable/maxStack at runtime.

import STACK_CONFIG  from './stackConfig.js';
import ITEMS_BASE    from './items_base.js';
import ITEMS_COMBAT  from './items_combat.js';
import ITEMS_MISC    from './items_misc.js';

// ─── 장소 카드 (25개 구) ─────────────────────────────────────
const ITEMS_LOCATION = {

  loc_gangnam: {
    id: 'loc_gangnam', name: '강남구', type: 'location', subtype: 'medical',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏥', description: '의료 인프라가 집중된 지역. 삼성서울병원이 최대 물자 보고지만 좀비 밀도가 극히 높다.',
    nodeId: 'gangnam', districtId: 'gangnam',
    dangerLevel: 3, encounterChance: 0.50, travelCostTP: 2,
    tags: ['location', 'medical'], requiresSlot: 'top', dismantle: [],
  },
  loc_gangdong: {
    id: 'loc_gangdong', name: '강동구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏘️', description: '외곽 주거지역. 약탈이 덜 된 아파트 단지에서 식량과 생필품을 찾을 수 있다.',
    nodeId: 'gangdong', districtId: 'gangdong',
    dangerLevel: 2, encounterChance: 0.30, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_gangbuk: {
    id: 'loc_gangbuk', name: '강북구', type: 'location', subtype: 'safe',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⛰️', description: '북한산 아래 주거지역. 산악 접근로 덕분에 비교적 안전하고 자연 자원이 있다.',
    nodeId: 'gangbuk', districtId: 'gangbuk',
    dangerLevel: 1, encounterChance: 0.20, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_gangseo: {
    id: 'loc_gangseo', name: '강서구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '✈️', description: '김포공항 인근 공항 복합 지역. 항공 물류 창고에서 공구와 장비 부품을 찾을 수 있다.',
    nodeId: 'gangseo', districtId: 'gangseo',
    dangerLevel: 2, encounterChance: 0.35, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_gwanak: {
    id: 'loc_gwanak', name: '관악구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🎓', description: '서울대학교 캠퍼스. 연구소에 의약품 원료와 정수 장비가 남아있다.',
    nodeId: 'gwanak', districtId: 'gwanak',
    dangerLevel: 2, encounterChance: 0.30, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_gwangjin: {
    id: 'loc_gwangjin', name: '광진구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌉', description: '한강 인접 주거지역. 뚝섬과 어린이대공원 주변에 생활용품과 식량이 남아있다.',
    nodeId: 'gwangjin', districtId: 'gwangjin',
    dangerLevel: 2, encounterChance: 0.30, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_guro: {
    id: 'loc_guro', name: '구로구', type: 'location', subtype: 'industrial',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏭', description: '구로디지털단지. 공장과 창고에 공구, 전자부품, 금속 재료가 풍부하다.',
    nodeId: 'guro', districtId: 'guro',
    dangerLevel: 2, encounterChance: 0.35, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_geumcheon: {
    id: 'loc_geumcheon', name: '금천구', type: 'location', subtype: 'industrial',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚙️', description: '중소 공장 밀집 지역. 방사선 오염이 약간 있지만 금속 재료와 공구가 넘친다.',
    nodeId: 'geumcheon', districtId: 'geumcheon',
    dangerLevel: 2, encounterChance: 0.35, travelCostTP: 2,
    tags: ['location', 'radiation'], requiresSlot: 'top', dismantle: [],
  },
  loc_nowon: {
    id: 'loc_nowon', name: '노원구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏙️', description: '대규모 아파트 단지. 약탈됐지만 숨겨진 창고에서 식량과 생필품을 찾을 수 있다.',
    nodeId: 'nowon', districtId: 'nowon',
    dangerLevel: 2, encounterChance: 0.25, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_dobong: {
    id: 'loc_dobong', name: '도봉구', type: 'location', subtype: 'safe',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌲', description: '도봉산 아래 조용한 외곽지역. 감염자가 적고 자연 자원을 수집할 수 있다.',
    nodeId: 'dobong', districtId: 'dobong',
    dangerLevel: 1, encounterChance: 0.15, travelCostTP: 3,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_dongdaemun: {
    id: 'loc_dongdaemun', name: '동대문구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧵', description: '동대문 의류시장이 있던 섬유 중심지. 천과 의류 재료가 풍부하고 식료품도 남아있다.',
    nodeId: 'dongdaemun', districtId: 'dongdaemun',
    dangerLevel: 2, encounterChance: 0.35, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_dongjak: {
    id: 'loc_dongjak', name: '동작구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌊', description: '한강 남안 주거지역. 국립현충원이 있어 약탈이 적었고 생필품이 남아있다.',
    nodeId: 'dongjak', districtId: 'dongjak',
    dangerLevel: 2, encounterChance: 0.30, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_mapo: {
    id: 'loc_mapo', name: '마포구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏙️', description: '홍대·합정·여의나루. 한때 젊음의 거리였던 홍대와 발전소 인근 합정이 혼재한다.',
    nodeId: 'mapo', districtId: 'mapo',
    dangerLevel: 2, encounterChance: 0.35, travelCostTP: 2,
    tags: ['location', 'radiation'], requiresSlot: 'top', dismantle: [],
  },
  loc_seodaemun: {
    id: 'loc_seodaemun', name: '서대문구', type: 'location', subtype: 'medical',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏫', description: '연세대·세브란스병원. 의약품과 의료장비가 집중된 지역. 감염자 밀도 높음.',
    nodeId: 'seodaemun', districtId: 'seodaemun',
    dangerLevel: 3, encounterChance: 0.45, travelCostTP: 2,
    tags: ['location', 'medical'], requiresSlot: 'top', dismantle: [],
  },
  loc_seocho: {
    id: 'loc_seocho', name: '서초구', type: 'location', subtype: 'urban',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚖️', description: '법조타운·예술의전당. 고급 주거지였으나 현재는 감염자와 약탈자가 공존한다.',
    nodeId: 'seocho', districtId: 'seocho',
    dangerLevel: 3, encounterChance: 0.45, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_seongdong: {
    id: 'loc_seongdong', name: '성동구', type: 'location', subtype: 'industrial',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏭', description: '성수 공장지대. 금속 재료와 제작 도구가 풍부하나 방사선 오염이 있다.',
    nodeId: 'seongdong', districtId: 'seongdong',
    dangerLevel: 2, encounterChance: 0.35, travelCostTP: 2,
    tags: ['location', 'radiation'], requiresSlot: 'top', dismantle: [],
  },
  loc_seongbuk: {
    id: 'loc_seongbuk', name: '성북구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏛️', description: '고려대·성신여대 등 대학가. 학교 식당과 기숙사에 식량이 남아있다.',
    nodeId: 'seongbuk', districtId: 'seongbuk',
    dangerLevel: 2, encounterChance: 0.30, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_songpa: {
    id: 'loc_songpa', name: '송파구', type: 'location', subtype: 'urban',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗼', description: '롯데타워·올림픽경기장. 최후 생존자 거점이 있었던 곳. 물자는 풍부하나 위험하다.',
    nodeId: 'songpa', districtId: 'songpa',
    dangerLevel: 3, encounterChance: 0.45, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_yangcheon: {
    id: 'loc_yangcheon', name: '양천구', type: 'location', subtype: 'safe',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏡', description: '목동 주거지역. 대규모 아파트 단지로 약탈이 많이 됐지만 구석에 식량이 남아있다.',
    nodeId: 'yangcheon', districtId: 'yangcheon',
    dangerLevel: 1, encounterChance: 0.20, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_yeongdeungpo: {
    id: 'loc_yeongdeungpo', name: '영등포구', type: 'location', subtype: 'urban',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📡', description: '여의도·KBS방송국. 한강 섬. 방송 장비와 전자부품, 군용 물자가 있다.',
    nodeId: 'yeongdeungpo', districtId: 'yeongdeungpo',
    dangerLevel: 3, encounterChance: 0.50, travelCostTP: 3,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_yongsan: {
    id: 'loc_yongsan', name: '용산구', type: 'location', subtype: 'urban',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💻', description: '전자상가·이태원·미군기지. 무기, 전자부품, 군용 장비가 집중된 전략 거점.',
    nodeId: 'yongsan', districtId: 'yongsan',
    dangerLevel: 3, encounterChance: 0.50, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_eunpyeong: {
    id: 'loc_eunpyeong', name: '은평구', type: 'location', subtype: 'safe',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌲', description: '북한산 인접 외곽 지역. 비교적 안전하지만 물자가 부족하다. 신장동 쪽에 구청 창고가 있다.',
    nodeId: 'eunpyeong', districtId: 'eunpyeong',
    dangerLevel: 1, encounterChance: 0.18, travelCostTP: 3,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_jongno: {
    id: 'loc_jongno', name: '종로구', type: 'location', subtype: 'warzone',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏯', description: '서울의 심장. 광화문 정부청사와 경복궁. 군의 최후 방어선이 붕괴된 극위험 구역.',
    nodeId: 'jongno', districtId: 'jongno',
    dangerLevel: 4, encounterChance: 0.65, travelCostTP: 2,
    tags: ['location', 'radiation', 'military'], requiresSlot: 'top', dismantle: [],
  },
  loc_junggoo: {
    id: 'loc_junggoo', name: '중구', type: 'location', subtype: 'urban',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏙️', description: '명동·남대문시장·서울시청. 과거 상업 중심지. 좀비 밀도 높지만 다양한 물자가 있다.',
    nodeId: 'junggoo', districtId: 'junggoo',
    dangerLevel: 3, encounterChance: 0.50, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },
  loc_jungrang: {
    id: 'loc_jungrang', name: '중랑구', type: 'location', subtype: 'urban',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '중랑천 인근 주거지역. 중랑공원에서 자연 자원을 수집할 수 있다.',
    nodeId: 'jungrang', districtId: 'jungrang',
    dangerLevel: 2, encounterChance: 0.28, travelCostTP: 2,
    tags: ['location'], requiresSlot: 'top', dismantle: [],
  },

}; // END ITEMS_LOCATION (25개 구 카드)

// ─── 전체 병합 ────────────────────────────────────────────────
const ITEMS = {
  ...ITEMS_BASE,
  ...ITEMS_COMBAT,
  ...ITEMS_MISC,
  ...ITEMS_LOCATION,
};

// stackConfig.js 의 설정을 덮어씌워 적용
for (const [id, cfg] of Object.entries(STACK_CONFIG)) {
  if (ITEMS[id]) {
    ITEMS[id].stackable = cfg.stackable;
    ITEMS[id].maxStack  = cfg.maxStack;
  }
}

export default ITEMS;
