# PD·Balance 합동 협의 — PR11 결정 (v4)

> 작성: PD 김재훈 + 밸런스 권지나 / 2026-05-11
> 목적: PR10 머지(`d34a03d`) 후 baseline v6 측정(`BAL_SIM_baseline_v6_report.md`) 결과를 입력으로 PR11 옵션 결정 + 25구 lootTable 사양 + `generateDistrictLoot()` scavenging 재검증 + M3 #14 진입 시점 + R10-1·R8-1 우선순위 합의.
> 결정: **PR11 = 옵션 2 단독 채택 — 25구 lootTable에 `herb`·`wild_berry`·`vegetable` raw food 가중치 추가(PR8 6구 패턴 25구 확대, dobong/dongdaemun 위험 구역은 가중치 절반). 옵션 1(`fishing.baseCatchChance` 상향)은 PR12로 분리 — baseline v7 K1 < 5% 유지 시 진입. M3 #14(interactions.js T1 시뮬 모사)는 시스템 백승호 분리 트랙으로 PR11 머지와 동시 가능 (PD 1 PR 1 트랙 위반 아님 — 데이터 PR vs 시뮬 로직 PR로 트랙 분리). R10-1 + R8-1 결합으로 M3 #10 시나리오 한도연 트랙 우선순위 상향 — baseline v7 측정 D+0 진입 의무.**

---

## 1. 서두

- **참여 페르소나:** PD 김재훈 (프로덕션·우선순위·트레이드오프·머지 순서), 밸런스 권지나 (`gameBalance.js` 단일 진리 / 100회 시뮬 / K1 10~20% / fingerprint 결정성)
- **안건 5건:**
  1. PR11 진입 옵션 결정 (옵션 2 vs 옵션 1 vs 병행 vs M3 #14 우선)
  2. 옵션 2 채택 시 25구 lootTable 사양 (PD/Balance 결정 가능 수치 vs 시스템 위임)
  3. `generateDistrictLoot()` scavenging skill 반영 재검증 (협의서 v1 §3.3 + v3 §12.3 재인용)
  4. M3 #14 (interactions.js T1 시뮬 모사) 진입 시점
  5. R10-1 (절망 +25) + R8-1 (homeless·engineer actBoostMorale 0%) 결합 — M3 #10 우선순위

### 1.1 협의서 v3 §12 보강 회의록 결과 요약

`PD_BAL_MEETING_PR10_decision.md` §12:
- 시나리오 γ 신규 단정 (게임 본체 cooking 자동 추천 부재). α/β 양분 폐기
- PR10 needs-aware 산식 머지 (`tools/sim/v2/playerAI.mjs:172-201`)
- §9.5 KPI 재정의: "5직업 ≥50%" → "**cooking lv ≥1 직업 ≥50%**"
- §10.6 GameState 경로 정정: `player.nutrition` → `stats.nutrition`
- R10-1 신규 등록 (절망 사망 +25)
- §12.8 다음 단계: PR11 옵션 결정 협의 + M3 #14·#15 분리 트랙

### 1.2 baseline v6 핵심 수치 (`BAL_SIM_baseline_v6_report.md` 인용)

- 700 runs, fingerprint `len316-h242a5b5f`, buildTag `sim-baseline-v6-pr10`, bootstrapErrors 0/700, 7.9초
- **K1 0.00% × 7직업 (8회 연속 0%)**: PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10
- K3: doctor 4.00 / soldier 3.00 / firefighter 3.00 / **homeless 4.10 (v5 3.20 → +0.9d, PR10 직접 효과)** / chef 5.20 / engineer 3.10 / pharmacist 4.10
- chef 격차 (정의 1) +1.80d / (정의 2) +1.94d — 협의서 §6.2 +2.5d 트리거 미충족 유지
- K5: 아사 510 (-22) / 절망 167 (+25, **R10-1**) / 탈수 14 (0) / 극도 피로 9 (-3)
- cookOut nutFood (cooking lv ≥1 직업): chef 100% / pharmacist 100% / **homeless 35.3%** (v5 6.5% → +28.8%p, KPI ≥50% 미달)
- cookOut nutFood (cooking lv 0 4직업): 0% (cook_noodles blueprint 잠금 — KPI 재정의로 면제)

### 1.3 협의서 v3 §12 PR11 트리거 충족 단언

협의서 v3 §12.8 (보강 회의록 다음 단계) + baseline v6 §9.1 + §10:
- baseline v6 측정에서 **K1 < 5% 8회 연속** — PR11 폴백 트리거 충족 확정
- homeless K3 +0.9d 효과는 *4 hasFishing 직업 중 1직업만 측정 가능*. doctor·soldier·firefighter·engineer K1 0% 유지 → R9-1 v6 변화 0

**본 협의는 PR11 진입 결정 권한 + 옵션 2 사양 결정 권한 + M3 #14·#15 진입 시점 위임 권한을 가진다.**

---

## 2. 안건 1 — PR11 진입 옵션 결정

### 2.1 옵션 후보 매트릭스 (협의서 v3 §12.8 + baseline v6 §9.1 재검토)

| 옵션 | 변경 위치 | 영향 직업 | K1 향상 추정 | 직업 격차 위험 | 머지 우선순위 |
|------|----------|----------|------------|--------------|--------------|
| **2 (1차)** | `js/data/districts.js` 25구 lootTable raw food 가중치 추가 | **7직업 동시** | K1 +3~10%p 추정 (chef·homeless·pharmacist 향상) | 낮음 (구 단위 균등) | 데이터 PR — PD 원칙 1순위 |
| 1 (2차) | `js/data/gameBalance.js:328` `fishing.baseCatchChance` 0.30 → 0.50 | **4 hasFishing 직업만** | K3 +0.5~1d (4직업), K1 +2~5%p 추정 | 중 (3 비-hasFishing 직업 격차 확대) | 단일 상수 PR — 후속 |
| 3 (최후) | `items.js` fish_small/medium `onConsume.nutrition` 상향 | 4 hasFishing 직업 + game 본체 fish 가치 재조정 | K1 +1~2%p 추정 | 중 (게임 본체 영향 큼) | 최후순위 |
| **M3 #14 (병행)** | `tools/sim/v2/playerAI.mjs` interactions.js T1 변환 모사 | cooking lv 0 4직업 | K3 +1~2d (4직업), K1 +5~15%p 추정 | 낮음 (시뮬 로컬) | 시뮬 로직 PR — PR11 동시 가능 |

### 2.2 PD 시각

**PD 김재훈:**
> 머지 순서 원칙 — 데이터 → 메커닉 → 시각 → 측정 → 밸런스 튜닝. PR11이 옵션 2를 채택하면 데이터 PR로 정석 머지 순서 정합.
>
> 옵션 2 vs 옵션 1 비교에서 옵션 2 우선 사유:
> 1. **7직업 동시 향상.** 옵션 1은 4 hasFishing 직업만 향상 → 3 비-hasFishing 직업(chef·soldier·firefighter) K1 0% 고착 시 직업 격차 5%p 초과 위험. 협의서 v1 §3.1 "직업 정체성 흐림 방지" 가드와 충돌
> 2. **데이터 PR 정석.** PR8 패턴(6 시작 구 lootTable 가중치)을 25구로 확대 → 일관된 보강 방향. 시뮬 검증 부담 낮음 (fingerprint 무관)
> 3. **PR9 효과의 자연 보완.** 옵션 1은 PR9가 활성화한 fishing 흐름을 추가 강화하는 형태인데, R9-1 v6 변화 0이 단정된 이상 fishing 흐름 강화 자체가 1차 도구가 아님을 시사. 옵션 2가 cooking 흐름(actCook needs-aware 활성화)을 자원 측면에서 보완하는 정합 방향
>
> M3 #14는 흥미로운 옵션. cooking lv 0 4직업이 cook_noodles 잠금으로 nutritionFood 산출 0인 상태를 시뮬이 모사하지 않는 *interactions.js T1 변환 규칙*으로 우회 가능. 다만 시뮬 로직 PR이라 BALANCE 미관여 + 게임 본체 동작과 정합 검증 필요. PR11 데이터 PR과 트랙 분리이므로 1 PR 1 트랙 원칙에 위배되지 않음 → 동시 진행 가능. 단 baseline v7 측정 시 두 PR 영향 분리 측정이 어려움 — 본 협의에서는 **M3 #14를 PR11 후 별도 트랙**으로 분리 권고. baseline v7 측정 후 M3 #14 진입 시 baseline v8에서 T1 모사 효과 단독 측정 가능
>
> 옵션 3은 게임 본체 fish 가치 재조정이라 영향 범위가 크다 — 최후순위 유지.

### 2.3 밸런스 시각

**밸런스 권지나:**
> baseline v6 측정 기반 옵션 2 K1 향상 추정.
>
> **옵션 2 K1 효과 추정 — herb·wild_berry·vegetable raw food 가중치 25구 확대:**
> - 현재 `js/data/districts.js`에서 herb·wild_berry는 PR8로 6 시작 구에 가중치 추가됨 (각 1.0 가중치)
> - 25구 전수 확대 시 모든 직업의 `actExplore` 결과 → `actCook` 입력으로 raw food 가용성 향상
> - cooking lv ≥1 직업 (chef·pharmacist·homeless):
>   - chef cooking lv 4: herb·wild_berry·vegetable 모두 `cook_*_dish` blueprint 입력 충족. K3 5.2 → 6.5~7.0 추정 (격차 보호 유리)
>   - pharmacist cooking lv 1: `cook_noodles` 기존 산출 유지 + 추가 raw food 입력으로 cook_vegetable_dish 등 산출. K3 4.1 → 5.5~6.5 추정
>   - homeless cooking lv 3: needs-aware 산식 활성화 빈도 ↑. K3 4.1 → 6.0~7.0 추정 (35.3% → 60%+ nutFood 산출)
> - cooking lv 0 4직업 (doctor·soldier·firefighter·engineer):
>   - cooking lv 0은 `cook_noodles`·`cook_vegetable_dish` 등 requiredSkills.cooking ≥ 1 blueprint 잠금 유지
>   - 단 herb·vegetable은 raw 상태로도 `onConsume.nutrition` 보유 (items.js 확인 필요 — 시스템 위임)
>   - actEat에서 herb·wild_berry·vegetable 직접 섭취 시 nutrition +5~15 추정. K3 +0.5~1d 추정
> - **K1 5% 도달 가능성:** chef·pharmacist·homeless 중 1직업 이상 도달 추정. K1 신뢰구간 5~12%
>
> **옵션 1 K1 효과 추정 — `fishing.baseCatchChance` 0.30 → 0.50:**
> - 4 hasFishing 직업 fishing 1회 영양 기댓값: 0.30 × 10 = 3 → 0.50 × 10 = 5 (+2/회)
> - 일일 fishing 1~2회 → 일일 net 회복량 +2~4 추가 → K3 +0.5d 추정
> - K1 향상 +2~5%p 추정 — **옵션 2보다 효과 작고 4직업만 향상**
>
> 옵션 2가 K1 신뢰구간 + 7직업 동시 향상 측면에서 우위. 옵션 1 채택 시 직업 격차 5%p 초과 위험으로 회귀 검사 발동 가능.
>
> M3 #14 동시 진행은 baseline v7 단일 측정에서 두 PR 효과 분리 어려움이라 PR11 머지 + v7 측정 → M3 #14 머지 + v8 측정 순서 권고. PD 김재훈 분리 권고와 동일.
>
> **옵션 2 단독 채택 + M3 #14 분리 트랙에 합의.**

### 2.4 결정 — 안건 1

**PR11 = 옵션 2 단독 채택.** `js/data/districts.js` 25구 lootTable에 raw food 가중치 추가.

- **양 페르소나 합의 도출.**
- 옵션 1은 PR12로 분리 — baseline v7 K1 < 5% 유지 시 진입
- 옵션 3은 최후순위 (PR13+) — fish 영양 상향은 게임 본체 영향 큼
- M3 #14는 PR11 머지 + baseline v7 측정 후 별도 트랙 (v8 측정에서 T1 모사 효과 단독 측정)

---

## 3. 안건 2 — 옵션 2 25구 lootTable 사양

### 3.1 PD/Balance 결정 가능 수치 (가중치 + 위험 구역 절반)

baseline v6 측정에서 K5 절망 +25 (R10-1)가 관측된 만큼 raw food 보강이 다른 부작용을 초래할 가능성도 고려. 위험 구역(dobong·dongdaemun 등 dangerLevel ≥ 3)은 가중치를 절반으로 적용해 게임 정체성 보호.

**PD/Balance 결정 사양:**

| 항목 | 결정값 | 사유 |
|------|--------|------|
| 추가 raw food 종류 | `herb`, `wild_berry`, `vegetable` (3종) | PR8 6구 패턴(herb·wild_berry 2종) 확대 + vegetable 신규 추가 (cooking 입력 다양화) |
| 일반 구역 (dangerLevel ≤ 2) 가중치 | 각 1.0 (PR8 동일) | herb·wild_berry는 PR8 패턴 유지, vegetable 신규 1.0 |
| 위험 구역 (dangerLevel ≥ 3) 가중치 | 각 0.5 | 위험 구역은 raw food 채집이 어려운 환경 정합. 직업 정체성·환경 정합 양립 |
| dobong (chef startDistrict 인접) 가중치 | 0.5 (위험 구역 적용) | PR8 dobong 제외 결정 유지 + 위험 구역 0.5 적용 |
| 적용 구 | 25구 전수 (현 6구 + 신규 19구) | 7직업 startDistrict 모두 커버 + 인접 구 커버 |
| minQty / maxQty | 1 / 2 (raw food 표준) | PR8 패턴 유지 |
| contamChance | 0 (raw food는 부패 위험 별도) | PR8 패턴 유지 |

### 3.2 시스템 백승호 위임 영역

본 협의서는 *데이터 사양*을 결정한다 — 가중치 값·구 분류·raw food 종류. 다음은 시스템 백승호 위임:

| 위임 항목 | 사유 |
|----------|------|
| `js/data/districts.js` 25구 lootTable 항목 추가 (위치·구문) | 데이터 파일 구조 정합 결정 |
| dangerLevel 분류 — 각 구가 일반/위험 어느 쪽인가 | `districts.js` 실측 dangerLevel 인용 (밸런스가 명시 안 함) |
| `js/data/items_misc.js` 또는 등가에 `vegetable` 정의 확인 + onConsume.nutrition 값 확인 | items.js 단일 진리 검증 |
| validate.js Errors 0 + `node tools/sim/v2/run_baseline.mjs` fingerprint 유지 확인 | BALANCE leaf 추가 없음 단정 |
| stackConfig.js + CardFactory.js CARD_IMAGES 등록 검토 | 신규 아이템 추가 시 4곳 등록 룰 (CLAUDE.md §3 적용 여부 확인 — vegetable 기존 아이템이면 미적용) |

---

## 4. 안건 3 — `generateDistrictLoot()` scavenging skill 반영 재검증

### 4.1 협의서 v1 §3.3 + v3 §12.3 단정 재인용

협의서 v1 §3.3 + v3 §12.3:
> `js/data/districts.js:902 generateDistrictLoot()`이 scavenging skill 미반영 → 옵션 A(=옵션 2)는 직업 균등 분포로 작용

baseline v6 측정 후 본 협의에서 코드 재확인 (`js/data/districts.js:902-927`):

```js
function generateDistrictLoot(districtId) {
  const district = DISTRICTS[districtId];
  if (!district?.lootTable?.length) return [];

  const results = [];
  const totalWeight = district.lootTable.reduce((s, e) => s + e.weight, 0);
  const count = BALANCE.explore.lootCountMin + Math.floor(Math.random() * (BALANCE.explore.lootCountMax - BALANCE.explore.lootCountMin + 1));
  // ... weighted random selection only
}
```

**단정:**
- count 결정: `BALANCE.explore.lootCountMin/Max` (1~3개 추정). **scavenging skill 미반영 확정**
- weight 선택: weighted random. **scavenging skill 미반영 확정**
- contamChance: lootTable entry 정의. scavenging 미관여

### 4.2 결정 — 안건 3

**옵션 2는 7직업 균등 분포로 작용. 직업 격차 보호 정합. PR11 진입에 결격 없음.**

- **양 페르소나 합의 도출.**
- scavenging skill 반영 도입은 별도 트랙으로 분리 — M3 후반 또는 M4+ 검토 (scavenging skill ≥ 1 직업이 7직업 중 누구인가 확인 후 결정). 본 협의 영역 밖
- PR11 머지 후 baseline v7에서 7직업 actExplore 결과 raw food 산출량 측정 → 균등 분포 단정 확인 의무 (밸런스 권지나)

---

## 5. 안건 4 — M3 #14 (interactions.js T1 시뮬 모사) 진입 시점

### 5.1 M3 #14 의의 재인용

협의서 v3 §12.3:
> cooking lv 0 4직업(doctor·soldier·firefighter·engineer)은 `cook_noodles` blueprint(`requiredSkills.cooking: 1`) 잠금으로 nutritionFood 산출 0. 게임 본체에서는 `interactions.js` T1 변환 규칙(예: `instant_noodles` + `boiled_water` → `cooked_noodles`)으로 우회 가능하나 시뮬은 모사 안 함.

M3 #14 = `tools/sim/v2/playerAI.mjs` 또는 등가에 T1 변환 모사 추가 → cooking lv 0 4직업이 cooked_noodles 산출 경로 확보.

### 5.2 PD 시각

**PD 김재훈:**
> M3 #14 진입 시점 후보:
> 1. **PR11과 동시 진행** — 데이터 PR + 시뮬 로직 PR 분리이므로 1 PR 1 트랙 원칙 위배 아님. 단 baseline v7 측정 시 두 PR 효과 분리 어려움
> 2. **PR11 머지 + v7 측정 후** — PR11 데이터 효과 단독 측정 → M3 #14 머지 → v8에서 T1 모사 효과 단독 측정. 측정 신뢰성 ↑
> 3. **PR12 후 또는 M3 마감 시 최후** — 측정 우선순위 후순위
>
> 권고 (2). 측정 신뢰성이 결정 신뢰성의 입력. PR11 → v7 → M3 #14 → v8 순서가 PD 원칙(측정 도구 → 데이터 → 메커닉 → 측정 → 밸런스 튜닝) 5단계 그대로 확장.

### 5.3 밸런스 시각

**밸런스 권지나:**
> 동의. baseline v6 측정에서 PR10(measurement tool) 효과가 homeless 1직업만 측정 가능했던 결과를 보면 분리 측정 가치는 명확. 또한 M3 #14는 `interactions.js` T1 변환 규칙 read-only 인용이라 게임 본체 결정성 영향 0 (시뮬 로컬 변경).
>
> 측정 분리에 합의.

### 5.4 결정 — 안건 4

**M3 #14는 PR11 머지 + baseline v7 측정 후 분리 트랙 진입.** v8 측정에서 T1 모사 효과 단독 측정.

- **양 페르소나 합의 도출.**
- M3 #14 위임: 시스템 백승호 (시뮬 로직 PR)
- 진입 트리거: baseline v7 측정 D+0
- 의존성 0 — PR11 결과와 무관하게 진입 가능 (T1 변환 규칙은 baseline v6 측정에서 이미 cooking lv 0 4직업 K3 정체 원인으로 단정됨)

---

## 6. 안건 5 — R10-1 + R8-1 결합, M3 #10 우선순위 상향

### 6.1 R10-1 + R8-1 결합 의의 (baseline v6 §10 인용)

`BAL_SIM_baseline_v6_report.md` §10:
> R10-1 (신규 절망 사망 +25)는 사망일 연장 부산물. morale 회복 자원 부재(R8-1)와 결합으로 향후 K1 향상 PR마다 절망 사망 가속 가능

PR11 옵션 2가 K1 향상에 성공하면 사망일 연장 → morale 침식 시간 확보 → 절망 사망 추가 발생 위험. R8-1 (homeless·engineer actBoostMorale 0%)이 해소되지 않으면 K1 5% 마지노선 달성이 morale 사망으로 무효화될 위험.

### 6.2 PD 시각

**PD 김재훈:**
> M3 #10 (5직업 Tier-2 abilities, 시나리오 한도연 위임) 진입 트리거는 협의서 v3 §6.3에서 baseline v6 측정 D+0 진입 의무로 정해져 있었으나 v6 측정 시점에는 PR10 + 보강 회의록 작업으로 자연 지연됨.
>
> R10-1 신규 등록으로 우선순위 상향이 정합. baseline v7 측정 D+0에 시나리오 한도연 트랙 진입 의무로 갱신.

### 6.3 밸런스 시각

**밸런스 권지나:**
> R8-1 측정 강화 의무 — baseline v7에 morale 시계열 probe 신규 추가. 원인 1(morale 미도달) vs 2(회복 수단 부재) 단정 데이터 확보. M3 #10 시나리오 한도연 트랙의 morale 회복 자원 분배 결정의 입력.
>
> 측정 강화 + M3 #10 진입 동시 진행에 합의.

### 6.4 결정 — 안건 5

**M3 #10 우선순위 상향 — baseline v7 측정 D+0 시나리오 한도연 트랙 진입 의무.** baseline v7에 R8-1 morale 시계열 probe 신규 추가.

- **양 페르소나 합의 도출.**
- baseline v7 측정 의무 항목 (밸런스 권지나):
  1. `actExplore` 7직업 raw food 산출량 분포 (안건 3 균등 분포 단정 검증)
  2. R8-1 morale 시계열 — homeless·engineer day 1~5 morale.current 추이
  3. R10-1 절망 사망 추이 — v6 대비 +/- 변화 추적
- M3 #10 트랙 위임 시점: baseline v7 보고 D+0 (시나리오 한도연)

---

## 7. 횡단 발견

### 7.1 baseline v6 K3 변화 단정의 한계 — PR10 직접 효과 1직업

baseline v6에서 PR10 needs-aware 산식 효과는 homeless 1직업만 측정 가능 (+0.9d). cooking lv 0 4직업은 blueprint 잠금으로 변화 0, chef·pharmacist는 cooking lv 4·1로 v5에서 이미 cooked_noodles 100% 산출 — 회귀 0 (효과 변화 0).

**시사:**
- PR10은 *cooking lv ≥1 ~ ≤3 범위 직업*에서만 직접 효과 측정 가능 (현 게임 데이터에서는 homeless만 해당)
- 본 PR11 옵션 2가 7직업 동시 향상 효과를 가지면 baseline v7에서 7직업 K3 변화 측정 가능 — PR10 측정 한계 자연 해소
- M3 #14 진입 시 cooking lv 0 4직업 K3 변화 측정 가능 — PR10 한계 추가 해소

### 7.2 협의서 v3 §12.3 KPI 재정의가 PR11 결정에 미친 영향

§12.3 "cooking lv ≥1 직업 ≥50%" 정정 KPI는 cooking lv 0 직업의 nutritionFood 산출 미달을 *측정 영역 외*로 분리. PR11 옵션 2 채택 사유에서 옵션 1(fishing 단독 강화) 대비 옵션 2(raw food 7직업 균등)가 KPI 정합 측면에서 우위로 단정 가능 — KPI 재정의가 옵션 결정 신뢰도 ↑.

### 7.3 PR8 → PR9 → PR10 → PR11 누적 효과 추세

| PR | 측정 | K3 변화 누적 (chef 기준) | K3 변화 누적 (homeless 기준) |
|----|------|-----------------------|------------------------|
| PR7 (baseline v3) | 4.50 | 0 | 3.00 |
| PR8 (baseline v4) | 5.20 (+0.70d) | 0 |
| PR9 (baseline v5) | 5.20 (0) | 3.20 (+0.20d) |
| PR10 (baseline v6) | 5.20 (0) | **4.10 (+0.90d)** |
| PR11 (baseline v7 추정) | 5.5~7.0 | 5.0~6.5 |

추세선: PR11 후 chef·homeless 둘 다 K3 ≥ 5 도달 추정. K1 5% 마지노선이 chef·homeless 어느 쪽에서 먼저 깨질 가능성 — baseline v7 측정 시 단정.

---

## 8. 결정 종합

| 안건 | 결정 |
|------|------|
| 1. PR11 진입 옵션 | **옵션 2 단독 채택** — 25구 lootTable raw food 가중치 추가. 옵션 1은 PR12 폴백, 옵션 3은 최후순위 |
| 2. 옵션 2 사양 | herb·wild_berry·vegetable 3종 / 일반 구역 1.0 / 위험 구역(dangerLevel ≥ 3) 0.5 / dobong 0.5 / 25구 전수 / minQty 1·maxQty 2 / contamChance 0 |
| 3. `generateDistrictLoot()` scavenging | **미반영 단정 유지** — 7직업 균등 분포 작용. PR11 진입 결격 없음. scavenging 도입은 M4+ 별도 트랙 |
| 4. M3 #14 진입 시점 | **PR11 머지 + baseline v7 측정 후 분리 트랙** — v8에서 T1 모사 효과 단독 측정 |
| 5. R10-1 + R8-1 결합 / M3 #10 우선순위 | **상향** — baseline v7 측정 D+0 시나리오 한도연 진입 의무. v7에 R8-1 morale 시계열 probe 신규 추가 |

### 8.1 PR11 단일 트랙 정의

**PR11 = "25구 lootTable raw food 가중치 추가" 단일 데이터 트랙.** 영향 파일 1개(`js/data/districts.js`). 코드 디테일(가중치 적용 위치·dangerLevel 분류·신규 vegetable 정의 확인)은 시스템 백승호 위임.

---

## 9. 실행 계획

### 9.1 PR11 영향 파일

| 파일 | 영역 | 담당 |
|------|------|------|
| `js/data/districts.js` 25구 lootTable | herb·wild_berry·vegetable 가중치 추가 (일반 1.0 / 위험 0.5 / dobong 0.5) | 시스템 백승호 |
| `js/data/items_misc.js` 또는 등가 | `vegetable` 정의 + `onConsume.nutrition` 값 확인 (기존이면 미변경) | 시스템 백승호 (read-only 검증) |
| `js/data/stackConfig.js` + `js/ui/CardFactory.js` CARD_IMAGES | vegetable 기존 등록 여부 확인. 신규 아이템이면 4곳 등록 룰 적용 (CLAUDE.md §3) | 시스템 백승호 |
| `js/data/validate.js` | Errors 0 + ALL CLEAR | 시스템 백승호 |
| `tools/sim/v2/run_baseline.mjs` | `OUTPUT_FILE` / `buildTag` v6 → v7 2줄 변경 | 시스템 백승호 또는 밸런스 권지나 |

### 9.2 데이터 영역 (PD/Balance 결정 가능 수치)

§3.1 결정 사양 그대로 적용. 신규 결정 영역 없음.

### 9.3 시스템 백승호 위임 영역

- 25구 lootTable 항목 추가 코드 패치 (전체 25구 `lootTable` 배열에 entry 1~3건 추가)
- dangerLevel 분류 — districts.js `DISTRICTS[districtId].dangerLevel` 실측 인용
- vegetable 정의 존재 확인 + items.js 7 애그리게이터 중 어디에 등록되어야 하는지 결정
- validate.js + fingerprint 회귀 0 확인

### 9.4 검증 절차

1. `node --input-type=module js/data/validate.js` — Errors 0 / ALL CLEAR
2. `node tools/sim/v2/run_baseline.mjs` — 700 runs / fingerprint `len316-h242a5b5f` 유지 (BALANCE 미변경 단정) / `BAL_SIM_baseline_v7_result.json` 생성 / buildTag `sim-baseline-v7-pr11`
3. probe: 7직업 actExplore raw food 산출량 분포 측정 (안건 3 균등 분포 단정 검증)
4. probe: R8-1 morale 시계열 — homeless·engineer day 1~5 morale.current 추이 (안건 5)
5. probe: R10-1 절망 사망 v6→v7 변화 추적

### 9.5 KPI 갱신 (baseline v7 목표값)

| KPI | baseline v6 | baseline v7 목표 | 폴백 트리거 |
|-----|-------------|------------------|-----------|
| K1 (100일 생존율) | 0.00% (전 직업) | **≥ 5% (chef·pharmacist·homeless 중 1직업 이상)** | < 5% 시 PR12 옵션 1(`fishing.baseCatchChance` 0.30→0.50) 진입 |
| K3 chef | 5.20 | 5.5~7.0 (raw food + cooking lv 4 정합화) | +2.5d 초과 시 cook_intuition 단축 즉시 PR |
| K3 homeless | 4.10 | 5.0~6.5 (raw food + cooking lv 3 + needs-aware) | +0.5d 미달 시 옵션 2 효과 추가 분석 |
| K3 pharmacist | 4.10 | 5.0~6.5 (raw food + cooking lv 1 + cook_noodles 유지) | +0.5d 미달 시 옵션 2 효과 추가 분석 |
| K3 cooking lv 0 4직업 | 3.00/3.00/3.00/3.10 | +0.5~1d (raw 직접 섭취) | 변화 0 시 M3 #14 (T1 시뮬 모사) 진입 트리거 |
| cookOut nutFood (homeless lv 3) | 35.3% | ≥ 50% (정정 KPI) | 미달 시 추가 분석 |
| chef·pharmacist 회귀 | 0 | 0 유지 | 회귀 발생 시 즉시 원복 |
| 직업 격차 (K1 max-min) | 0%p | ≤ 5%p | 5%p 초과 시 회귀 검사 발동 |
| R8-1 morale 시계열 (homeless·engineer) | 미측정 | day 1~5 morale.current probe 신규 | morale<30 도달 0회 → 원인 1 / 1회 이상 → 원인 2 |
| R10-1 절망 사망 | 167 | v6 대비 +50 미만 | +50 초과 시 R8-1 트랙 가속 의무 |

---

## 10. 위험과 완화

### 10.1 PR11 후 baseline v7에서도 K1 < 5% 유지 시

**트리거:** baseline v7 측정에서 K1 모든 직업 < 5%.
**폴백:** PR12 = 옵션 1 (`js/data/gameBalance.js:328` `fishing.baseCatchChance` 0.30 → 0.50). 단일 상수 PR.
**폴백의 폴백:** M3 #14 (interactions.js T1 시뮬 모사) 우선 진입 — cooking lv 0 4직업 K3 +1~2d 추정으로 K1 5~15%p 향상 가능.

### 10.2 옵션 2가 R10-1 (절망 사망 +25) 가속 위험

**트리거:** baseline v7에서 절망 사망 +50 초과 (v6 167 → v7 217+).
**완화:** R8-1 트랙 (M3 #10 시나리오 한도연) 즉시 가속. homeless·engineer morale 회복 자원 분배가 baseline v8 시점에 머지되도록 일정 압축.

### 10.3 vegetable 정의 부재 시

**트리거:** `js/data/items_misc.js` 또는 등가에 `vegetable` 정의 0건.
**완화:** 시스템 백승호 위임 영역. 신규 아이템 추가 시 CLAUDE.md §3 4곳 등록 룰 (stackConfig + districts.js lootTable + CardFactory.js CARD_IMAGES + items_misc.js 정의) 적용. 기존 정의면 가중치 추가만.

### 10.4 dangerLevel 분류 모호 시 — 위험 구역 0.5 적용 직업 격차

**트리거:** dangerLevel ≥ 3 구역이 chef·soldier·firefighter startDistrict에 집중되면 옵션 2 효과가 chef·soldier·firefighter에 절반만 적용 → 직업 격차 위험 5%p 초과.
**완화:** 시스템 백승호가 25구 dangerLevel 인용 시 startDistrict 7직업과 매핑 표 작성 의무. 격차 위험 발견 시 본 협의 재개.

### 10.5 baseline v7 측정에서 fingerprint 변동 시

**트리거:** PR11 머지 후 `run_baseline.mjs` 출력 fingerprint가 `len316-h242a5b5f`에서 변경.
**원인 후보:** vegetable 신규 정의 시 BALANCE leaf 추가 가능성 또는 gameBalance.js 변경 누락.
**완화:** 시스템 백승호가 PR11 PR 생성 시 fingerprint 검증 의무. BALANCE 미변경 100% 통과 후 머지.

### 10.6 M3 #14 분리 진행이 R9-1 해소 지연

**트리거:** baseline v7 K1 < 5% 유지 + cooking lv 0 4직업 K3 변화 0 → M3 #14 진입까지 R9-1 해소 지연.
**완화:** PR11 머지 + baseline v7 측정 D+0에 M3 #14 즉시 진입. 시뮬 로직 PR 분량 작음 (T1 변환 read-only 인용 + actCook/actEat 흐름 1 분기 추가, 추정 50~100줄). M3 #14 머지 + baseline v8 측정까지 D+3 추정.

---

## 11. 다음 단계

| 순위 | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | PR11 옵션 2 구현 — `js/data/districts.js` 25구 lootTable raw food 가중치 추가 (§3.1 사양 그대로) | 시스템 백승호 | 본 협의서 결정 직후 |
| **2** | validate.js + fingerprint 회귀 검증 | 시스템 백승호 | PR11 PR 생성 시 |
| **3** | baseline v7 측정 및 보고 (`BAL_SIM_baseline_v7_report.md`) — actExplore raw food 분포 probe + R8-1 morale 시계열 probe + R10-1 절망 추이 probe 모두 포함 | 밸런스 권지나 | PR11 머지 D+1 |
| **4** | M3 #10 5직업 Tier-2 abilities 진입 — homeless·engineer morale 회복 자원 분배 (R8-1 측정 데이터 입력) | 시나리오 한도연 | baseline v7 측정 D+0 |
| 5 | M3 #14 interactions.js T1 시뮬 모사 — cooking lv 0 4직업 cooked_noodles 산출 경로 | 시스템 백승호 | baseline v7 측정 D+0 (M3 #10과 병행) |
| 6 | (조건부) PR12 — `fishing.baseCatchChance` 0.30 → 0.50 | 시스템 백승호 또는 밸런스 권지나 | baseline v7 보고 + K1 < 5% 단정 시 |
| 7 | (조건부) cook_intuition `days = 7 → 5` 단일 상수 PR | 밸런스 권지나 | v7/v8에서 chef 격차 +2.5d 초과 시 |
| 8 | M3 #15 AD UI 변경 권고 2건 (interactions.js hint + CraftUI 동시 비교 모드) | AD 오은별 | 독립 — 본 트랙과 의존 0 |

**머지 순서 (PD 원칙: 데이터 → 메커닉 → 시각 → 측정 → 밸런스 튜닝):**
1. PR11 데이터 (25구 lootTable) → 2. baseline v7 측정 → 3a. M3 #10 시나리오 (R8-1 해소) // 3b. M3 #14 시뮬 (T1 모사) 병행 → 4. baseline v8 측정 → 5. (필요 시) PR12 밸런스 튜닝 (baseCatchChance)

---

*문서 끝. baseline v7 측정 결과 도착 시 본 §9.5 KPI 비교 + R8-1 원인 단정 + R10-1 추이 단정 + PR12 진입 여부 결정. — 2026-05-11 충족. 갱신 사항은 §12 보강 회의록.*

---

## 12. 보강 회의록 (2026-05-11, PR11 구현 + baseline v7 1·2차 측정 직후)

> 참여: PD 김재훈 + 밸런스 권지나. 입력: PR11 옵션 2 구현 결과 (시스템 백승호) + baseline v7 1차 측정 + 가중치 재조정 + baseline v7 2차 측정.

### 12.1 PR11 가중치 사양 결함 단정 (1차 측정)

본 협의서 §3.1 가중치 사양 (일반 1.0 / 위험 0.5 / dobong 0.5)이 실제 `js/data/districts.js` 기존 entry 가중치 척도(`weight: 5`, `weight: 6`, `weight: 8`, `weight: 15` 등 정수 5~15)와 1~2자리수 차이.

**baseline v7 1차 측정 결과** (가중치 1.0/0.5 적용):
- K1: 7직업 모두 0.00% (v6 대비 변화 0)
- K3: 모든 직업 mean·median 변화 0
- K5: 아사 510 (v6 대비 0) / 절망 169 (+2) / 탈수 14 (0) / 극도 피로 9 (0)
- probe actExplore: vegetable 산출 0~4개/300 탐색 (weight 1.0이 기존 entry 5~15 대비 1/5~1/15 척도)

**단정:** 가중치 1.0/0.5는 `generateDistrictLoot()` weighted random에서 선택 확률 1~3% 수준이라 PR11 의도(7직업 nutrition 보강)와 측정 가능 효과 사이의 격차 발생. 사양 결함.

### 12.2 가중치 척도 재조정 (PD/Balance 합의)

| 항목 | 1차 사양 | 정정 사양 |
|------|---------|---------|
| 일반 구역 (dangerLevel ≤ 2) | 1.0 | **8** |
| 위험 구역 (dangerLevel ≥ 3) | 0.5 | **4** |
| dobong 강제 | 0.5 | **4** |
| 기존 entry 가중치 변경 | 0 | **0** (PR8 entry 유지) |

**근거:**
- 기존 entry 가중치 척도(5~15)와 1/2~1/4 수준 정합
- raw food 선택률 약 20~30% 추정 (1차 1~3% 대비 10배)
- chef·pharmacist·homeless K3 +1d 이상 향상 추정 (1차 변화 0 대비 측정 가능 효과 확보)

**PD 김재훈:**
> 1차 측정에서 사양 결함 노출. 협의서 v4 §3.1을 정정하지 않으면 PR11 의도 자체가 무의미. 다만 PD 1 PR 1 트랙 원칙에 따라 PR11을 롤백·재머지하기보다는 본 보강 회의록으로 사양 정정 단정 + districts.js 가중치 일괄 변경 + 재측정으로 처리. PR11 PR 자체는 유지.

**밸런스 권지나:**
> 8/4 척도는 기존 entry와 정합. 가중치 5~15 척도가 game balance 측면에서 합리적이라면 raw food도 동일 척도라야 자연 분포. 합의.

### 12.3 baseline v7 2차 측정 결과 (가중치 8/4 적용 후)

```
fingerprint: len316-h242a5b5f 유지 (BALANCE 미변경 확정)
bootstrapErrors: 0/700
실행 시간: 7~8초
```

| KPI | v6 | v7 1차 (1.0/0.5) | v7 2차 (8/4) | Δ (1차→2차) | 협의서 §9.5 목표 |
|-----|----|----|---|---|---|
| K1 (전 직업) | 0% | 0% | **0%** | 0 | ≥ 5% |
| K3 doctor | 4.0 | 4.0 | 4.0 | 0 | +1d (5.0) |
| K3 soldier | 3.0 | 3.0 | 3.0 | 0 | +0.5~1d |
| K3 firefighter | 3.0 | 3.0 | 3.0 | 0 | +0.5~1d |
| K3 homeless | 4.1 | 4.1 | **4.1** | 0 | 5.0~6.5 |
| K3 chef | 5.2 | 5.2 | **5.2** | 0 | 5.5~7.0 |
| K3 engineer | 3.1 | 3.1 | 3.1 | 0 | +0.5~1d |
| K3 pharmacist | 4.1 | 4.1 | **4.1** | 0 | 5.0~6.5 |
| K5 아사 | 532 | 510 | **506** | **-4** | ↓ |
| K5 절망 | 142 | 169 | **173** | **+4** | ≤ +50 |
| K5 탈수 | 14 | 14 | 12 | -2 | ↓ |
| K5 극도 피로 | 12 | 9 | 9 | 0 | ≤ 10 |

**핵심 단정:**
- K1·K3 7직업 모두 v6 대비 변화 0. PR11 가중치 8/4로 raw food 선택률은 향상됐으나 K1·K3에 측정 가능 효과 0
- K5 미세 변화 (아사 -4, 절망 +4, 탈수 -2)는 측정 noise 수준
- fingerprint 유지로 BALANCE 미변경 정합

### 12.4 PR11 효과 0 원인 단정 — 더 본질적 결함 노출

가중치 척도 정합화에도 효과 0인 사실은 PR11 옵션 2의 *설계 자체*가 K1·K3 향상에 부적합함을 단정한다. 원인 후보:

| 원인 | 단정 근거 | 검증 방법 |
|------|----------|----------|
| 1. cooking lv 0 4직업 actCook 잠금 | `cook_noodles` `requiredSkills.cooking: 1` 잠금 유지 — raw food 산출 향상해도 actCook 가공 불가 | probe actCook input — vegetable·herb 사용 회수 |
| 2. actEat 우선순위 — raw food 후순위 | actEat AI가 raw food보다 cooked·canned 우선 섭취 가능성 | probe actEat input — raw food 직접 섭취 회수 |
| 3. cooking lv ≥1 직업도 cooked_noodles 충분 | chef·pharmacist는 이미 v6에서 cooked_noodles 100% 산출 — 추가 raw 입력은 중복 | v6 cooked_noodles 산출 데이터 인용 |
| 4. raw food 영양 회복량 < 일일 decay | vegetable nutrition +12 / herb +5 추정 — 일일 decay 36 대비 작음 | items.js 인용 |

**PD 김재훈:**
> PR11 옵션 2 설계 결함 후보 4건 중 (1)·(3)이 본질적 — *cooking lv 0 직업은 raw food를 가공 못 하고, cooking lv ≥1 직업은 이미 충분*. 즉 PR11은 양극단 직업 모두에 효과 0인 구조. 이는 협의서 v3 §12.3 KPI 재정의 ("cooking lv ≥1 직업 ≥50%")가 이미 cooking lv 0 4직업 변화 0을 예측한 결과와 정합.
>
> **핵심 결론:** PR11 옵션 2 대신 폴백 트랙 — **PR12 (`fishing.baseCatchChance` 상향) + M3 #14 (interactions.js T1 시뮬 모사) 병행 진입**이 K1·K3 향상의 본질적 경로. PR11 자체는 측정 도구 정합화(actExplore raw food 분포 균등) 및 미래 cooking 입력 다양화를 위한 *기반 PR*로 머지 유지.

**밸런스 권지나:**
> 동의. R8-1 원인 2 단정 (1차 측정 probe 2 — homeless·engineer day 2 morale 12~13 급락)도 PR11 후 변화 0 유지. M3 #10 시나리오 한도연 트랙 우선순위 상향 단정도 변화 없음.
>
> PR11은 머지 유지 + PR12·M3 #14 즉시 병행 진입에 합의.

### 12.5 폴백 트리거 충족 단언

협의서 v4 §10.1: "baseline v7 측정에서 K1 모든 직업 < 5%" → PR12 진입 트리거 충족.
협의서 v3 §12.3 KPI: "cooking lv 0 4직업 K3 변화 0" → M3 #14 진입 트리거 충족.

**PR12 + M3 #14 동시 진입 결정.** PR11 1 PR 1 트랙 원칙 위배 아님 — PR12는 `gameBalance.js` 단일 상수, M3 #14는 시뮬 로직. 트랙 영역 분리.

### 12.6 §11 다음 단계 갱신

기존 §11 표 폐기 + 신규 우선순위:

| 순위 (갱신) | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | PR12 = `fishing.baseCatchChance` 0.30 → 0.50 — `js/data/gameBalance.js:328` 단일 상수 PR | 밸런스 권지나 | 본 보강 회의록 채택 직후 |
| **2** | M3 #14b = `tools/sim/v2/playerAI.mjs` interactions.js T1 변환 모사 — cooking lv 0 4직업 cooked_noodles 산출 경로 | 시스템 백승호 | 본 보강 회의록 채택 직후 (PR12와 병행) |
| **3** | baseline v8 측정 (`BAL_SIM_baseline_v8_report.md`) — PR12 + M3 #14 합산 효과 측정 | 밸런스 권지나 | PR12 + M3 #14 머지 D+1 |
| **4** | M3 #10 5직업 Tier-2 abilities — homeless·engineer morale 회복 자원 분배 (R8-1 원인 2 단정 입력) | 시나리오 한도연 | baseline v8 측정 D+0 |
| 5 | (조건부) cook_intuition 단축 단일 상수 PR | 밸런스 권지나 | v8/v9에서 chef 격차 +2.5d 초과 시 |
| 6 | (조건부) PR11 가중치 추가 재조정 — v8에서도 raw food 활용 효과 0 시 actEat AI raw food 우선 분기 추가 (시뮬 로직 PR) | 시스템 백승호 | baseline v8 측정 후 분석 시 |
| 7 | M3 #15 AD UI 변경 권고 2건 | AD 오은별 | 독립 |

### 12.7 결정 종합 — 보강

| 안건 | 보강 결정 |
|------|---------|
| §3.1 가중치 사양 | **정정** — 일반 1.0 → 8 / 위험 0.5 → 4. districts.js 일괄 갱신 완료 |
| PR11 머지 유지 | **유지** — 측정 도구 정합화 기반 PR로 의의 (actExplore raw food 분포 균등) |
| PR12 + M3 #14 동시 진입 | **결정** — K1·K3 향상 본질적 경로. 1 PR 1 트랙 원칙 위배 아님 (트랙 영역 분리) |
| M3 #10 진입 시점 | **baseline v8 D+0** (v7 D+0에서 v8 D+0으로 1단계 지연 — PR12+M3 #14 합산 측정 후) |
| R8-1 원인 | **2 단정 유지** — homeless·engineer day 2 morale 12~13 급락, 회복 자원 부재 |
| R10-1 추이 | **안전** — v6 167 → v7 173 (+6), +50 트리거 미충족 |

본 보강은 본 협의서의 결정 권한 안에서 처리. 별도 협의서 v5 발행 불요.

---

*보강 회의록 끝. baseline v8 측정 결과 도착 시 본 §12.3 표 v8 컬럼 추가 + PR12·M3 #14 합산 효과 단정.*

