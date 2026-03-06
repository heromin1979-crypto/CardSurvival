// === ITEMS: MISC (의료·도구·구조물·특수) ===
// 의료 10 + 도구 10 + 구조물 8 + 특수 6 = 34 items

const ITEMS_MISC = {

  // ─── 의료 (10) ────────────────────────────────────────────

  bandage: {
    id: 'bandage', name: '붕대', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🩹', description: '상처를 감아 출혈을 막는다.',
    onConsume: { hp: 15, infection: -5 },
    tags: ['medical', 'healing'],
    dismantle: [{ definitionId: 'cloth_scrap', qty: 2, chance: 0.8 }],
  },

  first_aid_kit: {
    id: 'first_aid_kit', name: '구급키트', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏥', description: '완전한 응급처치. HP, 감염 모두 치료.',
    onConsume: { hp: 50, infection: -30, morale: 10 },
    tags: ['medical', 'healing'],
    dismantle: [
      { definitionId: 'bandage', qty: 2, chance: 0.8 },
      { definitionId: 'antiseptic', qty: 1, chance: 0.6 },
      { definitionId: 'gauze', qty: 2, chance: 0.7 },
    ],
  },

  antiseptic: {
    id: 'antiseptic', name: '소독약', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '상처 감염을 예방. 감염 수치 감소.',
    onConsume: { infection: -20, hp: 5 },
    tags: ['medical', 'antiseptic'],
    dismantle: [],
  },

  painkiller: {
    id: 'painkiller', name: '진통제', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '통증 감소. HP 소폭 회복, 전투 집중력 향상.',
    onConsume: { hp: 10, morale: 10, fatigue: -10 },
    tags: ['medical', 'stimulant'],
    dismantle: [],
  },

  antibiotics: {
    id: 'antibiotics', name: '항생제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '박테리아 감염 치료. 감염 수치를 크게 낮춘다.',
    onConsume: { infection: -45 },
    tags: ['medical', 'antibiotic'],
    dismantle: [],
  },

  rad_blocker: {
    id: 'rad_blocker', name: '방사선차단제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☢️', description: '방사선을 대폭 감소. 고방사선 구역 생존 필수.',
    onConsume: { radiation: -40 },
    tags: ['medical', 'radiation'],
    dismantle: [],
  },

  splint: {
    id: 'splint', name: '부목', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🦴', description: '골절 등 중상 치료. 피로 감소 효과.',
    onConsume: { hp: 20, fatigue: -20 },
    tags: ['medical', 'healing'],
    dismantle: [
      { definitionId: 'wood', qty: 1, chance: 0.7 },
      { definitionId: 'cloth_scrap', qty: 2, chance: 0.8 },
    ],
  },

  surgery_kit: {
    id: 'surgery_kit', name: '수술키트', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔬', description: '외과 수술 도구 세트. 치명상 치료 가능.',
    onConsume: { hp: 80, infection: -50, radiation: -20 },
    tags: ['medical', 'healing', 'surgery'],
    dismantle: [
      { definitionId: 'antiseptic', qty: 2, chance: 0.7 },
      { definitionId: 'gauze', qty: 3, chance: 0.8 },
      { definitionId: 'sharp_blade', qty: 1, chance: 0.5 },
    ],
  },

  antidote: {
    id: 'antidote', name: '해독제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '독 상태이상 즉시 제거. 산성 공격에도 효과.',
    onConsume: { infection: -30, hp: 15 },
    tags: ['medical', 'antidote'],
    dismantle: [],
  },

  stimulant: {
    id: 'stimulant', name: '각성제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚡', description: '즉각적인 피로 회복. 전투 능력 일시 상승.',
    onConsume: { fatigue: -50, morale: 20, hp: 10 },
    tags: ['medical', 'stimulant'],
    dismantle: [],
  },

  // ─── 도구 (10) ────────────────────────────────────────────

  flashlight: {
    id: 'flashlight', name: '손전등', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔦', description: '어두운 공간 탐색 시 발견 확률 +20%.',
    tags: ['tool', 'exploration'],
    onUse: { exploreBonus: 20 },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'plastic', qty: 1, chance: 0.8 },
    ],
  },

  water_filter: {
    id: 'water_filter', name: '정수 필터', type: 'tool', subtype: 'crafting',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔩', description: '정수기 제작에 사용. 오염수를 정화.',
    tags: ['tool', 'craftable'],
    dismantle: [
      { definitionId: 'charcoal_filter', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
    ],
  },

  pipe_wrench: {
    id: 'pipe_wrench', name: '파이프렌치', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔧', description: '수리·제작 도구. 강화 무기 제작에 필요.',
    tags: ['tool'],
    combat: { damage: [4, 8], accuracy: 0.75, noiseOnUse: 3, durabilityLoss: 2, critChance: 0.10, critMultiplier: 1.5 },
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.9 }],
  },

  lockpick: {
    id: 'lockpick', name: '자물쇠따개', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🗝️', description: '잠긴 문을 개방. 탐색 가능 장소 확대.',
    tags: ['tool', 'utility'],
    onUse: { unlockBonus: 1 },
    dismantle: [{ definitionId: 'wire', qty: 1, chance: 0.8 }],
  },

  gas_mask: {
    id: 'gas_mask', name: '방독면', type: 'tool', subtype: 'protection',
    rarity: 'rare', weight: 0.8,
    defaultDurability: 80, defaultContamination: 0,
    icon: '😷', description: '유독 가스·오염 공기 차단. 필터 교체 필요.',
    tags: ['tool', 'protection'],
    onWear: { radiationMult: 0.50, infectionMult: 0.60 },
    dismantle: [
      { definitionId: 'rubber', qty: 1, chance: 0.7 },
      { definitionId: 'plastic', qty: 1, chance: 0.6 },
    ],
  },

  binoculars: {
    id: 'binoculars', name: '쌍안경', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.4,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🔭', description: '먼 거리 정찰. 위험도를 미리 파악 가능.',
    tags: ['tool', 'utility', 'scouting'],
    onUse: { scoutBonus: 1 },
    dismantle: [
      { definitionId: 'glass_shard', qty: 2, chance: 0.7 },
      { definitionId: 'plastic', qty: 1, chance: 0.8 },
    ],
  },

  radio: {
    id: 'radio', name: '무전기', type: 'tool', subtype: 'communication',
    rarity: 'rare', weight: 0.5,
    defaultDurability: 70, defaultContamination: 0,
    icon: '📻', description: '생존자 주파수 감지. 특수 이벤트 발생 가능.',
    tags: ['tool', 'communication'],
    onUse: { survivorSignal: true },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.8 },
      { definitionId: 'wire', qty: 1, chance: 0.7 },
    ],
  },

  lighter: {
    id: 'lighter', name: '라이터', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.05,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🔥', description: '불을 붙이는 도구. 캠프파이어 없이도 일부 조리 가능.',
    tags: ['tool', 'fire'],
    onUse: { fireStart: true },
    dismantle: [],
  },

  compass: {
    id: 'compass', name: '나침반', type: 'tool', subtype: 'navigation',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧭', description: '방향 감각 유지. 이동 시 조우 확률 소폭 감소.',
    tags: ['tool', 'navigation'],
    onUse: { encounterReduction: 0.10 },
    dismantle: [],
  },

  rope_ladder: {
    id: 'rope_ladder', name: '로프사다리', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🪜', description: '고층 진입 및 탈출용 사다리. 특수 탐색 가능.',
    tags: ['tool', 'utility', 'crafted'],
    onUse: { highGroundAccess: true },
    dismantle: [
      { definitionId: 'rope', qty: 2, chance: 0.8 },
      { definitionId: 'wood', qty: 1, chance: 0.6 },
    ],
  },

  // ─── 구조물 (8) ───────────────────────────────────────────

  campfire: {
    id: 'campfire', name: '캠프파이어', type: 'structure', subtype: 'heat',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🔥', description: '온도 회복, 요리, 정수에 사용. 소음 발생.',
    tags: ['structure', 'heat'],
    onTick: { temperature: 2, noise: 3 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.7 },
      { definitionId: 'cloth', qty: 1, chance: 0.5 },
    ],
  },

  water_purifier: {
    id: 'water_purifier', name: '정수기', type: 'structure', subtype: 'utility',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🚰', description: '오염수를 정수. 인접 물병 자동 정화.',
    tags: ['structure', 'crafted'],
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
    dismantle: [
      { definitionId: 'wood', qty: 3, chance: 0.8 },
      { definitionId: 'nail', qty: 5, chance: 0.6 },
    ],
  },

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
};

export default ITEMS_MISC;
