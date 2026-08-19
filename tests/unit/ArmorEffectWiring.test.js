// === 장착 효과(onWear) 배선 ===
// regression: StatSystem.getArmorEffects는 damageReduction·critReduction·radiationMult·
// contaminationMult·infectionMult 다섯 개만 집계했다. 나머지 onWear 필드 16종은 어느 코드도
// 읽지 않아, 카드 설명에 적힌 효과가 그대로 사문화돼 있었다.
// 위장복의 "조우 50% 감소", 금시계의 "사기 감소 50% 억제", 승무원 통행증의 "이동 비용 50% 감소"가
// 모두 무효였다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import StatSystem from '../../js/systems/StatSystem.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';

function equip(definitionId, slot) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  const ok = EquipmentSystem.equip(inst.instanceId, slot);
  expect(ok, `${definitionId} → ${slot} 장착 실패`).toBeTruthy();
  return inst;
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.equipped = {
    head: null, face: null, body: null, hands: null, backpack: null,
    weapon_main: null, weapon_sub: null, boots: null, accessory: null, belt: null,
  };
  GameState.player.skills = {};
});

describe('getArmorEffects 집계', () => {
  it('기본값을 돌려준다', () => {
    const a = StatSystem.getArmorEffects();
    expect(a.encounterReduction).toBe(0);
    expect(a.stealthBonus).toBe(0);
    expect(a.moraleDecayReduction).toBe(0);
    expect(a.travelCostReduction).toBe(0);
    expect(a.fatigueMult).toBe(1);
    expect(a.coldResistMult).toBe(1);
    expect(a.hypothermiaChanceMult).toBe(1);
    expect(a.craftSuccessBonus).toBe(0);
    expect(a.critBonus).toBe(0);
    expect(a.critMultiplierBonus).toBe(0);
    expect(a.hpRegenPerTP).toBe(0);
    expect(a.coldImmunity).toBe(false);
  });

  it('위장복 — 조우 감소와 은신 보너스', () => {
    equip('ghillie_suit', 'body');
    const a = StatSystem.getArmorEffects();
    expect(a.encounterReduction).toBeCloseTo(0.5);
    expect(a.stealthBonus).toBeCloseTo(0.9);
  });

  it('금시계 — 사기 감소 억제', () => {
    equip('gold_watch', 'accessory');
    expect(StatSystem.getArmorEffects().moraleDecayReduction).toBeCloseTo(0.5);
  });

  it('승무원 통행증 — 이동 비용 감소', () => {
    equip('crew_pass', 'accessory');
    expect(StatSystem.getArmorEffects().travelCostReduction).toBeCloseTo(0.5);
  });

  it('어머니의 목걸이 — 사기 억제 + HP 재생', () => {
    equip('mothers_necklace', 'accessory');
    const a = StatSystem.getArmorEffects();
    expect(a.moraleDecayReduction).toBeCloseTo(0.4);
    expect(a.hpRegenPerTP).toBe(1);
  });

  it('러닝화 — 피로 배율은 곱으로 쌓인다', () => {
    equip('running_shoes', 'boots');
    expect(StatSystem.getArmorEffects().fatigueMult).toBeLessThan(1);
  });

  it('방한복 — 한기 저항과 저체온증 확률 배율', () => {
    equip('warm_clothes', 'body');
    const a = StatSystem.getArmorEffects();
    expect(a.coldResistMult).toBeLessThan(1);
    expect(a.hypothermiaChanceMult).toBeLessThan(1);
  });

  it('극한 방한복 — 한랭 면역과 체온 하한', () => {
    equip('extreme_cold_suit', 'body');
    const a = StatSystem.getArmorEffects();
    expect(a.coldImmunity).toBe(true);
    expect(a.temperatureMin).toBe(-40);
  });

  it('호랑이 이빨 목걸이 — 치명타 확률·배율', () => {
    equip('tiger_fang_necklace', 'accessory');
    const a = StatSystem.getArmorEffects();
    expect(a.critBonus).toBeGreaterThan(0);
    expect(a.critMultiplierBonus).toBeGreaterThan(0);
  });

  it('정밀 작업장갑 — 제작 성공률', () => {
    equip('work_gloves_plus', 'hands');
    expect(StatSystem.getArmorEffects().craftSuccessBonus).toBeGreaterThan(0);
  });

  it('기존 5종 집계는 그대로다', () => {
    equip('tactical_vest', 'body');
    expect(StatSystem.getArmorEffects().damageReduction).toBeGreaterThan(0);
  });
});

describe('소비처 반영', () => {
  it('사기 자연 감소가 억제된다', () => {
    GameState.stats.morale.current = 80;
    const before = GameState.stats.morale.current;
    StatSystem._applyNaturalDecay?.();
    const plain = before - GameState.stats.morale.current;

    GameState.stats.morale.current = 80;
    equip('gold_watch', 'accessory');
    StatSystem._applyNaturalDecay?.();
    const guarded = 80 - GameState.stats.morale.current;

    expect(guarded).toBeLessThan(plain);
  });

  it('이동 비용이 줄어든다', () => {
    const base = StatSystem.applyTravelCost(4);
    equip('crew_pass', 'accessory');
    expect(StatSystem.applyTravelCost(4)).toBeLessThan(base);
  });

  it('TP마다 HP가 재생된다', () => {
    GameState.player.hp.current = 50;
    equip('mothers_necklace', 'accessory');
    StatSystem._applyArmorRegen();
    expect(GameState.player.hp.current).toBe(51);
  });
});
