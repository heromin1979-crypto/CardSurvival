// 가방 아이템별 휴대 2페이지 슬롯 수
// 페이지 단위 휴대 구조에서 page2 길이를 결정.
// EquipmentSystem._applyBagEffect와 GameState.deserialize 마이그레이션이 공유한다.
export const BAG_EXTRA_SLOTS = {
  small_bag:     8,
  messenger_bag: 11,
  backpack:      14,
  duffel_bag:    17,
  military_bag:  20,
};

export function lookupBagExtraSlots(def) {
  if (!def) return 0;
  return BAG_EXTRA_SLOTS[def.id] ?? def.bagSlots ?? 0;
}
