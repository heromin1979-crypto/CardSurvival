// === 미끼 라인 일원화 ===
// 낚시 시스템(2026-04-13)이 bait 태그로 미끼를 찾도록 만들어진 뒤,
// 크래프팅 대규모 확장(2026-04-15)이 bait 태그 없는 worm/fishing_bait를 따로 추가했다.
// 두 라인이 서로를 모른 채 공존해, 비싼 쪽(약초+지렁이 → 낚시 미끼)이 아무 효과도 내지 못했다.
// 죽은 라인을 걷어내고 실제로 동작하는 bait_worm 하나로 모은다.
import { describe, expect, it } from 'vitest';
import ITEMS from '../../js/data/items.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import BLUEPRINTS_ADVANCED from '../../js/data/blueprints_advanced.js';
import { DISTRICTS } from '../../js/data/districts.js';
import CardFactory from '../../js/ui/CardFactory.js';
import { en } from '../../js/data/locales.js';

const REMOVED = ['worm', 'fishing_bait'];

describe('죽은 미끼 라인 제거', () => {
  it.each(REMOVED)('%s 아이템 정의가 사라졌다', id => {
    expect(ITEMS[id]).toBeUndefined();
  });

  it('낚시 미끼 준비(prep_bait) 레시피가 사라졌다', () => {
    expect(BLUEPRINTS_ADVANCED.prep_bait).toBeUndefined();
    expect(BLUEPRINTS.prep_bait).toBeUndefined();
  });

  it.each(REMOVED)('%s를 재료나 산출물로 쓰는 청사진이 없다', id => {
    for (const set of [BLUEPRINTS, BLUEPRINTS_ADVANCED]) {
      for (const bp of Object.values(set)) {
        const inOutput = (bp.output ?? []).some(o => o.definitionId === id);
        const inStages = (bp.stages ?? []).some(s =>
          (s.requiredItems ?? []).some(i => i.definitionId === id));
        expect(inOutput || inStages, `${bp.id}가 ${id}를 참조`).toBe(false);
      }
    }
  });

  it.each(REMOVED)('%s가 구역 획득 테이블에 남아 있지 않다', id => {
    for (const [key, d] of Object.entries(DISTRICTS)) {
      const hit = (d.lootTable ?? []).some(l => l.definitionId === id);
      expect(hit, `${d.name ?? key}에 ${id}가 남음`).toBe(false);
    }
  });

  it.each(REMOVED)('%s의 카드 이미지·영문 이름 참조가 정리됐다', id => {
    expect(CardFactory.images?.[id]).toBeUndefined();
    expect(en[`_item.${id}`]).toBeUndefined();
  });
});

describe('지렁이 미끼로 대체', () => {
  it('지렁이가 나오던 7개 구에서 이제 지렁이 미끼가 나온다', () => {
    const districts = Object.values(DISTRICTS)
      .filter(d => (d.lootTable ?? []).some(l => l.definitionId === 'bait_worm'));
    expect(districts.length).toBe(7);
  });

  it('대체 항목이 원래 지렁이와 같은 확률·수량을 유지한다', () => {
    for (const d of Object.values(DISTRICTS)) {
      const entry = (d.lootTable ?? []).find(l => l.definitionId === 'bait_worm');
      if (!entry) continue;
      expect(entry).toMatchObject({ weight: 8, minQty: 1, maxQty: 3 });
    }
  });

  it('획득 테이블에 들어가므로 스택 설정이 등록되어 있다', () => {
    expect(ITEMS.bait_worm.stackable).toBe(true);
    expect(ITEMS.bait_worm.maxStack).toBeGreaterThan(1);
  });
});

describe('미끼 설명이 사용법을 알려준다', () => {
  it.each(['bait_worm', 'bait_insect'])('%s 설명에 낚싯대 사용법이 있다', id => {
    expect(ITEMS[id].description).toContain('낚싯대');
  });

  it.each(['bait_worm', 'bait_insect'])('%s 설명에 통발 용도가 있다', id => {
    expect(ITEMS[id].description).toContain('통발');
  });

  it('어획 보정 수치를 그대로 유지한다', () => {
    expect(ITEMS.bait_worm.description).toContain('10%');
    expect(ITEMS.bait_insect.description).toContain('5%');
  });
});
