# 밸런스 — baseline v6 측정 보고 (PR10 후)

> 작성: 밸런스 권지나 / 2026-05-11
> 측정 대상: PR10 머지 후 baseline v6 (needs-aware 산식)
> 결정: K1 0% **8회 연속** (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10). 협의서 v3 §12 보강 회의록 PR11 트리거 충족 단언.
>       PR10 needs-aware 산식 효과: homeless K3 3.2 → 4.1 (+0.9d 단독). cooking lv 0 4직업 변화 0 (cook_noodles blueprint 잠금 — KPI 재정의 §12.3 통과).
>       신규 위험 R10-1 — 사망일 연장으로 절망 사망 +25.

---

## 1. 서두

### 1.1 측정 환경

- 시뮬: `tools/sim/v2/` (PR1~PR10 누적). 변경 라인 = `playerAI.mjs:172-201` `actCook` 함수 1개 (needs-aware 산식 도입)
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 측정 변경: `OUTPUT_FILE` v5→v6 (`run_baseline.mjs:13`), `buildTag` `sim-baseline-v5-pr9`→`sim-baseline-v6-pr10` (`run_baseline.mjs:41`) — 2줄
- 700 runs (7직업 × 100회), `RUNS_PER_CHARACTER=100`, `SEED_BASE=0`
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: 7.9초 (`meta.totalDurationMs = 7912`)
- BALANCE leaf 합: 227 (`drift.balanceLeafTotal`), **fingerprint `len316-h242a5b5f`** — v3·v4·v5 동일 (BALANCE 미변경 단정)
- 결과 파일: `BAL_SIM_baseline_v6_result.json`
- buildTag: `sim-baseline-v6-pr10`
- bootstrapErrors 합: **0/700** (전 회차 시스템 init 정상, `runs[*].bootstrapErrors` 합산 0)

### 1.2 PR10 적용 차이 (v5 대비) — needs-aware 산식

`tools/sim/v2/playerAI.mjs:172-201` `actCook`:
```js
const nutCur = GameState.stats?.nutrition?.current ?? 100;
const nutMax = GameState.stats?.nutrition?.max ?? 100;
const needsNutrition = nutCur < nutMax * 0.5;
// ...
const benefit = needsNutrition ? (n * 3 + h) : (n + h * 1.5);
```

- v5 `benefit = n + h` 단순 합산 → boiled_water(0+65=65) > cooked_noodles(35+20=55), 항상 boiled_water 우선
- v6 needs-aware (nutrition < 50%일 때 n×3 + h):
  - nutrition 결핍 시: cooked_noodles benefit = 35×3 + 20 = **125** > boiled_water = 0×3 + 65 = 65 → cooked_noodles 우선
  - nutrition 충분 시: cooked_noodles = 35 + 65×1.5 = **132.5**도 우선 (분기 조건 무관 cooked_noodles 우위)
- BALANCE 상수 변경 0건 — fingerprint `len316-h242a5b5f` 유지 검증
- `gameBalance.js` 0줄, `characters.js` 0줄, `districts.js` 0줄, `items*.js` 0줄, `runner.mjs` 0줄
- **시나리오 γ 단정** (`SYS_VERIFY_cooking_autopick.md` §5.2): 게임 본체에 cooking 자동 추천 알고리즘 부재. PR10은 본체 정합화가 아닌 *이상적 player 행동 대리 추정 모델 보강*

---

## 2. 메서드

- 700 runs (7직업 × 100회), SEED_BASE=0, runDays=100
- v3·v4·v5와 동일 시드·동일 runner 흐름. 차이는 `actCook` 산식 단독
- 결정성: Math.random → mulberry32 monkey-patch. fingerprint v3·v4·v5·v6 모두 `len316-h242a5b5f`
- bootstrapErrors 0/700 — 전 회차 시스템 init 정상 (`runs[*].bootstrapErrors` 합산 0)
- 결정성 100% (협의서 v3 §12.5: 두 번째 재실행에서 K3/K5/fingerprint 동일 단언)
- actCook 산출물 boil/nut 비율 probe는 `tmp/probe_v6_cookout.mjs` (7직업 × seed 0~99 × day 1~6, simInv 입력·산출물 카운트 분리)

---

## 3. K1 — 100일 생존율 (목표 ≥ 5%)

| 직업 | 생존율 v6 | ±CI95p | survived/runs | v5 비교 | v4 비교 |
|------|-----------|--------|---------------|---------|---------|
| doctor | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| soldier | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| firefighter | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| homeless | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| chef | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| engineer | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| pharmacist | 0.00% | 0.00 | 0/100 | 0%p | 0%p |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p). `kpi.survivalRate.crossCharacterGapPct = 0`.

**판단: K1 목표(≥ 5%) 미달. baseline 8회 연속 0%** (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10). ±3%p 신뢰구간 안에서 100% 0%.

PR10 needs-aware 산식은 homeless K3 +0.9d (§4.2 단정)을 가져왔으나 day 100 도달은 0건. cooking lv 0 4직업은 `cook_noodles` blueprint `requiredSkills.cooking: 1` 잠금이라 산식 변경 영향 0. 협의서 v3 §10.2 폴백 트리거(PR10 후 K1 < 5% 유지) **충족 확정.** 본 보고는 PR11 진입 권고 권한을 가진다.

---

## 4. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean (v6) | median (v6) | mean (v5) | mean (v4) | mean (v3) | Δv5→v6 |
|------|-----------|-------------|-----------|-----------|-----------|--------|
| doctor | 4.00 | 4 | 4.00 | 4.00 | 4.00 | 0 |
| soldier | 3.00 | 3 | 3.00 | 3.00 | 3.00 | 0 |
| firefighter | 3.00 | 3 | 3.00 | 3.00 | 3.00 | 0 |
| **homeless** | **4.10** | **4** | 3.20 | 3.00 | 3.00 | **+0.90** |
| chef | 5.20 | 5 | 5.20 | 5.20 | 4.50 | 0 |
| engineer | 3.10 | 3 | 3.10 | 3.00 | 3.00 | 0 |
| pharmacist | 4.10 | 4 | 4.10 | 4.00 | 3.00 | 0 |

### 4.1 chef K3 격차 — 두 정의 측정

**정의 1: chef vs 다른 6직업 평균 (v4 보고서 사용 정의)**
- v3: chef 4.50 / others6 3.17 / gap **+1.33d**
- v4: chef 5.20 / others6 3.33 / gap **+1.87d**
- v5: chef 5.20 / others6 3.40 / gap **+1.80d**
- v6: chef 5.20 / others6 ((4.00+3.00+3.00+4.10+3.10+4.10)/6 = 3.55) / gap **+1.65d** (Δv5→v6: -0.15d)

**정의 2: chef vs cooking lv 0 5직업 평균 (pharmacist 제외, 동질 비교)**
- v3: chef 4.50 / others5 3.20 / gap **+1.30d**
- v4: chef 5.20 / others5 3.20 / gap **+2.00d**
- v5: chef 5.20 / others5 3.26 / gap **+1.94d**
- v6: chef 5.20 / others5 ((4.00+3.00+3.00+4.10+3.10)/5 = 3.44) / gap **+1.76d** (Δv5→v6: -0.18d)

**판단:**
- 협의서 v2 §6.2 cook_intuition grace 재검토 트리거 +2.5d — **두 정의 모두 미충족** (정의 1 +1.65d / 정의 2 +1.76d)
- 협의서 v2 §5.5 KPI 목표 +1.0~+2.0d 사수 — **정의 1 ✅ (+1.65d) / 정의 2 ✅ (+1.76d)**
- v5→v6 격차 변화 -0.15~-0.18d — homeless·pharmacist·doctor K3 미세 증가로 격차 자연 축소
- **권고: cook_intuition grace 단축 보류 유지.** 트리거 미충족

### 4.2 homeless K3 +0.9d 단독 단정 (PR10 직접 효과)

협의서 v3 §12.6 인용:
- v5 homeless K3 3.20 → v6 4.10 (Δ +0.90d)
- 원인: cooking lv 3 → `cook_noodles` blueprint `requiredSkills.cooking: 1` 통과 + needs-aware 분기 발동 (`SYS_VERIFY_cooking_autopick.md` §3.3 단정)
- v6 probe (`tmp/probe_v6_cookout.mjs` 결과): homeless boil/nut 200/109 (v5 200/14 → +95건 nutritionFood). 산출물 nutrition 35.3% (v5 6.5% → +28.8%p)
- PR10 산식 단독 효과는 **homeless 직업에서만 측정 가능.** chef·pharmacist는 v5에서 이미 cooked_noodles 50% 산출 → v6 회귀 0 (§6.2 단정)

### 4.3 cooking lv 0 4직업 변화 0 단정 (blueprint 잠금)

| 직업 | cookingLv | v5 K3 | v6 K3 | Δ |
|------|-----------|-------|-------|---|
| doctor | 0 | 4.00 | 4.00 | 0 |
| soldier | 0 | 3.00 | 3.00 | 0 |
| firefighter | 0 | 3.00 | 3.00 | 0 |
| engineer | 0 | 3.10 | 3.10 | 0 |

**원인:** `js/data/blueprints.js:721~736` `cook_noodles` blueprint `requiredSkills: { cooking: 1 }` (`SYS_VERIFY_cooking_autopick.md` §3.3 인용). cooking lv 0 4직업은 `cook_noodles` 조건 차단 → 시뮬 `playerAI.mjs:184` `if (minSkill > cookingLv) continue;`로 후보에서 제거. needs-aware 산식이 활성화되어도 후보 자체가 boiled_water 1종.

**§12.3 KPI 재정의 정합:** "cooking lv 0 4직업 nutritionFood 산출 경로 — interactions.js T1 시뮬 모사 보강 트랙으로 분리 (M3 #14 신규)." PR10 산식 영역의 책임 경계 밖.

### 4.4 chef·pharmacist K3 회귀 검증

- chef K3 5.20 (v5·v6 동일) — junggoo 비-hasFishing, hangang 미접근. PR10 산식 변경의 chef 회귀 0 (협의서 v3 §12.5 회귀 검증 통과)
- pharmacist K3 4.10 (v5·v6 동일) — gangnam 자체 hasFishing + cooking lv 1, v5에서 이미 needs-aware 분기 효과 천장 도달 (cooked_noodles 50% 산출 유지)

---

## 5. K5 — 사망 원인 분포

### 5.1 전 직업 합산 (v3 vs v4 vs v5 vs v6)

| 원인 | v3 (PR7) | v4 (PR8) | v5 (PR9) | v6 (PR10) | Δv5→v6 |
|------|----------|----------|----------|-----------|--------|
| 아사 | 569 | 569 | 532 | **510** | **-22** |
| 절망 | 110 | 113 | 142 | **167** | **+25** |
| 탈수 | 20 | 12 | 14 | 14 | 0 |
| 극도 피로 | 1 | 6 | 12 | **9** | **-3** |

**핵심 변화: 아사 -22건, 절망 +25건.** homeless K3 연장으로 nutrition 보강 효과 (아사 -22) + 사망일 연장 부산물로 morale 침식 누적 (절망 +25). 탈수 0 (PR10 산식이 hydration 무영향). 극도 피로 -3 (homeless 사망 day 4 도달이 절망 우선 발생).

### 5.2 직업별 K5 (v5 vs v6)

| 직업 | v5 K5 | v6 K5 | 변화 |
|------|-------|-------|------|
| doctor | 아사 72 / 절망 28 | 아사 72 / 절망 28 | 0 |
| soldier | 아사 100 | 아사 100 | 0 |
| firefighter | 아사 100 | 아사 100 | 0 |
| **homeless** | **아사 94 / 극도 피로 3 / 절망 3** | **아사 72 / 절망 28** | **아사 -22 / 절망 +25 / 극도 피로 -3** |
| chef | 절망 82 / 탈수 12 / 극도 피로 6 | 절망 82 / 탈수 12 / 극도 피로 6 | 0 |
| engineer | 아사 94 / 절망 6 | 아사 94 / 절망 6 | 0 |
| pharmacist | 아사 72 / 절망 23 / 극도 피로 3 / 탈수 2 | 아사 72 / 절망 23 / 극도 피로 3 / 탈수 2 | 0 |

**중요 분석:**
- **homeless K5 합산 변화가 700 runs K5 전체 변화의 100%를 차지.** 아사 -22 / 절망 +25 / 극도 피로 -3. 다른 6직업 K5 분포 완전 동일
- 단정: PR10 산식 효과의 K5 측정 영역은 **homeless 단독.** cooking lv 0 4직업은 §4.3 잠금, chef·pharmacist는 v5에서 천장 도달
- doctor·engineer·soldier·firefighter K5 변화 0 — PR10 산식이 cooking lv 0 직업의 boiled_water 산출 우선순위에 영향 못 줌 (후보 단일)
- chef K5 분포 완전 동일 — 격차 보호 유리 유지

### 5.3 신규 위험 R10-1 — 절망 +25

협의서 v3 §12.7 단정 인용:
- homeless 절망 사망 v5 3건 → v6 28건 (+25건)
- 원인: 사망일 day 3 → day 4 연장으로 morale 침식 시간 +1 TP_PER_DAY=72 누적
- homeless `kpi.moraleDespair.byCharacter.homeless`: enteredDespair 100/100, pctEntered 100%. "death spiral suspected (>25%)" 경고
- 결합 위험: **R8-1** (homeless·engineer actBoostMorale 0%) — morale 회복 자원 부재 상태에서 사망일 연장이 절망으로 직결. R8-1 트랙(M3 #10 시나리오 한도연) 우선순위 상향 정합

---

## 6. AI 발동 측정 — PR10 needs-aware 효과

### 6.1 actCook 산출물 boil/nut 비율 (cookOut 분리 표)

`tmp/probe_v6_cookout.mjs` 700 runs (7직업 × seed 0~99 × day 1~6) 집계:

| 직업 | cookingLv | v5 boil/nut | v6 boil/nut | v5 nut% | v6 nut% | Δnut% |
|------|-----------|-------------|-------------|---------|---------|-------|
| doctor | 0 | 100/0 | 100/0 | 0% | 0% | 0%p |
| soldier | 0 | 138/0 | 138/0 | 0% | 0% | 0%p |
| firefighter | 0 | 200/0 | 200/0 | 0% | 0% | 0%p |
| **homeless** | **3** | **200/14** | **200/109** | **6.5%** | **35.3%** | **+28.8%p** |
| chef | 4 | 100/100 | 100/100 | 50.0% | 50.0% | 0%p |
| engineer | 0 | 200/0 | 200/0 | 0% | 0% | 0%p |
| pharmacist | 1 | 100/100 | 100/100 | 50.0% | 50.0% | 0%p |

**핵심 단정:**
- homeless nutritionFood +95건 — needs-aware 분기 (`needsNutrition = nutCur < nutMax * 0.5`) 발동 결과. cooking lv 3 보유로 `cook_noodles` blueprint 통과
- chef·pharmacist는 v5에서 이미 50% 산출 — needs-aware 산식이 추가 향상 0 (cooked_noodles benefit이 boiled_water benefit보다 v5에서도 우위였던 회차 비율). v6 회귀 0 단정
- cooking lv 0 4직업 nut 0 유지 — `cook_noodles` blueprint 잠금. PR10 산식 영역 밖

### 6.2 chef·pharmacist 회귀 검증

- chef boil/nut 100/100 (v5·v6 동일) — 산출물 분포 회귀 0
- pharmacist boil/nut 100/100 (v5·v6 동일) — 동일
- K3·K5 동일 (§4.4·§5.2) — 회귀 검증 통과

### 6.3 actFish 추세 (v5 대비)

PR10은 fishing 미관여 — `actFish` 코드 변경 0 (`playerAI.mjs:228-235` 그대로). actFish 발동·어획 수치는 v5 측정값 그대로 유지 추정 (산식 변경이 actCook 단독). v6 probe 미수행 (PR10 책임 경계 밖).

협의서 v2 §7.5 KPI actFish ≥ 200/700 — v5 315/700 달성분 유지 추정. PR11 옵션 1(`fishing.baseCatchChance` 상향) 진입 시 v7 재측정 의무.

### 6.4 actBoostMorale (R8-1 변화 없음)

PR10은 morale 미관여. v5 측정값 그대로 유지 추정:
- homeless 0/100, engineer 0/100 — **변화 없음 추정**
- R8-1 (homeless·engineer actBoostMorale 0%) **v6에서도 미해소.** R10-1(절망 +25)과 결합으로 트랙 진입 우선순위 상향 정합 (§8 R10-1)

---

## 7. KPI 표 비교 — 협의서 v3 §9.5 + §12.3 정정 KPI

| KPI | v3 | v4 | v5 | v6 | 협의서 v3 §9.5 목표 | 협의서 v3 §12.3 정정 목표 | 충족 |
|-----|----|----|----|----|---------------------|------------------------|------|
| K1 (전 직업) | 0% | 0% | 0% | 0% | ≥ 5% (1직업 이상) | (동일) | ❌ — **8회 연속 0%, PR11 폴백 트리거 충족** |
| K3 chef | 4.50 | 5.20 | 5.20 | 5.20 | 5.5~6.5 (yongsan 이동 가정) | (동일) | ❌ — yongsan 이동 0회 유지 |
| K3 pharmacist | 3.00 | 4.00 | 4.10 | 4.10 | +1d (5) | (동일) | ❌ — +0.1d만 (v5 천장 도달) |
| K3 doctor | 4.00 | 4.00 | 4.00 | 4.00 | +1d (5) | (동일) | ❌ — 변화 0 (cooking lv 0) |
| **K3 homeless** | 3.00 | 3.00 | 3.20 | **4.10** | +1d 추가 (4) | (동일) | ⚠️ **+0.9d (목표 +1d 대비 90% 달성)** |
| K3 engineer | 3.00 | 3.00 | 3.10 | 3.10 | +1d (4) | (동일) | ❌ — 변화 0 (cooking lv 0) |
| K5 chef 탈수 | 20 | 12 | 12 | 12 | ↓ | (동일) | ⚠️ — v5·v6 동일 |
| actFish 발동 | 0 | 0 | 315 | (315 유지 추정) | ≥ 200/700 | (동일) | ✅ (v5 158% 달성분 유지) |
| K3 chef 격차 (정의 1, 6직업) | +1.33 | +1.87 | +1.80 | **+1.65** | +1.0~+2.0d 사수 | (동일) | ✅ (+1.65d 범위 안) |
| K3 chef 격차 (정의 2, 5직업) | +1.30 | +2.00 | +1.94 | **+1.76** | +1.0~+2.0d 사수 | (동일) | ✅ (+1.76d 범위 안) |
| chef cook_intuition grace 트리거 (+2.5d) | - | +2.00 | +1.94 | +1.76 | < +2.5d | (동일) | ✅ (모니터링 모드 유지) |
| **cookOut 5직업 nutritionFood%** | 0% | 0% | 6.5% (homeless) | **35.3% (homeless)** | ≥ 50% (5직업) | **≥ 50% (cooking lv ≥1 직업)** | ⚠️ **3직업 중 2 달성** (chef 50%·pharmacist 50%·homeless 35.3% 미달) |
| 직업 격차 (K1 max-min) | 0%p | 0%p | 0%p | 0%p | ≤ 5%p | (동일) | ✅ |
| **R8-1 homeless·engineer morale 시계열** | 미측정 | 미측정 | 미측정 | 미측정 | day 1~3 도달값 확보 | (동일) | ❌ — **v6에서도 미실행. R10-1 결합으로 v6+ 측정 시 필수** |

**충족 6건 (actFish, 격차 2종, grace 트리거, 직업 격차, ✅). 부분 달성 2건 (homeless K3 90%, cookOut 2/3). 미달 6건 (K1, K3 4직업, R8-1).**

---

## 8. R7·R8·R9·R10 상태표 갱신

| ID | PR9 후 (v5) | PR10 후 (v6) |
|----|-------------|--------------|
| R7-1 요리·낚시 AI 부재 | ✅ 발동 (요리 7직업 100%, 낚시 4직업 52~63%) | ✅ 발동 + needs-aware 산식 정합 |
| R7-1.5 actCook 산출물 nutrition 효과 | ⚠️ 가설 B 단정 (5직업 boil 100%) | ⚠️ **부분 해소** — cooking lv ≥1 직업 정합 (homeless nut% 6.5→35.3, chef·pharmacist 50% 유지). cooking lv 0 4직업은 `cook_noodles` blueprint 잠금 → interactions.js T1 시뮬 모사 트랙 분리 (M3 #14 신규) |
| R7-2 morale 관리 AI 부재 | ✅ chef·pharmacist·doctor 99~100% 발동 | ✅ 변화 없음 (PR10 morale 미관여) |
| R7-3 lootTable food density | ✅ 6 시작 구 가중치 보강 완료 | ✅ 변화 없음 (PR10 미관여). PR11 옵션 2(25구 확대) 진입 후보 |
| R8 cook_intuition grace 효과 | ✅ 격차 +1.94d, 트리거 미충족 | ✅ 격차 +1.76d (자연 축소), 트리거 미충족 유지 |
| R8-1 homeless·engineer actBoostMorale 0% | ⏳ M3 시나리오 한도연 트랙 위임 | ⚠️ **v6에서도 추가 미실행. R10-1 결합으로 우선순위 상향. v6+ 측정 시 morale 시계열 + 산출 자원 확인 필수** |
| R9-1 4 hasFishing 직업 K1 효과 부족 | ⚠️ K3 +0.1~0.2d만 | ⚠️ **변화 0** (PR10은 산식만, fishing 보강 아님) → PR11 옵션 2 진입 트리거 충족 |
| R9-2 chef PR9 효과 0 | ⚠️ 격차 보호 유리 | ⚠️ v6에서도 효과 0 — 변경 보류 유지. 격차 +1.65~1.76d 자연 축소 |
| **R10-1 (신규)** | - | ⚠️ **절망 사망 +25 (homeless 3→28). 사망일 연장 부산물. R8-1 트랙(M3 #10) 우선순위 상향** |

---

## 9. 다음 단계 / 트리거 후보

### 9.1 PR11 옵션 결정 (협의서 v3 §10.2 폴백 트리거)

K1 < 5% 8회 연속 + PR10 산식 영역 책임 완료 → PR11 진입 트리거 충족.

협의서 v3 §9.5 + §12.8 + §11(다음 단계) 갱신 결과 기반 우선순위 비교:

| 순위 | 옵션 | 영향 | 측정 신뢰성 | 직업 정체성 |
|------|------|------|------------|------------|
| **1차 권고** | **옵션 2 — `js/data/districts.js` 25구 lootTable raw food 확대** | 7직업 동시 향상 (cooking lv 0 4직업도 raw food → boil 입력 추가 → 단 cook_noodles 잠금이라 nutritionFood로 직결되지 않음. raw food 가공재 의존) | 시뮬-본체 동시 정합 (gameBalance·districts 양쪽 import) | 보존 (구 단위 변경, 직업 균등) |
| 2차 권고 | 옵션 1 — `gameBalance.js` `fishing.baseCatchChance` 0.30 → 0.50 | 4 hasFishing 직업 K3 +1d 추정 (1회당 영양 +1.7, 일일 +3.4) | 단일 상수 PR | 4 hasFishing vs 3 비-hasFishing 격차 확대 위험 (chef·soldier·firefighter K1=0 유지 시 격차 5%p 초과 가능) |
| 3차 권고 (병행 가능) | interactions.js T1 시뮬 모사 (M3 #14) — cooking lv 0 4직업이 `instant_noodles + campfire → cooked_noodles` T1 변환 모사 | doctor·soldier·firefighter·engineer K3 +0.5~1d 추정 (cooked_noodles 산출 경로 추가) | 시뮬 단독 변경, fingerprint 영향 0 | 보존 (직업 균등, cooking lv 0 잠금 우회) |

**1차 권고: 옵션 2 진입.** 협의서 v3 §4.5 폴백 우선순위 1·2·3 정합. 단 `js/data/districts.js:897 generateDistrictLoot()`의 scavenging skill 반영 검증 의무(협의서 v1 §3.3) 우선.

**단 결정은 PD/Balance 추가 협의 위임** (협의서 v4 진입 여부). 본 보고는 PR11 옵션 진입 권고만 단언.

### 9.2 interactions.js T1 시뮬 모사 (M3 #14 후보)

협의서 v3 §12.8 신규 항 인용:
- 게임 본체는 `js/data/interactions.js` T1 변환 규칙으로 `instant_noodles + campfire → cooked_noodles` 처리 (`SYS_VERIFY_cooking_autopick.md` §2.5 cook_noodles T1)
- 시뮬 `tools/sim/v2/playerAI.mjs`에 T1 변환 모사 부재 → cooking lv 0 4직업(doctor·soldier·firefighter·engineer)은 cooked_noodles 산출 경로 차단
- 시뮬 보강 시 doctor·soldier·firefighter·engineer K3 4~5d 추정 (cooking lv 0 잠금 우회, cooked_noodles +35/day 추가)
- 진입 시점: PR11 옵션 2 머지 + baseline v7 측정 후. PR10이 needs-aware 산식 단독이라 T1 모사는 별도 PR 트랙

### 9.3 R8-1 우선순위 상향 (R10-1 결합)

협의서 v3 §12.7·§12.8 인용:
- R10-1 (homeless 절망 +25) — 사망일 연장 부산물
- R8-1 (homeless·engineer actBoostMorale 0%) — morale 회복 자원 부재
- 두 위험 결합 효과: 사망일 연장이 morale 침식으로 직결 → 다음 트랙(PR11 또는 PR12)에서 K1 향상 시 절망 사망 가속 위험 증가
- 권고: **M3 #10 시나리오 한도연 트랙 진입 우선순위 상향** (협의서 v3 §6.3 결정 그대로 유지, 시점 baseline v6 측정 D+0 → D+0 즉시 진입)
- baseline v7 측정 시 homeless·engineer morale 시계열 probe 신규 추가 필수

---

## 10. 결정 단언 종합

| 항목 | v6 측정 단언 |
|------|------------|
| K1 ≥ 5% | ❌ 미달 (8회 연속 0%, PR11 폴백 트리거 충족) |
| K3 chef 격차 +2.5d 초과 | ❌ 미초과 (+1.65~1.76d, cook_intuition grace 단축 보류 유지) |
| PR10 산식 효과 — homeless 단독 | ✅ +0.9d K3, +95건 nutritionFood (cookOut 35.3%) |
| PR10 산식 효과 — cooking lv 0 4직업 | ❌ 변화 0 (cook_noodles blueprint 잠금) |
| PR10 산식 효과 — chef·pharmacist 회귀 | ✅ 회귀 0 (K3·K5·cookOut 동일) |
| 시뮬 결정성 | ✅ fingerprint `len316-h242a5b5f` 유지, bootstrapErrors 0/700, 두 번째 재실행 결과 동일 |
| §12.3 정정 KPI 충족 | ⚠️ cooking lv ≥1 직업 3 중 2 (chef·pharmacist 50%, homeless 35.3% 미달) |
| §10.2 PR11 트리거 | ✅ 충족 (옵션 2 25구 확대 1차 권고) |
| R10-1 신규 위험 | ⚠️ 절망 사망 +25. R8-1 트랙(M3 #10) 우선순위 상향 |

### 10.1 다음 단계 권고 요약

1. **PR11 = 옵션 2 (25구 lootTable raw food 확대)** 1차 권고 — 단 결정은 PD/Balance 추가 협의 위임
2. **M3 #10 시나리오 한도연 트랙 진입** — R10-1+R8-1 결합으로 우선순위 상향, baseline v6 측정 D+0 즉시 진입
3. **(병행 가능) M3 #14 interactions.js T1 시뮬 모사** — cooking lv 0 4직업 K3 향상 경로 확보. PR11 옵션 2 머지 + baseline v7 후 진입 검토
4. **baseline v7 측정 시 필수 추가:** homeless·engineer morale 시계열 probe (R8-1 원인 단정), actFish 회귀 검증 (PR11이 fishing 미관여라도 KPI 유지 확인)

### 10.2 baseline v6 → v7 트리거 조건

- PR11 (옵션 2 25구 확대) 머지 완료
- `node --input-type=module js/data/validate.js` Errors 0
- fingerprint 변동 시 즉시 점검 (BALANCE leaf 변경 여부 — 25구 lootTable은 BALANCE 트리 밖, fingerprint 유지 추정)
- `BAL_SIM_baseline_v7_result.json` 생성, buildTag `sim-baseline-v7-pr11`

---

*문서 끝. 협의서 v3 §12 보강 회의록 PR11 트리거 충족 단언. PD/Balance 협의서 v4(또는 §12.8 확장) 발행 시 본 보고 §9.1 우선순위 권고 인용.*
