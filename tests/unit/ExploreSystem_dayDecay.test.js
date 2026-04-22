// === ExploreSystem._checkDayDecay — W3-2 Phase C ===
// 검증:
//  1) 같은 day 재호출 → no-op (중복 차감 방지)
//  2) day 변경 시 초기화된 모든 sub-loc이 stockDecayPerDay만큼 감소
//  3) 미초기화 sub-loc은 영향 없음
//  4) 여러 day 연속 호출 → 매 호출마다 1회씩 누적 감소
//  5) 건너뛴 day (3 → 10)도 1회당 1만 감소 (Phase A 정책)
//  6) 고갈된 sub-loc은 0에서 clamp
import { describe, it, expect, beforeEach } from 'vitest';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import GameState     from '../../js/core/GameState.js';
import BALANCE       from '../../js/data/gameBalance.js';

function reset() {
  GameState.subLocationStock = {};
  GameState.time.day = 1;
  ExploreSystem._currentDayForDecay = 1;
}

describe('ExploreSystem._checkDayDecay — day 변경 감지', () => {
  beforeEach(reset);

  it('같은 day 재호출은 no-op이다', () => {
    GameState.initSubLocationStock('a', 10);
    GameState.time.day = 5;
    ExploreSystem._currentDayForDecay = 5;
    ExploreSystem._checkDayDecay();
    ExploreSystem._checkDayDecay();
    ExploreSystem._checkDayDecay();
    expect(GameState.subLocationStock['a'].stock).toBe(10);  // 변화 없음
  });

  it('day 증가 시 초기화된 sub-loc이 stockDecayPerDay만큼 감소한다', () => {
    GameState.initSubLocationStock('a', 10);
    GameState.initSubLocationStock('b', 5);

    GameState.time.day = 2;
    ExploreSystem._checkDayDecay();

    expect(GameState.subLocationStock['a'].stock).toBe(10 - BALANCE.explore.stockDecayPerDay);
    expect(GameState.subLocationStock['b'].stock).toBe(5  - BALANCE.explore.stockDecayPerDay);
  });

  it('미초기화 sub-loc은 영향받지 않는다', () => {
    GameState.time.day = 2;
    ExploreSystem._checkDayDecay();
    expect(GameState.subLocationStock['never_init']).toBeUndefined();
  });

  it('연속 day 증가 시 매번 1회씩 누적 감소한다', () => {
    GameState.initSubLocationStock('a', 10);
    for (let d = 2; d <= 5; d++) {
      GameState.time.day = d;
      ExploreSystem._checkDayDecay();
    }
    // 4번 감소 (day 1→2, 2→3, 3→4, 4→5)
    expect(GameState.subLocationStock['a'].stock).toBe(10 - 4);
  });

  it('건너뛴 day 점프(1 → 10)에서도 1만 감소한다 (Phase A 정책)', () => {
    GameState.initSubLocationStock('a', 10);
    GameState.time.day = 10;
    ExploreSystem._checkDayDecay();
    expect(GameState.subLocationStock['a'].stock).toBe(9);
    expect(GameState.subLocationStock['a'].lastDecayDay).toBe(10);
  });

  it('고갈된 sub-loc(stock=0)은 더 이상 감소하지 않는다', () => {
    GameState.initSubLocationStock('a', 1);
    GameState.consumeSubLocationStock('a', 1);  // stock = 0
    GameState.time.day = 5;
    ExploreSystem._checkDayDecay();
    expect(GameState.subLocationStock['a'].stock).toBe(0);
  });

  it('BALANCE.explore.stockDecayPerDay 상수를 사용한다', () => {
    expect(BALANCE.explore.stockDecayPerDay).toBeDefined();
    expect(BALANCE.explore.stockDecayPerDay).toBeGreaterThanOrEqual(0);
  });
});
