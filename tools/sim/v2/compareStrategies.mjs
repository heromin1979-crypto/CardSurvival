#!/usr/bin/env node
// === compareStrategies.mjs ===
// 정의된 전략들을 각각 N시드로 돌려 "전략별 생존일"을 집계해 JSON(stdout) 출력.
// 시뮬 뷰어의 "전략 비교"가 이 결과로 리스트를 그린다.
//
// 사용: node tools/sim/v2/compareStrategies.mjs --char doctor --runs 25

import { runBatch } from './runner.mjs';
import { STRATEGIES } from './strategies.mjs';

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return (i !== -1 && process.argv[i + 1] != null) ? process.argv[i + 1] : def;
}
const characterId = arg('--char', 'doctor');
const runs = Math.max(1, Math.min(100, Number.parseInt(arg('--runs', '25'), 10) || 25));

// 시스템 출력이 stdout JSON을 오염시키지 않도록 무음 처리
const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };
console.log = console.info = console.warn = console.error = () => {};

const results = [];
try {
  for (const strat of STRATEGIES) {
    const traces = runBatch({ characterId, runs, seedBase: 0, strategy: strat.cfg });
    const days = traces.map((t) => t.survivedDays).sort((a, b) => a - b);
    const mean = days.reduce((a, b) => a + b, 0) / days.length;
    const median = days[Math.floor(days.length / 2)];
    const survived = traces.filter((t) => t.alive).length;
    const causeDist = {};
    for (const t of traces) if (!t.alive) { const c = t.deathCause ?? '?'; causeDist[c] = (causeDist[c] || 0) + 1; }
    // 대표 런: 생존일이 중앙값에 가장 가까운 시드
    let sampleSeed = 0, bestDiff = Infinity;
    traces.forEach((t, i) => { const diff = Math.abs(t.survivedDays - median); if (diff < bestDiff) { bestDiff = diff; sampleSeed = i; } });
    results.push({
      id: strat.id, name: strat.name, desc: strat.desc,
      meanDays: Math.round(mean * 10) / 10,
      medianDays: median,
      survivalRate: Math.round((survived / runs) * 1000) / 10,
      causeDist, sampleSeed,
    });
  }
} finally {
  Object.assign(console, orig);
}

results.sort((a, b) => b.meanDays - a.meanDays);
process.stdout.write(JSON.stringify({ character: characterId, runsPerStrategy: runs, strategies: results }));
