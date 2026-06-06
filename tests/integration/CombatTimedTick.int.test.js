import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem   from '../../js/systems/CombatSystem.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';

beforeEach(() => {
  SystemRegistry.register('NPCSystem', { damageCompanion: vi.fn(), getCompanionCombatBonus: () => 1.0 });
  GameState.player.hp = { current: 100, max: 100 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.modStat = vi.fn();
});

function bloater() {
  return {
    id: 'zombie_bloater', name: '블로터', icon: '🤰',
    currentHp: 50, maxHp: 50, aiPattern: 'normal',
    specialSkills: [], _skillCooldowns: {}, attack: { damage: [4, 8], accuracy: 1.0 },
    weaknesses: ['fire'], resistances: [],
    timedThreat: { id: 'self_destruct', chargeTurns: 3, chargingAttacks: true },
    _chargeRemaining: 1,
  };
}

describe('_runSingleEnemyTurn — 충전 틱', () => {
  it('_chargeRemaining > 0 이면 1 감소(발동 안 함)', () => {
    const e = bloater(); e._chargeRemaining = 2;
    GameState.combat = { active: true, enemies: [e], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 3 };
    CombatSystem._runSingleEnemyTurn(0);
    expect(e._chargeRemaining).toBe(1);
    expect(e.currentHp).toBe(50);
  });

  it('_chargeRemaining === 0 이면 트리거 발동(자폭→본체 사망)', () => {
    const e = bloater(); e._chargeRemaining = 0;
    GameState.combat = { active: true, enemies: [e], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 3 };
    CombatSystem._runSingleEnemyTurn(0);
    expect(e.currentHp).toBe(0);
  });

  it('chargingAttacks false(돌진자)면 충전 중 평타 없음', () => {
    const c = {
      id: 'zombie_charger', name: '돌진자', currentHp: 40, maxHp: 40, aiPattern: 'aggressive',
      specialSkills: [], _skillCooldowns: {}, attack: { damage: [6, 10], accuracy: 1.0 },
      weaknesses: [], resistances: [],
      timedThreat: { id: 'charge_strike', chargeTurns: 1, chargingAttacks: false },
      _chargeRemaining: 1,
    };
    GameState.combat = { active: true, enemies: [c], targetIndex: 0, log: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 3 };
    const hpBefore = GameState.player.hp.current;
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(hpBefore);
    expect(c._chargeRemaining).toBe(0);
  });
});
