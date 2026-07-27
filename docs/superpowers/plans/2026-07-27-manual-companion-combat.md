# Manual Companion Combat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 동료 턴을 기술 카드와 대상 직접 선택 방식으로 고정하고, fixture 스키마 검증과 실제 12종 몬스터·20종 동료 완전성 검증의 책임을 분리한다.

**Architecture:** production 턴 루프에서는 동료 AI와 stance를 완전히 제거하고 모든 동료를 `await_ally_input`으로 보낸다. 플레이어와 동료는 동일한 `selectSkill()` → `selectTarget()` → `confirmAction()` 경로를 사용한다. `COMPANION_TACTICS`와 순수 planner는 개발용 데이터 QA에만 남기며, 시뮬레이터와 브라우저 E2E도 production 수동 명령 경로를 실행한다.

**Tech Stack:** Vanilla JavaScript ES modules, Vitest 4, happy-dom, Playwright, Vite 8

## Global Constraints

- 모든 사용자 응답·문서·테스트 설명은 한글로 작성한다.
- production 전투에서 동료 자동 행동 호출은 0개여야 한다.
- production UI에서 `attack`, `heal`, `support`, `hold`, `manual` stance 버튼은 0개여야 한다.
- 과거 저장 데이터의 `npcState.stance`는 삭제하지 않지만 전투 판단에 사용하지 않는다.
- Task 1은 fixture 스키마만 검증하며 실제 32종 완전성은 데이터 구현 테스트와 `js/data/validate.js`가 담당한다.
- 일반 몬스터 12종, 동료 20종, 동료 고유 기술 60개 cardinality는 실제 데이터 검증에서 hard fail이어야 한다.
- 동료 기술의 비용·쿨다운·대상·랭크·효과·`motionKey` 계약은 유지한다.
- UI 변경은 `DESIGN.md`와 `css/variables.css`의 기존 토큰을 사용한다.
- 기존 사용자 dirty 변경, 특히 이미지·`css/npc-panel.css`·`js/data/locales.js`·`js/data/validate.js`의 비관련 hunk를 stage하지 않는다.
- Windows 명령은 `npm.cmd`와 `npx.cmd`를 사용한다.

---

## File Responsibility Map

- `tests/unit/CompanionPatternData.test.js`: 작은 fixture만 사용하는 동료 패턴 스키마 계약
- `tests/unit/NormalEnemyPatternData.test.js`: 작은 fixture만 사용하는 일반 몬스터 패턴 스키마 계약
- `tests/unit/NormalEnemyRosterData.test.js`: 실제 일반 몬스터 12종의 ID·행동 테이블 완전성
- `tests/unit/CompanionSkillIdentity.test.js`: 실제 동료 20종·60기술 완전성
- `js/systems/combat/CombatAiTurns.js`: 동료 턴 준비와 적 AI; production 동료 자동 planner 연결 제거
- `js/systems/CombatSystem.js`: 턴 큐, 수동 입력 상태, 기술 명령 확정
- `js/ui/CombatUI.js`: 현재 combatant의 기술 카드·대상 UI; stance/빠른 계획 UI 제거
- `css/screens-combat.css`: 수동 동료 기술 카드 레이아웃만 유지하고 stance 전용 규칙 제거
- `js/systems/combat/CompanionTactics.js`: 개발용 순수 planner; production에서 import하지 않음
- `tools/simulate_companion_monster_patterns.mjs`: 동료 세 기술을 실제 수동 명령 경로로 실행하는 결정적 QA
- `tests/e2e/combat-full.playwright.mjs`: 대표 동료 기술을 카드·대상 직접 선택으로 실행
- `docs/analysis/COMPANION_MONSTER_PATTERN_QA.md`: 수동 기술 실행 기준으로 재생성한 20×12 보고서

---

### Task 1: fixture 스키마와 실제 roster 완전성 검증 분리

**Files:**

- Modify: `tests/unit/NormalEnemyPatternData.test.js`
- Create: `tests/unit/NormalEnemyRosterData.test.js`
- Create: `tests/unit/PatternValidationBoundary.test.js`
- Verify: `tests/unit/CompanionPatternData.test.js`
- Verify: `tests/unit/CompanionSkillIdentity.test.js`
- Verify: `js/data/validate.js`

**Interfaces:**

- Consumes: `validateCompanionPatternData(input): string[]`, `validateNormalEnemyPatternData(enemies): string[]`
- Produces: fixture 전용 스키마 테스트와 실제 `ENEMIES` 12종 roster 테스트의 독립 실패 경계

- [ ] **Step 1: fixture 테스트에 실제 roster import가 없다는 실패 조건을 고정한다**

`tests/unit/PatternValidationBoundary.test.js`를 만들고, `NormalEnemyPatternData.test.js`에서 실제 roster 의존성을 제거하기 전에 정적 경계 테스트를 추가한다.

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('fixture와 실제 roster 검증 경계', () => {
  it('일반 몬스터 fixture 테스트는 실제 roster를 import하지 않는다', () => {
    const source = readFileSync(
    new URL('./NormalEnemyPatternData.test.js', import.meta.url),
    'utf8',
    );
    expect(source).not.toContain("from '../../js/data/enemies.js'");
    expect(source).not.toContain('EXPECTED_PATTERNS');
    expect(source).not.toContain('EXPECTED_ACTION_CONTRACTS');
  });
});
```

- [ ] **Step 2: RED를 확인한다**

Run:

```powershell
npx.cmd vitest run tests/unit/PatternValidationBoundary.test.js
```

Expected: 실제 `ENEMIES` import와 expected table이 아직 같은 파일에 있으므로 새 경계 테스트가 FAIL.

- [ ] **Step 3: 실제 12종 검증을 별도 데이터 테스트로 이동한다**

`tests/unit/NormalEnemyRosterData.test.js`를 만들고 기존 상수와 실제 roster 테스트를 이동한다.

```js
import { describe, expect, it } from 'vitest';
import ENEMIES from '../../js/data/enemies.js';
import { validateNormalEnemyPatternData } from '../../js/data/validate.js';

const EXPECTED_NORMAL_ENEMY_IDS = [
  'zombie_patient_dormant',
  'zombie_common',
  'zombie_runner',
  'zombie_brute',
  'raider',
  'raider_elite',
  'zombie_horde',
  'rabid_dog',
  'zombie_acid',
  'zombie_bloater',
  'zombie_screamer',
  'zombie_charger',
];

describe('실제 일반 몬스터 roster 완전성', () => {
  it('일반 몬스터 12종의 ID가 정확히 일치한다', () => {
    expect(Object.keys(ENEMIES)).toEqual(EXPECTED_NORMAL_ENEMY_IDS);
  });

  it('실제 roster 전체가 패턴 스키마를 통과한다', () => {
    expect(validateNormalEnemyPatternData(ENEMIES)).toEqual([]);
  });
});
```

기존 `EXPECTED_PATTERNS`, `EXPECTED_ACTION_CONTRACTS`, `effectCore()`와 실제 행동 테이블 테스트는 값 변경 없이 이 새 파일로 함께 이동한다.

- [ ] **Step 4: 동료 fixture와 실제 데이터 검증이 이미 분리됐는지 고정한다**

`tests/unit/CompanionPatternData.test.js`는 `validFixture()`만 사용하고 실제 loadout/tactics를 import하지 않아야 한다. 실제 20종·60기술 검증은 `tests/unit/CompanionSkillIdentity.test.js`에 유지한다. 같은 `PatternValidationBoundary.test.js`에 다음 테스트를 추가한다.

```js
it('동료 fixture 테스트는 실제 동료 roster를 import하지 않는다', () => {
  const source = readFileSync(
    new URL('./CompanionPatternData.test.js', import.meta.url),
    'utf8',
  );
  expect(source).not.toContain('COMPANION_COMBAT_LOADOUTS');
  expect(source).not.toContain('COMPANION_TACTICS');
});
```

- [ ] **Step 5: 분리된 검증을 실행한다**

Run:

```powershell
npx.cmd vitest run tests/unit/PatternValidationBoundary.test.js tests/unit/CompanionPatternData.test.js tests/unit/NormalEnemyPatternData.test.js tests/unit/NormalEnemyRosterData.test.js tests/unit/CompanionSkillIdentity.test.js
node js/data/validate.js
```

Expected:

- fixture 테스트는 1종 fixture로 PASS
- 실제 roster 테스트는 일반 몬스터 12종, 동료 20종, 고유 기술 60개로 PASS
- validator `Errors: 0`

- [ ] **Step 6: Task 1을 커밋한다**

```powershell
git add -- tests/unit/PatternValidationBoundary.test.js tests/unit/CompanionPatternData.test.js tests/unit/NormalEnemyPatternData.test.js tests/unit/NormalEnemyRosterData.test.js
git commit -m "test(combat): separate fixture and roster contracts"
```

---

### Task 2: 모든 production 동료 턴을 수동 입력으로 고정

**Files:**

- Modify: `tests/unit/CombatSystem_companionStance.test.js`
- Modify: `tests/integration/CombatManualParty.int.test.js`
- Modify: `tests/integration/CombatCompanionTactics.int.test.js`
- Modify: `tests/unit/CombatCompanionLegacyRemoval.test.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/systems/CombatSystem.js`

**Interfaces:**

- Consumes: `_prepareCompanionTurn(npcId): boolean`, `executeSkillCommand()`
- Produces: `isManualCompanionTurn(combat): boolean`이 현재 combatant가 동료일 때 항상 `true`
- Removes from production: `_getCompanionStance()`, `_runCompanionTurn()`, `requestCompanionPlan()`

- [ ] **Step 1: 저장 stance와 무관하게 입력에서 멈추는 실패 테스트를 작성한다**

`tests/unit/CombatSystem_companionStance.test.js`의 자동 stance 기대를 다음 계약으로 교체한다.

```js
it.each([
  ['manual'],
  ['attack'],
  ['heal'],
  ['support'],
  ['hold'],
  [undefined],
])('저장 stance=%s여도 동료 턴은 수동 입력에서 멈춘다', (stance) => {
  const combat = setupCompanionTurn({ stance });
  const enemyHpBefore = combat.enemies[0].currentHp;

  CombatSystem.processUntilAllyTurn();

  expect(combat.phase).toBe('await_ally_input');
  expect(combat.activeCombatantId).toBe('npc_nurse');
  expect(CombatSystem.isManualCompanionTurn(combat)).toBe(true);
  expect(combat.enemies[0].currentHp).toBe(enemyHpBefore);
  expect(combat.actionSequence).toBe(0);
});
```

setup helper는 `stance === undefined`일 때 NPC state에 해당 property를 만들지 않는다.

- [ ] **Step 2: RED를 확인한다**

Run:

```powershell
npx.cmd vitest run tests/unit/CombatSystem_companionStance.test.js tests/integration/CombatManualParty.int.test.js
```

Expected: 현재 `attack/heal/support/hold`는 `_runCompanionTurn()`을 실행하고 턴을 넘기므로 FAIL.

- [ ] **Step 3: production 자동 planner 진입점이 없다는 테스트를 추가한다**

```js
it('CombatSystem은 동료 자동 계획 public API를 노출하지 않는다', () => {
  expect(CombatSystem.requestCompanionPlan).toBeUndefined();
  expect(CombatSystem._runCompanionTurn).toBeUndefined();
  expect(CombatSystem._getCompanionStance).toBeUndefined();
});
```

`tests/unit/CombatCompanionLegacyRemoval.test.js`에는 production import 경계도 추가한다.

```js
it('production combat은 개발용 companion tactic planner를 import하지 않는다', () => {
  const source = readFileSync(
    new URL('../../js/systems/combat/CombatAiTurns.js', import.meta.url),
    'utf8',
  );
  expect(source).not.toContain("from './CompanionTactics.js'");
  expect(source).not.toContain("from '../../data/companionTactics.js'");
});
```

Expected before implementation: 자동 API와 두 import가 존재하므로 FAIL.

- [ ] **Step 4: CombatAiTurns에서 production 자동 경로를 제거한다**

`js/systems/combat/CombatAiTurns.js`에서 다음을 제거한다.

```js
import { COMPANION_TACTICS } from '../../data/companionTactics.js';
import { planCompanionTurn } from './CompanionTactics.js';
```

그리고 아래 method를 제거한다.

```js
_getCompanionStance()
_planCompanionAction()
_runCompanionTurn()
requestCompanionPlan()
```

`_prepareCompanionTurn()`과 `_tickCompanionSkillCooldowns()`는 수동 동료 턴 시작 시 필요하므로 유지한다. `tests/integration/CombatCompanionTactics.int.test.js`의 production `_planCompanionAction()`, `_executePlannedCompanionAction()`, `requestCompanionPlan()` 테스트는 제거하고, 수동 command 결과 검증은 `CombatManualParty.int.test.js`로 통합한다. `tests/unit/CompanionTactics.test.js`의 순수 `planCompanionTurn()` 데이터 QA는 유지한다.

- [ ] **Step 5: 턴 루프를 항상 수동 입력으로 단순화한다**

`js/systems/CombatSystem.js::processUntilAllyTurn()`의 companion 분기를 다음 의미로 변경한다.

```js
if (active?.sourceType === 'companion') {
  const npcId = active.sourceId ?? active.id;
  this._prepareCompanionTurn(npcId);
  combat.phase = 'await_ally_input';
  return true;
}
```

`_processAiTurns()`의 companion 분기도 자동 실행 없이 다음과 같이 반환한다.

```js
if (entry.type === 'companion') {
  this._prepareCompanionTurn(entry.id);
  this.beginActiveTurn();
  return;
}
```

`isManualCompanionTurn()`은 stance 대신 현재 entry만 검사한다.

```js
isManualCompanionTurn(combat = GameState.combat) {
  const entry = this._currentEntry(combat);
  return entry?.type === 'companion';
}
```

`_setupCombat()`의 초기 active index 조건은 모든 동료를 수동 아군으로 취급한다.

```js
gs.combat.activeIdx = Math.max(0, gs.combat.turnQueue.findIndex(
  entry => entry.type === 'player' || entry.type === 'companion',
));
```

- [ ] **Step 6: 실제 수동 카드 실행 회귀를 강화한다**

`tests/integration/CombatManualParty.int.test.js`에서 저장 stance가 `attack`인 동료도 직접 선택 전에는 상태가 변하지 않고, 직접 확정한 후에만 한 번 진행되는지 검증한다.

```js
expect(CombatSystem.selectSkill('nurse_scalpel')).toBe(true);
expect(CombatSystem.selectTarget('enemy:0')).toBe(true);
const before = combat.enemies[0].currentHp;
const result = CombatSystem.confirmAction();

expect(result.ok).toBe(true);
expect(combat.enemies[0].currentHp).toBeLessThan(before);
expect(combat.actionSequence).toBe(1);
expect(combat.activeCombatantId).not.toBe('npc_nurse');
```

잘못된 대상 선택은 턴을 소비하지 않고 같은 동료의 입력 상태를 유지해야 한다.

```js
expect(CombatSystem.selectSkill('nurse_triage')).toBe(true);
expect(CombatSystem.selectTarget('enemy:0')).toBe(false);
expect(combat.phase).toBe('select_target');
expect(combat.activeCombatantId).toBe('npc_nurse');
expect(combat.actionSequence).toBe(0);
```

- [ ] **Step 7: GREEN을 확인한다**

Run:

```powershell
npx.cmd vitest run tests/unit/CombatSystem_companionStance.test.js tests/integration/CombatManualParty.int.test.js tests/integration/CombatCompanionTactics.int.test.js tests/unit/CombatCompanionLegacyRemoval.test.js
```

Expected: 모든 저장 stance가 수동 입력에서 멈추고 실제 카드 확정만 턴을 소비하며 PASS.

- [ ] **Step 8: Task 2를 커밋한다**

```powershell
git add -- js/systems/combat/CombatAiTurns.js js/systems/CombatSystem.js tests/unit/CombatSystem_companionStance.test.js tests/integration/CombatManualParty.int.test.js tests/integration/CombatCompanionTactics.int.test.js tests/unit/CombatCompanionLegacyRemoval.test.js
git commit -m "refactor(combat): require manual companion turns"
```

---

### Task 3: stance·one-shot 자동행동 UI 제거

**Files:**

- Modify: `tests/integration/CombatPhase2_stance.int.test.js`
- Modify: `tests/integration/CombatUIRankLineup.int.test.js`
- Modify: `js/ui/CombatUI.js`
- Modify: `css/screens-combat.css`

**Interfaces:**

- Consumes: `CombatSystem.isManualCompanionTurn(combat)`
- Produces: 현재 동료의 `combat.skillsById` 카드와 target selector만 표시하는 command deck
- Removes: `_renderStanceSelector()`, `_bindCompanionPlanButtons()`, `[data-plan-stance]`

- [ ] **Step 1: 자동행동 UI가 존재하지 않아야 하는 실패 테스트를 작성한다**

`tests/integration/CombatPhase2_stance.int.test.js`의 빠른 계획 테스트를 제거하고 다음 계약으로 교체한다.

```js
describe('동료 완전 수동 UI', () => {
  it('동료 차례에 stance와 빠른 자동행동 버튼을 렌더하지 않는다', () => {
    setupManualNurseTurn({ savedStance: 'attack' });
    CombatUI.render();

    expect(document.querySelector('[data-plan-stance]')).toBeNull();
    expect(document.querySelector('.stance-btn')).toBeNull();
    expect(document.querySelector('.companion-plan-row')).toBeNull();
    expect(document.querySelector('[data-skill-id="nurse_scalpel"]')).not.toBeNull();
    expect(document.querySelector('[data-skill-id="nurse_triage"]')).not.toBeNull();
    expect(document.querySelector('[data-skill-id="nurse_encourage"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: RED를 확인한다**

Run:

```powershell
npx.cmd vitest run tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatUIRankLineup.int.test.js
```

Expected: `_renderStanceSelector()`가 네 one-shot 버튼을 만들므로 FAIL.

- [ ] **Step 3: CombatUI의 stance 렌더링과 event binding을 제거한다**

`js/ui/CombatUI.js::_renderFocusedInternal()`에서 `companionPlanControls`를 제거하고 footer에는 기술 bar를 직접 렌더한다.

```js
<footer class="combat-command-deck">
  ${this._renderSkillBar(active, combat)}
  ${this._renderCombatItemSlot(active)}
  ...
</footer>
```

아래 호출과 method를 제거한다.

```js
this._bindCompanionPlanButtons();
CombatUI._renderStanceSelector()
CombatUI._bindCompanionPlanButtons()
```

`_renderCompanionsPanel()`에서도 `${stanceHtml}`을 제거해 비전투 동료 패널에 stance 버튼이 나타나지 않게 한다.

- [ ] **Step 4: stance 전용 CSS를 제거한다**

`css/screens-combat.css`에서 다음 selector 블록을 제거한다.

```css
.cpp-stance-row .stance-btn
.cpp-stance-row .stance-btn:hover
.cpp-stance-row .stance-btn.active
.companion-plan-row
.companion-plan-btn
.companion-stance-label
```

`manual-companion-turn`에서 플레이어 전용 카드를 숨기는 기존 규칙과 동료 기술 카드 레이아웃은 유지한다.

- [ ] **Step 5: UI GREEN을 확인한다**

Run:

```powershell
npx.cmd vitest run tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatUIRankLineup.int.test.js tests/integration/CombatFocusedUI.int.test.js
```

Expected:

- stance/자동 계획 selector 0개
- 동료 기술 카드 3개 표시
- 저장 stance가 UI 결과에 영향 없음

- [ ] **Step 6: Task 3을 커밋한다**

```powershell
git add -- js/ui/CombatUI.js css/screens-combat.css tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatUIRankLineup.int.test.js
git commit -m "feat(combat): expose only manual companion controls"
```

---

### Task 4: 시뮬레이터를 실제 수동 명령 경로로 전환

**Files:**

- Modify: `tools/simulate_companion_monster_patterns.mjs`
- Modify: `docs/analysis/COMPANION_MONSTER_PATTERN_QA.md`
- Modify: `tests/e2e/combat-full.playwright.mjs`
- Create: `tests/unit/CombatPatternSimulator.test.js`

**Interfaces:**

- Consumes: `CombatSystem.selectSkill(skillId)`, `selectTarget(targetId)`, `confirmAction()`
- Produces: 동료 20종×일반 몬스터 12종×각 동료 3기술의 수동 command 실행 QA

- [ ] **Step 1: simulator가 자동 planner를 사용하지 않는 실패 검사를 추가한다**

`tests/unit/CombatPatternSimulator.test.js`에서 simulator source가 production 자동 helper를 호출하지 않는지 검사한다.

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('수동 동료 패턴 simulator 경계', () => {
  it('production 자동 planner API를 호출하지 않는다', () => {
    const source = readFileSync(
      new URL('../../tools/simulate_companion_monster_patterns.mjs', import.meta.url),
      'utf8',
    );

    expect(source).not.toContain('CombatSystem._planCompanionAction(');
    expect(source).not.toContain('CombatSystem._executePlannedCompanionAction(');
    expect(source).not.toContain('CombatSystem.requestCompanionPlan(');
    expect(source).not.toContain('CombatSystem._getCompanionStance(');
  });
});
```

- [ ] **Step 2: RED를 확인한다**

Run:

```powershell
npx.cmd vitest run tests/unit/CombatPatternSimulator.test.js
```

Expected: 현재 simulator가 `_planCompanionAction()`과 `_executePlannedCompanionAction()`을 호출하므로 FAIL.

- [ ] **Step 3: 각 기술을 실제 수동 command로 실행한다**

각 companion/enemy/run/skill 조합마다 fresh combat state를 만든다. 현재 동료를 active combatant로 지정한 후 다음 경로만 사용한다.

```js
CombatSystem.processUntilAllyTurn();

if (GameState.combat.activeCombatantId !== companionId) {
  metrics.invalidManualTurn++;
  return;
}
if (!CombatSystem.selectSkill(skillId)) {
  metrics.invalidSkillSelections++;
  return;
}
if (!CombatSystem.selectTarget(targetId)) {
  metrics.invalidTargetSelections++;
  return;
}

const result = CombatSystem.confirmAction();
if (!result?.ok) {
  metrics.commandFailures++;
}
```

`targetId`는 skill target 계약으로 결정한다.

```js
function targetIdForManualSkill(skill, state) {
  if (skill.target?.selfOnly) return state.companion.id;
  if (skill.target?.side === 'enemy') return state.enemy.id;
  return state.lowestHpAlly.id;
}
```

유효 랭크가 필요한 기술은 `validateSkillPosition()`을 사용해 fresh formation을 구성한 뒤 실행한다. 임의로 validation을 우회하지 않는다.

- [ ] **Step 4: 보고서 지표를 수동 조작 기준으로 바꾼다**

다음 지표를 출력한다.

- 20 동료 / 60 고유 기술 / 12 일반 몬스터 cardinality
- 각 동료의 세 기술별 수동 실행 횟수와 성공률
- invalid skill/target/position
- command failure
- 비용·쿨다운 중복 소비
- 비치료 기술의 heal 발생
- 적 intent/action ID·target mismatch
- 동료 대상 multi-hit/status loss
- declared counter 실행 누락
- invalid `motionKey`

`preferredStance`, `no plan`, 자동 선택 분포는 보고서에서 제거한다.

- [ ] **Step 5: 대표 E2E를 수동 카드 클릭으로 변경한다**

`tests/e2e/combat-full.playwright.mjs`의 `_planCompanionAction()` 호출을 제거하고 실제 DOM 또는 production command API를 사용한다.

```js
const action = await page.evaluate(({ skillId, targetId }) => {
  const selected = window.CombatSystem.selectSkill(skillId);
  const targeted = selected && window.CombatSystem.selectTarget(targetId);
  const result = targeted ? window.CombatSystem.confirmAction() : null;
  return { selected, targeted, result };
}, {
  skillId: 'nurse_triage',
  targetId: 'npc_nurse',
});

record(
  'pattern: nurse triage is manually selected and confirmed',
  action.selected && action.targeted && action.result?.ok === true,
  JSON.stringify(action),
);
```

대표 6조합의 기존 의미는 유지한다.

- 간호사/산성 좀비
- 탈영병/정예 약탈자
- 아이/광견
- 소방관/차저
- 정비사/블로터
- 개/호드

- [ ] **Step 6: 1회 smoke와 500회 보고서를 생성한다**

Run:

```powershell
node tools/simulate_companion_monster_patterns.mjs --runs 1 --seed 20260727 --out tmp/manual-companion-smoke.md
node tools/simulate_companion_monster_patterns.mjs --runs 500 --seed 20260727 --out docs/analysis/COMPANION_MONSTER_PATTERN_QA.md
```

Expected:

- companions 20
- skills 60
- enemies 12
- combinations 240
- manual skill executions에 대한 warnings 0, violations 0

- [ ] **Step 7: pattern E2E를 실행한다**

Run:

```powershell
node tests/e2e/combat-full.playwright.mjs --pattern-only
```

Expected: 대표 수동 동료 행동과 적 pattern assertion 전부 PASS. sandbox의 Chromium `spawn EPERM`이면 동일 명령을 승인된 외부 실행으로 재시도한다.

- [ ] **Step 8: Task 4를 커밋한다**

```powershell
git add -- tests/unit/CombatPatternSimulator.test.js tools/simulate_companion_monster_patterns.mjs docs/analysis/COMPANION_MONSTER_PATTERN_QA.md tests/e2e/combat-full.playwright.mjs
git commit -m "test(combat): verify manual companion commands"
```

---

### Task 5: 전체 회귀 검증과 제거 계약 확정

**Files:**

- Verify: `js/systems/CombatSystem.js`
- Verify: `js/systems/combat/CombatAiTurns.js`
- Verify: `js/ui/CombatUI.js`
- Verify: `css/screens-combat.css`
- Verify: `tests/`

**Interfaces:**

- Consumes: Tasks 1–4의 최종 production·test 계약
- Produces: production 자동 동료 행동 0개, stance UI 0개, 전체 검증 결과

- [ ] **Step 1: production 자동 경로 정적 검사를 실행한다**

Run:

```powershell
rg -n "_runCompanionTurn|requestCompanionPlan|_getCompanionStance|_planCompanionAction|_executePlannedCompanionAction|data-plan-stance|_renderStanceSelector|_bindCompanionPlanButtons" js
```

Expected: production `js/` 결과 0개. 개발용 `planCompanionTurn()`과 `COMPANION_TACTICS` 자체는 허용한다.

- [ ] **Step 2: 핵심 수동 전투 테스트를 실행한다**

Run:

```powershell
npx.cmd vitest run tests/unit/CombatSystem_companionStance.test.js tests/integration/CombatManualParty.int.test.js tests/integration/CombatPhase2_stance.int.test.js tests/integration/CombatFocusedUI.int.test.js tests/integration/CombatUIRankLineup.int.test.js tests/unit/CombatSkillSystem.test.js tests/unit/CombatSystem_rankedPipeline.test.js
```

Expected: 전부 PASS.

- [ ] **Step 3: fixture·roster 검증을 실행한다**

Run:

```powershell
npx.cmd vitest run tests/unit/CompanionPatternData.test.js tests/unit/NormalEnemyPatternData.test.js tests/unit/NormalEnemyRosterData.test.js tests/unit/CompanionSkillIdentity.test.js
node js/data/validate.js
```

Expected: 테스트 PASS, validator `Errors: 0`.

- [ ] **Step 4: 전체 테스트와 production build를 실행한다**

Run:

```powershell
npm.cmd test
npm.cmd run build:web
```

Expected: Vitest failure 0, Vite build exit 0. 기존 Node module type 경고와 sandbox webfont 다운로드 경고는 별도 warning으로 기록하되 성공을 오인하지 않는다.

- [ ] **Step 5: simulator와 브라우저 E2E를 재실행한다**

Run:

```powershell
node tools/simulate_companion_monster_patterns.mjs --runs 500 --seed 20260727 --out docs/analysis/COMPANION_MONSTER_PATTERN_QA.md
node tests/e2e/combat-full.playwright.mjs --pattern-only
```

Expected: simulator warnings 0 / violations 0, pattern E2E failure 0.

- [ ] **Step 6: 커밋 범위와 사용자 변경 보존을 확인한다**

Run:

```powershell
git diff --check
git diff --cached --check
git status --short
```

Expected:

- 이 계획의 파일에 unstaged 구현 변경이 없음
- index가 비어 있음
- 기존 사용자 이미지·UI·데이터 변경은 unstaged 상태로 보존

- [ ] **Step 7: 검증 문서 변경이 필요한 경우에만 커밋한다**

Task 4에서 생성한 QA 문서가 검증 재실행으로 변경되지 않았다면 추가 커밋을 만들지 않는다. 결정적 출력 차이가 있을 때만 원인을 수정하고 Task 4 커밋에 포함될 수 있도록 별도 fix commit을 만든다.

---

## 최종 합격 기준

- `CombatSystem`은 동료 차례마다 `await_ally_input`에서 멈춘다.
- 저장 `stance`가 어떤 값이든 동료는 자동 행동하지 않는다.
- 동료는 실제 기술 카드와 대상을 직접 선택하기 전까지 턴·HP·토큰·비용·쿨다운을 변경하지 않는다.
- production UI에 stance와 one-shot 자동 계획 버튼이 없다.
- production `js/`에서 동료 자동 planner 진입점이 없다.
- fixture 테스트는 실제 roster를 import하지 않는다.
- 실제 데이터 테스트와 validator는 12 몬스터·20 동료·60 기술을 검증한다.
- simulator와 E2E는 자동 planner가 아니라 실제 수동 명령 경로를 실행한다.
- 전체 테스트, validator, 500회 simulator, build, pattern E2E가 통과한다.
