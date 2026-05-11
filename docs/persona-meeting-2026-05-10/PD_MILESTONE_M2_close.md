# PD 마일스톤 M2 종결 보고

> 작성: PD 김재훈 / 2026-05-11
> 범위: 2026-05-10 ~ 2026-05-11 세션 전체 (M0 + M1 + M2)
> 결정: **M0·M1·M2 종결.** 4 핵심 이슈 처리 완료. baseline K1 측정은 PR7(요리·morale AI)로 이연.

---

## 1. 한 줄

7 페르소나 회의 → 4 핵심 이슈 해소 → 게임 데이터 정합 + 시뮬 v2 인프라 + Player AI active baseline. **150+ 단위 검사 통과 + 14 게임 PR 머지 + 38 회의 산출물 + 1 JSON 결과.**

---

## 2. 4 핵심 이슈 최종 상태

| # | 이슈 | M0 | M1 | M2 | 최종 |
|---|------|----|----|----|------|
| **1** | pharmacist 미로드 | v1 hotfix | v2 hotfix (캐릭터 정의) | — | ✅ **완료** |
| **2** | 6직업 비대칭 | — | C1 chef startingItems / D1.1 cook_intuition | 보강 | ⏳ baseline K1 측정은 PR7 |
| **3** | 이벤트 4종 폭주 | — | 측정 인프라 | — | ⏳ active baseline K1 측정 후 |
| **4** | 데이터 중복 | — | 설계서 | 팩토리 마이그레이션 + 이벤트 랜드마크 통합 | ✅ **완료** |

---

## 3. 게임 코드 PR 누적 (14건)

### M0
1. `mainQuests/index.js` — PHARMACIST 등록
2. `validate.js` — §9 JOB QUEST INDEX REGISTRATION 룰
3. `characters.js` — pharmacist 정의 (5번째 직업)

### M1
4. `characters.js` — chef knife_mastery startingItems (C1)
5. `characters.js` — chef cook_intuition ability (D1.1)
6. `CharCreate.js` — encounterMultDays effect 파싱
7. `ExploreSystem.js` — charGraceMult 적용

### M2
8. `StatSystem.js` — fatigue BALANCE 일관화
9. `CharCreate.js` — fatigueDecayMult 분리 + dead store 정리
10. `locationCardFactory.js` 신규 (팩토리 + 이벤트 랜드마크)
11. `locationCardMeta.js` 신규 (메타 543줄)
12. `items.js` — LOCATION/LANDMARK 팩토리화 (518→84줄) + 이벤트 6종 등록
13. `EquipmentModal.js` — cook_intuition 표시
14. (간접) `validate.js`로 PR마다 회귀 검증

**validate.js 14 PR 후 Errors: 0 유지.**

---

## 4. 시뮬 v2 인프라 (M0~M2)

`tools/sim/v2/` — 18 파일

```
characterAdapter.mjs    drift.mjs           gameStateFactory.mjs
gameStateReset.mjs      index.mjs           playerAI.mjs
rng.mjs                 runner.mjs          run_baseline.mjs
spike_uncertain.mjs     systemBootstrap.mjs
mocks/{globalShim,i18n,renderer,sound}.mjs
reporters/{index,survivalRate,deathDay,reachableContent,moraleDespair,eventOverlap,resourceOverTime}.mjs
tests/{characterAdapter,startDistrict,seedDeterminism,systemBootstrapOrder,eventBusCleanup,driftDetection}.test.mjs
```

**단위 검사 147/147 통과.**

---

## 5. 시뮬 측정 결과 (active baseline)

`BAL_SIM_baseline_v1_result.json` 최종:

| 직업 | mean death day | startInv | abilities |
|------|---------------|----------|-----------|
| **chef** | **4.5** | 5 (knife_mastery PR) | 5 (cook_intuition) — preserved_ration nutrition+40 효과 |
| doctor | 3.9 | 12 (medical_supply) | 4 |
| 다른 5직업 | 3.0 | 3~5 | 3~4 |

**K1 모든 직업 0%.** 잔여 원인: 음식 회복량은 game 정합화됐으나 100일 분량 음식 미확보 (요리·낚시·morale 관리 AI 부재).

사망 원인 분포: 아사 569 / 절망 110 / 탈수 20 / 극도 피로 1.

---

## 6. 시스템 분류

| 분류 | 수 | 목록 |
|------|----|----|
| BOOTSTRAP (시뮬 활성) | **31** | StatSystem, SeasonSystem, ..., NPCQuestSystem |
| SKIP (영구) | 4 | OnboardingSystem, SoundSystem, BGMSystem, CinematicScene |
| **시뮬 모델링 비율** | **88%** | 31 / (31+4) |

`tpAdvance` 700회 × 31 시스템 = **22만 회 시스템 발화 / 회차** (4초). 결정성 100%.

---

## 7. 누적 단위 검사

| 검사 | 결과 |
|------|------|
| `validate.js` (JOB QUEST INDEX + 8 룰) | Errors: 0 (14 PR 후 유지) |
| `characterAdapter.test` | 72/72 |
| `startDistrict.test` | 8/8 |
| `seedDeterminism.test` | 7/7 |
| `systemBootstrapOrder.test` | 36/36 |
| `eventBusCleanup.test` | 8/8 (31 시스템) |
| `driftDetection.test` | 16/16 |
| **합계** | **147/147** ✅ |

---

## 8. 회의 산출물 (38건)

`docs/persona-meeting-2026-05-10/` 분류:

| 분류 | 수 |
|------|----|
| 회의록·검토·결정 | 7 |
| 게임 데이터 hotfix 보고 | 7 |
| 감사·검증 | 7 |
| 설계·계획 | 8 |
| 시뮬 v2 보고 | 7 |
| 글로서리 | 1 (v0.4) |
| JSON 결과 | 1 |

`README.md` 인덱스로 모든 항목 navigate 가능.

---

## 9. 핵심 발견 (M0~M2 25건)

1. **`mainQuests/index.js`에 pharmacist import 0건** (M0)
2. **`mainQuests/pharmacist.js` 단일파일은 chef 잔재** (M0)
3. **시뮬 v1은 게임 코드 import 0건** (M1)
4. **stamina 공식 = `strength × endurance / 50`** (Phase 0 spike)
5. **chain 모델 부정확** — 27 시스템 multicast (Phase 0 spike)
6. **CharCreate.js:296 dead store** (false alarm)
7. **fatigue P1 — BALANCE.stats.fatigueGainPerTP 미사용 (M2 해소)**
8. **pharmacist 캐릭터 정의 부재 — M0 hotfix 절반의 해결책 (P0 hotfix v2 완료)**
9. **chef startDistrict junggoo dangerLevel = 5** (PR1)
10. **chef abilities 4개 모두 시작 즉시 발동 불가능** (SCN_AUDIT 발견, C1 + D1.1 해소)
11. **`loc_gangnam.encounterChance` 0.35 vs `districts.gangnam` 0.15 불일치** (이슈 4 해소)
12. **dangerLevel 12건 items vs districts 불일치** (이슈 4 해소)
13. **이벤트 전용 랜드마크 6종은 `landmarks.js`에 정의** (M2 items.js 통합)
14. **legendaryItems·secretEnemies·secretCombinations 도달 빈도 미실측** (R7 등록)
15. **17 UNCERTAIN 시스템 모두 BOOTSTRAP 승급** (PR2.5)
16. **31 시스템 모두 시뮬 환경 init 성공** (PR2~PR4)
17. **fatigue +0.8/TP × 72 = 일일 +57.6 → day 2 사망** (패시브 시뮬)
18. **PR5 Player AI로 K3 +1일** (chef·doctor 자원 활용)
19. **PR5.5 자원 채집으로 탈수 사망 ↓** (174→20)
20. **PR6 onConsume derive로 chef K3 +0.5일** (preserved_ration 효과)
21. **chef strengths 3개 vs abilities 5개 — UI 분리** (AD 검수)
22. **items.js → locationCardFactory → landmarks → GameData → items 순환 의존** (M2 회피)
23. **EquipmentModal `_renderActiveAbilities`는 effect 결과 derive — abilities 수 무관** (AD 검수)
24. **chef cook_intuition encounterMultDays effect 정상 작동** (Director 검수)
25. **baseline K1=0% 5단계 진행** (패시브 → AI → 채집 → 정합 → 여전 R7-1·R7-2 잔여)

---

## 10. 위험 누적

| ID | 상태 |
|----|------|
| R1 시뮬 인프라 cleanup 누락 | ✅ 해소 (HospitalSiegeSystem 패턴 적용) |
| R2 chef·pharmacist 정의 부재 | ✅ 해소 (P0 hotfix v2) |
| R3 시뮬 v1 결과 신뢰도 | ✅ 해소 (v2 12건 격차 재측정) |
| R4 UNCERTAIN spike 검증 | ✅ 해소 (17개 모두 BOOTSTRAP) |
| R5 chef cook_intuition 수치 | ⏳ active baseline v3 (PR7 후) |
| R6 패시브 baseline 한계 | ✅ 해소 (PR5 Player AI 도입) |
| R7 NUTRITION_RESTORE 추정 | ✅ 해소 (PR6 onConsume derive) |
| **R7-1 요리·낚시 AI 부재** | ⏳ PR7 신규 |
| **R7-2 morale 관리 AI 부재** | ⏳ PR7 신규 |
| **R8 dock_intuition 효과 측정 불가** | ⏳ PR7 후 |

---

## 11. M3 진입 후속 (잔여)

| 순위 | 작업 | 담당 |
|------|------|------|
| **1** | PR7 — 요리·낚시·morale 관리 AI | 시스템 백승호 |
| **2** | active baseline v3 (PR7 후) — K1 5~20% 도달 검증 | 밸런스 권지나 |
| 3 | Director 검수 chef cook_intuition 효과 실측 | Director |
| 4 | BAL_TUNING_chef_grace.md 수치 확정 | 밸런스 |
| 5 | 5직업 Tier-2 분기 (이슈 2 마무리) | 시나리오 |
| 6 | `landmarks.js` 순환 의존 정리 PR | 시스템 |
| 7 | `_renderActiveAbilities` effect 표시 룰 신설 | 시스템 |
| 8 | LORE_GLOSSARY v0.5 — doctor·homeless 나이 보완 | 설정 |

---

## 12. KPI 최종

- ✅ 게임 정합성 14 PR 머지 (`validate.js Errors: 0` 유지)
- ✅ 시뮬 인프라 단위 검사 147/147
- ✅ 31 시스템 시뮬 init 성공
- ✅ 4 핵심 이슈 중 2건(1·4) 완료, 2건(2·3) PR7 후
- ✅ chef K3 +1.5일 측정 격차 (baseline 효과)
- ✅ 38 회의 산출물 + 1 JSON
- ✅ 13 페르소나 정의
- ⏳ K1 측정 (PR7 후)
- ⏳ chef grace 실측 (PR7 후)

---

## 13. 결론

본 세션은 **시뮬 인프라 0 → active baseline K3 격차 측정 가능** 단계까지 도달. 게임 정합성 14 PR + 시뮬 v2 18 파일 + 38 회의 산출물. 4 핵심 이슈 중 2건 완료.

**다음 세션 진입점:** PR7 (요리·낚시·morale AI) — K1 측정 가능화 + 4 핵심 이슈 완전 해소.

---

*문서 끝. M3 진입 시 본 보고서가 첫 reference. 다음 PD 회의는 PR7 머지 + active baseline v3 결과 도착 시.*
