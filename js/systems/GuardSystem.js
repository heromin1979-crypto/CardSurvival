// === GUARD SYSTEM (T3) ===
// 완치된 NPC 중 contributionOnCure.type === 'guard'인 페르소나를 보라매병원에 상주 배치.
//
// 책임:
//   - 수비대 로스터 및 defenseRating 관리 (GameState.hospital 슬라이스)
//   - 매일 식량 소모 (foodCostPerDay 합산) + 부족 시 자동 이탈
//   - HospitalSiegeSystem(Phase 4)이 발행하는 siegeTriggered 이벤트에 응답
//     - defenseRating vs threat 비교 → siegeResolved 발행
//     - 패배 시 casualties 1~2명 → guardKilled 이벤트 + 제거
//   - patientDied/patientLeft 수신 시 자동 cleanup
//
// 구독 이벤트:
//   tpAdvance       — 일일 틱 (day 변경 시 식량 소모)
//   siegeTriggered  — 습격 이벤트 훅
//   patientDied     — cleanup
//   patientLeft     — cleanup
//
// 발행 이벤트:
//   guardStationed  { npcId }
//   guardDismissed  { npcId }
//   guardStarved    { npcId }
//   guardKilled     { npcId, siegeId }
//   siegeResolved   { outcome, casualties, defenseRating, threat }

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData  from '../data/GameData.js';

const SIEGE_THRESHOLD_MULT = 0.8;  // defenseRating ≥ threat × 0.8 → victory
const THREAT_BASE_MULT     = 15;   // threat = numEnemies × danger × 15

const GuardSystem = {

  // ── 내부 상태 ───────────────────────────────────────
  _entries:            {},  // { [npcId]: { def } }
  _currentDay:         -Infinity,
  _unsubscribeTP:      null,
  _unsubscribeSiege:   null,
  _unsubscribeDied:    null,
  _unsubscribeLeft:    null,
  _initialized:        false,

  // ── 초기화 ─────────────────────────────────────────
  init() {
    this._unsubscribeAll();
    this._ensureHospitalSlice();

    this._entries    = {};
    this._currentDay = GameState.time?.day ?? -Infinity;
    this._initialized = true;

    this._unsubscribeTP    = EventBus.on('tpAdvance',       () => this._tickIfDayChanged());
    this._unsubscribeSiege = EventBus.on('siegeTriggered',  (p) => this._onSiege(p));
    this._unsubscribeDied  = EventBus.on('patientDied',     ({ npcId } = {}) => this._cleanup(npcId));
    this._unsubscribeLeft  = EventBus.on('patientLeft',     ({ npcId } = {}) => this._cleanup(npcId));
  },

  _ensureHospitalSlice() {
    if (!GameState.hospital) {
      GameState.hospital = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };
    }
  },

  // ── 등록 / station / dismiss ──────────────────────

  register(npcId, contributionDef) {
    if (!npcId || !contributionDef) return false;
    if (contributionDef.type !== 'guard') return false;
    if (!contributionDef.guard) return false;

    this._entries = {
      ...this._entries,
      [npcId]: { def: contributionDef },
    };
    return true;
  },

  station(npcId) {
    const entry = this._entries[npcId];
    if (!entry) return false;
    this._ensureHospitalSlice();
    if (GameState.hospital.stationedGuards.includes(npcId)) return false;

    GameState.hospital.stationedGuards = [...GameState.hospital.stationedGuards, npcId];
    this._recalcDefense();
    EventBus.emit('guardStationed', { npcId });
    return true;
  },

  dismiss(npcId) {
    this._ensureHospitalSlice();
    if (!GameState.hospital.stationedGuards.includes(npcId)) return false;
    GameState.hospital.stationedGuards = GameState.hospital.stationedGuards.filter(id => id !== npcId);
    this._recalcDefense();
    EventBus.emit('guardDismissed', { npcId });
    return true;
  },

  // ── 조회 API ──────────────────────────────────────

  getRegistered() {
    return Object.keys(this._entries);
  },

  getStationed() {
    return [...(GameState.hospital?.stationedGuards ?? [])];
  },

  getDefenseRating() {
    return GameState.hospital?.defenseRating ?? 0;
  },

  // 외부(HospitalSiegeSystem 등)에서 상주 수비대 guard 정의 조회용.
  getGuardDef(npcId) {
    return this._entries[npcId]?.def?.guard ?? null;
  },

  // ── 방어력 재계산 ─────────────────────────────────

  _recalcDefense() {
    const stationed = GameState.hospital?.stationedGuards ?? [];
    let total = 0;
    for (const npcId of stationed) {
      const def = this._entries[npcId]?.def?.guard;
      if (!def) continue;
      total += (def.combatDmg ?? 0) * 10 + (def.safetyAdd ?? 0) * 100;
    }
    GameState.hospital.defenseRating = total;
  },

  // ── 일일 틱 — 식량 소모 ─────────────────────────────

  _tickIfDayChanged() {
    const day = GameState.time?.day ?? 0;
    if (day === this._currentDay) return;
    this._currentDay = day;
    this._consumeFood();
  },

  _consumeFood() {
    const stationed = [...(GameState.hospital?.stationedGuards ?? [])];
    for (const npcId of stationed) {
      const def  = this._entries[npcId]?.def?.guard;
      if (!def) continue;
      const cost = def.foodCostPerDay ?? 1;
      if (cost <= 0) continue;

      const consumed = this._pullFood(cost);
      if (consumed < cost) {
        this.dismiss(npcId);
        EventBus.emit('guardStarved', { npcId });
      }
    }
  },

  _pullFood(amount) {
    const cards = GameState.cards ?? {};
    let remaining = amount;
    for (const instId of Object.keys(cards)) {
      if (remaining <= 0) break;
      const inst = cards[instId];
      if (!inst) continue;
      const def = this._getItemDef(inst.definitionId);
      if (!def) continue;
      if (def.subtype !== 'food') continue;

      const take = Math.min(inst.quantity ?? 0, remaining);
      if (take <= 0) continue;
      inst.quantity = (inst.quantity ?? 0) - take;
      remaining -= take;

      if (inst.quantity <= 0) {
        GameState.removeCardInstance?.(instId);
      }
    }
    return amount - remaining;
  },

  _getItemDef(definitionId) {
    return GameData.items?.[definitionId] ?? null;
  },

  // ── Siege 훅 ──────────────────────────────────────

  _onSiege({ numEnemies = 1, danger = 1, siegeId = null, playerPresent = false } = {}) {
    // 플레이어가 현장에 있으면 CombatSystem 경로 — 자동 시뮬 skip
    if (playerPresent) return;
    this._ensureHospitalSlice();
    const defenseRating = this.getDefenseRating();
    const threat        = numEnemies * danger * THREAT_BASE_MULT;

    const outcome = defenseRating >= threat * SIEGE_THRESHOLD_MULT ? 'victory' : 'defeat';
    let casualties = 0;

    if (outcome === 'defeat') {
      const stationed = [...GameState.hospital.stationedGuards];
      casualties = Math.min(stationed.length, Math.random() < 0.5 ? 1 : 2);
      // 무작위 희생자 선정
      const victims = [];
      const pool = [...stationed];
      for (let i = 0; i < casualties && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        victims.push(pool.splice(idx, 1)[0]);
      }
      for (const npcId of victims) {
        this.dismiss(npcId);
        this._cleanup(npcId);
        EventBus.emit('guardKilled', { npcId, siegeId });
      }
    }

    GameState.hospital.siegeHistory = [
      ...GameState.hospital.siegeHistory,
      {
        day: GameState.time?.day ?? 0,
        outcome,
        casualties,
        defenseRating,
        threat,
      },
    ];

    EventBus.emit('siegeResolved', { outcome, casualties, defenseRating, threat });
  },

  // ── Cleanup ───────────────────────────────────────

  _cleanup(npcId) {
    if (!npcId) return;
    this._ensureHospitalSlice();
    // 상주 중이면 먼저 해제
    if (GameState.hospital.stationedGuards.includes(npcId)) {
      GameState.hospital.stationedGuards = GameState.hospital.stationedGuards.filter(id => id !== npcId);
      this._recalcDefense();
    }
    if (this._entries[npcId]) {
      const { [npcId]: _, ...rest } = this._entries;
      this._entries = rest;
    }
  },

  // ── 테스트 유틸 ────────────────────────────────────

  _unsubscribeAll() {
    if (this._unsubscribeTP)    { this._unsubscribeTP();    this._unsubscribeTP    = null; }
    if (this._unsubscribeSiege) { this._unsubscribeSiege(); this._unsubscribeSiege = null; }
    if (this._unsubscribeDied)  { this._unsubscribeDied();  this._unsubscribeDied  = null; }
    if (this._unsubscribeLeft)  { this._unsubscribeLeft();  this._unsubscribeLeft  = null; }
  },

  _reset() {
    this._unsubscribeAll();
    this._entries     = {};
    this._currentDay  = -Infinity;
    this._initialized = false;
    if (GameState.hospital) {
      GameState.hospital = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };
    }
  },
};

export default GuardSystem;
