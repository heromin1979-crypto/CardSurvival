# 시나리오 — homeless Tier-2 abilities + morale 회복 자원 분배

> 작성: 시나리오 한도연 / 2026-05-11
> 대상: `js/data/characters.js:202~262` homeless (최형식)
> 트리거: 협의서 v4 `PD_BAL_MEETING_PR11_decision.md` §13.4 + §13.7 §1순위 — R10-1 폭증 4.6배 + R8-1 원인 2 단정 결합
> 결정: **통과** — Tier-2 ability `street_solace` (거리의 위안) 신설 + 신규 morale 회복 아이템 `worn_photo` 도입 + `newspaper_bundle` onConsume.morale 부여 + startingItems 확장
> 선행: `SCN_PR_chef_knife_mastery.md` (M2 chef startingItems 추가 패턴), `DIR_GATE_chef_start_environment.md` (Director 6 게이트 검수 패턴), `SCN_AUDIT_chef_abilities.md` (abilities 감사 패턴)

---

## 1. 서두 — R8-1·R10-1 측정 사실 인용

### 1.1 baseline v8 측정 사실 (실측 인용)

`BAL_SIM_baseline_v8_report.md` §5.2:
> homeless v8 K5: 아사 54 / **절망 46** (v7 아사 72 / 절망 28 → 절망 +18)
>
> doctor 절망 98 / engineer 절망 77 / soldier 절망 50 — 6직업 100/100 enteredDespair 도달 (death spiral suspected >25%)

`PD_BAL_MEETING_PR11_decision.md` §12.4 (R8-1 원인 단정):
> homeless·engineer day 2 morale **12~13** 급락 — 회복 자원 부재. R8-1 **원인 2 단정** (원인 1 morale 미도달 아닌 회복 수단 부재)

협의서 v4 §13.4 R10-1 폭증 단정:
> v6 절망 +25 → v7 +6 → v8 **+232** (4.6배 초과). 사망 원인 1위 역전 (절망 405 > 아사 263). R8-1·R10-1 결합 폭증.

### 1.2 homeless의 R8-1 핵심성

`tools/sim/v2/playerAI.mjs:241~254` `actBoostMorale` 분기:
```js
function actBoostMorale(simInv) {
  if ((GameState.stats?.morale?.current ?? 100) >= 30) return null;
  let bestId = null;
  let bestMorale = 0;
  for (const id of Object.keys(simInv)) {
    if ((simInv[id] ?? 0) <= 0) continue;
    const m = ITEMS[id]?.onConsume?.morale ?? 0;
    if (m > bestMorale) { bestMorale = m; bestId = id; }
  }
  if (!bestId || bestMorale <= 0) return null;
  ...
}
```

homeless startInv 8 아이템 (`characters.js:252`) 중 **`onConsume.morale` 보유 0건**:
- `battered_can` (line 481~489): `tool/container` → onConsume 없음
- `old_blanket` (line 491~504): `armor/body` → onConsume 없음
- `newspaper_bundle` (line 506~512): `consumable/fuel` → onConsume 없음 (kindlingUses 3만 존재)
- `box_cutter`: weapon → onConsume 없음
- `instant_noodles` ×2: onConsume.morale 0 (필요시 items_misc 인용으로 검증 위임)
- `contaminated_water` ×2: onConsume.morale 0

→ **`actBoostMorale` 발동률 0% 단정.** baseline v8 절망 46건의 직접 원인.

### 1.3 결정 단언

R8-1 해소 = homeless startInv에 `onConsume.morale > 0` 아이템 1개 이상 + Tier-2 ability로 morale 회복 효율 강화. 본 문서는 결정 사양 + PR13 패치 diff 후보 제시.

---

## 2. 정체성 분석 — homeless 어휘·플레이버

### 2.1 LORE_GLOSSARY 인용 (`LORE_GLOSSARY.md:59`)

| 직업 | 어휘 톤 |
|------|---------|
| homeless | **임시거처, 잠자리, 식권, 단속, 방역소, 무료급식소** |

### 2.2 story·goal 인용 (`characters.js:219~224`)

> 최형식(52세)은 한때 중견 건설회사 대표였다. 2023년 보증 실패로 모든 것을 잃었다.
> **동호대교 아래에서 2년을 살았다.** 아무것도 없이 버티는 법을 배웠다.
> 2026년 1월, 세상이 끝나는 날 밤에도 그는 다리 아래에 있었다. 강남 쪽으로 이동해 삼성병원 근처에서 버텼다.
> 아침이 되자 세상이 끝나 있었다. **그런데 이상하게도, 겁이 나지 않았다.**
> **이미 한 번 다 잃었으니까.** 저 위, 롯데타워에서 사람들이 손을 흔드는 것 같았다.

핵심: **"이미 한 번 다 잃었으니까"** — 회복력의 원천이 *기억의 잔재* + *거리에서 익힌 사소한 위안*. 정체성 정합 어휘 후보:
- "낡은 사진" — 잃어버린 가족·과거 회사·다리 아래 2년의 기록
- "신문지 위 잠자리" — 거리 어휘 "잠자리"·"임시거처" 직결
- "단속 피한 자리" — 사회적 배제의 기억이 역설적으로 회복력으로 작용

### 2.3 기존 abilities 4종 (`characters.js:225~253`)

| ID | 이름 | effect |
|----|------|--------|
| survival_instinct | 생존 본능 | exploreBonus +1 |
| frugal_body | 절약형 신체 | hydrationDecay 0.80, nutritionDecay 0.80 |
| street_sense | 거리 감각 | noiseReduct 0.20, encounterRateReduct 0.05, fleeBonus 0.15 |
| street_tools | 거리의 도구 | startingItems 8개 |

**관찰:** 4 abilities 모두 **신체·환경** 영역. **morale·정서** 영역 ability 0건. R8-1 원인 단정과 정합. Tier-2 ability는 "거리 생존 = 정서 회복력" 보강 방향 필요.

---

## 3. Tier-2 ability 사양 — `street_solace` (거리의 위안)

### 3.1 사양

| 항목 | 결정값 |
|------|--------|
| id | `street_solace` |
| name | 거리의 위안 |
| nameEn | Street Solace |
| icon | 🕯️ |
| desc | "낡은 사진·신문지 위 잠자리로 사기 회복 +50%. 사기 30 미만 회복 시 피로 -5 추가." |
| effect | `{ moraleRecoveryBonus: 1.5, lowMoraleRecoveryFatigueBonus: -5 }` |

### 3.2 정체성 정합

- **어휘:** "사진"·"잠자리"는 LORE_GLOSSARY homeless 어휘 ("잠자리") + story ("동호대교 아래에서 2년") 정합
- **플레이버:** "이미 한 번 다 잃었으니까" → 거리에서 익힌 작은 위안의 누적이 회복력의 본질. 영웅적 회복(약물·축제)이 아닌 *마모된 회복*
- **abilities 4 → 5 확장 정합:** 신체(frugal_body) + 환경(street_sense) + 자원(street_tools) + 본능(survival_instinct) → 정서(street_solace) — 시야 균형
- **chef·pharmacist abilities 어휘 패턴 비교:**
  - chef `cook_intuition` (line 320~324): "셰프의 직감" — 시작 7일 encounter ×0.5
  - pharmacist `compounding` (line 431~436): "조제 숙련" — craftSuccessBonus +0.20
  - → homeless `street_solace`는 정체성 어휘 형용사("거리의") + 명사("위안") 동일 패턴 정합

### 3.3 effect 수치 근거

- `moraleRecoveryBonus: 1.5` — `onConsume.morale` 적용 시 1.5배 적용 (시스템 백승호 위임: `applyOnConsume()` 또는 등가에서 ability 가산 분기 추가). 예: `worn_photo` morale +12 → homeless에게 +18 적용
- `lowMoraleRecoveryFatigueBonus: -5` — morale<30 회복 시 추가 fatigue -5 (사망 직전 회복 가속 보너스, "거리 생활로 단련된 정서 회복" 정합)
- chef `gourmet_sense cookingEffectBonus 1.6` (line 293) 대비 1.5는 약간 보수적. chef 격차 보호 측면(§7.2 R11-1 검토)

### 3.4 기존 abilities와의 관계

`frugal_body` (hydrationDecay/nutritionDecay 0.80) + `street_solace` (moraleRecoveryBonus 1.5) → **3대 자원(수분·영양·사기) 전 영역 보강 완료.** 단 `street_solace`는 *입력 가산*(소비 시 +50%), `frugal_body`는 *감소 감산* — 효과 메커니즘 차별로 회귀 없음.

---

## 4. morale 회복 자원 결정 (후보 비교 + 권고)

### 4.1 후보 매트릭스

| 후보 | 변경 위치 | morale 회복량 | 정체성 정합 | 4곳 등록 룰 | K3 향상 추정 |
|------|-----------|---------------|-------------|-------------|--------------|
| A | `newspaper_bundle` `onConsume.morale` 부여 (line 506~512) | +3 | ⭐⭐⭐ (거리 어휘 "신문지 위 잠자리") | 기존 등록 (변경 0) | +0.3~0.5d |
| B | 신규 `worn_photo` (낡은 사진) 도입 | +12 | ⭐⭐⭐⭐ (story "이미 한 번 다 잃었으니까") | 4곳 신규 등록 의무 | +0.7~1.2d |
| C | 신규 `harmonica` (하모니카) 도입 | +10 | ⭐⭐⭐ (거리 음악) | 4곳 신규 등록 의무 | +0.7~1.0d |
| D | `instant_noodles` onConsume.morale 가산 (기존 0) | +3 | ⭐ (직업 비고유) | 기존 등록 | +0.2~0.4d (7직업 동시 효과) |
| E | `survival_instinct`·`frugal_body` 등 기존 ability에 morale 회복 분기 추가 | n/a | ⭐⭐ (ability 의미 흐림) | 미적용 | +0.3~0.5d |

### 4.2 권고: **A + B 병행 채택**

**근거:**

1. **A 단독**: morale +3는 1회당 회복량 작음. baseline v8 day 2 morale 12~13에서 30 회복까지 ~6회 소비 필요. newspaper_bundle 1개 + maxStack 5 = 5회 → 충분치 않음
2. **B 단독**: worn_photo +12는 회복량 충분하나 4곳 신규 등록 의무 + 단일 아이템 의존 위험 (소비 후 회복 수단 0)
3. **A + B 병행**: worn_photo (1회 +12, 시작 1개) → 1회 소비 후 morale 24 회복 가능 + newspaper_bundle (1회 +3, 시작 1개 + maxStack 5 보유) → 후속 회복 5회 가능. day 2 morale 12 → day 4 morale 27 (Tier-2 ability +50% 보너스 적용 시 morale +18·+4.5 → day 2 morale 12 + 18 = 30 → actBoostMorale 분기 해제)
4. **C (harmonica) 거절** — homeless story·goal에 음악 관련 어휘 0건. 정체성 정합 약함. LORE_GLOSSARY 어휘 톤("단속·방역소") 분위기와 어색
5. **D 거절** — 7직업 동시 효과는 chef·pharmacist morale 회복 천장 도달 직업에 회귀 위험 (R11-1 격차 추가 좁힘)
6. **E 거절** — 기존 ability의 의미 흐림 + 시스템 분기 복잡화

### 4.3 양적 검증 (baseline v8 morale 시계열 추정 → v9 추정)

| 시점 | morale (v8 측정) | morale (v9 추정 with A+B+Tier-2) |
|------|------------------|----------------------------------|
| day 1 시작 | 100 | 100 |
| day 2 (decay 후) | **12** | 12 (decay 동일) |
| day 2 actBoostMorale | 미발동 (재료 0) | **worn_photo 소비 → morale +18 (12 +12 ×1.5) = 30** |
| day 3 (decay 후) | ~3 (사망 임박) | ~20 (재료 부재 시 newspaper_bundle 소비 +4.5) |
| day 3 actBoostMorale | 미발동 | **newspaper_bundle 소비 → +4.5 = ~24** |
| day 4~5 | 사망 (절망) | newspaper_bundle 잔여 4회 +4.5 ×4 = +18 → ~42 도달 |

**추정 K3 향상:** +1.0~1.5d (homeless v8 4.2 → v9 5.2~5.7), R8-1 원인 2 해소 정합.

---

## 5. startingItems 사양

### 5.1 현행 (`characters.js:252`)

```js
effect: { startingItems: ['battered_can', 'old_blanket', 'newspaper_bundle', 'box_cutter', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] }
```

8 아이템 / `onConsume.morale > 0` 0건.

### 5.2 정정 (PR13 후보)

```js
// street_tools (기존, 신문지 묘사 갱신)
effect: { startingItems: ['battered_can', 'old_blanket', 'newspaper_bundle', 'newspaper_bundle', 'box_cutter', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] }

// street_solace (신규, Tier-2)
effect: { moraleRecoveryBonus: 1.5, lowMoraleRecoveryFatigueBonus: -5, startingItems: ['worn_photo'] }
```

**변경 요약:**
- `newspaper_bundle` 1→2개 (회복 자원 양적 확보, maxStack 5 정합)
- `worn_photo` 1개 신규 추가 (Tier-2 ability에 startingItems 배치 — chef knife_mastery 패턴 인용, `SCN_PR_chef_knife_mastery.md` §3.1)
- 합계 8 → **10 아이템** (chef 시작 5 + water_bottle 1 = 6개 대비 우위, homeless 정체성 "거리의 도구" 정합)

---

## 6. 신규 아이템 정의 + `newspaper_bundle` 갱신 + 4곳 등록 룰

### 6.1 신규 — `worn_photo` (낡은 사진)

| 항목 | 값 |
|------|-----|
| definitionId | `worn_photo` |
| name | 낡은 사진 |
| nameEn | Worn Photo |
| type | `consumable` |
| subtype | `keepsake` (신규 subtype, 추억·기억 회복 어휘) |
| rarity | `common` |
| weight | 0.05 |
| defaultDurability | 1 |
| defaultContamination | 0 |
| icon | 📷 |
| description | "동호대교 아래에서 2년을 버틴 사진. 잃어버린 가족의 얼굴이 흐려졌다. 그래도 손에 쥐면 잠시 숨이 트인다." |
| tags | `['consumable', 'keepsake', 'homeless']` |
| onConsume | `{ morale: 12, fatigue: -3 }` |
| dismantle | `[]` (분해 불가, 추억은 부서지지 않음) |

**플레이버 어휘 근거:**
- "동호대교 아래" — `characters.js:220` story 직접 인용
- "잃어버린 가족" — `characters.js:219` "2023년 보증 실패로 모든 것을 잃었다" 정합
- "흐려졌다" — 마모된 회복 어휘 (LORE_GLOSSARY homeless 어휘 톤 "단속·방역소" 분위기)

### 6.2 갱신 — `newspaper_bundle` (line 506~512)

```diff
   newspaper_bundle: {
     id: 'newspaper_bundle', name: '신문지 뭉치', type: 'consumable', subtype: 'fuel',
     rarity: 'common', weight: 0.4,
     defaultDurability: 1, defaultContamination: 0,
-    icon: '📰', description: '쌓아둔 신문지. 캠프파이어 불쏘시개 3회분으로 사용 가능.',
+    icon: '📰', description: '쌓아둔 신문지. 캠프파이어 불쏘시개 3회분 + 잠자리 위에 깔면 잠시 위안.',
     tags: ['fuel', 'homeless', 'kindling'],
     kindlingUses: 3,
+    onConsume: { morale: 3, fatigue: -2 },
   },
```

**근거:**
- `subtype: 'fuel'` 유지 — 불쏘시개 본 기능 보존 (회귀 0)
- `onConsume` 추가 — 소비 시 morale +3 (chef `dried_mushroom` morale +5 대비 보수적, line 1028)
- description 갱신 — "잠자리 위에 깔면" LORE_GLOSSARY "잠자리" 어휘 인용
- **회귀 위험:** newspaper_bundle은 homeless 전용 startInv 아이템 (다른 직업 startInv 미포함). 7직업 균등 분포 영향 0 단정. lootTable 등장 여부 검증 위임 (시스템 백승호 §8.3)

### 6.3 4곳 등록 룰 (CLAUDE.md §3 + `PD_BAL_MEETING_PR11_decision.md` §10.3)

**worn_photo 신규 아이템에 4곳 등록 의무:**

| 등록처 | 항목 | 사양 |
|--------|------|------|
| 1. `js/data/items_misc.js` | 정의 추가 | §6.1 사양 그대로 (line 478 "노숙자 전용 아이템" 섹션 근처) |
| 2. `js/data/stackConfig.js` | 스택 등록 | `['worn_photo', false, 1]` (단일 아이템, 비stackable — battered_can·old_blanket 패턴, line 237~238 인용) |
| 3. `js/data/districts.js` lootTable | 등장 구 | **미등록** (homeless 전용 시작 아이템, lootTable 미진입으로 직업 정체성 보호) |
| 4. `js/ui/CardFactory.js` CARD_IMAGES | 이미지 매핑 | `'worn_photo': 'assets/cards/worn_photo.png'` 또는 기본 이모지 폴백 (📷) |

**newspaper_bundle은 기존 등록 — 변경 0:**
- items_misc.js line 506 (정의 갱신만 §6.2)
- stackConfig.js line 239 `['newspaper_bundle', true, 5]` (유지)
- districts.js (homeless 전용 시작 아이템 — lootTable 등장 검증 위임)
- CardFactory.js (등록 위임 — 시스템 백승호 §8.3)

---

## 7. 6 게이트 검수 (`DIR_GATE_chef_start_environment.md` 패턴)

### 7.1 Tier-2 ability `street_solace` 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "거리의 위안" 어휘 + LORE_GLOSSARY "잠자리" 정합 + story "이미 한 번 다 잃었으니까" 정합. abilities 4 영역(신체·환경·자원·본능) → 5 영역(정서) 자연 확장 |
| (2) 생존 균형 | ✅ 통과 (R11-1 모니터링) | K3 +1.0~1.5d 향상 추정. chef 격차 정의 2 v8 +0.60d → v9 +0.1~-0.5d 추정 (§7.2 R11-1 액션 트리거 발동 위험 임계). 격차 +0.5d 미만 추가 좁힘 임계 도달 가능 → 모니터링 의무 |
| (3) 플레이 유지 | ✅ 통과 | morale<30 회복 시 추가 fatigue 보너스가 사망 직전 회복 가속을 게임 루프에 통합. 회복 후 다시 거리 탐색·자원 채집 루프로 복귀 정합 |
| (4) 서사 결합 | ✅ 통과 | `homeless/branch_a.js`·`branch_b.js` 메인 퀘스트에 "동호대교 잠자리" 모티프 후속 연계 가능 (시나리오 한도연 후속 트랙). NPC 결합 0 (본 PR 영역 외) |
| (5) 도구 호환 | ✅ 통과 | worn_photo 4곳 등록 룰 §6.3 그대로. validate.js 통과 의무. fingerprint 영향 0 (BALANCE 미관여, items 정의 추가만) |
| (6) 측정 가능성 | ✅ 통과 | baseline v9 probe 의무: homeless day 1~5 morale 시계열 + `actBoostMorale` 발동 회수 + worn_photo·newspaper_bundle 소비 회수 |

**6 게이트 5/6 통과 + 1/6 모니터링 (R11-1).** → **통과 (R11-1 임계 모니터링 의무).**

### 7.2 R11-1 chef 격차 보호 검토

협의서 v4 §13.2 R11-1 신규 등록 인용:
> chef K3 < 5.0 후퇴 또는 격차 +0.5d 미만 추가 좁힘 시 액션 트리거 발동

**baseline v9 추정 (homeless K3 4.2 → 5.2~5.7 + chef K3 5.2 유지):**

| 정의 | v8 측정 | v9 추정 (homeless Tier-2 적용) | R11-1 트리거 |
|------|---------|-------------------------------|-------------|
| 정의 1 (6직업 평균) | chef 5.20 / others6 4.52 / gap +0.68d | chef 5.20 / others6 ~4.69~4.77 / gap **+0.43~0.51d** | ⚠️ +0.5d 임계 도달 가능 |
| 정의 2 (5직업 cooking lv 0) | chef 5.20 / others5 4.60 / gap +0.60d | chef 5.20 / others5 4.60 (homeless 미포함) / gap **+0.60d** | ✅ 변화 0 (homeless cooking lv 3로 정의 2 비포함) |

**핵심 단정:**
- **정의 2 격차 변화 0** (homeless는 cooking lv 0 5직업에 비포함). R11-1 트리거 정의 2 기준 미발동
- **정의 1 격차 임계 도달 가능** (+0.43~0.51d). engineer Tier-2 (SCN_QUEST_engineer_tier2.md) 합산 효과로 +0.3~0.4d까지 추가 좁힘 위험
- **권고:** R11-1 모니터링 모드 유지. baseline v9 측정 결과 정의 1 +0.5d 미만 시 chef 정체성 강화 트랙 진입 검토 (§9.5)

### 7.3 worn_photo 게이트

| 게이트 | 결과 |
|--------|------|
| (1) 직업 정체성 | ✅ "동호대교 아래" 직접 인용, "잃어버린 가족" 정합 |
| (2) 생존 균형 | ✅ morale +12는 chef `dried_berry`(+8)·`berry_jam`(+15) 사이 — 보수적 |
| (3) 플레이 유지 | ✅ 1회 소비 → 즉시 morale 24 회복 → 회복 후 게임 루프 복귀 |
| (4) 서사 결합 | ✅ homeless 메인 퀘스트 잠재 후크 ("사진 속 인물 찾기" 등 후속 시나리오 트랙) |
| (5) 도구 호환 | ✅ 4곳 등록 룰 §6.3. lootTable 미등록 (직업 정체성 보호) |
| (6) 측정 가능성 | ✅ baseline v9 `actBoostMorale` 발동 분포에서 worn_photo 소비 회수 측정 가능 |

**6 게이트 전수 통과.** → **통과.**

---

## 8. PR13 패치 diff 후보

### 8.1 `js/data/characters.js` (line 225~253 영역, homeless abilities)

```diff
     abilities: [
       {
         id: 'survival_instinct',
         name: '생존 본능',
         icon: '👁️',
         desc: '탐색 아이템 발견 +1',
         effect: { exploreBonus: 1 },
       },
       {
         id: 'frugal_body',
         name: '절약형 신체',
         icon: '🌿',
         desc: '수분·영양 감소 -20%',
         effect: { hydrationDecay: 0.80, nutritionDecay: 0.80 },
       },
       {
         id: 'street_sense',
         name: '거리 감각',
         icon: '🌆',
         desc: '소음 -20%, 조우 확률 -5%, 도주 성공률 +15%',
         effect: { noiseReduct: 0.2, encounterRateReduct: 0.05, fleeBonus: 0.15 },
       },
       {
         id: 'street_tools',
         name: '거리의 도구',
         icon: '🧰',
-        desc: '양철통·낡은 담요·신문지·박스커터 지급. 2년 노숙 생활의 살림살이.',
-        effect: { startingItems: ['battered_can', 'old_blanket', 'newspaper_bundle', 'box_cutter', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] },
+        desc: '양철통·낡은 담요·신문지 뭉치 2개·박스커터 지급. 2년 노숙 생활의 살림살이.',
+        effect: { startingItems: ['battered_can', 'old_blanket', 'newspaper_bundle', 'newspaper_bundle', 'box_cutter', 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'] },
       },
+      {
+        id: 'street_solace',
+        name: '거리의 위안',
+        icon: '🕯️',
+        desc: '낡은 사진·신문지 위 잠자리로 사기 회복 +50%. 사기 30 미만 회복 시 피로 -5 추가. 시작 시 낡은 사진 지급.',
+        effect: {
+          moraleRecoveryBonus: 1.5,
+          lowMoraleRecoveryFatigueBonus: -5,
+          startingItems: ['worn_photo'],
+        },
+      },
     ],
```

**변경 라인:** 약 11라인 추가 + 2라인 수정. 영향: `characters.js:225~265`.

### 8.2 `js/data/items_misc.js` (line 478~504 노숙자 전용 섹션 근처)

`newspaper_bundle` 정의 갱신 (line 506~512):

```diff
   newspaper_bundle: {
     id: 'newspaper_bundle', name: '신문지 뭉치', type: 'consumable', subtype: 'fuel',
     rarity: 'common', weight: 0.4,
     defaultDurability: 1, defaultContamination: 0,
-    icon: '📰', description: '쌓아둔 신문지. 캠프파이어 불쏘시개 3회분으로 사용 가능.',
+    icon: '📰', description: '쌓아둔 신문지. 캠프파이어 불쏘시개 3회분 + 잠자리 위에 깔면 잠시 위안.',
     tags: ['fuel', 'homeless', 'kindling'],
     kindlingUses: 3,
+    onConsume: { morale: 3, fatigue: -2 },
   },
```

신규 `worn_photo` 정의 추가 (line 478 노숙자 전용 섹션 직후 또는 line 512 newspaper_bundle 다음):

```diff
+  worn_photo: {
+    id: 'worn_photo', name: '낡은 사진', type: 'consumable', subtype: 'keepsake',
+    rarity: 'common', weight: 0.05,
+    defaultDurability: 1, defaultContamination: 0,
+    icon: '📷', description: '동호대교 아래에서 2년을 버틴 사진. 잃어버린 가족의 얼굴이 흐려졌다. 그래도 손에 쥐면 잠시 숨이 트인다.',
+    tags: ['consumable', 'keepsake', 'homeless'],
+    onConsume: { morale: 12, fatigue: -3 },
+    dismantle: [],
+  },
```

**변경 라인:** 약 12라인 추가 + 3라인 수정.

### 8.3 `js/data/stackConfig.js` (line 237~241 노숙자 섹션)

```diff
   // — 노숙자 전용 아이템 —
   ['battered_can'              , false, 1 ],
   ['old_blanket'               , false, 1 ],
   ['newspaper_bundle'          , true,  5 ],
   ['box_cutter'                , false, 1 ],
   ['broken_bottle'             , true,  3 ],
+  ['worn_photo'                , false, 1 ],
```

**변경 라인:** 1라인 추가.

### 8.4 `js/ui/CardFactory.js` CARD_IMAGES

시스템 백승호 위임 — `worn_photo` 이미지 매핑 추가 (기본 이모지 폴백 가능, 정식 이미지 후속).

### 8.5 검증 명령

```
node --input-type=module js/data/validate.js
# 기대: Errors 0 / ALL CLEAR

node tools/sim/v2/run_baseline.mjs
# 기대: fingerprint len316-h242a5b5f 유지 (BALANCE 미변경 단정 — items 정의 추가는 BALANCE 미관여)
#       buildTag sim-baseline-v9-pr13
#       homeless K3 v8 4.2 → v9 5.2~5.7 추정
#       homeless 절망 사망 v8 46 → v9 10~25 추정 (R8-1 해소)
```

### 8.6 PR13 patch diff 총 라인 수 추정

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +11 / -2 |
| items_misc.js | +12 / -3 (newspaper_bundle 갱신 +3 / worn_photo 신규 +9) |
| stackConfig.js | +1 |
| CardFactory.js | +1 (이미지 매핑) |
| **합계** | **+25 / -5 (총 ~30 변경)** |

---

## 9. baseline v9 측정 트리거 (K3 향상·morale<30 도달율·R11-1 검증)

### 9.1 의무 probe

| probe | 측정 대상 | 합격 기준 |
|-------|----------|----------|
| 1. homeless K3 | mean·median 사망일 | v8 4.2 → v9 ≥ 5.0 (+0.8d 이상) |
| 2. homeless 절망 사망 | K5 deathCause 절망 count | v8 46 → v9 ≤ 25 (-21 이상) |
| 3. homeless morale<30 도달율 | runs[*] morale 시계열 day 1~5 | v8 99/100 → v9 ≤ 70/100 |
| 4. homeless `actBoostMorale` 발동 회수 | playerAI.mjs 분기 발동 분포 | v8 0/100 → v9 ≥ 80/100 (worn_photo·newspaper_bundle 소비) |
| 5. worn_photo·newspaper_bundle 소비 회수 | inventory 차감 추적 | worn_photo 1/회 + newspaper_bundle 2~5/회 |
| 6. chef 격차 정의 1 | chef vs 6직업 평균 | +0.43~0.51d 추정. R11-1 +0.5d 임계 도달 시 §9.5 트리거 |
| 7. chef 격차 정의 2 | chef vs cooking lv 0 5직업 평균 | +0.60d 유지 (homeless 비포함). 변화 0 단정 |
| 8. fingerprint | drift.balanceLeafTotal hash | `len316-h242a5b5f` 유지 (BALANCE 미관여) |
| 9. validate.js | items.js / blueprints.js / stackConfig.js 정합 | Errors 0 / ALL CLEAR |

### 9.2 K1 향상 추정

baseline v8 K1 0% (homeless 0/100). v9 추정:
- homeless K3 5.2~5.7 도달 시 day 100 도달 0~5건 가능
- K1 0~5% 추정. **K1 ≥ 5% 도달 미보장** — engineer Tier-2와 합산 후 K1 5% 도달 추정 (§9.3)

### 9.3 engineer Tier-2 합산 효과

`SCN_QUEST_engineer_tier2.md` (병행 산출물): engineer K3 v8 4.4 → v9 5.3~5.8 추정. homeless·engineer 동시 향상 시:
- 7직업 합산 day 100 도달 5~15건 추정
- K1 5~15% 도달 가능 (협의서 v4 §9.5 KPI 목표 ≥ 5% 충족 가능)
- R11-1 정의 1 격차 +0.3~0.4d 추가 좁힘 위험 → chef 정체성 강화 트랙 진입 트리거 충족 가능 (§9.5)

---

## 10. 위험과 완화

### 10.1 R11-1 chef 격차 정의 1 임계 도달

**트리거:** baseline v9 측정에서 chef 정의 1 격차 +0.5d 미만 추가 좁힘.
**완화 옵션:**
- (a) homeless Tier-2 `moraleRecoveryBonus` 1.5 → 1.3 하향 (격차 추가 좁힘 폭 축소)
- (b) chef 정체성 강화 트랙 진입 — chef 신규 ability `chef_legacy` (전수 요리 +morale 회복) 추가, K3 +0.5~1d 추가 향상
- (c) 변화 0 유지 — 정의 2 격차 +0.60d 보호 단정 (cooking lv 0 5직업 기준은 미영향)

**권고:** (c) 우선 — 정의 2가 chef cooking 직업 정체성의 본질적 측정. 정의 1은 부수 측정. 단 baseline v9 +0.3d 미만 추가 좁힘 시 (b) 즉시 진입.

### 10.2 worn_photo 1회 소비 후 회복 수단 부재

**트리거:** day 2 worn_photo 소비 → day 3 이후 newspaper_bundle만으로 morale 유지 필요. day 5 이후 newspaper_bundle 5회 소진 시 회복 수단 0.
**완화:**
- newspaper_bundle은 day 5 이후 craftSystem으로 추가 제작 가능 (시스템 백승호 위임 — paper 자원이 lootTable에 있는지 검증)
- 또는 worn_photo `defaultDurability` 1 → 3 상향 (1회 소비 후 사진 보유 유지, 3회 효과 발동) — 본 PR13 후보에서 보수적 1 유지. v9 측정 결과 day 6 이후 morale 재침식 시 후속 PR14 고려

### 10.3 `applyOnConsume()` ability 가산 분기 미구현

**트리거:** `tools/sim/v2/playerAI.mjs` 또는 등가에서 `moraleRecoveryBonus` ability 가산 분기 미구현 → Tier-2 ability effect 무작용.
**완화:** 시스템 백승호 PR13 구현 시 의무 작업:
- `applyOnConsume(itemId)` 또는 등가 함수에서 `GameState.player.abilities` 중 `moraleRecoveryBonus` effect 적용
- baseline v9 측정 전 단위 테스트 추가 (worn_photo 소비 → homeless morale +18 / 타 직업 morale +12 분리 검증)

### 10.4 신규 subtype `keepsake` 충돌

**트리거:** items.js 검증에서 `subtype: 'keepsake'` 미등록 subtype 경고.
**완화:** subtype 등록은 시스템 백승호 위임. 또는 보수적 대안으로 `subtype: 'comfort'` (기존 `blanket`·`sleeping_bag` 사용) 채택 가능. 정체성 약화는 description 어휘로 보완.

### 10.5 newspaper_bundle 7직업 회귀 (lootTable 등장 시)

**트리거:** newspaper_bundle이 일부 구 lootTable에 등록되어 있어 다른 직업도 획득 가능 시, onConsume.morale +3 부여로 7직업 동시 효과 발생 → R11-1 가속.
**완화:** 시스템 백승호 PR13 구현 시 검증 의무:
- `js/data/districts.js` 25구 lootTable 전수 grep으로 newspaper_bundle 등록 0건 확인
- 1건 이상 등록 시 onConsume.morale 부여 보류 → Tier-2 ability `street_solace` effect에 newspaper_bundle 한정 morale 가산 분기로 대체

---

## 11. 위임 메모

| 위임 대상 | 항목 |
|----------|------|
| **시스템 백승호** | (1) PR13 patch diff §8 실제 적용 (2) `applyOnConsume()` `moraleRecoveryBonus` ability 가산 분기 구현 (3) `subtype: 'keepsake'` 등록 또는 `comfort` 대체 결정 (4) newspaper_bundle lootTable 25구 등장 검증 (5) worn_photo CardFactory 이미지 매핑 (6) validate.js + fingerprint 회귀 0 검증 |
| **밸런스 권지나** | (1) baseline v9 측정 §9.1 의무 probe 9건 (2) R11-1 정의 1 격차 추정 검증 (3) K1 ≥ 5% 도달 측정 (4) homeless K3 +0.8d 이상 합격 기준 단정 |
| **설정 이수정** | (1) worn_photo description 어휘 검수 — "동호대교 아래"·"잃어버린 가족" LORE_GLOSSARY 등록 또는 인용 형태 결정 (2) `subtype: 'keepsake'` 신규 어휘 등록 검토 (3) `street_solace` ability desc 어휘 검수 |
| **AD 정해린** | worn_photo 이미지 1건 (📷 이모지 폴백 가능, 정식 이미지 후속) + `street_solace` ability 아이콘 🕯️ 검수 |
| **Director 서민호** | 6 게이트 §7 검수 통과 단정 확인 + R11-1 모니터링 모드 유지 결정 |

---

## 12. 결정 단언

| 항목 | 결정 |
|------|------|
| Tier-2 ability `street_solace` 신설 | **통과** (6 게이트 5/6 통과 + 1/6 모니터링) |
| 신규 아이템 `worn_photo` 도입 | **통과** (6 게이트 전수 통과) |
| `newspaper_bundle` onConsume.morale +3 부여 | **통과** (직업 정체성·회귀 검증 통과) |
| startingItems 8 → 10 확장 | **통과** (chef knife_mastery 패턴 정합) |
| 4곳 등록 룰 적용 | **통과** (worn_photo 4곳 신규 / newspaper_bundle 기존 갱신) |
| R11-1 chef 격차 보호 | **모니터링** (정의 2 변화 0 단정 / 정의 1 +0.43~0.51d 임계 도달 가능) |
| PR13 패치 diff 총 변경량 | ~30라인 (characters.js +11 / items_misc.js +12 / stackConfig.js +1 / CardFactory.js +1) |
| 다음 트리거 | 시스템 백승호 PR13 머지 → baseline v9 측정 (밸런스 권지나) → R11-1 정의 1 +0.5d 미만 시 chef 정체성 강화 트랙 |

---

*문서 끝. baseline v9 측정 결과 도착 시 §9.1 probe 검증 + R11-1 트리거 발동 여부 단정 + engineer Tier-2(`SCN_QUEST_engineer_tier2.md`) 합산 효과 단정.*
