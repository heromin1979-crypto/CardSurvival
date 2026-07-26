# 네임드 보스 패턴 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 네임드 보스 21종이 기본공격, 일반공격 1~2개, 특수기 1개, HP 30% 필살기 1개를 일관된 규칙으로 사용하고, 예고 UI·실제 행동·저장 상태가 서로 어긋나지 않게 한다.

**Architecture:** `SECRET_ENEMIES`는 선언형 `bossPattern` 데이터만 보유하고, `BossPatternController`가 공용 `EnemyActionPlanner`의 행동 예약·대상 재검증 계약을 확장해 보스 우선순위·예고·쿨다운·필살기 상태 전이를 담당한다. `CombatAiTurns`는 컨트롤러가 확정한 행동을 실행하며, 피해·회복·소환·버프·전장 효과는 타입별 실행기로 분리한다. 모든 행동은 `motionKey`를 FX 큐에 전달하되, 전용 모션이 아직 없는 동안은 기존 모션으로 안전하게 폴백한다.

**Tech Stack:** Vanilla JavaScript ES modules, Vitest, happy-dom, Vite, 기존 `CombatSystem`/`GameState`/`EventBus`

## Global Constraints

- 승인된 설계 문서 `docs/superpowers/specs/2026-07-27-boss-pattern-overhaul-design.md`를 행동 규칙과 21종 기술 구성의 기준으로 사용한다.
- 일반 몬스터의 기존 `specialSkills`와 `timedThreat` 실행 규칙은 이 계획에서 마이그레이션하지 않는다.
- 공용 행동 객체와 대상 독립 실행기는 `2026-07-27-companion-monster-pattern-overhaul.md`에서 먼저 구현하고, 보스는 이를 확장한다.
- HP 30% 필살기는 전투당 1회이며, 예고를 시작한 순간 `ultimateUsed`를 확정한다.
- 이미 진행 중인 장기 예고는 끝까지 처리한 뒤 필살기를 직렬 실행한다.
- “식량 봉인”은 전투 중 아이템 봉인이 아니라 `healing_received_down` 상태로 구현한다.
- 0 피해 유틸리티 기술은 명중·회피·최소 1 피해 경로를 통과하지 않는다.
- 소환 상한, 사망 대상, 무효 위치 등 실행 시점에 바뀔 수 있는 조건만 재검증한다.
- 코드 수정 전에 현재 작업 트리의 사용자 변경을 다시 확인하고, 겹치는 파일은 기존 변경을 보존한다.

---

## Task 1: 보스 패턴 데이터 계약을 테스트로 고정

**Files:**

- Create: `tests/unit/BossPatternData.test.js`
- Modify: `js/data/validate.js`
- Test: `tests/unit/BossPatternData.test.js`

- [ ] **Step 1: 21종 보스의 필수 구조를 검사하는 실패 테스트 작성**

```js
import { describe, expect, it } from 'vitest';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';

const bosses = Object.values(SECRET_ENEMIES).filter(enemy => enemy.isBoss === true);

describe('named boss pattern data', () => {
  it('defines the approved action categories for every named boss', () => {
    expect(bosses).toHaveLength(21);
    for (const boss of bosses) {
      expect(boss.attack?.damage).toHaveLength(2);
      expect(boss.bossPattern.normalSkills.length).toBeGreaterThanOrEqual(1);
      expect(boss.bossPattern.normalSkills.length).toBeLessThanOrEqual(2);
      expect(boss.bossPattern.specialSkill).toBeTruthy();
      expect(boss.bossPattern.ultimate).toMatchObject({
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
      });
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/BossPatternData.test.js`

Expected: 현재 `bossPattern`이 없어 21종 검사 실패.

- [ ] **Step 3: `validate.js`에 재사용 가능한 보스 패턴 검증기 추가**

검증 항목:

- `normalSkills` 길이 1~2
- 모든 행동 ID가 보스 내부에서 유일함
- 행동 `category`, `cooldown`, `motionKey`, `effects` 형식
- 필살기 `hpThreshold === 0.3`, `telegraphTurns === 1`, `oncePerCombat === true`
- 피해 범위는 `[min, max]`, `0 <= min <= max`
- 소환 수와 지속시간은 양의 정수
- 확률은 0~1

- [ ] **Step 4: 데이터 검증 명령의 실패를 확인**

Run: `node --input-type=module js/data/validate.js`

Expected: 보스 데이터가 아직 이전 구조이므로 새 계약 오류 출력.

- [ ] **Step 5: 테스트 파일만 커밋**

```bash
git add tests/unit/BossPatternData.test.js js/data/validate.js
git commit -m "test(combat): define named boss pattern contract"
```

---

## Task 2: 순수 상태 전이 컨트롤러 구현

**Files:**

- Modify: `js/systems/combat/EnemyActionPlanner.js`
- Create: `js/systems/combat/BossPatternController.js`
- Create: `tests/unit/BossPatternController.test.js`

- [ ] **Step 1: 초기 상태와 행동 우선순위 실패 테스트 작성**

테스트해야 하는 순서:

1. 진행 중인 `telegraphing`
2. `ultimatePending`
3. 조건을 만족한 특수기
4. 순환 일반공격
5. 기본공격

```js
expect(createBossActionState()).toEqual({
  committedAction: null,
  ultimatePending: false,
  ultimateUsed: false,
  normalCursor: 0,
});
```

- [ ] **Step 2: 장기 예고와 필살기 중첩 테스트 작성**

```js
const crossed = reserveUltimateAfterDamage({
  state: {
    committedAction: {
      actionId: 'long_special',
      category: 'special',
      state: 'telegraphing',
      remainingTelegraphTurns: 2,
    },
    ultimatePending: false,
    ultimateUsed: false,
    normalCursor: 0,
  },
  hpBefore: 40,
  hpAfter: 29,
  maxHp: 100,
});

expect(crossed.ultimatePending).toBe(true);
expect(crossed.committedAction.actionId).toBe('long_special');
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/unit/BossPatternController.test.js`

Expected: 모듈을 찾지 못해 실패.

- [ ] **Step 4: 다음 공개 함수 구현**

```js
export function createBossActionState() {}
export function normalizeBossActionState(value) {}
export function reserveUltimateAfterDamage(input) {}
export function commitNextBossAction(input) {}
export function advanceCommittedAction(input) {}
export function completeCommittedAction(input) {}
export function tickBossCooldowns(cooldowns) {}
```

`commitNextBossAction`은 난수 함수를 인자로 받아 테스트가 결정적이어야 한다. 선택 결과는 다음 형태를 유지한다.

```js
{
  actionId,
  category: 'basic' | 'normal' | 'special' | 'ultimate',
  state: 'planned' | 'telegraphing' | 'ready',
  motionKey,
  targetId,
  remainingTelegraphTurns,
}
```

- [ ] **Step 5: 기절 시 예고 숫자가 줄지 않는 테스트 추가**

- [ ] **Step 6: 전체 단위 테스트 통과 확인**

Run: `npx vitest run tests/unit/BossPatternController.test.js`

Expected: 모든 상태 전이 테스트 통과.

- [ ] **Step 7: 커밋**

```bash
git add js/systems/combat/EnemyActionPlanner.js js/systems/combat/BossPatternController.js tests/unit/BossPatternController.test.js
git commit -m "feat(combat): add deterministic boss pattern controller"
```

---

## Task 3: 보스 인스턴스 초기화와 저장 왕복 결선

**Files:**

- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/data/enemies.js`
- Create: `tests/integration/CombatBossSaveRoundTrip.int.test.js`
- Modify: `tests/unit/CombatNewEnemies.test.js`

- [ ] **Step 1: 인스턴스별 독립 상태 테스트 작성**

같은 보스 정의에서 두 인스턴스를 만들었을 때 `_bossActionState`와 `_skillCooldowns`가 참조를 공유하지 않아야 한다.

- [ ] **Step 2: 저장 왕복 테스트 작성**

다음 상태를 `GameState.serialize()` → `GameState.deserialize()` 후 비교한다.

- `ultimatePending`
- `ultimateUsed`
- `normalCursor`
- `committedAction.state`
- `remainingTelegraphTurns`
- 행동별 쿨다운

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/integration/CombatBossSaveRoundTrip.int.test.js tests/unit/CombatNewEnemies.test.js`

- [ ] **Step 4: `_instantiateEnemyFromDefinition(def)`에서 상태 초기화**

`def.isBoss === true && def.bossPattern`인 경우에만 `createBossActionState()`를 사용한다. 정의 객체를 직접 변경하지 않는다.

- [ ] **Step 5: 구버전 전투 저장 마이그레이션**

`_bossActionState`가 없는 살아 있는 보스는 `normalizeBossActionState(null)`로 보충한다. 이전 `_telegraph`가 보스 기술을 가리키면 동일 행동의 `telegraphing` 상태로 변환하고, 일반 몬스터의 `_telegraph`는 유지한다.

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/integration/CombatBossSaveRoundTrip.int.test.js tests/unit/CombatNewEnemies.test.js tests/unit/GameState.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/systems/combat/CombatAiTurns.js js/data/enemies.js tests/integration/CombatBossSaveRoundTrip.int.test.js tests/unit/CombatNewEnemies.test.js
git commit -m "feat(combat): persist boss action state"
```

---

## Task 4: 의도 UI와 실행 행동을 하나의 예약 상태로 통합

**Files:**

- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/ui/CombatUI.js`
- Modify: `js/data/locales.js`
- Create: `tests/integration/CombatBossIntent.int.test.js`

- [ ] **Step 1: 같은 행동이 표시되고 실행되는지 실패 테스트 작성**

`_decideNextIntent()` 호출 뒤 난수 값을 바꿔도 `_runSingleEnemyTurn()`이 표시된 `actionId`를 실행해야 한다.

- [ ] **Step 2: 필살기 예고 인텐트 테스트 작성**

HP 30% 아래에서 다음 정보를 UI 모델이 반환해야 한다.

```js
{
  action: 'telegraph',
  category: 'ultimate',
  countdown: 1,
  actionId: 'boss_ultimate_id',
}
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/integration/CombatBossIntent.int.test.js`

- [ ] **Step 4: 보스 전용 결정 경로 결선**

- `_decideNextIntent()`는 예약이 없을 때만 `commitNextBossAction()`을 호출한다.
- `_runSingleEnemyTurn()`은 예약된 행동을 다시 추첨하지 않는다.
- 대상이 죽었거나 위치가 무효이면 같은 행동의 합법 대상만 다시 선택한다.
- 일반 몬스터 경로는 기존 구현을 유지한다.

- [ ] **Step 5: 한·영 인텐트 라벨 추가**

필살기, 특수기, 예고 유지, 예고 취소, 치유 감소, 소환 상한 도달 문구를 `js/data/locales.js`에 한·영 쌍으로 추가한다.

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/integration/CombatBossIntent.int.test.js tests/integration/CombatTelegraph.int.test.js tests/unit/CombatTimedIntent.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/systems/combat/CombatAiTurns.js js/ui/CombatUI.js js/data/locales.js tests/integration/CombatBossIntent.int.test.js
git commit -m "feat(combat): commit boss intent before execution"
```

---

## Task 5: 피해형·유틸리티형 행동 실행기를 분리

**Files:**

- Create: `js/systems/combat/BossActionExecutor.js`
- Create: `tests/unit/BossActionExecutor.test.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `tests/unit/CombatBossPatterns.test.js`

- [ ] **Step 1: 0 피해 유틸리티 회귀 테스트 작성**

소환·자기 회복·버프 행동은 `_dealDamageToAlly()`를 호출하지 않고도 성공해야 하며 플레이어 HP가 줄지 않아야 한다.

- [ ] **Step 2: 혼합 효과 순서 테스트 작성**

피해 뒤 상태이상, 소환 뒤 버프처럼 여러 효과가 있을 때 데이터 배열 순서대로 적용되는지 검증한다.

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/unit/BossActionExecutor.test.js tests/unit/CombatBossPatterns.test.js`

- [ ] **Step 4: 타입별 실행기 구현**

지원 타입:

- `damage`
- `partyDamage`
- `selfHeal`
- `summon`
- `selfBuff`
- `targetStatus`
- `battlefieldStatus`
- `forcedMove`

공개 함수는 전투 시스템 의존성을 주입받는다.

```js
export function executeBossAction({
  enemy,
  action,
  targetId,
  services,
  random = Math.random,
}) {}
```

- [ ] **Step 5: 기존 `_executeEnemySpecialSkill()`은 일반 몬스터 전용으로 유지**

보스만 `BossActionExecutor`를 거치게 하여 `timedThreat`와 예고형 일반 몬스터 회귀 범위를 제한한다.

- [ ] **Step 6: FX에 행동 의미 전달**

```js
this._fx({
  kind: 'enemyAction',
  enemyIdx,
  actionId: action.id,
  category: action.category,
  motionKey: action.motionKey,
  impactFx: action.impactFx,
});
```

전용 모션 시스템 도입 전에는 `CombatFxPlayer`가 `impactFx`를 기존 `lunge/heavy/spit/scream`으로 변환한다.

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run tests/unit/BossActionExecutor.test.js tests/unit/CombatBossPatterns.test.js tests/integration/CombatTelegraph.int.test.js`

- [ ] **Step 8: 커밋**

```bash
git add js/systems/combat/BossActionExecutor.js js/systems/combat/CombatAiTurns.js tests/unit/BossActionExecutor.test.js tests/unit/CombatBossPatterns.test.js
git commit -m "refactor(combat): separate boss action execution"
```

---

## Task 6: HP 30% 필살기 예약과 직렬 예고 구현

**Files:**

- Modify: `js/systems/combat/CombatRankedEffects.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Create: `tests/integration/CombatBossUltimate.int.test.js`

- [ ] **Step 1: 임계점 경계 테스트 작성**

다음을 모두 검증한다.

- 31% → 30%: 예약
- 30% → 29%: 이미 예약/사용이면 중복 없음
- 한 번에 여러 `phaseThresholds` 통과: 필살기 한 번
- 29%에서 회복해 40%가 되어도 예약 유지
- 예고 시작 뒤 취소되어도 `ultimateUsed === true`
- 소환된 부하에는 상태 전파 없음

- [ ] **Step 2: 장기 예고 직렬 실행 테스트 작성**

예상 행동열:

```text
특수기 예고 2 → 특수기 예고 1 → 특수기 발동 → 필살기 예고 1 → 필살기 발동
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run tests/integration/CombatBossUltimate.int.test.js`

- [ ] **Step 4: 피해 적용 직후 임계점 판정**

`_applyRankedDamageEffect()`에서 레거시 보스 HP 동기화가 끝난 직후 `reserveUltimateAfterDamage()`를 호출한다. 기존 `planned` 일반 행동은 필살기 예약으로 교체하지만 `telegraphing` 행동은 유지한다.

- [ ] **Step 5: 기절 처리**

보스가 기절한 자기 턴에는 행동과 예고 카운트다운을 모두 유지하고 턴만 소비한다.

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatTelegraph.int.test.js tests/integration/CombatTimedTick.int.test.js`

- [ ] **Step 7: 커밋**

```bash
git add js/systems/combat/CombatRankedEffects.js js/systems/combat/CombatAiTurns.js tests/integration/CombatBossUltimate.int.test.js
git commit -m "feat(combat): trigger one-shot boss ultimates at thirty percent"
```

---

## Task 7: 치유 효과 감소와 특수 상태 구현

**Files:**

- Modify: `js/systems/combat/CombatStatusSystem.js`
- Modify: `js/systems/combat/CombatRankedEffects.js`
- Modify: `js/data/locales.js`
- Create: `tests/unit/CombatHealingReceived.test.js`

- [ ] **Step 1: 치유 감소 실패 테스트 작성**

```js
const target = {
  hp: 40,
  maxHp: 100,
  statusEffects: [{ id: 'healing_received_down', duration: 2, value: 0.5 }],
};
expect(healCombatant(target, 20).healed).toBe(10);
```

중첩 시 가장 강한 감소만 적용하고, 100% 이상 감소하지 않으며, 아이템·스킬·동료 치유가 같은 함수를 통과하는지 검증한다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/CombatHealingReceived.test.js`

- [ ] **Step 3: `healCombatant()`를 단일 치유 초크 포인트로 확장**

반환값에 `rawAmount`, `multiplier`, `prevented`를 추가하여 로그와 UI가 감소량을 표시할 수 있게 한다.

- [ ] **Step 4: “식량 봉인” 기술을 `healing_received_down`으로 연결**

기술명은 세계관 표현을 유지할 수 있지만 실제 효과 설명은 “받는 치료 효과 감소”로 한·영 모두 명시한다.

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run tests/unit/CombatHealingReceived.test.js tests/integration/CombatTelegraph.int.test.js`

- [ ] **Step 6: 커밋**

```bash
git add js/systems/combat/CombatStatusSystem.js js/systems/combat/CombatRankedEffects.js js/data/locales.js tests/unit/CombatHealingReceived.test.js
git commit -m "feat(combat): add healing received reduction status"
```

---

## Task 8: 보스 21종 데이터를 승인안으로 마이그레이션

**Files:**

- Modify: `js/data/secretEnemies.js`
- Modify: `js/data/locales.js`
- Modify: `tests/unit/BossPatternData.test.js`
- Modify: `tests/unit/SecretEnemiesCuration.test.js`

- [ ] **Step 1: 21종을 설계 문서의 기술표와 동일하게 입력**

각 보스에 다음을 명시한다.

```js
bossPattern: {
  normalSkills: [{ id, category: 'normal', cooldown, motionKey, effects }],
  specialSkill: { id, category: 'special', cooldown, conditions, motionKey, effects },
  ultimate: {
    id,
    category: 'ultimate',
    hpThreshold: 0.3,
    telegraphTurns: 1,
    oncePerCombat: true,
    motionKey,
    effects,
  },
  passives: [],
}
```

- [ ] **Step 2: 기존 최상위 `summon`, `aoeAttack`, `phaseThresholds` 중 명시적 기술과 중복되는 효과 제거**

페이즈 전환 자체에 필요한 쿨다운 초기화·수치 변화만 남기고, 같은 소환이나 광역 피해가 기술과 페이즈에서 두 번 발동하지 않게 한다.

- [ ] **Step 3: 기존 `specialSkills` 호환 제거 시점을 한 번에 처리**

모든 21종이 마이그레이션되고 테스트가 통과한 커밋에서만 보스의 이전 `specialSkills`를 제거한다. 일반 몬스터의 `specialSkills`는 건드리지 않는다.

- [ ] **Step 4: 데이터 검증**

Run: `node --input-type=module js/data/validate.js`

Expected: 보스 패턴 관련 오류 0.

- [ ] **Step 5: 보스 데이터 테스트**

Run: `npx vitest run tests/unit/BossPatternData.test.js tests/unit/SecretEnemiesCuration.test.js tests/unit/CombatBossPatterns.test.js`

Expected: 21종 구성·고유 ID·효과 타입·필살기 공통 규칙 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add js/data/secretEnemies.js js/data/locales.js tests/unit/BossPatternData.test.js tests/unit/SecretEnemiesCuration.test.js
git commit -m "feat(combat): migrate twenty one named boss patterns"
```

---

## Task 9: 소환 상한·대상 무효·전투 종료 경계 강화

**Files:**

- Modify: `js/systems/combat/BossPatternController.js`
- Modify: `js/systems/combat/BossActionExecutor.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Create: `tests/integration/CombatBossPatternEdges.int.test.js`

- [ ] **Step 1: 경계 실패 테스트 작성**

- 적 진형이 가득 찬 경우 소환기를 선택하지 않음
- 예고 대상 동료가 사망하면 가능한 아군으로 재지정
- 대상이 없으면 행동을 안전하게 완료하고 쿨다운 적용
- 보스 사망 시 예약 필살기와 FX가 실행되지 않음
- 전투 종료 후 `_bossActionState`가 다음 전투 정의에 누출되지 않음

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/integration/CombatBossPatternEdges.int.test.js`

- [ ] **Step 3: 조건 평가와 실행 재검증 분리**

선택 시점 조건은 리듬 결정에 사용하고, 실행 시점에는 대상 생존·위치·진형 상한만 다시 확인한다. 재검증 실패가 다른 공격 재추첨으로 이어지지 않게 한다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/integration/CombatBossPatternEdges.int.test.js tests/integration/CombatBossUltimate.int.test.js`

- [ ] **Step 5: 커밋**

```bash
git add js/systems/combat/BossPatternController.js js/systems/combat/BossActionExecutor.js js/systems/combat/CombatAiTurns.js tests/integration/CombatBossPatternEdges.int.test.js
git commit -m "fix(combat): harden boss pattern execution edges"
```

---

## Task 10: 통합 회귀·밸런스 시뮬레이션·모션 계획 인계

**Files:**

- Create: `tools/simulate_boss_patterns.mjs`
- Create: `docs/analysis/BOSS_PATTERN_SIMULATION.md`
- Modify: `tests/integration/CombatBossIntent.int.test.js`

- [ ] **Step 1: 결정적 시드 기반 시뮬레이터 작성**

각 보스를 1,000회씩 실행하여 다음을 JSON과 Markdown으로 출력한다.

- 평균 생존 턴
- 기본/일반/특수/필살기 사용 횟수
- 필살기 예고 후 실제 발동률
- 같은 일반공격 연속 사용률
- 소환 상한 초과 횟수
- 의도와 실행 `actionId` 불일치 횟수

- [ ] **Step 2: 허용 기준 고정**

- 의도/실행 불일치 0
- 필살기 중복 0
- 소환 상한 초과 0
- 사용 가능한 두 일반공격의 연속 동일 선택 0
- HP 30%를 통과하고 생존한 보스의 필살기 예약률 100%

- [ ] **Step 3: 전체 전투 테스트**

Run: `npx vitest run tests/unit/CombatBossPatterns.test.js tests/unit/BossPatternController.test.js tests/unit/BossPatternData.test.js tests/unit/CombatTimedResolve.test.js tests/integration/CombatBossIntent.int.test.js tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatBossPatternEdges.int.test.js tests/integration/CombatTelegraph.int.test.js tests/integration/CombatTimedTick.int.test.js`

Expected: 전부 통과.

- [ ] **Step 4: 전체 프로젝트 검증**

Run: `npm test`

Expected: 기존 포함 전체 통과.

Run: `npm run build:web`

Expected: Vite production build 성공.

- [ ] **Step 5: 시뮬레이션 보고서 생성**

Run: `node tools/simulate_boss_patterns.mjs --runs 1000 --out docs/analysis/BOSS_PATTERN_SIMULATION.md`

Expected: 21종 모두 허용 기준 충족.

- [ ] **Step 6: 모션 시스템 인계 계약 확인**

모든 보스 FX에 `actionId`, `category`, `motionKey`가 포함되고, `2026-07-27-combat-motion-overhaul.md`의 런타임 레지스트리가 이를 소비할 수 있어야 한다.

- [ ] **Step 7: 커밋**

```bash
git add tools/simulate_boss_patterns.mjs docs/analysis/BOSS_PATTERN_SIMULATION.md tests/integration/CombatBossIntent.int.test.js
git commit -m "test(combat): verify named boss pattern distribution"
```
