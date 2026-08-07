// @vitest-environment happy-dom
// Main._onEnter()가 매 화면 진입마다 _buildLayout()으로 #screen-main.innerHTML을
// 통째로 갈아치운다 — #secret-event-modal도 이때 파괴·재생성된다. 엘리먼트에 직접
// 바인딩한 클릭 리스너는 이 재생성 이후 죽은 노드를 붙잡게 되므로, 실제 화면 재진입
// 사이클(초기화 → DOM 파괴/재생성 → 재초기화)을 재현해 회귀를 막는다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import { SECRET_EVENTS } from '../../js/data/secretEvents.js';
import SecretEventModal from '../../js/ui/SecretEventModal.js';

const MODAL_MARKUP = `
  <div class="modal-overlay" id="secret-event-modal">
    <div class="er-modal-box"></div>
  </div>`;

function rebuildScreen() {
  document.getElementById('screen-main').innerHTML = MODAL_MARKUP;
}

describe('SecretEventModal — DOM 재빌드 이후 선택지 클릭', () => {
  beforeEach(() => {
    // 기존 테스트들은 "이미 main 화면에 재진입한" 상태를 재현하므로 active를 켜둔다 —
    // Renderer.activateScreen이 stateTransition마다 실제로 붙이는 클래스와 동일하다
    document.body.innerHTML = '<main id="screen-main" class="screen active"></main>';
    EventBus._listeners = {};
    SecretEventModal._initialized = false;
    SecretEventModal._el = null;
    SecretEventModal._box = null;
    SecretEventModal._event = null;
    SecretEventModal._queue = [];
  });

  it('두 번째 init() 이후에도 선택지 클릭이 resolveSecretEventChoice를 호출한다', () => {
    // event_radio_whisper의 첫 선택지(track_signal)는 conditions: null이라 항상 잠금 해제 상태다
    const event = SECRET_EVENTS.find(e => e.id === 'event_radio_whisper');
    expect(event).toBeTruthy();

    const resolveSpy = vi.spyOn(HiddenElementSystem, 'resolveSecretEventChoice')
      .mockReturnValue(true);

    // 1회차 진입
    rebuildScreen();
    SecretEventModal.init();

    // Main._onEnter가 전투·휴식·탐사 후 재진입할 때마다 _buildLayout()이
    // #secret-event-modal을 파괴·재생성하는 상황을 재현한다
    rebuildScreen();
    SecretEventModal.init();

    EventBus.emit('secretEventTriggered', { event });

    const modal = document.getElementById('secret-event-modal');
    expect(modal.classList.contains('open')).toBe(true);

    const choiceEl = modal.querySelector('[data-choice-index="0"]');
    expect(choiceEl).toBeTruthy();
    expect(choiceEl.dataset.locked).toBeUndefined();

    choiceEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(resolveSpy).toHaveBeenCalledWith('event_radio_whisper', 0);
    expect(modal.classList.contains('open')).toBe(false);

    resolveSpy.mockRestore();
  });

  it('오버레이 배경 클릭은 아무것도 하지 않는다', () => {
    const event = SECRET_EVENTS.find(e => e.id === 'event_radio_whisper');
    const resolveSpy = vi.spyOn(HiddenElementSystem, 'resolveSecretEventChoice')
      .mockReturnValue(true);

    rebuildScreen();
    SecretEventModal.init();
    rebuildScreen();
    SecretEventModal.init();

    EventBus.emit('secretEventTriggered', { event });

    const modal = document.getElementById('secret-event-modal');
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(resolveSpy).not.toHaveBeenCalled();
    expect(modal.classList.contains('open')).toBe(true);

    resolveSpy.mockRestore();
  });

  it('모달이 열려 있지 않을 때는 클릭에 반응하지 않는다', () => {
    const resolveSpy = vi.spyOn(HiddenElementSystem, 'resolveSecretEventChoice')
      .mockReturnValue(true);

    rebuildScreen();
    SecretEventModal.init();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(resolveSpy).not.toHaveBeenCalled();

    resolveSpy.mockRestore();
  });

  it('HiddenElementSystem.setChoiceResolverActive(true)는 정확히 1회만 호출된다', () => {
    const activeSpy = vi.spyOn(HiddenElementSystem, 'setChoiceResolverActive');

    rebuildScreen();
    SecretEventModal.init();
    rebuildScreen();
    SecretEventModal.init();
    rebuildScreen();
    SecretEventModal.init();

    expect(activeSpy).toHaveBeenCalledTimes(1);
    expect(activeSpy).toHaveBeenCalledWith(true);

    activeSpy.mockRestore();
  });

  it('컨테이너가 없으면 setChoiceResolverActive를 호출하지 않는다', () => {
    document.getElementById('screen-main').innerHTML = '';
    const activeSpy = vi.spyOn(HiddenElementSystem, 'setChoiceResolverActive');

    SecretEventModal.init();

    expect(activeSpy).not.toHaveBeenCalled();

    activeSpy.mockRestore();
  });
});

// Rest.js:91의 skipTP는 여전히 Rest 화면이 활성인 상태에서 tpAdvance를 여러 번 발생시킨다.
// 그 사이 트리거된 비밀 이벤트는 #screen-main이 display:none 서브트리에 있으므로 즉시
// 표시할 수 없다 — 큐에 쌓아두고, main 재진입(active 부착 + init 재호출) 시점에 순서대로
// 소진해야 소실 없이 전달된다.
describe('SecretEventModal — main 화면이 아닐 때 이벤트 큐잉', () => {
  function rebuildScreen() {
    document.getElementById('screen-main').innerHTML = MODAL_MARKUP;
  }

  beforeEach(() => {
    // active 클래스 없음 — Rest 등 다른 화면이 활성인 동안을 재현
    document.body.innerHTML = '<main id="screen-main" class="screen"></main>';
    EventBus._listeners = {};
    SecretEventModal._initialized = false;
    SecretEventModal._el = null;
    SecretEventModal._box = null;
    SecretEventModal._event = null;
    SecretEventModal._queue = [];
  });

  it('active가 없는 동안 트리거된 이벤트는 표시되지도, 소비되지도 않는다', () => {
    const eventA = SECRET_EVENTS.find(e => e.id === 'event_radio_whisper');
    const eventB = SECRET_EVENTS.find(e => e.id === 'event_abandoned_cart');
    expect(eventA).toBeTruthy();
    expect(eventB).toBeTruthy();

    const resolveSpy = vi.spyOn(HiddenElementSystem, 'resolveSecretEventChoice')
      .mockReturnValue(true);

    rebuildScreen();
    SecretEventModal.init();

    EventBus.emit('secretEventTriggered', { event: eventA });
    EventBus.emit('secretEventTriggered', { event: eventB });

    const modal = document.getElementById('secret-event-modal');
    expect(modal.classList.contains('open')).toBe(false);
    expect(resolveSpy).not.toHaveBeenCalled();

    resolveSpy.mockRestore();
  });

  it('main으로 복귀해 init()이 재호출되면 큐의 첫 이벤트가 표시된다', () => {
    const eventA = SECRET_EVENTS.find(e => e.id === 'event_radio_whisper');
    const eventB = SECRET_EVENTS.find(e => e.id === 'event_abandoned_cart');

    vi.spyOn(HiddenElementSystem, 'resolveSecretEventChoice').mockReturnValue(true);

    rebuildScreen();
    SecretEventModal.init();
    EventBus.emit('secretEventTriggered', { event: eventA });
    EventBus.emit('secretEventTriggered', { event: eventB });

    // Renderer.activateScreen이 stateTransition 처리 중 가장 먼저 붙이는 클래스를 재현
    document.getElementById('screen-main').classList.add('active');
    SecretEventModal.init();

    const modal = document.getElementById('secret-event-modal');
    expect(modal.classList.contains('open')).toBe(true);
    expect(modal.querySelector('.er-header h2')?.textContent).toContain(eventA.name);
  });

  it('선택을 마치면 큐의 두 번째 이벤트가 이어서 표시된다', () => {
    const eventA = SECRET_EVENTS.find(e => e.id === 'event_radio_whisper');
    const eventB = SECRET_EVENTS.find(e => e.id === 'event_abandoned_cart');

    vi.spyOn(HiddenElementSystem, 'resolveSecretEventChoice').mockReturnValue(true);

    rebuildScreen();
    SecretEventModal.init();
    EventBus.emit('secretEventTriggered', { event: eventA });
    EventBus.emit('secretEventTriggered', { event: eventB });

    document.getElementById('screen-main').classList.add('active');
    SecretEventModal.init();

    const modal = document.getElementById('secret-event-modal');
    const choiceEl = modal.querySelector('[data-choice-index="0"]');
    expect(choiceEl).toBeTruthy();
    choiceEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(modal.classList.contains('open')).toBe(true);
    expect(modal.querySelector('.er-header h2')?.textContent).toContain(eventB.name);
  });
});
