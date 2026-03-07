// === SAVE MANAGER ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const SAVE_KEY   = 'CARD_SURVIVAL_SAVE_v1_slot';
const META_KEY   = 'CARD_SURVIVAL_SAVE_v1_slot';

const SaveManager = {
  save(slot = 0) {
    try {
      const json = GameState.serialize();
      localStorage.setItem(`${SAVE_KEY}${slot}`, json);

      // Save meta
      const meta = {
        day:        GameState.time.day,
        totalTP:    Math.floor(GameState.time.totalTP),
        playerName: GameState.player.name,
        isDead:     !GameState.player.isAlive,
        savedAt:    new Date().toISOString(),
      };
      localStorage.setItem(`${META_KEY}${slot}_meta`, JSON.stringify(meta));

      EventBus.emit('saved', { slot });
      EventBus.emit('notify', { message: `💾 저장 완료 — Day ${meta.day}`, type: 'good' });
      return true;
    } catch (e) {
      console.error('[SaveManager] Save failed:', e);
      EventBus.emit('notify', { message: '저장 실패.', type: 'danger' });
      return false;
    }
  },

  load(slot = 0) {
    try {
      const json = localStorage.getItem(`${SAVE_KEY}${slot}`);
      if (!json) return false;

      GameState.deserialize(json);
      EventBus.emit('loaded', { slot });
      EventBus.emit('notify', { message: '불러오기 완료.', type: 'good' });
      return true;
    } catch (e) {
      console.error('[SaveManager] Load failed:', e);
      EventBus.emit('notify', { message: '불러오기 실패.', type: 'danger' });
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

  deleteSave(slot = 0) {
    localStorage.removeItem(`${SAVE_KEY}${slot}`);
    localStorage.removeItem(`${META_KEY}${slot}_meta`);
    EventBus.emit('notify', { message: '저장 파일 삭제됨.', type: 'warn' });
  },
};

export default SaveManager;
