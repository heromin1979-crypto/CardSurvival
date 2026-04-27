// === ITEMS: TOOLS (도구 아이템) ===
// type: 'tool' 아이템 (가방 subtype:'bag' 제외)
// 일반 도구 + 채집 도구 + 낚시 도구 + 크래프팅 체인 도구 = 36항목

const ITEMS_TOOLS = {

  // ─── 일반 도구 (11) ────────────────────────────────────────

  flashlight: {
    id: 'flashlight', name: '손전등', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔦', description: '어두운 공간 탐색 시 발견 확률 +20%.',
    tags: ['tool', 'exploration', 'light'],
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
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 5, defaultContamination: 0,
    icon: '🔥', description: '불꽃을 만드는 도구. 내구도 1 소모당 불꽃 1회 생성. 연료가 다 떨어지면 못 쓴다. 희귀해진 세상에서는 소중히 아껴야 한다.',
    tags: ['tool', 'fire', 'light'],
    onUse: { fireStart: true, durabilityPerUse: 1 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
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

  whetstone: {
    id: 'whetstone', name: '숫돌', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🪨', description: '무기의 날을 세운다. 근접무기 데미지 강화에 사용.',
    tags: ['tool', 'utility'],
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

  // ─── 비밀 조합 결과물 — 도구 (4) ──────────────────────────

  fishing_rod: {
    id: 'fishing_rod', name: '낚싯대', type: 'tool', subtype: 'tool',
    rarity: 'uncommon', weight: 1.5, stackable: false, maxStack: 1,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🎣', description: '즉석 낚싯대. 한강 인접 구역에서 물고기를 잡을 수 있다.',
    tags: ['tool'], dismantle: [{ definitionId: 'rope', qty: 1, chance: 0.5 }],
  },
  torch: {
    id: 'torch', name: '횃불', type: 'tool', subtype: 'tool',
    rarity: 'common', weight: 0.8, stackable: false, maxStack: 1,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🔥', description: '나무와 천으로 만든 횃불. 어두운 곳에서 시야를 확보한다.',
    tags: ['tool', 'light'], dismantle: [],
  },
  survival_journal: {
    id: 'survival_journal', name: '생존 일지', type: 'tool', subtype: 'tool',
    rarity: 'uncommon', weight: 0.3, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📓', description: '기록은 생존의 증거. 매일 사용하면 트라우마·외로움 감소.',
    tags: ['tool', 'mental'], dismantle: [],
  },
  oil_lamp: {
    id: 'oil_lamp', name: '기름 램프', type: 'tool', subtype: 'tool',
    rarity: 'common', weight: 0.5, stackable: false, maxStack: 1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🏮', description: '깡통과 천으로 만든 조명. 야간 탐색 효율 증가.',
    tags: ['tool', 'light'], dismantle: [{ definitionId: 'empty_can', qty: 1, chance: 0.6 }],
  },

  // ─── 채집 도구 (7) ────────────────────────────────────────

  stone_knife: {
    id: 'stone_knife', name: '돌칼', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.3,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🔪', description: '부싯돌을 깨서 만든 원시 칼. 고기와 생선 손질에 사용. 내구도가 낮아 금방 닳는다.',
    tags: ['tool', 'cutting'],
    onUse: { durabilityPerUse: 1 },
  },

  kitchen_knife: {
    id: 'kitchen_knife', name: '부엌칼', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.25,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔪', description: '단조한 부엌칼. 돌칼보다 훨씬 오래 쓸 수 있다. 고기·생선·채소 손질에 최적.',
    tags: ['tool', 'cutting'],
    onUse: { durabilityPerUse: 1 },
  },

  mortar_pestle: {
    id: 'mortar_pestle', name: '절구', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🪨', description: '돌을 깎아 만든 절구와 절굿공이. 도토리·약초·마늘을 빻아 가루나 페이스트로 만든다.',
    tags: ['tool', 'processing'],
    onUse: { durabilityPerUse: 1 },
  },

  clay_pot: {
    id: 'clay_pot', name: '토기 냄비', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 1.2,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🫙', description: '흙으로 빚어 불에 구운 토기 냄비. 조리솥 거치대에 올리면 스튜와 발효식품을 만들 수 있다.',
    tags: ['tool', 'cooking'],
    onUse: { durabilityPerUse: 1 },
  },

  iron_pot: {
    id: 'iron_pot', name: '무쇠솥', type: 'tool', subtype: 'utility',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🍳', description: '야전 대장간에서 만든 무쇠솥. 대용량 조리가 가능하고 내구도가 매우 높다.',
    tags: ['tool', 'cooking'],
    onUse: { durabilityPerUse: 1 },
  },

  trowel: {
    id: 'trowel', name: '모종삽', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.3,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🌱', description: '씨앗을 심고 텃밭을 가꾸는 작은 삽. 텃밭 조성과 수확에 필수 도구.',
    tags: ['tool', 'farming'],
    onUse: { durabilityPerUse: 1 },
  },

  sickle: {
    id: 'sickle', name: '낫', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🌾', description: '고철로 만든 낫. 텃밭 수확 시 TP 소모를 줄여준다. 풀과 쐐기풀 채집에도 사용.',
    tags: ['tool', 'farming', 'cutting'],
    onUse: { durabilityPerUse: 1 },
  },

  // ─── 낚시 장비 (8) ────────────────────────────────────────

  fishing_rod_basic: {
    id: 'fishing_rod_basic', name: '기본 낚싯대', type: 'tool', subtype: 'fishing',
    rarity: 'common', weight: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🎣', stackable: false,
    description: '나뭇가지와 노끈으로 만든 간이 낚싯대.',
    tags: ['tool', 'fishing'],
    dismantle: [
      { definitionId: 'wood',  qty: 1, chance: 0.8 },
      { definitionId: 'cloth', qty: 1, chance: 0.6 },
    ],
  },

  fishing_rod_improved: {
    id: 'fishing_rod_improved', name: '개량 낚싯대', type: 'tool', subtype: 'fishing',
    rarity: 'uncommon', weight: 1,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🎣', stackable: false,
    description: '철사와 낚싯바늘로 보강한 낚싯대. 명중률 +15%.',
    tags: ['tool', 'fishing'],
    dismantle: [
      { definitionId: 'wood',       qty: 1, chance: 0.8 },
      { definitionId: 'wire',       qty: 1, chance: 0.6 },
      { definitionId: 'scrap_metal',qty: 1, chance: 0.5 },
    ],
  },

  fishing_rod_advanced: {
    id: 'fishing_rod_advanced', name: '개량 낚싯대', type: 'tool', subtype: 'fishing',
    rarity: 'uncommon', weight: 1.2,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🎣', description: '강철판과 스프링으로 보강한 낚싯대. 큰 물고기도 견딘다.',
    tags: ['tool', 'fishing', 'crafted'],
    dismantle: [
      { definitionId: 'steel_plate', qty: 1, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.5 },
      { definitionId: 'wire', qty: 1, chance: 0.7 },
    ],
  },

  automated_fish_trap: {
    id: 'automated_fish_trap', name: '자동 포획 장치', type: 'tool', subtype: 'fishing',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐟', description: '회로 모듈로 자동화된 어획 장치.',
    tags: ['tool', 'fishing', 'crafted'],
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
    ],
  },

  fishing_net: {
    id: 'fishing_net', name: '투망', type: 'tool', subtype: 'fishing',
    rarity: 'uncommon', weight: 0.8,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🕸️', description: '실과 로프로 엮은 그물. 물고기를 한 번에 잡을 수 있다.',
    tags: ['tool', 'fishing', 'crafted'],
    dismantle: [
      { definitionId: 'rope', qty: 2, chance: 0.7 },
      { definitionId: 'cloth', qty: 1, chance: 0.5 },
    ],
  },

  crab_trap: {
    id: 'crab_trap', name: '게 통발', type: 'tool', subtype: 'fishing',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🦀', description: '파이프와 그물로 만든 통발. 갑각류 포획에 특화.',
    tags: ['tool', 'fishing', 'crafted'],
    dismantle: [
      { definitionId: 'iron_pipe', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
    ],
  },

  master_angler_lure: {
    id: 'master_angler_lure', name: '명인의 루어', type: 'tool', subtype: 'fishing',
    rarity: 'legendary', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪝', description: '합금으로 정교하게 만든 루어. 전설의 물고기도 유혹한다.',
    tags: ['tool', 'fishing', 'crafted'],
    dismantle: [
      { definitionId: 'refined_metal', qty: 1, chance: 0.6 },
    ],
  },

  sterile_kit: {
    id: 'sterile_kit', name: '멸균 키트', type: 'tool', subtype: 'medical',
    rarity: 'uncommon', weight: 0.4,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🧰', description: '메스와 소독 도구가 갖춰진 의료 키트.',
    tags: ['tool', 'medical'],
    dismantle: [
      { definitionId: 'antiseptic', qty: 1, chance: 0.6 },
      { definitionId: 'cloth_scrap', qty: 2, chance: 0.7 },
    ],
  },

  // ─── 크래프팅 체인 확장 — 도구 (6) ────────────────────────

  scalpel: {
    id: 'scalpel', name: '수술용 메스', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔪', description: '날카로운 수술용 칼. 정밀한 절개가 가능하다.',
    tags: ['tool', 'medical', 'cutting'],
    dismantle: [
      { definitionId: 'sharp_blade', qty: 1, chance: 0.6 },
    ],
  },

  steel_tool_head: {
    id: 'steel_tool_head', name: '강철 공구머리', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚒️', description: '강철판으로 만든 범용 공구 머리. 다양한 도구에 장착 가능.',
    tags: ['tool', 'crafting'],
    dismantle: [
      { definitionId: 'steel_plate', qty: 1, chance: 0.7 },
    ],
  },

  spotlight_flashlight: {
    id: 'spotlight_flashlight', name: '강화 손전등', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔦', description: '더 밝고 오래가는 개량형 손전등.',
    tags: ['tool', 'exploration', 'light'],
    onUse: { exploreBonus: 35 },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'plastic', qty: 1, chance: 0.6 },
    ],
  },

  night_vision_goggles: {
    id: 'night_vision_goggles', name: '야시경', type: 'tool', subtype: 'utility',
    rarity: 'legendary', weight: 0.6,
    defaultDurability: 80, defaultContamination: 0,
    icon: '👓', description: '야간에도 선명한 시야를 제공하는 전자 고글.',
    tags: ['tool', 'exploration', 'light'],
    onUse: { exploreBonus: 50, nightVision: true },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 3, chance: 0.7 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.6 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
    ],
  },

  lockpick_set: {
    id: 'lockpick_set', name: '자물쇠 따기 세트', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔑', description: '여러 종류의 자물쇠를 딸 수 있는 도구 모음.',
    tags: ['tool', 'utility'],
    onUse: { unlockBonus: 2 },
    dismantle: [
      { definitionId: 'wire', qty: 2, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.6 },
    ],
  },

  electronic_lockpick: {
    id: 'electronic_lockpick', name: '전자 락픽', type: 'tool', subtype: 'utility',
    rarity: 'rare', weight: 0.4,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔐', description: '전자 잠금장치를 해제할 수 있는 첨단 도구.',
    tags: ['tool', 'utility'],
    onUse: { unlockBonus: 3, electronicUnlock: true },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.6 },
    ],
  },

  // ─── 트랩 (3) ─────────────────────────────────────────────
  // bait를 보드 같은 행에 놓으면 일정 TP 후 산 동물 산출 (TrapSystem 처리).
  // trapData: { targetCard, baitTags, tpToTrigger, successRate }

  rat_trap: {
    id: 'rat_trap', name: '쥐덫', type: 'tool', subtype: 'trap',
    rarity: 'common', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪤', description: '쥐를 산 채로 잡는 덫. 같은 행에 곡물 미끼를 놓으면 작동한다.',
    tags: ['tool', 'trap', 'small'],
    trapData: {
      targetCard: 'live_rat',
      baitTags: ['food', 'grain'],
      tpToTrigger: 8,
      successRate: 0.65,
    },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
    ],
  },

  pigeon_snare: {
    id: 'pigeon_snare', name: '비둘기 올가미', type: 'tool', subtype: 'trap',
    rarity: 'common', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪢', description: '비둘기를 잡는 올가미. 곡물 미끼 필요.',
    tags: ['tool', 'trap', 'small'],
    trapData: {
      targetCard: 'live_pigeon',
      baitTags: ['food', 'grain'],
      tpToTrigger: 6,
      successRate: 0.55,
    },
    dismantle: [
      { definitionId: 'rope', qty: 1, chance: 0.7 },
    ],
  },

  alley_pit_trap: {
    id: 'alley_pit_trap', name: '골목 함정', type: 'tool', subtype: 'trap',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🕳️', description: '떠돌이 동물(개·고양이)을 잡는 함정. 고기 미끼 필요.',
    tags: ['tool', 'trap', 'large'],
    trapData: {
      targetCard: 'live_stray_animal',
      baitTags: ['food', 'meat'],
      tpToTrigger: 12,
      successRate: 0.45,
    },
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.7 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
      { definitionId: 'nail', qty: 2, chance: 0.6 },
    ],
  },
};

export default ITEMS_TOOLS;
