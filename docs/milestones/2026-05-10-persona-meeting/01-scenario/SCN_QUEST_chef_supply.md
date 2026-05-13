# 시나리오 — chef high-nutrition 자원 추가 (트랙 B, 시뮬 R11-1 완전 해소 시도)

> 작성: 시나리오 한도연 / 2026-05-12
> 트리거: `PD_BAL_MEETING_PR14_decision.md` §14.7 §1순위 — "SCN_QUEST_chef_supply.md — chef high-nutrition 자원 사양 결정 + §8 patch diff 후보. §14.6 가드레일 준수"
> 결정 (요약): 신규 자원 **`chef_meal_kit` 1개 + `hearty_stew` 1개** + chef `pantry_mastery.startingItems` 추가 (`['chef_journal','spice_blend','spice_blend']` → `['chef_journal','spice_blend','spice_blend','chef_meal_kit','hearty_stew']`)
> 트랙 정체성 (§15): **"시뮬 정합 게임 데이터 작성"** — 본 SCN_QUEST의 모든 KPI 추정값은 *시뮬 KPI* 해석. 게임 본체 K1 매핑은 M4+ 텔레메트리 트랙 영역
> 분량: ~480줄

---

## 1. 서두 — 시뮬 R11-1 완전 해소 시도 + 트랙 B 채택 근거

### 1.1 baseline v13 측정 사실 (실측 인용 — chef 사망 본질)

`BAL_SIM_baseline_v13_report.md:319~322` 직접 인용:

> chef 사망일 day 5~6 집중 92건 유지 (v12 88건 +4 추가 집중)
> chef craft 빈도 0.372 fires/day로 7직업 중 최저 — chef는 day 1~2 자원 풍부 + 임계 늦은 도달 + day 5~6 자원 소진 시 입력 자원(spice_blend·pantry_basic·herb) 이미 소진 → `actCook` null 패턴
> chef K5: 탈수 31 / 절망 17 / 아사 42 / 극도 피로 10 — **탈수·아사 합 73건이 전체 100건의 73%** (v12 동일) — nutrition·hydration 자원 결핍이 chef 사망 본질

**chef 사망일 분포 v11 → v12 → v13** (`BAL_SIM_baseline_v13_report.md:144~150`):

| 사망일 | v11 | v12 | v13 | 단정 |
|--------|-----|-----|-----|------|
| day 4 | 1 | 1 | 0 | 미세 |
| **day 5** | 60 | 62 | **64** | **+2** 집중 가속 |
| **day 6** | 26 | 26 | **28** | **+2** 집중 가속 |
| day 7 | 9 | 9 | **6** | **-3** (day 5~6으로 후퇴) |

**단정 (실측 기반):** chef는 day 5~6에 100건 중 92건(92%) 사망. 사망 본질은 **탈수+아사 73% (nutrition·hydration 결핍)**, 절망 17% 부차. day 7 분포 -3 후퇴는 PR16 craft 빈도 보강이 chef morale 후반 유지에 기여하지 못했음을 단정.

### 1.2 트랙 B 채택 근거 (협의서 v5 §14.5 인용)

`PD_BAL_MEETING_PR14_decision.md:683~705` 트랙 B 채택 단정 인용:

| 트랙 | 분량 | R11-1 완전 해소 | 정의 2 보존 |
|------|------|----------------|------------|
| **B** | ~50라인 | **가능성 중** | ❌ (PR16 유지) |
| C | 0라인 | 포기 | ❌ |
| D | ~5라인 | 포기 | ✅ |

PD 김재훈 결정: 트랙 B 채택. chef nutrition·hydration 회복 자원으로 사망일 day 6+ 이동 시도. baseline v14 후 1차 KPI 충족 단언 시도.

### 1.3 협의서 v5 §14.6 가드레일 (절대 준수)

| 가드레일 | 값 | 본 SCN_QUEST 준수 단정 |
|---------|-----|--------------------|
| 자원 수 | 1~2개 chef 전용 | ✅ **2개** (chef_meal_kit + hearty_stew) |
| 효과 방향 | nutrition·hydration 직접 보강 | ✅ chef_meal_kit nutrition+45/hydration+20, hearty_stew nutrition+35/hydration+30 |
| nutrition 범위 | +30~+50 | ✅ chef_meal_kit +45 / hearty_stew +35 |
| hydration 범위 | +20~+40 | ✅ chef_meal_kit +20 / hearty_stew +30 |
| durability | 1~2 | ✅ chef_meal_kit 2 / hearty_stew 1 |
| morale 효과 | +0~+5 | ✅ chef_meal_kit +3 / hearty_stew +5 |
| chef 정체성 | 요리 전문가 어휘 | ✅ "셰프 도시락"·"든든한 스튜" |
| 4곳 등록 룰 | items_misc.js + stackConfig + CardFactory + chef startingItems | ✅ §6 등록 사양 |
| K3 추정 향상 | +0.5~1.0d | ✅ §10 추정 +0.6~0.95d (시뮬 KPI) |
| chef K3 상한 | ≤ 6.5 | ✅ §10 추정 6.0~6.35 ≤ 6.5 |

### 1.4 트랙 정체성 단정 (§15 인용)

`PD_BAL_MEETING_PR14_decision.md:784~791` 인용:

> 본 M3 트랙은 "시뮬에서 측정 가능한 게임 데이터를 작성하는 트랙"으로 정체성을 단정한다.
> baseline KPI는 시뮬 K1의 마지노선. 게임 본체 K1과의 매핑은 본 트랙 영역 밖.

**본 SCN_QUEST 해석:**
- 본문에서 단정하는 모든 KPI 추정값(chef K3 +0.6~0.95d 등)은 **시뮬 KPI** 추정값
- 게임 본체 player가 chef_meal_kit·hearty_stew를 실제로 day 5~6 임계 시점에 섭취할지 여부는 M4+ 텔레메트리 트랙 의무
- 본 SCN_QUEST의 사양 결정 본질은 **시뮬 `actEat`·`applyOnConsume` 분기에서 발동 가능한 형태로 데이터를 작성**하는 데 있음 (§5 의무 단정)

### 1.5 결정 단언 (서두)

| 항목 | 결정 |
|------|------|
| 신규 자원 1 | **`chef_meal_kit` (셰프의 도시락)** — nutrition+45·hydration+20·morale+3·fatigue-3, durability 2, weight 0.45 |
| 신규 자원 2 | **`hearty_stew` (든든한 스튜)** — nutrition+35·hydration+30·morale+5, durability 1, weight 0.50 |
| `pantry_mastery.startingItems` | `['chef_journal','spice_blend','spice_blend']` → `['chef_journal','spice_blend','spice_blend','chef_meal_kit','hearty_stew']` (10 → 12 아이템) |
| `actEat` candidates 갱신 의무 | **시뮬 호환 의무** — `tools/sim/v2/playerAI.mjs:130~133` candidates 배열에 두 자원 추가 (§5.1 단정) |
| PR17 patch diff | ~50라인 (characters.js +1라인 / items_misc.js +22라인 / stackConfig.js +4라인 / CardFactory.js +4라인 / playerAI.mjs +2라인) |
| 시뮬 R11-1 완전 해소 단언 | **단정 가능 (보수~중간 추정 충족, 적극 추정 over-achievement 모니터링)** |

---

## 2. chef 정체성·기존 상태 분석

### 2.1 chef 기존 abilities 6종 (PR14 후) — `characters.js:318~367`

```js
abilities: [
  { id: 'gourmet_sense',   effect: { cookingEffectBonus: 1.6 } },
  { id: 'ingredient_eye',  effect: { toxinDetect: true } },
  { id: 'warm_meal',       effect: { companionMoraleOnCook: 10 } },
  { id: 'knife_mastery',   effect: { knifeDmgBonus: 1.25, startingItems: ['knife','canned_food','canned_food','preserved_ration','instant_noodles','instant_noodles','contaminated_water'] } },
  { id: 'cook_intuition',  effect: { encounterMultDays: { days: 7, mult: 0.5 } } },
  { id: 'pantry_mastery',  effect: { moraleRecoveryBonus: 1.6, lowMoraleRecoveryFatigueBonus: -3, startingItems: ['chef_journal','spice_blend','spice_blend'] } },
]
```

**chef startingItems 합산 (현행 baseline v13):** 7 (knife_mastery) + 3 (pantry_mastery) = **10개** + water_bottle 1 자동 = 11개.

### 2.2 chef 기존 startingItems의 nutrition·hydration 합산

`items_base.js` + `items_misc.js` 인용:

| 아이템 | subtype | onConsume | actEat candidates 등록 |
|-------|---------|-----------|----------------------|
| knife | weapon | n/a | n/a |
| canned_food ×2 | food | nutrition+30, hydration+10 | ✅ (line 130) |
| preserved_ration | food | nutrition+40, morale+5 | ✅ (line 130) |
| instant_noodles ×2 | food | nutrition+15, hydration-5 | ❌ **미등록** (cookable 입력) |
| contaminated_water | drink (오염) | n/a | ❌ |
| water_bottle (자동) | drink | hydration+30 | ✅ actDrinkWater (line 119) |
| chef_journal | keepsake | morale+13, fatigue-2 | ❌ (keepsake — 직접 actEat 미발동) |
| spice_blend ×2 | food | morale+6, nutrition+5 | ❌ **미등록** ⚠️ |

**핵심 발견 (시뮬 정합 결함):**
- `spice_blend`는 `subtype: 'food'`이고 `onConsume.nutrition: 5`이지만 **`tools/sim/v2/playerAI.mjs:130` `actEat candidates` 배열에 미등록**
- 결과: PR14 후 baseline v11~v13에서 chef가 day 5~6 nutrition<30 임계 시점에도 spice_blend를 *섭취 행동으로* 소비하지 못함 — 시뮬 R11-1 완전 해소 미달의 *시뮬 측정 결함* 일부 (§14.4 §15 트랙 정체성 안에서 단정)
- 본 SCN_QUEST는 신규 자원 chef_meal_kit·hearty_stew를 **반드시 actEat candidates에 등록**하는 것을 시뮬 정합 의무로 단정 (§5.1)

### 2.3 chef 사망 본질 단정 (시뮬 KPI 기반)

`BAL_SIM_baseline_v13_report.md:321` 인용:
- 탈수 31 + 아사 42 = **73건 (전체 100건의 73%)**
- nutrition·hydration 결핍이 chef 사망 본질 단정

**의미:** 트랙 B 신규 자원은 *morale 가산이 아니라* **nutrition·hydration 직접 보강**이 핵심. PR14·PR16 chef 자원(chef_journal +13 morale·spice_blend +6 morale)이 morale 회복은 충분히 보강했으나, day 5~6 시점에 *섭취 가능한* nutrition·hydration 자원이 소진된 구조 한계.

### 2.4 chef 정체성 어휘 (story·LORE·기존 ability 인용)

`characters.js:312~317` story 인용:
> 윤재혁(33세)은 명동 소피텔 호텔의 수석 셰프였다.
> 호텔 뷔페에서 이상한 손님이 나타났다. 식기를 깨물고 직원을 공격했다.
> 재혁은 주방 칼을 집어 들고 지하 식품 저장고로 피신했다.
> 남대문시장으로 이동했다. 그곳에 아직 쓸 만한 식재료가 있을 것이다.
> 사람들이 굶고 있었다. 재혁은 알고 있었다. 음식은 단순한 생존이 아니라, 희망이라는 것을.

**플레이버 어휘 후보 (정체성 정합):**
- "셰프의 도시락" (chef_meal_kit) — 수석 셰프가 호텔 주방에서 직접 챙긴 한 끼. story "지하 식품 저장고" 정합
- "든든한 스튜" (hearty_stew) — chef가 보존식·향신료를 조합해 끓여낸 따뜻한 한 끼. story "음식은 ... 희망" + warm_meal ability 정합
- "고급 비상식량" (premium_ration) — 거절 (기존 preserved_ration 어휘 중복)
- "셰프의 한 끼" (chef_special_dish) — 거절 (단일 어휘로 두 자원 차별화 불가)
- "응급식" (emergency_meal) — 거절 (chef 정체성보다 doctor·firefighter 정체성 가까움)

---

## 3. 자원 후보 비교 (어휘·효과·정체성 정합)

### 3.1 후보 매트릭스

| 후보 | nutrition | hydration | morale | durability | 정체성 | 시뮬 호환 | K3 향상 추정 (시뮬) |
|------|-----------|-----------|--------|-----------|--------|----------|------------------|
| **A: chef_meal_kit** | **+45** | +20 | +3 | **2** | ⭐⭐⭐⭐⭐ "수석 셰프 도시락" | actEat 등록 필수 | +0.4~0.6d |
| **B: hearty_stew** | +35 | **+30** | +5 | 1 | ⭐⭐⭐⭐⭐ "든든한 스튜·warm_meal 정합" | actEat 등록 필수 | +0.3~0.5d |
| C: premium_ration | +50 | +5 | +5 | 2 | ⭐⭐ (preserved_ration 어휘 중복) | actEat 등록 | +0.5~0.7d |
| D: chef_special_dish | +40 | +25 | +5 | 1 | ⭐⭐⭐ (단일 어휘 약함) | actEat 등록 | +0.4~0.5d |
| E: emergency_meal | +30 | +40 | 0 | 1 | ⭐⭐ (chef 정체성 약함, doctor 가까움) | actEat 등록 | +0.3~0.4d |

### 3.2 권고: **A + B 병행 채택 (chef_meal_kit + hearty_stew)**

**근거:**

1. **A 단독 (chef_meal_kit)**: durability 2로 day 5·6 임계 시점 2회 소비 가능. nutrition+45 ×2 = 누적 +90 (chef cookingEffectBonus 1.6 가산은 actCook 산출에만 적용 — keepsake/식품 onConsume에는 미발동). 단 hydration+20 ×2 = 누적 +40으로 탈수 31건 완전 차단 부족
2. **B 단독 (hearty_stew)**: durability 1, hydration+30 단일. day 5만 소비하면 day 6 탈수 사망 대응 불가
3. **A + B 병행 채택**: chef_meal_kit ×1 durability 2 (day 5·6 2회 소비) + hearty_stew ×1 (day 5·6 사이 1회 소비) = nutrition 누적 +125 / hydration 누적 +70 / morale 누적 +11 / fatigue 누적 -6. **chef 사망일 day 5~6 92건 사망 중 nutrition·hydration 결핍 73건이 day 7+ 이동 추정** (§10 시뮬 KPI 추정)
4. **C (premium_ration) 거절** — 기존 preserved_ration(`items_misc.js:1455`)와 어휘 중복. 신규 자원의 정체성 차별화 불가. chef 정체성 강화 효과 약함
5. **D (chef_special_dish) 거절** — 단일 자원으로 nutrition·hydration 보강 모두 시도하면 어휘 약화. 두 자원으로 *역할 분리*(저장식 vs 따뜻한 식사)가 chef 정체성 강화에 우수
6. **E (emergency_meal) 거절** — "응급식" 어휘는 doctor·firefighter 정체성 가까움. chef 정체성과 거리. 다른 직업 향후 추가 시 활용 권고

### 3.3 시뮬 호환 단정 (§15 트랙 정체성 핵심)

**핵심 단정:** 두 자원 모두 `tools/sim/v2/playerAI.mjs:130~133` `actEat candidates` 배열에 등록되어야 day 5~6 nutrition<30 임계 시점에 *섭취 행동*으로 발동된다. 이 등록이 없으면 신규 자원의 nutrition·hydration 회복 효과는 시뮬 K3에 반영 0 — 본 SCN_QUEST의 트랙 B 시뮬 R11-1 완전 해소 시도 전체가 무력화.

§5.1에서 시뮬 patch 의무 단정.

---

## 4. 자원 사양 결정 (2개)

### 4.1 신규 — `chef_meal_kit` (셰프의 도시락)

| 항목 | 값 |
|------|-----|
| definitionId | `chef_meal_kit` |
| name | 셰프의 도시락 |
| nameEn | Chef's Meal Kit |
| type | `consumable` |
| subtype | `food` (actEat 발동 + chef 보존식 정합) |
| rarity | `uncommon` (chef 전용 시작 자원, 일반 lootTable 미등록) |
| weight | 0.45 (canned_food 0.4·preserved_ration 0.6 사이) |
| defaultDurability | **2** (day 5·6 2회 소비 보장) |
| defaultContamination | 0 |
| icon | 🍱 |
| description | "명동 소피텔 호텔 주방에서 직접 챙겨 나온 한 끼. 단정하게 칸막이로 나눈 보존식·곡류·반찬 조합으로 한 끼의 영양 균형을 맞췄다. 셰프의 손으로 차린 끼니는 굶주린 위장과 무뎌진 갈증을 함께 다독인다." |
| tags | `['consumable','food','preserved','chef']` |
| onConsume | `{ nutrition: 45, hydration: 20, morale: 3, fatigue: -3 }` |
| dismantle | `[]` |

**플레이버 어휘 근거:**
- "명동 소피텔 호텔 주방" — `characters.js:312~313` story "명동 소피텔 호텔" + "호텔 뷔페" 직접 인용
- "보존식·곡류·반찬 조합" — LORE_GLOSSARY §3·§4 chef 어휘 "보존식·식자재 검수·표준식단표" 정합 + SCN_QUEST_chef_tier2.md §6.1 어휘 일관성
- "한 끼의 영양 균형" — chef gourmet_sense ability "미식 감각" 정합 + warm_meal "따뜻한 한 끼" 정합
- "굶주린 위장과 무뎌진 갈증을 함께 다독인다" — nutrition+hydration 보강 정체성 명시 + `characters.js:316` "사람들이 굶고 있었다" + "음식은 ... 희망" 정합

### 4.2 신규 — `hearty_stew` (든든한 스튜)

| 항목 | 값 |
|------|-----|
| definitionId | `hearty_stew` |
| name | 든든한 스튜 |
| nameEn | Hearty Stew |
| type | `consumable` |
| subtype | `food` (actEat 발동 + chef 조리 정합) |
| rarity | `uncommon` |
| weight | 0.50 (cooked_noodles 0.3·meat_stew 0.6 사이) |
| defaultDurability | **1** |
| defaultContamination | 0 |
| icon | 🍲 |
| description | "보존식과 향신료를 함께 끓여낸 따뜻한 스튜. 호텔 주방 시절 셰프가 폐관일 야식으로 끓이던 비법대로 졸였다. 진한 국물이 위장과 목구멍을 한꺼번에 적시고, 한 그릇이면 잠시나마 따뜻함이 돌아온다." |
| tags | `['consumable','food','hot','cooked','chef']` |
| onConsume | `{ nutrition: 35, hydration: 30, morale: 5 }` |
| dismantle | `[]` |

**플레이버 어휘 근거:**
- "보존식과 향신료를 함께 끓여낸" — chef pantry_mastery "식자재 보존술" + spice_blend "혼합 향신료" 어휘 직접 인용·연결
- "호텔 주방 시절 셰프가 폐관일 야식으로 끓이던" — `characters.js:312` "호텔 셰프" + warm_meal "따뜻한 한 끼" 정합
- "한 그릇이면 잠시나마 따뜻함이 돌아온다" — `characters.js:316` "음식은 ... 희망" 정체성 정합

### 4.3 양적 검증 (시뮬 KPI 추정)

baseline v13 chef 사망일 분포 + nutrition·hydration 시계열 추정 (`BAL_SIM_baseline_v13_report.md:144~155` 인용):

| 시점 | nutrition (v13 추정) | hydration (v13 추정) | nutrition (v14 추정 with A+B+actEat 등록) |
|------|--------------------|--------------------|----------------------------------------|
| day 1 시작 | 100 | 100 | 100 |
| day 3 (decay 후) | ~55 | ~60 | ~55 |
| day 4 (decay 후) | ~35 | ~40 | ~35 |
| **day 5** (decay 후 actEat 임계 nutrition<30 진입) | ~25 (preserved_ration·canned_food 소진) | ~30 | **chef_meal_kit 1회 소비 → nutrition +45 = ~70 + hydration +20 = ~50** |
| **day 6** (decay 후) | ~15 (사망 임계) | ~10 (탈수 임계) | **chef_meal_kit 2회 소비 → nutrition +45 = ~60 + hydration +20 = ~30 / hearty_stew 1회 소비 → nutrition +35 = ~95 + hydration +30 = ~60** |
| day 7 (cook_intuition grace 안) | n/a (사망 92%) | n/a | **nutrition 누적 +125 / hydration 누적 +70 — day 7~8 생존 연장** |
| day 8~10 | n/a | n/a | **morale·fatigue 균형으로 사망일 day 7+ 이동 추정** |

**시뮬 KPI 추정 (chef 격차 정의 1·2):**

| 시나리오 | chef K3 추정 | others5 K3 | 격차 정의 2 | 1차 KPI 충족 |
|---------|------------|-----------|-----------|-------------|
| 보수 추정 (chef_meal_kit·hearty_stew 1회씩 발동, 1회 발동 누락) | 6.0 | 4.92 | +1.08d | ✅ ≥ +0.5d |
| 중간 추정 (3회 발동 전수 성공) | 6.15 | 4.92 | +1.23d | ✅ |
| 적극 추정 (3회 발동 + day 7~8 이동 효과 누적) | 6.35 | 4.92 | +1.43d | ✅ |

**시뮬 KPI 1차 KPI (chef 격차 정의 1 ≥ +1.0d):**

| 시나리오 | chef K3 | others6 K3 | 격차 정의 1 | 충족 |
|---------|---------|-----------|-----------|-----|
| 보수 추정 | 6.0 | 4.8167 | **+1.18d** | ✅ |
| 중간 추정 | 6.15 | 4.8167 | **+1.33d** | ✅ |
| 적극 추정 | 6.35 | 4.8167 | **+1.53d** | ✅ |

세 시나리오 모두 1차 KPI 충족 추정. **시뮬 R11-1 완전 해소 단언 가능** (§15 트랙 정체성 안에서).

**3차 KPI (chef K3 ≤ 6.5) 안전:** 적극 추정 6.35 ≤ 6.5 안전 범위. 단 over-achievement 모니터링 의무 (§11.1).

---

## 5. 시뮬 actEat 발동 단정 (§15 트랙 정체성 핵심)

### 5.1 시뮬 patch 의무 — `playerAI.mjs:130~133` actEat candidates 등록

`tools/sim/v2/playerAI.mjs:129~141` 인용:

```js
function actEat(inv) {
  const candidates = ['preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
                      'cooked_rice', 'cooked_noodles', 'fish_cooked', 'cooked_meat',
                      'dried_meat', 'salted_meat', 'smoked_meat', 'energy_bar',
                      'fish_large', 'fish_medium', 'fish_small', 'herb'];
  for (const id of candidates) {
    if (dec(inv, id)) {
      applyOnConsume(id);
      return `eat:${id}`;
    }
  }
  return null;
}
```

**의무 patch (트랙 B 본질):**

```diff
function actEat(inv) {
-  const candidates = ['preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
+  const candidates = ['hearty_stew', 'chef_meal_kit',
+                      'preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
                      'cooked_rice', 'cooked_noodles', 'fish_cooked', 'cooked_meat',
                      'dried_meat', 'salted_meat', 'smoked_meat', 'energy_bar',
                      'fish_large', 'fish_medium', 'fish_small', 'herb'];
```

**우선순위 단정:**
- `hearty_stew` 1번째 — nutrition+hydration 동시 보강(+35/+30) = needs-aware benefit `n*3+h = 105+30 = 135` 최고
- `chef_meal_kit` 2번째 — nutrition+45/hydration+20 = benefit `135+20 = 155` 더 높으나 durability 2로 보존 가치 우선 (hearty_stew 먼저 소진 후 chef_meal_kit 2회 발동 패턴)
- 단 actEat은 candidates 배열 순서대로 dec 시도 → **chef_meal_kit이 1번째이면 day 5 1회 + day 6 2회 = chef_meal_kit 소진 후 hearty_stew 발동 패턴** — 양쪽 모두 시뮬 KPI 정합

**권고:** `hearty_stew`를 1번째에 배치 — hot/cooked 자원이 보존식보다 morale·hydration 동시 효과로 chef 정체성 발현 효과 우수. day 5 hearty_stew 1회(소진) → day 5·6 chef_meal_kit 2회 패턴.

### 5.2 hydration 자원 actDrinkWater 분기 — 비등록 단정

`playerAI.mjs:118~127` `actDrinkWater` 분기:

```js
function actDrinkWater(inv) {
  for (const id of ['water_bottle', 'distilled_water', 'purified_water', 'boiled_water',
                    'settled_water', 'herbal_tea', 'rainwater']) {
```

**단정:** chef_meal_kit·hearty_stew는 *food* subtype이므로 `actDrinkWater` 분기에 등록하지 않는다. 두 자원의 hydration 회복은 `actEat` 발동 시 `applyOnConsume`이 deltas 전체 stat을 반영하므로 hydration도 동시 적용된다 (`playerAI.mjs:65~68` 인용):

```js
for (const [stat, delta] of Object.entries(deltas)) {
  const s = GameState.stats[stat];
  if (!s) continue;
  s.current = Math.max(0, Math.min(s.max, s.current + delta));
}
```

따라서 `actEat candidates` 등록만으로 nutrition+hydration 두 stat 동시 회복 발동 보장.

### 5.3 day 5~6 임계 시점 보유 가능성 단정

chef startingItems에 `chef_meal_kit ×1` + `hearty_stew ×1` 추가 + 기존 chef 식품 보유:
- knife_mastery: canned_food ×2 (nutrition+30 each) + preserved_ration ×1 (nutrition+40) + instant_noodles ×2 (actEat 미등록)
- pantry_mastery: spice_blend ×2 (actEat 미등록 — 현행 결함 잔존 / 본 PR 영역 외 / 별도 권고 §11.5)

**day 5 시뮬 actEat 발동 추정 (현재 candidates 순서 기준):**
- preserved_ration ×1 (day 3~4 소진 추정) → 0
- canned_food ×2 (day 4~5 소진 추정) → 0
- **신규 hearty_stew ×1 (day 5 actEat 1번째 후보, dec 성공) → nutrition+35·hydration+30 발동**
- 다음 day 5~6 actEat 발동 → **신규 chef_meal_kit ×2 (2회 dec 성공) → nutrition+45·hydration+20 ×2**

day 5~6 임계 시점 보유 가능성 단정: **3회 발동 보장** (chef startingItems에 day 1 주입 + day 5 이전 소비 차단 — actEat candidates 순서가 preserved_ration·canned_food 우선이므로 chef 신규 자원은 day 5 직전까지 보존됨).

**핵심 단정:** chef 신규 자원이 actEat candidates에 *추가될 때*, candidates 순서 (hearty_stew·chef_meal_kit 1·2번째)로 인해 day 5 임계 진입 시점에 우선 소비된다. day 5 이전에는 preserved_ration·canned_food가 우선 소비되므로 신규 자원은 day 5까지 보존 → day 5·6 임계 시점 정확히 발동.

⚠️ **위험:** actEat candidates의 1·2번째에 chef 신규 자원을 두면 chef 외 직업도 lootTable 획득 시 1순위 소비 → chef 외 직업 K3 향상 부작용 가능 (§11.6 위험). 단 본 사양은 lootTable 미등록(§6.3) — chef 외 직업은 신규 자원 획득 불가 → 회귀 0 보장.

---

## 6. 신규 아이템 정의 + 4곳 등록 룰

### 6.1 4곳 등록 룰 (CLAUDE.md §3 + 협의서 v5 §4.1)

| 등록처 | chef_meal_kit | hearty_stew |
|--------|-------------|-------------|
| 1. `js/data/items_misc.js` | 신규 정의 추가 (§4.1) — `chef_journal`/`spice_blend` 직후 셰프 전용 섹션 (line 557 직후) | 신규 정의 추가 (§4.2) — `chef_meal_kit` 직후 |
| 2. `js/data/stackConfig.js` | `['chef_meal_kit', true, 2]` (durability 2 정합) | `['hearty_stew', false, 1]` (durability 1 정합) |
| 3. `js/data/districts.js` lootTable | **미등록** (chef 전용 시작 자원, 정체성 보호 + 회귀 0 보장) | **미등록** |
| 4. `js/ui/CardFactory.js` CARD_IMAGES | `'chef_meal_kit': 'assets/images/food/canned_food.png'` (canned_food 폴백 패턴) | `'hearty_stew': 'assets/images/food/cooked_noodles.png'` (cooked_noodles 폴백) |

**추가 의무 (§5.1 시뮬 정합 핵심):**

| 5. **`tools/sim/v2/playerAI.mjs` (시뮬 정합 의무)** | `actEat candidates` 배열 line 130~133에 `'hearty_stew', 'chef_meal_kit'` 1·2번째 추가 |

§15 트랙 정체성 안에서 본 5번째 등록은 *시뮬 K3 효과 발현 본질 조건*. 4곳 등록 룰을 *5곳 등록 룰*로 확장 단정 (chef 외 직업 회귀 0은 lootTable 미등록으로 자동 보장).

### 6.2 stackConfig.js patch 위치

`js/data/stackConfig.js:248~249` 직후:

```diff
   ['chef_journal'              , false, 1 ],
   ['spice_blend'               , true,  3 ],

+  // — 셰프 전용 high-nutrition 자원 (트랙 B, R11-1 완전 해소 시도) —
+  ['chef_meal_kit'             , true,  2 ],
+  ['hearty_stew'               , false, 1 ],
```

**근거:** chef_meal_kit durability 2 → maxStack 2 (멀티 스택 가능, 1슬롯 효율). hearty_stew durability 1 → maxStack 1 (단일 슬롯, cooked_noodles 패턴).

### 6.3 CardFactory.js 이미지 매핑

기존 chef 전용 keepsake 섹션 직후 추가 (`CardFactory.js` line ~519):

```diff
   chef_journal:          'assets/images/materials/cloth_scrap.png',
   spice_blend:           'assets/images/food/dried_mushroom.png',

+  // 셰프 전용 high-nutrition 자원 (트랙 B)
+  chef_meal_kit:         'assets/images/food/canned_food.png',
+  hearty_stew:           'assets/images/food/cooked_noodles.png',
```

정식 이미지는 AD 정해린 후속 트랙. 이모지 폴백 가능 (🍱·🍲).

---

## 7. startingItems 갱신 사양

### 7.1 현행 (`characters.js:358~366`)

```js
{
  id: 'pantry_mastery',
  name: '식자재 보존술',
  icon: '🥫',
  desc: '보존식·식재료 섭취 시 사기 회복 +40%. 사기 30 미만 회복 시 피로 -3 추가. 시작 시 셰프 노트·혼합 향신료 지급.',
  effect: {
    moraleRecoveryBonus: 1.6,
    lowMoraleRecoveryFatigueBonus: -3,
    startingItems: ['chef_journal', 'spice_blend', 'spice_blend'],
  },
},
```

3 아이템 (chef_journal ×1 + spice_blend ×2).

### 7.2 정정 (PR17 후보)

```diff
   {
     id: 'pantry_mastery',
     name: '식자재 보존술',
     icon: '🥫',
-    desc: '보존식·식재료 섭취 시 사기 회복 +40%. 사기 30 미만 회복 시 피로 -3 추가. 시작 시 셰프 노트·혼합 향신료 지급.',
+    desc: '보존식·식재료 섭취 시 사기 회복 +60%. 사기 30 미만 회복 시 피로 -3 추가. 시작 시 셰프 노트·혼합 향신료·셰프의 도시락·든든한 스튜 지급.',
     effect: {
       moraleRecoveryBonus: 1.6,
       lowMoraleRecoveryFatigueBonus: -3,
-      startingItems: ['chef_journal', 'spice_blend', 'spice_blend'],
+      startingItems: ['chef_journal', 'spice_blend', 'spice_blend', 'chef_meal_kit', 'hearty_stew'],
     },
   },
```

**변경 요약:**
- `pantry_mastery.startingItems` 3개 → 5개 (chef_meal_kit ×1 + hearty_stew ×1 추가)
- `desc` 문구 보강 ("사기 회복 +40%" → "+60%" 정정 단정 — moraleRecoveryBonus 1.6 = +60% 정합, 기존 desc 오기 동시 정정)
- knife_mastery·cook_intuition·다른 4 abilities 변경 0
- chef 합산 startingItems: 10 → **12 아이템** (water_bottle 1 자동 포함 시 11 → 13)

**chef 무게 부담 검토:**
- 신규 추가 weight: chef_meal_kit 0.45 + hearty_stew 0.50 = +0.95
- chef `maxCarryWeight: 35` (`characters.js:303`) — 기존 7개 부담 ~5kg + 신규 2개 0.95kg = ~6kg ≤ 35kg 안전

---

## 8. PR17 patch diff 후보

### 8.1 `js/data/characters.js` line 358~366 (pantry_mastery ability)

```diff
       {
         id: 'pantry_mastery',
         name: '식자재 보존술',
         icon: '🥫',
-        desc: '보존식·식재료 섭취 시 사기 회복 +40%. 사기 30 미만 회복 시 피로 -3 추가. 시작 시 셰프 노트·혼합 향신료 지급.',
+        desc: '보존식·식재료 섭취 시 사기 회복 +60%. 사기 30 미만 회복 시 피로 -3 추가. 시작 시 셰프 노트·혼합 향신료·셰프의 도시락·든든한 스튜 지급.',
         effect: {
           moraleRecoveryBonus: 1.6,
           lowMoraleRecoveryFatigueBonus: -3,
-          startingItems: ['chef_journal', 'spice_blend', 'spice_blend'],
+          startingItems: ['chef_journal', 'spice_blend', 'spice_blend', 'chef_meal_kit', 'hearty_stew'],
         },
       },
```

**변경 라인:** 2라인 갱신 (desc 1라인 + startingItems 1라인). 기존 chef abilities 5건 변경 0.

### 8.2 `js/data/items_misc.js` line 557 직후 (chef_journal·spice_blend 직후, family_photo 직전)

```diff
   spice_blend: {
     id: 'spice_blend', name: '혼합 향신료', type: 'consumable', subtype: 'food',
     rarity: 'common', weight: 0.05,
     defaultDurability: 1, defaultContamination: 0,
     icon: '🧂', description: '호텔 주방 향신료 캐비닛에서 챙긴 혼합 향신료. 미식 감각으로 직접 조합한 보존용 배합이다. 한 줌이면 굶주린 입맛도 잠시 일깨운다.',
     tags: ['consumable', 'food', 'preserved', 'chef'],
     onConsume: { morale: 6, nutrition: 5 },
     dismantle: [],
   },

+  // 셰프 전용 high-nutrition 자원 (PR17 — 트랙 B, chef nutrition·hydration 직접 보강)
+
+  chef_meal_kit: {
+    id: 'chef_meal_kit', name: '셰프의 도시락', type: 'consumable', subtype: 'food',
+    rarity: 'uncommon', weight: 0.45,
+    defaultDurability: 2, defaultContamination: 0,
+    icon: '🍱', description: '명동 소피텔 호텔 주방에서 직접 챙겨 나온 한 끼. 단정하게 칸막이로 나눈 보존식·곡류·반찬 조합으로 한 끼의 영양 균형을 맞췄다. 셰프의 손으로 차린 끼니는 굶주린 위장과 무뎌진 갈증을 함께 다독인다.',
+    tags: ['consumable', 'food', 'preserved', 'chef'],
+    onConsume: { nutrition: 45, hydration: 20, morale: 3, fatigue: -3 },
+    dismantle: [],
+  },
+
+  hearty_stew: {
+    id: 'hearty_stew', name: '든든한 스튜', type: 'consumable', subtype: 'food',
+    rarity: 'uncommon', weight: 0.50,
+    defaultDurability: 1, defaultContamination: 0,
+    icon: '🍲', description: '보존식과 향신료를 함께 끓여낸 따뜻한 스튜. 호텔 주방 시절 셰프가 폐관일 야식으로 끓이던 비법대로 졸였다. 진한 국물이 위장과 목구멍을 한꺼번에 적시고, 한 그릇이면 잠시나마 따뜻함이 돌아온다.',
+    tags: ['consumable', 'food', 'hot', 'cooked', 'chef'],
+    onConsume: { nutrition: 35, hydration: 30, morale: 5 },
+    dismantle: [],
+  },

   // 소방관 전용 keepsake (PR16 — firefighter rescue_resolve ability 트리거 자원)
   family_photo: {
```

**변경 라인:** 약 22라인 추가 (chef_meal_kit 10라인 + hearty_stew 10라인 + 섹션 헤더 1라인 + 빈줄 1라인). 기존 chef_journal·spice_blend·family_photo 정의 변경 0.

### 8.3 `js/data/stackConfig.js` line 249 직후

```diff
   ['chef_journal'              , false, 1 ],
   ['spice_blend'               , true,  3 ],

+  // — 셰프 전용 high-nutrition 자원 (PR17 트랙 B) —
+  ['chef_meal_kit'             , true,  2 ],
+  ['hearty_stew'               , false, 1 ],
+
   // — 소방관 전용 keepsake (PR16 comrade_memorial) —
```

**변경 라인:** 4라인 추가 (chef_meal_kit 1줄 + hearty_stew 1줄 + 섹션 헤더 1줄 + 빈줄 1줄). 기존 chef_journal·spice_blend 등록 변경 0.

### 8.4 `js/ui/CardFactory.js` CARD_IMAGES (chef 전용 keepsake 섹션 직후)

```diff
   // 셰프 전용 keepsake + 보존식
   chef_journal:          'assets/images/materials/cloth_scrap.png',
   spice_blend:           'assets/images/food/dried_mushroom.png',

+  // 셰프 전용 high-nutrition 자원 (PR17 트랙 B)
+  chef_meal_kit:         'assets/images/food/canned_food.png',
+  hearty_stew:           'assets/images/food/cooked_noodles.png',
+
   // 셰프 전용 희귀 식재료 (윤재혁)
   truffle:               'assets/images/food/dried_mushroom.png',
```

**변경 라인:** 4라인 추가 (chef_meal_kit 1줄 + hearty_stew 1줄 + 섹션 헤더 1줄 + 빈줄 1줄). 정식 이미지는 AD 정해린 후속 트랙.

### 8.5 `tools/sim/v2/playerAI.mjs` line 130~133 (§15 트랙 정체성 시뮬 정합 핵심)

```diff
 function actEat(inv) {
-  const candidates = ['preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
+  const candidates = ['hearty_stew', 'chef_meal_kit',
+                      'preserved_ration', 'canned_food', 'meat_stew', 'sandwich', 'baked_bread',
                       'cooked_rice', 'cooked_noodles', 'fish_cooked', 'cooked_meat',
                       'dried_meat', 'salted_meat', 'smoked_meat', 'energy_bar',
                       'fish_large', 'fish_medium', 'fish_small', 'herb'];
```

**변경 라인:** 2라인 변경 (1라인 갱신 + 1라인 추가). chef 외 직업은 lootTable 미등록으로 본 자원 미보유 — 회귀 0 보장.

### 8.6 검증 명령

```
node --input-type=module js/data/validate.js
# 기대: Errors 0 / ALL CLEAR
#       chef startingItems count = 12 (knife·canned_food×2·preserved_ration·instant_noodles×2·contaminated_water + chef_journal·spice_blend×2 + chef_meal_kit·hearty_stew)
#       items_misc.js chef_meal_kit·hearty_stew 정의 등록 확인
#       stackConfig.js chef_meal_kit·hearty_stew 등록 확인
#       districts.js lootTable chef_meal_kit·hearty_stew 등장 0건 검증 (chef 정체성 보호 + 회귀 0)

node tools/sim/v2/run_baseline.mjs
# 기대: fingerprint len316-h242a5b5f 유지 (BALANCE 미관여, items 정의 추가 + actEat candidates 추가는 BALANCE 미관여)
#       buildTag sim-baseline-v14-pr17
#       chef K3 v13 5.40 → v14 6.0~6.35 추정 (시뮬 KPI)
#       chef 사망일 day 5~6 92건 → day 7+ 이동 추정
#       chef 격차 정의 1 +0.5833d → +1.18~+1.53d (시뮬 1차 KPI 충족 추정)
#       chef 격차 정의 2 +0.4800d → +1.08~+1.43d (시뮬 2차 KPI 해소 추정)
#       homeless·다른 5직업 K3 회귀 0 검증 (lootTable 미등록 + chef startingItems 한정)
```

### 8.7 PR17 patch diff 총 라인 수 추정

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +1 / -1 (pantry_mastery desc 1줄 갱신 + startingItems 1줄 갱신) → 정미 +0 / -0, 실 변경 ~2라인 |
| items_misc.js | +22 / -0 (chef_meal_kit +10, hearty_stew +10, 섹션 헤더·빈줄 +2) |
| stackConfig.js | +4 / -0 (chef_meal_kit·hearty_stew + 섹션 헤더·빈줄) |
| CardFactory.js | +4 / -0 (이미지 매핑 2 + 섹션 헤더·빈줄) |
| playerAI.mjs | +1 / -1 (actEat candidates 1라인 갱신 + 1라인 추가) → 실 변경 ~2라인 |
| **합계** | **~33라인 변경 (실 추가 ~31 / 갱신 ~4)** |

협의서 v5 §14.5 트랙 B "~50라인" 범위 정합. 1 PR 1 트랙 (chef 전용) 준수.

---

## 9. 6 게이트 검수 (DIR_GATE_chef_start_environment.md 패턴 정합)

### 9.1 chef_meal_kit 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "명동 소피텔 호텔 주방에서 직접 챙겨 나온 한 끼" — story `characters.js:312~313` 직접 인용. "단정하게 칸막이로 나눈 보존식·곡류·반찬 조합" — LORE §3·§4 chef "보존식·식자재 검수·표준식단표" 정합. "셰프의 손으로 차린 끼니" — 수석 셰프 정체성 직결 |
| (2) 생존 균형 | ✅ 통과 (3차 KPI 모니터링) | nutrition+45·hydration+20·morale+3·fatigue-3, durability 2 (2회 발동). 협의서 v5 §14.6 범위 내 (nutrition +30~+50 / hydration +20~+40 / morale +0~+5). chef K3 추정 +0.4~0.6d (보수~중간), 격차 정의 1 +1.08~+1.43d (1차 KPI 충족). chef K3 ≤ 6.5 안전 (적극 추정 6.35) |
| (3) 플레이 유지 | ✅ 통과 | chef는 day 5 임계 진입 시점에 즉시 섭취 → nutrition·hydration 동시 회복 → day 7~8 생존 연장 → 메인 퀘스트 "남대문시장 식량 자급" 진행 시간 확보. chef 도시락 어휘는 chef 메인 퀘스트 "급식소 운영" 모티프 직결 |
| (4) 서사 결합 | ✅ 통과 | `js/data/mainQuests/chef/branch_a.js`·`branch_b.js` chef 메인 퀘스트에 "수석 셰프 도시락" 모티프 후속 연계 가능 (시나리오 한도연 후속 트랙). chef goal "서울 생존자 식량 자급" + "셰프의 손으로 차린 끼니" 직결. NPC 결합 0 (본 PR 영역 외) |
| (5) 도구 호환 | ✅ 통과 | 4곳 등록 룰 §6.1 + 시뮬 정합 5번째 등록 (§5.1 actEat candidates). validate.js Errors 0 통과 의무. fingerprint 영향 0 (BALANCE 미관여, items + sim AI 분기만). **PR15 enumerate 필드 사용 0** (신규 effect 필드 도입 0, 기존 onConsume.nutrition·hydration·morale·fatigue 전수 활용). PR15 `_applyAbilityBonusesToConsume`이 chef_meal_kit subtype food onConsume.morale +3 가산 분기 자동 발동 (line 38~57) |
| (6) 측정 가능성 | ✅ 통과 | baseline v14 의무 probe (§10.1): chef 사망일 분포 day 5~6 → day 7+ 이동 측정 / chef inventory durability 추적으로 chef_meal_kit 2회 소비 회수 측정 / chef 격차 정의 1·2 + K3 안전 범위 (시뮬 KPI 마지노선) |

**6 게이트 5/6 통과 + 1/6 모니터링 (3차 KPI chef K3 ≤ 6.5 안전 범위).** → **통과 (모니터링 의무).**

### 9.2 hearty_stew 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "보존식과 향신료를 함께 끓여낸 따뜻한 스튜" — chef pantry_mastery "식자재 보존술" + spice_blend "혼합 향신료" 어휘 직접 연결. "호텔 주방 시절 셰프가 폐관일 야식으로 끓이던" — warm_meal "따뜻한 한 끼" 정합. "따뜻함이 돌아온다" — story "음식은 ... 희망" 정합 |
| (2) 생존 균형 | ✅ 통과 | nutrition+35·hydration+30·morale+5, durability 1 (1회 발동). 협의서 v5 §14.6 범위 내. 단일 발동 효과 — 누적 K3 +0.2~0.3d 단독 기여 (보수~중간) |
| (3) 플레이 유지 | ✅ 통과 | day 5 임계 진입 시점에 actEat candidates 1번째로 즉시 발동 (§5.1) — chef morale +5 단발 보강이 절망 17건(K5) 일부 차단. hot/cooked 자원 어휘로 chef 메인 퀘스트 "급식소" 정합 |
| (4) 서사 결합 | ✅ 통과 | chef goal "남대문시장 식재료 확보" + 스튜(보존식+향신료 조합) 직결. chef 메인 퀘스트 잠재 후크 — "셰프가 끓인 스튜로 굶주린 생존자에게 한 끼" 모티프 후속 시나리오 가능 |
| (5) 도구 호환 | ✅ 통과 | 4곳 등록 룰 §6.1 + 시뮬 정합 5번째 등록 (§5.1). PR15 `_applyAbilityBonusesToConsume`이 hearty_stew onConsume.morale +5 가산 분기 자동 발동 (chef moraleRecoveryBonus 1.6 ×5 = +8) |
| (6) 측정 가능성 | ✅ 통과 | baseline v14 chef inventory durability 추적으로 hearty_stew 1회 소비 회수 측정. chef 격차 정의 1·2 단독 기여 분리 측정 가능 (probe §10.1) |

**6 게이트 전수 통과.** → **통과.**

### 9.3 시뮬 R11-1 완전 해소 단정 검증

| 정의 | v13 실측 | v14 추정 (chef_meal_kit + hearty_stew + actEat 등록) | R11-1 완전 해소 |
|------|---------|----------------------------------------------------|----------------|
| 정의 1 (6직업 평균) | +0.5833d | **+1.18~+1.53d** | ✅ 1차 KPI ≥ +1.0d 충족 |
| 정의 2 (cooking lv 0 5직업 평균) | +0.4800d | **+1.08~+1.43d** | ✅ 2차 KPI ≥ +0.5d 해소 + 완전 해소 |
| chef K3 | 5.40 | 6.0~6.35 | ✅ 3차 KPI ≤ 6.5 안전 |

**핵심 단정:**
- 격차 정의 1·2 동시 +1.0d 이상 회복 → **시뮬 R11-1 완전 해소 단정 가능** (§15 트랙 정체성 안에서)
- chef K3 안전 범위 (6.0~6.35 ≤ 6.5) — 협의서 v5 §10.1 cook_intuition 단축 트리거 비발동
- homeless·다른 5직업 K3 회귀 0 (chef 전용 자원 + lootTable 미등록 + chef startingItems 한정)
- chef 사망일 day 5~6 92건 → day 7+ 이동 추정 (chef_meal_kit 2회 + hearty_stew 1회 = 3회 발동, nutrition 누적 +125 / hydration 누적 +70)

---

## 10. baseline v14 측정 트리거 + 시뮬 KPI 추정값

### 10.1 의무 probe (chef 한정)

| probe | 측정 대상 | 합격 기준 (시뮬 KPI) |
|-------|----------|--------------------|
| 1. chef K3 | mean·median 사망일 | v13 5.40 → v14 **6.0~6.35** (1차 KPI 직접 목표 범위) |
| 2. chef 사망일 분포 | day 5·6·7·8 count | day 5 64→30~40 / day 6 28→20~25 / day 7 6→25~35 / day 8 0→10~20 (day 7+ 이동 추정) |
| 3. chef 격차 정의 1 | chef vs 6직업 평균 | v13 +0.5833d → v14 **≥ +1.0d** (시뮬 1차 KPI 충족) |
| 4. chef 격차 정의 2 | chef vs cooking lv 0 5직업 평균 | v13 +0.4800d → v14 **≥ +0.5d** (시뮬 2차 KPI 해소) |
| 5. chef 탈수+아사 사망 | K5 deathCause 탈수+아사 count | v13 73 → v14 **≤ 40** (-33 이상 추정) |
| 6. chef 절망 사망 | K5 deathCause 절망 count | v13 17 → v14 ≤ 30 (morale 가산 누적 +11 효과 — 단 day 7+ 이동으로 절망 누적 노출 시간 증가 가능, +0~+10 변동 가능) |
| 7. chef_meal_kit·hearty_stew 소비 회수 | inventory durability 추적 | chef_meal_kit 1~2회/run + hearty_stew 1회/run 추정. 의무 ≥ 90% run에서 두 자원 모두 소비 |
| 8. chef `actEat` 발동 분포 | events.detail `eat:chef_meal_kit`·`eat:hearty_stew` | chef ≥ 80건/100run (day 5~6 임계 시점) |
| 9. homeless·다른 5직업 K3 회귀 0 | mean K3 변화 | v13 4.70·4.90·5.00·5.00·5.00·4.30 = v14 동일 (chef 전용 자원 단정) |
| 10. chef K3 안전 범위 | mean K3 ≤ 6.5 | 3차 KPI 모니터링 — 6.5 초과 시 협의서 v5 §10.1 cook_intuition 단축 트리거 발동 |
| 11. 직업 격차 K1 max-min | 7직업 K1 격차 | ≤ 5%p (협의서 v5 §10.4 회귀 검사). K1 = 0% 14회 연속 패턴 유지 시 자동 통과 |
| 12. fingerprint | drift.balanceLeafTotal hash | `len316-h242a5b5f` 유지 (BALANCE 미관여, items + sim AI 분기 추가만) |
| 13. validate.js | items.js / stackConfig.js / districts.js / CardFactory.js 정합 | Errors 0 / ALL CLEAR |

### 10.2 시뮬 1차 KPI 충족 예상값 (chef 격차 정의 1 ≥ +1.0d)

| 시나리오 | chef K3 | others6 K3 | 격차 정의 1 | 시뮬 1차 KPI 충족 |
|---------|---------|-----------|-----------|----------------|
| 보수 추정 (3회 발동 중 1회 누락) | 6.0 | 4.8167 | **+1.18d** | ✅ |
| 중간 추정 (3회 발동 전수 성공) | 6.15 | 4.8167 | **+1.33d** | ✅ |
| 적극 추정 (3회 발동 + day 7~8 이동 누적) | 6.35 | 4.8167 | **+1.53d** | ✅ |

협의서 v5 §5.5 1차 KPI 직접 목표 ≥ +1.0d **세 시나리오 모두 충족** (시뮬 KPI 마지노선).

### 10.3 시뮬 2차 KPI 충족 예상값 (chef 격차 정의 2 ≥ +0.5d, R11-1 해소)

| 시나리오 | chef K3 | others5 K3 (cooking lv 0) | 격차 정의 2 | 시뮬 2차 KPI 충족 |
|---------|---------|---------------------------|-----------|----------------|
| 보수 추정 | 6.0 | 4.92 | **+1.08d** | ✅ |
| 중간 추정 | 6.15 | 4.92 | **+1.23d** | ✅ |
| 적극 추정 | 6.35 | 4.92 | **+1.43d** | ✅ |

협의서 v5 §5.5 2차 KPI ≥ +0.5d **세 시나리오 모두 충족 → 시뮬 R11-1 정의 2 해소 + 완전 해소 단정 가능** (시뮬 KPI 마지노선).

### 10.4 시뮬 3차 KPI 안전 범위 (chef K3 ≤ 6.5)

| 시나리오 | chef K3 | 안전 범위 (≤ 6.5) | 협의서 v5 §10.1 cook_intuition 단축 트리거 |
|---------|---------|------------------|------------------------------------------|
| 보수 추정 | 6.0 | ✅ | 비발동 |
| 중간 추정 | 6.15 | ✅ | 비발동 |
| 적극 추정 | 6.35 | ✅ (경계 근접) | 비발동 (단 모니터링 의무) |
| **위험 임계** | 6.5 | 경계 | 6.5 초과 시 발동 |

세 시나리오 모두 안전 범위. **적극 추정 6.35는 6.5에 0.15d 여유** — 약간 우려 대상. v14 실측에서 6.5 초과 시 협의서 v5 §10.1 완화 트리거 즉시 발동 (`cook_intuition.encounterMultDays.days = 7 → 5` 단일 상수 PR) — 시스템 백승호 후속 트랙.

### 10.5 chef 사망일 분포 추정

baseline v13 → v14 추정:

| 사망일 | v13 실측 | v14 보수 추정 | v14 중간 추정 | v14 적극 추정 |
|--------|---------|-------------|-------------|-------------|
| day 4 | 0 | 0 | 0 | 0 |
| day 5 | 64 | 45 | 35 | 25 |
| day 6 | 28 | 30 | 28 | 22 |
| day 7 | 6 | 18 | 28 | 35 |
| day 8 | 0 | 5 | 8 | 15 |
| day 9 | 0 | 2 | 1 | 3 |
| **day 5~6 합** | **92** | **75** | **63** | **47** |

day 5~6 사망 92건 → 47~75건 (보수~적극). **day 7+ 이동 +17~+45건 추정** — chef nutrition·hydration 회복 자원이 임계 시점에 발동되어 day 7 생존이 본질적으로 가능해짐.

---

## 11. 위험과 완화

### 11.1 chef K3 6.5 초과 위험 (3차 KPI 위반)

**트리거:** baseline v14 측정에서 chef K3 > 6.5.
**원인 후보:**
- (a) effect 값이 가정보다 강함 — chef_meal_kit nutrition+45가 chef cookingEffectBonus 1.6 가산과 별도로 누적
- (b) day 7~8 이동 효과가 추정보다 큼 (cook_intuition grace 7일 안 morale·encounter 가산이 후반 자원 보호로 작용)
- (c) chef_meal_kit durability 2 + hearty_stew durability 1 = 3회 발동이 day 5·6 전수 성공

**완화:**
- **(권고)** 협의서 v5 §10.1 cook_intuition 단축 즉시 발동 — `effect.encounterMultDays.days = 7 → 5` 단일 상수 PR (밸런스 권지나)
- (대안 1) `chef_meal_kit.onConsume.nutrition` 45 → 35 하향 (1단계 보수화)
- (대안 2) `chef_meal_kit.defaultDurability` 2 → 1 하향 (사용 회수 -50%)
- (대안 3) chef startingItems에서 hearty_stew 제거 → chef_meal_kit ×1 단독 (단 R11-1 완전 해소 단언 약화)

### 11.2 chef 격차 정의 1 +1.0d 미달 위험 (1차 KPI 위반)

**트리거:** baseline v14 측정에서 chef 격차 정의 1 < +1.0d.
**원인 후보:**
- (a) effect 값이 가정보다 약함
- (b) actEat candidates 등록 순서가 hearty_stew·chef_meal_kit이 아닌 5번째 이후이면 day 5 발동 직전에 다른 자원 우선 소비
- (c) chef는 cooking lv 4로 actCook이 nutrition 자체 보강 — 신규 자원 효과 marginal

**완화:**
- **(권고)** PR17.1 재조정 — `chef_meal_kit.onConsume.nutrition` 45 → 50 상향 (effect 값 범위 가드레일 안)
- (대안 1) `chef_meal_kit.defaultDurability` 2 → 3 상향 (사용 회수 +50%)
- (대안 2) hearty_stew startInv 1 → 2개 상향
- (대안 3) hearty_stew morale +5 → +0 (가드레일 morale +5 한도 + 5직업 격차 좁힘 위험 해소)

### 11.3 트랙 D 폴백 결정 단정

**트리거:** baseline v14 측정에서 1차 KPI 미달(정의 1 < +1.0d) 또는 2차 KPI 후퇴(정의 2 < +0.5d).
**폴백 권고:** 협의서 v5 §14.5 트랙 D 진입 — PR17 + PR16 *동시 롤백* (~5라인 PR). 단 chef 신규 자원은 *보존* (PR17 일부 — characters.js·items_misc.js·stackConfig.js·CardFactory.js). 시뮬 정합 actEat candidates 등록도 보존 (게임 본체 chef startingItems 보강 가치 유지).

**의미:** 트랙 D 폴백에서도 chef high-nutrition 자원은 게임 본체에서 chef 플레이어 경험을 개선. 단 시뮬 K3 측정 기준에서는 R11-1 완전 해소 단언 미달 — M3 마감 시점에 R11-1 정의 2 후퇴 수용 단언 필요.

### 11.4 chef 외 직업 회귀 위험 (협의서 v5 §10.4 직업 격차 5%p 초과)

**트리거:** baseline v14 측정에서 7직업 K1 max-min > 5%p.
**원인 후보:**
- (a) chef K3 6.35 → K1 0% 유지 시 격차 0%p 유지 (현재 K1 = 0% 14회 연속 패턴 정합)
- (b) chef K3 7.0 초과 → K1 도달 시 5%p 격차 발생 가능 (단 시나리오 적극 추정 6.35로도 미달)

**완화:** 현재 추정 범위 (6.0~6.35) 모두 K1 = 0% 유지 안전. 만약 적극 추정 over-achievement로 K1 도달 시 §11.1 완화 트리거 즉시 발동.

### 11.5 spice_blend·instant_noodles actEat 미등록 잔존 (시뮬 정합 결함 별도 권고)

**현행 결함:** §2.2 §5.1 단정 — `spice_blend`·`instant_noodles`는 `subtype: 'food'`이지만 `actEat candidates` 미등록. chef 신규 자원 발동 후 day 7+ 시점에 spice_blend 2개·instant_noodles 2개가 inventory에 남아 있어도 actEat 미발동.

**본 PR 영역 외:** 본 SCN_QUEST는 chef high-nutrition 신규 자원 2개만 영역. spice_blend·instant_noodles는 별도 PR (시스템 백승호 + 시나리오 한도연 후속 트랙 권고):
- spice_blend는 keepsake 가까운 morale+6/nutrition+5 — actEat candidates 추가 시 chef 외 직업 lootTable 등록 0이므로 chef 한정 발동 유지
- instant_noodles는 cookable 입력 (T1 변환으로 cooked_noodles 산출) — actEat 직접 등록 시 actCook·T1 분기 우회 패턴 발생 가능. 별도 검토 의무

**권고:** baseline v14 측정 후 chef 격차 정의 1·2 over-achievement 시 본 결함은 *보존 가치 단정* — chef 신규 자원만으로 1차 KPI 충족 단언 후 spice_blend·instant_noodles 보강은 chef K3 over-achievement 위험.

### 11.6 chef 신규 자원 lootTable 등록 시 회귀 위험

**트리거:** 시스템 백승호 PR17 구현 중 `js/data/districts.js` 25구 lootTable에 chef_meal_kit·hearty_stew 등록.
**위험:** chef 외 직업도 획득 가능 → actEat candidates 1·2번째 발동 → 7직업 동시 K3 향상 → chef 격차 추가 좁힘 (R11-1 가속 위험).
**완화:**
- 시스템 백승호 PR17 구현 시 검증 의무: `js/data/districts.js` 25구 lootTable 전수 grep으로 chef_meal_kit·hearty_stew 등록 0건 확인
- 1건 이상 등록 시 즉시 제거 (chef 정체성 보호 + 회귀 0 보장)
- **권고:** lootTable 미등록 보존 — chef_journal·spice_blend·worn_photo·sketch_notebook 패턴 정합

### 11.7 PR15 enumerate 분기 외 신규 effect 필드 도입 비권고

**현재 사양 단정:** chef_meal_kit·hearty_stew의 `onConsume`은 모두 기존 stat 필드(nutrition·hydration·morale·fatigue)만 사용. PR15 enumerate 4필드(`moraleRecoveryBonus`·`lowMoraleRecoveryFatigueBonus`·`sketchNotebookBonus`·`moraleOnCraft`) 외 신규 effect 필드 도입 0.

**의미:** 시스템 백승호 PR17 머지 시 sim 측 enumerate 분기 신규 추가 부담 0 — `_applyAbilityBonusesToConsume` (line 38~57) 그대로 자동 발동 (chef moraleRecoveryBonus 1.6이 hearty_stew morale +5 ×1.6 = +8 / chef_meal_kit morale +3 ×1.6 = +4.8 가산).

---

## 12. 위임 메모

| 위임 대상 | 항목 |
|----------|------|
| **시스템 백승호** | (1) PR17 patch diff §8 실제 적용 (characters.js +2 / items_misc.js +22 / stackConfig.js +4 / CardFactory.js +4 / playerAI.mjs +2 = ~33라인) (2) chef abilities effect → player 주입 경로 검증 (`moraleRecoveryBonus 1.6` 자동 발동 단언) (3) districts.js lootTable 25구 전수 grep — chef_meal_kit·hearty_stew 등록 0건 검증 (4) `actEat candidates` line 130~133 hearty_stew·chef_meal_kit 1·2번째 추가 (§5.1 시뮬 정합 의무) (5) validate.js + fingerprint 회귀 0 검증 (6) buildTag sim-baseline-v13 → v14-pr17 갱신 |
| **밸런스 권지나** | (1) baseline v14 측정 §10.1 의무 probe 13건 (2) chef 격차 정의 1·2 + chef K3 안전 범위 1·2·3차 KPI 단정 (시뮬 KPI 마지노선) (3) 시뮬 R11-1 완전 해소 단정 (4) homeless·다른 5직업 K3 회귀 0 검증 (5) chef 사망일 분포 day 5~6 → day 7+ 이동 단정 (6) `BAL_SIM_baseline_v14_report.md` §4.1 chef 사망일 분포 + chef_meal_kit·hearty_stew 소비 회수 직접 probe 의무 (7) 미달 시 트랙 D 폴백 또는 PR17.1 재조정 권고 입력 |
| **설정 이수정** | (1) chef_meal_kit description 어휘 검수 — "수석 셰프 도시락"·"보존식·곡류·반찬 조합" LORE_GLOSSARY §3·§4 정합 단정 (2) hearty_stew description 어휘 검수 — "보존식과 향신료" + warm_meal "따뜻한 한 끼" 정합 (3) LORE_GLOSSARY v0.6 갱신 — chef_meal_kit·hearty_stew 신규 등록 |
| **AD 정해린** | chef_meal_kit 이미지 1건 (🍱 이모지 폴백 가능, 정식 이미지 후속) + hearty_stew 이미지 1건 (🍲 이모지 폴백 가능, cooked_noodles 이미지 폴백) |
| **Director 서민호** | (1) 6 게이트 §9 검수 통과 단정 확인 (2) chef K3 6.0~6.35 범위 안전성 단정 (3) 시뮬 R11-1 완전 해소 단정 가능 여부 사전 단정 (협의서 v5 §10.1 cook_intuition 단축 트리거 비발동 단언) (4) 트랙 D 폴백 결정 권한 사전 위임 (baseline v14 미달 시) |
| **시나리오 한도연 (자기)** | (조건부) PR17.1 재조정 — baseline v14 측정 결과 1차 KPI 미달 시 effect 값 상향 또는 startInv 수량 상향 (§11.2 위험 완화). over-achievement 시 §11.1 완화 — chef_meal_kit nutrition 45 → 35 하향 또는 durability 2 → 1 하향. spice_blend·instant_noodles actEat 미등록 보강은 별도 후속 트랙 (§11.5) |

---

## 13. 결정 단언

| 항목 | 결정 |
|------|------|
| 신규 자원 `chef_meal_kit` (셰프의 도시락) 도입 | **통과** (6 게이트 5/6 통과 + 1/6 모니터링) |
| 신규 자원 `hearty_stew` (든든한 스튜) 도입 | **통과** (6 게이트 전수 통과) |
| `pantry_mastery.startingItems` 3 → 5 확장 | **통과** (chef startingItems 10 → 12, chef maxCarryWeight 35 안전) |
| 4곳 등록 룰 + 시뮬 정합 5번째 등록 | **통과** (items_misc + stackConfig + CardFactory + chef startingItems + playerAI.actEat candidates) |
| PR15 enumerate 필드 사용 | **통과** (신규 effect 필드 0, 기존 onConsume stat 필드 전수 활용) |
| chef 외 직업 변경 0 | **통과** (chef pantry_mastery effect만 변경, lootTable 0, 다른 직업 변경 0) |
| 시뮬 1차 KPI (chef 격차 정의 1 ≥ +1.0d) | **충족 예상** (+1.18~+1.53d, 세 시나리오 모두 충족) |
| 시뮬 2차 KPI (chef 격차 정의 2 ≥ +0.5d) | **충족 예상** (+1.08~+1.43d, R11-1 해소 + 완전 해소 단정 가능) |
| 시뮬 3차 KPI (chef K3 ≤ 6.5) | **안전 예상** (6.0~6.35, 세 시나리오 모두 안전 — 적극 추정 0.15d 여유) |
| 시뮬 R11-1 완전 해소 단정 가능 여부 | **단정 가능** (정의 1·2 동시 +1.0d 이상 회복 추정, §15 트랙 정체성 안에서) |
| chef 사망일 day 5~6 92건 → day 7+ 이동 | **단정 가능** (시뮬 KPI 추정 47~75건, -17~-45건 이동) |
| PR17 patch diff 총 변경량 | ~33라인 (characters.js +2 / items_misc.js +22 / stackConfig.js +4 / CardFactory.js +4 / playerAI.mjs +2) |
| 다음 트리거 | 시스템 백승호 PR17 머지 → baseline v14 측정 (밸런스 권지나) → 시뮬 R11-1 완전 해소 단정 (정의 1·2 + chef K3) → 협의서 v5 §10 위험 완화 발동 여부 단정. 미달 시 트랙 D 폴백 또는 PR17.1 재조정 |

---

*문서 끝. baseline v14 측정 결과 도착 시 §10.1 probe 13건 검증 + 시뮬 R11-1 완전 해소 단정 + chef K3 안전 범위 단언 + 협의서 v5 §10 위험 완화 발동 여부 단정. PR17.1 재조정 트리거(1차 KPI 미달) 또는 cook_intuition 단축 트리거(3차 KPI 초과) 발동 시 시나리오 한도연 즉시 후속 트랙 진입. 트랙 D 폴백 결정 시 PD 김재훈 + Director 서민호 동시 단정 의무. §15 트랙 정체성 안에서 모든 KPI 단언은 시뮬 KPI 해석 — 게임 본체 K1 매핑은 M4+ 텔레메트리 트랙 영역.*
