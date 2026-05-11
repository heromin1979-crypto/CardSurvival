// === reachableContent.mjs ===
// legendary 아이템·secretEnemies·secretCombinations 도달 회차 비율.
// 100회 표본 부족 의심 — Phase 3 결과 보고 후 PD 결정.

export function summarizeReachableContent(traces) {
  const totalRuns = traces.length;
  const legendary = new Set();
  const secretEnemy = new Set();
  const secretCombo = new Set();
  let legendaryRuns = 0;
  let secretEnemyRuns = 0;
  let secretComboRuns = 0;

  for (const t of traces) {
    const k = t.kpi ?? {};
    if (k.legendaryReached?.length) {
      legendaryRuns += 1;
      for (const id of k.legendaryReached) legendary.add(id);
    }
    if (k.secretEnemyKilled?.length) {
      secretEnemyRuns += 1;
      for (const id of k.secretEnemyKilled) secretEnemy.add(id);
    }
    if (k.secretComboFound?.length) {
      secretComboRuns += 1;
      for (const id of k.secretComboFound) secretCombo.add(id);
    }
  }

  return {
    kpi: 'reachableContent',
    totalRuns,
    legendary: {
      uniqueReached: legendary.size,
      reachedInRuns: legendaryRuns,
      pctRunsWithAny: totalRuns === 0 ? 0 : Number(((legendaryRuns / totalRuns) * 100).toFixed(2)),
      uniqueIds: [...legendary].sort(),
    },
    secretEnemy: {
      uniqueKilled: secretEnemy.size,
      killedInRuns: secretEnemyRuns,
      pctRunsWithAny: totalRuns === 0 ? 0 : Number(((secretEnemyRuns / totalRuns) * 100).toFixed(2)),
      uniqueIds: [...secretEnemy].sort(),
    },
    secretCombo: {
      uniqueFound: secretCombo.size,
      foundInRuns: secretComboRuns,
      pctRunsWithAny: totalRuns === 0 ? 0 : Number(((secretComboRuns / totalRuns) * 100).toFixed(2)),
      uniqueIds: [...secretCombo].sort(),
    },
    note: '100회 표본은 빈도 < 0.05 콘텐츠 신뢰구간이 넓음. 200~500회 차수 PD 결정 권고.',
  };
}
