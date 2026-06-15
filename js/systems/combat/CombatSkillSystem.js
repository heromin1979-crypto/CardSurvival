import {
  CHARACTER_COMBAT_LOADOUTS,
  COMMON_COMBAT_LOADOUT,
  COMPANION_COMBAT_LOADOUTS,
  getCombatSkill,
} from '../../data/combatSkills.js';

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]),
  );
}

function clamp(value, minimum, maximum, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function nonnegative(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function isPlainObject(value) {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
  );
}

function asObject(value) {
  return value !== null && typeof value === 'object' ? value : null;
}

function commandFailure(reason) {
  return { ok: false, reason };
}

function lookupById(collection, id) {
  if (typeof id !== 'string' || id.length === 0) return null;
  if (!collection) return null;

  if (collection instanceof Map) {
    return collection.get(id) ?? null;
  }
  if (Array.isArray(collection)) {
    return collection.find((entry) => entry?.id === id) ?? null;
  }
  if (typeof collection === 'object') {
    return Object.hasOwn(collection, id) ? collection[id] : null;
  }

  return null;
}

function combatantHp(combatant) {
  if (Number.isFinite(combatant?.currentHp)) return combatant.currentHp;
  if (Number.isFinite(combatant?.hp)) return combatant.hp;
  if (Number.isFinite(combatant?.hp?.current)) return combatant.hp.current;
  return null;
}

function isDeadCombatant(combatant, { allowDeathsDoor = false } = {}) {
  if (!combatant || typeof combatant !== 'object') return true;
  if (combatant.dead === true || combatant.isDead === true) return true;

  const hp = combatantHp(combatant);
  if (hp !== null && hp <= 0) {
    return !(allowDeathsDoor && combatant.deathsDoor === true);
  }

  return false;
}

function positiveCost(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function availableFrom(callback, fallbackArgs) {
  if (typeof callback !== 'function') return 0;
  try {
    const value = callback(...fallbackArgs);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function normalizeAccuracy(value) {
  if (!Number.isFinite(value)) return 0.7;
  return Math.min(1, Math.max(0, value));
}

function normalizeRoll(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeDamage(damage) {
  if (
    Array.isArray(damage)
    && damage.length === 2
    && damage.every(Number.isFinite)
    && damage[0] <= damage[1]
  ) {
    return [...damage];
  }
  return [1, 2];
}

export function buildEquipmentSkill(instanceId, definition) {
  if (
    typeof instanceId !== 'string'
    || instanceId.length === 0
    || !definition
    || typeof definition !== 'object'
    || Array.isArray(definition)
    || !definition.combat
    || typeof definition.combat !== 'object'
    || Array.isArray(definition.combat)
  ) {
    return null;
  }

  const combat = definition.combat;
  const ammoId = typeof combat.requiresAmmo === 'string'
    && combat.requiresAmmo.length > 0
    ? combat.requiresAmmo
    : null;
  const ranged = ammoId !== null;
  const effects = [{
    type: 'damage',
    value: normalizeDamage(combat.damage),
  }];

  if (isPlainObject(combat.statusInflict)) {
    effects.push({
      type: 'status',
      status: cloneValue(combat.statusInflict),
    });
  }

  return {
    id: `equipment:${instanceId}`,
    nameKey: null,
    fallbackName: definition.name ?? definition.id ?? instanceId,
    icon: typeof definition.icon === 'string' && definition.icon.length > 0
      ? definition.icon
      : 'weapon',
    source: 'equipment',
    equipmentInstanceId: instanceId,
    usableFrom: ranged ? [2, 3, 4] : [1, 2],
    target: {
      side: 'enemy',
      ranks: ranged ? [1, 2, 3, 4] : [1, 2],
      count: Number.isInteger(definition.multiTarget)
        && definition.multiTarget > 0
        ? definition.multiTarget
        : 1,
    },
    costs: {
      ammo: ammoId,
      durability: nonnegative(combat.durabilityLoss),
      noise: nonnegative(combat.noiseOnUse),
    },
    accuracy: clamp(combat.accuracy, 0, 1, 0.7),
    critChance: clamp(combat.critChance, 0, 1, 0),
    critMultiplier: Number.isFinite(combat.critMultiplier)
      && combat.critMultiplier > 0
      ? combat.critMultiplier
      : 1.5,
    effects,
  };
}

function getCharacterSkillIds(combatant, gs) {
  if (combatant?.sourceType === 'player') {
    const characterId = gs?.player?.characterId;
    return Object.hasOwn(CHARACTER_COMBAT_LOADOUTS, characterId)
      ? CHARACTER_COMBAT_LOADOUTS[characterId]
      : COMMON_COMBAT_LOADOUT;
  }
  if (combatant?.sourceType === 'companion') {
    return Object.hasOwn(COMPANION_COMBAT_LOADOUTS, combatant.sourceId)
      ? COMPANION_COMBAT_LOADOUTS[combatant.sourceId]
      : COMMON_COMBAT_LOADOUT;
  }
  return COMMON_COMBAT_LOADOUT;
}

function getEquipmentIds(combatant, gs) {
  if (combatant?.sourceType === 'player') {
    return [
      gs?.player?.equipped?.weapon_main,
      gs?.player?.equipped?.weapon_sub,
    ];
  }
  if (combatant?.sourceType === 'companion') {
    const state = gs?.npcs?.states?.[combatant.sourceId];
    return [state?.equippedWeapon, state?.equippedTool];
  }
  return [];
}

export function buildAllyLoadout(combatant, gs) {
  const characterSkills = getCharacterSkillIds(combatant, gs)
    .map(getCombatSkill)
    .filter(Boolean)
    .map(cloneValue);

  if (typeof gs?.getCardDef !== 'function') return characterSkills;

  const equipmentSkills = [];
  const seen = new Set();
  for (const instanceId of getEquipmentIds(combatant, gs)) {
    if (
      equipmentSkills.length >= 2
      || typeof instanceId !== 'string'
      || instanceId.length === 0
      || seen.has(instanceId)
    ) {
      continue;
    }
    seen.add(instanceId);

    try {
      const skill = buildEquipmentSkill(
        instanceId,
        gs.getCardDef(instanceId),
      );
      if (skill) equipmentSkills.push(skill);
    } catch {
      continue;
    }
  }

  return [...characterSkills, ...equipmentSkills];
}

export function validateSkillCommand(context, command) {
  const ctx = asObject(context);
  const cmd = asObject(command);
  if (
    !ctx
    || !cmd
    || !ctx.combatants
    || !ctx.skillsById
    || typeof cmd.actorId !== 'string'
    || cmd.actorId.length === 0
    || typeof cmd.targetId !== 'string'
    || cmd.targetId.length === 0
    || typeof cmd.skillId !== 'string'
    || cmd.skillId.length === 0
  ) {
    return commandFailure('invalid_context');
  }

  const actor = lookupById(ctx.combatants, cmd.actorId);
  if (isDeadCombatant(actor)) {
    return commandFailure('invalid_actor');
  }
  if (ctx.activeCombatantId !== cmd.actorId) {
    return commandFailure('not_active_actor');
  }

  const target = lookupById(ctx.combatants, cmd.targetId);
  if (isDeadCombatant(target, { allowDeathsDoor: true })) {
    return commandFailure('invalid_target');
  }

  const skill = lookupById(ctx.skillsById, cmd.skillId);
  if (!skill) {
    return commandFailure('invalid_skill');
  }

  if (typeof ctx.validatePosition !== 'function') {
    return commandFailure('invalid_position');
  }
  try {
    const position = ctx.validatePosition(cmd.actorId, cmd.targetId, skill);
    if (!position?.ok) {
      return position?.reason ? position : commandFailure('invalid_position');
    }
  } catch {
    return commandFailure('invalid_position');
  }

  const staminaCost = positiveCost(skill.costs?.stamina);
  if (
    staminaCost > 0
    && availableFrom(ctx.getStamina, [actor]) < staminaCost
  ) {
    return commandFailure('insufficient_stamina');
  }

  const ammoId = skill.costs?.ammo;
  if (
    typeof ammoId === 'string'
    && ammoId.length > 0
    && availableFrom(ctx.getAmmo, [ammoId]) < 1
  ) {
    return commandFailure('insufficient_ammo');
  }

  const durabilityCost = positiveCost(skill.costs?.durability);
  if (
    durabilityCost > 0
    && availableFrom(ctx.getDurability, [skill.equipmentInstanceId]) < durabilityCost
  ) {
    return commandFailure('insufficient_durability');
  }

  return {
    ok: true,
    actor,
    target,
    skill,
  };
}

/**
 * Executes a validated combat skill through context callbacks.
 * If an effect callback throws after costs were consumed, this returns
 * execution_error and intentionally does not roll those costs back.
 */
export function executeSkillCommand(context, command, random = Math.random) {
  const validation = validateSkillCommand(context, command);
  if (!validation.ok) return validation;

  const { actor, target, skill } = validation;
  const effects = Array.isArray(skill.effects) ? skill.effects : [];
  if (typeof context.consumeCosts !== 'function') {
    return commandFailure('execution_error');
  }
  if (effects.length > 0 && typeof context.applyEffect !== 'function') {
    return commandFailure('execution_error');
  }

  try {
    context.consumeCosts(actor, skill);

    const randomFn = typeof random === 'function' ? random : Math.random;
    const roll = normalizeRoll(randomFn());
    const hit = roll <= normalizeAccuracy(skill.accuracy);
    if (!hit) {
      return { ok: true, hit: false, turnConsumed: true };
    }

    for (const effect of effects) {
      context.applyEffect(effect, actor, target, randomFn);
    }

    return {
      ok: true,
      hit: true,
      turnConsumed: true,
      effectsApplied: effects.length,
    };
  } catch {
    return commandFailure('execution_error');
  }
}

export function useCombatItem(context, actorId, itemInstanceId) {
  const ctx = asObject(context);
  if (!ctx || !ctx.combatants) {
    return commandFailure('invalid_actor');
  }

  const actor = lookupById(ctx.combatants, actorId);
  if (isDeadCombatant(actor)) {
    return commandFailure('invalid_actor');
  }
  if (ctx.activeCombatantId !== actorId) {
    return commandFailure('not_active_actor');
  }
  if (actor.itemUsedThisTurn === true) {
    return commandFailure('item_already_used');
  }
  if (typeof ctx.consumeCombatItem !== 'function') {
    return commandFailure('item_unavailable');
  }

  let result;
  try {
    result = ctx.consumeCombatItem(itemInstanceId, actor);
  } catch {
    return commandFailure('item_error');
  }

  if (result?.ok === false) {
    return result;
  }

  actor.itemUsedThisTurn = true;
  return {
    ok: true,
    turnConsumed: false,
    effects: result?.effects ?? [],
  };
}
