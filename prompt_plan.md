# 페르소나 회의 M3 트랙 — 직업 비대칭 해소 + cooking AI 발동 보강

> 시작일: 2026-05-10 (페르소나 회의 산출물 — 7 페르소나 합동 학습 후)
> 트랙: M3 (이슈 #2 6직업 비대칭 / 이슈 #3 후반 이벤트 폭주 측정)
> 상태: **PR9 머지 + baseline v5 측정 완료. PR10/협의서 v3 진입 대기.**
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

### M3 #11 (협의서 v3 + PR10 + actCook 산식 — **다음 진입 트리거**)

- [ ] PD/Balance 협의서 v3 작성 — PR10 옵션 결정 + actCook 모순 후속 처리 (PD 김재훈 + 밸런스 권지나)
- [ ] 협의서 v3 안건 1: PR10 진입 옵션 결정 — A(25구 lootTable 확대) vs B(startInv 추가 보강) vs C(actCook 시뮬 로직 보강)
- [ ] 협의서 v3 안건 2: actCook 모순 가설 B 후속 — 시뮬 로직 PR 우선 vs 게임 본체 cooking 자동 추천 검증 우선
- [ ] 협의서 v3 안건 3: R9-1 폴백 우선순위 — fishing 강화(`fishing.baseCatchChance` 상향) vs nutrition 추가 경로
- [ ] 협의서 v3 안건 4: R9-2 검토 — chef 격차 보호 유리 변경 보류 vs chef yongsan 이동 동기 부여
- [ ] PR10 머지 (협의서 v3 결정 직후, 시스템 백승호 또는 밸런스 권지나)
- [ ] baseline v6 측정 (PR10 머지 D+1, 밸런스 권지나) — `OUTPUT_FILE` / `buildTag` v5 → v6
- [ ] (선택) actCook 시뮬 로직 보강 PR — `playerAI.mjs:185` benefit 가중치 분리 (nutrition × 1.5 등)

---

## KPI 진행 (협의서 v1 §5.5 + v2 §7 갱신)

| KPI | v3 | v4 | v5 | v6 목표 | 트리거 |
|-----|----|----|----|---------|--------|
| K1 (전 직업) | 0% | 0% | **0%** | ≥ 5% | < 5% 7회 연속 → **PR10 폴백 트리거 충족** |
| K1 (chef) | 0% | 0% | 0% | ≥ 5% | 우선 측정 |
| K3 chef 격차 (5직업 평균) | +1.5d | +2.2d | **+1.94d** | +1.0~+2.0d 사수 | > +2.5d → grace 단축 |
| K3 chef 격차 (6직업 평균) | +1.33d | +1.87d | **+1.80d** | +1.0~+2.0d | 정의 일치 필요 |
| K5 chef 탈수 | 20 | 12 | 12 | ↓ 유지 | ✅ contaminated_water 효과 |
| K5 chef 극도 피로 | 1 | 6 | **12** | ≤ 10 | ⚠️ v5 초과 — 생존 길어진 부작용 |
| `actCook` 발동 (chef) | 0 | 100/100 | 100/100 | ≥ 1/day | ✅ |
| `actCook` 발동 (5직업) | 0 | 100/100 | 100/100 | nutrition 효과 확보 | ⚠️ 가설 B 단정 — 산출물 100% boiled_water |
| `actFish` (4 hasFishing) | 0 | 0 | **52~63/100** | ≥ 1/day | ✅ PR9 옵션 C-a 효과 |
| `actBoostMorale` (homeless·engineer) | 0 | 0 | 0 | > 0 | R8-1 별도 트랙 (M3 #10) |
| 사망 — 아사 합계 | 555 | 569 | 532 | ↓ | v5 -37 |
| 사망 — 절망 합계 | 110 | 113 | 142 | ↓ | v5 +29 (homeless·engineer 미해소) |

---

## Risks

| Risk | 등급 | 완화 |
|------|------|------|
| R9-1 PR9 옵션 C-a K1 효과 부족 (4 hasFishing 직업 K1 0% 유지) | HIGH | PR10에서 fishing 효과 강화(`fishing.baseCatchChance` 상향) 또는 nutrition 회복 추가 경로 |
| R9-2 chef PR9 효과 0 (junggoo hasFishing 미보유, 이동 없음) | LOW-MED | 격차 보호 유리이므로 변경 보류가 합리. chef yongsan 이동 동기 부여는 별도 검토 |
| actCook 산식 결함 — 5직업 cooking lv 0~1 산출물 100% boiled_water | HIGH | `playerAI.mjs:185` benefit 가중치 분리 PR (nutrition × 1.5 등) 또는 게임 본체 cooking 자동 추천 검증 (시스템 백승호 + AD 오은별) |
| baseline v6에서도 K1 < 5% 유지 시 폴백 부담 | MED | PR10 옵션 결정 시 PR11 폴백 명시 — 시작 인벤토리 직접 fishing_rod 부여 또는 25 구 lootTable 전수 보강 |
| chef 격차 +2.5d 초과 시 grace 단축이 chef 정체성 훼손 | LOW-MED | 단축 PR 머지 전 Director 재검수 의무 |
| R8-1 별도 트랙 분리로 R7-2 마감 지연 | LOW | 5직업 Tier-2 abilities 트랙과 동시 진행 (M3 #10) |

---

## 의존성 그래프

```
M3 #1~#4 (PR7) ─── 마감
M3 #5 (PR8 데이터) ─── 마감
M3 #6 (baseline v4) ─── 마감
M3 #7 (PR9 결정) ─── 마감
M3 #8 (PR9 시스템) ─── 마감
M3 #9 (baseline v5) ─── 마감 (R8-1 probe만 v6 이연)
M3 #10 (Tier-2 5직업) ─── 독립 (시나리오 한도연)
M3 #11 (협의서 v3 + PR10 + actCook 산식) ─── 진입 대기 (PD 김재훈 + 밸런스 권지나)
```

---

*문서 끝. 회의 재개 시 본 문서와 `docs/persona-meeting-2026-05-10/README.md` 우선 갱신.*
