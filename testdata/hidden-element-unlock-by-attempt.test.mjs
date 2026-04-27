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
      name: '테스트 레시피 A',
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
      name: '테스트 레시피 B',
      hidden: true,
      stages: [{
        stageIndex: 0,
        requiredItems: [
          { definitionId: 'herb', qty: 1 },
        ],
      }],
      output: [{ definitionId: 'test_output_b', qty: 1 }],
    },
    non_hidden_recipe: {
      id: 'non_hidden_recipe',
      name: '공개 레시피',
      hidden: false,
      stages: [{
        stageIndex: 0,
        requiredItems: [
          { definitionId: 'wood', qty: 1 },
          { definitionId: 'scrap_metal', qty: 1 },
        ],
      }],
      output: [{ definitionId: 'non_hidden_output', qty: 1 }],
    },
    multi_stage_recipe: {
      id: 'multi_stage_recipe',
      name: '다단계 레시피',
      hidden: true,
      stages: [
        {
          stageIndex: 0,
          requiredItems: [
            { definitionId: 'cloth', qty: 1 },
          ],
        },
        {
          stageIndex: 1,
          requiredItems: [
            { definitionId: 'rope', qty: 1 },
            { definitionId: 'leather', qty: 1 },
          ],
        },
      ],
      output: [{ definitionId: 'multi_output', qty: 1 }],
    },
    empty_stages_recipe: {
      id: 'empty_stages_recipe',
      name: '빈 stages',
      hidden: true,
      stages: [],
      output: [{ definitionId: 'broken_output', qty: 1 }],
    },
    empty_required_recipe: {
      id: 'empty_required_recipe',
      name: '빈 requiredItems',
      hidden: true,
      stages: [{ stageIndex: 0, requiredItems: [] }],
      output: [{ definitionId: 'broken_output_2', qty: 1 }],
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
    expect(EventBus.emit).toHaveBeenCalledWith('recipeUnlocked', expect.objectContaining({
      recipeId: 'test_recipe_a',
      source: 'attempt',
    }));
    expect(EventBus.emit).toHaveBeenCalledWith('notify', expect.objectContaining({
      message: expect.stringContaining('새 조합 발견'),
      type: 'good',
    }));
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

  it('hidden:false 레시피는 같은 재료 조합이어도 unlock 안 함', () => {
    const result = HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    // hidden:true인 test_recipe_a는 unlock되지만, hidden:false는 무시
    expect(result.unlocked).toEqual(['test_recipe_a']);
    expect(GameState.flags.hiddenRecipesUnlocked).not.toContain('non_hidden_recipe');
  });

  it('multi-stage 레시피의 stage 1+ 재료로는 unlock 안 함 (stage 0만 검사)', () => {
    // stage 1 재료(rope, leather)로 시도 — multi_stage_recipe는 unlock되어선 안 됨
    const result = HiddenElementSystem.unlockByAttempt('rope', 'leather');

    expect(result.unlocked).not.toContain('multi_stage_recipe');
    expect(GameState.flags.hiddenRecipesUnlocked).not.toContain('multi_stage_recipe');
  });

  it('stages 배열이 비어있거나 requiredItems가 비어있는 hidden 레시피는 throw 없이 무시', () => {
    expect(() => HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal')).not.toThrow();
    expect(GameState.flags.hiddenRecipesUnlocked).not.toContain('empty_stages_recipe');
    expect(GameState.flags.hiddenRecipesUnlocked).not.toContain('empty_required_recipe');
  });
});
