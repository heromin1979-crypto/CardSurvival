// === BLUEPRINTS: ADVANCED (확장 크래프팅 체인) ===
// 전자부품 · 배관 · 석조 · 금속가공 · 요리 · 의료 · 방어구 · 물정제 · 에너지 · 도구 · 낚시
// Skill gates: Lv1 ~ Lv10

const BLUEPRINTS_ADVANCED = {

  // ══════════════════════════════════════════════════════════════
  //  Phase 1A: 전자부품 체인 (crafting Lv2→Lv10)
  // ══════════════════════════════════════════════════════════════

  extract_copper_wire: {
    id: 'extract_copper_wire', name: '구리선 추출', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2 } },
    description: '회로기판에서 구리선을 분리해낸다.',
    output: [{ definitionId: 'copper_wire', qty: 3 }],
    requiredTools: [],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '구리선 분리', tpCost: 1,
      requiredItems: [
        { definitionId: 'circuit_board', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  extract_microchip: {
    id: 'extract_microchip', name: '마이크로칩 추출', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 4 } },
    description: '정밀 도구로 기판에서 칩을 추출한다.',
    output: [{ definitionId: 'microchip', qty: 2 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 4 },
    stages: [{
      stageIndex: 0, label: '칩 추출', tpCost: 2,
      requiredItems: [
        { definitionId: 'circuit_board', qty: 2 },
        { definitionId: 'glass_shard',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  wind_copper_coil: {
    id: 'wind_copper_coil', name: '구리 코일 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 5 } },
    description: '구리선을 촘촘히 감아 전자기 코일을 만든다.',
    output: [{ definitionId: 'copper_coil', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 5 },
    stages: [{
      stageIndex: 0, label: '코일 감기', tpCost: 2,
      requiredItems: [
        { definitionId: 'copper_wire',  qty: 3 },
        { definitionId: 'scrap_metal',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  assemble_circuit_module: {
    id: 'assemble_circuit_module', name: '회로 모듈 조립', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 6 } },
    description: '칩과 배선을 조합하여 범용 회로 모듈을 만든다.',
    output: [{ definitionId: 'circuit_module', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 6 },
    stages: [{
      stageIndex: 0, label: '회로 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'microchip', qty: 2 },
        { definitionId: 'wire',      qty: 2 },
        { definitionId: 'plastic',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  build_electric_motor: {
    id: 'build_electric_motor', name: '전기 모터 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 8 } },
    description: '코일과 금속으로 소형 전기 모터를 조립한다.',
    output: [{ definitionId: 'electric_motor', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 8 },
    stages: [{
      stageIndex: 0, label: '모터 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'copper_coil',  qty: 2 },
        { definitionId: 'scrap_metal',  qty: 3 },
        { definitionId: 'wire',         qty: 2 },
        { definitionId: 'spring',       qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  build_generator_core: {
    id: 'build_generator_core', name: '발전기 코어 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 10 } },
    description: '모터와 회로를 결합하여 발전 핵심부를 완성한다.',
    output: [{ definitionId: 'generator_core', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 10 },
    stages: [{
      stageIndex: 0, label: '코어 조립', tpCost: 4,
      requiredItems: [
        { definitionId: 'electric_motor',  qty: 1 },
        { definitionId: 'circuit_module',  qty: 1 },
        { definitionId: 'refined_metal',   qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 1B: 배관/파이프 체인 (building Lv5→Lv10)
  // ══════════════════════════════════════════════════════════════

  make_pipe_assembly: {
    id: 'make_pipe_assembly', name: '배관 조립', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 5 } },
    description: '파이프를 연결하여 배관 구조를 만든다.',
    output: [{ definitionId: 'pipe_assembly', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 5 },
    stages: [{
      stageIndex: 0, label: '배관 연결', tpCost: 2,
      requiredItems: [
        { definitionId: 'iron_pipe',  qty: 3 },
        { definitionId: 'wire',       qty: 2 },
        { definitionId: 'duct_tape',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  build_water_tower: {
    id: 'build_water_tower', name: '급수탑 건설', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 8 } },
    description: '높은 위치에 물을 저장하는 급수탑을 세운다.',
    output: [{ definitionId: 'water_tower', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 8 },
    stages: [{
      stageIndex: 0, label: '급수탑 건설', tpCost: 4,
      requiredItems: [
        { definitionId: 'pipe_assembly', qty: 2 },
        { definitionId: 'wood_plank',    qty: 4 },
        { definitionId: 'rope',          qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  build_plumbing_system: {
    id: 'build_plumbing_system', name: '배관 시스템 건설', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 10, crafting: 6 } },
    description: '정수기와 배관을 연결한 급수 체계를 구축한다.',
    output: [{ definitionId: 'plumbing_system', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 10, crafting: 6 },
    stages: [{
      stageIndex: 0, label: '배관 시스템 구축', tpCost: 4,
      requiredItems: [
        { definitionId: 'pipe_assembly',   qty: 3 },
        { definitionId: 'water_purifier',  qty: 1 },
        { definitionId: 'rubber',          qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  improve_pipe_wrench: {
    id: 'improve_pipe_wrench', name: '파이프렌치 개량', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 7 } },
    description: '파이프렌치에 강철 보강재를 추가한다.',
    output: [{ definitionId: 'pipe_wrench_improved', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 7 },
    stages: [{
      stageIndex: 0, label: '렌치 개량', tpCost: 2,
      requiredItems: [
        { definitionId: 'pipe_wrench',  qty: 1 },
        { definitionId: 'steel_plate',  qty: 1 },
        { definitionId: 'leather',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_pipe_shotgun: {
    id: 'make_pipe_shotgun', name: '파이프 산탄총', category: 'weapon',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 8 } },
    description: '파이프와 스프링으로 조잡하지만 위력적인 산탄총을 만든다.',
    output: [{ definitionId: 'pipe_shotgun', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 8 },
    stages: [{
      stageIndex: 0, label: '산탄총 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'iron_pipe', qty: 1 },
        { definitionId: 'spring',    qty: 2 },
        { definitionId: 'wood',      qty: 1 },
        { definitionId: 'nail',      qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 1C: 석조/콘크리트 체인 (building Lv4→Lv9)
  // ══════════════════════════════════════════════════════════════

  make_mortar_mix: {
    id: 'make_mortar_mix', name: '모르타르 제조', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { building: 4 } },
    description: '자갈과 모래를 물로 반죽하여 결합재를 만든다.',
    output: [{ definitionId: 'mortar_mix', qty: 2 }],
    requiredTools: [],
    requiredSkills: { building: 4 },
    stages: [{
      stageIndex: 0, label: '반죽 혼합', tpCost: 2,
      requiredItems: [
        { definitionId: 'pebble',       qty: 4 },
        { definitionId: 'sand',         qty: 2 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_brick: {
    id: 'make_brick', name: '벽돌 제조', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { building: 5 } },
    description: '모르타르를 불에 구워 단단한 벽돌을 만든다.',
    output: [{ definitionId: 'brick', qty: 2 }],
    requiredTools: ['campfire'],
    requiredSkills: { building: 5 },
    stages: [{
      stageIndex: 0, label: '벽돌 소성', tpCost: 2,
      requiredItems: [
        { definitionId: 'mortar_mix', qty: 1 },
        { definitionId: 'charcoal',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_concrete_block: {
    id: 'make_concrete_block', name: '콘크리트 블록 제조', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { building: 6 } },
    description: '모르타르에 고철을 넣어 강화 블록을 만든다.',
    output: [{ definitionId: 'concrete_block', qty: 2 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 6 },
    stages: [{
      stageIndex: 0, label: '블록 성형', tpCost: 3,
      requiredItems: [
        { definitionId: 'mortar_mix',  qty: 2 },
        { definitionId: 'scrap_metal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  build_brick_furnace: {
    id: 'build_brick_furnace', name: '벽돌 화로 건설', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 7 } },
    description: '벽돌로 고온 화로를 쌓는다. 합금 제련이 가능하다.',
    output: [{ definitionId: 'brick_furnace', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 7 },
    stages: [{
      stageIndex: 0, label: '화로 건설', tpCost: 4,
      requiredItems: [
        { definitionId: 'brick',       qty: 6 },
        { definitionId: 'scrap_metal', qty: 2 },
        { definitionId: 'iron_pipe',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  build_reinforced_wall: {
    id: 'build_reinforced_wall', name: '강화 벽 건설', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 9 } },
    description: '콘크리트와 강철로 견고한 방벽을 세운다.',
    output: [{ definitionId: 'reinforced_wall', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 9 },
    stages: [{
      stageIndex: 0, label: '벽 건설', tpCost: 4,
      requiredItems: [
        { definitionId: 'concrete_block', qty: 4 },
        { definitionId: 'steel_plate',    qty: 2 },
        { definitionId: 'wire',           qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 1D: 고급 금속 (armorcraft/crafting Lv10)
  // ══════════════════════════════════════════════════════════════

  forge_armor_plate: {
    id: 'forge_armor_plate', name: '강철 장갑판 단조', category: 'armor',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 10 } },
    description: '강철판을 단조하여 장갑판을 만든다.',
    output: [{ definitionId: 'armor_plate', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { armorcraft: 10 },
    stages: [{
      stageIndex: 0, label: '장갑판 단조', tpCost: 3,
      requiredItems: [
        { definitionId: 'steel_plate', qty: 2 },
        { definitionId: 'leather',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  forge_steel_tool_head: {
    id: 'forge_steel_tool_head', name: '공구머리 단조', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 10 } },
    description: '강철을 단조하여 범용 공구 머리를 만든다.',
    output: [{ definitionId: 'steel_tool_head', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 10 },
    stages: [{
      stageIndex: 0, label: '공구머리 단조', tpCost: 2,
      requiredItems: [
        { definitionId: 'steel_plate',   qty: 1 },
        { definitionId: 'refined_metal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2A: 요리 체인 (cooking Lv3→Lv7)
  // ══════════════════════════════════════════════════════════════

  cook_raw_meat: {
    id: 'cook_raw_meat', name: '고기 굽기', category: 'food',
    description: '날고기를 불에 구워 먹을 수 있게 만든다.',
    output: [{ definitionId: 'cooked_meat', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '굽기', tpCost: 2,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  cook_meat_stew: {
    id: 'cook_meat_stew', name: '고기 스튜', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3 } },
    description: '고기와 약초를 푹 끓여 스튜를 만든다.',
    output: [{ definitionId: 'meat_stew', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 3 },
    stages: [{
      stageIndex: 0, label: '스튜 조리', tpCost: 2,
      requiredItems: [
        { definitionId: 'boiled_water', qty: 1 },
        { definitionId: 'raw_meat',     qty: 1 },
        { definitionId: 'herb',         qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  grind_flour: {
    id: 'grind_flour', name: '밀가루 제분', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 4 } },
    description: '야생 밀을 빻아 거친 밀가루를 만든다.',
    output: [{ definitionId: 'flour', qty: 2 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 4 },
    stages: [{
      stageIndex: 0, label: '제분', tpCost: 2,
      requiredItems: [
        { definitionId: 'wild_wheat', qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  brew_rice_wine: {
    id: 'brew_rice_wine', name: '막걸리 담그기', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 4 } },
    description: '밥과 약초를 발효시켜 막걸리를 빚는다.',
    output: [{ definitionId: 'rice_wine', qty: 1 }],
    requiredTools: [],
    requiredSkills: { cooking: 4 },
    stages: [{
      stageIndex: 0, label: '발효', tpCost: 2,
      requiredItems: [
        { definitionId: 'cooked_rice',  qty: 2 },
        { definitionId: 'herb',         qty: 1 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_bread_dough: {
    id: 'make_bread_dough', name: '빵 반죽', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 5 } },
    description: '밀가루와 물을 섞어 반죽한다.',
    output: [{ definitionId: 'bread_dough', qty: 2 }],
    requiredTools: [],
    requiredSkills: { cooking: 5 },
    stages: [{
      stageIndex: 0, label: '반죽', tpCost: 1,
      requiredItems: [
        { definitionId: 'flour',        qty: 2 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_vinegar: {
    id: 'make_vinegar', name: '식초 제조', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 5 } },
    description: '막걸리를 더 발효시켜 식초를 만든다.',
    output: [{ definitionId: 'vinegar', qty: 1 }],
    requiredTools: [],
    requiredSkills: { cooking: 5 },
    stages: [{
      stageIndex: 0, label: '초산 발효', tpCost: 1,
      requiredItems: [
        { definitionId: 'rice_wine', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  cook_bibimbap: {
    id: 'cook_bibimbap', name: '비빔밥', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 5 } },
    description: '스튜와 밥을 비벼 영양 가득한 비빔밥을 만든다.',
    output: [{ definitionId: 'bibimbap', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 5 },
    stages: [{
      stageIndex: 0, label: '비빔밥 조리', tpCost: 2,
      requiredItems: [
        { definitionId: 'meat_stew',   qty: 1 },
        { definitionId: 'cooked_rice', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  bake_bread: {
    id: 'bake_bread', name: '빵 굽기', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 6 } },
    description: '반죽을 불에 구워 빵을 만든다.',
    output: [{ definitionId: 'baked_bread', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 6 },
    stages: [{
      stageIndex: 0, label: '빵 굽기', tpCost: 2,
      requiredItems: [
        { definitionId: 'bread_dough', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_pickled_food: {
    id: 'make_pickled_food', name: '절임 음식', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 6 } },
    description: '식초에 재료를 절여 보존 식품을 만든다.',
    output: [{ definitionId: 'pickled_food', qty: 2 }],
    requiredTools: [],
    requiredSkills: { cooking: 6 },
    stages: [{
      stageIndex: 0, label: '절임', tpCost: 2,
      requiredItems: [
        { definitionId: 'vinegar',  qty: 1 },
        { definitionId: 'herb',     qty: 1 },
        { definitionId: 'raw_meat', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_sandwich: {
    id: 'make_sandwich', name: '샌드위치 만들기', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 7 } },
    description: '빵에 고기와 채소를 넣어 완성한다.',
    output: [{ definitionId: 'sandwich', qty: 1 }],
    requiredTools: [],
    requiredSkills: { cooking: 7 },
    stages: [{
      stageIndex: 0, label: '샌드위치 조리', tpCost: 1,
      requiredItems: [
        { definitionId: 'baked_bread',  qty: 1 },
        { definitionId: 'cooked_meat',  qty: 1 },
        { definitionId: 'herb',         qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2A-2: 보존 체인 (cooking Lv4→Lv6)
  // ══════════════════════════════════════════════════════════════

  salt_meat: {
    id: 'salt_meat', name: '고기 절임', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 4 } },
    description: '소금으로 고기를 절여 부패를 늦춘다.',
    output: [{ definitionId: 'salted_meat', qty: 1 }],
    requiredTools: [],
    requiredSkills: { cooking: 4 },
    stages: [{
      stageIndex: 0, label: '소금 절임', tpCost: 2,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 1 },
        { definitionId: 'salt',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  smoke_meat: {
    id: 'smoke_meat', name: '고기 훈제', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 5 } },
    description: '소금에 절인 고기를 연기로 훈제한다.',
    output: [{ definitionId: 'smoked_meat', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 5 },
    stages: [{
      stageIndex: 0, label: '훈제', tpCost: 2,
      requiredItems: [
        { definitionId: 'salted_meat', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  smoke_fish: {
    id: 'smoke_fish', name: '생선 훈제', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 4 } },
    description: '잡은 생선을 연기로 훈제하여 보존한다.',
    output: [{ definitionId: 'smoked_fish', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 4 },
    stages: [{
      stageIndex: 0, label: '생선 훈제', tpCost: 2,
      requiredItems: [
        { definitionId: 'raw_fish', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  preserve_ration: {
    id: 'preserve_ration', name: '보존 식량 제조', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 6 } },
    description: '훈제 고기를 밀봉하여 장기 보존 식량을 만든다.',
    output: [{ definitionId: 'preserved_ration', qty: 1 }],
    requiredTools: [],
    requiredSkills: { cooking: 6 },
    stages: [{
      stageIndex: 0, label: '밀봉 포장', tpCost: 1,
      requiredItems: [
        { definitionId: 'smoked_meat', qty: 1 },
        { definitionId: 'plastic',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2B: 의료 체인 (medicine Lv3→Lv7)
  // ══════════════════════════════════════════════════════════════

  grind_herb_medical: {
    id: 'grind_herb_medical', name: '약초 정밀 분쇄', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 3 } },
    description: '약초를 곱게 빻아 가루로 만든다.',
    output: [{ definitionId: 'herb_powder', qty: 3 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 3 },
    stages: [{
      stageIndex: 0, label: '분쇄', tpCost: 1,
      requiredItems: [
        { definitionId: 'herb', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_crude_medicine: {
    id: 'make_crude_medicine', name: '조제약 제조', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 4 } },
    description: '약초 가루를 물에 녹여 기본 약을 만든다.',
    output: [{ definitionId: 'crude_medicine', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 4 },
    stages: [{
      stageIndex: 0, label: '조제', tpCost: 2,
      requiredItems: [
        { definitionId: 'herb_powder',  qty: 2 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_scalpel: {
    id: 'make_scalpel', name: '메스 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 4 } },
    description: '날카로운 칼과 와이어로 정밀 수술 도구를 만든다.',
    output: [{ definitionId: 'scalpel', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 4 },
    stages: [{
      stageIndex: 0, label: '메스 제작', tpCost: 2,
      requiredItems: [
        { definitionId: 'sharp_blade', qty: 1 },
        { definitionId: 'wire',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_anesthetic: {
    id: 'make_anesthetic', name: '마취제 제조', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 5 } },
    description: '약초 추출물로 통증을 억제하는 마취제를 만든다.',
    output: [{ definitionId: 'anesthetic', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 5 },
    stages: [{
      stageIndex: 0, label: '마취제 추출', tpCost: 2,
      requiredItems: [
        { definitionId: 'herb_powder',       qty: 3 },
        { definitionId: 'alcohol_solution',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_detox: {
    id: 'make_detox', name: '해독제 제조', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 5 } },
    description: '약초와 숯으로 독소를 중화하는 해독제를 만든다.',
    output: [{ definitionId: 'detox_potion', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 5 },
    stages: [{
      stageIndex: 0, label: '해독제 조제', tpCost: 2,
      requiredItems: [
        { definitionId: 'herb_powder',     qty: 2 },
        { definitionId: 'charcoal',        qty: 1 },
        { definitionId: 'purified_water',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ── Sprint 4: 의사 특화 의료 체인 (herb → extract → serum → broad_antibiotic) ──

  brew_herbal_extract: {
    id: 'brew_herbal_extract', name: '약초 추출액 제조', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 2 } },
    description: '약초를 달여 기초 추출액을 만든다. 의사의 손길이 필요한 첫 단계.',
    output: [{ definitionId: 'herbal_extract', qty: 2 }],
    requiredTools: ['campfire'],
    requiredSkills: { medicine: 2 },
    stages: [{
      stageIndex: 0, label: '달이기', tpCost: 1,
      requiredItems: [
        { definitionId: 'herb',         qty: 2 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  concentrate_serum: {
    id: 'concentrate_serum', name: '농축 혈청 정제', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 4 } },
    description: '약초 추출액을 정제·농축해 혈청으로 만든다. 의사만의 공정.',
    output: [{ definitionId: 'concentrated_serum', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 4 },
    stages: [{
      stageIndex: 0, label: '정제 농축', tpCost: 2,
      requiredItems: [
        { definitionId: 'herbal_extract',    qty: 2 },
        { definitionId: 'alcohol_solution',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  synth_broad_antibiotic: {
    id: 'synth_broad_antibiotic', name: '광범위 항생제 합성', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 6 } },
    description: '농축 혈청과 항생제를 결합해 다양한 감염원에 유효한 광범위 항생제를 합성한다.',
    output: [{ definitionId: 'broad_antibiotic', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 6 },
    stages: [{
      stageIndex: 0, label: '합성', tpCost: 3,
      requiredItems: [
        { definitionId: 'concentrated_serum', qty: 1 },
        { definitionId: 'antibiotics',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_sterile_kit: {
    id: 'make_sterile_kit', name: '멸균 키트 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 6 } },
    description: '소독된 수술 도구와 거즈를 한 세트로 묶는다.',
    output: [{ definitionId: 'sterile_kit', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 6 },
    stages: [{
      stageIndex: 0, label: '키트 조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'scalpel',     qty: 1 },
        { definitionId: 'gauze',       qty: 2 },
        { definitionId: 'antiseptic',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  purify_medicine: {
    id: 'purify_medicine', name: '정제약 제조', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 7 } },
    description: '조제약을 정제하여 효능을 높인다.',
    output: [{ definitionId: 'purified_medicine', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 9 },
    stages: [{
      stageIndex: 0, label: '약 정제', tpCost: 3,
      requiredItems: [
        { definitionId: 'crude_medicine',   qty: 2 },
        { definitionId: 'charcoal',         qty: 1 },
        { definitionId: 'distilled_water',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2C: 방어구 체인 (armorcraft Lv3→Lv9)
  // ══════════════════════════════════════════════════════════════

  weave_fabric: {
    id: 'weave_fabric', name: '천 직조', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 3 } },
    description: '실을 촘촘히 엮어 강한 천을 짠다.',
    output: [{ definitionId: 'woven_fabric', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 3 },
    stages: [{
      stageIndex: 0, label: '직조', tpCost: 2,
      requiredItems: [
        { definitionId: 'thread', qty: 5 },
      ],
      consumeAt: 'start',
    }],
  },

  make_dye: {
    id: 'make_dye', name: '염료 제조', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 4 } },
    description: '천연 재료로 위장 염료를 만든다.',
    output: [{ definitionId: 'dye', qty: 2 }],
    requiredTools: ['campfire'],
    requiredSkills: { armorcraft: 4 },
    stages: [{
      stageIndex: 0, label: '염료 추출', tpCost: 1,
      requiredItems: [
        { definitionId: 'cloth',    qty: 1 },
        { definitionId: 'herb',     qty: 1 },
        { definitionId: 'charcoal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  reinforce_fabric: {
    id: 'reinforce_fabric', name: '천 강화', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 5 } },
    description: '직조 천에 고무를 코팅하여 방탄 성능을 높인다.',
    output: [{ definitionId: 'reinforced_fabric', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 5 },
    stages: [{
      stageIndex: 0, label: '천 강화', tpCost: 2,
      requiredItems: [
        { definitionId: 'woven_fabric', qty: 2 },
        { definitionId: 'rubber',       qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_camo_cloth: {
    id: 'make_camo_cloth', name: '위장 천 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 5 } },
    description: '염료로 천을 위장 패턴으로 물들인다.',
    output: [{ definitionId: 'camo_cloth', qty: 2 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 5 },
    stages: [{
      stageIndex: 0, label: '위장 염색', tpCost: 1,
      requiredItems: [
        { definitionId: 'dye',   qty: 2 },
        { definitionId: 'cloth', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_plate_carrier: {
    id: 'make_plate_carrier', name: '플레이트 캐리어 제작', category: 'armor',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 6 } },
    description: '강화 천과 금속판을 조합하여 방탄 조끼를 만든다.',
    output: [{ definitionId: 'plate_carrier', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 6 },
    stages: [{
      stageIndex: 0, label: '조끼 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'reinforced_fabric', qty: 2 },
        { definitionId: 'scrap_metal',       qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_ghillie_suit: {
    id: 'make_ghillie_suit', name: '길리 수트 제작', category: 'armor',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 7 } },
    description: '위장 천으로 전신 은신복을 만든다.',
    output: [{ definitionId: 'ghillie_suit', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 7 },
    stages: [{
      stageIndex: 0, label: '수트 봉제', tpCost: 3,
      requiredItems: [
        { definitionId: 'camo_cloth', qty: 3 },
        { definitionId: 'thread',     qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_ballistic_weave: {
    id: 'make_ballistic_weave', name: '방탄직 제작', category: 'armor',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 9 } },
    description: '강화 천을 특수 직조하여 방탄 원단을 만든다.',
    output: [{ definitionId: 'ballistic_weave', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 9 },
    stages: [{
      stageIndex: 0, label: '방탄직 직조', tpCost: 3,
      requiredItems: [
        { definitionId: 'reinforced_fabric', qty: 2 },
        { definitionId: 'thread',            qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2D: 물 정제 체인
  // ══════════════════════════════════════════════════════════════

  settle_water: {
    id: 'settle_water', name: '물 침전', category: 'consumable',
    description: '오염된 물을 가만히 두어 불순물을 가라앉힌다.',
    output: [{ definitionId: 'settled_water', qty: 1 }],
    requiredTools: [],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '침전', tpCost: 1,
      requiredItems: [
        { definitionId: 'contaminated_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  distill_water: {
    id: 'distill_water', name: '물 증류', category: 'consumable',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 5 } },
    description: '끓인 물의 증기를 모아 순수한 증류수를 만든다.',
    output: [{ definitionId: 'distilled_water', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 5 },
    stages: [{
      stageIndex: 0, label: '증류', tpCost: 3,
      requiredItems: [
        { definitionId: 'boiled_water',  qty: 2 },
        { definitionId: 'empty_bottle',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  boil_settled_water: {
    id: 'boil_settled_water', name: '침전수 끓이기', category: 'consumable',
    description: '침전 처리한 물을 끓여 안전하게 만든다.',
    output: [{ definitionId: 'boiled_water', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '끓이기', tpCost: 1,
      requiredItems: [
        { definitionId: 'settled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_sterile_water: {
    id: 'make_sterile_water', name: '멸균수 제조', category: 'consumable',
    description: '증류수를 소독하여 의료용 멸균수를 만든다.',
    output: [{ definitionId: 'sterile_water', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 8 },
    stages: [{
      stageIndex: 0, label: '멸균 처리', tpCost: 2,
      requiredItems: [
        { definitionId: 'distilled_water', qty: 1 },
        { definitionId: 'antiseptic', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  improve_rain_collector: {
    id: 'improve_rain_collector', name: '빗물 수집기 개량', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 5 } },
    description: '빗물 수집기에 배관을 연결하여 효율을 높인다.',
    output: [{ definitionId: 'rain_collector_improved', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 5 },
    stages: [{
      stageIndex: 0, label: '수집기 개량', tpCost: 3,
      requiredItems: [
        { definitionId: 'rain_collector',  qty: 1 },
        { definitionId: 'pipe_assembly',   qty: 1 },
        { definitionId: 'rubber',          qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2E: 에너지 체인 (crafting/building Lv6→Lv10)
  // ══════════════════════════════════════════════════════════════

  make_power_cell: {
    id: 'make_power_cell', name: '파워 셀 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 10 } },
    description: '회로와 배터리를 결합하여 고효율 전력 장치를 만든다.',
    output: [{ definitionId: 'power_cell', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 10 },
    stages: [{
      stageIndex: 0, label: '셀 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'circuit_module', qty: 1 },
        { definitionId: 'battery',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  build_spotlight: {
    id: 'build_spotlight', name: '탐조등 건설', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 10 } },
    description: '강력한 조명 장치를 설치한다.',
    output: [{ definitionId: 'spotlight', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 10 },
    stages: [{
      stageIndex: 0, label: '탐조등 설치', tpCost: 2,
      requiredItems: [
        { definitionId: 'power_cell',  qty: 1 },
        { definitionId: 'glass_shard', qty: 2 },
        { definitionId: 'wire',        qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_spotlight_flashlight: {
    id: 'make_spotlight_flashlight', name: '강화 손전등', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 6 } },
    description: '손전등의 광원과 반사경을 개량한다.',
    output: [{ definitionId: 'spotlight_flashlight', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 6 },
    stages: [{
      stageIndex: 0, label: '손전등 개량', tpCost: 2,
      requiredItems: [
        { definitionId: 'flashlight',   qty: 1 },
        { definitionId: 'glass_shard',  qty: 1 },
        { definitionId: 'copper_wire',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2F: 도구 업그레이드
  // ══════════════════════════════════════════════════════════════

  make_lockpick_set: {
    id: 'make_lockpick_set', name: '락픽 세트 제작', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 5 } },
    description: '다양한 자물쇠에 대응하는 도구 세트를 만든다.',
    output: [{ definitionId: 'lockpick_set', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 5 },
    stages: [{
      stageIndex: 0, label: '세트 조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'lockpick',    qty: 1 },
        { definitionId: 'wire',        qty: 2 },
        { definitionId: 'scrap_metal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_fishing_rod_advanced: {
    id: 'make_fishing_rod_advanced', name: '낚싯대 개량', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { fishing: 8 } },
    description: '낚싯대를 강철과 스프링으로 보강한다.',
    output: [{ definitionId: 'fishing_rod_advanced', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { fishing: 8 },
    stages: [{
      stageIndex: 0, label: '낚싯대 보강', tpCost: 2,
      requiredItems: [
        { definitionId: 'fishing_rod',  qty: 1 },
        { definitionId: 'steel_plate',  qty: 1 },
        { definitionId: 'spring',       qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase 2G: 낚시 체인 (fishing Lv1→Lv10)
  // ══════════════════════════════════════════════════════════════

  prep_bait: {
    id: 'prep_bait', name: '낚시 미끼 준비', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { fishing: 1 } },
    description: '약초와 지렁이로 물고기를 유인하는 미끼를 만든다.',
    output: [{ definitionId: 'fishing_bait', qty: 2 }],
    requiredTools: [],
    requiredSkills: { fishing: 1 },
    stages: [{
      stageIndex: 0, label: '미끼 준비', tpCost: 1,
      requiredItems: [
        { definitionId: 'herb', qty: 1 },
        { definitionId: 'worm', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_fishing_net: {
    id: 'make_fishing_net', name: '투망 제작', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { fishing: 6 } },
    description: '실과 로프로 물고기를 잡는 그물을 엮는다.',
    output: [{ definitionId: 'fishing_net', qty: 1 }],
    requiredTools: [],
    requiredSkills: { fishing: 6 },
    stages: [{
      stageIndex: 0, label: '그물 엮기', tpCost: 3,
      requiredItems: [
        { definitionId: 'thread', qty: 5 },
        { definitionId: 'rope',   qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_crab_trap: {
    id: 'make_crab_trap', name: '통발 제작', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { fishing: 10 } },
    description: '파이프와 그물로 갑각류 포획 통발을 만든다.',
    output: [{ definitionId: 'crab_trap', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { fishing: 10 },
    stages: [{
      stageIndex: 0, label: '통발 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'iron_pipe',    qty: 2 },
        { definitionId: 'wire',         qty: 3 },
        { definitionId: 'fishing_net',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

};

export default BLUEPRINTS_ADVANCED;
