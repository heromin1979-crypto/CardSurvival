// === 도구·구조물 효과 배선 ===
// regression: 보드에 올려둔 도구의 onUse 필드는 ExploreSystem._collectToolEffects가 읽는
// exploreBonus·encounterReduction·noiseMult 세 개와 NoiseSystem의 noiseReduction뿐이었다.
// 나머지(도끼의 벌목, 삽의 굴착, 망치의 건축, 장인의 도구 세트의 제작 보정 등)는
// 선언만 있고 읽는 곳이 없어 카드 설명이 그대로 거짓이었다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import StatSystem from '../../js/systems/StatSystem.js';
import DismantleSystem from '../../js/systems/DismantleSystem.js';

function place(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  return inst;
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.equipped = {};
  GameState.player.skills = {};
});

describe('getToolEffects 집계', () => {
  it('기본값', () => {
    const t = StatSystem.getToolEffects();
    expect(t.woodChopBonus).toBe(0);
    expect(t.digBonus).toBe(0);
    expect(t.buildingBonus).toBe(0);
    expect(t.craftSuccessBonus).toBe(0);
    expect(t.craftTimeReduction).toBe(0);
    expect(t.foodDecayDelta).toBe(0);
  });

  it('도끼·삽·망치를 지니면 작업 보너스가 잡힌다', () => {
    place('axe'); place('shovel'); place('hammer');
    const t = StatSystem.getToolEffects();
    expect(t.woodChopBonus).toBe(2);
    expect(t.digBonus).toBe(2);
    expect(t.buildingBonus).toBe(-1);
  });

  it('장인의 도구 세트 — 제작 성공률·시간', () => {
    place('master_toolkit');
    const t = StatSystem.getToolEffects();
    expect(t.craftSuccessBonus).toBeCloseTo(0.5);
    expect(t.craftTimeReduction).toBeCloseTo(0.3);
  });

  it('야전 연구실도 제작 성공률에 더해진다', () => {
    place('master_toolkit'); place('field_laboratory');
    expect(StatSystem.getToolEffects().craftSuccessBonus).toBeCloseTo(0.8);
  });

  it('땅굴 저장고 — 부패 지연', () => {
    place('root_cellar');
    expect(StatSystem.getToolEffects().foodDecayDelta).toBeCloseTo(-0.5);
  });
});

describe('해체 TP 반영', () => {
  it('도끼를 지니면 나무 해체가 빨라진다', () => {
    const base = DismantleSystem.dismantleTPFor('tree_env');
    place('axe');
    expect(DismantleSystem.dismantleTPFor('tree_env')).toBeLessThan(base);
  });

  it('최소 1TP는 남는다', () => {
    place('axe'); place('shovel'); place('hammer');
    expect(DismantleSystem.dismantleTPFor('tree_env')).toBeGreaterThanOrEqual(1);
  });

  it('관련 없는 구조물은 영향받지 않는다', () => {
    const base = DismantleSystem.dismantleTPFor('workbench');
    place('axe');
    expect(DismantleSystem.dismantleTPFor('workbench')).toBe(base);
  });
});

describe('제작 성공률·시간 반영', () => {
  it('도구 세트가 제작 TP를 줄인다', () => {
    const base = StatSystem.applyCraftTime(10);
    place('master_toolkit');
    expect(StatSystem.applyCraftTime(10)).toBeLessThan(base);
  });

  it('제작 TP는 최소 1이다', () => {
    place('master_toolkit');
    expect(StatSystem.applyCraftTime(1)).toBeGreaterThanOrEqual(1);
  });
});
