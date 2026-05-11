// === eventBusCleanup.test.mjs ===
// bootstrap → teardown → bootstrap 사이클에서 EventBus listener 누수 0 검증.

import { installGlobalShim } from '../mocks/globalShim.mjs';
import EventBus from '../../../../js/core/EventBus.js';

installGlobalShim();

// systemBootstrap을 import하기 전에 globalShim 설치
const { bootstrapSystems, teardownSystems, isBootstrapped } = await import('../systemBootstrap.mjs');

let pass = 0, fail = 0;

function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

function countTotalListeners() {
  let n = 0;
  for (const arr of Object.values(EventBus._listeners ?? {})) {
    n += arr.length;
  }
  return n;
}

// 초기 상태 (시뮬 시작 전)
const initialCount = countTotalListeners();
check('initial state has ~0 listeners (sim startup)', initialCount <= 5, `got ${initialCount}`);

// 1차 bootstrap
const results1 = bootstrapSystems();
const okCount1 = results1.filter(r => r.ok).length;
const errCount1 = results1.filter(r => !r.ok).length;
console.log(`\n1st bootstrap: ${okCount1} ok, ${errCount1} error`);
for (const r of results1) {
  if (!r.ok) console.log(`  ❌ ${r.name}: ${r.error}`);
}

check('isBootstrapped after 1st bootstrap', isBootstrapped() === true);

const after1stCount = countTotalListeners();
check('1st bootstrap registers listeners', after1stCount > initialCount, `${initialCount} → ${after1stCount}`);

// teardown
teardownSystems();
const afterTeardownCount = countTotalListeners();
check('teardown clears all listeners', afterTeardownCount === 0, `got ${afterTeardownCount}`);
check('isBootstrapped after teardown', isBootstrapped() === false);

// 2차 bootstrap
const results2 = bootstrapSystems();
const after2ndCount = countTotalListeners();
const okCount2 = results2.filter(r => r.ok).length;
console.log(`\n2nd bootstrap: ${okCount2} ok`);

check('2nd bootstrap same listener count as 1st',
      after2ndCount === after1stCount,
      `1st: ${after1stCount}, 2nd: ${after2ndCount}`);
check('2nd bootstrap same ok count', okCount2 === okCount1);

// 3차 bootstrap (재호출은 teardown 자동)
const results3 = bootstrapSystems();
const after3rdCount = countTotalListeners();
check('3rd bootstrap (auto-teardown) same count', after3rdCount === after1stCount,
      `1st: ${after1stCount}, 3rd: ${after3rdCount}`);

teardownSystems();

console.log(`\n=== eventBusCleanup.test ===`);
console.log(`Pass: ${pass}, Fail: ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL PASS');
