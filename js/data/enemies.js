// === ENEMY DEFINITIONS ===

const ENEMIES = {
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
      { definitionId: 'cloth',    weight: 40, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',  weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.20,
    aiPattern: 'normal',
    specialSkills: [],
    statusInflict: null,
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
      { definitionId: 'energy_bar', weight: 15, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.30,
    aiPattern: 'aggressive',
    specialSkills: [],
    statusInflict: { id: 'bleed', name: '출혈', duration: 3, effect: { hpLossPerRound: 3 } },
    description: '빠르고 공격적인 변이 좀비.',
    stealthDifficulty: 0.7,
  },

  zombie_brute: {
    id: 'zombie_brute',
    name: '거대 좀비',
    icon: '👹',
    image: './assets/images/zombie_brute.jpg',
    type: 'zombie',
    hp: { min: 60, max: 90 },
    attack: { damage: [20, 35], accuracy: 0.55, noiseOnAttack: 10 },
    defense: 3,
    xp: 40,
    lootTable: [
      { definitionId: 'scrap_metal', weight: 30, minQty: 2, maxQty: 4 },
      { definitionId: 'first_aid_kit', weight: 8, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.40,
    aiPattern: 'defensive',
    specialSkills: [{ id: 'slam', name: '강타', damage: [30, 45], cooldown: 3, stunChance: 0.5 }],
    statusInflict: null,
    description: '방사선 노출로 거대화된 변이 좀비.',
    stealthDifficulty: 0.3,
  },

  raider: {
    id: 'raider',
    name: '약탈자',
    icon: '🔫',
    type: 'human',
    hp: { min: 35, max: 55 },
    attack: { damage: [14, 22], accuracy: 0.68, noiseOnAttack: 25 },
    defense: 2,
    xp: 25,
    lootTable: [
      { definitionId: 'pistol_ammo', weight: 35, minQty: 2, maxQty: 6 },
      { definitionId: 'canned_food', weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',     weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'knife',       weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'duct_tape',   weight: 5,  minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0,
    aiPattern: 'aggressive',
    specialSkills: [],
    statusInflict: null,
    description: '무장한 생존자. 협상 불가.',
    stealthDifficulty: 0.8,
  },

  raider_elite: {
    id: 'raider_elite',
    name: '정예 약탈자',
    icon: '🎯',
    type: 'human',
    hp: { min: 55, max: 80 },
    attack: { damage: [18, 28], accuracy: 0.72, noiseOnAttack: 30 },
    defense: 4,
    xp: 45,
    lootTable: [
      { definitionId: 'pistol_ammo', weight: 30, minQty: 3, maxQty: 8 },
      { definitionId: 'canned_food', weight: 15, minQty: 1, maxQty: 3 },
      { definitionId: 'first_aid_kit', weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'knife',       weight: 10, minQty: 1, maxQty: 1 },
      { definitionId: 'duct_tape',   weight: 10, minQty: 1, maxQty: 2 },
    ],
    infectionChance: 0,
    aiPattern: 'aggressive',
    specialSkills: [{ id: 'aimed_shot', name: '정조준', damage: [25, 40], cooldown: 3, stunChance: 0.3 }],
    statusInflict: null,
    description: '전투 경험이 풍부한 정예 약탈자. 정조준 사격이 치명적이다.',
    stealthDifficulty: 0.85,
  },

  // ── 패거리 좀비 (Horde) ─────────────────────────────────
  zombie_horde: {
    id: 'zombie_horde',
    name: '좀비 무리',
    icon: '👥',
    image: './assets/images/zombie.png',
    type: 'zombie',
    hp: { min: 80, max: 120 },
    attack: { damage: [6, 12], accuracy: 0.65, noiseOnAttack: 8 },
    defense: 0,
    xp: 35,
    attacksPerRound: 2,   // 매 라운드 2회 공격 (무리 패턴)
    lootTable: [
      { definitionId: 'cloth',    weight: 40, minQty: 2, maxQty: 4 },
      { definitionId: 'scrap_metal', weight: 20, minQty: 1, maxQty: 2 },
      { definitionId: 'bandage',  weight: 15, minQty: 1, maxQty: 2 },
    ],
    infectionChance: 0.30,
    aiPattern: 'horde',
    specialSkills: [],
    statusInflict: null,
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
    attack: { damage: [10, 18], accuracy: 0.80, noiseOnAttack: 6 },
    defense: 0,
    xp: 15,
    attacksPerRound: 2,   // 빠른 개는 연속 2회 공격
    lootTable: [
      { definitionId: 'cloth', weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.35,
    aiPattern: 'aggressive',
    specialSkills: [],
    statusInflict: { id: 'bleed', name: '출혈', duration: 2, effect: { hpLossPerRound: 4 } },
    onHitEffect: { infection: 8 },
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
    hp: { min: 28, max: 45 },
    attack: { damage: [8, 14], accuracy: 0.72, noiseOnAttack: 3 },
    defense: 0,
    xp: 30,
    onHitEffect: { infection: 15, radiation: 8 },  // 명중 시 추가 디버프
    lootTable: [
      { definitionId: 'contaminated_water', weight: 30, minQty: 1, maxQty: 1 },
      { definitionId: 'cloth',              weight: 20, minQty: 1, maxQty: 1 },
    ],
    infectionChance: 0.45,
    aiPattern: 'normal',
    specialSkills: [],
    statusInflict: { id: 'acid_burn', name: '산성 화상', duration: 2, effect: { hpLossPerRound: 5, infection: 5 } },
    description: '산성 체액을 분사하는 특수 감염자. 명중 시 감염·방사선이 추가 상승한다.',
    stealthDifficulty: 0.6,
  },
};

// Encounter table per node danger level
const ENCOUNTER_TABLES = {
  1: [
    { enemyId: 'zombie_common', weight: 60 },
    { enemyId: 'zombie_runner', weight: 20 },
    { enemyId: 'zombie_acid',   weight: 5  },
    { enemyId: 'rabid_dog',     weight: 15 },
  ],
  2: [
    { enemyId: 'zombie_common', weight: 30 },
    { enemyId: 'zombie_runner', weight: 25 },
    { enemyId: 'zombie_acid',   weight: 10 },
    { enemyId: 'raider',        weight: 25 },
    { enemyId: 'rabid_dog',     weight: 10 },
  ],
  3: [
    { enemyId: 'zombie_common', weight: 20 },
    { enemyId: 'zombie_runner', weight: 20 },
    { enemyId: 'zombie_brute',  weight: 15 },
    { enemyId: 'zombie_acid',   weight: 15 },
    { enemyId: 'zombie_horde',  weight: 10 },
    { enemyId: 'raider',        weight: 10 },
    { enemyId: 'raider_elite',  weight: 5  },
    { enemyId: 'rabid_dog',     weight: 5  },
  ],
  4: [
    { enemyId: 'zombie_runner', weight: 15 },
    { enemyId: 'zombie_brute',  weight: 25 },
    { enemyId: 'zombie_horde',  weight: 25 },
    { enemyId: 'zombie_acid',   weight: 15 },
    { enemyId: 'raider',        weight: 10 },
    { enemyId: 'raider_elite',  weight: 5  },
    { enemyId: 'rabid_dog',     weight: 5  },
  ],
};

function rollEnemy(dangerLevel) {
  const table = ENCOUNTER_TABLES[Math.min(dangerLevel, 4)] || ENCOUNTER_TABLES[1];
  const total = table.reduce((s, e) => s + e.weight, 0);
  let rand = Math.random() * total;
  for (const entry of table) {
    rand -= entry.weight;
    if (rand <= 0) {
      const def = ENEMIES[entry.enemyId];
      const hp = def.hp.min + Math.floor(Math.random() * (def.hp.max - def.hp.min + 1));
      return {
        ...def,
        currentHp: hp,
        maxHp:     hp,
        _skillCooldowns: {},
      };
    }
  }
  return { ...ENEMIES['zombie_common'], currentHp: 30, maxHp: 30, _skillCooldowns: {} };
}

/**
 * 소음 수준에 따른 적 그룹 생성
 * - 소음  0~29  → 1마리, 위험도 -1 (약한 적)
 * - 소음 30~64  → 2마리, 위험도 그대로
 * - 소음 65~    → 3마리, 위험도 +1 (강한 적)
 *
 * @param {number} dangerLevel - 장소 위험도 (1~4)
 * @param {number} noiseLevel  - 현재 소음 수치 (0~100)
 * @returns {Array} 적 인스턴스 배열
 */
function rollEnemyGroup(dangerLevel, noiseLevel = 0) {
  let count, effectiveDanger;
  if (noiseLevel < 30) {
    count          = 1;
    effectiveDanger = Math.max(1, dangerLevel - 1);
  } else if (noiseLevel < 65) {
    count          = 2;
    effectiveDanger = dangerLevel;
  } else {
    count          = 3;
    effectiveDanger = Math.min(4, dangerLevel + 1);
  }
  return Array.from({ length: count }, () => rollEnemy(effectiveDanger));
}

export { ENEMIES, ENCOUNTER_TABLES, rollEnemy, rollEnemyGroup };
export default ENEMIES;
