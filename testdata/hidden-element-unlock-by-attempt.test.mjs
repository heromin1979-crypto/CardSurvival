// === HiddenElementSystem.unlockByAttempt 단위 테스트 ===
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../js/core/EventBus.js', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    once: vi.fn(),
  },
}));

vi.mock('../js/core/GameState.js', () => ({
  default: {
    flags: { hiddenRecipesUnlocked: [] },
    time: { day: 1, totalTP: 0 },
    location: { currentDistrict: 'test_district' },
    player: { skills: {} },
  },
}));

vi.mock('../js/data/hiddenRecipes.js', () => ({
  default: {
    test_recipe_a: {
      id: 'test_recipe_a',
      hidden: true,
      stages: [{
        stageIndex: 0,
        requiredItems: [
          { definitionId: 'wood', qty: 1 },
          { definitionId: 'scrap_metal', qty: 1 },
        ],
      }],
      output: [{ definitionId: 'test_output_a', qty: 1 }],
    },
    test_recipe_b: {
      id: 'test_recipe_b',
      hidden: true,
      stages: [{
        stageIndex: 0,
        requiredItems: [
          { definitionId: 'herb', qty: 1 },
        ],
      }],
      output: [{ definitionId: 'test_output_b', qty: 1 }],
    },
  },
}));

vi.mock('../js/data/blueprints.js', () => ({ default: {} }));
vi.mock('../js/data/hiddenLocations.js', () => ({ HIDDEN_LOCATIONS: {} }));
vi.mock('../js/data/secretEnemies.js', () => ({ SECRET_ENEMIES: {} }));
vi.mock('../js/data/secretEvents.js', () => ({ default: {} }));
vi.mock('../js/data/GameData.js', () => ({ default: { items: {} } }));
vi.mock('../js/core/SystemRegistry.js', () => ({ default: { register: vi.fn() } }));
vi.mock('../js/core/I18n.js', () => ({ default: { t: (k) => k } }));

import HiddenElementSystem from '../js/systems/HiddenElementSystem.js';
import GameState from '../js/core/GameState.js';
import EventBus from '../js/core/EventBus.js';

describe('HiddenElementSystem.unlockByAttempt', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
    vi.clearAllMocks();
  });

  it('두 카드가 모두 hidden 레시피의 첫 stage 재료에 포함되면 unlock 한다', () => {
    const result = HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    expect(result.unlocked).toEqual(['test_recipe_a']);
    expect(result.skipped).toEqual([]);
    expect(GameState.flags.hiddenRecipesUnlocked).toContain('test_recipe_a');
    expect(EventBus.emit).toHaveBeenCalledWith('recipeUnlocked', {
      blueprintId: 'test_recipe_a',
      source: 'attempt',
    });
  });

  it('이미 unlock된 레시피는 skipped로 분류, emit 안 함', () => {
    GameState.flags.hiddenRecipesUnlocked = ['test_recipe_a'];

    const result = HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    expect(result.unlocked).toEqual([]);
    expect(result.skipped).toEqual(['test_recipe_a']);
    expect(EventBus.emit).not.toHaveBeenCalled();
  });

  it('두 카드 중 하나만 매칭되면 unlock 안 함', () => {
    const result = HiddenElementSystem.unlockByAttempt('wood', 'unknown_id');

    expect(result.unlocked).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);
  });

  it('단일 재료 레시피(test_recipe_b)는 같은 카드 두 번이어도 매칭 시도', () => {
    const result = HiddenElementSystem.unlockByAttempt('herb', 'herb');

    expect(result.unlocked).toEqual(['test_recipe_b']);
  });

  it('알 수 없는 정보 (null/undefined) 입력은 조용히 무시', () => {
    expect(() => HiddenElementSystem.unlockByAttempt(null, 'wood')).not.toThrow();
    expect(() => HiddenElementSystem.unlockByAttempt(undefined, undefined)).not.toThrow();
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);
  });
});
