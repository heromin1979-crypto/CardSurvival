// === BOARD RENDERER ===
// Syncs GameState.board → DOM
import GameState  from '../core/GameState.js';
import EventBus   from '../core/EventBus.js';
import CardFactory from './CardFactory.js';
import BoardManager from '../board/BoardManager.js';
import I18n       from '../core/I18n.js';

const ROW_CONFIG = [
  { key: 'top',         labelKey: 'board.location',     hintKey: 'board.locationHint' },
  { key: 'environment', labelKey: 'board.environment',  hintKey: 'board.environmentHint' },
  { key: 'middle',      labelKey: 'board.floor',        hintKey: 'board.floorHint' },
  { key: 'bottom',      labelKey: 'board.inventory',    hintKey: 'board.inventoryHint' },
];

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
      EventBus.on('cardPlaced',    () => this.scheduleRender());
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
      EventBus.on('languageChanged', () => {
        if (this._container) { this._buildDOM(); this.render(); }
      });
      // 게임 로드 시점은 경합 이벤트가 없으므로 직접 render
      EventBus.on('loaded', () => {
        this._container = document.getElementById('board-container');
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
    this._container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'board';

    for (const row of ROW_CONFIG) {
      const rowEl = document.createElement('div');
      rowEl.className = `board-row row-${row.key}`;
      rowEl.dataset.row = row.key;

      const label = document.createElement('div');
      label.className = 'board-row-label';
      label.textContent = I18n.t(row.labelKey);

      const slots = document.createElement('div');
      slots.className = 'board-row-slots';
      slots.id = `row-${row.key}`;

      const rowSize = GameState.board[row.key]?.length ?? 8;
      for (let i = 0; i < rowSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.row  = row.key;
        slot.dataset.slot = i;
        slot.setAttribute('data-hint', I18n.t(row.hintKey));
        slots.appendChild(slot);
      }

      rowEl.appendChild(label);
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
    const curNode = window.__GAME_DATA__?.nodes?.[curId];
    if (curNode) this._updateLocationInfo(curId, curNode);

    // ── Step 3: 기존 카드 DOM 요소 수집 후 슬롯에서 분리 ──
    // (삭제하지 않고 분리만 → 재사용 또는 FLIP 애니메이션에 활용)
    const detached = {}; // instanceId → element
    this._container.querySelectorAll('[data-instance-id]').forEach(el => {
      detached[el.dataset.instanceId] = el;
      el.remove();
    });

    // ── Step 4: 보드 상태에 따라 올바른 슬롯에 카드 배치 ──
    for (const row of ROW_CONFIG) {
      const slotsEl = document.getElementById(`row-${row.key}`);
      if (!slotsEl) continue;

      const slotEls = slotsEl.querySelectorAll('.slot');
      const rowData  = GameState.board[row.key];

      slotEls.forEach((slotEl, idx) => {
        const instanceId = rowData[idx] ?? null;
        if (!instanceId || !GameState.cards[instanceId]) return;

        const existing = detached[instanceId];
        if (existing) {
          // 기존 요소 재사용 (이동): 내용만 갱신
          slotEl.appendChild(existing);
          CardFactory.update(instanceId);
        } else {
          // 새로 생성 (신규 카드)
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
        el.style.transform     = `translate(${dx}px, ${dy}px)`;
        el.style.pointerEvents = 'none'; // 이동 중 클릭 방지

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
        };
        const fallback = setTimeout(cleanup, Math.ceil(dur * 1000) + 100);
        el.addEventListener('transitionend', cleanup, { once: true });
      });
    });
  },

  _updateLocationInfo(nodeId, node) {
    const bar = this._container?.querySelector('#location-info-bar');
    if (!bar) return;

    const isBasecamp = GameState.ui.currentState === 'basecamp';
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
    const nodes      = window.__GAME_DATA__?.nodes ?? {};
    const currentId  = GameState.location.currentNode ?? 'mapo';
    const nodeName   = nodes[currentId]?.name ?? currentId;
    const isBasecamp = GameState.ui.currentState === 'basecamp';

    // 바닥 행 레이블
    const middleLabel = this._container?.querySelector('.board-row.row-middle .board-row-label');
    if (middleLabel) {
      middleLabel.textContent = isBasecamp ? I18n.t('board.floor') : I18n.t('board.floorLabel', { name: I18n.districtName(currentId, nodeName) });
    }

    // 장소 카드 현재 위치 강조 갱신
    document.querySelectorAll('.location-card').forEach(el => {
      const defId = el.dataset.definitionId;
      const def   = window.__GAME_DATA__?.items[defId];
      const isNow = def?.nodeId === currentId;
      el.classList.toggle('is-current', isNow);
    });
  },
};

export default BoardRenderer;
