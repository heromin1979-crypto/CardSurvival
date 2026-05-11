# 시나리오 — pharmacist Tier-2 abilities + 신규 자원 분배

> 작성: 시나리오 한도연 / 2026-05-12
> 대상: `js/data/characters.js:422~483` pharmacist (한소희)
> 트리거: 협의서 v5 `PD_BAL_MEETING_PR14_decision.md` §6.4 + §11 §1순위 — M3 #20 진입 결정 (PR14와 동시 진행, 시나리오 단일 트랙 4 SCN_QUEST 작성 중 3 직업 트랙). R15-1 우회 — craft 발동 빈도 가정을 day 시작 1회로 보수화. K3 추정 향상을 PR15 ability 패턴 실측(homeless +0.1d / engineer +0.1d) 기반 보수화
> 결정: **통과** — Tier-2 ability `compounding_focus` (조제 몰입) 신설 + 신규 의료·약품 자원 `pharmacy_notes` (조제 노트) 1개 도입 + startingItems 확장. **pharmacist는 cooking lv 1로 정의 2(cooking lv 0 5직업) 비포함** → 격차 정의 2 영향 0. 격차 정의 1(6직업 평균) 추가 좁힘은 보수적(-0.1d 이하) 유지 — R11-1 사전 등록 트리거 회피
> 선행: `SCN_QUEST_homeless_tier2.md` (street_solace + worn_photo 패턴), `SCN_QUEST_engineer_tier2.md` (workshop_focus + sketch_notebook 패턴, 행위형 회복), `SCN_QUEST_firefighter_tier2.md`·`SCN_QUEST_soldier_tier2.md` (소비형 회복, 병행 산출물)

---

## 1. 서두 — pharmacist 측정 사실 + R15-1 우회 보수화 명시

### 1.1 baseline v10 측정 사실 (실측 인용)

`BAL_SIM_baseline_v10_report.md` §4 K3 표 (line 94~102):
- pharmacist K3 v10 = **4.10** (v8·v9·v10 모두 4.1 유지 — PR15 ability 가산 분기에 미관여 직업이라 변화 0)
- pharmacist K5 v10 = 절망 40 / 아사 51 / 극도 피로 7 / 탈수 2 (v9 동일, 변화 0)
- **7직업 중 K3 최하** (doctor 4.9 / chef 5.2 / firefighter 5.0 / engineer 5.0 / homeless 4.3 / soldier 4.5 / pharmacist **4.1**)

`BAL_SIM_baseline_v10_report.md` §6.3 (line 270~277):
> 5직업 회귀 0 검증 단언. PR15 시뮬 로직 변경이 ability 보유 2직업(homeless·engineer)에만 영향 단정.

### 1.2 pharmacist의 SCN_QUEST 대상 정합성

pharmacist K3 4.10은 **7직업 최하**. 정체성 정합 자원으로 morale 회복 + 의약품 활용 시너지 강화 시 K3 향상 효과 가능. **중요: pharmacist는 cookingLv 1**로 격차 정의 2 (cooking lv 0 5직업) **비포함**. 따라서 본 SCN_QUEST의 K3 향상은:
- **정의 2 격차 영향 0** (homeless §7.2 정의 2 변화 0 패턴 정합)
- **정의 1 (6직업 평균) 추가 좁힘 -0.04~-0.06d** (firefighter·soldier와 동일 보수적 사양)

### 1.3 R15-1 우회 보수화 (협의서 v5 §6.3 인용)

> SCN_QUEST_chef_tier2.md + 3건 작성 시 craft 발동 빈도 가정을 *보수적*(day 시작 1회)으로 사용. K3 추정값을 baseline v9·v10 실측 패턴(homeless +0.1d, engineer +0.1d)으로 보수화.

**적용:** pharmacist Tier-2 ability effect 추정 시 PR15 실측 +0.1d 정합으로 K3 향상 +0.1~0.3d로 보수화. craft 발동 빈도 가정 4~6회/day 사용 금지.

### 1.4 결정 단언

R15-1 우회 보수화 + 격차 정의 2 영향 0 (cookingLv 1) + 정의 1 보호 = pharmacist Tier-2 ability + 신규 자원 1개 한정 사양. K3 향상 +0.1~0.3d. chef 격차 정의 1 추가 좁힘 -0.06d 이하 보장.

---

## 2. 정체성 분석 — pharmacist 어휘·플레이버

### 2.1 LORE 어휘 톤 (pharmacist)

`characters.js:437~443` story·strengths 인용:
- strengths: '약품 조제', '천연물 지식', '독성 감별'
- weaknesses: '전투 미숙', '체력 한계', '근접 약함'
- story: "홍대 입구 골목의 작은 약국 원장" + **"카운터 아래 노트에 이상 증상을 기록"** + **"대학원 시절 천연물 화학 수업이 떠올랐다"** + "교수의 말이 기억났다. 가장 강한 항바이러스 성분은 식물에 있다"

핵심 어휘:
- **"조제"·"약사"·"약품"** — 직업 정체성 본질
- **"노트"·"기록"·"천연물 화학"** — story 직접 인용. *지식·연구가 정서 회복의 원천*
- **"교수의 말"·"대학원 시절"** — 기억·학문이 회복 메커니즘
- **"항바이러스 성분"·"합성"** — 약사의 임무 어휘

### 2.2 story·goal 인용 (`characters.js:439~444`)

> 한소희(31세)는 홍대 입구 골목의 작은 약국 원장이었다.
> 2026년 1월 14일부터 카운터 아래 노트에 이상 증상을 기록하기 시작했다. 발열, 이상 행동, 희번뜩이는 눈.
> 사흘 뒤 도시 전체가 무너졌다. 약국 약품을 챙겨 강남구 삼성병원으로 피신했다.
> **대학원 시절 천연물 화학 수업이 떠올랐다. 교수의 말이 기억났다. "가장 강한 항바이러스 성분은 식물에 있다."**
> 합성 약품이 없다면 천연에서 찾는다. 약사가 할 수 있는 일이다.

> goal: 삼성병원과 홍대 약국을 거점으로 항바이러스제를 합성하고, 이지수 의사 또는 정대한 엔지니어와의 공동 연구로 대량 생산 체계를 구축한다.

핵심: **"카운터 아래 노트"가 trauma 기록 + 동시에 회복 도구**. 정체성 정합 어휘 후보:
- "조제 노트" (pharmacy_notes) — story "카운터 아래 노트" 직접 인용. engineer sketch_notebook과 어휘 정합(노트형 자원)
- "약품 파우치" (medical_pouch) — 약사 도구 어휘
- "약통" (pill_organizer) — 조제 어휘
- "약초 분쇄기" (herb_grinder) — 천연물 어휘

### 2.3 기존 abilities 4종 (`characters.js:445~473`)

| ID | 이름 | effect |
|----|------|--------|
| pharma_kit | 약품 키트 | startingItems 7개 |
| compounding | 조제 숙련 | craftSuccessBonus 0.20 |
| natural_remedy | 천연물 지식 | toxinDetect true |
| medicine_efficacy | 약효 숙지 | bandageHpBonus 3 |

**관찰:** 4 abilities 모두 **의약·조제·해독** 영역. **morale·정서** 영역 ability 0건. `compounding`(조제 숙련)은 craftSuccessBonus 0.20으로 craft 행위 보조. Tier-2 ability는 "조제 행위 자체가 사기 회복으로 작용" 보강 — *engineer workshop_focus 패턴 정합*

### 2.4 homeless·engineer·firefighter·soldier 패턴 대비

| 항목 | homeless | engineer | firefighter | soldier | **pharmacist** |
|------|----------|----------|-------------|---------|----------------|
| 정체성 회복 메커니즘 | 거리 위안 | 작업 몰입 | 가족 결의 | 전우의 기억 | **조제 몰입** (engineer 패턴 정합) |
| Tier-2 ability 트리거 | onConsume +50% | craft·dismantle 행위 +5 | onConsume +30% | onConsume +30% | **craft 행위 +5 + onConsume 가산** (engineer 정합 보수화) |
| 신규 자원 어휘 | "사진"·"잠자리" | "설계도"·"부품" | "가족 사진" | "군번줄" | **"조제 노트"·"천연물 화학"** |
| 신규 자원 수 | 1개 + 갱신 | 1개 | 1개 | 1개 | **1개** |

**중요:** pharmacist는 `compounding` (craft 영역) + Tier-2 ability `compounding_focus` (craft morale 가산) 결합으로 **engineer workshop_focus 패턴 정합**. craft 발동 빈도 day 1회(R15-1 우회 보수화)에서 효과 추정 보수적.

---

## 3. Tier-2 ability 사양 — `compounding_focus` (조제 몰입)

### 3.1 사양

| 항목 | 결정값 |
|------|--------|
| id | `compounding_focus` |
| name | 조제 몰입 |
| nameEn | Compounding Focus |
| icon | 🧪 |
| desc | "조제·제작 행위로 사기 회복 (1회당 +3). 조제 노트 소비 시 사기·피로 동시 회복. 시작 시 조제 노트 지급." |
| effect | `{ moraleOnCraft: 3, startingItems: ['pharmacy_notes'] }` |

### 3.2 정체성 정합

- **어휘:** "조제 몰입" — story "카운터 아래 노트에 이상 증상을 기록" + "대학원 시절 천연물 화학 수업이 떠올랐다" 정합. 기존 `compounding`(조제 숙련)과 어휘 정합 (조제 = 약사 정체성 본질)
- **플레이버:** 조제·제작 행위 자체가 trauma 정합 (이상 증상 기록) + 회복 메커니즘 — *engineer workshop_focus 행위형 회복 패턴 정합*. 영웅적 회복(약물)이 아닌 *몰입형 회복*
- **abilities 4 → 5 확장 정합:** 자재(pharma_kit) + 조제(compounding) + 해독(natural_remedy) + 약효(medicine_efficacy) → 몰입(compounding_focus) — 시야 균형
- **engineer `workshop_focus` 대비 차별성:**
  - engineer: craft + dismantle 양 행위 가산 +5 each (`moraleOnCraft 5`, `moraleOnDismantle 5`)
  - pharmacist: **craft 단독 가산 +3 (보수적)** — engineer R13-1 부분 해소 + R15-1 우회 정합. dismantle 가산 미포함 (pharmacist 정체성 craft 중심)

### 3.3 effect 수치 근거 (R15-1 우회 보수화)

- `moraleOnCraft: 3` — engineer `moraleOnCraft: 5`보다 보수적 (-2). PR15 enumerate 필드 재사용. K3 추정 향상 +0.05~0.15d (engineer +0.1d 실측 정합 -0.05d 보수)
- **moraleOnDismantle 미사용** — engineer 전용 어휘(공학 분해) 와 차별. pharmacist는 조제(craft) 중심 정체성
- 협의서 v5 §3 가드레일: effect 값 범위 +3~+10 → 3은 보수적 하한
- **R15-1 우회 보수화 직접 적용:** craft 발동 빈도 day 1회 가정 → moraleOnCraft 3은 day 1회 +3 morale. 추정 효과 +0.05~0.15d (engineer +0.1d 패턴 정합)

### 3.4 기존 abilities와의 관계

`compounding` (craftSuccessBonus 0.20) + `compounding_focus` (moraleOnCraft 3) → **craft 행위 1회당 2개 ability 동시 발동**. 시너지 정합 (engineer engineering_intuition + workshop_focus 패턴 정합). 조제 성공률 ↑ + 사기 회복 ↑ → 약사 정체성 일관

`natural_remedy` (toxinDetect) + `compounding_focus` → 천연물 식별 + 조제 몰입 결합. 약초 채집 → 조제 행위 → morale 회복 루프 정합.

---

## 4. 신규 자원 결정 (후보 비교 + 권고)

### 4.1 후보 매트릭스

| 후보 | 변경 위치 | morale 회복량 | 정체성 정합 | 4곳 등록 룰 | K3 향상 추정 |
|------|-----------|---------------|-------------|-------------|--------------|
| A | 신규 `pharmacy_notes` (조제 노트) | +8 | ⭐⭐⭐⭐⭐ (story "카운터 아래 노트" + "천연물 화학 수업" 직접 인용) | 4곳 신규 등록 | +0.1~0.2d (R15-1 우회) |
| B | 신규 `medical_pouch` (약품 파우치) | n/a (도구) | ⭐⭐⭐ (pharma_kit과 어휘 중복) | 4곳 신규 등록 | +0.0d (도구) |
| C | 신규 `pill_organizer` (약통) | n/a (도구) | ⭐⭐⭐ (약사 도구) | 4곳 신규 등록 | +0.0d (도구) |
| D | 신규 `herb_grinder` (약초 분쇄기) | n/a (도구) | ⭐⭐⭐⭐ (story "천연물" 정합) | 4곳 신규 등록 | +0.0d (도구 — 후속 PR에서 herb 채집과 결합 시 효과 가능) |
| E | `painkiller` `onConsume.morale` 가산 (기존 pharma_kit 포함) | n/a | ⭐⭐ (기존 효과 흐림) | 미적용 | 거절 (의약품 의미 변화) |

### 4.2 권고: **A 단독 채택**

**근거:**

1. **A 단독 (pharmacy_notes)**: morale +8는 worn_photo(+12)·sketch_notebook(+10)·family_photo(+10)·dog_tag(+10) 대비 보수적 (-2). story "카운터 아래 노트" + "천연물 화학" 직접 인용으로 정체성 정합 최강. R15-1 우회 보수화 정합 + Tier-2 ability moraleOnCraft +3 가산과 결합 효과
2. **B·C·D 거절** — morale 효과 0d. 본 SCN_QUEST 영역 외. D는 후속 PR에서 herb 채집과 결합 시 잠재 효과
3. **E 거절** — painkiller·antiseptic 등 기존 의약품에 onConsume.morale 가산은 7직업 동시 효과 위험 (R11-1 가속) + 의약품 의미 흐림
4. **firefighter·soldier 1개 사양 정합** — 직업 형평성

### 4.3 양적 검증 (baseline v10 morale 시계열 추정 → v11 추정)

baseline v10 pharmacist K5 절망 40건 (7직업 중 doctor 98·chef 83·soldier 50 다음 네 번째). morale<30 도달율 추정 ≥ 40%.

| 시점 | morale (v10 측정 추정) | morale (v11 추정 with compounding_focus + pharmacy_notes) |
|------|------------------------|----------------------------------------------------------|
| day 1 시작 | 100 | 100 |
| day 1 craft 발동 day 1회 | n/a | +3 (cap 유지) |
| day 2 (decay 후) | ~50 (절망 진입 회차) | ~50 |
| day 3 craft 발동 | n/a | +3 (cap 보존) |
| day 3~4 morale<30 도달 | ~25 | pharmacy_notes 소비 → +8 (cap effect 미적용, defaultDurability 3 시 1회) = 33 (actBoostMorale 분기 해제) |
| day 4~5 | 절망 사망 | morale 회복 → nutrition·fatigue 결핍으로 사인 전이 |

**추정 K3 향상:** +0.1~0.3d (R15-1 우회 보수화. pharmacist v10 4.10 → v11 4.20~4.40). 절망 사망 40 → 25~32 추정 (-8~-15건). 사인 전이로 아사 +5~+10건 추정.

---

## 5. startingItems 사양

### 5.1 현행 (`characters.js:451`)

```js
effect: { startingItems: ['painkiller', 'antiseptic', 'antiseptic', 'bandage', 'instant_noodles', 'instant_noodles', 'contaminated_water'] }
```

7 아이템 / `onConsume.morale > 0` 0건.

### 5.2 정정 (PR16 후보)

```js
// pharma_kit (기존, 변경 0)
effect: { startingItems: ['painkiller', 'antiseptic', 'antiseptic', 'bandage', 'instant_noodles', 'instant_noodles', 'contaminated_water'] }

// compounding_focus (신규, Tier-2)
effect: { moraleOnCraft: 3, startingItems: ['pharmacy_notes'] }
```

**변경 요약:**
- 기존 pharma_kit 변경 0 (firefighter·soldier 패턴 정합)
- `pharmacy_notes` 1개 신규 추가 (Tier-2 ability에 startingItems 배치)
- 합계 7 → **8 아이템** (homeless 10 / engineer 9 / firefighter 7 / soldier 8 / pharmacist 8 — 보수적 균형)

---

## 6. 신규 아이템 정의 + 4곳 등록 룰

### 6.1 신규 — `pharmacy_notes` (조제 노트)

| 항목 | 값 |
|------|-----|
| definitionId | `pharmacy_notes` |
| name | 조제 노트 |
| nameEn | Pharmacy Notes |
| type | `consumable` |
| subtype | `keepsake` (homeless worn_photo·engineer sketch_notebook·firefighter family_photo·soldier dog_tag와 공유) |
| rarity | `common` |
| weight | 0.10 |
| defaultDurability | 3 (sketch_notebook 패턴 정합 — 3회 사용 가능) |
| defaultContamination | 0 |
| icon | 📔 |
| description | "홍대 약국 카운터 아래에 두던 조제 노트. 1월 14일부터의 이상 증상 기록과 대학원 시절 천연물 화학 메모가 빼곡하다. 펼쳐 보면 잠시 차분해진다." |
| tags | `['consumable', 'keepsake', 'pharmacist']` |
| onConsume | `{ morale: 8, fatigue: -3 }` |
| dismantle | `[{ definitionId: 'paper', qty: 1, chance: 0.8 }]` (분해 시 paper 산출 — engineer sketch_notebook 패턴 정합, 약사 재료 정합. paper 정의 미존재 시 후속 PR에서 정의 또는 cloth 폴백) |

**플레이버 어휘 근거:**
- "홍대 약국" — `characters.js:439` story 직접 인용
- "카운터 아래" — `characters.js:440` story "카운터 아래 노트" 직접 인용
- "1월 14일" — `characters.js:440` story 직접 인용
- "대학원 시절 천연물 화학" — `characters.js:442` story 직접 인용

### 6.2 4곳 등록 룰 (CLAUDE.md §3 + 협의서 v5 §4 가드레일)

**pharmacy_notes 신규 아이템에 4곳 등록 의무:**

| 등록처 | 항목 | 사양 |
|--------|------|------|
| 1. `js/data/items_misc.js` 또는 `items_medical.js` | 정의 추가 | §6.1 사양 그대로 ("약사 전용 아이템" 신규 섹션 또는 keepsake 공통 섹션) |
| 2. `js/data/stackConfig.js` | 스택 등록 | `['pharmacy_notes', false, 1]` (단일 아이템, 비stackable — keepsake 패턴 정합) |
| 3. `js/data/districts.js` lootTable | 등장 구 | **미등록** (pharmacist 전용 시작 아이템, lootTable 미진입으로 직업 정체성 보호) |
| 4. `js/ui/CardFactory.js` CARD_IMAGES | 이미지 매핑 | `'pharmacy_notes': 'assets/cards/pharmacy_notes.png'` 또는 기본 이모지 폴백 (📔) |

**기존 아이템 변경 0:**
- painkiller·antiseptic·bandage·instant_noodles·contaminated_water 정의 변경 없음
- pharmacist startingItems 수량 변경 0 (pharma_kit 변경 0)
- 다른 직업 변경 0 (협의서 v5 §4 가드레일 정합)

---

## 7. 6 게이트 검수 (`DIR_GATE_chef_start_environment.md` 패턴)

### 7.1 Tier-2 ability `compounding_focus` 게이트

| 게이트 | 결과 | 근거 |
|--------|------|------|
| (1) 직업 정체성 | ✅ 통과 | "조제 몰입" 어휘 + story "카운터 아래 노트" + "천연물 화학 수업" 정합. abilities 4 영역(자재·조제·해독·약효) → 5 영역(몰입) 자연 확장. engineer workshop_focus 패턴 정합 |
| (2) 생존 균형 | ✅ 통과 (R11-1 보호 정합) | K3 +0.1~0.3d 향상 추정 (R15-1 우회 보수화). **pharmacist cookingLv 1로 정의 2 비포함 → 정의 2 영향 0.** chef 격차 정의 1 v10 +0.567d → v11 +0.527~+0.547d 추가 좁힘 추정 (-0.02~-0.04d). chef SCN_QUEST 효과 우세로 정의 1 +1.0d 회복 안전 범위 |
| (3) 플레이 유지 | ✅ 통과 | craft 행위마다 morale +3 가산이 게임 루프(채집→조제→탐색) 보강. pharmacy_notes 1회 소비로 추가 회복 — 약사 정체성 정합 |
| (4) 서사 결합 | ✅ 통과 | pharmacist 메인 퀘스트 후속 연계 가능 ("항바이러스제 합성" + "조제 노트" 모티프). NPC 결합 가능 (이지수·정대한 공동 연구) |
| (5) 도구 호환 | ✅ 통과 | pharmacy_notes 4곳 등록 룰 §6.2 그대로. validate.js 통과 의무. fingerprint 영향 0 (BALANCE 미관여) |
| (6) 측정 가능성 | ✅ 통과 | baseline v11 probe 의무: pharmacist day 1~5 morale 시계열 + craft 발동 회수 + pharmacy_notes 소비 회수 + actBoostMorale 발동 회수 |

**6 게이트 전수 통과.** → **통과.**

### 7.2 R11-1 chef 격차 보호 검토 (협의서 v5 §6.4 정합)

**baseline v11 추정 (pharmacist K3 4.10 → 4.20~4.40 + firefighter 5.00 → 5.10~5.30 + soldier 4.50 → 4.60~4.80 + chef K3 5.20 → 5.7~6.0 합산):**

| 정의 | v10 측정 | v11 추정 (pharmacist 단독) | v11 추정 (chef + firefighter + soldier + pharmacist 합산) | R11-1 트리거 |
|------|---------|--------------------------|------------------------------------------------------------|-------------|
| 정의 1 (6직업 평균) | +0.567d | +0.527~+0.547d (-0.02~-0.04d) | **+0.85~+1.35d** (chef 효과 우세, 3직업 합산 추가 좁힘 -0.10~-0.15d 흡수) | ✅ 회복 (1차 KPI +1.0d 회복 임계 도달) |
| 정의 2 (cooking lv 0 5직업) | +0.46d | **변화 0 (pharmacist cookingLv 1 비포함)** | **+0.7~+1.05d** (chef + firefighter + soldier 3직업 합산 효과) | ✅ 회복 (2차 KPI +0.5d 회복) |

**핵심 단정:**
- **pharmacist 단독으로는 정의 2 영향 0** (cookingLv 1로 정의 2 비포함, homeless §7.2 패턴 정합)
- **pharmacist 단독으로는 정의 1 -0.02~-0.04d 좁힘 (보수적)** — R11-1 사전 등록 트리거 회피
- **4 SCN_QUEST 합산 시 격차 +0.7~+1.35d 회복** — chef SCN_QUEST의 K3 +0.7d 효과가 1차 KPI(+1.0d) 회복 담당
- 권고: pharmacist Tier-2 사양 그대로 유지

### 7.3 pharmacy_notes 게이트

| 게이트 | 결과 |
|--------|------|
| (1) 직업 정체성 | ✅ "홍대 약국"·"카운터 아래"·"1월 14일"·"천연물 화학" 직접 인용 |
| (2) 생존 균형 | ✅ morale +8는 worn_photo(+12)·sketch_notebook(+10) 대비 보수적 (-2~-4). defaultDurability 3으로 누적 +24 가능. compounding_focus craft 가산과 결합 시 day 1~5 morale 안정 |
| (3) 플레이 유지 | ✅ 3회 사용 후 dismantle로 paper 1개 산출 가능 — pharmacist craft 재료 회수 정합 |
| (4) 서사 결합 | ✅ pharmacist 메인 퀘스트 후속 ("항바이러스제 합성" + "이지수·정대한 공동 연구" 모티프) |
| (5) 도구 호환 | ✅ 4곳 등록 룰 §6.2. lootTable 미등록 (직업 정체성 보호) |
| (6) 측정 가능성 | ✅ baseline v11 `actBoostMorale` 발동 분포에서 pharmacy_notes 소비 회수 측정 가능 |

**6 게이트 전수 통과.** → **통과.**

---

## 8. PR16 patch diff 후보

### 8.1 `js/data/characters.js` (line 445~473 영역, pharmacist abilities)

```diff
     abilities: [
       {
         id: 'pharma_kit',
         name: '약품 키트',
         icon: '💊',
         desc: '진통제·소독약 2개·붕대 추가 지급',
         effect: { startingItems: ['painkiller', 'antiseptic', 'antiseptic', 'bandage', 'instant_noodles', 'instant_noodles', 'contaminated_water'] },
       },
       {
         id: 'compounding',
         name: '조제 숙련',
         icon: '🧪',
         desc: '의약품 제작 성공률 +20%',
         effect: { craftSuccessBonus: 0.20 },
       },
       {
         id: 'natural_remedy',
         name: '천연물 지식',
         icon: '🌿',
         desc: '독성 음식 섭취 전 경고',
         effect: { toxinDetect: true },
       },
       {
         id: 'medicine_efficacy',
         name: '약효 숙지',
         icon: '🩹',
         desc: '의료 아이템 사용 효과 향상 (붕대 사용 시 HP +3 추가 회복)',
         effect: { bandageHpBonus: 3 },
       },
+      {
+        id: 'compounding_focus',
+        name: '조제 몰입',
+        icon: '🧪',
+        desc: '조제·제작 행위 1회당 사기 +3 회복. 조제 노트 소비 시 사기·피로 동시 회복. 시작 시 조제 노트 지급.',
+        effect: {
+          moraleOnCraft: 3,
+          startingItems: ['pharmacy_notes'],
+        },
+      },
     ],
```

**변경 라인:** 약 10라인 추가. 영향: `characters.js:445~486`.

### 8.2 `js/data/items_misc.js` 또는 `items_medical.js`

신규 `pharmacy_notes` 정의 추가:

```diff
+  // ─── 약사 전용 아이템 ──────────────────────────────────────
+  // 한소희 시작 지급 아이템 — compounding_focus ability 트리거 자원
+
+  pharmacy_notes: {
+    id: 'pharmacy_notes', name: '조제 노트', type: 'consumable', subtype: 'keepsake',
+    rarity: 'common', weight: 0.10,
+    defaultDurability: 3, defaultContamination: 0,
+    icon: '📔', description: '홍대 약국 카운터 아래에 두던 조제 노트. 1월 14일부터의 이상 증상 기록과 대학원 시절 천연물 화학 메모가 빼곡하다. 펼쳐 보면 잠시 차분해진다.',
+    tags: ['consumable', 'keepsake', 'pharmacist'],
+    onConsume: { morale: 8, fatigue: -3 },
+    dismantle: [{ definitionId: 'paper', qty: 1, chance: 0.8 }],
+  },
```

**변경 라인:** 약 11라인 추가.

### 8.3 `js/data/stackConfig.js` (군인 전용 섹션 다음)

```diff
   // — 군인 전용 아이템 —
   ['dog_tag'                   , false, 1 ],
+
+  // — 약사 전용 아이템 —
+  ['pharmacy_notes'            , false, 1 ],
```

**변경 라인:** 3라인 추가 (섹션 헤더 2줄 + 등록 1줄).

### 8.4 `js/ui/CardFactory.js` CARD_IMAGES

시스템 백승호 위임 — `pharmacy_notes` 이미지 매핑 추가 (기본 이모지 폴백 가능).

### 8.5 검증 명령

```
node --input-type=module js/data/validate.js
# 기대: Errors 0 / ALL CLEAR
# 단 pharmacy_notes dismantle paper 산출 → paper 정의 미존재 시 dangling reference 경고 가능
# 폴백: dismantle을 [] 또는 cloth 폴백으로 변경 (SCN_QUEST_engineer §10.5 위임 트리거 정합)

node tools/sim/v2/run_baseline.mjs
# 기대: fingerprint len316-h242a5b5f 유지 (BALANCE 미변경 단정)
#       buildTag sim-baseline-v11-pr16
#       pharmacist K3 v10 4.10 → v11 4.20~4.40 추정 (R15-1 우회 보수화)
#       pharmacist 절망 사망 v10 40 → v11 25~32 추정 (-8~-15건)
#       사인 전이 아사 +5~+10건 (baseline v10 사인 전이 패턴 정합)
```

### 8.6 PR16 patch diff 총 라인 수 추정 (pharmacist 단독)

| 파일 | 변경 라인 |
|------|----------|
| characters.js | +10 |
| items_misc.js 또는 items_medical.js | +11 (pharmacy_notes 신규) |
| stackConfig.js | +3 (섹션 헤더 + 등록) |
| CardFactory.js | +1 (이미지 매핑) |
| **합계** | **+25 (총 ~25 변경)** |

---

## 9. baseline v11 측정 트리거 (보수적 K3 추정)

### 9.1 의무 probe (pharmacist 단독)

| probe | 측정 대상 | 합격 기준 (R15-1 우회 보수화) |
|-------|----------|------------------------------|
| 1. pharmacist K3 | mean·median 사망일 | v10 4.10 → v11 ≥ 4.20 (+0.10d 이상, R15-1 우회 보수화) |
| 2. pharmacist 절망 사망 | K5 deathCause 절망 count | v10 40 → v11 ≤ 32 (-8 이상) |
| 3. pharmacist 아사 사망 | K5 deathCause 아사 count | v10 51 → v11 51~61 (사인 전이 +5~+10건) |
| 4. pharmacist morale<30 도달율 | runs[*] morale 시계열 day 1~5 | day 5 도달율 ≤ 60% (v10 절망 40건 정합) |
| 5. pharmacist craft 발동 회수 + compounding_focus morale 가산 누적 | playerAI.mjs craft 분기 + morale delta | day 시작 1회 craft (R15-1 우회 정합) → morale +3 발동 ≥ 80/100 |
| 6. pharmacy_notes 소비 회수 + 잔여 사용 회수 | inventory durability 추적 | pharmacy_notes 1~3회 사용/회차 (defaultDurability 3) |
| 7. chef 격차 정의 1 | chef vs 6직업 평균 | **chef + firefighter + soldier + pharmacist 합산 시 +0.85~+1.35d 회복 추정** (chef SCN_QUEST의 K3 +0.7d 효과 우세, 1차 KPI +1.0d 회복 임계 도달) |
| 8. chef 격차 정의 2 | chef vs cooking lv 0 5직업 평균 | **pharmacist 영향 0 (cookingLv 1 비포함). chef + firefighter + soldier 합산 효과로 +0.7~+1.05d 회복 추정** |
| 9. fingerprint | drift.balanceLeafTotal hash | `len316-h242a5b5f` 유지 |
| 10. validate.js | items.js / blueprints.js / stackConfig.js 정합 | Errors 0 / ALL CLEAR |

### 9.2 K3 향상 추정 (R15-1 우회 보수화)

baseline v10 pharmacist K3 4.10 → v11 추정:
- **R15-1 우회 보수화 적용:** PR15 실측 패턴(engineer +0.1d) 정합 → pharmacist +0.1d 보수
- moraleOnCraft 3 (engineer 5보다 -2 보수) → effect 수치 차이 추가 -0.05d 추정. 단 pharmacy_notes 소비 효과 +0.05d 추가
- **추정 v11 K3 = 4.20~4.40 (Δ +0.1~0.3d)**

### 9.3 4 SCN_QUEST 합산 효과 (위협 평가)

| 직업 | v10 K3 | v11 K3 추정 | v11 day 100 도달 |
|------|--------|------------|----------------|
| chef | 5.20 | 5.7~6.0 (chef SCN_QUEST 효과 우세) | 0~3건 |
| firefighter | 5.00 | 5.10~5.30 | 0~2건 |
| soldier | 4.50 | 4.60~4.80 | 0~1건 |
| **pharmacist** | **4.10** | **4.20~4.40** | 0~1건 (보수적) |
| 합산 (chef + 3직업) | - | - | **chef 격차 정의 1 +0.85~+1.35d 회복 / 정의 2 +0.7~+1.05d 회복** |

**핵심 단정:**
- pharmacist K3 +0.1~0.3d는 chef 격차 정의 1 추가 좁힘 -0.02~-0.04d 수준 (보수적)
- **chef 격차 정의 2에는 영향 0** (cookingLv 1로 비포함)
- 4 SCN_QUEST 합산 시 chef SCN_QUEST의 K3 +0.7d 효과가 격차 +1.0d 회복 담당. **R11-1 사전 등록 트리거 회피 + 1차 KPI(+1.0d 회복) 달성 가능**

---

## 10. 위험과 완화

### 10.1 pharmacist K3 +0.3d 초과 (격차 추가 좁힘 위험)

**트리거:** baseline v11 측정에서 pharmacist K3 ≥ 4.5 (Δ ≥ +0.4d). chef 격차 정의 1 추가 좁힘 -0.07d 이상.
**완화:**
- (a) `moraleOnCraft` 3 → 2 하향 (격차 추가 좁힘 폭 축소)
- (b) `pharmacy_notes` `onConsume.morale` 8 → 5 하향
- 권고: (a) 우선 — PR15 enumerate 필드 직접 조정

### 10.2 pharmacy_notes dismantle paper 산출 vs paper 정의 부재

**트리거:** `pharmacy_notes` dismantle `paper` 산출 정의 시 `items_misc.js` paper 정의 0건이면 dangling reference.
**완화:** SCN_QUEST_engineer §10.5 위임 트리거와 동일. 시스템 백승호 PR16 구현 시 paper 정의 검증. paper 미정의 시:
- (a) paper 신규 정의 추가 (engineer sketch_notebook + pharmacist pharmacy_notes 공통 산출)
- (b) dismantle 산출을 `cloth` 1개로 변경 (보수적 폴백)
**권고:** (a) — paper는 게임 전반 정합 자원. 단 paper 정의 추가는 본 PR16 영역 외 검토 의무

### 10.3 R15-1 우회 실패 (실측 +0.1d 미달)

**트리거:** baseline v11 측정에서 pharmacist K3 +0.1d 미달.
**완화:** 협의서 v5 §10.3 R15-1 우회 실패 폴백 트리거 정합. pharmacist는 engineer 패턴 정합(craft 행위형 회복)이라 R15-1 craft 발동 빈도 영향 직접 받음. PR17 craft 발동 빈도 보강 트랙(`actCook` morale<30 추가 발동 또는 `actInteractCraft` 빈도 증가) 진입 후 baseline v12 재측정 의무

### 10.4 신규 subtype `keepsake` 의존

**트리거:** items.js 검증에서 `subtype: 'keepsake'` 미등록 경고 (5 직업 동시 keepsake 자원 보유: homeless·engineer·firefighter·soldier·pharmacist).
**완화:** 시스템 백승호 `keepsake` 신규 등록 결정 후 pharmacy_notes도 동일 subtype 사용. 5 직업 동시 keepsake 어휘 정합 (가족·전우·동료·작업·조제 기억)

### 10.5 `moraleOnCraft` 필드 충돌 (engineer와 동일 필드)

**트리거:** `moraleOnCraft` 필드를 engineer·pharmacist 양 직업 ability가 보유. sim 가산 분기 적용 정합 검증 의무.
**완화:** PR15 `_grantCraftMorale` 함수 (시스템 백승호 1차 단정 인용)는 `GameState.player.moraleOnCraft` 단일 값 가산. pharmacist도 동일 분기 발동 단정. ability별 effect 값 차이(engineer 5 vs pharmacist 3)는 GameState 초기화에서 ability별 값으로 반영 — 시스템 백승호 검증 의무

### 10.6 4 SCN_QUEST 동시 진입 시 정의 1 추가 좁힘 누적

**트리거:** chef + firefighter + soldier + pharmacist 4 직업 동시 K3 향상 시 정의 1 격차 추가 좁힘 -0.10~-0.20d 누적. 단 chef SCN_QUEST의 K3 +0.7d 효과가 우세하면 격차 회복 +0.85~+1.35d 도달.
**완화:** baseline v11 측정 §4.1 직업별 분리 측정 (협의서 v5 §6.4 §9.3) 의무로 chef 효과 단정. 미달 시 PR16.1 재조정(4 직업 effect 일괄 하향) 후속 트랙

### 10.7 craft 발동 빈도 day 시작 1회 가정 검증 실패

**트리거:** baseline v11 측정에서 pharmacist craft 발동 0회/회차 측정 (R15-1 우회 가정 day 1회 미달).
**완화:** sim AI가 craft 우선순위를 낮게 평가하는 경우. `playerAI.mjs` `runDayAI` 분기 조정 (시스템 백승호 위임) — pharmacist는 cookingLv 1로 actCook 우선순위 작동 정합. 단 craft (제작) 발동은 본체 별도 분기. baseline v11 측정 결과 0회 시 PR17 craft 발동 빈도 보강 트랙 진입

---

## 11. 결정 단언

| 항목 | 결정 |
|------|------|
| Tier-2 ability `compounding_focus` 신설 | **통과** (6 게이트 전수 통과) |
| 신규 아이템 `pharmacy_notes` 도입 | **통과** (6 게이트 전수 통과) |
| `moraleOnCraft: 3` (engineer 5보다 보수적) | **통과** (R15-1 우회 보수화 정합) |
| startingItems 7 → 8 확장 | **통과** (보수적 균형 정합) |
| 4곳 등록 룰 적용 | **통과** (pharmacy_notes 4곳 신규) |
| R11-1 chef 격차 보호 | **통과** (단독 정의 1 -0.02~-0.04d, 정의 2 영향 0. chef+3직업 합산 시 정의 1 +0.85~+1.35d 회복) |
| PR16 패치 diff 총 변경량 (pharmacist 단독) | ~25라인 (characters.js +10 / items_misc.js +11 / stackConfig.js +3 / CardFactory.js +1) |
| 다음 트리거 | 시스템 백승호 PR16 머지 (chef + 3직업 합산 또는 분리) → baseline v11 측정 (밸런스 권지나) → R11-1 해소 단정 + pharmacist K3 +0.1~0.3d 단정 |

---

*문서 끝. baseline v11 측정 결과 도착 시 §9.1 probe 검증 + R11-1 해소 단정 + chef + firefighter + soldier + pharmacist 4 SCN_QUEST 합산 효과 단정. R15-1 우회 보수화 정합 검증 의무. pharmacy_notes dismantle paper 산출 vs paper 정의 부재는 SCN_QUEST_engineer §10.5와 동일 위임 트리거.*
