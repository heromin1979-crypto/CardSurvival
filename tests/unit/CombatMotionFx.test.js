import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import {
  createActionFx,
  normalizeLegacyActionFx,
} from '../../js/systems/combat/CombatMotionFx.js';

function makeCombatant(overrides = {}) {
  return {
    id: 'npc_nurse',
    side: 'ally',
    sourceType: 'companion',
    sourceId: 'npc_nurse',
    hp: 30,
    maxHp: 30,
    tokens: {},
    statusEffects: [],
    dead: false,
    ...overrides,
  };
}

describe('createActionFx', () => {
  it('배우·대상·스킬과 전투 결과를 단일 action payload로 보존한다', () => {
    const companion = makeCombatant();
    const enemy = makeCombatant({
      id: 'enemy:1',
      side: 'enemy',
      sourceType: 'enemy',
      sourceId: 'zombie_runner',
      enemyIndex: 1,
    });
    const skill = {
      id: 'nurse_scalpel',
      motionKey: 'blade_combo',
    };

    expect(createActionFx({
      actor: companion,
      actorIndex: 0,
      target: enemy,
      skill,
      impactFx: 'slash',
      damage: 9,
      crit: true,
      killed: true,
    })).toEqual({
      kind: 'action',
      actorId: 'npc_nurse',
      actorSide: 'ally',
      actorIndex: 0,
      targetId: 'enemy:1',
      targetSide: 'enemy',
      targetIndex: 1,
      skillId: 'nurse_scalpel',
      motionKey: 'blade_combo',
      impactFx: 'slash',
      damage: 9,
      healing: 0,
      crit: true,
      miss: false,
      killed: true,
    });
  });
});

describe('production heal action FX', () => {
  beforeEach(() => {
    const player = makeCombatant({
      id: 'player',
      sourceType: 'player',
      sourceId: 'player',
      hp: 50,
      maxHp: 100,
    });
    const nurse = makeCombatant();

    GameState.player.hp = { current: 50, max: 100 };
    GameState.companions = ['npc_nurse'];
    GameState.npcs = {
      states: {
        npc_nurse: {
          hp: 30,
          maxHp: 30,
          statusEffects: [],
        },
      },
    };
    GameState.combat = {
      active: true,
      fxQueue: [],
      playerStatus: [],
      combatants: {
        player,
        npc_nurse: nurse,
      },
      formations: {
        ally: ['npc_nurse', null, null, 'player'],
        enemy: [],
      },
    };
  });

  it('동료가 플레이어를 치료하면 동료가 actor이고 플레이어가 target이다', () => {
    const skill = {
      id: 'nurse_triage',
      motionKey: 'support',
      effects: [{ type: 'heal', value: [12, 12] }],
    };
    const actor = GameState.combat.combatants.npc_nurse;
    const target = GameState.combat.combatants.player;

    CombatSystem._applyRankedEffect(
      skill.effects[0],
      actor,
      target,
      () => 0,
      { hit: true, crit: false, skill },
    );

    expect(GameState.combat.fxQueue).toContainEqual({
      kind: 'action',
      actorId: 'npc_nurse',
      actorSide: 'ally',
      actorIndex: 0,
      targetId: 'player',
      targetSide: 'ally',
      targetIndex: 0,
      skillId: 'nurse_triage',
      motionKey: 'support',
      impactFx: 'heal',
      damage: 0,
      healing: 12,
      crit: false,
      miss: false,
      killed: false,
    });
  });
});

describe('production support action FX', () => {
  it('피해·치유가 없는 동료 스킬도 semantic motion action을 남긴다', () => {
    const player = makeCombatant({
      id: 'player',
      sourceType: 'player',
      sourceId: 'player',
      hp: 100,
      maxHp: 100,
    });
    const companion = makeCombatant({
      id: 'npc_nurse',
      sourceId: 'npc_nurse',
      bond: 0,
    });
    const enemy = makeCombatant({
      id: 'enemy:0',
      side: 'enemy',
      sourceType: 'enemy',
      sourceId: 'zombie_common',
      enemyIndex: 0,
      hp: 20,
      maxHp: 20,
    });
    const skill = {
      id: 'nurse_encourage',
      motionKey: 'support',
      effects: [{ type: 'stress', value: -12 }],
    };

    GameState.player.hp = { current: 100, max: 100 };
    GameState.companions = ['npc_nurse'];
    GameState.npcs = {
      states: {
        npc_nurse: {
          hp: 30,
          maxHp: 30,
          statusEffects: [],
        },
      },
    };
    GameState.combat = {
      active: true,
      enemies: [{ id: 'zombie_common', currentHp: 20, maxHp: 20 }],
      combatants: {
        player,
        npc_nurse: companion,
        'enemy:0': enemy,
      },
      fxQueue: [],
      log: [],
      rewards: [],
      actionSequence: 0,
    };

    CombatSystem._finalizeSkillCommandResult({
      actorId: companion.id,
      skill,
      target: companion,
      targetHpBefore: companion.hp,
      result: { ok: true, hit: true, turnConsumed: true },
    });

    expect(GameState.combat.fxQueue).toContainEqual({
      kind: 'action',
      actorId: 'npc_nurse',
      actorSide: 'ally',
      actorIndex: 0,
      targetId: 'npc_nurse',
      targetSide: 'ally',
      targetIndex: 0,
      skillId: 'nurse_encourage',
      motionKey: 'support',
      impactFx: 'buff',
      damage: 0,
      healing: 0,
      crit: false,
      miss: false,
      killed: false,
    });
  });
});

describe('normalizeLegacyActionFx', () => {
  it('보스 action metadata를 보존하며 enemyAttack을 action으로 변환한다', () => {
    expect(normalizeLegacyActionFx({
      kind: 'enemyAttack',
      enemyIdx: 2,
      actionId: 'boss_sweep',
      category: 'special',
      motionKey: 'boss_sweep_motion',
      impactFx: 'slam',
      movement: 'lunge',
      camera: 'impact-heavy',
      dmg: 17,
    })).toMatchObject({
      kind: 'action',
      actorId: 'enemy:2',
      actorSide: 'enemy',
      actorIndex: 2,
      targetId: 'player',
      targetSide: 'ally',
      targetIndex: 0,
      actionId: 'boss_sweep',
      category: 'special',
      motionKey: 'boss_sweep_motion',
      impactFx: 'slam',
      movement: 'lunge',
      camera: 'impact-heavy',
      damage: 17,
    });
  });

  it('enemyAttackCompanion의 대상과 miss 결과를 분리해 보존한다', () => {
    expect(normalizeLegacyActionFx({
      kind: 'enemyAttackCompanion',
      enemyIdx: 0,
      npcId: 'npc_soldier_deserter',
      dmg: 0,
      miss: true,
    })).toMatchObject({
      kind: 'action',
      actorId: 'enemy:0',
      actorSide: 'enemy',
      actorIndex: 0,
      targetId: 'npc_soldier_deserter',
      targetSide: 'ally',
      damage: 0,
      miss: true,
    });
  });
});
