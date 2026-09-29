// 공급처의 재고는 물품 수량이 아니라 표시된 묶음을 회수할 수 있는 횟수다.
export const PROGRESSION_SUPPLIES = {
  guro_recovery: { name: '구로 부품 회수함', districtId: 'guro', type: 'finite', capacity: 3, tpCost: 2, items: [{ definitionId: 'circuit_board', qty: 1 }] },
  yongsan_recovery: { name: '용산 부품 회수함', districtId: 'yongsan', type: 'finite', capacity: 3, tpCost: 2, items: [{ definitionId: 'circuit_board', qty: 1 }] },
  market_food: { name: '시장 보존식 교환', districtId: 'junggoo', type: 'trade', capacity: 3, restockTP: 72, tpCost: 1, costs: [{ definitionId: 'scrap_metal', qty: 3 }], items: [{ definitionId: 'canned_food', qty: 1 }] },
  market_salt: { name: '시장 소금 교환', districtId: 'junggoo', type: 'trade', capacity: 3, restockTP: 72, tpCost: 1, costs: [{ definitionId: 'scrap_metal', qty: 2 }], items: [{ definitionId: 'salt', qty: 2 }] },
  garden_materials: { name: '강동 공동 텃밭 채집', districtId: 'gangdong', type: 'renewable', capacity: 2, restockTP: 72, tpCost: 3, items: [{ definitionId: 'soil_bag', qty: 3 }, { definitionId: 'vegetable_seed', qty: 2 }] },
  filter_recovery: { name: '성동 정수 부품 회수함', districtId: 'seongdong', type: 'finite', capacity: 2, tpCost: 2, items: [{ definitionId: 'water_filter', qty: 1 }] },
  guro_parts: { name: '구로 부품 공급처', districtId: 'guro', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{ definitionId: 'scrap_metal', qty: 3 }], items: [{ definitionId: 'circuit_board', qty: 2 }] },
  yongsan_parts: { name: '전자상가 부품 공급처', districtId: 'yongsan', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{ definitionId: 'scrap_metal', qty: 3 }], items: [{ definitionId: 'circuit_board', qty: 2 }] },
  junggu_market: { name: '시장 식재료 공급처', districtId: 'junggoo', discoveryRequired: true, type: 'trade', capacity: 4, restockTP: 72, tpCost: 1, costs: [{ definitionId: 'scrap_metal', qty: 2 }], items: [{ definitionId: 'salt', qty: 3 }, { definitionId: 'vegetable_seed', qty: 1 }] },
  gangdong_garden: { name: '농자재 공급처', districtId: 'gangdong', discoveryRequired: true, type: 'renewable', capacity: 3, restockTP: 72, tpCost: 3, items: [{ definitionId: 'soil_bag', qty: 4 }, { definitionId: 'grain_seed', qty: 2 }] },
  jungnang_filter: { name: '정수 자재 채집처', districtId: 'jungrang', discoveryRequired: true, type: 'renewable', capacity: 3, restockTP: 72, tpCost: 3, items: [{ definitionId: 'sand', qty: 3 }, { definitionId: 'charcoal', qty: 2 }] },
  gangnam_medical: {name: '강남 의료 소모재 창고', districtId: 'gangnam', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'cloth_scrap', qty: 4}, {definitionId: 'alcohol_solution', qty: 2}]},
  gangbuk_herbs: {name: '강북 약초 채집처', districtId: 'gangbuk', discoveryRequired: true, type: 'renewable', capacity: 2, restockTP: 72, tpCost: 3, items: [{definitionId: 'herb', qty: 3}, {definitionId: 'nettle', qty: 2}], seasons: ['spring', 'summer', 'autumn']},
  gangseo_hangar: {name: '강서 격납고 회수 지점', districtId: 'gangseo', discoveryRequired: true, type: 'trade', capacity: 2, restockTP: 96, tpCost: 3, costs: [{definitionId: 'wire', qty: 2}], items: [{definitionId: 'scrap_metal', qty: 4}, {definitionId: 'spring', qty: 2}, {definitionId: 'rubber', qty: 1}]},
  gwanak_research: {name: '관악 연구 재료 채집처', districtId: 'gwanak', discoveryRequired: true, type: 'renewable', capacity: 2, restockTP: 96, tpCost: 3, items: [{definitionId: 'herb', qty: 2}, {definitionId: 'charcoal', qty: 1}], seasons: ['spring', 'summer', 'autumn']},
  gwangjin_exchange: {name: '광진 낚시꾼 교환처', districtId: 'gwangjin', discoveryRequired: true, type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'salt', qty: 2}, {definitionId: 'rope', qty: 1}]},
  geumcheon_metal: {name: '금천 금속 선별 작업장', districtId: 'geumcheon', discoveryRequired: true, type: 'trade', capacity: 2, restockTP: 72, tpCost: 3, costs: [{definitionId: 'wire', qty: 2}], items: [{definitionId: 'scrap_metal', qty: 6}, {definitionId: 'spring', qty: 1}]},
  nowon_household: {name: '노원 생활 물자 교환처', districtId: 'nowon', discoveryRequired: true, type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'cloth_scrap', qty: 3}, {definitionId: 'plastic', qty: 2}, {definitionId: 'empty_bottle', qty: 1}]},
  dobong_mountain: {name: '도봉 산지 채집처', districtId: 'dobong', discoveryRequired: true, type: 'renewable', capacity: 2, restockTP: 96, tpCost: 3, items: [{definitionId: 'herb', qty: 2}, {definitionId: 'nettle', qty: 2}, {definitionId: 'wood', qty: 1}], seasons: ['spring', 'summer', 'autumn']},
  dongdaemun_textile: {name: '동대문 직물 작업장', districtId: 'dongdaemun', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'cloth', qty: 3}, {definitionId: 'thread', qty: 2}]},
  dongjak_garden: {name: '동작 병원 정원 생산 기반', districtId: 'dongjak', discoveryRequired: true, type: 'renewable', capacity: 2, restockTP: 72, tpCost: 3, items: [{definitionId: 'herb', qty: 3}, {definitionId: 'herb_seed', qty: 1}, {definitionId: 'soil_bag', qty: 1}], seasons: ['spring', 'summer', 'autumn']},
  mapo_repair: {name: '마포 수리점 회수처', districtId: 'mapo', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'circuit_board', qty: 1}, {definitionId: 'wire', qty: 2}, {definitionId: 'rubber', qty: 1}]},
  seodaemun_lab: {name: '서대문 연구실 재료 교환처', districtId: 'seodaemun', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'alcohol_solution', qty: 3}, {definitionId: 'glass_shard', qty: 2}, {definitionId: 'rubber', qty: 1}]},
  seocho_power: {name: '서초 전원 장치 회수처', districtId: 'seocho', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 4}], items: [{definitionId: 'battery', qty: 1}, {definitionId: 'circuit_board', qty: 1}]},
  seongdong_workshop: {name: '성동 정밀 작업장', districtId: 'seongdong', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 3, costs: [{definitionId: 'wire', qty: 2}], items: [{definitionId: 'scrap_metal', qty: 5}, {definitionId: 'charcoal', qty: 2}, {definitionId: 'spring', qty: 1}]},
  seongbuk_workshop: {name: '성북 주민 공동 작업장', districtId: 'seongbuk', discoveryRequired: true, type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'cloth', qty: 2}, {definitionId: 'thread', qty: 2}, {definitionId: 'rope', qty: 1}]},
  songpa_logistics: {name: '송파 타워 물류시설', districtId: 'songpa', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 5}], items: [{definitionId: 'battery', qty: 2}, {definitionId: 'rubber', qty: 2}, {definitionId: 'wire', qty: 2}]},
  yangcheon_materials: {name: '양천 생활 자재 회수처', districtId: 'yangcheon', discoveryRequired: true, type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'wood', qty: 3}, {definitionId: 'nail', qty: 4}, {definitionId: 'cloth', qty: 1}]},
  yeongdeungpo_broadcast: {name: '영등포 방송 예비 장비실', districtId: 'yeongdeungpo', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 4}], items: [{definitionId: 'circuit_board', qty: 2}, {definitionId: 'wire', qty: 3}]},
  eunpyeong_shelter: {name: '은평 대피소 재배 자재 교환처', districtId: 'eunpyeong', discoveryRequired: true, type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 3}], items: [{definitionId: 'soil_bag', qty: 3}, {definitionId: 'herb_seed', qty: 2}, {definitionId: 'cloth', qty: 1}]},
  jongno_signal: {name: '종로 경계·통신 거점', districtId: 'jongno', discoveryRequired: true, type: 'trade', capacity: 3, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 5}], items: [{definitionId: 'circuit_board', qty: 2}, {definitionId: 'battery', qty: 1}, {definitionId: 'empty_cartridge', qty: 2}]},
  yongsan_fuel: {name: '용산 발전 연료 교환', districtId: 'yongsan', type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 4}], items: [{definitionId: 'fuel_can', qty: 1}]},
  seongdong_fuel: {name: '성동 발전 연료 교환', districtId: 'seongdong', type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 4}], items: [{definitionId: 'fuel_can', qty: 1}]},
  eunpyeong_fuel: {name: '은평 발전 연료 교환', districtId: 'eunpyeong', type: 'trade', capacity: 2, restockTP: 72, tpCost: 2, costs: [{definitionId: 'scrap_metal', qty: 4}], items: [{definitionId: 'fuel_can', qty: 1}]},
};

export function createExplorationSupplyState() {
  return { version: 1, claims: [], discoveries: [], surveyed: [], stocks: {} };
}

export function milestoneClaimKey(districtId, reward) {
  return `${districtId}:${reward.id}:${reward.version}`;
}

export function migrateExplorationSupply(flags, location, districts) {
  const existing = flags.explorationSupply;
  const state = existing ?? createExplorationSupplyState();
  // 구세이브에서 이미 넘은 임계값과 조사 완료 장소는 소급 지급하지 않는다.
  for (const [id, district] of Object.entries(districts)) {
    for (const reward of district.explorationYields ?? []) {
      if (reward.at <= (flags.districtExploration?.[id] ?? 0)) {
        if (!existing) state.claims.push(milestoneClaimKey(id, reward));
        // 100% 구는 다시 임계값을 넘을 수 없으므로 접근권만 복구하고 물품은 지급하지 않는다.
        if (reward.discovery && !state.discoveries.includes(reward.discovery)) state.discoveries.push(reward.discovery);
      }
    }
  }
  if (!existing) state.surveyed = [...new Set((location?.subLocationsLooted ?? []).map(key => key.slice(key.indexOf(':') + 1)))];
  return state;
}

export function supplyStock(state, key, policy, totalTP) {
  const saved = state.stocks[key];
  if (!saved) return { remaining: policy.capacity, refillAt: totalTP + (policy.restockTP ?? 0) };
  if (policy.type !== 'finite' && policy.restockTP > 0 && totalTP >= saved.refillAt) {
    return { remaining: policy.capacity, refillAt: totalTP + policy.restockTP };
  }
  return { ...saved };
}
