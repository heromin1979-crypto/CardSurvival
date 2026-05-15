# 시스템 — 시뮬레이션 v2 인프라 재설계서 (초안)

> 작성: 시스템 백승호 / 2026-05-10
> 대상: `tools/sim/v2/` 신규 시뮬 인프라. 현행 `sim_*.mjs` 7건 대체.
> 결정: 통과 — M1 1주차 인프라 PR. 2주차 baseline 측정 진입.
> 선행: `SIM_AUDIT_v1.md` § 5 권고와 `BAL_SIM_baseline_v1.md` 양식.

---

## Context Card

- **목적:** `gameBalance.js`·`js/systems/*` 변경에 자동 동기화되는 시뮬 인프라.
- **읽는 시점:** 시뮬 코드 작성·확장·KPI 추가 시.
- **단일 진리:** `gameBalance.js`. 시뮬 측 BALANCE 키 하드코딩 0건.
- **모듈 단일 책임:** statTick / eventCalendar / moraleTier / quality / fishing / companion 6 엔진 + 직업 정의 + 리포터.
- **결정 권한:** 시스템 백승호 (시뮬 인프라). 수치는 밸런스 권지나, KPI는 PD 김재훈.

---

## 1. 문제 정의 (Why v2)

`SIM_AUDIT_v1.md` 결과:
- 시뮬 7건이 `import { writeFileSync } from 'fs';` 외 게임 코드 import 0건.
- `STAT_DECAY.hydration: 1.5` ↔ `BALANCE.stats.hydrationDecayPerTP: 1.0` 불일치 (1.5 → 1.0 변경 미반영).
- chef 직업 모델링 부재 (시뮬 6 / 게임 7).
- ~12 영역 미반영(이벤트 4, 모럴 4단계, doctorPrivilege·doctorEvacuation, patientIntake, companionAuto, quality tiers, fishing, medicalStation, disease, noise scaledDecay).

→ 시뮬은 게임의 60~65%만 모델. 결과 신뢰도 낮음.

---

## 2. 설계 원칙 (양보 불가)

1. **gameBalance.js 직접 import.** 시뮬 자체 BALANCE 상수 정의 0건. drift detection 테스트에서 차단.
2. **모듈별 단일 책임.** `engines/statTick.mjs`는 `BALANCE.stats`만 다룬다. `eventCalendar`는 4 이벤트만. 책임 가로지르면 분리.
3. **GameState 형식은 게임과 호환.** `js/core/GameState.js` 스키마 기반. 시뮬에서만 필요한 필드(`runId`, `seed`, `kpi`)는 prefix `_sim` 부착.
4. **시드 고정 결정성.** 동일 시드 → 동일 결과. `Math.random` 직접 사용 금지, `Random(seed)` 인스턴스 경유.
5. **렌더·UI·EventBus 외부 효과 mock.** 시뮬은 시스템 로직만 측정. `EventBus.emit('notify', ...)` 같은 사용자 향 호출은 카운터로만 기록.
6. **회귀 가능 출력.** 매 시뮬 결과는 JSON. 동일 시드 + 동일 BALANCE → 동일 JSON 보장.
7. **drift detection 의무.** BALANCE의 어떤 키도 시뮬에서 사용되지 않으면 경고. 새로 추가된 BALANCE 영역이 시뮬 미반영 시 CI 실패.

---

## 3. 아키텍처

```
tools/sim/v2/
├── index.mjs              ← 진입점. CLI 인자 파싱, 시드 풀 생성, 결과 집계
├── characters.mjs         ← 7직업 정의. 직업 고유 보정만 보유, BALANCE는 import
├── runner.mjs             ← 단일 회차 실행 루프 (TP 단위)
├── gameStateFactory.mjs   ← 시뮬용 GameState 초기화. 게임 GameState.js 스키마 호환
│
├── engines/               ← 시스템 모델링. gameBalance.js 직접 의존
│   ├── statTick.mjs       ← BALANCE.stats (5 decay) + hydration·nutrition·morale·fatigue·stamina
│   ├── eventCalendar.mjs  ← 4 이벤트 통합 (raid·horde·siege·raider) + 충돌 정책
│   ├── moraleTier.mjs     ← BALANCE.moraleTiers 4단계 + blockExplore + dmgMult·accBonus 영향
│   ├── quality.mjs        ← BALANCE.crafting.quality 4 tier + qualityScore 공식
│   ├── companion.mjs      ← BALANCE.combat.companionAuto stance 5 + classSkills 3+
│   ├── fishing.mjs        ← BALANCE.fishing + fishingQuality 1~3 분포
│   ├── night.mjs          ← BALANCE.night encounterMult·travelCostMult·광원 완화
│   ├── disease.mjs        ← BALANCE.disease.exposureDecayRate
│   ├── noise.mjs          ← BALANCE.noise + scaledDecayBreakpoints
│   ├── guard.mjs          ← BALANCE.combat.guardDamageReduction·guardCounterBonus
│   ├── medical.mjs        ← BALANCE.medicalStation.durabilityDecayPerTP + patientIntake
│   └── doctorPrivilege.mjs← BALANCE.hospitalSiege.doctorPrivilege + doctorEvacuation 미니게임
│
├── reporters/             ← KPI 집계. 시뮬 회차 입력 → 통계 출력
│   ├── survivalRate.mjs   ← K1 100일 생존율 + 신뢰구간
│   ├── deathDay.mjs       ← K3 평균 사망일 (사망 회차)
│   ├── reachableContent.mjs← legendary·secretEnemy·secretCombo 도달 회차 분포
│   ├── moraleDespair.mjs  ← K6 despair 진입 비율
│   ├── eventOverlap.mjs   ← E1~E5 이벤트 4종 폭주
│   └── resourceOverTime.mjs← K7 day 30·60·90 자원 보유량
│
├── mocks/                 ← 게임 외부 효과 mock
│   ├── eventBus.mjs       ← emit/on noop, 단 호출 카운터 기록
│   ├── renderer.mjs       ← 모든 render 함수 noop
│   └── i18n.mjs           ← 라벨은 영문 키 그대로 반환
│
├── tests/                 ← 단위 검사 (각 엔진 고립)
│   ├── statTick.test.mjs  ← 100 TP 후 hydration 손실 = BALANCE × 100
│   ├── moraleTier.test.mjs← despair 진입 → blockExplore true 검증
│   ├── eventCalendar.test.mjs ← minGapWithHordeDays 정책 준수
│   └── ... (엔진별 1건 이상)
│
└── drift.mjs              ← BALANCE 키 사용 추적, 미사용 키 경고
```

---

## 4. 7직업 정의 (chef 포함)

`characters.mjs` 명세. 직업 고유 보정만 보유, 공통 수치는 BALANCE.

```js
import BALANCE from '../../../js/data/gameBalance.js';

export const CHARACTERS = {
  firefighter: {
    name: '박영철 (소방관)', icon: '🔥',
    maxHp: 120, stamina: 136, morale: 60, fatigue: 20,
    startDistrict: 'eunpyeong',
    startInv: { rope: 1, hand_axe: 1, bandage: 1, water_bottle: 1 },
    combatDmgWeapon: [12, 25], combatDmgUnarmed: [6, 12],
    combatAcc: 0.78, fleeBase: 0.50,
    statDecayMult: 1.0, noiseMult: 1.0, encounterMult: 1.0,
    skills: { unarmed: 3, melee: 2, defense: 2, building: 3, scavenging: 2, crafting: 2, medicine: 1 },
    privileges: null,
  },
  doctor: {
    /* ... */
    privileges: 'doctor', // doctorPrivilege.mjs 활성화 트리거
  },
  soldier:    { /* ... */ },
  homeless:   { /* ... */ },
  pharmacist: { /* ... */ },
  engineer:   { /* ... */ },
  chef: {                                              // ★ 신규
    name: '윤재혁 (셰프)', icon: '🍳',
    maxHp: 90, stamina: 80, morale: 65, fatigue: 10,
    startDistrict: 'junggoo',
    startInv: { canned_food: 2, water_bottle: 1, knife: 1 },
    combatDmgWeapon: [9, 18], combatDmgUnarmed: [4, 8],
    combatAcc: 0.62, fleeBase: 0.62,
    statDecayMult: 0.95,                                 // 식자재 검수로 영양 손실 보정
    noiseMult: 1.0, encounterMult: 1.0,
    skills: { unarmed: 1, melee: 2, defense: 1, building: 1, scavenging: 2, crafting: 4, medicine: 1, cooking: 4 },
    privileges: null,
  },
};
```

직업 고유 수치(`maxHp`, `stamina`, `combatDmgWeapon` 등)는 시뮬 보유. **BALANCE에 들어가야 할 수치(decay, cap, threshold)는 BALANCE.{영역}.{키} 직접 참조.**

---

## 5. 엔진 모듈 명세 (요약)

각 엔진은 다음 시그니처. 이 형태가 단위 검사의 전제.

```js
// 공통 시그니처 예시
export function tickStats(gs, dtTP, ctx) { /* ... */ return gs; }
```

### 5.1 statTick.mjs
- 입력: `gs`, `dtTP`(TP 경과량), `ctx`(직업 statDecayMult, 시즌 보정)
- BALANCE 의존: `BALANCE.stats.{hydrationDecayPerTP, nutritionDecayPerTP, moraleDecayPerTP, fatigueGainPerTP, staminaRegenPerTP}` + `BALANCE.hydration.{max, startValue}`
- 출력: 갱신된 `gs.hydration / nutrition / morale / fatigue / stamina`

### 5.2 eventCalendar.mjs
- 4 이벤트 통합. 각 이벤트는 etype 필드로 구분.
- BALANCE 의존: `BALANCE.{raidEvents, hordeWaves, hospitalSiege, raiderEvents}`
- 충돌 정책: `hospitalSiege.minGapWithHordeDays: 3` 기본. 추후 페어 정책 추가 시 본 모듈에서 처리.
- 우선순위: `hospitalSiege > hordeWaves > raidEvents > raiderEvents` (잠정, 측정 후 확정).
- 출력: 발화 이벤트 큐. 카드 표현은 reporter에서 카운트.

### 5.3 moraleTier.mjs
- BALANCE 의존: `BALANCE.moraleTiers.{high, normal, low, despair}`
- 매 TP `gs.morale` 값으로 tier 결정. tier 변경 시 dmgMult / accBonus / staminaRegenMult / craftFailMult / fatigueGainMult / blockExplore 적용.
- despair 진입 시 reporter에 K6 카운터 +1.

### 5.4 quality.mjs
- 입력: 제작 시도 (`recipe`, `gs.skills`, queue 길이, morale tier)
- BALANCE 의존: `BALANCE.crafting.quality.{tiers, thresholds, skillBonusPerLevel, focusBonusSolo, focusPenaltyFull, moraleBonusHigh, moralePenaltyLow, moralePenaltyDespair}`
- qualityScore = base(0~1) + skillBonus + focusBonus/Penalty + moraleBonus/Penalty.
- score 비교 → masterwork / excellent / good / normal 결정.

### 5.5 companion.mjs
- 입력: `companions[].stance` (`attack` | `heal` | `support` | `hold` | `manual`)
- BALANCE 의존: `BALANCE.combat.companionAuto.{attackDamage, attackAccuracy, healAmount, healThreshold, holdDamageReduct, classSkills}`
- classSkills 3종: nurse_triage / soldier_suppress / doctor_diagnose. 5종 추가(`SYS_DESIGN_companion_classSkills_v2.md`) 머지 후 자동 반영.

### 5.6 fishing.mjs
- BALANCE 의존: `BALANCE.fishing.{tpCostPerCast, baseCatchChance, maxCatchChance, baitWormBonus, baitInsectBonus, rodBasicBonus, rodImprovedBonus, rareFishChanceMax, trapCheckIntervalTP, trapBaseCatch, trapMaxCatch}`
- districts.{id}.hasFishing + fishingQuality 1~3 분포 직접 참조.

### 5.7 night.mjs
- BALANCE 의존: `BALANCE.night.{startHour, endHour, encounterMult, travelCostMult, lightDrainPerTP, darkSleep*, litSleep*}`
- 시뮬 회차의 매 hour 단위로 야간 진입/종료 결정. 광원 보유 여부로 페널티 완화.

### 5.8 disease.mjs / noise.mjs / guard.mjs / medical.mjs / doctorPrivilege.mjs
나머지는 같은 패턴. `BALANCE.{disease|noise|combat.guard*|medicalStation|hospitalSiege.doctor*}` 직접 참조.

---

## 6. 리포터 (KPI)

| 리포터 | 출력 | KPI 코드 |
|--------|------|----------|
| survivalRate.mjs | 직업별 K1 % + 신뢰구간 | K1 |
| deathDay.mjs | 평균/중앙값 사망일 + 사망 원인 분포 | K3, K5 |
| reachableContent.mjs | legendary 24 / secretEnemy 26 / secretCombo 46 도달 회차 비율 | (신규) |
| moraleDespair.mjs | despair 진입 회차 비율 | K6 |
| eventOverlap.mjs | 동일 TP 2+ 트리거 비율 + 페어 빈도 + 후반 이벤트 누적 | E1~E5 |
| resourceOverTime.mjs | day 30/60/90 자원 분포 | K7 |

리포터는 회차 종료 시 trace 입력 → 통계 출력. 모든 출력 JSON, schema 별도 정의.

---

## 7. drift detection (게임 변경 자동 감지)

`drift.mjs`의 책임.

### 7.1 미사용 BALANCE 키 검출
시뮬 실행 종료 시 시뮬 코드에서 import한 `BALANCE.{path}` 사용처 트레이스. BALANCE 객체에 정의됐으나 시뮬에서 한 번도 안 읽힌 키 목록 출력.

```
=== DRIFT REPORT ===
✅ Used: BALANCE.stats.hydrationDecayPerTP, BALANCE.armor.damageReductionCap, ...
❌ Unused: BALANCE.fishing.trapBaseCatch (declared but never read by sim)
```

미사용 키 1건 이상 → CI 실패 (또는 경고). 새로 추가된 BALANCE 영역이 시뮬에 모델링 안 됐음을 알림.

### 7.2 시스템 파일 변경 감지
`js/systems/*.js`의 mtime을 시뮬 빌드 태그와 비교. mtime > 시뮬 빌드 시각이면 경고.

### 7.3 결과 비교 (regression)
v1 시뮬 결과(JSON)를 보존. v2 첫 실행 시 v1 결과 vs v2 결과 직업별 K1·K3 격차 ±5%p 초과면 보고.

---

## 8. 마이그레이션 (v1 → v2)

### Phase 1: 인프라 + 4직업 (M1 1주차)
- `tools/sim/v2/` 디렉터리 생성
- index.mjs / runner.mjs / gameStateFactory.mjs / mocks/* 작성
- engines: statTick, moraleTier, eventCalendar (3개만)
- characters: firefighter, doctor, soldier, homeless 4직업
- reporters: survivalRate, deathDay
- 단위 검사 statTick·moraleTier 2건

### Phase 2: 직업 확장 + 엔진 확장 (M1 2주차)
- characters: chef, pharmacist, engineer 3직업 추가 → 7 완료
- engines: quality, companion, fishing, night, disease, noise, guard, medical, doctorPrivilege (9개) 추가
- reporters: reachableContent, moraleDespair, eventOverlap, resourceOverTime
- drift.mjs

### Phase 3: baseline 측정 (M1 3주차)
- 7직업 × 100회 실행
- v1과 직업별 K1 격차 비교. ±5%p 초과 시 원인 분석.
- 결과를 `BAL_SIM_baseline_v1.md` § 6 표에 채움

### Phase 4: v1 폐기 (M2)
- v1 시뮬 7건은 readonly 회귀 비교용 1회 보존 후 `testdata/legacy/`로 이동
- 향후 모든 baseline·튜닝 시뮬은 v2 사용

---

## 9. 단위 검사 (필수)

각 엔진당 최소 1건. 회귀 차단의 마지노선.

| 검사 | 보장 |
|------|------|
| `statTick.test.mjs` | 100 TP 후 `gs.hydration` 손실 = `BALANCE.stats.hydrationDecayPerTP × 100 × statDecayMult` |
| `moraleTier.test.mjs` | morale 0~14 진입 시 `gs.tier === 'despair'` + `blockExplore === true` |
| `eventCalendar.test.mjs` | hospitalSiege 발화 후 3일 내 hordeWaves 발화 0건 (minGap 정책) |
| `quality.test.mjs` | qualityScore 1.20에서 masterwork 결정 |
| `fishing.test.mjs` | fishing skill 0 + 기본 미끼 + 기본 낚싯대 → 어획 확률 = 0.30 |
| `companion.test.mjs` | nurse stance support 발화 시 모든 아군 +12 HP |
| `drift.mjs` 자체 검사 | 의도적 미사용 키 1건 추가 시 경고 발생 |

---

## 10. 출력 스키마 (JSON)

```json
{
  "schemaVersion": 1,
  "buildTag": "sim-baseline-v1",
  "balanceFingerprint": "sha256:...",
  "characters": ["firefighter", "doctor", "soldier", "homeless", "chef", "pharmacist", "engineer"],
  "runs": [
    {
      "runId": 0,
      "character": "firefighter",
      "seed": 1,
      "alive": false,
      "deathDay": 47,
      "deathCause": "death_dehydration",
      "events": [
        { "tp": 864, "type": "hospitalSiege", "result": "victory" },
        { "tp": 2160, "type": "hordeWaves", "result": "defeat" }
      ],
      "moraleTierTrace": [
        { "fromTP": 0, "toTP": 720, "tier": "normal" },
        { "fromTP": 720, "toTP": 1080, "tier": "low" },
        { "fromTP": 1080, "toTP": 1440, "tier": "despair", "blockExploreCount": 12 }
      ],
      "kpi": {
        "survivedDays": 47,
        "totalKills": 18,
        "legendaryReached": ["royal_katana"],
        "secretEnemyKilled": ["boss_patient_zero"]
      }
    }
  ],
  "drift": {
    "balanceKeysUsed": 87,
    "balanceKeysUnused": []
  }
}
```

---

## 11. 위임 / 후속

| 작업 | 담당 |
|------|------|
| 본 설계서 검토 | PD 김재훈 (1차), 밸런스 권지나 (2차) |
| KPI 추가 결정 | 밸런스 권지나 |
| 카드 표현 일관성 (reporter eventOverlap의 카드 카테고리) | Director 서민호 |
| 시드 풀 운영 정책 (회차 1~100 고정 vs 랜덤 풀) | 밸런스 권지나 |
| chef 직업 시작 인벤토리·스킬·스탯 검증 | 시나리오 한도연 + 설정 이수정 |

---

## 12. 위험 / 미해결

- **R1.** Phase 1~2가 M1 1~2주차 안에 안 끝나면 baseline은 M2로 이연. 이슈 2(6직업 비대칭) 작업 의존성 위험.
- **R2.** 일부 시스템(`HiddenElementSystem`, `SecretCombinationSystem`, `OnboardingSystem`)은 시뮬 모델링이 더 까다로움. Phase 2 9개 엔진에 우선 포함 안 됨. Phase 3 결과 보고 추가 결정.
- **R3.** drift.mjs의 BALANCE 키 트레이스 구현 — Proxy 또는 getter 후크 사용. 빌드 환경 호환성 검증 필요.
- **R4.** v1과 v2 결과 ±5%p 초과 격차 발생 시 어느 쪽이 정답인가 — v2 (gameBalance.js 직접 import) 우선이지만, 초과 격차의 원인 식별 자체가 추가 작업.
- **R5.** EventBus mock 시뮬에서 `tpAdvance` 같은 채널을 어떻게 모방할지 — runner.mjs가 직접 호출 또는 이벤트 큐 형태. 결정 필요.

---

## 13. 즉시 산출물 (PR 단위)

| PR | 영역 | 데드라인 |
|----|------|----------|
| PR1 | tools/sim/v2/ 디렉터리 + index.mjs + runner.mjs + gameStateFactory.mjs + mocks | M1 D+2 |
| PR2 | engines: statTick, moraleTier, eventCalendar | M1 D+4 |
| PR3 | characters 7직업 + reporters 2건 + 단위 검사 2건 | M1 D+5 |
| PR4 | engines 나머지 9 + reporters 4 + drift.mjs | M1 D+10 |
| PR5 | baseline 700회 실행 + JSON 보고 | M1 D+12 |

---

*문서 끝. PR1 머지 시점에 본 설계서 § 9 단위 검사 첫 2건도 함께. 검사 없는 엔진 머지 거절.*
