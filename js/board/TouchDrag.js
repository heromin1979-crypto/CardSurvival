// === TOUCH DRAG ===
// Pointer Events 기반 모바일 터치 드래그.
// HTML5 DragDrop API는 모바일에서 미지원 → PointerEvent로 구현.
// 마우스 이벤트는 제외 (HTML5 DnD가 처리).
import SlotResolver from './SlotResolver.js';
import GameState    from '../core/GameState.js';
import EventBus     from '../core/EventBus.js';

const TouchDrag = {
  _draggingId: null,
  _ghostEl:    null,
  _offsetX:    0,
  _offsetY:    0,
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    document.addEventListener('pointerdown',   e => this._onPointerDown(e),   { passive: false });
    document.addEventListener('pointermove',   e => this._onPointerMove(e),   { passive: false });
    document.addEventListener('pointerup',     e => this._onPointerUp(e));
    document.addEventListener('pointercancel', e => this._onPointerUp(e));
  },

  _onPointerDown(e) {
    if (e.pointerType === 'mouse') return; // 마우스는 HTML5 DnD 사용
    const card = e.target.closest('[data-instance-id]');
    if (!card) return;

    e.preventDefault();
    this._draggingId = card.dataset.instanceId;

    const rect = card.getBoundingClientRect();
    this._offsetX = e.clientX - rect.left;
    this._offsetY = e.clientY - rect.top;

    // Ghost 생성
    const ghost = card.cloneNode(true);
    ghost.style.cssText = `
      position:fixed;
      top:${rect.top}px; left:${rect.left}px;
      width:${rect.width}px; height:${rect.height}px;
      opacity:0.85; pointer-events:none;
      z-index:9999; touch-action:none;
      transition:none;
    `;
    document.body.appendChild(ghost);
    this._ghostEl = ghost;

    card.classList.add('dragging');
  },

  _onPointerMove(e) {
    if (e.pointerType === 'mouse' || !this._draggingId || !this._ghostEl) return;
    e.preventDefault();

    const x = e.clientX - this._offsetX;
    const y = e.clientY - this._offsetY;
    this._ghostEl.style.left = `${x}px`;
    this._ghostEl.style.top  = `${y}px`;

    // ghost를 잠깐 숨겨서 아래 요소 감지
    this._ghostEl.style.display = 'none';
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    this._ghostEl.style.display = '';

    // 슬롯 하이라이트 갱신
    document.querySelectorAll('.slot').forEach(s => {
      s.classList.remove('drag-over-valid', 'drag-over-invalid', 'can-interact');
    });

    const slot = elemBelow?.closest('.slot');
    if (!slot) return;

    const row     = slot.dataset.row;
    const slotIdx = parseInt(slot.dataset.slot, 10);
    const existingId = GameState.board[row]?.[slotIdx];

    if (existingId && existingId !== this._draggingId) {
      // 상호작용 가능 여부 체크
      const { findInteraction } = window.__interactionUtils__ ?? {};
      const srcDef = GameState.getCardDef(this._draggingId);
      const tgtDef = GameState.getCardDef(existingId);
      if (srcDef && tgtDef) {
        // 간이 체크: can-interact 클래스만 적용 (findInteraction은 DragDrop이 import)
        slot.classList.add('can-interact');
        return;
      }
    }

    const { valid } = SlotResolver.validateDrop(this._draggingId, row, slotIdx);
    slot.classList.add(valid ? 'drag-over-valid' : 'drag-over-invalid');
  },

  _onPointerUp(e) {
    if (e.pointerType === 'mouse' || !this._draggingId) return;

    // ghost 숨기고 아래 요소 감지
    if (this._ghostEl) this._ghostEl.style.display = 'none';
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

    // 정리
    if (this._ghostEl) { this._ghostEl.remove(); this._ghostEl = null; }
    const card = document.querySelector(`[data-instance-id="${this._draggingId}"]`);
    if (card) card.classList.remove('dragging');

    document.querySelectorAll('.slot').forEach(s => {
      s.classList.remove('drag-over-valid', 'drag-over-invalid', 'can-interact');
    });

    const slot = elemBelow?.closest('.slot');
    if (slot) {
      const row     = slot.dataset.row;
      const slotIdx = parseInt(slot.dataset.slot, 10);
      const existingId = GameState.board[row]?.[slotIdx];

      if (existingId && existingId !== this._draggingId) {
        const interacted = SlotResolver.resolveInteraction(this._draggingId, existingId);
        if (!interacted) SlotResolver.executeDrop(this._draggingId, row, slotIdx);
      } else {
        SlotResolver.executeDrop(this._draggingId, row, slotIdx);
      }

      EventBus.emit('boardChanged', {});
    }

    this._draggingId = null;
  },
};

export default TouchDrag;
