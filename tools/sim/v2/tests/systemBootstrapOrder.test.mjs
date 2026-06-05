// === systemBootstrapOrder.test.mjs ===
// BOOTSTRAP_ORDER가 main.js init() 등장의 상대 순서와 일치하는지 검증.
// main.js init 순서 변경 시 시뮬도 자동 알림. (절대 라인번호 비의존 — 라인 삽입에 견고)

import { readFileSync } from 'fs';
import { getBootstrapOrder, getDeferredSystems, getSkippedSystems } from '../systemBootstrap.mjs';

let pass = 0, fail = 0;

function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

const mainJs = readFileSync(new URL('../../../../js/main.js', import.meta.url), 'utf-8');
const mainLines = mainJs.split('\n');

// 각 BOOTSTRAP 시스템의 init()이 main.js에 존재하고, BOOTSTRAP_ORDER와 같은 상대 순서인지 검증
const order = getBootstrapOrder();

check('31 BOOTSTRAP systems (PR2 14 + PR2.5 17)', order.length === 31, `got ${order.length}`);

const lineIndexOf = name => mainLines.findIndex(l => l.includes(`${name}.init()`));

const indices = [];
for (const { name } of order) {
  const idx = lineIndexOf(name);
  check(`main.js has ${name}.init()`, idx >= 0, idx < 0 ? 'not found' : '');
  indices.push(idx);
}

// BOOTSTRAP_ORDER 순서대로 main.js 등장 위치가 단조 증가(상대 순서 일치)인지
let ordered = true, prev = -1;
for (const idx of indices) {
  if (idx < 0) continue;
  if (idx <= prev) ordered = false;
  prev = idx;
}
check('BOOTSTRAP_ORDER matches main.js init order', ordered);

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
