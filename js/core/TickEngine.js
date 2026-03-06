// === TICK ENGINE ===
// 행동 기반 시간 진행 — 자동 타이머 없음.
// TP는 이동·제작·대기 등 명시적 행동으로만 소모된다.
import EventBus  from './EventBus.js';
import GameState from './GameState.js';

const TickEngine = {
  // 자동 틱 없음 — 호환성을 위해 no-op 유지
  start() {},
  stop()  {},

  _doFullTP() {
    const gs = GameState;
    gs.time.tpInDay++;
    gs.time.hour = Math.floor((gs.time.tpInDay * 15) / 60) + 6;

    // new day
    if (gs.time.tpInDay >= 96) {
      gs.time.tpInDay = 0;
      gs.time.day++;
      gs.time.hour = 6;
    }

    EventBus.emit('tpAdvance', { totalTP: gs.time.totalTP });
  },

  // Synchronously advance N full TPs (for sleep/travel)
  skipTP(n, reason = '') {
    for (let i = 0; i < n; i++) {
      GameState.time.totalTP += 1.0;
      this._doFullTP();
    }
    EventBus.emit('notify', { message: `⏩ ${n} TP skipped${reason ? ': '+reason : ''}`, type: 'info' });
  },

  setPaused(val) {
    GameState.time.isPaused = val;
  },
};

export default TickEngine;
