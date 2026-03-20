// === ITEMS: BASE (기초재료·가공재료·수분·식량) ===
// 기초 재료 15 + 가공 재료 8 + 수분 8 + 식량 10 = 41 items

const ITEMS_BASE = {

  // ─── 기초 재료 (15) ───────────────────────────────────────

  scrap_metal: {
    id: 'scrap_metal', name: '고철', type: 'material', subtype: 'metal',
    rarity: 'common', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚙️', description: '재활용 가능한 금속 파편.',
    tags: ['material', 'metal'],
    dismantle: [],
  },

  cloth: {
    id: 'cloth', name: '천', type: 'material', subtype: 'textile',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧶', description: '붕대 제작, 천막 수리에 사용.',
    tags: ['material', 'textile'],
    dismantle: [{ definitionId: 'cloth_scrap', qty: 2, chance: 1.0 }],
  },

  rope: {
    id: 'rope', name: '로프', type: 'material', subtype: 'textile',
    rarity: 'common', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪢', description: '각종 제작에 쓰이는 다용도 로프.',
    tags: ['material'],
    dismantle: [{ definitionId: 'thread', qty: 3, chance: 0.8 }],
  },

  duct_tape: {
    id: 'duct_tape', name: '덕테이프', type: 'material', subtype: 'misc',
    rarity: 'uncommon', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏷️', description: '무엇이든 고정. 강화 제작에 필수.',
    tags: ['material'],
    dismantle: [],
  },

  wood: {
    id: 'wood', name: '목재', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪵', description: '건축·제작용 목재. 캠프파이어 연료로도 활용.',
    tags: ['material', 'wood'],
    dismantle: [],
  },

  nail: {
    id: 'nail', name: '못', type: 'material', subtype: 'metal',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📌', description: '무기 개조, 바리케이드 제작에 필요.',
    tags: ['material', 'metal'],
    dismantle: [],
  },

  wire: {
    id: 'wire', name: '철사', type: 'material', subtype: 'metal',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔌', description: '전기·함정 제작에 활용되는 금속 선.',
    tags: ['material', 'metal'],
    dismantle: [],
  },

  plastic: {
    id: 'plastic', name: '플라스틱', type: 'material', subtype: 'misc',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '각종 용기 및 부품 제작에 사용.',
    tags: ['material'],
    dismantle: [],
  },

  glass_shard: {
    id: 'glass_shard', name: '유리파편', type: 'material', subtype: 'misc',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💎', description: '날카롭고 위험. 함정 제작에 사용.',
    tags: ['material'],
    dismantle: [],
  },

  rubber: {
    id: 'rubber', name: '고무', type: 'material', subtype: 'misc',
    rarity: 'common', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⭕', description: '방수 용품 제작에 필수.',
    tags: ['material'],
    dismantle: [],
  },

  leather: {
    id: 'leather', name: '가죽', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🟫', description: '방어구·방패 제작에 사용되는 두꺼운 가죽.',
    tags: ['material'],
    dismantle: [],
  },

  empty_bottle: {
    id: 'empty_bottle', name: '빈병', type: 'material', subtype: 'container',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍾', description: '물을 담거나 화염병 제작에 활용.',
    tags: ['material', 'container'],
    dismantle: [],
  },

  empty_can: {
    id: 'empty_can', name: '빈캔', type: 'material', subtype: 'container',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥫', description: '못폭탄·경보트랩 제작에 사용.',
    tags: ['material', 'container'],
    dismantle: [],
  },

  electronic_parts: {
    id: 'electronic_parts', name: '전자부품', type: 'material', subtype: 'tech',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💡', description: '트랩·무전기 제작에 필요한 전자 부품.',
    tags: ['material', 'tech'],
    dismantle: [{ definitionId: 'wire', qty: 1, chance: 0.7 }],
  },

  spring: {
    id: 'spring', name: '스프링', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌀', description: '석궁·함정 제작에 필요한 금속 스프링.',
    tags: ['material', 'metal'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 1, chance: 0.8 }],
  },

  tree_log: {
    id: 'tree_log', name: '통나무', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌳', description: '두꺼운 통나무. 도끼로 쪼개면 목재를, 태우면 대량의 숯을 얻는다.',
    tags: ['material', 'wood', 'heavy'],
    dismantle: [{ definitionId: 'wood', qty: 2, chance: 1.0 }],
  },

  herb: {
    id: 'herb', name: '약초', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '산에서 채취한 약초. 끓이면 허브차, 가공하면 의약 원료가 된다.',
    tags: ['material', 'natural', 'medical'],
    dismantle: [],
  },

  // ─── 가공 재료 (8) ────────────────────────────────────────

  sharp_blade: {
    id: 'sharp_blade', name: '날카로운 날', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗡️', description: '고철을 갈아 만든 날. 무기 제작의 핵심 재료.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 1, chance: 0.9 }],
  },

  charcoal: {
    id: 'charcoal', name: '숯', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🖤', description: '목재를 태워 만든 숯. 정수 필터 제작에 필수.',
    tags: ['material', 'crafted'],
    dismantle: [],
  },

  charcoal_filter: {
    id: 'charcoal_filter', name: '숯 필터', type: 'material', subtype: 'crafted',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '오염수 정수용 필터. 정수된물 제작에 필요.',
    tags: ['material', 'crafted'],
    dismantle: [
      { definitionId: 'charcoal', qty: 1, chance: 0.8 },
      { definitionId: 'cloth_scrap', qty: 1, chance: 0.6 },
    ],
  },

  cloth_scrap: {
    id: 'cloth_scrap', name: '천 조각', type: 'material', subtype: 'textile',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧵', description: '천을 잘라 만든 조각. 거즈·붕대 재료.',
    tags: ['material', 'textile', 'crafted'],
    dismantle: [],
  },

  gauze: {
    id: 'gauze', name: '거즈', type: 'material', subtype: 'medical',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🩻', description: '상처 처치에 사용하는 의료용 거즈.',
    tags: ['material', 'medical', 'crafted'],
    dismantle: [],
  },

  alcohol_solution: {
    id: 'alcohol_solution', name: '알코올 용액', type: 'material', subtype: 'chemical',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧴', description: '소독·화염병 제작에 사용되는 고순도 알코올.',
    tags: ['material', 'chemical', 'crafted'],
    dismantle: [],
  },

  gunpowder: {
    id: 'gunpowder', name: '화약', type: 'material', subtype: 'chemical',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💥', description: '폭발물 제작에 필수. 취급 주의.',
    tags: ['material', 'chemical', 'explosive'],
    dismantle: [],
  },

  thread: {
    id: 'thread', name: '실', type: 'material', subtype: 'textile',
    rarity: 'common', weight: 0.02,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪡', description: '의복·그물 제작에 사용하는 가는 실.',
    tags: ['material', 'textile'],
    dismantle: [],
  },

  // ─── 수분 (8) ─────────────────────────────────────────────

  water_bottle: {
    id: 'water_bottle', name: '정수 물병', type: 'consumable', subtype: 'drink',
    rarity: 'common', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💧', description: '깨끗한 물. 수분을 크게 보충한다.',
    onConsume: { hydration: 80 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable', 'clean'],
    dismantle: [],
  },

  contaminated_water: {
    id: 'contaminated_water', name: '오염수', type: 'consumable', subtype: 'drink',
    rarity: 'common', weight: 0.5,
    defaultDurability: 100, defaultContamination: 85,
    icon: '☣️', description: '오염된 물. 마시면 방사선과 감염 위험.',
    onConsume: { hydration: 60, contamination: 'inherit', radiation: 10, infection: 15 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable', 'contaminated'],
    dismantle: [],
  },

  rainwater: {
    id: 'rainwater', name: '빗물', type: 'consumable', subtype: 'drink',
    rarity: 'common', weight: 0.5,
    defaultDurability: 100, defaultContamination: 30,
    icon: '🌧️', description: '수집한 빗물. 정화하면 음용 가능.',
    onConsume: { hydration: 40, contamination: 20, radiation: 5 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable', 'contaminated'],
    dismantle: [],
  },

  boiled_water: {
    id: 'boiled_water', name: '끓인 물', type: 'consumable', subtype: 'drink',
    rarity: 'common', weight: 0.5,
    defaultDurability: 100, defaultContamination: 10,
    icon: '♨️', description: '끓여서 살균한 물. 오염은 남지만 감염 위험 감소.',
    onConsume: { hydration: 65, infection: -5 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable'],
    dismantle: [],
  },

  purified_water: {
    id: 'purified_water', name: '정수된 물', type: 'consumable', subtype: 'drink',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💦', description: '숯 필터로 정수한 깨끗한 물.',
    onConsume: { hydration: 90 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable', 'clean'],
    dismantle: [],
  },

  sports_drink: {
    id: 'sports_drink', name: '스포츠음료', type: 'consumable', subtype: 'drink',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧃', description: '전해질 보충. 수분+피로 동시 회복.',
    onConsume: { hydration: 60, fatigue: -10 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable', 'clean'],
    dismantle: [],
  },

  alcohol_drink: {
    id: 'alcohol_drink', name: '주류', type: 'consumable', subtype: 'drink',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍺', description: '사기+, 판단력 흐려짐. 화염병·소독제 원료.',
    onConsume: { hydration: 20, morale: 20, fatigue: -5, infection: -10 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable', 'alcohol'],
    dismantle: [],
  },

  coffee: {
    id: 'coffee', name: '커피', type: 'consumable', subtype: 'drink',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☕', description: '피로를 즉시 회복. 사기도 소폭 상승.',
    onConsume: { hydration: 20, fatigue: -25, morale: 10 },
    tags: ['drinkable', 'stimulant'],
    dismantle: [],
  },

  // ─── 식량 (10) ────────────────────────────────────────────

  canned_food: {
    id: 'canned_food', name: '통조림', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥫', description: '냉전 시대 비상식량. 영양이 적당히 보충된다.',
    onConsume: { hydration: 10, nutrition: 30 },
    leaveOnConsume: { definitionId: 'empty_can', qty: 1 },
    tags: ['edible', 'preserved', 'food'],
    dismantle: [],
  },

  energy_bar: {
    id: 'energy_bar', name: '에너지바', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍫', description: '고열량 보충제. 피로 회복에 도움.',
    onConsume: { hydration: 5, nutrition: 20, fatigue: -15 },
    tags: ['edible', 'food'],
    dismantle: [],
  },

  instant_noodles: {
    id: 'instant_noodles', name: '라면 (건조)', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍜', description: '건조 라면. 끓인 물과 조리하면 더 효과적.',
    onConsume: { nutrition: 15, hydration: -5 },
    tags: ['edible', 'cookable', 'food'],
    dismantle: [],
  },

  cooked_noodles: {
    id: 'cooked_noodles', name: '조리된 라면', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍲', description: '제대로 조리한 라면. 영양과 사기가 회복된다.',
    onConsume: { nutrition: 35, hydration: 20, morale: 10 },
    tags: ['edible', 'hot', 'crafted', 'food'],
    dismantle: [],
  },

  rice: {
    id: 'rice', name: '쌀', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌾', description: '생쌀. 조리하면 훨씬 영양가 높아진다.',
    onConsume: { nutrition: 10 },
    tags: ['edible', 'cookable', 'food'],
    dismantle: [],
  },

  cooked_rice: {
    id: 'cooked_rice', name: '밥', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍚', description: '조리한 쌀밥. 영양을 크게 보충한다.',
    onConsume: { nutrition: 45, hydration: 10, morale: 15 },
    tags: ['edible', 'hot', 'crafted', 'food'],
    dismantle: [],
  },

  dried_meat: {
    id: 'dried_meat', name: '건육', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥩', description: '훈제 건조육. 영양이 높고 오래 보관 가능.',
    onConsume: { nutrition: 40, hydration: -5 },
    tags: ['edible', 'preserved', 'food'],
    dismantle: [],
  },

  military_ration: {
    id: 'military_ration', name: '군용 식량', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📦', description: '전투 식량 패키지. 영양·수분·사기를 모두 회복.',
    onConsume: { nutrition: 50, hydration: 30, morale: 15, fatigue: -10 },
    tags: ['edible', 'military', 'food'],
    dismantle: [],
  },

  vitamins: {
    id: 'vitamins', name: '비타민', type: 'consumable', subtype: 'supplement',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '종합 비타민. 면역력을 높여 감염·방사선 저항.',
    onConsume: { infection: -10, radiation: -5, morale: 5 },
    tags: ['edible', 'supplement'],
    dismantle: [],
  },

  salt: {
    id: 'salt', name: '소금', type: 'consumable', subtype: 'seasoning',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧂', description: '식품 보존·간 조절에 사용. 소독 보조 효과.',
    onConsume: { nutrition: 2, infection: -3 },
    tags: ['seasoning'],
    dismantle: [],
  },
};

export default ITEMS_BASE;
