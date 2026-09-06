// @vitest-environment happy-dom
// === 빈 슬롯 플레이스홀더 회귀 테스트 ===
// INBOX 3군: 빈 칸마다 `소지품` / `발견한 아이템` / `클릭하여 이동` 이 반복돼 채워진 카드보다
// 먼저 읽힌다. 목표 이미지의 빈 칸은 훨씬 조용하다.
//
// 지키는 것 셋:
//  1. 쉴 때는 글자를 그리지 않는다 — 빈 칸이 40개(장소 10 · 바닥 10 · 휴대 20)라
//     안내 문구가 40번 반복되면 그게 화면에서 가장 큰 글자 덩어리가 된다.
//  2. 안내를 없애지는 않는다. 마우스를 올린 칸에서만 원문(`data-hint`)이 나온다.
//  3. 문구 자체는 건드리지 않는다 — `data-hint` 는 locales.js 에서 오고 그곳은 SPEC 3절이 막는다.
//     화면 접근성 이름(aria-label)도 그대로 남는다.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const BOARD_CSS = path.resolve(__dirname, '../../css/board.css');
const RENDERER  = path.resolve(__dirname, '../../js/ui/BoardRenderer.js');

const css = fs.readFileSync(BOARD_CSS, 'utf8');
const js  = fs.readFileSync(RENDERER, 'utf8');

// `.slot:empty::after { ... }` 한 덩어리를 통째로 떼어 온다
function ruleBody(selector) {
  const i = css.indexOf(selector);
  if (i === -1) return null;
  const open = css.indexOf('{', i);
  return css.slice(open + 1, css.indexOf('}', open));
}

describe('빈 슬롯 — 쉴 때는 조용하다', () => {
  it('쉬는 빈 칸은 안내 문구 대신 표식 하나만 그린다', () => {
    const body = ruleBody('.slot:empty::after');
    expect(body).not.toBeNull();
    expect(body).not.toContain('attr(data-hint)');
    const content = body.match(/content:\s*'([^']*)'/)?.[1] ?? '';
    expect(content.length).toBeLessThanOrEqual(1);
  });

  it('표식은 대비를 낮춰 둔다', () => {
    const body = ruleBody('.slot:empty::after');
    const opacity = Number(body.match(/opacity:\s*([\d.]+)/)?.[1] ?? 1);
    expect(opacity).toBeLessThanOrEqual(0.35);
  });
});

describe('빈 슬롯 — 안내를 없애지는 않았다', () => {
  it('마우스를 올린 칸에서만 원문이 나온다', () => {
    const body = ruleBody('.slot:empty:hover::after');
    expect(body).not.toBeNull();
    expect(body).toContain('attr(data-hint)');
  });

  it('문구와 접근성 이름은 렌더러가 그대로 붙인다', () => {
    // 문구를 지우면 locales.js 를 고치게 되고 그건 SPEC 3절 위반이다.
    expect(js).toContain("setAttribute('data-hint'");
    expect(js).toContain("aria-label");
  });
});
