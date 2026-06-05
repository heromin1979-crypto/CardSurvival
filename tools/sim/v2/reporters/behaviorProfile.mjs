// === behaviorProfile.mjs ===
// 직업별 player AI 행동 프로파일 — runner의 aiLog 행동 문자열을 파싱·집계.
// 주의: 시뮬 AI는 day 4~8 아사로 중후반 미도달 → combat·move·quest.completed·후반이벤트는
//       구조적으로 ~0. explore·craft·consume·quest.started만 실데이터.

function parseAction(s) {
  if (typeof s !== 'string') return { type: 'unknown' };
  let m = s.match(/^explore:([^:]+):\+(\d+)$/);
  if (m) return { type: 'explore', district: m[1], loot: Number(m[2]) };
  m = s.match(/^move:([^-]+)->(.+)$/);
  if (m) return { type: 'move', from: m[1], to: m[2] };
  m = s.match(/^(cook|t1Convert):.+->(.+)$/);
  if (m) return { type: 'craft', output: m[2] };
  m = s.match(/^(eat|drink):(.+)$/);
  if (m) return { type: 'consume', item: m[2] };
  m = s.match(/^moraleBoost:(.+)\(\+\d+\)$/);
  if (m) return { type: 'consume', item: m[1] };
  m = s.match(/^fish:\+1:([^@]+)@(.+)$/);
  if (m) return { type: 'fish', fish: m[1], district: m[2] };
  return { type: s.split(':')[0] };
}

const sumValues = obj => Object.values(obj).reduce((a, n) => a + n, 0);

export function summarizeBehaviorProfile(traces) {
  const byChar = {};
  for (const t of traces) {
    const c = t.character;
    if (!byChar[c]) {
      byChar[c] = {
        runs: 0, totalActions: 0,
        actionCounts: {}, exploreByDistrict: {}, craftedItems: {},
        consumedItems: {}, moveRoutes: {}, fishByDistrict: {},
        questsStarted: 0, questsCompleted: 0, combats: 0, totalKills: 0,
      };
    }
    const b = byChar[c];
    b.runs += 1;
    const beh = t.behavior ?? {};
    b.questsStarted   += beh.questsStarted ?? 0;
    b.questsCompleted += beh.questsCompleted ?? 0;
    b.combats         += beh.combats ?? 0;
    b.totalKills      += beh.totalKills ?? 0;

    for (const entry of t.aiLog ?? []) {
      const p = parseAction(entry.action);
      b.totalActions += 1;
      b.actionCounts[p.type] = (b.actionCounts[p.type] ?? 0) + 1;
      if (p.type === 'explore')      b.exploreByDistrict[p.district] = (b.exploreByDistrict[p.district] ?? 0) + p.loot;
      else if (p.type === 'craft')   b.craftedItems[p.output] = (b.craftedItems[p.output] ?? 0) + 1;
      else if (p.type === 'consume') b.consumedItems[p.item] = (b.consumedItems[p.item] ?? 0) + 1;
      else if (p.type === 'move')    b.moveRoutes[`${p.from}->${p.to}`] = (b.moveRoutes[`${p.from}->${p.to}`] ?? 0) + 1;
      else if (p.type === 'fish')    b.fishByDistrict[p.district] = (b.fishByDistrict[p.district] ?? 0) + 1;
    }
  }

  const summary = {};
  for (const [c, b] of Object.entries(byChar)) {
    summary[c] = {
      runs: b.runs,
      avgActionsPerRun: b.runs ? Number((b.totalActions / b.runs).toFixed(1)) : 0,
      actionCounts: b.actionCounts,
      exploreByDistrict: b.exploreByDistrict,
      craftedItems: b.craftedItems,
      consumedItems: b.consumedItems,
      moves: { total: sumValues(b.moveRoutes), routes: b.moveRoutes },
      fishing: { total: sumValues(b.fishByDistrict), byDistrict: b.fishByDistrict },
      combat: { totalKills: b.totalKills, combats: b.combats },
      quests: { started: b.questsStarted, completed: b.questsCompleted },
    };
  }

  return {
    kpi: 'behaviorProfile',
    byCharacter: summary,
    note: '시뮬 AI day 4~8 아사로 중후반 미도달 → combat·move·후반이벤트(siege/raid) 구조적 ~0. explore·craft·consume·quest(시작+초반완료)·fishing은 실데이터.',
  };
}
