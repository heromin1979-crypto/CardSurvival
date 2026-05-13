# 시나리오 — soldier Tier-2 abilities + 신규 자원 분배

> 작성: 시나리오 한도연 / 2026-05-12
> 대상: `js/data/characters.js:70~138` soldier (강민준)
> 트리거: 협의서 v5 `PD_BAL_MEETING_PR14_decision.md` §6.4 + §11 §1순위 — M3 #20 진입 결정 (PR14와 동시 진행, 시나리오 단일 트랙 4 SCN_QUEST 작성 중 3 직업 트랙). R15-1 우회 — craft 발동 빈도 가정을 day 시작 1회로 보수화. K3 추정 향상을 PR15 ability 패턴 실측(homeless +0.1d / engineer +0.1d) 기반 보수화
> 결정: **통과** — Tier-2 ability `comrade_memorial` (전우의 기억) 신설 + 신규 군 자원 `dog_tag` (군번줄) 1개 도입 + startingItems 확장. 격차 정의 2(cooking lv 0 5직업) 추가 좁힘은 보수적(-0.1d 이하) 유지 — R11-1 사전 등록 트리거 회피
> 선행: `SCN_QUEST_homeless_tier2.md` (street_solace + worn_photo 패턴), `SCN_QUEST_engineer_tier2.md` (workshop_focus + sketch_notebook 패턴), `SCN_QUEST_firefighter_tier2.md` (rescue_resolve + family_photo 패턴, 병행 산출물)

---

## 1. 서두 — soldier 측정 사실 + R15-1 우회 보수화 명시

### 1.1 baseline v10 측정 사실 (실측 인용)

`BAL_SIM_baseline_v10_report.md` §4 K3 표 (line 94~102):
- soldier K3 v10 = **4.50** (v8·v9·v10 모두 4.5 유지 — PR15 ability 가산 분기에 미관여 직업이라 변화 0)
- soldier K5 v10 = 절망 50 / 아사 48 / 극도 피로 2 (v9 동일, 변화 0)

`BAL_SIM_baseline_v10_report.md` §6.3 (line 270~277):
> 5직업 회귀 0 검증 단언. PR15 시뮬 로직 변경이 ability 보유 2직업(homeless·engineer)에만 영향 단정.

### 1.2 soldier의 SCN_QUEST 대상 정합성

soldier K3 4.50은 7직업 중 firefighter(5.00) 다음 세 번째, chef(5.20) 대비 -0.7d. **격차 정의 2 (cooking lv 0 5직업)에 포함** + **K5 절망 50건 (7직업 중 doctor 98·chef 83·firefighter 11 다음으로 높음)**. 정체성 정합 자원으로 morale 회복 향상 시 K3 향상 + 절망 사망 감소 동시 효과 가능.

본 SCN_QUEST는:
- **K3 향상을 보수적(+0.1~0.3d)으로 사양** — 협의서 v5 §6.3 R15-1 우회 권고 정합
- **격차 추가 좁힘 위험을 회피** — chef SCN_QUEST(R11-1 해소 트랙)와 영역 분리. firefighter SCN_QUEST 효과와 합산해도 chef 격차 보호 단정

### 1.3 R15-1 우회 보수화 (협의서 v5 §6.3 인용)

> SCN_QUEST_chef_tier2.md + 3건 작성 시 craft 발동 빈도 가정을 *보수적*(day 시작 1회)으로 사용. K3 추정값을 baseline v9·v10 실측 패턴(homeless +0.1d, engineer +0.1d)으로 보수화.

**적용:** soldier Tier-2 ability effect 추정 시 PR15 실측 +0.1d 정합으로 K3 향상 +0.1~0.3d로 보수화. craft 발동 빈도 가정 4~6회/day 사용 금지.

### 1.4 결정 단언

R15-1 우회 보수화 + 격차 정의 2 보호 = soldier Tier-2 ability + 신규 자원 1개 한정 사양. K3 향상 +0.1~0.3d. chef 격차 정의 2 추가 좁힘 -0.1d 이하 보장.

---

## 2. 정체성 분석 — soldier 어휘·플레이버

### 2.1 LORE 어휘 톤 (soldier)

`characters.js:85~91` story·strengths 인용:
- strengths: '전투 훈련', '전술적 판단', '높은 운반력'
- weaknesses: '의료 지식 부족', **'동료 상실 트라우마'**, '제작 미숙'
- story: "강민준 하사(29세)는 비상사태 격상 직전 VIP 경호 임무를 받았다" + **"청사에서 불과 200미터 거리에서, 팀원 4명이 차례로 쓰러졌다"** + "광화문에서 후퇴해 용산 미군기지로 철수"

핵심 어휘:
- **"하사"·"부사관"·"전우"** — 군 정체성 본질
- **"팀원 4명이 차례로 쓰러졌다"** — story 직접 인용. weakness '동료 상실 트라우마' 직결. **sim morale 침식 직접 결합**
- **"전술"·"임무"·"방송 신호"** — 군 행동 어휘 ("VIP 경호 임무" + "여기는 여의도 KBS. 아직 방송 중입니다")
- **"무전기"** — story "무전기는 잡음뿐이었지만" 직접 인용

### 2.2 story·goal 인용 (`characters.js:87~91`)

> 2026년 1월 16일, 종로 광화문정부청사. 강민준 하사(29세)는 비상사태 격상 직전 VIP 경호 임무를 받았다.
> 청사에서 불과 200미터 거리에서, **팀원 4명이 차례로 쓰러졌다.**
> 광화문에서 후퇴해 용산 미군기지로 철수했다. 무전기는 잡음뿐이었지만, 끊기지 않는 음성이 하나 있었다.
> "여기는 여의도 KBS. 아직 방송 중입니다. 살아계신 분들은 신호를 들어주세요."

> goal: 여의도 KBS 방송국에 도달해 비상 방송 장비를 가동하고, 전국의 생존자들에게 서울 집결 좌표를 송출한다.

핵심: **"팀원 4명"의 기억이 trauma + 동시에 임무 수행의 동력**. 정체성 정합 어휘 후보:
- "군번줄" (dog_tag) — 전사한 전우 4명의 군번줄, story 직접 인용 가능
- "야전 식량" (field_ration) — 군 보급 어휘
- "전술 벨트" (tactical_belt) — 군 장비 어휘
- "무전기" (radio) — story "무전기는 잡음뿐이었지만" 직접 인용

### 2.3 기존 abilities 5종 (`characters.js:92~127`)

| ID | 이름 | effect |
|----|------|--------|
| combat_training | 전투 훈련 | combatDmgBonus 1.2, critBonus 0.08 |
| tactical_movement | 전술 이동 | noiseReduct 0.4 |
| field_endurance | 야전 단련 | fatigueDecay -0.3 |
| tactical_gear | 전술 장비 | startingItems 7개 |
| comrade_bond | 전우의 유대 | companionMoraleDecayReduct 0.20 |

**관찰:** 5 abilities로 이미 다른 직업(homeless·engineer 4종)보다 많음. `comrade_bond`는 강아지 동반 (companion) 한정 morale 효과로 sim AI에서 발동 빈도 낮음 (npc_dog 동반 시점). **morale·정서** 영역 ability는 `comrade_bond` 1건이나 sim 적용 한계. weakness `'동료 상실 트라우마'` 정합 — *전우의 기억*이 정체성 본질. Tier-2 ability는 "전우의 기억이 사기 회복으로 작용" 보강.

### 2.4 homeless·engineer·firefighter 패턴 대비

| 항목 | homeless | engineer | firefighter | **soldier** |
|------|----------|----------|-------------|-------------|
| 정체성 회복 메커니즘 | 거리 위안 | 작업 몰입 | 가족 결의 | **전우의 기억** |
| Tier-2 ability 트리거 | onConsume.morale +50% | craft·dismantle +5 | onConsume.morale +30% | **onConsume.morale +30%** (firefighter 패턴 정합) |
| 신규 자원 어휘 | "사진"·"잠자리" | "설계도"·"부품" | "가족 사진" | **"군번줄"·"전우"** |
| 신규 자원 수 | 1개 + 갱신 | 1개 | 1개 | **1개** |

---

## 3. Tier-2 ability 사양 — `comrade_memorial` (전우의 기억)

### 3.1 사양

| 항목 | 결정값 |
|------|--------|
| id | `comrade_memorial` |
| name | 전우의 기억 |
| nameEn | Comrade Memorial |
| icon | 🎖️ |
| desc | "전우의 군번줄로 사기 회복 +30%. 시작 시 군번줄 지급." |
| effect | `{ moraleRecoveryBonus: 1.3, startingItems: ['dog_tag'] }` |

### 3.2 정체성 정합

- **어휘:** "전우의 기억" — story "팀원 4명이 차례로 쓰러졌다" + weakness '동료 상실 트라우마' 정합. 기존 `comrade_bond`(전우의 유대)와 차별 — companion 한정이 아닌 *전사한 전우의 기억* 정합
- **플레이버:** "팀원 4명"의 군번줄이 trauma의 원천이자 동시에 임무 수행의 동력 — 군인 정체성의 *역설적 회복 메커니즘*. firefighter "가족 결의" 패턴 정합 (영웅적 회복)
- **abilities 5 → 6 확장 정합:** 전투(combat_training) + 전술(tactical_movement) + 단련(field_endurance) + 장비(tactical_gear) + 유대(comrade_bond) → 기억(comrade_memorial) — 시야 균형. **soldier는 이미 5 abilities 보유라 6 abilities 확장 정합**
- **firefighter `rescue_resolve` 대비 차별성:**
  - firefighter: 가족 사진 (현재 가족을 향한 결의)
  - soldier: 전우 군번줄 (전사한 전우의 기억) — 동일 effect 값이지만 어휘 차별로 정체성 분리

### 3.3 effect 수치 근거 (R15-1 우회 보수화)

- `moraleRecoveryBonus: 1.3` — firefighter rescue_resolve 동일 값. PR15 enumerate 필드(`moraleRecoveryBonus`) 재사용. K3 추정 향상 +0.1~0.3d (homeless +0.1d 실측 정합 -0.05d 보수)
- **lowMoraleRecoveryFatigueBonus 미사용** — homeless 전용 어휘와 차별
- 협의서 v5 §3 가드레일: effect 값 범위 ×1.2~×1.8 → 1.3은 보수적 하한 범위 안

### 3.4 기존 abilities와의 관계

`comrade_bond` (companionMoraleDecayReduct 0.20, npc_dog 한정) + `comrade_memorial` (moraleRecoveryBonus 1.3, onConsume 가산) → **두 ability 모두 정서 영역이나 발동 분기 분리** (companion 시계열 vs onConsume 1회). 시너지 정합 — npc_dog 동반 시 morale 침식 ↓ + dog_tag 소비 시 morale 회복 ↑.

---

## 4. 신규 자원 결정 (후보 비교 + 권고)

### 4.1 후보 매트릭스

| 후보 | 변경 위치 | morale 회복량 | 정체성 정합 | 4곳 등록 룰 | K3 향상 추정 |
|------|-----------|---------------|-------------|-------------|--------------|
| A | 신규 `dog_tag` (군번줄) | +10 | ⭐⭐⭐⭐⭐ (story "팀원 4명이 차례로 쓰러졌다" 직접 인용 + weakness '동료 상실 트라우마' 역설 해소) | 4곳 신규 등록 | +0.1~0.2d (R15-1 우회) |
| B | 신규 `field_ration` (야전 식량) | n/a (식량) | ⭐⭐⭐ (군 보급 어휘) | 4곳 신규 등록 | +0.0~0.1d (nutrition 보조, morale 한정) |
| C | 신규 `tactical_belt` (전술 벨트) | n/a (장비) | ⭐⭐ (장비 어휘) | 4곳 신규 등록 | +0.0d (운반 보조, morale 무관) |
| D | 신규 `radio_handset` (무전기) | +5 (NPC 신호) | ⭐⭐⭐⭐ (story "무전기는 잡음뿐이었지만" 직접 인용) | 4곳 신규 등록 | +0.1d (NPC 연결, 본 PR 영역 외) |
| E | 신규 `combat_kit` (전투 키트) | n/a (의료) | ⭐⭐ (tactical_gear와 중복) | 4곳 신규 등록 | +0.0d (의료 보조) |

### 4.2 권고: **A 단독 채택**

**근거:**

1. **A 단독 (dog_tag)**: morale +10는 worn_photo(+12)·sketch_notebook(+10)·family_photo(+10) 동일 수준 정합. story "팀원 4명" 직접 인용으로 정체성 정합 최강. R15-1 우회 보수화 정합
2. **B (field_ration) 거절** — 군 보급 어휘 정합이나 onConsume.nutrition 효과 영역으로 morale 회복 1차 목표와 분리. 본 SCN_QUEST는 R8-1·R10-1 해소 트랙 정합으로 morale 단일 집중
3. **C·E 거절** — morale 효과 0d. 본 SCN_QUEST 영역 외
4. **D (radio_handset) 보류** — 정체성 정합 강하나 후속 PR에서 NPC 연결 시스템(여의도 KBS goal)과 결합 시 더 적합. 본 PR16 영역 외
5. **firefighter family_photo 1개 사양 정합** — 직업 형평성

### 4.3 양적 검증 (baseline v10 morale 시계열 추정 → v11 추정)

baseline v10 soldier K5 절망 50건 (7직업 중 doctor 98·chef 83 다음 세 번째). morale<30 도달율 추정 ≥ 50% (probe 측정 미존재이나 절망 50건 정합).

| 시점 | morale (v10 측정 추정) | morale (v11 추정 with comrade_memorial + dog_tag) |
|------|------------------------|---------------------------------------------------|
| day 1 시작 | 100 | 100 |
| day 2 (decay 후) | ~50 (절망 진입 회차) | ~50 |
| day 3~4 (decay 누적) | ~25 (morale<30 도달) | dog_tag 소비 → +13 (10 ×1.3) = 38 (actBoostMorale 분기 해제) |
| day 4~5 | 절망 사망 가속 | morale 회복 → nutrition·fatigue 결핍으로 사인 전이 |

**추정 K3 향상:** +0.1~0.3d (R15-1 우회 보수화. soldier v10 4.50 → v11 4.60~4.80). 절망 사망 50 → 30~40 추정 (-10~-20건). 사인 전이로 아사 +10~+20건 추정.

---

## 5. startingItems 사양

### 5.1 현행 (`characters.js:119`)

```js
effect: { startingItems: ['knife', 'alcohol_swab', 'alcohol_swab', 'bandage', 'instant_noodles', 'instant_noodles', 'contaminated_water'] }
```

7 아이템 / `onConsume.morale > 0` 0건.

### 5.2 정정 (PR16 후보)

```js
// tactical_gear (기존, 변경 0)
effect: { startingItems: ['knife', 'alcohol_swab', 'alcohol_swab', 'bandage', 'instant_noodles', 'instant_noodles', 'contaminated_water'] }

// comrade_memorial (신규, Tier-2)
effect: { moraleRecoveryBonus: 1.3, startingItems: ['dog_tag'] }
```

**변경 요약:**
- 기존 tactical_gear 변경 0 (firefighter rescue_kit 패턴 정합)
- `dog_tag` 1개 신규 추가 (Tier-2 ability에 startingItems 배치)
- 합계 7 → **8 아이템** (homeless 10 / engineer 9 / firefighter 7 / soldier 8 — 보수적 균형)

---

## 6. 신규 아이템 정의 + 4곳 등록 룰

### 6.1 신규 — `dog_tag` (군번줄)

| 항목 | 값 |
|------|-----|
| definitionId | `dog_tag` |
| name | 군번줄 |
| nameEn | Dog Tag |
| type | `consumable` |
| subtype | `keepsake` (homeless worn_photo·engineer sketch_notebook·firefighter family_photo와 공유) |
| rarity | `common` |
| weight | 0.02 |
| defaultDurability | 1 |
| defaultContamination | 0 |
| icon | 🎖️ |
| description | "광화문에서 쓰러진 팀원 네 명의 군번줄. 목에 걸고 있으면 무게보다 무거운 것이 있다. 그래도 임무는 남아 있다." |
| tags | `['consumable', 'keepsake', 'soldier']` |
| onConsume | `{ morale: 10, fatigue: -3 }` |
| dismantle | `[]` (분해 불가, 전우는 부서지지 않음) |

**플레이버 어휘 근거:**
- "광화문" — `characters.js:87` story 직접 인용
- "팀원 네 명" — `characters.js:88` story "팀원 4명이 차례로 쓰러졌다" 직접 인용
- "임무는 남아 있다" — `characters.js:91` goal "여의도 KBS 방송국에 도달" 정합

### 6.2 4곳 등록 룰 (CLAUDE.md §3 + 협의서 v5 §4 가드레일)

**dog_tag 신규 아이템에 4곳 등록 의무:**

| 등록처 | 항목 | 사양 |
|--------|------|------|
| 1. `js/data/items_misc.js` | 정의 추가 | §6.1 사양 그대로 ("군인 전용 아이템" 신규 섹션 또는 keepsake 공통 섹션) |
| 2. `js/data/stackConfig.js` | 스택 등록 | `['dog_tag', false, 1]` (단일 아이템, 비stackable — keepsake 패턴 정합) |
| 3. `js/data/districts.js` lootTable | 등장 구 | **미등록** (soldier 전용 시작 아이템, lootTable 미진입으로 직업 정체성 보호) |
| 4. `js/ui/CardFactory.js` CARD_IMAGES | 이미지 매핑 | `'dog_tag': 'assets/cards/dog_tag.png'` 또는 기본 이모지 폴백 (🎖️) |

**기존 아이템 변경 0:**
- knife·alcohol_swab·bandage·instant_noodles·contaminated_water 정의 변경 없음
- soldier startingItems 수량 변경 0 (tactical_gear 변경 0)
- 다른 직업 변경 0 (협의서 v5 §4 가드레일 정합)

---

## 7. 6 게이트 검수 (`DIR_GATE_chef_start_environment.md` 패턴)

### 7.1 Tier-2 ability `comrade_memorial` 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "전우의 기억" 어휘 + story "팀원 4명이 차례로 쓰러졌다" 정합 + weakness '동료 상실 트라우마' 역설적 해소. abilities 5 영역(전투·전술·단련·장비·유대) → 6 영역(기억) 자연 확장 |
| (2) 생존 균형 | ✅ 통과 (R11-1 보호 정합) | K3 +0.1~0.3d 향상 추정 (R15-1 우회 보수화). chef 격차 정의 2 v10 +0.46d → v11 +0.36~0.40d 추가 좁힘 추정 (-0.06~-0.10d). **chef SCN_QUEST(K3 +0.7d 추정)에 의해 정의 2가 +1.0d 회복하면 본 soldier 효과는 안전 범위.** R11-1 사전 등록 트리거 회피 정합 |
| (3) 플레이 유지 | ✅ 통과 | morale<30 회복 시 dog_tag 1회 소비로 회복 → 군인 임무 루프 복귀 정합 |
| (4) 서사 결합 | ✅ 통과 | soldier 메인 퀘스트 후속 연계 가능 ("여의도 KBS 도달" + "전우의 기억 송출" 모티프). NPC 결합 0 (본 PR 영역 외) |
| (5) 도구 호환 | ✅ 통과 | dog_tag 4곳 등록 룰 §6.2 그대로. validate.js 통과 의무. fingerprint 영향 0 (BALANCE 미관여) |
| (6) 측정 가능성 | ✅ 통과 | baseline v11 probe 의무: soldier day 1~5 morale 시계열 + dog_tag 소비 회수 + actBoostMorale 발동 회수 |

**6 게이트 전수 통과.** → **통과.**

### 7.2 R11-1 chef 격차 보호 검토 (협의서 v5 §6.4 정합)

**baseline v11 추정 (soldier K3 4.50 → 4.60~4.80 + firefighter 5.00 → 5.10~5.30 + chef K3 5.20 → 5.7~6.0 합산):**

| 정의 | v10 측정 | v11 추정 (soldier 단독) | v11 추정 (chef + firefighter + soldier 합산) | R11-1 트리거 |
|------|---------|------------------------|--------------------------------------------|-------------|
| 정의 1 (6직업 평균) | +0.567d | +0.527~+0.547d (-0.02~-0.04d) | **+0.9~+1.4d** (chef 효과 우세) | ✅ 회복 |
| 정의 2 (cooking lv 0 5직업) | +0.46d | +0.40~+0.42d (-0.04~-0.06d) | **+0.6~+0.95d** (chef 효과 우세, firefighter·soldier 합산 추가 좁힘 -0.10~-0.15d 흡수) | ✅ 회복 |

**핵심 단정:**
- **soldier 단독으로는 격차 추가 좁힘 -0.04~-0.06d 수준 (보수적)** — R11-1 사전 등록 트리거 회피
- **chef + firefighter + soldier 합산 시 격차 +0.6~+0.95d 회복** — chef SCN_QUEST의 K3 +0.7d 향상 효과가 우세하나 정의 2가 +1.0d 회복 임계 도달 추정 (1차 KPI 목표 달성 가능)
- 권고: soldier Tier-2 사양 그대로 유지. chef SCN_QUEST K3 향상이 격차 회복 1차 목표 담당

### 7.3 dog_tag 게이트

| 게이트 | 결과 |
|--------|------|
| (1) 직업 정체성 | ✅ "광화문"·"팀원 네 명"·"임무는 남아 있다" 직접 인용. weakness '동료 상실 트라우마' 역설 해소 |
| (2) 생존 균형 | ✅ morale +10는 family_photo·sketch_notebook 동일 수준. 보수적 정합 |
| (3) 플레이 유지 | ✅ 1회 소비 → 즉시 morale 13 회복 → 회복 후 임무 루프 복귀 |
| (4) 서사 결합 | ✅ soldier 메인 퀘스트 후속 ("KBS 방송 송출" + "전우의 기억" 모티프) |
| (5) 도구 호환 | ✅ 4곳 등록 룰 §6.2. lootTable 미등록 (직업 정체성 보호) |
| (6) 측정 가능성 | ✅ baseline v11 `actBoostMorale` 발동 분포에서 dog_tag 소비 회수 측정 가능 |

**6 게이트 전수 통과.** → **통과.**

---

## 8. PR16 patch diff 후보

### 8.1 `js/data/characters.js` (line 92~127 영역, soldier abilities)

```diff
     abilities: [
       {
         id: 'combat_training',
         name: '전투 훈련',
         icon: '⚔️',
         desc: '전투 데미지 +20%, 크리티컬 확률 +8%',
         effect: { combatDmgBonus: 1.2, critBonus: 0.08 },
       },
       {
         id: 'tactical_movement',
         name: '전술 이동',
         icon: '👣',
         desc: '탐색 소음 -40%',
         effect: { noiseReduct: 0.4 },
       },
       {
         id: 'field_endurance',
         name: '야전 단련',
         icon: '🏃',
         desc: '피로 감소 속도 -30%',
         effect: { fatigueDecay: -0.3 },
       },
       {
         id: 'tactical_gear',
         name: '전술 장비',
         icon: '🎒',
         desc: '나이프 + 알코올 솜 + 붕대 지급',
         effect: { startingItems: ['knife', 'alcohol_swab', 'alcohol_swab', 'bandage', 'instant_noodles', 'instant_noodles', 'contaminated_water'] },
       },
       {
         id: 'comrade_bond',
         name: '전우의 유대',
         icon: '🐕',
         desc: '강아지 동반 시 사기 감소 -20%',
         effect: { companionMoraleDecayReduct: 0.20 },
       },
+      {
+        id: 'comrade_memorial',
+        name: '전우의 기억',
+        icon: '🎖️',
+        desc: '전우의 군번줄로 사기 회복 +30%. 시작 시 군번줄 지급.',
+        effect: {
+          moraleRecoveryBonus: 1.3,
+          startingItems: ['dog_tag'],
+        },
+      },
     ],
```

**변경 라인:** 약 10라인 추가. 영향: `characters.js:92~140`.

### 8.2 `js/data/items_misc.js` (line 478 노숙자 전용 섹션 다음 또는 keepsake 공통 섹션)

신규 `dog_tag` 정의 추가:

```diff
+  // ─── 군인 전용 아이템 ──────────────────────────────────────
+  // 강민준 시작 지급 아이템 — comrade_memorial ability 트리거 자원
+
+  dog_tag: {
+    id: 'dog_tag', name: '군번줄', type: 'consumable', subtype: 'keepsake',
+    rarity: 'common', weight: 0.02,
+    defaultDurability: 1, defaultContamination: 0,
+    icon: '🎖️', description: '광화문에서 쓰러진 팀원 네 명의 군번줄. 목에 걸고 있으면 무게보다 무거운 것이 있다. 그래도 임무는 남아 있다.',
+    tags: ['consumable', 'keepsake', 'soldier'],
+    onConsume: { morale: 10, fatigue: -3 },
+    dismantle: [],
+  },
```

**변경 라인:** 약 11라인 추가.

### 8.3 `js/data/stackConfig.js` (소방관 전용 섹션 다음)

```diff
   // — 소방관 전용 아이템 —
   ['family_photo'              , false, 1 ],
+
+  // — 군인 전용 아이템 —
+  ['dog_tag'                   , false, 1 ],
```

**변경 라인:** 3라인 추가 (섹션 헤더 2줄 + 등록 1줄).

### 8.4 `js/ui/CardFactory.js` CARD_IMAGES

시스템 백승호 위임 — `dog_tag` 이미지 매핑 추가 (기본 이모지 폴백 가능).

### 8.5 검증 명령

```
node --input-type=module js/data/validate.js
# 기대: Errors 0 / ALL CLEAR

node tools/sim/v2/run_baseline.mjs
# 기대: fingerprint len316-h242a5b5f 유지 (BALANCE 미변경 단정)
#       buildTag sim-baseline-v11-pr16
#       soldier K3 v10 4.50 → v11 4.60~4.80 추정 (R15-1 우회 보수화)
#       soldier 절망 사망 v10 50 → v11 30~40 추정 (-10~-20건)
#       사인 전이 아사 +10~+20건 (baseline v10 사인 전이 패턴 정합)
```

### 8.6 PR16 patch diff 총 라인 수 추정 (soldier 단독)

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +10 |
| items_misc.js | +11 (dog_tag 신규) |
| stackConfig.js | +3 (섹션 헤더 + 등록) |
| CardFactory.js | +1 (이미지 매핑) |
| **합계** | **+25 (총 ~25 변경)** |

---

## 9. baseline v11 측정 트리거 (보수적 K3 추정)

### 9.1 의무 probe (soldier 단독)

| probe | 측정 대상 | 합격 기준 (R15-1 우회 보수화) |
|-------|----------|------------------------------|
| 1. soldier K3 | mean·median 사망일 | v10 4.50 → v11 ≥ 4.60 (+0.10d 이상, R15-1 우회 보수화) |
| 2. soldier 절망 사망 | K5 deathCause 절망 count | v10 50 → v11 ≤ 40 (-10 이상) |
| 3. soldier 아사 사망 | K5 deathCause 아사 count | v10 48 → v11 50~68 (사인 전이 +10~+20건) |
| 4. soldier morale<30 도달율 | runs[*] morale 시계열 day 1~5 | day 5 도달율 ≤ 70% (v10 절망 50건 정합) |
| 5. soldier `actBoostMorale` 발동 회수 | playerAI.mjs 분기 발동 분포 | dog_tag 소비 발동 ≥ 30/100 (절망 진입 회차 한정) |
| 6. dog_tag 소비 회수 | inventory 차감 추적 | 1회/회차 (defaultDurability 1) |
| 7. chef 격차 정의 2 | chef vs cooking lv 0 5직업 평균 | **chef + firefighter + soldier 합산 시 +0.6~+0.95d 회복 추정** (chef SCN_QUEST의 K3 +0.7d 효과 우세) |
| 8. fingerprint | drift.balanceLeafTotal hash | `len316-h242a5b5f` 유지 (BALANCE 미관여) |
| 9. validate.js | items.js / blueprints.js / stackConfig.js 정합 | Errors 0 / ALL CLEAR |

### 9.2 K3 향상 추정 (R15-1 우회 보수화)

baseline v10 soldier K3 4.50 → v11 추정:
- **R15-1 우회 보수화 적용:** PR15 실측 패턴(homeless +0.1d, engineer +0.1d) 정합 → soldier +0.1d 보수
- moraleRecoveryBonus 1.3 (homeless 1.5보다 -0.2 보수) → effect 수치 차이 추가 -0.05d 추정
- **추정 v11 K3 = 4.60~4.80 (Δ +0.1~0.3d)**

### 9.3 chef SCN_QUEST 합산 효과 (위협 평가)

| 직업 | v10 K3 | v11 K3 추정 | v11 day 100 도달 |
|------|--------|------------|----------------|
| chef | 5.20 | 5.7~6.0 (chef SCN_QUEST 효과 우세) | 0~3건 |
| firefighter | 5.00 | 5.10~5.30 | 0~2건 |
| **soldier** | **4.50** | **4.60~4.80** | 0~1건 (보수적) |
| 합산 (chef + 3직업) | - | - | **chef 격차 정의 2 +0.6~+0.95d 회복** (chef SCN_QUEST 효과 우세, 1차 KPI +1.0d 회복 임계 도달 가능) |

**핵심 단정:** soldier K3 +0.1~0.3d는 chef 격차 추가 좁힘 -0.04~-0.06d 수준. chef + firefighter + soldier 3직업 합산 시 정의 2 추가 좁힘 -0.10~-0.16d 누적이나 chef SCN_QUEST의 K3 +0.7d 효과가 격차 +1.0d 회복 담당. **R11-1 사전 등록 트리거 회피 정합.**

---

## 10. 위험과 완화

### 10.1 soldier K3 +0.3d 초과 (격차 추가 좁힘 위험)

**트리거:** baseline v11 측정에서 soldier K3 ≥ 4.9 (Δ ≥ +0.4d). chef 격차 정의 2 추가 좁힘 -0.08d 이상.
**완화:**
- (a) `moraleRecoveryBonus` 1.3 → 1.2 하향 (격차 추가 좁힘 폭 축소)
- (b) `dog_tag` `onConsume.morale` 10 → 8 하향
- 권고: (a) 우선 — PR15 enumerate 필드 직접 조정

### 10.2 dog_tag 1회 소비 후 회복 수단 부재

**트리거:** day 3~4 dog_tag 소비 후 morale 재침식 (homeless·engineer day 4~5 재진입 패턴 정합).
**완화:** soldier K5 절망 50건은 morale 침식 큰 영역. dog_tag 효과만으로 절망 사망 -20건 추정. 재진입율 50% 초과 시 후속 PR에서 defaultDurability 1 → 2 검토. 단 본 PR16은 보수적 사양 유지

### 10.3 R15-1 우회 실패 (실측 +0.1d 미달)

**트리거:** baseline v11 측정에서 soldier K3 +0.1d 미달.
**완화:** 협의서 v5 §10.3 R15-1 우회 실패 폴백 트리거 정합. PR17 craft 발동 빈도 보강 트랙 진입. 단 soldier는 craft 영역 ability 미보유라 R15-1 영향 직접 받지 않음 — moraleRecoveryBonus는 onConsume 가산이라 PR15 enumerate 정합

### 10.4 신규 subtype `keepsake` 의존

**트리거:** SCN_QUEST_firefighter §10.4 / SCN_QUEST_homeless §10.4 / SCN_QUEST_engineer §10.4 위임 트리거와 동일.
**완화:** 시스템 백승호 `keepsake` 신규 등록 결정 후 dog_tag도 동일 subtype 사용. 4 직업 동시 etabkeepsake 어휘 정합 (가족·전우·동료·작업 기억)

### 10.5 ability effect 필드 충돌 (homeless·firefighter와 동일 필드)

**트리거:** `moraleRecoveryBonus` 필드를 homeless·firefighter·soldier 3 직업 ability가 보유. sim 가산 분기 적용 정합 검증 의무.
**완화:** PR15 `_applyAbilityBonusesToConsume` 함수는 `GameState.player.moraleRecoveryBonus` 단일 값 가산. soldier도 동일 분기 발동 단정. ability별 effect 값 차이(homeless 1.5 / firefighter 1.3 / soldier 1.3)는 GameState 초기화에서 ability별 값으로 반영 — 시스템 백승호 검증 의무

### 10.6 chef·firefighter·soldier·pharmacist 동시 진입 시 정의 2 추가 좁힘 누적

**트리거:** chef + firefighter + soldier + pharmacist 4 직업 동시 K3 향상 시 정의 2 격차 추가 좁힘 -0.10~-0.20d 누적. 단 chef SCN_QUEST의 K3 +0.7d 효과가 우세하면 격차 회복 +0.5~+0.85d 도달.
**완화:** chef SCN_QUEST의 격차 회복 1차 목표(+1.0d 회복) 달성 검증 의무. baseline v11 측정 §4.1 직업별 분리 측정 (협의서 v5 §6.4 §9.3) 의무로 chef 효과 단정. 미달 시 PR16.1 재조정(homeless·engineer·firefighter·soldier·pharmacist 5 직업 effect 일괄 하향) 후속 트랙

---

## 11. 결정 단언

| 항목 | 결정 |
|------|------|
| Tier-2 ability `comrade_memorial` 신설 | **통과** (6 게이트 전수 통과) |
| 신규 아이템 `dog_tag` 도입 | **통과** (6 게이트 전수 통과) |
| `moraleRecoveryBonus: 1.3` (homeless 1.5보다 보수적, firefighter 동일) | **통과** (R15-1 우회 보수화 정합) |
| startingItems 7 → 8 확장 | **통과** (보수적 균형 정합) |
| 4곳 등록 룰 적용 | **통과** (dog_tag 4곳 신규) |
| R11-1 chef 격차 보호 | **통과** (단독 -0.04~-0.06d, chef+3직업 합산 시 정의 2 +0.6~+0.95d 회복) |
| PR16 패치 diff 총 변경량 (soldier 단독) | ~25라인 (characters.js +10 / items_misc.js +11 / stackConfig.js +3 / CardFactory.js +1) |
| 다음 트리거 | 시스템 백승호 PR16 머지 (chef + 3직업 합산 또는 분리) → baseline v11 측정 (밸런스 권지나) → R11-1 해소 단정 + soldier K3 +0.1~0.3d 단정 |

---

*문서 끝. baseline v11 측정 결과 도착 시 §9.1 probe 검증 + R11-1 해소 단정 + chef + firefighter + soldier + pharmacist 4 SCN_QUEST 합산 효과 단정. R15-1 우회 보수화 정합 검증 의무.*
