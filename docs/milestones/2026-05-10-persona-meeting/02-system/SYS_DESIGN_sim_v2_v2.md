# 시스템 — 시뮬레이션 v2 인프라 재설계서 (v2 보완판)

> 작성: 시스템 백승호 / 2026-05-10
> 대상: `tools/sim/v2/` 신규 시뮬 인프라
> 버전: v2 — `REVIEW_sim_v2_v1.md` 6 필수 보완 반영
> 결정: PD 김재훈 재검토 게이트 대기.
> 선행: `SIM_AUDIT_v1.md` `BAL_SIM_baseline_v1.md` `REVIEW_sim_v2_v1.md`

---

## 0. v1 → v2 변경 요약

| 영역 | v1 | v2 (변경) |
|------|----|----|
| §3 EventBus | mock noop | **게임 `js/core/EventBus.js` 직접 import (in-memory bus)** |
| §3 디렉터리 | mocks/eventBus.mjs | mocks/ 폴더 유지하되 eventBus는 game 측 사용 |
| §4 직업 정의 | 자체 하드코딩 | **`characters.js` derive + 시뮬 보정 별도** |
| §5 statTick | BALANCE.stats만 | **chain 모델 — base → season → night → contamination → disease** |
| §7.3 v1↔v2 격차 | ±5%p 초과 분석 | **격차 = 예상 신호. 방향·크기 모형 일치 검사** |
| §10 schema | deathCause만 | **`endingCategory` + Phase 1 INCOMPLETE 마커** |
| §11 D2 | 카드 표현 위임 | **시뮬 측정 가능 범위 명시 (이벤트 카테고리 카운트만)** |
| §13 PR 일정 | 5 PR 12일 | **PR 6 + Phase 0 spike (D+0~D+1)** |
| §13 단위 검사 | PR1에 첨부 | **PR2로 이관** |

---

## Context Card

- **목적:** `gameBalance.js`·`characters.js`·`js/systems/*` 변경에 자동 동기화되는 시뮬 인프라.
- **단일 진리:** `gameBalance.js`(상수) + `characters.js`(직업) + `districts.js`(지역) + 게임 `EventBus`(통신).
- **모듈 단일 책임:** chain 모델로 합성 명세화.
- **결정 권한:** 시스템 백승호 (인프라). 수치는 밸런스, KPI는 PD.

---

## 1. 문제 정의 (Why v2)

`SIM_AUDIT_v1.md`·`REVIEW_sim_v2_v1.md` 결과:
- v1 시뮬은 게임 코드 import 0건. `STAT_DECAY.hydration: 1.5` ↔ `BALANCE.hydrationDecayPerTP: 1.0` 불일치.
- chef 누락 (시뮬 6 / 게임 7).
- 4 이벤트 시스템·moraleTiers·doctorPrivilege·patientIntake·companionAuto·quality·fishing 등 ~12 영역 미반영.
- **추가 발견 (검토 v1).** v1 시뮬 자체가 `characters.js` 단일 진리를 위반. EventBus mock noop은 `HospitalSiegeSystem.tpAdvance` 구독을 깨뜨려 hospitalSiege 이벤트 누락.

---

## 2. 설계 원칙 (양보 불가)

1. **단일 진리 직접 import.** `gameBalance.js` + `characters.js` + `districts.js` + `js/core/EventBus.js`. 시뮬 측 동일 의미 상수·직업·구·이벤트 채널 정의 0건.
2. **모듈별 단일 책임.** 합성은 chain 모델로 명세 (§5).
3. **GameState 형식은 게임 호환.** `js/core/GameState.js` 스키마 기반.
4. **시드 고정 결정성.** `Math.random` 직접 사용 금지.
5. **외부 효과 mock — 단 EventBus는 예외.** EventBus는 게임 측 직접 import. renderer·i18n·sound는 noop.
6. **회귀 가능 JSON 출력.** 동일 시드 + 동일 BALANCE → 동일 JSON.
7. **drift detection 의무.** BALANCE/CHARACTERS의 어떤 키도 시뮬에서 안 읽히면 경고.

---

## 3. 아키텍처

```
tools/sim/v2/
├── index.mjs              ← 진입점 (CLI 인자, 시드 풀, 결과 집계)
├── runner.mjs             ← 단일 회차 실행 루프 (TP 단위)
├── gameStateFactory.mjs   ← 시뮬용 GameState 초기화 (게임 GameState.js 호환)
├── characterAdapter.mjs   ← (신규) characters.js → 시뮬 character config 변환
│
├── engines/
│   ├── statTick.mjs       ← chain entry. base BALANCE.stats만
│   ├── season.mjs         ← (신규) statTick chain 단계 2
│   ├── night.mjs          ← chain 단계 3
│   ├── contamination.mjs  ← (신규) chain 단계 4
│   ├── disease.mjs        ← chain 단계 5 + BALANCE.disease.exposureDecayRate
│   ├── eventCalendar.mjs  ← 4 이벤트 통합 (in-memory bus 경유)
│   ├── moraleTier.mjs
│   ├── quality.mjs
│   ├── companion.mjs
│   ├── fishing.mjs
│   ├── noise.mjs
│   ├── guard.mjs
│   ├── medical.mjs        ← medicalStation 내구도 + patientIntake
│   └── doctorPrivilege.mjs
│
├── reporters/             ← KPI 집계
│   ├── survivalRate.mjs
│   ├── deathDay.mjs
│   ├── reachableContent.mjs ← legendary·secretEnemy·secretCombo 도달
│   ├── moraleDespair.mjs
│   ├── eventOverlap.mjs   ← E1~E5 이벤트 폭주 (이벤트 카테고리 카운트만, 카드 의미 측정 X)
│   └── resourceOverTime.mjs
│
├── mocks/                 ← 외부 효과 (EventBus 제외)
│   ├── renderer.mjs       ← noop
│   ├── i18n.mjs           ← 라벨은 영문 키 그대로
│   └── sound.mjs          ← noop
│
├── tests/
│   ├── statTickChain.test.mjs    ← base → season → night chain 결합 검증
│   ├── moraleTier.test.mjs
│   ├── eventCalendar.test.mjs    ← in-memory bus + minGapWithHordeDays
│   ├── characterAdapter.test.mjs ← characters.js의 chef → 시뮬 config 변환 정합성
│   ├── startDistrict.test.mjs    ← (신규) 7직업 startDistrict가 districts.js에 존재
│   └── ...
│
└── drift.mjs              ← BALANCE + CHARACTERS 키 사용 추적
```

---

## 4. 직업 정의 — `characters.js` derive

v1의 자체 하드코딩 폐기. `characterAdapter.mjs`가 변환 책임.

```js
// tools/sim/v2/characterAdapter.mjs
import CHARACTERS from '../../js/data/characters.js';

// 시뮬에 필요한 추가 보정 (전투 데미지 분포 등은 characters.js에 없음)
// 게임의 CombatSystem이 derive 하는 동일 공식이 있다면 그것을 import 하는 것이 더 좋음 (TODO)
const SIM_COMBAT_DEFAULTS = {
  doctor:     { combatDmgWeapon: [8, 16],  combatDmgUnarmed: [3, 7],  combatAcc: 0.65, fleeBase: 0.65 },
  soldier:    { combatDmgWeapon: [14, 28], combatDmgUnarmed: [8, 14], combatAcc: 0.82, fleeBase: 0.35 },
  firefighter:{ combatDmgWeapon: [12, 25], combatDmgUnarmed: [6, 12], combatAcc: 0.78, fleeBase: 0.50 },
  homeless:   { combatDmgWeapon: [7, 14],  combatDmgUnarmed: [4, 8],  combatAcc: 0.58, fleeBase: 0.70 },
  pharmacist: { combatDmgWeapon: [8, 16],  combatDmgUnarmed: [3, 7],  combatAcc: 0.65, fleeBase: 0.65 },
  engineer:   { combatDmgWeapon: [9, 18],  combatDmgUnarmed: [4, 9],  combatAcc: 0.70, fleeBase: 0.55 },
  chef:       { combatDmgWeapon: [9, 18],  combatDmgUnarmed: [4, 8],  combatAcc: 0.62, fleeBase: 0.62 },
};

const STARTER_BASE = ['water_bottle']; // CharCreate.js:614 _getStarterItems

export function buildCharacterConfig(charId) {
  const ch = CHARACTERS.find(c => c.id === charId);
  if (!ch) throw new Error(`unknown character ${charId}`);

  // characters.js abilities[].effect.startingItems → 시뮬 startInv
  const extraStart = ch.abilities
    ?.flatMap(a => a.effect?.startingItems ?? []) ?? [];
  const startInv = {};
  for (const id of [...STARTER_BASE, ...extraStart]) {
    startInv[id] = (startInv[id] ?? 0) + 1;
  }

  // stamina ≈ endurance × 1.7 (characters.js 주석 기반)
  // TODO: 게임의 정식 변환 공식 식별 후 import
  const stamina = Math.round(ch.endurance * 1.7);

  return {
    id: ch.id,
    name: ch.name,
    icon: ch.portrait,
    maxHp: ch.maxHp,
    stamina,
    morale: 60,            // 게임 기본값 (CharCreate.js:302 morale.current = 70 — 검증 필요)
    fatigue: 10,           // 게임 기본값
    startDistrict: ch.homeDist,
    startInv,
    skills: { ...ch.startingSkills },
    abilities: ch.abilities,
    ...SIM_COMBAT_DEFAULTS[charId],
  };
}

export function listCharacterIds() {
  return CHARACTERS.map(c => c.id);
}
```

### 4.1 chef 시작 인벤토리 (검토 N1 후속)

`characters.js`의 chef abilities (`gourmet_sense`, `ingredient_eye`, `warm_meal`, `knife_mastery`) 4개 모두 `effect.startingItems` 키 없음. `_getStarterItems()` = `['water_bottle']`. **chef 시작 인벤토리 = 물병 1개만.**

이는 다른 6직업과 비대칭. 다음 옵션 중 PD 결정.
- (a) 게임 현행 그대로(`water_bottle` 1개). chef 생존율 K1 매우 낮을 것 — baseline 결과로 게임 변경 트리거.
- (b) chef abilities에 `startingItems: ['canned_food', 'knife']` 등 추가 PR. 시나리오·설정 합동.

권고: **(a) 채택.** baseline 측정이 (b) 결정의 근거. chef K1이 다른 직업 대비 -10%p 초과면 (b) 후속 PR.

### 4.2 단위 검사 (필수)

`tests/characterAdapter.test.mjs` — 7직업 모두에 대해 다음 검증:
- `buildCharacterConfig(id)` 반환 객체의 `maxHp`가 `characters.js[id].maxHp`와 일치.
- `startDistrict`가 `districts.js`에 존재 (검토 V2 보완).
- skills 객체 키가 `skillDefs.js`의 정식 12 스킬에 포함.

---

## 5. 엔진 chain 모델 (검토 S1·B2 보완)

`statTick`은 이제 chain entry. 합성은 명시적 단계.

```
statTick(gs, dtTP, ctx)
  ↓ base decay (BALANCE.stats)
season.adjust(gs, dtTP, season)            ← 시즌별 hydrationMult / nutDecayMult
  ↓
night.adjust(gs, dtTP, isNight, hasLight)  ← BALANCE.night.* 적용
  ↓
contamination.adjust(gs, dtTP, sources)    ← 오염 자원 섭취 페널티
  ↓
disease.adjust(gs, dtTP, exposure)         ← BALANCE.disease.exposureDecayRate
  ↓
return gs (갱신)
```

각 단계는 독립 함수. `statTickChain.test.mjs`에서 단계별 입력→출력 일치 검증.

### 5.1 합성 우선순위 정책
- 시즌은 base decay에 **곱연산**: `hydrationDecay × seasonMult`
- 야간은 추가 **상수 더하기**: `+ BALANCE.night.darkSleepAnxietyGain` (수면 시점만)
- 오염·질병은 **상태 변화** (`gs.contamination` `gs.diseases` 갱신, decay에 영향 없음)

이 합성 순서는 게임의 `StatSystem.tickPlayer()` 분석 후 v2.1에 갱신. 1차에는 명시적 4단계 chain.

### 5.2 합성 단위 검사
`statTickChain.test.mjs` 시나리오:
- 입력: `gs.hydration=288, season='summer'(hydrationMult 1.7), night=false`
- 100 TP 후 예상: `288 - (1.0 × 1.7 × 100) = 288 - 170 = 118`
- 실제 반환값과 일치하면 통과.

### 5.3 eventCalendar — in-memory EventBus

```js
// tools/sim/v2/engines/eventCalendar.mjs
import EventBus from '../../../js/core/EventBus.js';
import HospitalSiegeSystem from '../../../js/systems/HospitalSiegeSystem.js';
import BALANCE from '../../../js/data/gameBalance.js';

export function init(gs, runId) {
  // 게임의 EventBus를 시뮬에서도 그대로 사용 — mock noop 폐기
  HospitalSiegeSystem.init(gs);  // tpAdvance 구독 자동
  EventBus.on('siegeTriggered', (p) => /* 시뮬 trace */);
  EventBus.on('hospitalRewards', (p) => /* trace */);
}

export function tickTP(gs, tp) {
  EventBus.emit('tpAdvance', { gs, tp });

  // raid·horde·raider는 NoiseSystem 통합 진입점 (SYS_REVIEW_event_polling_audit § 3.1)
  // 단순 함수 호출 또는 별도 module로 처리
  // ...
}
```

---

## 6. 리포터 (KPI) — `reachableContent` 표본 보강 (검토 B3)

기본 baseline은 직업당 100회 (700회 합산). 단 `reachableContent`는 표본 부족 — 발견 빈도 0.05 미만 콘텐츠는 0~5건 잡힘.

**보완:** `reachableContent` 측정만 별도 차수로 직업당 200회 (1400회 합산) 또는 단일 직업(예: scavenging 4 homeless) 500회 집중. 본 baseline 결과 도착 후 PD 결정.

| 리포터 | 출력 | 표본 | KPI |
|--------|------|------|-----|
| survivalRate.mjs | 직업별 K1 % + 신뢰구간 | 100회 | K1 |
| deathDay.mjs | 평균/중앙값 사망일 + 사망 원인 분포 | 100회 | K3, K5 |
| reachableContent.mjs | legendary·secretEnemy·secretCombo 도달 비율 | **별도 차수 결정 (200~500회)** | (신규) |
| moraleDespair.mjs | despair 진입 비율 | 100회 | K6 |
| eventOverlap.mjs | E1~E5 이벤트 카테고리 카운트 (카드 의미 측정 X — 검토 D2) | 100회 | E1~E5 |
| resourceOverTime.mjs | day 30/60/90 자원 분포 | 100회 | K7 |

---

## 7. drift detection — 기준 재정의 (검토 B2)

### 7.1 미사용 BALANCE/CHARACTERS 키 검출
v1 그대로. Proxy + dynamic import 호환성은 Phase 0 spike에서 검증.

### 7.2 시스템 파일 mtime 감시
v1 그대로.

### 7.3 v1↔v2 결과 비교 — **격차는 alarm 아님**

v1은 `hydration 1.5` (구버전), v2는 `1.0` (현행). v2가 더 부드러워야 정상.

| 검사 항목 | 통과 조건 |
|-----------|-----------|
| **격차 방향** | v2 K1 > v1 K1 (firefighter 기준 13.3%보다 높음) |
| **격차 크기** | v2 - v1 ≤ +10%p (그 이상이면 다른 변경분 추가 영향 의심) |
| **이벤트 발화 회수** | v2가 hospitalSiege 발화를 100회 중 60회 이상 잡음 (v1은 0회) |
| **chef 측정** | v2에서 chef 100회 측정 가능 (v1은 0회) |

격차의 **방향과 크기가 위 모형에 일치하면 v2 정상**. 일치 안 하면 v2 모델링 결함.

### 7.4 balanceFingerprint 정의 (검토 B4)

```js
// 정렬된 BALANCE 객체의 결정적 JSON 직렬화
function balanceFingerprint(BALANCE) {
  const sorted = JSON.stringify(BALANCE, Object.keys(BALANCE).sort());
  return crypto.createHash('sha256').update(sorted).digest('hex');
}
```

파일 내용 sha256 폐기. 정렬된 객체 직렬화의 sha256.

---

## 8. 마이그레이션 (수정된 일정 — 검토 P1·S4 보완)

### Phase 0: spike (M1 D+0 ~ D+1) — **신설**
- drift Proxy 호환성 검증 (BALANCE/CHARACTERS Proxy wrapping이 ESM dynamic import에서 동작하는가)
- in-memory EventBus 시뮬에서 게임 EventBus 직접 사용 시 부작용 검증 (`HospitalSiegeSystem.init` 호출 시 시뮬 종료 후 cleanup 가능한가)
- 산출: `SYS_SPIKE_sim_v2_phase0.md` (1~2 결정 보고)

### Phase 1: 인프라 + 4직업 (D+2 ~ D+5)
- `tools/sim/v2/` 디렉터리 + index.mjs + runner.mjs + gameStateFactory.mjs + characterAdapter.mjs
- mocks: renderer·i18n·sound (EventBus 제외)
- engines: statTick + season + night (chain 3단계만)
- characters: 7직업 모두 (characterAdapter 한 번에 모든 직업)
- reporters: survivalRate + deathDay
- 단위 검사: statTickChain·characterAdapter·startDistrict
- **산출물 마커:** `INCOMPLETE — phase 1 only, baseline 라벨 부여 금지`

### Phase 2: 엔진 + 리포터 확장 (D+6 ~ D+10)
- engines: contamination + disease + eventCalendar(in-memory bus) + moraleTier + quality + companion + fishing + noise + guard + medical + doctorPrivilege (11개)
- reporters: reachableContent + moraleDespair + eventOverlap + resourceOverTime
- drift.mjs (Phase 0 결과 기반)

### Phase 3: baseline 측정 (D+11 ~ D+12)
- 7직업 × 100회 실행
- v1↔v2 격차를 § 7.3 모형 기준으로 검증
- 결과를 `BAL_SIM_baseline_v1.md` § 6 표에 채움

### Phase 4: v1 폐기 (M2)
- v1 시뮬 7건 → `testdata/legacy/`로 이동

---

## 9. 단위 검사 (필수) — PR2로 이관 (검토 S4)

| 검사 | 보장 | 포함 PR |
|------|------|---------|
| `statTickChain.test.mjs` | 100 TP × season summer hydrationMult 1.7 후 hydration 손실 정확 | PR2 |
| `characterAdapter.test.mjs` | 7직업 모두 maxHp·startDistrict·skills가 characters.js와 일치 | PR2 |
| `startDistrict.test.mjs` | 7직업 startDistrict가 districts.js에 존재 | PR2 |
| `moraleTier.test.mjs` | morale 0~14 진입 시 tier === 'despair' + blockExplore === true | PR4 |
| `eventCalendar.test.mjs` | hospitalSiege 발화 후 3일 내 hordeWaves 발화 0건 (in-memory bus 통과) | PR4 |
| `quality.test.mjs` | qualityScore 1.20에서 masterwork 결정 | PR4 |
| `fishing.test.mjs` | skill 0 + 기본 미끼 + 기본 낚싯대 → 어획 확률 = 0.30 | PR4 |
| `companion.test.mjs` | nurse stance support 발화 시 모든 아군 +12 HP | PR4 |
| `drift.test.mjs` | 의도적 미사용 키 1건 추가 시 경고 발생 | PR5 |

---

## 10. 출력 스키마 — `endingCategory` + INCOMPLETE 마커 (검토 N3·P3)

```json
{
  "schemaVersion": 2,
  "buildTag": "sim-baseline-v1",
  "phase": "complete",
  "incompleteMarker": null,
  "balanceFingerprint": "sha256:...",
  "characters": ["doctor", "soldier", "firefighter", "homeless", "chef", "engineer", "pharmacist"],
  "runs": [
    {
      "runId": 0,
      "character": "chef",
      "seed": 1,
      "alive": false,
      "endingCategory": "death",
      "endingId": "death_dehydration",
      "deathDay": 12,
      "events": [
        { "tp": 720, "type": "hospitalSiege", "result": "victory" }
      ],
      "moraleTierTrace": [
        { "fromTP": 0, "toTP": 720, "tier": "normal" },
        { "fromTP": 720, "toTP": 864, "tier": "despair", "blockExploreCount": 8 }
      ],
      "kpi": {
        "survivedDays": 12,
        "totalKills": 2,
        "legendaryReached": [],
        "secretEnemyKilled": []
      }
    },
    {
      "runId": 1,
      "character": "doctor",
      "seed": 1,
      "alive": true,
      "endingCategory": null,
      "endingId": null,
      "survivedTo": 100,
      "events": [],
      "kpi": { "survivedDays": 100, "totalKills": 18 }
    }
  ],
  "drift": { "balanceKeysUsed": 87, "balanceKeysUnused": [] }
}
```

`endingCategory`: `'death' | 'milestone' | 'escape' | 'character' | null`. null은 100일 도달했지만 엔딩 트리거 미충족.

Phase 1 산출물에는 `"phase": "incomplete"` + `"incompleteMarker": "Phase 1 only - quality/companion/fishing/etc not modeled. Do NOT use as baseline."`

---

## 11. 위임 / 후속

| 작업 | 담당 |
|------|------|
| Phase 0 spike (Proxy + EventBus 결정) | 시스템 백승호 (D+0~D+1) |
| chef startingItems 결정 (a 또는 b) | 시나리오 한도연 + 설정 이수정 |
| LORE_GLOSSARY v0.2 (캐릭터 이름 7명) | 설정 이수정 (D+1까지) |
| 카드 표현 일관성 (이벤트 카테고리 카운트만 시뮬 측정. 카드 시각·의미 태그는 AD 트랙 별도) | Director 서민호 → AD 정해린 |
| reachableContent 표본 차수 결정 | 밸런스 권지나 (Phase 3 결과 보고) |
| chef 메인 퀘스트 trace 모델링 (시뮬 v2 범위 외 / Phase 4 신설 / questSystem 엔진 추가) | 시나리오 한도연 (Phase 3 후) |

---

## 12. 위험 (Risk) — 갱신

- **R1.** Phase 0 spike에서 Proxy·EventBus 결정 못 내리면 Phase 1 진입 지연.
- **R2.** Phase 1 산출물의 INCOMPLETE 마커가 무시되고 baseline으로 인용되는 운영 사고 — README와 PR 머지 메시지에 마커 강조.
- **R3.** chef 시작 인벤토리 (water_bottle 1개)로 chef K1이 통계적으로 의미 있는 표본 미달 (예: 100회 중 95회 day 5 이내 사망) — baseline에서 chef만 200회 추가 측정 검토.
- **R4.** EventBus 직접 사용 시 시뮬 회차 사이 cleanup 누락으로 누수 발생 — Phase 0 spike에서 검증.
- **R5.** characterAdapter.mjs의 stamina 변환 공식(`endurance × 1.7`)이 추정값. 게임의 정식 변환 공식 식별 못하면 K1 격차의 일부 원인 미상으로 남음.
- **R6.** `CharCreate.js:296` 라인 `gs.stats.hydration.decayPerTP = 2.0` 하드코딩이 BALANCE 1.0과 어긋남 — **시뮬 v2 범위 밖 게임 측 결함**, 별도 PD P0 보고 (본 v2 보완판 §13 참조).

---

## 13. 즉시 산출물 (PR 단위) — 분할 (검토 P1)

| PR | 영역 | 데드라인 |
|----|------|----------|
| **Phase 0 spike** | drift Proxy + EventBus 검증 보고 (`SYS_SPIKE_sim_v2_phase0.md`) | M1 D+1 |
| PR1 | tools/sim/v2/ 디렉터리 + index.mjs + runner.mjs + gameStateFactory.mjs + mocks (renderer·i18n·sound) + characterAdapter.mjs | D+3 |
| PR2 | engines: statTick + season + night chain + 단위 검사 statTickChain·characterAdapter·startDistrict | D+5 |
| PR3 | reporters survivalRate·deathDay + 7직업 baseline 첫 회차 (Phase 1 INCOMPLETE 마커) | D+6 |
| PR4a | engines: contamination·disease·eventCalendar·moraleTier·quality·companion (6) + 단위 검사 5건 | D+8 |
| PR4b | engines: fishing·noise·guard·medical·doctorPrivilege (5) + reporters 4건 + drift.mjs + 단위 검사 drift | D+10 |
| PR5 | baseline 700회 실행 + JSON 보고 + § 7.3 모형 기준 v1↔v2 검증 | D+12 |

---

## 14. 별도 보고 — 게임 측 결함 (시뮬 v2 범위 밖)

`CharCreate.js:296~298` 라인:
```js
gs.stats.hydration.decayPerTP   = 2.0;
gs.stats.nutrition.decayPerTP   = 0.5;
gs.stats.fatigue.decayPerTP     = 0.8;
```

**결함:** hydration decay가 캐릭터 생성 시점에 **하드코딩 2.0으로 리셋**. 그러나 `gameBalance.js`는 `hydrationDecayPerTP: 1.0` (히스토리 2.0 → 1.5 → 1.0). 즉 **게임 시작 시점의 hydration decay는 BALANCE가 아니라 옛 값 2.0이 적용된다.**

게임 런타임 중에 어딘가가 BALANCE.stats.hydrationDecayPerTP로 다시 갱신하는지 추가 검증 필요. 만약 안 한다면 게임 자체가 hydration 1.0 환경이 아니라 2.0 환경에서 돌고 있음.

**분류:** P0 의심. 시스템 백승호 별도 PR 후속(`SYS_REVIEW_charcreate_decay_hardcode.md`). 시뮬 v2 보완과 분리 진행.

---

*문서 끝. PD 김재훈 재검토 게이트 대기. 통과 시 Phase 0 spike 즉시 진입.*
