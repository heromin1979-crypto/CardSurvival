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
};

export default BoardManager;
