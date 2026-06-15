import { describe, expect, it } from 'vitest';
import {
  buildInitiativeQueue,
  canAct,
  nextActionableIndex,
} from '../../js/systems/combat/InitiativeSystem.js';

describe('buildInitiativeQueue', () => {
  it('sorts by speed plus injected initiative roll', () => {
    const combatants = {
      player: { id: 'player', speed: 5, dead: false },
      ally: { id: 'ally', speed: 4, dead: false },
      enemy: { id: 'enemy', speed: 6, dead: false },
    };
    const rolls = [0.5, 0.75, 0];

    expect(buildInitiativeQueue(combatants, () => rolls.shift(), 3)).toEqual([
      { combatantId: 'ally', initiative: 7 },
      { combatantId: 'player', initiative: 7 },
      { combatantId: 'enemy', initiative: 6 },
    ]);
  });

  it('recalculates rolls on every call', () => {
    const combatants = {
      a: { id: 'a', speed: 2 },
      b: { id: 'b', speed: 2 },
    };
    const firstRolls = [0, 0.99];
    const secondRolls = [0.99, 0];

    expect(buildInitiativeQueue(combatants, () => firstRolls.shift(), 3)).toEqual([
      { combatantId: 'b', initiative: 5 },
      { combatantId: 'a', initiative: 2 },
    ]);
    expect(buildInitiativeQueue(combatants, () => secondRolls.shift(), 3)).toEqual([
      { combatantId: 'a', initiative: 5 },
      { combatantId: 'b', initiative: 2 },
    ]);
  });

  it('uses combatant id ascending order for initiative ties', () => {
    const combatants = {
      z: { id: 'zeta', speed: 5 },
      a: { id: 'alpha', speed: 5 },
      m: { id: 'middle', speed: 5 },
    };

    expect(buildInitiativeQueue(combatants, () => 0, 3)).toEqual([
      { combatantId: 'alpha', initiative: 5 },
      { combatantId: 'middle', initiative: 5 },
      { combatantId: 'zeta', initiative: 5 },
    ]);
  });

  it('excludes dead combatants and includes living combatants at deaths door', () => {
    const combatants = {
      dead: { id: 'dead', speed: 99, dead: true },
      deathsDoor: { id: 'deaths-door', speed: 4, deathsDoor: true, dead: false },
    };

    expect(buildInitiativeQueue(combatants, () => 0, 3)).toEqual([
      { combatantId: 'deaths-door', initiative: 4 },
    ]);
  });

  it('ignores malformed combatants and falls back invalid speed to zero', () => {
    const combatants = {
      nullValue: null,
      primitive: 3,
      missingId: { speed: 9 },
      blankId: { id: '   ', speed: 9 },
      dead: { id: 'dead', speed: 9, dead: true },
      missingSpeed: { id: 'missing-speed' },
      nanSpeed: { id: 'nan-speed', speed: Number.NaN },
      infiniteSpeed: { id: 'infinite-speed', speed: Number.POSITIVE_INFINITY },
    };

    expect(buildInitiativeQueue(combatants, () => 0, 3)).toEqual([
      { combatantId: 'infinite-speed', initiative: 0 },
      { combatantId: 'missing-speed', initiative: 0 },
      { combatantId: 'nan-speed', initiative: 0 },
    ]);
    expect(buildInitiativeQueue(null)).toEqual([]);
    expect(buildInitiativeQueue([])).toEqual([]);
  });

  it('clamps random results and normalizes malformed rollMax values', () => {
    const combatants = {
      negative: { id: 'negative', speed: 0 },
      nan: { id: 'nan', speed: 0 },
      one: { id: 'one', speed: 0 },
      infinity: { id: 'infinity', speed: 0 },
    };
    const rolls = [-1, Number.NaN, 1, Number.POSITIVE_INFINITY];

    expect(buildInitiativeQueue(combatants, () => rolls.shift(), 3)).toEqual([
      { combatantId: 'infinity', initiative: 3 },
      { combatantId: 'one', initiative: 3 },
      { combatantId: 'nan', initiative: 0 },
      { combatantId: 'negative', initiative: 0 },
    ]);
    expect(buildInitiativeQueue({ a: { id: 'a', speed: 2 } }, 'invalid', 3)).toEqual([
      { combatantId: 'a', initiative: 2 },
    ]);

    for (const rollMax of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '3']) {
      expect(buildInitiativeQueue({ a: { id: 'a', speed: 2 } }, () => 0.99, rollMax)).toEqual([
        { combatantId: 'a', initiative: 2 },
      ]);
    }
  });

  it('does not mutate the combatants map or its entries', () => {
    const combatants = {
      player: {
        id: 'player',
        speed: 5,
        statusEffects: [{ id: 'focus', effect: { bonus: 1 } }],
      },
    };
    const snapshot = structuredClone(combatants);

    buildInitiativeQueue(combatants, () => 0.5, 3);

    expect(combatants).toEqual(snapshot);
  });
});

describe('canAct', () => {
  it('allows a normal living combatant and deaths door combatant', () => {
    expect(canAct({ id: 'normal', dead: false, statusEffects: [] })).toBe(true);
    expect(canAct({ id: 'door', dead: false, deathsDoor: true })).toBe(true);
  });

  it('rejects null, undefined, and dead combatants', () => {
    expect(canAct(null)).toBe(false);
    expect(canAct(undefined)).toBe(false);
    expect(canAct({ id: 'dead', dead: true })).toBe(false);
  });

  it.each([
    ['array', []],
    ['empty object', {}],
    ['missing id', { dead: false }],
    ['empty id', { id: '' }],
    ['whitespace-only id', { id: '   ' }],
    ['non-string id', { id: 123 }],
    ['non-plain object', Object.assign(new Date(0), { id: 'date' })],
  ])('rejects malformed combatant: %s', (_label, combatant) => {
    expect(canAct(combatant)).toBe(false);
  });

  it('checks trimmed id emptiness without changing the combatant', () => {
    const combatant = { id: ' ready ', dead: false, statusEffects: [] };
    const snapshot = structuredClone(combatant);

    expect(canAct(combatant)).toBe(true);
    expect(combatant).toEqual(snapshot);
  });

  it('rejects skip-turn effects and tolerates malformed statuses', () => {
    expect(canAct({
      id: 'stunned',
      statusEffects: [{ id: 'stun', effect: { skipTurn: true } }],
    })).toBe(false);
    expect(canAct({ id: 'string-status', statusEffects: 'stun' })).toBe(true);
    expect(canAct({ id: 'malformed-status', statusEffects: [null, {}, { effect: null }] })).toBe(true);
  });
});

describe('nextActionableIndex', () => {
  it('skips dead, stunned, missing, and malformed entries', () => {
    const queue = [
      { combatantId: 'current' },
      { combatantId: 'dead' },
      { combatantId: 'stunned' },
      { combatantId: 'missing' },
      null,
      { combatantId: 'ready' },
    ];
    const combatants = {
      current: { id: 'current' },
      dead: { id: 'dead', dead: true },
      stunned: { id: 'stunned', statusEffects: [{ effect: { skipTurn: true } }] },
      ready: { id: 'ready' },
    };

    expect(nextActionableIndex(queue, 0, combatants)).toBe(5);
  });

  it('does not wrap to the start of the queue', () => {
    const queue = [{ combatantId: 'ready' }, { combatantId: 'dead' }];
    const combatants = {
      ready: { id: 'ready' },
      dead: { id: 'dead', dead: true },
    };

    expect(nextActionableIndex(queue, 1, combatants)).toBe(-1);
  });

  it('skips malformed combatant map values and finds the next valid combatant', () => {
    const queue = [
      { combatantId: 'current' },
      { combatantId: 'empty-object' },
      { combatantId: 'array' },
      { combatantId: 'empty-id' },
      { combatantId: 'ready' },
    ];
    const combatants = {
      current: { id: 'current' },
      'empty-object': {},
      array: [],
      'empty-id': { id: '   ' },
      ready: { id: 'ready' },
    };

    expect(nextActionableIndex(queue, 0, combatants)).toBe(4);
  });

  it('returns minus one when all remaining combatant map values are malformed', () => {
    const queue = [
      { combatantId: 'current' },
      { combatantId: 'empty-object' },
      { combatantId: 'array' },
      { combatantId: 'empty-id' },
    ];
    const combatants = {
      current: { id: 'current' },
      'empty-object': {},
      array: [],
      'empty-id': { id: '' },
    };

    expect(nextActionableIndex(queue, 0, combatants)).toBe(-1);
  });

  it('returns minus one for malformed inputs without throwing', () => {
    expect(nextActionableIndex(null, 0, {})).toBe(-1);
    expect(nextActionableIndex([], 0, {})).toBe(-1);
    expect(nextActionableIndex([], '0', {})).toBe(-1);
    expect(nextActionableIndex([], -1, {})).toBe(-1);
    expect(nextActionableIndex([], 0, null)).toBe(-1);
    expect(nextActionableIndex([{ combatantId: 'a' }], 2, { a: { id: 'a' } })).toBe(-1);
  });
});
