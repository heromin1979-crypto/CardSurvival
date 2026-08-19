import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem   from '../../js/systems/CombatSystem.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';


// 이 파일은 적 치명타를 검증하지 않는다. 치명타는 확률 요소라 고정 피해 검증을 흔들므로
// 여기서는 비활성으로 고정한다 — 치명타 자체는 EnemyCriticalAndDisplay.test.js가 다룬다.
CombatSystem._rollEnemyCrit = damage => ({ damage, isCrit: false });

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

describe('_tickStatusEffects — 동료 상태 동기화', () => {
  it('동료 상태가 다음 틱에 피해와 기간 감소를 적용하고 만료 시 두 저장소에서 제거된다', () => {
    const damageCompanion = vi.fn((npcId, damage) => {
      const state = GameState.npcs.states[npcId];
      state.hp = Math.max(0, state.hp - damage);
    });
    SystemRegistry.register('NPCSystem', {
      damageCompanion,
      getCompanionCombatBonus: () => 1.0,
    });
    GameState.companions = ['npc_a'];
    GameState.npcs = {
      states: {
        npc_a: {
          hp: 20,
          maxHp: 20,
          isCompanion: true,
          statusEffects: [],
        },
      },
    };
    GameState.combat = {
      active: true,
      enemies: [],
      targetIndex: 0,
      log: [],
      playerStatus: [],
      enemyStatus: [],
      combatants: {
        npc_a: {
          id: 'npc_a',
          side: 'ally',
          sourceType: 'companion',
          sourceId: 'npc_a',
          hp: 20,
          maxHp: 20,
          tokens: {},
          statusEffects: [],
          dead: false,
        },
      },
    };

    CombatSystem._addAllyStatus('npc_a', {
      id: 'bleed',
      name: '출혈',
      duration: 2,
      effect: { hpLossPerRound: 3 },
    });
    CombatSystem._tickStatusEffects();

    expect(GameState.npcs.states.npc_a.hp).toBe(17);
    expect(GameState.combat.combatants.npc_a.hp).toBe(17);
    expect(GameState.combat.combatants.npc_a.statusEffects).toEqual([{
      id: 'bleed',
      name: '출혈',
      duration: 1,
      effect: { hpLossPerRound: 3 },
    }]);
    expect(GameState.npcs.states.npc_a.statusEffects).toEqual(
      GameState.combat.combatants.npc_a.statusEffects,
    );

    CombatSystem._tickStatusEffects();

    expect(GameState.npcs.states.npc_a.hp).toBe(14);
    expect(GameState.combat.combatants.npc_a.hp).toBe(14);
    expect(GameState.combat.combatants.npc_a.statusEffects).toEqual([]);
    expect(GameState.npcs.states.npc_a.statusEffects).toEqual([]);
  });
});
