// @vitest-environment happy-dom
// === 보드 행 헤더 회귀 테스트 ===
// INBOX 3군: 행 헤더를 목표 형식 `장소 (LOCATIONS)` / `바닥 (GROUND ITEMS)` /
// `휴대 (CARRIED INVENTORY)` 로 맞췄다.
//
// 지키는 것 둘:
//  1. 한글 이름과 영문 병기가 각각 제 span 에 들어간다. 한 노드에 합치면
//     _updateFloorLabel() 의 textContent 교체가 영문 병기를 조용히 지운다 —
//     구에 들어간 동안에만 사라지므로 베이스캠프 캡처로는 안 보이는 회귀다.
//  2. `.board-row-label` 의 letter-spacing 이 0 이다. 2px 이면 두 글자 한글 이름이
//     `휴 대` 로 벌어져 두 단어로 읽힌다.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import BoardRenderer from '../../js/ui/BoardRenderer.js';
import GameState from '../../js/core/GameState.js';

const BOARD_CSS = path.resolve(__dirname, '../../css/board.css');

function buildBoard() {
  document.body.innerHTML = '<div id="board-container"></div>';
  BoardRenderer._container = document.getElementById('board-container');
  BoardRenderer._buildDOM();
}

function headerOf(rowKey) {
  const row = document.querySelector(`.board-row.row-${rowKey}`);
  return {
    ko: row?.querySelector('.board-row-label-ko')?.textContent ?? null,
    en: row?.querySelector('.board-row-label-en')?.textContent ?? null,
  };
}

describe('보드 행 헤더 — 한글 + 영문 병기', () => {
  let prevState;

  beforeEach(() => {
    prevState = GameState.ui.currentState;
    GameState.ui.currentState = 'main';
    buildBoard();
  });

  afterEach(() => {
    GameState.ui.currentState = prevState;
    document.body.innerHTML = '';
    BoardRenderer._container = null;
  });

  it('장소 행이 `장소 (LOCATIONS)` 다', () => {
    expect(headerOf('top')).toEqual({ ko: '장소', en: '(LOCATIONS)' });
  });

  it('바닥 행이 `바닥 (GROUND ITEMS)` 다', () => {
    expect(headerOf('middle')).toEqual({ ko: '바닥', en: '(GROUND ITEMS)' });
  });

  it('휴대 행이 `휴대 (CARRIED INVENTORY)` 다', () => {
    expect(headerOf('bottom')).toEqual({ ko: '휴대', en: '(CARRIED INVENTORY)' });
  });

  it('한글 이름 안에 공백이 없다', () => {
    for (const key of ['top', 'middle', 'bottom']) {
      expect(headerOf(key).ko).not.toMatch(/\s/);
    }
  });

  it('영문 병기가 한글 이름과 다른 span 에 들어간다', () => {
    for (const key of ['top', 'middle', 'bottom']) {
      const row = document.querySelector(`.board-row.row-${key}`);
      expect(row.querySelectorAll('.board-row-label-ko')).toHaveLength(1);
      expect(row.querySelectorAll('.board-row-label-en')).toHaveLength(1);
    }
  });
});

describe('_updateFloorLabel — 영문 병기 보존', () => {
  let prevState, prevNode;

  beforeEach(() => {
    prevState = GameState.ui.currentState;
    prevNode  = GameState.location.currentNode;
    buildBoard();
  });

  afterEach(() => {
    GameState.ui.currentState = prevState;
    GameState.location.currentNode = prevNode;
    document.body.innerHTML = '';
    BoardRenderer._container = null;
  });

  it('베이스캠프에서 바닥 이름을 다시 써도 `(GROUND ITEMS)` 가 남는다', () => {
    GameState.ui.currentState = 'main';
    BoardRenderer._updateFloorLabel();
    expect(headerOf('middle')).toEqual({ ko: '바닥', en: '(GROUND ITEMS)' });
  });

  it('구에 들어가 바닥 이름이 `바닥 — {구}` 로 바뀌어도 `(GROUND ITEMS)` 가 남는다', () => {
    GameState.ui.currentState = 'explore';
    GameState.location.currentNode = 'dongjak';
    BoardRenderer._updateFloorLabel();

    const { ko, en } = headerOf('middle');
    expect(ko).toContain('바닥');
    expect(ko).not.toBe('바닥');           // 구 이름이 실제로 붙었다
    expect(en).toBe('(GROUND ITEMS)');
  });
});

describe('board.css — 한글 이름 자간', () => {
  it('.board-row-label 의 letter-spacing 이 0 이다', () => {
    const css = fs.readFileSync(BOARD_CSS, 'utf8');
    const block = css.match(/\.board-row-label\s*\{[^}]*\}/);
    expect(block).not.toBeNull();
    expect(block[0]).toMatch(/letter-spacing:\s*0\s*;/);
  });
});
