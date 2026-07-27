import { describe, expect, it } from 'vitest';
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
});
