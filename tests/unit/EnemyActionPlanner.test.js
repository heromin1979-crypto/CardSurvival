import { describe, expect, it } from 'vitest';
import {
  advanceEnemyAction,
  commitEnemyAction,
  commitEnemyActionDefinition,
  commitTimedThreatAction,
  createEnemyActionState,
  retargetCommittedAction,
} from '../../js/systems/combat/EnemyActionPlanner.js';

const candidates = [
  { id: 'player', side: 'ally', hp: 100, maxHp: 100 },
  { id: 'npc_nurse', side: 'ally', hp: 80, maxHp: 80, isHealer: true },
];

const runnerEnemy = {
  patternProfile: { targetPolicy: 'ally' },
  specialSkills: [{
    id: 'runner_rush',
    cooldown: 3,
    telegraph: { turns: 1 },
    effect: { multiHit: 2 },
  }],
};

describe('EnemyActionPlanner', () => {
  it('주입한 행동 정의를 기존 예약 행동 형태로 정규화한다', () => {
    const state = commitEnemyActionDefinition({
      enemy: { patternProfile: { targetPolicy: 'ally' } },
      definition: {
        id: 'boss_sweep',
        targetPolicy: 'all',
        targetCount: 2,
        telegraphTurns: 2,
        hitCount: 3,
        motionKey: 'boss_sweep_motion',
      },
      category: 'special',
      candidates,
      random: () => 0,
    });

    expect(state.committedAction).toEqual({
      actionId: 'boss_sweep',
      category: 'special',
      state: 'telegraphing',
      targetIds: ['player', 'npc_nurse'],
      remainingTelegraphTurns: 2,
      hitCount: 3,
      motionKey: 'boss_sweep_motion',
    });
  });

  it('빈 행동 상태를 만든다', () => {
    expect(createEnemyActionState()).toEqual({ committedAction: null });
  });

  it('표시와 실행이 공유할 예약 행동을 한 번만 결정한다', () => {
    const state = commitEnemyAction({
      enemy: runnerEnemy,
      candidates,
      random: () => 0.1,
    });

    expect(state.committedAction).toEqual({
      actionId: 'runner_rush',
      category: 'special',
      state: 'telegraphing',
      targetIds: ['player'],
      remainingTelegraphTurns: 1,
      hitCount: 2,
      motionKey: 'runner_rush',
    });
  });

  it('기절하면 예고 턴을 소모하지 않고, 그렇지 않으면 ready로 진행한다', () => {
    const committed = commitEnemyAction({
      enemy: runnerEnemy,
      candidates,
      random: () => 0.1,
    });

    const stunned = advanceEnemyAction({ state: committed, stunned: true });
    const ready = advanceEnemyAction({ state: stunned });

    expect(stunned.committedAction).toMatchObject({
      state: 'telegraphing',
      remainingTelegraphTurns: 1,
    });
    expect(ready.committedAction).toMatchObject({
      state: 'ready',
      remainingTelegraphTurns: 0,
    });
  });

  it('예약 대상이 사망했을 때만 같은 정책으로 대상만 다시 고른다', () => {
    const state = commitEnemyAction({
      enemy: {
        ...runnerEnemy,
        patternProfile: { targetPolicy: 'lowest_hp' },
      },
      candidates: [
        { id: 'player', side: 'ally', hp: 30, maxHp: 100 },
        { id: 'npc_nurse', side: 'ally', hp: 80, maxHp: 80 },
      ],
      random: () => 0.1,
    });
    const action = state.committedAction;

    const unchanged = retargetCommittedAction({
      action,
      candidates: [
        { id: 'player', side: 'ally', hp: 30, maxHp: 100 },
        { id: 'npc_nurse', side: 'ally', hp: 80, maxHp: 80 },
      ],
    });
    const retargeted = retargetCommittedAction({
      action,
      candidates: [
        { id: 'player', side: 'ally', hp: 0, maxHp: 100 },
        { id: 'npc_nurse', side: 'ally', hp: 80, maxHp: 80 },
        { id: 'npc_doctor', side: 'ally', hp: 20, maxHp: 100 },
      ],
    });

    expect(unchanged).toBe(action);
    expect(retargeted).toEqual({
      actionId: 'runner_rush',
      category: 'special',
      state: 'telegraphing',
      targetIds: ['npc_doctor'],
      remainingTelegraphTurns: 1,
      hitCount: 2,
      motionKey: 'runner_rush',
    });
  });

  it('준비된 특수 스킬을 순서대로 판정해 첫 성공 스킬을 예약한다', () => {
    const rolls = [0.9, 0.1];
    const state = commitEnemyAction({
      enemy: {
        patternProfile: { targetPolicy: 'ally' },
        specialSkills: [
          { id: 'first_skill', cooldown: 2 },
          { id: 'second_skill', cooldown: 2 },
        ],
      },
      candidates,
      random: () => rolls.shift(),
    });

    expect(state.committedAction).toMatchObject({
      actionId: 'second_skill',
      category: 'special',
    });
  });

  it('side 정책에 맞는 생존 대상이 없으면 빈 대상 목록을 예약한다', () => {
    const state = commitEnemyAction({
      enemy: {
        patternProfile: {
          targetPolicy: 'ally',
          defaultAction: { actionId: 'basic_attack', motionKey: 'melee' },
        },
      },
      candidates: [{ id: 'enemy_one', side: 'enemy', hp: 10, maxHp: 10 }],
    });

    expect(state.committedAction.targetIds).toEqual([]);
  });

  it('frontmost 정책은 후보 배열 순서가 아니라 실제 진형 rank가 가장 낮은 대상을 고른다', () => {
    const state = commitEnemyAction({
      enemy: {
        patternProfile: {
          targetPolicy: 'frontmost',
          defaultAction: {
            actionId: 'basic_attack',
            targetPolicy: 'frontmost',
            target: { side: 'frontmost', count: 1 },
          },
        },
      },
      candidates: [
        { id: 'player', side: 'ally', rank: 3, hp: 100, maxHp: 100 },
        { id: 'npc_front', side: 'ally', rank: 1, hp: 100, maxHp: 100 },
      ],
    });

    expect(state.committedAction.targetIds).toEqual(['npc_front']);
  });

  it('opportunist 정책은 저체력이어도 방어 중인 대상보다 노출된 대상을 우선한다', () => {
    const state = commitEnemyAction({
      enemy: {
        patternProfile: {
          targetPolicy: 'opportunist',
          defaultAction: {
            actionId: 'basic_attack',
            targetPolicy: 'opportunist',
            target: { side: 'opportunist', count: 1 },
          },
        },
      },
      candidates: [
        {
          id: 'npc_covered',
          side: 'ally',
          hp: 10,
          maxHp: 100,
          isDefended: true,
          isExposed: false,
        },
        {
          id: 'npc_exposed',
          side: 'ally',
          hp: 80,
          maxHp: 100,
          isDefended: false,
          isExposed: true,
        },
      ],
    });

    expect(state.committedAction.targetIds).toEqual(['npc_exposed']);
  });

  it('timed threat도 선언된 targetPolicy와 count로 예약 대상을 결정한다', () => {
    const allTargets = commitTimedThreatAction({
      enemy: {
        _chargeRemaining: 2,
        timedThreat: {
          id: 'self_destruct',
          targetPolicy: 'all',
          target: { side: 'all', count: 4 },
          hitCount: 1,
          motionKey: 'self_destruct',
        },
      },
      candidates: [
        { id: 'player', side: 'ally', rank: 2, hp: 100, maxHp: 100 },
        { id: 'npc_front', side: 'ally', rank: 1, hp: 80, maxHp: 80 },
      ],
    });
    const frontmost = commitTimedThreatAction({
      enemy: {
        _chargeRemaining: 0,
        timedThreat: {
          id: 'charge_strike',
          targetPolicy: 'frontmost',
          target: { side: 'frontmost', count: 1 },
          hitCount: 1,
          motionKey: 'charge_strike',
        },
      },
      candidates: [
        { id: 'player', side: 'ally', rank: 3, hp: 100, maxHp: 100 },
        { id: 'npc_front', side: 'ally', rank: 1, hp: 80, maxHp: 80 },
      ],
    });

    expect(allTargets.committedAction).toMatchObject({
      actionId: 'self_destruct',
      state: 'telegraphing',
      targetIds: ['player', 'npc_front'],
      remainingTelegraphTurns: 2,
      hitCount: 1,
    });
    expect(frontmost.committedAction).toMatchObject({
      actionId: 'charge_strike',
      state: 'ready',
      targetIds: ['npc_front'],
      remainingTelegraphTurns: 0,
      hitCount: 1,
    });
  });
});
