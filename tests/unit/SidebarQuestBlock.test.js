// @vitest-environment happy-dom
// === 사이드바 퀘스트 요약 ===
// 목표(docs/loop/reference/ui-refs/main-screen-v2.png)의 좌측 컬럼은 `퀘스트 (QUESTS)` 아래
// `☑ 북촌 탐색 (진행중)` 같은 줄을 늘 보여준다. 지금까지는 퀘스트 창을 열어야만 보였다.
// 어떤 퀘스트가 진행 중인지는 사이드바가 다시 정하지 않고 QuestPanel 이 아는 것을 읽는다 —
// 두 곳이 각자 고르면 사이드바와 퀘스트 창이 서로 다른 목록을 말한다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import EventBus     from '../../js/core/EventBus.js';
import GameState    from '../../js/core/GameState.js';
import QuestPanel   from '../../js/ui/QuestPanel.js';
import QuestSidebar from '../../js/ui/QuestSidebar.js';
import MAIN_QUESTS  from '../../js/data/mainQuests/index.js';

const MAIN_JS    = readFileSync(path.resolve('js/screens/Main.js'), 'utf8');
const LAYOUT_CSS = readFileSync(path.resolve('css/layout.css'), 'utf8');
const MOBILE_CSS = readFileSync(path.resolve('css/mobile.css'), 'utf8');

const TODAY = 5;

// _buildLayout() 템플릿의 사이드바 조각만 떼어 DOM 으로 읽는다 (SidebarSectionOrder.test.js 와 같은 방식)
function sidebar() {
  const html = MAIN_JS
    .slice(MAIN_JS.indexOf('<aside class="bc-sidebar">'), MAIN_JS.indexOf('</aside>') + 8)
    .replace(/\$\{[^}]*\}/g, '');
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild;
}

// 사이드바 블록만 세우고 render() 를 돌린다 — 화면 전체를 띄우지 않는다
function mountBlock() {
  document.body.innerHTML = `
    <section id="bc-quest-section">
      <div class="bc-side-title">퀘스트 <span class="bc-quest-more" id="bc-quest-more"></span></div>
      <div class="bc-quests-block" id="bc-quest-list"></div>
    </section>
  `;
  QuestSidebar.render();
  return document.getElementById('bc-quest-list');
}

function resetWorld(active) {
  EventBus._listeners = {};
  GameState.time = { day: TODAY, totalTP: 0, tpInDay: 0, hour: 6, isPaused: false };
  GameState.season = { current: 'spring', eventsTriggered: [] };
  GameState.player.characterId = 'doctor';
  GameState.flags = {};
  GameState.quests = { active, completed: ['mq_doctor_01'], failed: [] };
  GameState.subObjectiveProgress = {};
  QuestPanel._ui = { tab: 'all', sort: 'deadline', search: '', selectedId: null };
}

// deadline = startDay + deadlineDays. day 5 기준 D-1 / D-7 / D-15
const THREE = [
  { id: 'mq_doctor_02', startDay: 2, deadline: 6,  progress: 0 },
  { id: 'mq_doctor_03', startDay: 4, deadline: 12, progress: 0 },
  { id: 'mq_doctor_04', startDay: 4, deadline: 20, progress: 0 },
];

const rowText = (el) => [...el.querySelectorAll('.bc-quest-item')]
  .map(r => r.textContent.replace(/\s+/g, ' ').trim());

describe('사이드바 퀘스트 블록 마크업', () => {
  it('행동 메뉴 위에 퀘스트 섹션이 있고 목록 자리와 `+N` 자리를 들고 있다', () => {
    const section = sidebar().querySelector('#bc-quest-section');

    expect(section).not.toBeNull();
    expect(section.querySelector('#bc-quest-list')).not.toBeNull();
    expect(section.querySelector('#bc-quest-more')).not.toBeNull();
  });

  it('목록 상자는 `.bc-quests-block` 이다 — 모바일 HUD 바가 이 클래스로 접는다', () => {
    expect(sidebar().querySelector('#bc-quest-list').className).toBe('bc-quests-block');
  });
});

describe('QuestPanel.activeSummary', () => {
  beforeEach(() => resetWorld(THREE));

  it('진행 중인 것만 준다 — 완료·대기는 빼고 급한 순으로 놓는다', () => {
    const { items } = QuestPanel.activeSummary(3);

    expect(items.map(q => q.id)).toEqual(['mq_doctor_02', 'mq_doctor_03', 'mq_doctor_04']);
    expect(items[0].category).toBe('urgent');
    expect(items.some(q => q.category === 'done' || q.category === 'locked')).toBe(false);
  });

  it('total 은 잘라내기 전 개수다 — 사이드바가 이걸로 `더 있다`를 말한다', () => {
    const { items, total } = QuestPanel.activeSummary(2);

    expect(items.length).toBe(2);
    expect(total).toBe(3);
  });

  it('모달의 정렬 선택이 사이드바 순서를 바꾸지 않는다', () => {
    QuestPanel._ui.sort = 'name';

    expect(QuestPanel.activeSummary(3).items.map(q => q.id))
      .toEqual(['mq_doctor_02', 'mq_doctor_03', 'mq_doctor_04']);
  });
});

describe('사이드바에 그려지는 줄', () => {
  it('두 줄만 그리고 나머지는 `+N` 으로 접는다', () => {
    resetWorld(THREE);
    const el = mountBlock();

    expect(el.querySelectorAll('.bc-quest-item').length).toBe(2);
    expect(document.getElementById('bc-quest-more').textContent).toBe('+1');
  });

  it('두 줄 안에 다 들어가면 `+N` 을 붙이지 않는다', () => {
    resetWorld(THREE.slice(0, 2));
    mountBlock();

    expect(document.getElementById('bc-quest-more').textContent).toBe('');
  });

  it('목표와 같은 `☑ 제목 (상태)` 형식이고 급한 것이 맨 위다', () => {
    resetWorld(THREE);
    const rows = rowText(mountBlock());

    expect(rows[0]).toBe(`☑ ${MAIN_QUESTS.mq_doctor_02.title} (D-1)`);
    expect(rows[1]).toBe(`☑ ${MAIN_QUESTS.mq_doctor_03.title} (D-7)`);
  });

  it('마감이 임박한 줄은 색이 갈린다', () => {
    resetWorld(THREE);
    const items = mountBlock().querySelectorAll('.bc-quest-item');

    expect(items[0].classList.contains('urgent')).toBe(true);
    expect(items[1].classList.contains('urgent')).toBe(false);
  });

  it('마감이 없는 퀘스트는 진행도를, 진행도도 없으면 `진행중` 을 적는다', () => {
    // mq_doctor_a_15: 마감 없음 · objective.count 5 / mq_doctor_hl_pharmacy: 마감 없음 · 단발
    resetWorld([
      { id: 'mq_doctor_a_15',       startDay: 1, deadline: Infinity, progress: 2 },
      { id: 'mq_doctor_hl_pharmacy', startDay: 1, deadline: Infinity, progress: 0 },
    ]);
    const rows = rowText(mountBlock());

    expect(rows[0]).toBe(`☑ ${MAIN_QUESTS.mq_doctor_a_15.title} (2/5)`);
    expect(rows[1]).toBe(`☑ ${MAIN_QUESTS.mq_doctor_hl_pharmacy.title} (진행중)`);
  });

  it('진행 중인 퀘스트가 없으면 빈 줄 대신 그렇다고 적는다', () => {
    resetWorld([]);
    const el = mountBlock();

    expect(el.querySelectorAll('.bc-quest-item').length).toBe(0);
    expect(el.querySelector('.bc-quest-empty')).not.toBeNull();
  });
});

describe('블록이 차지하는 높이', () => {
  // 남은 세로 여백이 76px 뿐이다. 줄이 두 줄로 접히거나 게이지가 붙으면
  // 맨 아래 행동 메뉴가 스크롤 밖으로 밀린다. happy-dom 은 레이아웃을 계산하지 않아
  // 좌표로는 못 잡으므로 선언으로 막는다.
  it('한 줄은 접히지 않고 제목만 줄여서 자른다', () => {
    const rule = LAYOUT_CSS.match(/\.bc-quest-title\s*\{[^}]*\}/)[0];

    expect(rule).toMatch(/white-space:\s*nowrap/);
    expect(rule).toMatch(/text-overflow:\s*ellipsis/);
  });

  it('상태(D-1 · 2/5)는 줄어들지 않는다 — 잘리면 뜻이 바뀐다', () => {
    expect(LAYOUT_CSS.match(/\.bc-quest-state\s*\{[^}]*\}/)[0]).toMatch(/flex-shrink:\s*0/);
  });

  it('모바일 HUD 바에서는 블록을 통째로 접는다', () => {
    const hides = MOBILE_CSS.match(/\.bc-quests-block,/g) ?? [];

    expect(hides.length).toBe(2);   // 세로 2단(≤480px) + 가로 랜드스케이프
  });
});
