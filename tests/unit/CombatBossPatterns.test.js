// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';
import CombatSystem from '../../js/systems/CombatSystem.js';

function setupBoss(bossId, {
  playerHp = 100,
  playerMaxHp = 100,
  companionHp = null,
} = {}) {
  const definition = SECRET_ENEMIES[bossId];
  expect(definition, bossId).toBeDefined();
  expect(definition?.bossPattern, `${bossId}.bossPattern`).toBeDefined();
  if (!definition?.bossPattern) return null;

  document.body.innerHTML = '<div id="screen-combat"></div>';
  GameState.player.hp = { current: playerHp, max: playerMaxHp };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.player.healBonus = 1;
  GameState.player.xp = 0;
  GameState.cards = {};
  GameState.stats.morale = { current: 70, max: 100, decayPerTP: 0.2 };
  GameState.flags = {};
  GameState.ui = { ...GameState.ui, currentState: 'combat' };
  GameState.companions = companionHp === null ? [] : ['npc_guard'];
  GameState.npcs = {
    states: companionHp === null
      ? {}
      : {
          npc_guard: {
            hp: companionHp,
            maxHp: companionHp,
            isCompanion: true,
            statusEffects: [],
          },
        },
  };

  SystemRegistry.register('NPCSystem', {
    damageCompanion: (npcId, damage) => {
      const state = GameState.npcs.states[npcId];
      state.hp = Math.max(0, state.hp - damage);
    },
    getCompanionCombatBonus: () => 1,
    getNpcDef: () => null,
  });

  const enemy = CombatSystem._instantiateEnemyFromDefinition(structuredClone(definition));
  CombatSystem._setupCombat({
    enemies: [enemy],
    dangerLevel: 1,
    nodeId: `boss-pattern-${bossId}`,
  });

  return {
    combat: GameState.combat,
    enemy: GameState.combat.enemies[0],
  };
}

function addCombatItem(definitionId, quantity = 2) {
  const instanceId = `test-${definitionId}`;
  GameState.cards[instanceId] = {
    instanceId,
    definitionId,
    quantity,
    durability: 100,
    contamination: 0,
  };
  return instanceId;
}

function forceReadyAction(enemy, definition, category, targetIds) {
  enemy._bossActionState = {
    committedAction: {
      actionId: definition.id,
      category,
      state: 'ready',
      targetIds,
      remainingTelegraphTurns: 0,
      hitCount: definition.hitCount ?? 1,
      motionKey: definition.motionKey,
    },
    ultimatePending: false,
    ultimateUsed: category === 'ultimate',
    lastBasicActionId: null,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('production boss pattern execution', () => {
  it('무리의 어미 특수기는 production 턴에서 좀비 둘을 소환한다', () => {
    const scenario = setupBoss('boss_horde_mother');
    if (!scenario) return;
    const { combat, enemy } = scenario;
    const action = enemy.bossPattern.specialSkill;
    forceReadyAction(enemy, action, 'special', ['player']);

    CombatSystem._runSingleEnemyTurn(0);

    expect(combat.enemies.map(entry => entry.id)).toEqual([
      'boss_horde_mother',
      'zombie_common',
      'zombie_common',
    ]);
    expect(combat.playerStatus.map(status => status.id)).not.toContain('infection');
    expect(enemy._skillCooldowns[action.id]).toBe(action.cooldown);
  });

  it('얼어붙은 거인 특수기는 production 턴에서 자신에게 얼음 갑옷을 부여한다', () => {
    const scenario = setupBoss('boss_frozen_giant');
    if (!scenario) return;
    const { enemy } = scenario;
    const action = enemy.bossPattern.specialSkill;
    forceReadyAction(enemy, action, 'special', ['player']);

    CombatSystem._runSingleEnemyTurn(0);

    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'ice_armor',
      duration: 3,
    }));
  });

  it('유령 저격수 헤드샷은 낮은 HP 대상에게 execute 배율을 적용한다', () => {
    const executeHeadshot = (playerHp) => {
      const scenario = setupBoss('boss_phantom_sniper', {
        playerHp,
        playerMaxHp: 1000,
      });
      if (!scenario) return null;
      const { enemy } = scenario;
      const action = enemy.bossPattern.ultimate;
      forceReadyAction(enemy, action, 'ultimate', ['player']);

      CombatSystem._runSingleEnemyTurn(0);
      const actionFx = GameState.combat.fxQueue.find(entry =>
        entry.kind === 'enemyAttack' && entry.enemyIdx === 0 && entry.miss === false);
      return {
        damage: playerHp - GameState.player.hp.current,
        fx: actionFx?.fx,
      };
    };

    expect(executeHeadshot(500)).toEqual({ damage: 60, fx: 'shot' });
    expect(executeHeadshot(250)).toEqual({ damage: 90, fx: 'shot' });
  });

  it('교단 교주의 피의 의식은 production 턴에서 생존 아군 전체에 피해를 준다', () => {
    const scenario = setupBoss('boss_cult_leader', { companionHp: 80 });
    if (!scenario) return;
    const { enemy } = scenario;
    const action = enemy.bossPattern.ultimate;
    forceReadyAction(enemy, action, 'ultimate', ['player', 'npc_guard']);

    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(75);
    expect(GameState.npcs.states.npc_guard.hp).toBe(55);
    expect(GameState.combat.fxQueue).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'enemyAttack',
        fx: 'blast',
        miss: false,
      }),
      expect.objectContaining({
        kind: 'enemyAttackCompanion',
        npcId: 'npc_guard',
        fx: 'blast',
        miss: false,
      }),
    ]));
  });

  it('소방관 네메시스 백드래프트는 production 턴에서 회피한 아군을 후속 상태·이동에서 제외한다', () => {
    const scenario = setupBoss('boss_firefighter_nemesis', { companionHp: 80 });
    if (!scenario) return;
    const { combat, enemy } = scenario;
    const action = enemy.bossPattern.ultimate;
    forceReadyAction(enemy, action, 'ultimate', ['player', 'npc_guard']);
    vi.spyOn(CombatSystem, '_dealDamageToAlly').mockImplementation(({ npcId }) => (
      npcId
        ? { dodged: false, missed: false, blocked: false, damage: 30 }
        : { dodged: true, missed: false, blocked: false, damage: 0 }
    ));
    const moveSpy = vi.spyOn(CombatSystem, '_forceMoveAlly')
      .mockImplementation(() => true);

    CombatSystem._runSingleEnemyTurn(0);

    expect(combat.playerStatus.map(status => status.id)).not.toContain('burn');
    expect(GameState.npcs.states.npc_guard.statusEffects)
      .toContainEqual(expect.objectContaining({ id: 'burn', duration: 3 }));
    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(moveSpy).toHaveBeenCalledWith('npc_guard', 1, enemy);
    expect(combat.fxQueue).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'enemyAttack',
        fx: 'fire',
        miss: true,
      }),
      expect.objectContaining({
        kind: 'enemyAttackCompanion',
        npcId: 'npc_guard',
        fx: 'fire',
        dmg: 30,
        miss: false,
      }),
    ]));
  });

  it('백드래프트는 player 명중/companion 회피 결과를 대상별 production FX로 보존한다', () => {
    const scenario = setupBoss('boss_firefighter_nemesis', { companionHp: 80 });
    if (!scenario) return;
    const { combat, enemy } = scenario;
    const action = enemy.bossPattern.ultimate;
    forceReadyAction(enemy, action, 'ultimate', ['player', 'npc_guard']);
    vi.spyOn(CombatSystem, '_dealDamageToAlly').mockImplementation(({ npcId }) => (
      npcId
        ? { dodged: true, missed: false, blocked: false, damage: 0 }
        : { dodged: false, missed: false, blocked: false, damage: 30 }
    ));
    vi.spyOn(CombatSystem, '_forceMoveAlly').mockImplementation(() => true);

    CombatSystem._runSingleEnemyTurn(0);

    expect(combat.playerStatus)
      .toContainEqual(expect.objectContaining({ id: 'burn', duration: 3 }));
    expect(GameState.npcs.states.npc_guard.statusEffects.map(status => status.id))
      .not.toContain('burn');
    expect(combat.fxQueue).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'enemyAttack',
        fx: 'fire',
        dmg: 30,
        miss: false,
      }),
      expect.objectContaining({
        kind: 'enemyAttackCompanion',
        npcId: 'npc_guard',
        fx: 'fire',
        dmg: 0,
        miss: true,
      }),
    ]));
  });

  it('하수도의 왕 죽음의 회전은 production 턴에서 세 번 타격한다', () => {
    const scenario = setupBoss('boss_sewer_king');
    if (!scenario) return;
    const { enemy } = scenario;
    const action = enemy.bossPattern.basicAttacks[0];
    forceReadyAction(enemy, action, 'basic', ['player']);

    CombatSystem._runSingleEnemyTurn(0);

    const actionFx = GameState.combat.fxQueue.filter(entry =>
      entry.kind === 'enemyAttack' && entry.enemyIdx === 0 && entry.miss === false);
    expect(actionFx).toHaveLength(3);
    expect(GameState.player.hp.current).toBe(55);
  });

  it('실험체 X는 production ranked 피격 경로에서 독액 반격과 피해 속성 적응을 발동한다', () => {
    const scenario = setupBoss('boss_escaped_experiment');
    if (!scenario) return;
    const { combat, enemy } = scenario;
    const actor = combat.combatants.player;
    const target = combat.combatants['enemy:0'];
    const playerHpBefore = actor.hp;
    const effect = { type: 'damage', value: [100, 100], damageType: 'fire' };

    CombatSystem._applyRankedDamageEffect(
      effect,
      actor,
      target,
      () => 0,
      {
        hit: true,
        crit: false,
        skill: {
          id: 'test_fire_strike',
          damageType: 'fire',
          effects: [effect],
        },
      },
    );

    expect(enemy._counterActionState).toMatchObject({
      round: combat.roundNumber,
      counts: { toxic_fluid_spray: 1 },
    });
    expect(enemy._resistanceShift).toMatchObject({
      damageType: 'fire',
      duration: 2,
      value: 0.5,
    });
    expect(GameState.player.hp.current).toBe(playerHpBefore - 10);
    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      id: 'poison',
    }));
  });

  it('식량 군벌 필살기는 production 턴에서 모든 아군의 받는 치료를 2턴간 절반으로 줄인다', () => {
    const scenario = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
      companionHp: 80,
    });
    if (!scenario) return;
    const { combat, enemy } = scenario;
    const action = enemy.bossPattern.ultimate;
    forceReadyAction(enemy, action, 'ultimate', ['player', 'npc_guard']);

    CombatSystem._runSingleEnemyTurn(0);

    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      id: 'healing_received_down',
      duration: 2,
      value: 0.5,
    }));
    expect(GameState.npcs.states.npc_guard.statusEffects)
      .toContainEqual(expect.objectContaining({
        id: 'healing_received_down',
        duration: 2,
        value: 0.5,
      }));

  });

  it('player 상태는 ranked 저장소에서 라운드당 한 번만 tick되고 legacy mirror와 함께 감소한다', () => {
    const scenario = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
    });
    if (!scenario) return;
    const { combat, enemy } = scenario;
    const action = enemy.bossPattern.ultimate;
    forceReadyAction(enemy, action, 'ultimate', ['player']);
    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._addAllyStatus('player', {
      id: 'test_dot',
      name: '테스트 지속 피해',
      duration: 2,
      effect: { hpLossPerRound: 5 },
    });
    const hpBefore = GameState.player.hp.current;

    CombatSystem._onRoundStart(combat);

    expect(GameState.player.hp.current).toBe(hpBefore - 5);
    expect(combat.combatants.player.hp).toBe(hpBefore - 5);
    for (const statuses of [
      combat.playerStatus,
      combat.combatants.player.statusEffects,
    ]) {
      expect(statuses).toContainEqual(expect.objectContaining({
        id: 'test_dot',
        duration: 1,
      }));
      expect(statuses).toContainEqual(expect.objectContaining({
        id: 'healing_received_down',
        duration: 1,
        value: 0.5,
      }));
    }

    CombatSystem._onRoundStart(combat);

    expect(GameState.player.hp.current).toBe(hpBefore - 10);
    expect(combat.combatants.player.hp).toBe(hpBefore - 10);
    for (const ids of [
      combat.playerStatus.map(status => status.id),
      combat.combatants.player.statusEffects.map(status => status.id),
    ]) {
      expect(ids).not.toContain('test_dot');
      expect(ids).not.toContain('healing_received_down');
    }
  });

  it('실제 useItem action은 치료 감소를 적용하고 아이템·턴·비HP 효과를 그대로 소비한다', () => {
    const scenario = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
    });
    if (!scenario) return;
    const { combat, enemy } = scenario;
    const action = enemy.bossPattern.ultimate;
    forceReadyAction(enemy, action, 'ultimate', ['player']);
    CombatSystem._runSingleEnemyTurn(0);
    combat._identityFirstMedicalUsed = true;
    GameState.stats.infection = { current: 40, max: 100 };
    GameState.stats.morale = { current: 70, max: 100 };
    const itemId = addCombatItem('first_aid_kit');
    const roundBefore = combat.round;
    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});

    CombatSystem.resolveAction('useItem', itemId);

    expect(GameState.player.hp.current).toBe(65);
    expect(combat.combatants.player.hp).toBe(65);
    expect(GameState.cards[itemId]?.quantity).toBe(1);
    expect(combat.round).toBe(roundBefore + 1);
    expect(GameState.stats.infection.current).toBe(10);
    expect(GameState.stats.morale.current).toBe(80);
    expect(combat.fxQueue).toContainEqual(expect.objectContaining({
      kind: 'useItem',
      label: '+25',
    }));
  });

  it('실제 useItem action은 최대 HP 초과분을 회복량으로 표시하지 않는다', () => {
    const scenario = setupBoss('food_warlord', {
      playerHp: 99,
      playerMaxHp: 100,
    });
    if (!scenario) return;
    const { combat } = scenario;
    combat._identityFirstMedicalUsed = true;
    const itemId = addCombatItem('bandage');
    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});

    CombatSystem.resolveAction('useItem', itemId);

    expect(GameState.player.hp.current).toBe(100);
    expect(combat.combatants.player.hp).toBe(100);
    expect(combat.fxQueue).toContainEqual(expect.objectContaining({
      kind: 'useItem',
      label: '+1',
    }));
  });

  it('실제 useItem action은 강한 치료 감소 중에도 양수 치료를 최소 1 HP 적용한다', () => {
    const scenario = setupBoss('food_warlord', {
      playerHp: 0,
      playerMaxHp: 100,
    });
    if (!scenario) return;
    const { combat } = scenario;
    combat.combatants.player.hp = 0;
    combat.combatants.player.deathsDoor = true;
    combat.combatants.player.dead = false;
    CombatSystem._addAllyStatus('player', {
      id: 'healing_received_down',
      name: '치유 억제',
      duration: 2,
      value: 0.99,
      effect: {},
    });
    combat._identityFirstMedicalUsed = true;
    const itemId = addCombatItem('bandage');
    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});

    CombatSystem.resolveAction('useItem', itemId);

    expect(GameState.player.hp.current).toBe(1);
    expect(combat.combatants.player.hp).toBe(1);
    expect(combat.combatants.player.deathsDoor).toBe(false);
    expect(combat.fxQueue).toContainEqual(expect.objectContaining({
      kind: 'useItem',
      label: '+1',
    }));
  });
});
