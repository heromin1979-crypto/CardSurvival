// === HIDDEN RECIPE DEFINITIONS (24 legendary recipes) ===
// hidden: true — 일반 제작 목록에 표시되지 않음
// rarity: 'legendary' — 모든 히든 레시피는 전설 등급
// unlockConditions: 발견 조건 (히든 장소, 보스 처치, 캐릭터 전용 등)
// consumeAt: 'start' | 'complete'
// requiredTools: [definitionId] — 보드에 설치된 구조물/도구 필요

const HIDDEN_RECIPES = {

  // ══════════════════════════════════════════════════════════════
  //  전설 무기 (Legendary Weapons) — 5
  // ══════════════════════════════════════════════════════════════

  acid_whip: {
    id: 'acid_whip', name: '산성 채찍', category: 'weapon',
    description: '산성 분비물로 코팅된 채찍. 적중 시 지속 산성 피해를 입힌다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'acid_whip', qty: 1 }],
    requiredTools: ['master_forge'],
    requiredSkills: { weaponcraft: 6 },
    stages: [
      {
        stageIndex: 0, label: '산 추출', tpCost: 3,
        requiredItems: [
          { definitionId: 'acid_gland', qty: 1 },
          { definitionId: 'rope', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '채찍 조립', tpCost: 2,
        requiredItems: [
          { definitionId: 'leather', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: 'boss_acid_queen',
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  explosive_bolt: {
    id: 'explosive_bolt', name: '폭발 석궁 화살', category: 'weapon',
    description: '화약이 내장된 석궁 화살. 명중 시 폭발하여 범위 피해를 준다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'explosive_bolt', qty: 3 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 5, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '화살 개조', tpCost: 2,
        requiredItems: [
          { definitionId: 'crossbow_bolt', qty: 3 },
          { definitionId: 'gunpowder', qty: 1 },
          { definitionId: 'wire', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 50,
      minCraftLevel: 5,
      requiredItems: [],
      customUnlock: null,
    },
  },

  electric_blade: {
    id: 'electric_blade', name: '전기 칼날', category: 'weapon',
    description: '전기 충격을 방출하는 개조 칼날. 적중 시 감전 효과를 부여한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'electric_blade', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 5, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '전기 회로 장착', tpCost: 3,
        requiredItems: [
          { definitionId: 'knife', qty: 1 },
          { definitionId: 'electronic_parts', qty: 2 },
          { definitionId: 'wire', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '절연 마감', tpCost: 2,
        requiredItems: [
          { definitionId: 'spring', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_seongdong_forge_master',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  silenced_pistol: {
    id: 'silenced_pistol', name: '소음기 권총', category: 'weapon',
    description: '수제 소음기를 장착한 권총. 사격 시 소음이 크게 감소한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'silenced_pistol', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 5, ranged: 3 },
    stages: [
      {
        stageIndex: 0, label: '소음기 제작', tpCost: 3,
        requiredItems: [
          { definitionId: 'pistol', qty: 1 },
          { definitionId: 'scrap_metal', qty: 2 },
          { definitionId: 'rubber', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '결합', tpCost: 1,
        requiredItems: [
          { definitionId: 'duct_tape', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 40,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
      minSkillLevel: { ranged: 3 },
    },
  },

  ultra_reinforced_bat: {
    id: 'ultra_reinforced_bat', name: '극강화 배트', category: 'weapon',
    description: '철골 보강과 철사 감기를 거친 최종 형태의 배트. 압도적인 타격력.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'ultra_reinforced_bat', qty: 1 }],
    requiredTools: ['master_forge'],
    requiredSkills: { weaponcraft: 6, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '강화 골격 부착', tpCost: 3,
        requiredItems: [
          { definitionId: 'reinforced_bat', qty: 1 },
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'wire', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '최종 마감', tpCost: 2,
        requiredItems: [
          { definitionId: 'duct_tape', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_guro_factory_forge',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  전설 방어구 (Legendary Armor) — 3
  // ══════════════════════════════════════════════════════════════

  dragon_scale_vest: {
    id: 'dragon_scale_vest', name: '변이체 강화 방탄복', category: 'armor',
    description: '변이체의 외피를 가공해 만든 최고급 방탄복. 거의 모든 물리 피해를 흡수한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'dragon_scale_vest', qty: 1 }],
    requiredTools: ['master_forge'],
    requiredSkills: { armorcraft: 8, crafting: 4 },
    stages: [
      {
        stageIndex: 0, label: '비늘 가공', tpCost: 4,
        requiredItems: [
          { definitionId: 'mutant_heart', qty: 1 },
          { definitionId: 'kevlar_fabric', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '골격 삽입', tpCost: 3,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '마감', tpCost: 2,
        requiredItems: [
          { definitionId: 'leather', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_guro_factory_forge',
      bossKillId: 'boss_escaped_experiment',
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  extreme_cold_suit: {
    id: 'extreme_cold_suit', name: '극한 방한복', category: 'armor',
    description: '극저온 코어를 활용한 단열 방한복. 혹한에서도 체온을 유지한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'extreme_cold_suit', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 6, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '단열층 제작', tpCost: 4,
        requiredItems: [
          { definitionId: 'cryo_core', qty: 1 },
          { definitionId: 'cloth', qty: 5 },
          { definitionId: 'leather', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '방한 마감', tpCost: 3,
        requiredItems: [
          { definitionId: 'thread', qty: 5 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: 'boss_frozen_giant',
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: 'boss_frozen_giant 또는 boss_blizzard_wraith 처치 시 해금',
    },
  },

  stealth_suit: {
    id: 'stealth_suit', name: '은밀 슈트', category: 'armor',
    description: '소음 흡수 소재로 제작된 전신 슈트. 적 감지 확률을 대폭 낮춘다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'stealth_suit', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 8, crafting: 4 },
    stages: [
      {
        stageIndex: 0, label: '소재 재단', tpCost: 3,
        requiredItems: [
          { definitionId: 'cloth', qty: 5 },
          { definitionId: 'leather', qty: 3 },
          { definitionId: 'rubber', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '봉제', tpCost: 3,
        requiredItems: [
          { definitionId: 'thread', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 60,
      minCraftLevel: 8,
      requiredItems: [],
      customUnlock: null,
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  전설 의료 (Legendary Medical) — 4
  // ══════════════════════════════════════════════════════════════

  vaccine: {
    id: 'vaccine', name: '백신', category: 'medical',
    description: '바이러스 샘플로부터 정제한 백신. 감염을 완전히 치료한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'vaccine', qty: 1 }],
    requiredTools: ['workbench', 'medical_station'],
    requiredSkills: { crafting: 5, medicine: 6 },
    stages: [
      {
        stageIndex: 0, label: '배양', tpCost: 4,
        requiredItems: [
          { definitionId: 'virus_sample', qty: 1 },
          { definitionId: 'antibiotics', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '정제', tpCost: 3,
        requiredItems: [
          { definitionId: 'antiseptic', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '충전', tpCost: 3,
        requiredItems: [
          { definitionId: 'purified_water', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_seodaemun_severance_lab',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  advanced_trauma_kit: {
    id: 'advanced_trauma_kit', name: '고급 외상 키트', category: 'medical',
    description: '전문 의료 도구가 갖춰진 고급 외상 키트. 치명상도 현장에서 치료 가능.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'advanced_trauma_kit', qty: 1 }],
    requiredTools: ['medical_station'],
    requiredSkills: { crafting: 4, medicine: 6 },
    stages: [
      {
        stageIndex: 0, label: '재료 살균', tpCost: 2,
        requiredItems: [
          { definitionId: 'first_aid_kit', qty: 1 },
          { definitionId: 'antibiotics', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '키트 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'antiseptic', qty: 2 },
          { definitionId: 'gauze', qty: 5 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
      minSkillLevel: { medicine: 6 },
    },
  },

  combat_stimulant: {
    id: 'combat_stimulant', name: '전투 자극제', category: 'medical',
    description: '강장제를 농축한 전투용 자극제. 일시적으로 전투 능력을 극대화한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'combat_stimulant', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { crafting: 4, medicine: 3 },
    stages: [
      {
        stageIndex: 0, label: '조합', tpCost: 2,
        requiredItems: [
          { definitionId: 'stamina_tonic', qty: 2 },
          { definitionId: 'alcohol_solution', qty: 1 },
          { definitionId: 'painkiller', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 30,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  field_transfusion_kit: {
    id: 'field_transfusion_kit', name: '야전 수혈 키트', category: 'medical',
    description: '야전 환경에서 수혈이 가능한 간이 키트. 심각한 출혈도 응급 처치 가능.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'field_transfusion_kit', qty: 1 }],
    requiredTools: ['medical_station'],
    requiredSkills: { crafting: 3, medicine: 5 },
    stages: [
      {
        stageIndex: 0, label: '수혈 세트 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'first_aid_kit', qty: 1 },
          { definitionId: 'gauze', qty: 3 },
          { definitionId: 'purified_water', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '살균', tpCost: 2,
        requiredItems: [
          { definitionId: 'rubber', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
      minSkillLevel: { medicine: 5 },
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  전설 소모품 (Legendary Consumable) — 3
  // ══════════════════════════════════════════════════════════════

  survivors_feast: {
    id: 'survivors_feast', name: '생존자의 만찬', category: 'consumable',
    description: '구할 수 있는 최고의 재료로 차린 풍성한 식사. 모든 스탯을 완전 회복한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'survivors_feast', qty: 1 }],
    requiredTools: ['campfire'],
    requiredSkills: { cooking: 7 },
    stages: [
      {
        stageIndex: 0, label: '요리', tpCost: 3,
        requiredItems: [
          { definitionId: 'canned_food', qty: 1 },
          { definitionId: 'cooked_rice', qty: 1 },
          { definitionId: 'dried_meat', qty: 1 },
          { definitionId: 'purified_water', qty: 1 },
          { definitionId: 'vitamins', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
      minSkillLevel: { cooking: 7 },
    },
  },

  radiation_cleanser: {
    id: 'radiation_cleanser', name: '방사선 정화제', category: 'consumable',
    description: '숯 필터로 정제한 방사선 해독제. 체내 방사능 오염을 제거한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'radiation_cleanser', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 5, medicine: 4 },
    stages: [
      {
        stageIndex: 0, label: '필터 가공', tpCost: 2,
        requiredItems: [
          { definitionId: 'charcoal_filter', qty: 2 },
          { definitionId: 'purified_water', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '정제', tpCost: 2,
        requiredItems: [
          { definitionId: 'antiseptic', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_gwanak_snu_reactor',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 60,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  universal_antidote: {
    id: 'universal_antidote', name: '만능 해독제', category: 'consumable',
    description: '모든 독소와 감염을 중화하는 해독제. 약학 지식의 결정체.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'universal_antidote', qty: 1 }],
    requiredTools: ['campfire', 'workbench'],
    requiredSkills: { crafting: 5, medicine: 8 },
    stages: [
      {
        stageIndex: 0, label: '약초 추출', tpCost: 2,
        requiredItems: [
          { definitionId: 'antibiotics', qty: 1 },
          { definitionId: 'vitamins', qty: 2 },
          { definitionId: 'herbal_tea', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '합성', tpCost: 3,
        requiredItems: [
          { definitionId: 'antiseptic', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
      minSkillLevel: { medicine: 8 },
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  전설 구조물 (Legendary Structure) — 3
  // ══════════════════════════════════════════════════════════════

  auto_turret: {
    id: 'auto_turret', name: '자동 터렛', category: 'structure',
    description: '센서와 자동 사격 시스템을 갖춘 방어 터렛. 거점 방어의 최종 병기.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'auto_turret', qty: 1 }],
    requiredTools: ['master_forge'],
    requiredSkills: { building: 8, weaponcraft: 5, crafting: 4 },
    stages: [
      {
        stageIndex: 0, label: '골격', tpCost: 4,
        requiredItems: [
          { definitionId: 'electronic_parts', qty: 5 },
          { definitionId: 'scrap_metal', qty: 8 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '센서 장착', tpCost: 3,
        requiredItems: [
          { definitionId: 'wire', qty: 3 },
          { definitionId: 'spring', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '무장', tpCost: 3,
        requiredItems: [
          { definitionId: 'pistol_ammo', qty: 20 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_geumcheon_underground_factory',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: 'hidden_geumcheon_underground_factory 발견 또는 (engineer 캐릭터 + D100+)',
    },
  },

  reinforced_shelter: {
    id: 'reinforced_shelter', name: '강화 쉘터', category: 'structure',
    description: '철골과 목재로 견고하게 지은 대형 쉘터. 거주 안전성이 극대화된다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'reinforced_shelter', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 8, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '기초', tpCost: 4,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 10 },
          { definitionId: 'wood', qty: 8 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '벽면', tpCost: 4,
        requiredItems: [
          { definitionId: 'nail', qty: 20 },
          { definitionId: 'wire', qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '지붕', tpCost: 3,
        requiredItems: [
          { definitionId: 'rope', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
      minSkillLevel: { building: 8 },
    },
  },

  solar_generator: {
    id: 'solar_generator', name: '태양광 발전기', category: 'structure',
    description: '태양 에너지로 전력을 생산하는 발전기. 전자 장비를 가동할 수 있다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'solar_generator', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 6, crafting: 5 },
    stages: [
      {
        stageIndex: 0, label: '패널 조립', tpCost: 4,
        requiredItems: [
          { definitionId: 'electronic_parts', qty: 5 },
          { definitionId: 'scrap_metal', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '배선', tpCost: 3,
        requiredItems: [
          { definitionId: 'wire', qty: 5 },
          { definitionId: 'rubber', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_gwanak_snu_reactor',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: 'engineer 캐릭터 또는 hidden_gwanak_snu_reactor 발견',
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  캐릭터 전용 (Character-Specific) — 4
  // ══════════════════════════════════════════════════════════════

  field_laboratory: {
    id: 'field_laboratory', name: '야전 연구실', category: 'structure',
    description: '이지수(의사) 전용. 의무 거점을 개조한 본격 연구 시설. 고급 의약품 제조 가능.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'field_laboratory', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 5, medicine: 4 },
    stages: [
      {
        stageIndex: 0, label: '장비 설치', tpCost: 4,
        requiredItems: [
          { definitionId: 'medical_station', qty: 1 },
          { definitionId: 'electronic_parts', qty: 3 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '살균', tpCost: 2,
        requiredItems: [
          { definitionId: 'antiseptic', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: 'doctor',
      minDay: 40,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  emergency_generator: {
    id: 'emergency_generator', name: '비상 발전기', category: 'structure',
    description: '정대한(엔지니어) 전용. 폐자재로 조립한 비상 발전기. 전력 공급이 가능하다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'emergency_generator', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 5, crafting: 4 },
    stages: [
      {
        stageIndex: 0, label: '발전기 조립', tpCost: 4,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 6 },
          { definitionId: 'wire', qty: 3 },
          { definitionId: 'electronic_parts', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '배선', tpCost: 2,
        requiredItems: [
          { definitionId: 'rubber', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: 'engineer',
      minDay: 30,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  directional_mine: {
    id: 'directional_mine', name: '지향성 지뢰', category: 'weapon',
    description: '강민준(군인) 전용. 한 방향으로 파편을 발사하는 지향성 지뢰.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'directional_mine', qty: 2 }],
    requiredTools: ['workbench'],
    requiredSkills: { weaponcraft: 4, crafting: 3 },
    stages: [
      {
        stageIndex: 0, label: '지뢰 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'gunpowder', qty: 2 },
          { definitionId: 'scrap_metal', qty: 3 },
          { definitionId: 'wire', qty: 2 },
          { definitionId: 'electronic_parts', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: 'soldier',
      minDay: 50,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  fireproof_barricade: {
    id: 'fireproof_barricade', name: '내화 방벽', category: 'structure',
    description: '박영철(소방관) 전용. 소방관 배지의 내화 기술로 만든 난공불락 방벽.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'reinforced_shelter', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { building: 4, crafting: 2 },
    stages: [
      {
        stageIndex: 0, label: '내화재 가공', tpCost: 3,
        requiredItems: [
          { definitionId: 'firefighter_badge', qty: 1 },
          { definitionId: 'scrap_metal', qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '방벽 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'rope', qty: 3 },
          { definitionId: 'wood', qty: 5 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: 'boss_firefighter_nemesis',
      requiredCharacter: 'firefighter',
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  enhanced_antiviral: {
    id: 'enhanced_antiviral', name: '강화 항바이러스', category: 'medical',
    description: '한소희(약사) 전용. 변이 조제법을 활용한 강화 항바이러스제.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'completed_antiviral', qty: 1 }],
    requiredTools: ['medical_station'],
    requiredSkills: { crafting: 5, medicine: 5 },
    stages: [
      {
        stageIndex: 0, label: '변이 분석', tpCost: 3,
        requiredItems: [
          { definitionId: 'mutant_formula', qty: 1 },
          { definitionId: 'antibiotics', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '합성', tpCost: 3,
        requiredItems: [
          { definitionId: 'antiseptic', qty: 2 },
          { definitionId: 'purified_water', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: 'boss_pharmacist_nemesis',
      requiredCharacter: 'pharmacist',
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  immunity_serum: {
    id: 'immunity_serum', name: '면역 혈청', category: 'medical',
    description: '한소희(약사) 전용. 제로 스트레인에서 추출한 면역 혈청. 영구 감염 면역.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'immunity_serum', qty: 1 }],
    requiredTools: ['medical_station'],
    requiredSkills: { crafting: 6, medicine: 6 },
    stages: [
      {
        stageIndex: 0, label: '추출', tpCost: 4,
        requiredItems: [
          { definitionId: 'zero_strain', qty: 1 },
          { definitionId: 'antibiotics', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '정제', tpCost: 3,
        requiredItems: [
          { definitionId: 'vitamins', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: 'boss_patient_zero',
      requiredCharacter: 'pharmacist',
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

};

export default HIDDEN_RECIPES;
