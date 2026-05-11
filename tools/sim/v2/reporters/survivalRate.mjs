// === survivalRate.mjs — K1 ===
// 직업별 100일 생존율 + 신뢰구간.

export function summarizeSurvivalRate(traces) {
  const byChar = {};
  for (const t of traces) {
    const c = t.character;
    if (!byChar[c]) byChar[c] = { total: 0, alive: 0 };
    byChar[c].total += 1;
    if (t.alive) byChar[c].alive += 1;
  }

  const summary = {};
  for (const [c, { total, alive }] of Object.entries(byChar)) {
    const rate = total === 0 ? 0 : alive / total;
    // Wilson score interval 95% (단순화: ±1.96·sqrt(p(1-p)/n))
    const se = total === 0 ? 0 : Math.sqrt(rate * (1 - rate) / total);
    const ci = 1.96 * se;
    summary[c] = {
      runs: total,
      survived: alive,
      rate: Number(rate.toFixed(4)),
      ratePct: Number((rate * 100).toFixed(2)),
      ci95Pct: Number((ci * 100).toFixed(2)),
    };
  }

  // 직업 간 격차 (max - min)
  const rates = Object.values(summary).map(s => s.rate);
  const gap = rates.length === 0 ? 0 : Math.max(...rates) - Math.min(...rates);

  return {
    kpi: 'K1',
    byCharacter: summary,
    crossCharacterGapPct: Number((gap * 100).toFixed(2)),
    targetRangeMin: 0.10,
    targetRangeMax: 0.20,
    targetGapMaxPct: 5.0,
    note: 'BALANCE.design.survivalRateTarget Min/Max 0.10~0.20 / 직업 격차 5%p 이내 사수',
  };
}
