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
  gangnam: {
    id: 'gangnam',
    name: '강남구',
    icon: '🏥',
    description: '의료 인프라가 집중된 지역. 삼성서울병원이 최대 물자 보고지만 좀비 밀도가 극히 높다.',
    dangerLevel: 3,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.15,
    noiseGen: 7,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'seocho',
      'songpa',
      'dongjak',
    ],
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'bandage',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'antiseptic',
        weight: 20,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'leather',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'old_fire_extinguisher',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_shelf',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'traffic_light',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_ac_unit',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'samsung_hospital',
    landmarks: [
      'lm_gangnam',
      'lm_hangang_gangnam',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'alcohol_solution',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'herb_powder',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'infected_blood_sample',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  gangdong: {
    id: 'gangdong',
    name: '강동구',
    icon: '🏘️',
    description: '외곽 주거지역. 약탈이 덜 된 아파트 단지에서 생필품을 찾을 수 있다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 5,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'songpa',
      'geumcheon',
      'gwangjin',
    ],
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'water_bottle',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'canned_food',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'plastic',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'broken_lamp',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'rusted_toolbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'abandoned_fridge',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_bicycle',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    landmarks: [
      'lm_gangdong',
      'lm_hangang_gangdong',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'firestone',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'woven_fabric',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'grain_seed',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  gangbuk: {
    id: 'gangbuk',
    name: '강북구',
    icon: '⛰️',
    description: '북한산 아래 주거지역. 산악 접근로 덕분에 비교적 안전하고 자연 자원이 있다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 2,
    adjacentDistricts: [
      'dobong',
      'seongbuk',
      'jungrang',
      'dongdaemun',
    ],
    landmark: 'lm_gangbuk',
    lootTable: [
      {
        definitionId: 'wood',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'herb',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'wild_berry',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'water_bottle',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'bait_worm',
        weight: 8,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'stream_spring',
        weight: 12,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_mailbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'withered_tree',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'tree_env',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'firestone',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'herb_seed',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'honey',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  gangseo: {
    id: 'gangseo',
    name: '강서구',
    icon: '✈️',
    description: '김포공항 인근 공항 복합 지역. 항공 물류 창고에서 공구와 장비 부품을 찾을 수 있다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 6,
    adjacentDistricts: [
      'yeongdeungpo',
      'yangcheon',
    ],
    landmark: 'lm_gangseo',
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 40,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'wire',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'duct_tape',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'rope',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'old_fire_extinguisher',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'rusted_toolbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_washing_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_bicycle',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'brass_fragment',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'aviation_alloy',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'rotor_blade',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  gwanak: {
    id: 'gwanak',
    name: '관악구',
    icon: '🎓',
    description: '서울대학교 캠퍼스. 연구소에 의약품 원료와 정수 장비가 남아있다.',
    dangerLevel: 1,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.02,
    noiseGen: 3,
    adjacentDistricts: [
      'dongjak',
      'geumcheon',
      'songpa',
    ],
    landmark: 'lm_gwanak',
    lootTable: [
      {
        definitionId: 'herb',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'glass_shard',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'plastic',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'alcohol_solution',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'bait_worm',
        weight: 8,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'stream_spring',
        weight: 12,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_chair',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'weed_patch',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'withered_tree',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'snu_lab',
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'charcoal_filter',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'saltpeter',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'circuit_module',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  gwangjin: {
    id: 'gwangjin',
    name: '광진구',
    icon: '🌉',
    description: '한강 인접 주거지역. 뚝섬과 어린이대공원 주변에 생활용품이 남아있다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 4,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'seongdong',
      'gangdong',
    ],
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'water_bottle',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'wild_berry',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'rope',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'bait_worm',
        weight: 8,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'street_vendor_cart',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'weed_patch',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'tree_env',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_bicycle',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    landmarks: [
      'lm_gwangjin',
      'lm_hangang_gwangjin',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'vegetable_seed',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'herb_powder',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'honey',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  guro: {
    id: 'guro',
    name: '구로구',
    icon: '🏭',
    description: '구로디지털단지. 공장과 창고에 공구, 전자부품, 금속 재료가 풍부하다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 6,
    adjacentDistricts: [
      'yangcheon',
      'dongjak',
      'seocho',
    ],
    landmark: 'lm_guro',
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'electronic_parts',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'wire',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'rubber',
        weight: 18,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'broken_radio',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'rusted_toolbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'vending_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_washing_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'copper_coil',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'microchip',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'circuit_module',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  geumcheon: {
    id: 'geumcheon',
    name: '금천구',
    icon: '⚙️',
    description: '중소 공장 밀집 지역. 방사선 오염이 약간 있지만 금속 재료와 공구가 넘친다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 5,
    encounterChance: 0.05,
    noiseGen: 5,
    adjacentDistricts: [
      'gwanak',
      'gangdong',
    ],
    landmark: 'lm_geumcheon',
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 40,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'nail',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'wire',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'spring',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'gravel_pile',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'rusted_toolbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'vending_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_shelf',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'refined_metal',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'lead_ingot',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'steel_plate',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  nowon: {
    id: 'nowon',
    name: '노원구',
    icon: '🏙️',
    description: '대규모 아파트 단지. 약탈됐지만 숨겨진 창고에서 생필품을 찾을 수 있다.',
    dangerLevel: 1,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.02,
    noiseGen: 3,
    adjacentDistricts: [
      'dobong',
      'jungrang',
    ],
    landmark: 'lm_nowon',
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'water_bottle',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'empty_can',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'canned_food',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'bait_worm',
        weight: 8,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'stream_spring',
        weight: 12,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_lamp',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_mailbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'abandoned_fridge',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'duct_tape',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'woven_fabric',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'grain_seed',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  dobong: {
    id: 'dobong',
    name: '도봉구',
    icon: '🌲',
    description: '도봉산 아래 조용한 외곽지역. 감염자가 적고 자연 자원을 수집할 수 있다.',
    dangerLevel: 1,
    travelCostTP: 3,
    radiation: 0,
    encounterChance: 0.02,
    noiseGen: 2,
    adjacentDistricts: [
      'nowon',
      'gangbuk',
    ],
    landmark: 'lm_dobong',
    lootTable: [
      {
        definitionId: 'wood',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'herb',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'mushroom_edible',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'hide',
        weight: 15,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'bait_worm',
        weight: 8,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'stream_spring',
        weight: 12,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'gravel_pile',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'rusted_toolbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'tree_env',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'firestone',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'mushroom_toxic',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'honey',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  dongdaemun: {
    id: 'dongdaemun',
    name: '동대문구',
    icon: '🧵',
    description: '동대문 의류시장이 있던 섬유 중심지. 천과 의류 재료가 풍부하다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 5,
    adjacentDistricts: [
      'jongno',
      'gangbuk',
      'seongdong',
      'junggoo',
    ],
    landmark: 'lm_dongdaemun',
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'thread',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'leather',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'large_cloth',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'street_vendor_cart',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_lamp',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_shelf',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'telephone_booth',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'large_cloth',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'woven_fabric',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'reinforced_fabric',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  dongjak: {
    id: 'dongjak',
    name: '동작구',
    icon: '🌊',
    description: '한강 남안 주거지역. 보라매병원과 국립현충원이 공존하는 비교적 안전한 구.',
    dangerLevel: 1,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.02,
    noiseGen: 3,
    adjacentDistricts: [
      'guro',
      'gwanak',
      'gangnam',
    ],
    landmarks: [
      'lm_boramae_hospital',
      'lm_dongjak',
    ],
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'water_bottle',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'bandage',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'broken_lamp',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_radio',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_fire_extinguisher',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'tree_env',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'alcohol_solution',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'brass_fragment',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'kevlar_fabric',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  mapo: {
    id: 'mapo',
    name: '마포구',
    icon: '🏙️',
    description: '홍대·합정·여의나루. 한때 젊음의 거리였던 홍대와 발전소 인근 합정이 혼재한다.',
    dangerLevel: 3,
    travelCostTP: 2,
    radiation: 3,
    encounterChance: 0.15,
    noiseGen: 4,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'seodaemun',
      'jongno',
      'yeongdeungpo',
    ],
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'empty_bottle',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'rubber',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'wire',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'street_vendor_cart',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'vending_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'abandoned_fridge',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'destroyed_kiosk',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    landmarks: [
      'lm_mapo',
      'lm_hangang_mapo',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'copper_coil',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'battery',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'electric_motor',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  seodaemun: {
    id: 'seodaemun',
    name: '서대문구',
    icon: '🏫',
    description: '연세대·세브란스병원. 의약품과 의료장비가 집중된 지역. 실험체가 배회하는 위험 구역.',
    dangerLevel: 4,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.25,
    noiseGen: 7,
    adjacentDistricts: [
      'eunpyeong',
      'seongbuk',
      'mapo',
    ],
    landmark: 'lm_seodaemun',
    lootTable: [
      {
        definitionId: 'bandage',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'glass_shard',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'antiseptic',
        weight: 20,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'painkiller',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'collapsed_shelf',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_washing_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_generator',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_ac_unit',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'severance',
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'alcohol_solution',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'herb_powder',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'virus_sample',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  seocho: {
    id: 'seocho',
    name: '서초구',
    icon: '⚖️',
    description: '법조타운·예술의전당. 약탈자 두목의 세력권. 무장 약탈자와 변이체가 공존한다.',
    dangerLevel: 4,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.25,
    noiseGen: 7,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'gangnam',
      'guro',
    ],
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'cloth',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'rope',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'empty_cartridge',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'traffic_light',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'telephone_booth',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'destroyed_kiosk',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_car',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    landmarks: [
      'lm_seocho',
      'lm_hangang_seocho',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'empty_cartridge',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'black_powder',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'detonator_cap',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  seongdong: {
    id: 'seongdong',
    name: '성동구',
    icon: '🏭',
    description: '성수 공장지대. 금속 재료와 제작 도구가 풍부하나 방사선 오염이 있다.',
    dangerLevel: 3,
    travelCostTP: 2,
    radiation: 5,
    encounterChance: 0.15,
    noiseGen: 4,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'dongdaemun',
      'jungrang',
      'gwangjin',
    ],
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 40,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'wire',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'nail',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'refined_metal',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'gravel_pile',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_washing_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'traffic_light',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_generator',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    landmarks: [
      'lm_seongdong',
      'lm_hangang_seongdong',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'refined_metal',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'alloy_ingot',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'steel_plate',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  seongbuk: {
    id: 'seongbuk',
    name: '성북구',
    icon: '🏛️',
    description: '고려대·성신여대 등 대학가. 학교 건물에 생필품이 남아있다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 3,
    adjacentDistricts: [
      'seodaemun',
      'gangbuk',
      'jongno',
    ],
    landmark: 'lm_seongbuk',
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'rope',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'canned_food',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'thread',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'broken_chair',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_radio',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'vending_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_shelf',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'herb_powder',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'saltpeter',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'grain_seed',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  songpa: {
    id: 'songpa',
    name: '송파구',
    icon: '🗼',
    description: '롯데월드타워 119층. 최후 생존자 거점이 함락된 후 변이체의 소굴이 되었다.',
    dangerLevel: 5,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.35,
    noiseGen: 8,
    hasFishing: true,
    fishingQuality: 3,
    adjacentDistricts: [
      'gangnam',
      'gangdong',
      'gwanak',
    ],
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'rope',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'glass_shard',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'battery',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'traffic_light',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_bicycle',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_car',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_scaffold',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_bus',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'lotte_tower',
    landmarks: [
      'lm_songpa',
      'lm_hangang_songpa',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'battery',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'alloy_ingot',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'power_cell',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  yangcheon: {
    id: 'yangcheon',
    name: '양천구',
    icon: '🏡',
    description: '목동 주거지역. 대규모 아파트 단지로 약탈이 많이 됐지만 구석에 생필품이 남아있다.',
    dangerLevel: 1,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.02,
    noiseGen: 3,
    adjacentDistricts: [
      'gangseo',
      'guro',
    ],
    landmark: 'lm_yangcheon',
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'water_bottle',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'nail',
        weight: 27,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'canned_food',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'broken_chair',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_radio',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'gravel_pile',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'broken_washing_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'duct_tape',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'brass_fragment',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'reinforced_fabric',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  yeongdeungpo: {
    id: 'yeongdeungpo',
    name: '영등포구',
    icon: '📡',
    description: '여의도·KBS방송국. 약탈자 두목의 본거지. 방송 장비와 군용 물자가 있으나 극히 위험.',
    dangerLevel: 4,
    travelCostTP: 3,
    radiation: 0,
    encounterChance: 0.25,
    noiseGen: 7,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'gangseo',
      'mapo',
    ],
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'electronic_parts',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'empty_cartridge',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'copper_coil',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'telephone_booth',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'abandoned_fridge',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_guard_post',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'subway_gate',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'kbs',
    landmarks: [
      'lm_yeongdeungpo',
      'lm_63_building',
      'lm_kbs',
      'lm_hangang_yeongdeungpo',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'copper_coil',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'circuit_module',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'generator_core',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  yongsan: {
    id: 'yongsan',
    name: '용산구',
    icon: '💻',
    description: '전자상가·이태원·미군기지. 전자부품과 금속 재료가 집중된 전략 거점.',
    dangerLevel: 3,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.15,
    noiseGen: 6,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'jongno',
      'junggoo',
    ],
    lootTable: [
      {
        definitionId: 'electronic_parts',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'wire',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'battery',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'microchip',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'broken_radio',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'telephone_booth',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'traffic_light',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'subway_gate',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'us_base',
    landmarks: [
      'lm_yongsan',
      'lm_hangang_yongsan',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'microchip',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'circuit_module',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'kevlar_fabric',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  eunpyeong: {
    id: 'eunpyeong',
    name: '은평구',
    icon: '🌲',
    description: '북한산 인접 외곽 지역. 비교적 안전하지만 물자가 부족하다. 신장동 쪽에 구청 창고가 있다.',
    dangerLevel: 1,
    travelCostTP: 3,
    radiation: 0,
    encounterChance: 0.02,
    noiseGen: 2,
    adjacentDistricts: [
      'seodaemun',
    ],
    landmark: 'lm_eunpyeong',
    lootTable: [
      {
        definitionId: 'herb',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'wood',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'tree_log',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'nettle',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'bait_worm',
        weight: 8,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'old_fire_extinguisher',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'weed_patch',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_mailbox',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'withered_tree',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'firestone',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'wild_garlic',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'herb_seed',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  jongno: {
    id: 'jongno',
    name: '종로구',
    icon: '🏯',
    description: '서울의 심장. 광화문 정부청사와 경복궁. 군의 최후 방어선이 붕괴된 극위험 구역. 좀비의 왕이 지배한다.',
    dangerLevel: 5,
    travelCostTP: 2,
    radiation: 10,
    encounterChance: 0.35,
    noiseGen: 8,
    adjacentDistricts: [
      'mapo',
      'seongbuk',
      'dongdaemun',
      'yongsan',
    ],
    landmark: 'lm_jongno',
    lootTable: [
      {
        definitionId: 'scrap_metal',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'nail',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'empty_cartridge',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'sulfur',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
      {
        definitionId: 'withered_tree',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'telephone_booth',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_guard_post',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_bus',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_car',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'gwanghwamun',
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'empty_cartridge',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'black_powder',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'steel_plate',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  junggoo: {
    id: 'junggoo',
    name: '중구',
    icon: '🏙️',
    description: '명동·남대문시장·서울시청. 지하철에서 올라온 좀비 무리가 도심을 완전히 점령했다.',
    dangerLevel: 5,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.35,
    noiseGen: 8,
    hasFishing: true,
    fishingQuality: 2,
    adjacentDistricts: [
      'yongsan',
      'dongdaemun',
    ],
    lootTable: [
      {
        definitionId: 'cloth',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'thread',
        weight: 18,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'empty_bottle',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'leather',
        weight: 15,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'vending_machine',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'destroyed_kiosk',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'subway_gate',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'collapsed_scaffold',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'old_ac_unit',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: 'seoul_city_hall',
    landmarks: [
      'lm_junggoo',
      'lm_hangang_junggoo',
    ],
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'large_cloth',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'lead_ingot',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'alloy_ingot',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
  jungrang: {
    id: 'jungrang',
    name: '중랑구',
    icon: '🌿',
    description: '중랑천 인근 주거지역. 중랑공원에서 자연 자원을 수집할 수 있다.',
    dangerLevel: 2,
    travelCostTP: 2,
    radiation: 0,
    encounterChance: 0.05,
    noiseGen: 3,
    adjacentDistricts: [
      'nowon',
      'gangbuk',
      'seongdong',
    ],
    landmark: 'lm_jungrang',
    lootTable: [
      {
        definitionId: 'herb',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'nettle',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'wood',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'wild_berry',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        definitionId: 'bait_worm',
        weight: 8,
        minQty: 1,
        maxQty: 3,
      },
      {
        definitionId: 'street_vendor_cart',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'gravel_pile',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'wrecked_bicycle',
        weight: 5,
        minQty: 1,
        maxQty: 1,
      },
      {
        definitionId: 'withered_tree',
        weight: 10,
        minQty: 1,
        maxQty: 1,
      },
    ],
    special: null,
    explorationYields: [
      {
        at: 30,
        items: [
          {
            definitionId: 'wild_garlic',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 60,
        items: [
          {
            definitionId: 'vegetable_seed',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
      {
        at: 100,
        items: [
          {
            definitionId: 'honey',
            minQty: 3,
            maxQty: 5,
          },
        ],
      },
    ],
  },
};

// ── 헬퍼 함수 ──────────────────────────────────────────────────

/** 인접 구 목록 반환 */
function getAdjacentDistricts(districtId) {
  const d = DISTRICTS[districtId];
  if (!d) return [];
  return (d.adjacentDistricts ?? []).map(id => DISTRICTS[id]).filter(Boolean);
}

/**
 * 구 단위 루팅 결과 생성.
 *
 * 자원 클래스(`entry.cls`, 기본 'surface')별로 다르게 다뤄진다:
 *  - surface    : 표면 자원. `opts.surfaceMult`(지역 자원 레벨 기반, 0~1) 확률로 채택
 *                 → 고갈 지역일수록 적게 나온다(연속 재생 모델).
 *  - expedition : 탐사 자원. surfaceMult 무관, 매 추첨 독립 채택(상시 반복).
 *  (특수/광물 자원은 lootTable이 아니라 구의 explorationYields[탐사도 임계값 고정 산출]로 다룬다 — Phase 3)
 *
 * 계절 한정(`entry.seasons`, 배열): 지정 시 해당 계절에만 추첨 대상이 된다(제철 자원 — 도토리=가을 등).
 * 미지정 = 사철. `opts.season` 미전달 시 계절 필터 비활성(하위호환).
 *
 * 반환: [{ definitionId, quantity, contamination, cls }] — cls는 호출자용 추가 필드(다운스트림 무시).
 * opts 미지정 시 surfaceMult=1·계절필터 off → 종전과 동일하게 전량 산출(하위호환).
 *
 * @param {string} districtId
 * @param {{surfaceMult?:number, season?:string}} [opts]
 */
function generateDistrictLoot(districtId, opts = {}) {
  const district = DISTRICTS[districtId];
  if (!district?.lootTable?.length) return [];

  const surfaceMult     = opts.surfaceMult ?? 1;
  const season          = opts.season ?? null;

  // 계절 한정 항목 필터.
  //  - seasons 미지정 = 사철(전부 등장). 에디터 기본 = 4계절 전부 켜짐.
  //  - seasons 배열 지정 = 그 계절에만. 빈 배열([]) = 전부 끔 → 절대 안 나옴.
  //  - season 미전달(opts 없음) = 필터 off(하위호환).
  const inSeason = (e) => {
    if (!e.seasons) return true;          // 미지정 = 사철
    if (!season) return true;             // 계절 정보 없음 = 필터 off
    return e.seasons.includes(season);    // [] 포함 — 빈 배열은 어떤 계절도 매칭 안 됨
  };
  const table = district.lootTable.filter(inSeason);
  if (!table.length) return [];

  const results = [];
  const totalWeight = table.reduce((s, e) => s + e.weight, 0);
  const count = BALANCE.explore.lootCountMin + Math.floor(Math.random() * (BALANCE.explore.lootCountMax - BALANCE.explore.lootCountMin + 1)); // 1~3개

  for (let i = 0; i < count; i++) {
    let rand = Math.random() * totalWeight;
    for (const entry of table) {
      rand -= entry.weight;
      if (rand > 0) continue;

      const cls = entry.cls ?? 'surface';
      // 표면 자원은 자원 레벨 배율 확률로 채택(고갈 시 누락). 탐사 자원은 항상 채택.
      if (cls === 'surface' && Math.random() >= surfaceMult) break;

      const qty = entry.minQty + Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1));
      const contaminated = Math.random() < (entry.contamChance ?? 0);
      results.push({
        definitionId:  entry.definitionId,
        quantity:      qty,
        contamination: contaminated ? 50 + Math.floor(Math.random() * 50) : 0,
        cls,
      });
      break;
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
