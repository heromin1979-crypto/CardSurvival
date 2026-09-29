// @vitest-environment happy-dom
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import Registry from '../../js/core/SystemRegistry.js';
import Intake from '../../js/systems/PatientIntakeSystem.js';
import Guard from '../../js/systems/GuardSystem.js';
import Dispatch from '../../js/systems/DispatchSystem.js';
import Choice from '../../js/ui/ContributionChoiceModal.js';
import Scene from '../../js/ui/DialogueScene.js';

const markup = '<div id="app"><div id="contribution-choice-modal"><div class="er-modal-box"></div></div></div>';
function cure(id) {
  GameState.npcs.states[id] = { spawned: true, woundLevel: 0, healed: true };
  Intake._admitted.push(id);
  Intake._patientMeta[id] = { hp: 100, admissionTP: 0 };
  Intake._onNpcHealed(id);
}
function restart(save) {
  Scene.reset(); Guard.init(); Dispatch.init(); Intake.init();
  GameState.deserialize(save);
  EventBus.emit('loaded', {});
}
beforeEach(() => {
  Scene.reset(); EventBus._listeners = {};
  GameState.resetForNewGame(); GameState.npcs = { states: {} }; GameState.time.day = 21;
  GameState.ui.modalOpen = false; GameState.ui.currentState = 'main'; GameState.combat.active = false;
  GameState.hospital = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };
  GameState.pendingLoot = []; GameState.cards = {};
  Registry.register('GuardSystem', Guard); Registry.register('DispatchSystem', Dispatch); Registry.register('PatientIntakeSystem', Intake);
  Guard.init(); Dispatch.init(); Intake.init(); Scene.init();
  document.body.innerHTML = markup; Choice._initialized = false; Choice.init();
});
afterEach(() => { Scene.reset(); vi.restoreAllMocks(); });

it('새 로드의 선택 대기는 기존 모달 뒤에서 재개하고 실제 버튼으로 병상을 비운다', async () => {
  GameState.ui.modalOpen = true;
  cure('patient_lee_junho_16');
  const save = GameState.serialize(); restart(save);
  GameState.ui.modalOpen = true;
  document.body.innerHTML = markup; Choice.init();
  await Promise.resolve();
  expect(document.getElementById('contribution-choice-modal').classList.contains('open')).toBe(false);
  GameState.ui.modalOpen = false; Scene._drain();
  const modal = document.getElementById('contribution-choice-modal');
  expect(modal.classList.contains('open')).toBe(true);
  modal.querySelector('[data-pick-index="1"]').click();
  expect(Intake.getActivePatients()).not.toContain('patient_lee_junho_16');
  expect(Intake.getRescuedRoster()).toContain('patient_lee_junho_16');
  expect(GameState.ui.modalOpen).toBe(false);
});

it('선택 대기 사망은 열린 선택창과 대기를 닫고 재선택·보상을 거부한다', () => {
  const id = 'patient_lee_junho_16'; cure(id);
  const loot = JSON.stringify(GameState.pendingLoot);
  EventBus.emit('patientDied', { npcId: id });
  expect(Intake.getPendingChoice(id)).toBeNull();
  expect(Intake.chooseContribution(id, 1)).toBe(false);
  expect(Intake.getRescuedRoster()).not.toContain(id);
  expect(JSON.stringify(GameState.pendingLoot)).toBe(loot);
  expect(document.getElementById('contribution-choice-modal').classList.contains('open')).toBe(false);
  expect(GameState.ui.modalOpen).toBe(false);
});

it('선택한 수비·파견 실행 상태와 진행 횟수를 새 프로세스에 보상 없이 복원한다', () => {
  const guard = 'patient_yoon_taehyun_27', dispatch = 'patient_lee_junho_16';
  cure(guard); Intake.chooseContribution(guard, 0);
  cure(dispatch); Intake.chooseContribution(dispatch, 0);
  Guard.station(guard); Dispatch.deploy(dispatch);
  Dispatch._entries[dispatch].assignment.runsCompleted = 2;
  const assignment = { ...Dispatch.getAssignment(dispatch) };
  const defense = Guard.getDefenseRating(); const loot = JSON.stringify(GameState.pendingLoot);
  const save = GameState.serialize(); restart(save);
  expect(Guard.getRegistered()).toContain(guard); expect(Guard.getStationed()).toContain(guard);
  expect(Guard.getDefenseRating()).toBe(defense);
  expect(Dispatch.getAssignment(dispatch)).toEqual(assignment);
  expect(JSON.stringify(GameState.pendingLoot)).toBe(loot);
});

it('로드 직후 강제 분기 뒤에 선택을 한 번만 재개한다', async () => {
  const id = 'patient_lee_junho_16'; cure(id);
  const save = GameState.serialize(); restart(save);
  Scene.enqueue({ id: 'forced-branch', title: '분기', dismissible: false, choices: [{ id: 'yes', label: '확정' }] });
  await Promise.resolve();
  Intake.resumePendingChoices(); Choice.init();
  expect(Scene._active.id).toBe('forced-branch');
  expect(Scene._queue.filter(job => job.id === 'contribution:' + id)).toHaveLength(1);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(Scene._active.id).toBe('forced-branch');
  document.querySelector('[data-scene-choice="yes"]').click();
  expect(Scene._active.id).toBe('contribution:' + id);
  document.querySelector('[data-pick-index="0"]').click();
  expect(Dispatch.getDispatchable()).toContain(id);
  expect(Scene._active).toBeNull(); expect(Scene._queue).toEqual([]);
});

it('대기 중 사망한 선택 작업은 앞 장면 뒤에서 표시하지 않고 폐기한다', () => {
  Scene.enqueue({ id: 'other', title: '대화', choices: [{ id: 'done', label: '계속' }] });
  const id = 'patient_lee_junho_16'; cure(id); EventBus.emit('patientLeft', { npcId: id });
  document.querySelector('[data-scene-choice="done"]').click();
  expect(Scene._active).toBeNull(); expect(GameState.ui.modalOpen).toBe(false);
  expect(Intake.chooseContribution(id, 0)).toBe(false);
});

it('파견 복귀를 저장 복원 뒤 한 번만 지급하고 일일 수비 식량도 중복 소비하지 않는다', () => {
  const id = 'patient_lee_junho_16'; cure(id); Intake.chooseContribution(id, 0); Dispatch.deploy(id);
  const returnDay = Dispatch.getAssignment(id).returnDay;
  restart(GameState.serialize());
  vi.spyOn(Math, 'random').mockReturnValue(0.2);
  GameState.time.day = returnDay; EventBus.emit('tpAdvance', {});
  expect(Dispatch.getAssignment(id).runsCompleted).toBe(1);
  const loot = JSON.stringify(GameState.pendingLoot);
  restart(GameState.serialize());
  const food = vi.spyOn(Guard, '_consumeFood');
  EventBus.emit('tpAdvance', {});
  expect(JSON.stringify(GameState.pendingLoot)).toBe(loot);
  expect(Dispatch.getAssignment(id).runsCompleted).toBe(1);
  expect(food).not.toHaveBeenCalled();
});

it('옛 저장은 등록을 복원하되 알 수 없는 원정 보상을 재발급하지 않으며 새 게임은 모든 실행 명단을 비운다', () => {
  const id = 'patient_lee_junho_16'; cure(id); Intake.chooseContribution(id, 0);
  const guard = 'patient_yoon_taehyun_27'; cure(guard); Guard.station(guard);
  const snapshot = JSON.parse(GameState.serialize()); delete snapshot.guardRoster; delete snapshot.dispatchRoster;
  const loot = JSON.stringify(GameState.pendingLoot); restart(JSON.stringify(snapshot));
  expect(Guard.getRegistered()).toContain(guard);
  expect(Dispatch.getAssignment(id).status).toBe('retired');
  expect(JSON.stringify(GameState.pendingLoot)).toBe(loot);
  GameState.resetForNewGame();
  expect(Guard.getRegistered()).toEqual([]); expect(Guard.getStationed()).toEqual([]);
  expect(Dispatch.getDispatchable()).toEqual([]); expect(Dispatch.getAssignment(id)).toBeNull();
  expect(Intake.getRescuedRoster()).toEqual([]);
  const saved = JSON.parse(GameState.serialize());
  expect(saved.guardRoster.entries).toEqual({}); expect(saved.dispatchRoster.entries).toEqual({});
});
