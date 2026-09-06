// @vitest-environment happy-dom
// === 좌측 사이드바 섹션 순서 ===
// 목표(docs/loop/reference/ui-refs/main-screen-v2.png)의 좌측 컬럼 순서는
// 지도 → Day/시각/계절/날씨/온도 → 상태 → 소음 수치 → 휴대 무게 → 퀘스트 다.
// 행동 메뉴는 목표에 없지만 게임의 유일한 진입 경로라 맨 아래에 남겼다.
// Main 을 통째로 띄우지 않고 _buildLayout() 템플릿의 사이드바 조각만 떼어 DOM 으로 읽는다.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const MAIN_JS   = readFileSync(path.resolve('js/screens/Main.js'), 'utf8');
const LAYOUT_CSS = readFileSync(path.resolve('css/layout.css'), 'utf8');
const MOBILE_CSS = readFileSync(path.resolve('css/mobile.css'), 'utf8');

function sidebar() {
  const html = MAIN_JS
    .slice(MAIN_JS.indexOf('<aside class="bc-sidebar">'), MAIN_JS.indexOf('</aside>') + 8)
    .replace(/\$\{[^}]*\}/g, '');   // 템플릿 보간은 순서와 무관하다
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild;
}

// 섹션 이름 — 제목이 있으면 제목, 없으면 대표 클래스
const label = (e) =>
  e.querySelector('.bc-side-title')?.textContent.replace(/\s+/g, ' ').trim()
  ?? e.className;

describe('좌측 사이드바 섹션 순서', () => {
  it('지도 → 시간 → 상태 → 소음 → 무게 → 행동 메뉴 순으로 놓인다', () => {
    const order = [...sidebar().children].map(label);

    expect(order).toEqual([
      'bc-minimap',
      'bc-time-block',
      '상태 (STATUS)',
      '소음 수치 (NOISE METER)',
      '휴대 무게 (WEIGHT)',
      'bc-sidebar-btns',
    ]);
  });

  it('행동 메뉴가 맨 아래다 — 퀘스트 블록은 그 위에 들어온다', () => {
    expect(sidebar().lastElementChild.className).toBe('bc-sidebar-btns');
  });

  it('Day/시각과 계절·날씨·온도가 한 블록에 있다', () => {
    const time = sidebar().querySelector('.bc-time-block');

    expect(time.querySelector('#hud-day')).not.toBeNull();
    expect(time.querySelector('.bc-season-weather-row')).not.toBeNull();
    expect(time.querySelector('#outdoor-temp')).not.toBeNull();
  });
});

describe('상태 섹션이 흡수한 것', () => {
  // 목표 이미지에 캐릭터 행이 없다고 지우면 장비 창 진입 경로와 위치 브레드크럼이 함께 사라진다
  it('캐릭터 행(장비 창 진입·위치 브레드크럼)이 상태 섹션 안에 남아 있다', () => {
    const status = sidebar().querySelector('#bc-status-section');

    expect(status.querySelector('#bc-char-block')).not.toBeNull();
    expect(status.querySelector('#bc-district-name')).not.toBeNull();
  });

  it('스탯 바와 질병 표시가 상태 섹션 안에 있다', () => {
    const status = sidebar().querySelector('#bc-status-section');

    expect(status.querySelector('#hud-stat-bars')).not.toBeNull();
    expect(status.querySelector('#disease-status')).not.toBeNull();
  });
});

describe('행동 메뉴가 차지하는 높이', () => {
  // 1열로 되돌리면 200px 컬럼에서 맨 아래 저장 버튼이 스크롤 밖으로 잘린다
  // (측정: 내용 1068px > 보이는 높이 1024px). happy-dom 은 레이아웃을 계산하지 않아
  // 좌표로는 못 잡으므로 선언으로 막는다.
  it('2열 그리드다', () => {
    const rule = LAYOUT_CSS.match(/#bc-action-section\s*\{[^}]*\}/)[0];

    expect(rule).toMatch(/display:\s*grid/);
    expect(rule).toMatch(/grid-template-columns:\s*1fr 1fr/);
  });

  it('레이블과 건설 유도 버튼은 두 열을 가로지른다', () => {
    expect(LAYOUT_CSS).toMatch(/\.bc-toolbar-label,\s*\n\s*#bc-action-section \.btn-build-highlight \{\s*\n\s*grid-column: 1 \/ -1;/);
  });
});

describe('모바일 HUD 바', () => {
  // 모바일은 사이드바를 가로 2행 바로 눕히고 .bc-sidebar > * 에 order 를 건다.
  // 섹션 껍데기가 남으면 상태·소음·무게가 직계 자식이 아니게 되어 order 가 통째로 죽는다.
  it('섹션 껍데기를 걷어내 항목이 다시 직계 자식이 된다', () => {
    const flattens = MOBILE_CSS.match(/\.bc-side-section\s*\{\s*display:\s*contents;\s*\}/g) ?? [];

    expect(flattens.length).toBe(2);   // 세로 2단(≤480px) + 가로 랜드스케이프
  });
});
