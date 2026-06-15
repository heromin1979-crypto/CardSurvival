import BALANCE from '../../data/gameBalance.js';

export function buildCombatants(gs, enemies = []) {
  const combatants = {};

  combatants.player = {
    id: 'player',
    side: 'ally',
    sourceType: 'player',
    sourceId: 'player',
    hp: gs.player.hp.current,
    maxHp: gs.player.hp.max,
    speed: BALANCE.combat.defaultPlayerSpeed,
    stress: gs.stats?.stress?.current ?? 0,
    tokens: {},
    statusEffects: [],
    deathsDoor: false,
    deathResist: BALANCE.combat.deathsDoor.baseResist,
    itemUsedThisTurn: false,
    dead: false,
  };

  const companionIds = (gs.companions ?? [])
    .filter(id => {
      const state = gs.npcs?.states?.[id];
      return state?.isCompanion === true && (state.hp ?? 0) > 0;
    })
    .slice(0, 2);

  for (const id of companionIds) {
    const state = gs.npcs.states[id];
    combatants[id] = {
      id,
      side: 'ally',
      sourceType: 'companion',
      sourceId: id,
      hp: state.hp,
      maxHp: state.maxHp ?? 50,
      speed: state.combatSpeed ?? BALANCE.combat.defaultCompanionSpeed,
      stress: state.combatStress ?? 0,
      bond: state.bond ?? 0,
      tokens: {},
      statusEffects: [...(state.statusEffects ?? [])],
      deathsDoor: false,
      deathResist: BALANCE.combat.deathsDoor.baseResist,
      itemUsedThisTurn: false,
      dead: false,
    };
  }

  enemies.forEach((enemy, index) => {
    const id = `enemy:${index}`;
    combatants[id] = {
      id,
      side: 'enemy',
      sourceType: 'enemy',
      sourceId: enemy.id ?? enemy.definitionId,
      enemyIndex: index,
      hp: enemy.currentHp,
      maxHp: enemy.maxHp,
      speed: enemy.speed ?? BALANCE.combat.defaultEnemySpeed,
      tokens: {},
      statusEffects: [...(enemy._statusEffects ?? [])],
      dead: enemy.currentHp <= 0,
    };
  });

  return combatants;
}

export function syncCombatantsToGameState(gs, combatants) {
  for (const combatant of Object.values(combatants ?? {})) {
    if (combatant.sourceType === 'player') {
      gs.player.hp.current = Math.max(0, combatant.hp);
      continue;
    }

    if (combatant.sourceType !== 'companion') continue;

    const state = gs.npcs?.states?.[combatant.sourceId];
    if (!state) continue;

    state.hp = Math.max(0, combatant.hp);
    state.statusEffects = [...(combatant.statusEffects ?? [])];
    state.combatStress = combatant.stress ?? 0;
    if (combatant.dead) state.isDead = true;
  }
}
