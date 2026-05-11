# 시스템 — 시뮬레이션 v2 인프라 재설계서 (v2.1)

> 작성: 시스템 백승호 / 2026-05-11
> 대상: `tools/sim/v2/` 시뮬 인프라
> 버전: v2.1 — Phase 0 spike 결과 (`SYS_SPIKE_sim_v2_phase0.md`) 5건 반영
> 결정: PD 김재훈 게이트 통과 시 PR1 진입.
> 선행: v2 (`SYS_DESIGN_sim_v2_v2.md`)

---

## 0. v2 → v2.1 변경 요약 (Phase 0 spike 결과)

| 영역 | v2 | v2.1 (변경) |
|------|----|-----|
| §3 디렉터리 | engines/ 11 모듈 (자체 모델링) | **engines/ 폐기. `systemBootstrap.mjs` 단일 모듈로 게임 27 시스템 init** |
| §4 stamina 공식 | `endurance × 1.7` 추정 | **`strength × endurance / 50`** (`CharCreate.js:227` 정식 공식) |
| §5 엔진 chain | base→season→night→contamination→disease 5단계 | **chain 폐기. "27 systems on tpAdvance" multicast 모델** |
| §9 단위 검사 | `statTickChain.test` | **`systemBootstrapOrder.test`로 교체** |
| §13 PR 일정 | PR4a + PR4b (D+10) | **PR4 통합 (D+8). 일정 단축** |

핵심: 게임은 chain 아니라 multicast (27 시스템 독립 구독). 시뮬 v2가 자체 엔진 11개 작성 불필요. 게임 시스템을 그대로 import.

---

## 1. 문제 정의 (Why v2)

`SIM_AUDIT_v1.md`·`REVIEW_sim_v2_v1.md`·`SYS_SPIKE_sim_v2_phase0.md` 결과:
- v1 시뮬은 게임 코드 import 0건. 자체 하드코딩 모델.
- chef 누락 + ~12 영역 미반영.
- v2 설계 검토에서 characters.js 단일 진리 위반·EventBus mock noop 위험·chain 모델 부정확 등 발견.
- spike 결과: chain 모델은 게임 현실과 다름. **27 시스템이 동일 `tpAdvance` 채널 독립 구독.**

→ 시뮬 v2.1은 게임 시스템을 **그대로 import + init 순서 그대로 따름**. 자체 엔진 모델링 폐기.

---

## 2. 설계 원칙 (8 원칙)

1. **단일 진리 직접 import.** `gameBalance.js` + `characters.js` + `districts.js` + `js/core/EventBus.js` + `js/systems/*.js`.
2. **게임 시스템 직접 사용.** statTick·season·night 등 자체 엔진 작성 금지. 게임의 27 시스템을 시뮬 환경에서 init.
3. **GameState 호환.** `js/core/GameState.js` 스키마 기반.
4. **시드 고정 결정성.** `Math.random` 직접 사용 금지. `Random(seed)` 인스턴스 경유.
5. **EventBus 직접 사용.** mock 아님. 회차 사이 cleanup은 각 시스템의 init이 자동(`HospitalSiegeSystem.init():53` 패턴 검증 완료).
6. **외부 효과 mock 최소화.** renderer·i18n·sound·DOM noop. UI·BGM 의존 시스템은 init 제외 또는 mock.
7. **회귀 가능 JSON 출력.** 동일 시드 + 동일 BALANCE → 동일 JSON.
8. **drift detection 의무.** Proxy로 BALANCE 키 사용 추적, 미사용 키 경고. spike 검증 완료(227 leaf 트레이스 가능).

---

## 3. 아키텍처 (단순화)

```
tools/sim/v2/
├── index.mjs              ← 진입점 (CLI 인자, 시드 풀, 결과 집계)
├── runner.mjs             ← 단일 회차 실행 루프 (TP 단위, EventBus emit)
├── gameStateFactory.mjs   ← 시뮬용 GameState 초기화
├── characterAdapter.mjs   ← characters.js → 시뮬 character config 변환 (stamina 공식 정정)
├── systemBootstrap.mjs    ← 게임 27 시스템 init. main.js init 순서 모방. UI 의존 시스템 mock/제외
│
├── reporters/             ← KPI 집계. 게임 시스템 변경분 trace
│   ├── survivalRate.mjs
│   ├── deathDay.mjs
│   ├── reachableContent.mjs
│   ├── moraleDespair.mjs
│   ├── eventOverlap.mjs   ← 이벤트 카테고리 카운트만 (카드 의미는 AD 별도)
│   └── resourceOverTime.mjs
│
├── mocks/                 ← UI·외부 효과
│   ├── renderer.mjs       ← noop
│   ├── i18n.mjs           ← 영문 키 그대로
│   ├── sound.mjs          ← noop
│   └── globalShim.mjs     ← window.* 등 게임 측 글로벌 의존 보정
│
├── tests/
│   ├── characterAdapter.test.mjs    ← 7직업 maxHp·startDistrict·skills 일치
│   ├── startDistrict.test.mjs       ← districts.js 존재 검증
│   ├── systemBootstrapOrder.test.mjs← (신규) main.js init 순서와 시뮬 init 순서 일치
│   ├── eventBusCleanup.test.mjs     ← 회차 사이 누수 0
│   ├── driftDetection.test.mjs      ← 미사용 키 정확 검출
│   └── seedDeterminism.test.mjs     ← 동일 시드 → 동일 결과
│
└── drift.mjs              ← BALANCE/CHARACTERS 키 사용 추적 (Proxy 기반, spike 검증 완료)
```

**v2 대비 변경:**
- `engines/` 11 모듈 폐기 → `systemBootstrap.mjs` 단일 모듈로 흡수.
- `mocks/eventBus.mjs` 폐기 (게임 EventBus 직접 사용) + `mocks/globalShim.mjs` 신설.
- `tests/`에 `systemBootstrapOrder` 신설, `statTickChain` 폐기.

---

## 4. characterAdapter.mjs — stamina 공식 정정

```js
// tools/sim/v2/characterAdapter.mjs
import CHARACTERS from '../../js/data/characters.js';

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

  const extraStart = ch.abilities
    ?.flatMap(a => a.effect?.startingItems ?? []) ?? [];
  const startInv = {};
  for (const id of [...STARTER_BASE, ...extraStart]) {
    startInv[id] = (startInv[id] ?? 0) + 1;
  }

  // CharCreate.js:227 정식 공식: stamina = strength × endurance / 50
  // (v2의 endurance × 1.7 추정 정정. spike #3 결과)
  const stamina = Math.round(ch.strength * ch.endurance / 50);

  return {
    id: ch.id,
    name: ch.name,
    icon: ch.portrait,
    maxHp: ch.maxHp,
    stamina,
    morale: 70,            // CharCreate.js:302 morale.current = 70
    fatigue: 10,           // GameState.js:29 기본값
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

검증: 7직업 stamina 결과 (테스트):
- soldier 75×75/50=113 / engineer 75×75/50=113 / firefighter 80×85/50=136
- chef 65×65/50=85 / pharmacist 50×50/50=50 / doctor·homeless TBD (`characters.js` strength·endurance 확인)

---

## 5. systemBootstrap.mjs — 27 시스템 init

게임 `main.js`의 init 순서를 시뮬 환경에서 그대로 따른다.

```js
// tools/sim/v2/systemBootstrap.mjs
// main.js 121~169행 init 순서 그대로
import StatSystem           from '../../js/systems/StatSystem.js';
import SeasonSystem         from '../../js/systems/SeasonSystem.js';
import DiseaseSystem        from '../../js/systems/DiseaseSystem.js';
import WeatherSystem        from '../../js/systems/WeatherSystem.js';
import NoiseSystem          from '../../js/systems/NoiseSystem.js';
import ContaminationSystem  from '../../js/systems/ContaminationSystem.js';
import MentalSystem         from '../../js/systems/MentalSystem.js';
import HospitalSiegeSystem  from '../../js/systems/HospitalSiegeSystem.js';
import NightSystem          from '../../js/systems/NightSystem.js';
// ... 27개 import (UI 의존 시스템 mock 처리 후)

// 시뮬 부적합 시스템 (init 제외 또는 mock)
const SIM_SKIP = new Set([
  'BGMSystem',          // 오디오, 시뮬에 의미 없음
  'SoundSystem',        // 동일
  'OnboardingSystem',   // UI/튜토리얼 전용
  'CinematicScene',     // UI 전용
]);

// 시뮬 부적합 시스템 노이즈로 fail 시 mocks/globalShim 적용
export function bootstrapSystems(gs) {
  // EventBus는 게임 측을 그대로 사용 (`js/core/EventBus.js`)
  // GameState는 gameStateFactory에서 setup 완료 상태로 입력

  // main.js와 동일 순서로 init 호출
  StatSystem.init();
  SeasonSystem.init();
  DiseaseSystem.init();
  WeatherSystem.init();
  NoiseSystem.init();
  // ... (중간 시스템들)
  HospitalSiegeSystem.init();
  MentalSystem.init();
  ContaminationSystem.init();
  NightSystem.init();
  // ... (끝까지)
}

export function teardownSystems() {
  // 회차 사이 cleanup. 각 시스템의 init()이 _unsubscribeAll() 자동 호출
  // → bootstrapSystems()를 다시 호출하면 자동 cleanup
  // 단, _initialized 플래그가 있는 시스템은 별도 reset 호출 필요
  HospitalSiegeSystem._initialized = false;
  // ... (필요한 시스템만)
}
```

### 5.1 init 순서 정합성 검사
`systemBootstrapOrder.test.mjs`가 `main.js`의 init 순서와 본 `bootstrapSystems()`의 호출 순서가 일치하는지 검사. main.js 변경 시 시뮬 v2도 자동 알림.

### 5.2 SIM_SKIP 결정 기준
- UI/오디오 전용 시스템 → SKIP
- DOM·window 의존 시스템 → globalShim 도입 후 init 시도
- 시뮬에서 GameState만 변경하는 시스템 → 정상 init

PR1 진입 시 27 시스템 각각을 분류한 표를 spike 후속으로 작성.

---

## 6. 리포터 (KPI) — 게임 시스템 변경 trace

게임 시스템이 EventBus·GameState 변경을 발신하므로 리포터는 그것을 **수신·집계**.

```js
// tools/sim/v2/reporters/eventOverlap.mjs
import EventBus from '../../../js/core/EventBus.js';

const events = [];

EventBus.on('siegeTriggered', (p) => events.push({ tp: p.tp, type: 'hospitalSiege' }));
EventBus.on('hordeWaveStart', (p) => events.push({ tp: p.tp, type: 'hordeWaves' }));
// ... raidEvents, raiderEvents 동일

export function summarize() {
  // 동일 TP 2+ 트리거 비율 등 KPI 집계
}
```

리포터는 6개 (`SIM_AUDIT_v1.md` § 4 그대로): survivalRate, deathDay, reachableContent, moraleDespair, eventOverlap, resourceOverTime.

---

## 7. drift detection — Proxy 검증 완료

spike 결과로 Proxy + ESM dynamic import 호환성 ✅. v2 §7 그대로 유지.

```js
// tools/sim/v2/drift.mjs
import BALANCE from '../../js/data/gameBalance.js';

const usedKeys = new Set();
function makeProxy(obj, path = '') { /* spike에서 검증된 코드 */ }

export const TRACED_BALANCE = makeProxy(BALANCE);
export function getDriftReport() {
  const all = enumLeaves(BALANCE);
  return {
    used: [...usedKeys].sort(),
    unused: all.filter(p => !usedKeys.has(p)).sort(),
    total: all.length,
  };
}
```

baseline 700회 실행 시 drift report 출력. 미사용 키 5건 이상이면 PR5 게이트 거절.

---

## 8. 마이그레이션 일정 (단축)

### Phase 0 spike (M1 D+0~D+1) — **완료**
산출: `SYS_SPIKE_sim_v2_phase0.md`. 4 검증 통과.

### Phase 1: 인프라 + 7직업 (D+2 ~ D+4)
- `tools/sim/v2/` 디렉터리 + index.mjs + runner.mjs + gameStateFactory.mjs + characterAdapter.mjs (stamina 공식 정정)
- mocks: renderer·i18n·sound·globalShim
- 단위 검사: characterAdapter, startDistrict, seedDeterminism

### Phase 2: systemBootstrap + EventBus + drift (D+5 ~ D+7)
- `systemBootstrap.mjs` — 27 시스템 분류 + init/teardown
- `drift.mjs` — Proxy 기반 BALANCE 트레이스
- 단위 검사: systemBootstrapOrder, eventBusCleanup, driftDetection

### Phase 3: reporters (D+8)
- 6 리포터 모두 작성 (게임 시스템 발신 이벤트 수신 형태)
- Phase 1 산출물 INCOMPLETE 마커 제거 (이 시점부터 baseline 라벨 가능)

### Phase 4: baseline 측정 (D+9 ~ D+10)
- 7직업 × 100회 실행
- v1↔v2 격차를 § 7.3 모형 기준으로 검증
- 결과를 `BAL_SIM_baseline_v1.md` § 6 표에 채움

### Phase 5: v1 폐기 (M2)
- v1 시뮬 7건 → `testdata/legacy/`로 이동

**v2 일정(D+12) 대비 v2.1 일정(D+10) 2일 단축.**

---

## 9. 단위 검사 (필수)

| 검사 | 보장 | PR |
|------|------|----|
| `characterAdapter.test.mjs` | 7직업 maxHp·startDistrict·skills가 characters.js와 일치, stamina = `s × e / 50` | PR1 |
| `startDistrict.test.mjs` | 7직업 startDistrict가 districts.js에 존재 | PR1 |
| `seedDeterminism.test.mjs` | 동일 시드 → 동일 GameState trace | PR1 |
| `systemBootstrapOrder.test.mjs` | (신규) `bootstrapSystems()` 호출 순서가 `main.js` init 순서와 일치 | PR2 |
| `eventBusCleanup.test.mjs` | `bootstrap → teardown → bootstrap` 사이클에서 listener 누수 0 | PR2 |
| `driftDetection.test.mjs` | 의도적 미사용 키 1건 추가 시 경고 발생 | PR2 |

`statTickChain.test.mjs`는 v2의 chain 모델 폐기로 함께 폐기.

---

## 10. 출력 스키마 — v2 그대로

```json
{
  "schemaVersion": 2,
  "buildTag": "sim-baseline-v1",
  "phase": "complete",
  "incompleteMarker": null,
  "balanceFingerprint": "sha256:...",
  "characters": ["doctor", "soldier", "firefighter", "homeless", "chef", "engineer", "pharmacist"],
  "runs": [...],
  "drift": { "balanceKeysUsed": 87, "balanceKeysUnused": [...] }
}
```

`endingCategory`·INCOMPLETE 마커·balanceFingerprint 정의 모두 v2 그대로.

---

## 11. PR 일정 (단축)

| PR | 영역 | 데드라인 |
|----|------|----------|
| PR1 | tools/sim/v2/ 디렉터리 + characterAdapter (stamina 공식 정정) + mocks + 단위 검사 3 | D+4 |
| PR2 | systemBootstrap + drift.mjs + 단위 검사 3 | D+7 |
| PR3 | reporters 6 + Phase 1 INCOMPLETE 마커 제거 | D+8 |
| PR4 | baseline 700회 실행 + JSON 보고 + § 7.3 모형 검증 | D+10 |

**v2의 PR1~5 (D+12) → v2.1 PR1~4 (D+10).** PR4a/4b 통합으로 단순화.

---

## 12. 위임 / 후속

| 작업 | 담당 |
|------|------|
| 27 시스템 SIM_SKIP 분류표 | 시스템 백승호 (PR2 진입 전) |
| chef knife_mastery startingItems PR (`SCN_AUDIT_chef_abilities.md` C1) | 시나리오·설정 합동 (PR1과 병렬) |
| baseline 차수 chef 200회 추가 결정 | 밸런스 권지나 (P0 hotfix v2로 7직업 측정 가능, A5 보류) |
| 카드 표현 일관성 (이벤트 카테고리 카운트만) | Director → AD 별도 트랙 |

---

## 13. 위험 (Risk)

- **R1.** `systemBootstrap.mjs`의 27 시스템 분류에서 잘못 SKIP된 시스템이 있으면 baseline K1 격차 발생. PR2 진입 시 분류표를 SIM_AUDIT_v1.md § 12 영역과 교차 검증.
- **R2.** 게임 시스템이 `window.*`·DOM 의존 시 `globalShim` 보정 필요. 시뮬 환경에서 `window`·`document` 미정의 → globalShim에 stub.
- **R3.** GameState 호환 — `js/core/GameState.js`가 모듈 단일 진리이므로 시뮬도 같은 객체를 변경. 회차 사이 reset 로직이 게임에 있는가? 게임 측은 새 캐릭터 시작 시 `GameState.reset()` 형태로 처리할 듯 (확인 필요). 없으면 시뮬용 reset 헬퍼 신규.
- **R4.** drift detection이 일부 시스템의 `BALANCE.x.y` 분기 접근(예: 조건부 키 사용)에서 false negative 가능. PR2 진입 시 검증.

---

## 14. 결론

Phase 0 spike 결과로 시뮬 v2가 **단순화**됐다. 자체 엔진 11개 작성 폐기 → 게임 시스템 그대로 사용. 일정 D+12 → D+10. 단일 진리·multicast 모델·실측 stamina 공식이 모두 정합.

PD 김재훈 게이트 통과 후 PR1 진입.

---

*문서 끝. 27 시스템 SIM_SKIP 분류표는 PR2 진입 전 별도 산출.*
