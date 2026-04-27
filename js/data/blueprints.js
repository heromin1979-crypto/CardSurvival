// === BLUEPRINT DEFINITIONS (35 recipes) ===
// consumeAt: 'start' | 'complete'
// requiredTools: [definitionId] — 보드에 설치된 구조물/도구 필요

const BLUEPRINTS = {

  // ══════════════════════════════════════════════════════════════
  //  구조물 (Structures)
  // ══════════════════════════════════════════════════════════════

  campfire: {
    id: 'campfire', name: '캠프파이어', category: 'structure',
    description: '돌을 쌓고 장작을 얹어 피우는 화롯불. 불꽃(flame_token)으로 점화한다.',
    output: [{ definitionId: 'campfire', qty: 1 }],
    requiredTools: [],
    // Tier 0 — 무요구 (단, flame_token은 별도 획득 필요)
    stages: [
      {
        stageIndex: 0, label: '화롯대 준비', tpCost: 3,
        requiredItems: [
          { definitionId: 'pebble',     qty: 3 },
          { definitionId: 'wood_plank', qty: 2 },
          { definitionId: 'kindling',   qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '점화', tpCost: 1,
        requiredItems: [
          { definitionId: 'flame_token', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  campfire_temp: {
    id: 'campfire_temp', name: '임시 화톳불', category: 'structure',
    description: '긴급 상황에서 급조하는 화톳불. 3턴만 지속되며 비·눈에 바로 꺼진다.',
    output: [{ definitionId: 'campfire_temp', qty: 1 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '긴급 점화', tpCost: 1,
      requiredItems: [
        { definitionId: 'kindling',      qty: 2 },
        { definitionId: 'tinder_bundle', qty: 1 },
        { definitionId: 'flame_token',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  wind_stove: {
    id: 'wind_stove', name: '방풍 화로', category: 'structure',
    hidden: true, unlockConditions: { minDay: 10, minSkillLevel: { building: 2, crafting: 1 } },
    description: '고철과 돌로 만든 방풍 화로. 날씨에 영향받지 않으며 연료 효율이 높다.',
    output: [{ definitionId: 'wind_stove', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2, crafting: 1 },
    stages: [
      {
        stageIndex: 0, label: '화로 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'pebble',      qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '초기 점화', tpCost: 1,
        requiredItems: [
          { definitionId: 'flame_token', qty: 1 },
          { definitionId: 'kindling',    qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  water_purifier: {
    id: 'water_purifier', name: '정수기', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 3, crafting: 2 } },
    description: '오염수를 자동으로 정수하는 장치.',
    output: [{ definitionId: 'water_purifier', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 3, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '골조 제작', tpCost: 6,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '필터 장착', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { building: 2 } },
    description: '입구를 막아 조우 확률을 낮춘다.',
    output: [{ definitionId: 'barricade', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '골격 세우기', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 3 },
          { definitionId: 'nail', qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '와이어 강화', tpCost: 3,
        requiredItems: [
          { definitionId: 'wire', qty: 2 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  alarm_trap: {
    id: 'alarm_trap', name: '경보 트랩', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 2, crafting: 1 } },
    description: '적 접근 시 경보를 울린다.',
    output: [{ definitionId: 'alarm_trap', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2, crafting: 1 },
    stages: [{
      stageIndex: 0, label: '트랩 조립', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { building: 3, weaponcraft: 1 } },
    description: '적에게 자동으로 피해를 준다.',
    output: [{ definitionId: 'spike_trap', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { building: 3, weaponcraft: 1 },
    stages: [{
      stageIndex: 0, label: '트랩 제작', tpCost: 5,
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
    hidden: true, unlockConditions: { minDay: 15, minSkillLevel: { building: 3 } },
    description: '복잡한 제작을 가능하게 한다.',
    output: [{ definitionId: 'workbench', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 3, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '골조 제작', tpCost: 5,
        requiredItems: [
          { definitionId: 'wood', qty: 5 },
          { definitionId: 'scrap_metal', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '마무리 조립', tpCost: 3,
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
    hidden: true, unlockConditions: { minDay: 5, minSkillLevel: { building: 1 } },
    description: '아이템을 안전하게 보관한다.',
    output: [{ definitionId: 'storage_box', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    stages: [{
      stageIndex: 0, label: '상자 제작', tpCost: 3,
      requiredItems: [
        { definitionId: 'wood', qty: 3 },
        { definitionId: 'nail', qty: 5 },
      ],
      consumeAt: 'start',
    }],
  },

  medical_station: {
    id: 'medical_station', name: '의무 거점', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 4, medicine: 2 } },
    description: 'TP당 HP 자동 회복. 감염 저항 강화.',
    output: [{ definitionId: 'medical_station', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 4, medicine: 2 },
    stages: [
      {
        stageIndex: 0, label: '거점 설치', tpCost: 5,
        requiredItems: [
          { definitionId: 'wood', qty: 2 },
          { definitionId: 'cloth', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '의료 장비 배치', tpCost: 3,
        requiredItems: [
          { definitionId: 'bandage', qty: 5 },
          { definitionId: 'first_aid_kit', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  medical_clinic: {
    id: 'medical_clinic', name: '야전 의원', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 5, medicine: 4 } },
    description: '의무 거점보다 상위 의료 시설. HP 5, 감염 -2.',
    output: [{ definitionId: 'medical_clinic', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 5, medicine: 4 },
    stages: [
      {
        stageIndex: 0, label: '시설 골조 설치', tpCost: 6,
        requiredItems: [
          { definitionId: 'wood', qty: 3 },
          { definitionId: 'cloth', qty: 3 },
          { definitionId: 'scrap_metal', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '의료 장비 배치', tpCost: 5,
        requiredItems: [
          { definitionId: 'antiseptic', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  medical_ward: {
    id: 'medical_ward', name: '의료 병동', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 7, medicine: 6 } },
    description: '본격적인 의료 시설. HP 7, 감염 -3, 사기 +1.',
    output: [{ definitionId: 'medical_ward', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 7, medicine: 6 },
    stages: [
      {
        stageIndex: 0, label: '병동 골조 건설', tpCost: 8,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 3 },
          { definitionId: 'cloth', qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '의료 장비 설치', tpCost: 6,
        requiredItems: [
          { definitionId: 'first_aid_kit', qty: 2 },
          { definitionId: 'antibiotics', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  field_hospital: {
    id: 'field_hospital', name: '야전 병원', category: 'structure',
    hidden: true, unlockConditions: { minSkillLevel: { building: 10, medicine: 12 } },
    description: '최상급 야전 의료 시설. HP 15, 감염 -5, 피로 -1, 사기 +3.',
    output: [{ definitionId: 'field_hospital', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 10, medicine: 12 },
    stages: [
      {
        stageIndex: 0, label: '병원 골조 건설', tpCost: 9,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 5 },
          { definitionId: 'scrap_metal', qty: 5 },
          { definitionId: 'cloth', qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '수술실 설비', tpCost: 9,
        requiredItems: [
          { definitionId: 'surgery_kit', qty: 2 },
          { definitionId: 'antibiotics', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  garden: {
    id: 'garden', name: '텃밭', category: 'structure',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { building: 2 } },
    description: '식량을 자급자족할 수 있는 텃밭.',
    output: [{ definitionId: 'garden', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '밭 고르기', tpCost: 5,
        requiredItems: [
          { definitionId: 'wood', qty: 3 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '씨앗 심기', tpCost: 3,
        requiredItems: [
          { definitionId: 'cloth', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  rain_collector: {
    id: 'rain_collector', name: '빗물 수집기', category: 'structure',
    hidden: true, unlockConditions: { minDay: 5, minSkillLevel: { building: 1 } },
    description: '빗물을 모아 수분을 자급한다. 겨울에는 눈 녹인 물.',
    output: [{ definitionId: 'rain_collector', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    stages: [{
      stageIndex: 0, label: '수집기 설치', tpCost: 5,
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

  // ══════════════════════════════════════════════════════════════
  //  불 획득 경로 (Fire Acquisition — 6 paths)
  // ══════════════════════════════════════════════════════════════

  make_fire_by_lighter: {
    id: 'make_fire_by_lighter', name: '라이터로 불꽃 만들기', category: 'material',
    description: '라이터를 사용해 불꽃을 만든다. 라이터 내구도 1 감소.',
    output: [{ definitionId: 'flame_token', qty: 1 }],
    requiredTools: ['lighter'],
    stages: [{
      stageIndex: 0, label: '라이터 점화', tpCost: 1,
      requiredItems: [
        { definitionId: 'tinder_bundle', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_fire_by_matches: {
    id: 'make_fire_by_matches', name: '성냥으로 불꽃 만들기', category: 'material',
    description: '성냥개비 1개를 사용해 불꽃을 만든다. 비가 오면 사용 불가.',
    output: [{ definitionId: 'flame_token', qty: 1 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '성냥 점화', tpCost: 1,
      requiredItems: [
        { definitionId: 'matches',       qty: 1 },
        { definitionId: 'tinder_bundle', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_fire_by_flint: {
    id: 'make_fire_by_flint', name: '부싯돌로 불씨 만들기', category: 'material',
    description: '부싯돌을 고철에 부딪혀 불씨를 만든다. 라이터 없이 가능한 안정적인 방법.',
    output: [{ definitionId: 'fire_ember', qty: 1 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '부싯돌 타격', tpCost: 1,
      requiredItems: [
        { definitionId: 'firestone',  qty: 1 },
        { definitionId: 'scrap_metal',qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_fire_by_friction: {
    id: 'make_fire_by_friction', name: '마찰로 불씨 만들기', category: 'material',
    description: '마른 나무 막대를 판자에 비벼 불씨를 만든다. 가장 원시적인 방법. 체력 소모가 크다.',
    output: [{ definitionId: 'fire_ember', qty: 1 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '마찰 점화', tpCost: 3,
      requiredItems: [
        { definitionId: 'dry_wood_stick', qty: 2 },
        { definitionId: 'wood_plank',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_ember_to_flame: {
    id: 'make_ember_to_flame', name: '불씨를 불꽃으로 키우기', category: 'material',
    description: '불씨에 불쏘시개를 올려 불꽃을 만든다. 부싯돌·마찰 방법과 함께 사용.',
    output: [{ definitionId: 'flame_token', qty: 1 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '불씨 육성', tpCost: 1,
      requiredItems: [
        { definitionId: 'fire_ember',    qty: 1 },
        { definitionId: 'tinder_bundle', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  불 원자재 가공 (Fire Material Processing — 5 recipes)
  // ══════════════════════════════════════════════════════════════

  make_kindling: {
    id: 'make_kindling', name: '장작 패기', category: 'material',
    description: '목재를 쪼개 장작을 만든다.',
    output: [{ definitionId: 'kindling', qty: 4 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '장작 패기', tpCost: 1,
      requiredItems: [{ definitionId: 'wood', qty: 1 }],
      consumeAt: 'start',
    }],
  },

  make_kindling_from_log: {
    id: 'make_kindling_from_log', name: '통나무 쪼개기', category: 'material',
    hidden: true, unlockConditions: { minDay: 3 },
    description: '통나무를 쪼개 장작과 목재를 동시에 얻는다.',
    output: [
      { definitionId: 'kindling', qty: 6 },
      { definitionId: 'wood',     qty: 1 },
    ],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '통나무 분할', tpCost: 3,
      requiredItems: [{ definitionId: 'tree_log', qty: 1 }],
      consumeAt: 'start',
    }],
  },

  make_wood_plank: {
    id: 'make_wood_plank', name: '나무 판자 가공', category: 'material',
    description: '목재를 다듬어 나무 판자를 만든다. 화롯대 제작에 필요.',
    output: [{ definitionId: 'wood_plank', qty: 2 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '목재 다듬기', tpCost: 1,
      requiredItems: [{ definitionId: 'wood', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_tinder_from_leaves: {
    id: 'make_tinder_from_leaves', name: '마른 잎 불쏘시개 만들기', category: 'material',
    description: '마른 잎사귀를 모아 불쏘시개 뭉치를 만든다.',
    output: [{ definitionId: 'tinder_bundle', qty: 2 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '잎 묶기', tpCost: 1,
      requiredItems: [{ definitionId: 'dry_leaves', qty: 1 }],
      consumeAt: 'start',
    }],
  },

  make_tinder_from_grass: {
    id: 'make_tinder_from_grass', name: '마른 풀 불쏘시개 만들기', category: 'material',
    description: '마른 풀뭉치를 모아 불쏘시개를 만든다.',
    output: [{ definitionId: 'tinder_bundle', qty: 2 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '풀 묶기', tpCost: 1,
      requiredItems: [{ definitionId: 'dry_grass', qty: 1 }],
      consumeAt: 'start',
    }],
  },

  make_charcoal: {
    id: 'make_charcoal', name: '숯 만들기', category: 'material',
    hidden: true, unlockConditions: { minDay: 3 },
    description: '목재를 태워 숯을 만든다. 캠프파이어 필요.',
    output: [{ definitionId: 'charcoal', qty: 3 }],
    requiredTools: ['campfire'],
    // Tier 0 — 무요구
    stages: [{
      stageIndex: 0, label: '목재 소각', tpCost: 3,
      requiredItems: [{ definitionId: 'wood', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_charcoal_filter: {
    id: 'make_charcoal_filter', name: '숯 필터 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 1 } },
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

  craft_thread: {
    id: 'craft_thread', name: '실 잣기', category: 'material',
    description: '천 조각을 풀어 실을 잣는다.',
    output: [{ definitionId: 'thread', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 1 },
    stages: [{
      stageIndex: 0, label: '실 잣기', tpCost: 1,
      requiredItems: [{ definitionId: 'cloth_scrap', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  craft_cloth_from_thread: {
    id: 'craft_cloth_from_thread', name: '천 직조', category: 'material',
    description: '실 여러 가닥을 엮어 천 한 장을 만든다.',
    output: [{ definitionId: 'cloth', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 2 },
    stages: [{
      stageIndex: 0, label: '직조', tpCost: 2,
      requiredItems: [{ definitionId: 'thread', qty: 3 }],
      consumeAt: 'start',
    }],
  },

  craft_large_cloth: {
    id: 'craft_large_cloth', name: '큰 천 직조', category: 'material',
    description: '천을 잇대어 큰 천을 만든다. 담요·침낭·대형 의류 재료.',
    output: [{ definitionId: 'large_cloth', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 4 },
    stages: [{
      stageIndex: 0, label: '큰 천 직조', tpCost: 3,
      requiredItems: [
        { definitionId: 'cloth', qty: 2 },
        { definitionId: 'thread', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  dismantle_large_cloth: {
    id: 'dismantle_large_cloth', name: '큰 천 분해', category: 'material',
    description: '큰 천을 풀어 천 두 장을 회수한다.',
    output: [{ definitionId: 'cloth', qty: 2 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '분해', tpCost: 1,
      requiredItems: [{ definitionId: 'large_cloth', qty: 1 }],
      consumeAt: 'start',
    }],
  },

  make_gauze: {
    id: 'make_gauze', name: '거즈 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 1 } },
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2 } },
    description: '고철을 갈아 날카로운 날을 만든다.',
    output: [{ definitionId: 'sharp_blade', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 2 },
    stages: [{
      stageIndex: 0, label: '날 연마', tpCost: 3,
      requiredItems: [{ definitionId: 'scrap_metal', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_iron_pipe: {
    id: 'make_iron_pipe', name: '철파이프 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2 } },
    description: '고철을 녹여 철파이프를 만든다.',
    output: [{ definitionId: 'iron_pipe', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '파이프 주조', tpCost: 3,
      requiredItems: [{ definitionId: 'scrap_metal', qty: 2 }],
      consumeAt: 'start',
    }],
  },

  make_alcohol_solution: {
    id: 'make_alcohol_solution', name: '알코올 정제', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2 } },
    description: '주류를 증류해 소독용 알코올을 얻는다.',
    output: [{ definitionId: 'alcohol_solution', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '증류', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 1 } },
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
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 1 } },
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
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 2 } },
    description: '끓인 물로 쌀밥을 짓는다.',
    output: [{ definitionId: 'cooked_rice', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 2 },
    stages: [{
      stageIndex: 0, label: '취사', tpCost: 3,
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

  make_thermometer: {
    id: 'make_thermometer', name: '체온계 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 1 } },
    description: '유리조각과 금속으로 간이 체온계를 만든다.',
    output: [{ definitionId: 'thermometer', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 1 },
    stages: [{
      stageIndex: 0, label: '조립', tpCost: 1,
      requiredItems: [
        { definitionId: 'glass_shard', qty: 1 },
        { definitionId: 'scrap_metal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_stethoscope: {
    id: 'make_stethoscope', name: '청진기 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 3 } },
    description: '고무관과 금속으로 간이 청진기를 만든다.',
    output: [{ definitionId: 'stethoscope', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 3 },
    stages: [{
      stageIndex: 0, label: '조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'rubber',      qty: 1 },
        { definitionId: 'scrap_metal', qty: 2 },
        { definitionId: 'wire',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_diagnostic_kit: {
    id: 'make_diagnostic_kit', name: '진단 키트 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 5 } },
    description: '체온계·청진기·소독약을 하나로 묶은 종합 진단 키트.',
    output: [{ definitionId: 'diagnostic_kit', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 5 },
    stages: [{
      stageIndex: 0, label: '키트 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'thermometer', qty: 1 },
        { definitionId: 'stethoscope', qty: 1 },
        { definitionId: 'antiseptic',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_sling: {
    id: 'make_sling', name: '삼각건 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 2 } },
    description: '천 조각과 로프로 팔 골절용 삼각건을 만든다.',
    output: [{ definitionId: 'sling', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 2 },
    stages: [{
      stageIndex: 0, label: '재봉', tpCost: 2,
      requiredItems: [
        { definitionId: 'cloth_scrap', qty: 3 },
        { definitionId: 'rope',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_head_bandage: {
    id: 'make_head_bandage', name: '두부 압박붕대 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 2 } },
    description: '거즈와 붕대로 두부 전용 압박붕대를 만든다.',
    output: [{ definitionId: 'head_bandage', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 2 },
    stages: [{
      stageIndex: 0, label: '재봉', tpCost: 2,
      requiredItems: [
        { definitionId: 'bandage', qty: 1 },
        { definitionId: 'gauze',   qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_tourniquet: {
    id: 'make_tourniquet', name: '지혈대 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { medicine: 4 } },
    description: '로프와 천으로 동맥 출혈을 막는 지혈대를 만든다.',
    output: [{ definitionId: 'tourniquet', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 4 },
    stages: [{
      stageIndex: 0, label: '조립', tpCost: 2,
      requiredItems: [
        { definitionId: 'rope',        qty: 1 },
        { definitionId: 'cloth_scrap', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  make_first_aid_kit: {
    id: 'make_first_aid_kit', name: '구급키트 제작', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2, medicine: 1 } },
    description: '붕대·소독약·거즈를 모아 구급키트를 만든다.',
    output: [{ definitionId: 'first_aid_kit', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2, medicine: 1 },
    stages: [{
      stageIndex: 0, label: '키트 조립', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 3, medicine: 2 } },
    description: '구급키트에 추가 약품을 더해 완전 비상키트를 만든다.',
    output: [{ definitionId: 'emergency_kit', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 3, medicine: 2 },
    stages: [
      {
        stageIndex: 0, label: '기본 구성', tpCost: 3,
        requiredItems: [
          { definitionId: 'first_aid_kit', qty: 1 },
          { definitionId: 'antiseptic', qty: 1 },
          { definitionId: 'splint', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '약품 추가', tpCost: 3,
        requiredItems: [
          { definitionId: 'painkiller', qty: 2 },
          { definitionId: 'antibiotics', qty: 1 },
          { definitionId: 'gauze', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  brew_herbal_tea: {
    id: 'brew_herbal_tea', name: '허브차 끓이기', category: 'medical',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 1, medicine: 1 } },
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
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 3, medicine: 1 } },
    description: '허브차를 알코올로 농축해 강장제를 만든다.',
    output: [{ definitionId: 'stamina_tonic', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 3, medicine: 1 },
    stages: [{
      stageIndex: 0, label: '성분 농축', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3, crafting: 3 } },
    description: '강장제·에너지바·건육을 압축 포장한 고성능 전투 식량.',
    output: [{ definitionId: 'battle_ration', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 3, crafting: 3 },
    stages: [{
      stageIndex: 0, label: '식량 압축 포장', tpCost: 5,
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2 } },
    description: '못이 박혀 피해가 크게 증가한 배트.',
    output: [{ definitionId: 'reinforced_bat', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 2 },
    stages: [
      {
        stageIndex: 0, label: '못 박기', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 3 } },
    description: '철파이프에 못을 박아 출혈 무기를 만든다.',
    output: [{ definitionId: 'spiked_pipe', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '못 박기', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2 } },
    description: '목재 자루에 날을 달아 창을 만든다.',
    output: [{ definitionId: 'spear', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 2 },
    stages: [
      {
        stageIndex: 0, label: '자루 다듬기', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 2 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '촉 장착', tpCost: 3,
        requiredItems: [
          { definitionId: 'sharp_blade', qty: 1 },
          { definitionId: 'wire', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_crossbow: {
    id: 'make_crossbow', name: '석궁 제작', category: 'weapon',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 4, crafting: 2 } },
    description: '소음 없는 원거리 무기.',
    output: [{ definitionId: 'crossbow', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 4, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '활대 제작', tpCost: 5,
        requiredItems: [
          { definitionId: 'wood', qty: 2 },
          { definitionId: 'rope', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '발사 기구 조립', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2 } },
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 1 } },
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 3 } },
    description: '빈 캔에 못과 화약을 채운다.',
    output: [{ definitionId: 'nail_bomb', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '폭탄 조립', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2, crafting: 1 } },
    description: '전자부품과 천으로 연막탄을 만든다.',
    output: [{ definitionId: 'smoke_bomb', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 2, crafting: 1 },
    stages: [{
      stageIndex: 0, label: '연막탄 조립', tpCost: 3,
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

  make_warm_clothes: {
    id: 'make_warm_clothes', name: '방한복 제작', category: 'armor',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 4, crafting: 3 } },
    description: '혹한에서 체온 하락을 절반으로 줄이는 방한복. 작업대 + 고난도 봉제 기술 필요.',
    output: [{ definitionId: 'warm_clothes', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 4, crafting: 3 },
    stages: [
      {
        // 가죽을 두껍게 재단해 단열층을 만든다
        stageIndex: 0, label: '단열 내피 재단', tpCost: 3,
        requiredItems: [
          { definitionId: 'leather', qty: 3 },
          { definitionId: 'cloth', qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        // 실로 겹겹이 봉제, 로프를 충전재로 활용
        stageIndex: 1, label: '충전재 봉제', tpCost: 5,
        requiredItems: [
          { definitionId: 'thread', qty: 5 },
          { definitionId: 'cloth', qty: 2 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        // 외피 방수 처리 및 마감
        stageIndex: 2, label: '외피 방수 마감', tpCost: 5,
        requiredItems: [
          { definitionId: 'leather', qty: 1 },
          { definitionId: 'duct_tape', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_blanket: {
    id: 'craft_blanket', name: '담요 제작', category: 'armor',
    description: '큰 천을 누벼 담요를 만든다. 체온 유지에 도움.',
    output: [{ definitionId: 'blanket', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 3 },
    stages: [{
      stageIndex: 0, label: '담요 봉제', tpCost: 2,
      requiredItems: [
        { definitionId: 'large_cloth', qty: 1 },
        { definitionId: 'thread', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  craft_sleeping_bag: {
    id: 'craft_sleeping_bag', name: '침낭 제작', category: 'armor',
    description: '큰 천과 가죽으로 야외 숙면용 침낭을 만든다.',
    output: [{ definitionId: 'sleeping_bag', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { armorcraft: 5 },
    stages: [
      {
        stageIndex: 0, label: '겉천 누비기', tpCost: 3,
        requiredItems: [
          { definitionId: 'large_cloth', qty: 2 },
          { definitionId: 'thread', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '내피·바닥 부착', tpCost: 2,
        requiredItems: [
          { definitionId: 'leather', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_helmet: {
    id: 'make_helmet', name: '헬멧 제작', category: 'armor',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 2 } },
    description: '고철과 가죽으로 보호 헬멧을 만든다.',
    output: [{ definitionId: 'helmet', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { armorcraft: 2 },
    stages: [
      {
        stageIndex: 0, label: '금속 성형', tpCost: 3,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '내장재 부착', tpCost: 3,
        requiredItems: [
          { definitionId: 'cloth', qty: 1 },
          { definitionId: 'leather', qty: 1 },
          { definitionId: 'duct_tape', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_raincoat: {
    id: 'make_raincoat', name: '우비 제작', category: 'armor',
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 2 } },
    description: '천과 고무로 방수 우비를 만든다.',
    output: [{ definitionId: 'raincoat', qty: 1 }],
    requiredTools: [],
    requiredSkills: { armorcraft: 2 },
    stages: [{
      stageIndex: 0, label: '우비 봉제', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 4 } },
    description: '방탄 소재로 된 전술조끼. 작업대 필요.',
    output: [{ definitionId: 'tactical_vest', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 4 },
    stages: [
      {
        stageIndex: 0, label: '소재 재단', tpCost: 5,
        requiredItems: [
          { definitionId: 'leather', qty: 2 },
          { definitionId: 'cloth', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '판금 삽입 및 마무리', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 5, crafting: 3 } },
    description: '우비와 방독면을 결합한 완전 방호복.',
    output: [{ definitionId: 'hazmat_suit', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 5, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '방호 기초 제작', tpCost: 5,
        requiredItems: [
          { definitionId: 'raincoat', qty: 1 },
          { definitionId: 'rubber', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '밀폐 처리', tpCost: 3,
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
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 1 } },
    description: '고층 진입·탈출용 사다리.',
    output: [{ definitionId: 'rope_ladder', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 1 },
    stages: [{
      stageIndex: 0, label: '사다리 제작', tpCost: 3,
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
    hidden: true, unlockConditions: { minDay: 5 },
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
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2 } },
    description: '천과 가죽으로 든든한 배낭을 만든다. (+5칸)',
    output: [{ definitionId: 'backpack', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '배낭 제작', tpCost: 5,
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
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 3 } },
    description: '대형 수납 더플백. (+6칸)',
    output: [{ definitionId: 'duffel_bag', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '더플백 제작', tpCost: 6,
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
    hidden: true, unlockConditions: { minSkillLevel: { armorcraft: 3 } },
    description: '고철과 가죽으로 튼튼한 방패를 만든다.',
    output: [{ definitionId: 'shield', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { armorcraft: 3 },
    stages: [
      {
        stageIndex: 0, label: '판금 성형', tpCost: 5,
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

  // ── 식량 (추가) ──────────────────────────────────────────────
  make_cooked_ration: {
    id: 'make_cooked_ration',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 2 } },
    name: '조리 전투 식량 제작',
    category: 'food',
    description: '밥과 건어육, 소금으로 만든 고칼로리 전투 식량. 장기 탐험에 필수.',
    output: [{ definitionId: 'military_ration', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 2 },
    stages: [
      {
        stageIndex: 0, label: '조합 & 포장', tpCost: 6,
        requiredItems: [
          { definitionId: 'cooked_rice', qty: 1 },
          { definitionId: 'dried_meat', qty: 1 },
          { definitionId: 'salt', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ── 도구 (추가) ──────────────────────────────────────────────
  make_lockpick: {
    id: 'make_lockpick',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 1 } },
    name: '자물쇠 따개 제작',
    category: 'tool',
    description: '철사와 날카로운 금속 조각으로 만든 잠금 해제 도구.',
    output: [{ definitionId: 'lockpick', qty: 2 }],
    requiredTools: [],
    requiredSkills: { crafting: 1 },
    stages: [
      {
        stageIndex: 0, label: '성형 & 마감', tpCost: 3,
        requiredItems: [
          { definitionId: 'sharp_blade', qty: 1 },
          { definitionId: 'wire', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_flashlight: {
    id: 'make_flashlight',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2 } },
    name: '손전등 조립',
    category: 'tool',
    description: '전자 부품과 플라스틱 케이스로 조립한 손전등. 야간 탐험의 필수품.',
    output: [{ definitionId: 'flashlight', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '회로 조립 & 케이싱', tpCost: 3,
        requiredItems: [
          { definitionId: 'electronic_parts', qty: 1 },
          { definitionId: 'plastic', qty: 1 },
          { definitionId: 'wire', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ── 의료 (추가) ──────────────────────────────────────────────
  brew_antiseptic: {
    id: 'brew_antiseptic',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 1 } },
    name: '소독제 조제',
    category: 'medical',
    description: '알코올 용액과 약초를 혼합해 만드는 소독제. 감염 억제에 효과적.',
    output: [{ definitionId: 'antiseptic', qty: 2 }],
    requiredTools: [],
    requiredSkills: { cooking: 1 },
    stages: [
      {
        stageIndex: 0, label: '혼합 & 숙성', tpCost: 3,
        requiredItems: [
          { definitionId: 'alcohol_solution', qty: 1 },
          { definitionId: 'herb', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ── 무기 (추가) ──────────────────────────────────────────────
  make_hand_axe: {
    id: 'make_hand_axe',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 3 } },
    name: '손도끼 제작',
    category: 'weapon',
    description: '고철과 날카로운 금속으로 만든 소형 도끼. 근접 공격과 목재 채집에 활용.',
    output: [{ definitionId: 'hand_axe', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 3 },
    stages: [
      {
        stageIndex: 0, label: '날 성형', tpCost: 5,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 2 },
          { definitionId: 'sharp_blade', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '손잡이 결합', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 1 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_machete: {
    id: 'make_machete',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 3 } },
    name: '마체테 제작',
    category: 'weapon',
    description: '길고 무거운 고철 날로 만든 정글도. 높은 피해와 출혈 효과.',
    output: [{ definitionId: 'machete', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 3 },
    stages: [
      {
        stageIndex: 0, label: '날 연마', tpCost: 6,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'sharp_blade', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '손잡이 감기', tpCost: 3,
        requiredItems: [
          { definitionId: 'leather', qty: 1 },
          { definitionId: 'duct_tape', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase B: 도구 제작 구조물 블루프린트 (6 structures)
  // ══════════════════════════════════════════════════════════════

  build_field_forge: {
    id: 'build_field_forge', name: '야전 대장간 건설', category: 'structure',
    hidden: true, unlockConditions: { minDay: 15, minSkillLevel: { building: 3, crafting: 2 } },
    description: '고철·돌·나무로 간이 대장간을 세운다. 금속 도구 제작의 시작점.',
    output: [{ definitionId: 'field_forge', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 3, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '화로 기반 축조', tpCost: 5,
        requiredItems: [
          { definitionId: 'pebble',     qty: 6 },
          { definitionId: 'scrap_metal',qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '작업대 결합', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 3 },
          { definitionId: 'nail',       qty: 8 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_coal_furnace: {
    id: 'build_coal_furnace', name: '석탄 용광로 건설', category: 'structure',
    hidden: true, unlockConditions: { minDay: 25, minSkillLevel: { building: 4, crafting: 3 } },
    description: '고온 제련용 석탄 용광로. 야전 대장간 보유 후 건설 가능.',
    output: [{ definitionId: 'coal_furnace', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { building: 4, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '석조 기초 쌓기', tpCost: 6,
        requiredItems: [
          { definitionId: 'pebble',     qty: 10 },
          { definitionId: 'scrap_metal',qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '연통 설치', tpCost: 5,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 4 },
          { definitionId: 'wire',        qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_chemistry_bench: {
    id: 'build_chemistry_bench', name: '화학 실험대 건설', category: 'structure',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { crafting: 3, medicine: 2 } },
    description: '약품 합성 및 화약 제조용 실험대. 의학 지식이 필요.',
    output: [{ definitionId: 'chemistry_bench', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 3, medicine: 2 },
    stages: [
      {
        stageIndex: 0, label: '실험대 골조 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood_plank',  qty: 3 },
          { definitionId: 'scrap_metal', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '기구 배치', tpCost: 3,
        requiredItems: [
          { definitionId: 'glass_shard',    qty: 3 },
          { definitionId: 'empty_bottle',   qty: 2 },
          { definitionId: 'wire',           qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_ammo_bench: {
    id: 'build_ammo_bench', name: '탄약 제조대 건설', category: 'structure',
    hidden: true, unlockConditions: { minDay: 30, minSkillLevel: { weaponcraft: 4, crafting: 3 } },
    description: '탄약을 직접 조립하는 정밀 제조대. 야전 대장간 보유 시 대안 경로도 가능.',
    output: [{ definitionId: 'ammo_bench', qty: 1 }],
    requiredTools: [],
    requiredSkills: { weaponcraft: 4, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '작업대 제작', tpCost: 5,
        requiredItems: [
          { definitionId: 'wood_plank',    qty: 3 },
          { definitionId: 'scrap_metal',   qty: 2 },
          { definitionId: 'nail',          qty: 6 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '프레스 장착', tpCost: 5,
        requiredItems: [
          { definitionId: 'refined_metal', qty: 2 },
          { definitionId: 'spring',        qty: 2 },
          { definitionId: 'wire',          qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_carpentry_bench: {
    id: 'build_carpentry_bench', name: '목공 작업대 건설', category: 'structure',
    hidden: true, unlockConditions: { minDay: 10, minSkillLevel: { building: 2 } },
    description: '나무를 정밀 가공하는 목공 작업대. 기본 작업대보다 더 나은 목제 도구 제작 가능.',
    output: [{ definitionId: 'carpentry_bench', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2 },
    stages: [{
      stageIndex: 0, label: '작업대 조립', tpCost: 5,
      requiredItems: [
        { definitionId: 'wood',      qty: 4 },
        { definitionId: 'wood_plank',qty: 2 },
        { definitionId: 'nail',      qty: 8 },
        { definitionId: 'scrap_metal',qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  build_tanning_rack: {
    id: 'build_tanning_rack', name: '가죽 작업대 건설', category: 'structure',
    hidden: true, unlockConditions: { minDay: 8, minSkillLevel: { crafting: 2 } },
    description: '가죽을 처리하는 작업대. 동물 사냥 후 가죽 가공에 필수.',
    output: [{ definitionId: 'tanning_rack', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '건조대 설치', tpCost: 3,
      requiredItems: [
        { definitionId: 'wood',  qty: 3 },
        { definitionId: 'rope',  qty: 2 },
        { definitionId: 'nail',  qty: 4 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase B: 금속 제련 (coal_furnace 필요)
  // ══════════════════════════════════════════════════════════════

  smelt_refined_metal: {
    id: 'smelt_refined_metal', name: '금속 제련', category: 'material',
    hidden: true, unlockConditions: { minDay: 25, minSkillLevel: { crafting: 3 } },
    description: '용광로에서 고철을 제련해 정제 금속판을 만든다.',
    output: [{ definitionId: 'refined_metal', qty: 1 }],
    requiredTools: ['coal_furnace'],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '고온 제련', tpCost: 5,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 3 },
        { definitionId: 'charcoal',    qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  smelt_steel_plate: {
    id: 'smelt_steel_plate', name: '강철 제련', category: 'material',
    hidden: true, unlockConditions: { minDay: 35, minSkillLevel: { crafting: 4 } },
    description: '정제 금속을 고온 처리해 강철판을 만든다.',
    output: [{ definitionId: 'steel_plate', qty: 1 }],
    requiredTools: ['coal_furnace'],
    requiredSkills: { crafting: 4 },
    stages: [{
      stageIndex: 0, label: '강철화 처리', tpCost: 6,
      requiredItems: [
        { definitionId: 'refined_metal', qty: 2 },
        { definitionId: 'charcoal',      qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  smelt_lead_ingot: {
    id: 'smelt_lead_ingot', name: '납 추출', category: 'material',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { crafting: 2 } },
    description: '배터리에서 납을 추출한다. 탄환 제작에 사용.',
    output: [{ definitionId: 'lead_ingot', qty: 3 }],
    requiredTools: ['coal_furnace'],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '납 용융 추출', tpCost: 3,
      requiredItems: [
        { definitionId: 'battery', qty: 1 },
        { definitionId: 'charcoal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  smelt_brass: {
    id: 'smelt_brass', name: '황동 제련', category: 'material',
    hidden: true, unlockConditions: { minDay: 25, minSkillLevel: { crafting: 3 } },
    description: '구리선과 납을 합금해 황동을 만든다. 탄피 제작의 기초.',
    output: [{ definitionId: 'brass_fragment', qty: 4 }],
    requiredTools: ['coal_furnace'],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '합금 제련', tpCost: 5,
      requiredItems: [
        { definitionId: 'wire',       qty: 2 },
        { definitionId: 'lead_ingot', qty: 1 },
        { definitionId: 'charcoal',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase B: 야전 대장간 단조 (field_forge 필요)
  // ══════════════════════════════════════════════════════════════

  forge_ax_head: {
    id: 'forge_ax_head', name: '도끼날 단조', category: 'material',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { weaponcraft: 3 } },
    description: '정제 금속판을 단조해 도끼날을 만든다.',
    output: [{ definitionId: 'ax_head', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '날 단조', tpCost: 5,
      requiredItems: [
        { definitionId: 'refined_metal', qty: 1 },
        { definitionId: 'charcoal',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  forge_shovel_head: {
    id: 'forge_shovel_head', name: '삽 머리 단조', category: 'material',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { crafting: 3 } },
    description: '정제 금속판 2장을 단조해 삽 머리를 만든다.',
    output: [{ definitionId: 'shovel_head', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '삽 날 단조', tpCost: 5,
      requiredItems: [
        { definitionId: 'refined_metal', qty: 2 },
        { definitionId: 'charcoal',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  forge_hammer_head: {
    id: 'forge_hammer_head', name: '망치 머리 단조', category: 'material',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { crafting: 3 } },
    description: '정제 금속과 고철로 묵직한 망치 머리를 만든다.',
    output: [{ definitionId: 'hammer_head', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '망치 머리 단조', tpCost: 5,
      requiredItems: [
        { definitionId: 'refined_metal', qty: 1 },
        { definitionId: 'scrap_metal',   qty: 2 },
        { definitionId: 'charcoal',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  forge_fishing_hook: {
    id: 'forge_fishing_hook', name: '낚싯바늘 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2 } },
    description: '철사를 구부려 낚싯바늘을 3개 만든다.',
    output: [{ definitionId: 'fishing_hook', qty: 3 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '바늘 성형', tpCost: 1,
      requiredItems: [
        { definitionId: 'wire', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  forge_empty_cartridge: {
    id: 'forge_empty_cartridge', name: '탄피 제작', category: 'material',
    hidden: true, unlockConditions: { minDay: 25, minSkillLevel: { crafting: 3 } },
    description: '황동 조각을 눌러 탄피를 만든다. 탄약 조립의 기초.',
    output: [{ definitionId: 'empty_cartridge', qty: 6 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '탄피 성형', tpCost: 3,
      requiredItems: [
        { definitionId: 'brass_fragment', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  forge_bolt_tip: {
    id: 'forge_bolt_tip', name: '볼트 촉 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2 } },
    description: '고철을 단조해 날카로운 볼트 촉을 5개 만든다.',
    output: [{ definitionId: 'bolt_tip', qty: 5 }],
    requiredTools: ['field_forge'],
    requiredSkills: { weaponcraft: 2 },
    stages: [{
      stageIndex: 0, label: '촉 단조', tpCost: 3,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 1 },
        { definitionId: 'charcoal',    qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase B: 도구 완성 조립 (carpentry_bench / field_forge)
  // ══════════════════════════════════════════════════════════════

  craft_axe: {
    id: 'craft_axe', name: '도끼 제작', category: 'weapon',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { weaponcraft: 3 } },
    description: '도끼날과 나무 자루를 결합한 완성 도끼. 벌목 효율 2배, 전투 사용 가능.',
    output: [{ definitionId: 'axe', qty: 1 }],
    requiredTools: ['carpentry_bench'],
    requiredSkills: { weaponcraft: 3 },
    stages: [
      {
        stageIndex: 0, label: '자루 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood_plank',  qty: 2 },
          { definitionId: 'kindling',    qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '날 결합', tpCost: 3,
        requiredItems: [
          { definitionId: 'ax_head', qty: 1 },
          { definitionId: 'leather', qty: 1 },
          { definitionId: 'wire',    qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_shovel: {
    id: 'craft_shovel', name: '삽 제작', category: 'weapon',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { crafting: 3 } },
    description: '삽 머리와 나무 자루를 결합한 삽. 땅 파기·텃밭 조성 효율 증가.',
    output: [{ definitionId: 'shovel', qty: 1 }],
    requiredTools: ['carpentry_bench'],
    requiredSkills: { crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '자루 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 2 },
          { definitionId: 'rope',       qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '삽 머리 결합', tpCost: 1,
        requiredItems: [
          { definitionId: 'shovel_head', qty: 1 },
          { definitionId: 'nail',        qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_hammer: {
    id: 'craft_hammer', name: '망치 제작', category: 'weapon',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { crafting: 3 } },
    description: '망치 머리와 자루를 결합한 망치. 건축 TP 비용 감소, 전투 기절 효과.',
    output: [{ definitionId: 'hammer', qty: 1 }],
    requiredTools: ['carpentry_bench'],
    requiredSkills: { crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '자루 제작', tpCost: 1,
        requiredItems: [
          { definitionId: 'wood', qty: 1 },
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '머리 결합', tpCost: 1,
        requiredItems: [
          { definitionId: 'hammer_head', qty: 1 },
          { definitionId: 'nail',        qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_improved_fishing_rod: {
    id: 'craft_improved_fishing_rod', name: '개선 낚싯대 제작', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2 } },
    description: '목공 작업대로 만든 튼튼한 낚싯대. 어획 확률 증가.',
    output: [{ definitionId: 'fishing_rod', qty: 1 }],
    requiredTools: ['carpentry_bench'],
    requiredSkills: { crafting: 2 },
    stages: [{
      stageIndex: 0, label: '낚싯대 제작', tpCost: 3,
      requiredItems: [
        { definitionId: 'wood_plank',   qty: 2 },
        { definitionId: 'fishing_hook', qty: 1 },
        { definitionId: 'rope',         qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  craft_bolt_shaft: {
    id: 'craft_bolt_shaft', name: '볼트 샤프트 제작', category: 'material',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2 } },
    description: '나무 막대를 다듬어 볼트 샤프트 5개를 만든다.',
    output: [{ definitionId: 'bolt_shaft', qty: 5 }],
    requiredTools: ['carpentry_bench'],
    requiredSkills: { weaponcraft: 2 },
    stages: [{
      stageIndex: 0, label: '샤프트 성형', tpCost: 1,
      requiredItems: [
        { definitionId: 'dry_wood_stick', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  craft_improved_crossbow_bolt: {
    id: 'craft_improved_crossbow_bolt', name: '개선 석궁 볼트 제작', category: 'weapon',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 3 } },
    description: '단조 촉을 달아 관통력을 높인 석궁 볼트 5개.',
    output: [{ definitionId: 'improved_crossbow_bolt', qty: 5 }],
    requiredTools: ['carpentry_bench'],
    requiredSkills: { weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '볼트 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'bolt_shaft', qty: 5 },
        { definitionId: 'bolt_tip',   qty: 5 },
        { definitionId: 'leather',    qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase B: 화학 합성 (chemistry_bench 필요)
  // ══════════════════════════════════════════════════════════════

  synthesize_black_powder: {
    id: 'synthesize_black_powder', name: '흑색 화약 합성', category: 'material',
    hidden: true, unlockConditions: { minDay: 25, minSkillLevel: { crafting: 3, medicine: 2 } },
    description: '숯·초석·유황을 혼합해 흑색 화약을 합성한다. 탄약·폭발물의 원료.',
    output: [{ definitionId: 'black_powder', qty: 5 }],
    requiredTools: ['chemistry_bench'],
    requiredSkills: { crafting: 3, medicine: 2 },
    stages: [{
      stageIndex: 0, label: '화약 혼합', tpCost: 5,
      requiredItems: [
        { definitionId: 'charcoal',  qty: 3 },
        { definitionId: 'saltpeter', qty: 2 },
        { definitionId: 'sulfur',    qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  synthesize_detonator_cap: {
    id: 'synthesize_detonator_cap', name: '뇌관 합성', category: 'material',
    hidden: true, unlockConditions: { minDay: 30, minSkillLevel: { crafting: 3, medicine: 2 } },
    description: '황동과 화학약품으로 뇌관을 만든다. 탄약 조립의 핵심 부품.',
    output: [{ definitionId: 'detonator_cap', qty: 6 }],
    requiredTools: ['chemistry_bench'],
    requiredSkills: { crafting: 3, medicine: 2 },
    stages: [{
      stageIndex: 0, label: '뇌관 합성', tpCost: 5,
      requiredItems: [
        { definitionId: 'brass_fragment', qty: 2 },
        { definitionId: 'alcohol_solution', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  synthesize_poison: {
    id: 'synthesize_poison', name: '독 추출물 합성', category: 'material',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { medicine: 3 } },
    description: '약초에서 독성 성분을 추출한다. 무기 도포 또는 함정에 사용.',
    output: [{ definitionId: 'antiseptic', qty: 2 }],
    requiredTools: ['chemistry_bench'],
    requiredSkills: { medicine: 3 },
    stages: [{
      stageIndex: 0, label: '독소 추출', tpCost: 5,
      requiredItems: [
        { definitionId: 'herb',             qty: 3 },
        { definitionId: 'alcohol_solution', qty: 1 },
        { definitionId: 'empty_bottle',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  Phase B: 탄약 다단 제작 (ammo_bench 필요)
  // ══════════════════════════════════════════════════════════════

  craft_pistol_ammo: {
    id: 'craft_pistol_ammo', name: '권총탄 제작 (9mm)', category: 'material',
    hidden: true, unlockConditions: { minDay: 30, minSkillLevel: { weaponcraft: 3, crafting: 3 } },
    description: '탄피에 납·화약·뇌관을 조립해 권총탄 6발을 만든다.',
    output: [{ definitionId: 'pistol_ammo', qty: 6 }],
    requiredTools: ['ammo_bench'],
    requiredSkills: { weaponcraft: 3, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '탄두 성형', tpCost: 3,
        requiredItems: [
          { definitionId: 'lead_ingot',      qty: 2 },
          { definitionId: 'empty_cartridge', qty: 6 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '장약 + 뇌관 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'black_powder',   qty: 2 },
          { definitionId: 'detonator_cap',  qty: 6 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_shotgun_ammo: {
    id: 'craft_shotgun_ammo', name: '산탄 제작 (12게이지)', category: 'material',
    hidden: true, unlockConditions: { minDay: 30, minSkillLevel: { weaponcraft: 4, crafting: 3 } },
    description: '알루미늄 케이스에 산탄·화약·뇌관을 조립해 산탄 4발을 만든다.',
    output: [{ definitionId: 'shotgun_ammo', qty: 4 }],
    requiredTools: ['ammo_bench'],
    requiredSkills: { weaponcraft: 4, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '산탄 케이스 준비', tpCost: 3,
        requiredItems: [
          { definitionId: 'empty_can',   qty: 2 },
          { definitionId: 'lead_ingot',  qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '화약 + 뇌관 조립', tpCost: 5,
        requiredItems: [
          { definitionId: 'black_powder',  qty: 3 },
          { definitionId: 'detonator_cap', qty: 4 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_rifle_ammo: {
    id: 'craft_rifle_ammo', name: '소총탄 제작 (5.56mm)', category: 'material',
    hidden: true, unlockConditions: { minDay: 45, minSkillLevel: { weaponcraft: 5, crafting: 4 } },
    description: '강철 코어와 고순도 화약으로 소총탄 6발을 제작한다. 고난도 제작.',
    output: [{ definitionId: 'rifle_ammo', qty: 6 }],
    requiredTools: ['ammo_bench'],
    requiredSkills: { weaponcraft: 5, crafting: 4 },
    stages: [
      {
        stageIndex: 0, label: '탄심 제작', tpCost: 5,
        requiredItems: [
          { definitionId: 'steel_plate',     qty: 1 },
          { definitionId: 'lead_ingot',      qty: 2 },
          { definitionId: 'empty_cartridge', qty: 6 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '고압 장약 + 뇌관 조립', tpCost: 5,
        requiredItems: [
          { definitionId: 'black_powder',   qty: 4 },
          { definitionId: 'detonator_cap',  qty: 6 },
          { definitionId: 'brass_fragment', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_improved_crossbow_bolt_ammo: {
    id: 'craft_improved_crossbow_bolt_ammo', name: '개선 볼트 탄약 조립', category: 'weapon',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 3 } },
    description: '탄약 제조대에서 볼트 촉을 정밀 연마해 개선 볼트 5발을 만든다.',
    output: [{ definitionId: 'improved_crossbow_bolt', qty: 5 }],
    requiredTools: ['ammo_bench'],
    requiredSkills: { weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '볼트 정밀 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'bolt_shaft', qty: 5 },
        { definitionId: 'bolt_tip',   qty: 5 },
      ],
      consumeAt: 'start',
    }],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Phase C: 식생 확장 — 도구 제작 블루프린트 (18)
  // ═══════════════════════════════════════════════════════════════════════

  // ─── C-1: 기초 도구 (early game, Day 0) ────────────────────────────

  make_stone_knife: {
    id: 'make_stone_knife', name: '돌칼 제작', category: 'tool',
    description: '부싯돌 두 개를 깨서 날카로운 돌칼을 만든다. 고기와 생선 손질의 첫걸음.',
    output: [{ definitionId: 'stone_knife', qty: 1 }],
    requiredTools: [],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '돌 깎기', tpCost: 3,
      requiredItems: [
        { definitionId: 'firestone', qty: 2 },
        { definitionId: 'pebble',    qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_mortar_pestle: {
    id: 'make_mortar_pestle', name: '절구 제작', category: 'tool',
    description: '자갈을 모아 절구와 절굿공이를 만든다. 도토리·약초·마늘 분쇄에 사용.',
    output: [{ definitionId: 'mortar_pestle', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    stages: [
      {
        stageIndex: 0, label: '돌 모으기', tpCost: 3,
        requiredItems: [
          { definitionId: 'pebble',   qty: 4 },
          { definitionId: 'soil_bag', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '형태 다듬기', tpCost: 3,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_trowel: {
    id: 'make_trowel', name: '모종삽 제작', category: 'tool',
    description: '고철 조각과 나무 자루로 소형 모종삽을 만든다. 텃밭 조성 필수 도구.',
    output: [{ definitionId: 'trowel', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    stages: [{
      stageIndex: 0, label: '삽 제작', tpCost: 3,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 1 },
        { definitionId: 'wood',        qty: 1 },
        { definitionId: 'rope',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_fish_trap: {
    id: 'make_fish_trap', name: '통발 제작', category: 'tool',
    description: '철사와 나무로 통발을 만든다. 강변 지역에 놓으면 자동으로 날생선을 잡는다.',
    output: [{ definitionId: 'fish_trap', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '틀 만들기', tpCost: 3,
        requiredItems: [
          { definitionId: 'wire', qty: 2 },
          { definitionId: 'wood', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '그물 엮기', tpCost: 3,
        requiredItems: [
          { definitionId: 'rope',        qty: 1 },
          { definitionId: 'fishing_hook',qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_clay_pot: {
    id: 'make_clay_pot', name: '토기 냄비 제작', category: 'tool',
    description: '흙을 빚어 모닥불에 구운 토기 냄비. 조리솥 거치대에 올리면 스튜·발효식품을 만든다.',
    output: [{ definitionId: 'clay_pot', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { crafting: 1 },
    stages: [
      {
        stageIndex: 0, label: '성형', tpCost: 3,
        requiredItems: [
          { definitionId: 'soil_bag', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '가마 굽기', tpCost: 5,
        requiredItems: [],
        consumeAt: 'start',
      },
    ],
  },

  make_sickle: {
    id: 'make_sickle', name: '낫 제작', category: 'tool',
    description: '고철을 구부려 만든 낫. 텃밭 수확 TP를 줄여주고 쐐기풀 채집에도 쓴다.',
    output: [{ definitionId: 'sickle', qty: 1 }],
    requiredTools: ['pipe_wrench'],
    requiredSkills: { weaponcraft: 1 },
    stages: [{
      stageIndex: 0, label: '낫 제작', tpCost: 5,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 2 },
        { definitionId: 'wood',        qty: 1 },
        { definitionId: 'rope',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ─── C-2: 중급 도구 (field_forge 필요) ────────────────────────────

  make_kitchen_knife: {
    id: 'make_kitchen_knife', name: '부엌칼 단조', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { weaponcraft: 2 } },
    description: '야전 대장간에서 단조한 부엌칼. 돌칼보다 내구도가 4배 높다.',
    output: [{ definitionId: 'kitchen_knife', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { weaponcraft: 2 },
    stages: [
      {
        stageIndex: 0, label: '단조', tpCost: 5,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'wood',        qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '날 다듬기', tpCost: 3,
        requiredItems: [
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  make_iron_pot: {
    id: 'make_iron_pot', name: '무쇠솥 주조', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { building: 2 } },
    description: '야전 대장간에서 주조한 무쇠솥. 대용량 조리, 내구도가 매우 높다.',
    output: [{ definitionId: 'iron_pot', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '주물 제작', tpCost: 6,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 5 },
          { definitionId: 'nail',        qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '마감', tpCost: 3,
        requiredItems: [
          { definitionId: 'refined_metal', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ─── C-3: 가공·보존 구조물 제작 ─────────────────────────────────────

  build_drying_rack: {
    id: 'build_drying_rack', name: '건조대 설치', category: 'structure',
    description: '나무 기둥과 줄로 건조대를 만든다. 고기·생선·버섯 등 모든 식재료를 말릴 수 있다.',
    output: [{ definitionId: 'drying_rack', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    stages: [
      {
        stageIndex: 0, label: '기둥 세우기', tpCost: 3,
        requiredItems: [
          { definitionId: 'wood', qty: 4 },
          { definitionId: 'nail', qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '줄 연결', tpCost: 1,
        requiredItems: [
          { definitionId: 'rope', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_cooking_pot_stand: {
    id: 'build_cooking_pot_stand', name: '조리솥 거치대 설치', category: 'structure',
    description: '캠프파이어 위에 올릴 수 있는 금속 거치대. clay_pot나 iron_pot을 올리면 스튜와 수프를 조리할 수 있다.',
    output: [{ definitionId: 'cooking_pot_stand', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '프레임 제작', tpCost: 5,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'wire',        qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '설치', tpCost: 1,
        requiredItems: [
          { definitionId: 'nail', qty: 4 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_fermentation_pot: {
    id: 'build_fermentation_pot', name: '발효통 제작', category: 'structure',
    description: '흙을 빚어 구운 대형 발효통. 김치·발효주·발효죽을 숙성시킨다.',
    output: [{ definitionId: 'fermentation_pot', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { building: 2, cooking: 1 },
    stages: [
      {
        stageIndex: 0, label: '성형', tpCost: 5,
        requiredItems: [
          { definitionId: 'soil_bag', qty: 5 },
          { definitionId: 'rope',     qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '가마 굽기 및 소금 코팅', tpCost: 6,
        requiredItems: [
          { definitionId: 'salt', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_root_cellar: {
    id: 'build_root_cellar', name: '땅굴 저장고 건설', category: 'structure',
    hidden: true, unlockConditions: { minDay: 20, minSkillLevel: { building: 3 } },
    description: '삽으로 땅을 파서 만든 저장고. 낮은 온도로 식품 보존 기간을 2배 연장.',
    output: [{ definitionId: 'root_cellar', qty: 1 }],
    requiredTools: ['shovel'],
    requiredSkills: { building: 3 },
    stages: [
      {
        stageIndex: 0, label: '땅 파기', tpCost: 8,
        requiredItems: [],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '골조 설치', tpCost: 6,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 6 },
          { definitionId: 'nail',       qty: 8 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '마감', tpCost: 3,
        requiredItems: [
          { definitionId: 'rope', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_bee_hive: {
    id: 'build_bee_hive', name: '벌통 설치', category: 'structure',
    hidden: true, unlockConditions: { minDay: 15, minSkillLevel: { building: 2 } },
    description: '나무 판자로 만든 벌통. 꿀을 생산해 발효식품 제조와 의료에 활용.',
    output: [{ definitionId: 'bee_hive', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '통 제작', tpCost: 5,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 4 },
          { definitionId: 'rope',       qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '설치 및 유인', tpCost: 3,
        requiredItems: [
          { definitionId: 'wild_berry', qty: 2 },
          { definitionId: 'pine_cone',  qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ─── C-4: 텃밭 제작 (shovel + trowel 필요) ──────────────────────────

  build_garden_bed_veggie: {
    id: 'build_garden_bed_veggie', name: '채소 텃밭 조성', category: 'structure',
    hidden: true, unlockConditions: { minDay: 10, minSkillLevel: { building: 2 } },
    description: '채소 씨앗을 심은 텃밭. 5일 후 채소 수확 가능. 지속 가능한 식량 공급원.',
    output: [{ definitionId: 'garden_bed_veggie', qty: 1 }],
    requiredTools: ['shovel', 'trowel'],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '밭 고르기', tpCost: 6,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 3 },
          { definitionId: 'soil_bag',   qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '씨앗 심기', tpCost: 3,
        requiredItems: [
          { definitionId: 'vegetable_seed', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_garden_bed_herb: {
    id: 'build_garden_bed_herb', name: '약초 텃밭 조성', category: 'structure',
    hidden: true, unlockConditions: { minDay: 10, minSkillLevel: { building: 2 } },
    description: '약초 씨앗을 심은 텃밭. 의료 자급자족을 위한 지속적 약초 공급원.',
    output: [{ definitionId: 'garden_bed_herb', qty: 1 }],
    requiredTools: ['shovel', 'trowel'],
    requiredSkills: { building: 2 },
    stages: [
      {
        stageIndex: 0, label: '밭 고르기', tpCost: 6,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 3 },
          { definitionId: 'soil_bag',   qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '씨앗 심기', tpCost: 3,
        requiredItems: [
          { definitionId: 'herb_seed', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  build_garden_bed_grain: {
    id: 'build_garden_bed_grain', name: '곡물 텃밭 조성', category: 'structure',
    hidden: true, unlockConditions: { minDay: 15, minSkillLevel: { building: 3 } },
    description: '곡물 씨앗을 심은 대형 텃밭. 7일 후 대량 수확. 식량 안보 핵심.',
    output: [{ definitionId: 'garden_bed_grain', qty: 1 }],
    requiredTools: ['shovel', 'trowel'],
    requiredSkills: { building: 3 },
    stages: [
      {
        stageIndex: 0, label: '넓은 밭 조성', tpCost: 8,
        requiredItems: [
          { definitionId: 'wood_plank', qty: 4 },
          { definitionId: 'soil_bag',   qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '비료 투입', tpCost: 3,
        requiredItems: [
          { definitionId: 'dry_leaves', qty: 3 },
          { definitionId: 'wild_root',  qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '파종', tpCost: 3,
        requiredItems: [
          { definitionId: 'grain_seed', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Phase D: 식생 확장 — 조리·가공 레시피 블루프린트 (22)
  // ═══════════════════════════════════════════════════════════════════════

  // ─── D-1: 손질 레시피 (stone_knife / kitchen_knife) ─────────────────

  process_meat: {
    id: 'process_meat', name: '고기 손질', category: 'food',
    description: '칼로 날고기를 얇게 썰어 스트립으로 만든다. 건조 및 조리 전 필수 처리.',
    output: [{ definitionId: 'meat_strip', qty: 2 }],
    requiredTools: ['stone_knife'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '손질', tpCost: 1,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  process_fish: {
    id: 'process_fish', name: '생선 손질', category: 'food',
    description: '칼로 날생선을 필레로 손질한다. 구이·건조의 전처리.',
    output: [{ definitionId: 'fish_fillet', qty: 2 }],
    requiredTools: ['stone_knife'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '손질', tpCost: 1,
      requiredItems: [
        { definitionId: 'raw_fish', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  grind_acorn: {
    id: 'grind_acorn', name: '도토리 빻기', category: 'food',
    description: '절구로 도토리를 빻아 가루로 만든다. 도토리묵·죽의 핵심 재료.',
    output: [{ definitionId: 'acorn_flour', qty: 1 }],
    requiredTools: ['mortar_pestle'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '분쇄', tpCost: 3,
      requiredItems: [
        { definitionId: 'acorn', qty: 4 },
      ],
      consumeAt: 'start',
    }],
  },

  grind_herb: {
    id: 'grind_herb', name: '약초 갈기', category: 'food',
    description: '절구로 약초를 곱게 갈아 가루로 만든다. 일반 약초보다 효과가 강하다.',
    output: [{ definitionId: 'herb_powder', qty: 1 }],
    requiredTools: ['mortar_pestle'],
    requiredSkills: { medicine: 1 },
    stages: [{
      stageIndex: 0, label: '분쇄', tpCost: 3,
      requiredItems: [
        { definitionId: 'herb', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  mince_garlic: {
    id: 'mince_garlic', name: '마늘 빻기', category: 'food',
    description: '절구로 야생 마늘을 빻아 페이스트로 만든다. 요리 풍미와 항균력 강화.',
    output: [{ definitionId: 'garlic_paste', qty: 1 }],
    requiredTools: ['mortar_pestle'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '분쇄', tpCost: 1,
      requiredItems: [
        { definitionId: 'wild_garlic', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  process_nettle: {
    id: 'process_nettle', name: '쐐기풀 가공', category: 'food',
    description: '쐐기풀을 익혀 독성을 제거하고 섬유를 추출한다. 로프 대용 가능.',
    output: [{ definitionId: 'nettle_fiber', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '찌기 및 섬유 추출', tpCost: 3,
      requiredItems: [
        { definitionId: 'nettle', qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  // ─── D-2: 건조 레시피 (drying_rack) ─────────────────────────────────

  dry_meat: {
    id: 'dry_meat', name: '육포 만들기', category: 'food',
    description: '건조대에서 고기 스트립을 소금에 절여 말린다.',
    output: [{ definitionId: 'dried_meat', qty: 1 }],
    requiredTools: ['drying_rack'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '소금 절임 및 건조', tpCost: 5,
      requiredItems: [
        { definitionId: 'meat_strip', qty: 2 },
        { definitionId: 'salt',       qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  dry_fish: {
    id: 'dry_fish', name: '생선 말리기', category: 'food',
    description: '건조대에서 생선 필레를 소금에 절여 말린다.',
    output: [{ definitionId: 'dried_fish', qty: 1 }],
    requiredTools: ['drying_rack'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '소금 절임 및 건조', tpCost: 5,
      requiredItems: [
        { definitionId: 'fish_fillet', qty: 2 },
        { definitionId: 'salt',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  dry_mushroom: {
    id: 'dry_mushroom', name: '버섯 말리기', category: 'food',
    description: '건조대에서 식용 버섯을 말린다. 장기 보존 가능하고 수프 재료로 훌륭하다.',
    output: [{ definitionId: 'dried_mushroom', qty: 1 }],
    requiredTools: ['drying_rack'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '건조', tpCost: 3,
      requiredItems: [
        { definitionId: 'mushroom_edible', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  dry_berry: {
    id: 'dry_berry', name: '베리 말리기', category: 'food',
    description: '건조대에서 야생 베리를 말린다. 달콤한 간식이 사기를 올려준다.',
    output: [{ definitionId: 'dried_berry', qty: 1 }],
    requiredTools: ['drying_rack'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '건조', tpCost: 3,
      requiredItems: [
        { definitionId: 'wild_berry', qty: 3 },
      ],
      consumeAt: 'start',
    }],
  },

  // ─── D-3: 간단 조리 (campfire, cooking 1) ────────────────────────────

  grill_fish: {
    id: 'grill_fish', name: '생선 굽기', category: 'food',
    description: '모닥불에 소금 간을 해서 생선 필레를 굽는다.',
    output: [{ definitionId: 'grilled_fish', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '굽기', tpCost: 1,
      requiredItems: [
        { definitionId: 'fish_fillet', qty: 1 },
        { definitionId: 'salt',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_pine_needle_tea: {
    id: 'make_pine_needle_tea', name: '솔잎차 끓이기', category: 'food',
    description: '솔잎을 끓여 비타민 C가 풍부한 솔잎차를 만든다. 감염 저항에 효과적.',
    output: [{ definitionId: 'pine_needle_tea', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '끓이기', tpCost: 1,
      requiredItems: [
        { definitionId: 'pine_needle', qty: 3 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_dandelion_coffee: {
    id: 'make_dandelion_coffee', name: '민들레 커피 끓이기', category: 'food',
    description: '민들레 뿌리를 볶아 끓인 커피 대용 음료. 피로 회복과 사기 상승.',
    output: [{ definitionId: 'dandelion_coffee', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '볶고 끓이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'dandelion',   qty: 3 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_wild_salad: {
    id: 'make_wild_salad', name: '야생 샐러드 만들기', category: 'food',
    description: '민들레·야생 베리·야생 마늘을 섞은 신선 샐러드. 조리 없이 빠르게 만든다.',
    output: [{ definitionId: 'wild_salad', qty: 1 }],
    requiredTools: ['stone_knife'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '재료 섞기', tpCost: 1,
      requiredItems: [
        { definitionId: 'dandelion',   qty: 1 },
        { definitionId: 'wild_berry',  qty: 1 },
        { definitionId: 'wild_garlic', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_berry_jam: {
    id: 'make_berry_jam', name: '베리잼 만들기', category: 'food',
    description: '야생 베리를 모닥불에 졸여 잼으로 만든다. 장기 보존, 높은 사기 회복.',
    output: [{ definitionId: 'berry_jam', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 1 },
    stages: [{
      stageIndex: 0, label: '졸이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'wild_berry', qty: 4 },
        { definitionId: 'salt',       qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ─── D-4: 솥 요리 (cooking_pot_stand + clay_pot + campfire, cooking 2) ─

  make_mushroom_soup: {
    id: 'make_mushroom_soup', name: '버섯 수프 끓이기', category: 'food',
    description: '조리솥에 식용 버섯과 야생 마늘 페이스트를 넣어 끓인 수프.',
    output: [{ definitionId: 'mushroom_soup', qty: 1 }],
    requiredTools: ['cooking_pot_stand', 'campfire'],
    requiredSkills: { cooking: 2 },
    stages: [{
      stageIndex: 0, label: '수프 끓이기', tpCost: 5,
      requiredItems: [
        { definitionId: 'mushroom_edible', qty: 2 },
        { definitionId: 'garlic_paste',    qty: 1 },
        { definitionId: 'boiled_water',    qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_nettle_stew: {
    id: 'make_nettle_stew', name: '쐐기풀 스튜 끓이기', category: 'food',
    description: '쐐기풀과 야생 뿌리를 오래 끓인 든든한 스튜.',
    output: [{ definitionId: 'nettle_stew', qty: 1 }],
    requiredTools: ['cooking_pot_stand', 'campfire'],
    requiredSkills: { cooking: 2 },
    stages: [{
      stageIndex: 0, label: '스튜 끓이기', tpCost: 5,
      requiredItems: [
        { definitionId: 'nettle',       qty: 2 },
        { definitionId: 'wild_root',    qty: 2 },
        { definitionId: 'boiled_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  make_acorn_jelly: {
    id: 'make_acorn_jelly', name: '도토리묵 만들기', category: 'food',
    description: '도토리 가루를 정수된 물에 개어 굳힌 전통 음식. 사기와 트라우마 회복.',
    output: [{ definitionId: 'acorn_jelly', qty: 2 }],
    requiredTools: ['cooking_pot_stand', 'campfire'],
    requiredSkills: { cooking: 2 },
    stages: [
      {
        stageIndex: 0, label: '반죽 끓이기', tpCost: 5,
        requiredItems: [
          { definitionId: 'acorn_flour',    qty: 3 },
          { definitionId: 'purified_water', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '굳히기', tpCost: 3,
        requiredItems: [],
        consumeAt: 'complete',
      },
    ],
  },

  make_vegetable_stew: {
    id: 'make_vegetable_stew', name: '야채 스튜 끓이기', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3 } },
    description: '텃밭 채소와 야생 마늘 페이스트로 끓인 최고급 스튜. 모든 스탯 회복.',
    output: [{ definitionId: 'vegetable_stew', qty: 1 }],
    requiredTools: ['cooking_pot_stand', 'campfire'],
    requiredSkills: { cooking: 3 },
    stages: [{
      stageIndex: 0, label: '스튜 끓이기', tpCost: 6,
      requiredItems: [
        { definitionId: 'vegetable',    qty: 3 },
        { definitionId: 'garlic_paste', qty: 1 },
        { definitionId: 'boiled_water', qty: 1 },
        { definitionId: 'salt',         qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ─── D-5: 발효 레시피 (fermentation_pot, cooking 2+) ────────────────

  ferment_kimchi: {
    id: 'ferment_kimchi', name: '김치 담그기', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 2 } },
    description: '채소·야생 마늘·소금을 발효통에 담가 숙성시킨다. 감염 저항 최강의 발효식품.',
    output: [{ definitionId: 'fermented_kimchi', qty: 2 }],
    requiredTools: ['fermentation_pot'],
    requiredSkills: { cooking: 2 },
    stages: [
      {
        stageIndex: 0, label: '재료 절이기', tpCost: 5,
        requiredItems: [
          { definitionId: 'vegetable',   qty: 3 },
          { definitionId: 'wild_garlic', qty: 2 },
          { definitionId: 'salt',        qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '숙성 (3일)', tpCost: 9,
        requiredItems: [],
        consumeAt: 'complete',
      },
    ],
  },

  ferment_wine: {
    id: 'ferment_wine', name: '베리 발효주 담그기', category: 'food',
    hidden: true, unlockConditions: { minDay: 15, minSkillLevel: { cooking: 2 } },
    description: '야생 베리를 발효통에서 숙성시킨 술. 트라우마와 피로 해소에 최고.',
    output: [{ definitionId: 'berry_wine', qty: 1 }],
    requiredTools: ['fermentation_pot'],
    requiredSkills: { cooking: 2 },
    stages: [
      {
        stageIndex: 0, label: '재료 담기', tpCost: 3,
        requiredItems: [
          { definitionId: 'wild_berry', qty: 5 },
          { definitionId: 'grain',      qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '발효 (5일)', tpCost: 15,
        requiredItems: [],
        consumeAt: 'complete',
      },
    ],
  },

  ferment_grain: {
    id: 'ferment_grain', name: '발효 곡물죽 담그기', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 2 } },
    description: '곡물을 발효시켜 영양 죽을 만든다. 스태미나 회복에 특화된 발효식품.',
    output: [{ definitionId: 'fermented_grain', qty: 2 }],
    requiredTools: ['fermentation_pot'],
    requiredSkills: { cooking: 2 },
    stages: [
      {
        stageIndex: 0, label: '재료 담기', tpCost: 3,
        requiredItems: [
          { definitionId: 'grain',        qty: 3 },
          { definitionId: 'boiled_water', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '발효 (2일)', tpCost: 6,
        requiredItems: [],
        consumeAt: 'complete',
      },
    ],
  },

  // ─── D-6: 텃밭 수확 (sickle 사용 시 TP 절감) ────────────────────────

  harvest_vegetable: {
    id: 'harvest_vegetable', name: '채소 수확', category: 'food',
    description: '채소 텃밭에서 채소를 수확한다. 낫이 있으면 TP가 절약된다.',
    output: [{ definitionId: 'vegetable', qty: 3 }],
    requiredTools: ['garden_bed_veggie'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '수확', tpCost: 5,
      requiredItems: [],
      consumeAt: 'start',
    }],
  },

  harvest_herb: {
    id: 'harvest_herb', name: '약초 수확', category: 'food',
    description: '약초 텃밭에서 약초를 수확한다.',
    output: [{ definitionId: 'herb', qty: 2 }],
    requiredTools: ['garden_bed_herb'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '수확', tpCost: 5,
      requiredItems: [],
      consumeAt: 'start',
    }],
  },

  harvest_grain: {
    id: 'harvest_grain', name: '곡물 수확', category: 'food',
    description: '곡물 텃밭에서 곡물을 대량 수확한다.',
    output: [{ definitionId: 'grain', qty: 5 }],
    requiredTools: ['garden_bed_grain'],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '수확', tpCost: 6,
      requiredItems: [],
      consumeAt: 'start',
    }],
  },

  fishing_rod_basic: {
    id: 'fishing_rod_basic', name: '기본 낚싯대', category: 'tool',
    description: '나뭇가지와 천 조각으로 만든 낚싯대.',
    output: [{ definitionId: 'fishing_rod_basic', qty: 1 }],
    requiredTools: [],
    stages: [{
      stageIndex: 0, label: '낚싯대 제작', tpCost: 1,
      requiredItems: [
        { definitionId: 'wood', qty: 1 },
        { definitionId: 'cloth', qty: 1 },
        { definitionId: 'nail', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  fishing_rod_improved: {
    id: 'fishing_rod_improved', name: '개량 낚싯대', category: 'tool',
    hidden: true, unlockConditions: { minSkillLevel: { crafting: 2, fishing: 3 } },
    description: '철사와 낚싯바늘로 보강한 개량 낚싯대. 명중률 +15%.',
    output: [{ definitionId: 'fishing_rod_improved', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 2, fishing: 3 },
    stages: [{
      stageIndex: 0, label: '개량 낚싯대 제작', tpCost: 3,
      requiredItems: [
        { definitionId: 'wood', qty: 1 },
        { definitionId: 'wire', qty: 1 },
        { definitionId: 'scrap_metal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  bait_worm: {
    id: 'bait_worm', name: '지렁이 미끼', category: 'tool',
    description: '흙을 파서 지렁이를 잡아 미끼로 만든다. 낚시·통발에 사용.',
    output: [{ definitionId: 'bait_worm', qty: 2 }],
    requiredTools: [],
    requiredSkills: {},
    stages: [{
      stageIndex: 0, label: '미끼 준비', tpCost: 1,
      requiredItems: [
        { definitionId: 'dry_grass', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  bait_insect: {
    id: 'bait_insect', name: '곤충 미끼', category: 'tool',
    description: '풀밭에서 잡은 곤충으로 만든 미끼. 지렁이 미끼보다 효과가 좋다.',
    output: [{ definitionId: 'bait_insect', qty: 2 }],
    requiredTools: [],
    requiredSkills: { fishing: 2 },
    stages: [{
      stageIndex: 0, label: '곤충 채집', tpCost: 1,
      requiredItems: [
        { definitionId: 'dry_grass', qty: 1 },
        { definitionId: 'herb',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  훈련용 아이템 (Training Items) — skillOverride로 특정 스킬 XP 부여
  // ══════════════════════════════════════════════════════════════

  practice_bandage: {
    id: 'practice_bandage', name: '연습용 붕대', category: 'medical',
    description: '약초와 천 조각으로 만든 간이 붕대. 의료 스킬 훈련에 좋다.',
    output: [{ definitionId: 'practice_bandage', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 1 },
    skillOverride: 'medicine',
    stages: [{
      stageIndex: 0, label: '붕대 감기 연습', tpCost: 1,
      requiredItems: [
        { definitionId: 'cloth_scrap', qty: 1 },
        { definitionId: 'herb',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  wooden_sword: {
    id: 'wooden_sword', name: '목검', category: 'weapon',
    description: '나무와 끈으로 만든 훈련용 칼. 무기 제작 스킬 훈련에 좋다.',
    output: [{ definitionId: 'wooden_sword', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 1 },
    skillOverride: 'weaponcraft',
    stages: [{
      stageIndex: 0, label: '나무 깎기', tpCost: 3,
      requiredItems: [
        { definitionId: 'wood_plank', qty: 2 },
        { definitionId: 'rope',       qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  cloth_guard: {
    id: 'cloth_guard', name: '천 호구', category: 'armor',
    description: '천과 끈으로 만든 간이 보호구. 방어구 제작 스킬 훈련에 좋다.',
    output: [{ definitionId: 'cloth_guard', qty: 1 }],
    requiredTools: [],
    requiredSkills: { crafting: 1 },
    skillOverride: 'armorcraft',
    stages: [{
      stageIndex: 0, label: '천 겹치기', tpCost: 3,
      requiredItems: [
        { definitionId: 'cloth', qty: 2 },
        { definitionId: 'rope',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  training_shield: {
    id: 'training_shield', name: '훈련용 방패', category: 'armor',
    description: '나무와 고철로 만든 간이 방패. 방어/건설 스킬 훈련에 좋다.',
    output: [{ definitionId: 'training_shield', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 1 },
    skillOverride: 'building',
    stages: [{
      stageIndex: 0, label: '판자 조립', tpCost: 3,
      requiredItems: [
        { definitionId: 'wood_plank',  qty: 2 },
        { definitionId: 'scrap_metal', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  방사선차단제 제작
  // ══════════════════════════════════════════════════════════════

  rad_blocker_craft: {
    id: 'rad_blocker_craft', name: '방사선차단제 조제', category: 'medical',
    description: '숯과 약초, 알코올로 조제하는 방사선 차단 약제.',
    output: [{ definitionId: 'rad_blocker', qty: 1 }],
    requiredTools: ['medical_station'],
    requiredSkills: { medicine: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '약제 조합', tpCost: 5,
      requiredItems: [
        { definitionId: 'charcoal',          qty: 2 },
        { definitionId: 'herb',              qty: 3 },
        { definitionId: 'alcohol_solution',  qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  헬기 제작 부품 (기계공 B3 엔딩 전용) — 고난이도 크래프팅
  // ══════════════════════════════════════════════════════════════

  craft_aviation_alloy: {
    id: 'craft_aviation_alloy', name: '항공용 합금 단조', category: 'material',
    description: '고철을 용광로에서 용융·합금화해 경량 고강도 항공용 합금을 만든다.',
    output: [{ definitionId: 'aviation_alloy', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 5, weaponcraft: 3 },
    stages: [{
      stageIndex: 0, label: '용융·단조', tpCost: 6,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 5 },
        { definitionId: 'charcoal',    qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  craft_rotor_blade: {
    id: 'craft_rotor_blade', name: '로터 블레이드 가공', category: 'material',
    description: '항공용 합금을 선반 가공해 대칭 정밀도 0.5mm의 주회전익을 깎는다. 한 쌍(2개) 생산.',
    output: [{ definitionId: 'rotor_blade', qty: 2 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 7, weaponcraft: 5 },
    stages: [
      {
        stageIndex: 0, label: '선반 거친 가공', tpCost: 6,
        requiredItems: [
          { definitionId: 'aviation_alloy', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '정밀 균형 조정', tpCost: 5,
        requiredItems: [
          { definitionId: 'sharp_blade', qty: 1 },
          { definitionId: 'duct_tape',   qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_piston_engine: {
    id: 'craft_piston_engine', name: '피스톤 엔진 조립', category: 'material',
    description: '4기통 가솔린 피스톤 엔진. 실린더 블록 + 크랭크샤프트 + 연료 분사 시스템.',
    output: [{ definitionId: 'piston_engine', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 8, weaponcraft: 5, building: 3 },
    stages: [
      {
        stageIndex: 0, label: '실린더 블록', tpCost: 8,
        requiredItems: [
          { definitionId: 'aviation_alloy', qty: 2 },
          { definitionId: 'scrap_metal',    qty: 4 },
          { definitionId: 'spring',         qty: 4 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '연료 분사 시스템', tpCost: 6,
        requiredItems: [
          { definitionId: 'electronic_parts', qty: 3 },
          { definitionId: 'rubber',           qty: 2 },
          { definitionId: 'wire',             qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '크랭크샤프트 조립', tpCost: 6,
        requiredItems: [
          { definitionId: 'aviation_alloy', qty: 1 },
          { definitionId: 'duct_tape',      qty: 3 },
          { definitionId: 'rubber',         qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_avionics_module: {
    id: 'craft_avionics_module', name: '항공 전자 모듈', category: 'material',
    description: '점화·계기·자세 제어 통합 회로. ECU + 고도계 + 인공 수평의.',
    output: [{ definitionId: 'avionics_module', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 6, building: 3 },
    stages: [
      {
        stageIndex: 0, label: '제어 회로 기판', tpCost: 5,
        requiredItems: [
          { definitionId: 'electronic_parts', qty: 4 },
          { definitionId: 'wire',             qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '센서 통합', tpCost: 5,
        requiredItems: [
          { definitionId: 'electronic_parts', qty: 2 },
          { definitionId: 'glass_shard',      qty: 2 },
          { definitionId: 'duct_tape',        qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_tail_rotor_assembly: {
    id: 'craft_tail_rotor_assembly', name: '꼬리 로터 조립체', category: 'material',
    description: '안티 토크 장치. 꼬리 블레이드 + 드라이브 샤프트. 없으면 기체가 회전한다.',
    output: [{ definitionId: 'tail_rotor_assembly', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 6, weaponcraft: 4 },
    stages: [
      {
        stageIndex: 0, label: '꼬리 블레이드', tpCost: 5,
        requiredItems: [
          { definitionId: 'aviation_alloy', qty: 2 },
          { definitionId: 'sharp_blade',    qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '드라이브 샤프트', tpCost: 5,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'rubber',      qty: 2 },
          { definitionId: 'spring',      qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  craft_fuselage_frame: {
    id: 'craft_fuselage_frame', name: '동체 프레임 조립', category: 'material',
    description: 'R22 소형 헬기 규격 동체. 조종석 + 엔진 베드 + 꼬리 빔 통합 프레임.',
    output: [{ definitionId: 'fuselage_frame', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 7, building: 5, armorcraft: 3 },
    stages: [
      {
        stageIndex: 0, label: '조종석 셸', tpCost: 8,
        requiredItems: [
          { definitionId: 'aviation_alloy', qty: 4 },
          { definitionId: 'glass_shard',    qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '엔진 베드·리벳 고정', tpCost: 6,
        requiredItems: [
          { definitionId: 'aviation_alloy', qty: 3 },
          { definitionId: 'nail',           qty: 20 },
          { definitionId: 'duct_tape',      qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '꼬리 빔 결합', tpCost: 5,
        requiredItems: [
          { definitionId: 'aviation_alloy', qty: 2 },
          { definitionId: 'rope',           qty: 3 },
          { definitionId: 'rubber',         qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
  },

  refine_avgas: {
    id: 'refine_avgas', name: '항공 가솔린 정제', category: 'material',
    description: '자동차 연료통 5개를 증류·첨가제 혼합해 100LL 항공 가솔린으로 정제한다.',
    output: [{ definitionId: 'avgas_drum', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 5, cooking: 3 },
    stages: [{
      stageIndex: 0, label: '증류·정제', tpCost: 8,
      requiredItems: [
        { definitionId: 'fuel_can',          qty: 5 },
        { definitionId: 'alcohol_solution',  qty: 2 },
        { definitionId: 'charcoal_filter',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  셰프 전용 특별 요리 (윤재혁) — 희귀 식재료 기반 고급 요리
  // ══════════════════════════════════════════════════════════════

  gourmet_steak: {
    id: 'gourmet_steak', name: '고메 스테이크', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3 } },
    description: '와규 스크랩을 소금과 허브로 밑간하여 굽는 셰프의 시그니처 스테이크. 사기 +30.',
    output: [{ definitionId: 'gourmet_steak', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 3 },
    skillOverride: 'cooking',
    stages: [{
      stageIndex: 0, label: '굽기·플레이팅', tpCost: 5,
      requiredItems: [
        { definitionId: 'wagyu_scrap', qty: 1 },
        { definitionId: 'salt',        qty: 1 },
        { definitionId: 'herb',        qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  traditional_feast: {
    id: 'traditional_feast', name: '한상차림', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3 } },
    description: '야생 꿀·6년근 인삼·쌀·허브로 차려낸 전통 한상. 함께 먹는 동료의 사기까지 올린다.',
    output: [{ definitionId: 'traditional_feast', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 3 },
    skillOverride: 'cooking',
    stages: [{
      stageIndex: 0, label: '한상 차리기', tpCost: 6,
      requiredItems: [
        { definitionId: 'wild_honey',     qty: 1 },
        { definitionId: 'ginseng_6years', qty: 1 },
        { definitionId: 'rice',           qty: 2 },
        { definitionId: 'herb',           qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  truffle_risotto: {
    id: 'truffle_risotto', name: '송로 리조또', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3 } },
    description: '송로버섯을 얇게 저며 끓인 리조또. 섭취 후 일정 시간 감염 저항이 상승한다.',
    output: [{ definitionId: 'truffle_risotto', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 3 },
    skillOverride: 'cooking',
    stages: [{
      stageIndex: 0, label: '리조또 조리', tpCost: 5,
      requiredItems: [
        { definitionId: 'truffle',        qty: 1 },
        { definitionId: 'rice',           qty: 2 },
        { definitionId: 'purified_water', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  seafood_platter: {
    id: 'seafood_platter', name: '해산물 플래터', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3 } },
    description: '전복·킹크랩·사프란을 조화롭게 배합한 호화 플래터. HP 회복폭이 크다.',
    output: [{ definitionId: 'seafood_platter', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 3 },
    skillOverride: 'cooking',
    stages: [{
      stageIndex: 0, label: '손질·조리·플레이팅', tpCost: 6,
      requiredItems: [
        { definitionId: 'abalone',       qty: 1 },
        { definitionId: 'king_crab',     qty: 1 },
        { definitionId: 'saffron_dried', qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  special_soup: {
    id: 'special_soup', name: '원기 회복탕', category: 'food',
    hidden: true, unlockConditions: { minSkillLevel: { cooking: 3 } },
    description: '송이·6년근 인삼·정수된 물로 푹 고아낸 약선탕. 깊은 절망마저 씻어낸다.',
    output: [{ definitionId: 'special_soup', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { cooking: 3 },
    skillOverride: 'cooking',
    stages: [{
      stageIndex: 0, label: '약선 고기', tpCost: 6,
      requiredItems: [
        { definitionId: 'matsutake_mushroom', qty: 1 },
        { definitionId: 'ginseng_6years',    qty: 1 },
        { definitionId: 'purified_water',    qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  장비 개조 (Upgrade) — 기계공 특성 & 범용
  //  기존 무기·방어구·도구를 소비해 상위 버전으로 교체
  // ══════════════════════════════════════════════════════════════

  // ─── 무기 개조 (6) ─────────────────────────────────────────

  upgrade_iron_pipe: {
    id: 'upgrade_iron_pipe', name: '강화 철봉 개조', category: 'upgrade',
    description: '기존 철파이프를 고철과 덕트테이프로 보강. 데미지 +20%, 내구도 +30%.',
    output: [{ definitionId: 'iron_pipe_reinforced', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '개조 작업', tpCost: 5,
      requiredItems: [
        { definitionId: 'iron_pipe',   qty: 1 },
        { definitionId: 'scrap_metal', qty: 2 },
        { definitionId: 'duct_tape',   qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_knife: {
    id: 'upgrade_knife', name: '연마된 칼 개조', category: 'upgrade',
    description: '칼날을 숫돌로 세밀히 연마하고 손잡이를 재감싼다. 데미지 +15%, 치명타 +5%.',
    output: [{ definitionId: 'sharpened_knife_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '날 연마', tpCost: 5,
      requiredItems: [
        { definitionId: 'knife',        qty: 1 },
        { definitionId: 'whetstone',    qty: 1 },
        { definitionId: 'leather',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_bat: {
    id: 'upgrade_bat', name: '강화 배트 개조', category: 'upgrade',
    description: '야구배트에 못과 철판을 박아 타격력 강화. 데미지 +25%, 내구도 +40%.',
    output: [{ definitionId: 'reinforced_bat_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '배트 보강', tpCost: 5,
      requiredItems: [
        { definitionId: 'baseball_bat', qty: 1 },
        { definitionId: 'nail',         qty: 5 },
        { definitionId: 'scrap_metal',  qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_machete: {
    id: 'upgrade_machete', name: '출혈 마체테 개조', category: 'upgrade',
    description: '마체테 날에 톱니를 새겨 출혈을 유발. 데미지 +20%, 출혈 확률 +10%.',
    output: [{ definitionId: 'machete_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 4, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '톱니 가공', tpCost: 5,
      requiredItems: [
        { definitionId: 'machete',     qty: 1 },
        { definitionId: 'sharp_blade', qty: 1 },
        { definitionId: 'whetstone',   qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_spear: {
    id: 'upgrade_spear', name: '관통 창 개조', category: 'upgrade',
    description: '창촉을 강철로 교체하고 샤프트를 연장. 데미지 +25%, 관통 대상 2명 유지.',
    output: [{ definitionId: 'spear_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 4, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '창촉 교체', tpCost: 5,
      requiredItems: [
        { definitionId: 'spear',        qty: 1 },
        { definitionId: 'sharp_blade',  qty: 1 },
        { definitionId: 'scrap_metal',  qty: 2 },
        { definitionId: 'rope',         qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_crossbow: {
    id: 'upgrade_crossbow', name: '정밀 석궁 개조', category: 'upgrade',
    description: '조준 장치와 현을 교체해 명중률 향상. 데미지 +20%, 명중률 +10%.',
    output: [{ definitionId: 'crossbow_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 4, crafting: 3 },
    stages: [{
      stageIndex: 0, label: '조준·현 교체', tpCost: 6,
      requiredItems: [
        { definitionId: 'crossbow', qty: 1 },
        { definitionId: 'spring',   qty: 2 },
        { definitionId: 'rope',     qty: 1 },
        { definitionId: 'wood',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  // ─── 방어구 개조 (5) ───────────────────────────────────────

  upgrade_vest: {
    id: 'upgrade_vest', name: '강화 전술조끼 개조', category: 'upgrade',
    description: '전술조끼에 추가 방탄 플레이트를 삽입. 방어력 +2, 내구도 +30%.',
    output: [{ definitionId: 'tactical_vest_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '플레이트 삽입', tpCost: 5,
      requiredItems: [
        { definitionId: 'tactical_vest', qty: 1 },
        { definitionId: 'scrap_metal',   qty: 2 },
        { definitionId: 'leather',       qty: 2 },
        { definitionId: 'thread',        qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_helmet: {
    id: 'upgrade_helmet', name: '강화 헬멧 개조', category: 'upgrade',
    description: '헬멧 안쪽에 충격 흡수 패드 추가. 방어력 +1, 치명타 저항 +15%.',
    output: [{ definitionId: 'helmet_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '패드 장착', tpCost: 5,
      requiredItems: [
        { definitionId: 'helmet',      qty: 1 },
        { definitionId: 'scrap_metal', qty: 1 },
        { definitionId: 'cloth',       qty: 2 },
        { definitionId: 'rubber',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_boots: {
    id: 'upgrade_boots', name: '경량 전투화 개조', category: 'upgrade',
    description: '밑창을 경량 고무로 교체해 피로도 경감. 체력 소모 -10%.',
    output: [{ definitionId: 'combat_boots_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '밑창 교체', tpCost: 5,
      requiredItems: [
        { definitionId: 'combat_boots', qty: 1 },
        { definitionId: 'rubber',       qty: 2 },
        { definitionId: 'leather',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_gloves: {
    id: 'upgrade_gloves', name: '정밀 작업장갑 개조', category: 'upgrade',
    description: '손끝에 정밀 가공 패치를 덧대 작업 정확도 향상. 제작 성공률 +5%.',
    output: [{ definitionId: 'work_gloves_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 2, crafting: 3 },
    stages: [{
      stageIndex: 0, label: '패치 작업', tpCost: 3,
      requiredItems: [
        { definitionId: 'work_gloves', qty: 1 },
        { definitionId: 'leather',     qty: 1 },
        { definitionId: 'thread',      qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_raincoat: {
    id: 'upgrade_raincoat', name: '방사선 우비 개조', category: 'upgrade',
    description: '우비 내피에 납판을 덧대 방사선 차폐력 강화. 방사선 저항 +15%.',
    output: [{ definitionId: 'raincoat_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 3, crafting: 2 },
    stages: [{
      stageIndex: 0, label: '납판 내장', tpCost: 5,
      requiredItems: [
        { definitionId: 'raincoat',  qty: 1 },
        { definitionId: 'rubber',    qty: 2 },
        { definitionId: 'duct_tape', qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  // ─── 도구 개조 (4) ─────────────────────────────────────────

  upgrade_pipe_wrench: {
    id: 'upgrade_pipe_wrench', name: '장인 파이프렌치 개조', category: 'upgrade',
    description: '파이프렌치 그립과 톱니 정밀도 향상. 제작 속도 +20%.',
    output: [{ definitionId: 'pipe_wrench_master', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 4 },
    stages: [{
      stageIndex: 0, label: '정밀 가공', tpCost: 5,
      requiredItems: [
        { definitionId: 'pipe_wrench', qty: 1 },
        { definitionId: 'scrap_metal', qty: 2 },
        { definitionId: 'leather',     qty: 1 },
        { definitionId: 'spring',      qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_flashlight: {
    id: 'upgrade_flashlight', name: '장시간 손전등 개조', category: 'upgrade',
    description: '배터리 용량을 2배로 교체. 사용 시간 +50%.',
    output: [{ definitionId: 'flashlight_plus', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 3 },
    stages: [{
      stageIndex: 0, label: '배터리 교체', tpCost: 3,
      requiredItems: [
        { definitionId: 'flashlight',       qty: 1 },
        { definitionId: 'electronic_parts', qty: 1 },
        { definitionId: 'wire',             qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_compass: {
    id: 'upgrade_compass', name: '고급 나침반 개조', category: 'upgrade',
    description: '자기장 센서와 지도를 결합. 숨겨진 장소 2곳을 드러낸다.',
    output: [{ definitionId: 'compass_advanced', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 4 },
    stages: [{
      stageIndex: 0, label: '센서 조정', tpCost: 5,
      requiredItems: [
        { definitionId: 'compass',          qty: 1 },
        { definitionId: 'electronic_parts', qty: 1 },
        { definitionId: 'map_fragment',     qty: 1 },
      ],
      consumeAt: 'start',
    }],
  },

  upgrade_binoculars: {
    id: 'upgrade_binoculars', name: '프로 쌍안경 개조', category: 'upgrade',
    description: '렌즈를 정밀 연마하고 배율 보정. 조우 예측 +1회.',
    output: [{ definitionId: 'binoculars_pro', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 4 },
    stages: [{
      stageIndex: 0, label: '렌즈 연마', tpCost: 5,
      requiredItems: [
        { definitionId: 'binoculars',  qty: 1 },
        { definitionId: 'glass_shard', qty: 2 },
        { definitionId: 'plastic',     qty: 2 },
      ],
      consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  확장 의료 블루프린트 (10) — Phase 4
  // ══════════════════════════════════════════════════════════════

  craft_reinforced_bandage: {
    id: 'craft_reinforced_bandage', name: '강화 붕대 제작', category: 'medical',
    description: '일반 붕대를 알코올로 소독하여 강화.',
    output: [{ definitionId: 'reinforced_bandage', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 2 },
    stages: [{ stageIndex: 0, label: '소독·강화', tpCost: 3,
      requiredItems: [
        { definitionId: 'bandage',          qty: 2 },
        { definitionId: 'alcohol_solution', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  craft_field_antidote: {
    id: 'craft_field_antidote', name: '야전 해독제 제작', category: 'medical',
    description: '약초와 활성탄으로 응급 해독제.',
    output: [{ definitionId: 'field_antidote', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 3 },
    stages: [{ stageIndex: 0, label: '조제', tpCost: 3,
      requiredItems: [
        { definitionId: 'herb',     qty: 3 },
        { definitionId: 'charcoal', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  craft_vitamin_complex: {
    id: 'craft_vitamin_complex', name: '비타민 복합제 제작', category: 'medical',
    description: '약초를 농축해 비타민 복합제로.',
    output: [{ definitionId: 'vitamin_complex', qty: 2 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 2 },
    stages: [{ stageIndex: 0, label: '농축', tpCost: 3,
      requiredItems: [
        { definitionId: 'herb',       qty: 4 },
        { definitionId: 'wild_berry', qty: 2 },
      ], consumeAt: 'start',
    }],
  },
  craft_iv_saline: {
    id: 'craft_iv_saline', name: '생리식염수 IV 제작', category: 'medical',
    description: '정수·소금으로 수액 제작.',
    output: [{ definitionId: 'iv_saline', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 3 },
    stages: [{ stageIndex: 0, label: '조제', tpCost: 3,
      requiredItems: [
        { definitionId: 'purified_water', qty: 2 },
        { definitionId: 'salt',            qty: 2 },
        { definitionId: 'plastic',         qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  craft_stabilizer_shot: {
    id: 'craft_stabilizer_shot', name: '안정제 주사 제작', category: 'medical',
    description: '진통·지혈 성분 복합 주사.',
    output: [{ definitionId: 'stabilizer_shot', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 4 },
    stages: [{ stageIndex: 0, label: '조제', tpCost: 3,
      requiredItems: [
        { definitionId: 'painkiller',       qty: 1 },
        { definitionId: 'alcohol_solution', qty: 1 },
        { definitionId: 'bandage',          qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  craft_infection_serum: {
    id: 'craft_infection_serum', name: '감염 혈청 제작', category: 'medical',
    description: '항바이러스 농축 혈청.',
    output: [{ definitionId: 'infection_serum', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 5 },
    stages: [{ stageIndex: 0, label: '혈청 조제', tpCost: 5,
      requiredItems: [
        { definitionId: 'antibiotics', qty: 2 },
        { definitionId: 'herb',         qty: 4 },
      ], consumeAt: 'start',
    }],
  },
  craft_rad_blocker_plus: {
    id: 'craft_rad_blocker_plus', name: '강화 방사선 차단제', category: 'medical',
    description: '납 분말 + 활성탄 복합 차단제.',
    output: [{ definitionId: 'rad_blocker_plus', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 4 },
    stages: [{ stageIndex: 0, label: '조제', tpCost: 5,
      requiredItems: [
        { definitionId: 'rad_blocker',    qty: 1 },
        { definitionId: 'charcoal',       qty: 3 },
        { definitionId: 'scrap_metal',    qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  craft_painkiller_field: {
    id: 'craft_painkiller_field', name: '야전 진통제 제작', category: 'medical',
    description: '고농도 진통제.',
    output: [{ definitionId: 'painkiller_field', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 3 },
    stages: [{ stageIndex: 0, label: '조제', tpCost: 3,
      requiredItems: [
        { definitionId: 'painkiller',       qty: 2 },
        { definitionId: 'alcohol_solution', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  craft_adrenaline_shot: {
    id: 'craft_adrenaline_shot', name: '아드레날린 주사 제작', category: 'medical',
    description: '응급 각성 주사.',
    output: [{ definitionId: 'adrenaline_shot', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 5 },
    stages: [{ stageIndex: 0, label: '조제', tpCost: 5,
      requiredItems: [
        { definitionId: 'stimulant', qty: 2 },
        { definitionId: 'herb',      qty: 3 },
      ], consumeAt: 'start',
    }],
  },
  craft_herbal_tonic: {
    id: 'craft_herbal_tonic', name: '약초 강장제 제작', category: 'medical',
    description: '약초를 끓여 만든 강장제.',
    output: [{ definitionId: 'herbal_tonic', qty: 1 }],
    requiredTools: ['medical_station'], requiredSkills: { medicine: 2 },
    stages: [{ stageIndex: 0, label: '끓이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'herb',            qty: 4 },
        { definitionId: 'purified_water',  qty: 1 },
      ], consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  야전 병원 구조물 블루프린트 (10) — Phase 4
  // ══════════════════════════════════════════════════════════════

  build_medical_bed: {
    id: 'build_medical_bed', name: '의료 침대 제작', category: 'structure',
    description: '야전 의료용 침대.',
    output: [{ definitionId: 'medical_bed', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 3, crafting: 2 },
    stages: [
      { stageIndex: 0, label: '골격 제작', tpCost: 5,
        requiredItems: [{ definitionId: 'scrap_metal', qty: 4 }, { definitionId: 'wood_plank', qty: 3 }],
        consumeAt: 'start',
      },
      { stageIndex: 1, label: '매트 설치', tpCost: 3,
        requiredItems: [{ definitionId: 'cloth', qty: 5 }, { definitionId: 'cloth_scrap', qty: 5 }],
        consumeAt: 'start',
      },
    ],
  },
  build_surgical_table: {
    id: 'build_surgical_table', name: '수술대 제작', category: 'structure',
    description: '정밀 수술용 작업대.',
    output: [{ definitionId: 'surgical_table', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 5, crafting: 3 },
    stages: [{ stageIndex: 0, label: '조립', tpCost: 6,
      requiredItems: [
        { definitionId: 'scrap_metal',      qty: 6 },
        { definitionId: 'electronic_parts', qty: 2 },
      ], consumeAt: 'start',
    }],
  },
  build_isolation_ward: {
    id: 'build_isolation_ward', name: '격리 병동 제작', category: 'structure',
    description: '감염자 격리 시설.',
    output: [{ definitionId: 'isolation_ward', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 5, medicine: 2 },
    stages: [{ stageIndex: 0, label: '격리 시설 설치', tpCost: 8,
      requiredItems: [
        { definitionId: 'scrap_metal', qty: 5 },
        { definitionId: 'plastic',     qty: 5 },
        { definitionId: 'duct_tape',   qty: 3 },
      ], consumeAt: 'start',
    }],
  },
  build_medical_cabinet: {
    id: 'build_medical_cabinet', name: '약품 보관장 제작', category: 'structure',
    description: '의료품 저장용 캐비닛.',
    output: [{ definitionId: 'medical_cabinet', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 3, crafting: 2 },
    stages: [{ stageIndex: 0, label: '조립', tpCost: 5,
      requiredItems: [
        { definitionId: 'wood_plank',  qty: 4 },
        { definitionId: 'scrap_metal', qty: 2 },
        { definitionId: 'nail',        qty: 10 },
      ], consumeAt: 'start',
    }],
  },
  build_water_purifier: {
    id: 'build_water_purifier', name: '정수 시설 제작', category: 'structure',
    description: '자동 정수 시설.',
    output: [{ definitionId: 'water_purifier', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 4, crafting: 3 },
    stages: [{ stageIndex: 0, label: '설비 조립', tpCost: 6,
      requiredItems: [
        { definitionId: 'scrap_metal',      qty: 4 },
        { definitionId: 'charcoal_filter',  qty: 2 },
        { definitionId: 'empty_bottle',     qty: 3 },
      ], consumeAt: 'start',
    }],
  },
  build_blood_bank: {
    id: 'build_blood_bank', name: '혈액 은행 제작', category: 'structure',
    description: 'IV 혈액 저장·관리.',
    output: [{ definitionId: 'blood_bank', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 5, medicine: 3 },
    stages: [{ stageIndex: 0, label: '냉장·보관 시설', tpCost: 6,
      requiredItems: [
        { definitionId: 'scrap_metal',      qty: 4 },
        { definitionId: 'electronic_parts', qty: 3 },
        { definitionId: 'empty_bottle',     qty: 5 },
      ], consumeAt: 'start',
    }],
  },
  build_quarantine_station: {
    id: 'build_quarantine_station', name: '방역 스테이션 제작', category: 'structure',
    description: '주변 감염 저항 부여 시설.',
    output: [{ definitionId: 'quarantine_station', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 4, medicine: 2 },
    stages: [{ stageIndex: 0, label: '설치', tpCost: 6,
      requiredItems: [
        { definitionId: 'scrap_metal',      qty: 3 },
        { definitionId: 'alcohol_solution', qty: 3 },
        { definitionId: 'plastic',          qty: 3 },
      ], consumeAt: 'start',
    }],
  },
  build_xray_station: {
    id: 'build_xray_station', name: 'X-ray 스테이션 제작', category: 'structure',
    description: '고급 X-ray 진단 시설.',
    output: [{ definitionId: 'xray_station', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 6, medicine: 4 },
    stages: [{ stageIndex: 0, label: '정밀 조립', tpCost: 8,
      requiredItems: [
        { definitionId: 'scrap_metal',      qty: 5 },
        { definitionId: 'electronic_parts', qty: 5 },
        { definitionId: 'glass_shard',      qty: 3 },
      ], consumeAt: 'start',
    }],
  },
  build_incubator: {
    id: 'build_incubator', name: '인큐베이터 제작', category: 'structure',
    description: '샘플·신생아 보존 시설.',
    output: [{ definitionId: 'incubator', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 5, medicine: 3 },
    stages: [{ stageIndex: 0, label: '조립', tpCost: 6,
      requiredItems: [
        { definitionId: 'scrap_metal',      qty: 3 },
        { definitionId: 'electronic_parts', qty: 3 },
        { definitionId: 'glass_shard',      qty: 4 },
      ], consumeAt: 'start',
    }],
  },
  build_analysis_lab: {
    id: 'build_analysis_lab', name: '분석실 제작', category: 'structure',
    description: '고급 연구·분석 실험실.',
    output: [{ definitionId: 'analysis_lab', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { building: 7, medicine: 5, crafting: 4 },
    stages: [{ stageIndex: 0, label: '실험실 구축', tpCost: 8,
      requiredItems: [
        { definitionId: 'scrap_metal',      qty: 6 },
        { definitionId: 'electronic_parts', qty: 6 },
        { definitionId: 'glass_shard',      qty: 6 },
      ], consumeAt: 'start',
    }],
  },

  // ══════════════════════════════════════════════════════════════
  //  확장 요리 블루프린트 (20) — Phase 4
  //  한식 5 + 양식 5 + 디저트 5 + 특수 5
  // ══════════════════════════════════════════════════════════════

  // — 한식 (5) —
  cook_kimchi_stew: {
    id: 'cook_kimchi_stew', name: '김치찌개 조리', category: 'food',
    description: '김치와 돼지고기, 물로 끓이는 얼큰한 찌개.',
    output: [{ definitionId: 'kimchi_stew', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 2 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '끓이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 1 },
        { definitionId: 'purified_water', qty: 1 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_soybean_stew: {
    id: 'cook_soybean_stew', name: '된장찌개 조리', category: 'food',
    description: '발효 된장과 채소로 끓이는 구수한 찌개.',
    output: [{ definitionId: 'soybean_stew', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 2 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '끓이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'herb', qty: 2 },
        { definitionId: 'purified_water', qty: 1 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_galbi_jjim: {
    id: 'cook_galbi_jjim', name: '갈비찜 조리', category: 'food',
    description: '갈비를 오래 조리해 만드는 고급 한식.',
    output: [{ definitionId: 'galbi_jjim', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { cooking: 4 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '오랜 조리', tpCost: 6,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 3 },
        { definitionId: 'wild_honey', qty: 1 },
        { definitionId: 'salt', qty: 2 },
      ], consumeAt: 'start',
    }],
  },
  cook_bibimbap_chef: {
    id: 'cook_bibimbap_chef', name: '비빔밥 조리 (셰프)', category: 'food',
    description: '밥과 채소, 고기를 비벼 균형 잡힌 한 끼.',
    output: [{ definitionId: 'bibimbap', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 2 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '볶기와 비빔', tpCost: 3,
      requiredItems: [
        { definitionId: 'rice', qty: 1 },
        { definitionId: 'raw_meat', qty: 1 },
        { definitionId: 'herb', qty: 2 },
      ], consumeAt: 'start',
    }],
  },
  cook_cold_noodles: {
    id: 'cook_cold_noodles', name: '냉면 조리', category: 'food',
    description: '차갑게 식힌 국수. 더위에 좋다.',
    output: [{ definitionId: 'cold_noodles', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '삶기와 냉각', tpCost: 3,
      requiredItems: [
        { definitionId: 'instant_noodles', qty: 1 },
        { definitionId: 'purified_water', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },

  // — 양식 (5) —
  cook_tomato_pasta: {
    id: 'cook_tomato_pasta', name: '토마토 파스타 조리', category: 'food',
    description: '토마토 소스로 볶은 파스타.',
    output: [{ definitionId: 'tomato_pasta', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '삶기와 볶기', tpCost: 3,
      requiredItems: [
        { definitionId: 'instant_noodles', qty: 1 },
        { definitionId: 'wild_berry', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_grilled_steak: {
    id: 'cook_grilled_steak', name: '구운 스테이크', category: 'food',
    description: '고기를 직화로 구워 내는 스테이크.',
    output: [{ definitionId: 'grilled_steak', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '직화 굽기', tpCost: 3,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_cream_soup: {
    id: 'cook_cream_soup', name: '크림 수프 조리', category: 'food',
    description: '진한 크림으로 만든 따뜻한 수프.',
    output: [{ definitionId: 'cream_soup', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 2 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '끓이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'purified_water', qty: 2 },
        { definitionId: 'herb', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_garden_salad: {
    id: 'cook_garden_salad', name: '정원 샐러드', category: 'food',
    description: '신선한 채소로 만든 가벼운 식사.',
    output: [{ definitionId: 'garden_salad', qty: 1 }],
    requiredTools: [], requiredSkills: { cooking: 1 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '손질과 버무리기', tpCost: 1,
      requiredItems: [
        { definitionId: 'herb', qty: 3 },
        { definitionId: 'wild_berry', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_mushroom_risotto: {
    id: 'cook_mushroom_risotto', name: '버섯 리조토 조리', category: 'food',
    description: '쌀과 버섯으로 만든 크리미한 요리.',
    output: [{ definitionId: 'mushroom_risotto', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '조리', tpCost: 5,
      requiredItems: [
        { definitionId: 'rice', qty: 1 },
        { definitionId: 'matsutake_mushroom', qty: 1 },
        { definitionId: 'purified_water', qty: 1 },
      ], consumeAt: 'start',
    }],
  },

  // — 디저트 (5) —
  cook_hard_bread: {
    id: 'cook_hard_bread', name: '단단한 빵 굽기', category: 'food',
    description: '오래 보관되는 단단한 빵.',
    output: [{ definitionId: 'hard_bread', qty: 2 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 2 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '반죽과 굽기', tpCost: 5,
      requiredItems: [
        { definitionId: 'rice', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_honey_cookies: {
    id: 'cook_honey_cookies', name: '꿀 쿠키 굽기', category: 'food',
    description: '꿀을 넣어 달콤하게 구운 쿠키.',
    output: [{ definitionId: 'honey_cookies', qty: 3 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '굽기', tpCost: 3,
      requiredItems: [
        { definitionId: 'wild_honey', qty: 1 },
        { definitionId: 'rice', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_sponge_cake: {
    id: 'cook_sponge_cake', name: '스펀지 케이크', category: 'food',
    description: '푹신한 케이크. 사기가 크게 오른다.',
    output: [{ definitionId: 'sponge_cake', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { cooking: 5 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '오븐 굽기', tpCost: 5,
      requiredItems: [
        { definitionId: 'wild_honey', qty: 2 },
        { definitionId: 'rice', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_pudding: {
    id: 'cook_pudding', name: '푸딩 조리', category: 'food',
    description: '부드럽고 달콤한 푸딩.',
    output: [{ definitionId: 'pudding', qty: 2 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '중탕·냉각', tpCost: 3,
      requiredItems: [
        { definitionId: 'wild_honey', qty: 1 },
        { definitionId: 'purified_water', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_dark_chocolate: {
    id: 'cook_dark_chocolate', name: '다크 초콜릿', category: 'food',
    description: '쓴맛이 강한 고급 초콜릿. 피로 회복.',
    output: [{ definitionId: 'dark_chocolate', qty: 3 }],
    requiredTools: ['workbench'], requiredSkills: { cooking: 4 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '템퍼링', tpCost: 5,
      requiredItems: [
        { definitionId: 'wild_honey', qty: 2 },
        { definitionId: 'charcoal', qty: 1 },
      ], consumeAt: 'start',
    }],
  },

  // — 특수 (5) —
  cook_recovery_stew: {
    id: 'cook_recovery_stew', name: '보양식 조리', category: 'food',
    description: '인삼과 고기로 끓이는 몸보신 탕.',
    output: [{ definitionId: 'recovery_stew', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 4 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '장시간 조리', tpCost: 6,
      requiredItems: [
        { definitionId: 'ginseng_6years', qty: 1 },
        { definitionId: 'raw_meat', qty: 2 },
        { definitionId: 'purified_water', qty: 2 },
      ], consumeAt: 'start',
    }],
  },
  cook_hangover_soup: {
    id: 'cook_hangover_soup', name: '해장국 조리', category: 'food',
    description: '속을 풀어주는 뜨끈한 국물.',
    output: [{ definitionId: 'hangover_soup', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '끓이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 1 },
        { definitionId: 'herb', qty: 2 },
        { definitionId: 'purified_water', qty: 2 },
      ], consumeAt: 'start',
    }],
  },
  cook_fish_cake_stew: {
    id: 'cook_fish_cake_stew', name: '어묵탕 조리', category: 'food',
    description: '생선 살을 반죽해 끓이는 따끈한 탕.',
    output: [{ definitionId: 'fish_cake_stew', qty: 1 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 3 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '반죽·끓이기', tpCost: 5,
      requiredItems: [
        { definitionId: 'raw_fish', qty: 2 },
        { definitionId: 'salt', qty: 1 },
        { definitionId: 'purified_water', qty: 2 },
      ], consumeAt: 'start',
    }],
  },
  cook_hot_pot: {
    id: 'cook_hot_pot', name: '전골 조리', category: 'food',
    description: '고기·채소·해물을 한 냄비에. 동료와 나눠 먹는다.',
    output: [{ definitionId: 'hot_pot', qty: 1 }],
    requiredTools: ['workbench'], requiredSkills: { cooking: 5 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '전골 끓이기', tpCost: 6,
      requiredItems: [
        { definitionId: 'raw_meat', qty: 2 },
        { definitionId: 'herb', qty: 3 },
        { definitionId: 'purified_water', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },
  cook_rice_porridge: {
    id: 'cook_rice_porridge', name: '죽 조리', category: 'food',
    description: '소화가 잘되는 부드러운 죽. 환자에게 좋다.',
    output: [{ definitionId: 'rice_porridge', qty: 2 }],
    requiredTools: ['campfire'], requiredSkills: { cooking: 2 }, skillOverride: 'cooking',
    stages: [{ stageIndex: 0, label: '끓이기', tpCost: 3,
      requiredItems: [
        { definitionId: 'rice', qty: 1 },
        { definitionId: 'purified_water', qty: 2 },
        { definitionId: 'salt', qty: 1 },
      ], consumeAt: 'start',
    }],
  },

};

export default BLUEPRINTS;
