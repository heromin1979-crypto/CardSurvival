# 밸런스 — baseline v11 측정 보고 (PR14·PR16 후)

> 작성: 밸런스 권지나 / 2026-05-12
> 측정 대상: PR14(chef Tier-2 abilities — pantry_mastery·chef_journal·spice_blend) + PR16(firefighter·soldier·pharmacist Tier-2 abilities — rescue_resolve·comrade_memorial·compounding_focus·pharmacy_notes 등) 머지 후
> 결정: **K1 0% 12회 연속** (PR5 → PR14·PR16). **R11-1 정의 2 해소 단언** (chef 격차 정의 2 v10 +0.46d → v11 **+0.560d** ≥ +0.5d, 협의서 v5 §5.5 2차 KPI 충족).
>       **1차 KPI 미달 — PR14.1 재조정 트리거 발동 단언** (chef 격차 정의 1 v10 +0.567d → v11 **+0.650d** < +1.0d, SCN_QUEST 추정 +1.07~1.57d 대비 격하).
>       R8-1 **큰 추가 완화** (절망 v10 303 → v11 **161**, -142건. v8 405 → v11 161 누적 -244, 60.2% 회수). 사망원인 1위 절망 → 아사 (v10 350 → v11 467, +117 사인 전이).
>       **R14-1 (chef 1차 KPI 미달)·R14-2 (soldier K3 보수 초과)·R14-3 (firefighter 사인 전이 K3 Δ 0d)** 신규 위험 3건 등록.

---

## 1. 서두

### 1.1 측정 환경

- 시뮬: `tools/sim/v2/` (PR1~PR16 누적)
- PR14 변경: chef Tier-2 abilities 3건 (`pantry_mastery.moraleRecoveryBonus 1.4`, `chef_journal.onConsume.morale +10`, `spice_blend` 효과) — `js/data/characters.js` + `js/data/items_*.js`
- PR16 변경: firefighter·soldier·pharmacist Tier-2 abilities — `rescue_resolve`(firefighter), `comrade_memorial.moraleRecoveryBonus 1.3`(soldier), `compounding_focus`·`pharmacy_notes`(pharmacist) — 합산 +117/-2 라인
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 700 runs (7직업 × 100회), `RUNS_PER_CHARACTER=100`, `SEED_BASE=0`
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: **10.85초** (`meta.totalDurationMs = 10848`)
- BALANCE leaf 합: 227 (`drift.balanceLeafTotal`), **fingerprint `len316-h242a5b5f`** — v3·v4·v5·v6·v7·v8·v9·v10·v11 동일 (**v3~v11 9연속 유지**)
- 결과 파일: `BAL_SIM_baseline_v11_result.json`
- buildTag: `sim-baseline-v11-pr14`
- bootstrapErrors 합: **0/700** (전 회차 시스템 init 정상, `runs[*].bootstrapErrors` 합산 0)

### 1.2 PR14·PR16 적용 차이 (v10 대비) — 4직업 Tier-2 abilities + 5종 신규 자원

**PR14 (chef Tier-2):**

| 필드 | 적용 단정 |
|------|----------|
| `pantry_mastery.moraleRecoveryBonus: 1.4` | ✅ PR15 가산 분기 경로 통해 onConsume.morale × 1.4 적용 |
| `chef_journal.onConsume.morale: +10` | ✅ startInv `chef_journal` 1회 소비 시 morale +10 |
| `spice_blend` 효과 | ✅ chef 신규 자원 lootTable 등록 |

**PR16 (firefighter·soldier·pharmacist Tier-2):**

| 직업 | 필드 | 적용 단정 |
|------|------|----------|
| firefighter | `rescue_resolve` | ⚠️ 효과 발현 — K3 Δ 0d, K5 사인 전이만 (절망 -11 → 아사 +14) |
| soldier | `comrade_memorial.moraleRecoveryBonus: 1.3` | ✅ K3 +0.50d (보수 추정 +0.1~0.3d **초과**) |
| pharmacist | `compounding_focus` + `pharmacy_notes` | ✅ K3 +0.20d (보수 추정 +0.1~0.3d 충족) |

BALANCE leaf 합 227 무영향 — fingerprint 영향 0 정합. PR14·PR16 효과는 (a) onConsume 가산 (chef·soldier·pharmacist), (b) 사인 전이 (firefighter rescue_resolve) 2 경로.

### 1.3 fingerprint 단정 — v3~v11 9연속 유지 + drift 측정 한계 재인용

`drift.balanceLeafTotal = 227`, fingerprint `len316-h242a5b5f` — **v3·v4·v5·v6·v7·v8·v9·v10·v11 모두 동일** (9연속 유지).

PR14·PR16은 `js/data/characters.js`·`js/data/items_*.js` 데이터 추가 + sim AI 발동 (PR15 ability 가산 분기 4필드 경유). BALANCE 객체 leaf 값 무관여 + fingerprint 무영향 정합. 결정성 100% — 시드 동일, ability 가산 RNG 무사용. 재실행 시 K1·K3·K5 동일성 단언.

**drift 측정 한계 (협의서 v4 §13.6 재인용):** leaf 값 회귀 검증 + 데이터 파일 회귀 검증을 fingerprint 단독으로 보장 못함. 본 v11 측정은 PR14·PR16 데이터 추가라 fingerprint 검증 적용 외임을 단정. M4+ 도구 트랙에서 leaf 값 hash + 데이터 파일 hash + 시뮬 로직 파일 hash 컬럼 추가 권고.

---

## 2. 메서드

- 700 runs (7직업 × 100회), SEED_BASE=0, runDays=100
- v3~v10과 동일 시드·동일 runner 흐름. 차이는 PR14(chef Tier-2 abilities 데이터) + PR16(3직업 Tier-2 abilities 데이터) 추가
- 결정성: Math.random → mulberry32 monkey-patch. fingerprint v3·v4·v5·v6·v7·v8·v9·v10·v11 모두 `len316-h242a5b5f`
- bootstrapErrors 0/700 — 전 회차 시스템 init 정상 (`runs[*].bootstrapErrors` 합산 0)
- 결정성 100% (협의서 v3 §12.5 기준: 두 번째 재실행 K3/K5/fingerprint 동일 단언 적용)
- 사망 원인 집계: `BAL_SIM_baseline_v11_result.json:runs[*]` 700건 `deathCause` 빈도 — 결과 JSON `kpi.deathDay.byCharacter[*].causeDistribution` 직접 합산 결과 **`아사 467 / 절망 161 / 극도 피로 39 / 탈수 33`** 단정

---

## 3. K1 — 100일 생존율 (목표 ≥ 5%)

| 직업 | 생존율 v11 | ±CI95p | survived/runs | v10 비교 | v9 비교 |
|------|------------|--------|---------------|---------|---------|
| doctor | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| soldier | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| firefighter | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| homeless | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| chef | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| engineer | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| pharmacist | 0.00% | 0.00 | 0/100 | 0%p | 0%p |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p). `kpi.survivalRate.crossCharacterGapPct = 0`.

**판단: K1 목표(≥ 5%) 미달. baseline 12회 연속 0%** (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10 → PR11 → PR12+T1 → PR13 → PR15 → PR14·PR16). ±3%p 신뢰구간 안에서 100% 0%.

PR14·PR16 효과는 **K3 4직업 향상 (chef +0.20d / soldier +0.50d / pharmacist +0.20d / firefighter Δ 0d) + K5 사망원인 분포 큰 변동 (절망 -142, 아사 +117)**에 머무름 (§4·§5). day 100 도달 0건 유지. SCN_QUEST 4 파일 추정 K3 향상 (chef +1.07~1.57d / soldier +0.1~0.3d / pharmacist +0.1~0.3d / firefighter +0.1~0.3d) 대비 실측은 chef·firefighter에서 잔존 격차 단정 (§4.1·§4.3). 격차 원인은 R14-1·R14-3 신규 위험으로 등록 단언.

---

## 4. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean (v11) | median (v11) | mean (v10) | mean (v9) | mean (v8) | Δv10→v11 |
|------|------------|--------------|-----------|-----------|-----------|---------|
| doctor | 4.90 | 5 | 4.90 | 4.90 | 4.90 | 0 |
| **soldier** | **5.00** | 5 | 4.50 | 4.50 | 4.50 | **+0.50** ★ |
| firefighter | 5.00 | 5 | 5.00 | 5.00 | 5.00 | 0 (사인 전이만) |
| homeless | 4.30 | 4 | 4.30 | 4.20 | 4.20 | 0 |
| **chef** | **5.40** | 5 | 5.20 | 5.20 | 5.20 | **+0.20** ★ |
| engineer | 5.00 | 5 | 5.00 | 4.90 | 4.40 | 0 |
| **pharmacist** | **4.30** | 4 | 4.10 | 4.10 | 4.10 | **+0.20** ★ |

### 4.1 chef 격차 측정 — R11-1 정의 2 해소 단언 + 1차 KPI 미달

**정의 1: chef vs 다른 6직업 평균 (v4~v10 사용 정의)**
- v10: chef 5.20 / others6 ((4.90+4.50+5.00+4.30+5.00+4.10)/6 = 4.633) / gap **+0.567d**
- v11: chef 5.40 / others5+1 ((4.90+**5.00**+5.00+4.30+5.00+**4.30**)/6 = **4.75**) / gap **+0.650d** (Δv10→v11: **+0.083d**)

**정의 2: chef vs cooking lv 0 5직업 평균 (pharmacist 제외, 동질 비교)**
- v10: chef 5.20 / others5 ((4.90+4.50+5.00+4.30+5.00)/5 = 4.74) / gap **+0.46d**
- v11: chef 5.40 / others5 ((4.90+**5.00**+5.00+4.30+5.00)/5 = **4.84**) / gap **+0.560d** (Δv10→v11: **+0.10d**, 시스템 백승호 1차 단정 인용 Δ **+0.060d** — pharmacist 제외 평균 보정 적용 기준)

**판단:**

(1) **R11-1 정의 2 해소 단언 (협의서 v5 §5.5 2차 KPI 충족):**
- 협의서 v4 §13.2 R11-1 발동 조건: "정의 2 격차 < +0.5d"
- 협의서 v5 §5.5 2차 KPI 목표: "정의 2 ≥ +0.5d"
- v11 측정: 정의 2 **+0.560d ≥ +0.5d** = **R11-1 정의 2 해소 단언 충족**
- v10에서 발동된 R11-1 액션 트리거(정의 2 +0.46d < 0.50d)는 PR14(chef Tier-2)·PR16(soldier·pharmacist Tier-2)의 chef K3 절대 향상(+0.20d)으로 회복

(2) **1차 KPI 미달 단언 — PR14.1 재조정 트리거 발동 (협의서 v5 §5.5 1차 KPI):**
- 협의서 v5 §5.5 1차 KPI 목표: "정의 1 ≥ +1.0d"
- v11 측정: 정의 1 **+0.650d < +1.0d** = **1차 KPI 미달**
- SCN_QUEST_chef_tier2.md 추정 K3 향상 +1.07~1.57d 대비 실측 +0.20d = **추정-실측 격차 -0.87~-1.37d**
- **PR14.1 재조정 트리거 발동 단언** (§9.1)

(3) **3차 KPI 충족 — chef K3 ≤ 6.5 안전 (협의서 v5 §5.5):**
- v11 chef K3 = 5.40 ≤ 6.5 충족. cook_intuition grace 재검토 트리거 (+2.5d 격차) 미발동 유지

### 4.2 PR14 단독 효과 — chef K3 +0.20d

**chef K3 v10 5.20 → v11 5.40 (+0.20d). 향상 경로 단정 (시스템 백승호 1차 probe 1 인용):**

| 후보 경로 | 적용 여부 | 추정 기여 |
|-----------|----------|----------|
| `pantry_mastery.moraleRecoveryBonus: 1.4` (PR15 가산 분기 경로) | ✅ 적용 (R13-1 부분 해소 유지) | +0.10~0.15d |
| `chef_journal.onConsume.morale: +10` (startInv 1회 소비) | ✅ 적용 | +0.05~0.10d |
| `spice_blend` lootTable 신규 자원 | ✅ 적용 | +0.0~0.05d |

**probe 1 단정 인용 (시스템 백승호 1차 단정):**
- chef 절망 v10 83 → v11 **18** (-65건, -78.3%)
- 사인 전이: 아사 +42 / 탈수 +20 / 극도 피로 +3
- chef_journal·spice_blend 사용 별도 probe 필요 (durability 추적 영역)

**단정:** PR14 chef Tier-2 abilities 3건 발동은 K3 +0.20d 향상 + 절망 사망 -65 큰 완화로 입증. 그러나 SCN_QUEST_chef_tier2.md §8 추정 +1.07~1.57d 대비 실측 +0.20d는 **추정-실측 격차 -0.87~-1.37d 잔존**. R14-1 신규 위험으로 등록 (§8).

### 4.3 PR16 효과 — soldier·pharmacist·firefighter 측정

**soldier K3 v10 4.50 → v11 5.00 (+0.50d) ★:**

| 후보 경로 | 적용 여부 | 추정 기여 |
|-----------|----------|----------|
| `comrade_memorial.moraleRecoveryBonus: 1.3` (PR15 가산 분기 경로) | ✅ 적용 | +0.30~0.50d |

**판단:** SCN_QUEST_soldier_tier2.md §3 보수 추정 K3 향상 +0.1~0.3d **초과**. comrade_memorial 효과가 baseline 예상치보다 큰 발현 단정. chef 격차 추가 좁힘(정의 1 -0.083d 부분 회복은 chef +0.20d 효과 우세)이 발생하지 않은 사유는 chef K3 동시 향상(+0.20d) 효과. **R14-2 신규 위험 등록 단언** (§8) — soldier K3 보수 가이드 초과로 격차 보호 KPI(chef 격차 정의 1) 추가 좁힘 위험.

**pharmacist K3 v10 4.10 → v11 4.30 (+0.20d) ★:**

| 후보 경로 | 적용 여부 | 추정 기여 |
|-----------|----------|----------|
| `compounding_focus` (Tier-2 ability) | ✅ 적용 | +0.10~0.15d |
| `pharmacy_notes` (Tier-2 ability) | ✅ 적용 | +0.05~0.10d |

**probe 3 단정 인용:** pharmacist 절망 v10 40 → v11 **16** (-24건) + 아사 +20. SCN_QUEST_pharmacist_tier2.md §3 보수 추정 +0.1~0.3d 충족 단정.

**firefighter K3 v10 5.00 → v11 5.00 (Δ 0d):**

| 후보 경로 | 적용 여부 | 추정 기여 |
|-----------|----------|----------|
| `rescue_resolve` (Tier-2 ability) | ⚠️ 발현 — 사인 전이만 | K3 0d |

**probe 3 단정 인용:** firefighter 절망 v10 11 → v11 **0** (-11건) + 아사 +14. rescue_resolve 효과는 절망 사망 회피 → 아사 사망 전이만 발현. K3 평균 사망일 변화 0d. **SCN_QUEST_firefighter_tier2.md §3 추정 K3 +0.1~0.3d 미달**. **R14-3 신규 위험 등록 단언** (§8) — rescue_resolve 사양이 morale 회복 경로만 강화하여 fatigue·nutrition 자원 결핍 사망원인으로 redistribute. R15-1 우회 실패 단언.

---

## 5. K5 — 사망 원인 분포

### 5.1 합산 v10→v11 — 절망 -142 큰 추가 완화

| 원인 | v3 | v4 | v5 | v6 | v7 | v8 | v9 | v10 | **v11** | Δv10→v11 |
|------|----|----|----|----|----|----|----|-----|---------|---------|
| 아사 | 555 | 569 | 532 | 510 | 506 | 263 | 288 | 350 | **467** | **+117** ★ 사인 전이 |
| 절망 | 110 | 113 | 142 | 167 | 173 | 405 | 377 | 303 | **161** | **-142** ★ R8-1 큰 추가 완화 |
| 탈수 | 20 | 12 | 14 | 14 | 12 | 13 | 13 | 13 | **33** | +20 (chef 사인 전이) |
| 극도 피로 | 1 | 6 | 12 | 9 | 9 | 19 | 22 | 34 | **39** | +5 |

**큰 추가 완화 단정:**
- v9 → v10 절망 -74 큰 완화 → v10 → v11 절망 **-142 추가 큰 완화** (v8 → v11 누적 **-244**, v7→v8 폭증분 +232의 **60.2% 회수**, 부분 단위로는 회복 단언)
- 아사 +117는 절망·morale 진입 회피한 회차의 사인 전이 결과 (절망 → 아사). 사망원인 1위 v10 아사(350) → v11 아사(467) 격차 더 큰 단언
- 탈수 +20은 chef 절망 회피 회차의 사인 전이 (chef 탈수 v10 11 → v11 31, +20)

### 5.2 직업별 K5 (v10 vs v11)

| 직업 | v11 K5 | v10 K5 | 변화 |
|------|--------|--------|------|
| doctor | 절망 98 / 극도 피로 1 / 아사 1 | 절망 98 / 극도 피로 1 / 아사 1 | 0 |
| **soldier** | **아사 89 / 절망 8 / 극도 피로 3** | 절망 50 / 아사 48 / 극도 피로 2 | **절망 -42 / 아사 +41 / 극도 피로 +1** ★ |
| **firefighter** | **아사 100** | 아사 86 / 절망 11 / 극도 피로 3 | **절망 -11 / 아사 +14 / 극도 피로 -3** ★ 사인 전이만 |
| homeless | 아사 85 / 극도 피로 14 / 절망 1 | 아사 85 / 극도 피로 14 / 절망 1 | 0 (PR16 미관여) |
| **chef** | **아사 42 / 탈수 31 / 절망 18 / 극도 피로 9** | 절망 83 / 탈수 11 / 극도 피로 6 / 아사 0 | **절망 -65 / 아사 +42 / 탈수 +20 / 극도 피로 +3** ★ |
| engineer | 절망 20 / 아사 79 / 극도 피로 1 | 절망 20 / 아사 79 / 극도 피로 1 | 0 (PR16 미관여) |
| **pharmacist** | **아사 71 / 절망 16 / 극도 피로 11 / 탈수 2** | 절망 40 / 아사 51 / 극도 피로 7 / 탈수 2 | **절망 -24 / 아사 +20 / 극도 피로 +4** ★ |

**중요 분석:**
- **chef 절망 -65건** — PR14 `pantry_mastery 1.4× + chef_journal +10 morale` 적용으로 morale 침식 큰 지연. 절망 사망 83 → 18 (-78.3%). 단 K3 +0.20d만 향상 = nutrition·hydration 결핍이 사망원인 redistribute (아사 +42, 탈수 +20)
- **soldier 절망 -42건** — PR16 `comrade_memorial 1.3×` 적용. 절망 50 → 8 (-84.0%). 사인 전이: 아사 +41
- **firefighter 절망 -11건** — PR16 `rescue_resolve` 적용. 절망 11 → 0 (-100%). 사인 전이: 아사 +14. **K3 변화 0d** (R14-3 신규 위험)
- **pharmacist 절망 -24건** — PR16 `compounding_focus + pharmacy_notes` 적용. 절망 40 → 16 (-60.0%). 사인 전이: 아사 +20
- doctor·homeless·engineer K5 변화 0 — PR14·PR16 효과 3직업 미관여 (chef·soldier·firefighter·pharmacist 외 4직업 Tier-2 abilities 미보유 또는 PR16 미관여)

### 5.3 R8-1 큰 추가 완화 단정 — v8→v11 누적 -244 (60.2% 회수)

**R8-1 (morale 회복 자원 부재) v8→v9→v10→v11 추세:**
- v8: 절망 405 (사망원인 1위 역전, R10-1 폭증 신규)
- v9: 절망 377 (-28, homeless 단독 -22) → 부분 완화 단정
- v10: 절망 303 (-74, homeless -23 + engineer -51) → 큰 추가 완화 단정 (누적 -102, 44.0% 회수)
- **v11: 절망 161 (-142, chef -65 + soldier -42 + pharmacist -24 + firefighter -11) → 큰 추가 완화 (누적 -244, 60.2% 회수)**

**v8→v11 누적: 절망 -244건 (폭증분 +232의 60.2% 회수, 부분 추가 회수 진행 단언).** R8-1 ability effect sim AI 발동(PR15) + 자원 분배(PR13·PR14·PR16)의 합산 효과.

**사인 전이 단정 (절망 → 아사 +117 / 탈수 +20 / 극도 피로 +5):**
- chef 사인 전이: 절망 -65 / 아사 +42 / 탈수 +20 / 극도 피로 +3
- soldier 사인 전이: 절망 -42 / 아사 +41 / 극도 피로 +1
- firefighter 사인 전이: 절망 -11 / 아사 +14 / 극도 피로 -3
- pharmacist 사인 전이: 절망 -24 / 아사 +20 / 극도 피로 +4
- **단정:** R8-1 morale 회복은 사기 회복으로 충분, 후속 자원 부족(nutrition·hydration·fatigue) 결핍이 새 병목 단언. day 100 도달은 morale 단독 해소로 미충족. 후속 PR에서 nutrition·hydration·fatigue 자원 보강 또는 K3 절대값 향상 트랙 필요

**R10-1 추가 회수 단정:**
- v7 173 → v8 405 (+232 폭증) → v9 377 (-28) → v10 303 (-74) → **v11 161 (-142 추가)** = 누적 -244 (60.2% 회수)
- 완전 해소 미달성 — 잔존 폭증분 -12 (v7 173 → v11 161). **부분 회복 단언 (60.2% 회수)**. PR14.1·PR16.1 재조정 + M3 #20 후속 트랙 후 완전 해소 여부 baseline v12 측정 의무

---

## 6. AI 발동 — Tier-2 ability + 5종 신규 자원

### 6.1 ability 가산 발동 분포 (PR15 enumerate 필드 정합)

PR15 ability 가산 분기 4필드 경로 (`_applyAbilityBonusesToConsume`·`_grantCraftMorale`)가 PR14·PR16 데이터에 직접 적용 단언:

| 직업 | ability 필드 | 가산 분기 경로 | v11 발동 단정 |
|------|-------------|-------------|--------------|
| chef | `pantry_mastery.moraleRecoveryBonus: 1.4` | `_applyAbilityBonusesToConsume` (PR15 구현) | ✅ chef 절망 -65건 큰 완화 |
| chef | `chef_journal.onConsume.morale: +10` | startInv 1회 소비 | ✅ chef K3 +0.20d 향상 일부 기여 |
| soldier | `comrade_memorial.moraleRecoveryBonus: 1.3` | `_applyAbilityBonusesToConsume` (PR15 구현) | ✅ soldier 절망 -42건 큰 완화 |
| firefighter | `rescue_resolve` | (사양 추정) | ⚠️ 절망 -11 / 아사 +14 사인 전이만 |
| pharmacist | `compounding_focus`·`pharmacy_notes` | (사양 추정) | ✅ pharmacist 절망 -24건 완화 |

**판단:** PR15 ability 가산 분기 4필드 + PR14·PR16 데이터 결합으로 4직업 절망 사망 큰 완화 단언. R13-1 부분 해소 유지(dismantle 1필드 skip). PR15 enumerate 필드 정합 단정.

### 6.2 chef·doctor·homeless·engineer 회귀 단정 (회귀 0)

PR14는 chef 단독, PR16은 firefighter·soldier·pharmacist 3직업 대상. doctor·homeless·engineer 3직업은 v10 동일 K3·K5 단언:

- doctor: K3 4.90 = v10 동일 / K5 절망 98·극도 피로 1·아사 1 = v10 동일 / 회귀 0 단언
- homeless: K3 4.30 = v10 동일 / K5 아사 85·극도 피로 14·절망 1 = v10 동일 / 회귀 0 단언
- engineer: K3 5.00 = v10 동일 / K5 절망 20·아사 79·극도 피로 1 = v10 동일 / 회귀 0 단언

**3직업 회귀 0 검증 단언.** PR14·PR16 데이터 추가가 ability 보유 4직업(chef·soldier·firefighter·pharmacist)에만 영향 단정.

chef 자체는 PR14 대상 직업으로 +0.20d 향상이 회귀가 아닌 의도 효과. (위임 §의 "chef 회귀 0" 표현은 chef 외 3직업 대상으로 해석 단정.)

---

## 7. KPI 표 비교 — v3~v11 9컬럼

협의서 v3(PR10) §9.5 + 협의서 v4(PR11) §13.7 + §14 + 협의서 v5(PR14) §5.5 통합 KPI:

| KPI | v3 | v4 | v5 | v6 | v7 | v8 | v9 | v10 | **v11** | 목표 | 충족 |
|-----|----|----|----|----|----|----|----|-----|---------|------|------|
| K1 (전 직업) | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | **0%** | ≥ 5% | ❌ **12회 연속** |
| K3 doctor | 4.0 | 4.0 | 4.0 | 4.0 | 4.0 | 4.9 | 4.9 | 4.9 | **4.9** | +1d (5.0) | ⚠️ 거의 충족 (-0.1d) |
| **K3 soldier** | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 4.5 | 4.5 | 4.5 | **5.0** | +1d (4.0) | ✅ **초과 +0.50d** (보수 +0.1~0.3d 초과, R14-2) |
| K3 firefighter | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 5.0 | 5.0 | 5.0 | **5.0** | +1d (4.0), v11 보수 +0.1~0.3d | ❌ **변화 0** (R14-3, 사인 전이만) |
| K3 homeless | 3.0 | 3.0 | 3.2 | 4.1 | 4.1 | 4.2 | 4.2 | 4.3 | **4.3** | 5.0~6.5 | ❌ 미달 (변화 0, R15-1) |
| **K3 chef** | 4.5 | 5.2 | 5.2 | 5.2 | 5.2 | 5.2 | 5.2 | 5.2 | **5.4** | 5.5~7.0 (1차 KPI 격차 ≥ +1.0d) | ❌ **하한 -0.1d 미달** (R14-1) |
| K3 engineer | 3.0 | 3.0 | 3.0 | 3.1 | 3.1 | 4.4 | 4.9 | 5.0 | **5.0** | +1d (4.0) | ✅ 초과 달성 (변화 0) |
| **K3 pharmacist** | 3.0 | 4.0 | 4.1 | 4.1 | 4.1 | 4.1 | 4.1 | 4.1 | **4.3** | 5.0~6.5 | ❌ 미달 (Δ +0.20d 향상 부분 회복) |
| K5 절망 | 110 | 113 | 142 | 167 | 173 | 405 | 377 | 303 | **161** | ↓ | ✅ **추가 큰 완화 -142** (누적 -244, 60.2% 회수) |
| K5 아사 | 555 | 569 | 532 | 510 | 506 | 263 | 288 | 350 | **467** | ↓ | ⚠️ **사인 전이 +117** (절망→아사) |
| K5 탈수 | 20 | 12 | 14 | 14 | 12 | 13 | 13 | 13 | **33** | ↓ | ⚠️ +20 (chef 사인 전이) |
| K5 극도 피로 | 1 | 6 | 12 | 9 | 9 | 19 | 22 | 34 | **39** | ≤ 10 | ⚠️ 초과 유지 |
| chef 격차 정의 1 | +1.33 | +1.87 | +1.80 | +1.65 | +1.65 | +0.68 | +0.60 | +0.567 | **+0.650** | ≥ +1.0d (1차 KPI) | ❌ **미달** (R14-1) |
| **chef 격차 정의 2** | +1.30 | +2.00 | +1.94 | +1.76 | +1.76 | +0.60 | +0.50 | +0.46 | **+0.560** | ≥ +0.5d (2차 KPI R11-1) | ✅ **해소 단언** |
| chef 격차 K3 ≤ 6.5 (3차 KPI) | - | - | - | - | - | 5.2 | 5.2 | 5.2 | **5.4** | ≤ 6.5 | ✅ 안전 |
| chef grace 트리거(+2.5d) | - | +2.00 | +1.94 | +1.76 | +1.76 | +0.60 | +0.50 | +0.46 | **+0.560** | < +2.5d | ✅ 보류 유지 |
| 직업 격차 K1 max-min | 0%p | 0%p | 0%p | 0%p | 0%p | 0%p | 0%p | 0%p | **0%p** | ≤ 5%p | ✅ |
| R8-1 morale 시계열 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정 | 부분 측정 | probe 1+2 | **probe 1+3 측정** | day 1~5 확보 | ✅ probe 단정 |
| R13-1 ability sim AI | - | - | - | - | - | - | 신규 | 부분 해소 | **부분 해소 유지** (PR15 4필드, dismantle skip) | ability 가산 분기 구현 | ⚠️ 부분 |
| R15-1 SCN_QUEST 추정-실측 잔존 격차 | - | - | - | - | - | - | - | ⚠️ 신규 | **⚠️ 부분 해소** (chef +0.20d 측정 가능, firefighter Δ 0d 잔존) | playerAI craft 발동 빈도 보강 | ⚠️ 부분 |
| **R14-1 chef 1차 KPI 미달 (신규)** | - | - | - | - | - | - | - | - | **⚠️ 신규** | 정의 1 ≥ +1.0d | ❌ **PR14.1 재조정 트리거** |
| **R14-2 soldier K3 보수 초과 (신규)** | - | - | - | - | - | - | - | - | **⚠️ 신규** | +0.1~0.3d | ❌ **PR16.1 재조정 트리거** |
| **R14-3 firefighter K3 Δ 0d (신규)** | - | - | - | - | - | - | - | - | **⚠️ 신규** | +0.1~0.3d | ❌ **rescue_resolve 사인 전이만** |

**충족 7건. 미달 9건. 부분 달성 4건 (K3 doctor 거의, R8-1 probe, R13-1 부분, R15-1 부분). R11-1 정의 2 해소 단언. R14-1·R14-2·R14-3 신규 위험 등록.**

---

## 8. R7·R8·R9·R10·R11·R13·R14·R15 상태표 갱신

| ID | v10 (PR15 후) | **v11 (PR14·PR16 후)** |
|----|--------------|--------------------------|
| R7-1 요리·낚시 AI 부재 | ✅ 유지 | ✅ 유지 |
| R7-1.5 actCook 산출물 nutrition 효과 | ✅ T1 모사 | ✅ 유지 |
| R7-2 morale 관리 AI 부재 | ✅ chef·pharmacist·doctor 99~100% 발동 | ✅ 유지 |
| R7-3 lootTable food density | ✅ PR8 6구 + PR11 25구 raw food 가중치 보강 | ✅ 유지 |
| R8 cook_intuition grace 효과 | ✅ 격차 +0.46d, 트리거 +2.5d 미충족 | ✅ 격차 +0.560d, 트리거 +2.5d 미충족 유지 (정의 2 해소) |
| **R8-1 morale 회복 자원 부재** | ✅ 큰 완화 (-74) | ✅ **추가 큰 완화** (절망 -142, v8→v11 누적 -244, 60.2% 회수) |
| R9-1 4 hasFishing K1 효과 부족 | ⚠️ 변화 0 (PR15 fishing 미관여) | ⚠️ 변화 0 (PR14·PR16 fishing 미관여) |
| R9-2 chef PR9 효과 0 | ✅ 유지 | ✅ 유지 |
| R10-1 절망 사망 가속 | ✅ -74 추가 회수 (누적 -102, 44.0%) | ✅ **추가 -142 회수** (v8 405 → v11 161, 누적 -244, 60.2% 회수. 잔존 -12) |
| **R11-1 chef 격차 임계** | ❌ 액션 트리거 (3) 발동 (정의 2 +0.46d) | ✅ **정의 2 해소 단언** (+0.560d ≥ +0.5d, 협의서 v5 §5.5 2차 KPI 충족) |
| **R13-1 Tier-2 ability sim AI** | ⚠️ 부분 해소 (4필드 + dismantle skip) | ⚠️ **부분 해소 유지** (PR15 enumerate 정합. dismantle skip 잔존) |
| **R15-1 SCN_QUEST 추정-실측 잔존 격차** | ⚠️ 신규 등록 | ⚠️ **부분 해소** (chef +0.20d 측정 가능. firefighter Δ 0d 잔존 — R14-3로 분리 등록) |
| **R14-1 (신규) chef 1차 KPI 미달** | - | ⚠️ **신규 등록** — 정의 1 +0.650d < +1.0d. SCN_QUEST 추정 +1.07~1.57d 대비 실측 +0.20d. **PR14.1 재조정 트리거 발동 단언** (§9.1) |
| **R14-2 (신규) soldier K3 보수 초과** | - | ⚠️ **신규 등록** — K3 +0.50d > 0.3d 보수 가이드. comrade_memorial 1.3→1.2 하향 검토. **PR16.1 재조정 트리거 발동 단언** (§9.2) |
| **R14-3 (신규) firefighter 사인 전이 K3 Δ 0d** | - | ⚠️ **신규 등록** — rescue_resolve 효과는 절망 -11 → 아사 +14 전이만 발현. SCN_QUEST 추정 +0.1~0.3d 미달. R15-1 우회 실패 폴백 트리거 검토 (§9.3) |

---

## 9. 다음 단계 / 트리거 후보

### 9.1 PR14.1 재조정 트리거 발동 단언 — chef 1차 KPI 충족 목표

**트리거 충족 단정:**
- 협의서 v5 §5.5 1차 KPI 목표: "chef 격차 정의 1 ≥ +1.0d"
- v11 측정: 정의 1 **+0.650d < +1.0d** = **PR14.1 재조정 트리거 발동**
- SCN_QUEST_chef_tier2.md §8 추정 +1.07~1.57d 대비 실측 +0.20d = 잔존 격차 -0.87~-1.37d

**PR14.1 작업 범위 단언:**
- 담당: 시나리오 한도연 + PD/Balance 협의 (시나리오 단독 effect 값 조정 또는 시스템 백승호 직접 effect 코드 조정)
- 시점: 본 보고서 단언 직후 (D+0)
- 권고 옵션 A: **`pantry_mastery.moraleRecoveryBonus 1.4 → 1.6` 상향** (homeless `street_solace 1.5` 동질 비교 + chef 가산 우세 단정)
- 권고 옵션 B: **`chef_journal.onConsume.morale 10 → 13` 상향** (startInv 1회 소비 효과 강화)
- 권고 옵션 C: 옵션 A·B 동시 적용 (1차 KPI ≥ +1.0d 직접 도달 목표)
- 옵션 선택은 PD/Balance + 시나리오 한도연 협의로 결정
- PR14.1 머지 후 baseline v12 측정 의무

### 9.2 PR16.1 soldier 재조정 트리거 발동 단언 — comrade_memorial 1.3→1.2 하향

**트리거 충족 단정:**
- SCN_QUEST_soldier_tier2.md §3 보수 추정 K3 향상 +0.1~0.3d
- v11 측정: soldier K3 +0.50d > 0.3d 상한 = **PR16.1 재조정 트리거 발동**
- 사유: chef 격차 정의 1 추가 좁힘 위험 (soldier K3 추가 상승 시 chef 격차 정의 1이 +0.5d 미만으로 깨질 잠재 위험)

**PR16.1 작업 범위 단언:**
- 담당: 시나리오 한도연 + PD/Balance 협의 (또는 시스템 백승호 effect 값 직접 조정)
- 권고: **`comrade_memorial.moraleRecoveryBonus 1.3 → 1.2` 하향**
- 목표 K3: soldier K3 5.0 → 4.7~4.8 (보수 +0.1~0.3d 가이드 내 회수)
- PR16.1 머지 후 baseline v12 측정 의무

### 9.3 firefighter 재검토 — R15-1 우회 실패 폴백 검토

**트리거 충족 단정:**
- SCN_QUEST_firefighter_tier2.md §3 추정 K3 +0.1~0.3d
- v11 측정: firefighter K3 Δ 0d (사인 전이만 — 절망 -11 → 아사 +14)
- 사유: rescue_resolve 효과가 morale 회복 경로만 강화 → nutrition·hydration·fatigue 자원 결핍 사망원인 redistribute. R15-1 우회 실패 단언

**firefighter 재검토 작업 범위 단언:**
- 담당: 시나리오 한도연 + PD/Balance 협의
- 옵션 A: `rescue_resolve` 사양 보강 — morale 회복 외 nutrition·hydration 자원 가산 추가
- 옵션 B: firefighter Tier-2 ability 추가 신규 등록 — nutrition 또는 fatigue 회복 가산 (R15-1 우회 폴백)
- 옵션 C: R15-1 본질 해소 우선 — playerAI craft 발동 빈도 보강(PR16-기존 후보) 추진 후 firefighter Tier-2 재측정
- 옵션 선택은 PD/Balance + 시나리오 한도연 협의로 결정

### 9.4 R8-1·R10-1 완전 해소 여부 단정 — baseline v12 측정 대기

**현 상태:**
- R8-1: v8→v11 누적 -244, 60.2% 회수 = **부분 회복 진행 단언**. 완전 해소 미달성
- R10-1: 잔존 폭증분 -12 (v7 173 → v11 161). 완전 해소 임박 단언

**baseline v12 측정 트리거 조건:**
- PR14.1 (chef 1차 KPI 충족 목표) + PR16.1 (soldier comrade_memorial 1.3→1.2) 머지 후
- (선택) firefighter 재검토 옵션 결정 후
- v12 측정 의무 probe:
  - chef 격차 정의 1·2 재측정 (PR14.1 효과 — 정의 1 ≥ +1.0d 회복 목표)
  - soldier K3 재측정 (PR16.1 효과 — K3 4.7~4.8 회복 목표)
  - firefighter K3 재측정 (옵션 A·B·C 따른 결과)
  - 사인 전이 추가 변동 측정 (절망 → 아사 추가 redistribute 또는 nutrition 자원 보강 효과)
  - 6직업 회귀 0 검증
- K1 ≥ 5% 도달 시 협의서 v6 발행 — chef·pharmacist 격차 보호 KPI 재검토

---

## 10. 결정 단언 종합

| 항목 | v11 측정 단언 |
|------|------------|
| K1 ≥ 5% | ❌ 미달 (**12회 연속 0%**, PR14.1·PR16.1 + M3 후속 트랙 진행 의무) |
| K3 chef +0.20d / soldier +0.50d / pharmacist +0.20d / firefighter Δ 0d | ⚠️ 단정 (PR14·PR16 Tier-2 abilities 효과. SCN_QUEST 추정 대비 chef·firefighter 잔존 격차) |
| **R11-1 정의 2 해소** | ✅ **단언** (+0.560d ≥ +0.5d, 협의서 v5 §5.5 2차 KPI 충족) |
| **R14-1 chef 1차 KPI 미달** | ❌ **단언** (정의 1 +0.650d < +1.0d. PR14.1 재조정 트리거 발동) |
| **R14-2 soldier K3 보수 초과** | ❌ **단언** (K3 +0.50d > 0.3d 상한. PR16.1 재조정 트리거 발동) |
| **R14-3 firefighter 사인 전이 K3 Δ 0d** | ❌ **단언** (rescue_resolve 효과는 절망 -11 → 아사 +14 전이만. SCN_QUEST 추정 +0.1~0.3d 미달) |
| **R8-1 큰 추가 완화** | ✅ **단정** (절망 v10 303 → v11 161, **-142건**. v8→v11 누적 -244. 60.2% 회수) |
| **사인 전이 (절망→아사 +117 / 탈수 +20 / 극도 피로 +5)** | ⚠️ **단정** (chef·soldier·firefighter·pharmacist 4직업 절망 사망 회피 후 nutrition·hydration·fatigue 결핍 사망원인 redistribute) |
| R13-1 부분 해소 유지 | ⚠️ **단언** (PR15 enumerate 4필드 + dismantle skip. PR14·PR16 데이터 적용 정합) |
| R15-1 부분 해소 | ⚠️ **단언** (chef +0.20d 측정 가능, firefighter Δ 0d 잔존 — R14-3로 분리 등록) |
| R10-1 추가 회수 | ⚠️ 단정 (v8 405 → v11 161, 누적 -244, 폭증분 60.2% 회수. 잔존 -12) |
| K3 chef 격차 +1.0d 하한 사수 (1차 KPI) | ❌ 미달 (정의 1 +0.650d. PR14.1 재조정 트리거) |
| K3 chef 격차 +0.5d 사수 (2차 KPI) | ✅ 충족 (정의 2 +0.560d) |
| K3 chef ≤ 6.5 안전 (3차 KPI) | ✅ 안전 (5.40) |
| 시뮬 결정성 | ✅ fingerprint `len316-h242a5b5f` **v3~v11 9연속 유지**, bootstrapErrors 0/700, 결정성 100% (재실행 동일성) |
| drift fingerprint leaf 값 추적 한계 | ⚠️ 협의서 v4 §13.6 재인용. PR14·PR16 데이터 추가 무영향 정합 |

### 10.1 다음 단계 권고 요약

1. **PR14.1 재조정 트리거 발동 단언 — chef 1차 KPI 충족 목표.** 협의서 v5 §5.5 1차 KPI 충족 목표(정의 1 ≥ +1.0d). 권고 옵션 A `pantry_mastery 1.4→1.6` 또는 옵션 B `chef_journal morale 10→13` 또는 옵션 C 동시 적용. PD/Balance + 시나리오 한도연 협의 결정. PR14.1 머지 후 baseline v12 측정 의무
2. **PR16.1 soldier 재조정 트리거 발동 단언 — comrade_memorial 1.3→1.2 하향.** chef 격차 정의 1 추가 좁힘 위험 회피. PD/Balance + 시나리오 한도연 협의 결정. PR16.1 머지 후 baseline v12 측정 의무
3. **firefighter 재검토 — rescue_resolve 사인 전이만 발현 (R14-3).** 옵션 A·B·C 중 결정. PD/Balance + 시나리오 한도연 협의 + (옵션 C 선택 시) 시스템 백승호 R15-1 본질 해소 우선
4. **R8-1·R10-1 완전 해소 여부 baseline v12 측정 대기.** v11 큰 추가 완화이지만 사인 전이로 사망일 연장 미발생. PR14.1·PR16.1 머지 후 K1 향상 측정 의무

### 10.2 baseline v11 → v12 트리거 조건

- PR14.1 (chef 1차 KPI 충족 목표) + PR16.1 (soldier comrade_memorial 하향) 머지 후 baseline v12 측정 의무
- (선택) firefighter 재검토 옵션 적용 시 v12 또는 v13 별도 측정
- v12 측정 의무 probe:
  - chef 격차 정의 1·2 재측정 (PR14.1 효과 — 정의 1 ≥ +1.0d 회복 목표)
  - soldier K3 재측정 (PR16.1 효과 — K3 4.7~4.8 회복 목표)
  - firefighter K3 재측정 (옵션 A·B·C 따른 결과 분기)
  - 사인 전이 추가 변동 측정 (절망 → 아사·탈수·fatigue redistribute)
  - 6직업 회귀 0 검증 (PR14.1·PR16.1 미관여 직업)
  - playerAI craft 발동 빈도 회귀 검증 (R15-1 미해소 상태)
- K1 ≥ 5% 도달 시 협의서 v6 발행 — chef·pharmacist 격차 보호 KPI 재검토

---

*문서 끝. PR14.1 (chef 1차 KPI 충족) + PR16.1 (soldier 보수 가이드 회수) 머지 후 baseline v12 측정 트리거 충족 시 본 §9.1·§9.2 단언 + §10.2 probe 측정 의무. firefighter R14-3 폴백 검토 결과는 별도 트랙. R15-1 본질 해소(PR16-기존 후보)는 측정 도구 정합화 후순위 트랙.*
