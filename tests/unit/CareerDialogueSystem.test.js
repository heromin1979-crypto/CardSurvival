import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import TickEngine from '../../js/core/TickEngine.js';
import Topics from '../../js/data/careerDialogues.js';
import Dialogues from '../../js/systems/CareerDialogueSystem.js';
import Treatment from '../../js/systems/PatientTreatmentSystem.js';
import NPCSystem from '../../js/systems/NPCSystem.js';
import Projects from '../../js/systems/CareerProjectSystem.js';
import PROJECTS from '../../js/data/careerProjects.js';
import CraftSystem from '../../js/systems/CraftSystem.js';
import GameData from '../../js/data/GameData.js';
import { NPC_ITEMS } from '../../js/data/npcs.js';

function add(id, quantity = 1) {
  const card = GameState.createCardInstance(id, { quantity });
  GameState.board.bottom.push(card.instanceId); return card;
}
beforeEach(() => {
  EventBus._listeners = {}; GameState.flags = createDefaultFlags();
  GameState.board = { top: [], middle: Array(27).fill(null), bottom: Array(30).fill(null), environment: [] }; GameState.cards = {};
  GameState.pendingLoot = []; GameState.npcs = { states: {} }; GameState.player.isAlive = true;
  GameState.combat.active = false; GameState.ui.currentState = 'main'; GameState.time.totalTP = 0;
  GameState.time.hour = 12; GameState.time.day = 1; GameState.player.hp.current = 100;
  GameState.player.skills = { cooking: { level: 3, xp: 0 }, crafting: { level: 3, xp: 0 } };
  GameState.player.craftSaveChance = 0; GameState.crafting.activeQueue = [];
  GameState.quests = { active: [], completed: [] }; GameState.location.installedStructures = {};
  Object.assign(GameData.items, NPC_ITEMS);
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  vi.spyOn(TickEngine, 'skipTP').mockImplementation(n => { GameState.time.totalTP += n; });
  vi.spyOn(GameState, '_updateEncumbrance').mockImplementation(() => {});
  Dialogues.init();
});
it.each(Object.values(Topics).flatMap(topic => topic.choices.map(choice => [topic.id, choice.id])))('%s / %s 선택을 실제 도메인 행동과 소비까지 실행한다', (topicId, choiceId) => {
  const topic = Topics[topicId], choice = topic.choices.find(c => c.id === choiceId);
  GameState.player.characterId = topic.characterId; GameState.location.currentDistrict = topic.districtId;
  for (const [id, qty] of Object.entries(choice.costs)) add(id, qty);
  expect(Dialogues.choose(topicId, 'ask').ok).toBe(true);
  expect(Dialogues.choose(topicId, choiceId).ok).toBe(true);
  if (topic.evidence) expect(Dialogues.inspect(topicId).state.status).not.toBe('completed');
  if (topic.evidence === 'treatment') {
    GameState.npcs.states.npc_wounded_soldier = { spawned: true, hp: 50, woundLevel: 1 };
    add('bandage');
    expect(Treatment.treat('npc_wounded_soldier', 'bandage').ok).toBe(true);
  }
  if (topic.evidence === 'rescueTreatment') {
    expect(Dialogues.perform(topicId).ok).toBe(true);
    expect(GameState.npcs.states.npc_early_resident.spawned).toBe(true);
    expect(Dialogues.perform(topicId).ok).toBe(false);
    add('bandage');
    expect(Treatment.treat('npc_early_resident', 'bandage').ok).toBe(true);
  }
  if (['food', 'water'].includes(topic.evidence)) {
    const blueprint = topic.evidence === 'food' ? 'cook_rice' : 'make_boiled_water';
    add('campfire'); add('rice'); add('boiled_water'); add('contaminated_water');
    expect(CraftSystem.canStartBlueprint(blueprint).ok).toBe(true);
    CraftSystem.startBlueprint(blueprint);
    expect(Dialogues.inspect(topicId).state.evidence).toBe(true);
  }
  if (topic.evidence === 'project') {
    Projects.init(); const project = PROJECTS[topic.projectId];
    GameState.quests.active = [{ id: project.questId }];
    GameState.player.skills = Object.fromEntries(Object.entries(GameData.characters.find(c => c.id === 'engineer').startingSkills).map(([id, level]) => [id, { level, xp: 0 }]));
    GameState.flags.hiddenRecipesUnlocked = ['workbench'];
    for (const stage of GameData.blueprints.workbench.stages) for (const req of stage.requiredItems) add(req.definitionId, req.qty);
    CraftSystem.startBlueprint('workbench');
    expect(CraftSystem.advanceCraftStage(GameState.crafting.activeQueue[0].craftCardId)).toBe(true);
    for (const action of project.actions) {
      for (const req of action.items) add(req.definitionId, req.qty);
      expect(Projects.contribute(project.id, action.id).ok).toBe(true);
    }
    expect(Projects.activate(project.id).ok).toBe(true);
  }
  const complete = vi.fn(); EventBus.on('careerDialogueCompleted', complete);
  const costs = Dialogues.inspect(topicId).costs;
  const beforeCosts = Object.fromEntries(Object.keys(costs).map(id => [id, GameState.countOnBoard(id)]));
  expect(Dialogues.perform(topicId)).toEqual(expect.objectContaining({ ok: true }));
  for (const [id, qty] of Object.entries(costs)) expect(GameState.countOnBoard(id)).toBe(beforeCosts[id] - qty + (choice.output?.[id] ?? 0));
  expect(Dialogues.inspect(topicId).state.status).toBe('completed');
  const tp = GameState.time.totalTP, count = GameState.pendingLoot.length;
  GameState.deserialize(GameState.serialize());
  expect(Dialogues.perform(topicId).ok).toBe(false);
  expect(GameState.time.totalTP).toBe(tp); expect(GameState.pendingLoot).toHaveLength(count);
  expect(complete).toHaveBeenCalledOnce();
});
it('이전 치료·음식 보유·다른 제작과 다른 지역 행동은 새 성공으로 세지 않는다', () => {
  GameState.player.characterId = 'chef'; GameState.location.currentDistrict = 'junggoo'; add('cooked_rice');
  EventBus.emit('craftComplete', { blueprintId: 'cook_rice' });
  Dialogues.choose('chef_core', 'concentrate');
  expect(Dialogues.perform('chef_core').ok).toBe(false);
  EventBus.emit('craftComplete', { blueprintId: 'make_boiled_water' });
  expect(Dialogues.perform('chef_core').ok).toBe(false);
  GameState.location.currentDistrict = 'yongsan';
  EventBus.emit('craftComplete', { blueprintId: 'cook_rice' });
  expect(Dialogues.inspect('chef_core').state.evidence).toBe(false);
  Dialogues.choose('chef_core', 'later');
  expect(GameState.flags.careerDialogues.pendingTopic).toBeNull();
});
it('부족 자원 선택은 비용없이 실패하고 무료 물자 대신 시간 대안으로 재개한다', () => {
  GameState.player.characterId = 'soldier'; GameState.location.currentDistrict = 'dobong';
  Dialogues.choose('soldier_core', 'signal');
  expect(Dialogues.perform('soldier_core').ok).toBe(false); expect(GameState.time.totalTP).toBe(0);
  Dialogues.choose('soldier_core', 'detour'); expect(Dialogues.perform('soldier_core').ok).toBe(true);
  expect(GameState.time.totalTP).toBe(6);
});
it('TP 진행 중 재진입·사망이 발생해도 확정 작업의 비용·결과는 한 번만 기록한다', () => {
  GameState.player.characterId = 'soldier'; GameState.location.currentDistrict = 'dobong';
  Dialogues.choose('soldier_core', 'detour');
  TickEngine.skipTP.mockImplementation(() => {
    expect(Dialogues.perform('soldier_core').ok).toBe(false);
    GameState.player.isAlive = false;
  });
  const complete = vi.fn(); EventBus.on('careerDialogueCompleted', complete);
  expect(Dialogues.perform('soldier_core').ok).toBe(true);
  expect(Dialogues.perform('soldier_core').ok).toBe(false);
  expect(complete).toHaveBeenCalledOnce();
});
it('중간 처치만으로 완치로 세지 않으며 부재한 원환자 대신 새 환자의 실제 완치를 받는다', () => {
  GameState.player.characterId = 'doctor'; GameState.location.currentDistrict = 'dongjak';
  GameState.flags.abandoned_soldier = true; Dialogues.choose('doctor_core', 'assess');
  GameState.npcs.states.npc_er_patient_child = { spawned: true, hp: 30, woundLevel: 2 };
  add('bandage', 2);
  Treatment.treat('npc_er_patient_child', 'bandage');
  expect(Dialogues.perform('doctor_core').ok).toBe(false);
  Treatment.treat('npc_er_patient_child', 'bandage');
  expect(Dialogues.perform('doctor_core').ok).toBe(true);
  expect(Dialogues.inspect('doctor_core').state.resultText).toContain('새로 만난 환자');
});
it('구조 주민 부재 뒤 동작에서 다른 환자를 실제 완치하고 은평으로 돌아와 보고한다', () => {
  GameState.player.characterId = 'firefighter'; GameState.location.currentDistrict = 'eunpyeong';
  Dialogues.choose('firefighter_core', 'detour');
  expect(Dialogues.perform('firefighter_core').ok).toBe(true);
  GameState.npcs.states.npc_early_resident.dismissed = true;
  GameState.npcs.states.npc_early_resident.hp = 0;
  GameState.location.currentDistrict = 'dongjak';
  expect(NPCSystem.forceSpawn('npc_wounded_soldier')).toBe(true);
  add('bandage', 3);
  for (let i = 0; i < 3; i++) expect(Treatment.treat('npc_wounded_soldier', 'bandage').ok).toBe(true);
  expect(GameState.npcs.states.npc_wounded_soldier.healed).toBe(true);
  expect(Dialogues.inspect('firefighter_core').state.evidence).toBe(true);
  expect(Dialogues.perform('firefighter_core').ok).toBe(false);
  GameState.deserialize(GameState.serialize()); GameState.location.currentDistrict = 'eunpyeong';
  const beforeTP = GameState.time.totalTP;
  expect(Dialogues.perform('firefighter_core').ok).toBe(true);
  expect(GameState.time.totalTP).toBe(beforeTP);
  expect(Dialogues.inspect('firefighter_core').state.resultText).toContain('다른 부상자');
  expect(Dialogues.perform('firefighter_core').ok).toBe(false);
});
afterEach(() => vi.restoreAllMocks());
it('각 직업에 핵심·생활 대화를 한 개씩 제공한다', () => {
  expect(Object.keys(Topics)).toHaveLength(12);
  for (const character of ['doctor', 'soldier', 'firefighter', 'homeless', 'chef', 'engineer']) {
    GameState.player.characterId = character;
    expect(Dialogues.list().map(t => t.kind)).toEqual(['core', 'life']);
  }
});
it('질문·보류·재개와 선택을 저장하며 연타로 비용을 중복 소비하지 않는다', () => {
  GameState.player.characterId = 'soldier'; GameState.location.currentDistrict = 'dobong';
  expect(Dialogues.choose('soldier_core', 'ask').ok).toBe(true);
  expect(Dialogues.choose('soldier_core', 'later').ok).toBe(true);
  expect(Dialogues.choose('soldier_core', 'detour').ok).toBe(true);
  GameState.flags = JSON.parse(JSON.stringify(GameState.flags));
  expect(Dialogues.inspect('soldier_core').state.choiceId).toBe('detour');
  expect(Dialogues.perform('soldier_core').ok).toBe(true);
  const tp = GameState.time.totalTP;
  expect(Dialogues.perform('soldier_core').ok).toBe(false);
  expect(GameState.time.totalTP).toBe(tp);
});
