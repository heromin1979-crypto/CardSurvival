// === systemBootstrapOrder.test.mjs ===
// BOOTSTRAP_ORDER가 main.js 121~169 init 순서와 일치하는지 검증.
// main.js 변경 시 시뮬도 자동 알림.

import { readFileSync } from 'fs';
import { getBootstrapOrder, getDeferredSystems, getSkippedSystems } from '../systemBootstrap.mjs';

let pass = 0, fail = 0;

function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

const mainJs = readFileSync(new URL('../../../../js/main.js', import.meta.url), 'utf-8');
const mainLines = mainJs.split('\n');

// 각 BOOTSTRAP 시스템이 main.js 해당 라인에서 init()되는지 검증
const order = getBootstrapOrder();

check('31 BOOTSTRAP systems (PR2 14 + PR2.5 17)', order.length === 31, `got ${order.length}`);

for (const { name, mainLine } of order) {
  const line = mainLines[mainLine - 1] ?? '';
  const expectedInit = `${name}.init()`;
  check(
    `main.js:${mainLine} contains ${expectedInit}`,
    line.includes(expectedInit),
    `actual: ${line.trim()}`
  );
}

// BOOTSTRAP 순서가 main.js의 라인 번호 오름차순인지
const lineNums = order.map(o => o.mainLine);
const sorted = [...lineNums].sort((a, b) => a - b);
check('BOOTSTRAP_ORDER is sorted by main.js line', JSON.stringify(lineNums) === JSON.stringify(sorted));

// 분류 카테고리별 개수
check('UNCERTAIN_DEFERRED empty (all promoted)', getDeferredSystems().length === 0, `got ${getDeferredSystems().length}`);
check('SKIP_PERMANENT has 4 systems', getSkippedSystems().length === 4, `got ${getSkippedSystems().length}`);

// 중복 없음
const allNames = [
  ...order.map(o => o.name),
  ...getDeferredSystems(),
  ...getSkippedSystems(),
];
const unique = new Set(allNames);
check('no duplicate system across categories', allNames.length === unique.size);

console.log(`\n=== systemBootstrapOrder.test ===`);
console.log(`Pass: ${pass}, Fail: ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL PASS');
