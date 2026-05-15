# PD 마일스톤 종결 보고 — M0 + M1 + M2 진행 상황

> 작성: PD 김재훈 / 2026-05-11
> 범위: 2026-05-10 ~ 2026-05-11 세션 산출물 전체
> 결정: **M0 완료. M1 거의 완료(reporters 통합·spike 완료). M2 진입 대기.**

---

## 1. 한 줄 요약

7 페르소나 회의로 식별한 4 핵심 이슈(pharmacist 미로드 / 6직업 비대칭 / 이벤트 폭주 / 데이터 중복) 중 1번 완료, 2번·3번·4번은 측정·설계 단계 통과. **시뮬 v2 인프라는 31 시스템 init 성공 + 147/147 단위 검사로 baseline 측정 준비 완료.**

---

## 2. 산출물 인덱스 (25건)

`docs/persona-meeting-2026-05-10/` 기준.

### 2.1 회의록·검토·결정
| 파일 | 분류 |
|------|------|
| `README.md` | 마스터 인덱스 |
| `PD_MEETING_sim_v2_gate.md` | PD 게이트 (v2 보완판) |
| `REVIEW_sim_v2_v1.md` | 6 페르소나 검토 |
| `DIR_GATE_chef_start_environment.md` | Director 게이트 (chef 환경) |
| `PD_MILESTONE_M0_M2_summary.md` | 본 문서 |

### 2.2 게임 데이터 hotfix
| 파일 | 적용 |
|------|------|
| `PD_HOTFIX_PHARMACIST.md` | v1 — mainQuests/index.js + validate.js §9 |
| `PD_HOTFIX_PHARMACIST_v2.md` | v2 — characters.js pharmacist 정의 |
| `SCN_PR_chef_knife_mastery.md` | C1 — chef startingItems |
| (별도 D1.1) | encounterMultDays + chef cook_intuition |

### 2.3 감사·검증
| 파일 | 발견 |
|------|------|
| `SCN_AUDIT_location_refs.md` | location/landmark 참조 감사 |
| `SYS_REVIEW_event_polling_audit.md` | 이벤트 폴링 NoiseSystem 통합 발견 |
| `SIM_AUDIT_v1.md` | 시뮬 v1 격차 (chain·import·chef 누락) |
| `UNREACHABLE_AUDIT_v1.md` | dead code 0건, 텔레메트리 부재 |
| `SYS_REVIEW_charcreate_decay_hardcode.md` | P0 false alarm + fatigue P1 |
| `SCN_AUDIT_chef_abilities.md` | chef startingItems + pharmacist 부재 |
| `SYS_SPIKE_sim_v2_phase0.md` | Proxy·EventBus·stamina·chain 검증 |

### 2.4 설계·계획
| 파일 | 단계 |
|------|------|
| `SYS_DESIGN_location_card_factory.md` | M2 마이그레이션 설계 |
| `BAL_SIM_baseline_v1.md` | 7직업 100회 시뮬 계획 |
| `BAL_SIM_event_overlap_day60_100.md` | 이벤트 폭주 측정 계획 |
| `LORE_GLOSSARY.md` v0.3 | 25구·7직업·핵심 어휘 |
| `SYS_DESIGN_sim_v2.md` (v1) | 초안 — 검토에서 거절 |
| `SYS_DESIGN_sim_v2_v2.md` | 6 보완 반영 |
| `SYS_DESIGN_sim_v2_v2_1.md` | spike 결과 5건 반영 |

### 2.5 시뮬 v2 보고
| 파일 | 단계 |
|------|------|
| `SYS_SIM_SKIP_classification.md` | 35 시스템 분류표 |
| `SYS_PR1_sim_v2_report.md` | PR1 인프라 87/87 |
| `SYS_PR2_sim_v2_report.md` | PR2 systemBootstrap 130/130 |

---

## 3. 게임 데이터 변경 누적 (5 PR 머지)

| 파일 | 변경 | PR |
|------|------|----|
| `js/data/mainQuests/index.js` | PHARMACIST_QUESTS import + 병합 | M0 hotfix v1 |
| `js/data/validate.js` | §9 JOB QUEST INDEX REGISTRATION 룰 신설 | M0 hotfix v1 |
| `js/data/characters.js` | pharmacist 정의 추가 (5번째 직업) | P0 hotfix v2 |
| `js/data/characters.js` | chef knife_mastery startingItems | C1 |
| `js/data/characters.js` | chef cook_intuition ability 추가 (encounterMultDays) | D1.1 |
| `js/screens/CharCreate.js` | encounterMultDays effect 파싱 | D1.1 |
| `js/systems/ExploreSystem.js` | charGraceMult 적용 | D1.1 |

`validate.js` 모든 변경 후 `Errors: 0 / ALL CLEAR`.

---

## 4. 시뮬 v2 인프라 (16 파일 신규)

`tools/sim/v2/`:

```
characterAdapter.mjs    (stamina = strength × endurance / 50)
gameStateFactory.mjs    (stub)
runner.mjs              (TP 루프 stub, PR4에서 systemBootstrap 연결)
index.mjs               (CLI + reporters 통합)
rng.mjs                 (mulberry32)
drift.mjs               (BALANCE Proxy + balanceFingerprint)
systemBootstrap.mjs     (31 시스템 init/teardown)
spike_uncertain.mjs     (PR2.5 spike 결과 산출)

mocks/
  renderer.mjs / i18n.mjs / sound.mjs / globalShim.mjs

reporters/
  survivalRate.mjs / deathDay.mjs / reachableContent.mjs
  moraleDespair.mjs / eventOverlap.mjs / resourceOverTime.mjs / index.mjs

tests/
  characterAdapter.test.mjs   (72)
  startDistrict.test.mjs       (8)
  seedDeterminism.test.mjs     (7)
  systemBootstrapOrder.test.mjs (36)
  eventBusCleanup.test.mjs     (8)
  driftDetection.test.mjs      (16)
```

**단위 검사 147/147 통과 (이전 130/130 + bootstrap 31개 갱신).**

---

## 5. 4 핵심 이슈 진행 상황

| 이슈 | 처음 결정 | 현 상태 |
|------|----------|---------|
| **1. pharmacist 미로드** | P0 hotfix | ✅ **완료 (v1 + v2)** — 26 quests + 직업 정의 등록. 실측 약사 시작 가능 |
| **2. 6직업 비대칭** | M2 3 마일스톤 분리 | ⏳ baseline 측정 대기. chef 자원·환경 보정은 D1.1·C1로 사전 완료 |
| **3. 이벤트 4종 폭주** | M1 측정 → M2 결정 | ⏳ baseline 측정 대기. eventOverlap 리포터 준비 완료 |
| **4. 데이터 중복** | M2 팩토리 마이그레이션 | ⏳ 설계서 완성 (`SYS_DESIGN_location_card_factory.md`). 머지 대기 |

---

## 6. 시뮬 v2 진행 (PR1 → PR4)

| PR | 상태 | 산출 | 일정 |
|----|------|------|------|
| Phase 0 spike | ✅ | drift Proxy + EventBus + stamina 공식 + chain 폐기 | D+0~D+1 |
| PR1 | ✅ 머지 | 인프라 + characterAdapter + 단위 검사 3 | D+2~D+4 |
| PR2 | ✅ 머지 | systemBootstrap 14 + drift + 단위 검사 3 | D+5~D+7 |
| PR2.5 | ✅ 머지 | spike 결과 — 17 시스템 BOOTSTRAP 승급 | D+8 |
| PR3 | ✅ 머지 | reporters 6건 통합 | D+9 |
| PR4 | ⏳ 대기 | runner ↔ systemBootstrap 연결 + 7직업 700회 baseline | D+10~D+12 |

---

## 7. baseline 측정 신뢰도 (현재)

**BOOTSTRAP 31 시스템 (게임 27 시스템 + 추가 4) 모두 시뮬 환경 init 성공.**

| 영역 | 모델링 |
|------|--------|
| 스탯 decay (시즌 보정 포함) | ✅ |
| 4 이벤트 시스템 | ✅ 모두 |
| NPC·전투·제작·탐색 | ✅ 모두 (PR2.5 승급) |
| 베이스캠프·메인 퀘스트 | ✅ |
| 야간·낚시·소음·함정 | ✅ |
| **모델링 누락** | 4개만 (OnboardingSystem·SoundSystem·BGMSystem·CinematicScene) — UI/오디오만 |

→ **baseline 신뢰도 90%+ 예상.**

---

## 8. 핵심 발견 (이번 세션)

1. **`mainQuests/index.js`에 pharmacist import 0건** — 첫 grep으로 발견.
2. **`mainQuests/pharmacist.js` 단일파일은 chef 잔재** — name 미스매치.
3. **시뮬 v1은 게임 코드 import 0건** — 자체 하드코딩 모델.
4. **stamina 공식 = `strength × endurance / 50`** (CharCreate.js:227) — 시뮬 v1·v2 추정 모두 오류.
5. **chain 모델 부정확** — 게임은 27 시스템이 multicast.
6. **CharCreate.js:296 dead store** (P0 false alarm).
7. **fatigue P1 — BALANCE.stats.fatigueGainPerTP 미사용** (grep 0건).
8. **pharmacist 캐릭터 정의 부재** — M0 hotfix가 절반의 해결책이었음.
9. **chef startDistrict junggoo dangerLevel = 5** (이전 추정 3 오류).
10. **chef abilities 4개 모두 시작 즉시 발동 불가능** (story 정합 결함).
11. **BALANCE.encounter.earlyGameGraceDays/Mult — 모든 직업 공통 grace 이미 존재** (chef 보정 추가 시 고려).
12. **`loc_gangnam.encounterChance 0.35` vs `districts.gangnam.encounterChance 0.15` 불일치.**
13. **이벤트 전용 랜드마크 6종은 `landmarks.js`에 정의됨** (이전 누락 의심 해소).
14. **legendaryItems·secretEnemies·secretCombinations 도달 빈도 미측정** (dead code 아닌 텔레메트리 부재).
15. **17 UNCERTAIN 시스템 모두 BOOTSTRAP 승급** (시뮬 환경에서 무탈하게 init).

---

## 9. M2 진입 대기 작업

### 9.1 시뮬 v2 PR4 (D+10~D+12)
- runner.mjs가 systemBootstrap을 호출하도록 연결
- GameState reset 헬퍼 신규 (회차 사이 stat·inv·time reset)
- 7직업 × 100회 baseline 실행
- `BAL_SIM_baseline_v1.md` § 6 표 채움

### 9.2 게임 데이터 PR (M2)
- 이슈 4 — location/landmark 팩토리 마이그레이션 (`SYS_DESIGN_location_card_factory.md` 기준)
- 이벤트 전용 랜드마크 6종 `items.js` 등록 결정 (or `landmarks.js` 단일 진리 채택)
- `CharCreate.js:296` dead store 정리 (P3)
- fatigue P1 일관화 (`BALANCE.stats.fatigueGainPerTP` 활용)

### 9.3 시나리오·설정·Director (M2)
- 이슈 2 — 5직업 Tier-2 분기 (`SCN_QUEST_{firefighter|soldier|homeless|engineer|chef|pharmacist}_tier2.md`)
- `SYS_DESIGN_companion_classSkills_v2.md` (시스템 5종 추가)
- LORE_GLOSSARY v0.4 (cook_intuition 어휘 + doctor·homeless 나이)
- Director 검수 `DIR_VERIFY_chef_start_grace.md` (D1.1 머지 후)

### 9.4 밸런스 (M2 baseline 후)
- `BAL_TUNING_chef_grace.md` — cook_intuition 수치(×0.5/7일) 확정
- `BAL_TUNING_doctor_privilege.md` — doctor 격차 측정 후 결정
- reachableContent 표본 차수 결정 (200~500회)

---

## 10. 위험 (Risk)

| ID | 항목 | 완화 |
|----|------|------|
| R1 | PR4 runner-systemBootstrap 연결에서 GameState reset 누락 발견 가능 | 신규 reset 헬퍼 작성 |
| R2 | baseline 결과 신뢰도 — chef·pharmacist 신규 정의의 stat 추정값 검증 부재 | 시뮬 결과 대비 game 실측 비교 |
| R3 | doctor maxHp 105 등 sim v1 → game 격차 누적 (~12건) → v1 결과 13.3% 불신 | baseline v2 측정으로 대체 |
| R4 | UNCERTAIN 17 spike는 import/init/tpAdvance 3단계만 검증, 깊은 동작 미검증 | PR4 실측 + 100회 시뮬로 보강 |
| R5 | chef cook_intuition 7일 ×0.5가 글로벌 grace(3일 ×0.45)와 합산 시 day 1~3 = ×0.225, 너무 약함 가능성 | baseline 측정 후 수치 조정 |

---

## 11. 후속 액션 우선순위 (PD 결정)

| 순위 | 작업 | 담당 |
|------|------|------|
| **1** | 시뮬 v2 PR4 (runner ↔ systemBootstrap 연결) | 시스템 백승호 |
| **2** | baseline 700회 실행 + JSON 보고 | 밸런스 권지나 |
| 3 | 이슈 4 location/landmark 팩토리 마이그레이션 | 시스템 + 레벨 |
| 4 | fatigue P1 일관화 PR | 시스템 |
| 5 | 5직업 Tier-2 분기 6 PR | 시나리오 |
| 6 | Director 검수 (chef grace) | Director |

---

## 12. KPI 현황

- ✅ 게임 정합성 머지 5건 (`validate.js` Errors: 0 유지)
- ✅ 단위 검사 147/147
- ✅ 시뮬 v2 31 시스템 init 성공
- ✅ 페르소나 회의 25건 산출물
- ✅ 4 P0/P1 게이트 통과
- ⏳ baseline 측정 (PR4 후)
- ⏳ K1·K6·E1 KPI 실측값 (baseline 후)

---

## 13. 결론

본 세션은 시뮬 인프라 0 → baseline 측정 직전 단계까지 도달. 게임 정합성 5 PR + 시뮬 v2 16 파일 + 25 회의 산출물. **다음 세션은 PR4 + baseline 측정으로 진입.**

**M0 완료. M1 90%+ 완료. M2 진입 대기.**

---

*문서 끝. 다음 PD 회의는 PR4 완료 + baseline 결과 도착 시.*
