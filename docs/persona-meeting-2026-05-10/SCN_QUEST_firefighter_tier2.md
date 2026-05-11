# 시나리오 — firefighter Tier-2 abilities + 신규 자원 분배

> 작성: 시나리오 한도연 / 2026-05-12
> 대상: `js/data/characters.js:141~200` firefighter (박영철)
> 트리거: 협의서 v5 `PD_BAL_MEETING_PR14_decision.md` §6.4 + §11 §1순위 — M3 #20 진입 결정 (PR14와 동시 진행, 시나리오 단일 트랙 4 SCN_QUEST 작성 중 3 직업 트랙). R15-1 우회 — craft 발동 빈도 가정을 day 시작 1회로 보수화. K3 추정 향상을 PR15 ability 패턴 실측(homeless +0.1d / engineer +0.1d) 기반 보수화
> 결정: **통과** — Tier-2 ability `rescue_resolve` (구조의 결의) 신설 + 신규 구조·화재 자원 `family_photo` (가족 사진) 1개 도입 + startingItems 확장. 격차 정의 2(cooking lv 0 5직업) 추가 좁힘은 보수적(-0.1d 이하) 유지 — R11-1 사전 등록 트리거 회피
> 선행: `SCN_QUEST_homeless_tier2.md` (street_solace + worn_photo 패턴), `SCN_QUEST_engineer_tier2.md` (workshop_focus + sketch_notebook 패턴), `DIR_GATE_chef_start_environment.md` (Director 6 게이트 검수 패턴)

---

## 1. 서두 — firefighter 측정 사실 + R15-1 우회 보수화 명시

### 1.1 baseline v10 측정 사실 (실측 인용)

`BAL_SIM_baseline_v10_report.md` §4 K3 표 (line 94~102):
- firefighter K3 v10 = **5.00** (v8·v9·v10 모두 5.0 유지 — PR15 ability 가산 분기에 미관여 직업이라 변화 0)
- firefighter K5 v10 = 아사 86 / 절망 11 / 극도 피로 3 (v9 동일, 변화 0)

`BAL_SIM_baseline_v10_report.md` §6.3 (line 270~277):
> chef·pharmacist Tier-2 abilities 미보유 + onConsume.morale 가산 분기 효과 0 단언. **5직업 회귀 0 검증 단언.** PR15 시뮬 로직 변경이 ability 보유 2직업(homeless·engineer)에만 영향 단정.

### 1.2 firefighter의 SCN_QUEST 대상 정합성

firefighter K3 5.00은 7직업 중 chef(5.20) 다음 두 번째로 높음. **격차 정의 2 (cooking lv 0 5직업)에 포함**되어 K3 추가 향상이 chef 격차 추가 좁힘에 직접 작용. 따라서 본 SCN_QUEST는:
- **K3 향상을 보수적(+0.1~0.3d)으로 사양** — 협의서 v5 §6.3 R15-1 우회 권고 정합
- **격차 추가 좁힘 위험을 회피** — chef SCN_QUEST(R11-1 해소 트랙)와 영역 분리

### 1.3 R15-1 우회 보수화 (협의서 v5 §6.3 인용)

> SCN_QUEST_chef_tier2.md + 3건 작성 시 craft 발동 빈도 가정을 *보수적*(day 시작 1회)으로 사용. K3 추정값을 baseline v9·v10 실측 패턴(homeless +0.1d, engineer +0.1d)으로 보수화.

**적용:** firefighter Tier-2 ability effect 추정 시 PR15 실측 +0.1d 정합으로 K3 향상 +0.1~0.3d로 보수화. SCN_QUEST_engineer §3.3 craft 4~6회/day 추정 사용 금지.

### 1.4 결정 단언

R15-1 우회 보수화 + 격차 정의 2 보호 = firefighter Tier-2 ability + 신규 자원 1개 한정 사양. K3 향상 +0.1~0.3d (R15-1 우회). chef 격차 정의 2 추가 좁힘 -0.1d 이하 보장.

---

## 2. 정체성 분석 — firefighter 어휘·플레이버

### 2.1 LORE_GLOSSARY 어휘 톤 (firefighter)

`characters.js:155~161` story·strengths 인용:
- strengths: '뛰어난 체력', '구조 기술', '도구 숙련'
- weaknesses: '총기 미숙', **'가족 걱정 (사기)'**, '의료 한계'
- story: "용산에서 대형 화재 신고" + "동료 이재훈이 무언가에 물렸다" + **"은평구 불광동, 거기에 그의 아내와 두 아이가 있다"**

핵심 어휘:
- **"구조"·"구조대원"** — 직업 정체성 본질
- **"가족"·"아내와 두 아이"** — story `weaknesses: '가족 걱정 (사기)'` 직접 인용. **sim morale 침식 직접 결합**
- **"동료"·"이재훈"** — 잃은 동료의 기억 + 구조 직업 유대
- **"진입"·"탈출"** — 구조대원 행동 어휘 ("먼저 진입했다" + "지하 주차장으로 탈출")

### 2.2 story·goal 인용 (`characters.js:157~162`)

> 2026년 1월 16일 새벽 3시. 용산에서 대형 화재 신고가 들어왔다.
> 박영철 소방위(44세)는 10년 경력의 구조대원으로 먼저 진입했다.
> 그런데 화재가 아니었다. 건물 안에 불길은 없었고 쓰러진 사람들만 있었다.
> 동료 이재훈이 무언가에 물렸다. "영철아, 나 좀 이상한 것 같아."
> 박영철은 지하 주차장으로 탈출했다. **은평구 불광동, 거기에 그의 아내와 두 아이가 있다.**

> goal: 은평구 집으로 돌아가 가족의 생사를 확인하고, 생존자들을 위한 거점 거주지를 구축한다.

핵심: **"가족 걱정"이 사기 약화 메커니즘 + "가족 사진"이 사기 회복 메커니즘**. 정체성 정합 어휘 후보:
- "가족 사진" — story "아내와 두 아이" 직접 인용 + weakness 'gamily 걱정 (사기)' 역설적 해소
- "헬멧 램프" — 구조대원 도구
- "현장 일지" — 구조 임무 기록

### 2.3 기존 abilities 4종 (`characters.js:163~191`)

| ID | 이름 | effect |
|----|------|--------|
| physical_conditioning | 체력 단련 | fatigueDecay -0.2 |
| rescue_technique | 구조 기술 | healBonus 1.2 |
| tool_proficiency | 도구 숙련 | craftSaveChance 0.3 |
| rescue_kit | 구조 키트 | startingItems 6개 |

**관찰:** 4 abilities 모두 **신체·도구·구조 기술** 영역. **morale·정서** 영역 ability 0건. weakness `'가족 걱정 (사기)'` 정합 — *구조대원은 의무감과 가족 사이의 정서적 긴장*이 정체성 본질. Tier-2 ability는 "가족을 향한 결의가 사기 회복으로 작용" 보강 방향.

### 2.4 homeless·engineer 패턴 대비

| 항목 | homeless | engineer | **firefighter** |
|------|----------|----------|-----------------|
| 정체성 회복 메커니즘 | 거리 위안 (소비형) | 작업 몰입 (행위형) | **가족 결의 (소비형 + onConsume.morale 큰 회복)** |
| Tier-2 ability 트리거 | onConsume.morale 가산 (+50%) | craft·dismantle 행위 가산 (+5) | onConsume.morale 가산 (+30% 보수적) |
| 신규 자원 어휘 | "사진"·"잠자리" | "설계도"·"부품" | **"가족 사진"·"진입"·"가족"** |
| 신규 자원 수 | 1개 (worn_photo) + newspaper_bundle 갱신 | 1개 (sketch_notebook) | **1개 (family_photo) 한정** |

---

## 3. Tier-2 ability 사양 — `rescue_resolve` (구조의 결의)

### 3.1 사양

| 항목 | 결정값 |
|------|--------|
| id | `rescue_resolve` |
| name | 구조의 결의 |
| nameEn | Rescue Resolve |
| icon | 🚒 |
| desc | "가족·동료의 기억으로 사기 회복 +30%. 시작 시 가족 사진 지급." |
| effect | `{ moraleRecoveryBonus: 1.3, startingItems: ['family_photo'] }` |

### 3.2 정체성 정합

- **어휘:** "구조의 결의" — story "구조대원으로 먼저 진입했다" + goal "은평구 집으로 돌아가 가족의 생사를 확인" 정합. weakness '가족 걱정' 역설적 해소
- **플레이버:** "은평구 불광동, 거기에 그의 아내와 두 아이가 있다" → 가족을 향한 결의가 morale 회복의 원천. *영웅적 회복* (구조 직업 정체성 정합)
- **abilities 4 → 5 확장 정합:** 신체(physical_conditioning) + 의료(rescue_technique) + 도구(tool_proficiency) + 자재(rescue_kit) → 정서·결의(rescue_resolve) — 시야 균형. homeless·engineer 패턴 정합
- **homeless `street_solace` 대비 차별성:**
  - homeless: 거리 위안 +50% (자포자기형 회복, 보수적 어휘)
  - firefighter: 가족 결의 **+30%** (의무감형 회복, 영웅적 어휘). 회복량 보수적 — 격차 정의 2 보호 정합

### 3.3 effect 수치 근거 (R15-1 우회 보수화)

- `moraleRecoveryBonus: 1.3` — homeless 1.5보다 보수적 (-0.2). PR15 enumerate 필드(`moraleRecoveryBonus`) 재사용. K3 추정 향상 +0.1~0.2d (homeless +0.1d 실측 정합 -0.05d 보수)
- **lowMoraleRecoveryFatigueBonus 미사용** — homeless 전용 어휘(거리 단련된 정서 회복)와 차별. firefighter는 가족 결의 단일 effect로 정체성 차별화
- 협의서 v5 §3 가드레일: effect 값 범위 ×1.2~×1.8 → 1.3은 보수적 하한 범위 안

### 3.4 기존 abilities와의 관계

`rescue_kit` (startingItems 6개) + `rescue_resolve` (startingItems 1개) → **총 7 아이템** (homeless 10 / engineer 9 대비 보수적). rescue_kit과 분리 — chef knife_mastery 패턴 정합 (Tier-2 ability에 별도 startingItems 부여).

---

## 4. 신규 자원 결정 (후보 비교 + 권고)

### 4.1 후보 매트릭스

| 후보 | 변경 위치 | morale 회복량 | 정체성 정합 | 4곳 등록 룰 | K3 향상 추정 |
|------|-----------|---------------|-------------|-------------|--------------|
| A | 신규 `family_photo` (가족 사진) | +10 | ⭐⭐⭐⭐⭐ (story "아내와 두 아이" 직접 인용 + weakness '가족 걱정' 역설 해소) | 4곳 신규 등록 | +0.1~0.2d (R15-1 우회) |
| B | 신규 `helmet_lamp` (헬멧 램프) | n/a (도구) | ⭐⭐⭐ (구조 도구 어휘) | 4곳 신규 등록 | +0.0d (탐색 보조, morale 무관) |
| C | 신규 `fire_axe` (소방 도끼) | n/a (무기) | ⭐⭐⭐ (소방 어휘) | 4곳 신규 등록 | +0.0d (전투 보조, morale 무관) |
| D | 신규 `oxygen_mask` (산소 마스크) | n/a (보호구) | ⭐⭐⭐ (구조 어휘) | 4곳 신규 등록 | +0.0d (오염 환경 보조) |
| E | 신규 `emergency_kit` (응급 키트) | n/a (의료) | ⭐⭐ (rescue_kit과 중복) | 4곳 신규 등록 | +0.0d (의료 보조) |

### 4.2 권고: **A 단독 채택**

**근거:**

1. **A 단독 (family_photo)**: morale +10는 worn_photo(+12) 대비 보수적. sketch_notebook(+10) 동일 수준. 1회 소비 정체성 정합(가족 사진은 무한 효과 불가). R15-1 우회 보수화 정합
2. **B·C·D·E 거절** — morale 회복 효과 0d. baseline v10 firefighter K5 절망 11건(7직업 중 가장 낮음)이라 morale 효과보다 nutrition/fatigue 효과가 부적합. **본 SCN_QUEST는 K3 향상 +0.1~0.3d 보수적 사양이라 단일 자원으로 충분**
3. **homeless·engineer 대비 신규 자원 수 절감 (2→1, 1→1)** — 격차 정의 2 추가 좁힘 회피 정합. chef SCN_QUEST 트랙 영역 보호

### 4.3 양적 검증 (baseline v10 morale 시계열 추정 → v11 추정)

baseline v10 firefighter K5 절망 11건 → morale<30 도달율은 homeless·engineer 대비 낮음 (probe 측정 미존재이나 절망 사망 11건 정합). family_photo 효과:

| 시점 | morale (v10 측정 추정) | morale (v11 추정 with rescue_resolve + family_photo) |
|------|------------------------|------------------------------------------------------|
| day 1 시작 | 100 | 100 |
| day 2 (decay 후) | ~50 (절망 11건만 도달, 대다수 안정) | ~50 |
| day 4~5 (decay 누적) | ~25 (절망 진입 회차) | family_photo 소비 → +13 (10 ×1.3) = 38 (actBoostMorale 분기 해제) |
| day 5~6 | 절망 사망 | morale 회복 → nutrition·fatigue 결핍으로 사인 전이 (baseline v10 사인 전이 패턴 정합) |

**추정 K3 향상:** +0.1~0.3d (R15-1 우회 보수화. firefighter v10 5.0 → v11 5.1~5.3). 절망 사망 11 → 5~8 추정 (-3~-6건).

---

## 5. startingItems 사양

### 5.1 현행 (`characters.js:190`)

```js
effect: { startingItems: ['rope', 'hand_axe', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] }
```

6 아이템 / `onConsume.morale > 0` 0건.

### 5.2 정정 (PR16 후보)

```js
// rescue_kit (기존, 변경 0)
effect: { startingItems: ['rope', 'hand_axe', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] }

// rescue_resolve (신규, Tier-2)
effect: { moraleRecoveryBonus: 1.3, startingItems: ['family_photo'] }
```

**변경 요약:**
- 기존 rescue_kit 변경 0 (homeless street_tools 갱신 패턴과 차별 — firefighter는 신규 자원 단일 한정)
- `family_photo` 1개 신규 추가 (Tier-2 ability에 startingItems 배치)
- 합계 6 → **7 아이템** (homeless 10 / engineer 9 / firefighter 7 — 보수적 균형)

---

## 6. 신규 아이템 정의 + 4곳 등록 룰

### 6.1 신규 — `family_photo` (가족 사진)

| 항목 | 값 |
|------|-----|
| definitionId | `family_photo` |
| name | 가족 사진 |
| nameEn | Family Photo |
| type | `consumable` |
| subtype | `keepsake` (homeless worn_photo·engineer sketch_notebook과 공유, SCN_QUEST_homeless §6.1 신규 등록 검토 인용) |
| rarity | `common` |
| weight | 0.05 |
| defaultDurability | 1 |
| defaultContamination | 0 |
| icon | 👨‍👩‍👧‍👦 |
| description | "은평구 불광동 아내와 두 아이의 사진. 진입 전 항상 점퍼 안주머니에 챙겨 넣던 것. 손에 쥐면 다시 진입할 힘이 난다." |
| tags | `['consumable', 'keepsake', 'firefighter']` |
| onConsume | `{ morale: 10, fatigue: -3 }` |
| dismantle | `[]` (분해 불가, 가족은 부서지지 않음) |

**플레이버 어휘 근거:**
- "은평구 불광동" — `characters.js:161` story 직접 인용
- "아내와 두 아이" — `characters.js:161` story 직접 인용
- "진입 전" — `characters.js:159` story "먼저 진입했다" 정합 (구조대원 어휘)
- "점퍼 안주머니" — 구조대원 현장 어휘 (LORE 추가 후보)

### 6.2 4곳 등록 룰 (CLAUDE.md §3 + 협의서 v5 §4 가드레일)

**family_photo 신규 아이템에 4곳 등록 의무:**

| 등록처 | 항목 | 사양 |
|--------|------|------|
| 1. `js/data/items_misc.js` | 정의 추가 | §6.1 사양 그대로 (line 478 노숙자 전용 섹션 패턴 인용, "소방관 전용 아이템" 신규 섹션 또는 keepsake 공통 섹션) |
| 2. `js/data/stackConfig.js` | 스택 등록 | `['family_photo', false, 1]` (단일 아이템, 비stackable — worn_photo·sketch_notebook 패턴 정합) |
| 3. `js/data/districts.js` lootTable | 등장 구 | **미등록** (firefighter 전용 시작 아이템, lootTable 미진입으로 직업 정체성 보호) |
| 4. `js/ui/CardFactory.js` CARD_IMAGES | 이미지 매핑 | `'family_photo': 'assets/cards/family_photo.png'` 또는 기본 이모지 폴백 (👨‍👩‍👧‍👦) |

**기존 아이템 변경 0:**
- rope·hand_axe·instant_noodles·contaminated_water 정의 변경 없음
- firefighter startingItems 수량 변경 0 (rescue_kit 변경 0)
- 다른 직업 변경 0 (협의서 v5 §4 가드레일 정합)

---

## 7. 6 게이트 검수 (`DIR_GATE_chef_start_environment.md` 패턴)

### 7.1 Tier-2 ability `rescue_resolve` 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "구조의 결의" 어휘 + story "구조대원으로 먼저 진입했다" 정합 + weakness '가족 걱정 (사기)' 역설적 해소. abilities 4 영역(신체·의료·도구·자재) → 5 영역(정서·결의) 자연 확장 |
| (2) 생존 균형 | ✅ 통과 (R11-1 보호 정합) | K3 +0.1~0.3d 향상 추정 (R15-1 우회 보수화). chef 격차 정의 2 v10 +0.46d → v11 +0.36~0.40d 추가 좁힘 추정 (-0.06~-0.10d). **chef SCN_QUEST(K3 +0.7d 추정, 격차 +1.0d 회복 목표)에 의해 정의 2가 +1.0d 회복하면 본 firefighter 효과는 안전 범위 안.** R11-1 사전 등록 트리거 회피 정합 |
| (3) 플레이 유지 | ✅ 통과 | morale<30 회복 시 family_photo 1회 소비로 회복 → 구조 임무 루프 복귀 정합 |
| (4) 서사 결합 | ✅ 통과 | firefighter 메인 퀘스트 후속 연계 가능 ("은평구 집 도달" 모티프). NPC 결합 0 (본 PR 영역 외) |
| (5) 도구 호환 | ✅ 통과 | family_photo 4곳 등록 룰 §6.2 그대로. validate.js 통과 의무. fingerprint 영향 0 (BALANCE 미관여) |
| (6) 측정 가능성 | ✅ 통과 | baseline v11 probe 의무: firefighter day 1~5 morale 시계열 + family_photo 소비 회수 + actBoostMorale 발동 회수 |

**6 게이트 전수 통과.** → **통과.**

### 7.2 R11-1 chef 격차 보호 검토 (협의서 v5 §6.4 정합)

협의서 v5 §6.4 결정:
> M3 #19 PR14 + M3 #20 SCN_QUEST 3건 동시 진행 채택. 시나리오 한도연 단일 트랙으로 4 SCN_QUEST(chef·firefighter·soldier·pharmacist) 작성. R15-1 우회로 craft 발동 빈도 보수화.

**baseline v11 추정 (firefighter K3 5.0 → 5.1~5.3 + chef K3 5.2 → 5.7~6.0 합산):**

| 정의 | v10 측정 | v11 추정 (firefighter 단독) | v11 추정 (chef + firefighter 합산) | R11-1 트리거 |
|------|---------|----------------------------|--------------------------------|-------------|
| 정의 1 (6직업 평균) | +0.567d | +0.527~+0.547d (-0.02~-0.04d) | **+1.0~+1.5d** (chef 효과 우세) | ✅ 회복 |
| 정의 2 (cooking lv 0 5직업) | +0.46d | +0.40~+0.42d (-0.04~-0.06d) | **+0.7~+1.0d** (chef 효과 우세) | ✅ 회복 |

**핵심 단정:**
- **firefighter 단독으로는 격차 추가 좁힘 -0.04~-0.06d 수준 (보수적)** — R11-1 사전 등록 트리거 회피
- **chef + firefighter 합산 시 격차 +1.0d 회복** — chef SCN_QUEST의 K3 +0.7d 향상 효과가 우세
- 권고: firefighter Tier-2 사양 그대로 유지. chef SCN_QUEST K3 향상이 격차 회복 1차 목표 달성

### 7.3 family_photo 게이트

| 게이트 | 결과 |
|--------|------|
| (1) 직업 정체성 | ✅ "은평구 불광동"·"아내와 두 아이" 직접 인용. weakness '가족 걱정 (사기)' 역설 해소 |
| (2) 생존 균형 | ✅ morale +10는 worn_photo(+12)·sketch_notebook(+10) 동일 수준. 보수적 정합 |
| (3) 플레이 유지 | ✅ 1회 소비 → 즉시 morale 13 회복 → 회복 후 구조 임무 루프 복귀 |
| (4) 서사 결합 | ✅ firefighter 메인 퀘스트 후속 ("가족 재회" 모티프) |
| (5) 도구 호환 | ✅ 4곳 등록 룰 §6.2. lootTable 미등록 (직업 정체성 보호) |
| (6) 측정 가능성 | ✅ baseline v11 `actBoostMorale` 발동 분포에서 family_photo 소비 회수 측정 가능 |

**6 게이트 전수 통과.** → **통과.**

---

## 8. PR16 patch diff 후보

### 8.1 `js/data/characters.js` (line 163~192 영역, firefighter abilities)

```diff
     abilities: [
       {
         id: 'physical_conditioning',
         name: '체력 단련',
         icon: '💪',
         desc: '피로 감소 속도 -20%',
         effect: { fatigueDecay: -0.2 },
       },
       {
         id: 'rescue_technique',
         name: '구조 기술',
         icon: '🚑',
         desc: '의료 아이템 HP 회복 +20%',
         effect: { healBonus: 1.2 },
       },
       {
         id: 'tool_proficiency',
         name: '도구 숙련',
         icon: '🔨',
         desc: '제작 시 30% 확률로 재료 1개 절약',
         effect: { craftSaveChance: 0.3 },
       },
       {
         id: 'rescue_kit',
         name: '구조 키트',
         icon: '🎒',
         desc: '로프 추가 지급',
         effect: { startingItems: ['rope', 'hand_axe', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] },
       },
+      {
+        id: 'rescue_resolve',
+        name: '구조의 결의',
+        icon: '🚒',
+        desc: '가족·동료의 기억으로 사기 회복 +30%. 시작 시 가족 사진 지급.',
+        effect: {
+          moraleRecoveryBonus: 1.3,
+          startingItems: ['family_photo'],
+        },
+      },
     ],
```

**변경 라인:** 약 10라인 추가. 영향: `characters.js:163~202`.

### 8.2 `js/data/items_misc.js` (line 478 노숙자 전용 섹션 다음 또는 keepsake 공통 섹션)

신규 `family_photo` 정의 추가:

```diff
+  // ─── 소방관 전용 아이템 ────────────────────────────────────
+  // 박영철 시작 지급 아이템 — rescue_resolve ability 트리거 자원
+
+  family_photo: {
+    id: 'family_photo', name: '가족 사진', type: 'consumable', subtype: 'keepsake',
+    rarity: 'common', weight: 0.05,
+    defaultDurability: 1, defaultContamination: 0,
+    icon: '👨‍👩‍👧‍👦', description: '은평구 불광동 아내와 두 아이의 사진. 진입 전 항상 점퍼 안주머니에 챙겨 넣던 것. 손에 쥐면 다시 진입할 힘이 난다.',
+    tags: ['consumable', 'keepsake', 'firefighter'],
+    onConsume: { morale: 10, fatigue: -3 },
+    dismantle: [],
+  },
```

**변경 라인:** 약 11라인 추가.

### 8.3 `js/data/stackConfig.js` (노숙자/엔지니어 전용 섹션 다음)

```diff
   // — 엔지니어 전용 아이템 —
   ['sketch_notebook'           , false, 1 ],
+
+  // — 소방관 전용 아이템 —
+  ['family_photo'              , false, 1 ],
```

**변경 라인:** 3라인 추가 (섹션 헤더 2줄 + 등록 1줄).

### 8.4 `js/ui/CardFactory.js` CARD_IMAGES

시스템 백승호 위임 — `family_photo` 이미지 매핑 추가 (기본 이모지 폴백 가능).

### 8.5 검증 명령

```
node --input-type=module js/data/validate.js
# 기대: Errors 0 / ALL CLEAR

node tools/sim/v2/run_baseline.mjs
# 기대: fingerprint len316-h242a5b5f 유지 (BALANCE 미변경 단정 — items 정의 추가는 BALANCE 미관여)
#       buildTag sim-baseline-v11-pr16
#       firefighter K3 v10 5.00 → v11 5.10~5.30 추정 (R15-1 우회 보수화)
#       firefighter 절망 사망 v10 11 → v11 5~8 추정 (-3~-6건)
```

### 8.6 PR16 patch diff 총 라인 수 추정 (firefighter 단독)

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +10 |
| items_misc.js | +11 (family_photo 신규) |
| stackConfig.js | +3 (섹션 헤더 + 등록) |
| CardFactory.js | +1 (이미지 매핑) |
| **합계** | **+25 (총 ~25 변경)** |

---

## 9. baseline v11 측정 트리거 (보수적 K3 추정)

### 9.1 의무 probe (firefighter 단독)

| probe | 측정 대상 | 합격 기준 (R15-1 우회 보수화) |
|-------|----------|------------------------------|
| 1. firefighter K3 | mean·median 사망일 | v10 5.00 → v11 ≥ 5.10 (+0.10d 이상, R15-1 우회 보수화) |
| 2. firefighter 절망 사망 | K5 deathCause 절망 count | v10 11 → v11 ≤ 8 (-3 이상) |
| 3. firefighter morale<30 도달율 | runs[*] morale 시계열 day 1~5 | day 5 도달율 ≤ 50% (v10 측정 미존재이나 절망 11건 정합으로 추정) |
| 4. firefighter `actBoostMorale` 발동 회수 | playerAI.mjs 분기 발동 분포 | family_photo 소비 발동 ≥ 5/100 (절망 진입 회차 한정) |
| 5. family_photo 소비 회수 | inventory 차감 추적 | 1회/회차 (defaultDurability 1) |
| 6. chef 격차 정의 2 | chef vs cooking lv 0 5직업 평균 | **chef + firefighter 합산 시 +0.7~+1.0d 회복 추정** (chef SCN_QUEST의 K3 +0.7d 효과 우세) |
| 7. fingerprint | drift.balanceLeafTotal hash | `len316-h242a5b5f` 유지 (BALANCE 미관여) |
| 8. validate.js | items.js / blueprints.js / stackConfig.js 정합 | Errors 0 / ALL CLEAR |

### 9.2 K3 향상 추정 (R15-1 우회 보수화)

baseline v10 firefighter K3 5.00 → v11 추정:
- **R15-1 우회 보수화 적용:** PR15 실측 패턴(homeless +0.1d, engineer +0.1d) 정합 → firefighter +0.1d 보수
- moraleRecoveryBonus 1.3 (homeless 1.5보다 -0.2 보수) → effect 수치 차이 추가 -0.05d 추정
- **추정 v11 K3 = 5.10~5.30 (Δ +0.1~0.3d)**

### 9.3 chef SCN_QUEST 합산 효과 (위협 평가)

| 직업 | v10 K3 | v11 K3 추정 | v11 day 100 도달 |
|------|--------|------------|----------------|
| chef | 5.20 | 5.7~6.0 (chef SCN_QUEST 효과 우세) | 0~3건 (chef 격차 회복 1차 목표) |
| **firefighter** | **5.00** | **5.10~5.30** (R15-1 우회 보수화) | 0~2건 (보수적) |
| 합산 (chef + 3직업) | - | - | **chef 격차 정의 2 +0.7~+1.0d 회복** (chef SCN_QUEST 효과 우세) |

**핵심 단정:** firefighter K3 +0.1~0.3d는 chef 격차 추가 좁힘 -0.04~-0.06d 수준. chef SCN_QUEST의 K3 +0.7d 효과가 격차 +1.0d 회복을 담당. **R11-1 사전 등록 트리거 회피 정합.**

---

## 10. 위험과 완화

### 10.1 firefighter K3 +0.3d 초과 (격차 추가 좁힘 위험)

**트리거:** baseline v11 측정에서 firefighter K3 ≥ 5.4 (Δ ≥ +0.4d). chef 격차 정의 2 추가 좁힘 -0.08d 이상.
**완화:**
- (a) `moraleRecoveryBonus` 1.3 → 1.2 하향 (격차 추가 좁힘 폭 축소)
- (b) `family_photo` `onConsume.morale` 10 → 8 하향
- 권고: (a) 우선 — PR15 enumerate 필드 직접 조정. effect 값 범위 가드레일(×1.2~×1.8) 안 유지

### 10.2 family_photo 1회 소비 후 회복 수단 부재

**트리거:** day 4~5 family_photo 소비 후 morale 재침식 (homeless·engineer day 4~5 재진입 패턴 정합).
**완화:** 본 PR16은 보수적 사양(K3 +0.1~0.3d). firefighter 절망 사망 11건만 도달이라 day 4~5 재진입 영향 작음. baseline v11 측정 결과 재진입율 50% 초과 시 후속 PR에서 defaultDurability 1 → 2 검토.

### 10.3 R15-1 우회 실패 (실측 +0.1d 미달)

**트리거:** baseline v11 측정에서 firefighter K3 +0.1d 미달 (예: +0.05d).
**완화:** 협의서 v5 §10.3 R15-1 우회 실패 폴백 트리거 정합. PR17 craft 발동 빈도 보강 트랙 진입 (시스템 백승호 위임). 단 firefighter는 craft 영역 ability 미보유라 R15-1 영향 직접 받지 않음 — moraleRecoveryBonus는 onConsume 가산이라 PR15 enumerate 정합

### 10.4 신규 subtype `keepsake` 의존

**트리거:** items.js 검증에서 `subtype: 'keepsake'` 미등록 경고 (homeless worn_photo·engineer sketch_notebook과 공유).
**완화:** SCN_QUEST_homeless §10.4 / SCN_QUEST_engineer §10.4 위임 트리거와 동일. 시스템 백승호 `keepsake` 신규 등록 결정 후 family_photo도 동일 subtype 사용. 시스템 백승호 위임 결과에 따라 `subtype: 'comfort'` 대체 가능

### 10.5 ability effect 필드 충돌 (homeless street_solace와 동일 필드)

**트리거:** `moraleRecoveryBonus` 필드를 homeless·firefighter 양 직업 ability가 보유. sim 가산 분기 적용 정합 검증 의무.
**완화:** PR15 `_applyAbilityBonusesToConsume` 함수 (시스템 백승호 1차 단정 인용)는 `GameState.player.moraleRecoveryBonus` 단일 값 가산. firefighter도 동일 분기 발동 단정. 단 직업 ability effect 값 차이(homeless 1.5 vs firefighter 1.3)는 별도 GameState 초기화에서 ability별 값으로 반영 — 시스템 백승호 검증 의무

---

## 11. 결정 단언

| 항목 | 결정 |
|------|------|
| Tier-2 ability `rescue_resolve` 신설 | **통과** (6 게이트 전수 통과) |
| 신규 아이템 `family_photo` 도입 | **통과** (6 게이트 전수 통과) |
| `moraleRecoveryBonus: 1.3` (homeless 1.5보다 보수적) | **통과** (R15-1 우회 보수화 정합) |
| startingItems 6 → 7 확장 | **통과** (보수적 균형 정합) |
| 4곳 등록 룰 적용 | **통과** (family_photo 4곳 신규) |
| R11-1 chef 격차 보호 | **통과** (단독 -0.04~-0.06d, chef SCN_QUEST 합산 시 +1.0d 회복 정합) |
| PR16 패치 diff 총 변경량 (firefighter 단독) | ~25라인 (characters.js +10 / items_misc.js +11 / stackConfig.js +3 / CardFactory.js +1) |
| 다음 트리거 | 시스템 백승호 PR16 머지 (chef + 3직업 합산 또는 분리) → baseline v11 측정 (밸런스 권지나) → R11-1 해소 단정 + firefighter K3 +0.1~0.3d 단정 |

---

*문서 끝. baseline v11 측정 결과 도착 시 §9.1 probe 검증 + R11-1 해소 단정 + chef + firefighter·soldier·pharmacist 4 SCN_QUEST 합산 효과 단정. R15-1 우회 보수화 정합 검증 의무.*
