import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  GameState.player = {
    ...(GameState.player ?? {}),
    hp: { current: 100, max: 100 },
    equipped: { weapon_main: null },
  };
  GameState.stats = { morale: { current: 50, max: 100 } };
  GameState.time = { hour: 12 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.cards = {};
  GameState.getBoardCards = () => [];
  GameState.getCardDef = () => null;
  GameState.modStat = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeEnemy() {
  return {
    id: 'zombie_common',
    name: 'Zombie',
    currentHp: 30,
    maxHp: 30,
    row: 'front',
    attack: { damage: [1, 1], accuracy: 0 },
    weaknesses: [],
    resistances: [],
    specialSkills: [],
    _skillCooldowns: {},
  };
}

describe('CombatSystem player movement action', () => {
  it('resolveAction("move") toggles playerRank and emits move FX', () => {
    GameState.combat = {
      active: true,
      enemies: [makeEnemy()],
      targetIndex: 0,
      playerRank: 'front',
      log: [],
      round: 0,
      playerStatus: [],
      enemyStatus: [],
      fxQueue: [],
      playerGuard: null,
    };

    CombatSystem.resolveAction('move');

    expect(GameState.combat.playerRank).toBe('back');
    expect(GameState.combat.round).toBe(1);
    expect(GameState.combat.fxQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'move', target: 'player', direction: 'back' }),
      ]),
    );
    expect(GameState.combat.log.at(-1)).toContain('후열');
  });
});
