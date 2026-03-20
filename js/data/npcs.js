// === NPC DEFINITIONS ===
// 8 NPCs: spawn conditions, dialogues by trust level, companion stats, trade offers.
// Trust: 0-5 (0 = stranger, 5 = devoted). Each interaction can raise/lower trust.
// NPC item defs are registered in window.__GAME_DATA__.items by NPCSystem.

// ── NPC Card Item Definitions (type: 'npc') ─────────────────────
// Registered at boot so CardFactory can render them.
export const NPC_ITEMS = {
  npc_old_survivor: {
    id: 'npc_old_survivor', name: '늙은 생존자', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👴', description: '경험 많은 노인. 조심스럽지만 유용한 힌트를 준다.',
    tags: ['npc'], dismantle: [],
  },
  npc_nurse: {
    id: 'npc_nurse', name: '간호사', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👩‍⚕️', description: '전직 응급실 간호사. 치료 능력이 뛰어나다.',
    tags: ['npc'], dismantle: [],
  },
  npc_soldier_deserter: {
    id: 'npc_soldier_deserter', name: '탈영병', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪖', description: '군대를 떠난 전투 전문가. 강하지만 시끄럽다.',
    tags: ['npc'], dismantle: [],
  },
  npc_child: {
    id: 'npc_child', name: '아이', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👧', description: '부모를 잃은 어린 아이. 전투력은 없지만 마음의 위안이 된다.',
    tags: ['npc'], dismantle: [],
  },
  npc_mechanic: {
    id: 'npc_mechanic', name: '정비사', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '자동차 정비사 출신. 제작과 수리에 능하다.',
    tags: ['npc'], dismantle: [],
  },
  npc_trader: {
    id: 'npc_trader', name: '떠돌이 상인', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧳', description: '위험을 무릅쓰고 서울을 횡단하며 물건을 거래하는 상인.',
    tags: ['npc'], dismantle: [],
  },
  npc_student: {
    id: 'npc_student', name: '대학생', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📖', description: '서울대 생존 학생. 학습 능력이 뛰어나다.',
    tags: ['npc'], dismantle: [],
  },
  npc_dog: {
    id: 'npc_dog', name: '떠돌이 개', type: 'npc',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐕', description: '충성스러운 떠돌이 개. 적은 식량으로도 든든한 동반자.',
    tags: ['npc'], dismantle: [],
  },
};

// ── NPC Data Definitions ────────────────────────────────────────
const NPCS = {

  npc_old_survivor: {
    id: 'npc_old_survivor',
    personality: 'cautious',  // timid | cautious | neutral | brave | loyal
    spawnDistrict: 'gangbuk',
    spawnDay: 10,
    // Dialogue lines indexed by trust tier: [0-1], [2-3], [4-5]
    dialogues: {
      greet:  ['npc.old.greet0', 'npc.old.greet1', 'npc.old.greet2'],
      hint:   ['npc.old.hint0', 'npc.old.hint1', 'npc.old.hint2'],
      reject: 'npc.old.reject',
    },
    trustGainPerTalk: 1,
    // Companion bonuses (applied while in party)
    companion: {
      canRecruit:   true,
      recruitTrust: 3,          // minimum trust to recruit
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.1,
      lonelinessReduction: 0.2,
      noiseAdd:     0,
      foodCostPerDay: 0.3,      // nutrition drain per TP
      skillBonus:   null,
    },
    // Items the NPC can give at certain trust levels
    gifts: [
      { trust: 2, itemId: 'bandage', qty: 2 },
      { trust: 4, itemId: 'canned_food', qty: 1 },
    ],
    // Trade offers (trader NPC only — null for others)
    trades: null,
  },

  npc_nurse: {
    id: 'npc_nurse',
    personality: 'brave',
    spawnDistrict: 'seocho',
    spawnDay: 15,
    dialogues: {
      greet:  ['npc.nurse.greet0', 'npc.nurse.greet1', 'npc.nurse.greet2'],
      hint:   ['npc.nurse.hint0', 'npc.nurse.hint1', 'npc.nurse.hint2'],
      reject: 'npc.nurse.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    1.5,        // +150% heal effectiveness
      craftBonus:   0,
      moralBonus:   0.15,
      lonelinessReduction: 0.25,
      noiseAdd:     0,
      foodCostPerDay: 0.4,
      skillBonus:   { medicine: 0.3 },
    },
    gifts: [
      { trust: 1, itemId: 'bandage', qty: 3 },
      { trust: 3, itemId: 'first_aid_kit', qty: 1 },
    ],
    trades: null,
  },

  npc_soldier_deserter: {
    id: 'npc_soldier_deserter',
    personality: 'brave',
    spawnDistrict: 'yongsan',
    spawnDay: 30,
    dialogues: {
      greet:  ['npc.soldier.greet0', 'npc.soldier.greet1', 'npc.soldier.greet2'],
      hint:   ['npc.soldier.hint0', 'npc.soldier.hint1', 'npc.soldier.hint2'],
      reject: 'npc.soldier.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 3,
      combatDmg:    1.4,        // +40% combat damage
      carryBonus:   5,          // +5 carry capacity
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.05,
      lonelinessReduction: 0.15,
      noiseAdd:     3,          // makes more noise
      foodCostPerDay: 0.7,      // eats a lot
      skillBonus:   { melee: 0.2, ranged: 0.2 },
    },
    gifts: [
      { trust: 2, itemId: 'pistol_ammo', qty: 5 },
      { trust: 4, itemId: 'combat_knife', qty: 1 },
    ],
    trades: null,
  },

  npc_child: {
    id: 'npc_child',
    personality: 'timid',
    spawnDistrict: 'nowon',
    spawnDay: 20,
    dialogues: {
      greet:  ['npc.child.greet0', 'npc.child.greet1', 'npc.child.greet2'],
      hint:   ['npc.child.hint0', 'npc.child.hint1', 'npc.child.hint2'],
      reject: 'npc.child.reject',
    },
    trustGainPerTalk: 2,        // children trust faster
    companion: {
      canRecruit:   true,
      recruitTrust: 1,
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.3,        // high morale bonus
      lonelinessReduction: 0.4, // strong loneliness reduction
      noiseAdd:     1,
      foodCostPerDay: 0.2,      // low food cost
      skillBonus:   null,
    },
    gifts: [
      { trust: 1, itemId: 'cloth', qty: 1 },
    ],
    trades: null,
  },

  npc_mechanic: {
    id: 'npc_mechanic',
    personality: 'neutral',
    spawnDistrict: 'guro',
    spawnDay: 25,
    dialogues: {
      greet:  ['npc.mech.greet0', 'npc.mech.greet1', 'npc.mech.greet2'],
      hint:   ['npc.mech.hint0', 'npc.mech.hint1', 'npc.mech.hint2'],
      reject: 'npc.mech.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      carryBonus:   3,
      healBonus:    0,
      craftBonus:   1.3,        // +30% craft success
      moralBonus:   0.05,
      lonelinessReduction: 0.15,
      noiseAdd:     2,
      foodCostPerDay: 0.5,
      skillBonus:   { crafting: 0.3, building: 0.2 },
    },
    gifts: [
      { trust: 2, itemId: 'metal_scrap', qty: 3 },
      { trust: 4, itemId: 'duct_tape', qty: 2 },
    ],
    trades: null,
  },

  npc_trader: {
    id: 'npc_trader',
    personality: 'neutral',
    spawnDistrict: 'yeongdeungpo',
    spawnDay: 12,
    dialogues: {
      greet:  ['npc.trader.greet0', 'npc.trader.greet1', 'npc.trader.greet2'],
      hint:   ['npc.trader.hint0', 'npc.trader.hint1', 'npc.trader.hint2'],
      reject: 'npc.trader.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   false,      // trader doesn't join party
      recruitTrust: 99,
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0,
      lonelinessReduction: 0.1,
      noiseAdd:     0,
      foodCostPerDay: 0,
      skillBonus:   null,
    },
    gifts: [],
    trades: [
      // { give: { id, qty }, receive: { id, qty }, trustRequired }
      { give: { id: 'canned_food', qty: 3 },   receive: { id: 'first_aid_kit', qty: 1 }, trustRequired: 0 },
      { give: { id: 'metal_scrap', qty: 5 },   receive: { id: 'pistol_ammo', qty: 3 },   trustRequired: 1 },
      { give: { id: 'cloth', qty: 4 },          receive: { id: 'bandage', qty: 5 },        trustRequired: 0 },
      { give: { id: 'water_bottle', qty: 2 },   receive: { id: 'canned_food', qty: 3 },    trustRequired: 0 },
      { give: { id: 'rope', qty: 3 },           receive: { id: 'duct_tape', qty: 2 },      trustRequired: 2 },
    ],
  },

  npc_student: {
    id: 'npc_student',
    personality: 'cautious',
    spawnDistrict: 'gwanak',
    spawnDay: 18,
    dialogues: {
      greet:  ['npc.student.greet0', 'npc.student.greet1', 'npc.student.greet2'],
      hint:   ['npc.student.hint0', 'npc.student.hint1', 'npc.student.hint2'],
      reject: 'npc.student.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      carryBonus:   2,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.1,
      lonelinessReduction: 0.2,
      noiseAdd:     0,
      foodCostPerDay: 0.35,
      skillBonus:   { scavenging: 0.25, medicine: 0.15 },
    },
    gifts: [
      { trust: 2, itemId: 'water_bottle', qty: 1 },
      { trust: 4, itemId: 'water_filter', qty: 1 },
    ],
    trades: null,
  },

  npc_dog: {
    id: 'npc_dog',
    personality: 'loyal',
    spawnDistrict: 'dobong',
    spawnDay: 5,
    dialogues: {
      greet:  ['npc.dog.greet0', 'npc.dog.greet1', 'npc.dog.greet2'],
      hint:   ['npc.dog.hint0', 'npc.dog.hint1', 'npc.dog.hint2'],
      reject: 'npc.dog.reject',
    },
    trustGainPerTalk: 2,        // dogs trust quickly
    companion: {
      canRecruit:   true,
      recruitTrust: 1,
      combatDmg:    0.2,        // small bite damage
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.25,
      lonelinessReduction: 0.35,
      noiseAdd:     2,          // barking
      foodCostPerDay: 0.15,     // low food cost
      skillBonus:   { scavenging: 0.1 },
    },
    gifts: [],
    trades: null,
  },

};

export default NPCS;
