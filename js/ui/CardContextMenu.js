// === CARD CONTEXT MENU ===
// 카드 위 3초 長押 → 분해/합성 컨텍스트 메뉴
// PC·모바일 동일 (PointerEvents 기반)
import EventBus       from '../core/EventBus.js';
import GameState      from '../core/GameState.js';
import DismantleSystem from '../systems/DismantleSystem.js';

const LONG_PRESS_MS   = 3000;
const MOVE_THRESHOLD  = 8;   // px — 이 이상 움직이면 드래그로 판정하여 취소

const CardContextMenu = {
  _timer:      null,
  _startX:     0,
  _startY:     0,
  _targetId:   null,   // instanceId
  _menuEl:     null,

  init() {
    // 이벤트 위임: document에 한 번만 등록
    document.addEventListener('pointerdown',  e => this._onDown(e),  { passive: true });
    document.addEventListener('pointermove',  e => this._onMove(e),  { passive: true });
    document.addEventListener('pointerup',    e => this._onUp(e),    { passive: true });
    document.addEventListener('pointercancel',()  => this._cancel());

    // 상태 전환 시 메뉴 닫기
    EventBus.on('stateTransition', () => this._close());
    EventBus.on('boardChanged',    () => this._close());
  },

  // ── 이벤트 핸들러 ──────────────────────────────────────────

  _onDown(e) {
    const card = e.target.closest('[data-instance-id]');
    if (!card) return;

    const instanceId = card.dataset.instanceId;
    const def = GameState.getCardDef(instanceId);
    // 장소 카드는 컨텍스트 메뉴 없음
    if (!def || def.type === 'location') return;

    this._cancel();
    this._targetId = instanceId;
    this._startX   = e.clientX;
    this._startY   = e.clientY;

    this._timer = setTimeout(() => {
      this._timer = null;
      this._show(instanceId, e.clientX, e.clientY);
    }, LONG_PRESS_MS);
  },

  _onMove(e) {
    if (!this._timer) return;
    const dx = Math.abs(e.clientX - this._startX);
    const dy = Math.abs(e.clientY - this._startY);
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      this._cancel();
    }
  },

  _onUp(e) {
    this._cancel();
    // 이미 열린 메뉴가 있고 클릭 위치가 메뉴 밖이면 닫기
    if (this._menuEl && !this._menuEl.contains(e.target)) {
      this._close();
    }
  },

  _cancel() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._targetId = null;
  },

  // ── 메뉴 표시 ─────────────────────────────────────────────

  _show(instanceId, cx, cy) {
    this._close();

    const def = GameState.getCardDef(instanceId);
    if (!def) return;

    const canDismantle  = DismantleSystem.canDismantle(instanceId);
    const craftable     = this._findCraftable(instanceId);

    // ── 오버레이 배경 (클릭 시 닫힘) ─────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'ctx-overlay';
    overlay.addEventListener('pointerdown', () => this._close(), { once: true });

    // ── 메뉴 패널 ──────────────────────────────────────────
    const menu = document.createElement('div');
    menu.className = 'ctx-menu';

    // 제목
    const title = document.createElement('div');
    title.className = 'ctx-title';
    title.textContent = def.name;
    menu.appendChild(title);

    // 분해 버튼
    const btnDismantle = document.createElement('button');
    btnDismantle.className = `ctx-btn${canDismantle ? '' : ' disabled'}`;
    btnDismantle.innerHTML = `🔨 분해`;
    if (!canDismantle) {
      btnDismantle.disabled = true;
      btnDismantle.title = '이 아이템은 분해할 수 없습니다';
    } else {
      const preview = def.dismantle.map(d => {
        const pct = Math.round(d.chance * 100);
        const dDef = window.__GAME_DATA__?.items[d.definitionId];
        return `${dDef?.icon ?? '?'}${dDef?.name ?? d.definitionId} ×${d.qty} (${pct}%)`;
      }).join('\n');
      btnDismantle.title = preview;
      btnDismantle.addEventListener('click', () => {
        this._close();
        DismantleSystem.dismantle(instanceId);
        EventBus.emit('boardChanged', {});
      });
    }
    menu.appendChild(btnDismantle);

    // 합성 가능 버튼
    const btnCraft = document.createElement('button');
    btnCraft.className = `ctx-btn${craftable.length > 0 ? '' : ' disabled'}`;
    btnCraft.innerHTML = `⚗️ 합성 가능 (${craftable.length}종)`;
    if (craftable.length === 0) {
      btnCraft.disabled = true;
      btnCraft.title = '현재 보드에서 이 카드를 이용한 합성 없음';
    } else {
      btnCraft.title = craftable.map(b => b.name).join(', ');
      btnCraft.addEventListener('click', () => {
        this._close();
        // 제작 패널로 전환 및 필터 하이라이트
        EventBus.emit('openCraftFilter', { instanceId, blueprints: craftable.map(b => b.id) });
      });
    }
    menu.appendChild(btnCraft);

    // 닫기 버튼
    const btnClose = document.createElement('button');
    btnClose.className = 'ctx-btn close';
    btnClose.textContent = '✕ 닫기';
    btnClose.addEventListener('click', () => this._close());
    menu.appendChild(btnClose);

    // ── 위치 계산 (화면 밖으로 나가지 않도록) ─────────────────
    document.body.appendChild(overlay);
    document.body.appendChild(menu);
    this._menuEl = menu;

    const mw = menu.offsetWidth  || 200;
    const mh = menu.offsetHeight || 160;
    let  left = cx + 8;
    let  top  = cy + 8;
    if (left + mw > window.innerWidth)  left = cx - mw - 8;
    if (top  + mh > window.innerHeight) top  = cy - mh - 8;
    menu.style.left = `${Math.max(4, left)}px`;
    menu.style.top  = `${Math.max(4, top)}px`;

    // 진동 피드백 (모바일)
    if (navigator.vibrate) navigator.vibrate(30);
  },

  // ── 메뉴 닫기 ─────────────────────────────────────────────

  _close() {
    if (this._menuEl) {
      this._menuEl.remove();
      this._menuEl = null;
    }
    // 오버레이 제거
    document.querySelectorAll('.ctx-overlay').forEach(el => el.remove());
  },

  // ── 합성 가능 레시피 탐색 ─────────────────────────────────

  /**
   * 보드에 있는 현재 카드 재료를 고려해 instanceId가 포함된 제작 가능 레시피를 반환.
   * @returns {Array<{id, name}>}
   */
  _findCraftable(instanceId) {
    const blueprints = window.__GAME_DATA__?.blueprints;
    if (!blueprints) return [];

    const inst = GameState.cards[instanceId];
    if (!inst) return [];

    const targetDefId = inst.definitionId;

    // 보드 위 카드 재고 집계 (definitionId → totalQty)
    const boardStock = {};
    for (const card of GameState.getBoardCards()) {
      boardStock[card.definitionId] = (boardStock[card.definitionId] ?? 0) + (card.quantity ?? 1);
    }

    const result = [];

    for (const bp of Object.values(blueprints)) {
      // 이 레시피가 targetDefId를 재료로 사용하는지 확인
      const usesTarget = bp.stages.some(stage =>
        stage.requiredItems.some(ri => ri.definitionId === targetDefId)
      );
      if (!usesTarget) continue;

      // 전체 재료가 보드에 있는지 확인
      const allItems = bp.stages.flatMap(s => s.requiredItems);
      const needed = {};
      for (const ri of allItems) {
        needed[ri.definitionId] = (needed[ri.definitionId] ?? 0) + ri.qty;
      }

      const canMake = Object.entries(needed).every(([defId, qty]) =>
        (boardStock[defId] ?? 0) >= qty
      );

      if (canMake) {
        result.push({ id: bp.id, name: bp.name });
      }
    }

    return result;
  },
};

export default CardContextMenu;
