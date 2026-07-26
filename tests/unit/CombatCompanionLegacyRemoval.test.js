import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import * as CombatActions from '../../js/systems/CombatActions.js';
import CombatSystem from '../../js/systems/CombatSystem.js';

function setupLegacyCombat() {
  GameState.player.hp = { current: 10, max: 100 };
  GameState.companions = ['npc_nurse'];
  GameState.npcs = {
    states: {
      npc_nurse: {
        hp: 50,
        maxHp: 50,
        isCompanion: true,
      },
    },
  };
  GameState.combat = {
    active: true,
    enemies: [{
      id: 'zombie_common',
      name: '감염자',
      currentHp: 100,
      maxHp: 100,
      _statusEffects: [],
    }],
    targetIndex: 0,
    round: 0,
    lastHit: null,
    playerStatus: [],
    enemyStatus: [],
    log: [],
    playerGuard: null,
  };
}

beforeEach(() => {
  setupLegacyCombat();
  SystemRegistry.register('NPCSystem', {
    getCompanionCombatBonus: () => 1,
  });
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});
});

afterEach(() => {
  SystemRegistry.register('NPCSystem', null);
  vi.restoreAllMocks();
});

describe('레거시 공용 동료 행동 제거', () => {
  it.each(['companionAttack', 'companionHeal'])(
    'resolveAction(%s)은 별도 피해·치료·쿨다운 경로를 실행하지 않는다',
    (action) => {
      const before = {
        enemyHp: GameState.combat.enemies[0].currentHp,
        playerHp: GameState.player.hp.current,
        round: GameState.combat.round,
      };

      const result = CombatSystem.resolveAction(action);

      expect(result).toBe(false);
      expect(GameState.combat.enemies[0].currentHp).toBe(before.enemyHp);
      expect(GameState.player.hp.current).toBe(before.playerHp);
      expect(GameState.combat.round).toBe(before.round);
      expect(GameState.combat).not.toHaveProperty('_companionAttackCooldown');
      expect(GameState.combat).not.toHaveProperty('_companionHealCooldown');
    },
  );

  it('deprecated exports, switch cases, cooldown tick, balance keys를 제거한다', () => {
    const combatSystemSource = readFileSync(
      new URL('../../js/systems/CombatSystem.js', import.meta.url),
      'utf8',
    );
    const combatActionsSource = readFileSync(
      new URL('../../js/systems/CombatActions.js', import.meta.url),
      'utf8',
    );
    const balanceSource = readFileSync(
      new URL('../../js/data/gameBalance.js', import.meta.url),
      'utf8',
    );

    expect(CombatActions).not.toHaveProperty('companionAttack');
    expect(CombatActions).not.toHaveProperty('companionHeal');
    expect(CombatActions).not.toHaveProperty('tickCompanionCooldowns');
    expect(combatSystemSource).not.toMatch(/case ['"]companion(?:Attack|Heal)['"]/);
    expect(combatSystemSource).not.toContain('tickCompanionCooldowns');
    expect(combatActionsSource).not.toMatch(
      /_companion(?:Attack|Heal)Cooldown/,
    );
    expect(balanceSource).not.toMatch(
      /companion(?:Attack|Heal)Cooldown/,
    );
  });
});
