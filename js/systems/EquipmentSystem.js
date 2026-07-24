// === EQUIPMENT SYSTEM ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import { lookupBagExtraSlots } from '../data/bagSlots.js';
import { weaponSlotForDefinition } from './WeaponSlotPolicy.js';

const BOTTOM_PAGE1_SIZE = 20;

// 슬롯별 장착 규칙 테이블
const SLOT_RULES = {
  head:        { type: 'armor',  subtypes: ['head'] },
  body:        { type: 'armor',  subtypes: ['vest', 'fullbody', 'clothing', 'body'] },
  hands:       { type: 'armor',  subtypes: ['hands'] },
  face:        { type: 'tool',   subtypes: ['protection'], requiresOnWear: true },
  weapon_main: { predicate: def => weaponSlotForDefinition(def) === 'weapon_main' },
  weapon_sub:  { predicate: def => weaponSlotForDefinition(def) === 'weapon_sub' },
  backpack:    { type: 'tool',   subtypes: ['bag'] },
  boots:       { type: 'armor',  subtypes: ['boots'] },
  belt:        { locked: true },
  accessory:   { type: 'armor',  subtypes: ['accessory'] },
};

function ruleAcceptsDefinition(rule, def) {
  if (typeof rule.predicate === 'function') return rule.predicate(def);
  if (rule.accepts) {
    return rule.accepts.some(a => a.type === def.type && a.subtypes.includes(def.subtype));
  }
  return def.type === rule.type && rule.subtypes.includes(def.subtype);
}

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

    if (!ruleAcceptsDefinition(rule, def)) {
      if (!rule.predicate && !rule.accepts && def.type !== rule.type) {
        return { ok: false, reason: I18n.t('equipSys.typeReq', { type: rule.type }) };
      }
      return { ok: false, reason: I18n.t('equipSys.wrongSlot') };
    }

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

    // 가방 해제 사전 검사 (B-1): page1 빈칸이 [가방 본체 1칸 + page2 카드 수]를 수용 가능해야 함
    if (slotId === 'backpack') {
      const extra = gs.player.extraSlots ?? 0;
      if (extra > 0) {
        const page1Free = gs.board.bottom.slice(0, BOTTOM_PAGE1_SIZE)
          .filter(v => v === null).length;
        const page2Cards = gs.board.bottom.slice(BOTTOM_PAGE1_SIZE, BOTTOM_PAGE1_SIZE + extra)
          .filter(v => v !== null).length;
        if (page1Free < page2Cards + 1) {
          EventBus.emit('notify', { message: I18n.t('equipSys.bagRemoveBlocked'), type: 'warn' });
          return false;
        }
      }
    }

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
        if (!ruleAcceptsDefinition(rule, def)) return false;
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
    const gs    = GameState;
    const def   = gs.getCardDef(instanceId);
    if (!def) return;
    const extra = lookupBagExtraSlots(def);
    const oldExtra = gs.player.extraSlots ?? 0;
    gs.player.extraSlots = extra;
    // bottom 배열을 page1(20) + page2(extra) 길이로 맞춤
    const targetLen = BOTTOM_PAGE1_SIZE + extra;
    if (gs.board.bottom.length < targetLen) {
      while (gs.board.bottom.length < targetLen) gs.board.bottom.push(null);
    } else if (gs.board.bottom.length > targetLen) {
      // 가방 교체로 page2 축소: 잘려나갈 카드는 page1 빈자리로 회수
      const trimmed = gs.board.bottom.slice(targetLen).filter(v => v !== null);
      gs.board.bottom = gs.board.bottom.slice(0, targetLen);
      for (const id of trimmed) {
        const idx = gs.findEmptySlot('bottom');
        if (idx !== -1) gs.board.bottom[idx] = id;
        else if (gs.cards[id]) {
          gs.pendingLoot = [...(gs.pendingLoot ?? []), {
            definitionId: gs.cards[id].definitionId,
            quantity:     gs.cards[id].quantity ?? 1,
            contamination: gs.cards[id].contamination ?? 0,
          }];
        }
      }
    }
    if (oldExtra > 0 && extra === 0) gs.ui.bottomPage = 0;
    EventBus.emit('boardReinit', {});
  },

  // B-1: page2 카드를 page1 빈칸이 충분하면 자동 이주, 부족하면 토스트로 차단
  // 반환값: { ok: boolean }
  _removeBagEffect() {
    const gs = GameState;
    const extra = gs.player.extraSlots ?? 0;
    if (extra === 0) {
      // page2 자체가 없음 — 그대로 진행
      gs.ui.bottomPage = 0;
      EventBus.emit('boardReinit', {});
      return { ok: true };
    }
    const page1 = gs.board.bottom.slice(0, BOTTOM_PAGE1_SIZE);
    const page2 = gs.board.bottom.slice(BOTTOM_PAGE1_SIZE, BOTTOM_PAGE1_SIZE + extra);
    const page2Cards = page2.filter(v => v !== null);
    const page1Free  = page1.filter(v => v === null).length;

    if (page2Cards.length === 0) {
      gs.board.bottom = page1;
      gs.player.extraSlots = 0;
      gs.ui.bottomPage = 0;
      EventBus.emit('boardReinit', {});
      return { ok: true };
    }

    if (page1Free < page2Cards.length) {
      EventBus.emit('notify', { message: I18n.t('equipSys.bagRemoveBlocked'), type: 'warn' });
      return { ok: false };
    }

    // 자동 이주 — page2 카드를 page1 빈자리에 순서대로 배치
    const newPage1 = [...page1];
    for (const id of page2Cards) {
      const idx = newPage1.indexOf(null);
      if (idx === -1) break; // 위 검사로 도달 불가
      newPage1[idx] = id;
    }
    gs.board.bottom = newPage1;
    gs.player.extraSlots = 0;
    gs.ui.bottomPage = 0;
    EventBus.emit('notify', { message: I18n.t('equipSys.bagRemoveMigrated'), type: 'good' });
    EventBus.emit('boardReinit', {});
    return { ok: true };
  },

  getSlotRules() { return SLOT_RULES; },
};

export default EquipmentSystem;
