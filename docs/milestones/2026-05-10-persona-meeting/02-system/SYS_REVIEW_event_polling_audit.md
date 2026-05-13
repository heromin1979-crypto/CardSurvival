# 시스템 — 이벤트 4종 폴링 방식 감사

> 작성: 시스템 백승호 / 2026-05-10
> 대상: `raidEvents` / `hordeWaves` / `raiderEvents` / `hospitalSiege` 4 이벤트 시스템의 TickEngine·EventBus 의존 방식
> 결정: **부분 통합 이미 진행됨** — `EventCalendarSystem` 신규 생성 비용은 측정 결과 기반으로 재판단.

---

## 1. 감사 범위

`gameBalance.js` 정의 4 영역(`raidEvents` `hordeWaves` `raiderEvents` `hospitalSiege`)의 코드 레벨 진입점·트리거 경로 식별.

```
grep "BALANCE\.(raidEvents|hordeWaves|raiderEvents|hospitalSiege)" js/
→ 사용처 3 파일:
   - js\systems\NoiseSystem.js
   - js\systems\CombatSystem.js
   - js\systems\HospitalSiegeSystem.js
```

---

## 2. 이벤트별 진입점·트리거 경로

### 2.1 raidEvents
- 정의: `gameBalance.js` 196~203행 (`startDay 12`, `baseChancePerTP 0.003`, `dayScaling 0.0002`, `maxChance 0.015`).
- 진입점: **NoiseSystem.js:106 `BALANCE.raidEvents`** (단일).
- 트리거 흐름: NoiseSystem TP 처리 중 확률 계산 → 발화 시 CombatSystem이 받아 처리하는 형태로 추정.

### 2.2 hordeWaves
- 정의: `gameBalance.js` 206~218행 (`startDay 30`, `intervalDays 15±3`).
- 진입점: **NoiseSystem.js:141 `BALANCE.hordeWaves`** + **CombatSystem.js:519, 1203, 1262 `BALANCE.hordeWaves`** (적용처).
- 트리거 흐름: NoiseSystem이 발화 결정 → CombatSystem이 적 구성·구조물 피해·사기 보상 적용.

### 2.3 raiderEvents
- 정의: `gameBalance.js` 296~306행 (`startDay 40`, `cooldownTP 480`).
- 진입점: **NoiseSystem.js:203 `BALANCE.raiderEvents`** (단일).
- 트리거 흐름: NoiseSystem 단일 진입 — 다른 시스템 BALANCE 직접 참조 없음.

### 2.4 hospitalSiege
- 정의: `gameBalance.js` 222~280행 (`startDay 10`, `intervalDays 6±1`, doctorPrivilege 등).
- 진입점: **HospitalSiegeSystem.js** 전담. EventBus 채널로 통신 (`tpAdvance` 구독, `siegeTriggered` `siegeResolved` `notify` `structureDamage` `hospitalDamaged` `hospitalRewards` `patientDied` 발신).
- 트리거 흐름: EventBus 기반. 다른 시스템과 결합도 낮음.

---

## 3. 핵심 발견

### 3.1 NoiseSystem이 이미 3 이벤트 통합 진입점이다
`raidEvents` `hordeWaves` `raiderEvents` 3종이 모두 `NoiseSystem.js` 내부 단일 파일에서 트리거 로직 보유. 즉 **부분적 EventCalendar는 이미 NoiseSystem이 수행 중**. 충돌·우선순위 정책을 NoiseSystem 내부에서 다루면 충분할 수 있다.

### 3.2 hospitalSiege만 별도 시스템
- 사유 추정: 지역성(보라매병원 고정) + 의사 전용 분기(`doctorPrivilege` `doctorEvacuation` 미니게임) + 환자 사망·구조물 피해 등 의료 도메인 결합.
- EventBus 채널 사용으로 외부 결합도는 이미 낮음.

### 3.3 충돌 정책은 1건만 존재
`gameBalance.js` 247행 `hospitalSiege.minGapWithHordeDays: 3`. 즉 hospitalSiege는 hordeWaves와는 최소 3일 간격을 둔다. 그 외 페어(raidEvents↔hordeWaves, raidEvents↔raiderEvents, raiderEvents↔hospitalSiege 등)는 명시된 충돌 정책 없음.

---

## 4. 통합 비용 평가

### 4.1 옵션 A — 현행 유지 + NoiseSystem 내부 보강
- **변경 범위:** NoiseSystem.js 내부 함수 1~2개에 충돌·쿨다운 정책 추가. `hospitalSiege`는 EventBus 구독으로 NoiseSystem과 동기화.
- **비용:** 작음. 1~2 PR.
- **리스크:** NoiseSystem이 "소음 시스템"이 아닌 "이벤트 디스패처" 책임까지 갖게 됨. 책임 단일성 약화.

### 4.2 옵션 B — `EventCalendarSystem` 신규 분리
- **변경 범위:** 신규 시스템 1개. NoiseSystem에서 3 이벤트 트리거 로직 이관. HospitalSiegeSystem은 EventCalendar에 등록 형태로 변경.
- **비용:** 중간. 5~7 PR (시스템 신설 + NoiseSystem 정리 + HospitalSiege 통합 + 회귀 테스트).
- **리스크:** 마이그레이션 중 발화 누락 가능성. 회귀 100회 시뮬 필수.

### 4.3 옵션 C — 측정 후 결정 (밸런스 권지나 권고)
**현재 권고안.** 이슈 3 회의 결정대로 baseline 측정(`BAL_SIM_event_overlap_day60_100.md`) 결과에 따라 분기.
- 동일 TP 2+ 트리거 5% 미만 → 옵션 A, NoiseSystem 내부 보강.
- 5~10% → 옵션 A + 단일 상수 변경.
- 10% 초과 → 옵션 B로 진입.

---

## 5. 선결 과제 (옵션 결정 전)

1. **NoiseSystem의 책임 범위 명문화.** "소음 처리"인지 "TP 기반 이벤트 디스패처"인지 시스템 페르소나가 결정. 후자라면 시스템명 개명 검토(`TPEventDispatcherSystem`).
2. **이벤트 우선순위 표 작성.** 동일 TP에 2+ 발화 가능 시 어느 이벤트가 선행되는지. 현재 정책 없음 → 발화 순서가 파일 로드 순서에 의존.
3. **`hospitalSiege`의 EventBus 채널을 다른 3 이벤트도 사용하도록 표준화 검토.** 현재 NoiseSystem 내부에서 함수 호출 형태인지, EventBus emit 형태인지 추가 코드 리딩 필요.

---

## 6. 결론·권고

- **단기(M1):** 옵션 C 채택. 측정 우선.
- **중기(M2~M3):** 측정 결과에 따라 옵션 A 또는 B. 어느 쪽이든 NoiseSystem 책임 범위 명문화는 선결.
- **장기:** EventBus 표준화. 모든 TP 기반 이벤트는 동일 채널 컨벤션 사용 (`event.{type}.start` `event.{type}.resolved`).

---

*문서 끝. 밸런스 권지나 측정 결과 수신 후 옵션 확정.*
