import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';

function setupCombat(enemy) {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.xp = 0;
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.modStat = vi.fn();
  GameState.combat = {
    active: true,
    enemies: [enemy],
    targetIndex: 0,
    log: [],
    playerStatus: [],
    enemyStatus: [],
    dangerLevel: 3,
    turnQueue: [{ type: 'enemy', enemyIdx: 0, order: 0 }],
    activeIdx: 0,
    fxQueue: [],
  };
  SystemRegistry.register('NPCSystem', null);
}

function bossWithSkill(skill, extra = {}) {
  return {
    id: 'boss_test',
    name: 'Boss Test',
    type: 'zombie',
    currentHp: 50,
    maxHp: 100,
    attack: { damage: [0, 0], accuracy: 1, noiseOnAttack: 0 },
    defense: 1,
    aiPattern: 'normal',
    specialSkills: [skill],
    _skillCooldowns: {},
    _statusEffects: [],
    ...extra,
  };
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('boss special pattern effects', () => {
  it('selfHeal effect restores the boss when a special skill is used', () => {
    const enemy = bossWithSkill({
      id: 'sermon',
      name: 'Sermon',
      damage: [0, 0],
      cooldown: 3,
      stunChance: 0,
      effect: { selfHeal: 20 },
    });
    setupCombat(enemy);

    CombatSystem._runEnemyAI(enemy);

    expect(enemy.currentHp).toBe(70);
    expect(enemy._skillCooldowns.sermon).toBe(3);
  });

  it('summon effect adds reinforcements to the enemy lineup', () => {
    const enemy = bossWithSkill({
      id: 'call_raiders',
      name: 'Call Raiders',
      damage: [0, 0],
      cooldown: 4,
      stunChance: 0,
      effect: { summon: { enemyId: 'raider', count: 2 } },
    });
    setupCombat(enemy);

    CombatSystem._runEnemyAI(enemy);

    expect(GameState.combat.enemies.length).toBe(3);
    expect(GameState.combat.enemies.slice(1).every(e => e.id === 'raider')).toBe(true);
  });

  it('dot effect adds a timed player status from the boss skill', () => {
    const enemy = bossWithSkill({
      id: 'acid_pool',
      name: 'Acid Pool',
      damage: [0, 0],
      cooldown: 3,
      stunChance: 0,
      effect: { dot: { hpLossPerRound: 6, duration: 3 } },
    });
    setupCombat(enemy);

    CombatSystem._runEnemyAI(enemy);

    expect(GameState.combat.playerStatus).toContainEqual(expect.objectContaining({
      id: 'acid_pool_dot',
      duration: 3,
      effect: expect.objectContaining({ hpLossPerRound: 6 }),
    }));
  });

  it('boss regeneration happens at the start of its turn', () => {
    const enemy = bossWithSkill({
      id: 'basic',
      name: 'Basic',
      damage: [0, 0],
      cooldown: 3,
      stunChance: 0,
    }, {
      currentHp: 40,
      maxHp: 100,
      regeneration: 15,
    });
    setupCombat(enemy);

    CombatSystem._runSingleEnemyTurn(0);

    expect(enemy.currentHp).toBe(55);
  });

  it('phase threshold triggers a named boss top-level summon once', () => {
    const enemy = bossWithSkill({
      id: 'basic',
      name: 'Basic',
      damage: [0, 0],
      cooldown: 3,
      stunChance: 0,
    }, {
      currentHp: 45,
      maxHp: 100,
      phaseThresholds: [0.5],
      summon: { enemyId: 'raider', count: 1, cooldown: 4 },
    });
    setupCombat(enemy);

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.combat.enemies.length).toBe(2);
    expect(GameState.combat.enemies[1].id).toBe('raider');
  });

  it('phase threshold can fire a top-level aoe attack against the party', () => {
    const damageCompanion = vi.fn();
    const enemy = bossWithSkill({
      id: 'basic',
      name: 'Basic',
      damage: [0, 0],
      cooldown: 3,
      stunChance: 0,
    }, {
      currentHp: 45,
      maxHp: 100,
      phaseThresholds: [0.5],
      aoeAttack: { damage: [10, 10], chance: 1, effect: { stun: 1 } },
    });
    setupCombat(enemy);
    GameState.companions = ['npc_a'];
    GameState.npcs = { states: { npc_a: { hp: 30, maxHp: 30, isCompanion: true } } };
    SystemRegistry.register('NPCSystem', { damageCompanion, getCompanionCombatBonus: () => 1.0 });

    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(90);
    expect(damageCompanion).toHaveBeenCalledWith('npc_a', 10);
    expect(GameState.combat.playerStatus.some(s => s.id === 'stun')).toBe(true);
  });
});
