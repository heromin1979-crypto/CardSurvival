import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import GameData from '../../js/data/GameData.js';
import QuestSystem from '../../js/systems/QuestSystem.js';
import QUESTS from '../../js/data/mainQuests/index.js';

beforeEach(() => {
  EventBus._listeners = {};
  GameState.quests = { active: [], completed: [] };
  GameState.flags = {};
  GameState.questProgress = null;
  GameState.subObjectiveProgress = {};
  GameState.npcs = { states: { old: { healed: true } } };
  GameState.player.characterId = 'doctor';
  GameState.time.day = 10;
  GameState.time.totalTP = 100;
  QuestSystem.resetForNewGame();
  QuestSystem.init();
  vi.spyOn(QuestSystem, '_checkCompletion').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

it.each([
  ['mq_soldier_02', 'barricade'],
  ['mq_homeless_02', 'campfire'],
  ['mq_chef_02', 'build_cooking_pot_stand'],
])('%s는 다른 구조물로 완료되지 않으며 실제 레시피로 진행된다', (id, recipe) => {
  QuestSystem.startQuest(id);
  const q = GameState.quests.active[0];
  QuestSystem._onCraft('water_purifier');
  expect(q.progress).toBe(0);
  expect(GameData.blueprints[recipe]).toBeDefined();
  QuestSystem._onCraft(recipe);
  expect(q.progress).toBe(1);
});

it('외래 환자 목표는 시작 이전 완치와 중복 이벤트를 재사용하지 않는다', () => {
  QuestSystem.startQuest('mq_doctor_05');
  const q = GameState.quests.active[0];
  expect(q.progress).toBe(0);
  EventBus.emit('npcWoundHealed', { npcId: 'old' });
  expect(q.progress).toBe(0);
  GameState.npcs.states.new = { healed: true };
  EventBus.emit('npcWoundHealed', { npcId: 'new' });
  expect(q.progress).toBe(1);
  const saved = JSON.parse(JSON.stringify(q));
  GameState.quests.active = [saved];
  QuestSystem._checkAllProgress();
  expect(saved.progress).toBe(1);
});

it('구세이브 진행 중 숫자는 새 목표 증거로 쓰지 않고 완료 이력은 보존한다', () => {
  GameState.quests.completed = ['mq_homeless_02'];
  GameState.quests.active = [
    { id: 'mq_doctor_05', progress: 1 },
    { id: 'mq_soldier_02', progress: 1 },
  ];
  QuestSystem._checkAllProgress();
  expect(GameState.quests.active.map(q => q.progress)).toEqual([0, 0]);
  expect(GameState.quests.completed).toEqual(['mq_homeless_02']);
});

it('소방관 치료는 붕대 수집이 아닌 실제 완치이고 메모 회상은 로프로 재생하지 않는다', () => {
  expect(QUESTS.mq_fire_06.objective.type).toBe('treat_npc');
  const listener = vi.fn();
  EventBus.on('showCinematic', listener);
  GameState.player.characterId = 'engineer';
  QuestSystem._triggerFlashbackIfAny('mq_eng_07');
  expect(listener).not.toHaveBeenCalled();
});

it('소방관 치료 보상은 실제 완치 후 한 번 지급되고 기존 완료 저장은 재지급하지 않는다', () => {
  QuestSystem._checkCompletion.mockRestore();
  GameState.npcs.states = {};
  GameState.player.characterId = 'firefighter';
  GameState.player.hp = { current: 100, max: 100 };
  const reward = vi.spyOn(GameState, 'modStat').mockImplementation(() => {});
  vi.spyOn(GameState, 'createCardInstance').mockReturnValue(null);
  QuestSystem.startQuest('mq_fire_06');
  expect(GameState.quests.completed).not.toContain('mq_fire_06');
  GameState.npcs.states.resident = { healed: true };
  EventBus.emit('npcWoundHealed', { npcId: 'resident' });
  expect(GameState.quests.completed).toEqual(['mq_fire_06']);
  EventBus.emit('npcWoundHealed', { npcId: 'resident' });
  QuestSystem._checkAllProgress();
  QuestSystem.startQuest('mq_fire_06');
  expect(reward).toHaveBeenCalledTimes(1);
});
