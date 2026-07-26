import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';
import NoiseSystem from '../../js/systems/NoiseSystem.js';
import { ENEMIES, instantiateEnemy } from '../../js/data/enemies.js';

const quietWeapon = {
  id: 'quiet_blade',
  weaponType: 'blade',
  combat: {
    damage: [1, 1],
    accuracy: 1,
    noiseOnUse: 0,
    durabilityLoss: 0,
    critChance: 0,
  },
  tags: ['weapon', 'melee', 'silent'],
};

const stunWeapon = {
  id: 'stun_baton',
  weaponType: 'electric',
  combat: {
    damage: [1, 1],
    accuracy: 1,
    noiseOnUse: 0,
    durabilityLoss: 0,
    critChance: 0,
    statusInflict: {
      id: 'stun',
      name: '기절',
      duration: 1,
      chance: 1,
    },
  },
  tags: ['weapon', 'melee', 'silent'],
};

function makeScreamer(hp = 30) {
  const enemy = instantiateEnemy(ENEMIES.zombie_screamer);
  return {
    ...enemy,
    currentHp: hp,
    maxHp: hp,
    defense: 0,
    weaknesses: [],
    resistances: [],
    _statusEffects: [],
    _chargeRemaining: 1,
  };
}

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.xp = 0;
  GameState.player.characterId = 'firefighter';
  GameState.player.equipped = { weapon_main: 'weapon_inst' };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.location = { currentDistrict: 'hospital' };
  GameState.cards = {
    weapon_inst: {
      instanceId: 'weapon_inst',
      definitionId: quietWeapon.id,
      durability: 100,
      _quality: 'normal',
    },
  };
  GameState.getCardDef = () => quietWeapon;
  GameState.getBoardCards = () => [];
  GameState.createCardInstance = vi.fn(() => null);
  GameState.placeCardInRow = vi.fn(() => null);
  GameState.modStat = vi.fn();
  GameState.combat = {
    active: true,
    enemies: [],
    targetIndex: 0,
    log: [],
    rewards: [],
    playerStatus: [],
    enemyStatus: [],
    xpGained: 0,
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('스크리머 timedThreat 카운터', () => {
  it('실제 데이터는 기절 지연과 조용한 처치만 카운터로 선언한다', () => {
    expect(ENEMIES.zombie_screamer.timedThreat.counters).toEqual({
      quietKill: true,
      stunDelays: true,
    });
  });

  it('기절 공격은 카운트다운을 1 증가시킨다', () => {
    const enemy = makeScreamer();
    GameState.combat.enemies = [enemy];
    GameState.getCardDef = () => stunWeapon;

    CombatSystem._attackAction('melee', 'weapon_inst', enemy);

    expect(enemy._chargeRemaining).toBe(2);
  });

  it('조용한 일반 공격은 카운트다운을 바꾸지 않는다', () => {
    const enemy = makeScreamer();
    GameState.combat.enemies = [enemy];

    CombatSystem._attackAction('melee', 'weapon_inst', enemy);

    expect(enemy.currentHp).toBe(29);
    expect(enemy._chargeRemaining).toBe(1);
  });

  it('조용한 처치는 사망 비명 소음이나 추가 소환을 발생시키지 않는다', () => {
    const enemy = makeScreamer(1);
    GameState.combat.enemies = [enemy];
    const noiseSpy = vi.spyOn(NoiseSystem, 'addNoise');
    const spawnSpy = vi.spyOn(CombatSystem, '_spawnEnemyMidCombat');

    CombatSystem._attackAction('melee', 'weapon_inst', enemy);
    noiseSpy.mockClear();
    CombatSystem._onEnemyKilled(enemy);
    CombatSystem._runSingleEnemyTurn(0);

    expect(noiseSpy).not.toHaveBeenCalled();
    expect(spawnSpy).not.toHaveBeenCalled();
    expect(GameState.combat.enemies).toEqual([enemy]);
  });
});
