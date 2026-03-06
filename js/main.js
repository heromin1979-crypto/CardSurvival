// === GAME ENTRY POINT ===
// Import order matters: core → data → systems → board → ui → screens → persistence

// Core
import EventBus   from './core/EventBus.js';
import GameState  from './core/GameState.js';
import TickEngine from './core/TickEngine.js';
import StateMachine from './core/StateMachine.js';

// Data
import ITEMS      from './data/items.js';
import BLUEPRINTS from './data/blueprints.js';
import NODES, { DISTRICTS, SUB_LOCATIONS } from './data/nodes.js';
import ENEMIES    from './data/enemies.js';
import CHARACTERS from './data/characters.js';

// Systems
import EndingSystem         from './systems/EndingSystem.js';
import StatSystem           from './systems/StatSystem.js';
import EquipmentSystem      from './systems/EquipmentSystem.js';
import NoiseSystem          from './systems/NoiseSystem.js';
import ContaminationSystem  from './systems/ContaminationSystem.js';
import EncumbranceSystem    from './systems/EncumbranceSystem.js';
import CraftSystem          from './systems/CraftSystem.js';
import CombatSystem         from './systems/CombatSystem.js';
import ExploreSystem        from './systems/ExploreSystem.js';

// Board
import BoardManager from './board/BoardManager.js';
import DragDrop     from './board/DragDrop.js';
import TouchDrag    from './board/TouchDrag.js';
import SlotResolver from './board/SlotResolver.js';

// UI
import Renderer      from './ui/Renderer.js';
import BoardRenderer from './ui/BoardRenderer.js';
import StatRenderer  from './ui/StatRenderer.js';
import ModalManager  from './ui/ModalManager.js';
import CraftUI       from './ui/CraftUI.js';
import CombatUI      from './ui/CombatUI.js';
import ExploreUI     from './ui/ExploreUI.js';
import CardFactory      from './ui/CardFactory.js';
import CardContextMenu  from './ui/CardContextMenu.js';
import SeoulMapModal    from './ui/SeoulMapModal.js';
import EquipmentModal   from './ui/EquipmentModal.js';

// Screens
import MainMenu     from './screens/MainMenu.js';
import CharCreate   from './screens/CharCreate.js';
import Basecamp     from './screens/Basecamp.js';
import Explore      from './screens/Explore.js';
import Encounter    from './screens/Encounter.js';
import Combat       from './screens/Combat.js';
import CombatResult from './screens/CombatResult.js';
import Rest         from './screens/Rest.js';
import GameOver     from './screens/GameOver.js';
import Pause        from './screens/Pause.js';
import Ending        from './screens/Ending.js';
import EndingGallery from './screens/EndingGallery.js';

// Persistence
import SaveManager from './persistence/SaveManager.js';
import AutoSave    from './persistence/AutoSave.js';

// ── Bootstrap ────────────────────────────────────────────
window.__GAME_DATA__ = { items: ITEMS, blueprints: BLUEPRINTS, nodes: NODES, districts: DISTRICTS, subLocations: SUB_LOCATIONS, enemies: ENEMIES, characters: CHARACTERS };

function init() {
  console.log('[Game] Initializing Ruined City...');

  // Systems
  EndingSystem.init();
  StatSystem.init();
  NoiseSystem.init();
  ContaminationSystem.init();
  EncumbranceSystem.init();
  CraftSystem.init();
  CombatSystem.init();
  ExploreSystem.init();

  // Board
  BoardManager.init();
  DragDrop.init();
  TouchDrag.init();

  // UI
  Renderer.init();
  BoardRenderer.init();
  StatRenderer.init();
  ModalManager.init();
  CardContextMenu.init();
  SeoulMapModal.init();

  // Screens
  MainMenu.init();
  CharCreate.init();
  Basecamp.init();
  Explore.init();
  Encounter.init();
  Combat.init();
  CombatResult.init();
  Rest.init();
  GameOver.init();
  Pause.init();
  Ending.init();
  EndingGallery.init();

  // Persistence
  AutoSave.init();

  // Notification system
  _initNotifications();

  // Start on main menu
  Renderer.activateScreen('main_menu');

  // Start tick engine
  TickEngine.start();

  console.log('[Game] Ready.');
}

function _initNotifications() {
  const container = document.getElementById('notification-container');
  if (!container) return;

  EventBus.on('notify', ({ message, type = 'info' }) => {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    container.appendChild(el);

    // Auto-remove after 3s
    setTimeout(() => {
      el.addEventListener('animationend', () => el.remove(), { once: true });
      el.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 350);
    }, 2800);
  });
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
