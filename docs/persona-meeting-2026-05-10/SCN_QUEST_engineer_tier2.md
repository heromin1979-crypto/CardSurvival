# 시나리오 — engineer Tier-2 abilities + morale 회복 자원 분배

> 작성: 시나리오 한도연 / 2026-05-11
> 대상: `js/data/characters.js:337~397` engineer (정대한)
> 트리거: 협의서 v4 `PD_BAL_MEETING_PR11_decision.md` §13.4 + §13.7 §1순위 — R10-1 폭증 4.6배 + R8-1 원인 2 단정 결합
> 결정: **통과** — Tier-2 ability `workshop_focus` (작업 몰입) 신설 + 신규 morale 회복 아이템 `sketch_notebook` 도입 + `wire` 작업 트리거 morale 가산 + startingItems 확장
> 선행: `SCN_PR_chef_knife_mastery.md` (M2 chef startingItems 추가 패턴), `DIR_GATE_chef_start_environment.md` (Director 6 게이트 검수 패턴), `SCN_QUEST_homeless_tier2.md` (병행 산출물 — homeless Tier-2 동일 구조)

---

## 1. 서두 — R8-1·R10-1 측정 사실 인용

### 1.1 baseline v8 측정 사실 (실측 인용)

`BAL_SIM_baseline_v8_report.md` §5.2:
> **engineer 절망 +71건 (6 → 77)** 폭증 — 사망일 day 3 → day 4(+1.30d)로 morale 침식 시간 +1 TP_PER_DAY=72 누적. R8-1 미해소 상태에서 K3 연장이 절망으로 직결
>
> engineer v8 K5: 절망 77 / 아사 23 (v7 아사 94 / 절망 6 → 절망 +71)

`PD_BAL_MEETING_PR11_decision.md` §12.4 (R8-1 원인 단정):
> homeless·engineer day 2 morale **12~13** 급락 — 회복 자원 부재. R8-1 **원인 2 단정**

**engineer의 핵심성:** baseline v8 절망 폭증의 **최대 가속 직업** (Δ+71건, doctor Δ+70건과 동률). T1 모사 효과 +1.30d로 K3 연장 → morale 침식 시간 확보 → 절망 사망 직결. R8-1 해소 없이는 K3 향상이 절망 사망 가속과 등가.

### 1.2 engineer startInv 분석 (`characters.js:386`)

```js
effect: { startingItems: ['scrap_metal', 'wire', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] }
```

6 아이템 / `onConsume.morale > 0` 0건:
- `scrap_metal`: `material/metal` → onConsume 없음 (제작 재료)
- `wire`: `material/metal` → onConsume 없음 (제작 재료)
- `instant_noodles` ×2: onConsume.morale 0
- `contaminated_water` ×2: onConsume.morale 0

`tools/sim/v2/playerAI.mjs:241~254` `actBoostMorale` 분기 발동률 0% 단정 (homeless와 동일 메커니즘).

### 1.3 homeless 대비 engineer 특수성

| 항목 | homeless | engineer |
|------|----------|----------|
| startInv 수 | 8 (PR8 보강 후) | **6** (homeless 대비 2개 적음) |
| 정체성 회복 메커니즘 | 거리에서 익힌 정서 위안 | **작업·창의 몰입** |
| morale 회복 어휘 | "사진"·"잠자리"·"신문지" | **"설계도"·"부품"·"작업"** (LORE_GLOSSARY 인용 §2.1) |
| 시작 직업 dangerLevel | gwangjin 2 | **yongsan 3** (위험 구역) |
| hasFishing | false | **true** (yongsan, PR12 영향) |
| cookingLv | 3 (T1 차단) | **0** (T1 진입 → K3 +1.30d) |

engineer는 *위험 구역 시작* + *cooking lv 0* + *startInv 가장 적음* — R8-1 해소 우선순위가 homeless와 동률. **PR13 단일 트랙에 homeless·engineer 동시 진입 의무.**

---

## 2. 정체성 분석 — engineer 어휘·플레이버

### 2.1 LORE_GLOSSARY 인용 (`LORE_GLOSSARY.md:60`)

| 직업 | 어휘 톤 |
|------|---------|
| engineer | **점검, 부품, 누전, 폐쇄회로, 작업지시서, 정비기록** |

### 2.2 story·goal 인용 (`characters.js:353~358`)

> 정대한(35세)은 성수동 소규모 금속 가공 공장의 기술 이사였다.
> 세상이 무너진 날, 성수동에서 용산 전자상가로 이동해 부품을 확보했다.
> **머릿속으로 계산했다. 경유 120리터. 1일 최소 가동 시 15일치.**
> **하루하루 줄어드는 연료통을 보며 그는 설계도를 그리기 시작했다.**
> 연료 없이도 달릴 수 있는 무언가. 아니면 연료를 찾을 수 있는 탈것.

> goal: scrap_metal 8개·rope 3개를 수집해 이동 수단을 제작하고 서울 외곽 탈출 루트를 개척한다.

핵심: **"설계도를 그리기 시작했다"** + **"머릿속으로 계산했다"** — 회복력의 원천이 *몰입* + *설계 행위 자체*. 정체성 정합 어휘 후보:
- "설계도 노트" — story "설계도를 그리기 시작했다" 직접 인용
- "정비기록" — LORE_GLOSSARY 어휘 직접 인용
- "작업 몰입" — 부품 손질 행위가 회복 트리거

### 2.3 기존 abilities 4종 (`characters.js:359~388`)

| ID | 이름 | effect |
|----|------|--------|
| engineering_intuition | 공학적 직관 | craftSuccessBonus +0.30 |
| dismantle_expert | 분해 전문가 | dismantleExtraItem +1 |
| structure_reinforcement | 구조물 강화 | structureDurabilityBonus 1.5 |
| factory_materials | 공장 자재 | startingItems 6개 |

**관찰:** 4 abilities 모두 **제작·분해·구조물** 영역. **morale·정서** 영역 ability 0건. homeless와 동일하게 R8-1 원인 단정 정합. Tier-2 ability는 "엔지니어 = 작업 몰입으로 정서 유지" 보강 방향 필요.

---

## 3. Tier-2 ability 사양 — `workshop_focus` (작업 몰입)

### 3.1 사양

| 항목 | 결정값 |
|------|--------|
| id | `workshop_focus` |
| name | 작업 몰입 |
| nameEn | Workshop Focus |
| icon | 🔧 |
| desc | "제작·분해·정비 행위로 사기 회복 (1회당 +5). 설계도 노트 소비 시 사기·피로 동시 회복. 사기 30 미만 회복 시 추가 효과 없음." |
| effect | `{ moraleOnCraft: 5, moraleOnDismantle: 5, sketchNotebookBonus: true }` |

### 3.2 정체성 정합

- **어휘:** "작업 몰입" — LORE_GLOSSARY engineer 어휘 "점검·부품·작업지시서" 정합 + story "설계도를 그리기 시작했다" 정합
- **플레이버:** "머릿속으로 계산했다" → 제작·분해 행위 자체가 정서 회복 메커니즘. 영웅적 회복(약물)이 아닌 *몰입형 회복*
- **abilities 4 → 5 확장 정합:** 제작(engineering_intuition) + 분해(dismantle_expert) + 구조물(structure_reinforcement) + 자재(factory_materials) → 정서·몰입(workshop_focus) — 시야 균형
- **homeless `street_solace` 대비 차별성:**
  - homeless: 소비형 회복 (worn_photo·newspaper_bundle 1회 소비)
  - engineer: **행위형 회복** (craft·dismantle 행위마다 +5 가산, 소비형은 sketch_notebook 1개)
  - → 직업 정체성 차별화 정합 (homeless 마모된 회복 vs engineer 몰입형 회복)
- **chef·pharmacist abilities 어휘 패턴 비교:**
  - chef `gourmet_sense` cookingEffectBonus 1.6 — 행위 기반 효과
  - pharmacist `compounding` craftSuccessBonus +0.20 — 행위 기반 효과
  - → engineer `workshop_focus` 행위 기반 morale 회복 동일 패턴 정합

### 3.3 effect 수치 근거

- `moraleOnCraft: 5` — craft 1회 발동 시 morale +5 (chef `dried_mushroom` morale +5 수준, line 1028)
- `moraleOnDismantle: 5` — dismantle 1회 발동 시 morale +5. engineer `dismantle_expert` 기존 ability와 결합 시너지
- `sketchNotebookBonus: true` — sketch_notebook 소비 시 +morale·+fatigue 가산 트리거 (시스템 백승호 위임, §10.3)
- **발동 횟수 추정:** baseline v8 engineer day 1~4 craft·dismantle 발동 평균 4~6회 추정 → morale +20~30 회복 가능. day 2 morale 13 → day 3 morale 33~43 (actBoostMorale 분기 해제)

### 3.4 기존 abilities와의 관계

`engineering_intuition` (craftSuccessBonus +0.30) + `workshop_focus` (moraleOnCraft +5) → **제작 행위 1회당 2개 ability 동시 발동.** 시너지 정합. 단 `dismantle_expert` (dismantleExtraItem +1) + `workshop_focus` (moraleOnDismantle +5)는 **분해 행위 단일 트리거에 2개 ability 동시 발동** — 시스템 백승호 구현 시 분기 충돌 검증 의무.

---

## 4. morale 회복 자원 결정 (후보 비교 + 권고)

### 4.1 후보 매트릭스

| 후보 | 변경 위치 | morale 회복량 | 정체성 정합 | 4곳 등록 룰 | K3 향상 추정 |
|------|-----------|---------------|-------------|-------------|--------------|
| A | 신규 `sketch_notebook` (설계도 노트) 도입 | +10 (+3 ×3회 사용) | ⭐⭐⭐⭐ (story "설계도를 그리기 시작했다" 직접 인용) | 4곳 신규 등록 의무 | +0.7~1.2d |
| B | 신규 `radio_handset` (휴대 무전기) 도입 | +8 | ⭐⭐⭐ ("폐쇄회로" 어휘 정합, 외부 연결 시도) | 4곳 신규 등록 의무 | +0.5~0.8d |
| C | `workshop_focus` 행위형 회복 (craft·dismantle morale +5) | 1회당 +5 (4~6회 발동 추정 +20~30) | ⭐⭐⭐⭐⭐ (engineer 정체성 본질) | 미적용 (ability effect) | +0.8~1.3d |
| D | `scrap_metal` onConsume.morale 부여 | +2 (소비형) | ⭐ (재료 소비는 제작 불가화) | 미적용 (기존 등록) | 거절 (재료 의미 충돌) |
| E | `wire` 작업 트리거 morale +1 | n/a | ⭐⭐ (재료 본질 변화) | 미적용 | 거절 (재료 의미 흐림) |

### 4.2 권고: **A + C 병행 채택 (B 보류)**

**근거:**

1. **C 단독 (행위형 회복)**: craft·dismantle 발동 4~6회 추정 → morale +20~30 회복. 사망 직전 단일 회복은 약함. 평균 회복은 강함
2. **A 단독 (sketch_notebook)**: 1회 소비 +10, defaultDurability 3 부여 시 3회 사용 가능 → 누적 +30 회복. 단일 소비 의존 위험
3. **A + C 병행**: sketch_notebook 1회 소비 (+10) + craft 발동 (+5) + dismantle 발동 (+5) → day 2 morale 13 → +20 = 33 (actBoostMorale 분기 해제). day 3 이후 craft·dismantle 누적 회복으로 morale 유지
4. **B (radio_handset) 보류** — 정체성 정합 강하나 후속 PR14에서 NPC 연결 시스템과 결합 시 더 적합. 본 PR13 영역 외
5. **D 거절** — scrap_metal은 engineer goal ("scrap_metal 8개 수집") 핵심 재료. onConsume 부여로 소비되면 제작 경로 차단. 직업 정체성 충돌
6. **E 거절** — wire 재료 본질을 ability effect로 가산하려면 시스템 분기 추가 복잡화. workshop_focus moraleOnCraft가 등가 효과 제공

### 4.3 양적 검증 (baseline v8 morale 시계열 추정 → v9 추정)

| 시점 | morale (v8 측정) | morale (v9 추정 with A+C+Tier-2) |
|------|------------------|----------------------------------|
| day 1 시작 | 100 | 100 |
| day 1 craft·dismantle 발동 ~2회 | n/a | +10 (morale 100 cap 유지) |
| day 2 (decay 후) | **13** | 13 (decay 동일) |
| day 2 actBoostMorale | 미발동 (재료 0) | **sketch_notebook 소비 → morale +10 = 23 → craft 발동 +5 = 28** |
| day 2 추가 craft·dismantle | n/a | +5 (morale 33 도달, actBoostMorale 분기 해제) |
| day 3 (decay 후) | ~3 (사망 임박) | ~23 (craft·dismantle 누적 회복) |
| day 3 actBoostMorale | 미발동 | sketch_notebook 잔여 사용 (defaultDurability 3 시 2회 잔존) +10 = 33 |
| day 4~5 | 사망 (절망) | sketch_notebook 잔여 1회 +10 + craft·dismantle 누적 → morale 30~50 유지 |

**추정 K3 향상:** +0.9~1.4d (engineer v8 4.4 → v9 5.3~5.8), R8-1 원인 2 해소 정합.

---

## 5. startingItems 사양

### 5.1 현행 (`characters.js:386`)

```js
effect: { startingItems: ['scrap_metal', 'wire', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] }
```

6 아이템 / `onConsume.morale > 0` 0건.

### 5.2 정정 (PR13 후보)

```js
// factory_materials (기존, 묘사 갱신)
effect: { startingItems: ['scrap_metal', 'scrap_metal', 'wire', 'wire', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] }

// workshop_focus (신규, Tier-2)
effect: { moraleOnCraft: 5, moraleOnDismantle: 5, sketchNotebookBonus: true, startingItems: ['sketch_notebook'] }
```

**변경 요약:**
- `scrap_metal` 1→2개 (engineer goal "scrap_metal 8개" 달성 가속 정합)
- `wire` 1→2개 (제작 행위 빈도 ↑ → workshop_focus moraleOnCraft 발동 ↑)
- `sketch_notebook` 1개 신규 추가 (Tier-2 ability에 startingItems 배치)
- 합계 6 → **9 아이템** (homeless 10 / chef 5+1=6 / engineer 9 — 시작 자원 균형 정합)

---

## 6. 신규 아이템 정의 + 4곳 등록 룰

### 6.1 신규 — `sketch_notebook` (설계도 노트)

| 항목 | 값 |
|------|-----|
| definitionId | `sketch_notebook` |
| name | 설계도 노트 |
| nameEn | Sketch Notebook |
| type | `consumable` |
| subtype | `keepsake` (homeless worn_photo와 동일 subtype, 신규 어휘) |
| rarity | `common` |
| weight | 0.15 |
| defaultDurability | 3 (3회 사용 가능 — 정비기록 LORE 어휘 정합) |
| defaultContamination | 0 |
| icon | 📓 |
| description | "성수동 공장에서 가져온 설계도 노트. 연료 없는 탈것 스케치가 빼곡하다. 손을 움직이는 동안에는 두려움이 잠시 멀어진다." |
| tags | `['consumable', 'keepsake', 'engineer']` |
| onConsume | `{ morale: 10, fatigue: -5 }` |
| dismantle | `[{ definitionId: 'paper', qty: 1, chance: 0.8 }]` (분해 시 paper 산출 — engineer 재료 정합) |

**플레이버 어휘 근거:**
- "성수동 공장" — `characters.js:353` story 직접 인용
- "연료 없는 탈것 스케치" — `characters.js:356~357` story "연료 없이도 달릴 수 있는 무언가" 정합
- "손을 움직이는 동안에는 두려움이 잠시 멀어진다" — engineer 행위형 회복 정체성 직접 표현

### 6.2 4곳 등록 룰 (CLAUDE.md §3)

**sketch_notebook 신규 아이템에 4곳 등록 의무:**

| 등록처 | 항목 | 사양 |
|--------|------|------|
| 1. `js/data/items_misc.js` 또는 `items_tools.js` | 정의 추가 | §6.1 사양 그대로. 신규 섹션 "엔지니어 전용 아이템" 추가 또는 기존 노숙자 전용 섹션 패턴 인용 (line 478) |
| 2. `js/data/stackConfig.js` | 스택 등록 | `['sketch_notebook', false, 1]` (단일 아이템, 비stackable — worn_photo 패턴 정합) |
| 3. `js/data/districts.js` lootTable | 등장 구 | **미등록** (engineer 전용 시작 아이템, lootTable 미진입으로 직업 정체성 보호) |
| 4. `js/ui/CardFactory.js` CARD_IMAGES | 이미지 매핑 | `'sketch_notebook': 'assets/cards/sketch_notebook.png'` 또는 기본 이모지 폴백 (📓) |

**기존 아이템 변경 0:**
- scrap_metal·wire·instant_noodles·contaminated_water 정의 변경 없음
- engineer startingItems 수량 변경만 (characters.js 한 곳)

---

## 7. 6 게이트 검수 (`DIR_GATE_chef_start_environment.md` 패턴)

### 7.1 Tier-2 ability `workshop_focus` 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "작업 몰입" 어휘 + LORE_GLOSSARY "점검·작업지시서" 정합 + story "설계도를 그리기 시작했다" 정합. abilities 4 영역(제작·분해·구조물·자재) → 5 영역(정서·몰입) 자연 확장 |
| (2) 생존 균형 | ✅ 통과 (R11-1 모니터링) | K3 +0.9~1.4d 향상 추정. chef 격차 정의 2 v8 +0.60d → v9 +0.45~-0.20d 추정 (§7.2 R11-1 액션 트리거 발동 위험 임계). engineer는 cooking lv 0 5직업 포함 → 격차 정의 2 직접 영향 |
| (3) 플레이 유지 | ✅ 통과 | craft·dismantle 행위마다 morale +5 가산이 게임 루프(채집→제작→탐색) 보강. 회복을 위해 별도 휴식 카드 진입 불요 — engineer 정체성 정합 |
| (4) 서사 결합 | ✅ 통과 | `engineer/branch_a.js`·`branch_b.js` 메인 퀘스트에 "설계도 노트" 모티프 후속 연계 가능 (시나리오 한도연 후속 트랙). engineer goal "이동 수단 제작"과 sketch_notebook 직접 결합 |
| (5) 도구 호환 | ✅ 통과 | sketch_notebook 4곳 등록 룰 §6.2 그대로. validate.js 통과 의무. fingerprint 영향 0 (BALANCE 미관여) |
| (6) 측정 가능성 | ✅ 통과 | baseline v9 probe 의무: engineer day 1~5 morale 시계열 + craft·dismantle 발동 회수 + sketch_notebook 소비 회수 + actBoostMorale 발동 회수 |

**6 게이트 5/6 통과 + 1/6 모니터링 (R11-1).** → **통과 (R11-1 임계 모니터링 의무).**

### 7.2 R11-1 chef 격차 보호 검토

협의서 v4 §13.2 R11-1 신규 등록 인용:
> chef K3 < 5.0 후퇴 또는 격차 +0.5d 미만 추가 좁힘 시 액션 트리거 발동

**baseline v9 추정 (engineer K3 4.4 → 5.3~5.8 + homeless K3 4.2 → 5.2~5.7 합산):**

| 정의 | v8 측정 | v9 추정 (engineer Tier-2 단독) | v9 추정 (engineer + homeless Tier-2 합산) | R11-1 트리거 |
|------|---------|-------------------------------|-------------------------------------------|-------------|
| 정의 1 (6직업 평균) | chef 5.20 / others6 4.52 / gap +0.68d | chef 5.20 / others6 ~4.67 / gap **+0.53d** | chef 5.20 / others6 ~4.83 / gap **+0.37d** | ❌ **+0.5d 임계 깨짐** (합산 시) |
| 정의 2 (5직업 cooking lv 0) | chef 5.20 / others5 4.60 / gap +0.60d | chef 5.20 / others5 ~4.78 / gap **+0.42d** | chef 5.20 / others5 ~4.78 / gap **+0.42d** (homeless 비포함) | ❌ **+0.5d 임계 깨짐** |

**핵심 단정:**
- **engineer Tier-2 단독으로도 정의 2 +0.5d 임계 깨짐** (+0.42d 추정)
- **engineer + homeless 합산 시 정의 1·2 동시 임계 깨짐** (+0.37d / +0.42d)
- **R11-1 액션 트리거 발동 임박** — chef 정체성 강화 트랙 진입 의무 (§9.5)
- **권고:** baseline v9 측정 결과 정의 2 +0.5d 미만 확정 시 chef 정체성 강화 트랙 즉시 진입. PR13 머지 자체는 진행 (R8-1 해소가 우선) — R11-1 액션은 후속 PR14로 분리

### 7.3 sketch_notebook 게이트

| 게이트 | 결과 |
|--------|------|
| (1) 직업 정체성 | ✅ "성수동 공장"·"연료 없는 탈것" 직접 인용. engineer goal 직결 |
| (2) 생존 균형 | ✅ morale +10는 worn_photo(+12) 대비 보수적. defaultDurability 3으로 3회 사용 가능, 누적 +30 |
| (3) 플레이 유지 | ✅ 3회 사용 후 dismantle로 paper 1개 산출 가능 — engineer 재료 회수 정합 |
| (4) 서사 결합 | ✅ engineer 메인 퀘스트 잠재 후크 ("설계도 완성" 등 후속 시나리오 트랙) |
| (5) 도구 호환 | ✅ 4곳 등록 룰 §6.2. lootTable 미등록 (직업 정체성 보호) |
| (6) 측정 가능성 | ✅ baseline v9 `actBoostMorale` 발동 분포에서 sketch_notebook 소비 회수 측정 가능 |

**6 게이트 전수 통과.** → **통과.**

---

## 8. PR13 패치 diff 후보

### 8.1 `js/data/characters.js` (line 359~388 영역, engineer abilities)

```diff
     abilities: [
       {
         id: 'engineering_intuition',
         name: '공학적 직관',
         icon: '⚙️',
         desc: '제작 성공률 +30%, 제작 속도 -20%',
         effect: { craftSuccessBonus: 0.3 },
       },
       {
         id: 'dismantle_expert',
         name: '분해 전문가',
         icon: '🔩',
         desc: '분해 시 재료 +1개 추가 획득',
         effect: { dismantleExtraItem: 1 },
       },
       {
         id: 'structure_reinforcement',
         name: '구조물 강화',
         icon: '🏗️',
         desc: '구조물 카드 최대 내구도 +50%',
         effect: { structureDurabilityBonus: 1.5 },
       },
       {
         id: 'factory_materials',
         name: '공장 자재',
         icon: '🎒',
-        desc: '고철, 전선 추가 지급',
-        effect: { startingItems: ['scrap_metal', 'wire', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] },
+        desc: '고철 2개·전선 2개 추가 지급. 성수동 공장의 자투리.',
+        effect: { startingItems: ['scrap_metal', 'scrap_metal', 'wire', 'wire', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] },
       },
+      {
+        id: 'workshop_focus',
+        name: '작업 몰입',
+        icon: '🔧',
+        desc: '제작·분해 행위 1회당 사기 +5 회복. 설계도 노트 소비 시 사기·피로 동시 회복. 시작 시 설계도 노트 지급.',
+        effect: {
+          moraleOnCraft: 5,
+          moraleOnDismantle: 5,
+          sketchNotebookBonus: true,
+          startingItems: ['sketch_notebook'],
+        },
+      },
     ],
```

**변경 라인:** 약 12라인 추가 + 2라인 수정. 영향: `characters.js:359~400`.

### 8.2 `js/data/items_misc.js` (line 478 노숙자 전용 섹션 다음, 또는 신규 "엔지니어 전용 아이템" 섹션)

신규 `sketch_notebook` 정의 추가:

```diff
+  // ─── 엔지니어 전용 아이템 ──────────────────────────────────
+  // 정대한 시작 지급 아이템 — workshop_focus ability 트리거 자원
+
+  sketch_notebook: {
+    id: 'sketch_notebook', name: '설계도 노트', type: 'consumable', subtype: 'keepsake',
+    rarity: 'common', weight: 0.15,
+    defaultDurability: 3, defaultContamination: 0,
+    icon: '📓', description: '성수동 공장에서 가져온 설계도 노트. 연료 없는 탈것 스케치가 빼곡하다. 손을 움직이는 동안에는 두려움이 잠시 멀어진다.',
+    tags: ['consumable', 'keepsake', 'engineer'],
+    onConsume: { morale: 10, fatigue: -5 },
+    dismantle: [{ definitionId: 'paper', qty: 1, chance: 0.8 }],
+  },
```

**변경 라인:** 약 12라인 추가.

### 8.3 `js/data/stackConfig.js`

노숙자 전용 섹션(line 236~241) 또는 엔지니어 신규 섹션에 추가:

```diff
   // — 노숙자 전용 아이템 —
   ['battered_can'              , false, 1 ],
   ['old_blanket'               , false, 1 ],
   ['newspaper_bundle'          , true,  5 ],
   ['box_cutter'                , false, 1 ],
   ['broken_bottle'             , true,  3 ],
+  ['worn_photo'                , false, 1 ],   // (SCN_QUEST_homeless_tier2.md 병행 등록)
+
+  // — 엔지니어 전용 아이템 —
+  ['sketch_notebook'           , false, 1 ],
```

**변경 라인:** 4라인 추가 (homeless 1줄 포함, 단독 1줄 + 섹션 헤더 1줄).

### 8.4 `js/ui/CardFactory.js` CARD_IMAGES

시스템 백승호 위임 — `sketch_notebook` 이미지 매핑 추가 (기본 이모지 폴백 가능).

### 8.5 검증 명령

```
node --input-type=module js/data/validate.js
# 기대: Errors 0 / ALL CLEAR

node tools/sim/v2/run_baseline.mjs
# 기대: fingerprint len316-h242a5b5f 유지 (BALANCE 미변경 단정)
#       buildTag sim-baseline-v9-pr13
#       engineer K3 v8 4.4 → v9 5.3~5.8 추정
#       engineer 절망 사망 v8 77 → v9 15~35 추정 (R8-1 해소)
```

### 8.6 PR13 patch diff 총 라인 수 추정 (engineer 단독)

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +12 / -2 |
| items_misc.js | +12 (sketch_notebook 신규) |
| stackConfig.js | +3 (sketch_notebook + 섹션 헤더 2줄) |
| CardFactory.js | +1 (이미지 매핑) |
| **합계** | **+28 / -2 (총 ~30 변경)** |

### 8.7 homeless + engineer 합산 PR13 총 라인 수

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +23 / -4 (homeless +11 + engineer +12) |
| items_misc.js | +24 / -3 (newspaper_bundle 갱신 +3, worn_photo +9, sketch_notebook +12) |
| stackConfig.js | +5 (worn_photo 1줄, sketch_notebook 1줄, engineer 섹션 헤더 2줄, 빈줄 1줄) |
| CardFactory.js | +2 (worn_photo + sketch_notebook 이미지 매핑) |
| **합계** | **+54 / -7 (총 ~60 변경)** |

---

## 9. baseline v9 측정 트리거 (K3 향상·morale<30 도달율·R11-1 검증)

### 9.1 의무 probe (engineer 단독)

| probe | 측정 대상 | 합격 기준 |
|-------|----------|----------|
| 1. engineer K3 | mean·median 사망일 | v8 4.4 → v9 ≥ 5.2 (+0.8d 이상) |
| 2. engineer 절망 사망 | K5 deathCause 절망 count | v8 77 → v9 ≤ 35 (-42 이상) |
| 3. engineer morale<30 도달율 | runs[*] morale 시계열 day 1~5 | v8 100/100 → v9 ≤ 70/100 |
| 4. engineer `actBoostMorale` 발동 회수 | playerAI.mjs 분기 발동 분포 | v8 0/100 → v9 ≥ 80/100 (sketch_notebook 소비) |
| 5. sketch_notebook 소비 회수 + 잔여 사용 회수 | inventory durability 추적 | sketch_notebook 1~3회 사용/회 |
| 6. craft·dismantle 발동 회수 + workshop_focus morale 가산 누적 | playerAI.mjs craft·dismantle 분기 + morale delta | engineer day 1~4 craft 2~4회 + dismantle 1~2회 추정 |
| 7. chef 격차 정의 2 | chef vs cooking lv 0 5직업 평균 | **+0.42d 추정. R11-1 +0.5d 임계 깨짐 단정** → chef 정체성 강화 트랙 진입 트리거 |
| 8. fingerprint | drift.balanceLeafTotal hash | `len316-h242a5b5f` 유지 |
| 9. validate.js | items.js / blueprints.js / stackConfig.js 정합 | Errors 0 / ALL CLEAR |

### 9.2 K1 향상 추정

baseline v8 K1 0% (engineer 0/100). v9 추정:
- engineer K3 5.3~5.8 도달 시 day 100 도달 0~5건 가능
- K1 0~5% 추정. **K1 ≥ 5% 도달 미보장 (engineer 단독)**

### 9.3 homeless + engineer 합산 효과

| 직업 | v8 K3 | v9 K3 추정 | v9 day 100 도달 |
|------|-------|------------|----------------|
| homeless | 4.2 | 5.2~5.7 | 0~5건 |
| engineer | 4.4 | 5.3~5.8 | 0~5건 |
| **7직업 합산** | - | - | **5~15건** |

K1 5~15% 도달 추정. 협의서 v4 §9.5 KPI 목표 ≥ 5% **충족 가능** (engineer + homeless 동시 PR13 머지 의무).

### 9.4 R10-1 폭증 해소 추정

| 직업 | v8 절망 | v9 절망 추정 (Tier-2 적용) |
|------|---------|---------------------------|
| homeless | 46 | 10~25 (Tier-2 + worn_photo + newspaper_bundle) |
| engineer | 77 | 15~35 (Tier-2 + sketch_notebook + craft·dismantle morale 가산) |
| **합산 Δ** | 123 | 25~60 (**-63~-98건**) |

**전 직업 절망 추정:** v8 405 → v9 ~280~340 (Δ -65~-125). R10-1 폭증(+232) 부분 해소. 사망 원인 1위는 v9에서 절망·아사 동률 가능성 (절망 280~340 / 아사 250~290 추정).

### 9.5 R11-1 chef 정체성 강화 트랙 진입 트리거

§7.2 단정: engineer + homeless 합산 시 정의 1·2 동시 +0.5d 임계 깨짐.

**chef 정체성 강화 트랙 진입 의무 (PR14 후보):**
- chef 신규 ability `chef_legacy` (전수 요리) — cooking 행위 시 morale +5 가산 (engineer workshop_focus 대칭)
- chef K3 5.2 → 5.7~6.0 추가 향상 → 정의 1·2 격차 +0.5d 복구
- 본 PR13 영역 외 — 시나리오 한도연 후속 트랙

---

## 10. 위험과 완화

### 10.1 R11-1 chef 격차 정의 1·2 동시 임계 깨짐

**트리거:** baseline v9 측정에서 chef 정의 2 격차 +0.42d 확정 (+0.5d 미만).
**완화:** 협의서 v4 §13.2 R11-1 액션 트리거 발동. PR14 chef 정체성 강화 트랙 진입 (§9.5).
**대안 (보수적):** engineer Tier-2 `moraleOnCraft` 5 → 3 / `moraleOnDismantle` 5 → 3 하향 → K3 +0.5~0.7d 축소 → 정의 2 +0.5d 임계 보존. 단 R8-1 해소 효과 약화 위험. 권고는 chef 강화 트랙 진입(공격적), 보수적 옵션은 거절.

### 10.2 `moraleOnCraft`·`moraleOnDismantle` 시스템 미구현

**트리거:** `tools/sim/v2/playerAI.mjs` 또는 등가에서 craft·dismantle 분기에 ability 가산 미구현 → Tier-2 ability effect 무작용.
**완화:** 시스템 백승호 PR13 구현 시 의무 작업:
- `actCraft` 또는 등가 함수 종료 시 `GameState.player.abilities` 중 `moraleOnCraft` effect 적용 → `GameState.stats.morale.current` 가산
- `actDismantle` 또는 등가 함수 종료 시 `moraleOnDismantle` effect 적용
- 시뮬 측 (`playerAI.mjs`)에서 craft·dismantle 발동 분기에 동일 가산 적용 (게임 본체 정합)
- baseline v9 측정 전 단위 테스트 추가 (engineer craft 1회 발동 → morale +5 검증)

### 10.3 `sketchNotebookBonus: true` 시스템 미구현

**트리거:** sketch_notebook 소비 시 ability 가산 분기 미구현 → 기본 onConsume.morale +10만 적용.
**완화:** 시스템 백승호 구현 시 `applyOnConsume(itemId)` 또는 등가에서 ability `sketchNotebookBonus` 검사 → fatigue 추가 보너스 -5 → 0 적용 (effect 의미: sketch_notebook은 engineer만 fatigue 보너스, 다른 직업은 기본 효과만).
**대안:** Tier-2 ability `effect`에서 `sketchNotebookBonus: true` 제거하고 sketch_notebook `onConsume.fatigue` -5 직접 부여. 단 7직업 동시 효과 발생 (다른 직업이 sketch_notebook 획득 시) → 정체성 보호 약화. 권고는 ability 가산 유지.

### 10.4 신규 subtype `keepsake` 충돌 (homeless worn_photo와 공유)

**트리거:** items.js 검증에서 `subtype: 'keepsake'` 미등록 subtype 경고 + worn_photo·sketch_notebook 두 아이템 동시 도입.
**완화:** 시스템 백승호 PR13 구현 시 subtype `keepsake` 신규 등록 + items.js subtype 검증 매핑 갱신. 또는 worn_photo `subtype: 'comfort'` / sketch_notebook `subtype: 'craft'` 분리 (기존 subtype 사용).
**권고:** `keepsake` 신규 등록 — 두 아이템 공통 어휘 ("기억·정서 회복") 정합. 설정 이수정 위임 검수.

### 10.5 sketch_notebook dismantle paper 산출 vs paper 정의 부재

**트리거:** `sketch_notebook` dismantle `paper` 산출 정의 시 `items_misc.js` paper 정의 0건이면 dangling reference.
**완화:** 시스템 백승호 PR13 구현 시 paper 정의 검증. paper 미정의 시:
- (a) paper 신규 정의 추가 (정체성 정합 — newspaper_bundle dismantle도 paper 산출 가능)
- (b) dismantle 산출을 `cloth` 1개로 변경 (보수적 폴백)
**권고:** (a) — paper는 게임 전반 정합 자원. 단 paper 정의 추가는 본 PR13 영역 외 검토 의무.

### 10.6 craft·dismantle 발동 빈도 추정 오차

**트리거:** baseline v9 측정에서 engineer day 1~4 craft 발동 0~1회 측정 (추정 2~4회 대비 미달) → workshop_focus 효과 약화.
**완화:** sim AI가 craft·dismantle 우선순위를 낮게 평가하는 경우. `playerAI.mjs` `runDayAI` 분기 조정 — craft·dismantle 우선순위 상향 또는 morale<30 시 craft 트리거 강제 (시스템 백승호 위임). baseline v10 재측정 시 보완.

---

## 11. 위임 메모

| 위임 대상 | 항목 |
|----------|------|
| **시스템 백승호** | (1) PR13 patch diff §8 실제 적용 (homeless + engineer 합산) (2) `applyOnConsume()` `moraleRecoveryBonus` (homeless) + `sketchNotebookBonus` (engineer) ability 가산 분기 구현 (3) `actCraft`·`actDismantle` 또는 등가 함수 종료 시 `moraleOnCraft`·`moraleOnDismantle` ability 가산 분기 구현 (4) `subtype: 'keepsake'` 신규 등록 또는 대체 결정 (5) sketch_notebook dismantle paper 산출 정합 검증 (paper 정의 부재 시 추가 결정) (6) sketch_notebook CardFactory 이미지 매핑 (7) validate.js + fingerprint 회귀 0 검증 (8) sim 측 craft·dismantle 발동 빈도 검증 |
| **밸런스 권지나** | (1) baseline v9 측정 §9.1 의무 probe 9건 (2) R11-1 정의 1·2 격차 추정 검증 (engineer 단독 vs homeless+engineer 합산) (3) K1 ≥ 5% 도달 측정 (4) engineer K3 +0.8d 이상 합격 기준 단정 (5) homeless+engineer 합산 절망 사망 -63~-98건 단정 |
| **설정 이수정** | (1) sketch_notebook description 어휘 검수 — "성수동 공장"·"연료 없는 탈것 스케치" LORE_GLOSSARY 등록 또는 인용 결정 (2) `subtype: 'keepsake'` 신규 어휘 등록 검토 (3) `workshop_focus` ability desc 어휘 검수 — "작업 몰입" LORE_GLOSSARY engineer 어휘 등록 |
| **AD 정해린** | sketch_notebook 이미지 1건 (📓 이모지 폴백 가능, 정식 이미지 후속) + `workshop_focus` ability 아이콘 🔧 검수 |
| **Director 서민호** | (1) 6 게이트 §7 검수 통과 단정 확인 (2) R11-1 정의 1·2 동시 +0.5d 임계 깨짐 단정 시 chef 정체성 강화 트랙(PR14) 진입 결정 |

---

## 12. 결정 단언

| 항목 | 결정 |
|------|------|
| Tier-2 ability `workshop_focus` 신설 | **통과** (6 게이트 5/6 통과 + 1/6 모니터링) |
| 신규 아이템 `sketch_notebook` 도입 | **통과** (6 게이트 전수 통과) |
| 행위형 morale 회복 (craft·dismantle 1회당 +5) | **통과** (engineer 정체성 정합) |
| startingItems 6 → 9 확장 | **통과** (engineer goal "scrap_metal 8개" 가속 정합) |
| 4곳 등록 룰 적용 | **통과** (sketch_notebook 4곳 신규) |
| R11-1 chef 격차 보호 | **모니터링 + 임계 깨짐 단정** (정의 1·2 동시 +0.5d 미만 도달 추정 → chef 정체성 강화 트랙 PR14 진입 트리거) |
| PR13 패치 diff 총 변경량 (engineer 단독) | ~30라인 (characters.js +12 / items_misc.js +12 / stackConfig.js +3 / CardFactory.js +1) |
| PR13 패치 diff 총 변경량 (homeless + engineer 합산) | ~60라인 |
| 다음 트리거 | 시스템 백승호 PR13 머지 (homeless + engineer 동시) → baseline v9 측정 (밸런스 권지나) → R11-1 임계 깨짐 단정 시 chef 정체성 강화 트랙 PR14 진입 |

---

*문서 끝. baseline v9 측정 결과 도착 시 §9.1 probe 검증 + R11-1 트리거 발동 단정 + chef 정체성 강화 트랙 PR14 진입 결정. — homeless Tier-2(`SCN_QUEST_homeless_tier2.md`)와 합산 효과 §9.3 단정 확인 의무.*
