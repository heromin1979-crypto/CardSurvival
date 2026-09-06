// @vitest-environment happy-dom
// === 첫 드래그 안내 오버레이 (_showBoardTooltip) ===
// 정중앙 배치는 바닥 행 카드를 덮는다. 좌표는 happy-dom에서 잴 수 없으므로
// 배치는 CSS 선언으로, 빠져나갈 수단은 DOM으로 나눠 확인한다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path             from 'node:path';
import EventBus         from '../../js/core/EventBus.js';
import GameState        from '../../js/core/GameState.js';
import OnboardingSystem from '../../js/systems/OnboardingSystem.js';

// happy-dom 환경에서는 import.meta.url이 file 스킴이 아니므로 vitest root(저장소 루트) 기준으로 읽는다
const CSS = readFileSync(path.resolve('css/onboarding.css'), 'utf8');

// 오버레이는 localStorage 플래그로 1회만 뜬다 — node 전역 localStorage는 이 환경에서
// 읽기/쓰기가 동작하지 않으므로 매번 비어 있는 저장소로 갈아 끼운다
function stubEmptyStorage() {
  const store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: k => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
  });
}

function showTooltip() {
  EventBus._listeners = {};
  GameState.flags = {};
  GameState.time  = { day: 1, totalTP: 0, tpInDay: 0 };
  stubEmptyStorage();
  document.body.innerHTML = '';

  OnboardingSystem.init();
  EventBus.emit('stateTransition', { to: 'main' });
  vi.advanceTimersByTime(1500);
  return document.getElementById('onboarding-board-tooltip');
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('온보딩 보드 툴팁', () => {
  it('첫 메인 진입 시 표시되고 닫기 버튼을 함께 보여준다', () => {
    const overlay = showTooltip();

    expect(overlay).not.toBeNull();
    expect(overlay.querySelector('.onboarding-tooltip-close')).not.toBeNull();
  });

  it('닫기 버튼 클릭으로 오버레이가 사라진다', () => {
    const overlay = showTooltip();
    overlay.querySelector('.onboarding-tooltip-close').click();

    expect(document.getElementById('onboarding-board-tooltip')).toBeNull();
  });

  it('오버레이를 화면 정중앙에 두지 않는다', () => {
    const block = CSS.match(/#onboarding-board-tooltip\s*\{([^}]*)\}/)[1];

    expect(block).toMatch(/align-items:\s*flex-start/);
    expect(block).not.toMatch(/align-items:\s*center/);
    expect(block).not.toMatch(/justify-content:\s*center/);
  });
});
