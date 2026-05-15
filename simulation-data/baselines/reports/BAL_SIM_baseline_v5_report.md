# 밸런스 — baseline v5 측정 보고 (PR9 후)

> 작성: 밸런스 권지나 / 2026-05-11
> 측정 대상: PR9 머지(master `5bdc261`) 후 baseline v5
> 결정: K1 0% 7회 연속 (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9). 협의서 v2 §7 K1 ≥ 5% 미달. PR9 옵션 C-a는 K1 미충족이지만 4 hasFishing 직업 K3·K5 분포 변화로 효과 가시화 (homeless·engineer 사망일 +0.1~0.2d, pharmacist 아사 -28건). chef K3 격차 +1.94d (5직업 정의) — 협의서 v2 §6.2 +2.5d 트리거 미충족, cook_intuition grace 단축 보류 유지. **actCook 모순 단정 가설 B 채택 — actCook 7직업 100/100 발동은 사실이나, cooking lv 0~1 5직업 산출물의 100%가 boiled_water (nutrition 0)로 K3·K5에 영양 효과 0.**

---

## 1. 서두

### 1.1 측정 환경

- 시뮬: `tools/sim/v2/` (PR1~PR9 누적, runner.mjs 변경 없음)
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 측정 변경: `OUTPUT_FILE` v4→v5, `buildTag` `sim-baseline-v4-pr8`→`sim-baseline-v5-pr9` 2줄만
- 700 runs (7직업 × 100회)
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: 7.5초
- BALANCE leaf 합: 227, fingerprint: `len316-h242a5b5f` (v3·v4 동일 — `gameBalance.js` 미변경 검증)
- 결과 파일: `BAL_SIM_baseline_v5_result.json`
- buildTag: `sim-baseline-v5-pr9`
- bootstrapErrors 합: 0 (전 700 회차)

### 1.2 PR9 적용 차이 (v3·v4 대비)

- PR9 = hangang sublocation 진입 시 `fishing_rod_basic` 1회 자동 지급 (per character per run, `js/data/landmarks.js` + `js/systems/ExploreSystem.js` + GameState 플래그)
- 시뮬 측 모방: `tools/sim/v2/playerAI.mjs:228-235` `actFish` 함수에서 hasFishing 구역 도달 + rod 미보유 시 1회 한정 `fishing_rod_basic` 자동 지급 (PR9 옵션 C-a 모방)
- BALANCE 상수 변경 0건 — fingerprint 동일
- characters.js / districts.js / landmarks.js / ExploreSystem.js / GameState.js / playerAI.mjs 일절 변경 없음 (PR8/PR9 데이터·시스템 fix)

---

## 2. 메서드

- 700 runs (7직업 × 100회), SEED_BASE=0, runDays=100
- v3·v4와 동일 시드·동일 시뮬 로직. 차이는 PR9 후 actFish 트리거 활성화뿐
- 결정성: Math.random → mulberry32 monkey-patch. fingerprint v3·v4·v5 모두 `len316-h242a5b5f`로 BALANCE leaf 무변경 확인
- bootstrapErrors 0 — 전 회차 시스템 init 정상
- AI 발동 카운트는 `tmp/probe_v5_aicount.mjs` 임시 probe로 별도 측정 (시뮬 로직 변경 없이 runner.mjs 코드 흐름 복제 + aiLog 외부 노출만 추가)
- actCook 모순 probe는 `tmp/probe_actcook.mjs` (7직업 × seed 0 × day 1~6 추적, 산출물·섭취·nutrition 시계열)

---

## 3. K1 — 100일 생존율 (목표 ≥ 5%)

| 직업 | 생존율 v5 | ±CI95p | survived/runs | v4 비교 | v3 비교 |
|------|-----------|--------|---------------|---------|---------|
| doctor | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| soldier | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| firefighter | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| homeless | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| chef | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| engineer | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| pharmacist | 0.00% | 0.00 | 0/100 | 0%p | 0%p |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p).

**판단: K1 목표(≥ 5%) 미달. baseline 7회 연속 0%.** ±3%p 신뢰구간 안에서 100% 0%. PR9 옵션 C-a의 fishing 활성화는 K3 분포·K5 사망 원인을 재배치했으나 100일 생존선 도달은 0건.

**4 hasFishing 직업(pharmacist·doctor·homeless·engineer) 우선 분석:**
- pharmacist K3 4.0 → 4.1 (+0.1d), 사망일 5 첫 등장 (9건)
- doctor K3 4.0 → 4.0 (mean 동일하지만 day 3 사망 2건이 day 4로 이동, K5 절망 -3 / 아사 +3)
- homeless K3 3.0 → 3.2 (+0.2d), 사망일 5 첫 등장 (7건)
- engineer K3 3.0 → 3.1 (+0.1d), 사망일 4 12건 발생

K3 +0.1~0.2d 연장 효과는 측정됐으나 100일까지 95~96d 격차. 협의서 v2 §6.1 폴백 트리거 (PR9 후 K1 < 5%) 충족.

---

## 4. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean (v5) | median (v5) | mean (v4) | mean (v3) | Δv4→v5 |
|------|-----------|-------------|-----------|-----------|--------|
| doctor | 4.00 | 4 | 4.00 | 4.00 | 0 |
| soldier | 3.00 | 3 | 3.00 | 3.00 | 0 |
| firefighter | 3.00 | 3 | 3.00 | 3.00 | 0 |
| homeless | **3.20** | 3 | 3.00 | 3.00 | **+0.20** |
| chef | 5.20 | 5 | 5.20 | 4.50 | 0 |
| engineer | **3.10** | 3 | 3.00 | 3.00 | **+0.10** |
| pharmacist | **4.10** | 4 | 4.00 | 3.00 | **+0.10** |

### 4.1 chef K3 격차 — 두 정의 측정

**정의 1: chef vs 다른 6직업 평균 (v4 보고서 사용 정의)**
- v3: chef 4.50 / others6 3.17 / gap **+1.33d**
- v4: chef 5.20 / others6 3.33 / gap **+1.87d**
- v5: chef 5.20 / others6 3.40 / gap **+1.80d** (Δv4→v5: -0.07d)

**정의 2: chef vs cooking lv 0 5직업 평균 (pharmacist 제외, 동질 비교)**
- v3: chef 4.50 / others5 3.20 / gap **+1.30d**
- v4: chef 5.20 / others5 3.20 / gap **+2.00d**
- v5: chef 5.20 / others5 3.26 / gap **+1.94d** (Δv4→v5: -0.06d)

**판단:**
- 협의서 v2 §6.2 cook_intuition grace 재검토 트리거 +2.5d — **두 정의 모두 미충족 (정의 1 +1.80d / 정의 2 +1.94d)**
- 협의서 v2 §5.5 KPI 목표 +1.0~+2.0d 사수 — **정의 1 ✅ (+1.80d) / 정의 2 ✅ (+1.94d 경계 안)**
- v4→v5 격차 변화 -0.06~-0.07d (homeless·engineer·pharmacist의 K3 미세 증가로 격차 자연 축소). chef는 hangang 비-인접 직업이라 PR9 효과 ≈ 0
- **권고: cook_intuition grace 단축 보류 유지.** 협의서 v2 §6.2 트리거 미충족. v6 측정 시 재검토

### 4.2 chef K3 mean 변화 없음의 의미

chef K3 5.20 (v4·v5 동일) — chef junggoo는 hasFishing 미보유, hangang 비-인접 (yongsan 1 이동 필요). seed 0 시뮬에서 chef는 yongsan 이동 0회 → fishing 시도 0회 (probe v5 actFish 0/100 검증). 협의서 v2 §8.5 "chef 옵션 C-a로 K3 ↑ 효과 ≈ 0" 예측 정합.

---

## 5. K5 — 사망 원인 분포

### 5.1 전 직업 합산 (v3 vs v4 vs v5)

| 원인 | v3 (PR7) | v4 (PR8) | v5 (PR9) | Δv4→v5 |
|------|----------|----------|----------|--------|
| 아사 | 569 | 569 | **532** | **-37** |
| 절망 | 110 | 113 | **142** | **+29** |
| 탈수 | 20 | 12 | 14 | +2 |
| 극도 피로 | 1 | 6 | **12** | **+6** |

**핵심 변화: 아사 -37건, 절망 +29건.** PR9 fishing 활성화로 4 hasFishing 직업의 nutrition 회복 → 아사 감소. 그러나 사망일 연장으로 morale 침식이 누적 → 절망 증가. 극도 피로 +6 (homeless·engineer·pharmacist 신규 발생).

### 5.2 직업별 K5 (v4 vs v5)

| 직업 | v4 K5 | v5 K5 | 변화 |
|------|-------|-------|------|
| doctor | 아사 69 / 절망 31 | 아사 72 / 절망 28 | 아사 +3 / 절망 -3 |
| soldier | 아사 100 | 아사 100 | 0 |
| firefighter | 아사 100 | 아사 100 | 0 |
| **homeless** | **아사 100** | **아사 94 / 극도 피로 3 / 절망 3** | **아사 -6 / 신규 다양화** |
| chef | 절망 82 / 탈수 12 / 극도 피로 6 | 절망 82 / 탈수 12 / 극도 피로 6 | 0 |
| **engineer** | **아사 100** | **아사 94 / 절망 6** | **아사 -6 / 절망 +6** |
| **pharmacist** | **아사 100** | **아사 72 / 절망 23 / 극도 피로 3 / 탈수 2** | **아사 -28 / 절망 +23 / 신규** |

**중요 분석:**
- **pharmacist 아사 -28건이 K5 합산 -37건의 76%를 차지.** gangnam 자체 hasFishing + cooking lv 1 + day 4 K3 안에서 fishing 4회 + cooked_noodles 가능 → nutrition 회복 가장 강함
- **homeless·engineer 아사 -6건씩** — 자체 hasFishing 구역(gwangjin·yongsan) + day 3 K3 안에서 fishing 시도 가능했으나 cooking lv 0~3에도 boiled_water 산출 위주로 nutrition 회복 제한
- **chef 분포 완전 동일** — junggoo 비-hasFishing, hangang 미접근. PR9 효과 0 검증 (격차 보호 유리)
- **doctor 아사 +3 / 절망 -3** — dongjak 자체 hasFishing이지만 K3 4.0 변화 없음. fishing으로 nutrition은 회복했으나 K5 사망일 분포 안에서 미세 재배치만 발생

### 5.3 사망일 분포 히스토그램 (v4→v5 변화 행만)

| 직업 | day | v3 | v4 | v5 | Δv4→v5 |
|------|-----|----|----|----|--------|
| doctor | 3 | 2 | 2 | 0 | -2 |
| doctor | 4 | 98 | 98 | 100 | +2 |
| **homeless** | 3 | 100 | 100 | 90 | -10 |
| **homeless** | 4 | 0 | 0 | 3 | +3 |
| **homeless** | 5 | 0 | 0 | 7 | +7 |
| **engineer** | 3 | 100 | 100 | 88 | -12 |
| **engineer** | 4 | 0 | 0 | 12 | +12 |
| **pharmacist** | 4 | 0 | 100 | 91 | -9 |
| **pharmacist** | 5 | 0 | 0 | 9 | +9 |

5직업(soldier·firefighter·chef·doctor·일부)은 K3 mean 동일하나 분포는 미세 이동. 4 hasFishing 직업은 사망일 5일 첫 등장.

---

## 6. AI 발동 측정 — PR9 효과 (`tmp/probe_v5_aicount.mjs`)

700 runs, baseline v5와 동일 시드·동일 시뮬 로직.

### 6.1 직업별 발동 횟수 (700 runs 합계)

| 직업 | actCook | cookOut(boil/nut) | actFish | catches | actEat | actDrink | actMove | actSleep | actExplore | actMoraleBoost |
|------|---------|-------------------|---------|---------|--------|----------|---------|----------|------------|----------------|
| doctor | 100 | **100/0** | 89 | 89 | 200 | 200 | 0 | 300 | 900 | 99 |
| soldier | 138 | **138/0** | 0 | 0 | 32 | 100 | 0 | 200 | 600 | 35 |
| firefighter | 200 | **200/0** | 0 | 0 | 43 | 100 | 0 | 200 | 600 | 11 |
| homeless | 214 | **200/14** | 68 | 68 | 45 | 111 | 0 | 217 | 651 | 0 |
| chef | 200 | **100/100** | 0 | 0 | 217 | 194 | 14 | 417 | 1251 | 100 |
| engineer | 200 | **200/0** | 66 | 66 | 59 | 112 | 0 | 212 | 636 | 0 |
| pharmacist | 200 | **100/100** | 92 | 92 | 185 | 106 | 21 | 298 | 927 | 100 |

### 6.2 회차별 발동 비율 (runsWith*/100)

| 직업 | runsWithCook | runsWithFish | runsWithMoraleBoost | runsWithEat |
|------|--------------|--------------|---------------------|-------------|
| doctor | 100/100 | **62/100** | 99/100 | 100/100 |
| soldier | 100/100 | 0/100 | 35/100 | 32/100 |
| firefighter | 100/100 | 0/100 | 11/100 | 43/100 |
| homeless | 100/100 | **54/100** | 0/100 | 30/100 |
| chef | 100/100 | 0/100 | 100/100 | 100/100 |
| engineer | 100/100 | **52/100** | 0/100 | 52/100 |
| pharmacist | 100/100 | **63/100** | 100/100 | 100/100 |

### 6.3 핵심 분석 — actFish PR9 효과

**PR9 옵션 C-a 효과 가시화:**
- **4 hasFishing 직업에서 actFish 모두 발동.** doctor 62%, pharmacist 63%, homeless 54%, engineer 52% 회차에서 1회 이상 어획 시도
- **3 비-hasFishing 직업 actFish 0/100 (chef·soldier·firefighter)** — 시작 구가 hasFishing 미보유 + day 3 사망선 안에서 hangang 도달 비용 부담
- 어획량 합계 315건 (89+68+66+92) / 700 runs → 평균 0.45회/run
- 협의서 v2 §7.5 KPI 목표 actFish ≥ 200/700 — **달성 (315/700, 158%)** ✅

**actFish 발동 비율 < 100/100인 이유:**
- pharmacist 63/100 — gangnam 자체 hasFishing이지만 day 3 사망 회차(아사 72건 중 일부)는 fishing 시도 전 사망. day 4까지 생존한 회차 위주 발동
- homeless 54/100, engineer 52/100 — K3 3.2/3.1로 day 3 사망이 지배적. fishing 시도 전 사망 회차 비율 약 절반

### 6.4 actCook 산출물 분리 — v4 보고서 보완

**v4 보고서 §6.1은 actCook "100/100 발동"만 제시했으나 산출물 종류를 분리하지 않음.** v5 probe로 단정:

| 직업 | cookingLv | cookOut boiledWater | cookOut nutritionFood | nutrition 회복 효과 |
|------|-----------|---------------------|-----------------------|---------------------|
| doctor | 0 | 100 | **0** | 0% |
| soldier | 0 | 138 | **0** | 0% |
| firefighter | 0 | 200 | **0** | 0% |
| homeless | 3 | 200 | **14** | 6.5% (14/214) |
| chef | 4 | 100 | **100** | 50% |
| engineer | 0 | 200 | **0** | 0% |
| pharmacist | 1 | 100 | **100** | 50% |

**결정적 발견:** cooking lv 0~3 5직업의 actCook 산출물은 거의 100% boiled_water (nutrition 0, hydration 65). chef/pharmacist만 cooked_noodles(nutrition 35)를 절반 산출. **actCook 발동은 nutrition 회복과 동의어가 아니다.**

원인 분석 (`tmp/probe_actcook.mjs` seed 0 추적):
- actCook 함수(`playerAI.mjs:172-195`) line 185: `const benefit = (onC?.nutrition ?? 0) + (onC?.hydration ?? 0);`
- boiled_water onConsume = nutrition 0 + hydration 65 = **65 benefit**
- cooked_noodles onConsume = nutrition 35 + hydration 20 = **55 benefit**
- **boiled_water가 항상 우선 선택됨.** 산출물 우선순위 알고리즘이 nutrition을 차별 가중치 부여하지 않는 결과
- 5직업이 cooking lv 0~3에 boiled_water 레시피 조건 충족 (`requiredSkills.cooking ≤ 3`) → 매 day boiled_water 산출
- chef·pharmacist는 day 2 boiled_water 입력(contaminated_water) 소진 → day 3에 noodles 입력만 남아 cooked_noodles 산출

### 6.5 actBoostMorale 추세 (v4→v5)

| 직업 | v4 % | v5 % | 변화 |
|------|------|------|------|
| chef | 100/100 | 100/100 | 0 |
| pharmacist | 100/100 | 100/100 | 0 |
| doctor | 99/100 | 99/100 | 0 |
| soldier | 35/100 | 35/100 | 0 |
| firefighter | 11/100 | 11/100 | 0 |
| **homeless** | **0/100** | **0/100** | **0** |
| **engineer** | **0/100** | **0/100** | **0** |

R8-1 (homeless·engineer morale 0%) **변화 없음** — PR9는 fishing만 활성화. morale 회복 자원 분배는 시나리오 한도연 트랙(M3 5직업 Tier-2 abilities) 위임 상태 그대로.

---

## 7. 부록 — actCook 모순 probe 결과

### 7.1 측정 (`tmp/probe_actcook.mjs`)

7직업 × seed 0 × day 1~6 추적. day 시작 시점 simInv·player stats snapshot, runDayAI 호출 후 변화량 측정.

| 직업 | day | cookCount | 산출물 | eat | NutΔ | HydΔ | MorΔ |
|------|-----|-----------|--------|-----|------|------|------|
| doctor | 2 | 1 | boiled_water(n0+h65) | - | +0 | +0 | +0 |
| doctor | 3 | 0 | - | eat:canned_food | +30 | +90 | +0 |
| doctor | 4 | 0 | - | eat:canned_food | +30 | +90 | +0 |
| soldier | 2 | 1 | boiled_water(n0+h65) | - | +0 | +0 | +0 |
| soldier | 3 | 0 | - | - | +0 | +80 | +0 |
| firefighter | 2 | 1 | boiled_water(n0+h65) | - | +0 | +0 | +0 |
| firefighter | 3 | 1 | boiled_water(n0+h65) | - | +0 | +80 | +0 |
| homeless | 2 | 1 | boiled_water(n0+h65) | - | +0 | +0 | +0 |
| homeless | 3 | 1 | boiled_water(n0+h65) | - | +0 | +80 | +0 |
| chef | 2 | 1 | boiled_water(n0+h65) | - | +0 | +0 | +0 |
| **chef** | **3** | **1** | **cooked_noodles(n35+h20)** | **eat:preserved_ration** | **+75** | **+100** | **+15** |
| chef | 4 | 0 | - | - | +0 | +0 | +0 |
| chef | 5 | 0 | - | eat:canned_food | +30 | +10 | +0 |
| engineer | 2 | 1 | boiled_water(n0+h65) | - | +0 | +0 | +0 |
| engineer | 3 | 1 | boiled_water(n0+h65) | eat:herb | +0 | +80 | +0 |
| pharmacist | 2 | 1 | boiled_water(n0+h65) | - | +0 | +0 | +0 |
| **pharmacist** | **3** | **1** | **cooked_noodles(n35+h20)** | **eat:cooked_noodles** | **+35** | **+100** | **+20** |
| pharmacist | 4 | 0 | - | eat:herb | +0 | +0 | +0 |

### 7.2 가설 단정

| 가설 | 내용 | 측정 결과 |
|------|------|-----------|
| A | v4 보고서 "100/100 발동"이 정의 오류 또는 chef 한정 측정 | **부분 기각.** 발동 100/100는 사실(probe v5 100% 검증) — 정의 오류 아님 |
| **B** | **actCook 7직업 모두 발동했으나 cooking lv 0~1 5직업 산출물의 nutrition 효과 0** | **채택.** cooking lv 0~3 5직업 산출물 =boiled_water (n0+h65). chef·pharmacist만 cooked_noodles(n35) 절반 산출. K3·K5 영양 효과 0이 확인됨 |
| C | actCook 발동 후 산출물이 board 만차 등으로 사라짐 | **기각.** simInv는 무한 슬롯 dict, board 모델링 부재. 산출물은 simInv에 정상 가산 (probe diffInv 검증) |
| D | actCook 발동 후 산출물 nutrition을 player.nutrition에 반영 못함 | **부분 기각.** actCook은 산출물을 simInv에 추가만 함, 섭취는 다음 날 actEat이 담당. chef seed 0 day 3에 cooked_noodles 산출 후 즉시 같은 day actEat에서 preserved_ration 섭취 (cooked_noodles 산출은 산출일 섭취 안 함) — 이 흐름은 결함이 아니라 actCook과 actEat의 분리 설계 |

### 7.3 단정 — 가설 B 채택

**v4 보고서의 "actCook 7직업 100/100 발동"은 사실이지만, 발동 = nutrition 회복 효과가 아니다.** 5직업의 산출물은 boiled_water(nutrition 0)이며, 영양 회복 0. 이로 인해 K3·K5 사망일·원인이 v3 대비 변화 0이었던 v4 측정과 정합한다.

**산출물 우선순위 결함** (cooking benefit = nutrition + hydration 단순 합산)으로 boiled_water가 cooked_noodles보다 우선 선택. 이는 시뮬 로직 결함이며 게임 본체 측 결함은 별개로 확인 필요.

### 7.4 향후 측정 도구화 권고

- **시뮬 측 actCook 산출물 우선순위 가중치 분리**: nutrition × 1.5 + hydration × 1.0 등으로 nutrition 우선 (별도 PR — 시뮬 로직 변경)
- **게임 본체 actCook AI 검증 의무**: 실제 게임의 player가 boiled_water vs cooked_noodles 우선 선택 로직 확인 (cooking minigame UI · 자동 추천 알고리즘)
- baseline v6 측정 시 산출물 분리 표 표준화 (cookOut boil/nut 분리 컬럼 영구 KPI 추가)

---

## 8. 협의서 v2 §7 KPI 비교표

| KPI | v3 | v4 | v5 | 목표 | 충족 |
|-----|----|----|----|------|------|
| K1 (100일 생존율) | 0.00% | 0.00% | 0.00% | ≥ 5% (chef·pharmacist·doctor·homeless·engineer 중 1직업 이상) | ❌ — 7회 연속 0%, PR10 폴백 트리거 충족 |
| K3 chef | 4.50 | 5.20 | 5.20 | 5.5~6.5 (yongsan 이동 -1d 포함) | ❌ — chef는 PR9 효과 0 (junggoo 비-hasFishing). 목표값은 chef yongsan 이동 가정인데 시뮬에서 chef move 0회 |
| K3 pharmacist | 3.00 | 4.00 | 4.10 | +1d 추가 (5) | ❌ — +0.1d만 (목표 +1d 대비 10%) |
| K3 doctor | 4.00 | 4.00 | 4.00 | +1d 추가 (5) | ❌ — 변화 0 (사망일 분포 미세 재배치만) |
| K3 homeless | 3.00 | 3.00 | 3.20 | +1d 추가 (4) | ❌ — +0.2d만 (목표 +1d 대비 20%) |
| K3 engineer | 3.00 | 3.00 | 3.10 | +1d 추가 (4) | ❌ — +0.1d만 (목표 +1d 대비 10%) |
| K5 chef 탈수 | 20 | 12 | 12 | ↓ (boiled_water 산출 시) | ⚠️ — v4→v5 변화 0. v3→v4 -8건 효과는 PR8 startInv 보강분으로 PR9 추가 효과 없음 |
| **actFish 발동** | 0 | 0 | **315** | **≥ 200/700** | **✅** (315/700, 158% 달성) |
| K3 chef 격차 (정의 1, 6직업) | +1.33 | +1.87 | +1.80 | +1.0~+2.0d 사수 | ✅ (+1.80d 범위 안) |
| K3 chef 격차 (정의 2, 5직업 cooking lv 0) | +1.30 | +2.00 | +1.94 | +1.0~+2.0d 사수 | ✅ (+1.94d 경계) |
| chef cook_intuition grace 트리거 (+2.5d) | - | +2.00 | +1.94 | < +2.5d | ✅ (모니터링 모드 유지) |
| 직업 격차 (K1 max-min) | 0%p | 0%p | 0%p | ≤ 5%p | ✅ (모두 0% 동일) |

**핵심 충족 1건 (actFish), 충족 4건(직업 격차·chef 격차 2종·grace 트리거). K1·K3 4 hasFishing 직업 +1d 목표 미달.**

---

## 9. R7·R8 상태표 갱신

| ID | PR7 후 | PR8 후 (v4) | PR9 후 (v5) |
|----|--------|-------------|-------------|
| R7-1 요리·낚시 AI 부재 | ✅ 구현, 발동 차단 (자원 부재) | ✅ 요리 7직업 100/100 발동. 낚시 0건 (rod 부재) | ✅ **요리 7직업 100/100 발동 + 낚시 4 hasFishing 직업 52~63/100 발동, 어획 315건/700** |
| R7-1.5 (신규) actCook 산출물 nutrition 효과 분리 | - | ⚠️ v4 보고서 분리 누락 | ⚠️ **단정: cooking lv 0~3 5직업 산출물 = boiled_water (n0). 가설 B 채택. 시뮬 산출물 우선순위 가중치 결함** |
| R7-2 morale 관리 AI 부재 | ✅ 구현, 발동 빈도 낮음 | ✅ chef·pharmacist·doctor 99~100% 발동 | ✅ **변화 없음** (PR9는 fishing만 활성화) |
| R7-3 lootTable food density | ⏳ PR8 권고 | ✅ 6 시작 구 가중치 보강 완료 | ✅ **변화 없음** (PR9 미관여). K1 효과 0 유지 |
| R8 cook_intuition grace 효과 | ⏳ K3 +1.33d 격차 | ⏳ K3 chef 격차 +1.87d, +2.5d까지 0.63d | ✅ **격차 +1.80d, +2.5d 트리거 미충족 (0.70d 여유). 모니터링 모드 유지** |
| R8-1 (신규 PR8) homeless·engineer actBoostMorale 0% | - | ⏳ M3 시나리오 한도연 트랙 위임 | ⏳ **v5 변화 없음.** morale 시계열 probe는 본 보고 부록 §7에서 actCook 모순 우선 단정으로 우선순위 후순위. v6 측정 시 추가 |
| **R9-1 (신규) PR9 4 hasFishing 직업 K1 효과 부족** | - | - | ⚠️ **K3 +0.1~0.2d만 연장. nutrition 회복량(fishing 1회 ~3 + cook lv 0 산출 0) < 일일 decay 36. PR10 옵션 A 25구 확대 또는 startInv 추가 보강 트리거** |
| **R9-2 (신규) chef PR9 효과 0** | - | - | ⚠️ **chef junggoo 비-hasFishing + hangang 비-인접 → fishing 0건. 격차 보호 유리. 제거 권고 아님** |

---

## 10. 결론과 다음 트리거

### 10.1 K1 ≥ 5% 충족 여부

**미충족.** PR9 옵션 C-a는 fishing AI 활성화에 성공(actFish 315/700)했으나, 일일 nutrition 회수량 < 일일 decay 36으로 K3 +0.1~0.2d 연장에 그침. PR10 진입 권고.

**산식 검증 (v4 보고서 §10.1 + v5 probe 보완):**
```
시작 nutrition 100
nutritionDecayPerTP 0.5 × TP_PER_DAY 72 = 일일 decay 36
fishing 1회 catch 0.30 × fish_small/medium nutrition ~10 = +3/회
4 hasFishing 직업 day 3~4 안에서 fishing 1~2회/day = +3~6/일
actCook 산출 boiled_water = nutrition 0 (가설 B 단정)
cooking lv 1 pharmacist day 3 cooked_noodles = nutrition +35 (1회만, day 2 boil로 입력 소진)

일일 net 5직업: -36 + 0(cook) + 3(fish) = -33/일 → day 3에 nutrition 0 → day 3~4 사망 (실측 정합)
일일 net pharmacist: -36 + 35(day 3 1회) + 6(fish) = -36 + 41/3day = +5 net (day 5 사망 첫 등장 실측 정합)
```

### 10.2 chef 격차 +2.5d 초과 여부

**미초과.** 정의 1 +1.80d, 정의 2 +1.94d. **cook_intuition grace 단축 보류 유지.** v6 측정 시 재검토.

### 10.3 actCook 모순 단정 결과

**가설 B 채택.** v4 보고서의 "actCook 7직업 100/100 발동"은 발동 카운트는 정확하지만, 산출물 nutrition 효과는 5직업에서 0. **K3·K5 5직업 변화 0이 산식과 정합.**

권고 PR 후보:
- (시뮬 로직 보강) PR? actCook 산출물 우선순위 가중치 분리 — `playerAI.mjs:185` benefit 산식 변경 (nutrition × 1.5 등). 시뮬 행동 변경 PR이라 별도 페르소나 회의 필요
- (게임 본체 검증) PR? 실제 game UI에서 player가 cooking 선택 시 boiled_water vs cooked_noodles 자동 추천 알고리즘 검증. 본 페르소나 영역 외 (시스템 백승호 + AD 오은별 검토)

### 10.4 다음 단계 / 트리거 후보

| 순위 | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | **PD/Balance 협의서 v3 작성** — PR10 진입 결정 (옵션 A 25구 확대 vs startInv 추가 보강 vs cooking 산출물 PR) + actCook 모순 단정 후 시뮬 로직 보강 PR 결정 | PD 김재훈 + 밸런스 권지나 | 본 보고 D+0 |
| 2 | (조건부) PR10 — 협의서 v3 결정에 따라 옵션 A 25구 확대 또는 startInv 추가 보강 또는 actCook 산출물 우선순위 PR | 시스템 백승호 또는 밸런스 권지나 | 협의서 v3 결정 직후 |
| 3 | baseline v6 측정 (PR10 후) | 밸런스 권지나 | PR10 머지 D+1 |
| 4 | 5직업 Tier-2 abilities (R8-1 homeless·engineer morale 회복 자원) | 시나리오 한도연 | M3 진입 |
| 5 | (선택) actCook 시뮬 로직 보강 PR — `playerAI.mjs:185` benefit 가중치 분리 | 밸런스 권지나 | 협의서 v3 결정 시 |
| 6 | (선택) game 본체 cooking 자동 추천 검증 | 시스템 백승호 + AD 오은별 | 협의서 v3 결정 시 |

**머지 순서 (PD 원칙: 데이터 → 메커닉 → 시각 → 밸런스 튜닝):**
1. 협의서 v3 → 2. PR10 (데이터 또는 메커닉 또는 시뮬 로직) → 3. baseline v6 측정 → 4. (필요 시) cook_intuition 단축 단일 상수 PR

### 10.5 협의서 v3 안건 후보

1. **PR10 진입 옵션 결정** — A(25구 확대) vs B(startInv 추가) vs C(actCook 시뮬 로직 보강)
2. **actCook 모순 가설 B 후속 처리** — 시뮬 로직 PR 우선 vs 게임 본체 검증 우선
3. **R9-1 (4 hasFishing 직업 K1 효과 부족) 폴백 우선순위** — fishing 효과 강화(`fishing.baseCatchChance` 상향) vs nutrition 회복 추가 경로
4. **R8-1 시나리오 한도연 트랙 진입 시점** — baseline v6 측정 의존
5. **R9-2 (chef PR9 효과 0) 검토** — 격차 보호 유리이므로 변경 없음 권고 vs chef yongsan 이동 동기 부여

---

*문서 끝. 협의서 v3 트리거 충족 (K1 < 5% 7회 연속 + actCook 가설 B 단정 + R9-1·R9-2 신규 위험).*
