# PD·Balance 합동 협의 — PR9 결정 (v2)

> 작성: PD 김재훈 + 밸런스 권지나 / 2026-05-11
> 목적: PR8 머지(`d42514f`) 후 baseline v4 정식 측정 결과를 입력으로, PR9 옵션 C 진입 여부 / chef K3 격차 +2.2d 처리 / R8-1 신규 발견(homeless·engineer actBoostMorale 0%) 처리를 결정한다.
> 결정: **PR9 옵션 C 진입(축소판: hangang sublocation 진입 시 fishing_rod_basic 1회 자동 지급). chef cook_intuition grace 단축 보류(모니터링 모드 유지). R8-1은 PR9 분리 — M3 시나리오 한도연 트랙 위임.**

---

## 1. 서두

- **참여 페르소나:** PD 김재훈 (프로덕션·우선순위·트레이드오프), 밸런스 권지나 (`gameBalance.js` 단일 진리 / 100회 시뮬 / K1 10~20%)
- **안건 3건:**
  1. PR9 옵션 C 진입 결정 (협의서 v1 §6.1 트리거 충족 확인 후)
  2. chef K3 격차 +2.2d 처리 (v3 +1.5d → v4 +2.2d, +0.7d 확대)
  3. R8-1 신규 발견 처리 (homeless·engineer actBoostMorale 0%)

### 1.1 협의서 v1 결정 결과 요약

`PD_BAL_MEETING_PR8_decision.md` §4: PR8 = 옵션 B(축소판 6직업 균등 startInv) + 옵션 A(시작 7구 lootTable 보강, dobong 제외) 단일 PR로 머지. 옵션 C는 baseline v4 결과 보고 PR9로 보류.

### 1.2 baseline v4 핵심 수치 (`BAL_SIM_baseline_v4_report.md`에서 인용)

- 700 runs (7직업 × 100회), fingerprint `len316-h242a5b5f`, buildTag `sim-baseline-v4-pr8`, bootstrapErrors 0, 7.3초
- `gameBalance.js` 미변경 검증 — fingerprint v3·v4 동일
- **K1 0.00% × 7직업** (6회 연속 0%: PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8)
- K3 mean: doctor 4 / soldier 3 / firefighter 3 / homeless 3 / **chef 5.2** / engineer 3 / **pharmacist 4**
- K3 chef 격차 = 5.2 − 3 = **+2.2d** (v3 +1.5d → +0.7d 확대)
- K5 합산: 아사 569 / 절망 113 / 탈수 12 / 극도 피로 6
- K5 chef 단독: 절망 82 / 탈수 12 / 극도 피로 6 (v3·v4 모두 100% 비-아사)
- AI probe (`probe_pr8.mjs` 700 runs): actCook 7직업 100/100 발동 / actFish 0건 / actBoostMorale chef·pharmacist·doctor 99~100% / **homeless 0/100, engineer 0/100**

### 1.3 v1 §6.1 트리거 충족 단언

협의서 v1 §6.1 폴백 조건: "**chef K1 5% 미만 / 다른 직업 K1 0% 유지**". baseline v4 측정값: chef K1 0.00% / 다른 6직업 K1 0.00%. **트리거 충족 확정.** 본 협의는 폴백 결정 권한을 가진다.

---

## 2. 안건 1 — PR9 옵션 C 진입 결정

### 2.1 옵션 C 재분석 (협의서 v1 §2.3 vs baseline v4 측정 후)

**v1 §2.3 추정 vs v4 측정 차이:**

- v1 §2.3에서 옵션 C K1 효과를 "marginal — chef는 grace 1일 소진, non-chef는 K3 day 3 사망선 안에서 도달 불가"로 평가했음
- baseline v4 K3 측정으로 평가 환경이 변동:
  - **chef K3 5.2** (v3 4.5 → +0.7d) — 이동 + fishing 시도 시간 확보
  - **pharmacist K3 4** (v3 3 → +1.0d) — gangnam(자체 hasFishing) 직속, 이동 비용 0
  - doctor K3 4 (불변) — dongjak(자체 hasFishing) 직속, 이동 비용 0
  - homeless K3 3 (불변) — gwangjin(자체 hasFishing) 직속, 이동 비용 0
- **즉 7직업 중 4직업이 시작 구가 hasFishing**. 옵션 C의 K1 영향 추정이 v1 시점보다 의미 있게 상향

### 2.2 시작 구 hasFishing 매트릭스 (`js/data/districts.js` 실측)

| 직업 | 시작 구 | hasFishing | 한강 도달 비용 (TP) |
|------|---------|-----------|------------------|
| pharmacist | gangnam (line 23) | **true**, fishingQuality 2 | 0 (자체) |
| doctor | dongjak (line 430) | **true**, fishingQuality 2 | 0 (자체) |
| homeless | gwangjin (line 200) | **true**, fishingQuality 2 | 0 (자체) |
| engineer | yongsan (line 719) | **true**, fishingQuality 2 | 0 (자체) |
| chef | junggoo (line 823~828) | **부재** | yongsan 1 이동 (travelCostTP 2) |
| soldier | dobong (line 342) | 부재 | seongdong 인접 (line 402 adj) — 1 이동 |
| firefighter | eunpyeong (line 745~751) | 부재, adj=`[seodaemun]` | seodaemun→mapo 또는 다중 이동 필요 |

**결정적 발견:** v1 §2.3에서 chef 단독으로 hangang 도달 비용을 검토했으나, **engineer yongsan도 hasFishing: true 자체 보유**. v4 측정의 actFish 0건은 fishing AI(`actFish` in `playerAI.mjs`)가 정상 작동하지만 **rod 보유 직업 0건**이라 발동 차단된 결과 — 협의서 v1 §2.3 "chef 1직업 도달" 가정이 4직업으로 확장됨.

### 2.3 옵션 C 변형 후보

**변형 C-a (최소판):** hangang sublocation(`hangang_fishing_spot` / `hangang_riverside`) 진입 시 `fishing_rod_basic` 1회 자동 지급 (per character, 1회 한정).

**변형 C-b (확대판):** hasFishing: true 구 진입 시 (district enter 시점) 자동 지급.

**변형 C-c (직접):** 7직업 startInv에 fishing_rod_basic 1개 직접 추가.

**PD 김재훈:**
> 변형 C-c는 한 줄 수정으로 가장 싸지만, 두 가지 트레이드오프 발생.
> 1. 직업 정체성 흐림 — 7직업 전부 day 1부터 낚싯대 보유는 chef·pharmacist·engineer·homeless의 직업 차별화를 무너뜨린다. 협의서 v1 §3.1(직업 정체성 흐림 부작용)과 동일 패턴 재발.
> 2. fishing 메커니즘 진입 동기 부족 — 시작 인벤토리에 끼얹는 형태는 "낚시터를 찾아간다"는 게임 루프를 우회. PR9 목적은 "낚시터 접근 동기 부여 + actFish AI 활성화"인데 C-c는 후자만 달성.
>
> 변형 C-b는 구 진입 시점 — `currentDistrict` 변경 시점에 hasFishing 체크. 영향 시스템: ExploreSystem 또는 `enterDistrict` 등가 함수. 단, 시작 구가 hasFishing인 4직업은 day 1 자동 지급 → C-c와 차이가 chef·soldier·firefighter 3직업뿐. 변형 C-a 대비 추가 가치 적음.
>
> **변형 C-a 채택 권고.** hangang sublocation 진입 시점에 한 번 지급은 "낚시터 접근" 게임 루프와 정합. 영향 파일: `js/data/landmarks.js` hangang sublocation 신규 필드(rewardOnEnter 또는 등가) + ExploreSystem 진입 후크. **코드 디테일(필드명·후크 시그니처·1회 한정 플래그 저장 위치)은 시스템 백승호 위임.** PD 영역은 영향 파일 식별·머지 순서·일정까지.
>
> 일정: 영향 파일 2개(landmarks.js + ExploreSystem.js), validate.js 회귀 + run_baseline.mjs v5 측정까지 D+2. 트랙 분리 가능.

**밸런스 권지나:**
> baseline v4 측정 기반 actFish 가능 회수 추정.
>
> **PR9 후 추정 actFish 발동 가능 회차 (변형 C-a 기준):**
> - pharmacist: gangnam 자체 hasFishing → 굳이 hangang sublocation 진입 안 해도 fishing 가능. 단 `actFish` 발동은 `DISTRICTS[currentDistrict].hasFishing === true && rod 보유` 조건(`SYS_PR7_cooking_fishing_morale_ai.md` §1.1, `playerAI.mjs` actFish 정의). hangang sublocation 진입 시 rod 지급 필수 — 시작 구만으로는 rod 미보유. 따라서 day 1 hangang_riverside 1회 진입 → rod 획득 → day 1~4 fishing AI 발동 가능. K3 4 안에서 **3~4회 시도** 추정
> - doctor: dongjak hasFishing 직속 → 동일 흐름, K3 4 안에서 **3~4회 시도**
> - homeless: gwangjin hasFishing 직속 → 동일 흐름, K3 3 안에서 **2~3회 시도**
> - engineer: yongsan hasFishing 직속 → 동일 흐름, K3 3 안에서 **2~3회 시도**
> - chef: junggoo→yongsan 1 이동 (TP 2 + grace 1일 소진) → K3 5.2 안에서 **2~3회 시도** (이동 day 1 손실 + day 2~5 fishing 가능)
> - soldier: dobong→seongdong 1 이동 → K3 3 안에서 **0~1회 시도** (이동 후 사망 직전)
> - firefighter: eunpyeong→seodaemun→mapo 다중 이동 → K3 3 안에서 **0회 시도** (이동 도중 사망)
>
> **fishing 1회 영양 산출:** `BALANCE.fishing.baseCatchChance 0.30` + (lv/20)×bonus. 비-fishing 직업(skill lv 0)은 `0.30` 베이스. 성공 시 fish_small(55%) + fish_medium(45%) → 영양 평균 ~10/회. 시도 회차당 영양 기댓값 = 0.30 × 10 = **3/회**.
>
> **K3 day 3~5 안에서 영양 회수 영향 추정:**
> - pharmacist day 4 안에서 4회 × 3 = 영양 +12 (현 startInv cooking 1회 +15 추가, 총 +27)
> - doctor day 4 안에서 4회 × 3 = 영양 +12 (cooking 1회 +15 추가)
> - 시작 nutrition 100, nutritionDecayPerTP 0.5, TP_PER_DAY 72 → 일일 decay 36. day 4 누적 decay 144 → 시작 100 보유로 day 3 nutrition 0
> - PR9 추가 회복분 +27 → day 4 nutrition 0 도달 → 사망 day 4~5로 1d 연장 추정
>
> **K1 영향 신뢰구간:**
> - chef K1: chef K3 5.2 → 5.5~6.0 추정, 100일 도달 0건 유지 가능성 높음. K1 신뢰구간 0~3% (±3%p)
> - pharmacist·doctor·engineer·homeless K1: K3 +1d 연장으로 한계, 100일 도달 0~5% 추정. **K1 ≥ 5% (chef 우선) 목표 마지노선 도달 여부 불확실**
>
> 결론: 변형 C-a는 K3 누적 +1d 효과 측정 가능. **K1 5% 도달은 보장 못함 — baseline v5에서 측정 후 PR10(옵션 A 25구 확대 또는 startInv cooking 입력 추가 보강) 후속 검토 트리거 명시 의무.**
>
> 변형 C-a 채택에 합의. C-b 거절 사유: 시작 구 직접 보유 직업의 day 1 자동 지급은 "rod 획득 = 한강 가야 한다"는 학습 신호 차단 → 게임 루프 손상. 변형 C-c 거절: 직업 정체성 흐림 + 게임 루프 우회.

### 2.4 결정 — 안건 1

**변형 C-a 채택.** hangang sublocation(`hangang_fishing_spot` / `hangang_riverside`) 진입 시 `fishing_rod_basic` 1회 자동 지급 (per character, 1회 한정 플래그).

- **양 페르소나 합의 도출.**
- 영향 파일: `js/data/landmarks.js` (hangang sublocation 신규 필드), `js/systems/ExploreSystem.js` (sublocation 진입 후크 — 신규 또는 기존 진입 함수 확장), GameState 1회 한정 플래그 저장 위치.
- **코드 디테일은 시스템 백승호 위임.** PD/Balance 영역은 영향 파일 식별·일정·KPI까지.

---

## 3. 안건 2 — chef K3 격차 +2.2d 처리

### 3.1 측정값 vs 협의서 v1 KPI 표

`BAL_SIM_baseline_v4_report.md` §7:

| 지표 | 측정 | 협의서 v1 §5.5 목표 | 충족 |
|------|------|---------------------|------|
| chef K3 격차 | +2.2d (v3 +1.5d) | +1.0d ~ +2.0d 사수 | **❌ 0.2d 초과** |
| chef cook_intuition grace 재검토 트리거 (v1 §6.2) | +2.2d | +2.5d 이상 | ❌ 트리거 미충족 (0.3d 여유) |

### 3.2 PD 시각

**PD 김재훈:**
> 두 합의의 충돌점.
> 1. 협의서 v1 §5.5 KPI: chef +1.0~+2.0d 사수 — 0.2d 초과
> 2. 협의서 v1 §6.2 폴백 트리거: +2.5d 이상에서 cook_intuition grace 단축 — 0.3d 여유
>
> KPI 표는 측정 *결과* 평가 기준이고, 폴백 트리거는 *액션* 트리거 기준. 두 문서 충돌 아님 — 0.2d 초과는 "관찰 의무" 단계, 0.3d 여유는 "액션 보류" 단계로 정합.
>
> M2 합의(`BAL_TUNING_chef_grace.md` §6: `days=7, mult=0.5` 유지) 보호. baseline v3 한 점 측정으로 통과시킨 결정인데, v4에서 +0.7d 확대됐다고 즉시 단축하면 v3 기준선 자체가 표본 1점이라 변경 근거 불충분.
>
> 또한 PR9 옵션 C가 chef에 grace 1일 소진(yongsan 이동) 비용을 부과 → chef K3 +0.7d 효과의 일부가 PR9에서 자연 상쇄될 가능성. 단축 결정은 PR9 결과(baseline v5)를 기다린 후가 맞다.

### 3.3 밸런스 시각

**밸런스 권지나:**
> 시뮬 추정 (`BAL_TUNING_chef_grace.md` §3.1 가설 재인용):
> - days 7→5 단축 시 chef K3 4.5 → ~4.0 추정 (v3 측정 기준). v4 5.2 기준 환산 시 chef K3 5.2 → ~4.7 추정 (격차 +1.7d로 회귀)
> - days 7→5 단축은 단일 상수 변경 (`gameBalance.js` 외 `characters.js` ability 데이터). 단일 PR 분리 가능.
>
> 그러나 측정 표본 부족.
> - v3 측정값 1점, v4 측정값 1점 — 추세선 신뢰구간 미확보
> - 협의서 v1 §6.2 트리거 +2.5d는 "액션 발동 임계점"이며, 0.3d 여유 안에서는 추가 데이터 수집이 우선
> - PR9 후 baseline v5에서 chef K3 격차 변화 측정 → +2.5d 도달 시 즉시 단일 상수 PR로 처리. 미달 시 현 상태 유지
>
> 1차 도구는 `stats.decay` 5개 우선 검토(밸런스 페르소나 §2 신념). cook_intuition `days` 단축은 ability 자체 변경이라 1차 도구 아님. **단축 결정은 v5 측정 후가 정확.**
>
> 보류 결정에 합의.

### 3.4 결정 — 안건 2

**보류 (모니터링 모드 유지).** PR9 후 baseline v5에서 chef K3 격차 측정 → +2.5d 초과 시 즉시 `BAL_TUNING_chef_grace.md` §4 트리거 발동, cook_intuition `days = 7 → 5` 단일 상수 PR. v5에서 +2.5d 미달 시 현 상태 유지.

- **양 페르소나 합의 도출.**
- 모니터링 책임자: 밸런스 권지나 (baseline v5 측정 시 `BAL_SIM_baseline_v5_report.md` §K3 표에 chef 격차 명시 의무).

---

## 4. 안건 3 — R8-1 신규 발견 (homeless·engineer actBoostMorale 0%)

### 4.1 측정 사실

`BAL_SIM_baseline_v4_report.md` §6.1·§6.3:

| 직업 | actBoostMorale 발동 (700 runs) |
|------|-------------------------------|
| chef | 100/100 |
| doctor | 99/100 |
| pharmacist | 100/100 |
| soldier | 35/100 |
| firefighter | 11/100 |
| **homeless** | **0/100** |
| **engineer** | **0/100** |

`tools/sim/v2/playerAI.mjs` `actBoostMorale` 발동 조건: `morale.current < 30` && simInv에 `onConsume.morale` 보유 아이템 1개 이상. homeless·engineer 0/100는 다음 둘 중 하나.

### 4.2 밸런스 시각

**밸런스 권지나:**
> 0% 발동의 두 가능 원인:
> 1. **morale<30 도달 안 함** — 두 직업 K3 mean 3, 사망 사유 100% 아사. day 3 사망 시 morale 누적이 30 미만으로 감소하지 않았을 수 있음
> 2. **morale<30 도달했어도 startInv에 morale 회복 아이템 부재** — `js/data/characters.js:252` homeless `effect.startingItems = ['battered_can', 'old_blanket', 'newspaper_bundle', 'box_cutter', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water']` / `:386` engineer `['scrap_metal', 'wire', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water']`. instant_noodles·contaminated_water의 `onConsume.morale` 효과는 미확인 (별도 검증 필요).
>
> 두 가능성을 분리하려면 추가 probe 필요:
> - probe 1: 두 직업 회차에서 morale.current 시계열 측정 (day 1~3 morale 도달값)
> - probe 2: 두 직업 startInv 아이템의 `onConsume.morale` 필드 보유 여부 데이터 확인
>
> v4 보고서 §6.3은 "이 두 직업은 startInv에 onConsume.morale 보유 아이템 없음"을 추정으로 단정했으나 **추정 근거가 데이터 직접 확인이 아닌 발동 0건 역추론**. 측정 강화 필요.
>
> 단, K5 측정 (§5.2): homeless·engineer 100% 아사 — morale 회복이 가능했어도 사망 사유는 nutrition. **PR9 단독으로 R8-1 처리해도 두 직업 K1 향상 효과 거의 없음**. 우선순위는 nutrition 보강(옵션 A 확대 또는 startInv 추가)이 먼저.

### 4.3 PD 시각

**PD 김재훈:**
> 트랙 분배 관점.
> - R8-1은 M3 진행 중인 이슈 #2(6직업 비대칭 해소) 트랙과 직접 연결. 5직업 Tier-2 abilities(`SCN_QUEST_*tier2.md`) 작업이 시나리오 한도연 담당
> - 시나리오 트랙은 M3 마일스톤 안에서 별도 진행 중. PR9에 R8-1을 묶으면 PR9가 "낚시 + morale 자원 추가" 다중 트랙으로 확장 → 협의서 v1 §운영 신념 5(1 PR 1트랙) 위반
> - 또한 R8-1 처리는 단순 startInv 추가가 아니라 "두 직업 morale 회복 *수단* 정의" 결정 필요 — 시나리오·설정 페르소나 어휘·플레이버 검토가 함께 들어가야 정합 (homeless `newspaper_bundle`·`old_blanket`은 morale 회복으로 환산 가능한 정체성 자원, 단순 instant_noodles 추가는 정체성 흐림)
>
> **PR9 분리.** R8-1은 시나리오 한도연 트랙으로 위임. 단 baseline v5 측정 시 measurement probe 추가는 밸런스 권지나 영역 — v5에서 morale 시계열 측정으로 R8-1 원인을 1·2 중 어느 것인지 단정.

### 4.4 결정 — 안건 3

**별도 트랙 분리 (M3 시나리오 한도연 5직업 Tier-2 abilities 트랙으로 위임). PR9에 묶지 않음.**

- **양 페르소나 합의 도출.**
- 측정 강화: baseline v5 측정 시 밸런스 권지나가 homeless·engineer morale 시계열 probe 추가 (§5.2 R8-1 원인 1·2 단정 데이터).
- 시나리오 한도연 트랙 트리거: M3 5직업 Tier-2 abilities 작업 진입 시 R8-1 측정 데이터를 입력으로 morale 회복 자원 분배 결정.

---

## 5. 횡단 발견

### 5.1 baseline v4가 v3 대비 보여준 의외의 패턴

**chef K3 +0.7d 확대 (4.5 → 5.2):**
- v4 보고서 §4 분석: chef cooking lv 4 + cook_intuition grace 7d 효과가 PR8 startInv 보강(instant_noodles 2 + contaminated_water 1)으로 처음 활성화. v3 측정 시점에는 cooking 입력 부재로 cooking lv 4 효과가 자원 게이팅에 막혀 있었음
- 격차 확대는 chef ability 강화가 아니라 **자원 보강이 ability 효과를 처음 측정 가능화한 결과**. cook_intuition 자체는 변경 없음

**K5 탈수 20→12 감소 (-8건):**
- v4 보고서 §5.2: chef 탈수 20→12 감소 (8건 전부 chef 회차에서 발생). PR8에서 chef startInv에 contaminated_water 1 추가됐고, cooking AI가 boil_water 등 수분 산출 레시피로 처리한 것으로 추정
- 단 v4 보고서 §5.2 명시: "actCook의 boil_water 등 수분 산출 레시피 대비 검토 의무". v5 측정 시 chef 회차에서 `cook:boil_water` 발화 trace 검증 필요

**K5 극도 피로 1→6 증가 (+5건):**
- v4 보고서 §5.2: chef 극도 피로 1→6은 생존 일수 증가의 부산물. day 5.2까지 살면서 fatigue 누적
- 직업 평균 K3 +0.7d 연장 시 부수 효과로 fatigue 사망이 생긴다는 증거 — PR9에서 chef·pharmacist K3가 추가 연장될 경우 극도 피로 사망 추가 발생 예상

### 5.2 PR8이 K1을 못 깬 원인 정량 분석 (v4 보고서 §9.4·§10.1)

```
시작 nutrition 100
nutritionDecayPerTP 0.5 × TP_PER_DAY 72 = 일일 decay 36
chef cooking lv 4 + 1회/day cook 평균 영양 회복 ~15
일일 net = -36 + 15 = -21 → day 3에 nutrition 0 → day 4~5 영양 부족 사망
```

chef K3 측정값 5.2가 이 산식과 정합. **PR8은 nutrition 회복 흐름을 활성화했지만 회복량 < 소모량.** K1을 깨려면 일일 추가 회복 +21 이상 필요.

PR9 옵션 C 추가 회복량 추정:
- fishing 1회 영양 기댓값 ~3 (catch 0.30 × 영양 ~10)
- 일일 fishing 1~2회 → +3~6/일
- chef·pharmacist day 4~5 안에서 일일 net = -21 + 3~6 = -15~-18 → day 5~6 nutrition 0 → 사망 day 6~7로 추가 1~2d 연장 추정
- **여전히 K1 5% 도달 미보장.** PR10 옵션 A 25구 확대 또는 추가 startInv 보강이 후속 트리거

### 5.3 협의서 v1 §3.3 옵션 A scavenging 미반영 — v4 측정 후 검증

협의서 v1 §3.3에서 `districts.js:897 generateDistrictLoot()`이 scavenging skill 미반영이라 옵션 A는 직업 균등 분포로 작용한다고 분석. v4 측정에서 actCook 7직업 100/100 발동 → 옵션 A 효과는 확인됐으나 직업별 cooking lv 격차(chef 4 / homeless 3 / pharmacist 1 / 나머지 0~1)가 K3 mean에 자연 분리됨 (chef 5.2 / pharmacist 4 / 나머지 3). **협의서 v1 §3.3 분석이 v4에서 검증됨**.

---

## 6. 결정 종합

| 안건 | 결정 |
|------|------|
| 1. PR9 옵션 C 진입 | **변형 C-a 채택** — hangang sublocation 진입 시 `fishing_rod_basic` 1회 자동 지급 |
| 2. chef K3 격차 +2.2d | **보류** — 모니터링 모드 유지. baseline v5에서 +2.5d 초과 시 즉시 `cook_intuition days=7→5` 단일 상수 PR |
| 3. R8-1 (homeless·engineer morale 0%) | **별도 트랙 분리** — M3 시나리오 한도연 5직업 Tier-2 abilities 위임. baseline v5에서 morale 시계열 probe 추가 |

### 6.1 PR9 단일 트랙 정의

**PR9 = "hangang sublocation 진입 시 fishing_rod_basic 1회 자동 지급" 단일 트랙.** 영향 파일 2개(`js/data/landmarks.js` + `js/systems/ExploreSystem.js`) + GameState 1회 한정 플래그 저장. 코드 디테일은 시스템 백승호 위임.

---

## 7. 실행 계획

### 7.1 PR9 영향 파일 (변형 C-a 기준)

| 파일 | 영역 | 담당 |
|------|------|------|
| `js/data/landmarks.js` | hangang sublocation(`hangang_fishing_spot` / `hangang_riverside`)에 보상 지급 신규 필드 (정확한 필드명·구조는 시스템 위임) | 시스템 백승호 |
| `js/systems/ExploreSystem.js` | sublocation 진입 시점 후크 — 보상 필드 처리 + 1회 한정 플래그 검사·기록 (정확한 함수 시그니처는 시스템 위임) | 시스템 백승호 |
| GameState 1회 한정 플래그 저장 위치 | 캐릭터 단위 1회 보장 (run 단위 또는 character 단위 — 시스템 결정) | 시스템 백승호 |
| `js/data/items_tools.js:235` `fishing_rod_basic` | 정의 변경 없음 (현재 정의 그대로 활용, weight 1 / durability 100) | — |
| `js/data/stackConfig.js` | fishing_rod_basic은 stackable: false (`items_tools.js:239`) → stackConfig 등록 불필요 | — |

### 7.2 데이터 영역 (PD/Balance 결정 가능 수치)

- 지급 수량: **1개** (1회 한정)
- 지급 아이템: **fishing_rod_basic** (defaultDurability 100, weight 1, `items_tools.js:235~244`)
- 지급 시점: **hangang sublocation 첫 진입 시** (`hangang_fishing_spot` 또는 `hangang_riverside` 둘 중 어느 쪽이든 첫 진입 시 1회 지급)
- 1회 한정 단위: **per character per run** (run 단위 — baseline 측정 회차 결정성 보장 필요)

### 7.3 시스템 백승호 위임 영역

- landmarks.js 신규 필드명 결정 (`rewardOnEnter` / `rewardOnFirstEnter` / 등가 패턴)
- ExploreSystem 후크 함수 시그니처 (`enterLandmark` 확장 또는 sublocation 진입 별도 함수 신설)
- 1회 한정 플래그 GameState 저장 위치 (`gs.location.hangangRodGranted` / `gs.player.flags.*` 등 — 시스템이 정합 위치 결정)
- 시뮬 v2 actFish 트리거 검증 (`tools/sim/v2/runner.mjs`에서 actFish 발동 조건 충족 확인 — `playerAI.mjs` actFish는 이미 `DISTRICTS[currentDistrict].hasFishing && rod 보유` 조건이라 PR9 후 자동 발동 가능 추정)

### 7.4 검증 절차

1. `node --input-type=module js/data/validate.js` — Errors 0
2. `node tools/sim/v2/run_baseline.mjs` — 700 runs / fingerprint `len316-h242a5b5f` 유지(BALANCE 미변경) / `BAL_SIM_baseline_v5_result.json` 생성 / buildTag `sim-baseline-v5-pr9`
3. probe: 4 자체 hasFishing 직업(pharmacist·doctor·homeless·engineer) 회차에서 actFish 발동 횟수 ≥ 1 확인
4. probe: chef 회차에서 yongsan 이동 후 actFish 발동 횟수 측정
5. probe: homeless·engineer morale 시계열 측정 (R8-1 원인 1·2 단정용 — 안건 3 측정 강화)

### 7.5 KPI 갱신 (baseline v5 목표값)

| KPI | baseline v4 | baseline v5 목표 | 폴백 트리거 |
|-----|-------------|------------------|-----------|
| K1 (100일 생존율) | 0.00% (전 직업) | ≥ 5% (chef·pharmacist·doctor·homeless·engineer 중 1직업 이상) | < 5% 시 PR10 옵션 A 25구 확대 검토 |
| K3 chef | 5.2 | 5.5~6.5 (yongsan 이동 -1d 포함) | +2.5d 초과 시 cook_intuition `days=7→5` 즉시 PR |
| K3 pharmacist·doctor·homeless·engineer | 4 / 4 / 3 / 3 | +1d 추가 (각 5 / 5 / 4 / 4) | +0.5d 미달 시 옵션 C 효과 추가 분석 |
| K5 chef 탈수 | 12 | ↓ (boiled_water 산출 시) | 변화 없음 시 §5.1 boil_water trace 검증 의무 |
| actFish 발동 | 0/700 | ≥ 200/700 (4 자체 hasFishing 직업 × 50회 평균) | 50/700 미만 시 시스템 후크 결함 의심 |
| 직업 격차 (K1 max-min) | 0%p | ≤ 5%p | 5%p 초과 시 회귀 검사 발동 (밸런스 §3 §4) |

---

## 8. 위험과 완화

### 8.1 PR9 후 baseline v5에서 K1 여전 < 5% 시 폴백

**트리거:** baseline v5 측정에서 K1 모든 직업 < 5%.
**폴백 1:** PR10 옵션 A 확대 — dobong 외 25구 전수 raw food 가중치 추가 (직업 격차 보호 검토 의무).
**폴백 2:** PR11 startInv 추가 보강 — 7직업 startInv에 nutrition 회복 아이템 +1 (PR8 패턴 반복).
**폴백 우선순위:** PD 김재훈 결정 (baseline v5 보고 D+0).

### 8.2 chef K3 격차 +2.5d 초과 시

**트리거:** baseline v5 측정에서 chef K3 격차 +2.5d 이상.
**완화:** `BAL_TUNING_chef_grace.md` §4 트리거 발동, cook_intuition `days = 7 → 5` 단일 상수 PR (PR10 또는 PR11). **PR9에 묶지 않음** — 1 PR 1트랙 원칙.

### 8.3 R8-1 별도 트랙 시 의존성 관리

**트리거:** M3 시나리오 한도연 5직업 Tier-2 abilities 작업 진입.
**의존성:** baseline v5 측정 결과(homeless·engineer morale 시계열 probe) → 시나리오 한도연이 morale 회복 자원 분배 결정의 입력값으로 활용.
**완화:** baseline v5 측정 후 R8-1 원인 1(morale 도달 안 함) vs 2(회복 수단 부재) 단정. 원인 1이면 시나리오 트랙 우선순위 ↓ (사망 사유 100% 아사 → morale 보강 효과 미미). 원인 2면 우선순위 ↑.

### 8.4 PR9 옵션 C-a fishing AI 발동 결정성 위험

**트리거:** baseline v5에서 fingerprint 변동 (시뮬 결정성 깨짐).
**원인 후보:** ExploreSystem 후크가 실제 게임에서는 정상이나 시뮬에서는 sublocation 진입 처리 미구현 가능성 (시뮬 v2가 sublocation 모델링 안 할 경우).
**완화:** 시스템 백승호가 시뮬 v2 actFish 트리거 검증 의무 (§7.3). 시뮬에서 sublocation 모델링 부재면 시뮬 측 별도 fishing_rod_basic 부여 흐름 신설 (시뮬 코드 영역 — 시스템 위임).

### 8.5 chef yongsan 이동 grace 1일 소진 부작용

**트리거:** baseline v5에서 chef K3 mean 5.2 → 5.0 이하 감소 (이동 비용으로 grace 효과 손실).
**완화:** chef는 옵션 C-a로 K3 ↑ 효과 ≈ 0 (격차 보호 유리, 협의서 v1 §2.3 분석 정합). chef K3 감소 시 격차 +2.2d → ≈ +1.9d로 자연 회귀 → 협의서 v1 §5.5 KPI 범위 +1.0~+2.0d 복귀. **부작용이 KPI 충족 방향이라 별도 완화 불필요.**

---

## 9. 다음 단계

| 순위 | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | PR9 옵션 C-a 구현 — landmarks.js + ExploreSystem.js + GameState 플래그 + 시뮬 v2 actFish 트리거 검증 | 시스템 백승호 | 본 협의서 결정 직후 |
| **2** | validate.js 회귀 검증 | 시스템 백승호 | PR9 PR 생성 시 |
| **3** | baseline v5 측정 및 보고 (`BAL_SIM_baseline_v5_report.md`) | 밸런스 권지나 | PR9 머지 D+1 |
| 4 | baseline v5 결과로 PR10 옵션 A 확대 / cook_intuition 단축 / R8-1 원인 단정 판단 | PD 김재훈 + 밸런스 권지나 | baseline v5 보고 D+0 |
| 5 | (조건부) PR10 — 옵션 A 25구 확대 또는 cook_intuition 단축 | 시스템 백승호 또는 밸런스 권지나 | baseline v5 보고 후 결정 시 |
| 6 | M3 5직업 Tier-2 abilities — homeless·engineer morale 회복 자원 분배 (R8-1) | 시나리오 한도연 | M3 진입, baseline v5 measurement 입력 |

**머지 순서 (PD 원칙: 데이터 → 메커닉 → 시각 → 밸런스 튜닝):**
1. PR9 데이터+시스템 (옵션 C-a) → 2. baseline v5 측정 → 3. (필요 시) PR10 옵션 A 확대 (데이터) → 4. (필요 시) cook_intuition 단축 단일 상수 PR (밸런스 튜닝)

---

*문서 끝. baseline v5 결과 도착 시 본 문서 §7.5 KPI 표 업데이트 + PR10 / cook_intuition / R8-1 트리거 결정.*
