# 페르소나 회의 M3 트랙 — 직업 비대칭 해소 + cooking AI 발동 보강

> 시작일: 2026-05-10 (페르소나 회의 산출물 — 7 페르소나 합동 학습 후)
> 트랙: M3 (이슈 #2 6직업 비대칭 / 이슈 #3 후반 이벤트 폭주 측정)
> 상태: **PR10 머지 + baseline v6 측정 + 협의서 v3 §12 보강 + 협의서 v4(PR11 결정) 작성 완료. PR11 옵션 2 구현 진입 대기 (시스템 백승호).**
> 이전 계획: `docs/archive/prompt_plan.old5.md` (CST 패턴, 2026-04-28 마감)
> 회의 산출물 인덱스: `docs/persona-meeting-2026-05-10/README.md`

## 배경

페르소나 회의(PD·Director·Lore·Scenario·Level·System·Balance) 4 핵심 이슈 식별 후 마일스톤 분리:

| 이슈 | 분류 | 마일스톤 | 진행 |
|------|------|----------|------|
| #1 pharmacist 메인 퀘스트 미로드 | P0 hotfix | M0 | ✅ 완료 (v1+v2) |
| #2 6직업 정체성 비대칭 (doctor 전용 분기만 풍부) | P1 | M1 baseline → M2 Tier-2 → M3 Tier-1 | 🟡 진행 |
| #3 후반 이벤트 4종 폭주 위험 | P1 | M3 측정 후 분기 결정 | ⏳ 대기 |
| #4 `items.js` location/landmark 정보 중복 | P2 | M2 마이그레이션 | ✅ 완료 |

M3는 시뮬 v2 인프라(PR1~PR4) → Player AI 5단계(PR5/PR5.5/PR6/PR7) → 데이터 보강(PR8) → 메커닉 보강(PR9) → 측정(v5) → PR10 결정 순서로 K1 0% 병목 해소.

---

## 진행 순서 체크리스트

### M3 #1~#4 (PR7 트랙 마감, master `0b167ac` + `584326e`)

- [x] PR5 — Player AI 도입 (수면·수분·영양 1차 행동) — chef·doctor K3 +1d
- [x] PR5.5 — 자원 채집 AI (`generateDistrictLoot` 매일 3회 + 자원 부족 이주). 사망 원인 탈수↓·아사↑
- [x] PR6 — 음식 회복량 game 정합화 (`onConsume` derive). chef K3 +0.5d (4.0 → 4.5)
- [x] PR7 — `actCook` / `actFish` / `actBoostMorale` 3 AI + `gameStateReset` skill 주입 P1 보정
- [x] baseline v3 측정 (`BAL_SIM_baseline_v3_report.md`) — K1 전 직업 0%, chef 격차 +1.5d 합의
- [x] chef cook_intuition 튜닝 (`BAL_TUNING_chef_grace.md`) — `days=7, mult=0.5`
- [x] Director 검수 v2 (`DIR_VERIFY_chef_grace_v2.md`)
- [x] M3 백로그 잡일 4건 (chef 잔재 삭제 + 순환 의존 해소 + ability 표시 룰 + 글로서리 v0.5)

### M3 #5 (PR8 데이터 머지, master `d42514f`)

- [x] PD/Balance 협의서 v1 (`PD_BAL_MEETING_PR8_decision.md`) — 옵션 A+B 병행 결정, 옵션 C 폴백
- [x] `js/data/characters.js` — 7직업 ability `startingItems`에 `instant_noodles` + `contaminated_water` 추가
- [x] `js/data/districts.js` — 6 시작 구 lootTable에 `herb`·`wild_berry` 가중치 (dobong 제외)
- [x] validate.js — Errors 0, ALL CLEAR
- [x] 신규 아이템 0건 (CARD_IMAGES 변경 불필요)

### M3 #6 (baseline v4 정식 측정, master `ae28964`)

- [x] `tools/sim/v2/run_baseline.mjs` — `OUTPUT_FILE` / `buildTag` v3 → v4
- [x] baseline v4 700회 실측 (`BAL_SIM_baseline_v4_report.md` + `result.json`)
- [x] fingerprint `len316-h242a5b5f` v3와 동일 — BALANCE leaf 변경 0 검증
- [x] K1 7직업 0% (PR9 옵션 C 트리거 K1<5% 충족 단정)
- [x] K3 chef 5.2 격차 +2.2d (5직업 평균 기준), +1.87d (6직업 평균 기준)
- [x] `actCook` 100/100 발동 측정 (PR8 효과 입증)
- [x] R8-1 신규 발견 — `homeless`·`engineer` `actBoostMorale` 0%

### M3 #7 (PR9 결정, master `a8bc6df`)

- [x] PD/Balance 협의서 v2 (`PD_BAL_MEETING_PR9_decision.md`)
- [x] 안건 1: PR9 변형 C-a 채택 — hangang sublocation 진입 시 `fishing_rod_basic` 1회 자동 지급
- [x] 안건 2: chef +2.2d 격차 — `cook_intuition days=7→5` 단축 보류 (모니터링)
- [x] 안건 3: R8-1 별도 트랙 분리 — 시나리오 한도연 5직업 Tier-2 abilities
- [x] 협의서 v1 §2.3 정정 — 시작 구 hasFishing 매트릭스 재검증 (4직업이 자체 hasFishing 보유)

### M3 #8 (PR9 시스템 구현, master `5bdc261`)

- [x] `js/data/landmarks.js` — `firstEnterReward` 신규 필드(`claimKey` + `items` 배열). hangang_fishing_spot/hangang_riverside 두 sublocation `hangang_rod` claimKey 공유로 합산 1회
- [x] `js/systems/ExploreSystem.js` — `enterSubLocation` 시그니처 보존 + `_grantFirstEnterReward` 메서드 신설 (`_placeLoot` 위임, board 만차 시 pendingLoot 폴백 동일)
- [x] `js/core/GameState.js` — `flags.firstEnterRewardsClaimed` 배열 (bossesKilled 패턴 정합, 직렬화 자동 호환)
- [x] `tools/sim/v2/playerAI.mjs:228-235` — 옵션 a 채택 (actFish 진입부 rod 미보유 시 1회 자동 지급, RNG 무사용으로 결정성 영향 0)
- [x] validate.js — Errors 0, ALL CLEAR
- [x] 시뮬 sanity 200 runs — 4 hasFishing 직업 200/200 rod 자동 지급, 어획 누적 101마리 (v4 = 0/700)

### M3 #9 (baseline v5 측정, master `afd30c4`)

- [x] `tools/sim/v2/run_baseline.mjs` — `OUTPUT_FILE` / `buildTag` v4 → v5 (2줄만)
- [x] baseline v5 700회 실측 (`BAL_SIM_baseline_v5_report.md` + `result.json`)
- [x] fingerprint `len316-h242a5b5f` v3·v4와 동일 — BALANCE leaf 변경 0 검증
- [x] K1 7직업 0% (7회 연속) → 협의서 v2 §6.1 PR10 폴백 트리거 충족
- [x] chef K3 격차 측정 +1.94d (5직업) / +1.80d (6직업) — `cook_intuition` 단축 보류 유지 (§6.2 +2.5d 미충족)
- [x] `actCook` 모순 단정 — 가설 B 채택. cooking lv 0~1 5직업 산출물 100% boiled_water (nutrition 0). 산식 결함은 `playerAI.mjs:185` benefit 가중치 분리 후보
- [x] `actFish` 4 hasFishing 직업 52~63/100 발동, 어획 누적 315/700 — PR9 효과 가시화
- [x] R9-1 / R9-2 신규 위험 등록 — R9-1 (PR9 K1 효과 부족), R9-2 (chef PR9 효과 0)
- [ ] R8-1 morale 시계열 probe — v5 부록 §7에서 actCook 모순 우선 단정으로 후순위, **v6 측정 시 추가 예정**

### M3 #10 (5직업 Tier-2 abilities, 시나리오 한도연 위임)

- [ ] `SCN_QUEST_firefighter_tier2.md` (M2 예정 → M3)
- [ ] `SCN_QUEST_soldier_tier2.md`
- [ ] `SCN_QUEST_homeless_tier2.md`
- [ ] `SCN_QUEST_engineer_tier2.md`
- [ ] `SCN_QUEST_pharmacist_tier2.md`
- [ ] R8-1 보강과 동시 진행 — `homeless`·`engineer` morale 회복 자원·이벤트 신규

### M3 #11 (협의서 v3 작성 마감, `docs/persona-meeting-2026-05-10/PD_BAL_MEETING_PR10_decision.md`)

- [x] PD/Balance 협의서 v3 작성 — PR10 옵션 결정 + actCook 모순 후속 처리 (PD 김재훈 + 밸런스 권지나)
- [x] 협의서 v3 안건 1: PR10 = **옵션 C 단독 채택** — `playerAI.mjs:185` benefit 산식 nutrition 차별 가중치 도입. PR11(옵션 A 25구 확대)은 baseline v6 측정 후 조건부
- [x] 협의서 v3 안건 2: **게임 본체 cooking 자동 추천 검증 우선** — 시스템 백승호 + AD 오은별 위임. PR10 머지 *선행 조건*으로 분리
- [x] 협의서 v3 안건 3: R9-1 폴백 우선순위 — PR11 옵션 2(25구 확대) → PR12 옵션 1(`baseCatchChance` 0.30 → 0.50). 옵션 3(fish 영양 상향) 최후순위
- [x] 협의서 v3 안건 4: R9-2 (chef PR9 효과 0) — **변경 보류** (chef 격차 보호 유리 결과)
- [x] R8-1 트랙 진입 시점 — baseline v6 측정 D+0 시나리오 한도연 진입. v6에서 morale 시계열 probe 신규 추가

### M3 #12 (게임 본체 검증 + PR10 + baseline v6 — **다음 진입 트리거**)

- [x] 게임 본체 cooking 자동 추천 검증 — `SYS_VERIFY_cooking_autopick.md` 작성 완료 (시스템 백승호, 440줄)
- [x] 검증 항목 (시스템): `CraftSystem.startBlueprint:85` 외부 id 수용 / 호출처 3건 모두 player 클릭 / priority·order·weight 필드 3 데이터 파일 0 매칭 / `findInteraction:1619~1624` `Array.find` 첫 매칭
- [x] 시나리오 단정 — **γ 신규 정의** (α/β 둘 다 아님). 게임 본체에 자동 추천 알고리즘 *부재*, player 명시적 선택. PR10 시뮬 단일 PR 머지 가능
- [x] 검증 항목 (AD): `AD_VERIFY_cooking_ui.md` 작성 완료 (AD 오은별, 420줄). hover hint 부족 / OutputPreview 일부 부족 / 사이드바 게이지 충분. UI 변경 권고 2건 (PR10 머지 차단 아님). needs-aware 산식 권고 강화 — UI 임계 경고와 정합
- [x] PR10 옵션 C 코드 구현 — `tools/sim/v2/playerAI.mjs:172-201` `actCook` benefit 산식 **needs-aware 분기** (`needsNutrition = nutCur < nutMax * 0.5`). GameState.stats.nutrition 참조 추가. **git 머지 대기** (별도 commit)
- [x] validate.js Errors 0 / Warnings 254 / ALL CLEAR + fingerprint `len316-h242a5b5f` 유지 (BALANCE 미변경 단정)
- [x] baseline v6 측정 (`BAL_SIM_baseline_v6_result.json`) — 700 runs / 7.9s / bootstrapErrors 0. `OUTPUT_FILE` / `buildTag` v5 → v6 (2줄만 변경)
- [x] baseline v6 정식 보고서 (`BAL_SIM_baseline_v6_report.md`, 327줄, 밸런스 권지나) — K1 8회 연속 0% / homeless K3 +0.9d 단독 / cooking lv 0 4직업 변화 0 단정 / cookOut 분리 표 신규 / R10-1 신규 등록
- [x] 협의서 v3 §12 보강 회의록 추가 — 시나리오 γ 단정 / KPI 재정의 ("5직업 ≥50%" → "cooking lv ≥1 직업 ≥50%") / `GameState` 경로 정정 (`stats.nutrition`) / R10-1 등록 / §11 다음 단계 갱신

### M3 #13 (협의서 v4 작성 마감, `docs/persona-meeting-2026-05-10/PD_BAL_MEETING_PR11_decision.md`)

- [x] PD/Balance 협의서 v4 작성 — PR11 옵션 결정 + lootTable 사양 + scavenging 재검증 + M3 #14 시점 + R10-1·R8-1 결합 (PD 김재훈 + 밸런스 권지나)
- [x] 협의서 v4 안건 1: **PR11 = 옵션 2 단독 채택** — `js/data/districts.js` 25구 lootTable raw food 가중치 추가. 옵션 1은 PR12 폴백, 옵션 3은 최후순위. M3 #14는 PR11 머지 + baseline v7 후 분리 트랙
- [x] 협의서 v4 안건 2: **옵션 2 사양** — `herb`·`wild_berry`·`vegetable` 3종 / 일반 1.0 / 위험(dangerLevel ≥ 3) 0.5 / dobong 0.5 / 25구 전수 / minQty 1·maxQty 2 / contamChance 0
- [x] 협의서 v4 안건 3: `generateDistrictLoot():902-927` scavenging 미반영 단정 유지 — 7직업 균등 분포 작용. PR11 진입 결격 없음
- [x] 협의서 v4 안건 4: M3 #14 (interactions.js T1 시뮬 모사) — PR11 머지 + baseline v7 측정 후 분리 트랙 (v8에서 T1 모사 효과 단독 측정)
- [x] 협의서 v4 안건 5: R10-1 + R8-1 결합 — M3 #10 우선순위 상향. baseline v7 측정 D+0 시나리오 한도연 진입 의무. v7에 R8-1 morale 시계열 probe 신규 추가

### M3 #14a (PR11 옵션 2 구현 — **다음 진입 트리거**, 시스템 백승호 위임)

- [ ] `js/data/districts.js` 25구 lootTable에 raw food 가중치 entry 추가 (§3.1 사양 그대로)
- [ ] 25구 dangerLevel 인용 + 위험 구역 0.5 적용 결정 + startDistrict 7직업 매핑 검증
- [ ] `js/data/items_misc.js` 또는 등가에 `vegetable` 정의 + `onConsume.nutrition` 값 확인. 신규 정의 시 stackConfig + CardFactory CARD_IMAGES 4곳 등록 (CLAUDE.md §3)
- [ ] validate.js Errors 0 + ALL CLEAR
- [ ] `tools/sim/v2/run_baseline.mjs` — `OUTPUT_FILE` / `buildTag` v6 → v7 2줄
- [ ] baseline v7 700회 실측 (`BAL_SIM_baseline_v7_report.md` + `result.json`) — fingerprint `len316-h242a5b5f` 유지 검증
- [ ] probe: 7직업 actExplore raw food 산출량 분포 (협의서 v4 §4.2 균등 분포 단정 검증)
- [ ] probe: R8-1 morale 시계열 — homeless·engineer day 1~5 morale.current 추이
- [ ] probe: R10-1 절망 사망 v6→v7 추이 (+50 미만 단정)

### M3 #14b (interactions.js T1 시뮬 모사 — baseline v7 측정 D+0, 분리 트랙)

- [ ] `tools/sim/v2/playerAI.mjs` 또는 등가 — `js/data/interactions.js` T1 변환 규칙 read-only 인용. cooking lv 0 4직업이 cooked_noodles 산출 경로 확보 (actCook/actEat 분기 1개 추가, 추정 50~100줄)
- [ ] fingerprint 회귀 0 검증 (시뮬 로직 PR, BALANCE 미관여)
- [ ] baseline v8 측정에서 T1 모사 효과 단독 측정 — cooking lv 0 4직업 K3 변화 단정

### M3 #15 (AD UI 변경 권고 2건 — 분리 트랙, 독립)

- [ ] (高 권고) `interactions.js` cooking 8 hint 또는 `_showInteractionTip`에 영양/수분 수치 합성 — `js/ui/HoverTooltip.js` 또는 등가
- [ ] (中 권고) `CraftUI._renderOutputPreview:274~324` 산출물 동시 비교 모드 추가 + DESIGN.md `--stat-nutrition`/`--stat-hydration` 토큰 적용
- [ ] AD 오은별 위임. 본 트랙과 의존 0

### M3 #16 (조건부 PR12 / cook_intuition 단축)

- [ ] (조건부) PR12 — `fishing.baseCatchChance` 0.30 → 0.50 (`js/data/gameBalance.js:328`). 진입 트리거: baseline v7 K1 < 5% 유지
- [ ] (조건부) cook_intuition `days = 7 → 5` 단일 상수 PR. 진입 트리거: baseline v7/v8에서 chef 격차 +2.5d 초과 (협의서 v2 §6.2)

### M3 #14 (interactions.js T1 시뮬 모사 보강 — 협의서 v3 §12.3 분리 트랙)

- [ ] `tools/sim/v2/playerAI.mjs` 또는 등가 — `interactions.js` T1 변환 규칙(예: `instant_noodles` + `boiled_water` → `cooked_noodles`) 시뮬 모사 추가. cooking lv 0 4직업(doctor·soldier·firefighter·engineer)이 cooked_noodles 산출 경로 확보
- [ ] 검증: baseline v8 측정 시 cooking lv 0 4직업 nutritionFood ≥ 50% 달성 여부 측정
- [ ] 시스템 백승호 위임 — T1 변환 데이터 read-only 인용으로 시뮬 결정성 영향 단정 필요

### M3 #15 (AD UI 변경 권고 2건 — 분리 트랙)

- [ ] (高 권고) `interactions.js` cooking 8 hint 또는 `_showInteractionTip`에 영양/수분 수치 합성 — `js/ui/HoverTooltip.js` 또는 등가
- [ ] (中 권고) `CraftUI._renderOutputPreview:274~324` 산출물 동시 비교 모드 추가 + DESIGN.md `--stat-nutrition`/`--stat-hydration` 토큰 적용
- [ ] AD 오은별 위임. PR10 머지 차단 아님 — 후속 트랙

---

## KPI 진행 (협의서 v1 §5.5 + v2 §7 + v3 §9.5 + v3 §12.3 정정 갱신)

| KPI | v3 | v4 | v5 | v6 | v7 목표 | 트리거 |
|-----|----|----|----|----|---------|--------|
| K1 (전 직업) | 0% | 0% | 0% | **0%** | ≥ 5% | < 5% **8회 연속** → **PR11 폴백 트리거 충족** |
| K1 (chef) | 0% | 0% | 0% | 0% | ≥ 5% | 우선 측정 |
| K3 chef 격차 (5직업 평균) | +1.5d | +2.2d | +1.94d | **+1.94d** | +1.0~+2.0d 사수 | > +2.5d → grace 단축 (미충족 유지) |
| K3 chef 격차 (6직업 평균) | +1.33d | +1.87d | +1.80d | **+1.80d** | +1.0~+2.0d | 정의 일치 |
| **K3 homeless** | 3.00 | 3.00 | 3.20 | **4.10 (+0.9d)** | 유지 또는 향상 | ✅ PR10 직접 효과 |
| K5 chef 탈수 | 20 | 12 | 12 | 12 | ↓ 유지 | ✅ contaminated_water 효과 |
| K5 chef 극도 피로 | 1 | 6 | 12 | 12 | ≤ 10 | ⚠️ 초과 유지 |
| `actCook` 발동 (chef) | 0 | 100/100 | 100/100 | 100/100 | ≥ 1/day | ✅ |
| `actCook` cookOut nutFood (chef·pharmacist) | 0 | - | 100% | **100% 회귀 0** | 유지 | ✅ |
| `actCook` cookOut nutFood (homeless lv3) | 0 | 0 | 6.5% | **35.3%** | ≥ 50% | ⚠️ 부분 달성 (사망일 연장 PR11 필요) |
| `actCook` cookOut nutFood (lv 0 4직업) | 0 | 0 | 0% | **0%** | ≥ 50% (정정 KPI 면제) | ⚠️ `cook_noodles` blueprint 잠금 — M3 #14 분리 트랙 |
| `actFish` (4 hasFishing) | 0 | 0 | 52~63/100 | **52~63/100** | ≥ 1/day | ✅ |
| `actBoostMorale` (homeless·engineer) | 0 | 0 | 0 | 0 | > 0 | R8-1 + R10-1 결합 — M3 #10 우선순위 ↑ |
| 사망 — 아사 합계 | 555 | 569 | 532 | **510 (-22)** | ↓ | v6 추가 -22 (homeless nutrition 회복) |
| 사망 — 절망 합계 | 110 | 113 | 142 | **167 (+25)** | ↓ | ⚠️ R10-1 신규 — 사망일 연장 부산물 |
| 사망 — 극도 피로 합계 | 1 | 6 | 12 | **9 (-3)** | ≤ 10 | ✅ v6 감소 |

---

## Risks

| Risk | 등급 | v6 상태 |
|------|------|---------|
| R9-1 PR9 옵션 C-a K1 효과 부족 (4 hasFishing 직업 K1 0% 유지) | HIGH | ⚠️ **v6에서도 변화 0** (PR10은 산식만, fishing 보강 아님). PR11 옵션 2(25구 확대) 진입 트리거 |
| R9-2 chef PR9 효과 0 (junggoo hasFishing 미보유, 이동 없음) | LOW-MED | ✅ v6에서도 0 — 변경 보류 유지 (chef 격차 +1.94d 보호 정합) |
| actCook 산식 결함 — 5직업 cooking lv 0~3 산출물 boiled_water 우선 | HIGH | ⚠️ **부분 해소** — needs-aware 산식으로 cooking lv ≥1 직업 정합. cooking lv 0 4직업은 `cook_noodles` blueprint 잠금이 시스템 한계 → M3 #14 (T1 시뮬 모사) 분리 트랙 |
| **R10-1 (신규) 절망 사망 +25** | MED | ⚠️ **v6 신규** — 사망일 연장(homeless +0.9d) 부산물. R8-1 (homeless·engineer actBoostMorale 0%) 결합 시 K1 향상 PR마다 절망 사망 가속 위험 → M3 #10 우선순위 ↑ |
| baseline v7에서도 K1 < 5% 유지 시 폴백 부담 | MED | PR11 옵션 결정 시 PR12 폴백 명시 — `fishing.baseCatchChance` 상향 단일 상수 PR |
| chef 격차 +2.5d 초과 시 grace 단축이 chef 정체성 훼손 | LOW-MED | ✅ v6 +1.94d/+1.80d 유지 — 트리거 미충족 |
| R8-1 별도 트랙 분리로 R7-2 마감 지연 | LOW → MED | R10-1 결합으로 우선순위 상향. baseline v7 측정 D+0 시나리오 한도연 진입 권고 |

---

## 의존성 그래프

```
M3 #1~#4 (PR7) ─── 마감
M3 #5 (PR8 데이터) ─── 마감
M3 #6 (baseline v4) ─── 마감
M3 #7 (PR9 결정) ─── 마감
M3 #8 (PR9 시스템) ─── 마감
M3 #9 (baseline v5) ─── 마감 (R8-1 probe만 v6 이연)
M3 #10 (Tier-2 5직업) ─── baseline v7 측정 D+0 진입 (시나리오 한도연, R10-1 결합으로 우선순위 ↑)
M3 #11 (협의서 v3 작성) ─── 마감
M3 #12 (PR10 + baseline v6 + 협의서 v3 §12 보강) ─── 마감
M3 #13 (협의서 v4 작성) ─── 마감
M3 #14a (PR11 옵션 2 + baseline v7) ─── 진입 대기 (시스템 백승호 — 다음 트리거)
M3 #14b (interactions.js T1 시뮬 모사) ─── baseline v7 D+0 분리 트랙 (시스템 백승호)
M3 #15 (AD UI 변경 권고 2건) ─── 분리 트랙 (AD 오은별, 독립)
M3 #16 (PR12 / cook_intuition 단축 — 조건부) ─── baseline v7/v8 결과 의존
```

---

*문서 끝. 회의 재개 시 본 문서와 `docs/persona-meeting-2026-05-10/README.md` 우선 갱신.*
