// === DISTRICTS — 서울 25개 구(區) 지역 시스템 ===
import BALANCE from './gameBalance.js';
// adjacentDistricts: 그리드 직교(상하좌우) 인접 구만 연결. 대각선 없음.
// 한강 장벽: 강북↔강남 직접 이동 불가. 다리 2개만 크로스-리버 연결:
//   서쪽 다리: mapo(강북, row2) ↔ yeongdeungpo(강남, row4)
//   동쪽 다리: gwangjin(강북, row2) ↔ gangdong(강남, row4)
//
// 강북 위험도: 은평·도봉·노원만 1등급. 나머지 강북은 2~4등급.
// 조우 확률: 전역 +5%p 상향 (v2).
// SUB_LOCATIONS 개념 폐지 — 구 단위 1계층 구조
//
// lootTable 원칙: 기초 재료 + 환경 오브젝트(분해용)만 배치.
// 가공품(붕대·구급키트·의약품·무기·탄약·도구)은 랜드마크 세부장소에서만 획득.

const DISTRICTS = {

  // ── 강남구 ──────────────────────────────────────────────────────
  gangnam: {
    id: 'gangnam', name: '강남구', icon: '🏥',
    description: '의료 인프라가 집중된 지역. 삼성서울병원이 최대 물자 보고지만 좀비 밀도가 극히 높다.',
    dangerLevel: 3, travelCostTP: 2, radiation: 0,
    encounterChance: 0.15, noiseGen: 7,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['seocho', 'songpa', 'dongjak'],
    landmark: 'lm_gangnam',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'water_bottle',  weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'traffic_light', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'vending_machine', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'telephone_booth', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_shelf', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'herb',          weight: 8,  minQty: 1, maxQty: 2 },
      // 한강 수변 자원 — 강남구 hasFishing
      { definitionId: 'rainwater',     weight: 8,  minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'nettle',        weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'wild_root',     weight: 5,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 한강 수변 모래
      { definitionId: 'sand',          weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: 'samsung_hospital',
  },

  // ── 강동구 ──────────────────────────────────────────────────────
  gangdong: {
    id: 'gangdong', name: '강동구', icon: '🏘️',
    description: '외곽 주거지역. 약탈이 덜 된 아파트 단지에서 생필품을 찾을 수 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 5,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['songpa', 'geumcheon', 'gwangjin'],
    landmark: 'lm_gangdong',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'wood',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'abandoned_fridge', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_chair',  weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_washing_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'matches',       weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'dry_grass',     weight: 5,  minQty: 1, maxQty: 1 },
      // 한강 수변 자원 — 강동구 hasFishing
      { definitionId: 'rainwater',     weight: 8,  minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'nettle',        weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 한강 수변 모래
      { definitionId: 'sand',          weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 강북구 ──────────────────────────────────────────────────────
  gangbuk: {
    id: 'gangbuk', name: '강북구', icon: '⛰️',
    description: '북한산 아래 주거지역. 산악 접근로 덕분에 비교적 안전하고 자연 자원이 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 2,
    adjacentDistricts: ['dobong', 'seongbuk', 'jungrang', 'dongdaemun'],
    landmark: 'lm_gangbuk',
    lootTable: [
      { definitionId: 'contaminated_water', weight: 20, minQty: 1, maxQty: 2, contamChance: 0.35 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'tree_log',      weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'herb',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'wood',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'street_vendor_cart', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_mailbox',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'rusted_toolbox', weight: 4, minQty: 1, maxQty: 1 },
      // 자연 환경 오브젝트 — 북한산 자락 자원
      { definitionId: 'withered_tree', weight: 14, minQty: 1, maxQty: 1 },
      { definitionId: 'tree_env',      weight: 12, minQty: 1, maxQty: 1 },
      { definitionId: 'pine_cone',     weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'dry_grass',     weight: 7,  minQty: 1, maxQty: 2 },
      { definitionId: 'pebble',        weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'firestone',     weight: 5,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 강북산악 채집 식물
      { definitionId: 'wild_berry',      weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'mushroom_edible', weight: 7,  minQty: 1, maxQty: 2 },
      { definitionId: 'acorn',           weight: 7,  minQty: 1, maxQty: 3 },
      { definitionId: 'pine_needle',     weight: 8,  minQty: 2, maxQty: 4 },
      { definitionId: 'wild_garlic',     weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',       weight: 7,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 산악 자연 식생·토양
      { definitionId: 'wild_wheat',      weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'worm',            weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 강서구 ──────────────────────────────────────────────────────
  gangseo: {
    id: 'gangseo', name: '강서구', icon: '✈️',
    description: '김포공항 인근 공항 복합 지역. 항공 물류 창고에서 공구와 장비 부품을 찾을 수 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 6,
    adjacentDistricts: ['yeongdeungpo', 'yangcheon'],
    landmark: 'lm_gangseo',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 30, minQty: 2, maxQty: 4 },
      { definitionId: 'rope',          weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'wire',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'nail',          weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_car',   weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'subway_gate',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_bus',   weight: 4,  minQty: 1, maxQty: 1 },
      // 신규 원자재 — 공항 물류 전자부품
      { definitionId: 'circuit_board', weight: 5,  minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 관악구 ──────────────────────────────────────────────────────
  gwanak: {
    id: 'gwanak', name: '관악구', icon: '🎓',
    description: '서울대학교 캠퍼스. 연구소에 의약품 원료와 정수 장비가 남아있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.02, noiseGen: 3,
    adjacentDistricts: ['dongjak', 'geumcheon', 'songpa'],
    landmark: 'lm_gwanak',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'herb',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'tree_log',      weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'wood',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_shelf', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_generator', weight: 4,  minQty: 1, maxQty: 1 },
      // 자연 환경 오브젝트 — 관악산·서울대 캠퍼스 자원
      { definitionId: 'withered_tree', weight: 12, minQty: 1, maxQty: 1 },
      { definitionId: 'weed_patch',    weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'pine_cone',     weight: 7,  minQty: 1, maxQty: 3 },
      { definitionId: 'dry_grass',     weight: 7,  minQty: 1, maxQty: 2 },
      { definitionId: 'firestone',     weight: 5,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 관악산·캠퍼스 채집 식물
      { definitionId: 'bamboo_shoot',    weight: 12, minQty: 1, maxQty: 2 },
      { definitionId: 'wild_berry',      weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'mushroom_edible', weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'acorn',           weight: 7,  minQty: 1, maxQty: 3 },
      { definitionId: 'dandelion',       weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'wild_root',       weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'herb_seed',       weight: 3,  minQty: 1, maxQty: 1 },
      // 신규 원자재 — 관악산 자연 식생·토양
      { definitionId: 'wild_wheat',      weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'worm',            weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: 'snu_lab',
  },

  // ── 광진구 ──────────────────────────────────────────────────────
  gwangjin: {
    id: 'gwangjin', name: '광진구', icon: '🌉',
    description: '한강 인접 주거지역. 뚝섬과 어린이대공원 주변에 생활용품이 남아있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 4,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['seongdong', 'gangdong'],
    landmark: 'lm_gwangjin',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'wood',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'rainwater',     weight: 10, minQty: 1, maxQty: 2, contamChance: 0.15 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'street_vendor_cart', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_mailbox',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'rusted_toolbox', weight: 4, minQty: 1, maxQty: 1 },
      // 자연 환경 오브젝트 — 어린이대공원·뚝섬 자원
      { definitionId: 'weed_patch',    weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'dry_grass',     weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'pebble',        weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'matches',       weight: 4,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 강변·공원 채집 식물
      { definitionId: 'nettle',        weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',     weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'wild_root',     weight: 7,  minQty: 1, maxQty: 2 },
      { definitionId: 'wild_berry',    weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 강변 모래·토양
      { definitionId: 'sand',          weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'worm',          weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 구로구 ──────────────────────────────────────────────────────
  guro: {
    id: 'guro', name: '구로구', icon: '🏭',
    description: '구로디지털단지. 공장과 창고에 공구, 전자부품, 금속 재료가 풍부하다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 6,
    adjacentDistricts: ['yangcheon', 'dongjak', 'seocho'],
    landmark: 'lm_guro',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 35, minQty: 2, maxQty: 5 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'electronic_parts', weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'wire',          weight: 12, minQty: 1, maxQty: 3 },
      { definitionId: 'nail',          weight: 10, minQty: 2, maxQty: 5 },
      { definitionId: 'cloth',         weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'old_generator', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_washing_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'vending_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_scaffold', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'old_ac_unit',   weight: 4,  minQty: 1, maxQty: 1 },
      // 화학 재료 — 공장 화약·도금 공정 잔류물
      { definitionId: 'sulfur',        weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'saltpeter',     weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'gravel_pile',   weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'soil_bag',      weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',     weight: 5,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 공장 전자부품·건설 모래
      { definitionId: 'circuit_board', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'sand',          weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 금천구 ──────────────────────────────────────────────────────
  geumcheon: {
    id: 'geumcheon', name: '금천구', icon: '⚙️',
    description: '중소 공장 밀집 지역. 방사선 오염이 약간 있지만 금속 재료와 공구가 넘친다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 5,
    encounterChance: 0.05, noiseGen: 5,
    adjacentDistricts: ['gwanak', 'gangdong'],
    landmark: 'lm_geumcheon',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 40, minQty: 2, maxQty: 6 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'electronic_parts', weight: 12, minQty: 1, maxQty: 2 },
      { definitionId: 'wire',          weight: 12, minQty: 1, maxQty: 3 },
      { definitionId: 'nail',          weight: 10, minQty: 2, maxQty: 5 },
      { definitionId: 'cloth',         weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'old_generator', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_washing_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'vending_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_scaffold', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'old_ac_unit',   weight: 4,  minQty: 1, maxQty: 1 },
      // 화학 재료 — 방사선 오염 공장 잔류 화학물
      { definitionId: 'sulfur',        weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'saltpeter',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'gravel_pile',   weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'soil_bag',      weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'dandelion',     weight: 5,  minQty: 1, maxQty: 2 },
      // 방사선 오염 잔류 — 금천구 radiation:5
      { definitionId: 'contaminated_water', weight: 12, minQty: 1, maxQty: 2, contamChance: 0.50 },
      // 신규 원자재 — 공장 전자부품
      { definitionId: 'circuit_board', weight: 5,  minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 노원구 ──────────────────────────────────────────────────────
  nowon: {
    id: 'nowon', name: '노원구', icon: '🏙️',
    description: '대규모 아파트 단지. 약탈됐지만 숨겨진 창고에서 생필품을 찾을 수 있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.02, noiseGen: 3,
    adjacentDistricts: ['dobong', 'jungrang'],
    landmark: 'lm_nowon',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'wood',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'abandoned_fridge', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_chair',  weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_washing_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'matches',       weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'dry_grass',     weight: 5,  minQty: 1, maxQty: 1 },
      // 불암산·수락산 인접 자연 자원
      { definitionId: 'pine_nut',        weight: 12, minQty: 1, maxQty: 3 },
      { definitionId: 'wild_strawberry', weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'acorn',           weight: 10, minQty: 1, maxQty: 4 },
      { definitionId: 'chestnut',        weight: 9,  minQty: 1, maxQty: 3 },
      { definitionId: 'wild_berry',      weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'mushroom_edible', weight: 7,  minQty: 1, maxQty: 2 },
      { definitionId: 'pine_needle',     weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 산간 자연 식생·토양
      { definitionId: 'wild_wheat',      weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'worm',            weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 도봉구 ──────────────────────────────────────────────────────
  dobong: {
    id: 'dobong', name: '도봉구', icon: '🌲',
    description: '도봉산 아래 조용한 외곽지역. 감염자가 적고 자연 자원을 수집할 수 있다.',
    dangerLevel: 1, travelCostTP: 3, radiation: 0,
    encounterChance: 0.02, noiseGen: 2,
    adjacentDistricts: ['nowon', 'gangbuk'],
    landmark: 'lm_dobong',
    lootTable: [
      { definitionId: 'contaminated_water', weight: 25, minQty: 1, maxQty: 2, contamChance: 0.30 },
      { definitionId: 'tree_log',      weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'herb',          weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'wood',          weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'water_bottle',  weight: 8,  minQty: 1, maxQty: 1, contamChance: 0.10 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'abandoned_fridge', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_chair',  weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'whetstone',     weight: 5,  minQty: 1, maxQty: 1 },
      // 자연 환경 오브젝트 — 불 시스템 재료 공급
      { definitionId: 'withered_tree', weight: 18, minQty: 1, maxQty: 1 },
      { definitionId: 'tree_env',      weight: 15, minQty: 1, maxQty: 1 },
      { definitionId: 'weed_patch',    weight: 12, minQty: 1, maxQty: 1 },
      { definitionId: 'gravel_pile',   weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'pine_cone',     weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'dry_grass',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'pebble',        weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'firestone',     weight: 6,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 도봉산 채집 식물
      { definitionId: 'wild_berry',      weight: 12, minQty: 1, maxQty: 3 },
      { definitionId: 'mushroom_edible', weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'mushroom_toxic',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'acorn',           weight: 10, minQty: 2, maxQty: 4 },
      { definitionId: 'pine_needle',     weight: 10, minQty: 2, maxQty: 4 },
      { definitionId: 'wild_garlic',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',       weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'wild_root',       weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'herb_seed',       weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'vegetable_seed',  weight: 2,  minQty: 1, maxQty: 1 },
      { definitionId: 'wild_strawberry', weight: 12, minQty: 1, maxQty: 3 },
      { definitionId: 'chestnut',        weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'wild_grape',      weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'pine_nut',        weight: 7,  minQty: 1, maxQty: 2 },
      { definitionId: 'apple_wild',      weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 도봉산 자연 식생·토양
      { definitionId: 'wild_wheat',      weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'worm',            weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 동대문구 ──────────────────────────────────────────────────────
  dongdaemun: {
    id: 'dongdaemun', name: '동대문구', icon: '🧵',
    description: '동대문 의류시장이 있던 섬유 중심지. 천과 의류 재료가 풍부하다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 5,
    adjacentDistricts: ['jongno', 'gangbuk', 'seongdong', 'junggoo'],
    landmark: 'lm_dongdaemun',
    lootTable: [
      { definitionId: 'cloth',         weight: 35, minQty: 2, maxQty: 5 },
      { definitionId: 'leather',       weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'thread',        weight: 15, minQty: 2, maxQty: 5 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'street_vendor_cart', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_mailbox',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'rusted_toolbox', weight: 4, minQty: 1, maxQty: 1 },
      // 기초 생존 자원 — 동대문 의류시장 외곽 잔류
      { definitionId: 'dry_grass',     weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',     weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'matches',       weight: 4,  minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 동작구 ──────────────────────────────────────────────────────
  dongjak: {
    id: 'dongjak', name: '동작구', icon: '🌊',
    description: '한강 남안 주거지역. 국립현충원이 있어 약탈이 적었고 생필품이 남아있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.02, noiseGen: 3,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['guro', 'gwanak', 'gangnam'],
    landmark: 'lm_dongjak',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'wood',          weight: 12, minQty: 1, maxQty: 2 },
      { definitionId: 'rainwater',     weight: 10, minQty: 1, maxQty: 1, contamChance: 0.10 },
      { definitionId: 'scrap_metal',   weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'street_vendor_cart', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_mailbox',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'rusted_toolbox', weight: 4, minQty: 1, maxQty: 1 },
      // 자연 환경 오브젝트 — 국립현충원 공원 자원
      { definitionId: 'withered_tree', weight: 12, minQty: 1, maxQty: 1 },
      { definitionId: 'weed_patch',    weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'dry_grass',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'pebble',        weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'matches',       weight: 4,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 현충원 공원 채집 식물
      { definitionId: 'dandelion',     weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'wild_root',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'wild_garlic',   weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'nettle',        weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'vegetable_seed',weight: 2,  minQty: 1, maxQty: 1 },
      // 신규 원자재 — 한강 수변 모래·공원 식생
      { definitionId: 'sand',            weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'wild_wheat',      weight: 6,  minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 마포구 ──────────────────────────────────────────────────────
  mapo: {
    id: 'mapo', name: '마포구', icon: '🏙️',
    description: '홍대·합정·여의나루. 한때 젊음의 거리였던 홍대와 발전소 인근 합정이 혼재한다.',
    dangerLevel: 3, travelCostTP: 2, radiation: 3,
    encounterChance: 0.15, noiseGen: 4,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['seodaemun', 'jongno', 'yeongdeungpo'],
    landmark: 'lm_mapo',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'scrap_metal',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'water_bottle',  weight: 10, minQty: 1, maxQty: 2, contamChance: 0.15 },
      { definitionId: 'wire',          weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_shelf', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_generator', weight: 4,  minQty: 1, maxQty: 1 },
      // 한강 수변·발전소 오염 자원 — 마포구 hasFishing, radiation:3
      { definitionId: 'rainwater',     weight: 10, minQty: 1, maxQty: 2, contamChance: 0.20 },
      { definitionId: 'contaminated_water', weight: 8, minQty: 1, maxQty: 2, contamChance: 0.35 },
      { definitionId: 'nettle',        weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 한강 수변 모래
      { definitionId: 'sand',          weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 서대문구 ──────────────────────────────────────────────────────
  seodaemun: {
    id: 'seodaemun', name: '서대문구', icon: '🏫',
    description: '연세대·세브란스병원. 의약품과 의료장비가 집중된 지역. 실험체가 배회하는 위험 구역.',
    dangerLevel: 4, travelCostTP: 2, radiation: 0,
    encounterChance: 0.25, noiseGen: 7,
    adjacentDistricts: ['eunpyeong', 'seongbuk', 'mapo'],
    landmark: 'lm_seodaemun',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 15, minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'herb',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_shelf', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_generator', weight: 4,  minQty: 1, maxQty: 1 },
      // 북한산 인접 자연 자원 — 서대문구
      { definitionId: 'tree_log',      weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'pine_cone',     weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',     weight: 5,  minQty: 1, maxQty: 2 },
    ],
    special: 'severance',
  },

  // ── 서초구 ──────────────────────────────────────────────────────
  seocho: {
    id: 'seocho', name: '서초구', icon: '⚖️',
    description: '법조타운·예술의전당. 약탈자 두목의 세력권. 무장 약탈자와 변이체가 공존한다.',
    dangerLevel: 4, travelCostTP: 2, radiation: 0,
    encounterChance: 0.25, noiseGen: 7,
    adjacentDistricts: ['gangnam', 'guro'],
    landmark: 'lm_seocho',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_bus',   weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'traffic_light', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'vending_machine', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'telephone_booth', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'destroyed_kiosk', weight: 5, minQty: 1, maxQty: 1 },
      // 우면산 인접 자연 자원 — 서초구
      { definitionId: 'herb',          weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'tree_log',      weight: 6,  minQty: 1, maxQty: 1 },
      { definitionId: 'wild_berry',    weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'dry_grass',     weight: 5,  minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 성동구 ──────────────────────────────────────────────────────
  seongdong: {
    id: 'seongdong', name: '성동구', icon: '🏭',
    description: '성수 공장지대. 금속 재료와 제작 도구가 풍부하나 방사선 오염이 있다.',
    dangerLevel: 3, travelCostTP: 2, radiation: 5,
    encounterChance: 0.15, noiseGen: 4,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['dongdaemun', 'jungrang', 'gwangjin'],
    landmark: 'lm_seongdong',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 40, minQty: 2, maxQty: 6 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'electronic_parts', weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'wire',          weight: 12, minQty: 1, maxQty: 3 },
      { definitionId: 'nail',          weight: 10, minQty: 2, maxQty: 5 },
      { definitionId: 'leather',       weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'old_generator', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_washing_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'vending_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_scaffold', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'old_ac_unit',   weight: 4,  minQty: 1, maxQty: 1 },
      // 화학 재료 — 성수 공장 도금·방사선 오염 잔류물
      { definitionId: 'sulfur',        weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'gravel_pile',   weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'soil_bag',      weight: 8,  minQty: 1, maxQty: 2 },
      // 한강 수변·방사선 오염 자원 — 성동구 hasFishing, radiation:5
      { definitionId: 'contaminated_water', weight: 12, minQty: 1, maxQty: 2, contamChance: 0.50 },
      { definitionId: 'rainwater',     weight: 8,  minQty: 1, maxQty: 2, contamChance: 0.20 },
      // 신규 원자재 — 성수 공장 전자부품
      { definitionId: 'circuit_board', weight: 5,  minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 성북구 ──────────────────────────────────────────────────────
  seongbuk: {
    id: 'seongbuk', name: '성북구', icon: '🏛️',
    description: '고려대·성신여대 등 대학가. 학교 건물에 생필품이 남아있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 3,
    adjacentDistricts: ['seodaemun', 'gangbuk', 'jongno'],
    landmark: 'lm_seongbuk',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'wood',          weight: 12, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'tree_log',      weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'abandoned_fridge', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_chair',  weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_washing_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'withered_tree', weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'pine_cone',     weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'matches',       weight: 4,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 성북 대학가 공원 채집 식물
      { definitionId: 'dandelion',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'wild_garlic',   weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'herb_seed',     weight: 3,  minQty: 1, maxQty: 1 },
      // 북한산 자락·대학 캠퍼스 자연 자원 확장 — 성북구
      { definitionId: 'wild_berry',      weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'mushroom_edible', weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'acorn',           weight: 5,  minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 송파구 ──────────────────────────────────────────────────────
  songpa: {
    id: 'songpa', name: '송파구', icon: '🗼',
    description: '롯데월드타워 119층. 최후 생존자 거점이 함락된 후 변이체의 소굴이 되었다.',
    dangerLevel: 5, travelCostTP: 2, radiation: 0,
    encounterChance: 0.35, noiseGen: 8,
    hasFishing: true, fishingQuality: 3,
    adjacentDistricts: ['gangnam', 'gangdong', 'gwanak'],
    landmark: 'lm_songpa',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'wire',          weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_car',   weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'subway_gate',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_bus',   weight: 4,  minQty: 1, maxQty: 1 },
      // 한강 수변 자원 — 송파구 hasFishing
      { definitionId: 'rainwater',     weight: 8,  minQty: 1, maxQty: 2, contamChance: 0.15 },
      { definitionId: 'nettle',        weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'wild_root',     weight: 5,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 한강 수변 모래
      { definitionId: 'sand',          weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: 'lotte_tower',
  },

  // ── 양천구 ──────────────────────────────────────────────────────
  yangcheon: {
    id: 'yangcheon', name: '양천구', icon: '🏡',
    description: '목동 주거지역. 대규모 아파트 단지로 약탈이 많이 됐지만 구석에 생필품이 남아있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.02, noiseGen: 3,
    adjacentDistricts: ['gangseo', 'guro'],
    landmark: 'lm_yangcheon',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'wood',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'abandoned_fridge', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_chair',  weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'broken_washing_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'matches',       weight: 5,  minQty: 1, maxQty: 2 },
      // 안양천 인접 자원 — 양천구
      { definitionId: 'dry_grass',     weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'wild_root',     weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',     weight: 5,  minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 영등포구 ──────────────────────────────────────────────────────
  yeongdeungpo: {
    id: 'yeongdeungpo', name: '영등포구', icon: '📡',
    description: '여의도·KBS방송국. 약탈자 두목의 본거지. 방송 장비와 군용 물자가 있으나 극히 위험.',
    dangerLevel: 4, travelCostTP: 3, radiation: 0,
    encounterChance: 0.25, noiseGen: 7,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['gangseo', 'mapo'],
    landmark: 'lm_yeongdeungpo',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'wire',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'electronic_parts', weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_car',   weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'subway_gate',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_bus',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'destroyed_kiosk', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_guard_post', weight: 4, minQty: 1, maxQty: 1 },
      // 한강 수변 자원 — 영등포구 hasFishing (여의도)
      { definitionId: 'rainwater',     weight: 8,  minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'nettle',        weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 방송 장비 전자부품
      { definitionId: 'circuit_board', weight: 5,  minQty: 1, maxQty: 1 },
    ],
    special: 'kbs',
  },

  // ── 용산구 ──────────────────────────────────────────────────────
  yongsan: {
    id: 'yongsan', name: '용산구', icon: '💻',
    description: '전자상가·이태원·미군기지. 전자부품과 금속 재료가 집중된 전략 거점.',
    dangerLevel: 3, travelCostTP: 2, radiation: 0,
    encounterChance: 0.15, noiseGen: 6,
    hasFishing: true, fishingQuality: 2,
    adjacentDistricts: ['jongno', 'junggoo'],
    landmark: 'lm_yongsan',
    lootTable: [
      { definitionId: 'electronic_parts', weight: 25, minQty: 2, maxQty: 5 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'wire',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_guard_post', weight: 6, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_car',   weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'subway_gate',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_bus',   weight: 4,  minQty: 1, maxQty: 1 },
      // 한강 수변 자원 — 용산구 hasFishing
      { definitionId: 'rainwater',     weight: 8,  minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'nettle',        weight: 5,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 전자상가 전자부품
      { definitionId: 'circuit_board', weight: 5,  minQty: 1, maxQty: 1 },
    ],
    special: 'us_base',
  },

  // ── 은평구 ──────────────────────────────────────────────────────
  eunpyeong: {
    id: 'eunpyeong', name: '은평구', icon: '🌲',
    description: '북한산 인접 외곽 지역. 비교적 안전하지만 물자가 부족하다. 신장동 쪽에 구청 창고가 있다.',
    dangerLevel: 1, travelCostTP: 3, radiation: 0,
    encounterChance: 0.02, noiseGen: 2,
    adjacentDistricts: ['seodaemun'],
    landmark: 'lm_eunpyeong',
    lootTable: [
      { definitionId: 'tree_log',      weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'herb',          weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'wood',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'water_bottle',  weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'street_vendor_cart', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_mailbox',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'rusted_toolbox', weight: 4, minQty: 1, maxQty: 1 },
      // 자연 환경 오브젝트 — 북한산 자락 자원
      { definitionId: 'withered_tree', weight: 16, minQty: 1, maxQty: 1 },
      { definitionId: 'tree_env',      weight: 14, minQty: 1, maxQty: 1 },
      { definitionId: 'weed_patch',    weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'pine_cone',     weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'dry_grass',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'pebble',        weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'firestone',     weight: 6,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 북한산 자락 채집 식물
      { definitionId: 'wild_berry',      weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'mushroom_edible', weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'acorn',           weight: 8,  minQty: 2, maxQty: 4 },
      { definitionId: 'pine_needle',     weight: 10, minQty: 2, maxQty: 4 },
      { definitionId: 'wild_garlic',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',       weight: 8,  minQty: 1, maxQty: 3 },
      { definitionId: 'wild_root',       weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'herb_seed',       weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'chestnut',        weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'apple_wild',      weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'wild_strawberry', weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'pine_nut',        weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 북한산 자연 식생·토양
      { definitionId: 'wild_wheat',      weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'worm',            weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },

  // ── 종로구 ──────────────────────────────────────────────────────
  jongno: {
    id: 'jongno', name: '종로구', icon: '🏯',
    description: '서울의 심장. 광화문 정부청사와 경복궁. 군의 최후 방어선이 붕괴된 극위험 구역. 좀비의 왕이 지배한다.',
    dangerLevel: 5, travelCostTP: 2, radiation: 10,
    encounterChance: 0.35, noiseGen: 8,
    adjacentDistricts: ['mapo', 'seongbuk', 'dongdaemun', 'yongsan'],
    landmark: 'lm_jongno',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 25, minQty: 2, maxQty: 4 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'wire',          weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_bus',   weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'traffic_light', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'vending_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'telephone_booth', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'destroyed_kiosk', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'collapsed_guard_post', weight: 5, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_car',   weight: 5,  minQty: 1, maxQty: 1 },
      // 방사선 극심 오염 자원 — 종로구 radiation:10
      { definitionId: 'contaminated_water', weight: 15, minQty: 1, maxQty: 3, contamChance: 0.80 },
      { definitionId: 'sulfur',        weight: 8,  minQty: 1, maxQty: 2 },
    ],
    special: 'gwanghwamun',
  },

  // ── 중구 ──────────────────────────────────────────────────────
  junggoo: {
    id: 'junggoo', name: '중구', icon: '🏙️',
    description: '명동·남대문시장·서울시청. 지하철에서 올라온 좀비 무리가 도심을 완전히 점령했다.',
    dangerLevel: 5, travelCostTP: 2, radiation: 0,
    encounterChance: 0.35, noiseGen: 8,
    adjacentDistricts: ['yongsan', 'dongdaemun'],
    landmark: 'lm_junggoo',
    lootTable: [
      { definitionId: 'cloth',         weight: 30, minQty: 2, maxQty: 5 },
      { definitionId: 'leather',       weight: 12, minQty: 1, maxQty: 2 },
      { definitionId: 'thread',        weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'wrecked_bus',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'traffic_light', weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'vending_machine', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'telephone_booth', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'destroyed_kiosk', weight: 5, minQty: 1, maxQty: 1 },
      // 시장 잔류 기초 자원 — 중구 (남대문시장)
      { definitionId: 'matches',       weight: 5,  minQty: 1, maxQty: 2 },
      { definitionId: 'dry_grass',     weight: 4,  minQty: 1, maxQty: 1 },
    ],
    special: 'seoul_city_hall',
  },

  // ── 중랑구 ──────────────────────────────────────────────────────
  jungrang: {
    id: 'jungrang', name: '중랑구', icon: '🌿',
    description: '중랑천 인근 주거지역. 중랑공원에서 자연 자원을 수집할 수 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 3,
    adjacentDistricts: ['nowon', 'gangbuk', 'seongdong'],
    landmark: 'lm_jungrang',
    lootTable: [
      { definitionId: 'contaminated_water', weight: 20, minQty: 1, maxQty: 2, contamChance: 0.25 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'herb',          weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 12, minQty: 1, maxQty: 2 },
      { definitionId: 'wood',          weight: 12, minQty: 1, maxQty: 2 },
      { definitionId: 'rainwater',     weight: 10, minQty: 1, maxQty: 1, contamChance: 0.20 },
      { definitionId: 'broken_radio',  weight: 3,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_fire_extinguisher', weight: 3, minQty: 1, maxQty: 1 },
      { definitionId: 'street_vendor_cart', weight: 4, minQty: 1, maxQty: 1 },
      { definitionId: 'broken_lamp',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'old_mailbox',   weight: 4,  minQty: 1, maxQty: 1 },
      { definitionId: 'rusted_toolbox', weight: 4, minQty: 1, maxQty: 1 },
      // 자연 환경 오브젝트 — 중랑공원·중랑천 자원
      { definitionId: 'withered_tree', weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'weed_patch',    weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'dry_grass',     weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'pine_cone',     weight: 6,  minQty: 1, maxQty: 2 },
      // 식생 확장 — 중랑천·공원 강변 채집 식물
      { definitionId: 'nettle',          weight: 12, minQty: 1, maxQty: 3 },
      { definitionId: 'bamboo_shoot',    weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'dandelion',       weight: 10, minQty: 1, maxQty: 3 },
      { definitionId: 'wild_root',       weight: 8,  minQty: 1, maxQty: 2 },
      { definitionId: 'mushroom_edible', weight: 6,  minQty: 1, maxQty: 2 },
      // 신규 원자재 — 중랑천 자연 식생·토양
      { definitionId: 'wild_wheat',      weight: 6,  minQty: 1, maxQty: 2 },
      { definitionId: 'worm',            weight: 8,  minQty: 1, maxQty: 3 },
    ],
    special: null,
  },
};

// ── 헬퍼 함수 ──────────────────────────────────────────────────

/** 인접 구 목록 반환 */
function getAdjacentDistricts(districtId) {
  const d = DISTRICTS[districtId];
  if (!d) return [];
  return (d.adjacentDistricts ?? []).map(id => DISTRICTS[id]).filter(Boolean);
}

/** 구 단위 루팅 결과 생성 */
function generateDistrictLoot(districtId) {
  const district = DISTRICTS[districtId];
  if (!district?.lootTable?.length) return [];

  const results = [];
  const totalWeight = district.lootTable.reduce((s, e) => s + e.weight, 0);
  const count = BALANCE.explore.lootCountMin + Math.floor(Math.random() * (BALANCE.explore.lootCountMax - BALANCE.explore.lootCountMin + 1)); // 1~3개

  for (let i = 0; i < count; i++) {
    let rand = Math.random() * totalWeight;
    for (const entry of district.lootTable) {
      rand -= entry.weight;
      if (rand <= 0) {
        const qty = entry.minQty + Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1));
        const contaminated = Math.random() < (entry.contamChance ?? 0);
        results.push({
          definitionId:  entry.definitionId,
          quantity:      qty,
          contamination: contaminated ? 50 + Math.floor(Math.random() * 50) : 0,
        });
        break;
      }
    }
  }
  return results;
}

// SUB_LOCATIONS 제거됨 (구 단위 1계층 구조)
const SUB_LOCATIONS = {};

export {
  DISTRICTS,
  SUB_LOCATIONS,
  getAdjacentDistricts,
  generateDistrictLoot,
};

// 레거시 호환 함수
export function getSubLocations() { return []; }
export function generateSubLocationLoot(districtId) { return generateDistrictLoot(districtId); }
