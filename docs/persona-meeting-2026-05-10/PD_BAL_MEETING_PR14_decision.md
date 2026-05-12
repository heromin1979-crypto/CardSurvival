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

*문서 끝. SCN_QUEST_chef_tier2.md 도착 시 본 §9.1 가드레일 + §9.2 patch diff 적용 + §9.5 KPI 단정. baseline v11 측정 결과 도착 시 본 §10 위험 완화 발동 여부 단정 + R11-1 해소 단언. — 2026-05-12 충족. 갱신 사항은 §12 보강.*

---

## 12. 보강 회의록 (2026-05-12, PR14·PR16 머지 + baseline v11 측정 직후)

> 참여: PD 김재훈 + 밸런스 권지나. 입력: 시나리오 한도연 4 SCN_QUEST(2178줄) + 시스템 백승호 PR14·PR16 머지(4 파일 +117/-2 라인) + `BAL_SIM_baseline_v11_result.json` + `BAL_SIM_baseline_v11_report.md` (밸런스 권지나, 426줄).

### 12.1 baseline v11 측정 결과 단정 (v11 보고서 §3~§5)

- fingerprint `len316-h242a5b5f` v3~v11 9연속 유지, bootstrapErrors 0/700, 10.9초, 결정성 100%
- **K1 7직업 0%, 12회 연속 0%** (PR5 → PR14·PR16)
- K3 v10 → v11:
  - **chef 5.20 → 5.40 (+0.20d)** ★ PR14 효과 (pantry_mastery + chef_journal + spice_blend)
  - **soldier 4.50 → 5.00 (+0.50d)** ★ PR16 효과 (보수 추정 +0.1~0.3d 초과)
  - **pharmacist 4.10 → 4.30 (+0.20d)** ★ PR16 효과 (compounding_focus + pharmacy_notes)
  - **firefighter 5.00 → 5.00 (Δ 0d)** — 사인 전이만 (절망 -11 → 아사 +14)
  - doctor 4.90 / homeless 4.30 / engineer 5.00 — 변화 0 (회귀 0)
- K5 v10 → v11:
  - **절망 303 → 161 (-142, -47%)** ★ R8-1·R10-1 큰 추가 완화
  - 아사 350 → 467 (+117), 탈수 13 → 33 (+20), 극도 피로 34 → 39 (+5)
- 누적 R10-1 해소: v8 405 → v11 161 (-244, **60.2% 회수**)

### 12.2 R11-1 정의 2 해소 단언

baseline v11 §4.1:
- 정의 1 (vs 6직업 평균): chef 5.40 / others6 4.75 → 격차 **+0.650d** (v10 +0.567d → Δ +0.083d 회복)
- 정의 2 (vs cooking lv 0 5직업): chef 5.40 / others5 4.84 → 격차 **+0.560d** (v10 +0.46d → Δ +0.060d 회복)

**KPI 단정:**
- 1차 KPI 격차 정의 1 ≥ +1.0d: ❌ **미달** (+0.650d, SCN_QUEST 추정 +1.07~1.57d 대비 격하). **R14-1 신규**
- 2차 KPI 격차 정의 2 ≥ +0.5d: ✅ **R11-1 정의 2 해소 단언** (+0.560d)
- 3차 KPI chef K3 ≤ 6.5: ✅ **안전** (5.40, cook_intuition 단축 회피)

**PD 김재훈:**
> R11-1 정의 2 해소는 명백한 단언 — 협의서 v4 §14.4 사전 등록 + 본 협의서 §5.5 2차 KPI 충족. PR15 머지 시 R11-1 발동 → PR14·PR16 머지 시 R11-1 해소까지 5단계 절차 정착 (협의 → 사양 → 머지 → 측정 → 보강).
>
> 1차 KPI 미달은 R14-1로 분리 등록. 정의 1 +0.650d는 v10 +0.567d 대비 +0.083d만 회복 — chef effect가 SCN_QUEST 추정보다 약하게 작용. 원인은 §12.3에서 R14-1 단정으로 처리.

### 12.3 R14-1 신규 등록 — chef 1차 KPI 미달 + PR14.1 재조정 트리거

**측정 사실:**
- SCN_QUEST_chef_tier2.md §9 추정: 격차 정의 1 +1.07~+1.57d (가이드 5/6 통과)
- 실측: +0.650d (추정 대비 -0.42~-0.92d 격차)

**원인 단정 (시스템 백승호 1차 단정 인용):**
- pantry_mastery `moraleRecoveryBonus: 1.4` — PR15 ability 가산 패턴(homeless 1.5)보다 낮은 값. chef 효과 약화
- chef_journal `onConsume.morale: 10` — 단발성 소비 (durability 3 → 3회 사용)
- spice_blend `onConsume.morale: 6 / nutrition: 5` — 2개 stack, 미세 효과
- 합산 효과가 chef K3 +0.20d만 발현. PR15 ability 패턴(homeless +0.1d) 정합이지만 R11-1 1차 KPI +1.0d 회복은 미충족

**R14-1 액션:** **PR14.1 재조정 트리거 발동 단언.**

권고 옵션 (시스템 백승호 1차 단정):
- 옵션 A: `pantry_mastery.moraleRecoveryBonus 1.4 → 1.6` 상향 (homeless 1.5 초과, chef 정체성 정합)
- 옵션 B: `chef_journal.onConsume.morale 10 → 13` 상향 (homeless worn_photo 12 초과)
- 옵션 C: 두 옵션 병행 — 안전한 1차 KPI 충족 보장

**PD 김재훈:**
> 옵션 A 단독은 effect 값 범위 가드레일(협의서 §3.3 ×1.2~×1.8) 내. 옵션 B 단독은 chef_journal durability 3 → 5 상향과 결합 가능. 옵션 C는 양쪽 조정으로 안전 마진 확보.
>
> **권고: 옵션 A 단독 채택** — 단일 상수 변경 (1 PR 1 트랙 정합). baseline v12에서 1차 KPI 충족 검증. 미달 시 옵션 B 또는 C 후속.

**밸런스 권지나:**
> 옵션 A 추정: pantry_mastery `moraleRecoveryBonus 1.6` 적용 시 chef K3 5.40 → 5.55~5.65 추정. 격차 정의 1 v11 +0.650d → v12 +0.85~+0.95d 추정 — 여전히 +1.0d 미달 가능. **옵션 C(병행) 권고** — 1차 KPI 안전 충족.
>
> chef K3 6.5 초과 위험: 옵션 C 적용 시 chef K3 5.65~5.85 추정. 안전 범위 유지. 3차 KPI 충족 단정.

**결정:** **PR14.1 = 옵션 C 채택** — `pantry_mastery.moraleRecoveryBonus 1.4 → 1.6` + `chef_journal.onConsume.morale 10 → 13`. 시나리오 한도연 SCN_QUEST_chef_tier2.md §8 재조정 후 시스템 백승호 PR14.1 머지.

### 12.4 R14-2 신규 등록 — soldier K3 보수 추정 초과

**측정 사실:**
- SCN_QUEST_soldier_tier2.md §1.4 추정: K3 +0.1~0.3d (R15-1 우회 보수화)
- 실측: K3 +0.50d (가이드 +0.3d 초과 +0.20d)

**원인 단정:**
- comrade_memorial `moraleRecoveryBonus: 1.3` + dog_tag morale +10 합산 효과가 SCN_QUEST 추정보다 강하게 발현
- 사인 전이 (절망 → 아사) 발생으로 K3 자연 증가

**R14-2 액션:** PR16.1 soldier 재조정 트리거. chef 격차 정의 1 추가 좁힘 회피 (+0.567d → +0.650d 회복 중인데 soldier 추가 향상이 chef 격차 추가 좁힘 위험).

권고:
- `comrade_memorial.moraleRecoveryBonus 1.3 → 1.2` 하향 (PR16.1 단일 상수)

**결정:** **PR16.1 채택** — soldier comrade_memorial 하향. PR14.1과 동시 진행 가능 (1 PR 1 트랙 영역 분리).

### 12.5 R14-3 신규 등록 — firefighter 사인 전이만 (R15-1 우회 실패)

**측정 사실:**
- SCN_QUEST_firefighter_tier2.md §1.4 추정: K3 +0.1~0.3d
- 실측: K3 Δ 0d (절망 -11 → 아사 +14 사인 전이만)

**원인 단정:**
- rescue_resolve `moraleRecoveryBonus: 1.3` 적용으로 절망 사망 회피
- 그러나 사망일 연장 미발생 — 사망 시점이 day 5 안에서 아사로 즉시 사인 전환
- R15-1 우회 보수화 실패 패턴 — craft 발동 빈도 부족 + family_photo 단발성

**R14-3 액션:** firefighter SCN_QUEST 재검토 트리거.

권고:
- 옵션 1: family_photo durability 1 → 3 상향 (다회 소비로 효과 연장)
- 옵션 2: rescue_resolve effect 추가 (예: `craftSuccessBonus` 같은 신규 분기 — 단 PR15 enumerate 범위 밖이라 시스템 후속 보강 필요)
- 옵션 3: 보수 추정 자체를 firefighter Δ 0d 패턴으로 받아들임 (사인 전이가 K1 향상에 미치는 영향 단정)

**PD 김재훈:**
> 옵션 1이 가장 작은 변경 + 1 PR 1 트랙 정합. 단 family_photo durability 1 → 3은 자원 가치 변화. soldier dog_tag·homeless worn_photo durability 1 패턴과 일관성 깨짐 → keepsake 자원 durability 1 통일 유지가 직업 정체성 측면 합리. **옵션 3 권고** — firefighter K3 Δ 0 패턴 수용. v12 측정에서 firefighter 사인 전이 패턴 재검토.

**결정:** **옵션 3 채택** — firefighter 재조정 보류. baseline v12 측정 후 PR16.2 검토 트리거. R15-1 우회 실패 패턴은 firefighter 한정 단정.

### 12.6 R8-1·R10-1 큰 추가 완화 — 누적 60.2% 회수

| 측정 | v8 | v9 | v10 | v11 | 누적 Δ |
|------|----|----|----|----|-------|
| 절망 사망 | 405 | 377 | 303 | **161** | **-244 (60.2% 회수)** |

**의의:**
- R10-1 절망 폭증(v7 → v8 +232) 대비 v11에서 -244 회수 → **R10-1 단계적 해소 단정**
- R8-1 morale 회복 자원 부재 — homeless·engineer·firefighter·soldier·chef 5직업 Tier-2 ability + 5종 신규 자원 + PR15 ability 가산 분기로 대응. 사인 전이로 사망 원인은 아사·탈수로 이동했으나 절망 사망 자체는 큰 감소
- **사망원인 1위는 아사 467로 절망 161의 2.9배** — R8-1 완전 해소 단정 가능 (절망 사망 < 200 기준)

**밸런스 권지나:**
> R8-1 완전 해소 단정. R10-1도 단계적 해소. **단 K1 = 0% 12회 연속이라 사망일 연장이 day 100 도달로 이어지지 않음.** K1 향상은 R15-1 완전 해소(craft 발동 빈도 보강 PR16) + 자원 분배 추가 PR이 본질적 경로.
>
> baseline v12 PR14.1·PR16.1 머지 후에도 K1 0% 유지 시 PR16 craft 빈도 보강(R15-1 해소) 진입 권고.

### 12.7 §11 다음 단계 갱신

| 순위 (갱신) | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | PR14.1 머지 — `pantry_mastery.moraleRecoveryBonus 1.4 → 1.6` + `chef_journal.onConsume.morale 10 → 13`. characters.js + items_misc.js 2 파일 ~5라인. PR16.1과 동시 진행 가능 | 시나리오 한도연 (SCN_QUEST 재조정) + 시스템 백승호 (머지) | 본 보강 회의록 채택 직후 |
| **2** | PR16.1 머지 — `comrade_memorial.moraleRecoveryBonus 1.3 → 1.2`. characters.js 1 파일 ~1라인 | 시스템 백승호 | PR14.1과 동시 |
| **3** | baseline v12 측정 — PR14.1 + PR16.1 합산 효과. **직업별 분리 측정 의무** | 밸런스 권지나 | PR14.1·PR16.1 머지 D+1 |
| 4 | 1차 KPI 충족 단정 — chef 격차 정의 1 ≥ +1.0d. R11-1 완전 해소 단언 | 밸런스 권지나 + PD | baseline v12 보고 D+0 |
| 5 | (조건부 R14-3) firefighter 재조정 검토 — 사인 전이 패턴 v12 재측정 | 시나리오 한도연 | baseline v12 측정 후 |
| 6 | (조건부) PR16 craft 발동 빈도 보강 — R15-1 완전 해소. K1 향상 본질적 경로 | 시스템 백승호 | baseline v12에서 K1 = 0% 13회 연속 시 |
| 7 | (조건부) PR17 dismantle sim 모사 — R13-1 완전 해소 | 시스템 백승호 | PR16 머지 후 |
| 8 | sketch_notebook + pharmacy_notes paper 정의 — 보수 처리 `[]` 정리 | 시스템 백승호 | 독립 |
| 9 | M3 #15 AD UI 변경 권고 2건 | AD 오은별 | 독립 |
| 10 | (M4+) drift.mjs leaf 값 hash 컬럼 추가 | 시스템 백승호 | M4 진입 시 |

### 12.8 결정 종합 — 보강

| 안건 | 결정 |
|------|------|
| R11-1 정의 2 해소 | ✅ **단언** (+0.560d ≥ +0.5d). 협의서 v4 §14.4 사전 등록 충족 |
| R14-1 (chef 1차 KPI 미달) | **PR14.1 옵션 C 채택** — pantry_mastery 1.4→1.6 + chef_journal 10→13 |
| R14-2 (soldier 보수 초과) | **PR16.1 채택** — comrade_memorial 1.3→1.2 하향 |
| R14-3 (firefighter 사인 전이만) | **옵션 3 수용** — 재조정 보류. v12 측정 후 PR16.2 검토 |
| R8-1·R10-1 큰 추가 완화 | ✅ **R8-1 완전 해소 단정** (절망 161 < 200) + R10-1 단계적 해소 (60.2% 회수) |
| 다음 단계 갱신 | PR14.1 + PR16.1 동시 → baseline v12 → 1차 KPI 단언 |

본 보강은 본 협의서의 결정 권한 안에서 처리. baseline v12 측정 결과 도착 시 §12.7 표 갱신 + 1차 KPI 충족 단언 (R11-1 완전 해소).

---

*보강 회의록 끝. PR14.1·PR16.1 머지 후 baseline v12 측정 결과 도착 시 본 §12.3 R14-1 해소 단정 + §12.4 R14-2 해소 단정 + 1차 KPI 충족 단언 (R11-1 완전 해소). — 2026-05-12 충족. 갱신 사항은 §13 보강.*

---

## 13. 추가 보강 회의록 (2026-05-12, PR14.1+PR16.1 머지 + baseline v12 측정 직후)

> 참여: PD 김재훈 + 밸런스 권지나. 입력: PR14.1+PR16.1 머지(시스템 백승호 5 라인) + `BAL_SIM_baseline_v12_result.json` + `BAL_SIM_baseline_v12_report.md` (밸런스 권지나, 338줄).

### 13.1 baseline v12 측정 결과 단정

- fingerprint `len316-h242a5b5f` v3~v12 10연속 유지, bootstrapErrors 0/700, 10.84초, 결정성 100%
- **K1 7직업 0%, 13회 연속 0%** (PR5 → PR14.1·PR16.1)
- K3 v11 → v12:
  - chef 5.40 → **5.38 (+0.02d 미미)** ★ PR14.1 옵션 C 효과 격하
  - soldier 5.00 → **4.96 (-0.04d 미미)** ★ PR16.1 효과 격하
  - 다른 5직업 변화 0 (회귀 0)
- K5 v11 → v12:
  - 절망 161 → 165 (+4 미세), 아사 467 → 461 (-6), 탈수 33 동일, 극도 피로 39 → 41 (+2)
- chef 격차 정의 1 v11 +0.6133d → v12 **+0.6350d** (Δ +0.0217d). 정의 2 v11 +0.5240d → v12 **+0.5460d** (Δ +0.0220d)

### 13.2 R14-1·R14-2 미해소 단언

**R14-1 (chef 1차 KPI ≥ +1.0d):**
- v12 격차 정의 1 +0.6350d < +1.0d → **미해소 단언**
- 옵션 C 추정 (협의서 §12.3 밸런스 권지나) +0.85~+0.95d 대비 격하 -0.215~-0.315d

**R14-2 (soldier K3 보수 ≤ +0.3d):**
- v10 → v12 누적 +0.47d > +0.3d → **미해소 단언**
- PR16.1 comrade_memorial 1.3 → 1.2 효과 -0.04d만 발현 (추정 -0.10~-0.15d 대비 격하)

### 13.3 R11-1 완전 해소 불가능 단정 + 구조적 한계

**정의 1·2 동시 충족 시도 결과:**
- 정의 2 (vs 5직업): +0.546d ≥ +0.5d ✅ 유지
- 정의 1 (vs 6직업): +0.635d < +1.0d ❌ **미해소 단언**
- **R11-1 완전 해소 (정의 1·2 동시): 불가능 단정**

**구조적 한계 단정 (밸런스 권지나 §9 인용):**
- chef 사망일 day 5~6 집중 — morale 가산이 nutrition 결핍·탈수 사망 회피 불가
- chef K5 탈수 + 아사 = 73% — **morale 회복은 day 100 도달의 *필요 조건*이지 *충분 조건*이 아님**
- ability 가산 비선형 패턴: PR14·PR16 30% 상향 → +0.50d / PR16.1 7.7% 하향 → -0.04d / PR14.1 14% 상향 → +0.02d
- **effect 값 미세 조정의 한계 노출** — 단순 effect 상향으로는 1차 KPI 충족 불가능

**PD 김재훈:**
> R11-1 완전 해소 불가능 단정은 본 협의 가장 큰 발견. effect 값 조정 (PR14.1·PR16.1)만으로는 chef 사망일 분포를 day 6+ 로 이동시킬 수 없다 — chef 사망 사유가 morale 외 nutrition·탈수이기 때문.
>
> 1차 KPI 달성을 위해 다음 두 트랙 중 선택:
> - 트랙 A: R15-1 완전 해소 (PR16 craft 발동 빈도 보강) → chef cook 발동 횟수 증가 → nutrition 회복 증가 → 사망일 day 6+ 이동 → 1차 KPI 충족
> - 트랙 B: chef 전용 자원 추가 (예: high-nutrition 자원) → nutrition 직접 보강 → 동일 효과
> - 트랙 C: M3 마감, 1차 KPI를 M4 이월 — R11-1 정의 2 해소만 M3 마감 단언으로 처리
>
> 트랙 A·B는 추가 PR 필요. 트랙 C는 M3 마감 권한 행사.

### 13.4 R15-1 진입 전제 단정 + PR16 craft 빈도 보강

**시스템 백승호 1차 단정 인용:**
- PR15 enumerate 4필드 정합 (moraleRecoveryBonus·moraleOnCraft·lowMoraleRecoveryFatigueBonus 구현 완료)
- 그러나 sim playerAI craft 발동 day 1회 한계로 chef·pharmacist effect 발현 제한
- **chef morale 가산이 K3 효과로 발현되려면 craft 발동 빈도 보강(R15-1 완전 해소) 전제**

**PR16 craft 발동 빈도 보강 사양 (시스템 백승호 위임 영역, 결정 시):**
- playerAI craft 발동을 day 시작 1회 → morale<30 시점 추가 발동
- 또는 actInteractCraft (T1 변환) 빈도 증가
- 시뮬 로컬 변경 (BALANCE 미관여, fingerprint 유지 예상)

**밸런스 권지나:**
> R15-1 완전 해소가 R11-1 완전 해소의 *전제*라는 단정은 baseline v12에서 명백. 다만 PR16은 시스템 백승호 시뮬 로직 PR이며 effect 값 조정 PR보다 분량 큼 (~50~100줄 추정). M3 마감 우선순위 vs PR16 진입 후 baseline v13 측정 결정 필요.

### 13.5 R11-1 완전 해소 전략 재정의 — 트랙 B(PR16 우선) 채택

**PD 김재훈:**
> 협의서 v5 §11 §1순위는 PR14.1·PR16.1 (effect 값 조정)이었으나 v12에서 효과 격하 단정. **트랙 A (PR16 craft 빈도 보강) 채택** — R15-1 완전 해소가 R11-1 완전 해소의 본질적 경로.
>
> 단 PR16은 시뮬 로컬 변경이라 게임 본체 K1 향상 효과 단정은 별도 검증 필요 (협의서 v3 §12.1 시나리오 γ 단정 패턴 재발 가능). baseline v13 측정에서 R15-1 효과 분리 측정 + 트랙 A 채택 단정.

**밸런스 권지나:**
> 트랙 A 채택 동의. 트랙 B (chef 자원 추가) 또는 트랙 C (M3 마감 R11-1 정의 2 해소만)는 baseline v13 후 결정.

**결정:**
- **트랙 A 채택** — PR16 craft 발동 빈도 보강 (시스템 백승호 위임)
- baseline v13 측정 후 R11-1 완전 해소 단언 시도 → 미달 시 트랙 B 또는 C 선택

### 13.6 §12.7 다음 단계 갱신

| 순위 (갱신) | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | PR16 머지 — `tools/sim/v2/playerAI.mjs` craft 발동 빈도 보강 (morale<30 시점 추가 발동 또는 actInteractCraft 빈도 증가). R15-1 완전 해소 + R11-1 완전 해소 본질 경로 | 시스템 백승호 | 본 보강 회의록 채택 직후 |
| **2** | baseline v13 측정 — PR16 효과 단정. chef K3 + 1차 KPI 충족 여부 단정 | 밸런스 권지나 | PR16 머지 D+1 |
| **3** | 1차 KPI 충족 단정 (≥ +1.0d) → R11-1 완전 해소 단언 / 미달 시 트랙 B (chef 자원 추가) 또는 트랙 C (M3 마감, R11-1 정의 2 해소만) 결정 | PD/Balance 협의 | baseline v13 보고 D+0 |
| 4 | (조건부 트랙 B) chef 전용 high-nutrition 자원 추가 PR — chef 사망일 day 6+ 이동 목표 | 시나리오 한도연 + 시스템 백승호 | 트랙 A 미달 시 |
| 5 | (조건부 트랙 C) M3 마감 + M4 이월 — R11-1 정의 2 해소만 M3 단언, 정의 1은 M4 트랙 | PD 김재훈 | 트랙 A·B 모두 미달 시 |
| 6 | PR16.2 (조건부) — soldier 추가 조정 또는 firefighter 재검토. 우선순위 후순위 (R15-1 해소 후 자연 재측정) | 시나리오 한도연 + 시스템 백승호 | baseline v13 후 |
| 7 | PR17 dismantle sim 모사 — R13-1 완전 해소 | 시스템 백승호 | PR16 머지 후 |
| 8 | sketch_notebook + pharmacy_notes paper 정의 — 보수 처리 `[]` 정리 | 시스템 백승호 | 독립 |
| 9 | M3 #15 AD UI 변경 권고 2건 | AD 오은별 | 독립 |
| 10 | (M4+) drift.mjs leaf 값 hash 컬럼 추가 | 시스템 백승호 | M4 진입 시 |

### 13.7 결정 종합 — 보강

| 안건 | 결정 |
|------|------|
| R14-1 (chef 1차 KPI 미달) | ❌ **미해소 단언** — effect 값 조정 한계 |
| R14-2 (soldier 보수 초과) | ❌ **미해소 단언** — PR16.1 효과 -0.04d만 |
| R11-1 완전 해소 | ❌ **불가능 단정** — effect 값 미세 조정으로 1차 KPI 충족 불가 |
| 구조적 한계 | **단정** — chef 사망일 day 5~6 집중, morale 회복은 필요 조건이지 충분 조건이 아님 |
| R15-1 진입 전제 | **단정** — craft 발동 빈도 보강이 chef K3 효과 발현의 본질 |
| R11-1 완전 해소 전략 | **트랙 A 채택** — PR16 craft 발동 빈도 보강 우선. 미달 시 트랙 B/C 결정 |
| R8-1·R10-1 | ✅ 유지 (절망 165 < 200, R10-1 -240 누적 59.3%) |

본 보강은 본 협의서의 결정 권한 안에서 처리. baseline v13 측정 결과 도착 시 §13.6 표 갱신 + 1차 KPI 충족 단언 시도.

---

*보강 회의록 끝. PR16 머지 + baseline v13 측정 결과 도착 시 본 §13.5 트랙 A 효과 단정 + R11-1 완전 해소 단언 시도. 미달 시 트랙 B 또는 트랙 C 결정. — 2026-05-12 충족. 갱신 사항은 §14 보강.*

---

## 14. 추가 보강 회의록 (2026-05-12, PR16 머지 + baseline v13 측정 직후 + 트랙 B 채택)

> 참여: PD 김재훈 + 밸런스 권지나. 입력: PR16 머지(시스템 백승호 — playerAI craft 빈도 보강 +20라인) + `BAL_SIM_baseline_v13_result.json` + `BAL_SIM_baseline_v13_report.md` (밸런스 권지나, 367줄).

### 14.1 baseline v13 측정 결과 단정

- fingerprint `len316-h242a5b5f` v3~v13 11연속 유지, bootstrapErrors 0/700, 11.4초, 결정성 100%
- **K1 7직업 0%, 14회 연속 0%**
- K3 v12 → v13:
  - **homeless 4.30 → 4.70 (+0.40d)** ★ PR16 최대 효과
  - chef 5.38 → 5.40 (+0.02d 미미)
  - 다른 5직업 변화 0 (회귀 0)
- K5 v12 → v13: 아사 461→415 (-46) / 절망 165→188 (+23) / 탈수 33→38 (+5) / 극도 피로 41→59 (+18)
- chef 격차 정의 1 v12 +0.6350d → v13 **+0.5833d** (Δ -0.0517d, **homeless 향상으로 격차 좁힘**)
- chef 격차 정의 2 v12 +0.5460d → v13 **+0.4800d** (Δ -0.0660d, **R11-1 정의 2 후퇴**)

### 14.2 트랙 A 실패 단언

**원인 단정 (시스템 백승호 1차 단정):**
- chef는 day 1~2 morale·nutrition 충분으로 PR16 추가 발동 임계(morale<30 OR nutrition<50) 미도달
- day 5~6 임계 도달 시 입력 자원(spice_blend·pantry_basic·herb) 이미 소진 → actCook null
- chef craft 빈도 0.372 fires/day로 7직업 최저
- chef K5 탈수+아사 73% — nutrition·hydration 결핍이 사망 본질

**트랙 A 실패 단언:** craft 빈도 보강만으로는 chef 1차 KPI 충족 불가능. R15-1 완전 해소는 달성됐으나 R11-1 완전 해소의 *충분 조건이 아님*.

### 14.3 R11-1 정의 2 후퇴 단정

**원인 단정:**
- homeless K3 +0.40d 향상이 cooking lv 0 5직업 평균을 4.832 → 4.92로 끌어올림
- chef K3 +0.02d 미미한 상승만 → 정의 2 격차 (chef - others5) 자연 축소
- **chef 향상이 아닌 비교군 향상이 격차 좁힘 패턴** — PR16 트랙 A의 부작용

**의의:**
- 협의서 v5 §12 R11-1 정의 2 해소 단언(v11 +0.560d)이 v13에서 미해소로 후퇴 — 보존 가치 단정
- PR16 유지 vs 롤백 결정 분기점

### 14.4 R15-1 완전 해소 단정

**측정 사실 (시스템 백승호 1차 단정):**
- cooking lv 0 4직업 craft 발동 빈도 향상 — doctor 0.616 / soldier 1.010 / firefighter 0.800 / engineer 1.144 (+0.4~0.7 fires/day)
- homeless 0.855 (+0.555). day 1회 → day ~1회 패턴 정합

**R15-1 완전 해소 단정.** 단 R11-1 완전 해소·1차 KPI 충족과는 독립 — R15-1과 R11-1 분리 단정.

### 14.5 트랙 B 채택 — chef high-nutrition 자원 추가

**3 트랙 비교 매트릭스 (v13 보고서 §10.4 인용):**

| 트랙 | 사양 | 분량 | R11-1 완전 해소 | 정의 2 보존 |
|------|------|------|----------------|------------|
| B | chef high-nutrition 자원 추가 | ~50라인 | 가능성 중 | ❌ (PR16 유지) |
| C | M3 마감 + M4 이월 | 0라인 | 포기 | ❌ |
| D | PR16 롤백 | ~5라인 | 포기 | ✅ (+0.546d) |

**PD 김재훈:**
> 트랙 B가 적극적 R11-1 완전 해소 시도. PR16 유지로 정의 2 후퇴 수용하지만, chef 신규 자원으로 chef 절대값 향상 → 정의 2 자연 회복 가능. 단 R11-1 완전 해소 실패 시 트랙 D 폴백 또는 트랙 C 최종 결정.
>
> **트랙 B 채택.** chef nutrition·hydration 회복 추가 자원으로 사망일 day 6+ 이동 시도. baseline v14 후 1차 KPI 충족 단언 시도.

**밸런스 권지나:**
> 트랙 B 채택 동의. chef high-nutrition 자원 사양:
> - nutrition·hydration 직접 보강 (chef 사망 사유 73% 탈수+아사 대응)
> - durability 1~2 (1~2회 소비, day 5~6 임계 시점 보유 보장)
> - chef 정체성 정합 (요리 전문가 어휘)
> - K3 추정 +0.5~1.0d (사망일 day 5~6 → day 6~7 이동)
>
> chef K3 6.5 초과 위험 모니터링 — 협의서 v5 §3.3 effect 값 범위 가드레일 준수.

### 14.6 chef 신규 자원 사양 가드레일 (시나리오 한도연 위임)

| 가드레일 | 결정값 |
|---------|--------|
| 자원 수 | 1~2개 chef 전용 |
| 효과 방향 | nutrition·hydration 직접 보강 (chef 탈수+아사 73% 대응) |
| nutrition 범위 | +30~+50 (boiled_water 65·cooked_noodles 35 패턴 대비 강화) |
| hydration 범위 | +20~+40 (탈수 회복 동시) |
| durability | 1~2 (1~2회 소비, day 5~6 임계 보유 보장) |
| morale 효과 | +0~+5 (PR14·PR16 chef 자원의 morale 효과 누적 회피) |
| chef 정체성 | 요리 전문가 어휘 (예: chef_meal_kit·premium_ration·hearty_stew) |
| 4곳 등록 룰 | items_misc.js + stackConfig + CardFactory + chef startingItems |
| K3 추정 향상 | +0.5~1.0d (사망일 day 5~6 → day 6+ 이동) |
| chef K3 상한 | ≤ 6.5 (협의서 §3.3 3차 KPI 안전) |
| 6 게이트 검수 | 직업 정체성·생존 균형·플레이 유지·서사 결합·도구 호환·측정 가능성 |

신규 SCN_QUEST 또는 SCN_QUEST_chef_tier2.md §보강 — 시나리오 한도연 결정 영역.

### 14.7 §13.6 다음 단계 갱신

| 순위 (갱신) | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | SCN_QUEST_chef_supply.md (또는 SCN_QUEST_chef_tier2.md §보강) — chef high-nutrition 자원 사양 결정 + §8 patch diff 후보. §14.6 가드레일 준수 | 시나리오 한도연 | 본 보강 회의록 채택 직후 |
| **2** | PR17 머지 — chef 전용 high-nutrition 자원 추가. characters.js + items_misc.js + stackConfig.js + CardFactory.js 4곳 등록 룰 충족 | 시스템 백승호 | SCN_QUEST 도착 후 |
| **3** | baseline v14 측정 — PR17 효과 단정. chef 사망일 분포 + K3 + 1차 KPI 충족 여부 | 밸런스 권지나 | PR17 머지 D+1 |
| **4** | 1차 KPI 충족 단정 (≥ +1.0d) → R11-1 완전 해소 단언 / 미달 시 트랙 D (PR16 롤백) 또는 트랙 C (M3 마감) 결정 | PD/Balance 협의 | baseline v14 보고 D+0 |
| 5 | (조건부 트랙 D) PR16 롤백 — R11-1 정의 2 해소 보존. ~5라인 | 시스템 백승호 | 트랙 B 실패 시 |
| 6 | (조건부 트랙 C) M3 마감 — R11-1 정의 2 후퇴 수용, M4 이월 | PD 김재훈 | 트랙 B·D 모두 실패 시 |
| 7 | PR17 추가 작업 — soldier 추가 조정 또는 firefighter 재검토. 우선순위 후순위 | 시나리오 한도연 + 시스템 백승호 | baseline v14 후 |
| 8 | PR18 dismantle sim 모사 — R13-1 완전 해소 | 시스템 백승호 | PR17 머지 후 |
| 9 | sketch_notebook + pharmacy_notes paper 정의 정리 | 시스템 백승호 | 독립 |
| 10 | M3 #15 AD UI 변경 권고 2건 | AD 오은별 | 독립 |
| 11 | (M4+) drift.mjs leaf 값 hash 컬럼 추가 | 시스템 백승호 | M4 진입 시 |

### 14.8 결정 종합 — 보강

| 안건 | 결정 |
|------|------|
| 트랙 A 실패 단언 | **확정** — chef day 1~2 임계 미도달 / day 5~6 입력 자원 소진 |
| R11-1 정의 2 후퇴 | **확정** — v12 +0.546d → v13 +0.480d (homeless 향상 부작용) |
| R15-1 완전 해소 | **단정** — craft 빈도 향상 0.4~0.7 fires/day (cooking lv 0 4직업) |
| R11-1 완전 해소 전략 | **트랙 B 채택** — chef high-nutrition 자원 추가 (PR17). 미달 시 트랙 D/C |
| chef 자원 사양 가드레일 | nutrition +30~+50 / hydration +20~+40 / durability 1~2 / 4곳 등록 룰 / chef 한정 |
| 다음 단계 | 시나리오 한도연 SCN_QUEST 작성 → 시스템 백승호 PR17 → baseline v14 |

본 보강은 본 협의서의 결정 권한 안에서 처리. baseline v14 측정 결과 도착 시 §14.7 표 갱신 + 1차 KPI 충족 단언 시도 + 트랙 D/C 폴백 결정.

---

*보강 회의록 끝. SCN_QUEST_chef_supply.md (또는 SCN_QUEST_chef_tier2.md §보강) 도착 시 §14.6 가드레일 적용 검증 + PR17 머지 트리거 충족 단언. baseline v14 측정 결과 도착 시 R11-1 완전 해소 단언 시도. — 2026-05-12 트랙 정체성 단정 추가. §15 참조.*

---

## 15. 트랙 정체성 단정 — "시뮬 정합 게임 데이터 작성" (2026-05-12 메타 결정)

> 참여: PD 김재훈 + 밸런스 권지나. 사용자(프로젝트 책임자) 결정: **옵션 1 채택**.

### 15.1 결정 배경

협의서 v3 §12.1·§13.6 + v4 §13.6 + v5 §13.3에서 반복적으로 노출된 단정:
- 시뮬 `tools/sim/v2/playerAI.mjs`는 **게임 본체와 1:1 정합 PR이 아닌 *이상적 player 행동 대리 추정 모델***
- baseline K1·K3 값은 *시뮬 player가 needs-aware/PR15 ability 가산/PR16 craft 빈도 조건에서 행동했을 때의 100일 생존율 추정*
- 본체 실제 player 행동 K1과의 매핑은 **별도 텔레메트리 트랙(M4+)** 의무
- `SYS_VERIFY_cooking_autopick.md` §5.2: 게임 본체에 cooking 자동 추천 알고리즘 *부재* 단정 (시나리오 γ)

이 분리는 PR8·PR9·PR11·PR12·PR13·PR14·PR17(예정) 모두 game `js/data/`·`js/systems/` 변경 (실제 게임 데이터 밸런싱) + PR10·PR15·PR16 모두 `tools/sim/v2/` 변경 (시뮬 정합화)이라는 *코드 위치*의 사실에도 정합.

**문제 패턴 (협의서 v4 §13.6 + v5 §13.3 단정):**
```
시뮬 결함 발견 → 시뮬 보강 (PR10/PR15/PR16) → game data 변경 (PR8/11/12/13/14/17) →
baseline 재측정 → 시뮬 결함 추가 발견 → 시뮬 또 보강
                                ↓
       게임 본체에서 같은 효과가 발생할지는 (시뮬 도구 안에서) 검증 불가
```

### 15.2 트랙 정체성 단언

**본 M3 트랙은 "시뮬에서 측정 가능한 게임 데이터를 작성하는 트랙"으로 정체성을 단정한다.**

운영 단정:
1. baseline KPI(K1·K3·K5·chef 격차 정의 1·2)는 **시뮬 K1의 마지노선**. 게임 본체 K1과의 매핑은 본 트랙 영역 밖
2. game data 변경(PR8·11·12·13·14·17)은 *시뮬에서 측정 가능한* 보강을 우선. *게임 본체에서만 유의미한 변경*(예: UI/UX·시각 효과·플레이버 텍스트)은 본 트랙 외
3. 시뮬 보강(PR10·15·16)은 *측정 도구 정합화*를 우선. 시뮬 측정값이 게임 본체 K1을 예측하지 않더라도, **시뮬 자체 정합성** 유지가 본 트랙의 의무
4. 협의서·SCN_QUEST·BAL_SIM 모든 산출물은 본 트랙 정체성 안에서 해석. KPI 충족 단언은 "시뮬 KPI 충족"으로 해석
5. 실제 게임 본체 K1 검증은 **M4+ 텔레메트리 트랙**으로 분리. 본 M3 트랙은 *시뮬 KPI 마지노선*을 산출물로 함

### 15.3 PD/Balance 시각

**PD 김재훈:**
> 트랙 정체성 단정은 *결정의 신뢰성을 명확화*하는 메타 결정. 그동안 협의서가 자체 단정해 온 사실을 한 곳에 모아 운영 단정으로 격상. 본 트랙의 결정 권한 안에서 처리되는 모든 R/KPI 단정은 *시뮬 도구 안에서의 단정*이며, 게임 본체 K1과의 매핑은 별도 트랙 의무.
>
> M3 마감 시점(트랙 B 성공/실패 후)에 본 트랙 산출물을 정리. M4+ 텔레메트리 트랙은 별도 협의서 v6 또는 신규 트랙으로 진입.

**밸런스 권지나:**
> baseline 보고서의 모든 KPI 단언은 *시뮬 K1·시뮬 K3* 단언으로 해석. 게임 본체 K1·실제 player 행동 K1 예측은 본 트랙 영역 밖. 본 단정으로 시뮬 측정의 신뢰성 한계가 명확화됨.
>
> 단 시뮬 KPI 단언은 *게임 데이터의 시뮬 정합성*을 보장. 시뮬에서 측정 가능한 게임 데이터를 작성한다는 의미에서 본 트랙은 의미 있음.

### 15.4 결정 종합

| 안건 | 결정 |
|------|------|
| 트랙 정체성 | **"시뮬 정합 게임 데이터 작성" 트랙으로 단정** |
| baseline KPI 해석 | 시뮬 K1·K3·K5 마지노선. 게임 본체 K1과 분리 |
| game data 변경 (PR8 등) | 시뮬 측정 가능한 보강 우선. 본체 전용 변경은 본 트랙 외 |
| 시뮬 보강 (PR10·15·16) | 측정 도구 정합화 우선. 시뮬 자체 정합성 유지 |
| 게임 본체 K1 검증 | **M4+ 텔레메트리 트랙으로 분리** |
| 본 M3 트랙 산출물 | *시뮬 KPI 마지노선* + 시뮬 정합 게임 데이터 + 5직업 Tier-2 abilities |

### 15.5 영향

- 본 단정 직후 진행되는 M3 #24 트랙 B (chef high-nutrition 자원 + PR17)는 *시뮬 정합 게임 데이터*로 해석
- baseline v14 측정 시 R11-1 완전 해소 단언은 *시뮬 R11-1* 완전 해소로 해석
- M3 마감 시점에 트랙 정체성 명시 + M4 텔레메트리 트랙 진입 권고
- 협의서 v6 신규 발행 시점에 본 §15 단정을 재인용 의무

---

*트랙 정체성 단정 끝. M3 #24 이후 모든 작업은 본 §15 단정 안에서 해석. M4+ 텔레메트리 트랙 진입 시 본 §15를 출발점으로 신규 협의 시작.*




