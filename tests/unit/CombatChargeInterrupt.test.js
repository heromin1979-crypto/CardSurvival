import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.equipped = { weapon_main: 'baton_inst' };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.modStat = vi.fn();
  GameState.cards = { baton_inst: { instanceId: 'baton_inst', definitionId: 'stun_baton', durability: 100, _quality: 'normal' } };
  GameState.getCardDef = (id) => id === 'baton_inst' ? {
    id: 'stun_baton', weaponType: 'electric',
    combat: { damage: [14, 26], accuracy: 1.0, noiseOnUse: 2, durabilityLoss: 6, critChance: 0,
      statusInflict: { id: 'stun', name: '기절', duration: 1, chance: 1.0 } },
    tags: ['weapon', 'melee', 'silent'],
  } : null;
});

describe('충전 인터럽트', () => {
  it('charge_strike 적이 기절하면 _chargeRemaining 리셋', () => {
    const c = { id: 'zombie_charger', name: '돌진자', currentHp: 999, maxHp: 999, defense: 0,
      weaknesses: [], resistances: [], _statusEffects: [],
      timedThreat: { id: 'charge_strike', chargeTurns: 1, counters: { stunDelays: true } },
      _chargeRemaining: 0 };
    GameState.combat = { active: true, enemies: [c], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], playerGuard: null };
    CombatSystem._attackAction('melee', 'baton_inst', c);
    expect(c._chargeRemaining).toBe(1);
  });

  it('timedThreat 없는 적은 _chargeRemaining에 영향 없음', () => {
    const c = { id: 'zombie', name: '좀비', currentHp: 999, maxHp: 999, defense: 0,
      weaknesses: [], resistances: [], _statusEffects: [],
      timedThreat: undefined, _chargeRemaining: undefined };
    GameState.combat = { active: true, enemies: [c], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], playerGuard: null };
    CombatSystem._attackAction('melee', 'baton_inst', c);
    expect(c._chargeRemaining).toBeUndefined();
  });
});
