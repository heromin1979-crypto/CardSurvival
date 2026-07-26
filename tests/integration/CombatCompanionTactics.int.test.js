import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

function enemy(hp = 100, {
  id = 'zombie_common',
  row = 'front',
} = {}) {
  return {
    id,
    name: '감염자',
    currentHp: hp,
    maxHp: hp,
    row,
    defense: 0,
    attack: { damage: [1, 1], accuracy: 0 },
    specialSkills: [],
    weaknesses: [],
    resistances: [],
    lootTable: [],
    _skillCooldowns: {},
    _statusEffects: [],
  };
}

function setupCompanionCombat({
  npcId = 'npc_nurse',
  stance = 'heal',
  playerHp = 10,
  playerMaxHp = 100,
  enemyHp = 100,
  enemies = null,
} = {}) {
  GameState.player.hp = { current: playerHp, max: playerMaxHp };
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
    enemies: enemies ?? [enemy(enemyHp)],
    dangerLevel: 1,
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

function runNurseScalpel(stance) {
  const combat = setupCompanionCombat({
    stance,
    playerHp: 100,
    enemyHp: 100,
  });
  combat.skillsById.nurse_scalpel.cooldown = 2;

  if (stance === 'manual') {
    expect(CombatSystem.selectSkill('nurse_scalpel')).toBe(true);
    expect(CombatSystem.selectTarget('enemy:0')).toBe(true);
    expect(CombatSystem.confirmAction().ok).toBe(true);
  } else {
    CombatSystem.processUntilAllyTurn();
  }

  return {
    enemyHp: GameState.combat.enemies[0].currentHp,
    noise: GameState.noise.level,
    cooldown: GameState.npcs.states.npc_nurse.skillCooldowns?.nurse_scalpel,
  };
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('동료 전술의 실제 스킬 command 통합', () => {
  it('레거시 공용 치료 설정 없이 combat.skillsById의 nurse_triage를 자동 실행한다', () => {
    const combat = setupCompanionCombat();

    CombatSystem.processUntilAllyTurn();

    expect(GameState.player.hp.current).toBe(18);
    expect(combat.combatants.player.hp).toBe(18);
    expect(combat.actionSequence).toBe(1);
    expect(combat.activeCombatantId).toBe('player');
  });

  it('같은 실제 스킬의 수동 카드와 자동 계획이 피해·비용·쿨다운을 한 번씩 적용한다', () => {
    const manual = runNurseScalpel('manual');
    const automatic = runNurseScalpel('attack');

    expect(manual).toEqual({
      enemyHp: 93,
      noise: 1,
      cooldown: 2,
    });
    expect(automatic).toEqual(manual);

    CombatSystem.processUntilAllyTurn();
    expect(GameState.combat.enemies[0].currentHp).toBe(automatic.enemyHp);
    expect(GameState.noise.level).toBe(automatic.noise);
    expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_scalpel)
      .toBe(automatic.cooldown);
  });

  it('manual 빠른 자세 요청은 이번 행동만 계획하고 저장 stance를 바꾸지 않는다', () => {
    const combat = setupCompanionCombat({ stance: 'manual' });

    const result = CombatSystem.requestCompanionPlan?.('heal', 'npc_nurse');

    expect(result?.ok).toBe(true);
    expect(GameState.player.hp.current).toBe(18);
    expect(GameState.npcs.states.npc_nurse.stance).toBe('manual');
    expect(combat.activeCombatantId).toBe('player');
  });

  it('계획 canUse는 잘못된 사용 랭크에서 효과·비용·쿨다운을 소비하지 않는다', () => {
    const combat = setupCompanionCombat({
      stance: 'attack',
      playerHp: 100,
    });
    combat.skillsById.nurse_scalpel.cooldown = 2;
    combat.formations.ally = ['npc_nurse', null, null, 'player'];

    CombatSystem.processUntilAllyTurn();

    expect(combat.enemies[0].currentHp).toBe(100);
    expect(GameState.noise.level).toBe(0);
    expect(GameState.npcs.states.npc_nurse.skillCooldowns?.nurse_scalpel)
      .toBeUndefined();
    expect(combat.actionSequence).toBe(0);
    expect(combat.activeCombatantId).toBe('player');
  });

  it('죽은 전열 슬롯을 턴 경계에서 압축해 계획과 실행이 같은 formation을 사용한다', () => {
    const combat = setupCompanionCombat({
      stance: 'attack',
      playerHp: 100,
      enemies: [
        enemy(1),
        enemy(100, { id: 'zombie_runner', row: 'back' }),
      ],
    });
    combat.enemies[0].currentHp = 0;
    combat.combatants['enemy:0'].hp = 0;
    combat.combatants['enemy:0'].dead = true;
    expect(combat.formations.enemy).toEqual([
      'enemy:0',
      null,
      'enemy:1',
      null,
    ]);

    CombatSystem._prepareCompanionTurn('npc_nurse');
    const beforePlan = {
      hp: combat.enemies[1].currentHp,
      noise: GameState.noise.level,
      actionSequence: combat.actionSequence,
      cooldowns: GameState.npcs.states.npc_nurse.skillCooldowns,
    };
    const plan = CombatSystem._planCompanionAction('npc_nurse', 'attack');

    expect(plan).toEqual({
      skillId: 'nurse_scalpel',
      targetId: 'enemy:1',
      reason: 'lowest_hp_enemy',
    });
    expect({
      hp: combat.enemies[1].currentHp,
      noise: GameState.noise.level,
      actionSequence: combat.actionSequence,
      cooldowns: GameState.npcs.states.npc_nurse.skillCooldowns,
    }).toEqual(beforePlan);

    CombatSystem.processUntilAllyTurn();

    expect(combat.formations.enemy).toEqual([
      'enemy:1',
      null,
      null,
      null,
    ]);
    expect(combat.enemies[1].currentHp).toBe(93);
    expect(GameState.noise.level).toBe(1);
    expect(combat.actionSequence).toBe(1);
    expect(combat.activeCombatantId).toBe('player');
  });
});
