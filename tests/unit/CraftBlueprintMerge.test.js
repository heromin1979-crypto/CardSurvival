// P0-2 회귀 — CraftUI/CraftDiscovery가 blueprints_advanced를 병합에서 빠뜨려
// advanced 레시피 62종이 목록·드래그 힌트에서 사라지던 버그 방지.
import { describe, it, expect } from 'vitest';
import BLUEPRINTS_BASE from '../../js/data/blueprints.js';
import BLUEPRINTS_ADV from '../../js/data/blueprints_advanced.js';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';
import GameState from '../../js/core/GameState.js';
import CraftDiscovery from '../../js/systems/CraftDiscovery.js';

describe('블루프린트 3중 병합 일관성', () => {
  it('advanced 레시피가 base/hidden과 ID 충돌 없이 존재한다', () => {
    const advIds = Object.keys(BLUEPRINTS_ADV);
    expect(advIds.length).toBeGreaterThan(0);
    for (const id of advIds) {
      expect(BLUEPRINTS_BASE[id]).toBeUndefined();
      expect(HIDDEN_RECIPES[id]).toBeUndefined();
    }
  });

  it('CraftDiscovery가 advanced 레시피를 탐색할 수 있다', () => {
    GameState.flags = GameState.flags ?? {};
    // 두 재료를 요구하는 advanced 레시피를 찾아 그 재료 쌍으로 탐색
    const probe = Object.values(BLUEPRINTS_ADV).find(bp => {
      const reqs = bp.stages?.[0]?.requiredItems ?? [];
      return !bp.hidden && reqs.length >= 2
        && reqs[0].definitionId !== reqs[1].definitionId
        && Array.isArray(bp.output);
    });
    expect(probe).toBeDefined();
    const [a, b] = probe.stages[0].requiredItems;
    const found = CraftDiscovery.findRecipes(a.definitionId, b.definitionId);
    expect(found.some(r => r.blueprintId === probe.id)).toBe(true);
  });
});
