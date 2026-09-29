// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import DialogueScene from '../../js/ui/DialogueScene.js';
import Presentation from '../../js/ui/CareerPresentationScene.js';

describe('초반 성과 연출의 표시와 저장', () => {
  beforeEach(() => {
    DialogueScene.reset();
    EventBus._listeners = {};
    document.body.innerHTML = '<div id="app"></div>';
    GameState.flags = {};
    GameState.ui.currentState = 'main';
    GameState.ui.modalOpen = false;
    GameState.combat.active = false;
    GameState.player.characterId = 'engineer';
    GameState.player.isAlive = true;
    GameState.location.currentDistrict = 'yongsan';
    DialogueScene.init(); Presentation.init();
  });
  afterEach(() => { DialogueScene.reset(); vi.restoreAllMocks(); });
  const complete = characterId => EventBus.emit('careerDialogueCompleted', {
    characterId, topicId: `${characterId}_core`, kind: 'core',
    resultText: '실제 행동이 완료되었습니다.', nextHint: '다음 공급처를 확인하세요.',
  });

  it('보유·생활 대화로 성공 연출을 만들지 않고 실제 전문 행동 결과만 표시한다', () => {
    EventBus.emit('inventoryChanged', {});
    EventBus.emit('careerDialogueCompleted', { characterId: 'engineer', kind: 'life' });
    expect(DialogueScene._active).toBeNull();
    complete('engineer');
    expect(document.body.textContent).toContain('실제 행동이 완료되었습니다.');
    expect(document.querySelector('.career-outcome')).not.toBeNull();
    expect(document.body.textContent).toContain('다음 공급처');
  });
  it('중복 완료는 장면을 추가하지 않고 닫기 후 로드해도 재생하지 않는다', async () => {
    complete('engineer'); complete('engineer');
    expect(DialogueScene._queue).toHaveLength(0);
    document.querySelector('.npc-scene-leave').click();
    EventBus.emit('loaded', {}); await Promise.resolve();
    expect(DialogueScene._active).toBeNull();
    complete('engineer'); expect(DialogueScene._active).toBeNull();
  });
  it('미확인 결과는 로드 후 복원되고 reset cleanup은 확인 처리하지 않는다', async () => {
    complete('engineer');
    EventBus.emit('loaded', {}); await Promise.resolve();
    expect(document.body.textContent).toContain('실제 행동이 완료되었습니다.');
    expect(GameState.flags.careerPresentation.seen['success:engineer']).toBeUndefined();
    document.querySelector('[data-scene-choice="continue"]').click();
    expect(GameState.flags.careerPresentation.seen['success:engineer']).toBe(true);
  });
  it('다른 직업의 완료 신호를 무시한다', () => {
    complete('chef'); expect(DialogueScene._active).toBeNull();
  });
  it.each(['doctor', 'soldier', 'firefighter', 'homeless', 'chef', 'engineer'])('%s의 결과를 독립적으로 표시하며 추가 물자를 지급하지 않는다', characterId => {
    GameState.player.characterId = characterId;
    const create = vi.spyOn(GameState, 'createCardInstance');
    complete(characterId);
    expect(document.querySelector('.career-outcome')).not.toBeNull();
    document.querySelector('[data-scene-choice="continue"]').click();
    expect(GameState.flags.careerPresentation.seen[`success:${characterId}`]).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });
  it('첫 밤은 한 번 안내하고 재생 자체는 자원이나 퀘스트를 변경하지 않는다', () => {
    const mod = vi.spyOn(GameState, 'modStat');
    EventBus.emit('nightStarted', {});
    expect(document.body.textContent).toContain('첫 밤');
    document.querySelector('.npc-scene-leave').click();
    EventBus.emit('nightStarted', {});
    expect(DialogueScene._active).toBeNull();
    expect(mod).not.toHaveBeenCalled();
  });
  it('다른 대화 뒤 기다리던 성과와 첫 밤은 사망 후 엔딩을 가리지 않는다', () => {
    DialogueScene.enqueue({ id: 'blocking', title: '진행 중', choices: [{ id: 'continue', label: '계속' }] });
    complete('engineer'); EventBus.emit('nightStarted');
    GameState.player.isAlive = false; GameState.ui.currentState = 'ending';
    document.querySelector('[data-scene-choice="continue"]').click();
    expect(DialogueScene._active).toBeNull();
    expect(document.querySelector('.npc-scene-overlay')).toBeNull();
  });
  it('휴식 도중 시작한 첫 밤은 보드로 돌아온 뒤 보여준다', async () => {
    GameState.ui.currentState = 'rest'; EventBus.emit('nightStarted');
    expect(DialogueScene._active).toBeNull();
    GameState.ui.currentState = 'main'; EventBus.emit('stateTransition', { to: 'main' });
    await Promise.resolve();
    expect(document.body.textContent).toContain('첫 밤');
  });
  it('구버전 슬롯을 로드하면 이전 슬롯의 대화와 연출 기록이 섞이지 않는다', () => {
    const old = JSON.parse(GameState.serialize());
    delete old.flags.careerDialogues; delete old.flags.careerPresentation;
    GameState.flags.careerDialogues = { topics: { engineer_core: { status: 'completed' } }, introduced: true, pendingTopic: 'engineer_core' };
    GameState.flags.careerPresentation = { seen: { 'success:engineer': true }, pending: {} };
    GameState.deserialize(JSON.stringify(old));
    expect(GameState.flags.careerDialogues.topics).toEqual({});
    expect(GameState.flags.careerDialogues.pendingTopic).toBeNull();
    expect(GameState.flags.careerPresentation).toEqual({ seen: {}, pending: {} });
  });
});
