// === QUEST PANEL ===
// 퀘스트 모달의 마스터-디테일 렌더러 (QUEST_UI_DESIGN.md v1.0).
// 좌측 리스트에서 고른 퀘스트를 우측 상세(히어로 · 목표 · 보상 · 위치 · 힌트)로 펼친다.

import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import MAIN_QUESTS from '../data/mainQuests/index.js';
import ITEMS       from '../data/items.js';
import { DISTRICTS } from '../data/districts.js';
import { uiIcon }  from './UiIcon.js';

const TABS = [
  { id: 'all',    label: '전체' },
  { id: 'main',   label: '메인' },
  { id: 'urgent', label: '긴급' },
  { id: 'done',   label: '완료' },
  { id: 'locked', label: '잠김' },
];

const CATEGORY_LABEL = {
  urgent: '긴급',
  main:   '메인',
  done:   '완료',
  locked: '잠김',
};

const SEASON_LABEL = {
  spring: '봄', summer: '여름', autumn: '가을', winter: '겨울',
};

// 마감이 3일 이하로 남으면 긴급 카테고리로 승격 — 스펙의 색상 서사(위기→성취) 기준점
const URGENT_DAYS = 3;

// dayTrigger가 이만큼 이내로 다가온 미시작 퀘스트만 '대기'로 노출 (기존 패널 규칙 유지)
const UPCOMING_WINDOW_DAYS = 5;
const UPCOMING_LIMIT = 2;
const LOCKED_LIMIT   = 5;

const QuestPanel = {
  _root: null,
  _boundRoot: null,
  _subscribed: false,
  _composing: false,

  _ui: { tab: 'all', sort: 'deadline', search: '', selectedId: null },

  mount(rootEl) {
    if (!rootEl) return;
    this._root = rootEl;
    // 창을 다시 열 때 지난 필터가 남아 "퀘스트가 없다"로 보이지 않게 한다. 정렬만 취향으로 유지.
    this._ui.tab = 'all';
    this._ui.search = '';
    this._ui.selectedId = null;
    this._render();
    this._bindRoot(rootEl);
    if (!this._subscribed) {
      const refresh = () => this._refreshBody();
      EventBus.on('mainQuestActivated',    refresh);
      EventBus.on('mainQuestCompleted',    refresh);
      EventBus.on('subObjectiveCompleted', refresh);
      EventBus.on('dayStarted',            refresh);
      EventBus.on('questListChanged',      refresh);
      this._subscribed = true;
    }
  },

  // ── 이벤트 배선 ────────────────────────────────────────

  _bindRoot(rootEl) {
    if (this._boundRoot === rootEl) return;
    this._boundRoot = rootEl;

    rootEl.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-quest-tab]');
      if (tab) {
        this._ui.tab = tab.dataset.questTab;
        this._ui.selectedId = null;
        this._refreshBody();
        return;
      }
      const sort = e.target.closest('[data-quest-sort]');
      if (sort) {
        this._ui.sort = sort.dataset.questSort;
        this._refreshBody();
        return;
      }
      const item = e.target.closest('[data-quest-id]');
      if (item) {
        this._ui.selectedId = item.dataset.questId;
        this._refreshBody();
        return;
      }
      if (e.target.closest('[data-quest-action="close"]')) {
        document.getElementById('quest-modal')?.classList.remove('open');
      }
    });

    // 한글 조합 중 재렌더는 입력을 끊으므로 조합이 끝난 뒤에만 필터를 반영한다.
    rootEl.addEventListener('compositionstart', () => { this._composing = true; });
    rootEl.addEventListener('compositionend', (e) => {
      this._composing = false;
      if (e.target.matches('[data-quest-search]')) {
        this._ui.search = e.target.value;
        this._refreshBody();
      }
    });
    rootEl.addEventListener('input', (e) => {
      if (!e.target.matches('[data-quest-search]')) return;
      this._ui.search = e.target.value;
      if (!this._composing) this._refreshBody();
    });
  },

  // ── 렌더 ──────────────────────────────────────────────

  _render() {
    if (!this._root) return;
    this._root.innerHTML = `
      <div class="fmd-wrap" role="dialog" aria-modal="true" aria-labelledby="fmd-title">
        ${this._renderHeader()}
        <div class="fmd-tabs" role="tablist"></div>
        <div class="fmd-split">
          <div class="fmd-left">
            <div class="fmd-search">
              <input type="text" data-quest-search placeholder="퀘스트 검색" aria-label="퀘스트 검색"
                     value="${this._escape(this._ui.search)}">
              <span class="fmd-search-hint">🔍</span>
            </div>
            <div class="fmd-sortbar">
              <button type="button" data-quest-sort="deadline">마감 임박순</button>
              <button type="button" data-quest-sort="name">이름순</button>
            </div>
            <div class="fmd-list" role="listbox" aria-label="퀘스트 목록"></div>
            <div class="fmd-left-footer"></div>
          </div>
          <div class="fmd-right"></div>
        </div>
        <div class="fmd-footer">
          <div class="fmd-stats"></div>
          <button type="button" class="fmd-btn" data-quest-action="close">닫기</button>
        </div>
      </div>
    `;
    this._refreshBody();
  },

  /** 검색 입력(IME 조합)을 보존하기 위해 입력 요소를 제외한 영역만 갱신한다. */
  _refreshBody() {
    if (!this._root) return;
    const wrap = this._root.querySelector('.fmd-wrap');
    if (!wrap) { this._render(); return; }

    const all      = this._collect();
    const filtered = this._sort(this._filter(all));

    if (!filtered.some(q => q.id === this._ui.selectedId)) {
      this._ui.selectedId = filtered[0]?.id ?? null;
    }
    const selected = filtered.find(q => q.id === this._ui.selectedId) ?? null;

    wrap.querySelector('.fmd-tabs').innerHTML        = this._renderTabs(all);
    wrap.querySelector('.fmd-list').innerHTML        = this._renderList(filtered);
    wrap.querySelector('.fmd-left-footer').innerHTML = `표시 ${filtered.length} / 전체 ${all.length}`;
    wrap.querySelector('.fmd-right').innerHTML       = this._renderDetail(selected);
    wrap.querySelector('.fmd-stats').innerHTML       = this._renderStats(all);

    for (const el of wrap.querySelectorAll('[data-quest-sort]')) {
      el.classList.toggle('active', el.dataset.questSort === this._ui.sort);
    }
  },

  _renderHeader() {
    const day    = GameState.time?.day ?? 1;
    const hour   = GameState.time?.hour ?? 6;
    const minute = ((GameState.time?.tpInDay ?? 0) % 3) * 20;
    const season = SEASON_LABEL[GameState.season?.current] ?? '';
    return `
      <div class="fmd-header">
        <div class="fmd-title" id="fmd-title">${uiIcon('quest')} 퀘스트</div>
        <div class="fmd-chips">
          <span class="fmd-chip day">DAY ${day}</span>
          <span class="fmd-chip time">${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}</span>
          ${season ? `<span class="fmd-chip season">${season}</span>` : ''}
        </div>
      </div>
    `;
  },

  _renderTabs(all) {
    return TABS.map(t => {
      const count = t.id === 'all' ? all.length : all.filter(q => q.category === t.id).length;
      const active = this._ui.tab === t.id;
      return `
        <button type="button" class="fmd-tab ${active ? 'active' : ''}" role="tab"
                aria-selected="${active}" data-quest-tab="${t.id}">
          ${t.label}<span class="fmd-tab-count">${count}</span>
        </button>
      `;
    }).join('');
  },

  _renderList(quests) {
    if (quests.length === 0) {
      return `<div class="fmd-list-empty">조건에 맞는 퀘스트가 없습니다</div>`;
    }
    const grouped = this._ui.tab === 'all';
    let lastCategory = null;
    return quests.map(q => {
      const selected = q.id === this._ui.selectedId;
      const head = grouped && q.category !== lastCategory
        ? `<div class="fmd-group-label">${CATEGORY_LABEL[q.category]}</div>`
        : '';
      lastCategory = q.category;
      return `${head}
        <button type="button" class="fmd-item ${q.category} ${selected ? 'selected' : ''}"
                role="option" aria-selected="${selected}" data-quest-id="${this._escape(q.id)}">
          <span class="fmd-item-icon">${q.icon}</span>
          <span class="fmd-item-main">
            <span class="fmd-item-name">${this._escape(q.title)}</span>
            <span class="fmd-item-meta">${this._escape(q.metaLine)}</span>
            <span class="fmd-item-bar"><i style="width:${q.progress.pct}%"></i></span>
          </span>
          ${q.badge ? `<span class="fmd-item-badge ${q.badge.tone}">${this._escape(q.badge.text)}</span>` : ''}
        </button>
      `;
    }).join('');
  },

  _renderDetail(q) {
    if (!q) {
      return `
        <div class="fmd-empty">
          <div class="fmd-empty-icon">📜</div>
          <div>표시할 퀘스트가 없습니다</div>
        </div>
      `;
    }
    return `
      ${this._renderHero(q)}
      <div class="fmd-content">
        <div class="fmd-col">
          ${q.story ? `
            <div class="fmd-sec-label">상황</div>
            <div class="fmd-story">${this._escape(q.story)}</div>
          ` : ''}
          <div class="fmd-sec-label">세부 목표</div>
          <div class="fmd-objs">${this._renderObjectives(q)}</div>
        </div>
        <div class="fmd-col">
          ${q.lockReason ? `
            <div class="fmd-sec-label">해금 조건</div>
            <div class="fmd-lock">${uiIcon('lock')} <span>${this._escape(q.lockReason)}</span></div>
          ` : ''}
          ${q.rewards.length > 0 ? `
            <div class="fmd-sec-label">보상</div>
            <div class="fmd-rewards">${this._renderRewards(q)}</div>
          ` : ''}
          ${q.location ? `
            <div class="fmd-sec-label">위치</div>
            ${this._renderLocation(q.location)}
          ` : ''}
          ${q.hint ? `
            <div class="fmd-sec-label">힌트</div>
            <div class="fmd-hint">💡 <span>${this._escape(q.hint)}</span></div>
          ` : ''}
        </div>
      </div>
      <div class="fmd-actions">
        ${q.location?.districtId && q.category !== 'done'
          ? `<button type="button" class="fmd-btn primary" data-action="open-seoul-map">🗺 지도에서 보기</button>`
          : ''}
        <button type="button" class="fmd-btn" data-quest-action="close">닫기</button>
      </div>
    `;
  },

  _renderHero(q) {
    const tags = [
      q.category === 'urgent' ? `<span class="fmd-tag urgent">⚠ 긴급</span>` : '',
      q.category === 'done'   ? `<span class="fmd-tag done">✓ 완료</span>`   : '',
      `<span class="fmd-tag main">⚔ 메인</span>`,
      q.dayTrigger != null ? `<span class="fmd-tag">DAY ${q.dayTrigger} 개시</span>` : '',
      q.isBranchPoint ? `<span class="fmd-tag branch">분기점</span>` : '',
    ].filter(Boolean).join('');

    return `
      <div class="fmd-hero ${q.category}">
        <div class="fmd-hero-tags">${tags}</div>
        <div class="fmd-hero-head">
          <span class="fmd-hero-icon">${q.icon}</span>
          <h3 class="fmd-hero-title">${this._escape(q.title)}</h3>
        </div>
        <div class="fmd-hero-giver">의뢰 · <b>${this._escape(q.giver)}</b></div>
        <div class="fmd-hero-bottom">
          ${q.countdown ? `
            <div class="fmd-cd" aria-live="polite">
              ${q.countdown.map(b => `
                <div class="fmd-cd-block ${b.critical ? 'critical' : ''}">
                  <span class="num">${b.value}</span><span class="lbl">${b.label}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="fmd-hero-prog">
            <div class="fmd-bar"><i style="width:${q.progress.pct}%"></i></div>
            <span class="fmd-prog-pct">${q.progress.cur}/${q.progress.total} · ${q.progress.pct}%</span>
          </div>
        </div>
      </div>
    `;
  },

  _renderObjectives(q) {
    return q.objectives.map(o => `
      <div class="fmd-obj-item ${o.status}">
        <span class="fmd-obj-check">${o.status === 'done' ? '✓' : o.status === 'current' ? '▸' : ''}</span>
        <span class="fmd-obj-text">
          <span class="fmd-obj-main">${this._escape(o.text)}</span>
          ${o.hint ? `<span class="fmd-obj-hint">${this._escape(o.hint)}</span>` : ''}
        </span>
      </div>
    `).join('');
  },

  _renderRewards(q) {
    return q.rewards.map(r => `
      <div class="fmd-reward ${r.type}" ${r.tooltip ? `title="${this._escape(r.tooltip)}"` : ''}>
        <span class="fmd-reward-icon">${r.icon}</span>
        <span class="fmd-reward-name">${this._escape(r.name)}</span>
        <span class="fmd-reward-amt">${this._escape(r.amount)}</span>
      </div>
    `).join('');
  },

  _renderLocation(loc) {
    return `
      <div class="fmd-loc">
        <span class="fmd-loc-icon">📍</span>
        <span class="fmd-loc-body">
          <span class="fmd-loc-name">${this._escape(loc.name)}</span>
          ${loc.note ? `<span class="fmd-loc-note">${this._escape(loc.note)}</span>` : ''}
        </span>
        ${loc.onTarget ? `<span class="fmd-loc-tag">현 위치</span>` : ''}
      </div>
    `;
  },

  _renderStats(all) {
    const n = c => all.filter(q => q.category === c).length;
    return `
      <span>진행 <b>${n('main') + n('urgent')}</b></span>
      <span>긴급 <b>${n('urgent')}</b></span>
      <span>완료 <b>${n('done')}</b></span>
      <span>대기 <b>${n('locked')}</b></span>
    `;
  },

  // ── 필터 · 정렬 ────────────────────────────────────────

  _filter(quests) {
    const term = this._ui.search.trim().toLowerCase();
    return quests.filter(q => {
      if (this._ui.tab !== 'all' && q.category !== this._ui.tab) return false;
      if (!term) return true;
      return `${q.title} ${q.desc}`.toLowerCase().includes(term);
    });
  },

  _sort(quests) {
    const order = { urgent: 0, main: 1, locked: 2, done: 3 };
    const byName = this._ui.sort === 'name';
    return [...quests].sort((a, b) => {
      if (order[a.category] !== order[b.category]) return order[a.category] - order[b.category];
      if (byName) return a.title.localeCompare(b.title, 'ko');
      const ad = a.daysLeft ?? Infinity;
      const bd = b.daysLeft ?? Infinity;
      if (ad !== bd) return ad - bd;
      return (a.dayTrigger ?? Infinity) - (b.dayTrigger ?? Infinity);
    });
  },

  // ── 데이터 수집 ────────────────────────────────────────

  _collect() {
    const character  = GameState.player?.characterId;
    const entries    = GameState.quests?.active ?? [];
    const completed  = GameState.quests?.completed ?? [];
    const activeIds  = new Set(entries.map(e => e.id));
    const doneIds    = new Set(completed);
    const today      = GameState.time?.day ?? 1;

    const out = [];

    for (const entry of entries) {
      const def = MAIN_QUESTS[entry.id];
      if (def) out.push(this._viewModel(def, entry, 'active'));
    }
    for (const id of completed) {
      const def = MAIN_QUESTS[id];
      if (def) out.push(this._viewModel(def, null, 'done'));
    }

    const pending = Object.values(MAIN_QUESTS)
      .filter(def => def.characterId === character)
      .filter(def => !activeIds.has(def.id) && !doneIds.has(def.id))
      .filter(def => this._flagsMet(def));

    // 곧 열릴 퀘스트와 선행 퀘스트 대기분을 기존 패널과 같은 폭으로 노출한다.
    const upcoming = pending
      .filter(def => !def.prerequisite || doneIds.has(def.prerequisite))
      .filter(def => def.dayTrigger == null || def.dayTrigger - today <= UPCOMING_WINDOW_DAYS)
      .slice(0, UPCOMING_LIMIT);
    const upcomingIds = new Set(upcoming.map(d => d.id));
    const blocked = pending
      .filter(def => def.prerequisite && !doneIds.has(def.prerequisite))
      .filter(def => !upcomingIds.has(def.id))
      .slice(0, LOCKED_LIMIT);

    for (const def of [...upcoming, ...blocked]) out.push(this._viewModel(def, null, 'locked'));

    return out;
  },

  _flagsMet(def) {
    const flags = GameState.flags ?? {};
    if (def.requiresFlag && !flags[def.requiresFlag]) return false;
    if (def.requiresAllFlags && !def.requiresAllFlags.every(f => flags[f])) return false;
    return true;
  },

  _viewModel(def, entry, state) {
    const daysLeft   = state === 'active' ? this._daysLeft(def, entry) : null;
    const category   = state === 'done'   ? 'done'
                     : state === 'locked' ? 'locked'
                     : (daysLeft != null && daysLeft <= URGENT_DAYS) ? 'urgent'
                     : 'main';
    const progress   = this._progress(def, entry, state);
    const objectives = this._objectives(def, entry, state);

    return {
      id: def.id,
      title: def.title ?? def.id,
      desc: def.desc ?? '',
      icon: def.icon ?? '📌',
      giver: '내면의 목소리',
      category,
      daysLeft,
      dayTrigger: def.dayTrigger ?? null,
      isBranchPoint: !!def.isBranchPoint,
      story: def.narrative?.start ?? def.desc ?? '',
      progress,
      objectives,
      rewards: this._rewards(def),
      location: this._location(def),
      hint: def.actionHint ?? null,
      lockReason: state === 'locked' ? this._lockReason(def) : null,
      badge: this._badge(category, daysLeft, progress),
      metaLine: this._metaLine(category, daysLeft, progress, def),
      countdown: category === 'urgent' || (category === 'main' && daysLeft != null)
        ? this._countdown(daysLeft)
        : null,
    };
  },

  /**
   * 진행도는 완료 판정과 같은 카운터(entry.progress)를 우선한다.
   * objective가 단발성(count 1)일 때만 체크리스트 개수를 폴백으로 쓴다.
   */
  _progress(def, entry, state) {
    if (state === 'done') return { cur: 1, total: 1, pct: 100 };

    const objTotal = def.objective?.count ?? 0;
    if (objTotal > 1) {
      const cur = Math.min(objTotal, entry?.progress ?? 0);
      return { cur, total: objTotal, pct: Math.round((cur / objTotal) * 100) };
    }

    const sos = def.subObjectives ?? [];
    if (sos.length > 0) {
      const done = GameState.subObjectiveProgress?.[def.id] ?? {};
      const cur = sos.filter(so => done[so.id]).length;
      return { cur, total: sos.length, pct: Math.round((cur / sos.length) * 100) };
    }

    const cur = Math.min(1, entry?.progress ?? 0);
    return { cur, total: 1, pct: cur * 100 };
  },

  _objectives(def, entry, state) {
    const sos = def.subObjectives ?? [];
    if (sos.length > 0) {
      const done = GameState.subObjectiveProgress?.[def.id] ?? {};
      let currentAssigned = false;
      return sos.map(so => {
        let status = 'todo';
        if (state === 'done' || done[so.id]) status = 'done';
        else if (state === 'active' && !currentAssigned) { status = 'current'; currentAssigned = true; }
        return { text: so.text, hint: so.hint ?? null, status };
      });
    }

    // subObjectives가 없는 퀘스트는 top-level objective 한 줄로 요약한다.
    const p = this._progress(def, entry, state);
    const status = state === 'done' ? 'done' : state === 'active' ? 'current' : 'todo';
    const suffix = p.total > 1 ? ` (${p.cur}/${p.total})` : '';
    return [{ text: `${def.desc ?? def.title}${suffix}`, hint: def.actionHint ?? null, status }];
  },

  _rewards(def) {
    const out = [];
    const r = def.reward ?? {};
    if (r.morale) out.push({ type: 'xp', icon: '💪', name: '사기', amount: `+${r.morale}` });
    for (const it of r.items ?? []) {
      const item = ITEMS[it.definitionId];
      out.push({
        type: 'item',
        icon: item?.icon ?? '📦',
        name: item?.name ?? it.definitionId,
        amount: `×${it.qty ?? 1}`,
      });
    }
    if (r.recruitNpc) out.push({ type: 'xp', icon: '🤝', name: '동료 합류', amount: '×1' });
    if (def.bonusReward) {
      out.push({
        type: 'hidden',
        icon: '❓',
        name: '숨은 보상',
        amount: '???',
        tooltip: this._bonusConditionText(def.bonusCondition),
      });
    }
    return out;
  },

  _bonusConditionText(cond) {
    if (!cond) return '조건 달성 시 추가 보상';
    if (cond.type === 'completeWithinTp')   return `${cond.count} TP 안에 완료하면 추가 보상`;
    if (cond.type === 'completeWithinDays') return `${cond.days}일 안에 완료하면 추가 보상`;
    return '조건 달성 시 추가 보상';
  },

  _location(def) {
    const hint = def.locationHint;
    if (!hint) return null;
    const district = DISTRICTS[hint.districtId];
    // 구가 특정되지 않는 목표(상태 추적 등)는 note 자체가 유일한 위치 정보다.
    const name = district?.name ?? hint.districtId ?? hint.note ?? '위치 미상';
    return {
      districtId: hint.districtId ?? null,
      name,
      note: name === hint.note ? null : (hint.note ?? null),
      onTarget: !!hint.districtId && GameState.location?.currentDistrict === hint.districtId,
    };
  },

  _lockReason(def) {
    const doneIds = new Set(GameState.quests?.completed ?? []);
    if (def.prerequisite && !doneIds.has(def.prerequisite)) {
      const prereq = MAIN_QUESTS[def.prerequisite];
      return prereq ? `'${prereq.title}' 완료 후 해금` : '선행 퀘스트 완료 후 해금';
    }
    if (def.dayTrigger != null) return `DAY ${def.dayTrigger} 도달 후 시작`;
    return '조건 미달';
  },

  _badge(category, daysLeft, progress) {
    if (category === 'done')   return { tone: 'done',   text: '완료' };
    if (category === 'locked') return { tone: 'locked', text: '대기' };
    if (daysLeft != null)      return { tone: category === 'urgent' ? 'urgent' : 'main', text: `D-${daysLeft}` };
    return { tone: 'main', text: `${progress.cur}/${progress.total}` };
  },

  _metaLine(category, daysLeft, progress, def) {
    if (category === 'done')   return '달성함';
    if (category === 'locked') return def.dayTrigger != null ? `DAY ${def.dayTrigger} 예정` : '해금 대기';
    const dl = daysLeft != null ? `잔여 ${daysLeft}일 · ` : '';
    return `${dl}${progress.cur}/${progress.total}`;
  },

  /** 마감까지 남은 시간을 DAY/HR/MIN 3블록으로 쪼갠다 (entry.deadline은 일 단위 경계). */
  _countdown(daysLeft) {
    if (daysLeft == null) return null;
    const hour   = GameState.time?.hour ?? 0;
    const minute = ((GameState.time?.tpInDay ?? 0) % 3) * 20;
    const totalMin = daysLeft * 1440 + (24 - hour) * 60 - minute;
    if (totalMin <= 0) return null;
    const d = Math.floor(totalMin / 1440);
    const h = Math.floor((totalMin % 1440) / 60);
    const m = totalMin % 60;
    const critical = daysLeft <= 1;
    return [
      { label: 'DAY', value: d, critical },
      { label: 'HR',  value: h, critical },
      { label: 'MIN', value: m, critical },
    ];
  },

  // entry.deadline(= startDay + deadlineDays)이 QuestSystem의 만료 판정 기준이다.
  _daysLeft(def, entry) {
    if (def.deadlineDays == null || def.deadlineDays === Infinity) return null;
    const today = GameState.time?.day ?? 1;
    if (entry?.deadline != null && entry.deadline !== Infinity) {
      return Math.max(0, entry.deadline - today);
    }
    const startedDay = entry?.startDay ?? today;
    return Math.max(0, def.deadlineDays - (today - startedDay));
  },

  _escape(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  },
};

export default QuestPanel;
