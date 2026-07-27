import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    expect(intent.state).toBe('telegraphing');
    expect(intent.countdown).toBe(2);
    expect(intent.threatId).toBe('self_destruct');
  });

  it('돌진 준비가 끝나면 0턴 대신 ready와 다음 행동 돌진을 표시한다', () => {
    const enemy = {
      id: 'zombie_charger', name: '돌진자', currentHp: 40, maxHp: 40,
      aiPattern: 'aggressive', specialSkills: [], _skillCooldowns: {},
      timedThreat: { id: 'charge_strike', chargeTurns: 1 },
      _chargeRemaining: 0,
    };

    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);

    expect(intent.action).toBe('timed_threat');
    expect(intent.threatId).toBe('charge_strike');
    expect(intent.state).toBe('ready');
    expect(intent.countdown).toBeNull();
    expect(intent.label).toBe('다음 행동에 돌진');
  });

  it('UI에 노출한 ready committed action 객체를 다음 실행까지 그대로 사용한다', () => {
    const enemy = {
      id: 'zombie_charger', name: '돌진자', currentHp: 40, maxHp: 40,
      row: 'front', attackType: 'melee',
      aiPattern: 'aggressive', specialSkills: [], _skillCooldowns: {},
      timedThreat: { id: 'charge_strike', chargeTurns: 1 },
      _chargeRemaining: 0,
    };
    GameState.combat = {
      active: true,
      enemies: [enemy],
      targetIndex: 0,
      log: [],
      playerStatus: [],
      enemyStatus: [],
      dangerLevel: 3,
      turnQueue: [],
    };

    CombatSystem._decideNextIntent(enemy, GameState.combat, GameState);
    const readyAction = enemy._enemyActionState.committedAction;
    let executedAction = null;
    vi.spyOn(CombatSystem, '_resolveTimedThreat').mockImplementation((_enemy, action) => {
      executedAction = action;
    });

    CombatSystem._runSingleEnemyTurn(0);

    expect(executedAction).toBe(readyAction);
    expect(executedAction.actionId).toBe('charge_strike');
  });

  it.each([
    ['self_destruct', 3, '3턴 후 자폭'],
    ['self_destruct', 2, '2턴 후 자폭'],
    ['self_destruct', 1, '1턴 후 자폭'],
    ['summon_horde', 3, '3턴 후 증원 소환 · 조용히 처치하면 취소'],
    ['summon_horde', 2, '2턴 후 증원 소환 · 조용히 처치하면 취소'],
    ['summon_horde', 1, '1턴 후 증원 소환 · 조용히 처치하면 취소'],
    ['charge_strike', 1, '1턴 후 돌진'],
  ])('%s의 남은 %i턴은 telegraphing 상태다', (threatId, remaining, label) => {
    const enemy = {
      id: `enemy_${threatId}`, name: threatId, currentHp: 40, maxHp: 40,
      aiPattern: 'normal', specialSkills: [], _skillCooldowns: {},
      timedThreat: { id: threatId, chargeTurns: 3 },
      _chargeRemaining: remaining,
    };

    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);

    expect(intent.state).toBe('telegraphing');
    expect(intent.countdown).toBe(remaining);
    expect(intent.label).toBe(label);
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

  it('generated charging enemy는 combatProfile 기본공격과 예약 timedThreat를 함께 유지한다', () => {
    const enemy = instantiateEnemy(ENEMIES.zombie_bloater);
    enemy._chargeRemaining = 2;
    const profile = buildEnemyProfile(enemy);

    const intent = CombatSystem._decideNextIntent(enemy, makeCombat(), GameState);

    expect(profile.skillIds).toEqual(['bloater_swipe', 'bloater_self_destruct']);
    expect(intent).toMatchObject({
      action: 'attack',
      actionId: 'bloater_swipe',
    });
    expect(enemy._timedThreatIntent).toMatchObject({
      action: 'timed_threat',
      threatId: 'self_destruct',
      countdown: 2,
    });
  });
});
