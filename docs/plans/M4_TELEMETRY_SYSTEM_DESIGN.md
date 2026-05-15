# M4 #2 — TelemetrySystem.js 사전 설계 (Pre-Design)

> 작성일: 2026-05-16 (시스템 백승호 사전 설계, M4 진입 2026-05-22 대비 휴지 기간 산출물)
> 트랙: M4 텔레메트리 트랙 — 시뮬-본체 격차 측정
> 협의서: `docs/milestones/2026-05-15-m4-telemetry/00-decisions/PD_TELE_MEETING_v6_decision.md` §7.1
> 진입 마감: 2026-05-29 (협의서 v6 §7.1)
> 작업 범위: ~300줄 (협의서 v6 §5.2 추정) → **본 설계에서 ~380줄 재추정**

> **본 문서는 사전 설계.** 실제 구현은 M4 진입(2026-05-22) 후 시작. 본 설계는 휴지 기간 중 점검·수정 가능.

---

## 1. 목표 + 트랙 정합

### 1.1 본질 목표 (협의서 v6 §2.1 인용)

> M4 트랙은 "시뮬-본체 격차 측정 트랙"이다. drift.mjs leaf hash + 텔레메트리로 시뮬과 본체의 K1 차이를 측정한다.

→ TelemetrySystem은 **본체 K1 측정의 데이터 원천**. 사용자가 게임을 플레이하는 동안 핵심 이벤트를 익명 로컬 로그로 적재하고, M4 #4 본체 K1 측정 단계에서 이 로그를 입력으로 K1 산출.

### 1.2 결정 단언 정합

| 협의서 v6 결정 | 본 설계 정합 |
|----------------|-------------|
| §3.1 시스템 백승호 확장 | 시뮬 EventBus 구조 재활용으로 작업 범위 내 |
| §4.1 최소 3 KPI (본체 K1 / K_sim_drift / drift hash) | 본체 K1 산출에 필요한 death/dayEnd 채널 우선 |
| §5.1 로컬 이벤트 로그 + 익명 + 자발 제출 | localStorage 1차, IndexedDB 폴백. 외부 송신 0. |
| §6.1 1주 휴지 후 진입 (2026-05-22) | 본 사전 설계는 휴지 기간 산출물 |

---

## 2. 핵심 발견 — 협의서 v6 §7.1 채널 정정

### 2.1 실제 이벤트 카탈로그 대조 (`js/core/EventBus.js` + 전체 emit 호출 grep)

| v6 §7.1 채널 | 실제 이벤트 | 상태 | 조치 |
|--------------|------------|------|------|
| `death` | (없음) | ❌ 미존재 | **신규 emit `playerDied` 신설** (M4 #2 collateral) |
| `dayEnd` | (없음, `tpAdvance`만) | ❌ 미존재 | **신규 emit `dayEnd` 신설** (TickEngine collateral) |
| `skillLevelUp` | `skillLevelUp` | ✅ 존재 | `js/systems/SkillSystem.js:40` |
| `itemConsumed` | (없음) | ❌ 미존재 | **신규 emit `itemConsumed` 신설** (consume 사이트 collateral) |
| `npcRecruit` | `npcRecruited` | ✅ 존재 | `js/systems/NPCSystem.js:790,825` (명칭 정정) |
| `questComplete` | `questCompleted` | ✅ 존재 | `js/systems/QuestSystem.js:964` (명칭 정정) |
| `craftSuccess` | `craftComplete` | ✅ 존재 | `js/systems/CraftSystem.js:368` (명칭 정정) |

### 2.2 EventBus 와일드카드 미지원

`js/core/EventBus.js` 검토 결과:

```js
emit(event, data) {
  if (!this._listeners[event]) return;
  this._listeners[event].forEach(fn => { ... });
}
```

→ `EventBus.on('*', fn)`은 동작하지 않음. **명시 구독 방식**으로 설계 변경.

→ 협의서 v6 §5.2 "EventBus.on('*')" 표현은 **의도(전 채널 후크)만 채택**, 구현은 명시 구독.

### 2.3 정정된 채널 명세 (7건)

| 채널 | 이벤트 | emit 위치 | 신설 여부 |
|------|--------|-----------|----------|
| 1. 사망 | `playerDied` | StatSystem.js:411 + CombatSystem.js:1266 + DiseaseSystem.js:432 | **신설** |
| 2. 일자 종료 | `dayEnd` | TickEngine.js:27 (`gs.time.day++` 직후) | **신설** |
| 3. 스킬 레벨업 | `skillLevelUp` | SkillSystem.js:40 | 기존 |
| 4. 아이템 소비 | `itemConsumed` | ConsumeSystem 또는 BoardActions consume 경로 | **신설** |
| 5. NPC 영입 | `npcRecruited` | NPCSystem.js:790,825 | 기존 |
| 6. 퀘스트 완료 | `questCompleted` | QuestSystem.js:964 | 기존 |
| 7. 제작 완료 | `craftComplete` | CraftSystem.js:368 | 기존 |

---

## 3. 신규 emit 3건 collateral 설계

### 3.1 `playerDied` (StatSystem + CombatSystem + DiseaseSystem 3 사이트)

```js
// 3 사이트 공통 emit 형식
EventBus.emit('playerDied', {
  cause: 'starvation' | 'dehydration' | 'combat' | 'disease' | 'hypothermia' | 'despair',
  day: GameState.time.day,
  totalTP: GameState.time.totalTP,
  jobId: GameState.player.jobId,
});
```

각 사이트 패치 (~3줄씩, 총 ~10줄):
- `js/systems/StatSystem.js:411` — `gs.player.isAlive = false` 직후 `cause: 'starvation'|'dehydration'|'hypothermia'|'despair'` (분기)
- `js/systems/CombatSystem.js:1266` — `cause: 'combat'`
- `js/systems/DiseaseSystem.js:432` — `cause: 'disease'`

### 3.2 `dayEnd` (TickEngine 단일 사이트)

```js
// js/core/TickEngine.js:27 (gs.time.day++ 직후)
if (gs.time.tpInDay >= 72) {
  gs.time.tpInDay = 0;
  gs.time.day++;
  gs.time.hour = 6;
  EventBus.emit('dayEnd', { day: gs.time.day - 1, totalTP: gs.time.totalTP });
}
```

→ 본체 K1 산출의 일자 카운팅 기준. 100일 도달 = `day === 101` 시점.

### 3.3 `itemConsumed` (consume 사이트 — 추후 확정)

소비 경로가 분산되어 있을 가능성. 휴지 기간 중 `BoardActions.js` / `ConsumeSystem.js` 확인 후 명세 확정. 단일 사이트면 1줄 emit, 분산되어 있으면 wrapper 헬퍼 도입 검토.

→ **본 사전 설계에서 미확정**. M4 진입 후 D+0 즉시 결정.

---

## 4. TelemetrySystem.js 파일 구조

### 4.1 모듈 골격 (~380줄 추정)

```
js/systems/TelemetrySystem.js
├── 상수 (~30줄)
│   - SCHEMA_VERSION = 1
│   - STORAGE_KEY_PREFIX = 'CARD_SURVIVAL_TELE_v1_'
│   - SESSION_KEY = 'CARD_SURVIVAL_TELE_v1_session'
│   - USER_ID_KEY = 'CARD_SURVIVAL_TELE_v1_userId'
│   - MAX_EVENTS_PER_SESSION = 5000  (1MB 가드)
│   - FLUSH_INTERVAL_MS = 30000  (30초마다 localStorage 기록)
├── _userId / _sessionId / _events 상태 (~20줄)
├── init() (~40줄)
│   - userId 로드 또는 신규 UUID 생성
│   - sessionId 신규 발급 (timestamp + random)
│   - 7 채널 EventBus.on 구독 (~50줄)
│   - 30초 flush 타이머 등록
│   - window.beforeunload flush 등록
├── 채널 핸들러 7건 (~70줄, 각 10줄)
│   - _onPlayerDied / _onDayEnd / _onSkillLevelUp / _onItemConsumed
│   - _onNpcRecruited / _onQuestCompleted / _onCraftComplete
│   - 각 핸들러는 _push(entry) 호출
├── _push(entry) (~20줄)
│   - envelope wrap: { ts, sessionId, channel, payload }
│   - _events 배열 push, MAX_EVENTS_PER_SESSION 도달 시 가드
├── _flush() (~30줄)
│   - localStorage.setItem(STORAGE_KEY_PREFIX + sessionId, JSON.stringify(_events))
│   - QuotaExceededError 시 IndexedDB 폴백 검토 (~20줄)
├── exportSessionJSON() (~30줄)
│   - 현재 sessionId 기록물 + meta(userId, schema, gameVersion) → Blob 다운로드
├── exportAllSessionsJSON() (~30줄)
│   - STORAGE_KEY_PREFIX 매칭 모든 키 합본 export
├── clearSession(sessionId) / clearAll() (~15줄)
└── _genUuid() / _genSessionId() (~15줄)
```

### 4.2 진입점 등록

`js/main.js` `Game.start()` 또는 등가 init 체인에 `TelemetrySystem.init()` 추가. AutoSave.init()과 동일 패턴.

### 4.3 의존성

- `js/core/EventBus.js` (구독)
- `js/core/GameState.js` (day/totalTP/jobId 인용)
- 외부 라이브러리: 없음 (crypto.randomUUID 폴백 직접 구현)

---

## 5. 이벤트 envelope 데이터 형식

### 5.1 envelope 공통

```json
{
  "ts": 1715846400000,
  "sessionId": "20260522-093000-a1b2",
  "channel": "playerDied" | "dayEnd" | "skillLevelUp" | "itemConsumed" | "npcRecruited" | "questCompleted" | "craftComplete",
  "payload": { ... 채널별 ... }
}
```

### 5.2 채널별 payload

| 채널 | payload |
|------|---------|
| `playerDied` | `{ cause, day, totalTP, jobId }` |
| `dayEnd` | `{ day, totalTP }` |
| `skillLevelUp` | `{ skillId, newLevel, day }` (skillName은 i18n 변동 가능 → 제외) |
| `itemConsumed` | `{ itemId, qty, day }` (consume site 확정 후 보강) |
| `npcRecruited` | `{ npcId, day, trust }` |
| `questCompleted` | `{ questId, day, bonusGranted }` |
| `craftComplete` | `{ blueprintId, outputCount, day }` |

### 5.3 envelope 크기 추정

평균 200B/엔트리 × 5000 엔트리 한도 = **최대 1MB/세션**. 100일 플레이 누적 추정:
- death 1회 / dayEnd 100회 / skillLevelUp ~50회 / itemConsumed ~500회 / npcRecruited ~5회 / questCompleted ~30회 / craftComplete ~200회 = 약 886 엔트리 → **~180KB/100일** → 1MB 가드 충분 여유.

---

## 6. 저장 전략

### 6.1 1차 — localStorage

- 키 패턴: `CARD_SURVIVAL_TELE_v1_{sessionId}` 세션별 분리
- 메타 키: `CARD_SURVIVAL_TELE_v1_session_index` (세션 목록 JSON 배열)
- 직렬화: `JSON.stringify(_events)` 30초마다 flush + beforeunload 즉시 flush

### 6.2 폴백 — IndexedDB (QuotaExceededError 시)

- 별도 DB `CardSurvivalTelemetry` / 객체 저장소 `sessions`
- localStorage 5~10MB 한도(브라우저별) 도달 시 자동 마이그레이션
- 본 사전 설계 단계에서는 **localStorage만 1차 구현**, IndexedDB 폴백은 M4 #2 안착 후 보강

### 6.3 안전 가드

- 직렬화 실패 → console.warn + 다음 flush 재시도
- 동일 sessionId 중복 호출 → `_events`만 갱신 (덮어쓰기)
- 5MB 초과 추정 시 가장 오래된 세션 archive로 이동 또는 사용자 자발 정리 안내

---

## 7. Export UX

### 7.1 자발 제출 흐름 (협의서 v6 §5.1)

1. 사용자 임의 시점 — 메뉴 → "텔레메트리 export" 버튼 클릭
2. `TelemetrySystem.exportAllSessionsJSON()` 호출 → Blob 생성 → 다운로드
3. 사용자가 파일을 자체 보관 또는 시스템 백승호에게 자발 송부

### 7.2 게임 종료(사망) 시 자동 제안

- `playerDied` 이벤트 후 모달 "이번 세션 텔레메트리 export?" 선택지 표시
- 거부 시에도 localStorage에 기록은 유지 (다음 세션에서 일괄 export 가능)

### 7.3 UI 위치 후보

- `js/screens/MainMenu.js` 또는 `js/screens/Pause.js`에 버튼 추가 (M4 #2 sub-step)
- 본 사전 설계 단계에서는 **MainMenu 신규 메뉴 항목 1줄 + ModalManager 의사 진행 흐름만 명세**

---

## 8. 익명성 보장 (협의서 v6 §5.1)

### 8.1 userId

- `crypto.randomUUID()` 또는 폴백 `Math.random().toString(36)` 16자
- localStorage에 1회 저장 후 재사용
- **외부 송신 없음** — 사용자 PC 내부 ID

### 8.2 sessionId

- 발급: `${YYYYMMDD-HHMMSS}-{rand4}` (게임 시작 시점 timestamp + 4자 랜덤)
- 세션별 분리 저장으로 사용자가 특정 세션만 export/삭제 가능

### 8.3 수집 안 하는 데이터 (의도적)

- 닉네임 / 캐릭터명 (jobId만 수집)
- IP / 브라우저 fingerprint
- 게임 외 시스템 정보 (OS / 브라우저 버전 등)

---

## 9. 본체 K1 산출 알고리즘 (M4 #4 의존)

본 TelemetrySystem이 적재한 데이터로 K1 산출:

```js
function computeBodyK1(sessions, jobId) {
  const jobSessions = sessions.filter(s => s.meta.jobId === jobId);
  const survived100 = jobSessions.filter(s => {
    const lastDay = Math.max(...s.events.filter(e => e.channel === 'dayEnd').map(e => e.payload.day));
    const died    = s.events.some(e => e.channel === 'playerDied');
    return lastDay >= 100 && !died;
  });
  return jobSessions.length > 0 ? survived100.length / jobSessions.length : null;
}
```

→ K1 = (직업별 100일 도달 세션 / 총 세션). M4 #4 본체 K1 측정 단계에서 산출 + 시뮬 K1과 비교.

---

## 10. 작업 분할 (M4 #2 sub-steps)

### 10.1 단계 A — 신규 emit 3건 (소요 1일)

- [ ] `EventBus.js` Known event channels 주석에 `playerDied` / `dayEnd` / `itemConsumed` 추가
- [ ] `TickEngine.js:27` `dayEnd` emit 1줄
- [ ] `StatSystem.js:411` + `CombatSystem.js:1266` + `DiseaseSystem.js:432` `playerDied` emit 각 1줄
- [ ] `itemConsumed` 사이트 확정 후 emit 1~수줄

### 10.2 단계 B — TelemetrySystem.js 신규 (소요 2일)

- [ ] 모듈 골격 (~80줄)
- [ ] 7 채널 핸들러 (~70줄)
- [ ] _push / _flush (~50줄)
- [ ] export 함수 3종 (~75줄)
- [ ] uuid / sessionId 유틸 (~15줄)

### 10.3 단계 C — 진입점 + Export UI (소요 1일)

- [ ] `js/main.js` `Game.start()`에 `TelemetrySystem.init()` 등록
- [ ] `MainMenu.js` 또는 `Pause.js`에 export 버튼 1개 추가
- [ ] `ModalManager.js` "텔레메트리 export?" 모달 (선택)

### 10.4 단계 D — 검증 (소요 1일)

- [ ] `node --check js/systems/TelemetrySystem.js` OK
- [ ] `validate.js` Errors 0 ALL CLEAR (데이터 무변경)
- [ ] 헤드리스 1회 플레이 — 1일 진행 후 dayEnd 1건 / 강제 사망 후 playerDied 1건 / export JSON 형식 확인
- [ ] localStorage 키 패턴 검증

총 소요 추정: **4~5일** (M4 진입 2026-05-22 → 마감 2026-05-29 7일, 여유 2~3일)

---

## 11. 의도적 비범위 (M4 #2 외)

| 항목 | 사유 |
|------|------|
| 서버 업로드 / 백엔드 API | 협의서 v6 §5.1 채택 외, 후보 ii 미채택 |
| 익명 사용자 통계 분석 도구 | M4 #4 단계 분담 (산출 알고리즘만 §9에 명세) |
| 시뮬 telemetry (시뮬 모사 본체 telemetry) | 시뮬은 baseline 측정 인프라로 이미 충분 |
| 다국어 export 라벨 | jobId/itemId만 수집, 라벨은 i18n 분리 |
| Real-time dashboard | M4 #4 이후 별도 트랙 후보 |
| 안티치트 / 데이터 무결성 검증 | 본 트랙은 측정용, 변조 가정 시에도 격차 측정 의미 유지 |

---

## 12. 위험 + 완화

| ID | 위험 | 등급 | 완화 |
|----|------|------|------|
| T1 | `itemConsumed` 사이트가 분산되어 신규 emit 부담 ↑ | MED | M4 진입 D+0 BoardActions/ConsumeSystem 확인 후 wrapper 헬퍼 도입 |
| T2 | localStorage 5MB 한도 도달 (장기 플레이) | LOW | 세션별 분리 + 자발 정리 안내 + IndexedDB 폴백(M4 #2 안착 후) |
| T3 | `_flush` 30초 주기 사이 브라우저 강제 종료 시 데이터 손실 | LOW | `window.beforeunload` 즉시 flush 등록 |
| T4 | 사용자 자발 export 율 ↓ → 본체 K1 측정 N 부족 | MED | M4 #4 단계에서 베타 1회차는 본인 자체 플레이 + N≥6 (6직업 각 1회) 우선 |
| T5 | 신규 emit 3건 추가가 기존 시뮬 fingerprint 회귀 유발 | LOW | 시뮬 EventBus는 본체와 분리 — drift.mjs leaf hash 검증으로 차단 (M4 #3 마지노선) |

---

## 13. 검증 절차

본 사전 설계 채택 후 진입(2026-05-22):

1. 단계 A → B → C → D 순차 진행
2. 각 단계 완료 시 `node --check` + `validate.js` 회귀 검증
3. 단계 D 끝에 헤드리스 1회 플레이로 7 채널 emit 확인
4. M4 #2 마감 (2026-05-29) 시 `prompt_plan.md` 체크박스 갱신 + 단정 보고

---

## 14. 미결정 사항 (M4 진입 시 결정)

- [ ] `itemConsumed` emit 사이트 (1 사이트 vs wrapper 헬퍼) — 코드 확인 후 결정
- [ ] export UI 위치 (MainMenu vs Pause vs 신규 메뉴) — AD 오은별 시안 또는 PD 결정
- [ ] 사망 시 자동 export 제안 모달 — UX 결정 (사용자 또는 PD)

---

## 15. 참고

- 협의서 v6: `docs/milestones/2026-05-15-m4-telemetry/00-decisions/PD_TELE_MEETING_v6_decision.md`
- prompt_plan.md §M4 #2
- EventBus 구현: `js/core/EventBus.js`
- AutoSave 패턴 (저장 시스템 init 참조): `js/persistence/AutoSave.js`
- M3 §11 종결 단언: `docs/milestones/2026-05-10-persona-meeting/00-decisions/PD_MILESTONE_M3_close.md`

---

*사전 설계 끝. 시스템 백승호 작성. M4 진입(2026-05-22) 전 휴지 기간 중 점검·수정 가능. PD 김재훈 검토 후 작업 분할 단계 A~D 진입 권고.*
