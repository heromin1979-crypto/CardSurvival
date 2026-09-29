// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import QuestSystem from '../../js/systems/QuestSystem.js';
import NPCSystem from '../../js/systems/NPCSystem.js';
import DialogueScene from '../../js/ui/DialogueScene.js';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import MAIN_QUESTS from '../../js/data/mainQuests/index.js';
import { createQuestScene } from '../../js/data/questScenes.js';

const branchDef = MAIN_QUESTS.mq_soldier_10;
const click = () => document.querySelector('[data-scene-choice]').click();

describe('퀘스트 대화·분기 도메인', () => {
  beforeEach(() => {
    DialogueScene.reset();
    EventBus._listeners = {};
    document.body.innerHTML = '<div id="app"></div>';
    GameState.ui.modalOpen = false;
    GameState.ui.currentState = 'main';
    GameState.combat.active = false;
    GameState.quests = { active: [], completed: [], failed: [] };
    GameState.flags = {};
    GameState.subObjectiveProgress = {};
    GameState.time.day = 1;
    GameState.time.totalTP = 0;
    GameState.player.characterId = 'doctor';
    QuestSystem.resetForNewGame();
    vi.spyOn(GameState, 'modStat').mockImplementation(() => {});
    vi.spyOn(GameState, 'createCardInstance').mockReturnValue(null);
    vi.spyOn(NPCSystem, 'forceRecruit').mockImplementation(() => {});
    QuestSystem.init();
    DialogueScene.init();
  });
  afterEach(() => { DialogueScene.reset(); vi.restoreAllMocks(); });

  it('이미 완료된 NPC 의뢰는 시작→완료 순서로 표시하고 보상은 한 번만 지급한다', () => {
    GameState.flags.npcQuest_done_nurse_quest_emergency = true;
    QuestSystem.startQuest('mq_doctor_02');
    expect(DialogueScene._active.id).toBe('mq_doctor_02:start');
    expect(DialogueScene._queue[0].id).toBe('mq_doctor_02:complete');
    const count = GameState.modStat.mock.calls.length;
    click(); click();
    DialogueScene.enqueue(createQuestScene(MAIN_QUESTS.mq_doctor_02, 'complete'));
    click();
    QuestSystem.startQuest('mq_doctor_02');
    expect(GameState.modStat).toHaveBeenCalledTimes(count);
  });

  it('미결 분기는 완료 직후 저장 가능하고 잘못된 선택·연속 선택은 효과가 없다', () => {
    const entry = { id: branchDef.id, progress: branchDef.objective.count };
    GameState.quests.active.push(entry);
    QuestSystem._checkCompletion(entry, branchDef);
    const saved = JSON.parse(JSON.stringify(GameState.quests.pendingBranches));
    expect(saved).toEqual([{ questId: branchDef.id, choiceIds: branchDef.branchOptions.map(option => option.setsFlag) }]);
    expect(QuestSystem.chooseBranch(branchDef.id, 'invalid')).toBe(false);
    const chosen = vi.fn(); EventBus.on('branchChosen', chosen);
    expect(QuestSystem.chooseBranch(branchDef.id, 'soldier_branch_a')).toBe(true);
    expect(QuestSystem.chooseBranch(branchDef.id, 'soldier_branch_b')).toBe(false);
    expect(NPCSystem.forceRecruit).toHaveBeenCalledTimes(1);
    expect(chosen).toHaveBeenCalledTimes(1);
    expect(GameState.flags.soldier_branch_a).toBe(true);
    expect(GameState.flags.soldier_branch_b).toBeUndefined();
  });

  it('loaded 이벤트는 저장된 미결 분기를 데이터로 복원하고 선택된 분기는 재생하지 않는다', async () => {
    GameState.quests.completed = [branchDef.id];
    GameState.quests.pendingBranches = [{ questId: branchDef.id, choiceIds: ['soldier_branch_a', 'soldier_branch_b'] }];
    EventBus.emit('loaded', {});
    await Promise.resolve();
    expect(DialogueScene._active.id).toBe(`${branchDef.id}:branch`);
    click();
    expect(NPCSystem.forceRecruit).toHaveBeenCalledTimes(1);
    EventBus.emit('loaded', {});
    await Promise.resolve();
    expect(DialogueScene._active).toBeNull();
    expect(NPCSystem.forceRecruit).toHaveBeenCalledTimes(1);
  });

  it('구버전 완료 저장도 미선택 분기를 복원하지만 시작되지 않은 퀘스트는 선택할 수 없다', () => {
    expect(QuestSystem.chooseBranch(branchDef.id, 'soldier_branch_a')).toBe(false);
    GameState.quests.completed = [branchDef.id];
    delete GameState.quests.pendingBranches;
    QuestSystem.restorePendingBranches();
    expect(QuestSystem.getPendingBranch(branchDef.id).options).toHaveLength(2);
  });

  it('독백은 가짜 화자를 만들지 않고 NPC 퀘스트는 명시된 NPC만 사용한다', () => {
    expect(createQuestScene(MAIN_QUESTS.mq_soldier_01, 'start').speakerId).toBeNull();
    expect(createQuestScene(MAIN_QUESTS.mq_doctor_01, 'start').speakerId).toBe('npc_wounded_soldier');
  });
  it('신버전 저장의 선택 가능 ID를 검증해 보존하고 확대하지 않는다', async () => {
    GameState.quests.completed = [branchDef.id];
    GameState.quests.pendingBranches = [{ questId: branchDef.id, choiceIds: ['soldier_branch_b', 'invalid', 'soldier_branch_b'] }];
    EventBus.emit('loaded', {});
    await Promise.resolve();
    expect(GameState.quests.pendingBranches).toEqual([{ questId: branchDef.id, choiceIds: ['soldier_branch_b'] }]);
    expect(document.querySelectorAll('[data-scene-choice]')).toHaveLength(1);
    expect(QuestSystem.chooseBranch(branchDef.id, 'soldier_branch_a')).toBe(false);
  });

  it('신버전의 비어 있는 미결 목록이나 유효하지 않은 ID는 구버전처럼 확대하지 않는다', () => {
    GameState.quests.completed = [branchDef.id];
    GameState.quests.pendingBranches = [];
    QuestSystem.restorePendingBranches();
    expect(GameState.quests.pendingBranches).toEqual([]);
    GameState.quests.pendingBranches = [{ questId: branchDef.id, choiceIds: ['invalid'] }];
    QuestSystem.restorePendingBranches();
    expect(GameState.quests.pendingBranches).toEqual([]);
    expect(DialogueScene._active).toBeNull();
  });

  it('구버전 역직렬화는 이전 세션의 pending 필드를 남기지 않는다', () => {
    GameState.quests.completed = [branchDef.id];
    const save = JSON.parse(GameState.serialize());
    delete save.quests.pendingBranches;
    GameState.quests.pendingBranches = [];
    GameState.deserialize(JSON.stringify(save));
    expect(GameState.quests.pendingBranches).toBeUndefined();
    QuestSystem.restorePendingBranches();
    expect(QuestSystem.getPendingBranch(branchDef.id).options).toHaveLength(2);
  });

});
