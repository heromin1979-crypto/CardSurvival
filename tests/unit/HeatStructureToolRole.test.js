// @vitest-environment happy-dom
// === 화기 구조물의 요리 도구 역할 테스트 ===
// regression: 임시 화톳불·방풍 화로는 설명에 "요리 가능"이라 적혀 있었지만
// 요리 청사진의 requiredTools는 ['campfire']여서 id가 다른 두 화기로는 통과할 수
// 없었다. 방풍 화로는 secretCombinations의 발견 메시지("campfire와 동일하게 사용
// 가능")까지 있었는데도 배선이 없었다.
import { describe, it, expect, beforeEach } from 'vitest';
import CraftSystem from '../../js/systems/CraftSystem.js';
import CraftDiscovery from '../../js/systems/CraftDiscovery.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';
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

function place(definitionId, row = 'middle', overrides = {}) {
  const inst = GameState.createCardInstance(definitionId, overrides);
  GameState.board[row][GameState.board[row].indexOf(null)] = inst.instanceId;
  GameState._updateEncumbrance();
  return inst;
}

function stockMaterials(blueprintId) {
  for (const req of BLUEPRINTS[blueprintId].stages[0].requiredItems) {
    place(req.definitionId, 'middle', { quantity: req.qty });
  }
}

describe('화기 구조물 — campfire 도구 역할 대체 (toolProvides)', () => {
  beforeEach(resetWorld);

  it('임시 화톳불이 campfire 역할을 대체한다고 선언한다', () => {
    expect(ITEMS.campfire_temp.toolProvides).toContain('campfire');
  });

  it('방풍 화로가 campfire 역할을 대체한다고 선언한다', () => {
    expect(ITEMS.wind_stove.toolProvides).toContain('campfire');
  });

  it('화기가 없으면 요리 청사진을 시작할 수 없다', () => {
    stockMaterials(COOK_BP);
    expect(CraftSystem.canStartBlueprint(COOK_BP).ok).toBe(false);
  });

  it('임시 화톳불만 있어도 요리 청사진을 시작할 수 있다', () => {
    stockMaterials(COOK_BP);
    place('campfire_temp');
    expect(CraftSystem.canStartBlueprint(COOK_BP).ok).toBe(true);
  });

  it('방풍 화로만 있어도 요리 청사진을 시작할 수 있다', () => {
    stockMaterials(COOK_BP);
    place('wind_stove');
    expect(CraftSystem.canStartBlueprint(COOK_BP).ok).toBe(true);
  });

  it('CraftDiscovery 경로에서도 동일하게 인정된다', () => {
    stockMaterials(COOK_BP);
    expect(CraftDiscovery._canStartNow(COOK_BP)).toBe(false);
    place('campfire_temp');
    expect(CraftDiscovery._canStartNow(COOK_BP)).toBe(true);
  });

  it('요리 도구를 대체할 뿐 작업대 요구 청사진까지 통과시키지는 않는다', () => {
    place('campfire_temp');
    expect(CraftSystem.canStartBlueprint('medical_station').ok).toBe(false);
  });
});
