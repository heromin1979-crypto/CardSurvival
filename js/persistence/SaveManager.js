// === SAVE MANAGER ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';

const SAVE_KEY   = 'CARD_SURVIVAL_SAVE_v1_slot';
const META_KEY   = 'CARD_SURVIVAL_SAVE_v1_slot';

const SaveManager = {
  save(slot = 0) {
    try {
      const json = GameState.serialize();
      localStorage.setItem(`${SAVE_KEY}${slot}`, json);

      // Save meta
      const meta = {
        day:         GameState.time.day,
        hour:        GameState.time.hour,
        totalTP:     Math.floor(GameState.time.totalTP),
        playerName:  GameState.player.name,
        characterId: GameState.player.characterId,
        district:    GameState.location?.currentDistrict ?? null,
        isDead:      !GameState.player.isAlive,
        savedAt:     new Date().toISOString(),
      };
      localStorage.setItem(`${META_KEY}${slot}_meta`, JSON.stringify(meta));

      EventBus.emit('saved', { slot });
      EventBus.emit('notify', { message: I18n.t('save.saved', { day: meta.day }), type: 'good' });
      return true;
    } catch (e) {
      console.error('[SaveManager] Save failed:', e);
      EventBus.emit('notify', { message: I18n.t('save.saveFailed'), type: 'danger' });
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

  deleteSave(slot = 0) {
    localStorage.removeItem(`${SAVE_KEY}${slot}`);
    localStorage.removeItem(`${META_KEY}${slot}_meta`);
    EventBus.emit('notify', { message: I18n.t('save.deleted'), type: 'warn' });
  },
};

export default SaveManager;
