// === QUEST SIDEBAR ===
// 좌측 사이드바에 진행 중인 퀘스트를 상시 노출한다 (목표: main-screen-v2.png 의 `퀘스트 (QUESTS)`).
// 목록과 급한 순서는 `QuestPanel.activeSummary()`가 정한 것을 그대로 받는다 —
// 여기서 다시 고르면 사이드바와 퀘스트 창이 서로 다른 목록을 말한다.

import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import QuestPanel from './QuestPanel.js';

// 사이드바에 남은 세로 여백이 76px 뿐이다 (`tools/capture-sidebar.mjs` 의 freeBelow).
// 제목이 21px, 한 줄이 16px 이라 세 줄이면 행동 메뉴가 스크롤 밖으로 밀린다.
// 목표 이미지도 두 줄이고, 나머지는 제목 옆 `+N`과 퀘스트 창이 받는다.
const VISIBLE = 2;

const QuestSidebar = {
  _subscribed: false,

  init() {
    if (!this._subscribed) {
      const refresh = () => { if (GameState.ui.currentState === 'main') this.render(); };
      EventBus.on('questListChanged',      refresh);
      EventBus.on('mainQuestActivated',    refresh);
      EventBus.on('mainQuestCompleted',    refresh);
      EventBus.on('subObjectiveCompleted', refresh);
      EventBus.on('dayStarted',            refresh);   // 마감이 하루씩 다가온다
      this._subscribed = true;
    }
    this.render();
  },

  render() {
    const list = document.getElementById('bc-quest-list');
    if (!list) return;

    const { items, total } = QuestPanel.activeSummary(VISIBLE);

    const more = document.getElementById('bc-quest-more');
    if (more) more.textContent = total > items.length ? `+${total - items.length}` : '';

    list.innerHTML = items.length === 0
      ? `<div class="bc-quest-empty">진행 중인 퀘스트 없음</div>`
      : items.map(q => this._row(q)).join('');
  },

  /** 목표의 한 줄은 `☑ 북촌 탐색 (진행중)` 이다. 상태 자리에 가장 급한 것을 넣는다. */
  _row(q) {
    const urgent = q.category === 'urgent';
    const state = q.daysLeft != null      ? `D-${q.daysLeft}`
                : q.progress.total > 1    ? `${q.progress.cur}/${q.progress.total}`
                : '진행중';
    return `
      <div class="bc-quest-item${urgent ? ' urgent' : ''}" title="${escapeHtml(q.title)}">
        <span class="bc-quest-check">☑</span>
        <span class="bc-quest-title">${escapeHtml(q.title)}</span>
        <span class="bc-quest-state">(${escapeHtml(state)})</span>
      </div>
    `;
  },
};

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export default QuestSidebar;
