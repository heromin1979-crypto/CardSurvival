# 페르소나 회의 M3 트랙 — 직업 비대칭 해소 + cooking AI 발동 보강

> 시작일: 2026-05-10 (페르소나 회의 산출물 — 7 페르소나 합동 학습 후)
> 트랙: M3 (이슈 #2 6직업 비대칭 / 이슈 #3 후반 이벤트 폭주 측정)
> 상태: **PR8 머지 + baseline v4 측정 완료. PR9(시스템) 진입 대기.**
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

M3는 시뮬 v2 인프라(PR1~PR4) → Player AI 5단계(PR5/PR5.5/PR6/PR7) → 데이터 보강(PR8) → 메커닉 보강(PR9) 순서로 K1 0% 병목 해소.

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

### M3 #8 (PR9 시스템 구현, 시스템 백승호 위임 — **다음 진입 트리거**)

- [ ] `js/data/landmarks.js` — `hangang` sublocation 보상 신규 필드 (`rewardOnEnter` 또는 동등) 설계·구현
- [ ] `js/systems/ExploreSystem.js` — sublocation 진입 후크 신설 또는 기존 `enterLandmark` (line 605) 확장. 1회 한정 플래그 검사·기록
- [ ] GameState 1회 한정 플래그 저장 위치 결정 (시뮬 결정성 보장 필요)
- [ ] `tools/sim/v2/runner.mjs` — sublocation 미모델링 시 시뮬 측 별도 rod 부여 흐름 신설 (또는 actFish 트리거 검증)
- [ ] validate.js — Errors 0
- [ ] PR9 단일 트랙 머지

### M3 #9 (baseline v5 측정 후 분기)

- [ ] `tools/sim/v2/run_baseline.mjs` — `OUTPUT_FILE` / `buildTag` v4 → v5
- [ ] baseline v5 700회 실측 (`BAL_SIM_baseline_v5_report.md`)
- [ ] K1 측정 → 5% 이상 → R7 마감 / 5% 미만 → 폴백 옵션(PR10)
- [ ] chef K3 격차 측정 → +2.5d 이하 → grace 유지 / 초과 → `cook_intuition days=7→5` 단일 상수 PR
- [ ] R8-1 morale 시계열 probe 추가 — 원인 1(morale 미도달) vs 2(회복 수단 부재) 단정

### M3 #10 (5직업 Tier-2 abilities, 시나리오 한도연 위임)

- [ ] `SCN_QUEST_firefighter_tier2.md` (M2 예정 → M3)
- [ ] `SCN_QUEST_soldier_tier2.md`
- [ ] `SCN_QUEST_homeless_tier2.md`
- [ ] `SCN_QUEST_engineer_tier2.md`
- [ ] `SCN_QUEST_pharmacist_tier2.md`
- [ ] R8-1 보강과 동시 진행 — `homeless`·`engineer` morale 회복 자원·이벤트 신규

---

## KPI 진행 (협의서 v1 §5.5 + v2 §7 갱신)

| KPI | v3 | v4 | v5 목표 | 트리거 |
|-----|----|----|---------|--------|
| K1 (전 직업) | 0% | 0% | ≥ 5% | < 5% → PR10 폴백 검토 |
| K1 (chef) | 0% | 0% | ≥ 5% | 우선 측정 |
| K3 chef 격차 (5직업 평균) | +1.5d | +2.2d | +1.0~+2.0d 사수 | > +2.5d → grace 단축 |
| K3 chef 격차 (6직업 평균) | +1.33d | +1.87d | +1.0~+2.0d | 정의 일치 필요 |
| K5 chef 탈수 | 20 | 12 | ↓ 유지 | ✅ contaminated_water 효과 |
| K5 chef 극도 피로 | 1 | 6 | ≤ 10 | 생존 길어진 부작용 모니터 |
| `actCook` 발동 (chef) | 0 | 100/100 | ≥ 1/day | ✅ |
| `actCook` 발동 (5직업) | 0 | **0**(보고 모순) | 측정 재검증 | ⚠️ probe 발동 vs K3 변화 모순 |
| `actBoostMorale` 발동 (homeless·engineer) | 0 | 0 | > 0 | R8-1 별도 트랙 |

---

## Risks

| Risk | 등급 | 완화 |
|------|------|------|
| PR9 sublocation 후크가 게임 내 다른 reward 흐름과 충돌 | MED | 시스템 페르소나 코드 디테일 결정 후 ExploreSystem 회귀 검증 |
| baseline v5에서도 K1 < 5% 유지 시 폴백 부담 | MED | PR10 옵션 — 시작 인벤토리 직접 fishing_rod 부여 또는 25 구 lootTable 전수 보강 |
| chef 격차 +2.5d 초과 시 grace 단축이 chef 정체성 훼손 | LOW-MED | 단축 PR 머지 전 Director 재검수 의무 |
| `actCook` 발동 100/100 vs K3 변화 0 (5직업) 모순 | HIGH | baseline v5 직전 actCook 발동·결과 단절 probe 신규 (cooking lv 게이트 검증) |
| R8-1 별도 트랙 분리로 R7-2 마감 지연 | LOW | 5직업 Tier-2 abilities 트랙과 동시 진행 |

---

## 의존성 그래프

```
M3 #1~#4 (PR7) ─── 마감
M3 #5 (PR8 데이터) ─── 마감
M3 #6 (baseline v4) ─── 마감
M3 #7 (PR9 결정) ─── 마감
M3 #8 (PR9 시스템) ─── 진입 대기 (시스템 백승호)
M3 #9 (baseline v5) ─── M3 #8 후
M3 #10 (Tier-2 5직업) ─── 독립 (시나리오 한도연)
```

---

*문서 끝. 회의 재개 시 본 문서와 `docs/persona-meeting-2026-05-10/README.md` 우선 갱신.*
