// === 시크릿 조합 — 이름·힌트·안내문이 실제 산출물과 일치하는지 ===
// 조합의 name/hint/discoveryMsg는 갤러리와 발견 알림에 그대로 노출되므로,
// result.spawnItem이 가리키는 실제 아이템과 다른 물건을 지칭하면 안 된다.
import { describe, it, expect } from 'vitest';
import ITEMS from '../../js/data/items.js';
import SECRET_COMBINATIONS from '../../js/data/secretCombinations.js';

const byId = id => SECRET_COMBINATIONS.find(c => c.id === id);

describe('시크릿 조합 — 산출물과 어긋난 지칭 제거', () => {
  // [조합 id, 산출물 id, 안내문에 등장하면 안 되는 표현]
  const CASES = [
    ['sc_honey_medicine',     'strong_painkiller', ['연고']],
    ['sc_natural_antibiotic', 'antiseptic',        ['연고']],
    ['sc_sling',              'sling',             ['투석기', '무기']],
  ];

  for (const [comboId, itemId, forbidden] of CASES) {
    const combo = byId(comboId);

    it(`${comboId}: 산출물이 ${itemId}로 유지된다`, () => {
      expect(combo.result.spawnItem).toBe(itemId);
    });

    it(`${comboId}: 다른 물건을 지칭하는 표현이 남아 있지 않다`, () => {
      const text = `${combo.name} ${combo.hint} ${combo.discoveryMsg}`;
      for (const word of forbidden) {
        expect(text).not.toContain(word);
      }
    });
  }

  it('sc_sling 안내문이 삼각건의 실제 용도(골절 고정)를 설명한다', () => {
    expect(ITEMS.sling.description).toContain('골절');
    expect(byId('sc_sling').discoveryMsg).toContain('골절');
  });

  it('sc_natural_antibiotic 안내 수량이 spawnQty와 일치한다', () => {
    const combo = byId('sc_natural_antibiotic');
    expect(combo.result.spawnQty).toBe(2);
    expect(combo.discoveryMsg).toContain('2개');
  });
});
