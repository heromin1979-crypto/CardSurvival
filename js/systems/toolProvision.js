// === TOOL PROVISION ===
// 청사진의 requiredTools 판정. 정확한 id 일치 외에, 상위 시설이 하위 도구 역할을
// 대신하는 경우(def.toolProvides)를 허용한다. 예: 수술대 → 의무 거점.
// "도구다"만 뜻하는 불리언으로는 어떤 역할을 대신하는지 알 수 없어 배열로 선언한다.
import GameData from '../data/GameData.js';

export function providesTool(definitionId, toolId) {
  if (!definitionId || !toolId) return false;
  if (definitionId === toolId) return true;
  return GameData.items[definitionId]?.toolProvides?.includes(toolId) ?? false;
}

// 연료가 바닥난 화기는 꺼진 상태다. 카드 자체는 재점화·연료 보충 대상으로 보드에
// 남기 때문에 존재 여부만으로는 불이 붙었는지 알 수 없어 내구도까지 봐야 한다.
// 구역 설치 구조물은 인스턴스 형태가 달라(id/durability) 값 두 개를 직접 받는다.
export function isUnlitFire(definitionId, durability) {
  const def = GameData.items[definitionId];
  if (def?.type !== 'structure' || def.subtype !== 'heat') return false;
  return (durability ?? 0) <= 0;
}
