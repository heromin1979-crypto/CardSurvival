// === QUEST SYSTEM ===
// 계절별 이벤트 연동 퀘스트 + 캐릭터 메인 퀘스트 체인
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import MAIN_QUESTS from '../data/mainQuests/index.js';
import GameData   from '../data/GameData.js';
import NPCSystem  from './NPCSystem.js';
import { QUEST_TO_FLASHBACK } from '../data/cinematicScenes.js';

// ── 계절 퀘스트 정의 ────────────────────────────────────────────────
// trigger: 연결된 seasonalEvent id (해당 이벤트 발생 시 자동 시작)
// objective: { type, target, count }
//   type: 'collect_item' | 'craft_item' | 'kill_enemies' | 'survive_days' | 'equip_slot'
// reward: { morale?, hp? }
const QUEST_DEFS = {
  spring_water: {
    id:      'spring_water',
    titleKey: 'quest.waterStockTitle',
    descKey:  'quest.waterStockDesc',
    icon:    '💧',
    trigger: 'spring_rain',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    reward:  { morale: 10 },
    deadlineDays: 14,
  },

  spring_gear: {
    id:      'spring_gear',
    titleKey: 'quest.defenseTitle',
    descKey:  'quest.defenseDesc',
    icon:    '😷',
    trigger: 'spring_pollen',
    objective: { type: 'equip_slot', slot: 'face', count: 1 },
    reward:  { morale: 8 },
    deadlineDays: 10,
  },

  summer_water_stockpile: {
    id:      'summer_water_stockpile',
    titleKey: 'quest.heatWaterTitle',
    descKey:  'quest.heatWaterDesc',
    icon:    '🌊',
    trigger: 'summer_start',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 10 },
    reward:  { morale: 15 },
    deadlineDays: 20,
  },

  summer_structure: {
    id:      'summer_structure',
    titleKey: 'quest.coolStructTitle',
    descKey:  'quest.coolStructDesc',
    icon:    '🏗',
    trigger: 'monsoon',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward:  { morale: 12, hp: 10 },
    deadlineDays: 30,
  },

  autumn_food: {
    id:      'autumn_food',
    titleKey: 'quest.harvestTitle',
    descKey:  'quest.harvestDesc',
    icon:    '🌾',
    trigger: 'autumn_harvest',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward:  { morale: 15 },
    deadlineDays: 30,
  },

  winter_warmth: {
    id:      'winter_warmth',
    titleKey: 'quest.winterPrepTitle',
    descKey:  'quest.winterPrepDesc',
    icon:    '🧥',
    trigger: 'winter_start',
    objective: { type: 'equip_slot', slot: 'body', count: 1 },
    reward:  { morale: 10, hp: 15 },
    deadlineDays: 10,
  },

  winter_survive: {
    id:      'winter_survive',
    titleKey: 'quest.coldSurvTitle',
    descKey:  'quest.coldSurvDesc',
    icon:    '🥶',
    trigger: 'extreme_cold',
    objective: { type: 'survive_days', count: 10 },
    reward:  { morale: 20, hp: 20 },
    deadlineDays: 15,
  },
};

// ── 통합 퀘스트 조회 ────────────────────────────────────────────────
function _getQuestDef(questId) {
  return QUEST_DEFS[questId] ?? MAIN_QUESTS[questId] ?? null;
}

// ── 시스템 ────────────────────────────────────────────────────────
const QuestSystem = {
  init() {
    // 계절 이벤트 발생 시 연결된 퀘스트 자동 시작
    EventBus.on('seasonalEvent', ({ eventId }) => this._onSeasonalEvent(eventId));

    // 아이템 획득 추적 (collect_item + collect_item_type 모두 처리)
    EventBus.on('cardPlaced',     ({ instanceId }) => this._onItemGained(instanceId));

    // 제작 완료 추적
    EventBus.on('craftComplete',  ({ blueprintId }) => this._onCraft(blueprintId));

    // 장착 변경 추적
    EventBus.on('equipChanged',   ({ slotId, instanceId }) => this._onEquip(slotId, instanceId));

    // 매일 survive_days 퀘스트 진행 + 메인 퀘스트 트리거 체크
    EventBus.on('tpAdvance',      () => this._onTpAdvance());

    // 지역 이동 시 visit_district 퀘스트 체크
    EventBus.on('districtChanged', ({ districtId }) => this._onDistrictChanged(districtId));

    // 세이브 로드 시 진행도 재계산
    EventBus.on('loaded', () => this._checkAllProgress());

    // 베이스캠프 진입 시 즉시 메인 퀘스트 트리거 체크 (Day 1 포함)
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'main') this._checkMainQuestTriggers();
    });

    // 분기 선택 완료 시 즉시 다음 퀘스트 트리거 체크
    EventBus.on('branchChosen', () => this._checkMainQuestTriggers());

    // 적 처치 시 track_infected 체크 (감염자/보스 추적)
    EventBus.on('enemyKilled',    ({ enemyId, enemyType }) => this._onEnemyKilled(enemyId, enemyType));
    // NPC 치료 시 treat_npc 체크
    EventBus.on('npcHealed',      ({ npcId }) => this._onNpcHealed(npcId));
    // 랜드마크 노드 정리 시 rescue_npc 체크 (약탈자 소굴 소탕 등)
    EventBus.on('landmarkCleared',({ landmarkId, rescuedNpcId }) => this._onLandmarkCleared(landmarkId, rescuedNpcId));
  },

  /** 감염자/특정 적 처치 추적 */
  _onEnemyKilled(enemyId, enemyType) {
    let changed = false;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef || qDef.objective.type !== 'track_infected') continue;
      const targetType = qDef.objective.enemyType;
      const targetId   = qDef.objective.enemyId;
      if (targetType && enemyType !== targetType) continue;
      if (targetId && enemyId !== targetId) continue;
      q.progress = Math.min(qDef.objective.count, q.progress + 1);
      this._checkCompletion(q, qDef);
      changed = true;
    }
    if (changed) EventBus.emit('questListChanged', {});
  },

  /** NPC 치료 진행도 */
  _onNpcHealed(npcId) {
    let changed = false;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef || qDef.objective.type !== 'treat_npc') continue;
      const targetNpc = qDef.objective.npcId;
      if (targetNpc && npcId !== targetNpc) continue;
      q.progress = Math.min(qDef.objective.count ?? 1, q.progress + 1);
      this._checkCompletion(q, qDef);
      changed = true;
    }
    if (changed) EventBus.emit('questListChanged', {});
  },

  /** 랜드마크 소탕/NPC 구출 진행도 */
  _onLandmarkCleared(landmarkId, rescuedNpcId) {
    let changed = false;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef || qDef.objective.type !== 'rescue_npc') continue;
      if (qDef.objective.landmarkId && landmarkId !== qDef.objective.landmarkId) continue;
      if (qDef.objective.npcId && rescuedNpcId !== qDef.objective.npcId) continue;
      q.progress = Math.min(qDef.objective.count ?? 1, q.progress + 1);
      this._checkCompletion(q, qDef);
      changed = true;
    }
    if (changed) EventBus.emit('questListChanged', {});
  },

  // ── 퀘스트 시작 ───────────────────────────────────────────────

  startQuest(questId) {
    const def = _getQuestDef(questId);
    if (!def) return;
    const gs = GameState;

    // 이미 완료된 퀘스트는 재시작 안 함
    if (gs.quests.completed.includes(questId)) return;
    // 이미 활성 중인 퀘스트는 무시
    if (gs.quests.active.find(q => q.id === questId)) return;

    const deadlineDays = def.deadlineDays ?? Infinity;
    const entry = {
      id:         questId,
      progress:   0,
      startDay:   gs.time.day,
      deadline:   deadlineDays === Infinity ? Infinity : gs.time.day + deadlineDays,
    };
    gs.quests.active.push(entry);

    // 메인 퀘스트 내러티브 알림
    if (def.narrative?.start) {
      EventBus.emit('notify', { message: `📖 ${def.narrative.start}`, type: 'story' });
    }

    EventBus.emit('questStarted', { questId, def });
    const title = def.titleKey ? I18n.t(def.titleKey) : def.title;
    EventBus.emit('notify', { message: I18n.t('quest.newQuest', { icon: def.icon, title }), type: 'info' });
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
    this._updateCollectTypeQuests(def);
  },

  _onCraft(blueprintId) {
    const bp = GameData?.blueprints?.[blueprintId];
    if (!bp) return;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
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
      const qDef = _getQuestDef(q.id);
      if (!qDef) continue;
      if (qDef.objective.type === 'equip_slot' && qDef.objective.slot === slotId) {
        q.progress = 1;
        this._checkCompletion(q, qDef);
      }
    }
    EventBus.emit('questListChanged', {});
  },

  /** 지역 이동 시 visit_district 목표 체크 */
  _onDistrictChanged(districtId) {
    if (!districtId) return;
    let changed = false;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef) continue;
      if (qDef.objective.type === 'visit_district' && qDef.objective.districtId === districtId) {
        q.progress = 1;
        this._checkCompletion(q, qDef);
        changed = true;
      }
    }
    if (changed) EventBus.emit('questListChanged', {});
  },

  _onTpAdvance() {
    const gs  = GameState;
    const day = gs.time.day;
    let changed = false;

    // ① 메인 퀘스트 자동 시작 체크
    this._checkMainQuestTriggers();

    for (let i = gs.quests.active.length - 1; i >= 0; i--) {
      const q    = gs.quests.active[i];
      const qDef = _getQuestDef(q.id);
      if (!qDef) continue;

      // 기한 초과 → 실패 처리
      if (q.deadline !== Infinity && day > q.deadline) {
        gs.quests.active.splice(i, 1);

        // 실패 패널티 적용
        const fp = qDef.failPenalty;
        if (fp?.morale) gs.modStat('morale', fp.morale);

        const expTitle = qDef.titleKey ? I18n.t(qDef.titleKey) : qDef.title;
        EventBus.emit('notify', { message: I18n.t('quest.expired', { title: expTitle }), type: 'warn' });
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

  // ── 메인 퀘스트 자동 시작 ─────────────────────────────────────

  /** characterId + prerequisite + dayTrigger 3중 체크 */
  _checkMainQuestTriggers() {
    const gs  = GameState;
    const day = gs.time.day;
    const charId = gs.player.characterId;
    if (!charId) return;

    for (const def of Object.values(MAIN_QUESTS)) {
      // 캐릭터 필터
      if (def.characterId && def.characterId !== charId) continue;
      // 이미 완료/활성
      if (gs.quests.completed.includes(def.id)) continue;
      if (gs.quests.active.find(q => q.id === def.id)) continue;
      // 날짜 조건
      if (day < def.dayTrigger) continue;
      // 선행 퀘스트 조건 (alternativePrerequisites: OR 분기 지원)
      if (def.alternativePrerequisites) {
        const anyMet = def.alternativePrerequisites.some(
          preId => gs.quests.completed.includes(preId),
        );
        if (!anyMet) continue;
      } else if (def.prerequisite && !gs.quests.completed.includes(def.prerequisite)) {
        continue;
      }
      // 분기 플래그 조건
      if (def.requiresFlag && !gs.flags[def.requiresFlag]) continue;
      // 다중 플래그 AND 조건 (병렬 퀘스트 완료 후 합류 퀘스트용)
      if (def.requiresAllFlags) {
        const allMet = def.requiresAllFlags.every(flag => gs.flags[flag]);
        if (!allMet) continue;
      }

      this.startQuest(def.id);
    }
  },

  // ── 진행 체크 ─────────────────────────────────────────────────

  _checkAllProgress() {
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
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
      } else if (obj.type === 'visit_district') {
        // visit_district: 이미 방문한 곳이면 즉시 완료
        if (GameState.location.districtsVisited?.includes(obj.districtId)) {
          q.progress = 1;
          this._checkCompletion(q, qDef);
        }
      }
    }
    EventBus.emit('questListChanged', {});
  },

  _updateCollectQuests(itemDef) {
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
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

  _updateCollectTypeQuests(itemDef) {
    const hasMatch = itemDef.tags || itemDef.subtype;
    if (!hasMatch) return;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef) continue;
      const obj = qDef.objective;
      if (obj.type !== 'collect_item_type') continue;
      if (!itemDef.tags?.includes(obj.itemType) && itemDef.subtype !== obj.itemType) continue;
      const count = GameState.getBoardCards()
        .filter(c => {
          const d = GameState.getCardDef(c.instanceId);
          return d?.tags?.includes(obj.itemType) || d?.subtype === obj.itemType;
        })
        .reduce((s, c) => s + (c.quantity ?? 1), 0);
      q.progress = Math.min(obj.count, count);
      this._checkCompletion(q, qDef);
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

    // 아이템 보상
    if (r.items) {
      for (const item of r.items) {
        for (let n = 0; n < (item.qty ?? 1); n++) {
          const instId = gs.createCardInstance(item.definitionId);
          if (instId) gs.placeCardInRow(instId);
        }
      }
    }

    // 플래그 보상
    if (r.flags) {
      for (const [key, val] of Object.entries(r.flags)) {
        gs.flags[key] = val;
      }
    }

    // 메인 퀘스트 내러티브 완료 알림
    if (qDef.narrative?.complete) {
      EventBus.emit('notify', { message: `📖 ${qDef.narrative.complete}`, type: 'story' });
    }

    const compTitle = qDef.titleKey ? I18n.t(qDef.titleKey) : qDef.title;
    EventBus.emit('questCompleted', { questId: q.id, def: qDef });
    EventBus.emit('notify', { message: I18n.t('quest.completed', { icon: qDef.icon, title: compTitle }), type: 'good' });
    EventBus.emit('questListChanged', {});

    // 플래시백 트리거 (엔지니어 아버지 회상 — 각 1회성)
    this._triggerFlashbackIfAny(q.id);

    // 분기 선택 이벤트 (완료 후 발화)
    if (qDef.isBranchPoint && qDef.branchOptions) {
      EventBus.emit('branchChoice', { options: qDef.branchOptions, questId: q.id });
    }
  },

  /** 퀘스트 완료 시 매핑된 플래시백을 1회 재생 */
  _triggerFlashbackIfAny(questId) {
    const sceneId = QUEST_TO_FLASHBACK[questId];
    if (!sceneId) return;

    const gs = GameState;
    const flagKey = `_flashback_${sceneId}_played`;
    if (gs.flags[flagKey]) return;

    // 엔지니어 캐릭터 한정 (다른 캐릭터에서는 동일 questId가 없지만 안전망)
    if (gs.player.characterId && gs.player.characterId !== 'engineer') return;

    gs.flags = { ...gs.flags, [flagKey]: true };
    EventBus.emit('showCinematic', { sceneId });
  },

  // ── 공개 API ──────────────────────────────────────────────────

  getActiveQuests() {
    return GameState.quests.active.map(q => ({
      ...q,
      def: _getQuestDef(q.id),
    })).filter(q => q.def);
  },

  getQuestDef(questId) {
    return _getQuestDef(questId);
  },
};

export default QuestSystem;
