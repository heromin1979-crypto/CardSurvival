// === deathDay.mjs — K3, K5 ===
// 사망 회차 한정 평균 사망일 + 중앙값 + 사망 원인 분포.

function median(arr) {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

export function summarizeDeathDay(traces) {
  const byChar = {};
  for (const t of traces) {
    const c = t.character;
    if (!byChar[c]) byChar[c] = { deathDays: [], causes: {} };
    if (!t.alive && t.deathDay != null) {
      byChar[c].deathDays.push(t.deathDay);
      const cause = t.deathCause ?? t.endingId ?? 'unknown';
      byChar[c].causes[cause] = (byChar[c].causes[cause] ?? 0) + 1;
    }
  }

  const summary = {};
  for (const [c, { deathDays, causes }] of Object.entries(byChar)) {
    const mean = deathDays.length === 0 ? null
      : Number((deathDays.reduce((a, b) => a + b, 0) / deathDays.length).toFixed(1));
    summary[c] = {
      deaths: deathDays.length,
      meanDay: mean,
      medianDay: median(deathDays),
      causeDistribution: causes,
    };
  }

  return {
    kpi: 'K3,K5',
    byCharacter: summary,
  };
}
