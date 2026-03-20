// === EQUIPMENT SYSTEM ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';

// 슬롯별 장착 규칙 테이블
const SLOT_RULES = {
  head:        { type: 'armor',  subtypes: ['head'] },
  body:        { type: 'armor',  subtypes: ['vest', 'fullbody', 'clothing'] },
  hands:       { type: 'armor',  subtypes: ['hands'] },
  offhand:     { type: 'armor',  subtypes: ['offhand'] },
  face:        { type: 'tool',   subtypes: ['protection'], requiresOnWear: true },
  weapon_main: { type: 'weapon', subtypes: ['melee', 'firearm', 'ranged'] },
  weapon_sub:  { type: 'weapon', subtypes: ['melee', 'firearm', 'ranged', 'throwable'] },
  backpack:    { type: 'tool',   subtypes: ['bag'] },
  boots:       { type: 'armor',  subtypes: ['boots'] },
  belt:        { locked: true },
  accessory:   { locked: true },
};

// 가방 아이템 → 추가 슬롯 수 매핑
const BAG_EXTRA_SLOTS = {
  small_bag:    3,
  backpack:     5,
  military_bag: 7,
  messenger_bag:4,
  duffel_bag:   6,
};

const EquipmentSystem = {
  /**
   * 아이템을 슬롯에 장착 가능한지 검사
   * @returns {{ ok: boolean, reason?: string }}
   */
  canEquip(instanceId, slotId) {
    const rule = SLOT_RULES[slotId];
    if (!rule)          return { ok: false, reason: I18n.t('equipSys.unknownSlot') };
    if (rule.locked)    return { ok: false, reason: I18n.t('equipSys.lockedSlot') };

    const inst = GameState.cards[instanceId];
    if (!inst) return { ok: false, reason: I18n.t('equipSys.noCard') };

    const def = GameState.getCardDef(instanceId);
    if (!def)  return { ok: false, reason: I18n.t('equipSys.noItemDef') };

    if (def.type !== rule.type)
      return { ok: false, reason: I18n.t('equipSys.typeReq', { type: rule.type }) };

    if (!rule.subtypes.includes(def.subtype))
      return { ok: false, reason: I18n.t('equipSys.wrongSlot') };

    if (rule.requiresOnWear && !def.onWear)
      return { ok: false, reason: I18n.t('equipSys.noWearEffect') };

    return { ok: true };
  },

  /**
   * 아이템을 슬롯에 장착. 기존 장착품은 보드로 반환.
   */
  equip(instanceId, slotId) {
    const check = this.canEquip(instanceId, slotId);
    if (!check.ok) {
      EventBus.emit('notify', { message: I18n.t('equipSys.cantEquip', { reason: check.reason }), type: 'warn' });
      return false;
    }

    const gs = GameState;

    // 기존 장착품 교체: 보드로 반환
    const existing = gs.player.equipped[slotId];
    if (existing && gs.cards[existing]) {
      const placed = gs.placeCardInRow(existing);
      if (!placed) {
        EventBus.emit('notify', { message: I18n.t('equipSys.boardFullSwap'), type: 'warn' });
        return false;
      }
    }

    // 보드에서 해당 카드 제거 (cards 딕셔너리는 유지)
    for (const row of ['top', 'middle', 'bottom']) {
      gs.board[row] = gs.board[row].map(v => v === instanceId ? null : v);
    }

    // 슬롯에 장착
    gs.player.equipped[slotId] = instanceId;

    // 가방 장착 시 인벤토리 확장
    if (slotId === 'backpack') {
      this._applyBagEffect(instanceId);
    }

    EventBus.emit('equipChanged', { slotId, instanceId });
    EventBus.emit('boardChanged', {});
    return true;
  },

  /**
   * 슬롯의 아이템을 해제하여 보드로 반환
   */
  unequip(slotId) {
    const gs = GameState;
    const instanceId = gs.player.equipped[slotId];
    if (!instanceId) return false;

    if (gs.cards[instanceId]) {
      const placed = gs.placeCardInRow(instanceId);
      if (!placed) {
        EventBus.emit('notify', { message: I18n.t('equipSys.boardFullUnequip'), type: 'warn' });
        return false;
      }
    }

    gs.player.equipped[slotId] = null;

    // 가방 해제 시 인벤토리 축소
    if (slotId === 'backpack') {
      this._removeBagEffect();
    }

    EventBus.emit('equipChanged', { slotId, instanceId: null });
    EventBus.emit('boardChanged', {});
    return true;
  },

  /**
   * 아이템 정의가 들어갈 수 있는 슬롯 ID 배열 반환
   */
  getSlotsForDef(def) {
    if (!def) return [];
    return Object.entries(SLOT_RULES)
      .filter(([, rule]) => {
        if (rule.locked) return false;
        if (def.type !== rule.type) return false;
        if (!rule.subtypes.includes(def.subtype)) return false;
        if (rule.requiresOnWear && !def.onWear) return false;
        return true;
      })
      .map(([slotId]) => slotId);
  },

  /**
   * 보드 위 장착 가능한 카드 목록 반환
   */
  getEquippableBoardItems() {
    return GameState.getBoardCards().filter(c => {
      const def = GameState.getCardDef(c.instanceId);
      return def && this.getSlotsForDef(def).length > 0;
    });
  },

  // ── 가방 효과 ─────────────────────────────────────────

  _applyBagEffect(instanceId) {
    const gs  = GameState;
    const def = gs.getCardDef(instanceId);
    if (!def) return;
    const extra = BAG_EXTRA_SLOTS[def.id] ?? def.bagSlots ?? 0;
    gs.player.extraSlots = extra;

    // bottom 행 확장
    const target = 8 + extra;
    while (gs.board.bottom.length < target) gs.board.bottom.push(null);
    EventBus.emit('boardReinit', {});
  },

  _removeBagEffect() {
    const gs = GameState;
    const extra = gs.player.extraSlots ?? 0;
    if (extra > 0) {
      // 추가된 슬롯에서 아이템 제거 경고
      const base = 8;
      for (let i = base; i < gs.board.bottom.length; i++) {
        const id = gs.board.bottom[i];
        if (id) {
          EventBus.emit('notify', {
            message: I18n.t('equipSys.bagRemoveWarn'),
            type: 'warn',
          });
          break;
        }
      }
      gs.board.bottom = gs.board.bottom.slice(0, base);
    }
    gs.player.extraSlots = 0;
    EventBus.emit('boardReinit', {});
  },

  getSlotRules() { return SLOT_RULES; },
};

export default EquipmentSystem;
