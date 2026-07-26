import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';
import NoiseSystem  from '../../js/systems/NoiseSystem.js';

beforeEach(() => {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.xp = 0;
  GameState.player.characterId = 'firefighter';
  GameState.player.equipped = {};
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  GameState.modStat = vi.fn();
  GameState.createCardInstance = vi.fn(() => null);
  GameState.placeCardInRow = vi.fn(() => null);
  GameState.cards = {};
  GameState.getCardDef = () => null;
  GameState.combat = { active: true, enemies: [], targetIndex: 0, log: [], rewards: [], playerStatus: [], enemyStatus: [], xpGained: 0 };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('_onEnemyKilled — 블로터 사체 폭발', () => {
  it('약점 외 + 근접 처치 → 플레이어 추가 피해', () => {
    const e = { id: 'zombie_bloater', name: '블로터', currentHp: 0, maxHp: 50, xp: 32,
      weaknesses: ['fire', 'explosive'], lootTable: [],
      timedThreat: { id: 'self_destruct' } };
    GameState.combat.enemies = [e];
    GameState.combat._lastKillContext = { weaponType: 'blade', isSilent: false, isMelee: true };
    const hpBefore = GameState.player.hp.current;
    CombatSystem._onEnemyKilled(e);
    expect(GameState.player.hp.current).toBeLessThan(hpBefore);
  });

  it('약점(fire) 처치 → 사체 폭발 없음', () => {
    const e = { id: 'zombie_bloater', name: '블로터', currentHp: 0, maxHp: 50, xp: 32,
      weaknesses: ['fire', 'explosive'], lootTable: [],
      timedThreat: { id: 'self_destruct' } };
    GameState.combat.enemies = [e];
    GameState.combat._lastKillContext = { weaponType: 'fire', isSilent: false, isMelee: false };
    const hpBefore = GameState.player.hp.current;
    CombatSystem._onEnemyKilled(e);
    expect(GameState.player.hp.current).toBe(hpBefore);
  });

  it('약점 외 + 원거리 처치 → 사체 폭발 없음 (isMelee 가드 격리)', () => {
    const e = { id: 'zombie_bloater', name: '블로터', currentHp: 0, maxHp: 50, xp: 32,
      weaknesses: ['fire', 'explosive'], lootTable: [],
      timedThreat: { id: 'self_destruct' } };
    GameState.combat.enemies = [e];
    GameState.combat._lastKillContext = { weaponType: 'blade', isSilent: false, isMelee: false };
    const hpBefore = GameState.player.hp.current;
    CombatSystem._onEnemyKilled(e);
    expect(GameState.player.hp.current).toBe(hpBefore);
  });
});

describe('_onEnemyKilled — 스크리머 비명 차단', () => {
  const makeScreamer = () => ({ id: 'zombie_screamer', name: '스크리머', currentHp: 0, maxHp: 30,
    weaknesses: [], lootTable: [],
    timedThreat: { id: 'summon_horde', counters: { quietKill: true } } });

  it('비-silent 플레이어 무기 처치 → 비명 발동 (소음 급증)', () => {
    const spy = vi.spyOn(NoiseSystem, 'addNoise');
    const e = makeScreamer();
    GameState.combat.enemies = [e];
    GameState.combat._lastKillContext = { weaponType: 'blade', isSilent: false, isMelee: true };
    CombatSystem._onEnemyKilled(e);
    expect(spy).toHaveBeenCalled();
  });

  it('silent 무기 처치 → 비명 차단 (소음 없음)', () => {
    const spy = vi.spyOn(NoiseSystem, 'addNoise');
    const e = makeScreamer();
    GameState.combat.enemies = [e];
    GameState.combat._lastKillContext = { weaponType: 'blade', isSilent: true, isMelee: true };
    CombatSystem._onEnemyKilled(e);
    expect(spy).not.toHaveBeenCalled();
  });

  it('빈 컨텍스트 (동료/투척 처치) → 비명 미발동 (회귀 가드)', () => {
    const spy = vi.spyOn(NoiseSystem, 'addNoise');
    const e = makeScreamer();
    GameState.combat.enemies = [e];
    delete GameState.combat._lastKillContext;
    CombatSystem._onEnemyKilled(e);
    expect(spy).not.toHaveBeenCalled();
  });
});
