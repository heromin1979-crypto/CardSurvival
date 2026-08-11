// === DISTRICT ONCE LOOT ===
// 바닥에 남는 자원(환경물·잔해)은 구별로 한 번만 획득한다.
//
// 이 자원들은 쓰거나 분해해도 즉시 사라지지 않는다. 개울은 물이 마르면 dry_stream으로
// 바뀌어 카드가 남고 비가 오면 되살아나며, 잡초밭은 forage 쿨다운으로 재채취된다.
// 잔해는 분해 전까지 바닥을 점유한다. 그래서 재생형 구 lootTable에서 반복 획득하면
// 같은 지역에 자판기가 여러 대 쌓이고, 스택 가능한 개울은 quantity(=물 잔량)가 합산돼
// 비를 기다리는 설계 자체가 무력화된다.
//
// 개별 아이템에 필드를 심지 않고 type/tags로 판정하는 이유는 신규 잔해·환경물이 추가될 때
// 규칙에 자동으로 편입되게 하려는 것이다. 반복 획득이 옳은 예외는 def.districtOnce = false로 뺀다.

export function isDistrictOnceLoot(def) {
  if (!def) return false;
  if (def.districtOnce === false) return false;
  return def.type === 'environment' || !!def.tags?.includes('salvage');
}

export function districtOnceKey(districtId, definitionId) {
  return `${districtId}:${definitionId}`;
}

/**
 * 탐색 산출물에서 이미 획득한 구별 1회 자원과 같은 배치 내 중복을 제거한다.
 * 보너스 픽이 원본 항목을 복제하므로 이 필터는 보너스가 모두 붙은 뒤에 돌려야 한다.
 * @param {Array<{definitionId:string}>} loot
 * @param {string} districtId
 * @param {string[]} claimed - 이미 획득한 키 목록 (GameState.flags.districtOnceLoot)
 * @param {(id:string)=>object|null} getDef
 * @returns {{loot:Array, newKeys:string[]}} 필터된 산출물과 새로 기록할 키
 */
export function filterDistrictOnceLoot(loot, districtId, claimed, getDef) {
  const seen    = new Set(claimed ?? []);
  const newKeys = [];
  const kept    = [];

  for (const entry of loot ?? []) {
    if (!isDistrictOnceLoot(getDef(entry.definitionId))) {
      kept.push(entry);
      continue;
    }
    const key = districtOnceKey(districtId, entry.definitionId);
    if (seen.has(key)) continue;
    seen.add(key);
    newKeys.push(key);
    kept.push(entry);
  }

  return { loot: kept, newKeys };
}
