// === computeK1.mjs ===
// 텔레메트리 export JSON → 직업별 본체 K1 (100일 생존율) 산출. (M4 #4)
// 설계 docs/plans/M4_TELEMETRY_SYSTEM_DESIGN.md §9 알고리즘 기반.
//
// 입력: TelemetrySystem.exportAllSessionsJSON() / exportSessionJSON() 출력 파일.
// 사용: node tools/telemetry/computeK1.mjs <export.json> [export2.json ...]
//
// 설계 §9 대비 차이 (실제 스키마 정합):
//   - §9의 s.meta.jobId는 실제 export에 없다. 직업은 dayEnd/playerDied payload의
//     characterId에서 얻는다 (M4 #2 보강으로 dayEnd에도 characterId 추가).
//   - 한 세션이 여러 run을 담을 수 있어 day 감소·playerDied로 run을 분할한다.
//   - 생존 run(playerDied 부재)도 dayEnd.characterId로 직업 귀속이 가능하다.

import { readFileSync } from 'fs';

const TARGET_DAY = 100;

export function loadSessions(paths) {
  const sessions = [];
  for (const p of paths) {
    const raw = JSON.parse(readFileSync(p, 'utf-8'));
    if (Array.isArray(raw.sessions)) {
      for (const s of raw.sessions) sessions.push(s);          // exportAllSessionsJSON
    } else if (Array.isArray(raw.events)) {
      sessions.push({ sessionId: raw.sessionId, events: raw.events }); // exportSessionJSON
    }
  }
  return sessions;
}

// 세션 이벤트를 run 단위로 분할. run 경계 = playerDied(run 종료) 또는 day 감소(새 게임 시작).
export function segmentRuns(events) {
  const sorted = [...events].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  const runs = [];
  let cur = null;
  const start = (jobId, day) => {
    cur = { jobId: jobId ?? null, maxDay: day ?? 0, lastDay: day ?? 0, died: false };
    runs.push(cur);
  };
  for (const e of sorted) {
    if (e.channel === 'dayEnd') {
      const day = e.payload?.day ?? 0;
      const cid = e.payload?.characterId ?? null;
      if (!cur || day < cur.lastDay) {
        start(cid, day);
      } else {
        cur.maxDay = Math.max(cur.maxDay, day);
        cur.lastDay = day;
        if (cid && !cur.jobId) cur.jobId = cid;
      }
    } else if (e.channel === 'playerDied') {
      const day = e.payload?.day ?? 0;
      const cid = e.payload?.characterId ?? null;
      if (!cur) start(cid, day);
      cur.died = true;
      cur.maxDay = Math.max(cur.maxDay, day);
      if (cid && !cur.jobId) cur.jobId = cid;
      cur = null; // 사망 → run 종료
    }
  }
  return runs;
}

export function computeK1(sessions) {
  const runs = sessions.flatMap(s => segmentRuns(s.events ?? []));
  const byJob = {};
  for (const r of runs) {
    const job = r.jobId ?? 'unknown';
    (byJob[job] ??= { total: 0, survived: 0 });
    byJob[job].total += 1;
    if (!r.died && r.maxDay >= TARGET_DAY) byJob[job].survived += 1;
  }
  const result = {};
  for (const [job, d] of Object.entries(byJob)) {
    result[job] = {
      total: d.total,
      survived: d.survived,
      k1: d.total > 0 ? d.survived / d.total : null,
    };
  }
  return { byJob: result, totalRuns: runs.length };
}

function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error('usage: node tools/telemetry/computeK1.mjs <export.json> [more.json ...]');
    process.exit(1);
  }
  const sessions = loadSessions(paths);
  const { byJob, totalRuns } = computeK1(sessions);

  console.log(`\n=== 본체 K1 (100일 생존율) — ${sessions.length} sessions / ${totalRuns} runs ===\n`);
  for (const [job, d] of Object.entries(byJob).sort()) {
    const pct = d.k1 == null ? 'N/A' : `${(d.k1 * 100).toFixed(1)}%`;
    console.log(`  ${job.padEnd(12)} K1 ${pct.padStart(6)}  (${d.survived}/${d.total} reached ${TARGET_DAY}d)`);
  }
  console.log('');
}

// CLI로 직접 실행할 때만 main() 호출 (import 시에는 함수만 노출)
if (process.argv[1] && process.argv[1].endsWith('computeK1.mjs')) {
  main();
}
