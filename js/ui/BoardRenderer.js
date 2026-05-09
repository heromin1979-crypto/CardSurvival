// === BOARD RENDERER ===
// Syncs GameState.board → DOM
import GameState  from '../core/GameState.js';
import EventBus   from '../core/EventBus.js';
import CardFactory from './CardFactory.js';
import BoardManager from '../board/BoardManager.js';
import I18n       from '../core/I18n.js';
import GameData   from '../data/GameData.js';

// row.slots = 페이지화되지 않은 행의 슬롯 수 / paged: true는 GameState._getPageRanges로 결정
const ROW_CONFIG = [
  { key: 'top',    slots: 10, labelKey: 'board.location',  hintKey: 'board.locationHint', paged: false },
  { key: 'middle',            labelKey: 'board.floor',     hintKey: 'board.floorHint',    paged: true },
  { key: 'bottom',            labelKey: 'board.inventory', hintKey: 'board.inventoryHint', paged: true },
];

const MIDDLE_PAGE_SIZE  = 10;
const BOTTOM_PAGE1_SIZE = 20;
// 휴대 행 표시 그리드는 항상 10×2 = 20셀(페이지 2가 작아도 빈 셀로 채움)
const BOTTOM_DISPLAY_CELLS = 20;

const BoardRenderer = {
  _container: null,
  _listenersRegistered: false,
  _renderScheduled: false,  // 디바운싱: 1프레임에 1번만 render() 실행

  // 다수의 동기 이벤트(cardMoved, boardChanged 등)가 한 번에 발생해도
  // 다음 animationFrame에 render()를 딱 한 번만 실행한다.
  scheduleRender() {
    if (this._renderScheduled) return;
    this._renderScheduled = true;
    requestAnimationFrame(() => {
      this._renderScheduled = false;
      this.render();
    });
  },

  init() {
    // 리스너는 container 존재 여부와 무관하게 항상 먼저 등록한다.
    // board-container는 Basecamp._buildLayout()이 호출될 때 동적으로 생성되므로
    // init() 시점에는 DOM에 없을 수 있다.
    if (!this._listenersRegistered) {
      this._listenersRegistered = true;
      // cardPlaced: 시스템 배치 자동 페이지 전환 후 렌더
      EventBus.on('cardPlaced', ({ row, slot }) => {
        this._autoSwitchPage(row, slot);
        this.scheduleRender();
      });
      EventBus.on('cardMoved',     () => this.scheduleRender());
      EventBus.on('cardRemoved',   () => this.scheduleRender());
      EventBus.on('boardChanged',  () => this.scheduleRender());
      EventBus.on('craftComplete', () => this.scheduleRender());
      EventBus.on('tpAdvance',     () => this.scheduleRender());
      EventBus.on('locationChanged', ({ nodeId, node }) => {
        this._updateLocationInfo(nodeId, node);
        this.scheduleRender();
      });
      EventBus.on('boardReinit', () => {
        if (this._container) { this._buildDOM(); this.scheduleRender(); }
      });
      // 바닥 page3 해금: 페이저 다시 빌드
      EventBus.on('middlePage3Unlocked', () => {
        if (this._container) { this._buildDOM(); this.scheduleRender(); }
      });
      EventBus.on('languageChanged', () => {
        if (this._container) { this._buildDOM(); this.render(); }
      });
      // 게임 로드 시점은 경합 이벤트가 없으므로 직접 render
      // 단, 메인 메뉴 → 불러오기 경로에서는 board-container가 아직 DOM에 없을 수 있음
      EventBus.on('loaded', () => {
        this._container = document.getElementById('board-container');
        if (!this._container) {
          console.warn('[BoardRenderer] loaded: board-container가 아직 존재하지 않음. Basecamp 진입 시 reinit()으로 재초기화 예정.');
          return;
        }
        this._buildDOM();
        this.render();
      });
    }

    this._container = document.getElementById('board-container');
    if (!this._container) return;

    this._buildDOM();
  },

  // Called when re-entering basecamp to refresh DOM reference
  reinit() {
    this._container = document.getElementById('board-container');
    if (!this._container) return;
    this._buildDOM();
    this.render();
  },

  _buildDOM() {
    if (!this._container) {
      console.warn('[BoardRenderer] _buildDOM: container가 null입니다. 건너뜁니다.');
      return;
    }
    this._container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'board';

    for (const row of ROW_CONFIG) {
      const rowEl = document.createElement('div');
      rowEl.className = `board-row row-${row.key}`;
      rowEl.dataset.row = row.key;

      // 행 헤더: 라벨 + 페이저(있을 때) 가로 배치 — 슬롯 그리드 폭에 영향 없음
      const header = document.createElement('div');
      header.className = 'board-row-header';

      const label = document.createElement('div');
      label.className = 'board-row-label';
      label.textContent = I18n.t(row.labelKey);
      header.appendChild(label);

      if (row.paged) {
        const pages = GameState._getPageRanges(row.key) ?? [];
        if (pages.length >= 2) {
          header.appendChild(this._buildPager(row.key, pages));
        }
      }

      const slots = document.createElement('div');
      slots.className = 'board-row-slots';
      slots.id = `row-${row.key}`;

      if (row.paged) {
        this._buildPagedSlots(slots, row);
      } else {
        this._buildPlainSlots(slots, row);
      }

      rowEl.appendChild(header);
      rowEl.appendChild(slots);
      board.appendChild(rowEl);
    }

    this._container.appendChild(board);

    // 장소 정보 패널 (basecamp 외 지역에 표시)
    const locInfo = document.createElement('div');
    locInfo.id = 'location-info-bar';
    locInfo.className = 'location-info-bar';
    locInfo.style.display = 'none';
    this._container.appendChild(locInfo);
  },

  _buildPlainSlots(slotsEl, row) {
    const rowLabel = I18n.t(row.labelKey);
    for (let i = 0; i < row.slots; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.row  = row.key;
      slot.dataset.slot = i;
      slot.setAttribute('data-hint', I18n.t(row.hintKey));
      slot.setAttribute('aria-label', `${rowLabel} ${i + 1}번 슬롯`);
      slotsEl.appendChild(slot);
    }
  },

  _buildPagedSlots(slotsEl, row) {
    const pages = GameState._getPageRanges(row.key) ?? [];
    const curPage = Math.min(this._currentPage(row.key), Math.max(0, pages.length - 1));
    const range = pages[curPage] ?? { start: 0, size: 0 };
    const rowLabel = I18n.t(row.labelKey);

    // 휴대 행은 항상 10×2 그리드(20셀) 표시 — 페이지 2가 작으면 빈 셀로 채움
    const displayCells = row.key === 'bottom' ? BOTTOM_DISPLAY_CELLS : range.size;

    for (let i = 0; i < displayCells; i++) {
      const slot = document.createElement('div');
      if (i < range.size) {
        slot.className = 'slot';
        slot.dataset.row  = row.key;
        slot.dataset.slot = range.start + i;
        slot.setAttribute('data-hint', I18n.t(row.hintKey));
        slot.setAttribute('aria-label', `${rowLabel} ${curPage + 1}페이지 ${i + 1}번 슬롯`);
      } else {
        // 표시 그리드를 채우는 시각 비활성 셀 — drop 대상 아님
        slot.className = 'slot slot-empty-bg';
        slot.setAttribute('aria-hidden', 'true');
      }
      slotsEl.appendChild(slot);
    }
  },

  _buildPager(rowKey, pages) {
    const curPage = Math.min(this._currentPage(rowKey), pages.length - 1);
    const wrap = document.createElement('div');
    wrap.className = `board-row-pager pager-${rowKey}`;
    wrap.dataset.row = rowKey;

    const prev = document.createElement('button');
    prev.className = 'pager-arrow pager-prev';
    prev.type = 'button';
    prev.textContent = '‹';
    prev.disabled = curPage <= 0;
    prev.setAttribute('aria-label', I18n.t('board.pagerPrev'));
    prev.addEventListener('click', (e) => { e.stopPropagation(); this._switchPage(rowKey, curPage - 1); });

    const dots = document.createElement('div');
    dots.className = 'pager-dots';
    pages.forEach((page, i) => {
      const dot = document.createElement('button');
      dot.className = 'pager-dot';
      dot.type = 'button';
      dot.dataset.page = i;
      dot.dataset.row  = rowKey;
      if (i === curPage) dot.classList.add('current');
      const hasCard = (GameState.board[rowKey] ?? [])
        .slice(page.start, page.start + page.size)
        .some(v => v !== null);
      if (hasCard) dot.classList.add('occupied');
      const labelRow = I18n.t(rowKey === 'bottom' ? 'board.inventory' : 'board.floor');
      dot.setAttribute('aria-label', I18n.t('board.pagerLabel', { row: labelRow, n: i + 1 }));
      dot.addEventListener('click', (e) => { e.stopPropagation(); this._switchPage(rowKey, i); });
      dots.appendChild(dot);
    });

    const next = document.createElement('button');
    next.className = 'pager-arrow pager-next';
    next.type = 'button';
    next.textContent = '›';
    next.disabled = curPage >= pages.length - 1;
    next.setAttribute('aria-label', I18n.t('board.pagerNext'));
    next.addEventListener('click', (e) => { e.stopPropagation(); this._switchPage(rowKey, curPage + 1); });

    wrap.append(prev, dots, next);
    return wrap;
  },

  _currentPage(rowKey) {
    if (rowKey === 'bottom') return GameState.ui.bottomPage ?? 0;
    if (rowKey === 'middle') return GameState.ui.middlePage ?? 0;
    return 0;
  },

  _setCurrentPage(rowKey, page) {
    if (rowKey === 'bottom') GameState.ui.bottomPage = page;
    else if (rowKey === 'middle') GameState.ui.middlePage = page;
  },

  _switchPage(rowKey, newPage) {
    const pages = GameState._getPageRanges(rowKey) ?? [];
    if (pages.length === 0) return;
    const clamped = Math.max(0, Math.min(pages.length - 1, newPage));
    if (clamped === this._currentPage(rowKey)) return;
    this._setCurrentPage(rowKey, clamped);
    // 슬롯 인덱스·페이저 상태만 갱신 — 다른 행은 건드리지 않아 깜빡임 방지
    this._refreshPagedRow(rowKey);
    this.render();
  },

  // 카드가 현재 페이지 외부에 배치되면 해당 페이지로 자동 전환
  _autoSwitchPage(rowKey, slot) {
    if (rowKey !== 'middle' && rowKey !== 'bottom') return;
    const pages = GameState._getPageRanges(rowKey) ?? [];
    const targetPage = pages.findIndex(p => slot >= p.start && slot < p.start + p.size);
    if (targetPage < 0) return;
    if (targetPage === this._currentPage(rowKey)) return;
    this._setCurrentPage(rowKey, targetPage);
    if (this._container) this._refreshPagedRow(rowKey);
  },

  // 한 행의 슬롯 dataset.slot과 페이저 상태만 갱신 (DOM 파괴 없음)
  _refreshPagedRow(rowKey) {
    const slotsEl = document.getElementById(`row-${rowKey}`);
    if (!slotsEl) return;
    const row = ROW_CONFIG.find(r => r.key === rowKey);
    if (!row?.paged) return;

    const pages = GameState._getPageRanges(rowKey) ?? [];
    const curPage = Math.min(this._currentPage(rowKey), Math.max(0, pages.length - 1));
    const range = pages[curPage] ?? { start: 0, size: 0 };
    const rowLabel = I18n.t(row.labelKey);
    const slotEls = slotsEl.querySelectorAll('.slot');

    slotEls.forEach((slotEl, i) => {
      if (i < range.size) {
        slotEl.classList.remove('slot-empty-bg');
        slotEl.classList.add('slot');
        slotEl.dataset.row  = rowKey;
        slotEl.dataset.slot = String(range.start + i);
        slotEl.setAttribute('data-hint', I18n.t(row.hintKey));
        slotEl.setAttribute('aria-label', `${rowLabel} ${curPage + 1}페이지 ${i + 1}번 슬롯`);
        slotEl.removeAttribute('aria-hidden');
      } else {
        slotEl.className = 'slot slot-empty-bg';
        delete slotEl.dataset.slot;
        slotEl.removeAttribute('data-hint');
        slotEl.removeAttribute('aria-label');
        slotEl.setAttribute('aria-hidden', 'true');
      }
    });

    // 페이저 갱신 — 행 헤더에서 기존 페이저 제거 후 다시 빌드
    const rowEl = slotsEl.closest('.board-row');
    const header = rowEl?.querySelector('.board-row-header');
    if (header) {
      const oldPager = header.querySelector('.board-row-pager');
      if (oldPager) oldPager.remove();
      if (pages.length >= 2) {
        header.appendChild(this._buildPager(rowKey, pages));
      }
    }
  },

  render() {
    if (!this._container) return;

    // ── Step 1: FLIP 준비 — 이동 전 모든 카드의 화면 좌표 기록 ──
    const prevRects = {};
    this._container.querySelectorAll('[data-instance-id]').forEach(el => {
      prevRects[el.dataset.instanceId] = el.getBoundingClientRect();
    });

    // ── Step 2: 레이블·장소 정보 갱신 ──
    this._updateFloorLabel();
    const curId   = GameState.location.currentNode ?? GameState.location.currentDistrict ?? 'mapo';
    const curNode = GameData?.nodes?.[curId];
    if (curNode) this._updateLocationInfo(curId, curNode);

    // ── Step 3: 기존 카드 DOM 요소 수집 후 슬롯에서 분리 ──
    // (삭제하지 않고 분리만 → 재사용 또는 FLIP 애니메이션에 활용)
    const detached = {}; // instanceId → element
    this._container.querySelectorAll('[data-instance-id]').forEach(el => {
      detached[el.dataset.instanceId] = el;
      el.remove();
    });

    // ── Step 4: 보드 상태에 따라 올바른 슬롯에 카드 배치 ──
    // 페이지화된 행은 dataset.slot이 배열 인덱스와 일치(forEach 인덱스와 다름)
    for (const row of ROW_CONFIG) {
      const slotsEl = document.getElementById(`row-${row.key}`);
      if (!slotsEl) continue;

      const slotEls = slotsEl.querySelectorAll('.slot:not(.slot-empty-bg)');
      const rowData = GameState.board[row.key];

      slotEls.forEach((slotEl) => {
        const arrayIdx = parseInt(slotEl.dataset.slot, 10);
        if (Number.isNaN(arrayIdx)) return;
        const instanceId = rowData[arrayIdx] ?? null;
        if (!instanceId || !GameState.cards[instanceId]) return;

        const existing = detached[instanceId];
        if (existing) {
          slotEl.appendChild(existing);
          CardFactory.update(instanceId);
        } else {
          const cardEl = CardFactory.build(instanceId);
          if (cardEl) {
            cardEl.classList.add('entering');
            slotEl.appendChild(cardEl);
            setTimeout(() => cardEl.classList.remove('entering'), 160);
          }
        }
      });
    }

    // ── Step 5: FLIP 애니메이션 — 이동한 카드를 부드럽게 슬라이드 ──
    // 장소 카드(location-card)는 항상 재생성되므로 FLIP 대상에서 제외
    requestAnimationFrame(() => {
      Object.entries(prevRects).forEach(([instanceId, oldRect]) => {
        const el = this._container.querySelector(`[data-instance-id="${instanceId}"]`);
        if (!el) return;
        if (el.classList.contains('location-card')) return;

        const newRect = el.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top  - newRect.top;

        // 2px 미만 이동은 무시 (렌더링 오차)
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

        // 이동 거리에 따라 자연스러운 속도 계산 (짧은 이동 0.18s ↔ 먼 이동 0.32s)
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dur  = Math.max(0.18, Math.min(0.32, 0.14 + dist * 0.0004));

        el.classList.remove('spawning');
        el.style.transition    = 'none';

        // 카드 CSS: top:0; left:50%; transform:translateX(-50%)
        // inline transform이 CSS transform을 덮을 때 수평만 -halfW 보정 필요 (수직 보정 불필요)
        const halfW = el.offsetWidth / 2;
        el.style.transform     = `translate(${dx - halfW}px, ${dy}px)`;
        el.style.pointerEvents = 'none'; // 이동 중 클릭 방지

        // 애니메이션 중 다른 슬롯/행에 가려지지 않도록 z-index 올림
        const slotEl     = el.parentElement;
        const rowSlotsEl = slotEl?.parentElement;
        const rowEl      = rowSlotsEl?.parentElement;
        if (slotEl)     { slotEl.style.zIndex = '999'; }
        if (rowSlotsEl) { rowSlotsEl.style.zIndex = '999'; }
        if (rowEl)      { rowEl.style.position = 'relative'; rowEl.style.zIndex = '999'; }

        // layout flush: 브라우저가 시작 위치를 확정한 뒤 전환 시작
        void el.getBoundingClientRect();

        el.style.transition = `transform ${dur}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        el.style.transform  = '';

        // transitionend가 발화하지 않는 엣지케이스를 방지하기 위해 타임아웃 폴백 사용
        const cleanup = () => {
          clearTimeout(fallback);
          el.style.transition    = '';
          el.style.transform     = '';
          el.style.pointerEvents = '';
          if (slotEl)     { slotEl.style.zIndex = ''; }
          if (rowSlotsEl) { rowSlotsEl.style.zIndex = ''; }
          if (rowEl)      { rowEl.style.position = ''; rowEl.style.zIndex = ''; }
        };
        const fallback = setTimeout(cleanup, Math.ceil(dur * 1000) + 100);
        el.addEventListener('transitionend', cleanup, { once: true });
      });
    });
  },

  _updateLocationInfo(nodeId, node) {
    const bar = this._container?.querySelector('#location-info-bar');
    if (!bar) return;

    const isBasecamp = GameState.ui.currentState === 'main';
    if (isBasecamp) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = '';
    const danger = node.dangerLevel ?? 0;
    const dangerStars = '★'.repeat(danger) + '☆'.repeat(Math.max(0, 5 - danger));
    const encPct = node.encounterChance > 0 ? Math.round(node.encounterChance * 100) : 0;
    const radStr = node.radiation > 0 ? `<span class="loc-info-tag loc-rad">${I18n.t('board.radiation', { val: node.radiation })}</span>` : '';
    const encStr = encPct > 0 ? `<span class="loc-info-tag loc-enc">${I18n.t('board.encounterBadge', { pct: encPct })}</span>` : '';

    bar.innerHTML = `
      <div class="loc-info-header">
        <span class="loc-info-icon">${node.icon ?? '📍'}</span>
        <span class="loc-info-name">${I18n.districtName(nodeId, node.name)}</span>
        <span class="loc-info-danger">${dangerStars}</span>
      </div>
      <div class="loc-info-desc">${node.description ?? ''}</div>
      <div class="loc-info-tags">${radStr}${encStr}</div>
    `;
  },

  _updateFloorLabel() {
    const nodes      = GameData?.nodes ?? {};
    const currentId  = GameState.location.currentNode ?? 'mapo';
    const nodeName   = nodes[currentId]?.name ?? currentId;
    const isBasecamp = GameState.ui.currentState === 'main';

    // 바닥 행 레이블
    const middleLabel = this._container?.querySelector('.board-row.row-middle .board-row-label');
    if (middleLabel) {
      middleLabel.textContent = isBasecamp ? I18n.t('board.floor') : I18n.t('board.floorLabel', { name: I18n.districtName(currentId, nodeName) });
    }

    // 장소 카드 현재 위치 강조 갱신
    document.querySelectorAll('.location-card').forEach(el => {
      const defId = el.dataset.definitionId;
      const def   = GameData?.items[defId];
      const isNow = def?.nodeId === currentId;
      el.classList.toggle('is-current', isNow);
    });
  },
};

export default BoardRenderer;
