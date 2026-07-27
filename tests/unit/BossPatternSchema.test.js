import { describe, expect, it } from 'vitest';
import { validateBossPatternSchema } from '../../js/data/validate.js';

const bossFixture = {
  fixture_boss: {
    id: 'fixture_boss',
    isBoss: true,
    bossPattern: {
      basicAttacks: [
        {
          id: 'fixture_jab',
          category: 'basic',
          damage: [4, 6],
          targetPolicy: 'frontmost',
          motionKey: 'fixture_jab',
          impactFx: 'claw',
          movement: 'lunge',
          effects: [],
        },
        {
          id: 'fixture_sweep',
          category: 'basic',
          damage: [3, 5],
          targetPolicy: 'all',
          targetCount: 2,
          motionKey: 'fixture_sweep',
          impactFx: 'slash',
          movement: 'lunge',
          effects: [],
        },
      ],
      specialSkill: {
        id: 'fixture_guard',
        category: 'special',
        cooldown: 4,
        motionKey: 'fixture_guard',
        impactFx: 'buff',
        movement: 'none',
        effects: [{ type: 'selfStatus', id: 'defense_up', duration: 2, value: 0.25 }],
      },
      ultimate: {
        id: 'fixture_end',
        category: 'ultimate',
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
        motionKey: 'fixture_end',
        impactFx: 'blast',
        movement: 'none',
        damage: [10, 14],
        effects: [],
      },
      passives: [],
    },
  },
};

function fixtureWith(mutator) {
  const fixture = structuredClone(bossFixture);
  mutator(fixture.fixture_boss.bossPattern);
  return fixture;
}

function expectSchemaError(fixture) {
  expect(validateBossPatternSchema(fixture)).not.toHaveLength(0);
}

describe('validateBossPatternSchema', () => {
  it('accepts the independent minimal boss fixture', () => {
    expect(validateBossPatternSchema(bossFixture)).toEqual([]);
  });

  it.each([
    ['one attack', pattern => { pattern.basicAttacks.pop(); }],
    ['three attacks', pattern => { pattern.basicAttacks.push(structuredClone(pattern.basicAttacks[0])); }],
  ])('rejects %s in basicAttacks', (_caseName, mutator) => {
    expectSchemaError(fixtureWith(mutator));
  });

  it('rejects the removed normalSkills field', () => {
    expectSchemaError(fixtureWith((pattern) => {
      pattern.normalSkills = [];
    }));
  });

  it('rejects a special skill with the wrong category', () => {
    expectSchemaError(fixtureWith((pattern) => {
      pattern.specialSkill.category = 'basic';
    }));
  });

  it.each([
    ['hpThreshold', 0.5],
    ['telegraphTurns', 2],
    ['oncePerCombat', false],
  ])('rejects an ultimate with wrong %s', (field, value) => {
    expectSchemaError(fixtureWith((pattern) => {
      pattern.ultimate[field] = value;
    }));
  });

  it.each([
    ['id', pattern => { pattern.basicAttacks[0].id = ''; }],
    ['motionKey', pattern => { pattern.specialSkill.motionKey = ''; }],
    ['impactFx', pattern => { pattern.ultimate.impactFx = ''; }],
    ['movement', pattern => { pattern.basicAttacks[1].movement = 'teleport'; }],
  ])('rejects an action with an invalid %s', (_field, mutator) => {
    expectSchemaError(fixtureWith(mutator));
  });

  it('rejects an action whose damage range is reversed', () => {
    expectSchemaError(fixtureWith((pattern) => {
      pattern.basicAttacks[0].damage = [8, 3];
    }));
  });

  it('rejects a non-range damage value without throwing', () => {
    expectSchemaError(fixtureWith((pattern) => {
      pattern.ultimate.damage = 14;
    }));
  });

  it('rejects basic attacks with the same combat identity', () => {
    expectSchemaError(fixtureWith((pattern) => {
      pattern.basicAttacks[1].targetPolicy = 'frontmost';
      pattern.basicAttacks[1].targetCount = 1;
      pattern.basicAttacks[1].effects = [];
      pattern.basicAttacks[1].hitCount = 1;
    }));
  });
});
