// === ENCUMBRANCE SYSTEM ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const EncumbranceSystem = {
  init() {
    // Recompute on any card change
    EventBus.on('cardPlaced',  () => GameState._updateEncumbrance());
    EventBus.on('cardRemoved', () => GameState._updateEncumbrance());
    EventBus.on('cardMoved',   () => GameState._updateEncumbrance());
  },

  // Returns TP cost multiplier based on current encumbrance tier
  getTpMult() {
    return GameState.player.encumbrance.tpMult;
  },

  // Applied cost (base TP × encumbrance multiplier)
  applyCost(baseCost) {
    return Math.ceil(baseCost * this.getTpMult());
  },

  getTierLabel() {
    const tiers = ['여유', '약간 무거움', '무거움', '과부하'];
    return tiers[GameState.player.encumbrance.tier] ?? '여유';
  },
};

export default EncumbranceSystem;
