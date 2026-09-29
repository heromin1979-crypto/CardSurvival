import { describe, it, expect, beforeEach, vi } from 'vitest';
import { existsSync } from 'node:fs';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import StateMachine from '../../js/core/StateMachine.js';
import CharCreate from '../../js/screens/CharCreate.js';
import NPCSystem from '../../js/systems/NPCSystem.js';
import NPCStorySystem from '../../js/systems/NPCStorySystem.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import NPCRelationSystem from '../../js/systems/NPCRelationSystem.js';
import { CHARACTERS } from '../../js/data/characters.js';
import NPCS from '../../js/data/npcs.js';
import scenes from '../../js/data/cinematicScenes.js';

beforeEach(() => {
  vi.restoreAllMocks();
  EventBus._listeners = {};
  GameState.resetForNewGame();
  GameState.flags = createDefaultFlags();
  NPCSystem._registerNPCItems();
  GameState.npcs = { states: {} };
  GameState.companions = [];
  GameState.npcArcs = {};
});
function companion(id) {
  NPCSystem.forceRecruit(id);
  GameState.npcs.states[id].trust = 3;
}
describe('초반 서사 기반 계약', () => {
  it('다른 직업으로 새로 시작하면 이전 장소와 구조 환자·동료 이력을 지운다', () => {
    vi.spyOn(StateMachine, 'transition').mockImplementation(() => {});
    GameState.location.currentLandmark = 'lm_boramae_hospital';
    GameState.location.currentSubLocation = 'boramae_emergency';
    GameState.location.subLocationsLooted = ['lm_boramae_hospital:boramae_emergency'];
    GameState.npcs.states.npc_early_resident = { spawned: true, healed: true, woundLevel: 0 };
    GameState.companions = ['npc_dog'];
    CharCreate._selectedChar = CHARACTERS.find(c => c.id === 'firefighter');
    CharCreate._selectedDistrict = 'eunpyeong';
    CharCreate._startGame('박영철');
    expect(GameState.location.currentLandmark).toBeNull();
    expect(GameState.location.currentSubLocation).toBeNull();
    expect(GameState.location.subLocationsLooted ?? []).toEqual([]);
    expect(GameState.npcs?.states?.npc_early_resident).toBeUndefined();
    expect(GameState.companions ?? []).toEqual([]);
  });
  it('군인 시작은 중복 카드 없이 정식 동료 개를 등록한다', () => {
    vi.spyOn(StateMachine, 'transition').mockImplementation(() => {});
    CharCreate._selectedChar = CHARACTERS.find(c => c.id === 'soldier');
    CharCreate._selectedDistrict = 'dobong';
    CharCreate._startGame('강민준');
    NPCSystem._checkSpawns();
    expect(GameState.companions).toEqual(['npc_dog']);
    expect(GameState.npcs.states.npc_dog.isCompanion).toBe(true);
    expect(Object.values(GameState.cards).filter(c => c.definitionId === 'npc_dog')).toHaveLength(0);
    const before = GameState.stats.morale.current;
    GameState.stats.morale.current = 50;
    NPCSystem._applyCompanionEffects();
    expect(GameState.stats.morale.current).toBeGreaterThan(50);
    GameState.stats.morale.current = before;
  });
  it('직업 전용 인연은 해당 직업에게만 등장한다', () => {
    const [id, def] = Object.entries(NPCS).find(([, n]) => n.spawnCondition?.requiredCharacter);
    GameState.location.currentDistrict = def.spawnDistrict;
    GameState.time.day = def.spawnDay;
    GameState.player.characterId = 'engineer';
    NPCSystem._checkSpawns();
    expect(GameState.npcs.states[id]).toBeUndefined();
    GameState.player.characterId = def.spawnCondition.requiredCharacter;
    NPCSystem._checkSpawns();
    expect(GameState.npcs.states[id]?.spawned).toBe(true);
  });
  it('학생 서사는 동행 중 성공 탐색 5회를 저장해 누적한다', () => {
    companion('npc_student');
    NPCStorySystem.init();
    for (let i = 0; i < 4; i++) EventBus.emit('exploreCompleted', {});
    expect(GameState.npcs.states.npc_student.storyArc.currentStep).toBe(0);
    GameState.deserialize(GameState.serialize());
    GameState.npcs.states.npc_student.dispatched = true;
    EventBus.emit('exploreCompleted', {});
    expect(GameState.npcs.states.npc_student.storyArc.currentStep).toBe(0);
    GameState.npcs.states.npc_student.dispatched = false;
    EventBus.emit('exploreCompleted', {});
    expect(GameState.npcs.states.npc_student.storyArc.currentStep).toBe(1);
  });
  it('정비사 서사와 기억은 실제 craftComplete를 구독한다', () => {
    companion('npc_mechanic');
    NPCStorySystem.init();
    NPCRelationSystem._pendingMemories = [];
    NPCRelationSystem._initMemoryListeners();
    EventBus.emit('craftComplete', { recipeId: 'test' });
    expect(GameState.npcs.states.npc_mechanic.storyArc.currentStep).toBe(1);
    expect(NPCRelationSystem._pendingMemories.some(m => m.triggerId === 'mechanic_mem_craft')).toBe(true);
  });
  it('늦은 영입은 세계 날짜만으로 동행 14일 서사를 완료하지 않는다', () => {
    GameState.time.day = 40;
    companion('npc_dog');
    NPCStorySystem._onTP();
    expect(GameState.npcs.states.npc_dog.storyArc.currentStep).toBe(0);
    for (let i = 0; i < 14 * 72; i++) {
      GameState.time.totalTP++;
      NPCStorySystem._onTP();
    }
    expect(GameState.npcs.states.npc_dog.storyArc.completed).toBe(true);
  });
  it('성공한 구 탐색은 위치 정보와 함께 한 번 발행한다', () => {
    GameState.location.currentDistrict = 'dobong';
    const events = [];
    EventBus.on('exploreCompleted', payload => events.push(payload));
    ExploreSystem._arriveAtDistrict('dobong');
    expect(events).toEqual([{ districtId: 'dobong', landmarkId: null, subLocationId: null, source: 'district' }]);
  });
  it('시네마틱의 모든 이미지 참조가 실제 자산을 가리킨다', () => {
    for (const scene of Object.values(scenes)) {
      if (scene.image) expect(existsSync(scene.image), scene.image).toBe(true);
    }
    expect(scenes.cin_char_chef.gradient).toBeTruthy();
    expect(scenes.cin_char_chef.lines.length).toBeGreaterThan(0);
  });
});
it('실제 GameState 저장에는 학생 탐색 진행도가 포함된다', () => {
  companion('npc_student');
  NPCStorySystem.init();
  EventBus.emit('exploreCompleted', {});
  const saved = JSON.parse(GameState.serialize());
  expect(saved.npcs.states.npc_student.storyArc?.eventCounts?.[0]).toBe(1);
});

it('제한으로 차단되거나 조우로 중단된 탐색은 성공 이벤트를 발행하지 않는다', async () => {
  const { default: HiddenElementSystem } = await import('../../js/systems/HiddenElementSystem.js');
  const events = [];
  EventBus.on('exploreCompleted', payload => events.push(payload));
  GameState.location.currentDistrict = 'dobong';
  vi.spyOn(ExploreSystem, '_checkNight').mockReturnValue(false);
  ExploreSystem.exploreCurrentDistrict();
  expect(events).toHaveLength(0);
  ExploreSystem._checkNight.mockReturnValue(true);
  GameState.stats.morale.current = GameState.stats.morale.max;
  vi.spyOn(HiddenElementSystem, 'checkBossSpawn').mockReturnValue(true);
  ExploreSystem.exploreCurrentDistrict();
  expect(HiddenElementSystem.checkBossSpawn).toHaveBeenCalled();
  expect(events).toHaveLength(0);
});
it('세부장소 성공은 최초 1회만 발행하며 재클릭과 재진입은 중복되지 않는다', () => {
  vi.spyOn(ExploreSystem, '_checkNight').mockReturnValue(true);
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  GameState.location.currentDistrict = 'dongjak';
  GameState.location.currentLandmark = 'lm_boramae_hospital';
  const events = [];
  EventBus.on('exploreCompleted', payload => events.push(payload));
  ExploreSystem.enterSubLocation('lm_boramae_hospital', 'boramae_emergency');
  ExploreSystem.enterSubLocation('lm_boramae_hospital', 'boramae_emergency');
  GameState.location.currentSubLocation = null;
  ExploreSystem.enterSubLocation('lm_boramae_hospital', 'boramae_emergency');
  expect(events).toEqual([{ districtId: 'dongjak', landmarkId: 'lm_boramae_hospital', subLocationId: 'boramae_emergency', source: 'sublocation' }]);
});
it('파견 기간과 같은 TP의 재처리는 동행 기간으로 누적하지 않는다', () => {
  companion('npc_dog');
  const state = GameState.npcs.states.npc_dog;
  GameState.time.totalTP++;
  NPCStorySystem._onTP();
  NPCStorySystem._onTP();
  expect(state.storyCompanionTP).toBe(1);
  state.dispatched = true;
  for (let i = 0; i < 72; i++) {
    GameState.time.totalTP++;
    NPCStorySystem._onTP();
  }
  expect(state.storyCompanionTP).toBe(1);
  GameState.deserialize(GameState.serialize());
  GameState.npcs.states.npc_dog.dispatched = false;
  GameState.time.totalTP++;
  NPCStorySystem._onTP();
  expect(GameState.npcs.states.npc_dog.storyCompanionTP).toBe(2);
});
it('이미 완료된 서사는 저장 후 이벤트를 다시 받아도 보상을 재지급하지 않는다', () => {
  companion('npc_mechanic');
  NPCStorySystem.init();
  const rewards = [];
  EventBus.on('addItemToBoard', payload => rewards.push(payload));
  EventBus.emit('craftComplete', {});
  NPCStorySystem._onTP();
  expect(rewards).toHaveLength(1);
  GameState.deserialize(GameState.serialize());
  EventBus.emit('craftComplete', {});
  NPCStorySystem._onTP();
  expect(rewards).toHaveLength(1);
});
it('위험한 구출의 첫 발동에는 재발동 쿨다운을 적용하지 않는다', () => {
  companion('npc_dog');
  GameState.time.day = 15;
  NPCStorySystem.init();
  const show = vi.fn();
  EventBus.on('showDilemma', show);
  EventBus.emit('exploreCompleted', {});
  expect(show).toHaveBeenCalledTimes(1);
  EventBus.emit('exploreCompleted', {});
  expect(show).toHaveBeenCalledTimes(1);
});


describe('실제 파견 순서의 동행 계약', () => {
  async function initSystems() {
    const { default: NPCGroupSystem } = await import('../../js/systems/NPCGroupSystem.js');
    const { default: TickEngine } = await import('../../js/core/TickEngine.js');
    NPCRelationSystem._pendingMemories = [];
    NPCRelationSystem.init();
    NPCGroupSystem.init();
    NPCStorySystem.init();
    return { NPCGroupSystem, TickEngine };
  }
  it.each(['dispatch', 'dead', 'dismiss'])('예약 뒤 %s 상태가 된 정비사에게 기억 보상을 주지 않는다', async (change) => {
    companion('npc_mechanic');
    const { NPCGroupSystem, TickEngine } = await initSystems();
    const lines = vi.fn();
    EventBus.on('npcMemoryLine', lines);
    EventBus.emit('craftComplete', {});
    if (change === 'dispatch') NPCGroupSystem.dispatchForage('npc_mechanic');
    if (change === 'dead') GameState.npcs.states.npc_mechanic.hp = 0;
    if (change === 'dismiss') NPCSystem.dismiss('npc_mechanic');
    TickEngine.skipTP(18);
    expect(lines).not.toHaveBeenCalled();
    expect(GameState.npcs.states.npc_mechanic.trust).toBe(3);
    expect(NPCRelationSystem._pendingMemories).toHaveLength(0);
  });
  it('모든 동료가 파견 중이면 구출과 쿨다운이 발생하지 않고 귀환 후 발동한다', async () => {
    companion('npc_dog');
    GameState.time.day = 15;
    const { NPCGroupSystem, TickEngine } = await initSystems();
    const show = vi.fn();
    EventBus.on('showDilemma', show);
    NPCGroupSystem.dispatchForage('npc_dog');
    EventBus.emit('exploreCompleted', {});
    expect(show).not.toHaveBeenCalled();
    expect(GameState.flags.dilemma_cooldown_dangerous_rescue).toBeUndefined();
    TickEngine.skipTP(48);
    EventBus.emit('exploreCompleted', {});
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ npcId: 'npc_dog' }));
  });
  it('구출 대상은 배열의 파견자와 사망자를 제외한 현장 동료다', async () => {
    companion('npc_dog');
    companion('npc_mechanic');
    companion('npc_student');
    GameState.time.day = 15;
    const { NPCGroupSystem } = await initSystems();
    NPCGroupSystem.dispatchForage('npc_dog');
    GameState.npcs.states.npc_mechanic.hp = 0;
    const show = vi.fn();
    EventBus.on('showDilemma', show);
    EventBus.emit('exploreCompleted', {});
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ npcId: 'npc_student' }));
  });
  it('Group→Story 실제 등록 순서에서 귀환 마지막 TP도 동행으로 세지 않는다', async () => {
    companion('npc_dog');
    const { NPCGroupSystem, TickEngine } = await initSystems();
    NPCGroupSystem.dispatchForage('npc_dog');
    TickEngine.skipTP(48);
    expect(GameState.npcs.states.npc_dog.dispatched).toBe(false);
    expect(GameState.npcs.states.npc_dog.storyCompanionTP ?? 0).toBe(0);
    TickEngine.skipTP(1);
    expect(GameState.npcs.states.npc_dog.storyCompanionTP).toBe(1);
  });
});
