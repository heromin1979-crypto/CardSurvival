// === DISTRICTS — 서울 25개 구(區) 지역 시스템 ===
// adjacentDistricts: 그리드 직교(상하좌우) 인접 구만 연결. 대각선 없음.
// 한강 장벽: 강북↔강남 직접 이동 불가. 다리 2개만 크로스-리버 연결:
//   서쪽 다리: mapo(강북, row2) ↔ yeongdeungpo(강남, row4)
//   동쪽 다리: gwangjin(강북, row2) ↔ gangdong(강남, row4)
//
// 강북 위험도: 은평·도봉·노원만 1등급. 나머지 강북은 2~4등급.
// 조우 확률: 전역 10%p 하향.
// SUB_LOCATIONS 개념 폐지 — 구 단위 1계층 구조

const DISTRICTS = {

  // ── 강남구 ──────────────────────────────────────────────────────
  gangnam: {
    id: 'gangnam', name: '강남구', icon: '🏥',
    description: '의료 인프라가 집중된 지역. 삼성서울병원이 최대 물자 보고지만 좀비 밀도가 극히 높다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.15, noiseGen: 7,
    adjacentDistricts: ['seocho', 'songpa', 'dongjak'],
    landmark: 'lm_gangnam',
    lootTable: [
      { definitionId: 'first_aid_kit', weight: 30, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 30, minQty: 2, maxQty: 5 },
      { definitionId: 'water_filter',  weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'pistol',        weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'canned_food',   weight: 5,  minQty: 1, maxQty: 2 },
    ],
    special: 'samsung_hospital',
  },

  // ── 강동구 ──────────────────────────────────────────────────────
  gangdong: {
    id: 'gangdong', name: '강동구', icon: '🏘️',
    description: '외곽 주거지역. 약탈이 덜 된 아파트 단지에서 식량과 생필품을 찾을 수 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.15, noiseGen: 5,
    adjacentDistricts: ['songpa', 'geumcheon', 'gwangjin'],   // gwangjin = 동쪽 다리
    landmark: 'lm_gangdong',
    lootTable: [
      { definitionId: 'canned_food',   weight: 30, minQty: 1, maxQty: 3, contamChance: 0.05 },
      { definitionId: 'water_bottle',  weight: 25, minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'bandage',       weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 10, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 강북구 ──────────────────────────────────────────────────────
  gangbuk: {
    id: 'gangbuk', name: '강북구', icon: '⛰️',
    description: '북한산 아래 주거지역. 산악 접근로 덕분에 비교적 안전하고 자연 자원이 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.0, noiseGen: 2,
    adjacentDistricts: ['dobong', 'seongbuk', 'jungrang', 'dongdaemun'],
    landmark: 'lm_gangbuk',
    lootTable: [
      { definitionId: 'contaminated_water', weight: 25, minQty: 1, maxQty: 2, contamChance: 0.35 },
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'canned_food',   weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 10, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 강서구 ──────────────────────────────────────────────────────
  gangseo: {
    id: 'gangseo', name: '강서구', icon: '✈️',
    description: '김포공항 인근 공항 복합 지역. 항공 물류 창고에서 공구와 장비 부품을 찾을 수 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.2, noiseGen: 6,
    adjacentDistricts: ['yeongdeungpo', 'yangcheon'],
    landmark: 'lm_gangseo',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 25, minQty: 2, maxQty: 4 },
      { definitionId: 'rope',          weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'duct_tape',     weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'flashlight',    weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'canned_food',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'pistol_ammo',   weight: 10, minQty: 2, maxQty: 5 },
    ],
    special: null,
  },

  // ── 관악구 ──────────────────────────────────────────────────────
  gwanak: {
    id: 'gwanak', name: '관악구', icon: '🎓',
    description: '서울대학교 캠퍼스. 연구소에 의약품 원료와 정수 장비가 남아있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 3,
    adjacentDistricts: ['dongjak', 'geumcheon', 'songpa'],
    landmark: 'lm_gwanak',
    lootTable: [
      { definitionId: 'water_filter',  weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 25, minQty: 2, maxQty: 4 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'duct_tape',     weight: 15, minQty: 1, maxQty: 2 },
    ],
    special: 'snu_lab',
  },

  // ── 광진구 ──────────────────────────────────────────────────────
  gwangjin: {
    id: 'gwangjin', name: '광진구', icon: '🌉',
    description: '한강 인접 주거지역. 뚝섬과 어린이대공원 주변에 생활용품과 식량이 남아있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 4,
    adjacentDistricts: ['seongdong', 'gangdong'],   // gangdong = 동쪽 다리
    landmark: 'lm_gwangjin',
    lootTable: [
      { definitionId: 'canned_food',   weight: 30, minQty: 1, maxQty: 3, contamChance: 0.05 },
      { definitionId: 'water_bottle',  weight: 25, minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 10, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 구로구 ──────────────────────────────────────────────────────
  guro: {
    id: 'guro', name: '구로구', icon: '🏭',
    description: '구로디지털단지. 공장과 창고에 공구, 전자부품, 금속 재료가 풍부하다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.2, noiseGen: 6,
    adjacentDistricts: ['yangcheon', 'dongjak', 'seocho'],
    landmark: 'lm_guro',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 35, minQty: 2, maxQty: 5 },
      { definitionId: 'duct_tape',     weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'flashlight',    weight: 15, minQty: 1, maxQty: 1 },
      { definitionId: 'crowbar',       weight: 10, minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 금천구 ──────────────────────────────────────────────────────
  geumcheon: {
    id: 'geumcheon', name: '금천구', icon: '⚙️',
    description: '중소 공장 밀집 지역. 방사선 오염이 약간 있지만 금속 재료와 공구가 넘친다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 5,
    encounterChance: 0.2, noiseGen: 5,
    adjacentDistricts: ['gwanak', 'gangdong'],
    landmark: 'lm_geumcheon',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 40, minQty: 2, maxQty: 6 },
      { definitionId: 'rope',          weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'duct_tape',     weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'pipe_wrench',   weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'crowbar',       weight: 10, minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 노원구 ──────────────────────────────────────────────────────
  nowon: {
    id: 'nowon', name: '노원구', icon: '🏙️',
    description: '대규모 아파트 단지. 약탈됐지만 숨겨진 창고에서 식량과 생필품을 찾을 수 있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.0, noiseGen: 3,
    adjacentDistricts: ['dobong', 'jungrang'],
    landmark: 'lm_nowon',
    lootTable: [
      { definitionId: 'canned_food',   weight: 30, minQty: 1, maxQty: 3, contamChance: 0.05 },
      { definitionId: 'water_bottle',  weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'bandage',       weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'energy_bar',    weight: 10, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 도봉구 ──────────────────────────────────────────────────────
  dobong: {
    id: 'dobong', name: '도봉구', icon: '🌲',
    description: '도봉산 아래 조용한 외곽지역. 감염자가 적고 자연 자원을 수집할 수 있다.',
    dangerLevel: 1, travelCostTP: 3, radiation: 0,
    encounterChance: 0.0, noiseGen: 2,
    adjacentDistricts: ['nowon', 'gangbuk'],
    landmark: 'lm_dobong',
    lootTable: [
      { definitionId: 'contaminated_water', weight: 30, minQty: 1, maxQty: 2, contamChance: 0.30 },
      { definitionId: 'rope',          weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'water_bottle',  weight: 10, minQty: 1, maxQty: 1, contamChance: 0.10 },
      { definitionId: 'canned_food',   weight: 10, minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 동대문구 ──────────────────────────────────────────────────────
  dongdaemun: {
    id: 'dongdaemun', name: '동대문구', icon: '🧵',
    description: '동대문 의류시장이 있던 섬유 중심지. 천과 의류 재료가 풍부하고 식료품도 남아있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.1, noiseGen: 5,
    adjacentDistricts: ['jongno', 'gangbuk', 'seongdong', 'junggoo'],
    landmark: 'lm_dongdaemun',
    lootTable: [
      { definitionId: 'cloth',         weight: 35, minQty: 2, maxQty: 5 },
      { definitionId: 'canned_food',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'duct_tape',     weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'knife',         weight: 15, minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 동작구 ──────────────────────────────────────────────────────
  dongjak: {
    id: 'dongjak', name: '동작구', icon: '🌊',
    description: '한강 남안 주거지역. 국립현충원이 있어 약탈이 적었고 생필품이 남아있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 3,
    adjacentDistricts: ['guro', 'gwanak', 'gangnam'],
    landmark: 'lm_dongjak',
    lootTable: [
      { definitionId: 'bandage',       weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 마포구 ──────────────────────────────────────────────────────
  mapo: {
    id: 'mapo', name: '마포구', icon: '🏙️',
    description: '홍대·합정·여의나루. 한때 젊음의 거리였던 홍대와 발전소 인근 합정이 혼재한다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 3,
    encounterChance: 0.1, noiseGen: 4,
    adjacentDistricts: ['seodaemun', 'jongno', 'yeongdeungpo'],   // yeongdeungpo = 서쪽 다리
    landmark: 'lm_mapo',
    lootTable: [
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 3, contamChance: 0.08 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'water_bottle',  weight: 10, minQty: 1, maxQty: 2, contamChance: 0.15 },
    ],
    special: null,
  },

  // ── 서대문구 ──────────────────────────────────────────────────────
  seodaemun: {
    id: 'seodaemun', name: '서대문구', icon: '🏫',
    description: '연세대·세브란스병원. 의약품과 의료장비가 집중된 지역. 감염자 밀도 높음.',
    dangerLevel: 3, travelCostTP: 2, radiation: 0,
    encounterChance: 0.2, noiseGen: 5,
    adjacentDistricts: ['eunpyeong', 'seongbuk', 'mapo'],
    landmark: 'lm_seodaemun',
    lootTable: [
      { definitionId: 'first_aid_kit', weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 30, minQty: 2, maxQty: 5 },
      { definitionId: 'water_filter',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'water_bottle',  weight: 15, minQty: 1, maxQty: 2, contamChance: 0.10 },
      { definitionId: 'cloth',         weight: 10, minQty: 1, maxQty: 3 },
    ],
    special: 'severance',
  },

  // ── 서초구 ──────────────────────────────────────────────────────
  seocho: {
    id: 'seocho', name: '서초구', icon: '⚖️',
    description: '법조타운·예술의전당. 고급 주거지였으나 현재는 감염자와 약탈자가 공존한다.',
    dangerLevel: 3, travelCostTP: 2, radiation: 0,
    encounterChance: 0.3, noiseGen: 6,
    adjacentDistricts: ['gangnam', 'guro'],
    landmark: 'lm_seocho',
    lootTable: [
      { definitionId: 'first_aid_kit', weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'bandage',       weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'knife',         weight: 15, minQty: 1, maxQty: 1 },
    ],
    special: null,
  },

  // ── 성동구 ──────────────────────────────────────────────────────
  seongdong: {
    id: 'seongdong', name: '성동구', icon: '🏭',
    description: '성수 공장지대. 금속 재료와 제작 도구가 풍부하나 방사선 오염이 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 5,
    encounterChance: 0.1, noiseGen: 4,
    adjacentDistricts: ['dongdaemun', 'jungrang', 'gwangjin'],
    landmark: 'lm_seongdong',
    lootTable: [
      { definitionId: 'scrap_metal',   weight: 40, minQty: 2, maxQty: 6 },
      { definitionId: 'rope',          weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'pipe_wrench',   weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'duct_tape',     weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'crowbar',       weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'cloth',         weight: 5,  minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 성북구 ──────────────────────────────────────────────────────
  seongbuk: {
    id: 'seongbuk', name: '성북구', icon: '🏛️',
    description: '고려대·성신여대 등 대학가. 학교 식당과 기숙사에 식량이 남아있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.05, noiseGen: 3,
    adjacentDistricts: ['seodaemun', 'gangbuk', 'jongno'],
    landmark: 'lm_seongbuk',
    lootTable: [
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 송파구 ──────────────────────────────────────────────────────
  songpa: {
    id: 'songpa', name: '송파구', icon: '🗼',
    description: '롯데타워·올림픽경기장. 최후 생존자 거점이 있었던 곳. 물자는 풍부하나 위험하다.',
    dangerLevel: 3, travelCostTP: 2, radiation: 0,
    encounterChance: 0.3, noiseGen: 7,
    adjacentDistricts: ['gangnam', 'gangdong', 'gwanak'],
    landmark: 'lm_songpa',
    lootTable: [
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 4, contamChance: 0.08 },
      { definitionId: 'energy_bar',    weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'scrap_metal',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'flashlight',    weight: 10, minQty: 1, maxQty: 1 },
    ],
    special: 'lotte_tower',
  },

  // ── 양천구 ──────────────────────────────────────────────────────
  yangcheon: {
    id: 'yangcheon', name: '양천구', icon: '🏡',
    description: '목동 주거지역. 대규모 아파트 단지로 약탈이 많이 됐지만 구석에 식량이 남아있다.',
    dangerLevel: 1, travelCostTP: 2, radiation: 0,
    encounterChance: 0.0, noiseGen: 3,
    adjacentDistricts: ['gangseo', 'guro'],
    landmark: 'lm_yangcheon',
    lootTable: [
      { definitionId: 'canned_food',   weight: 30, minQty: 1, maxQty: 3, contamChance: 0.05 },
      { definitionId: 'water_bottle',  weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'bandage',       weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'energy_bar',    weight: 10, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 영등포구 ──────────────────────────────────────────────────────
  yeongdeungpo: {
    id: 'yeongdeungpo', name: '영등포구', icon: '📡',
    description: '여의도·KBS방송국. 한강 섬. 방송 장비와 전자부품, 군용 물자가 있다.',
    dangerLevel: 3, travelCostTP: 3, radiation: 0,
    encounterChance: 0.35, noiseGen: 7,
    adjacentDistricts: ['gangseo', 'mapo'],   // mapo = 서쪽 다리
    landmark: 'lm_yeongdeungpo',
    lootTable: [
      { definitionId: 'flashlight',    weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'pistol_ammo',   weight: 20, minQty: 3, maxQty: 8 },
      { definitionId: 'bandage',       weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'duct_tape',     weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'first_aid_kit', weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'shotgun_ammo',  weight: 3,  minQty: 2, maxQty: 4 },
    ],
    special: 'kbs',
  },

  // ── 용산구 ──────────────────────────────────────────────────────
  yongsan: {
    id: 'yongsan', name: '용산구', icon: '💻',
    description: '전자상가·이태원·미군기지. 무기, 전자부품, 군용 장비가 집중된 전략 거점.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.10, noiseGen: 6,
    adjacentDistricts: ['jongno', 'junggoo'],
    landmark: 'lm_yongsan',
    lootTable: [
      { definitionId: 'flashlight',    weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'duct_tape',     weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'pistol_ammo',   weight: 15, minQty: 2, maxQty: 6 },
      { definitionId: 'pistol',        weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'water_filter',  weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'knife',         weight: 15, minQty: 1, maxQty: 1 },
      { definitionId: 'shotgun_ammo',  weight: 3,  minQty: 2, maxQty: 4 },
    ],
    special: 'us_base',
  },

  // ── 은평구 ──────────────────────────────────────────────────────
  eunpyeong: {
    id: 'eunpyeong', name: '은평구', icon: '🌲',
    description: '북한산 인접 외곽 지역. 비교적 안전하지만 물자가 부족하다. 신장동 쪽에 구청 창고가 있다.',
    dangerLevel: 1, travelCostTP: 3, radiation: 0,
    encounterChance: 0.0, noiseGen: 2,
    adjacentDistricts: ['seodaemun'],
    landmark: 'lm_eunpyeong',
    lootTable: [
      { definitionId: 'bandage',       weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'flashlight',    weight: 15, minQty: 1, maxQty: 1 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
    ],
    special: null,
  },

  // ── 종로구 ──────────────────────────────────────────────────────
  jongno: {
    id: 'jongno', name: '종로구', icon: '🏯',
    description: '서울의 심장. 광화문 정부청사와 경복궁. 군의 최후 방어선이 붕괴된 극위험 구역.',
    dangerLevel: 4, travelCostTP: 2, radiation: 10,
    encounterChance: 0.4, noiseGen: 8,
    adjacentDistricts: ['mapo', 'seongbuk', 'dongdaemun', 'yongsan'],
    landmark: 'lm_jongno',
    lootTable: [
      { definitionId: 'pistol',        weight: 15, minQty: 1, maxQty: 1 },
      { definitionId: 'pistol_ammo',   weight: 20, minQty: 4, maxQty: 10 },
      { definitionId: 'first_aid_kit', weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 20, minQty: 2, maxQty: 5 },
      { definitionId: 'scrap_metal',   weight: 15, minQty: 2, maxQty: 4 },
      { definitionId: 'energy_bar',    weight: 10, minQty: 1, maxQty: 2 },
    ],
    special: 'gwanghwamun',
  },

  // ── 중구 ──────────────────────────────────────────────────────
  junggoo: {
    id: 'junggoo', name: '중구', icon: '🏙️',
    description: '명동·남대문시장·서울시청. 과거 상업 중심지. 좀비 밀도 높지만 다양한 물자가 있다.',
    dangerLevel: 3, travelCostTP: 2, radiation: 0,
    encounterChance: 0.25, noiseGen: 6,
    adjacentDistricts: ['yongsan', 'dongdaemun'],
    landmark: 'lm_junggoo',
    lootTable: [
      { definitionId: 'cloth',         weight: 25, minQty: 2, maxQty: 5 },
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'bandage',       weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'water_bottle',  weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'knife',         weight: 15, minQty: 1, maxQty: 1 },
    ],
    special: 'seoul_city_hall',
  },

  // ── 중랑구 ──────────────────────────────────────────────────────
  jungrang: {
    id: 'jungrang', name: '중랑구', icon: '🌿',
    description: '중랑천 인근 주거지역. 중랑공원에서 자연 자원을 수집할 수 있다.',
    dangerLevel: 2, travelCostTP: 2, radiation: 0,
    encounterChance: 0.03, noiseGen: 3,
    adjacentDistricts: ['nowon', 'gangbuk', 'seongdong'],
    landmark: 'lm_jungrang',
    lootTable: [
      { definitionId: 'contaminated_water', weight: 25, minQty: 1, maxQty: 2, contamChance: 0.25 },
      { definitionId: 'canned_food',   weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth',         weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'rope',          weight: 15, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 15, minQty: 1, maxQty: 2 },
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
  const count = 2 + Math.floor(Math.random() * 4); // 2~5개

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
