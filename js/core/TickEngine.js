// === TICK ENGINE ===
// 행동 기반 시간 진행 — 자동 타이머 없음.
// TP는 이동·제작·대기 등 명시적 행동으로만 소모된다.
import EventBus  from './EventBus.js';
import GameState from './GameState.js';

// n ≤ CHUNK_THRESHOLD: 동기 처리 (일반 게임플레이, 테스트)
// n >  CHUNK_THRESHOLD: CHUNK_SIZE TP씩 비동기 분할 (30일 스킵 등 대용량)
const CHUNK_THRESHOLD = 144;  // 2일 이상부터 청킹
const CHUNK_SIZE      = 72;   // 프레임당 최대 1일 처리

const TickEngine = {
  // 자동 틱 없음 — 호환성을 위해 no-op 유지
  start() {},
  stop()  {},

  _doFullTP() {
    const gs = GameState;
    gs.time.tpInDay++;
    gs.time.hour = (Math.floor((gs.time.tpInDay * 24) / 72) + 6) % 24;

    // new day
    if (gs.time.tpInDay >= 72) {
      gs.time.tpInDay = 0;
      gs.time.day++;
      gs.time.hour = 6;
    }

    EventBus.emit('tpAdvance', { totalTP: gs.time.totalTP });
  },

  _processChunk(n) {
    for (let i = 0; i < n; i++) {
      GameState.time.totalTP += 1.0;
      this._doFullTP();
    }
  },

  _postSkip(n, reason) {
    EventBus.emit('notify', { message: `⏩ ${n} TP skipped${reason ? ': ' + reason : ''}`, type: 'info' });
    const remaining = 72 - GameState.time.tpInDay;
    if (remaining <= 6 && remaining > 0) {
      EventBus.emit('notify', { message: `🌙 오늘 남은 행동력: ${remaining} TP — 곧 날이 저뭅니다.`, type: 'warn' });
    } else if (remaining <= 12 && remaining > 6) {
      EventBus.emit('notify', { message: `⏳ 오늘 남은 행동력: ${remaining} TP`, type: 'info' });
    }
  },

  // N TP 진행. n ≤ CHUNK_THRESHOLD 이면 동기, 초과 시 비동기 청킹.
  skipTP(n, reason = '') {
    if (n <= CHUNK_THRESHOLD) {
      this._processChunk(n);
      this._postSkip(n, reason);
      return;
    }
    // 대용량: 청크 단위로 분할해 UI 프리즈 방지
    this._skipTPChunked(n, reason, 0);
  },

  _skipTPChunked(total, reason, processed) {
    const chunk = Math.min(CHUNK_SIZE, total - processed);
    this._processChunk(chunk);
    processed += chunk;
    if (processed < total) {
      setTimeout(() => this._skipTPChunked(total, reason, processed), 0);
    } else {
      this._postSkip(total, reason);
    }
  },

  setPaused(val) {
    GameState.time.isPaused = val;
  },
};

export default TickEngine;
