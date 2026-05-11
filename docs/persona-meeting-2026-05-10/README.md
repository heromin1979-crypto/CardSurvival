# 페르소나 회의 산출물 — 2026-05-10

> 7개 게임 기획 페르소나(PD·Director·Lore·Scenario·Level·System·Balance) 회의 결과 산출물 인덱스.

---

## 회의 결과 요약

페르소나들이 게임을 학습하고 4개 핵심 이슈를 식별했다.

| 이슈 | 분류 | 결정 |
|------|------|------|
| **1.** pharmacist 메인 퀘스트 미로드 | P0 hotfix v1+v2 | **완료 (양쪽)** |
| **2.** 6직업 정체성 비대칭 (doctor 전용 분기만 풍부) | P1 | 3 마일스톤 분리 |
| **3.** 후반 이벤트 4종 폭주 위험 | P1 | 측정 후 분기 결정 |
| **4.** `items.js` location/landmark가 `districts.js`와 정보 중복 | P2 | M2 마이그레이션 |

---

## 마일스톤 일정 (PD 김재훈)

| 마일스톤 | 기간 | 항목 | 1차 담당 |
|----------|------|------|----------|
| **M0 (즉시)** | ~5/14 | 이슈 1 hotfix | System → Scenario 회귀 |
| **M1 (이번)** | 5/15~5/29 | 이슈 2 baseline / 이슈 3 측정 / 이슈 4 설계서 | Balance · System |
| **M2 (다음)** | 5/30~6/12 | 이슈 2 Tier-2 5직업 분기 / 이슈 4 팩토리 마이그레이션 / 글로서리 시드 | Scenario · System · Lore |
| **M3 (다다음)** | 6/13~ | 이슈 2 Tier-1 승급 / 이슈 3 통합 결정값에 따라 분기 | Scenario · System |

---

## 산출물 목록

### M0 (즉시)
- [`PD_HOTFIX_PHARMACIST.md`](./PD_HOTFIX_PHARMACIST.md) — pharmacist hotfix v1 결정서, 패치 diff 포함 (mainQuests/index.js 등록)
- [`PD_HOTFIX_PHARMACIST_v2.md`](./PD_HOTFIX_PHARMACIST_v2.md) — **pharmacist hotfix v2.** 캐릭터 정의 추가 (`characters.js` CHARACTERS 배열). M0 v1이 절반의 해결책이었음을 보완. 약사 26개 메인 퀘스트가 게임에 실제 도달 가능. validate.js 통과(`Errors: 0`).

### M1 — 측정·감사·설계서
- [`SCN_AUDIT_location_refs.md`](./SCN_AUDIT_location_refs.md) — `loc_*`/`lm_*` 직접 참조 감사 (이벤트 전용 랜드마크 6종 정의 누락 의심 발견)
- [`SYS_REVIEW_event_polling_audit.md`](./SYS_REVIEW_event_polling_audit.md) — 4 이벤트 시스템 폴링 방식 감사 (NoiseSystem이 이미 3 이벤트 통합 진입점 발견)
- [`SYS_DESIGN_location_card_factory.md`](./SYS_DESIGN_location_card_factory.md) — location/landmark 카드 팩토리 설계
- [`BAL_SIM_baseline_v1.md`](./BAL_SIM_baseline_v1.md) — 6직업 100회 시뮬 계획·양식
- [`BAL_SIM_event_overlap_day60_100.md`](./BAL_SIM_event_overlap_day60_100.md) — 후반 이벤트 폭주 측정 계획
- [`LORE_GLOSSARY.md`](./LORE_GLOSSARY.md) — 글로서리 v0.1 시드 (25 구·6직업·핵심 어휘)

### M1 — 추가 (시뮬·미도달 감사 + v2 설계)
- [`SIM_AUDIT_v1.md`](./SIM_AUDIT_v1.md) — 시뮬 인프라 격차 감사. **시뮬은 게임 코드 import 0건, chef 직업 누락, hydration 1.5(현행 1.0과 불일치)** 등 발견. baseline v1을 시뮬 v2 인프라 도입 후로 이연.
- [`UNREACHABLE_AUDIT_v1.md`](./UNREACHABLE_AUDIT_v1.md) — 미도달 기능 감사. validate.js dead-end 10건 false positive 판정, 진짜 dead code 0건. 단 도달 빈도 미실측 콘텐츠(legendary 24, secretEnemy 26, secretCombo 46) 다수 — 시뮬 v2에서 KPI 추가 권고.
- [`SYS_DESIGN_sim_v2.md`](./SYS_DESIGN_sim_v2.md) — 시뮬 v2 인프라 재설계서 v1 (검토에서 보완 후 재검토 결정).
- [`REVIEW_sim_v2_v1.md`](./REVIEW_sim_v2_v1.md) — 6 페르소나 합동 검토. characters.js 단일 진리 위반·EventBus mock noop·PR 의존 모순 등 6건 필수 보완.
- [`SYS_DESIGN_sim_v2_v2.md`](./SYS_DESIGN_sim_v2_v2.md) — **시뮬 v2 보완판.** 6 보완 모두 반영.
- [`SYS_REVIEW_charcreate_decay_hardcode.md`](./SYS_REVIEW_charcreate_decay_hardcode.md) — **`CharCreate.js:296` decay 하드코딩 검증.** **P0 false alarm** — `StatSystem.onTP():47~54`가 BALANCE.stats.{hydration,nutrition,morale}DecayPerTP로 매 TP 오버라이드. 단 fatigue는 BALANCE 미적용(우연히 일치) — **P1 일관화 권고**, P3 dead store 정리 권고.
- [`PD_MEETING_sim_v2_gate.md`](./PD_MEETING_sim_v2_gate.md) — **PD 재검토 회의록.** 시뮬 v2 보완판 게이트 **통과.** 7 페르소나 발언 + 6 필수·8 부수 보완 충족 표 + 조건부 보완 5건 + 일정 확정 (Phase 0 spike → PR1~5 → baseline D+12).
- [`SCN_AUDIT_chef_abilities.md`](./SCN_AUDIT_chef_abilities.md) — **시나리오·설정 합동 감사.** chef abilities startingItems 부재는 결함(story·abilities와 시작 상태 불일치). **option (b) 채택** — `knife_mastery` ability에 startingItems 추가. **추가 P0 발견:** `pharmacist` 캐릭터 정의 `characters.js`에 부재 — M0 hotfix는 절반의 해결책 (P0 hotfix v2로 해소).
- [`SCN_PR_chef_knife_mastery.md`](./SCN_PR_chef_knife_mastery.md) — **C1 PR 머지 보고.** chef `knife_mastery` ability에 `startingItems: [knife, canned_food×2, preserved_ration]` 추가. chef 시작 인벤토리 1 → 5개. 직업 평균 5.4와 정합. validate.js 통과, 시뮬 v2 회귀 없음. 남은 비대칭은 startDistrict dangerLevel 5 (Director 게이트 대기).
- [`DIR_GATE_chef_start_environment.md`](./DIR_GATE_chef_start_environment.md) — **Director 게이트 결정.** chef `junggoo` dangerLevel 5 비대칭에 대한 6 게이트 평가. **option (c) 통과** — junggoo 유지 + chef 전용 `encounterMultDays` ability(7일 encounter ×0.5) 신설. 자원·환경 양 측면 정상화. M2에서 5 PR 합동.
- [`PD_MILESTONE_M0_M2_summary.md`](./PD_MILESTONE_M0_M2_summary.md) — **PD M0~M2 종결 보고.** 25 산출물 인덱스 + 5 게임 데이터 PR + 시뮬 v2 16 파일 (단위 검사 147/147, 31 시스템 init 성공) + 4 핵심 이슈 진행 + 15 핵심 발견 + M2 우선순위. M0 완료 / M1 90%+ / M2 진입 대기.
- [`BAL_SIM_baseline_v1_report.md`](./BAL_SIM_baseline_v1_report.md) — **baseline 700회 실측 보고.** 7직업 × 100회, 4.0초 완료. **핵심 발견:** K1 전 직업 0% / day 2 사망 / 극도 피로 700/700. 시뮬 인프라는 무탈 동작·결정성 100%·bootstrapErrors 0이지만 **Player AI 부재로 직업 차이 측정 불가.** M2에 PR5(Player AI 도입) 신규 등록. 4 핵심 이슈 수치 결정은 active baseline v2까지 보류.
- `BAL_SIM_baseline_v1_result.json` — baseline 700회 raw JSON 결과 (생성됨).
- [`SYS_PR5_player_ai_report.md`](./SYS_PR5_player_ai_report.md) — **PR5 Player AI 도입.** 수면·수분·영양 1차 행동. active baseline 700회 재실행 — chef·doctor가 K3 +1일 (4.0 vs 3.0). 자원 채집 부재로 K1 여전 0% (PR5.5 권고).
- [`SYS_PR_issue4_factory_migration.md`](./SYS_PR_issue4_factory_migration.md) — **이슈 4 마이그레이션 완료.** `locationCardFactory.js` + `locationCardMeta.js` 신규. items.js 518→84줄. dangerLevel 12건 불일치 해소(districts.js 단일 진리). chef junggoo 실제 dangerLevel 5 확정.
- [`SYS_PR_fatigue_p1_consistency.md`](./SYS_PR_fatigue_p1_consistency.md) — **fatigue P1 일관화.** `StatSystem.onTP():62`가 `BALANCE.stats.fatigueGainPerTP` 직접 사용 + `player.fatigueDecayMult` 분리. CharCreate dead store 3건 정리.
- [`DIR_VERIFY_chef_start_grace.md`](./DIR_VERIFY_chef_start_grace.md) — **Director 검수.** chef cook_intuition 코드 정합 검증 (encounterMultDaysEnd=7, mult=0.5). 6 게이트 재검증 통과. baseline 실측은 PR5.5 이연.
- [`SYS_PR5_5_resource_ai_report.md`](./SYS_PR5_5_resource_ai_report.md) — **PR5.5 자원 채집 AI.** generateDistrictLoot 매일 3회 + 자원 부족 이주. 사망 원인: 탈수 ↓, 아사 ↑. K1 여전 0% — **R7 신규**(NUTRITION_RESTORE 시뮬 추정값 < game 실측, M2 PR6 권고).
- [`AD_REVIEW_chef_abilities_slot.md`](./AD_REVIEW_chef_abilities_slot.md) — **AD 검수.** chef abilities 5 추가의 UI 영향 0. cook_intuition의 EquipmentModal 표시 누락 후속 권고.
- `LORE_GLOSSARY.md` v0.4 — §3.6 신설. chef·pharmacist abilities 어휘 + "셰프의 직감" 등록.
- [`SYS_PR6_consumable_derive.md`](./SYS_PR6_consumable_derive.md) — **PR6 음식 회복량 game 정합화.** items.js `onConsume` derive. chef K3 +0.5일 (4.0 → 4.5). R7 해소.
- [`SYS_PR_event_landmark_integration.md`](./SYS_PR_event_landmark_integration.md) — **이벤트 랜드마크 6종 items.js 통합.** 6 종 등록 완료. 순환 의존 회피로 정적 메타.
- [`PD_MILESTONE_M2_close.md`](./PD_MILESTONE_M2_close.md) — **PD M0~M2 종결 보고.** 14 게임 PR + 18 시뮬 파일 + 38 회의 산출물 + 147/147 단위 검사 + 31 시스템 시뮬 init. 4 핵심 이슈 중 2 완료(1·4) / 2 PR7 후(2·3). 핵심 발견 25건.
- [`SYS_SPIKE_sim_v2_phase0.md`](./SYS_SPIKE_sim_v2_phase0.md) — **Phase 0 spike 보고.** 4 검증 항목 실측. **핵심 발견 2건:** (1) stamina 공식 = `strength × endurance / 50` (시뮬 v2 v2의 ×1.7 추정 오류 정정), (2) **chain 모델 폐기** — 게임은 27 시스템 독립 `tpAdvance` 구독 모델. 시뮬 v2 디렉터리 단순화 가능 (engines/ 11 모듈 폐기). 설계서 v2.1 갱신 5건 선행 후 PR1 진입.
- [`SYS_DESIGN_sim_v2_v2_1.md`](./SYS_DESIGN_sim_v2_v2_1.md) — **시뮬 v2.1 설계서.** spike 결과 5건 반영: engines/ 11 모듈 폐기 → `systemBootstrap.mjs`, stamina 공식 정정, "27 systems on tpAdvance" multicast 모델, `systemBootstrapOrder.test`, PR4 통합. **일정 단축 D+12 → D+10.**
- [`SYS_PR1_sim_v2_report.md`](./SYS_PR1_sim_v2_report.md) — **시뮬 v2 PR1 머지 보고.** `tools/sim/v2/` 12 파일 작성. 단위 검사 87/87 통과. CLI 동작 확인. **추가 격차 12건 발견** (doctor HP 105, chef dangerLevel 5, pharmacist startDistrict `gangnam`, homeless startDistrict `gwangjin` 등 — 모두 v1 시뮬이 정지된 옛 값). chef 시작 dangerLevel 5는 직업 격차 P1 의심.
- [`SYS_SIM_SKIP_classification.md`](./SYS_SIM_SKIP_classification.md) — **27 시스템 SIM_SKIP 분류표.** 실측 BOOTSTRAP 14 / UNCERTAIN 17 / SKIP 4. PR2.5 spike 절차 정의.
- [`SYS_PR2_sim_v2_report.md`](./SYS_PR2_sim_v2_report.md) — **시뮬 v2 PR2 머지 보고.** `systemBootstrap.mjs` + `drift.mjs` + 단위 검사 3건. **단위 검사 130/130 통과. BOOTSTRAP 14 시스템 모두 시뮬 환경에서 init 성공.** BALANCE 트리 leaf 227 추적, balanceFingerprint 결정성 확인, EventBus cleanup 검증. PR2.5 (UNCERTAIN 17 spike) 권고.
- `LORE_GLOSSARY.md` v0.2 — §3.5 7직업 정식 캐릭터 이름 등록 (검토 L1 보완).

### M2 (예정)
- `SCN_QUEST_{firefighter|soldier|homeless|engineer|chef|pharmacist}_tier2.md` × 6
- `SYS_DESIGN_companion_classSkills_v2.md`
- 팩토리 마이그레이션 PR (시스템)
- `BAL_TUNING_*.md` (baseline 결과 기반)

### M3 — 진행 (PR7 → PR8 → PR9 → baseline v5)

**M3 #1~#4 (PR7 트랙, master `0b167ac` + `584326e`):**
- [`BAL_SIM_baseline_v3_report.md`](./BAL_SIM_baseline_v3_report.md) — **baseline v3 700회 측정.** PR5+PR5.5+PR6 누적 효과 측정. K1 전 직업 0% / K3 chef 4.5d / chef 격차 +1.5d / 사망 원인 아사 569·절망 110·탈수 20. R7-1/-2 신규 (cooking·fishing·morale AI 부재).
- `BAL_SIM_baseline_v3_result.json` — baseline v3 raw 데이터 (700 runs).
- [`BAL_TUNING_chef_grace.md`](./BAL_TUNING_chef_grace.md) — **chef cook_intuition 튜닝 결정.** `days=7, mult=0.5` 합의. baseline v3 chef +1.5d 격차를 보호 가능 수준으로 검증.
- [`DIR_VERIFY_chef_grace_v2.md`](./DIR_VERIFY_chef_grace_v2.md) — **Director 검수 v2.** chef grace 코드 정합 + 6 게이트 재검증 통과.
- [`SYS_PR7_cooking_fishing_morale_ai.md`](./SYS_PR7_cooking_fishing_morale_ai.md) — **PR7 머지 보고.** `actCook` / `actFish` / `actBoostMorale` 3 AI 도입 + `gameStateReset` skill 주입 P1 보정. baseline v3 K1=0% 원인 분석 — 자원 게이팅 (raw cooking 입력 부재 + fishing_rod 부재). PR8 권고 옵션 A/B/C 신규 등록.

**M3 #5~#7 (PR8 / PR9 트랙):**
- [`PD_BAL_MEETING_PR8_decision.md`](./PD_BAL_MEETING_PR8_decision.md) — **PD/Balance 협의서 v1.** PR8 결정. **옵션 A(시작 7구 lootTable raw food 가중치 추가, dobong 제외) + 옵션 B(7직업 startInv에 instant_noodles + contaminated_water 균등 보강) 병행 단일 PR.** 옵션 C는 baseline v4 결과로 폴백 판정.
- **PR8 머지 (master `d42514f`)** — `js/data/characters.js` 7직업 startingItems + `js/data/districts.js` 6 시작 구 lootTable. validate.js Errors 0. 신규 아이템 0건.
- [`BAL_SIM_baseline_v4_report.md`](./BAL_SIM_baseline_v4_report.md) — **baseline v4 정식 측정 (PR8 후, 밸런스 권지나).** K1 7직업 0% (6회 연속) / **chef K3 5.2 격차 +2.2d** (협의서 §5.5 +1.0~+2.0d 0.2d 초과) / `actCook` 7직업 100/100 발동 측정 (PR8 효과 입증) / **R8-1 신규** — `homeless`·`engineer` `actBoostMorale` 0% 발견. 협의서 §6.1 PR9 트리거(K1<5%) 명백 충족 단정.
- `BAL_SIM_baseline_v4_result.json` — baseline v4 raw 데이터 (700 runs, fingerprint v3와 동일).
- [`PD_BAL_MEETING_PR9_decision.md`](./PD_BAL_MEETING_PR9_decision.md) — **PD/Balance 협의서 v2.** PR9 결정. **변형 C-a 채택 — hangang sublocation 진입 시 `fishing_rod_basic` 1회 자동 지급 (per character per run).** chef +2.2d 격차는 `cook_intuition` 단축 보류(모니터링 모드, §6.2 +2.5d 0.3d 여유). R8-1은 별도 트랙(시나리오 한도연 5직업 Tier-2)으로 분리. 협의서 v1 §2.3의 "chef 1직업 도달" 가정을 hasFishing 매트릭스 재검증으로 정정 (4직업이 자체 hasFishing 보유).

**M3 #8~#9 (PR9 시스템 + baseline v5 측정):**
- **PR9 시스템 머지 (master `5bdc261`)** — 협의서 v2 변형 C-a 그대로 구현. `landmarks.js` `firstEnterReward` 신규 필드 + `ExploreSystem._grantFirstEnterReward` 메서드 신설(`enterSubLocation` 시그니처 보존) + `GameState.flags.firstEnterRewardsClaimed` 배열 + `playerAI.mjs:228-235` 시뮬 측 옵션 a 자동 지급(RNG 무사용). validate.js Errors 0. 시뮬 sanity 200 runs — 4 hasFishing 직업 200/200 rod 지급, 어획 누적 101마리(v4 = 0/700).
- [`BAL_SIM_baseline_v5_report.md`](./BAL_SIM_baseline_v5_report.md) — **baseline v5 정식 측정 (PR9 후, 밸런스 권지나).** K1 7직업 0% (**7회 연속** → 협의서 v2 §6.1 PR10 폴백 트리거 충족). **`actFish` 4 hasFishing 직업 52~63/100 발동, 어획 누적 315/700 (v4=0) — PR9 효과 가시화.** chef 격차 +1.94d (5직업) / +1.80d (6직업) — `cook_intuition` grace 단축 보류 유지. **`actCook` 모순 가설 B 단정 — cooking lv 0~1 5직업 산출물 100% boiled_water (nutrition 0). 산식 결함은 `playerAI.mjs:185` benefit 가중치 분리 후보.** 신규 위험 R9-1 (PR9 K1 효과 부족), R9-2 (chef PR9 효과 0) 등록. R8-1 morale 시계열 probe는 v6 측정 시 추가로 이연.
- `BAL_SIM_baseline_v5_result.json` — baseline v5 raw 데이터 (700 runs, fingerprint v3·v4와 동일).

**M3 진행 상태:**

| KPI | v3 | v4 | v5 | 협의서 §5.5 목표 | 충족 |
|-----|----|----|----|------------------|------|
| K1 (전 직업) | 0% | 0% | 0% | ≥ 5% | ❌ 7회 연속 → **PR10 폴백 트리거 충족** |
| K3 chef 격차 (5직업 평균 기준) | +1.5d | +2.2d | +1.94d | +1.0~+2.0d | ✅ 범위 내 |
| K5 chef 탈수 | 20 | 12 | 12 | ↓ | ✅ |
| `actCook` 발동 (chef) | 0 | 100/100 | 100/100 | ≥ 1/day | ✅ (5직업은 가설 B 단정 — 산출물 boiled_water) |
| `actFish` (4 hasFishing) | 0 | 0 | 52~63/100 | ≥ 1/day | ✅ PR9 옵션 C-a 효과 |

**M3 #11 (협의서 v3 작성 마감):**
- [`PD_BAL_MEETING_PR10_decision.md`](./PD_BAL_MEETING_PR10_decision.md) — **PD/Balance 협의서 v3.** PR10 결정. **옵션 C 단독 채택** — `tools/sim/v2/playerAI.mjs:185` `actCook` benefit 산식 nutrition 차별 가중치 도입. **게임 본체 cooking 자동 추천 검증(`SYS_VERIFY_cooking_autopick.md`)을 PR10 머지 *선행 조건*으로 분리** (시스템 백승호 + AD 오은별). R9-1 폴백 우선순위 PR11 옵션 2(25구 확대) → PR12 옵션 1(`baseCatchChance` 0.30 → 0.50). R9-2(chef PR9 효과 0) 변경 보류(chef 격차 보호 유리 결과). R8-1은 baseline v6 측정 D+0 시나리오 한도연 진입.

**M3 #12 (게임 본체 cooking 자동 추천 검증):**
- [`SYS_VERIFY_cooking_autopick.md`](./SYS_VERIFY_cooking_autopick.md) — **시스템 검증 보고 (백승호).** 협의서 v3 §3.5 위임. **시나리오 γ 신규 단정 — 게임 본체에는 cooking 자동 추천 알고리즘이 *부재*.** `CraftSystem.startBlueprint(blueprintId):85`는 외부에서 명시 id를 받고, 모든 호출처(`CraftUI._selectedBp` line 105~125, `QuickCraftPrompt` line 62~70)가 player 클릭으로만 결정. priority/order/weight 필드 3 데이터 파일 0 매칭. **PR10 시뮬 단일 PR 머지 가능** — 단 시뮬 보강은 "본체 정합화"가 아닌 *이상적 player 행동 대리 추정 모델*이라는 단정을 PR body에 명시 의무. needs-aware 산식 권고. AD 오은별 UI 검증 트랙 잔여 의문 3건 위임 (hover hint UX 부하 / `_renderOutputPreview:274~324` 산출물 비교 부하 / 사이드바 hydration·nutrition 게이지 안내 충분성).

**M3 #12 (게임 본체 검증 + PR10 + baseline v6 — 마감, PR10 git 머지만 대기):**
- [`AD_VERIFY_cooking_ui.md`](./AD_VERIFY_cooking_ui.md) — **AD 검증 보고 (오은별, 420줄).** 협의서 v3 §9.2 AD 영역 위임 + SYS_VERIFY §7 잔여 의문 3건. **항목 1 hover hint 부족 (cooking 8건 모두 이름만)** / **항목 2 OutputPreview 일부 부족** (수치는 있으나 동시 비교 UI 부재 + DESIGN.md `--stat-*` 토큰 미적용) / **항목 3 사이드바 게이지 충분** (3단 임계 + critical-alert). UI 변경 권고 2건은 PR10 머지 차단 아님. **needs-aware 산식 권고 강화** — `StatRenderer.js:181~198` 임계 경고와 정합.
- **PR10 옵션 C 코드 구현 (`tools/sim/v2/playerAI.mjs:172-201`)** — `actCook` benefit 산식을 needs-aware 분기로 변경 (`needsNutrition = nutCur < nutMax * 0.5 ? n*3+h : n+h*1.5`). validate.js Errors 0, fingerprint `len316-h242a5b5f` 유지. **git 머지 대기**.
- [`BAL_SIM_baseline_v6_report.md`](./BAL_SIM_baseline_v6_report.md) — **baseline v6 정식 측정 (PR10 후, 밸런스 권지나, 327줄).** K1 7직업 0% **8회 연속** → 협의서 v3 PR11 폴백 트리거 충족. **homeless K3 3.20 → 4.10 (+0.9d) 단독 측정** (PR10 직접 효과). cooking lv 0 4직업(doctor·soldier·firefighter·engineer) 변화 0 — `cook_noodles` blueprint `requiredSkills.cooking: 1` 잠금. chef·pharmacist 회귀 0. **R10-1 신규 등록** — 절망 사망 +25(사망일 연장 부산물). R8-1 트랙(M3 #10) 우선순위 상향 권고.
- `BAL_SIM_baseline_v6_result.json` — baseline v6 raw 데이터 (buildTag `sim-baseline-v6-pr10`, fingerprint v3·v4·v5와 동일).
- **협의서 v3 §12 보강 회의록 추가** — 시나리오 γ 신규 단정 (α/β 양분 폐기) / §9.5 KPI 재정의 (5직업 → cooking lv ≥1 직업) / §10.6 GameState 경로 정정 (`player.nutrition` → `stats.nutrition`) / R10-1 등록 / §11 다음 단계 갱신.

**M3 #13 (협의서 v4 작성 마감):**
- [`PD_BAL_MEETING_PR11_decision.md`](./PD_BAL_MEETING_PR11_decision.md) — **PD/Balance 협의서 v4.** PR11 결정. **옵션 2 단독 채택** — `js/data/districts.js` 25구 lootTable에 `herb`·`wild_berry`·`vegetable` 3종 raw food 가중치 추가(일반 1.0 / 위험 dangerLevel ≥ 3 0.5 / dobong 0.5). 옵션 1(`fishing.baseCatchChance` 0.30→0.50)은 PR12 폴백, 옵션 3(fish 영양 상향) 최후순위. `generateDistrictLoot():902-927` scavenging 미반영 단정 유지 — 7직업 균등 분포. M3 #14b(interactions.js T1 시뮬 모사)는 PR11 머지 + baseline v7 측정 후 분리 트랙. R10-1 + R8-1 결합으로 M3 #10 시나리오 한도연 트랙 우선순위 상향 — baseline v7 측정 D+0 진입 의무 + R8-1 morale 시계열 probe 신규.

**M3 #14a (PR11 옵션 2 구현 + baseline v7 측정 마감):**
- `js/data/districts.js` 25구 lootTable 75 entry 추가 (vegetable 25 + herb 25 + wild_berry 25). vegetable 기존 정의(`items_base.js:1195-1203`), stackConfig.js 신규 등록(4곳 룰 충족).
- baseline v7 1차 측정(가중치 1.0/0.5) → 사양 결함 노출(K1·K3 변화 0). **협의서 v4 §12 보강 회의록 추가 — 가중치 재조정 1.0/0.5 → 8/4 합의.**
- baseline v7 2차 측정(가중치 8/4) — fingerprint `len316-h242a5b5f` 유지, **K1·K3 변화 0 (1차와 동일)**. **PR11 옵션 2 *설계 자체 결함* 단정** — cooking lv 0 4직업 actCook 잠금 + cooking lv ≥1 직업 cooked_noodles 이미 충분으로 양극단 효과 0.
- probe 3종: actExplore 분포 / **R8-1 원인 2 단정** (homeless·engineer day 2 morale 12~13 급락, 회복 자원 부재) / R10-1 절망 +6 (v6 167 → v7 173, +50 트리거 미충족 안전).
- `BAL_SIM_baseline_v7_result.json` raw 데이터 — buildTag `sim-baseline-v7-pr11`, fingerprint v3·v4·v5·v6와 동일.

**M3 #14b (PR12 + interactions.js T1 시뮬 모사 + baseline v8 마감):**
- **PR12** — `js/data/gameBalance.js:328` `fishing.baseCatchChance` 0.30 → 0.50. 1회 어획 기댓값 3 → 5 (+66%).
- **M3 #14b** — `tools/sim/v2/playerAI.mjs:172-310` T1_TRANSFORMS 4 규칙 + `actT1Convert` + `runDayAI` 폴백 호출 (+44줄, cooking lv 0 한정 발동). sanity 200 runs — cooking lv 0 4직업 actT1Convert 발동 ≥ 1/회차, chef·pharmacist·homeless 회귀 0.
- [`BAL_SIM_baseline_v8_report.md`](./BAL_SIM_baseline_v8_report.md) — **baseline v8 정식 측정 (밸런스 권지나, 281줄).** K1 0% **9회 연속**. **cooking lv 0 4직업 K3 +0.9~2.0d 큰 향상** (T1 모사 효과 가시화: doctor 4.0→4.9 / soldier 3.0→4.5 / firefighter 3.0→5.0 / engineer 3.1→4.4). **K5 사망원인 1위 역전** — 아사 506→263 / **절망 173→405 (+232)**. fingerprint `len316-h242a5b5f` 유지 (PR12 leaf 값 변경에도 무영향 — drift 측정 한계 단정).
- `BAL_SIM_baseline_v8_result.json` — buildTag `sim-baseline-v8-pr12-t1`.
- **협의서 v4 §13 추가 보강 회의록** — R11-1 신규 위험(chef 격차 +0.60d 하한 +1.0d 미달) / PR12 단독 효과 0 단정 (pharmacist 4.1→4.1) / fingerprint drift 측정 한계 단정 / **M3 #10 진입 단언** (R10-1 +232 = 기준 4.6배 초과).

**M3 #16 (시나리오 한도연 R8-1 핵심 2직업 진입 마감):**
- [`SCN_QUEST_homeless_tier2.md`](./SCN_QUEST_homeless_tier2.md) — **homeless Tier-2 결정 (533줄).** ability `street_solace` (거리의 위안, 🕯️). `moraleRecoveryBonus 1.5` + `lowMoraleRecoveryFatigueBonus -5`. 신규 자원 `worn_photo` (낡은 사진, 📷, onConsume morale+12·fatigue-3, subtype keepsake). `newspaper_bundle` morale+3 기존 갱신. startingItems 8→10.
- [`SCN_QUEST_engineer_tier2.md`](./SCN_QUEST_engineer_tier2.md) — **engineer Tier-2 결정 (546줄).** ability `workshop_focus` (작업 몰입, 🔧). `moraleOnCraft 5` + `moraleOnDismantle 5` + `sketchNotebookBonus true`. 신규 자원 `sketch_notebook` (설계도 노트, 📓, onConsume morale+10·fatigue-5·defaultDurability 3·dismantle paper). startingItems 6→9.
- 6 게이트 검수 — homeless 5/6 통과+1 모니터링 / engineer 5/6 통과+1 모니터링 / worn_photo·sketch_notebook 6/6 전수 통과.
- **R11-1 임계 깨짐 단정** — homeless+engineer 합산 chef 격차 정의 1 +0.37d / 정의 2 +0.42d → +0.5d 임계 깨짐 단언. **PR14 chef 정체성 강화 트랙 진입 의무** 신규 등록.
- PR13 patch diff 추정 — characters.js +23/-4 + items_misc.js +24/-3 + stackConfig.js +5 + CardFactory.js +2 = 총 ~60 라인.

**M3 #17 (PR13 머지 + baseline v9 마감):**
- **PR13 patch diff** — 4 파일 +52/-2 라인 (시스템 백승호). characters.js homeless·engineer 갱신 + items_misc.js newspaper_bundle·worn_photo·sketch_notebook + stackConfig.js + CardFactory.js. 4곳 등록 룰 충족. sketch_notebook dismantle paper 미정의로 `[]` 보수 처리.
- [`BAL_SIM_baseline_v9_report.md`](./BAL_SIM_baseline_v9_report.md) — **baseline v9 정식 측정 (밸런스 권지나, 288줄).** K1 0% **10회 연속** / fingerprint `len316-h242a5b5f` v3~v9 7연속 유지 / **engineer K3 4.4→4.9 (+0.5d 단독 향상)** / homeless K3 4.2→4.2 (Δ 0) / **K5 절망 -28 (homeless 단독 -22)** R8-1 부분 완화 / chef 격차 정의 2 +0.50d 임계 경계 도달.
- `BAL_SIM_baseline_v9_result.json` — buildTag `sim-baseline-v9-pr13`.
- **협의서 v4 §14 추가 보강 회의록** — R8-1 부분 완화 단정·R11-1 미발동 단정(액션 트리거 미충족, 모니터링 유지)·**R13-1 신규 위험 등록**(Tier-2 ability sim AI 미구현, SCN_QUEST 추정-실측 격차 일차 원인)·다음 단계 갱신(PR15 1순위 선행 조건).

**다음 트리거 (협의서 v4 §14.5):** **PR15 — `tools/sim/v2/playerAI.mjs` ability 가산 분기 구현 (시스템 백승호)**. `moraleRecoveryBonus`·`moraleOnCraft`·`moraleOnDismantle`·`sketchNotebookBonus`·기타 ability bonus 필드 enumerate. R13-1 해소 + 측정 도구 정합화. baseline v10 측정 → R11-1 발동 단정 → M3 #18/#19/#20 진입.

---

## M0 적용 결과 (2026-05-10 승인 후 즉시)

| 항목 | 상태 | 증거 |
|------|------|------|
| `mainQuests/index.js` PHARMACIST_QUESTS import + 병합 | ✅ 완료 | 패치 적용 |
| `validate.js` §9 신규 룰 (직업 quest 등록 검증) | ✅ 완료 | 7직업 등록 확인 |
| 검증 실행 결과 | ✅ 통과 | `Errors: 0 / ALL CLEAR / 검사한 퀘스트: 239` |
| 약사 메인 퀘스트 등록 수 | ✅ **26 quests** | hotfix 전 0 → 후 26 |
| `pharmacist.js`(chef 잔재 단일파일) 처리 | ⏳ M1 대기 | 코드 grep 결과 사용처 0건 — M1에 안전 삭제 가능 |

**남은 후속 (M1):**
- 시나리오 한도연 — 약사 시작 시 첫 트리거 발화 게임 내 회귀 확인.
- 밸런스 권지나 — 약사 100회 시뮬을 baseline v1에 포함.
- 시스템 백승호 — `pharmacist.js` 단일파일 안전 삭제.
- 설정 이수정 — `LORE_GLOSSARY.md` §3에 약사 어휘 시드 등록 완료.

---

## 마이그레이션 신규 발견 분류 (페르소나 회의 추가 결정)

`SCN_AUDIT_location_refs.md` `SYS_DESIGN_location_card_factory.md` `SYS_REVIEW_event_polling_audit.md` 작성 중 발견된 4개 항목 우선순위.

| 발견 | 분류 | 마일스톤 | 1차 담당 |
|------|------|----------|----------|
| 이벤트 전용 랜드마크 6종(`lm_raider_camp_*` × 3, `lm_power_station`, `lm_water_plant`, `lm_comms_tower`) `items.js` 정의 누락 의심 | **P1** | M1 | 시스템 (정의 검사 PR) |
| `loc_gangnam.encounterChance: 0.35` vs `districts.gangnam.encounterChance: 0.15` 불일치 (단일 진리 부재) | **P1** | M1 (조사) → M2 (해소) | 시스템 + 레벨 |
| `pharmacist.js` 단일파일이 chef 콘텐츠 잔재 (사용처 0건 확인) | **P2** | M1 | 시스템 안전 삭제 |
| NoiseSystem이 이미 3 이벤트 통합 진입점 — 책임 단일성 약화 | **P2** | M2 (또는 측정 결과 따라 M3) | 시스템 |

**P1 두 항목 즉시 후속 트리거.** 이벤트 랜드마크 누락은 soldier·engineer 메인 퀘스트(`mainQuests/soldier/shared.js`, `mainQuests/engineer/branch_b.js` 합 6 objective)의 무한 미달성 가능성. encounterChance 불일치는 게임 런타임 동작 자체가 어느 값을 쓰는지 모르는 상태이므로 baseline 시뮬 결과 신뢰도에 영향.

---

## 회의록·논의 형식 보존

각 산출물은 페르소나 단일 시각의 결정문이지만, 횡단 발견(예: "이벤트 전용 랜드마크 6종 정의 누락")은 다른 페르소나 산출물과 cross-reference로 추적 가능.

| 횡단 발견 | 짚은 페르소나 | 짚은 문서 |
|-----------|---------------|-----------|
| 이벤트 전용 랜드마크 정의 누락 의심 | 시나리오·시스템 | SCN_AUDIT §4 / SYS_DESIGN §7 |
| `encounterChance` 두 파일 불일치 | 시스템 | SYS_DESIGN §1 (gangnam 0.35 vs 0.15) |
| pharmacist.js 단일파일 chef 잔재 | PD·시나리오·시스템 | PD_HOTFIX §6 |
| NoiseSystem 책임 단일성 약화 | 시스템 | SYS_REVIEW §4.1 |

---

*문서 끝. 페르소나 갱신·회의 재개 시 본 README와 마일스톤 표 우선 갱신.*
