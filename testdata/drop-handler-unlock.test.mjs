// === Drop 핸들러 unlock 계약 테스트 ===
// DragDrop._onDrop / TouchDrag._onPointerUp가 호출하는
// HiddenElementSystem.unlockByAttempt의 계약을 검증.
//
// DragDrop/TouchDrag는 DOM 이벤트 기반이라 unit test 불가 — 핸들러가
// 의존하는 unlock API의 동작 (positive / idempotent / undefined-args)을 검증.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../js/core/EventBus.js', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), once: vi.fn() },
}));

vi.mock('../js/core/GameState.js', () => ({
  default: {
    flags: { hiddenRecipesUnlocked: [] },
  },
}));

vi.mock('../js/core/I18n.js', () => ({
  default: {
    t: (k) => k,
    blueprintName: (_id, name) => name,
    itemName: (_id, name) => name,
  },
}));

vi.mock('../js/core/SystemRegistry.js', () => ({ default: { register: vi.fn() } }));
vi.mock('../js/data/GameData.js', () => ({ default: { items: {} } }));
vi.mock('../js/data/blueprints.js', () => ({ default: {} }));
vi.mock('../js/data/hiddenLocations.js', () => ({ HIDDEN_LOCATIONS: {} }));
vi.mock('../js/data/secretEnemies.js', () => ({ SECRET_ENEMIES: {} }));
vi.mock('../js/data/secretEvents.js', () => ({ default: {} }));

vi.mock('../js/data/hiddenRecipes.js', () => ({
  default: {
    target_recipe: {
      id: 'target_recipe',
      name: '타깃 hidden 레시피',
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

import HiddenElementSystem from '../js/systems/HiddenElementSystem.js';
import GameState from '../js/core/GameState.js';

describe('Drop 핸들러가 호출하는 unlockByAttempt 계약', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
  });

  it('drop 시 매칭되는 hidden 레시피 unlock 발생', () => {
    // 사전 조건: 빈 unlock 목록
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);

    HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    expect(GameState.flags.hiddenRecipesUnlocked).toContain('target_recipe');
  });

  it('같은 drop 두 번 시 idempotent (중복 push 없음)', () => {
    HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');
    HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    expect(GameState.flags.hiddenRecipesUnlocked.length).toBe(1);
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual(['target_recipe']);
  });

  it('undefined/null src 또는 tgt args 시 throw 없이 무시', () => {
    expect(() => HiddenElementSystem.unlockByAttempt(null, null)).not.toThrow();
    expect(() => HiddenElementSystem.unlockByAttempt(undefined, undefined)).not.toThrow();
    expect(() => HiddenElementSystem.unlockByAttempt('wood', null)).not.toThrow();
    expect(() => HiddenElementSystem.unlockByAttempt(null, 'scrap_metal')).not.toThrow();

    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);
  });
});
