// === MASTER RENDERER ===
// Dispatches render calls to sub-renderers on stateTransition
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import BoardRenderer from './BoardRenderer.js';
import StatRenderer  from './StatRenderer.js';

const Renderer = {
  init() {
    EventBus.on('stateTransition', ({ to }) => this.activateScreen(to));
    EventBus.on('loaded', () => {
      // 저장 파일에 encounter/combat 상태가 남아있어도 불완전 UI 방지를 위해 main으로 강제
      const st = GameState.ui.currentState;
      const safe = (st === 'encounter' || st === 'combat' || st === 'combat_result')
        ? 'main'
        : st;
      if (safe !== st) {
        console.warn(`[Renderer] loaded: 불완전 state "${st}" → "${safe}"로 복구`);
        GameState.ui.currentState = safe;
      }
      this.activateScreen(safe);
    });
  },

  activateScreen(state) {
    // Map state name → screen element id
    const screenMap = {
      main_menu:      'screen-main-menu',
      slot_select:    'screen-slot-select',
      char_create:    'screen-char-create',
      main:           'screen-main',
      explore:        'screen-explore',
      encounter:      'screen-encounter',
      combat:         'screen-combat',
      combat_result:  'screen-combat-result',
      rest:           'screen-rest',
      game_over:      'screen-game-over',
      pause:          'screen-pause',
      ending:         'screen-ending',
      ending_gallery: 'screen-ending-gallery',
    };

    // Deactivate all
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    const id = screenMap[state];
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }

    // Show/hide HUD (not on menu screens)
    const showHud = ['main', 'explore', 'combat', 'rest', 'encounter'].includes(state);
    const hud = document.getElementById('global-hud');
    if (hud) hud.style.display = showHud ? 'flex' : 'none';

    // Trigger a full render (only if relevant elements exist)
    if (document.getElementById('board-container')) BoardRenderer.render();
    StatRenderer.render();
  },
};

export default Renderer;
