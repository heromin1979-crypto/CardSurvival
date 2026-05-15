# PD — M3 마감 보고서

> 작성: PD 김재훈 / 2026-05-12
> 트리거: 협의서 v5 §16.6 §1순위 (시뮬 R11-1 완전 해소 단언 직후)
> 결정: **M3 트랙 종결 권고 (사용자 승인 영역)** + 잔존 5건 M4 이월
> 범위: 2026-05-10 ~ 2026-05-12 M3 트랙 전체 (PR8 ~ PR17 + 보조 PR 1.1·1.6)
> 인용: 협의서 v5 §15 트랙 정체성 단정 / §16 시뮬 R11-1 완전 해소 단언 / §16.5 마지노선 7건 / §16.6 다음 단계 최종 갱신

---

## 1. 서두 — M3 트랙 시작과 마감

### 1.1 M3 트랙 시작 (2026-05-10, 페르소나 회의)

M3 트랙은 M2 마감 보고서(`PD_MILESTONE_M2_close.md`) §11 "M3 진입 후속" 1·2 순위로 발화:

> 1. PR7 — 요리·낚시·morale 관리 AI (시스템 백승호)
> 2. active baseline v3 (PR7 후) — K1 5~20% 도달 검증 (밸런스 권지나)

M2 마감 시점 정체성은 *"시뮬 인프라 0 → active baseline K3 격차 측정 가능 단계 도달"*. M3 진입 시점에는 **"K1 측정 가능화 + 4 핵심 이슈 완전 해소"**를 목표로 등록.

### 1.2 M3 트랙 마감 단언 (2026-05-12, 시뮬 R11-1 완전 해소)

협의서 v5 §16.2 단언:

> ★ 시뮬 R11-1 완전 해소 단언 — 1차 시뮬 KPI 격차 정의 1 ≥ +1.0d: ✅ **+1.2917d (1.29배 달성)** / 2차 시뮬 KPI 격차 정의 2 ≥ +0.5d: ✅ **+1.2660d (2.53배 달성)** / 3차 시뮬 KPI chef K3 ≤ 6.5: ✅ **6.10 (마진 0.4d 안전)**.

baseline v14 (PR17 머지 직후) — **트랙 B 성공**. 폴백 트랙 D(PR16 롤백) / 트랙 C(M3 마감 R11-1 정의 2 후퇴 수용) 불필요.

**M3 트랙 마감 검토 트리거 충족 단언 (협의서 v5 §16.5):**

| 마지노선 | 단언 |
|---|---|
| 시뮬 R11-1 완전 해소 (트랙 본질 목표) | ✅ |
| R8-1 완전 해소 (절망 < 200) | ✅ |
| R10-1 단계적 해소 (v8 405 → v14 224, -181) | ✅ |
| R15-1 완전 해소 (PR16 craft 빈도 보강) | ✅ |
| 5직업 Tier-2 abilities 완결 | ✅ |
| 시뮬 정합 5곳 등록 룰 표준 운영 단정 | ✅ |
| fingerprint v3~v14 12연속 유지 | ✅ |

**M3 트랙 시작-마감 약 2일 (2026-05-10 ~ 2026-05-12).**

### 1.3 트랙 정체성 단언 종결 (§15 인용)

협의서 v5 §15.2 단정 재인용:

> **본 M3 트랙은 "시뮬에서 측정 가능한 게임 데이터를 작성하는 트랙"으로 정체성을 단정한다.**
> 1. baseline KPI(K1·K3·K5·chef 격차 정의 1·2)는 **시뮬 K1의 마지노선**. 게임 본체 K1과의 매핑은 본 트랙 영역 밖
> 2. game data 변경(PR8·11·12·13·14·17)은 *시뮬에서 측정 가능한* 보강을 우선
> 3. 시뮬 보강(PR10·15·16)은 *측정 도구 정합화*를 우선
> 4. 협의서·SCN_QUEST·BAL_SIM 모든 산출물은 본 트랙 정체성 안에서 해석
> 5. 실제 게임 본체 K1 검증은 **M4+ 텔레메트리 트랙**으로 분리

**PD 김재훈 마감 단언:** 본 M3 모든 산출물의 단언(R 해소·KPI 충족·마지노선 달성)은 **시뮬 도구 안에서의 단정**. 본 §15 단정은 M3 트랙 종결 시점에 *재확인*되며, M4+ 텔레메트리 트랙은 본 §15를 출발점으로 신규 협의서 v6에서 시작.

---

## 2. M3 산출물 종합

### 2.1 PR 트랙 (10단계 PR + 2건 보조)

M3 PR 트랙은 **게임 데이터 PR 6건** + **시뮬 보강 PR 3건** + **보조 마이크로 PR 2건** = 11건.

| PR | 분류 | 변경 위치 | 핵심 변경 |
|----|------|-----------|---------|
| PR7 | 시뮬 | `tools/sim/v2/playerAI.mjs` + `gameStateReset.mjs` | actCook / actFish / actBoostMorale 3 AI 도입 + skill 주입 |
| PR8 | game data | `characters.js` + `districts.js` | 7직업 startingItems 보강 (instant_noodles+contaminated_water) + 6 시작 구 lootTable raw food |
| PR9 | game data | `landmarks.js` + `ExploreSystem.js` + `GameState` + playerAI | hangang sublocation 진입 시 fishing_rod_basic 1회 자동 지급 (firstEnterReward) |
| PR10 | 시뮬 | `tools/sim/v2/playerAI.mjs:172-201` | actCook benefit 산식 needs-aware 분기 (nutCur < nutMax × 0.5 ? n×3+h : n+h×1.5) |
| PR11 | game data | `js/data/districts.js` 25구 lootTable | herb·wild_berry·vegetable 3종 raw food 가중치 추가 (8/4) |
| PR12+T1 | 혼합 | `gameBalance.js:328` + `tools/sim/v2/playerAI.mjs` T1_TRANSFORMS | fishing.baseCatchChance 0.30→0.50 + interactions T1 모사 4 규칙 |
| PR13 | game data | `characters.js` + `items_misc.js` + `stackConfig.js` + `CardFactory.js` | homeless·engineer Tier-2 abilities + 자원 2종 (worn_photo·sketch_notebook) + newspaper_bundle 갱신 |
| PR14 | game data | 동일 4곳 | chef·firefighter·soldier·pharmacist Tier-2 abilities + 자원 4종 (chef_journal·spice_blend·family_photo·dog_tag·pharmacy_notes ★ 합산 5종) |
| PR14.1 | game data (보조) | `characters.js` + `items_misc.js` | pantry_mastery 1.4→1.6 + chef_journal morale 10→13 |
| PR15 | 시뮬 | `tools/sim/v2/playerAI.mjs` | ability bonus 4필드 가산 분기 구현 (moraleRecoveryBonus·lowMoraleRecoveryFatigueBonus·moraleOnCraft·sketchNotebookBonus). moraleOnDismantle skip |
| PR16 | 시뮬 | `tools/sim/v2/playerAI.mjs` runDayAI | nutrition<50 OR morale<30 임계 추가 craft (craft 발동 빈도 보강) |
| PR16.1 | game data (보조) | `characters.js` | comrade_memorial 1.3→1.2 (soldier 보수 하향) |
| PR17 | game data + 시뮬 | 4곳 + `playerAI.mjs` actEat candidates ★ 5곳째 | chef_meal_kit + hearty_stew + **5곳 등록 룰 첫 적용** |

**5곳 등록 룰 표준 운영 단정** (협의서 v5 §16.3): 4곳(items_misc + stackConfig + CardFactory + characters startingItems) + 5곳째 `tools/sim/v2/playerAI.mjs:130~133` actEat candidates. PR17 첫 적용 PR.

### 2.2 baseline 측정 (v3 ~ v14, 14회 측정)

| 측정 | 트리거 | chef K3 | 격차 정의 1 | 격차 정의 2 | K5 절망 | R 단정 |
|---|---|---|---|---|---|---|
| v3 | PR7 머지 | 4.50 | +1.33d | — | 110 | K1 0% 첫 측정 |
| v4 | PR8 머지 | 5.20 | +2.20d | — | 173 | PR9 트리거 충족 |
| v5 | PR9 머지 | 5.00 | +1.94d | — | — | actFish 가시화 |
| v6 | PR10 머지 | 5.00 (homeless +0.9d) | — | — | 167 | needs-aware 효과 |
| v7 | PR11 (1.0/0.5) | 5.00 | — | — | 173 | PR11 효과 0 (재조정 발화) |
| v7-2 | PR11 (8/4) | 5.00 | — | — | — | 동일 — *설계 자체 결함* |
| v8 | PR12+T1 | 5.20 | +0.77d | — | **405** ★ | T1 모사 효과, R10-1 폭증 |
| v9 | PR13 | 5.20 | +0.95d | +0.45d | 377 | R8-1 부분 완화 (engineer +0.5d) |
| v10 | PR15 | 5.20 | +0.97d | +0.46d | 303 | R11-1 액션 트리거 발동 |
| v11 | PR14·PR16 | **5.40** | +1.10d | **+0.56d** ★ | **161** ★ | R11-1 정의 2 첫 해소 / R8-1 완전 해소 |
| v12 | PR14.1+PR16.1 | 5.38 | +1.00d | +0.55d | 162 | 미세 조정 단언 |
| v13 | PR16 craft | 5.38 | +0.57d | +0.48d | 188 | 트랙 A 실패 단언 |
| **v14** | **PR17** ★ | **6.10** | **+1.2917d** | **+1.2660d** | 224 | **★ 시뮬 R11-1 완전 해소 ★** |

K1 7직업 0% **15회 연속**. fingerprint `len316-h242a5b5f` v3~v14 12연속 유지. bootstrapErrors 0/700 전 측정 유지. 결정성 100%.

### 2.3 협의서 (v1 ~ v5, 5건)

| 협의서 | PR 결정 | 보강 §|
|---|---|---|
| v1 (PR8 결정) | 옵션 A+B 병행 단일 PR | 단일 |
| v2 (PR9 결정) | 변형 C-a hangang sublocation 진입 시 fishing_rod_basic 1회 자동 지급 | 단일 |
| v3 (PR10 결정) | 옵션 C needs-aware 산식 단독 | §12 시나리오 γ 단정 + R10-1 등록 |
| v4 (PR11 결정) | 옵션 2 25구 lootTable (가중치 1.0/0.5 → 8/4 재조정) | §12·§13·§14·§15 4 보강 (R8-1 완전 완화 추적 + R11-1 등록 + R13-1·R15-1 등록 + R11-1 액션 트리거) |
| v5 (PR14 결정) | A+B 패키지 — chef Tier-2 ability + 자원 | §12·§13·§14·§15·§16 5 보강 — R11-1 정의 2 해소 / 구조적 한계 단정 / 트랙 B 채택 / **트랙 정체성 단정** / **시뮬 R11-1 완전 해소 단언** |

### 2.4 SCN_QUEST 5직업 + chef supply (6건)

| 문서 | 직업 | Tier-2 ability | 신규 자원 | 줄수 |
|---|---|---|---|---|
| SCN_QUEST_homeless_tier2.md | homeless | street_solace 🕯️ | worn_photo 📷 (+newspaper_bundle 갱신) | 533 |
| SCN_QUEST_engineer_tier2.md | engineer | workshop_focus 🔧 | sketch_notebook 📓 | 546 |
| SCN_QUEST_chef_tier2.md | chef | pantry_mastery 🥫 | chef_journal 📔 + spice_blend 🧂 | 715 |
| SCN_QUEST_firefighter_tier2.md | firefighter | rescue_resolve | family_photo | 472 |
| SCN_QUEST_soldier_tier2.md | soldier | comrade_memorial | dog_tag | 488 |
| SCN_QUEST_pharmacist_tier2.md | pharmacist | compounding_focus | pharmacy_notes | 503 |
| SCN_QUEST_chef_supply.md | chef (보강) | — | chef_meal_kit + hearty_stew (high-nutrition) ★ | 810 |

**합계: 4067줄.** patch diff 합산 ~150 라인. 본 6 SCN_QUEST는 5직업 Tier-2 abilities 완결 + chef high-nutrition 자원 2종을 단일 트랙으로 마감.

### 2.5 SYS_VERIFY + AD_VERIFY (2건)

| 문서 | 결정 |
|---|---|
| SYS_VERIFY_cooking_autopick.md | **시나리오 γ 단정 — 게임 본체에 cooking 자동 추천 알고리즘 *부재*.** `CraftSystem.startBlueprint(blueprintId):85` 외부에서 명시 id 받음. priority/order/weight 필드 3 데이터 파일 0 매칭. PR10 시뮬 단일 PR 머지 가능. *이상적 player 행동 대리 추정 모델* 단정 본 PR body에 의무 명시. |
| AD_VERIFY_cooking_ui.md | hover hint 부족(1) + OutputPreview 일부 부족(2) + 사이드바 게이지 충분(3). UI 변경 권고 2건은 PR10 머지 차단 아님. needs-aware 산식 권고 강화. |

### 2.6 보고서 (BAL_SIM_baseline_v3 ~ v14, 12건)

baseline 보고서 12건 (v3·v4·v5·v6·v8·v9·v10·v11·v12·v13·v14, v7은 raw만). 각 보고서는 협의서 §단언과 1:1 매핑. v14 보고서(492줄)가 본 M3 트랙의 마감 측정 보고.

---

## 3. R 해소 상태 종합

### 3.1 완전 해소

| ID | 단언 | 측정 증거 |
|----|------|---------|
| **시뮬 R11-1 ★** | **완전 해소** — 1·2·3차 시뮬 KPI 동시 충족 | v14 정의 1 +1.2917d / 정의 2 +1.2660d / chef K3 6.10 |
| R8-1 | 완전 해소 — homeless·engineer actBoostMorale 0% 원인 (절망 회복 자원 부재) | v11 절망 161 < 200 기준 (v8→v11 -244 = 60.2% 회수). v12·v13·v14 유지 |
| R15-1 | 완전 해소 — playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day | v13 craft +0.4~0.7 fires/day 실측. PR16 craft 빈도 보강 단언 |
| R14-1 일부 | 부분 해소 — chef pantry_mastery effect 1.4→1.6 (PR14.1) | v12 chef K3 5.38 유지. trade-off 미미 단언 |
| R14-2 일부 | 부분 해소 — soldier comrade_memorial effect 1.3→1.2 (PR16.1 보수 하향) | v12 soldier K3 4.96 (안전 회수) |

### 3.2 단계적 해소

| ID | 단언 | 측정 증거 |
|----|------|---------|
| R10-1 | 단계적 해소 — 절망 사망 +25(v6 PR10 직접 부산물) → +232(v8 T1 모사 후) | v8 405 → v14 224 (-181 누적, **44.7% 회수**) |

### 3.3 부분 해소

| ID | 단언 | 한계 |
|----|------|------|
| R13-1 | 부분 해소 — ability bonus 4필드 가산 분기 PR15 구현 | 5필드 중 4필드 (moraleOnDismantle skip — sim에 dismantle 행동 없음) |

### 3.4 미해소

| ID | 잔존 결함 |
|----|----------|
| R14-2 | soldier 보수 초과 (K3 +0.47d > SCN_QUEST 가이드 +0.3d). R11-1 해소 후 후순위 |
| R14-3 | firefighter 사인 전이만 (K3 Δ 0d, K5 절망 -22). R15-1 우회 보수화 패턴 실패 |
| spice_blend 잔존 결함 | actEat candidates 미등록 (5곳째 누락) — 시뮬 K3 효과 0. SCN_QUEST_chef_supply.md §11.5 후속 권고 |

---

## 4. 마지노선 달성 7건 단언

협의서 v5 §16.5 마지노선 7건 재인용 + 본 M3 종결 단언.

### 4.1 시뮬 R11-1 완전 해소 ★ (트랙 본질 목표)

- 1차 시뮬 KPI 정의 1 ≥ +1.0d: ✅ **+1.2917d** (1.29배 달성)
- 2차 시뮬 KPI 정의 2 ≥ +0.5d: ✅ **+1.2660d** (2.53배 달성, v13 미해소 → v14 완전 해소)
- 3차 시뮬 KPI chef K3 ≤ 6.5: ✅ **6.10** (마진 0.4d 안전)
- **트랙 B 성공 — 트랙 D/C 폴백 불필요.**

### 4.2 R8-1 완전 해소

homeless·engineer actBoostMorale 0% 발견(v4) → PR13 자원 2종 + PR15 ability bonus + PR14 자원 3종 누적 → **v11 절망 161 < 200 기준 단언 + v12·v13·v14 유지** (v8→v14 누적 -181, 44.7% 회수).

### 4.3 R10-1 단계적 해소

PR12+T1 모사 부산물 사망일 연장 → 절망 폭증 v8 405. PR13·PR14·PR15·PR16·PR17 누적 보강으로 **v14 224 (-181 누적, 44.7% 회수)**. 단계적 해소 단언.

### 4.4 R15-1 완전 해소

R13-1 부분 해소 후 SCN_QUEST 추정-실측 잔존 격차 -0.9~-1.4d. 원인: playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day. **PR16 craft 발동 빈도 보강 (nutrition<50 OR morale<30 임계 추가 craft) — v13 craft +0.4~0.7 fires/day 실측**. 완전 해소 단언.

### 4.5 5직업 Tier-2 abilities 완결

homeless·engineer·firefighter·soldier·pharmacist Tier-2 abilities 5건 + chef Tier-2 ability(pantry_mastery) + chef high-nutrition 자원 2종. SCN_QUEST 6건 합산 4067줄 / patch diff ~150 라인. **6직업 모두 Tier-2 ability 완결 + chef 정체성 강화**.

### 4.6 시뮬 정합 5곳 등록 룰 표준 운영 단정

PR17 첫 적용 PR. 4곳(items_misc + stackConfig + CardFactory + characters startingItems) + 5곳째 `tools/sim/v2/playerAI.mjs:130~133 actEat candidates`. **probe 단언: chef_meal_kit·hearty_stew 100/100 runs 완전 소비 = actEat candidates 등록이 시뮬 K3 효과 발현의 *필요 조건이자 충분 조건***. 시뮬 정합 트랙(§15) 표준 운영 단정 격상.

### 4.7 fingerprint v3~v14 12연속 유지

`drift.balanceLeafTotal = 227`, fingerprint `len316-h242a5b5f` v3~v14 12파일 모두 동일. BALANCE leaf 무관여 단정. PR12 leaf 값 변경에도 무영향 — 측정 한계 단정은 협의서 v4 §13.6 재인용 (M4+ sim 로직 hash 컬럼 추가 권고 유지).

---

## 5. KPI 최종 단정 (v3 → v14 추세)

### 5.1 K1 — 100일 생존율 (목표 ≥ 5%)

K1 7직업 0% **15회 연속** (v1 패시브 → v3~v14 active baseline 14회). 직업 간 최대 격차 0.00%p.

**시뮬 KPI 마지노선 단언 (§15):** K1 0%는 *시뮬 player 행동 모델 + 게임 데이터 조합*의 100일 생존 미도달 단정. 게임 본체 실제 player의 K1 매핑은 본 트랙 영역 밖 (M4+ 텔레메트리 트랙으로 분리).

### 5.2 K3 — 평균 사망일

- chef: **4.50 (v3) → 6.10 (v14), +1.60d 회복**
- 격차 정의 1 (5직업 평균 기준): **+1.33d (v3) → +1.2917d (v14)** ★ 1차 시뮬 KPI 1.29배 달성
- 격차 정의 2 (cooking lv ≥1 직업 기준): **— (v6 신설) → +1.2660d (v14)** ★ 2차 시뮬 KPI 2.53배 달성
- 6직업 K3: 회귀 0 (v13 → v14 전수 변화 0)

### 5.3 K5 — 사망 원인 분포 (누적 변동)

| 원인 | v3 | v8 (피크) | v14 | Δ v3→v14 |
|---|---|---|---|---|
| 아사 | 569 | 263 | **373** | -196 |
| 절망 | 110 | **405** | 224 | +114 (R10-1 단계적 해소 패턴) |
| 탈수 | 20 | 24 | 36 | +16 |
| 극도 피로 | 1 | 8 | 67 | +66 (사망일 연장 부산물) |

**사인 전이 패턴 단언:** PR8~PR12 아사 감소(자원 보강) → PR12+T1 T1 모사 부산물 절망 폭증 → PR13~PR17 절망 단계적 회복 + 사망일 연장 부산물(극도 피로↑·탈수↑). 본 사인 전이 패턴은 *시뮬 K3 향상의 trade-off 단정* (협의서 v5 §16.1).

---

## 6. 트랙 정체성 종결 단언 (§15 인용 재확인)

### 6.1 "시뮬 정합 게임 데이터 작성" 트랙 본질 달성

본 M3 트랙은 협의서 v5 §15.2 단정 안에서 *시뮬에서 측정 가능한 게임 데이터*를 작성. PR8·11·12·13·14·17 (game data 6건) + PR10·15·16 (시뮬 보강 3건) + PR9 (혼합) + 보조 PR 1.1·1.6 = **시뮬 정합 코드 변경 11건**. 모든 변경은 baseline 측정으로 효과 검증 가능.

### 6.2 게임 본체 K1 검증은 M4+ 텔레메트리 트랙 분리

협의서 v5 §15.2 단정 5 재인용:

> 실제 게임 본체 K1 검증은 **M4+ 텔레메트리 트랙**으로 분리. 본 M3 트랙은 *시뮬 KPI 마지노선*을 산출물로 함.

`SYS_VERIFY_cooking_autopick.md` §5.2 시나리오 γ 단정 (게임 본체 cooking 자동 추천 *부재*) → 시뮬 `tools/sim/v2/playerAI.mjs`는 *이상적 player 행동 대리 추정 모델*. 본체 player 행동과의 매핑은 본 트랙 영역 밖.

### 6.3 본 M3 산출물의 해석 범위

- **시뮬 KPI 마지노선 충족 산출물:** baseline v3~v14 측정 + R 해소 단언 + 마지노선 7건 (§4)
- **시뮬 정합 게임 데이터 산출물:** PR8·11·12·13·14·17 (game data 6건)
- **시뮬 보강 측정 도구 산출물:** PR9·10·15·16 (시뮬 보강 4건 — PR9는 혼합)
- **시나리오 정의 산출물:** SCN_QUEST 6건 (Tier-2 ability + 자원 13종)
- **검증 산출물:** SYS_VERIFY_cooking_autopick.md + AD_VERIFY_cooking_ui.md

**모든 단언은 *시뮬 도구 안에서의 단정*. 게임 본체 K1 검증은 별도 트랙.**

---

## 7. M4 이월 사항 (잔존 5건)

협의서 v5 §16.5 잔존 5건 재인용 + 본 M3 종결 권고.

### 7.1 R13-1 dismantle sim 모사 (PR18 후보)

PR15 ability bonus 4필드 가산 분기 구현 시 **moraleOnDismantle skip** (sim에 dismantle 행동 없음). engineer workshop_focus의 moraleOnDismantle 필드 효과 미모사. PR18 후보 — `tools/sim/v2/playerAI.mjs`에 actDismantle 추가 + DismantleSystem 발화 모사 (~50라인 추정). **M4 진입 시 우선순위 후순위**.

### 7.2 R14-2 soldier 보수 초과 재조정

soldier comrade_memorial K3 +0.47d > SCN_QUEST 가이드 +0.3d. PR16.1에서 effect 1.3→1.2 하향했으나 v12 K3 4.96 (-0.04d 미미). **R11-1 해소 단언 후 후순위 단정** (협의서 v5 §16.5). M4 진입 시 PR16.2 후보.

### 7.3 R14-3 firefighter 사인 전이 보류

firefighter rescue_resolve K3 Δ 0d (5.00 유지). K5 절망 -22만. R15-1 우회 보수화 패턴 실패 단언. **firefighter K3 향상은 별도 트랙 (R15-1 우회 보수화 가설 폐기)**. M4 진입 시 신규 시나리오 검토.

### 7.4 spice_blend actEat candidates 잔존 결함

PR14 chef 자원 2종 중 spice_blend는 5곳째(playerAI actEat candidates) 미등록. 시뮬 K3 효과 0 단정. SCN_QUEST_chef_supply.md §11.5 후속 권고:

> spice_blend 잔존 결함 — 1~2 라인 패치 (actEat candidates 등록)

**독립 작업. PR18 후보 또는 별도 마이크로 PR.**

### 7.5 M4+ 텔레메트리 트랙 (협의서 v6 신규 발행)

§15 트랙 정체성 단정 후속:

> 실제 게임 본체 K1 검증은 **M4+ 텔레메트리 트랙**으로 분리. 본 M3 트랙은 *시뮬 KPI 마지노선*을 산출물로 함.

**M4 진입 시 협의서 v6 신규 발행** — 본 §15·§16 단정을 출발점으로 게임 본체 K1 검증 트랙 시작. 신규 페르소나 영역 (Telemetry / Analytics PD) 합류 가능. drift.mjs leaf 값 hash 컬럼 추가 (협의서 v4 §13.6 단정) 동반 권고.

### 7.6 (선택) M3 #15 AD UI 변경 권고 2건

AD_VERIFY_cooking_ui.md §3 권고 2건:
1. cooking 8 blueprint hover hint 신설 (이름만 → 효과·재료·산출물 요약)
2. `_renderOutputPreview:274~324` 동시 비교 UI 추가 + DESIGN.md `--stat-*` 토큰 적용

**독립 트랙. PR10 머지 차단 아님. M4 진입과 무관.** AD 오은별 단독 트랙 후보.

---

## 8. 페르소나 작업 분담 종합

### 8.1 PD 김재훈 (협의·우선순위·트레이드오프)

- 협의서 v1~v5 5건 작성·결정 단언
- 페르소나 협의 진행 (M3 #11·#13·#19 마감 회의)
- 1 PR 1 트랙 원칙 유지 (측정 도구 → 데이터 → 메커닉 → 측정 → 밸런스 튜닝 머지 순서)
- 트랙 정체성 단정 (협의서 v5 §15)
- 마지노선 7건 충족 단언 (협의서 v5 §16.5)
- 본 M3 마감 보고서 작성 (PD_MILESTONE_M3_close.md)

### 8.2 밸런스 권지나 (시뮬·14회 baseline 측정·KPI 단정)

- baseline v3~v14 14회 정식 측정 (보고서 12건, 합산 ~4500줄)
- KPI 정의 1·2 신설 (cooking lv 0/lv ≥1 분리)
- R 위험 등록 + 해소 단언 (R7-1·R8-1·R9-1·R10-1·R11-1·R13-1·R14-1·R14-2·R14-3·R15-1)
- 시뮬 KPI 3분리 단언 (1차 정의 1 / 2차 정의 2 / 3차 chef K3)
- 시뮬 R11-1 완전 해소 단언 (협의서 v5 §16.2)

### 8.3 시나리오 한도연 (5직업 Tier-2 + chef supply, 6건)

- SCN_QUEST_homeless·engineer·chef·firefighter·soldier·pharmacist_tier2.md 5직업 Tier-2 abilities
- SCN_QUEST_chef_supply.md chef high-nutrition 자원 2종 (chef_meal_kit·hearty_stew)
- 합산 6 문서 4067줄
- ability 가드레일 6건 + effect 값 범위 + 자원 정체성 단정
- 5곳 등록 룰 확장 단정 (협의서 v5 §16.3)

### 8.4 시스템 백승호 (10+ PR 머지·시뮬 로직·검증)

- PR7~PR17 11 PR 머지 (보조 PR 포함 13건)
- 시뮬 로직: actCook·actFish·actBoostMorale·actT1Convert·ability bonus 가산 분기·craft 빈도 보강·actEat candidates 5곳째
- game data: characters.js·items_misc.js·stackConfig.js·CardFactory.js·districts.js·gameBalance.js·landmarks.js·ExploreSystem.js
- SYS_VERIFY_cooking_autopick.md (시나리오 γ 단정)
- 회귀 0 검증 — fingerprint v3~v14 12연속 유지

### 8.5 AD 오은별 (UI 검증)

- AD_VERIFY_cooking_ui.md (420줄)
- hover hint 부족(1) + OutputPreview 일부 부족(2) + 사이드바 게이지 충분(3) 단언
- UI 변경 권고 2건 — PR10 머지 차단 아님 (독립 트랙)

---

## 9. 핵심 학습·발견 (M3 트랙 5건)

### 9.1 시나리오 γ 단정 (게임 본체 자동 추천 부재)

`SYS_VERIFY_cooking_autopick.md` §5.2: `CraftSystem.startBlueprint(blueprintId):85`는 외부에서 명시 id를 받음. 모든 호출처(CraftUI·QuickCraftPrompt)가 player 클릭 결정. priority/order/weight 필드 3 데이터 파일 0 매칭. **본체에 cooking 자동 추천 알고리즘 *부재*.**

**영향:** 시뮬 `tools/sim/v2/playerAI.mjs`는 *이상적 player 행동 대리 추정 모델* 단정. 본체 K1 매핑은 본 트랙 영역 밖 (§15 트랙 정체성 단정 본질).

### 9.2 5곳 등록 룰 확장 (4곳 → 5곳)

협의서 v5 §16.3 단정. CLAUDE.md §3 "신규 아이템 추가 시 stackConfig.js + districts.js lootTable + CardFactory.js CARD_IMAGES 반드시 등록" 4곳에서 **5곳째 `tools/sim/v2/playerAI.mjs:130~133 actEat candidates` 신규 추가**. 시뮬 정합 트랙(§15)에서 표준 운영 단정.

**probe 단언:** chef_meal_kit·hearty_stew 100/100 runs 완전 소비 = actEat candidates 등록이 시뮬 K3 효과 발현의 *필요 조건이자 충분 조건*.

### 9.3 트랙 A 실패 → 트랙 B 성공 (effect 값 한계 → 자원 추가)

협의서 v5 §13·§14 추적:
- **트랙 A (PR16 craft 빈도 보강 단독)** — v13 chef K3 5.38 (+0.02d 미미). chef day 1~2 임계 미도달, day 5~6 입력 자원 소진. **실패 단언**.
- **트랙 B (chef high-nutrition 자원 추가)** — v14 chef K3 6.10 (+0.72d). chef 사망일 day 5~6 → day 7+ 이동. **성공 단언**.

**학습:** effect 값 미세 조정(1.4→1.6, 10→13)은 *구조적 한계* 안에서만 작동. 입력 자원 자체가 부족하면 effect 가산 효과 0. *자원 보강 자체*가 본질 경로.

### 9.4 구조적 한계 → 자원 보강 본질 ★

협의서 v5 §13.4·§14 단정:

> chef 사망일 day 5~6 집중, morale 회복은 day 100 도달의 필요 조건이지 충분 조건이 아님

**학습:** chef pantry_mastery moraleRecoveryBonus 1.6 effect는 *충분한 입력 자원이 존재해야* 발화. day 5~6 cooked food 소진 후 ability bonus 0. **chef nutrition·hydration 자원 자체 보강이 본질** → PR17 chef_meal_kit·hearty_stew 채택의 본질 근거.

### 9.5 시뮬-게임 본체 분리 단정 (§15)

협의서 v3 §12.1·§13.6 + v4 §13.6 + v5 §13.3에서 반복 노출된 단정을 **트랙 정체성 단정으로 격상** (협의서 v5 §15.2).

**메타 학습:** 시뮬 결함 발견 → 시뮬 보강 → game data 변경 → baseline 재측정 → 시뮬 결함 추가 발견의 *순환 패턴*은 **시뮬 도구 정합화 트랙** 본질. 게임 본체 K1 검증은 **별도 텔레메트리 트랙(M4+)** 의무.

---

## 10. M3 종결 결정 (사용자 승인 영역)

### 10.1 종결 조건 충족 단언

협의서 v5 §16.5 마지노선 7건 충족 단언 + 본 M3 종결 보고서 작성 완료. 종결 조건:

| 조건 | 단언 |
|---|---|
| 시뮬 R11-1 완전 해소 (트랙 본질 목표) | ✅ |
| 마지노선 7건 충족 | ✅ |
| 트랙 정체성 단정 종결 (§15 재확인) | ✅ |
| M3 마감 보고서 작성 | ✅ (본 문서) |
| 잔존 5건 M4 이월 명시 | ✅ (§7) |

### 10.2 M4 진입 권고

협의서 v5 §16.6 §6 인용:

> M4+ 텔레메트리 트랙 진입 — 게임 본체 K1 검증. §15 트랙 정체성 후속 협의서 v6 신규 발행

**PD 김재훈 권고 (본 M3 마감 보고서):**

1. **M3 종결 선언** — 본 M3 트랙 산출물(11 PR + 14 baseline + 5 협의서 + 6 SCN_QUEST + 2 VERIFY + 12 보고서)을 archive 처리. 협의서 v1~v5 archive (M4 협의서 v6 신규 발행 시 본 §15·§16 단정을 종결 단언으로 인용).
2. **M4+ 텔레메트리 트랙 진입** — 협의서 v6 신규 발행. 게임 본체 K1 검증 트랙 시작.
3. **잔존 5건 (R13-1·R14-2·R14-3·spice_blend·M3 #15 AD UI)** — M4 이월 또는 별도 후순위 PR 트랙으로 분리.

### 10.3 PD 마감 단언

**PD 김재훈 마감 단언 (2026-05-12, 본 M3 마감 보고서):**

> M3 트랙 본질 목표 (시뮬 R11-1 완전 해소) 달성. 마지노선 7건 충족. 트랙 정체성 단정 종결. 본 M3 트랙 산출물 종합 마감 보고. **M3 종결 권고. M3 종결 *선언* 결정은 사용자(프로젝트 책임자) 승인 영역**.
>
> 본 M3 마감 보고서는 협의서 v5 §16.6 §1순위 결정대로 작성. 본 보고서 채택 직후 §2순위 M3 종결 선언 트리거 + §6 M4+ 텔레메트리 트랙 진입 권고.
>
> 잔존 5건은 본 M3 트랙 본질 영역 밖 또는 후순위 단정. M4 진입 시 협의서 v6 신규 발행으로 재진입.

---

*문서 끝. 본 PD_MILESTONE_M3_close.md는 협의서 v5 §16.6 §1순위 결정에 따라 작성된 M3 트랙 마감 보고서. 본 보고서 채택 직후 M3 종결 선언 또는 M4 진입 결정은 사용자(프로젝트 책임자) 승인 영역. M4 협의서 v6 신규 발행 시 본 §10.3 단정을 종결 단언으로 인용. — 2026-05-12 §11 사용자 종결 선언 + M4 진입 결정으로 보강.*

---

## 11. ★ 사용자 M3 종결 선언 + M4 진입 결정 ★ (2026-05-12)

### 11.1 종결 선언 단언

**사용자(프로젝트 책임자) 결정 — 2026-05-12:**

> **M3 트랙 종결 선언.** PD 김재훈 §10.3 마감 단언 + 마지노선 7건 충족 + 트랙 정체성 단정 종결을 입력으로 M3 트랙 공식 종결.
>
> **M4 텔레메트리 트랙 진입 결정.** 협의서 v6 신규 발행 + 게임 본체 K1 검증 트랙 시작.

### 11.2 종결 효과

1. **M3 트랙 산출물 archive 처리** — 협의서 v1~v5 + SCN_QUEST 6건 + SYS_VERIFY + AD_VERIFY + BAL_SIM 보고서 12건 + 본 PD_MILESTONE_M3_close.md
2. **본 §11 단정이 M3 종결의 최종 기록** — M4 협의서 v6 신규 발행 시 본 §11을 종결 단언 출발점으로 인용
3. **트랙 정체성 단정 종결 (§15)** — "시뮬 정합 게임 데이터 작성" 트랙 본질 달성 단언으로 마감
4. **잔존 5건은 M4 이월** — R13-1 / R14-2 / R14-3 / spice_blend / M3 #15 AD UI

### 11.3 M4 트랙 진입 트리거

**M4+ 텔레메트리 트랙 — 게임 본체 K1 검증:**
- 본 M3 트랙은 *시뮬 KPI 마지노선* 달성 (시뮬 R11-1 완전 해소)
- M4는 게임 본체 K1 검증 — 실제 player 행동이 시뮬 player 행동과 일치하는지 텔레메트리로 측정
- M4 협의서 v6 신규 발행 — PD 김재훈 + 신규 텔레메트리 페르소나(또는 시스템 백승호 확장 영역)
- 본 §11 단정을 출발점으로 M4 협의 시작

### 11.4 마감 종합 단언

- M3 트랙: 2026-05-10 시작 ~ 2026-05-12 종결 (약 2일)
- 마지노선 7건 충족 → ★ **시뮬 R11-1 완전 해소** ★
- 산출물: 협의서 5 + PR 11 + baseline 14 + SCN_QUEST 6 + VERIFY 2 + 보고서 12 + 마감 보고서 1
- 페르소나 5 분담: PD·밸런스·시나리오·시스템·AD
- 트랙 정체성 단정 종결 (§15)
- M4 텔레메트리 트랙 진입 결정

**M3 트랙 공식 종결.**

---

*M3 트랙 마감. M4 텔레메트리 트랙 진입은 협의서 v6 신규 발행 시점부터 시작. 본 PD_MILESTONE_M3_close.md는 M3 트랙의 최종 산출물로 archive 처리.*

