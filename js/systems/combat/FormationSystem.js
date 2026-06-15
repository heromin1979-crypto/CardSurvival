const FORMATION_SIZE = 4;

function rankToIndex(side, rank) {
  return side === 'ally' ? FORMATION_SIZE - rank : rank - 1;
}

function findPosition(formations, combatantId) {
  for (const side of ['ally', 'enemy']) {
    const formation = formations?.[side];
    if (!Array.isArray(formation)) continue;

    const index = formation.indexOf(combatantId);
    if (index === -1) continue;

    const rank = side === 'ally' ? FORMATION_SIZE - index : index + 1;
    return { side, index, rank };
  }

  return null;
}

export function createFormations(allyIds = [], enemies = []) {
  const ally = Array(FORMATION_SIZE).fill(null);
  const enemy = Array(FORMATION_SIZE).fill(null);

  allyIds.slice(0, 3).forEach((id, index) => {
    ally[FORMATION_SIZE - 1 - index] = id;
  });

  enemies.slice(0, FORMATION_SIZE).forEach((combatant) => {
    const preferredRanks = combatant?.row === 'back'
      ? [3, 4, 1, 2]
      : [1, 2, 3, 4];
    const rank = preferredRanks.find((candidate) => {
      return enemy[rankToIndex('enemy', candidate)] === null;
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
  if (!position || destinationRank < 1 || destinationRank > FORMATION_SIZE) {
    return false;
  }

  const formation = formations[position.side];
  const destinationIndex = rankToIndex(position.side, destinationRank);
  if (formation[destinationIndex] !== null) return false;

  const firstIntermediateRank = Math.min(position.rank, destinationRank) + 1;
  const lastIntermediateRank = Math.max(position.rank, destinationRank) - 1;
  for (let rank = firstIntermediateRank; rank <= lastIntermediateRank; rank++) {
    if (formation[rankToIndex(position.side, rank)] !== null) return false;
  }

  formation[position.index] = null;
  formation[destinationIndex] = combatantId;
  return true;
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

  if (!skill?.usableFrom?.includes(actor.rank)) {
    return { ok: false, reason: 'invalid_origin_rank' };
  }

  if (skill?.target?.side !== target.side) {
    return { ok: false, reason: 'invalid_target_side' };
  }

  if (!skill?.target?.ranks?.includes(target.rank)) {
    return { ok: false, reason: 'invalid_target_rank' };
  }

  return { ok: true };
}
