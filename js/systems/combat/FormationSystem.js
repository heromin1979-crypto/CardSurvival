const FORMATION_SIZE = 4;

function isValidCombatantId(combatantId) {
  return typeof combatantId === 'string' && combatantId !== '';
}

function normalizeSlot(slot) {
  return isValidCombatantId(slot) ? slot : null;
}

function isEmptySlot(slot) {
  return normalizeSlot(slot) === null;
}

function toDenseFormation(formation) {
  return Array.from({ length: FORMATION_SIZE }, (_, index) => {
    const slot = Array.isArray(formation) ? formation[index] : null;
    return normalizeSlot(slot);
  });
}

function rankToIndex(side, rank) {
  return side === 'ally' ? FORMATION_SIZE - rank : rank - 1;
}

function findPosition(formations, combatantId) {
  if (!isValidCombatantId(combatantId)) return null;

  for (const side of ['ally', 'enemy']) {
    if (!Array.isArray(formations?.[side])) continue;
    const formation = toDenseFormation(formations[side]);

    const index = formation.findIndex((slot) => slot === combatantId);
    if (index === -1) continue;

    const rank = side === 'ally' ? FORMATION_SIZE - index : index + 1;
    return { side, index, rank };
  }

  return null;
}

export function createFormations(allyIds = [], enemies = []) {
  const ally = Array(FORMATION_SIZE).fill(null);
  const enemy = Array(FORMATION_SIZE).fill(null);
  const validAllyIds = Array.isArray(allyIds)
    ? allyIds.filter(isValidCombatantId).slice(0, 3)
    : [];
  const validEnemies = Array.isArray(enemies)
    ? enemies
      .filter((combatant) => isValidCombatantId(combatant?.combatantId))
      .slice(0, FORMATION_SIZE)
    : [];

  validAllyIds.forEach((id, index) => {
    ally[FORMATION_SIZE - 1 - index] = id;
  });

  validEnemies.forEach((combatant) => {
    const preferredRanks = combatant?.row === 'back'
      ? [3, 4, 1, 2]
      : [1, 2, 3, 4];
    const rank = preferredRanks.find((candidate) => {
      return isEmptySlot(enemy[rankToIndex('enemy', candidate)]);
    });

    if (rank !== undefined) {
      enemy[rankToIndex('enemy', rank)] = combatant.combatantId;
    }
  });

  return { ally, enemy };
}

export function getRank(formations, combatantId) {
  return findPosition(formations, combatantId)?.rank ?? null;
}

export function moveCombatant(formations, combatantId, destinationRank) {
  const position = findPosition(formations, combatantId);
  if (
    !position
    || !Number.isInteger(destinationRank)
    || destinationRank < 1
    || destinationRank > FORMATION_SIZE
  ) {
    return false;
  }

  const formation = toDenseFormation(formations[position.side]);
  const destinationIndex = rankToIndex(position.side, destinationRank);
  if (!isEmptySlot(formation[destinationIndex])) return false;

  const firstIntermediateRank = Math.min(position.rank, destinationRank) + 1;
  const lastIntermediateRank = Math.max(position.rank, destinationRank) - 1;
  for (let rank = firstIntermediateRank; rank <= lastIntermediateRank; rank++) {
    if (!isEmptySlot(formation[rankToIndex(position.side, rank)])) return false;
  }

  formation[position.index] = null;
  formation[destinationIndex] = combatantId;
  formations[position.side] = formation;
  return true;
}

function isLivingEnemyCombatant(combatant) {
  return combatant?.side === 'enemy'
    && combatant.dead !== true
    && (combatant.hp ?? 0) > 0;
}

export function compactEnemyFormation(formations, combatants = {}) {
  if (!formations || !Array.isArray(formations.enemy)) return false;

  const previous = toDenseFormation(formations.enemy);
  const livingEnemies = previous.filter((combatantId) => {
    const combatant = combatants?.[combatantId];
    return isLivingEnemyCombatant(combatant);
  });
  const next = [
    ...livingEnemies.slice(0, FORMATION_SIZE),
    ...Array(FORMATION_SIZE).fill(null),
  ].slice(0, FORMATION_SIZE);

  const changed = previous.some((combatantId, index) => combatantId !== next[index]);
  if (changed) formations.enemy = next;
  return changed;
}

export function validateSkillPosition(
  formations,
  actorId,
  targetId,
  skill,
) {
  const actor = findPosition(formations, actorId);
  if (!actor) return { ok: false, reason: 'invalid_actor' };

  const target = findPosition(formations, targetId);
  if (!target) return { ok: false, reason: 'invalid_target' };

  if (
    !Array.isArray(skill?.usableFrom)
    || !skill.usableFrom.includes(actor.rank)
  ) {
    return { ok: false, reason: 'invalid_origin_rank' };
  }

  if (skill?.target?.side !== target.side) {
    return { ok: false, reason: 'invalid_target_side' };
  }

  if (
    !Array.isArray(skill?.target?.ranks)
    || !skill.target.ranks.includes(target.rank)
  ) {
    return { ok: false, reason: 'invalid_target_rank' };
  }

  return { ok: true };
}
