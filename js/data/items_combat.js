// === ITEMS: COMBAT (근접무기·원거리/투척·의복/방어구) ===
// 근접 무기 9 + 원거리/투척 9 + 의복/방어구 7 + Phase B 도구무기 6 + 탄약 2 + 신규무기 5 + 신규방어구 8 + 전투강화 9 = 55+ items

const ITEMS_COMBAT = {

  // ─── 근접 무기 (9) ────────────────────────────────────────

  iron_pipe: {
    id: 'iron_pipe', name: '철파이프', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔩', description: '단순하지만 효과적인 둔기. 가공하면 더 강력해진다.',
    tags: ['weapon', 'melee'],
    weaponType: 'blunt',
    combat: { damage: [12, 20], accuracy: 0.78, noiseOnUse: 5, durabilityLoss: 3, critChance: 0.10, critMultiplier: 1.5 },
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.9 }],
  },

  scalpel: {
    id: 'scalpel', name: '메스', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🔪', description: '외과용 메스. 전투용으론 약하지만 정밀한 절개로 크리티컬 확률이 높다.',
    tags: ['weapon', 'melee', 'silent', 'medical'],
    weaponType: 'blade',
    combat: { damage: [8, 14], accuracy: 0.85, noiseOnUse: 0, durabilityLoss: 3, critChance: 0.30, critMultiplier: 2.0 },
    dismantle: [{ definitionId: 'sharp_blade', qty: 1, chance: 0.5 }],
  },

  knife: {
    id: 'knife', name: '칼', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 0.3,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🔪', description: '소음 없이 적을 처치. 고철로 날을 갈면 더 강해진다.',
    tags: ['weapon', 'melee', 'silent'],
    weaponType: 'blade',
    combat: { damage: [14, 22], accuracy: 0.80, noiseOnUse: 1, durabilityLoss: 5, critChance: 0.25, critMultiplier: 1.8 },
    dismantle: [{ definitionId: 'sharp_blade', qty: 1, chance: 0.7 }],
  },

  sharpened_knife: {
    id: 'sharpened_knife', name: '날카로운 칼', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🗡️', description: '고철로 날을 갈아 강화된 칼. 더 깊은 상처를 입힌다.',
    tags: ['weapon', 'melee', 'silent', 'crafted'],
    weaponType: 'blade',
    combat: { damage: [18, 28], accuracy: 0.82, noiseOnUse: 1, durabilityLoss: 6, critChance: 0.30, critMultiplier: 2.0 },
    dismantle: [
      { definitionId: 'sharp_blade', qty: 1, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
  },

  crowbar: {
    id: 'crowbar', name: '쇠지렛대', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 1.2,
    defaultDurability: 90, defaultContamination: 0,
    icon: '🏒', description: '튼튼한 둔기. 문 개방에도 활용.',
    tags: ['weapon', 'melee'],
    weaponType: 'blunt',
    combat: { damage: [16, 28], accuracy: 0.70, noiseOnUse: 6, durabilityLoss: 2, critChance: 0.15, critMultiplier: 2.0 },
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.9 }],
  },

  baseball_bat: {
    id: 'baseball_bat', name: '야구배트', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 0.9,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🪃', description: '타격 무기. 업그레이드 가능.',
    tags: ['weapon', 'melee'],
    weaponType: 'blunt',
    combat: { damage: [13, 22], accuracy: 0.75, noiseOnUse: 5, durabilityLoss: 3, critChance: 0.15, critMultiplier: 1.7 },
    dismantle: [{ definitionId: 'wood', qty: 1, chance: 0.8 }],
  },

  reinforced_bat: {
    id: 'reinforced_bat', name: '강화 배트', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.1,
    defaultDurability: 90, defaultContamination: 0,
    icon: '⚾', description: '못이 박힌 배트. 피해량이 크게 증가.',
    tags: ['weapon', 'melee', 'crafted'],
    weaponType: 'blunt',
    combat: { damage: [26, 40], accuracy: 0.72, noiseOnUse: 8, durabilityLoss: 2, critChance: 0.20, critMultiplier: 2.2 },
    dismantle: [
      { definitionId: 'wood', qty: 1, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.6 },
      { definitionId: 'nail', qty: 3, chance: 0.7 },
    ],
  },

  spiked_pipe: {
    id: 'spiked_pipe', name: '가시파이프', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.3,
    defaultDurability: 85, defaultContamination: 0,
    icon: '⚙️', description: '못이 박힌 철파이프. 출혈을 유발한다.',
    tags: ['weapon', 'melee', 'crafted'],
    weaponType: 'blunt',
    combat: {
      damage: [22, 35], accuracy: 0.68, noiseOnUse: 7, durabilityLoss: 3,
      critChance: 0.20, critMultiplier: 2.0,
      statusInflict: { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -4 }, chance: 0.40 },
    },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.9 },
      { definitionId: 'nail', qty: 3, chance: 0.6 },
    ],
  },

  machete: {
    id: 'machete', name: '마체테', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 0.7,
    defaultDurability: 75, defaultContamination: 0,
    icon: '🗡️', description: '정글 도검. 빠른 연속 공격에 특화.',
    tags: ['weapon', 'melee'],
    weaponType: 'blade',
    combat: { damage: [18, 30], accuracy: 0.82, noiseOnUse: 4, durabilityLoss: 4, critChance: 0.22, critMultiplier: 1.9 },
    dismantle: [
      { definitionId: 'sharp_blade', qty: 1, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  spear: {
    id: 'spear', name: '창', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🏹', description: '장거리 근접 무기. 관통 공격으로 최대 2명 적에게 피해.',
    tags: ['weapon', 'melee', 'crafted'],
    weaponType: 'blade',
    multiTarget: 2,
    combat: { damage: [20, 32], accuracy: 0.65, noiseOnUse: 3, durabilityLoss: 4, critChance: 0.18, critMultiplier: 2.5 },
    dismantle: [
      { definitionId: 'wood', qty: 1, chance: 0.9 },
      { definitionId: 'sharp_blade', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
    ],
  },

  stun_gun: {
    id: 'stun_gun', name: '전기충격기', type: 'weapon', subtype: 'melee',
    rarity: 'rare', weight: 0.5,
    defaultDurability: 60, defaultContamination: 0,
    icon: '⚡', description: '고압 전류로 기절 유발. 조용하고 치명적.',
    tags: ['weapon', 'melee', 'silent'],
    weaponType: 'electric',
    combat: {
      damage: [14, 26], accuracy: 0.75, noiseOnUse: 2, durabilityLoss: 6,
      critChance: 0.15, critMultiplier: 1.5,
      statusInflict: { id: 'stun', name: '기절', duration: 1, effect: { skipTurn: true }, chance: 0.35 },
    },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.8 },
    ],
  },

  hand_axe: {
    id: 'hand_axe', name: '손도끼', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 0.8,
    defaultDurability: 75, defaultContamination: 0,
    icon: '🪓', description: '나무를 베고 적을 공격하는 다용도 도구. 통나무 가공에 필수.',
    tags: ['weapon', 'melee', 'tool'],
    weaponType: 'blade',
    combat: { damage: [15, 25], accuracy: 0.78, noiseOnUse: 4, durabilityLoss: 3, critChance: 0.15, critMultiplier: 1.8 },
    dismantle: [
      { definitionId: 'wood', qty: 1, chance: 0.8 },
      { definitionId: 'sharp_blade', qty: 1, chance: 0.6 },
    ],
  },

  // ─── 원거리 / 투척 (9) ───────────────────────────────────

  pistol: {
    id: 'pistol', name: '권총', type: 'weapon', subtype: 'firearm',
    rarity: 'rare', weight: 0.8,
    defaultDurability: 85, defaultContamination: 0,
    icon: '🔫', description: '원거리 무기. 소음이 크다.',
    tags: ['weapon', 'firearm', 'loud'],
    weaponType: 'bullet',
    combat: { damage: [30, 45], accuracy: 0.70, noiseOnUse: 30, durabilityLoss: 1, requiresAmmo: 'pistol_ammo', critChance: 0.20, critMultiplier: 2.0 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'spring', qty: 1, chance: 0.5 },
    ],
  },

  shotgun: {
    id: 'shotgun', name: '산탄총', type: 'weapon', subtype: 'firearm',
    rarity: 'rare', weight: 2.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🪃', description: '강력한 원거리 화기. 산탄으로 최대 2명 동시 피해.',
    tags: ['weapon', 'firearm', 'loud'],
    weaponType: 'bullet',
    multiTarget: 2,
    combat: { damage: [45, 75], accuracy: 0.60, noiseOnUse: 50, durabilityLoss: 2, requiresAmmo: 'shotgun_ammo', critChance: 0.15, critMultiplier: 2.5 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'wood', qty: 1, chance: 0.6 },
    ],
  },

  crossbow: {
    id: 'crossbow', name: '석궁', type: 'weapon', subtype: 'ranged',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🏹', description: '소음 없는 원거리 무기. 화살을 재사용 가능.',
    tags: ['weapon', 'ranged', 'silent', 'crafted'],
    weaponType: 'bullet',
    combat: { damage: [26, 40], accuracy: 0.72, noiseOnUse: 3, durabilityLoss: 2, requiresAmmo: 'crossbow_bolt', critChance: 0.25, critMultiplier: 2.2 },
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.8 },
      { definitionId: 'spring', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.7 },
    ],
  },

  pistol_ammo: {
    id: 'pistol_ammo', name: '권총 탄약', type: 'consumable', subtype: 'ammo',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔴', description: '9mm 탄약. 권총에 사용.',
    tags: ['ammo'],
    dismantle: [],
  },

  shotgun_ammo: {
    id: 'shotgun_ammo', name: '산탄 실탄', type: 'consumable', subtype: 'ammo',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🟠', description: '산탄총용 12게이지 실탄.',
    tags: ['ammo'],
    dismantle: [],
  },

  crossbow_bolt: {
    id: 'crossbow_bolt', name: '석궁 화살', type: 'consumable', subtype: 'ammo',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '➡️', description: '석궁용 화살. 직접 제작 가능.',
    tags: ['ammo', 'craftable'],
    dismantle: [{ definitionId: 'scrap_metal', qty: 1, chance: 0.6 }],
  },

  molotov_cocktail: {
    id: 'molotov_cocktail', name: '화염병', type: 'weapon', subtype: 'throwable',
    rarity: 'uncommon', weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔥', description: '광역 화염 피해. 모든 적 화상 상태이상.',
    tags: ['weapon', 'throwable', 'explosive', 'crafted'],
    weaponType: 'fire',
    throwableEffect: { type: 'aoe_fire', burnDuration: 2, burnDmgPerRound: 5 },
    combat: { damage: [38, 58], accuracy: 0.65, noiseOnUse: 40, durabilityLoss: 100, critChance: 0.10, critMultiplier: 2.0 },
    dismantle: [
      { definitionId: 'empty_bottle', qty: 1, chance: 0.6 },
      { definitionId: 'cloth_scrap', qty: 1, chance: 0.5 },
    ],
  },

  nail_bomb: {
    id: 'nail_bomb', name: '못폭탄', type: 'weapon', subtype: 'throwable',
    rarity: 'rare', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💣', description: '광역 폭발 + 출혈. 모든 적에게 피해.',
    tags: ['weapon', 'throwable', 'explosive', 'crafted'],
    weaponType: 'explosive',
    throwableEffect: { type: 'aoe_bleed', bleedDuration: 2, bleedDmgPerRound: 4 },
    combat: { damage: [45, 70], accuracy: 0.60, noiseOnUse: 60, durabilityLoss: 100, critChance: 0.15, critMultiplier: 2.5 },
    dismantle: [],
  },

  smoke_bomb: {
    id: 'smoke_bomb', name: '연막탄', type: 'weapon', subtype: 'throwable',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💨', description: '연막으로 즉시 도주 성공.',
    tags: ['weapon', 'throwable', 'utility', 'crafted'],
    weaponType: 'utility',
    throwableEffect: { type: 'guaranteed_flee' },
    combat: { damage: [0, 0], accuracy: 1.0, noiseOnUse: 10, durabilityLoss: 100, specialEffect: 'smoke' },
    dismantle: [],
  },

  // ─── 의복 / 방어구 (7) ───────────────────────────────────

  raincoat: {
    id: 'raincoat', name: '우비', type: 'armor', subtype: 'clothing',
    rarity: 'common', weight: 0.5,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🌧️', description: '비와 오염을 막는다. 방사선 오염 감소.',
    tags: ['armor', 'clothing', 'crafted'],
    onWear: { radiationMult: 0.70, contaminationMult: 0.80 },
    dismantle: [
      { definitionId: 'cloth', qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 1, chance: 0.5 },
    ],
  },

  tactical_vest: {
    id: 'tactical_vest', name: '전술조끼', type: 'armor', subtype: 'vest',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 90, defaultContamination: 0,
    icon: '🦺', description: '방탄 소재. 전투 피해를 크게 감소.',
    tags: ['armor', 'vest', 'crafted'],
    onWear: { damageReduction: 0.25 },
    dismantle: [
      { definitionId: 'leather', qty: 2, chance: 0.7 },
      { definitionId: 'cloth', qty: 1, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.6 },
    ],
  },

  helmet: {
    id: 'helmet', name: '헬멧', type: 'armor', subtype: 'head',
    rarity: 'uncommon', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '⛑️', description: '머리를 보호. 크리티컬 피해 감소.',
    tags: ['armor', 'head', 'crafted'],
    onWear: { critReduction: 0.30 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  work_gloves: {
    id: 'work_gloves', name: '작업장갑', type: 'armor', subtype: 'hands',
    rarity: 'common', weight: 0.2,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🧤', description: '손을 보호. 오염 접촉 시 감염 감소.',
    tags: ['armor', 'hands'],
    onWear: { infectionMult: 0.80 },
    dismantle: [
      { definitionId: 'leather', qty: 1, chance: 0.7 },
      { definitionId: 'cloth_scrap', qty: 2, chance: 0.8 },
    ],
  },

  gas_mask_filter: {
    id: 'gas_mask_filter', name: '방독면 필터', type: 'consumable', subtype: 'armor_part',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫁', description: '방독면 교체 필터. 방독면의 성능을 유지.',
    tags: ['armor_part', 'medical'],
    dismantle: [{ definitionId: 'charcoal_filter', qty: 1, chance: 0.6 }],
  },

  shield: {
    id: 'shield', name: '방패', type: 'armor', subtype: 'offhand',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛡️', description: '피해를 막는 방패. 방어 극대화.',
    tags: ['armor', 'offhand', 'crafted'],
    onWear: { damageReduction: 0.35 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
    ],
  },

  warm_clothes: {
    id: 'warm_clothes', name: '방한복', type: 'armor', subtype: 'clothing',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 85, defaultContamination: 0,
    icon: '🧥', description: '두꺼운 가죽과 천으로 겹겹이 만든 방한복. 혹한에서 체온 하락 속도를 크게 줄인다.',
    tags: ['armor', 'clothing', 'crafted'],
    onWear: { coldResistMult: 0.5, hypothermiaChanceMult: 0.3 },
    dismantle: [
      { definitionId: 'leather', qty: 2, chance: 0.6 },
      { definitionId: 'cloth', qty: 2, chance: 0.7 },
      { definitionId: 'thread', qty: 2, chance: 0.5 },
    ],
  },

  hazmat_suit: {
    id: 'hazmat_suit', name: '방호복', type: 'armor', subtype: 'fullbody',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🧑‍🚀', description: '방사선·오염 완전 차단. 무겁지만 생존에 필수.',
    tags: ['armor', 'fullbody', 'crafted'],
    onWear: { radiationMult: 0.20, contaminationMult: 0.30 },
    dismantle: [
      { definitionId: 'raincoat', qty: 1, chance: 0.6 },
      { definitionId: 'duct_tape', qty: 1, chance: 0.7 },
    ],
  },

  // ─── 신발 (4) ────────────────────────────────────────────

  running_shoes: {
    id: 'running_shoes', name: '러닝화', type: 'armor', subtype: 'boots',
    rarity: 'common', weight: 0.4,
    defaultDurability: 70, defaultContamination: 0,
    icon: '👟', description: '가볍고 빠른 운동화. 이동 시 피로 소모를 줄인다.',
    tags: ['armor', 'boots'],
    onWear: { fatigueMult: 0.85 },
    dismantle: [
      { definitionId: 'rubber', qty: 1, chance: 0.6 },
      { definitionId: 'cloth_scrap', qty: 2, chance: 0.7 },
    ],
  },

  hiking_boots: {
    id: 'hiking_boots', name: '등산화', type: 'armor', subtype: 'boots',
    rarity: 'uncommon', weight: 0.8,
    defaultDurability: 85, defaultContamination: 0,
    icon: '🥾', description: '험한 지형에서 발을 보호. 감염 저항 소폭 향상.',
    tags: ['armor', 'boots', 'crafted'],
    onWear: { infectionMult: 0.85, fatigueMult: 0.90 },
    dismantle: [
      { definitionId: 'leather', qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 1, chance: 0.6 },
    ],
  },

  combat_boots: {
    id: 'combat_boots', name: '전투화', type: 'armor', subtype: 'boots',
    rarity: 'uncommon', weight: 1.2,
    defaultDurability: 95, defaultContamination: 0,
    icon: '🪖', description: '군용 전투화. 피해 감소와 치명타 방어 효과.',
    tags: ['armor', 'boots'],
    onWear: { damageReduction: 0.05, critReduction: 0.10 },
    dismantle: [
      { definitionId: 'leather', qty: 2, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
  },

  hazmat_boots: {
    id: 'hazmat_boots', name: '방호화', type: 'armor', subtype: 'boots',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🦺', description: '방사선 차단 부츠. 핵오염 지역 탐색 시 필수.',
    tags: ['armor', 'boots', 'crafted'],
    onWear: { radiationMult: 0.55, contaminationMult: 0.65 },
    dismantle: [
      { definitionId: 'rubber', qty: 2, chance: 0.7 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
    ],
  },

  // ─── 신규 무기 / 도구 (Phase B) ─────────────────────────

  axe: {
    id: 'axe', name: '도끼', type: 'weapon', subtype: 'melee',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 90, defaultContamination: 0,
    icon: '🪓', description: '야전 대장간에서 제작한 도끼. 전투 무기이자 벌목 도구. 통나무 가공 효율 2배.',
    tags: ['weapon', 'melee', 'tool', 'crafted'],
    weaponType: 'blade',
    combat: { damage: [22, 38], accuracy: 0.72, noiseOnUse: 6, durabilityLoss: 2, critChance: 0.20, critMultiplier: 2.2 },
    onUse: { woodChopBonus: 2.0 },
    dismantle: [
      { definitionId: 'ax_head',      qty: 1, chance: 0.7 },
      { definitionId: 'wood_plank',   qty: 1, chance: 0.8 },
      { definitionId: 'leather',      qty: 1, chance: 0.5 },
    ],
  },

  shovel: {
    id: 'shovel', name: '삽', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.8,
    defaultDurability: 85, defaultContamination: 0,
    icon: '⛏️', description: '삽 머리를 자루에 결합한 도구. 땅 파기·텃밭 조성·진흙 수집에 효율 증가.',
    tags: ['weapon', 'melee', 'tool', 'crafted'],
    weaponType: 'blunt',
    combat: { damage: [14, 22], accuracy: 0.70, noiseOnUse: 5, durabilityLoss: 3, critChance: 0.08, critMultiplier: 1.5 },
    onUse: { digBonus: 2.0 },
    dismantle: [
      { definitionId: 'shovel_head',  qty: 1, chance: 0.7 },
      { definitionId: 'wood_plank',   qty: 1, chance: 0.8 },
    ],
  },

  hammer: {
    id: 'hammer', name: '망치', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.2,
    defaultDurability: 95, defaultContamination: 0,
    icon: '🔨', description: '목공 작업대에서 만든 망치. 건축 TP 비용 -1 보너스. 전투 시 강한 기절 유발.',
    tags: ['weapon', 'melee', 'tool', 'crafted'],
    weaponType: 'blunt',
    combat: {
      damage: [16, 26], accuracy: 0.72, noiseOnUse: 7, durabilityLoss: 2, critChance: 0.15, critMultiplier: 1.8,
      statusInflict: { id: 'stun', name: '기절', duration: 1, effect: { skipTurn: true }, chance: 0.20 },
    },
    onUse: { buildingBonus: -1 },
    dismantle: [
      { definitionId: 'hammer_head',  qty: 1, chance: 0.7 },
      { definitionId: 'wood',         qty: 1, chance: 0.8 },
    ],
  },

  improved_crossbow_bolt: {
    id: 'improved_crossbow_bolt', name: '개선 석궁 볼트', type: 'consumable', subtype: 'ammo',
    rarity: 'uncommon', weight: 0.06,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🎯', description: '단조 촉을 달아 관통력이 높아진 석궁 볼트. 기본 볼트보다 데미지 +5.',
    tags: ['ammo', 'craftable'],
    dismantle: [
      { definitionId: 'bolt_tip', qty: 1, chance: 0.5 },
    ],
  },

  rifle: {
    id: 'rifle', name: '소총', type: 'weapon', subtype: 'firearm',
    rarity: 'legendary', weight: 3.5,
    defaultDurability: 90, defaultContamination: 0,
    icon: '🔫', description: '고성능 반자동 소총. 원거리에서 강력한 피해. 소음이 매우 크며 탄약 직접 제작 필요.',
    tags: ['weapon', 'firearm', 'loud'],
    weaponType: 'bullet',
    combat: { damage: [55, 80], accuracy: 0.78, noiseOnUse: 70, durabilityLoss: 1, requiresAmmo: 'rifle_ammo', critChance: 0.25, critMultiplier: 2.5 },
    dismantle: [
      { definitionId: 'steel_plate',  qty: 1, chance: 0.6 },
      { definitionId: 'scrap_metal',  qty: 2, chance: 0.7 },
      { definitionId: 'spring',       qty: 2, chance: 0.5 },
    ],
  },

  rifle_ammo: {
    id: 'rifle_ammo', name: '소총탄 (5.56mm)', type: 'consumable', subtype: 'ammo',
    rarity: 'rare', weight: 0.06,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔶', description: '탄약 제조대에서 직접 만드는 소총용 탄환. 매우 강력하지만 제작이 복잡하다.',
    tags: ['ammo', 'craftable'],
    dismantle: [],
  },

  // ── 신규: 크래프팅 체인 확장 — 무기 ──────────────────────

  pipe_shotgun: {
    id: 'pipe_shotgun', name: '파이프 산탄총', type: 'weapon', subtype: 'ranged',
    rarity: 'rare', weight: 2.5,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔫', description: '철파이프로 제작한 조잡한 산탄총. 근거리에서 파괴적.',
    tags: ['weapon', 'ranged', 'crafted'],
    weaponType: 'pierce',
    combat: { damage: [25, 40], accuracy: 0.65, noiseOnUse: 35, durabilityLoss: 4, critChance: 0.08, critMultiplier: 2.0 },
    dismantle: [
      { definitionId: 'iron_pipe', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'spring', qty: 1, chance: 0.5 },
    ],
  },

  master_blade: {
    id: 'master_blade', name: '명검', type: 'weapon', subtype: 'melee',
    rarity: 'rare', weight: 1.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚔️', description: '합금으로 단조한 명검. 예리한 칼날이 적을 베어낸다.',
    tags: ['weapon', 'melee', 'crafted'],
    weaponType: 'sharp',
    combat: { damage: [30, 45], accuracy: 0.85, noiseOnUse: 3, durabilityLoss: 2, critChance: 0.20, critMultiplier: 2.0 },
    dismantle: [
      { definitionId: 'refined_metal', qty: 2, chance: 0.7 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  katana: {
    id: 'katana', name: '카타나', type: 'weapon', subtype: 'melee',
    rarity: 'legendary', weight: 1.5,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🗡️', description: '장인의 기술이 깃든 완벽한 도검. 베기의 극치.',
    tags: ['weapon', 'melee', 'crafted'],
    weaponType: 'sharp',
    combat: { damage: [40, 60], accuracy: 0.90, noiseOnUse: 2, durabilityLoss: 1, critChance: 0.25, critMultiplier: 2.5 },
    dismantle: [
      { definitionId: 'refined_metal', qty: 3, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
    ],
  },

  pipe_wrench_improved: {
    id: 'pipe_wrench_improved', name: '개량 파이프렌치', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.8,
    defaultDurability: 90, defaultContamination: 0,
    icon: '🔧', description: '강철판으로 보강한 파이프렌치. 도구이자 무기.',
    tags: ['weapon', 'melee', 'tool', 'crafted'],
    weaponType: 'blunt',
    combat: { damage: [15, 25], accuracy: 0.82, noiseOnUse: 5, durabilityLoss: 2, critChance: 0.12, critMultiplier: 1.5 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'steel_plate', qty: 1, chance: 0.5 },
    ],
  },

  master_wrench: {
    id: 'master_wrench', name: '마스터 렌치', type: 'weapon', subtype: 'melee',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '합금으로 제작한 최상급 렌치. 어떤 볼트도 풀 수 있다.',
    tags: ['weapon', 'melee', 'tool', 'crafted'],
    weaponType: 'blunt',
    combat: { damage: [22, 35], accuracy: 0.85, noiseOnUse: 5, durabilityLoss: 2, critChance: 0.15, critMultiplier: 1.8 },
    dismantle: [
      { definitionId: 'refined_metal', qty: 2, chance: 0.7 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  // ── 신규: 크래프팅 체인 확장 — 방어구 ────────────────────

  armor_plate: {
    id: 'armor_plate', name: '강철 장갑판', type: 'armor', subtype: 'body',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛡️', description: '강철판으로 만든 장갑. 무겁지만 강력한 방어력.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 20, damageReduction: 0.20, critReduction: 0.15, movePenalty: 0.10 },
    dismantle: [
      { definitionId: 'steel_plate', qty: 2, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
    ],
  },

  alloy_armor_plate: {
    id: 'alloy_armor_plate', name: '합금 장갑판', type: 'armor', subtype: 'body',
    rarity: 'legendary', weight: 2.5,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🛡️', description: '합금으로 단조한 최상급 장갑판. 가볍고 단단하다.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 30, damageReduction: 0.30, critReduction: 0.25, movePenalty: 0.08 },
    dismantle: [
      { definitionId: 'refined_metal', qty: 3, chance: 0.7 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  plate_carrier: {
    id: 'plate_carrier', name: '플레이트 캐리어', type: 'armor', subtype: 'body',
    rarity: 'rare', weight: 2.8,
    defaultDurability: 95, defaultContamination: 0,
    icon: '🦺', description: '강화 천과 금속판을 조합한 방탄 조끼.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 18, damageReduction: 0.18, critReduction: 0.12, movePenalty: 0.08 },
    dismantle: [
      { definitionId: 'steel_plate', qty: 1, chance: 0.7 },
      { definitionId: 'cloth', qty: 2, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
    ],
  },

  composite_armor: {
    id: 'composite_armor', name: '복합 장갑', type: 'armor', subtype: 'body',
    rarity: 'legendary', weight: 3.5,
    defaultDurability: 130, defaultContamination: 0,
    icon: '🦺', description: '세라믹과 금속의 복합 장갑. 현대 방어구의 정점.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 35, damageReduction: 0.35, critReduction: 0.30, movePenalty: 0.12 },
    dismantle: [
      { definitionId: 'refined_metal', qty: 3, chance: 0.7 },
      { definitionId: 'steel_plate', qty: 2, chance: 0.6 },
    ],
  },

  powered_exosuit: {
    id: 'powered_exosuit', name: '파워 엑소수트', type: 'armor', subtype: 'body',
    rarity: 'legendary', weight: 5.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🤖', description: '전력 구동 외골격. 방어력과 기동성을 동시에 제공.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 50, damageReduction: 0.45, critReduction: 0.40, movePenalty: 0.00 },
    dismantle: [
      { definitionId: 'refined_metal', qty: 4, chance: 0.7 },
      { definitionId: 'electronic_parts', qty: 3, chance: 0.6 },
      { definitionId: 'wire', qty: 2, chance: 0.5 },
    ],
  },

  ballistic_weave: {
    id: 'ballistic_weave', name: '방탄직', type: 'armor', subtype: 'body',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🧥', description: '특수 섬유로 짠 방탄 원단. 가볍고 유연하다.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 12, damageReduction: 0.12, critReduction: 0.08, movePenalty: 0.02 },
    dismantle: [
      { definitionId: 'cloth', qty: 3, chance: 0.8 },
      { definitionId: 'thread', qty: 2, chance: 0.6 },
    ],
  },

  camo_cloth: {
    id: 'camo_cloth', name: '위장 천', type: 'armor', subtype: 'body',
    rarity: 'uncommon', weight: 0.6,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🫒', description: '염료로 물들인 위장용 천. 은신에 도움된다.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 3, damageReduction: 0.03, critReduction: 0.02, movePenalty: 0.00 },
    dismantle: [
      { definitionId: 'cloth', qty: 2, chance: 0.8 },
    ],
  },

  ghillie_suit: {
    id: 'ghillie_suit', name: '길리 수트', type: 'armor', subtype: 'body',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🌿', description: '위장 천으로 만든 은신복. 적 탐지를 크게 줄인다.',
    tags: ['armor', 'body', 'crafted'],
    armor: { defense: 5, damageReduction: 0.05, critReduction: 0.03, movePenalty: 0.05 },
    dismantle: [
      { definitionId: 'cloth', qty: 3, chance: 0.7 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
    ],
  },

  // ── 신규: 크래프팅 체인 확장 — 전투 강화 아이템 ────────────

  knuckle_wrap: {
    id: 'knuckle_wrap', name: '너클 랩', type: 'consumable', subtype: 'enhancement',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥊', description: '주먹에 감는 천. 맨손 공격 시 데미지 증가.',
    tags: ['enhancement', 'unarmed'],
    dismantle: [
      { definitionId: 'cloth_scrap', qty: 2, chance: 0.8 },
    ],
  },

  combat_gloves: {
    id: 'combat_gloves', name: '전투 장갑', type: 'consumable', subtype: 'enhancement',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧤', description: '강화 천으로 만든 전투용 장갑.',
    tags: ['enhancement', 'unarmed'],
    dismantle: [
      { definitionId: 'cloth', qty: 1, chance: 0.7 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  iron_gauntlet: {
    id: 'iron_gauntlet', name: '철권 건틀릿', type: 'consumable', subtype: 'enhancement',
    rarity: 'rare', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🤜', description: '금속으로 보강한 전투 장갑. 주먹이 흉기가 된다.',
    tags: ['enhancement', 'unarmed'],
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
    ],
  },

  weapon_oil: {
    id: 'weapon_oil', name: '검유', type: 'consumable', subtype: 'enhancement',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '무기에 바르는 기름. 근접무기 성능 향상.',
    tags: ['enhancement', 'melee'],
    dismantle: [],
  },

  serrated_mod: {
    id: 'serrated_mod', name: '톱니 개조 키트', type: 'consumable', subtype: 'enhancement',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔪', description: '무기 날에 톱니를 추가하는 개조 부품.',
    tags: ['enhancement', 'melee'],
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.7 },
    ],
  },

  defense_salve: {
    id: 'defense_salve', name: '방어 연고', type: 'consumable', subtype: 'enhancement',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧴', description: '피부에 바르는 보호 연고. 타격 흡수에 도움.',
    tags: ['enhancement', 'defense'],
    dismantle: [],
  },

  ammo_mod: {
    id: 'ammo_mod', name: '탄약 개조 키트', type: 'consumable', subtype: 'enhancement',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔫', description: '탄약을 개조하여 관통력을 높이는 키트.',
    tags: ['enhancement', 'ranged'],
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.6 },
    ],
  },

  weapon_scope: {
    id: 'weapon_scope', name: '조준경', type: 'consumable', subtype: 'enhancement',
    rarity: 'rare', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔭', description: '원거리 무기에 장착하는 조준 보조 장치.',
    tags: ['enhancement', 'ranged'],
    dismantle: [
      { definitionId: 'glass_shard', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.6 },
    ],
  },

  suppressor: {
    id: 'suppressor', name: '소음기', type: 'consumable', subtype: 'enhancement',
    rarity: 'rare', weight: 0.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔇', description: '발사 시 소음을 줄이는 장치.',
    tags: ['enhancement', 'ranged'],
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 1, chance: 0.5 },
    ],
  },
};

export default ITEMS_COMBAT;
