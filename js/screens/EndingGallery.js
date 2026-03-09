// === ENDING GALLERY SCREEN ===
import EventBus     from '../core/EventBus.js';
import StateMachine from '../core/StateMachine.js';
import ENDINGS      from '../data/endings.js';
import EndingSystem from '../systems/EndingSystem.js';

const CATEGORY_META = {
  death:     { label: '사망',      color: '#c0392b', icon: '💀', bg: 'rgba(192,57,43,0.08)' },
  milestone: { label: '마일스톤',  color: '#d4ac0d', icon: '⭐', bg: 'rgba(212,172,13,0.08)' },
  escape:    { label: '탈출',      color: '#2980b9', icon: '🏃', bg: 'rgba(41,128,185,0.08)' },
  character: { label: '캐릭터',    color: '#8e44ad', icon: '👤', bg: 'rgba(142,68,173,0.08)' },
};

const LOCKED_HINTS = {
  milestone_fortified:    '거점을 완전히 구축하면 공개됩니다.',
  milestone_survived_year:'오랫동안 살아남으면 공개됩니다.',
  milestone_scavenger:    '수백 개의 아이템을 수집하면 공개됩니다.',
  milestone_warrior:      '수많은 적을 쓰러뜨리면 공개됩니다.',
  escape_river:           '한강 주변 지역을 모두 탐색하면 공개됩니다.',
  escape_helicopter:      '특정 방송국을 방문해 공적을 쌓으면 공개됩니다.',
  escape_north:           '서울 전역을 답파하면 공개됩니다.',
  escape_cure:            '오랜 연구 끝에 무언가를 완성하면 공개됩니다.',
  char_doctor:            '이지수의 목표를 달성하면 공개됩니다.',
  char_soldier:           '강민준의 목표를 달성하면 공개됩니다.',
  char_firefighter:       '박영철의 목표를 달성하면 공개됩니다.',
  char_homeless:          '최형식의 목표를 달성하면 공개됩니다.',
  char_pharmacist:        '한소희의 목표를 달성하면 공개됩니다.',
  char_engineer:          '정대한의 목표를 달성하면 공개됩니다.',
};

const EndingGallery = {
  _el:             null,
  _activeCategory: 'all',
  _sortMode:       'category', // 'category' | 'unlock'

  init() {
    this._el = document.getElementById('screen-ending-gallery');
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'ending_gallery') this._render();
    });
  },

  _render() {
    if (!this._el) return;
    this._el.innerHTML = '';

    const unlocked    = EndingSystem.getUnlocked();
    const meta        = EndingSystem.getUnlockMeta();
    const allEndings  = Object.values(ENDINGS);
    const total       = allEndings.length;
    const doneCount   = unlocked.length;
    const pct         = Math.round((doneCount / total) * 100);

    const wrap = document.createElement('div');
    wrap.className = 'eg-wrap';

    // ── Header ─────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'eg-header';
    header.innerHTML = `
      <button class="eg-back-btn" id="eg-back">← 메인 메뉴</button>
      <h2 class="eg-title">엔딩 컬렉션</h2>
      <button class="eg-sort-btn" id="eg-sort" title="정렬 변경">
        ${this._sortMode === 'category' ? '카테고리순' : '달성순'}
      </button>
    `;
    wrap.appendChild(header);

    // ── Progress ───────────────────────────────────────────────────
    const prog = document.createElement('div');
    prog.className = 'eg-progress-wrap';
    prog.innerHTML = `
      <div class="eg-progress-bar">
        <div class="eg-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="eg-progress-text">
        달성 <strong>${doneCount}</strong> / ${total}
        <span class="eg-pct-badge">${pct}%</span>
      </div>
    `;
    wrap.appendChild(prog);

    // ── Category stats row ─────────────────────────────────────────
    const statRow = document.createElement('div');
    statRow.className = 'eg-stat-row';
    Object.entries(CATEGORY_META).forEach(([catId, m]) => {
      const catEndings  = allEndings.filter(e => e.category === catId);
      const catDone     = catEndings.filter(e => unlocked.includes(e.id)).length;
      const catPct      = catEndings.length > 0 ? Math.round((catDone / catEndings.length) * 100) : 0;
      statRow.innerHTML += `
        <div class="eg-stat-cell" style="border-color:${m.color}20">
          <div class="eg-stat-icon">${m.icon}</div>
          <div class="eg-stat-label">${m.label}</div>
          <div class="eg-stat-count" style="color:${m.color}">${catDone}/${catEndings.length}</div>
          <div class="eg-stat-mini-bar">
            <div class="eg-stat-mini-fill" style="width:${catPct}%;background:${m.color}"></div>
          </div>
        </div>
      `;
    });
    wrap.appendChild(statRow);

    // ── Category tabs ──────────────────────────────────────────────
    const tabs = document.createElement('div');
    tabs.className = 'eg-tabs';
    const tabDefs = [
      { id: 'all', label: '전체', count: total },
      ...Object.entries(CATEGORY_META).map(([id, m]) => ({
        id,
        label: m.icon + ' ' + m.label,
        count: allEndings.filter(e => e.category === id).length,
      })),
    ];
    tabDefs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'eg-tab' + (this._activeCategory === tab.id ? ' active' : '');
      btn.dataset.cat = tab.id;
      const doneCat = tab.id === 'all'
        ? doneCount
        : allEndings.filter(e => e.category === tab.id && unlocked.includes(e.id)).length;
      btn.innerHTML = `${tab.label} <span class="eg-tab-count">${doneCat}/${tab.count}</span>`;
      btn.addEventListener('click', () => {
        this._activeCategory = tab.id;
        this._render();
      });
      tabs.appendChild(btn);
    });
    wrap.appendChild(tabs);

    // ── Cards grid ─────────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'eg-grid';

    const filtered = this._activeCategory === 'all'
      ? allEndings
      : allEndings.filter(e => e.category === this._activeCategory);

    const categoryOrder = ['character', 'escape', 'milestone', 'death'];
    let sorted = [...filtered];

    if (this._sortMode === 'unlock') {
      sorted.sort((a, b) => {
        const aDay = meta[a.id]?.day ?? Infinity;
        const bDay = meta[b.id]?.day ?? Infinity;
        if (aDay !== bDay) return aDay - bDay;
        return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      });
    } else {
      sorted.sort((a, b) => {
        const aU = unlocked.includes(a.id) ? 0 : 1;
        const bU = unlocked.includes(b.id) ? 0 : 1;
        if (aU !== bU) return aU - bU;
        return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      });
    }

    sorted.forEach(ending => {
      const isUnlocked = unlocked.includes(ending.id);
      const unlockDay  = meta[ending.id]?.day ?? null;
      grid.appendChild(this._buildCard(ending, isUnlocked, unlockDay));
    });

    wrap.appendChild(grid);
    this._el.appendChild(wrap);

    // ── Events ─────────────────────────────────────────────────────
    document.getElementById('eg-back')?.addEventListener('click', () => {
      StateMachine.transition('main_menu');
    });
    document.getElementById('eg-sort')?.addEventListener('click', () => {
      this._sortMode = this._sortMode === 'category' ? 'unlock' : 'category';
      this._render();
    });
  },

  _buildCard(ending, isUnlocked, unlockDay) {
    const meta = CATEGORY_META[ending.category] ?? { label: ending.category, color: '#888', icon: '?', bg: 'rgba(128,128,128,0.08)' };
    const card = document.createElement('div');

    if (isUnlocked) {
      card.className = 'eg-card unlocked';
      card.style.cssText = `background:${ending.gradient ?? meta.bg};border-color:${meta.color}30`;

      const preview    = ending.narrative?.[0] ?? '';
      const dayBadge   = unlockDay != null ? `<div class="eg-card-day">Day ${unlockDay} 달성</div>` : '';

      card.innerHTML = `
        <div class="eg-card-badge" style="color:${meta.color};border-color:${meta.color}40;background:${meta.bg}">
          ${meta.icon} ${meta.label}
        </div>
        <div class="eg-card-title">${ending.title}</div>
        <div class="eg-card-subtitle">${ending.subtitle}</div>
        <div class="eg-card-preview">${preview}</div>
        ${dayBadge}
        <div class="eg-card-check" style="color:${meta.color}">✓</div>
      `;
    } else {
      const isDeath = ending.category === 'death';
      card.className = 'eg-card locked';
      card.style.cssText = `border-color:${meta.color}20`;

      const hint = LOCKED_HINTS[ending.id] ?? '이 엔딩을 달성하면 공개됩니다.';
      const titleHtml = isDeath
        ? `<div class="eg-card-title eg-faded">${ending.title}</div>`
        : `<div class="eg-card-title eg-hidden">???</div>`;

      card.innerHTML = `
        <div class="eg-card-badge" style="color:${meta.color}60;border-color:${meta.color}20;background:${meta.bg}">
          ${meta.icon} ${meta.label}
        </div>
        ${titleHtml}
        <div class="eg-card-lock">🔒</div>
        <div class="eg-card-hint">${hint}</div>
      `;
    }

    return card;
  },
};

export default EndingGallery;
