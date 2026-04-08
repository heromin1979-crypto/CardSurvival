// === GAME ENTRY POINT ===
// Import order matters: core → data → systems → board → ui → screens → persistence

// Mobile adapter (Capacitor — Electron/브라우저에서는 no-op)
import { initMobileAdapter } from './core/MobileAdapter.js';
// 캐릭터 DLC 구매 관리
import { initPurchaseManager } from './core/PurchaseManager.js';

// Core
import EventBus        from './core/EventBus.js';
import GameState       from './core/GameState.js';
import TickEngine      from './core/TickEngine.js';
import StateMachine    from './core/StateMachine.js';
import SettingsManager from './core/SettingsManager.js';
import I18n            from './core/I18n.js';
import SystemRegistry  from './core/SystemRegistry.js';

// Data
import { registerSubLocationItems } from './data/landmarks.js';

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
import NPCQuestSystem       from './systems/NPCQuestSystem.js';
import NPCRelationSystem    from './systems/NPCRelationSystem.js';
import NPCGroupSystem       from './systems/NPCGroupSystem.js';
import NPCStorySystem       from './systems/NPCStorySystem.js';
import OnboardingSystem     from './systems/OnboardingSystem.js';
import SecretCombinationSystem from './systems/SecretCombinationSystem.js';
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
import NPCPanel           from './ui/NPCPanel.js';
import SecretGalleryTab   from './ui/SecretGalleryTab.js';
import CinematicScene     from './ui/CinematicScene.js';

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
registerSubLocationItems();

// HiddenElementSystem에서 StateMachine 접근용 → SystemRegistry로 등록
SystemRegistry.register('StateMachine', StateMachine);

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
  SystemRegistry.register('EcologySystem', EcologySystem);
  NPCSystem.init();
  NPCRelationSystem.init();
  NPCGroupSystem.init();
  NPCStorySystem.init();
  SystemRegistry.register('NPCGroupSystem', NPCGroupSystem);
  SystemRegistry.register('NPCStorySystem', NPCStorySystem);
  OnboardingSystem.init();
  SystemRegistry.register('NPCSystem', NPCSystem);
  MentalSystem.init();
  BodySystem.init();
  SystemRegistry.register('BodySystem', BodySystem);
  ContaminationSystem.init();
  EncumbranceSystem.init();
  CraftSystem.init();
  CombatSystem.init();
  ExploreSystem.init();
  SkillSystem.init();
  BasecampSystem.init();
  QuestSystem.init();
  SystemRegistry.register('SecretCombinationSystem', SecretCombinationSystem);
  SoundSystem.init();
  BGMSystem.init();
  HiddenElementSystem.init();
  SubwaySystem.init();
  NightSystem.init();

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
  NPCPanel.init();
  NPCQuestSystem.init();
  SecretGalleryTab.init();
  CinematicScene.init();
  SystemRegistry.register('CinematicScene', CinematicScene);

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

  const _log = [];

  EventBus.on('notify', ({ message, type = 'info' }) => {
    // Record in log
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    _log.push({ message, type, time: timeStr });

    // Show toast
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    container.appendChild(el);

    // Auto-remove after 6.5s
    setTimeout(() => {
      el.addEventListener('animationend', () => el.remove(), { once: true });
      el.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 350);
    }, 6500);
  });

  // Log button
  const logBtn = document.createElement('button');
  logBtn.id = 'notif-log-btn';
  logBtn.className = 'notif-log-btn';
  logBtn.title = '알림 기록';
  logBtn.textContent = '📋';
  document.getElementById('notification-container').insertAdjacentElement('beforebegin', logBtn);

  // Log panel
  const panel = document.createElement('div');
  panel.id = 'notif-log-panel';
  panel.className = 'notif-log-panel';
  panel.innerHTML = `
    <div class="notif-log-header">
      <span class="notif-log-title">알림 기록</span>
      <button class="notif-log-close" id="notif-log-close">✕</button>
    </div>
    <div class="notif-log-list" id="notif-log-list"></div>
    <button class="notif-log-clear" id="notif-log-clear">기록 지우기</button>
  `;
  document.getElementById('app').appendChild(panel);

  logBtn.addEventListener('click', () => {
    const list = document.getElementById('notif-log-list');
    list.innerHTML = _log.length === 0
      ? '<div class="notif-log-empty">알림 기록이 없습니다.</div>'
      : [..._log].reverse().map(e =>
          `<div class="notif-log-entry ${e.type}">
            <span class="notif-log-time">${e.time}</span>
            <span class="notif-log-msg">${e.message}</span>
          </div>`
        ).join('');
    panel.classList.toggle('open');
  });

  document.getElementById('notif-log-close').addEventListener('click', () => {
    panel.classList.remove('open');
  });

  // 패널 외부 클릭 시 자동 닫기 (카드 상호작용 차단 방지)
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') &&
        !panel.contains(e.target) &&
        e.target !== logBtn) {
      panel.classList.remove('open');
    }
  }, true);

  document.getElementById('notif-log-clear').addEventListener('click', () => {
    _log.length = 0;
    document.getElementById('notif-log-list').innerHTML = '<div class="notif-log-empty">알림 기록이 없습니다.</div>';
  });

  // 캐릭터 대사 알림
  const CHAR_NAMES = {
    doctor:     '이지수',
    soldier:    '박민준',
    firefighter:'김영철',
    homeless:   '최형식',
    pharmacist: '오소희',
    engineer:   '김대한',
  };

  EventBus.on('charDialogue', ({ characterId, line }) => {
    const name = CHAR_NAMES[characterId] ?? characterId;
    const el = document.createElement('div');
    el.className = 'notification char-dialogue';
    el.innerHTML = `<span class="char-dialogue-name">${name}</span><span class="char-dialogue-line">${line}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.addEventListener('animationend', () => el.remove(), { once: true });
      el.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 350);
    }, 8000);
  });
}

// ── Viewport Scale (Steam/Electron 스타일 고정 해상도) ─────────────
// 설계 기준: 1920×1080. 모든 모니터에서 동일하게 보이도록 CSS scale 적용.
const DESIGN_W = 1920;
const DESIGN_H = 1080;

function _applyViewportScale() {
  const scaleX = window.innerWidth  / DESIGN_W;
  const scaleY = window.innerHeight / DESIGN_H;
  const scale  = Math.min(scaleX, scaleY);   // 비율 유지 (letterbox)

  const app = document.getElementById('app');
  if (!app) return;

  const offsetX = Math.floor((window.innerWidth  - DESIGN_W * scale) / 2);
  const offsetY = Math.floor((window.innerHeight - DESIGN_H * scale) / 2);

  app.style.width           = DESIGN_W + 'px';
  app.style.height          = DESIGN_H + 'px';
  app.style.position        = 'fixed';
  app.style.left            = offsetX + 'px';
  app.style.top             = offsetY + 'px';
  app.style.transformOrigin = '0 0';
  app.style.transform       = `scale(${scale})`;
}

window.addEventListener('resize', _applyViewportScale);

function _hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
}

function _showLoadingError(e) {
  console.error('[Game] Init failed:', e);
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  const text = overlay.querySelector('#loading-text');
  const btn  = overlay.querySelector('#loading-refresh-btn');
  const spinner = overlay.querySelector('#loading-spinner');
  if (text) text.textContent = '게임을 불러오지 못했습니다.';
  if (spinner) spinner.style.display = 'none';
  if (btn) btn.style.display = 'block';
}

// Run on DOM ready — 모바일은 deviceready 이후 init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    _applyViewportScale();
    try {
      await initMobileAdapter();
      await initPurchaseManager();
      init();
      _hideLoadingOverlay();
    } catch (e) {
      _showLoadingError(e);
    }
  });
} else {
  _applyViewportScale();
  (async () => {
    try {
      await initMobileAdapter();
      await initPurchaseManager();
      init();
      _hideLoadingOverlay();
    } catch (e) {
      _showLoadingError(e);
    }
  })();
}
