// === ITEMS: COMBAT (근접무기·원거리/투척·의복/방어구) ===
// 근접 무기 9 + 원거리/투척 9 + 의복/방어구 7 = 25 items

const ITEMS_COMBAT = {

  // ─── 근접 무기 (9) ────────────────────────────────────────

  iron_pipe: {
    id: 'iron_pipe', name: '철파이프', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔩', description: '단순하지만 효과적인 둔기. 가공하면 더 강력해진다.',
    tags: ['weapon', 'melee'],
    combat: { damage: [12, 20], accuracy: 0.78, noiseOnUse: 5, durabilityLoss: 3, critChance: 0.10, critMultiplier: 1.5 },
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.9 }],
  },

  knife: {
    id: 'knife', name: '칼', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 0.3,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🔪', description: '소음 없이 적을 처치. 고철로 날을 갈면 더 강해진다.',
    tags: ['weapon', 'melee', 'silent'],
    combat: { damage: [14, 22], accuracy: 0.80, noiseOnUse: 1, durabilityLoss: 5, critChance: 0.25, critMultiplier: 1.8 },
    dismantle: [{ definitionId: 'sharp_blade', qty: 1, chance: 0.7 }],
  },

  sharpened_knife: {
    id: 'sharpened_knife', name: '날카로운 칼', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🗡️', description: '고철로 날을 갈아 강화된 칼. 더 깊은 상처를 입힌다.',
    tags: ['weapon', 'melee', 'silent', 'crafted'],
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
    combat: { damage: [16, 28], accuracy: 0.70, noiseOnUse: 6, durabilityLoss: 2, critChance: 0.15, critMultiplier: 2.0 },
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.9 }],
  },

  baseball_bat: {
    id: 'baseball_bat', name: '야구배트', type: 'weapon', subtype: 'melee',
    rarity: 'common', weight: 0.9,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🪃', description: '타격 무기. 업그레이드 가능.',
    tags: ['weapon', 'melee'],
    combat: { damage: [13, 22], accuracy: 0.75, noiseOnUse: 5, durabilityLoss: 3, critChance: 0.15, critMultiplier: 1.7 },
    dismantle: [{ definitionId: 'wood', qty: 1, chance: 0.8 }],
  },

  reinforced_bat: {
    id: 'reinforced_bat', name: '강화 배트', type: 'weapon', subtype: 'melee',
    rarity: 'uncommon', weight: 1.1,
    defaultDurability: 90, defaultContamination: 0,
    icon: '⚾', description: '못이 박힌 배트. 피해량이 크게 증가.',
    tags: ['weapon', 'melee', 'crafted'],
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
    icon: '🏹', description: '장거리 근접 무기. 명중 시 높은 피해.',
    tags: ['weapon', 'melee', 'crafted'],
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
    icon: '🪃', description: '강력한 원거리 화기. 다수 적에 광역 피해.',
    tags: ['weapon', 'firearm', 'loud'],
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
    icon: '🔥', description: '광역 화염 피해. 소음 매우 큼.',
    tags: ['weapon', 'throwable', 'explosive', 'crafted'],
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
    icon: '💣', description: '폭발 + 관통 피해. 다수 적을 제압.',
    tags: ['weapon', 'throwable', 'explosive', 'crafted'],
    combat: { damage: [45, 70], accuracy: 0.60, noiseOnUse: 60, durabilityLoss: 100, critChance: 0.15, critMultiplier: 2.5 },
    dismantle: [],
  },

  smoke_bomb: {
    id: 'smoke_bomb', name: '연막탄', type: 'weapon', subtype: 'throwable',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💨', description: '연막으로 도주 또는 은신 확률 크게 상승.',
    tags: ['weapon', 'throwable', 'utility', 'crafted'],
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
};

export default ITEMS_COMBAT;
