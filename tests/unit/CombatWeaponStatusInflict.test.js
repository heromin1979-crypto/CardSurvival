import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  GameState.player = {
    ...(GameState.player ?? {}),
    characterId: 'test_survivor',
    hp: { current: 100, max: 100 },
    equipped: { weapon_main: 'spiked_pipe_inst' },
  };
  GameState.stats = { morale: { current: 50, max: 100 } };
  GameState.time = { hour: 12 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.modStat = vi.fn();
  GameState.getBoardCards = () => [];
  GameState.cards = {
    spiked_pipe_inst: {
      instanceId: 'spiked_pipe_inst',
      definitionId: 'spiked_pipe',
      durability: 100,
      _quality: 'normal',
    },
  };
  GameState.getCardDef = (id) => id === 'spiked_pipe_inst'
    ? {
        id: 'spiked_pipe',
        name: 'Spiked Pipe',
        weaponType: 'blunt',
        combat: {
          damage: [10, 10],
          accuracy: 1,
          noiseOnUse: 1,
          durabilityLoss: 0,
          critChance: 0,
          statusInflict: {
            id: 'bleed',
            name: 'Bleed',
            duration: 2,
            chance: 1,
            effect: { hpPerRound: -4 },
          },
        },
        tags: ['weapon', 'melee'],
      }
    : null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeEnemy() {
  return {
    id: 'zombie_common',
    name: 'Zombie',
    currentHp: 100,
    maxHp: 100,
    defense: 0,
    weaknesses: [],
    resistances: [],
    specialSkills: [],
    _skillCooldowns: {},
    _statusEffects: [],
  };
}

describe('weapon combat.statusInflict', () => {
  it('spiked_pipe bleed is applied to the target enemy status list and ticks damage', () => {
    const enemy = makeEnemy();
    GameState.combat = {
      active: true,
      enemies: [enemy],
      targetIndex: 0,
      log: [],
      playerStatus: [],
      enemyStatus: [],
      fxQueue: [],
      playerGuard: null,
    };

    CombatSystem._attackAction('melee', 'spiked_pipe_inst', enemy);

    expect(enemy._statusEffects).toEqual([
      expect.objectContaining({
        id: 'bleed',
        duration: 2,
        effect: expect.objectContaining({ hpLossPerRound: 4 }),
      }),
    ]);
    expect(GameState.combat.fxQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'status', target: 'enemy', enemyIdx: 0, statusId: 'bleed' }),
      ]),
    );

    const hpAfterHit = enemy.currentHp;
    CombatSystem._tickStatusEffects();

    expect(enemy.currentHp).toBe(hpAfterHit - 4);
    expect(enemy._statusEffects[0].duration).toBe(1);
  });
});
