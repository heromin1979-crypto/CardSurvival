// === 미배선 강화품 4종 배선 ===
// regression: 무기 정비유·톱니 개조 키트·너클 랩·방어 자세 키트는 시크릿 조합으로
// 제작만 되고 효과를 적용하는 코드가 없었다. 발견 메시지는 효과를 약속했지만
// 카드가 한 장 생길 뿐이었다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findInteraction } from '../../js/data/interactions.js';
import { getUnarmedGloveBonus } from '../../js/systems/WeaponModifiers.js';
import { guardAction, consumeGuard } from '../../js/systems/CombatActions.js';
import { formatInstanceName, formatCardEffectParts } from '../../js/systems/ItemEffectSystem.js';
import GameData from '../../js/data/GameData.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';

const def  = id => GameData.items[id];
const inst = (definitionId, extra = {}) => ({ instanceId: `${definitionId}_1`, definitionId, ...extra });

const MELEE_WEAPONS = ['crowbar', 'machete', 'baseball_bat'];
const HANDS_ARMOR   = ['work_gloves', 'combat_gloves', 'iron_gauntlet'];

describe('무기 정비유 — 근접무기 내구도 절약', () => {
  it.each(MELEE_WEAPONS)('%s에 바르면 _durabilitySave가 붙고 기름이 소모된다', id => {
    const oil    = inst('weapon_oil');
    const weapon = inst(id);
    const rule   = findInteraction(def('weapon_oil'), def(id));

    expect(rule).toBeTruthy();
    expect(rule.canApply(oil, weapon).ok).toBe(true);

    const result = rule.apply(oil, weapon);
    expect(weapon._weaponOil).toBe(true);
    expect(weapon._durabilitySave).toBeCloseTo(0.15, 5);
    expect(result).toMatchObject({ consumeSrc: true, consumeTgt: false });
  });

  it('원거리 무기에는 바를 수 없다', () => {
    const rule = findInteraction(def('weapon_oil'), def('pistol'));
    expect(rule).toBeTruthy();
    expect(rule.canApply(inst('weapon_oil'), inst('pistol')).ok).toBe(false);
  });

  it('중복 적용을 막는다', () => {
    const rule = findInteraction(def('weapon_oil'), def('crowbar'));
    expect(rule.canApply(inst('weapon_oil'), inst('crowbar', { _weaponOil: true })).ok).toBe(false);
  });

  it('무기를 기름 위로 끌어도 동일하게 동작한다', () => {
    const weapon = inst('crowbar');
    const rule   = findInteraction(def('crowbar'), def('weapon_oil'));
    const result = rule.apply(weapon, inst('weapon_oil'));

    expect(weapon._durabilitySave).toBeCloseTo(0.15, 5);
    expect(result).toMatchObject({ consumeSrc: false, consumeTgt: true });
  });
});

describe('무기 정비유 — 레거시 공격 경로 소비', () => {
  it('_durabilitySave가 durSaveChance 굴림에 더해져 내구도가 보존된다', async () => {
    const { default: CombatSystem } = await import('../../js/systems/CombatSystem.js');
    const setup = extra => {
      GameState.cards = { m1: { instanceId: 'm1', definitionId: 'crowbar', durability: 100, ...extra } };
      GameState.player.skills = { melee: { level: 0, xp: 0 }, unarmed: { level: 0, xp: 0 } };
      GameState.combat = { enemies: [], targetIndex: 0, log: [], fxQueue: [], playerStatus: [], enemyStatus: [] };
    };
    const enemy = () => ({ id: 'e', name: 'e', currentHp: 500, maxHp: 500, defense: 0, type: 'zombie' });

    // 절약 확률 0.15 미만 굴림 → 정비유가 있으면 내구도가 유지된다
    setup({ _durabilitySave: 0.15 });
    vi.spyOn(Math, 'random').mockReturnValue(0.10);
    CombatSystem._attackAction('melee', 'm1', enemy());
    expect(GameState.cards.m1.durability).toBe(100);
    vi.restoreAllMocks();

    // 보정이 없으면 같은 굴림에서 차감된다
    setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.10);
    CombatSystem._attackAction('melee', 'm1', enemy());
    expect(GameState.cards.m1.durability).toBeLessThan(100);
    vi.restoreAllMocks();
  });
});

describe('톱니 개조 키트 — 근접무기 출혈', () => {
  it.each(MELEE_WEAPONS)('%s에 달면 출혈 statusInflict가 심어진다', id => {
    const kit    = inst('serrated_mod');
    const weapon = inst(id);
    const rule   = findInteraction(def('serrated_mod'), def(id));

    expect(rule).toBeTruthy();
    expect(rule.canApply(kit, weapon).ok).toBe(true);

    rule.apply(kit, weapon);
    expect(weapon._serratedMod).toBe(true);
    expect(weapon._statusInflict).toMatchObject({
      id: 'bleed', duration: 2, chance: 0.25,
    });
    // 기존 무기 정의와 같은 표기를 써야 _normalizeStatusInflict가 정규화한다
    expect(weapon._statusInflict.effect.hpPerRound).toBe(-3);
  });

  it('원거리 무기에는 달 수 없다', () => {
    const rule = findInteraction(def('serrated_mod'), def('pistol'));
    expect(rule.canApply(inst('serrated_mod'), inst('pistol')).ok).toBe(false);
  });

  it('중복 적용을 막는다', () => {
    const rule = findInteraction(def('serrated_mod'), def('crowbar'));
    expect(rule.canApply(inst('serrated_mod'), inst('crowbar', { _serratedMod: true })).ok).toBe(false);
  });
});

describe('너클 랩 — 장갑 부착', () => {
  it.each(HANDS_ARMOR)('%s에 감으면 _unarmedDmgBonus가 붙는다', id => {
    const wrap   = inst('knuckle_wrap');
    const gloves = inst(id);
    const rule   = findInteraction(def('knuckle_wrap'), def(id));

    expect(rule).toBeTruthy();
    expect(rule.canApply(wrap, gloves).ok).toBe(true);

    const result = rule.apply(wrap, gloves);
    expect(gloves._knuckleWrap).toBe(true);
    expect(gloves._unarmedDmgBonus).toBe(2);
    expect(result).toMatchObject({ consumeSrc: true, consumeTgt: false });
  });

  it('장갑이 아닌 방어구에는 감을 수 없다', () => {
    const rule = findInteraction(def('knuckle_wrap'), def('helmet'));
    expect(rule).toBeTruthy();
    expect(rule.canApply(inst('knuckle_wrap'), inst('helmet')).ok).toBe(false);
  });

  it('중복 적용을 막는다', () => {
    const rule = findInteraction(def('knuckle_wrap'), def('combat_gloves'));
    expect(rule.canApply(inst('knuckle_wrap'), inst('combat_gloves', { _knuckleWrap: true })).ok).toBe(false);
  });

  it('맨손 보정은 장갑 정의값과 부착값을 합산한다', () => {
    const gs = {
      player: { equipped: { hands: 'g1' } },
      cards: { g1: { instanceId: 'g1', definitionId: 'combat_gloves', _unarmedDmgBonus: 2 } },
      getCardDef: () => GameData.items.combat_gloves,
    };
    expect(getUnarmedGloveBonus(gs)).toBe(4);   // 정의 +2, 너클 랩 +2
  });

  it('장갑을 끼지 않았으면 0이다', () => {
    expect(getUnarmedGloveBonus({ player: { equipped: {} }, cards: {} })).toBe(0);
  });
});

describe('방어 자세 키트 — 다음 방어 1회 강화', () => {
  beforeEach(() => {
    GameState.combat = { playerGuard: null };
    delete GameState.player.pendingGuardBoost;
  });

  it('아이템 정의가 guardBoost를 선언한다', () => {
    expect(def('guard_stance_kit').onConsume?.guardBoost).toBeCloseTo(0.15, 5);
  });

  it('대기 중인 보정이 방어 피해감소에 더해지고 소모된다', () => {
    GameState.player.pendingGuardBoost = 0.15;
    guardAction();

    expect(GameState.combat.playerGuard.damageReduce)
      .toBeCloseTo(BALANCE.combat.guardDamageReduction + 0.15, 5);
    expect(GameState.player.pendingGuardBoost ?? 0).toBe(0);
  });

  it('두 번째 방어에는 적용되지 않는다', () => {
    GameState.player.pendingGuardBoost = 0.15;
    guardAction();
    GameState.combat.playerGuard = null;
    guardAction();

    expect(GameState.combat.playerGuard.damageReduce)
      .toBeCloseTo(BALANCE.combat.guardDamageReduction, 5);
  });

  it('키트를 쓰지 않으면 기존 값이 그대로다', () => {
    guardAction();
    expect(GameState.combat.playerGuard.damageReduce)
      .toBeCloseTo(BALANCE.combat.guardDamageReduction, 5);
  });

  it('상한 85%를 넘지 않는다', () => {
    GameState.player.pendingGuardBoost = 5;
    guardAction();
    expect(GameState.combat.playerGuard.damageReduce).toBeLessThanOrEqual(0.85);
  });
});

describe('부착 상태 표시', () => {
  it('정비유·톱니를 단 무기 이름에 태그가 붙는다', () => {
    const name = formatInstanceName(inst('crowbar', { _weaponOil: true, _serratedMod: true }), def('crowbar'));
    expect(name).toContain('정비유');
    expect(name).toContain('톱니');
  });

  it('너클 랩을 감은 장갑 이름에 태그가 붙는다', () => {
    const name = formatInstanceName(inst('combat_gloves', { _knuckleWrap: true }), def('combat_gloves'));
    expect(name).toContain('너클');
  });

  it('효과 줄에 내구 절약·출혈·맨손 피해가 노출된다', () => {
    const weaponParts = formatCardEffectParts(def('crowbar'), inst('crowbar', {
      _weaponOil: true, _durabilitySave: 0.15,
      _serratedMod: true, _statusInflict: { id: 'bleed', duration: 2, effect: { hpPerRound: -3 }, chance: 0.25 },
    })).join(' | ');
    expect(weaponParts).toContain('내구');
    expect(weaponParts).toContain('출혈');

    const gloveParts = formatCardEffectParts(def('combat_gloves'), inst('combat_gloves', {
      _knuckleWrap: true, _unarmedDmgBonus: 2,
    })).join(' | ');
    expect(gloveParts).toContain('맨손');
  });
});
