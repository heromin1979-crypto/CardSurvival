import { describe, expect, it } from 'vitest';
import {
  CHARACTER_COMBAT_LOADOUTS,
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../../js/data/combatSkills.js';
import { ENEMIES } from '../../js/data/enemies.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';

const EXPECTED_SKILL_MOTION_KEYS = {
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
};

const REQUIRED_ENEMY_ACTION_IDS = [
  'runner_rush',
  'slam',
  'aimed_shot',
  'acid_lash',
  'self_destruct',
  'summon_horde',
  'charge_strike',
];

function getMappedSkillIds() {
  return [...new Set([
    ...Object.values(CHARACTER_COMBAT_LOADOUTS).flat(),
    ...Object.values(COMPANION_COMBAT_LOADOUTS).flat(),
  ])];
}

function getEnemyActions() {
  return Object.values(ENEMIES).flatMap((enemy) => [
    ...(enemy.specialSkills ?? []),
    ...(enemy.timedThreat ? [enemy.timedThreat] : []),
  ]);
}

describe('combat motion key mapping', () => {
  it('assigns the semantic motion key to every unique player and companion skill', () => {
    const skillIds = getMappedSkillIds();

    expect(skillIds).toHaveLength(78);
    expect(Object.keys(EXPECTED_SKILL_MOTION_KEYS)).toHaveLength(78);
    expect(skillIds).toEqual(expect.arrayContaining(Object.keys(EXPECTED_SKILL_MOTION_KEYS)));
    expect(Object.fromEntries(skillIds.map((id) => [id, COMBAT_SKILLS[id]?.motionKey])))
      .toEqual(EXPECTED_SKILL_MOTION_KEYS);
  });

  it('keeps the seven named normal-enemy actions on their unique motion keys', () => {
    const actionsById = Object.fromEntries(
      getEnemyActions().map((action) => [action.id, action]),
    );

    expect(Object.fromEntries(REQUIRED_ENEMY_ACTION_IDS.map((id) => [id, actionsById[id]?.motionKey])))
      .toEqual(Object.fromEntries(REQUIRED_ENEMY_ACTION_IDS.map((id) => [id, id])));
  });

  it('keeps every boss action in the two-basic, special, ultimate motion-key contract', () => {
    for (const [bossId, enemy] of Object.entries(SECRET_ENEMIES)) {
      if (!enemy.isBoss) continue;

      const { basicAttacks, specialSkill, ultimate, normalSkills } = enemy.bossPattern;
      const actions = [...basicAttacks, specialSkill, ultimate];

      expect(basicAttacks, `${bossId}.basicAttacks`).toHaveLength(2);
      expect(normalSkills, `${bossId}.normalSkills`).toBeUndefined();
      expect(actions.map((action) => action.category), `${bossId}.categories`)
        .toEqual(['basic', 'basic', 'special', 'ultimate']);
      expect(actions.map((action) => action.motionKey), `${bossId}.motionKeys`)
        .toEqual(actions.map((action) => action.id));
    }
  });
});
