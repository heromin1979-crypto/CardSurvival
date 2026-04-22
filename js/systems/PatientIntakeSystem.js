// === PATIENT INTAKE SYSTEM ===
// 응급실 허브 환자 유입·타이머·기여 관리 (Pull-First + Day Cap + Timer + Contribution).
//
// 동작 개요:
//   [유입] Pull-First — 응급실 모달 진입 시 `tryIntake()` 호출.
//     - 조건: Day ≥ 3, ER 플래그, 동시 환자 < 3, 쿨다운 경과, Day Cap 미달
//     - 쿨다운: 의사 2일 / 타 클래스 4일
//     - Day Cap: Day 3-14→1, 15-29→2, 30+→3
//
//   [타이머] tpAdvance 구독으로 매 TP 체크:
//     - 24TP + woundLevel ≥ 2 무처치 → HP 1/TP 감소
//     - HP ≤ 0 → `patientDied` (morale -3)
//     - 48TP 경과 + 미완치 → `patientLeft` (morale -2)
//
//   [기여] npcHealed 구독으로 완치 감지:
//     - _admitted → _rescued 이동
//     - immediate 아이템 → GameState.pendingLoot
//     - sponsor recurring: intervalDays 경과 시 maxCount까지 pendingLoot 지급
//     - guard/dispatch/recruit: 등록만 (실제 동작은 증분 5+에서)

import EventBus       from '../core/EventBus.js';
import GameState      from '../core/GameState.js';
import SystemRegistry from '../core/SystemRegistry.js';
import PATIENT_POOL   from '../data/patientPool.js';
import BALANCE        from '../data/gameBalance.js';

const MAX_CONCURRENT_PATIENTS = 3;
const MIN_DAY                 = 3;
const COOLDOWN_DAYS_DOCTOR    = 2;
const COOLDOWN_DAYS_OTHER     = 4;

const DAY_CAP_TIERS = [
  { minDay: 30, cap: 3 },
  { minDay: 15, cap: 2 },
  { minDay: 3,  cap: 1 },
];

const HP_DECAY_START_TP  = 24;
const HP_DECAY_THRESHOLD = 2;
const DEPARTURE_TP       = 48;
const INITIAL_HP         = 100;

const PatientIntakeSystem = {

  // ── 내부 상태 ───────────────────────────────────────
  _lastIntakeDay:   -Infinity,
  _admitted:        [],
  _patientMeta:     {},            // { [npcId]: { admissionTP, hp } }
  _rescued:         {},            // { [npcId]: { curedDay, type, recurring: {items, intervalDays, maxCount, nextDay, remaining} } }
  _admittedToday:   0,
  _currentDay:      -Infinity,
  _initialized:     false,
  _unsubscribeTP:   null,
  _unsubscribeHeal: null,

  // ── 초기화 ─────────────────────────────────────────
  init() {
    this._unsubscribeAll();

    this._lastIntakeDay = -Infinity;
    this._admitted      = [];
    this._patientMeta   = {};
    this._rescued       = {};
    this._admittedToday = 0;
    this._currentDay    = GameState.time?.day ?? -Infinity;
    this._initialized   = true;

    this._unsubscribeTP   = EventBus.on('tpAdvance', () => {
      this._tickTimers();
      this._tickRecurring();
    });
    this._unsubscribeHeal = EventBus.on('npcHealed', ({ npcId } = {}) => {
      this._onNpcHealed(npcId);
    });
  },

  // ── 공개 API ───────────────────────────────────────

  tryIntake() {
    this._rolloverDayIfNeeded();

    if (!this._checkConditions()) return false;

    const npcId = this._rollPersona(GameState.player?.characterId);
    if (!npcId) return false;

    const npcSystem = SystemRegistry.get('NPCSystem');
    if (!npcSystem?.forceSpawn) return false;

    const ok = npcSystem.forceSpawn(npcId);
    if (!ok) return false;

    const day     = GameState.time?.day ?? 0;
    const totalTP = GameState.time?.totalTP ?? 0;

    this._admitted      = [...this._admitted, npcId];
    this._patientMeta   = {
      ...this._patientMeta,
      [npcId]: { admissionTP: totalTP, hp: INITIAL_HP },
    };
    this._lastIntakeDay = day;
    this._admittedToday = this._admittedToday + 1;

    EventBus.emit('patientAdmitted', { npcId });
    return true;
  },

  getActivePatients() {
    return [...this._admitted];
  },

  getPatientMeta(npcId) {
    return this._patientMeta[npcId] ?? null;
  },

  getRescuedRoster() {
    return Object.keys(this._rescued);
  },

  getRescuedInfo(npcId) {
    return this._rescued[npcId] ?? null;
  },

  // ── 완치 처리 ──────────────────────────────────────

  _onNpcHealed(npcId) {
    if (!npcId) return;
    if (!this._admitted.includes(npcId)) return;  // 비환자 NPC 무시

    const def = PATIENT_POOL[npcId];
    const contribution = def?.contributionOnCure;

    // 로스터 이동: _admitted → _rescued
    this._admitted = this._admitted.filter(id => id !== npcId);
    const { [npcId]: _meta, ...restMeta } = this._patientMeta;
    this._patientMeta = restMeta;

    const curedDay = GameState.time?.day ?? 0;
    const rescuedEntry = {
      curedDay,
      type: contribution?.type ?? 'sponsor',
    };

    // immediate 아이템 지급
    if (Array.isArray(contribution?.immediate)) {
      for (const { id, qty } of contribution.immediate) {
        this._pushLoot(id, qty);
      }
    }

    // recurring sponsor 스케줄링
    const rec = contribution?.recurring;
    if (rec && Array.isArray(rec.items) && rec.intervalDays > 0 && rec.maxCount > 0) {
      rescuedEntry.recurring = {
        items:        rec.items,
        intervalDays: rec.intervalDays,
        maxCount:     rec.maxCount,
        nextDay:      curedDay + rec.intervalDays,
        remaining:    rec.maxCount,
      };
    }

    // dispatch/guard 분기 — 외부 시스템에 등록 + assignment 초기화
    if (rescuedEntry.type === 'dispatch') {
      rescuedEntry.assignment = { status: 'idle' };
      const dispatchSys = SystemRegistry.get('DispatchSystem');
      dispatchSys?.register?.(npcId, contribution);
    } else if (rescuedEntry.type === 'guard') {
      rescuedEntry.assignment = { status: 'idle' };
      const guardSys = SystemRegistry.get('GuardSystem');
      guardSys?.register?.(npcId, contribution);
    }

    this._rescued = { ...this._rescued, [npcId]: rescuedEntry };

    EventBus.emit('patientCured', { npcId, type: rescuedEntry.type });
  },

  _tickRecurring() {
    const day = GameState.time?.day ?? 0;

    for (const npcId of Object.keys(this._rescued)) {
      const entry = this._rescued[npcId];
      const rec   = entry?.recurring;
      if (!rec) continue;
      if (rec.remaining <= 0) continue;
      if (day < rec.nextDay) continue;

      for (const { id, qty } of rec.items) {
        this._pushLoot(id, qty);
      }
      rec.remaining = rec.remaining - 1;
      rec.nextDay   = day + rec.intervalDays;

      EventBus.emit('sponsorDelivery', {
        npcId,
        items: rec.items,
        remaining: rec.remaining,
      });
    }
  },

  _pushLoot(definitionId, quantity) {
    if (!GameState.pendingLoot) GameState.pendingLoot = [];
    GameState.pendingLoot.push({ definitionId, quantity, contamination: 0 });
  },

  // ── 타이머 tick ─────────────────────────────────────

  _tickTimers() {
    const totalTP = GameState.time?.totalTP ?? 0;
    const snapshot = [...this._admitted];

    // W2-1: 의사 부재 + 간호사 상주 → 타이머 동결 (간호사 자동 대행)
    const nurseAttending = this._isNurseAttending();

    for (const npcId of snapshot) {
      const meta = this._patientMeta[npcId];
      if (!meta) continue;

      if (nurseAttending) {
        // 타이머 리셋 — 간호사가 환자를 유지하는 동안 TP 경과를 무효화
        meta.admissionTP = totalTP;
        continue;
      }

      const elapsed    = totalTP - meta.admissionTP;
      const npcState   = GameState.npcs?.states?.[npcId];
      const woundLevel = npcState?.woundLevel ?? 0;

      if (woundLevel <= 0) continue;

      if (elapsed >= HP_DECAY_START_TP && woundLevel >= HP_DECAY_THRESHOLD) {
        meta.hp = meta.hp - 1;
        if (meta.hp <= 0) {
          this._killPatient(npcId);
          continue;
        }
      }

      if (elapsed >= DEPARTURE_TP) {
        this._departPatient(npcId);
      }
    }
  },

  // W2-1: 간호사 자동 대행 조건 — 의사 부재 + npc_nurse 상주 + 동반자 아님
  _isNurseAttending() {
    if (this._isAtHospital()) return false;   // 의사 있으면 대행 불필요
    const nurseState = GameState.npcs?.states?.['npc_nurse'];
    if (!nurseState) return false;
    const companions = GameState.companions ?? [];
    if (companions.includes('npc_nurse')) return false;   // 원정 동행 중이면 불가
    return true;
  },

  _killPatient(npcId) {
    const delta = BALANCE.patientIntake?.moraleDeath ?? -2;
    this._removeFromRoster(npcId);
    this._adjustMorale(delta);
    EventBus.emit('patientDied', { npcId, moraleDelta: delta });
  },

  _departPatient(npcId) {
    const delta = BALANCE.patientIntake?.moraleDepart ?? -1;
    this._removeFromRoster(npcId);
    this._adjustMorale(delta);
    EventBus.emit('patientLeft', { npcId, moraleDelta: delta });
  },

  _removeFromRoster(npcId) {
    this._admitted = this._admitted.filter(id => id !== npcId);
    const { [npcId]: _, ...rest } = this._patientMeta;
    this._patientMeta = rest;
  },

  _adjustMorale(delta) {
    const morale = GameState.stats?.morale;
    if (!morale) return;
    const max = morale.max ?? 100;
    morale.current = Math.max(0, Math.min(max, (morale.current ?? 0) + delta));
  },

  // ── 조건 체크 ──────────────────────────────────────

  _checkConditions() {
    const day = GameState.time?.day ?? 0;
    if (day < MIN_DAY) return false;

    const erUnlocked = GameState.flags?.er_unlocked ?? true;
    if (!erUnlocked) return false;

    if (this._admitted.length >= MAX_CONCURRENT_PATIENTS) return false;

    const cooldown = this._getCooldownDays(GameState.player?.characterId);
    if (day - this._lastIntakeDay < cooldown) return false;

    if (this._admittedToday >= this._getDayCap(day)) return false;

    // W2-1: 위치 체크 — 응급실 허브(보라매)에서만 환자 유입
    if (!this._isAtHospital()) return false;

    return true;
  },

  _isAtHospital() {
    const loc = GameState.location ?? {};
    // dongjak landmark (보라매병원) 또는 boramae_* 서브로케이션
    if (loc.currentLandmark === 'dongjak') return true;
    if (typeof loc.currentSubLocation === 'string'
        && loc.currentSubLocation.startsWith('boramae_')) return true;
    return false;
  },

  _getCooldownDays(characterId) {
    return characterId === 'doctor' ? COOLDOWN_DAYS_DOCTOR : COOLDOWN_DAYS_OTHER;
  },

  _getDayCap(day) {
    for (const tier of DAY_CAP_TIERS) {
      if (day >= tier.minDay) return tier.cap;
    }
    return 0;
  },

  _rolloverDayIfNeeded() {
    const day = GameState.time?.day ?? 0;
    if (day !== this._currentDay) {
      this._currentDay    = day;
      this._admittedToday = 0;
    }
  },

  // ── 가중치 롤 ──────────────────────────────────────
  // W2-3: 기여 타입별 가중치 — day 구간 + 거점 상태에 따라 확률 조정
  //   초반(Day 3-9): 수비/후원 편향 (방어선 확보)
  //   중반(Day 10-29): 균형
  //   후반(Day 30+): 파견/영입 편향 (확장)

  _rollPersona(characterId) {
    const poolIds = Object.keys(PATIENT_POOL).filter(id => !this._admitted.includes(id)
                                                        && !this._rescued[id]);
    if (poolIds.length === 0) return null;

    const day = GameState.time?.day ?? 0;
    const weights = this._getTypeWeights(day);

    const totals = [];
    let sum = 0;
    for (const id of poolIds) {
      const type = PATIENT_POOL[id]?.contributionOnCure?.type ?? 'sponsor';
      const w = weights[type] ?? 1;
      sum += w;
      totals.push({ id, cumulative: sum });
    }
    if (sum <= 0) return poolIds[Math.floor(Math.random() * poolIds.length)];

    const roll = Math.random() * sum;
    for (const { id, cumulative } of totals) {
      if (roll < cumulative) return id;
    }
    return totals[totals.length - 1].id;
  },

  _getTypeWeights(day) {
    // 후원/수비/파견/영입 기본 가중치
    if (day < 10) {
      return { sponsor: 3, guard: 3, dispatch: 1, recruit: 1 };
    }
    if (day < 30) {
      return { sponsor: 2, guard: 2, dispatch: 2, recruit: 2 };
    }
    return { sponsor: 1, guard: 1, dispatch: 3, recruit: 2 };
  },

  // ── 테스트 유틸 ────────────────────────────────────

  _resetCooldown() {
    this._lastIntakeDay = -Infinity;
  },

  _resetDayCap() {
    this._admittedToday = 0;
  },

  _unsubscribeAll() {
    if (this._unsubscribeTP)   { this._unsubscribeTP();   this._unsubscribeTP   = null; }
    if (this._unsubscribeHeal) { this._unsubscribeHeal(); this._unsubscribeHeal = null; }
  },

  _reset() {
    this._unsubscribeAll();
    this._lastIntakeDay = -Infinity;
    this._admitted      = [];
    this._patientMeta   = {};
    this._rescued       = {};
    this._admittedToday = 0;
    this._currentDay    = -Infinity;
    this._initialized   = false;
  },
};

export default PatientIntakeSystem;
