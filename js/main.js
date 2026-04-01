// === GAME ENTRY POINT ===
// Import order matters: core → data → systems → board → ui → screens → persistence

// Core
import EventBus        from './core/EventBus.js';
import GameState       from './core/GameState.js';
import TickEngine      from './core/TickEngine.js';
import StateMachine    from './core/StateMachine.js';
import SettingsManager from './core/SettingsManager.js';
import I18n            from './core/I18n.js';

// Data
import ITEMS      from './data/items.js';
import BLUEPRINTS from './data/blueprints.js';
import NODES, { DISTRICTS, SUB_LOCATIONS } from './data/nodes.js';
import ENEMIES    from './data/enemies.js';
import CHARACTERS from './data/characters.js';
import { registerSubLocationItems } from './data/landmarks.js';
import { SECRET_ENEMIES } from './data/secretEnemies.js';
import { HIDDEN_LOCATIONS } from './data/hiddenLocations.js';
import SECRET_EVENTS      from './data/secretEvents.js';
import HIDDEN_RECIPES     from './data/hiddenRecipes.js';

// Systems
import EndingSystem         from './systems/EndingSystem.js';
import StatSystem           from './systems/StatSystem.js';
import SeasonSystem         from './systems/SeasonSystem.js';
import DiseaseSystem        from './systems/DiseaseSystem.js';
import WeatherSystem        from './systems/WeatherSystem.js';
import EquipmentSystem      from './systems/EquipmentSystem.js';
import NoiseSystem          from './systems/NoiseSystem.js';
import ContaminationSystem  from './systems/ContaminationSystem.js';
import EncumbranceSystem    from './systems/EncumbranceSystem.js';
import CraftSystem          from './systems/CraftSystem.js';
import CombatSystem         from './systems/CombatSystem.js';
import ExploreSystem        from './systems/ExploreSystem.js';
import SkillSystem          from './systems/SkillSystem.js';
import BasecampSystem       from './systems/BasecampSystem.js';
import QuestSystem          from './systems/QuestSystem.js';
import SoundSystem          from './systems/SoundSystem.js';
import HiddenElementSystem  from './systems/HiddenElementSystem.js';
import BGMSystem            from './systems/BGMSystem.js';
import EcologySystem        from './systems/EcologySystem.js';
import MentalSystem         from './systems/MentalSystem.js';
import NPCSystem            from './systems/NPCSystem.js';
import BodySystem           from './systems/BodySystem.js';
import SubwaySystem         from './systems/SubwaySystem.js';
import NightSystem          from './systems/NightSystem.js';

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
import LandmarkModal       from './ui/LandmarkModal.js';
import SettingsModal       from './ui/SettingsModal.js';
import NPCDialogueModal   from './ui/NPCDialogueModal.js';
import SecretGalleryTab   from './ui/SecretGalleryTab.js';

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
// 히든 레시피를 BLUEPRINTS에 병합
const ALL_BLUEPRINTS = { ...BLUEPRINTS, ...HIDDEN_RECIPES };
// 비밀 적을 ENEMIES에 병합
const ALL_ENEMIES = { ...ENEMIES, ...SECRET_ENEMIES };

window.__GAME_DATA__ = {
  items: ITEMS,                // ITEMS already includes LEGENDARY_ITEMS via items.js
  blueprints: ALL_BLUEPRINTS,
  nodes: NODES,
  districts: DISTRICTS,
  subLocations: SUB_LOCATIONS,
  enemies: ALL_ENEMIES,
  characters: CHARACTERS,
  hiddenLocations: HIDDEN_LOCATIONS,
  secretEvents: SECRET_EVENTS,
  hiddenRecipes: HIDDEN_RECIPES,
};
registerSubLocationItems();

// HiddenElementSystem에서 StateMachine 접근용
window.__GAME_SYSTEMS__ = { StateMachine };

function init() {
  console.log('[Game] Initializing Ruined City...');

  // Settings & i18n (must init before other systems)
  SettingsManager.init();
  I18n.init();

  // Systems
  EndingSystem.init();
  StatSystem.init();
  SeasonSystem.init();
  DiseaseSystem.init();
  WeatherSystem.init();
  NoiseSystem.init();
  EcologySystem.init();
  window.__EcologySystem__ = EcologySystem;  // LandmarkModal·SeoulMapModal에서 참조
  NPCSystem.init();
  window.__NPCSystem__ = NPCSystem;         // CardFactory에서 참조 (MentalSystem보다 먼저 — companions 초기화)
  MentalSystem.init();
  window.__MentalSystem__ = MentalSystem;   // StatRenderer·CombatSystem에서 참조
  BodySystem.init();
  window.__BodySystem__ = BodySystem;  // EquipmentModal 신체 다이어그램에서 참조
  ContaminationSystem.init();
  EncumbranceSystem.init();
  CraftSystem.init();
  CombatSystem.init();
  ExploreSystem.init();
  SkillSystem.init();
  BasecampSystem.init();
  QuestSystem.init();
  SoundSystem.init();
  BGMSystem.init();
  HiddenElementSystem.init();
  SubwaySystem.init();
  NightSystem.init();
  window.__NightSystem__ = NightSystem;  // UI에서 야간 표시용

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

  // Settings modal
  SettingsModal.init();
  NPCDialogueModal.init();
  SecretGalleryTab.init();

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
