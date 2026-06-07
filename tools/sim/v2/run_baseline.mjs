#!/usr/bin/env node
// === run_baseline.mjs ===
// 7직업 × 100회 baseline 측정. JSON 결과 파일 저장 + 요약 출력.

import { writeFileSync } from 'fs';
import { runBatch } from './runner.mjs';
import { listCharacterIds } from './characterAdapter.mjs';
import { summarizeAll } from './reporters/index.mjs';
import { balanceFingerprint, balanceLeafHash, getBalanceDriftReport } from './drift.mjs';

const RUNS_PER_CHARACTER = 100;
const SEED_BASE = 0;

// 출력 경로: `--out <path>`로 지정 가능. 없으면 v16 고정(기존 CLI 기본 동작 유지).
// buildTag/version은 파일명의 _vN_ 에서 자동 유도.
const outArgIdx = process.argv.indexOf('--out');
const OUTPUT_FILE = (outArgIdx !== -1 && process.argv[outArgIdx + 1])
  ? process.argv[outArgIdx + 1]
  : 'simulation-data/baselines/raw/BAL_SIM_baseline_v16_result.json';
const VERSION = (/_v(\d+)_/.exec(OUTPUT_FILE) || [, '16'])[1];
const BUILD_TAG = `sim-baseline-v${VERSION}`;

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
const leafHash = balanceLeafHash();

const out = {
  schemaVersion: 2,
  buildTag: BUILD_TAG,
  phase: 'complete',
  balanceFingerprint: fp,
  balanceLeafHash: leafHash,
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
console.log(`  BALANCE leaf total: ${drift.total}, fingerprint: ${fp}, leafHash: ${leafHash}`);

console.log(`\n=== 행동 프로파일 (직업별, 100회 합산) ===`);
const top = (obj, n = 3) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}×${v}`).join(', ') || '(없음)';
for (const [c, b] of Object.entries(kpi.behaviorProfile.byCharacter)) {
  console.log(`  ${c.padEnd(12)} avg ${b.avgActionsPerRun} acts/run | 제작: ${top(b.craftedItems)} | 소비: ${top(b.consumedItems)}`);
  console.log(`  ${' '.repeat(12)} 탐색구: ${top(b.exploreByDistrict)} | 낚시 ${b.fishing.total} | 이동 ${b.moves.total} | 전투 ${b.combat.combats}/kills ${b.combat.totalKills} | 퀘스트 시작 ${b.quests.started}/완료 ${b.quests.completed}`);
}
console.log(`\n  ※ combat·move·후반이벤트 = 구조적 ~0 (시뮬 AI day 4~8 아사로 중후반 미도달). 퀘스트는 초반 자동완료분 포함`);
