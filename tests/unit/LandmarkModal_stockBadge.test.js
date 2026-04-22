// === LandmarkModal._getStockBadgeInfo — W3-2 Phase D ===
// 검증:
//  1) 미초기화 → shown=false (배지 숨김)
//  2) 풀스톡 → cls='full', depleted=false
//  3) 70% 경계 → cls 전환 (full ↔ mid)
//  4) 30% 경계 → cls 전환 (mid ↔ low)
//  5) stock=0 → cls='depleted', depleted=true
//  6) baseStock=0 안전가드 → shown=false
//  7) ratio 반환값 [0, 1] 범위
import { describe, it, expect, beforeEach } from 'vitest';
import LandmarkModal from '../../js/ui/LandmarkModal.js';
import GameState     from '../../js/core/GameState.js';

function reset() {
  GameState.subLocationStock = {};
}

describe('LandmarkModal._getStockBadgeInfo', () => {
  beforeEach(reset);

  it('재고 미초기화 sub-loc → shown=false (배지 숨김)', () => {
    const info = LandmarkModal._getStockBadgeInfo('never_init');
    expect(info.shown).toBe(false);
    expect(info.depleted).toBe(false);
  });

  it('풀스톡 → shown=true, cls=full, depleted=false', () => {
    GameState.initSubLocationStock('test', 10);
    const info = LandmarkModal._getStockBadgeInfo('test');
    expect(info.shown).toBe(true);
    expect(info.stock).toBe(10);
    expect(info.baseStock).toBe(10);
    expect(info.ratio).toBe(1);
    expect(info.cls).toBe('full');
    expect(info.depleted).toBe(false);
  });

  it('ratio 70% 이상 → cls=full', () => {
    GameState.initSubLocationStock('test', 10);
    GameState.consumeSubLocationStock('test', 3);  // stock=7, ratio=0.7
    const info = LandmarkModal._getStockBadgeInfo('test');
    expect(info.cls).toBe('full');
  });

  it('ratio 30~70% → cls=mid', () => {
    GameState.initSubLocationStock('test', 10);
    GameState.consumeSubLocationStock('test', 5);  // stock=5, ratio=0.5
    const info = LandmarkModal._getStockBadgeInfo('test');
    expect(info.cls).toBe('mid');
  });

  it('ratio 0 초과 ~ 30% 미만 → cls=low', () => {
    GameState.initSubLocationStock('test', 10);
    GameState.consumeSubLocationStock('test', 8);  // stock=2, ratio=0.2
    const info = LandmarkModal._getStockBadgeInfo('test');
    expect(info.cls).toBe('low');
    expect(info.depleted).toBe(false);
  });

  it('stock=0 → cls=depleted, depleted=true', () => {
    GameState.initSubLocationStock('test', 10);
    GameState.consumeSubLocationStock('test', 10);  // stock=0
    const info = LandmarkModal._getStockBadgeInfo('test');
    expect(info.cls).toBe('depleted');
    expect(info.depleted).toBe(true);
    expect(info.ratio).toBe(0);
  });

  it('baseStock=0 안전가드 → shown=false (0 나눗셈 방지)', () => {
    GameState.subLocationStock = {
      edge: { stock: 0, baseStock: 0, lastDecayDay: null },
    };
    const info = LandmarkModal._getStockBadgeInfo('edge');
    expect(info.shown).toBe(false);
  });

  it('ratio는 [0, 1] 범위로 클램프된다', () => {
    GameState.subLocationStock = {
      weird: { stock: 15, baseStock: 10, lastDecayDay: null },  // stock > base
    };
    const info = LandmarkModal._getStockBadgeInfo('weird');
    expect(info.ratio).toBe(1);
  });
});

describe('LandmarkModal._renderSubLoc — 고갈 상태 마크업', () => {
  beforeEach(reset);

  it('depleted sub-loc은 data-depleted="1" 속성과 depleted 클래스를 갖는다', () => {
    GameState.initSubLocationStock('boramae_emergency', 3);
    GameState.consumeSubLocationStock('boramae_emergency', 3);
    const loc = {
      id: 'boramae_emergency', name: '응급실', icon: '🚑', desc: '...',
      dangerMod: 0.05, lootTable: [], lootCount: [2, 3],
    };
    const html = LandmarkModal._renderSubLoc(loc);
    expect(html).toContain('data-depleted="1"');
    expect(html).toContain('lm-subloc-card');
    expect(html).toMatch(/class=".*\bdepleted\b.*"/);
    expect(html).toContain('고갈');
  });

  it('풀스톡 sub-loc은 depleted 속성/클래스가 없다', () => {
    GameState.initSubLocationStock('boramae_emergency', 3);
    const loc = {
      id: 'boramae_emergency', name: '응급실', icon: '🚑', desc: '...',
      dangerMod: 0.05, lootTable: [], lootCount: [2, 3],
    };
    const html = LandmarkModal._renderSubLoc(loc);
    expect(html).not.toContain('data-depleted="1"');
    expect(html).toContain('lm-stock-badge full');
    expect(html).toContain('🪙 3/3');
  });
});
