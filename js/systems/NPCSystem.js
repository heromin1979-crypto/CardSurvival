// === NPC SYSTEM ===
// Manages NPC lifecycle: spawning, trust, dialogue, companion bonuses, trade.
// NPCs appear as non-draggable cards on the middle row.
// MentalSystem reads GameState.companions for loneliness reduction.

import EventBus                from '../core/EventBus.js';
import GameState               from '../core/GameState.js';
import I18n                    from '../core/I18n.js';
import SecretCombinationSystem from './SecretCombinationSystem.js';
import NPCS, { NPC_ITEMS }    from '../data/npcs.js';

// ── NPC → Secret Combination Hint Mapping ─────────────────────
// When trust reaches the threshold, the NPC reveals hints about specific combos.
const NPC_HINT_MAP = {
  npc_old_survivor:     { trust: 2, hints: ['sc_fishing_rod', 'sc_torch'] },
  npc_nurse:            { trust: 1, hints: ['sc_herbal_medicine', 'sc_painkiller_mix'] },
  npc_mechanic:         { trust: 2, hints: ['sc_reinforced_shield', 'sc_thorn_wire'] },
  npc_student:          { trust: 1, hints: ['sc_journal', 'sc_radio_signal'] },
  npc_trader:           { trust: 3, hints: ['sc_molotov', 'sc_smoke_bomb'] },
  npc_soldier_deserter: { trust: 2, hints: ['sc_poison_blade', 'sc_fire_arrow'] },
};

const NPCSystem = {

  init() {
    // Register NPC item definitions so CardFactory can render them
    this._registerNPCItems();

    // Listen for TP advance to check spawns & apply companion effects
    EventBus.on('tpAdvance', () => this._onTP());

    // Listen for location changes to spawn NPCs
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'basecamp') this._checkSpawns();
    });

    // Listen for board changes to re-render NPC cards
    EventBus.on('boardChanged', () => this._syncNPCCards());

    // Track combat events for departure condition (b) — excessive combat
    EventBus.on('combatEnd', () => this._onCombatEnd());
  },

  // ── Register NPC items in global item registry ─────────────────

  _registerNPCItems() {
    const items = window.__GAME_DATA__?.items;
    if (!items) return;
    for (const [id, def] of Object.entries(NPC_ITEMS)) {
      if (!items[id]) {
        items[id] = { ...def };
      }
    }
  },

  // ── Ensure GameState.npcs + companions initialized ─────────────

  ensureInitialized() {
    if (!GameState.npcs) {
      GameState.npcs = {
        // { [npcId]: { spawned, dismissed, trust, isCompanion, cardInstanceId, hp } }
        states: {},
      };
    }
    if (!GameState.companions) {
      GameState.companions = []; // [npcId, ...]
    }
    // Ensure hp field exists on all NPC states (save compat)
    for (const [npcId, state] of Object.entries(GameState.npcs.states)) {
      if (state.hp === undefined) {
        state.hp = NPCS[npcId]?.maxHp ?? 50;
      }
    }
  },

  // ── TP Callback ────────────────────────────────────────────────

  _onTP() {
    this.ensureInitialized();
    this._checkSpawns();
    this._applyCompanionEffects();
    this._checkCompanionDeparture();
  },

  // ── Spawn Logic ────────────────────────────────────────────────

  _checkSpawns() {
    this.ensureInitialized();
    const day      = GameState.time.day;
    const district = GameState.location.currentDistrict;

    for (const [npcId, npcDef] of Object.entries(NPCS)) {
      const state = GameState.npcs.states[npcId];

      // Already spawned or dismissed — skip
      if (state?.spawned || state?.dismissed) continue;

      // Check spawn conditions
      if (day >= npcDef.spawnDay && district === npcDef.spawnDistrict) {
        this._spawnNPC(npcId, npcDef);
      }
    }
  },

  _spawnNPC(npcId, npcDef) {
    // Create card instance
    const inst = GameState.createCardInstance(npcId);
    if (!inst) return;

    // Place on middle row
    const placed = GameState.placeCardInRow(inst.instanceId, 'middle');
    if (!placed) {
      GameState.removeCardInstance(inst.instanceId);
      return;
    }

    // Initialize NPC state
    GameState.npcs.states[npcId] = {
      spawned:        true,
      dismissed:      false,
      trust:          0,
      isCompanion:    false,
      cardInstanceId: inst.instanceId,
      hp:             npcDef.maxHp ?? 50,
    };

    EventBus.emit('notify', {
      message: I18n.t('npc.spawned', { name: I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) }),
      type: 'info',
    });
    EventBus.emit('npcSpawned', { npcId });
    EventBus.emit('boardChanged', {});
  },

  // ── Sync NPC cards when entering district ──────────────────────

  _syncNPCCards() {
    this.ensureInitialized();
    // Ensure NPC cards are on the board if the player is in the same district
    // or if the NPC is a companion
    const district = GameState.location.currentDistrict;

    for (const [npcId, state] of Object.entries(GameState.npcs.states)) {
      if (!state.spawned || state.dismissed) continue;
      const npcDef = NPCS[npcId];
      if (!npcDef) continue;

      const isHere = state.isCompanion || npcDef.spawnDistrict === district;
      const cardExists = state.cardInstanceId && GameState.cards[state.cardInstanceId];

      if (isHere && !cardExists) {
        // Re-create card on the board
        const inst = GameState.createCardInstance(npcId);
        if (inst) {
          const placed = GameState.placeCardInRow(inst.instanceId, 'middle');
          if (placed) {
            state.cardInstanceId = inst.instanceId;
          } else {
            GameState.removeCardInstance(inst.instanceId);
          }
        }
      } else if (!isHere && cardExists && !state.isCompanion) {
        // Remove card when player leaves district (non-companions)
        GameState.removeCardInstance(state.cardInstanceId);
        state.cardInstanceId = null;
      }
    }
  },

  // ── Companion Effects (per TP) ─────────────────────────────────

  _applyCompanionEffects() {
    const companions = GameState.companions;
    if (!companions || companions.length === 0) return;

    for (const npcId of companions) {
      const npcDef = NPCS[npcId];
      if (!npcDef?.companion) continue;
      const comp = npcDef.companion;

      // Food cost (nutrition drain)
      if (comp.foodCostPerDay > 0) {
        GameState.modStat('nutrition', -comp.foodCostPerDay);
      }

      // Morale bonus
      if (comp.moralBonus > 0) {
        GameState.modStat('morale', comp.moralBonus);
      }

      // Noise addition
      if (comp.noiseAdd > 0 && GameState.noise) {
        GameState.noise.level = Math.min(100, GameState.noise.level + comp.noiseAdd * 0.1);
      }
    }
  },

  // ── Companion Departure Logic ──────────────────────────────────
  // Checks each TP whether any companion should leave or die.
  // Like a pressure cooker — stress builds until the lid blows off.

  /** Ensure departure tracking counters exist for an NPC */
  _ensureDepartureCounters(npcId) {
    const state = GameState.npcs.states[npcId];
    if (!state) return null;
    if (!state.departureCounters) {
      state.departureCounters = {
        lowNutritionTP: 0,
        recentCombatCount: 0,
        lastCombatTP: 0,
        lowMoraleTP: 0,
      };
    }
    return state.departureCounters;
  },

  /** Called on every combatEnd — records combat timestamp for companions */
  _onCombatEnd() {
    this.ensureInitialized();
    const totalTP = GameState.time.totalTP;
    for (const npcId of (GameState.companions ?? [])) {
      const counters = this._ensureDepartureCounters(npcId);
      if (!counters) continue;
      // If this combat is within 36 TP of last, increment streak
      if (totalTP - counters.lastCombatTP <= 36) {
        counters.recentCombatCount += 1;
      } else {
        counters.recentCombatCount = 1;
      }
      counters.lastCombatTP = totalTP;
    }
  },

  /** Main departure check — called each TP for all companions */
  _checkCompanionDeparture() {
    const gs         = GameState;
    const companions = gs.companions ?? [];
    if (companions.length === 0) return;

    const nutrition = gs.stats?.nutrition?.current ?? 100;
    const morale    = gs.stats?.morale?.current ?? 100;

    // Iterate over a copy — companions may be removed during iteration
    for (const npcId of [...companions]) {
      const npcDef   = NPCS[npcId];
      const state    = gs.npcs.states[npcId];
      if (!npcDef || !state) continue;

      const counters = this._ensureDepartureCounters(npcId);
      const name     = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);

      // (d) NPC death — HP <= 0 (if HP tracking exists)
      if (state.hp !== undefined && state.hp <= 0) {
        EventBus.emit('notify', { message: I18n.t('npc.died', { name }), type: 'danger' });
        // Trauma +15 on player
        if (gs.mental) {
          gs.mental.trauma = Math.min(100, (gs.mental.trauma ?? 0) + 15);
        }
        this._removeCompanion(npcId, /* isDeath */ true);
        continue;
      }

      // (a) Low nutrition: <= 5 for 144 consecutive TP (2 days)
      if (nutrition <= 5) {
        counters.lowNutritionTP += 1;
      } else {
        counters.lowNutritionTP = 0;
      }
      if (counters.lowNutritionTP >= 144) {
        EventBus.emit('notify', { message: I18n.t('npc.departHunger', { name }), type: 'warn' });
        this._removeCompanion(npcId, false);
        continue;
      }

      // (b) Excessive combat: 3+ combats within 36 TP — timid/cautious leave
      const personality = npcDef.personality ?? 'neutral';
      if (counters.recentCombatCount >= 3 &&
          (personality === 'timid' || personality === 'cautious')) {
        EventBus.emit('notify', { message: I18n.t('npc.departDanger', { name }), type: 'warn' });
        this._removeCompanion(npcId, false);
        continue;
      }

      // (c) Low morale: <= 10 for 72 consecutive TP (1 day) — all except loyal leave
      if (morale <= 10) {
        counters.lowMoraleTP += 1;
      } else {
        counters.lowMoraleTP = 0;
      }
      if (counters.lowMoraleTP >= 72 && personality !== 'loyal') {
        EventBus.emit('notify', { message: I18n.t('npc.departMorale', { name }), type: 'warn' });
        this._removeCompanion(npcId, false);
        continue;
      }
    }
  },

  /** Remove a companion — shared logic for departure and death */
  _removeCompanion(npcId, isDeath) {
    const gs    = GameState;
    const state = gs.npcs.states[npcId];
    if (!state) return;

    const name = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);

    // Revert carry bonus
    const comp = NPCS[npcId]?.companion;
    if (comp?.carryBonus > 0) {
      gs.player.encumbrance.max = Math.max(10, gs.player.encumbrance.max - comp.carryBonus);
    }

    // Remove from companions array (immutable)
    gs.companions = (gs.companions ?? []).filter(id => id !== npcId);

    // Update NPC state
    state.isCompanion = false;
    state.dismissed   = true;

    // Remove NPC card from board
    if (state.cardInstanceId && gs.cards[state.cardInstanceId]) {
      gs.removeCardInstance(state.cardInstanceId);
      state.cardInstanceId = null;
    }

    // Increase loneliness +10 on MentalSystem
    if (gs.mental) {
      gs.mental.loneliness = Math.min(100, (gs.mental.loneliness ?? 0) + 10);
    }

    // Notification — departed vs died
    if (!isDeath) {
      EventBus.emit('notify', { message: I18n.t('npc.departed', { name }), type: 'info' });
    }

    EventBus.emit('npcDismissed', { npcId, reason: isDeath ? 'death' : 'departure' });
    EventBus.emit('boardChanged', {});
  },

  // ── Public API: Companion Damage ───────────────────────────────

  damageCompanion(npcId, damage) {
    this.ensureInitialized();
    const state = GameState.npcs.states[npcId];
    if (!state || !state.isCompanion) return;

    state.hp = Math.max(0, (state.hp ?? 50) - damage);

    const name = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);
    EventBus.emit('notify', {
      message: I18n.t('npc.hitInstead', { name, dmg: damage }),
      type: 'warn',
    });

    if (state.hp <= 0) {
      // Permanent death
      EventBus.emit('notify', { message: I18n.t('npc.died', { name }), type: 'danger' });
      if (GameState.mental) {
        GameState.mental.trauma = Math.min(100, (GameState.mental.trauma ?? 0) + 15);
      }
      this._removeCompanion(npcId, /* isDeath */ true);
    }

    EventBus.emit('boardChanged', {});
  },

  // ── Public API: Dialogue ───────────────────────────────────────

  /** Get dialogue text for NPC based on current trust */
  getDialogue(npcId, type = 'greet') {
    this.ensureInitialized();
    const npcDef = NPCS[npcId];
    if (!npcDef) return '';

    const state = GameState.npcs.states[npcId];
    const trust = state?.trust ?? 0;

    const lines = npcDef.dialogues[type];
    if (!lines) return '';

    // If it's a single string (like reject), just return it
    if (typeof lines === 'string') return I18n.t(lines);

    // Otherwise pick by trust tier: [0-1] -> 0, [2-3] -> 1, [4-5] -> 2
    const tierIdx = Math.min(Math.floor(trust / 2), lines.length - 1);
    return I18n.t(lines[tierIdx]);
  },

  /** Talk to NPC — increases trust */
  talkTo(npcId) {
    this.ensureInitialized();
    const npcDef = NPCS[npcId];
    if (!npcDef) return;

    const state = GameState.npcs.states[npcId];
    if (!state || !state.spawned) return;

    const oldTrust = state.trust;
    state.trust = Math.min(5, state.trust + npcDef.trustGainPerTalk);

    EventBus.emit('npcTrustChanged', { npcId, oldTrust, newTrust: state.trust });

    // Check for secret combination hints at new trust level
    this._checkHintGifts(npcId, oldTrust, state.trust);

    // Check for gift at new trust level
    this._checkGifts(npcId, oldTrust, state.trust);
  },

  _checkGifts(npcId, oldTrust, newTrust) {
    const npcDef = NPCS[npcId];
    if (!npcDef?.gifts) return;

    for (const gift of npcDef.gifts) {
      if (oldTrust < gift.trust && newTrust >= gift.trust) {
        // Give the gift item
        const inst = GameState.createCardInstance(gift.itemId, { quantity: gift.qty });
        if (inst) {
          const placed = GameState.placeCardInRow(inst.instanceId, 'middle');
          if (!placed) {
            GameState.removeCardInstance(inst.instanceId);
          } else {
            const itemDef = window.__GAME_DATA__.items[gift.itemId];
            EventBus.emit('notify', {
              message: I18n.t('npc.gift', {
                npc: I18n.itemName(npcId, NPC_ITEMS[npcId]?.name),
                item: I18n.itemName(gift.itemId, itemDef?.name),
                qty: gift.qty,
              }),
              type: 'good',
            });
            EventBus.emit('boardChanged', {});
          }
        }
      }
    }
  },

  // ── Hint Gifts (secret combo hints from NPCs) ─────────────────

  _checkHintGifts(npcId, oldTrust, newTrust) {
    const entry = NPC_HINT_MAP[npcId];
    if (!entry) return;
    // Only fire once: when trust crosses the threshold
    if (oldTrust >= entry.trust || newTrust < entry.trust) return;

    const npcName = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);
    entry.hints.forEach(comboId => SecretCombinationSystem.unlockHint(comboId));
    EventBus.emit('notify', {
      message: I18n.t('hint.fromNPC', { name: npcName }),
      type: 'info',
    });
  },

  // ── Public API: Recruit / Dismiss Companion ────────────────────

  canRecruit(npcId) {
    this.ensureInitialized();
    const npcDef = NPCS[npcId];
    if (!npcDef?.companion?.canRecruit) return false;

    const state = GameState.npcs.states[npcId];
    if (!state || state.isCompanion) return false;

    return state.trust >= npcDef.companion.recruitTrust;
  },

  recruit(npcId) {
    if (!this.canRecruit(npcId)) return false;
    this.ensureInitialized();

    const state = GameState.npcs.states[npcId];
    state.isCompanion = true;

    // Add to companions array
    if (!GameState.companions.includes(npcId)) {
      GameState.companions = [...GameState.companions, npcId];
    }

    // Apply carry bonus
    const comp = NPCS[npcId]?.companion;
    if (comp?.carryBonus > 0) {
      GameState.player.encumbrance.max += comp.carryBonus;
    }

    EventBus.emit('notify', {
      message: I18n.t('npc.recruited', { name: I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) }),
      type: 'good',
    });
    EventBus.emit('npcRecruited', { npcId });
    EventBus.emit('boardChanged', {});
    return true;
  },

  dismiss(npcId) {
    this.ensureInitialized();
    const state = GameState.npcs.states[npcId];
    if (!state || !state.isCompanion) return false;

    state.isCompanion = false;
    GameState.companions = GameState.companions.filter(id => id !== npcId);

    // Remove carry bonus
    const comp = NPCS[npcId]?.companion;
    if (comp?.carryBonus > 0) {
      GameState.player.encumbrance.max = Math.max(10, GameState.player.encumbrance.max - comp.carryBonus);
    }

    // Remove NPC card from board if not in spawn district
    if (GameState.location.currentDistrict !== NPCS[npcId]?.spawnDistrict) {
      if (state.cardInstanceId && GameState.cards[state.cardInstanceId]) {
        GameState.removeCardInstance(state.cardInstanceId);
        state.cardInstanceId = null;
      }
    }

    EventBus.emit('notify', {
      message: I18n.t('npc.dismissed', { name: I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) }),
      type: 'info',
    });
    EventBus.emit('npcDismissed', { npcId });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // ── Public API: Trade ──────────────────────────────────────────

  getAvailableTrades(npcId) {
    this.ensureInitialized();
    const npcDef = NPCS[npcId];
    if (!npcDef?.trades) return [];

    const state = GameState.npcs.states[npcId];
    const trust = state?.trust ?? 0;

    return npcDef.trades.filter(t => trust >= t.trustRequired);
  },

  /** Execute a trade by index */
  executeTrade(npcId, tradeIndex) {
    const trades = this.getAvailableTrades(npcId);
    if (tradeIndex < 0 || tradeIndex >= trades.length) return false;

    const trade = trades[tradeIndex];
    const giveCount = GameState.countOnBoard(trade.give.id);
    if (giveCount < trade.give.qty) return false;

    // Remove given items
    let remaining = trade.give.qty;
    const boardCards = GameState.getBoardCards();
    for (const card of boardCards) {
      if (remaining <= 0) break;
      if (card.definitionId !== trade.give.id) continue;

      const qty = card.quantity ?? 1;
      if (qty <= remaining) {
        remaining -= qty;
        GameState.removeCardInstance(card.instanceId);
      } else {
        card.quantity = qty - remaining;
        remaining = 0;
      }
    }

    // Give received items
    const inst = GameState.createCardInstance(trade.receive.id, { quantity: trade.receive.qty });
    if (inst) {
      const placed = GameState.placeCardInRow(inst.instanceId, 'middle');
      if (!placed) {
        GameState.removeCardInstance(inst.instanceId);
        return false;
      }
    }

    const giveItemDef = window.__GAME_DATA__.items[trade.give.id];
    const receiveItemDef = window.__GAME_DATA__.items[trade.receive.id];
    EventBus.emit('notify', {
      message: I18n.t('npc.tradeComplete', {
        gave: I18n.itemName(trade.give.id, giveItemDef?.name),
        gaveQty: trade.give.qty,
        got: I18n.itemName(trade.receive.id, receiveItemDef?.name),
        gotQty: trade.receive.qty,
      }),
      type: 'good',
    });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // ── Public API: Companion Bonuses Query ────────────────────────

  /** Get total companion combat damage multiplier */
  getCompanionCombatBonus() {
    this.ensureInitialized();
    let bonus = 0;
    for (const npcId of (GameState.companions ?? [])) {
      const comp = NPCS[npcId]?.companion;
      if (comp?.combatDmg > 0) bonus += comp.combatDmg - 1.0;
    }
    return 1.0 + bonus;
  },

  /** Get total companion heal bonus */
  getCompanionHealBonus() {
    this.ensureInitialized();
    let bonus = 0;
    for (const npcId of (GameState.companions ?? [])) {
      const comp = NPCS[npcId]?.companion;
      if (comp?.healBonus > 0) bonus += comp.healBonus - 1.0;
    }
    return 1.0 + bonus;
  },

  /** Get total companion craft bonus */
  getCompanionCraftBonus() {
    this.ensureInitialized();
    let bonus = 0;
    for (const npcId of (GameState.companions ?? [])) {
      const comp = NPCS[npcId]?.companion;
      if (comp?.craftBonus > 0) bonus += comp.craftBonus - 1.0;
    }
    return 1.0 + bonus;
  },

  /** Get NPC def by id */
  getNPCDef(npcId) {
    return NPCS[npcId] ?? null;
  },

  /** Get NPC state by id */
  getNPCState(npcId) {
    this.ensureInitialized();
    return GameState.npcs?.states?.[npcId] ?? null;
  },

  /** Get all spawned NPCs in current district or companions */
  getVisibleNPCs() {
    this.ensureInitialized();
    const district = GameState.location.currentDistrict;
    const result = [];

    for (const [npcId, state] of Object.entries(GameState.npcs?.states ?? {})) {
      if (!state.spawned || state.dismissed) continue;
      const npcDef = NPCS[npcId];
      if (!npcDef) continue;

      if (state.isCompanion || npcDef.spawnDistrict === district) {
        result.push({ npcId, state, def: npcDef });
      }
    }
    return result;
  },
};

export default NPCSystem;
