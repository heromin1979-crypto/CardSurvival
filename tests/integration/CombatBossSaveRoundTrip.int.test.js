// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import CombatSystem from '../../js/systems/CombatSystem.js';

function bossDefinition() {
  return {
    id: 'boss_save_fixture',
    name: '저장 시험 보스',
    icon: '💾',
    type: 'zombie',
    isBoss: true,
    hp: { min: 100, max: 100 },
    attack: { damage: [5, 5], accuracy: 1 },
    defense: 0,
    aiPattern: 'normal',
    bossPattern: {
      basicAttacks: [
        {
          id: 'save_basic_a',
          category: 'basic',
          name: '저장 공격 A',
          damage: [5, 5],
          accuracy: 1,
          targetPolicy: 'player',
          motionKey: 'save_basic_a',
          effects: [],
        },
        {
          id: 'save_basic_b',
          category: 'basic',
          name: '저장 공격 B',
          damage: [6, 6],
          accuracy: 1,
          targetPolicy: 'player',
          motionKey: 'save_basic_b',
          effects: [],
        },
      ],
      specialSkill: {
        id: 'save_special',
        category: 'special',
        name: '저장 특수기',
        damage: [9, 9],
        accuracy: 1,
        cooldown: 4,
        chance: 0.3,
        telegraphTurns: 2,
        targetPolicy: 'player',
        motionKey: 'save_special',
        effects: [],
      },
      ultimate: {
        id: 'save_ultimate',
        category: 'ultimate',
        name: '저장 필살기',
        damage: [20, 20],
        accuracy: 1,
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
        targetPolicy: 'player',
        motionKey: 'save_ultimate',
        effects: [],
      },
      passives: [],
    },
  };
}

let baselineSave;

beforeEach(() => {
  vi.restoreAllMocks();
  if (baselineSave) GameState.deserialize(baselineSave);
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.ui = { ...GameState.ui, currentState: 'main' };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  SystemRegistry.register('NPCSystem', {
    damageCompanion: vi.fn(),
    getCompanionCombatBonus: () => 1,
    getNpcDef: () => null,
  });
  baselineSave = GameState.serialize();
});

describe('보스 전투 상태 저장 왕복', () => {
  it('예약·사용·직전 기본기·committed action·쿨다운을 동일하게 복원한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = CombatSystem._instantiateEnemyFromDefinition(bossDefinition());
    CombatSystem._setupCombat({
      enemies: [enemy],
      dangerLevel: 1,
      nodeId: 'boss-save-test',
    });
    const liveBoss = GameState.combat.enemies[0];

    expect(liveBoss._bossActionState).toBeDefined();
    liveBoss._bossActionState = {
      ultimatePending: true,
      ultimateUsed: false,
      lastBasicActionId: 'save_basic_b',
      committedAction: {
        actionId: 'save_special',
        category: 'special',
        state: 'telegraphing',
        targetIds: ['player'],
        remainingTelegraphTurns: 1,
        hitCount: 1,
        motionKey: 'save_special',
      },
    };
    liveBoss._skillCooldowns = {
      save_special: 3,
      save_ultimate: 0,
    };
    const expectedState = structuredClone(liveBoss._bossActionState);
    const expectedCooldowns = structuredClone(liveBoss._skillCooldowns);

    const save = GameState.serialize();
    liveBoss._bossActionState = null;
    liveBoss._skillCooldowns = {};
    GameState.deserialize(save);

    const restored = GameState.combat.enemies[0];
    expect(restored._bossActionState).toEqual(expectedState);
    expect(restored._skillCooldowns).toEqual(expectedCooldowns);
    expect(restored._bossActionState.committedAction).toMatchObject({
      actionId: 'save_special',
      category: 'special',
      state: 'telegraphing',
      targetIds: ['player'],
      remainingTelegraphTurns: 1,
    });
  });
});
