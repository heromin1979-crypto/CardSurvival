// @vitest-environment happy-dom
// === 도구 onUse 효과의 소비 배선 검증 ===
// _collectToolEffects가 모으는 4개 값 중 어떤 것이 실제로 쓰이는지 소스로 확인한다.
// encounterReduction은 toolEffects.encounterReduction이라는 다른 이름으로 소비되고
// 있어 함수 내부만 훑으면 죽은 것처럼 보인다. scoutBonus는 실제로 소비처가 없다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '../../js/systems/ExploreSystem.js'), 'utf8');

/**
 * 집계 결과를 실제로 읽는 곳이 있는지.
 * 집계 함수 내부는 result.<field>로 쓰고, 소비처는 반환값을 받은 변수
 * (toolEffects / effects)로 읽는다. 후자만 찾으면 소비 여부가 갈린다.
 */
function hasConsumer(field) {
  return new RegExp(`(toolEffects|effects)\\.${field}\\b`).test(SRC);
}

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player = { ...(GameState.player ?? {}), isAlive: true, equipped: {}, structureDurabilityBonus: 1.0 };
}

function place(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

describe('_collectToolEffects — 집계', () => {
  beforeEach(resetWorld);

  it('나침반의 조우 감소를 집계한다', () => {
    place('compass');
    expect(ExploreSystem._collectToolEffects().encounterReduction)
      .toBeCloseTo(ITEMS.compass.onUse.encounterReduction);
  });

  it('손전등의 탐색 보너스를 집계한다', () => {
    place('flashlight');
    expect(ExploreSystem._collectToolEffects().exploreBonus)
      .toBe(ITEMS.flashlight.onUse.exploreBonus);
  });

  it('여러 개를 들면 합산된다', () => {
    place('compass');
    place('compass');
    expect(ExploreSystem._collectToolEffects().encounterReduction)
      .toBeCloseTo(ITEMS.compass.onUse.encounterReduction * 2);
  });
});

describe('소비 배선 — 어떤 값이 실제로 쓰이는가', () => {
  it('encounterReduction은 조우 확률 계산에 쓰인다 (나침반 작동)', () => {
    expect(hasConsumer('encounterReduction')).toBe(true);
  });

  it('exploreBonus는 추가 발견에 쓰인다', () => {
    expect(hasConsumer('exploreBonus')).toBe(true);
  });

  it('noiseMult는 소음 계산에 쓰인다', () => {
    expect(hasConsumer('noiseMult')).toBe(true);
  });
});

describe('나침반 — 설명과 실제가 일치한다', () => {
  it('설명이 약속한 조우 감소를 데이터로 선언한다', () => {
    expect(ITEMS.compass.description).toMatch(/조우 확률/);
    expect(ITEMS.compass.onUse.encounterReduction).toBeGreaterThan(0);
  });

  it('감소량은 밸런스 상한 아래다', () => {
    expect(ITEMS.compass.onUse.encounterReduction).toBeLessThan(0.85);
  });
});

describe('쌍안경 — 조우 감소로 전환', () => {
  // '조우 예측'은 코드에 정의된 적이 없는 개념이라 scoutBonus는 집계만 되고
  // 버려졌다. 컨셉(먼 거리 정찰 → 위험 회피)을 이미 작동하는 조우 감소로
  // 옮겨 새 메커니즘 없이 살린다.
  it('두 쌍안경 모두 조우 감소를 준다', () => {
    expect(ITEMS.binoculars.onUse.encounterReduction).toBeGreaterThan(0);
    expect(ITEMS.binoculars_pro.onUse.encounterReduction).toBeGreaterThan(0);
  });

  it('프로가 일반보다 강하다 (개조할 이유)', () => {
    expect(ITEMS.binoculars_pro.onUse.encounterReduction)
      .toBeGreaterThan(ITEMS.binoculars.onUse.encounterReduction);
  });

  it('일반 쌍안경은 나침반보다 약하다', () => {
    expect(ITEMS.binoculars.onUse.encounterReduction)
      .toBeLessThan(ITEMS.compass.onUse.encounterReduction);
  });

  it('프로 쌍안경은 나침반보다 강하다', () => {
    expect(ITEMS.binoculars_pro.onUse.encounterReduction)
      .toBeGreaterThan(ITEMS.compass.onUse.encounterReduction);
  });

  it('죽은 scoutBonus 선언이 남아 있지 않다', () => {
    const withScout = Object.values(ITEMS).filter(d => d.onUse?.scoutBonus !== undefined);
    expect(withScout.map(d => d.id)).toEqual([]);
  });

  it('집계기도 더 이상 scoutBonus를 모으지 않는다', () => {
    expect(SRC).not.toMatch(/scoutBonus/);
  });

  it('설명이 조우 예측이 아니라 조우 회피를 말한다', () => {
    for (const id of ['binoculars', 'binoculars_pro']) {
      expect(ITEMS[id].description).not.toMatch(/조우 예측/);
      expect(ITEMS[id].description).toMatch(/조우/);
    }
  });

  it('보드에 함께 두면 합산된다', () => {
    resetWorld();
    place('binoculars');
    place('compass');
    expect(ExploreSystem._collectToolEffects().encounterReduction).toBeCloseTo(
      ITEMS.binoculars.onUse.encounterReduction + ITEMS.compass.onUse.encounterReduction);
  });
});
