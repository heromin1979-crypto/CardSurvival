// === AUTO SAVE — 항상 자동 저장 전용 슬롯(AUTOSAVE_SLOT)에 기록 ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import SaveManager, { AUTOSAVE_SLOT } from './SaveManager.js';

// 저장이 무의미한 메뉴/연출 상태 — 이 상태에서는 자동 저장하지 않음
const MENU_STATES = ['main_menu', 'slot_select', 'char_create', 'ending', 'ending_gallery'];

const AutoSave = {
  _lastSaveTP: 0,
  _lastSaveAt: 0,
  SAVE_INTERVAL_TP: 10,
  TIMER_INTERVAL_MS: 60_000,
  THROTTLE_MS: 5_000,

  init() {
    // Auto-save on state transitions
    EventBus.on('stateTransition', ({ from, to }) => {
      const saveTriggers = ['main', 'explore', 'rest'];
      if (saveTriggers.includes(to)) this._trySave();
    });

    // Auto-save every N TP
    EventBus.on('tpAdvance', () => {
      const tp = Math.floor(GameState.time.totalTP);
      if (tp - this._lastSaveTP >= this.SAVE_INTERVAL_TP) this._trySave();
    });

    // Save on craft complete and combat end
    EventBus.on('craftComplete', () => this._trySave());
    EventBus.on('combatEnd',     ({ outcome }) => {
      if (outcome !== 'defeat') this._trySave();
    });

    // 시스템이 명시적으로 요청하는 저장 (Garden/Theft/Fishing 등)
    EventBus.on('saveGame', () => this._trySave());

    // 아이템 소비 · 스킬 레벨업 (KAN-12 추가 트리거)
    EventBus.on('itemConsumed', () => this._trySave());
    EventBus.on('skillLevelUp', () => this._trySave());

    // 이동 완료(구역·세부 장소) · 탐색 완료 (KAN-12)
    EventBus.on('districtChanged',  () => this._trySave());
    EventBus.on('locationChanged',  () => this._trySave());
    EventBus.on('locationExplored', () => this._trySave());

    // 실시간 타이머 기반 주기 저장 (KAN-12)
    setInterval(() => this._trySave(), this.TIMER_INTERVAL_MS);

    // 앱 백그라운드 전환 / 탭 종료 시 즉시 저장 (KAN-12, 모바일 대응)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this._trySave({ force: true });
    });
    window.addEventListener('pagehide', () => this._trySave({ force: true }));
  },

  // force: 스로틀 무시 (백그라운드 전환처럼 마지막 기회인 시점)
  _trySave({ force = false } = {}) {
    if (!GameState.player.isAlive) return;
    if (MENU_STATES.includes(GameState.ui.currentState)) return;

    const now = Date.now();
    if (!force && now - this._lastSaveAt < this.THROTTLE_MS) return;

    if (SaveManager.save(AUTOSAVE_SLOT, { silent: true })) {
      this._lastSaveAt = now;
      this._lastSaveTP = Math.floor(GameState.time.totalTP);
    }
  },
};

export default AutoSave;
