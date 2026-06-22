// === UI INSPECTOR / LIVE LAYOUT EDITOR ===
// 게임 중 클릭 판정·레이어 계층을 시각화하고, 요소 위치/크기를 즉석에서
// 편집·저장하는 개발용 도구. DebugPanel과 동일하게 ?debug=1 에서만 로드되며
// 단축키(Ctrl+Shift+U)로 토글한다. 플레이어 빌드에는 포함되지 않는다.
//
// 핵심 함정 — Scale 변환:
//   이 게임은 #app 에 transform: scale() 을 걸어 1920×1080 캔버스를 축소한다.
//   · 클릭 판정(elementsFromPoint)은 화면 좌표라 그대로 동작.
//   · 편집 입력값(폭/높이/오프셋)은 "디자인 좌표(1920 기준)" 이므로
//     마우스 픽셀 이동량은 ÷scale 변환해 적용한다.

const STORAGE_KEY  = '__uiInspectorOverrides';
const PANEL_POS_KEY = '__uiInspectorPanelPos';
const STYLE_ID     = 'ui-inspector-overrides';
const DESIGN_W     = 1920;
const DESIGN_H     = 1080;

const UIInspector = {
  _active:    false,
  _panel:     null,
  _overlay:   null,        // 형광 하이라이트 박스 (선택 요소)
  _hoverBox:  null,        // 마우스오버 임시 하이라이트
  _label:     null,        // 크기 라벨
  _selected:  null,        // 현재 편집 중 요소
  _stack:     [],          // 마지막 클릭 지점의 elementsFromPoint 결과
  _overrides: {},          // { selector: { dx, dy, w, h, noPointer } }
  _styleEl:   null,
  _shield:    null,        // 전체화면 캡처 실드 (게임 hover 효과 차단)
  _drag:      null,        // 요소 드래그 상태

  // 저장된 레이아웃 오버라이드를 적용한다. 디버그 여부와 무관하게 매 실행 호출되어
  // 인스펙터로 편집·저장한 위치/크기가 일반 플레이에도 그대로 반영되게 한다.
  applyStored() {
    this._loadOverrides();
    this._injectStyleEl();
    this._applyAllOverrides();
  },

  // 인스펙터 UI(단축키/패널) 활성화 — ?debug=1 에서만 호출된다.
  init() {
    this.applyStored();

    // CSS
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'css/ui-inspector.css';
    document.head.appendChild(link);

    // 단축키 토글
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this._active) this.disable();
    });

    console.log('[UIInspector] ready — Ctrl+Shift+U 로 토글');
  },

  // ── 스케일 ────────────────────────────────────────────────
  _scale() {
    return Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
  },

  // ── 토글 ──────────────────────────────────────────────────
  toggle()  { this._active ? this.disable() : this.enable(); },

  enable() {
    if (this._active) return;
    this._active = true;
    this._buildPanel();
    this._buildOverlays();
    document.body.classList.add('uii-active');
    this._onMove  = (e) => this._handleMove(e);
    this._onClick = (e) => this._handleClick(e);
    this._onUp    = () => this._handleUp();
    document.addEventListener('mousemove', this._onMove, true);
    document.addEventListener('click', this._onClick, true);
    window.addEventListener('mouseup', this._onUp, true);
  },

  disable() {
    if (!this._active) return;
    this._active = false;
    document.body.classList.remove('uii-active');
    document.removeEventListener('mousemove', this._onMove, true);
    document.removeEventListener('click', this._onClick, true);
    window.removeEventListener('mouseup', this._onUp, true);
    this._panel?.remove();    this._panel    = null;
    this._overlay?.remove();  this._overlay  = null;
    this._hoverBox?.remove(); this._hoverBox = null;
    this._label?.remove();    this._label    = null;
    this._shield?.remove();   this._shield   = null;
    this._drag = null;
  },

  _handleUp() {
    if (this._drag) { this._drag = null; this._renderEditor(); }
  },

  // ── 오버레이(하이라이트 박스) ─────────────────────────────
  _buildOverlays() {
    // 캡처 실드를 먼저 깔아 마우스가 게임 요소에 직접 닿지 않게 한다
    this._shield   = this._mkBox('uii-shield');
    this._overlay  = this._mkBox('uii-overlay');
    this._hoverBox = this._mkBox('uii-hoverbox');
    this._label    = document.createElement('div');
    this._label.className = 'uii-size-label';
    document.body.appendChild(this._label);
  },

  _mkBox(cls) {
    const b = document.createElement('div');
    b.className = cls;
    document.body.appendChild(b);
    return b;
  },

  // rect(화면좌표) 를 fixed 박스에 그대로 반영 (스케일 변환 불필요)
  _drawBox(box, el) {
    if (!box) return;
    if (!el) { box.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left   = r.left   + 'px';
    box.style.top    = r.top    + 'px';
    box.style.width  = r.width  + 'px';
    box.style.height = r.height + 'px';
  },

  _drawLabel(el) {
    if (!this._label) return;
    if (!el) { this._label.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    const s = this._scale();
    // 디자인 좌표 크기로 환산해 표시
    const dw = Math.round(r.width / s), dh = Math.round(r.height / s);
    this._label.textContent = `${this._shortSel(el)}  ·  ${dw}×${dh}`;
    this._label.style.display = 'block';
    this._label.style.left = r.left + 'px';
    this._label.style.top  = (r.top - 22) + 'px';
  },

  // ── 마우스 이동 → 호버 하이라이트 ─────────────────────────
  _handleMove(e) {
    if (this._drag)      { this._dragMove(e); return; }
    if (this._isPanel(e.target)) { this._drawBox(this._hoverBox, null); this._drawLabel(null); return; }
    const el = this._topGameEl(e.clientX, e.clientY);
    this._drawBox(this._hoverBox, el);
    this._drawLabel(el);
  },

  // ── 클릭 → 선택 + 스택 분석 ───────────────────────────────
  _handleClick(e) {
    if (this._isPanel(e.target)) return;     // 패널 자체 클릭은 통과
    e.preventDefault();
    e.stopPropagation();
    this._stack = this._stackAt(e.clientX, e.clientY);
    this._select(this._stack[0] ?? null);
    this._renderStack();
  },

  // 게임 영역 최상단 요소 (자체 UI 제외)
  _topGameEl(x, y) {
    return this._stackAt(x, y)[0] ?? null;
  },

  // 지점에 겹친 요소들 (위→아래), 자체 UI/오버레이 제외
  _stackAt(x, y) {
    return document.elementsFromPoint(x, y)
      .filter(el => !this._isOwnUI(el) && el !== document.documentElement && el !== document.body);
  },

  // elementsFromPoint 결과에서 걸러낼 자체 레이어 (실드·패널·오버레이 등)
  _isOwnUI(el) {
    if (!el || !el.classList) return false;
    if (el.closest && el.closest('.uii-panel')) return true;
    return ['uii-shield', 'uii-overlay', 'uii-hoverbox', 'uii-size-label']
      .some(c => el.classList.contains(c));
  },

  // 패널 위인지 (패널 클릭/호버는 인스펙션에서 제외)
  _isPanel(el) {
    return !!(el && el.closest && el.closest('.uii-panel'));
  },

  _select(el) {
    this._selected = el;
    this._drawBox(this._overlay, el);
    this._renderEditor();
  },

  // ── 패널 ──────────────────────────────────────────────────
  _buildPanel() {
    const p = document.createElement('div');
    p.className = 'uii-panel';
    p.innerHTML = `
      <div class="uii-head">
        <span>🎯 UI INSPECTOR</span>
        <button class="uii-close" title="닫기 (Esc)">✕</button>
      </div>
      <div class="uii-hint">화면의 요소를 <b>클릭</b>하면 스택·편집기가 열립니다. 편집은 <b>자동 저장</b>되어 다음 실행에도 유지됩니다. <b>CSS Export</b>는 소스에 영구 반영(커밋)용 스니펫/파일입니다.</div>
      <div class="uii-section">
        <div class="uii-sect-title">클릭 지점 레이어 (위 = 실제 클릭됨)</div>
        <div class="uii-stack"><div class="uii-empty">아무 곳이나 클릭하세요</div></div>
      </div>
      <div class="uii-section">
        <div class="uii-sect-title">선택 요소 편집</div>
        <div class="uii-editor"><div class="uii-empty">선택된 요소 없음</div></div>
      </div>
      <div class="uii-section uii-actions">
        <button class="uii-btn" data-act="export">CSS Export</button>
        <button class="uii-btn" data-act="reset-el">선택 초기화</button>
        <button class="uii-btn uii-danger" data-act="reset-all">전체 초기화</button>
      </div>
      <textarea class="uii-export" readonly placeholder="Export 결과 (커밋용 CSS)"></textarea>
    `;
    document.body.appendChild(p);
    this._panel = p;
    this._applyPanelPos();

    // 헤더 드래그로 패널 이동 — 자체 포함형(전역 핸들러 충돌 방지)
    p.querySelector('.uii-head').addEventListener('mousedown', (e) => {
      if (e.target.closest('.uii-close')) return;
      e.preventDefault();
      e.stopPropagation();
      const r = p.getBoundingClientRect();
      const x0 = e.clientX, y0 = e.clientY, left0 = r.left, top0 = r.top;
      const move = (ev) => {
        p.style.left  = (left0 + ev.clientX - x0) + 'px';
        p.style.top   = (top0  + ev.clientY - y0) + 'px';
        p.style.right = 'auto';
      };
      const up = () => {
        document.removeEventListener('mousemove', move, true);
        document.removeEventListener('mouseup', up, true);
        this._savePanelPos();
      };
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', up, true);
    });

    p.querySelector('.uii-close').addEventListener('click', () => this.disable());
    p.querySelector('.uii-actions').addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (act === 'export')    this._exportCSS();
      if (act === 'reset-el')  this._resetSelected();
      if (act === 'reset-all') this._resetAll();
    });
  },

  _renderStack() {
    const box = this._panel?.querySelector('.uii-stack');
    if (!box) return;
    if (!this._stack.length) {
      box.innerHTML = `<div class="uii-empty">요소 없음</div>`;
      return;
    }
    box.innerHTML = this._stack.map((el, i) => {
      const z = getComputedStyle(el).zIndex;
      const top = i === 0 ? '<span class="uii-tag-top">● 클릭됨</span>' : '';
      const blocking = i === 0 && this._stack.length > 1
        ? '' : (i > 0 ? '<span class="uii-tag-block">가려짐</span>' : '');
      return `<div class="uii-row" data-i="${i}">
        <span class="uii-row-sel">${this._shortSel(el)}</span>
        <span class="uii-row-meta">z:${z === 'auto' ? '-' : z} ${top}${blocking}</span>
      </div>`;
    }).join('');

    box.querySelectorAll('.uii-row').forEach(row => {
      const el = this._stack[Number(row.dataset.i)];
      row.addEventListener('mouseenter', () => { this._drawBox(this._hoverBox, el); this._drawLabel(el); });
      row.addEventListener('mouseleave', () => { this._drawBox(this._hoverBox, null); this._drawLabel(null); });
      row.addEventListener('click', () => {
        box.querySelectorAll('.uii-row').forEach(r => r.classList.remove('is-sel'));
        row.classList.add('is-sel');
        this._select(el);
      });
    });
  },

  _renderEditor() {
    const box = this._panel?.querySelector('.uii-editor');
    if (!box) return;
    const el = this._selected;
    if (!el) { box.innerHTML = `<div class="uii-empty">선택된 요소 없음</div>`; return; }

    const sel = this._selectorFor(el);
    const ov  = this._overrides[sel] || {};
    const r   = el.getBoundingClientRect();
    const s   = this._scale();
    const w   = ov.w ?? Math.round(r.width / s);
    const h   = ov.h ?? Math.round(r.height / s);
    const dx  = ov.dx ?? 0;
    const dy  = ov.dy ?? 0;

    box.innerHTML = `
      <div class="uii-sel-name" title="${sel}">${sel}</div>
      ${this._field('오프셋 X', 'dx', dx, 1)}
      ${this._field('오프셋 Y', 'dy', dy, 1)}
      ${this._field('너비 W',   'w',  w,  1)}
      ${this._field('높이 H',   'h',  h,  1)}
      <label class="uii-check">
        <input type="checkbox" data-k="noPointer" ${ov.noPointer ? 'checked' : ''}>
        클릭 통과 (pointer-events: none) — 이 레이어가 가리는지 테스트
      </label>
      <div class="uii-tip">박스를 드래그해 위치 이동, 우하단 손잡이로 크기 조절</div>
    `;

    box.querySelectorAll('input[data-k]').forEach(inp => {
      inp.addEventListener('input', () => this._editFromInputs());
    });
    box.querySelectorAll('.uii-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = box.querySelector(`input[data-k="${btn.dataset.k}"]`);
        inp.value = Number(inp.value || 0) + Number(btn.dataset.step);
        this._editFromInputs();
      });
    });
    // 오버레이 박스에 드래그/리사이즈 핸들 부여
    this._makeOverlayInteractive();
  },

  _field(label, key, val, step) {
    return `<div class="uii-field">
      <span class="uii-flabel">${label}</span>
      <button class="uii-step" data-k="${key}" data-step="${-step}">−</button>
      <input type="number" data-k="${key}" value="${val}" step="${step}">
      <button class="uii-step" data-k="${key}" data-step="${step}">+</button>
    </div>`;
  },

  _editFromInputs() {
    const box = this._panel?.querySelector('.uii-editor');
    if (!box || !this._selected) return;
    const get = (k) => box.querySelector(`input[data-k="${k}"]`);
    const sel = this._selectorFor(this._selected);
    this._overrides[sel] = {
      dx: Number(get('dx').value || 0),
      dy: Number(get('dy').value || 0),
      w:  Number(get('w').value || 0),
      h:  Number(get('h').value || 0),
      noPointer: !!get('noPointer').checked,
    };
    this._applyAllOverrides();
    this._saveOverrides();
    this._drawBox(this._overlay, this._selected);
  },

  // ── 오버레이 드래그/리사이즈 ──────────────────────────────
  _makeOverlayInteractive() {
    const box = this._overlay;
    if (!box) return;
    box.innerHTML = `<div class="uii-resize"></div>`;
    box.style.pointerEvents = 'auto';

    box.onmousedown = (e) => {
      if (e.target.classList.contains('uii-resize')) {
        this._drag = { mode: 'resize', x0: e.clientX, y0: e.clientY };
      } else {
        this._drag = { mode: 'move', x0: e.clientX, y0: e.clientY };
      }
      const sel = this._selectorFor(this._selected);
      const ov  = this._overrides[sel] || {};
      const r   = this._selected.getBoundingClientRect();
      const s   = this._scale();
      this._drag.start = {
        dx: ov.dx ?? 0, dy: ov.dy ?? 0,
        w:  ov.w ?? Math.round(r.width / s),
        h:  ov.h ?? Math.round(r.height / s),
      };
      e.preventDefault();
      e.stopPropagation();
    };
    // 드래그 종료는 enable() 에서 등록한 공용 mouseup(_handleUp)이 처리
  },

  // ── 패널 위치 영속 ────────────────────────────────────────
  _applyPanelPos() {
    try {
      const pos = JSON.parse(localStorage.getItem(PANEL_POS_KEY) || 'null');
      if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
        this._panel.style.left  = pos.left + 'px';
        this._panel.style.top   = pos.top + 'px';
        this._panel.style.right = 'auto';
      }
    } catch {}
  },

  _savePanelPos() {
    const r = this._panel?.getBoundingClientRect();
    if (!r) return;
    localStorage.setItem(PANEL_POS_KEY, JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top) }));
  },

  _dragMove(e) {
    const s = this._scale();
    // 화면 픽셀 이동량 → 디자인 좌표로 환산 (÷scale)
    const ddx = Math.round((e.clientX - this._drag.x0) / s);
    const ddy = Math.round((e.clientY - this._drag.y0) / s);
    const sel = this._selectorFor(this._selected);
    const st  = this._drag.start;
    if (this._drag.mode === 'move') {
      this._overrides[sel] = { ...this._overrides[sel], dx: st.dx + ddx, dy: st.dy + ddy };
    } else {
      this._overrides[sel] = { ...this._overrides[sel],
        w: Math.max(4, st.w + ddx), h: Math.max(4, st.h + ddy) };
    }
    this._applyAllOverrides();
    this._saveOverrides();
    this._drawBox(this._overlay, this._selected);
    this._drawLabel(this._selected);
  },

  // ── 오버라이드 적용 (주입 스타일) ─────────────────────────
  _injectStyleEl() {
    let s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      document.head.appendChild(s);
    }
    this._styleEl = s;
  },

  _ruleFor(sel, ov) {
    const decl = [];
    if (ov.dx || ov.dy) decl.push(`transform: translate(${ov.dx || 0}px, ${ov.dy || 0}px) !important`);
    if (ov.w)           decl.push(`width: ${ov.w}px !important`);
    if (ov.h)           decl.push(`height: ${ov.h}px !important`);
    if (ov.noPointer)   decl.push(`pointer-events: none !important`);
    if (!decl.length) return '';
    return `${sel} { ${decl.join('; ')}; }`;
  },

  _applyAllOverrides() {
    if (!this._styleEl) this._injectStyleEl();
    const css = Object.entries(this._overrides)
      .map(([sel, ov]) => this._ruleFor(sel, ov))
      .filter(Boolean)
      .join('\n');
    this._styleEl.textContent = css;
  },

  // ── 저장/내보내기 ─────────────────────────────────────────
  _loadOverrides() {
    try {
      this._overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { this._overrides = {}; }
  },

  _saveOverrides() {
    // 빈 오버라이드는 정리
    for (const [k, v] of Object.entries(this._overrides)) {
      if (!v.dx && !v.dy && !v.w && !v.h && !v.noPointer) delete this._overrides[k];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._overrides));
  },

  _exportCSS() {
    const ta = this._panel?.querySelector('.uii-export');
    if (!ta) return;
    const rules = Object.entries(this._overrides)
      .map(([sel, ov]) => this._ruleFor(sel, ov))
      .filter(Boolean)
      .join('\n');
    const css = rules
      ? `/* === UI Inspector 오버라이드 — css/ 의 적절한 파일에 붙여 커밋 === */\n${rules}\n`
      : '/* 오버라이드 없음 */';
    ta.value = css;
    ta.style.display = 'block';
    ta.select();
    try { document.execCommand('copy'); } catch {}
    // 파일로도 저장 (tangible save)
    try {
      const blob = new Blob([css], { type: 'text/css' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ui-overrides.css';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {}
  },

  _resetSelected() {
    if (!this._selected) return;
    const sel = this._selectorFor(this._selected);
    delete this._overrides[sel];
    this._applyAllOverrides();
    this._saveOverrides();
    this._drawBox(this._overlay, this._selected);
    this._renderEditor();
  },

  _resetAll() {
    this._overrides = {};
    this._applyAllOverrides();
    this._saveOverrides();
    this._renderEditor();
    const ta = this._panel?.querySelector('.uii-export');
    if (ta) { ta.value = ''; ta.style.display = 'none'; }
  },

  // ── 셀렉터 생성 ───────────────────────────────────────────
  // 편집/저장용 안정 셀렉터: id 우선, 없으면 nth-of-type 경로
  _selectorFor(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      if (node.id) { parts.unshift(`#${CSS.escape(node.id)}`); break; }
      const tag = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter(c => c.tagName === node.tagName);
        const idx = sameTag.indexOf(node) + 1;
        parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${idx})` : tag);
      } else {
        parts.unshift(tag);
      }
      node = parent;
    }
    return parts.join(' > ');
  },

  // 리스트/라벨용 짧은 표기
  _shortSel(el) {
    const tag = el.tagName.toLowerCase();
    const id  = el.id ? `#${el.id}` : '';
    const cls = (typeof el.className === 'string' && el.className)
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return `${tag}${id}${cls}`;
  },
};

export default UIInspector;
