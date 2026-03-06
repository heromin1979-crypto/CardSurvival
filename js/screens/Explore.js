// === EXPLORE SCREEN ===
import ExploreUI from '../ui/ExploreUI.js';
import EventBus  from '../core/EventBus.js';
import StatRenderer from '../ui/StatRenderer.js';

const Explore = {
  init() {
    ExploreUI.init();
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'explore') {
        // Re-init stat renderer refs for explore HUD if needed
        StatRenderer.render();
      }
    });
  },
};

export default Explore;
