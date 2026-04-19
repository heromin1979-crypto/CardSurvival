// === DISMANTLE SYSTEM ===
// 카드 분해: 확률 기반으로 재료 아이템을 생성 후 보드에 배치
import EventBus    from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import I18n        from '../core/I18n.js';
import TickEngine  from '../core/TickEngine.js';
import SkillSystem  from './SkillSystem.js';
import NightSystem  from './NightSystem.js';

const DismantleSystem = {

  /**
   * instanceId 카드를 분해하여 재료를 보드에 배치.
   * @param {string} instanceId
   * @param {number} [count=1] 분해할 수량. 스택 카드면 원본 quantity 이하로 제한됨.
   *                            스택의 일부만 분해하면 원본 카드는 quantity가 차감된 채 유지.
   * @returns {{ success: boolean, gained: string[], count: number }}
   */
  dismantle(instanceId, count = 1) {
    const inst = GameState.cards[instanceId];
    if (!inst) return { success: false, gained: [], count: 0 };

    const def = GameState.getCardDef(instanceId);
    if (!def) return { success: false, gained: [], count: 0 };

    if (!def.dismantle?.length) {
      EventBus.emit('notify', { message: I18n.t('dismantle.cantDismantle', { name: I18n.itemName(def.id, def.name) }), type: 'warn' });
      return { success: false, gained: [], count: 0 };
    }

    // 수량 정규화: 1 이상, 원본 quantity 이하
    const stackQty = inst.quantity ?? 1;
    const actualCount = Math.max(1, Math.min(count | 0, stackQty));
    const willRemoveOriginal = actualCount >= stackQty;

    // ── 야간 광원 체크 ──────────────────────────────────────
    const nightCheck = NightSystem.canActAtNight('dismantle');
    if (!nightCheck.allowed) {
      EventBus.emit('notify', { message: nightCheck.reason, type: 'danger' });
      return { success: false, gained: [], count: 0 };
    }

    // 빈 슬롯 체크: 분해 결과물이 들어갈 공간이 있는지 확인
    // 원본 카드가 소진되어야만 해당 슬롯이 비는 점을 감안.
    // 매 분해 반복마다 최대 maxOutputs개 카드가 생성될 수 있지만, 같은 종류 재료는
    // placeCardInRow가 스택 병합하므로 실제 필요 슬롯은 훨씬 적다. 초과분은
    // pendingLoot로 폴백되므로 하한선만 보수적으로 요구한다.
    const maxOutputs = def.dismantle.length + (GameState.player.dismantleExtraItem ?? 0);
    const emptySlots = ['middle', 'bottom'].reduce((sum, row) =>
      sum + GameState.board[row].filter(v => v === null).length, 0);
    const availableSlots = emptySlots + (willRemoveOriginal ? 1 : 0);
    if (availableSlots < maxOutputs) {
      EventBus.emit('notify', {
        message: I18n.t('dismantle.noSpace', { need: maxOutputs, have: availableSlots }),
        type: 'warn',
      });
      return { success: false, gained: [], count: 0 };
    }

    // TP 비용 체크 (count 배)
    const tpPerUnit = def.dismantleTP ?? 0;
    const tpCost    = tpPerUnit * actualCount;
    if (tpCost > 0) {
      const remainTP = 72 - GameState.time.tpInDay;
      if (remainTP < tpCost) {
        EventBus.emit('notify', { message: I18n.t('dismantle.tpShort', { cost: tpCost, remain: remainTP }), type: 'warn' });
        return { success: false, gained: [], count: 0 };
      }
      TickEngine.skipTP(tpCost, `${def.name} 해체 ×${actualCount}`);
    }

    const gained = [];

    const harvestBonus = SkillSystem.getBonus('harvesting', 'extraMaterialChance');
    const doubleMat    = SkillSystem.hasMastery('harvesting');

    // 매 반복마다 확률·보너스 독립 판정 (각 1개는 별도 분해 시행으로 취급)
    for (let iter = 0; iter < actualCount; iter++) {
      for (const entry of def.dismantle) {
        if (Math.random() < entry.chance) {
          let qty = entry.qty;
          if (doubleMat) qty *= 2;
          else if (harvestBonus > 0 && Math.random() < harvestBonus) qty += 1;

          const newInst = GameState.createCardInstance(entry.definitionId, { quantity: qty });
          if (newInst) {
            const placed = GameState.placeCardInRow(newInst.instanceId);
            if (placed) {
              gained.push(newInst.instanceId);
            } else {
              GameState.removeCardInstanceSilent(newInst.instanceId);
              if (!GameState.pendingLoot) GameState.pendingLoot = [];
              GameState.pendingLoot.push({ definitionId: entry.definitionId, quantity: qty, contamination: 0 });
              EventBus.emit('notify', { message: I18n.t('dismantle.boardFull'), type: 'warn' });
            }
          }
        }
      }

      // dismantleExtraItem 보너스: 추가 고철 획득 (반복마다 적용)
      const extraCount = GameState.player.dismantleExtraItem ?? 0;
      for (let i = 0; i < extraCount; i++) {
        const extraInst = GameState.createCardInstance('scrap_metal', { quantity: 1 });
        if (extraInst) {
          const placed = GameState.placeCardInRow(extraInst.instanceId);
          if (placed) {
            gained.push(extraInst.instanceId);
          } else {
            GameState.removeCardInstanceSilent(extraInst.instanceId);
            if (!GameState.pendingLoot) GameState.pendingLoot = [];
            GameState.pendingLoot.push({ definitionId: 'scrap_metal', quantity: 1, contamination: 0 });
          }
        }
      }
    }

    // ── 스킬 XP 분기 (실제로 재료를 얻었을 때만) ─────────────────
    // 분해 횟수에 비례해 XP 지급 (기존 공식 × actualCount)
    if (gained.length > 0) {
      SkillSystem.gainXp('harvesting', 3 * actualCount);

      const itemTags = def.tags ?? [];
      const itemType = def.type;
      if (itemType === 'weapon' || itemTags.includes('weapon')) {
        SkillSystem.gainXp('weaponcraft', 2 * actualCount);
      } else if (itemType === 'armor' || itemTags.includes('armor')) {
        SkillSystem.gainXp('armorcraft', 2 * actualCount);
      } else if (itemType === 'structure' || itemTags.includes('structure')) {
        SkillSystem.gainXp('building', 2 * actualCount);
      } else if (itemTags.includes('medical') || itemType === 'consumable' && def.subtype === 'medical') {
        SkillSystem.gainXp('medicine', 2 * actualCount);
      } else {
        SkillSystem.gainXp('crafting', 1 * actualCount);
      }
    }

    // 원본 카드 수량 차감 또는 제거
    if (willRemoveOriginal) {
      GameState.removeCardInstance(instanceId);
    } else {
      inst.quantity = stackQty - actualCount;
    }

    const defName = def.name;
    if (gained.length > 0) {
      const names = gained
        .map(id => GameState.getCardDef(id)?.name ?? '?')
        .join(', ');
      EventBus.emit('notify', { message: I18n.t('dismantle.success', { name: I18n.itemName(def.id, defName), materials: names }), type: 'info' });
    } else {
      EventBus.emit('notify', { message: I18n.t('dismantle.noMaterial', { name: I18n.itemName(def.id, defName) }), type: 'warn' });
    }

    EventBus.emit('cardDismantled', { instanceId, definitionId: def.id, gained, count: actualCount });
    EventBus.emit('boardChanged', {});

    return { success: true, gained, count: actualCount };
  },

  /** instanceId 카드가 분해 가능한지 여부를 반환 */
  canDismantle(instanceId) {
    const def = GameState.getCardDef(instanceId);
    return !!(def?.dismantle?.length);
  },
};

export default DismantleSystem;
