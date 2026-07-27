import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

function setupCompanionTurn({
  npcId = 'npc_nurse',
  stance = 'manual',
  playerHp = 100,
} = {}) {
  GameState.player.hp = { current: playerHp, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.equipped = {};
  GameState.player.traits = [];
  GameState.stats.stamina = { current: 10, max: 10, decayPerTP: 0 };
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0 };
  GameState.noise = { level: 0 };
  GameState.companions = [npcId];
  GameState.npcs = {
    states: {
      [npcId]: {
        hp: 50,
        maxHp: 50,
        isCompanion: true,
        ...(stance === undefined ? {} : { stance }),
      },
    },
  };
  GameState.flags = {};
  CombatSystem._setupCombat({
    dangerLevel: 1,
    enemies: [{
      id: 'zombie_common',
      name: '감염자',
      currentHp: 100,
      maxHp: 100,
      row: 'front',
      defense: 0,
      attack: { damage: [1, 1], accuracy: 0 },
      specialSkills: [],
      weaknesses: [],
      resistances: [],
      lootTable: [],
      _skillCooldowns: {},
      _statusEffects: [],
    }],
  });

  const combat = GameState.combat;
  combat.turnQueue = [
    { type: 'companion', id: npcId, combatantId: npcId, order: 0 },
    { type: 'player', combatantId: 'player', order: 1 },
    { type: 'enemy', enemyIdx: 0, combatantId: 'enemy:0', order: 2 },
  ];
  combat.activeIdx = 0;
  combat.activeTurnIndex = 0;
  combat.activeCombatantId = npcId;
  CombatSystem.beginActiveTurn();
  return combat;
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('동료 턴 수동 입력 계약', () => {
  it.each([
    ['manual'],
    ['attack'],
    ['heal'],
    ['support'],
    ['hold'],
    [undefined],
  ])('저장 stance=%s여도 동료 턴은 수동 입력에서 멈춘다', (stance) => {
    const combat = setupCompanionTurn({ stance });
    const enemyHpBefore = combat.enemies[0].currentHp;

    CombatSystem.processUntilAllyTurn();

    expect(combat.phase).toBe('await_ally_input');
    expect(combat.activeCombatantId).toBe('npc_nurse');
    expect(CombatSystem.isManualCompanionTurn(combat)).toBe(true);
    expect(combat.enemies[0].currentHp).toBe(enemyHpBefore);
    expect(combat.actionSequence).toBe(0);
  });

  it('CombatSystem은 동료 자동 계획 public API를 노출하지 않는다', () => {
    expect(CombatSystem.requestCompanionPlan).toBeUndefined();
    expect(CombatSystem._runCompanionTurn).toBeUndefined();
    expect(CombatSystem._getCompanionStance).toBeUndefined();
    expect(CombatSystem._planCompanionAction).toBeUndefined();
  });

  it('legacy AI loop prepares the next companion and returns without acting', () => {
    const combat = setupCompanionTurn({ stance: 'attack' });
    combat.turnQueue = [
      { type: 'player', combatantId: 'player', order: 0 },
      {
        type: 'companion',
        id: 'npc_nurse',
        combatantId: 'npc_nurse',
        order: 1,
      },
      { type: 'enemy', enemyIdx: 0, combatantId: 'enemy:0', order: 2 },
    ];
    combat.activeIdx = 0;
    combat.activeTurnIndex = 0;
    combat.activeCombatantId = 'player';
    GameState.npcs.states.npc_nurse.skillCooldowns = {
      nurse_scalpel: 2,
    };
    CombatSystem.beginActiveTurn();
    const enemyHpBefore = combat.enemies[0].currentHp;

    CombatSystem._processAiTurns();

    expect(combat.activeIdx).toBe(1);
    expect(combat.activeCombatantId).toBe('npc_nurse');
    expect(combat.phase).toBe('await_ally_input');
    expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_scalpel)
      .toBe(1);
    expect(combat.enemies[0].currentHp).toBe(enemyHpBefore);
    expect(combat.actionSequence).toBe(0);
  });
});

describe('동료 실제 스킬 쿨다운', () => {
  it('같은 동료 턴을 다시 준비해도 한 번만 감소한다', () => {
    const combat = setupCompanionTurn({ stance: 'manual' });
    GameState.npcs.states.npc_nurse.skillCooldowns = {
      nurse_triage: 3,
    };

    CombatSystem._prepareCompanionTurn('npc_nurse');
    CombatSystem._prepareCompanionTurn('npc_nurse');

    expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_triage)
      .toBe(2);

    combat.roundNumber += 1;
    CombatSystem._prepareCompanionTurn('npc_nurse');
    expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_triage)
      .toBe(1);
  });

  it('수동 카드의 스킬 쿨다운이 있으면 선택할 수 없다', () => {
    setupCompanionTurn({ stance: 'manual' });
    GameState.npcs.states.npc_nurse.skillCooldowns = {
      nurse_scalpel: 1,
    };

    expect(CombatSystem.selectSkill('nurse_scalpel')).toBe(false);

    CombatSystem._tickCompanionSkillCooldowns('npc_nurse');
    expect(CombatSystem.selectSkill('nurse_scalpel')).toBe(true);
  });
});
