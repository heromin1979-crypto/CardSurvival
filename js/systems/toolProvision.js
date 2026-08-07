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
