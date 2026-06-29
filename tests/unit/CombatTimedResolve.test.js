import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem   from '../../js/systems/CombatSystem.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import { ENEMIES, instantiateEnemy } from '../../js/data/enemies.js';
import { buildEnemyProfile } from '../../js/systems/combat/EnemyCombatAdapter.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.modStat = vi.fn();
  GameState.combat = {
    active: true, enemies: [], targetIndex: 0, log: [],
    playerStatus: [], enemyStatus: [], dangerLevel: 3, turnQueue: [],
  };
});

describe('_resolveTimedThreat', () => {
  it('self_destruct: 플레이어 광역 피해 + 감염 + 본체 사망', () => {
    const enemy = { id: 'zombie_bloater', name: '블로터', currentHp: 50, maxHp: 50,
      timedThreat: { id: 'self_destruct' }, _chargeRemaining: 0 };
    GameState.combat.enemies = [enemy];
    const hpBefore = GameState.player.hp.current;
    CombatSystem._resolveTimedThreat(enemy);
    expect(GameState.player.hp.current).toBeLessThan(hpBefore);
    expect(enemy.currentHp).toBe(0);
    expect(GameState.modStat).toHaveBeenCalledWith('infection', expect.any(Number));
  });

  it('charge_strike: 단일 강타 + 기절 부여', () => {
    const enemy = { id: 'zombie_charger', name: '돌진자', currentHp: 40, maxHp: 40,
      timedThreat: { id: 'charge_strike' }, _chargeRemaining: 0 };
    GameState.combat.enemies = [enemy];
    const hpBefore = GameState.player.hp.current;
    CombatSystem._resolveTimedThreat(enemy);
    expect(GameState.player.hp.current).toBeLessThan(hpBefore);
    expect(GameState.combat.playerStatus.some(s => s.id === 'stun')).toBe(true);
  });

  it('summon_horde: 적 배열 증가', () => {
    const enemy = { id: 'zombie_screamer', name: '스크리머', currentHp: 30, maxHp: 30,
      timedThreat: { id: 'summon_horde' }, _chargeRemaining: 0 };
    GameState.combat.enemies = [enemy];
    const before = GameState.combat.enemies.length;
    CombatSystem._resolveTimedThreat(enemy);
    expect(GameState.combat.enemies.length).toBeGreaterThan(before);
  });

  it('explicit combat profiles preserve timed threat identities', () => {
    const cases = [
      ['zombie_bloater', 'self_destruct', ['bloater_swipe', 'bloater_self_destruct']],
      ['zombie_screamer', 'summon_horde', ['screamer_spit', 'screamer_summon_horde']],
      ['zombie_charger', 'charge_strike', ['charger_lunge', 'charger_impact']],
    ];

    for (const [enemyId, threatId, skillIds] of cases) {
      const enemy = instantiateEnemy(ENEMIES[enemyId]);
      const profile = buildEnemyProfile(enemy);

      expect(enemy.timedThreat.id).toBe(threatId);
      expect(enemy._chargeRemaining).toBe(enemy.timedThreat.chargeTurns);
      expect(profile.skillIds).toEqual(skillIds);
    }
  });
});
