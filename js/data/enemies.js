// === ENEMY DEFINITIONS ===

const ENEMIES = {
  // 잠복 환자 좀비 — 병원 야간 진입 시 등장. 낮은 스탯, 기습 성격.
  zombie_patient_dormant: {
    id: 'zombie_patient_dormant',
    name: '잠복 환자 좀비',
    icon: '🛌',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 18, max: 30 },
    attack: { damage: [10, 16], accuracy: 0.65, noiseOnAttack: 3 },
    defense: 0,
    xp: 14,
    lootTable: [
      { definitionId: 'bandage',      weight: 40, minQty: 1, maxQty: 2 },
      { definitionId: 'tattered_rags', weight: 40, minQty: 1, maxQty: 1 },
      { definitionId: 'painkiller',    weight: 15, minQty: 1, maxQty: 1 },
      { definitionId: 'cloth_scrap',  weight: 30, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',         weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.25,
    aiPattern: 'aggressive',
    patternProfile: {
      role: 'ambusher',
      targetPolicy: 'player',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.basic_attack',
        targetPolicy: 'player',
        target: { side: 'player', ranks: [1, 2], count: 1 },
        accuracy: 0.65,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [10, 16] }],
        motionKey: 'basic_attack',
      },
    },
    // 잠복 상태로 등장 — 깨어나기 전 처치하면 한 번도 공격받지 않는다 (기습 무효 카운터)
    dormant: {
      wakeTurns: 1,
      firstActionId: 'startled_lunge',
      consumeFirstAction: true,
    },
    specialSkills: [{
      id: 'startled_lunge',
      name: '기상 기습',
      nameKey: 'combat.skill.enemy.startled_lunge',
      targetPolicy: 'player',
      target: { side: 'player', ranks: [1, 2, 3, 4], count: 1 },
      accuracy: 0.85,
      hitCount: 1,
      telegraph: { turns: 0 },
      effects: [{ type: 'damage', value: [10, 16] }],
      motionKey: 'startled_lunge',
      cooldown: 0,
    }],
    statusInflict: null,
    weaknesses: ['blade', 'fire'],
    resistances: [],
    description: '수술대와 응급실 침대에서 잠들어 있던 환자가 변이한 좀비. 약하지만 기습한다.',
    stealthDifficulty: 0.3,
  },

  zombie_common: {
    id: 'zombie_common',
    name: '감염 좀비',
    icon: '🧟',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 25, max: 40 },
    attack: { damage: [8, 15], accuracy: 0.60, noiseOnAttack: 4 },
    defense: 0,
    xp: 10,
    lootTable: [
      { definitionId: 'tattered_rags', weight: 50, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',       weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth_scrap',   weight: 30, minQty: 1, maxQty: 3 },
      { definitionId: 'bone',          weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.20,
    aiPattern: 'normal',
    patternProfile: {
      role: 'baseline',
      targetPolicy: 'frontmost',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.basic_attack',
        targetPolicy: 'frontmost',
        target: { side: 'frontmost', ranks: [1, 2], count: 1 },
        accuracy: 0.60,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [8, 15] }],
        motionKey: 'basic_attack',
      },
    },
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['fire', 'blade'],
    resistances: [],
    description: '감염된 도시 생존자. 느리지만 위험하다.',
    stealthDifficulty: 0.5,
  },

  zombie_runner: {
    id: 'zombie_runner',
    name: '러너 좀비',
    icon: '🏃',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 18, max: 28 },
    attack: { damage: [12, 20], accuracy: 0.75, noiseOnAttack: 5 },
    defense: 0,
    xp: 18,
    lootTable: [
      { definitionId: 'tattered_rags', weight: 40, minQty: 1, maxQty: 1 },
      { definitionId: 'cloth_scrap',   weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',          weight: 15, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.30,
    aiPattern: 'aggressive',
    patternProfile: {
      role: 'skirmisher',
      targetPolicy: 'lowest_hp',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.basic_attack',
        targetPolicy: 'lowest_hp',
        target: { side: 'lowest_hp', ranks: [1, 2], count: 1 },
        accuracy: 0.75,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [12, 20] }],
        motionKey: 'basic_attack',
      },
    },
    // 돌진은 1턴 예고제 — 예고 턴에 이동하면 완전 회피, 명중 시 즉시 후속타(총 2연타)
    specialSkills: [{
      id: 'runner_rush', name: '돌진', nameKey: 'combat.skill.enemy.runner_rush',
      targetPolicy: 'lowest_hp',
      target: { side: 'lowest_hp', ranks: [1, 2, 3, 4], count: 1 },
      accuracy: 0.75,
      hitCount: 2,
      telegraph: { turns: 1, moveEvadeChance: 1 },
      effects: [{ type: 'damage', value: [12, 18] }],
      motionKey: 'runner_rush',
      cooldown: 3,
    }],
    statusInflict: { id: 'bleed', name: '출혈', duration: 3, effect: { hpLossPerRound: 3 } },
    weaknesses: ['bullet', 'fire'],
    resistances: [],
    description: '빠르고 공격적인 변이 좀비.',
    stealthDifficulty: 0.7,
  },

  zombie_brute: {
    id: 'zombie_brute',
    name: '거대 좀비',
    icon: '👹',
    image: './assets/images/zombie_brute.jpg',
    type: 'zombie',
    hp: { min: 75, max: 110 },
    attack: { damage: [20, 35], accuracy: 0.55, noiseOnAttack: 10 },
    defense: 3,
    xp: 40,
    lootTable: [
      { definitionId: 'scrap_metal',    weight: 30, minQty: 2, maxQty: 5 },
      { definitionId: 'first_aid_kit',  weight: 8,  minQty: 1, maxQty: 1 },
      { definitionId: 'tattered_rags',  weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth_scrap',    weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'bone',           weight: 30, minQty: 1, maxQty: 2 },
    ],
    infectionChance: 0.40,
    aiPattern: 'frontline_breaker',
    patternProfile: {
      role: 'frontline_breaker',
      targetPolicy: 'frontmost',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.basic_attack',
        targetPolicy: 'frontmost',
        target: { side: 'frontmost', ranks: [1, 2], count: 1 },
        accuracy: 0.55,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [20, 35] }],
        motionKey: 'basic_attack',
      },
    },
    // slam은 1턴 예고제 — 예고 턴에 이동하면 완전 회피, block 토큰 보유 시 기절 무효(피해는 블록 절반)
    specialSkills: [{
      id: 'slam', name: '강타', nameKey: 'combat.skill.enemy.slam',
      targetPolicy: 'frontmost',
      target: { side: 'frontmost', ranks: [1, 2], count: 1 },
      accuracy: 0.55,
      hitCount: 1,
      telegraph: { turns: 1, moveEvadeChance: 1, blockNegatesStun: true },
      effects: [
        { type: 'damage', value: [30, 45] },
        { type: 'move', distance: 1 },
      ],
      motionKey: 'slam',
      cooldown: 3,
      stunChance: 0.5,
    }],
    statusInflict: null,
    weaknesses: ['fire', 'explosive'],
    resistances: ['blunt', 'blade'],
    description: '방사선 노출로 거대화된 변이 좀비.',
    stealthDifficulty: 0.3,
  },

  raider: {
    id: 'raider',
    name: '약탈자',
    icon: '🥷',
    type: 'human',
    hp: { min: 35, max: 55 },
    attack: { damage: [14, 22], accuracy: 0.68, noiseOnAttack: 25 },
    defense: 2,
    xp: 25,
    morale: { min: 80, max: 120 },
    lootTable: [
      { definitionId: 'pistol_ammo', weight: 35, minQty: 2, maxQty: 8 },
      { definitionId: 'canned_food', weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'bandage',     weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'knife',       weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'duct_tape',   weight: 5,  minQty: 1, maxQty: 1 },
      { definitionId: 'cloth_scrap', weight: 25, minQty: 1, maxQty: 3 },
      { definitionId: 'leather',     weight: 15, minQty: 1, maxQty: 1 },
      { definitionId: 'bone',        weight: 15, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0,
    aiPattern: 'opportunist',
    attackType: 'ranged',
    reloadAfterShots: 3,
    patternProfile: {
      role: 'opportunist',
      targetPolicy: 'opportunist',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.raider_shot',
        targetPolicy: 'opportunist',
        target: { side: 'opportunist', ranks: [1, 2, 3, 4], count: 1 },
        accuracy: 0.68,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [14, 22] }],
        motionKey: 'basic_attack',
      },
    },
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['blade'],
    resistances: ['bullet'],
    description: '무장한 생존자. 협상 불가.',
    stealthDifficulty: 0.8,
  },

  raider_elite: {
    id: 'raider_elite',
    name: '정예 약탈자',
    icon: '🦹',
    type: 'human',
    hp: { min: 55, max: 80 },
    attack: { damage: [18, 28], accuracy: 0.72, noiseOnAttack: 30 },
    defense: 4,
    xp: 45,
    morale: { min: 110, max: 150 },
    lootTable: [
      { definitionId: 'pistol_ammo', weight: 30, minQty: 3, maxQty: 8 },
      { definitionId: 'canned_food', weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'first_aid_kit', weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'knife',       weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'duct_tape',   weight: 10, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth_scrap', weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'leather',     weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',        weight: 15, minQty: 1, maxQty: 2 },
    ],
    infectionChance: 0,
    aiPattern: 'sniper',
    speed: 5,
    position: 'back',
    attackType: 'ranged',
    patternProfile: {
      role: 'sniper',
      targetPolicy: 'healer',
      defaultAction: {
        actionId: 'raider_elite_basic_shot',
        nameKey: 'combat.skill.enemy.raider_elite_basic_shot',
        targetPolicy: 'healer',
        target: { side: 'healer', ranks: [1, 2, 3, 4], count: 1 },
        accuracy: 0.72,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [18, 28] }],
        motionKey: 'basic_attack',
      },
    },
    // 정조준은 1턴 예고제 — 대상이 이동하면 70% 빗나감, 조준 중 피격 시 조준 취소
    specialSkills: [{
      id: 'aimed_shot', name: '정조준', nameKey: 'combat.skill.enemy.aimed_shot',
      rankSkillId: 'raider_elite_aimed_shot',
      targetPolicy: 'healer',
      target: { side: 'healer', ranks: [1, 2, 3, 4], count: 1 },
      accuracy: 0.78,
      hitCount: 1,
      telegraph: { turns: 1, moveEvadeChance: 0.7, cancelOnHit: true },
      effects: [{ type: 'damage', value: [25, 40] }],
      motionKey: 'aimed_shot',
      cooldown: 3,
      stunChance: 0.3,
    }],
    statusInflict: null,
    weaknesses: [],
    resistances: ['bullet', 'blade'],
    description: '후열에서 정조준 사격을 가하는 정예 약탈자. 전열을 뚫거나 원거리로 제압해야 한다.',
    stealthDifficulty: 0.85,
  },

  // ── 패거리 좀비 (Horde) ─────────────────────────────────
  zombie_horde: {
    id: 'zombie_horde',
    name: '좀비 무리',
    icon: '👥',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 100, max: 145 },
    attack: { damage: [6, 12], accuracy: 0.65, noiseOnAttack: 8 },
    defense: 0,
    xp: 35,
    attacksPerRound: 2,   // 매 라운드 2회 공격 (무리 패턴)
    spreadAttacks: true,  // 전열 아군 2+ 시 타격을 분산 — 전열 유지가 카운터
    lootTable: [
      { definitionId: 'tattered_rags', weight: 45, minQty: 2, maxQty: 4 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 3 },
      { definitionId: 'bandage',       weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'cloth_scrap',   weight: 30, minQty: 2, maxQty: 4 },
      { definitionId: 'bone',          weight: 25, minQty: 1, maxQty: 3 },
    ],
    infectionChance: 0.30,
    aiPattern: 'horde',
    patternProfile: {
      role: 'swarm',
      targetPolicy: 'frontmost',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.horde_attack',
        targetPolicy: 'frontmost',
        target: { side: 'frontmost', ranks: [1, 2], count: 2 },
        accuracy: 0.65,
        hitCount: 2,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [6, 12] }],
        motionKey: 'basic_attack',
      },
    },
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['fire', 'explosive'],
    resistances: [],
    description: '3~5마리가 함께 몰려오는 좀비 무리. 매 라운드 두 번 공격한다.',
    stealthDifficulty: 0.85,
  },

  // ── 광견병 걸린 개 ──────────────────────────────────────
  rabid_dog: {
    id: 'rabid_dog',
    name: '광견병 걸린 개',
    icon: '🐕',
    image: './assets/images/zombie_dog.png',
    type: 'animal',
    hp: { min: 20, max: 35 },
    attack: { damage: [8, 14], accuracy: 0.72, noiseOnAttack: 6 },
    defense: 0,
    xp: 15,
    attacksPerRound: 2,   // 빠른 개는 연속 2회 공격
    lootTable: [
      { definitionId: 'raw_meat',   weight: 50, minQty: 1, maxQty: 3 },
      { definitionId: 'bait_worm',  weight: 30, minQty: 1, maxQty: 3 },
      { definitionId: 'hide',       weight: 40, minQty: 1, maxQty: 1 },
      { definitionId: 'bone',       weight: 35, minQty: 1, maxQty: 2 },
    ],
    infectionChance: 0.35,
    aiPattern: 'aggressive',
    patternProfile: {
      role: 'predator',
      targetPolicy: 'lowest_hp',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.rabid_bite',
        targetPolicy: 'lowest_hp',
        target: { side: 'lowest_hp', ranks: [1, 2, 3, 4], count: 1 },
        accuracy: 0.72,
        hitCount: 2,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [8, 14] }],
        motionKey: 'basic_attack',
      },
    },
    specialSkills: [],
    statusInflict: { id: 'bleed', name: '출혈', duration: 2, effect: { hpLossPerRound: 3 } },
    onHitEffect: { infection: 5 },
    weaknesses: ['blade', 'bullet'],
    resistances: [],
    description: '광견병에 감염된 개. 빠르고 민첩하며 매 라운드 두 번 공격한다.',
    stealthDifficulty: 0.70,
  },

  // ── 특수 감염자 (Acid Spitter) ──────────────────────────
  zombie_acid: {
    id: 'zombie_acid',
    name: '특수 감염자',
    icon: '🤢',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 38, max: 60 },
    attack: { damage: [8, 14], accuracy: 0.72, noiseOnAttack: 3 },
    defense: 0,
    xp: 30,
    onHitEffect: { infection: 15, radiation: 8 },  // 명중 시 추가 디버프
    lootTable: [
      { definitionId: 'contaminated_water', weight: 30, minQty: 1, maxQty: 1 },
      { definitionId: 'tattered_rags',      weight: 20, minQty: 1, maxQty: 1 },
      { definitionId: 'cloth_scrap',        weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',               weight: 15, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.45,
    aiPattern: 'predator',
    position: 'back',
    attackType: 'ranged',
    patternProfile: {
      role: 'predator',
      targetPolicy: 'predator',
      defaultAction: {
        actionId: 'basic_attack',
        nameKey: 'combat.skill.enemy.acid_spit',
        targetPolicy: 'predator',
        target: { side: 'predator', ranks: [1, 2, 3, 4], count: 1 },
        accuracy: 0.72,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [8, 14] }],
        motionKey: 'basic_attack',
      },
    },
    // 혀 낚아채기: 후열에 숨은 대상을 전열로 끌어온다 — 원거리 캐릭터 보호가 과제가 된다
    specialSkills: [{
      id: 'acid_lash', name: '혀 낚아채기', nameKey: 'combat.skill.enemy.acid_lash',
      targetPolicy: 'predator',
      target: { side: 'predator', ranks: [1, 2, 3, 4], count: 1 },
      accuracy: 0.72,
      hitCount: 1,
      telegraph: { turns: 0 },
      effects: [
        { type: 'damage', value: [6, 10] },
        { type: 'move', distance: -2 },
      ],
      motionKey: 'acid_lash',
      cooldown: 4,
    }],
    // escalatePerTurn: 생존한 자기 턴마다 산성이 축적돼 hpLossPerRound가 커진다 — 방치 비용
    statusInflict: { id: 'acid_burn', name: '산성 화상', duration: 2, escalatePerTurn: 1, effect: { hpLossPerRound: 5, infection: 5 } },
    weaknesses: ['fire', 'bullet'],
    resistances: ['blade'],
    description: '후열에서 산성 체액을 분사하는 특수 감염자. 명중 시 감염·방사선이 추가 상승한다.',
    stealthDifficulty: 0.6,
  },

  zombie_bloater: {
    id: 'zombie_bloater',
    name: '블로터',
    icon: '🤰',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 45, max: 65 },
    attack: { damage: [4, 8], accuracy: 0.55, noiseOnAttack: 4 },
    defense: 0,
    xp: 32,
    lootTable: [
      { definitionId: 'contaminated_water', weight: 30, minQty: 1, maxQty: 1 },
      { definitionId: 'tattered_rags',      weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',               weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.35,
    aiPattern: 'normal',
    speed: 3,
    startRank: 2,
    patternProfile: {
      role: 'timed_bomber',
      targetPolicy: 'frontmost',
      defaultAction: {
        actionId: 'bloater_swipe',
        nameKey: 'combat.skill.enemy.bloater_swipe',
        targetPolicy: 'frontmost',
        target: { side: 'frontmost', ranks: [1, 2], count: 1 },
        accuracy: 0.55,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [4, 8] }],
        motionKey: 'basic_attack',
      },
    },
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['fire', 'explosive'],
    resistances: ['blade', 'bullet'],
    timedThreat: { id: 'self_destruct', nameKey: 'combat.skill.enemy.self_destruct',
      rankSkillId: 'bloater_self_destruct',
      chargeTurns: 3, chargingAttacks: true,
      targetPolicy: 'all',
      target: { side: 'all', ranks: [1, 2, 3, 4], count: 4 },
      accuracy: 1,
      hitCount: 1,
      telegraph: { turns: 3 },
      effects: [
        { type: 'damage', value: [25, 40] },
        { type: 'status', id: 'infection', value: 15 },
      ],
      motionKey: 'self_destruct',
      counters: { weakness: ['fire', 'explosive'], stunDelays: true } },
    description: '체내 가스가 부푼 감염자. 시간이 지나면 자폭해 광역 감염을 퍼뜨린다. 불·폭발로 빠르게 처리해야 한다.',
    stealthDifficulty: 0.4,
  },
  zombie_screamer: {
    id: 'zombie_screamer',
    name: '스크리머',
    icon: '🗣️',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 30, max: 45 },
    attack: { damage: [5, 9], accuracy: 0.6, noiseOnAttack: 6 },
    defense: 0,
    xp: 28,
    lootTable: [
      { definitionId: 'tattered_rags', weight: 30, minQty: 1, maxQty: 2 },
      { definitionId: 'cloth_scrap',   weight: 25, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',          weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.25,
    aiPattern: 'normal',
    speed: 4,
    position: 'back',
    attackType: 'ranged',
    patternProfile: {
      role: 'summoner',
      targetPolicy: 'frontmost',
      defaultAction: {
        actionId: 'screamer_spit',
        nameKey: 'combat.skill.enemy.screamer_spit',
        targetPolicy: 'frontmost',
        target: { side: 'frontmost', ranks: [1, 2, 3, 4], count: 1 },
        accuracy: 0.6,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [5, 9] }],
        motionKey: 'basic_attack',
      },
    },
    specialSkills: [],
    statusInflict: null,
    timedThreat: { id: 'summon_horde', nameKey: 'combat.skill.enemy.summon_horde',
      rankSkillId: 'screamer_summon_horde',
      chargeTurns: 3, chargingAttacks: true,
      targetPolicy: 'frontmost',
      target: { side: 'frontmost', ranks: [1, 2, 3, 4], count: 1 },
      accuracy: 1,
      hitCount: 1,
      telegraph: { turns: 3 },
      effects: [
        { type: 'damage', value: [0, 0] },
        { type: 'summon', enemyId: 'zombie_common', count: [1, 2] },
        { type: 'noise', value: 25 },
      ],
      motionKey: 'summon_horde',
      counters: { quietKill: true, stunDelays: true } },
    weaknesses: ['bullet', 'fire'],
    resistances: [],
    description: '후열에서 비명을 충전해 3턴 뒤 동족을 부르는 감염자. 기절로 비명을 늦추거나 조용히 처치해 사망 비명을 막아야 한다.',
    stealthDifficulty: 0.75,
  },
  zombie_charger: {
    id: 'zombie_charger',
    name: '돌진자',
    icon: '🐗',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 35, max: 55 },
    attack: { damage: [6, 10], accuracy: 0.6, noiseOnAttack: 7 },
    defense: 1,
    xp: 30,
    lootTable: [
      { definitionId: 'tattered_rags', weight: 30, minQty: 1, maxQty: 2 },
      { definitionId: 'scrap_metal',   weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bone',          weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.3,
    aiPattern: 'aggressive',
    speed: 6,
    patternProfile: {
      role: 'charger',
      targetPolicy: 'frontmost',
      defaultAction: {
        actionId: 'charger_lunge',
        nameKey: 'combat.skill.enemy.charger_lunge',
        targetPolicy: 'frontmost',
        target: { side: 'frontmost', ranks: [1, 2], count: 1 },
        accuracy: 0.6,
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [6, 10] }],
        motionKey: 'basic_attack',
      },
    },
    specialSkills: [],
    statusInflict: null,
    weaknesses: ['blade', 'fire'],
    resistances: [],
    timedThreat: { id: 'charge_strike', nameKey: 'combat.skill.enemy.charge_strike',
      rankSkillId: 'charger_impact',
      chargeTurns: 1, chargingAttacks: false,
      targetPolicy: 'frontmost',
      target: { side: 'frontmost', ranks: [1, 2], count: 1 },
      accuracy: 0.75,
      hitCount: 1,
      telegraph: { turns: 1 },
      effects: [
        { type: 'damage', value: [30, 45] },
        { type: 'status', id: 'stun', duration: 1 },
        { type: 'move', distance: 1 },
      ],
      motionKey: 'charge_strike',
      counters: { stunDelays: true } },
    description: '몸을 웅크렸다가 돌진하는 감염자. 강타 준비 중 기절시키거나 방어로 받아쳐야 한다.',
    stealthDifficulty: 0.6,
  },
};

// Encounter table per node danger level (1~5)
const ENCOUNTER_TABLES = {
  // DL1: 안전 구역 — 약한 적 위주, 드문 특수 감염자
  1: [
    { enemyId: 'zombie_common', weight: 65 },
    { enemyId: 'rabid_dog',     weight: 20 },
    { enemyId: 'zombie_runner', weight: 10 },
    { enemyId: 'zombie_acid',   weight: 5  },
  ],
  // DL2: 보통 구역 — 약탈자 등장, 러너 증가
  2: [
    { enemyId: 'zombie_common', weight: 30 },
    { enemyId: 'zombie_runner', weight: 25 },
    { enemyId: 'raider',        weight: 20 },
    { enemyId: 'rabid_dog',     weight: 15 },
    { enemyId: 'zombie_acid',   weight: 10 },
  ],
  // DL3: 위험 구역 — 거대 좀비·무리 등장, 정예 약탈자
  3: [
    { enemyId: 'zombie_runner', weight: 20 },
    { enemyId: 'zombie_common', weight: 15 },
    { enemyId: 'zombie_brute',  weight: 15 },
    { enemyId: 'zombie_acid',   weight: 15 },
    { enemyId: 'raider',        weight: 15 },
    { enemyId: 'zombie_horde',    weight: 10 },
    { enemyId: 'raider_elite',   weight: 5  },
    { enemyId: 'rabid_dog',      weight: 5  },
    { enemyId: 'zombie_bloater', weight: 8  },
    { enemyId: 'zombie_screamer',weight: 8  },
    { enemyId: 'zombie_charger', weight: 10 },
  ],
  // DL4: 고위험 구역 — 거대 좀비·무리 주력, 정예 약탈자 빈출
  4: [
    { enemyId: 'zombie_brute',   weight: 25 },
    { enemyId: 'zombie_horde',   weight: 20 },
    { enemyId: 'zombie_acid',    weight: 15 },
    { enemyId: 'raider_elite',   weight: 15 },
    { enemyId: 'zombie_runner',  weight: 15 },
    { enemyId: 'raider',         weight: 5  },
    { enemyId: 'rabid_dog',      weight: 5  },
    { enemyId: 'zombie_bloater', weight: 12 },
    { enemyId: 'zombie_screamer',weight: 12 },
    { enemyId: 'zombie_charger', weight: 13 },
  ],
  // DL5: 극위험 구역 — 최강 적 위주, 약한 적 없음
  5: [
    { enemyId: 'zombie_brute',   weight: 30 },
    { enemyId: 'zombie_horde',   weight: 30 },
    { enemyId: 'raider_elite',   weight: 20 },
    { enemyId: 'zombie_acid',    weight: 15 },
    { enemyId: 'zombie_runner',  weight: 5  },
    { enemyId: 'zombie_bloater', weight: 15 },
    { enemyId: 'zombie_screamer',weight: 12 },
    { enemyId: 'zombie_charger', weight: 15 },
  ],
};

function instantiateEnemy(def) {
  const hp = def.hp.min + Math.floor(Math.random() * (def.hp.max - def.hp.min + 1));
  return {
    ...def,
    currentHp: hp,
    maxHp:     hp,
    row:       def.position ?? 'front',
    _skillCooldowns: {},
    _statusEffects: [],
    _chargeRemaining: def.timedThreat?.chargeTurns ?? null,
    _dormantRemaining: def.dormant?.wakeTurns ?? null,
    currentMorale:    def.type === 'human' ? (def.morale?.max ?? 100) : null,
  };
}

function rollEnemy(dangerLevel) {
  const table = ENCOUNTER_TABLES[Math.min(dangerLevel, 5)] || ENCOUNTER_TABLES[1];
  const total = table.reduce((s, e) => s + e.weight, 0);
  let rand = Math.random() * total;
  for (const entry of table) {
    rand -= entry.weight;
    if (rand <= 0) {
      return instantiateEnemy(ENEMIES[entry.enemyId]);
    }
  }
  return instantiateEnemy(ENEMIES['zombie_common']);
}

/**
 * 소음 수준에 따른 적 그룹 생성
 * - 소음  0~29  → 1마리, 위험도 -1 (약한 적)
 * - 소음 30~64  → 2마리, 위험도 그대로
 * - 소음 65~    → 3마리, 위험도 +1 (강한 적)
 *
 * @param {number} dangerLevel - 장소 위험도 (1~5)
 * @param {number} noiseLevel  - 현재 소음 수치 (0~100)
 * @param {number} partySize   - 플레이어 포함 아군 수 (동료 수만큼 조우 규모 확대)
 * @returns {Array} 적 인스턴스 배열
 */
function rollEnemyGroup(dangerLevel, noiseLevel = 0, partySize = 1) {
  let count, effectiveDanger;
  if (noiseLevel < 30) {
    count          = 1;
    effectiveDanger = Math.max(1, dangerLevel - 1);
  } else if (noiseLevel < 65) {
    count          = 2;
    effectiveDanger = dangerLevel;
  } else {
    count          = 3;
    effectiveDanger = Math.min(5, dangerLevel + 1);
  }
  // 파티 화력이 조우 난이도를 무력화하지 않도록 동료 수만큼 규모 확대 (진형 4칸 상한).
  // 솔로 플레이 수치는 불변.
  count = Math.min(4, count + Math.max(0, partySize - 1));
  return ensureFrontRank(Array.from({ length: count }, () => rollEnemy(effectiveDanger)));
}

// 진형 보정(호위 규칙): 굴림 결과가 후열로만 구성되면 첫 적을 전열로 내린다.
// 전열이 비면 근접 도달 규칙상 후열이 그대로 노출되어 랭크 메커닉이 무력화되고,
// UI의 "후열" 배지가 도달 가능 상태와 모순되게 보이기 때문.
function ensureFrontRank(enemies) {
  if (enemies.length > 0 && !enemies.some(e => (e.row ?? 'front') === 'front')) {
    enemies[0].row = 'front';
  }
  return enemies;
}

export { ENEMIES, ENCOUNTER_TABLES, rollEnemy, rollEnemyGroup, instantiateEnemy, ensureFrontRank };
export default ENEMIES;
