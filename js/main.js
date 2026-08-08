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
import GameData from './data/GameData.js';
import { registerSubLocationItems } from './data/landmarks.js';
import { instantiateEnemy } from './data/enemies.js';
import NPCS from './data/npcs.js';

// Systems
import EndingSystem         from './systems/EndingSystem.js';
import StatSystem           from './systems/StatSystem.js';
import StructureEffectSystem from './systems/StructureEffectSystem.js';
import TelemetrySystem      from './systems/TelemetrySystem.js';
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
import TrapSystem           from './systems/TrapSystem.js';
import HeaderBar            from './ui/HeaderBar.js';
import BGMSystem            from './systems/BGMSystem.js';
import EcologySystem        from './systems/EcologySystem.js';
import MentalSystem         from './systems/MentalSystem.js';
import NPCSystem            from './systems/NPCSystem.js';
import PatientIntakeSystem  from './systems/PatientIntakeSystem.js';
import DispatchSystem       from './systems/DispatchSystem.js';
import GuardSystem          from './systems/GuardSystem.js';
import HospitalSiegeSystem  from './systems/HospitalSiegeSystem.js';
import NPCQuestSystem       from './systems/NPCQuestSystem.js';
import NPCRelationSystem    from './systems/NPCRelationSystem.js';
import NPCGroupSystem       from './systems/NPCGroupSystem.js';
import NPCStorySystem       from './systems/NPCStorySystem.js';
import OnboardingSystem     from './systems/OnboardingSystem.js';
import SecretCombinationSystem from './systems/SecretCombinationSystem.js';
import BodySystem           from './systems/BodySystem.js';
import SubwaySystem         from './systems/SubwaySystem.js';
import NightSystem          from './systems/NightSystem.js';
import FishingSystem        from './systems/FishingSystem.js';
import GardenSystem         from './systems/GardenSystem.js';
import TheftSystem          from './systems/TheftSystem.js';

// Board
import BoardManager from './board/BoardManager.js';
import DragDrop     from './board/DragDrop.js';
import TouchDrag    from './board/TouchDrag.js';
import SlotResolver from './board/SlotResolver.js';
import KeyboardNav  from './board/KeyboardNav.js';

// UI
import Renderer      from './ui/Renderer.js';
import BoardRenderer from './ui/BoardRenderer.js';
import StatRenderer  from './ui/StatRenderer.js';
import ModalManager  from './ui/ModalManager.js';
import CraftUI       from './ui/CraftUI.js';
import CombatUI      from './ui/CombatUI.js';
import { loadCombatMotionLibrary } from './ui/combat/motionLibraryLoader.js';
import ExploreUI     from './ui/ExploreUI.js';
import CardFactory      from './ui/CardFactory.js';
import CardContextMenu  from './ui/CardContextMenu.js';
import SeoulMapModal    from './ui/SeoulMapModal.js';
import EquipmentModal   from './ui/EquipmentModal.js';
import LandmarkModal       from './ui/LandmarkModal.js';
import PatientBoardBridge  from './ui/PatientBoardBridge.js';
import SettingsModal       from './ui/SettingsModal.js';
import NPCDialogueModal   from './ui/NPCDialogueModal.js';
import SecretGalleryTab   from './ui/SecretGalleryTab.js';
import CinematicScene     from './ui/CinematicScene.js';

// Screens
import MainMenu     from './screens/MainMenu.js';
import SlotSelect   from './screens/SlotSelect.js';
import CharCreate   from './screens/CharCreate.js';
import Basecamp     from './screens/Main.js';
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
registerSubLocationItems(GameData.items);

// HiddenElementSystem에서 StateMachine 접근용 → SystemRegistry로 등록
SystemRegistry.register('StateMachine', StateMachine);

function init() {
  console.log('[Game] Initializing Ruined City...');

  // Settings & i18n (must init before other systems)
  SettingsManager.init();
  I18n.init();

  // Systems
  EndingSystem.init();
  StructureEffectSystem.init();  // StatSystem·DiseaseSystem이 집계값을 읽으므로 먼저
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
  DispatchSystem.init();
  GuardSystem.init();
  SystemRegistry.register('DispatchSystem', DispatchSystem);
  SystemRegistry.register('GuardSystem', GuardSystem);
  PatientIntakeSystem.init();
  SystemRegistry.register('PatientIntakeSystem', PatientIntakeSystem);
  PatientBoardBridge.init();
  // HospitalSiegeSystem은 GuardSystem + PatientIntakeSystem 이후에 init
  // (siegeResolved 구독 순서 보장 + patientDied 연쇄)
  HospitalSiegeSystem.init();
  SystemRegistry.register('HospitalSiegeSystem', HospitalSiegeSystem);
  MentalSystem.init();
  BodySystem.init();
  SystemRegistry.register('BodySystem', BodySystem);
  ContaminationSystem.init();
  EncumbranceSystem.init();
  CraftSystem.init();
  CombatSystem.init();
  FishingSystem.init();
  GardenSystem.init();
  TheftSystem.init();
  ExploreSystem.init();
  SkillSystem.init();
  BasecampSystem.init();
  QuestSystem.init();
  SystemRegistry.register('SecretCombinationSystem', SecretCombinationSystem);
  SoundSystem.init();
  BGMSystem.init();
  HiddenElementSystem.init();
  TrapSystem.init();
  SystemRegistry.register('TrapSystem', TrapSystem);

  // 트랙 C — 거대 헤더 (Day | Time | Temp)
  HeaderBar.init();
  SubwaySystem.init();
  NightSystem.init();

  // Board
  BoardManager.init();
  DragDrop.init();
  TouchDrag.init();
  KeyboardNav.init();

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
  NPCQuestSystem.init();
  SecretGalleryTab.init();
  CinematicScene.init();
  SystemRegistry.register('CinematicScene', CinematicScene);

  // Screens
  MainMenu.init();
  SlotSelect.init();
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
  TelemetrySystem.init();

  // Notification system
  _initNotifications();

  // 이슈 #7 — 사망 위험 중앙 경고 (스탯 임계 + HP 20% 미만)
  _initCriticalWarning();

  // UI 인스펙터로 저장한 레이아웃 오버라이드는 항상 적용 (일반 플레이에도 반영)
  // 인스펙터 UI(단축키/패널) 자체는 ?debug=1 에서만 활성화된다.
  const _isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
  import('./ui/UIInspector.js').then(m => {
    _isDebug ? m.default.init() : m.default.applyStored();
  });

  // Debug panel (?debug=1 일 때만 활성화)
  if (_isDebug) {
    import('./ui/DebugPanel.js').then(m => m.default.init());
  }

  // 전투 시뮬레이터 툴 훅 (?tool=combat 일 때만 핸들 노출 — 일반 플레이엔 영향 없음)
  // tools/combat/ 부모 페이지가 iframe.contentWindow.__combatTool 로 전투를 셋업·조종한다.
  if (new URLSearchParams(window.location.search).get('tool') === 'combat') {
    window.__combatTool = {
      GameState, EventBus, StateMachine, CombatSystem, EquipmentSystem, NPCSystem,
      CharCreate, GameData, NPCS, instantiateEnemy,
    };
    window.__combatToolReady = true;
    EventBus.emit('__combatToolReady');
  }

  // Start on main menu
  Renderer.activateScreen('main_menu');

  // Start tick engine
  TickEngine.start();

  console.log('[Game] Ready.');
}

// 알림/로그 시스템 (CSS PATCH v2 마크업 사용)
// legacy `notify` 이벤트 — { message, type } — 그대로 수신하고
// type을 새 data-type으로 매핑한다. 기존 호출부 변경 없음.
function _initNotifications() {
  const container = document.getElementById('notification-container');
  const logEl     = document.getElementById('message-log');
  if (!container || !logEl) return;

  const CHAR_NAMES = {
    doctor:      '이지수',
    soldier:     '강민준',
    firefighter: '박영철',
    homeless:    '최형식',
    chef:        '윤재혁',
    engineer:    '정대한',
  };

  const TYPE_MAP = {
    info:    { notif: 'location',       log: 'system', icon: '📍', label: '정보',      speaker: '시스템', coalesce: true  },
    good:    { notif: 'quest-complete', log: 'quest',  icon: '✅', label: '성공',      speaker: '퀘스트', coalesce: true  },
    success: { notif: 'quest-complete', log: 'quest',  icon: '✅', label: '성공',      speaker: '퀘스트', coalesce: true  },
    SUCCESS: { notif: 'quest-complete', log: 'quest',  icon: '✅', label: '성공',      speaker: '퀘스트', coalesce: true  },
    warn:    { notif: 'status',         log: 'status', icon: '⚠️', label: '주의',      speaker: '상태',   coalesce: true  },
    warning: { notif: 'status',         log: 'status', icon: '⚠️', label: '주의',      speaker: '상태',   coalesce: true  },
    danger:  { notif: 'danger',         log: 'danger', icon: '🛑', label: '위험',      speaker: '경고',   coalesce: false },
    error:   { notif: 'danger',         log: 'danger', icon: '🛑', label: '오류',      speaker: '오류',   coalesce: false },
    ERROR:   { notif: 'danger',         log: 'danger', icon: '🛑', label: '오류',      speaker: '오류',   coalesce: false },
    npc_quest_complete: { notif: 'quest-complete', log: 'quest', icon: '✨', label: '퀘스트 완료', speaker: '퀘스트', coalesce: false },
  };

  // 토스트 묶음 — 동일 카테고리 메시지가 짧은 시간 안에 여러 번 들어오면 한 카드로 묶고 ×N 카운트 표시.
  // 알려진 패턴은 사전 정의된 키로 보내 요약 라벨을 더 사람 같은 문장으로 만들고, 그 외는 정규화한 24자 해시.
  const SIGNATURE_PATTERNS = [
    { key: 'skill-levelup',   label: '스킬 레벨업', re: /^📊\s/ },
    { key: 'tp-skip',         label: 'TP 소모',     re: /^⏩\s.*TP/ },
    { key: 'tp-remaining',    label: '남은 행동력', re: /^⏳\s|^🌙\s/ },
    { key: 'item-pending',    label: '대기 아이템', re: /^📦\s/ },
    { key: 'wound-heal',      label: '부상 치료',   re: /^🩹\s/ },
    { key: 'quality-result',  label: '품질 결과',   re: /품질 —|품질—/ },
    { key: 'dismantle',       label: '분해 완료',   re: /분해 완료/ },
    { key: 'season-change',   label: '계절 변화',   re: /^[☀❄🍂🌸]/ },
    { key: 'recipe-unlock',   label: '레시피 해금', re: /레시피.*해금|해금.*레시피/ },
  ];

  const _signatureOf = (message) => {
    const str = String(message ?? '');
    for (const p of SIGNATURE_PATTERNS) {
      if (p.re.test(str)) return { key: p.key, label: p.label };
    }
    const norm = str.replace(/\s+/g, '').replace(/[\d]+/g, '#').slice(0, 24);
    return { key: `h:${norm}`, label: null };
  };

  const MAX_LOG          = 200;
  const TOAST_LIFE       = 6800;
  const MAX_TOAST_VISIBLE = 4;
  const _log             = [];
  const _groupCards      = new Map();
  let   logFilter        = 'all';
  let   isLogOpen        = false;
  let   unreadCount      = 0;
  let   _overflowLine    = null;

  const _esc = (s) => String(s).replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const _mapping = (type) => TYPE_MAP[type] ?? TYPE_MAP.info;

  const _pad = (n) => String(n).padStart(2, '0');

  const _splitTime = (ts) => {
    const d = new Date(ts);
    const h = d.getHours();
    const period = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { period, clock: `${_pad(h12)}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())}` };
  };

  const _relTime = (ts) => {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return '방금';
    if (min < 60) return `${min}분 전`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  };

  // tag 칩: 위험/주의/퀘스트만 노출
  const _tagFor = (entry) => {
    const m = _mapping(entry.type);
    if (m.notif === 'danger')         return { tag: 'danger', label: '위험' };
    if (m.notif === 'status')         return { tag: 'status', label: '주의' };
    if (m.notif === 'quest-complete' && !entry.speakerName)
                                      return { tag: 'quest',  label: '퀘스트' };
    return null;
  };

  // 로그 entry 좌측 카테고리 라벨 (필터 칩과 동일 어휘)
  const CATEGORY_LABEL = {
    dialogue: '대사',
    quest:    '퀘스트',
    system:   '시스템',
    status:   '상태',
    danger:   '위험',
    combat:   '전투',
  };

  // ── 로그 버튼 (📋) ────────────────────────────────────
  const logBtn = document.createElement('button');
  logBtn.id = 'notif-log-btn';
  logBtn.className = 'notif-log-btn';
  logBtn.title = '메시지 로그';
  logBtn.type = 'button';
  logBtn.textContent = '📋';
  document.body.appendChild(logBtn);

  const _renderBtnBadge = () => {
    if (unreadCount > 0 && !isLogOpen) {
      logBtn.textContent = `📋 ${unreadCount > 99 ? '99+' : unreadCount}`;
      logBtn.classList.add('has-unread');
    } else {
      logBtn.textContent = '📋';
      logBtn.classList.remove('has-unread');
    }
  };

  // ── 로그 본문 렌더 ────────────────────────────────────
  const logBody = logEl.querySelector('.log-body');

  const _renderLog = () => {
    const items = (logFilter === 'all')
      ? _log
      : _log.filter(e => {
          if (logFilter === 'dialogue') return !!e.speakerName;
          return _mapping(e.type).log === logFilter;
        });

    if (items.length === 0) {
      logBody.innerHTML = `<div class="log-time-header">기록 없음</div>`;
      return;
    }

    logBody.innerHTML = [...items].reverse().map(e => {
      const m        = _mapping(e.type);
      const dataType = e.speakerName ? 'dialogue' : m.log;
      const speaker  = e.speakerName ?? m.speaker;
      const icon     = e.speakerName ? '💬' : m.icon;
      const category = CATEGORY_LABEL[dataType] ?? '기타';
      // 대사 외 카테고리는 speaker가 좌측 카테고리 라벨과 동일 — 중복 헤더 생략
      const speakerHtml = e.speakerName
        ? `<div class="log-entry-speaker">
            <span class="log-entry-speaker-icon">${icon}</span>${_esc(speaker)}
          </div>`
        : '';
      return `<div class="log-entry" data-type="${dataType}" role="listitem">
        <div class="log-entry-category">${category}</div>
        <div class="log-entry-content">
          ${speakerHtml}
          <div class="log-entry-message">${_esc(e.message)}</div>
        </div>
      </div>`;
    }).join('');
  };

  // ── 토스트(자동소멸 카드) — 시안 v2: 아이콘 / 제목+카운트+상대시간 / 본문 / 태그 ─
  const _toast = (entry, groupKey) => {
    const m = _mapping(entry.type);
    const card = document.createElement('div');
    card.className = 'notif-card is-ephemeral';
    card.dataset.type = entry.speakerName ? 'quest-active' : m.notif;
    card.dataset.count = '1';
    if (groupKey) card.dataset.groupKey = groupKey;

    const icon  = entry.speakerName ? '💬' : m.icon;
    const title = entry.speakerName ?? m.label;
    const tag   = _tagFor(entry);

    card.innerHTML = `
      <div class="notif-card-icon">${icon}</div>
      <div class="notif-card-main">
        <div class="notif-card-header">
          <span class="notif-card-title">${_esc(title)}</span>
          <span class="notif-card-count" data-show="false">×1</span>
          <span class="notif-card-time">${_relTime(entry.ts)}</span>
        </div>
        <div class="notif-card-body">${_esc(entry.message)}</div>
      </div>
      ${tag ? `<span class="notif-card-tag" data-tag="${tag.tag}">${tag.label}</span>` : ''}
    `;
    container.insertBefore(card, _overflowLine ?? null);

    const timer = setTimeout(() => {
      card.remove();
      if (card.dataset.groupKey) _groupCards.delete(card.dataset.groupKey);
      _enforceMaxToasts();
    }, TOAST_LIFE);
    card.dataset.timer = String(timer);

    _enforceMaxToasts();
    return card;
  };

  const _summaryBody = (count, sig, lastMessage) => {
    if (sig.label) return `${sig.label} ×${count}`;
    return `최근 ${count}건 — ${lastMessage}`;
  };

  const _updateCardCount = (card, entry, sig) => {
    const count = Number(card.dataset.count || 1) + 1;
    card.dataset.count = String(count);

    const countEl = card.querySelector('.notif-card-count');
    if (countEl) {
      countEl.textContent = `×${count}`;
      countEl.dataset.show = 'true';
    }

    const bodyEl = card.querySelector('.notif-card-body');
    if (bodyEl) bodyEl.textContent = _summaryBody(count, sig, entry.message);

    const timeEl = card.querySelector('.notif-card-time');
    if (timeEl) timeEl.textContent = _relTime(Date.now());

    const oldTimer = Number(card.dataset.timer || 0);
    if (oldTimer) clearTimeout(oldTimer);
    const timer = setTimeout(() => {
      card.remove();
      if (card.dataset.groupKey) _groupCards.delete(card.dataset.groupKey);
      _enforceMaxToasts();
    }, TOAST_LIFE);
    card.dataset.timer = String(timer);

    card.classList.remove('is-pulse');
    void card.offsetWidth;
    card.classList.add('is-pulse');
  };

  // 토스트 4장 초과 시 가장 오래된 카드를 잘라내고 컨테이너 끝에 `+N개 더 — 로그에서 보기` 슬림 라인을 갱신.
  const _enforceMaxToasts = () => {
    const cards = Array.from(container.querySelectorAll('.notif-card'));
    while (cards.length > MAX_TOAST_VISIBLE) {
      const oldest = cards.shift();
      if (!oldest) break;
      const t = Number(oldest.dataset.timer || 0);
      if (t) clearTimeout(t);
      if (oldest.dataset.groupKey) _groupCards.delete(oldest.dataset.groupKey);
      oldest.remove();
    }

    const overflow = !isLogOpen ? Math.max(0, unreadCount - MAX_TOAST_VISIBLE) : 0;
    if (overflow > 0) {
      if (!_overflowLine) {
        _overflowLine = document.createElement('div');
        _overflowLine.className = 'notif-overflow-line';
        _overflowLine.setAttribute('role', 'button');
        _overflowLine.setAttribute('tabindex', '0');
        _overflowLine.addEventListener('click', () => { _openLog(); });
        container.appendChild(_overflowLine);
      }
      _overflowLine.textContent = `+${overflow}개 더 — 로그에서 보기`;
    } else if (_overflowLine) {
      _overflowLine.remove();
      _overflowLine = null;
    }
  };

  const _coalesceToast = (entry) => {
    const m = _mapping(entry.type);
    if (m.coalesce === false || entry.speakerName) {
      _toast(entry);
      return;
    }
    const sig = _signatureOf(entry.message);
    const groupKey = `${entry.type}|${sig.key}`;
    const existing = _groupCards.get(groupKey);
    if (existing && existing.isConnected) {
      _updateCardCount(existing, entry, sig);
      return;
    }
    const card = _toast(entry, groupKey);
    _groupCards.set(groupKey, card);
  };

  // ── 기록 + 토스트 ─────────────────────────────────────
  const _record = (entry) => {
    if (!entry.ts) entry.ts = Date.now();
    _log.push(entry);
    if (_log.length > MAX_LOG) _log.shift();

    if (isLogOpen) {
      _renderLog();
    } else {
      unreadCount += 1;
      _renderBtnBadge();
    }
    _coalesceToast(entry);
  };

  // ── 로그 열기/닫기 ────────────────────────────────────
  const _openLog = () => {
    isLogOpen = true;
    unreadCount = 0;
    logEl.classList.remove('hidden');
    document.body.classList.add('is-log-open');
    _renderLog();
    _renderBtnBadge();
    if (_overflowLine) {
      _overflowLine.remove();
      _overflowLine = null;
    }
  };

  const _closeLog = () => {
    isLogOpen = false;
    logEl.classList.add('hidden');
    document.body.classList.remove('is-log-open');
    _renderBtnBadge();
  };

  logBtn.addEventListener('click', () => (isLogOpen ? _closeLog() : _openLog()));
  logEl.querySelector('.log-close-btn').addEventListener('click', _closeLog);

  // ── 필터 칩 ───────────────────────────────────────────
  const chips = Array.from(logEl.querySelectorAll('.log-filter-chip'));
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.toggle('is-active', c === chip));
      logFilter = chip.dataset.filter;
      if (logFilter === 'all') logBody.removeAttribute('data-filter');
      else logBody.dataset.filter = logFilter;
      _renderLog();
    });
  });

  // ── 이벤트 구독 ──────────────────────────────────────
  EventBus.on('notify', ({ message, type = 'info' }) => {
    _record({ message, type, ts: Date.now() });
  });

  EventBus.on('charDialogue', ({ characterId, line }) => {
    const speakerName = CHAR_NAMES[characterId] ?? characterId;
    _record({ message: line, type: 'info', ts: Date.now(), characterId, speakerName });
  });
}

// ── 이슈 #7 · 사망 위험 중앙 경고 배너 ─────────────
// 스탯 임계 도달 (statCritical) 또는 HP < 20% 시 큰 배너 알림.
// 3.5초 후 자동 사라짐. 동일 원인 중복 트리거 4초 쿨다운.
const CRITICAL_MSG = {
  hydration: { icon: '💧', text: '수분 고갈 임박! 물을 마셔라.' },
  nutrition: { icon: '🍖', text: '영양실조 임박! 음식이 필요하다.' },
  radiation: { icon: '☢',  text: '방사선 과다 피폭! 차폐 구역으로 대피하라.' },
  infection: { icon: '🦠', text: '감염 수치 위험! 항생제를 써라.' },
  fatigue:   { icon: '😵', text: '피로 누적 임계! 곧 쓰러진다.' },
  hp_low:    { icon: '❤️', text: 'HP 위험! 치료하지 않으면 사망한다.' },
};

function _initCriticalWarning() {
  const banner = document.getElementById('critical-warning-banner');
  if (!banner) return;
  const lastShown = {};          // { [key]: timestamp }
  const COOLDOWN_MS = 4000;

  const show = (key) => {
    const msg = CRITICAL_MSG[key];
    if (!msg) return;
    const now = Date.now();
    if (lastShown[key] && now - lastShown[key] < COOLDOWN_MS) return;
    lastShown[key] = now;

    banner.innerHTML = `
      <div class="crit-warn-icon">${msg.icon}</div>
      <div class="crit-warn-text">${msg.text}</div>`;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 3500);
  };

  EventBus.on('statCritical', ({ stat }) => { if (stat) show(stat); });
  EventBus.on('playerHit', () => {
    const p = GameState.player;
    const pct = (p?.hp?.current ?? 0) / (p?.hp?.max ?? 1);
    if (pct > 0 && pct < 0.20) show('hp_low');
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
      await loadCombatMotionLibrary();
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
      await loadCombatMotionLibrary();
      init();
      _hideLoadingOverlay();
    } catch (e) {
      _showLoadingError(e);
    }
  })();
}
