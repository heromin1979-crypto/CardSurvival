# 페르소나 회의 트랙 — 2026-05-10 ~ 2026-05-12

> 7개 게임 기획 페르소나(PD·Director·Lore·Scenario·Level·System·Balance) 합동 회의 산출물.
> **마일스톤 M0~M3 공식 종결 (2026-05-12).** 다음 마일스톤 M4 텔레메트리 트랙 진입 대기.

---

## 마일스톤 진행 결과

| MS | 기간 | 핵심 이슈 | 결과 |
|----|------|----------|------|
| M0 | 2026-05-10 | pharmacist 메인 퀘스트 미로드 (P0 hotfix) | ✅ 완료 (v1+v2) |
| M1 | 2026-05-10~5/11 | baseline v1 측정 / 시뮬 v2 인프라 / 6직업 비대칭 | ✅ 완료 |
| M2 | 2026-05-11 | 이슈 4 팩토리 마이그레이션 / chef 5 PR 패키지 | ✅ 완료 |
| **M3** | **2026-05-10~5/12** | **시뮬 정합 게임 데이터 작성 — 시뮬 R11-1 완전 해소** | ✅ **공식 종결** |
| M4 | (대기) | 게임 본체 K1 검증 텔레메트리 트랙 | 협의서 v6 발행 대기 |

**M3 마지노선 7건 충족 단언** (PD 김재훈, 2026-05-12):
1. 시뮬 R11-1 완전 해소 (chef 격차 +1.29d, 1차 KPI 1.29배)
2. R8-1 완전 해소 (절망 405 → 161, -47%)
3. R10-1 단계적 해소 (누적 -181, 44.7% 회수)
4. R15-1 완전 해소 (craft 발동 빈도 보강)
5. 5직업 Tier-2 완결 (chef·firefighter·soldier·pharmacist·homeless·engineer)
6. 5곳 등록 룰 표준 운영 정의 (items + stackConfig + CardFactory + characters + playerAI.actEat)
7. fingerprint `len316-h242a5b5f` v3~v14 12연속 유지 (BALANCE leaf 결정성)

---

## 산출물 분류 (재정리, 2026-05-13)

### [00-decisions/](./00-decisions/) — PD·DIR 의사결정·마감 보고 (14건)

**PD hotfix:**
- [`PD_HOTFIX_PHARMACIST.md`](./00-decisions/PD_HOTFIX_PHARMACIST.md) — M0 hotfix v1, `mainQuests/index.js` 등록
- [`PD_HOTFIX_PHARMACIST_v2.md`](./00-decisions/PD_HOTFIX_PHARMACIST_v2.md) — v2, `characters.js` 캐릭터 정의 추가

**PD/Balance 협의서 5건 (PR 트랙별):**
- [`PD_BAL_MEETING_PR8_decision.md`](./00-decisions/PD_BAL_MEETING_PR8_decision.md) — v1, 옵션 A+B 병행 (startInv + lootTable)
- [`PD_BAL_MEETING_PR9_decision.md`](./00-decisions/PD_BAL_MEETING_PR9_decision.md) — v2, 변형 C-a (hangang fishing_rod 1회 자동 지급)
- [`PD_BAL_MEETING_PR10_decision.md`](./00-decisions/PD_BAL_MEETING_PR10_decision.md) — v3, 옵션 C (actCook needs-aware 산식)
- [`PD_BAL_MEETING_PR11_decision.md`](./00-decisions/PD_BAL_MEETING_PR11_decision.md) — v4, 옵션 2 (25구 lootTable raw food)
- [`PD_BAL_MEETING_PR14_decision.md`](./00-decisions/PD_BAL_MEETING_PR14_decision.md) — v5, A+B (chef Tier-2 + 신규 자원) ★ 시뮬 R11-1 완전 해소 단언

**PD 마일스톤 마감 보고:**
- [`PD_MEETING_sim_v2_gate.md`](./00-decisions/PD_MEETING_sim_v2_gate.md) — 시뮬 v2 보완판 게이트 통과
- [`PD_MILESTONE_M0_M2_summary.md`](./00-decisions/PD_MILESTONE_M0_M2_summary.md) — M0~M2 종결 보고
- [`PD_MILESTONE_M2_close.md`](./00-decisions/PD_MILESTONE_M2_close.md) — M2 종결 보고 (14 PR + 18 시뮬 파일 + 38 산출물)
- [`PD_MILESTONE_M3_close.md`](./00-decisions/PD_MILESTONE_M3_close.md) ★ — **M3 종결 보고 (426줄)**. 마지노선 7건 충족 + 산출물 종합 + 핵심 학습 5건

**Director 게이트·검수 3건:**
- [`DIR_GATE_chef_start_environment.md`](./00-decisions/DIR_GATE_chef_start_environment.md) — chef junggoo dangerLevel 5 6 게이트
- [`DIR_VERIFY_chef_start_grace.md`](./00-decisions/DIR_VERIFY_chef_start_grace.md) — chef cook_intuition 검수
- [`DIR_VERIFY_chef_grace_v2.md`](./00-decisions/DIR_VERIFY_chef_grace_v2.md) — v2 재검증

### [01-scenario/](./01-scenario/) — 시나리오 기획 (10건)

**감사·PR:**
- [`SCN_AUDIT_location_refs.md`](./01-scenario/SCN_AUDIT_location_refs.md) — 이벤트 전용 랜드마크 6종 정의 누락 발견
- [`SCN_AUDIT_chef_abilities.md`](./01-scenario/SCN_AUDIT_chef_abilities.md) — chef abilities startingItems 부재 결함
- [`SCN_PR_chef_knife_mastery.md`](./01-scenario/SCN_PR_chef_knife_mastery.md) — chef knife_mastery PR 머지 보고

**Tier-2 abilities (6직업) + chef supply:**
- [`SCN_QUEST_chef_tier2.md`](./01-scenario/SCN_QUEST_chef_tier2.md) — `pantry_mastery` + chef_journal + spice_blend
- [`SCN_QUEST_chef_supply.md`](./01-scenario/SCN_QUEST_chef_supply.md) ★ — chef 전용 자원 2종 (chef_meal_kit + hearty_stew), 5곳 등록 룰 첫 적용
- [`SCN_QUEST_homeless_tier2.md`](./01-scenario/SCN_QUEST_homeless_tier2.md) — `street_solace` + worn_photo
- [`SCN_QUEST_engineer_tier2.md`](./01-scenario/SCN_QUEST_engineer_tier2.md) — `workshop_focus` + sketch_notebook
- [`SCN_QUEST_firefighter_tier2.md`](./01-scenario/SCN_QUEST_firefighter_tier2.md) — `rescue_resolve` + family_photo
- [`SCN_QUEST_soldier_tier2.md`](./01-scenario/SCN_QUEST_soldier_tier2.md) — `comrade_memorial` + dog_tag
- [`SCN_QUEST_pharmacist_tier2.md`](./01-scenario/SCN_QUEST_pharmacist_tier2.md) — `compounding_focus` + pharmacy_notes

### [02-system/](./02-system/) — 시스템 설계·PR·검증 (19건)

**설계서:**
- [`SYS_DESIGN_location_card_factory.md`](./02-system/SYS_DESIGN_location_card_factory.md) — location/landmark 카드 팩토리
- [`SYS_DESIGN_sim_v2.md`](./02-system/SYS_DESIGN_sim_v2.md) — 시뮬 v2 v1 (검토 후 보완)
- [`SYS_DESIGN_sim_v2_v2.md`](./02-system/SYS_DESIGN_sim_v2_v2.md) — 시뮬 v2 보완판 (6 보완 반영)
- [`SYS_DESIGN_sim_v2_v2_1.md`](./02-system/SYS_DESIGN_sim_v2_v2_1.md) — spike 결과 반영판 (engines/ 폐기, stamina 공식 정정)

**Spike·분류:**
- [`SYS_SPIKE_sim_v2_phase0.md`](./02-system/SYS_SPIKE_sim_v2_phase0.md) — Phase 0 spike (stamina 공식·chain 모델 폐기)
- [`SYS_SIM_SKIP_classification.md`](./02-system/SYS_SIM_SKIP_classification.md) — 27 시스템 SIM_SKIP 분류

**리뷰·검증:**
- [`SYS_REVIEW_event_polling_audit.md`](./02-system/SYS_REVIEW_event_polling_audit.md) — 4 이벤트 시스템 폴링 감사
- [`SYS_REVIEW_charcreate_decay_hardcode.md`](./02-system/SYS_REVIEW_charcreate_decay_hardcode.md) — CharCreate decay 하드코딩 P0 false alarm
- [`SYS_VERIFY_cooking_autopick.md`](./02-system/SYS_VERIFY_cooking_autopick.md) — 게임 본체 cooking 자동 추천 부재 단정 (시나리오 γ)
- [`REVIEW_sim_v2_v1.md`](./02-system/REVIEW_sim_v2_v1.md) — 6 페르소나 합동 검토 (6건 필수 보완)

**PR 보고서 9건:**
- [`SYS_PR1_sim_v2_report.md`](./02-system/SYS_PR1_sim_v2_report.md) — 시뮬 v2 PR1 (12 파일, 단위 87/87 통과)
- [`SYS_PR2_sim_v2_report.md`](./02-system/SYS_PR2_sim_v2_report.md) — systemBootstrap.mjs + drift.mjs (단위 130/130, BOOTSTRAP 14 init 성공)
- [`SYS_PR5_player_ai_report.md`](./02-system/SYS_PR5_player_ai_report.md) — PR5 Player AI 도입
- [`SYS_PR5_5_resource_ai_report.md`](./02-system/SYS_PR5_5_resource_ai_report.md) — PR5.5 자원 채집 AI
- [`SYS_PR6_consumable_derive.md`](./02-system/SYS_PR6_consumable_derive.md) — PR6 음식 회복량 정합화
- [`SYS_PR7_cooking_fishing_morale_ai.md`](./02-system/SYS_PR7_cooking_fishing_morale_ai.md) — PR7 actCook/actFish/actBoostMorale 3 AI
- [`SYS_PR_issue4_factory_migration.md`](./02-system/SYS_PR_issue4_factory_migration.md) — 이슈 4 팩토리 마이그레이션
- [`SYS_PR_fatigue_p1_consistency.md`](./02-system/SYS_PR_fatigue_p1_consistency.md) — fatigue P1 일관화
- [`SYS_PR_event_landmark_integration.md`](./02-system/SYS_PR_event_landmark_integration.md) — 이벤트 랜드마크 6종 items.js 통합

### [03-ad-ui/](./03-ad-ui/) — AD/UI 리뷰·검증 (2건)
- [`AD_REVIEW_chef_abilities_slot.md`](./03-ad-ui/AD_REVIEW_chef_abilities_slot.md) — chef abilities UI 영향 검토
- [`AD_VERIFY_cooking_ui.md`](./03-ad-ui/AD_VERIFY_cooking_ui.md) — cooking UI 검증 (hover hint·OutputPreview·게이지)

### [04-lore/](./04-lore/) — 설정·글로서리 (1건)
- [`LORE_GLOSSARY.md`](./04-lore/LORE_GLOSSARY.md) — 글로서리 (25 구·6직업·핵심 어휘·chef·pharmacist abilities)

### [05-audits/](./05-audits/) — 일반 감사 (2건)
- [`SIM_AUDIT_v1.md`](./05-audits/SIM_AUDIT_v1.md) — 시뮬 인프라 격차 감사 (게임 코드 import 0건 등 발견)
- [`UNREACHABLE_AUDIT_v1.md`](./05-audits/UNREACHABLE_AUDIT_v1.md) — 미도달 기능 감사 (validate.js dead-end 10건 false positive 판정)

---

## 시뮬레이션 데이터 (외부 폴더)

baseline 측정 데이터는 `/simulation-data/`로 분리되었습니다. 인덱스: [`simulation-data/README.md`](../../../simulation-data/README.md)

- baseline v1·v3~v14 보고서 13건 → `simulation-data/baselines/reports/`
- baseline v1·v3~v14 raw JSON 13건 → `simulation-data/baselines/raw/`
- baseline 계획 2건 → `simulation-data/baselines/plans/`
- 튜닝 결정 1건 → `simulation-data/tuning/`

---

## M3 트랙 단일 정체성 (협의서 v5 §15, 2026-05-12 단정)

**"시뮬 정합 게임 데이터 작성" 트랙.** baseline KPI(K1·K3·K5·chef 격차)는 *시뮬 K1 마지노선*. 게임 본체 K1과의 매핑은 M4+ 텔레메트리 트랙으로 분리. 모든 R/KPI 단언은 시뮬 도구 안에서 해석.

**5곳 등록 룰 (표준 운영 정의, 협의서 v5 §16.3):** 신규 자원 추가 시 5곳 등록 필수.
1. `js/data/items_misc.js` (또는 items_base 등) — 아이템 정의
2. `js/data/stackConfig.js` — 스택 룰
3. `js/factories/CardFactory.js` CARD_IMAGES — 이미지 매핑
4. `js/data/characters.js` startingItems — 시작 인벤토리
5. `tools/sim/v2/playerAI.mjs:130~133 actEat candidates` — 시뮬 효과 발현 (5곳째 신규)

---

## M4 진입 예정 작업 (M3 잔존 + M4 신규)

- 협의서 v6 신규 발행 (M4 텔레메트리 트랙 정체성 정의)
- 게임 본체 K1 검증 — 실제 player 행동이 시뮬 player 행동과 일치하는지 측정
- M3 잔존 5건 (M4 이월 또는 분리 후순위 PR):
  - PR18 R13-1 dismantle sim 모사 (시스템 백승호)
  - spice_blend actEat candidates 잔존 결함 정리 (1~2 라인)
  - PR16.2 R14-2 soldier 재조정 (후순위)
  - AD UI 변경 권고 2건 (AD 오은별, 독립)
  - drift.mjs leaf 값 hash 컬럼 추가

---

*문서 끝. 회의 재개 시 본 README + `PD_MILESTONE_M3_close.md` 우선 갱신.*
