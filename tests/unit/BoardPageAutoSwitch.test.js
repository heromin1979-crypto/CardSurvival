// === 바닥 페이지 자동 전환 회귀 테스트 ===
// regression: 탐색을 연속으로 누르면 바닥 행이 매번 1페이지로 강제 이동했다.
// 시스템 자동 배치는 빈 슬롯을 page1부터 채우고(findEmptySlot) 스택도 앞 슬롯부터
// 합산하므로(placeCardInRow), cardPlaced에 실려오는 slot이 거의 항상 page1이었다.
// _autoSwitchPage가 그 slot의 페이지로 무조건 전환해 뒤 페이지를 보던 화면을 빼앗았다.
// 앞 페이지로 되돌리는 전환만 차단하고, 뒤 페이지 전환(앞이 만차라 뒤에 쌓인 경우)은 남긴다.
import { describe, it, expect, beforeEach } from 'vitest';
import BoardRenderer from '../../js/ui/BoardRenderer.js';
import GameState from '../../js/core/GameState.js';

describe('_autoSwitchPage — 바닥(middle) 행', () => {
  beforeEach(() => {
    GameState.board.middle = Array(20).fill(null);
    GameState.ui.middlePage = 0;
    BoardRenderer._container = null;  // DOM 갱신 경로 차단 (상태 전환만 검증)
  });

  it('2페이지를 보는 중 1페이지에 배치되어도 페이지가 유지된다', () => {
    GameState.ui.middlePage = 1;
    BoardRenderer._autoSwitchPage('middle', 3);
    expect(GameState.ui.middlePage).toBe(1);
  });

  it('2페이지를 보는 중 1페이지 마지막 슬롯에 배치되어도 유지된다', () => {
    GameState.ui.middlePage = 1;
    BoardRenderer._autoSwitchPage('middle', 9);
    expect(GameState.ui.middlePage).toBe(1);
  });

  it('1페이지를 보는 중 2페이지에 배치되면 2페이지로 전환된다', () => {
    GameState.ui.middlePage = 0;
    BoardRenderer._autoSwitchPage('middle', 15);
    expect(GameState.ui.middlePage).toBe(1);
  });

  it('같은 페이지에 배치되면 그대로다', () => {
    GameState.ui.middlePage = 1;
    BoardRenderer._autoSwitchPage('middle', 15);
    expect(GameState.ui.middlePage).toBe(1);
  });

  it('탐색 연속 실행처럼 1페이지 배치가 반복돼도 페이지가 밀리지 않는다', () => {
    GameState.ui.middlePage = 1;
    for (const slot of [0, 1, 2, 3, 4, 5]) {
      BoardRenderer._autoSwitchPage('middle', slot);
    }
    expect(GameState.ui.middlePage).toBe(1);
  });

  it('페이지 범위를 벗어난 슬롯은 무시한다', () => {
    GameState.ui.middlePage = 1;
    BoardRenderer._autoSwitchPage('middle', 999);
    expect(GameState.ui.middlePage).toBe(1);
  });
});

describe('_autoSwitchPage — 휴대(bottom) 행', () => {
  beforeEach(() => {
    GameState.player.extraSlots = 10;  // page2 해금 (page1 20칸 + page2 10칸)
    GameState.board.bottom = Array(30).fill(null);
    GameState.ui.bottomPage = 0;
    BoardRenderer._container = null;
  });

  it('2페이지를 보는 중 1페이지에 배치되어도 유지된다', () => {
    GameState.ui.bottomPage = 1;
    BoardRenderer._autoSwitchPage('bottom', 5);
    expect(GameState.ui.bottomPage).toBe(1);
  });

  it('1페이지를 보는 중 2페이지에 배치되면 전환된다', () => {
    GameState.ui.bottomPage = 0;
    BoardRenderer._autoSwitchPage('bottom', 25);
    expect(GameState.ui.bottomPage).toBe(1);
  });
});

describe('_autoSwitchPage — 페이지 없는 행', () => {
  it('top·environment 행은 아무 것도 바꾸지 않는다', () => {
    GameState.ui.middlePage = 1;
    BoardRenderer._autoSwitchPage('top', 0);
    BoardRenderer._autoSwitchPage('environment', 0);
    expect(GameState.ui.middlePage).toBe(1);
  });
});
