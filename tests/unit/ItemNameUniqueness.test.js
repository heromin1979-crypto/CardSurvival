// @vitest-environment happy-dom
// === 아이템 표시명 유일성 테스트 ===
// 같은 한글명을 쓰는 아이템이 둘 있으면 제작·조합·퀘스트 UI에서 구분이 불가능하다.
// 실제 사례: '개량 낚싯대'(fishing_rod_improved / fishing_rod_advanced),
// '구운 생선'(grilled_fish / fish_cooked). 둘 다 중복 '키'가 아니라 중복 '이름'이라
// CardImageMapping의 중복 키 검사에 걸리지 않았다.
//
// 랜드마크(type:'location')는 제외한다. 한강 10개 구역처럼 같은 이름을 구 단위로
// 나눠 쓰는 것이 의도된 설계다.
import { describe, it, expect } from 'vitest';
import ITEMS from '../../js/data/items.js';
import { en } from '../../js/data/locales.js';

const displayItems = Object.values(ITEMS).filter(d => d.type !== 'location');

/** name → [id...] 로 묶어 2건 이상인 것만 반환 */
function duplicatesBy(pick) {
  const byKey = {};
  for (const d of displayItems) {
    const key = pick(d);
    if (!key) continue;
    (byKey[key] ??= []).push(d.id);
  }
  return Object.entries(byKey)
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => `${key} → ${ids.join(', ')}`);
}

describe('아이템 표시명 유일성', () => {
  it('한글명이 겹치는 아이템이 없다', () => {
    expect(duplicatesBy(d => d.name)).toEqual([]);
  });

  it('영문명이 겹치는 아이템이 없다', () => {
    expect(duplicatesBy(d => en[`_item.${d.id}`])).toEqual([]);
  });
});

describe('과거 중복 사례 회귀 방지', () => {
  const PAIRS = [
    ['fishing_rod_improved', 'fishing_rod_advanced'],
    ['grilled_fish', 'fish_cooked'],
  ];

  it.each(PAIRS)('%s 와 %s 의 한글명이 다르다', (a, b) => {
    expect(ITEMS[a].name).not.toBe(ITEMS[b].name);
  });

  it.each(PAIRS)('%s 와 %s 의 영문명이 다르다', (a, b) => {
    expect(en[`_item.${a}`]).not.toBe(en[`_item.${b}`]);
  });
});
