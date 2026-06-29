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
  if (!Number.isFinite(value) || value < 0 || value >= 1) return null;
  return value;
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

function compareSupportCandidate(a, b) {
  return b.bond - a.bond || a.ally.id.localeCompare(b.ally.id);
}

function compareInterfereCandidate(a, b) {
  return a.bond - b.bond || a.ally.id.localeCompare(b.ally.id);
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

  let allies;
  try {
    allies = context.getAlliesExcept(event.actorId);
  } catch {
    return null;
  }
  if (!Array.isArray(allies)) return null;

  const supportCandidates = [];
  const interfereCandidates = [];
  for (const ally of allies) {
    if (!isAliveCandidate(ally, event.actorId)) continue;

    let bond;
    try {
      bond = normalizeBond(context.getBond(event.actorId, ally.id));
    } catch {
      bond = null;
    }
    if (bond === null) continue;

    if (bond >= 61) {
      supportCandidates.push({ ally, bond });
    } else if (bond <= 30) {
      interfereCandidates.push({ ally, bond });
    }
  }

  context.resolvedRelationshipPhases.add(key);

  const positiveChance = supportCandidates.length > 0
    ? BALANCE.combat.relationship.positiveChance
    : 0;
  const negativeChance = interfereCandidates.length > 0
    ? BALANCE.combat.relationship.negativeChance
    : 0;
  if (positiveChance <= 0 && negativeChance <= 0) return null;

  const roll = readRoll(context);
  if (roll === null) return null;

  let reactionType = null;
  let candidate = null;
  if (roll < positiveChance) {
    reactionType = 'support';
    candidate = [...supportCandidates].sort(compareSupportCandidate)[0];
  } else if (roll < positiveChance + negativeChance) {
    reactionType = 'interfere';
    candidate = [...interfereCandidates].sort(compareInterfereCandidate)[0];
  }

  if (!reactionType || !candidate) return null;

  const reaction = makeReaction(
    reactionType,
    candidate.ally.id,
    event.actorId,
    event.phase,
  );

  if (typeof context.applyRelationshipReaction === 'function') {
    try {
      const result = context.applyRelationshipReaction(reaction, event);
      if (result?.ok === false) {
        context.resolvedRelationshipPhases.delete(key);
        return null;
      }
    } catch {
      context.resolvedRelationshipPhases.delete(key);
      return null;
    }
  }

  return reaction;
}
