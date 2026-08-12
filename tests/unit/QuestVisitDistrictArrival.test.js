// visit_district 목표는 "퀘스트를 받은 뒤 도착했는가"로 판정한다.
// districtsVisited(생애 누적)로 판정하던 시절에는 예전에 스쳐간 구, 심지어 시작 구까지
// 세이브 로드만으로 퀘스트가 완료되고 보상이 지급됐다.
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus  from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import QuestSystem from '../../js/systems/QuestSystem.js';

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
  QuestSystem.resetForNewGame();
  QuestSystem.init();
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

  it('시작 구가 목표인 퀘스트는 시작만으로 완료되지 않는다', () => {
    // mq_doctor_side_soldier: 목표 = dongjak = 의사 시작 구
    GameState.time.totalTP = 300;
    GameState.quests.completed = ['mq_doctor_01'];
    QuestSystem.startQuest('mq_doctor_side_soldier');
    EventBus.emit('loaded', {});

    expect(GameState.quests.completed).not.toContain('mq_doctor_side_soldier');
    expect(GameState.flags.minjun_radio_received).not.toBe(true);

    // 다른 구를 돌아 동작구로 재진입하면 완료
    GameState.time.totalTP = 340;
    GameState.recordDistrictArrival('dongjak');
    EventBus.emit('districtChanged', { districtId: 'dongjak' });
    expect(GameState.quests.completed).toContain('mq_doctor_side_soldier');
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

describe('GameState.recordDistrictArrival', () => {
  beforeEach(resetWorld);

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
