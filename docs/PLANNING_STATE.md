# 기획 현황 종합 — 2026-05-13 기준

> **최신 기획서 종합 정리.** M3 트랙 공식 종결 직후, M4 진입 대기 시점의 기획 상태 단정.
> 작성: 2026-05-13 / 기준: 협의서 v5 §15 트랙 정체성 + PD_MILESTONE_M3_close.md 마감 단언

---

## 1. 게임 정체성 (확정)

**Card Survival: Ruined City** — 카드 기반 도시 폐허 생존 게임. 25개 구 + 한강 장벽 지형, 7직업 분기, 시간/날씨/위협 시스템.

### 1.1 기술 스택 (확정)
- 바닐라 JS 모듈 + CSS 변수 + Vite 번들러
- 고정 해상도 1920×1080 (Scale 방식, `main.js`)
- 멀티 플랫폼: Capacitor (Android/iOS), Electron (PC)

### 1.2 보드 레이아웃 룰 (확정)
- 장소/바닥: 10칸 flex, `flex: 1 1 0`
- 휴대: 20칸 `grid 10열×2행`, 가방 시 `extraSlots` 해금
- 슬롯 수: `ROW_CONFIG.slots` 단일 진리 (GameState 배열 직접 참조 금지)

### 1.3 디자인 시스템 (확정)
- 단일 진리: `DESIGN.md` + `css/variables.css`
- 토큰 기반 (`--stat-nutrition`, `--stat-hydration` 등)
- UI/비주얼 결정 시 디자인 가이드 우선

---

## 2. 7직업 정체성 + Tier-2 abilities (M3 완결)

| 직업 | Tier-2 ability | 신규 자원 | 정체성 |
|------|---------------|-----------|--------|
| **chef** | `pantry_mastery` (식자재 보존술 🥫, moraleRecoveryBonus 1.6) | chef_journal 📔 / spice_blend 🧂 / **chef_meal_kit** 🍱 / **hearty_stew** 🍲 | 명동 소피텔 호텔 주방 — 요리·재료 보존 |
| **homeless** | `street_solace` (거리의 위안 🕯️, moraleRecoveryBonus 1.5 / lowMoraleRecoveryFatigueBonus -5) | worn_photo 📷 / newspaper_bundle 갱신 | "이미 한 번 다 잃었으니까" — 잠자리·신문 |
| **engineer** | `workshop_focus` (작업 몰입 🔧, moraleOnCraft 5 / sketchNotebookBonus true) | sketch_notebook 📓 | "설계도를 그리기 시작했다" — 점검·작업지시서 |
| **firefighter** | `rescue_resolve` (구조의 결의, moraleRecoveryBonus 1.3) | family_photo 📸 | 구조 — 가족 |
| **soldier** | `comrade_memorial` (전우의 기억, moraleRecoveryBonus 1.2) | dog_tag 🪖 | 전우 — 군번줄 |
| **pharmacist** | `compounding_focus` (조제 몰입, moraleOnCraft 3) | pharmacy_notes 📋 | 조제 — 약학 노트 |
| **doctor** | (M0 hotfix 후 안정, Tier-2 후순위) | — | 응급실 |

### 2.1 chef 격차 KPI (시뮬, M3 트랙 핵심 목표)
- **격차 정의 1 (5직업 평균):** +1.50d → **+1.2917d** ★ 1차 KPI 1.29배 달성
- **격차 정의 2 (6직업 평균):** +1.33d → **+1.2660d** ★ 2차 KPI 2.53배 달성
- **chef K3:** 4.5 → **6.10** (3차 KPI ≤ 6.5 안전)

### 2.2 시뮬 R11-1 완전 해소 단언 (협의서 v5 §16, 시뮬 트랙 안)
PR17 (`chef_meal_kit` + `hearty_stew`)로 chef high-nutrition 자원 보강 → baseline v14 정식 단언.

---

## 3. 핵심 시스템 결정 사항

### 3.1 5곳 등록 룰 (M3 표준 운영 정의, 협의서 v5 §16.3)

**신규 자원 추가 시 다음 5곳 모두 등록 의무.** 미등록 시 시뮬 K3 효과 0.

1. `js/data/items_misc.js` (또는 items_base/combat/medical/tech/tools/structures 등) — 아이템 정의
2. `js/data/stackConfig.js` — 스택 룰
3. `js/factories/CardFactory.js` CARD_IMAGES — 이미지 매핑
4. `js/data/characters.js` startingItems — 시작 인벤토리
5. `tools/sim/v2/playerAI.mjs:130~133 actEat candidates` — 시뮬 효과 발현 (5곳째 신규)

**첫 적용 검증:** PR17 (`chef_meal_kit`·`hearty_stew`) — baseline v14에서 100/100 runs 완전 소비. actEat candidates 등록이 시뮬 K3 효과 발현의 필요·충분 조건 단언.

### 3.2 시뮬-게임 본체 분리 단정 (협의서 v5 §15)

**M3 트랙은 "시뮬 정합 게임 데이터 작성" 트랙으로 정체성 단정.**
- baseline KPI(K1·K3·K5·chef 격차)는 *시뮬 K1 마지노선*
- 게임 본체 K1 검증은 **M4+ 텔레메트리 트랙**으로 분리
- 모든 R/KPI 단언은 시뮬 도구 안에서 해석

### 3.3 fingerprint 결정성 (확정)

`balanceFingerprint` = `len316-h242a5b5f`. v3~v14 **12연속 유지** — BALANCE leaf 결정성 완전 보존.

### 3.4 sublocation 1회 한정 보상 패턴 (PR9 도입)

`landmarks.js`의 `firstEnterReward` 필드 (`claimKey` + `items`) → `ExploreSystem._grantFirstEnterReward`가 `GameState.flags.firstEnterRewardsClaimed`로 중복 차단.
- 첫 활용: hangang sublocation 진입 시 `fishing_rod_basic` 1회 자동 지급 (claimKey `hangang_rod` 공유로 2 sublocation 합산 1회)

### 3.5 needs-aware 산식 (PR10 도입, 시뮬)

`tools/sim/v2/playerAI.mjs:172-201` `actCook` benefit 산식:
```js
const needsNutrition = nutCur < nutMax * 0.5;
const benefit = needsNutrition ? (n * 3 + h) : (n + h * 1.5);
```

### 3.6 interactions T1 모사 (PR12+T1, 시뮬)

`tools/sim/v2/playerAI.mjs` T1_TRANSFORMS 4 규칙 + `actT1Convert` + `runDayAI` 폴백 호출. cooking lv 0 한정 발동.
- 예: `instant_noodles` + `boiled_water` → `cooked_noodles`

### 3.7 craft 발동 빈도 임계 (PR16, 시뮬)

`runDayAI` nutrition<50 OR morale<30 임계 추가 craft. R15-1 (SCN_QUEST 추정-실측 격차) 완전 해소.

### 3.8 ability bonus 4필드 가산 분기 (PR15, 시뮬)

`tools/sim/v2/playerAI.mjs` 가산:
- `moraleRecoveryBonus` (×배율)
- `lowMoraleRecoveryFatigueBonus` (저 morale 시 fatigue 페널티 감소)
- `moraleOnCraft` (+값)
- `sketchNotebookBonus` (engineer 전용 ×1.5)
- skip: `moraleOnDismantle` (시뮬에 dismantle 행동 없음 → R13-1 부분 해소)

---

## 4. baseline 측정 추세 (v3 → v14 → ★ v15 결정성 수정)

| KPI | v3 | v14 | 목표 | 충족 |
|-----|----|-----|------|------|
| K1 (전 직업) | 0% | 0% (15회 연속) | ≥ 5% | ❌ (시뮬-본체 분리 단정, M4 텔레메트리 이전) |
| chef K3 | 4.5 | **6.10** | ≤ 6.5 | ✅ 마진 0.4d |
| chef 격차 정의 1 | +1.50d | **+1.29d** | ≥ +1.0d | ✅ 1.29배 |
| chef 격차 정의 2 | +1.33d | **+1.27d** | ≥ +0.5d | ✅ 2.53배 |
| K5 절망 사망 | 110 | 224 (peak 405 → 224) | ↓ | ⚠️ 44.7% 회수 |
| K5 아사 사망 | 555 | 373 | ↓ | ✅ |
| `actFish` 발동 (4 hasFishing) | 0 | 52~63/100 | ≥ 1/day | ✅ |
| `actCook` 발동 (chef) | 0 | 100/100 | ≥ 1/day | ✅ |

상세 데이터: [`/simulation-data/`](../simulation-data/README.md)

### 4.1 ★ baseline v15 — 결정성 수정 (2026-06-05, 신 기준선)

`tools/sim/v2/gameStateReset.mjs` 회차 간 상태 누수 버그 수정 후 **6직업(출시 확정 범위) 재측정**. 보고서: `simulation-data/baselines/reports/BAL_SIM_baseline_v15_report.md`.

| 항목 | v14 (누수, 7직업) | v15 (수정, 6직업) | 단정 |
|------|------------------|-------------------|------|
| K1 전 직업 | 0% | 0% | 유지 (시뮬-본체 분리) |
| fingerprint | len316-h242a5b5f | **동일** | 데이터 무변경 |
| K5 절망 사망 (6직업 600회 정규화) | 208 | **6** | ★ **누수 `mental` 전이로 과대 계상**. 진값 사실상 0 |
| K5 아사 사망 (정규화) | 302 | **506** | 진짜 1위 사인 = 아사 84% |
| chef K3 | 6.1 | **7.7** | 누수 제거로 격차 +2.86d 강화 |
| doctor K3 | 4.9 | **4.2** | 진값 하향 교정 |

**핵심 단정:** v3~v14의 "절망 사망 1위" 분포는 **결정성 누수의 측정 인공물**. 수정 후 절망은 비병목, **아사(영양)가 본질 병목**. M3의 morale/절망 중심 KPI는 밸런스 권지나 재해석 권고. chef 격차 결론(R11-1)은 유지·강화. **v15가 이후 baseline 출발점**, v3~v14는 누수 포함 과거 기록.

---

## 5. M3 PR 트랙 (10단계 + 보조 3건 = 11건)

| PR | 분류 | 핵심 변경 | 효과 |
|----|------|---------|------|
| PR7 | 시뮬 | actCook / actFish / actBoostMorale 3 AI 도입 | chef +0.5d K3 |
| PR8 | data | 7직업 startingItems + 6 시작 구 lootTable raw food | chef +0.7d (격차 +2.2d 일시 확대) |
| PR9 | data | hangang sublocation fishing_rod 자동 지급 (firstEnterReward) | actFish 52~63/100 발동 |
| PR10 | 시뮬 | actCook needs-aware 산식 | homeless +0.9d 단독 |
| PR11 | data | 25구 lootTable raw food (8/4 가중치) | 변화 0 (설계 결함 단정) |
| PR12+T1 | 혼합 | fishing 0.30→0.50 + T1_TRANSFORMS 모사 | cooking lv 0 4직업 K3 +0.9~2.0d |
| PR13 | data | homeless·engineer Tier-2 + 자원 3종 | engineer +0.5d / R8-1 부분 완화 |
| PR14 | data | chef·firefighter·soldier·pharmacist Tier-2 + 자원 5종 | chef +0.20d / R11-1 정의 2 해소 |
| PR14.1 | data | pantry_mastery 1.6 + chef_journal 13 | 미미 (구조적 한계 단정) |
| PR15 | 시뮬 | ability bonus 4필드 가산 분기 | R8-1 추가 -74 / R13-1 부분 해소 |
| PR16 | 시뮬 | nutrition<50 OR morale<30 craft 임계 | homeless +0.40d / R15-1 완전 해소 |
| PR16.1 | data | comrade_memorial 1.3→1.2 | soldier -0.04d (보수) |
| PR17 | data + 시뮬 | chef_meal_kit + hearty_stew + 5곳 등록 룰 첫 적용 | ★ chef +0.72d / 시뮬 R11-1 완전 해소 단언 |

---

## 6. 페르소나 분담 (M3 기준)

| 페르소나 | 주요 산출물 (M3) | 책임 영역 |
|----------|-----------------|----------|
| **PD 김재훈** | 협의서 5건 + 마일스톤 마감 보고 3건 | 의사결정·우선순위·트랙 정체성 |
| **밸런스 권지나** | baseline v3~v14 보고서 12건 + 튜닝 1건 | 시뮬 KPI 측정·튜닝·R/KPI 단정 |
| **시나리오 한도연** | SCN_QUEST 7건 (Tier-2 6 + supply 1) | 직업 정체성·Tier-2 abilities·신규 자원 |
| **시스템 백승호** | PR1·2·5·5.5·6·7 + PR_issue4·fatigue·landmark + VERIFY | 시뮬 v2 인프라·PR 머지·시스템 검증 |
| **AD 오은별** | AD_REVIEW + AD_VERIFY 2건 | UI 영향 검토·hover hint·OutputPreview |
| **Director** | DIR_GATE + DIR_VERIFY 3건 | 6 게이트 검수·시뮬-게임 정합 |
| **설정 이수정** | LORE_GLOSSARY v0.1~v0.5 | 어휘·세계관·직업 이름 |

---

## 7. 핵심 학습 (M3 마감 보고서 §9)

### 7.1 시나리오 γ 단정 (협의서 v3 §12)
게임 본체에 cooking 자동 추천 알고리즘 **부재**. player 명시적 선택. 시뮬 보강은 "본체 정합화"가 아닌 *이상적 player 행동 대리 추정 모델*.

### 7.2 5곳 등록 룰 표준 운영 (협의서 v5 §16.3)
4곳(items + stackConfig + CardFactory + characters startingItems)에 시뮬 actEat candidates 5곳째 신규. 미등록 시 시뮬 K3 효과 0.

### 7.3 트랙 A → 트랙 B 전환 (협의서 v5 §13~§14)
트랙 A(시뮬 craft 빈도 보강, PR16)으로 chef 격차 해소 시도 → chef day 1~2 임계 미도달로 실패. 트랙 B(chef high-nutrition 자원 추가, PR17)로 전환 → 완전 해소.

### 7.4 구조적 한계 → 자원 우선 (협의서 v5 §13)
chef 사망일 day 5~6 집중. **morale 회복은 day 100 도달의 필요 조건이지 충분 조건이 아님.** nutrition·hydration 사망 회피가 본질.

### 7.5 시뮬-본체 분리 단정 (협의서 v5 §15)
시뮬 도구 안에서의 KPI 마지노선과 게임 본체 K1 검증을 분리. M4+ 텔레메트리 트랙으로 본체 검증 이전.

---

## 8. M4 진입 대기 작업

### 8.1 M4 트랙 정체성 정의 (협의서 v6 발행 트리거)
- 게임 본체 K1 검증 — 실제 player 행동이 시뮬 player 행동과 일치하는지 텔레메트리 측정
- 신규 텔레메트리 페르소나 (또는 시스템 백승호 확장 영역) 분담 결정
- M3 §11 종결 단언을 M4 출발점으로 인용

### 8.2 M3 잔존 5건 (M4 이월 또는 분리 후순위 PR)
- PR18 R13-1 dismantle sim 모사 (시스템 백승호) — `tools/sim/v2/playerAI.mjs`에 dismantle 행동 신규
- spice_blend actEat candidates 잔존 결함 정리 (1~2 라인)
- PR16.2 R14-2 soldier 재조정 (후순위)
- AD UI 변경 권고 2건 (AD 오은별, 독립) — interactions.js cooking 8 hint + CraftUI OutputPreview 비교 모드
- drift.mjs leaf 값 hash 컬럼 추가

---

## 9. 문서 위치 안내

| 종류 | 위치 |
|------|------|
| 본 문서 (기획 현황 종합) | `docs/PLANNING_STATE.md` |
| 마스터 인덱스 | `docs/README.md` |
| 페르소나 회의 트랙 (49 산출물) | `docs/milestones/2026-05-10-persona-meeting/` |
| M3 마감 보고서 | `docs/milestones/2026-05-10-persona-meeting/00-decisions/PD_MILESTONE_M3_close.md` |
| 시뮬 baseline 데이터 (28건) | `simulation-data/` |
| 프로젝트 가이드 | `/CLAUDE.md` |
| 디자인 시스템 | `/DESIGN.md` |
| 현재 진행 트랙 체크리스트 | `/prompt_plan.md` |

---

*문서 끝. 새 마일스톤 진입 또는 핵심 결정 변경 시 본 문서 우선 갱신.*
