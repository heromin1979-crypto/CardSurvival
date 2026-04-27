// === Sub-spec 2C: unlockByAttempt notify 메시지 i18n 토큰화 ===
// 2A에서 하드코딩된 '✨ 새 조합 발견: ${bp.name}'를 hidden.recipeUnlockByAttempt 토큰으로 전환.
// 시간/스킬 unlock 경로(hidden.recipeUnlock 📜)와 시각적으로 구분 유지.
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

vi.mock('../js/core/SystemRegistry.js', () => ({
  default: { register: vi.fn(), get: vi.fn() },
}));

vi.mock('../js/data/hiddenLocations.js', () => ({ HIDDEN_LOCATIONS: {} }));
vi.mock('../js/data/secretEnemies.js', () => ({ SECRET_ENEMIES: {} }));
vi.mock('../js/data/secretEvents.js', () => ({ default: {} }));
vi.mock('../js/data/blueprints.js', () => ({ default: {} }));
vi.mock('../js/data/GameData.js', () => ({ default: { items: {} } }));

vi.mock('../js/data/hiddenRecipes.js', () => ({
  default: {
    test_recipe: {
      id: 'test_recipe',
      name: '테스트 카타나',
      hidden: true,
      stages: [{
        stageIndex: 0,
        requiredItems: [
          { definitionId: 'wood', qty: 1 },
          { definitionId: 'scrap_metal', qty: 1 },
        ],
      }],
      output: [{ definitionId: 'test_output', qty: 1 }],
    },
  },
}));

const { i18nMock } = vi.hoisted(() => ({
  i18nMock: {
    t: vi.fn((key, params) => {
      if (key === 'hidden.recipeUnlockByAttempt') {
        return `✨ 새 조합 발견: ${params?.name ?? '???'}!`;
      }
      return key;
    }),
    blueprintName: vi.fn((_id, name) => name),
    itemName: vi.fn((_id, name) => name),
  },
}));
vi.mock('../js/core/I18n.js', () => ({ default: i18nMock }));

import HiddenElementSystem from '../js/systems/HiddenElementSystem.js';
import EventBus from '../js/core/EventBus.js';
import GameState from '../js/core/GameState.js';

describe('Sub-spec 2C: unlockByAttempt notify i18n 토큰화', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
    EventBus.emit.mockClear();
    i18nMock.t.mockClear();
  });

  it('unlock 시 hidden.recipeUnlockByAttempt 토큰으로 notify emit', () => {
    HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    expect(i18nMock.t).toHaveBeenCalledWith(
      'hidden.recipeUnlockByAttempt',
      expect.objectContaining({ name: '테스트 카타나' })
    );

    const notifyCall = EventBus.emit.mock.calls.find(c => c[0] === 'notify');
    expect(notifyCall).toBeDefined();
    expect(notifyCall[1].message).toBe('✨ 새 조합 발견: 테스트 카타나!');
    expect(notifyCall[1].type).toBe('good');
  });

  it('blueprintName으로 다국어 이름 해석 후 토큰에 전달', () => {
    HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    expect(i18nMock.blueprintName).toHaveBeenCalledWith('test_recipe', '테스트 카타나');
  });

  it('이미 unlock된 레시피는 notify 재호출 없음 (회귀 보장)', () => {
    GameState.flags.hiddenRecipesUnlocked = ['test_recipe'];

    HiddenElementSystem.unlockByAttempt('wood', 'scrap_metal');

    const notifyCalls = EventBus.emit.mock.calls.filter(c => c[0] === 'notify');
    expect(notifyCalls).toHaveLength(0);
    expect(i18nMock.t).not.toHaveBeenCalledWith(
      'hidden.recipeUnlockByAttempt',
      expect.anything()
    );
  });
});
