# 밸런스 — 6직업 baseline 100회 시뮬 v1 계획

> 작성: 밸런스 권지나 / 2026-05-10
> 대상: `BALANCE.design.survivalRateTargetMin/Max` 범위 검증과 직업 격차 측정
> 결정: 통과 — M1 마일스톤 우선 작업.

---

## 1. 문제 정의

`gameBalance.js` 7~12행에 명시된 측정값은 firefighter 100회 시뮬 13.3% 단 1건. 나머지 5직업(soldier, doctor, pharmacist, homeless, engineer, chef) 측정 부재 — 6직업 격차 5%p 사수 가능 여부 판단 불가능. doctor 어드밴티지(`hospitalSiege.doctorPrivilege` `doctorEvacuation`)가 시뮬상 어떤 격차를 만드는지도 미측정.

---

## 2. 측정 KPI

| KPI | 기준 |
|-----|------|
| **K1.** 100일 생존율 | 직업별 0.10~0.20 범위 |
| **K2.** 직업 간 격차 | 최대-최소 5%p 이내 |
| **K3.** 평균 사망일 (사망 회차 한정) | 직업별 분포·중앙값 |
| **K4.** 평균 도달 day | 100일 미만 사망 회차의 도달 day 분포 |
| **K5.** 사망 원인 분포 | `endings.js` death_* 카테고리별 비율 |
| **K6.** despair 진입 회차 비율 | `moraleTiers.despair.blockExplore` 진입 비율, 25% 초과면 데스 스파이럴 의심 |
| **K7.** 자원 평균 보유량 (day 30·60·90) | 수분·영양·의료품 |
| **K8.** 후반 이벤트 노출 빈도 | day 60+ 4 이벤트 트리거 합계 |

---

## 3. 표본 설계

- 직업: 7종 (doctor, soldier, firefighter, homeless, chef, engineer, pharmacist).
- 직업당 100회. 합계 700회.
- 시드: 회차 1~100 고정 시드. 직업 간 동일 시드 풀 사용 → 시드 잡음 분리.
- 실행 환경: 단일 빌드(M1 시점 latest master). 변경 없는 기준선.

---

## 4. 절차

### Step 1 — 빌드 고정
hotfix(`PD_HOTFIX_PHARMACIST.md`) 머지 후 시뮬용 빌드 태그 `sim-baseline-v1`. 이후 코드 변경 금지(같은 빌드에서 700회).

### Step 2 — 시뮬 실행
`tools/sim/`(있으면) 또는 `node` 스크립트로 직업별 100회. K1~K8 자동 수집·json 출력.

### Step 3 — 분석
- 직업별 K1~K8 평균·중앙값·표준편차·신뢰구간(±%p).
- 직업 간 K1 격차 표 → 5%p 초과 페어 식별.
- doctor vs others — `doctorPrivilege` `doctorEvacuation` 영향 분리 측정 가능하면 별도 분석.

### Step 4 — 보고
- 직업별 1행 요약 표 (K1, K3 중앙값, K6 비율, K8 합계).
- 격차 5%p 초과 시 즉시 `BAL_TUNING_*.md` 후속 트리거.
- despair 진입 25% 초과 시 시스템 백승호에 회복 경로 보강 요청.

---

## 5. 회귀 영향 검사

본 시뮬은 baseline 측정 — 변경 없음. 시뮬 자체의 회귀 영향 없음.

다만 측정 결과로 다음 후속 PR 트리거 가능.
- doctor 격차 +5%p 초과 → `defeatMoraleMultiplier 0.75 → 0.85` 환원 검토.
- despair 진입 25% 초과 → 사기 회복 메커닉 보강(시스템 위임).
- 어떤 직업 K1 < 0.10 → `stats.decay` 1차 도구로 완화. 0.20 초과 → 강화.

---

## 6. 보고 양식 (sim 결과 채울 자리)

```
| 직업 | K1 (%) | K3 (median) | K6 (%) | K8 (mean) | 신뢰구간 ±%p |
|------|--------|-------------|--------|-----------|--------------|
| firefighter | 13.3 | — | — | — | — |
| soldier | — | — | — | — | — |
| doctor | — | — | — | — | — |
| pharmacist | — | — | — | — | — |
| homeless | — | — | — | — | — |
| chef | — | — | — | — | — |
| engineer | — | — | — | — | — |
```

---

## 7. 변경 적용 후 모니터링

baseline 측정 후 후속 PR이 발생하면 동일 양식으로 v2, v3 측정. v1과 직업별 K1·K6 변화량 표 작성.

---

## 8. 위임

- 시뮬 인프라 부재 시 → 시스템 백승호 (`tools/sim/run_baseline.js` 작성 의뢰).
- doctor 격차 5%p 초과 시 → `BAL_TUNING_doctor_privilege.md` 후속.
- despair 회복 메커닉 → 시스템 백승호 (Director 게이트 통과 필요 시 서민호).

---

*문서 끝. 시뮬 실행 결과는 동일 파일에 § 6 채움 형태로 갱신.*
