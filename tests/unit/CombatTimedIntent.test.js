import { describe, it, expect, beforeEach } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';
import { ENEMIES, instantiateEnemy } from '../../js/data/enemies.js';
import { buildEnemyProfile } from '../../js/systems/combat/EnemyCombatAdapter.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.equipped = {};
  GameState.companions = [];
  GameState.npcs = null;
  GameState.getCardDef = () => null;
});

function makeCombat() {
  return { enemies: [], targetIndex: 0, log: [], playerStatus: [] };
}

describe('_decideNextIntent — timedThreat', () => {
  it('충전 중 블로터: action=timed_threat, 💥 아이콘, countdown 반영', () => {
    const enemy = {
      id: 'zombie_bloater', name: '블로터', currentHp: 50, maxHp: 50,
      aiPattern: 'normal', specialSkills: [], _skillCooldowns: {},
      timedThreat: { id: 'self_destruct', chargeTurns: 3 },
      _chargeRemaining: 2,
    };
    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);
    expect(intent.action).toBe('timed_threat');
    expect(intent.iconEmoji).toBe('💥');
    expect(intent.countdown).toBe(2);
    expect(intent.threatId).toBe('self_destruct');
  });

  it('_chargeRemaining null이면 기존 attack 의도', () => {
    const enemy = {
      id: 'e', name: 'E', currentHp: 30, maxHp: 30,
      aiPattern: 'normal', specialSkills: [], _skillCooldowns: {},
      _chargeRemaining: null,
    };
    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);
    expect(intent.action).toBe('attack');
  });

  it('combatProfile does not replace timedThreat intent on generated enemies', () => {
    const enemy = instantiateEnemy(ENEMIES.zombie_bloater);
    enemy._chargeRemaining = 2;
    const profile = buildEnemyProfile(enemy);

    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);

    expect(profile.skillIds).toEqual(['bloater_swipe', 'bloater_self_destruct']);
    expect(intent.action).toBe('timed_threat');
    expect(intent.threatId).toBe('self_destruct');
    expect(intent.countdown).toBe(2);
  });
});
