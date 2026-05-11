# AD — Cooking UI Player 안내 검증

> 작성: AD 오은별 / 2026-05-11
> 트리거: `SYS_VERIFY_cooking_autopick.md` §7.3 위임 (3건 잔여 의문점)
> 결정: **3 검증 항목 평가 결과 — (1) Hover Hint 정보 노출 = 부족, (2) CraftUI._renderOutputPreview 비교 부하 = 일부 부족, (3) 사이드바 hydration·nutrition 게이지 안내 = 충분(임계 시각화 검증 완료). 시나리오 γ 단정(게임 본체 자동 추천 부재)을 전제로, player가 boiled_water vs cooked_noodles 산출물을 합리적으로 선택할 수 있도록 안내가 충분한지 평가하면 *현재 UI는 부분적 결함*. UI 변경 권고 2건. PR10 산식 형태에 미치는 영향 = needs-aware 산식 권고 강화(UI 정합).**

---

## 1. 서두

### 1.1 검증 의무

`SYS_VERIFY_cooking_autopick.md` §7.3에서 AD 오은별 트랙으로 위임된 잔여 의문점 3건:

1. **interactions.js hover hint player 인지 충분성** — 카드 드래그 hover 시 산출물 영양·수분 수치가 player에게 노출되는가
2. **CraftUI._renderOutputPreview:274~324 산출물 비교 부하** — 두 산출물(boiled_water vs cooked_noodles) 비교 시 UX 부하
3. **사이드바 hydration·nutrition 게이지 안내 충분성** — player가 "지금 무엇이 부족한지" 한눈에 인지 가능한가

본 검증은 시스템 백승호의 시나리오 γ 단정(게임 본체에 cooking 자동 추천 알고리즘 부재 — `SYS_VERIFY_cooking_autopick.md` §5.2)을 전제로 한다. 자동 추천 부재 = player의 직관·UI 안내 의존도가 높음 → UI 안내 결함이 곧 player 행동 결함으로 이어진다.

### 1.2 검증 범위

읽은 파일 (실제):
- `js/data/interactions.js` lines 1~200 (T1~T11 변환 규칙 hint 필드 전수)
- `js/ui/CraftUI.js` lines 260~324 (`_renderOutputPreview` + `_renderSkillReqs` 본문)
- `js/ui/StatRenderer.js` lines 1~230 (사이드바 stat-bar 빌드 + 위험 임계 갱신 로직)
- `js/board/DragDrop.js` lines 140~210, 315~342 (drag hover 시 `_showInteractionTip` 호출 + 본문 구현)
- `js/systems/CraftDiscovery.js` lines 74~91 (`getQuickHint` quick craft hint 생성)
- `css/animations.css` lines 397~405 (`critical-alert` 펄스 애니메이션)
- `css/ui.css` lines 180~181 (`stat-bar-fill.danger/.warn` 클래스 정의)
- `DESIGN.md` lines 1~100 (Color 액센트, 상태 색상 어휘) + `css/variables.css` lines 1~80 (디자인 토큰 실제 값)

검증 범위 밖:
- 실제 게임 실행 시 시각적 렌더링 결과 확인 — read-only 트랙. "후속 — 실측 검증 필요"로 §7에 기록.

---

## 2. 검증 항목 1 — Hover Hint 정보 노출

### 2.1 hover 시 표시되는 정보 — 실제 코드 확인

`js/board/DragDrop.js:162~169` 카드 hover 분기:

```js
const srcDef = GameState.getCardDef(this._draggingId);
const tgtDef = GameState.getCardDef(existingId);
const rule   = findInteraction(srcDef, tgtDef);

if (rule) {
  slot.classList.add('can-interact');
  this._showInteractionTip(slot, rule.hint);
  e.dataTransfer.dropEffect = 'move';
  return;
}
```

`_showInteractionTip` 구현(`DragDrop.js:321~328`):

```js
_showInteractionTip(slotEl, message) {
  this._hideInteractionTip();
  const tip = document.createElement('div');
  tip.className = 'drag-interaction-tip';
  tip.textContent = '⚡ ' + message;
  slotEl.appendChild(tip);
  this._tipEl = tip;
},
```

→ tip 본문은 **`rule.hint` 문자열만** 표시. `nutrition`·`hydration` 등 산출물 수치를 추가 합성하는 코드가 없다.

### 2.2 interactions.js hint 텍스트 전수 (cooking 8개 규칙)

`js/data/interactions.js:23~148` cooking 변환 8개 규칙의 `hint` 필드:

| id | line | hint 문자열 |
|----|------|------------|
| T1 cook_noodles | 27 | `'라면 조리 → 조리된 라면으로 변환'` |
| T2 cook_noodles_rev | 43 | `'라면 조리 → 조리된 라면으로 변환'` |
| T3 cook_rice_transform | 59 | `'쌀 조리 → 밥으로 변환'` |
| T4 cook_rice_rev | 75 | `'쌀 조리 → 밥으로 변환'` |
| T5 boil_contaminated | 91 | `'오염수 끓이기 → 끓인 물로 변환'` |
| T6 boil_contaminated_rev | 107 | `'오염수 끓이기 → 끓인 물로 변환'` |
| T7 boil_rainwater | 123 | `'빗물 끓이기 → 끓인 물로 변환'` |
| T8 boil_rainwater_rev | 139 | `'빗물 끓이기 → 끓인 물로 변환'` |

**핵심 사실:** 8개 cooking hint 어디에도 **산출물의 영양가·수분 수치 노출이 없다**. "조리된 라면", "끓인 물" 이름만 노출. player가 hover 단계에서 "라면 = nutrition 35 / hydration 20", "끓인 물 = nutrition 0 / hydration 65" 비교 정보를 얻을 방법은 *0*.

### 2.3 QuickCraft hint 보강 분기 평가

`js/systems/CraftDiscovery.js:74~91` `getQuickHint`:

```js
getQuickHint(srcDefId, tgtDefId) {
  const recipes = this.findRecipes(srcDefId, tgtDefId, { includeLocked: true });
  if (recipes.length === 0) return null;

  const first = recipes[0];
  const head = first.isLocked
    ? I18n.t('craft.vagueHint')
    : first.outputPreview.map(o => `${o.icon} ${o.name}`).join(', ');
  const suffix = first.canStartNow
    ? ` (${I18n.t('craft.ready')})`
    : ` (${first.missingItems.length} ${I18n.t('craft.missing')})`;

  return {
    hint: `✨ ${head}${suffix}`,
    canStart: first.canStartNow,
    count: recipes.length,
  };
},
```

→ QuickCraft 경로의 hint도 **`icon + name`만 합성**. `outputPreview`에 수치 필드가 정의되어 있어도 hint 문자열에 합성되지 않는다. interactions.js 경로와 동일하게 영양·수분 비교 정보 *0*.

### 2.4 검증 결과 단정

**결과: 부족.**

player가 `instant_noodles` 카드를 `campfire` 위로 드래그할 때 hover로 노출되는 정보는 *산출물 이름만*이다. 본 카드를 끓일지(T1 → cooked_noodles) vs `contaminated_water`를 끓일지(T5 → boiled_water) 비교 결정에 필요한 영양·수분 수치는 hover 단계에서 *전혀* 노출되지 않는다.

시나리오 γ 단정(자동 추천 부재) 하에서 player가 이 두 산출물 간 합리적 선택을 하려면 hover 정보만으로는 불충분하다. player는 (a) 두 카드를 각각 hover/탭하거나 (b) Craft 패널 진입 후 `_renderOutputPreview`까지 가야 영양·수분 수치를 얻을 수 있다.

---

## 3. 검증 항목 2 — OutputPreview 비교 부하

### 3.1 _renderOutputPreview 본문 (`CraftUI.js:274~324`)

핵심 출력 영역 (line 300~309):

```js
// Consumable effects
if (def.onConsume) {
  const oc = def.onConsume;
  if (oc.hp) statsHtml += `<div class="preview-stat">❤️ +${oc.hp}</div>`;
  if (oc.nutrition) statsHtml += `<div class="preview-stat">🍖 +${oc.nutrition}</div>`;
  if (oc.hydration) statsHtml += `<div class="preview-stat">💧 +${oc.hydration}</div>`;
  if (oc.morale) statsHtml += `<div class="preview-stat">${oc.morale > 0 ? '😊' : '😟'} ${oc.morale > 0 ? '+' : ''}${oc.morale}</div>`;
  if (oc.infection) statsHtml += `<div class="preview-stat">🦠 ${oc.infection}</div>`;
  if (oc.contamination) statsHtml += `<div class="preview-stat">☢️ ${oc.contamination}</div>`;
}
```

**핵심 사실:**
- 산출물의 `onConsume.nutrition` / `onConsume.hydration`이 **수치로 표시됨** (예: 🍖 +35 / 💧 +65).
- 출력 영역은 단일 blueprint 하나의 산출물만 렌더.

### 3.2 두 산출물 비교 시 UX 부하

`make_boiled_water`와 `cook_noodles`를 비교하려면 player가 수행해야 하는 단계:

1. Craft 패널 열기 (`F` 키 또는 사이드바 craft 버튼 — `js/ui/CraftUI.js:125` `startBlueprint` 호출 진입점)
2. blueprint 목록(`_renderBlueprintList`)에서 `make_boiled_water` 클릭 → `_selectedBp` 변경 → 우측 preview에 `💧 +65` 표시
3. blueprint 목록에서 `cook_noodles` 클릭 → `_selectedBp` 변경 → 우측 preview에 `🍖 +35 / 💧 +20` 표시
4. player 머릿속에서 두 수치 비교 → 결정

→ **두 산출물 비교는 _순차_, 동시 비교 UI 없음.**

`cook_noodles`는 hidden 잠금 + cooking lv 1 요구 (`blueprints.js:721~736`, `SYS_VERIFY` §3.3 인용). cooking lv 0 직업 6직업(doctor·soldier·firefighter·homeless·engineer·pharmacist)은 blueprint 경로로 cook_noodles에 *접근 자체*가 불가. 따라서 본 직업들의 cooked_noodles 산출은 `interactions.js` T1 카드 변환 경로뿐인데, T1은 §2.4에서 단정한 대로 hover 단계 수치 노출 *0*.

### 3.3 DESIGN.md 정합성 평가

`DESIGN.md` Color 섹션(line 48~76):
- `--text-good: #60b060` — 성공·긍정
- `--text-warn: #e0a030` — 경고
- `--text-danger: #e05050` — 위험·체력 위기

`css/variables.css:27~35` stat 색상:
- `--stat-hydration: #4488cc`
- `--stat-nutrition: #66aa44`

→ 영양과 수분에 *각각 의미 색상*이 토큰으로 정의되어 있다. 그러나 `_renderOutputPreview`의 `.preview-stat` 클래스는 단일 텍스트 라인(`preview-stat` div)으로만 출력 — DESIGN.md 액센트 시스템이 산출물 미리보기에서 *충분히 활용되지 않음*. nutrition 수치를 `--stat-nutrition` 색으로 강조하면 정보 위계가 즉시 향상된다.

### 3.4 검증 결과 단정

**결과: 일부 부족.**

- 영양·수분 수치 *노출 자체*는 충분 — `_renderOutputPreview:304~305`에 명시적 표시.
- 그러나 **두 산출물 동시 비교 UI가 없다** — player는 두 blueprint를 순차 클릭해 머릿속에서 비교해야 함. 자동 추천 부재 시나리오 γ 하에서 본 비교 부하가 player 선택 합리성을 저해.
- DESIGN.md 색상 토큰(`--stat-nutrition`·`--stat-hydration`)이 정의되어 있지만 `.preview-stat` 출력에 적용되지 않아 정보 위계 약화 — 디자인 시스템 활용 미흡.

---

## 4. 검증 항목 3 — 사이드바 게이지 안내

### 4.1 사이드바 stat-bar 빌드 (`StatRenderer.js:60~89`)

사이드바 필수 스탯 4개 (line 11~16):

```js
const STAT_CONFIG = [
  { key: 'hydration',   i18nKey: 'stat.hydration',   icon: '💧' },
  { key: 'nutrition',   i18nKey: 'stat.nutrition',   icon: '🥗' },
  { key: 'stamina',     i18nKey: 'stat.stamina',     icon: '💪', isGood: true },
  { key: 'fatigue',     i18nKey: 'stat.fatigue',     icon: '😴' },
];
```

→ **hydration과 nutrition이 사이드바 필수 4개 안에 포함**. 두 게이지 모두 HP 바 바로 아래 상시 노출.

### 4.2 위험 임계 시각화 (`StatRenderer.js:181~198`)

```js
if (fill && group) {
  fill.classList.remove('danger', 'warn');
  group.classList.remove('flash-bad', 'flash-good', 'critical-alert');

  const isAccum = ['radiation','infection','fatigue'].includes(s.key);
  if (s.isGood) {
    if (pct < 15) fill.classList.add('danger');
    else if (pct < 30) fill.classList.add('warn');
  } else if (isAccum) {
    if (pct > 70) fill.classList.add('danger');
    else if (pct > 40) fill.classList.add('warn');
  } else {
    if (pct < 15) { fill.classList.add('danger'); group.classList.add('critical-alert'); }
    else if (pct < 30) fill.classList.add('warn');
    // 수분 20% 이하 추가 경보
    if (s.key === 'hydration' && pct < 20) group.classList.add('critical-alert');
  }
}
```

**핵심 사실:**
- `hydration`은 `isGood`도 `isAccum`도 아니므로 마지막 분기에 해당 — pct < 15 시 `danger` 클래스 + `critical-alert`, pct < 30 시 `warn`. **추가로 pct < 20 시에도 `critical-alert` 적용** (line 196 명시 — 수분 20% 이하 추가 경보).
- `nutrition`도 동일 분기 — pct < 15 시 `danger` + `critical-alert`, pct < 30 시 `warn`.

### 4.3 CSS critical-alert 시각 효과 (`animations.css:397~405`)

```css
@keyframes criticalStatPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 50, 50, 0); }
  50%       { box-shadow: 0 0 0 3px rgba(220, 50, 50, 0.7); }
}
.stat-bar-group.critical-alert {
  animation: criticalStatPulse 0.9s ease infinite;
  border-radius: 4px;
}
```

→ critical-alert 상태에서 stat-bar-group 전체가 **빨간 박스 그림자 펄스 애니메이션**. player 시야 주변시(peripheral vision)에서도 인지 가능한 시각 자극 강도.

`ui.css:180~181`:
```css
.stat-bar-fill.danger { animation: dangerPulse 0.8s ease infinite; }
.stat-bar-fill.warn   { animation: dangerPulse 1.8s ease infinite; }
```

→ fill 자체도 펄스. danger(0.8s)와 warn(1.8s)의 펄스 속도 차이로 위험도 구분.

### 4.4 DESIGN.md 정합성 평가

`DESIGN.md` Color 섹션 매핑:
- 위험 = `--text-danger #e05050` → critical-alert 펄스 색(`rgba(220, 50, 50, 0.7)`)이 거의 일치. 정합.
- 경고 = `--text-warn #e0a030` → warn 클래스 펄스가 fill 색을 사용하면 정합 (`stat-hydration`·`stat-nutrition` 토큰 위에 펄스). 단 본 검증 범위에서 dangerPulse keyframe 본문은 미확인 — 후속 확인 필요.

### 4.5 검증 결과 단정

**결과: 충분.**

- hydration·nutrition 두 게이지가 사이드바 필수 영역에 상시 노출.
- 두 게이지 모두 임계점에서 `danger`/`warn`/`critical-alert` 3단 시각 경고 적용.
- hydration은 *20% 추가 경보* 분기 존재(라인 196) — 수분 부족 인지가 영양 부족 인지보다 *살짝 더 빠르게* 트리거 (15% → 20%로 5%p 일찍).
- critical-alert 펄스가 stat-bar-group 외곽 box-shadow로 적용되어 주변시 인지 가능.

시나리오 γ에서 player가 "지금 무엇이 부족한지" 한눈에 인지하는 데 본 사이드바 게이지 시스템은 *충분하다*. player가 nutrition < 15% 또는 hydration < 20% 상태에서 cooking 진입 시, 어느 산출물을 골라야 할지 판단 근거(부족한 스탯)는 *사이드바 시각 경보로 즉시 노출됨*.

---

## 5. 종합 판단 — UI 안내 충분성

### 5.1 3 항목 결과 표

| 항목 | 결과 | 핵심 근거 |
|------|------|----------|
| 1. Hover Hint 정보 노출 | **부족** | `interactions.js` cooking 8개 hint에 영양·수분 수치 0건. `_showInteractionTip`이 hint 문자열만 표시. |
| 2. OutputPreview 비교 부하 | **일부 부족** | 영양·수분 수치 노출 자체는 있음(`CraftUI.js:304~305`). 그러나 두 산출물 동시 비교 UI 없음. DESIGN.md 색상 토큰 미적용. |
| 3. 사이드바 게이지 안내 | **충분** | hydration·nutrition 두 게이지가 필수 영역에 상시 노출 + `danger`/`warn`/`critical-alert` 3단 임계 + hydration 20% 추가 경보. |

### 5.2 시나리오 γ 전제 하에서의 의미

시스템 백승호의 시나리오 γ 단정(`SYS_VERIFY_cooking_autopick.md` §5.2)에 의해 게임 본체에 cooking 자동 추천이 부재함이 확인되었다. 본 사실은 UI 안내 결함의 *영향력을 증폭*시킨다.

**player 의사결정 흐름 (현재 UI 기준):**

1. 사이드바 게이지 인지 → nutrition · hydration 중 어느 쪽이 부족한지 *알 수 있음* (§4 충분)
2. cooking 진입 결정 → `instant_noodles`를 `campfire`로 드래그 시도
3. hover hint → "라면 조리 → 조리된 라면으로 변환" *이름만* 인지 (§2 부족 — 본 산출물이 영양 보강인지 수분 보강인지 *수치 부재*)
4. 결정 단계 — player가 산출물의 영양·수분 수치를 모른 채 결정해야 함
5. 대안 — Craft 패널 진입 후 두 blueprint 순차 클릭으로 수치 확인 (§3 일부 부족)

**3 단계의 단절이 핵심 결함.** 사이드바 게이지는 "무엇이 부족한지" 알려주지만, hover hint는 "이 변환이 그것을 채워주는지" 알려주지 않는다. 즉 *진단은 충분, 처방 매칭은 부족*.

### 5.3 시뮬 vs 실제 player 행동의 격차 추정

본 검증은 시스템 백승호의 시뮬 측 모순 단정(`SYS_VERIFY` §4.3)과 결합해 다음을 시사한다:

- **시뮬 actCook 현재 산식** (`playerAI.mjs:185` `benefit = nutrition + hydration` 단순 합산): boiled_water(0+65=65) > cooked_noodles(35+20=55). 결과 = 5직업 100% boiled_water 산출 (baseline v5 §7.3).
- **실제 player 행동 추정 (현재 UI 기준):** 사이드바 게이지로 부족 스탯은 인지 가능하지만, hover hint가 산출물 영양·수분을 노출하지 않으므로 *처방 매칭 실패 비율이 높을 가능성*. 시뮬과 유사한 boiled_water 우선 선택이 *UI 결함으로 인해* 발생할 수 있다.

→ **즉 시뮬 산식 결함이 실제 player 행동을 *과장하는* 것이 아니라 *현재 UI 안내 부족으로 인해 발생하는 player 행동을 정합 모사*할 가능성이 높다.** 다만 사이드바 게이지 정보를 player가 적극 활용해 의도적 처방 매칭을 시도하는 경우 — 시뮬은 이 *이상적 player 행동*을 모사하지 못함. 즉 시뮬 결함과 UI 결함이 *서로 부분 상쇄*하는 비정합 구조.

---

## 6. PR10 산식 형태 권고 영향

### 6.1 산식 후보별 본 검증 결과의 의미

`PD_BAL_MEETING_PR10_decision.md` §2.6 산식 후보 3가지에 대한 본 검증 영향:

| 산식 후보 | 본 검증 결과의 영향 |
|----------|-------------------|
| 가중치 ×1.5 (`n × 1.5 + h`) | UI는 nutrition/hydration 우선순위를 *상황에 따라* 다르게 안내(사이드바 게이지) — 정적 가중치는 본 안내와 정합하지 않음. **권고 미달**. |
| **needs-aware** (`player.nutrition < 50 ? n×3 + h : n + h×1.5`) | **UI와 정합 강함**. 사이드바 게이지(§4.2 critical-alert 분기)가 player에게 "지금 무엇이 부족한지"를 임계 기반으로 안내 — 시뮬도 동일 임계 기반 분기를 채택하면 *시뮬-UI-player 행동 3자 정합*. **PR10 권고 강화**. |
| nutrition-floor | hydration 결핍 시도 noodles 우선 → 사이드바 hydration critical-alert와 모순. **권고 미달**. |

### 6.2 권고 단정

**시스템 백승호에게: PR10 산식 = needs-aware 형태 채택 권고 강화.** 본 UI 검증 결과 사이드바 게이지가 player에게 임계 기반 부족 스탯을 안내하므로(§4.2), 시뮬 산식이 동일 임계 기반 분기를 채택하면 시뮬이 *이상적 player 행동*(사이드바 게이지를 적극 활용하는 player) 모사가 자연스러워진다.

`PD_BAL_MEETING_PR10_decision.md` §10.6 needs-aware 산식 GameState 의존 영향(`tools/sim/v2/systemBootstrap.mjs` mock에서 player.nutrition·hydration 객체 노출 보장)은 본 권고 시에도 그대로 유효.

### 6.3 산식 임계값 권고

본 검증에서 확인한 사이드바 임계값과 정합하는 시뮬 임계값:

- hydration < 20% 추가 경보 (StatRenderer.js:196) → 시뮬도 `hydration.current < hydration.max × 0.20` 시 hydration 가중치 ×N 분기
- nutrition < 15% critical-alert (StatRenderer.js:193) → 시뮬도 `nutrition.current < nutrition.max × 0.15` 시 nutrition 가중치 ×N 분기

→ 시뮬 임계값 == 본체 UI 임계값으로 *완전 정합* 시 시뮬 K1·K3가 UI 안내를 적극 활용하는 player의 이상치 모사로 해석 가능. baseline v6 결과 해석 시 명시적 단정 가능.

---

## 7. UI 변경 권고

본 검증 결과에 따라 AD 트랙 후속 UI 변경 권고 2건. 두 권고 모두 본 PR10 트랙과 *별도* — PR10 머지를 차단하지 않음. 단 baseline v6 측정 후 시뮬-실제 격차가 우려보다 크게 나오면 본 UI 변경 우선순위 상향.

### 7.1 권고 1 — Hover Hint에 영양·수분 수치 합성 (우선순위 高)

**대상:** `js/board/DragDrop.js:166` `_showInteractionTip(slot, rule.hint)` 호출부, 또는 `interactions.js` cooking 8개 규칙의 `hint` 필드.

**현재:** "라면 조리 → 조리된 라면으로 변환"

**권고 후:** "라면 조리 → 조리된 라면 (🥗 +35 / 💧 +20)"

**구현 방향:**
- `rule.apply()`이 반환하는 `transformSrc` 또는 `transformTgt`의 `onConsume.nutrition`·`hydration`을 hint 합성 시 참조
- 또는 `interactions.js`에 cooking 규칙별 `hintExtra(srcInst, tgtInst)` 콜백 추가 (산출물 ITEMS lookup → 수치 합성)
- 색상: `--stat-nutrition #66aa44`·`--stat-hydration #4488cc` 토큰 적용 — DESIGN.md 색상 어휘 정합

**DESIGN.md 정합성:**
- `--font-size-xs: 14px` (line 39) — 수치 라벨에 적합한 크기
- `--gap-xs: 4px` (line 86) — 라벨 간 간격
- 새 색상 도입 0, 기존 `--stat-*` 토큰만 사용 — DESIGN.md restrained 원칙 정합

### 7.2 권고 2 — CraftUI 산출물 비교 모드 (우선순위 中)

**대상:** `js/ui/CraftUI.js:274~324` `_renderOutputPreview` 또는 상위 `_renderBlueprintList`.

**현재:** 단일 blueprint preview만 표시. 두 산출물 동시 비교 UI 없음.

**권고 후:** "최근 hover된 N개(예: 2개) blueprint의 산출물 비교 행" 또는 "preview에 동일 카테고리 다른 산출물 영양/수분 인라인 비교 표시"

**구현 방향:**
- `_renderOutputPreview` 본문에 `def.category === 'food'` 분기 추가
- 동일 입력 자원으로 만들 수 있는 다른 산출물 lookup (CraftDiscovery.findRecipes 활용)
- `.preview-stats` 옆에 `.preview-stats-alt` 영역 추가 — 대안 산출물 수치 표시
- 색상: `--stat-nutrition`·`--stat-hydration` 토큰 — 동일하게 DESIGN.md 정합

**DESIGN.md 정합성:**
- 카드 패널 layout (`DESIGN.md` Layout 섹션 line 92~100): `grid-disciplined` — preview 영역 내부에 sub-grid 추가 가능
- `--gap-md: 12px` 또는 `--gap-sm: 8px` 사용 — 기존 토큰 활용

### 7.3 권고 적용 후 시뮬-UI 정합 시나리오

위 2건 권고 적용 후 player 행동 모델:
1. 사이드바 게이지로 부족 스탯 인지 (§4 충분)
2. cooking 카드 hover → hint에 산출물 영양/수분 수치 *즉시 노출* (권고 1)
3. 의심 시 Craft 패널에서 산출물 비교 (권고 2)
4. 결정 — needs-aware 모델 정합

→ 시뮬 needs-aware 산식이 위 player 행동을 정확히 모사. baseline v6 측정값이 *실제 게임 본체 K1의 합리적 추정치*로 해석 가능.

---

## 8. 검증 한계 / 후속 위임

### 8.1 본 검증으로 단정한 것

1. `interactions.js` cooking 8개 hint에 영양·수분 수치 노출 0건 (§2.2).
2. `DragDrop.js:321~328` `_showInteractionTip`이 hint 문자열만 표시, 수치 합성 분기 부재 (§2.1).
3. `CraftDiscovery.js:74~91` `getQuickHint`도 icon+name만 합성, 수치 부재 (§2.3).
4. `CraftUI.js:304~305` `_renderOutputPreview`가 단일 산출물 영양·수분 수치 노출 (§3.1).
5. `_renderOutputPreview`에 두 산출물 동시 비교 UI 부재 (§3.2).
6. `_renderOutputPreview`의 `.preview-stat`이 DESIGN.md 색상 토큰(`--stat-nutrition`·`--stat-hydration`) 미적용 (§3.3).
7. `StatRenderer.js:11~16` 사이드바 필수 스탯 4개에 hydration·nutrition 포함 (§4.1).
8. `StatRenderer.js:181~198` hydration·nutrition 3단 임계(`danger`/`warn`/`critical-alert`) 시각화 적용 (§4.2).
9. `animations.css:397~405` critical-alert 펄스 애니메이션이 stat-bar-group 외곽 box-shadow로 적용 (§4.3).
10. hydration < 20% 추가 critical-alert 분기 존재 (§4.2 line 196).

### 8.2 후속 — 실측 검증 필요 항목

| 항목 | 사유 | 위임 |
|------|------|------|
| 실제 게임 실행 시 hover tip 가독성 | read-only 트랙 — 시각 렌더링 실측 확인 미수행. 1920×1080 PC 화면에서 hint tip 폰트 크기·여백·tip 위치 가독성 평가 필요. | AD 후속 트랙 (UI 변경 권고 1 구현 시) |
| dangerPulse keyframe 본문 (`ui.css`) | `ui.css:180~181`의 `dangerPulse` 정의 본문 미확인. fill 색이 토큰 정합인지 검증 필요. | AD 후속 트랙 (사이드바 시각 회귀 검사 시) |
| 실제 player 학습 곡선 데이터 | 신규 player가 사이드바 게이지를 cooking 결정 근거로 *실제로* 활용하는지 텔레메트리 필요. M3 범위 밖. | M4+ 텔레메트리 트랙 |
| `interactions.js`에 cooking-only `hintExtra` 도입 시 영향 범위 | hint 합성 분기 추가가 비-cooking 규칙(전투·치료 등)에 영향 주는지 검증. | AD 후속 트랙 (권고 1 구현 시 시스템 백승호 공동 검증) |

### 8.3 PR10 머지 차단 여부

**본 검증은 PR10 머지를 차단하지 않는다.**

이유:
- PR10은 시뮬 측 `playerAI.mjs:185` 산식 보강 단일 트랙(`SYS_VERIFY` §6.1).
- 본 검증 결과 UI 결함은 *별도 트랙* — PR10 머지 후 baseline v6 측정 결과로 우선순위 평가.
- 단 PR10 산식 형태는 **needs-aware 권고 강화** (§6.2) — 시스템 백승호 산식 결정 시 본 권고 참조 의무.

### 8.4 baseline v6 측정 해석 가이드 보강

`SYS_VERIFY` §6.3 baseline v6 해석 가이드에 본 검증 결과 추가 반영 권고:
- v6 K1·K3 = "사이드바 게이지를 적극 활용하는 *이상적* player의 100일 생존율 추정"
- 실제 본체 K1과의 격차는 *UI 안내 결함*(특히 §2 hover hint 부재)이 *player 행동 비합리성*을 유발하는 정도에 비례
- UI 변경 권고 1·2 적용 후의 실제 K1은 v6 시뮬치에 *수렴*할 것으로 기대

---

*문서 끝. 본 검증 결과 시나리오 γ 전제 하에서 UI 안내는 *진단 충분, 처방 매칭 부족*. PR10 = needs-aware 산식 권고 강화. AD 후속 트랙으로 UI 변경 권고 2건 (Hover Hint 수치 합성 + CraftUI 산출물 비교) — PR10 머지 차단 아님.*
