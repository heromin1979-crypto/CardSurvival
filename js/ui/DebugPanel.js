// === DEBUG PANEL ===
// ?debug=1 URL 파라미터로만 활성화되는 밸런스 디버그 패널.
// 인스펙터, 무적, TP 스킵, 스탯 편집, 아이템 지급 기능 제공.
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import TickEngine from '../core/TickEngine.js';
import GameData   from '../data/GameData.js';
import I18n       from '../core/I18n.js';
import WeatherSystem from '../systems/WeatherSystem.js';
import MentalSystem  from '../systems/MentalSystem.js';

// kind: 'stats'(기본) = GameState.stats[key], 'noise' = noise.level, 'mental' = mental[key]
const STAT_FIELDS = [
  { key: 'hydration',   label: '수분'     },
  { key: 'nutrition',   label: '영양'     },
  { key: 'morale',      label: '사기'     },
  { key: 'stamina',     label: '스태미나' },
  { key: 'fatigue',     label: '피로'     },
  { key: 'temperature', label: '체온'     },
  { key: 'radiation',   label: '방사선'   },
  { key: 'infection',   label: '감염'     },
  { key: 'noise',       label: '소음',     kind: 'noise'  },
  { key: 'anxiety',     label: '불안',     kind: 'mental' },
  { key: 'trauma',      label: '트라우마', kind: 'mental' },
];

const DebugPanel = {
  _el:        null,
  _inspector: null,
  _msgEl:     null,
  _collapsed: false,
  _giveRow:   'bottom',   // 아이템 지급 대상 행: 'bottom'(휴대) | 'middle'(바닥)
  _searchIndex: null,     // [{id, name, display, icon, def}] 캐시
  _acMatches: [],
  _acIndex:   -1,
  _dictEl:    null,

  init() {
    // CSS 동적 삽입 (디버그 전용이라 캐시 무효화 쿼리 부착 — 수정 즉시 반영)
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'css/debug.css?v=' + Date.now();
    document.head.appendChild(link);

    const container = document.getElementById('debug-panel');
    if (!container) return;

    container.innerHTML = this._buildHTML();
    this._el        = container;
    this._inspector = container.querySelector('.dbg-inspector');
    this._msgEl     = container.querySelector('.dbg-msg');

    this._bindEvents();
    this._refresh();

    // 매 TP마다 인스펙터 갱신
    EventBus.on('tpAdvance',    () => this._refresh());
    EventBus.on('boardChanged', () => this._refresh());
    EventBus.on('statChanged',  () => this._refresh());
  },

  // ── DOM 빌드 ──────────────────────────────────────────────

  _buildHTML() {
    const statRows = STAT_FIELDS.map(({ key, label }) => `
      <div class="dbg-stat-row">
        <span class="dbg-stat-label">${label}</span>
        <input class="dbg-stat-input" type="number" data-stat="${key}" min="0" max="999" step="1">
        <button class="dbg-set-btn" data-stat="${key}">Set</button>
      </div>`).join('');

    // 접이식 섹션 래퍼 — key는 접힘 상태 저장(localStorage) 식별자
    const section = (key, title, inner) => `
      <div class="dbg-section">
        <div class="dbg-section-title dbg-sec-toggle" data-sec="${key}">
          <span>${title}</span>
          <span class="dbg-sec-icon">▼</span>
        </div>
        <div class="dbg-sec-body" data-sec-body="${key}">${inner}</div>
      </div>`;

    return `
      <div class="dbg-header" id="dbg-toggle">
        <span>🛠 DEBUG</span>
        <span class="dbg-toggle-icon" id="dbg-icon">▼</span>
      </div>
      <div class="dbg-body" id="dbg-body">
        ${section('inspector', 'Inspector', `
          <div class="dbg-inspector"></div>`)}
        ${section('god', 'God Mode', `
          <button class="dbg-btn dbg-god-btn" id="dbg-god-btn">🛡 무적 OFF</button>
          <div class="dbg-god-desc">TP 경과·행동으로 소비되는 스탯 차단 (회복은 정상)</div>`)}
        ${section('skiptp', 'Skip TP', `
          <div class="dbg-btn-row">
            <button class="dbg-btn" data-skip="1">+1 TP</button>
            <button class="dbg-btn" data-skip="10">+10 TP</button>
            <button class="dbg-btn" data-skip="72">+1 Day</button>
          </div>`)}
        ${section('stats', 'Set Stats', `
          ${statRows}
          <div class="dbg-stat-row" style="margin-top:4px">
            <span class="dbg-stat-label">HP</span>
            <input class="dbg-stat-input" type="number" data-stat="hp" min="0" max="999" step="1">
            <button class="dbg-set-btn" data-stat="hp">Set</button>
          </div>`)}
        ${section('give', 'Give Item', `
          <div class="dbg-row-toggle">
            <button class="dbg-row-btn active" data-give-row="bottom">휴대</button>
            <button class="dbg-row-btn" data-give-row="middle">바닥</button>
          </div>
          <div class="dbg-give-row">
            <div class="dbg-item-wrap">
              <input class="dbg-item-input" id="dbg-item-id" type="text" placeholder="ID 또는 한글 이름" spellcheck="false" autocomplete="off">
              <div class="dbg-autocomplete hidden" id="dbg-autocomplete"></div>
            </div>
            <input class="dbg-qty-input"  id="dbg-item-qty" type="number" value="1" min="1" max="99">
            <button class="dbg-give-btn" id="dbg-give-btn">Give</button>
            <button class="dbg-dict-btn" id="dbg-dict-btn" title="아이템 사전">📖</button>
          </div>
          <div class="dbg-msg" id="dbg-msg"></div>`)}
        ${section('weather', 'Set Weather', `
          <div class="dbg-btn-row">
            <button class="dbg-btn" data-weather="sunny">☀️맑음</button>
            <button class="dbg-btn" data-weather="rainy">🌧비</button>
            <button class="dbg-btn" data-weather="monsoon">🌊장마</button>
          </div>
          <div class="dbg-btn-row">
            <button class="dbg-btn" data-weather="storm">🌩폭풍</button>
            <button class="dbg-btn" data-weather="acid_rain">☢️산성비</button>
            <button class="dbg-btn" data-weather="snow">🌨눈</button>
          </div>`)}
      </div>`;
  },

  // ── 이벤트 바인딩 ─────────────────────────────────────────

  _bindEvents() {
    // 패널 전체 접기/펼치기
    this._el.querySelector('#dbg-toggle').addEventListener('click', () => {
      this._collapsed = !this._collapsed;
      this._el.querySelector('#dbg-body').classList.toggle('hidden', this._collapsed);
      this._el.querySelector('#dbg-icon').classList.toggle('collapsed', this._collapsed);
    });

    // 섹션별 접기/펼치기 (상태는 localStorage에 유지)
    this._el.querySelectorAll('.dbg-sec-toggle').forEach(title => {
      title.addEventListener('click', () => {
        const key = title.dataset.sec;
        const collapsed = this._toggleSection(key);
        const state = this._loadSectionState();
        state[key] = collapsed;
        try { localStorage.setItem('dbgSectionsCollapsed', JSON.stringify(state)); } catch { /* 프라이빗 모드 등 */ }
      });
    });

    // 저장된 섹션 접힘 상태 복원 (기본: Set Stats·Set Weather 접힘)
    const stored = this._loadSectionState();
    for (const [key, collapsed] of Object.entries(stored)) {
      if (collapsed) this._toggleSection(key, true);
    }

    // 무적 토글
    this._el.querySelector('#dbg-god-btn').addEventListener('click', () => {
      GameState.debug.godMode = !GameState.debug.godMode;
      this._updateGodBtn();
      this._showMsg(GameState.debug.godMode ? '🛡 무적 ON — 스탯 소비 차단' : '무적 OFF');
      this._refresh();
    });
    this._updateGodBtn();

    // TP 스킵
    this._el.querySelectorAll('[data-skip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.skip, 10);
        TickEngine.skipTP(n);
      });
    });

    // 스탯 Set 버튼
    this._el.querySelectorAll('.dbg-set-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setStat(btn.dataset.stat));
    });

    // 스탯 입력 Enter 키
    this._el.querySelectorAll('.dbg-stat-input').forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') this._setStat(input.dataset.stat);
      });
    });

    // 지급 행 선택 (휴대/바닥)
    this._el.querySelectorAll('[data-give-row]').forEach(btn => {
      btn.addEventListener('click', () => this._setGiveRow(btn.dataset.giveRow));
    });

    // 아이템 지급 + 자동완성
    const itemInput = this._el.querySelector('#dbg-item-id');
    this._acEl = this._el.querySelector('#dbg-autocomplete');

    this._el.querySelector('#dbg-give-btn').addEventListener('click', () => this._giveItem());
    itemInput.addEventListener('input', () => this._onItemInput());
    itemInput.addEventListener('blur',  () => this._hideAc());
    itemInput.addEventListener('keydown', e => {
      const acOpen = !this._acEl.classList.contains('hidden');
      if (e.key === 'ArrowDown' && acOpen) { e.preventDefault(); this._moveAc(1); return; }
      if (e.key === 'ArrowUp'   && acOpen) { e.preventDefault(); this._moveAc(-1); return; }
      if (e.key === 'Escape'    && acOpen) { this._hideAc(); return; }
      if (e.key === 'Enter') {
        if (acOpen && this._acIndex >= 0) { this._selectAc(this._acIndex); return; }
        this._hideAc();
        this._giveItem();
      }
    });

    // 자동완성 항목 클릭 (mousedown: blur보다 먼저 처리)
    this._acEl.addEventListener('mousedown', e => {
      const item = e.target.closest('.dbg-ac-item');
      if (!item) return;
      e.preventDefault();
      this._selectAc(parseInt(item.dataset.i, 10));
    });

    // 아이템 사전
    this._el.querySelector('#dbg-dict-btn').addEventListener('click', () => this._openDict());

    // 날씨 변경 (GM)
    this._el.querySelectorAll('[data-weather]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ok = WeatherSystem.setWeather(btn.dataset.weather);
        this._showMsg(ok ? `날씨 → ${btn.textContent.trim()}` : `❌ 알 수 없는 날씨`, !ok);
        this._refresh();
      });
    });
  },

  _updateGodBtn() {
    const btn = this._el.querySelector('#dbg-god-btn');
    if (!btn) return;
    const on = GameState.debug?.godMode ?? false;
    btn.textContent = on ? '🛡 무적 ON' : '🛡 무적 OFF';
    btn.classList.toggle('on', on);
  },

  // 섹션 접기/펼치기. force: true=접기, false=펼치기, 생략=토글. 접힘 여부 반환.
  _toggleSection(key, force = null) {
    const body  = this._el.querySelector(`[data-sec-body="${key}"]`);
    const title = this._el.querySelector(`.dbg-sec-toggle[data-sec="${key}"]`);
    if (!body || !title) return false;
    const collapsed = force ?? !body.classList.contains('hidden');
    body.classList.toggle('hidden', collapsed);
    title.querySelector('.dbg-sec-icon').classList.toggle('collapsed', collapsed);
    return collapsed;
  },

  _loadSectionState() {
    try {
      const raw = localStorage.getItem('dbgSectionsCollapsed');
      if (raw) return JSON.parse(raw);
    } catch { /* 파싱 실패 시 기본값 */ }
    // 기본: Inspector만 펼침, 나머지 전부 접힘 (사용자가 토글하면 그 상태 유지)
    return { skiptp: true, stats: true, give: true, weather: true };
  },

  // ── 인스펙터 갱신 ─────────────────────────────────────────

  _refresh() {
    if (!this._inspector) return;
    const gs  = GameState;
    const s   = gs.stats;
    const t   = gs.time;
    const p   = gs.player;

    const row = (key, val, cls = '') =>
      `<div class="dbg-row">
        <span class="dbg-key">${key}</span>
        <span class="dbg-val ${cls}">${val}</span>
      </div>`;

    const statCls = (v, max) => v < max * 0.25 ? 'low' : v < max * 0.5 ? 'warn' : '';

    this._inspector.innerHTML = [
      ...(gs.debug?.godMode ? [row('무적', '🛡 ON', 'god')] : []),
      row('일 / TP / 시각', `${t.day} / ${t.totalTP} / ${t.hour}:00`),
      row('HP',       `${p.hp.current}/${p.hp.max}`,    statCls(p.hp.current, p.hp.max)),
      row('수분',     `${Math.round(s.hydration.current)}/${s.hydration.max}`, statCls(s.hydration.current, s.hydration.max)),
      row('영양',     `${Math.round(s.nutrition.current)}/${s.nutrition.max}`, statCls(s.nutrition.current, s.nutrition.max)),
      row('사기',     `${Math.round(s.morale.current)}/${s.morale.max}`,       statCls(s.morale.current, s.morale.max)),
      row('피로',     `${Math.round(s.fatigue.current)}/${s.fatigue.max}`,     s.fatigue.current > 70 ? 'warn' : ''),
      row('소음',     `${gs.noise.level} / ${gs.noise.influxThreshold}`),
      row('보드 카드', `${Object.keys(gs.cards).length}`),
    ].join('');
  },

  // ── 스탯 편집 ─────────────────────────────────────────────

  _setStat(stat) {
    const input = this._el.querySelector(`.dbg-stat-input[data-stat="${stat}"]`);
    if (!input) return;
    const raw = parseFloat(input.value);
    if (isNaN(raw)) return;

    const kind = stat === 'hp' ? 'hp'
      : (STAT_FIELDS.find(f => f.key === stat)?.kind ?? 'stats');

    if (kind === 'hp') {
      const max = GameState.player.hp.max;
      GameState.player.hp.current = Math.max(0, Math.min(max, raw));
    } else if (kind === 'noise') {
      GameState.noise.level = Math.max(0, raw);
      // 임계값 아래로 내리면 유입 트리거 재무장 (좀비 유입 재테스트 가능)
      if (GameState.noise.level < GameState.noise.influxThreshold) {
        GameState.noise.influxTriggered = false;
      }
    } else if (kind === 'mental') {
      MentalSystem.ensureInitialized(); // mental은 첫 TP에 지연 생성 — 디버그에선 즉시 생성
      GameState.mental[stat] = Math.max(0, Math.min(100, raw));
    } else if (GameState.stats[stat]) {
      const max = GameState.stats[stat].max;
      GameState.stats[stat].current = Math.max(0, Math.min(max, raw));
    }

    EventBus.emit('statChanged', { stat, value: raw });
    EventBus.emit('boardChanged', {});
    this._refresh();
  },

  // ── 아이템 지급 ───────────────────────────────────────────

  // 입력값을 item_id로 해석. id 직접 매칭 → 한글/표시 이름 정확 일치 → 공백 무시 일치 순.
  _resolveItemId(input) {
    const items = GameData.items;
    if (items[input]) return input;

    const norm = s => (s ?? '').replace(/\s+/g, '').toLowerCase();
    const q = norm(input);
    let fuzzy = null;
    for (const def of Object.values(items)) {
      const display = I18n.itemName(def.id, def.name);
      if (def.name === input || display === input) return def.id; // 이름 정확 일치
      if (!fuzzy && (norm(def.name) === q || norm(display) === q)) fuzzy = def.id; // 공백 무시 일치
    }
    return fuzzy;
  },

  // directId 지정 시(사전에서 Give) 입력창 해석을 건너뛴다.
  _giveItem(directId = null) {
    const qty = Math.max(1, parseInt(this._el.querySelector('#dbg-item-qty').value, 10) || 1);

    let defId = directId;
    if (!defId) {
      const raw = this._el.querySelector('#dbg-item-id').value.trim();
      if (!raw) {
        this._showMsg('item ID 또는 한글 이름을 입력하세요.', true);
        return;
      }
      defId = this._resolveItemId(raw);
      if (!defId) {
        this._showMsg(`❌ 알 수 없는 아이템: ${raw}`, true);
        return;
      }
    }

    const inst = GameState.createCardInstance(defId, { quantity: qty });
    if (!inst) {
      this._showMsg('❌ 카드 생성 실패', true);
      return;
    }

    const label = I18n.itemName(defId, GameData.items[defId].name);
    const rowLabel = { bottom: '휴대', middle: '바닥', top: '장소' };
    const placed = GameState.placeCardInRow(inst.instanceId, this._giveRow);
    if (!placed) {
      // 보드가 꽉 찬 경우 — 인스턴스는 cards에 존재, 보드 미배치
      this._showMsg(`⚠ 보드 꽉 참 — cards에 추가됨 (${label} ${inst.instanceId})`, false);
    } else {
      this._showMsg(`✓ ${label}(${defId}) ×${qty} → ${rowLabel[placed.row] ?? placed.row}[${placed.slot}]`);
    }

    EventBus.emit('boardChanged', {});
  },

  _setGiveRow(row) {
    this._giveRow = row;
    document.querySelectorAll('[data-give-row]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.giveRow === row);
    });
  },

  // ── 아이템 검색 인덱스 · 자동완성 ─────────────────────────

  _getSearchIndex() {
    if (!this._searchIndex) {
      this._searchIndex = Object.values(GameData.items).map(def => ({
        id:      def.id,
        name:    (def.name ?? '').toLowerCase(),
        display: I18n.itemName(def.id, def.name),
        icon:    def.icon ?? '',
        def,
      }));
    }
    return this._searchIndex;
  },

  _onItemInput() {
    const q = this._el.querySelector('#dbg-item-id').value.trim().toLowerCase();
    if (!q) { this._hideAc(); return; }

    const starts = [], contains = [];
    for (const it of this._getSearchIndex()) {
      const hay = [it.id, it.name, it.display.toLowerCase()];
      if (hay.some(h => h.startsWith(q)))      starts.push(it);
      else if (hay.some(h => h.includes(q)))   contains.push(it);
    }
    this._acMatches = [...starts, ...contains];
    this._acIndex   = -1;

    if (!this._acMatches.length) { this._hideAc(); return; }
    this._acEl.innerHTML = this._acMatches.map((it, i) => `
      <div class="dbg-ac-item" data-i="${i}">
        <span class="dbg-ac-icon">${it.icon}</span>
        <span class="dbg-ac-name">${it.display}</span>
        <span class="dbg-ac-id">${it.id}</span>
      </div>`).join('');
    this._acEl.classList.remove('hidden');
  },

  _moveAc(dir) {
    const n = this._acMatches.length;
    if (!n) return;
    this._acIndex = (this._acIndex + dir + n) % n;
    this._acEl.querySelectorAll('.dbg-ac-item').forEach((el, i) => {
      el.classList.toggle('active', i === this._acIndex);
      if (i === this._acIndex) el.scrollIntoView({ block: 'nearest' });
    });
  },

  _selectAc(i) {
    const it = this._acMatches[i];
    if (!it) return;
    const input = this._el.querySelector('#dbg-item-id');
    input.value = it.display;
    this._hideAc();
    input.focus();
  },

  _hideAc() {
    this._acEl?.classList.add('hidden');
    this._acIndex = -1;
  },

  // ── 아이템 사전 ───────────────────────────────────────────

  _openDict() {
    if (!this._dictEl) this._buildDict();
    this._dictEl.classList.remove('hidden');
    this._renderDictList();
    this._dictEl.querySelector('#dbg-dict-search').focus();
  },

  _closeDict() {
    this._dictEl?.classList.add('hidden');
  },

  _buildDict() {
    const types = [...new Set(this._getSearchIndex().map(it => it.def.type ?? ''))].sort();
    const el = document.createElement('div');
    el.id = 'dbg-dict';
    el.innerHTML = `
      <div class="dbg-dict-panel">
        <div class="dbg-dict-head">
          <span class="dbg-dict-title">📖 ITEM DICTIONARY</span>
          <input class="dbg-item-input" id="dbg-dict-search" type="text" placeholder="검색 (ID·이름·설명)" spellcheck="false" autocomplete="off">
          <select class="dbg-dict-type" id="dbg-dict-type">
            <option value="">전체 타입</option>
            ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <span class="dbg-dict-count" id="dbg-dict-count"></span>
          <button class="dbg-dict-close" id="dbg-dict-close">✕</button>
        </div>
        <div class="dbg-dict-list" id="dbg-dict-list"></div>
      </div>`;
    document.body.appendChild(el);
    this._dictEl = el;

    el.addEventListener('mousedown', e => { if (e.target === el) this._closeDict(); });
    el.querySelector('#dbg-dict-close').addEventListener('click', () => this._closeDict());
    el.querySelector('#dbg-dict-search').addEventListener('input', () => this._renderDictList());
    el.querySelector('#dbg-dict-search').addEventListener('keydown', e => {
      if (e.key === 'Escape') this._closeDict();
    });
    el.querySelector('#dbg-dict-type').addEventListener('change', () => this._renderDictList());
    el.querySelector('#dbg-dict-list').addEventListener('click', e => {
      const btn = e.target.closest('.dbg-dict-give');
      if (btn) this._giveItem(btn.dataset.id);
    });
  },

  _renderDictList() {
    const q    = this._dictEl.querySelector('#dbg-dict-search').value.trim().toLowerCase();
    const type = this._dictEl.querySelector('#dbg-dict-type').value;

    const rows = this._getSearchIndex()
      .filter(it => !type || it.def.type === type)
      .filter(it => !q
        || it.id.includes(q) || it.name.includes(q)
        || it.display.toLowerCase().includes(q)
        || (it.def.description ?? '').toLowerCase().includes(q))
      .sort((a, b) => (a.def.type ?? '').localeCompare(b.def.type ?? '')
        || a.display.localeCompare(b.display, 'ko'));

    this._dictEl.querySelector('#dbg-dict-count').textContent = `${rows.length}개`;
    this._dictEl.querySelector('#dbg-dict-list').innerHTML = rows.map(it => `
      <div class="dbg-dict-row">
        <span class="dbg-dict-icon">${it.icon}</span>
        <div class="dbg-dict-info">
          <div class="dbg-dict-name">${it.display} <span class="dbg-dict-id">${it.id}</span></div>
          <div class="dbg-dict-desc">${it.def.description ?? ''}</div>
        </div>
        <span class="dbg-dict-meta">${it.def.type ?? ''}${it.def.subtype ? '/' + it.def.subtype : ''}<br>${it.def.rarity ?? ''}</span>
        <button class="dbg-dict-give" data-id="${it.id}">Give</button>
      </div>`).join('');
  },

  _showMsg(text, isErr = false) {
    if (!this._msgEl) return;
    this._msgEl.textContent = text;
    this._msgEl.className   = `dbg-msg${isErr ? ' err' : ''}`;
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => { if (this._msgEl) this._msgEl.textContent = ''; }, 3000);
  },
};

export default DebugPanel;
