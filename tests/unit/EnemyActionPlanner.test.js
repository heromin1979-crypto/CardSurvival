import { describe, expect, it } from 'vitest';
import {
  advanceEnemyAction,
  commitEnemyAction,
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
});
