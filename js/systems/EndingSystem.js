// === ENDING SYSTEM ===
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import TickEngine from '../core/TickEngine.js';
import ENDINGS    from '../data/endings.js';

const STORAGE_KEY = 'CARD_SURVIVAL_ENDINGS_v1';

// Victory check priority: character > escape > milestone
const VICTORY_CATEGORIES = ['character', 'escape', 'milestone'];

const EndingSystem = {
  _lastCheckDay: 0,

  init() {
    // Daily victory check (once per game-day boundary)
    EventBus.on('tpAdvance', () => {
      const gs = GameState;
      if (!gs.player.isAlive) return;
      const day = gs.time.day;
      if (day > this._lastCheckDay) {
        this._lastCheckDay = day;
        this._checkVictoryEndings(gs);
      }
    });

    // Kill tracking from combat results
    EventBus.on('combatEnd', ({ outcome }) => {
      if (outcome === 'victory') {
        const kills = GameState.combat.enemies?.length ?? 1;
        GameState.flags.totalKills = (GameState.flags.totalKills ?? 0) + kills;
      }
    });

    // Track craft completions
    EventBus.on('craftComplete', ({ blueprintId }) => {
      const bp = window.__GAME_DATA__?.blueprints?.[blueprintId];
      if (!bp) return;
      GameState.flags.totalCrafted = (GameState.flags.totalCrafted ?? 0) + 1;
      if (bp.category === 'structure') {
        GameState.flags.structuresBuilt = (GameState.flags.structuresBuilt ?? 0) + 1;
      }
      if (bp.category === 'medical') {
        GameState.flags.totalMedicalCrafted = (GameState.flags.totalMedicalCrafted ?? 0) + 1;
      }
    });
  },

  // ── Death handling ─────────────────────────────────────────────

  /**
   * Select and trigger the correct death ending based on cause + context.
   * Called by StatSystem._killPlayer() instead of transitioning to game_over.
   */
  triggerDeathEnding(cause, gs) {
    const endingId = this._selectDeathEnding(cause, gs);
    this.triggerEnding(endingId, gs);
  },

  _selectDeathEnding(cause, gs) {
    const f = gs.flags ?? {};
    switch (cause) {
      case '탈수':
        return (gs.stats.temperature.current <= 10)
          ? 'death_hypothermia'
          : 'death_dehydration';
      case '아사':
        return 'death_starvation';
      case '방사선 중독':
        return (f.nukeZoneEntered >= 3)
          ? 'death_nuclear_zone'
          : 'death_radiation';
      case '감염 쇼크':
        return 'death_infection';
      case '부상 과다':
        return ((f.lastEnemyCount ?? 0) >= 4)
          ? 'death_horde'
          : 'death_combat';
      case '절망':
        return 'death_despair';
      case '극도 피로':
        return 'death_exhaustion';
      default:
        // 질병 사망 처리
        if (cause.startsWith('질병:')) {
          const diseaseId = cause.replace('질병:', '');
          return this._selectDiseaseEnding(diseaseId, gs);
        }
        return 'death_combat';
    }
  },

  _selectDiseaseEnding(diseaseId, gs) {
    switch (diseaseId) {
      case 'cholera':
      case 'dysentery':   return 'death_disease_water';
      case 'sepsis':
      case 'influenza':   return 'death_disease_infection';
      case 'hypothermia': return 'death_hypothermia';
      case 'heatstroke':  return 'death_disease_heat';
      case 'radiation_sickness': return 'death_radiation';
      default:            return 'death_disease_infection';
    }
  },

  // ── Victory checking ───────────────────────────────────────────

  _checkVictoryEndings(gs) {
    for (const cat of VICTORY_CATEGORIES) {
      for (const ending of Object.values(ENDINGS)) {
        if (ending.category !== cat) continue;
        if (typeof ending.condition !== 'function') continue;
        let matches = false;
        try { matches = ending.condition(gs); } catch (e) {
          console.warn('[EndingSystem] condition error for', ending.id, e);
        }
        if (matches) {
          this.triggerEnding(ending.id, gs);
          return;
        }
      }
    }
  },

  // ── Trigger ────────────────────────────────────────────────────

  triggerEnding(endingId, gs) {
    const ending = ENDINGS[endingId];
    if (!ending) {
      console.warn('[EndingSystem] Unknown ending:', endingId);
      // Fallback to game_over for death, otherwise ignore
      if (gs && !gs.player.isAlive) {
        const from = gs.ui.currentState;
        gs.ui.currentState = 'game_over';
        EventBus.emit('stateTransition', { from, to: 'game_over', data: { cause: gs.player.deathCause } });
      }
      return;
    }

    // Pause tick engine
    if (gs) gs.time.isPaused = true;

    const isFirst = !this.isUnlocked(endingId);
    this.unlockEnding(endingId);

    const from = gs ? gs.ui.currentState : 'basecamp';
    if (gs) gs.ui.currentState = 'ending';

    EventBus.emit('stateTransition', {
      from,
      to: 'ending',
      data: { endingId, ending, isFirst, gs },
    });
  },

  // ── Persistence ────────────────────────────────────────────────

  getUnlocked() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  },

  unlockEnding(id) {
    const list = this.getUnlocked();
    if (!list.includes(id)) {
      list.push(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
    }
  },

  isUnlocked(id) {
    return this.getUnlocked().includes(id);
  },

  getAllWithStatus() {
    const unlocked = this.getUnlocked();
    return Object.values(ENDINGS).map(e => ({ ...e, unlocked: unlocked.includes(e.id) }));
  },
};

export default EndingSystem;
