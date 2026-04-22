// === DISPATCH SYSTEM (T2) ===
// 완치된 NPC 중 contributionOnCure.type === 'dispatch'인 페르소나를 특정 구로 파견.
// 일정 일수 경과 후 yield(확률 기반)를 pendingLoot으로 반환.
//
// 상태 기계:
//   idle → deployed → (returnDay 도달) → idle (runsCompleted++)
//                                      ↘ retired (maxRuns 도달)
//                                      ↘ idle (injuryChance 발동 + dispatchFailed)
//
// 구독 이벤트:
//   tpAdvance       — 일일 틱 (day 변경 감지)
//   patientDied     — 로스터 cleanup
//   patientLeft     — 로스터 cleanup
//
// 발행 이벤트:
//   dispatchDeployed { npcId, district, returnDay }
//   dispatchReturned { npcId, loot, success }
//   dispatchFailed   { npcId, district, reason }
//
// register() / deploy() / recall()은 PatientIntakeSystem 또는 UI에서 호출한다.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const DispatchSystem = {

  // ── 내부 상태 ───────────────────────────────────────
  _entries:         {},  // { [npcId]: { def, assignment } }
  _currentDay:      -Infinity,
  _unsubscribeTP:   null,
  _unsubscribeDied: null,
  _unsubscribeLeft: null,
  _initialized:     false,

  // ── 초기화 ─────────────────────────────────────────
  init() {
    this._unsubscribeAll();

    this._entries    = {};
    this._currentDay = GameState.time?.day ?? -Infinity;
    this._initialized = true;

    this._unsubscribeTP = EventBus.on('tpAdvance', () => {
      this._tickIfDayChanged();
    });
    this._unsubscribeDied = EventBus.on('patientDied', ({ npcId } = {}) => {
      this._cleanup(npcId);
    });
    this._unsubscribeLeft = EventBus.on('patientLeft', ({ npcId } = {}) => {
      this._cleanup(npcId);
    });
  },

  // ── 등록 / 배치 / 복귀 ─────────────────────────────

  register(npcId, contributionDef) {
    if (!npcId || !contributionDef) return false;
    if (contributionDef.type !== 'dispatch') return false;
    if (!contributionDef.dispatch) return false;

    this._entries = {
      ...this._entries,
      [npcId]: {
        def: contributionDef,
        assignment: {
          status:         'idle',
          deployedTo:     null,
          returnDay:      null,
          runsCompleted:  0,
        },
      },
    };
    return true;
  },

  deploy(npcId) {
    const entry = this._entries[npcId];
    if (!entry) return false;
    if (entry.assignment.status !== 'idle') return false;

    const { dispatch } = entry.def;
    const day       = GameState.time?.day ?? 0;
    const returnDay = day + (dispatch.intervalDays ?? 5);

    entry.assignment = {
      ...entry.assignment,
      status:     'deployed',
      deployedTo: dispatch.targetDistrict,
      returnDay,
    };

    EventBus.emit('dispatchDeployed', {
      npcId,
      district: dispatch.targetDistrict,
      returnDay,
    });
    return true;
  },

  recall(npcId) {
    const entry = this._entries[npcId];
    if (!entry) return false;
    if (entry.assignment.status !== 'deployed') return false;

    entry.assignment = {
      ...entry.assignment,
      status:     'idle',
      deployedTo: null,
      returnDay:  null,
    };
    return true;
  },

  // ── 조회 API ──────────────────────────────────────

  getDispatchable() {
    return Object.keys(this._entries).filter(
      id => this._entries[id].assignment.status === 'idle'
    );
  },

  getDeployed() {
    return Object.keys(this._entries).filter(
      id => this._entries[id].assignment.status === 'deployed'
    );
  },

  getAssignment(npcId) {
    return this._entries[npcId]?.assignment ?? null;
  },

  // ── 일일 틱 ────────────────────────────────────────

  _tickIfDayChanged() {
    const day = GameState.time?.day ?? 0;
    if (day === this._currentDay) return;
    this._currentDay = day;
    this._processReturns(day);
  },

  _processReturns(day) {
    for (const npcId of Object.keys(this._entries)) {
      const entry = this._entries[npcId];
      if (entry.assignment.status !== 'deployed') continue;
      if (day < entry.assignment.returnDay) continue;

      this._resolveReturn(npcId, entry);
    }
  },

  _resolveReturn(npcId, entry) {
    const { dispatch } = entry.def;
    const injuryChance = dispatch.injuryChance ?? 0;

    if (injuryChance > 0 && Math.random() < injuryChance) {
      entry.assignment = {
        ...entry.assignment,
        status:     'idle',
        deployedTo: null,
        returnDay:  null,
      };
      EventBus.emit('dispatchFailed', {
        npcId,
        district: dispatch.targetDistrict,
        reason:   'injury',
      });
      return;
    }

    const loot = [];
    for (const y of (dispatch.yield ?? [])) {
      const chance = y.chance ?? 1.0;
      if (chance < 1.0 && Math.random() >= chance) continue;
      this._pushLoot(y.id, y.qty);
      loot.push({ id: y.id, qty: y.qty });
    }

    const runsCompleted = entry.assignment.runsCompleted + 1;
    const maxRuns       = dispatch.maxRuns ?? Infinity;
    const nextStatus    = runsCompleted >= maxRuns ? 'retired' : 'idle';

    entry.assignment = {
      ...entry.assignment,
      status:     nextStatus,
      deployedTo: null,
      returnDay:  null,
      runsCompleted,
    };

    EventBus.emit('dispatchReturned', {
      npcId,
      loot,
      success: true,
    });
  },

  _pushLoot(definitionId, quantity) {
    if (!GameState.pendingLoot) GameState.pendingLoot = [];
    GameState.pendingLoot.push({ definitionId, quantity, contamination: 0 });
  },

  // ── Cleanup (사망/이탈) ───────────────────────────

  _cleanup(npcId) {
    if (!npcId) return;
    if (!this._entries[npcId]) return;
    const { [npcId]: _, ...rest } = this._entries;
    this._entries = rest;
  },

  // ── 테스트 유틸 ────────────────────────────────────

  _unsubscribeAll() {
    if (this._unsubscribeTP)   { this._unsubscribeTP();   this._unsubscribeTP   = null; }
    if (this._unsubscribeDied) { this._unsubscribeDied(); this._unsubscribeDied = null; }
    if (this._unsubscribeLeft) { this._unsubscribeLeft(); this._unsubscribeLeft = null; }
  },

  _reset() {
    this._unsubscribeAll();
    this._entries     = {};
    this._currentDay  = -Infinity;
    this._initialized = false;
  },
};

export default DispatchSystem;
