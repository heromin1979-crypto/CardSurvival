// @vitest-environment happy-dom
// === 꺼진 화기 사용 차단 테스트 ===
// regression: 연료가 0인 캠프파이어도 요리 도구로 인정됐다. providesTool은 정의만
// 대조하고 요리 상호작용의 canApply는 무조건 ok를 반환해, 꺼진 불에서 라면이 익고
// 물이 끓었다. 단 재점화·연료 보충·수리는 꺼진 불이 대상이므로 계속 허용해야 한다.
import { describe, it, expect, beforeEach } from 'vitest';
import CraftSystem from '../../js/systems/CraftSystem.js';
import CraftDiscovery from '../../js/systems/CraftDiscovery.js';
import SlotResolver from '../../js/board/SlotResolver.js';
import { isUnlitFire } from '../../js/systems/toolProvision.js';
import GameState from '../../js/core/GameState.js';
import BLUEPRINTS from '../../js/data/blueprints.js';

const COOK_BP = 'grill_fish';

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true,
    traits: [],
    diseases: [],
    equipped: {},
    characterId: 'chef',
    hp: { current: 80, max: 100 },
    structureEffects: null,
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 30, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: {
      cooking: { xp: 0, level: 3 }, crafting: { xp: 0, level: 3 },
      building: { xp: 0, level: 3 }, harvesting: { xp: 0, level: 0 },
    },
  };
  GameState.stats = {
    hydration: { current: 100, max: 200 }, nutrition: { current: 100, max: 200 },
    temperature: { current: 36, max: 100 }, morale: { current: 50, max: 100 },
    stamina: { current: 50, max: 100 }, fatigue: { current: 20, max: 100 },
    radiation: { current: 0, max: 100 },
    infection: { current: 0, max: 100, rateMultiplier: 1.0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.crafting = { activeQueue: [], maxQueueSize: 3, knownBlueprints: [] };
  GameState.flags = { hiddenRecipesUnlocked: [], hiddenLocationsDiscovered: [], bossesKilled: [] };
  GameState.season = { current: 'spring' };
  GameState.weather = { id: 'sunny' };
  GameState.debug = {};
}

function place(definitionId, overrides = {}) {
  const inst = GameState.createCardInstance(definitionId, overrides);
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  GameState._updateEncumbrance();
  return inst;
}

function stockMaterials(blueprintId) {
  for (const req of BLUEPRINTS[blueprintId].stages[0].requiredItems) {
    place(req.definitionId, { quantity: req.qty });
  }
}

describe('isUnlitFire — 판정 범위', () => {
  it('연료가 0인 화기는 꺼진 것으로 본다', () => {
    expect(isUnlitFire('campfire', 0)).toBe(true);
    expect(isUnlitFire('wind_stove', 0)).toBe(true);
    expect(isUnlitFire('campfire_temp', 0)).toBe(true);
  });

  it('연료가 남은 화기는 꺼지지 않은 것으로 본다', () => {
    expect(isUnlitFire('campfire', 0.5)).toBe(false);
    expect(isUnlitFire('campfire', 50)).toBe(false);
  });

  it('화기가 아닌 도구는 내구도 0이어도 판정 대상이 아니다', () => {
    expect(isUnlitFire('workbench', 0)).toBe(false);
    expect(isUnlitFire('knife', 0)).toBe(false);
  });
});

describe('꺼진 화기 — 제작 도구 판정에서 제외', () => {
  beforeEach(resetWorld);

  it('연료가 남은 캠프파이어는 요리 청사진을 통과시킨다', () => {
    stockMaterials(COOK_BP);
    place('campfire');
    expect(CraftSystem.canStartBlueprint(COOK_BP).ok).toBe(true);
  });

  it('연료가 0인 캠프파이어는 요리 청사진을 막는다', () => {
    stockMaterials(COOK_BP);
    place('campfire', { durability: 0 });
    expect(CraftSystem.canStartBlueprint(COOK_BP).ok).toBe(false);
  });

  it('연료가 0인 방풍 화로도 막는다', () => {
    stockMaterials(COOK_BP);
    place('wind_stove', { durability: 0 });
    expect(CraftSystem.canStartBlueprint(COOK_BP).ok).toBe(false);
  });

  it('CraftDiscovery 경로에서도 동일하게 막힌다', () => {
    stockMaterials(COOK_BP);
    place('campfire', { durability: 0 });
    expect(CraftDiscovery._canStartNow(COOK_BP)).toBe(false);
  });
});

describe('꺼진 화기 — 보드 상호작용 차단', () => {
  beforeEach(resetWorld);

  it('불이 붙어 있으면 라면이 조리된다', () => {
    const fire = place('campfire');
    const ramen = place('instant_noodles');
    SlotResolver.resolveInteraction(ramen.instanceId, fire.instanceId);
    expect(GameState.cards[ramen.instanceId].definitionId).toBe('cooked_noodles');
  });

  it('꺼진 불에서는 라면이 조리되지 않는다', () => {
    const fire = place('campfire', { durability: 0 });
    const ramen = place('instant_noodles');
    SlotResolver.resolveInteraction(ramen.instanceId, fire.instanceId);
    expect(GameState.cards[ramen.instanceId].definitionId).toBe('instant_noodles');
  });

  it('꺼진 불이 소스 쪽이어도 조리되지 않는다', () => {
    const fire = place('campfire', { durability: 0 });
    const ramen = place('instant_noodles');
    SlotResolver.resolveInteraction(fire.instanceId, ramen.instanceId);
    expect(GameState.cards[ramen.instanceId].definitionId).toBe('instant_noodles');
  });

  it('꺼진 불에서는 비밀 조합도 발동하지 않는다', () => {
    const fire = place('campfire', { durability: 0 });
    const bottle = place('empty_bottle');
    place('cloth');
    SlotResolver.resolveSecretCombo(bottle.instanceId, fire.instanceId);
    expect(GameState.countOnBoard('molotov_cocktail')).toBe(0);
  });
});

describe('꺼진 화기 — 재점화·보충·수리는 계속 허용', () => {
  beforeEach(resetWorld);

  it('라이터로 재점화할 수 있다', () => {
    const fire = place('campfire', { durability: 0 });
    const lighter = place('lighter');
    SlotResolver.resolveInteraction(lighter.instanceId, fire.instanceId);
    expect(GameState.cards[fire.instanceId].durability).toBeGreaterThan(0);
  });

  it('연료통으로 완전 보충할 수 있다', () => {
    const fire = place('campfire', { durability: 0 });
    const can = place('fuel_can');
    SlotResolver.resolveInteraction(can.instanceId, fire.instanceId);
    expect(GameState.cards[fire.instanceId].durability).toBe(50);
  });

  it('덕테이프로 수리할 수 있다', () => {
    const fire = place('campfire', { durability: 0 });
    const tape = place('duct_tape');
    SlotResolver.resolveInteraction(tape.instanceId, fire.instanceId);
    expect(GameState.cards[fire.instanceId].durability).toBeGreaterThan(0);
  });
});
