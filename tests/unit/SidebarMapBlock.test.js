// @vitest-environment happy-dom
// === 사이드바 지도 블록 ===
// 목표(docs/loop/reference/ui-refs/main-screen-v2.png)의 좌측 컬럼 맨 위는 `지도 (MAP)` 제목과
// 컬럼 폭을 꽉 채운 지도이고, 그 위에 마커가 여러 개 찍혀 있다.
// 전에는 아트워크 전체(1376×768)를 그대로 넣어 200px 컬럼에서 위아래에 빈 띠가 남았다.
// 여기서 지키는 것은 두 가지다 — 크롭이 구를 자르지 않는다, 그리고 높이를 CSS 가 다시 정하지 않는다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import GameState     from '../../js/core/GameState.js';
import SeoulMapModal from '../../js/ui/SeoulMapModal.js';

const MAIN_JS    = readFileSync(path.resolve('js/screens/Main.js'), 'utf8');
const MAP_JS     = readFileSync(path.resolve('js/ui/SeoulMapModal.js'), 'utf8');
const LAYOUT_CSS = readFileSync(path.resolve('css/layout.css'), 'utf8');
const GAME_CSS   = readFileSync(path.resolve('css/screens-game.css'), 'utf8');

// _buildLayout() 템플릿의 사이드바 조각만 떼어 DOM 으로 읽는다 (SidebarSectionOrder.test.js 와 같은 방식)
function sidebar() {
  const html = MAIN_JS
    .slice(MAIN_JS.indexOf('<aside class="bc-sidebar">'), MAIN_JS.indexOf('</aside>') + 8)
    .replace(/\$\{[^}]*\}/g, '');
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild;
}

// 구 폴리곤 좌표는 모듈이 내보내지 않는다. 소스에서 읽어 크롭이 그것을 다 담는지 본다.
function districtBBox() {
  const start = MAP_JS.indexOf('const DRAWN_MAP_DISTRICTS');
  const body  = MAP_JS.slice(start, MAP_JS.indexOf('\n];', start));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, count = 0;
  const blocks = /points:\s*\[([\s\S]*?)\]\s*\}/g;
  let block;
  while ((block = blocks.exec(body))) {
    count++;
    const points = /\[(\d+),(\d+)\]/g;
    let point;
    while ((point = points.exec(block[1]))) {
      const x = Number(point[1]), y = Number(point[2]);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY, count };
}

function render({ compact }) {
  const host = document.createElement('div');
  host.innerHTML = SeoulMapModal._buildMapSVG({
    currentId: 'mapo', selectedId: 'mapo', compact, interactive: !compact,
  });
  return host;
}

const viewBoxOf = (host) => host.querySelector('svg').getAttribute('viewBox').split(' ').map(Number);

beforeEach(() => {
  GameState.location = {
    ...GameState.location,
    currentDistrict: 'mapo',
    districtsVisited: ['mapo', 'jongno'],
  };
  GameState.flags = { ...GameState.flags, mapUnlocked: true };
});

describe('지도 섹션 마크업', () => {
  it('사이드바 맨 위가 제목 붙은 지도 섹션이다', () => {
    const first = sidebar().firstElementChild;

    expect(first.id).toBe('bc-map-section');
    expect(first.querySelector('.bc-side-title').textContent.replace(/\s+/g, ' ').trim())
      .toBe('지도 (MAP)');
  });

  it('조각 배지가 제목 줄 안에 있다 — 지도 상자 위에 겹쳐 놓지 않는다', () => {
    const title = sidebar().querySelector('#bc-map-section .bc-side-title');

    expect(title.querySelector('#map-fragment-badge')).not.toBeNull();
  });

  it('지도 창으로 가는 클릭 상자와 렌더 자리가 그대로 있다', () => {
    const box = sidebar().querySelector('#bc-map-section .bc-minimap');

    expect(box.getAttribute('data-action')).toBe('open-seoul-map');
    expect(box.querySelector('#minimap-preview')).not.toBeNull();
  });
});

describe('미니맵 뷰박스 (크롭)', () => {
  it('크롭이 구 25개를 하나도 자르지 않는다', () => {
    const [x, y, w, h] = viewBoxOf(render({ compact: true }));
    const box = districtBBox();

    expect(box.count).toBe(25);
    expect(x).toBeLessThanOrEqual(box.minX);
    expect(y).toBeLessThanOrEqual(box.minY);
    expect(x + w).toBeGreaterThanOrEqual(box.maxX);
    expect(y + h).toBeGreaterThanOrEqual(box.maxY);
  });

  it('아트워크 전체보다 좁다 — 같은 폭에서 지도가 더 크게 그려진다', () => {
    const [, , w] = viewBoxOf(render({ compact: true }));

    expect(1376 / w).toBeGreaterThanOrEqual(1.3);
  });

  it('구 지도 창은 아트워크 전체를 그대로 쓴다', () => {
    expect(viewBoxOf(render({ compact: false }))).toEqual([0, 0, 1376, 768]);
  });
});

describe('미니맵 마커', () => {
  it('구마다 마커가 하나씩 붙는다', () => {
    expect(render({ compact: true }).querySelectorAll('.sm-mini-marker').length).toBe(25);
  });

  it('현재 구에는 현재 위치 아이콘이, 나머지에는 랜드마크 마커가 붙는다', () => {
    const host = render({ compact: true });
    const current = host.querySelectorAll('.sm-mini-marker.is-current');

    expect(current.length).toBe(1);
    expect(current[0].querySelector('.sm-map-icon--current')).not.toBeNull();
    expect(host.querySelectorAll('.sm-mini-marker .sm-map-icon--current').length).toBe(1);
  });

  it('가 본 구는 is-visited 로 갈린다 — 마커가 방문 여부까지 말한다', () => {
    const host = render({ compact: true });

    // 방문 구는 mapo·jongno 둘. mapo 는 현재 구이기도 해서 아이콘만 현재 위치로 갈린다.
    expect(host.querySelectorAll('.sm-mini-marker.is-visited').length).toBe(2);
    expect(host.querySelectorAll('.sm-mini-marker:not(.is-visited)').length).toBe(23);
  });

  it('구 지도 창에는 마커층을 붙이지 않는다 — 거기서는 이름·상태가 글자로 읽힌다', () => {
    expect(render({ compact: false }).querySelectorAll('.sm-mini-marker').length).toBe(0);
  });
});

describe('빈 띠(letterbox) 재발 방지', () => {
  // 높이를 CSS 가 다시 정하면 뷰박스 비율과 갈리는 순간 위아래에 빈 띠가 돌아온다.
  it('미니맵 미리보기에 높이를 박지 않는다', () => {
    const rule = LAYOUT_CSS.match(/\.bc-minimap-preview \{[^}]*\}/)[0];

    expect(rule).not.toMatch(/(^|[^-])height:/);
    expect(rule).not.toMatch(/min-height:/);
  });

  it('지도 SVG 는 폭만 맞추고 높이는 스스로 정한다', () => {
    const rule = LAYOUT_CSS.match(/\.bc-minimap-preview svg \{[^}]*\}/)[0];

    expect(rule).toMatch(/width:\s*100%/);
    expect(rule).toMatch(/height:\s*auto/);
  });

  it('지도 껍데기도 높이를 잡지 않는다', () => {
    const shell = GAME_CSS.match(/\.minimap-ops-shell \{[^}]*\}/)[0];
    const svg   = GAME_CSS.match(/\.minimap-ops-shell \.seoul-map-svg--ops \{[^}]*\}/)[0];

    expect(shell).not.toMatch(/(^|[^-])height:/);
    expect(shell).not.toMatch(/min-height:/);
    expect(svg).toMatch(/height:\s*auto/);
  });

  it('마커층이 미니맵 일괄 숨김 규칙을 이긴다', () => {
    const hide = GAME_CSS.indexOf('.minimap-ops-shell .sm-map-icon,');
    const show = GAME_CSS.indexOf('.minimap-ops-shell .sm-mini-marker .sm-map-icon');

    expect(show).toBeGreaterThan(hide);   // 같은 특정도가 아니라 더 높지만, 순서까지 보장한다
    expect(GAME_CSS.slice(show).match(/\{[^}]*\}/)[0]).toMatch(/display:\s*block/);
  });
});
