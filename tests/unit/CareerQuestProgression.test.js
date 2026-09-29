import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import TickEngine from '../../js/core/TickEngine.js';
import Projects from '../../js/systems/CareerProjectSystem.js';
import QuestSystem from '../../js/systems/QuestSystem.js';
import DEFINITIONS, { PROJECT_RECOVERY, migrateCareerProjects } from '../../js/data/careerProjects.js';
import GameData from '../../js/data/GameData.js';
import QUESTS from '../../js/data/mainQuests/index.js';
import NPCS from '../../js/data/npcs.js';
import { validateCareerProjects } from '../../js/data/validateCareerProjects.js';

function add(id, quantity = 1) {
  const c = GameState.createCardInstance(id, { quantity });
  GameState.board.bottom.push(c.instanceId);
}
function prepare(def) {
  GameState.quests.active = [{ id: def.questId, progress: 0, startTp: 0, startDay: 1 }];
  GameState.player.characterId = QUESTS[def.questId].characterId;
  GameState.location.currentDistrict = def.districtId;
  if (def.powerCost || def.operation?.powerCost) GameState.flags.careerProjects.districtPower[def.districtId] = 6;
  for (const id of def.requires ?? []) GameState.flags.careerProjects.projects[id] = { projectId: id, active: true, uses: 1, legacy: true };
  for (const id of def.operated ?? []) GameState.flags.careerProjects.projects[id] = { projectId: id, active: true, uses: 1, legacy: true };
  if (def.crafted) {
    const bp = Object.values(GameData.blueprints).find(bp => bp.output?.some?.(o => o.definitionId === def.crafted));
    expect(bp).toBeDefined();
    EventBus.emit('craftComplete', { blueprintId: bp.id });
  }
  if (def.bossId) GameState.flags.bossesKilled.push(def.bossId);
  for (const a of def.actions) {
    for (const r of a.items) add(r.definitionId, r.qty);
    if (a.foodCount) add('cooked_rice', a.foodCount);
  }
}
beforeEach(() => {
  EventBus._listeners = {}; GameState.flags = createDefaultFlags();
  GameState.quests = { active: [], completed: [] }; GameState.questProgress = null; GameState.subObjectiveProgress = {};
  GameState.location = { currentDistrict: 'yongsan', installedStructures: {}, districtsVisited: [], districtArrivals: {} };
  GameState.board = { top: [], environment: [], middle: [], bottom: [] }; GameState.cards = {}; GameState.pendingLoot = [];
  GameState.npcs = { states: { a: { healed: true }, b: { healed: true }, c: { healed: true } } };
  GameState.player.isAlive = true; GameState.player.hp = { current: 100, max: 100 };
  GameState.ui.currentState = 'main'; GameState.combat.active = false;
  GameState.stats.morale = { current: 50, max: 100 }; GameState.weather = { id: 'sunny' };
  GameState.time.totalTP = 0; GameState.time.day = 1;
  QuestSystem.resetForNewGame(); Projects.init();
  EventBus.on('careerProjectCompleted', () => QuestSystem._checkAllProgress());
  vi.spyOn(TickEngine, 'skipTP').mockImplementation(n => { GameState.time.totalTP += n; });
  vi.spyOn(GameState, '_updateEncumbrance').mockImplementation(() => {});
  vi.spyOn(GameState, '_compactRow').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

it.each(Object.values(DEFINITIONS))('$id: 실제 원본 목표가 투입→가동→완료와 유료 반복 운영에 연결된다', def => {
  prepare(def);
  expect(Projects.activate(def.id).ok).toBe(false);
  for (const action of def.actions) expect(Projects.contribute(def.id, action.id)).toEqual({ ok: true });
  expect(GameState.quests.completed).not.toContain(def.questId);
  expect(Projects.activate(def.id)).toEqual({ ok: true });
  expect(GameState.quests.completed).toContain(def.questId);
  expect(Projects.activate(def.id).ok).toBe(false);
  for (const cost of def.operation.costs) add(cost.definitionId, cost.qty);
  if (def.operation.powerOutput) GameState.flags.careerProjects.districtPower[def.districtId] = 0;
  expect(Projects.operate(def.id)).toEqual({ ok: true });
  const entry = GameState.flags.careerProjects.projects[def.id];
  expect(entry.uses).toBe(1);
  expect(Projects.operate(def.id).ok).toBe(false);
  for (const out of def.operation.items) {
    const have = GameState.countOnBoard(out.definitionId) + GameState.pendingLoot.filter(x => x.definitionId === out.definitionId).reduce((n,x) => n+x.quantity,0);
    expect(have).toBeGreaterThanOrEqual(out.qty);
  }
});

it('전수 프로젝트 참조 및 기존 227개 퀘스트 분기·선행·엔딩을 보존한다', () => {
  expect(validateCareerProjects(DEFINITIONS, QUESTS, GameData.items, GameData.districts, PROJECT_RECOVERY)).toEqual([]);
  const old = JSON.parse(fs.readFileSync('docs/analysis/progression-execution/career-quests-before-projects.json', 'utf8'));
  expect(old).toHaveLength(227);
  for (const q of old) {
    expect(QUESTS[q.id]).toBeDefined();
    for (const key of ['prerequisite', 'alternativePrerequisites', 'requiresFlag', 'branchOptions']) expect(QUESTS[q.id][key], `${q.id}.${key}`).toEqual(q[key]);
    expect(QUESTS[q.id].reward?.flags, q.id).toEqual(q.reward?.flags);
  }
  // 스냅샷 생성기가 이 필드를 생략했으므로 HEAD 원본과 별도 대조한 계약을 고정한다.
  expect(QUESTS.mq_eng_end_b1.requiresAllFlags).toEqual(['power_station_cleared', 'water_plant_restored', 'comms_tower_active']);
});
it('정제약 제작과 실제 연구시설 투입을 모두 요구하고 공동 백신은 보스를 요구하지 않는다', () => {
  const def = DEFINITIONS.doctor_research; prepare(def);
  GameState.flags.careerProjects.crafted = {};
  for (const a of def.actions) Projects.contribute(def.id, a.id);
  expect(Projects.activate(def.id).ok).toBe(false);
  EventBus.emit('craftComplete', { blueprintId: 'purify_medicine' });
  expect(Projects.activate(def.id).ok).toBe(true);
  expect(GameState.flags.hiddenRecipesUnlocked).toContain('vaccine');
  expect(DEFINITIONS.doctor_vaccine.bossId).toBeUndefined();
  expect(DEFINITIONS.doctor_plague.bossId).toBe('boss_patient_zero');
});
it('직업 핵심 생산은 회수교환으로 대체되지 않고 타 전문설비 대안만 제공한다', () => {
  prepare(DEFINITIONS.engineer_grid);
  expect(Projects.inspect('engineer_grid').recovery).toEqual([]);
  prepare(DEFINITIONS.fire_power);
  expect(Projects.inspect('fire_power').recovery.map(o=>o.id)).toContain('portable_generator');
});
it.each([['chef_farm', 'chef_self_sufficient'], ['chef_herb_garden', 'chef_restoration']])('겨울 %s는 유료 교환 운영으로 %s 선행을 충족하고 저장한다', (gardenId, nextId) => {
  const def = DEFINITIONS[gardenId]; prepare(def);
  for (const a of def.actions) Projects.contribute(def.id,a.id);
  Projects.activate(def.id); GameState.time.day = 271;
  add('purified_water', 2);
  expect(Projects.inspect(def.id).operation.label).toContain('교환');
  expect(Projects.operate(def.id).ok).toBe(false);
  add('scrap_metal', 3); add('salt');
  const before = GameState.time.totalTP;
  expect(Projects.operate(def.id).ok).toBe(true);
  expect(GameState.time.totalTP - before).toBe(3);
  expect(GameState.countOnBoard('purified_water')).toBe(2);
  expect(GameState.countOnBoard('scrap_metal')).toBe(0);
  expect(GameState.countOnBoard('salt')).toBe(0);
  expect(GameState.countOnBoard('vegetable')).toBe(2);
  expect(Projects.operate(def.id).ok).toBe(false);
  GameState.deserialize(GameState.serialize());
  expect(GameState.flags.careerProjects.projects[def.id].uses).toBe(1);
  const next = DEFINITIONS[nextId];
  GameState.quests.active = [{ id: next.questId, progress: 0 }];
  for (const a of next.actions) {
    for (const item of a.items) add(item.definitionId, item.qty);
    if (a.foodCount) add('cooked_rice', a.foodCount);
    expect(Projects.contribute(nextId, a.id).ok).toBe(true);
  }
  expect(Projects.activate(nextId).ok).toBe(true);
});
it('특정 외상 환자를 놓쳐도 다른 실제 완치 3명과 수술 준비로 군 의료 분기를 진행한다', () => {
  const def = DEFINITIONS.doctor_surgery; prepare(def);
  for (const a of def.actions) Projects.contribute(def.id,a.id);
  expect(Projects.activate(def.id).ok).toBe(true);
});
