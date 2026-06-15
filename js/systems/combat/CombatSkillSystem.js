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
  const ranged = combat.requiresAmmo != null;
  const effects = [{
    type: 'damage',
    value: normalizeDamage(combat.damage),
  }];

  if (combat.statusInflict && typeof combat.statusInflict === 'object') {
    effects.push({
      type: 'status',
      status: cloneValue(combat.statusInflict),
    });
  }

  return {
    id: `equipment:${instanceId}`,
    nameKey: typeof definition.name === 'string' && definition.name.length > 0
      ? definition.name
      : (typeof definition.id === 'string' && definition.id.length > 0
        ? definition.id
        : instanceId),
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
      ammo: combat.requiresAmmo ?? null,
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
