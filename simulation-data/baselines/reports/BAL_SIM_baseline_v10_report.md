# 밸런스 — baseline v10 측정 보고 (PR15 후)

> 작성: 밸런스 권지나 / 2026-05-12
> 측정 대상: PR15(`tools/sim/v2/playerAI.mjs` ability 가산 분기 5필드 — `moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus`·`moraleOnCraft`·`sketchNotebookBonus` 4필드 구현 + `moraleOnDismantle` 1필드 sim 미모사 skip) 머지 후
> 결정: **K1 0% 11회 연속** (PR5 → PR15). R8-1 **큰 추가 완화 단정** (절망 v9 377 → v10 303, **-74건**). 사인 전이 (절망 → 아사 +62). R10-1 폭증분 v8 405 → v10 303 누적 -102 (폭증분 44.0% 회수).
> **R13-1 부분 해소 단정** — 4필드 구현 + 1필드 skip(`moraleOnDismantle`, sim 미모사). 잔존 격차 일차 원인은 `playerAI.mjs` craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day. **R15-1 신규 위험 등록 단언** — playerAI craft 발동 빈도 보강 PR16 후보.
> **R11-1 액션 트리거 (3) 발동 단언** — chef 격차 정의 2 v9 +0.50d → v10 **+0.46d** (Δ -0.04d, +0.5d 미만 추가 좁힘). 협의서 v4 §13.2 액션 트리거 정의 충족. **M3 #19 PR14 chef 정체성 강화 트랙 진입 의무 단언.** 협의서 v4 §14.4 사전 등록 충족.

---

## 1. 서두

### 1.1 측정 환경

- 시뮬: `tools/sim/v2/` (PR1~PR15 누적). PR15 변경 라인 1 파일 `tools/sim/v2/playerAI.mjs` ~50~100줄 (시스템 백승호 1차 단정 인용):
  - `_applyAbilityBonusesToConsume(itemId, deltas)` 신규 함수 — onConsume 적용 시 `GameState.player.moraleRecoveryBonus`·`sketchNotebookBonus`·`lowMoraleRecoveryFatigueBonus` 가산
  - `applyOnConsume(itemId)` 수정 — `_applyAbilityBonusesToConsume` 호출 분기 추가
  - `_grantCraftMorale()` 신규 함수 — `GameState.player.moraleOnCraft` 가산. `actT1Convert`·`actCook` 산출 직후 호출
  - `moraleOnDismantle` skip — sim에 dismantle 행동 없음. 주석 명시 (시스템 백승호 1차 단정 인용)
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 700 runs (7직업 × 100회), `RUNS_PER_CHARACTER=100`, `SEED_BASE=0`
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: **10.6초** (`meta.totalDurationMs = 10572`)
- BALANCE leaf 합: 227 (`drift.balanceLeafTotal`), **fingerprint `len316-h242a5b5f`** — v3·v4·v5·v6·v7·v8·v9·v10 동일 (**v3~v10 8연속 유지**)
- 결과 파일: `BAL_SIM_baseline_v10_result.json`
- buildTag: `sim-baseline-v10-pr15`
- bootstrapErrors 합: **0/700** (전 회차 시스템 init 정상, `runs[*].bootstrapErrors` 합산 0)

### 1.2 PR15 적용 차이 (v9 대비) — ability 가산 분기 5필드

PR15 머지 결과 (시스템 백승호 1차 단정 인용):

**구현 4필드:**

| 필드 | 위치 | 적용 행동 | 단정 |
|------|------|-----------|------|
| `moraleRecoveryBonus` (homeless 1.5) | `_applyAbilityBonusesToConsume` | `applyOnConsume` 호출 시 onConsume.morale × 1.5 | ✅ 구현. homeless worn_photo·newspaper_bundle morale 가산 분기 발동 |
| `lowMoraleRecoveryFatigueBonus` (homeless -5) | `_applyAbilityBonusesToConsume` | 회복 직전 morale<30 + morale 회복>0 시 fatigue -5 | ✅ 구현. homeless 저사기 회복 fatigue 보너스 발동 |
| `moraleOnCraft` (engineer +5) | `_grantCraftMorale` | `actT1Convert`·`actCook` 산출 직후 morale +5 | ✅ 구현. engineer craft 행위 시 morale 가산 |
| `sketchNotebookBonus` (engineer true) | `_applyAbilityBonusesToConsume` | sketch_notebook 소비 시 morale·fatigue × 1.5 | ✅ 구현. engineer sketch_notebook 보너스 발동 |

**skip 1필드:**

| 필드 | 사유 | 단정 |
|------|------|------|
| `moraleOnDismantle` (engineer +5) | sim에 dismantle 행동 없음 — `actDismantle` 함수 미정의. playerAI.mjs 행동 우선순위 (수면·수분·요리·영양·사기·이동·탐색·낚시) 안에 dismantle 부재 | ⚠️ **skip 단정** (시스템 백승호 1차 단정 인용). engineer Tier-2 ability effect 5필드 중 1필드(20%) 미평가 |

BALANCE 객체 미관여 — fingerprint 영향 0 정합. PR15 효과는 (a) `_applyAbilityBonusesToConsume`로 onConsume 가산, (b) `_grantCraftMorale`로 craft 가산 2 경로.

### 1.3 fingerprint 단정 — v3~v10 8연속 유지 + drift 측정 한계 재인용

`drift.balanceLeafTotal = 227`, fingerprint `len316-h242a5b5f` — **v3·v4·v5·v6·v7·v8·v9·v10 모두 동일** (8연속 유지).

PR15는 `tools/sim/v2/playerAI.mjs` 단일 시뮬 로직 파일만 변경. BALANCE 객체 미관여 + fingerprint 무영향 정합 (회의록 §14.4 사전 단정 충족). 결정성 100% — 시드 동일, 행동 분기 RNG 무사용(deltas 가산은 곱셈/덧셈만), `_grantCraftMorale` RNG 무사용. 재실행 시 K1·K3·K5 동일성 단언.

**drift 측정 한계 (협의서 v4 §13.6 재인용):** leaf 값 회귀 검증 + 데이터 파일 회귀 검증을 fingerprint 단독으로 보장 못함. 본 v10 측정은 PR15 시뮬 로직 변경이라 fingerprint 검증 적용 외임을 단정. M4+ 도구 트랙에서 leaf 값 hash + 데이터 파일 hash + 시뮬 로직 파일 hash 컬럼 추가 권고.

---

## 2. 메서드

- 700 runs (7직업 × 100회), SEED_BASE=0, runDays=100
- v3~v9와 동일 시드·동일 runner 흐름. 차이는 PR15의 `tools/sim/v2/playerAI.mjs` 1 파일 시뮬 로직 변경
- 결정성: Math.random → mulberry32 monkey-patch. fingerprint v3·v4·v5·v6·v7·v8·v9·v10 모두 `len316-h242a5b5f`
- bootstrapErrors 0/700 — 전 회차 시스템 init 정상 (`runs[*].bootstrapErrors` 합산 0)
- 결정성 100% (협의서 v3 §12.5 기준: 두 번째 재실행 K3/K5/fingerprint 동일 단언 적용)
- 사망 원인 집계: `BAL_SIM_baseline_v10_result.json:runs[*]` 700건 `deathCause` 빈도 — 결과 JSON `kpi.deathDay.byCharacter[*].causeDistribution` 직접 합산 결과 **`절망 303 / 아사 350 / 극도 피로 34 / 탈수 13`** 단정

---

## 3. K1 — 100일 생존율 (목표 ≥ 5%)

| 직업 | 생존율 v10 | ±CI95p | survived/runs | v9 비교 | v8 비교 |
|------|------------|--------|---------------|---------|---------|
| doctor | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| soldier | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| firefighter | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| homeless | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| chef | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| engineer | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| pharmacist | 0.00% | 0.00 | 0/100 | 0%p | 0%p |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p). `kpi.survivalRate.crossCharacterGapPct = 0`.

**판단: K1 목표(≥ 5%) 미달. baseline 11회 연속 0%** (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10 → PR11 → PR12+T1 → PR13 → PR15). ±3%p 신뢰구간 안에서 100% 0%.

PR15 효과는 **K3 미세 향상 (homeless +0.1d / engineer +0.1d) + K5 사망원인 분포 큰 변동 (절망 -74, 아사 +62)**에 머무름 (§4.2 + §5.1). day 100 도달 0건 유지. SCN_QUEST 두 파일 추정 K3 향상 (homeless +1.0~1.5d / engineer +0.9~1.4d) 대비 v9→v10 실측 (homeless +0.1d / engineer +0.1d) **잔존 격차 단정** (§4.3, §6.2). 격차 원인은 R15-1 신규 위험으로 등록 단언.

---

## 4. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean (v10) | median (v10) | mean (v9) | mean (v8) | mean (v7) | Δv9→v10 |
|------|------------|--------------|-----------|-----------|-----------|---------|
| doctor | 4.90 | 5 | 4.90 | 4.90 | 4.00 | 0 |
| soldier | 4.50 | 4 | 4.50 | 4.50 | 3.00 | 0 |
| firefighter | 5.00 | 5 | 5.00 | 5.00 | 3.00 | 0 |
| **homeless** | **4.30** | 4 | 4.20 | 4.20 | 4.10 | **+0.10** ★ |
| chef | 5.20 | 5 | 5.20 | 5.20 | 5.20 | 0 |
| **engineer** | **5.00** | 5 | 4.90 | 4.40 | 3.10 | **+0.10** ★ |
| pharmacist | 4.10 | 4 | 4.10 | 4.10 | 4.10 | 0 |

### 4.1 chef 격차 측정 — R11-1 액션 트리거 (3) 발동 단정

**정의 1: chef vs 다른 6직업 평균 (v4~v9 사용 정의)**
- v9: chef 5.20 / others6 ((4.90+4.50+5.00+4.20+4.90+4.10)/6 = 4.60) / gap **+0.60d**
- v10: chef 5.20 / others6 ((4.90+4.50+5.00+**4.30**+**5.00**+4.10)/6 = **4.633**) / gap **+0.567d** (Δv9→v10: **-0.033d**)

**정의 2: chef vs cooking lv 0 5직업 평균 (pharmacist 제외, 동질 비교)**
- v9: chef 5.20 / others5 ((4.90+4.50+5.00+4.20+4.90)/5 = 4.70) / gap **+0.50d**
- v10: chef 5.20 / others5 ((4.90+4.50+5.00+**4.30**+**5.00**)/5 = **4.74**) / gap **+0.46d** (Δv9→v10: **-0.04d**)

**판단 — R11-1 액션 트리거 (3) 발동 단언:**
- 협의서 v4 §13.2 R11-1 액션 트리거 정의 = "chef K3 < 5.0 **또는** 격차 +0.5d 미만 추가 좁힘". chef K3 v10 = 5.20 ≥ 5.0 충족 + **정의 2 격차 +0.46d < 0.50d** = 격차 +0.5d 미만 추가 좁힘 조건 충족 → **트리거 (2) 발동 단정**
- 협의서 v4 §14.4 사전 단정 충족: "PR15 머지로 homeless K3가 4.2 → 5.0+로 향상되면 정의 2 격차가 +0.5d 미만으로 깨짐. PR15 머지 시 R11-1 액션 트리거 발동 의무 사전 등록." 실측은 homeless K3 4.2 → 4.3 (Δ +0.1d, 사전 단정 +0.8d보다 작음)이나 engineer K3 4.9 → 5.0 (Δ +0.1d) 합산으로 정의 2 평균 4.70 → 4.74 (Δ +0.04d) = chef 5.20 고정 대비 격차 +0.04d 좁힘 → **+0.46d로 +0.5d 깨짐**
- 협의서 v2(PR9) §6.2 cook_intuition grace 재검토 트리거 +2.5d — 두 정의 모두 미충족 (정의 1 +0.567d / 정의 2 +0.46d)
- 협의서 v3(PR10) §9.5 KPI 목표 +1.0~+2.0d 사수 — 두 정의 모두 하한 미달 (정의 1 +0.567d / 정의 2 +0.46d)

**R11-1 액션 트리거 (3) 발동 단언:**
- 격차 정의 2 +0.46d < 0.50d = 액션 트리거 충족
- **M3 #19 PR14 chef 정체성 강화 트랙 진입 의무 단언** (협의서 v4 §14.5 표 항목 3 사전 등록 충족)
- PD/Balance + 시나리오 한도연 협의로 chef 전용 Tier-2 ability 또는 chef startInv·신규 자원 분배 결정 의무

### 4.2 homeless·engineer K3 +0.1d 단정 (PR15 ability 효과)

**homeless K3 v9 4.20 → v10 4.30 (+0.10d). 향상 경로 단정:**

| 후보 경로 | 적용 여부 | 추정 기여 |
|-----------|----------|----------|
| `street_solace.moraleRecoveryBonus: 1.5` (PR15 가산 분기) | ✅ **적용 (R13-1 부분 해소)** | +0.05~0.1d 추정 |
| `street_solace.lowMoraleRecoveryFatigueBonus: -5` (PR15 가산 분기) | ✅ **적용 (R13-1 부분 해소)** | +0.0~0.05d 추정 |
| `worn_photo` startInv 1개 소비 (v9 기준 적용) | ✅ 유지 | 기존 효과 |
| `newspaper_bundle` 25구 lootTable + onConsume.morale 부여 (v9 기준 적용) | ✅ 유지 | 기존 효과 |

**engineer K3 v9 4.90 → v10 5.00 (+0.10d). 향상 경로 단정:**

| 후보 경로 | 적용 여부 | 추정 기여 |
|-----------|----------|----------|
| `workshop_focus.moraleOnCraft: +5` (PR15 가산 분기) | ✅ **적용 (R13-1 부분 해소)** | +0.05~0.1d 추정 (actT1Convert + actCook 산출 시) |
| `workshop_focus.moraleOnDismantle: +5` (PR15 skip) | ❌ **skip (sim 미모사)** | 0d (engineer effect 5필드 중 1필드 미평가) |
| `workshop_focus.sketchNotebookBonus: true` (PR15 가산 분기) | ✅ **적용 (R13-1 부분 해소)** | +0.0~0.05d 추정 (sketch_notebook 소비 시 morale·fatigue × 1.5) |
| `sketch_notebook` startInv + `newspaper_bundle` (v9 기준 적용) | ✅ 유지 | 기존 효과 |

**단정:** PR15 ability 가산 4필드 구현 효과는 homeless·engineer 양 직업 모두 K3 +0.1d 미세 향상에 머무름. SCN_QUEST 추정 (homeless +1.0~1.5d / engineer +0.9~1.4d) 대비 실측 +0.1d는 **추정-실측 잔존 격차 단정** (§4.3 R15-1 신규).

### 4.3 SCN_QUEST 추정-실측 잔존 격차 (R15-1 신규 위험 등록)

PR15 ability 가산 분기 4필드 구현 후에도 SCN_QUEST 추정-실측 격차가 잔존함을 단정.

| 직업 | SCN_QUEST 추정 K3 향상 | v9→v10 실측 | Δ 잔존 격차 |
|------|----------------------|------------|------------|
| homeless | +1.0~1.5d (4.2 → 5.2~5.7) | +0.10d (4.2 → 4.3) | **-0.90~-1.40d** |
| engineer | +0.9~1.4d (4.4 → 5.3~5.8) | +0.10d (4.9 → 5.0) | **-0.80~-1.30d** |

> 참고: engineer K3 v8→v9 +0.5d는 PR13(데이터) 효과 + R13-1 ability 미발동 상태. v9→v10 추가 +0.1d는 PR15 ability 가산 분기 효과로 분리 단정.

**격차 원인 일차 단정 (시스템 백승호 1차 단정 인용):**

(a) **playerAI.mjs craft 발동 빈도 day 1회** — `runDayAI`에서 `actCook` 1회 호출 + `actT1Convert` 1회 호출(폴백). 산출 시 `_grantCraftMorale` 호출은 day 시작 1회 한정. SCN_QUEST §3 추정에서 가정한 4~6회/day craft 발동 대비 큰 격차. engineer `moraleOnCraft: +5` 가산이 day 1회 +5 morale에 머무름 (가정 4~6회/day = +20~30 morale)

(b) **`moraleOnDismantle` sim 미모사** — engineer Tier-2 ability effect 5필드 중 1필드 미평가. SCN_QUEST §3.2 가정에서 craft + dismantle 양 행위 가산이 morale 침식 지연 일차 경로. dismantle 결손으로 engineer effect 절반 평가

**R15-1 신규 위험 등록 단언:**
- ID: R15-1
- 정의: PR15 ability 가산 분기 4필드 구현 후에도 SCN_QUEST 추정-실측 잔존 격차 (homeless -0.9~-1.4d, engineer -0.8~-1.3d). 일차 원인은 playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day + moraleOnDismantle sim 미모사
- 트리거: PR15 머지 후 SCN_QUEST 추정 K3 향상 ≥ +0.5d 대비 실측 ≤ +0.2d 잔존 격차 유지
- 해소 경로 후보 (시스템 백승호 위임):
  - PR16 후보: `actCook`을 morale<30 시점 추가 발동 또는 `actInteractCraft` 빈도 증가 (day 2~3회 추가)
  - 또는 PR17 후보: dismantle sim 모사 (`actDismantle` 함수 신규 정의)
- 우선순위: **후순위** (M3 #19 chef 강화 + M3 #20 나머지 3직업 우선)

**R13-1 → R15-1 단계 이동 단정:** PR15 머지로 R13-1 4필드 해소 → R13-1 부분 해소 단언. R13-1 잔존(dismantle skip + 추정-실측 격차)은 R15-1로 신규 위험 분리 등록.

---

## 5. K5 — 사망 원인 분포

### 5.1 합산 v9→v10 — 절망 -74 큰 완화

| 원인 | v3 | v4 | v5 | v6 | v7 | v8 | v9 | **v10** | Δv9→v10 |
|------|----|----|----|----|----|----|----|---------|--------|
| 아사 | 569 | 569 | 532 | 510 | 506 | 263 | 288 | **350** | **+62** ★ 사인 전이 |
| 절망 | 110 | 113 | 142 | 167 | 173 | 405 | 377 | **303** | **-74** ★ R8-1 추가 완화 |
| 탈수 | 20 | 12 | 14 | 14 | 12 | 13 | 13 | **13** | 0 |
| 극도 피로 | 1 | 6 | 12 | 9 | 9 | 19 | 22 | **34** | +12 |

**큰 추가 완화 단정:**
- v8 → v9 절망 -28 부분 완화 → v9 → v10 절망 **-74 큰 추가 완화** (v8 → v10 누적 -102, v7→v8 폭증분 +232의 44.0% 회수)
- 아사 +62는 절망 진입 회피한 회차의 사인 전이 결과 (절망 → 아사). 사망원인 1위 v9 절망(377) → v10 아사(350) **역전 단정**
- 극도 피로 +12는 homeless·engineer fatigue 누적 결과 (homeless 극도 피로 v9 0 → v10 14건, §5.2)

### 5.2 직업별 K5 (v9 vs v10)

| 직업 | v10 K5 | v9 K5 | 변화 |
|------|--------|-------|------|
| doctor | 절망 98 / 극도 피로 1 / 아사 1 | 절망 98 / 극도 피로 1 / 아사 1 | 0 |
| soldier | 절망 50 / 아사 48 / 극도 피로 2 | 절망 50 / 아사 48 / 극도 피로 2 | 0 |
| firefighter | 아사 86 / 절망 11 / 극도 피로 3 | 아사 86 / 절망 11 / 극도 피로 3 | 0 |
| **homeless** | **아사 85 / 극도 피로 14 / 절망 1** | 절망 24 / 아사 76 | **절망 -23 / 아사 +9 / 극도 피로 +14** ★ |
| chef | 절망 83 / 탈수 11 / 극도 피로 6 | 절망 83 / 탈수 11 / 극도 피로 6 | 0 |
| **engineer** | **절망 20 / 아사 79 / 극도 피로 1** | 절망 71 / 아사 26 / 극도 피로 3 | **절망 -51 / 아사 +53 / 극도 피로 -2** ★ |
| pharmacist | 절망 40 / 아사 51 / 극도 피로 7 / 탈수 2 | 절망 40 / 아사 51 / 극도 피로 7 / 탈수 2 | 0 |

**중요 분석:**
- **engineer 절망 -51건** — PR15 `moraleOnCraft: +5` + `sketchNotebookBonus: 1.5×` 가산 분기 적용으로 morale 침식 큰 지연. 절망 사망 71 → 20 (-71.8%). 단 K3 +0.1d만 향상 = morale 회복은 사기 회복으로 충분하나 day 5 시점에서 nutrition 결핍(아사 +53건)으로 사망원인 전환
- **homeless 절망 -23건** — PR15 `moraleRecoveryBonus: 1.5` + `lowMoraleRecoveryFatigueBonus: -5` 가산 분기 적용. 절망 24 → 1 (-95.8%, 1건 잔존). 단 fatigue 보너스 효과로 fatigue 누적 가중 = 극도 피로 +14건 신규 발생 (v9 0 → v10 14). 사망원인 분포 redistribute (절망 → 아사 + 극도 피로)
- doctor·soldier·firefighter·chef·pharmacist K5 변화 0 — PR15 효과 5직업 미관여 (Tier-2 abilities 미보유 + onConsume.morale 가산 분기 효과 0)

### 5.3 R8-1 큰 추가 완화 단정 + 사인 전이 단정

**R8-1 (morale 회복 자원 부재) v8→v9→v10 추세:**
- v8: 절망 405 (사망원인 1위 역전, R10-1 폭증 신규)
- v9: 절망 377 (-28, homeless 단독 -22) → 부분 완화 단정
- **v10: 절망 303 (-74, homeless -23 + engineer -51) → 큰 추가 완화 단정**

**v8→v10 누적: 절망 -102건 (폭증분 +232의 44.0% 회수). 사망원인 1위 절망 → 아사 역전.** R8-1 ability effect sim AI 발동(PR15) + 자원 분배(PR13)의 합산 효과.

**사인 전이 단정 (절망 → 아사 +62):**
- engineer 사인 전이: 절망 71 → 20 (-51) / 아사 26 → 79 (+53). morale 회복 → nutrition 결핍 사망원인 redistribute
- homeless 사인 전이: 절망 24 → 1 (-23) / 아사 76 → 85 (+9) / 극도 피로 0 → 14 (+14). morale 회복 + fatigue 보너스 → nutrition·fatigue 결핍 사망원인 redistribute
- **단정:** R8-1 morale 회복은 사기 회복으로 충분, 후속 자원 부족(nutrition·fatigue) 결핍이 새 병목 단언. day 100 도달은 morale 단독 해소로 미충족. 후속 PR에서 nutrition·fatigue 자원 보강 또는 K3 절대값 향상 트랙 필요

**R10-1 추가 회수 단정:**
- v7 173 → v8 405 (+232 폭증) → v9 377 (-28) → **v10 303 (-74 추가)** = 누적 -102 (44.0% 회수)
- 완전 해소 미달성. 잔존 폭증분 +130 (v7 173 → v10 303). M3 #19 PR14 chef 강화 + M3 #20 나머지 3직업 진입 후 추가 회수 단정 필요

---

## 6. AI 발동 — Tier-2 ability + 신규 자원

### 6.1 worn_photo·sketch_notebook 발동 분포 (probe 1 인용)

**worn_photo (homeless startInv 1개):**
- probe 1 ability 가산 발동 (시스템 백승호 1차 단정 인용): **homeless worn_photo 99/100**
- onConsume.morale × `moraleRecoveryBonus 1.5` 가산 적용 = 기본 morale +12 → +18 추정
- 사실상 모든 회차에서 day 2~3 worn_photo 1회 소비 단정 (99/100)

**sketch_notebook (engineer startInv 1개):**
- probe 1 ability 가산 발동 (시스템 백승호 1차 단정 인용): **engineer sketch_notebook 100/100**
- onConsume.morale·fatigue × `sketchNotebookBonus 1.5` 가산 적용 = morale·fatigue 양 효과 1.5배
- 100/100 = 모든 회차에서 day 2~3 sketch_notebook 1회 소비 단정

**newspaper_bundle (25구 lootTable):**
- probe 1 ability 가산 발동: **homeless newspaper_bundle 91**
- 25구 yangchun에서 등장 빈도 91/100. moraleRecoveryBonus 간접 발동 단정 (시스템 백승호 1차 단정 인용)
- `moraleOnCraft` 간접 발동 단정 — `_grantCraftMorale` 호출 시 craft 행위(actT1Convert·actCook) 발동 day 1회 빈도 (R15-1 일차 원인)

### 6.2 morale<30 도달율 v9→v10 대폭 감소 (probe 2 인용)

**Probe 2 — morale<30 도달율 (시스템 백승호 1차 단정 인용):**

| 직업 | v9 day 2 | v10 day 2 | Δ |
|------|----------|-----------|---|
| homeless | 98% | **0%** | **-98%p** ★ |
| engineer | 100% | **0%** | **-100%p** ★ |

**day 4~5 도달율 (v10):**
- homeless day 4: 59% / day 5: 25% — worn_photo 소진 후 재진입
- engineer day 5: 54% — sketch_notebook 소진 + craft 발동 빈도 부족(R15-1) 후 재진입

**판단:**
- day 2 morale<30 도달 회피 단언 (PR15 ability 가산 분기 효과). homeless·engineer 양 직업 day 2 시점 morale 안정
- day 4~5 재진입은 (a) startInv 1회 소비형 소진 + (b) craft 발동 빈도 day 1회 한정(R15-1)으로 morale 회복 빈도 부족 → 후반 morale<30 재진입 단정
- K1 ≥ 5% 도달 미충족 일차 원인은 day 4~5 재진입 + 자원 결핍 사망원인 전환 (§5.3 사인 전이)

`kpi.moraleDespair.byCharacter`에 의하면 v10에서도 7직업 중 5직업(doctor·soldier·homeless·chef·pharmacist)이 `enteredDespair 100/100`. firefighter 87 / engineer **75** (v9 미측정. K6 직업별 첫 측정 기준). engineer 25/100 회피는 R13-1 부분 해소 효과 단언.

### 6.3 chef·pharmacist 회귀 0 검증

PR15는 시뮬 로직 1 파일 변경 — `_applyAbilityBonusesToConsume`·`_grantCraftMorale`. chef·pharmacist Tier-2 abilities 미보유 + onConsume.morale 가산 분기 효과 0 단언:

- chef: K3 5.20 = v9 동일 / K5 절망 83·탈수 11·극도 피로 6 = v9 동일 / 회귀 0 단언
- pharmacist: K3 4.10 = v9 동일 / K5 절망 40·아사 51·극도 피로 7·탈수 2 = v9 동일 / 회귀 0 단언
- doctor·soldier·firefighter K3·K5 모두 v9 동일 / 회귀 0 단언

**5직업 회귀 0 검증 단언.** PR15 시뮬 로직 변경이 ability 보유 2직업(homeless·engineer)에만 영향 단정.

---

## 7. KPI 표 비교 — v3~v10 8컬럼

협의서 v3(PR10) §9.5 + 협의서 v4(PR11) §13.7 + §14 통합 KPI:

| KPI | v3 | v4 | v5 | v6 | v7 | v8 | v9 | **v10** | 목표 | 충족 |
|-----|----|----|----|----|----|----|----|---------|------|------|
| K1 (전 직업) | 0% | 0% | 0% | 0% | 0% | 0% | 0% | **0%** | ≥ 5% | ❌ **11회 연속** |
| K3 doctor | 4.0 | 4.0 | 4.0 | 4.0 | 4.0 | 4.9 | 4.9 | **4.9** | +1d (5.0) | ⚠️ 거의 충족 (-0.1d) |
| K3 soldier | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 4.5 | 4.5 | **4.5** | +1d (4.0) | ✅ 초과 달성 |
| K3 firefighter | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 5.0 | 5.0 | **5.0** | +1d (4.0) | ✅ 초과 달성 |
| K3 homeless | 3.0 | 3.0 | 3.2 | 4.1 | 4.1 | 4.2 | 4.2 | **4.3** | 5.0~6.5 | ❌ 미달 (Δ +0.1d, R15-1) |
| K3 chef | 4.5 | 5.2 | 5.2 | 5.2 | 5.2 | 5.2 | 5.2 | **5.2** | 5.5~7.0 | ❌ 미달 (변화 0) |
| **K3 engineer** | 3.0 | 3.0 | 3.0 | 3.1 | 3.1 | 4.4 | 4.9 | **5.0** | +1d (4.0) | ✅ **초과 달성 (+0.1d 추가)** ★ |
| K3 pharmacist | 3.0 | 4.0 | 4.1 | 4.1 | 4.1 | 4.1 | 4.1 | **4.1** | 5.0~6.5 | ❌ 미달 (변화 0) |
| **K5 절망** | 110 | 113 | 142 | 167 | 173 | 405 | 377 | **303** | ↓ | ✅ **추가 완화 -74** (누적 -102) |
| K5 아사 | 569 | 569 | 532 | 510 | 506 | 263 | 288 | **350** | ↓ | ⚠️ **사인 전이 +62** (절망→아사) |
| K5 탈수 | 20 | 12 | 14 | 14 | 12 | 13 | 13 | **13** | ↓ | ✅ 안정 |
| K5 극도 피로 | 1 | 6 | 12 | 9 | 9 | 19 | 22 | **34** | ≤ 10 | ⚠️ 초과 (+12, homeless 14건 신규) |
| chef 격차 정의 1 | +1.33 | +1.87 | +1.80 | +1.65 | +1.65 | +0.68 | +0.60 | **+0.567** | +1.0~+2.0d | ⚠️ 하한 미달 유지 |
| **chef 격차 정의 2** | +1.30 | +2.00 | +1.94 | +1.76 | +1.76 | +0.60 | +0.50 | **+0.46** | ≥ +0.5d (R11-1) | ❌ **액션 트리거 발동** (+0.5d 깨짐) |
| chef grace 트리거(+2.5d) | - | +2.00 | +1.94 | +1.76 | +1.76 | +0.60 | +0.50 | **+0.46** | < +2.5d | ✅ 보류 유지 |
| 직업 격차 K1 max-min | 0%p | 0%p | 0%p | 0%p | 0%p | 0%p | 0%p | **0%p** | ≤ 5%p | ✅ |
| R8-1 morale 시계열 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정 | 부분 측정 | **probe 1+2 측정** | day 1~5 확보 | ✅ probe 단정 |
| R13-1 ability sim AI 미구현 | - | - | - | - | - | - | ⚠️ 신규 | **⚠️ 부분 해소** (4필드 구현 + 1필드 skip) | ability 가산 분기 구현 | ⚠️ 부분 |
| **R15-1 SCN_QUEST 추정-실측 잔존 격차** | - | - | - | - | - | - | - | **⚠️ 신규** | playerAI craft 발동 빈도 보강 | ❌ 미해소 |

**충족 6건. 미달 7건. 부분 달성 3건 (K3 doctor 거의, R8-1 probe 부분 측정, R13-1 부분 해소). R11-1 액션 트리거 발동 단언. R15-1 신규 미해소.**

---

## 8. R7·R8·R9·R10·R11·R13·R15 상태표 갱신

| ID | v9 (PR13 후) | **v10 (PR15 후)** |
|----|--------------|--------------------|
| R7-1 요리·낚시 AI 부재 | ✅ 유지 (PR13 미관여) | ✅ 유지 |
| R7-1.5 actCook 산출물 nutrition 효과 | ✅ T1 모사로 lv 0 4직업 해소 | ✅ 유지 |
| R7-2 morale 관리 AI 부재 | ✅ chef·pharmacist·doctor 99~100% 발동 | ✅ 유지 |
| R7-3 lootTable food density | ✅ PR8 6구 + PR11 25구 raw food 가중치 보강 | ✅ 유지 |
| R8 cook_intuition grace 효과 | ✅ 격차 +0.50d, 트리거 +2.5d 미충족 | ✅ 격차 +0.46d, 트리거 미충족 유지 |
| **R8-1 morale 회복 자원 부재** | ⚠️ 부분 완화 (절망 -28) | ✅ **큰 추가 완화** (절망 -74, 누적 -102, 44.0% 회수). 사망원인 1위 절망→아사 역전 |
| R9-1 4 hasFishing K1 효과 부족 | ⚠️ 변화 0 (PR13 fishing 미관여) | ⚠️ 변화 0 (PR15 fishing 미관여) |
| R9-2 chef PR9 효과 0 | ✅ 유지 | ✅ 유지 |
| **R10-1 절망 사망 가속** | ⚠️ -28 부분 완화 | ✅ **추가 -74** (v8 405 → v10 303, 누적 -102. 44.0% 회수. M3 #19/#20 추가 진행 필요) |
| **R11-1 chef 격차 임계** | ⚠️ 미발동 (정의 2 +0.50d 임계 경계) | ❌ **액션 트리거 (3) 발동** (정의 2 +0.46d, +0.5d 깨짐). M3 #19 PR14 chef 강화 진입 의무 |
| **R13-1 Tier-2 ability sim AI 미구현** | ⚠️ 신규 등록 | ⚠️ **부분 해소** (4필드 구현 — moraleRecoveryBonus·lowMoraleRecoveryFatigueBonus·moraleOnCraft·sketchNotebookBonus. dismantle 1필드 skip) |
| **R15-1 (신규) SCN_QUEST 추정-실측 잔존 격차** | - | ⚠️ **신규 등록** — playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day. PR16 후보 (craft 발동 빈도 보강) + PR17 후보 (dismantle sim 모사). 후순위 |

---

## 9. 다음 단계 / 트리거 후보

### 9.1 R11-1 액션 트리거 (3) 발동 단언 — M3 #19 PR14 chef 강화 트랙 진입 의무

**액션 트리거 충족 단정:**
- 협의서 v4 §13.2 R11-1 액션 트리거 정의: "chef K3 < 5.0 **또는** 격차 +0.5d 미만 추가 좁힘"
- v10 측정: 격차 정의 2 **+0.46d < +0.50d** = **트리거 충족**
- 협의서 v4 §14.4 사전 등록 단언 충족: "PR15 머지 시 R11-1 액션 트리거 발동 의무 사전 등록"
- 협의서 v4 §14.5 표 항목 3: "(조건부 v10 기반) M3 #18 PR14 chef 정체성 강화 트랙 — R11-1 액션 트리거 발동 시 진입" (※ 위임 단정 기준 M3 #19로 갱신)

**M3 #19 PR14 chef 정체성 강화 트랙 진입 의무 단언:**
- 담당: 시나리오 한도연 + PD/Balance 협의
- 시점: 본 보고서 단언 직후 (D+0)
- 작업 범위:
  - 후보 A: chef 전용 Tier-2 ability (예: `kitchen_grace` — `moraleOnCook +5` + `nutritionRecoveryBonus 1.2` 등)
  - 후보 B: chef startInv 추가 자원 (예: `chef_notebook` — moraleRecoveryBonus 가산 또는 cooking lv 가산)
  - 후보 C: chef 전용 신규 자원 lootTable 가중치 보강 (예: chef startDistrict 한정 raw food 가중치 +20%)
- 목표 KPI: chef K3 5.2 → 5.5~7.0 (협의서 v3 §9.5 목표 범위) + 격차 정의 1·2 모두 +1.0~+2.0d 사수
- PR14 머지 후 baseline v11 측정 의무

### 9.2 R13-1 부분 해소 + R15-1 신규 등록 — PR16 craft 발동 빈도 보강 후순위

**R13-1 부분 해소 단언:**
- PR15 ability 가산 분기 4필드 구현 (moraleRecoveryBonus·lowMoraleRecoveryFatigueBonus·moraleOnCraft·sketchNotebookBonus)
- dismantle 1필드 skip (sim 미모사) — 시스템 백승호 1차 단정 인용
- engineer Tier-2 ability effect 5필드 중 4필드(80%) 평가. 1필드(20%) 미평가

**R15-1 신규 등록 단언:**
- ID: R15-1
- 정의: PR15 ability 가산 분기 4필드 구현 후에도 SCN_QUEST 추정-실측 잔존 격차 (homeless -0.9~-1.4d, engineer -0.8~-1.3d)
- 일차 원인: (a) playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day, (b) moraleOnDismantle sim 미모사 (engineer effect 절반만 평가)
- 해소 경로 후보 (시스템 백승호 위임, 우선순위 **후순위**):
  - **PR16 후보**: `actCook`을 morale<30 시점 추가 발동 또는 `actInteractCraft` 빈도 증가 (day 2~3회 추가)
  - **PR17 후보**: dismantle sim 모사 (`actDismantle` 함수 신규 정의 + `moraleOnDismantle` 가산)
- 우선순위: **후순위 (M3 #19 PR14 chef 강화 + M3 #20 나머지 3직업 우선)**. R15-1은 측정 도구 정합화 추가 트랙으로 시뮬 결정 신뢰도 보강. M3 트랙 결정에 차단 영향 없음

### 9.3 M3 #20 나머지 3직업 Tier-2 진입 — PR14 결정 후 또는 동시 진행

**대상:** firefighter·soldier·pharmacist Tier-2 abilities (시나리오 한도연 위임)

**진입 시점 단정:**
- **PR14(M3 #19 chef 강화) 결정 후 또는 동시 진행 권고** — R13-1 부분 해소 상태이지만 ability 가산 4필드 구현으로 추정 신뢰도 일부 확보
- 사유: R15-1(craft 발동 빈도 격차) 후순위 상태에서도 ability effect sim AI 발동 검증은 PR15로 충족. firefighter·soldier·pharmacist Tier-2 ability 사양 시 SCN_QUEST 추정 신뢰도 일부 확보됨 단정. 단 **SCN_QUEST 추정 시 craft 발동 빈도 가정을 보수적으로 (day 시작 1회) 사용 권고** — SCN_QUEST §3 추정에서 가정한 4~6회/day는 R15-1 해소 전 사용 금지

### 9.4 sketch_notebook dismantle paper 정의 (시스템 백승호 위임)

- PR13 머지 시 `sketch_notebook` dismantle 결과 보수적 `[]` 처리 (paper 아이템 미정의)
- 후속 PR 결정 후보:
  - 후보 A: `paper` 신규 아이템 정의 + sketch_notebook dismantle paper 1~2개 산출
  - 후보 B: 기존 `cloth` 폴백 (sketch_notebook → cloth 1개)
- 시스템 백승호 영역. 독립 트랙. 본 보고서는 단정 위임만 명시

---

## 10. 결정 단언 종합

| 항목 | v10 측정 단언 |
|------|------------|
| K1 ≥ 5% | ❌ 미달 (**11회 연속 0%**, M3 #19 chef 강화 + M3 #20 나머지 3직업 진입 의무) |
| K3 homeless·engineer +0.1d 미세 향상 | ⚠️ 단정 (PR15 ability 가산 분기 4필드 효과. SCN_QUEST 추정 +0.9~1.5d 대비 잔존 격차) |
| **R11-1 액션 트리거 (3) 발동** | ❌ **단언** (정의 2 +0.46d < +0.50d, +0.5d 깨짐. M3 #19 PR14 chef 강화 트랙 진입 의무) |
| **R8-1 큰 추가 완화** | ✅ **단정** (절망 v9 377 → v10 303, **-74건**. 누적 -102. 사망원인 1위 절망→아사 역전) |
| **사인 전이 (절망→아사 +62)** | ⚠️ **단정** (engineer 절망 -51/아사 +53. homeless 절망 -23/아사 +9/극도 피로 +14. morale 회복 후 nutrition·fatigue 결핍 사망원인 redistribute) |
| **R13-1 부분 해소** | ⚠️ **단언** (4필드 구현 + 1필드 skip. dismantle sim 미모사) |
| **R15-1 신규 위험 등록** | ⚠️ **단언** (playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day. PR16 후보 craft 발동 빈도 보강, **후순위**) |
| R10-1 추가 회수 | ⚠️ 단정 (v8 405 → v10 303, 누적 -102, 폭증분 44.0% 회수) |
| K3 chef 격차 +1.0d 하한 사수 | ❌ 두 정의 모두 미달 (정의 1 +0.567d / 정의 2 +0.46d. R11-1 액션 트리거 발동) |
| 시뮬 결정성 | ✅ fingerprint `len316-h242a5b5f` **v3~v10 8연속 유지**, bootstrapErrors 0/700, 결정성 100% (재실행 동일성) |
| drift fingerprint leaf 값 추적 한계 | ⚠️ 협의서 v4 §13.6 재인용. PR15 시뮬 로직 변경 무영향 정합 |

### 10.1 다음 단계 권고 요약

1. **R11-1 액션 트리거 발동 단언 → M3 #19 PR14 chef 정체성 강화 트랙 진입 의무.** 협의서 v4 §14.4 사전 등록 충족. PD/Balance + 시나리오 한도연 협의로 chef 전용 Tier-2 ability 또는 chef startInv·신규 자원 분배 결정. PR14 머지 후 baseline v11 측정 의무
2. **R13-1 부분 해소 + R15-1 신규 등록 — PR16 후보 (craft 발동 빈도 보강), PR17 후보 (dismantle sim 모사).** 시스템 백승호 위임. 우선순위 **후순위** (M3 #19/#20 우선)
3. **M3 #20 나머지 3직업 Tier-2 진입 — PR14 결정 후 또는 동시 진행.** R13-1 부분 해소 상태이지만 ability 가산 4필드 구현으로 추정 신뢰도 일부 확보. 단 SCN_QUEST 추정 시 craft 발동 빈도 가정을 보수적으로 (day 시작 1회) 사용 권고
4. **sketch_notebook dismantle paper 정의** — 후속 PR (시스템 백승호, 독립 트랙)

### 10.2 baseline v10 → v11 트리거 조건

- PR14 머지 (M3 #19 chef 강화) 후 baseline v11 측정 의무
- v11 측정 의무 probe:
  - chef morale·nutrition·fatigue 시계열 day 1~10 (chef 전용 Tier-2 ability 효과 단정 입력)
  - chef 격차 정의 1·2 재측정 (R11-1 액션 트리거 발동 후 효과 검증 — 목표 +1.0~+2.0d 회복)
  - homeless·engineer K3 회귀 0 검증 (chef 강화가 5직업 평균 끌어올려 격차 추가 좁힘 여부)
  - playerAI craft 발동 빈도 day 1회 회귀 검증 (R15-1 미해소 상태이므로 K3 향상 기대값 보수적 단정)
- K1 ≥ 5% 도달 시 협의서 v5 발행 — chef·pharmacist 격차 보호 KPI 재검토

---

*문서 끝. PR14 (M3 #19 chef 정체성 강화) 머지 후 baseline v11 측정 트리거 충족 시 본 §9.1 단언 + §10.2 probe 측정 의무. R15-1 해소(PR16/PR17)는 측정 도구 정합화 후순위 트랙.*
