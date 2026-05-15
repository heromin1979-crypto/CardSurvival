# PD·Balance 합동 협의 — PR10 결정 (v3)

> 작성: PD 김재훈 + 밸런스 권지나 / 2026-05-11
> 목적: PR9 머지(`5bdc261`) 후 baseline v5 정식 측정(`afd30c4`) 결과를 입력으로, K1 0% 7회 연속 + actCook 모순 가설 B 단정 + R9-1/R9-2 신규 위험 처리를 결정한다.
> 결정: **PR10 = 시뮬 측 actCook 산출물 우선순위 가중치 분리 (옵션 C 단독). 게임 본체 cooking 자동 추천 검증을 PR10 머지의 *선행 조건*으로 분리(시스템 백승호 + AD 오은별 위임). baseline v6 측정 후 PR11(옵션 A — 25구 lootTable raw food 확대) 진입 여부 결정. R9-2(chef PR9 효과 0)는 변경 보류, R8-1은 v6 측정 의존 상태 유지.**

---

## 1. 서두

- **참여 페르소나:** PD 김재훈 (프로덕션·우선순위·트레이드오프), 밸런스 권지나 (`gameBalance.js` 단일 진리 / 100회 시뮬 / K1 10~20%)
- **안건 4건 + 1 트랙 진입 시점:**
  1. PR10 진입 옵션 결정 (A 25구 확대 vs B startInv 추가 vs C actCook 시뮬 산식 보강)
  2. actCook 모순 가설 B 후속 처리 (게임 본체 검증 vs 시뮬 산식 PR)
  3. R9-1 (4 hasFishing 직업 K1 효과 부족) 폴백 우선순위
  4. R9-2 (chef PR9 효과 0) 검토
  5. R8-1 시나리오 한도연 트랙 진입 시점 (baseline v6 측정 의존)

### 1.1 협의서 v2 결정 결과 요약

`PD_BAL_MEETING_PR9_decision.md` §6: PR9 = 변형 C-a (hangang sublocation 진입 시 `fishing_rod_basic` 1회 자동 지급). chef cook_intuition grace 단축 보류 (모니터링 모드, §6.2 +2.5d 트리거). R8-1 별도 트랙 분리.

### 1.2 baseline v5 핵심 수치 (`BAL_SIM_baseline_v5_report.md`에서 인용)

- 700 runs (7직업 × 100회), fingerprint `len316-h242a5b5f`, buildTag `sim-baseline-v5-pr9`, bootstrapErrors 0, 7.5초
- `gameBalance.js` 미변경 검증 — fingerprint v3·v4·v5 동일
- **K1 0.00% × 7직업** (**7회 연속 0%**: PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9)
- K3 mean: doctor 4.00 / soldier 3.00 / firefighter 3.00 / **homeless 3.20** / chef 5.20 / **engineer 3.10** / **pharmacist 4.10**
- K3 chef 격차: 정의 1(6직업 평균) +1.80d / 정의 2(5직업 cooking lv 0) +1.94d — **협의서 v2 §5.5 KPI +1.0~+2.0d 범위 안**
- K5 합산: 아사 532 (-37) / 절망 142 (+29) / 탈수 14 (+2) / 극도 피로 12 (+6)
- actFish 발동: 4 hasFishing 직업 52~63/100, 어획 누적 **315/700 (v4=0)** — 협의서 v2 §7.5 KPI ≥ 200/700 달성 158%
- **actCook 모순 가설 B 단정** (`BAL_SIM_baseline_v5_report.md` §7.3): cooking lv 0~3 5직업 산출물 100% boiled_water (nutrition 0). chef·pharmacist만 cooked_noodles 50% 산출. 시뮬 산식 결함: `playerAI.mjs:185` `benefit = nutrition + hydration` 단순 합산 → boiled_water(65) > cooked_noodles(55) 항상 우선.

### 1.3 협의서 v2 §6.1 + §8.1 PR10 트리거 충족 단언

협의서 v2 §6.1: "**baseline v5에서 K1 모든 직업 < 5%**" 트리거. baseline v5 측정값 K1 0.00% × 7직업. **트리거 충족 확정.** 본 협의는 PR10 결정 권한을 가진다.

협의서 v2 §8.1 폴백 1(PR10 옵션 A 25구 확대) / 폴백 2(PR11 startInv 추가 보강) / 폴백 우선순위 결정 권한도 본 협의로 위임.

---

## 2. 안건 1 — PR10 진입 옵션 결정

### 2.1 baseline v5가 노출한 결함 구조

v5 측정의 결정적 발견(`BAL_SIM_baseline_v5_report.md` §6.4):

```
cooking lv 0~3 5직업 actCook 산출물 = 100% boiled_water (n0 + h65)
→ K3·K5에 nutrition 효과 0
→ v4 보고서 "actCook 7직업 100/100 발동"의 KPI 가치는 chef·pharmacist 2직업만
→ K1 = 0% 7회 연속의 일차 원인: 5직업의 actCook 발동이 nutrition 회복으로 *환산되지 않음*
```

산식 위치 `tools/sim/v2/playerAI.mjs:172-195` `actCook`:
- line 185: `const benefit = (onC?.nutrition ?? 0) + (onC?.hydration ?? 0);`
- line 187: `if (benefit > bestN) { bestN = benefit; best = bp; }`

boiled_water onConsume = nutrition 0 + hydration 65 = 65
cooked_noodles onConsume = nutrition 35 + hydration 20 = 55
→ boiled_water가 항상 우선 선택. nutrition을 차별 가중치 부여하지 않는 단순 합산이 결함.

### 2.2 옵션 비교 매트릭스

| 옵션 | 변경 위치 | 영향 KPI | 직업 정체성 영향 | 측정 신뢰성 |
|------|----------|---------|----------------|------------|
| **A** (25구 lootTable raw food 확대) | `js/data/districts.js` 25구 lootTable 가중치 | K1·K3 7직업 동시 향상 추정 | 낮음 (구 단위 변경, 직업 균등) | 시뮬 산식 결함 미해소 → 측정 노이즈로 K1 평가 부정확 |
| **B** (7직업 startInv nutrition 회복 +1) | `js/data/characters.js` startingItems | K1·K3 7직업 동시 향상 (PR8 패턴 반복) | **중간** (PR8 instant_noodles + contaminated_water 보강 후 추가 보강은 직업 차별화 손상) | 시뮬 산식 결함 미해소 → 측정 노이즈 |
| **C** (actCook 시뮬 산식 보강) | `tools/sim/v2/playerAI.mjs:185` benefit 가중치 분리 | 5직업 actCook 산출물을 cooked_noodles로 정합화 (K3 +1~2d 추정) | 0 (시뮬 로직, 게임 본체 무영향) | **측정 도구 자체 정합화** — 후속 데이터 PR의 효과 정확 평가 가능 |

### 2.3 PD 시각

**PD 김재훈:**
> 머지 순서 원칙 — 데이터 → 메커닉 → 시각 → 밸런스 튜닝. 데이터 변경(A·B)이 정석이지만, baseline v5에서 노출된 결함은 *측정 도구 정합성*이다. 측정 도구가 결함을 가진 채 A·B를 머지하면 두 가지 위험이 발생한다.
>
> 1. **A·B의 K1 효과 평가 부정확.** 시뮬 5직업이 boiled_water만 산출하는 한, A로 새 raw food를 lootTable에 넣어도 시뮬은 그것을 cooking 입력으로 쓰지 않거나 boil로만 처리한다. K1 측정값이 진짜 게임 본체 K1을 대표하지 못한다.
> 2. **시뮬 산식 결함이 게임 본체 결함의 모사인지 모름.** 본 협의 안건 2에서 게임 본체 cooking 자동 추천 알고리즘 검증 의무를 분리하지만, 검증 결과가 도착하기 전까지는 시뮬 산식이 결함의 *복사본*인지 *과장본*인지 불명. 즉 PR10이 시뮬 산식만 보강하면 게임 본체와 정합이 깨질 가능성도 있다.
>
> 그러나 (2)는 게임 본체 검증을 PR10 머지의 *선행 조건*으로 만들면 해결된다. 게임 본체에 동일 결함(boiled_water 우선)이 있으면 시뮬 보강이 정합화 PR이고, 게임 본체가 nutrition 우선이면 시뮬 보강이 단순 정합화 PR이다. 어느 쪽이든 시뮬 보강 방향은 동일 — nutrition 차별 가중치.
>
> **결정: PR10 = C 단독.** 게임 본체 검증을 시스템 백승호 + AD 오은별에 위임(안건 2). 검증 결과가 도착하기 전까지 PR10 머지 보류. 게임 본체에 nutrition 우선이 확인되거나 본체에도 결함 + 보강 방향 합의 완료 시 PR10 머지.
>
> PR11(옵션 A) 진입은 baseline v6 측정 결과로 결정. v6에서도 K1 < 5% 유지 시 PR11 = A 25구 확대. K1 일부 직업 ≥ 5% 달성 시 PR11 보류, 모니터링 모드.
>
> 일정: PR10 영향 파일 1개(`playerAI.mjs:185` benefit 가중치 1줄 또는 1 함수), validate.js 회귀 0(시뮬 로직만 변경), run_baseline.mjs v5 → v6까지 D+1. 단 게임 본체 검증 트랙 완료까지는 PR10 머지 대기.

### 2.4 밸런스 시각

**밸런스 권지나:**
> 옵션 C 시뮬 산식 보강 후 baseline v6 K1·K3 예측치.
>
> **산식 변경 후보:**
> ```js
> const benefit = (onC?.nutrition ?? 0) * 1.5 + (onC?.hydration ?? 0);
> ```
> 또는 nutrition·hydration 우선순위 분리(needs-aware 산식 — `player.nutrition.current < threshold` 시 nutrition 우선).
>
> 단순 가중치 ×1.5 적용 시:
> - boiled_water benefit = 0 × 1.5 + 65 = 65
> - cooked_noodles benefit = 35 × 1.5 + 20 = 72.5 → **cooked_noodles 우선 선택**
> - boiled_rice benefit = 35 × 1.5 + 30 = 82.5 (단 raw_rice 입력 필요)
>
> **K3 예측 (가설 단정 측정 기반):**
> - cooking lv 0~3 5직업이 actCook 1회/day cooked_noodles 산출 시 nutrition +35/day 추가 회복
> - 일일 net = -36 + 35(cook) + 0(fishing 4 hasFishing) ≈ -1 → nutrition 0 도달이 day 4~5로 연장
> - 4 hasFishing 직업 fishing 1~2회/day = +3~6 추가 → 일일 net = +5~+10 → 4직업이 100일 도달 가능성 출현
> - **K1 5% 달성 가능성**: pharmacist·doctor 자체 hasFishing + cooked_noodles 정합화로 후보 1순위. homeless·engineer K3 3.x → 5.x 예측 (K1은 5~10% 추정, 신뢰구간 ±5%p)
>
> **chef·soldier·firefighter K3 예측 변화:**
> - chef cooking lv 4 — cooked_noodles 산출은 이미 v5에서 발생(probe day 3). 변화 ≈ 0
> - soldier·firefighter cooking lv 0 — actCook 산출물이 boiled_water → cooked_noodles로 변경 시 시작 startInv `instant_noodles` 2개가 입력으로 사용. day 2~3에 cooked_noodles 1~2회 산출 추정. K3 3 → 4~5 예측
>
> **K5 예측 변화:**
> - 아사 532 → 400대 추정 (-100건 이상). 절망은 사망일 연장 부산물로 +20~50 증가 추정
> - 극도 피로 12 → 30~50 추정 (생존 길어진 부작용)
>
> 옵션 C 단독으로 K1 5% 달성 가능성이 있다. 단 시뮬 산식이 게임 본체와 정합이 깨지면 측정값 자체가 무의미하므로 안건 2 게임 본체 검증 선행이 필수.
>
> A·B는 PR11 이후로 미룬다. 옵션 A 25구 확대는 시뮬 산식 정합화 후 효과 평가가 정확하므로 PR10 C → PR11 A 순서가 PD 원칙(데이터 → 메커닉 → 시각 → 측정)을 측정 도구 정합화 한 단계로 확장한 형태다.
>
> 옵션 C 채택에 합의.

### 2.5 결정 — 안건 1

**PR10 = 옵션 C 단독.** `tools/sim/v2/playerAI.mjs:185` `actCook` 함수 `benefit` 산식에 nutrition 차별 가중치 도입.

- **양 페르소나 합의 도출.**
- 영향 파일: `tools/sim/v2/playerAI.mjs` (1 함수 변경, 산식 1~5줄)
- **머지 선행 조건:** 안건 2 게임 본체 검증 결과 도착. 게임 본체 nutrition 우선 확인 → PR10 머지. 게임 본체에도 결함 + 보강 방향 합의 → PR10 머지(단 게임 본체 PR을 별도 트랙으로 동시 진행).
- **2026-05-11 충족 단언:** `SYS_VERIFY_cooking_autopick.md` (시스템 백승호, 440줄) 도착. **시나리오 γ 신규 단정** — 게임 본체에 자동 추천 알고리즘 *부재*. 시뮬 보강은 "본체 정합화"가 아닌 *이상적 player 행동 대리 추정 모델*. 머지 선행 조건 충족. 본문 갱신 사항은 §12 보강 회의록 참조.
- 검증 절차: validate.js Errors 0 (시뮬 로직만 변경이라 영향 0 예상), `node tools/sim/v2/run_baseline.mjs` 7.5초 실행 시간 변동 0, fingerprint `len316-h242a5b5f` 유지 (BALANCE 미변경)
- PR11(옵션 A) 진입 트리거: baseline v6 측정에서 K1 < 5% 유지

### 2.6 산식 변경 후보 비교 (시스템 백승호 결정 영역으로 위임)

본 협의서는 산식 *방향*을 결정한다 — nutrition 차별 가중치 도입. 정확한 가중치 값(×1.5 vs ×2.0)·산식 형태(단순 가중치 vs needs-aware vs nutrition-floor 등)는 시스템 백승호 위임.

| 산식 후보 | 식 | 장점 | 단점 |
|----------|-----|------|------|
| 가중치 ×1.5 | `n × 1.5 + h` | 1줄 변경, 결정성 영향 0 | 마법 상수, hydration 충분 시에도 nutrition 우선 |
| needs-aware | `player.nutrition < 50 ? n×3 + h : n + h×1.5` | 상황 적응, 측정 정합 | 분기 추가, GameState 참조 필요 |
| nutrition-floor | nutrition ≥ 1 우선 선택 (boil 제외) | 단순, 의도 명확 | 극단적 — hydration 결핍 시도 noodles 선택 |

밸런스 권지나는 **needs-aware** 권고 — game 본체가 실제 player 행동 모사에 가깝고 K1·K3 측정값이 게임 본체 자동 추천 알고리즘과 정합 가능. PD 김재훈은 시스템 백승호 위임 영역으로 본다.

---

## 3. 안건 2 — actCook 모순 가설 B 후속 처리

### 3.1 가설 B 단정 결과 재인용

`BAL_SIM_baseline_v5_report.md` §7.3:
> v4 보고서의 "actCook 7직업 100/100 발동"은 사실이지만, 발동 = nutrition 회복 효과가 아니다. 5직업의 산출물은 boiled_water(nutrition 0)이며, 영양 회복 0. 시뮬 산출물 우선순위 결함(cooking benefit = nutrition + hydration 단순 합산)으로 boiled_water가 cooked_noodles보다 우선 선택. **이는 시뮬 로직 결함이며 게임 본체 측 결함은 별개로 확인 필요.**

### 3.2 검증 의무 분리

가설 B는 시뮬 측 결함을 단정했지만 게임 본체 결함 여부는 미확인. 두 가지 시나리오:

| 시나리오 | 게임 본체 cooking 자동 추천 | 시뮬 보강 의미 |
|----------|--------------------------|---------------|
| α | nutrition 우선 (player가 cooked_noodles 선택) | 시뮬 보강 = 게임 본체와의 정합화 PR (기존 시뮬이 잘못된 모사) |
| β | hydration 우선 또는 무차별 (player가 boiled_water 선택) | 시뮬 보강 = 게임 본체 결함의 *과장된 모사 수정*. 게임 본체도 별도 PR로 정합화 필요 |

### 3.3 PD 시각

**PD 김재훈:**
> α/β 단정은 게임 본체 cooking UI 또는 자동 추천 알고리즘 코드 직접 확인이 필요한 영역이다. 본 협의 PD/Balance 페르소나 영역 밖. 시스템 백승호(게임 본체 cooking 자동 추천 로직 코드 영역) + AD 오은별(cooking minigame UI 검증 영역) 위임.
>
> 검증 산출물: `SYS_VERIFY_cooking_autopick.md` — 게임 본체에서 player가 cooking minigame 진입 시 (1) 자동 추천 알고리즘 존재 여부 (2) 알고리즘이 사용하는 우선순위 산식 (3) baseline v5 5직업 startInv 입력에서 게임 본체가 boiled_water/cooked_noodles 어느 쪽을 추천하는지.
>
> **PR10 머지 선행 조건으로 분리.** 검증 결과 도착 D+0 안에 PR10 머지/변경 방향 확정 회의 재개.
>
> AD 오은별 영역 추가 (cooking UI 가시화 검증): 자동 추천이 있다면 player가 추천 외 선택(예: hydration 부족 시 boiled_water 선택)을 쉽게 할 수 있는 UI인지. UI 검증 결과에 따라 시뮬 산식이 player 행동 모사에 가까운지 평가.

### 3.4 밸런스 시각

**밸런스 권지나:**
> 게임 본체 검증 결과는 시뮬 산식 결정에 직접 입력. 단 두 가지 시나리오 모두 시뮬 산식 변경 방향(nutrition 차별 가중치)은 동일.
>
> - 시나리오 α (본체 nutrition 우선): 시뮬 보강 후 시뮬 K1·K3 측정값이 게임 본체에 직접 매핑 가능. baseline v6이 게임 본체 K1 예측치
> - 시나리오 β (본체도 결함): 시뮬 보강은 측정 도구를 *이상적 player 행동* 기준으로 정합화. 게임 본체는 별도 PR로 nutrition 우선 추천 도입 — 두 PR 머지 후 시뮬-본체 정합화 완료. baseline v6은 시뮬 이상치, 본체 K1은 게임 본체 PR 머지 후 별도 측정 필요
>
> 시나리오 β가 확인되면 본 트랙은 PR10(시뮬) + PR10.5 또는 PR11(게임 본체) 2 PR 분리. PD 1 PR 1 트랙 원칙 정합.
>
> 게임 본체 검증 우선에 합의.

### 3.5 결정 — 안건 2

**게임 본체 cooking 자동 추천 검증 우선.** 시스템 백승호 + AD 오은별 위임. 별도 트랙(`SYS_VERIFY_cooking_autopick.md`).

- **양 페르소나 합의 도출.**
- 검증 항목 (시스템 백승호):
  1. `js/systems/CraftSystem.js` 자동 추천 알고리즘 존재 여부 grep
  2. cooking blueprint 우선순위 결정 코드 (있다면 산식 위치·파라미터)
  3. baseline v5 5직업 startInv 입력으로 게임 본체가 boiled_water/cooked_noodles 어느 쪽 추천하는지 트레이스
- 검증 항목 (AD 오은별):
  1. cooking minigame UI에서 player가 산출물 선택 자유도 (자동 추천 외 manual override 가능성)
  2. UI에 hydration/nutrition 게이지 노출 여부 — player의 산출물 선택에 영향
- 결과 문서 도착 후 PR10 머지 방향 확정 (시나리오 α → PR10 머지 / β → PR10 + 게임 본체 PR 2 트랙)

---

## 4. 안건 3 — R9-1 (4 hasFishing 직업 K1 효과 부족) 폴백 우선순위

### 4.1 R9-1 측정 사실 (`BAL_SIM_baseline_v5_report.md` §9 R9-1)

| 직업 | K3 v4 | K3 v5 | Δ |
|------|-------|-------|---|
| pharmacist | 4.00 | 4.10 | +0.10 |
| doctor | 4.00 | 4.00 | 0 |
| homeless | 3.00 | 3.20 | +0.20 |
| engineer | 3.00 | 3.10 | +0.10 |

협의서 v2 §7.5 KPI 목표 +1d 추가 대비 10~20%만 달성. PR9 actFish 발동(52~63/100)·어획 누적(315/700)은 성공했지만 K3 mean 변화 미미.

### 4.2 원인 정량 (밸런스 권지나)

`BAL_SIM_baseline_v5_report.md` §10.1 추정 산식 재인용:
```
fishing 1회 영양 기댓값 = baseCatchChance 0.30 × fish 영양 ~10 = ~3/회
일일 fishing 1~2회 = +3~6/day
일일 nutrition decay = 36
일일 net = -36 + 0(cooking lv 0 boiled_water) + 3~6(fishing) = -30~-33
→ day 3에 nutrition 0 → day 4~5 사망 (실제 K3 변화 +0.1~0.2d 정합)
```

K1 5% 도달 미보장. 폴백 후보:

| 폴백 옵션 | 변경 위치 | 4 hasFishing 직업 K1 영향 | 다른 3직업 영향 | 직업 정체성 |
|----------|----------|------------------------|----------------|------------|
| 1. `fishing.baseCatchChance` 0.30 → 0.50 | `gameBalance.js:328` | K3 +1d 추정 (1회당 영양 +1.7, 일일 +3.4) | 0 (시작 구 미보유) | 보존 |
| 2. nutrition 추가 경로 (PR11 옵션 A 25구 lootTable raw food 확대) | `js/data/districts.js` | K3 +1~2d 추정 (raw food cooking 입력 확보) | 향상 (모든 직업) | 보존 |
| 3. fishing 산출물 영양 상향 (fish_small/medium onConsume.nutrition 향상) | `items.js` | K3 +0.5d 추정 | 0 | 보존 |

### 4.3 PD 시각

**PD 김재훈:**
> 폴백 옵션 1·3은 fishing 특화 — 4 hasFishing 직업만 향상. 옵션 2(PR11 25구 확대)는 7직업 동시 향상.
>
> M3 목표는 "K1 5% 마지노선 달성"이고 동시에 협의서 v1 §3.1 "직업 정체성 흐림 방지". 옵션 2는 직업 격차 보호(chef 격차 +1.94d 유지) 가능, 옵션 1·3은 chef·soldier·firefighter 격차 확대 위험(K1=0% 유지 시 chef·soldier·firefighter만 0%, 4 hasFishing만 5%로 격차 5%p 초과).
>
> 즉 **PR10 = C(시뮬 산식) 머지 + baseline v6 → 옵션 2(PR11 25구 확대) 우선 → 그래도 K1 < 5%면 옵션 1(baseCatchChance 상향) 검토** 순서.
>
> 옵션 3(fish 영양 상향)은 가장 후순위 — items.js onConsume 변경은 게임 본체 fish 가치 평가 재조정이라 영향 범위 큼.

### 4.4 밸런스 시각

**밸런스 권지나:**
> 폴백 우선순위 1·2·3에 합의. 단 옵션 2(PR11) 진입 시 협의서 v1 §3.3 "scavenging skill 미반영" 검증 의무 — `js/data/districts.js:897 generateDistrictLoot()`이 v5 시점에도 직업 균등 분포라면 옵션 2 효과는 7직업 균등(직업 격차 보호 정합). v5 측정 시 검증 미수행 — PR11 진입 시 필수.
>
> `fishing.baseCatchChance` 0.30 → 0.50 변경은 단일 상수 PR. 협의서 v2 §6.2 "stats.decay 5개 우선 검토" 신념과 동일 트랙(밸런스 1차 도구). baseCatchChance는 `js/data/gameBalance.js:328` 직접 변경 + 시뮬 v2와 게임 본체 양쪽 자동 정합 (시뮬이 gameBalance import).

### 4.5 결정 — 안건 3

**폴백 우선순위:** PR11 옵션 2(25구 lootTable raw food 확대) → 그래도 K1 < 5% 시 PR12 옵션 1(`fishing.baseCatchChance` 0.30 → 0.50). 옵션 3(fish 영양 상향)은 최후순위.

- **양 페르소나 합의 도출.**
- PR11 진입 조건: PR10 C 머지 + baseline v6 측정에서 K1 < 5% 유지
- PR11 진입 시 필수 검증: `generateDistrictLoot()` scavenging skill 반영 여부 (협의서 v1 §3.3 재검증)
- PR12 진입 조건: PR11 머지 + baseline v7 측정에서 K1 < 5% 유지

---

## 5. 안건 4 — R9-2 (chef PR9 효과 0) 검토

### 5.1 R9-2 측정 사실 (`BAL_SIM_baseline_v5_report.md` §4.2 + §9 R9-2)

- chef K3 5.20 (v4 5.20, 변화 0)
- chef 회차 actFish 0/100 (junggoo 비-hasFishing, yongsan 이동 0회)
- chef 회차 사망 원인: 절망 82 / 탈수 12 / 극도 피로 6 (v4와 100% 동일)
- 협의서 v2 §8.5 예측("chef 옵션 C-a로 K3 ↑ 효과 ≈ 0") 정합

### 5.2 PD 시각

**PD 김재훈:**
> chef 격차 +1.94d (정의 2) — 협의서 v2 §5.5 KPI +1.0~+2.0d 범위 안. chef 격차 보호 목적이라면 R9-2는 위험이 아니라 **결과**.
>
> chef yongsan 이동 동기 부여 옵션 — chef는 cooking lv 4로 fishing 어획 시 cooked_fish 산출 가능. 이동 인센티브는 chef 정체성 강화 방향이지만 PR10 옵션 C 머지 + baseline v6 측정 후 chef K3 변화 측정이 우선. v6에서 chef도 cooked_noodles 산출 증가로 K3 +0.5~1d 변화 가능성 — 이때 chef 격차 자연 축소 → yongsan 이동 동기는 별도 트랙 미필요.

### 5.3 밸런스 시각

**밸런스 권지나:**
> chef yongsan 이동 동기는 chef 정체성(요리 특화)과 정합하지만 시뮬에서 측정 가능한 변화량 작음. K3 +0.5d 미만 추정.
>
> **변경 보류 권고.** chef 격차 +1.94d는 KPI 사수 — 보호 유리이므로 chef PR9 효과 0은 의도 효과.

### 5.4 결정 — 안건 4

**변경 보류.** R9-2는 chef 격차 보호 유리로 처리. chef yongsan 이동 동기 부여 옵션은 트랙 진입 안 함.

- **양 페르소나 합의 도출.**
- baseline v6 측정 시 chef K3 자연 변화 모니터링 의무 (밸런스 권지나)

---

## 6. R8-1 트랙 진입 시점

### 6.1 v5 변화 없음 단언

`BAL_SIM_baseline_v5_report.md` §6.5: R8-1 (homeless·engineer actBoostMorale 0%) **변화 없음** — PR9는 fishing만 활성화. morale 회복 자원 분배는 시나리오 한도연 트랙(M3 5직업 Tier-2 abilities) 위임 상태 그대로.

### 6.2 PD 시각

**PD 김재훈:**
> R8-1 원인 단정 probe(morale 시계열 측정)는 baseline v5 부록 §7에서 actCook 모순 단정으로 후순위 처리 — 합의. baseline v6 측정 시 추가.
>
> M3 #10 5직업 Tier-2 abilities 작업은 baseline v6 측정 결과를 입력으로 R8-1 morale 회복 자원 분배 결정. v6 측정 D+0에 시나리오 한도연 트랙 진입 권고.

### 6.3 결정 — R8-1

**baseline v6 측정 의존 유지.** M3 #10 5직업 Tier-2 abilities 트랙은 v6 측정 D+0 진입. baseline v6에서 homeless·engineer morale 시계열 probe 신규 추가 (밸런스 권지나).

---

## 7. 횡단 발견

### 7.1 baseline v5가 v4 대비 보여준 의외의 패턴

**K5 절망 +29 (113 → 142):**
- 4 hasFishing 직업 K3 +0.1~0.2d 연장으로 morale 침식 시간 확보 → 절망 사망 첫 등장 (homeless 3건, engineer 6건, pharmacist 23건)
- 사망 사유 다양화 자체는 게임 깊이 향상이지만 K1·K3 마지노선 미달 상태에서는 부산물에 불과

**K5 극도 피로 +6 (6 → 12):**
- pharmacist·homeless 신규 발생. day 5 도달 시 fatigue 누적 한계 초과
- v5 보고서 §5.1 분석: 생존 일수 연장의 부산물

### 7.2 actFish KPI 초과 달성 vs K1 미달 모순

- actFish 어획 누적 315/700 — KPI 목표 200 대비 158% 달성
- 그러나 K1 = 0% 유지
- **모순 해소:** actFish는 발동·어획 자체 KPI이고 K1은 생존 KPI. fishing 1회 영양 기댓값 ~3 < nutrition 일일 decay 36이라 actFish KPI 충족이 K1 5% 달성으로 직결되지 않음
- 즉 KPI 표가 *행동 KPI*(actFish 발동)와 *결과 KPI*(K1 생존)를 분리해야 함 — v6 KPI 표 갱신 권고

### 7.3 chef K3 변화 0의 정체성 보호 의미

chef는 PR9 변형 C-a에서 yongsan 이동 비용(TP 2 + grace 1일)으로 fishing 진입 동기 결여 → 게임 정체성 측면에서 "요리 특화 = fishing 비특화" 차별화가 자연 발생. 격차 보호 유리(+1.94d 사수)와 정체성 차별화가 동시에 충족됨. PR10 C 머지 후 chef K3가 게임 정체성(요리)으로 추가 향상되는 자연스러운 시나리오.

---

## 8. 결정 종합

| 안건 | 결정 |
|------|------|
| 1. PR10 진입 옵션 | **옵션 C 단독 채택** — `playerAI.mjs:185` benefit 산식 nutrition 차별 가중치 도입. PR11(옵션 A 25구 확대)은 baseline v6 측정 후 조건부 |
| 2. actCook 모순 가설 B 후속 | **게임 본체 cooking 자동 추천 검증 우선** — 시스템 백승호 + AD 오은별 위임. PR10 머지 선행 조건 |
| 3. R9-1 폴백 우선순위 | **PR11 옵션 2(25구 확대) → PR12 옵션 1(`baseCatchChance` 0.30 → 0.50)** 순서. 옵션 3(fish 영양 상향) 최후순위 |
| 4. R9-2 (chef PR9 효과 0) | **변경 보류** — chef 격차 보호 유리 결과. yongsan 이동 동기 트랙 진입 안 함 |
| R8-1 트랙 진입 시점 | **baseline v6 측정 D+0 시나리오 한도연 진입** — v6에서 morale 시계열 probe 신규 추가 |

### 8.1 PR10 단일 트랙 정의

**PR10 = "actCook 시뮬 산출물 우선순위 가중치 분리" 단일 트랙.** 영향 파일 1개(`tools/sim/v2/playerAI.mjs`). 코드 디테일(가중치 값·산식 형태)은 시스템 백승호 위임.

**선행 조건:** 안건 2 게임 본체 검증 결과 도착 (`SYS_VERIFY_cooking_autopick.md`).

---

## 9. 실행 계획

### 9.1 PR10 영향 파일 (옵션 C 단독)

| 파일 | 영역 | 담당 |
|------|------|------|
| `tools/sim/v2/playerAI.mjs:172-195` `actCook` | benefit 산식 nutrition 차별 가중치 (정확한 식은 시스템 위임) | 시스템 백승호 |
| `tools/sim/v2/runner.mjs` | 변경 없음 (산식만 변경, 호출 흐름 동일) | — |
| `js/data/gameBalance.js` | 변경 없음 (시뮬 로컬 산식이라 BALANCE 미관여) | — |

### 9.2 게임 본체 검증 트랙 (선행 조건)

| 파일/영역 | 검증 항목 | 담당 |
|----------|----------|------|
| `js/systems/CraftSystem.js` | 자동 추천 알고리즘 존재 여부 / 산식 위치 | 시스템 백승호 |
| `js/data/blueprints.js` + `blueprints_advanced.js` + `hiddenRecipes.js` | cooking 출력 우선순위 결정 코드 | 시스템 백승호 |
| cooking minigame UI (CSS·HTML·JS 경로 미확정 — 시스템이 식별) | player 산출물 선택 자유도 / hydration·nutrition 게이지 노출 | AD 오은별 |
| 산출물 | `SYS_VERIFY_cooking_autopick.md` | 시스템 백승호 + AD 오은별 |

### 9.3 데이터 영역 (PD/Balance 결정 가능 수치)

- 산식 변경 방향: **nutrition 차별 가중치 도입** (정확한 가중치 값은 시스템 위임)
- 측정 비교 기준: baseline v6 K1·K3 vs v5 (각 직업·각 mean)
- 시뮬 결정성: fingerprint `len316-h242a5b5f` 유지 (산식이 시뮬 로컬이라 BALANCE leaf 무관 — 단 fingerprint 변동 시 즉시 점검 의무)

### 9.4 검증 절차

1. **게임 본체 검증 트랙 완료** — `SYS_VERIFY_cooking_autopick.md` 도착 후 협의 재개
2. PR10 머지 방향 확정 (시나리오 α → 단일 PR / β → 시뮬 PR + 게임 본체 PR 2 트랙)
3. `node --input-type=module js/data/validate.js` — Errors 0
4. `node tools/sim/v2/run_baseline.mjs` — 700 runs / fingerprint `len316-h242a5b5f` 유지 / `BAL_SIM_baseline_v6_result.json` 생성 / buildTag `sim-baseline-v6-pr10`
5. probe: 7직업 actCook 산출물 분리 (boil/nut 비율) 측정 — KPI 표 영구 컬럼 추가
6. probe: baseline v6에서 R8-1 morale 시계열 (homeless·engineer day 1~3 morale 도달값) — 안건 3 R8-1 원인 단정

### 9.5 KPI 갱신 (baseline v6 목표값)

| KPI | baseline v5 | baseline v6 목표 | 폴백 트리거 |
|-----|-------------|------------------|-----------|
| K1 (100일 생존율) | 0.00% (전 직업) | ≥ 5% (4 hasFishing 직업 중 1직업 이상) | < 5% 시 PR11 옵션 2(25구 확대) 진입 |
| K3 chef | 5.20 | 5.5~6.5 (cooked_noodles 산출 증가) | 변화 없음 시 chef 정체성 자연 보호로 해석 |
| K3 pharmacist·doctor·homeless·engineer | 4.10 / 4.00 / 3.20 / 3.10 | +1~2d 추가 (각 5~6 / 5~6 / 4~5 / 4~5) | +0.5d 미달 시 PR11 옵션 2 진입 |
| actCook cookOut nutritionFood/boiledWater 비율 (5직업) | 14/200 (homeless) · 0/200 (다른 4직업) | ≥ 50% nutritionFood | 50% 미달 시 산식 가중치 재조정 |
| actFish 발동 | 315/700 | 유지 (v5 값) | 50% 감소 시 산식 변경의 actFish 회귀 검사 |
| K3 chef 격차 (정의 2) | +1.94d | +1.0~+2.0d 사수 | > +2.5d 시 cook_intuition 단축 즉시 PR |
| 직업 격차 (K1 max-min) | 0%p | ≤ 5%p | 5%p 초과 시 회귀 검사 발동 |
| R8-1 homeless·engineer morale 시계열 | 미측정 | day 1~3 morale 도달값 확보 | morale<30 도달 0회 → 원인 1(미도달) / 1회 이상 → 원인 2(자원 부재) |

---

## 10. 위험과 완화

### 10.1 게임 본체 검증 결과 늦어질 경우

**트리거:** `SYS_VERIFY_cooking_autopick.md` 도착이 baseline v5 측정 D+3 초과.
**완화:** PR10 머지 보류 자체는 비용 0(시뮬 로컬 변경). 단 M3 #10 시나리오 한도연 트랙은 baseline v6 의존이라 v3 협의서 결정 D+0부터 베이스라인 측정 lock 상태. 시스템 백승호가 D+3 안에 검증 산출물 도출 의무 — PD 김재훈이 일정 모니터링.

### 10.2 PR10 후 baseline v6에서도 K1 < 5% 유지 시

**트리거:** baseline v6 측정에서 K1 모든 직업 < 5%.
**폴백:** PR11 = 옵션 2(25구 lootTable raw food 확대) — 협의서 v1 옵션 A 패턴 25구 확대. `generateDistrictLoot()` scavenging skill 반영 검증 필수.
**폴백의 폴백:** PR12 = 옵션 1(`fishing.baseCatchChance` 0.30 → 0.50). 단일 상수 PR.

### 10.3 게임 본체에 시뮬과 다른 자동 추천 알고리즘 발견 시

**트리거:** `SYS_VERIFY_cooking_autopick.md` 결과 시나리오 β (게임 본체 boiled_water 우선 또는 무차별).
**완화:** PR10 트랙을 2개로 분리:
1. PR10a — 시뮬 산식 nutrition 차별 가중치 (밸런스 권지나)
2. PR10b — 게임 본체 자동 추천 nutrition 우선 도입 (시스템 백승호)
- 두 PR 머지 후 baseline v6 측정. PD 1 PR 1 트랙 원칙 정합 (2 PR 분리)

### 10.4 산식 변경으로 시뮬 fingerprint 변동 시

**트리거:** PR10 머지 후 `run_baseline.mjs` 출력 fingerprint가 `len316-h242a5b5f`에서 변경.
**원인 후보:** 산식 변경이 BALANCE leaf 트리와 격리됐는지 검증 누락. 또는 `gameBalance.js`도 변경됨.
**완화:** 시스템 백승호가 PR10 PR 생성 시 fingerprint 검증 의무. BALANCE 미변경 검증 100% 통과 후 머지.

### 10.5 actCook 산식 보강이 chef K3 5.2 자연 향상으로 격차 +2.5d 초과 위험

**트리거:** baseline v6에서 chef K3 6.0+로 향상, 5직업 K3 4.0~5.0으로 동시 향상되지만 chef 향상 폭이 더 클 경우.
**완화:** 협의서 v2 §6.2 트리거(+2.5d) 그대로 적용. 즉시 `cook_intuition days = 7 → 5` 단일 상수 PR(PR13 또는 PR11.5). PR10 머지 후 모니터링 의무 — 밸런스 권지나.

### 10.6 needs-aware 산식 채택 시 GameState 의존 추가 영향

**트리거:** 시스템 백승호가 산식 후보 중 needs-aware 채택 시 `actCook`이 `GameState.player.nutrition.current` 등 참조 추가.
**완화:** GameState 참조 자체는 결정성 영향 0 (run-deterministic). 단 mock 환경 검증 의무 — `tools/sim/v2/systemBootstrap.mjs` mock에서 player.nutrition 객체 노출 보장.

---

## 11. 다음 단계

| 순위 | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | 게임 본체 cooking 자동 추천 검증 (`SYS_VERIFY_cooking_autopick.md`) | 시스템 백승호 + AD 오은별 | 본 협의서 결정 직후 |
| **2** | PR10 옵션 C 구현 — `playerAI.mjs:185` benefit 산식 nutrition 차별 가중치 (산식 형태는 검증 결과 따라) | 시스템 백승호 | `SYS_VERIFY_cooking_autopick.md` 도착 후 |
| 3 | validate.js + fingerprint 회귀 검증 | 시스템 백승호 | PR10 PR 생성 시 |
| 4 | baseline v6 측정 및 보고 (`BAL_SIM_baseline_v6_report.md`) — actCook 산출물 boil/nut 분리 + R8-1 morale 시계열 probe 신규 | 밸런스 권지나 | PR10 머지 D+1 |
| 5 | baseline v6 결과로 PR11 옵션 2(25구 확대) 진입 / chef 격차 / R8-1 원인 단정 판단 | PD 김재훈 + 밸런스 권지나 | baseline v6 보고 D+0 |
| 6 | (조건부) PR11 — 옵션 2 25구 lootTable raw food 확대 + scavenging skill 반영 검증 | 시스템 백승호 또는 밸런스 권지나 | baseline v6 보고 후 결정 시 |
| 7 | M3 #10 5직업 Tier-2 abilities — homeless·engineer morale 회복 자원 분배 (R8-1) | 시나리오 한도연 | baseline v6 측정 D+0 |
| 8 | (조건부) PR12 — `fishing.baseCatchChance` 0.30 → 0.50 | 밸런스 권지나 | baseline v7 측정에서 K1 < 5% 유지 시 |

**머지 순서 (PD 원칙: 측정 도구 → 데이터 → 메커닉 → 시각 → 밸런스 튜닝):**
1. 게임 본체 검증 → 2. PR10 (시뮬 측정 도구 정합화) → 3. baseline v6 → 4. (필요 시) PR11 데이터 (25구 확대) → 5. (필요 시) PR12 밸런스 튜닝 (baseCatchChance)

---

*문서 끝. `SYS_VERIFY_cooking_autopick.md` 도착 시 본 문서 §2.5 PR10 머지 방향 확정 + §3.5 시나리오 α/β 단정. — 2026-05-11 충족. 갱신 사항은 §12 보강 회의록.*

---

## 12. 보강 회의록 (2026-05-11, PR10 구현 직후)

> 참여: PD 김재훈 + 밸런스 권지나. 입력: `SYS_VERIFY_cooking_autopick.md` (시스템 백승호) + `AD_VERIFY_cooking_ui.md` (AD 오은별) + baseline v6 측정 결과 (`BAL_SIM_baseline_v6_result.json`, fingerprint `len316-h242a5b5f` 유지).

### 12.1 시나리오 γ 신규 단정 — α/β 양분 폐기

본 협의서 §3.2가 정의한 α (본체 nutrition 우선) / β (본체도 결함) 양분은 **사실 조건이 성립하지 않음**. 시스템 백승호 검증(`SYS_VERIFY_cooking_autopick.md` §2~§5)으로 게임 본체에 cooking 자동 추천 알고리즘 자체가 부재함을 단정. player가 `CraftUI._selectedBp`(line 105~125) 클릭 또는 `QuickCraftPrompt` 버튼(line 62~70)으로 명시적 선택. priority/order/weight 필드 3 데이터 파일 0 매칭.

**시나리오 γ 단정 결과:**
- 시뮬 `actCook`(`tools/sim/v2/playerAI.mjs:172-201`)은 본체와 1:1 정합 PR이 아닌 **이상적 player 행동 대리 추정 모델**
- baseline v6 K1·K3 값은 *시뮬 player가 needs-aware로 행동했을 때의 100일 생존율 추정*으로 해석. 본체 실제 player 행동 K1과의 매핑은 별도 텔레메트리 트랙(M4+) 필요
- PR10은 시뮬 단일 트랙으로 머지. 본체 PR 분리 트랙 불요

### 12.2 §10.6 GameState 경로 정정

본 협의서 §10.6은 `GameState.player.nutrition`으로 표기했으나 PR10 구현 과정에서 실제 GameState 구조가 `GameState.stats.nutrition.current` / `GameState.stats.nutrition.max`임이 확인됨. 시스템 백승호 PR10 코드는 실측 기반 정정 사용. **본 협의서 §10.6은 정정 사용 권고** (본문 수정 안 함, 기록 보존).

### 12.3 §9.5 KPI 재정의 — cook_noodles blueprint 잠금 반영

baseline v6 측정 결과(`tmp/probe_v6_cookout.mjs` 5직업 boil/nut 비율):

| 직업 | cookingLv | v5 boil/nut | v6 boil/nut | nut% v5→v6 |
|------|-----------|-------------|-------------|------------|
| doctor | 0 | 100/0 | 100/0 | 0% → 0% |
| soldier | 0 | 138/0 | 138/0 | 0% → 0% |
| firefighter | 0 | 200/0 | 200/0 | 0% → 0% |
| **homeless** | **3** | 200/14 | **200/109** | **6.5% → 35.3%** |
| engineer | 0 | 200/0 | 200/0 | 0% → 0% |

**부분 달성.** homeless(cooking lv 3) nutritionFood +95건. 그러나 cooking lv 0 4직업(doctor·soldier·firefighter·engineer)은 변화 0 — `cook_noodles` blueprint가 `requiredSkills.cooking: 1` 잠금이라 시스템적으로 boiled_water만 가능 (`SYS_VERIFY_cooking_autopick.md` §3.3 단정).

**§9.5 KPI 재정의:**
- 기존: "5직업 ≥50% nutritionFood" — **산식 변경만으로 도달 불가** 단정
- 정정: **"cooking lv ≥1 직업 ≥50% nutritionFood"** (chef·pharmacist·homeless 3 직업 적용)
- 신규 KPI: "cooking lv 0 4직업 nutritionFood 산출 경로 — interactions.js T1 시뮬 모사 보강 트랙으로 분리 (M4+ 또는 M3 #14 신규)"

PR10 산식 영역의 책임 경계 밖. cooking lv 0 직업의 cooked_noodles 산출은 game 본체에서 `interactions.js` T1 변환 규칙으로 처리되지만 시뮬은 이를 모사하지 않음 (`tools/sim/v2/playerAI.mjs`에 T1 모사 부재).

### 12.4 AD 오은별 UI 검증 결과 반영

`AD_VERIFY_cooking_ui.md` (420줄) §5 종합 판단:

| 검증 항목 | 결과 | UI 변경 권고 |
|----------|------|------------|
| 1. interactions.js hover hint 영양/수분 수치 노출 | **부족** (cooking 8건 모두 이름만) | (高) hint에 영양/수분 수치 합성 |
| 2. CraftUI._renderOutputPreview 비교 부하 | **일부 부족** (동시 비교 UI 부재 + DESIGN.md `--stat-*` 토큰 미적용) | (中) 산출물 동시 비교 모드 추가 |
| 3. 사이드바 hydration·nutrition 게이지 안내 | **충분** (3단 임계 + critical-alert) | 변경 불요 |

**UI 변경 권고 2건은 PR10 머지 차단 아님.** needs-aware 산식과 사이드바 게이지 임계 경고(`StatRenderer.js:181~198`)가 정합 — 시뮬-UI-player 행동 3자 정합 가능. UI 권고 2건은 별도 트랙(AD 오은별 영역) 진입 권고. 단순 가중치·nutrition-floor는 UI 안내 모델과 불일치라 needs-aware 채택 강화 근거.

### 12.5 PR10 산식 채택 단정 — needs-aware

시스템 백승호 PR10 구현 (`tools/sim/v2/playerAI.mjs:172-201`):
```js
const needsNutrition = nutCur < nutMax * 0.5;
const benefit = needsNutrition ? (n * 3 + h) : (n + h * 1.5);
```

**검증 결과:**
- validate.js Errors 0 / Warnings 254 / ALL CLEAR (게임 본체 미관여)
- baseline v6 (700 runs / 7.9s) — fingerprint `len316-h242a5b5f` 유지. BALANCE 미변경 단정 확정
- 결정성 100% (두 번째 재실행 K3/K5/fingerprint 동일)
- chef·pharmacist 회귀 0 (cooked_noodles 산출 비율 유지)
- bootstrapErrors 0/700

### 12.6 K3 변화 — PR10 직접 효과 단정

| 직업 | v5 K3 | v6 K3 | Δv5→v6 | 원인 |
|------|-------|-------|--------|------|
| doctor | 4.00 | 4.00 | 0 | cooking lv 0 → boiled_water 잠금 유지 |
| soldier | 3.00 | 3.00 | 0 | 동일 |
| firefighter | 3.00 | 3.00 | 0 | 동일 |
| **homeless** | **3.20** | **4.10** | **+0.90** | **cooking lv 3 → cooked_noodles 35.3% 산출** |
| chef | 5.20 | 5.20 | 0 | 회귀 검증 통과 |
| engineer | 3.10 | 3.10 | 0 | cooking lv 0 잠금 유지 |
| pharmacist | 4.10 | 4.10 | 0 | 회귀 검증 통과 |

**핵심 단정:**
- PR10 직접 효과는 **homeless 단독 측정 가능** (+0.90d). cooking lv 3 직업이 `cook_noodles` blueprint(`requiredSkills.cooking: 1`) 통과 + needs-aware 산식 정합 결과
- cooking lv 0 4직업(doctor·soldier·firefighter·engineer)은 산식 변경 무효과 — blueprint 잠금이 일차 제약
- K1 7직업 모두 0% 유지 (변화 0). homeless K3 +0.90d는 day 4까지 연장 효과로 day 100 도달 미보장

**§12.3 정정 KPI 기준 통과 여부:**
- "cooking lv ≥1 직업 ≥50% nutritionFood": chef 100% / pharmacist 100% / homeless 35.3% — **2/3 달성, homeless 미달**
- homeless 35.3% 미달은 cooking lv 3 직업의 needs-aware 분기 발동 시간 부족(day 3~4 사망 회차 비율 87% 잔존). 추가 향상은 R9-1 폴백(PR11) 필요

### 12.7 K5 변화 단정

```
v5 → v6
아사    532 → 510 (-22) — homeless·pharmacist nutrition 보강 효과
절망    142 → 167 (+25) — 사망일 연장 부산물 (homeless·engineer·doctor 회차)
탈수    14  → 14  (0)  — 변화 없음
극도피로 12  → 9   (-3) — homeless 생존 day 4 도달로 절망 사망 우선 발생
```

**K5 절망 +25 위험 등록 (R10-1 신규):** 사망일 연장이 morale 침식으로 절망 사망 증가에 기여. R8-1(homeless·engineer actBoostMorale 0%)과 결합 시 R8-1 트랙 진입(M3 #10 시나리오 한도연) 우선순위 상향.

### 12.8 §11 다음 단계 갱신

기존 §11 표에 신규 항목 추가:

| 순위 (갱신) | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **2.5 신규** | PR10 머지 — needs-aware 산식 (`playerAI.mjs:172-201`). PR body에 시나리오 γ 단정 + "본체 정합화 아닌 추정 모델" 4개 항 명시 | 시스템 백승호 (구현 완료, 머지 대기) | 본 보강 회의록 채택 직후 |
| **4 갱신** | baseline v6 정식 보고서 작성 — `BAL_SIM_baseline_v6_report.md` (§12.6 K3·§12.7 K5 단정 인용 + R10-1 등록) | 밸런스 권지나 | 본 보강 회의록 채택 직후 |
| **신규 (M3 #14 후보)** | interactions.js T1 시뮬 모사 보강 — cooking lv 0 4직업이 cook_noodles 산출 경로 (게임 본체에서는 T1 변환으로 처리) 시뮬 추가 | 시스템 백승호 | baseline v6 보고 + PR11 결정 후 |
| **신규 (AD 트랙)** | interactions.js hint 영양/수분 수치 합성 + CraftUI 산출물 동시 비교 모드 | AD 오은별 | UI 권고 2건 분리 트랙 진입 결정 시 |
| **신규 (R10-1)** | morale 침식 / 절망 사망 +25 위험 — R8-1 트랙(M3 #10) 우선순위 상향 | 시나리오 한도연 | baseline v6 보고 D+0 |

### 12.9 결정 종합 — 보강

| 안건 | 보강 결정 |
|------|---------|
| §2.5 PR10 머지 선행 조건 | **충족** (시스템 백승호 검증 도착) |
| §3.2 시나리오 α/β | **폐기** — 시나리오 γ 신규 단정 |
| §9.5 KPI "5직업 ≥50%" | **재정의** — "cooking lv ≥1 직업 ≥50%". cooking lv 0 4직업은 interactions.js T1 시뮬 모사 트랙으로 별도 분리 |
| §10.6 GameState 경로 | **정정** — `player.nutrition` → `stats.nutrition`. PR10 코드는 실측 기반 정정 사용 |
| AD UI 권고 2건 | **분리 트랙** — PR10 머지 차단 아님. AD 오은별 영역 |
| R10-1 (신규) 절망 사망 +25 | **R8-1 트랙(M3 #10) 우선순위 상향** |

본 보강은 본 협의서의 결정 권한 안에서 처리. 별도 협의서 v4 발행 불요.

---

*보강 회의록 끝. baseline v6 정식 보고서 도착 시 본 §12.6·§12.7 인용 정합 확인 의무.*

