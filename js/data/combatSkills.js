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
  'mechanic_field_repair',
  'student_first_aid',
  'minjun_combat_medicine',
  'jisu_emergency_care',
  'yeongcheol_rescue',
  'merchant_supply',
  'tower_cook_meal',
  'tower_doctor_triage',
  'sous_chef_ration',
  'kitchen_helper_assist',
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
  homeless_slip_away: { type: 'flee', chance: 0.45 },
  homeless_scavenge_weapon: { type: 'token', token: 'improvised', stacks: 1 },
  engineer_improvised_cover: { type: 'guard', value: 0.3 },
  engineer_shock_trap: { type: 'status', status: { id: 'shock', duration: 1, chance: 0.6 } },
  old_survivor_warning: { type: 'token', token: 'dodge', stacks: 1 },
  old_survivor_hold_line: { type: 'guard', value: 0.3 },
  nurse_encourage: { type: 'stress', value: -12 },
  deserter_reposition: { type: 'move', distance: 1 },
  child_hide: { type: 'guard', value: 0.5 },
  child_warning: { type: 'token', token: 'dodge', stacks: 1 },
  mechanic_tripwire: { type: 'status', status: { id: 'rooted', duration: 1, chance: 0.7 } },
  student_quick_step: { type: 'move', distance: 1 },
  dog_guard: { type: 'guard', value: 0.25 },
  // 군견의 약점 추적 = 표식(marked) — vulnerable보다 강한 집중 공격 시너지
  dog_track_weakness: { type: 'token', token: 'marked', stacks: 1 },
  colleague_brace: { type: 'guard', value: 0.3 },
  colleague_teamwork: { type: 'token', token: 'accuracy', stacks: 1 },
  minjun_command: { type: 'stress', value: -10 },
  sohee_silent_cover: { type: 'guard', value: 0.25 },
  sohee_focus: { type: 'token', token: 'focus', stacks: 1 },
  jisu_diagnose: { type: 'token', token: 'vulnerable', stacks: 1 },
  yeongcheol_rally: { type: 'stress', value: -14 },
  daehan_barricade: { type: 'guard', value: 0.4 },
  daehan_overcharge: { type: 'token', token: 'power', stacks: 1 },
  security_guard: { type: 'guard', value: 0.4 },
  security_taunt: { type: 'token', token: 'taunted', stacks: 1 },
  merchant_bargain: { type: 'token', token: 'hesitation', stacks: 1 },
  tower_engineer_cover: { type: 'guard', value: 0.35 },
  tower_engineer_trap: { type: 'status', status: { id: 'rooted', duration: 1, chance: 0.65 } },
  tower_doctor_stimulant: { type: 'token', token: 'speed', stacks: 1 },
  sous_chef_intimidate: { type: 'stress', value: 10 },
  kitchen_helper_duck: { type: 'move', distance: 1 },
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

const STATUS_DAMAGE = {
  chef_hot_pan: { id: 'burn', duration: 2, chance: 0.45 },
  tower_cook_burn: { id: 'burn', duration: 2, chance: 0.5 },
};

// 직업 대표 공격 스킬 개별화 — 카테고리 파생값(근접 [7,12]/0.82 등) 위에 정체성만 얹는다.
// 전면 개별 튜닝은 하지 않는다(YAGNI): 여기 없는 스킬은 카테고리 기본값 유지.
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

function buildMappedSkill(id) {
  if (HEAL_SKILLS.has(id)) {
    return baseSkill(
      id,
      'med',
      { side: 'ally', ranks: ALL_RANKS },
      [{ type: 'heal', value: [8, 14] }],
      { costs: { stamina: 2 } },
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
      { costs: { stamina: 2 }, accuracy: targetsEnemy ? 0.85 : 1 },
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
    },
  );
}

function applySkillOverride(skill) {
  const override = SKILL_OVERRIDES[skill.id];
  if (!override) return skill;
  if (Number.isFinite(override.accuracy)) skill.accuracy = override.accuracy;
  if (Number.isFinite(override.critChance)) skill.critChance = override.critChance;
  if (Array.isArray(override.damage)) {
    const damageEffect = skill.effects.find((effect) => effect.type === 'damage');
    if (damageEffect) damageEffect.value = [...override.damage];
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
