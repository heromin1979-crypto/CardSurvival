# PD 재검토 회의록 — 시뮬 v2 보완판 게이트

> 작성: PD 김재훈 / 2026-05-10
> 의제: `SYS_DESIGN_sim_v2_v2.md`가 검토 v1의 6 필수 보완을 충족하는가
> 결정: **통과.** Phase 0 spike 즉시 진입.

---

## 1. 참석자

| 페르소나 | 역할 |
|----------|------|
| 김재훈 | PD (의장) |
| 서민호 | Director |
| 권지나 | Balance |
| 백승호 | System (설계서 작성자) |
| 한도연 | Scenario |
| 이수정 | Lore |
| 조윤성 | Level |

---

## 2. 6 필수 보완 충족 확인

검토 v1 §4 필수 보완 6건. 각 페르소나가 자기 항목 검증.

| # | 보완 요청 | 위치 (v2) | 충족 | 검증자 |
|---|-----------|-----------|------|--------|
| 1 | §4 characters.js derive | §4 + `characterAdapter.mjs` | ✅ | Balance, Scenario, Lore, Level |
| 2 | §5 statTick chain 모델 | §5 (5단계 chain) | ✅ | Balance, System |
| 3 | §13 PR 일정 분할 | §13 (Phase 0 + 6 PR) | ✅ | PD, System |
| 4 | §3 EventBus 직접 import | §3, §5.3 | ✅ | System |
| 5 | §7.3 v1↔v2 격차 기준 재정의 | §7.3 (방향·크기 모형 표) | ✅ | Balance |
| 6 | §10 endingCategory + INCOMPLETE 마커 | §10 | ✅ | Scenario, PD |

**부수 보완 (검토 v1 §2 페르소나별):**

| 항목 | v2 위치 | 충족 |
|------|---------|------|
| D2: 카드 측정 한계 명시 | §11 위임 표 | ✅ |
| N1: chef startInv 결정 | §4.1 (option a 권고) | ⚠️ 조건부 |
| N2: questSystem 모델링 | §11 위임 (Phase 4 신설 또는 범위 외) | ⚠️ 조건부 |
| N3: endingCategory 필드 | §10 schema | ✅ |
| L1: 글로서리 캐릭터 이름 | `LORE_GLOSSARY.md` v0.2 §3.5 | ✅ |
| V2: startDistrict 단위 검사 | §4.2 + §9 | ✅ |
| B3: reachableContent 표본 | §6 (별도 차수 PD 결정) | ✅ |
| B4: balanceFingerprint 정의 | §7.4 | ✅ |

---

## 3. 페르소나별 발언

### 3.1 밸런스 권지나
> "B1·B2·B3·B4 모두 충족. 단 §4 characterAdapter.mjs의 stamina 변환 공식 `endurance × 1.7`이 추정값으로 남아 있다(`R5`로 등록됨). 이건 Phase 0 spike에서 게임의 정식 변환 공식을 식별해 v2.1로 갱신해야 한다. 그렇지 않으면 K1 격차의 일부 원인이 미상으로 남는다.
>
> SIM_COMBAT_DEFAULTS의 7직업 전투 데미지·정확도·도망률은 characters.js에 없는 시뮬 자체 보정 — 단일 진리 위반 아님. 다만 게임의 CombatSystem이 동일 공식을 derive 한다면 그것을 import하는 것이 더 좋다. TODO로 받음."

→ 통과. v2.1 갱신 항목 등록.

### 3.2 시스템 백승호 (설계자 자기 검증)
> "S1~S5 모두 보완 반영. 단 §5.1 마지막 줄 '합성 순서는 게임 StatSystem.tickPlayer() 분석 후 v2.1에 갱신'은 Phase 0 spike의 작업 항목이어야 한다. spike 결과로 v2.1 또는 PR2 설계가 변경될 수 있다.
>
> in-memory EventBus는 §5.3 코드 예시처럼 `HospitalSiegeSystem.init(gs)` 한 줄 호출로 동작 가능하나, 회차 사이 cleanup 메커니즘이 게임 측에 있는지 spike에서 검증."

→ 통과. spike 작업 항목 명문화.

### 3.3 PD 김재훈 (자기 검증)
> "P1~P4 모두 반영. 일정은 Phase 0 spike(D+0~D+1) + 6 PR로 D+12 안에 baseline 도출 가능. 단 PR4a/4b 분할이 일정에 빡빡하게 들어와 있어 R1·R4 위험이 현실화 가능. spike 결과 안 좋으면 baseline 즉시 M2로 이연 결정."

→ 통과.

### 3.4 Director 서민호
> "D1·D2 충족. chef privileges null이 시뮬 v2 범위에서 정상으로 다뤄짐. 이슈 2(6직업 비대칭) 작업과 분리 — baseline 결과로 chef 격차 측정 후 그 데이터로 분기 보강 결정. 비전 정합성 OK."

→ 통과 (D2 문구 보완 확인).

### 3.5 시나리오 한도연
> "N1: chef startInv를 option (a)로 결정한 점은 동의. baseline에서 chef K1이 다른 직업 대비 -10%p 초과면 (b) 후속 PR 트리거. 단 chef 시작 = 물병 1개는 statistically meaningful sample 미달 위험(R3)이 큼. **chef만 200회 추가 측정**을 baseline 차수에 포함하길 권고.
>
> N2: questSystem 모델링이 Phase 4 또는 범위 외로 이연된 점은 우려. chef 메인 퀘스트 39개의 가치가 baseline에 반영 안 됨. chef 정체성 '남대문 급식소'는 메인 퀘스트로만 표현되는데 시뮬은 단순 생존만 본다. 그래도 v2 범위로는 수용. **Phase 3 결과 보고에 'questSystem trace 부재로 chef 정체성 미측정' 한계 명시.**"

→ 통과 (N1 chef 200회 + N2 한계 명시 조건).

### 3.6 설정 이수정
> "L1: 글로서리 v0.2 §3.5에 7직업 정식 캐릭터 이름 등록 완료. 본 페르소나 신념 §1(등록 어휘 사용) 위반 해소.
>
> 부수: chef abilities에 startingItems 미정의는 게임 측 결함 의심. 시나리오 한도연과 합동으로 **`SCN_AUDIT_chef_abilities.md`** 별도 산출 권고. 시뮬 v2 통과와 분리."

→ 통과 (chef abilities 후속 별도).

### 3.7 레벨 조윤성
> "V1: chef startDistrict junggoo dangerLevel 3 시작 격차는 게임 정체성 유지 결정으로 수용 (option c). baseline에 시작 환경 격차 KPI 표기 의무.
>
> V2: startDistrict 단위 검사 §9 포함 ✓.
>
> 부수: characterAdapter.mjs가 `ch.homeDist`를 그대로 import하므로 startDistrict 변경이 게임 측에서 일어나면 시뮬도 자동 반영. 단일 진리 ✓."

→ 통과.

---

## 4. 합의된 조건부 보완 (PR1 머지 전)

| 항목 | 책임 | 데드라인 |
|------|------|----------|
| Phase 0 spike에서 stamina 변환 공식 식별 (Balance R5) | 시스템 | D+1 |
| Phase 0 spike에서 EventBus cleanup 검증 (System) | 시스템 | D+1 |
| chef 200회 추가 측정 baseline 차수에 포함 (Scenario N1) | 밸런스 | Phase 3 (D+11) |
| Phase 3 보고에 'questSystem trace 부재' 한계 명시 (Scenario N2) | 밸런스 | Phase 3 (D+12) |
| `SCN_AUDIT_chef_abilities.md` 별도 산출 (Scenario·Lore 합동) | 시나리오·설정 | M1 종료 전 |

---

## 5. 별건 보고 — `CharCreate.js` decay 하드코딩

검토 v1 산출 시점의 P0 의심은 `SYS_REVIEW_charcreate_decay_hardcode.md`로 검증 완료. **결과: P0 false alarm.** `StatSystem.onTP():47~54`가 매 TP `BALANCE.stats.{hydration,nutrition,morale}DecayPerTP`로 오버라이드 적용. `CharCreate.js:296~297`은 dead store.

단 신규 발견 — fatigue는 BALANCE 미적용. **P1 일관화 PR**(`StatSystem.onTP():62`를 `BALANCE.stats.fatigueGainPerTP` 사용)이 시뮬 v2 PR4a 단위 검사 이전에 선행되어야 함.

→ 시뮬 v2 보완판 §14의 R6 분류를 갱신 (P0 의심 → P1 fatigue 일관화 + P3 dead store 정리).

---

## 6. PD 최종 결정

### 6.1 게이트 결정
**통과.** 시뮬 v2 보완판이 검토 v1의 6 필수 보완을 모두 충족했고, 부수 보완 8건 중 6건 충족, 2건은 조건부(N1·N2)로 통과 가능.

### 6.2 즉시 진입 (M1 D+0~D+1)
- **Phase 0 spike** — 시스템 백승호.
  - 항목 1: drift Proxy 호환성 (BALANCE/CHARACTERS Proxy wrapping in ESM dynamic import).
  - 항목 2: in-memory EventBus 회차 사이 cleanup 검증.
  - 항목 3: stamina 변환 공식 식별 (`endurance × ?` — 게임 측 정식 식 또는 추정값 확정).
  - 항목 4: `StatSystem.tickPlayer()` 합성 순서 분석 (5단계 chain 정합성).
- **fatigue P1 일관화 PR** — 시스템 백승호. PR4a 진입 전 머지.
- **`SCN_AUDIT_chef_abilities.md`** 별도 산출 — 시나리오 한도연 + 설정 이수정.

### 6.3 PR1 진입 조건
Phase 0 spike 결과 보고 (`SYS_SPIKE_sim_v2_phase0.md`) 머지 후. spike에서 **차단 사항**(예: drift Proxy 호환성 0, EventBus cleanup 누락 등) 발견 시 v2.1 보완 후 재검토.

### 6.4 일정 확정
| 단계 | 기간 | 산출물 |
|------|------|--------|
| Phase 0 spike | D+0 ~ D+1 | `SYS_SPIKE_sim_v2_phase0.md` |
| PR1 (인프라) | D+2 ~ D+3 | `tools/sim/v2/` 디렉터리 + characterAdapter |
| PR2 (engines + tests) | D+4 ~ D+5 | statTick chain 3 + 단위 검사 3 |
| PR3 (reporters + Phase 1 INCOMPLETE) | D+6 | survivalRate + deathDay |
| PR4a (engines 6) | D+7 ~ D+8 | contamination + disease + eventCalendar + moraleTier + quality + companion |
| PR4b (engines 5 + reporters 4 + drift) | D+9 ~ D+10 | fishing + noise + guard + medical + doctorPrivilege + ... |
| PR5 (baseline 700회) | D+11 ~ D+12 | JSON 보고 + v1↔v2 모형 검증 |

### 6.5 위험 게이트 (PD 강제)
- **R1.** Phase 0 spike D+1 끝나지 않으면 baseline은 M2로 이연. PR 일정 전체 +5일.
- **R3.** chef 100회 시뮬 95회 이상 day 5 이내 사망 → chef 200회 추가 측정 + (b) 후속 트리거.
- **R6.** v2 §14 갱신 — P0 의심 false alarm + P1 fatigue + P3 dead store. fatigue P1이 PR4a 선행.

---

## 7. 후속 액션 (PD 추적)

| ID | 작업 | 담당 | 상태 |
|----|------|------|------|
| A1 | Phase 0 spike 보고서 | 시스템 백승호 | 진행 대기 |
| A2 | fatigue P1 일관화 PR | 시스템 백승호 | 진행 대기 |
| A3 | CharCreate decay dead store 정리 (P3) | 시스템 백승호 | 백로그 |
| A4 | `SCN_AUDIT_chef_abilities.md` | 시나리오 + 설정 | 진행 대기 |
| A5 | `BAL_SIM_baseline_v1.md` 표본 설계 chef 200회 추가 | 밸런스 권지나 | Phase 3 진입 시 |
| A6 | 시뮬 v2.1 (stamina 공식·합성 순서 갱신) | 시스템 백승호 | spike 결과 후 |

---

## 8. 회의 종료

게이트 통과. Phase 0 spike 즉시 진입. spike 결과로 v2.1 갱신 또는 PR1 진입 결정. **다음 PD 회의는 D+1 spike 결과 도착 시.**

---

*문서 끝. 상태 요약은 `README.md`로 갱신.*
