import { describe, it, expect } from 'vitest';
import BALANCE from '../../js/data/gameBalance.js';
import {
  buildCombatants,
  syncCombatantsToGameState,
} from '../../js/systems/combat/CombatantAdapter.js';

function makeGameState() {
  return {
    player: {
      hp: { current: 80, max: 100 },
    },
    companions: ['npc_nurse', 'npc_dead', 'npc_soldier', 'npc_extra'],
    npcs: {
      states: {
        npc_nurse: {
          hp: 40,
          isCompanion: true,
          combatSpeed: 7,
          combatStress: 2,
          bond: 70,
          statusEffects: [{ id: 'guarded', duration: 1 }],
        },
        npc_dead: {
          hp: 0,
          maxHp: 60,
          isCompanion: true,
        },
        npc_soldier: {
          hp: 45,
          maxHp: 60,
          isCompanion: true,
          bond: 40,
        },
        npc_extra: {
          hp: 35,
          maxHp: 45,
          isCompanion: true,
          bond: 20,
        },
      },
    },
  };
}

describe('CombatantAdapter', () => {
  it('normalizes the player, up to two living companions, and enemies', () => {
    const gs = makeGameState();
    const enemies = [{
      id: 'zombie',
      currentHp: 30,
      maxHp: 40,
      speed: 6,
      _statusEffects: [{ id: 'bleed', duration: 2 }],
    }];

    const result = buildCombatants(gs, enemies);

    expect(Object.keys(result)).toEqual([
      'player',
      'npc_nurse',
      'npc_soldier',
      'enemy:0',
    ]);
    expect(result.player).toEqual({
      id: 'player',
      side: 'ally',
      sourceType: 'player',
      sourceId: 'player',
      hp: 80,
      maxHp: 100,
      speed: 5,
      stress: 0,
      tokens: {},
      statusEffects: [],
      deathsDoor: false,
      deathResist: 0.75,
      itemUsedThisTurn: false,
      dead: false,
    });
    expect(result.npc_nurse).toEqual({
      id: 'npc_nurse',
      side: 'ally',
      sourceType: 'companion',
      sourceId: 'npc_nurse',
      hp: 40,
      maxHp: 100,
      speed: 7,
      stress: 2,
      bond: 70,
      tokens: {},
      statusEffects: [{ id: 'guarded', duration: 1 }],
      deathsDoor: false,
      deathResist: 0.75,
      itemUsedThisTurn: false,
      dead: false,
    });
    expect(result.npc_soldier.speed).toBe(5);
    expect(result['enemy:0']).toEqual({
      id: 'enemy:0',
      side: 'enemy',
      sourceType: 'enemy',
      sourceId: 'zombie',
      enemyIndex: 0,
      hp: 30,
      maxHp: 40,
      speed: 6,
      tokens: {},
      statusEffects: [{ id: 'bleed', duration: 2 }],
      dead: false,
    });
  });

  it('excludes companions with zero HP', () => {
    const result = buildCombatants(makeGameState());

    expect(result.npc_dead).toBeUndefined();
  });

  it('prefers an explicit companion max HP from migrated state', () => {
    const gs = makeGameState();
    gs.npcs.states.npc_nurse.maxHp = 75;

    const result = buildCombatants(gs);

    expect(result.npc_nurse.maxHp).toBe(75);
  });

  it('excludes the third living companion', () => {
    const result = buildCombatants(makeGameState());

    expect(result.npc_extra).toBeUndefined();
  });

  it('copies status effect arrays without sharing the source arrays', () => {
    const gs = makeGameState();
    const enemyStatusEffects = [{ id: 'stun', duration: 1 }];
    const result = buildCombatants(gs, [{
      id: 'raider',
      currentHp: 20,
      maxHp: 20,
      _statusEffects: enemyStatusEffects,
    }]);

    expect(result.npc_nurse.statusEffects)
      .not.toBe(gs.npcs.states.npc_nurse.statusEffects);
    expect(result['enemy:0'].statusEffects).not.toBe(enemyStatusEffects);
  });

  it('syncs player and companion combat state back to game state', () => {
    const gs = makeGameState();
    const statusEffects = [{ id: 'poison', duration: 3 }];

    syncCombatantsToGameState(gs, {
      player: {
        sourceType: 'player',
        hp: -5,
        dead: true,
      },
      npc_nurse: {
        sourceType: 'companion',
        sourceId: 'npc_nurse',
        hp: 12,
        stress: 8,
        statusEffects,
        dead: true,
      },
    });

    expect(gs.player.hp.current).toBe(0);
    expect(gs.npcs.states.npc_nurse.hp).toBe(12);
    expect(gs.npcs.states.npc_nurse.statusEffects).toEqual(statusEffects);
    expect(gs.npcs.states.npc_nurse.statusEffects).not.toBe(statusEffects);
    expect(gs.npcs.states.npc_nurse.combatStress).toBe(8);
    expect(gs.npcs.states.npc_nurse.isDead).toBe(true);
  });

  it('skips missing NPC states while syncing', () => {
    const gs = makeGameState();

    expect(() => syncCombatantsToGameState(gs, {
      missing: {
        sourceType: 'companion',
        sourceId: 'npc_missing',
        hp: 10,
        statusEffects: [],
        dead: false,
      },
    })).not.toThrow();
  });
});

describe('combat adapter balance defaults', () => {
  it('defines speed and deaths door defaults', () => {
    expect(BALANCE.combat.defaultPlayerSpeed).toBe(5);
    expect(BALANCE.combat.defaultCompanionSpeed).toBe(5);
    expect(BALANCE.combat.defaultEnemySpeed).toBe(4);
    expect(BALANCE.combat.deathsDoor).toEqual({
      baseResist: 0.75,
      resistLossPerCheck: 0.10,
      minimumResist: 0.05,
    });
  });
});
