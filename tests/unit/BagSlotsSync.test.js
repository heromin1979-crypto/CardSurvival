// === 가방 슬롯 수치 동기화 회귀 테스트 ===
// regression: BAG_EXTRA_SLOTS 테이블(실제 적용)과 아이템 정의의 bagSlots·설명 텍스트가
// 서로 다른 값(구 시스템 3~7)을 표기하던 문제. 세 곳이 항상 같은 값을 말해야 한다.
import { describe, it, expect } from 'vitest';
import { BAG_EXTRA_SLOTS, lookupBagExtraSlots } from '../../js/data/bagSlots.js';
import ITEMS from '../../js/data/items.js';

describe('가방 슬롯 표기·적용 동기화', () => {
  const entries = Object.entries(BAG_EXTRA_SLOTS);

  it.each(entries)('%s: 정의의 bagSlots가 적용 테이블과 일치한다', (id, slots) => {
    expect(ITEMS[id].bagSlots).toBe(slots);
  });

  it.each(entries)('%s: 설명 텍스트가 실제 확장 칸 수를 표기한다', (id, slots) => {
    expect(ITEMS[id].description).toContain(`${slots}칸`);
  });

  it('테이블에 없는 가방은 정의의 bagSlots로 폴백한다', () => {
    expect(lookupBagExtraSlots(ITEMS.waterproof_container)).toBe(8);
  });
});
