# 밸런스 — baseline v15 측정 보고 (결정성 수정본, ★ 절망 사망 과대 계상 교정)

> 작성: 2026-06-05 / 트리거: 시뮬 결정성 버그 수정 (`gameStateReset.mjs` 회차 간 상태 누수 제거)
> 측정 대상: `resetGameStateForRun` 누수 키 삭제 수정 후 6직업 재측정
> 결정: K1 전 직업 **0% 유지**(시뮬-본체 분리 정합). fingerprint `len316-h242a5b5f` 유지.
>       ★ **핵심 단언 — v14까지의 "절망 사망 1위" 분포는 회차 간 `mental` 상태 누수의 측정 인공물(artifact).**
>       공통 6직업·600회 정규화 시 **절망 208 → 6 (-202), 아사 302 → 506 (+204).** 진짜 1위 사인은 아사(84%).
>       chef K3 6.1 → **7.7 (+1.6d)**, doctor 4.9 → **4.2 (-0.7d)** — 누수 제거로 진값 교정.
>       v15는 **6직업(출시 확정 범위) 기준선**. v14(7직업, pharmacist 포함)는 과거 기록으로 보존.

---

## 1. 서두

### 1.1 측정 환경

- 시뮬: `tools/sim/v2/` (PR1~PR17 누적 + 결정성 수정 1건)
- 수정 내용: `tools/sim/v2/gameStateReset.mjs` `resetGameStateForRun` — `INITIAL_SNAPSHOT`에 없는 GameState 키(`hospital·ecology·npcs·companions·groupStats·mental·body`) 삭제 루프 추가 (+8라인). 시스템 `init()`이 첫 회차에 생성한 키가 회차 간 누수되던 결함 제거
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- **600 runs (6직업 × 100회)**, `RUNS_PER_CHARACTER=100`, `SEED_BASE=0`
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: **11.1초** (`meta.totalDurationMs = 11099`)
- BALANCE leaf 합: 227 (`drift.balanceLeafTotal`), **fingerprint `len316-h242a5b5f`** — v3~v14와 동일 (데이터 무변경 단정)
- 결과 파일: `BAL_SIM_baseline_v15_result.json`
- buildTag: `sim-baseline-v15-detfix`
- bootstrapErrors 합: **0/600**

### 1.2 v14와의 구조적 차이 2건

1. **결정성 수정** — v3~v14는 회차 간 `mental·npcs·ecology·hospital·body·groupStats·companions` 상태가 누수된 채 측정됨. 한 배치 안에서 run 2~100이 앞 회차 시스템 상태를 물려받아 day 4 진값이 day 5로 드리프트. v15는 매 회차 동일 출발점 보장 → **회차 독립성 확보**
2. **직업 수 6직업** — v14는 7직업(pharmacist 포함, 700회). 현재 게임 본체 `js/data/characters.js`는 6직업(pharmacist 미구현, `grep` 0건). v15는 **출시 확정 범위(6직업)와 일치**

### 1.3 결정성 수정 단언 (Red-Green 검증)

- RED (수정 전): `seedDeterminism.test.mjs` #6 `runSingleRun(doctor, seed=1)` 2회 → survivedDays 4 vs 5 불일치. Pass 6 / Fail 1
- GREEN (수정 후): 동일 테스트 Pass 7 / Fail 0
- 증거: 누수 그대로 survivedDays `[4,5,5,5]` 드리프트 → 누수 키 삭제 `[4,4,4,4]` 완전 결정
- 본체 vitest 443/443 무회귀 (sim 전용 파일 변경, 게임 본체 무영향)

---

## 2. K3 평균 사망일 — v14 → v15 (공통 6직업)

| 직업 | v14 (누수) | v15 (수정) | Δ | 단정 |
|------|-----------|-----------|---|------|
| doctor | 4.9 | **4.2** | **−0.7** | 누수 제거로 진값 하향 교정 |
| soldier | 5.0 | 5.0 | 0 | 무변화 |
| firefighter | 5.0 | 5.0 | 0 | 무변화 |
| homeless | 4.7 | 5.0 | +0.3 | 소폭 상향 |
| **chef** | 6.1 | **7.7** | **+1.6** ★ | 누수가 chef 생존을 과소 계상. chef 단독 최장 생존 강화 |
| engineer | 5.0 | 5.0 | 0 | 무변화 |

**chef 격차 단정:** chef 7.7d vs 5직업 평균 4.84d → 격차 **+2.86d** (v14 누수 측정 +1.29d의 ~2.2배). M3 chef 정체성 강화(PR14·PR17) 효과는 누수 제거 후 오히려 더 또렷.

---

## 3. K5 사망 원인 분포 — ★ 핵심 교정 (공통 6직업 600회 정규화)

| 사인 | v14 (누수, 6직업) | v15 (수정) | Δ |
|------|------------------|-----------|---|
| **아사** | 302 | **506** | **+204** |
| **절망** | 208 | **6** | **−202** |
| 탈수 | 34 | 56 | +22 |
| 극도 피로 | 56 | 32 | −24 |

### 3.1 절망 사망 과대 계상 단언

**v14까지의 "절망 사망 다수" 분포는 결정성 누수의 측정 인공물이다.** 누수 키 중 `mental`(MentalSystem 사기·절망 상태)이 회차 간 전이되어, run N이 run N-1의 고갈된 사기 상태를 물려받아 절망 사망이 누적 계상됨. 직업별 대비가 이를 직접 증명:

| 직업 | v14 절망 사망 | v15 절망 사망 |
|------|--------------|--------------|
| doctor | **98/100** | 0/100 |
| soldier | 13/100 | 0/100 |
| homeless | 29/100 | 0/100 |
| chef | 53/100 | 6/100 |
| engineer | 15/100 | 0/100 |
| firefighter | 0/100 | 0/100 |

doctor의 v14 절망 98%는 누수가 없으면 **전부 아사**(v15 아사 100%)였다. 수정 후 절망 사망은 전 직업 합산 6/600(1%)로 사실상 소멸.

### 3.2 진짜 사인 구조 (v15)

- **아사 506/600 (84%)** — 압도적 1위. 시뮬 player AI가 day 4~8 영양 고갈로 사망
- 탈수 56 (9%) / 극도 피로 32 (5%) / 절망 6 (1%)
- chef만 다변화(극도피로 30·탈수 42·아사 22·절망 6) — nutrition 자원(chef_meal_kit·hearty_stew) 보강으로 아사 회피, 생존 연장 후 타 사인으로 전이

---

## 4. K1 (100일 생존율) — 0% 유지

전 직업 0% (시뮬 player AI day 4~8 사망). **시뮬 K1은 본체 밸런스 게이트(생존율 10~20%)가 아니다** — 협의서 v5 §15 시뮬-본체 분리 단정. 본체 K1은 M4 텔레메트리 트랙(M4 #4)으로 별도 측정. v15는 시뮬 마지노선(직업 비대칭·사인 구조) 기준선.

---

## 5. fingerprint — 데이터 무변경

`drift.balanceLeafTotal = 227`, fingerprint `len316-h242a5b5f` — v3~v15 동일. 본 수정은 시뮬 인프라(`gameStateReset.mjs`) 변경으로 BALANCE 데이터 leaf 무영향. 게임 밸런스 데이터는 변경 0.

---

## 6. 함의 (★ 후속 검토 권고)

1. **M3 morale/절망 중심 KPI 재해석 필요** — M3의 K5 절망 사망(peak 405→224)·morale 회복 ability(PR13~PR17) 작업은 *누수로 과대 계상된 절망 사망*을 부분적으로 추격한 측면이 있다. 누수 제거 후 절망은 사실상 비병목. **진짜 병목은 아사(영양)**. 밸런스 권지나 재검토 권고
2. **chef 격차 KPI는 강화** — 누수 제거 후 chef 7.7d로 단독 최장. M3 chef 정체성 트랙 결론(R11-1 해소)은 유지·강화
3. **v15가 신 기준선** — 이후 baseline은 v15를 출발점으로. v3~v14는 누수 포함 과거 기록(추세 해석 시 절망 사인 과대 주의)
4. **본체 K1 측정(M4 #4)이 출시 밸런스 게이트** — v15 0%는 시뮬 AI 한계이지 본체 밸런스 아님

---

## 7. 다음 단계

- [ ] (권고) 밸런스 권지나 — v15 사인 구조(아사 84%) 기준 M3 결론 재해석 + morale ability 효용 재평가
- [ ] M4 #4 본체 K1 측정 — 실제 출시 게이트(생존율 10~20%) 검증
- [ ] (선택) `systemBootstrap.mjs` 라인번호 주석 동기화 (`systemBootstrapOrder.test.mjs` 31 fail, 본 수정과 무관 기존 결함)

---

*문서 끝. baseline v15 = 결정성 수정 + 6직업 출시 범위 기준선. 결과 raw: `BAL_SIM_baseline_v15_result.json`.*
