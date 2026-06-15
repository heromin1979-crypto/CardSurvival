import { describe, expect, it, vi } from 'vitest';
import BALANCE from '../../js/data/gameBalance.js';
import {
  getRelationshipSkillEffects,
  resolveRelationshipReaction,
} from '../../js/systems/combat/RelationshipCombatSystem.js';

function makeContext(overrides = {}) {
  return {
    actionSequence: 1,
    resolvedRelationshipPhases: new Set(),
    random: () => 0.99,
    getAlliesExcept: () => [
      { id: 'npc_nurse', dead: false },
    ],
    getBond: () => 50,
    applyRelationshipReaction: vi.fn(() => ({ ok: true })),
    ...overrides,
  };
}

function makeEvent(overrides = {}) {
  return {
    actionSequence: 1,
    phase: 'after',
    actorId: 'player',
    targetId: 'enemy:0',
    actionId: 'basic_strike',
    ...overrides,
  };
}

describe('RelationshipCombatSystem', () => {
  it('creates support for high bond allies when the positive chance roll succeeds', () => {
    const context = makeContext({
      random: () => 0,
      getBond: () => 90,
    });
    const event = makeEvent({ phase: 'before' });

    const reaction = resolveRelationshipReaction(context, event);

    expect(reaction).toEqual({
      type: 'support',
      sourceId: 'npc_nurse',
      targetId: 'player',
      phase: 'before',
      effect: {
        type: 'stress',
        value: -BALANCE.combat.relationship.supportStressHeal,
      },
    });
  });

  it('creates interference for low bond allies when the negative chance roll succeeds', () => {
    const context = makeContext({
      random: () => 0,
      getBond: () => 5,
    });

    const reaction = resolveRelationshipReaction(context, makeEvent());

    expect(reaction).toEqual({
      type: 'interfere',
      sourceId: 'npc_nurse',
      targetId: 'player',
      phase: 'after',
      effect: {
        type: 'stress',
        value: BALANCE.combat.relationship.interfereStress,
      },
    });
  });

  it('resolves at most once for the same action sequence and phase', () => {
    const context = makeContext({
      random: () => 0,
      getBond: () => 90,
    });
    const event = makeEvent({ actionSequence: 7, phase: 'before' });

    expect(resolveRelationshipReaction(context, event)?.type).toBe('support');
    expect(resolveRelationshipReaction(context, event)).toBeNull();
    expect(context.applyRelationshipReaction).toHaveBeenCalledOnce();
  });

  it('can resolve before and after phases separately for the same action', () => {
    const context = makeContext({
      random: () => 0,
      getBond: () => 90,
    });

    expect(resolveRelationshipReaction(context, makeEvent({
      actionSequence: 3,
      phase: 'before',
    }))?.phase).toBe('before');
    expect(resolveRelationshipReaction(context, makeEvent({
      actionSequence: 3,
      phase: 'after',
    }))?.phase).toBe('after');
    expect(context.applyRelationshipReaction).toHaveBeenCalledTimes(2);
  });

  it('returns relationship modifier effects for inclusive bond ranges without mutating the skill', () => {
    const skill = {
      id: 'teamwork',
      relationshipModifiers: [
        { minBond: 61, effect: { type: 'stress', value: -1 } },
        { minBond: 31, maxBond: 60, effect: { type: 'accuracy', value: 0.05 } },
        { maxBond: 30, effect: { type: 'stress', value: 1 } },
      ],
    };
    const before = structuredClone(skill);

    expect(getRelationshipSkillEffects(skill, 61)).toEqual([
      { type: 'stress', value: -1 },
    ]);
    expect(getRelationshipSkillEffects(skill, 60)).toEqual([
      { type: 'accuracy', value: 0.05 },
    ]);
    expect(getRelationshipSkillEffects(skill, 30)).toEqual([
      { type: 'stress', value: 1 },
    ]);
    expect(skill).toEqual(before);
  });

  it('tolerates missing or malformed relationship modifier data', () => {
    expect(getRelationshipSkillEffects(null, 80)).toEqual([]);
    expect(getRelationshipSkillEffects({ relationshipModifiers: null }, 80)).toEqual([]);
    expect(getRelationshipSkillEffects({
      relationshipModifiers: [
        null,
        { minBond: Number.NaN, effect: { type: 'stress', value: -1 } },
        { minBond: 61 },
        { maxBond: 30, effect: null },
      ],
    }, 80)).toEqual([]);
  });

  it('does not react for middle bond allies', () => {
    const context = makeContext({
      random: () => 0,
      getBond: () => 45,
    });

    expect(resolveRelationshipReaction(context, makeEvent())).toBeNull();
    expect(context.applyRelationshipReaction).not.toHaveBeenCalled();
  });

  it('ignores dead malformed and actor allies while still checking valid candidates', () => {
    const context = makeContext({
      random: () => 0,
      getAlliesExcept: () => [
        null,
        { id: 'player', dead: false },
        { id: 'npc_dead', dead: true },
        { id: 'npc_zero_hp', hp: 0 },
        { id: 'npc_valid', dead: false },
      ],
      getBond: vi.fn((actorId, allyId) => (allyId === 'npc_valid' ? 100 : 0)),
    });

    const reaction = resolveRelationshipReaction(context, makeEvent());

    expect(reaction).toMatchObject({
      type: 'support',
      sourceId: 'npc_valid',
    });
    expect(context.getBond).toHaveBeenCalledOnce();
    expect(context.getBond).toHaveBeenCalledWith('player', 'npc_valid');
  });

  it.each([
    ['NaN', Number.NaN],
    ['negative', -1],
    ['one', 1],
    ['infinity', Number.POSITIVE_INFINITY],
  ])('treats invalid random roll %s as a safe non-triggering result', (_label, value) => {
    const context = makeContext({
      random: () => value,
      getBond: () => 90,
    });

    expect(resolveRelationshipReaction(context, makeEvent())).toBeNull();
    expect(context.applyRelationshipReaction).not.toHaveBeenCalled();
  });

  it('uses one phase-level roll instead of amplifying chance per ally', () => {
    const random = vi.fn(() => BALANCE.combat.relationship.positiveChance + 0.01);
    const context = makeContext({
      random,
      getAlliesExcept: () => [
        { id: 'npc_nurse', dead: false },
        { id: 'npc_soldier', dead: false },
      ],
      getBond: () => 90,
    });

    expect(resolveRelationshipReaction(context, makeEvent())).toBeNull();
    expect(random).toHaveBeenCalledOnce();
    expect(context.applyRelationshipReaction).not.toHaveBeenCalled();
  });

  it('uses the strongest support and weakest interference candidate deterministically', () => {
    const supportContext = makeContext({
      random: () => 0,
      getAlliesExcept: () => [
        { id: 'npc_low_support', dead: false },
        { id: 'npc_high_support', dead: false },
      ],
      getBond: (_actorId, allyId) => (allyId === 'npc_high_support' ? 95 : 70),
    });
    expect(resolveRelationshipReaction(supportContext, makeEvent()))
      .toMatchObject({ type: 'support', sourceId: 'npc_high_support' });

    const interfereContext = makeContext({
      random: () => 0,
      getAlliesExcept: () => [
        { id: 'npc_low_interfere', dead: false },
        { id: 'npc_lower_interfere', dead: false },
      ],
      getBond: (_actorId, allyId) => (allyId === 'npc_lower_interfere' ? 5 : 25),
    });
    expect(resolveRelationshipReaction(interfereContext, makeEvent()))
      .toMatchObject({ type: 'interfere', sourceId: 'npc_lower_interfere' });
  });

  it('passes the created reaction and original event to the callback', () => {
    const event = makeEvent({ phase: 'before' });
    const context = makeContext({
      random: () => 0,
      getBond: () => 90,
    });

    const reaction = resolveRelationshipReaction(context, event);

    expect(context.applyRelationshipReaction).toHaveBeenCalledWith(reaction, event);
  });

  it('returns null safely when context or event is missing', () => {
    expect(resolveRelationshipReaction(null, makeEvent())).toBeNull();
    expect(resolveRelationshipReaction(makeContext(), null)).toBeNull();
    expect(resolveRelationshipReaction({}, makeEvent())).toBeNull();
  });

  it('returns null and leaves the phase retryable when the reaction callback throws', () => {
    const context = makeContext({
      random: () => 0,
      getBond: () => 90,
      applyRelationshipReaction: vi.fn(() => {
        throw new Error('callback failed');
      }),
    });

    const result = resolveRelationshipReaction(context, makeEvent({
      actionSequence: 4,
      phase: 'after',
    }));

    expect(result).toBeNull();
    expect(context.resolvedRelationshipPhases.has('4:after')).toBe(false);
  });

  it('returns null and leaves the phase retryable when the callback soft-fails', () => {
    const context = makeContext({
      random: () => 0,
      getBond: () => 90,
      applyRelationshipReaction: vi.fn(() => ({ ok: false, reason: 'blocked' })),
    });

    const result = resolveRelationshipReaction(context, makeEvent({
      actionSequence: 5,
      phase: 'after',
    }));

    expect(result).toBeNull();
    expect(context.resolvedRelationshipPhases.has('5:after')).toBe(false);
  });
});
