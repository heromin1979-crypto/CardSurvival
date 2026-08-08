// @vitest-environment happy-dom
// === 마른 개울 재충수 회귀 테스트 ===
// regression: _changeWeather의 비 판정이 ['rain', ...]으로 적혀 있었으나 실제 날씨
// id는 'rainy'라, 자연 날씨 전환으로는 _refillDryStreams가 한 번도 호출되지 않았다.
// GM 강제 설정(setWeather)만 올바른 'rainy'를 써서 동작하던 상태.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WeatherSystem from '../../js/systems/WeatherSystem.js';
import GameState from '../../js/core/GameState.js';

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
    equipped: {},
    skills: {},
    hp: { current: 80, max: 100 },
    structureDurabilityBonus: 1.0,
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.season = { current: 'spring' };
  GameState.weather = { id: 'sunny', tpRemaining: 10 };
  GameState.flags = {};
  GameState.debug = {};
}

function placeDryStream() {
  const inst = GameState.createCardInstance('dry_stream');
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

/** 다음 _rollWeather 결과를 고정한 뒤 날씨를 전환한다 */
function changeWeatherTo(weatherId) {
  vi.spyOn(WeatherSystem, '_rollWeather').mockReturnValue({ id: weatherId, name: weatherId, icon: '·' });
  WeatherSystem._changeWeather(GameState);
}

describe('마른 개울 — 비 전환 시 재충수', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it('맑음 → 비로 바뀌면 마른 개울이 다시 찬다', () => {
    const inst = placeDryStream();
    changeWeatherTo('rainy');
    expect(GameState.cards[inst.instanceId].definitionId).toBe('stream_spring');
  });

  it('맑음 → 폭풍/장마에서도 재충수된다', () => {
    const storm = placeDryStream();
    changeWeatherTo('storm');
    expect(GameState.cards[storm.instanceId].definitionId).toBe('stream_spring');

    resetWorld();
    const monsoon = placeDryStream();
    changeWeatherTo('monsoon');
    expect(GameState.cards[monsoon.instanceId].definitionId).toBe('stream_spring');
  });

  it('비가 아닌 날씨로 바뀌면 마른 개울 그대로다', () => {
    const inst = placeDryStream();
    changeWeatherTo('cloudy');
    expect(GameState.cards[inst.instanceId].definitionId).toBe('dry_stream');
  });

  it('이미 비였다면 다른 비 계열로 바뀌어도 재충수하지 않는다', () => {
    GameState.weather = { id: 'rainy', tpRemaining: 1 };
    const inst = placeDryStream();
    changeWeatherTo('monsoon');
    expect(GameState.cards[inst.instanceId].definitionId).toBe('dry_stream');
  });
});
