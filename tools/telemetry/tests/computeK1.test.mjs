// === computeK1.test.mjs ===
// 합성 텔레메트리 픽스처로 K1 산출 알고리즘 검증 (실제 베타 데이터 전 사전 검증).

import { computeK1, segmentRuns } from '../computeK1.mjs';

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

const dayEnds = (jobId, fromDay, toDay, ts0) => {
  const evs = [];
  for (let d = fromDay; d <= toDay; d += 1) {
    evs.push({ ts: ts0 + d, channel: 'dayEnd', payload: { day: d, totalTP: d * 72, characterId: jobId } });
  }
  return evs;
};
const died = (jobId, day, ts) => ({ ts, channel: 'playerDied', payload: { cause: 'death_x', day, totalTP: day * 72, characterId: jobId } });

// 시나리오
const sessionA = { events: dayEnds('doctor', 1, 100, 0) };                                   // doctor 생존 (playerDied 부재 → dayEnd.characterId로 귀속)
const sessionB = { events: [...dayEnds('doctor', 1, 50, 1000), died('doctor', 50, 1051)] };  // doctor 사망
const sessionC = { events: [...dayEnds('soldier', 1, 5, 2000), died('soldier', 5, 2006)] };  // soldier 사망
const sessionD = { events: [...dayEnds('chef', 1, 100, 3000),                                // chef run1 생존
                            ...dayEnds('chef', 1, 5, 3200), died('chef', 5, 3206)] };         // chef run2 사망 (day 감소 → 분할)

// 1. run 분할 — 멀티-run 세션
check('segmentRuns splits multi-run session (chef: 2 runs)', segmentRuns(sessionD.events).length === 2,
      `got ${segmentRuns(sessionD.events).length}`);
const single = segmentRuns(sessionA.events);
check('segmentRuns survivor = 1 run, maxDay 100, not died', single.length === 1 && single[0].maxDay === 100 && single[0].died === false);

// 2. K1 산출
const { byJob, totalRuns } = computeK1([sessionA, sessionB, sessionC, sessionD]);
check('totalRuns = 5', totalRuns === 5, `got ${totalRuns}`);

check('doctor total 2', byJob.doctor?.total === 2, `got ${byJob.doctor?.total}`);
check('doctor survived 1', byJob.doctor?.survived === 1, `got ${byJob.doctor?.survived}`);
check('doctor K1 = 0.5', byJob.doctor?.k1 === 0.5, `got ${byJob.doctor?.k1}`);

check('soldier total 1', byJob.soldier?.total === 1);
check('soldier K1 = 0', byJob.soldier?.k1 === 0, `got ${byJob.soldier?.k1}`);

check('chef total 2', byJob.chef?.total === 2, `got ${byJob.chef?.total}`);
check('chef K1 = 0.5 (run1 survived, run2 died)', byJob.chef?.k1 === 0.5, `got ${byJob.chef?.k1}`);

// 3. 생존자 직업 귀속 (핵심 갭-수정 검증) — playerDied 없는 run도 unknown이 아니어야
check('survivor attributed to job (not unknown)', byJob.unknown === undefined);

// 4. 100일 미만 생존(중도 종료, 사망 없음)은 미생존 처리
const partial = computeK1([{ events: dayEnds('engineer', 1, 80, 5000) }]);
check('engineer 80일 중단 = K1 0 (100일 미달)', partial.byJob.engineer?.k1 === 0, `got ${partial.byJob.engineer?.k1}`);

console.log(`\n=== computeK1.test ===`);
console.log(`Pass: ${pass}, Fail: ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL PASS');
