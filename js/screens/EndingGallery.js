// === ENDING GALLERY SCREEN ===
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import ENDINGS      from '../data/endings.js';
import EndingSystem from '../systems/EndingSystem.js';

const CATEGORY_META = {
  death:     { label: '사망',      color: '#c0392b', icon: '💀' },
  milestone: { label: '마일스톤',  color: '#d4ac0d', icon: '⭐' },
  escape:    { label: '탈출',      color: '#2980b9', icon: '🏃' },
  character: { label: '캐릭터',    color: '#8e44ad', icon: '👤' },
};

// Vague hints for locked non-death endings (teaser, not a spoiler)
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

  init() {
    this._el = document.getElementById('screen-ending-gallery');

    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'ending_gallery') this._render();
    });
  },

  _render() {
    if (!this._el) return;
    this._el.innerHTML = '';

    const unlocked   = EndingSystem.getUnlocked();
    const allEndings = Object.values(ENDINGS);
    const total      = allEndings.length;
    const doneCount  = unlocked.length;
    const pct        = Math.round((doneCount / total) * 100);

    const wrap = document.createElement('div');
    wrap.className = 'eg-wrap';

    // ── Header ──────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'eg-header';
    header.innerHTML = `
      <button class="eg-back-btn" id="eg-back">← 메인 메뉴</button>
      <h2 class="eg-title">엔딩 컬렉션</h2>
    `;
    wrap.appendChild(header);

    // ── Progress bar ─────────────────────────────────────────────
    const prog = document.createElement('div');
    prog.className = 'eg-progress-wrap';
    prog.innerHTML = `
      <div class="eg-progress-bar">
        <div class="eg-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="eg-progress-text">달성 <strong>${doneCount}</strong> / ${total}</div>
    `;
    wrap.appendChild(prog);

    // ── Category tabs ────────────────────────────────────────────
    const tabs = document.createElement('div');
    tabs.className = 'eg-tabs';
    const tabDefs = [
      { id: 'all',       label: '전체',     count: total },
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

    // ── Cards grid ───────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'eg-grid';

    const filtered = this._activeCategory === 'all'
      ? allEndings
      : allEndings.filter(e => e.category === this._activeCategory);

    // Sort: unlocked first, then by category order
    const categoryOrder = ['character', 'escape', 'milestone', 'death'];
    const sorted = [...filtered].sort((a, b) => {
      const aUnlocked = unlocked.includes(a.id) ? 0 : 1;
      const bUnlocked = unlocked.includes(b.id) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });

    sorted.forEach(ending => {
      const isUnlocked = unlocked.includes(ending.id);
      grid.appendChild(this._buildCard(ending, isUnlocked));
    });

    wrap.appendChild(grid);
    this._el.appendChild(wrap);

    // ── Back button ──────────────────────────────────────────────
    document.getElementById('eg-back')?.addEventListener('click', () => {
      StateMachine.transition('main_menu');
    });
  },

  _buildCard(ending, isUnlocked) {
    const meta = CATEGORY_META[ending.category] ?? { label: ending.category, color: '#888', icon: '?' };
    const card = document.createElement('div');

    if (isUnlocked) {
      card.className = 'eg-card unlocked';
      card.style.background = ending.gradient;

      const preview = ending.narrative?.[0] ?? '';
      card.innerHTML = `
        <div class="eg-card-badge" style="color:${meta.color};border-color:${meta.color}">
          ${meta.icon} ${meta.label}
        </div>
        <div class="eg-card-title">${ending.title}</div>
        <div class="eg-card-subtitle">${ending.subtitle}</div>
        <div class="eg-card-preview">${preview}</div>
        <div class="eg-card-check">✓</div>
      `;
    } else {
      card.className = 'eg-card locked';
      const hint = LOCKED_HINTS[ending.id] ?? '이 엔딩을 달성하면 공개됩니다.';
      card.innerHTML = `
        <div class="eg-card-badge" style="color:${meta.color};border-color:${meta.color}">
          ${meta.icon} ${meta.label}
        </div>
        <div class="eg-card-title eg-hidden">???</div>
        <div class="eg-card-lock">🔒</div>
        <div class="eg-card-hint">${hint}</div>
      `;
    }

    return card;
  },
};

export default EndingGallery;
