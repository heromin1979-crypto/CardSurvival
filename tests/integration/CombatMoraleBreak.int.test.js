import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';
import BALANCE      from '../../js/data/gameBalance.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.xp = 0;
  GameState.player.characterId = 'soldier';
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.modStat = vi.fn();
  GameState.createCardInstance = vi.fn(() => null);
  GameState.placeCardInRow = vi.fn(() => null);
  GameState.cards = {};
  GameState.getCardDef = () => null;
});

describe('사기 격파', () => {
  it('인간 적 사망 시 살아있는 인간 적 사기 감소', () => {
    const dead  = { id: 'raider', name: '약탈자', type: 'human', currentHp: 0, maxHp: 50, xp: 25, currentMorale: 100, lootTable: [] };
    const alive = { id: 'raider', name: '약탈자', type: 'human', currentHp: 40, maxHp: 50, currentMorale: 100, lootTable: [] };
    GameState.combat = { active: true, enemies: [dead, alive], targetIndex: 0, log: [], rewards: [], playerStatus: [], enemyStatus: [], xpGained: 0 };
    CombatSystem._onEnemyKilled(dead);
    expect(alive.currentMorale).toBe(100 - BALANCE.combat.moraleBreak.allyDeathMoraleDmg);
  });

  it('사기 ≤ 0 인 적은 rout 판정으로 currentHp 0', () => {
    const e = { id: 'raider', name: '약탈자', type: 'human', currentHp: 30, maxHp: 50, currentMorale: 0, lootTable: [], attack: { damage: [5, 8], accuracy: 1.0 }, aiPattern: 'aggressive', specialSkills: [], _skillCooldowns: {} };
    GameState.combat = { active: true, enemies: [e], targetIndex: 0, log: [], rewards: [], playerStatus: [], enemyStatus: [], turnQueue: [], dangerLevel: 2 };
    CombatSystem._runSingleEnemyTurn(0);
    expect(e.currentHp).toBe(0);
    expect(e._routed).toBe(true);
  });
});
