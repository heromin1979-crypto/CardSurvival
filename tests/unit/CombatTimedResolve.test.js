import { beforeEach, describe, expect, it, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import NoiseSystem from '../../js/systems/NoiseSystem.js';
import { ENEMIES, instantiateEnemy } from '../../js/data/enemies.js';
import { buildEnemyProfile } from '../../js/systems/combat/EnemyCombatAdapter.js';

function combatant(id, sourceType, hp) {
  return {
    id,
    side: 'ally',
    sourceType,
    sourceId: id,
    hp,
    maxHp: hp,
    tokens: {},
    statusEffects: [],
    dead: false,
  };
}

function readyTimedAction(enemy, targetIds) {
  return {
    actionId: enemy.timedThreat.id,
    category: 'timed_threat',
    state: 'ready',
    targetIds,
    remainingTelegraphTurns: 0,
    hitCount: enemy.timedThreat.hitCount,
    motionKey: enemy.timedThreat.motionKey,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  GameState.player.hp = { current: 100, max: 100 };
  GameState.companions = ['npc_nurse'];
  GameState.npcs = {
    states: {
      npc_nurse: {
        hp: 80,
        maxHp: 80,
        isCompanion: true,
        statusEffects: [],
      },
    },
  };
  GameState.modStat = vi.fn();
  GameState.combat = {
    active: true,
    enemies: [],
    targetIndex: 0,
    log: [],
    playerStatus: [],
    enemyStatus: [],
    dangerLevel: 3,
    turnQueue: [],
    combatants: {
      player: combatant('player', 'player', 100),
      npc_nurse: combatant('npc_nurse', 'companion', 80),
    },
    formations: {
      ally: [null, null, 'npc_nurse', 'player'],
      enemy: [],
    },
  };
  SystemRegistry.register('NPCSystem', {
    damageCompanion: (npcId, damage) => {
      const state = GameState.npcs.states[npcId];
      state.hp = Math.max(0, state.hp - damage);
    },
  });
});

describe('_resolveTimedThreat', () => {
  it('self_destruct는 예약한 플레이어와 동료 각각에게 독립 피해·감염을 적용하고 본체를 사망시킨다', () => {
    const enemy = instantiateEnemy(ENEMIES.zombie_bloater);
    enemy.currentHp = 50;
    enemy.maxHp = 50;
    GameState.combat.enemies = [enemy];
    vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._resolveTimedThreat(
      enemy,
      readyTimedAction(enemy, ['player', 'npc_nurse']),
    );

    expect(GameState.player.hp.current).toBe(75);
    expect(GameState.npcs.states.npc_nurse.hp).toBe(55);
    expect(GameState.combat.playerStatus).toEqual([
      expect.objectContaining({ id: 'infection', effect: { infection: 15 } }),
    ]);
    expect(GameState.combat.combatants.npc_nurse.statusEffects).toEqual([
      expect.objectContaining({ id: 'infection', effect: { infection: 15 } }),
    ]);
    expect(enemy.currentHp).toBe(0);
  });

  it('charge_strike는 UI에 예약된 동료 한 명만 피해·기절·밀치기 대상으로 사용한다', () => {
    const enemy = instantiateEnemy(ENEMIES.zombie_charger);
    enemy.currentHp = 40;
    enemy.maxHp = 40;
    GameState.combat.enemies = [enemy];
    vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._resolveTimedThreat(
      enemy,
      readyTimedAction(enemy, ['npc_nurse']),
    );

    expect(GameState.player.hp.current).toBe(100);
    expect(GameState.npcs.states.npc_nurse.hp).toBe(50);
    expect(GameState.combat.playerStatus).toEqual([]);
    expect(GameState.combat.combatants.npc_nurse.statusEffects).toEqual([
      expect.objectContaining({ id: 'stun', duration: 1 }),
    ]);
    expect(GameState.combat.formations.ally).toEqual([null, 'npc_nurse', null, 'player']);
  });

  it('summon_horde는 effects에 선언된 zombie_common만 count 범위만큼 소환하고 소음을 낸다', () => {
    const enemy = instantiateEnemy(ENEMIES.zombie_screamer);
    enemy.currentHp = 30;
    enemy.maxHp = 30;
    GameState.combat.enemies = [enemy];
    const summonSpy = vi.spyOn(CombatSystem, '_summonEnemyById').mockReturnValue(1);
    const noiseSpy = vi.spyOn(NoiseSystem, 'addNoise');
    vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._resolveTimedThreat(
      enemy,
      readyTimedAction(enemy, ['player']),
    );

    expect(summonSpy).toHaveBeenCalledWith('zombie_common', 1, 'front', enemy);
    expect(noiseSpy).toHaveBeenCalledWith(25);
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
