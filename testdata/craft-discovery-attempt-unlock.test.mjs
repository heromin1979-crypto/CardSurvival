// === CraftDiscovery × HiddenElementSystem.unlockByAttempt 통합 테스트 ===
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../js/core/GameState.js', () => ({
  default: {
    flags: { hiddenRecipesUnlocked: [] },
    crafting: { activeQueue: [], maxQueueSize: 3 },
    player: { skills: {} },
    countOnBoard: () => 99, // 모든 재료 충분하다고 가정
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

// HiddenElementSystem 의존성 모킹 (Task 1과 동일 패턴)
vi.mock('../js/core/EventBus.js', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), once: vi.fn() },
}));
vi.mock('../js/data/hiddenLocations.js', () => ({ HIDDEN_LOCATIONS: {} }));
vi.mock('../js/data/secretEnemies.js', () => ({ SECRET_ENEMIES: {} }));
vi.mock('../js/data/secretEvents.js', () => ({ default: {} }));
vi.mock('../js/core/SystemRegistry.js', () => ({ default: { register: vi.fn() } }));

import CraftDiscovery from '../js/systems/CraftDiscovery.js';
import GameState from '../js/core/GameState.js';

describe('CraftDiscovery.findRecipes × unlockByAttempt 통합', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
  });

  it('hidden 레시피 매칭 시 즉시 unlock + 결과 목록에 포함', () => {
    const recipes = CraftDiscovery.findRecipes('wood', 'scrap_metal');

    expect(GameState.flags.hiddenRecipesUnlocked).toContain('target_recipe');
    expect(recipes.length).toBe(1);
    expect(recipes[0].blueprintId).toBe('target_recipe');
  });

  it('이미 unlock된 hidden 레시피도 동일하게 결과에 포함 (regression)', () => {
    GameState.flags.hiddenRecipesUnlocked = ['target_recipe'];

    const recipes = CraftDiscovery.findRecipes('wood', 'scrap_metal');

    expect(recipes.length).toBe(1);
    expect(recipes[0].blueprintId).toBe('target_recipe');
  });

  it('매칭 안 되는 카드 조합은 unlock 발생 안 함', () => {
    const recipes = CraftDiscovery.findRecipes('wood', 'unknown_id');

    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);
    expect(recipes.length).toBe(0);
  });
});
