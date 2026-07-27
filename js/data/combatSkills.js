const ALL_RANKS = [1, 2, 3, 4];
const FRONT_RANKS = [1, 2];
const BACK_RANKS = [2, 3, 4];

export const CHARACTER_COMBAT_LOADOUTS = {
  doctor: ['doctor_precise_cut', 'doctor_triage', 'doctor_diagnose'],
  soldier: ['soldier_burst_fire', 'soldier_suppressive_fire', 'soldier_tactical_shift'],
  firefighter: ['firefighter_axe_swing', 'firefighter_rescue_guard', 'firefighter_force_advance'],
  homeless: ['homeless_dirty_fighting', 'homeless_slip_away', 'homeless_scavenge_weapon'],
  chef: ['chef_knife_flurry', 'chef_field_ration', 'chef_hot_pan'],
  engineer: ['engineer_wrench_strike', 'engineer_improvised_cover', 'engineer_shock_trap'],
};

export const COMPANION_COMBAT_LOADOUTS = {
  npc_old_survivor: ['old_survivor_cane_strike', 'old_survivor_warning', 'old_survivor_hold_line'],
  npc_nurse: ['nurse_scalpel', 'nurse_triage', 'nurse_encourage'],
  npc_soldier_deserter: ['deserter_rifle_shot', 'deserter_covering_fire', 'deserter_reposition'],
  npc_child: ['child_throw_debris', 'child_hide', 'child_warning'],
  npc_mechanic: ['mechanic_wrench', 'mechanic_field_repair', 'mechanic_tripwire'],
  npc_student: ['student_improvised_strike', 'student_first_aid', 'student_quick_step'],
  npc_dog: ['dog_bite', 'dog_guard', 'dog_track_weakness'],
  npc_former_colleague: ['colleague_hammer', 'colleague_brace', 'colleague_teamwork'],
  npc_minjun: ['minjun_pistol', 'minjun_combat_medicine', 'minjun_command'],
  npc_sohee: ['sohee_precise_shot', 'sohee_silent_cover', 'sohee_focus'],
  npc_jisu: ['jisu_scalpel', 'jisu_emergency_care', 'jisu_diagnose'],
  npc_yeongcheol: ['yeongcheol_axe', 'yeongcheol_rescue', 'yeongcheol_rally'],
  npc_daehan: ['daehan_wrench', 'daehan_barricade', 'daehan_overcharge'],
  npc_tower_security: ['security_baton', 'security_guard', 'security_taunt'],
  npc_tower_merchant: ['merchant_hidden_blade', 'merchant_supply', 'merchant_bargain'],
  npc_tower_cook: ['tower_cook_knife', 'tower_cook_meal', 'tower_cook_burn'],
  npc_tower_engineer: ['tower_engineer_wrench', 'tower_engineer_cover', 'tower_engineer_trap'],
  npc_tower_doctor: ['tower_doctor_scalpel', 'tower_doctor_triage', 'tower_doctor_stimulant'],
  npc_sous_chef: ['sous_chef_cleaver', 'sous_chef_ration', 'sous_chef_intimidate'],
  npc_kitchen_helper: ['kitchen_helper_pan', 'kitchen_helper_assist', 'kitchen_helper_duck'],
};

const HEAL_SKILLS = new Set([
  'doctor_triage',
  'chef_field_ration',
  'nurse_triage',
  'student_first_aid',
  'minjun_combat_medicine',
  'jisu_emergency_care',
  'tower_doctor_triage',
]);

const SUPPORT_EFFECTS = {
  doctor_diagnose: { type: 'token', token: 'vulnerable', stacks: 1 },
  // 셋업→페이오프: 물러나며 조준(focus) — 다음 burst_fire의 치명이 선다
  soldier_tactical_shift: [
    { type: 'move', distance: 1 },
    { type: 'token', token: 'focus', stacks: 1 },
  ],
  firefighter_rescue_guard: { type: 'guard', value: 0.35 },
  // 셋업→페이오프: 돌파 전진(strength) — 다음 axe_swing에 체중이 실린다
  firefighter_force_advance: [
    { type: 'move', distance: -1 },
    { type: 'token', token: 'strength', stacks: 1 },
  ],
  // 상황식 도주에 노숙자 고유 보정 — 골목을 아는 사람의 이탈
  homeless_slip_away: { type: 'flee', bonus: 0.2 },
  homeless_scavenge_weapon: { type: 'token', token: 'improvised', stacks: 1 },
  engineer_improvised_cover: { type: 'guard', value: 0.3 },
  engineer_shock_trap: { type: 'status', status: { id: 'shock', duration: 1, chance: 0.6 } },
  old_survivor_warning: { type: 'token', token: 'dodge', stacks: 1 },
  old_survivor_hold_line: { type: 'guard', value: 0.3 },
  nurse_encourage: { type: 'stress', value: -12 },
  deserter_reposition: [
    { type: 'move', distance: 1 },
    { type: 'token', token: 'dodge', stacks: 1 },
  ],
  child_hide: { type: 'guard', value: 0.5 },
  child_warning: { type: 'token', token: 'dodge', stacks: 1 },
  mechanic_field_repair: { type: 'guard', value: 0.35 },
  mechanic_tripwire: { type: 'status', status: { id: 'rooted', duration: 1, chance: 0.7 } },
  student_quick_step: [
    { type: 'move', distance: 1 },
    { type: 'token', token: 'dodge', stacks: 1 },
  ],
  dog_guard: [
    { type: 'move', distance: -1 },
    { type: 'guard', value: 0.3 },
  ],
  // 군견의 약점 추적 = 표식(marked) — vulnerable보다 강한 집중 공격 시너지
  dog_track_weakness: { type: 'token', token: 'marked', stacks: 1 },
  colleague_brace: { type: 'guard', value: 0.3 },
  colleague_teamwork: { type: 'token', token: 'accuracy', stacks: 1 },
  minjun_command: [
    { type: 'token', token: 'focus', stacks: 1 },
    { type: 'stress', value: -6 },
  ],
  sohee_silent_cover: { type: 'guard', value: 0.25 },
  sohee_focus: { type: 'token', token: 'focus', stacks: 1 },
  jisu_diagnose: { type: 'token', token: 'vulnerable', stacks: 1 },
  yeongcheol_rescue: [
    { type: 'move', distance: 1 },
    { type: 'guard', value: 0.35 },
  ],
  yeongcheol_rally: { type: 'stress', value: -14 },
  daehan_barricade: { type: 'guard', value: 0.4 },
  daehan_overcharge: { type: 'token', token: 'power', stacks: 1 },
  security_guard: { type: 'guard', value: 0.4 },
  security_taunt: [
    { type: 'token', token: 'taunted', stacks: 1 },
    { type: 'guard', value: 0.3 },
  ],
  merchant_supply: { type: 'token', token: 'improvised', stacks: 1 },
  merchant_bargain: { type: 'token', token: 'hesitation', stacks: 1 },
  tower_cook_meal: [
    { type: 'stress', value: -10 },
    { type: 'token', token: 'strength', stacks: 1 },
  ],
  tower_engineer_cover: { type: 'guard', value: 0.35 },
  tower_engineer_trap: { type: 'status', status: { id: 'rooted', duration: 1, chance: 0.65 } },
  tower_doctor_stimulant: { type: 'token', token: 'speed', stacks: 1 },
  sous_chef_ration: [
    { type: 'token', token: 'strength', stacks: 1 },
    { type: 'token', token: 'accuracy', stacks: 1 },
  ],
  sous_chef_intimidate: { type: 'token', token: 'hesitation', stacks: 1 },
  kitchen_helper_assist: { type: 'token', token: 'accuracy', stacks: 1 },
  kitchen_helper_duck: [
    { type: 'move', distance: 1 },
    { type: 'token', token: 'dodge', stacks: 1 },
  ],
};

// security_taunt는 여기서 제외 — taunted 토큰은 아군에게 붙어 적의 공격을 끌어온다(도발)
const ENEMY_SUPPORT_SKILLS = new Set([
  'doctor_diagnose',
  'engineer_shock_trap',
  'mechanic_tripwire',
  'dog_track_weakness',
  'jisu_diagnose',
  'merchant_bargain',
  'tower_engineer_trap',
  'sous_chef_intimidate',
]);

const RANGED_SKILLS = new Set([
  'soldier_burst_fire',
  'soldier_suppressive_fire',
  'deserter_rifle_shot',
  'deserter_covering_fire',
  'child_throw_debris',
  'minjun_pistol',
  'sohee_precise_shot',
]);

const FIREARM_SKILLS = new Set([
  'soldier_burst_fire',
  'soldier_suppressive_fire',
  'deserter_rifle_shot',
  'deserter_covering_fire',
  'minjun_pistol',
  'sohee_precise_shot',
]);

export const SKILL_MOTION_KEYS = Object.freeze({
  doctor_precise_cut: 'melee',
  doctor_triage: 'support',
  doctor_diagnose: 'support',
  soldier_burst_fire: 'ranged',
  soldier_suppressive_fire: 'ranged',
  soldier_tactical_shift: 'move',
  firefighter_axe_swing: 'melee',
  firefighter_rescue_guard: 'guard',
  firefighter_force_advance: 'move',
  homeless_dirty_fighting: 'melee',
  homeless_slip_away: 'move',
  homeless_scavenge_weapon: 'support',
  chef_knife_flurry: 'melee',
  chef_field_ration: 'support',
  chef_hot_pan: 'melee',
  engineer_wrench_strike: 'melee',
  engineer_improvised_cover: 'guard',
  engineer_shock_trap: 'support',
  old_survivor_cane_strike: 'melee',
  old_survivor_warning: 'support',
  old_survivor_hold_line: 'guard',
  nurse_scalpel: 'melee',
  nurse_triage: 'support',
  nurse_encourage: 'support',
  deserter_rifle_shot: 'ranged',
  deserter_covering_fire: 'ranged',
  deserter_reposition: 'move',
  child_throw_debris: 'ranged',
  child_hide: 'guard',
  child_warning: 'support',
  mechanic_wrench: 'melee',
  mechanic_field_repair: 'support',
  mechanic_tripwire: 'support',
  student_improvised_strike: 'melee',
  student_first_aid: 'support',
  student_quick_step: 'move',
  dog_bite: 'melee',
  dog_guard: 'guard',
  dog_track_weakness: 'support',
  colleague_hammer: 'melee',
  colleague_brace: 'guard',
  colleague_teamwork: 'support',
  minjun_pistol: 'ranged',
  minjun_combat_medicine: 'support',
  minjun_command: 'support',
  sohee_precise_shot: 'ranged',
  sohee_silent_cover: 'guard',
  sohee_focus: 'support',
  jisu_scalpel: 'melee',
  jisu_emergency_care: 'support',
  jisu_diagnose: 'support',
  yeongcheol_axe: 'melee',
  yeongcheol_rescue: 'guard',
  yeongcheol_rally: 'support',
  daehan_wrench: 'melee',
  daehan_barricade: 'guard',
  daehan_overcharge: 'support',
  security_baton: 'melee',
  security_guard: 'guard',
  security_taunt: 'support',
  merchant_hidden_blade: 'melee',
  merchant_supply: 'support',
  merchant_bargain: 'support',
  tower_cook_knife: 'melee',
  tower_cook_meal: 'support',
  tower_cook_burn: 'melee',
  tower_engineer_wrench: 'melee',
  tower_engineer_cover: 'guard',
  tower_engineer_trap: 'support',
  tower_doctor_scalpel: 'melee',
  tower_doctor_triage: 'support',
  tower_doctor_stimulant: 'support',
  sous_chef_cleaver: 'melee',
  sous_chef_ration: 'support',
  sous_chef_intimidate: 'support',
  kitchen_helper_pan: 'melee',
  kitchen_helper_assist: 'support',
  kitchen_helper_duck: 'move',
});

const STATUS_DAMAGE = {
  chef_hot_pan: { id: 'burn', duration: 2, chance: 0.45 },
  tower_cook_burn: { id: 'burn', duration: 2, chance: 0.5 },
};

// 카테고리 기본값 위에 실제 캐릭터별 전술 역할·모션·수치·효과 차이를 명시한다.
const SKILL_OVERRIDES = {
  doctor_precise_cut:      { accuracy: 0.88, critChance: 0.25, damage: [6, 10] },
  soldier_burst_fire:      { accuracy: 0.78, damage: [10, 16] },
  firefighter_axe_swing:   { accuracy: 0.78, damage: [9, 15] },
  homeless_dirty_fighting: { accuracy: 0.86, damage: [6, 10] },
  // 셋업→페이오프: hot_pan의 burn 등 DoT가 붙은 대상은 굽고 썰린다
  chef_knife_flurry:       {
    accuracy: 0.84, damage: [6, 11],
    bonusVs: { statusIds: ['burn', 'bleed', 'acid_burn', 'poison'], mult: 1.5 },
  },
  // 셋업→페이오프: shock_trap 등 제어에 걸린 대상은 정비공의 정확한 일격(치명 확정)
  engineer_wrench_strike:  {
    accuracy: 0.80, damage: [8, 13],
    bonusVs: { statusIds: ['shock', 'rooted', 'stun'], critAuto: true },
  },
  old_survivor_cane_strike: {
    tacticalRole: 'damage',
    accuracy: 0.84,
    damage: [6, 10],
  },
  old_survivor_warning: {
    tacticalRole: 'support',
  },
  old_survivor_hold_line: {
    tacticalRole: 'guard',
    target: { ranks: FRONT_RANKS },
  },
  nurse_scalpel: {
    tacticalRole: 'damage',
    accuracy: 0.9,
    damage: [7, 9],
  },
  nurse_triage: {
    tacticalRole: 'heal',
    replaceEffects: [
      { type: 'heal', value: [8, 10], removeStatus: ['bleed'] },
    ],
  },
  nurse_encourage: {
    tacticalRole: 'support',
  },
  deserter_rifle_shot: {
    tacticalRole: 'damage',
    accuracy: 0.78,
    damage: [8, 13],
  },
  deserter_covering_fire: {
    tacticalRole: 'control',
    accuracy: 0.74,
    damage: [5, 9],
    appendEffects: [
      { type: 'token', token: 'hesitation', stacks: 1 },
    ],
  },
  deserter_reposition: {
    tacticalRole: 'support',
    target: { selfOnly: true },
  },
  child_throw_debris: {
    tacticalRole: 'damage',
    accuracy: 0.7,
    damage: [3, 6],
    costs: { stamina: 1, noise: 1 },
    appendEffects: [
      { type: 'token', token: 'hesitation', stacks: 1 },
    ],
  },
  child_hide: {
    tacticalRole: 'guard',
    costs: { stamina: 1 },
    target: { selfOnly: true },
  },
  child_warning: {
    tacticalRole: 'support',
    costs: { stamina: 1 },
  },
  mechanic_wrench: {
    tacticalRole: 'damage',
    accuracy: 0.82,
    damage: [7, 11],
  },
  mechanic_field_repair: {
    tacticalRole: 'guard',
  },
  mechanic_tripwire: {
    tacticalRole: 'control',
  },
  student_improvised_strike: {
    tacticalRole: 'damage',
    accuracy: 0.78,
    damage: [4, 7],
    costs: { stamina: 1, noise: 1 },
  },
  student_first_aid: {
    tacticalRole: 'heal',
    costs: { stamina: 1 },
    replaceEffects: [{ type: 'heal', value: [4, 7] }],
  },
  student_quick_step: {
    tacticalRole: 'support',
    costs: { stamina: 1 },
    target: { selfOnly: true },
  },
  dog_bite: {
    tacticalRole: 'damage',
    accuracy: 0.86,
    damage: [5, 9],
    appendEffects: [
      {
        type: 'status',
        status: {
          id: 'bleed',
          duration: 2,
          chance: 0.25,
          effect: { hpLossPerRound: 1 },
        },
      },
    ],
  },
  dog_guard: {
    tacticalRole: 'guard',
  },
  dog_track_weakness: {
    tacticalRole: 'control',
  },
  colleague_hammer: {
    tacticalRole: 'damage',
    accuracy: 0.68,
    damage: [10, 16],
    costs: { stamina: 3, noise: 2 },
  },
  colleague_brace: {
    tacticalRole: 'guard',
    replaceEffects: [
      { type: 'guard', value: 0.45 },
      { type: 'guard', value: 0.45 },
    ],
  },
  colleague_teamwork: {
    tacticalRole: 'support',
  },
  minjun_pistol: {
    tacticalRole: 'damage',
    accuracy: 0.82,
    damage: [7, 11],
  },
  minjun_combat_medicine: {
    tacticalRole: 'heal',
    replaceEffects: [{ type: 'heal', value: [7, 11] }],
  },
  minjun_command: {
    tacticalRole: 'support',
  },
  sohee_precise_shot: {
    tacticalRole: 'damage',
    accuracy: 0.9,
    critChance: 0.2,
    damage: [8, 13],
    appendEffects: [
      { type: 'token', token: 'marked', stacks: 1 },
    ],
  },
  sohee_silent_cover: {
    tacticalRole: 'guard',
    costs: { stamina: 2, noise: 0 },
  },
  sohee_focus: {
    tacticalRole: 'support',
    target: { selfOnly: true },
  },
  jisu_scalpel: {
    tacticalRole: 'damage',
    accuracy: 0.9,
    critChance: 0.15,
    damage: [5, 9],
  },
  jisu_emergency_care: {
    tacticalRole: 'heal',
    costs: { stamina: 3 },
    replaceEffects: [
      { type: 'heal', value: [12, 18], removeStatus: ['bleed'] },
    ],
  },
  jisu_diagnose: {
    tacticalRole: 'control',
  },
  yeongcheol_axe: {
    tacticalRole: 'damage',
    accuracy: 0.78,
    damage: [9, 14],
    costs: { stamina: 3, noise: 2 },
  },
  yeongcheol_rescue: {
    tacticalRole: 'guard',
    replaceEffects: [
      { type: 'move', distance: 1 },
      { type: 'guard', value: 0.35 },
    ],
  },
  yeongcheol_rally: {
    tacticalRole: 'support',
  },
  daehan_wrench: {
    tacticalRole: 'damage',
    accuracy: 0.8,
    damage: [8, 13],
    bonusVs: {
      statusIds: ['shock', 'rooted', 'stun'],
      critAuto: true,
    },
  },
  daehan_barricade: {
    tacticalRole: 'guard',
    replaceEffects: [
      { type: 'guard', value: 0.4 },
      { type: 'guard', value: 0.4 },
    ],
  },
  daehan_overcharge: {
    tacticalRole: 'support',
  },
  security_baton: {
    tacticalRole: 'damage',
    accuracy: 0.84,
    damage: [6, 10],
    appendEffects: [
      {
        type: 'status',
        status: { id: 'stun', duration: 1, chance: 0.25 },
      },
    ],
  },
  security_guard: {
    tacticalRole: 'guard',
  },
  security_taunt: {
    tacticalRole: 'support',
    target: { selfOnly: true },
  },
  merchant_hidden_blade: {
    tacticalRole: 'damage',
    accuracy: 0.88,
    critChance: 0.15,
    damage: [6, 10],
  },
  merchant_supply: {
    tacticalRole: 'support',
  },
  merchant_bargain: {
    tacticalRole: 'control',
  },
  tower_cook_knife: {
    tacticalRole: 'damage',
    accuracy: 0.86,
    damage: [7, 11],
  },
  tower_cook_meal: {
    tacticalRole: 'food',
  },
  tower_cook_burn: {
    tacticalRole: 'damage',
    accuracy: 0.8,
    damage: [6, 9],
  },
  tower_engineer_wrench: {
    tacticalRole: 'damage',
    accuracy: 0.8,
    damage: [7, 12],
  },
  tower_engineer_cover: {
    tacticalRole: 'guard',
    replaceEffects: [
      { type: 'guard', value: 0.45 },
      { type: 'guard', value: 0.45 },
    ],
  },
  tower_engineer_trap: {
    tacticalRole: 'control',
  },
  tower_doctor_scalpel: {
    tacticalRole: 'damage',
    accuracy: 0.9,
    damage: [5, 8],
  },
  tower_doctor_triage: {
    tacticalRole: 'heal',
    replaceEffects: [
      {
        type: 'heal',
        value: [9, 14],
        removeStatus: ['bleed', 'burn', 'poison'],
      },
    ],
  },
  tower_doctor_stimulant: {
    tacticalRole: 'support',
  },
  sous_chef_cleaver: {
    tacticalRole: 'damage',
    accuracy: 0.8,
    damage: [8, 13],
  },
  sous_chef_ration: {
    tacticalRole: 'ration',
  },
  sous_chef_intimidate: {
    tacticalRole: 'control',
  },
  kitchen_helper_pan: {
    tacticalRole: 'damage',
    accuracy: 0.78,
    damage: [4, 8],
    costs: { stamina: 1, noise: 2 },
  },
  kitchen_helper_assist: {
    tacticalRole: 'support',
    costs: { stamina: 1 },
  },
  kitchen_helper_duck: {
    tacticalRole: 'support',
    costs: { stamina: 1 },
    target: { selfOnly: true },
  },
};

const COMMON_SKILL_IDS = ['basic_strike', 'guard', 'reposition'];
const MAPPED_SKILL_IDS = [
  ...Object.values(CHARACTER_COMBAT_LOADOUTS).flat(),
  ...Object.values(COMPANION_COMBAT_LOADOUTS).flat(),
];

function baseSkill(id, icon, target, effects, options = {}) {
  return {
    id,
    nameKey: `combat.skill.${id}`,
    icon,
    source: 'character',
    motionKey: options.motionKey,
    usableFrom: [...(options.usableFrom ?? ALL_RANKS)],
    target: {
      side: target.side,
      ranks: [...target.ranks],
      count: target.count ?? 1,
    },
    costs: { ...(options.costs ?? {}) },
    accuracy: options.accuracy ?? 1,
    effects,
  };
}

function inferMotionKey(id, effects, { ranged = false } = {}) {
  if (typeof SKILL_MOTION_KEYS[id] === 'string') return SKILL_MOTION_KEYS[id];
  if (effects.some((effect) => effect.type === 'damage')) return ranged ? 'ranged' : 'melee';
  if (effects.some((effect) => ['heal', 'token', 'status', 'stress', 'flee'].includes(effect.type))) {
    return 'support';
  }
  if (effects.some((effect) => effect.type === 'move')) return 'move';
  if (effects.some((effect) => effect.type === 'guard')) return 'guard';
  return undefined;
}

function buildMappedSkill(id) {
  if (HEAL_SKILLS.has(id)) {
    const effects = [{ type: 'heal', value: [8, 14] }];
    return baseSkill(
      id,
      'med',
      { side: 'ally', ranks: ALL_RANKS },
      effects,
      {
        costs: { stamina: 2 },
        motionKey: inferMotionKey(id, effects),
      },
    );
  }

  const supportEffect = SUPPORT_EFFECTS[id];
  if (supportEffect) {
    const targetsEnemy = ENEMY_SUPPORT_SKILLS.has(id);
    const effects = Array.isArray(supportEffect)
      ? supportEffect.map((entry) => ({ ...entry }))
      : [{ ...supportEffect }];
    return baseSkill(
      id,
      effects[0].type,
      {
        side: targetsEnemy ? 'enemy' : 'ally',
        ranks: ALL_RANKS,
      },
      effects,
      {
        costs: { stamina: 2 },
        accuracy: targetsEnemy ? 0.85 : 1,
        motionKey: inferMotionKey(id, effects),
      },
    );
  }

  const ranged = RANGED_SKILLS.has(id);
  const effects = [{ type: 'damage', value: ranged ? [9, 15] : [7, 12] }];
  if (STATUS_DAMAGE[id]) {
    effects.push({ type: 'status', status: { ...STATUS_DAMAGE[id] } });
  }

  return baseSkill(
    id,
    ranged ? 'shot' : 'strike',
    {
      side: 'enemy',
      ranks: ranged ? ALL_RANKS : FRONT_RANKS,
      count: id === 'soldier_suppressive_fire' ? 2 : 1,
    },
    effects,
    {
      usableFrom: ranged ? BACK_RANKS : FRONT_RANKS,
      costs: FIREARM_SKILLS.has(id)
        ? { stamina: 3, noise: 12 }
        : { stamina: 2, noise: 1 },
      accuracy: ranged ? 0.75 : 0.82,
      motionKey: inferMotionKey(id, effects, { ranged }),
    },
  );
}

function cloneSkillEffect(effect) {
  return {
    ...effect,
    ...(Array.isArray(effect.value) ? { value: [...effect.value] } : {}),
    ...(Array.isArray(effect.removeStatus)
      ? { removeStatus: [...effect.removeStatus] }
      : {}),
    ...(effect.status
      ? {
          status: {
            ...effect.status,
            ...(effect.status.effect
              ? { effect: { ...effect.status.effect } }
              : {}),
          },
        }
      : {}),
  };
}

function applySkillOverride(skill) {
  const override = SKILL_OVERRIDES[skill.id];
  if (!override) return skill;
  if (typeof override.tacticalRole === 'string') {
    skill.tacticalRole = override.tacticalRole;
  }
  if (Number.isFinite(override.accuracy)) skill.accuracy = override.accuracy;
  if (Number.isFinite(override.critChance)) skill.critChance = override.critChance;
  if (Array.isArray(override.damage)) {
    const damageEffect = skill.effects.find((effect) => effect.type === 'damage');
    if (damageEffect) damageEffect.value = [...override.damage];
  }
  if (Array.isArray(override.replaceEffects)) {
    skill.effects = override.replaceEffects.map(cloneSkillEffect);
  }
  if (Array.isArray(override.appendEffects)) {
    skill.effects.push(...override.appendEffects.map(cloneSkillEffect));
  }
  if (override.costs) {
    skill.costs = { ...skill.costs, ...override.costs };
  }
  if (override.target) {
    skill.target = {
      ...skill.target,
      ...override.target,
      ranks: [
        ...(override.target.ranks ?? skill.target.ranks),
      ],
    };
  }
  if (override.bonusVs) {
    skill.bonusVs = {
      ...override.bonusVs,
      statusIds: [...(override.bonusVs.statusIds ?? [])],
    };
  }
  return skill;
}

const mappedSkills = Object.fromEntries(
  MAPPED_SKILL_IDS.map((id) => [id, applySkillOverride(buildMappedSkill(id))]),
);

export const COMBAT_SKILLS = {
  basic_strike: baseSkill(
    'basic_strike',
    'strike',
    { side: 'enemy', ranks: FRONT_RANKS },
    [{ type: 'damage', value: [4, 7] }],
    { usableFrom: FRONT_RANKS, costs: { stamina: 1 }, accuracy: 0.8 },
  ),
  guard: baseSkill(
    'guard',
    'guard',
    { side: 'ally', ranks: ALL_RANKS },
    [{ type: 'guard', value: 0.25 }],
    { costs: { stamina: 1 } },
  ),
  reposition: baseSkill(
    'reposition',
    'move',
    { side: 'ally', ranks: ALL_RANKS },
    // 'auto': 잠긴 공격 스킬이 풀리는 방향 우선 — 넉백 복귀와 원거리 자리 잡기를 한 카드로
    [{ type: 'move', distance: 'auto' }],
    { costs: { stamina: 1 } },
  ),
  ...mappedSkills,
};

export function getCombatSkill(skillId) {
  return typeof skillId === 'string' && Object.hasOwn(COMBAT_SKILLS, skillId)
    ? COMBAT_SKILLS[skillId]
    : null;
}

export const COMMON_COMBAT_LOADOUT = COMMON_SKILL_IDS;
