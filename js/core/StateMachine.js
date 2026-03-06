// === UI STATE MACHINE ===
import EventBus  from './EventBus.js';
import GameState from './GameState.js';

// Valid transitions: from → [allowed targets]
const TRANSITIONS = {
  main_menu:      ['char_create', 'basecamp', 'ending_gallery'],
  char_create:    ['basecamp'],
  basecamp:       ['explore', 'encounter', 'rest', 'pause', 'game_over', 'ending', 'main_menu'],
  explore:        ['basecamp', 'encounter', 'rest', 'pause', 'ending'],
  encounter:      ['combat', 'explore', 'basecamp'],
  combat:         ['combat_result', 'game_over', 'ending'],
  combat_result:  ['basecamp', 'explore', 'ending'],
  rest:           ['basecamp', 'ending'],
  game_over:      ['main_menu'],
  ending:         ['main_menu', 'char_create'],
  ending_gallery: ['main_menu'],
  pause:          ['*'],  // any prev state
};

const StateMachine = {
  _previousState: null,

  get current() { return GameState.ui.currentState; },

  canTransition(to) {
    const allowed = TRANSITIONS[this.current];
    if (!allowed) return false;
    return allowed.includes(to) || allowed.includes('*');
  },

  transition(to, data = {}) {
    const from = this.current;
    if (from === to) return;

    if (!TRANSITIONS[from] && from !== 'pause') {
      console.warn(`[SM] No transitions defined for state "${from}"`);
    }

    if (!this.canTransition(to)) {
      // Pause is special: save previous and allow from any state
      if (to !== 'pause' && from !== 'pause') {
        console.warn(`[SM] Invalid transition: ${from} → ${to}`);
        return;
      }
    }

    if (to === 'pause') {
      this._previousState = from;
    } else {
      this._previousState = from;
    }
    GameState.ui.currentState = to;
    EventBus.emit('stateTransition', { from, to, data });
  },

  unpause() {
    if (this.current !== 'pause') return;
    const prev = this._previousState ?? 'basecamp';
    GameState.ui.currentState = prev;
    EventBus.emit('stateTransition', { from: 'pause', to: prev, data: {} });
  },
};

export default StateMachine;
