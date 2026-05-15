# 시뮬레이션 최신화 감사 v1

> 작성: 밸런스 권지나 + 시스템 백승호 (합동) / 2026-05-10
> 대상: `sim_firefighter_300days.mjs`, `testdata/sim_*.mjs` 7건
> 결정: **시뮬 baseline v1을 현재 시뮬로 진행 불가.** 시스템 백승호 시뮬 인프라 재설계 필요.

---

## 1. 결론 요약

현재 시뮬은 **게임 코드를 import 하지 않는 자체 하드코딩 모델**. 가장 최근 시뮬 파일도 2026-04-21자, 그 후 변경된 `gameBalance.js`·`js/systems/*` 변경분이 일체 반영되지 않는다. 시뮬 결과로 게임 결정을 내리면 잘못된 데이터에 근거하게 된다. **이슈 2 baseline 시뮬 계획(`BAL_SIM_baseline_v1.md`)은 시뮬 인프라 재설계 후로 미뤄야 한다.**

---

## 2. 감사 범위

발견된 시뮬 파일.

| 파일 | 크기 | 마지막 수정 | 직업 |
|------|------|-------------|------|
| `sim_firefighter_300days.mjs` | 148KB | 2026-04-15 | 6직업 (chef 누락) |
| `testdata/sim_jisu_patched.mjs` | 76KB | 2026-04-21 | 약사(이지수)? |
| `testdata/sim_jisu_quests.mjs` | 59KB | 2026-04-13 | 약사 |
| `testdata/sim_jisu_300days.mjs` | 71KB | 2026-04-13 | 약사 |
| `testdata/sim_soldier_50runs.mjs` | 84KB | 2026-04-13 | 군인 |
| `testdata/sim_100runs.mjs` | 47KB | 2026-04-15 | (불명) |
| `testdata/sim_combat_lethality.mjs` | 16KB | 2026-04-15 | 전투 검증 |

**검증 일시:** 2026-05-10 (시뮬 최신 파일 후 19일 경과).

---

## 3. 핵심 격차

### 3.1 게임 코드 import 0건 — 시뮬과 게임의 단일 진리 부재
모든 시뮬 파일이 `import { writeFileSync } from 'fs';` 외 **게임 코드를 일체 import 하지 않는다.** 즉 `gameBalance.js` 상수, `js/systems/*` 로직, `js/data/*` 데이터를 모두 자체 하드코딩해서 모델링.

```
grep '^import' sim_firefighter_300days.mjs
→ 5: import { writeFileSync } from 'fs';
```

**영향:** `gameBalance.js`가 변경돼도 시뮬은 자동 갱신 안 됨. 시뮬 결과로 "현재 게임"을 판단하면 잘못된 추론.

### 3.2 STAT_DECAY 값 불일치 (확인된 사례)

| 키 | 시뮬 값 | gameBalance 현행 | 상태 |
|----|---------|------------------|------|
| `hydration` | **1.5** (sim 86행) | 1.0 (`stats.hydrationDecayPerTP`) | **불일치** |
| `nutrition` | 0.5 | 0.5 | 일치 |
| `morale` | 0.2 | 0.2 | 일치 |
| `fatigue` | 0.64 (= 0.8 × firefighter 0.8) | 0.8 | calculated 일치 |

`hydration`은 히스토리 2.0 → 1.5 → 1.0. **시뮬은 1.5 단계에 정지**, 한 단계 뒤처짐. 시뮬 결과의 생존율은 현행 게임보다 더 빡빡한 환경으로 측정된 것.

### 3.3 7직업 vs 시뮬 6직업 — chef 누락
시뮬은 `CHARACTER_CONFIGS`에 6직업만 정의:
```
firefighter, doctor, soldier, homeless, pharmacist, engineer
```
**chef 누락.** 게임은 7직업 (validate.js 검증 결과 chef 39 quests registered). M1 baseline 시뮬 계획의 "7직업 × 100회 = 700회"는 **chef 0회로 진행 불가**.

### 3.4 미반영 시스템 (게임에 있고 시뮬에 없는 것)

`gameBalance.js` 영역 중 시뮬에 미반영.

| 영역 | gameBalance 행 | 시뮬 반영 |
|------|----------------|-----------|
| `raidEvents` (12일~) | 196~203 | ❌ |
| `hordeWaves` (30일~) | 206~218 | 부분 (보스 일부만) |
| `hospitalSiege` (10일~) + `doctorPrivilege` + `doctorEvacuation` | 222~280 | ❌ |
| `raiderEvents` (40일~) | 296~306 | ❌ |
| `patientIntake` + 마일스톤 보너스 | 282~293 | ❌ |
| `moraleTiers` 4단계 (high/normal/low/despair + blockExplore) | 187~193 | ❌ (단순 morale 변수) |
| `crafting.quality` 4 tier (normal/good/excellent/masterwork) | 76~91 | ❌ |
| `combat.companionAuto` (5 stance + classSkills nurse/soldier/doctor) | 124~155 | ❌ |
| `combat.guardDamageReduction` + `guardCounterBonus` (1턴 방어/반격) | 110~113 | ❌ |
| `night` 야간 페널티 + 광원 보유 완화 | 307~318 | 부분 |
| `fishing` 시스템 (fishingQuality) | 326~341 | ❌ |
| `medicalStation` 내구도 (~15일 1080TP) | 320~323 | ❌ |
| `disease.exposureDecayRate 0.5` | 182~185 | ❌ |
| `noise.scaledDecayBreakpoints` (스파이럴 방지) | 41~46 | ❌ (단순 noise +20 형태) |

**약 11~12 영역 미반영.** 시뮬은 게임의 60~65% 수준만 모델링.

### 3.5 시뮬 작성 시점 vs 게임 변경 시점

| 항목 | 시점 |
|------|------|
| 가장 최근 시뮬 작성 | 2026-04-21 |
| 가장 최근 게임 코드 변경 (CLAUDE.md 추정) | ~2026-05-10 |
| 사이 기간 | 약 19일 |
| 사이 기간 변경된 영역 | 미상 (git log 추적 필요) |

---

## 4. 즉시 결정 (이슈 2 baseline 시뮬 계획 영향)

`BAL_SIM_baseline_v1.md`는 다음과 같이 수정.

### Before
> 직업: 7종. 직업당 100회. 합계 700회. 시드 고정. 단일 빌드 sim-baseline-v1.

### After
> **선결: 시뮬 인프라 재설계 (M1 1주차).**
> - 시뮬이 `gameBalance.js`를 직접 import 하도록 리팩터.
> - 미반영 11~12 영역 모델링 추가.
> - chef 직업 `CHARACTER_CONFIGS`에 추가.
>
> **그 후 baseline 측정 (M1 2주차~).** 직업 7종 × 100회.
>
> 시뮬 인프라 재설계가 1주차에 끝나지 않으면 baseline 자체를 M2로 이연.

---

## 5. 시뮬 인프라 재설계 권고

시스템 백승호 PR 후보 `tools/sim/v2/`.

### 5.1 파일 구조 (권고)
```
tools/sim/v2/
  index.mjs              — entry, char × runs 인자
  characters.mjs         — 7직업 정의 (gameBalance + 직업 고유 보정)
  engines/
    statTick.mjs         — gameBalance.stats 직접 사용
    eventCalendar.mjs    — raid/horde/siege/raider 4 이벤트 통합
    moraleTier.mjs       — moraleTiers 4단계 + blockExplore
    quality.mjs          — crafting quality 4 tier
    fishing.mjs          — fishingQuality 분포
    companion.mjs        — stance 5 + classSkills
  reporters/
    survivalRate.mjs     — K1
    eventOverlap.mjs     — E1~E5
    moraleDespair.mjs    — K6
```

### 5.2 핵심 원칙
- **gameBalance.js를 직접 import.** 자체 STAT_DECAY 같은 하드코딩 거절.
- **시뮬은 게임 시스템과 동일한 입력→출력 대응을 갖되, 일부 시스템(렌더·UI)은 mock으로 대체.**
- **모듈 단위 단위 검사:** statTick 엔진 단독 시 100 TP 후 hydration 손실이 `stats.hydrationDecayPerTP × 100`과 일치.

### 5.3 폐기 vs 유지 결정
- `sim_firefighter_300days.mjs` 외 6 파일 — 새 인프라 도입 시 **읽기 전용 회귀 비교용으로만** 1회 보존, 이후 폐기.
- `sim_combat_lethality.mjs`처럼 좁은 범위 검증은 새 구조의 reporter로 흡수.

---

## 6. 위임 / 후속

| 작업 | 담당 | 데드라인 |
|------|------|----------|
| 시뮬 v2 설계서 `SYS_DESIGN_sim_v2.md` | 시스템 백승호 | M1 1주차 |
| `BAL_SIM_baseline_v1.md` § 3 표본 설계 수정 (chef 추가, 시뮬 v2 의존성 명시) | 밸런스 권지나 | M1 1주차 |
| 시뮬 v2 PR | 시스템 백승호 | M1 2주차 |
| baseline 700회 실행 + 보고 | 밸런스 권지나 | M1 3주차 |
| 결과 회의 | PD 김재훈 주재 | M1 종료 직전 |

---

## 7. 위험 (Risk)

- **R1.** 시뮬 v2 인프라 재설계가 M1 1주차에 안 끝나면 baseline은 M2로 이연. 이슈 2(6직업 비대칭) M2 작업의 전제가 흔들린다.
- **R2.** 시뮬 v1 결과(firefighter 100회 13.3%)는 hydration 1.5 환경 — 현행 1.0보다 빡빡. 즉 **현행 게임의 firefighter 생존율은 13.3%보다 높을 가능성**. baseline 측정 전까지 13.3%를 게임 현행 수치로 인용 금지.
- **R3.** chef 직업 시뮬 부재가 19일+ 지속됨. chef 메인 퀘스트 39개의 밸런스 측정 데이터 0건 상태.

---

*문서 끝. 시스템 백승호 `SYS_DESIGN_sim_v2.md` 산출 시 본 문서 § 5 권고와 차이점 별도 표기.*
