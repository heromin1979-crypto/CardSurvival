// === BASECAMP UPGRADES ===
// 거점 강화 레벨 1~5 정의

const BASECAMP_UPGRADES = [
  {
    level: 1,
    name:  '방어벽 기초',
    desc:  '기본 방어벽을 세웁니다. 조우 확률이 소폭 감소합니다.',
    icon:  '🪵',
    cost:  [
      { definitionId: 'wood',        qty: 5 },
      { definitionId: 'scrap_metal', qty: 5 },
      { definitionId: 'nail',        qty: 10 },
    ],
    effects: {
      encounterReduct: 0.05,   // 조우 확률 -5%
      noiseDecayBonus: 0.5,    // 소음 추가 감쇠 /TP
    },
  },
  {
    level: 2,
    name:  '강화 방어선',
    desc:  '방어벽을 강화합니다. 적의 침입 가능성이 크게 줄어듭니다.',
    icon:  '🧱',
    cost:  [
      { definitionId: 'wood',           qty: 8 },
      { definitionId: 'scrap_metal',    qty: 8 },
      { definitionId: 'reinforced_bar', qty: 2 },
    ],
    effects: {
      encounterReduct: 0.10,   // 누적 -10%
      noiseDecayBonus: 1.0,
    },
  },
  {
    level: 3,
    name:  '감시탑 설치',
    desc:  '감시탑에서 위협을 사전에 포착합니다. HP 소량 재생.',
    icon:  '🗼',
    cost:  [
      { definitionId: 'wood',           qty: 10 },
      { definitionId: 'reinforced_bar', qty: 3 },
      { definitionId: 'rope',           qty: 5 },
    ],
    effects: {
      encounterReduct: 0.15,   // 누적 -15%
      hpRegenPerTP:    2,      // HP +2/TP
      noiseDecayBonus: 1.5,
    },
  },
  {
    level: 4,
    name:  '생활 구역 정비',
    desc:  '안락한 생활 공간을 갖춥니다. 피로 회복 향상.',
    icon:  '🏕️',
    cost:  [
      { definitionId: 'leather',     qty: 5 },
      { definitionId: 'cloth',       qty: 8 },
      { definitionId: 'rope',        qty: 3 },
      { definitionId: 'scrap_metal', qty: 5 },
    ],
    effects: {
      encounterReduct:  0.20,   // 누적 -20%
      hpRegenPerTP:     3,
      fatigueRegenBonus: 3,     // 피로 회복 +3/TP
      noiseDecayBonus:  2.0,
    },
  },
  {
    level: 5,
    name:  '완전 요새화',
    desc:  '거점이 완전 요새가 됩니다. 모든 효과 극대화.',
    icon:  '🏰',
    cost:  [
      { definitionId: 'reinforced_bar',    qty: 5 },
      { definitionId: 'electronic_parts',  qty: 2 },
      { definitionId: 'scrap_metal',       qty: 10 },
      { definitionId: 'rope',              qty: 5 },
    ],
    effects: {
      encounterReduct:  0.30,   // 누적 -30%
      hpRegenPerTP:     5,
      fatigueRegenBonus: 5,
      moraleBonus:      3,      // 사기 +3/TP
      noiseDecayBonus:  3.0,
    },
  },
];

export default BASECAMP_UPGRADES;
