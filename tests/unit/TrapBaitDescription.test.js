// @vitest-environment happy-dom
// === 덫 설명 ↔ 실제 미끼 판정 일치 테스트 ===
// 비둘기 올가미 설명은 "곡물 미끼 필요"였지만 '곡물 미끼'라는 아이템은 없고,
// 미끼 판정은 baitTags를 OR로 본다. 'food' 하나만 맞아도 통과하므로 통조림·김치까지
// 전부 미끼가 된다. 설명이 실제보다 좁으면 플레이어가 없는 아이템을 찾게 된다.
//
// 미끼를 같은 행에 늘어놓던 옛 룰은 덫 여러 개가 미끼 한 장을 나눠 써서,
// 미끼 카드를 덫 카드에 끌어다 넣는 방식으로 바꿨다 (interactions.js bait_to_trap).
import { describe, it, expect } from 'vitest';
import { INTERACTION_RULES, findInteraction } from '../../js/data/interactions.js';
import { acceptsBait, getBaitCapacity, getBaitTags, describeBaitTags } from '../../js/systems/baitable.js';
import ITEMS from '../../js/data/items.js';

const TRAPS = Object.values(ITEMS).filter(d => d.trapData);
const BAIT_RULE = INTERACTION_RULES.find(r => r.id === 'bait_to_trap');

describe('덫 데이터 전제', () => {
  it('trapData를 가진 덫이 존재한다', () => {
    expect(TRAPS.length).toBeGreaterThan(0);
  });

  it('모든 덫이 baitTags를 선언한다', () => {
    for (const d of TRAPS) expect(d.trapData.baitTags?.length).toBeGreaterThan(0);
  });

  it('모든 덫이 미끼 용량을 선언한다 — 없으면 미끼를 넣을 수 없다', () => {
    for (const d of TRAPS) expect(getBaitCapacity(d)).toBeGreaterThan(0);
  });
});

describe('덫 설명이 실제 판정과 어긋나지 않는다', () => {
  // baitTags에 'food'가 있으면 아무 음식이나 통과한다. 설명이 곡물·고기로
  // 한정하는 것처럼 읽히면 안 된다.
  it.each(TRAPS.map(d => [d.name, d.id]))('%s 설명이 미끼를 좁게 한정하지 않는다', (_name, id) => {
    const d = ITEMS[id];
    if (!d.trapData.baitTags.includes('food')) return;
    expect(d.description).not.toMatch(/곡물 미끼|고기 미끼/);
  });

  // 룰이 바뀌었으므로 설명에 옛 방식이 남아 있으면 안 된다.
  it.each(TRAPS.map(d => [d.name, d.id]))('%s 설명에 옛 배치 방식이 남아 있지 않다', (_name, id) => {
    expect(ITEMS[id].description).not.toContain('같은 행');
  });

  it.each(TRAPS.map(d => [d.name, d.id]))('%s 설명이 미끼를 넣는 동작을 알려준다', (_name, id) => {
    expect(ITEMS[id].description).toContain('미끼로 넣으면');
  });
});

describe('미끼 → 덫 인터랙션 — 실제 판정', () => {
  const snare = ITEMS.pigeon_snare;

  it('음식 카드를 덫에 끌면 규칙이 잡힌다', () => {
    expect(findInteraction(ITEMS.canned_food, snare)?.id).toBe('bait_to_trap');
  });

  it('덫을 음식 카드에 끌어도 같은 동작이 잡힌다', () => {
    expect(findInteraction(snare, ITEMS.canned_food)?.id).toBe('bait_to_trap_rev');
  });

  it('일반 음식이 미끼로 인정된다', () => {
    expect(acceptsBait(snare, ITEMS.canned_food)).toBe(true);
  });

  it('쌀도 미끼로 인정된다', () => {
    expect(acceptsBait(snare, ITEMS.rice)).toBe(true);
  });

  it('음식이 아니면 미끼로 인정되지 않는다', () => {
    expect(acceptsBait(snare, ITEMS.scrap_metal)).toBe(false);
  });

  // 가시 트랩은 tags에 'trap'이 있어 규칙에는 걸리지만 trapData가 없다.
  // canApply가 막지 않으면 미끼가 사라지고 아무 일도 일어나지 않는다.
  it('가시 트랩은 미끼를 받지 않는다', () => {
    expect(getBaitCapacity(ITEMS.spike_trap)).toBe(0);
    const verdict = BAIT_RULE.canApply(
      { definitionId: 'canned_food' },
      { definitionId: 'spike_trap' },
    );
    expect(verdict.ok).toBe(false);
  });

  // baitTags에 실물이 없는 태그를 적어두면 그 줄은 아무 일도 하지 않는다.
  // 'grain'이 그랬다 — 곡물 아이템의 태그는 ['material','food_raw']다.
  it('모든 덫의 baitTags가 실제 아이템을 가리킨다', () => {
    const live = new Set(Object.values(ITEMS).flatMap(d => d.tags ?? []));
    for (const trap of TRAPS) {
      for (const tag of getBaitTags(trap)) {
        expect(live.has(tag), `${trap.name}의 baitTags '${tag}'에 해당하는 아이템이 없다`).toBe(true);
      }
    }
  });

  it('곡물이 쥐덫·비둘기 올가미 미끼로 인정된다', () => {
    expect(acceptsBait(ITEMS.rat_trap, ITEMS.grain)).toBe(true);
    expect(acceptsBait(snare, ITEMS.grain)).toBe(true);
  });

  it('곡물을 덫에 끌면 규칙이 잡힌다', () => {
    expect(findInteraction(ITEMS.grain, snare)?.id).toBe('bait_to_trap');
    expect(findInteraction(snare, ITEMS.grain)?.id).toBe('bait_to_trap_rev');
  });

  // 개·고양이 함정은 육식성이라 생재료 전부를 받지는 않는다.
  it('골목 함정은 채소를 받지 않고 이유를 알려준다', () => {
    expect(acceptsBait(ITEMS.alley_pit_trap, ITEMS.vegetable)).toBe(false);
    const verdict = BAIT_RULE.canApply(
      { definitionId: 'vegetable' },
      { definitionId: 'alley_pit_trap' },
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).not.toMatch(/food|meat/);   // 태그 원문이 새어나오지 않는다
    expect(verdict.reason).toContain('고기');
  });

  it('받는 미끼를 한글로 설명한다', () => {
    expect(describeBaitTags(snare)).toBe('조리·가공 식품·생식 재료');
    expect(describeBaitTags(ITEMS.fish_trap)).toBe('낚시 미끼');
  });

  it('가득 찬 덫은 더 받지 않는다', () => {
    const cap = getBaitCapacity(snare);
    const verdict = BAIT_RULE.canApply(
      { definitionId: 'canned_food' },
      { definitionId: 'pigeon_snare', _baitCharges: cap },
    );
    expect(verdict.ok).toBe(false);
  });

  it('미끼 한 장이 용량을 가득 채운다', () => {
    const trap = { definitionId: 'pigeon_snare', instanceId: 't1' };
    const bait = { definitionId: 'canned_food', instanceId: 'b1', quantity: 2 };
    BAIT_RULE.apply(bait, trap);
    expect(trap._baitCharges).toBe(getBaitCapacity(snare));
    expect(bait.quantity).toBe(1);
  });
});
