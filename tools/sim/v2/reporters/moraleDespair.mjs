// === moraleDespair.mjs — K6 ===
// despair 진입 회차 비율 + blockExplore 누적 TP.
// 25% 초과 시 데스 스파이럴 의심 → 시스템 백승호 회복 메커니즘 권고.

export function summarizeMoraleDespair(traces) {
  const byChar = {};

  for (const t of traces) {
    const c = t.character;
    if (!byChar[c]) byChar[c] = { runs: 0, entered: 0, totalBlockExplore: 0 };
    byChar[c].runs += 1;

    const trace = t.moraleTierTrace ?? [];
    const despairSegments = trace.filter(s => s.tier === 'despair');
    if (despairSegments.length > 0) {
      byChar[c].entered += 1;
      for (const s of despairSegments) {
        byChar[c].totalBlockExplore += s.blockExploreCount ?? 0;
      }
    }
  }

  const summary = {};
  for (const [c, { runs, entered, totalBlockExplore }] of Object.entries(byChar)) {
    const pct = runs === 0 ? 0 : (entered / runs) * 100;
    summary[c] = {
      runs,
      enteredDespair: entered,
      pctEntered: Number(pct.toFixed(2)),
      avgBlockExplorePerRun: runs === 0 ? 0 : Number((totalBlockExplore / runs).toFixed(2)),
      warning: pct > 25 ? 'death spiral suspected (>25%)' : null,
    };
  }

  return {
    kpi: 'K6',
    byCharacter: summary,
    deathSpiralThresholdPct: 25,
    note: 'despair 진입 25% 초과 = 회복 메커니즘 부재 의심',
  };
}
