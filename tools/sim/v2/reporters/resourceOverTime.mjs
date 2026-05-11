// === resourceOverTime.mjs — K7 ===
// day 30/60/90 시점 자원 평균.

const CHECKPOINTS = [30, 60, 90];
const RESOURCES = ['hydration', 'nutrition', 'medical_items', 'food_items'];

export function summarizeResourceOverTime(traces) {
  const byChar = {};

  for (const t of traces) {
    const c = t.character;
    if (!byChar[c]) byChar[c] = {
      runs: 0,
      snapshots: Object.fromEntries(CHECKPOINTS.map(d => [d, { count: 0, sums: {} }])),
    };
    byChar[c].runs += 1;

    const snaps = t.resourceSnapshots ?? [];
    for (const s of snaps) {
      const slot = byChar[c].snapshots[s.day];
      if (slot) {
        slot.count += 1;
        for (const k of Object.keys(s.values ?? {})) {
          slot.sums[k] = (slot.sums[k] ?? 0) + s.values[k];
        }
      }
    }
  }

  const summary = {};
  for (const [c, { runs, snapshots }] of Object.entries(byChar)) {
    summary[c] = { runs, byDay: {} };
    for (const [day, { count, sums }] of Object.entries(snapshots)) {
      const avg = {};
      for (const k of Object.keys(sums)) {
        avg[k] = count === 0 ? null : Number((sums[k] / count).toFixed(2));
      }
      summary[c].byDay[day] = { sampleCount: count, avg };
    }
  }

  return {
    kpi: 'K7',
    checkpoints: CHECKPOINTS,
    byCharacter: summary,
    note: 'runner가 day 30/60/90에 resourceSnapshots 기록 필요 (PR4 적용)',
  };
}
