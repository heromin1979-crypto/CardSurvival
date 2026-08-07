// @vitest-environment happy-dom
// Main._onEnter()가 매 화면 진입마다 _buildLayout()으로 #screen-main.innerHTML을
// 통째로 갈아치운다 — #contribution-choice-modal도 이때 파괴·재생성된다. 엘리먼트에
// 직접 바인딩한 클릭 리스너는 이 재생성 이후 죽은 노드를 붙잡게 되므로, 실제 화면
// 재진입 사이클(초기화 → DOM 파괴/재생성 → 재초기화)을 재현해 회귀를 막는다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import PATIENT_POOL from '../../js/data/patientPool.js';
import ContributionChoiceModal from '../../js/ui/ContributionChoiceModal.js';

const MODAL_MARKUP = `
  <div class="modal-overlay" id="contribution-choice-modal">
    <div class="er-modal-box"></div>
  </div>`;

function rebuildScreen() {
  document.getElementById('screen-main').innerHTML = MODAL_MARKUP;
}

// 결정적 테스트용 — 풀의 첫 번째 환자 ID
const PATIENT_ID = Object.keys(PATIENT_POOL)[0];

const OPTIONS = [
  { type: 'sponsor', immediate: [{ id: 'canned_food', qty: 1 }] },
  { type: 'dispatch', immediate: [{ id: 'bandage', qty: 1 }] },
];

describe('ContributionChoiceModal — DOM 재빌드 이후 선택지 클릭', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="screen-main"></main>';
    EventBus._listeners = {};
    ContributionChoiceModal._initialized = false;
    ContributionChoiceModal._el = null;
    ContributionChoiceModal._box = null;
    ContributionChoiceModal._currentNpcId = null;
    ContributionChoiceModal._currentOptions = [];
  });

  it('두 번째 init() 이후에도 선택지 클릭이 chooseContribution을 호출한다', () => {
    const chooseSpy = vi.fn();
    SystemRegistry.register('PatientIntakeSystem', { chooseContribution: chooseSpy });

    // 1회차 진입
    rebuildScreen();
    ContributionChoiceModal.init();

    // Main._onEnter가 전투·휴식·탐사 후 재진입할 때마다 _buildLayout()이
    // #contribution-choice-modal을 파괴·재생성하는 상황을 재현한다
    rebuildScreen();
    ContributionChoiceModal.init();

    EventBus.emit('contributionChoiceNeeded', { npcId: PATIENT_ID, options: OPTIONS });

    const modal = document.getElementById('contribution-choice-modal');
    expect(modal.classList.contains('open')).toBe(true);

    const pickEl = modal.querySelector('[data-pick-index="1"]');
    expect(pickEl).toBeTruthy();

    pickEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(chooseSpy).toHaveBeenCalledWith(PATIENT_ID, 1);
    expect(modal.classList.contains('open')).toBe(false);
  });

  it('오버레이 배경 클릭은 아무것도 하지 않는다', () => {
    const chooseSpy = vi.fn();
    SystemRegistry.register('PatientIntakeSystem', { chooseContribution: chooseSpy });

    rebuildScreen();
    ContributionChoiceModal.init();
    rebuildScreen();
    ContributionChoiceModal.init();

    EventBus.emit('contributionChoiceNeeded', { npcId: PATIENT_ID, options: OPTIONS });

    const modal = document.getElementById('contribution-choice-modal');
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(chooseSpy).not.toHaveBeenCalled();
    expect(modal.classList.contains('open')).toBe(true);
  });
});
