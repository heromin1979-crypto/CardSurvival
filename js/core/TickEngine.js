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
    gs.time.hour = Math.min(23, Math.floor((gs.time.tpInDay * 20) / 60) + 6);

    // new day
    if (gs.time.tpInDay >= 72) {
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

    // TP 잔량 경고 — 하루 72 TP 기준
    const remaining = 72 - GameState.time.tpInDay;
    if (remaining <= 6 && remaining > 0) {
      EventBus.emit('notify', { message: `🌙 오늘 남은 행동력: ${remaining} TP — 곧 날이 저뭅니다.`, type: 'warn' });
    } else if (remaining <= 12 && remaining > 6) {
      EventBus.emit('notify', { message: `⏳ 오늘 남은 행동력: ${remaining} TP`, type: 'info' });
    }
  },

  setPaused(val) {
    GameState.time.isPaused = val;
  },
};

export default TickEngine;
