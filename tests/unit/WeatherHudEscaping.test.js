// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import WeatherSystem from '../../js/systems/WeatherSystem.js';

describe('WeatherSystem HUD rendering', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a saved weather name as text instead of markup', () => {
    document.body.innerHTML = '<div id="weather-display"></div>';

    WeatherSystem._updateWeatherHUD({
      id: 'saved-weather',
      name: '<img src=x onerror=alert(1)>',
    });

    const hud = document.getElementById('weather-display');
    expect(hud.querySelector('.ui-icon--weather')).not.toBeNull();
    expect(hud.querySelector('img')).toBeNull();
    expect(hud.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
