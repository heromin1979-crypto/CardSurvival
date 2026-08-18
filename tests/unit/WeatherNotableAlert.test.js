// === 위험 날씨 알림 ===
// regression: 알림은 _changeWeather에만 있었다. 세이브를 산성비 한복판에서 열거나
// 새 게임이 위험 날씨로 시작하면 _initWeather가 조용히 날씨만 채워, 플레이어는
// 헤더를 직접 보기 전까지 위험을 모른 채 야외에 서 있게 된다.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import WeatherSystem from '../../js/systems/WeatherSystem.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ACID   = { id: 'acid_rain', name: '산성비', icon: '☢️', tempMod: -0.3, contaminateRisk: 0.010, gardenKill: true };
const SUNNY  = { id: 'sunny', name: '맑음', icon: '☀️', tempMod: 0 };

let notices;
const onNotify = ({ message }) => notices.push(message);

beforeEach(() => {
  notices = [];
  EventBus.on('notify', onNotify);
  GameState.weather = null;
  GameState.season = { ...(GameState.season ?? {}), current: 'summer' };
  GameState.board = { top: [], environment: [], middle: Array(10).fill(null), bottom: Array(20).fill(null) };
});

afterEach(() => {
  EventBus.off('notify', onNotify);
  vi.restoreAllMocks();
});

describe('_initWeather — 시작·로드 시점 알림', () => {
  it('산성비로 시작하면 알린다', () => {
    vi.spyOn(WeatherSystem, '_rollWeather').mockReturnValue(ACID);
    WeatherSystem._initWeather(GameState);
    expect(notices.some(m => m.includes('산성비'))).toBe(true);
  });

  it('평범한 날씨로 시작하면 알리지 않는다', () => {
    vi.spyOn(WeatherSystem, '_rollWeather').mockReturnValue(SUNNY);
    WeatherSystem._initWeather(GameState);
    expect(notices).toHaveLength(0);
  });
});

describe('_changeWeather — 전환 알림', () => {
  it('산성비로 바뀌면 알린다', () => {
    GameState.weather = { ...SUNNY };
    vi.spyOn(WeatherSystem, '_rollWeather').mockReturnValue(ACID);
    vi.spyOn(WeatherSystem, '_updateWeatherHUD').mockImplementation(() => {});
    vi.spyOn(WeatherSystem, '_updateTemperatureHUD').mockImplementation(() => {});
    WeatherSystem._changeWeather(GameState);
    expect(notices.some(m => m.includes('날씨 변화') && m.includes('산성비'))).toBe(true);
  });

  it('같은 산성비가 이어지면 중복 알리지 않는다', () => {
    GameState.weather = { ...ACID };
    vi.spyOn(WeatherSystem, '_rollWeather').mockReturnValue(ACID);
    vi.spyOn(WeatherSystem, '_updateWeatherHUD').mockImplementation(() => {});
    vi.spyOn(WeatherSystem, '_updateTemperatureHUD').mockImplementation(() => {});
    WeatherSystem._changeWeather(GameState);
    expect(notices).toHaveLength(0);
  });
});

describe('헤더 날씨 배지 — 산성비 색상', () => {
  const css = readFileSync(resolve('css/layout.css'), 'utf8');

  it('산성비도 다른 위험 날씨처럼 색으로 구분된다', () => {
    // 색 규칙이 없으면 가장 위험한 날씨가 맑음과 같은 기본색으로 렌더된다
    expect(css).toContain('.bc-weather-badge[data-weather="acid_rain"]');
  });

  it('알림 대상 날씨는 모두 배지 색 규칙을 갖는다', () => {
    for (const id of ['hot', 'storm', 'monsoon', 'blizzard', 'snow', 'acid_rain']) {
      expect(css, `${id} 배지 색 규칙 누락`).toContain(`.bc-weather-badge[data-weather="${id}"]`);
    }
  });
});
