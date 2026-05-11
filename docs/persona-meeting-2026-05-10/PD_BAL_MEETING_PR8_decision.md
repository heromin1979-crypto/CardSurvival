# PD·Balance 합동 협의 — PR8 결정

> 작성: PD 김재훈 + 밸런스 권지나 / 2026-05-11
> 목적: PR7 머지 후 K1=0% 잔여 병목을 해소할 PR8 옵션을 결정한다.
> 결정: **옵션 B(축소판) + 옵션 A(축소판) 병행. 단일 PR8로 머지. 옵션 C는 baseline v4 결과에 따라 PR9로 보류.**

---

## 1. 서두

- **참여 페르소나:** PD 김재훈 (프로덕션·우선순위·트레이드오프), 밸런스 권지나 (`gameBalance.js` 단일 진리 / 100회 시뮬 / K1 10~20%)
- **선행 결과 요약 (`BAL_SIM_baseline_v3_report.md` §2~§5):**
  - 700회 시뮬, 7직업 × 100회 / 시드 SEED_BASE=0 / fingerprint `len316-h242a5b5f` / 6.7초
  - K1 = 0/100 (7직업 전부) — 5단계 누적(PR5 → PR5.5 → PR6 → PR7-pre → PR7) 변동 없음
  - K3 mean death day = doctor 4 / chef 4.5 / 다른 5직업 3 — chef +1.5d 격차 유지
  - K5 사망 원인: 아사 569 / 절망 110 / 탈수 20 / 극도 피로 1 (전 직업 합산 700)
- **PR7 진단 (`SYS_PR7_cooking_fishing_morale_ai.md` §4):**
  - actCook 발동 0건 — junggoo·gangnam 등 시작 구의 lootTable에 raw cooking 입력 부재
  - actFish 발동 0건 — 7직업 startInv에 `fishing_rod*` 없음, day 3 사망 평균 안에 제작 불가
  - actBoostMorale 발동 빈도 낮음 — raw food 부족이 더 우선 병목

---

## 2. 3 옵션 분석

### 2.1 옵션 A — 시작 구 lootTable에 cooking 입력 가중치 추가

**대상 파일:** `js/data/districts.js`
- chef `junggoo` (line 820~845, 가중치 합 109)
- pharmacist `gangnam` (line 19~47, 합 ~143)
- soldier `dobong` (line 342~391, 합 매우 큼 — 이미 herb 20·wild_berry 12·mushroom_edible 10 보유)
- doctor `dongjak` / homeless `gwangjin` / engineer `yongsan` / firefighter `eunpyeong`

**PD 김재훈:**
> 비용은 25 구 전수가 아니라 **시작 7구 한정**으로 좁힌다. herb·wild_berry·raw_meat 가중치 추가 작업은 구당 3~5줄 데이터, 합산 30~50줄. validate.js 회귀 + run_baseline.mjs v4까지 D+1 안에 가능. 단, soldier dobong은 이미 채집 자원 풍부 — 추가하면 도봉 직업이 chef·pharmacist 대비 더 빨리 K1 가는 부작용 위험. 그래서 **dobong은 제외**.

**밸런스 권지나:**
> 측정 가능성에 결함 있음. `js/data/districts.js:897 generateDistrictLoot()`은 BALANCE.explore.lootCountMin~Max로 1~3개 뽑는 단순 가중치 rand. **scavenging skill 보너스 미반영.** 즉 SYS_PR7 §6의 "scavenging skill로 활성화"는 추정이며, homeless scavenging=4 (`characters.js:255`)는 lootTable 산출에 영향 없다. scavenging은 `ExploreSystem.js:424,430`(랜드마크 탐색)에만 적용됨. 따라서 옵션 A의 K1 영향은 직업 균등하게 분포 — chef 격차 +1.5d 보호에 중립.
>
> 정량 추정: junggoo 가중치 합 109에 herb 8 추가 → 117. herb 산출 확률 6.8%. PR5.5 자원 채집 AI(`SYS_PR5_5_resource_ai_report.md`)가 generateDistrictLoot을 매일 3회 + 1~3개 = 일일 3~9회 가중치 추첨. herb 산출 기댓값 0.20~0.61개/일. cooking 1회당 nutrition+15(`heat_canned`류) 기준 **chef cooking AI 발동 횟수가 일일 0~1회 수준**. K1 ↑ 효과는 미미. 단일 옵션으로는 baseline v4에서 K1 10% 도달 불확실.
>
> 신뢰구간: 100회 시뮬 ±3%p 권고치 안에서 0~5% 사이로 추정. 옵션 A 단독 머지는 보완 후 재검토 결정 권한 사용.

### 2.2 옵션 B — chef startInv에 instant_noodles ×2 + contaminated_water ×3 추가

**대상 파일:** `js/data/characters.js` chef `knife_mastery` ability (line 314~317, 현재 `startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration']`)

**아이템 정의 확인:**
- `instant_noodles` (`items_base.js:442`): nutrition+15 / hydration -5
- `contaminated_water` (시작 구 dobong line 349, `items.js`에서 정의)
- `stackConfig.js:62`: `instant_noodles` 스택 가능 10 — 검증 통과

**PD 김재훈:**
> chef startInv 변경은 PR4(`SCN_PR_chef_knife_mastery.md`) 후속이라 영향 파일 1개. 데이터 변경량 1줄. 일정 비용 가장 낮음. 단 **PD_MILESTONE_M2_close.md §5에서 직업 평균 startInv 5.4개**(doctor 12, chef 5, soldier·firefighter·homeless·engineer·pharmacist 3~5)인데, chef를 5 → 10개로 키우면 직업 비대칭 P1(이슈 #2)을 다시 키운다. **옵션 B를 chef 단독으로 적용하면 안 된다.** 6직업에 cooking-feasible 시작 자원을 동시에 한 줄씩 끼얹는 형태로만 통과시킨다.
>
> 단, 6직업 동시 startInv 확장은 1 PR 1트랙 원칙(PD §운영 신념 5)을 위반하지 않는다 — 같은 구조 변경, 같은 검증 절차. PR8을 "직업 startInv cooking 입력 보강" 단일 트랙으로 묶는다.

**밸런스 권지나:**
> chef cooking AI 발동 가능성을 즉시 측정 가능한 형태로 만드는 유일한 옵션. instant_noodles ×2 = nutrition+30(생식) 또는 cooking 처리 시 cooked_noodles로 derive. **chef cooking lv 4 잠재력이 처음으로 시뮬 발동.** 측정값:
> - chef 단독 시 추정 K3 4.5 → 5.0~5.5 (격차 +2.0~2.5d로 확대)
> - **이는 baseline v3 chef +1.5d 합의(`BAL_TUNING_chef_grace.md` §4)를 깬다.** chef grace=7d/mult=0.5는 격차 +1.5d 가정 위에서 통과됨.
> - 따라서 6직업 균등 보강 시: 각 직업 startInv +2~3개. 직업별 cooking lv 차이(chef 4 / homeless 3 / pharmacist 1 / 나머지 0~1)가 K3 격차로 자연 분리. chef +1.5d 보호 가능.
>
> 한 PR 한 상수 원칙은 startInv 데이터 변경에 적용되지 않음 — `gameBalance.js`가 아니라 캐릭터 데이터. 6직업에 동일 패턴 변경이면 단일 변경으로 분류.
>
> A/B 시뮬 100회씩 + ±3%p 신뢰구간 baseline v4에서 검증 가능.

### 2.3 옵션 C — fishing landmark 접근 시 자동 fishing_rod_basic 지급

**대상 파일:** `js/data/landmarks.js` `hangang` (line 1677~1712), `js/data/items_tools.js` `fishing_rod_basic` (line 235)
**관련 BALANCE:** `gameBalance.js:326 fishing` (baseCatchChance 0.30, rodBasicBonus 0.00)
**관련 시스템:** ExploreSystem 랜드마크 진입 hook (구현 부재 — 신규 필요)

**PD 김재훈:**
> 의문 1개: **chef junggoo는 hasFishing이 없다** (`districts.js:820~845` 확인, hasFishing 키 부재). 인접 구 `yongsan`(line 717 hasFishing: true) 또는 `dongdaemun → seongdong` 경로 필요. yongsan 1 이동 = travelCostTP 2. day 1 chef encounter ×0.5 grace 보호 안에서 yongsan으로 이동 가능하지만, **이동 자체가 cook_intuition grace를 1일 소진**한다. baseline v3 chef 평균 사망 day 4.5 안에서 yongsan 도달 + rod 수령 + fishing TP 2 + 어획 0.30~0.70 확률 시도 — 도달은 가능하나 K1 효과는 marginal.
>
> 비용: landmarks.js 신규 필드(rewardOnEnter) + ExploreSystem 후크 + 시뮬 v2 actFish 트리거 — **시스템 페르소나 영역.** PD 협의서에서 코드 디테일 결정 금지. 영향 파일만 식별하고 위임.

**밸런스 권지나:**
> baseline v3 K3 평균 day 3(non-chef) — 이동 1 day + 어획 시도 1~2회 안에 사망. **non-chef 5직업의 K1에는 거의 영향 없음.** chef는 이미 K3 4.5d로 도달 시간이 있지만, 이동 자체가 chef 격차의 보호 자원(grace day 1을 이동에 소진)을 깎는다.
>
> baseline v3 사망 원인 K5: 탈수 20 / 극도 피로 1. 어획 1회 = fish_small 55%·fish_medium 45% (`SYS_PR7 §1.1`). nutrition 회복은 가능하나 **하루 0.30~0.45회 시도 + 성공률 30%** = 일일 nutrition 기댓값 ~10. chef 외 직업의 day 3 아사를 막기에 부족.
>
> 옵션 C는 **K1 영향 < 옵션 B**, **개발 비용 > 옵션 A**. baseline v4 결과가 옵션 A+B로 K1 10% 도달 실패 시 PR9로 보강.

---

## 3. 횡단 발견

### 3.1 옵션 A·B·C 공통 부작용 — 직업 정체성 흐림

세 옵션 모두 7직업에 동일 자원을 동일 분포로 끼얹는 방향. 직업별 startingSkills(`characters.js:58,129,193,255,327,389,452`) 차이가 cooking AI 발동 빈도로 자연 분리되지 않으면 **이슈 #2(6직업 비대칭 해소)** M3 트랙과 충돌. chef cooking=4 / homeless cooking=3 / pharmacist cooking=1 / 나머지 0~1의 격차가 K3에 반영되어야 함.

**완화:** 옵션 B 채택 시 직업별 startInv 추가 자원을 cooking lv가 높은 직업에 더 많이 배분 (chef +3, homeless +2, pharmacist +2, 나머지 +2 동일). cooking lv 보너스가 derive nutrition에서 자연 격차 형성.

### 3.2 chef +1.5d 격차 보호 (M2 합의)

`BAL_TUNING_chef_grace.md` §4: chef cook_intuition `days=7, mult=0.5`는 baseline v3 K3 +1.5d 격차 측정 후 통과. baseline v4에서 chef K3 격차 +2.5d 이상 → grace 단축 검토 트리거. PR8 후 baseline v4 측정 시 chef K3 monitoring 의무.

### 3.3 옵션 A의 generateDistrictLoot scavenging 미반영

`districts.js:897` 함수는 lootTable 가중치 단순 추첨. scavenging skill은 `ExploreSystem.js:424` 랜드마크 탐색에만 영향. **SYS_PR7 §6의 "scavenging skill로 활성화"는 부정확한 표현.** 옵션 A는 직업 균등 분포로 작용 → chef 격차 보호 중립이지만 homeless 등 scavenging 특화 직업의 정체성도 살리지 못함.

---

## 4. 결정

**채택: 옵션 B(축소판 6직업 균등) + 옵션 A(시작 7구 한정) 병행. 옵션 C는 PR9 보류.**

- **PR8 단일 트랙:** "직업 startInv cooking 입력 보강 + 시작 구 lootTable raw food 가중치 추가"
- **양 페르소나 합의 도출.**

**근거 3줄:**
1. 옵션 B 단독은 chef +1.5d 격차를 깰 위험이 있어 6직업 균등 보강이 필수. 옵션 A는 단독으로 K1 ↑ 효과가 0~5%p로 불확실하지만, 옵션 B의 startInv 소진 후(day 2~3) 채집으로 이어지는 흐름 보강.
2. 옵션 C는 chef junggoo가 hasFishing 미보유여서 1 day 이동 비용이 grace 1일을 소진. baseline v3 day 3 사망 평균 내에서 fishing 회수 가능 회차 < 30%. 비용 대비 K1 효과 marginal.
3. 옵션 B + A는 단일 PR8 머지 가능 (`characters.js` 1파일 + `districts.js` 1파일). 일정·검증·회귀 모두 D+2 안에 처리. baseline v4 결과로 옵션 C 추가 여부 판단.

---

## 5. 실행 계획

### 5.1 옵션 B 구체 수치 (6직업 startInv +2~3개)

| 직업 | 현재 startInv (ability별) | PR8 추가 | 합계 |
|------|--------------------------|----------|------|
| chef (`characters.js:316`) | knife + canned_food×2 + preserved_ration | **instant_noodles ×2 + contaminated_water ×1** | 7 |
| doctor (`characters.js:55`) | bandage×4 + antiseptic + stethoscope + combat_scalpel + canned_food×2 + energy_bar×2 (12개) | **instant_noodles ×1 + contaminated_water ×1** | 14 |
| soldier (`characters.js:119`) | knife + alcohol_swab×2 + bandage (4개) | **instant_noodles ×2 + contaminated_water ×1** | 7 |
| firefighter (`characters.js:190`) | rope + hand_axe (2개) | **instant_noodles ×2 + contaminated_water ×2** | 6 |
| homeless (`characters.js:252`) | battered_can + old_blanket + newspaper_bundle + box_cutter (4개) | **instant_noodles ×2 + contaminated_water ×2** | 8 |
| engineer (`characters.js:386`) | scrap_metal + wire (2개) | **instant_noodles ×2 + contaminated_water ×2** | 6 |
| pharmacist (`characters.js:428`) | painkiller + antiseptic×2 + bandage (4개) | **instant_noodles ×2 + contaminated_water ×1** | 7 |

chef 추가량은 **다른 5직업 동일 +3 vs chef 동일 +3** 형태로 균등. doctor만 startInv 12개 기보유로 +2 보강. cooking lv 격차(chef 4 / homeless 3 / pharmacist 1 / 나머지 0~1)가 derive nutrition에서 자연 분리.

**필수 동반 검증 (`CLAUDE.md §3` 규칙):**
- `js/data/stackConfig.js`: `instant_noodles`(line 62, stack 10) 등록 확인 완료. `contaminated_water` 등록 확인 의무.
- `js/data/items_base.js:442` `instant_noodles` 정의 확인 완료.
- 신규 아이템 추가 없음 → CARD_IMAGES 추가 불필요.

### 5.2 옵션 A 구체 가중치 (시작 7구 한정, dobong 제외)

| 구 | 직업 | 현재 가중치 합 | PR8 추가 |
|----|------|---------------|----------|
| junggoo (`districts.js:820`) | chef | 109 | herb +8, wild_berry +6 |
| gangnam (`districts.js:19`) | pharmacist | ~143 (herb 8 기보유) | wild_berry +6 |
| dongjak (`districts.js:425`) | doctor | 큼 (wild_garlic·dandelion 기보유) | herb +6 |
| dobong (`districts.js:342`) | soldier | 매우 큼 (herb 20·wild_berry 12 기보유) | **추가 없음 — 정체성 보호** |
| eunpyeong (`districts.js:743`) | firefighter | 미확인 | herb +8 (확인 후) |
| gwangjin (`districts.js:195`) | homeless | 큼 (wild_berry 6 기보유) | wild_berry +6 |
| yongsan (`districts.js:713`) | engineer | 미확인 | herb +6 (확인 후) |

**가중치 추가 원칙:** 기존 가중치 합 대비 6~13% 비중. PR5.5 채집 AI 일일 3회 × 1~3개 = 3~9회 추첨에서 raw cooking 입력 기댓값 0.2~0.6개/일.

### 5.3 영향 파일 목록 (총 2개)

1. `js/data/characters.js` (6직업 ability `effect.startingItems` 배열)
2. `js/data/districts.js` (6 시작 구 lootTable, dobong 제외)

### 5.4 검증 절차

1. `node --input-type=module js/data/validate.js` — Errors 0
2. `node tools/sim/v2/run_baseline.mjs` — 700 runs / 결정성 fingerprint 유지 / `BAL_SIM_baseline_v4_result.json` 생성
3. probe: chef 회차에서 actCook 발동 횟수 ≥ 1/day 확인
4. probe: actBoostMorale 발동 빈도 측정 (현재 < 1)

### 5.5 회귀 KPI

| KPI | baseline v3 | baseline v4 목표 |
|-----|-------------|------------------|
| K1 (100일 생존율) | 0.00% (전 직업) | ≥ 5% (chef 우선) — 10% 미달 시 PR9 옵션 C 추가 트리거 |
| K3 (사망 평균일) | doctor 4 / chef 4.5 / 5직업 3 | chef +1.5d 격차 유지 (chef 5.0~5.5 / 5직업 3.5 이내) |
| K3 chef 격차 | +1.5d | **+1.0d ~ +2.0d 범위 사수** — 이탈 시 cook_intuition grace 재검토 |
| K5 아사 | 569/700 | ↓ (chef 회차에서 -50% 기대) |
| 직업 격차 (K1 max-min) | 0%p | ≤ 5%p (밸런스 §3 회귀 검사) |

---

## 6. 위험과 완화

### 6.1 baseline v4 K1 < 5% 시 폴백

**트리거:** chef K1 5% 미만 / 다른 직업 K1 0% 유지.
**폴백 1:** PR9 옵션 C — yongsan·gangnam·gwangjin·dongjak·dongdaemun(시작 구 인접 hasFishing 구) 진입 시 fishing_rod_basic 자동 지급. 영향 파일: `js/data/landmarks.js` hangang sublocation rewardOnEnter 신규 필드 (시스템 위임).
**폴백 2:** PR10 옵션 A 확대 — 25 구 전수 raw food 가중치 추가. 단 직업 격차 보호 검토 의무.

### 6.2 K3 chef 격차 +2.5d 초과 시

**트리거:** chef K3 격차 baseline v4에서 +2.5d 이상.
**완화:** `BAL_TUNING_chef_grace.md` §4에 따라 cook_intuition `days = 7 → 5` 단축 검토. 단일 상수 변경 PR로 분리.

### 6.3 옵션 B 직업 비대칭 P1 재발

**트리거:** PR8 후 직업별 startInv 격차 측정에서 chef·doctor가 다른 직업 대비 K1 +10%p 이상 격차.
**완화:** 5직업 Tier-2 abilities (M3 시나리오 트랙 `SCN_QUEST_*tier2.md`) 작업과 startInv 균등화 동시 진행. PD 트랙 분배 재조율.

---

## 7. 다음 단계

| 순위 | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | PR8 머지 (`characters.js` + `districts.js` 데이터 변경) | 시스템 백승호 | PD 결정 직후 |
| **2** | validate.js 회귀 검증 | 시스템 백승호 | PR8 PR 생성 시 |
| **3** | baseline v4 측정 및 보고 | 밸런스 권지나 | PR8 머지 D+1 |
| 4 | baseline v4 결과로 옵션 C(PR9) 진입 여부 판단 | PD 김재훈 + 밸런스 | baseline v4 보고 D+0 |
| 5 | chef cook_intuition grace 수치 재검토 (K3 격차 ±0.5d 이탈 시) | 밸런스 권지나 | baseline v4 보고 D+0 |
| 6 | 5직업 Tier-2 abilities 신설 — 직업 격차 자연 분리 강화 | 시나리오 한도연 | M3 진입 |

**머지 순서 (PD 원칙: 데이터 → 메커닉 → 시각 → 밸런스 튜닝):**
1. PR8 데이터 (옵션 A+B) → 2. baseline v4 측정 → 3. (필요 시) PR9 옵션 C 시스템 후크 → 4. (필요 시) cook_intuition 단일 상수 튜닝 PR.

---

*문서 끝. baseline v4 결과 도착 시 본 문서 §5.5 KPI 표 업데이트 + 옵션 C 트리거 결정.*
