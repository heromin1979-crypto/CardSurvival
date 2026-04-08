// === AUTO SAVE ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import SaveManager from './SaveManager.js';

const AutoSave = {
  _lastSaveTP: 0,
  SAVE_INTERVAL_TP: 10,

  init() {
    // Auto-save on state transitions
    EventBus.on('stateTransition', ({ from, to }) => {
      const saveTriggers = ['basecamp', 'explore', 'rest'];
      if (saveTriggers.includes(to) && GameState.player.isAlive) {
        this._trySave();
      }
    });

    // Auto-save every N TP
    EventBus.on('tpAdvance', () => {
      const tp = Math.floor(GameState.time.totalTP);
      if (tp - this._lastSaveTP >= this.SAVE_INTERVAL_TP && GameState.player.isAlive) {
        this._trySave();
      }
    });

    // Save on craft complete and combat end
    EventBus.on('craftComplete', () => this._trySave());
    EventBus.on('combatEnd',     ({ outcome }) => {
      if (outcome !== 'defeat') this._trySave();
    });
  },

  _trySave() {
    if (!GameState.player.isAlive) return;
    const tp   = Math.floor(GameState.time.totalTP);
    if (tp === this._lastSaveTP) return;
    this._lastSaveTP = tp;

    const slot = GameState.ui.saveSlot ?? 0;
    try {
      localStorage.setItem(`CARD_SURVIVAL_SAVE_v1_slot${slot}`, GameState.serialize());
      localStorage.setItem(`CARD_SURVIVAL_SAVE_v1_slot${slot}_meta`, JSON.stringify({
        day: GameState.time.day,
        totalTP: tp,
        playerName: GameState.player.name,
        savedAt: new Date().toISOString(),
      }));
    } catch(e) {
      console.warn('[AutoSave] Failed:', e);
      EventBus.emit('notify', { message: I18n.t('save.saveFailed'), type: 'danger' });
    }
  },
};

export default AutoSave;
