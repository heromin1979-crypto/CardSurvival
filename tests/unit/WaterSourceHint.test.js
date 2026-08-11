// === 수원지 급수 판정 일원화 회귀 테스트 ===
// regression: 마른 개울(dry_stream)에 "💧 수집 가능" 배지가 붙었던 문제.
// 배지는 tags에 'water_source'가 있는지만 봤고(CardFactory), 실제 집수 판정은
// subtype + 'dry' 태그 제외를 봤다(DragDrop). 같은 개념을 두 기준으로 판정한 결과
// 표시와 동작이 어긋났다. 두 소비처가 waterSource.js 헬퍼만 보게 통일했다.
import { describe, it, expect } from 'vitest';
import { isWaterSource, isDriedUp, canCollectWater } from '../../js/systems/waterSource.js';
import ITEMS from '../../js/data/items.js';

describe('isWaterSource', () => {
  it('산개울과 마른 개울 모두 수원지로 인식한다', () => {
    expect(isWaterSource(ITEMS.stream_spring)).toBe(true);
    expect(isWaterSource(ITEMS.dry_stream)).toBe(true);
  });

  it('수원지가 아닌 아이템은 false', () => {
    expect(isWaterSource(ITEMS.empty_bottle)).toBe(false);
    expect(isWaterSource(ITEMS.empty_bucket)).toBe(false);
    expect(isWaterSource(undefined)).toBe(false);
  });
});

describe('isDriedUp', () => {
  it('dry 태그가 있으면 마른 것으로 본다', () => {
    expect(isDriedUp(ITEMS.dry_stream)).toBe(true);
  });

  it('물이 있는 개울은 마르지 않았다', () => {
    expect(isDriedUp(ITEMS.stream_spring)).toBe(false);
    expect(isDriedUp(ITEMS.stream_spring, { quantity: 3 })).toBe(false);
  });

  it('잔량이 0인 인스턴스는 태그 전환 전이라도 마른 것으로 본다', () => {
    expect(isDriedUp(ITEMS.stream_spring, { quantity: 0 })).toBe(true);
  });
});

describe('canCollectWater — 배지와 집수가 공유하는 단일 기준', () => {
  it('물이 있는 산개울에서는 수집할 수 있다', () => {
    expect(canCollectWater(ITEMS.stream_spring, { quantity: 10 })).toBe(true);
  });

  it('마른 개울에서는 수집할 수 없다 — 배지도 뜨지 않아야 한다', () => {
    expect(canCollectWater(ITEMS.dry_stream, { quantity: 10 })).toBe(false);
  });

  it('잔량이 0인 산개울에서는 수집할 수 없다', () => {
    expect(canCollectWater(ITEMS.stream_spring, { quantity: 0 })).toBe(false);
  });

  it('수원지가 아닌 아이템에서는 수집할 수 없다', () => {
    expect(canCollectWater(ITEMS.empty_bottle)).toBe(false);
  });
});

describe('데이터 전제 — 판정 기준 두 축이 같은 집합을 가리킨다', () => {
  // 기존 두 소비처가 각각 tags / subtype을 봤다. 헬퍼가 subtype으로 통일한 것이
  // 안전한 이유는 두 축의 대상 집합이 동일하기 때문이다. 이 전제가 깨지면
  // (예: tags에만 water_source를 넣은 신규 환경물) 배지가 조용히 사라진다.
  const byTag     = Object.keys(ITEMS).filter(id => ITEMS[id].tags?.includes('water_source'));
  const bySubtype = Object.keys(ITEMS).filter(id => ITEMS[id].subtype === 'water_source');

  it('tags 기준과 subtype 기준의 대상이 일치한다', () => {
    expect(bySubtype.sort()).toEqual(byTag.sort());
  });

  it('모든 수원지는 급수 가능/마름 중 하나로 분류된다', () => {
    for (const id of bySubtype) {
      const def = ITEMS[id];
      expect(canCollectWater(def) || isDriedUp(def)).toBe(true);
    }
  });
});

describe('안내 문구', () => {
  it('마른 개울용 안내 키가 한/영 모두 정의되어 있다', async () => {
    const { ko, en } = await import('../../js/data/locales.js');
    expect(ko['env.waterDry']).toBeTruthy();
    expect(en['env.waterDry']).toBeTruthy();
  });
});

describe('환경 카드 배지 렌더링', () => {
  // 실제 사용자가 보는 지점. 헬퍼가 옳아도 CardFactory가 옛 기준을 쓰면 배지는 그대로 뜬다.
  it('물이 있는 산개울에는 수집 가능 배지가 붙는다', async () => {
    const CardFactory = (await import('../../js/ui/CardFactory.js')).default;
    const html = CardFactory._buildEnvironmentInner(
      { definitionId: 'stream_spring', quantity: 10 }, ITEMS.stream_spring);
    expect(html).toContain('수집 가능');
  });

  it('마른 개울에는 수집 가능 배지가 붙지 않는다', async () => {
    const CardFactory = (await import('../../js/ui/CardFactory.js')).default;
    const html = CardFactory._buildEnvironmentInner(
      { definitionId: 'dry_stream', quantity: 10 }, ITEMS.dry_stream);
    expect(html).not.toContain('수집 가능');
  });

  it('마른 개울에는 비가 오면 회복된다는 안내가 붙는다', async () => {
    const CardFactory = (await import('../../js/ui/CardFactory.js')).default;
    const { ko } = await import('../../js/data/locales.js');
    const html = CardFactory._buildEnvironmentInner(
      { definitionId: 'dry_stream', quantity: 10 }, ITEMS.dry_stream);
    expect(html).toContain(ko['env.waterDry']);
  });
});
