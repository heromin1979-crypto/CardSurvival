# 페르소나 회의 M3 트랙 — 직업 비대칭 해소 + cooking AI 발동 보강

> 시작일: 2026-05-10 (페르소나 회의 산출물 — 7 페르소나 합동 학습 후)
> 트랙: M3 (이슈 #2 6직업 비대칭 / 이슈 #3 후반 이벤트 폭주 측정)
> 상태: **★ PR17 머지 + baseline v14 + 협의서 v5 §16 보강 완료. 시뮬 R11-1 완전 해소 단언 (트랙 B 성공). chef K3 +0.72d (5.38→6.10), 격차 정의 1 +1.29d / 정의 2 +1.27d. 5곳 등록 룰 첫 적용 단언. M3 마감 검토 트리거 충족.** PD 김재훈 M3 마감 보고서 진입 대기.
> 트랙 정체성 단정 (협의서 v5 §15, 2026-05-12): **"시뮬 정합 게임 데이터 작성" 트랙.** baseline KPI는 *시뮬 K1·K3·K5 마지노선*. 게임 본체 K1과의 매핑은 M4+ 텔레메트리 트랙으로 분리.
> 시뮬 정합 5곳 등록 룰 (§16.3 표준 운영 단정): items_misc + stackConfig + CardFactory + characters startingItems + **playerAI.mjs actEat candidates** (5곳째).
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

### M3 #14a (PR11 옵션 2 구현 마감, master 미머지 — 가중치 8/4 정정 완료)

- [x] `js/data/districts.js` 25구 lootTable raw food entry 추가 — 75 entry (vegetable 25 + herb 25 + wild_berry 25)
- [x] 25구 dangerLevel 분류 — 일반 14구(w=8) / 위험 10구(w=4) / dobong 강제 4. 7직업 startDistrict 매핑 격차 위험 미발생 단정
- [x] `vegetable` 정의 기존 (`items_base.js:1195-1203`). CardFactory CARD_IMAGES 등록 기존. `stackConfig.js` 신규 등록 (vegetable + wild_berry, 4곳 룰 충족)
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR
- [x] `tools/sim/v2/run_baseline.mjs` — `OUTPUT_FILE` / `buildTag` v6 → v7 (`sim-baseline-v7-pr11`)
- [x] baseline v7 1차 측정 (가중치 1.0/0.5) — K1·K3 변화 0, 사양 결함 노출
- [x] **가중치 사양 재조정 — 협의서 v4 §12.2 일반 8 / 위험 4 (PD/Balance 합의)**. districts.js 일괄 갱신 (raw food entry만)
- [x] baseline v7 2차 측정 (가중치 8/4) — fingerprint `len316-h242a5b5f` 유지, K1·K3 변화 **0 (1차 동일)**. PR11 옵션 2 *설계 자체 결함* 단정
- [x] probe 3종 — actExplore 분포 / R8-1 morale 시계열 (원인 2 단정) / R10-1 절망 추이 (+50 미만 안전)
- [x] 협의서 v4 §12 보강 회의록 추가 — 사양 정정 + PR11 설계 결함 단정 + PR12·M3 #14b 동시 진입 결정

### M3 #14b (PR12 + interactions.js T1 시뮬 모사 — 마감, master 미머지)

- [x] **PR12** — `js/data/gameBalance.js:328` `fishing.baseCatchChance` 0.30 → 0.50 (밸런스 권지나). 1회 어획 기댓값 3 → 5 (+66%)
- [x] **M3 #14b** — `tools/sim/v2/playerAI.mjs:172-310` T1_TRANSFORMS 4 규칙 + `actT1Convert` + `runDayAI` 폴백 호출 (시스템 백승호, +44줄). cooking lv 0 한정 발동
- [x] sanity 200 runs — cooking lv 0 4직업 actT1Convert 발동 ≥ 1/회차 / cooked_noodles 산출 ≥ 200건 / 결정성 100% / chef·pharmacist·homeless 회귀 0
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR
- [x] baseline v8 측정 (`BAL_SIM_baseline_v8_result.json` + `BAL_SIM_baseline_v8_report.md` 281줄, 밸런스 권지나) — fingerprint `len316-h242a5b5f` 유지, K1 0% 9회 연속, **cooking lv 0 4직업 K3 +0.9~2.0d 향상** (doctor 4.0→4.9 / soldier 3.0→4.5 / firefighter 3.0→5.0 / engineer 3.1→4.4), **R10-1 폭증 +232** (절망 173→405, 사망원인 1위 역전)
- [x] 협의서 v4 §13 추가 보강 회의록 — **R11-1 신규 위험** (chef 격차 +0.60d 하한 +1.0d 미달) / **PR12 단독 효과 0 단정** (pharmacist 4.1→4.1) / **fingerprint drift 측정 한계 단정** (leaf 값 변경 무추적) / **M3 #10 진입 단언** (R10-1 4.6배 초과)

### M3 #16 (M3 #10 시나리오 진입 마감 — homeless·engineer Tier-2)

- [x] homeless Tier-2 `street_solace` (거리의 위안, 🕯️) — `moraleRecoveryBonus 1.5` + `lowMoraleRecoveryFatigueBonus -5`. LORE_GLOSSARY "잠자리" + story "이미 한 번 다 잃었으니까" 정체성 정합
- [x] engineer Tier-2 `workshop_focus` (작업 몰입, 🔧) — `moraleOnCraft 5` + `moraleOnDismantle 5` + `sketchNotebookBonus true`. "점검·작업지시서" + "설계도를 그리기 시작했다" 정체성 정합
- [x] 신규 아이템 `worn_photo` (낡은 사진, 📷) — onConsume morale+12·fatigue-3, subtype keepsake. homeless 전용
- [x] 신규 아이템 `sketch_notebook` (설계도 노트, 📓) — onConsume morale+10·fatigue-5, defaultDurability 3, dismantle paper. engineer 전용
- [x] `newspaper_bundle` onConsume morale+3 기존 갱신 (homeless 보강)
- [x] startingItems 추가 사양 — homeless 8→10 (newspaper_bundle 1→2 + worn_photo×1), engineer 6→9 (scrap_metal 1→2 + wire 1→2 + sketch_notebook×1)
- [x] 6 게이트 검수 — homeless 5/6 통과+1 모니터링 / engineer 5/6 통과+1 모니터링 / worn_photo·sketch_notebook 6/6 전수 통과
- [x] **R11-1 임계 깨짐 단정** — homeless+engineer 합산 정의 1 +0.37d / 정의 2 +0.42d → chef 격차 +0.5d 임계 깨짐 단언. **PR14 chef 정체성 강화 트랙 진입 의무 등록**
- [x] PR13 patch diff 사양 — characters.js +23/-4 + items_misc.js +24/-3 + stackConfig.js +5 + CardFactory.js +2 = 총 ~60 라인

### M3 #17 (PR13 머지 + baseline v9 마감)

- [x] **PR13** — 시스템 백승호. 4 파일 +52/-2 라인 (characters.js + items_misc.js + stackConfig.js + CardFactory.js). 4곳 등록 룰 충족
- [x] sketch_notebook dismantle paper 미정의 → `[]` 보수 처리 (후속 PR 검토)
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR
- [x] `tools/sim/v2/run_baseline.mjs` — v8 → v9 (`sim-baseline-v9-pr13`)
- [x] baseline v9 측정 (`BAL_SIM_baseline_v9_result.json` + `BAL_SIM_baseline_v9_report.md` 288줄, 밸런스 권지나) — fingerprint `len316-h242a5b5f` v3~v9 7연속 유지, 700 runs / 11.3초, bootstrapErrors 0/700
- [x] K1 7직업 0% (10회 연속) / K3 engineer 4.4→4.9 (+0.5d 단독 향상) / homeless 4.2→4.2 (Δ 0) / chef·doctor·soldier·firefighter·pharmacist 변화 0
- [x] K5 절망 -28 (405→377), 아사 +25 (263→288), 사망원인 1위 절망 유지
- [x] probe — morale<30 도달율 homeless 99→98 / engineer 100→100 / 절망 사망 homeless -22 단독·engineer -6 / chef 격차 정의 1 +0.60d·정의 2 +0.50d
- [x] **R8-1 부분 완화 단정** — 절망 -28, homeless 단독 -22. 완전 해소 미달
- [x] **R11-1 미발동** — 정의 2 +0.50d 임계 경계 도달, 액션 트리거 미충족. 모니터링 유지
- [x] **R13-1 신규 위험 등록** — Tier-2 ability `moraleRecoveryBonus`·`moraleOnCraft`·`moraleOnDismantle`·`sketchNotebookBonus` sim AI 미구현. SCN_QUEST 추정-실측 격차 일차 원인
- [x] 협의서 v4 §14 보강 회의록 — R8-1 부분 완화·R11-1 미발동·R13-1 등록·다음 단계 갱신

### M3 #18 (PR15 sim AI ability 가산 분기 + baseline v10 마감)

- [x] **PR15 구현** — `tools/sim/v2/playerAI.mjs` +30/-3 + `gameStateReset.mjs` +6/-1. ability bonus 4필드 가산 분기:
  - homeless: `moraleRecoveryBonus` (×1.5), `lowMoraleRecoveryFatigueBonus` (-5)
  - engineer: `moraleOnCraft` (+5), `sketchNotebookBonus` (×1.5)
  - skip 1필드: `moraleOnDismantle` (sim에 dismantle 행동 없음)
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR
- [x] fingerprint `len316-h242a5b5f` v3~v10 8연속 유지 / bootstrapErrors 0/700 / 10.6초 / 결정성 100%
- [x] `tools/sim/v2/run_baseline.mjs` v9 → v10 (`sim-baseline-v10-pr15`)
- [x] baseline v10 측정 (`BAL_SIM_baseline_v10_result.json` + `BAL_SIM_baseline_v10_report.md` 305줄, 밸런스 권지나)
- [x] K1 7직업 0% (11회 연속) / K3 homeless 4.2→4.3 (+0.1d) / engineer 4.9→5.0 (+0.1d) / chef·pharmacist·doctor·soldier·firefighter 변화 0 (회귀 0)
- [x] K5 절망 377→303 (-74, v8→v10 누적 -102 / 44.0% 회수) / 아사 288→350 (+62, 사인 전이) / 극도피로 22→34 / 탈수 13 유지
- [x] probe — ability 가산 발동 단정 (homeless worn_photo 99/100, engineer sketch_notebook 100/100), morale<30 도달율 day 2 99·100→0%, chef 격차 정의 1 +0.567 / 정의 2 +0.46
- [x] **R11-1 액션 트리거 (3) 발동 단언** — 정의 2 +0.50d → +0.46d (+0.5d 미만)
- [x] **R8-1 큰 추가 완화 단정** — 절망 -74 (사인 전이 절망→아사, 사망원인 1위 재역전)
- [x] **R13-1 부분 해소 단정** — 4필드 구현 / dismantle skip
- [x] **R15-1 신규 등록** — SCN_QUEST 추정-실측 잔존 격차 (-0.9~-1.4d). playerAI craft 발동 빈도 day 1회 < SCN_QUEST 가정 4~6회/day + dismantle skip 원인
- [x] 협의서 v4 §15 추가 보강 회의록 — R11-1 발동·R8-1 완화·R13-1 부분 해소·R15-1 신규·다음 단계 갱신

### M3 #19 (PR14 결정 협의서 v5 발행 마감)

- [x] PD/Balance 협의서 v5 작성 — `PD_BAL_MEETING_PR14_decision.md` (PR14 chef 정체성 강화 결정)
- [x] **안건 1 PR14 = A+B 패키지 채택** — chef 전용 신규 Tier-2 ability + chef 전용 신규 자원(1~2개). 데이터 PR 1트랙
- [x] 안건 2 ability 사양 가드레일 6건 — 개수 1개 / effect 방향 요리 강화 / sim 호환 PR15 enumerate 필드 우선 / chef 정체성 정합 / K3 추정 +0.2~0.5d / 6 게이트 검수
- [x] 안건 2 effect 값 범위 — ×1.2~×1.8 또는 +3~+10 (PR15 ability 패턴 정합)
- [x] 안건 3 신규 자원 가드레일 — 1~2개 chef 전용 한정 / 4곳 등록 룰 충족 / chef 외 직업 변경 0 / K3 추정 +0.5~1.0d
- [x] **안건 4 KPI 우선순위 3분리** — 1차 격차 정의 1 +1.0d 회복(직접 목표), 2차 정의 2 +0.5d 회복(R11-1 해소), 3차 chef K3 ≤ 6.5(모니터링)
- [x] 안건 5 M3 #20 동시 진행 — 4 SCN_QUEST(chef·firefighter·soldier·pharmacist) 단일 트랙. R15-1 우회(craft 발동 빈도 보수화)
- [x] §10 위험과 완화 5건 + §11 다음 단계 9건

### M3 #20 (4 SCN_QUEST 동시 작성 마감)

- [x] `SCN_QUEST_chef_tier2.md` (715줄) — Tier-2 ability `pantry_mastery` (식자재 보존술 🥫, moraleRecoveryBonus 1.4 / lowMoraleRecoveryFatigueBonus -3). 신규 자원 `chef_journal` (셰프 노트 📔, morale +10·fatigue -2·durability 3) + `spice_blend` (혼합 향신료 🧂, morale +6·nutrition +5·durability 1). startingItems 7→10
- [x] `SCN_QUEST_firefighter_tier2.md` (472줄) — Tier-2 ability `rescue_resolve` (구조의 결의, moraleRecoveryBonus 1.3). 신규 자원 `family_photo` (가족 사진, morale +10·fatigue -3·keepsake). startingItems 6→7
- [x] `SCN_QUEST_soldier_tier2.md` (488줄) — Tier-2 ability `comrade_memorial` (전우의 기억, moraleRecoveryBonus 1.3). 신규 자원 `dog_tag` (군번줄, morale +10·fatigue -3·keepsake). startingItems 7→8
- [x] `SCN_QUEST_pharmacist_tier2.md` (503줄) — Tier-2 ability `compounding_focus` (조제 몰입, moraleOnCraft 3). 신규 자원 `pharmacy_notes` (조제 노트, morale +8·fatigue -3·durability 3·dismantle paper). startingItems 7→8
- [x] 4 SCN_QUEST §8 patch diff 합산 ~116 라인 (chef 41 + firefighter·soldier·pharmacist 각 ~25)
- [x] 6 게이트 검수 — 각 직업 ability + 자원 모두 통과 (chef pantry_mastery 5/6 통과 + 1/6 모니터링 3차 KPI)
- [x] **R11-1 해소 단정 가능** — chef 1차 KPI 격차 정의 1 +1.07~+1.57d, 2차 정의 2 +0.96~+1.46d, 3차 chef K3 5.7~6.2 (안전)
- [x] PR15 enumerate 범위 준수 — `moraleRecoveryBonus`·`moraleOnCraft`·`lowMoraleRecoveryFatigueBonus` 3 필드 한정. 신규 effect 필드 도입 0
- [x] 공통 위험 단정 — `subtype: keepsake` 5직업 동시 사용 (homeless·engineer·firefighter·soldier·pharmacist) / `pharmacy_notes` dismantle paper 정의 부재 (sketch_notebook 패턴 정합)

### M3 #21 (PR14·PR16 머지 + baseline v11 마감)

- [x] PR14·PR16 통합 머지 — characters.js +41 + items_misc.js +54 + stackConfig.js +13 + CardFactory.js +7 + run_baseline.mjs v10→v11 (합산 +117/-2). PR14·PR16 영역 분리 — 직업별 probe로 사후 분리 측정
- [x] 5종 신규 자원 정의 — chef_journal(📔 keepsake) + spice_blend(🧂 food) + family_photo(📸 keepsake) + dog_tag(🪖 keepsake) + pharmacy_notes(📋 notebook). pharmacy_notes dismantle `[]` 보수 처리
- [x] 4곳 등록 룰 충족 — items_misc + stackConfig + CardFactory + characters.js startingItems
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR
- [x] fingerprint `len316-h242a5b5f` v3~v11 9연속 유지 / bootstrapErrors 0/700 / 10.9초 / 결정성 100%
- [x] baseline v11 측정 (`BAL_SIM_baseline_v11_result.json` + `BAL_SIM_baseline_v11_report.md` 426줄, 밸런스 권지나)
- [x] K1 0% (12회 연속) / K3 chef 5.20→5.40 (+0.20d) / soldier 4.50→5.00 (+0.50d) / pharmacist 4.10→4.30 (+0.20d) / firefighter 5.00→5.00 (Δ 0d, 사인 전이만)
- [x] K5 절망 303→161 (-142, -47%) / 아사 350→467 (+117 사인 전이) / 탈수 +20 / 극도피로 +5. **누적 v8→v11 절망 -244 (60.2% 회수)**
- [x] **R11-1 정의 2 해소 단언** — chef 격차 정의 2 +0.460→+0.560d (≥ +0.5d 충족, 2차 KPI)
- [x] **R8-1 완전 해소 단정** — 절망 161 < 200 기준, R10-1 단계적 해소
- [x] **R14-1 신규 등록** — chef 1차 KPI 미달 (정의 1 +0.650d < +1.0d). **PR14.1 옵션 C 채택** (pantry_mastery 1.4→1.6 + chef_journal 10→13)
- [x] **R14-2 신규 등록** — soldier K3 +0.50d 보수 추정 초과. **PR16.1 채택** (comrade_memorial 1.3→1.2 하향)
- [x] **R14-3 신규 등록** — firefighter 사인 전이만 (K3 Δ 0d, R15-1 우회 실패). 옵션 3 수용 (보류, v12 후 PR16.2 검토)
- [x] 협의서 v5 §12 보강 회의록 — R11-1 정의 2 해소 + R14-1·R14-2·R14-3 등록 + 다음 단계 갱신

### M3 #22 (PR14.1 + PR16.1 + baseline v12 마감)

- [x] PR14.1+PR16.1 머지 — characters.js 2건(pantry_mastery 1.4→1.6 / comrade_memorial 1.3→1.2) + items_misc.js 1건(chef_journal morale 10→13) + run_baseline.mjs 2건. **총 5 라인**
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR
- [x] fingerprint `len316-h242a5b5f` v3~v12 10연속 유지, bootstrapErrors 0/700, 10.84초, 결정성 100%
- [x] baseline v12 측정 (`BAL_SIM_baseline_v12_result.json` + `BAL_SIM_baseline_v12_report.md` 338줄, 밸런스 권지나)
- [x] K1 0% (13회 연속) / K3 chef 5.40→5.38 (+0.02d 미미) / soldier 5.00→4.96 (-0.04d 미미) / 다른 5직업 회귀 0
- [x] K5 절망 161→165 (+4) / 아사 467→461 (-6) / 탈수 33 동일 / 극도피로 39→41 (+2). R8-1 완전 해소 유지 (절망 165 < 200), R10-1 누적 -240 (59.3% 회수)
- [x] **R14-1 미해소 단언** — chef 격차 정의 1 +0.6133d → +0.6350d, 1차 KPI ≥ +1.0d 미충족
- [x] **R14-2 미해소 단언** — soldier K3 v10→v12 누적 +0.47d, 보수 ≤ +0.3d 초과
- [x] **R11-1 완전 해소 불가능 단정** — 정의 2 +0.5460d 유지(2차 KPI ✅), 정의 1 미달
- [x] **구조적 한계 단정** — chef 사망일 day 5~6 집중, morale 가산이 nutrition·탈수 사망 회피 불가. morale 회복은 day 100 도달의 필요 조건이지 충분 조건이 아님
- [x] **R15-1 진입 전제 단정** — chef morale 가산 K3 효과 발현은 craft 발동 빈도 보강(R15-1 완전 해소) 전제. PR15 enumerate 4필드 정합이나 day 1회 발동 한계
- [x] 협의서 v5 §13 추가 보강 회의록 — R14 미해소 단언·R11-1 완전 해소 전략 재정의·트랙 A 채택(PR16 craft 빈도 보강)

### M3 #23 (PR16 craft 발동 빈도 보강 + baseline v13 마감 — 트랙 A 실패 단언)

- [x] PR16 머지 — `tools/sim/v2/playerAI.mjs` +20라인 (runDayAI nutrition<50 OR morale<30 임계 추가 craft) + run_baseline.mjs v12→v13
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR
- [x] fingerprint v3~v13 11연속 유지 / bootstrapErrors 0/700 / 11.4초 / 결정성 100%
- [x] baseline v13 측정 (`BAL_SIM_baseline_v13_result.json` + `BAL_SIM_baseline_v13_report.md` 367줄, 밸런스 권지나)
- [x] K1 0% (14회 연속) / K3 homeless 4.30→4.70 (+0.40d ★ PR16 최대) / chef 5.38→5.40 (+0.02d 미미) / 다른 5직업 회귀 0
- [x] K5 아사 461→415 (-46) / 절망 165→188 (+23) / 탈수 +5 / 극도피로 +18
- [x] **트랙 A 실패 단언** — chef day 1~2 임계 미도달, day 5~6 입력 자원 소진, chef craft 0.372 fires/day 최저
- [x] **R11-1 정의 2 후퇴 단정** — v12 +0.546d → v13 +0.480d (homeless 향상이 5직업 평균 끌어올림)
- [x] **R15-1 완전 해소 단정** — cooking lv 0 4직업 craft +0.4~0.7 fires/day. 단 R11-1과 분리 단정
- [x] 회귀 검증 — PR15 ability 가산 분기 + PR13 cooking lv ≥ 1 회귀 0 (chef·pharmacist cause 분포 v12 동일)
- [x] 협의서 v5 §14 추가 보강 회의록 — **트랙 B 채택** (chef high-nutrition 자원 추가). 미달 시 트랙 D (PR16 롤백) 또는 트랙 C (M3 마감) 폴백

### M3 #24a (시나리오 한도연 SCN_QUEST_chef_supply.md 마감)

- [x] **SCN_QUEST_chef_supply.md** 작성 (810줄, 시나리오 한도연)
- [x] 자원 2종 결정 (협의서 v5 §14.6 가드레일 전수 준수):
  - **`chef_meal_kit`** (셰프의 도시락) — nutrition+45·hydration+20·morale+3·fatigue-3·durability 2·weight 0.45·food. 정체성 "명동 소피텔 호텔 주방 도시락" (chef story line 312~313)
  - **`hearty_stew`** (든든한 스튜) — nutrition+35·hydration+30·morale+5·durability 1·weight 0.50·food. 정체성 "따뜻한 한 끼" + pantry_mastery 식자재 보존술 연계
- [x] chef startingItems 갱신: pantry_mastery 3개 → 5개 (chef_journal + spice_blend×2 + chef_meal_kit + hearty_stew). 합산 10 → **12 아이템**
- [x] desc 문구 정정: pantry_mastery "사기 회복 +40%" → "+60%" (moraleRecoveryBonus 1.6 정합)
- [x] **신규 발견 — 5곳 등록 룰 확장 단정** — `tools/sim/v2/playerAI.mjs:130~133 actEat candidates` 배열에 hearty_stew·chef_meal_kit 추가 의무. 미등록 시 시뮬 K3 효과 0
- [x] 5곳 등록 룰 (시뮬 정합 트랙): items_misc.js + stackConfig.js + CardFactory.js + chef startingItems + playerAI.mjs actEat candidates
- [x] 6 게이트 검수: chef_meal_kit 5/6 통과 + 1/6 모니터링(3차 KPI 6.35로 0.15d 여유) / hearty_stew 6/6 전수 통과
- [x] 시뮬 KPI 추정 (세 시나리오 모두 충족):
  - 격차 정의 1 (≥ +1.0d): 보수 +1.18d / 중간 +1.33d / 적극 +1.53d ✅
  - 격차 정의 2 (≥ +0.5d): 보수 +1.08d / 중간 +1.23d / 적극 +1.43d ✅ (완전 해소)
  - chef K3 (≤ 6.5): 6.0~6.35 안전 ✅
- [x] chef 사망일 day 5~6 92건 → 47~75건 (보수~적극) / day 7+ 이동 +17~+45건
- [x] PR17 patch diff 추정 ~33라인 (characters.js +2 / items_misc.js +22 / stackConfig.js +4 / CardFactory.js +4 / playerAI.mjs +2)
- [x] §11.5 잔존 결함 — spice_blend actEat candidates 미등록 (본 PR 영역 외, 후속 권고)
- [x] **시뮬 R11-1 완전 해소 단정 가능** (§15 트랙 정체성 안에서)

### M3 #24b (PR17 머지 + baseline v14 마감 — ★ 시뮬 R11-1 완전 해소 단언 ★)

- [x] PR17 머지 — characters.js +2 + items_misc.js +22 + stackConfig.js +4 + CardFactory.js +4 + **playerAI.mjs +2** + run_baseline.mjs +2/-2. **합산 ~34 라인** (SCN_QUEST 추정 ~33 정합)
- [x] **5곳 등록 룰 첫 적용 검증** — items_misc + stackConfig + CardFactory + characters startingItems + **playerAI.mjs actEat candidates** (5곳째 신규)
- [x] validate.js Errors 0 / Warnings 252 / ALL CLEAR (v13 동일)
- [x] fingerprint `len316-h242a5b5f` v3~v14 12연속 유지 / bootstrapErrors 0/700 / 11.5초 / 결정성 100%
- [x] baseline v14 측정 (`BAL_SIM_baseline_v14_result.json` + `BAL_SIM_baseline_v14_report.md` 492줄, 밸런스 권지나)
- [x] K1 0% (15회 연속) / **K3 chef 5.38→6.10 (+0.72d) ★** / 6직업 회귀 0
- [x] K5 아사 415→373 (-42, chef 아사 완전 해소) / 절망 188→224 (+36, chef 사망 연장 trade-off) / 탈수 -2 / 극도피로 +8
- [x] chef 사망일 day 5~6: 92→60 (-32) / day 7+: 6→40 (+34) ★ day 6+ 이동 단정
- [x] **시뮬 R11-1 완전 해소 단언** (§15 안에서):
  - 1차 시뮬 KPI 격차 정의 1 ≥ +1.0d: ✅ **+1.2917d** (1.29배)
  - 2차 시뮬 KPI 격차 정의 2 ≥ +0.5d: ✅ **+1.2660d** (2.53배, v13 미해소 → v14 완전 해소)
  - 3차 시뮬 KPI chef K3 ≤ 6.5: ✅ **6.10** (마진 0.4d 안전)
- [x] 트랙 B 성공 단언 — 트랙 D/C 폴백 불필요
- [x] 5곳 등록 룰 검증 — chef_meal_kit·hearty_stew 100/100 runs 완전 소비. actEat candidates 등록이 시뮬 K3 효과 발현의 필요·충분 조건 단언
- [x] 회귀 검증 — PR13·PR14·PR15·PR16 효과 완전 보존, 6직업 K3 변화 0
- [x] 협의서 v5 §16 추가 보강 회의록 — 시뮬 R11-1 완전 해소 단언·트랙 B 성공·5곳 등록 룰 표준 운영 단정·M3 마감 검토 트리거 충족

### M3 #25 (M3 마감 보고서 — **다음 진입 트리거**, PD 김재훈)

- [ ] `PD_MILESTONE_M3_close.md` 작성 — M3 전체 산출물 종합 + R 해소 상태 + M4 이월 사항 + 트랙 정체성 단언 종결
- [ ] M3 종결 선언 (사용자 승인)
- [ ] (조건부) M4+ 텔레메트리 트랙 진입 — 협의서 v6 신규 발행

### M3 #26 (조건부 후순위 잔존)

- [ ] PR18 R13-1 dismantle sim 모사 (시스템 백승호, M3 마감 후 또는 M4 이월)
- [ ] spice_blend actEat candidates 잔존 결함 정리 (1~2 라인 패치)
- [ ] PR16.2 R14-2 soldier 재조정 (R11-1 해소 후 후순위)
- [ ] M3 #15 AD UI 변경 권고 2건 (AD 오은별, 독립)
- [ ] (M4+) drift.mjs leaf 값 hash 컬럼 추가

### M3 #25 (조건부 폴백 — baseline v14 미달 시)

- [ ] 트랙 D: PR16 롤백 — `playerAI.mjs` craft 빈도 분기 제거. R11-1 정의 2 +0.546d 해소 보존. ~5라인 (시스템 백승호)
- [ ] 트랙 C: M3 마감 + M4 이월 — R11-1 완전 해소 구조적 한계 단정 + R11-1 정의 2 해소(가능 시)만 M3 단언 (PD 김재훈)
- [ ] (조건부) PR17 추가 작업 — soldier·firefighter 재조정

### M3 #26 (조건부 후속 — R13-1 완전 해소 + 잔존)

- [ ] PR18 dismantle sim 모사 — R13-1 완전 해소 (시스템 백승호)
- [ ] sketch_notebook + pharmacy_notes paper 정의 정리
- [ ] M3 #15 AD UI 변경 권고 2건 (AD 오은별, 독립)
- [ ] (M4+) drift.mjs leaf 값 hash 컬럼 추가

### M3 #25 (조건부 후속 — R13-1 완전 해소 + 잔존 작업)

- [ ] PR17 dismantle sim 모사 — R13-1 완전 해소 (시스템 백승호)
- [ ] sketch_notebook + pharmacy_notes paper 정의 정리
- [ ] M3 #15 AD UI 변경 권고 2건 (AD 오은별, 독립)
- [ ] (M4+) drift.mjs leaf 값 hash 컬럼 추가

### M3 #21 (PR14 + PR16 머지 + baseline v11 측정 — M3 #20 후행)

- [ ] PR14 머지 (chef) 또는 PR14+PR16 분리 (시스템 백승호) — SCN_QUEST §8 patch diff 그대로 적용
- [ ] validate.js Errors 0 + fingerprint `len316-h242a5b5f` 유지 검증
- [ ] `tools/sim/v2/run_baseline.mjs` v10 → v11
- [ ] baseline v11 측정 (`BAL_SIM_baseline_v11_result.json` + `report.md`) — **직업별 분리 측정 의무** (chef vs 6직업 절대값 단정)
- [ ] 1차/2차/3차 KPI 단정 + R11-1 해소 단정 (협의서 v5 §5.5)
- [ ] (조건부) cook_intuition 단축 — chef K3 > 6.5 시
- [ ] (조건부) PR14.1 재조정 — chef 격차 정의 1 < +1.0d 시
- [ ] (조건부) PR16 craft 발동 빈도 보강 — R15-1 우회 실패 시

### M3 #22 (조건부 후속 — R15-1 / R13-1 완전 해소)

- [ ] PR16 craft 발동 빈도 보강 — playerAI `actCook`을 morale<30 시점 추가 발동 또는 actInteractCraft 빈도 증가 (R15-1 해소)
- [ ] PR17 dismantle sim 모사 — playerAI dismantle 행동 추가 (R13-1 완전 해소)
- [ ] sketch_notebook dismantle paper 정의 정리 (보수 처리 `[]` 해소)

### M3 #15 (AD UI 변경 권고 2건 — 분리 트랙, 독립)

- [ ] (高 권고) `interactions.js` cooking 8 hint 또는 `_showInteractionTip`에 영양/수분 수치 합성 — `js/ui/HoverTooltip.js` 또는 등가
- [ ] (中 권고) `CraftUI._renderOutputPreview:274~324` 산출물 동시 비교 모드 추가 + DESIGN.md `--stat-nutrition`/`--stat-hydration` 토큰 적용
- [ ] AD 오은별 위임. 본 트랙과 의존 0

### M3 #17 (조건부 — v9 분기)

- [ ] (조건부) cook_intuition `days = 7 → 5` 단일 상수 PR. 진입 트리거: baseline v9/v10에서 chef 격차 +2.5d 초과 (v8 +0.60d로 미충족)
- [ ] (조건부) PR11 가중치 추가 재조정 또는 actEat AI raw food 우선 분기 추가. 진입 트리거: v9에서도 raw food 활용 효과 0 유지 시
- [ ] (조건부) R11-1 chef 정체성 강화 — chef 전용 Tier-2 abilities. 진입 트리거: chef K3 < 5.0 또는 격차 +0.5d 미만

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
M3 #14a (PR11 옵션 2 + baseline v7) ─── 마감
M3 #14b (PR12 + interactions.js T1 시뮬 모사 + baseline v8) ─── 마감
M3 #15 (AD UI 변경 권고 2건) ─── 분리 트랙 (AD 오은별, 독립)
M3 #16 (M3 #10 시나리오 — homeless·engineer Tier-2) ─── 마감
M3 #17 (PR13 머지 + baseline v9) ─── 마감
M3 #18 (PR15 sim AI ability 가산 분기 + baseline v10) ─── 마감
M3 #19 (PR14 결정 협의서 v5 발행) ─── 마감
M3 #20 (4 SCN_QUEST 동시 작성) ─── 마감
M3 #21 (PR14·PR16 머지 + baseline v11) ─── 마감 (R11-1 정의 2 해소 단언, R8-1 완전 해소)
M3 #22 (PR14.1 + PR16.1 + baseline v12) ─── 마감 (R14-1·R14-2 미해소 단언, 구조적 한계 단정)
M3 #23 (PR16 craft 발동 빈도 + baseline v13) ─── 마감 (트랙 A 실패, R15-1 완전 해소, R11-1 정의 2 후퇴)
M3 #24a (SCN_QUEST_chef_supply 작성) ─── 마감
M3 #24b (PR17 + baseline v14) ─── 마감 ★ 시뮬 R11-1 완전 해소 단언, 트랙 B 성공
M3 #25 (M3 마감 보고서) ─── 진입 대기 (PD 김재훈 — 다음 트리거)
M3 #26 (조건부 후순위 잔존)
M3 #25 (조건부 트랙 D/C — baseline v14 미달 시 폴백)
M3 #26 (조건부 PR18 R13-1 + 잔존)
M3 (조건부) cook_intuition 단축 / PR14.1 재조정 ─── baseline v11 결과 의존
```

---

*문서 끝. 회의 재개 시 본 문서와 `docs/persona-meeting-2026-05-10/README.md` 우선 갱신.*
