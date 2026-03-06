// === BOARD RENDERER ===
// Syncs GameState.board → DOM
import GameState  from '../core/GameState.js';
import EventBus   from '../core/EventBus.js';
import CardFactory from './CardFactory.js';
import BoardManager from '../board/BoardManager.js';

const ROW_CONFIG = [
  { key: 'top',    label: '장소',   hint: '클릭하여 이동' },
  { key: 'middle', label: '바닥',   hint: '발견한 아이템' },
  { key: 'bottom', label: '휴대',   hint: '소지품' },
];

const BoardRenderer = {
  _container: null,

  _listenersRegistered: false,

  init() {
    // 리스너는 container 존재 여부와 무관하게 항상 먼저 등록한다.
    // board-container는 Basecamp._buildLayout()이 호출될 때 동적으로 생성되므로
    // init() 시점에는 DOM에 없을 수 있다.
    if (!this._listenersRegistered) {
      this._listenersRegistered = true;
      EventBus.on('cardPlaced',   () => this.render());
      EventBus.on('cardMoved',    () => this.render());
      EventBus.on('cardRemoved',  () => this.render());
      EventBus.on('boardChanged',  () => this.render());
      EventBus.on('craftComplete', () => this.render());
      EventBus.on('boardReinit',   () => { if (this._container) { this._buildDOM(); this.render(); } });
      EventBus.on('tpAdvance',    () => this.render());
      EventBus.on('locationChanged', ({ nodeId, node }) => { this._updateLocationInfo(nodeId, node); this.render(); });
      EventBus.on('loaded',       () => { this._container = document.getElementById('board-container'); this._buildDOM(); this.render(); });
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
      label.textContent = row.label;

      const slots = document.createElement('div');
      slots.className = 'board-row-slots';
      slots.id = `row-${row.key}`;

      const rowSize = GameState.board[row.key]?.length ?? 8;
      for (let i = 0; i < rowSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.row  = row.key;
        slot.dataset.slot = i;
        slot.setAttribute('data-hint', row.hint);
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
          if (cardEl) slotEl.appendChild(cardEl);
        }
      });
    }

    // ── Step 5: FLIP 애니메이션 — 이동한 카드를 부드럽게 슬라이드 ──
    requestAnimationFrame(() => {
      Object.entries(prevRects).forEach(([instanceId, oldRect]) => {
        const el = this._container.querySelector(`[data-instance-id="${instanceId}"]`);
        if (!el) return; // 보드에서 제거된 카드

        const newRect = el.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top  - newRect.top;

        // 2px 미만 이동은 무시 (렌더링 오차)
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

        // 이동 카드: spawn 애니메이션 제거 후 FLIP 슬라이드 적용
        el.classList.remove('spawning');
        el.style.transition = 'none';
        el.style.transform  = `translate(${dx}px, ${dy}px)`;

        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          el.style.transform  = '';
          el.addEventListener('transitionend', () => {
            el.style.transition = '';
          }, { once: true });
        });
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
    const radStr = node.radiation > 0 ? `<span class="loc-info-tag loc-rad">☢ 방사선 +${node.radiation}</span>` : '';
    const encStr = encPct > 0 ? `<span class="loc-info-tag loc-enc">💀 조우 ${encPct}%</span>` : '';

    bar.innerHTML = `
      <div class="loc-info-header">
        <span class="loc-info-icon">${node.icon ?? '📍'}</span>
        <span class="loc-info-name">${node.name}</span>
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
      middleLabel.textContent = isBasecamp ? '바닥' : `바닥 — ${nodeName}`;
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
