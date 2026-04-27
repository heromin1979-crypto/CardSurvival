// === CraftDiscovery.findRecipes pure query 보장 테스트 ===
// regression: hover(getQuickHint)에서도 호출되므로 부수효과 발생하면 안 됨.
// hidden 레시피 unlock은 실제 drop 핸들러에서만 발생.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../js/core/GameState.js', () => ({
  default: {
    flags: { hiddenRecipesUnlocked: [] },
    crafting: { activeQueue: [], maxQueueSize: 3 },
    player: { skills: {} },
    countOnBoard: () => 99,
    getBoardCards: () => [],
  },
}));

vi.mock('../js/core/I18n.js', () => ({
  default: {
    t: (k) => k,
    blueprintName: (_id, name) => name,
    itemName: (_id, name) => name,
  },
}));

vi.mock('../js/data/GameData.js', () => ({ default: { items: {} } }));
vi.mock('../js/data/blueprints.js', () => ({ default: {} }));

vi.mock('../js/data/hiddenRecipes.js', () => ({
  default: {
    target_recipe: {
      id: 'target_recipe',
      name: '타깃 hidden 레시피',
      category: 'tool',
      hidden: true,
      output: [{ definitionId: 'target_output', qty: 1 }],
      stages: [{
        stageIndex: 0,
        tpCost: 2,
        requiredItems: [
          { definitionId: 'wood', qty: 1 },
          { definitionId: 'scrap_metal', qty: 1 },
        ],
      }],
    },
  },
}));

import CraftDiscovery from '../js/systems/CraftDiscovery.js';
import GameState from '../js/core/GameState.js';

describe('CraftDiscovery.findRecipes pure query 보장', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
  });

  it('hidden 레시피 매칭하는 카드 조합 조회해도 unlock 부수효과 없음', () => {
    // 사전 조건: unlock 목록 비어있음
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);

    // findRecipes는 hover에서도 호출됨 — 절대 GameState 변경 금지
    CraftDiscovery.findRecipes('wood', 'scrap_metal');

    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);
  });
});
