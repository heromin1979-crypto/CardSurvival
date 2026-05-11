# 밸런스 — baseline v4 측정 보고 (PR8 후)

> 작성: 밸런스 권지나 / 2026-05-11
> 측정 대상: PR8 머지 (master `d42514f`) 후 baseline v4
> 결정: K1 0% 미해결. K3 chef 격차 +2.2d (v3 +1.5d → +0.7d 확대). PR9 옵션 C 트리거 충족, cook_intuition grace 단축 검토 보류 (협의서 §6.2 트리거 +2.5d까지 0.3d 여유).

---

## 1. 실측 환경

- 시뮬: `tools/sim/v2/` (PR1~PR8 누적)
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 700 runs (7직업 × 100회)
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성 보장
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: 7.3초
- BALANCE leaf 합: 227, fingerprint: `len316-h242a5b5f` (v3 동일 — `gameBalance.js` 미변경 확인)
- 결과 파일: `BAL_SIM_baseline_v4_result.json`
- buildTag: `sim-baseline-v4-pr8`
- bootstrapErrors 합: 0 (전 700 회차)

PR8 변경: `js/data/characters.js` 7직업 startInv에 cooking 입력(instant_noodles + contaminated_water) 보강, `js/data/districts.js` 6 시작 구 lootTable에 herb/wild_berry 가중치 추가 (dobong 제외, PD 협의서 §5.1·§5.2 합의대로). BALANCE 상수는 변경 없음 — fingerprint 동일이 이를 검증.

---

## 2. 메서드

- 700 runs (7직업 × 100회), SEED_BASE=0, runDays=100
- v3와 동일 시드·동일 시뮬 로직. 차이는 PR8 데이터(characters.js + districts.js)뿐
- 결정성: Math.random → mulberry32 monkey-patch. fingerprint v3·v4 모두 `len316-h242a5b5f`로 BALANCE leaf 무변경 확인
- bootstrapErrors 0 — 전 회차 시스템 init 정상
- AI 발동 카운트는 `tools/sim/v2/probe_pr8.mjs` 임시 probe로 별도 측정 (시뮬 로직 변경 없이 runner.mjs 코드 흐름 복제 + aiLog 외부 노출만 추가)

---

## 3. K1 — 100일 생존율 (목표 10~20%)

| 직업 | 생존율 | ±CI95p | survived/runs | v3 비교 |
|------|--------|--------|---------------|---------|
| doctor | 0.00% | 0.00 | 0/100 | 0%p |
| soldier | 0.00% | 0.00 | 0/100 | 0%p |
| firefighter | 0.00% | 0.00 | 0/100 | 0%p |
| homeless | 0.00% | 0.00 | 0/100 | 0%p |
| chef | 0.00% | 0.00 | 0/100 | 0%p |
| engineer | 0.00% | 0.00 | 0/100 | 0%p |
| pharmacist | 0.00% | 0.00 | 0/100 | 0%p |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p).

**판단: K1 목표(10~20%) 미달. baseline 6회 연속 0% (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8).** ±3%p 신뢰구간 안에서 100% 0%. PR8의 startInv·lootTable 보강은 K1 0%를 깨지 못함 — chef·pharmacist의 평균 사망일은 늘어났으나 100일 생존선 도달은 0건. 협의서 §6.1 PR9 옵션 C 트리거(K1 < 5%) 충족.

---

## 4. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean (v4) | median (v4) | mean (v3) | Δ |
|------|-----------|-------------|-----------|---|
| doctor | 4 | 4 | 4 | 0 |
| soldier | 3 | 3 | 3 | 0 |
| firefighter | 3 | 3 | 3 | 0 |
| homeless | 3 | 3 | 3 | 0 |
| **chef** | **5.2** | **5** | **4.5** | **+0.7** |
| engineer | 3 | 3 | 3 | 0 |
| **pharmacist** | **4** | **4** | **3** | **+1.0** |

**핵심 변화:**
- chef +0.7d 추가 생존 (4.5 → 5.2)
- pharmacist +1.0d (3 → 4)
- 나머지 5직업 변화 없음

**chef K3 격차 = 5.2 − 3 = +2.2d** (다른 5직업의 mean 3 기준).
- v3 chef 격차: +1.5d → v4: +2.2d (+0.7d 확대)
- 협의서 §5.5 KPI 목표 "chef +1.0d~+2.0d 범위 사수" — **+2.2d로 0.2d 초과**
- 협의서 §6.2 cook_intuition grace 재검토 트리거 "+2.5d 이상" — **0.3d 여유. 트리거 미충족**

소소한 격차 확대는 chef의 cooking lv 4가 PR8 startInv·lootTable 보강 덕에 처음으로 활성화된 효과. pharmacist 격차 확대는 cooking lv 1 직업이 contaminated_water 1 + instant_noodles 2 startInv로 day 3 사망선을 1일 늦춘 결과.

---

## 5. K5 — 사망 원인 분포

### 5.1 전 직업 합산 (v3 vs v4)

| 원인 | v3 (PR7) | v4 (PR8) | 변화 |
|------|----------|----------|------|
| 아사 | 569 | 569 | 0 |
| 절망 | 110 | 113 | +3 |
| 탈수 | 20 | 12 | -8 |
| 극도 피로 | 1 | 6 | +5 |

전 직업 합산은 거의 동일. 그러나 **chef 회차에서 K5 분포가 크게 변동**.

### 5.2 직업별 K5 (v3 vs v4)

| 직업 | v3 K5 | v4 K5 |
|------|-------|-------|
| doctor | 아사 69 / 절망 31 | 아사 69 / 절망 31 |
| soldier | 아사 100 | 아사 100 |
| firefighter | 아사 100 | 아사 100 |
| homeless | 아사 100 | 아사 100 |
| **chef** | **절망 79 / 탈수 20 / 극도 피로 1** | **절망 82 / 탈수 12 / 극도 피로 6** |
| engineer | 아사 100 | 아사 100 |
| pharmacist | 아사 100 | 아사 100 |

**중요 분석 (v3 보고서 §4의 표는 합산 수치라 chef 변화가 묻혔음):**
- chef는 v3에서 이미 100% 비-아사. cooking AI는 v3에서도 chef 회차에서 부분 작동 중이었음
- v4에서 chef 탈수 20→12로 8건 감소 — contaminated_water 1 startInv가 boil/purify 거치지 않은 raw 형태이지만, cooking 입력으로 활용된 것으로 추정 (`actCook`의 boil_water 등 수분 산출 레시피 대비 검토 의무)
- chef 극도 피로 1→6 (+5) — 생존 일수 증가의 부산물 (day 5.2까지 살면서 fatigue 누적)
- pharmacist는 K5 분포가 100% 아사 그대로지만 mean 3→4로 1d 추가 생존. cooking lv 1 + instant_noodles 2가 day 3 아사선을 1일만 미루고 day 4에 결국 동일 원인 사망

5직업(soldier/firefighter/homeless/engineer)은 v3·v4 모두 K5 100% 아사 + K3 mean 3 — **PR8 startInv·lootTable 보강이 이 직업군에 즉효 없음**. 원인은 §6 probe에서 분리.

---

## 6. AI 발동 측정 (probe_pr8.mjs)

700 runs, baseline v4와 동일 시드·동일 시뮬 로직.

### 6.1 직업별 발동 횟수 (700 runs 합계)

| 직업 | actCook | actFish | actBoostMorale | actEat | actDrinkWater | actMove | actSleep | actExplore |
|------|---------|---------|----------------|--------|---------------|---------|----------|------------|
| doctor | 100 | 0 | 99 | 198 | 198 | 0 | 298 | 894 |
| soldier | 138 | 0 | 35 | 32 | 100 | 0 | 200 | 600 |
| firefighter | 200 | 0 | 11 | 43 | 100 | 0 | 200 | 600 |
| homeless | 200 | 0 | 0 | 0 | 100 | 0 | 200 | 600 |
| **chef** | **200** | **0** | **100** | **217** | **194** | **14** | **417** | **1251** |
| engineer | 200 | 0 | 0 | 27 | 100 | 0 | 200 | 600 |
| pharmacist | 200 | 0 | 100 | 140 | 100 | 22 | 292 | 900 |

### 6.2 평균 발동 횟수 (per run)

| 직업 | actCook | actFish | actBoostMorale | actEat | actDrinkWater |
|------|---------|---------|----------------|--------|---------------|
| doctor | 1.00 | 0.00 | 0.99 | 1.98 | 1.98 |
| soldier | 1.38 | 0.00 | 0.35 | 0.32 | 1.00 |
| firefighter | 2.00 | 0.00 | 0.11 | 0.43 | 1.00 |
| homeless | 2.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| chef | 2.00 | 0.00 | 1.00 | 2.17 | 1.94 |
| engineer | 2.00 | 0.00 | 0.00 | 0.27 | 1.00 |
| pharmacist | 2.00 | 0.00 | 1.00 | 1.40 | 1.00 |

### 6.3 핵심 분석

**actCook**:
- **모든 7직업에서 100/100 회차 발동** (runsWithCook 기준). v3까지 chef·doctor 일부에 한정됐던 cooking이 PR8 startInv 보강으로 7직업 전부 day 2부터 발동
- 평균 1~2회/run = 평균 사망 day 3~5 안에서 매일 1회 발동 (day 1은 AI 미작동 + day 마지막 day는 사망 전 마지막 cook)
- **soldier 1.38회/run은 day 3 사망으로 인한 cap** — 다른 직업 2회와 차이는 사망 시점이 빠름
- doctor 1.00회/run은 startInv 12개 + instant_noodles 1·contaminated_water 1로 cooking 입력 부족. day 2 1회 cook 후 입력 소진 추정

**actFish**:
- **전 직업 0건** — 예상대로. fishing_rod 없음, hangang 미접근. 이는 협의서 §2.3 옵션 C가 PR9 보류된 정확한 결과

**actBoostMorale**:
- chef·pharmacist 100/100 (매 회차 발동) — startInv preserved_ration 또는 morale 회복 음식이 morale<30 시 활용
- doctor 99/100 — 거의 매 회차 발동
- soldier 35/100, firefighter 11/100 — morale<30 도달 회차 일부에서만 발동
- **homeless 0/100, engineer 0/100** — 이 두 직업은 startInv에 onConsume.morale 보유 아이템 없음. 즉 morale<30 도달했어도 회복 수단 부재. 이슈 #2 직업 비대칭 P1과 직접 연결

---

## 7. 협의서 §5.5 KPI 비교표

| KPI | baseline v3 | baseline v4 | 목표 | 충족 |
|-----|-------------|-------------|------|------|
| K1 (100일 생존율) | 0.00% (전 직업) | 0.00% (전 직업) | ≥ 5% (chef 우선), 10% 미달 시 PR9 옵션 C 트리거 | ❌ — 0% 6회 연속, PR9 옵션 C 트리거 충족 |
| K3 doctor / chef / 5직업 | 4 / 4.5 / 3 | 4 / 5.2 / 3 | chef 5.0~5.5 / 5직업 3.5 이내 | ⚠️ — chef 5.2 범위 내, 5직업 3.0으로 목표 3.5 이상 미달 |
| K3 chef 격차 | +1.5d | +2.2d | +1.0d ~ +2.0d 사수 | ❌ — 0.2d 초과. 단 협의서 §6.2 +2.5d 트리거까지 0.3d 여유 |
| K5 아사 | 569/700 | 569/700 | chef 회차에서 -50% 기대 | ⚠️ — chef는 v3에서 이미 비-아사 100% (목표 무의미), 다른 5직업 100% 아사 유지 |
| 직업 격차 (K1 max-min) | 0%p | 0%p | ≤ 5%p | ✅ (모두 0% 동일) |

---

## 8. R7 상태표 갱신 (SYS_PR7 §5 패턴)

| ID | PR7 후 | PR8 후 (v4) |
|----|--------|-------------|
| R7-1 요리·낚시 AI 부재 | ✅ 구현, 발동 차단 (자원 부재) | ✅ **요리는 7직업 100/100 발동. 낚시는 여전히 0건 (rod 부재)** |
| R7-2 morale 관리 AI 부재 | ✅ 구현, 발동 빈도 낮음 | ✅ **chef·pharmacist·doctor 100% 발동. homeless·engineer 0% (morale 회복 아이템 부재 — 신규 P1)** |
| R7-3 lootTable food density | ⏳ PR8 권고 | ✅ 6 시작 구 가중치 보강 완료. 단 K1 효과는 0%p (PR8 단독으로는 day 3 사망선 못 깸) |
| R8 cook_intuition 효과 측정 불가 | ⏳ K3 +1.5d 격차 측정 | ⏳ **K3 chef 격차 +2.2d, +2.5d 트리거까지 0.3d. baseline v5에서 모니터링 의무** |

**신규 위험 (PR8 후 발견):**

| ID | 내용 | 트리거 / 완화 |
|----|------|--------------|
| R8-1 (신규) homeless·engineer morale 회복 수단 부재 | 두 직업 startInv에 onConsume.morale 보유 아이템 0건. PR8에서 추가된 instant_noodles·contaminated_water도 morale 효과 없음 | M3 시나리오 한도연 트랙 — 5직업 Tier-2 abilities에서 morale 회복 자원 분배 |
| R8-2 (신규) PR8 startInv 보강이 K1 0% 미해결 | day 3 사망선이 startInv 2~3개 추가로는 깨지지 않음. cooking 1회 nutrition+15가 day 3 nutrition 0 → 영양 부족 사망까지 1d 연장이 한계 | PR9 옵션 C (fishing_rod 자동 지급) + 옵션 A 확대 (25 구 전수) 동시 검토 |

---

## 9. 결론과 PR9 권고

### 9.1 K1 평가

- **K1 0% 6회 연속 — PR9 옵션 C 트리거 충족 (협의서 §6.1)**
- chef·pharmacist에서 K3 +0.7~+1.0d 추가 생존 확보했으나, 100일 생존선 도달 0건
- 직업별 K3 mean 3.0~5.2 — 모든 직업이 day 10 이전 사망. 100일 도달까지 95일 격차

### 9.2 K3 chef 격차 평가

- chef +2.2d — 협의서 §5.5 목표 +1.0~+2.0d 초과 (0.2d 초과)
- 협의서 §6.2 cook_intuition grace 재검토 트리거 +2.5d까지 0.3d 여유
- **권고: cook_intuition grace 단축은 보류**. v5 측정 시 +2.5d 도달하면 즉시 단일 상수 PR로 `days = 7 → 5` 검토. 현 시점에서는 모니터링 모드 유지

### 9.3 PR9 진입 권고

**채택 권고: PR9 옵션 C — fishing_rod 자동 지급**

1. **K1 0% 6회 연속 → §6.1 트리거 충족**
2. PR8이 7직업 actCook 100% 활성화에는 성공했으나 day 5.2 천장 못 깸. 추가 자원 확보 경로 필요
3. 옵션 C는 hangang 인접 구(yongsan·gangnam 등)의 fishing 활용. fishing AI는 PR7에서 이미 구현됨, rod 지급만 남음
4. **chef 부수 완화**: chef junggoo는 hasFishing 미보유 → chef는 옵션 C로 자원 이득 ≈ 0. chef 격차 추가 확대 위험 낮음 — 격차 보호에 유리

**부수 권고:**
- R8-1 (homeless·engineer morale 부재) — M3 시나리오 한도연 5직업 Tier-2 abilities 트랙에 위임. PR9 단독 처리 영역 아님
- R8-2 (PR8 효과 한계) — PR9 옵션 C + 필요 시 PR10 옵션 A 확대(dobong 외 25 구 raw food 가중치) 순차 검토

### 9.4 PD/Balance 협의서 v2 트리거

- **본 보고가 PD/Balance 협의서 v2 트리거** (협의서 §7 "다음 단계 #4: baseline v4 결과로 옵션 C 진입 여부 판단")
- 협의서 v2에서 결정할 항목:
  1. PR9 옵션 C 진입 여부 (본 권고: 진입)
  2. cook_intuition grace 모니터링 — v4 +2.2d, v5에서 +2.5d 초과 시 단일 상수 PR
  3. R8-1 (homeless·engineer morale) M3 시나리오 트랙 우선순위
  4. PR8 startInv 보강이 K1을 못 깬 이유 정량 분석 — day 3 사망선 안에서 cooking 1회로 nutrition+15만 회복, 이는 day 3 nutrition decay (nutritionDecayPerTP 0.5 × TP 72 = 36) 미달 = 시작 nutrition 100 → day 3에 -8 → 추가 day 1 연장 한계

---

## 10. 다음 단계

| 순위 | 작업 | 담당 | 트리거 시점 |
|------|------|------|-----------|
| **1** | **PD/Balance 협의서 v2 작성 — PR9 옵션 C 진입 결정 + chef 격차 모니터링 항목 명시** | PD 김재훈 + 밸런스 권지나 | 본 보고 D+0 |
| 2 | PR9 옵션 C 구현 — `js/data/landmarks.js` hangang sublocation rewardOnEnter 신규 필드 + ExploreSystem 후크 + 시뮬 v2 actFish 트리거 검증 | 시스템 백승호 | 협의서 v2 결정 후 |
| 3 | baseline v5 측정 (PR9 후) | 밸런스 권지나 | PR9 머지 D+1 |
| 4 | chef cook_intuition grace 모니터링 — v5에서 +2.5d 초과 시 즉시 `days = 7 → 5` 단일 상수 PR | 밸런스 권지나 | baseline v5 보고 D+0 |
| 5 | 5직업 Tier-2 abilities — homeless·engineer에 morale 회복 자원 분배 (R8-1) | 시나리오 한도연 | M3 진입 |

**머지 순서 (PD 원칙: 데이터 → 메커닉 → 시각 → 밸런스 튜닝):**
1. PR9 데이터+시스템 (옵션 C) → 2. baseline v5 측정 → 3. (필요 시) PR10 옵션 A 확대 → 4. (필요 시) cook_intuition grace 단일 상수 튜닝 PR

### 10.1 발견 사항 (PR8이 K1 못 깬 정량 분석)

PR8 startInv 보강 = instant_noodles 2 + contaminated_water 1~2. cooking AI 발동 시 nutrition 산출량 추정:
- chef cooking lv 4 + 1회/day cook 평균 → 영양 회복 ~15/일
- 시작 nutrition 100 / nutritionDecayPerTP 0.5 / TP_PER_DAY 72 → 일일 nutrition decay 36
- 일일 net = -36 + 15 = -21/일 → day 3에 nutrition 0 → day 4~5에 영양 부족 사망

**day 5.2 chef 평균 사망일은 이 산식과 정합**. 즉 PR8은 nutrition 회복 흐름을 활성화했지만 **회복량 < 소모량**. K1을 깨려면 추가 회복 경로 (낚시 = 일일 +9~15 추정 / 또는 cooking 회수 증가) 필요.

**검증 의무 (baseline v5 시):**
- chef contaminated_water 1 startInv가 boiled_water/purified_water로 cooking 처리 됐는지 (시뮬 trace에서 cook:boil_water 발화 확인)
- pharmacist cooking lv 1로 instant_noodles 2 활용 가능 여부 (현재 cooking lv 1 레시피 실제 산출 검증)

---

*문서 끝. PD/Balance 협의서 v2가 본 보고를 입력으로 옵션 C 진입 결정 시 PR9 트랙 개시.*
