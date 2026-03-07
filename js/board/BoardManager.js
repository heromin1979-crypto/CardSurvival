// === BOARD MANAGER ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

// Manages the logical state of the 3-row card board
const BoardManager = {
  ROWS: ['top', 'middle', 'bottom'],
  ROW_SIZES: { top: 4, middle: 8, bottom: 8 },

  init() {
    // Ensure board arrays have correct lengths
    for (const [row, size] of Object.entries(this.ROW_SIZES)) {
      while (GameState.board[row].length < size) GameState.board[row].push(null);
    }
  },

  // Add a card to a specific slot
  addCard(instanceId, row, slotIndex) {
    if (!GameState.cards[instanceId]) return false;
    if (!this.ROWS.includes(row)) return false;
    if (slotIndex < 0 || slotIndex >= this.ROW_SIZES[row]) return false;
    if (GameState.board[row][slotIndex] !== null) return false;

    GameState.board[row][slotIndex] = instanceId;
    EventBus.emit('cardPlaced', { instanceId, row, slot: slotIndex });
    return true;
  },

  // Remove a card from its current slot
  removeCard(instanceId) {
    for (const row of this.ROWS) {
      const idx = GameState.board[row].indexOf(instanceId);
      if (idx !== -1) {
        GameState.board[row][idx] = null;
        EventBus.emit('cardRemoved', { instanceId });
        return { row, slot: idx };
      }
    }
    return null;
  },

  // Move a card from one slot to another
  moveCard(instanceId, toRow, toSlot) {
    const from = this.findCard(instanceId);
    if (!from) return false;

    const target = GameState.board[toRow][toSlot];

    // If target is occupied, swap
    if (target && target !== instanceId) {
      GameState.board[from.row][from.slot] = target;
      GameState.board[toRow][toSlot]       = instanceId;
      EventBus.emit('cardMoved', { instanceId, fromRow: from.row, toRow });
      EventBus.emit('cardMoved', { instanceId: target, fromRow: toRow, toRow: from.row });
    } else {
      GameState.board[from.row][from.slot] = null;
      GameState.board[toRow][toSlot]       = instanceId;
      EventBus.emit('cardMoved', { instanceId, fromRow: from.row, toRow });
    }
    return true;
  },

  findCard(instanceId) {
    for (const row of this.ROWS) {
      const idx = GameState.board[row].indexOf(instanceId);
      if (idx !== -1) return { row, slot: idx };
    }
    return null;
  },

  getSlot(row, slotIndex) {
    return GameState.board[row]?.[slotIndex] ?? null;
  },

  isSlotEmpty(row, slotIndex) {
    return GameState.board[row]?.[slotIndex] === null;
  },

  // Get all occupied slots as array of { instanceId, row, slot }
  getAllOccupied() {
    const result = [];
    for (const row of this.ROWS) {
      GameState.board[row].forEach((id, slot) => {
        if (id) result.push({ instanceId: id, row, slot });
      });
    }
    return result;
  },

  // 보드 전체에서 같은 definitionId를 가진 stackable 카드를 모두 합산
  // primaryId를 지정하면 해당 카드 슬롯을 우선 채운다 (드롭 목적지 유지)
  consolidateSameType(definitionId, primaryId = null) {
    const gs    = GameState;
    const items = window.__GAME_DATA__?.items ?? {};
    const def   = items[definitionId];
    if (!def?.stackable) return false;

    const maxStack = def.maxStack ?? 99;

    // 보드에서 해당 타입 인스턴스 전부 수집
    const found = [];
    for (const row of this.ROWS) {
      gs.board[row].forEach((id, slot) => {
        if (!id) return;
        const inst = gs.cards[id];
        if (inst?.definitionId === definitionId) {
          found.push({ id, inst, row, slot });
        }
      });
    }

    if (found.length <= 1) return false;

    // primaryId를 맨 앞으로 이동 (드롭 목적지 슬롯 우선 채움)
    if (primaryId) {
      const idx = found.findIndex(f => f.id === primaryId);
      if (idx > 0) {
        const [primary] = found.splice(idx, 1);
        found.unshift(primary);
      }
    }

    // 전체 수량 합산 후 앞에서부터 채우고 나머지는 제거
    let total = found.reduce((sum, f) => sum + (f.inst.quantity ?? 1), 0);
    const toRemove = [];

    for (const entry of found) {
      if (total <= 0) {
        toRemove.push(entry);
      } else {
        const fill = Math.min(maxStack, total);
        entry.inst.quantity = fill;
        total -= fill;
      }
    }

    for (const entry of toRemove) {
      gs.board[entry.row][entry.slot] = null;
      delete gs.cards[entry.id];
    }

    if (toRemove.length > 0) {
      gs._updateEncumbrance();
      EventBus.emit('boardChanged', {});
    }
    return toRemove.length > 0;
  },
};

export default BoardManager;
