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
//   type: 'collect_item' | 'collect_item_type' | 'craft_item' | 'kill_enemies' | 'survive_days' | 'equip_slot'
//       | 'survive_infection' | 'npc_quest_complete' | 'treat_npc' | 'track_infected' | 'rescue_npc' | 'visit_district'
//       | 'trigger_combo' (comboId 또는 comboIds 배열)
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
    // NPC 퀘스트 완료 시 npc_quest_complete 체크 (메인 퀘스트 크로스오버)
    EventBus.on('npcQuestCompleted', ({ npcId, questId }) => this._onNpcQuestCompleted(npcId, questId));
    // 시크릿 조합 적용 시 trigger_combo 체크
    EventBus.on('comboApplied', ({ comboId }) => this._onComboApplied(comboId));
  },

  /** 시크릿 조합 적용 추적 — trigger_combo 타입 퀘스트 진행도 증가 */
  _onComboApplied(comboId) {
    if (!comboId) return;
    let changed = false;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef || qDef.objective.type !== 'trigger_combo') continue;
      const obj = qDef.objective;
      const allow = Array.isArray(obj.comboIds) ? obj.comboIds : [obj.comboId];
      if (!allow.includes(comboId)) continue;
      q.progress = Math.min(obj.count ?? 1, q.progress + 1);
      this._checkCompletion(q, qDef);
      changed = true;
    }
    if (changed) EventBus.emit('questListChanged', {});
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
    // 의사 전용: 누적 환자 카운터 (엔딩 사기 보너스 + 마일스톤 알림)
    this._recordDoctorPatient(npcId);

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

  /**
   * 의사 플레이어 전용: NPC 치료 시마다 누적 카운터 증가.
   * 5명/10명/25명 마일스톤에서 내러티브 알림.
   * 최종 누적값은 엔딩 퀘스트 완료 시 사기 보너스로 환산 (getPatientMoraleBonus).
   */
  _recordDoctorPatient(npcId) {
    const gs = GameState;
    if (gs.player.characterId !== 'doctor') return;
    if (!gs.flags) gs.flags = {};

    const prev = gs.flags.doctor_patients_treated ?? 0;
    const next = prev + 1;
    gs.flags.doctor_patients_treated = next;

    // 중복 치료 방지 리스트 (같은 npcId의 반복 치료는 카운트하되 고유 목록만 유지)
    const roster = Array.isArray(gs.flags.doctor_patient_roster) ? gs.flags.doctor_patient_roster : [];
    if (npcId && !roster.includes(npcId)) {
      gs.flags.doctor_patient_roster = [...roster, npcId];
    }

    const milestones = {
      5:  '📖 다섯 번째 환자의 눈을 덮었다. 수첩 첫 페이지가 이름으로 채워졌다.',
      10: '📖 열 명. 의사의 손이 기억을 넘는 무게를 얹기 시작한다.',
      25: '📖 스물다섯 명. 보라매에 "의사가 있다"는 소문이 외곽까지 퍼졌다.',
      50: '📖 쉰 명. 이지수의 수첩은 단순한 기록이 아니라 이 도시의 생존 지도다.',
    };
    if (milestones[next]) {
      EventBus.emit('notify', { message: milestones[next], type: 'story' });
    }
  },

  /** 엔딩 완료 시 누적 환자 수를 사기 보너스로 환산 (0.5 / 명, 상한 50) */
  getPatientMoraleBonus() {
    const count = GameState.flags?.doctor_patients_treated ?? 0;
    return Math.min(50, Math.floor(count * 0.5));
  },

  /** NPC 퀘스트 완료 → 메인 퀘스트 크로스오버 진행도 */
  _onNpcQuestCompleted(npcId, questId) {
    let changed = false;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef || qDef.objective.type !== 'npc_quest_complete') continue;
      const targetNpc  = qDef.objective.npcId;
      const targetQuest = qDef.objective.questId;
      if (targetNpc && npcId !== targetNpc) continue;
      if (targetQuest && questId !== targetQuest) continue;
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
      startTp:    gs.time.totalTP ?? 0,
      deadline:   deadlineDays === Infinity ? Infinity : gs.time.day + deadlineDays,
    };
    // 처방전 시스템: def.prescriptionOptions = { symptomKey: definitionId } 맵이면
    // 시작 시 랜덤 증상 1개 선택 후 entry에 보관. _onCraft에서 매칭 체크.
    if (def.prescriptionOptions && typeof def.prescriptionOptions === 'object') {
      const keys = Object.keys(def.prescriptionOptions);
      if (keys.length > 0) {
        const picked = keys[Math.floor(Math.random() * keys.length)];
        entry.prescription = picked;
        entry.prescriptionMatched = false;
      }
    }

    gs.quests.active.push(entry);

    // 메인 퀘스트 내러티브 알림
    if (def.narrative?.start) {
      EventBus.emit('notify', { message: `📖 ${def.narrative.start}`, type: 'story' });
    }

    // 처방전 증상 알림 (플레이어가 어떤 약품을 제작해야 하는지 안내)
    if (entry.prescription && def.prescriptionLabels) {
      const label = def.prescriptionLabels[entry.prescription];
      if (label) {
        EventBus.emit('notify', {
          message: `📋 진료 요청 — ${label} (일치하는 약품 제작 시 골든 타임 보너스)`,
          type: 'info',
        });
      }
    }

    // 크로스오버 퀘스트 소급 적용: 타깃 NPC 퀘스트가 이미 완료됐다면 즉시 진행도 반영
    if (def.objective?.type === 'npc_quest_complete' && def.objective.questId) {
      const flagKey = `npcQuest_done_${def.objective.questId}`;
      if (gs.flags?.[flagKey]) {
        entry.progress = def.objective.count ?? 1;
        this._checkCompletion(entry, def);
      }
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
    const outDefId = Array.isArray(bp.output) ? bp.output[0]?.definitionId : null;
    for (const q of GameState.quests.active) {
      const qDef = _getQuestDef(q.id);
      if (!qDef) continue;

      // 처방전 매칭: 이 퀘스트에 증상이 배정되어 있고 output이 일치하면 flag 세팅
      if (q.prescription && qDef.prescriptionOptions && outDefId) {
        const required = qDef.prescriptionOptions[q.prescription];
        if (outDefId === required && !q.prescriptionMatched) {
          q.prescriptionMatched = true;
          EventBus.emit('notify', {
            message: '⭐ 처방전 일치 — 증상과 약품이 맞았다. 완료 시 추가 보상.',
            type: 'good',
          });
        }
      }

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

    // ①.1 이지수 전용: 탈출 선택 후과 (Day 5)
    this._checkDoctorAftermath(gs, day);

    // ①.2 이지수 전용: 보라매 약품 고갈 (Day 10)
    this._checkBoramaeDepletion(gs, day);

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

      // survive_infection 타입 — 감염 수치 ≥ minInfection 상태로 count일 연속 버티기
      if (qDef.objective.type === 'survive_infection') {
        const minInf = qDef.objective.minInfection ?? 5;
        const curInf = gs.stats.infection?.current ?? 0;
        if (curInf >= minInf) {
          if (q.streakStartDay == null) q.streakStartDay = day;
          q.progress = Math.min(qDef.objective.count, day - q.streakStartDay);
          this._checkCompletion(q, qDef);
        } else {
          // 연속성 깨짐 → 리셋
          q.streakStartDay = null;
          q.progress = 0;
        }
        changed = true;
      }
    }

    if (changed) EventBus.emit('questListChanged', {});
  },

  // ── 이지수 전용 이벤트 ───────────────────────────────────────

  /**
   * 박상훈 하사를 버리고 탈출한 경우 Day 5에 한 번만 사망 일지 이벤트 발생.
   * morale 감소, trauma 누적, 간호사 trust -1 (초기 신뢰 페널티).
   */
  _checkDoctorAftermath(gs, day) {
    if (gs.player.characterId !== 'doctor') return;
    if (!gs.flags.abandoned_soldier) return;
    if (gs.flags.abandoned_soldier_aftermath_done) return;
    if (day < 5) return;

    gs.flags.abandoned_soldier_aftermath_done = true;
    gs.modStat('morale', -15);
    if (gs.mental) gs.mental.trauma = Math.min(100, (gs.mental.trauma ?? 0) + 10);

    // 간호사 trust 페널티 (시작 신뢰 감소)
    const nurseState = gs.npcs?.states?.npc_nurse;
    if (nurseState && (nurseState.trust ?? 0) > 0) {
      nurseState.trust = Math.max(0, (nurseState.trust ?? 0) - 1);
    }

    EventBus.emit('notify', {
      message: '📖 보라매 응급실 옆 복도에서 메모가 발견됐다. "박상훈, 사망 추정. 의사가 문을 열어주지 않았다고…" 간호사가 말을 잃었다. (사기 -15, 트라우마 +10, 간호사 신뢰 -1)',
      type: 'story',
    });
  },

  /**
   * Day 10에 보라매병원 약품이 바닥을 드러낸다 (이지수 전용).
   * 이후 보라매 서브로케이션 lootCount가 영구 -1 되고, 세브란스(신촌) 원정의 당위성이 부각된다.
   */
  _checkBoramaeDepletion(gs, day) {
    if (gs.player.characterId !== 'doctor') return;
    if (gs.flags.boramae_depleted) return;
    if (day < 10) return;

    gs.flags.boramae_depleted = true;
    EventBus.emit('notify', {
      message: '📦 보라매 약품 창고가 바닥을 드러냈다. "선생님… 이제 남은 건 뜯지도 못한 앰풀 몇 개뿐이에요." 이후 보라매 수색량이 줄고, 신촌 세브란스 원정이 더욱 시급해졌다.',
      type: 'story',
    });
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

      // 의사 엔딩 도달 시: 누적 환자 수 → 사기 보너스 (P5)
      if (r.flags.mainQuestComplete_doctor && gs.player.characterId === 'doctor') {
        const bonus = this.getPatientMoraleBonus();
        const count = gs.flags.doctor_patients_treated ?? 0;
        if (bonus > 0) {
          gs.modStat('morale', bonus);
          EventBus.emit('notify', {
            message: `📖 엔딩 기록 — 누적 환자 ${count}명. 의사의 길이 사기 +${bonus} 로 환산됐다.`,
            type: 'good',
          });
        }
      }
    }

    // 보너스 조건 체크 (골든 타임 등) — 통과 시 bonusReward 추가 지급
    const bonusGranted = this._applyBonusIfMet(q, qDef);

    // 메인 퀘스트 내러티브 완료 알림
    const completeNarrative = bonusGranted && qDef.narrative?.completeBonus
      ? qDef.narrative.completeBonus
      : qDef.narrative?.complete;
    if (completeNarrative) {
      EventBus.emit('notify', { message: `📖 ${completeNarrative}`, type: 'story' });
    }

    // 동반자 에필로그 대사 (P6) — bonusGranted 여부로 분기
    if (qDef.companionEpilogue) {
      const key = bonusGranted ? 'success' : 'default';
      const line = qDef.companionEpilogue[key] ?? qDef.companionEpilogue.default;
      if (line) EventBus.emit('notify', { message: `🗨️ ${line}`, type: 'story' });
    }

    const compTitle = qDef.titleKey ? I18n.t(qDef.titleKey) : qDef.title;
    EventBus.emit('questCompleted', { questId: q.id, def: qDef, bonusGranted });
    EventBus.emit('notify', { message: I18n.t('quest.completed', { icon: qDef.icon, title: compTitle }), type: 'good' });
    EventBus.emit('questListChanged', {});

    // 플래시백 트리거 (엔지니어 아버지 회상 — 각 1회성)
    this._triggerFlashbackIfAny(q.id);

    // 분기 선택 이벤트 (완료 후 발화)
    if (qDef.isBranchPoint && qDef.branchOptions) {
      EventBus.emit('branchChoice', { options: qDef.branchOptions, questId: q.id });
    }
  },

  /**
   * 보너스 조건 평가 + bonusReward 지급.
   * 지원 조건:
   *   { type: 'completeWithinTp', count: N }  — 퀘스트 시작 후 N TP 이내 완료
   *   { type: 'completeWithinDays', count: N } — 퀘스트 시작 후 N일 이내 완료
   *   { type: 'prescriptionMatch' }            — 처방전 증상-약품 매칭 성공
   */
  _applyBonusIfMet(q, qDef) {
    const cond = qDef.bonusCondition;
    const bonus = qDef.bonusReward;
    if (!cond || !bonus) return false;

    const gs = GameState;
    let met = false;
    if (cond.type === 'completeWithinTp') {
      const elapsed = (gs.time.totalTP ?? 0) - (q.startTp ?? 0);
      met = elapsed <= (cond.count ?? 0);
    } else if (cond.type === 'completeWithinDays') {
      const elapsed = gs.time.day - q.startDay;
      met = elapsed <= (cond.count ?? 0);
    } else if (cond.type === 'prescriptionMatch') {
      met = q.prescriptionMatched === true;
    }
    if (!met) return false;

    if (bonus.morale) gs.modStat('morale', bonus.morale);
    if (bonus.hp)     gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + bonus.hp);
    if (bonus.items) {
      for (const item of bonus.items) {
        for (let n = 0; n < (item.qty ?? 1); n++) {
          const instId = gs.createCardInstance(item.definitionId);
          if (instId) gs.placeCardInRow(instId);
        }
      }
    }
    if (bonus.flags) {
      for (const [key, val] of Object.entries(bonus.flags)) {
        gs.flags[key] = val;
      }
    }

    EventBus.emit('notify', {
      message: `⭐ 골든 타임 달성! ${bonus.label ?? '추가 보상 획득.'}`,
      type: 'good',
    });
    return true;
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
