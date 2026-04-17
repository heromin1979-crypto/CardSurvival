// === NPC QUEST SYSTEM ===
// Handles character-specific quest chains tied to NPC trust levels.
// Quests unlock at trust thresholds, track progress, and give rewards on completion.

import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import NPCS, { NPC_ITEMS } from '../data/npcs.js';

const NPCQuestSystem = {

  init() {
    EventBus.on('npcTrustChanged', ({ npcId, newTrust }) => {
      this._checkQuestUnlock(npcId, newTrust);
    });
    EventBus.on('boardChanged',    () => this._checkAllProgress());
    EventBus.on('tpAdvance',       () => this._checkAllProgress());
    EventBus.on('npcWoundHealed',  () => this._checkAllProgress());
    // NPC 스폰 시 trust 0 퀘스트 즉시 활성화
    EventBus.on('npcSpawned',  ({ npcId }) => this._checkQuestUnlock(npcId, 0));
    EventBus.on('loaded',      () => this._unlockAllTrust0Quests());
  },

  // ── Quest unlock on trust change ───────────────────────────────

  _checkQuestUnlock(npcId, trust) {
    const npcDef = NPCS[npcId];
    if (!npcDef?.quests?.length) return;

    for (const quest of npcDef.quests) {
      if (trust < quest.triggerTrust) continue;
      const flagKey = `npcQuest_unlocked_${quest.id}`;
      if (GameState.flags[flagKey]) continue;
      GameState.flags[flagKey] = true;

      // Store as active quest on NPC state
      const state = GameState.npcs?.states?.[npcId];
      if (state && !state.activeQuest) {
        state.activeQuest = quest.id;
      }

      const name = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);
      EventBus.emit('notify', {
        message: `[의뢰] ${name}: "${quest.title}" — ${quest.description}`,
        type: 'good',
      });
      EventBus.emit('npcPanelUpdate', { npcId });
    }
  },

  /** 게임 로드 시 모든 스폰된 NPC의 trust 0 퀘스트를 즉시 활성화 */
  _unlockAllTrust0Quests() {
    if (!GameState.npcs?.states) return;
    for (const [npcId, state] of Object.entries(GameState.npcs.states)) {
      if (!state.spawned || state.dismissed) continue;
      this._checkQuestUnlock(npcId, state.trust ?? 0);
    }
  },

  // ── Progress check (called on tick + board change) ─────────────

  _checkAllProgress() {
    if (!GameState.npcs?.states) return;

    for (const [npcId, state] of Object.entries(GameState.npcs.states)) {
      if (!state.activeQuest) continue;
      const npcDef = NPCS[npcId];
      if (!npcDef?.quests?.length) continue;

      const quest = npcDef.quests.find(q => q.id === state.activeQuest);
      if (!quest) continue;

      if (this._isQuestComplete(quest)) {
        this._completeQuest(npcId, quest);
      }
    }
  },

  _isQuestComplete(quest) {
    for (const step of quest.steps) {
      if (step.type === 'collect') {
        const qty = GameState.countOnBoard?.(step.itemId) ?? 0;
        if (qty < step.qty) return false;
      }
      if (step.type === 'visit') {
        const visited = GameState.flags?.[`visited_${step.locationId}`] ?? false;
        if (!visited) return false;
      }
      if (step.type === 'day') {
        if ((GameState.time?.day ?? 0) < step.minDay) return false;
      }
      if (step.type === 'treat_npc') {
        const targetState = GameState.npcs?.states?.[step.npcId];
        if (!targetState || (targetState.woundLevel ?? 0) > 0) return false;
      }
    }
    return true;
  },

  _completeQuest(npcId, quest) {
    const state = GameState.npcs.states[npcId];
    if (!state) return;

    const flagKey = `npcQuest_done_${quest.id}`;
    if (GameState.flags[flagKey]) return;
    GameState.flags[flagKey]  = true;
    state.activeQuest = null;

    const name = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name);

    // Consume required items
    for (const step of quest.steps) {
      if (step.type !== 'collect') continue;
      let remaining = step.qty;
      for (const card of GameState.getBoardCards?.() ?? []) {
        if (remaining <= 0) break;
        if (card.definitionId !== step.itemId) continue;
        const qty = card.quantity ?? 1;
        if (qty <= remaining) {
          remaining -= qty;
          GameState.removeCardInstance(card.instanceId);
        } else {
          card.quantity = qty - remaining;
          remaining = 0;
        }
      }
    }

    // Give rewards
    if (quest.reward?.trust > 0) {
      state.trust = Math.min(5, (state.trust ?? 0) + quest.reward.trust);
      EventBus.emit('npcTrustChanged', { npcId, oldTrust: state.trust - quest.reward.trust, newTrust: state.trust });
    }

    if (quest.reward?.items?.length) {
      for (const item of quest.reward.items) {
        const inst = GameState.createCardInstance(item.id, { quantity: item.qty });
        if (inst) {
          const placed = GameState.placeCardInRow(inst.instanceId, 'middle');
          if (!placed) GameState.placeCardInRow(inst.instanceId, 'bottom');
        }
        // 지도 조각 획득 추적
        if (item.id?.startsWith('map_fragment_')) {
          this._collectMapFragment(item.id);
        }
      }
      EventBus.emit('boardChanged', {});
    }

    if (quest.reward?.skillUnlock) {
      if (!GameState.player.learnedSkills) GameState.player.learnedSkills = {};
      const { skillId, value } = quest.reward.skillUnlock;
      GameState.player.learnedSkills[skillId] =
        (GameState.player.learnedSkills[skillId] ?? 0) + value;
    }

    EventBus.emit('notify', {
      message: `✅ [의뢰 완료] ${name}: "${quest.title}" — 보상 획득!`,
      type: 'good',
    });
    EventBus.emit('npcPanelUpdate', { npcId });

    // Check if next quest in chain unlocks
    const npcDef  = NPCS[npcId];
    const doneIdx = npcDef?.quests?.findIndex(q => q.id === quest.id) ?? -1;
    const next    = npcDef?.quests?.[doneIdx + 1];
    if (next && (state.trust ?? 0) >= next.triggerTrust) {
      setTimeout(() => this._checkQuestUnlock(npcId, state.trust), 500);
    }
  },

  // ── 지도 조각 수집 ─────────────────────────────────────────────

  _collectMapFragment(itemId) {
    const part = itemId.replace('map_fragment_', '');
    const frags = GameState.flags.mapFragments;
    if (frags.includes(part)) return;
    frags.push(part);
    EventBus.emit('notify', {
      message: `🗺️ 서울 지도 조각 획득! (${frags.length} / 3)`,
      type: 'good',
    });
    if (frags.length >= 3 && !GameState.flags.mapUnlocked) {
      GameState.flags.mapUnlocked = true;
      setTimeout(() => {
        EventBus.emit('notify', {
          message: '🗺️ 서울 전체 지도가 해금되었습니다! 미니맵을 클릭해 확인하세요.',
          type: 'good',
        });
        EventBus.emit('mapUnlocked', {});
      }, 800);
    }
  },

  // ── Public API ─────────────────────────────────────────────────

  getActiveQuest(npcId) {
    const state  = GameState.npcs?.states?.[npcId];
    const npcDef = NPCS[npcId];
    if (!state?.activeQuest || !npcDef?.quests) return null;
    return npcDef.quests.find(q => q.id === state.activeQuest) ?? null;
  },
};

export default NPCQuestSystem;
