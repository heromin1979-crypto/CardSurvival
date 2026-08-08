// === 꿀 섭취/재료 겸용 · 벌통 바닥 고정 ===
import { describe, it, expect } from 'vitest';
import ITEMS from '../../js/data/items.js';
import SECRET_COMBINATIONS from '../../js/data/secretCombinations.js';
import { getConsumableEffect } from '../../js/systems/ItemEffectSystem.js';
import { isImmovable } from '../../js/board/SlotResolver.js';

const honey = ITEMS.honey;

describe('꿀 — 섭취와 재료 겸용', () => {
  it('재료 타입을 유지한다', () => {
    expect(honey.type).toBe('material');
  });

  // getConsumableEffect는 type과 무관하게 onConsume을 인정한다.
  it('섭취 효과가 사기 +15, 피로 -5로 인식된다', () => {
    expect(getConsumableEffect(honey)).toEqual({ morale: 15, fatigue: -5 });
  });

  // 조합(꿀+약초 가루)이 단독 섭취보다 나아야 재료를 소모할 이유가 생긴다.
  it('단독 섭취가 강력 진통제보다 피로 회복이 약하다', () => {
    const solo = getConsumableEffect(honey);
    const combo = ITEMS.strong_painkiller.onConsume;
    expect(solo.fatigue).toBeGreaterThan(combo.fatigue);
  });

  it('읽히지 않던 onUse 선언이 남아 있지 않다', () => {
    expect(honey.onUse).toBeUndefined();
  });
});

describe('시크릿 조합 — 안내문과 실제 효과 일치', () => {
  // 강력 진통제를 산출하는 두 조합은 같은 효과를 안내해야 한다.
  const painkillerCombos = ['sc_honey_medicine', 'sc_painkiller_mix'];

  for (const id of painkillerCombos) {
    it(`${id}: 안내문이 산출물의 실제 효과와 일치한다`, () => {
      const combo = SECRET_COMBINATIONS.find(c => c.id === id);
      const out = ITEMS[combo.result.spawnItem];
      expect(out.onConsume.morale).toBe(15);
      expect(out.onConsume.fatigue).toBe(-10);
      expect(combo.discoveryMsg).toContain('사기 +15');
      expect(combo.discoveryMsg).toContain('피로 -10');
    });

    it(`${id}: 실제 효과에 없는 항목을 안내하지 않는다`, () => {
      const combo = SECRET_COMBINATIONS.find(c => c.id === id);
      for (const absent of ['감염', 'HP', '트라우마']) {
        expect(combo.discoveryMsg).not.toContain(absent);
      }
    });
  }
});

describe('벌통 — 바닥 고정', () => {
  it('immovable 판정을 받아 드래그·배낭 수납이 막힌다', () => {
    expect(isImmovable(ITEMS.bee_hive)).toBe(true);
  });
});
