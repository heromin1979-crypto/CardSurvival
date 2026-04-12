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

  raw_meat: {
    id: 'raw_meat', name: '날고기', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.5,
    defaultDurability: 60, defaultContamination: 30,
    icon: '🥩', description: '야생에서 얻은 날고기. 그냥 먹으면 감염 위험이 높다. 불에 익혀 먹는 것을 권장.',
    onConsume: { nutrition: 20, infection: 30 },
    tags: ['edible', 'food', 'raw'],
    dismantle: [],
  },

  // ─── 불 시스템 재료 (13) ──────────────────────────────────

  dry_wood_stick: {
    id: 'dry_wood_stick', name: '마른 나무 막대', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪵', description: '바짝 마른 나무 막대. 마찰로 불씨를 얻을 수 있다. 말라비틀어진 나무를 해체하면 얻는다.',
    tags: ['material', 'wood', 'fire'],
    dismantle: [],
  },

  dry_leaves: {
    id: 'dry_leaves', name: '마른 잎사귀', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍂', description: '바싹 마른 낙엽. 불쏘시개로 가공하거나 단열재로 쓸 수 있다.',
    tags: ['material', 'natural', 'fire'],
    dismantle: [],
  },

  dry_grass: {
    id: 'dry_grass', name: '마른 풀 뭉치', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌾', description: '황폐한 땅에서 채집한 마른 풀. 불쏘시개로 매우 유용하다.',
    tags: ['material', 'natural', 'fire'],
    dismantle: [],
  },

  firestone: {
    id: 'firestone', name: '부싯돌', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪨', description: '쇠에 부딪히면 불꽃이 튄다. 자갈 더미에서 발견된다. 반영구적으로 재사용 가능.',
    tags: ['material', 'natural', 'fire'],
    dismantle: [],
  },

  pebble: {
    id: 'pebble', name: '돌멩이', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪨', description: '주먹 크기의 돌. 화로 제작의 기초 재료이며 투척 무기로도 쓸 수 있다.',
    tags: ['material', 'natural'],
    dismantle: [],
  },

  kindling: {
    id: 'kindling', name: '장작', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪵', description: '불쏘시개를 통해 불을 옮겨 태우기 좋은 쪼갠 장작. 목재를 쪼개 만든다.',
    tags: ['material', 'wood', 'fire', 'fuel'],
    dismantle: [],
  },

  fire_ember: {
    id: 'fire_ember', name: '불씨', type: 'material', subtype: 'fire',
    rarity: 'uncommon', weight: 0.01,
    defaultDurability: 3, defaultContamination: 0,
    icon: '✨', description: '겨우 살아있는 작은 불씨. 불쏘시개와 함께 불꽃으로 육성해야 한다. 오래 방치하면 꺼진다.',
    tags: ['material', 'fire'],
    dismantle: [],
  },

  flame_token: {
    id: 'flame_token', name: '불꽃', type: 'material', subtype: 'fire',
    rarity: 'uncommon', weight: 0.01,
    defaultDurability: 5, defaultContamination: 0,
    icon: '🔥', description: '활활 타오르는 불꽃. 캠프파이어나 화로에 점화할 수 있다. 빠르게 꺼지므로 즉시 사용해야 한다.',
    tags: ['material', 'fire'],
    dismantle: [],
  },

  wood_plank: {
    id: 'wood_plank', name: '나무 판자', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪵', description: '목재를 다듬어 만든 판자. 화로 기반 제작과 건축에 필수.',
    tags: ['material', 'wood'],
    dismantle: [{ definitionId: 'wood', qty: 1, chance: 0.8 }],
  },

  tinder_bundle: {
    id: 'tinder_bundle', name: '불쏘시개 뭉치', type: 'material', subtype: 'fire',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '불씨를 불꽃으로 키우는 불쏘시개 뭉치. 마른 잎이나 마른 풀로 만든다.',
    tags: ['material', 'fire', 'natural'],
    dismantle: [],
  },

  matches: {
    id: 'matches', name: '성냥개비', type: 'material', subtype: 'fire',
    rarity: 'common', weight: 0.01,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔥', description: '편의점이나 가정집에서 발견되는 성냥. 1개당 불꽃 1회. 비에 젖으면 사용 불가.',
    tags: ['material', 'fire', 'consumable'],
    dismantle: [],
  },

  pine_cone: {
    id: 'pine_cone', name: '솔방울', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌲', description: '솔방울은 천연 연료로 캠프파이어에 투입하면 불이 오래 유지된다. 씨앗도 식용 가능.',
    tags: ['material', 'natural', 'fuel'],
    dismantle: [],
  },

  wood_bark: {
    id: 'wood_bark', name: '수피(나무껍질)', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '나무에서 벗긴 껍질. 방수 성질이 있어 로프 대체재나 임시 덮개로 사용 가능.',
    tags: ['material', 'natural'],
    dismantle: [],
  },

  // ─── 금속 제련 중간재 (6) ──────────���───────────────────────

  refined_metal: {
    id: 'refined_metal', name: '정제 금속판', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔩', description: '고철을 용광로에서 제련한 순도 높은 금속판. 도구·무기 제작의 핵심 재료.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.9 }],
  },

  steel_plate: {
    id: 'steel_plate', name: '강철판', type: 'material', subtype: 'metal',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚙️', description: '정제 금속을 고온 처리해 만든 강철. 소총탄·고급 무기에 필수.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'refined_metal', qty: 1, chance: 0.8 }],
  },

  lead_ingot: {
    id: 'lead_ingot', name: '납 덩어리', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔘', description: '배터리에서 추출한 납. 탄환 제작에 사용. 독성 주의.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [],
  },

  brass_fragment: {
    id: 'brass_fragment', name: '황동 조각', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🟡', description: '구리와 납을 합금한 황동. 탄피·뇌관 제작에 필수.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [],
  },

  empty_cartridge: {
    id: 'empty_cartridge', name: '탄피 (빈)', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔴', description: '황동으로 만든 빈 탄피. 화약과 탄두를 채워 실탄으로 완성한다.',
    tags: ['material', 'metal', 'crafted', 'ammo_part'],
    dismantle: [{ definitionId: 'brass_fragment', qty: 1, chance: 0.5 }],
  },

  detonator_cap: {
    id: 'detonator_cap', name: '뇌관', type: 'material', subtype: 'chemical',
    rarity: 'rare', weight: 0.02,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💥', description: '충격으로 점화되는 뇌관. 탄약 조립의 핵심 부품. 취급 극도 주의.',
    tags: ['material', 'chemical', 'crafted', 'ammo_part', 'explosive'],
    dismantle: [],
  },

  // ─── 화학 합성 중간재 (3) ──────────────────────────────────

  black_powder: {
    id: 'black_powder', name: '흑색 화약', type: 'material', subtype: 'chemical',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💣', description: '숯·초석·유황으로 합성한 흑색 화약. 탄약·폭발물 제작에 사용.',
    tags: ['material', 'chemical', 'crafted', 'explosive'],
    dismantle: [],
  },

  sulfur: {
    id: 'sulfur', name: '유황', type: 'material', subtype: 'chemical',
    rarity: 'uncommon', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🟨', description: '화산 온천 지역에서 나오는 황. 흑색 화약 합성의 필수 재료.',
    tags: ['material', 'chemical', 'natural'],
    dismantle: [],
  },

  saltpeter: {
    id: 'saltpeter', name: '초석', type: 'material', subtype: 'chemical',
    rarity: 'uncommon', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧂', description: '질산칼륨. 오래된 건물 벽이나 동굴에서 채취. 흑색 화약 합성 재료.',
    tags: ['material', 'chemical', 'natural'],
    dismantle: [],
  },

  // ─── 도구 제작 중간재 (6) ─────────────────���────────────────

  ax_head: {
    id: 'ax_head', name: '도끼날', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪓', description: '야전 대장간에서 단조한 도끼 날. 자루에 결합하면 도끼가 완성된다.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'refined_metal', qty: 1, chance: 0.8 }],
  },

  shovel_head: {
    id: 'shovel_head', name: '삽 머리', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.7,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔩', description: '단조한 삽 날. 나무 자루에 결합하면 삽이 완성된다.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'refined_metal', qty: 1, chance: 0.8 }],
  },

  hammer_head: {
    id: 'hammer_head', name: '망치 머리', type: 'material', subtype: 'metal',
    rarity: 'uncommon', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔨', description: '단조한 망치 헤드. 나무 자루에 결합하면 망치가 완성된다.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'refined_metal', qty: 1, chance: 0.7 }],
  },

  fishing_hook: {
    id: 'fishing_hook', name: '낚싯바늘', type: 'material', subtype: 'metal',
    rarity: 'common', weight: 0.01,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🎣', description: '철사로 구부려 만든 낚싯바늘. 낚싯대에 결합해 사용.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'wire', qty: 1, chance: 0.5 }],
  },

  bolt_shaft: {
    id: 'bolt_shaft', name: '볼트 샤프트', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '➡️', description: '다듬은 나무 막대. 볼트 촉과 조합하면 개선된 석궁 볼트가 된다.',
    tags: ['material', 'wood', 'crafted'],
    dismantle: [],
  },

  bolt_tip: {
    id: 'bolt_tip', name: '볼트 촉', type: 'material', subtype: 'metal',
    rarity: 'common', weight: 0.03,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔺', description: '야전 대장간에서 만든 날카로운 볼트 촉. 일반 볼트보다 관통력이 높다.',
    tags: ['material', 'metal', 'crafted'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 1, chance: 0.4 }],
  },

  // ═══ Phase C: 식생 확장 — 야생 채집 식물 (10) ═══════════════════════

  wild_berry: {
    id: 'wild_berry', name: '야생 베리', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.1,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🫐', description: '산야에서 자라는 야생 베리. 날것으로 먹으면 감염 위험이 있다. 잼이나 발효주 재료.',
    tags: ['material', 'natural', 'food_raw'],
    onUse: { nutrition: 8, infection: 5 },
    dismantle: [],
  },

  mushroom_edible: {
    id: 'mushroom_edible', name: '식용 버섯', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.15,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🍄', description: '먹을 수 있는 버섯. 반드시 익혀 먹어야 안전하다. 날것은 감염 위험.',
    tags: ['material', 'natural', 'food_raw'],
    onUse: { nutrition: 10, infection: 15 },
    dismantle: [],
  },

  mushroom_toxic: {
    id: 'mushroom_toxic', name: '독버섯', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🍄', description: '먹으면 안 되는 독버섯. 식용 버섯과 비슷하게 생겼다. 독 추출 재료로 활용 가능.',
    tags: ['material', 'natural', 'toxic'],
    onUse: { hp: -20, poisonDamage: 3 },
    dismantle: [],
  },

  acorn: {
    id: 'acorn', name: '도토리', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🌰', description: '참나무에서 떨어진 도토리. 날것은 쓴맛이 강하다. 갈아서 가루로 만들면 묵·죽 재료.',
    tags: ['material', 'natural', 'food_raw'],
    onUse: { nutrition: 5, morale: -3 },
    dismantle: [],
  },

  wild_root: {
    id: 'wild_root', name: '야생 뿌리', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.2,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🌿', description: '땅속에서 캔 야생 뿌리채소. 날것으로도 먹을 수 있으나 조리하면 영양가가 높아진다.',
    tags: ['material', 'natural', 'food_raw'],
    onUse: { nutrition: 8, stamina: -5 },
    dismantle: [],
  },

  dandelion: {
    id: 'dandelion', name: '민들레', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.05,
    defaultDurability: 10, defaultContamination: 0,
    icon: '🌼', description: '도시 어디서나 자라는 잡초. 잎은 식용, 뿌리는 커피 대용으로 끓일 수 있다.',
    tags: ['material', 'natural', 'food_raw'],
    onUse: { nutrition: 3, infection: -2 },
    dismantle: [],
  },

  wild_garlic: {
    id: 'wild_garlic', name: '야생 마늘', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🧄', description: '산에서 자라는 야생 마늘. 강한 항균 효과가 있다. 요리 향신료 및 의료 재료.',
    tags: ['material', 'natural', 'food_raw', 'medical'],
    onUse: { nutrition: 5, infection: -8 },
    dismantle: [],
  },

  nettle: {
    id: 'nettle', name: '쐐기풀', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.1,
    defaultDurability: 10, defaultContamination: 0,
    icon: '🌱', description: '강변이나 습지에서 자라는 쐐기풀. 날것은 독성이 있어 반드시 조리해야 한다. 섬유 추출도 가능.',
    tags: ['material', 'natural', 'toxic_raw'],
    onUse: { hp: -5, infection: 10 },
    dismantle: [],
  },

  pine_needle: {
    id: 'pine_needle', name: '솔잎', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 0.05,
    defaultDurability: 10, defaultContamination: 0,
    icon: '🌲', description: '소나무에서 채취한 솔잎. 비타민 C가 풍부하다. 솔잎차로 끓이면 감염 억제에 탁월.',
    tags: ['material', 'natural', 'medical'],
    onUse: { nutrition: 2, infection: -5 },
    dismantle: [],
  },

  bamboo_shoot: {
    id: 'bamboo_shoot', name: '죽순', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🎋', description: '대나무에서 돋아난 죽순. 영양가가 높고 날것으로도 먹을 수 있다. 조리하면 더 맛있다.',
    tags: ['material', 'natural', 'food_raw'],
    onUse: { nutrition: 10, morale: 3 },
    dismantle: [],
  },

  // ═══ Phase C: 식생 확장 — 손질/분쇄 재료 (6) ═══════════════════════

  meat_strip: {
    id: 'meat_strip', name: '고기 스트립', type: 'material', subtype: 'food_raw',
    rarity: 'common', weight: 0.2,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🥩', description: '칼로 손질한 얇은 고기 조각. 그대로 먹거나 건조·조리에 사용.',
    tags: ['material', 'food_raw'],
    onUse: { nutrition: 15, infection: 20 },
    dismantle: [],
  },

  fish_fillet: {
    id: 'fish_fillet', name: '생선 필레', type: 'material', subtype: 'food_raw',
    rarity: 'common', weight: 0.2,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🐟', description: '손질된 생선살. 날것은 감염 위험. 구우면 영양이 높아진다.',
    tags: ['material', 'food_raw'],
    onUse: { nutrition: 15, infection: 25 },
    dismantle: [],
  },

  acorn_flour: {
    id: 'acorn_flour', name: '도토리 가루', type: 'material', subtype: 'food_raw',
    rarity: 'common', weight: 0.15,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🌾', description: '절구에 갈아 만든 도토리 가루. 도토리묵이나 도토리죽의 핵심 재료.',
    tags: ['material', 'food_raw'],
    dismantle: [],
  },

  garlic_paste: {
    id: 'garlic_paste', name: '마늘 페이스트', type: 'material', subtype: 'food_raw',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🧄', description: '절구에 빻은 야생 마늘 페이스트. 요리의 풍미와 항균력을 높여준다.',
    tags: ['material', 'food_raw', 'medical'],
    dismantle: [],
  },

  herb_powder: {
    id: 'herb_powder', name: '약초 가루', type: 'material', subtype: 'medical',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🌿', description: '절구에 갈아 만든 약초 가루. 일반 약초보다 효과가 강하고 다양한 의약품 제조에 활용.',
    tags: ['material', 'medical'],
    dismantle: [],
  },

  nettle_fiber: {
    id: 'nettle_fiber', name: '쐐기풀 섬유', type: 'material', subtype: 'textile',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '쐐기풀을 가공해 뽑아낸 질긴 섬유. 로프 대용으로 사용 가능.',
    tags: ['material', 'textile'],
    dismantle: [],
  },

  // ═══ Phase C: 식생 확장 — 보존 가공 식품 (4) ════════════════════════

  dried_fish: {
    id: 'dried_fish', name: '말린 생선', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐟', description: '건조대에서 소금에 절여 말린 생선. 장기 보존이 가능한 고단백 식량.',
    tags: ['consumable', 'food', 'preserved'],
    onUse: { nutrition: 35, hydration: -5 },
    dismantle: [],
  },

  dried_mushroom: {
    id: 'dried_mushroom', name: '건조 버섯', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍄', description: '건조대에서 말린 버섯. 가벼워서 휴대하기 좋고 수프 재료로 활용도 높다.',
    tags: ['consumable', 'food', 'preserved'],
    onUse: { nutrition: 20, morale: 5 },
    dismantle: [],
  },

  dried_berry: {
    id: 'dried_berry', name: '말린 베리', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫐', description: '건조대에서 말린 야생 베리. 달콤한 간식이 되어 사기를 올려준다.',
    tags: ['consumable', 'food', 'preserved'],
    onUse: { nutrition: 20, morale: 8 },
    dismantle: [],
  },

  berry_jam: {
    id: 'berry_jam', name: '베리잼', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '야생 베리를 졸여 만든 잼. 달콤한 맛이 절망적인 현실을 잠시 잊게 해준다.',
    tags: ['consumable', 'food', 'preserved'],
    onUse: { nutrition: 15, morale: 15 },
    dismantle: [],
  },

  // ═══ Phase C: 식생 확장 — 조리 식품 (8) ════════════════════════════

  acorn_jelly: {
    id: 'acorn_jelly', name: '도토리묵', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🫙', description: '도토리 가루로 만든 전통 묵. 익숙한 맛이 사기와 트라우마 회복을 돕는다.',
    tags: ['consumable', 'food', 'cooked'],
    onUse: { nutrition: 30, morale: 12, trauma: -3 },
    dismantle: [],
  },

  mushroom_soup: {
    id: 'mushroom_soup', name: '버섯 수프', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🍵', description: '식용 버섯과 야생 마늘로 끓인 수프. 영양과 체력 회복에 좋다.',
    tags: ['consumable', 'food', 'cooked'],
    onUse: { nutrition: 35, morale: 8, stamina: 10 },
    dismantle: [],
  },

  nettle_stew: {
    id: 'nettle_stew', name: '쐐기풀 스튜', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.35,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🍲', description: '쐐기풀과 야생 뿌리를 오래 끓인 스튜. 생존자들의 든든한 한 끼.',
    tags: ['consumable', 'food', 'cooked'],
    onUse: { nutrition: 40, stamina: 20 },
    dismantle: [],
  },

  vegetable_stew: {
    id: 'vegetable_stew', name: '야채 스튜', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.35,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🥘', description: '텃밭 채소와 야생 마늘로 끓인 풍성한 스튜. 최고 수준의 영양식.',
    tags: ['consumable', 'food', 'cooked'],
    onUse: { nutrition: 55, morale: 18, infection: -5, stamina: 15 },
    dismantle: [],
  },

  pine_needle_tea: {
    id: 'pine_needle_tea', name: '솔잎차', type: 'consumable', subtype: 'drink',
    rarity: 'common', weight: 0.2,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🍵', description: '솔잎을 끓여 만든 차. 비타민 C가 풍부해 감염 억제에 효과적이다.',
    tags: ['consumable', 'drink'],
    onUse: { hydration: 25, infection: -10, morale: 5 },
    dismantle: [],
  },

  dandelion_coffee: {
    id: 'dandelion_coffee', name: '민들레 커피', type: 'consumable', subtype: 'drink',
    rarity: 'common', weight: 0.2,
    defaultDurability: 30, defaultContamination: 0,
    icon: '☕', description: '민들레 뿌리를 볶아 끓인 커피 대용음료. 카페인은 없지만 향이 위안이 된다.',
    tags: ['consumable', 'drink'],
    onUse: { hydration: 20, fatigue: -20, morale: 8 },
    dismantle: [],
  },

  wild_salad: {
    id: 'wild_salad', name: '야생 샐러드', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0.2,
    defaultDurability: 10, defaultContamination: 0,
    icon: '🥗', description: '민들레·베리·야생 마늘을 섞은 신선 샐러드. 빠르게 만들 수 있는 영양식.',
    tags: ['consumable', 'food'],
    onUse: { nutrition: 20, morale: 10, infection: -3 },
    dismantle: [],
  },

  grilled_fish: {
    id: 'grilled_fish', name: '구운 생선', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.25,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🐟', description: '모닥불에 소금 간을 해서 구운 생선. 단백질이 풍부하고 맛도 좋다.',
    tags: ['consumable', 'food', 'cooked'],
    onUse: { nutrition: 40, stamina: 15, morale: 10 },
    dismantle: [],
  },

  // ═══ Phase C: 식생 확장 — 발효 식품 (3) ════════════════════════════

  fermented_kimchi: {
    id: 'fermented_kimchi', name: '발효 김치', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '채소와 야생 마늘을 소금에 절여 발효시킨 김치. 장기 보존 가능. 감염 저항에 탁월.',
    tags: ['consumable', 'food', 'preserved', 'fermented'],
    onUse: { nutrition: 15, infection: -15, morale: 20 },
    dismantle: [],
  },

  berry_wine: {
    id: 'berry_wine', name: '베리 발효주', type: 'consumable', subtype: 'drink',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍷', description: '야생 베리를 발효시킨 술. 트라우마와 피로 회복에 효과적이나 너무 많이 마시면 안 된다.',
    tags: ['consumable', 'drink', 'fermented'],
    onUse: { morale: 30, fatigue: -10, trauma: -5, hydration: -5 },
    dismantle: [],
  },

  fermented_grain: {
    id: 'fermented_grain', name: '발효 곡물죽', type: 'consumable', subtype: 'food',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🥣', description: '곡물을 발효시켜 만든 영양 죽. 소화가 잘 되고 스태미나 회복에 좋다.',
    tags: ['consumable', 'food', 'fermented'],
    onUse: { nutrition: 45, stamina: 25 },
    dismantle: [],
  },

  // ═══ Phase C: 식생 확장 — 농작물 씨앗·수확물 (6) ══════════════════════

  vegetable_seed: {
    id: 'vegetable_seed', name: '채소 씨앗', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.02,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌱', description: '채소 씨앗 모음. 텃밭에 심으면 5일 후 채소를 수확할 수 있다.',
    tags: ['material', 'natural', 'seed'],
    dismantle: [],
  },

  herb_seed: {
    id: 'herb_seed', name: '약초 씨앗', type: 'material', subtype: 'natural',
    rarity: 'uncommon', weight: 0.02,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '약초 씨앗. 텃밭에 심으면 지속적으로 약초를 수확할 수 있다.',
    tags: ['material', 'natural', 'seed'],
    dismantle: [],
  },

  grain_seed: {
    id: 'grain_seed', name: '곡물 씨앗', type: 'material', subtype: 'natural',
    rarity: 'rare', weight: 0.03,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌾', description: '쌀·보리·밀 씨앗 혼합. 텃밭에 심으면 7일 후 대량 수확이 가능하다.',
    tags: ['material', 'natural', 'seed'],
    dismantle: [],
  },

  vegetable: {
    id: 'vegetable', name: '채소', type: 'material', subtype: 'food_raw',
    rarity: 'common', weight: 0.2,
    defaultDurability: 25, defaultContamination: 0,
    icon: '🥬', description: '텃밭에서 수확한 신선한 채소. 야채 스튜나 김치의 핵심 재료.',
    tags: ['material', 'food_raw', 'natural'],
    onUse: { nutrition: 12, infection: -2 },
    dismantle: [],
  },

  grain: {
    id: 'grain', name: '곡물', type: 'material', subtype: 'food_raw',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌾', description: '텃밭에서 수확한 곡물. 밥 대용으로 조리하거나 발효죽을 만들 수 있다.',
    tags: ['material', 'food_raw'],
    dismantle: [],
  },

  soil_bag: {
    id: 'soil_bag', name: '흙 주머니', type: 'material', subtype: 'natural',
    rarity: 'common', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪨', description: '자갈더미나 건축 현장에서 모은 흙. 텃밭 조성에 필수 재료.',
    tags: ['material', 'natural'],
    dismantle: [{ definitionId: 'pebble', qty: 2, chance: 0.5 }],
  },

  // ═══ Phase C: 식생 확장 — 낚시 수확물 (2) ════════════════════════════

  raw_fish: {
    id: 'raw_fish', name: '날생선', type: 'material', subtype: 'food_raw',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🐟', description: '강이나 통발에서 잡은 날생선. 반드시 손질 후 조리해야 한다.',
    tags: ['material', 'food_raw'],
    onUse: { nutrition: 10, infection: 30 },
    dismantle: [],
  },

  honey: {
    id: 'honey', name: '꿀', type: 'material', subtype: 'natural',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍯', description: '벌통에서 채취한 꿀. 발효 촉진재로 쓰이거나 약초와 섞으면 치유 효과가 있다.',
    tags: ['material', 'natural', 'medical'],
    onUse: { nutrition: 15, morale: 8 },
    dismantle: [],
  },
};

export default ITEMS_BASE;
