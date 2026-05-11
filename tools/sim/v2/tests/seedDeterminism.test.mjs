// === seedDeterminism.test.mjs ===
// 동일 시드 → 동일 결과. 시뮬 결정성 보장.

import { makeRng, rngInt, rngPick } from '../rng.mjs';
import { runBatch, runSingleRun } from '../runner.mjs';

let pass = 0, fail = 0;

function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

// 1. RNG 결정성
{
  const a = makeRng(42);
  const b = makeRng(42);
  const seqA = [a(), a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b(), b()];
  check('makeRng(42) deterministic', JSON.stringify(seqA) === JSON.stringify(seqB));
}

// 2. 다른 시드 → 다른 시퀀스
{
  const a = makeRng(42);
  const b = makeRng(43);
  const seqA = [a(), a(), a()];
  const seqB = [b(), b(), b()];
  check('different seeds produce different sequences', JSON.stringify(seqA) !== JSON.stringify(seqB));
}

// 3. RNG 범위 (0 ≤ x < 1)
{
  const r = makeRng(7);
  let inRange = true;
  for (let i = 0; i < 1000; i += 1) {
    const x = r();
    if (x < 0 || x >= 1) { inRange = false; break; }
  }
  check('rng output in [0, 1)', inRange);
}

// 4. rngInt 범위
{
  const r = makeRng(7);
  let inRange = true;
  for (let i = 0; i < 1000; i += 1) {
    const x = rngInt(r, 1, 10);
    if (x < 1 || x > 10 || !Number.isInteger(x)) { inRange = false; break; }
  }
  check('rngInt(1, 10) output in [1, 10] integers', inRange);
}

// 5. rngPick 안정성
{
  const r = makeRng(7);
  const arr = ['a', 'b', 'c', 'd'];
  let valid = true;
  for (let i = 0; i < 100; i += 1) {
    if (!arr.includes(rngPick(r, arr))) { valid = false; break; }
  }
  check('rngPick returns array element', valid);
}

// 6. runSingleRun 결정성 (동일 시드 → 동일 trace)
{
  const t1 = runSingleRun({ characterId: 'doctor', seed: 1, runId: 0 });
  const t2 = runSingleRun({ characterId: 'doctor', seed: 1, runId: 0 });
  check('runSingleRun(seed=1) deterministic',
        t1.survivedDays === t2.survivedDays && t1.alive === t2.alive);
}

// 7. runBatch 결정성
{
  const b1 = runBatch({ characterId: 'firefighter', runs: 5, seedBase: 100 });
  const b2 = runBatch({ characterId: 'firefighter', runs: 5, seedBase: 100 });
  const eq = b1.every((r, i) => r.seed === b2[i].seed && r.survivedDays === b2[i].survivedDays);
  check('runBatch deterministic', eq);
}

console.log(`\n=== seedDeterminism.test ===`);
console.log(`Pass: ${pass}, Fail: ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL PASS');
