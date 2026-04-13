// === ENDING GALLERY SCREEN ===
import EventBus       from '../core/EventBus.js';
import StateMachine   from '../core/StateMachine.js';
import I18n           from '../core/I18n.js';
import ENDINGS        from '../data/endings.js';
import EndingSystem   from '../systems/EndingSystem.js';
import { getEndingImage } from '../data/endingImages.js';

const CATEGORY_META = {
  death:     { labelKey: 'ending.catDeath',     color: '#c0392b', icon: '💀', bg: 'rgba(192,57,43,0.08)' },
  milestone: { labelKey: 'ending.catMilestone', color: '#d4ac0d', icon: '⭐', bg: 'rgba(212,172,13,0.08)' },
  escape:    { labelKey: 'ending.catEscape',    color: '#2980b9', icon: '🏃', bg: 'rgba(41,128,185,0.08)' },
  character: { labelKey: 'ending.catCharacter', color: '#8e44ad', icon: '👤', bg: 'rgba(142,68,173,0.08)' },
};

const LOCKED_HINT_KEYS = {
  milestone_fortified:    'gallery.hint.milestone_fortified',
  milestone_survived_year:'gallery.hint.milestone_survived_year',
  milestone_scavenger:    'gallery.hint.milestone_scavenger',
  milestone_warrior:      'gallery.hint.milestone_warrior',
  escape_river:           'gallery.hint.escape_river',
  escape_helicopter:      'gallery.hint.escape_helicopter',
  escape_north:           'gallery.hint.escape_north',
  escape_cure:            'gallery.hint.escape_cure',
  char_doctor:            'gallery.hint.char_doctor',
  char_soldier:           'gallery.hint.char_soldier',
  char_firefighter:       'gallery.hint.char_firefighter',
  char_homeless:          'gallery.hint.char_homeless',
  char_pharmacist:        'gallery.hint.char_pharmacist',
  char_engineer:          'gallery.hint.char_engineer',
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
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
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
      <button class="eg-back-btn" id="eg-back">${I18n.t('gallery.back')}</button>
      <h2 class="eg-title">${I18n.t('gallery.title')}</h2>
      <button class="eg-sort-btn" id="eg-sort" title="${I18n.t('gallery.sortChange')}">
        ${this._sortMode === 'category' ? I18n.t('gallery.sortCategory') : I18n.t('gallery.sortUnlock')}
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
        ${I18n.t('gallery.achieved')} <strong>${doneCount}</strong> / ${total}
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
          <div class="eg-stat-label">${I18n.t(m.labelKey)}</div>
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
      { id: 'all', label: I18n.t('gallery.all'), count: total },
      ...Object.entries(CATEGORY_META).map(([id, m]) => ({
        id,
        label: m.icon + ' ' + I18n.t(m.labelKey),
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
    const meta = CATEGORY_META[ending.category] ?? { labelKey: ending.category, color: '#888', icon: '?', bg: 'rgba(128,128,128,0.08)' };
    const metaLabel = I18n.t(meta.labelKey);
    const card = document.createElement('div');

    if (isUnlocked) {
      card.className = 'eg-card unlocked';
      card.style.cssText = `background:${ending.gradient ?? meta.bg};border-color:${meta.color}30`;

      const preview  = ending.narrative?.[0] ?? '';
      const dayBadge = unlockDay != null ? `<div class="eg-card-day">${I18n.t('gallery.dayAchieved', { day: unlockDay })}</div>` : '';

      // 캐릭터 엔딩이면 서브엔딩 이미지 썸네일 표시
      let thumbHtml = '';
      if (ending.category === 'character' && ending.characterId) {
        const unlockMeta  = EndingSystem.getUnlockMeta();
        const subEndCode  = unlockMeta[ending.id]?.subEnding ?? null;
        const imgData     = subEndCode ? getEndingImage(subEndCode) : null;
        if (imgData) {
          thumbHtml = `<img class="eg-card-thumb" src="${imgData.src}" alt="${imgData.alt}" loading="lazy">`;
        }
      }

      card.innerHTML = `
        ${thumbHtml}
        <div class="eg-card-badge" style="color:${meta.color};border-color:${meta.color}40;background:${meta.bg}">
          ${meta.icon} ${metaLabel}
        </div>
        <div class="eg-card-title">${ending.title}</div>
        <div class="eg-card-subtitle">${ending.subtitle}</div>
        <div class="eg-card-preview">${preview}</div>
        ${dayBadge}
        <div class="eg-card-check" style="color:${meta.color}">✓</div>
      `;

      // 캐릭터 엔딩 카드 클릭 시 라이트박스
      if (ending.category === 'character') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => this._openLightbox(ending, isUnlocked));
      }
    } else {
      const isDeath = ending.category === 'death';
      card.className = 'eg-card locked';
      card.style.cssText = `border-color:${meta.color}20`;

      const hintKey = LOCKED_HINT_KEYS[ending.id];
      const hint = hintKey ? I18n.t(hintKey) : I18n.t('gallery.defaultHint');
      const titleHtml = isDeath
        ? `<div class="eg-card-title eg-faded">${ending.title}</div>`
        : `<div class="eg-card-title eg-hidden">???</div>`;

      card.innerHTML = `
        <div class="eg-card-badge" style="color:${meta.color}60;border-color:${meta.color}20;background:${meta.bg}">
          ${meta.icon} ${metaLabel}
        </div>
        ${titleHtml}
        <div class="eg-card-lock">🔒</div>
        <div class="eg-card-hint">${hint}</div>
      `;
    }

    return card;
  },

  _openLightbox(ending, isUnlocked) {
    if (!isUnlocked) return;

    const meta        = CATEGORY_META[ending.category] ?? { color: '#8e44ad', bg: 'rgba(142,68,173,0.08)', icon: '👤', labelKey: ending.category };
    const unlockMeta  = EndingSystem.getUnlockMeta();
    const subEndCode  = unlockMeta[ending.id]?.subEnding ?? null;
    const imgData     = subEndCode ? getEndingImage(subEndCode) : null;
    const preview     = ending.narrative ?? [];

    const overlay = document.createElement('div');
    overlay.className = 'eg-lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', ending.title);

    overlay.innerHTML = `
      <div class="eg-lightbox">
        <button class="eg-lightbox-close" aria-label="닫기">✕</button>
        ${imgData ? `<img class="eg-lightbox-img" src="${imgData.src}" alt="${imgData.alt}">` : ''}
        <div class="eg-lightbox-badge" style="color:${meta.color};border-color:${meta.color}40">
          ${meta.icon} ${I18n.t(meta.labelKey)}
        </div>
        <div class="eg-lightbox-title">${ending.title}</div>
        <div class="eg-lightbox-subtitle">${ending.subtitle}</div>
        ${preview.length ? `<div class="eg-lightbox-narrative">${preview.map(l => `<p>${l}</p>`).join('')}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.eg-lightbox-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    overlay.focus?.();
  },
};

export default EndingGallery;
