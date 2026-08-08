// === CraftDiscovery.findRecipes 재료×도구 매칭 테스트 ===
// regression: 재료를 requiredTools 구조물(건조대 등)에 드래그해도 매칭 0건이라
// 퀵 크래프트가 뜨지 않던 문제. 재료×도구는 매칭하되 도구×도구는 제외한다.
import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

vi.mock('../js/core/GameState.js', () => ({
  default: {
    flags: { hiddenRecipesUnlocked: [] },
    crafting: { activeQueue: [], maxQueueSize: 3 },
    player: { skills: {} },
    countOnBoard: () => 99,
    getBoardCards: () => [{ definitionId: 'drying_rack' }],
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
vi.mock('../js/data/hiddenRecipes.js', () => ({ default: {} }));
vi.mock('../js/data/blueprints_advanced.js', () => ({ default: {} }));

vi.mock('../js/data/blueprints.js', () => ({
  default: {
    dry_mushroom: {
      id: 'dry_mushroom',
      name: '버섯 말리기',
      category: 'food',
      output: [{ definitionId: 'dried_mushroom', qty: 1 }],
      requiredTools: ['drying_rack'],
      stages: [{
        stageIndex: 0,
        tpCost: 3,
        requiredItems: [{ definitionId: 'mushroom_edible', qty: 2 }],
      }],
    },
    make_stew: {
      id: 'make_stew',
      name: '스튜 끓이기',
      category: 'food',
      output: [{ definitionId: 'stew', qty: 1 }],
      requiredTools: ['cooking_pot_stand', 'campfire'],
      stages: [{
        stageIndex: 0,
        tpCost: 6,
        requiredItems: [{ definitionId: 'vegetable', qty: 3 }],
      }],
    },
    dry_meat: {
      id: 'dry_meat',
      name: '육포 만들기',
      category: 'food',
      output: [{ definitionId: 'dried_meat', qty: 1 }],
      requiredTools: ['drying_rack'],
      stages: [{
        stageIndex: 0,
        tpCost: 5,
        requiredItems: [
          { definitionId: 'meat_strip', qty: 2 },
          { definitionId: 'salt', qty: 1 },
        ],
      }],
    },
  },
}));

import CraftDiscovery from '../js/systems/CraftDiscovery.js';

describe('CraftDiscovery.findRecipes 재료×도구 매칭', () => {
  it('재료를 requiredTools 구조물에 드래그하면 레시피가 매칭된다', () => {
    const recipes = CraftDiscovery.findRecipes('mushroom_edible', 'drying_rack');
    expect(recipes.map(r => r.blueprintId)).toContain('dry_mushroom');
  });

  it('도구를 재료에 드래그해도 (역방향) 동일하게 매칭된다', () => {
    const recipes = CraftDiscovery.findRecipes('drying_rack', 'mushroom_edible');
    expect(recipes.map(r => r.blueprintId)).toContain('dry_mushroom');
  });

  it('도구가 보드에 있고 재료가 충분하면 canStartNow가 true다', () => {
    const recipes = CraftDiscovery.findRecipes('mushroom_edible', 'drying_rack');
    const hit = recipes.find(r => r.blueprintId === 'dry_mushroom');
    expect(hit.canStartNow).toBe(true);
  });

  it('도구×도구 조합은 매칭하지 않는다', () => {
    const recipes = CraftDiscovery.findRecipes('cooking_pot_stand', 'campfire');
    expect(recipes).toHaveLength(0);
  });

  it('기존 재료×재료 매칭은 그대로 유지된다', () => {
    const recipes = CraftDiscovery.findRecipes('meat_strip', 'salt');
    expect(recipes.map(r => r.blueprintId)).toContain('dry_meat');
  });

  it('레시피와 무관한 조합은 여전히 매칭하지 않는다', () => {
    const recipes = CraftDiscovery.findRecipes('mushroom_edible', 'campfire');
    expect(recipes).toHaveLength(0);
  });
});
