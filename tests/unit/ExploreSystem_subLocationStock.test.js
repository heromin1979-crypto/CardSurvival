// === ExploreSystem × subLocationStock — W3-2 Phase B ===
// 검증:
//  1) _generateSubLocationLoot: 재고 미초기화 시 정상 범위 루팅
//  2) _generateSubLocationLoot: 재고 비율 0.5 → 카운트 절반으로 반올림
//  3) _generateSubLocationLoot: 재고 0 (완전 고갈) → 빈 배열
//  4) 보라매 하드코드 제거 회귀 — flags.boramae_depleted만으로는 더 이상 카운트 감소 없음
//  5) QuestSystem._checkBoramaeDepletion: 보라매 6개 sub-loc 재고를 전부 lazy-init + -1 decay
import { describe, it, expect, beforeEach } from 'vitest';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import QuestSystem   from '../../js/systems/QuestSystem.js';
import GameState     from '../../js/core/GameState.js';
import { getLandmarkData } from '../../js/data/landmarks.js';

// 테스트용 sub 객체 — 실제 item id만 사용
const TEST_SUB = {
  id: 'test_subloc',
  name: '테스트 장소',
  lootCount: [4, 4],  // 고정 카운트 4 (난수 제거)
  lootTable: [
    { id: 'bandage', weight: 10 },
    { id: 'cloth',   weight: 10 },
  ],
};

function resetStock() {
  GameState.subLocationStock = {};
  GameState.flags.boramae_depleted = false;
}

describe('_generateSubLocationLoot — 재고 미초기화', () => {
  beforeEach(resetStock);

  it('재고 미초기화 sub-loc은 정상 카운트(=lootCount[1])를 반환한다', () => {
    const loot = ExploreSystem._generateSubLocationLoot(TEST_SUB);
    expect(loot.length).toBe(4);  // stockRatio 1.0 × count 4
  });
});

describe('_generateSubLocationLoot — 재고 비율 적용', () => {
  beforeEach(resetStock);

  it('재고 50% 상태에서 카운트가 반으로 감소한다 (4 → 2)', () => {
    GameState.initSubLocationStock(TEST_SUB.id, 10);
    GameState.consumeSubLocationStock(TEST_SUB.id, 5);  // stock=5, baseStock=10 → ratio 0.5
    const loot = ExploreSystem._generateSubLocationLoot(TEST_SUB);
    expect(loot.length).toBe(2);  // round(4 × 0.5) = 2
  });

  it('재고 0% (완전 고갈) → 빈 배열', () => {
    GameState.initSubLocationStock(TEST_SUB.id, 10);
    GameState.consumeSubLocationStock(TEST_SUB.id, 10);  // stock=0 → ratio 0
    const loot = ExploreSystem._generateSubLocationLoot(TEST_SUB);
    expect(loot).toEqual([]);
  });

  it('재고 100% (신규 초기화) → full 카운트', () => {
    GameState.initSubLocationStock(TEST_SUB.id, 10);
    const loot = ExploreSystem._generateSubLocationLoot(TEST_SUB);
    expect(loot.length).toBe(4);
  });
});

describe('_generateSubLocationLoot — 보라매 하드코드 제거 회귀', () => {
  beforeEach(resetStock);

  it('flags.boramae_depleted=true 단독으로는 더 이상 카운트 감소 없음', () => {
    const boramaeSub = { ...TEST_SUB, id: 'boramae_emergency' };
    GameState.flags.boramae_depleted = true;
    const loot = ExploreSystem._generateSubLocationLoot(boramaeSub);
    // 재고 미초기화 상태이므로 ratio=1.0 → full 카운트 4
    // (구 동작: boramae_ + flag → count-1 = 3, 새 동작: 스톡만 반영)
    expect(loot.length).toBe(4);
  });
});

describe('QuestSystem._checkBoramaeDepletion — 스톡 감소 적용', () => {
  beforeEach(() => {
    resetStock();
    GameState.player.characterId = 'doctor';
  });

  it('Day 10 미만에서는 아무 효과 없음', () => {
    QuestSystem._checkBoramaeDepletion(GameState, 5);
    expect(GameState.flags.boramae_depleted).toBe(false);
    const lmData = getLandmarkData('lm_boramae_hospital');
    for (const sub of lmData.subLocations) {
      expect(GameState.subLocationStock[sub.id]).toBeUndefined();
    }
  });

  it('의사 아님 → no-op', () => {
    GameState.player.characterId = 'farmer';
    QuestSystem._checkBoramaeDepletion(GameState, 15);
    expect(GameState.flags.boramae_depleted).toBe(false);
    const lmData = getLandmarkData('lm_boramae_hospital');
    for (const sub of lmData.subLocations) {
      expect(GameState.subLocationStock[sub.id]).toBeUndefined();
    }
  });

  it('의사 + Day 10+ → 보라매 전체 sub-loc 재고가 lazy-init + -1 감소한다', () => {
    QuestSystem._checkBoramaeDepletion(GameState, 10);
    expect(GameState.flags.boramae_depleted).toBe(true);
    const lmData = getLandmarkData('lm_boramae_hospital');
    for (const sub of lmData.subLocations) {
      const baseStock = sub.lootCount?.[1] ?? 0;
      if (baseStock === 0) continue;
      const entry = GameState.subLocationStock[sub.id];
      expect(entry).toBeDefined();
      expect(entry.baseStock).toBe(baseStock);
      expect(entry.stock).toBe(baseStock - 1);
      expect(entry.lastDecayDay).toBe(10);
    }
  });

  it('두 번 호출해도 재고는 한 번만 감소 (1회성 가드)', () => {
    QuestSystem._checkBoramaeDepletion(GameState, 10);
    QuestSystem._checkBoramaeDepletion(GameState, 11);  // 두 번째는 flag로 blocked
    const lmData = getLandmarkData('lm_boramae_hospital');
    const firstSub = lmData.subLocations.find(s => (s.lootCount?.[1] ?? 0) > 0);
    const baseStock = firstSub.lootCount[1];
    expect(GameState.subLocationStock[firstSub.id].stock).toBe(baseStock - 1);
  });
});
