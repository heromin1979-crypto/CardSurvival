import { describe, expect, it } from 'vitest';
import { getVisibleSubLocations } from '../../js/data/landmarks.js';

describe('세부장소 가시성 필터', () => {
  it('requiresHiddenLocation이 없는 세부장소는 발견 목록과 무관하게 노출된다', () => {
    const visible = getVisibleSubLocations('lm_dongjak', []);
    const ids = visible.map(s => s.id);
    expect(ids).toContain('dongjak_memorial');
    expect(ids).toContain('dongjak_hall');
    expect(ids).toContain('dongjak_storage');
    expect(ids).toContain('dongjak_office');
    expect(ids).toContain('dongjak_forest');
  });

  it('발견 목록 인자를 생략해도 동작한다', () => {
    expect(getVisibleSubLocations('lm_dongjak').length).toBeGreaterThan(0);
  });

  it('존재하지 않는 랜드마크 키는 빈 배열을 반환한다', () => {
    expect(getVisibleSubLocations('lm_does_not_exist', [])).toEqual([]);
    expect(getVisibleSubLocations(null, [])).toEqual([]);
  });

  it('district-keyed 랜드마크는 lm_ 접두사를 붙여도 조회된다', () => {
    expect(getVisibleSubLocations('gangnam', []).length).toBeGreaterThan(0);
    expect(getVisibleSubLocations('lm_gangnam', []).length)
      .toBe(getVisibleSubLocations('gangnam', []).length);
  });

  it('지하 벙커는 발견 전 노출되지 않는다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', []).map(s => s.id);
    expect(ids).not.toContain('dongjak_bunker');
  });

  it('지하 벙커는 벙커를 발견한 뒤 노출된다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', ['hidden_dongjak_cemetery_vault']).map(s => s.id);
    expect(ids).toContain('dongjak_bunker');
  });

  it('무관한 장소를 발견해도 지하 벙커는 잠긴 채다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', ['hidden_jongno_royal_vault']).map(s => s.id);
    expect(ids).not.toContain('dongjak_bunker');
  });
});
