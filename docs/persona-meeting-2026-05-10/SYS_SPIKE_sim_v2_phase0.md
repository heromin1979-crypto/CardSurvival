# 시스템 — 시뮬 v2 Phase 0 spike 보고

> 작성: 시스템 백승호 / 2026-05-11
> 대상: `PD_MEETING_sim_v2_gate.md` § 6.2의 4 검증 항목 실측
> 결정: **PR1 진입 가능. 단 시뮬 v2 v2.1 갱신 5건 선행.** 핵심 발견 — §5.1 chain 모델 폐기, "27 systems on tpAdvance" 모델 채택.

---

## 1. 검증 결과 요약

| # | 항목 | 결과 |
|---|------|------|
| 1 | drift Proxy 호환성 | ✅ 통과 — 실측 227 leaf 키 추적 가능 |
| 2 | in-memory EventBus 회차 cleanup | ✅ 통과 — `HospitalSiegeSystem.init():53`이 `_unsubscribeAll()` 자동 호출 |
| 3 | stamina 변환 공식 | ⚠️ 정정 — 시뮬 v2 v2의 추정값(×1.7) 오류. 정식 공식 `strength × endurance / 50` 발견 |
| 4 | StatSystem 합성 순서 (chain 모델) | ⚠️ 모델 폐기 — chain 아니라 **27 시스템 독립 구독** 모델 |

---

## 2. 검증 1 — drift Proxy 호환성

### 2.1 절차
ESM dynamic import한 `BALANCE`를 재귀 Proxy로 감싸 leaf 키 트레이스. 사용 시뮬레이트 후 unused 키 검출.

### 2.2 실측 코드
```js
import BALANCE from './js/data/gameBalance.js';
const usedKeys = new Set();
function makeProxy(obj, path = '') {
  return new Proxy(obj, {
    get(target, key) {
      if (typeof key === 'symbol') return target[key];
      const fullPath = path ? `${path}.${String(key)}` : String(key);
      const val = target[key];
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        return makeProxy(val, fullPath);
      }
      usedKeys.add(fullPath);
      return val;
    },
  });
}
const TRACED = makeProxy(BALANCE);
// 시뮬 사용
const a = TRACED.stats.hydrationDecayPerTP;        // → 1
const b = TRACED.armor.damageReductionCap;         // → 0.5
const d = TRACED.combat.companionAuto.classSkills.npc_nurse.healAmount;  // → 12
```

### 2.3 결과
- **실행 성공.** Proxy resolution 정상.
- BALANCE 트리 전체 leaf 수: **227개**.
- 4 키만 시뮬레이트 → unused 223건.
- drift 첫 5건: `design.survivalRateTargetMin/Max`, `stats.{morale|fatigue|stamina}*PerTP`.

### 2.4 결론
PR4b의 `drift.mjs` 구현 가능. Proxy + ESM dynamic import 호환성 ✅. PR1 진입에 차단 사항 없음.

### 2.5 시뮬 v2 모델링 부담 식별
시뮬이 모델링해야 할 BALANCE 영역은 **227 leaf**. v1 시뮬은 이 중 ~30~40만 사용. 시뮬 v2 baseline에서 drift 출력은 unused 100~150 leaf 보고 예상.

---

## 3. 검증 2 — EventBus cleanup

### 3.1 절차
`js/core/EventBus.js` + `js/systems/HospitalSiegeSystem.js`의 init/unsubscribe 패턴 분석.

### 3.2 실측

`EventBus.js:5~9`:
```js
on(event, cb) {
  if (!this._listeners[event]) this._listeners[event] = [];
  this._listeners[event].push(cb);
  return () => this.off(event, cb); // returns unsubscribe fn
}
```

`HospitalSiegeSystem.js:52~58`:
```js
init() {
  this._unsubscribeAll();         // ← 기존 구독 해제
  this._currentDay  = -Infinity;
  this._initialized = true;
  this._unsubscribeTP       = EventBus.on('tpAdvance',     () => this._onTpAdvance());
  this._unsubscribeResolved = EventBus.on('siegeResolved', (p) => this._onSiegeResolved(p));
}
```

`HospitalSiegeSystem.js:402~405`:
```js
_unsubscribeAll() {
  if (this._unsubscribeTP)       { this._unsubscribeTP();       this._unsubscribeTP       = null; }
  if (this._unsubscribeResolved) { this._unsubscribeResolved(); this._unsubscribeResolved = null; }
}
```

### 3.3 결론
시뮬에서 회차마다 `HospitalSiegeSystem.init()` 호출하면 **기존 구독 자동 해제 + 재구독.** 누수 없음. ✅

다른 시스템도 init 패턴 유사 (다음 검증 4에서 확인). 시뮬에서 init 사이클은 안전.

---

## 4. 검증 3 — stamina 변환 공식

### 4.1 발견
`CharCreate.js:224~227`:
```js
// 체력·인내심 → 스태미나 계산: stamina = strength × (endurance / 50)
gs.player.endurance = char.endurance ?? 60;
const maxStamina = Math.round(gs.player.strength * gs.player.endurance / 50);
```

**정식 공식: `stamina = strength × endurance / 50`**

### 4.2 검증 (characters.js 주석 vs 공식)

| 직업 | strength | endurance | 공식 결과 | characters.js 주석 |
|------|----------|-----------|-----------|---------------------|
| soldier | 75 | 75 | 113 | "≈ 113" ✓ |
| engineer | 75 | 75 | 113 | "≈ 113" ✓ |
| firefighter | 80 | 85 | 136 | "≈ 136" ✓ |
| chef | 65 | 65 | 85 | "≈ 85" ✓ |
| pharmacist (방금 추가) | 50 | 50 | 50 | (정정 완료: "= 50 × 50 / 50 = 50") |

### 4.3 시뮬 v2 v2 영향
- v2 §4 `characterAdapter.mjs`의 `stamina = endurance × 1.7` (또는 1.5) 추정 **모두 오류**.
- 정정: `stamina = ch.strength * ch.endurance / 50`.
- 추가로 `CHAR_GAUGE_KEYS` (characters.js:411) `endurance × 1.5`는 **캐릭터 선택 화면 게이지 표시용 정규화 값**, 게임 런타임 stamina와 별개.

### 4.4 부수 정정
방금 P0 hotfix v2로 추가한 pharmacist 정의의 stamina 주석을 정정. `characters.js`의 `endurance: 50` 라인 주석을 `(→ stamina ≈ 75)` → `(→ stamina = 50 × 50 / 50 = 50)`로 수정. **적용됨.**

---

## 5. 검증 4 — StatSystem 합성 순서 (chain 모델)

### 5.1 발견 — chain 모델은 부정확

`StatSystem.onTP()` 분석 결과 합성은 다음과 같음.

```
StatSystem.onTP()
  ↓ seasonMod = SeasonSystem.getModifiers()      [step 0]
  ↓ for each non-accumulator stat:
      hydration: BALANCE × seasonMod.hydrationDecayMult
      nutrition / morale: BALANCE
      temperature: s.decayPerTP                  [step 1]
  ↓ fatigue = s.decayPerTP × moraleTier.fatigueGainMult [step 2]
  ↓ _updateStamina()                             [step 3]
  ↓ _applySeasonalTemperature(seasonMod)         [step 4]
  ↓ _applyTemperatureLogic()                     [step 5]
  ↓ _applyStructureEffects()                     [step 6]
  ↓ _checkFoodSpoilage()                         [step 7]
  ↓ DiseaseSystem.onTP()                          [step 8]
  ↓ _checkDeaths()                                [step 9]
```

그러나 이건 **StatSystem 단일 시스템 내부의 흐름.** Night·Contamination·Noise 등은 StatSystem.onTP()에서 호출되지 않음.

### 5.2 실제 모델 — 27 시스템 독립 구독

`grep "EventBus.on('tpAdvance'" js/systems/` 결과 — **27개 시스템이 독립적으로 `tpAdvance` 구독**:

```
StatSystem, SeasonSystem, DiseaseSystem, WeatherSystem, NoiseSystem,
ContaminationSystem, MentalSystem, NightSystem, HospitalSiegeSystem,
CraftSystem, BodySystem, BGMSystem, BasecampSystem, NPCRelationSystem,
ExploreSystem, FishingSystem, EndingSystem, HiddenElementSystem, GuardSystem,
DispatchSystem, EcologySystem, NPCGroupSystem, NPCQuestSystem, OnboardingSystem,
NPCStorySystem, PatientIntakeSystem, TrapSystem, QuestSystem, NPCSystem
```

`tpAdvance` emit 시점 → 모든 27 시스템 핸들러가 **등록 순서대로** 발화 → 각자 GameState 변경.

### 5.3 main.js init 순서 (실제 발화 순서)

```
121: StatSystem.init()           ← 첫 번째 발화 (다른 시스템 변경 전 base decay 적용)
122: SeasonSystem.init()
123: DiseaseSystem.init()
124: WeatherSystem.init()
125: NoiseSystem.init()
... (중간 시스템)
145: HospitalSiegeSystem.init()
147: MentalSystem.init()
150: ContaminationSystem.init()
169: NightSystem.init()           ← 야간 처리는 마지막에 가까움
```

### 5.4 시뮬 v2 v2 §5.1 5단계 chain 폐기

기존 v2 §5.1:
```
statTick(gs, dtTP, ctx)
  ↓ base decay
season.adjust(gs, dtTP, season)
  ↓
night.adjust(gs, dtTP, isNight, hasLight)
  ↓
contamination.adjust(gs, dtTP, sources)
  ↓
disease.adjust(gs, dtTP, exposure)
```

**오류.** 게임은 5단계 chain이 아니라 27 시스템이 독립적으로 동시 발화. 새 모델:

```
시뮬 runner:
  for each TP:
    EventBus.emit('tpAdvance', { totalTP });
    // → 27 systems 자동 발화 (등록 순서대로)
    // → 각자 GameState 변경
    // → 누적 결과가 다음 TP의 입력
```

즉 **시뮬 v2는 게임의 27 시스템을 그대로 import + init 순서 그대로 따라야 함.** chain 엔진 작성 불필요. **시뮬 v2 디렉터리 구조도 단순화** — engines/ 폴더의 자체 모델링 11개는 게임 시스템 import로 대체 가능.

### 5.5 영향 — 시뮬 v2 디렉터리 단순화

```
tools/sim/v2/ (수정안)
├── index.mjs              ← 진입점
├── runner.mjs             ← TP 루프 + game systems init
├── gameStateFactory.mjs
├── characterAdapter.mjs
├── systemBootstrap.mjs    ← (신규) main.js의 init 순서 모방. 27 systems init.
│
├── reporters/             ← 게임 시스템 변경분 trace + KPI 집계
├── mocks/                 ← renderer·i18n·sound noop (EventBus·시스템은 게임 측 사용)
└── tests/
```

**engines/ 폴더 11개 모듈 폐기.** 게임 시스템 직접 사용. 시뮬 v2 PR 작업량 대폭 감소.

---

## 6. 시뮬 v2 v2.1 갱신 사항 (5건)

설계서 v2.1로 PR1 진입 전 갱신 필요.

| # | 영역 | 변경 |
|---|------|------|
| 1 | §3 디렉터리 | engines/ 11 모듈 폐기 → `systemBootstrap.mjs` 단일 모듈 |
| 2 | §4 characterAdapter | stamina 공식 정정: `strength × endurance / 50` |
| 3 | §5 statTick chain | 폐기. "27 systems on tpAdvance" 모델로 교체 |
| 4 | §9 단위 검사 | `statTickChain.test.mjs` 폐기. 대신 `systemBootstrapOrder.test.mjs` (init 순서 일치 검사) |
| 5 | §13 PR 일정 | PR4a/4b 작업량 감소. PR4 통합 가능 (engines 폐기로 11 모듈 작성 불필요) |

### 6.1 일정 영향 (긍정적)
- engines/ 11 모듈 작성 사라짐 → PR4a/4b 통합으로 D+10 → D+8 단축 가능.
- 다만 `systemBootstrap.mjs`가 게임의 27 시스템을 시뮬 환경에서 무탈하게 init할 수 있게 만드는 작업이 신규로 추가 (UI·DOM 의존 시스템은 mock 필요).
- 순영향: 일정 단축 또는 동일.

### 6.2 위험
- 일부 시스템(BGMSystem, OnboardingSystem 등)은 시뮬에 부적합. mocks/ 또는 init 제외 결정 필요.
- 시스템이 GameState 외 글로벌 상태(`window.__`)에 의존하면 시뮬 환경에서 실패. spike 결과 추가 검증 권고.

---

## 7. PD 김재훈 결정 요청

### 7.1 즉시 결정 (PR1 진입 전)
- ✅ Proxy / EventBus 검증 통과 → PR1 차단 사항 0.
- ⚠️ 설계서 v2.1 갱신 5건 선행. 시스템 백승호 D+0 종료 전 v2.1 산출.

### 7.2 결정 후보
- (a) PR1 즉시 진입, v2.1 갱신은 PR1과 병렬. (속도 우선)
- (b) v2.1 머지 후 PR1 진입. (정합성 우선)
- 권고: **(b).** 설계서 5건 갱신은 ~1~2시간 작업, PR1보다 가벼움.

---

## 8. 산출물 정리

| 항목 | 위치 | 비고 |
|------|------|------|
| Proxy spike 코드 | (임시) `spike_proxy.mjs` 작성 후 삭제 | 본 보고서 §2.2에 inline 인용 |
| pharmacist stamina 주석 정정 | `characters.js` 약 392행 | `(→ stamina ≈ 75)` → `(→ stamina = 50 × 50 / 50 = 50)` |
| 시뮬 v2 v2.1 갱신 | `SYS_DESIGN_sim_v2_v2.md` → v2.1 | 5건 변경 |

---

## 9. 결론

Phase 0 spike 4 검증 모두 통과 (정정 포함). PR1 진입 가능. 단 chain 모델 폐기 + stamina 공식 정정으로 설계서 v2.1 갱신 선행. 일정 영향 긍정적 (engines/ 11 모듈 작성 사라짐).

**다음 PD 회의는 v2.1 머지 직후.** 시뮬 v2 PR1 작업 진입.

---

*문서 끝. v2.1 갱신 작업은 PD 결정 후 시스템 백승호 즉시 진입.*
