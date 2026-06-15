import { describe, expect, it } from 'vitest';
import BALANCE from '../../js/data/gameBalance.js';
import {
  addStress,
  addToken,
  applyDamage,
  consumeToken,
  healCombatant,
  tickStatusEffects,
} from '../../js/systems/combat/CombatStatusSystem.js';

function ally(overrides = {}) {
  return {
    id: 'ally',
    side: 'ally',
    hp: 20,
    maxHp: 20,
    tokens: {},
    stress: 0,
    deathsDoor: false,
    deathResist: BALANCE.combat.deathsDoor.baseResist,
    dead: false,
    statusEffects: [],
    ...overrides,
  };
}

function enemy(overrides = {}) {
  return {
    id: 'enemy',
    side: 'enemy',
    hp: 12,
    maxHp: 12,
    tokens: {},
    dead: false,
    statusEffects: [],
    ...overrides,
  };
}

describe('combat tokens', () => {
  it('adds and consumes token stacks without requiring a pre-existing token bag', () => {
    const target = {};

    expect(addToken(target, 'block', 2.9)).toEqual({
      tokenId: 'block',
      stacks: 2,
      added: 2,
    });
    expect(target.tokens.block).toBe(2);

    expect(consumeToken(target, 'block', 5)).toEqual({
      tokenId: 'block',
      stacks: 0,
      consumed: 2,
    });
    expect(target.tokens.block).toBe(0);
  });

  it('clamps malformed token changes and never creates negative stacks', () => {
    const target = { tokens: { block: -3 } };

    addToken(target, 'block', Number.NaN);
    expect(target.tokens.block).toBe(0);

    consumeToken(target, 'block', 1);
    expect(target.tokens.block).toBe(0);

    addToken(target, 'block', -2);
    expect(target.tokens.block).toBe(0);
  });
});

describe('applyDamage', () => {
  it('consumes one block token and halves incoming damage with ceil', () => {
    const target = enemy({ hp: 10, tokens: { block: 2 } });
    const result = applyDamage(target, 7);

    expect(result).toMatchObject({
      damage: 4,
      blocked: true,
      hpBefore: 10,
      hpAfter: 6,
      dead: false,
    });
    expect(target.hp).toBe(6);
    expect(target.tokens.block).toBe(1);
  });

  it('normalizes malformed damage to zero', () => {
    const target = enemy({ hp: 5, tokens: { block: 1 } });
    const result = applyDamage(target, Number.POSITIVE_INFINITY);

    expect(result).toMatchObject({
      damage: 0,
      blocked: false,
    });
    expect(target.hp).toBe(5);
    expect(target.dead).toBe(false);
    expect(target.tokens.block).toBe(1);
  });

  it('kills non-ally targets immediately at zero HP', () => {
    const target = enemy({ hp: 5 });
    const result = applyDamage(target, 6);

    expect(result).toMatchObject({
      hpAfter: 0,
      dead: true,
      deathsDoorEntered: false,
    });
    expect(target.dead).toBe(true);
  });

  it('puts allies into deaths door on first hp-to-zero damage', () => {
    const target = ally({ hp: 5 });
    const result = applyDamage(target, 10);

    expect(result).toMatchObject({
      hpAfter: 0,
      deathsDoorEntered: true,
      deathResistCheck: false,
      dead: false,
    });
    expect(target.deathsDoor).toBe(true);
    expect(target.dead).toBe(false);
  });

  it('checks deaths door resist on later damage and decays to the minimum on success', () => {
    const target = ally({
      hp: 0,
      deathsDoor: true,
      deathResist: 0.12,
    });

    const first = applyDamage(target, 1, () => 0.10);
    expect(first).toMatchObject({
      deathResistCheck: true,
      deathResistSuccess: true,
      deathResistBefore: 0.12,
      deathResistAfter: 0.05,
      dead: false,
    });
    expect(target.deathResist).toBe(BALANCE.combat.deathsDoor.minimumResist);

    const second = applyDamage(target, 1, () => 0.01);
    expect(second.deathResistSuccess).toBe(true);
    expect(target.deathResist).toBe(BALANCE.combat.deathsDoor.minimumResist);
  });

  it('kills allies at deaths door when the death resist roll fails', () => {
    const target = ally({
      hp: 0,
      deathsDoor: true,
      deathResist: 0.5,
    });
    const result = applyDamage(target, 1, () => 0.9);

    expect(result).toMatchObject({
      deathResistCheck: true,
      deathResistSuccess: false,
      dead: true,
    });
    expect(target.dead).toBe(true);
  });
});

describe('healCombatant', () => {
  it('does not heal dead targets', () => {
    const target = ally({ hp: 0, dead: true, deathsDoor: true });
    const result = healCombatant(target, 10);

    expect(result).toMatchObject({ healed: 0, hpAfter: 0, dead: true });
    expect(target.hp).toBe(0);
    expect(target.deathsDoor).toBe(true);
  });

  it('heals living targets up to max HP and clears deaths door above zero', () => {
    const target = ally({ hp: 0, maxHp: 8, deathsDoor: true });
    const result = healCombatant(target, 0.25);

    expect(result).toMatchObject({
      healed: 1,
      hpBefore: 0,
      hpAfter: 1,
      deathsDoorCleared: true,
    });
    expect(target.hp).toBe(1);
    expect(target.deathsDoor).toBe(false);

    healCombatant(target, 99);
    expect(target.hp).toBe(8);
  });
});

describe('addStress', () => {
  it('resolves at 10 stress and adds strength', () => {
    const target = ally({ stress: 9, tokens: {} });
    const result = addStress(target, 1, () => 0.05);

    expect(result).toMatchObject({
      threshold: true,
      resolved: true,
      meltdown: false,
      tokenId: 'strength',
      stressAfter: BALANCE.combat.stress.afterResolve,
    });
    expect(target.stress).toBe(BALANCE.combat.stress.afterResolve);
    expect(target.tokens.strength).toBe(1);
  });

  it('melts down at 10 stress and adds vulnerable', () => {
    const target = ally({ stress: 8, tokens: {} });
    const result = addStress(target, 5, () => 0.5);

    expect(result).toMatchObject({
      threshold: true,
      resolved: false,
      meltdown: true,
      tokenId: 'vulnerable',
      stressAfter: BALANCE.combat.stress.afterMeltdown,
    });
    expect(target.stress).toBe(BALANCE.combat.stress.afterMeltdown);
    expect(target.tokens.vulnerable).toBe(1);
  });

  it('supports stress decreases without rolling threshold checks', () => {
    const target = ally({ stress: 9 });
    const result = addStress(target, -3, () => {
      throw new Error('random should not be called');
    });

    expect(result).toMatchObject({
      stressBefore: 9,
      stressAfter: 6,
      threshold: false,
      resolved: false,
      meltdown: false,
    });
    expect(target.stress).toBe(6);
    expect(target.tokens).toEqual({});
  });
});

describe('tickStatusEffects', () => {
  it('ticks legacy hpLossPerRound damage and decrements finite durations', () => {
    const target = enemy({
      hp: 10,
      statusEffects: [
        { id: 'bleed', duration: 2, effect: { hpLossPerRound: 3 } },
      ],
    });

    const events = tickStatusEffects(target);

    expect(events).toEqual([
      expect.objectContaining({
        statusId: 'bleed',
        damage: 3,
        hpBefore: 10,
        hpAfter: 7,
        dead: false,
        expired: false,
      }),
    ]);
    expect(target.statusEffects).toEqual([
      { id: 'bleed', duration: 1, effect: { hpLossPerRound: 3 } },
    ]);
  });

  it('ticks negative hpPerRound damage and drops expired statuses', () => {
    const target = enemy({
      hp: 10,
      statusEffects: [
        { id: 'burn', duration: 1, effect: { hpPerRound: -4 } },
      ],
    });

    const events = tickStatusEffects(target);

    expect(events).toEqual([
      expect.objectContaining({
        statusId: 'burn',
        damage: 4,
        hpBefore: 10,
        hpAfter: 6,
        expired: true,
      }),
    ]);
    expect(target.statusEffects).toEqual([]);
  });

  it('keeps permanent statuses when duration is absent or null', () => {
    const target = enemy({
      hp: 10,
      statusEffects: [
        { id: 'poison_aura', duration: null, effect: { hpLossPerRound: 2 } },
        { id: 'marked', effect: { accuracyPenalty: 0.2 } },
      ],
    });

    const events = tickStatusEffects(target);

    expect(events).toEqual([
      expect.objectContaining({ statusId: 'poison_aura', damage: 2, expired: false }),
      expect.objectContaining({ statusId: 'marked', damage: 0, expired: false }),
    ]);
    expect(target.hp).toBe(8);
    expect(target.statusEffects).toEqual([
      { id: 'poison_aura', duration: null, effect: { hpLossPerRound: 2 } },
      { id: 'marked', effect: { accuracyPenalty: 0.2 } },
    ]);
  });

  it('applies periodic damage through applyDamage and returns death fields', () => {
    const target = enemy({
      hp: 3,
      tokens: { block: 1 },
      statusEffects: [
        { id: 'acid', duration: 1, effect: { hpLossPerRound: 5 } },
      ],
    });

    const events = tickStatusEffects(target);

    expect(events).toEqual([
      expect.objectContaining({
        statusId: 'acid',
        rawDamage: 5,
        damage: 3,
        blocked: true,
        hpBefore: 3,
        hpAfter: 0,
        dead: true,
        expired: true,
      }),
    ]);
    expect(target.tokens.block).toBe(0);
    expect(target.dead).toBe(true);
  });

  it('stops ticking later statuses once the target dies', () => {
    const target = enemy({
      hp: 2,
      statusEffects: [
        { id: 'bleed', duration: 2, effect: { hpLossPerRound: 3 } },
        { id: 'burn', duration: 2, effect: { hpLossPerRound: 3 } },
        { id: 'expired', duration: 0, effect: { hpLossPerRound: 99 } },
        { duration: 2, effect: { hpLossPerRound: 99 } },
        null,
      ],
    });

    const events = tickStatusEffects(target);

    expect(events).toEqual([
      expect.objectContaining({
        statusId: 'bleed',
        damage: 3,
        dead: true,
        expired: false,
      }),
    ]);
    expect(target.statusEffects).toEqual([
      { id: 'bleed', duration: 1, effect: { hpLossPerRound: 3 } },
      { id: 'burn', duration: 2, effect: { hpLossPerRound: 3 } },
    ]);
  });
});
