import { describe, expect, it, vi } from 'vitest';
import { executeSkillCommand } from '../../js/systems/combat/CombatSkillSystem.js';

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
      effectsApplied: 1,
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
});
