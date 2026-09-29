// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import DialogueScene from '../../js/ui/DialogueScene.js';
import CinematicScene from '../../js/ui/CinematicScene.js';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import { NEUTRAL_BACKGROUND } from '../../js/data/questScenes.js';

const scene = (id, extra = {}) => ({ id, title: '요청', speakerName: '생존 기록', text: '긴 대사', choices: [{ id: 'next', label: '확인' }], dismissible: true, ...extra });
const choose = () => document.querySelector('[data-scene-choice]').click();

describe('공통 대화 장면 입력과 큐', () => {
  beforeEach(() => {
    DialogueScene.reset();
    EventBus._listeners = {};
    document.body.innerHTML = '<div id="app"><button id="origin">시작</button></div>';
    GameState.ui.modalOpen = false;
    GameState.ui.currentState = 'main';
    GameState.combat.active = false;
    DialogueScene.init();
    document.getElementById('origin').focus();
  });
  afterEach(() => { DialogueScene.reset(); vi.useRealTimers(); });

  it('두 장면은 순서대로 표시되고 제거된 버튼 재클릭도 콜백을 중복 실행하지 않는다', () => {
    const first = vi.fn(), second = vi.fn();
    DialogueScene.enqueue(scene('one'), first);
    const staleButton = document.querySelector('[data-scene-choice]');
    DialogueScene.enqueue(scene('two'), second);
    expect(DialogueScene._active.id).toBe('one');
    staleButton.click(); staleButton.click();
    expect(first).toHaveBeenCalledTimes(1);
    expect(DialogueScene._active.id).toBe('two');
    choose();
    expect(second).toHaveBeenCalledTimes(1);
    expect(GameState.ui.modalOpen).toBe(false);
    expect(document.activeElement.id).toBe('origin');
  });

  it('강제 분기는 Escape/배경/close로 사라지지 않고 Tab이 순환한다', () => {
    DialogueScene.enqueue(scene('branch', { dismissible: false }));
    const button = document.querySelector('[data-scene-choice]');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.getElementById('dialogue-scene-overlay').click();
    DialogueScene.close();
    expect(DialogueScene._active.id).toBe('branch');
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(button);
    choose();
    expect(DialogueScene._active).toBeNull();
  });

  it('이미지 오류와 재열람은 상태나 선택 효과를 실행하지 않는다', () => {
    const callback = vi.fn();
    const before = JSON.stringify(GameState.flags);
    DialogueScene.enqueue(scene('image', { portrait: '/missing.png', background: '/missing-bg.png' }), callback);
    const portrait = document.querySelector('.npc-scene-character');
    portrait.dispatchEvent(new Event('error'));
    expect(portrait.hidden).toBe(true);
    expect(document.querySelector('.npc-scene-fallback').hidden).toBe(false);
    const bg = document.querySelector('.npc-scene-background');
    bg.dispatchEvent(new Event('error'));
    expect(bg.getAttribute('src')).toBe(NEUTRAL_BACKGROUND);
    bg.dispatchEvent(new Event('error'));
    expect(bg.hidden).toBe(true);
    DialogueScene.close();
    DialogueScene.enqueue(scene('image'), callback);
    DialogueScene.close();
    expect(callback).not.toHaveBeenCalled();
    expect(JSON.stringify(GameState.flags)).toBe(before);
  });

  it('전투와 다른 모달이 종료된 다음에만 대기 장면을 연다', () => {
    vi.useFakeTimers();
    GameState.combat.active = true;
    DialogueScene.enqueue(scene('wait'));
    vi.advanceTimersByTime(100);
    expect(DialogueScene._active).toBeNull();
    GameState.combat.active = false;
    GameState.ui.modalOpen = true;
    vi.advanceTimersByTime(100);
    expect(DialogueScene._active).toBeNull();
    GameState.ui.modalOpen = false;
    vi.advanceTimersByTime(100);
    expect(DialogueScene._active.id).toBe('wait');
  });

  it('대화·시네마틱 둘·강제 분기 순서와 완료 콜백을 보존한다', () => {
    vi.useFakeTimers();
    CinematicScene.init();
    const completed = vi.fn();
    DialogueScene.enqueue(scene('report'));
    // 실제 정의가 있는 장면을 사용한다.
    CinematicScene.show('cin_death_dehydration', completed);
    CinematicScene.show('cin_death_dehydration', completed);
    DialogueScene.enqueue(scene('branch', { dismissible: false }));
    choose();
    expect(CinematicScene._active).toBe(true);
    expect(document.getElementById('dialogue-scene-overlay')).toBeNull();
    vi.advanceTimersByTime(1500);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    vi.advanceTimersByTime(600);
    expect(completed).toHaveBeenCalledTimes(1);
    expect(CinematicScene._active).toBe(true);
    vi.advanceTimersByTime(1500);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    vi.advanceTimersByTime(600);
    expect(completed).toHaveBeenCalledTimes(2);
    expect(DialogueScene._active.id).toBe('branch');
  });

  it('로드는 이전 게임의 장면과 시네마틱 타이머를 취소한다', () => {
    vi.useFakeTimers();
    CinematicScene.init();
    const callback = vi.fn();
    CinematicScene.show('cin_death_dehydration', callback);
    DialogueScene.enqueue(scene('stale'));
    EventBus.emit('loaded', {});
    vi.advanceTimersByTime(20000);
    expect(callback).not.toHaveBeenCalled();
    expect(DialogueScene._active).toBeNull();
    expect(CinematicScene._active).toBe(false);
  });
  it('목표 보기 summary를 초기 포커스와 Tab 순환에 포함한다', () => {
    DialogueScene.enqueue(scene('detail', { detail: '목표 설명' }));
    const summary = document.querySelector('summary');
    expect(document.activeElement).toBe(summary);
    document.querySelector('.npc-scene-leave').focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(summary);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement.classList.contains('npc-scene-leave')).toBe(true);
  });

});
