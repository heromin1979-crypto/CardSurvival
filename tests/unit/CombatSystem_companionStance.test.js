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
        stance,
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

describe('동료 stance 턴 의미', () => {
  it('미설정 stance는 동료 profile의 preferredStance로 해석한다', () => {
    GameState.npcs = {
      states: {
        npc_nurse: { hp: 50, maxHp: 50, isCompanion: true },
      },
    };

    expect(CombatSystem._getCompanionStance('npc_nurse')).toBe('heal');
  });

  it('profile이 없는 동료의 미설정 stance는 attack으로 fallback한다', () => {
    GameState.npcs = {
      states: {
        npc_unknown: { hp: 50, maxHp: 50, isCompanion: true },
      },
    };

    expect(CombatSystem._getCompanionStance('npc_unknown')).toBe('attack');
  });

  it('manual은 현재 동료에서 실제 스킬 카드 입력을 기다린다', () => {
    const combat = setupCompanionTurn({ stance: 'manual' });

    CombatSystem.processUntilAllyTurn();

    expect(combat.activeCombatantId).toBe('npc_nurse');
    expect(combat.phase).toBe('await_ally_input');
    expect(CombatSystem.isManualCompanionTurn()).toBe(true);
    expect(combat.actionSequence).toBe(0);
  });

  it('attack은 실제 loadout 피해 스킬을 한 번 실행하고 다음 아군으로 넘긴다', () => {
    const combat = setupCompanionTurn({ stance: 'attack' });

    CombatSystem.processUntilAllyTurn();

    expect(combat.enemies[0].currentHp).toBe(93);
    expect(GameState.noise.level).toBe(1);
    expect(combat.actionSequence).toBe(1);
    expect(combat.activeCombatantId).toBe('player');
  });

  it('hold는 레거시 피해감소 필드 대신 실제 guard의 block 토큰을 적용한다', () => {
    const combat = setupCompanionTurn({ stance: 'hold' });

    CombatSystem.processUntilAllyTurn();

    expect(combat.combatants.player.tokens.block).toBe(1);
    expect(combat.enemies[0].currentHp).toBe(100);
  });

  it('support는 실제 dog_track_weakness의 marked 토큰을 적용한다', () => {
    const combat = setupCompanionTurn({
      npcId: 'npc_dog',
      stance: 'support',
    });

    CombatSystem.processUntilAllyTurn();

    expect(combat.combatants['enemy:0'].tokens.marked).toBe(1);
    expect(combat.actionSequence).toBe(1);
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

  it('manual 카드도 남은 쿨다운이 있으면 선택할 수 없다', () => {
    setupCompanionTurn({ stance: 'manual' });
    GameState.npcs.states.npc_nurse.skillCooldowns = {
      nurse_scalpel: 1,
    };

    expect(CombatSystem.selectSkill('nurse_scalpel')).toBe(false);

    CombatSystem._tickCompanionSkillCooldowns('npc_nurse');
    expect(CombatSystem.selectSkill('nurse_scalpel')).toBe(true);
  });
});
