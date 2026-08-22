// === BAITABLE ===
// 미끼를 넣어 두고 쓰는 채집형 도구(통발·쥐덫·비둘기 올가미·골목 함정)의 공통 판정.
// 남은 횟수는 인스턴스의 _baitCharges 하나로 통일한다 — 어느 미끼가 어느 도구에
// 걸렸는지 인스턴스가 직접 들고 있어야 도구를 여러 개 놓아도 서로 간섭하지 않는다.
//
// 용량 선언 위치가 둘로 갈리는 이유: 덫은 발동 규칙 전체가 trapData에 모여 있고,
// 통발은 trapData 없이 FishingSystem이 직접 도는 구조물이다.
import GameData from '../data/GameData.js';

/** 미끼를 받는 도구면 상한, 아니면 0 */
export function getBaitCapacity(def) {
  return def?.trapData?.baitCapacity ?? def?.baitCapacity ?? 0;
}

export function isBaitable(def) {
  return getBaitCapacity(def) > 0;
}

/** def가 받는 미끼 태그 목록. 통발처럼 trapData가 없으면 def.baitTags를 본다. */
export function getBaitTags(def) {
  return def?.trapData?.baitTags ?? def?.baitTags ?? [];
}

// 거절 사유에 쓸 한글 라벨. CraftUI의 용어 사전은 UI 계층이라 데이터에서 끌어올 수 없고,
// 미끼로 쓰이는 태그는 넷뿐이라 여기 둔다.
const BAIT_TAG_KO = Object.freeze({
  food:     '조리·가공 식품',
  food_raw: '생식 재료',
  meat:     '고기',
  bait:     '낚시 미끼',
});

/** 받는 미끼를 사람이 읽을 수 있는 문구로 */
export function describeBaitTags(def) {
  return getBaitTags(def).map(t => BAIT_TAG_KO[t] ?? t).join('·');
}

/** srcDef가 tgtDef의 미끼로 쓸 수 있는지 */
export function acceptsBait(tgtDef, srcDef) {
  const tags = getBaitTags(tgtDef);
  return tags.length > 0 && (srcDef?.tags ?? []).some(t => tags.includes(t));
}

/** 인스턴스의 미끼 상태. 미끼를 받지 않는 도구면 null */
export function baitState(inst) {
  const def = GameData?.items?.[inst?.definitionId];
  const capacity = getBaitCapacity(def);
  if (!capacity) return null;
  return { charges: inst._baitCharges ?? 0, capacity };
}
