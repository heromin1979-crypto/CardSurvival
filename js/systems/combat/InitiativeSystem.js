function normalizedRollMax(rollMax) {
  return Number.isFinite(rollMax)
    && Number.isInteger(rollMax)
    && rollMax >= 0
    ? rollMax
    : 0;
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

  for (const combatant of Object.values(combatants)) {
    if (!combatant || typeof combatant !== 'object' || Array.isArray(combatant)) continue;
    if (typeof combatant.id !== 'string' || combatant.id.trim().length === 0) continue;
    if (combatant.dead === true) continue;

    const speed = Number.isFinite(combatant.speed) ? combatant.speed : 0;
    const roll = Math.floor(clampedRandom(random) * (maxRoll + 1));
    queue.push({
      combatantId: combatant.id,
      initiative: speed + roll,
    });
  }

  return queue.sort((a, b) => (
    b.initiative - a.initiative
    || a.combatantId.localeCompare(b.combatantId)
  ));
}

export function canAct(combatant) {
  if (!combatant || typeof combatant !== 'object' || combatant.dead === true) {
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
    if (canAct(combatants[id])) return index;
  }

  return -1;
}
