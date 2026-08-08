// === 벌통 꿀 생산 · 해체 산출 ===
import { describe, it, expect } from 'vitest';
import ITEMS from '../../js/data/items.js';

const hive = ITEMS.bee_hive;

describe('벌통 — 꿀 자동 수확', () => {
  it('GardenSystem이 읽는 harvest 형식으로 꿀을 4일마다 1개 산출한다', () => {
    expect(hive.harvest).toEqual({ itemId: 'honey', harvestDays: 4, qty: 1 });
  });

  it('산출 아이템이 실제 정의를 가진다', () => {
    expect(ITEMS[hive.harvest.itemId]).toBeDefined();
  });

  // onTick은 스탯 키만 처리되므로 아이템 생산 선언에 쓰면 조용히 무시된다.
  it('읽히지 않는 onTick 생산 선언이 남아 있지 않다', () => {
    expect(hive.onTick?.honey).toBeUndefined();
  });
});

describe('벌통 — 해체', () => {
  it('해체하면 꿀 5개가 확정으로 나온다', () => {
    const honey = hive.dismantle.find(d => d.definitionId === 'honey');
    expect(honey).toBeDefined();
    expect(honey.qty).toBe(5);
    expect(honey.chance).toBe(1.0);
  });

  it('기존 해체 산출물(판자·로프)이 유지된다', () => {
    const ids = hive.dismantle.map(d => d.definitionId);
    expect(ids).toContain('wood_plank');
    expect(ids).toContain('rope');
  });
});
