// === BLUEPRINT DEFINITIONS (35 recipes) ===
// consumeAt: 'start' | 'complete'
// requiredTools: [definitionId] — 보드에 설치된 구조물/도구 필요

const BLUEPRINTS = {

  // ══════════════════════════════════════════════════════════════
  //  구조물 (Structures)
  // ══════════════════════════════════════════════════════════════

  campfire: {
    id: 'campfire', name: '캠프파이어', category: 'structure',
    description: '온기와 요리를 제공한다. 소음 주의.',
    output: [{ definitionId: 'campfire', qty: 1 }],
    requiredTools: [],
    // Tier 0 — 무요구
    stages: [{
      stageIndex: 0, label: '화롯대 설치', tpCost: 1,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 1 },
        { definitionId: 'cloth', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  water_purifier: {
    id: 'water_purifier', name: '정수기', category: 'structure',
    description: '오염수를 자동으로 정수하는 장치.',
    output: [{ definitionId: 'water_purifier', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 3, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '골조 제작', tpCost: 4,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '필터 장착', tpCost: 2,
        requiredItems: [
          { definitionId: 'water_filter', qty: 1 },
          { definitionId: 'duct_tape', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  barricade: {
    id: 'barricade', name: '바리케이드', category: 'structure',
    description: '입구를 막아 조우 확률을 낮춘다.',
    output: [{ definitionId: 'barricade', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2 },
    stages: [{
      stageIndex: 0, label: '방어벽 설치', tpCost: 3,
      requiredItems: [
        { definitionId: 'wood', qty: 3 },
        { definitionId: 'nail', qty: 5 },
        { definitionId: 'wire', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  alarm_trap: {
    id: 'alarm_trap', name: '경보 트랩', category: 'structure',
    description: '적 접근 시 경보를 울린다.',
    output: [{ definitionId: 'alarm_trap', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2, crafting: 1 },
    stages: [{
      stageIndex: 0, label: '트랩 조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'electronic_parts', qty: 1 },
        { definitionId: 'wire', qty: 1 },
        { definitionId: 'empty_can', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  spike_trap: {
    id: 'spike_trap', name: '가시 트랩', category: 'structure',
    description: '적에게 자동으로 피해를 준다.',
    output: [{ definitionId: 'spike_trap', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { building: 3, weaponcraft: 1 },
    stages: [{
      stageIndex: 0, label: '트랩 제작', tpCost: 3,
      requiredItems: [
        { definitionId: 'iron_pipe', qty: 1 },
        { definitionId: 'nail', qty: 10 },
        { definitionId: 'wood', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  workbench: {
    id: 'workbench', name: '작업대', category: 'structure',
    description: '복잡한 제작을 가능하게 한다.',
    output: [{ definitionId: 'workbench', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 3, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '골조 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 5 },
          { definitionId: 'scrap_metal', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '마무리 조립', tpCost: 2,
        requiredItems: [
          { definitionId: 'rope', qty: 1 },
          { definitionId: 'nail', qty: 5 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  storage_box: {
    id: 'storage_box', name: '저장 상자', category: 'structure',
    description: '아이템을 안전하게 보관한다.',
    output: [{ definitionId: 'storage_box', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    stages: [{
      stageIndex: 0, label: '상자 제작', tpCost: 2,
      requiredItems: [
        { definitionId: 'wood', qty: 3 },
        { definitionId: 'nail', qty: 5 },
      ],
      consumeAt: 'start',
    }],
  },

  medical_station: {
    id: 'medical_station', name: '의무 거점', category: 'structure',
    description: 'TP당 HP 자동 회복. 감염 저항 강화.',
    output: [{ definitionId: 'medical_station', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 4, medicine: 2 },
    stages: [
      {
        stageIndex: 0, label: '거점 설치', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 2 },
          { definitionId: 'cloth', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '의료 장비 배치', tpCost: 2,
        requiredItems: [
          { definitionId: 'bandage', qty: 5 },
          { definitionId: 'first_aid_kit', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  garden: {
    id: 'garden', name: '텃밭', category: 'structure',
    description: '식량을 자급자족할 수 있는 텃밭.',
    output: [{ definitionId: 'garden', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '밭 고르기', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 3 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '씨앗 심기', tpCost: 2,
        requiredItems: [
          { definitionId: 'cloth', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  rain_collector: {
    id: 'rain_collector', name: '빗물 수집기', category: 'structure',
    description: '빗물을 모아 수분을 자급한다. 겨울에는 눈 녹인 물.',
    output: [{ definitionId: 'rain_collector', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    stages: [{
      stageIndex: 0, label: '수집기 설치', tpCost: 3,
      requiredItems: [
        { definitionId: 'empty_bottle', qty: 2 },
        { definitionId: 'cloth', qty: 1 },
        { definitionId: 'rope', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  재료 가공 (Material Processing)
  // ══════════════════════════════════════════════════════════════

  make_charcoal: {
    id: 'make_charcoal', name: '숯 만들기', category: 'material',
    description: '목재를 태워 숯을 만든다. 캠프파이어 필요.',
    output: [{ definitionId: 'charcoal', qty: 3 }],
    requiredTools: ['campfire'],
    // Tier 0 — 무요구
    stages: [{
      stageIndex: 0, label: '목재 소각', tpCost: 2,
      requiredItems: [{ definitionId: 'wood', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_charcoal_filter: {
    id: 'make_charcoal_filter', name: '숯 필터 제작', category: 'material',
    description: '숯과 천 조각으로 정수 필터를 만든다.',
    output: [{ definitionId: 'charcoal_filter', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 1 },
    stages: [{
      stageIndex: 0, label: '필터 조립', tpCost: 1,
      requiredItems: [
        { definitionId: 'charcoal', qty: 2 },
        { definitionId: 'cloth_scrap', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_cloth_scrap: {
    id: 'make_cloth_scrap', name: '천 조각 자르기', category: 'material',
    description: '천 한 장에서 조각 3개를 얻는다.',
    output: [{ definitionId: 'cloth_scrap', qty: 3 }],
    requiredTools: [],
    // Tier 0 — 무요구
    stages: [{
      stageIndex: 0, label: '천 재단', tpCost: 1,
      requiredItems: [{ definitionId: 'cloth', qty: 1 }],
      consumeAt: 'start',
    }],
  },

  make_gauze: {
    id: 'make_gauze', name: '거즈 제작', category: 'material',
    description: '천 조각을 가공해 거즈를 만든다.',
    output: [{ definitionId: 'gauze', qty: 2 }],
    requiredTools: [],
    requiredSkills: { crafting: 1 },
    stages: [{
      stageIndex: 0, label: '거즈 가공', tpCost: 1,
      requiredItems: [{ definitionId: 'cloth_scrap', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_sharp_blade: {
    id: 'make_sharp_blade', name: '날 가공', category: 'material',
    description: '고철을 갈아 날카로운 날을 만든다.',
    output: [{ definitionId: 'sharp_blade', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 2 },
    stages: [{
      stageIndex: 0, label: '날 연마', tpCost: 2,
      requiredItems: [{ definitionId: 'scrap_metal', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_iron_pipe: {
    id: 'make_iron_pipe', name: '철파이프 제작', category: 'material',
    description: '고철을 녹여 철파이프를 만든다.',
    output: [{ definitionId: 'iron_pipe', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '파이프 주조', tpCost: 2,
      requiredItems: [{ definitionId: 'scrap_metal', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_alcohol_solution: {
    id: 'make_alcohol_solution', name: '알코올 정제', category: 'material',
    description: '주류를 증류해 소독용 알코올을 얻는다.',
    output: [{ definitionId: 'alcohol_solution', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '증류', tpCost: 2,
      requiredItems: [{ definitionId: 'alcohol_drink', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  음료 / 식량 (Food & Drink)
  // ══════════════════════════════════════════════════════════════

  make_boiled_water: {
    id: 'make_boiled_water', name: '물 끓이기', category: 'food',
    description: '오염수를 끓여 살균한다. 캠프파이어 필요.',
    output: [{ definitionId: 'boiled_water', qty: 1 }],
    requiredTools: ['campfire'],
    // Tier 0 — 무요구
    stages: [{
      stageIndex: 0, label: '물 끓이기', tpCost: 1,
      requiredItems: [{ definitionId: 'contaminated_water', qty: 1 }],
      consumeAt: 'start',
    }],
  },

  make_purified_water: {
    id: 'make_purified_water', name: '물 정수', category: 'food',
    description: '숯 필터로 물을 완전히 정수한다.',
    output: [{ definitionId: 'purified_water', qty: 1 }],
    requiredTools: [],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '정수', tpCost: 1,
      requiredItems: [
        { definitionId: 'contaminated_water', qty: 1 },
        { definitionId: 'charcoal_filter', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  cook_noodles: {
    id: 'cook_noodles', name: '라면 조리', category: 'food',
    description: '끓인 물로 라면을 조리한다.',
    output: [{ definitionId: 'cooked_noodles', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '조리', tpCost: 1,
      requiredItems: [
        { definitionId: 'instant_noodles', qty: 1 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  cook_rice: {
    id: 'cook_rice', name: '밥 짓기', category: 'food',
    description: '끓인 물로 쌀밥을 짓는다.',
    output: [{ definitionId: 'cooked_rice', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 2 },
    stages: [{
      stageIndex: 0, label: '취사', tpCost: 2,
      requiredItems: [
        { definitionId: 'rice', qty: 1 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  의료 (Medical)
  // ══════════════════════════════════════════════════════════════

  wrap_bandage: {
    id: 'wrap_bandage', name: '붕대 제작', category: 'medical',
    description: '천 조각으로 붕대를 만든다.',
    output: [{ definitionId: 'bandage', qty: 2 }],
    requiredTools: [],
    // Tier 0 — 무요구
    stages: [{
      stageIndex: 0, label: '붕대 감기', tpCost: 1,
      requiredItems: [{ definitionId: 'cloth_scrap', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_first_aid_kit: {
    id: 'make_first_aid_kit', name: '구급키트 제작', category: 'medical',
    description: '붕대·소독약·거즈를 모아 구급키트를 만든다.',
    output: [{ definitionId: 'first_aid_kit', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2, medicine: 1 },
    stages: [{
      stageIndex: 0, label: '키트 조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'bandage', qty: 2 },
        { definitionId: 'antiseptic', qty: 1 },
        { definitionId: 'gauze', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_emergency_kit: {
    id: 'make_emergency_kit', name: '비상키트 제작', category: 'medical',
    description: '구급키트에 추가 약품을 더해 완전 비상키트를 만든다.',
    output: [{ definitionId: 'emergency_kit', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 3, medicine: 2 },
    stages: [{
      stageIndex: 0, label: '키트 패킹', tpCost: 3,
      requiredItems: [
        { definitionId: 'first_aid_kit', qty: 1 },
        { definitionId: 'painkiller', qty: 2 },
        { definitionId: 'antibiotics', qty: 1 },
        { definitionId: 'antiseptic', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  brew_herbal_tea: {
    id: 'brew_herbal_tea', name: '허브차 끓이기', category: 'medical',
    description: '비타민(약초)을 끓인 물에 우려 허브차를 만든다. 캠프파이어 필요.',
    output: [{ definitionId: 'herbal_tea', qty: 2 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 1, medicine: 1 },
    stages: [{
      stageIndex: 0, label: '차 우리기', tpCost: 1,
      requiredItems: [
        { definitionId: 'vitamins',     qty: 1 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_stamina_tonic: {
    id: 'make_stamina_tonic', name: '활력 강장제 제조', category: 'medical',
    description: '허브차를 알코올로 농축해 강장제를 만든다.',
    output: [{ definitionId: 'stamina_tonic', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 3, medicine: 1 },
    stages: [{
      stageIndex: 0, label: '성분 농축', tpCost: 2,
      requiredItems: [
        { definitionId: 'herbal_tea',       qty: 2 },
        { definitionId: 'alcohol_solution', qty: 1 },
        { definitionId: 'empty_bottle',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_battle_ration: {
    id: 'make_battle_ration', name: '전투 식량팩 제작', category: 'medical',
    description: '강장제·에너지바·건육을 압축 포장한 고성능 전투 식량.',
    output: [{ definitionId: 'battle_ration', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 3, crafting: 3 },
    stages: [{
      stageIndex: 0, label: '식량 압축 포장', tpCost: 3,
      requiredItems: [
        { definitionId: 'stamina_tonic', qty: 1 },
        { definitionId: 'energy_bar',    qty: 2 },
        { definitionId: 'dried_meat',    qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  무기 (Weapons)
  // ══════════════════════════════════════════════════════════════

  reinforced_bat: {
    id: 'reinforced_bat', name: '강화 배트', category: 'weapon',
    description: '못이 박혀 피해가 크게 증가한 배트.',
    output: [{ definitionId: 'reinforced_bat', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 2 },
    stages: [
      {
        stageIndex: 0, label: '못 박기', tpCost: 2,
        requiredItems: [
          { definitionId: 'baseball_bat', qty: 1 },
          { definitionId: 'scrap_metal', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '강화 마무리', tpCost: 1,
        requiredItems: [{ definitionId: 'duct_tape', qty: 1 }],
        consumeAt: 'start',
      },
    ],
  },

  make_spiked_pipe: {
    id: 'make_spiked_pipe', name: '가시파이프 제작', category: 'weapon',
    description: '철파이프에 못을 박아 출혈 무기를 만든다.',
    output: [{ definitionId: 'spiked_pipe', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '못 박기', tpCost: 2,
      requiredItems: [
        { definitionId: 'iron_pipe', qty: 1 },
        { definitionId: 'nail', qty: 5 },
        { definitionId: 'rope', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_spear: {
    id: 'make_spear', name: '창 제작', category: 'weapon',
    description: '목재 자루에 날을 달아 창을 만든다.',
    output: [{ definitionId: 'spear', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 2 },
    stages: [{
      stageIndex: 0, label: '창 제작', tpCost: 2,
      requiredItems: [
        { definitionId: 'wood', qty: 1 },
        { definitionId: 'rope', qty: 1 },
        { definitionId: 'sharp_blade', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_crossbow: {
    id: 'make_crossbow', name: '석궁 제작', category: 'weapon',
    description: '소음 없는 원거리 무기.',
    output: [{ definitionId: 'crossbow', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 4, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '활대 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 2 },
          { definitionId: 'rope', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '발사 기구 조립', tpCost: 2,
        requiredItems: [
          { definitionId: 'spring', qty: 1 },
          { definitionId: 'scrap_metal', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_crossbow_bolt: {
    id: 'make_crossbow_bolt', name: '석궁 화살 제작', category: 'weapon',
    description: '고철과 목재로 화살 5개를 만든다.',
    output: [{ definitionId: 'crossbow_bolt', qty: 5 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 2 },
    stages: [{
      stageIndex: 0, label: '화살 제작', tpCost: 1,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 1 },
        { definitionId: 'wood', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  molotov: {
    id: 'molotov', name: '화염병', category: 'weapon',
    description: '알코올과 천을 넣은 유리병.',
    output: [{ definitionId: 'molotov_cocktail', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 1 },
    stages: [{
      stageIndex: 0, label: '제조', tpCost: 1,
      requiredItems: [
        { definitionId: 'empty_bottle', qty: 1 },
        { definitionId: 'alcohol_solution', qty: 1 },
        { definitionId: 'cloth_scrap', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_nail_bomb: {
    id: 'make_nail_bomb', name: '못폭탄 제작', category: 'weapon',
    description: '빈 캔에 못과 화약을 채운다.',
    output: [{ definitionId: 'nail_bomb', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '폭탄 조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'empty_can', qty: 1 },
        { definitionId: 'nail', qty: 10 },
        { definitionId: 'gunpowder', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_smoke_bomb: {
    id: 'make_smoke_bomb', name: '연막탄 제작', category: 'weapon',
    description: '전자부품과 천으로 연막탄을 만든다.',
    output: [{ definitionId: 'smoke_bomb', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 2, crafting: 1 },
    stages: [{
      stageIndex: 0, label: '연막탄 조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'electronic_parts', qty: 1 },
        { definitionId: 'empty_can', qty: 1 },
        { definitionId: 'cloth', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  방어구 (Armor)
  // ══════════════════════════════════════════════════════════════

  make_helmet: {
    id: 'make_helmet', name: '헬멧 제작', category: 'armor',
    description: '고철과 가죽으로 보호 헬멧을 만든다.',
    output: [{ definitionId: 'helmet', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { armorcraft: 2 },
    stages: [{
      stageIndex: 0, label: '헬멧 성형', tpCost: 3,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 2 },
        { definitionId: 'cloth', qty: 1 },
        { definitionId: 'leather', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_raincoat: {
    id: 'make_raincoat', name: '우비 제작', category: 'armor',
    description: '천과 고무로 방수 우비를 만든다.',
    output: [{ definitionId: 'raincoat', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 2 },
    stages: [{
      stageIndex: 0, label: '우비 봉제', tpCost: 2,
      requiredItems: [
        { definitionId: 'cloth', qty: 3 },
        { definitionId: 'rubber', qty: 1 },
        { definitionId: 'thread', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_tactical_vest: {
    id: 'make_tactical_vest', name: '전술조끼 제작', category: 'armor',
    description: '방탄 소재로 된 전술조끼. 작업대 필요.',
    output: [{ definitionId: 'tactical_vest', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 4 },
    stages: [
      {
        stageIndex: 0, label: '소재 재단', tpCost: 3,
        requiredItems: [
          { definitionId: 'leather', qty: 2 },
          { definitionId: 'cloth', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '판금 삽입 및 마무리', tpCost: 2,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'duct_tape', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_hazmat_suit: {
    id: 'make_hazmat_suit', name: '방호복 제작', category: 'armor',
    description: '우비와 방독면을 결합한 완전 방호복.',
    output: [{ definitionId: 'hazmat_suit', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 5, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '방호 기초 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'raincoat', qty: 1 },
          { definitionId: 'rubber', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '밀폐 처리', tpCost: 2,
        requiredItems: [
          { definitionId: 'duct_tape', qty: 2 },
          { definitionId: 'gas_mask_filter', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  도구 (Tools)
  // ══════════════════════════════════════════════════════════════

  make_rope_ladder: {
    id: 'make_rope_ladder', name: '로프사다리 제작', category: 'tool',
    description: '고층 진입·탈출용 사다리.',
    output: [{ definitionId: 'rope_ladder', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 1 },
    stages: [{
      stageIndex: 0, label: '사다리 제작', tpCost: 2,
      requiredItems: [
        { definitionId: 'rope', qty: 2 },
        { definitionId: 'wood', qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  // ── 가방 ──────────────────────────────────────────────

  make_small_bag: {
    id: 'make_small_bag', name: '작은 가방 제작', category: 'tool',
    description: '천과 끈으로 소형 가방을 만든다. (+3칸)',
    output: [{ definitionId: 'small_bag', qty: 1 }],
    requiredTools: [],
    // Tier 0 — 무요구
    stages: [{
      stageIndex: 0, label: '가방 봉제', tpCost: 1,
      requiredItems: [
        { definitionId: 'cloth', qty: 2 },
        { definitionId: 'rope', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_backpack: {
    id: 'make_backpack', name: '배낭 제작', category: 'tool',
    description: '천과 가죽으로 든든한 배낭을 만든다. (+5칸)',
    output: [{ definitionId: 'backpack', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '배낭 제작', tpCost: 3,
      requiredItems: [
        { definitionId: 'cloth', qty: 3 },
        { definitionId: 'leather', qty: 1 },
        { definitionId: 'rope', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_duffel_bag: {
    id: 'make_duffel_bag', name: '더플백 제작', category: 'tool',
    description: '대형 수납 더플백. (+6칸)',
    output: [{ definitionId: 'duffel_bag', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '더플백 제작', tpCost: 4,
      requiredItems: [
        { definitionId: 'cloth', qty: 4 },
        { definitionId: 'rope', qty: 2 },
        { definitionId: 'leather', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_shield: {
    id: 'make_shield', name: '방패 제작', category: 'armor',
    description: '고철과 가죽으로 튼튼한 방패를 만든다.',
    output: [{ definitionId: 'shield', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { armorcraft: 3 },
    stages: [
      {
        stageIndex: 0, label: '판금 성형', tpCost: 3,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 4 },
          { definitionId: 'leather', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '손잡이 부착', tpCost: 1,
        requiredItems: [
          { definitionId: 'rope', qty: 1 },
          { definitionId: 'duct_tape', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },
};

export default BLUEPRINTS;
