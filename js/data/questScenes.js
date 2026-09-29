import GameState from '../core/GameState.js';
import GameData from './GameData.js';
import { NPC_ITEMS } from './npcs.js';
import { getLandmarkData, normalizeLandmarkKey } from './landmarks.js';

export const NEUTRAL_BACKGROUND = 'assets/images/locations/urban.png';

export function getDialogueLocation() {
  const districtId = GameState.location?.currentDistrict;
  const district = GameData.districts?.[districtId];
  const key = normalizeLandmarkKey(GameState.location?.currentLandmark);
  const landmark = getLandmarkData(GameState.location?.currentLandmark);
  const sub = landmark?.subLocations?.find(item => item.id === GameState.location?.currentSubLocation);
  return {
    locationName: sub?.name ?? landmark?.name ?? district?.name ?? '서울',
    background: sub ? sub.sceneImage ?? `assets/images/sublocations/${sub.id}.png`
      : key === 'basecamp' ? 'assets/images/landmarks/basecamp.png'
      : district ? `assets/images/landmarks/lm_${key || districtId}.png` : NEUTRAL_BACKGROUND,
  };
}

// 명시된 NPC만 화자로 사용한다. 독백에 임의의 인물을 배정하지 않는다.
export function createQuestScene(def, phase, { bonusGranted = false, options } = {}) {
  const speakerId = def.scene?.speakerId ?? def.objective?.npcId;
  const npc = NPC_ITEMS[speakerId];
  const narrativeKey = phase === 'complete' && bonusGranted && def.narrative?.completeBonus ? 'completeBonus' : phase;
  const choices = phase === 'branch'
    ? (options ?? def.branchOptions ?? []).map(option => ({
      id: option.id ?? option.setsFlag,
      label: option.label,
      description: [option.desc, option.recruitNpc ? '동반자 합류' : '', option.warning].filter(Boolean).join('\n'),
    }))
    : [{ id: 'continue', label: phase === 'start' ? '요청 확인' : '기록 확인' }];
  return {
    ...getDialogueLocation(),
    id: `${def.id}:${phase}`, questId: def.id, speakerId: npc ? speakerId : null,
    speakerName: npc?.name ?? (def.scene?.radio ? '무전' : '생존 기록'),
    icon: npc?.icon ?? '📖', title: def.title,
    eyebrow: phase === 'branch' ? '선택의 갈림길' : phase === 'start' ? '새로운 목표' : '단계 보고',
    text: phase === 'branch' ? '이 선택은 이후 이야기를 결정합니다.' : def.narrative?.[narrativeKey] ?? def.desc ?? '',
    detail: phase === 'start' ? [def.desc, def.actionHint].filter(Boolean).join('\n\n') : '',
    choices, dismissible: phase !== 'branch',
  };
}
