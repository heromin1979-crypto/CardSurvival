// === Sub-spec 2B: 모호 힌트 UX 테스트 ===
// unlock 전 hidden 레시피는 결과물을 노출하지 않고 모호한 힌트를 반환.
// findRecipes에 { includeLocked } 옵트인 파라미터 도입, isLocked 플래그 추가.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../js/core/GameState.js', () => ({
  default: {
    flags: { hiddenRecipesUnlocked: [] },
    crafting: { activeQueue: [], maxQueueSize: 3 },
    player: { skills: {} },
    countOnBoard: vi.fn(() => 99),
    getBoardCards: () => [],
  },
}));

vi.mock('../js/core/I18n.js', () => ({
  default: {
    t: (k) => {
      const dict = {
        'craft.ready':     '제작 가능',
        'craft.missing':   '개 부족',
        'craft.vagueHint': '무언가 만들 수 있을 것 같다',
      };
      return dict[k] ?? k;
    },
    blueprintName: (_id, name) => name,
    itemName: (_id, name) => name,
  },
}));

vi.mock('../js/data/GameData.js', () => ({
  default: { items: {
    test_output: { name: '테스트 결과물', icon: '🔧' },
    public_output: { name: '공개 결과물', icon: '🪓' },
  }},
}));

vi.mock('../js/data/blueprints.js', () => ({
  default: {
    public_bp: {
      id: 'public_bp',
      name: '공개 블루프린트',
      category: 'tool',
      output: [{ definitionId: 'public_output', qty: 1 }],
      stages: [{
        stageIndex: 0,
        tpCost: 1,
        requiredItems: [
          { definitionId: 'wood', qty: 1 },
          { definitionId: 'rope', qty: 1 },
        ],
      }],
    },
  },
}));

vi.mock('../js/data/hiddenRecipes.js', () => ({
  default: {
    hidden_bp: {
      id: 'hidden_bp',
      name: 'Hidden 블루프린트',
      category: 'weapon',
      hidden: true,
      output: [{ definitionId: 'test_output', qty: 1 }],
      stages: [{
        stageIndex: 0,
        tpCost: 2,
        requiredItems: [
          { definitionId: 'scrap_metal', qty: 1 },
          { definitionId: 'cloth', qty: 1 },
        ],
      }],
    },
  },
}));

import CraftDiscovery from '../js/systems/CraftDiscovery.js';
import GameState from '../js/core/GameState.js';

describe('Sub-spec 2B: findRecipes includeLocked 파라미터', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
    GameState.countOnBoard.mockReturnValue(99);
  });

  it('기본값(includeLocked 미지정)은 잠긴 hidden 제외 (기존 동작 회귀 보장)', () => {
    const result = CraftDiscovery.findRecipes('scrap_metal', 'cloth');
    expect(result).toHaveLength(0);
  });

  it('includeLocked: false도 잠긴 hidden 제외', () => {
    const result = CraftDiscovery.findRecipes('scrap_metal', 'cloth', { includeLocked: false });
    expect(result).toHaveLength(0);
  });

  it('includeLocked: true는 잠긴 hidden 포함 + isLocked: true 표시', () => {
    const result = CraftDiscovery.findRecipes('scrap_metal', 'cloth', { includeLocked: true });
    expect(result).toHaveLength(1);
    expect(result[0].blueprintId).toBe('hidden_bp');
    expect(result[0].isLocked).toBe(true);
  });

  it('unlock된 hidden은 isLocked: false', () => {
    GameState.flags.hiddenRecipesUnlocked = ['hidden_bp'];
    const result = CraftDiscovery.findRecipes('scrap_metal', 'cloth', { includeLocked: true });
    expect(result).toHaveLength(1);
    expect(result[0].isLocked).toBe(false);
  });

  it('비-hidden 레시피는 항상 isLocked: false', () => {
    const result = CraftDiscovery.findRecipes('wood', 'rope');
    expect(result).toHaveLength(1);
    expect(result[0].blueprintId).toBe('public_bp');
    expect(result[0].isLocked).toBe(false);
  });
});

describe('Sub-spec 2B: getQuickHint 모호 힌트', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
    GameState.countOnBoard.mockReturnValue(99);
  });

  it('잠긴 hidden + 재료 충분 → 모호 힌트 + (제작 가능)', () => {
    const hint = CraftDiscovery.getQuickHint('scrap_metal', 'cloth');
    expect(hint).not.toBeNull();
    expect(hint.hint).toBe('✨ 무언가 만들 수 있을 것 같다 (제작 가능)');
    expect(hint.canStart).toBe(true);
    expect(hint.count).toBe(1);
  });

  it('잠긴 hidden + 재료 부족 → 모호 힌트 + (N 개 부족)', () => {
    GameState.countOnBoard.mockReturnValue(0);
    const hint = CraftDiscovery.getQuickHint('scrap_metal', 'cloth');
    expect(hint).not.toBeNull();
    expect(hint.hint).toBe('✨ 무언가 만들 수 있을 것 같다 (2 개 부족)');
    expect(hint.canStart).toBe(false);
    expect(hint.count).toBe(1);
  });

  it('unlock된 hidden → 실제 결과물 이름 노출 (회귀 보장)', () => {
    GameState.flags.hiddenRecipesUnlocked = ['hidden_bp'];
    const hint = CraftDiscovery.getQuickHint('scrap_metal', 'cloth');
    expect(hint).not.toBeNull();
    expect(hint.hint).toContain('테스트 결과물');
    expect(hint.hint).not.toContain('무언가 만들 수');
  });

  it('비-hidden 레시피 → 실제 결과물 이름 노출 (회귀 보장)', () => {
    const hint = CraftDiscovery.getQuickHint('wood', 'rope');
    expect(hint).not.toBeNull();
    expect(hint.hint).toContain('공개 결과물');
    expect(hint.hint).not.toContain('무언가 만들 수');
  });

  it('매칭 없음 → null 반환 (회귀 보장)', () => {
    const hint = CraftDiscovery.getQuickHint('nonexistent_a', 'nonexistent_b');
    expect(hint).toBeNull();
  });
});
