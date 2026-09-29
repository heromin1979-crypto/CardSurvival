export function validateProgressionSupplies(districts, landmarks, supplies, items) {
  const errors = [];
  const validItems = (entries, label) => {
    for (const item of entries ?? []) {
      if (!items[item.definitionId] || !Number.isInteger(item.qty) || item.qty <= 0 || item.minQty != null || item.maxQty != null) errors.push(`${label}: 잘못된 고정 수량/아이템 ${item.definitionId}`);
    }
  };
  const policy = (value, label) => {
    if (!value || !['finite', 'renewable', 'trade'].includes(value.type) || !Number.isInteger(value.capacity) || value.capacity <= 0) errors.push(`${label}: 잘못된 공급 정책/재고`);
    if (value?.type !== 'finite' && (!Number.isInteger(value?.restockTP) || value.restockTP <= 0)) errors.push(`${label}: 재입고 주기 누락`);
  };
  for (const [districtId, district] of Object.entries(districts)) {
    const ids = new Set();
    for (const reward of district.explorationYields ?? []) {
      if (!reward.id || ids.has(reward.id) || !Number.isInteger(reward.version) || reward.version < 1) errors.push(`${districtId}: 보상 ID/청구 버전 누락 또는 중복`);
      ids.add(reward.id);
      validItems(reward.items, `${districtId}:${reward.id}`);
      if (reward.discovery && (!supplies[reward.discovery] || supplies[reward.discovery].districtId !== districtId || reward.at !== 100)) errors.push(`${districtId}: 잘못된 discovery 참조 ${reward.discovery}`);
    }
  }
  for (const [id, source] of Object.entries(supplies)) {
    policy(source, id);
    if (!districts[source.districtId] || !Number.isInteger(source.tpCost) || source.tpCost < 1 || !source.items?.length) errors.push(`${id}: 구/시간/물품 누락`);
    validItems(source.items, id);
    validItems(source.costs, id);
    if (source.seasons && (!Array.isArray(source.seasons) || !source.seasons.length || source.seasons.some(season => !['spring', 'summer', 'autumn', 'winter'].includes(season)))) errors.push(`${id}: 잘못된 공급 계절`);
    if (source.type === 'trade' && !source.costs?.length) errors.push(`${id}: 교환 대가 누락`);
    if (source.discoveryRequired && !districts[source.districtId]?.explorationYields?.some(reward => reward.discovery === id)) errors.push(`${id}: 발견 보상 연결 누락`);
  }
  for (const [key, landmark] of Object.entries(landmarks)) if (key !== 'basecamp') policy(landmark.supplyPolicy, key);
  return errors;
}
