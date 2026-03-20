// === ITEMS: LEGENDARY (전설급 무기·방어구·의료·도구·특수) ===
// 전설 아이템 24 + 보스 드롭 재료 25 + 제작 재료 3 + 히든 장소 보상 13 + 히든 레시피 20 + 이벤트 체인 1 = 86 items
// (map_fragment는 items_misc.js에 이미 존재하므로 여기서 생략)

const LEGENDARY_ITEMS = {

  // ─── 전설 무기 (6) ──────────────────────────────────────────

  royal_katana: {
    id: 'royal_katana', name: '왕실 도검', type: 'weapon', subtype: 'melee',
    rarity: 'legendary', legendary: true, weight: 0.8,
    defaultDurability: 150, defaultContamination: 0,
    icon: '⚔️', description: '조선 왕실에서 전해진 명검. 크리티컬 공격 시 거의 무소음으로 적을 베어낸다.',
    tags: ['weapon', 'melee', 'legendary'],
    combat: {
      damage: [35, 55], accuracy: 0.85, noiseOnUse: 1, durabilityLoss: 3,
      critChance: 0.30, critMultiplier: 2.5,
    },
    dismantle: [
      { definitionId: 'sharp_blade', qty: 2, chance: 0.9 },
      { definitionId: 'leather', qty: 1, chance: 0.7 },
    ],
  },

  m4_carbine: {
    id: 'm4_carbine', name: 'M4 카빈', type: 'weapon', subtype: 'firearm',
    rarity: 'legendary', legendary: true, weight: 3.5,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🔫', description: '미군 기지에서 수습한 자동소총. 크리티컬 시 3점사를 퍼붓는다.',
    tags: ['weapon', 'ranged', 'legendary', 'loud'],
    combat: {
      damage: [45, 70], accuracy: 0.75, noiseOnUse: 35, durabilityLoss: 2,
      requiresAmmo: 'rifle_ammo', critChance: 0.15, critMultiplier: 2.0,
      attacksPerRoundOnCrit: 3,
    },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'spring', qty: 2, chance: 0.6 },
      { definitionId: 'sniper_scope', qty: 1, chance: 0.3 },
    ],
  },

  confiscated_sniper: {
    id: 'confiscated_sniper', name: '압수 저격소총', type: 'weapon', subtype: 'firearm',
    rarity: 'legendary', legendary: true, weight: 4.0,
    defaultDurability: 180, defaultContamination: 0,
    icon: '🎯', description: '경찰 특수부대에서 압수한 저격용 소총. HP 50% 미만의 적을 즉사시킨다.',
    tags: ['weapon', 'ranged', 'legendary', 'loud'],
    combat: {
      damage: [60, 90], accuracy: 0.70, noiseOnUse: 40, durabilityLoss: 2,
      requiresAmmo: 'rifle_ammo', critChance: 0.35, critMultiplier: 3.0,
      special: 'execute',
    },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'sniper_scope', qty: 1, chance: 0.5 },
      { definitionId: 'spring', qty: 1, chance: 0.6 },
    ],
  },

  frost_blade: {
    id: 'frost_blade', name: '냉각 합금 나이프', type: 'weapon', subtype: 'melee',
    rarity: 'legendary', legendary: true, weight: 1.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '❄️', description: '극저온 냉각 합금으로 벼린 칼날. 30% 확률로 적을 동결시켜 1턴 기절.',
    tags: ['weapon', 'melee', 'legendary'],
    combat: {
      damage: [30, 48], accuracy: 0.82, noiseOnUse: 2, durabilityLoss: 4,
      critChance: 0.20, critMultiplier: 2.0,
      statusInflict: { id: 'freeze', name: '빙결', duration: 1, effect: { skipTurn: true }, chance: 0.30 },
    },
    dismantle: [
      { definitionId: 'sharp_blade', qty: 1, chance: 0.8 },
      { definitionId: 'cryo_core', qty: 1, chance: 0.5 },
    ],
  },

  acid_whip: {
    id: 'acid_whip', name: '산성 채찍', type: 'weapon', subtype: 'melee',
    rarity: 'legendary', legendary: true, weight: 0.6,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🧪', description: '산성 분비물로 코팅된 변이 채찍. 방어력을 점점 깎으며 광역 피해를 입힌다.',
    tags: ['weapon', 'melee', 'legendary'],
    combat: {
      damage: [22, 38], accuracy: 0.78, noiseOnUse: 3, durabilityLoss: 5,
      critChance: 0.15, critMultiplier: 1.8,
      statusInflict: { id: 'acid_corrosion', name: '산성 부식', duration: 3, effect: { defenseReduction: 0.10 }, chance: 0.40 },
      aoe: true,
    },
    dismantle: [
      { definitionId: 'acid_gland', qty: 1, chance: 0.6 },
      { definitionId: 'acid_crystal', qty: 1, chance: 0.4 },
    ],
  },

  warlord_rifle: {
    id: 'warlord_rifle', name: '두목의 소총', type: 'weapon', subtype: 'firearm',
    rarity: 'legendary', legendary: true, weight: 3.8,
    defaultDurability: 190, defaultContamination: 0,
    icon: '💀', description: '약탈자 두목이 사용하던 소총. 적을 쓰러뜨리면 나머지 적이 30% 확률로 도주한다.',
    tags: ['weapon', 'ranged', 'legendary', 'loud'],
    combat: {
      damage: [50, 75], accuracy: 0.72, noiseOnUse: 30, durabilityLoss: 2,
      requiresAmmo: 'rifle_ammo', critChance: 0.20, critMultiplier: 2.2,
      onKill: { enemyFleeChance: 0.30 },
    },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'warlord_medal', qty: 1, chance: 0.4 },
      { definitionId: 'spring', qty: 2, chance: 0.6 },
    ],
  },

  // ─── 전설 방어구 (5) ────────────────────────────────────────

  crocodile_scale_armor: {
    id: 'crocodile_scale_armor', name: '악어 비늘 갑옷', type: 'armor', subtype: 'body',
    rarity: 'legendary', legendary: true, weight: 4.0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🐊', description: '하수도 악어의 비늘로 만든 갑옷. 피해 35% 감소, 완전 방수.',
    tags: ['armor', 'legendary', 'body'],
    onWear: { damageReduction: 0.35, waterproof: true },
    dismantle: [
      { definitionId: 'sewer_scale', qty: 2, chance: 0.7 },
      { definitionId: 'leather', qty: 3, chance: 0.8 },
    ],
  },

  ghillie_suit: {
    id: 'ghillie_suit', name: '위장복', type: 'armor', subtype: 'body',
    rarity: 'legendary', legendary: true, weight: 1.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '전문 저격수용 위장복. 적 조우 확률 50% 감소, 은신 90% 보너스.',
    tags: ['armor', 'legendary', 'body'],
    onWear: { encounterReduction: 0.50, stealthBonus: 0.90 },
    dismantle: [
      { definitionId: 'cloth', qty: 4, chance: 0.8 },
      { definitionId: 'rope', qty: 2, chance: 0.7 },
    ],
  },

  dragon_scale_vest: {
    id: 'dragon_scale_vest', name: '변이체 강화 방탄복', type: 'armor', subtype: 'body',
    rarity: 'legendary', legendary: true, weight: 5.0,
    defaultDurability: 250, defaultContamination: 0,
    icon: '🛡️', description: '케블라 직물과 변이체 외피를 결합한 최강의 방탄복. 피해 40% 감소.',
    tags: ['armor', 'legendary', 'body', 'crafted'],
    onWear: { damageReduction: 0.40 },
    dismantle: [
      { definitionId: 'kevlar_fabric', qty: 2, chance: 0.7 },
      { definitionId: 'colossus_core', qty: 1, chance: 0.4 },
      { definitionId: 'leather', qty: 2, chance: 0.8 },
    ],
  },

  acid_resistant_cloak: {
    id: 'acid_resistant_cloak', name: '내산성 망토', type: 'armor', subtype: 'body',
    rarity: 'legendary', legendary: true, weight: 1.2,
    defaultDurability: 150, defaultContamination: 0,
    icon: '☣️', description: '산성 면역 특수 소재 망토. 오염 피해를 90% 차단한다.',
    tags: ['armor', 'legendary', 'body'],
    onWear: { acidImmunity: true, contaminationMult: 0.10 },
    dismantle: [
      { definitionId: 'acid_crystal', qty: 1, chance: 0.5 },
      { definitionId: 'cloth', qty: 3, chance: 0.8 },
      { definitionId: 'rubber', qty: 2, chance: 0.7 },
    ],
  },

  fireproof_suit: {
    id: 'fireproof_suit', name: '내열 방호복', type: 'armor', subtype: 'body',
    rarity: 'legendary', legendary: true, weight: 3.0,
    defaultDurability: 180, defaultContamination: 0,
    icon: '🔥', description: '극한 온도 72도까지 버티는 방호복. 방사선 피해 30% 감소.',
    tags: ['armor', 'legendary', 'body'],
    onWear: { temperatureImmunity: 72, radiationMult: 0.70 },
    dismantle: [
      { definitionId: 'inferno_core', qty: 1, chance: 0.4 },
      { definitionId: 'rubber', qty: 3, chance: 0.8 },
      { definitionId: 'cloth', qty: 2, chance: 0.7 },
    ],
  },

  // ─── 전설 의료 (4) ──────────────────────────────────────────

  surgical_grade_kit: {
    id: 'surgical_grade_kit', name: '외과전문 수술키트', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏥', description: '군의관급 수술 장비. HP 완전 회복, 감염 대폭 제거, 모든 질병 치료.',
    tags: ['medical', 'healing', 'legendary'],
    onConsume: { hp: 100, infection: -70, cureAllDiseases: true },
    dismantle: [
      { definitionId: 'antiseptic', qty: 3, chance: 0.8 },
      { definitionId: 'gauze', qty: 4, chance: 0.8 },
      { definitionId: 'sharp_blade', qty: 1, chance: 0.6 },
      { definitionId: 'doctor_badge', qty: 1, chance: 0.3 },
    ],
  },

  completed_antiviral: {
    id: 'completed_antiviral', name: '완성형 항바이러스', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '연구소에서 완성된 항바이러스제. 감염을 0으로 리셋하고 영구 저항력 50% 부여.',
    tags: ['medical', 'healing', 'legendary'],
    onConsume: { infection: -100, permanentInfectionResist: 0.50 },
    dismantle: [
      { definitionId: 'virus_sample', qty: 1, chance: 0.5 },
      { definitionId: 'antibiotics', qty: 2, chance: 0.7 },
    ],
  },

  royal_jelly_medicine: {
    id: 'royal_jelly_medicine', name: '로열젤리', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍯', description: '여왕벌에서 추출한 로열젤리 약제. HP·감염·피로를 한 번에 회복하고 질병을 치료.',
    tags: ['medical', 'healing', 'legendary'],
    onConsume: { hp: 60, infection: -50, fatigue: -40, cureAllDiseases: true },
    dismantle: [],
  },

  hermit_elixir: {
    id: 'hermit_elixir', name: '은자의 약재', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '산속 은둔자가 조제한 비전의 약. 감염을 낮추고 사기를 크게 올린다.',
    tags: ['medical', 'healing', 'legendary'],
    onConsume: { infection: -40, morale: 20 },
    dismantle: [],
  },

  // ─── 전설 도구 (5) ──────────────────────────────────────────

  master_toolkit: {
    id: 'master_toolkit', name: '장인의 도구 세트', type: 'tool', subtype: 'crafting',
    rarity: 'legendary', legendary: true, weight: 2.0,
    defaultDurability: 300, defaultContamination: 0,
    icon: '🔧', description: '장인이 직접 만든 만능 공구 세트. 제작 성공률 50% 상승, 제작 시간 30% 단축.',
    tags: ['tool', 'legendary'],
    onUse: { craftSuccessBonus: 0.50, craftTimeReduction: 0.30 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.9 },
      { definitionId: 'engineer_gear', qty: 1, chance: 0.4 },
    ],
  },

  ammo_press: {
    id: 'ammo_press', name: '탄약 프레스', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 8.0,
    defaultDurability: 500, defaultContamination: 0,
    icon: '⚙️', description: '탄약을 직접 제조할 수 있는 프레스 기계. 설치 시 탄약 제작 해금.',
    tags: ['tool', 'legendary'],
    onUse: { enablesAmmoCraft: true },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 6, chance: 0.9 },
      { definitionId: 'spring', qty: 3, chance: 0.7 },
      { definitionId: 'engineer_gear', qty: 1, chance: 0.3 },
    ],
  },

  crew_pass: {
    id: 'crew_pass', name: '승무원 통행증', type: 'armor', subtype: 'accessory',
    rarity: 'legendary', legendary: true, weight: 0.1,
    defaultDurability: Infinity, defaultContamination: 0,
    icon: '🎫', description: '붕괴 전 지하철 승무원의 통행증. 이동 비용이 50% 감소한다.',
    tags: ['armor', 'legendary', 'accessory'],
    onWear: { travelCostReduction: 0.50 },
    dismantle: [],
  },

  nuclear_battery: {
    id: 'nuclear_battery', name: '핵 배터리', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 5.0,
    defaultDurability: 1000, defaultContamination: 0,
    icon: '☢️', description: '소형 원자력 전지. 설치한 구조물에 100일간 전력을 공급한다.',
    tags: ['tool', 'legendary'],
    onUse: { structurePowerDays: 100 },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 4, chance: 0.8 },
      { definitionId: 'wire', qty: 3, chance: 0.7 },
    ],
  },

  tiger_fang_necklace: {
    id: 'tiger_fang_necklace', name: '호랑이 이빨 목걸이', type: 'armor', subtype: 'accessory',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: Infinity, defaultContamination: 0,
    icon: '🐯', description: '변이 호랑이의 이빨로 만든 목걸이. 치명타 확률과 배율이 대폭 상승.',
    tags: ['armor', 'legendary', 'accessory'],
    onWear: { critBonus: 0.15, critMultiplierBonus: 0.5 },
    dismantle: [
      { definitionId: 'tiger_fang', qty: 2, chance: 0.8 },
      { definitionId: 'rope', qty: 1, chance: 0.9 },
    ],
  },

  // ─── 전설 소비/특수 (4) ─────────────────────────────────────

  queen_pheromone: {
    id: 'queen_pheromone', name: '여왕 페로몬', type: 'consumable', subtype: 'special',
    rarity: 'legendary', legendary: true, weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👑', description: '좀비 여왕에서 추출한 페로몬. 사용 후 24TP 동안 좀비가 접근하지 않는다.',
    tags: ['special', 'legendary'],
    onConsume: { zombieRepelTP: 24 },
    dismantle: [],
  },

  veterinary_tranquilizer: {
    id: 'veterinary_tranquilizer', name: '수의과 마취제', type: 'consumable', subtype: 'special',
    rarity: 'legendary', legendary: true, weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '대형 동물용 마취제. 보스급 적까지 2턴 기절시킨다.',
    tags: ['special', 'legendary'],
    onConsume: { guaranteedStun: 2 },
    dismantle: [],
  },

  gold_watch: {
    id: 'gold_watch', name: '금시계', type: 'armor', subtype: 'accessory',
    rarity: 'legendary', legendary: true, weight: 0.3,
    defaultDurability: Infinity, defaultContamination: 0,
    icon: '⌚', description: '가문 대대로 전해진 금시계. 착용 시 사기 감소 속도가 50% 줄어든다.',
    tags: ['armor', 'legendary', 'accessory'],
    onWear: { moraleDecayReduction: 0.50 },
    dismantle: [
      { definitionId: 'gold_watch_raw', qty: 1, chance: 0.9 },
      { definitionId: 'electronic_parts', qty: 1, chance: 0.5 },
    ],
  },

  waterproof_container: {
    id: 'waterproof_container', name: '방수 컨테이너', type: 'tool', subtype: 'storage',
    rarity: 'legendary', legendary: true, weight: 1.0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '📦', description: '군용 방수 컨테이너. 추가 8슬롯 확보, 내부 아이템 오염 면역.',
    tags: ['tool', 'legendary'],
    bagSlots: 8,
    onUse: { contaminationImmunity: true },
    dismantle: [
      { definitionId: 'rubber', qty: 3, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'plastic', qty: 2, chance: 0.8 },
    ],
  },

  // ─── 보스 드롭 재료 (21) ────────────────────────────────────

  zero_strain: {
    id: 'zero_strain', name: '제로 변이주', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧬', description: '페이션트 제로에서 채취한 최초 변이 바이러스. 백신 연구의 핵심 재료.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  colossus_core: {
    id: 'colossus_core', name: '거대 변이체 핵', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💎', description: '거대 변이체의 심장부에서 추출한 에너지 핵. 변이체 강화 방탄복 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  acid_gland: {
    id: 'acid_gland', name: '산성 분비선', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫧', description: '산성 변이체에서 적출한 분비선. 산성 무기 제작에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  horde_crown: {
    id: 'horde_crown', name: '무리 지배자의 관', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👑', description: '좀비 무리의 우두머리가 쓰고 있던 뒤틀린 뼈관. 여왕 페로몬 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  cryo_core: {
    id: 'cryo_core', name: '냉동 핵', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧊', description: '냉기 변이체에서 추출한 극저온 핵. 냉각 합금 나이프 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  warlord_medal: {
    id: 'warlord_medal', name: '두목의 훈장', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🎖️', description: '약탈자 두목이 지니고 있던 군 훈장. 두목의 소총 강화에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  sniper_scope: {
    id: 'sniper_scope', name: '저격 스코프', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔭', description: '고배율 저격용 조준경. 저격소총 제작·강화에 필수.',
    tags: ['material', 'boss_drop'],
    dismantle: [{ definitionId: 'glass_shard', qty: 2, chance: 0.7 }],
  },

  cult_talisman: {
    id: 'cult_talisman', name: '사이비 부적', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔮', description: '교주가 소지하던 기이한 부적. 특수 아이템 제작에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  tiger_fang: {
    id: 'tiger_fang', name: '호랑이 이빨', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🦷', description: '변이 호랑이의 날카로운 송곳니. 목걸이 제작에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  sewer_scale: {
    id: 'sewer_scale', name: '하수도 비늘', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐊', description: '하수도 악어에서 벗겨낸 단단한 비늘. 악어 비늘 갑옷 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  alpha_fang: {
    id: 'alpha_fang', name: '알파 송곳니', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐺', description: '변이 늑대 알파의 송곳니. 전설 무기 강화 재료.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  conductor_key: {
    id: 'conductor_key', name: '차장 열쇠', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗝️', description: '지하철 차장이 소지하던 마스터키. 승무원 통행증 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  ai_chip: {
    id: 'ai_chip', name: 'AI 칩', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🤖', description: '군용 AI 드론에서 추출한 연산 칩. 고급 전자장비 제작에 사용.',
    tags: ['material', 'boss_drop', 'tech'],
    dismantle: [{ definitionId: 'electronic_parts', qty: 3, chance: 0.8 }],
  },

  mutant_heart: {
    id: 'mutant_heart', name: '변이 심장', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '❤️‍🔥', description: '강력한 변이체의 심장. 아직 미약하게 뛰고 있다. 특수 약재 제작에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  inferno_core: {
    id: 'inferno_core', name: '화염 핵', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌋', description: '화염 변이체에서 추출한 발열 핵. 내열 방호복 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  leviathan_scale: {
    id: 'leviathan_scale', name: '한강 괴수 비늘', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐉', description: '한강의 거대 수중 변이체에서 채취한 비늘. 최고급 방어구 재료.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  wraith_essence: {
    id: 'wraith_essence', name: '유령 변이체 잔류물', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👻', description: '유령처럼 움직이던 변이체의 정수. 위장복 강화에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  acid_crystal: {
    id: 'acid_crystal', name: '산성 결정', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💚', description: '산성 변이체의 체내에서 결정화된 산. 내산성 장비 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  doctor_badge: {
    id: 'doctor_badge', name: '군의관 배지', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏅', description: '감염된 군의관이 지니고 있던 배지. 외과 수술키트 제작에 필요.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  engineer_gear: {
    id: 'engineer_gear', name: '공병 장비', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛠️', description: '군 공병대가 사용하던 정밀 장비. 장인의 도구 세트 제작에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.8 }],
  },

  gold_watch_raw: {
    id: 'gold_watch_raw', name: '금시계 (파손)', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⏱️', description: '부서진 금시계. 수리하면 전설급 악세서리가 된다.',
    tags: ['material', 'boss_drop'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 1, chance: 0.9 }],
  },

  // ─── 캐릭터 네메시스 드롭 재료 (4) ──────────────────────────

  soldier_dogtag: {
    id: 'soldier_dogtag', name: '전우의 인식표', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🎖️', description: '탈영한 전우가 지니고 있던 군번줄. 전설 군장 강화에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  firefighter_badge: {
    id: 'firefighter_badge', name: '소방관 배지', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🚒', description: '감염된 동료 이재훈이 달고 있던 소방관 배지. 전설 방어구 제작에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  debt_ledger: {
    id: 'debt_ledger', name: '빚 장부', type: 'consumable', subtype: 'special',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📒', description: '사채업자의 장부. 사용하면 과거의 짐을 내려놓고 사기가 대폭 회복된다.',
    tags: ['consumable', 'special'],
    onConsume: { morale: 30 },
    dismantle: [],
  },

  mutant_formula: {
    id: 'mutant_formula', name: '변이 조제법', type: 'material', subtype: 'boss_drop',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📝', description: '변이 약사에게서 발견한 조제법. 히든 의료 레시피 해금에 사용.',
    tags: ['material', 'boss_drop'],
    dismantle: [],
  },

  // ─── 제작 재료 (4) ──────────────────────────────────────────

  kevlar_fabric: {
    id: 'kevlar_fabric', name: '케블라 직물', type: 'material', subtype: 'textile',
    rarity: 'rare', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧵', description: '방탄 성능을 가진 특수 직물. 변이체 강화 방탄복 제작에 필수.',
    tags: ['material', 'textile'],
    dismantle: [{ definitionId: 'cloth', qty: 3, chance: 0.8 }],
  },

  virus_sample: {
    id: 'virus_sample', name: '바이러스 샘플', type: 'material', subtype: 'chemical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 50,
    icon: '🦠', description: '밀봉된 변이 바이러스 표본. 백신·항바이러스 연구에 필수. 취급 주의.',
    tags: ['material', 'chemical', 'contaminated'],
    dismantle: [],
  },

  // map_fragment: items_misc.js에 이미 존재 — 중복 방지를 위해 생략

  rifle_ammo: {
    id: 'rifle_ammo', name: '소총 탄약', type: 'consumable', subtype: 'ammo',
    rarity: 'uncommon', weight: 0.08,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔴', description: '5.56mm NATO 탄. 전설급 소총류에 사용.',
    tags: ['ammo'],
    dismantle: [],
  },

  // ─── 히든 장소 보상 (13) ──────────────────────────────────

  survivors_cache: {
    id: 'survivors_cache', name: '생존자의 비축물자', type: 'consumable', subtype: 'special',
    rarity: 'legendary', legendary: true, weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📦', description: '은신처에 숨겨진 생존자의 비축물자. 식량·물·붕대가 한 묶음으로 들어 있다.',
    tags: ['consumable', 'legendary'],
    onConsume: { hp: 30, hunger: -30, thirst: -30 },
    dismantle: [],
  },

  pristine_spring_water: {
    id: 'pristine_spring_water', name: '원시 샘물', type: 'consumable', subtype: 'special',
    rarity: 'legendary', legendary: true, weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💧', description: '오염되지 않은 산속 원시 샘물. 마시면 감염이 줄고 갈증이 완전히 해소된다.',
    tags: ['consumable', 'legendary'],
    onConsume: { hp: 20, infection: -15, thirst: -100 },
    dismantle: [],
  },

  experimental_antiviral: {
    id: 'experimental_antiviral', name: '실험적 항바이러스제', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '대학 연구실에서 발견된 실험적 항바이러스제. 감염을 크게 낮추고 체력을 회복한다.',
    tags: ['medical', 'legendary'],
    onConsume: { infection: -60, hp: 10 },
    dismantle: [],
  },

  sound_dampener: {
    id: 'sound_dampener', name: '소음 감쇠기', type: 'tool', subtype: 'utility',
    rarity: 'legendary', legendary: true, weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔇', description: '군용 소음 감쇠 장치. 장착 시 모든 행동의 소음이 50% 감소한다.',
    tags: ['tool', 'legendary'],
    onUse: { noiseReduction: 0.50 },
    dismantle: [],
  },

  military_radio_kit: {
    id: 'military_radio_kit', name: '군용 통신 키트', type: 'tool', subtype: 'utility',
    rarity: 'legendary', legendary: true, weight: 1.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📻', description: '군용 등급 통신 장비. 군사 주파수 접근이 가능해진다.',
    tags: ['tool', 'legendary'],
    onUse: { enablesMilitaryComm: true },
    dismantle: [],
  },

  master_forge: {
    id: 'master_forge', name: '장인의 대장간', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 10.0,
    defaultDurability: 500, defaultContamination: 0,
    icon: '🔨', description: '전설급 무기·방어구 제작에 필요한 대장간. 설치하면 전설 제작이 해금된다.',
    tags: ['tool', 'legendary', 'structure'],
    onUse: { enablesLegendaryCraft: true },
    dismantle: [],
  },

  helicopter_key: {
    id: 'helicopter_key', name: '헬리콥터 열쇠', type: 'tool', subtype: 'key',
    rarity: 'legendary', legendary: true, weight: 0.1,
    defaultDurability: Infinity, defaultContamination: 0,
    icon: '🔑', description: '롯데타워 옥상 헬리콥터의 시동 열쇠. 탈출 엔딩의 핵심 아이템.',
    tags: ['key_item', 'legendary'],
    dismantle: [],
  },

  broadcast_equipment: {
    id: 'broadcast_equipment', name: '방송 장비', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 5.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📡', description: '비상 방송이 가능한 장비. 설치하면 구조 신호를 송출할 수 있다.',
    tags: ['tool', 'legendary', 'structure'],
    onUse: { enablesBroadcast: true },
    dismantle: [],
  },

  aircraft_parts: {
    id: 'aircraft_parts', name: '항공기 부품', type: 'material', subtype: 'key',
    rarity: 'legendary', legendary: true, weight: 8.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '✈️', description: '경비행기 수리에 필요한 항공기 부품. 비행기 탈출 엔딩에 필수.',
    tags: ['key_item', 'legendary'],
    dismantle: [],
  },

  civil_defense_cache: {
    id: 'civil_defense_cache', name: '민방위 비축물자', type: 'consumable', subtype: 'special',
    rarity: 'legendary', legendary: true, weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏠', description: '민방위 대피소에 비축된 대량의 비상 물자. 체력·배고픔·갈증을 크게 회복.',
    tags: ['consumable', 'legendary'],
    onConsume: { hp: 40, hunger: -40, thirst: -40 },
    dismantle: [],
  },

  industrial_purifier: {
    id: 'industrial_purifier', name: '산업용 정수기', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 6.0,
    defaultDurability: 400, defaultContamination: 0,
    icon: '🚰', description: '산업용 정수 시설. 설치하면 오염된 물을 한 번에 3개씩 정수할 수 있다.',
    tags: ['tool', 'legendary', 'structure'],
    onUse: { enablesWaterPurification: true, purifyRate: 3 },
    dismantle: [],
  },

  river_boat: {
    id: 'river_boat', name: '한강 보트', type: 'tool', subtype: 'key',
    rarity: 'legendary', legendary: true, weight: 0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⛵', description: '한강변에 정박된 보트. 강을 건너 탈출하는 엔딩에 사용된다.',
    tags: ['key_item', 'legendary'],
    dismantle: [],
  },

  seoul_emergency_plan: {
    id: 'seoul_emergency_plan', name: '서울시 비상 대응 계획서', type: 'consumable', subtype: 'special',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', description: '서울시 비상 대응 계획서. 사용하면 모든 미발견 히든 장소가 지도에 표시된다.',
    tags: ['key_item', 'legendary'],
    onConsume: { revealAllHiddenLocations: true },
    dismantle: [],
  },

  // ─── 히든 레시피 제작 아이템 (20) ─────────────────────────

  explosive_bolt: {
    id: 'explosive_bolt', name: '폭발 석궁 화살', type: 'consumable', subtype: 'ammo',
    rarity: 'legendary', legendary: true, weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💥', description: '착탄 시 폭발하여 광역 피해를 입히는 석궁 화살.',
    tags: ['ammo', 'legendary'],
    combat: {
      damage: [40, 60], accuracy: 0.70, noiseOnUse: 25, aoe: true,
    },
    dismantle: [],
  },

  electric_blade: {
    id: 'electric_blade', name: '전기 칼날', type: 'weapon', subtype: 'melee',
    rarity: 'legendary', legendary: true, weight: 0.8,
    defaultDurability: 120, defaultContamination: 0,
    icon: '⚡', description: '전류가 흐르는 칼날. 25% 확률로 적을 감전시켜 1턴 행동불능.',
    tags: ['weapon', 'melee', 'legendary'],
    combat: {
      damage: [32, 50], accuracy: 0.83, noiseOnUse: 3, durabilityLoss: 4,
      critChance: 0.20, critMultiplier: 2.0,
      statusInflict: { id: 'shock', name: '감전', duration: 1, effect: { skipTurn: true }, chance: 0.25 },
    },
    dismantle: [],
  },

  silenced_pistol: {
    id: 'silenced_pistol', name: '소음기 권총', type: 'weapon', subtype: 'firearm',
    rarity: 'legendary', legendary: true, weight: 1.2,
    defaultDurability: 160, defaultContamination: 0,
    icon: '🤫', description: '소음기가 장착된 권총. 소음이 극도로 낮아 은밀한 전투에 적합하다.',
    tags: ['weapon', 'ranged', 'legendary', 'silent'],
    combat: {
      damage: [28, 45], accuracy: 0.80, noiseOnUse: 5, durabilityLoss: 2,
      requiresAmmo: 'pistol_ammo', critChance: 0.20, critMultiplier: 2.0,
    },
    dismantle: [],
  },

  ultra_reinforced_bat: {
    id: 'ultra_reinforced_bat', name: '극강화 배트', type: 'weapon', subtype: 'melee',
    rarity: 'legendary', legendary: true, weight: 2.5,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🏏', description: '금속 강화 처리를 거듭한 야구 배트. 크리티컬 시 적을 한 방에 쓰러뜨린다.',
    tags: ['weapon', 'melee', 'legendary'],
    combat: {
      damage: [38, 60], accuracy: 0.80, noiseOnUse: 8, durabilityLoss: 2,
      critChance: 0.25, critMultiplier: 2.5,
    },
    dismantle: [],
  },

  extreme_cold_suit: {
    id: 'extreme_cold_suit', name: '극한 방한복', type: 'armor', subtype: 'body',
    rarity: 'legendary', legendary: true, weight: 2.5,
    defaultDurability: 180, defaultContamination: 0,
    icon: '🧥', description: '극한 환경용 방한복. 피해 15% 감소, 추위 면역, 영하 40도까지 버틴다.',
    tags: ['armor', 'legendary', 'body'],
    onWear: { damageReduction: 0.15, coldImmunity: true, temperatureMin: -40 },
    dismantle: [],
  },

  stealth_suit: {
    id: 'stealth_suit', name: '은밀 슈트', type: 'armor', subtype: 'body',
    rarity: 'legendary', legendary: true, weight: 1.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🥷', description: '적의 탐지를 피하는 은밀 슈트. 조우 확률 40% 감소, 은신 80% 보너스.',
    tags: ['armor', 'legendary', 'body'],
    onWear: { encounterReduction: 0.40, stealthBonus: 0.80, noiseReduction: 0.30 },
    dismantle: [],
  },

  vaccine: {
    id: 'vaccine', name: '백신', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '완성된 백신. 감염을 0으로 초기화하고 영구 감염 면역을 부여한다.',
    tags: ['medical', 'legendary'],
    onConsume: { infection: -100, permanentInfectionImmunity: true },
    dismantle: [],
  },

  advanced_trauma_kit: {
    id: 'advanced_trauma_kit', name: '고급 외상 키트', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🩹', description: '고급 야전 외과 수술 키트. 체력 대폭 회복, 출혈 치료, 감염 감소.',
    tags: ['medical', 'legendary'],
    onConsume: { hp: 80, infection: -30, cureAllBleeding: true },
    dismantle: [],
  },

  combat_stimulant: {
    id: 'combat_stimulant', name: '전투 자극제', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '전투 능력 강화 약물. 12TP 동안 공격력 30% 증가, 스태미나 30 회복.',
    tags: ['medical', 'legendary'],
    onConsume: { temporaryAttackBoost: 0.30, temporaryStaminaBoost: 30, duration: 12 },
    dismantle: [],
  },

  field_transfusion_kit: {
    id: 'field_transfusion_kit', name: '야전 수혈 키트', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🩸', description: '야전 수혈 장비. 체력을 크게 회복하고 피로를 줄여준다.',
    tags: ['medical', 'legendary'],
    onConsume: { hp: 60, fatigue: -30 },
    dismantle: [],
  },

  survivors_feast: {
    id: 'survivors_feast', name: '생존자의 만찬', type: 'consumable', subtype: 'food',
    rarity: 'legendary', legendary: true, weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍖', description: '종말 이후 최고의 만찬. 모든 스탯을 완전히 회복시킨다.',
    tags: ['food', 'legendary'],
    onConsume: { hp: 100, hunger: -100, thirst: -100, fatigue: -100, morale: 30, infection: -20 },
    dismantle: [],
  },

  radiation_cleanser: {
    id: 'radiation_cleanser', name: '방사선 정화제', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☢️', description: '방사선 오염을 제거하는 정화제. 방사선과 오염 수치를 대폭 낮춘다.',
    tags: ['medical', 'legendary'],
    onConsume: { radiation: -100, contamination: -50 },
    dismantle: [],
  },

  universal_antidote: {
    id: 'universal_antidote', name: '만능 해독제', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧬', description: '모든 독과 질병을 치료하는 만능 해독제. 감염도 감소시킨다.',
    tags: ['medical', 'legendary'],
    onConsume: { cureAllDiseases: true, cureAllPoisons: true, infection: -30, hp: 20 },
    dismantle: [],
  },

  auto_turret: {
    id: 'auto_turret', name: '자동 터렛', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 12.0,
    defaultDurability: 300, defaultContamination: 0,
    icon: '🤖', description: '자동 방어 터렛. 설치하면 기지에 접근하는 적을 자동으로 공격한다.',
    tags: ['tool', 'legendary', 'structure'],
    onUse: { autoDefense: true, baseDamagePerAttack: 20 },
    dismantle: [],
  },

  reinforced_shelter: {
    id: 'reinforced_shelter', name: '강화 쉘터', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 0,
    defaultDurability: 500, defaultContamination: 0,
    icon: '🏗️', description: '중무장 강화 쉘터. 방어력 50% 보너스, 최대 6명 수용 가능.',
    tags: ['tool', 'legendary', 'structure'],
    onUse: { shelterBonus: 0.50, maxOccupants: 6 },
    dismantle: [],
  },

  solar_generator: {
    id: 'solar_generator', name: '태양광 발전기', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 8.0,
    defaultDurability: 400, defaultContamination: 0,
    icon: '☀️', description: '태양광 발전 장치. 설치한 구조물에 200일간 전력을 공급한다.',
    tags: ['tool', 'legendary', 'structure'],
    onUse: { powerGeneration: true, structurePowerDays: 200 },
    dismantle: [],
  },

  field_laboratory: {
    id: 'field_laboratory', name: '야전 연구실', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 0,
    defaultDurability: 400, defaultContamination: 0,
    icon: '🔬', description: '의사 전용 야전 연구실. 고급 의료 제작이 해금되고 제작 성공률 30% 상승.',
    tags: ['tool', 'legendary', 'structure', 'doctor'],
    onUse: { enablesAdvancedMedical: true, craftSuccessBonus: 0.30 },
    dismantle: [],
  },

  emergency_generator: {
    id: 'emergency_generator', name: '비상 발전기', type: 'tool', subtype: 'structure',
    rarity: 'legendary', legendary: true, weight: 6.0,
    defaultDurability: 350, defaultContamination: 0,
    icon: '⚡', description: '엔지니어 전용 비상 발전기. 설치한 구조물에 50일간 전력을 공급한다.',
    tags: ['tool', 'legendary', 'structure', 'engineer'],
    onUse: { powerGeneration: true, structurePowerDays: 50 },
    dismantle: [],
  },

  directional_mine: {
    id: 'directional_mine', name: '지향성 지뢰', type: 'consumable', subtype: 'weapon',
    rarity: 'legendary', legendary: true, weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💣', description: '군인 전용 지향성 지뢰. 설치하면 적이 접근 시 광역 폭발 피해를 입힌다.',
    tags: ['weapon', 'legendary', 'explosive', 'soldier'],
    combat: {
      damage: [50, 80], accuracy: 1.0, noiseOnUse: 40, aoe: true,
    },
    onConsume: { deployTrap: true },
    dismantle: [],
  },

  immunity_serum: {
    id: 'immunity_serum', name: '면역 혈청', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', legendary: true, weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '약사 전용 면역 혈청. 감염 완전 제거, 영구 감염 면역, 질병 저항 50%.',
    tags: ['medical', 'legendary', 'pharmacist'],
    onConsume: { infection: -100, permanentInfectionImmunity: true, permanentDiseaseResist: 0.50 },
    dismantle: [],
  },

  // ─── 이벤트 체인 보상 (1) ─────────────────────────────────

  mothers_necklace: {
    id: 'mothers_necklace', name: '어머니의 목걸이', type: 'armor', subtype: 'accessory',
    rarity: 'legendary', legendary: true, weight: 0.1,
    defaultDurability: Infinity, defaultContamination: 0,
    icon: '📿', description: '구조 체인 퀘스트 끝에 발견한 어머니의 유품. 사기 감소 40% 억제, TP마다 HP 1 재생.',
    tags: ['armor', 'legendary', 'accessory'],
    onWear: { moraleDecayReduction: 0.40, hpRegenPerTP: 1 },
    dismantle: [],
  },

};

export default LEGENDARY_ITEMS;
