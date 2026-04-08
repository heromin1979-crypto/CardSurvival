// === SMOKE TEST ===
// Node ESM — DOM 최소 스텁, 게임 부팅 + TP 진행 검증
// 실행: node testdata/smoke-test.mjs

import { strict as assert } from 'assert';

// 브라우저 전역 스텁
global.document    = { getElementById: () => null, createElement: () => ({}) };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.window      = global;

const { default: GameState  } = await import('../js/core/GameState.js');
const { default: TickEngine } = await import('../js/core/TickEngine.js');

// 1. 초기 상태 확인
assert.equal(GameState.time.totalTP, 0, '초기 totalTP 는 0 이어야 한다');
assert.equal(GameState.time.day,     1, '초기 day 는 1 이어야 한다');

// 2. TP 진행 검증
const before = GameState.time.totalTP;
TickEngine.skipTP(1);
assert.equal(GameState.time.totalTP, before + 1.0, 'skipTP(1) 후 totalTP += 1.0 이어야 한다');

// 3. 10 TP 진행 후 day/totalTP 일관성 확인
TickEngine.skipTP(9);
assert.equal(GameState.time.totalTP, 10, '10 TP 후 totalTP === 10');
assert.ok(GameState.time.day >= 1, 'day 는 항상 1 이상');

console.log('✅ SMOKE PASS — 게임 부팅, TP 진행 정상 (totalTP:', GameState.time.totalTP, '/ day:', GameState.time.day, ')');
