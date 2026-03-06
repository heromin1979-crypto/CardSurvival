// === NODES — 서울 25개 구(區) 지역 시스템 ===
// districts.js 에서 DISTRICTS를 NODES로 래핑합니다.
// basecamp 노드 제거 — 구 단위 1계층 구조로 통일

import { DISTRICTS, SUB_LOCATIONS, generateDistrictLoot, generateSubLocationLoot } from './districts.js';

// NODES = DISTRICTS 전체 (25개 구)
const NODES = {};
for (const [id, d] of Object.entries(DISTRICTS)) {
  NODES[id] = { ...d, noiseGen: d.noiseGen ?? 3 };
}

/** 루팅 결과 생성 */
function generateRouteCards(nodeId) {
  if (DISTRICTS[nodeId]) return generateDistrictLoot(nodeId);
  if (SUB_LOCATIONS[nodeId]) return generateSubLocationLoot(nodeId);
  return [];
}

export { NODES, DISTRICTS, SUB_LOCATIONS, generateRouteCards };
export default NODES;
