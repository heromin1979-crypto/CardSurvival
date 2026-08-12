// 이동형 목표(visit_district / visit_landmark)는 "퀘스트를 받은 뒤 도착했는가"로 판정한다.
// districtsVisited(생애 누적)로 판정하던 시절에는 예전에 스쳐간 구, 심지어 시작 구까지
// 세이브 로드만으로 퀘스트가 완료되고 보상이 지급됐다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import EventBus  from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import QuestSystem from '../../js/systems/QuestSystem.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import { validateMainQuestSchema } from '../../js/data/validate.js';
import MAIN_QUESTS from '../../js/data/mainQuests/index.js';
import { normalizeLandmarkKey } from '../../js/data/landmarks.js';

function resetWorld() {
  EventBus._listeners = {};
  GameState.time = { day: 1, totalTP: 0, tpInDay: 0, hour: 6, isPaused: false };
  GameState.quests = { active: [], completed: [], failed: [] };
  GameState.subObjectiveProgress = {};
  GameState.questProgress = null;
  GameState.flags = {};
  GameState.location.currentDistrict  = 'dongjak';
  GameState.location.districtsVisited = ['dongjak'];
  GameState.location.districtArrivals = { dongjak: 0 };
  GameState.location.landmarkArrivals = {};
  GameState.location.currentLandmark  = null;
  QuestSystem.resetForNewGame();
  QuestSystem.init();
}

/** 랜드마크 진입 — ExploreSystem.enterLandmark가 하는 두 가지(도착 기록 + 이벤트)를 재현 */
function enterLandmark(landmarkId, atTp) {
  GameState.time.totalTP = atTp;
  GameState.recordLandmarkArrival(landmarkId);
  EventBus.emit('landmarkEntered', { landmarkId });
}

/** mq_doctor_09: 목표 = 마포 방문 */
function startMapoQuest(atTp) {
  GameState.time.totalTP = atTp;
  GameState.quests.completed = ['mq_doctor_08'];
  QuestSystem.startQuest('mq_doctor_09');
  return GameState.quests.active.find(q => q.id === 'mq_doctor_09');
}

describe('visit_district — 퀘스트 시작 이후 도착만 인정', () => {
  beforeEach(resetWorld);

  it('퀘스트를 받기 전에 지나간 구는 세이브 로드로 완료되지 않는다', () => {
    GameState.time.totalTP = 40;
    GameState.recordDistrictArrival('mapo');   // 퀘스트 전에 마포 통과

    startMapoQuest(200);
    EventBus.emit('loaded', {});

    expect(GameState.quests.completed).not.toContain('mq_doctor_09');
    expect(GameState.quests.active.map(q => q.id)).toContain('mq_doctor_09');
    expect(GameState.subObjectiveProgress.mq_doctor_09?.so_d09_02).not.toBe(true);
  });

  it('퀘스트를 받은 뒤 도착하면 완료된다', () => {
    startMapoQuest(200);

    GameState.time.totalTP = 260;
    GameState.recordDistrictArrival('mapo');
    EventBus.emit('districtChanged', { districtId: 'mapo' });

    expect(GameState.quests.completed).toContain('mq_doctor_09');
    expect(GameState.subObjectiveProgress.mq_doctor_09?.so_d09_02).toBe(true);
  });

  it('구버전 세이브(도착 기록 없음)는 로드로 완료되지 않고 다음 이동에서 완료된다', () => {
    startMapoQuest(200);
    delete GameState.location.districtArrivals;   // 구버전 세이브 형태
    GameState.location.districtsVisited = ['dongjak', 'mapo'];

    EventBus.emit('loaded', {});
    expect(GameState.quests.completed).not.toContain('mq_doctor_09');

    GameState.time.totalTP = 260;
    GameState.recordDistrictArrival('mapo');
    EventBus.emit('districtChanged', { districtId: 'mapo' });
    expect(GameState.quests.completed).toContain('mq_doctor_09');
  });
});

describe('visit_landmark — 박상훈 하사와 현충원 (mq_doctor_side_soldier)', () => {
  beforeEach(resetWorld);

  function startSideQuest(atTp = 300) {
    GameState.time.totalTP = atTp;
    GameState.quests.completed = ['mq_doctor_01'];
    QuestSystem.startQuest('mq_doctor_side_soldier');
  }

  it('목표가 동작구가 아니라 국립현충원(lm_dongjak)이다', () => {
    const q = MAIN_QUESTS.mq_doctor_side_soldier;
    expect(q.objective).toMatchObject({ type: 'visit_landmark', landmarkId: 'lm_dongjak' });
    expect(q.subObjectives.find(so => so.id === 'so_dss_02').match)
      .toEqual({ type: 'visit_landmark', landmarkId: 'lm_dongjak' });
    expect(q.locationHint.landmarkId).toBe('lm_dongjak');
  });

  it('동작구에 머무는 것만으로는 완료되지 않는다 (시작 구 자동 완료 차단)', () => {
    startSideQuest();
    EventBus.emit('loaded', {});
    GameState.recordDistrictArrival('dongjak');
    EventBus.emit('districtChanged', { districtId: 'dongjak' });

    expect(GameState.quests.completed).not.toContain('mq_doctor_side_soldier');
    expect(GameState.flags.minjun_radio_received).not.toBe(true);
  });

  it('같은 구의 다른 랜드마크(보라매병원) 진입으로는 완료되지 않는다', () => {
    startSideQuest();
    enterLandmark('lm_boramae_hospital', 320);

    expect(GameState.quests.completed).not.toContain('mq_doctor_side_soldier');
    expect(GameState.subObjectiveProgress.mq_doctor_side_soldier?.so_dss_02).not.toBe(true);
  });

  it('국립현충원에 진입하면 완료되고 무전 플래그가 선다', () => {
    startSideQuest();
    enterLandmark('lm_dongjak', 320);

    expect(GameState.quests.completed).toContain('mq_doctor_side_soldier');
    expect(GameState.flags.minjun_radio_received).toBe(true);
  });

  it('퀘스트를 받기 전 현충원 방문 이력은 인정하지 않는다', () => {
    enterLandmark('lm_dongjak', 100);   // 퀘스트 전 방문
    startSideQuest(300);
    EventBus.emit('loaded', {});

    expect(GameState.quests.completed).not.toContain('mq_doctor_side_soldier');
    expect(GameState.subObjectiveProgress.mq_doctor_side_soldier?.so_dss_02).not.toBe(true);
  });
});

describe('visit_landmark — 광진 낚시 거점 (mq_homeless_05)', () => {
  beforeEach(() => {
    resetWorld();
    GameState.location.currentDistrict  = 'gwangjin';
    GameState.location.districtsVisited = ['gwangjin'];
    GameState.location.districtArrivals = { gwangjin: 0 };
  });

  function startFishingQuest(atTp = 300) {
    GameState.time.totalTP = atTp;
    GameState.quests.completed = ['mq_homeless_04'];
    QuestSystem.startQuest('mq_homeless_05');
  }

  it('목표가 광진구가 아니라 한강(lm_hangang_gwangjin)이다', () => {
    const q = MAIN_QUESTS.mq_homeless_05;
    expect(q.objective).toMatchObject({ type: 'visit_landmark', landmarkId: 'lm_hangang_gwangjin' });
    expect(q.locationHint).toMatchObject({ districtId: 'gwangjin', landmarkId: 'lm_hangang_gwangjin' });
  });

  it('광진구에 머무는 것만으로는 완료되지 않는다', () => {
    startFishingQuest();
    EventBus.emit('loaded', {});
    GameState.recordDistrictArrival('gwangjin');
    EventBus.emit('districtChanged', { districtId: 'gwangjin' });

    expect(GameState.quests.completed).not.toContain('mq_homeless_05');
  });

  it('어린이대공원 진입으로는 완료되지 않는다', () => {
    startFishingQuest();
    enterLandmark('lm_gwangjin', 320);
    expect(GameState.quests.completed).not.toContain('mq_homeless_05');
  });

  it('한강에 진입하면 완료된다', () => {
    startFishingQuest();
    enterLandmark('lm_hangang_gwangjin', 320);
    expect(GameState.quests.completed).toContain('mq_homeless_05');
  });
});

describe('랜드마크 키 정규화 — lm_ 접두사 유무가 판정을 가르지 않는다', () => {
  beforeEach(resetWorld);

  it('LANDMARK_DATA 키(접두사 없음)와 카드 아이템 ID(lm_)는 같은 랜드마크로 취급된다', () => {
    // 런타임 진입 키는 항상 카드 아이템 ID(lm_*)인데 LANDMARK_DATA는 hangang_gwangjin으로 저장한다.
    // 정규화가 없으면 퀘스트 데이터 표기에 따라 조용히 미완료로 남는다.
    expect(normalizeLandmarkKey('lm_hangang_gwangjin')).toBe('hangang_gwangjin');
    expect(normalizeLandmarkKey('hangang_gwangjin')).toBe('hangang_gwangjin');
    expect(normalizeLandmarkKey('basecamp')).toBe('basecamp');

    GameState.time.totalTP = 200;
    GameState.recordLandmarkArrival('lm_hangang_gwangjin');   // 런타임 표기로 기록

    const entry = { startTp: 100 };
    for (const id of ['lm_hangang_gwangjin', 'hangang_gwangjin']) {
      const so = { id: 'so_x', match: { type: 'visit_landmark', landmarkId: id } };
      expect(QuestSystem._matchSubObjective(so, QuestSystem._matchState(), entry)).toBe(true);
    }
  });

  it('검증기는 두 표기를 모두 알려진 랜드마크로 인정한다', () => {
    const known = new Set(['hangang_gwangjin']);   // LANDMARK_DATA 형태
    for (const id of ['hangang_gwangjin', 'lm_hangang_gwangjin']) {
      const r = validateMainQuestSchema(
        { id: 'mq_x', objective: { type: 'visit_landmark', landmarkId: id } },
        { knownLandmarks: known },
      );
      expect(r.ok).toBe(true);
    }
  });
});

describe('ExploreSystem.enterLandmark 배선', () => {
  beforeEach(resetWorld);

  it('진입 시 도착 시각을 남기고 landmarkEntered를 발행한다', () => {
    const origNight = ExploreSystem._checkNight;
    const origTopRow = ExploreSystem._updateTopRowForLandmark;
    ExploreSystem._checkNight = () => true;
    ExploreSystem._updateTopRowForLandmark = () => {};
    GameState.board = { top: Array(10).fill(null), environment: [null, null, null], middle: Array(20).fill(null), bottom: Array(20).fill(null) };
    GameState.locationFloors = {};
    GameState.time.totalTP = 420;

    const seen = [];
    EventBus.on('landmarkEntered', ({ landmarkId }) => seen.push(landmarkId));

    try {
      ExploreSystem.enterLandmark('lm_dongjak', { autoEnterSub: false });
    } finally {
      ExploreSystem._checkNight = origNight;
      ExploreSystem._updateTopRowForLandmark = origTopRow;
    }

    expect(seen).toEqual(['lm_dongjak']);
    // 저장 키는 정규화된 형태 — 이벤트 payload는 런타임 표기 그대로 흘린다
    expect(GameState.location.landmarkArrivals[normalizeLandmarkKey('lm_dongjak')]).toBe(420);
  });
});

describe('validateMainQuestSchema — visit_landmark 랜드마크 ID', () => {
  const known = new Set(['lm_dongjak']);

  it('알 수 없는 objective.landmarkId를 잡는다', () => {
    const r = validateMainQuestSchema(
      { id: 'mq_x', objective: { type: 'visit_landmark', landmarkId: 'lm_typo' } },
      { knownLandmarks: known },
    );
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/objective\.landmarkId "lm_typo" unknown/);
  });

  it('알 수 없는 subObjective match.landmarkId를 잡는다', () => {
    const r = validateMainQuestSchema(
      {
        id: 'mq_x',
        objective: { type: 'visit_landmark', landmarkId: 'lm_dongjak' },
        subObjectives: [{ id: 'so_a', text: 'A', match: { type: 'visit_landmark', landmarkId: 'lm_typo' } }],
      },
      { knownLandmarks: known },
    );
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/match\.landmarkId "lm_typo" unknown/);
  });
});

describe('GameState.recordDistrictArrival', () => {
  beforeEach(resetWorld);

  it('새 게임 시작 시 CharCreate가 landmarkArrivals를 비운다', () => {
    // location은 NEW_GAME_RESET_KEYS 대상이 아니므로 CharCreate가 직접 비워야 한다
    const src = readFileSync(new URL('../../js/screens/CharCreate.js', import.meta.url), 'utf8');
    expect(src).toMatch(/gs\.location\.landmarkArrivals\s*=\s*\{\}/);
    expect(src).toMatch(/gs\.location\.districtArrivals\s*=\s*\{\s*\[districtId\]:\s*0\s*\}/);
  });

  it('방문 이력과 도착 시각을 함께 남기고, 재방문 시 시각을 갱신한다', () => {
    GameState.time.totalTP = 50;
    GameState.recordDistrictArrival('mapo');
    expect(GameState.location.districtsVisited).toEqual(['dongjak', 'mapo']);
    expect(GameState.location.districtArrivals.mapo).toBe(50);

    GameState.time.totalTP = 90;
    GameState.recordDistrictArrival('mapo');
    expect(GameState.location.districtsVisited).toEqual(['dongjak', 'mapo']);  // 중복 없음
    expect(GameState.location.districtArrivals.mapo).toBe(90);                 // 최근 도착으로 갱신
  });
});
