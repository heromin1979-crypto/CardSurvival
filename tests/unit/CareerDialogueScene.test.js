// @vitest-environment happy-dom
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import DialogueScene from '../../js/ui/DialogueScene.js';
import Scene from '../../js/ui/CareerDialogueScene.js';
import Dialogues from '../../js/systems/CareerDialogueSystem.js';
import TickEngine from '../../js/core/TickEngine.js';
beforeEach(() => {
  vi.useFakeTimers(); DialogueScene.reset(); EventBus._listeners = {};
  document.body.innerHTML = '<div id="app"></div>'; GameState.flags = createDefaultFlags();
  GameState.player.characterId = 'soldier'; GameState.player.isAlive = true;
  GameState.location.currentDistrict = 'dobong'; GameState.ui.currentState = 'main';
  GameState.ui.modalOpen = false; GameState.combat.active = false;
  Scene._openingResolved = false; Dialogues.init(); DialogueScene.init(); Scene.init();
  vi.spyOn(TickEngine, 'skipTP').mockImplementation(() => {});
});
afterEach(() => { DialogueScene.reset(); clearTimeout(Scene._timer); vi.restoreAllMocks(); vi.useRealTimers(); });
const click = id => document.querySelector(`[data-scene-choice="${id}"]`).click();
it('실제 장면에서 질문·선택·실행·재회가 작동하며 4개 이하 선택을 유지한다', () => {
  Scene.open('soldier_core'); expect(document.querySelectorAll('[data-scene-choice]')).toHaveLength(4);
  click('ask'); expect(document.querySelector('.npc-greeting').textContent).toContain('용산');
  click('detour'); expect(document.querySelectorAll('[data-scene-choice]').length).toBeLessThanOrEqual(4);
  click('perform'); expect(Dialogues.inspect('soldier_core').state.status).toBe('completed');
  expect(document.querySelector('.npc-greeting').textContent).toContain('용산');
});
it('의사 첫도입은 openingChoice 뒤 기존 모달이 닫혀야 표시된다', () => {
  GameState.player.characterId = 'doctor'; GameState.location.currentDistrict = 'dongjak';
  Scene.resume(); expect(DialogueScene._active).toBeNull();
  GameState.ui.modalOpen = true; EventBus.emit('openingChoice', { characterId: 'doctor', choice: 'treat' });
  vi.advanceTimersByTime(100); expect(DialogueScene._active).toBeNull();
  GameState.ui.modalOpen = false; vi.advanceTimersByTime(100);
  expect(DialogueScene._active.id).toBe('career-dialogues');
});
it('미결 질문을 로드하면 복원하고 명시적 보류는 상태이동 후에도 열지 않는다', () => {
  Scene.resume(); const saved = JSON.parse(JSON.stringify(GameState.flags));
  EventBus.emit('loaded'); GameState.flags = saved; vi.advanceTimersByTime(100);
  expect(DialogueScene._active.id).toBe('career-dialogues');
  click('later'); EventBus.emit('stateTransition', { to: 'main' }); vi.advanceTimersByTime(100);
  expect(DialogueScene._active).toBeNull();
});
it('실행 중 사망·ending 전환으로 소유권을 잃으면 결과 대화를 다시 렌더하지 않는다', () => {
  Scene.open('soldier_core'); click('detour');
  TickEngine.skipTP.mockImplementation(() => {
    GameState.player.isAlive = false; GameState.ui.currentState = 'ending';
    EventBus.emit('playerDied', {});
  });
  click('perform');
  expect(document.getElementById('dialogue-scene-overlay')).toBeNull();
  expect(DialogueScene._active).toBeNull();
});
it('완료한 대화를 다시 열면 이전 준비 대신 다음 단계의 안내를 보여준다', () => {
  GameState.player.characterId = 'engineer'; GameState.location.currentDistrict = 'yongsan';
  GameState.flags.careerDialogues.topics.engineer_core = { status: 'completed', choiceId: 'bypass', resultText: '수리 완료' };
  Scene.open('engineer_core');
  expect(document.querySelector('.npc-scene-detail').textContent).toContain('발전 공정');
  expect(document.querySelector('.npc-scene-detail').textContent).not.toContain('설치·가동을 완료하세요');
});
