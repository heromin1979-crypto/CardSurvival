#!/usr/bin/env node
// === listRuns.mjs ===
// 한 캐릭터(+전략)를 N시드 돌려 시드별 생존 결과 요약을 생존일 내림차순으로 출력.
// 행동 히스토리에서 "생존일 보고 런 고르기"용 목록.
//
// 사용: node tools/sim/v2/listRuns.mjs --char doctor --runs 25 --strategy food_farmer

import { runBatch } from './runner.mjs';
import { getStrategy } from './strategies.mjs';

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return (i !== -1 && process.argv[i + 1] != null) ? process.argv[i + 1] : def;
}
const characterId = arg('--char', 'doctor');
const runs = Math.max(1, Math.min(100, Number.parseInt(arg('--runs', '25'), 10) || 25));
const stratId = arg('--strategy', null);
const strategy = stratId ? (getStrategy(stratId)?.cfg ?? {}) : {};

const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };
console.log = console.info = console.warn = console.error = () => {};
let traces;
try {
  traces = runBatch({ characterId, runs, seedBase: 0, strategy });
} finally {
  Object.assign(console, orig);
}

const out = traces
  .map((t, i) => ({ seed: i, survivedDays: t.survivedDays, deathDay: t.deathDay, deathCause: t.deathCause, alive: t.alive }))
  .sort((a, b) => b.survivedDays - a.survivedDays);

process.stdout.write(JSON.stringify({ character: characterId, strategy: stratId, runs: out }));
