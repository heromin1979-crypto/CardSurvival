// Boot smoke test: load editor.js into a happy-dom matching index.html and
// confirm it renders without throwing, then drive a render with injected data.
// Run: node tools/editor/dom-smoke.test.mjs
let Window;
try {
  ({ Window } = await import('happy-dom'));
} catch {
  console.log('happy-dom 미설치 — DOM 스모크 테스트 건너뜀 (npm install 후 재실행).');
  process.exit(0);
}
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'index.html'), 'utf8');
const body = html.split('<body>')[1].split('</body>')[0];

const window = new Window({ url: 'http://localhost/tools/editor/' });
window.document.body.innerHTML = body;

// expose globals editor.js expects
for (const k of ['document', 'localStorage', 'confirm', 'prompt', 'alert']) {
  globalThis[k] = window[k] || (() => {});
}
globalThis.window = window;
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.fetch = async () => { throw new Error('no network in smoke test'); };

let failures = 0;
const check = (n, c) => { console.log(`  ${c ? '✓' : '✗'} ${n}`); if (!c) failures++; };

console.log('=== editor.js boot smoke ===');
try {
  await import('./editor.js');
  check('module boots without throwing', true);
  check('save button present', window.document.querySelector('#save-btn') !== null);
  // 개수 단정은 탭이 늘 때마다 낡는다 — 있어야 할 탭이 사라졌는지를 이름으로 본다
  const EXPECTED_TABS = [
    'balance', 'items', 'districts', 'landmarks', 'sublocations', 'hidden',
    'quests', 'flow', 'changes', 'validate', 'ledger', 'settings',
  ];
  const presentTabs = [...window.document.querySelectorAll('.tab')].map((b) => b.dataset.tab);
  const missingTabs = EXPECTED_TABS.filter((t) => !presentTabs.includes(t));
  check(`tabs present (${presentTabs.length})${missingTabs.length ? ` — 누락: ${missingTabs.join(', ')}` : ''}`,
    missingTabs.length === 0);
  // balance tab renders without throwing
  window.document.querySelector('[data-tab="balance"]').click();
  check('balance tab renders', /공용 변수|불러오는/.test(window.document.querySelector('#view').textContent));
  // flow tab renders without throwing
  window.document.querySelector('[data-tab="flow"]').click();
  check('flow tab renders', /흐름|불러오는/.test(window.document.querySelector('#view').textContent));
  // items tab renders without throwing (empty state when items.js not loaded)
  window.document.querySelector('[data-tab="items"]').click();
  check('items tab renders', /아이템/.test(window.document.querySelector('#view').textContent));
  // changes tab renders without throwing (empty state when no data loaded)
  window.document.querySelector('[data-tab="changes"]').click();
  check('changes tab renders', /변경 사항/.test(window.document.querySelector('#view').textContent));
  // validate tab renders without throwing
  window.document.querySelector('[data-tab="validate"]').click();
  check('validate tab renders', /검증/.test(window.document.querySelector('#view').textContent));
  // 대장 탭 — serve.js 없이 열면 감사 결과가 없으니 로딩/오류 안내가 떠야 한다
  window.document.querySelector('[data-tab="ledger"]').click();
  check('ledger tab renders', /대장|감사/.test(window.document.querySelector('#view').textContent));
  // settings tab renders local-settings box (no PAT fields)
  window.document.querySelector('[data-tab="settings"]').click();
  check('settings tab renders', window.document.querySelector('.settings-box') !== null);
} catch (e) {
  check('module boots without throwing', false);
  console.error('   ', String(e).split('\n').slice(0, 3).join('\n    '));
}

console.log(failures === 0 ? '\nSMOKE PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
