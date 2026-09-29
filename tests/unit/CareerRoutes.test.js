import { describe, expect, it } from 'vitest';
import { getCareerRoute } from '../../js/data/careerRoutes.js';
import TOPICS from '../../js/data/careerDialogues.js';
import { DISTRICTS } from '../../js/data/districts.js';

describe('직업별 다음 동선', () => {
  for (const topic of Object.values(TOPICS).filter(t => t.kind === 'core')) {
    it(`${topic.characterId}: 첫 행동 전에는 현재 거점, 완료 뒤에는 실제 인접 구를 거쳐 다음 단서로 안내한다`, () => {
      const state = { player: { characterId: topic.characterId }, location: { currentDistrict: topic.districtId }, flags: {} };
      expect(getCareerRoute(state).path).toEqual([topic.districtId]);
      state.flags.careerDialogues = { topics: { [topic.id]: { status: 'completed' } } };
      const route = getCareerRoute(state);
      expect(route.path.at(-1)).toBe(topic.nextDistrict);
      expect(route.hint).not.toBe(topic.hint);
      for (let i = 1; i < route.path.length; i++) expect(DISTRICTS[route.path[i - 1]].adjacentDistricts).toContain(route.path[i]);
    });
  }
  it('대화가 없는 직업이나 유효하지 않은 지역은 경로를 꾸며내지 않는다', () => {
    expect(getCareerRoute({ player: { characterId: 'unknown' } })).toBeNull();
  });
});
