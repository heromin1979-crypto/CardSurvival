// Round-trip verification: extract → serialize → splice → re-import must yield
// semantically identical data, and the regenerated file must still parse/run.
// Run: node tools/editor/serialize.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  findObjectLiteralRange,
  extractValue,
  serializeValue,
  spliceObjectLiteral,
  diffValue,
  DATA_FILES,
} from './serialize.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

// Stable structural compare independent of key order (mirrors what the editor round-trips).
function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = normalize(v[k]);
    return out;
  }
  if (v === Infinity) return '__INF__';
  if (v === -Infinity) return '__NINF__';
  return v;
}
const eq = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

console.log('=== serialize round-trip ===');
for (const [key, cfg] of Object.entries(DATA_FILES)) {
  const filePath = join(root, cfg.path);
  const src = readFileSync(filePath, 'utf8');

  // 1. extract
  let original;
  try {
    original = extractValue(src, cfg.decl);
    check(`${key}: extract`, original && typeof original === 'object');
  } catch (e) {
    check(`${key}: extract`, false, String(e));
    continue;
  }

  // 2. serialize → re-parse (idempotent value)
  const reparsed = new Function(`return (${serializeValue(original, 0)});`)();
  check(`${key}: serialize idempotent`, eq(original, reparsed));

  // 3. splice back into file & confirm structure preserved + file still imports
  const spliced = spliceObjectLiteral(src, cfg.decl, original);
  const range = findObjectLiteralRange(src, cfg.decl);
  const before = src.slice(0, range.open);
  const after = src.slice(range.close + 1);
  check(`${key}: preserves header/footer`,
    spliced.startsWith(before) && spliced.endsWith(after));

  // 4. write to temp & dynamic-import to ensure it still runs
  const tmp = mkdtempSync(join(tmpdir(), 'cs-edit-'));
  // copy sibling deps the module imports (gameBalance for districts)
  const tmpFile = join(tmp, 'mod.mjs');
  // rewrite relative imports to file:// URLs in the original data dir
  // (Windows 절대경로 'C:\...'는 ESM import 지정자로 쓸 수 없으므로 pathToFileURL 필수)
  const dataDir = dirname(filePath);
  const rewritten = spliced.replace(
    /from\s+'(\.\/[^']+)'/g,
    (_, rel) => `from '${pathToFileURL(join(dataDir, rel.slice(2))).href}'`,
  );
  writeFileSync(tmpFile, rewritten);
  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    const exported =
      mod.default ?? mod.MAIN_QUESTS ?? mod.LANDMARK_DATA ?? mod.DISTRICTS ??
      mod.LANDMARK_CARD_META ?? null;
    check(`${key}: regenerated file imports`, exported && eq(exported, original));
  } catch (e) {
    check(`${key}: regenerated file imports`, false, String(e).split('\n')[0]);
  }
}

// === edit-and-persist (mirrors the editor's save path) ===
console.log('=== edit persists through splice ===');
{
  const filePath = join(root, DATA_FILES.q_global.path);
  const src = readFileSync(filePath, 'utf8');
  const data = extractValue(src, DATA_FILES.q_global.decl);
  const firstId = Object.keys(data)[0];
  // mutate: set a finite deadline → Infinity, and bump reward.morale
  data[firstId].deadlineDays = Infinity;
  data[firstId].reward = { ...(data[firstId].reward || {}), morale: 999 };

  const spliced = spliceObjectLiteral(src, DATA_FILES.q_global.decl, data);
  const reparsed = new Function(`return (${
    spliced.slice(
      findObjectLiteralRange(spliced, DATA_FILES.q_global.decl).open,
      findObjectLiteralRange(spliced, DATA_FILES.q_global.decl).close + 1,
    )});`)();
  check('Infinity persists', reparsed[firstId].deadlineDays === Infinity);
  check('reward.morale persists', reparsed[firstId].reward.morale === 999);
  check('other quests untouched', Object.keys(reparsed).length === Object.keys(data).length);
  check('serialized output contains Infinity literal', /deadlineDays:\s*Infinity/.test(spliced));
}

// === diffValue (change list) ===
console.log('=== diffValue ===');
{
  const d = (a, b) => { const o = []; diffValue(a, b, '', o); return o; };
  check('no change → empty', d({ a: 1 }, { a: 1 }).length === 0);
  check('scalar change', JSON.stringify(d({ w: 25 }, { w: 40 })) ===
    JSON.stringify([{ path: 'w', old: 25, new: 40, kind: 'changed' }]));
  check('nested path', d({ lt: { x: 1 } }, { lt: { x: 2 } })[0].path === 'lt.x');
  const arr = d({ lt: [{ w: 1 }, { w: 2 }] }, { lt: [{ w: 1 }, { w: 9 }] });
  check('array index path', arr.length === 1 && arr[0].path === 'lt[1].w');
  const added = d({ lt: [{ w: 1 }] }, { lt: [{ w: 1 }, { w: 2 }] });
  check('array add → kind added', added.some((c) => c.kind === 'added'));
  const removed = d({ lt: [{ w: 1 }, { w: 2 }] }, { lt: [{ w: 1 }] });
  check('array remove → kind removed', removed.some((c) => c.kind === 'removed'));
  check('Infinity equal → no change', d({ dl: Infinity }, { dl: Infinity }).length === 0);
  check('Infinity → finite', d({ dl: Infinity }, { dl: 10 })[0].new === 10);
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
