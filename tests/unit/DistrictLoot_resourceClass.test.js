// === 드랍 개편 — 자원 클래스(cls) 분리 (surface/expedition) ===
// (광물은 Phase 3에서 탐사도 임계값 explorationYields로 이관 — DropPhase3.test.js 참조)
// 검증:
//  1) cls 미지정 → surface 기본, surfaceMult=1이면 전량 산출(하위호환)
//  2) surfaceMult=0 → 표면 자원은 안 나오고 expedition은 그대로 나옴
//  3) 반환 항목에 cls 태그가 붙는다
import { describe, it, expect, afterEach } from 'vitest';
import { DISTRICTS, generateDistrictLoot } from '../../js/data/districts.js';
import GameState from '../../js/core/GameState.js';

const TID = '__test_dist__';
function installTestDistrict(lootTable) {
  DISTRICTS[TID] = {
    id: TID, name: 'TEST', icon: '🧪', dangerLevel: 1, radiation: 0,
    adjacentDistricts: [], lootTable,
  };
}
function removeTestDistrict() { delete DISTRICTS[TID]; if (GameState.ecology?.districts) delete GameState.ecology.districts[TID]; }

describe('generateDistrictLoot — 자원 클래스 분리', () => {
  afterEach(removeTestDistrict);

  it('cls 미지정은 surface 기본 + surfaceMult=1이면 전량 산출', () => {
    installTestDistrict([{ definitionId: 'cloth', weight: 100, minQty: 1, maxQty: 1 }]);
    const loot = generateDistrictLoot(TID, { surfaceMult: 1 });
    expect(loot.length).toBeGreaterThan(0);
    expect(loot.every((l) => l.cls === 'surface')).toBe(true);
  });

  it('surfaceMult=0이면 표면 자원은 안 나오고 expedition은 나온다', () => {
    installTestDistrict([{ definitionId: 'wire', weight: 100, minQty: 1, maxQty: 1, cls: 'expedition' }]);
    const loot = generateDistrictLoot(TID, { surfaceMult: 0 });
    expect(loot.length).toBeGreaterThan(0);             // expedition은 surfaceMult 무관
    expect(loot.every((l) => l.cls === 'expedition')).toBe(true);

    installTestDistrict([{ definitionId: 'cloth', weight: 100, minQty: 1, maxQty: 1 }]); // surface
    const surf = generateDistrictLoot(TID, { surfaceMult: 0 });
    expect(surf.length).toBe(0);                         // 표면은 고갈 → 0
  });
});
