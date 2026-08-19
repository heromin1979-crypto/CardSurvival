// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import CombatUI from '../../js/ui/CombatUI.js';
import { ENEMIES, instantiateEnemy } from '../../js/data/enemies.js';


// 이 파일은 적 치명타를 검증하지 않는다. 치명타는 확률 요소라 고정 피해값 검증을 흔들므로
// 여기서는 비활성으로 고정한다 — 치명타 자체는 EnemyCriticalAndDisplay.test.js가 다룬다.
CombatSystem._rollEnemyCrit = damage => ({ damage, isCrit: false });

function setupCombat(enemy, { withNurse = false, companionId = null } = {}) {
  const activeCompanionId = companionId ?? (withNurse ? 'npc_nurse' : null);
  document.body.innerHTML = '<div id="screen-combat"></div>';
  CombatUI._screen = document.getElementById('screen-combat');

  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.flags = GameState.flags ?? {};
  GameState.ui = { ...GameState.ui, currentState: 'combat' };
  GameState.companions = activeCompanionId ? [activeCompanionId] : [];
  GameState.npcs = {
    states: activeCompanionId
      ? { [activeCompanionId]: { hp: 80, maxHp: 80, isCompanion: true } }
      : {},
  };

  CombatSystem._setupCombat({
    enemies: [enemy],
    dangerLevel: 1,
    nodeId: 'normal-enemy-intent-test',
  });
  return GameState.combat;
}

describe('일반 몬스터 committed action intent 통합', () => {
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

  it('의도 결정 뒤 난수가 바뀌어도 runner_rush를 기본 공격으로 재추첨하지 않는다', () => {
    const enemy = instantiateEnemy(ENEMIES.zombie_runner);
    enemy.attack = { damage: [4, 4], accuracy: 1 };
    enemy.specialSkills = [{
      id: 'runner_rush',
      name: '돌진',
      damage: [10, 10],
      cooldown: 3,
      telegraph: { turns: 1 },
      effect: { multiHit: 2 },
    }];

    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const combat = setupCombat(enemy);
    const shownIntent = combat.enemies[0]._nextIntent;

    expect(shownIntent).toMatchObject({
      actionId: 'runner_rush',
      targetIds: ['player'],
      hitCount: 2,
    });

    random.mockReturnValue(0.99);
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(100);
    expect(combat.enemies[0]._nextIntent.actionId).toBe('runner_rush');
    expect(combat.fxQueue).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'status',
        enemyIdx: 0,
        statusId: 'telegraph',
        motionKey: 'telegraph',
      }),
    ]));

    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(80);
  });

  it('zombie_horde는 두 대상과 hitCount 2를 view model과 UI에 표시한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const enemy = instantiateEnemy(ENEMIES.zombie_horde);
    enemy.patternProfile = {
      ...enemy.patternProfile,
      defaultAction: {
        ...enemy.patternProfile.defaultAction,
        accuracy: 1,
        effects: [{ type: 'damage', value: [6, 6] }],
      },
    };
    const combat = setupCombat(enemy, {
      withNurse: true,
    });
    const intent = combat.enemies[0]._nextIntent;

    expect(new Set(intent.targetIds)).toEqual(new Set(['player', 'npc_nurse']));
    expect(intent.hitCount).toBe(2);
    expect(intent.targetNames).toEqual(expect.arrayContaining(['플레이어', '간호사']));

    CombatUI.render();
    const badge = document.querySelector('.combatant-piece.enemy .combat-intent');

    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('플레이어');
    expect(badge.textContent).toContain('간호사');
    expect(badge.textContent).toContain('×2');

    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(94);
    expect(GameState.npcs.states.npc_nurse.hp).toBe(74);
    expect(combat.combatants.player.hp).toBe(94);
    expect(combat.combatants.npc_nurse.hp).toBe(74);
  });

  it.each([
    ['zombie_bloater', 'bloater_swipe', 'self_destruct', 4],
    ['zombie_screamer', 'screamer_spit', 'summon_horde', 5],
  ])(
    '%s charging 턴은 예약 위협과 동료 대상 기본공격을 분리해 표시·실행한다',
    (enemyId, basicActionId, threatActionId, basicDamage) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const enemy = instantiateEnemy(ENEMIES[enemyId]);
      enemy.patternProfile = {
        ...enemy.patternProfile,
        defaultAction: {
          ...enemy.patternProfile.defaultAction,
          accuracy: 1,
          effects: [{ type: 'damage', value: [basicDamage, basicDamage] }],
        },
      };
      const combat = setupCombat(enemy, { withNurse: true });
      combat.formations.ally = ['player', null, null, 'npc_nurse'];
      enemy._chargeRemaining = 3;
      enemy._enemyActionState = { committedAction: null };
      enemy._chargingActionState = { committedAction: null };
      enemy._nextIntent = CombatSystem._decideNextIntent(enemy, combat, GameState);

      expect(enemy._enemyActionState.committedAction).toMatchObject({
        actionId: threatActionId,
        category: 'timed_threat',
        state: 'telegraphing',
        remainingTelegraphTurns: 3,
      });
      expect(enemy._chargingActionState.committedAction).toMatchObject({
        actionId: basicActionId,
        category: 'basic',
        state: 'ready',
        targetIds: ['npc_nurse'],
      });
      expect(enemy._nextIntent).toMatchObject({
        actionId: basicActionId,
        targetIds: ['npc_nurse'],
      });
      expect(enemy._timedThreatIntent).toMatchObject({
        actionId: threatActionId,
        remainingTelegraphTurns: 3,
      });

      CombatUI.render();
      const currentBadge = document.querySelector(
        '.combatant-piece.enemy .combat-intent[data-intent-role="current-action"]',
      );
      const threatBadge = document.querySelector(
        '.combatant-piece.enemy .combat-intent[data-intent-role="reserved-threat"]',
      );
      const currentInitiativeIcon = document.querySelector(
        '.init-slot.enemy .init-intent[data-intent-role="current-action"]',
      );
      const threatInitiativeIcon = document.querySelector(
        '.init-slot.enemy .init-intent[data-intent-role="reserved-threat"]',
      );
      expect(currentBadge?.textContent).toContain('간호사');
      expect(threatBadge?.textContent).toContain('3');
      expect(currentInitiativeIcon).not.toBeNull();
      expect(threatInitiativeIcon).not.toBeNull();
      expect(document.querySelector('.init-slot.enemy .init-countdown')?.textContent).toBe('3');

      const executeSpy = vi.spyOn(CombatSystem, '_executeEnemyCommittedAction');
      const shownAction = {
        actionId: enemy._nextIntent.actionId,
        targetIds: [...enemy._nextIntent.targetIds],
      };
      const hpBefore = GameState.npcs.states.npc_nurse.hp;

      CombatSystem._runSingleEnemyTurn(0);

      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy.mock.calls[0][1]).toMatchObject(shownAction);
      expect(GameState.npcs.states.npc_nurse.hp).toBe(hpBefore - basicDamage);
      expect(enemy._chargeRemaining).toBe(2);
      expect(combat.fxQueue).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'enemyMotion', enemyIdx: 0, motionKey: 'charge' }),
      ]));
      expect(enemy._enemyActionState.committedAction).toMatchObject({
        actionId: threatActionId,
        category: 'timed_threat',
        remainingTelegraphTurns: 2,
      });
    },
  );

  it('휴면 환자는 전투 중 wake 모션을 정확히 한 번만 큐에 넣는다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const enemy = instantiateEnemy(ENEMIES.zombie_patient_dormant);
    const combat = setupCombat(enemy);
    enemy._dormantRemaining = 1;
    enemy._wakeMotionPlayed = false;
    combat.fxQueue = [];

    CombatSystem._runSingleEnemyTurn(0);
    expect(combat.fxQueue.filter(fx => fx.kind === 'enemyMotion' && fx.motionKey === 'wake'))
      .toHaveLength(1);

    CombatSystem._runSingleEnemyTurn(0);
    expect(combat.fxQueue.filter(fx => fx.kind === 'enemyMotion' && fx.motionKey === 'wake'))
      .toHaveLength(1);
  });

  it('레이더는 세 번째 권총 사격 직후 reload 모션을 큐에 넣고 탄창 카운트를 초기화한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const enemy = instantiateEnemy(ENEMIES.raider);
    enemy.patternProfile = {
      ...enemy.patternProfile,
      defaultAction: {
        ...enemy.patternProfile.defaultAction,
        accuracy: 1,
        effects: [{ type: 'damage', value: [1, 1] }],
      },
    };
    const combat = setupCombat(enemy);

    for (let shot = 1; shot <= 3; shot += 1) {
      combat.fxQueue = [];
      CombatSystem._runSingleEnemyTurn(0);
      const actionIndex = combat.fxQueue.findIndex(fx => fx.kind === 'action');
      const reloadIndex = combat.fxQueue.findIndex(
        fx => fx.kind === 'enemyMotion' && fx.motionKey === 'reload',
      );

      expect(actionIndex).toBeGreaterThanOrEqual(0);
      if (shot < 3) {
        expect(reloadIndex).toBe(-1);
        expect(enemy._shotsSinceReload).toBe(shot);
      } else {
        expect(reloadIndex).toBeGreaterThan(actionIndex);
        expect(enemy._shotsSinceReload).toBe(0);
      }
    }
  });

  it('레이더의 기본 공격 executor가 대상을 찾지 못하면 사격 수와 reload 큐를 변경하지 않는다', () => {
    const enemy = instantiateEnemy(ENEMIES.raider);
    const combat = setupCombat(enemy);
    enemy._shotsSinceReload = 2;
    combat.fxQueue = [];

    const result = CombatSystem._executeEnemyCommittedAction(enemy, {
      actionId: 'basic_attack',
      category: 'basic',
      state: 'ready',
      targetIds: [],
      remainingTelegraphTurns: 0,
      hitCount: 1,
      motionKey: 'basic_attack',
    }, 0);

    expect(result).toBeUndefined();
    expect(enemy._shotsSinceReload).toBe(2);
    expect(combat.fxQueue).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'enemyMotion', motionKey: 'reload' }),
    ]));
  });

  it('AI 후보에 실제 rank·방어/노출·heal effect 기반 healer 메타데이터를 제공한다', () => {
    const combat = setupCombat(instantiateEnemy(ENEMIES.zombie_common), {
      companionId: 'npc_student',
    });
    combat.combatants.player.tokens.block = 1;
    combat.combatants.npc_student.tokens.vulnerable = 1;
    combat.playerGuard = { active: true, damageReduce: 0.5 };

    const targets = CombatSystem._getEligibleTargets(combat, GameState);

    expect(targets).toEqual([
      expect.objectContaining({
        id: 'player',
        rank: 1,
        isDefended: true,
        isExposed: false,
      }),
      expect.objectContaining({
        id: 'npc_student',
        rank: 2,
        isDefended: false,
        isExposed: true,
        isHealer: true,
      }),
    ]);
  });
});
