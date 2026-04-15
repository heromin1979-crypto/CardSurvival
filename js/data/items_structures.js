// === ITEMS: STRUCTURES (구조물 아이템) ===
// type: 'structure' 아이템 전체
// 건설 구조물 + 환경 오브젝트(소/중/대/초대형) + 자연 + 식생 확장 + 크래프팅 체인 = 64항목

const ITEMS_STRUCTURES = {

  // ─── 건설 구조물 (12) ──────────────────────────────────────

  campfire: {
    id: 'campfire', name: '캠프파이어', type: 'structure', subtype: 'heat',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🔥', description: '돌을 쌓고 장작을 얹어 피운 화롯불. 온도 회복·요리·숯 생산에 사용. 비·눈에 꺼질 수 있음.',
    tags: ['structure', 'heat', 'light'],
    onTick: { temperature: 2, noise: 3 },
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'pebble', qty: 2, chance: 0.8 },
      { definitionId: 'kindling', qty: 1, chance: 0.5 },
      { definitionId: 'wood_bark', qty: 1, chance: 0.4 },
    ],
  },

  campfire_temp: {
    id: 'campfire_temp', name: '임시 화톳불', type: 'structure', subtype: 'heat',
    rarity: 'common', weight: 0.5,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🔥', description: '긴급 상황에서 급조한 화톳불. 3턴만 지속되며 비·눈에 바로 꺼진다. 요리 가능.',
    tags: ['structure', 'heat', 'temp'],
    onTick: { temperature: 1, noise: 2 },
    dismantleTP: 0,
    dismantle: [
      { definitionId: 'kindling', qty: 1, chance: 0.4 },
    ],
  },

  wind_stove: {
    id: 'wind_stove', name: '방풍 화로', type: 'structure', subtype: 'heat',
    rarity: 'uncommon', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '♨️', description: '고철과 돌로 만든 방풍 화로. 비·눈에도 꺼지지 않으며 연료 소모가 적다. 요리·숯 생산 가능.',
    tags: ['structure', 'heat', 'crafted', 'weather_resistant'],
    onTick: { temperature: 2, noise: 2 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'pebble', qty: 3, chance: 0.7 },
    ],
  },

  water_purifier: {
    id: 'water_purifier', name: '정수기', type: 'structure', subtype: 'utility',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🚰', description: '오염수를 정수. 인접 물병 자동 정화.',
    tags: ['structure', 'crafted'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'water_filter', qty: 1, chance: 0.5 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  barricade: {
    id: 'barricade', name: '바리케이드', type: 'structure', subtype: 'defense',
    rarity: 'common', weight: 4.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🚧', description: '입구를 막는 방어선. 적 조우 확률 감소.',
    tags: ['structure', 'defense', 'crafted'],
    onTick: { encounterReduction: 0.10 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 3, chance: 0.8 },
      { definitionId: 'nail', qty: 5, chance: 0.6 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
    ],
  },

  alarm_trap: {
    id: 'alarm_trap', name: '경보 트랩', type: 'structure', subtype: 'trap',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔔', description: '적 접근 시 경보 발생. 기습 방지.',
    tags: ['structure', 'trap', 'crafted'],
    onTrigger: { earlyWarning: true, noise: 20 },
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.8 },
      { definitionId: 'empty_can', qty: 1, chance: 0.9 },
    ],
  },

  spike_trap: {
    id: 'spike_trap', name: '가시 트랩', type: 'structure', subtype: 'trap',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '⚠️', description: '적 접근 시 자동 피해. 철파이프와 못으로 제작.',
    tags: ['structure', 'trap', 'crafted'],
    onTrigger: { damage: 20, bleed: true },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'iron_pipe', qty: 1, chance: 0.6 },
      { definitionId: 'nail', qty: 5, chance: 0.7 },
      { definitionId: 'wood', qty: 1, chance: 0.7 },
    ],
  },

  medical_station: {
    id: 'medical_station', name: '의무 거점', type: 'structure', subtype: 'medical',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⛺', description: 'TP당 HP를 자동 회복. 감염 저항 강화.',
    tags: ['structure', 'medical', 'crafted'],
    onTick: { hp: 3, infection: -1 },
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'bandage', qty: 3, chance: 0.7 },
      { definitionId: 'wood', qty: 2, chance: 0.7 },
    ],
  },

  workbench: {
    id: 'workbench', name: '작업대', type: 'structure', subtype: 'craft',
    rarity: 'uncommon', weight: 5.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪚', description: '복잡한 제작을 가능하게 한다. 일부 레시피 필수.',
    tags: ['structure', 'crafted'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 4, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  storage_box: {
    id: 'storage_box', name: '저장 상자', type: 'structure', subtype: 'storage',
    rarity: 'common', weight: 2.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '📦', description: '아이템을 안전하게 보관. 인벤토리 확장 효과.',
    tags: ['structure', 'storage', 'crafted'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'wood', qty: 3, chance: 0.8 },
      { definitionId: 'nail', qty: 5, chance: 0.6 },
    ],
  },

  garden: {
    id: 'garden', name: '텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 72, defaultContamination: 0,
    icon: '🌱', description: '식량을 자급자족. 내구도가 떨어지면 다시 심어야 한다.',
    tags: ['structure', 'crafted'],
    onTick: { nutrition: 0.4, noise: 1 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.8 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  rain_collector: {
    id: 'rain_collector', name: '빗물 수집기', type: 'structure', subtype: 'water',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 160, defaultContamination: 0,
    icon: '🪣', description: '빗물을 모아 수분을 보충한다. 겨울에는 눈을 녹여 소량 확보.',
    tags: ['structure', 'crafted'],
    onTick: { hydration: 0.3 },
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'empty_bottle', qty: 1, chance: 0.8 },
      { definitionId: 'cloth', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 소형 (6) ──────────────────

  broken_radio: {
    id: 'broken_radio', name: '고장난 라디오', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 1.0,
    defaultDurability: 40, defaultContamination: 0,
    icon: '📻', description: '전파가 터지지 않는 낡은 라디오. 부품으로 쓸모가 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.6 },
      { definitionId: 'plastic', qty: 1, chance: 0.5 },
    ],
  },

  rusted_toolbox: {
    id: 'rusted_toolbox', name: '녹슨 공구함', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 2.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🧰', description: '녹이 슬었지만 안에 쓸만한 부품이 남아있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'nail', qty: 3, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.4 },
    ],
  },

  broken_lamp: {
    id: 'broken_lamp', name: '부서진 가로등', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 3.0,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🪫', description: '기울어진 가로등. 금속과 전선을 회수할 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
      { definitionId: 'wire', qty: 1, chance: 0.7 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.6 },
    ],
  },

  old_mailbox: {
    id: 'old_mailbox', name: '낡은 우체통', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '📮', description: '빨간 우체통. 두꺼운 철판으로 만들어져 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.9 },
      { definitionId: 'nail', qty: 2, chance: 0.5 },
    ],
  },

  broken_chair: {
    id: 'broken_chair', name: '부서진 의자', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 2.0,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🪑', description: '다리가 부러진 의자. 목재와 천 조각을 얻을 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.8 },
      { definitionId: 'nail', qty: 2, chance: 0.6 },
      { definitionId: 'cloth_scrap', qty: 1, chance: 0.5 },
    ],
  },

  old_fire_extinguisher: {
    id: 'old_fire_extinguisher', name: '소화기', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 2.5,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🧯', description: '압력이 빠진 소화기. 금속 용기와 부품을 회수.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.9 },
      { definitionId: 'rubber', qty: 1, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.4 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 중형 (8) ──────────────────

  abandoned_fridge: {
    id: 'abandoned_fridge', name: '버려진 냉장고', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 8.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🧊', description: '전기가 끊긴 냉장고. 금속과 단열재가 풍부하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'wire', qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 1, chance: 0.6 },
      { definitionId: 'plastic', qty: 1, chance: 0.5 },
    ],
  },

  wrecked_bicycle: {
    id: 'wrecked_bicycle', name: '잔해 자전거', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 5.0,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🚲', description: '바퀴가 빠진 자전거. 체인과 기어에서 금속을 얻는다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'wire', qty: 1, chance: 0.7 },
      { definitionId: 'rubber', qty: 2, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.5 },
    ],
  },

  old_generator: {
    id: 'old_generator', name: '폐발전기', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 10.0,
    defaultDurability: 60, defaultContamination: 0,
    icon: '⚡', description: '연료가 바닥난 소형 발전기. 전자부품이 쓸만하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.4 },
    ],
  },

  collapsed_shelf: {
    id: 'collapsed_shelf', name: '무너진 선반', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 6.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🗄️', description: '상점에서 무너진 진열대. 목재와 못을 회수할 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 3, chance: 0.8 },
      { definitionId: 'nail', qty: 5, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
  },

  broken_washing_machine: {
    id: 'broken_washing_machine', name: '고장난 세탁기', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 10.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🫧', description: '드럼 세탁기 잔해. 스프링과 금속이 풍부하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'rubber', qty: 2, chance: 0.6 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
      { definitionId: 'spring', qty: 2, chance: 0.5 },
    ],
  },

  street_vendor_cart: {
    id: 'street_vendor_cart', name: '포장마차 잔해', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 7.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🏮', description: '포장마차의 잔해. 천막과 골조를 분해할 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'cloth', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.4 },
    ],
  },

  traffic_light: {
    id: 'traffic_light', name: '교통 신호등', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 8.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🚦', description: '쓰러진 신호등. 전자 부품과 금속 회수.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.5 },
    ],
  },

  vending_machine: {
    id: 'vending_machine', name: '자판기 잔해', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 12.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥫', description: '부서진 자판기. 두꺼운 철판과 전자부품이 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'electronic_parts', qty: 1, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.7 },
      { definitionId: 'plastic', qty: 2, chance: 0.5 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 대형 (5) ──────────────────

  wrecked_car: {
    id: 'wrecked_car', name: '폐차', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 20.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🚗', description: '도로에 버려진 차량. 금속과 부품이 대량으로 나온다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 5, chance: 0.8 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
      { definitionId: 'rubber', qty: 2, chance: 0.7 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.5 },
      { definitionId: 'leather', qty: 1, chance: 0.4 },
      { definitionId: 'spring', qty: 2, chance: 0.4 },
    ],
  },

  collapsed_scaffold: {
    id: 'collapsed_scaffold', name: '무너진 비계', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 25.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏗️', description: '공사 현장의 무너진 비계. 대량의 파이프와 철사.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 6, chance: 0.8 },
      { definitionId: 'wire', qty: 3, chance: 0.7 },
      { definitionId: 'rope', qty: 2, chance: 0.5 },
    ],
  },

  old_ac_unit: {
    id: 'old_ac_unit', name: '에어컨 실외기', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 15.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '❄️', description: '벽에 매달린 실외기. 구리선과 압축기 부품이 귀하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'electronic_parts', qty: 2, chance: 0.6 },
      { definitionId: 'wire', qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 1, chance: 0.5 },
    ],
  },

  subway_gate: {
    id: 'subway_gate', name: '지하철 개찰구', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 18.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🚇', description: '지하철역의 개찰구. 센서와 금속이 풍부.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 3, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.5 },
    ],
  },

  telephone_booth: {
    id: 'telephone_booth', name: '공중전화 부스', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 15.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '☎️', description: '유리와 금속 프레임의 공중전화.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
      { definitionId: 'electronic_parts', qty: 1, chance: 0.5 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 초대형 (3) ────────────────

  wrecked_bus: {
    id: 'wrecked_bus', name: '버스 잔해', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 30.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🚌', description: '전복된 시내버스. 해체에 오래 걸리지만 자원이 풍부.',
    tags: ['structure', 'salvage'],
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 8, chance: 0.8 },
      { definitionId: 'glass_shard', qty: 3, chance: 0.6 },
      { definitionId: 'rubber', qty: 3, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.5 },
      { definitionId: 'leather', qty: 2, chance: 0.4 },
      { definitionId: 'spring', qty: 2, chance: 0.4 },
    ],
  },

  destroyed_kiosk: {
    id: 'destroyed_kiosk', name: '파괴된 매점', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 20.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏪', description: '편의점 잔해. 진열대와 간판에서 재료를 얻는다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'wood', qty: 4, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.6 },
      { definitionId: 'plastic', qty: 2, chance: 0.5 },
      { definitionId: 'nail', qty: 5, chance: 0.5 },
    ],
  },

  collapsed_guard_post: {
    id: 'collapsed_guard_post', name: '무너진 초소', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 20.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛖', description: '군/경비 초소의 잔해. 목재와 철판이 풍부.',
    tags: ['structure', 'salvage'],
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'wood', qty: 5, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'nail', qty: 8, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.5 },
      { definitionId: 'wire', qty: 1, chance: 0.4 },
    ],
  },

  // ─── 도구 제작 전용 구조물 (6) ────────────────────────────

  field_forge: {
    id: 'field_forge', name: '야전 대장간', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 8.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '⚒️', description: '고철과 돌로 세운 간이 대장간. 금속 도구·도끼날·볼트 촉 등을 단조한다.',
    tags: ['structure', 'crafted', 'forge'],
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'pebble',      qty: 3, chance: 0.7 },
      { definitionId: 'wood_plank',  qty: 2, chance: 0.6 },
    ],
  },

  coal_furnace: {
    id: 'coal_furnace', name: '석탄 용광로', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 12.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🏭', description: '돌과 진흙으로 쌓은 고온 용광로. 고철 → 정제 금속, 납·황동·강철 제련 가능.',
    tags: ['structure', 'crafted', 'furnace'],
    requiredForBlueprints: true,
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'pebble',     qty: 6, chance: 0.8 },
      { definitionId: 'scrap_metal',qty: 3, chance: 0.7 },
    ],
  },

  chemistry_bench: {
    id: 'chemistry_bench', name: '화학 실험대', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 5.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '유리병·금속 받침대로 만든 화학 실험대. 흑색 화약·뇌관·독 추출물 합성 가능.',
    tags: ['structure', 'crafted', 'chemistry'],
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'glass_shard',    qty: 2, chance: 0.6 },
      { definitionId: 'scrap_metal',    qty: 2, chance: 0.7 },
      { definitionId: 'wood_plank',     qty: 2, chance: 0.7 },
    ],
  },

  ammo_bench: {
    id: 'ammo_bench', name: '탄약 제조대', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 6.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '탄피·화약·납을 조립해 탄약을 만드는 전문 제조대. 권총탄·산탄·소총탄 제작 가능.',
    tags: ['structure', 'crafted', 'ammo'],
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'refined_metal', qty: 2, chance: 0.7 },
      { definitionId: 'wood_plank',    qty: 2, chance: 0.7 },
      { definitionId: 'scrap_metal',   qty: 2, chance: 0.6 },
    ],
  },

  carpentry_bench: {
    id: 'carpentry_bench', name: '목공 작업대', type: 'structure', subtype: 'craft',
    rarity: 'uncommon', weight: 6.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪚', description: '나무를 정밀하게 가공하는 목공 작업대. 삽·낚싯대·볼트 샤프트·가구 제작 가능.',
    tags: ['structure', 'crafted', 'carpentry'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood',      qty: 4, chance: 0.8 },
      { definitionId: 'nail',      qty: 5, chance: 0.6 },
      { definitionId: 'scrap_metal',qty: 1, chance: 0.5 },
    ],
  },

  tanning_rack: {
    id: 'tanning_rack', name: '가죽 작업대', type: 'structure', subtype: 'craft',
    rarity: 'uncommon', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🟫', description: '사냥한 동물 가죽을 건조·가공하는 작업대. 건조 가죽·가죽 끈 생산 가능.',
    tags: ['structure', 'crafted', 'tanning'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood',  qty: 3, chance: 0.8 },
      { definitionId: 'rope',  qty: 1, chance: 0.6 },
      { definitionId: 'nail',  qty: 3, chance: 0.5 },
    ],
  },

  // ─── 자연 환경 오브젝트 (4) ───────────────────────────────

  withered_tree: {
    id: 'withered_tree', name: '말라비틀어진 나무', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 5.0,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🌵', description: '바짝 말라 죽은 나무. 부수면 마찰 점화에 쓰이는 마른 막대와 불쏘시개 재료를 얻는다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'dry_wood_stick', qty: 2, chance: 0.9 },
      { definitionId: 'dry_leaves',     qty: 1, chance: 0.7 },
      { definitionId: 'wood_bark',      qty: 1, chance: 0.6 },
      { definitionId: 'kindling',       qty: 1, chance: 0.5 },
    ],
  },

  weed_patch: {
    id: 'weed_patch', name: '잡초밭', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 0.5,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🌾', description: '황폐한 땅에서 자란 잡초. 마른 풀을 채집해 불쏘시개로 활용한다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'dry_grass', qty: 2, chance: 0.9 },
      { definitionId: 'herb',      qty: 1, chance: 0.4 },
      { definitionId: 'dry_leaves',qty: 1, chance: 0.5 },
    ],
  },

  gravel_pile: {
    id: 'gravel_pile', name: '자갈 더미', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 3.0,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🪨', description: '도로가 파헤쳐진 자갈 더미. 부싯돌을 찾을 수 있다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'firestone',  qty: 1, chance: 0.6 },
      { definitionId: 'pebble',     qty: 3, chance: 0.9 },
      { definitionId: 'scrap_metal',qty: 1, chance: 0.2 },
    ],
  },

  tree_env: {
    id: 'tree_env', name: '나무 (가로수)', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 10.0,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🌳', description: '도시에 남은 가로수. 통나무와 나무껍질을 얻는다. 도끼가 있으면 효율이 높아진다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'tree_log',  qty: 1, chance: 0.9 },
      { definitionId: 'wood_bark', qty: 1, chance: 0.7 },
      { definitionId: 'wood',      qty: 1, chance: 0.6 },
      { definitionId: 'dry_leaves',qty: 1, chance: 0.4 },
      { definitionId: 'acorn',     qty: 2, chance: 0.3 },
    ],
  },

  // ─── 식생 확장 — 가공·보존 구조물 (8) ────────────────────

  drying_rack: {
    id: 'drying_rack', name: '건조대', type: 'structure', subtype: 'food',
    rarity: 'uncommon', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🏗️', description: '나무 기둥과 줄로 만든 건조대. 고기·생선·버섯·베리를 소금에 절여 말린다. 장기 보존 식량 생산.',
    tags: ['structure', 'crafted', 'food'],
    requiredForBlueprints: true,
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'wood',  qty: 3, chance: 0.8 },
      { definitionId: 'rope',  qty: 2, chance: 0.7 },
      { definitionId: 'nail',  qty: 2, chance: 0.5 },
    ],
  },

  cooking_pot_stand: {
    id: 'cooking_pot_stand', name: '조리솥 거치대', type: 'structure', subtype: 'food',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍳', description: '캠프파이어 위에 냄비를 올리는 금속 거치대. clay_pot 또는 iron_pot을 올리면 스튜·수프 조리 가능.',
    tags: ['structure', 'crafted', 'food'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'wire',        qty: 1, chance: 0.6 },
      { definitionId: 'nail',        qty: 3, chance: 0.5 },
    ],
  },

  fermentation_pot: {
    id: 'fermentation_pot', name: '발효통', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '흙을 구워 만든 발효통. 채소·베리·곡물을 소금과 함께 담가 발효식품을 만든다. 숙성에 2~5일 소요.',
    tags: ['structure', 'crafted', 'food'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'pebble', qty: 3, chance: 0.6 },
      { definitionId: 'rope',   qty: 1, chance: 0.5 },
    ],
  },

  garden_bed_veggie: {
    id: 'garden_bed_veggie', name: '채소 텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥬', description: '채소 씨앗을 심은 텃밭. 매 턴 조금씩 성장해 5일 후 채소를 수확할 수 있다.',
    tags: ['structure', 'crafted', 'food', 'farm'],
    onTick: { nutrition: 0.25 },
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'wood_plank',    qty: 2, chance: 0.8 },
      { definitionId: 'soil_bag',      qty: 2, chance: 0.7 },
      { definitionId: 'vegetable_seed',qty: 1, chance: 0.4 },
    ],
  },

  garden_bed_herb: {
    id: 'garden_bed_herb', name: '약초 텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '약초 씨앗을 심은 텃밭. 꾸준히 약초를 공급해준다. 의료 자급자족의 첫걸음.',
    tags: ['structure', 'crafted', 'food', 'farm'],
    onTick: { herb: 0.15 },
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'wood_plank', qty: 2, chance: 0.8 },
      { definitionId: 'soil_bag',   qty: 2, chance: 0.7 },
      { definitionId: 'herb_seed',  qty: 1, chance: 0.4 },
    ],
  },

  garden_bed_grain: {
    id: 'garden_bed_grain', name: '곡물 텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🌾', description: '곡물 씨앗을 심은 대형 텃밭. 7일 후 대량의 곡물을 수확할 수 있다. 식량 안보의 핵심.',
    tags: ['structure', 'crafted', 'food', 'farm'],
    onTick: { nutrition: 0.2 },
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'wood_plank',qty: 3, chance: 0.8 },
      { definitionId: 'soil_bag',  qty: 3, chance: 0.7 },
      { definitionId: 'grain_seed',qty: 1, chance: 0.4 },
    ],
  },

  root_cellar: {
    id: 'root_cellar', name: '땅굴 저장고', type: 'structure', subtype: 'storage',
    rarity: 'rare', weight: 6.0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🏚️', description: '땅을 파서 만든 저장고. 낮은 온도를 유지해 식품 부패를 늦춘다. 보존 기간 2배 연장.',
    tags: ['structure', 'crafted', 'storage'],
    onTick: { food_decay: -0.5 },
    requiredForBlueprints: false,
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'wood_plank', qty: 4, chance: 0.7 },
      { definitionId: 'nail',       qty: 6, chance: 0.6 },
      { definitionId: 'rope',       qty: 1, chance: 0.5 },
    ],
  },

  bee_hive: {
    id: 'bee_hive', name: '벌통', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🐝', description: '나무 판자로 만든 벌통. 매 턴 소량의 꿀을 생산한다. 발효식품 촉진재이자 의료 재료.',
    tags: ['structure', 'crafted', 'food'],
    onTick: { honey: 0.05 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood_plank', qty: 3, chance: 0.7 },
      { definitionId: 'rope',       qty: 1, chance: 0.5 },
    ],
  },

  // ─── 낚시 구조물 (2) ──────────────────────────────────────

  fish_trap: {
    id: 'fish_trap', name: '통발', type: 'structure', subtype: 'fishing',
    rarity: 'uncommon', weight: 2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪤', stackable: false, isStructure: true,
    description: '강물에 설치하는 통발. 8턴마다 자동으로 물고기를 수확한다.',
    tags: ['structure', 'fishing', 'crafted'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'rope', qty: 1, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.6 },
    ],
  },

  water_trap: {
    id: 'water_trap', name: '물 함정', type: 'structure', subtype: '구조물',
    rarity: 'uncommon', weight: 1.0, stackable: false, maxStack: 1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🪤', description: '빗물을 자동 수집하는 간이 장치.',
    tags: ['structure'], dismantle: [{ definitionId: 'rope', qty: 1, chance: 0.5 }],
  },

  // ─── 크래프팅 체인 확장 — 구조물 (9) ──────────────────────

  pipe_assembly: {
    id: 'pipe_assembly', name: '배관 조립체', type: 'structure', subtype: 'building',
    rarity: 'uncommon', weight: 0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🔩', description: '파이프를 연결한 배관 구조물. 물 관련 시설의 기본.',
    tags: ['structure', 'building', 'crafted'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'iron_pipe', qty: 2, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.6 },
    ],
  },

  water_tower: {
    id: 'water_tower', name: '급수탑', type: 'structure', subtype: 'water',
    rarity: 'rare', weight: 0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🗼', description: '높은 곳에서 물을 저장·공급하는 탑.',
    tags: ['structure', 'building', 'crafted'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'iron_pipe', qty: 2, chance: 0.7 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
    ],
  },

  plumbing_system: {
    id: 'plumbing_system', name: '배관 시스템', type: 'structure', subtype: 'water',
    rarity: 'rare', weight: 0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🚰', description: '정수기와 배관을 연결한 급수 체계. 안전한 물 공급.',
    tags: ['structure', 'building', 'crafted'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'iron_pipe', qty: 3, chance: 0.7 },
      { definitionId: 'water_filter', qty: 1, chance: 0.5 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.6 },
    ],
  },

  reinforced_wall: {
    id: 'reinforced_wall', name: '강화 벽', type: 'structure', subtype: 'defense',
    rarity: 'rare', weight: 0,
    defaultDurability: 300, defaultContamination: 0,
    icon: '🧱', description: '콘크리트와 강철로 만든 방벽. 강력한 방어 구조물.',
    tags: ['structure', 'defense', 'crafted'],
    onTick: { encounterReduction: 0.20 },
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 5, chance: 0.8 },
      { definitionId: 'steel_plate', qty: 2, chance: 0.6 },
      { definitionId: 'nail', qty: 5, chance: 0.5 },
    ],
  },

  watchtower: {
    id: 'watchtower', name: '감시탑', type: 'structure', subtype: 'defense',
    rarity: 'legendary', weight: 0,
    defaultDurability: 250, defaultContamination: 0,
    icon: '🗼', description: '높은 전망을 제공하는 감시 구조물. 조기 경보에 탁월.',
    tags: ['structure', 'defense', 'crafted'],
    onTick: { encounterReduction: 0.25, earlyWarning: true },
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'wood_plank', qty: 4, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'nail', qty: 8, chance: 0.6 },
      { definitionId: 'rope', qty: 2, chance: 0.5 },
    ],
  },

  brick_furnace: {
    id: 'brick_furnace', name: '벽돌 화로', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🔥', description: '벽돌로 쌓은 고온 화로. 합금 제련에 필수.',
    tags: ['structure', 'crafted', 'furnace'],
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'pebble', qty: 6, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
    ],
  },

  rain_collector_improved: {
    id: 'rain_collector_improved', name: '개량 빗물 수집기', type: 'structure', subtype: 'water',
    rarity: 'uncommon', weight: 0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🌧️', description: '더 효율적으로 빗물을 모으는 개량형 수집기.',
    tags: ['structure', 'crafted'],
    onTick: { hydration: 0.5 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'empty_bottle', qty: 2, chance: 0.8 },
      { definitionId: 'cloth', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
  },

  water_recycler: {
    id: 'water_recycler', name: '물 재활용기', type: 'structure', subtype: 'water',
    rarity: 'legendary', weight: 0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '♻️', description: '사용한 물을 정화하여 재사용하는 첨단 장치.',
    tags: ['structure', 'crafted'],
    onTick: { hydration: 0.8 },
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 3, chance: 0.7 },
      { definitionId: 'water_filter', qty: 1, chance: 0.5 },
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
    ],
  },

  field_surgery_station: {
    id: 'field_surgery_station', name: '야전 수술대', type: 'structure', subtype: 'medical',
    rarity: 'rare', weight: 0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🏥', description: '마취제와 수술 도구가 갖춰진 이동식 수술 시설.',
    tags: ['structure', 'medical', 'crafted'],
    onTick: { hp: 5, infection: -2 },
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'cloth', qty: 2, chance: 0.6 },
      { definitionId: 'antiseptic', qty: 1, chance: 0.5 },
    ],
  },
};

export default ITEMS_STRUCTURES;
