# 시뮬레이션 툴 레퍼런스 (tools/sim/v2)

> **작성: 2026-06-06 / 기준: 실제 코드(`tools/sim/v2/`) + baseline v15.**
> 헤드리스로 실제 게임 시스템을 구동해 직업별 생존 KPI를 측정하는 밸런스 도구.
> 트랙 정체성(협의서 v5 §15): baseline KPI는 *시뮬 K1·K3·K5 마지노선*. 본체 K1과의 매핑은 M4 텔레메트리로 분리.

---

## 1. 개요

- **목적**: "이상적 player AI"가 100일(7,200 TP) 생존을 시도할 때의 직업별 KPI를 결정론적으로 측정.
- **본질**: 게임 본체의 41개 시스템 중 31개를 실제 import·init 후, `playerAI`가 매일 행동을 대리 수행.
- **시뮬-본체 분리**: 시뮬 K1은 이상적 AI의 마지노선이며, 실제 player와의 격차(K_sim_drift)는 M4 텔레메트리(`tools/telemetry/computeK1.mjs`)로 별도 측정.

---

## 2. 파일 구조 (27 파일 ~2,144줄)

```
tools/sim/v2/
├── index.mjs              # CLI 엔트리 (--list / --info / --char / --runs / --seed)
├── run_baseline.mjs       # 생산용 측정 — 6직업 × 100회, JSON 저장 + 요약 출력
├── runner.mjs             # 단일/배치 회차 실행 (TP 루프, EventBus hook)
├── systemBootstrap.mjs    # 게임 시스템 31개 init (BOOTSTRAP_ORDER)
├── gameStateReset.mjs     # 회차 간 GameState 초기화 (captureInitialState/reset)
├── gameStateFactory.mjs   # GameState 생성
├── characterAdapter.mjs   # characters.js → 시뮬 config
├── playerAI.mjs           # player 자동 행동 (9단계 우선순위, 399줄)
├── rng.mjs                # mulberry32 seeded RNG (결정성)
├── drift.mjs              # balanceFingerprint + balanceLeafHash + 사용 추적
├── spike_uncertain.mjs    # 시스템 분류 spike
├── mocks/                 # globalShim·renderer·sound·i18n (UI 무력화)
├── reporters/             # 6 KPI 리포터 + index
└── tests/                 # 6 자체 테스트 (node로 직접 실행)
```

---

## 3. 실행 방법

```bash
# 직업 목록
node tools/sim/v2/index.mjs --list

# 단일 직업 N회 (디버그)
node tools/sim/v2/index.mjs --char chef --runs 5 --seed 0

# 직업 config 확인
node tools/sim/v2/index.mjs --info --char doctor

# ★ 생산용 baseline 측정 (6직업 × 100회)
node tools/sim/v2/run_baseline.mjs
#   → simulation-data/baselines/raw/BAL_SIM_baseline_v15_result.json 저장
#   → K1/K3/K5 + drift 콘솔 요약

# 자체 테스트 (vitest config 밖 — node로 직접)
node tools/sim/v2/tests/seedDeterminism.test.mjs
```

> ⚠️ `index.mjs` 출력의 `buildTag: 'sim-v2-PR3' / phase: 'incomplete'`는 **옛 라벨**. 완성본은 `run_baseline.mjs`(`phase: 'complete'`).

---

## 4. 아키텍처

### 4.1 회차 루프 (`runner.mjs` `runSingleRun`)

1. `resetGameStateForRun({ characterId })` — GameState를 초기 스냅샷으로 복원 + 직업 config 주입
2. `bootstrapSystems()` — 31개 시스템 init
3. `Math.random`을 seeded RNG로 monkey-patch (결정성 100%)
4. **TP 루프** (0 ~ 7,200): day 시작 시 `runDayAI(simInv)` 1회 호출 → `EventBus.emit('tpAdvance')` → 시스템 decay
5. day 30/60/90에 자원 스냅샷, EventBus hook으로 이벤트 적재
6. `isAlive=false` 시 break, teardown, RNG 복원

### 4.2 시스템 부트스트랩 (`systemBootstrap.mjs`)

- **BOOTSTRAP 31개**: Ending·Stat·Season·Disease·Weather·Noise·Ecology·NPC(4)·Dispatch·Guard·PatientIntake·HospitalSiege·Mental·Body·Contamination·Encumbrance·Craft·Combat·Fishing·Explore·Skill·Basecamp·Quest·HiddenElement·Trap·Subway·Night·NPCQuest
- **영구 SKIP 4개**: Onboarding·Sound·BGM·CinematicScene (UI/연출성)
- `systemBootstrapOrder.test`가 main.js init **상대 순서**와 대조 (절대 라인번호 비의존)

### 4.3 Player AI (`playerAI.mjs`) — 9단계 행동 우선순위

| 순위 | 행동 | 조건 |
|------|------|------|
| 1 | 수면 | fatigue > 60 → fatigue↓ + HP↑ |
| 2 | 수분 보충 | hydration < 80 → water류 소비 |
| 3 | 요리 | food 레시피 가능 시 영양가 최대 산출 1개 |
| 4 | 영양 보충 | nutrition < 30 → 가공식·통조림·고기·생선 |
| 5 | 사기 회복 | morale < 30 → onConsume.morale 최대 아이템 |
| 6 | 이동 | 음식+물 < 2 & day>3 → 안전 인접 구 |
| 7 | 탐색 | 매일 3회 자원 채집 |
| 8 | 낚시 | hasFishing 구 + 낚싯대 → 어획 1회 |
| 9 | 위기 craft | nutrition<50 OR morale<30 → 추가 craft (PR16) |

- **Tier-2 ability 가산**(PR15): `moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus`·`moraleOnCraft`·`sketchNotebookBonus` 4필드 (`dismantle`은 sim 미모델)
- **의도적 미모델링**: 구조물/도구 요구(campfire 등), UI 입력, 전투 수동조작 → "본체 측 모델링 영역"

### 4.4 결정성

- `rng.mjs` mulberry32 seeded → 동일 시드 = 동일 결과
- `seedDeterminism.test` 회차 독립성 보장 (회차 간 상태 누수 수정 완료, 2026-06-05)

---

## 5. KPI 6종 (`reporters/`)

| KPI | 리포터 | 핵심 출력 필드 |
|-----|--------|---------------|
| **K1** 생존율 | `survivalRate` | `byCharacter[c].{runs, survived, ratePct, ci95Pct}` + `crossCharacterGapPct`. 목표 10~20%, 직업 격차 ≤5%p |
| **K3·K5** 사망일·원인 | `deathDay` | `byCharacter[c].{deaths, meanDay, medianDay, causeDistribution}` |
| 도달 콘텐츠 | `reachableContent` | legendary·secretEnemy·secretCombo별 `{uniqueReached, pctRunsWithAny, uniqueIds}` |
| **K6** 절망 진입 | `moraleDespair` | `byCharacter[c].{enteredDespair, pctEntered, avgBlockExplorePerRun}`. >25% = 데스 스파이럴 의심 |
| **E1~E5** 이벤트 폭주 | `eventOverlap` | day 60~100 `E1_pctSimultaneousLateOverlap`, `E2_meanEventsPerRunLate`, `E3_pairFrequency`, `eventCountByType` |
| **K7** 자원 추이 | `resourceOverTime` | day 30/60/90 `byCharacter[c].byDay[d].avg{hydration, nutrition, ...}` |
| 행동 프로파일 | `behaviorProfile` | 직업별 `actionCounts·exploreByDistrict·craftedItems·consumedItems·fishing·moves·combat·quests`. 상세: [`SIMULATION_BEHAVIOR.md`](./SIMULATION_BEHAVIOR.md) |

---

## 6. 결과 JSON 형식 (`BAL_SIM_baseline_vN_result.json`)

```jsonc
{
  "schemaVersion": 2,
  "buildTag": "sim-baseline-v15-detfix",
  "phase": "complete",
  "balanceFingerprint": "len316-h242a5b5f",   // BALANCE KEY 구조 hash (값 변경 미탐지)
  "balanceLeafHash": "n227-he960c78b",         // BALANCE leaf 값 hash (값 변경 탐지, M4 #3)
  "characters": ["doctor", "soldier", ...],     // 6직업
  "totalRuns": 600,
  "runs": [
    { "runId", "character", "seed", "alive", "survivedDays",
      "deathDay", "deathCause", "eventsCount", "bootstrapErrors" }
  ],
  "kpi": { /* summarizeAll: survivalRate, deathDay, reachableContent, moraleDespair, eventOverlap, resourceOverTime */ },
  "drift": { "balanceLeafTotal": 227, "coverage": 0 },
  "meta": { "runsPerCharacter": 100, "seedBase": 0, "targetDays": 100, "totalDurationMs": ~11000 }
}
```

### 6.1 drift 두 컬럼 (보완 관계)

- **`balanceFingerprint`** = `JSON.stringify(BALANCE, 최상위키 replacer)` hash. KEY 구조 변경만 탐지(13연속 `len316-h242a5b5f` 유지 = 구조 불변). **중첩 leaf 값 변경은 못 잡음.**
- **`balanceLeafHash`** = (경로=값) 전수 정렬·hash. `fishing.baseCatchChance 0.30→0.50` 같은 값 변경을 탐지.

---

## 7. 현재 데이터 (baseline v15, 2026-06-05)

- 6직업 × 100회 = **600 runs / ~11초** / bootstrapErrors 0 / 결정성 100%
- fingerprint `len316-h242a5b5f` / leafHash `n227-he960c78b`

| 직업 | K1 (생존율) | K3 (평균 사망일) |
|------|-----------|----------------|
| doctor | 0.0% | day 4.2 |
| soldier | 0.0% | day 5.0 |
| firefighter | 0.0% | day 5.0 |
| homeless | 0.0% | day 5.0 |
| chef | 0.0% | **day 7.7** (단독 최장) |
| engineer | 0.0% | day 5.0 |

**K5 사망 원인** (600회): 아사 506 (84%) · 탈수 56 · 극도 피로 32 · 절망 6.

> ★ v15 핵심: 결정성 누수 수정으로 v14까지의 "절망 사망 과대 계상"이 교정됨(정규화 절망 208→6, 아사 302→506). **진짜 병목은 아사(영양).** 상세: `simulation-data/baselines/reports/BAL_SIM_baseline_v15_report.md`.

---

## 8. 본체 데이터와의 비교 (K_sim_drift)

```bash
# 시뮬 측
node tools/sim/v2/run_baseline.mjs

# 본체 측 (실제 플레이 → 설정 모달 export → JSON)
node tools/telemetry/computeK1.mjs telemetry_all_<userId>.json
```

- **K_sim_drift** = |본체 K1 − 시뮬 K1| (직업별). 마지노선 ≤ 10%p (협의서 v6 §4.2)
- 시뮬 K1 전부 0%(day 4~8 아사) vs 본체 K1(실제 player)의 차이가 시뮬 AI의 보수성을 정량화
- M4 #4(베타 플레이) → M4 #5(K_sim_drift 단정·마감 보고)에서 산출

---

## 9. 한계·주의

| 항목 | 내용 |
|------|------|
| player 모델 | "이상적 대리 추정"이며 실제 player 선택과 다름 (M4 텔레메트리로 검증) |
| 시뮬 K1 0% | 시뮬 AI 보수성 한계이지 본체 밸런스 게이트(10~20%)가 아님 |
| 미모델 | 구조물/도구 요구, UI 입력, dismantle 행동(R13-1 미구현) |
| 표본 | 100회/직업 — 저빈도 콘텐츠(legendary 등) 신뢰구간 넓음 |
| 직업 수 | 6직업(출시 확정). 일부 옛 M3 보고서의 "7직업/700회"는 약사 포함 가정 |

---

## 10. 관련 문서

| 문서 | 위치 |
|------|------|
| baseline v15 보고서 | `simulation-data/baselines/reports/BAL_SIM_baseline_v15_report.md` |
| 행동 프로파일 (직업별 탐색·제작·소비·전투·퀘스트) | `docs/SIMULATION_BEHAVIOR.md` |
| baseline 데이터 인덱스 | `simulation-data/README.md` |
| 진행 트랙 (M4) | `prompt_plan.md` §M4 |
| 기획 현황 | `docs/PLANNING_STATE.md` |
| K1 산출 스크립트 | `tools/telemetry/computeK1.mjs` |

---

*문서 끝. 시뮬 구조·KPI 변경 시 본 문서 우선 갱신.*
