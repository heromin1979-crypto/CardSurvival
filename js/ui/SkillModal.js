// === SKILL MODAL (1280×720 4-zone dashboard, 2026-05 시안 v3) ===
import SkillSystem        from '../systems/SkillSystem.js';
import EventBus           from '../core/EventBus.js';
import { SKILL_CATEGORIES } from '../data/skillDefs.js';

const CATEGORY_ORDER  = ['combat', 'survival', 'crafting'];
const COLLAPSED_LIMIT = 6;
const SORT_LABELS = {
  level:    '레벨순',
  name:     '이름순',
  xp:       'XP순',
  category: '카테고리순',
};

// 주요 보너스 키 우선순위 — 카드 우측 +X% 한 줄 요약 산출.
// 배율(`Mult`)은 (v-1)*100 환산, 0~1 비율은 그대로 ×100.
const BONUS_PRIORITY = [
  'damageReduction', 'dmgMult', 'accBonus', 'critBonus',
  'extraLootChance', 'healMult', 'foodEffectMult',
  'extraMaterialChance', 'saveChance', 'weaponDurBonus',
  'armorDefBonus', 'structureEffectBonus', 'catchChance',
];
const MULT_KEYS = new Set(['dmgMult', 'healMult', 'foodEffectMult']);

const SkillModal = {
  _el:           null,
  _box:          null,
  _sort:         'level',
  _search:       '',
  _hideLocked:   false,
  _hideZero:     false,
  _activeTab:    null,
  _expandedCols: new Set(),

  init() {
    this._el  = document.getElementById('skill-modal');
    this._box = this._el?.querySelector('.skill-modal-box');
    if (!this._el) return;

    this._el.addEventListener('click', (e) => {
      if (e.target === this._el) this.close();
    });

    EventBus.on('skillLevelUp', () => {
      if (this._el?.classList.contains('open')) this.render();
    });
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('open')) this.render();
    });
  },

  open() {
    if (!this._el) return;
    this._el.classList.add('open');
    this.render();
  },

  close() {
    this._el?.classList.remove('open');
  },

  render() {
    if (!this._box) return;
    const all     = SkillSystem.getAllSkillData();
    const grouped = this._groupByCategory(all);

    this._box.innerHTML = [
      this._zone1(all),
      this._zone2(),
      this._zone3(grouped),
      this._zone4(all),
    ].join('');

    this._bindEvents();
  },

  _esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  },

  _groupByCategory(all) {
    const out = {};
    for (const cat of CATEGORY_ORDER) out[cat] = [];
    for (const s of all) {
      if (out[s.def.category]) out[s.def.category].push(s);
    }
    return out;
  },

  _filterSort(skills) {
    const q = this._search.trim().toLowerCase();
    const filtered = skills.filter((s) => {
      if (this._hideZero && s.skill.level === 0) return false;
      if (this._hideLocked && s.def.unlockLevel && s.skill.level === 0) return false;
      if (q) {
        const haystack = `${s.def.name} ${s.def.description ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const cmpMap = {
      level:    (a, b) => b.skill.level - a.skill.level || a.def.name.localeCompare(b.def.name),
      name:     (a, b) => a.def.name.localeCompare(b.def.name),
      xp:       (a, b) => b.skill.xp - a.skill.xp,
      category: (a, b) => a.def.category.localeCompare(b.def.category) || a.def.name.localeCompare(b.def.name),
    };
    return filtered.sort(cmpMap[this._sort] ?? cmpMap.level);
  },

  // Lv > 0 카드 우측 +X% 요약 — 가장 대표적인 1차 보너스만 노출
  _summarizeBonus(def, bonuses, level) {
    if (level === 0) return '–';
    for (const key of BONUS_PRIORITY) {
      const v = bonuses[key];
      if (v === undefined || v === 0 || v === false) continue;
      if (typeof v !== 'number') continue;
      if (MULT_KEYS.has(key)) {
        const pct = Math.round((v - 1) * 100);
        if (pct === 0) continue;
        return `+${pct}%`;
      }
      return `+${Math.round(v * 100)}%`;
    }
    return '–';
  },

  // ── Zone 1: 헤더 ─────────────────────────────────────────────
  _zone1(all) {
    const counts = CATEGORY_ORDER.map((cat) => ({
      cat,
      def:   SKILL_CATEGORIES[cat],
      count: all.filter((s) => s.def.category === cat).length,
    }));
    const totalLv     = all.reduce((sum, s) => sum + s.skill.level, 0);
    const skillPoints = 0;

    const tabs = counts.map((c) => `
      <button type="button"
              class="skill-tab-btn${this._activeTab === c.cat ? ' is-active' : ''}"
              data-cat="${c.cat}">
        <span class="skill-tab-btn-icon">${c.def.icon}</span>
        <span>${this._esc(c.def.label)}</span>
        <span class="skill-tab-btn-count">${c.count}</span>
      </button>
    `).join('');

    const sortOpts = Object.entries(SORT_LABELS).map(([k, label]) =>
      `<option value="${k}"${this._sort === k ? ' selected' : ''}>${label}</option>`
    ).join('');

    return `
      <div class="skill-zone-header">
        <span class="skill-modal-title">📊 숙련도 / SKILLS</span>
        <div class="skill-tab-group">${tabs}</div>
        <span class="skill-points">포인트<span class="skill-points-num">${skillPoints}</span>사용 가능</span>
        <span class="skill-total-lv">Total LV<span class="skill-total-lv-num">${totalLv}</span></span>
        <select class="skill-sort" id="skill-sort-select" aria-label="정렬">${sortOpts}</select>
        <button class="skill-close-btn" id="skill-close-btn" type="button" aria-label="닫기">×</button>
      </div>
    `;
  },

  // ── Zone 2: 필터 바 ──────────────────────────────────────────
  _zone2() {
    return `
      <div class="skill-zone-filter">
        <div class="skill-search-wrap">
          <input type="text" class="skill-search" id="skill-search"
                 placeholder="검색..." value="${this._esc(this._search)}">
        </div>
        <label class="skill-checkbox">
          <input type="checkbox" id="skill-hide-locked" ${this._hideLocked ? 'checked' : ''}>잠긴 스킬 숨김
        </label>
        <label class="skill-checkbox">
          <input type="checkbox" id="skill-hide-zero" ${this._hideZero ? 'checked' : ''}>0레벨 숨김
        </label>
        <span class="skill-filter-spacer"></span>
        <span class="skill-filter-hint">정렬: ${SORT_LABELS[this._sort]}</span>
      </div>
    `;
  },

  // ── Zone 3: 3열 그리드 ───────────────────────────────────────
  _zone3(grouped) {
    const cols = CATEGORY_ORDER.map((cat) => {
      const catDef    = SKILL_CATEGORIES[cat];
      const skills    = this._filterSort(grouped[cat]);
      const isExpanded = this._expandedCols.has(cat);
      const visible   = isExpanded ? skills : skills.slice(0, COLLAPSED_LIMIT);
      const hidden    = skills.length - visible.length;

      const cardsHtml = visible.length
        ? visible.map((s) => this._card(s)).join('')
        : `<div class="skill-column-empty">조건에 맞는 스킬 없음</div>`;

      let expandBtn = '';
      if (hidden > 0) {
        expandBtn = `<button type="button" class="skill-column-expand" data-cat="${cat}">+ ${hidden}개 더 보기 ▼</button>`;
      } else if (isExpanded && skills.length > COLLAPSED_LIMIT) {
        expandBtn = `<button type="button" class="skill-column-expand" data-cat="${cat}">▲ 접기</button>`;
      }

      return `
        <div class="skill-column" data-cat="${cat}">
          <div class="skill-column-header" data-cat="${cat}">
            <span class="skill-column-header-icon">${catDef.icon}</span>
            <span>${this._esc(catDef.label)}</span>
            <span class="skill-column-header-count">(${grouped[cat].length})</span>
          </div>
          ${cardsHtml}
          ${expandBtn}
        </div>
      `;
    }).join('');

    return `<div class="skill-zone-grid">${cols}</div>`;
  },

  _card({ id, def, skill, progress, bonuses }) {
    const lv     = skill.level;
    const isMax  = lv >= 20;
    const isZero = lv === 0;
    const isLocked = !!def.unlockLevel && lv === 0;

    let state = 'normal';
    if (isLocked)      state = 'locked';
    else if (isMax)    state = 'max';
    else if (isZero)   state = 'zero';

    const pct       = Math.round(progress.pct * 100);
    const xpText    = isMax
      ? 'MAX'
      : (isLocked ? `Lv.${def.unlockLevel} 필요` : `${progress.current}/${progress.required}`);
    const bonusText = isLocked ? '–' : this._summarizeBonus(def, bonuses, lv);
    const lvText    = isMax ? 'MAX' : lv;

    return `
      <div class="skill-card" data-state="${state}" data-skill="${id}">
        <div class="skill-card-icon">${def.icon}</div>
        <div class="skill-card-name">${this._esc(def.name)}</div>
        <div class="skill-card-lv">Lv.${lvText}</div>
        <div class="skill-card-bar-row">
          <div class="skill-card-bar">
            <div class="skill-card-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="skill-card-bonus">${bonusText}</span>
          <span class="skill-card-xp">${this._esc(xpText)}</span>
        </div>
      </div>
    `;
  },

  // ── Zone 4: 하단 상태 ────────────────────────────────────────
  _zone4(all) {
    const totalLv        = all.reduce((sum, s) => sum + s.skill.level, 0);
    const maxPossibleLv  = all.length * 20;
    const overallPct     = maxPossibleLv ? Math.round((totalLv / maxPossibleLv) * 100) : 0;

    const milestone = all
      .filter((s) => s.skill.level < 20)
      .map((s) => ({ ...s, remain: s.progress.required - s.progress.current }))
      .sort((a, b) => a.remain - b.remain)[0];
    const milestoneText = milestone
      ? `${milestone.def.name} Lv.${milestone.skill.level + 1} (${milestone.remain} XP)`
      : '모두 마스터 달성';

    const activeCount = all.filter((s) => s.skill.level >= 1).length;

    return `
      <div class="skill-zone-status">
        <div class="skill-status-block">
          <span class="skill-status-label">종합 진행도</span>
          <div class="skill-overall-bar-row">
            <div class="skill-overall-bar">
              <div class="skill-overall-bar-fill" style="width:${overallPct}%"></div>
            </div>
            <span class="skill-overall-pct">${overallPct}%</span>
          </div>
        </div>
        <div class="skill-status-block">
          <span class="skill-status-label">다음 마일스톤</span>
          <span class="skill-status-value"><span class="skill-status-accent">▸</span>${this._esc(milestoneText)}</span>
        </div>
        <div class="skill-status-block">
          <span class="skill-status-label">Total LV</span>
          <span class="skill-status-value"><span class="skill-status-accent">${totalLv}</span>/ ${maxPossibleLv}</span>
        </div>
        <div class="skill-status-block">
          <span class="skill-status-label">활성 보너스</span>
          <span class="skill-status-value"><span class="skill-status-accent">${activeCount}</span>종 활성</span>
        </div>
      </div>
    `;
  },

  // ── 이벤트 바인딩 ────────────────────────────────────────────
  _bindEvents() {
    this._box.querySelector('#skill-close-btn')?.addEventListener('click', () => this.close());

    this._box.querySelectorAll('.skill-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        this._activeTab = this._activeTab === cat ? null : cat;
        this.render();
      });
    });

    this._box.querySelector('#skill-sort-select')?.addEventListener('change', (e) => {
      this._sort = e.target.value;
      this.render();
    });

    // 검색 입력 후 포커스/캐럿 복원 — input마다 전체 재렌더 회피 비용 vs UX 트레이드오프
    this._box.querySelector('#skill-search')?.addEventListener('input', (e) => {
      const caret = e.target.selectionStart;
      this._search = e.target.value;
      this.render();
      const next = this._box.querySelector('#skill-search');
      if (next) {
        next.focus();
        try { next.setSelectionRange(caret, caret); } catch (_) { /* ignore */ }
      }
    });

    this._box.querySelector('#skill-hide-locked')?.addEventListener('change', (e) => {
      this._hideLocked = e.target.checked;
      this.render();
    });

    this._box.querySelector('#skill-hide-zero')?.addEventListener('change', (e) => {
      this._hideZero = e.target.checked;
      this.render();
    });

    this._box.querySelectorAll('.skill-column-expand').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        if (this._expandedCols.has(cat)) this._expandedCols.delete(cat);
        else this._expandedCols.add(cat);
        this.render();
      });
    });
  },
};

export default SkillModal;
