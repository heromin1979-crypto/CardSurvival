// === 적 치명타 신설 + 표기/실동작 정합 ===
// 방어구 14종이 critReduction을 선언하지만 적이 치명타를 치지 않아 줄일 대상이 없었다.
// 가드 UI는 소방관 전용 수치(55%/30%)를 전 캐릭터에게 하드코딩으로 보여줬고,
// 장비 모달은 StatSystem과 다른 계산을 중복 구현해 방어연고 보너스를 빠뜨렸다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import { previewGuardEffect, guardAction } from '../../js/systems/CombatActions.js';
import StatSystem from '../../js/systems/StatSystem.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';
import ITEMS from '../../js/data/items.js';

beforeEach(() => {
  GameState.cards = {};
  GameState.combat = { playerGuard: null, log: [] };
  GameState.player.equipped = {};
  delete GameState.player.pendingGuardBoost;
});

describe('적 치명타 — 밸런스 상수', () => {
  it('기본 확률과 배율이 정의되어 있다', () => {
    expect(BALANCE.combat.enemyCritChance).toBeGreaterThan(0);
    expect(BALANCE.combat.enemyCritMultiplier).toBeGreaterThan(1);
  });
});

describe('적 치명타 — 판정과 방어구 감소', () => {
  it('굴림이 확률 아래면 치명타로 피해가 배율만큼 오른다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = CombatSystem._rollEnemyCrit(20);
    vi.restoreAllMocks();

    expect(result.isCrit).toBe(true);
    expect(result.damage).toBe(Math.floor(20 * BALANCE.combat.enemyCritMultiplier));
  });

  it('굴림이 확률 위면 피해가 그대로다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = CombatSystem._rollEnemyCrit(20);
    vi.restoreAllMocks();

    expect(result.isCrit).toBe(false);
    expect(result.damage).toBe(20);
  });

  it('방어구 critReduction이 치명타 확률을 낮춘다', () => {
    // 헬멧(critReduction 0.3)을 쓰면 유효 확률이 기본값보다 낮아진다
    GameState.cards = { h1: { instanceId: 'h1', definitionId: 'helmet', durability: 100 } };
    GameState.player.equipped = { head: 'h1' };
    const withHelmet = CombatSystem._enemyCritChance();

    GameState.player.equipped = {};
    const bare = CombatSystem._enemyCritChance();

    expect(withHelmet).toBeLessThan(bare);
    expect(bare).toBeCloseTo(BALANCE.combat.enemyCritChance, 5);
  });

  it('치명타 확률은 0 아래로 내려가지 않는다', () => {
    vi.spyOn(StatSystem, 'getArmorEffects').mockReturnValue({ damageReduction: 0, critReduction: 5 });
    expect(CombatSystem._enemyCritChance()).toBe(0);
    vi.restoreAllMocks();
  });
});

describe('가드 미리보기 — 표기와 실동작 일치', () => {
  it('기본 수치가 BALANCE 값과 같다', () => {
    const preview = previewGuardEffect();
    expect(preview.damageReduce).toBeCloseTo(BALANCE.combat.guardDamageReduction, 5);
    expect(preview.counterBonus).toBeCloseTo(BALANCE.combat.guardCounterBonus, 5);
  });

  it('방어 자세 키트 보정이 미리보기에 반영된다', () => {
    GameState.player.pendingGuardBoost = 0.15;
    expect(previewGuardEffect().damageReduce)
      .toBeCloseTo(BALANCE.combat.guardDamageReduction + 0.15, 5);
  });

  it('미리보기는 키트 보정을 소모하지 않는다', () => {
    GameState.player.pendingGuardBoost = 0.15;
    previewGuardEffect();
    previewGuardEffect();
    expect(GameState.player.pendingGuardBoost).toBe(0.15);

    guardAction();
    expect(GameState.player.pendingGuardBoost).toBe(0);
  });

  it('실제 방어 수치가 미리보기와 일치한다', () => {
    GameState.player.pendingGuardBoost = 0.15;
    const preview = previewGuardEffect();
    guardAction();

    expect(GameState.combat.playerGuard.damageReduce).toBeCloseTo(preview.damageReduce, 5);
    expect(GameState.combat.playerGuard.counterBonus).toBeCloseTo(preview.counterBonus, 5);
  });
});

describe('장비 모달 — StatSystem과 같은 계산', () => {
  it('방어연고를 바른 방어구 보너스가 반영된다', async () => {
    const { default: EquipmentModal } = await import('../../js/ui/EquipmentModal.js');
    GameState.cards = {
      a1: { instanceId: 'a1', definitionId: 'helmet', durability: 100, _damageReductionBonus: 0.05, _critReductionBonus: 0.02 },
    };
    GameState.player.equipped = { head: 'a1' };

    const modal = EquipmentModal._getEffects();
    const stat  = StatSystem.getArmorEffects();

    expect(modal.damageReduction).toBeCloseTo(stat.damageReduction, 5);
    expect(modal.critReduction).toBeCloseTo(stat.critReduction, 5);
  });

  it('상한이 BALANCE.armor 값을 따른다', async () => {
    const { default: EquipmentModal } = await import('../../js/ui/EquipmentModal.js');
    vi.spyOn(StatSystem, 'getArmorEffects').mockReturnValue({
      damageReduction: BALANCE.armor.damageReductionCap,
      critReduction: BALANCE.armor.critReductionCap,
      radiationMult: 1, contaminationMult: 1, infectionMult: 1,
    });

    const modal = EquipmentModal._getEffects();
    expect(modal.damageReduction).toBeLessThanOrEqual(BALANCE.armor.damageReductionCap);
    expect(modal.critReduction).toBeLessThanOrEqual(BALANCE.armor.critReductionCap);
    vi.restoreAllMocks();
  });
});

describe('sling 중복 키 제거', () => {
  it('sling은 삼각건 하나로만 해석된다', () => {
    expect(ITEMS.sling.type).toBe('consumable');
    expect(ITEMS.sling.subtype).toBe('medical');
    expect(ITEMS.sling.description).toContain('골절');
  });

  it('원거리 무기 슬링 정의가 남아 있지 않다', async () => {
    const { default: ITEMS_MISC } = await import('../../js/data/items_misc.js');
    expect(ITEMS_MISC.sling).toBeUndefined();
  });
});
