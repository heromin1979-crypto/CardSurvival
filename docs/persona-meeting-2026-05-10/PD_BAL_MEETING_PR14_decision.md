# PD·Balance 합동 협의 — PR14 결정 (v5)

> 작성: PD 김재훈 + 밸런스 권지나 / 2026-05-12
> 목적: PR15 머지(`6b69255`) 후 baseline v10 측정(`BAL_SIM_baseline_v10_result.json`)에서 R11-1 액션 트리거 (3) 발동 단언(chef 격차 정의 2 +0.46d < +0.5d). 협의서 v4 §14.4 사전 등록 충족 → **chef 정체성 강화 트랙(M3 #19) 진입 의무 단언**. PR14 진입 옵션 + 사양 방향 + M3 #20 진입 시점 + R15-1 우회 결정.
> 결정: **PR14 = A+B 패키지 채택 — chef 전용 신규 Tier-2 ability(SCN_QUEST_chef_tier2.md 위임) + chef 전용 신규 자원(같은 SCN_QUEST 위임) 결정. 시나리오 한도연 트랙으로 사양 결정 위임 후 시스템 백승호 PR14 머지. 사양 방향: 기능적 차별화 우선(chef K3 향상은 부차적, 격차 정의 1 +1.0d 회복이 1차 목표). M3 #20 나머지 3직업 Tier-2는 PR14와 동시 진행 가능(트랙 영역 분리 — chef 트랙 vs 나머지 3직업 트랙). SCN_QUEST 작성 시 craft 발동 빈도 가정 보수화(day 시작 1회) — R15-1 우회.**

---

## 1. 서두

- **참여 페르소나:** PD 김재훈 (프로덕션·우선순위·트레이드오프·1 PR 1 트랙), 밸런스 권지나 (`gameBalance.js` 단일 진리 / 100회 시뮬 / K1 10~20% / fingerprint 결정성)
- **안건 5건:**
  1. PR14 진입 옵션 결정 (A vs B vs A+B 패키지 vs C 기존 강화)
  2. chef 전용 Tier-2 ability 사양 방향 (PD/Balance 결정 가능 영역 vs 시나리오 한도연 위임 영역)
  3. chef 전용 신규 자원 사양 방향
  4. chef K3 향상 vs 격차 정의 1 +1.0d 회복 우선순위
  5. M3 #20 나머지 3직업 진입 시점 + R15-1 우회 권고

### 1.1 협의서 v4 §15 보강 결과 요약

`PD_BAL_MEETING_PR11_decision.md` §15 (baseline v10 측정 후):
- **R11-1 액션 트리거 (3) 발동 단언** — chef 격차 정의 2 +0.50d (v9) → +0.46d (v10), +0.5d 미만 단정
- R8-1 큰 추가 완화 — 절망 v8 405 → v10 303 (-102, 44.0% 회수). 사망원인 1위 재역전 (아사 350 > 절망 303)
- R13-1 부분 해소 — 4필드 구현, dismantle skip
- R15-1 신규 등록 — SCN_QUEST 추정-실측 잔존 격차 (-0.9~-1.4d)
- §15.5 다음 단계 1순위: **M3 #19 PR14 chef 정체성 강화 — 협의서 v5 신규 발행**

### 1.2 baseline v10 chef 격차 측정 (v10 보고서 §4.1 인용)

- chef K3: **5.20 유지** (v8·v9·v10 동일 — chef T1 진입 차단으로 격차 보호 정합)
- 정의 1 (vs 6직업 평균): chef 5.20 / others6 4.633 → 격차 **+0.567d** (v9 +0.60d → Δ -0.033d 추가 좁힘, 하한 +1.0d 미달 유지)
- 정의 2 (vs cooking lv 0 5직업): chef 5.20 / others5 4.740 → 격차 **+0.46d** (v9 +0.50d → Δ -0.04d 추가 좁힘, **+0.5d 미만**)

### 1.3 협의서 v4 §13.2 R11-1 액션 트리거 발동 단언

3 트리거 중:
- (1) chef K3 < 5.0 — chef K3 5.20 > 5.0 ✅ 안전
- (2) 정의 1 격차 +0.5d 미만 — +0.567d > +0.5d ✅ 안전
- (3) 정의 2 격차 +0.5d 미만 — **+0.46d < +0.5d** ❌ **발동**

**본 협의는 PR14 결정 권한을 가진다.** 협의서 v4 §15.5 §1순위 위임 + §14.4 사전 등록 ("PR15 머지 시 R11-1 발동 의무 사전 등록 — chef 정체성 강화 트랙(M3 #19) 동시 진입 트리거") 충족.

---

## 2. 안건 1 — PR14 진입 옵션 결정

### 2.1 옵션 후보 매트릭스

| 옵션 | 변경 위치 | 영향 KPI | 직업 정체성 | 머지 부담 | 비고 |
|------|----------|---------|------------|----------|------|
| A (ability 단독) | `js/data/characters.js` chef abilities 배열 | ability 효과 의존 | ✅ 차별화 명확 | 작음 (~10~15줄) | startInv 변경 0. 효과 평가는 PR15 ability 가산 분기 정합 |
| B (자원 단독) | `js/data/items_misc.js` + characters.js startingItems | K3 직접 향상 측정 가능 | ⚠️ 부분 차별화 | 중 (~20~30줄, 4곳 등록 룰) | SCN_QUEST 일관성 다소 약함 |
| **A+B 패키지 (권고)** | characters.js + items_misc.js + stackConfig.js + CardFactory.js | K3 + 차별화 양립 | ✅ homeless·engineer 패턴 정합 | 중 (~30~50줄) | SCN_QUEST_chef_tier2.md 패턴 일관 |
| C (기존 ability 강화) | characters.js knife_mastery / cook_intuition effect 수정 | 기존 효과 의존 | ⚠️ 신규 ability 미신설 | 작음 (~5~10줄) | cook_intuition 단축 트리거(협의서 v2 §6.2)와 정반대 — 충돌 |

### 2.2 PD 시각

**PD 김재훈:**
> 1 PR 1 트랙 원칙에서 A+B 패키지는 *데이터 PR 1트랙*으로 해석. characters.js abilities + startingItems + items_misc.js 신규 정의 + 4곳 등록 룰 충족 = M3 #16 PR13(homeless+engineer) 동일 패턴. 1 PR 1 트랙 위배 아님.
>
> 옵션 A 단독은 ability effect 만으로 chef 격차 정의 1 +1.0d 회복이 어렵다 — PR15에서 homeless·engineer ability 효과 +0.1d만 측정된 사례 인용. 옵션 B 단독은 SCN_QUEST 패턴(homeless·engineer 모두 ability + 자원 패키지)과 일관성 깨짐. 옵션 C는 cook_intuition 단축 트리거와 정반대 방향이라 협의 이력 충돌.
>
> **A+B 패키지 권고.** SCN_QUEST_chef_tier2.md 작성 → 시스템 백승호 PR14 머지 → baseline v11 측정 → R11-1 해소 단정.

### 2.3 밸런스 시각

**밸런스 권지나:**
> A+B 패키지의 K3 효과 추정.
>
> **A (신규 Tier-2 ability) 추정 효과:**
> - chef 기존 abilities: `knife_mastery` (knife dmg +20%, M2 추가), `cook_intuition` (encounterMultDaysEnd: 7, encounterMult: 0.5)
> - 신규 ability 후보 (시나리오 한도연 결정 영역, 예시):
>   - `gourmet_palate` (미각, 효과: cook 산출물 onConsume effect +20% — sim 측면에서 actCook 산출물 morale·nutrition 향상)
>   - `herb_specialist` (허브 전문, 효과: herb·wild_berry·vegetable cook 시 영양 효과 ×1.5)
>   - 추정 K3 효과: +0.2~0.5d (PR15 ability 패턴 정합)
>
> **B (신규 자원) 추정 효과:**
> - chef 전용 자원 후보 (시나리오 한도연 결정 영역, 예시):
>   - `chef_kit` (조리 도구, durability 10, cook 효율 ↑)
>   - `recipe_book` (조리서, onConsume morale +X 또는 cook 시 산출물 가산)
>   - `premium_ingredient` (고급 재료, cook 입력 nutrition ↑)
>   - 추정 K3 효과: +0.5~1.0d (PR13 startInv 패턴 정합)
>
> **합산 추정:** chef K3 5.20 → 5.7~6.7 추정 → 격차 정의 1 +1.07~2.07d 회복 (KPI +1.0~+2.0d 범위 정합)
>
> A+B 패키지 채택에 합의. 단 chef K3 절대값 후퇴 위험(예: 신규 자원이 chef 외 직업 startInv에도 들어가는 경우)을 명시적으로 차단 — chef startInv 한정 사양.

### 2.4 결정 — 안건 1

**A+B 패키지 채택.** chef 전용 신규 Tier-2 ability + chef 전용 신규 자원. 데이터 PR 1트랙으로 진행.

- **양 페르소나 합의 도출.**
- 사양 세부(ability 이름·effect·자원 이름·effect)는 시나리오 한도연 위임. SCN_QUEST_chef_tier2.md 신규 작성 트리거
- chef 외 직업 변경 0 — chef 전용 한정 사양
- PD/Balance 결정 가능 영역은 §2.2 + §2.3 권고 방향 + 6 게이트 검수 기준 + KPI 추정 범위만

---

## 3. 안건 2 — chef 전용 Tier-2 ability 사양 방향

### 3.1 PD/Balance 결정 가능 영역 (사양 가드레일)

본 협의서는 시나리오 한도연이 ability 사양 결정 시 따라야 할 *가드레일*을 명시. 사양 세부(이름·effect 값·플레이버 어휘)는 시나리오 한도연 결정 영역.

| 가드레일 | 결정값 |
|---------|--------|
| ability 개수 | 1개 (chef 기존 abilities 2개 + 신규 Tier-2 1개 = 총 3개. homeless·engineer Tier-2 1개 패턴 정합) |
| effect 방향 | 요리 효과 강화 / 영양 회복 강화 / 산출물 가산 (chef 정체성 = 요리 전문가) |
| sim 호환 | PR15 ability 가산 분기 대상 필드 (moraleOnCraft·moraleRecoveryBonus 등 enumerate된 필드) 또는 신규 필드 — 신규 필드는 시스템 백승호 PR15 후속 보강 필요 |
| chef 정체성 정합 | LORE_GLOSSARY chef 어휘 + chef story "셰프의 직감" 정합 |
| K3 추정 향상 | +0.2~0.5d (단독 ability 효과) |
| 6 게이트 검수 | (1) 직업 정체성 (2) 생존 균형 (3) 플레이 유지 (4) 서사 결합 (5) 도구 호환 (6) 측정 가능성 — DIR_GATE_chef_start_environment.md 패턴 |

### 3.2 PD 시각

**PD 김재훈:**
> ability 사양 가드레일에서 *sim 호환*이 결정적. PR15에서 ability 가산 분기 5필드 enumerate 했으나 R15-1 미해소 잔존 격차가 있다. 신규 ability가 사용할 effect 필드가 PR15 enumerate 범위 안이면 즉시 sim 가산 — baseline v11에서 효과 측정 가능. 범위 밖이면 시스템 백승호 후속 보강 필요 → baseline v12로 이연.
>
> 시나리오 한도연 권고: 가능한 한 PR15 enumerate 필드 사용. 예: `moraleOnCraft` (engineer 동일 필드) 또는 chef 정체성 정합 시 `cookEfficiencyBonus` 등 신규 필드는 PR15 후속 PR16에서 보강.

### 3.3 밸런스 시각

**밸런스 권지나:**
> sim 호환 가드레일 동의. 추가로 ability effect 값의 *수치 범위* 가드레일:
> - K3 향상 +0.2~0.5d 목표 → effect 값은 PR15 homeless `moraleRecoveryBonus: 1.5` 수준 ±0.3 (즉 ×1.2~×1.8 또는 +3~+10) 범위
> - 과도 효과(예: ×3 또는 +50) 금지 — chef K3 6.5+ 도달 시 격차 정의 1 +2.0d 초과 위험
> - 과소 효과(예: ×1.05 또는 +1) 비권고 — 측정 가능성 미달
>
> 시나리오 한도연이 effect 값 결정 시 본 범위 명시 권고. baseline v11 측정 후 범위 외 시 즉시 조정.

### 3.4 결정 — 안건 2

**가드레일 6건 (3.1) + sim 호환 우선 (3.2) + effect 값 범위 (3.3) 채택.** 시나리오 한도연 위임. SCN_QUEST_chef_tier2.md 작성 시 본 가드레일 준수 의무.

---

## 4. 안건 3 — chef 전용 신규 자원 사양 방향

### 4.1 PD/Balance 결정 가능 영역 (가드레일)

| 가드레일 | 결정값 |
|---------|--------|
| 신규 자원 수 | 1~2개 (homeless worn_photo 1개 + newspaper_bundle 기존 갱신 패턴 정합) |
| 자원 종류 | 도구(`chef_kit` 등) / 소비재(`recipe_book`·`premium_ingredient` 등) / 어휘 정합 |
| 사용 분기 | onConsume.morale + onConsume.nutrition 또는 cooking 입력 가산 (사양은 시나리오 결정) |
| 4곳 등록 룰 | items_misc.js + stackConfig.js + CardFactory.js + characters.js startingItems (CLAUDE.md §3) |
| chef 정체성 한정 | chef startingItems만 추가. 다른 직업 startInv·districts.js lootTable 0 |
| K3 추정 향상 | +0.5~1.0d (단독 자원 효과) |
| 4곳 등록 룰 위반 시 | 검증 실패 (validate.js Errors) — 시나리오 결정과 시스템 머지 사이 검증 의무 |

### 4.2 결정 — 안건 3

**신규 자원 1~2개 chef 전용 한정 + 4곳 등록 룰 충족** 채택. 자원 사양은 시나리오 한도연 위임. SCN_QUEST_chef_tier2.md 결정 영역.

---

## 5. 안건 4 — chef K3 향상 vs 격차 정의 1 +1.0d 회복 우선순위

### 5.1 협의서 v4 §15.2 PD 단정 재인용

> chef "K3 향상" 목적이 아닌 *직업 차별화 강화* 목적. chef 전용 Tier-2 ability 또는 chef 전용 신규 자원(예: knife_mastery 이미 보유, cook_intuition 이미 보유)을 *기능적 차별화*로 보강. 시나리오 한도연 + PD/Balance 협의로 사양 결정.

### 5.2 1차 KPI 단정

**1차 KPI:** chef 격차 정의 1 v10 +0.567d → v11 **+1.0d 이상 회복**. 정의 1 KPI 하한 +1.0d 회복이 본 PR14의 직접 목표.

**2차 KPI:** chef 격차 정의 2 v10 +0.46d → v11 +0.5d 이상 회복 (R11-1 액션 트리거 해소).

**3차 KPI (모니터링):** chef K3 v10 5.20 → v11 5.5~6.5 범위 안. 6.5 초과 시 협의서 v2 §6.2 cook_intuition 단축 트리거(+2.5d 상한) 위험.

### 5.3 PD 시각

**PD 김재훈:**
> 1차·2차·3차 KPI 명확 분리. 1차 KPI(격차 +1.0d 회복)가 본 PR 직접 목표 — chef 정체성 시각화. 2차 KPI(정의 2 +0.5d) 해소는 1차 충족의 자연스러운 결과(homeless·engineer K3 추가 향상 없을 시).
>
> 3차 KPI는 모니터링 — chef K3 5.5~6.5는 안전 범위. 6.5 초과 시 cook_intuition 단축 단일 상수 PR(협의서 v2 §6.2 트리거) 즉시 진입.

### 5.4 밸런스 시각

**밸런스 권지나:**
> KPI 분리 동의. baseline v11 측정에서:
> - 1차 KPI 충족 단정: 격차 정의 1 ≥ +1.0d
> - 2차 KPI 충족 단정: 격차 정의 2 ≥ +0.5d
> - 3차 KPI 모니터링: chef K3 ≤ 6.5
>
> baseline v11 보고서 §4.1에서 본 3 KPI 명시 의무.

### 5.5 결정 — 안건 4

**3 KPI 분리 채택** — 1차(+1.0d 회복) 직접 목표, 2차(+0.5d 회복) R11-1 해소, 3차(K3 ≤ 6.5) 모니터링. baseline v11 보고서 §4.1 의무.

---

## 6. 안건 5 — M3 #20 나머지 3직업 진입 시점 + R15-1 우회

### 6.1 M3 #20 진입 시점 후보

| 옵션 | 진입 시점 | 장점 | 단점 |
|------|----------|------|------|
| 동시 (PR14 + M3 #20 SCN_QUEST 병행) | PR14 결정 직후 | 시간 단축 | baseline v11 측정 시 PR14·M3 #20 효과 분리 어려움 |
| 직후 (PR14 머지 후) | PR14 머지 D+0 | 효과 분리 측정 가능 | 일정 직렬화 |
| 후행 (baseline v11 후) | baseline v11 측정 D+0 | PR14 효과 단독 단정 가능 | 가장 느림 |

### 6.2 PD 시각

**PD 김재훈:**
> M3 #20 SCN_QUEST 작성은 시나리오 한도연 단독 트랙. PR14 SCN_QUEST_chef_tier2.md와 트랙 영역 분리(chef 트랙 vs 5직업 트랙). 동시 진행 가능.
>
> 그러나 baseline 측정 시 효과 분리 어려움 — PR14 효과(chef 격차 회복)와 M3 #20 효과(나머지 직업 K3 향상)가 baseline v11에 합산 측정되면 PR14 단독 효과 단정 불가. 협의서 v4 §13.3 PR12 단독 효과 0 단정 사례와 유사 위험.
>
> 다만 chef 트랙은 chef 한정이고 M3 #20은 chef 미포함 4직업(firefighter·soldier·pharmacist + R8-1 진입한 homeless·engineer 외 5직업 중 PR13 진입한 2직업 외 3직업)이라 *직업 분리 측정 가능*. baseline v11에서 chef vs 나머지 7직업으로 분리하면 PR14·M3 #20 효과 분리 측정 가능.
>
> **동시 진행 권고.** SCN_QUEST_chef_tier2.md(시나리오 한도연) + SCN_QUEST_{firefighter,soldier,pharmacist}_tier2.md 3건(시나리오 한도연 같은 트랙) → PR14 + PR16(시스템 백승호, 4 SCN_QUEST 머지) → baseline v11 측정 → 직업별 분리 단정.

### 6.3 R15-1 우회 권고

협의서 v4 §15.4 R15-1: SCN_QUEST 추정-실측 잔존 격차 (playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day).

**우회 권고:** SCN_QUEST_chef_tier2.md + 3건 작성 시 craft 발동 빈도 가정을 *보수적*(day 시작 1회)으로 사용. K3 추정값을 baseline v9·v10 실측 패턴(homeless +0.1d, engineer +0.1d)으로 보수화.

### 6.4 결정 — 안건 5

**M3 #19 PR14 + M3 #20 SCN_QUEST 3건 동시 진행 채택.** 시나리오 한도연 단일 트랙으로 4 SCN_QUEST(chef·firefighter·soldier·pharmacist) 작성. R15-1 우회로 craft 발동 빈도 보수화.

- **양 페르소나 합의 도출.**
- 시스템 백승호 머지: PR14 (4 SCN_QUEST patch diff 합산) 또는 PR14(chef) + PR16(나머지 3) 분리 (시스템 결정)
- baseline v11 직업별 분리 측정 의무 (밸런스 권지나)

---

## 7. 횡단 발견

### 7.1 R11-1 해소 패턴 — chef 격차 정체성 강화 트랙으로의 단계화

baseline v10에서 R11-1 발동 단언 → 본 협의로 PR14 진입 → SCN_QUEST_chef_tier2.md 작성(시나리오 한도연) → PR14 머지(시스템 백승호) → baseline v11 측정(밸런스 권지나) → R11-1 해소 단정 → 협의서 v5 §X 보강.

5단계 패턴. PR9·PR10·PR11·PR12+T1·PR13·PR15 모두 동일 패턴(협의 → 시나리오/사양 → 머지 → 측정 → 보강). M3 트랙 표준 절차 정착.

### 7.2 chef 정체성 강화의 SCN_QUEST 패턴 일관성

homeless `street_solace` + worn_photo / engineer `workshop_focus` + sketch_notebook 패턴 정합. chef 신규 Tier-2 ability + chef 전용 자원(1~2개) 패키지 = SCN_QUEST_chef_tier2.md 형태로 시나리오 한도연 작성. M3 #10 트랙 5직업 일관성 확보.

### 7.3 R8-1 사인 전이 후속 검토

baseline v10에서 사인 전이(절망 -74, 아사 +62)는 의도된 패턴(morale 회복 → 사망일 연장 → nutrition 결핍). 다만 K1 = 0% 11회 연속 단정. 사망일 연장이 day 100 도달로 이어지지 않음. **본 PR14는 R11-1 해소 + 격차 정체성 강화 목적이고 K1 향상은 부차적.** K1 향상은 R15-1 해소(craft 발동 빈도 보강 PR16) 또는 별도 자원 분배 PR이 직접 목표.

---

## 8. 결정 종합

| 안건 | 결정 |
|------|------|
| 1. PR14 진입 옵션 | **A+B 패키지 채택** — chef 전용 신규 Tier-2 ability + chef 전용 신규 자원. 데이터 PR 1트랙 |
| 2. ability 사양 가드레일 | 6 가드레일 + sim 호환 우선 + effect 값 범위 (×1.2~×1.8 또는 +3~+10). 시나리오 한도연 위임 |
| 3. 신규 자원 사양 가드레일 | 1~2개 chef 전용 한정 + 4곳 등록 룰 충족. 시나리오 한도연 위임 |
| 4. KPI 우선순위 | 1차 격차 정의 1 +1.0d 회복, 2차 정의 2 +0.5d 회복, 3차 chef K3 ≤ 6.5 모니터링 |
| 5. M3 #20 진입 시점 | **PR14 + M3 #20 동시 진행 채택** — 시나리오 한도연 단일 트랙 4 SCN_QUEST 작성. R15-1 우회 (craft 발동 빈도 보수화) |

### 8.1 PR14 단일 트랙 정의

**PR14 = "chef 전용 Tier-2 ability + chef 전용 신규 자원 1~2개" 단일 데이터 트랙.** 영향 파일 4개(characters.js + items_misc.js + stackConfig.js + CardFactory.js). 코드 디테일은 시나리오 한도연(SCN_QUEST_chef_tier2.md §8 patch diff) → 시스템 백승호 머지.

---

## 9. 실행 계획

### 9.1 시나리오 한도연 위임 사항

| 산출물 | 사양 |
|--------|------|
| `SCN_QUEST_chef_tier2.md` | chef 전용 Tier-2 ability(1개) + 신규 자원(1~2개) 사양. 6 가드레일 + 6 게이트 검수 + PR14 patch diff §8 |
| (병행) `SCN_QUEST_firefighter_tier2.md` | firefighter Tier-2 ability + 자원 (R15-1 우회 craft 빈도 보수화) |
| (병행) `SCN_QUEST_soldier_tier2.md` | soldier 동일 패턴 |
| (병행) `SCN_QUEST_pharmacist_tier2.md` | pharmacist 동일 패턴 |

**4 SCN_QUEST 동시 작성 권고.** 시간 절약 + 일관성 확보.

### 9.2 시스템 백승호 위임 사항 (SCN_QUEST 도착 후)

| 작업 | 영역 |
|------|------|
| PR14 = chef 머지 | characters.js chef abilities + startingItems + items_misc.js 신규 자원 + stackConfig.js + CardFactory.js |
| PR16 = 나머지 3직업 머지 또는 PR14에 통합 | 시스템 결정. 1 PR 1 트랙 vs 4 SCN_QUEST 묶음 |
| validate.js + fingerprint 검증 | Errors 0, fingerprint `len316-h242a5b5f` 유지 |
| `tools/sim/v2/run_baseline.mjs` | OUTPUT_FILE / buildTag v10 → v11 |

### 9.3 밸런스 권지나 위임 사항 (PR14 머지 후)

- baseline v11 측정 (`BAL_SIM_baseline_v11_result.json` + `report.md`)
- **직업별 분리 측정 의무** — chef vs 나머지 6직업으로 PR14·M3 #20 효과 분리 단정
- 1차/2차/3차 KPI 단정 (§5.5)
- R11-1 해소 단정 + chef 정체성 정합 보고

### 9.4 검증 절차

1. SCN_QUEST 4건 도착 + PD/Balance 6 가드레일 + 6 게이트 검수 통과 확인
2. 시스템 백승호 PR14 머지 — `node js/data/validate.js` Errors 0
3. fingerprint 유지 검증 — `len316-h242a5b5f`
4. baseline v11 측정 — 700 runs / bootstrapErrors 0
5. probe — chef 회차 cook 산출물 분포 + 신규 자원 사용 빈도 + chef morale 시계열

### 9.5 KPI 갱신 (baseline v11 목표값)

| KPI | baseline v10 | baseline v11 목표 | 폴백 트리거 |
|-----|-------------|------------------|-----------|
| K1 (전 직업) | 0.00% | 변화 없을 가능성 (R15-1 미해소) | < 5% 12회 연속 시 PR16/PR17 (R15-1·R13-1 완전 해소) 검토 |
| **K3 chef** | 5.20 | **5.5~6.5** (1차 KPI) | > 6.5 시 cook_intuition 단축 즉시 PR (협의서 v2 §6.2) |
| **chef 격차 정의 1** | +0.567d | **≥ +1.0d** (1차 KPI 직접 목표) | < +1.0d 시 PR14 ability·자원 effect 값 재조정 |
| chef 격차 정의 2 | +0.46d | **≥ +0.5d** (2차 KPI, R11-1 해소) | < +0.5d 시 PR14 재조정 |
| K3 firefighter·soldier·pharmacist | 5.0/4.5/4.1 | +0.5~1d (M3 #20 효과, R15-1 보수화로 추정 보수) | +0.3d 미달 시 M3 #20 사양 재조정 |
| K5 절망 | 303 | 유지 또는 감소 | +50 초과 시 R8-1 미해소 우려 |
| K5 아사 | 350 | 사인 전이 추가 (chef K3 향상으로 chef 회차 아사 증가 가능) | +100 초과 시 자원 분배 추가 PR |
| 직업 격차 (K1 max-min) | 0%p | ≤ 5%p | 5%p 초과 시 회귀 검사 |

---

## 10. 위험과 완화

### 10.1 PR14 후 chef K3 6.5 초과 시

**트리거:** baseline v11에서 chef K3 > 6.5.
**완화:** 협의서 v2 §6.2 cook_intuition 단축 트리거 즉시 진입. `cook_intuition days = 7 → 5` 단일 상수 PR (밸런스 권지나).

### 10.2 chef 격차 정의 1 +1.0d 미달 시

**트리거:** baseline v11에서 chef 격차 정의 1 < +1.0d.
**완화:** PR14 ability effect 값 또는 신규 자원 effect 값 재조정. SCN_QUEST_chef_tier2.md §8 patch diff 재발행. 시스템 백승호 PR14.1 머지.

### 10.3 R15-1 우회 실패 시 (M3 #20 추정-실측 격차 재발)

**트리거:** baseline v11에서 firefighter·soldier·pharmacist K3 향상 +0.3d 미달.
**완화:** SCN_QUEST 작성 시 craft 발동 빈도 가정이 부적절. R15-1 완전 해소를 위한 PR16(craft 발동 빈도 보강) 즉시 진입.

### 10.4 직업 격차 5%p 초과 위험 (M3 #20 효과 chef 격차 추가 좁힘)

**트리거:** baseline v11에서 chef + 6직업 K1 차이 > 5%p.
**완화:** 본 KPI는 K1 = 0% 11회 연속 패턴에서는 직업 격차 0%p 유지 예상. 실제 발생 시 R15-1 보수화 가정 재검토.

### 10.5 PR14 + M3 #20 효과 분리 측정 실패 (협의서 v4 §13.3 패턴 재발)

**트리거:** baseline v11에서 chef·나머지 6직업 효과 분리가 불가능 (예: chef 격차가 +1.0d 회복했지만 chef K3 향상이 아니라 나머지 6직업 K3 후퇴로 일어남).
**완화:** baseline v11 보고서 §4.1에서 chef vs 6직업 절대값 단정 의무. 격차 변화 원인이 chef 향상인지 나머지 후퇴인지 명시.

---

## 11. 다음 단계

| 순위 | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | SCN_QUEST_chef_tier2.md 작성 + (병행) SCN_QUEST_{firefighter,soldier,pharmacist}_tier2.md 3건 작성 — 4 SCN_QUEST 단일 트랙 | 시나리오 한도연 | 본 협의서 결정 직후 |
| **2** | PR14 머지 (또는 PR14 chef + PR16 나머지 3직업 분리) — characters.js + items_misc.js + stackConfig.js + CardFactory.js 4곳 등록 룰 충족 | 시스템 백승호 | SCN_QUEST 4건 도착 후 |
| **3** | baseline v11 측정 (`BAL_SIM_baseline_v11_report.md` + `result.json`) — 직업별 분리 측정 + 1·2·3차 KPI 단정 + R11-1 해소 단정 | 밸런스 권지나 | PR14 머지 D+1 |
| 4 | (조건부) cook_intuition 단축 — chef K3 > 6.5 시 | 밸런스 권지나 | baseline v11 측정 후 |
| 5 | (조건부) PR14.1 재조정 — chef 격차 정의 1 < +1.0d 시 | 시나리오 한도연 + 시스템 백승호 | baseline v11 측정 후 |
| 6 | (조건부) PR16 craft 발동 빈도 보강 — R15-1 해소 트랙. R15-1 우회 실패 시 | 시스템 백승호 | baseline v11 측정 후 |
| 7 | (조건부) PR17 dismantle sim 모사 — R13-1 완전 해소 | 시스템 백승호 | PR16 머지 후 |
| 8 | M3 #15 AD UI 변경 권고 2건 | AD 오은별 | 독립 |
| 9 | (M4+) drift.mjs leaf 값 hash 컬럼 추가 | 시스템 백승호 | M4 진입 시 |

**머지 순서 (PD 원칙: 시나리오 → 데이터 → 측정 → 밸런스 튜닝):**
1. 4 SCN_QUEST(시나리오 한도연) → 2. PR14 (시스템 백승호 데이터) → 3. baseline v11 (밸런스 권지나 측정) → 4. (필요 시) PR14.1 재조정 또는 cook_intuition 단축

---

*문서 끝. SCN_QUEST_chef_tier2.md 도착 시 본 §9.1 가드레일 + §9.2 patch diff 적용 + §9.5 KPI 단정. baseline v11 측정 결과 도착 시 본 §10 위험 완화 발동 여부 단정 + R11-1 해소 단언.*
