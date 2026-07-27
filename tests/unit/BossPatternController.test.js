import { describe, expect, it } from 'vitest';
import {
  advanceBossAction,
  commitNextBossAction,
  completeBossAction,
  createBossActionState,
  normalizeBossActionState,
  reserveUltimateAfterDamage,
} from '../../js/systems/combat/BossPatternController.js';

const candidates = [
  { id: 'player', side: 'ally', rank: 1, hp: 100, maxHp: 100 },
  { id: 'npc_guard', side: 'ally', rank: 2, hp: 80, maxHp: 80 },
];

function createBoss(overrides = {}) {
  return {
    currentHp: 50,
    maxHp: 100,
    _skillCooldowns: { special_roar: 0 },
    _statusEffects: [],
    bossPattern: {
      basicAttacks: [
        {
          id: 'basic_a',
          category: 'basic',
          targetPolicy: 'frontmost',
          motionKey: 'basic_a',
        },
        {
          id: 'basic_b',
          category: 'basic',
          targetPolicy: 'all',
          targetCount: 2,
          motionKey: 'basic_b',
        },
      ],
      specialSkill: {
        id: 'special_roar',
        category: 'special',
        cooldown: 3,
        chance: 0.3,
        targetPolicy: 'all',
        targetCount: 2,
        motionKey: 'special_roar',
      },
      ultimate: {
        id: 'ultimate_end',
        category: 'ultimate',
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
        targetPolicy: 'all',
        targetCount: 2,
        motionKey: 'ultimate_end',
      },
    },
    ...overrides,
  };
}

describe('BossPatternController', () => {
  it('새 상태와 저장 데이터 누락 필드를 안전한 기본값으로 정규화한다', () => {
    expect(createBossActionState()).toEqual({
      committedAction: null,
      ultimatePending: false,
      ultimateUsed: false,
      lastBasicActionId: null,
    });
    expect(normalizeBossActionState({ ultimatePending: true })).toEqual({
      committedAction: null,
      ultimatePending: true,
      ultimateUsed: false,
      lastBasicActionId: null,
    });
  });

  it('특수기 난수가 0.299999이면 쿨다운 0인 특수기를 선택한다', () => {
    const next = commitNextBossAction({
      state: createBossActionState(),
      enemy: createBoss(),
      candidates,
      random: () => 0.299999,
    });

    expect(next.committedAction).toMatchObject({
      actionId: 'special_roar',
      category: 'special',
    });
  });

  it('특수기 난수가 경계값 0.3이면 기본공격을 선택한다', () => {
    const next = commitNextBossAction({
      state: createBossActionState(),
      enemy: createBoss(),
      candidates,
      random: () => 0.3,
    });

    expect(next.committedAction).toMatchObject({
      actionId: 'basic_a',
      category: 'basic',
    });
  });

  it('직전 기본공격과 다른 유효 기본공격을 우선한다', () => {
    const enemy = createBoss({ _skillCooldowns: { special_roar: 2 } });
    const next = commitNextBossAction({
      state: {
        ...createBossActionState(),
        lastBasicActionId: 'basic_a',
      },
      enemy,
      candidates,
      random: () => 0,
    });

    expect(next.committedAction.actionId).toBe('basic_b');
    expect(next.lastBasicActionId).toBe('basic_b');
  });

  it('다른 기본공격이 조건 불충족이면 같은 기본공격을 연속 선택할 수 있다', () => {
    const enemy = createBoss({ _skillCooldowns: { special_roar: 2 } });
    enemy.bossPattern.basicAttacks[1].maxHpRatio = 0.2;

    const next = commitNextBossAction({
      state: {
        ...createBossActionState(),
        lastBasicActionId: 'basic_a',
      },
      enemy,
      candidates,
      random: () => 0,
    });

    expect(next.committedAction.actionId).toBe('basic_a');
    expect(next.lastBasicActionId).toBe('basic_a');
  });

  it.each([
    ['최소 HP 비율', { minHpRatio: 0.6 }, {}, {}],
    ['최대 HP 비율', { maxHpRatio: 0.4 }, {}, {}],
    ['소환 상한', { maxSummons: 2 }, {}, { activeSummons: 2 }],
    ['self 상태 부재', { requiresStatusAbsent: 'guarded' }, { _statusEffects: [{ id: 'guarded' }] }, {}],
  ])('특수기의 %s 조건을 만족하지 않으면 기본공격을 선택한다', (_name, skillRule, enemyOverride, context) => {
    const enemy = createBoss(enemyOverride);
    Object.assign(enemy.bossPattern.specialSkill, skillRule);

    const next = commitNextBossAction({
      state: createBossActionState(),
      enemy,
      candidates,
      context,
      random: () => 0,
    });

    expect(next.committedAction.category).toBe('basic');
  });

  it('예약된 필살기를 특수기 확률보다 먼저 예고하고 사용 완료 상태로 표시한다', () => {
    const next = commitNextBossAction({
      state: {
        ...createBossActionState(),
        ultimatePending: true,
      },
      enemy: createBoss(),
      candidates,
      random: () => 0,
    });

    expect(next).toMatchObject({
      ultimatePending: false,
      ultimateUsed: true,
      committedAction: {
        actionId: 'ultimate_end',
        category: 'ultimate',
        state: 'telegraphing',
        remainingTelegraphTurns: 1,
      },
    });
  });

  it('진행 중인 예고 행동은 새 행동으로 교체하지 않는다', () => {
    const committedAction = {
      actionId: 'long_special',
      category: 'special',
      state: 'telegraphing',
      targetIds: ['player'],
      remainingTelegraphTurns: 2,
      hitCount: 1,
      motionKey: 'long_special',
    };
    const state = {
      ...createBossActionState(),
      committedAction,
      ultimatePending: true,
    };

    const next = commitNextBossAction({
      state,
      enemy: createBoss(),
      candidates,
      random: () => 0,
    });

    expect(next.committedAction).toBe(committedAction);
    expect(next.ultimatePending).toBe(true);
    expect(next.ultimateUsed).toBe(false);
  });

  it('기절된 턴에는 예고 카운트를 멈추고 다음 정상 턴에만 감소시킨다', () => {
    const state = {
      ...createBossActionState(),
      committedAction: {
        actionId: 'ultimate_end',
        category: 'ultimate',
        state: 'telegraphing',
        targetIds: ['player'],
        remainingTelegraphTurns: 1,
        hitCount: 1,
        motionKey: 'ultimate_end',
      },
      ultimateUsed: true,
    };

    const stunned = advanceBossAction({ state, stunned: true });
    const ready = advanceBossAction({ state: stunned, stunned: false });

    expect(stunned.committedAction).toMatchObject({
      state: 'telegraphing',
      remainingTelegraphTurns: 1,
    });
    expect(ready.committedAction).toMatchObject({
      state: 'ready',
      remainingTelegraphTurns: 0,
    });
  });

  it('장기 예고 중 임계점을 통과하면 기존 행동을 유지하고 필살기만 예약한다', () => {
    const next = reserveUltimateAfterDamage({
      state: {
        committedAction: {
          actionId: 'long_special',
          category: 'special',
          state: 'telegraphing',
          targetIds: ['player'],
          remainingTelegraphTurns: 2,
          hitCount: 1,
          motionKey: 'long_special',
        },
        ultimatePending: false,
        ultimateUsed: false,
        lastBasicActionId: 'basic_a',
      },
      hpBefore: 40,
      hpAfter: 29,
      maxHp: 100,
      threshold: 0.3,
    });

    expect(next.committedAction.actionId).toBe('long_special');
    expect(next.ultimatePending).toBe(true);
    expect(next.ultimateUsed).toBe(false);
  });

  it('필살기 예고가 취소되어 완료돼도 사용 여부를 되돌리지 않는다', () => {
    const state = {
      ...createBossActionState(),
      committedAction: {
        actionId: 'ultimate_end',
        category: 'ultimate',
        state: 'telegraphing',
        targetIds: ['player'],
        remainingTelegraphTurns: 1,
        hitCount: 1,
        motionKey: 'ultimate_end',
      },
      ultimateUsed: true,
    };

    const completed = completeBossAction({ state, cancelled: true });

    expect(completed.committedAction).toBeNull();
    expect(completed.ultimateUsed).toBe(true);
  });

  it('committed ultimate가 있으면 누락되거나 잘못된 저장 플래그를 사용 완료로 정규화한다', () => {
    const committedAction = {
      actionId: 'ultimate_end',
      category: 'ultimate',
      state: 'telegraphing',
      targetIds: ['player'],
      remainingTelegraphTurns: 1,
      hitCount: 1,
      motionKey: 'ultimate_end',
    };

    expect(normalizeBossActionState({
      committedAction,
      ultimatePending: true,
      ultimateUsed: false,
    })).toMatchObject({
      committedAction,
      ultimatePending: false,
      ultimateUsed: true,
    });
  });
});
