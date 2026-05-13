# 밸런스 — 후반 이벤트 4종 폭주 측정 계획

> 작성: 밸런스 권지나 / 2026-05-10
> 대상: `raidEvents` `hordeWaves` `hospitalSiege` `raiderEvents` 동일 TP 다중 트리거 빈도
> 결정: 통과 — M1, baseline 시뮬과 병렬 실행.

---

## 1. 문제 정의

`gameBalance.js` 4 이벤트 영역. 후반(day 60~100) 누적 발생 빈도 미측정. 충돌 정책은 247행 `hospitalSiege.minGapWithHordeDays: 3` 한 줄 — 다른 페어 정책 부재. 이슈 3 회의 결정대로 **측정 후 통합 형태(NoiseSystem 보강 vs `EventCalendarSystem` 신설) 분기**.

---

## 2. 측정 KPI

| KPI | 기준 |
|-----|------|
| **E1.** day 60~100 구간 동일 TP에 2+ 트리거 회차 비율 | <5% / 5~10% / >10% 분기 |
| **E2.** day 60~100 구간 평균 이벤트 합계 (4 이벤트 통합) | 회차당 평균 발생 횟수 |
| **E3.** 페어별 인접 발화 빈도 | (raidEvents↔hordeWaves) (raidEvents↔raiderEvents) (raiderEvents↔hospitalSiege) 등 6 페어 |
| **E4.** 인접 발화 후 사기/자원 변화량 | 누적 사기 손실, 의료품 소진 |
| **E5.** day 60~100 구간 사망 회차 비율 | 후반 사망률 |

---

## 3. 표본 설계

- baseline v1과 동일 700회 시뮬 결과 재활용. 별도 시뮬 불필요.
- 단, 시뮬 출력에 4 이벤트 트리거 시각·종류 로그 포함 필요. 시스템 백승호에 로그 슬롯 요청.

---

## 4. 분기 결정 (이슈 3 회의 결정 그대로)

| E1 결과 | 결정 | 후속 |
|---------|------|------|
| <5% | 옵션 A: 현행 유지 | 통합 작업 백로그. 다른 페어 충돌 정책 추가 PR만. |
| 5~10% | 옵션 A + 단일 상수 변경 | `intervalDays` 또는 `baseChancePerTP` 1개만 ±20% 이내 단일 PR. |
| >10% | 옵션 B: `EventCalendarSystem` 통합 | 시스템 백승호 신규 시스템 설계서. Director 게이트 별도. |

---

## 5. 페어별 충돌 정책 후보

E3 결과에 따라 신규 정책 후보.

| 페어 | 현재 정책 | 후보 |
|------|-----------|------|
| hospitalSiege ↔ hordeWaves | minGapWithHordeDays 3 (이미 존재) | — |
| raidEvents ↔ hordeWaves | 없음 | minGap 2일? |
| raidEvents ↔ raiderEvents | 없음 | raiderEvents의 cooldownTP 480 활용 가능 |
| raiderEvents ↔ hospitalSiege | 없음 | minGap 2일? |
| 4종 동시 발화 | 없음 | 우선순위 표 (hospitalSiege > hordeWaves > raidEvents > raiderEvents 안) |

수치는 측정 결과 후 단일 변경 PR. 한 번에 모든 페어 정책 추가는 거절.

---

## 6. 보고 양식

```
## E1 결과
day 60~100 구간 동일 TP 2+ 트리거 비율: __%

## E2 결과
회차당 평균 이벤트 합계 (day 60~100): __회

## E3 결과 (페어별)
| 페어 | 인접 발화 빈도 | 충돌 정책 추가 권고 |
|------|----------------|---------------------|
| ... | ... | ... |

## E4 결과
인접 발화 후 평균 사기 손실: __ / 평균 의료품 소진: __

## E5 결과
day 60~100 사망 회차 비율: __%

## 결정 분기
E1 __% → 옵션 (A / A+상수 / B)
```

---

## 7. 위임

- 시뮬 로그 슬롯(이벤트 시각·종류) 추가 → 시스템 백승호.
- 옵션 B 진입 시 → 시스템 `SYS_DESIGN_event_calendar.md` 신규.
- 카드 표현 통일 (Director 서민호 §3 발언) → 옵션 B 진입 시 별도 트랙. 본 측정과 동시 진행 안 함.

---

*문서 끝. baseline v1 시뮬 출력에 이벤트 로그가 포함되면 본 문서가 자동 채움.*
