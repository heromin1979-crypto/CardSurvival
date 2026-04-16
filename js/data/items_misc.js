// === ITEMS: MISC (가방·특수·식량·무기·재료·기타) ===
// 의료 → items_medical.js, 도구 → items_tools.js, 구조물 → items_structures.js 분리 후
// 가방 5 + 특수 6 + 비밀조합(무기/방어구/재료) 8 + 지도조각 3 + 한강 1
// + 미끼 2 + 생선 4 + 조리고기 1 + 채집식물 7 + 독/강화 2 = 39항목

const ITEMS_MISC = {

  // ─── 가방 (5) ─────────────────────────────────────────────

  small_bag: {
    id: 'small_bag', name: '작은 가방', type: 'tool', subtype: 'bag',
    rarity: 'common', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '👜', description: '소형 가방. 장착 시 인벤토리 3칸 확장.',
    tags: ['tool', 'bag'],
    bagSlots: 3,
    dismantle: [
      { definitionId: 'cloth', qty: 2, chance: 0.8 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
    ],
  },

  messenger_bag: {
    id: 'messenger_bag', name: '메신저백', type: 'tool', subtype: 'bag',
    rarity: 'common', weight: 0.5,
    defaultDurability: 75, defaultContamination: 0,
    icon: '💼', description: '어깨에 메는 가방. 장착 시 인벤토리 4칸 확장.',
    tags: ['tool', 'bag'],
    bagSlots: 4,
    dismantle: [
      { definitionId: 'leather', qty: 1, chance: 0.7 },
      { definitionId: 'cloth', qty: 2, chance: 0.7 },
    ],
  },

  backpack: {
    id: 'backpack', name: '배낭', type: 'tool', subtype: 'bag',
    rarity: 'uncommon', weight: 1.0,
    defaultDurability: 90, defaultContamination: 0,
    icon: '🎒', description: '든든한 배낭. 장착 시 인벤토리 5칸 확장.',
    tags: ['tool', 'bag', 'crafted'],
    bagSlots: 5,
    dismantle: [
      { definitionId: 'cloth', qty: 3, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  duffel_bag: {
    id: 'duffel_bag', name: '더플백', type: 'tool', subtype: 'bag',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 85, defaultContamination: 0,
    icon: '🧳', description: '대형 더플백. 장착 시 인벤토리 6칸 확장.',
    tags: ['tool', 'bag', 'crafted'],
    bagSlots: 6,
    dismantle: [
      { definitionId: 'cloth', qty: 4, chance: 0.8 },
      { definitionId: 'rope', qty: 2, chance: 0.6 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  military_bag: {
    id: 'military_bag', name: '군용 배낭', type: 'tool', subtype: 'bag',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪖', description: '군용 전술 배낭. 장착 시 인벤토리 7칸 확장.',
    tags: ['tool', 'bag'],
    bagSlots: 7,
    dismantle: [
      { definitionId: 'cloth', qty: 3, chance: 0.7 },
      { definitionId: 'leather', qty: 2, chance: 0.7 },
      { definitionId: 'rope', qty: 2, chance: 0.6 },
    ],
  },

  // ─── 특수 (6) ─────────────────────────────────────────────

  fuel_can: {
    id: 'fuel_can', name: '연료통', type: 'special', subtype: 'resource',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⛽', description: '발전기·차량에 사용되는 연료. 화염병 제작 원료.',
    tags: ['special', 'fuel'],
    dismantle: [],
  },

  map_fragment: {
    id: 'map_fragment', name: '지도 조각', type: 'special', subtype: 'document',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', description: '서울 지도의 일부. 모으면 새 지역이 개방된다.',
    tags: ['special', 'collectible'],
    dismantle: [],
  },

  survivor_note: {
    id: 'survivor_note', name: '생존자 메모', type: 'special', subtype: 'document',
    rarity: 'uncommon', weight: 0.01,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📝', description: '이전 생존자의 기록. 사기를 높이고 단서를 제공.',
    onConsume: { morale: 15 },
    tags: ['special', 'document'],
    dismantle: [],
  },

  emergency_kit: {
    id: 'emergency_kit', name: '비상키트', type: 'special', subtype: 'medical',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🆘', description: '위기 상황 대응 완전 세트. 최고의 응급 도구.',
    onConsume: { hp: 60, infection: -40, radiation: -20, fatigue: -30, morale: 20 },
    tags: ['special', 'medical', 'healing'],
    dismantle: [
      { definitionId: 'first_aid_kit', qty: 1, chance: 0.7 },
      { definitionId: 'painkiller', qty: 2, chance: 0.8 },
    ],
  },

  flashbang: {
    id: 'flashbang', name: '섬광탄', type: 'weapon', subtype: 'throwable',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💥', description: '섬광으로 적 기절. 도주·은신 성공률 대폭 상승.',
    tags: ['special', 'throwable'],
    combat: {
      damage: [0, 0], accuracy: 1.0, noiseOnUse: 25, durabilityLoss: 100,
      statusInflict: { id: 'stun', name: '기절', duration: 1, effect: { skipTurn: true }, chance: 0.70 },
    },
    dismantle: [],
  },

  premium_ration: {
    id: 'premium_ration', name: '군용 식량 (고급)', type: 'consumable', subtype: 'food',
    rarity: 'legendary', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥗', description: '특수부대용 고급 전투 식량. 모든 수치 대폭 회복.',
    onConsume: { nutrition: 80, hydration: 50, morale: 30, fatigue: -30, hp: 20 },
    tags: ['special', 'food', 'military'],
    dismantle: [],
  },

  // ═══ 비밀 조합 결과물 (무기·방어구·탄약·재료) ═══════════

  reinforced_shield: {
    id: 'reinforced_shield', name: '강화 방패', type: 'weapon', subtype: 'shield',
    rarity: 'rare', weight: 4.0, stackable: false, maxStack: 1,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🛡️', description: '고철로 보강한 방패. 높은 방어력.',
    combat: { damage: [0, 0], accuracy: 0, defense: 25, noiseOnAttack: 1 },
    tags: ['shield', 'defense'],
    equipSlot: 'offhand',
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.7 }],
  },
  fire_bolt: {
    id: 'fire_bolt', name: '화염 볼트', type: 'consumable', subtype: 'ammo',
    rarity: 'uncommon', weight: 0.1, stackable: true, maxStack: 10,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔥', description: '불에 담근 크로스보우 볼트. 추가 화상 데미지.',
    tags: ['ammo', 'ranged'], dismantle: [],
  },
  sling: {
    id: 'sling', name: '슬링', type: 'weapon', subtype: 'ranged',
    rarity: 'common', weight: 0.3, stackable: false, maxStack: 1,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🪢', description: '천과 로프로 만든 원시 투석기.',
    combat: { damage: [3, 8], accuracy: 0.55, noiseOnAttack: 2 },
    tags: ['ranged', 'weapon'],
    equipSlot: 'weapon_sub',
    dismantle: [{ definitionId: 'cloth', qty: 1, chance: 0.5 }],
  },
  thorn_wire: {
    id: 'thorn_wire', name: '가시 철사', type: 'material', subtype: 'defense',
    rarity: 'uncommon', weight: 1.5, stackable: true, maxStack: 5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪡', description: '철사와 못으로 만든 날카로운 방어물.',
    tags: ['material', 'defense'], dismantle: [{ definitionId: 'wire', qty: 1, chance: 0.6 }],
  },
  makeshift_shield: {
    id: 'makeshift_shield', name: '임시 방패', type: 'weapon', subtype: 'shield',
    rarity: 'common', weight: 3.0, stackable: false, maxStack: 1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🛡️', description: '나무와 고철로 만든 임시 방패.',
    combat: { damage: [0, 0], accuracy: 0, defense: 12, noiseOnAttack: 2 },
    tags: ['shield', 'defense'],
    equipSlot: 'offhand',
    dismantle: [{ definitionId: 'wood', qty: 1, chance: 0.7 }, { definitionId: 'scrap_metal', qty: 1, chance: 0.5 }],
  },
  battery: {
    id: 'battery', name: '배터리', type: 'material', subtype: 'electronic',
    rarity: 'uncommon', weight: 0.3, stackable: true, maxStack: 5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔋', description: '아직 충전이 남아있는 배터리.',
    tags: ['material', 'electronic'], dismantle: [],
  },

  // ── 서울 지도 조각 (3파츠) ──────────────────────────────────
  map_fragment_north: {
    id: 'map_fragment_north', name: '서울 북부 지도 조각', type: 'misc', subtype: 'document',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', fragmentOf: 'north',
    description: '은평·종로·노원·도봉 일대 손그림 지도. 낡았지만 주요 도로와 랜드마크가 표시돼 있다.',
    tags: ['document', 'map'], dismantle: [],
  },
  map_fragment_center: {
    id: 'map_fragment_center', name: '서울 중부 지도 조각', type: 'misc', subtype: 'document',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', fragmentOf: 'center',
    description: '마포·용산·중구·성동 일대 인쇄 지도. 상인이 이동 경로를 형광펜으로 표시해뒀다.',
    tags: ['document', 'map'], dismantle: [],
  },
  map_fragment_south: {
    id: 'map_fragment_south', name: '서울 남부 지도 조각', type: 'misc', subtype: 'document',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', fragmentOf: 'south',
    description: '강남·서초·송파·강동 일대 군용 지도. 군 보급창고 위치에 붉은 X 표시가 남아있다.',
    tags: ['document', 'map'], dismantle: [],
  },

  // ─── 한강 랜드마크 카드 ───────────────────────────────────
  lm_hangang: {
    id: 'lm_hangang', name: '한강', type: 'location', subtype: 'landmark',
    landmark: true, isHangang: true,
    icon: '🌊', rarity: 'common', weight: 0, stackable: false,
    description: '한강변 낚시터. 낚시와 통발 설치가 가능한 구역.',
    tags: ['location', 'landmark', 'fishing'],
    dismantle: [],
  },

  // ─── 미끼 (2) ─────────────────────────────────────────────

  bait_worm: {
    id: 'bait_worm', name: '지렁이 미끼', type: 'consumable', subtype: 'bait',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪱', stackable: true, maxStack: 10,
    description: '땅을 파서 구한 지렁이. 낚시 확률 +10%.',
    tags: ['bait', 'fishing'],
    dismantle: [],
  },

  bait_insect: {
    id: 'bait_insect', name: '곤충 미끼', type: 'consumable', subtype: 'bait',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🦗', stackable: true, maxStack: 10,
    description: '잡은 곤충. 낚시 확률 +5%.',
    tags: ['bait', 'fishing'],
    dismantle: [],
  },

  // ─── 생선 (4) ─────────────────────────────────────────────

  fish_small: {
    id: 'fish_small', name: '피라미/붕어', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐟', stackable: true, maxStack: 10,
    nutrition: 15, infectionRisk: 0.15,
    description: '날로 먹을 수 있지만 감염 위험. 구워 먹길 권장.',
    onConsume: { nutrition: 15, infection: 8 },
    tags: ['food', 'fish', 'raw'],
    dismantle: [],
  },

  fish_medium: {
    id: 'fish_medium', name: '잉어/숭어', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐟', stackable: true, maxStack: 5,
    nutrition: 30,
    description: '요리하면 영양가가 높아진다.',
    onConsume: { nutrition: 30, infection: 5 },
    tags: ['food', 'fish', 'raw'],
    dismantle: [],
  },

  fish_large: {
    id: 'fish_large', name: '메기/배스', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐠', stackable: true, maxStack: 3,
    nutrition: 55, isRare: true,
    description: '희귀한 대형 어류. 반드시 조리 후 섭취.',
    onConsume: { nutrition: 55, infection: 12 },
    tags: ['food', 'fish', 'raw', 'rare'],
    dismantle: [],
  },

  fish_cooked: {
    id: 'fish_cooked', name: '구운 생선', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍣', stackable: true, maxStack: 10,
    nutrition: 45,
    description: '불에 구운 생선. 감염 위험 없음.',
    onConsume: { nutrition: 45, morale: 3 },
    tags: ['food', 'fish', 'cooked'],
    dismantle: [],
  },

  cooked_meat: {
    id: 'cooked_meat', name: '구운 고기', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍖', stackable: true, maxStack: 10,
    nutrition: 40,
    description: '불에 구운 고기. 안전하게 섭취 가능.',
    onConsume: { nutrition: 40, morale: 5 },
    tags: ['food', 'meat', 'cooked'],
    dismantle: [],
  },

  // ─── 채집 식물 (7) ────────────────────────────────────────

  wild_strawberry: {
    id: 'wild_strawberry', name: '산딸기', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍓', stackable: true, maxStack: 20,
    nutrition: 8, morale: 2,
    description: '숲에서 채집한 산딸기. 바로 먹을 수 있다.',
    onConsume: { nutrition: 8, morale: 2 },
    tags: ['food', 'plant', 'forage'],
    dismantle: [],
  },

  wild_grape: {
    id: 'wild_grape', name: '머루', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍇', stackable: true, maxStack: 20,
    nutrition: 10,
    description: '야생 머루. 단맛이 있어 사기가 약간 오른다.',
    onConsume: { nutrition: 10, morale: 3 },
    tags: ['food', 'plant', 'forage'],
    dismantle: [],
  },

  chestnut: {
    id: 'chestnut', name: '밤', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌰', stackable: true, maxStack: 20,
    nutrition: 15,
    description: '밤나무에서 채집한 밤. 구우면 영양이 오른다.',
    onConsume: { nutrition: 15 },
    tags: ['food', 'plant', 'forage'],
    dismantle: [],
  },

  chestnut_roasted: {
    id: 'chestnut_roasted', name: '군밤', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌰', stackable: true, maxStack: 20,
    nutrition: 22,
    description: '불에 구운 밤.',
    onConsume: { nutrition: 22, morale: 2 },
    tags: ['food', 'plant', 'cooked'],
    dismantle: [],
  },

  apple_wild: {
    id: 'apple_wild', name: '야생 사과', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍎', stackable: true, maxStack: 10,
    nutrition: 12,
    description: '산에서 자란 야생 사과. 조금 시다.',
    onConsume: { nutrition: 12, morale: 1 },
    tags: ['food', 'plant', 'forage'],
    dismantle: [],
  },

  pine_nut: {
    id: 'pine_nut', name: '잣', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', stackable: true, maxStack: 20,
    nutrition: 10,
    description: '잣나무에서 채집한 잣. 영양 밀도가 높다.',
    onConsume: { nutrition: 10 },
    tags: ['food', 'plant', 'forage'],
    dismantle: [],
  },

  acorn_boiled: {
    id: 'acorn_boiled', name: '도토리 묵 재료', type: 'consumable', subtype: 'food',
    rarity: 'common', weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌰', stackable: true, maxStack: 20,
    nutrition: 12,
    description: '삶아서 떫은맛을 뺀 도토리.',
    onConsume: { nutrition: 12 },
    tags: ['food', 'plant', 'cooked'],
    dismantle: [],
  },

  // ── 비밀 조합 전용 아이템 ─────────────────────────────────
  poison: {
    id: 'poison',
    name: '독',
    type: 'consumable', subtype: 'misc',
    rarity: 'uncommon',
    weight: 0.1,
    defaultDurability: 100,
    defaultContamination: 0,
    icon: '☠️',
    description: '독버섯에서 추출한 독. 무기에 바르거나 함정에 사용할 수 있다.',
    tags: ['consumable', 'poison', 'crafting'],
    dismantle: [],
  },

  guard_stance_kit: {
    id: 'guard_stance_kit',
    name: '방어 자세 키트',
    type: 'consumable', subtype: 'enhancement',
    rarity: 'uncommon',
    weight: 0.3,
    defaultDurability: 100,
    defaultContamination: 0,
    icon: '🛡️',
    description: '가죽끈과 로프로 만든 방어 보조 키트. 사용 시 가드 효율이 일시적으로 상승한다.',
    tags: ['enhancement', 'defense'],
    dismantle: [{ definitionId: 'leather', qty: 1, chance: 0.5 }],
  },

  // ─── 훈련용 아이템 (4) ──────────────────────────────────────

  practice_bandage: {
    id: 'practice_bandage', name: '연습용 붕대', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.1,
    defaultDurability: 1, defaultContamination: 0,
    icon: '🩹', description: '약초와 천으로 만든 간이 붕대. 의료 훈련용.',
    tags: ['medical', 'training'],
    onUse: { heal: 3 },
    dismantle: [],
  },

  wooden_sword: {
    id: 'wooden_sword', name: '목검', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 0.8,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🗡️', description: '나무로 깎은 훈련용 칼. 위력은 약하지만 연습에 좋다.',
    tags: ['weapon', 'melee', 'training'],
    damage: [2, 5],
    dismantle: [{ definitionId: 'wood_plank', qty: 1, chance: 0.6 }],
  },

  cloth_guard: {
    id: 'cloth_guard', name: '천 호구', type: 'armor', subtype: 'body',
    rarity: 'common', weight: 0.5,
    defaultDurability: 25, defaultContamination: 0,
    icon: '🥋', description: '천으로 겹쳐 만든 간이 보호구. 훈련용.',
    tags: ['armor', 'training'],
    defense: 2,
    dismantle: [{ definitionId: 'cloth', qty: 1, chance: 0.5 }],
  },

  training_shield: {
    id: 'training_shield', name: '훈련용 방패', type: 'armor', subtype: 'offhand',
    rarity: 'common', weight: 1.2,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🛡️', description: '나무 판자와 고철로 만든 간이 방패. 건설 훈련용.',
    tags: ['armor', 'shield', 'training'],
    defense: 3,
    dismantle: [
      { definitionId: 'wood_plank', qty: 1, chance: 0.5 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.3 },
    ],
  },

  // ─── 노숙자 전용 아이템 (5) ──────────────────────────────────
  // 최형식 시작 지급 아이템 + 거리 생활 특수 장비·무기

  battered_can: {
    id: 'battered_can', name: '찌그러진 양철통', type: 'tool', subtype: 'container',
    rarity: 'common', weight: 0.3,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🥫', description: '노숙 생활로 찌그러진 양철통. 물을 2회분 저장할 수 있다.',
    tags: ['tool', 'container', 'homeless'],
    waterCapacity: 2,
    dismantle: [{ definitionId: 'scrap_metal', qty: 1, chance: 0.8 }],
  },

  old_blanket: {
    id: 'old_blanket', name: '낡은 담요', type: 'armor', subtype: 'body',
    rarity: 'common', weight: 0.8,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🧣', description: '거리에서 오래 쓴 담요. 야간 체온 유지 및 수면 피로 회복 +20%.',
    tags: ['armor', 'homeless', 'blanket'],
    defense: 1,
    warmthBonus: 5,
    sleepFatigueMult: 1.2,
    dismantle: [
      { definitionId: 'cloth', qty: 2, chance: 0.7 },
      { definitionId: 'cloth_scrap', qty: 3, chance: 0.5 },
    ],
  },

  newspaper_bundle: {
    id: 'newspaper_bundle', name: '신문지 뭉치', type: 'consumable', subtype: 'fuel',
    rarity: 'common', weight: 0.4,
    defaultDurability: 1, defaultContamination: 0,
    icon: '📰', description: '쌓아둔 신문지. 캠프파이어 불쏘시개 3회분으로 사용 가능.',
    tags: ['fuel', 'homeless', 'kindling'],
    kindlingUses: 3,
    dismantle: [],
  },

  box_cutter: {
    id: 'box_cutter', name: '박스커터', type: 'weapon', subtype: 'knife',
    rarity: 'common', weight: 0.15,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🔪', description: '거리에서 흔히 보는 박스커터. 위력은 약하지만 가볍고 소음이 적다.',
    tags: ['weapon', 'knife', 'blade', 'homeless'],
    damage: [2, 4],
    noiseMult: 0.7,
    dismantle: [
      { definitionId: 'sharp_blade', qty: 1, chance: 0.4 },
      { definitionId: 'plastic', qty: 1, chance: 0.5 },
    ],
  },

  broken_bottle: {
    id: 'broken_bottle', name: '깨진 유리병', type: 'weapon', subtype: 'knife',
    rarity: 'common', weight: 0.2,
    defaultDurability: 3, defaultContamination: 0,
    icon: '🍾', description: '깨진 유리병. 1~2번 찌르면 부서진다. 출혈 유발.',
    tags: ['weapon', 'blade', 'homeless', 'disposable'],
    damage: [3, 6],
    bleedChance: 0.25,
    dismantle: [{ definitionId: 'glass_shard', qty: 2, chance: 0.6 }],
  },

  // ─── 셰프 전용 희귀 식재료 (10) ──────────────────────────────────
  // 윤재혁 셰프 전용 고급 요리 재료 — 특별 레시피·팀 사기 부스트용

  truffle: {
    id: 'truffle', name: '송로버섯', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍄', stackable: true, maxStack: 3,
    description: '암시장에서 흘러나온 서양 송로버섯. 셰프가 다루면 최상의 풍미를 낸다.',
    onConsume: { nutrition: 20, morale: 15 },
    tags: ['food', 'rare_ingredient'],
    dismantle: [],
  },

  korean_beef_premium: {
    id: 'korean_beef_premium', name: '한우 특등급', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥩', stackable: true, maxStack: 3,
    description: '폐점한 한우 전문점 냉동고에서 구한 특등급 한우. 감염 위험 있음.',
    onConsume: { nutrition: 55, morale: 12, infection: 6 },
    tags: ['food', 'rare_ingredient', 'meat', 'raw'],
    dismantle: [],
  },

  matsutake_mushroom: {
    id: 'matsutake_mushroom', name: '송이버섯', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍄', stackable: true, maxStack: 5,
    description: '은평 외곽 소나무 군락에서 채집한 송이버섯. 강한 향과 약리 효과.',
    onConsume: { nutrition: 15, morale: 10 },
    tags: ['food', 'rare_ingredient', 'mushroom'],
    dismantle: [],
  },

  abalone: {
    id: 'abalone', name: '전복', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐚', stackable: true, maxStack: 5,
    description: '호텔 수족관에서 살려 가져온 살아있는 전복. 죽으면 상한다.',
    onConsume: { nutrition: 25, morale: 8, infection: 4 },
    tags: ['food', 'rare_ingredient', 'seafood', 'raw'],
    dismantle: [],
  },

  king_crab: {
    id: 'king_crab', name: '킹크랩', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🦀', stackable: true, maxStack: 3,
    description: '수산시장 냉장고 깊숙이 남아있던 러시아산 킹크랩. 팀 사기 대폭 상승.',
    onConsume: { nutrition: 40, morale: 18, infection: 5 },
    tags: ['food', 'rare_ingredient', 'seafood', 'raw'],
    dismantle: [],
  },

  ginseng_6years: {
    id: 'ginseng_6years', name: '6년근 인삼', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌱', stackable: true, maxStack: 3,
    description: '금산 직송 6년근 인삼. 약용 효능이 뛰어나 절망 회복에도 쓰인다.',
    onConsume: { nutrition: 10, morale: 12, fatigue: -15 },
    tags: ['food', 'rare_ingredient', 'herb'],
    dismantle: [],
  },

  wild_honey: {
    id: 'wild_honey', name: '야생 꿀', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍯', stackable: true, maxStack: 5,
    description: '북한산 자락 양봉장이 버려진 자리에서 수확한 야생 꿀. 방부 효과도 있다.',
    onConsume: { nutrition: 20, morale: 8 },
    tags: ['food', 'rare_ingredient'],
    dismantle: [],
  },

  caviar_local: {
    id: 'caviar_local', name: '대체 캐비어', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥚', stackable: true, maxStack: 5,
    description: '한강 철갑상어 양식장에서 급히 염장해 가져온 대체 캐비어. 짠맛이 강하다.',
    onConsume: { nutrition: 15, morale: 10 },
    tags: ['food', 'rare_ingredient', 'seafood'],
    dismantle: [],
  },

  wagyu_scrap: {
    id: 'wagyu_scrap', name: '와규 스크랩', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥩', stackable: true, maxStack: 5,
    description: '일식당 냉장고에서 구한 와규 자투리. 작지만 제대로 구우면 풍미가 뛰어나다.',
    onConsume: { nutrition: 30, morale: 10, infection: 5 },
    tags: ['food', 'rare_ingredient', 'meat', 'raw'],
    dismantle: [],
  },

  saffron_dried: {
    id: 'saffron_dried', name: '건조 사프란', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌸', stackable: true, maxStack: 3,
    description: '호텔 향신료 창고에서 회수한 건조 사프란. 한 꼬집으로 요리의 격을 높인다.',
    onConsume: { nutrition: 5, morale: 8 },
    tags: ['food', 'rare_ingredient', 'spice'],
    dismantle: [],
  },

  // ─── 셰프 특별 요리 결과물 (5) ──────────────────────────────────

  gourmet_steak: {
    id: 'gourmet_steak', name: '고메 스테이크', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥩', stackable: true, maxStack: 3,
    description: '와규 스크랩을 소금과 허브로 밑간해 완벽한 미디엄으로 구운 스테이크. 사기 대폭 상승.',
    onConsume: { nutrition: 60, morale: 30, hp: 10 },
    tags: ['edible', 'food', 'cooked', 'gourmet'],
    dismantle: [],
  },

  traditional_feast: {
    id: 'traditional_feast', name: '한상차림', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍱', stackable: true, maxStack: 3,
    description: '야생 꿀, 인삼, 쌀, 허브를 조화시킨 전통 한상차림. 동료들의 사기를 한껏 끌어올린다.',
    onConsume: { nutrition: 70, morale: 25, hp: 10, fatigue: -10 },
    tags: ['edible', 'food', 'cooked', 'gourmet', 'companion_boost'],
    companionMoraleBoost: 20,
    dismantle: [],
  },

  truffle_risotto: {
    id: 'truffle_risotto', name: '송로 리조또', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍚', stackable: true, maxStack: 3,
    description: '송로버섯을 듬뿍 넣고 끓인 리조또. 섭취 후 일정 시간 감염 저항이 상승한다.',
    onConsume: { nutrition: 50, morale: 18, infectionResistBuff: { amount: 0.1, duration: 3 } },
    tags: ['edible', 'food', 'cooked', 'gourmet'],
    dismantle: [],
  },

  seafood_platter: {
    id: 'seafood_platter', name: '해산물 플래터', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍤', stackable: true, maxStack: 3,
    description: '전복·킹크랩·사프란을 조합한 호화 플래터. HP 회복 폭이 크다.',
    onConsume: { nutrition: 55, morale: 20, hp: 40 },
    tags: ['edible', 'food', 'cooked', 'gourmet'],
    dismantle: [],
  },

  special_soup: {
    id: 'special_soup', name: '원기 회복탕', type: 'consumable', subtype: 'food',
    rarity: 'epic', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍲', stackable: true, maxStack: 3,
    description: '송이·인삼·정수된 물로 푹 고아낸 약선탕. 깊은 절망도 씻어낸다.',
    onConsume: { nutrition: 40, morale: 35, hp: 15, cureDespair: true },
    tags: ['edible', 'food', 'cooked', 'gourmet', 'despair_cure'],
    dismantle: [],
  },

  // ─── 개조된 장비 (Upgraded Equipment) ──────────────────────────
  // 기계공 특성 & 범용 — 기존 장비를 소비해 상위 버전으로 교체
  // 무기 6 + 방어구 5 + 도구 4 = 15 items

  // ── 무기 개조 (6) ──
  iron_pipe_reinforced: {
    id: 'iron_pipe_reinforced', name: '강화 철봉', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.3,
    defaultDurability: 104, defaultContamination: 0,
    icon: '🔧', description: '보강된 철봉. 위력 +20%, 내구도 +30%.',
    tags: ['weapon', 'melee', 'upgraded'],
    weaponType: 'blunt',
    combat: { damage: [14, 24], accuracy: 0.78, noiseOnUse: 5, durabilityLoss: 3, critChance: 0.10, critMultiplier: 1.5 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'duct_tape',   qty: 1, chance: 0.5 },
    ],
  },

  sharpened_knife_plus: {
    id: 'sharpened_knife_plus', name: '연마된 칼', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 85, defaultContamination: 0,
    icon: '🗡️', description: '숫돌로 날을 세밀히 연마한 칼. 위력 +15%, 치명타 +5%.',
    tags: ['weapon', 'melee', 'silent', 'upgraded'],
    weaponType: 'blade',
    combat: { damage: [16, 25], accuracy: 0.82, noiseOnUse: 1, durabilityLoss: 5, critChance: 0.30, critMultiplier: 1.8 },
    dismantle: [
      { definitionId: 'sharp_blade', qty: 1, chance: 0.8 },
      { definitionId: 'leather',     qty: 1, chance: 0.5 },
    ],
  },

  reinforced_bat_plus: {
    id: 'reinforced_bat_plus', name: '정밀 강화 배트', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.1,
    defaultDurability: 84, defaultContamination: 0,
    icon: '⚾', description: '못과 철판으로 보강한 배트. 위력 +25%, 내구도 +40%.',
    tags: ['weapon', 'melee', 'upgraded'],
    weaponType: 'blunt',
    combat: { damage: [16, 28], accuracy: 0.75, noiseOnUse: 5, durabilityLoss: 2, critChance: 0.18, critMultiplier: 1.8 },
    dismantle: [
      { definitionId: 'wood',        qty: 1, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.7 },
      { definitionId: 'nail',        qty: 3, chance: 0.7 },
    ],
  },

  machete_plus: {
    id: 'machete_plus', name: '출혈 마체테', type: 'weapon', subtype: 'melee',
    rarity: 'rare', weight: 0.7,
    defaultDurability: 75, defaultContamination: 0,
    icon: '🗡️', description: '톱니를 새긴 마체테. 위력 +20%, 출혈 확률 +10%.',
    tags: ['weapon', 'melee', 'upgraded'],
    weaponType: 'blade',
    combat: {
      damage: [22, 36], accuracy: 0.82, noiseOnUse: 4, durabilityLoss: 4, critChance: 0.22, critMultiplier: 1.9,
      statusInflict: { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -4 }, chance: 0.35 },
    },
    dismantle: [
      { definitionId: 'sharp_blade', qty: 1, chance: 0.8 },
      { definitionId: 'leather',     qty: 1, chance: 0.6 },
    ],
  },

  spear_plus: {
    id: 'spear_plus', name: '관통 창', type: 'weapon', subtype: 'melee',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🏹', description: '강철 촉을 단 창. 위력 +25%, 최대 2명 관통 유지.',
    tags: ['weapon', 'melee', 'upgraded'],
    weaponType: 'blade',
    multiTarget: 2,
    combat: { damage: [25, 40], accuracy: 0.68, noiseOnUse: 3, durabilityLoss: 4, critChance: 0.20, critMultiplier: 2.5 },
    dismantle: [
      { definitionId: 'wood',        qty: 1, chance: 0.8 },
      { definitionId: 'sharp_blade', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
  },

  crossbow_plus: {
    id: 'crossbow_plus', name: '정밀 석궁', type: 'weapon', subtype: 'ranged',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 75, defaultContamination: 0,
    icon: '🏹', description: '조준 장치를 교체한 석궁. 위력 +20%, 명중률 +10%.',
    tags: ['weapon', 'ranged', 'silent', 'upgraded'],
    weaponType: 'bullet',
    combat: { damage: [31, 48], accuracy: 0.82, noiseOnUse: 3, durabilityLoss: 2, requiresAmmo: 'crossbow_bolt', critChance: 0.25, critMultiplier: 2.2 },
    dismantle: [
      { definitionId: 'wood',   qty: 2, chance: 0.8 },
      { definitionId: 'spring', qty: 1, chance: 0.7 },
      { definitionId: 'rope',   qty: 1, chance: 0.7 },
    ],
  },

  // ── 방어구 개조 (5) ──
  tactical_vest_plus: {
    id: 'tactical_vest_plus', name: '강화 전술조끼', type: 'armor', subtype: 'vest',
    rarity: 'rare', weight: 2.3,
    defaultDurability: 117, defaultContamination: 0,
    icon: '🦺', description: '방탄 플레이트를 추가한 전술조끼. 방어력 +2, 내구도 +30%.',
    tags: ['armor', 'vest', 'upgraded'],
    onWear: { damageReduction: 0.35 },
    dismantle: [
      { definitionId: 'leather',     qty: 2, chance: 0.7 },
      { definitionId: 'cloth',       qty: 1, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
    ],
  },

  helmet_plus: {
    id: 'helmet_plus', name: '강화 헬멧', type: 'armor', subtype: 'head',
    rarity: 'rare', weight: 1.1,
    defaultDurability: 85, defaultContamination: 0,
    icon: '⛑️', description: '충격 흡수 패드를 장착한 헬멧. 방어력 +1, 치명타 저항 +15%.',
    tags: ['armor', 'head', 'upgraded'],
    onWear: { critReduction: 0.45, damageReduction: 0.05 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'leather',     qty: 1, chance: 0.5 },
      { definitionId: 'rubber',      qty: 1, chance: 0.5 },
    ],
  },

  combat_boots_plus: {
    id: 'combat_boots_plus', name: '경량 전투화', type: 'armor', subtype: 'boots',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 95, defaultContamination: 0,
    icon: '🪖', description: '경량 고무 밑창을 교체한 전투화. 체력 소모 -10%.',
    tags: ['armor', 'boots', 'upgraded'],
    onWear: { damageReduction: 0.05, critReduction: 0.10, fatigueMult: 0.90 },
    dismantle: [
      { definitionId: 'leather', qty: 2, chance: 0.8 },
      { definitionId: 'rubber',  qty: 2, chance: 0.6 },
    ],
  },

  work_gloves_plus: {
    id: 'work_gloves_plus', name: '정밀 작업장갑', type: 'armor', subtype: 'hands',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 65, defaultContamination: 0,
    icon: '🧤', description: '정밀 가공 패치를 덧댄 작업장갑. 제작 성공률 +5%.',
    tags: ['armor', 'hands', 'upgraded'],
    onWear: { infectionMult: 0.80, craftSuccessBonus: 0.05 },
    dismantle: [
      { definitionId: 'leather',     qty: 1, chance: 0.7 },
      { definitionId: 'cloth_scrap', qty: 2, chance: 0.8 },
    ],
  },

  raincoat_plus: {
    id: 'raincoat_plus', name: '방사선 차폐 우비', type: 'armor', subtype: 'clothing',
    rarity: 'uncommon', weight: 0.7,
    defaultDurability: 75, defaultContamination: 0,
    icon: '🌧️', description: '납판을 내장한 우비. 방사선 저항 +15%.',
    tags: ['armor', 'clothing', 'upgraded'],
    onWear: { radiationMult: 0.55, contaminationMult: 0.75 },
    dismantle: [
      { definitionId: 'cloth',  qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 2, chance: 0.6 },
    ],
  },

  // ── 도구 개조 (4) ──
  pipe_wrench_master: {
    id: 'pipe_wrench_master', name: '장인 파이프렌치', type: 'tool', subtype: 'utility',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '정밀 가공된 파이프렌치. 제작 속도 +20%.',
    tags: ['tool', 'upgraded'],
    combat: { damage: [5, 10], accuracy: 0.78, noiseOnUse: 3, durabilityLoss: 2, critChance: 0.12, critMultiplier: 1.5 },
    onUse: { craftSpeedBonus: 0.20 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.9 },
      { definitionId: 'spring',      qty: 1, chance: 0.5 },
    ],
  },

  flashlight_plus: {
    id: 'flashlight_plus', name: '장시간 손전등', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🔦', description: '대용량 배터리를 장착한 손전등. 발견 확률 +25%, 사용 시간 +50%.',
    tags: ['tool', 'exploration', 'light', 'upgraded'],
    onUse: { exploreBonus: 25 },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.8 },
      { definitionId: 'plastic',          qty: 1, chance: 0.8 },
      { definitionId: 'wire',             qty: 1, chance: 0.6 },
    ],
  },

  compass_advanced: {
    id: 'compass_advanced', name: '고급 나침반', type: 'tool', subtype: 'navigation',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧭', description: '자기장 센서가 결합된 나침반. 숨겨진 장소 2곳을 드러내고 조우 확률을 줄인다.',
    tags: ['tool', 'navigation', 'upgraded'],
    onUse: { encounterReduction: 0.15, revealHiddenLocations: 2 },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.6 },
    ],
  },

  binoculars_pro: {
    id: 'binoculars_pro', name: '프로 쌍안경', type: 'tool', subtype: 'utility',
    rarity: 'rare', weight: 0.4,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔭', description: '정밀 연마된 고배율 쌍안경. 조우 예측 +1회 추가.',
    tags: ['tool', 'utility', 'scouting', 'upgraded'],
    onUse: { scoutBonus: 2 },
    dismantle: [
      { definitionId: 'glass_shard', qty: 2, chance: 0.8 },
      { definitionId: 'plastic',     qty: 1, chance: 0.8 },
    ],
  },

  // ─── 헬기 제작 전용 부품 (7) ──────────────────────────────────
  // 기계공 B3 경로 최종 엔딩 — 아버지의 R22 설계도

  aviation_alloy: {
    id: 'aviation_alloy', name: '항공용 합금', type: 'material', subtype: 'metal',
    rarity: 'rare', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛩️', description: '고철을 용융·단조해 만든 경량 고강도 합금. 로터 블레이드와 동체 프레임에 쓰인다.',
    tags: ['material', 'metal', 'aviation'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.6 }],
  },

  rotor_blade: {
    id: 'rotor_blade', name: '로터 블레이드', type: 'material', subtype: 'aviation_part',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌀', description: '항공용 합금으로 정밀 가공한 주회전익. 대칭 정밀도 0.5mm 이내. 2개 한 쌍.',
    tags: ['material', 'aviation', 'rotor'],
    dismantle: [{ definitionId: 'aviation_alloy', qty: 1, chance: 0.4 }],
  },

  piston_engine: {
    id: 'piston_engine', name: '피스톤 엔진', type: 'material', subtype: 'aviation_part',
    rarity: 'epic', weight: 12.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚙️', description: '라이커밍 O-320 방식 4기통 피스톤 엔진. 가솔린 연소식. 헬기 동력원.',
    tags: ['material', 'aviation', 'engine'],
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.5 },
      { definitionId: 'electronic_parts', qty: 2, chance: 0.5 },
    ],
  },

  avionics_module: {
    id: 'avionics_module', name: '항공 전자 모듈', type: 'material', subtype: 'aviation_part',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📟', description: '점화·계기·자세 제어 통합 회로. ECU + 고도계 + 나침반.',
    tags: ['material', 'aviation', 'electronic'],
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.6 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
    ],
  },

  tail_rotor_assembly: {
    id: 'tail_rotor_assembly', name: '꼬리 로터 조립체', type: 'material', subtype: 'aviation_part',
    rarity: 'rare', weight: 2.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪛', description: '꼬리 로터 + 드라이브 샤프트. 안티 토크 장치. 없으면 기체가 회전한다.',
    tags: ['material', 'aviation', 'rotor'],
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.5 },
      { definitionId: 'rubber', qty: 1, chance: 0.5 },
    ],
  },

  fuselage_frame: {
    id: 'fuselage_frame', name: '동체 프레임', type: 'material', subtype: 'aviation_part',
    rarity: 'epic', weight: 8.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛸', description: '조종석+엔진 베드+꼬리 빔 통합 프레임. R22 소형 헬기 규격.',
    tags: ['material', 'aviation', 'structure'],
    dismantle: [
      { definitionId: 'aviation_alloy', qty: 2, chance: 0.4 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.5 },
    ],
  },

  avgas_drum: {
    id: 'avgas_drum', name: '항공 가솔린 드럼', type: 'special', subtype: 'resource',
    rarity: 'epic', weight: 20.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛢️', description: '100LL 항공용 가솔린. 일반 자동차 연료통 5개로 정제 가능. 납 첨가 고옥탄가.',
    tags: ['special', 'fuel', 'aviation'],
    dismantle: [],
  },
};

export default ITEMS_MISC;
