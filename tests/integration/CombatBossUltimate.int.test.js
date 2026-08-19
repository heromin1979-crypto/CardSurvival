// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import CombatUI from '../../js/ui/CombatUI.js';


// 이 파일은 적 치명타를 검증하지 않는다. 치명타는 확률 요소라 고정 피해값 검증을 흔들므로
// 여기서는 비활성으로 고정한다 — 치명타 자체는 EnemyCriticalAndDisplay.test.js가 다룬다.
CombatSystem._rollEnemyCrit = damage => ({ damage, isCrit: false });

function bossDefinition(overrides = {}) {
  return {
    id: 'boss_ultimate_fixture',
    name: '임계 시험 보스',
    icon: '👿',
    type: 'zombie',
    isBoss: true,
    hp: { min: 100, max: 100 },
    attack: { damage: [5, 5], accuracy: 1 },
    defense: 0,
    aiPattern: 'normal',
    bossPattern: {
      basicAttacks: [
        {
          id: 'boss_basic_a',
          category: 'basic',
          name: '기본 A',
          damage: [3, 3],
          accuracy: 1,
          targetPolicy: 'player',
          motionKey: 'boss_basic_a',
          effects: [],
        },
        {
          id: 'boss_basic_b',
          category: 'basic',
          name: '기본 B',
          damage: [4, 4],
          accuracy: 1,
          targetPolicy: 'player',
          motionKey: 'boss_basic_b',
          effects: [],
        },
      ],
      specialSkill: {
        id: 'boss_long_special',
        category: 'special',
        name: '긴 예고 특수기',
        damage: [9, 9],
        accuracy: 1,
        cooldown: 3,
        chance: 0.3,
        telegraphTurns: 2,
        targetPolicy: 'player',
        motionKey: 'boss_long_special',
        effects: [],
      },
      ultimate: {
        id: 'boss_finale',
        category: 'ultimate',
        name: '최후의 파동',
        damage: [20, 20],
        accuracy: 1,
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
        targetPolicy: 'player',
        motionKey: 'boss_finale',
        effects: [],
      },
      passives: [],
    },
    ...overrides,
  };
}

function setupCombat(definition = bossDefinition(), randomValue = 0.99) {
  document.body.innerHTML = '<div id="screen-combat"></div>';
  CombatUI._screen = document.getElementById('screen-combat');
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.flags = GameState.flags ?? {};
  GameState.ui = { ...GameState.ui, currentState: 'combat' };
  GameState.companions = [];
  GameState.npcs = { states: {} };

  vi.spyOn(Math, 'random').mockReturnValue(randomValue);
  const enemy = CombatSystem._instantiateEnemyFromDefinition(definition);
  CombatSystem._setupCombat({
    enemies: [enemy],
    dangerLevel: 1,
    nodeId: 'boss-ultimate-test',
  });
  return { combat: GameState.combat, enemy: GameState.combat.enemies[0] };
}

function damageBoss(combat, amount, hitInfo = {}) {
  return CombatSystem._applyRankedDamageEffect(
    { type: 'damage', value: [amount, amount] },
    combat.combatants.player,
    combat.combatants['enemy:0'],
    () => 0,
    {
      hit: true,
      crit: false,
      skill: {
        id: 'threshold_probe',
        damageType: 'blunt',
        effects: [{ type: 'damage', value: [amount, amount] }],
      },
      ...hitInfo,
    },
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  SystemRegistry.register('NPCSystem', {
    damageCompanion: vi.fn(),
    getCompanionCombatBonus: () => 1,
    getNpcDef: () => null,
  });
});

describe('보스 필살기 임계점과 B안 직렬 실행', () => {
  it('31→30에서 한 번만 예약하고 추가 피해·회복에도 예약을 유지하며 사망 시 새로 예약하지 않는다', () => {
    const { combat, enemy } = setupCombat();
    enemy.currentHp = 31;
    combat.combatants['enemy:0'].hp = 31;

    damageBoss(combat, 1);
    expect(enemy._bossActionState).toMatchObject({
      ultimatePending: false,
      ultimateUsed: true,
      committedAction: {
        category: 'ultimate',
        remainingTelegraphTurns: 1,
      },
    });
    expect(enemy._nextIntent).toMatchObject({
      category: 'ultimate',
      remainingTelegraphTurns: 1,
    });

    const reservedState = enemy._bossActionState;
    damageBoss(combat, 1);
    expect(enemy._bossActionState).toMatchObject({
      ultimatePending: false,
      ultimateUsed: true,
      committedAction: {
        category: 'ultimate',
      },
    });
    expect(enemy._bossActionState.lastBasicActionId).toBe(reservedState.lastBasicActionId);

    enemy.currentHp = 40;
    combat.combatants['enemy:0'].hp = 40;
    expect(enemy._bossActionState).toMatchObject({
      ultimatePending: false,
      ultimateUsed: true,
    });
    expect(enemy._nextIntent).toMatchObject({
      category: 'ultimate',
      remainingTelegraphTurns: 1,
    });

    enemy.currentHp = 1;
    combat.combatants['enemy:0'].hp = 1;
    enemy._bossActionState = {
      committedAction: null,
      ultimatePending: false,
      ultimateUsed: false,
      lastBasicActionId: null,
    };
    damageBoss(combat, 1);

    expect(enemy._bossActionState.ultimatePending).toBe(false);
    expect(enemy._nextIntent).toBeNull();
  });

  it('특수기 예고 2를 유지한 뒤 발동하고 필살기 예고 1과 발동을 순서대로 실행한다', () => {
    const { combat, enemy } = setupCombat(bossDefinition(), 0);
    expect(enemy._nextIntent).toMatchObject({
      actionId: 'boss_long_special',
      category: 'special',
      state: 'telegraphing',
      remainingTelegraphTurns: 2,
    });

    enemy.currentHp = 31;
    combat.combatants['enemy:0'].hp = 31;
    damageBoss(combat, 1);
    expect(enemy._bossActionState).toMatchObject({
      ultimatePending: true,
      ultimateUsed: false,
      committedAction: {
        actionId: 'boss_long_special',
        remainingTelegraphTurns: 2,
      },
    });

    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._nextIntent).toMatchObject({
      actionId: 'boss_long_special',
      category: 'special',
      remainingTelegraphTurns: 1,
    });

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(91);
    expect(enemy._nextIntent).toMatchObject({
      actionId: 'boss_finale',
      category: 'ultimate',
      state: 'telegraphing',
      remainingTelegraphTurns: 1,
    });
    expect(enemy._bossActionState).toMatchObject({
      ultimatePending: false,
      ultimateUsed: true,
    });

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(71);
    expect(enemy._bossActionState.ultimateUsed).toBe(true);
  });

  it('특수기 예고가 ready가 된 경계에서 임계점을 넘어도 특수기를 먼저 발동한다', () => {
    const { combat, enemy } = setupCombat(bossDefinition(), 0);
    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._bossActionState.committedAction).toMatchObject({
      actionId: 'boss_long_special',
      state: 'ready',
    });

    enemy.currentHp = 31;
    combat.combatants['enemy:0'].hp = 31;
    damageBoss(combat, 1);

    expect(enemy._bossActionState).toMatchObject({
      ultimatePending: true,
      ultimateUsed: false,
      committedAction: {
        actionId: 'boss_long_special',
        state: 'ready',
      },
    });
    expect(enemy._nextIntent.actionId).toBe('boss_long_special');

    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(91);
    expect(enemy._nextIntent).toMatchObject({
      actionId: 'boss_finale',
      category: 'ultimate',
      remainingTelegraphTurns: 1,
    });
  });

  it('critical_mass는 production telegraph가 ready가 된 뒤 받은 실제 피해도 누적한다', () => {
    const definition = structuredClone(SECRET_ENEMIES.boss_radiation_colossus);
    const { combat, enemy } = setupCombat(definition, 0.99);
    enemy.currentHp = 106;
    combat.combatants['enemy:0'].hp = 106;
    GameState.stats.morale.current = 50;

    damageBoss(combat, 10);
    expect(enemy._bossActionState.committedAction).toMatchObject({
      actionId: 'critical_mass',
      state: 'telegraphing',
      telegraphDamageTaken: 0,
    });
    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._bossActionState.committedAction).toMatchObject({
      actionId: 'critical_mass',
      state: 'ready',
      telegraphDamageTaken: 0,
    });
    enemy.defense = 0;

    damageBoss(combat, 100);

    expect(enemy._bossActionState.committedAction.telegraphDamageTaken).toBe(100);
  });

  it('필살기 예고가 피격으로 취소되어도 사용 기회가 소모되고 다시 예약되지 않는다', () => {
    const definition = bossDefinition();
    definition.bossPattern.ultimate.telegraph = { cancelOnHit: true };
    const { combat, enemy } = setupCombat(definition);
    enemy.currentHp = 31;
    combat.combatants['enemy:0'].hp = 31;

    damageBoss(combat, 1);
    expect(enemy._nextIntent.category).toBe('ultimate');

    damageBoss(combat, 1);

    expect(enemy._bossActionState.ultimateUsed).toBe(true);
    expect(enemy._bossActionState.ultimatePending).toBe(false);
    expect(enemy._bossActionState.committedAction?.category).not.toBe('ultimate');
    expect(enemy._nextIntent?.category).not.toBe('ultimate');
  });
});

describe('보스 필살기 의도 UI', () => {
  it('category와 remainingTelegraphTurns를 유지하고 일반 공격과 다른 아이콘·문구로 표시한다', () => {
    const { combat, enemy } = setupCombat();
    enemy.currentHp = 31;
    combat.combatants['enemy:0'].hp = 31;
    damageBoss(combat, 1);

    const intent = enemy._nextIntent;
    expect(intent).toMatchObject({
      category: 'ultimate',
      remainingTelegraphTurns: 1,
      countdown: 1,
    });
    expect(intent.iconEmoji).not.toBe('🗡');
    expect(intent.label).toContain('필살기');

    CombatUI.render();
    const badge = document.querySelector(
      '.combatant-piece.enemy .combat-intent[data-intent-category="ultimate"]',
    );
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('1');
    expect(badge.getAttribute('title')).toContain('필살기');
  });
});
