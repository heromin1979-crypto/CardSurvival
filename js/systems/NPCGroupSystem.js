// === NPC GROUP SYSTEM ===
// W-5: 야간 경비 로테이션 (Night Watch)
// W-6: 그룹 포링 / NPC 파견 (Group Foraging / Dispatch)
// W-8: 집단 의사결정 / 그룹 투표 (Group Vote)
// W-9: 그룹 생존 통계 (Group Survival Stats)

import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import { NPC_ITEMS } from '../data/npcs.js';
import I18n from '../core/I18n.js';

// Night watch bonus table per NPC
const WATCH_BONUSES = {
  npc_soldier_deserter: { safetyAdd: 20, encounterReduce: 0.3 },
  npc_dog:              { safetyAdd: 15, encounterReduce: 0.2 },
  npc_mechanic:         { safetyAdd: 10, encounterReduce: 0.1 },
  npc_old_survivor:     { safetyAdd:  8, encounterReduce: 0.1 },
  npc_nurse:            { safetyAdd:  5, encounterReduce: 0.05 },
  npc_student:          { safetyAdd:  8, encounterReduce: 0.1 },
  npc_child:            { safetyAdd:  2, encounterReduce: 0.0 },
  npc_trader:           { safetyAdd:  5, encounterReduce: 0.05 },
};

// Forage yield table per NPC (items + qty range)
const FORAGE_YIELD = {
  npc_dog:      [{ id: 'raw_meat', qty: [1, 2] }, { id: 'wild_herb', qty: [1, 1] }],
  npc_student:  [{ id: 'wild_herb', qty: [1, 2] }, { id: 'scrap_metal', qty: [1, 1] }],
  npc_mechanic: [{ id: 'scrap_metal', qty: [1, 3] }, { id: 'battery', qty: [1, 1] }],
  npc_trader:   [{ id: 'cloth', qty: [1, 2] }, { id: 'dried_food', qty: [1, 1] }],
  npc_nurse:    [{ id: 'wild_herb', qty: [1, 2] }, { id: 'bandage', qty: [1, 1] }],
  npc_soldier_deserter: [{ id: 'scrap_metal', qty: [1, 2] }, { id: 'raw_meat', qty: [1, 2] }],
  npc_old_survivor: [{ id: 'wild_herb', qty: [2, 3] }, { id: 'rope', qty: [1, 1] }],
  npc_child:    [{ id: 'wild_herb', qty: [1, 1] }],
};

// TP duration for a foraging dispatch (48 TP = ~8 hours)
const FORAGE_DURATION_TP = 48;

const NPCGroupSystem = {

  init() {
    EventBus.on('tpAdvance',    () => this._onTP());
    EventBus.on('nightStarted', () => this._proposeNightWatch());

    // Panel dispatch button
    EventBus.on('npcDispatchForage', ({ npcId }) => this.dispatchForage(npcId));

    // Group vote request
    EventBus.on('requestGroupVote', (opts) => this.openGroupVote(opts));
  },

  // ── W-9: Group Stats ───────────────────────────────────────────

  _ensureGroupStats() {
    if (!GameState.groupStats) {
      GameState.groupStats = {
        morale:   50,  // 사기 0-100
        cohesion: 50,  // 결속 0-100
        food:     50,  // 식량 안정도 0-100 (nutrition 기반)
        safety:   50,  // 안전도 0-100
      };
    }
    return GameState.groupStats;
  },

  _updateGroupStats() {
    const gs    = GameState;
    const stats = this._ensureGroupStats();
    const companions = gs.companions ?? [];

    // food = nutrition stat
    stats.food = gs.stats?.nutrition?.current ?? 50;

    // morale = player morale + avg NPC morale
    const playerMorale = gs.stats?.morale?.current ?? 50;
    let npcMoraleSum = 0;
    let npcCount = 0;
    for (const npcId of companions) {
      const npcState = gs.npcs?.states?.[npcId];
      if (npcState) { npcMoraleSum += npcState.morale ?? 50; npcCount++; }
    }
    const avgNpcMorale = npcCount > 0 ? npcMoraleSum / npcCount : 50;
    stats.morale = Math.round((playerMorale + avgNpcMorale) / 2);

    // cohesion: increases with companions on same team, decreases when neglected
    let neglectPenalty = 0;
    for (const npcId of companions) {
      const state = gs.npcs?.states?.[npcId];
      if (state?.neglectDays > 3) neglectPenalty += 5;
    }
    stats.cohesion = Math.max(0, Math.min(100, stats.cohesion - neglectPenalty));

    // safety updated by night watch
    // decays slowly each day if no watch
    if (!gs.flags?.nightWatchActive) {
      stats.safety = Math.max(0, stats.safety - 2);
    }

    EventBus.emit('groupStatsUpdated', { stats });
  },

  // ── W-5: Night Watch ───────────────────────────────────────────

  _proposeNightWatch() {
    const companions = GameState.companions ?? [];
    if (companions.length === 0) return;

    // Auto-assign best watcher
    let best = null;
    let bestScore = -1;
    for (const npcId of companions) {
      const bonus = WATCH_BONUSES[npcId];
      if (!bonus) continue;
      const state = GameState.npcs?.states?.[npcId];
      // Skip dispatched NPCs
      if (state?.dispatched) continue;
      if (bonus.safetyAdd > bestScore) {
        bestScore = bonus.safetyAdd;
        best = npcId;
      }
    }

    if (!best) return;

    const name = I18n.itemName(best, NPC_ITEMS[best]?.name) ?? best;
    const bonus = WATCH_BONUSES[best];

    GameState.flags.nightWatchActive = true;
    GameState.flags.nightWatchNpc    = best;

    // Apply bonus
    const stats = this._ensureGroupStats();
    stats.safety = Math.min(100, stats.safety + bonus.safetyAdd);

    // Store encounter reduction for ExploreSystem to read
    GameState.flags.nightWatchEncounterReduce = bonus.encounterReduce;

    EventBus.emit('notify', {
      message: `🌙 ${name}이(가) 야간 경비를 맡는다. 안전도 +${bonus.safetyAdd}`,
      type: 'info',
    });
    EventBus.emit('nightWatchAssigned', { npcId: best, bonus });
  },

  resolveNightWatch() {
    const npcId = GameState.flags?.nightWatchNpc;
    GameState.flags.nightWatchActive          = false;
    GameState.flags.nightWatchNpc             = null;
    GameState.flags.nightWatchEncounterReduce = 0;

    if (npcId) {
      EventBus.emit('notify', {
        message: `🌅 ${I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) ?? npcId}의 경비가 끝났다.`,
        type: 'info',
      });
    }
  },

  /** Get night watch encounter multiplier reduction (0.0–1.0) */
  getNightWatchEncounterReduce() {
    return GameState.flags?.nightWatchEncounterReduce ?? 0;
  },

  // ── W-6: Group Foraging / Dispatch ────────────────────────────

  dispatchForage(npcId) {
    const state = GameState.npcs?.states?.[npcId];
    if (!state || !state.isCompanion) return;
    if (state.dispatched) {
      EventBus.emit('notify', { message: '이미 파견 중입니다.', type: 'warn' });
      return;
    }

    state.dispatched     = true;
    state.dispatchReturnTP = (GameState.time?.totalTP ?? 0) + FORAGE_DURATION_TP;

    const name = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) ?? npcId;
    EventBus.emit('notify', {
      message: `🎒 ${name}이(가) 자원 수집을 위해 파견됩니다. ${FORAGE_DURATION_TP / 6}시간 후 귀환.`,
      type: 'info',
    });
    EventBus.emit('npcDispatched', { npcId });
    EventBus.emit('npcPanelUpdate', { npcId });
  },

  _checkDispatchReturns() {
    const gs  = GameState;
    const now = gs.time?.totalTP ?? 0;

    for (const npcId of (gs.companions ?? [])) {
      const state = gs.npcs?.states?.[npcId];
      if (!state?.dispatched) continue;
      if (now < state.dispatchReturnTP) continue;

      // Resolve return
      state.dispatched     = false;
      state.dispatchReturnTP = null;

      const name  = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) ?? npcId;
      const yield_ = FORAGE_YIELD[npcId] ?? [];
      const gained = [];

      for (const entry of yield_) {
        if (Math.random() < 0.7) { // 70% chance per item type
          const qty = entry.qty[0] + Math.floor(Math.random() * (entry.qty[1] - entry.qty[0] + 1));
          // Add to inventory
          if (gs.addItemToInventory) {
            gs.addItemToInventory(entry.id, qty);
          } else if (gs.board?.middle) {
            // Fallback: emit addItem event
            EventBus.emit('addItemToBoard', { itemId: entry.id, qty });
          }
          gained.push(`${entry.id} ×${qty}`);
        }
      }

      const gainedStr = gained.length > 0 ? gained.join(', ') : '아무것도 못 찾았다';
      EventBus.emit('notify', {
        message: `🎒 ${name} 귀환: ${gainedStr}`,
        type: gained.length > 0 ? 'good' : 'info',
      });
      EventBus.emit('npcForageReturn', { npcId, gained });
      EventBus.emit('npcPanelUpdate', { npcId });
    }
  },

  /** Is this NPC currently dispatched? */
  isDispatched(npcId) {
    return GameState.npcs?.states?.[npcId]?.dispatched ?? false;
  },

  // ── W-8: Group Vote ────────────────────────────────────────────

  openGroupVote({ question, options, onResult }) {
    const companions = GameState.companions ?? [];
    if (companions.length === 0) {
      // No companions — resolve with default
      onResult?.(options[0]?.id ?? 'default');
      return;
    }

    // Simulate votes from each companion
    const votes = {};
    for (const opt of options) votes[opt.id] = 0;

    for (const npcId of companions) {
      const state  = GameState.npcs?.states?.[npcId];
      const emotion = state?.emotion ?? 'calm';

      // Biased voting based on emotion
      let picked;
      if (emotion === 'hopeful' || emotion === 'calm') {
        // Hopeful/calm: pick safer option (first)
        picked = options[0]?.id;
      } else if (emotion === 'anxious' || emotion === 'trauma') {
        // Anxious: pick cautious option (last)
        picked = options[options.length - 1]?.id ?? options[0]?.id;
      } else {
        picked = options[Math.floor(Math.random() * options.length)]?.id;
      }
      if (picked) votes[picked] = (votes[picked] ?? 0) + 1;
    }

    // Determine winner
    let winner = options[0]?.id;
    let maxVotes = 0;
    for (const [id, count] of Object.entries(votes)) {
      if (count > maxVotes) { maxVotes = count; winner = id; }
    }

    // Build result summary
    const summary = options.map(o =>
      `${o.label}: ${votes[o.id] ?? 0}표`
    ).join(' / ');

    EventBus.emit('notify', {
      message: `🗳️ 투표 결과 — ${question}\n${summary}`,
      type: 'info',
    });
    EventBus.emit('groupVoteResult', { question, winner, votes });

    onResult?.(winner);
  },

  // ── TP handler ─────────────────────────────────────────────────

  _onTP() {
    this._updateGroupStats();
    this._checkDispatchReturns();
  },

  // ── Public Stats API ───────────────────────────────────────────

  getGroupStats() {
    return this._ensureGroupStats();
  },

  /** Modify a single group stat */
  modGroupStat(stat, delta) {
    const stats = this._ensureGroupStats();
    if (stats[stat] !== undefined) {
      stats[stat] = Math.max(0, Math.min(100, stats[stat] + delta));
      EventBus.emit('groupStatsUpdated', { stats });
    }
  },
};

export default NPCGroupSystem;
