# 시스템 — 시뮬 v2 PR2 보고

> 작성: 시스템 백승호 / 2026-05-11
> 대상: `tools/sim/v2/` PR2 산출물
> 결정: **머지 가능.** 단위 검사 130/130 통과. **14개 BOOTSTRAP 시스템 모두 시뮬 환경에서 init 성공.**

---

## 1. 산출물

| 파일 | 역할 |
|------|------|
| `tools/sim/v2/systemBootstrap.mjs` | 게임 14 시스템 init·teardown (BOOTSTRAP 카테고리) |
| `tools/sim/v2/drift.mjs` | Proxy 기반 BALANCE 트레이스 + balanceFingerprint |
| `tools/sim/v2/tests/systemBootstrapOrder.test.mjs` | main.js init 순서 일치 검증 (19 검사) |
| `tools/sim/v2/tests/eventBusCleanup.test.mjs` | bootstrap → teardown → bootstrap 사이클 누수 0 (8 검사) |
| `tools/sim/v2/tests/driftDetection.test.mjs` | Proxy 추적·fingerprint·CHARACTERS drift (16 검사) |
| `docs/.../SYS_SIM_SKIP_classification.md` | 27 시스템 → BOOTSTRAP 14 / UNCERTAIN 17 / SKIP 4 분류 |

---

## 2. 단위 검사 결과 — **130/130 통과**

```
characterAdapter      72/72  ✅ (PR1)
startDistrict          8/8   ✅ (PR1)
seedDeterminism        7/7   ✅ (PR1)
systemBootstrapOrder  19/19  ✅ (PR2, 신규)
eventBusCleanup        8/8   ✅ (PR2, 신규)
driftDetection        16/16  ✅ (PR2, 신규)
─────────────────────────────────────
                     130/130 통과
```

---

## 3. BOOTSTRAP 14 시스템 실측

### 3.1 init 성공

`eventBusCleanup.test.mjs` 실행 결과:
```
1st bootstrap: 14 ok, 0 error
2nd bootstrap: 14 ok
```

**globalShim 적용 후 14 시스템 모두 시뮬 환경에서 무탈하게 init.** R2 위험(window·DOM 의존성) 해소.

### 3.2 main.js init 순서 일치

`systemBootstrapOrder.test.mjs`가 `js/main.js`를 readFileSync로 읽어 각 BOOTSTRAP 시스템의 init() 호출 라인 일치 검증:
- 14 시스템 모두 main.js의 명시 라인 번호에 `{Name}.init()` 존재.
- BOOTSTRAP_ORDER가 main.js 라인 번호 오름차순으로 정렬됨.
- 중복 없음 (BOOTSTRAP·UNCERTAIN·SKIP 35 카테고리 교차 0).

→ main.js 변경 시 본 검사가 자동으로 fail. 시뮬 v2 drift detection의 1차 방어선.

### 3.3 EventBus cleanup 검증

`teardownSystems()` 호출 → `EventBus._listeners = {}` + `HospitalSiegeSystem._initialized = false`.
- 초기 listener 수 ≤ 5 (시뮬 startup).
- 1st bootstrap 후 listener 수 N (≥ 14).
- teardown 후 0.
- 2nd bootstrap 후 다시 N (1st와 동일).
- 3rd bootstrap (auto-teardown) 동일.

→ R4 위험(회차 사이 누수) 해소.

---

## 4. drift detection 핵심 발견

### 4.1 BALANCE 트리 leaf 227개

```
driftDetection.test 출력: BALANCE total leaves: 227
```

시뮬 v2가 baseline 측정 시 추적해야 할 키 총량. PR3 reporters 작성 시 이 수치를 기준으로 coverage 측정.

### 4.2 balanceFingerprint 결정성

```
fingerprint: len316-h242a5b5f
```

정렬된 BALANCE JSON sha-like 해시. 동일 호출 → 동일 결과 검증됨. baseline 빌드 태그에 첨부 가능.

(spike B4 권고: 정렬된 객체 직렬화의 sha256. 본 PR2는 simple hash로 결정성만 보장. PR3에서 Node `crypto.createHash('sha256')`로 교체 가능.)

### 4.3 TRACED_BALANCE Proxy 검증

```js
const h = TRACED_BALANCE.stats.hydrationDecayPerTP;   // → 1
const a = TRACED_BALANCE.armor.damageReductionCap;    // → 0.5
```

자동으로 `usedBalance` Set에 추가됨. Phase 0 spike 결과 그대로.

---

## 5. SIM_SKIP 분류 확정 (실측 반영)

`SYS_SIM_SKIP_classification.md`의 35 시스템 분류:

| 카테고리 | 수 | 상태 |
|----------|----|----|
| BOOTSTRAP | 14 | ✅ 모두 시뮬 환경에서 init 성공 |
| UNCERTAIN | 17 | ⏳ PR2.5 spike에서 개별 검증 |
| SKIP | 4 | 영구 SKIP (OnboardingSystem·SoundSystem·BGMSystem·CinematicScene) |
| **총** | **35** | |

(PR1 보고서의 27 시스템 추정은 `tpAdvance` 구독 시스템만 count. PR2 분류표는 init 호출 전체.)

---

## 6. UNCERTAIN 17 시스템 PR2.5 spike 절차

각 시스템에 대해 다음 단계:

1. **import 시도** — module load 성공 여부.
2. **init() 호출** — DOM·window·외부 의존 fail 여부.
3. **단일 TP emit** — `EventBus.emit('tpAdvance', { totalTP: 0 })` 후 GameState 정상 변경 여부.
4. **회차 사이 reset** — _unsubscribeAll() 등 cleanup 메서드 존재 여부.

결과:
- 4단계 모두 통과 → BOOTSTRAP 승급. systemBootstrap.mjs 추가.
- 3단계 통과(reset 부재) → BOOTSTRAP 가능, 시뮬 측 cleanup 신설.
- 1~2단계 fail → SKIP 강등. baseline 신뢰도에 명시.

**PR2.5 산출:** `SYS_SPIKE_uncertain_17.md` (17 시스템 검증 결과 + 최종 분류 확정).

---

## 7. 사이드 이펙트 검증

### 7.1 게임 코드 영향
PR2 머지가 `js/` 0 변경. 시뮬 측 5 파일 신규 + 1 분류표 문서.

### 7.2 validate.js 회귀
영향 없음 (game data 변경 0).

### 7.3 PR1 회귀
PR1 단위 검사 87건 그대로 통과. PR1 산출물 영향 0.

---

## 8. baseline 측정 신뢰도 추정

현재 BOOTSTRAP 14 시스템만 활성 시 baseline 결과의 신뢰도:

| 영역 | 모델링 상태 |
|------|-------------|
| 스탯 decay (hydration·nutrition·morale·fatigue) | ✅ (StatSystem + SeasonSystem) |
| 야간 처리 | ✅ (NightSystem) |
| 4 이벤트 시스템 중 hospitalSiege | ✅ |
| 4 이벤트 시스템 중 raid/horde/raider | ⏳ (NoiseSystem이 통합 진입점이지만 NPCSystem·CombatSystem 의존 가능성) |
| 사망·엔딩 | ✅ (EndingSystem + BodySystem) |
| 질병·오염 | ✅ |
| 함정·소음 | ✅ |
| 낚시 | ✅ |
| 스킬 XP | ✅ |
| 일반 퀘스트 | ✅ |
| NPC 시스템 | ❌ (UNCERTAIN 17개에 포함) |
| 제작·전투·탐색 | ❌ (UNCERTAIN) |
| 베이스캠프·구조물 | ❌ (UNCERTAIN) |
| 메인 퀘스트 | ❌ (NPCQuestSystem UNCERTAIN) |

**현 시점 baseline은 "탐색·전투·제작 없는 환경" 시뮬.** chef·doctor·firefighter의 시작 환경·자원 격차는 측정 가능, 진행성 게임 플레이는 PR2.5 후 측정 가능.

---

## 9. 위임 / 후속

| ID | 작업 | 담당 |
|----|------|------|
| 9.1 | **PR2.5 — UNCERTAIN 17 spike** | 시스템 백승호 |
| 9.2 | GameState reset 헬퍼 신규 (회차 사이 stat reset, inv reset) | 시스템 백승호 (PR2.5) |
| 9.3 | PR3 reporters 6건 (PR2 머지 후) | 시스템 백승호 |
| 9.4 | balanceFingerprint sha256 교체 (PR3) | 시스템 백승호 |
| 9.5 | baseline 측정 신뢰도 § 8 표 갱신 (PR2.5 후) | 시스템 백승호 |

---

## 10. 결론

PR2는 머지 가능. **시뮬 v2 인프라가 게임 14 시스템을 실제로 init할 수 있음을 실증.** 130/130 단위 검사 + 14/14 시스템 init 성공 + cleanup 안전성 확인.

PR2.5 (UNCERTAIN 17 spike) 진입 권고. baseline 측정 신뢰도를 90%+로 끌어올린 후 PR3·PR4 진입.

---

*문서 끝. PR2.5는 systemBootstrap을 확장하는 형태. 큰 변경 없이 표 갱신만으로 끝날 가능성도 있음.*
