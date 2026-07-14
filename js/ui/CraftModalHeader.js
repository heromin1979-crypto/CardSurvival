import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import WeatherSystem from '../systems/WeatherSystem.js';

export function formatCraftModalTitle(
  time = GameState.time,
  temperature = WeatherSystem.getOutdoorTemperature(),
) {
  const day = time?.day ?? 1;
  const hour = time?.hour ?? 6;
  const minutes = ((time?.tpInDay ?? 0) % 3) * 20;
  return `Day ${day} | ${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} | ${temperature}C`;
}

export function refreshCraftModalTitle() {
  const title = document.querySelector('#craft-modal .modal-title');
  if (title) title.textContent = formatCraftModalTitle();
}

export function bindCraftModalTitleUpdates() {
  EventBus.off('tpAdvance', refreshCraftModalTitle);
  EventBus.on('tpAdvance', refreshCraftModalTitle);
}
