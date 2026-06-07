// === strategies.mjs ===
// 시뮬 전략 비교용 플레이 전략 레지스트리.
// 각 전략은 playerAI.runDayAI(simInv, cfg)에 넘기는 knob 집합(cfg)이다.
//   exploresPerDay: 하루 탐색 시도 횟수
//   dangerCap:      진입 허용 최대 위험도 (이동 시)
//   roam:           'stay'(이동 안 함) | 'safe'(저위험 fresh 구역) | 'aggressive'(위험 감수)
//   fleePolicy:     조우 시 도주 우선 여부
//   prioritizeWater: 수분 더 일찍·자주 확보

export const STRATEGIES = [
  {
    id: 'homebody',
    name: '정착형',
    desc: '한 구역에 머물며 탐색만 (이동 안 함)',
    cfg: { exploresPerDay: 5, dangerCap: 1, roam: 'stay', fleePolicy: true, prioritizeWater: false },
  },
  {
    id: 'cautious',
    name: '안전 이동형',
    desc: '루팅 고갈 시 가장 안전한 인접 구역으로 이동',
    cfg: { exploresPerDay: 3, dangerCap: 2, roam: 'safe', fleePolicy: true, prioritizeWater: false },
  },
  {
    id: 'forager',
    name: '적극 채집형',
    desc: '위험 감수, 새 구역을 적극 순회하며 많이 탐색',
    cfg: { exploresPerDay: 5, dangerCap: 4, roam: 'aggressive', fleePolicy: false, prioritizeWater: false },
  },
  {
    id: 'evasive',
    name: '신중 회피형',
    desc: '탐색 최소화, 조우 시 무조건 도주',
    cfg: { exploresPerDay: 2, dangerCap: 2, roam: 'safe', fleePolicy: true, prioritizeWater: false },
  },
  {
    id: 'water_first',
    name: '물 우선형',
    desc: '수분 확보를 최우선, 안전 이동',
    cfg: { exploresPerDay: 3, dangerCap: 2, roam: 'safe', fleePolicy: true, prioritizeWater: true, eatThreshold: 30, eatMax: 1 },
  },
  {
    id: 'food_farmer',
    name: '식량 파밍형',
    desc: '식량 최우선 — 새 구역 적극 순회 + 영양 70 미만이면 가진 식량 다 먹기',
    cfg: { exploresPerDay: 6, dangerCap: 4, roam: 'aggressive', fleePolicy: false, prioritizeWater: false, eatThreshold: 70, eatMax: 6 },
  },
];

export function getStrategy(id) {
  return STRATEGIES.find((s) => s.id === id) ?? null;
}
