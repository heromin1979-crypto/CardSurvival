// === GATHER SYSTEM ===
// 카드에서 직접 채집해 산출물을 얻는다. 규칙은 아이템 정의의 forage 필드가 들고 있어
// 다른 카드에도 같은 방식을 붙일 수 있다.
//   gather: { uses, tpCost, yields: [{ definitionId, qty, weight }] }
// 남은 횟수는 인스턴스의 _gatherUses에 기록한다 — 통발의 _baitCharges와 같은 패턴.
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import TickEngine from '../core/TickEngine.js';
import GameData  from '../data/GameData.js';
import I18n      from '../core/I18n.js';

function _gatherDef(instanceId) {
  const inst = GameState.cards?.[instanceId];
  if (!inst) return null;
  const def = GameData?.items?.[inst.definitionId];
  const rule = def?.gather;
  if (!rule || !Array.isArray(rule.yields) || rule.yields.length === 0) return null;
  return { inst, def, rule };
}

// weight 비중 추첨. 합이 0이면 첫 항목으로 떨어뜨려 무한 루프나 undefined를 막는다.
function _rollYield(yields) {
  const total = yields.reduce((sum, y) => sum + Math.max(0, y.weight ?? 0), 0);
  if (total <= 0) return yields[0];
  let roll = Math.random() * total;
  for (const y of yields) {
    roll -= Math.max(0, y.weight ?? 0);
    if (roll < 0) return y;
  }
  return yields[yields.length - 1];
}

// 산출물을 놓을 자리가 있는지. TP만 쓰고 아이템을 잃는 상황을 만들지 않기 위해 미리 본다.
function _hasRoom() {
  const gs = GameState;
  return gs.findEmptySlot('bottom') >= 0 || gs.findEmptySlot('middle') >= 0;
}

const GatherSystem = {
  /** 남은 채집 횟수 — 채집 규칙이 없으면 0 */
  remainingUses(instanceId) {
    const entry = _gatherDef(instanceId);
    if (!entry) return 0;
    const raw = entry.inst._gatherUses;
    return Number.isFinite(raw) ? Math.max(0, raw) : (entry.rule.uses ?? 0);
  },

  canGather(instanceId) {
    const entry = _gatherDef(instanceId);
    if (!entry) return { ok: false, reason: I18n.t('gather.notForageable') };
    if (this.remainingUses(instanceId) <= 0) return { ok: false, reason: I18n.t('gather.exhausted') };
    if (!_hasRoom()) return { ok: false, reason: I18n.t('gather.noRoom') };
    return { ok: true };
  },

  /**
   * 채집 실행 — TP 소모, 산출물 1종 생성, 남은 횟수 차감. 소진되면 카드를 제거한다.
   * @returns {{ ok: boolean, definitionId?: string, remaining?: number, reason?: string }}
   */
  gather(instanceId) {
    const check = this.canGather(instanceId);
    if (!check.ok) {
      EventBus.emit('notify', { message: check.reason, type: 'warn' });
      return { ok: false, reason: check.reason };
    }

    const gs = GameState;
    const { inst, def, rule } = _gatherDef(instanceId);
    const picked = _rollYield(rule.yields);

    const tpCost = Math.max(0, Math.floor(rule.tpCost ?? 0));
    if (tpCost > 0) TickEngine.skipTP(tpCost, I18n.t('gather.tickReason'));

    const qty = Math.max(1, Math.floor(picked.qty ?? 1));
    for (let i = 0; i < qty; i++) {
      const newInst = gs.createCardInstance(picked.definitionId);
      if (!newInst) break;
      const placed = gs.placeCardInRow(newInst.instanceId, 'bottom');
      if (!placed) gs.placeCardInRow(newInst.instanceId, 'middle');
    }

    const remaining = this.remainingUses(instanceId) - 1;
    inst._gatherUses = remaining;

    const pickedDef = GameData?.items?.[picked.definitionId];
    EventBus.emit('notify', {
      message: I18n.t('gather.gained', {
        item: I18n.itemName(picked.definitionId, pickedDef?.name ?? picked.definitionId),
        qty,
      }),
      type: 'good',
    });

    // 채집 횟수는 스택 1개분이다. 스택이 남았으면 낱개만 소모하고 다음 개체의 횟수를 새로 준다.
    if (remaining <= 0) {
      if (gs.consumeCardUnit(instanceId)) {
        inst._gatherUses = rule.uses ?? 0;
      } else {
        gs.removeCardInstance(instanceId);
        EventBus.emit('cardRemoved', { instanceId });
        EventBus.emit('notify', {
          message: I18n.t('gather.depleted', {
            item: I18n.itemName(def.id, def.name),
          }),
          type: 'info',
        });
      }
    }

    EventBus.emit('boardChanged', {});
    return { ok: true, definitionId: picked.definitionId, remaining: Math.max(0, remaining) };
  },
};

export default GatherSystem;
