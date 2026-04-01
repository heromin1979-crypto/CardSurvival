// === MENTAL SYSTEM ===
// 불안(anxiety), 외로움(loneliness), 트라우마(trauma) 3축 심리 시스템.
// 기존 morale과 공존하여 캐릭터별 차별화 + 생존 딜레마 강화.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import { DISTRICTS } from '../data/districts.js';
import NightSystem   from './NightSystem.js';

// ── 캐릭터별 심리 특성 ───────────────────────────────────────
const MENTAL_TRAITS = {
  doctor:      { anxietyResist: 0.8,  traumaRecovery: 1.5, lonelinessBase: 1.0, ability: 'self_therapy' },
  soldier:     { anxietyResist: 0.5,  traumaRecovery: 0.7, lonelinessBase: 0.8, ability: 'battle_calm' },
  chef:        { anxietyResist: 1.0,  traumaRecovery: 1.0, lonelinessBase: 1.3, ability: 'comfort_food' },
  teacher:     { anxietyResist: 1.2,  traumaRecovery: 1.0, lonelinessBase: 1.5, ability: 'journaling' },
  student:     { anxietyResist: 1.5,  traumaRecovery: 1.3, lonelinessBase: 1.8, ability: 'adaptability' },
  engineer:    { anxietyResist: 0.9,  traumaRecovery: 0.8, lonelinessBase: 0.7, ability: 'problem_solving' },
  firefighter: { anxietyResist: 0.6,  traumaRecovery: 0.9, lonelinessBase: 0.9, ability: 'courage' },
  homeless:    { anxietyResist: 0.7,  traumaRecovery: 0.6, lonelinessBase: 0.5, ability: 'solitude' },
  pharmacist:  { anxietyResist: 0.9,  traumaRecovery: 1.2, lonelinessBase: 1.1, ability: 'calm_mind' },
};

// ── 불안 효과 티어 ────────────────────────────────────────────
const ANXIETY_TIERS = [
  { max: 30, label: 'stable',  exploreTpExtra: 0, combatAccBonus: 0,    fleeBonus: 0 },
  { max: 60, label: 'anxious', exploreTpExtra: 1, combatAccBonus: -0.05, fleeBonus: 0 },
  { max: 80, label: 'panic',   exploreTpExtra: 1, combatAccBonus: -0.10, fleeBonus: 0.10 },
  { max: 101, label: 'crisis', exploreTpExtra: 2, combatAccBonus: -0.15, fleeBonus: 0.15 },
];

// ── 트라우마 효과 티어 ────────────────────────────────────────
const TRAUMA_TIERS = [
  { max: 20, label: 'healthy',  combatFreezeChance: 0,    nightmareChance: 0,    moraleMult: 1.0 },
  { max: 40, label: 'stressed', combatFreezeChance: 0,    nightmareChance: 0,    moraleMult: 1.0 },
  { max: 60, label: 'scarred',  combatFreezeChance: 0.05, nightmareChance: 0.02, moraleMult: 1.3 },
  { max: 80, label: 'severe',   combatFreezeChance: 0.15, nightmareChance: 0.05, moraleMult: 1.5 },
  { max: 101, label: 'broken',  combatFreezeChance: 0.20, nightmareChance: 0.08, moraleMult: 2.0 },
];

const MentalSystem = {
  _lastWarningTP: 0,

  init() {
    EventBus.on('tpAdvance', () => this._onTP());
    // 전투 관련 트리거
    EventBus.on('combatStarted', () => this._onCombatStart());
    EventBus.on('playerHit', ({ damage }) => this._onPlayerHit(damage));
    EventBus.on('combatEnded', ({ outcome }) => this._onCombatEnd(outcome));
    // 질병 진단
    EventBus.on('diseaseContracted', ({ diseaseId }) => this._onDisease(diseaseId));
  },

  // ── 초기화 ───────────────────────────────────────────────────

  ensureInitialized() {
    const gs = GameState;
    if (gs.mental) return;
    gs.mental = {
      anxiety:    0,
      loneliness: 0,
      trauma:     0,
    };
  },

  // ── TP 콜백 ──────────────────────────────────────────────────

  _onTP() {
    this.ensureInitialized();
    const gs = GameState;
    const m  = gs.mental;
    const traits = this._getTraits();

    // ── 불안 ──────────────────────────────────────────────
    const distId = gs.location.currentDistrict;
    const dist   = DISTRICTS[distId];
    const danger = dist?.dangerLevel ?? 1;
    const hour   = gs.time?.hour ?? 12;
    const noise  = gs.noise?.level ?? 0;
    const diseaseCount = gs.player.diseases?.length ?? 0;

    let anxietyDelta = 0;
    // 증가 요인
    if (danger >= 3) anxietyDelta += 0.3;
    if (noise > 50)  anxietyDelta += 0.2;
    if (diseaseCount > 0) anxietyDelta += 0.1 * diseaseCount;
    if (NightSystem.isNight()) anxietyDelta += 0.1;  // 야간

    // 감소 요인
    if (danger <= 1) anxietyDelta -= 0.3;
    const isBasecamp = gs.ui.currentState === 'basecamp';
    if (isBasecamp) anxietyDelta -= 0.5;
    // 광원(캠프파이어·횃불·램프 등) 존재 시 감소
    if (NightSystem.hasLightSource()) anxietyDelta -= 0.2;

    // 캐릭터 특성 적용
    if (anxietyDelta > 0) anxietyDelta *= traits.anxietyResist;

    m.anxiety = Math.max(0, Math.min(100, m.anxiety + anxietyDelta));

    // ── 외로움 ────────────────────────────────────────────
    let lonelyDelta = 0.1 * traits.lonelinessBase;  // 기본 증가

    // NPC 동행 시 감소 (Feature 6 연동 — NPC 시스템이 없으면 0)
    const companionCount = gs.companions?.length ?? 0;
    if (companionCount > 0) lonelyDelta -= 0.3 * companionCount;

    // 라디오 아이템 보유 시 감소
    const hasRadio = gs.getBoardCards().some(c => c.definitionId === 'radio' || c.definitionId === 'broken_radio');
    if (hasRadio) lonelyDelta -= 0.05;

    m.loneliness = Math.max(0, Math.min(100, m.loneliness + lonelyDelta));

    // ── 트라우마 ──────────────────────────────────────────
    // 트라우마는 이벤트성 증가 (onTP에서는 감소만)
    let traumaDelta = -0.02 * traits.traumaRecovery;  // 자연 감소

    // 안전한 곳에서 대기 시 추가 감소
    if (isBasecamp && danger <= 1) traumaDelta -= 0.05;
    // 의사 자가 치료 (의료 Lv.4+)
    if (traits.ability === 'self_therapy' && (gs.player.skills?.medicine?.level ?? 0) >= 4) {
      traumaDelta -= 0.05;
    }

    m.trauma = Math.max(0, Math.min(100, m.trauma + traumaDelta));

    // ── 심리 → 사기 연동 ──────────────────────────────────
    // 높은 외로움은 사기 감쇠 가속
    if (m.loneliness > 30) {
      const extraDecay = m.loneliness > 50 ? -0.2 : -0.1;
      gs.modStat('morale', extraDecay);
    }

    // 높은 트라우마는 사기 감쇠 가속
    const traumaTier = this.getTraumaTier();
    if (traumaTier.moraleMult > 1.0) {
      const extraMoraleDecay = -0.1 * (traumaTier.moraleMult - 1.0);
      gs.modStat('morale', extraMoraleDecay);
    }

    // ── 악몽 이벤트 (야간, 트라우마 기반) ──────────────────
    if (NightSystem.isNight() && Math.random() < traumaTier.nightmareChance) {
      gs.modStat('fatigue', 3);
      m.anxiety = Math.min(100, m.anxiety + 5);
      EventBus.emit('notify', { message: I18n.t('mental.nightmare'), type: 'danger' });
    }

    // ── 환각 이벤트 (외로움 50+, 낮은 확률) ────────────────
    if (m.loneliness > 50 && Math.random() < 0.005) {
      EventBus.emit('notify', { message: I18n.t('mental.hallucination'), type: 'warn' });
      m.anxiety = Math.min(100, m.anxiety + 3);
    }

    // ── 경고 알림 (30TP마다) ─────────────────────────────
    const totalTP = gs.time?.totalTP ?? 0;
    if (totalTP - this._lastWarningTP >= 30) {
      if (m.anxiety >= 60) {
        EventBus.emit('notify', { message: I18n.t('mental.anxietyWarn'), type: 'warn' });
        this._lastWarningTP = totalTP;
      }
      if (m.loneliness >= 60) {
        EventBus.emit('notify', { message: I18n.t('mental.lonelyWarn'), type: 'warn' });
        this._lastWarningTP = totalTP;
      }
    }
  },

  // ── 전투 이벤트 핸들러 ────────────────────────────────────

  _onCombatStart() {
    this.ensureInitialized();
    const m = GameState.mental;
    const traits = this._getTraits();
    if (traits.ability !== 'battle_calm') {
      m.anxiety = Math.min(100, m.anxiety + 5 * traits.anxietyResist);
    }
  },

  _onPlayerHit(damage) {
    this.ensureInitialized();
    const m = GameState.mental;
    if (damage >= 15) m.trauma = Math.min(100, m.trauma + 3);
    if (damage >= 20) m.trauma = Math.min(100, m.trauma + 2);  // 추가
    // HP 30% 이하 경험
    const hpPct = GameState.player.hp.current / GameState.player.hp.max;
    if (hpPct < 0.3) m.trauma = Math.min(100, m.trauma + 5);
  },

  _onCombatEnd(outcome) {
    this.ensureInitialized();
    const m = GameState.mental;
    if (outcome === 'fled') {
      m.trauma = Math.min(100, m.trauma + 2);
      m.anxiety = Math.min(100, m.anxiety + 3);
    }
    if (outcome === 'victory') {
      // 전투 승리 시 약간의 불안 감소
      m.anxiety = Math.max(0, m.anxiety - 2);
    }
    // 혼자 전투 = 외로움 증가
    m.loneliness = Math.min(100, m.loneliness + 1);
  },

  _onDisease(diseaseId) {
    this.ensureInitialized();
    const m = GameState.mental;
    const severe = ['sepsis', 'cholera', 'radiation_sickness'];
    if (severe.includes(diseaseId)) {
      m.trauma = Math.min(100, m.trauma + 8);
    } else {
      m.trauma = Math.min(100, m.trauma + 3);
    }
  },

  // ── 공개 API ─────────────────────────────────────────────────

  getAnxietyTier() {
    this.ensureInitialized();
    const val = GameState.mental.anxiety;
    for (const tier of ANXIETY_TIERS) {
      if (val < tier.max) return tier;
    }
    return ANXIETY_TIERS[ANXIETY_TIERS.length - 1];
  },

  getTraumaTier() {
    this.ensureInitialized();
    const val = GameState.mental.trauma;
    for (const tier of TRAUMA_TIERS) {
      if (val < tier.max) return tier;
    }
    return TRAUMA_TIERS[TRAUMA_TIERS.length - 1];
  },

  /** 전투 시 행동 불능 확률 (트라우마) */
  rollCombatFreeze() {
    const tier = this.getTraumaTier();
    return Math.random() < tier.combatFreezeChance;
  },

  /** 탐색 시 추가 TP (불안) */
  getExploreTpExtra() {
    return this.getAnxietyTier().exploreTpExtra;
  },

  /** 전투 정확도 보정 (불안) */
  getCombatAccuracyBonus() {
    return this.getAnxietyTier().combatAccBonus;
  },

  /** 도주 확률 보너스 (불안 — 높으면 도주 잘함) */
  getFleeBonus() {
    return this.getAnxietyTier().fleeBonus;
  },

  getMentalState() {
    this.ensureInitialized();
    return { ...GameState.mental };
  },

  /**
   * 외부 이벤트로 불안 수치를 변경. 증가 시 anxietyResist 특성 적용.
   * @param {number} delta — 양수=증가, 음수=감소
   */
  modifyAnxiety(delta) {
    this.ensureInitialized();
    const m = GameState.mental;
    const traits = this._getTraits();
    const effective = delta > 0 ? delta * traits.anxietyResist : delta;
    m.anxiety = Math.max(0, Math.min(100, m.anxiety + effective));
  },

  // ── 내부 ─────────────────────────────────────────────────────

  _getTraits() {
    const charId = GameState.player.characterId;
    return MENTAL_TRAITS[charId] ?? MENTAL_TRAITS.doctor;
  },
};

export { MENTAL_TRAITS, ANXIETY_TIERS, TRAUMA_TIERS };
export default MentalSystem;
