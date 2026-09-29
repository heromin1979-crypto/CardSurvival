import TREATMENT_PROFILES from '../data/treatmentProfiles.js';
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
//   [기여] npcWoundHealed 구독으로 완치 감지:
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
  _pendingChoices:  {},            // W3-1: { [npcId]: { primary, alts, def } }
  _admittedToday:   0,
  _currentDay:      -Infinity,
  _initialized:     false,
  _unsubscribeTP:   null,
  _unsubscribeHeal: null,
  _unsubscribeLifecycle: [],

  // 새 게임 시작 시 이전 게임 상태 제거 — GameState.resetForNewGame이 발행하는
  // newGameStarted를 init에서 구독한다. 구독 핸들·초기화 플래그는 건드리지 않는다.
  resetForNewGame() {
    this._admitted = [];
    this._patientMeta = {};
    this._rescued = {};
    this._pendingChoices = {};
    this._admittedToday = 0;
    this._lastIntakeDay = -Infinity;
    this._currentDay = -Infinity;
  },

  // ── 초기화 ─────────────────────────────────────────
  init() {
    this._unsubscribeAll();
    this._unsubscribeLifecycle = [
      EventBus.on('newGameStarted', () => this.resetForNewGame()),
      EventBus.on('patientDied', ({ npcId }) => this._removeFromRoster(npcId)),
      EventBus.on('patientLeft', ({ npcId }) => this._removeFromRoster(npcId)),
      EventBus.on('loaded', () => queueMicrotask(() => this.resumePendingChoices())),
    ];

    this._lastIntakeDay   = -Infinity;
    this._admitted        = [];
    this._patientMeta     = {};
    this._rescued         = {};
    this._pendingChoices  = {};
    this._admittedToday   = 0;
    this._currentDay    = GameState.time?.day ?? -Infinity;
    this._initialized   = true;

    this._unsubscribeTP   = EventBus.on('tpAdvance', () => {
      this._tickTimers();
      this._tickRecurring();
    });
    this._unsubscribeHeal = EventBus.on('npcWoundHealed', ({ npcId } = {}) => {
      this._onNpcHealed(npcId);
    });
  },

  // ── 공개 API ───────────────────────────────────────

  serialize() {
    return {
      admitted: this._admitted,
      patientMeta: this._patientMeta,
      rescued: this._rescued,
      pendingChoiceIds: Object.keys(this._pendingChoices),
      lastIntakeDay: Number.isFinite(this._lastIntakeDay) ? this._lastIntakeDay : null,
      admittedToday: this._admittedToday,
      currentDay: Number.isFinite(this._currentDay) ? this._currentDay : null,
    };
  },

  restore(snapshot) {
    this.resetForNewGame();
    if (snapshot) {
      this._admitted = (snapshot.admitted ?? []).filter(id => PATIENT_POOL[id] && !GameState.npcs?.states?.[id]?.patientUnavailable && !GameState.npcs?.states?.[id]?.dismissed);
      this._patientMeta = snapshot.patientMeta ?? {};
      this._rescued = snapshot.rescued ?? {};
      this._lastIntakeDay = snapshot.lastIntakeDay ?? -Infinity;
      this._admittedToday = snapshot.admittedToday ?? 0;
      this._currentDay = snapshot.currentDay ?? -Infinity;
      for (const id of snapshot.pendingChoiceIds ?? []) {
        const def = PATIENT_POOL[id];
        if (def && this._admitted.includes(id)) this._pendingChoices[id] = { primary: def.contributionOnCure, alts: def.altContributions ?? [], def };
      }
      return;
    }
    // 구버전은 입원 시각·지급 횟수가 없다. 살아 있는 부상자만 재입원하고,
    // 이미 완치한 환자는 보상 재지급 없이 기록해 중복 기여를 방지한다.
    for (const [id, state] of Object.entries(GameState.npcs?.states ?? {})) {
      if (!PATIENT_POOL[id] || state.dismissed || state.patientUnavailable || !state.spawned) continue;
      if (state.healed || state.woundLevel === 0) {
        this._rescued[id] = { curedDay: GameState.time?.day ?? 0, type: PATIENT_POOL[id].contributionOnCure?.type ?? 'sponsor' };
      } else if (state.woundLevel > 0) {
        this._admitted.push(id);
        this._patientMeta[id] = { admissionTP: GameState.time?.totalTP ?? 0, hp: Math.max(1, state.hp ?? INITIAL_HP) };
      }
    }
    if (this._admitted.length) {
      this._lastIntakeDay = GameState.time?.day ?? 0;
      this._currentDay = this._lastIntakeDay;
      this._admittedToday = this._admitted.length;
    }
  },

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
    const primary = def?.contributionOnCure;
    const alts = Array.isArray(def?.altContributions) ? def.altContributions : [];

    // W3-1: 대안이 있으면 선택 대기 상태로 전환
    if (alts.length > 0) {
      this._pendingChoices = {
        ...this._pendingChoices,
        [npcId]: { primary, alts, def },
      };
      EventBus.emit('contributionChoiceNeeded', {
        npcId,
        options: [primary, ...alts],
      });
      return;   // 선택이 끝날 때까지 rescue 지연
    }

    this._applyContribution(npcId, primary);
  },

  // W3-1: 선택된 기여 타입으로 cure 확정 (0 = primary, 1+ = alt 인덱스)
  chooseContribution(npcId, optionIndex = 0) {
    const pending = this._pendingChoices?.[npcId];
    if (!pending || !this._canChooseContribution(npcId) || !Number.isInteger(optionIndex) || optionIndex < 0) return false;
    const chosen = optionIndex === 0 ? pending.primary : pending.alts[optionIndex - 1];
    if (!chosen) return false;

    const { [npcId]: _drop, ...rest } = this._pendingChoices;
    this._pendingChoices = rest;

    this._applyContribution(npcId, chosen);
    return true;
  },

  getPendingChoice(npcId) {
    return this._pendingChoices?.[npcId] ?? null;
  },

  resumePendingChoices() {
    for (const [npcId, pending] of Object.entries(this._pendingChoices)) {
      if (!this._canChooseContribution(npcId)) continue;
      EventBus.emit('contributionChoiceNeeded', { npcId, options: [pending.primary, ...pending.alts] });
    }
  },

  _canChooseContribution(npcId) {
    const state = GameState.npcs?.states?.[npcId];
    return this._admitted.includes(npcId) && !this._rescued[npcId]
      && state?.spawned && !state.dismissed && !state.patientUnavailable
      && (state.healed || state.woundLevel === 0);
  },

  getSelectedContribution(npcId) {
    const entry = this._rescued[npcId];
    const state = GameState.npcs?.states?.[npcId];
    if (!entry || state?.dismissed || state?.patientUnavailable) return null;
    const def = PATIENT_POOL[npcId];
    return entry.contribution ?? [def?.contributionOnCure, ...(def?.altContributions ?? [])].find(option => option?.type === entry.type) ?? null;
  },

  _applyContribution(npcId, contribution) {
    // 로스터 이동: _admitted → _rescued
    this._admitted = this._admitted.filter(id => id !== npcId);
    const { [npcId]: _meta, ...restMeta } = this._patientMeta;
    this._patientMeta = restMeta;

    const curedDay = GameState.time?.day ?? 0;
    const rescuedEntry = {
      curedDay,
      type: contribution?.type ?? 'sponsor',
      contribution,
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

      if (woundLevel <= 0 || npcState?.treatment?.stabilized) continue;

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
    delete this._pendingChoices[npcId];
    const state = GameState.npcs?.states?.[npcId];
    if (state) { state.patientUnavailable = true; state.dismissed = true; state.spawned = false; }
    for (const card of Object.values(GameState.cards)) {
      if (card.definitionId === npcId) GameState.removeCardInstance(card.instanceId);
    }
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
    if (loc.currentLandmark === 'dongjak' || loc.currentLandmark === 'lm_boramae_hospital') return true;
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
    const poolIds = Object.keys(PATIENT_POOL).filter(id => !GameState.npcs?.states?.[id]?.patientUnavailable
                                                        && !GameState.npcs?.states?.[id]?.dismissed
                                                        && !GameState.npcs?.states?.[id]?.healed
                                                        && (GameState.time?.day ?? 0) >= (TREATMENT_PROFILES[PATIENT_POOL[id].treatmentProfile]?.minDay ?? MIN_DAY)
                                                        && !this._admitted.includes(id)
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
    this._unsubscribeLifecycle.forEach(unsubscribe => unsubscribe());
    this._unsubscribeLifecycle = [];
    if (this._unsubscribeTP)   { this._unsubscribeTP();   this._unsubscribeTP   = null; }
    if (this._unsubscribeHeal) { this._unsubscribeHeal(); this._unsubscribeHeal = null; }
  },

  _reset() {
    this._unsubscribeAll();
    this._lastIntakeDay   = -Infinity;
    this._admitted        = [];
    this._patientMeta     = {};
    this._rescued         = {};
    this._pendingChoices  = {};
    this._admittedToday   = 0;
    this._currentDay    = -Infinity;
    this._initialized   = false;
  },
};

export default PatientIntakeSystem;
