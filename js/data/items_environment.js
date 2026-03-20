// === ENVIRONMENT CARD DEFINITIONS ===
// 날씨 및 계절 이벤트를 보드 위 카드로 시각화
// type: 'environment', subtype: 'weather' | 'event'

const ITEMS_ENVIRONMENT = {

  // ════════════════════════════════════════════════════════
  // 날씨 카드 — WeatherSystem이 날씨 변경 시 자동 배치
  // ════════════════════════════════════════════════════════

  env_sunny: {
    id: 'env_sunny', name: '맑음', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☀️', description: '맑은 하늘. 활동하기 좋은 날씨다.',
    tags: ['environment', 'weather'],
    dismantle: [],
  },
  env_cloudy: {
    id: 'env_cloudy', name: '흐림', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌤', description: '구름이 하늘을 덮었다.',
    tags: ['environment', 'weather'],
    dismantle: [],
  },
  env_rainy: {
    id: 'env_rainy', name: '비', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌧️', description: '비가 내린다. 빈 용기에 빗물을 받을 수 있다.',
    tags: ['environment', 'weather', 'water_source'],
    dismantle: [],
  },
  env_foggy: {
    id: 'env_foggy', name: '안개', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌫', description: '짙은 안개가 시야를 가린다.',
    tags: ['environment', 'weather'],
    dismantle: [],
  },
  env_hot: {
    id: 'env_hot', name: '폭염', type: 'environment', subtype: 'weather',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌡️', description: '뜨거운 태양이 내리쬔다. 수분 소모에 주의.',
    tags: ['environment', 'weather', 'heat', 'danger'],
    dismantle: [],
  },
  env_storm: {
    id: 'env_storm', name: '폭풍', type: 'environment', subtype: 'weather',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌩️', description: '천둥번개가 치는 폭풍. 좀비 출현이 줄어든다.',
    tags: ['environment', 'weather', 'danger'],
    dismantle: [],
  },
  env_monsoon: {
    id: 'env_monsoon', name: '장마', type: 'environment', subtype: 'weather',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌊', description: '장마철 집중호우. 빗물 수집에 유리하지만 음식 오염 주의.',
    tags: ['environment', 'weather', 'water_source', 'danger'],
    dismantle: [],
  },
  env_clear: {
    id: 'env_clear', name: '맑고 추움', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '❄️', description: '맑지만 매서운 추위. 체온 관리 필수.',
    tags: ['environment', 'weather', 'cold'],
    dismantle: [],
  },
  env_snow: {
    id: 'env_snow', name: '눈', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌨️', description: '눈이 내린다. 녹이면 물로 쓸 수 있다.',
    tags: ['environment', 'weather', 'cold', 'water_source'],
    dismantle: [],
  },
  env_blizzard: {
    id: 'env_blizzard', name: '폭설', type: 'environment', subtype: 'weather',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⛄', description: '눈보라가 몰아친다. 모닥불 연료 소모 증가.',
    tags: ['environment', 'weather', 'cold', 'danger'],
    dismantle: [],
  },
  env_overcast: {
    id: 'env_overcast', name: '흐림', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☁️', description: '잿빛 하늘이 무겁게 드리웠다.',
    tags: ['environment', 'weather', 'cold'],
    dismantle: [],
  },
  env_windy: {
    id: 'env_windy', name: '바람', type: 'environment', subtype: 'weather',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍃', description: '강한 바람이 분다.',
    tags: ['environment', 'weather'],
    dismantle: [],
  },
  env_acid_rain: {
    id: 'env_acid_rain', name: '산성비', type: 'environment', subtype: 'weather',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☢️', description: '방사능 오염된 비. 음식과 물을 오염시킨다!',
    tags: ['environment', 'weather', 'danger', 'contamination'],
    dismantle: [],
  },

  // ════════════════════════════════════════════════════════
  // 계절 이벤트 카드 — SeasonSystem이 이벤트 발동 시 임시 배치
  // duration: 이벤트 지속 TP (이후 자동 제거)
  // ════════════════════════════════════════════════════════

  env_event_spring_rain: {
    id: 'env_event_spring_rain', name: '봄비', type: 'environment', subtype: 'event',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌧️', description: '봄비가 음식을 오염시킨다.',
    tags: ['environment', 'event', 'seasonal'],
    eventDuration: 72,
    dismantle: [],
  },
  env_event_pollen: {
    id: 'env_event_pollen', name: '꽃가루', type: 'environment', subtype: 'event',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '꽃가루가 날린다. 감염 위험 상승.',
    tags: ['environment', 'event', 'seasonal', 'infection'],
    eventDuration: 72,
    dismantle: [],
  },
  env_event_warmth: {
    id: 'env_event_warmth', name: '봄 온기', type: 'environment', subtype: 'event',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌸', description: '따스한 봄 기운이 사기를 북돋운다.',
    tags: ['environment', 'event', 'seasonal'],
    eventDuration: 72,
    dismantle: [],
  },
  env_event_drought: {
    id: 'env_event_drought', name: '가뭄', type: 'environment', subtype: 'event',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏜️', description: '가뭄이 계속된다. 물 확보가 어려워진다.',
    tags: ['environment', 'event', 'seasonal', 'danger'],
    eventDuration: 144,
    dismantle: [],
  },
  env_event_heatwave: {
    id: 'env_event_heatwave', name: '폭염 경보', type: 'environment', subtype: 'event',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔥', description: '극심한 폭염! 체온이 급격히 상승한다.',
    tags: ['environment', 'event', 'seasonal', 'heat', 'danger'],
    eventDuration: 144,
    dismantle: [],
  },
  env_event_monsoon_heavy: {
    id: 'env_event_monsoon_heavy', name: '집중호우', type: 'environment', subtype: 'event',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌊', description: '몬순 집중호우. 음식 오염과 감염 위험 증가.',
    tags: ['environment', 'event', 'seasonal', 'danger'],
    eventDuration: 72,
    dismantle: [],
  },
  env_event_typhoon: {
    id: 'env_event_typhoon', name: '태풍', type: 'environment', subtype: 'event',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌪️', description: '태풍이 구조물을 파괴한다!',
    tags: ['environment', 'event', 'seasonal', 'danger'],
    eventDuration: 72,
    dismantle: [],
  },
  env_event_zombie_migration: {
    id: 'env_event_zombie_migration', name: '좀비 이주', type: 'environment', subtype: 'event',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧟', description: '좀비 무리가 이동 중이다. 조우 확률 증가.',
    tags: ['environment', 'event', 'seasonal', 'danger'],
    eventDuration: 144,
    dismantle: [],
  },
  env_event_frost: {
    id: 'env_event_frost', name: '첫 서리', type: 'environment', subtype: 'event',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥶', description: '서리가 내렸다. 기온이 급락한다.',
    tags: ['environment', 'event', 'seasonal', 'cold'],
    eventDuration: 72,
    dismantle: [],
  },
  env_event_extreme_cold: {
    id: 'env_event_extreme_cold', name: '한파', type: 'environment', subtype: 'event',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧊', description: '극심한 한파! 체온 관리에 각별히 주의.',
    tags: ['environment', 'event', 'seasonal', 'cold', 'danger'],
    eventDuration: 144,
    dismantle: [],
  },
};

// 날씨 ID → 환경 카드 ID 매핑
const WEATHER_TO_ENV_CARD = {
  sunny:     'env_sunny',
  cloudy:    'env_cloudy',
  rainy:     'env_rainy',
  foggy:     'env_foggy',
  hot:       'env_hot',
  storm:     'env_storm',
  monsoon:   'env_monsoon',
  clear:     'env_clear',
  snow:      'env_snow',
  blizzard:  'env_blizzard',
  overcast:  'env_overcast',
  windy:     'env_windy',
  acid_rain: 'env_acid_rain',
};

// 계절 이벤트 ID → 환경 카드 ID 매핑
const SEASON_EVENT_TO_ENV_CARD = {
  spring_rain:        'env_event_spring_rain',
  pollen:             'env_event_pollen',
  spring_warmth:      'env_event_warmth',
  summer_drought:     'env_event_drought',
  heatwave:           'env_event_heatwave',
  monsoon_heavy:      'env_event_monsoon_heavy',
  typhoon:            'env_event_typhoon',
  zombie_migration:   'env_event_zombie_migration',
  first_frost:        'env_event_frost',
  extreme_cold:       'env_event_extreme_cold',
};

export default ITEMS_ENVIRONMENT;
export { WEATHER_TO_ENV_CARD, SEASON_EVENT_TO_ENV_CARD };
