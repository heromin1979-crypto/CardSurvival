// === 비-consumable 타입 섭취 회귀 테스트 ===
// regression: 사용 버튼 게이트가 type === 'consumable'을 강제해 재료(야생 베리)·
// special(생존자 메모, 비상키트)의 onConsume이 사장되어 있던 문제.
// ModalManager의 canConsume은 getConsumableEffect와 동일 판정을 쓴다.
import { describe, it, expect } from 'vitest';
import { getConsumableEffect } from '../../js/systems/ItemEffectSystem.js';
import ITEMS from '../../js/data/items.js';

describe('비-consumable 섭취 판정', () => {
  it('야생 베리는 재료지만 생식 효과(onConsume)를 가진다', () => {
    expect(ITEMS.wild_berry.type).toBe('material');
    expect(getConsumableEffect(ITEMS.wild_berry)).toEqual({ nutrition: 8, infection: 5 });
  });

  it('생존자 메모·비상키트(special)도 섭취 판정을 통과한다', () => {
    expect(getConsumableEffect(ITEMS.survivor_note)).toBeTruthy();
    expect(getConsumableEffect(ITEMS.emergency_kit)).toBeTruthy();
  });

  it('생식 재료 3종은 감염 위험(5-10)을 안고 먹을 수 있다', () => {
    expect(getConsumableEffect(ITEMS.mushroom_edible)).toEqual({ nutrition: 10, infection: 7 });
    expect(getConsumableEffect(ITEMS.meat_strip)).toEqual({ nutrition: 15, infection: 8 });
    expect(getConsumableEffect(ITEMS.raw_fish)).toEqual({ nutrition: 10, infection: 10 });
  });

  it('onConsume 없는 재료는 여전히 섭취 불가다', () => {
    expect(getConsumableEffect(ITEMS.grain)).toBeNull();
    expect(getConsumableEffect(ITEMS.alcohol_solution)).toBeNull();
  });
});
