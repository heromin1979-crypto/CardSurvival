import { describe, expect, it, vi } from 'vitest';
import { executeSkillCommand } from '../../js/systems/combat/CombatSkillSystem.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

function makeManualPartyContext(activeCombatantId) {
  const player = {
    id: 'player',
    sourceType: 'player',
    side: 'ally',
    rank: 1,
    currentHp: 24,
  };
  const companion = {
    id: 'companion:npc_nurse',
    sourceType: 'companion',
    sourceId: 'npc_nurse',
    side: 'ally',
    rank: 2,
    currentHp: 18,
  };
  const enemy = {
    id: 'enemy:zombie',
    side: 'enemy',
    rank: 1,
    currentHp: 16,
  };
  const skillsById = {
    player_strike: {
      id: 'player_strike',
      costs: { stamina: 1 },
      accuracy: 1,
      effects: [{ type: 'damage', value: [4, 4] }],
    },
    companion_heavy_hit: {
      id: 'companion_heavy_hit',
      costs: { stamina: 2 },
      accuracy: 1,
      effects: [{ type: 'damage', value: [5, 5] }],
    },
  };
  const applied = [];

  return {
    activeCombatantId,
    combatants: [player, companion, enemy],
    skillsById,
    validatePosition: () => ({ ok: true }),
    getStamina: () => 10,
    getAmmo: () => 0,
    getDurability: () => 0,
    consumeCosts: vi.fn(() => ({ ok: true })),
    applyEffect: vi.fn((effect, actor, target) => {
      applied.push({ effect, actorId: actor.id, targetId: target.id });
      return { ok: true };
    }),
    consumeCombatItem: vi.fn(),
    applied,
  };
}

function setupNurseTurn({ stance = 'attack' } = {}) {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.equipped = {};
  GameState.player.traits = [];
  GameState.stats.stamina = { current: 10, max: 10, decayPerTP: 0 };
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0 };
  GameState.noise = { level: 0 };
  GameState.companions = ['npc_nurse'];
  GameState.npcs = {
    states: {
      npc_nurse: {
        hp: 50,
        maxHp: 50,
        isCompanion: true,
        bond: 70,
        combatSpeed: 50,
        stance,
      },
    },
  };
  GameState.flags = {};

  CombatSystem._setupCombat({
    enemies: [{
      id: 'zombie_common',
      name: 'infected',
      currentHp: 30,
      maxHp: 30,
      speed: 4,
      row: 'front',
      defense: 0,
      attack: { damage: [4, 6], accuracy: 1 },
      specialSkills: [],
      weaknesses: [],
      resistances: [],
      lootTable: [],
      _skillCooldowns: {},
      _statusEffects: [],
    }],
    dangerLevel: 1,
  });

  const combat = GameState.combat;
  combat.turnQueue = [
    { type: 'companion', id: 'npc_nurse', combatantId: 'npc_nurse', order: 0 },
    { type: 'player', combatantId: 'player', order: 1 },
    { type: 'enemy', enemyIdx: 0, combatantId: 'enemy:0', order: 2 },
  ];
  combat.activeIdx = 0;
  combat.activeTurnIndex = 0;
  combat.activeCombatantId = 'npc_nurse';
  CombatSystem.beginActiveTurn();
  return combat;
}

describe('manual party combat commands', () => {
  it.each([
    ['player', 'player_strike'],
    ['companion:npc_nurse', 'companion_heavy_hit'],
  ])('executes %s command through the same manual API', (actorId, skillId) => {
    const ctx = makeManualPartyContext(actorId);

    const result = executeSkillCommand(ctx, {
      actorId,
      targetId: 'enemy:zombie',
      skillId,
    }, () => 0);

    expect(result).toEqual({
      ok: true,
      hit: true,
      turnConsumed: true,
      costsConsumed: true,
      effectsApplied: 1,
      partialApplied: false,
    });
    expect(ctx.consumeCosts).toHaveBeenCalledWith(
      expect.objectContaining({ id: actorId }),
      ctx.skillsById[skillId],
    );
    expect(ctx.applied).toEqual([{
      effect: ctx.skillsById[skillId].effects[0],
      actorId,
      targetId: 'enemy:zombie',
    }]);
  });

  it('waits for ally input and exposes selectable skills after setup', () => {
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.characterId = 'doctor';
    GameState.player.equipped = {};
    GameState.companions = [];
    GameState.npcs = { states: {} };
    GameState.flags = GameState.flags ?? {};

    CombatSystem._setupCombat({
      enemies: [{
        id: 'zombie_common',
        name: 'infected',
        currentHp: 30,
        maxHp: 30,
        speed: 4,
        row: 'front',
        attack: { damage: [4, 6], accuracy: 1 },
        specialSkills: [],
        weaknesses: [],
        resistances: [],
      }],
      dangerLevel: 1,
    });

    if (GameState.combat.combatants[GameState.combat.activeCombatantId].side !== 'ally') {
      CombatSystem.processUntilAllyTurn();
    }

    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(GameState.combat.activeCombatantId).toBeTruthy();
    expect(CombatSystem.selectSkill(GameState.combat.combatants.player.skillIds[0])).toBe(true);
  });

  it('stops on a companion turn instead of auto-running companion stance actions', () => {
    const combat = setupNurseTurn({ stance: 'attack' });
    const enemyHpBeforeInput = combat.enemies[0].currentHp;

    CombatSystem.processUntilAllyTurn();

    expect(combat.phase).toBe('await_ally_input');
    expect(combat.activeCombatantId).toBe('npc_nurse');
    expect(combat.enemies[0].currentHp).toBe(enemyHpBeforeInput);
    expect(combat.actionSequence).toBe(0);

    expect(CombatSystem.selectSkill('nurse_scalpel')).toBe(true);
    expect(CombatSystem.selectTarget('enemy:0')).toBe(true);
    const before = combat.enemies[0].currentHp;
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = CombatSystem.confirmAction();
    randomSpy.mockRestore();

    expect(result.ok).toBe(true);
    expect(combat.enemies[0].currentHp).toBeLessThan(before);
    expect(combat.actionSequence).toBe(1);
    expect(combat.activeCombatantId).not.toBe('npc_nurse');
  });

  it('invalid target selection keeps the same companion turn pending', () => {
    const combat = setupNurseTurn({ stance: 'attack' });

    CombatSystem.processUntilAllyTurn();

    expect(CombatSystem.selectSkill('nurse_triage')).toBe(true);
    expect(CombatSystem.selectTarget('enemy:0')).toBe(false);
    expect(combat.phase).toBe('select_target');
    expect(combat.activeCombatantId).toBe('npc_nurse');
    expect(combat.actionSequence).toBe(0);
  });

  it.each([
    [1, 'doctor_triage', 'enemy:0', 'player'],
    [0, 'nurse_scalpel', 'player', 'npc_nurse'],
  ])(
    'other side mismatches keep legacy confirmation-time validation',
    (activeIdx, skillId, targetId, actorId) => {
      const combat = setupNurseTurn({ stance: 'attack' });
      combat.activeIdx = activeIdx;
      CombatSystem.beginActiveTurn();

      expect(combat.activeCombatantId).toBe(actorId);
      expect(CombatSystem.selectSkill(skillId)).toBe(true);
      expect(CombatSystem.selectTarget(targetId)).toBe(true);

      const result = CombatSystem.confirmAction();

      expect(result).toMatchObject({
        ok: false,
        reason: 'invalid_target_side',
      });
      expect(combat.phase).toBe('await_ally_input');
      expect(combat.activeCombatantId).toBe(actorId);
      expect(combat.actionSequence).toBe(0);
    },
  );

  it('confirms a selected ally skill through the ranked command context', () => {
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.characterId = 'doctor';
    GameState.player.equipped = {};
    GameState.companions = [];
    GameState.npcs = { states: {} };
    GameState.flags = GameState.flags ?? {};

    CombatSystem._setupCombat({
      enemies: [{
        id: 'zombie_common',
        name: 'infected',
        currentHp: 30,
        maxHp: 30,
        speed: 4,
        row: 'front',
        attack: { damage: [4, 6], accuracy: 1 },
        specialSkills: [],
        weaknesses: [],
        resistances: [],
      }],
      dangerLevel: 1,
    });

    const skillId = GameState.combat.combatants.player.skillIds[0];
    expect(CombatSystem.selectSkill(skillId)).toBe(true);
    expect(CombatSystem.selectTarget('enemy:0')).toBe(true);

    const before = GameState.combat.enemies[0].currentHp;
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = CombatSystem.confirmAction();
    randomSpy.mockRestore();

    expect(result.ok).toBe(true);
    expect(result.hit).toBe(true);
    expect(GameState.combat.enemies[0].currentHp).toBeLessThan(before);
    expect(GameState.combat.activeCombatantId).toBe('player');
    expect(GameState.combat.phase).toBe('await_ally_input');
  });

  it('resolves enemy turns after an ally action so controls return to a manual ally', () => {
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.characterId = 'doctor';
    GameState.player.equipped = {};
    GameState.companions = [];
    GameState.npcs = { states: {} };
    GameState.flags = GameState.flags ?? {};

    CombatSystem._setupCombat({
      enemies: [{
        id: 'zombie_common',
        name: 'infected',
        currentHp: 100,
        maxHp: 100,
        speed: 4,
        row: 'front',
        attack: { damage: [4, 4], accuracy: 1 },
        specialSkills: [],
        weaknesses: [],
        resistances: [],
      }],
      dangerLevel: 1,
    });

    const skillId = GameState.combat.combatants.player.skillIds[0];
    expect(CombatSystem.selectSkill(skillId)).toBe(true);
    expect(CombatSystem.selectTarget('enemy:0')).toBe(true);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = CombatSystem.confirmAction();
    randomSpy.mockRestore();

    expect(result.ok).toBe(true);
    expect(GameState.combat.activeCombatantId).toBe('player');
    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(GameState.combat.combatants.player.skillIds.length).toBeGreaterThan(0);
  });
});
