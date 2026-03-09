// === DISMANTLE SYSTEM ===
// 카드 분해: 확률 기반으로 재료 아이템을 생성 후 보드에 배치
import EventBus    from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import SkillSystem from './SkillSystem.js';

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
      EventBus.emit('notify', { message: `${def.name}은(는) 분해할 수 없습니다.`, type: 'warn' });
      return { success: false, gained: [] };
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
            EventBus.emit('notify', { message: '보드 공간 부족으로 일부 재료를 배치하지 못했습니다.', type: 'warn' });
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
      EventBus.emit('notify', { message: `[분해] ${defName} → ${names}`, type: 'info' });
    } else {
      EventBus.emit('notify', { message: `[분해] ${defName} — 재료를 얻지 못했습니다.`, type: 'warn' });
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
