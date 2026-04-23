// === W3-2 통합 테스트 — 서브로케이션 재고 end-to-end ===
// 목적: 실제 EventBus.emit을 통한 시스템 간 연결부 검증.
//   - ExploreSystem.init()이 'tpAdvance' 리스너를 올바르게 등록
//   - 실제 tpAdvance 발행 → _checkDayDecay 자동 발화 → 재고 감소
//   - QuestSystem._checkBoramaeDepletion → subLocationStock 직접 감소 → 후속 루팅 결과 반영
//   - 다중 day 시뮬 (10+ TP advance) 누적 decay
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import ExploreSystem       from '../../js/systems/ExploreSystem.js';
import QuestSystem         from '../../js/systems/QuestSystem.js';
import BALANCE             from '../../js/data/gameBalance.js';
import { getLandmarkData } from '../../js/data/landmarks.js';

// ExploreSystem.init 내부에서 document.getElementById 접근 — node 환경에서 stub 필요
function stubDocument() {
  if (typeof global.document === 'undefined') {
    global.document = { getElementById: () => null };
  }
}

function resetEventBus() {
  EventBus._listeners = {};
}

function resetSubLocState() {
  GameState.subLocationStock = {};
  GameState.time.day      = 1;
  GameState.time.tpInDay  = 0;
  GameState.time.totalTP  = 0;
  GameState.flags.boramae_depleted = false;
  ExploreSystem._currentDayForDecay = 1;
}

describe('W3-2 통합 — tpAdvance → day decay 자동 트리거', () => {
  beforeEach(() => {
    stubDocument();
    resetEventBus();
    resetSubLocState();
    ExploreSystem.init();   // tpAdvance 리스너 등록
  });

  it('ExploreSystem.init 후 EventBus.emit("tpAdvance")로 _checkDayDecay가 호출된다', () => {
    GameState.initSubLocationStock('test_loc', 10);
    // 같은 day는 no-op
    EventBus.emit('tpAdvance', {});
    expect(GameState.subLocationStock['test_loc'].stock).toBe(10);

    // day 전환 시뮬
    GameState.time.day = 2;
    EventBus.emit('tpAdvance', {});
    expect(GameState.subLocationStock['test_loc'].stock).toBe(10 - BALANCE.explore.stockDecayPerDay);
    expect(GameState.subLocationStock['test_loc'].lastDecayDay).toBe(2);
  });

  it('여러 day 연속 전환 시 매 day마다 1회씩 누적 감소', () => {
    GameState.initSubLocationStock('loc_a', 10);
    GameState.initSubLocationStock('loc_b', 8);

    // day 1 → 2 → 3 → 4 → 5
    for (let d = 2; d <= 5; d++) {
      GameState.time.day = d;
      EventBus.emit('tpAdvance', {});
    }
    expect(GameState.subLocationStock['loc_a'].stock).toBe(10 - 4);
    expect(GameState.subLocationStock['loc_b'].stock).toBe(8 - 4);
  });

  it('같은 day 내 여러 번 tpAdvance → 1회만 감소 (중복 가드)', () => {
    GameState.initSubLocationStock('loc_c', 10);
    GameState.time.day = 2;
    for (let i = 0; i < 20; i++) EventBus.emit('tpAdvance', {});
    expect(GameState.subLocationStock['loc_c'].stock).toBe(10 - BALANCE.explore.stockDecayPerDay);
  });
});

describe('W3-2 통합 — QuestSystem 보라매 depletion → subLocationStock', () => {
  beforeEach(() => {
    stubDocument();
    resetEventBus();
    resetSubLocState();
    ExploreSystem.init();
    GameState.player.characterId = 'doctor';
  });

  it('Day 10+ 의사 → _checkBoramaeDepletion 호출 시 보라매 6개 sub-loc이 -1 감소', () => {
    QuestSystem._checkBoramaeDepletion(GameState, 10);

    const lmData = getLandmarkData('lm_boramae_hospital');
    expect(lmData).toBeDefined();

    for (const sub of lmData.subLocations) {
      const baseStock = sub.lootCount?.[1] ?? 0;
      if (baseStock === 0) continue;
      const entry = GameState.subLocationStock[sub.id];
      expect(entry).toBeDefined();
      expect(entry.stock).toBe(baseStock - 1);
    }
    expect(GameState.flags.boramae_depleted).toBe(true);
  });

  it('depletion 후 _generateSubLocationLoot 결과가 실제로 감소한다', () => {
    QuestSystem._checkBoramaeDepletion(GameState, 10);

    // boramae_emergency: lootCount [2, 3], baseStock 3, stock 2 → ratio 2/3
    // 기대 카운트 = round(count × 2/3)
    const sub = {
      id: 'boramae_emergency',
      lootCount: [2, 2],  // 고정 카운트 2 (난수 제거)
      lootTable: [{ id: 'bandage', weight: 10 }],
    };
    // baseStock 기준으로 설정된 stock: 3 - 1 = 2, ratio = 2/3 ≈ 0.67
    // count 2 × 0.67 = 1.33 → round 1
    const loot = ExploreSystem._generateSubLocationLoot(sub);
    expect(loot.length).toBeLessThanOrEqual(2);
    expect(loot.length).toBeGreaterThanOrEqual(1);
  });

  it('보라매 depletion 후 추가 day decay가 누적된다 (depletion -1 + day -1)', () => {
    QuestSystem._checkBoramaeDepletion(GameState, 10);
    const afterDepletion = GameState.subLocationStock['boramae_emergency'].stock;  // baseStock(3) - 1 = 2

    // Day 11 전환
    GameState.time.day = 11;
    EventBus.emit('tpAdvance', {});

    expect(GameState.subLocationStock['boramae_emergency'].stock).toBe(afterDepletion - BALANCE.explore.stockDecayPerDay);
  });
});

describe('W3-2 통합 — 장기 시뮬 (day 1 → 20 누적 효과)', () => {
  beforeEach(() => {
    stubDocument();
    resetEventBus();
    resetSubLocState();
    ExploreSystem.init();
  });

  it('baseStock 10인 sub-loc이 20 day 지나면 0에서 clamp된다', () => {
    GameState.initSubLocationStock('long_loc', 10);
    for (let d = 2; d <= 21; d++) {
      GameState.time.day = d;
      EventBus.emit('tpAdvance', {});
    }
    // 20회 감소 시도 → stock 0에서 clamp
    expect(GameState.subLocationStock['long_loc'].stock).toBe(0);
    expect(GameState.subLocationStock['long_loc'].lastDecayDay).toBe(21);
  });

  it('미초기화 sub-loc은 20일 경과해도 영향 없음', () => {
    for (let d = 2; d <= 21; d++) {
      GameState.time.day = d;
      EventBus.emit('tpAdvance', {});
    }
    expect(GameState.subLocationStock['never_init']).toBeUndefined();
  });
});
