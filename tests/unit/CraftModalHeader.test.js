// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import WeatherSystem from '../../js/systems/WeatherSystem.js';
import Basecamp from '../../js/screens/Basecamp.js';
import Main from '../../js/screens/Main.js';

function setHeaderState() {
  GameState.time = {
    ...GameState.time,
    day: 4,
    hour: 16,
    tpInDay: 30,
  };
  GameState.season = { ...GameState.season, current: 'winter' };
  GameState.weather = {
    ...GameState.weather,
    id: 'snow',
    tempJitter: 2,
  };
}

function renderScreen(screen) {
  document.body.innerHTML = '<main id="screen-main"></main>';
  screen._el = document.getElementById('screen-main');
  screen._buildLayout();
  return document.querySelector('#craft-modal .modal-title')?.textContent;
}

describe('craft modal header', () => {
  beforeEach(() => {
    setHeaderState();
    document.body.innerHTML = '';
  });

  it('uses 20-minute TP intervals and the real outdoor temperature in both screens', () => {
    const expected = `4일차 | 16:00 | ${WeatherSystem.getOutdoorTemperature()}°C`;

    expect(renderScreen(Basecamp)).toBe(expected);
    expect(renderScreen(Main)).toBe(expected);
  });

  it('refreshes the open title on tpAdvance without duplicate subscriptions', () => {
    const originalListeners = EventBus._listeners;
    EventBus._listeners = { tpAdvance: [] };

    try {
      document.body.innerHTML = `
        <main id="screen-main"></main>
        <div id="craft-modal" class="open"><div class="modal-title">stale</div></div>`;

      Basecamp.init();
      Main.init();
      Basecamp.init();

      expect(EventBus._listeners.tpAdvance).toHaveLength(1);

      GameState.time.hour = 16;
      GameState.time.tpInDay = 31;
      EventBus.emit('tpAdvance', { totalTP: 31 });

      expect(document.querySelector('#craft-modal .modal-title')?.textContent)
        .toBe(`4일차 | 16:20 | ${WeatherSystem.getOutdoorTemperature()}°C`);
    } finally {
      EventBus._listeners = originalListeners;
    }
  });
});
