// 크로스오버 메인 퀘스트(objective.type === 'npc_quest_complete')의 체크리스트와
// NPC 대화창 의뢰 단계가 항상 같은 판정을 내는지 검증한다.
// 두 화면이 각자 카운터를 들고 있어 "대화창은 미완료, 퀘스트창은 완료"로 갈리던 회귀를 막는다.
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus  from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import QuestSystem from '../../js/systems/QuestSystem.js';
import NPCQuestSystem, { isNpcQuestStepComplete } from '../../js/systems/NPCQuestSystem.js';
import NPCS from '../../js/data/npcs.js';
import MAIN_QUESTS from '../../js/data/mainQuests/index.js';

const NURSE_QUEST = NPCS.npc_nurse.quests.find(q => q.id === 'nurse_quest_emergency');
const MQ = MAIN_QUESTS.mq_doctor_02;

function resetWorld() {
  EventBus._listeners = {};
  GameState.cards = {};
  GameState._nextId = 1;
  GameState.board = {
    top: Array(10).fill(null),
    environment: [null, null, null],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.flags = { mapFragments: [] };
  GameState.quests = { active: [], completed: ['mq_doctor_01'], failed: [] };
  GameState.subObjectiveProgress = {};
  GameState.questProgress = null;
  // 의사는 characters.js homeDist가 dongjak — CharCreate가 시작 구를 여기에만 시딩한다
  GameState.location.currentDistrict  = 'dongjak';
  GameState.location.districtsVisited = ['dongjak'];
  GameState.npcs = {
    states: {
      npc_nurse: { spawned: true, dismissed: false, trust: 2, activeQuest: 'nurse_quest_emergency' },
    },
  };
  QuestSystem.resetForNewGame();
  QuestSystem.init();   // 리스너를 비웠으므로 크로스오버 구독을 다시 건다
}

function place(definitionId, quantity = 1) {
  const inst = GameState.createCardInstance(definitionId, { quantity });
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  return inst;
}

/** 퀘스트창 체크리스트 상태 */
function panelState() {
  QuestSystem._reevaluateSubObjectives();
  const flags = GameState.subObjectiveProgress.mq_doctor_02 ?? {};
  return MQ.subObjectives.map(so => flags[so.id] === true);
}

/** 간호사 대화창 체크리스트 상태 */
function dialogState() {
  return NURSE_QUEST.steps.map(step => isNpcQuestStepComplete(step));
}

describe('mq_doctor_02 ↔ nurse_quest_emergency 판정 동기화', () => {
  beforeEach(resetWorld);

  it('체크리스트는 NPC 의뢰 step에 1:1로 묶여 있다', () => {
    expect(MQ.objective).toMatchObject({
      type: 'npc_quest_complete', npcId: 'npc_nurse', questId: 'nurse_quest_emergency',
    });
    expect(MQ.subObjectives.map(so => so.npcStep)).toEqual([0, 1, 2]);
    expect(MQ.subObjectives.every(so => so.match === undefined)).toBe(true);
  });

  it('시작 구(동작구)는 두 화면 모두에서 방문으로 인정된다', () => {
    QuestSystem.startQuest('mq_doctor_02');
    expect(panelState()[2]).toBe(true);
    expect(dialogState()[2]).toBe(true);
  });

  it('붕대를 5개 획득 후 소진하면 두 화면 모두 미완료로 돌아간다', () => {
    QuestSystem.startQuest('mq_doctor_02');

    const inst = place('bandage', 5);
    expect(panelState()[0]).toBe(true);
    expect(dialogState()[0]).toBe(true);

    // 2개만 남기고 사용 — 누적 카운터를 보던 시절 퀘스트창만 완료로 남았다
    GameState.cards[inst.instanceId].quantity = 2;
    expect(dialogState()[0]).toBe(false);
    expect(panelState()[0]).toBe(false);
  });

  it('세 단계 모두 두 화면의 판정이 일치한다', () => {
    QuestSystem.startQuest('mq_doctor_02');
    place('bandage', 5);
    expect(panelState()).toEqual(dialogState());

    place('first_aid_kit', 2);
    expect(panelState()).toEqual(dialogState());
    expect(dialogState()).toEqual([true, true, true]);
  });

  it('메인 퀘스트가 완료돼도 미달성 체크리스트를 완료로 덮지 않는다', () => {
    QuestSystem.startQuest('mq_doctor_02');
    GameState.location.districtsVisited = [];   // 동작구 미방문 상태로 가정

    EventBus.emit('npcQuestCompleted', { npcId: 'npc_nurse', questId: 'nurse_quest_emergency' });

    expect(GameState.quests.completed).toContain('mq_doctor_02');
    expect(GameState.subObjectiveProgress.mq_doctor_02?.so_d02_03).not.toBe(true);
  });
});

describe('visit_district 판정 원천', () => {
  beforeEach(resetWorld);

  it('QuestSystem은 별도 방문 카운터를 들지 않는다', () => {
    expect(QuestSystem._progress.visitedDistricts).toBeUndefined();
    expect([...QuestSystem._matchState().visitedDistricts]).toEqual(['dongjak']);
  });

  it('이동으로 추가된 구도 매처 입력에 반영된다', () => {
    GameState.location.districtsVisited.push('mapo');
    const so = { id: 'so_x', match: { type: 'visit_district', districtId: 'mapo' } };
    expect(QuestSystem._matchSubObjective(so, QuestSystem._matchState(), {})).toBe(true);
  });
});
