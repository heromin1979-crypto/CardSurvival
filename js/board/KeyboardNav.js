// === KEYBOARD NAVIGATION ===
// 보드 카드 사이의 방향키 네비게이션.
// ArrowLeft/Right: 같은 줄 내 이동, ArrowUp/Down: 줄 간 이동.
import GameState from '../core/GameState.js';

const ROW_ORDER = ['top', 'environment', 'middle', 'bottom'];

const KeyboardNav = {
  init() {
    document.addEventListener('keydown', e => this._onKeyDown(e));
  },

  _onKeyDown(e) {
    // 모달·입력 필드 열려있으면 비활성화
    if (GameState.ui?.modalOpen) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;

    const focused = document.activeElement;
    const card    = focused?.closest('[data-instance-id]');
    if (!card) return;

    const slot = card.closest('.slot');
    if (!slot) return;

    e.preventDefault();

    const currentRow  = slot.dataset.row;
    const currentSlot = parseInt(slot.dataset.slot, 10);
    const rowIdx      = ROW_ORDER.indexOf(currentRow);

    let targetRow  = currentRow;
    let targetSlot = currentSlot;

    switch (e.key) {
      case 'ArrowRight': targetSlot = currentSlot + 1; break;
      case 'ArrowLeft':  targetSlot = currentSlot - 1; break;
      case 'ArrowDown':
        if (rowIdx < ROW_ORDER.length - 1) targetRow = ROW_ORDER[rowIdx + 1];
        break;
      case 'ArrowUp':
        if (rowIdx > 0) targetRow = ROW_ORDER[rowIdx - 1];
        break;
    }

    const targetSlotEl = document.querySelector(
      `.slot[data-row="${targetRow}"][data-slot="${targetSlot}"]`
    );
    if (!targetSlotEl) return;

    const targetCard = targetSlotEl.querySelector('[data-instance-id]');
    if (targetCard) targetCard.focus();
  },
};

export default KeyboardNav;
