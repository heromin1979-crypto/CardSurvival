// === 아이템 영문 로케일 커버리지 ===
// I18n.itemName은 '_item.<id>' 키가 없으면 한글명으로 폴백한다.
// 영어 모드에서 한글이 노출되지 않도록 전 아이템의 영문 키 보유를 강제한다.
import { describe, it, expect } from 'vitest';
import ITEMS from '../../js/data/items.js';
import { NPC_ITEMS } from '../../js/data/npcs.js';
import { en } from '../../js/data/locales.js';

describe('영문 로케일 — 아이템 이름', () => {
  it('모든 아이템이 _item.<id> 영문 키를 가진다', () => {
    const missing = Object.keys(ITEMS).filter(id => !en[`_item.${id}`]);
    expect(missing).toEqual([]);
  });

  // NPC·환자 카드도 같은 _item.* 경로로 이름을 조회한다 (NPCSystem.js).
  it('모든 NPC·환자 카드가 _item.<id> 영문 키를 가진다', () => {
    const missing = Object.keys(NPC_ITEMS).filter(id => !en[`_item.${id}`]);
    expect(missing).toEqual([]);
  });

  it('영문 이름에 한글이 남아 있지 않다', () => {
    const hangul = Object.entries(en)
      .filter(([k, v]) => k.startsWith('_item.') && /[가-힣]/.test(v))
      .map(([k]) => k);
    expect(hangul).toEqual([]);
  });
});
