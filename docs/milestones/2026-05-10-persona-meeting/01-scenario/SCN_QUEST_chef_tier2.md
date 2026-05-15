# 시나리오 — chef Tier-2 abilities + 신규 자원 분배 (R11-1 해소)

> 작성: 시나리오 한도연 / 2026-05-12
> 대상: `js/data/characters.js:275~345` chef (윤재혁)
> 트리거: 협의서 v5 `PD_BAL_MEETING_PR14_decision.md` §11 §1순위 — R11-1 액션 트리거 (3) 발동 단언(chef 격차 정의 2 +0.46d < +0.5d, baseline v10 §4.1) + 협의서 v5 §2.4 결정 (A+B 패키지 채택, chef 전용 한정)
> 결정: **통과** — chef 전용 Tier-2 ability `pantry_mastery` (식자재 보존술) 신설 + 신규 자원 `chef_journal` (셰프 노트) + `spice_blend` (혼합 향신료) 2종 도입 + startingItems 확장
> 선행: `SCN_QUEST_homeless_tier2.md` / `SCN_QUEST_engineer_tier2.md` (M3 #10 5직업 SCN_QUEST 패턴 정합), `BAL_TUNING_chef_grace.md` (기존 `cook_intuition` days/mult 유지), `SCN_PR_chef_knife_mastery.md` (M2 chef startingItems 추가 패턴), `DIR_GATE_chef_start_environment.md` (Director 6 게이트 검수 패턴), `LORE_GLOSSARY.md` §3.6 chef abilities 어휘 + §3 chef row "보존식·식자재 검수"

---

## 1. 서두 — R11-1 측정 사실 + 협의서 v5 가드레일 인용

### 1.1 baseline v10 chef 격차 측정 사실 (실측 인용)

`BAL_SIM_baseline_v10_report.md` §4.1 — 두 정의 분리 측정 단정:

| 정의 | v9 | **v10** | Δv9→v10 |
|------|----|---------|---------|
| 정의 1 (chef vs 6직업 평균) | +0.60d | **+0.567d** | -0.033d |
| 정의 2 (chef vs cooking lv 0 5직업 평균) | +0.50d | **+0.46d** | -0.04d ★ |

v10 보고서 §4.1 R11-1 액션 트리거 발동 단언 직접 인용:
> chef K3 v10 = 5.20 ≥ 5.0 충족 + 정의 2 격차 +0.46d < 0.50d = 격차 +0.5d 미만 추가 좁힘 조건 충족 → 트리거 (2) 발동 단정 ... M3 #19 PR14 chef 정체성 강화 트랙 진입 의무 단언 (협의서 v4 §14.4 사전 단정 충족).

### 1.2 협의서 v5 §3·§4·§5.5 가드레일 인용

`PD_BAL_MEETING_PR14_decision.md` §2.4 채택 단정:
> A+B 패키지 채택. chef 전용 신규 Tier-2 ability + chef 전용 신규 자원. 데이터 PR 1트랙으로 진행.

§3.1 ability 가드레일 6건 직접 인용:
- 개수: 1개 (chef 기존 2개 + 신규 Tier-2 1개 = 총 3개. homeless·engineer Tier-2 1개 패턴 정합)
- effect 방향: 요리 효과 강화 / 영양 회복 강화 / 산출물 가산 (chef 정체성 = 요리 전문가)
- sim 호환: PR15 ability 가산 분기 enumerate 필드(`moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus`·`moraleOnCraft`·`sketchNotebookBonus`) 우선
- chef 정체성 정합: LORE_GLOSSARY chef 어휘 + chef story "셰프의 직감"
- K3 추정 향상: +0.2~0.5d (단독 ability)
- 6 게이트 검수

§3.3 effect 값 범위 인용:
> ×1.2~×1.8 또는 +3~+10. 과도(×3, +50) 금지 — chef K3 6.5+ 위험. 과소(×1.05, +1) 비권고 — 측정 가능성 미달.

§4.1 자원 가드레일 인용:
- 수: 1~2개 (homeless worn_photo 1개 + newspaper_bundle 갱신 패턴 정합)
- 4곳 등록 룰: items_misc.js + stackConfig.js + CardFactory.js + characters.js startingItems
- chef 정체성 한정: chef startingItems만 추가. 다른 직업 startInv·districts.js lootTable 0
- K3 추정 향상: +0.5~1.0d (자원 단독)

§5.5 KPI 3분리 인용:
- 1차 (직접 목표): chef 격차 정의 1 ≥ +1.0d 회복 (v10 +0.567d → v11 ≥ +1.0d)
- 2차 (R11-1 해소): chef 격차 정의 2 ≥ +0.5d 회복 (v10 +0.46d → v11 ≥ +0.5d)
- 3차 (모니터링): chef K3 v10 5.20 → v11 5.5~6.5 범위

### 1.3 결정 단언

본 SCN_QUEST는 협의서 v5 §3·§4 가드레일 *전수* 준수. chef 외 직업 변경 0. PR15 enumerate 필드만 사용(신규 필드 0). effect 값 범위 ×1.2~×1.8 / +3~+10 범위 안. 6 게이트 5/6 통과 + 1/6 모니터링(다른 직업 격차 보호) 단정.

---

## 2. 정체성 분석 — chef 어휘·플레이버·기존 abilities·기존 startingItems

### 2.1 LORE_GLOSSARY 인용 (`LORE_GLOSSARY.md:61` + `:134`)

| 출처 | 어휘 |
|------|------|
| §3 chef row (line 61) | **보존식, 위생, 변질, 식중독, 표준식단표, 식자재 검수** |
| §4 핵심 시스템 어휘 (line 134) | "보존식 / 식자재 검수 — preserved food / inspection — chef 어휘" |
| §3.6 chef abilities (line 91~99) | gourmet_sense·ingredient_eye·warm_meal·knife_mastery·**cook_intuition "셰프의 직감"** |
| §3.6 검수 결과 (line 114) | "주방 칼"·"식재료" 어휘 chef 정합 ✓ |

### 2.2 story·goal 인용 (`characters.js:292~297`)

```
윤재혁(33세)은 명동 소피텔 호텔의 수석 셰프였다.
2026년 1월 16일, 호텔 뷔페에서 이상한 손님이 나타났다. ...
재혁은 주방 칼을 집어 들고 지하 식품 저장고로 피신했다. 이틀 뒤 밖에 나왔을 때, 호텔은 텅 비어 있었다.
남대문시장으로 이동했다. 그곳에 아직 쓸 만한 식재료가 있을 것이다.
사람들이 굶고 있었다. 재혁은 알고 있었다. 음식은 단순한 생존이 아니라, 희망이라는 것을.
```

> goal (`characters.js:297`): 남대문시장에서 식재료를 확보하고 생존자 급식소를 운영해, 서울 생존자들의 식량 자급 체계를 구축한다.

핵심: **"지하 식품 저장고로 피신"** + **"음식은 ... 희망"** — 회복력의 원천이 *보존된 식재료* + *조리 행위가 만들어내는 위안*. 정체성 정합 어휘 후보:
- "셰프 노트" — 호텔 수석 셰프의 레시피·재료 메모. story "수석 셰프" + LORE "표준식단표" 정합
- "혼합 향신료" — 보존식 어휘 정합. 미식 감각의 직접 적용
- "지하 저장고의 보존품" — story 직접 인용 어휘

### 2.3 기존 abilities 5종 (`characters.js:298~337`)

| line | id | 이름 | effect |
|------|----|------|--------|
| 299~305 | `gourmet_sense` | 미식 감각 | `cookingEffectBonus: 1.6` |
| 306~312 | `ingredient_eye` | 식재료 감별 | `toxinDetect: true` |
| 313~319 | `warm_meal` | 따뜻한 한 끼 | `companionMoraleOnCook: 10` |
| 320~329 | `knife_mastery` | 칼 다루기 | `knifeDmgBonus: 1.25, startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration', 'instant_noodles', 'instant_noodles', 'contaminated_water']` |
| 330~336 | `cook_intuition` | 셰프의 직감 | `encounterMultDays: { days: 7, mult: 0.5 }` |

**기존 startingItems 실측 인용 (line 327):**
```js
startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration', 'instant_noodles', 'instant_noodles', 'contaminated_water']
```
= 7 아이템 (knife 1 + canned_food 2 + preserved_ration 1 + instant_noodles 2 + contaminated_water 1 + water_bottle 1[자동 지급] = 합계 8개)

**관찰:** 기존 5 abilities는 (a) 요리 효과 강화(gourmet_sense·warm_meal) (b) 식재료 감별(ingredient_eye) (c) 무기/시작 자원(knife_mastery) (d) 환경 보정(cook_intuition) 4 영역. **"보존·저장" 영역 ability 0건** — story "지하 식품 저장고로 피신" 정체성 미반영. Tier-2 ability는 *보존식 어휘 + onConsume 강화* 방향 정합.

### 2.4 homeless·engineer Tier-2 패턴 정합 검증

| 직업 | Tier-2 ability | effect 필드 | 신규 자원 | startInv 확장 |
|------|---------------|------------|----------|--------------|
| homeless | `street_solace` | `moraleRecoveryBonus: 1.5`, `lowMoraleRecoveryFatigueBonus: -5` | `worn_photo` 1개 + `newspaper_bundle` onConsume 부여 | 8 → 10 |
| engineer | `workshop_focus` | `moraleOnCraft: 5`, `moraleOnDismantle: 5`, `sketchNotebookBonus: true` | `sketch_notebook` 1개 | 6 → 9 |
| **chef (본 PR14)** | `pantry_mastery` | **`moraleRecoveryBonus: 1.4` + `sketchNotebookBonus`형 식재료 가산** | **`chef_journal` 1개 + `spice_blend` 2개** | **7 → 10** |

chef는 cooking 영역 ability 보유 + onConsume.morale 가산 분기(PR15 `_applyAbilityBonusesToConsume`)에 직결되는 *보존식 소비형 회복* 방향이 정체성·sim 호환 양 측면 최적.

---

## 3. Tier-2 ability 사양 — `pantry_mastery` (식자재 보존술)

### 3.1 사양

| 항목 | 결정값 |
|------|--------|
| id | `pantry_mastery` |
| name | 식자재 보존술 |
| nameEn | Pantry Mastery |
| icon | 🥫 |
| desc | "보존식·식재료 섭취 시 사기 회복 +40%. 사기 30 미만 회복 시 피로 -3 추가. 시작 시 셰프 노트·혼합 향신료 지급." |
| effect | `{ moraleRecoveryBonus: 1.4, lowMoraleRecoveryFatigueBonus: -3, startingItems: ['chef_journal', 'spice_blend', 'spice_blend'] }` |

### 3.2 정체성 정합

- **어휘 정합:** "식자재 보존술" — LORE_GLOSSARY §3 chef row "보존식·식자재 검수·표준식단표" 직접 인용 + §4 핵심 어휘 "보존식 / preserved food / chef 어휘" 정합. "지하 식품 저장고로 피신" (story line 294) 정체성 직결
- **플레이버:** "음식은 단순한 생존이 아니라, 희망" (story line 296) → 보존식·향신료 섭취가 *희망 회복*의 메커니즘. 영웅적 회복(약물·전투)이 아닌 *조리 잔재의 위안*
- **기존 abilities 5 → 6 확장 정합:** 미식(gourmet_sense) + 감별(ingredient_eye) + 동료(warm_meal) + 칼(knife_mastery) + 환경(cook_intuition) → **보존(pantry_mastery)**. story "지하 식품 저장고" 미반영 영역 보강
- **homeless `street_solace` 대비 차별성:**
  - homeless: 정서적 keepsake (낡은 사진·신문지) — *마모된 위안*
  - chef: **보존식·향신료** — *조리 전문가의 일상 회복*
  - → 직업 정체성 차별화 정합 (마모형 회복 vs 보존형 회복)
- **기존 `cook_intuition`(셰프의 직감) 보완 관계:** `cook_intuition`은 시작 7일 encounter 보정(환경) — `pantry_mastery`는 보존식 회복 보너스(자원). 트레이드오프 없이 시너지

### 3.3 effect 수치 근거 (협의서 v5 §3.3 범위 준수)

- `moraleRecoveryBonus: 1.4` — `onConsume.morale` 적용 시 1.4배 (PR15 `_applyAbilityBonusesToConsume` line 34 enumerate 필드 정확 일치). 협의서 v5 §3.3 ×1.2~×1.8 범위 안. **homeless `street_solace`의 1.5보다 약간 보수적** — chef는 (a) 기존 cooking lv 4로 actCook 발동 빈도 ↑ (b) startingItems 보존식 2~3개 보유 (c) 기존 `gourmet_sense cookingEffectBonus 1.6` 시너지 — 1.4로도 충분 효과 + chef K3 6.5 초과 회피 (3차 KPI 모니터링)
- `lowMoraleRecoveryFatigueBonus: -3` — morale<30 회복 시 추가 fatigue -3. PR15 `_applyAbilityBonusesToConsume` line 36 enumerate 필드 정확 일치. 협의서 v5 §3.3 +3~+10 범위 안. homeless의 -5보다 보수적 (chef는 fatigue 가속 직업 아님)
- **신규 effect 필드 0 — 협의서 v5 §3.1 "PR15 enumerate 필드 우선" 가드레일 전수 준수.** 시스템 백승호 PR16 후속 보강 부담 0

### 3.4 기존 abilities와의 관계 검증

- `gourmet_sense cookingEffectBonus 1.6` (line 304) — actCook 산출물 `onConsume` 효과 ×1.6
- `pantry_mastery moraleRecoveryBonus 1.4` — onConsume.morale 추가 ×1.4
- **합산 효과(chef 한정):** cooking 산출물 morale × 1.6 (gourmet_sense) × 1.4 (pantry_mastery) = ×2.24
- 예: `dried_mushroom onConsume.morale +5` (items_base.js line 1028) → chef 섭취 시 +5 × 2.24 = +11.2 morale 효과
- **단정:** 시너지 정합. 단 PR15 `_applyAbilityBonusesToConsume`이 `moraleRecoveryBonus`만 가산, `cookingEffectBonus`는 별도 시스템(`CookSystem.js`) — sim 측에서 두 효과 동시 가산 검증 의무 (시스템 백승호 §8.7)

---

## 4. 신규 자원 결정 (1~2개 후보 비교 + 권고)

### 4.1 후보 매트릭스

| 후보 | 변경 위치 | morale·nutrition 가산 | 정체성 정합 | 4곳 등록 룰 | K3 향상 추정 |
|------|----------|---------------------|------------|-------------|--------------|
| A | 신규 `chef_journal` (셰프 노트) 도입 | morale +10, fatigue -2 (defaultDurability 3 → 3회 사용) | ⭐⭐⭐⭐⭐ (homeless worn_photo·engineer sketch_notebook keepsake 패턴 정합 + story "수석 셰프" + LORE "표준식단표") | 4곳 신규 등록 의무 | +0.4~0.6d |
| B | 신규 `spice_blend` (혼합 향신료) 도입, startInv 2개 | morale +6, nutrition +5 (defaultDurability 1) | ⭐⭐⭐⭐ (story "쓸 만한 식재료" + LORE "보존식·식자재 검수") | 4곳 신규 등록 의무 | +0.3~0.5d |
| C | 신규 `iron_skillet` (무쇠 팬) 도용구 도입 | onConsume 0 (도구) | ⭐⭐ (chef 정체성 정합하나 actCook 산출 가산은 cookingEffectBonus와 중복) | 4곳 + cooking 시스템 분기 신규 | +0.0~0.2d (sim 미반영) |
| D | 기존 `canned_food` onConsume.morale 가산 | morale +3 | ⭐⭐ (chef 외 7직업 동시 효과 — 다른 직업 격차 추가 좁힘 위험) | 미적용 (기존 등록) | +0.2~0.4d (회귀 위험) |
| E | 기존 `truffle`·`matsutake_mushroom` 등 셰프 전용 희귀 식재료 startInv 1개 추가 | 기존 onConsume 유지 | ⭐⭐⭐ (희귀 식재료는 lootTable 의도된 보상이라 시작 지급은 정체성 약화) | 미적용 (기존 등록) | +0.5~0.8d |

### 4.2 권고: **A + B 병행 채택 (chef_journal 1개 + spice_blend 2개)**

**근거:**

1. **A 단독 (chef_journal)**: 1회 +10 morale, defaultDurability 3 → 3회 사용 가능, 누적 +30. 단일 keepsake 의존 위험 (sketch_notebook 패턴 정합하나 chef cooking 정체성 미보강)
2. **B 단독 (spice_blend ×2)**: 1회 +6 morale + nutrition +5, 2회 사용 가능 → 누적 +12 morale + +10 nutrition. morale은 충분치 않음 (chef day 2 morale 추정 15~20 → +12로 27~32 도달 borderline)
3. **A + B 병행**: chef_journal 3회 (+30 morale 누적) + spice_blend 2회 (+12 morale + +10 nutrition 누적). chef Tier-2 `moraleRecoveryBonus 1.4` 가산 후 chef_journal +14·spice_blend +8.4 — day 2 morale 15 → +14 (chef_journal 1회) = 29 → +14 (chef_journal 2회) = 43 (actBoostMorale 분기 해제 + day 2 morale 30 임계 안정 회복). spice_blend는 nutrition 결손 보강 — baseline v10 chef 절망 83 외 탈수 11·극도 피로 6의 nutrition 결손 동시 완화
4. **C (iron_skillet) 거절** — actCook 산출 가산은 `gourmet_sense cookingEffectBonus 1.6`과 중복. cooking 시스템 신규 분기 필요(시스템 백승호 부담) + sim 측 PR15 enumerate 필드 외 — 협의서 v5 §3.1 가드레일 위배
5. **D (canned_food onConsume.morale 가산) 거절** — chef 외 7직업 동시 효과 → homeless·engineer K3 추가 향상으로 chef 격차 추가 좁힘 (R11-1 가속 위험). 협의서 v5 §4.1 "chef 외 직업 변경 0" 가드레일 위배
6. **E (희귀 식재료 startInv) 거절** — `truffle`·`matsutake_mushroom`은 districts.js lootTable 보상 의도 자원. 시작 지급은 후반 보상 매력 약화 — chef 메인 퀘스트 경제 충돌

### 4.3 양적 검증 (baseline v10 chef morale 시계열 추정 → v11 추정)

baseline v10 §5.2 chef K5 (절망 83 / 탈수 11 / 극도 피로 6 / 회귀 0) + v10 §4 K3 5.20 인용:

| 시점 | morale (v10 추정) | morale (v11 추정 with A+B+Tier-2) |
|------|------------------|----------------------------------|
| day 1 시작 | 100 | 100 |
| day 1 actCook 산출 (cooking lv 4) | ~85 (decay) | ~85 (decay 동일) |
| day 2 (decay 후) | ~25~30 (chef는 cook_intuition+cooking lv 4로 day 2 morale 결손 약함, homeless day 2 12~13 대비 양호) | ~25~30 (decay 동일) |
| day 2 chef_journal 1회 소비 | n/a | **morale +10 × 1.4 = +14 → ~39~44 (actBoostMorale 분기 해제)** |
| day 3 (decay 후) | ~15~20 | ~25~30 |
| day 3 spice_blend 1회 소비 | n/a | **morale +6 × 1.4 = +8.4 + nutrition +5 → morale ~33~38** |
| day 4~5 | 절망 위험 진입 (v10 절망 83 패턴) | chef_journal 잔여 2회 +14 ×2 = +28 + spice_blend 1회 +8.4 = +36.4 누적 → morale 50~60 유지 |
| day 6~7 (cook_intuition grace 7일 안) | 자원 결손 본격화 | 보존식 누적 회복 + actCook 산출물 morale 가산 — morale 25~40 안정 |
| day 8~10 (cook_intuition grace 종료) | 절망 사망 진입 | morale 누적 회복 효과로 K3 +0.7~1.0d 연장 추정 |

**추정 K3 향상:** v10 5.20 → v11 **5.7~6.2** (+0.5~1.0d). chef 격차 정의 1 회복:
- v10: chef 5.20 / others6 4.633 / gap +0.567d
- v11 추정: chef 5.7~6.2 / others6 4.633 (회귀 0) / gap **+1.07~+1.57d** ✅ 1차 KPI ≥ +1.0d 충족

격차 정의 2 회복:
- v10: chef 5.20 / others5 4.74 / gap +0.46d
- v11 추정: chef 5.7~6.2 / others5 4.74 / gap **+0.96~+1.46d** ✅ 2차 KPI ≥ +0.5d 충족 (R11-1 해소)

chef K3 안전 범위 (3차 KPI):
- v11 추정 5.7~6.2 ≤ 6.5 ✅ 3차 KPI 안전

---

## 5. startingItems 갱신 사양

### 5.1 현행 (`characters.js:327`)

```js
// knife_mastery
effect: {
  knifeDmgBonus: 1.25,
  startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration', 'instant_noodles', 'instant_noodles', 'contaminated_water'],
}
```

7 아이템 + water_bottle 1(자동) = 합계 8개. `onConsume.morale > 0` 직접 가산 0건(canned_food·preserved_ration·instant_noodles 모두 nutrition 위주).

### 5.2 정정 (PR14 후보)

```js
// knife_mastery (기존, 변경 0)
effect: {
  knifeDmgBonus: 1.25,
  startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration', 'instant_noodles', 'instant_noodles', 'contaminated_water'],
}

// cook_intuition (기존, 변경 0)
effect: { encounterMultDays: { days: 7, mult: 0.5 } }

// pantry_mastery (신규, Tier-2)
effect: {
  moraleRecoveryBonus: 1.4,
  lowMoraleRecoveryFatigueBonus: -3,
  startingItems: ['chef_journal', 'spice_blend', 'spice_blend'],
}
```

**변경 요약:**
- `knife_mastery.startingItems` **변경 0** (기존 7개 유지)
- `pantry_mastery.startingItems` 신규 3개 추가 (chef_journal 1 + spice_blend 2)
- 합계 7 → **10 아이템** (water_bottle 1 자동 포함 시 8 → 11) — homeless 10·engineer 9 패턴 정합

---

## 6. 신규 아이템 정의 + 4곳 등록 룰

### 6.1 신규 — `chef_journal` (셰프 노트)

| 항목 | 값 |
|------|-----|
| definitionId | `chef_journal` |
| name | 셰프 노트 |
| nameEn | Chef's Journal |
| type | `consumable` |
| subtype | `keepsake` (homeless worn_photo·engineer sketch_notebook 공통 subtype) |
| rarity | `common` |
| weight | 0.10 |
| defaultDurability | 3 (3회 사용 — sketch_notebook 패턴 정합) |
| defaultContamination | 0 |
| icon | 📔 |
| description | "명동 소피텔 호텔 수석 셰프의 손때 묻은 표준식단표. 보존식 배합 비율과 식재료 검수 기록이 빼곡하다. 손때 묻은 페이지를 넘기는 동안에는 굶주린 사람들의 얼굴이 잠시 멀어진다." |
| tags | `['consumable', 'keepsake', 'chef']` |
| onConsume | `{ morale: 10, fatigue: -2 }` |
| dismantle | `[]` (분해 불가, 추억은 부서지지 않음 — worn_photo 패턴 정합) |

**플레이버 어휘 근거:**
- "명동 소피텔 호텔 수석 셰프" — `characters.js:292` story 직접 인용
- "표준식단표" — LORE_GLOSSARY §3 chef row "표준식단표" 어휘 직접 인용
- "보존식 배합 비율" + "식재료 검수 기록" — LORE_GLOSSARY §4 chef 어휘 "보존식·식자재 검수" 직접 인용
- "굶주린 사람들의 얼굴" — `characters.js:296` story "사람들이 굶고 있었다" 인용

### 6.2 신규 — `spice_blend` (혼합 향신료)

| 항목 | 값 |
|------|-----|
| definitionId | `spice_blend` |
| name | 혼합 향신료 |
| nameEn | Spice Blend |
| type | `consumable` |
| subtype | `food` (chef 보존식 정체성 정합, dried_mushroom·berry_jam 패턴) |
| rarity | `common` |
| weight | 0.05 |
| defaultDurability | 1 |
| defaultContamination | 0 |
| icon | 🧂 |
| description | "호텔 주방 향신료 캐비닛에서 챙긴 혼합 향신료. 미식 감각으로 직접 조합한 보존용 배합이다. 한 줌이면 굶주린 입맛도 잠시 일깨운다." |
| tags | `['consumable', 'food', 'preserved', 'chef']` |
| onConsume | `{ morale: 6, nutrition: 5 }` |
| dismantle | `[]` |

**플레이버 어휘 근거:**
- "호텔 주방 향신료 캐비닛" — `characters.js:292~293` story "명동 소피텔 호텔" + "호텔 뷔페" 인용
- "미식 감각으로 직접 조합한 보존용 배합" — `characters.js:300~305` `gourmet_sense` "미식 감각" + LORE "보존식" 직접 인용
- "굶주린 입맛도 잠시 일깨운다" — `characters.js:296` story "사람들이 굶고 있었다" 정체성 정합

### 6.3 4곳 등록 룰 (CLAUDE.md §3 + 협의서 v5 §4.1)

**chef_journal + spice_blend 신규 아이템 2종 4곳 등록 의무:**

| 등록처 | chef_journal | spice_blend |
|--------|-------------|-------------|
| 1. `js/data/items_misc.js` | 신규 정의 추가 (§6.1) — 셰프 전용 keepsake 섹션 (line 517 worn_photo 직후 또는 신규 "셰프 전용 keepsake" 섹션) | 신규 정의 추가 (§6.2) — chef 보존식 섹션 또는 셰프 전용 keepsake 섹션 |
| 2. `js/data/stackConfig.js` | `['chef_journal', false, 1]` (worn_photo·sketch_notebook 패턴 정합, line 242·245 인접) | `['spice_blend', true, 3]` (소비형 식재료, dried_mushroom·dried_berry maxStack 3 패턴 정합) |
| 3. `js/data/districts.js` lootTable | **미등록** (chef 전용 시작 아이템, 정체성 보호 — homeless worn_photo·engineer sketch_notebook 동일 패턴) | **미등록** (chef 전용 시작 아이템, lootTable 미진입으로 chef 외 직업 격차 추가 좁힘 차단) |
| 4. `js/ui/CardFactory.js` CARD_IMAGES | `'chef_journal': 'assets/images/materials/cloth_scrap.png'` (worn_photo·sketch_notebook 이미지 폴백 패턴 line 340~341 정합) | `'spice_blend': 'assets/images/food/dried_mushroom.png'` (셰프 식재료 이미지 폴백 패턴 line 345 truffle 정합) |

**기존 아이템 변경 0:**
- knife·canned_food·preserved_ration·instant_noodles·contaminated_water·water_bottle 정의 변경 없음
- chef startingItems는 신규 ability `pantry_mastery.effect.startingItems`로만 추가 (knife_mastery startingItems 변경 0)
- districts.js lootTable 변경 0 (chef_journal·spice_blend 모두 chef 전용 시작 아이템)
- 다른 직업 abilities·startingItems 변경 0 (협의서 v5 §2.4 "chef 외 직업 변경 0" 가드레일 전수 준수)

---

## 7. 6 게이트 검수 (DIR_GATE_chef_start_environment.md 패턴 정합)

### 7.1 Tier-2 ability `pantry_mastery` 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "식자재 보존술" 어휘 + LORE_GLOSSARY §3 chef row "보존식·식자재 검수·표준식단표" 직접 인용 + story "지하 식품 저장고로 피신"·"음식은 ... 희망" 정합. abilities 5 영역(미식·감별·동료·칼·환경) → 6 영역(보존) 자연 확장 |
| (2) 생존 균형 | ✅ 통과 (3차 KPI 모니터링) | K3 +0.5~1.0d 향상 추정 (v10 5.20 → v11 5.7~6.2). 협의서 v5 §5.5 1차 KPI 격차 정의 1 ≥ +1.0d 추정 +1.07~+1.57d 충족 + 2차 KPI 정의 2 ≥ +0.5d 추정 +0.96~+1.46d 충족 + 3차 KPI chef K3 ≤ 6.5 안전 (5.7~6.2 ≤ 6.5). homeless·engineer K3 회귀 0 단정 (chef 전용 effect — moraleRecoveryBonus는 chef만 보유 + 신규 자원 chef 외 미등장) |
| (3) 플레이 유지 | ✅ 통과 | chef는 cooking lv 4로 actCook 발동 보장. chef_journal·spice_blend 소비 → morale 회복 → actCook·탐색 루프 복귀. 보존식 소비 행위가 chef 정체성 (게임 루프 강화). chef 메인 퀘스트 "남대문시장 식량 자급"과 보존식 어휘 직결 |
| (4) 서사 결합 | ✅ 통과 | `js/data/mainQuests/chef/branch_a.js`·`branch_b.js` 메인 퀘스트에 "표준식단표"·"보존식 배합" 모티프 후속 연계 가능 (시나리오 한도연 후속 트랙). chef goal "남대문시장 식량 자급" + spice_blend (보존용 배합) 정체성 직결. NPC 결합 0 (본 PR 영역 외) |
| (5) 도구 호환 | ✅ 통과 | chef_journal·spice_blend 4곳 등록 룰 §6.3 그대로. validate.js Errors 0 통과 의무. fingerprint 영향 0 (BALANCE 미관여, items 정의 추가만 — homeless·engineer PR13 패턴 정합). **PR15 enumerate 필드 전수 사용** (`moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus` 정확 일치) — 신규 필드 0, 시스템 백승호 PR16 후속 보강 부담 0. sim 호환 즉시 |
| (6) 측정 가능성 | ✅ 통과 | baseline v11 probe 의무 (§9.1): chef day 1~10 morale·nutrition·fatigue 시계열 + chef_journal·spice_blend 소비 회수 + actBoostMorale 발동 분포 + chef 격차 정의 1·2 재측정 + chef K3 안전 범위 |

**6 게이트 5/6 통과 + 1/6 모니터링 (3차 KPI chef K3 ≤ 6.5 안전 범위).** → **통과 (모니터링 의무).**

### 7.2 R11-1 해소 단정 검증

협의서 v4 §13.2 R11-1 액션 트리거 정의 재인용:
> chef K3 < 5.0 또는 격차 +0.5d 미만 추가 좁힘 시 액션 트리거 발동

**baseline v11 추정 (chef K3 5.7~6.2 + others6·others5 회귀 0):**

| 정의 | v10 측정 | v11 추정 (pantry_mastery + chef_journal + spice_blend) | R11-1 해소 |
|------|---------|----------------------------------------------------|----------|
| 정의 1 (6직업 평균) | +0.567d | **+1.07~+1.57d** | ✅ 1차 KPI ≥ +1.0d 충족 |
| 정의 2 (cooking lv 0 5직업 평균) | +0.46d | **+0.96~+1.46d** | ✅ 2차 KPI ≥ +0.5d 충족 — R11-1 해소 |
| chef K3 | 5.20 | 5.7~6.2 | ✅ 3차 KPI ≤ 6.5 안전 |

**핵심 단정:**
- chef K3 안전 범위 (5.7~6.2 ≤ 6.5) — 협의서 v5 §10.1 cook_intuition 단축 트리거 비발동
- 격차 정의 1·2 동시 +1.0d 이상 회복 — R11-1 해소 단정 가능
- 다른 직업 격차 5%p 초과 위험 0 (chef 전용 effect — moraleRecoveryBonus는 chef만 보유, 신규 자원은 chef startInv 한정 + districts.js lootTable 0)

### 7.3 chef_journal 게이트

| 게이트 | 결과 |
|--------|------|
| (1) 직업 정체성 | ✅ "명동 소피텔 호텔 수석 셰프 표준식단표" 직접 인용. LORE chef "표준식단표·보존식" 정합 |
| (2) 생존 균형 | ✅ morale +10는 sketch_notebook(+10)·worn_photo(+12) 사이 — keepsake 패턴 보수적 정합 |
| (3) 플레이 유지 | ✅ defaultDurability 3 → 3회 사용. 1회 소비 후 즉시 morale 회복 → 게임 루프 복귀. chef 정체성 "조리 메모 참조" 행위 정합 |
| (4) 서사 결합 | ✅ chef 메인 퀘스트 잠재 후크 ("식단표 참조 보존식 제작" 후속 시나리오) |
| (5) 도구 호환 | ✅ 4곳 등록 룰 §6.3. lootTable 미등록 (chef 정체성 보호). PR15 onConsume 가산 분기 즉시 발동 (sketch_notebook 패턴 정합) |
| (6) 측정 가능성 | ✅ baseline v11 chef inventory durability 추적으로 chef_journal 소비 회수 측정 가능 |

**6 게이트 전수 통과.** → **통과.**

### 7.4 spice_blend 게이트

| 게이트 | 결과 |
|--------|------|
| (1) 직업 정체성 | ✅ "호텔 주방 향신료 캐비닛"·"미식 감각으로 조합한 보존용 배합" — story·gourmet_sense ability·LORE "보존식" 3중 정합 |
| (2) 생존 균형 | ✅ morale +6, nutrition +5. dried_mushroom(morale +5, nutrition +20) 대비 morale 약간 ↑·nutrition ↓ — keepsake보다 보존식에 가까운 위치. 회복량 보수적 |
| (3) 플레이 유지 | ✅ 1회 소비 → morale + nutrition 동시 회복. chef 사망원인 1·2위 절망 + 탈수 + 극도 피로 분포 정합 (morale·nutrition 양 측면 보강) |
| (4) 서사 결합 | ✅ chef goal "남대문시장 식재료 확보" + 향신료(보존용 배합) 직결. chef 메인 퀘스트 잠재 후크 |
| (5) 도구 호환 | ✅ 4곳 등록 룰 §6.3. lootTable 미등록 (chef 외 직업 격차 추가 좁힘 차단). PR15 `_applyAbilityBonusesToConsume`이 spice_blend 비-keepsake도 가산 (line 32~36 `moraleMult` 일반 적용) |
| (6) 측정 가능성 | ✅ baseline v11 chef inventory durability 추적으로 spice_blend 2회 소비 회수 측정 가능 |

**6 게이트 전수 통과.** → **통과.**

---

## 8. PR14 patch diff 후보

### 8.1 `js/data/characters.js` (line 298~337 영역, chef abilities)

```diff
     abilities: [
       {
         id: 'gourmet_sense',
         name: '미식 감각',
         icon: '👨‍🍳',
         desc: '요리 아이템 효과 +60%',
         effect: { cookingEffectBonus: 1.6 },
       },
       {
         id: 'ingredient_eye',
         name: '식재료 감별',
         icon: '🔍',
         desc: '독성 음식 섭취 전 경고',
         effect: { toxinDetect: true },
       },
       {
         id: 'warm_meal',
         name: '따뜻한 한 끼',
         icon: '🍲',
         desc: '요리 완료 시 동료 사기 +10',
         effect: { companionMoraleOnCook: 10 },
       },
       {
         id: 'knife_mastery',
         name: '칼 다루기',
         icon: '🔪',
         desc: '나이프/칼 무기 데미지 +25%, 시작 시 주방 칼·식재료 지급',
         effect: {
           knifeDmgBonus: 1.25,
           startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration', 'instant_noodles', 'instant_noodles', 'contaminated_water'],
         },
       },
       {
         id: 'cook_intuition',
         name: '셰프의 직감',
         icon: '🍜',
         desc: '명동·남대문 골목 익숙함. 시작 후 7일간 조우 확률 50% 감소',
         effect: { encounterMultDays: { days: 7, mult: 0.5 } },
       },
+      {
+        id: 'pantry_mastery',
+        name: '식자재 보존술',
+        icon: '🥫',
+        desc: '보존식·식재료 섭취 시 사기 회복 +40%. 사기 30 미만 회복 시 피로 -3 추가. 시작 시 셰프 노트·혼합 향신료 지급.',
+        effect: {
+          moraleRecoveryBonus: 1.4,
+          lowMoraleRecoveryFatigueBonus: -3,
+          startingItems: ['chef_journal', 'spice_blend', 'spice_blend'],
+        },
+      },
     ],
```

**변경 라인:** 약 11라인 추가 (신규 ability 객체). 영향: `characters.js:298~348` (기존 abilities 5건 변경 0).

### 8.2 `js/data/items_misc.js` (line 517~535 keepsake 섹션 근처)

기존 line 517~535 `worn_photo`·`sketch_notebook` keepsake 섹션 직후에 신규 셰프 전용 keepsake + 보존식 추가:

```diff
   sketch_notebook: {
     id: 'sketch_notebook', name: '설계도 노트', type: 'consumable', subtype: 'keepsake',
     rarity: 'common', weight: 0.15,
     defaultDurability: 3, defaultContamination: 0,
     icon: '📓', description: '성수동 공장에서 가져온 설계도 노트. 연료 없는 탈것 스케치가 빼곡하다. 손을 움직이는 동안에는 두려움이 잠시 멀어진다.',
     tags: ['consumable', 'keepsake', 'engineer'],
     onConsume: { morale: 10, fatigue: -5 },
     dismantle: [],
   },

+  // 셰프 전용 keepsake + 보존식 (chef pantry_mastery ability 트리거 자원)
+
+  chef_journal: {
+    id: 'chef_journal', name: '셰프 노트', type: 'consumable', subtype: 'keepsake',
+    rarity: 'common', weight: 0.10,
+    defaultDurability: 3, defaultContamination: 0,
+    icon: '📔', description: '명동 소피텔 호텔 수석 셰프의 손때 묻은 표준식단표. 보존식 배합 비율과 식재료 검수 기록이 빼곡하다. 손때 묻은 페이지를 넘기는 동안에는 굶주린 사람들의 얼굴이 잠시 멀어진다.',
+    tags: ['consumable', 'keepsake', 'chef'],
+    onConsume: { morale: 10, fatigue: -2 },
+    dismantle: [],
+  },
+
+  spice_blend: {
+    id: 'spice_blend', name: '혼합 향신료', type: 'consumable', subtype: 'food',
+    rarity: 'common', weight: 0.05,
+    defaultDurability: 1, defaultContamination: 0,
+    icon: '🧂', description: '호텔 주방 향신료 캐비닛에서 챙긴 혼합 향신료. 미식 감각으로 직접 조합한 보존용 배합이다. 한 줌이면 굶주린 입맛도 잠시 일깨운다.',
+    tags: ['consumable', 'food', 'preserved', 'chef'],
+    onConsume: { morale: 6, nutrition: 5 },
+    dismantle: [],
+  },
```

**변경 라인:** 약 22라인 추가 (chef_journal 10라인 + spice_blend 10라인 + 빈줄·주석 2라인). 기존 worn_photo·sketch_notebook·newspaper_bundle 정의 변경 0.

### 8.3 `js/data/stackConfig.js` (line 236~245 노숙자·엔지니어 섹션 근처)

```diff
   // — 노숙자 전용 아이템 —
   ['battered_can'              , false, 1 ],
   ['old_blanket'               , false, 1 ],
   ['newspaper_bundle'          , true,  5 ],
   ['box_cutter'                , false, 1 ],
   ['broken_bottle'             , true,  3 ],
   ['worn_photo'                , false, 1 ],

   // — 엔지니어 전용 아이템 —
   ['sketch_notebook'           , false, 1 ],

+  // — 셰프 전용 keepsake + 보존식 —
+  ['chef_journal'              , false, 1 ],
+  ['spice_blend'               , true,  3 ],
+
   // — 셰프 전용 희귀 식재료 (stackable, maxStack 3~5) —
   ['truffle'                   , true,  3 ],
```

**변경 라인:** 4라인 추가 (chef_journal 1줄 + spice_blend 1줄 + 섹션 헤더 1줄 + 빈줄 1줄). 기존 truffle 등 셰프 전용 희귀 식재료 섹션 변경 0.

### 8.4 `js/ui/CardFactory.js` CARD_IMAGES (line 335~350 영역)

```diff
   // 노숙자 전용 아이템
   battered_can:          'assets/images/materials/empty_can.png',
   old_blanket:           'assets/images/materials/cloth.png',
   newspaper_bundle:      'assets/images/materials/cloth_scrap.png',
   box_cutter:            'assets/images/weapons/knife.png',
   worn_photo:            'assets/images/materials/cloth_scrap.png',
   sketch_notebook:       'assets/images/materials/cloth_scrap.png',
   broken_bottle:         'assets/images/materials/glass_shard.png',

+  // 셰프 전용 keepsake + 보존식
+  chef_journal:          'assets/images/materials/cloth_scrap.png',
+  spice_blend:           'assets/images/food/dried_mushroom.png',
+
   // 셰프 전용 희귀 식재료 (윤재혁)
   truffle:               'assets/images/food/dried_mushroom.png',
```

**변경 라인:** 4라인 추가 (chef_journal 1줄 + spice_blend 1줄 + 섹션 헤더 1줄 + 빈줄 1줄). 정식 이미지는 AD 정해린 후속 트랙(이모지 폴백 가능 — worn_photo·sketch_notebook 패턴 정합 line 340~341).

### 8.5 검증 명령

```
node --input-type=module js/data/validate.js
# 기대: Errors 0 / ALL CLEAR
#       chef abilities count = 6 (gourmet_sense·ingredient_eye·warm_meal·knife_mastery·cook_intuition·pantry_mastery)
#       chef startingItems count = 10 (knife·canned_food×2·preserved_ration·instant_noodles×2·contaminated_water + chef_journal·spice_blend×2)
#       items_misc.js chef_journal·spice_blend 정의 등록 확인
#       stackConfig.js chef_journal·spice_blend 등록 확인
#       districts.js lootTable chef_journal·spice_blend 등장 0건 검증 (chef 정체성 보호)

node tools/sim/v2/run_baseline.mjs
# 기대: fingerprint len316-h242a5b5f 유지 (BALANCE 미관여 단정 — items 정의 추가는 BALANCE 미관여)
#       buildTag sim-baseline-v11-pr14
#       chef K3 v10 5.20 → v11 5.7~6.2 추정
#       chef 절망 사망 v10 83 → v11 30~50 추정 (R11-1 해소 효과)
#       homeless·engineer K3 v10 4.3·5.0 회귀 0 검증 (chef 전용 effect)
#       chef 격차 정의 1·2 ≥ +1.0d / +0.5d 충족 단정
```

### 8.6 PR14 patch diff 총 라인 수 추정

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +11 / -0 (pantry_mastery ability 객체 신규) |
| items_misc.js | +22 / -0 (chef_journal +10, spice_blend +10, 섹션 헤더·빈줄 +2) |
| stackConfig.js | +4 / -0 (chef_journal·spice_blend + 섹션 헤더·빈줄) |
| CardFactory.js | +4 / -0 (이미지 매핑 2 + 섹션 헤더·빈줄) |
| **합계** | **+41 / -0 (총 ~41 변경)** |

협의서 v5 §2.1 매트릭스 "A+B 패키지 권고 ~30~50줄" 범위 정합. 1 PR 1 트랙 (chef 전용) 준수.

---

## 9. baseline v11 측정 트리거 + 1·2·3차 KPI 추정값

### 9.1 의무 probe (chef 한정)

| probe | 측정 대상 | 합격 기준 |
|-------|----------|----------|
| 1. chef K3 | mean·median 사망일 | v10 5.20 → v11 **5.5~6.5** (1차 KPI 직접 목표 범위) |
| 2. chef 격차 정의 1 | chef vs 6직업 평균 | v10 +0.567d → v11 **≥ +1.0d** (1차 KPI 충족) |
| 3. chef 격차 정의 2 | chef vs cooking lv 0 5직업 평균 | v10 +0.46d → v11 **≥ +0.5d** (2차 KPI 충족, R11-1 해소) |
| 4. chef 절망 사망 | K5 deathCause 절망 count | v10 83 → v11 ≤ 50 (-33 이상 추정) |
| 5. chef morale<30 도달율 | runs[*] morale 시계열 day 1~10 | v10 ~100/100 → v11 ≤ 70/100 추정 |
| 6. chef `actBoostMorale` 발동 회수 | playerAI.mjs `_applyAbilityBonusesToConsume` 발동 분포 | v10 미측정 → v11 chef ≥ 95/100 (chef_journal·spice_blend 소비) |
| 7. chef_journal·spice_blend 소비 회수 | inventory durability 추적 | chef_journal 1~3회/회 + spice_blend 1~2회/회 |
| 8. homeless·engineer K3 회귀 0 | mean K3 변화 | v10 4.3·5.0 = v11 4.3·5.0 (chef 전용 effect 단정) |
| 9. chef K3 안전 범위 | mean K3 ≤ 6.5 | 3차 KPI 모니터링 — 6.5 초과 시 협의서 v5 §10.1 cook_intuition 단축 트리거 발동 |
| 10. 직업 격차 K1 max-min | 7직업 K1 격차 | ≤ 5%p (협의서 v5 §10.4 회귀 검사) |
| 11. fingerprint | drift.balanceLeafTotal hash | `len316-h242a5b5f` 유지 (BALANCE 미관여) |
| 12. validate.js | items.js / stackConfig.js / districts.js / CardFactory.js 정합 | Errors 0 / ALL CLEAR |

### 9.2 1차 KPI 충족 예상값 (chef 격차 정의 1 ≥ +1.0d)

| 시나리오 | chef K3 | others6 K3 | 격차 정의 1 | 충족 |
|---------|---------|-----------|-----------|-----|
| 보수 추정 (effect 최저 효과) | 5.7 | 4.633 | **+1.07d** | ✅ |
| 중간 추정 | 5.95 | 4.633 | **+1.32d** | ✅ |
| 적극 추정 (effect 최고 효과) | 6.2 | 4.633 | **+1.57d** | ✅ |

협의서 v5 §5.5 1차 KPI 직접 목표 ≥ +1.0d **세 시나리오 모두 충족.**

### 9.3 2차 KPI 충족 예상값 (chef 격차 정의 2 ≥ +0.5d, R11-1 해소)

| 시나리오 | chef K3 | others5 K3 (cooking lv 0) | 격차 정의 2 | 충족 |
|---------|---------|---------------------------|-----------|-----|
| 보수 추정 | 5.7 | 4.74 | **+0.96d** | ✅ |
| 중간 추정 | 5.95 | 4.74 | **+1.21d** | ✅ |
| 적극 추정 | 6.2 | 4.74 | **+1.46d** | ✅ |

협의서 v5 §5.5 2차 KPI ≥ +0.5d **세 시나리오 모두 충족 → R11-1 해소 단정 가능.**

### 9.4 3차 KPI 안전 범위 (chef K3 ≤ 6.5)

| 시나리오 | chef K3 | 안전 범위 (≤ 6.5) | 협의서 v5 §10.1 cook_intuition 단축 트리거 |
|---------|---------|------------------|------------------------------------------|
| 보수 추정 | 5.7 | ✅ | 비발동 |
| 중간 추정 | 5.95 | ✅ | 비발동 |
| 적극 추정 | 6.2 | ✅ | 비발동 |
| **위험 임계** | 6.5 | 경계 | 6.5 초과 시 발동 |

세 시나리오 모두 안전 범위. **6.5 초과 시 협의서 v5 §10.1 완화 트리거 즉시 발동** (`cook_intuition.encounterMultDays.days = 7 → 5` 단일 상수 PR).

### 9.5 R15-1 우회 자체 적용 안 함

협의서 v5 §6.3 R15-1 우회 권고 인용:
> SCN_QUEST 작성 시 craft 발동 빈도 가정을 *보수적*(day 시작 1회)으로 사용

본 SCN_QUEST_chef_tier2.md는 `moraleOnCraft` 신규 가산 0 — chef는 cooking lv 4로 `actCook` 발동 보장(playerAI.mjs `runDayAI` cooking 우선순위 분기). chef Tier-2 effect는 `moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus` (onConsume 가산) + 신규 자원 onConsume.morale·nutrition 직접 가산만 사용. **craft 발동 빈도 가정 의존 0** — R15-1 우회 자체 적용 불필요.

신규 자원 소비 빈도 추정 (보수적):
- chef_journal 3회 사용 (defaultDurability 3) — chef day 2·4·6 morale<30 진입 시 1회씩 소비, 총 3회
- spice_blend 2개 소비 — chef day 3·5 morale·nutrition 동시 결손 시 1개씩 소비, 총 2회
- 총 5회 onConsume 발동 — `_applyAbilityBonusesToConsume` 5회 가산 효과 누적 (PR15 enumerate 분기 보장)

---

## 10. 위험과 완화

### 10.1 chef K3 6.5 초과 위험 (3차 KPI 위반)

**트리거:** baseline v11 측정에서 chef K3 > 6.5.
**원인 후보:** (a) effect 값이 가정보다 강함 (b) `cookingEffectBonus 1.6 × moraleRecoveryBonus 1.4` 시너지 누적 초과 (c) chef_journal defaultDurability 3 + spice_blend 2개 = 5회 누적 회복이 과다.
**완화:**
- **(권고)** 협의서 v5 §10.1 cook_intuition 단축 즉시 발동 — `effect.encounterMultDays.days = 7 → 5` 단일 상수 PR (밸런스 권지나)
- (대안) `pantry_mastery.moraleRecoveryBonus` 1.4 → 1.3 하향 (1단계 보수화)
- (대안) chef_journal defaultDurability 3 → 2 하향 (사용 회수 -33%)

### 10.2 chef 격차 정의 1 +1.0d 미달 위험 (1차 KPI 위반)

**트리거:** baseline v11 측정에서 chef 격차 정의 1 < +1.0d.
**원인 후보:** (a) effect 값이 가정보다 약함 (b) chef_journal·spice_blend 소비 회수 가정(5회) 대비 실측 적음 (c) chef는 cooking lv 4로 actCook이 morale 자체 보강 — Tier-2 추가 효과 marginal.
**완화:**
- **(권고)** 협의서 v5 §10.2 PR14.1 재조정 — `pantry_mastery.moraleRecoveryBonus` 1.4 → 1.6 상향 (1단계 적극화) 또는 chef_journal `onConsume.morale` 10 → 13 상향 (effect 값 범위 ×1.2~×1.8 / +3~+10 가드레일 안)
- (대안) chef_journal defaultDurability 3 → 5 상향 (사용 회수 +66%)
- (대안) spice_blend startInv 2 → 3개 상향

### 10.3 다른 직업 격차 5%p 초과 위험 (협의서 v5 §10.4)

**트리거:** baseline v11 측정에서 7직업 K1 max-min > 5%p (chef·다른 직업 격차 추가 벌어짐).
**원인 후보:** (a) chef K3 6.2 → K1 0% → 5%로 도달 (b) 다른 직업 K1 회귀 0 유지.
**완화:**
- 본 KPI는 K1 = 0% 11회 연속 패턴 (baseline v10 §3)에서는 직업 격차 0%p 유지 예상
- 실제 발생 시 chef Tier-2 effect 보수화 (§10.1 대안) — chef K3 5.7로 단축 → K1 도달 차단

### 10.4 spice_blend subtype 'food' 회귀 위험 (chef 외 직업 획득 시 가산)

**트리거:** spice_blend이 districts.js lootTable에 등록되어 chef 외 직업도 획득 가능 시 onConsume.morale +6 + nutrition +5 부여로 7직업 동시 효과 → 격차 추가 좁힘.
**완화:** 시스템 백승호 PR14 구현 시 검증 의무:
- `js/data/districts.js` 25구 lootTable 전수 grep으로 spice_blend 등록 0건 확인 (§6.3 4곳 등록 룰 lootTable 미등록 의무 준수)
- 1건 이상 등록 시 onConsume `chefOnly: true` 분기 추가 (시스템 백승호 결정) — 단 sim playerAI.mjs 분기 신규 필요로 부담 증가
- **권고:** lootTable 미등록 보존 — homeless worn_photo·engineer sketch_notebook 패턴 정합

### 10.5 chef_journal·spice_blend subtype/이미지 충돌

**트리거:** validate.js subtype 검증에서 `keepsake`·`food` subtype 미등록 경고 또는 CardFactory.js 이미지 경로 깨짐.
**완화:**
- `subtype: 'keepsake'` 이미 worn_photo·sketch_notebook으로 등록 (items_misc.js line 519·529 + stackConfig.js line 242·245). chef_journal 동일 subtype 추가 등록 부담 0
- `subtype: 'food'` 이미 dried_mushroom·berry_jam·canned_food 등 다수 등록. spice_blend 추가 등록 부담 0
- CardFactory.js 이미지는 worn_photo·sketch_notebook 폴백 패턴(`cloth_scrap.png`) + truffle 폴백 패턴(`dried_mushroom.png`) 정합 — 정식 이미지는 AD 정해린 후속 트랙

### 10.6 PR15 enumerate 분기 외 효과 미발동 위험

**트리거:** `pantry_mastery` 신규 ability지만 PR15 `_applyAbilityBonusesToConsume`이 chef에서도 동일하게 가산 발동하는지 검증 필요.
**완화:** PR15 playerAI.mjs line 32~36 `_applyAbilityBonusesToConsume` 코드 인용:
```js
const moraleMult = p?.moraleRecoveryBonus ?? 1;
const lowFatBonus = p?.lowMoraleRecoveryFatigueBonus ?? 0;
```
- 두 필드 모두 `GameState.player.<field>` 직접 접근 — chef abilities `pantry_mastery.effect`의 `moraleRecoveryBonus 1.4`·`lowMoraleRecoveryFatigueBonus -3`이 게임 시작 시 player에 주입되면 자동 발동
- 시스템 백승호 PR14 머지 시 abilities effect → player 주입 경로 검증 의무 (`CharCreate.js` line 283 등가 — `SCN_PR_chef_knife_mastery.md` §3.2 정합)
- baseline v11 측정 전 단위 테스트 추가 권고 (chef_journal·spice_blend 소비 → chef morale +14·+8.4 vs 일반 +10·+6 분리 검증)

---

## 11. 위임 메모

| 위임 대상 | 항목 |
|----------|------|
| **시스템 백승호** | (1) PR14 patch diff §8 실제 적용 (characters.js + items_misc.js + stackConfig.js + CardFactory.js 합산 +41라인) (2) chef abilities effect → player 주입 경로 검증 (`moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus` 자동 발동 단언) (3) districts.js lootTable 25구 전수 grep — chef_journal·spice_blend 등록 0건 검증 (4) validate.js + fingerprint 회귀 0 검증 (5) buildTag sim-baseline-v10-pr15 → v11-pr14 갱신 |
| **밸런스 권지나** | (1) baseline v11 측정 §9.1 의무 probe 12건 (2) chef 격차 정의 1·2 + chef K3 안전 범위 1·2·3차 KPI 단정 (3) R11-1 해소 단정 (4) homeless·engineer K3 회귀 0 검증 (5) 직업 격차 5%p 이하 검증 (6) `BAL_SIM_baseline_v11_report.md` §4.1 chef vs 6직업 절대값 단정 의무 (협의서 v5 §10.5 효과 분리 측정) |
| **설정 이수정** | (1) chef_journal description 어휘 검수 — "표준식단표"·"보존식 배합 비율" LORE_GLOSSARY §3·§4 등록 어휘 정합 단정 (2) spice_blend description 어휘 검수 — "혼합 향신료"·"보존용 배합" LORE 등록 (3) `pantry_mastery` ability desc 어휘 검수 — "식자재 보존술" LORE chef abilities §3.6 신규 등록 (4) LORE_GLOSSARY v0.5 갱신 — pantry_mastery 신규 등록 |
| **AD 정해린** | chef_journal 이미지 1건 (📔 이모지 폴백 가능, 정식 이미지 후속) + spice_blend 이미지 1건 (🧂 이모지 폴백 가능) + `pantry_mastery` ability 아이콘 🥫 검수 |
| **Director 서민호** | (1) 6 게이트 §7 검수 통과 단정 확인 (2) chef K3 5.7~6.2 범위 안전성 단정 (3) R11-1 해소 단정 가능 여부 사전 단정 (협의서 v5 §10.1 cook_intuition 단축 트리거 비발동 단언) |
| **시나리오 한도연 (자기)** | (조건부) PR14.1 재조정 — baseline v11 측정 결과 1차 KPI 미달 시 effect 값 상향 또는 신규 자원 수량 상향 (협의서 v5 §10.2 위험 완화) |

---

## 12. 결정 단언

| 항목 | 결정 |
|------|------|
| Tier-2 ability `pantry_mastery` 신설 | **통과** (6 게이트 5/6 통과 + 1/6 모니터링) |
| 신규 자원 `chef_journal` (셰프 노트) 도입 | **통과** (6 게이트 전수 통과) |
| 신규 자원 `spice_blend` (혼합 향신료) 도입 | **통과** (6 게이트 전수 통과) |
| startingItems 7 → 10 확장 | **통과** (homeless 10·engineer 9 패턴 정합) |
| 4곳 등록 룰 적용 | **통과** (chef_journal + spice_blend 4곳 신규) |
| PR15 enumerate 필드 사용 | **통과** (`moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus` 전수 일치, 신규 필드 0) |
| chef 외 직업 변경 0 | **통과** (chef abilities·startingItems만 변경, lootTable 0, 다른 직업 effect 0) |
| 1차 KPI (chef 격차 정의 1 ≥ +1.0d) | **충족 예상** (+1.07~+1.57d, 세 시나리오 모두 충족) |
| 2차 KPI (chef 격차 정의 2 ≥ +0.5d) | **충족 예상** (+0.96~+1.46d, R11-1 해소 단정 가능) |
| 3차 KPI (chef K3 ≤ 6.5) | **안전 예상** (5.7~6.2, 세 시나리오 모두 안전 범위) |
| R11-1 해소 단정 가능 여부 | **단정 가능** (정의 1·2 동시 +0.5d 이상 회복 추정) |
| PR14 patch diff 총 변경량 | ~41라인 (characters.js +11 / items_misc.js +22 / stackConfig.js +4 / CardFactory.js +4) |
| 다음 트리거 | 시스템 백승호 PR14 머지 → baseline v11 측정 (밸런스 권지나) → R11-1 해소 단정 (정의 1·2 + chef K3) → 협의서 v5 §10 위험 완화 발동 여부 단정 |

---

*문서 끝. baseline v11 측정 결과 도착 시 §9.1 probe 12건 검증 + R11-1 해소 단정 + chef K3 안전 범위 단언 + 협의서 v5 §10 위험 완화 발동 여부 단정. PR14.1 재조정 트리거(1차 KPI 미달) 또는 cook_intuition 단축 트리거(3차 KPI 초과) 발동 시 시나리오 한도연 즉시 후속 트랙 진입.*
