// === GameState.subLocationStock — W3-2 Phase A ===
// 검증:
//  1) 신규 필드 존재 및 초기값은 빈 객체
//  2) initSubLocationStock: 최초 1회만 세팅, 재호출 no-op
//  3) consumeSubLocationStock: min 0 clamp, 미초기화 no-op
//  4) getSubLocationStockRatio: 미초기화 → 1.0, 정상/depleted/baseStock 0 처리
//  5) decaySubLocationStock: 같은 day 중복 차감 방지, 건너뛴 day 수와 무관하게 1회당 1만 감소
//  6) decayAllSubLocationStocks: 모든 초기화된 항목 일괄 처리
//  7) serialize/deserialize round-trip + 구버전 세이브 호환
import { describe, it, expect, beforeEach } from 'vitest';
import GameState from '../../js/core/GameState.js';

// 각 테스트 전에 subLocationStock을 비워 격리
function resetStock() {
  GameState.subLocationStock = {};
}

describe('GameState.subLocationStock — 초기 구조', () => {
  it('subLocationStock 필드가 존재하고 객체 타입이다', () => {
    expect(GameState).toHaveProperty('subLocationStock');
    expect(typeof GameState.subLocationStock).toBe('object');
  });
});

describe('initSubLocationStock', () => {
  beforeEach(resetStock);

  it('최초 호출 시 stock/baseStock/lastDecayDay를 설정한다', () => {
    GameState.initSubLocationStock('boramae_emergency', 10);
    const entry = GameState.subLocationStock['boramae_emergency'];
    expect(entry.stock).toBe(10);
    expect(entry.baseStock).toBe(10);
    expect(entry.lastDecayDay).toBeNull();
  });

  it('이미 초기화된 sub-loc에 대한 재호출은 no-op이다', () => {
    GameState.initSubLocationStock('boramae_surgery', 8);
    GameState.consumeSubLocationStock('boramae_surgery', 3);   // stock = 5
    GameState.initSubLocationStock('boramae_surgery', 20);     // should be no-op
    expect(GameState.subLocationStock['boramae_surgery'].stock).toBe(5);
    expect(GameState.subLocationStock['boramae_surgery'].baseStock).toBe(8);
  });

  it('baseStock 0 또는 음수는 무시한다 (안전가드)', () => {
    GameState.initSubLocationStock('invalid_zero', 0);
    GameState.initSubLocationStock('invalid_neg', -1);
    // baseStock 0 허용 여부 — 현재 구현은 0 허용, 음수만 거부
    // baseStock이 0이면 getSubLocationStockRatio가 1.0 반환해야 안전
    expect(GameState.subLocationStock['invalid_neg']).toBeUndefined();
  });

  it('null/undefined subLocId는 무시한다', () => {
    GameState.initSubLocationStock(null, 10);
    GameState.initSubLocationStock(undefined, 10);
    expect(Object.keys(GameState.subLocationStock).length).toBe(0);
  });
});

describe('consumeSubLocationStock', () => {
  beforeEach(resetStock);

  it('stock을 amount만큼 차감한다', () => {
    GameState.initSubLocationStock('test_loc', 10);
    GameState.consumeSubLocationStock('test_loc', 3);
    expect(GameState.subLocationStock['test_loc'].stock).toBe(7);
  });

  it('기본 amount는 1이다', () => {
    GameState.initSubLocationStock('test_loc', 5);
    GameState.consumeSubLocationStock('test_loc');
    expect(GameState.subLocationStock['test_loc'].stock).toBe(4);
  });

  it('stock은 0 미만으로 떨어지지 않는다 (min 0 clamp)', () => {
    GameState.initSubLocationStock('test_loc', 2);
    GameState.consumeSubLocationStock('test_loc', 999);
    expect(GameState.subLocationStock['test_loc'].stock).toBe(0);
  });

  it('미초기화 sub-loc은 no-op이다', () => {
    GameState.consumeSubLocationStock('never_init', 5);
    expect(GameState.subLocationStock['never_init']).toBeUndefined();
  });

  it('baseStock은 consume 후에도 보존된다', () => {
    GameState.initSubLocationStock('test_loc', 10);
    GameState.consumeSubLocationStock('test_loc', 3);
    expect(GameState.subLocationStock['test_loc'].baseStock).toBe(10);
  });
});

describe('getSubLocationStockRatio', () => {
  beforeEach(resetStock);

  it('미초기화 sub-loc은 1.0을 반환한다 (기본 풀스톡 가정)', () => {
    expect(GameState.getSubLocationStockRatio('never_init')).toBe(1.0);
  });

  it('정상 상태에서 stock/baseStock 비율을 반환한다', () => {
    GameState.initSubLocationStock('test_loc', 10);
    GameState.consumeSubLocationStock('test_loc', 3);
    expect(GameState.getSubLocationStockRatio('test_loc')).toBeCloseTo(0.7, 5);
  });

  it('depleted 상태는 0을 반환한다', () => {
    GameState.initSubLocationStock('test_loc', 5);
    GameState.consumeSubLocationStock('test_loc', 5);
    expect(GameState.getSubLocationStockRatio('test_loc')).toBe(0);
  });

  it('baseStock이 0이면 1.0을 반환한다 (0 나눗셈 방지)', () => {
    GameState.subLocationStock = {
      edge_case: { stock: 0, baseStock: 0, lastDecayDay: null },
    };
    expect(GameState.getSubLocationStockRatio('edge_case')).toBe(1.0);
  });

  it('반환값은 [0, 1] 범위로 클램프된다', () => {
    GameState.subLocationStock = {
      weird: { stock: 15, baseStock: 10, lastDecayDay: null },
    };
    expect(GameState.getSubLocationStockRatio('weird')).toBe(1);
  });
});

describe('decaySubLocationStock', () => {
  beforeEach(resetStock);

  it('기본 감소량 1만큼 차감하고 lastDecayDay를 기록한다', () => {
    GameState.initSubLocationStock('test_loc', 10);
    GameState.decaySubLocationStock('test_loc', 5);
    const e = GameState.subLocationStock['test_loc'];
    expect(e.stock).toBe(9);
    expect(e.lastDecayDay).toBe(5);
  });

  it('같은 day에 재호출되면 차감하지 않는다 (중복 방지)', () => {
    GameState.initSubLocationStock('test_loc', 10);
    GameState.decaySubLocationStock('test_loc', 5);
    GameState.decaySubLocationStock('test_loc', 5);
    GameState.decaySubLocationStock('test_loc', 5);
    expect(GameState.subLocationStock['test_loc'].stock).toBe(9);
  });

  it('건너뛴 day 수와 무관하게 1회당 1만 감소한다 (정책)', () => {
    GameState.initSubLocationStock('test_loc', 10);
    GameState.decaySubLocationStock('test_loc', 3);   // day 3 → 9
    GameState.decaySubLocationStock('test_loc', 10);  // day 10 (7일 건너뜀) → 8
    expect(GameState.subLocationStock['test_loc'].stock).toBe(8);
  });

  it('stock은 0 미만으로 떨어지지 않는다', () => {
    GameState.initSubLocationStock('test_loc', 1);
    GameState.decaySubLocationStock('test_loc', 1, 10);  // huge amount
    expect(GameState.subLocationStock['test_loc'].stock).toBe(0);
  });

  it('미초기화 sub-loc은 no-op이다', () => {
    GameState.decaySubLocationStock('never_init', 5);
    expect(GameState.subLocationStock['never_init']).toBeUndefined();
  });
});

describe('decayAllSubLocationStocks', () => {
  beforeEach(resetStock);

  it('초기화된 모든 sub-loc을 일괄 감소시킨다', () => {
    GameState.initSubLocationStock('a', 10);
    GameState.initSubLocationStock('b', 5);
    GameState.initSubLocationStock('c', 3);
    GameState.decayAllSubLocationStocks(7);
    expect(GameState.subLocationStock['a'].stock).toBe(9);
    expect(GameState.subLocationStock['b'].stock).toBe(4);
    expect(GameState.subLocationStock['c'].stock).toBe(2);
  });

  it('같은 day 중복 호출 시 한 번만 감소한다', () => {
    GameState.initSubLocationStock('a', 10);
    GameState.initSubLocationStock('b', 5);
    GameState.decayAllSubLocationStocks(7);
    GameState.decayAllSubLocationStocks(7);
    expect(GameState.subLocationStock['a'].stock).toBe(9);
    expect(GameState.subLocationStock['b'].stock).toBe(4);
  });

  it('개별 sub-loc의 lastDecayDay가 섞여있어도 올바르게 동작한다', () => {
    GameState.initSubLocationStock('a', 10);
    GameState.initSubLocationStock('b', 10);
    GameState.decaySubLocationStock('a', 5);  // a는 day 5 처리 완료
    GameState.decayAllSubLocationStocks(5);   // a는 skip, b만 감소
    expect(GameState.subLocationStock['a'].stock).toBe(9);
    expect(GameState.subLocationStock['b'].stock).toBe(9);
  });
});

describe('serialize/deserialize — subLocationStock', () => {
  beforeEach(resetStock);

  it('subLocationStock이 직렬화/역직렬화를 통해 보존된다', () => {
    GameState.initSubLocationStock('boramae_emergency', 10);
    GameState.consumeSubLocationStock('boramae_emergency', 3);
    GameState.decaySubLocationStock('boramae_emergency', 5);
    const json = GameState.serialize();

    // 재시작 시뮬레이션
    resetStock();
    GameState.deserialize(json);

    const e = GameState.subLocationStock['boramae_emergency'];
    expect(e.stock).toBe(6);
    expect(e.baseStock).toBe(10);
    expect(e.lastDecayDay).toBe(5);
  });

  it('구버전 세이브(subLocationStock 필드 없음) 로드 시 빈 객체로 복원된다', () => {
    // 구버전 세이브 시뮬레이션: subLocationStock 키 자체가 없는 JSON
    const json = GameState.serialize();
    const parsed = JSON.parse(json);
    delete parsed.subLocationStock;
    const legacyJson = JSON.stringify(parsed);

    resetStock();
    GameState.deserialize(legacyJson);

    expect(GameState.subLocationStock).toEqual({});
  });
});
