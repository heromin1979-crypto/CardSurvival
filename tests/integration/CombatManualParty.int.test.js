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
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.characterId = 'doctor';
    GameState.player.equipped = {};
    GameState.companions = ['npc_nurse'];
    GameState.npcs = {
      states: {
        npc_nurse: {
          hp: 50,
          maxHp: 50,
          isCompanion: true,
          bond: 70,
          combatSpeed: 50,
          stance: 'heal',
        },
      },
    };
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

    const index = GameState.combat.turnQueue.findIndex(entry => entry.combatantId === 'npc_nurse');
    GameState.combat.activeIdx = index;
    GameState.combat.activeTurnIndex = index;
    GameState.combat.activeCombatantId = 'npc_nurse';
    CombatSystem.beginActiveTurn();

    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(GameState.combat.activeCombatantId).toBe('npc_nurse');
    expect(GameState.player.hp.current).toBe(100);
  });

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
    const result = CombatSystem.confirmAction();

    expect(result.ok).toBe(true);
    expect(result.hit).toBe(true);
    expect(GameState.combat.enemies[0].currentHp).toBeLessThan(before);
    expect(GameState.combat.activeCombatantId).not.toBe('player');
  });
});
