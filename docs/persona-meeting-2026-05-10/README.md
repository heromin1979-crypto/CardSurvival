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
