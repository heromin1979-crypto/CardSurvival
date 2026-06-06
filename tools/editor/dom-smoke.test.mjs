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
  check('8 tabs present', window.document.querySelectorAll('.tab').length === 8);
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
  // settings tab renders local-settings box (no PAT fields)
  window.document.querySelector('[data-tab="settings"]').click();
  check('settings tab renders', window.document.querySelector('.settings-box') !== null);
} catch (e) {
  check('module boots without throwing', false);
  console.error('   ', String(e).split('\n').slice(0, 3).join('\n    '));
}

console.log(failures === 0 ? '\nSMOKE PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
