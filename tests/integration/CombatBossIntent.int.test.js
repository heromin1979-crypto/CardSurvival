// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import StatSystem from '../../js/systems/StatSystem.js';
import SkillSystem from '../../js/systems/SkillSystem.js';
import { executeSkillCommand } from '../../js/systems/combat/CombatSkillSystem.js';


// 이 파일은 적 치명타를 검증하지 않는다. 치명타는 확률 요소라 고정 피해값 검증을 흔들므로
// 여기서는 비활성으로 고정한다 — 치명타 자체는 EnemyCriticalAndDisplay.test.js가 다룬다.
CombatSystem._rollEnemyCrit = damage => ({ damage, isCrit: false });

function bossDefinition(overrides = {}) {
  return {
    id: 'boss_intent_fixture',
    name: '의도 시험 보스',
    icon: '👹',
    type: 'zombie',
    isBoss: true,
    hp: { min: 100, max: 100 },
    attack: { damage: [99, 99], accuracy: 1 },
    defense: 0,
    aiPattern: 'normal',
    bossPattern: {
      basicAttacks: [
        {
          id: 'boss_jab',
          category: 'basic',
          name: '찌르기',
          damage: [7, 7],
          accuracy: 1,
          targetPolicy: 'player',
          motionKey: 'boss_jab_motion',
          effects: [],
        },
        {
          id: 'boss_sweep',
          category: 'basic',
          name: '휩쓸기',
          damage: [11, 11],
          accuracy: 1,
          targetPolicy: 'all',
          targetCount: 2,
          motionKey: 'boss_sweep_motion',
          effects: [],
        },
      ],
      specialSkill: {
        id: 'boss_special',
        category: 'special',
        name: '특수 난타',
        damage: [33, 33],
        accuracy: 1,
        cooldown: 3,
        chance: 0.3,
        targetPolicy: 'player',
        motionKey: 'boss_special_motion',
        effects: [],
      },
      ultimate: {
        id: 'boss_ultimate',
        category: 'ultimate',
        name: '종말',
        damage: [44, 44],
        accuracy: 1,
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
        targetPolicy: 'player',
        motionKey: 'boss_ultimate_motion',
        effects: [],
      },
      passives: [],
    },
    ...overrides,
  };
}

function setupCombat(definition = bossDefinition(), {
  playerHp = 100,
  companionHp = 80,
} = {}) {
  document.body.innerHTML = '<div id="screen-combat"></div>';
  GameState.player.hp = { current: playerHp, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.stats.morale = { current: 70, max: 100, decayPerTP: 0.2 };
  GameState.flags = GameState.flags ?? {};
  GameState.ui = { ...GameState.ui, currentState: 'combat' };
  GameState.companions = ['npc_guard'];
  GameState.npcs = {
    states: {
      npc_guard: {
        hp: companionHp,
        maxHp: 80,
        isCompanion: true,
        statusEffects: [],
      },
    },
  };

  const enemy = CombatSystem._instantiateEnemyFromDefinition(definition);
  CombatSystem._setupCombat({
    enemies: [enemy],
    dangerLevel: 1,
    nodeId: 'boss-intent-test',
  });
  return { combat: GameState.combat, enemy: GameState.combat.enemies[0] };
}

beforeEach(() => {
  vi.restoreAllMocks();
  SystemRegistry.register('NPCSystem', {
    damageCompanion: (npcId, damage) => {
      const state = GameState.npcs?.states?.[npcId];
      if (state) state.hp = Math.max(0, state.hp - damage);
    },
    getCompanionCombatBonus: () => 1,
    getNpcDef: () => null,
  });
});

describe('보스 committed action production 결선', () => {
  it('표시한 actionId·category·targetIds·motionKey를 난수 재추첨 없이 그대로 실행한다', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { enemy } = setupCombat();
    const shownIntent = enemy._nextIntent;

    expect(shownIntent).toMatchObject({
      actionId: 'boss_sweep',
      category: 'basic',
      targetIds: ['player', 'npc_guard'],
      motionKey: 'boss_sweep_motion',
    });
    expect(enemy._bossActionState?.committedAction).toMatchObject({
      actionId: shownIntent.actionId,
      category: shownIntent.category,
      targetIds: shownIntent.targetIds,
      motionKey: shownIntent.motionKey,
    });

    const executeSpy = vi.spyOn(CombatSystem, '_executeEnemyCommittedAction');
    random.mockReturnValue(0);
    CombatSystem._runSingleEnemyTurn(0);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy.mock.calls[0][1]).toMatchObject({
      actionId: shownIntent.actionId,
      category: shownIntent.category,
      targetIds: shownIntent.targetIds,
      motionKey: shownIntent.motionKey,
    });
    expect(GameState.player.hp.current).toBe(89);
    expect(GameState.npcs.states.npc_guard.hp).toBe(69);
  });

  it('selfHeal은 ranked·legacy HP를 함께 회복하고 partyDamage는 생존 아군마다 독립 적용한다', () => {
    const definition = bossDefinition();
    definition.bossPattern.basicAttacks[0] = {
      id: 'boss_recovering_wave',
      category: 'basic',
      name: '회복 파동',
      damage: [0, 0],
      accuracy: 1,
      targetPolicy: 'player',
      motionKey: 'boss_recovering_wave',
      effects: [
        { type: 'selfHeal', value: [20, 20] },
        { type: 'partyDamage', value: [6, 6] },
      ],
    };
    const { combat, enemy } = setupCombat(definition);
    enemy.currentHp = 40;
    combat.combatants['enemy:0'].hp = 40;

    CombatSystem._executeEnemyCommittedAction(enemy, {
      actionId: 'boss_recovering_wave',
      category: 'basic',
      state: 'ready',
      targetIds: ['player'],
      remainingTelegraphTurns: 0,
      hitCount: 1,
      motionKey: 'boss_recovering_wave',
    });

    expect(enemy.currentHp).toBe(60);
    expect(combat.combatants['enemy:0'].hp).toBe(60);
    expect(GameState.player.hp.current).toBe(94);
    expect(combat.combatants.player.hp).toBe(94);
    expect(GameState.npcs.states.npc_guard.hp).toBe(74);
    expect(combat.combatants.npc_guard.hp).toBe(74);
  });

  it('armorPiercing은 방어 감소율 일부만 무시하고 executeThreshold는 보너스 배율만 적용한다', () => {
    const definition = bossDefinition();
    definition.bossPattern.basicAttacks[0] = {
      id: 'boss_execute',
      category: 'basic',
      name: '처형 시도',
      damage: [20, 20],
      accuracy: 1,
      armorPiercing: 0.5,
      executeThreshold: 0.5,
      executeBonusMultiplier: 2,
      damageType: 'chemical',
      targetPolicy: 'all',
      targetCount: 2,
      motionKey: 'boss_execute',
      effects: [],
    };
    vi.spyOn(StatSystem, 'getArmorEffects').mockReturnValue({
      damageReduction: 0.5,
      critReduction: 0,
    });
    vi.spyOn(SkillSystem, 'getBonus').mockImplementation(
      (_skillId, bonusId) => bonusId === 'damageReduction' ? 0 : 1,
    );
    const { combat, enemy } = setupCombat(definition, {
      playerHp: 40,
      companionHp: 32,
    });
    combat.combatants.npc_guard.damageReduction = 0.5;

    CombatSystem._executeEnemyCommittedAction(enemy, {
      actionId: 'boss_execute',
      category: 'basic',
      state: 'ready',
      targetIds: ['player', 'npc_guard'],
      remainingTelegraphTurns: 0,
      hitCount: 1,
      motionKey: 'boss_execute',
    });

    // 20 × execute 2 × (1 - 방어 0.5 × 관통 후 잔여 0.5) = 30.
    expect(GameState.player.hp.current).toBe(10);
    expect(GameState.npcs.states.npc_guard.hp).toBe(2);
    expect(combat.combatants.player.dead).toBe(false);
    expect(combat.combatants.npc_guard.dead).toBe(false);
  });
});

describe('보스 피격 반응 passive production 결선', () => {
  it('원 공격 피해 뒤 생존 공격자에게 라운드당 한 번만 isCounter 행동을 실행하고 최근 속성 저항을 갱신한다', () => {
    const definition = bossDefinition();
    definition.bossPattern.basicAttacks[0] = {
      id: 'toxic_blood_counter',
      category: 'basic',
      name: '독혈 반격',
      damage: [4, 4],
      accuracy: 1,
      targetPolicy: 'frontmost',
      motionKey: 'toxic_blood_counter',
      effects: [],
    };
    definition.bossPattern.passives = [
      { type: 'counterAttack', actionId: 'toxic_blood_counter', maxPerRound: 1 },
      {
        type: 'resistanceShift',
        source: 'lastDamageType',
        duration: 2,
        value: 0.5,
      },
    ];
    const { combat, enemy } = setupCombat(definition);
    const actor = combat.combatants.npc_guard;
    const target = combat.combatants['enemy:0'];
    const damageEffect = { type: 'damage', value: [10, 10] };
    const statusEffect = {
      type: 'status',
      status: {
        id: 'counter_probe_mark',
        name: '반격 순서 표식',
        duration: 1,
        effect: {},
      },
    };
    const hitInfo = {
      hit: true,
      crit: false,
      skill: {
        id: 'companion_probe',
        damageType: 'fire',
        effects: [damageEffect, statusEffect],
      },
    };
    const executeCounter = CombatSystem._executeEnemyCommittedAction.bind(CombatSystem);
    let statusPresentWhenCounterRuns = false;
    const counterSpy = vi.spyOn(CombatSystem, '_executeEnemyCommittedAction')
      .mockImplementation((...args) => {
        statusPresentWhenCounterRuns = (enemy._statusEffects ?? [])
          .some(status => status.id === 'counter_probe_mark');
        return executeCounter(...args);
      });

    CombatSystem._applyRankedEffect(
      damageEffect,
      actor,
      target,
      () => 0,
      hitInfo,
    );
    expect(counterSpy).not.toHaveBeenCalled();
    CombatSystem._applyRankedEffect(statusEffect, actor, target, () => 0, hitInfo);

    CombatSystem._applyRankedEffect(
      damageEffect,
      actor,
      target,
      () => 0,
      hitInfo,
    );
    CombatSystem._applyRankedEffect(statusEffect, actor, target, () => 0, hitInfo);

    expect(counterSpy).toHaveBeenCalledTimes(1);
    expect(statusPresentWhenCounterRuns).toBe(true);
    expect(counterSpy.mock.calls[0][1]).toMatchObject({
      actionId: 'toxic_blood_counter',
      targetIds: ['npc_guard'],
      isCounter: true,
    });
    expect(GameState.npcs.states.npc_guard.hp).toBe(76);
    expect(enemy._resistanceShift).toMatchObject({
      damageType: 'fire',
      duration: 2,
      value: 0.5,
    });
    // 첫 타격 10, 같은 속성의 두 번째 타격은 새 저항 50%가 적용된다.
    expect(enemy.currentHp).toBe(85);

    combat.roundNumber += 1;
    const counterHitInfo = { ...hitInfo, isCounter: true };
    CombatSystem._applyRankedEffect(
      damageEffect,
      actor,
      target,
      () => 0,
      counterHitInfo,
    );
    CombatSystem._applyRankedEffect(statusEffect, actor, target, () => 0, counterHitInfo);
    expect(counterSpy).toHaveBeenCalledTimes(1);
  });
});

describe('일반 적 cancelOnHit committed action 회귀', () => {
  it.each([1, 2])('%i턴 예고 취소 후 다음 턴에는 취소된 특수기 대신 기본 공격을 실행한다', (turns) => {
    const aimedSkill = {
      id: `normal_aimed_${turns}`,
      name: `${turns}턴 조준`,
      damage: [25, 25],
      accuracy: 1,
      cooldown: 3,
      telegraph: { turns, cancelOnHit: true },
    };
    const definition = {
      id: `normal_cancel_fixture_${turns}`,
      name: '일반 조준 적',
      icon: '🎯',
      type: 'human',
      hp: { min: 100, max: 100 },
      attack: { damage: [5, 5], accuracy: 1 },
      defense: 0,
      aiPattern: 'normal',
      specialSkills: [aimedSkill],
    };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { combat, enemy } = setupCombat(definition);

    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._telegraph?.skillId).toBe(aimedSkill.id);

    const damageEffect = { type: 'damage', value: [1, 1] };
    CombatSystem._applyRankedDamageEffect(
      damageEffect,
      combat.combatants.player,
      combat.combatants['enemy:0'],
      () => 0,
      {
        hit: true,
        crit: false,
        skill: {
          id: 'cancel_probe',
          damageType: 'blunt',
          effects: [damageEffect],
        },
      },
    );

    expect(enemy._telegraph).toBeNull();
    expect(enemy._enemyActionState.committedAction).toMatchObject({
      actionId: 'basic_attack',
      category: 'basic',
    });
    expect(enemy._nextIntent.actionId).toBe('basic_attack');

    const hpBefore = GameState.player.hp.current;
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(hpBefore - 5);
  });
});

function runMultiTargetCounterCommand(mode) {
  const definition = bossDefinition();
  definition.bossPattern.basicAttacks[0] = {
    id: 'lethal_counter',
    category: 'basic',
    name: '치명 반격',
    damage: [10, 10],
    accuracy: 1,
    targetPolicy: 'frontmost',
    motionKey: 'lethal_counter',
    effects: [],
  };
  definition.bossPattern.passives = [
    { type: 'counterAttack', actionId: 'lethal_counter', maxPerRound: 1 },
  ];
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const { combat, enemy } = setupCombat(definition, { companionHp: 4 });
  const secondEnemy = CombatSystem._instantiateEnemyFromDefinition({
    id: 'multi_target_dummy',
    name: '다중 대상 더미',
    icon: '🧟',
    type: 'zombie',
    hp: { min: 100, max: 100 },
    attack: { damage: [1, 1], accuracy: 1 },
    defense: 0,
    aiPattern: 'normal',
    specialSkills: [],
  });
  CombatSystem._spawnEnemyMidCombat(secondEnemy, 'front');

  const skill = {
    id: 'multi_target_counter_probe',
    name: '다중 대상 반격 검사',
    accuracy: mode === 'miss' ? 0.5 : 1,
    usableFrom: [1, 2, 3, 4],
    target: { side: 'enemy', ranks: [1, 2, 3, 4], count: 2 },
    costs: {},
    effects: [
      { type: 'damage', value: [1, 1] },
      {
        type: 'status',
        status: {
          id: 'multi_target_mark',
          name: '다중 대상 표식',
          duration: 1,
          effect: {},
        },
      },
    ],
  };
  const actor = combat.combatants.npc_guard;
  actor.skillIds = [skill.id];
  combat.skillsById[skill.id] = skill;
  combat.activeCombatantId = actor.id;
  combat.selectedTargetId = 'enemy:0';

  const order = [];
  const context = CombatSystem._commandContext();
  const resolveHit = context.resolveHit;
  context.resolveHit = (hitActor, target, hitSkill, random) => {
    const hitInfo = resolveHit(
      hitActor,
      target,
      hitSkill,
      mode === 'miss' && target.id === 'enemy:1' ? () => 0.99 : random,
    );
    order.push(`${hitInfo.hit ? 'hit' : 'miss'}:${target.id}`);
    return hitInfo;
  };
  const applyEffect = context.applyEffect;
  context.applyEffect = (effect, effectActor, target, ...args) => {
    if (target.id === 'enemy:1' && effect.type === 'status') {
      if (mode === 'soft_failure') {
        order.push(`soft_failure:${effect.type}:${target.id}`);
        return { ok: false, reason: 'second_target_failed' };
      }
      if (mode === 'throw') {
        order.push(`throw:${effect.type}:${target.id}`);
        throw new Error('second target failed');
      }
    }
    const effectResult = applyEffect(effect, effectActor, target, ...args);
    order.push(`effect:${effect.type}:${target.id}`);
    return effectResult;
  };
  const executeCounter = CombatSystem._executeEnemyCommittedAction.bind(CombatSystem);
  vi.spyOn(CombatSystem, '_executeEnemyCommittedAction')
    .mockImplementation((counterEnemy, action) => {
      order.push(`counter:${counterEnemy.id}`);
      return executeCounter(counterEnemy, action);
    });

  const result = executeSkillCommand(
    context,
    {
      actorId: actor.id,
      targetId: 'enemy:0',
      skillId: skill.id,
    },
    () => 0,
  );
  return { combat, enemy, order, result };
}

describe('보스 반격 command scope 회귀', () => {
  it.each([
    [
      '정상 성공',
      'success',
      { ok: true, hit: true, effectsApplied: 4, partialApplied: false },
      [
        'hit:enemy:0',
        'effect:damage:enemy:0',
        'effect:status:enemy:0',
        'hit:enemy:1',
        'effect:damage:enemy:1',
        'effect:status:enemy:1',
        'counter:boss_intent_fixture',
      ],
      99,
    ],
    [
      '마지막 대상 miss',
      'miss',
      { ok: true, hit: true, effectsApplied: 2, partialApplied: false },
      [
        'hit:enemy:0',
        'effect:damage:enemy:0',
        'effect:status:enemy:0',
        'miss:enemy:1',
        'counter:boss_intent_fixture',
      ],
      100,
    ],
    [
      '두 번째 대상 soft failure',
      'soft_failure',
      {
        ok: false,
        reason: 'second_target_failed',
        effectsApplied: 3,
        partialApplied: true,
      },
      [
        'hit:enemy:0',
        'effect:damage:enemy:0',
        'effect:status:enemy:0',
        'hit:enemy:1',
        'effect:damage:enemy:1',
        'soft_failure:status:enemy:1',
        'counter:boss_intent_fixture',
      ],
      99,
    ],
    [
      '두 번째 대상 throw',
      'throw',
      {
        ok: false,
        reason: 'execution_error',
        effectsApplied: 3,
        partialApplied: true,
      },
      [
        'hit:enemy:0',
        'effect:damage:enemy:0',
        'effect:status:enemy:0',
        'hit:enemy:1',
        'effect:damage:enemy:1',
        'throw:status:enemy:1',
        'counter:boss_intent_fixture',
      ],
      99,
    ],
  ])('다중 대상 %s 종료 뒤 반격을 정확히 한 번 실행한다', (
    _label,
    mode,
    expectedResult,
    expectedOrder,
    secondEnemyHp,
  ) => {
    const { combat, enemy, order, result } = runMultiTargetCounterCommand(mode);

    expect(result).toMatchObject(expectedResult);
    expect(order).toEqual(expectedOrder);
    expect(order.filter(event => event.startsWith('counter:'))).toHaveLength(1);
    expect(combat.combatants.npc_guard.dead).toBe(true);
    expect(combat.combatants['enemy:0'].hp).toBe(99);
    expect(combat.combatants['enemy:1'].hp).toBe(secondEnemyHp);
    expect(enemy._counterActionState.counts.lethal_counter).toBe(1);
  });
});
