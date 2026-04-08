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
   * @returns {{ success: boolean, gained: string[] }} 획득한 instanceId 목록
   */
  dismantle(instanceId) {
    const inst = GameState.cards[instanceId];
    if (!inst) return { success: false, gained: [] };

    const def = GameState.getCardDef(instanceId);
    if (!def) return { success: false, gained: [] };

    if (!def.dismantle?.length) {
      EventBus.emit('notify', { message: I18n.t('dismantle.cantDismantle', { name: I18n.itemName(def.id, def.name) }), type: 'warn' });
      return { success: false, gained: [] };
    }

    // ── 야간 광원 체크 ──────────────────────────────────────
    const nightCheck = NightSystem.canActAtNight('dismantle');
    if (!nightCheck.allowed) {
      EventBus.emit('notify', { message: nightCheck.reason, type: 'danger' });
      return { success: false, gained: [] };
    }

    // 빈 슬롯 체크: 분해 결과물이 들어갈 공간이 있는지 확인
    // 원본 카드가 빠지면 1슬롯 확보되므로 (최대 결과물 수 - 1)개의 빈 슬롯 필요
    const maxOutputs = def.dismantle.length + (GameState.player.dismantleExtraItem ?? 0);
    const emptySlots = ['middle', 'bottom'].reduce((sum, row) =>
      sum + GameState.board[row].filter(v => v === null).length, 0);
    // 원본 카드가 차지하는 슬롯 1개를 추가로 확보 가능
    const availableSlots = emptySlots + 1;
    if (availableSlots < maxOutputs) {
      EventBus.emit('notify', {
        message: I18n.t('dismantle.noSpace', { need: maxOutputs, have: availableSlots }),
        type: 'warn',
      });
      return { success: false, gained: [] };
    }

    // TP 비용 체크
    const tpCost = def.dismantleTP ?? 0;
    if (tpCost > 0) {
      const remainTP = 72 - GameState.time.tpInDay;
      if (remainTP < tpCost) {
        EventBus.emit('notify', { message: I18n.t('dismantle.tpShort', { cost: tpCost, remain: remainTP }), type: 'warn' });
        return { success: false, gained: [] };
      }
      TickEngine.skipTP(tpCost, `${def.name} 해체`);
    }

    const gained = [];

    const harvestBonus = SkillSystem.getBonus('harvesting', 'extraMaterialChance');
    const doubleMat    = SkillSystem.hasMastery('harvesting');

    for (const entry of def.dismantle) {
      if (Math.random() < entry.chance) {
        let qty = entry.qty;
        // 마스터리: 재료 2배
        if (doubleMat) qty *= 2;
        // 스킬 보너스: 추가 재료 확률
        else if (harvestBonus > 0 && Math.random() < harvestBonus) qty += 1;

        const newInst = GameState.createCardInstance(entry.definitionId, { quantity: qty });
        if (newInst) {
          const placed = GameState.placeCardInRow(newInst.instanceId);
          if (!placed) {
            EventBus.emit('notify', { message: I18n.t('dismantle.boardFull'), type: 'warn' });
          }
          gained.push(newInst.instanceId);
        }
      }
    }

    // 자원채취 스킬 XP (실제로 재료를 얻었을 때만)
    if (gained.length > 0) SkillSystem.gainXp('harvesting', 3);

    // dismantleExtraItem 보너스: 추가 고철 획득
    const extraCount = GameState.player.dismantleExtraItem ?? 0;
    for (let i = 0; i < extraCount; i++) {
      const extraInst = GameState.createCardInstance('scrap_metal', { quantity: 1 });
      if (extraInst) {
        GameState.placeCardInRow(extraInst.instanceId);
        gained.push(extraInst.instanceId);
      }
    }

    // 원본 카드 제거
    GameState.removeCardInstance(instanceId);

    const defName = def.name;
    if (gained.length > 0) {
      const names = gained
        .map(id => GameState.getCardDef(id)?.name ?? '?')
        .join(', ');
      EventBus.emit('notify', { message: I18n.t('dismantle.success', { name: I18n.itemName(def.id, defName), materials: names }), type: 'info' });
    } else {
      EventBus.emit('notify', { message: I18n.t('dismantle.noMaterial', { name: I18n.itemName(def.id, defName) }), type: 'warn' });
    }

    EventBus.emit('cardDismantled', { instanceId, definitionId: def.id, gained });
    EventBus.emit('boardChanged', {});

    return { success: true, gained };
  },

  /** instanceId 카드가 분해 가능한지 여부를 반환 */
  canDismantle(instanceId) {
    const def = GameState.getCardDef(instanceId);
    return !!(def?.dismantle?.length);
  },
};

export default DismantleSystem;
