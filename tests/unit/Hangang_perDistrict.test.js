import { describe, it, expect } from 'vitest';
import LANDMARK_DATA, { getLandmarkData, isHangangLandmark } from '../../js/data/landmarks.js';
import { buildAllHangangCards } from '../../js/data/locationCardFactory.js';

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

  it('구별 엔트리의 lootTable은 참조를 공유하지 않는다', () => {
    const a = LANDMARK_DATA['hangang_gangnam'].subLocations[0].lootTable;
    const b = LANDMARK_DATA['hangang_mapo'].subLocations[0].lootTable;
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it('isHangangLandmark가 구별 키를 한강으로 판정한다', () => {
    expect(isHangangLandmark('hangang_gangnam')).toBe(true);
    expect(isHangangLandmark('lm_hangang_yongsan')).toBe(true);
    expect(isHangangLandmark('lm_gangnam')).toBe(false);
    expect(isHangangLandmark(null)).toBe(false);
  });
});

describe('한강 구별 카드 팩토리', () => {
  it('lm_hangang_<구> 카드 10개를 생성한다', () => {
    const cards = buildAllHangangCards();
    for (const d of HANGANG_DISTRICTS) {
      expect(cards).toHaveProperty(`lm_hangang_${d}`);
    }
  });

  it('각 카드는 isHangang·districtId·landmark 플래그를 가진다', () => {
    const card = buildAllHangangCards()['lm_hangang_mapo'];
    expect(card.isHangang).toBe(true);
    expect(card.districtId).toBe('mapo');
    expect(card.landmark).toBe(true);
    expect(card.type).toBe('location');
    expect(card.subtype).toBe('landmark');
  });
});

import ITEMS from '../../js/data/items.js';

describe('items.js 한강 카드 병합', () => {
  it('구별 lm_hangang_<구> 카드가 ITEMS에 병합된다', () => {
    for (const d of HANGANG_DISTRICTS) {
      expect(ITEMS).toHaveProperty(`lm_hangang_${d}`);
    }
  });

  it('단일 lm_hangang 정의는 제거되었다', () => {
    expect(ITEMS).not.toHaveProperty('lm_hangang');
  });
});

describe('한강 진입 판정 계약', () => {
  it('구별 currentLandmark 값을 한강으로 인식한다', () => {
    expect(isHangangLandmark('hangang_gangnam')).toBe(true);
    expect(isHangangLandmark('lm_hangang_mapo')).toBe(true);
  });
  it('한강이 아닌 랜드마크는 false', () => {
    expect(isHangangLandmark('lm_gangnam')).toBe(false);
    expect(isHangangLandmark('basecamp')).toBe(false);
  });
});

import ExploreSystem from '../../js/systems/ExploreSystem.js';
import GameState     from '../../js/core/GameState.js';

// _updateTopRowCards는 GameState 싱글턴을 직접 변이하므로
// 각 테스트 전에 board와 cards를 초기화해 격리한다.
function resetBoard() {
  GameState.board.top   = Array(10).fill(null);
  GameState.board.middle = Array(20).fill(null);
  GameState.board.bottom = Array(20).fill(null);
  GameState.cards       = {};
  GameState._nextId     = 1;
}

describe('ExploreSystem._updateTopRowCards — hasFishing 구에 구별 한강 카드 배치', () => {
  beforeEach(resetBoard);

  it('gangnam(hasFishing)은 top row에 lm_hangang_gangnam 인스턴스를 배치한다', () => {
    ExploreSystem._updateTopRowCards('gangnam');
    const topInstIds = GameState.board.top.filter(Boolean);
    const topDefs = topInstIds.map(id => GameState.cards[id]?.definitionId);
    expect(topDefs).toContain('lm_hangang_gangnam');
  });

  it('jongno(hasFishing 없음)는 top row에 lm_hangang_* 카드를 배치하지 않는다', () => {
    ExploreSystem._updateTopRowCards('jongno');
    const topInstIds = GameState.board.top.filter(Boolean);
    const topDefs = topInstIds.map(id => GameState.cards[id]?.definitionId);
    expect(topDefs.some(d => d?.startsWith('lm_hangang_'))).toBe(false);
  });
});
