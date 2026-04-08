// === NPC RELATION SYSTEM ===
// W-1: 공유 기억 서사 (Narrative Memory)
// W-2: NPC 감정 상태 (Emotional State)
// W-10: NPC↔NPC 관계망 (NPC Relationship Web)

import EventBus                from '../core/EventBus.js';
import GameState               from '../core/GameState.js';
import { NPC_MEMORY_TRIGGERS } from '../data/npcMemories.js';
import { NPC_RELATIONS }       from '../data/npcRelations.js';
import { NPC_ITEMS }           from '../data/npcs.js';
import I18n                    from '../core/I18n.js';

// ── Emotion modifier table ──────────────────────────────────────
// Each emotion applies multipliers to daily bonuses from companion
const EMOTION_MODS = {
  calm:    { moraleMult: 1.0, trustGainMult: 1.0, forageChanceMult: 1.0 },
  hopeful: { moraleMult: 1.3, trustGainMult: 1.2, forageChanceMult: 1.1 },
  anxious: { moraleMult: 0.7, trustGainMult: 0.8, forageChanceMult: 0.9 },
  trauma:  { moraleMult: 0.4, trustGainMult: 0.5, forageChanceMult: 0.6 },
};

const NPCRelationSystem = {

  // ── Pending memory queue ──────────────────────────────────────
  // { npcId, triggerId, fireAtTP, line, effect }
  _pendingMemories: [],

  init() {
    // W-1: Hook all memory trigger events
    this._initMemoryListeners();

    // W-10: Daily relation bonuses per TP
    EventBus.on('tpAdvance', () => this._onTP());

    // W-2: Emit emotion-changed updates to panel
    EventBus.on('npcEmotionSet', ({ npcId, emotion }) => {
      this._setEmotion(npcId, emotion);
    });

    // W-10: React to game events that trigger NPC↔NPC reactions
    EventBus.on('npcDamaged',    ({ npcId }) => this.onRelationEvent('npcDamaged', npcId));
    EventBus.on('npcDismissed',  ({ npcId }) => this.onRelationEvent('npcDismissed', npcId));
    EventBus.on('combatEnd',     ()          => this.onRelationEvent('combatEnd', null));
  },

  // ── W-1: Narrative Memory ──────────────────────────────────────

  _initMemoryListeners() {
    // Collect unique event keys across all NPCs
    const eventKeys = new Set();
    for (const triggers of Object.values(NPC_MEMORY_TRIGGERS)) {
      for (const t of triggers) eventKeys.add(t.trigger);
    }

    for (const eventKey of eventKeys) {
      EventBus.on(eventKey, (payload) => {
        this._handleMemoryEvent(eventKey, payload);
      });
    }
  },

  _handleMemoryEvent(eventKey, _payload) {
    const gs = GameState;
    const companions = gs.companions ?? [];

    for (const npcId of companions) {
      const triggers = NPC_MEMORY_TRIGGERS[npcId];
      if (!triggers) continue;

      for (const trigger of triggers) {
        if (trigger.trigger !== eventKey) continue;
        // Avoid duplicate pending entries for the same trigger
        const alreadyPending = this._pendingMemories.some(
          m => m.npcId === npcId && m.triggerId === trigger.id
        );
        if (alreadyPending) continue;
        // Check condition
        if (!trigger.condition(gs)) continue;
        // Check one-time flag
        if (trigger.setFlag && gs.flags?.[trigger.setFlag]) continue;

        const fireAtTP = (gs.time?.totalTP ?? 0) + trigger.delay;
        this._pendingMemories.push({
          npcId,
          triggerId: trigger.id,
          fireAtTP,
          line:      trigger.line,
          effect:    trigger.effect ?? {},
          setFlag:   trigger.setFlag ?? null,
        });
      }
    }
  },

  _firePendingMemories() {
    const gs  = GameState;
    const now = gs.time?.totalTP ?? 0;
    const remaining = [];

    for (const mem of this._pendingMemories) {
      if (now < mem.fireAtTP) {
        remaining.push(mem);
        continue;
      }
      // Fire the memory line
      const npcName = I18n.itemName(mem.npcId, NPC_ITEMS[mem.npcId]?.name) ?? mem.npcId;
      EventBus.emit('npcMemoryLine', { npcId: mem.npcId, line: mem.line });
      EventBus.emit('notify', {
        message: `💭 ${npcName}: ${mem.line}`,
        type: 'info',
      });

      // Apply memory effect
      const state = gs.npcs?.states?.[mem.npcId];
      if (state) {
        if (mem.effect.trust)   this._modTrust(mem.npcId, mem.effect.trust);
        if (mem.effect.emotion) this._setEmotion(mem.npcId, mem.effect.emotion);
      }
      // Set one-time flag
      if (mem.setFlag && gs.flags) gs.flags[mem.setFlag] = true;
    }

    this._pendingMemories = remaining;
  },

  // ── W-2: Emotional State ──────────────────────────────────────

  _setEmotion(npcId, emotion) {
    const state = GameState.npcs?.states?.[npcId];
    if (!state) return;
    if (!EMOTION_MODS[emotion]) return;
    state.emotion = emotion;
    EventBus.emit('npcPanelUpdate', { npcId });
  },

  /** Returns modifier object for an NPC based on their current emotion */
  getEmotionMods(npcId) {
    const emotion = GameState.npcs?.states?.[npcId]?.emotion ?? 'calm';
    return EMOTION_MODS[emotion] ?? EMOTION_MODS.calm;
  },

  // ── W-10: NPC↔NPC Relationship Web ────────────────────────────

  _onTP() {
    this._firePendingMemories();
    this._applyRelationDailyBonuses();
    this._checkRelationTriggers();
  },

  _applyRelationDailyBonuses() {
    const companions = GameState.companions ?? [];
    if (companions.length < 2) return;

    for (const [key, rel] of Object.entries(NPC_RELATIONS)) {
      const [npcA, npcB] = key.split('|');
      if (!companions.includes(npcA) || !companions.includes(npcB)) continue;

      const bonus = rel.dailyBonus ?? {};

      // Apply named bonus effects
      if (bonus.childMoraleDelta)    this._modNPCMorale(npcB.includes('child')   ? npcB : npcA, bonus.childMoraleDelta);
      if (bonus.soldierMoraleDelta)  this._modNPCMorale(npcA.includes('soldier') ? npcA : npcB, bonus.soldierMoraleDelta);
      if (bonus.oldHealPerDay)       this._modNPCHp('npc_old_survivor', bonus.oldHealPerDay);
      if (bonus.nurseMoraleDelta)    this._modNPCMorale('npc_nurse', bonus.nurseMoraleDelta);
      if (bonus.dogMoraleDelta)      this._modNPCMorale('npc_dog', bonus.dogMoraleDelta);
      if (bonus.groupMoraleDelta)    GameState.modStat?.('morale', bonus.groupMoraleDelta);
      if (bonus.craftBonusTick)      this._addCraftBonus(bonus.craftBonusTick);
      if (bonus.groupCohesionDelta)  this._modGroupCohesion(bonus.groupCohesionDelta);
      if (bonus.traderTrustBonus)    this._modTrust('npc_trader', bonus.traderTrustBonus / 10); // gradual
      if (bonus.oldMoraleDelta)      this._modNPCMorale('npc_old_survivor', bonus.oldMoraleDelta);
    }
  },

  _checkRelationTriggers() {
    const gs         = GameState;
    const companions = gs.companions ?? [];

    for (const [key, rel] of Object.entries(NPC_RELATIONS)) {
      if (!rel.triggerDays || !rel.onTrigger) continue;
      const [npcA, npcB] = key.split('|');
      if (!companions.includes(npcA) || !companions.includes(npcB)) continue;

      const flagKey = `rel_trigger_${key.replace('|', '_')}`;
      if (gs.flags?.[flagKey]) continue;

      const minSince = Math.max(
        gs.npcs?.states?.[npcA]?.companionSince ?? 9999,
        gs.npcs?.states?.[npcB]?.companionSince ?? 9999,
      );
      const daysTogether = (gs.time?.day ?? 0) - minSince;
      if (daysTogether < rel.triggerDays) continue;

      // Fire the trigger
      if (rel.onTrigger.message) {
        EventBus.emit('notify', { message: rel.onTrigger.message, type: 'info' });
      }
      if (rel.onTrigger.effect?.tradeSaveExtra) {
        if (!gs.flags) gs.flags = {};
        gs.flags.tradeSaveExtra = (gs.flags.tradeSaveExtra ?? 0) + rel.onTrigger.effect.tradeSaveExtra;
      }
      if (gs.flags) gs.flags[flagKey] = true;
    }
  },

  /** React to a game event that may trigger NPC↔NPC reactions */
  onRelationEvent(eventName, npcFilter) {
    const companions = GameState.companions ?? [];

    for (const [key, rel] of Object.entries(NPC_RELATIONS)) {
      const [npcA, npcB] = key.split('|');
      if (!companions.includes(npcA) || !companions.includes(npcB)) continue;

      for (const ev of (rel.onEvents ?? [])) {
        if (ev.event !== eventName) continue;
        if (ev.npcFilter && ev.npcFilter !== npcFilter) continue;

        const reaction = ev.reaction ?? {};
        if (reaction.trustDelta) {
          const target = reaction.emotionChange?.npcId ?? npcA;
          this._modTrust(target, reaction.trustDelta);
        }
        if (reaction.emotionChange) {
          this._setEmotion(reaction.emotionChange.npcId, reaction.emotionChange.emotion);
        }
        if (reaction.groupCohesionDelta) {
          this._modGroupCohesion(reaction.groupCohesionDelta);
        }
      }
    }
  },

  // ── Helpers ────────────────────────────────────────────────────

  _modTrust(npcId, delta) {
    const state = GameState.npcs?.states?.[npcId];
    if (!state) return;
    state.trust = Math.max(0, Math.min(5, (state.trust ?? 0) + delta));
    EventBus.emit('npcTrustChanged', { npcId, trust: state.trust });
  },

  _modNPCMorale(npcId, delta) {
    const state = GameState.npcs?.states?.[npcId];
    if (!state) return;
    state.morale = Math.max(0, Math.min(100, (state.morale ?? 50) + delta));
  },

  _modNPCHp(npcId, delta) {
    const state = GameState.npcs?.states?.[npcId];
    if (!state) return;
    state.hp = Math.max(0, Math.min(100, (state.hp ?? 50) + delta));
    EventBus.emit('npcPanelUpdate', { npcId });
  },

  _addCraftBonus(delta) {
    if (!GameState.craftBonus) GameState.craftBonus = 0;
    GameState.craftBonus = Math.min(0.5, GameState.craftBonus + delta);
  },

  _modGroupCohesion(delta) {
    if (!GameState.groupStats) GameState.groupStats = {};
    GameState.groupStats.cohesion = Math.max(0, Math.min(100,
      (GameState.groupStats.cohesion ?? 50) + delta
    ));
  },

  /** Get the relation definition for two companions (if any) */
  getRelation(npcA, npcB) {
    const key1 = `${npcA}|${npcB}`;
    const key2 = `${npcB}|${npcA}`;
    return NPC_RELATIONS[key1] ?? NPC_RELATIONS[key2] ?? null;
  },

  /** Get all active relations among current companions */
  getActiveRelations() {
    const companions = GameState.companions ?? [];
    const result = [];
    for (const [key, rel] of Object.entries(NPC_RELATIONS)) {
      const [npcA, npcB] = key.split('|');
      if (companions.includes(npcA) && companions.includes(npcB)) {
        result.push({ npcA, npcB, rel });
      }
    }
    return result;
  },
};

export default NPCRelationSystem;
