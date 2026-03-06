// === CONTAMINATION SYSTEM ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const ContaminationSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.onTP());
  },

  onTP() {
    const gs = GameState;
    if (!gs.player.isAlive) return;

    // Auto-purify: if water_purifier is on board, reduce contamination of adjacent water cards
    const boardCards = gs.getBoardCards();
    const hasPurifier = boardCards.some(c => c.definitionId === 'water_purifier');

    if (hasPurifier) {
      for (const card of boardCards) {
        if (card.contamination > 0) {
          const def = gs.getCardDef(card.instanceId);
          if (def?.tags?.includes('drinkable')) {
            card.contamination = Math.max(0, card.contamination - 20);
            if (card.contamination === 0) {
              EventBus.emit('notify', { message: `${def.name} 정수 완료.`, type: 'good' });
            }
          }
        }
      }
    }

    // Radiation passive decay (only via medical or time, very slow)
    const rad = gs.stats.radiation.current;
    if (rad > 0) {
      // Radiation decays very slowly on its own (0.1/TP)
      gs.modStat('radiation', -0.1);
    }
  },

  // Get contamination level of a card (0-100)
  getContamination(instanceId) {
    return GameState.cards[instanceId]?.contamination ?? 0;
  },

  // Contaminate a card
  contaminateCard(instanceId, amount) {
    const card = GameState.cards[instanceId];
    if (!card) return;
    card.contamination = Math.min(100, (card.contamination ?? 0) + amount);
  },

  // Purify a card instantly (e.g., via filter)
  purifyCard(instanceId) {
    const card = GameState.cards[instanceId];
    if (!card) return;
    card.contamination = 0;
    const def = GameState.getCardDef(instanceId);
    EventBus.emit('notify', { message: `${def?.name ?? '아이템'} 정수됨.`, type: 'good' });
  },
};

export default ContaminationSystem;
