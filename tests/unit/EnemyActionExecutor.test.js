import { describe, expect, it, vi } from 'vitest';
import {
  executeEnemyAction,
  resolveEnemyDamageResponsePassives,
} from '../../js/systems/combat/EnemyActionExecutor.js';
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
  it.each([
    ['basic', 'boss_jab', 11],
    ['special', 'boss_roar', 22],
    ['ultimate', 'boss_end', 33],
  ])('보스 %s 행동은 bossPattern의 %s 정의를 실행한다', (category, actionId, damage) => {
    const recorder = createServices();
    const enemy = {
      attack: { damage: [99, 99], accuracy: 1 },
      specialSkills: [{ id: actionId, damage: [88, 88], accuracy: 1 }],
      bossPattern: {
        basicAttacks: [
          { id: 'boss_jab', damage: [11, 11], accuracy: 1 },
          { id: 'boss_sweep', damage: [12, 12], accuracy: 1 },
        ],
        specialSkill: { id: 'boss_roar', damage: [22, 22], accuracy: 1 },
        ultimate: { id: 'boss_end', damage: [33, 33], accuracy: 1 },
      },
    };

    executeEnemyAction({
      enemy,
      action: readyAction({ actionId, category }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.services.damageTarget).toHaveBeenCalledWith(
      'player',
      damage,
      expect.objectContaining({ actionId, category }),
    );
  });

  it('0 피해 보스 행동은 공격 판정 없이 typed effect service를 실행한다', () => {
    const recorder = createServices();
    Object.assign(recorder.services, {
      healSelf: vi.fn(),
      addSelfStatus: vi.fn(),
      summonEnemy: vi.fn(() => 1),
      damageParty: vi.fn(() => [
        { targetId: 'player', result: { dodged: false, damage: 5 } },
        { targetId: 'npc_guard', result: { dodged: false, damage: 5 } },
      ]),
      setBattlefieldStatus: vi.fn(),
      modifyResource: vi.fn(),
      lockWeapon: vi.fn(),
    });
    const enemy = {
      bossPattern: {
        basicAttacks: [],
        specialSkill: {
          id: 'boss_control',
          damage: [0, 0],
          accuracy: 1,
          effects: [
            { type: 'selfHeal', value: [8, 12] },
            { type: 'selfStatus', id: 'defense_up', duration: 2, value: 0.25 },
            { type: 'summon', enemyId: 'zombie_common', count: [1, 2], row: 'front' },
            { type: 'partyDamage', value: [5, 7] },
            { type: 'targetStatus', id: 'stun', duration: 1, chance: 0.5 },
            { type: 'battlefieldStatus', id: 'acid_pool', duration: 2, value: 4 },
            { type: 'forcedMove', distance: 1 },
            { type: 'resource', resource: 'morale', value: -15 },
            { type: 'weaponLock', tag: 'firearm', duration: 1 },
            { type: 'futureEffect', value: 1 },
          ],
        },
        ultimate: null,
      },
    };

    const result = executeEnemyAction({
      enemy,
      action: readyAction({
        actionId: 'boss_control',
        category: 'special',
        targetIds: ['player', 'npc_guard'],
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.services.damageTarget).not.toHaveBeenCalled();
    expect(recorder.services.emitFx).toHaveBeenCalledTimes(2);
    expect(recorder.services.addLog).not.toHaveBeenCalled();
    expect(recorder.services.healSelf).toHaveBeenCalledOnce();
    expect(recorder.services.healSelf).toHaveBeenCalledWith(8);
    expect(recorder.services.addSelfStatus).toHaveBeenCalledWith(expect.objectContaining({
      id: 'defense_up',
      duration: 2,
      value: 0.25,
    }));
    expect(recorder.services.summonEnemy)
      .toHaveBeenCalledWith('zombie_common', 1, 'front');
    expect(recorder.services.damageParty).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ actionId: 'boss_control', category: 'special' }),
    );
    expect(recorder.services.setBattlefieldStatus).toHaveBeenCalledWith(expect.objectContaining({
      id: 'acid_pool',
      duration: 2,
      value: 4,
    }));
    expect(recorder.services.addStatus.mock.calls).toEqual([
      ['player', expect.objectContaining({ id: 'stun', duration: 1, chance: 0.5 })],
      ['npc_guard', expect.objectContaining({ id: 'stun', duration: 1, chance: 0.5 })],
    ]);
    expect(recorder.services.moveTarget.mock.calls).toEqual([
      ['player', 1],
      ['npc_guard', 1],
    ]);
    expect(recorder.services.modifyResource.mock.calls).toEqual([
      ['player', 'morale', -15],
      ['npc_guard', 'morale', -15],
    ]);
    expect(recorder.services.lockWeapon.mock.calls).toEqual([
      ['player', 'firearm', 1],
      ['npc_guard', 'firearm', 1],
    ]);
    expect(result.resolvedEffects).toContainEqual({
      type: 'futureEffect',
      skipped: true,
      reason: 'unsupported',
    });
  });

  it.each([
    {
      label: '전원 명중',
      partyResults: [
        { targetId: 'player', result: { dodged: false, damage: 6 } },
        { targetId: 'npc_guard', result: { dodged: false, damage: 6 } },
      ],
      expectedTargetIds: ['player', 'npc_guard'],
    },
    {
      label: '일부 회피',
      partyResults: [
        { targetId: 'player', result: { dodged: true, damage: 0 } },
        { targetId: 'npc_guard', result: { dodged: false, damage: 6 } },
      ],
      expectedTargetIds: ['npc_guard'],
    },
    {
      label: '전원 회피',
      partyResults: [
        { targetId: 'player', result: { dodged: true, damage: 0 } },
        { targetId: 'npc_guard', result: { missed: true, damage: 0 } },
      ],
      expectedTargetIds: [],
    },
  ])('partyDamage $label 시 실제 명중 대상에게만 후속 target effect를 적용한다', ({
    partyResults,
    expectedTargetIds,
  }) => {
    const recorder = createServices();
    Object.assign(recorder.services, {
      damageParty: vi.fn(() => partyResults),
      modifyResource: vi.fn(),
      lockWeapon: vi.fn(),
    });
    const enemy = {
      bossPattern: {
        basicAttacks: [],
        specialSkill: {
          id: 'party_control',
          damage: [0, 0],
          effects: [
            { type: 'partyDamage', value: [6, 6] },
            { type: 'targetStatus', id: 'shocked', duration: 2 },
            { type: 'forcedMove', distance: -1 },
            { type: 'resource', resource: 'morale', value: -4 },
            { type: 'weaponLock', tag: 'firearm', duration: 1 },
          ],
        },
        ultimate: null,
      },
    };

    const result = executeEnemyAction({
      enemy,
      action: readyAction({
        actionId: 'party_control',
        category: 'special',
        targetIds: ['player'],
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(result.affectedTargetIds).toEqual(expectedTargetIds);
    expect(recorder.services.addStatus.mock.calls.map(([targetId]) => targetId))
      .toEqual(expectedTargetIds);
    expect(recorder.services.moveTarget.mock.calls.map(([targetId]) => targetId))
      .toEqual(expectedTargetIds);
    expect(recorder.services.modifyResource.mock.calls.map(([targetId]) => targetId))
      .toEqual(expectedTargetIds);
    expect(recorder.services.lockWeapon.mock.calls.map(([targetId]) => targetId))
      .toEqual(expectedTargetIds);
    expect(recorder.services.emitFx.mock.calls.map(([payload]) => ({
      targetId: payload.targetId,
      miss: payload.miss,
    }))).toEqual(partyResults.map(outcome => ({
      targetId: outcome.targetId,
      miss: outcome.result.dodged === true || outcome.result.missed === true,
    })));
  });

  it('실제 피해를 주는 partyDamage는 명중 대상에게만 enemy 기본 감염을 적용한다', () => {
    const recorder = createServices();
    recorder.services.damageParty = vi.fn(() => [
      { targetId: 'player', result: { dodged: false, damage: 6 } },
      { targetId: 'npc_guard', result: { dodged: true, damage: 0 } },
    ]);
    const enemy = {
      infectionChance: 1,
      bossPattern: {
        basicAttacks: [],
        specialSkill: {
          id: 'infectious_party_hit',
          damage: [0, 0],
          effects: [{ type: 'partyDamage', value: [6, 6] }],
        },
        ultimate: null,
      },
    };

    const result = executeEnemyAction({
      enemy,
      action: readyAction({
        actionId: 'infectious_party_hit',
        category: 'special',
        targetIds: ['player'],
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(result.affectedTargetIds).toEqual(['player']);
    expect(recorder.services.addStatus).toHaveBeenCalledTimes(1);
    expect(recorder.services.addStatus).toHaveBeenCalledWith(
      'player',
      expect.objectContaining({ id: 'infection' }),
    );
  });

  it('partyDamage가 없는 명시적 0 피해 targetStatus는 기존 action 대상을 유지한다', () => {
    const recorder = createServices();
    Object.assign(recorder.services, {
      modifyResource: vi.fn(),
      lockWeapon: vi.fn(),
    });
    const enemy = {
      infectionChance: 1,
      onHitEffect: { infection: 5 },
      statusInflict: {
        id: 'legacy_burn',
        name: '레거시 화상',
        duration: 2,
        effect: { hpLossPerRound: 3 },
      },
      bossPattern: {
        basicAttacks: [],
        specialSkill: {
          id: 'zero_damage_control',
          damage: [0, 0],
          effects: [
            { type: 'targetStatus', id: 'marked', duration: 2 },
            { type: 'forcedMove', distance: 1 },
            { type: 'resource', resource: 'morale', value: -2 },
            { type: 'weaponLock', tag: 'melee', duration: 1 },
          ],
        },
        ultimate: null,
      },
    };

    const result = executeEnemyAction({
      enemy,
      action: readyAction({
        actionId: 'zero_damage_control',
        category: 'special',
        targetIds: ['player', 'npc_guard'],
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(result.affectedTargetIds).toEqual(['player', 'npc_guard']);
    expect(recorder.services.addStatus.mock.calls).toEqual([
      ['player', expect.objectContaining({ id: 'marked' })],
      ['npc_guard', expect.objectContaining({ id: 'marked' })],
    ]);
    expect(recorder.services.moveTarget.mock.calls.map(([targetId]) => targetId))
      .toEqual(['player', 'npc_guard']);
    expect(recorder.services.modifyResource.mock.calls.map(([targetId]) => targetId))
      .toEqual(['player', 'npc_guard']);
    expect(recorder.services.lockWeapon.mock.calls.map(([targetId]) => targetId))
      .toEqual(['player', 'npc_guard']);
  });

  it('피해 공격이 빗나가면 대상 effect를 건너뛰고 자기·전장 effect는 한 번씩 실행한다', () => {
    const recorder = createServices();
    Object.assign(recorder.services, {
      healSelf: vi.fn(),
      addSelfStatus: vi.fn(),
      setBattlefieldStatus: vi.fn(),
      modifyResource: vi.fn(),
      lockWeapon: vi.fn(),
    });
    const enemy = {
      bossPattern: {
        basicAttacks: [{
          id: 'boss_miss',
          damage: [4, 4],
          accuracy: 0,
          effects: [
            { type: 'selfHeal', value: 3 },
            { type: 'selfStatus', id: 'guarded', duration: 1, value: 0.2 },
            { type: 'battlefieldStatus', id: 'smoke', duration: 1, value: 1 },
            { type: 'targetStatus', id: 'stun', duration: 1 },
            { type: 'forcedMove', distance: -1 },
            { type: 'resource', resource: 'morale', value: -5 },
            { type: 'weaponLock', tag: 'melee', duration: 1 },
          ],
        }],
        specialSkill: null,
        ultimate: null,
      },
    };

    executeEnemyAction({
      enemy,
      action: readyAction({ actionId: 'boss_miss', targetIds: ['player'] }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.services.damageTarget).not.toHaveBeenCalled();
    expect(recorder.services.addStatus).not.toHaveBeenCalled();
    expect(recorder.services.moveTarget).not.toHaveBeenCalled();
    expect(recorder.services.modifyResource).not.toHaveBeenCalled();
    expect(recorder.services.lockWeapon).not.toHaveBeenCalled();
    expect(recorder.services.healSelf).toHaveBeenCalledTimes(1);
    expect(recorder.services.addSelfStatus).toHaveBeenCalledTimes(1);
    expect(recorder.services.setBattlefieldStatus).toHaveBeenCalledTimes(1);
  });

  it('damage effect는 범위가 보정된 armorPiercing과 execute modifier를 피해 service에 전달한다', () => {
    const recorder = createServices();
    const enemy = {
      bossPattern: {
        basicAttacks: [{
          id: 'boss_execute',
          accuracy: 1,
          armorPiercing: 1.5,
          executeThreshold: -0.25,
          executeBonusMultiplier: 2,
          damageType: 'chemical',
          effects: [{ type: 'damage', value: [10, 10] }],
        }],
        specialSkill: null,
        ultimate: null,
      },
    };

    const result = executeEnemyAction({
      enemy,
      action: readyAction({ actionId: 'boss_execute' }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.services.damageTarget).toHaveBeenCalledWith('player', 10, {
      actionId: 'boss_execute',
      category: 'basic',
      motionKey: 'basic_attack',
      hitIndex: 0,
      hitCount: 1,
      armorPiercing: 1,
      executeThreshold: 0,
      executeBonusMultiplier: 2,
      damageType: 'chemical',
    });
    expect(result.damageResults[0].amount).toBe(10);
    expect(result.resolvedEffects).toContainEqual(expect.objectContaining({
      type: 'damage',
      skipped: false,
    }));
  });

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

  it('0 damage 행동도 status와 forced move를 예약 대상별 한 번씩 적용한다', () => {
    const recorder = createServices();
    recorder.services.summonEnemy = vi.fn(() => 1);
    recorder.services.addNoise = vi.fn();
    const enemy = {
      timedThreat: {
        id: 'control_wave',
        accuracy: 1,
        effects: [
          { type: 'damage', value: [0, 0] },
          { type: 'status', id: 'rooted', duration: 2 },
          { type: 'move', distance: 1 },
          { type: 'summon', enemyId: 'zombie_common', count: [1, 1] },
          { type: 'noise', value: 7 },
        ],
      },
    };

    executeEnemyAction({
      enemy,
      action: readyAction({
        actionId: 'control_wave',
        category: 'timed_threat',
        targetIds: ['player', 'npc_nurse'],
        hitCount: 3,
        motionKey: 'control_wave',
      }),
      services: recorder.services,
      random: () => 0,
    });

    expect(recorder.services.damageTarget).not.toHaveBeenCalled();
    expect(recorder.services.addStatus.mock.calls).toEqual([
      ['player', { id: 'rooted', name: 'rooted', duration: 2, effect: {} }],
      ['npc_nurse', { id: 'rooted', name: 'rooted', duration: 2, effect: {} }],
    ]);
    expect(recorder.services.moveTarget.mock.calls).toEqual([
      ['player', 1],
      ['npc_nurse', 1],
    ]);
    expect(recorder.services.summonEnemy)
      .toHaveBeenCalledWith('zombie_common', 1, 'front');
    expect(recorder.services.addNoise).toHaveBeenCalledWith(7);
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

describe('resolveEnemyDamageResponsePassives', () => {
  function passiveEnemy() {
    return {
      bossPattern: {
        passives: [
          { type: 'counterAttack', actionId: 'toxic_blood_counter', maxPerRound: 1 },
          {
            type: 'resistanceShift',
            source: 'lastDamageType',
            duration: 2,
            value: 0.5,
          },
        ],
      },
    };
  }

  it('반격 횟수 상태를 소유하지 않고 service에 제한값과 최근 피해 속성을 전달한다', () => {
    const services = {
      queueCounterAction: vi.fn(),
      setResistanceShift: vi.fn(),
    };

    const result = resolveEnemyDamageResponsePassives({
      enemy: passiveEnemy(),
      attackerId: 'player',
      damageType: 'chemical',
      services,
    });

    expect(services.queueCounterAction)
      .toHaveBeenCalledWith('toxic_blood_counter', 'player', 1);
    expect(services.setResistanceShift).toHaveBeenCalledWith('chemical', 2, 0.5);
    expect(result.resolvedPassives).toEqual([
      {
        type: 'counterAttack',
        actionId: 'toxic_blood_counter',
        attackerId: 'player',
        maxPerRound: 1,
      },
      {
        type: 'resistanceShift',
        damageType: 'chemical',
        duration: 2,
        value: 0.5,
      },
    ]);
  });

  it('반격에서 재귀 반격을 건너뛰되 피해 속성이 있으면 저항 전환은 유지한다', () => {
    const services = {
      queueCounterAction: vi.fn(),
      setResistanceShift: vi.fn(),
    };

    resolveEnemyDamageResponsePassives({
      enemy: passiveEnemy(),
      attackerId: 'player',
      damageType: 'fire',
      isCounter: true,
      services,
    });

    expect(services.queueCounterAction).not.toHaveBeenCalled();
    expect(services.setResistanceShift).toHaveBeenCalledWith('fire', 2, 0.5);
  });

  it('피해 속성이 없으면 저항 전환을 건너뛰되 반격 예약은 유지한다', () => {
    const services = {
      queueCounterAction: vi.fn(),
      setResistanceShift: vi.fn(),
    };

    resolveEnemyDamageResponsePassives({
      enemy: passiveEnemy(),
      attackerId: 'npc_guard',
      services,
    });

    expect(services.queueCounterAction)
      .toHaveBeenCalledWith('toxic_blood_counter', 'npc_guard', 1);
    expect(services.setResistanceShift).not.toHaveBeenCalled();
  });
});
