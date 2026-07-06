// === SAVE MANAGER ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';

const SAVE_KEY   = 'CARD_SURVIVAL_SAVE_v1_slot';
const META_KEY   = 'CARD_SURVIVAL_SAVE_v1_slot';

// 슬롯 0~4: 수동 저장, 슬롯 5(마지막): 자동 저장 전용
export const MANUAL_SLOT_COUNT = 5;
export const AUTOSAVE_SLOT     = 5;

const SaveManager = {
  // silent: 알림 토스트 생략 (자동 저장용)
  save(slot = 0, { silent = false } = {}) {
    try {
      const json = GameState.serialize();
      localStorage.setItem(`${SAVE_KEY}${slot}`, json);

      // Save meta — originSlot: 자동 저장본이 어느 수동 슬롯의 런인지 (불러오기 시 복원)
      const meta = {
        day:         GameState.time.day,
        hour:        GameState.time.hour,
        totalTP:     Math.floor(GameState.time.totalTP),
        playerName:  GameState.player.name,
        characterId: GameState.player.characterId,
        district:    GameState.location?.currentDistrict ?? null,
        isDead:      !GameState.player.isAlive,
        originSlot:  GameState.ui.saveSlot ?? 0,
        savedAt:     new Date().toISOString(),
      };
      localStorage.setItem(`${META_KEY}${slot}_meta`, JSON.stringify(meta));

      EventBus.emit('saved', { slot });
      if (!silent) {
        EventBus.emit('notify', { message: I18n.t('save.saved', { day: meta.day }), type: 'good' });
      }
      return true;
    } catch (e) {
      console.error('[SaveManager] Save failed:', e);
      if (!silent) {
        EventBus.emit('notify', { message: I18n.t('save.saveFailed'), type: 'danger' });
      }
      return false;
    }
  },

  load(slot = 0) {
    try {
      const json = localStorage.getItem(`${SAVE_KEY}${slot}`);
      if (!json) return false;

      GameState.deserialize(json);
      EventBus.emit('loaded', { slot });
      EventBus.emit('notify', { message: I18n.t('save.loaded'), type: 'good' });
      return true;
    } catch (e) {
      console.error('[SaveManager] Load failed:', e);
      EventBus.emit('notify', { message: I18n.t('save.loadFailed'), type: 'danger' });
      return false;
    }
  },

  hasSave(slot = 0) {
    return !!localStorage.getItem(`${SAVE_KEY}${slot}`);
  },

  getMeta(slot = 0) {
    try {
      const raw = localStorage.getItem(`${META_KEY}${slot}_meta`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  deleteSave(slot = 0, { silent = false } = {}) {
    localStorage.removeItem(`${SAVE_KEY}${slot}`);
    localStorage.removeItem(`${META_KEY}${slot}_meta`);
    if (!silent) EventBus.emit('notify', { message: I18n.t('save.deleted'), type: 'warn' });
  },
};

export default SaveManager;
