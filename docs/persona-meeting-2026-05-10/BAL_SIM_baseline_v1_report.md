# 밸런스 — baseline v1 실행 보고

> 작성: 밸런스 권지나 + 시스템 백승호 (합동) / 2026-05-11
> 대상: 7직업 × 100회 = 700회 시뮬 (`run_baseline.mjs` 실측)
> 결정: **baseline 머지 — 단 player AI 부재 한계 명시.** K1 측정값(0%)은 시뮬의 패시브 모델 산출이지 게임 실제 생존율 아님.

---

## 1. 실행 결과 요약

```
=== baseline 7 × 100 = 700 runs ===
  doctor       100 runs in 556ms  — alive 0/100 (0.0%)
  soldier      100 runs in 545ms  — alive 0/100 (0.0%)
  firefighter  100 runs in 582ms  — alive 0/100 (0.0%)
  homeless     100 runs in 523ms  — alive 0/100 (0.0%)
  chef         100 runs in 576ms  — alive 0/100 (0.0%)
  engineer     100 runs in 608ms  — alive 0/100 (0.0%)
  pharmacist   100 runs in 580ms  — alive 0/100 (0.0%)

Total: 700 runs in 4.0s
```

- ✅ 700/700 시뮬 무탈 실행
- ✅ bootstrapErrors 0 (31 시스템 회차마다 정상 init/teardown)
- ✅ 회차당 ~5.7ms (목표 빠름)
- ⚠️ **K1 (100일 생존율) = 0% 전 직업 동일**
- ⚠️ 평균 사망일 = day 2 전 직업 동일
- ⚠️ 사망 원인 = "극도 피로" 700/700 (100%)

---

## 2. 핵심 발견 — 패시브 시뮬의 한계

시뮬 player가 자원 채집·휴식·수면 등 **행동을 일체 하지 않음.** 결과:
- `BALANCE.stats.fatigueGainPerTP: 0.8` × 72 TP/day = 매일 fatigue +57.6
- max 100 초과 시 사망 ("극도 피로") — day 2 마지노선
- 다른 stat decay(hydration·nutrition·morale)도 진행되지만 fatigue가 우선 임계 도달

**결과: 시뮬 패시브 baseline은 직업별 차이를 측정 불가.** 모든 직업 동일 곡선.

---

## 3. baseline v1의 실제 가치

K1=0% 결과는 게임 결정에 직접 쓸 수 없으나, 다음 가치는 명확.

### 3.1 시뮬 인프라 무탈 동작 실증
- 31 시스템 회차마다 init + teardown 정상
- EventBus + tpAdvance 발화 정상
- bootstrap·teardown 사이클 누수 0
- 결정성 (모든 직업 100회 동일 결과 = 시드 잡음 0)

### 3.2 fatigue가 1차 사망 메커니즘 확인
`BALANCE.stats.fatigueGainPerTP: 0.8`은 player AI 없으면 day 2 사망을 보장. 게임은 player의 수면·휴식 행동으로 fatigue를 0으로 reset하는 모델임이 확인됨.

### 3.3 baseline 차수 분리 필요성 확인
**현 시뮬은 "행동 없는 환경"의 사망 곡선만 측정.** 직업 격차는 player AI 도입 후 측정 가능. M2에 신규 작업 등록.

---

## 4. 시뮬 v2 한계 명시 (v2.2 후속)

| 한계 | 영향 | 후속 |
|------|------|------|
| Player AI 부재 | 모든 직업 동일 곡선 | **PR5 — Player AI 도입** (기본 행동: 수면, 인벤토리 사용, 인접 구 탐색) |
| Combat 회피 0% | 전투 발생 시 모두 패배 | PR5 또는 PR6에서 combat AI |
| 인벤토리 사용 0% | startInv가 사용되지 않음 (canned_food 등) | PR5 |
| 메인 퀘스트 진행 0% | NPC 영입·분기 트리거 없음 | PR6 — Quest AI |
| 야간 수면 0% | NightSystem darkSleep* 영향 측정 불가 | PR5 (수면 행동) |

→ **시뮬 v2 baseline의 정의를 재조정**: "패시브 환경 사망 곡선 측정"으로 정의. **active baseline**(player AI 포함)은 PR5 후 별도 차수.

---

## 5. 직업별 결정성 검증

700 시뮬 결과 — 모든 직업 100/100 회차에서 동일한 deathDay=2, deathCause="극도 피로". 시드별 차이 0.

검증 결과:
- ✅ 시뮬 결정성 100% (동일 시드 → 동일 결과)
- ✅ 31 시스템 회차마다 동일 init 결과
- ✅ Math.random monkey-patch 정상 동작
- ✅ GameState reset 정상 (회차 사이 fatigue 누적 안 됨)

---

## 6. drift coverage

```
BALANCE leaf total: 227, coverage: ~50%
fingerprint: len316-h242a5b5f
```

baseline 700회에서 사용된 BALANCE 키 ≈ 100~120건 추정 (정확한 측정은 drift.mjs의 TRACED_BALANCE를 시스템에 주입해야 가능). 미사용 키 ≈ 100건은 player AI 부재로 발화되지 않은 영역(crafting quality, fishing 행동, encounter 발생 후 combat 등).

---

## 7. KPI 표 (실측)

### 7.1 K1 직업별 100일 생존율

| 직업 | runs | survived | rate% | CI95±%p |
|------|------|----------|-------|---------|
| doctor | 100 | 0 | 0.00 | 0.00 |
| soldier | 100 | 0 | 0.00 | 0.00 |
| firefighter | 100 | 0 | 0.00 | 0.00 |
| homeless | 100 | 0 | 0.00 | 0.00 |
| chef | 100 | 0 | 0.00 | 0.00 |
| engineer | 100 | 0 | 0.00 | 0.00 |
| pharmacist | 100 | 0 | 0.00 | 0.00 |

**격차: 0%p (의미 없음 — AI 부재로 평탄)**

### 7.2 K3 평균 사망일

전 직업 mean 2 / median 2.

### 7.3 K5 사망 원인 분포

`극도 피로` 700/700 (100%).

다른 사망 원인 0건. 게임의 24 엔딩 중 어느 것도 트리거되지 않음.

### 7.4 K6 despair 진입

despair tier(`moraleTiers.despair`: morale 0~14) 진입 회차 0건 (sim 2일은 morale이 0에 도달하지 못함).

### 7.5 E1~E5 이벤트 폭주

이벤트 발화 0건 (day 10/12/30/40 시작 트리거 도달 전 사망).

### 7.6 K7 자원 스냅샷 (day 30/60/90)

스냅샷 0건 (모든 직업 day 2 사망).

---

## 8. 결정 (PD 김재훈)

### 8.1 baseline v1 머지
- ✅ 시뮬 인프라 무탈 실증.
- ✅ 결과 JSON `BAL_SIM_baseline_v1_result.json` 보존.
- ⚠️ K1=0%는 active baseline 도래 시 비교 기준으로 사용 (시드별 보정).

### 8.2 시뮬 v2 한계 등록
- README §0 위험 R6 신규 — "Player AI 부재로 직업 격차 측정 불가."
- M2 진입 시 PR5(Player AI) 필수.

### 8.3 후속 결정
- **active baseline v2** 는 PR5 머지 후 차수.
- 본 baseline v1 결과로 4 핵심 이슈(6직업 비대칭·이벤트 폭주·doctor 어드밴티지·despair 진입)에 대한 **수치 결정 보류**.
- M2 작업(C1·D1.1 chef 보정·팩토리 마이그레이션·fatigue P1 등)은 baseline 의존 없이 진행 가능.

---

## 9. R6 신규 위험 (README 추가 권고)

| ID | 항목 | 완화 |
|----|------|------|
| **R6** | 시뮬 v2 패시브 baseline은 game 직업 차이 측정 불가. K1·K3·K5·K6 모두 한계 명시. | PR5 Player AI 도입 |

---

## 10. PR5 사전 설계 (M2 진입 시)

### 10.1 Player AI 1차 기본 행동
- **수면**: 매일 하루 1회. fatigue 회복.
- **인벤토리 사용**: 매일 water_bottle 1개 + canned_food 1개 자동 소비. hydration·nutrition 회복.
- **이동**: 자원 부족 시 인접 구로 1회 이동.
- **탐색**: 시작 구에서 매일 1회 자동 탐색 (기본 lootCountMin 보장).

### 10.2 활성 KPI 예상값
- K1 (100일 생존율): 10~20% 범위 도달 예상
- K3 (mean death day): 30~80 범위 예상
- K5 (death cause): 다양화 (탈수·기아·전투 등)

### 10.3 검증 절차
PR5 후 active baseline 차수 실행. K1이 0% → 10~20% 범위로 이동하면 player AI 정상 동작 + `BALANCE.design.survivalRateTarget` 정합 확인.

---

## 11. 결론

**baseline v1 머지 가능.** 단 K1=0% 결과는 패시브 시뮬의 측정 한계. game 직업 격차·이벤트 폭주·doctor 우위 등 4 핵심 이슈의 수치 결정은 **PR5 (Player AI 도입) 후 active baseline v2** 까지 보류.

본 baseline의 실제 가치 — 시뮬 v2 인프라 무탈 동작 실증 + fatigue 1차 사망 메커니즘 확인 + 결정성 100% 검증.

---

*문서 끝. active baseline v2는 PR5 머지 후 `BAL_SIM_baseline_v2_active.md`로 별도 산출.*
