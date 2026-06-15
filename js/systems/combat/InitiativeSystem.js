const MAX_INITIATIVE_ROLL = 1_000_000;

function normalizedRollMax(rollMax) {
  return Number.isSafeInteger(rollMax)
    && rollMax >= 0
    && rollMax <= MAX_INITIATIVE_ROLL
    ? rollMax
    : 0;
}

function isValidCombatant(combatant) {
  if (!combatant || typeof combatant !== 'object' || Array.isArray(combatant)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(combatant);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }

  return typeof combatant.id === 'string' && combatant.id.trim().length > 0;
}

function clampedRandom(random) {
  if (typeof random !== 'function') return 0;

  let value;
  try {
    value = random();
  } catch {
    return 0;
  }

  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return 0;
  if (value >= 1) return 1 - Number.EPSILON;
  return value;
}

export function buildInitiativeQueue(combatants, random = Math.random, rollMax = 3) {
  if (!combatants || typeof combatants !== 'object' || Array.isArray(combatants)) {
    return [];
  }

  const maxRoll = normalizedRollMax(rollMax);
  const queue = [];
  const queuedIds = new Set();

  for (const [key, combatant] of Object.entries(combatants)) {
    if (typeof key !== 'string' || key.length === 0) continue;
    if (!isValidCombatant(combatant) || combatant.id !== key) continue;
    if (combatant.dead === true) continue;
    if (queuedIds.has(combatant.id)) continue;

    const speed = Number.isFinite(combatant.speed)
      && Number.isSafeInteger(combatant.speed)
      ? combatant.speed
      : 0;
    const roll = Math.floor(clampedRandom(random) * (maxRoll + 1));
    const rolledInitiative = speed + roll;
    queuedIds.add(combatant.id);
    queue.push({
      combatantId: combatant.id,
      initiative: Number.isSafeInteger(rolledInitiative) ? rolledInitiative : speed,
    });
  }

  return queue.sort((a, b) => (
    b.initiative - a.initiative
    || a.combatantId.localeCompare(b.combatantId)
  ));
}

export function canAct(combatant) {
  if (!isValidCombatant(combatant)) {
    return false;
  }

  if (combatant.dead === true) {
    return false;
  }

  const statusEffects = Array.isArray(combatant.statusEffects)
    ? combatant.statusEffects
    : [];
  return !statusEffects.some(status => status?.effect?.skipTurn === true);
}

export function nextActionableIndex(queue, currentIndex, combatants) {
  if (!Array.isArray(queue) || queue.length === 0) return -1;
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= queue.length) {
    return -1;
  }
  if (!combatants || typeof combatants !== 'object' || Array.isArray(combatants)) {
    return -1;
  }

  for (let index = currentIndex + 1; index < queue.length; index++) {
    const entry = queue[index];
    const id = entry?.combatantId;
    if (typeof id !== 'string' || id.length === 0) continue;
    if (!Object.prototype.hasOwnProperty.call(combatants, id)) continue;
    const combatant = combatants[id];
    if (combatant?.id !== id) continue;
    if (canAct(combatant)) return index;
  }

  return -1;
}
