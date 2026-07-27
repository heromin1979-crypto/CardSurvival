import { COMPANION_TACTICS } from '../../data/companionTactics.js';

export const COMPANION_STANCE_ROLES = {
  attack: ['damage'],
  heal: ['heal', 'guard', 'damage'],
  support: ['control', 'support', 'guard', 'damage'],
  hold: ['guard'],
};

export const COMPANION_TACTIC_WHEN = Object.freeze([
  'ally_below_60',
  'ally_stress_6_plus',
]);

const SATURATION_IDS = new Set([
  'block',
  'focus',
  'marked',
  'vulnerable',
  'rooted',
]);

function effectsOf(skill) {
  return Array.isArray(skill?.effects) ? skill.effects : [];
}

function hasEffect(skill, type) {
  return effectsOf(skill).some(effect => effect?.type === type);
}

export function getCompanionSkillRole(skill) {
  const declaredRole = skill?.tacticalRole;
  if (['food', 'ration'].includes(declaredRole)) return 'support';
  if (['damage', 'heal', 'guard', 'control', 'support'].includes(declaredRole)) {
    return declaredRole;
  }

  if (hasEffect(skill, 'heal')) return 'heal';
  if (hasEffect(skill, 'guard')) return 'guard';
  if (hasEffect(skill, 'damage')) return 'damage';

  const targetsEnemy = skill?.target?.side === 'enemy';
  if (effectsOf(skill).some(effect => (
    effect?.type === 'status'
    || effect?.type === 'token'
    || effect?.type === 'stress'
  ))) {
    return targetsEnemy ? 'control' : 'support';
  }
  if (effectsOf(skill).some(effect => effect?.type === 'move')) {
    return 'support';
  }

  return null;
}

function combatantHp(combatant) {
  const value = combatant?.hp?.current ?? combatant?.hp ?? combatant?.currentHp;
  return Number.isFinite(value) ? value : null;
}

function combatantMaxHp(combatant) {
  const value = combatant?.hp?.max ?? combatant?.maxHp;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function isAlive(combatant) {
  const hp = combatantHp(combatant);
  return (
    combatant
    && typeof combatant === 'object'
    && typeof combatant.id === 'string'
    && combatant.dead !== true
    && combatant.isDead !== true
    && (hp === null || hp > 0)
  );
}

function hpRatio(combatant) {
  const hp = combatantHp(combatant);
  return hp === null ? 1 : hp / combatantMaxHp(combatant);
}

function priorityConditionMatches(condition, allies) {
  const livingAllies = allies.filter(isAlive);
  if (condition === undefined) return true;
  if (condition === 'ally_below_60') {
    return livingAllies.some(ally => hpRatio(ally) < 0.6);
  }
  if (condition === 'ally_stress_6_plus') {
    return livingAllies.some(ally => (
      Number.isFinite(ally?.stress) && ally.stress >= 6
    ));
  }
  return false;
}

function orderedRoles(tactic, stance, allies) {
  const prioritized = [];
  const skipped = new Set();
  const holdOnly = stance === 'hold';

  for (const priority of tactic?.priorities ?? []) {
    const role = priority?.role;
    if (!role || (holdOnly && role !== 'guard')) continue;
    if (!priorityConditionMatches(priority.when, allies)) {
      skipped.add(role);
      continue;
    }
    if (!prioritized.includes(role)) prioritized.push(role);
  }

  for (const role of COMPANION_STANCE_ROLES[stance]) {
    if (!skipped.has(role) && !prioritized.includes(role)) {
      prioritized.push(role);
    }
  }
  return prioritized;
}

function tokenStacks(target, tokenId) {
  const value = target?.tokens?.[tokenId];
  return Number.isFinite(value) ? value : 0;
}

function hasStatus(target, statusId) {
  return (target?.statusEffects ?? []).some(status => (
    status?.id === statusId
    && (status.duration === undefined || status.duration > 0)
  ));
}

function repeatedEffectIds(skill) {
  const ids = [];
  for (const effect of effectsOf(skill)) {
    if (effect?.type === 'guard') ids.push('block');
    if (effect?.type === 'token' && SATURATION_IDS.has(effect.token)) {
      ids.push(effect.token);
    }
    if (effect?.type === 'status' && SATURATION_IDS.has(effect.status?.id)) {
      ids.push(effect.status.id);
    }
  }
  return ids;
}

function isSaturated(target, skill) {
  return repeatedEffectIds(skill).some(effectId => (
    tokenStacks(target, effectId) > 0 || hasStatus(target, effectId)
  ));
}

function canUseSkill(canUse, skill, target) {
  if (typeof canUse !== 'function') return true;
  try {
    return canUse(skill, target) === true;
  } catch {
    return false;
  }
}

function candidatesFor(skill, npcId, allies, enemies) {
  const source = skill?.target?.side === 'enemy' ? enemies : allies;
  const living = source.filter(isAlive);
  if (skill?.target?.selfOnly === true) {
    return living.filter(candidate => candidate.id === npcId);
  }
  return living;
}

function reasonFor(role, skill, target, npcId) {
  if (role === 'heal') return 'lowest_hp_ally';
  if (role === 'damage') return 'lowest_hp_enemy';
  if (role === 'control') return 'control_enemy';
  if (role === 'guard') {
    return target.id === npcId ? 'self_guard' : 'protect_ally';
  }
  if (skill?.target?.side === 'enemy') return 'control_enemy';
  return 'support_ally';
}

function orderedTargets(role, skill, candidates) {
  let eligible = candidates.filter(target => !isSaturated(target, skill));
  if (role === 'heal') {
    eligible = eligible.filter(target => hpRatio(target) < 1);
  }

  if (
    role === 'support'
    && effectsOf(skill).some(effect => effect?.type === 'stress' && effect.value < 0)
  ) {
    return eligible.sort((a, b) => (b.stress ?? 0) - (a.stress ?? 0));
  }

  return eligible.sort((a, b) => hpRatio(a) - hpRatio(b));
}

function skillCanServeRole(skill, role) {
  if (getCompanionSkillRole(skill) !== role) return false;
  if (role === 'heal') {
    return (
      hasEffect(skill, 'heal')
      && !['food', 'ration'].includes(skill?.tacticalRole)
    );
  }
  if (role === 'guard') return hasEffect(skill, 'guard');
  if (role === 'damage') return hasEffect(skill, 'damage');
  return true;
}

export function planCompanionTurn(input = {}) {
  const {
    npcId,
    skills = [],
    allies = [],
    enemies = [],
    canUse,
  } = input;
  const tactic = COMPANION_TACTICS[npcId];
  const stance = input.stance ?? tactic?.preferredStance;

  if (!tactic || stance === 'manual' || !COMPANION_STANCE_ROLES[stance]) {
    return null;
  }

  for (const role of orderedRoles(tactic, stance, allies)) {
    for (const skill of skills) {
      if (
        !skill
        || typeof skill.id !== 'string'
        || !skillCanServeRole(skill, role)
      ) {
        continue;
      }

      const targets = orderedTargets(
        role,
        skill,
        candidatesFor(skill, npcId, allies, enemies),
      );
      const target = targets.find(candidate => canUseSkill(canUse, skill, candidate));
      if (!target) continue;

      return {
        skillId: skill.id,
        targetId: target.id,
        reason: reasonFor(role, skill, target, npcId),
      };
    }
  }

  return null;
}
