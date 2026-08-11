// === QUEST PANEL ===
// Sidebar panel showing 3 tiers: active quests with subObjective checklist,
// upcoming quests (prerequisite met, dayTrigger near), and locked future quests.

import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import MAIN_QUESTS from '../data/mainQuests/index.js';
import { uiIcon } from './UiIcon.js';

const QuestPanel = {
  _root: null,
  _subscribed: false,

  mount(rootEl) {
    if (!rootEl) return;
    this._root = rootEl;
    this._render();
    if (!this._subscribed) {
      EventBus.on('mainQuestActivated',    () => this._render());
      EventBus.on('mainQuestCompleted',    () => this._render());
      EventBus.on('subObjectiveCompleted', () => this._render());
      EventBus.on('dayStarted',            () => this._render());
      EventBus.on('questListChanged',      () => this._render());
      this._subscribed = true;
    }
  },

  _render() {
    if (!this._root) return;
    const active = this._activeQuests();
    const next   = this._upcomingQuests();
    const locked = this._lockedFutureQuests();

    this._root.innerHTML = `
      <div class="quest-panel">
        <div class="quest-panel-active">
          ${active.length === 0
            ? `<div class="quest-empty">활성 퀘스트가 없습니다</div>`
            : active.map(q => this._renderActive(q)).join('')}
        </div>

        ${next.length > 0 ? `
          <div class="quest-panel-next">
            <h4>다음에 열릴 퀘스트</h4>
            ${next.map(q => this._renderNext(q)).join('')}
          </div>
        ` : ''}

        ${locked.length > 0 ? `
          <details class="quest-panel-locked">
            <summary>아직 잠긴 퀘스트 (${locked.length}) <span class="quest-locked-hint">— 이전 퀘스트를 끝내면 열립니다</span></summary>
            ${locked.map(q => this._renderLocked(q)).join('')}
          </details>
        ` : ''}
      </div>
    `;
  },

  _renderActive(q) {
    const sos = q.subObjectives ?? [];
    const progress = GameState.subObjectiveProgress?.[q.id] ?? {};
    const left = this._daysLeft(q);
    const dlClass = left == null ? '' : left <= 1 ? 'urgent' : left <= 3 ? 'warn' : '';
    const doneCount = sos.filter(so => progress[so.id]).length;
    const totalCount = sos.length;
    const subPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    const curDistrict = GameState.location?.currentDistrict ?? '';
    const targetDist  = q.locationHint?.districtId ?? '';
    const onTarget    = targetDist && curDistrict === targetDist;

    // 진행 바는 완료 판정과 동일한 카운터(q._entry.progress)를 우선 표시.
    // 체크리스트 개수 바는 objective가 단발성(count 1)이라 바로 쓸 숫자가 없을 때의 폴백.
    const objBar = this._objectiveProgress(q);
    const useObjBar = objBar && (totalCount === 0 || objBar.total > 1);

    return `
      <div class="quest-active" data-quest-id="${this._escape(q.id)}">
        <div class="quest-row">
          <span class="quest-icon">${q.icon ?? '📌'}</span>
          <span class="quest-title">${this._escape(q.title)}</span>
          ${left != null ? `<span class="quest-deadline ${dlClass}">D-${left}</span>` : ''}
        </div>
        <div class="quest-desc">${this._escape(q.actionHint ?? q.desc ?? '')}</div>
        ${useObjBar ? `
          <div class="quest-progress">
            <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${objBar.pct}%"></div></div>
            <span class="quest-progress-text">${objBar.cur}/${objBar.total}</span>
          </div>
        ` : totalCount > 0 ? `
          <div class="quest-progress">
            <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${subPct}%"></div></div>
            <span class="quest-progress-text">${doneCount}/${totalCount}</span>
          </div>` : ''}
        ${sos.length > 0 ? `
          <ul class="quest-subobjectives">
            ${sos.map(so => `
              <li class="${progress[so.id] ? 'done' : ''}">
                ${progress[so.id] ? '☑' : '☐'} ${this._escape(so.text)}
                ${so.hint ? `<span class="quest-hint">— ${this._escape(so.hint)}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        ` : ''}
        ${q.locationHint ? `
          <div class="quest-location ${onTarget ? 'on-target' : ''}">
            📍 ${this._escape(q.locationHint.note ?? q.locationHint.districtId ?? '')}
            ${onTarget ? '<span class="quest-location-tag">현 위치</span>' : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  _renderNext(q) {
    const desc = q.desc || q.actionHint || q.narrative?.start || '';
    const loc  = q.locationHint?.note || q.locationHint?.districtId || '';
    const dl   = (q.deadlineDays != null && q.deadlineDays !== Infinity)
      ? `마감 ${q.deadlineDays}일`
      : '';
    return `
      <div class="quest-next-row">
        <div class="quest-next-head">
          <span>${q.icon ?? '·'}</span> ${this._escape(q.title)}
          ${q.dayTrigger != null ? ` <span class="quest-trigger">Day ${q.dayTrigger} 시작</span>` : ''}
          ${dl ? ` <span class="quest-trigger">${dl}</span>` : ''}
        </div>
        ${desc ? `<div class="quest-next-desc">${this._escape(desc)}</div>` : ''}
        ${loc ? `<div class="quest-next-loc">📍 ${this._escape(loc)}</div>` : ''}
      </div>
    `;
  },

  _renderLocked(q) {
    const prereq = q.prerequisite ? MAIN_QUESTS[q.prerequisite] : null;
    const reason = prereq
      ? `'${prereq.title}' 완료 후 해금`
      : (q.dayTrigger != null ? `Day ${q.dayTrigger} 도달 후 해금` : '조건 미달');
    return `
      <div class="quest-locked-row">
        <span>${q.icon ?? '·'} ${this._escape(q.title)}</span>
        <span class="quest-locked-reason">${uiIcon('lock')} ${this._escape(reason)}</span>
      </div>
    `;
  },

  /**
   * 활성 퀘스트의 top-level objective 진행도. subObjectives 미사용 퀘스트용.
   * QuestSystem이 q._entry.progress를 objective.count까지 누적한다.
   */
  _objectiveProgress(q) {
    const total = q.objective?.count;
    if (!total || total <= 0) return null;
    const cur = Math.min(total, q._entry?.progress ?? 0);
    return { cur, total, pct: Math.round((cur / total) * 100) };
  },

  _activeQuests() {
    const entries = GameState.quests?.active ?? [];
    return entries.map(e => ({ ...MAIN_QUESTS[e.id], _entry: e })).filter(q => q.id);
  },

  _upcomingQuests() {
    const character = GameState.player?.characterId;
    const completed = new Set(GameState.quests?.completed ?? []);
    const active    = new Set((GameState.quests?.active ?? []).map(e => e.id));
    const today     = GameState.time?.day ?? 1;
    return Object.values(MAIN_QUESTS)
      .filter(q => q.characterId === character)
      .filter(q => !completed.has(q.id) && !active.has(q.id))
      .filter(q => !q.prerequisite || completed.has(q.prerequisite))
      .filter(q => q.dayTrigger == null || q.dayTrigger - today <= 5)
      .slice(0, 2);
  },

  _lockedFutureQuests() {
    const character = GameState.player?.characterId;
    const completed = new Set(GameState.quests?.completed ?? []);
    const active    = new Set((GameState.quests?.active ?? []).map(e => e.id));
    return Object.values(MAIN_QUESTS)
      .filter(q => q.characterId === character)
      .filter(q => !completed.has(q.id) && !active.has(q.id))
      .filter(q => q.prerequisite && !completed.has(q.prerequisite))
      .slice(0, 5);
  },

  // 활성 entry의 startDay를 1차 source로 사용 — _activeQuests가 _entry로 첨부함
  _daysLeft(q) {
    if (q.deadlineDays == null || q.deadlineDays === Infinity) return null;
    const startedDay = q._entry?.startDay ?? GameState.time?.day ?? 1;
    const elapsed = (GameState.time?.day ?? 1) - startedDay;
    return Math.max(0, q.deadlineDays - elapsed);
  },

  _escape(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    })[c]);
  },
};

export default QuestPanel;
