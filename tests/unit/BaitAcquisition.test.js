// === 미끼 획득 경로 일원화 ===
// 확정 수량을 주던 미끼 청사진 2개를 채집 액션이 대체한다.
// 곤충 미끼가 낚시 스킬 2를 요구하면서 효과는 절반이던 어색함도 함께 사라진다.
import { describe, expect, it } from 'vitest';
import BLUEPRINTS from '../../js/data/blueprints.js';
import BLUEPRINTS_ADVANCED from '../../js/data/blueprints_advanced.js';
import ITEMS from '../../js/data/items.js';
import { DISTRICTS } from '../../js/data/districts.js';

const BAITS = ['bait_worm', 'bait_insect'];

describe('미끼 청사진 제거', () => {
  it.each(BAITS)('%s를 산출하는 청사진이 없다', id => {
    for (const set of [BLUEPRINTS, BLUEPRINTS_ADVANCED]) {
      for (const bp of Object.values(set)) {
        const makes = (bp.output ?? []).some(o => o.definitionId === id);
        expect(makes, `${bp.id}가 ${id}를 산출`).toBe(false);
      }
    }
  });
});

describe('남은 획득 경로', () => {
  it('채집 액션이 유일한 제작 경로다', () => {
    const yields = ITEMS.dry_grass.gather.yields.map(y => y.definitionId);
    expect(yields.sort()).toEqual([...BAITS].sort());
  });

  it('구 탐색으로도 지렁이 미끼를 얻을 수 있다', () => {
    const n = Object.values(DISTRICTS)
      .filter(d => (d.lootTable ?? []).some(l => l.definitionId === 'bait_worm')).length;
    expect(n).toBeGreaterThan(0);
  });
});

describe('마른 풀의 다른 용도는 유지된다', () => {
  it('불쏘시개 청사진이 남아 있다', () => {
    const kindling = Object.values(BLUEPRINTS).filter(bp =>
      (bp.stages ?? []).some(s => (s.requiredItems ?? []).some(i => i.definitionId === 'dry_grass')));
    expect(kindling.length).toBeGreaterThan(0);
  });

  it('마른 풀은 여전히 불쏘시개 태그를 갖는다', () => {
    expect(ITEMS.dry_grass.tags).toContain('fire');
  });
});
