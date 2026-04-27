// === Sub-spec 2A 통합 테스트 (실제 hiddenRecipes 데이터) ===
// Mock 안 쓰고 진짜 hiddenRecipes.js 데이터로 unlockByAttempt 검증.
// 데이터 shape/내용 변경 시 회귀 잡는 안전망.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 진짜 hiddenRecipes는 mock 안 함 (테스트 목적).
// 그러나 GameState, I18n 등 다른 의존성은 mock 필요.
vi.mock('../js/core/GameState.js', () => ({
  default: {
    flags: { hiddenRecipesUnlocked: [] },
    crafting: { activeQueue: [], maxQueueSize: 3 },
    player: { skills: {} },
    time: { day: 1, totalTP: 0 },
    location: { currentDistrict: 'test' },
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

// EventBus는 진짜 사용해서 emit 결과 추적
vi.mock('../js/core/SystemRegistry.js', () => ({ default: { register: vi.fn() } }));
vi.mock('../js/data/hiddenLocations.js', () => ({ HIDDEN_LOCATIONS: {} }));
vi.mock('../js/data/secretEnemies.js', () => ({ SECRET_ENEMIES: {} }));
vi.mock('../js/data/secretEvents.js', () => ({ default: {} }));
vi.mock('../js/data/blueprints.js', () => ({ default: {} }));

import HiddenElementSystem from '../js/systems/HiddenElementSystem.js';
import EventBus from '../js/core/EventBus.js';
import GameState from '../js/core/GameState.js';
import HIDDEN_RECIPES from '../js/data/hiddenRecipes.js';

describe('Sub-spec 2A 실데이터 통합', () => {
  beforeEach(() => {
    GameState.flags.hiddenRecipesUnlocked = [];
    // EventBus listener leak 방지 (이전 테스트의 등록이 살아있을 수 있음)
    EventBus._listeners = {};
  });

  it('reinforced_shelter (scrap_metal + wood) 시도하면 즉시 unlock', () => {
    // 사전 가드: 데이터에 정말 그런 레시피가 존재하는지 확인
    expect(HIDDEN_RECIPES.reinforced_shelter).toBeDefined();
    expect(HIDDEN_RECIPES.reinforced_shelter.hidden).toBe(true);
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);

    const events = [];
    const off = EventBus.on('recipeUnlocked', (data) => events.push(data));

    HiddenElementSystem.unlockByAttempt('scrap_metal', 'wood');

    expect(GameState.flags.hiddenRecipesUnlocked).toContain('reinforced_shelter');
    expect(events.some(e => e.recipeId === 'reinforced_shelter')).toBe(true);

    off();
  });

  it('단일 재료 자기 자신 시도(herb + herb)도 throw 없이 동작', () => {
    expect(() => HiddenElementSystem.unlockByAttempt('herb', 'herb')).not.toThrow();
    // 결과: 단일 재료 hidden 레시피가 데이터에 있을 수도/없을 수도 있음
    // 핵심: 실데이터에서 에러 없이 동작
    expect(Array.isArray(GameState.flags.hiddenRecipesUnlocked)).toBe(true);
  });

  it('idempotent: 같은 시도를 두 번 해도 unlock은 한 번', () => {
    HiddenElementSystem.unlockByAttempt('scrap_metal', 'wood');
    const firstLength = GameState.flags.hiddenRecipesUnlocked.length;
    expect(firstLength).toBeGreaterThanOrEqual(1);

    HiddenElementSystem.unlockByAttempt('scrap_metal', 'wood');
    const secondLength = GameState.flags.hiddenRecipesUnlocked.length;

    expect(secondLength).toBe(firstLength);
  });

  it('hover-safety regression: CraftDiscovery.findRecipes 호출은 unlock 안 함 (실데이터)', async () => {
    // dynamic import — CraftDiscovery는 HiddenElementSystem 의존 안 하므로 안전
    const CraftDiscovery = (await import('../js/systems/CraftDiscovery.js')).default;
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);

    // findRecipes 호출 — pure query 보장. unlock 발생하면 안 됨.
    const recipes = CraftDiscovery.findRecipes('scrap_metal', 'wood');

    // 결과: hidden 레시피 (reinforced_shelter)가 unlock 안 됐으므로 결과 목록에 없음
    expect(GameState.flags.hiddenRecipesUnlocked).toEqual([]);
    expect(recipes.find(r => r.blueprintId === 'reinforced_shelter')).toBeUndefined();
  });
});
