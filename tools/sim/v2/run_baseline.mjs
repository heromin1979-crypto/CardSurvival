#!/usr/bin/env node
// === run_baseline.mjs ===
// 7직업 × 100회 baseline 측정. JSON 결과 파일 저장 + 요약 출력.

import { writeFileSync } from 'fs';
import { runBatch } from './runner.mjs';
import { listCharacterIds } from './characterAdapter.mjs';
import { summarizeAll } from './reporters/index.mjs';
import { balanceFingerprint, getBalanceDriftReport } from './drift.mjs';

const RUNS_PER_CHARACTER = 100;
const SEED_BASE = 0;
const OUTPUT_FILE = 'docs/persona-meeting-2026-05-10/BAL_SIM_baseline_v8_result.json';

const characters = listCharacterIds();

console.log(`\n=== baseline ${characters.length} × ${RUNS_PER_CHARACTER} = ${characters.length * RUNS_PER_CHARACTER} runs ===\n`);

const allTraces = [];
const t0 = Date.now();

for (const ch of characters) {
  const tc = Date.now();
  const batch = runBatch({ characterId: ch, runs: RUNS_PER_CHARACTER, seedBase: SEED_BASE });
  allTraces.push(...batch);
  const survivors = batch.filter(t => t.alive).length;
  const meanDeath = batch.filter(t => !t.alive).reduce((a, t) => a + (t.deathDay ?? 0), 0)
                  / Math.max(1, batch.filter(t => !t.alive).length);
  console.log(`  ${ch.padEnd(12)} ${RUNS_PER_CHARACTER} runs in ${(Date.now() - tc)}ms  — alive ${survivors}/${RUNS_PER_CHARACTER} (${((survivors / RUNS_PER_CHARACTER) * 100).toFixed(1)}%)  meanDeath day${meanDeath.toFixed(1)}`);
}

const dt = Date.now() - t0;
console.log(`\nTotal: ${allTraces.length} runs in ${(dt / 1000).toFixed(1)}s`);

const kpi = summarizeAll(allTraces);
const drift = getBalanceDriftReport();
const fp = balanceFingerprint();

const out = {
  schemaVersion: 2,
  buildTag: 'sim-baseline-v8-pr12-t1',
  phase: 'complete',
  balanceFingerprint: fp,
  characters,
  totalRuns: allTraces.length,
  runs: allTraces.map(t => ({
    runId: t.runId, character: t.character, seed: t.seed,
    alive: t.alive, survivedDays: t.survivedDays, deathDay: t.deathDay, deathCause: t.deathCause,
    eventsCount: t.events?.length ?? 0,
    bootstrapErrors: t.bootstrapErrors,
  })),
  kpi,
  drift: {
    balanceLeafTotal: drift.total,
    coverage: Number(drift.coverage.toFixed(3)),
  },
  meta: {
    runsPerCharacter: RUNS_PER_CHARACTER,
    seedBase: SEED_BASE,
    targetDays: 100,
    totalDurationMs: dt,
  },
};

writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));
console.log(`\nResult written to ${OUTPUT_FILE}`);

console.log(`\n=== K1 직업별 100일 생존율 ===`);
for (const [c, s] of Object.entries(kpi.survivalRate.byCharacter)) {
  console.log(`  ${c.padEnd(12)} ${s.ratePct.toFixed(2)}%  ±${s.ci95Pct.toFixed(2)}p  (${s.survived}/${s.runs})`);
}
console.log(`\n직업 간 최대 격차: ${kpi.survivalRate.crossCharacterGapPct.toFixed(2)}%p (목표 ≤ 5%p)`);
console.log(`목표 범위: 10~20%`);

console.log(`\n=== K3 평균 사망일 (사망 회차 한정) ===`);
for (const [c, s] of Object.entries(kpi.deathDay.byCharacter)) {
  console.log(`  ${c.padEnd(12)} mean ${s.meanDay ?? 'N/A'}  median ${s.medianDay ?? 'N/A'}  deaths ${s.deaths}`);
}

console.log(`\n=== K5 사망 원인 분포 (전 직업 합산) ===`);
const causeAll = {};
for (const s of Object.values(kpi.deathDay.byCharacter)) {
  for (const [c, n] of Object.entries(s.causeDistribution)) {
    causeAll[c] = (causeAll[c] ?? 0) + n;
  }
}
for (const [c, n] of Object.entries(causeAll).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c.padEnd(20)} ${n}`);
}

console.log(`\n=== drift ===`);
console.log(`  BALANCE leaf total: ${drift.total}, fingerprint: ${fp}`);
