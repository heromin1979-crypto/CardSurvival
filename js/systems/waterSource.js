// === WATER SOURCE ===
// 수원지(개울 등)에서 지금 물을 뜰 수 있는지 판정한다.
// 마른 개울도 카드 자체는 보드에 남는다 — 비가 오면 되살아나기 때문에
// (WeatherSystem._refillDryStreams) 카드 존재만으로는 급수 가능 여부를 알 수 없다.
// 표시(카드 배지)와 실제 판정(집수 드래그)이 각자 다른 기준을 쓰다가 마른 개울에
// "수집 가능"이 붙는 불일치가 생겼으므로, 두 소비처가 이 함수만 보게 한다.

export function isWaterSource(def) {
  return def?.subtype === 'water_source';
}

// 마름 판정은 태그(dry_stream으로 전환된 상태)와 잔량 양쪽을 본다.
// 잔량 소진과 태그 전환은 상호작용 시점에 함께 일어나지만, 소진된 직후의
// 인스턴스가 아직 전환 전일 수 있어 잔량도 마름으로 취급한다.
export function isDriedUp(def, inst = null) {
  if (def?.tags?.includes('dry')) return true;
  return inst != null && (inst.quantity ?? 1) <= 0;
}

export function canCollectWater(def, inst = null) {
  return isWaterSource(def) && !isDriedUp(def, inst);
}
