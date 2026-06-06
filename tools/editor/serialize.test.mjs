// Round-trip verification: extract → serialize → splice → re-import must yield
// semantically identical data, and the regenerated file must still parse/run.
// Run: node tools/editor/serialize.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  findObjectLiteralRange,
  extractValue,
  serializeValue,
  spliceObjectLiteral,
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
  // rewrite relative imports to absolute paths in the original data dir
  const dataDir = dirname(filePath);
  const rewritten = spliced.replace(
    /from\s+'(\.\/[^']+)'/g,
    (_, rel) => `from '${join(dataDir, rel.slice(2))}'`,
  );
  writeFileSync(tmpFile, rewritten);
  try {
    const mod = await import('file://' + tmpFile);
    const exported =
      mod.default ?? mod.MAIN_QUESTS ?? mod.LANDMARK_DATA ?? mod.DISTRICTS ?? null;
    check(`${key}: regenerated file imports`, exported && eq(exported, original));
  } catch (e) {
    check(`${key}: regenerated file imports`, false, String(e).split('\n')[0]);
  }
}

// === edit-and-persist (mirrors the editor's save path) ===
console.log('=== edit persists through splice ===');
{
  const filePath = join(root, DATA_FILES.quests.path);
  const src = readFileSync(filePath, 'utf8');
  const data = extractValue(src, DATA_FILES.quests.decl);
  const firstId = Object.keys(data)[0];
  // mutate: set a finite deadline → Infinity, and bump reward.morale
  data[firstId].deadlineDays = Infinity;
  data[firstId].reward = { ...(data[firstId].reward || {}), morale: 999 };

  const spliced = spliceObjectLiteral(src, DATA_FILES.quests.decl, data);
  const reparsed = new Function(`return (${
    spliced.slice(
      findObjectLiteralRange(spliced, DATA_FILES.quests.decl).open,
      findObjectLiteralRange(spliced, DATA_FILES.quests.decl).close + 1,
    )});`)();
  check('Infinity persists', reparsed[firstId].deadlineDays === Infinity);
  check('reward.morale persists', reparsed[firstId].reward.morale === 999);
  check('other quests untouched', Object.keys(reparsed).length === Object.keys(data).length);
  check('serialized output contains Infinity literal', /deadlineDays:\s*Infinity/.test(spliced));
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
