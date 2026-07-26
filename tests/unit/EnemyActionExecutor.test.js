import { describe, expect, it, vi } from 'vitest';
import { executeEnemyAction } from '../../js/systems/combat/EnemyActionExecutor.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import ENEMIES from '../../js/data/enemies.js';

function createServices() {
  const events = [];
  return {
    events,
    services: {
      damageTarget: vi.fn((targetId, amount) => {
        events.push({ type: 'damage', targetId, amount });
        return { dodged: false, damage: amount };
      }),
      addStatus: vi.fn((targetId, status) => {
        events.push({ type: 'status', targetId, status });
      }),
      moveTarget: vi.fn((targetId, distance) => {
        events.push({ type: 'move', targetId, distance });
      }),
      emitFx: vi.fn(),
      addLog: vi.fn(),
    },
  };
}

function readyAction(overrides = {}) {
  return {
    actionId: 'basic_attack',
    category: 'basic',
    state: 'ready',
    targetIds: ['player'],
    remainingTelegraphTurns: 0,
    hitCount: 1,
    motionKey: 'basic_attack',
    ...overrides,
  };
}

describe('executeEnemyAction', () => {
  it('같은 산성 기술을 플레이어와 동료에게 동일한 피해·상태·강제 이동 규칙으로 적용한다', () => {
    const enemy = {
      attack: { damage: [8, 8], accuracy: 1 },
      specialSkills: [{
        id: 'acid_lash',
        damage: [8, 8],
        accuracy: 1,
        effect: { forcedMove: -2 },
      }],
      statusInflict: {
        id: 'acid_burn',
        name: '산성 화상',
        duration: 2,
        effect: { hpLossPerRound: 5 },
      },
    };

    const executeAgainst = targetId => {
      const recorder = createServices();
      executeEnemyAction({
        enemy,
        action: readyAction({
          actionId: 'acid_lash',
          category: 'special',
          targetIds: [targetId],
          motionKey: 'acid_lash',
        }),
        services: recorder.services,
        random: () => 0,
      });
      return recorder.events.map(event => ({ ...event, targetId: '<target>' }));
    };

    const expected = [
      { type: 'damage', targetId: '<target>', amount: 8 },
      {
        type: 'status',
        targetId: '<target>',
        status: {
          id: 'acid_burn',
          name: '산성 화상',
          duration: 2,
          effect: { hpLossPerRound: 5 },
        },
      },
      { type: 'move', targetId: '<target>', distance: -2 },
    ];

    expect(executeAgainst('player')).toEqual(expected);
    expect(executeAgainst('npc_doctor')).toEqual(expected);
  });

  it.each([
    {
      label: '러너의 돌진',
      enemy: {
        attack: { damage: [5, 5], accuracy: 1 },
        specialSkills: [{
          id: 'runner_rush',
          damage: [10, 10],
          accuracy: 1,
          effect: { multiHit: 2 },
        }],
        statusInflict: {
          id: 'bleed',
          name: '출혈',
          duration: 3,
          effect: { hpLossPerRound: 3 },
        },
      },
      action: readyAction({
        actionId: 'runner_rush',
        category: 'special',
        targetIds: ['npc_soldier'],
        hitCount: 2,
        motionKey: 'runner_rush',
      }),
      damage: 10,
    },
    {
      label: '광견의 연속 공격',
      enemy: {
        attack: { damage: [8, 8], accuracy: 1 },
        statusInflict: {
          id: 'bleed',
          name: '출혈',
          duration: 2,
          effect: { hpLossPerRound: 3 },
        },
      },
      action: readyAction({
        targetIds: ['npc_soldier'],
        hitCount: 2,
      }),
      damage: 8,
    },
    {
      label: '호드의 연속 공격',
      enemy: ENEMIES.zombie_horde,
      action: readyAction({
        targetIds: ['npc_soldier'],
        hitCount: 2,
      }),
      damage: 6,
      statusId: 'infection',
    },
  ])('$label은 동료 대상 피해를 hitCount만큼 실행하고 상태는 완료 후 한 번만 적용한다', ({
    enemy,
    action,
    damage,
    statusId,
  }) => {
    const recorder = createServices();

    executeEnemyAction({
      enemy,
      action,
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.events.map(event => event.type)).toEqual(['damage', 'damage', 'status']);
    expect(recorder.services.damageTarget).toHaveBeenCalledTimes(2);
    expect(recorder.services.damageTarget).toHaveBeenNthCalledWith(
      1,
      'npc_soldier',
      damage,
      expect.objectContaining({ actionId: action.actionId, hitIndex: 0, hitCount: 2 }),
    );
    expect(recorder.services.damageTarget).toHaveBeenNthCalledWith(
      2,
      'npc_soldier',
      damage,
      expect.objectContaining({ actionId: action.actionId, hitIndex: 1, hitCount: 2 }),
    );
    expect(recorder.services.addStatus).toHaveBeenCalledTimes(1);
    if (statusId) {
      expect(recorder.services.addStatus).toHaveBeenCalledWith(
        'npc_soldier',
        expect.objectContaining({ id: statusId }),
      );
    }
  });

  it('실제 광견 데이터의 infectionChance와 onHitEffect를 연속타 전체에서 각각 한 번만 판정한다', () => {
    const recorder = createServices();

    executeEnemyAction({
      enemy: ENEMIES.rabid_dog,
      action: readyAction({
        targetIds: ['npc_doctor'],
        hitCount: 2,
      }),
      services: recorder.services,
      random: () => 0,
    });

    const statuses = recorder.services.addStatus.mock.calls.map(([, status]) => status);
    expect(statuses.map(status => status.id)).toEqual([
      'bleed',
      'infection',
      'infection_exposure',
    ]);
    expect(statuses.find(status => status.id === 'infection')?.effect).toEqual({ infection: 10 });
    expect(statuses.find(status => status.id === 'infection_exposure')?.effect).toEqual({ infection: 5 });
  });

  it.each([
    { enemy: ENEMIES.zombie_brute, actionId: 'slam' },
    { enemy: ENEMIES.raider_elite, actionId: 'aimed_shot' },
  ])('실제 $actionId 스킬의 최상위 stunChance를 행동당 한 번만 판정한다', ({
    enemy,
    actionId,
  }) => {
    const recorder = createServices();

    executeEnemyAction({
      enemy,
      action: readyAction({
        actionId,
        category: 'special',
        targetIds: ['player'],
        motionKey: actionId,
      }),
      services: recorder.services,
      random: () => 0,
    });

    const stunCalls = recorder.services.addStatus.mock.calls
      .filter(([, status]) => status.id === 'stun');
    expect(stunCalls).toHaveLength(1);
    expect(stunCalls[0]).toEqual([
      'player',
      {
        id: 'stun',
        name: 'stun',
        duration: 1,
        effect: { skipTurn: true },
        chance: enemy.specialSkills.find(skill => skill.id === actionId).stunChance,
      },
    ]);
  });

  it('예약 대상이 비어 있으면 반대 진영으로 대체하지 않고 아무 효과도 실행하지 않는다', () => {
    const recorder = createServices();

    executeEnemyAction({
      enemy: {
        attack: { damage: [10, 10], accuracy: 1 },
        statusInflict: {
          id: 'bleed',
          name: '출혈',
          duration: 2,
          effect: { hpLossPerRound: 3 },
        },
      },
      action: readyAction({ targetIds: [], hitCount: 2 }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.events).toEqual([]);
    expect(recorder.services.damageTarget).not.toHaveBeenCalled();
    expect(recorder.services.addStatus).not.toHaveBeenCalled();
    expect(recorder.services.moveTarget).not.toHaveBeenCalled();
  });

  it('실제 summon_horde의 0 damage는 타격을 만들지 않고 summon과 noise만 실행한다', () => {
    const recorder = createServices();
    recorder.services.summonEnemy = vi.fn(() => 1);
    recorder.services.addNoise = vi.fn();

    executeEnemyAction({
      enemy: ENEMIES.zombie_screamer,
      action: readyAction({
        actionId: 'summon_horde',
        category: 'timed_threat',
        targetIds: ['player', 'npc_nurse'],
        motionKey: 'summon_horde',
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.services.damageTarget).not.toHaveBeenCalled();
    expect(recorder.services.emitFx).not.toHaveBeenCalled();
    expect(recorder.services.addLog).not.toHaveBeenCalled();
    expect(recorder.services.summonEnemy)
      .toHaveBeenCalledWith('zombie_common', 1, 'front');
    expect(recorder.services.addNoise).toHaveBeenCalledWith(25);
  });

  it('다중 대상의 모든 타격이 끝난 뒤에만 대상별 상태를 한 번씩 판정한다', () => {
    const recorder = createServices();

    executeEnemyAction({
      enemy: {
        attack: { damage: [6, 6], accuracy: 1 },
        statusInflict: {
          id: 'infection',
          name: '감염',
          duration: 2,
          effect: { hpLossPerRound: 2 },
        },
      },
      action: readyAction({
        targetIds: ['player', 'npc_doctor'],
        hitCount: 2,
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.events.map(event => `${event.type}:${event.targetId}`)).toEqual([
      'damage:player',
      'damage:player',
      'damage:npc_doctor',
      'damage:npc_doctor',
      'status:player',
      'status:npc_doctor',
    ]);
  });

  it('spreadAttacks는 hitCount 총 타격을 targetIds에 순서대로 분배한다', () => {
    const recorder = createServices();

    executeEnemyAction({
      enemy: ENEMIES.zombie_horde,
      action: readyAction({
        targetIds: ['player', 'npc_doctor'],
        hitCount: 2,
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.services.damageTarget).toHaveBeenCalledTimes(2);
    expect(recorder.services.damageTarget.mock.calls.map(([targetId]) => targetId))
      .toEqual(['player', 'npc_doctor']);
  });

  it('CombatAiTurns 어댑터는 동료 피해·상태·강제 이동을 공용 서비스에 연결한다', () => {
    const damageCompanion = vi.fn((npcId, amount) => {
      const state = GameState.npcs.states[npcId];
      state.hp = Math.max(0, state.hp - amount);
    });
    SystemRegistry.register('NPCSystem', { damageCompanion });

    const enemy = {
      id: 'zombie_acid',
      name: '특수 감염자',
      currentHp: 40,
      maxHp: 40,
      attack: { damage: [8, 8], accuracy: 1 },
      specialSkills: [{
        id: 'acid_lash',
        damage: [8, 8],
        accuracy: 1,
        effect: { forcedMove: -2 },
      }],
      statusInflict: {
        id: 'acid_burn',
        name: '산성 화상',
        duration: 2,
        effect: { hpLossPerRound: 5 },
      },
    };
    GameState.npcs = {
      states: {
        npc_doctor: {
          hp: 40,
          maxHp: 40,
          isCompanion: true,
          statusEffects: [],
        },
      },
    };
    GameState.companions = ['npc_doctor'];
    GameState.combat = {
      active: true,
      enemies: [enemy],
      log: [],
      fxQueue: [],
      playerStatus: [],
      combatants: {
        npc_doctor: {
          id: 'npc_doctor',
          side: 'ally',
          sourceType: 'companion',
          sourceId: 'npc_doctor',
          hp: 40,
          maxHp: 40,
          tokens: {},
          statusEffects: [],
          dead: false,
        },
      },
      formations: {
        ally: [null, null, 'npc_doctor', null],
        enemy: ['enemy:0', null, null, null],
      },
    };
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._executeEnemyCommittedAction(enemy, readyAction({
      actionId: 'acid_lash',
      category: 'special',
      targetIds: ['npc_doctor'],
      hitCount: 2,
      motionKey: 'acid_lash',
    }));
    random.mockRestore();

    expect(damageCompanion).toHaveBeenCalledTimes(2);
    expect(GameState.npcs.states.npc_doctor.hp).toBe(24);
    expect(GameState.npcs.states.npc_doctor.statusEffects).toEqual([{
      id: 'acid_burn',
      name: '산성 화상',
      duration: 2,
      effect: { hpLossPerRound: 5 },
    }]);
    expect(GameState.combat.formations.ally).toEqual([null, null, null, 'npc_doctor']);
  });

  it('_enemyAttackCompanion 호환 경로도 attacksPerRound를 보존하고 상태는 한 번만 적용한다', () => {
    const damageCompanion = vi.fn((npcId, amount) => {
      const state = GameState.npcs.states[npcId];
      state.hp = Math.max(0, state.hp - amount);
    });
    SystemRegistry.register('NPCSystem', { damageCompanion });

    const enemy = {
      id: 'rabid_dog',
      name: '광견',
      currentHp: 30,
      maxHp: 30,
      attacksPerRound: 2,
      attack: { damage: [8, 8], accuracy: 1 },
      statusInflict: {
        id: 'bleed',
        name: '출혈',
        duration: 2,
        effect: { hpLossPerRound: 3 },
      },
    };
    GameState.npcs = {
      states: {
        npc_soldier: {
          hp: 40,
          maxHp: 40,
          isCompanion: true,
          statusEffects: [],
        },
      },
    };
    GameState.companions = ['npc_soldier'];
    GameState.combat = {
      active: true,
      enemies: [enemy],
      log: [],
      fxQueue: [],
      playerStatus: [],
      combatants: {
        npc_soldier: {
          id: 'npc_soldier',
          side: 'ally',
          sourceType: 'companion',
          sourceId: 'npc_soldier',
          hp: 40,
          maxHp: 40,
          tokens: {},
          statusEffects: [],
          dead: false,
        },
      },
      formations: {
        ally: [null, null, null, 'npc_soldier'],
        enemy: ['enemy:0', null, null, null],
      },
    };
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._enemyAttackCompanion(enemy, 'npc_soldier');
    random.mockRestore();

    expect(damageCompanion).toHaveBeenCalledTimes(2);
    expect(GameState.npcs.states.npc_soldier.hp).toBe(24);
    expect(GameState.npcs.states.npc_soldier.statusEffects).toHaveLength(1);
  });
});
