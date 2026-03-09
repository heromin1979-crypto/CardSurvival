// === QUEST SYSTEM ===
// 계절별 이벤트 연동 퀘스트 추적 시스템
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

// ── 퀘스트 정의 ──────────────────────────────────────────────────
// trigger: 연결된 seasonalEvent id (해당 이벤트 발생 시 자동 시작)
// objective: { type, target, count }
//   type: 'collect_item' | 'craft_item' | 'kill_enemies' | 'survive_days' | 'equip_slot'
// reward: { stat, value } | { item, qty }
const QUEST_DEFS = {
  spring_water: {
    id:      'spring_water',
    title:   '물 비축',
    desc:    '오염된 봄비 이전에 깨끗한 물을 비축하십시오.',
    icon:    '💧',
    trigger: 'spring_rain',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    reward:  { morale: 10 },
    deadlineDays: 14,
  },

  spring_gear: {
    id:      'spring_gear',
    title:   '방어 준비',
    desc:    '꽃가루 시즌에 대비해 방독면 또는 장갑을 착용하십시오.',
    icon:    '😷',
    trigger: 'spring_pollen',
    objective: { type: 'equip_slot', slot: 'face', count: 1 },
    reward:  { morale: 8 },
    deadlineDays: 10,
  },

  summer_water_stockpile: {
    id:      'summer_water_stockpile',
    title:   '폭염 대비 — 물 비축',
    desc:    '폭염이 시작되었습니다. 최소 10개의 깨끗한 물을 보유하십시오.',
    icon:    '🌊',
    trigger: 'summer_start',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 10 },
    reward:  { morale: 15 },
    deadlineDays: 20,
  },

  summer_structure: {
    id:      'summer_structure',
    title:   '냉각 구조물 건설',
    desc:    '장마 전 거점에 구조물을 추가로 건설하십시오.',
    icon:    '🏗',
    trigger: 'monsoon',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward:  { morale: 12, hp: 10 },
    deadlineDays: 30,
  },

  autumn_food: {
    id:      'autumn_food',
    title:   '수확의 계절 — 식량 비축',
    desc:    '풍성한 가을, 식량을 최대한 비축하십시오.',
    icon:    '🌾',
    trigger: 'autumn_harvest',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward:  { morale: 15 },
    deadlineDays: 30,
  },

  winter_warmth: {
    id:      'winter_warmth',
    title:   '방한 준비',
    desc:    '혹독한 겨울이 왔습니다. 방어구를 착용하십시오.',
    icon:    '🧥',
    trigger: 'winter_start',
    objective: { type: 'equip_slot', slot: 'body', count: 1 },
    reward:  { morale: 10, hp: 15 },
    deadlineDays: 10,
  },

  winter_survive: {
    id:      'winter_survive',
    title:   '강추위 생존',
    desc:    '강추위가 닥쳤습니다. 10일간 생존하십시오.',
    icon:    '🥶',
    trigger: 'extreme_cold',
    objective: { type: 'survive_days', count: 10 },
    reward:  { morale: 20, hp: 20 },
    deadlineDays: 15,
  },
};

// ── 시스템 ────────────────────────────────────────────────────────
const QuestSystem = {
  init() {
    // 계절 이벤트 발생 시 연결된 퀘스트 자동 시작
    EventBus.on('seasonalEvent', ({ eventId }) => this._onSeasonalEvent(eventId));

    // 아이템 획득 추적
    EventBus.on('cardPlaced',     ({ instanceId }) => this._onItemGained(instanceId));
    EventBus.on('lootConfirmed',  ()               => this._checkAllProgress());

    // 제작 완료 추적
    EventBus.on('craftComplete',  ({ blueprintId }) => this._onCraft(blueprintId));

    // 장착 변경 추적
    EventBus.on('equipChanged',   ({ slotId, instanceId }) => this._onEquip(slotId, instanceId));

    // 매일 survive_days 퀘스트 진행
    EventBus.on('tpAdvance',      () => this._onTpAdvance());
  },

  // ── 퀘스트 시작 ───────────────────────────────────────────────

  startQuest(questId) {
    const def = QUEST_DEFS[questId];
    if (!def) return;
    const gs = GameState;

    // 이미 완료된 퀘스트는 재시작 안 함
    if (gs.quests.completed.includes(questId)) return;
    // 이미 활성 중인 퀘스트는 무시
    if (gs.quests.active.find(q => q.id === questId)) return;

    const entry = {
      id:         questId,
      progress:   0,
      startDay:   gs.time.day,
      deadline:   gs.time.day + def.deadlineDays,
    };
    gs.quests.active.push(entry);

    EventBus.emit('questStarted', { questId, def });
    EventBus.emit('notify', { message: `📋 새 퀘스트: ${def.icon} ${def.title}`, type: 'info' });
    EventBus.emit('questListChanged', {});
  },

  // ── 이벤트 핸들러 ─────────────────────────────────────────────

  _onSeasonalEvent(eventId) {
    for (const def of Object.values(QUEST_DEFS)) {
      if (def.trigger === eventId) {
        this.startQuest(def.id);
      }
    }
  },

  _onItemGained(instanceId) {
    const def = GameState.getCardDef(instanceId);
    if (!def) return;
    this._updateCollectQuests(def);
  },

  _onCraft(blueprintId) {
    const bp = window.__GAME_DATA__?.blueprints?.[blueprintId];
    if (!bp) return;
    for (const q of GameState.quests.active) {
      const qDef = QUEST_DEFS[q.id];
      if (!qDef) continue;
      if (qDef.objective.type === 'craft_item') {
        if (!qDef.objective.category || bp.category === qDef.objective.category) {
          q.progress = Math.min(qDef.objective.count, q.progress + 1);
          this._checkCompletion(q, qDef);
        }
      }
    }
    EventBus.emit('questListChanged', {});
  },

  _onEquip(slotId, instanceId) {
    if (!instanceId) return;
    for (const q of GameState.quests.active) {
      const qDef = QUEST_DEFS[q.id];
      if (!qDef) continue;
      if (qDef.objective.type === 'equip_slot' && qDef.objective.slot === slotId) {
        q.progress = 1;
        this._checkCompletion(q, qDef);
      }
    }
    EventBus.emit('questListChanged', {});
  },

  _onTpAdvance() {
    const gs  = GameState;
    const day = gs.time.day;
    let changed = false;

    for (let i = gs.quests.active.length - 1; i >= 0; i--) {
      const q    = gs.quests.active[i];
      const qDef = QUEST_DEFS[q.id];
      if (!qDef) continue;

      // 기한 초과 → 실패 처리
      if (day > q.deadline) {
        gs.quests.active.splice(i, 1);
        EventBus.emit('notify', { message: `⏰ 퀘스트 기한 만료: ${qDef.title}`, type: 'warn' });
        changed = true;
        continue;
      }

      // survive_days 타입
      if (qDef.objective.type === 'survive_days') {
        const survived = day - q.startDay;
        q.progress = Math.min(qDef.objective.count, survived);
        this._checkCompletion(q, qDef);
        changed = true;
      }
    }

    if (changed) EventBus.emit('questListChanged', {});
  },

  // ── 진행 체크 ─────────────────────────────────────────────────

  _checkAllProgress() {
    for (const q of GameState.quests.active) {
      const qDef = QUEST_DEFS[q.id];
      if (!qDef) continue;
      const obj = qDef.objective;
      if (obj.type === 'collect_item') {
        const count = GameState.countOnBoard(obj.definitionId);
        q.progress  = Math.min(obj.count, count);
        this._checkCompletion(q, qDef);
      } else if (obj.type === 'collect_item_type') {
        const count = GameState.getBoardCards().filter(c => {
          const def = GameState.getCardDef(c.instanceId);
          return def?.tags?.includes(obj.itemType) || def?.subtype === obj.itemType;
        }).reduce((s, c) => s + (c.quantity ?? 1), 0);
        q.progress = Math.min(obj.count, count);
        this._checkCompletion(q, qDef);
      }
    }
    EventBus.emit('questListChanged', {});
  },

  _updateCollectQuests(itemDef) {
    for (const q of GameState.quests.active) {
      const qDef = QUEST_DEFS[q.id];
      if (!qDef) continue;
      const obj  = qDef.objective;
      if (obj.type === 'collect_item' && itemDef.id === obj.definitionId) {
        const count = GameState.countOnBoard(obj.definitionId);
        q.progress  = Math.min(obj.count, count);
        this._checkCompletion(q, qDef);
      }
    }
    EventBus.emit('questListChanged', {});
  },

  // ── 완료 처리 ─────────────────────────────────────────────────

  _checkCompletion(q, qDef) {
    if (q.progress < qDef.objective.count) return;
    const gs  = GameState;
    const idx = gs.quests.active.indexOf(q);
    if (idx === -1) return;

    gs.quests.active.splice(idx, 1);
    gs.quests.completed.push(q.id);

    // 보상 지급
    const r = qDef.reward;
    if (r.morale) gs.modStat('morale', r.morale);
    if (r.hp)     gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + r.hp);

    EventBus.emit('questCompleted', { questId: q.id, def: qDef });
    EventBus.emit('notify', { message: `✅ 퀘스트 완료: ${qDef.icon} ${qDef.title}`, type: 'good' });
    EventBus.emit('questListChanged', {});
  },

  // ── 공개 API ──────────────────────────────────────────────────

  getActiveQuests() {
    return GameState.quests.active.map(q => ({
      ...q,
      def: QUEST_DEFS[q.id],
    })).filter(q => q.def);
  },

  getQuestDef(questId) {
    return QUEST_DEFS[questId] ?? null;
  },
};

export default QuestSystem;
