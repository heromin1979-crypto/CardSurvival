// === QUEST PANEL ===
// Sidebar panel showing 3 tiers: active quests with subObjective checklist,
// upcoming quests (prerequisite met, dayTrigger near), and locked future quests.

import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import I18n       from '../core/I18n.js';
import MAIN_QUESTS from '../data/mainQuests/index.js';

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
        <h3 class="quest-panel-title">🎯 ${this._t('quest.panelTitle', '퀘스트')}</h3>

        <div class="quest-panel-active">
          ${active.length === 0
            ? `<div class="quest-empty">${this._t('quest.noneActive', '활성 퀘스트 없음')}</div>`
            : active.map(q => this._renderActive(q)).join('')}
        </div>

        ${next.length > 0 ? `
          <div class="quest-panel-next">
            <h4>${this._t('quest.next', '다음')}</h4>
            ${next.map(q => this._renderNext(q)).join('')}
          </div>
        ` : ''}

        ${locked.length > 0 ? `
          <details class="quest-panel-locked">
            <summary>${this._t('quest.locked', '잠긴 미래')} (${locked.length})</summary>
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
    return `
      <div class="quest-active" data-quest-id="${this._escape(q.id)}">
        <div class="quest-row">
          <span class="quest-icon">${q.icon ?? '📌'}</span>
          <span class="quest-title">${this._escape(q.title)}</span>
          ${left != null ? `<span class="quest-deadline ${dlClass}">D-${left}</span>` : ''}
        </div>
        <div class="quest-desc">${this._escape(q.actionHint ?? q.desc ?? '')}</div>
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
          <div class="quest-location">📍 ${this._escape(q.locationHint.note ?? q.locationHint.districtId ?? '')}</div>
        ` : ''}
      </div>
    `;
  },

  _renderNext(q) {
    return `
      <div class="quest-next-row">
        <span>${q.icon ?? '·'}</span> ${this._escape(q.title)}
        ${q.dayTrigger != null ? ` <span class="quest-trigger">Day ${q.dayTrigger}</span>` : ''}
      </div>
    `;
  },

  _renderLocked(q) {
    return `<div class="quest-locked-row">${q.icon ?? '·'} ${this._escape(q.title)}</div>`;
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

  _t(key, fallback) {
    try { return I18n.t(key) || fallback; } catch { return fallback; }
  },

  _escape(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    })[c]);
  },
};

export default QuestPanel;
