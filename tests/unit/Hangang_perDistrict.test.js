import { describe, it, expect } from 'vitest';
import LANDMARK_DATA, { getLandmarkData, isHangangLandmark } from '../../js/data/landmarks.js';

const HANGANG_DISTRICTS = ['gangnam','gangdong','gwangjin','mapo','seocho',
                           'seongdong','songpa','yeongdeungpo','yongsan','junggoo'];

describe('한강 구별 랜드마크 데이터', () => {
  it('구별 hangang_<구> 엔트리가 10개 존재한다', () => {
    for (const d of HANGANG_DISTRICTS) {
      expect(LANDMARK_DATA).toHaveProperty(`hangang_${d}`);
    }
  });

  it('단일 공용 hangang 엔트리는 더 이상 LANDMARK_DATA 키로 노출되지 않는다', () => {
    expect(LANDMARK_DATA).not.toHaveProperty('hangang');
  });

  it('각 구 엔트리는 isHangang 플래그와 sublocation 2개를 가진다', () => {
    for (const d of HANGANG_DISTRICTS) {
      const e = LANDMARK_DATA[`hangang_${d}`];
      expect(e.isHangang).toBe(true);
      expect(e.subLocations).toHaveLength(2);
    }
  });

  it('sublocation id는 구별 접미사로 유니크하다', () => {
    const e = LANDMARK_DATA['hangang_gangnam'];
    const ids = e.subLocations.map(s => s.id);
    expect(ids).toContain('hangang_fishing_spot_gangnam');
    expect(ids).toContain('hangang_riverside_gangnam');
  });

  it('낚싯대 보상 claimKey는 전 구 공유(hangang_rod)를 유지한다', () => {
    for (const d of HANGANG_DISTRICTS) {
      const e = LANDMARK_DATA[`hangang_${d}`];
      for (const sub of e.subLocations) {
        expect(sub.firstEnterReward.claimKey).toBe('hangang_rod');
      }
    }
  });

  it('getLandmarkData가 lm_hangang_<구>로 폴백 조회된다', () => {
    expect(getLandmarkData('lm_hangang_songpa')).toBe(LANDMARK_DATA['hangang_songpa']);
  });

  it('isHangangLandmark가 구별 키를 한강으로 판정한다', () => {
    expect(isHangangLandmark('hangang_gangnam')).toBe(true);
    expect(isHangangLandmark('lm_hangang_yongsan')).toBe(true);
    expect(isHangangLandmark('lm_gangnam')).toBe(false);
    expect(isHangangLandmark(null)).toBe(false);
  });
});
