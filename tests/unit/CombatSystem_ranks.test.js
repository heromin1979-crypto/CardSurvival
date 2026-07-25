// === 전열/후열 랭크 전투 — 도달 판정 + 타겟 제한 + 후열 전진 ===
// 검증:
//   - getReachableEnemies: 근접은 전열만, 전열 전멸 시 후열 도달, 원거리는 전체
//   - isEnemyReachable: 동일 규칙의 단건 판정
//   - setTarget: 근접 무기로 전열 생존 중 후열 선택 차단
//   - _runSingleEnemyTurn: 후열 근접 적은 공격 대신 전열로 전진(1턴 소모)
//   - _decideNextIntent: 후열 근접 적의 의도는 advance
import { describe, it, expect, beforeEach } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';
import {
  createFormations,
  getRank,
} from '../../js/systems/combat/FormationSystem.js';

function makePlayer({ isRanged = false, loadedAmmo = 5, ammoPacks = 0 } = {}) {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.equipped = { weapon_main: isRanged ? 'ranged_inst' : 'melee_inst' };
  GameState.companions = [];
  GameState.cards = {
    ranged_inst: {
      instanceId: 'ranged_inst',
      definitionId: 'rifle',
      durability: 100,
      loadedAmmo,
    },
    melee_inst:  { instanceId: 'melee_inst',  definitionId: 'bat',   durability: 100 },
  };
  if (ammoPacks > 0) {
    GameState.cards.ammo_inst = {
      instanceId: 'ammo_inst',
      definitionId: 'bullet',
      quantity: ammoPacks,
    };
  }
  GameState.getCardDef = (id) => {
    if (id === 'ranged_inst') return {
      type: 'weapon',
      subtype: 'firearm',
      combat: {
        requiresAmmo: 'bullet',
        damage: [10, 15],
        accuracy: 0.8,
        noiseOnUse: 5,
      },
    };
    if (id === 'melee_inst') return {
      type: 'weapon',
      subtype: 'melee',
      combat: { damage: [8, 12], accuracy: 0.9, noiseOnUse: 2 },
    };
    return null;
  };
  const boardCards = ammoPacks > 0 ? [GameState.cards.ammo_inst] : [];
  GameState.getBoardCards = () => boardCards;
}

function makeEnemy({ id = 'e', hp = 30, row = 'front', attackType = 'melee' } = {}) {
  return {
    id, name: id, icon: '👹',
    currentHp: hp, maxHp: 30,
    row, attackType,
    attack: { damage: [5, 8], accuracy: 1.0 },
    aiPattern: 'normal',
    specialSkills: [],
    _skillCooldowns: {},
  };
}

function makeCombat(enemies) {
  GameState.combat = {
    active: true, enemies, targetIndex: 0,
    log: [], round: 0, playerStatus: [], enemyStatus: [], fxQueue: [],
    turnQueue: [], activeIdx: 0, roundNumber: 1,
  };
  return GameState.combat;
}

describe('getReachableEnemies / isEnemyReachable', () => {
  beforeEach(() => makePlayer());

  it('근접: 전열 생존 시 전열만 닿는다', () => {
    const front = makeEnemy({ id: 'f', row: 'front' });
    const back  = makeEnemy({ id: 'b', row: 'back' });
    makeCombat([front, back]);
    const reach = CombatSystem.getReachableEnemies(false);
    expect(reach).toEqual([front]);
    expect(CombatSystem.isEnemyReachable(back, false)).toBe(false);
  });

  it('근접: 전열 전멸 시 후열에 도달', () => {
    const front = makeEnemy({ id: 'f', row: 'front', hp: 0 });
    const back  = makeEnemy({ id: 'b', row: 'back' });
    makeCombat([front, back]);
    expect(CombatSystem.isEnemyReachable(back, false)).toBe(true);
    expect(CombatSystem.getReachableEnemies(false)).toEqual([back]);
  });

  it('원거리: 열 무시하고 전체 도달', () => {
    const front = makeEnemy({ id: 'f', row: 'front' });
    const back  = makeEnemy({ id: 'b', row: 'back' });
    makeCombat([front, back]);
    expect(CombatSystem.getReachableEnemies(true)).toEqual([front, back]);
    expect(CombatSystem.isEnemyReachable(back, true)).toBe(true);
  });

  it('row 미설정 레거시 적은 position 폴백 후 front 기본값', () => {
    const legacy = { id: 'l', currentHp: 10, maxHp: 10 };
    expect(CombatSystem.rowOf(legacy)).toBe('front');
    expect(CombatSystem.rowOf({ ...legacy, position: 'back' })).toBe('back');
  });
});

describe('setTarget — 후열 선택 제한', () => {
  beforeEach(() => makePlayer({ isRanged: false }));

  it('근접 무기로 전열 생존 중 후열 선택 → 차단(false) + targetIndex 유지', () => {
    const front = makeEnemy({ id: 'f', row: 'front' });
    const back  = makeEnemy({ id: 'b', row: 'back' });
    const combat = makeCombat([front, back]);
    expect(CombatSystem.setTarget(1)).toBe(false);
    expect(combat.targetIndex).toBe(0);
  });

  it('원거리 무기 장착 시 후열 선택 허용', () => {
    makePlayer({ isRanged: true, loadedAmmo: 3, ammoPacks: 0 });
    const front = makeEnemy({ id: 'f', row: 'front' });
    const back  = makeEnemy({ id: 'b', row: 'back' });
    const combat = makeCombat([front, back]);
    expect(CombatSystem.setTarget(1)).toBe(true);
    expect(combat.targetIndex).toBe(1);
  });

  it('전열 전멸 후에는 근접도 후열 선택 가능', () => {
    const front = makeEnemy({ id: 'f', row: 'front', hp: 0 });
    const back  = makeEnemy({ id: 'b', row: 'back' });
    const combat = makeCombat([front, back]);
    expect(CombatSystem.setTarget(1)).toBe(true);
    expect(combat.targetIndex).toBe(1);
  });
});

describe('탄창 기반 원거리 무기 도달 규칙', () => {
  it('장전탄이 없으면 호환 탄약 팩이 있어도 isPlayerWeaponRanged는 false다', () => {
    makePlayer({ isRanged: true, loadedAmmo: 0, ammoPacks: 3 });
    expect(CombatSystem.isPlayerWeaponRanged()).toBe(false);
  });

  it('장전탄이 있으면 호환 탄약 팩이 없어도 isPlayerWeaponRanged는 true다', () => {
    makePlayer({ isRanged: true, loadedAmmo: 3, ammoPacks: 0 });
    expect(CombatSystem.isPlayerWeaponRanged()).toBe(true);
  });

  it('빈 탄창 원거리 무기로 전열 생존 중 후열 선택 차단', () => {
    makePlayer({ isRanged: true, loadedAmmo: 0, ammoPacks: 3 });
    const front = makeEnemy({ id: 'f', row: 'front' });
    const back  = makeEnemy({ id: 'b', row: 'back' });
    const combat = makeCombat([front, back]);
    expect(CombatSystem.setTarget(1)).toBe(false);
    expect(combat.targetIndex).toBe(0);
  });

  it('resolveAction shoot: 빈 탄창이면 대상과 피해 상태를 변경하지 않고 실패한다', () => {
    makePlayer({ isRanged: true, loadedAmmo: 0, ammoPacks: 3 });
    const front = makeEnemy({ id: 'f', row: 'front', hp: 500 });
    const back  = makeEnemy({ id: 'b', row: 'back',  hp: 500 });
    front.maxHp = 500; back.maxHp = 500;
    const combat = makeCombat([front, back]);
    combat.targetIndex = 1;
    expect(CombatSystem.resolveAction('shoot', 'ranged_inst')).toBe(false);
    expect(front.currentHp).toBe(500);
    expect(back.currentHp).toBe(500);      // 후열은 무피해
    expect(combat.targetIndex).toBe(1);    // 빈 탄창 발사는 대상도 변경하지 않는다.
  });

  it('공격 미리보기는 예비 탄약 팩이 아니라 현재 탄창 N/20을 반환한다', () => {
    makePlayer({ isRanged: true, loadedAmmo: 7, ammoPacks: 4 });
    makeCombat([makeEnemy({ id: 'f', row: 'front' })]);

    expect(CombatSystem.previewAttack('ranged_inst')).toMatchObject({
      ammoLeft: 7,
      ammoCapacity: 20,
    });
  });
});

describe('후열 근접 적 — 전진 행동', () => {
  beforeEach(() => makePlayer());

  it('_runSingleEnemyTurn: 후열 근접 적은 공격 대신 전열로 전진', () => {
    const enemy = makeEnemy({ id: 'm', row: 'back', attackType: 'melee' });
    makeCombat([enemy]);
    const hpBefore = GameState.player.hp.current;
    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy.row).toBe('front');
    expect(GameState.player.hp.current).toBe(hpBefore);   // 전진 턴에는 공격 없음
    expect(GameState.combat.fxQueue.some(fx => fx.kind === 'advance')).toBe(true);
  });

  it('후열 원거리 적은 전진하지 않고 공격한다', () => {
    const enemy = makeEnemy({ id: 'r', row: 'back', attackType: 'ranged' });
    makeCombat([enemy]);
    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy.row).toBe('back');
    expect(GameState.player.hp.current).toBeLessThan(100); // accuracy 1.0 → 명중
  });

  it('_decideNextIntent: 후열 근접 적의 의도는 advance', () => {
    const enemy = makeEnemy({ id: 'm', row: 'back', attackType: 'melee' });
    const combat = makeCombat([enemy]);
    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.action).toBe('advance');
    expect(intent.iconEmoji).toBe('👣');
  });
});

describe('legacy row compatibility with four-rank formations', () => {
  it('converts current and legacy enemy positions into formation ranks', () => {
    const front = makeEnemy({ id: 'front', row: 'front' });
    const back = { id: 'back', position: 'back' };
    const formations = createFormations(['player'], [
      { combatantId: front.id, row: CombatSystem.rowOf(front) },
      { combatantId: back.id, row: CombatSystem.rowOf(back) },
    ]);

    expect(formations).toEqual({
      ally: [null, null, null, 'player'],
      enemy: ['front', null, 'back', null],
    });
    expect(CombatSystem.rowOf(front)).toBe('front');
    expect(CombatSystem.rowOf(back)).toBe('back');
    expect(getRank(formations, front.id)).toBe(1);
    expect(getRank(formations, back.id)).toBe(3);
  });
});
