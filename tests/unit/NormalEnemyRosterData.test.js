import { describe, expect, it } from 'vitest';
import ENEMIES from '../../js/data/enemies.js';
import { validateNormalEnemyPatternData } from '../../js/data/validate.js';

const EXPECTED_NORMAL_ENEMY_IDS = [
  'zombie_patient_dormant',
  'zombie_common',
  'zombie_runner',
  'zombie_brute',
  'raider',
  'raider_elite',
  'zombie_horde',
  'rabid_dog',
  'zombie_acid',
  'zombie_bloater',
  'zombie_screamer',
  'zombie_charger',
];

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

const EXPECTED_ACTION_CONTRACTS = {
  zombie_patient_dormant: [
    ['default', 'basic_attack', 'player', 1, { turns: 0 }, [['damage', [10, 16]]], 'basic_attack', {}],
    ['special', 'startled_lunge', 'player', 1, { turns: 0 }, [['damage', [10, 16]]], 'startled_lunge', {}],
  ],
  zombie_common: [
    ['default', 'basic_attack', 'frontmost', 1, { turns: 0 }, [['damage', [8, 15]]], 'basic_attack', {}],
  ],
  zombie_runner: [
    ['default', 'basic_attack', 'lowest_hp', 1, { turns: 0 }, [['damage', [12, 20]]], 'basic_attack', {}],
    ['special', 'runner_rush', 'lowest_hp', 2, { turns: 1, moveEvadeChance: 1 }, [['damage', [12, 18]]], 'runner_rush', {}],
  ],
  zombie_brute: [
    ['default', 'basic_attack', 'frontmost', 1, { turns: 0 }, [['damage', [20, 35]]], 'basic_attack', {}],
    ['special', 'slam', 'frontmost', 1, { turns: 1, moveEvadeChance: 1, blockNegatesStun: true }, [
      ['damage', [30, 45]],
      ['move', 1],
    ], 'slam', {}],
  ],
  raider: [
    ['default', 'basic_attack', 'opportunist', 1, { turns: 0 }, [['damage', [14, 22]]], 'basic_attack', {}],
  ],
  raider_elite: [
    ['default', 'raider_elite_basic_shot', 'healer', 1, { turns: 0 }, [['damage', [18, 28]]], 'basic_attack', {}],
    ['special', 'aimed_shot', 'healer', 1, { turns: 1, moveEvadeChance: 0.7, cancelOnHit: true }, [['damage', [25, 40]]], 'aimed_shot', {}],
  ],
  zombie_horde: [
    ['default', 'basic_attack', 'frontmost', 2, { turns: 0 }, [['damage', [6, 12]]], 'basic_attack', {}],
  ],
  rabid_dog: [
    ['default', 'basic_attack', 'lowest_hp', 2, { turns: 0 }, [['damage', [8, 14]]], 'basic_attack', {}],
  ],
  zombie_acid: [
    ['default', 'basic_attack', 'predator', 1, { turns: 0 }, [['damage', [8, 14]]], 'basic_attack', {}],
    ['special', 'acid_lash', 'predator', 1, { turns: 0 }, [
      ['damage', [6, 10]],
      ['move', -2],
    ], 'acid_lash', {}],
  ],
  zombie_bloater: [
    ['default', 'bloater_swipe', 'frontmost', 1, { turns: 0 }, [['damage', [4, 8]]], 'basic_attack', {}],
    ['timed', 'self_destruct', 'all', 1, { turns: 3 }, [
      ['damage', [25, 40]],
      ['status', 'infection', 15],
    ], 'self_destruct', { weakness: ['fire', 'explosive'], stunDelays: true }],
  ],
  zombie_screamer: [
    ['default', 'screamer_spit', 'frontmost', 1, { turns: 0 }, [['damage', [5, 9]]], 'basic_attack', {}],
    ['timed', 'summon_horde', 'frontmost', 1, { turns: 3 }, [
      ['damage', [0, 0]],
      ['summon', 'zombie_common', [1, 2]],
      ['noise', 25],
    ], 'summon_horde', { quietKill: true, stunDelays: true }],
  ],
  zombie_charger: [
    ['default', 'charger_lunge', 'frontmost', 1, { turns: 0 }, [['damage', [6, 10]]], 'basic_attack', {}],
    ['timed', 'charge_strike', 'frontmost', 1, { turns: 1 }, [
      ['damage', [30, 45]],
      ['status', 'stun', 1],
      ['move', 1],
    ], 'charge_strike', { stunDelays: true }],
  ],
};

function effectCore(effect) {
  if (effect.type === 'damage') return ['damage', effect.value];
  if (effect.type === 'move') return ['move', effect.distance];
  if (effect.type === 'status') return ['status', effect.id, effect.value ?? effect.duration];
  if (effect.type === 'summon') return ['summon', effect.enemyId, effect.count];
  if (effect.type === 'noise') return ['noise', effect.value];
  return [effect.type];
}

describe('실제 일반 몬스터 roster 완전성', () => {
  it('일반 몬스터 12종의 ID가 정확히 일치한다', () => {
    expect(Object.keys(ENEMIES)).toEqual(EXPECTED_NORMAL_ENEMY_IDS);
  });

  it('실제 roster 전체가 패턴 스키마를 통과한다', () => {
    expect(validateNormalEnemyPatternData(ENEMIES)).toEqual([]);
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
  });

  it('12종의 모든 기본·특수·timed threat 행동 계약이 정확한 테이블과 일치한다', () => {
    const actual = Object.fromEntries(Object.entries(ENEMIES).map(([enemyId, enemy]) => [
      enemyId,
      [
        ['default', enemy.patternProfile.defaultAction],
        ...(enemy.specialSkills ?? []).map(action => ['special', action]),
        ...(enemy.timedThreat ? [['timed', enemy.timedThreat]] : []),
      ].map(([kind, action]) => [
        kind,
        action.actionId ?? action.id,
        action.targetPolicy,
        action.hitCount,
        action.telegraph,
        action.effects.map(effectCore),
        action.motionKey,
        action.counters ?? {},
      ]),
    ]));

    expect(actual).toEqual(EXPECTED_ACTION_CONTRACTS);
  });
});
