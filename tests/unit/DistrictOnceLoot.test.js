// === 구별 1회 획득 자원 회귀 테스트 ===
// regression: 바닥에 남는 자원(환경물·잔해)이 같은 구에서 무제한 중복 획득됐다.
// 도봉구 탐색 20회 시뮬에서 말라비틀어진 나무가 최대 7개, 자판기·폐냉장고가 4대까지
// 쌓였고, stackable(max10)인 산개울은 스택 병합으로 quantity가 합산돼 물 잔량이
// 무한 리필됐다 — dry_stream 전환과 비 리필 설계가 무력화됐다.
import { describe, it, expect } from 'vitest';
import {
  isDistrictOnceLoot,
  districtOnceKey,
  filterDistrictOnceLoot,
} from '../../js/systems/districtOnceLoot.js';
import ITEMS from '../../js/data/items.js';
import { DISTRICTS } from '../../js/data/districts.js';

const getDef = id => ITEMS[id] ?? null;

describe('isDistrictOnceLoot — 판정 대상', () => {
  it('환경물(개울)은 구별 1회 대상이다', () => {
    expect(isDistrictOnceLoot(ITEMS.stream_spring)).toBe(true);
    expect(isDistrictOnceLoot(ITEMS.dry_stream)).toBe(true);
  });

  it('잔해·자연 구조물은 구별 1회 대상이다', () => {
    expect(isDistrictOnceLoot(ITEMS.vending_machine)).toBe(true);
    expect(isDistrictOnceLoot(ITEMS.abandoned_fridge)).toBe(true);
    expect(isDistrictOnceLoot(ITEMS.withered_tree)).toBe(true);
    expect(isDistrictOnceLoot(ITEMS.weed_patch)).toBe(true);
  });

  it('일반 재료·소모품은 대상이 아니다 — 반복 채집이 유지된다', () => {
    expect(isDistrictOnceLoot(ITEMS.wood)).toBe(false);
    expect(isDistrictOnceLoot(ITEMS.herb)).toBe(false);
    expect(isDistrictOnceLoot(ITEMS.contaminated_water)).toBe(false);
    expect(isDistrictOnceLoot(ITEMS.purified_water)).toBe(false);
  });

  it('def.districtOnce === false로 예외 처리할 수 있다', () => {
    expect(isDistrictOnceLoot({ ...ITEMS.vending_machine, districtOnce: false })).toBe(false);
  });

  it('정의가 없으면 false', () => {
    expect(isDistrictOnceLoot(null)).toBe(false);
    expect(isDistrictOnceLoot(undefined)).toBe(false);
  });
});

describe('districtOnceKey', () => {
  it('구와 아이템을 조합한 키를 만든다', () => {
    expect(districtOnceKey('dobong', 'stream_spring')).toBe('dobong:stream_spring');
  });
});

describe('filterDistrictOnceLoot', () => {
  it('처음 획득하는 자원은 통과시키고 키를 반환한다', () => {
    const loot = [{ definitionId: 'stream_spring', quantity: 1 }];
    const r = filterDistrictOnceLoot(loot, 'dobong', [], getDef);
    expect(r.loot).toHaveLength(1);
    expect(r.newKeys).toEqual(['dobong:stream_spring']);
  });

  it('이미 획득한 자원은 드랍에서 제외한다', () => {
    const loot = [{ definitionId: 'stream_spring', quantity: 1 }];
    const r = filterDistrictOnceLoot(loot, 'dobong', ['dobong:stream_spring'], getDef);
    expect(r.loot).toHaveLength(0);
    expect(r.newKeys).toEqual([]);
  });

  it('다른 구에서는 같은 자원을 다시 획득할 수 있다', () => {
    const loot = [{ definitionId: 'stream_spring', quantity: 1 }];
    const r = filterDistrictOnceLoot(loot, 'gangbuk', ['dobong:stream_spring'], getDef);
    expect(r.loot).toHaveLength(1);
    expect(r.newKeys).toEqual(['gangbuk:stream_spring']);
  });

  it('한 번의 드랍 안에서 같은 자원이 두 번 뽑히면 하나만 남긴다', () => {
    const loot = [
      { definitionId: 'withered_tree', quantity: 1 },
      { definitionId: 'withered_tree', quantity: 1 },
    ];
    const r = filterDistrictOnceLoot(loot, 'dobong', [], getDef);
    expect(r.loot).toHaveLength(1);
    expect(r.newKeys).toEqual(['dobong:withered_tree']);
  });

  it('일반 자원은 같은 드랍에 여러 개 있어도 모두 통과한다', () => {
    const loot = [
      { definitionId: 'wood', quantity: 2 },
      { definitionId: 'wood', quantity: 1 },
      { definitionId: 'herb', quantity: 1 },
    ];
    const r = filterDistrictOnceLoot(loot, 'dobong', [], getDef);
    expect(r.loot).toHaveLength(3);
    expect(r.newKeys).toEqual([]);
  });

  it('통과한 자원의 수량·오염도를 변경하지 않는다', () => {
    const loot = [{ definitionId: 'withered_tree', quantity: 1, contamination: 50 }];
    const r = filterDistrictOnceLoot(loot, 'dobong', [], getDef);
    expect(r.loot[0]).toEqual({ definitionId: 'withered_tree', quantity: 1, contamination: 50 });
  });

  it('빈 드랍은 빈 결과를 낸다', () => {
    const r = filterDistrictOnceLoot([], 'dobong', [], getDef);
    expect(r.loot).toEqual([]);
    expect(r.newKeys).toEqual([]);
  });

  it('연속 탐색을 누적하면 대상 자원은 구별 1개로 수렴한다', () => {
    const claimed = [];
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const r = filterDistrictOnceLoot(
        [{ definitionId: 'stream_spring', quantity: 1 }, { definitionId: 'wood', quantity: 1 }],
        'dobong', claimed, getDef);
      claimed.push(...r.newKeys);
      total += r.loot.filter(e => e.definitionId === 'stream_spring').length;
    }
    expect(total).toBe(1);
  });
});

describe('산개울 스택 설정', () => {
  // quantity가 물 잔량으로 쓰이므로(interactions.js fill_bottle_stream,
  // WeatherSystem._refillDryStreams) 스택 병합이 곧 물 리필이 된다. 병합 경로를 닫는다.
  it('산개울은 스택 불가여야 한다 — 병합이 물 리필 우회가 된다', () => {
    expect(ITEMS.stream_spring.stackable).toBe(false);
  });

  it('마른 개울도 스택 불가다 (기존 설정 유지)', () => {
    expect(ITEMS.dry_stream.stackable).toBe(false);
  });
});

describe('데이터 전제', () => {
  it('구 lootTable의 대상 자원은 모두 수량 1-1이다 — 1회 획득이 곧 1개 획득', () => {
    for (const [, dist] of Object.entries(DISTRICTS)) {
      for (const e of dist.lootTable ?? []) {
        if (!isDistrictOnceLoot(ITEMS[e.definitionId])) continue;
        expect(e.minQty ?? 1).toBe(1);
        expect(e.maxQty ?? 1).toBe(1);
      }
    }
  });
});
