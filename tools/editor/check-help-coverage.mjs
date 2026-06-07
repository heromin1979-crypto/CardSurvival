// === 에디터 툴팁(설명) 커버리지 체커 — 아이템 필드 ===
// 에디터는 모든 데이터 필드를 자동 렌더(objNode 재귀)하므로 "필드 추가"는 자동이다.
// 빠지는 건 마우스오버 '설명(툴팁)'뿐 — ITEM_HELP/FIELD_HELP 사전에 키가 없으면
// 점선 밑줄·툴팁이 안 붙는다. 이 스크립트는 모든 아이템 정의의 필드 키(임의 깊이)를
// 추출해 에디터 도움말 사전과 대조하여 '설명 없는 필드'를 보고한다.
//
// 사용:  node tools/editor/check-help-coverage.mjs
//   - 누락이 있으면 목록 출력 + exit 1 (검증 게이트로 사용 가능)
//   - 통과하면 exit 0
//
// 신규 필드/개념을 추가했다면: 이 스크립트로 누락을 확인하고
// tools/editor/editor.js 의 ITEM_HELP(아이템 전용) 또는 FIELD_HELP(공용)에
// 한 줄 설명을 등록하면 된다.
//
// ※ 범위: 아이템(items.js)의 필드만 검사한다. items 딕셔너리의 최상위 키는
//   아이템 'ID'(데이터)이지 필드가 아니므로 각 아이템 '값'의 키만 수집한다.
//   밸런스(gameBalance.js)는 id-키 맵(npc/적/임계값)이 라벨로 렌더되어 노이즈가
//   크므로 이 게이트에선 제외 — 추가 시 에디터 밸런스 탭에서 직접 확인할 것.

import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const importData = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

// 객체의 모든 키를 임의 깊이로 수집 (배열 원소도 순회)
function collectKeys(value, into = new Set()) {
  if (!value || typeof value !== 'object') return into;
  if (Array.isArray(value)) { value.forEach((v) => collectKeys(v, into)); return into; }
  for (const k of Object.keys(value)) { into.add(k); collectKeys(value[k], into); }
  return into;
}

// editor.js 소스에서 `const NAME = { ... }` 블록의 키들을 추출
function extractHelpKeys(src, declName) {
  const decl = `const ${declName} = {`;
  const i = src.indexOf(decl);
  if (i === -1) return new Set();
  const end = src.indexOf('\n};', i);
  const body = src.slice(i, end === -1 ? undefined : end);
  const set = new Set();
  for (const m of body.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) set.add(m[1]);
  for (const m of body.matchAll(/^\s*['"]([^'"]+)['"]\s*:/gm)) set.add(m[1]);
  return set;
}

// 설명이 필요 없는 키 (객체 키/자명한 구조 필드)
const IGNORE = new Set(['id']);

const editorSrc = readFileSync(join(HERE, 'editor.js'), 'utf8');
const help = new Set([
  ...extractHelpKeys(editorSrc, 'ITEM_HELP'),
  ...extractHelpKeys(editorSrc, 'FIELD_HELP'),
]);

const items = (await importData('js/data/items.js')).default;
// 각 아이템 '값'의 필드만 수집 (최상위 아이템 ID는 제외)
const fieldKeys = new Set();
for (const def of Object.values(items)) collectKeys(def, fieldKeys);

const missing = [...fieldKeys].filter((k) => !help.has(k) && !IGNORE.has(k)).sort();

if (missing.length) {
  console.log(`❌ 설명(툴팁) 없는 아이템 필드 ${missing.length}개:\n   ${missing.join(', ')}`);
  console.log('\n→ tools/editor/editor.js 의 ITEM_HELP(아이템 전용) 또는 FIELD_HELP(공용)에 한 줄씩 등록하세요.');
  process.exit(1);
} else {
  console.log(`✅ 아이템 필드 ${fieldKeys.size}개 모두 에디터 설명이 있습니다.`);
}
