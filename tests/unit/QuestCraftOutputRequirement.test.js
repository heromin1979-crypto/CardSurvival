import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';
import EventBus from '../../js/core/EventBus.js';
import MAIN_QUESTS from '../../js/data/mainQuests/index.js';
import QuestSystem from '../../js/systems/QuestSystem.js';
import { validateMainQuestSchema } from '../../js/data/validate.js';

const questId = 'mq_doctor_side_end';
let listeners;
let objective;
let savedObjective;
beforeEach(() => {
  listeners = EventBus._listeners;
  EventBus._listeners = {};
  savedObjective = MAIN_QUESTS[questId].objective;
  // 최종 연구는 프로젝트와 제작의 교집합으로 이동했다. 제작 판정의 회귀 계약은 독립 목표로 유지한다.
  objective = { type: 'craft_item', definitionId: 'plague_vaccine', count: 1 };
  MAIN_QUESTS[questId].objective = objective;
  GameState.quests.active = [{ id: questId, progress: 0 }];
  GameState.quests.completed = [];
  GameState.subObjectiveProgress = {};
  QuestSystem.resetForNewGame();
  QuestSystem.init();
  vi.spyOn(QuestSystem, '_checkCompletion').mockImplementation(() => {});
  GameData.blueprints.test_craft = {
    id: 'test_craft', category: 'medical',
    output: [{ definitionId: 'bandage', qty: 2 }, { definitionId: 'plague_vaccine', qty: 5 }],
  };
});
afterEach(() => {
  vi.restoreAllMocks();
  MAIN_QUESTS[questId].objective = savedObjective;
  delete GameData.blueprints.test_craft;
  EventBus._listeners = listeners;
});

describe('제작 목표의 산출물과 완료 횟수', () => {
  it.each([['purify_medicine', 'purified_medicine'], ['wind_copper_coil', 'copper_coil']])('실제 고급 청사진 %s가 메인과 서브 목표에 연결된다', (blueprintId, definitionId) => {
    const match = { type: 'craft_item', definitionId, count: 1 };
    MAIN_QUESTS[questId].objective = match;
    expect(GameData.blueprints[blueprintId]).toBeDefined();
    EventBus.emit('craftComplete', { blueprintId });
    expect(GameState.quests.active[0].progress).toBe(1);
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(true);
  });
  it('붕대 제작으로 백신 목표가 진행되지 않는다', () => {
    QuestSystem._onCraft('wrap_bandage');
    expect(GameState.quests.active[0].progress).toBe(0);
  });
  it('실제 백신 레시피는 메인/서브 목표를 모두 만족한다', () => {
    EventBus.emit('craftComplete', { blueprintId: 'synth_plague_vaccine' });
    expect(GameState.quests.active[0].progress).toBe(1);
    expect(QuestSystem._matchSubObjective({ match: objective }, QuestSystem._matchState())).toBe(true);
  });
  it('단일 객체 산출물도 판정하고 중복된 산출물은 횟수를 늘리지 않는다', () => {
    MAIN_QUESTS[questId].objective = { ...objective, count: 2 };
    GameData.blueprints.test_craft.output = { definitionId: 'plague_vaccine', qty: 5 };
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(1);
    expect(QuestSystem._matchSubObjective({ match: MAIN_QUESTS[questId].objective }, QuestSystem._matchState())).toBe(false);
    GameData.blueprints.test_craft.output = [{ definitionId: 'plague_vaccine', qty: 2 }, { definitionId: 'plague_vaccine', qty: 3 }];
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(2);
    expect(QuestSystem._matchSubObjective({ match: MAIN_QUESTS[questId].objective }, QuestSystem._matchState())).toBe(true);
  });
  it('존재하지 않는 레시피 이벤트와 사용되지 않는 별칭 이벤트는 집계하지 않는다', () => {
    EventBus.emit('craftComplete', { blueprintId: 'missing' });
    EventBus.emit('itemCrafted', { recipeId: 'plague_vaccine', category: 'medical', qty: 5 });
    expect(GameState.quests.active[0].progress).toBe(0);
    expect(QuestSystem._matchSubObjective({ match: objective }, QuestSystem._matchState())).toBe(false);
  });
  it('구버전 저장은 확실한 단일 조건만 유지하고 교집합을 추정하지 않는다', () => {
    GameState.questProgress = { craftedRecipes: ['plague_vaccine'], craftedCategoryCounts: { medical: 3 } };
    QuestSystem._restoreProgressFromSave();
    expect(QuestSystem._matchSubObjective({ match: objective }, QuestSystem._matchState())).toBe(true);
    expect(QuestSystem._matchSubObjective({ match: { ...objective, category: 'medical' } }, QuestSystem._matchState())).toBe(false);
    expect(QuestSystem._matchSubObjective({ match: { ...objective, count: 2 } }, QuestSystem._matchState())).toBe(false);
  });
  it('복수 산출물의 두 번째 정답도 인정하고 수량 대신 완료 횟수를 센다', () => {
    MAIN_QUESTS[questId].objective = { ...objective, count: 2 };
    const match = MAIN_QUESTS[questId].objective;
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(1);
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(false);
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(2);
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(true);
  });
  it.each(['definitionId', 'blueprintId'])('%s와 category를 동시에 만족해야 한다', field => {
    const match = { type: 'craft_item', [field]: field === 'definitionId' ? 'plague_vaccine' : 'test_craft', category: 'structure', count: 1 };
    MAIN_QUESTS[questId].objective = match;
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(0);
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(false);
    GameData.blueprints.test_craft.category = 'structure';
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(1);
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(true);
  });
  it('레시피 ID를 산출물 ID로 해석하지 않는다', () => {
    const match = { type: 'craft_item', definitionId: 'test_craft', count: 1 };
    MAIN_QUESTS[questId].objective = match;
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(0);
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(false);
  });
  it('카테고리 제작도 산출 수량이 아닌 이벤트당 1회 누적된다', () => {
    const match = { type: 'craft_item', category: 'medical', count: 2 };
    MAIN_QUESTS[questId].objective = match;
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(GameState.quests.active[0].progress).toBe(1);
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(false);
  });
  it('완료되어 active에서 빠진 퀘스트는 다시 처리하지 않는다', () => {
    GameState.quests.active = [];
    GameState.quests.completed = [questId];
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(QuestSystem._checkCompletion).not.toHaveBeenCalled();
    expect(GameState.quests.completed).toEqual([questId]);
  });
  it('저장/복원 후 제작 횟수와 필터가 유지된다', () => {
    const match = { type: 'craft_item', definitionId: 'plague_vaccine', category: 'medical', count: 2 };
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    QuestSystem.resetForNewGame();
    QuestSystem._restoreProgressFromSave();
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(false);
    EventBus.emit('craftComplete', { blueprintId: 'test_craft' });
    expect(QuestSystem._matchSubObjective({ match }, QuestSystem._matchState())).toBe(true);
  });
});

describe('제작 목표 데이터 계약', () => {
  const ctx = { knownItems: new Set(['plague_vaccine']), blueprints: { vaccine_recipe: { category: 'medical', output: [{ definitionId: 'plague_vaccine', qty: 2 }] } } };
  it.each([
    { definitionId: 'vaccine_recipe' }, { blueprintId: 'missing' },
    { definitionId: 'plague_vaccine', category: 'structure' }, { count: 0 },
  ])('잘못된 필터를 메인/서브 목표 양쪽에서 거부한다: %j', fields => {
    const match = { type: 'craft_item', count: 1, ...fields };
    const result = validateMainQuestSchema({ id: 'test', objective: match, subObjectives: [{ id: 's', text: '제작', match }] }, ctx);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('objective'))).toBe(true);
    expect(result.errors.some(e => e.includes('subObjectives'))).toBe(true);
  });
  it('실제 산출물 또는 명시적인 레시피 필터를 허용한다', () => {
    for (const fields of [{ definitionId: 'plague_vaccine' }, { blueprintId: 'vaccine_recipe' }]) {
      expect(validateMainQuestSchema({ id: 'test', objective: { type: 'craft_item', category: 'medical', count: 2, ...fields } }, ctx).ok).toBe(true);
    }
  });
});
