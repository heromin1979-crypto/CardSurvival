// === TELEMETRY SYSTEM ===
// 본체 K1 측정용 익명 로컬 이벤트 로그. 외부 송신 없음 — 사용자 자발 export.
// 협의서 v6 §5.1 / 설계: docs/plans/M4_TELEMETRY_SYSTEM_DESIGN.md
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const SCHEMA_VERSION         = 1;
const STORAGE_KEY_PREFIX     = 'CARD_SURVIVAL_TELE_v1_';
const SESSION_INDEX_KEY      = 'CARD_SURVIVAL_TELE_v1_session_index';
const USER_ID_KEY            = 'CARD_SURVIVAL_TELE_v1_userId';
const MAX_EVENTS_PER_SESSION = 5000;
const FLUSH_INTERVAL_MS      = 30000;

const TelemetrySystem = {
  _userId: null,
  _sessionId: null,
  _events: [],
  _flushTimer: null,
  _started: false,
  _capped: false,

  init() {
    if (this._started) return;
    // localStorage 없는 환경(헤드리스/시뮬/프라이버시 모드)에서는 수집 비활성
    if (!this._storageAvailable()) return;

    this._userId    = this._loadOrCreateUserId();
    this._sessionId = this._genSessionId();
    this._events    = [];
    this._capped    = false;

    this._subscribe();
    this._registerSession();

    this._flushTimer = setInterval(() => this._flush(), FLUSH_INTERVAL_MS);
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('beforeunload', () => this._flush());
    }
    this._started = true;
  },

  _subscribe() {
    EventBus.on('playerDied',     d => this._onPlayerDied(d));
    EventBus.on('dayEnd',         d => this._onDayEnd(d));
    EventBus.on('skillLevelUp',   d => this._onSkillLevelUp(d));
    EventBus.on('itemConsumed',   d => this._onItemConsumed(d));
    EventBus.on('npcRecruited',   d => this._onNpcRecruited(d));
    EventBus.on('questCompleted', d => this._onQuestCompleted(d));
    EventBus.on('craftComplete',  d => this._onCraftComplete(d));
  },

  // ── 채널 핸들러 ────────────────────────────────────────────────
  _onPlayerDied(d) {
    this._push('playerDied', {
      cause: d?.cause, day: d?.day, totalTP: d?.totalTP, characterId: d?.characterId,
    });
    this._flush(); // 사망은 종단 — 브라우저 종료 전 즉시 기록
  },

  _onDayEnd(d) {
    // characterId는 K1 산출 시 생존 run(playerDied 부재)의 직업 귀속에 필요
    this._push('dayEnd', { day: d?.day, totalTP: d?.totalTP, characterId: d?.characterId });
  },

  _onSkillLevelUp(d) {
    // skillName은 i18n 변동 가능 → 제외 (설계 §5.2)
    this._push('skillLevelUp', { skillId: d?.skillId, newLevel: d?.newLevel, day: this._day() });
  },

  _onItemConsumed(d) {
    this._push('itemConsumed', { itemId: d?.itemId, qty: d?.qty, day: d?.day ?? this._day() });
  },

  _onNpcRecruited(d) {
    // trust는 npcRecruited 이벤트 payload에 없음 → 결합 회피 위해 미수집 (설계 §5.2 대비 deviation)
    this._push('npcRecruited', { npcId: d?.npcId, day: this._day() });
  },

  _onQuestCompleted(d) {
    this._push('questCompleted', { questId: d?.questId, bonusGranted: d?.bonusGranted, day: this._day() });
  },

  _onCraftComplete(d) {
    const outputCount = Array.isArray(d?.outputInstanceIds) ? d.outputInstanceIds.length : 0;
    this._push('craftComplete', { blueprintId: d?.blueprintId, outputCount, day: this._day() });
  },

  _day() {
    return GameState.time?.day ?? null;
  },

  // ── 적재 ──────────────────────────────────────────────────────
  _push(channel, payload) {
    if (this._events.length >= MAX_EVENTS_PER_SESSION) {
      if (!this._capped) {
        console.warn(`[Telemetry] session cap ${MAX_EVENTS_PER_SESSION} reached — dropping further events`);
        this._capped = true;
      }
      return;
    }
    this._events.push({ ts: Date.now(), sessionId: this._sessionId, channel, payload });
  },

  _flush() {
    if (!this._sessionId || !this._storageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + this._sessionId, JSON.stringify(this._events));
    } catch (e) {
      // QuotaExceededError 시 IndexedDB 폴백은 M4 #2 안착 후 (설계 §6.2)
      console.warn('[Telemetry] flush failed:', e?.message ?? e);
    }
  },

  // ── 세션 / 유저 ───────────────────────────────────────────────
  _loadOrCreateUserId() {
    let id = null;
    try { id = localStorage.getItem(USER_ID_KEY); } catch {}
    if (!id) {
      id = this._genUuid();
      try { localStorage.setItem(USER_ID_KEY, id); } catch {}
    }
    return id;
  },

  _registerSession() {
    const list = this._loadSessionIndex();
    if (!list.includes(this._sessionId)) {
      list.push(this._sessionId);
      try { localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(list)); } catch {}
    }
  },

  _loadSessionIndex() {
    try {
      const raw = localStorage.getItem(SESSION_INDEX_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },

  _readSession(sessionId) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFIX + sessionId);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },

  // ── export (자발 제출) ────────────────────────────────────────
  exportSessionJSON(sessionId = this._sessionId) {
    this._flush();
    const blob = {
      schemaVersion: SCHEMA_VERSION,
      userId: this._userId,
      sessionId,
      events: this._readSession(sessionId),
    };
    return this._download(blob, `telemetry_${sessionId}.json`);
  },

  exportAllSessionsJSON() {
    this._flush();
    const sessions = this._loadSessionIndex().map(sid => ({
      sessionId: sid,
      events: this._readSession(sid),
    }));
    const blob = {
      schemaVersion: SCHEMA_VERSION,
      userId: this._userId,
      exportedAt: Date.now(),
      sessions,
    };
    return this._download(blob, `telemetry_all_${this._userId}.json`);
  },

  _download(obj, filename) {
    const json = JSON.stringify(obj, null, 2);
    // 브라우저면 Blob 다운로드, 그 외(헤드리스/부분 DOM)는 JSON 문자열만 반환.
    // 다운로드는 부수효과이므로 실패해도 호출자에게 항상 JSON을 돌려준다.
    try {
      if (typeof document !== 'undefined' && typeof Blob !== 'undefined'
          && typeof URL !== 'undefined' && typeof document.createElement === 'function') {
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn('[Telemetry] download fallback (JSON 반환):', e?.message ?? e);
    }
    return json;
  },

  // ── 정리 ──────────────────────────────────────────────────────
  clearSession(sessionId = this._sessionId) {
    try { localStorage.removeItem(STORAGE_KEY_PREFIX + sessionId); } catch {}
    const list = this._loadSessionIndex().filter(s => s !== sessionId);
    try { localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(list)); } catch {}
  },

  clearAll() {
    for (const sid of this._loadSessionIndex()) {
      try { localStorage.removeItem(STORAGE_KEY_PREFIX + sid); } catch {}
    }
    try { localStorage.removeItem(SESSION_INDEX_KEY); } catch {}
  },

  // ── 유틸 ──────────────────────────────────────────────────────
  _storageAvailable() {
    try { return typeof localStorage !== 'undefined' && localStorage !== null; } catch { return false; }
  },

  _genUuid() {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch {}
    return 'u-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  },

  _genSessionId() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    return `${stamp}-${Math.random().toString(36).slice(2, 6)}`;
  },
};

export default TelemetrySystem;
