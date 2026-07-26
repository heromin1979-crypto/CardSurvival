import { describe, expect, it } from 'vitest';
import {
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../../js/data/combatSkills.js';
import { COMPANION_TACTICS } from '../../js/data/companionTactics.js';
import { validateCompanionPatternData } from '../../js/data/validate.js';
import { planCompanionTurn } from '../../js/systems/combat/CompanionTactics.js';

const skill = (id) => COMBAT_SKILLS[id];

describe('planCompanionTurn', () => {
  it('heal 자세의 간호사는 실제 triage로 HP 비율이 가장 낮은 아군을 치료한다', () => {
    const plan = planCompanionTurn({
      npcId: 'npc_nurse',
      stance: 'heal',
      skills: COMPANION_COMBAT_LOADOUTS.npc_nurse.map(skill),
      allies: [
        { id: 'npc_nurse', side: 'ally', hp: 42, maxHp: 50 },
        { id: 'player', side: 'ally', hp: 70, maxHp: 100 },
        { id: 'npc_wounded', side: 'ally', hp: 12, maxHp: 50 },
      ],
      enemies: [{ id: 'enemy:0', side: 'enemy', hp: 30, maxHp: 30 }],
      canUse: () => true,
    });

    expect(plan).toEqual({
      skillId: 'nurse_triage',
      targetId: 'npc_wounded',
      reason: 'lowest_hp_ally',
    });
  });

  it('치료기가 없는 탈영병은 heal 자세에서도 실제 공격 스킬로 폴백한다', () => {
    const loadout = COMPANION_COMBAT_LOADOUTS.npc_soldier_deserter.map(skill);
    const plan = planCompanionTurn({
      npcId: 'npc_soldier_deserter',
      stance: 'heal',
      skills: loadout,
      allies: [
        { id: 'npc_soldier_deserter', side: 'ally', hp: 40, maxHp: 50 },
        { id: 'player', side: 'ally', hp: 20, maxHp: 100 },
      ],
      enemies: [{ id: 'enemy:0', side: 'enemy', hp: 18, maxHp: 30 }],
      canUse: () => true,
    });

    expect(loadout.map(({ id }) => id)).toContain(plan?.skillId);
    expect(plan).toEqual({
      skillId: 'deserter_rifle_shot',
      targetId: 'enemy:0',
      reason: 'lowest_hp_enemy',
    });
  });

  it('manual 자세는 자동 행동을 계획하지 않는다', () => {
    expect(planCompanionTurn({
      npcId: 'npc_nurse',
      stance: 'manual',
      skills: COMPANION_COMBAT_LOADOUTS.npc_nurse.map(skill),
      allies: [{ id: 'npc_nurse', side: 'ally', hp: 30, maxHp: 50 }],
      enemies: [{ id: 'enemy:0', side: 'enemy', hp: 20, maxHp: 20 }],
      canUse: () => true,
    })).toBeNull();
  });

  it('support 자세는 이미 marked가 있는 적에게 같은 지원기를 반복하지 않는다', () => {
    const trackingSkill = {
      ...skill('dog_track_weakness'),
      tacticalRole: 'control',
    };
    const plan = planCompanionTurn({
      npcId: 'npc_dog',
      stance: 'support',
      skills: [trackingSkill],
      allies: [{ id: 'npc_dog', side: 'ally', hp: 35, maxHp: 40 }],
      enemies: [
        {
          id: 'enemy:marked',
          side: 'enemy',
          hp: 10,
          maxHp: 30,
          tokens: { marked: 1 },
        },
        {
          id: 'enemy:clear',
          side: 'enemy',
          hp: 20,
          maxHp: 30,
          tokens: {},
        },
      ],
      canUse: () => true,
    });

    expect(plan).toEqual({
      skillId: 'dog_track_weakness',
      targetId: 'enemy:clear',
      reason: 'control_enemy',
    });
  });

  it.each([
    ['block', {
      id: 'test_guard',
      tacticalRole: 'guard',
      target: { side: 'ally' },
      effects: [{ type: 'guard', value: 0.3 }],
    }, { tokens: { block: 1 } }, { tokens: {} }],
    ['focus', {
      id: 'test_focus',
      tacticalRole: 'support',
      target: { side: 'ally' },
      effects: [{ type: 'token', token: 'focus', stacks: 1 }],
    }, { tokens: { focus: 1 } }, { tokens: {} }],
    ['vulnerable', {
      id: 'test_vulnerable',
      tacticalRole: 'control',
      target: { side: 'enemy' },
      effects: [{ type: 'token', token: 'vulnerable', stacks: 1 }],
    }, { tokens: { vulnerable: 1 } }, { tokens: {} }],
    ['rooted', {
      id: 'test_root',
      tacticalRole: 'control',
      target: { side: 'enemy' },
      effects: [{
        type: 'status',
        status: { id: 'rooted', duration: 1, chance: 1 },
      }],
    }, { statusEffects: [{ id: 'rooted', duration: 1 }] }, { statusEffects: [] }],
  ])('이미 %s가 충분한 대상은 같은 효과 대상에서 제외한다', (
    _effectId,
    tacticalSkill,
    saturatedState,
    clearState,
  ) => {
    const targetsAllies = tacticalSkill.target.side === 'ally';
    const saturated = {
      id: targetsAllies ? 'npc_nurse' : 'enemy:saturated',
      side: tacticalSkill.target.side,
      hp: 5,
      maxHp: 20,
      ...saturatedState,
    };
    const clear = {
      id: targetsAllies ? 'player' : 'enemy:clear',
      side: tacticalSkill.target.side,
      hp: 15,
      maxHp: 20,
      ...clearState,
    };
    const plan = planCompanionTurn({
      npcId: 'npc_nurse',
      stance: targetsAllies && tacticalSkill.tacticalRole === 'guard'
        ? 'hold'
        : 'support',
      skills: [tacticalSkill],
      allies: targetsAllies ? [saturated, clear] : [
        { id: 'npc_nurse', side: 'ally', hp: 20, maxHp: 20 },
      ],
      enemies: targetsAllies ? [
        { id: 'enemy:0', side: 'enemy', hp: 20, maxHp: 20 },
      ] : [saturated, clear],
      canUse: () => true,
    });

    expect(plan?.targetId).toBe(clear.id);
  });

  it('hold 자세는 실제 guard 효과가 없으면 공격으로 폴백하지 않는다', () => {
    expect(planCompanionTurn({
      npcId: 'npc_soldier_deserter',
      stance: 'hold',
      skills: COMPANION_COMBAT_LOADOUTS.npc_soldier_deserter.map(skill),
      allies: [
        { id: 'npc_soldier_deserter', side: 'ally', hp: 20, maxHp: 50 },
        { id: 'player', side: 'ally', hp: 10, maxHp: 100 },
      ],
      enemies: [{ id: 'enemy:0', side: 'enemy', hp: 20, maxHp: 20 }],
      canUse: () => true,
    })).toBeNull();
  });

  it('food와 ration 역할은 heal 자세의 치료기로 선택하지 않는다', () => {
    const plan = planCompanionTurn({
      npcId: 'npc_tower_cook',
      stance: 'heal',
      skills: [
        {
          id: 'meal',
          tacticalRole: 'food',
          target: { side: 'ally' },
          effects: [{ type: 'heal', value: [20, 20] }],
        },
        {
          id: 'knife',
          tacticalRole: 'damage',
          target: { side: 'enemy' },
          effects: [{ type: 'damage', value: [1, 1] }],
        },
      ],
      allies: [
        { id: 'npc_tower_cook', side: 'ally', hp: 20, maxHp: 50 },
        { id: 'player', side: 'ally', hp: 5, maxHp: 100 },
      ],
      enemies: [{ id: 'enemy:0', side: 'enemy', hp: 20, maxHp: 20 }],
      canUse: () => true,
    });

    expect(plan?.skillId).toBe('knife');
  });
});

describe('COMPANION_TACTICS data contract', () => {
  it('실제 20종 roster를 빠짐없이 선언하고 각 role을 현재 loadout에서 해석한다', () => {
    expect(Object.keys(COMPANION_TACTICS)).toEqual(
      Object.keys(COMPANION_COMBAT_LOADOUTS),
    );
    expect(validateCompanionPatternData({
      loadouts: COMPANION_COMBAT_LOADOUTS,
      skills: COMBAT_SKILLS,
      tactics: COMPANION_TACTICS,
      expectedCompanionIds: Object.keys(COMPANION_COMBAT_LOADOUTS),
    })).toEqual([]);
  });
});
