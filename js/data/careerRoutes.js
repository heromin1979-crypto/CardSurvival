import TOPICS from './careerDialogues.js';
import { DISTRICTS } from './districts.js';

export const NEXT_CAREER_STEPS = {
  doctor: '동작에서 깨끗한 물과 치료 소모품을 보충하세요. 마포 원정 전에는 병원 의뢰와 새 환자 상태를 확인하세요.',
  soldier: '도봉 집결지에 식량과 방벽을 마련하세요. 이후 용산 통신 거점에서 무전 공정을 진행합니다. 철물과 전선을 챙기세요.',
  firefighter: '은평에서 붕대와 이동 식수를 보충하세요. 용산의 집결 기록과 구조 장비가 가족을 찾을 다음 단서입니다.',
  homeless: '광진 회수품 교환과 저장 공정을 이어가세요. 송파 도하 전에 식수와 결속재를 비축하세요.',
  chef: '중구에서 식수·쌀을 보충하고 정기 배식과 보관 공정을 준비하세요. 이후 동대문 시장의 새로운 식재료 공급처를 찾습니다.',
  engineer: '용산 작업대에서 발전 공정을 준비하세요. 전선·철물은 잔해 분해와 회수품 교환으로 보충하고, 이후 성동의 공장 단서를 찾습니다.',
};

export function getCareerRoute(state) {
  const topic = TOPICS[`${state.player?.characterId}_core`];
  const current = state.location?.currentDistrict;
  if (!topic || !DISTRICTS[current]) return null;
  const complete = state.flags?.careerDialogues?.topics?.[topic.id]?.status === 'completed';
  const destination = complete ? topic.nextDistrict : topic.districtId;
  const queue = [[current]], visited = new Set([current]);
  while (queue.length) {
    const path = queue.shift(), tail = path.at(-1);
    if (tail === destination) return { topicId: topic.id, path, destination, hint: complete ? NEXT_CAREER_STEPS[topic.characterId] : topic.hint, complete };
    for (const next of DISTRICTS[tail]?.adjacentDistricts ?? []) {
      if (visited.has(next)) continue;
      visited.add(next); queue.push([...path, next]);
    }
  }
  return null;
}
