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

  it('빈 탄창 shoot은 피해, 턴, 내구도, 소음을 변경하지 않는다', () => {
    const enemy = makeEnemy();
    GameState.player.equipped = { weapon_main: 'weapon_1', weapon_sub: null };
    GameState.cards.weapon_1 = {
      instanceId: 'weapon_1',
      definitionId: 'pistol',
      loadedAmmo: 0,
      durability: 100,
    };
    GameState.getCardDef = id => id === 'weapon_1'
      ? {
          id: 'pistol',
          name: 'Pistol',
          type: 'weapon',
          subtype: 'firearm',
          combat: {
            damage: [10, 10],
            accuracy: 1,
            noiseOnUse: 30,
            durabilityLoss: 1,
            requiresAmmo: 'pistol_ammo',
          },
        }
      : null;
    GameState.noise = { level: 0, decayPerTP: 1, influxThreshold: 60 };
    GameState.combat = {
      active: true,
      enemies: [enemy],
      targetIndex: 0,
      round: 0,
      log: [],
      playerStatus: [],
      enemyStatus: [],
    };
    const before = {
      hp: enemy.currentHp,
      round: GameState.combat.round,
      durability: GameState.cards.weapon_1.durability,
      noise: GameState.noise.level,
    };

    expect(CombatSystem.resolveAction('shoot', 'weapon_1')).toBe(false);
    expect({
      hp: enemy.currentHp,
      round: GameState.combat.round,
      durability: GameState.cards.weapon_1.durability,
      noise: GameState.noise.level,
    }).toEqual(before);
  });

  it('다중 대상 원거리 공격은 적중 여부와 무관하게 탄창 한 발만 소비한다', () => {
    const enemies = [makeEnemy(), { ...makeEnemy(), id: 'zombie_second' }];
    GameState.player.equipped = { weapon_main: 'weapon_1', weapon_sub: null };
    GameState.cards.weapon_1 = {
      instanceId: 'weapon_1',
      definitionId: 'shotgun',
      loadedAmmo: 2,
      durability: 100,
    };
    GameState.getCardDef = id => id === 'weapon_1'
      ? {
          id: 'shotgun',
          name: 'Shotgun',
          type: 'weapon',
          subtype: 'firearm',
          multiTarget: 2,
          weaponType: 'bullet',
          tags: ['weapon', 'firearm'],
          combat: {
            damage: [10, 10],
            accuracy: 1,
            noiseOnUse: 10,
            durabilityLoss: 0,
            requiresAmmo: 'shotgun_ammo',
            critChance: 0,
          },
        }
      : null;
    GameState.noise = { level: 0, decayPerTP: 1, influxThreshold: 60 };
    GameState.combat = {
      active: true,
      enemies,
      targetIndex: 0,
      round: 0,
      log: [],
      playerStatus: [],
      enemyStatus: [],
      fxQueue: [],
      playerGuard: null,
    };

    CombatSystem._attackAction('shoot', 'weapon_1', enemies[0]);

    expect(GameState.cards.weapon_1.loadedAmmo).toBe(1);
  });
});
