# 시스템 — 게임 본체 cooking 자동 추천 검증

> 작성: 시스템 백승호 / 2026-05-11
> 트리거: `PD_BAL_MEETING_PR10_decision.md` §3.5 + §9.2 위임
> 결정: **시나리오 γ 단정. 게임 본체에는 cooking 자동 추천 알고리즘이 존재하지 않는다. player가 blueprint 또는 카드 변환 규칙을 명시적으로 선택한다. PR10(시뮬 측 actCook 산식 보강)은 단일 트랙으로 머지 가능. 단 시뮬 보강 방향은 "이상적 player 행동 모사"이며 본체와의 1:1 정합 PR이 아님 — 본 단정을 PR10 PR body에 명시할 것.**

---

## 1. 서두

### 1.1 검증 의무

`PD_BAL_MEETING_PR10_decision.md` §3.5 위임:
> 1. `js/systems/CraftSystem.js` 자동 추천 알고리즘 존재 여부 grep
> 2. cooking blueprint 우선순위 결정 코드 (있다면 산식 위치·파라미터)
> 3. baseline v5 5직업 startInv 입력으로 게임 본체가 boiled_water/cooked_noodles 어느 쪽 추천하는지 트레이스

협의서 v3 §3.2 시나리오 정의:
- α — 게임 본체 nutrition 우선 (player가 cooked_noodles 선택)
- β — 게임 본체 hydration 우선 또는 무차별 (player가 boiled_water 선택)

본 검증은 위 2개 시나리오 모두 **사실 조건이 성립하지 않음**을 단정한다. 게임 본체에는 player 대신 산출물을 자동 추천·선택하는 알고리즘 자체가 존재하지 않는다.

### 1.2 검증 범위

읽은 파일 (실제):
- `js/systems/CraftSystem.js` (432 lines, 전체)
- `js/systems/CraftDiscovery.js` (157 lines, 전체)
- `js/ui/CraftUI.js` (367 lines, 전체)
- `js/ui/QuickCraftPrompt.js` (133 lines, 전체)
- `js/data/blueprints.js` lines 685~755 (cooking 레시피 영역) + 전체 priority/order/weight 필드 grep
- `js/data/blueprints_advanced.js` + `js/data/hiddenRecipes.js` priority/order/weight 필드 grep
- `js/data/interactions.js` lines 1~200 (T1~T11 변환 규칙) + lines 1610~1634 (findInteraction)
- `js/data/items_base.js` lines 320~460 (boiled_water·cooked_noodles·instant_noodles·contaminated_water 정의)
- `js/data/characters.js` 5직업 startingItems (grep)
- `tools/sim/v2/playerAI.mjs` lines 1~210 (actCook 함수 + 주변 헬퍼)

검증 범위 밖 (read-only 트랙 원칙):
- DragDrop 핸들러 코드 (UI 트리거 영역 — AD 오은별 트랙)
- minigame UI 존재 여부 — grep으로 `minigame|MiniGame|cookUI|CookUI|autoSelect|autoPick` 0 매칭(§2.4 단언)으로 부재 단정

---

## 2. 자동 추천 알고리즘 코드 분석

### 2.1 CraftSystem.startBlueprint 시그니처

`js/systems/CraftSystem.js:85`:
```js
startBlueprint(blueprintId) {
  const bp   = BLUEPRINTS[blueprintId];
  if (!bp) return false;
  const check = this.canStartBlueprint(blueprintId);
  if (!check.ok) { ... return false; }
  ...
}
```

**핵심 사실:** `startBlueprint`는 외부에서 `blueprintId`를 **명시적으로** 전달받는다. 함수 본문 어디에도 "현재 인벤토리·게임 상태를 기반으로 최적 blueprint를 선택"하는 분기가 없다. 함수는 받은 id가 실행 가능한지 검증(`canStartBlueprint`)하고 즉시 진행할 뿐이다.

`canStartBlueprint(blueprintId)` (line 25~58) 또한 단순 검증 함수 — 입력 id의 큐·재료·도구·스킬 가능 여부만 boolean으로 반환. 산출물 비교나 영양가 기준 정렬 없음.

### 2.2 startBlueprint 호출자 전수

grep 결과 — `D:\Projects\CardSurvival\js\` 내 `startBlueprint|canStartBlueprint` 호출처:

| 위치 | 호출 형태 | 입력 결정 주체 |
|------|----------|--------------|
| `js/ui/CraftUI.js:125` | `CraftSystem.startBlueprint(this._selectedBp)` | **player 클릭** (line 105~110: `this._selectedBp = el.dataset.bpId`) |
| `js/ui/QuickCraftPrompt.js:65` | `CraftSystem.startBlueprint(bpId)` | **player 버튼 클릭** (line 62~70: 각 레시피별 별도 버튼) |
| `js/ui/CraftUI.js:173` | `CraftSystem.canStartBlueprint(bp.id)` | UI 표시용 검증만 (실행 안 함) |
| `js/systems/CraftDiscovery.js:119` | 주석 인용(`canStartBlueprint를 직접 쓰면 순환 의존`) | 호출 없음 |

**3개 호출처 어디에도 자동 선택 로직 없음.** 모든 진입점에서 player가 마우스 클릭으로 특정 blueprint id를 명시적으로 선택한다.

### 2.3 CraftUI.\_renderBlueprintList 정렬 산식

`js/ui/CraftUI.js:141~201`. 표시 순서:

```js
const visibleBlueprints = Object.values(ALL_BLUEPRINTS).filter(bp => { ... });
const filteredBlueprints = this._categoryFilter === 'all'
  ? visibleBlueprints
  : visibleBlueprints.filter(bp => bp.category === this._categoryFilter);
```

`Object.values(...)` 결과는 객체 키 삽입 순서. 정렬 키(nutrition·hydration·우선순위)가 **없다.** player에게 보여지는 레시피 목록은 데이터 파일 정의 순서대로 나열될 뿐이다.

### 2.4 minigame·autoSelect 부재 단정

grep 결과 — 패턴 `minigame|MiniGame|cookUI|cookingUI|CookUI|autoSelect|autoPick` 적용 디렉터리 `D:\Projects\CardSurvival\js\`:

```
(No files found)
```

**0 매칭.** cooking 전용 minigame UI도, 자동 산출물 선택 UI도 본체에 존재하지 않는다.

### 2.5 interactions.js 카드 변환 경로 분석

게임 본체에는 blueprint 시스템과 **병행하는 두 번째 cooking 경로**가 존재한다. 카드 위에 카드를 드롭했을 때 즉시 변환되는 `INTERACTION_RULES` (interactions.js).

cooking 관련 변환 규칙 (line 22~148):

| id | source | target | hint | 산출 |
|----|--------|--------|------|------|
| `cook_noodles` (T1, line 23~36) | `instant_noodles` | `campfire` | 라면 조리 → 조리된 라면 | `transformSrc: 'cooked_noodles'` |
| `cook_noodles_rev` (T2, line 39~52) | `campfire` | `instant_noodles` | (역방향) | `transformTgt: 'cooked_noodles'` |
| `cook_rice_transform` (T3, line 55~68) | `rice` | `campfire` | 쌀 조리 → 밥 | `transformSrc: 'cooked_rice'` |
| `cook_rice_rev` (T4) | `campfire` | `rice` | (역방향) | `transformTgt: 'cooked_rice'` |
| `boil_contaminated` (T5, line 87~100) | `contaminated_water` | `campfire` | 오염수 끓이기 | `transformSrc: 'boiled_water'` |
| `boil_contaminated_rev` (T6) | `campfire` | `contaminated_water` | (역방향) | `transformTgt: 'boiled_water'` |
| `boil_rainwater` (T7) | `rainwater` | `campfire` | 빗물 끓이기 | `transformSrc: 'boiled_water'` |
| `boil_rainwater_rev` (T8) | `campfire` | `rainwater` | (역방향) | `transformTgt: 'boiled_water'` |

매칭 함수 (line 1619~1624):
```js
function findInteraction(srcDef, tgtDef) {
  return INTERACTION_RULES.find(rule =>
    _matchesCriteria(srcDef, rule.source) &&
    _matchesCriteria(tgtDef, rule.target)
  ) ?? null;
}
```

`Array.find` — **첫 매칭 규칙 반환.** 우선순위 산식 없음. 입력 카드 쌍이 어떤 규칙에 부합하는지로만 결정된다.

**player 행동 모델:**
1. boiled_water를 만들고 싶으면 `contaminated_water` 카드를 `campfire` 카드 위에 드롭 (T5).
2. cooked_noodles를 만들고 싶으면 `instant_noodles` 카드를 `campfire` 카드 위에 드롭 (T1).
3. 결과물은 player가 드래그한 입력 카드로 *전적으로 결정*된다. 시스템이 "더 영양가 높은 산출물을 자동으로 추천"하지 않는다.

### 2.6 QuickCraftPrompt 산출물 선택 자유도

`js/ui/QuickCraftPrompt.js:18~70`:
```js
const recipes = CraftDiscovery.findRecipes(srcDefId, tgtDefId)
  .filter(r => r.canStartNow);
...
panel.querySelectorAll('.qc-craft-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const bpId = btn.dataset.bpId;
    const success = CraftSystem.startBlueprint(bpId);
    ...
  });
});
```

두 카드 드래그 매칭으로 후보 레시피를 *목록*으로 표시하고, **player가 버튼 클릭으로 선택**. 자동 실행 없음.

`CraftDiscovery.findRecipes` (line 23~67) 정렬:
```js
return matches.sort((a, b) => (b.canStartNow ? 1 : 0) - (a.canStartNow ? 1 : 0));
```

오직 "즉시 제작 가능" 여부로 boolean 정렬. nutrition·hydration 기준 정렬 없음.

---

## 3. Blueprint 우선순위 코드 분석

### 3.1 priority/order/weight 필드 부재

grep 적용 (대상: `js/data/blueprints.js`, `blueprints_advanced.js`, `hiddenRecipes.js`):

```
패턴: priority|order:|weight:|preference
결과: No matches found (3개 파일 모두)
```

**3개 blueprint 데이터 파일 어디에도 우선순위 필드 자체가 정의되어 있지 않다.** 따라서 CraftSystem·CraftUI·CraftDiscovery·QuickCraftPrompt 어디서도 우선순위 필드를 참조한 자동 선택은 *코드 부재로 불가능*하다.

### 3.2 ALL_BLUEPRINTS enumeration 순서 의존

`js/ui/CraftUI.js:16`:
```js
const ALL_BLUEPRINTS = { ...BLUEPRINTS_BASE, ...HIDDEN_RECIPES };
```

`js/systems/CraftSystem.js:17`:
```js
const BLUEPRINTS = { ...BLUEPRINTS_BASE, ...BLUEPRINTS_ADV, ...HIDDEN_RECIPES };
```

`Object.values(...)` 순서는 ES2015+ 규격에서 문자열 키 삽입 순서. 데이터 파일에 정의된 순서대로 나열될 뿐이며 *의도된 우선순위*가 아니다.

### 3.3 cooking 관련 blueprint 정의 (검증된 핵심)

`js/data/blueprints.js:691~702` (make_boiled_water):
```js
make_boiled_water: {
  id: 'make_boiled_water', name: '물 끓이기', category: 'food',
  description: '오염수를 끓여 살균한다. 캠프파이어 필요.',
  output: [{ definitionId: 'boiled_water', qty: 1 }],
  requiredTools: ['campfire'],
  // Tier 0 — 무요구
  stages: [{
    stageIndex: 0, label: '물 끓이기', tpCost: 1,
    requiredItems: [{ definitionId: 'contaminated_water', qty: 1 }],
    consumeAt: 'start',
  }],
},
```

`js/data/blueprints.js:721~736` (cook_noodles):
```js
cook_noodles: {
  id: 'cook_noodles', name: '라면 조리', category: 'food',
  hidden: true, unlockConditions: { minSkillLevel: { cooking: 1 } },
  description: '끓인 물로 라면을 조리한다.',
  output: [{ definitionId: 'cooked_noodles', qty: 1 }],
  requiredTools: ['campfire'],
  requiredSkills: { cooking: 1 },
  stages: [{
    stageIndex: 0, label: '조리', tpCost: 1,
    requiredItems: [
      { definitionId: 'instant_noodles', qty: 1 },
      { definitionId: 'boiled_water', qty: 1 },
    ],
    consumeAt: 'start',
  }],
},
```

**핵심 비대칭:**
- `make_boiled_water`: 무스킬, 입력 = `contaminated_water` × 1, requiredTools `campfire`.
- `cook_noodles`: **`hidden: true` + `cooking: 1` 요구**, 입력 = `instant_noodles` × 1 + **`boiled_water` × 1** (오염수가 아닌 *끓인 물*), requiredTools `campfire`.
- cooking lv 0 직업의 5직업은 `cook_noodles` blueprint를 *사용할 수 없다.* (스킬·hidden 잠금)
- 단 interactions.js T1(`instant_noodles + campfire` → `cooked_noodles`)는 *스킬 무관 + boiled_water 무필요*로 변환 가능 — blueprint와 변환 경로 사이에 비대칭 존재.

### 3.4 hidden + 카드 변환 경로의 정체성 의미

게임 본체의 cooking 시스템 설계 의도(코드 부재 + 데이터 구조에서 단정):
- **Tier 0** (스킬 무관): blueprint `make_boiled_water` (오염수 끓이기), interactions T1·T3·T5·T7 (카드 드롭 즉시 변환)
- **Tier 1+** (스킬 요구, hidden): blueprint `cook_noodles`, `cook_rice`, `make_purified_water`
- player는 *어느 산출물을 만들지*를 카드 드래그·blueprint 클릭으로 *명시적으로* 결정한다.

이 설계는 협의서 v3 §3.2가 가정한 "자동 추천 algorithm"이 존재하지 않음을 명확히 한다.

---

## 4. 입력 일치 재현 트레이스

### 4.1 baseline v5 5직업 startInv 표준 구성

`js/data/characters.js` 직업별 `startingItems` (grep 결과 인용):

| 직업 | line | startingItems (관련 부분) | cooking lv |
|------|------|-------------------------|-----------|
| doctor | 55 | `..., 'instant_noodles', 'contaminated_water'` | 0 |
| soldier | 119 | `..., 'instant_noodles', 'instant_noodles', 'contaminated_water'` | 0 |
| firefighter | 190 | `..., 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'` | 0 |
| homeless | 252 | `..., 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'` | 0 |
| chef | 316 | `..., 'instant_noodles', 'instant_noodles', 'contaminated_water'` | 4 |
| engineer | 386 | `..., 'instant_noodles', 'instant_noodles', 'contaminated_water', 'contaminated_water'` | 0 |
| pharmacist | 428 | `..., 'instant_noodles', 'instant_noodles', 'contaminated_water'` | 0 |

(검증 항목 §3 위임 문구는 "instant_noodles × 2 + contaminated_water × 2"이지만 직업별 실제 startInv는 미세 편차 있음. cooking lv 0~3 5직업 검증에 충분.)

### 4.2 게임 본체에서 player가 day 1 cooking 진입 시 가능한 산출물

**시나리오 A — blueprint 경로:**

cooking lv 0 직업 (doctor·soldier·firefighter·homeless·engineer·pharmacist 6직업)이 사용 가능한 food category blueprint:

| bp id | hidden | requiredSkills | 입력 매칭 (day 1 startInv) | 산출 |
|-------|--------|---------------|--------------------------|------|
| `make_boiled_water` | no | 없음 | **매칭** (`contaminated_water` × 1) | `boiled_water` × 1 |
| `cook_noodles` | yes | cooking 1 | 잠금 (스킬 미달 + hidden) | — |
| `cook_rice` | yes | cooking 2 | 잠금 | — |
| `make_purified_water` | yes | cooking 1 | 잠금 | — |

→ cooking lv 0 직업은 blueprint 경로로 `boiled_water`만 산출 가능.

cooking lv 4 직업(chef)은 잠금 해제. 단 `cook_noodles`는 입력 `instant_noodles + boiled_water` — day 1에 `boiled_water` 미보유라 1회 boil 선행 필요. day 2부터 가능.

**모든 cooking lv 0 직업은 `campfire` 도구 보유 시에만 blueprint 실행 가능** (`requiredTools: ['campfire']` line 695). 신규 캐릭터 startInv에 campfire 보유 여부는 본 검증 범위 밖이며 시뮬·본체 양측 모두 별개 트랙.

**시나리오 B — interactions.js 카드 변환 경로:**

player가 `instant_noodles` 카드를 `campfire` 카드 위에 드롭 → T1 적용 → `cooked_noodles` 즉시 산출 (스킬·hidden 무관). cooking lv 0 직업도 가능. **즉 게임 본체에서 cooking lv 0 직업이 `cooked_noodles`를 만들 수 있는 유일 경로는 interactions T1·T2.**

player가 `contaminated_water` 카드를 `campfire` 카드 위에 드롭 → T5 적용 → `boiled_water` 즉시 산출.

→ **결정 주체:** player. 시스템은 입력 카드를 보고 매칭 규칙을 1회 적용할 뿐. "더 좋은 산출물을 자동으로 골라줌"이 없다.

### 4.3 시뮬 actCook과의 1:1 대응 검증

`tools/sim/v2/playerAI.mjs:172~195`:

```js
function actCook(simInv) {
  const cookingLv = GameState.player?.skills?.cooking?.level ?? GameState.player?.skills?.cooking ?? 0;
  let best = null;
  let bestN = -1;
  for (const bp of FOOD_BLUEPRINTS) {
    if (!_hasMeaningfulInputs(bp)) continue;
    const minSkill = bp.requiredSkills?.cooking ?? 0;
    if (minSkill > cookingLv) continue;
    if (!_hasAllInputs(simInv, bp)) continue;
    const outId = bp.output?.[0]?.definitionId;
    if (!outId) continue;
    const onC = ITEMS[outId]?.onConsume;
    const benefit = (onC?.nutrition ?? 0) + (onC?.hydration ?? 0);
    if (benefit <= 0) continue;
    if (benefit > bestN) { bestN = benefit; best = bp; }
  }
  ...
}
```

`playerAI.mjs:16~17` 주석:
> PR7 단순화: 요리의 requiredTools(campfire 등) 체크 생략 — simInv는 board card 인스턴스가 없으므로 구조물 모델링 불가.

**시뮬 actCook과 게임 본체의 결정적 차이:**

| 항목 | 게임 본체 | 시뮬 actCook |
|------|---------|------------|
| 산출물 선택 주체 | player (수동) | 자동 (benefit 최대값) |
| 비교 산식 | 없음 (player 직관) | `nutrition + hydration` 단순 합산 |
| requiredTools(campfire) 체크 | 있음 (line 71~80 `_checkStageReqs`) | 생략 (PR7 주석) |
| interactions.js T1 카드 변환 경로 | 사용 가능 | **모사 안 됨** (blueprint만 enumerate) |
| `cook_noodles` blueprint hidden 잠금 | 적용 (hidden + cooking 1) | requiredSkills만 체크. hidden 필드 무시 |

**§4.3.1 cook_noodles hidden 잠금 vs 시뮬 처리:**

시뮬은 `FOOD_BLUEPRINTS` 필터에 `bp.hidden` 차단을 두지 않는다 (`playerAI.mjs:54~57`):
```js
const FOOD_BLUEPRINTS = (() => {
  const all = { ...BLUEPRINTS, ...BLUEPRINTS_ADVANCED };
  return Object.values(all).filter(bp => bp?.category === 'food');
})();
```

→ 시뮬은 cooking lv 1+ 직업의 `cook_noodles`를 hidden 해금 절차 없이 사용. 단 baseline v5 §7.3 보고가 명시한 "cooking lv 0~3 5직업"은 chef(lv 4)·pharmacist를 제외한 의미이며, pharmacist cooking lv 확인 필요(차후 단정).

### 4.4 actCook 가설 B의 게임 본체 매핑

`BAL_SIM_baseline_v5_report.md` §7.3 인용:
> cooking lv 0~3 5직업의 산출물은 boiled_water(nutrition 0)이며, 영양 회복 0.

이 시뮬 측 단정의 게임 본체 매핑:
- 게임 본체에서 cooking lv 0 직업이 *blueprint 경로*로 만들 수 있는 음식은 `boiled_water`뿐. 시뮬이 단정한 "100% boiled_water" 산출 자체는 **본체 blueprint 경로 기준으로 동일**.
- 단 게임 본체는 *interactions.js T1*로 `cooked_noodles`도 만들 수 있다(스킬 무관). 시뮬은 이 경로를 *모사하지 않음*.
- **즉 시뮬 결함은 두 겹:**
  1. blueprint 경로 내 benefit 산식이 nutrition을 가중치 없이 합산 (협의서 v3 §2.1 단정한 결함, line 185)
  2. interactions.js cooking 변환 경로 자체가 시뮬에 미존재 — cooking lv 0 직업이 본체에서 cooked_noodles를 만들 수 있는 경로 누락

---

## 5. 시나리오 단정

### 5.1 시나리오 α/β/γ 평가

| 시나리오 | 정의 (협의서 v3 §3.2) | 본 검증 단정 |
|---------|----------------------|------------|
| α | 게임 본체 nutrition 우선 (player가 cooked_noodles 선택) | **부적용** — 게임 본체에 우선순위 산식 자체가 없다. player 행동이 결정. |
| β | 게임 본체 hydration 우선 또는 무차별 (player가 boiled_water 선택) | **부적용** — 게임 본체에 우선순위 산식 자체가 없다. player 행동이 결정. |
| γ (신규 정의) | **게임 본체에 자동 추천 알고리즘 부재. player가 명시적으로 산출물을 결정.** | **단정 (적용)** |

### 5.2 시나리오 γ 정의 (협의서 v3 §3.5 위임 문구 충족)

**시나리오 γ:**
- 게임 본체 cooking은 두 경로로 처리된다 — (1) blueprint via CraftSystem.startBlueprint, (2) 카드 드롭 즉시 변환 via interactions.js T1~T8.
- 양 경로 모두 player가 명시적으로 입력(blueprint id 또는 src/tgt 카드 쌍)을 결정한다.
- 산출물을 자동으로 추천하는 알고리즘이 코드 상 부재하다.
- 따라서 "본체가 boiled_water/cooked_noodles 중 어느 쪽을 추천하는지"는 *질문 자체가 본체에서 성립하지 않는다*. 본체의 산출물 분포는 player의 직관·UI 안내·문화적 학습에 의존한다.

### 5.3 시뮬 보강 방향에 대한 의미

`PD_BAL_MEETING_PR10_decision.md` §2.5 산식 변경 후보(가중치 ×1.5 / needs-aware / nutrition-floor)에 본 단정이 가하는 제약:

- 협의서 v3는 시뮬 보강이 "본체와의 정합화" 또는 "본체 결함의 과장 수정"이라는 두 분기를 가정했지만, 본 검증 결과 *시뮬 보강은 본체와의 1:1 정합화가 아니다*. 본체는 "자동 추천 없음 = player 의사결정 자유"이고, 시뮬은 이를 자동화한 대리 행동 모델(actCook)을 두는 *근본적 비대칭 구조*다.
- 시뮬 보강의 의미는 "본체에서 player가 *합리적으로 행동했을 때 도달하는 산출물 분포*를 시뮬이 모사하도록 정합화"이다. 즉 시뮬 산식은 *이상적 player 행동의 추정*이며, 실측이 아니다.
- needs-aware 산식(협의서 v3 §2.6 권고)이 가장 가까운 모사 — player가 hydration 부족 시 boil, nutrition 부족 시 noodles를 선택할 것이라는 직관과 정합.

---

## 6. PR10 머지 방향 권고

### 6.1 권고 결정

**PR10 = 시뮬 측 actCook 산식 보강 단일 트랙으로 머지 가능.** 게임 본체 PR 분리 트랙(협의서 v3 §10.3 시나리오 β 처리)은 **불필요**. 본체 측 결함이 *존재하지 않기 때문*에 본체 PR 분리 트랙 자체가 성립하지 않는다.

### 6.2 PR10 PR body에 명시할 의무 사항

본 단정 결과 PR10 PR body에 다음 4개 항을 명시할 것 (시스템 백승호 PR 생성 시 의무):

1. **본 단정 인용:** `SYS_VERIFY_cooking_autopick.md` §5.2 시나리오 γ.
2. **시뮬 보강의 의미 명확화:** "본체와의 1:1 정합 PR 아님. 본체에는 자동 추천 알고리즘이 없고, 시뮬 actCook은 player 행동의 *대리 추정 모델*이다. 보강은 이 추정 모델을 이상적 player 행동에 가깝게 만드는 정합화 작업이다."
3. **interactions.js T1 누락 미해소:** 본 PR은 blueprint 경로 산식만 변경. cooking lv 0 직업이 본체에서 `cooked_noodles`를 만드는 경로(interactions.js T1)는 시뮬에 미모사 — 별도 트랙으로 후순위. baseline v6 측정에서 시뮬 K3 < 본체 추정 K3 격차가 클 경우 보강 우선순위 재평가.
4. **산식 후보 권고:** 협의서 v3 §2.6의 needs-aware가 본 단정과 가장 정합. 단순 가중치 ×1.5는 player가 *항상* nutrition 우선이라는 가정이 본체 player 행동 모델과 다소 멀다. needs-aware 산식 채택 권고 (협의서 v3 §10.6 mock 환경 검증 의무 포함).

### 6.3 baseline v6 측정 해석 가이드

PR10 머지 후 baseline v6 K1·K3 값은 다음 의미를 가진다:
- v6 K1·K3 = **시뮬 player가 needs-aware로 행동했을 때의 100일 생존율 추정**
- 본체 실제 K1·K3 ≠ v6 K1·K3. 본체 player의 실제 행동(UI 학습 곡선, 신규 player vs 경험자 차이 등)이 시뮬과 다르기 때문.
- v6 KPI 표(협의서 v3 §9.5)는 *시뮬 이상치*로 해석 — 본체 K1 5% 마지노선과의 직접 매핑이 아닌 *상한 추정치*. 본체 K1 측정은 별도 트랙(in-game 자동 플레이 텔레메트리 등 — M3 범위 밖).

### 6.4 협의서 v3 위험과의 정합

- **§10.3 (시나리오 β 발견 시 본체 PR 분리):** 본 단정으로 *발동되지 않음.* β 부적용.
- **§10.6 (needs-aware 산식 채택 시 GameState 의존):** 본 단정에서 needs-aware 권고. mock 환경 검증 의무 그대로 적용 — `tools/sim/v2/systemBootstrap.mjs`에서 `GameState.player.nutrition`·`hydration` 객체 노출 확인 후 산식 구현.

---

## 7. 검증 한계 / 후속 위임

### 7.1 본 검증으로 단정한 것

1. `js/systems/CraftSystem.js` 432줄 전체에 자동 추천 알고리즘 없음.
2. `js/systems/CraftDiscovery.js` 157줄 전체에 nutrition·hydration 기준 우선순위 산식 없음.
3. `js/ui/CraftUI.js` 367줄 + `js/ui/QuickCraftPrompt.js` 133줄 — player 명시적 클릭으로만 blueprint 결정.
4. `blueprints.js`·`blueprints_advanced.js`·`hiddenRecipes.js` 3개 파일에 priority/order/weight 필드 부재.
5. `interactions.js` 1634줄에서 cooking 카드 변환 8개 규칙은 `Array.find` 첫 매칭. 우선순위 산식 없음.
6. cooking minigame·autoSelect·autoPick UI 부재 (`js/` 디렉터리 0 매칭).

### 7.2 본 검증으로 단정 못 한 것 (후속 위임 대상)

| 항목 | 사유 | 위임 |
|------|------|------|
| **AD 오은별 — UI 가시화 검증** | DragDrop 핸들러·UI hover 힌트의 player 인지 정합성은 UI 디자인 검증 영역 | 협의서 v3 §3.5 AD 오은별 트랙 그대로 유지 — *시나리오 γ 단정 후에도 유효.* 본체 자동 추천 부재 = player의 직관·UI 안내 의존 = AD UI 검증 가치 *오히려 증가.* hydration·nutrition 게이지 노출이 player의 cooking 선택에 영향을 주는지 검증 의무 그대로. |
| pharmacist 정확한 cooking lv | baseline v5 보고서 §7.3 "cooking lv 0~3 5직업" 표현이 pharmacist를 포함했는지 명확성 결여 — 본 검증 범위 밖 | 밸런스 권지나 baseline v6 측정 시 직업별 cooking lv 명시 |
| interactions.js T1 시뮬 누락 보강 트랙 진입 시점 | baseline v6 후 시뮬 cooking 산출 분포가 본체 추정과 큰 격차 시 신규 트랙 필요 | PR10 머지 후 baseline v6 결과로 PD 김재훈 + 시스템 백승호 판단 |
| campfire 도구 보유 가정 검증 | 본 검증은 `requiredTools: ['campfire']` 존재만 단언. 5직업 startInv에 `campfire` 보유 여부는 별도 검증 | PD 검증 외 트랙 (자원 분배 검증) |
| 사용자 학습 곡선·신규 player 행동 데이터 | 본체 실제 K1과 시뮬 K1의 격차 평가 | M3 범위 밖 — M4+ 텔레메트리 트랙 |

### 7.3 AD 오은별 트랙에 넘기는 잔여 의문점

- 본체에 자동 추천이 없다는 사실은 **UI 영역의 의문점을 *제거*하는 게 아니라 *증가*시킨다**. player가 직관으로 boiled_water/cooked_noodles를 골라야 한다면:
  1. 카드 드래그 hover 시 산출물 미리보기 hint가 충분한가? (interactions.js의 `hint` 필드, 예: line 27 "라면 조리 → 조리된 라면으로 변환")
  2. CraftUI의 `_renderOutputPreview` (line 274~324)가 nutrition·hydration 수치를 가시화하는가? 코드 확인 — line 304~305에 onConsume.nutrition·hydration 표시 *있음.* 그러나 player가 두 산출물의 nutrition/hydration 비교를 위해 *두 blueprint를 각각 클릭*해야 하는 UX 부하가 있는지 평가 필요.
  3. 현재 hydration·nutrition 게이지가 player에게 "지금 무엇이 부족한지" 잘 노출되는가? (사이드바 HUD 영역, AD WORKER_PERSONA_SIDEBAR 페르소나 결정 영역)

→ AD 오은별 검증 산출물에 위 3개 의문점 포함 권고.

---

*문서 끝. 본 단정 결과 협의서 v3 §3.5 PR10 머지 방향 = 시뮬 단일 PR 머지 가능 + 본체 PR 분리 트랙 불요. PR10 PR body에 §6.2 4개 항 명시 의무.*
