// @vitest-environment happy-dom
// === 화기 구조물 수명·날씨 소화 회귀 테스트 ===
// regression: StatSystem._applyTemperatureLogic이 definitionId === 'campfire'만
// 찾아 임시 화톳불·방풍 화로는 체온 회복도 연료 소모도 없었다. 설명에 적힌
// "3턴만 지속" "비·눈에 바로 꺼진다"를 읽는 코드가 없어 영구 구조물로 동작했다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import StatSystem from '../../js/systems/StatSystem.js';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';
import BALANCE from '../../js/data/gameBalance.js';

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
    diseases: [],
    equipped: {},
    skills: {},
    hp: { current: 80, max: 100 },
    structureEffects: null,
    structureDurabilityBonus: 1.0,
  };
  GameState.stats = {
    hydration:   { current: 100, max: 200 },
    nutrition:   { current: 100, max: 200 },
    temperature: { current: 50,  max: 100 },
    morale:      { current: 50,  max: 100 },
    stamina:     { current: 50,  max: 100 },
    fatigue:     { current: 20,  max: 100 },
    radiation:   { current: 0,   max: 100 },
    infection:   { current: 0,   max: 100, rateMultiplier: 1.0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.weather = { id: 'sunny' };
  GameState.flags = {};
  GameState.debug = {};
}

/** 화기 카드를 바닥(middle)에 올리고 인스턴스를 반환 */
function placeFire(definitionId, overrides = {}) {
  const inst = GameState.createCardInstance(definitionId, overrides);
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

const onBoard = (instanceId) => GameState.board.middle.includes(instanceId);

describe('임시 화톳불 — 3TP 지속 후 소멸', () => {
  beforeEach(resetWorld);

  it('3TP 동안 남아 있다가 3TP째에 사라진다', () => {
    const inst = placeFire('campfire_temp');
    expect(GameData.items.campfire_temp.defaultDurability).toBe(15);

    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId]).toBeDefined();
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId]).toBeDefined();
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId]).toBeUndefined();
  });

  it('소멸하면 보드 슬롯에서도 빠진다', () => {
    const inst = placeFire('campfire_temp', { durability: 1 });
    StatSystem._applyTemperatureLogic();
    expect(onBoard(inst.instanceId)).toBe(false);
  });

  it('타는 동안 onTick.temperature만큼 체온을 올린다', () => {
    placeFire('campfire_temp');
    const before = GameState.stats.temperature.current;
    StatSystem._applyTemperatureLogic();
    expect(GameState.stats.temperature.current)
      .toBeCloseTo(before + GameData.items.campfire_temp.onTick.temperature);
  });
});

describe('캠프파이어 — 연료가 떨어져도 카드는 남는다', () => {
  beforeEach(resetWorld);

  it('기존 소모율(BALANCE.campfire.fuelConsumePerTP)을 유지한다', () => {
    const inst = placeFire('campfire');
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId].durability)
      .toBeCloseTo(50 - BALANCE.campfire.fuelConsumePerTP);
  });

  it('연료가 0이 되어도 재점화용으로 보드에 남는다', () => {
    const inst = placeFire('campfire', { durability: 0.5 });
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId]).toBeDefined();
    expect(GameState.cards[inst.instanceId].durability).toBe(0);
    expect(onBoard(inst.instanceId)).toBe(true);
  });

  it('연료가 0인 캠프파이어는 체온을 올리지 않는다', () => {
    placeFire('campfire', { durability: 0 });
    const before = GameState.stats.temperature.current;
    StatSystem._applyTemperatureLogic();
    expect(GameState.stats.temperature.current).toBe(before);
  });
});

describe('방풍 화로 — 화기 처리 대상에 포함된다', () => {
  beforeEach(resetWorld);

  it('체온을 올리고 연료를 소모한다', () => {
    const inst = placeFire('wind_stove');
    const before = GameState.stats.temperature.current;
    StatSystem._applyTemperatureLogic();
    expect(GameState.stats.temperature.current)
      .toBeCloseTo(before + GameData.items.wind_stove.onTick.temperature);
    expect(GameState.cards[inst.instanceId].durability).toBeLessThan(80);
  });

  it('캠프파이어보다 연료 효율이 좋다', () => {
    const stove = placeFire('wind_stove');
    const fire  = placeFire('campfire');
    const stoveBefore = stove.durability;
    const fireBefore  = fire.durability;
    StatSystem._applyTemperatureLogic();
    const stoveUsed = stoveBefore - GameState.cards[stove.instanceId].durability;
    const fireUsed  = fireBefore  - GameState.cards[fire.instanceId].durability;
    expect(stoveUsed).toBeLessThan(fireUsed);
  });
});

describe('비·눈 소화', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it('비가 오면 임시 화톳불은 1TP 만에 소멸한다', () => {
    GameState.weather = { id: 'rainy' };
    const inst = placeFire('campfire_temp');
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId]).toBeUndefined();
  });

  it('눈이 와도 방풍 화로(weather_resistant)는 꺼지지 않는다', () => {
    GameState.weather = { id: 'blizzard' };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const inst = placeFire('wind_stove');
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId].durability).toBeGreaterThan(0);
  });

  it('비가 오면 캠프파이어는 확률적으로 꺼지되 카드는 남는다', () => {
    GameState.weather = { id: 'snow' };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const inst = placeFire('campfire');
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId]).toBeDefined();
    expect(GameState.cards[inst.instanceId].durability).toBe(0);
  });

  it('소화 확률에 걸리지 않으면 캠프파이어는 계속 탄다', () => {
    GameState.weather = { id: 'snow' };
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const inst = placeFire('campfire');
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId].durability)
      .toBeCloseTo(50 - BALANCE.campfire.fuelConsumePerTP);
  });

  it('맑은 날에는 소화 판정이 일어나지 않는다', () => {
    GameState.weather = { id: 'sunny' };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const inst = placeFire('campfire');
    StatSystem._applyTemperatureLogic();
    expect(GameState.cards[inst.instanceId].durability)
      .toBeCloseTo(50 - BALANCE.campfire.fuelConsumePerTP);
  });

  it('꺼진 화기는 그 TP에 체온을 올리지 않는다', () => {
    GameState.weather = { id: 'rainy' };
    placeFire('campfire_temp');
    const before = GameState.stats.temperature.current;
    StatSystem._applyTemperatureLogic();
    expect(GameState.stats.temperature.current).toBe(before);
  });
});
