// === 드랍 개편 Phase 1 — 자원 클래스(cls) 분리 + 광물 영구 고갈 ===
// 검증:
//  1) cls 미지정 → surface 기본, surfaceMult=1이면 전량 산출(하위호환)
//  2) surfaceMult=0 → 표면 자원은 안 나오고 expedition은 그대로 나옴
//  3) mineral은 mineralRemaining 잔량 안에서만 산출 (영구 고갈)
//  4) EcologySystem.consumeMineral가 잔량을 영구 차감(재생 없음)
//  5) generateDistrictLoot 반환 항목에 cls 태그가 붙는다
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DISTRICTS, generateDistrictLoot } from '../../js/data/districts.js';
import EcologySystem from '../../js/systems/EcologySystem.js';
import GameState from '../../js/core/GameState.js';

// 결정적 추첨을 위해 테스트용 임시 구를 주입 (실데이터 비의존)
const TID = '__test_dist__';
function installTestDistrict(lootTable, mineralStock) {
  DISTRICTS[TID] = {
    id: TID, name: 'TEST', icon: '🧪', dangerLevel: 1, radiation: 0,
    adjacentDistricts: [], lootTable,
    ...(mineralStock != null ? { mineralStock } : {}),
  };
}
function removeTestDistrict() { delete DISTRICTS[TID]; if (GameState.ecology?.districts) delete GameState.ecology.districts[TID]; }

describe('generateDistrictLoot — 자원 클래스 분리', () => {
  afterEach(removeTestDistrict);

  it('cls 미지정은 surface 기본 + surfaceMult=1이면 전량 산출', () => {
    installTestDistrict([{ definitionId: 'cloth', weight: 100, minQty: 1, maxQty: 1 }]);
    const loot = generateDistrictLoot(TID, { surfaceMult: 1, mineralRemaining: Infinity });
    expect(loot.length).toBeGreaterThan(0);
    expect(loot.every((l) => l.cls === 'surface')).toBe(true);
  });

  it('surfaceMult=0이면 표면 자원은 안 나오고 expedition은 나온다', () => {
    installTestDistrict([{ definitionId: 'wire', weight: 100, minQty: 1, maxQty: 1, cls: 'expedition' }]);
    const loot = generateDistrictLoot(TID, { surfaceMult: 0, mineralRemaining: Infinity });
    expect(loot.length).toBeGreaterThan(0);             // expedition은 surfaceMult 무관
    expect(loot.every((l) => l.cls === 'expedition')).toBe(true);

    installTestDistrict([{ definitionId: 'cloth', weight: 100, minQty: 1, maxQty: 1 }]); // surface
    const surf = generateDistrictLoot(TID, { surfaceMult: 0, mineralRemaining: Infinity });
    expect(surf.length).toBe(0);                         // 표면은 고갈 → 0
  });

  it('mineral은 잔량(mineralRemaining) 안에서만 산출된다', () => {
    installTestDistrict([{ definitionId: 'sulfur', weight: 100, minQty: 1, maxQty: 1, cls: 'mineral' }]);
    const none = generateDistrictLoot(TID, { surfaceMult: 1, mineralRemaining: 0 });
    expect(none.length).toBe(0);                         // 잔량 0 → 광물 안 나옴
    const some = generateDistrictLoot(TID, { surfaceMult: 1, mineralRemaining: 99 });
    expect(some.every((l) => l.cls === 'mineral')).toBe(true);
  });
});

describe('EcologySystem — 광물 잔량 영구 고갈', () => {
  beforeEach(() => { GameState.ecology = null; });
  afterEach(removeTestDistrict);

  it('consumeMineral는 잔량을 차감하고 0 미만으로 안 내려간다', () => {
    installTestDistrict([{ definitionId: 'sulfur', weight: 1, minQty: 1, maxQty: 1, cls: 'mineral' }], 3);
    EcologySystem.ensureInitialized();
    expect(EcologySystem.getMineralStock(TID)).toBe(3);
    EcologySystem.consumeMineral(TID, 2);
    expect(EcologySystem.getMineralStock(TID)).toBe(1);
    EcologySystem.consumeMineral(TID, 5);
    expect(EcologySystem.getMineralStock(TID)).toBe(0);  // 0에서 clamp
  });

  it('_onTP 재생은 광물 잔량을 회복시키지 않는다 (영구 고갈)', () => {
    installTestDistrict([{ definitionId: 'sulfur', weight: 1, minQty: 1, maxQty: 1, cls: 'mineral' }], 5);
    EcologySystem.ensureInitialized();
    EcologySystem.consumeMineral(TID, 5);
    EcologySystem._onTP();  // resourceLevel은 재생되지만 mineralStock은 그대로
    expect(EcologySystem.getMineralStock(TID)).toBe(0);
  });

  it('구버전 세이브(ecology에 mineralStock 누락)는 ensureInitialized가 백필한다', () => {
    installTestDistrict([{ definitionId: 'cloth', weight: 1, minQty: 1, maxQty: 1 }], 7);
    // 이미 ecology가 있으나 해당 구에 mineralStock 없는 상태를 모사
    GameState.ecology = { districts: { [TID]: { zombiePopulation: 10, resourceLevel: 100, contamination: 0, noiseAttraction: 0, lastVisitDay: 0 } }, global: {} };
    EcologySystem.ensureInitialized();
    expect(GameState.ecology.districts[TID].mineralStock).toBe(7);  // 구 데이터 기본값으로 백필
  });
});
