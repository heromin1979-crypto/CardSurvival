// @vitest-environment happy-dom
// === 비 판정 공유 테스트 ===
// NPCSystem이 gs.weather?.currentWeather === 'rain'으로 비를 판정했다. 필드명
// (currentWeather → id)과 값('rain' → 'rainy')이 둘 다 틀려 condition:'rain'
// 선제 대사가 한 번도 발동하지 않았다. WeatherSystem의 비 계열 목록을 공유해
// 같은 오타가 다시 나지 않게 한다.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import WeatherSystem, { RAINY_WEATHER_IDS, isRainyWeather } from '../../js/systems/WeatherSystem.js';
import NPCSystem from '../../js/systems/NPCSystem.js';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import NPCS from '../../js/data/npcs.js';

/** spontaneous에 condition:'rain'을 가진 NPC id */
const RAIN_NPC = Object.keys(NPCS).find(id =>
  NPCS[id]?.spontaneous?.some(e => e.condition === 'rain'));

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, characterId: 'soldier',
    hp: { current: 100, max: 100 },
  };
  GameState.stats = {
    hydration: { current: 100, max: 200 }, nutrition: { current: 100, max: 200 },
    temperature: { current: 36, max: 100 }, morale: { current: 100, max: 100 },
    stamina: { current: 50, max: 100 }, fatigue: { current: 20, max: 100 },
    radiation: { current: 0, max: 100 },
    infection: { current: 0, max: 100, rateMultiplier: 1.0 },
  };
  GameState.time = { day: 10, totalTP: 72, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.weather = { id: 'sunny', name: '맑음' };
  GameState.companions = RAIN_NPC ? [RAIN_NPC] : [];
  GameState.flags = {};
  GameState.debug = {};
}

describe('isRainyWeather — 비 계열 판정', () => {
  it('비·폭풍·장마를 비로 본다', () => {
    for (const id of ['rainy', 'storm', 'monsoon']) expect(isRainyWeather(id)).toBe(true);
  });

  it('맑음·눈·안개는 비가 아니다', () => {
    for (const id of ['sunny', 'snow', 'foggy', 'clear']) expect(isRainyWeather(id)).toBe(false);
  });

  it("존재하지 않는 'rain'은 비로 치지 않는다 (실제 id는 'rainy')", () => {
    expect(isRainyWeather('rain')).toBe(false);
    expect(RAINY_WEATHER_IDS).toContain('rainy');
    expect(RAINY_WEATHER_IDS).not.toContain('rain');
  });

  it('WeatherSystem 내부 판정과 같은 목록을 쓴다', () => {
    // setWeather가 비로 전환할 때 마른 개울을 채우는 것과 같은 기준이어야 한다
    expect(RAINY_WEATHER_IDS.every(id => isRainyWeather(id))).toBe(true);
  });
});

describe('NPC 선제 대사 — 비 조건', () => {
  beforeEach(resetWorld);

  it('condition:rain 대사를 가진 NPC가 데이터에 존재한다', () => {
    expect(RAIN_NPC).toBeDefined();
  });

  it('비가 오면 비 대사가 발동한다', () => {
    GameState.weather = { id: 'rainy', name: '비' };
    const seen = [];
    const off = EventBus.on('charDialogue', p => seen.push(p));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    NPCSystem._checkSpontaneousDialogue();
    if (typeof off === 'function') off();
    vi.restoreAllMocks();

    const rainLine = NPCS[RAIN_NPC].spontaneous.find(e => e.condition === 'rain').line;
    expect(seen.map(s => s.line)).toContain(rainLine);
  });

  it('맑은 날에는 비 대사가 발동하지 않는다', () => {
    GameState.weather = { id: 'sunny', name: '맑음' };
    const seen = [];
    const off = EventBus.on('charDialogue', p => seen.push(p));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    NPCSystem._checkSpontaneousDialogue();
    if (typeof off === 'function') off();
    vi.restoreAllMocks();

    const rainLine = NPCS[RAIN_NPC].spontaneous.find(e => e.condition === 'rain').line;
    expect(seen.map(s => s.line)).not.toContain(rainLine);
  });

  it('장마에도 비 대사가 발동한다', () => {
    GameState.weather = { id: 'monsoon', name: '장마' };
    const seen = [];
    const off = EventBus.on('charDialogue', p => seen.push(p));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    NPCSystem._checkSpontaneousDialogue();
    if (typeof off === 'function') off();
    vi.restoreAllMocks();

    const rainLine = NPCS[RAIN_NPC].spontaneous.find(e => e.condition === 'rain').line;
    expect(seen.map(s => s.line)).toContain(rainLine);
  });
});
