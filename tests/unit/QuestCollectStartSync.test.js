import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';
import QuestSystem from '../../js/systems/QuestSystem.js';

// 수집형 퀘스트(collect_item / collect_item_type)는 보드 보유량 스냅샷으로 진행도를 계산하고,
// 퀘스트 시작 시점에도 1회 동기화한다 — 0/N으로 보이다가 다음 획득에 한꺼번에 점프해
// 완료되는 표시 혼란 방지. (1회 한정 획득 아이템이 시작 전 획득돼도 완료 가능해야 한다)

const FOOD_QUEST = 'gq_food_1';      // 첫 끼니: food 3개 확보 (collect_item_type)
const BANDAGE_QUEST = 'gq_medical_1'; // 응급처치 준비: bandage 2개 (collect_item)

let nextId = 0;
function placeItem(definitionId, quantity = 1) {
  const instanceId = `test_item_${nextId += 1}`;
  GameState.cards[instanceId] = { instanceId, definitionId, quantity };
  const idx = GameState.board.middle.indexOf(null);
  GameState.board.middle[idx] = instanceId;
  return instanceId;
}

function activeEntry(questId) {
  return GameState.quests.active.find(q => q.id === questId);
}

describe('수집형 퀘스트 시작 시 보유분 동기화', () => {
  beforeEach(() => {
    GameState.quests.active = [];
    GameState.quests.completed = [];
    for (const id of Object.keys(GameState.cards)) {
      if (id.startsWith('test_item_')) delete GameState.cards[id];
    }
    GameState.board.middle = GameState.board.middle.map(id =>
      id?.startsWith?.('test_item_') ? null : id);
  });

  it('시작 시 보유 음식 2개가 즉시 진행도 2/3로 반영된다', () => {
    placeItem('instant_noodles');
    placeItem('canned_food');
    QuestSystem.startQuest(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST).progress).toBe(2);
    expect(GameState.quests.completed).not.toContain(FOOD_QUEST);
  });

  it('시작 시 이미 3개 이상 보유하면 즉시 완료된다', () => {
    placeItem('instant_noodles', 2);
    placeItem('canned_food');
    placeItem('energy_bar');
    QuestSystem.startQuest(FOOD_QUEST);
    expect(GameState.quests.completed).toContain(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST)).toBeUndefined();
  });

  it('2/3 상태에서 1개 획득하면 완료된다', () => {
    placeItem('instant_noodles');
    placeItem('canned_food');
    QuestSystem.startQuest(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST).progress).toBe(2);

    placeItem('instant_noodles');
    QuestSystem._updateCollectTypeQuests(GameData.items.instant_noodles);
    expect(GameState.quests.completed).toContain(FOOD_QUEST);
  });

  it('보유분이 없으면 진행도 0으로 시작한다', () => {
    QuestSystem.startQuest(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST).progress).toBe(0);
  });

  it('collect_item도 시작 시 보유분이 반영된다 (붕대 1/2)', () => {
    placeItem('bandage');
    QuestSystem.startQuest(BANDAGE_QUEST);
    expect(activeEntry(BANDAGE_QUEST).progress).toBe(1);
    expect(GameState.quests.completed).not.toContain(BANDAGE_QUEST);
  });

  it('collect_item: 시작 전 목표 수량을 이미 보유하면 즉시 완료된다', () => {
    placeItem('bandage', 2);
    QuestSystem.startQuest(BANDAGE_QUEST);
    expect(GameState.quests.completed).toContain(BANDAGE_QUEST);
  });
});
