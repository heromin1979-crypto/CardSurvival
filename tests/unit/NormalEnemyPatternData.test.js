import { describe, expect, it } from 'vitest';
import ENEMIES from '../../js/data/enemies.js';
import { validateNormalEnemyPatternData } from '../../js/data/validate.js';

const validFixture = () => ({
  enemy_test: {
    patternProfile: {
      role: 'baseline',
      targetPolicy: 'ally',
      defaultAction: {
        actionId: 'basic_attack',
        targetPolicy: 'ally',
        hitCount: 1,
        telegraph: { turns: 0 },
        effects: [{ type: 'damage', value: [1, 2] }],
        motionKey: 'melee',
        target: { side: 'ally' },
      },
    },
    timedThreat: {
      counters: {
        stunDelays: true,
        quietKill: true,
        weakness: ['fire'],
      },
    },
  },
});

const EXPECTED_PATTERNS = {
  zombie_patient_dormant: {
    role: 'ambusher',
    targetPolicy: 'player',
    defaultActionId: 'basic_attack',
    specialActionIds: ['startled_lunge'],
    hitCount: 1,
    telegraphTurns: 0,
    counters: {},
  },
  zombie_common: {
    role: 'baseline',
    targetPolicy: 'frontmost',
    defaultActionId: 'basic_attack',
    specialActionIds: [],
    hitCount: 1,
    telegraphTurns: 0,
    counters: {},
  },
  zombie_runner: {
    role: 'skirmisher',
    targetPolicy: 'lowest_hp',
    defaultActionId: 'basic_attack',
    specialActionIds: ['runner_rush'],
    hitCount: 1,
    telegraphTurns: 0,
    counters: {},
  },
  zombie_brute: {
    role: 'frontline_breaker',
    targetPolicy: 'frontmost',
    defaultActionId: 'basic_attack',
    specialActionIds: ['slam'],
    hitCount: 1,
    telegraphTurns: 0,
    counters: {},
  },
  raider: {
    role: 'opportunist',
    targetPolicy: 'opportunist',
    defaultActionId: 'basic_attack',
    specialActionIds: [],
    hitCount: 1,
    telegraphTurns: 0,
    counters: {},
  },
  raider_elite: {
    role: 'sniper',
    targetPolicy: 'healer',
    defaultActionId: 'raider_elite_basic_shot',
    specialActionIds: ['aimed_shot'],
    hitCount: 1,
    telegraphTurns: 0,
    counters: {},
  },
  zombie_horde: {
    role: 'swarm',
    targetPolicy: 'frontmost',
    defaultActionId: 'basic_attack',
    specialActionIds: [],
    hitCount: 2,
    telegraphTurns: 0,
    counters: {},
  },
  rabid_dog: {
    role: 'predator',
    targetPolicy: 'lowest_hp',
    defaultActionId: 'basic_attack',
    specialActionIds: [],
    hitCount: 2,
    telegraphTurns: 0,
    counters: {},
  },
  zombie_acid: {
    role: 'predator',
    targetPolicy: 'predator',
    defaultActionId: 'basic_attack',
    specialActionIds: ['acid_lash'],
    hitCount: 1,
    telegraphTurns: 0,
    counters: {},
  },
  zombie_bloater: {
    role: 'timed_bomber',
    targetPolicy: 'frontmost',
    defaultActionId: 'bloater_swipe',
    specialActionIds: [],
    hitCount: 1,
    telegraphTurns: 0,
    counters: { weakness: ['fire', 'explosive'], stunDelays: true },
  },
  zombie_screamer: {
    role: 'summoner',
    targetPolicy: 'frontmost',
    defaultActionId: 'screamer_spit',
    specialActionIds: [],
    hitCount: 1,
    telegraphTurns: 0,
    counters: { quietKill: true, stunDelays: true },
  },
  zombie_charger: {
    role: 'charger',
    targetPolicy: 'frontmost',
    defaultActionId: 'charger_lunge',
    specialActionIds: [],
    hitCount: 1,
    telegraphTurns: 0,
    counters: { stunDelays: true },
  },
};

describe('일반 몬스터 패턴 데이터 계약', () => {
  it('유효한 fixture는 오류 없이 통과한다', () => {
    expect(validateNormalEnemyPatternData(validFixture())).toEqual([]);
  });

  it('patternProfile.targetPolicy가 없으면 명시적 오류를 반환한다', () => {
    const fixture = validFixture();
    delete fixture.enemy_test.patternProfile.targetPolicy;

    expect(validateNormalEnemyPatternData(fixture)).toContain(
      '[normal enemy/enemy_test] patternProfile.targetPolicy is required',
    );
  });

  it('기본 행동 motionKey가 없으면 명시적 오류를 반환한다', () => {
    const fixture = validFixture();
    delete fixture.enemy_test.patternProfile.defaultAction.motionKey;

    expect(validateNormalEnemyPatternData(fixture)).toContain(
      '[normal enemy/enemy_test] patternProfile.defaultAction.motionKey is required',
    );
  });

  it('타겟 정책과 기본 행동 대상 진영이 다르면 오류를 반환한다', () => {
    const fixture = validFixture();
    fixture.enemy_test.patternProfile.defaultAction.target.side = 'enemy';

    expect(validateNormalEnemyPatternData(fixture)).toContain(
      '[normal enemy/enemy_test] patternProfile.targetPolicy must match defaultAction.target.side',
    );
  });

  it('허용되지 않은 timedThreat counter는 명시적 오류를 반환한다', () => {
    const fixture = validFixture();
    fixture.enemy_test.timedThreat.counters.silentSuppress = true;

    expect(validateNormalEnemyPatternData(fixture)).toContain(
      '[normal enemy/enemy_test] timedThreat.counters.silentSuppress is not allowed',
    );
  });

  it('실제 일반 몬스터 로스터 12종이 전술 역할·대상·타격·예고·카운터 표와 일치한다', () => {
    expect(Object.keys(ENEMIES)).toEqual(Object.keys(EXPECTED_PATTERNS));

    for (const [enemyId, expected] of Object.entries(EXPECTED_PATTERNS)) {
      const enemy = ENEMIES[enemyId];
      expect(enemy.patternProfile, enemyId).toMatchObject({
        role: expected.role,
        targetPolicy: expected.targetPolicy,
      });
      expect(enemy.patternProfile.defaultAction, enemyId).toMatchObject({
        actionId: expected.defaultActionId,
        targetPolicy: expected.targetPolicy,
        hitCount: expected.hitCount,
        telegraph: { turns: expected.telegraphTurns },
      });
      expect(enemy.specialSkills.map(action => action.actionId ?? action.id), enemyId)
        .toEqual(expected.specialActionIds);
      expect(enemy.timedThreat?.counters ?? {}, enemyId).toEqual(expected.counters);
    }
  });

  it('12종의 모든 기본·특수·timed threat 행동은 한 객체에 실행 계약을 완성한다', () => {
    for (const [enemyId, enemy] of Object.entries(ENEMIES)) {
      const actions = [
        enemy.patternProfile.defaultAction,
        ...enemy.specialSkills,
        ...(enemy.timedThreat ? [enemy.timedThreat] : []),
      ];

      for (const action of actions) {
        const actionId = action.actionId ?? action.id;
        expect(typeof action.targetPolicy, `${enemyId}/${actionId} targetPolicy`).toBe('string');
        expect(Number.isInteger(action.hitCount), `${enemyId}/${actionId} hitCount`).toBe(true);
        expect(action.telegraph, `${enemyId}/${actionId} telegraph`).toEqual(
          expect.objectContaining({ turns: expect.any(Number) }),
        );
        expect(action.effects?.length, `${enemyId}/${actionId} effects`).toBeGreaterThan(0);
        expect(typeof action.motionKey, `${enemyId}/${actionId} motionKey`).toBe('string');
      }
    }

    expect(validateNormalEnemyPatternData(ENEMIES)).toEqual([]);
  });
});
