import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';
import QuestSystem from '../../js/systems/QuestSystem.js';

// 수집형 퀘스트(collect_item / collect_item_type)는 휴대(인벤토리, bottom 행) 보유량만 센다.
// 바닥(middle 행)에 놓인 미획득 아이템(시작 바닥 스폰 등)은 집계에서 제외.
// 퀘스트 시작 시점에도 1회 동기화해 0/N → 점프 완료되는 표시 혼란을 방지한다.

const FOOD_QUEST = 'gq_food_1';      // 첫 끼니: food 3개 확보 (collect_item_type)
const BANDAGE_QUEST = 'gq_medical_1'; // 응급처치 준비: bandage 2개 (collect_item)

let nextId = 0;
function placeItem(definitionId, quantity = 1, row = 'bottom') {
  const instanceId = `test_item_${nextId += 1}`;
  GameState.cards[instanceId] = { instanceId, definitionId, quantity };
  const idx = GameState.board[row].indexOf(null);
  GameState.board[row][idx] = instanceId;
  return instanceId;
}

function activeEntry(questId) {
  return GameState.quests.active.find(q => q.id === questId);
}

describe('수집형 퀘스트 인벤토리 집계 + 시작 시 동기화', () => {
  beforeEach(() => {
    GameState.quests.active = [];
    GameState.quests.completed = [];
    for (const id of Object.keys(GameState.cards)) {
      if (id.startsWith('test_item_')) delete GameState.cards[id];
    }
    for (const row of ['middle', 'bottom']) {
      GameState.board[row] = GameState.board[row].map(id =>
        id?.startsWith?.('test_item_') ? null : id);
    }
  });

  it('시작 시 휴대 음식 2개가 즉시 진행도 2/3로 반영된다', () => {
    placeItem('instant_noodles');
    placeItem('canned_food');
    QuestSystem.startQuest(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST).progress).toBe(2);
    expect(GameState.quests.completed).not.toContain(FOOD_QUEST);
  });

  it('바닥(middle)의 음식은 미획득이므로 카운트하지 않는다 (군인 시작 통조림 시나리오)', () => {
    placeItem('instant_noodles', 2);          // 휴대 라면 2
    placeItem('canned_food', 1, 'middle');    // 바닥 통조림 1 — 제외되어야 함
    QuestSystem.startQuest(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST).progress).toBe(2);
    expect(GameState.quests.completed).not.toContain(FOOD_QUEST);
  });

  it('시작 시 휴대에 이미 3개 보유하면 즉시 완료된다', () => {
    placeItem('instant_noodles', 2);
    placeItem('energy_bar');
    QuestSystem.startQuest(FOOD_QUEST);
    expect(GameState.quests.completed).toContain(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST)).toBeUndefined();
  });

  it('2/3 상태에서 음식 1개 획득(휴대 배치) 시 완료된다', () => {
    placeItem('instant_noodles');
    placeItem('canned_food');
    QuestSystem.startQuest(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST).progress).toBe(2);

    placeItem('instant_noodles');
    QuestSystem._updateCollectTypeQuests(GameData.items.instant_noodles);
    expect(GameState.quests.completed).toContain(FOOD_QUEST);
  });

  it('바닥 음식을 휴대로 옮기면 재계산(_recountCollectQuests)으로 완료된다', () => {
    placeItem('instant_noodles', 2);
    const canId = placeItem('canned_food', 1, 'middle');
    QuestSystem.startQuest(FOOD_QUEST);
    expect(activeEntry(FOOD_QUEST).progress).toBe(2);

    // 바닥 → 휴대 이동 시뮬레이션 (cardMoved 경로)
    const from = GameState.board.middle.indexOf(canId);
    GameState.board.middle[from] = null;
    GameState.board.bottom[GameState.board.bottom.indexOf(null)] = canId;
    QuestSystem._recountCollectQuests();

    expect(GameState.quests.completed).toContain(FOOD_QUEST);
  });

  it('collect_item도 휴대만 센다 — 바닥 붕대는 제외', () => {
    placeItem('bandage');                 // 휴대 1
    placeItem('bandage', 1, 'middle');    // 바닥 1 — 제외
    QuestSystem.startQuest(BANDAGE_QUEST);
    expect(activeEntry(BANDAGE_QUEST).progress).toBe(1);
    expect(GameState.quests.completed).not.toContain(BANDAGE_QUEST);
  });

  it('collect_item: 휴대에 목표 수량 보유 시 시작 즉시 완료된다', () => {
    placeItem('bandage', 2);
    QuestSystem.startQuest(BANDAGE_QUEST);
    expect(GameState.quests.completed).toContain(BANDAGE_QUEST);
  });
});
