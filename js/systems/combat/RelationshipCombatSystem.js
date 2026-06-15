import BALANCE from '../../data/gameBalance.js';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!isObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]),
  );
}

function normalizeBound(value) {
  return Number.isFinite(value) ? value : null;
}

function normalizeBond(value) {
  if (!Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, value));
}

function normalizeRoll(value) {
  if (!Number.isFinite(value)) return null;
  return Math.min(1 - Number.EPSILON, Math.max(0, value));
}

function readRoll(context) {
  const random = typeof context?.random === 'function' ? context.random : Math.random;
  try {
    return normalizeRoll(random());
  } catch {
    return null;
  }
}

function isAliveCandidate(ally, actorId) {
  if (!isObject(ally)) return false;
  if (typeof ally.id !== 'string' || ally.id.length === 0) return false;
  if (ally.id === actorId) return false;
  if (ally.dead === true || ally.isDead === true) return false;

  const hp = Number.isFinite(ally.currentHp) ? ally.currentHp : ally.hp;
  if (Number.isFinite(hp) && hp <= 0) return false;

  return true;
}

function phaseKey(context, event) {
  const sequence = event.actionSequence ?? context.actionSequence;
  if (
    !['before', 'after'].includes(event.phase)
    || (typeof sequence !== 'string' && !Number.isFinite(sequence))
  ) {
    return null;
  }
  return `${sequence}:${event.phase}`;
}

function makeReaction(type, allyId, actorId, phase) {
  const relationship = BALANCE.combat.relationship;
  return {
    type,
    sourceId: allyId,
    targetId: actorId,
    phase,
    effect: {
      type: 'stress',
      value: type === 'support'
        ? -relationship.supportStressHeal
        : relationship.interfereStress,
    },
  };
}

export function getRelationshipSkillEffects(skill, bond) {
  if (!isObject(skill) || !Array.isArray(skill.relationshipModifiers)) {
    return [];
  }

  const normalizedBond = normalizeBond(bond);
  if (normalizedBond === null) return [];

  const effects = [];
  for (const modifier of skill.relationshipModifiers) {
    if (!isObject(modifier) || !isObject(modifier.effect)) continue;

    const hasMin = Object.hasOwn(modifier, 'minBond');
    const hasMax = Object.hasOwn(modifier, 'maxBond');
    const minBond = hasMin ? normalizeBound(modifier.minBond) : null;
    const maxBond = hasMax ? normalizeBound(modifier.maxBond) : null;

    if ((hasMin && minBond === null) || (hasMax && maxBond === null)) continue;
    if (minBond !== null && normalizedBond < minBond) continue;
    if (maxBond !== null && normalizedBond > maxBond) continue;

    effects.push(cloneValue(modifier.effect));
  }

  return effects;
}

export function resolveRelationshipReaction(context, event) {
  if (!isObject(context) || !isObject(event)) return null;
  if (typeof event.actorId !== 'string' || event.actorId.length === 0) return null;
  if (typeof context.getAlliesExcept !== 'function') return null;
  if (typeof context.getBond !== 'function') return null;

  const key = phaseKey(context, event);
  if (key === null) return null;

  if (!(context.resolvedRelationshipPhases instanceof Set)) {
    context.resolvedRelationshipPhases = new Set();
  }
  if (context.resolvedRelationshipPhases.has(key)) return null;
  context.resolvedRelationshipPhases.add(key);

  let allies;
  try {
    allies = context.getAlliesExcept(event.actorId);
  } catch {
    return null;
  }
  if (!Array.isArray(allies)) return null;

  for (const ally of allies) {
    if (!isAliveCandidate(ally, event.actorId)) continue;

    let bond;
    try {
      bond = normalizeBond(context.getBond(event.actorId, ally.id));
    } catch {
      bond = null;
    }
    if (bond === null) continue;

    let reactionType = null;
    let chance = 0;
    if (bond >= 61) {
      reactionType = 'support';
      chance = BALANCE.combat.relationship.positiveChance;
    } else if (bond <= 30) {
      reactionType = 'interfere';
      chance = BALANCE.combat.relationship.negativeChance;
    } else {
      continue;
    }

    const roll = readRoll(context);
    if (roll === null || roll >= chance) continue;

    const reaction = makeReaction(
      reactionType,
      ally.id,
      event.actorId,
      event.phase,
    );

    if (typeof context.applyRelationshipReaction === 'function') {
      try {
        const result = context.applyRelationshipReaction(reaction, event);
        if (result?.ok === false) {
          return {
            ok: false,
            reason: result.reason ?? 'relationship_callback_error',
          };
        }
      } catch {
        return {
          ok: false,
          reason: 'relationship_callback_error',
        };
      }
    }

    return reaction;
  }

  return null;
}
