// === NPC SYSTEM ===
// Manages NPC lifecycle: spawning, trust, dialogue, companion bonuses, trade.
// NPCs appear as non-draggable cards on the middle row.
// MentalSystem reads GameState.companions for loneliness reduction.

import EventBus                from '../core/EventBus.js';
import GameState               from '../core/GameState.js';
import I18n                    from '../core/I18n.js';
import SecretCombinationSystem from './SecretCombinationSystem.js';
import NPCS, { NPC_ITEMS }    from '../data/npcs.js';
import { NPC_CHEMISTRY }       from '../data/npcChemistry.js';
import GameData from '../data/GameData.js';

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

    // Listen for location/screen changes to sync panel
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'basecamp') { this._checkSpawns(); this._syncNPCPanel(); }
    });

    // District change → re-sync panel (location NPCs appear/disappear)
    EventBus.on('districtChanged', () => this._syncNPCPanel());

    // Track combat events for departure condition (b) — excessive combat
    EventBus.on('combatEnd', () => this._onCombatEnd());
  },

  // ── Register NPC items in global item registry ─────────────────

  _registerNPCItems() {
    const items = GameData?.items;
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
      GameState.npcs = { states: {} };
    }
    if (!GameState.companions) {
      GameState.companions = [];
    }
    // Save compat: ensure new fields on existing states
    for (const [npcId, state] of Object.entries(GameState.npcs.states)) {
      if (state.hp          === undefined) state.hp          = NPCS[npcId]?.maxHp ?? 50;
      if (state.neglectDays === undefined) state.neglectDays = 0;
      if (state.companionSince === undefined) state.companionSince = null;
    }
  },

  // ── TP Callback ────────────────────────────────────────────────

  _onTP() {
    this.ensureInitialized();
    this._checkSpawns();
    this._applyCompanionEffects();
    this._checkCompanionDeparture();
    this._checkForage();
    this._checkSpontaneousDialogue();
    this._checkNeglect();
    this._checkSpecialDays();
    this._applyPendingChemistry();
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
    // Initialize NPC state — no board card, NPC lives in the side panel
    GameState.npcs.states[npcId] = {
      spawned:         true,
      dismissed:       false,
      trust:           0,
      isCompanion:     false,
      hp:              npcDef.maxHp ?? 50,
      neglectDays:     0,
      companionSince:  null,
    };

    EventBus.emit('notify', {
      message: I18n.t('npc.spawned', { name: I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) }),
      type: 'info',
    });
    EventBus.emit('npcSpawned',   { npcId });
    EventBus.emit('npcPanelAdd',  { npcId, section: 'location' });
  },

  // ── Sync NPC panel when entering district ──────────────────────

  _syncNPCPanel() {
    this.ensureInitialized();
    const district = GameState.location?.currentDistrict;

    for (const [npcId, state] of Object.entries(GameState.npcs.states)) {
      if (!state.spawned || state.dismissed) continue;
      const npcDef = NPCS[npcId];
      if (!npcDef) continue;

      const isHere = state.isCompanion || npcDef.spawnDistrict === district;

      if (isHere) {
        const section = state.isCompanion ? 'companion' : 'location';
        EventBus.emit('npcPanelAdd', { npcId, section });
      } else {
        EventBus.emit('npcPanelRemove', { npcId });
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
    state.isCompanion    = false;
    state.dismissed      = true;
    state.companionSince = null;
    state.neglectDays    = 0;

    // Increase loneliness +10 on MentalSystem
    if (gs.mental) {
      gs.mental.loneliness = Math.min(100, (gs.mental.loneliness ?? 0) + 10);
    }

    // Notification — departed vs died
    if (!isDeath) {
      EventBus.emit('notify', { message: I18n.t('npc.departed', { name }), type: 'info' });
    }

    EventBus.emit('npcDismissed',   { npcId, reason: isDeath ? 'death' : 'departure' });
    EventBus.emit('npcPanelRemove', { npcId });
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
    EventBus.emit('npcPanelUpdate', { npcId });

    if (state.hp <= 0) {
      EventBus.emit('notify', { message: I18n.t('npc.died', { name }), type: 'danger' });
      if (GameState.mental) {
        GameState.mental.trauma = Math.min(100, (GameState.mental.trauma ?? 0) + 15);
      }
      this._removeCompanion(npcId, /* isDeath */ true);
    }
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

    const oldTrust    = state.trust;
    state.trust       = Math.min(5, state.trust + npcDef.trustGainPerTalk);
    state.neglectDays = 0;  // V-5: Reset neglect counter on interaction

    EventBus.emit('npcTrustChanged', { npcId, oldTrust, newTrust: state.trust });

    // Check for secret combination hints at new trust level
    this._checkHintGifts(npcId, oldTrust, state.trust);

    // Check for gift at new trust level
    this._checkGifts(npcId, oldTrust, state.trust);

    // Check for trust milestone events (e.g., npc_dog special bonuses)
    this._checkTrustEvents(npcId, oldTrust, state.trust);
  },

  _checkTrustEvents(npcId, oldTrust, newTrust) {
    const npcDef = NPCS[npcId];
    if (!npcDef?.trustEvents) return;
    const gs = GameState;

    for (const evt of npcDef.trustEvents) {
      if (oldTrust >= evt.trust || newTrust < evt.trust) continue;
      // 이미 발동된 이벤트는 건너뜀
      if (!gs.flags.npcTrustEventsFired) gs.flags.npcTrustEventsFired = {};
      if (gs.flags.npcTrustEventsFired[evt.id]) continue;
      gs.flags.npcTrustEventsFired[evt.id] = true;

      EventBus.emit('notify', { message: evt.message, type: 'good' });

      // 아이템 지급
      if (evt.effect?.giveItems) {
        for (const gift of evt.effect.giveItems) {
          const inst = GameState.createCardInstance(gift.id, { quantity: gift.qty });
          if (inst) {
            const placed = GameState.placeCardInRow(inst.instanceId, 'middle');
            if (!placed) GameState.removeCardInstance(inst.instanceId);
          }
        }
        EventBus.emit('boardChanged', {});
      }

      // 동반자 전투 피해 감소 패시브 등록
      if (evt.effect?.combatDmgReduce) {
        if (!gs.flags.companionCombatDmgReduce) gs.flags.companionCombatDmgReduce = 0;
        gs.flags.companionCombatDmgReduce = Math.max(
          gs.flags.companionCombatDmgReduce,
          evt.effect.combatDmgReduce,
        );
      }

      // V-4: 스킬 전수 (신뢰 5 달성 시)
      if (evt.effect?.skillTeach) {
        if (!gs.flags.npcSkillTaught) gs.flags.npcSkillTaught = {};
        if (!gs.flags.npcSkillTaught[npcId]) {
          gs.flags.npcSkillTaught[npcId] = true;
          if (!gs.player.learnedSkills) gs.player.learnedSkills = {};
          const { skillId, value } = evt.effect.skillTeach;
          gs.player.learnedSkills[skillId] =
            (gs.player.learnedSkills[skillId] ?? 0) + value;
        }
      }

      EventBus.emit('npcTrustEvent', { npcId, eventId: evt.id, effect: evt.effect });
    }
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
            const itemDef = GameData.items[gift.itemId];
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

    const state          = GameState.npcs.states[npcId];
    state.isCompanion    = true;
    state.companionSince = GameState.time?.day ?? 0;
    state.neglectDays    = 0;

    if (!GameState.companions.includes(npcId)) {
      GameState.companions = [...GameState.companions, npcId];
    }

    const comp = NPCS[npcId]?.companion;
    if (comp?.carryBonus > 0) {
      GameState.player.encumbrance.max += comp.carryBonus;
    }

    EventBus.emit('notify', {
      message: I18n.t('npc.recruited', { name: I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) }),
      type: 'good',
    });
    EventBus.emit('npcRecruited', { npcId });

    // V-6: Check chemistry with existing companions
    this._checkChemistry(npcId);
    return true;
  },

  dismiss(npcId) {
    this.ensureInitialized();
    const state = GameState.npcs.states[npcId];
    if (!state || !state.isCompanion) return false;

    state.isCompanion    = false;
    state.dismissed      = true;
    state.companionSince = null;
    state.neglectDays    = 0;
    GameState.companions = GameState.companions.filter(id => id !== npcId);

    const comp = NPCS[npcId]?.companion;
    if (comp?.carryBonus > 0) {
      GameState.player.encumbrance.max = Math.max(10, GameState.player.encumbrance.max - comp.carryBonus);
    }

    EventBus.emit('notify', {
      message: I18n.t('npc.dismissed', { name: I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) }),
      type: 'info',
    });
    EventBus.emit('npcDismissed',   { npcId });
    EventBus.emit('npcPanelRemove', { npcId });
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

    const giveItemDef = GameData.items[trade.give.id];
    const receiveItemDef = GameData.items[trade.receive.id];
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
    const district = GameState.location?.currentDistrict;
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

  // ══════════════════════════════════════════════════════════════
  // V-2: 능동적 NPC 행동
  // ══════════════════════════════════════════════════════════════

  /** 동반자 자율 수집 (1일 1회) */
  _checkForage() {
    const companions = GameState.companions ?? [];
    if (companions.length === 0) return;
    const totalTP = GameState.time?.totalTP ?? 0;
    if (totalTP % 96 !== 0) return;

    for (const npcId of companions) {
      const npcDef = NPCS[npcId];
      if (!npcDef?.forageItems?.length) continue;

      for (const forage of npcDef.forageItems) {
        if (Math.random() >= forage.chance) continue;
        const inst = GameState.createCardInstance(forage.id, { quantity: forage.qty ?? 1 });
        if (inst) {
          const placed = GameState.placeCardInRow(inst.instanceId, 'middle')
                      || GameState.placeCardInRow(inst.instanceId, 'bottom');
          if (placed) {
            const name     = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);
            const itemDef  = GameData?.items[forage.id];
            const itemName = I18n.itemName(forage.id, itemDef?.name);
            EventBus.emit('notify', {
              message: `${name}이(가) ${itemName}을(를) 찾아왔다!`,
              type: 'good',
            });
            EventBus.emit('boardChanged', {});
          } else {
            GameState.removeCardInstance(inst.instanceId);
          }
        }
        break; // 1일 1개
      }
    }
  },

  /** NPC 선제 대사 (3/4일 1회, 상황별) */
  _checkSpontaneousDialogue() {
    const companions = GameState.companions ?? [];
    if (companions.length === 0) return;
    const totalTP = GameState.time?.totalTP ?? 0;
    if (totalTP % 72 !== 0) return;

    const npcId  = companions[Math.floor(Math.random() * companions.length)];
    const npcDef = NPCS[npcId];
    if (!npcDef?.spontaneous?.length) return;

    const gs         = GameState;
    const hpRatio    = (gs.player?.hp?.current ?? 100) / (gs.player?.hp?.max ?? 100);
    const nutrition  = gs.stats?.nutrition?.current ?? 100;
    const isRaining  = gs.weather?.currentWeather === 'rain';

    let line = null;
    for (const entry of npcDef.spontaneous) {
      if (entry.condition === 'low_hp'        && hpRatio < 0.3)  { line = entry.line; break; }
      if (entry.condition === 'low_nutrition' && nutrition < 20)  { line = entry.line; break; }
      if (entry.condition === 'rain'          && isRaining)       { line = entry.line; break; }
      if (entry.condition === 'always')                           { line = entry.line; break; }
    }
    if (!line) return;

    EventBus.emit('charDialogue', { characterId: npcId, line });
  },

  // ══════════════════════════════════════════════════════════════
  // V-5: NPC 상태 변화
  // ══════════════════════════════════════════════════════════════

  /** 방치 누적 (1일 1회 카운트, 3일→경고, 5일→신뢰감소, 7일→이탈) */
  _checkNeglect() {
    const companions = GameState.companions ?? [];
    if (companions.length === 0) return;
    const totalTP = GameState.time?.totalTP ?? 0;
    if (totalTP % 96 !== 0) return;

    for (const npcId of [...companions]) {
      const state  = GameState.npcs.states[npcId];
      const npcDef = NPCS[npcId];
      if (!state || !npcDef) continue;

      state.neglectDays = (state.neglectDays ?? 0) + 1;
      const name = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);

      if (state.neglectDays === 3) {
        EventBus.emit('notify', {
          message: `${name}이(가) 오랫동안 말을 걸지 않아 섭섭해하는 것 같다.`,
          type: 'warn',
        });
        EventBus.emit('npcPanelUpdate', { npcId });
      }

      if (state.neglectDays === 5) {
        const old = state.trust;
        state.trust = Math.max(0, old - 1);
        EventBus.emit('notify', {
          message: `${name}의 신뢰도가 방치로 낮아졌다. (${state.trust}★)`,
          type: 'warn',
        });
        EventBus.emit('npcTrustChanged', { npcId, oldTrust: old, newTrust: state.trust });
      }

      if (state.neglectDays >= 7 && npcDef.personality !== 'loyal') {
        EventBus.emit('notify', {
          message: `${name}이(가) 관심을 잃고 홀로 떠났다.`,
          type: 'warn',
        });
        this._removeCompanion(npcId, false);
      }
    }
  },

  /** 기념일 이벤트 (동반자와 함께한 일수 기준) */
  _checkSpecialDays() {
    const companions = GameState.companions ?? [];
    if (companions.length === 0) return;
    const day = GameState.time?.day ?? 0;

    for (const npcId of companions) {
      const state  = GameState.npcs.states[npcId];
      const npcDef = NPCS[npcId];
      if (!state || !npcDef?.specialDays?.length) continue;

      const since      = state.companionSince ?? 0;
      const daysTog    = day - since;

      for (const evt of npcDef.specialDays) {
        if (daysTog !== evt.day) continue;
        const flagKey = `specialDay_${npcId}_${evt.day}`;
        if (GameState.flags[flagKey]) continue;
        GameState.flags[flagKey] = true;

        EventBus.emit('notify', { message: evt.message, type: 'good' });
        if (evt.effect?.morale) GameState.modStat('morale', evt.effect.morale);
        if (evt.effect?.trust) {
          state.trust = Math.min(5, (state.trust ?? 0) + evt.effect.trust);
          EventBus.emit('npcPanelUpdate', { npcId });
        }
      }
    }
  },

  // ══════════════════════════════════════════════════════════════
  // V-6: NPC 간 케미스트리
  // ══════════════════════════════════════════════════════════════

  /** 새 동반자 합류 시 기존 동반자와의 케미스트리 체크 */
  _checkChemistry(newNpcId) {
    const companions = GameState.companions ?? [];
    if (companions.length < 2) return;

    for (const entry of NPC_CHEMISTRY) {
      const flagKey = `chemistry_${entry.id}`;
      if (GameState.flags[flagKey]) continue;

      const hasA = companions.includes(entry.npcA);
      const hasB = companions.includes(entry.npcB);
      if (!hasA || !hasB) continue;

      // triggerDays 후에 발동 — TP 이벤트로 지연 예약
      const triggerDay = (GameState.time?.day ?? 0) + entry.triggerDays;
      if (!GameState.flags.pendingChemistry) GameState.flags.pendingChemistry = [];
      GameState.flags.pendingChemistry.push({ ...entry, triggerDay });
    }
  },

  /** 매 TP: 예약된 케미스트리 발동 체크 */
  _applyPendingChemistry() {
    const pending = GameState.flags.pendingChemistry;
    if (!pending?.length) return;

    const day        = GameState.time?.day ?? 0;
    const companions = GameState.companions ?? [];
    const remaining  = [];

    for (const entry of pending) {
      if (day < entry.triggerDay) { remaining.push(entry); continue; }
      if (GameState.flags[`chemistry_${entry.id}`]) continue;
      // Both still companions?
      if (!companions.includes(entry.npcA) || !companions.includes(entry.npcB)) continue;

      GameState.flags[`chemistry_${entry.id}`] = true;
      EventBus.emit('notify', { message: entry.message, type: 'good' });

      const eff = entry.effect;
      if (eff?.exploreRiskReduction)  GameState.flags.chemistryExploreRisk  = (GameState.flags.chemistryExploreRisk  ?? 0) + eff.exploreRiskReduction;
      if (eff?.tradeSaveOne)          GameState.flags.chemistryTradeSave     = true;
      if (eff?.craftHealBonus)        GameState.flags.chemistryCraftHeal     = (GameState.flags.chemistryCraftHeal ?? 0) + eff.craftHealBonus;
      if (eff?.moraleBonus)           GameState.modStat?.('morale', eff.moraleBonus);
      if (eff?.infectionRateReduction) GameState.flags.chemistryInfectReduce = (GameState.flags.chemistryInfectReduce ?? 0) + eff.infectionRateReduction;
    }

    GameState.flags.pendingChemistry = remaining;
  },

  // ── Public: companion heal (V-5) ──────────────────────────────

  /** 동반자 HP 회복 (의료 아이템 사용 시 선택 가능) */
  healCompanion(npcId, amount) {
    this.ensureInitialized();
    const state  = GameState.npcs.states[npcId];
    const npcDef = NPCS[npcId];
    if (!state || !state.isCompanion || !npcDef) return false;

    const maxHp = npcDef.maxHp ?? 50;
    const before = state.hp ?? maxHp;
    state.hp = Math.min(maxHp, before + amount);

    const name = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);
    EventBus.emit('notify', {
      message: `${name}의 HP가 회복되었다. (${before} → ${state.hp})`,
      type: 'good',
    });
    // Trust +1 for healing companion
    const oldTrust = state.trust;
    state.trust = Math.min(5, oldTrust + 1);
    if (state.trust > oldTrust) {
      EventBus.emit('npcTrustChanged', { npcId, oldTrust, newTrust: state.trust });
    }
    EventBus.emit('npcPanelUpdate', { npcId });
    return true;
  },
};

export default NPCSystem;
