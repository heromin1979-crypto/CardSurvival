// === SECRET COMBINATIONS ===
// 블루프린트에 표시되지 않는 비밀 조합 레시피.
// 카드를 겹쳐 실험할 때만 발견. 발견 시 XP 보너스 + 갤러리 기록.

const SECRET_COMBINATIONS = [

  // ═══ 서바이벌 유틸리티 ═══════════════════════════════════

  {
    id: 'sc_molotov',
    name: '화염병',
    source: { id: 'empty_bottle' },
    target: { id: 'campfire' },
    hint: '빈 병과 불의 만남...',
    discoveryMsg: '💡 화염병을 만들 수 있다!',
    xpReward: { skill: 'crafting', amount: 15 },
    additionalReq: [{ id: 'cloth', qty: 1 }],
    result: {
      spawnItem: 'molotov_cocktail',
      consumeSrc: true,
      consumeTgt: false,
      consumeExtra: true,
    },
  },
  {
    id: 'sc_fishing_rod',
    name: '낚싯대',
    source: { id: 'rope' },
    target: { id: 'wood' },
    hint: '로프와 나무... 강에서 뭔가 잡을 수 있을 텐데',
    discoveryMsg: '💡 낚싯대를 만들었다! 한강 인접 구역에서 사용 가능.',
    xpReward: { skill: 'crafting', amount: 10 },
    result: {
      spawnItem: 'fishing_rod_basic',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_smoke_bomb',
    name: '연막탄',
    source: { id: 'electronic_parts' },
    target: { id: 'empty_can' },
    hint: '전자부품과 빈 캔의 조합',
    discoveryMsg: '💡 연막탄! 전투 중 도주 확률 +30%.',
    xpReward: { skill: 'crafting', amount: 12 },
    result: {
      spawnItem: 'smoke_bomb',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_torch',
    name: '횃불',
    source: { id: 'wood' },
    target: { id: 'cloth' },
    hint: '나무와 천으로 불을 밝힐 수 있다',
    discoveryMsg: '💡 횃불! 어두운 곳에서 시야를 확보한다.',
    xpReward: { skill: 'crafting', amount: 8 },
    result: {
      spawnItem: 'torch',
      consumeSrc: true,
      consumeTgt: true,
    },
  },

  // ═══ 의료 ═══════════════════════════════════════════════

  {
    id: 'sc_herbal_medicine',
    name: '한방 치료제',
    source: { id: 'vitamins' },
    target: { id: 'purified_water' },
    hint: '비타민을 깨끗한 물에 녹이면...',
    discoveryMsg: '💡 한방 치료제! 감염 -20, 사기 +10.',
    xpReward: { skill: 'medicine', amount: 15 },
    requiredSkill: { medicine: 3 },
    result: {
      spawnItem: 'herbal_medicine',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_field_surgery_kit',
    name: '현장 수술 키트',
    source: { id: 'first_aid_kit' },
    target: { id: 'knife' },
    hint: '응급 키트와 칼을 결합하면 즉석 수술 도구가...',
    discoveryMsg: '💡 수술 키트! 골절·열상 즉시 치료 가능.',
    xpReward: { skill: 'medicine', amount: 20 },
    requiredSkill: { medicine: 5 },
    result: {
      spawnItem: 'surgery_kit',
      consumeSrc: true,
      consumeTgt: false,
    },
  },
  {
    id: 'sc_painkiller_mix',
    name: '강력 진통제',
    source: { id: 'painkiller' },
    target: { id: 'sports_drink' },
    hint: '진통제를 스포츠 음료에 섞으면...',
    discoveryMsg: '💡 강력 진통제! 트라우마 -10, 고통 무시 4시간.',
    xpReward: { skill: 'medicine', amount: 12 },
    result: {
      spawnItem: 'strong_painkiller',
      consumeSrc: true,
      consumeTgt: true,
    },
  },

  // ═══ 전투 ═══════════════════════════════════════════════

  {
    id: 'sc_poison_blade',
    name: '독날',
    source: { id: 'antiseptic' },
    target: { tag: 'melee' },
    hint: '소독약을... 무기에 바르면?',
    discoveryMsg: '💡 독날! 무기에 독 데미지 +3 부여.',
    xpReward: { skill: 'weaponcraft', amount: 15 },
    result: {
      addEffect: { poisonDamage: 3 },
      consumeSrc: true,
      consumeTgt: false,
    },
  },
  {
    id: 'sc_reinforced_shield',
    name: '강화 방패',
    source: { id: 'scrap_metal' },
    target: { id: 'makeshift_shield' },
    hint: '고철로 방패를 보강하면...',
    discoveryMsg: '💡 강화 방패! 방어력 대폭 상승.',
    xpReward: { skill: 'armorcraft', amount: 15 },
    additionalReq: [{ id: 'scrap_metal', qty: 2 }],
    result: {
      spawnItem: 'reinforced_shield',
      consumeSrc: true,
      consumeTgt: true,
      consumeExtra: true,
    },
  },
  {
    id: 'sc_fire_arrow',
    name: '화살 화염 강화',
    source: { id: 'crossbow_bolt' },
    target: { id: 'campfire' },
    hint: '볼트를 불에 담그면...',
    discoveryMsg: '💡 화염 볼트! 추가 화상 데미지.',
    xpReward: { skill: 'weaponcraft', amount: 10 },
    result: {
      spawnItem: 'fire_bolt',
      consumeSrc: true,
      consumeTgt: false,
    },
  },

  // ═══ 환경 활용 (Feature 1 연동) ═══════════════════════

  {
    id: 'sc_rain_shower',
    name: '빗물 샤워',
    source: { id: 'cloth' },
    target: { id: 'env_rainy' },
    hint: '비 속에서 천으로 몸을 씻으면...',
    discoveryMsg: '💡 빗물 샤워! 감염 -5, 사기 +5.',
    xpReward: { skill: 'medicine', amount: 5 },
    cooldown: 72,
    result: {
      statChange: { infection: -5, morale: +5 },
      consumeSrc: false,
      consumeTgt: false,
    },
  },
  {
    id: 'sc_snow_compress',
    name: '눈 냉찜질',
    source: { id: 'cloth' },
    target: { id: 'env_snow' },
    hint: '눈을 천에 싸서 환부에 대면...',
    discoveryMsg: '💡 눈 냉찜질! 체온 -3, 통증 완화.',
    xpReward: { skill: 'medicine', amount: 5 },
    cooldown: 72,
    result: {
      statChange: { temperature: -3 },
      consumeSrc: false,
      consumeTgt: false,
    },
  },

  // ═══ 특수 ═══════════════════════════════════════════════

  {
    id: 'sc_radio_signal',
    name: '구조 신호',
    source: { id: 'battery' },
    target: { id: 'broken_radio' },
    hint: '라디오에 배터리를 넣으면...',
    discoveryMsg: '📻 ... 여기는 서울... 생존자가 있다...',
    xpReward: { skill: 'crafting', amount: 20 },
    requiredDay: 100,
    result: {
      spawnItem: 'radio',
      consumeSrc: true,
      consumeTgt: true,
      triggerEvent: 'rescue_signal',
    },
  },
  {
    id: 'sc_journal',
    name: '생존 일지',
    source: { id: 'charcoal' },
    target: { id: 'cloth' },
    hint: '기록은 생존의 증거',
    discoveryMsg: '💡 생존 일지! 매일 사용하면 트라우마·외로움 감소.',
    xpReward: { skill: 'crafting', amount: 10 },
    result: {
      spawnItem: 'survival_journal',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_water_trap',
    name: '물 함정',
    source: { id: 'empty_bottle' },
    target: { id: 'rope' },
    hint: '빈 병과 로프로 무언가를 만들 수 있다',
    discoveryMsg: '💡 물 함정! 자동으로 빗물 수집.',
    xpReward: { skill: 'building', amount: 12 },
    result: {
      spawnItem: 'water_trap',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_oil_lamp',
    name: '기름 램프',
    source: { id: 'empty_can' },
    target: { id: 'cloth' },
    hint: '깡통과 천으로 조명을...',
    discoveryMsg: '💡 기름 램프! 야간 탐색 효율 증가.',
    xpReward: { skill: 'crafting', amount: 10 },
    result: {
      spawnItem: 'oil_lamp',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_sling',
    name: '슬링(투석기)',
    source: { id: 'cloth' },
    target: { id: 'rope' },
    hint: '천과 로프로 원시 무기를...',
    discoveryMsg: '💡 슬링! 원거리 비무장 무기.',
    xpReward: { skill: 'weaponcraft', amount: 10 },
    result: {
      spawnItem: 'sling',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_signal_fire',
    name: '신호 연기',
    source: { id: 'campfire' },
    target: { id: 'cloth' },
    hint: '모닥불에 천을 태우면 연기가...',
    discoveryMsg: '💡 신호 연기! 소음 +20, 하지만 NPC 발견 확률 증가.',
    xpReward: { skill: 'building', amount: 8 },
    result: {
      statChange: { noise: +20 },
      consumeSrc: false,
      consumeTgt: true,
    },
  },
  {
    id: 'sc_thorn_wire',
    name: '가시 철사',
    source: { id: 'wire' },
    target: { id: 'nail' },
    hint: '철사와 못으로 날카로운 방어물을...',
    discoveryMsg: '💡 가시 철사! 방어 시설 데미지 +5.',
    xpReward: { skill: 'building', amount: 12 },
    result: {
      spawnItem: 'thorn_wire',
      consumeSrc: true,
      consumeTgt: true,
    },
  },

  // ═══ 불 시스템 비밀 조합 ══════════════════════════════════

  {
    id: 'sc_bark_rope',
    name: '수피 임시 로프',
    source: { id: 'wood_bark' },
    target: { id: 'wood_bark' },
    hint: '나무껍질끼리 꼬으면...',
    discoveryMsg: '💡 수피 임시 로프! 로프 대용으로 사용 가능. 내구도가 낮다.',
    xpReward: { skill: 'crafting', amount: 8 },
    result: {
      spawnItem: 'rope',
      consumeSrc: true,
      consumeTgt: true,
    },
  },

  {
    id: 'sc_pine_cone_fuel',
    name: '솔방울 연료',
    source: { id: 'pine_cone' },
    target: { id: 'campfire' },
    hint: '솔방울은 천연 연료...',
    discoveryMsg: '💡 솔방울 투입! 캠프파이어 내구도 +5 회복.',
    xpReward: { skill: 'crafting', amount: 6 },
    result: {
      consumeSrc: true,
      consumeTgt: false,
      targetDurabilityChange: +5,
    },
  },

  {
    id: 'sc_fuel_can_fire',
    name: '연료통으로 불 키우기',
    source: { id: 'fuel_can' },
    target: { id: 'campfire' },
    hint: '연료를 부으면 불이 더 활활...',
    discoveryMsg: '⚠️ 연료 투입! 캠프파이어 내구도 +15, 소음 +10. 단, 폭발 위험!',
    xpReward: { skill: 'crafting', amount: 12 },
    result: {
      consumeSrc: true,
      consumeTgt: false,
      targetDurabilityChange: +15,
      statChange: { noise: +10 },
    },
  },

  {
    id: 'sc_dry_grass_kindling',
    name: '마른 풀 긴급 불쏘시개',
    source: { id: 'dry_grass' },
    target: { id: 'fire_ember' },
    hint: '불씨에 마른 풀을 얹으면...',
    discoveryMsg: '💡 직접 점화! 불쏘시개 뭉치 없이도 불씨를 불꽃으로 키울 수 있다.',
    xpReward: { skill: 'crafting', amount: 10 },
    result: {
      spawnItem: 'flame_token',
      consumeSrc: true,
      consumeTgt: true,
    },
  },

  {
    id: 'sc_wind_stove_campfire',
    name: '방풍 화로 요리',
    source: { id: 'contaminated_water' },
    target: { id: 'wind_stove' },
    hint: '방풍 화로도 물을 끓일 수 있지 않을까...',
    discoveryMsg: '💡 방풍 화로에서 요리 가능! campfire와 동일하게 사용할 수 있다.',
    xpReward: { skill: 'cooking', amount: 8 },
    result: {
      spawnItem: 'boiled_water',
      consumeSrc: true,
      consumeTgt: false,
    },
  },

  // ═══ 식생 확장 비밀 조합 ══════════════════════════════════════════════

  {
    id: 'sc_wild_salad',
    name: '야생 즉석 샐러드',
    source: { id: 'wild_berry' },
    target: { id: 'dandelion' },
    hint: '베리와 민들레... 날것 그대로 먹을 수 있지 않을까?',
    discoveryMsg: '💡 야생 샐러드 발견! 조리 없이 바로 만들 수 있는 영양식.',
    xpReward: { skill: 'cooking', amount: 8 },
    additionalReq: [{ id: 'wild_garlic', qty: 1 }],
    result: {
      spawnItem: 'wild_salad',
      consumeSrc: true,
      consumeTgt: true,
      consumeExtra: true,
    },
  },

  {
    id: 'sc_natural_antibiotic',
    name: '천연 항생 연고',
    source: { id: 'wild_garlic' },
    target: { id: 'herb' },
    hint: '마늘의 항균 성분과 약초를 섞으면...',
    discoveryMsg: '💡 천연 항생 연고! 소독제 2개를 만들 수 있다.',
    xpReward: { skill: 'medicine', amount: 15 },
    result: {
      spawnItem: 'antiseptic',
      spawnQty: 2,
      consumeSrc: true,
      consumeTgt: true,
    },
  },

  {
    id: 'sc_toxic_mushroom_extract',
    name: '독버섯 독 추출',
    source: { id: 'mushroom_toxic' },
    target: { id: 'mortar_pestle' },
    hint: '독버섯을 절구로 갈면 순수한 독을 추출할 수 있을 것 같다...',
    discoveryMsg: '⚠️ 독 추출 성공! 무기에 독을 바르는 재료로 활용 가능.',
    xpReward: { skill: 'medicine', amount: 12 },
    requiredSkill: { medicine: 2 },
    result: {
      spawnItem: 'poison',
      consumeSrc: true,
      consumeTgt: false,
    },
  },

  {
    id: 'sc_honey_medicine',
    name: '꿀 약초 연고',
    source: { id: 'honey' },
    target: { id: 'herb_powder' },
    hint: '꿀의 항균력과 약초 가루를 섞으면 강력한 치료제가...',
    discoveryMsg: '💡 꿀 약초 연고! 감염 -25, HP 회복. 일반 소독제보다 효과가 좋다.',
    xpReward: { skill: 'medicine', amount: 18 },
    requiredSkill: { medicine: 3 },
    result: {
      spawnItem: 'strong_painkiller',
      consumeSrc: true,
      consumeTgt: true,
    },
  },

  {
    id: 'sc_nettle_rope',
    name: '쐐기풀 섬유 로프',
    source: { id: 'nettle' },
    target: { id: 'stone_knife' },
    hint: '쐐기풀 섬유가 생각보다 질기다... 꼬아서 로프를 만들면?',
    discoveryMsg: '💡 쐐기풀 로프! 일반 로프 대용으로 쓸 수 있다.',
    xpReward: { skill: 'crafting', amount: 10 },
    additionalReq: [{ id: 'nettle', qty: 2 }],
    result: {
      spawnItem: 'rope',
      consumeSrc: true,
      consumeTgt: false,
      consumeExtra: true,
    },
  },

  {
    id: 'sc_bamboo_water',
    name: '죽순 수분 추출',
    source: { id: 'bamboo_shoot' },
    target: { id: 'stone_knife' },
    hint: '죽순을 자르면 안에 수분이 가득하다...',
    discoveryMsg: '💡 죽순 수분! 오염되지 않은 깨끗한 물을 얻었다.',
    xpReward: { skill: 'medicine', amount: 6 },
    result: {
      spawnItem: 'boiled_water',
      consumeSrc: true,
      consumeTgt: false,
    },
  },

  {
    id: 'sc_acorn_fire_starter',
    name: '도토리 껍질 불쏘시개',
    source: { id: 'acorn' },
    target: { id: 'fire_ember' },
    hint: '도토리 껍질은 잘 탄다...',
    discoveryMsg: '💡 도토리 껍질 점화! 불씨를 불꽃으로 키울 수 있다.',
    xpReward: { skill: 'crafting', amount: 6 },
    result: {
      spawnItem: 'flame_token',
      consumeSrc: true,
      consumeTgt: true,
    },
  },
];

export default SECRET_COMBINATIONS;
