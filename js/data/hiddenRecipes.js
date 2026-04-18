// === HIDDEN RECIPE DEFINITIONS (46 legendary recipes) ===
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
        stageIndex: 0, label: '기폭 장치 제작', tpCost: 2,
        requiredItems: [
          { definitionId: 'gunpowder', qty: 1 },
          { definitionId: 'wire', qty: 1 },
          { definitionId: 'electronic_parts', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '화살 장착', tpCost: 2,
        requiredItems: [
          { definitionId: 'crossbow_bolt', qty: 3 },
          { definitionId: 'duct_tape', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_seocho_courthouse_vault',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 5,
      requiredItems: [],
      customUnlock: '서초 법원 증거물 보관소 발견 필요 (압수된 폭발물 제조 기록)',
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
      hiddenLocationId: 'hidden_mapo_hongdae_basement',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '홍대 클럽 지하 방음 시설 발견 필요 (소음 차단 개조 기법 습득)',
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
      hiddenLocationId: 'hidden_dongdaemun_secret_workshop',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 8,
      requiredItems: [],
      customUnlock: '동대문 비밀 공방 발견 필요 (고급 위장 직물 재단 기술 입수)',
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
      hiddenLocationId: 'hidden_seongbuk_university_bunker',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '고려대 연구 벙커 발견 필요 (고급 외상 치료 프로토콜 문서 확보)',
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
        stageIndex: 0, label: '재료 농축', tpCost: 2,
        requiredItems: [
          { definitionId: 'stamina_tonic', qty: 2 },
          { definitionId: 'alcohol_solution', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '배합 및 정제', tpCost: 2,
        requiredItems: [
          { definitionId: 'painkiller', qty: 1 },
          { definitionId: 'gauze', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_gangnam_samsung_pharmacy',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '삼성병원 봉인 약제실 발견 필요 (전투용 자극제 조합 공식 획득)',
      minSkillLevel: { medicine: 3 },
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
      hiddenLocationId: 'hidden_gwangjin_zoo_laboratory',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '광진 동물 연구소 발견 필요 (혈액 분리 및 수혈 실험 기록 확보)',
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
        stageIndex: 0, label: '재료 손질', tpCost: 2,
        requiredItems: [
          { definitionId: 'purified_water', qty: 1 },
          { definitionId: 'dried_meat', qty: 1 },
          { definitionId: 'salt', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '조리', tpCost: 3,
        requiredItems: [
          { definitionId: 'cooked_rice', qty: 1 },
          { definitionId: 'canned_food', qty: 1 },
          { definitionId: 'herb', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '영양 마무리', tpCost: 2,
        requiredItems: [
          { definitionId: 'vitamins', qty: 1 },
          { definitionId: 'energy_bar', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_yangcheon_mokdong_bunker',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '목동 민방위 대피소 발견 필요 (장기 비축 식량 조리 레시피 발굴)',
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
      hiddenLocationId: 'hidden_dobong_hermit_cave',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '도봉산 은자 동굴 발견 필요 (은자의 약초 조합 비법 전수)',
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
      hiddenLocationId: 'hidden_dongjak_cemetery_vault',
      bossKillId: null,
      requiredCharacter: null,
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '국립현충원 지하 벙커 발견 필요 (군 규격 야전 진지 설계도 확보)',
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
        stageIndex: 0, label: '폭발체 조립', tpCost: 2,
        requiredItems: [
          { definitionId: 'gunpowder', qty: 2 },
          { definitionId: 'scrap_metal', qty: 2 },
          { definitionId: 'rubber', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '기폭 회로 연결', tpCost: 2,
        requiredItems: [
          { definitionId: 'wire', qty: 2 },
          { definitionId: 'electronic_parts', qty: 1 },
          { definitionId: 'scrap_metal', qty: 1 },
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
    output: [{ definitionId: 'fireproof_barricade', qty: 1 }],
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
    description: '윤재혁(셰프) 전용. 변이 조제법을 활용한 강화 항바이러스제.',
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
      bossKillId: 'boss_chef_nemesis',
      requiredCharacter: 'chef',
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  immunity_serum: {
    id: 'immunity_serum', name: '면역 혈청', category: 'medical',
    description: '윤재혁(셰프) 전용. 제로 스트레인에서 추출한 면역 혈청. 영구 감염 면역.',
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
      requiredCharacter: 'chef',
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  // ── 노숙인 전용 히든 레시피 ──────────────────────────────────────────
  street_snare_trap: {
    id: 'street_snare_trap',
    name: '거리 덫',
    category: 'weapon',
    rarity: 'rare',
    description: '폐품으로 만든 소리 없는 함정. 노숙 생활에서 터득한 노하우.',
    output: [{ definitionId: 'spike_trap', qty: 2 }],
    requiredTools: [],
    requiredSkills: { scavenging: 3 },
    stages: [
      {
        stageIndex: 0, label: '재료 가공',
        tpCost: 2,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 2 },
          { definitionId: 'wire', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '덫 조립',
        tpCost: 1,
        requiredItems: [
          { definitionId: 'rope', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: 'hidden_yangcheon_dongho_bridge',
      bossKillId: null,
      requiredCharacter: 'homeless',
      minDay: 0,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '노숙인 캐릭터 + 동호대교 은신처 발견',
    },
  },

  wild_salt_cure: {
    id: 'wild_salt_cure',
    name: '야생 소금 절임',
    category: 'food',
    rarity: 'uncommon',
    description: '냉장 없이 식량을 보존하는 거리 생활의 지혜. 부패하지 않고 오래 간다.',
    output: [{ definitionId: 'dried_meat', qty: 3 }],
    requiredTools: [],
    requiredSkills: { cooking: 2, harvesting: 2 },
    stages: [
      {
        stageIndex: 0, label: '재료 준비',
        tpCost: 1,
        requiredItems: [
          { definitionId: 'raw_meat', qty: 2 },
          { definitionId: 'salt', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '건조 숙성',
        tpCost: 3,
        requiredItems: [],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: 'homeless',
      minDay: 5,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '노숙인 캐릭터 + D5+ 도달',
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  금속/건축 엔드게임 (Lv12+) — 6
  // ══════════════════════════════════════════════════════════════

  smelt_alloy_ingot: {
    id: 'smelt_alloy_ingot', name: '합금 주괴 제련', category: 'material',
    description: '벽돌 화로에서 금속을 배합하여 합금을 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'alloy_ingot', qty: 1 }],
    requiredTools: ['brick_furnace'],
    requiredSkills: { crafting: 12 },
    stages: [
      {
        stageIndex: 0, label: '금속 배합', tpCost: 3,
        requiredItems: [
          { definitionId: 'refined_metal', qty: 2 },
          { definitionId: 'steel_plate', qty: 1 },
          { definitionId: 'charcoal', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  forge_master_blade: {
    id: 'forge_master_blade', name: '명검 단조', category: 'weapon',
    description: '합금을 달구어 명검을 벼린다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'master_blade', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { weaponcraft: 12 },
    stages: [
      {
        stageIndex: 0, label: '합금 가열', tpCost: 3,
        requiredItems: [
          { definitionId: 'alloy_ingot', qty: 1 },
          { definitionId: 'charcoal', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 25,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  forge_katana: {
    id: 'forge_katana', name: '카타나 제작', category: 'weapon',
    description: '명검을 재단조하여 완벽한 도검을 완성한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'katana', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { weaponcraft: 15 },
    stages: [
      {
        stageIndex: 0, label: '재단조', tpCost: 4,
        requiredItems: [
          { definitionId: 'master_blade', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '손잡이 마감', tpCost: 2,
        requiredItems: [
          { definitionId: 'leather', qty: 1 },
          { definitionId: 'thread', qty: 2 },
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
      customUnlock: '대장장이의 비전을 깨달아야 한다 (weaponcraft 15 달성)',
    },
  },

  forge_alloy_armor_plate: {
    id: 'forge_alloy_armor_plate', name: '합금 장갑판', category: 'armor',
    description: '합금으로 최상급 장갑판을 단조한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'alloy_armor_plate', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { armorcraft: 12 },
    stages: [
      {
        stageIndex: 0, label: '합금 단조', tpCost: 3,
        requiredItems: [
          { definitionId: 'alloy_ingot', qty: 2 },
          { definitionId: 'leather', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 25,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  build_watchtower: {
    id: 'build_watchtower', name: '감시탑 건설', category: 'structure',
    description: '콘크리트와 목재로 높은 감시탑을 세운다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'watchtower', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 12, crafting: 5 },
    stages: [
      {
        stageIndex: 0, label: '기초 시공', tpCost: 4,
        requiredItems: [
          { definitionId: 'concrete_block', qty: 6 },
          { definitionId: 'wood_plank', qty: 8 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '탑 조립', tpCost: 3,
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
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  build_portable_generator: {
    id: 'build_portable_generator', name: '발전기 건설', category: 'structure',
    description: '발전기 코어에 연료 시스템을 연결하여 전력을 생산한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'portable_generator', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { building: 10, crafting: 8 },
    stages: [
      {
        stageIndex: 0, label: '코어 장착', tpCost: 3,
        requiredItems: [
          { definitionId: 'generator_core', qty: 1 },
          { definitionId: 'fuel_can', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '배선 연결', tpCost: 2,
        requiredItems: [
          { definitionId: 'rubber', qty: 2 },
          { definitionId: 'wire', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 25,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  의료 엔드게임 (Lv8-15) — 4
  // ══════════════════════════════════════════════════════════════

  synthesize_antibiotics: {
    id: 'synthesize_antibiotics', name: '항생제 합성', category: 'medical',
    description: '정제약을 합성하여 강력한 항생제를 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'synthetic_antibiotics', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 10 },
    stages: [
      {
        stageIndex: 0, label: '약재 배합', tpCost: 3,
        requiredItems: [
          { definitionId: 'purified_medicine', qty: 2 },
          { definitionId: 'distilled_water', qty: 1 },
          { definitionId: 'herb_powder', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  make_surgical_anesthetic: {
    id: 'make_surgical_anesthetic', name: '수술용 마취제', category: 'medical',
    description: '마취제를 정제하여 수술용 고순도 마취제를 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'surgical_anesthetic', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 8 },
    stages: [
      {
        stageIndex: 0, label: '마취제 정제', tpCost: 2,
        requiredItems: [
          { definitionId: 'anesthetic', qty: 2 },
          { definitionId: 'distilled_water', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 15,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  build_surgery_station: {
    id: 'build_surgery_station', name: '야전 수술대 건설', category: 'structure',
    description: '이동식 수술 시설을 설치한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'field_surgery_station', qty: 1 }],
    requiredTools: [],
    requiredSkills: { medicine: 10, building: 6 },
    stages: [
      {
        stageIndex: 0, label: '수술대 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'sterile_kit', qty: 1 },
          { definitionId: 'anesthetic', qty: 1 },
          { definitionId: 'wood_plank', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  synth_plague_vaccine: {
    id: 'synth_plague_vaccine', name: '역병 백신 합성', category: 'medical',
    description: '0번 환자 혈액 표본에서 항원을 추출해 광범위 항생제와 결합한다. 의사만이 완성할 수 있는 전설적 백신.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'plague_vaccine', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 12 },
    stages: [
      {
        stageIndex: 0, label: '항원 추출', tpCost: 3,
        requiredItems: [
          { definitionId: 'infected_blood_sample', qty: 1 },
          { definitionId: 'alcohol_solution',      qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '항체 합성', tpCost: 4,
        requiredItems: [
          { definitionId: 'broad_antibiotic',   qty: 1 },
          { definitionId: 'concentrated_serum', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 2, label: '안정화', tpCost: 2,
        requiredItems: [
          { definitionId: 'purified_water', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: 'boss_patient_zero',
      requiredCharacter: 'doctor',
      minDay: 40,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '0번 환자를 처치하고 혈액 표본을 확보해야 한다 (의사 전용)',
    },
  },

  brew_universal_cure: {
    id: 'brew_universal_cure', name: '만병통치약 조제', category: 'medical',
    description: '전설적인 치료제를 합성한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'universal_cure', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { medicine: 15 },
    stages: [
      {
        stageIndex: 0, label: '핵심 약재 배합', tpCost: 4,
        requiredItems: [
          { definitionId: 'synthetic_antibiotics', qty: 2 },
          { definitionId: 'purified_medicine', qty: 1 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '정제 마무리', tpCost: 3,
        requiredItems: [
          { definitionId: 'sterile_water', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 35,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: '의학의 정수에 도달해야 한다 (medicine 15 달성)',
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  전자/에너지 엔드게임 (Lv10-15) — 5
  // ══════════════════════════════════════════════════════════════

  build_solar_panel: {
    id: 'build_solar_panel', name: '태양광 패널 건설', category: 'structure',
    description: '태양 에너지를 전기로 변환하는 패널을 조립한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'solar_panel', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 12, building: 8 },
    stages: [
      {
        stageIndex: 0, label: '패널 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'circuit_module', qty: 2 },
          { definitionId: 'glass_shard', qty: 4 },
          { definitionId: 'copper_wire', qty: 3 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  build_solar_charger: {
    id: 'build_solar_charger', name: '태양광 충전기', category: 'structure',
    description: '태양광으로 배터리를 충전하는 장치를 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'solar_charger', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 12 },
    stages: [
      {
        stageIndex: 0, label: '충전 회로 구성', tpCost: 3,
        requiredItems: [
          { definitionId: 'solar_panel', qty: 1 },
          { definitionId: 'battery', qty: 1 },
          { definitionId: 'wire', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 25,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  make_powered_drill: {
    id: 'make_powered_drill', name: '전동 드릴', category: 'tool',
    description: '전력 구동 드릴을 조립한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'powered_drill', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 12 },
    stages: [
      {
        stageIndex: 0, label: '드릴 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'power_cell', qty: 1 },
          { definitionId: 'steel_tool_head', qty: 1 },
          { definitionId: 'rubber', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  build_electric_fence: {
    id: 'build_electric_fence', name: '전기 울타리', category: 'structure',
    description: '전류가 흐르는 방어 울타리를 설치한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'electric_fence', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 15, crafting: 10 },
    stages: [
      {
        stageIndex: 0, label: '울타리 골조', tpCost: 3,
        requiredItems: [
          { definitionId: 'iron_pipe', qty: 4 },
          { definitionId: 'wire', qty: 5 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '전력 연결', tpCost: 2,
        requiredItems: [
          { definitionId: 'power_cell', qty: 2 },
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
      customUnlock: '전력 인프라가 완비되어야 한다',
    },
  },

  build_water_recycler: {
    id: 'build_water_recycler', name: '물 재활용기', category: 'structure',
    description: '사용한 물을 정화하여 재사용하는 시스템을 구축한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'water_recycler', qty: 1 }],
    requiredTools: [],
    requiredSkills: { building: 12 },
    stages: [
      {
        stageIndex: 0, label: '정화 시스템 구축', tpCost: 3,
        requiredItems: [
          { definitionId: 'rain_collector_improved', qty: 1 },
          { definitionId: 'water_purifier', qty: 1 },
          { definitionId: 'pipe_assembly', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 25,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  방어구/도구 엔드게임 (Lv10-15) — 5
  // ══════════════════════════════════════════════════════════════

  make_composite_armor: {
    id: 'make_composite_armor', name: '복합 장갑 제작', category: 'armor',
    description: '방탄 조끼에 장갑판과 전자 보강재를 결합한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'composite_armor', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { armorcraft: 10 },
    stages: [
      {
        stageIndex: 0, label: '장갑 결합', tpCost: 3,
        requiredItems: [
          { definitionId: 'plate_carrier', qty: 1 },
          { definitionId: 'armor_plate', qty: 1 },
          { definitionId: 'circuit_module', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  build_powered_exosuit: {
    id: 'build_powered_exosuit', name: '엑소수트 제작', category: 'armor',
    description: '전력 구동 외골격 장갑을 조립한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'powered_exosuit', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { armorcraft: 15, crafting: 12 },
    stages: [
      {
        stageIndex: 0, label: '외골격 프레임', tpCost: 4,
        requiredItems: [
          { definitionId: 'composite_armor', qty: 1 },
          { definitionId: 'electric_motor', qty: 2 },
        ],
        consumeAt: 'start',
      },
      {
        stageIndex: 1, label: '전력 시스템 장착', tpCost: 3,
        requiredItems: [
          { definitionId: 'power_cell', qty: 1 },
          { definitionId: 'circuit_module', qty: 1 },
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
      customUnlock: '공학의 극치에 도달해야 한다',
    },
  },

  make_night_vision: {
    id: 'make_night_vision', name: '야시경 제작', category: 'tool',
    description: '어둠 속에서도 볼 수 있는 전자 고글을 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'night_vision_goggles', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 15 },
    stages: [
      {
        stageIndex: 0, label: '광학 조립', tpCost: 3,
        requiredItems: [
          { definitionId: 'circuit_module', qty: 1 },
          { definitionId: 'glass_shard', qty: 2 },
          { definitionId: 'power_cell', qty: 1 },
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

  make_electronic_lockpick: {
    id: 'make_electronic_lockpick', name: '전자 락픽', category: 'tool',
    description: '전자 잠금장치를 해제할 수 있는 도구를 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'electronic_lockpick', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { crafting: 10 },
    stages: [
      {
        stageIndex: 0, label: '전자 락픽 조립', tpCost: 2,
        requiredItems: [
          { definitionId: 'lockpick_set', qty: 1 },
          { definitionId: 'circuit_module', qty: 1 },
          { definitionId: 'wire', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 20,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  make_master_wrench: {
    id: 'make_master_wrench', name: '마스터 렌치', category: 'tool',
    description: '합금으로 최상급 렌치를 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'master_wrench', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { crafting: 12 },
    stages: [
      {
        stageIndex: 0, label: '합금 렌치 단조', tpCost: 3,
        requiredItems: [
          { definitionId: 'pipe_wrench_improved', qty: 1 },
          { definitionId: 'alloy_ingot', qty: 1 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 25,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  낚시 엔드게임 (Lv12-15) — 2
  // ══════════════════════════════════════════════════════════════

  make_automated_fish_trap: {
    id: 'make_automated_fish_trap', name: '자동 어획 장치', category: 'tool',
    description: '통발에 자동화 시스템을 추가한다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'automated_fish_trap', qty: 1 }],
    requiredTools: ['workbench'],
    requiredSkills: { fishing: 12 },
    stages: [
      {
        stageIndex: 0, label: '자동화 장착', tpCost: 3,
        requiredItems: [
          { definitionId: 'crab_trap', qty: 1 },
          { definitionId: 'circuit_module', qty: 1 },
          { definitionId: 'wire', qty: 2 },
        ],
        consumeAt: 'start',
      },
    ],
    unlockConditions: {
      hiddenLocationId: null,
      bossKillId: null,
      requiredCharacter: null,
      minDay: 25,
      minCraftLevel: 0,
      requiredItems: [],
      customUnlock: null,
    },
  },

  make_master_lure: {
    id: 'make_master_lure', name: '명인의 루어', category: 'tool',
    description: '합금으로 전설적인 루어를 만든다.',
    hidden: true,
    rarity: 'legendary',
    output: [{ definitionId: 'master_angler_lure', qty: 1 }],
    requiredTools: ['field_forge'],
    requiredSkills: { fishing: 15 },
    stages: [
      {
        stageIndex: 0, label: '루어 단조', tpCost: 3,
        requiredItems: [
          { definitionId: 'alloy_ingot', qty: 1 },
          { definitionId: 'leather', qty: 1 },
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
      customUnlock: '낚시의 달인만이 만들 수 있다',
    },
  },

};

export default HIDDEN_RECIPES;
