// === eventOverlap.mjs — E1~E5 ===
// 후반(day 60~100) 4 이벤트 폭주 + 페어별 인접 발화 빈도.
// 카드 표현 측정 X (시뮬은 카드 그리지 않음, AD 트랙 별도).

const EVENT_TYPES = ['raidEvents', 'hordeWaves', 'hospitalSiege', 'raiderEvents'];

export function summarizeEventOverlap(traces) {
  const totalRuns = traces.length;
  const TP_PER_DAY = 72;
  const lateStart = 60 * TP_PER_DAY;
  const lateEnd = 100 * TP_PER_DAY;

  let runsWithLateOverlap = 0;
  let runsWithAnyEvent = 0;
  const typeCounts = Object.fromEntries(EVENT_TYPES.map(t => [t, 0]));
  const pairCounts = {}; // 'type1+type2' → count
  let totalLateEvents = 0;

  for (const t of traces) {
    const events = (t.events ?? []).filter(e => e.tp >= lateStart && e.tp <= lateEnd);
    if (events.length > 0) runsWithAnyEvent += 1;
    totalLateEvents += events.length;

    for (const e of events) {
      if (typeCounts[e.type] !== undefined) typeCounts[e.type] += 1;
    }

    // 동일 TP 2+ 트리거
    const tpMap = {};
    for (const e of events) {
      tpMap[e.tp] = (tpMap[e.tp] ?? 0) + 1;
    }
    if (Object.values(tpMap).some(n => n >= 2)) runsWithLateOverlap += 1;

    // 페어 빈도 (인접 발화: 차이 ≤ 3일 = 216 TP)
    for (let i = 0; i < events.length; i += 1) {
      for (let j = i + 1; j < events.length; j += 1) {
        if (Math.abs(events[i].tp - events[j].tp) <= 3 * TP_PER_DAY) {
          const pair = [events[i].type, events[j].type].sort().join('+');
          pairCounts[pair] = (pairCounts[pair] ?? 0) + 1;
        }
      }
    }
  }

  const E1 = totalRuns === 0 ? 0 : (runsWithLateOverlap / totalRuns) * 100;
  let decision = 'unknown';
  if (E1 < 5) decision = 'option A: 현행 유지';
  else if (E1 < 10) decision = 'option A + 단일 상수 변경';
  else decision = 'option B: EventCalendarSystem 통합';

  return {
    kpi: 'E1-E5',
    totalRuns,
    E1_pctSimultaneousLateOverlap: Number(E1.toFixed(2)),
    E2_meanEventsPerRunLate: totalRuns === 0 ? 0 : Number((totalLateEvents / totalRuns).toFixed(2)),
    E3_pairFrequency: pairCounts,
    eventCountByType: typeCounts,
    decision,
    note: 'day 60~100 구간. 카드 표현 일관성은 AD 트랙 별도',
  };
}
