# 보스 패턴 Production 경로 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 네임드 보스 21종을 실제 전투 경로에서 기본공격 2개, 특수기 1개, HP 30% 필살기 1개로 동작시키고 의도 UI·저장 상태·효과·모션 페이로드가 같은 예약 행동을 사용하게 한다.

**Architecture:** `SECRET_ENEMIES`는 선언형 `bossPattern`만 소유하고, 순수 함수 모듈 `BossPatternController`가 보스 행동 예약과 필살기 상태 전이를 담당한다. 기존 `EnemyActionPlanner`와 `EnemyActionExecutor`를 확장해 일반 몬스터와 보스가 같은 대상 선택·효과 실행 경로를 사용하며, `CombatAiTurns`는 예약 행동을 다시 추첨하지 않고 어댑터 역할만 맡는다.

**Tech Stack:** Vanilla JavaScript ES modules, Vitest, happy-dom, Vite, 기존 `CombatSystem`/`GameState`/`EventBus`

## Global Constraints

- 대상은 `js/data/secretEnemies.js`의 `isBoss: true` 정의 21종이다.
- 기본공격과 일반공격은 같은 개념이며 별도의 `normalSkills` 또는 `normal` category를 만들지 않는다.
- 모든 보스는 `basicAttacks` 정확히 2개, `specialSkill` 정확히 1개, `ultimate` 정확히 1개를 가진다.
- 두 기본공격은 피해량 외에 대상 정책, 위치 변화, 상태 이상, 연타 여부 중 최소 한 가지가 달라야 한다.
- 모든 행동은 `motionKey`, `impactFx`, `movement`를 명시하며 총기·투사체 행동의 `movement`는 `none`이다.
- 특수기는 조건과 쿨다운을 만족할 때 행동 선택 시 정확히 30% 확률로 선택한다.
- 필살기는 HP 30% 이하에서 전투당 1회 예약하며 예고를 시작한 순간 `ultimateUsed`를 확정한다.
- 다른 행동이 `telegraphing` 중이면 그 행동을 끝까지 유지하고 `ultimatePending`으로 예약한 뒤 종료 직후 필살기 예고를 시작한다.
- 필살기가 기술별 카운터로 취소되어도 사용 기회는 소모한다.
- 전투 중 식량 봉인은 만들지 않으며 식량 군벌의 대응 효과는 `healing_received_down`으로 구현한다.
- 일반 몬스터의 `specialSkills`와 `timedThreat` 데이터 계약은 유지한다.
- 동료 턴은 항상 manual이며 플레이어가 기술 카드와 대상을 직접 선택한다.
- Task 1은 축소 fixture로 스키마만 검증하고 실제 21종 완전성은 Task 5에서 검증한다.
- 기존 공용 적 행동 실행기와 중복되는 보스 전용 피해 실행기를 만들지 않는다.
- 사용자 요청에 따라 현재 `master`에서 작업하며 원격 push는 별도 요청 전에는 수행하지 않는다.

---

## Task 1: 보스 패턴 fixture 계약과 validator 분리

**Files:**

- Create: `tests/unit/BossPatternSchema.test.js`
- Modify: `js/data/validate.js`
- Test: `tests/unit/BossPatternSchema.test.js`

**Interfaces:**

- Consumes: 독립 객체 형태의 축소 보스 fixture
- Produces: `validateBossPatternSchema(bosses): string[]`

- [ ] **Step 1: 축소 fixture 실패 테스트 작성**

`tests/unit/BossPatternSchema.test.js`에서 실제 `SECRET_ENEMIES`를 import하지 않는다. 다음 최소 fixture를 사용한다.

```js
const bossFixture = {
  fixture_boss: {
    id: 'fixture_boss',
    isBoss: true,
    bossPattern: {
      basicAttacks: [
        {
          id: 'fixture_jab',
          category: 'basic',
          damage: [4, 6],
          targetPolicy: 'frontmost',
          motionKey: 'fixture_jab',
          impactFx: 'claw',
          movement: 'lunge',
          effects: [],
        },
        {
          id: 'fixture_sweep',
          category: 'basic',
          damage: [3, 5],
          targetPolicy: 'all',
          targetCount: 2,
          motionKey: 'fixture_sweep',
          impactFx: 'slash',
          movement: 'lunge',
          effects: [],
        },
      ],
      specialSkill: {
        id: 'fixture_guard',
        category: 'special',
        cooldown: 4,
        motionKey: 'fixture_guard',
        impactFx: 'buff',
        movement: 'none',
        effects: [{ type: 'selfStatus', id: 'defense_up', duration: 2, value: 0.25 }],
      },
      ultimate: {
        id: 'fixture_end',
        category: 'ultimate',
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
        motionKey: 'fixture_end',
        impactFx: 'blast',
        movement: 'none',
        damage: [10, 14],
        effects: [],
      },
      passives: [],
    },
  },
};
```

정상 fixture는 오류 0개여야 하며 다음 변형은 각각 실패해야 한다.

- `basicAttacks`가 1개 또는 3개
- `normalSkills` 필드 존재
- `specialSkill.category !== 'special'`
- `ultimate.hpThreshold !== 0.3`
- `ultimate.telegraphTurns !== 1`
- `ultimate.oncePerCombat !== true`
- 비어 있는 `id` 또는 `motionKey`
- 비어 있는 `impactFx` 또는 허용값이 아닌 `movement`
- 역전된 `damage: [8, 3]`
- 두 기본공격의 `targetPolicy`, `targetCount`, 상태 효과, 연타 수가 모두 같음

- [ ] **Step 2: 실패 확인**

Run: `npm.cmd test -- tests/unit/BossPatternSchema.test.js`

Expected: `validateBossPatternSchema` export 부재로 FAIL.

- [ ] **Step 3: validator 구현**

`js/data/validate.js`에 `validateBossPatternSchema(bosses = {})`를 export한다. 이 함수는 roster 개수를 검사하지 않고 전달된 fixture의 필드와 관계만 검사한다. 행동 공통 검증은 내부 `validateBossAction(action, expectedCategory, path)` 헬퍼로 중복 없이 처리한다.

`movement`는 `none`, `lunge`, `advance`, `retreat`만 허용한다. 두 기본공격의
차이는 다음 서명을 비교한다.

```js
function basicIdentitySignature(action) {
  return JSON.stringify({
    targetPolicy: action.targetPolicy ?? 'frontmost',
    targetCount: action.targetCount ?? 1,
    hitCount: action.hitCount ?? 1,
    statusEffects: (action.effects ?? [])
      .filter(effect => effect?.type === 'targetStatus')
      .map(effect => effect.id)
      .sort(),
    forcedMoves: (action.effects ?? [])
      .filter(effect => effect?.type === 'forcedMove')
      .map(effect => effect.distance),
  });
}
```

- [ ] **Step 4: 단위 테스트 통과 확인**

Run: `npm.cmd test -- tests/unit/BossPatternSchema.test.js`

Expected: fixture 기반 schema 테스트 전부 PASS.

- [ ] **Step 5: 커밋**

```powershell
git add js/data/validate.js tests/unit/BossPatternSchema.test.js
git commit -m "test(combat): define final boss pattern schema"
```

---

## Task 2: 순수 보스 행동 상태 전이와 선택기 구현

**Files:**

- Create: `js/systems/combat/BossPatternController.js`
- Modify: `js/systems/combat/EnemyActionPlanner.js`
- Create: `tests/unit/BossPatternController.test.js`
- Modify: `tests/unit/EnemyActionPlanner.test.js`

**Interfaces:**

- Consumes: `enemy.bossPattern`, `_skillCooldowns`, 합법 대상 후보, 주입한 `random`
- Produces:
  - `createBossActionState(): BossActionState`
  - `normalizeBossActionState(value): BossActionState`
  - `reserveUltimateAfterDamage(input): BossActionState`
  - `commitNextBossAction(input): BossActionState`
  - `advanceBossAction(input): BossActionState`
  - `completeBossAction(input): BossActionState`
  - `commitEnemyActionDefinition(input): { committedAction }`

- [ ] **Step 1: 상태와 선택 우선순위 실패 테스트 작성**

`BossActionState`의 초기값을 다음으로 고정한다.

```js
expect(createBossActionState()).toEqual({
  committedAction: null,
  ultimatePending: false,
  ultimateUsed: false,
  lastBasicActionId: null,
});
```

다음을 각각 테스트한다.

- `random() === 0.299999`이고 특수기 쿨다운이 0이면 특수기 선택
- `random() === 0.3`이면 기본공격 선택
- 기본공격 A 다음에는 B 선택
- B가 조건 불충족이면 A 연속 선택 허용
- `ultimatePending`은 특수기 확률보다 우선
- 필살기 예고를 commit할 때 `ultimateUsed: true`
- 진행 중 `telegraphing` 행동은 새 행동으로 교체하지 않음
- 기절된 턴에는 `remainingTelegraphTurns`가 감소하지 않음

- [ ] **Step 2: B안 필살기 예약 실패 테스트 작성**

```js
const next = reserveUltimateAfterDamage({
  state: {
    committedAction: {
      actionId: 'long_special',
      category: 'special',
      state: 'telegraphing',
      targetIds: ['player'],
      remainingTelegraphTurns: 2,
      hitCount: 1,
      motionKey: 'long_special',
    },
    ultimatePending: false,
    ultimateUsed: false,
    lastBasicActionId: 'basic_a',
  },
  hpBefore: 40,
  hpAfter: 29,
  maxHp: 100,
  threshold: 0.3,
});

expect(next.committedAction.actionId).toBe('long_special');
expect(next.ultimatePending).toBe(true);
expect(next.ultimateUsed).toBe(false);
```

필살기 예고가 시작된 뒤 취소를 표시해 `completeBossAction()`을 호출해도 `ultimateUsed`가 `true`로 유지되는 테스트를 추가한다.

- [ ] **Step 3: 실패 확인**

Run: `npm.cmd test -- tests/unit/BossPatternController.test.js tests/unit/EnemyActionPlanner.test.js`

Expected: 신규 모듈과 export 부재로 FAIL.

- [ ] **Step 4: 임의 행동 commit 함수 구현**

`EnemyActionPlanner.js`에 다음 함수를 export하고 기존 `commitEnemyAction()`도 내부에서 이를 사용한다.

```js
export function commitEnemyActionDefinition({
  enemy,
  definition,
  category,
  candidates,
  random = Math.random,
}) {
  // targetPolicy, targetCount, telegraphTurns, hitCount, motionKey를
  // 기존 committedAction 형태로 정규화한다.
}
```

- [ ] **Step 5: 순수 컨트롤러 구현**

`BossPatternController.js`는 전역 상태를 import하지 않는다. 특수기 조건은 다음 공통 규칙으로 판정한다.

- `cooldowns[specialSkill.id] <= 0`
- `minHpRatio`, `maxHpRatio`가 있으면 현재 HP 비율이 범위 안
- `maxSummons`가 있으면 `context.activeSummons < maxSummons`
- `requiresStatusAbsent`가 있으면 해당 self status가 없음

필살기와 특수기가 아니면 두 기본공격 중 `lastBasicActionId`가 아닌 유효 행동을 우선하며 둘 다 유효하면 주입한 난수로 선택한다.

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm.cmd test -- tests/unit/BossPatternController.test.js tests/unit/EnemyActionPlanner.test.js`

Expected: 경계값 0.3, 기본공격 비연속, B안, 기절 지연 테스트 모두 PASS.

- [ ] **Step 7: 커밋**

```powershell
git add js/systems/combat/BossPatternController.js js/systems/combat/EnemyActionPlanner.js tests/unit/BossPatternController.test.js tests/unit/EnemyActionPlanner.test.js
git commit -m "feat(combat): add deterministic boss pattern controller"
```

---

## Task 3: 공용 적 행동 실행기에 선언형 보스 효과 추가

**Files:**

- Modify: `js/systems/combat/EnemyActionExecutor.js`
- Modify: `js/systems/combat/CombatStatusSystem.js`
- Modify: `tests/unit/EnemyActionExecutor.test.js`
- Create: `tests/unit/CombatHealingReceived.test.js`

**Interfaces:**

- Consumes: `bossPattern`의 `basicAttacks`, `specialSkill`, `ultimate` 및 typed `effects`
- Produces: 기존 `executeEnemyAction()` 반환값에 `resolvedEffects`
- Produces: `healCombatant()` 반환값에 `rawAmount`, `multiplier`, `prevented`
- Produces: action modifier `armorPiercing`, `executeThreshold`
- Produces: `resolveEnemyDamageResponsePassives(input): { resolvedPassives }`

- [ ] **Step 1: 보스 행동 정의 조회 실패 테스트 작성**

다음 category가 올바른 정의를 찾는지 검증한다.

- `basic`: `bossPattern.basicAttacks`
- `special`: `bossPattern.specialSkill`
- `ultimate`: `bossPattern.ultimate`
- 일반 몬스터 `basic`, `special`, `timed_threat`: 기존 경로 유지

- [ ] **Step 2: typed effect 실패 테스트 작성**

피해 0인 행동도 공격 판정을 만들지 않고 다음 effect service만 호출해야 한다.

```js
[
  { type: 'selfHeal', value: [8, 12] },
  { type: 'selfStatus', id: 'defense_up', duration: 2, value: 0.25 },
  { type: 'summon', enemyId: 'zombie_common', count: [1, 2], row: 'front' },
  { type: 'partyDamage', value: [5, 7] },
  { type: 'targetStatus', id: 'stun', duration: 1, chance: 0.5 },
  { type: 'battlefieldStatus', id: 'acid_pool', duration: 2, value: 4 },
  { type: 'forcedMove', distance: 1 },
  { type: 'resource', resource: 'morale', value: -15 },
  { type: 'weaponLock', tag: 'firearm', duration: 1 },
]
```

`damage`, `targetStatus`, `forcedMove`는 명중한 대상에만 적용하고 `selfHeal`, `selfStatus`, `summon`, `battlefieldStatus`는 대상 명중 여부와 독립적으로 한 번만 적용한다.

행동의 `armorPiercing`은 0~1 범위이며 방어 감소율을 뜻한다.
`executeThreshold`는 0~1 범위이며 대상이 그 HP 비율 이하일 때만
`executeBonusMultiplier`를 피해에 곱한다. 즉사 효과는 만들지 않는다.

`bossPattern.passives`는 다음 두 타입만 공용 경로에 추가한다.

```js
[
  { type: 'counterAttack', actionId: 'toxic_blood_counter', maxPerRound: 1 },
  { type: 'resistanceShift', source: 'lastDamageType', duration: 2, value: 0.5 },
]
```

반격은 원래 공격 해결이 끝난 뒤 살아 있는 공격자에게 지정 행동을 1회
예약해 실행하며 재귀 반격을 만들지 않는다. 저항 전환은 최근 받은
`damageType`만 감소시키고 다른 피해 속성에는 적용하지 않는다.

다음 순수 어댑터를 `EnemyActionExecutor.js`에서 export한다.

```js
export function resolveEnemyDamageResponsePassives({
  enemy,
  attackerId,
  damageType,
  isCounter = false,
  services,
}) {}
```

`isCounter === true`이면 `counterAttack`을 건너뛴다. `damageType`이 없으면
`resistanceShift`를 건너뛴다. `maxPerRound` 횟수 상태는 Task 4의 production
service가 관리하고 이 함수는 `queueCounterAction(actionId, attackerId,
maxPerRound)`와 `setResistanceShift(damageType, duration, value)` 호출만
결정한다.

- [ ] **Step 3: 치료 감소 실패 테스트 작성**

```js
const target = {
  hp: 40,
  maxHp: 100,
  statusEffects: [
    { id: 'healing_received_down', duration: 2, value: 0.5 },
    { id: 'healing_received_down', duration: 1, value: 0.25 },
  ],
};
const result = healCombatant(target, 20);
expect(result).toMatchObject({
  rawAmount: 20,
  multiplier: 0.5,
  prevented: 10,
  healed: 10,
});
```

동일 상태가 중첩되면 가장 강한 감소만 적용하며 multiplier는 0보다 작아지지 않는다.

- [ ] **Step 4: 실패 확인**

Run: `npm.cmd test -- tests/unit/EnemyActionExecutor.test.js tests/unit/CombatHealingReceived.test.js`

Expected: 보스 category와 typed service 및 치료 감소 미지원으로 FAIL.

- [ ] **Step 5: 실행기와 치료 경로 구현**

`executeEnemyAction()`의 services 계약에 다음 선택적 함수를 추가한다.

```js
healSelf(amount)
addSelfStatus(status)
damageParty(amount, metadata)
setBattlefieldStatus(status)
modifyResource(targetId, resource, value)
lockWeapon(targetId, tag, duration)
queueCounterAction(actionId, targetId)
setResistanceShift(damageType, duration, value)
```

기존 `summonEnemy`, `addNoise`, `damageTarget`, `addStatus`, `moveTarget`는 유지한다. 지원하지 않는 effect type은 `resolvedEffects`에 `{ type, skipped: true, reason: 'unsupported' }`를 기록해 데이터 누락을 테스트에서 발견할 수 있게 한다.

`healCombatant()`는 `target.statusEffects`와 `target._statusEffects`를 모두 읽되 같은 객체를 두 번 세지 않는다.

- [ ] **Step 6: 단위 테스트 통과 확인**

Run: `npm.cmd test -- tests/unit/EnemyActionExecutor.test.js tests/unit/CombatHealingReceived.test.js`

Expected: 신규 효과와 기존 일반 몬스터 실행기 테스트 모두 PASS.

- [ ] **Step 7: 커밋**

```powershell
git add js/systems/combat/EnemyActionExecutor.js js/systems/combat/CombatStatusSystem.js tests/unit/EnemyActionExecutor.test.js tests/unit/CombatHealingReceived.test.js
git commit -m "feat(combat): execute typed boss action effects"
```

---

## Task 4: Production 턴·피해·저장 경로에 보스 상태 결선

**Files:**

- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/systems/combat/CombatRankedEffects.js`
- Modify: `js/ui/CombatUI.js`
- Modify: `js/data/locales.js`
- Create: `tests/integration/CombatBossIntent.int.test.js`
- Create: `tests/integration/CombatBossUltimate.int.test.js`
- Create: `tests/integration/CombatBossSaveRoundTrip.int.test.js`

**Interfaces:**

- Consumes: Task 2의 `BossPatternController`
- Consumes: Task 3의 `executeEnemyAction()` services 계약
- Produces: enemy instance의 `_bossActionState`

- [ ] **Step 1: 의도와 실행 동일성 실패 테스트 작성**

`_decideNextIntent()`가 commit한 `actionId`, `category`, `targetIds`, `motionKey`를 `_runSingleEnemyTurn()`이 그대로 실행하는지 검증한다. 실행 시 난수를 바꿔도 다른 행동으로 재추첨되지 않아야 한다.

- [ ] **Step 2: 필살기 임계점과 B안 실패 테스트 작성**

다음을 검증한다.

- 31/100에서 30/100으로 생존하면 `ultimatePending: true`
- 30/100에서 29/100 추가 피해는 중복 예약하지 않음
- 예고 중이 아니면 다음 의도가 `category: 'ultimate'`, `remainingTelegraphTurns: 1`
- 특수기 예고 2에서 임계점 통과 시 특수기 예고 1, 특수기 발동/취소, 필살기 예고 1, 필살기 발동 순서
- 필살기 취소 후 `ultimateUsed: true`
- 29/100에서 40/100으로 회복해도 예약 유지
- 보스가 죽으면 필살기 의도 생성 안 함

- [ ] **Step 3: 저장 왕복 실패 테스트 작성**

`GameState.serialize()`/`deserialize()` 뒤 다음 값이 동일해야 한다.

- `ultimatePending`
- `ultimateUsed`
- `lastBasicActionId`
- `committedAction.actionId`
- `committedAction.category`
- `committedAction.state`
- `committedAction.targetIds`
- `committedAction.remainingTelegraphTurns`
- `_skillCooldowns`

- [ ] **Step 4: 실패 확인**

Run: `npm.cmd test -- tests/integration/CombatBossIntent.int.test.js tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatBossSaveRoundTrip.int.test.js`

Expected: 보스 전용 production 결선 부재로 FAIL.

- [ ] **Step 5: 인스턴스 초기화와 턴 경로 결선**

`_instantiateEnemyFromDefinition(def)`에서 `def.isBoss === true && def.bossPattern`이면 `normalizeBossActionState()`로 `_bossActionState`를 만든다. `_decideNextIntent()`와 `_runSingleEnemyTurn()`은 보스에게 `_enemyActionState` 대신 `_bossActionState.committedAction`을 단일 기준으로 사용한다.

기존 일반 몬스터와 오래된 저장 파일은 현재 `_enemyActionState` 및 `_telegraph` 호환 경로를 유지한다.

- [ ] **Step 6: 피해 직후 임계점 결선**

`CombatRankedEffects._applyRankedDamageEffect()`에서 legacy enemy와 ranked target 동기화 직후, 보스가 살아 있으면 `reserveUltimateAfterDamage()`를 호출한다. `hpBefore`는 `applyDamage()` 전 legacy HP, `hpAfter`는 동기화 후 HP를 사용한다.

- [ ] **Step 7: typed effect services 결선**

`CombatAiTurns._executeEnemyCommittedAction()`이 Task 3의 신규 service를 실제
전투 상태에 연결한다. `partyDamage`는 살아 있는 플레이어와 동료 각각에
독립 피해를 적용하고, `selfHeal`은 ranked/legacy HP를 함께 동기화한다.
`damageTarget`에는 `armorPiercing`, `executeThreshold`,
`executeBonusMultiplier`, `damageType` metadata를 전달해 플레이어와 동료
모두 같은 방어 계산을 사용한다.

`CombatRankedEffects._applyRankedDamageEffect()`는 보스가 피해를 받고 생존한
뒤 `counterAttack`과 `resistanceShift` passive를 처리한다. 반격 행동에는
`isCounter: true`를 붙여 추가 반격을 금지하고 `maxPerRound`를 넘지 않게 한다.

- [ ] **Step 8: 의도 UI와 locale 보완**

보스 의도 모델에 `category: 'basic' | 'special' | 'ultimate'`를 유지하고 필살기는 일반 공격과 구분되는 아이콘과 문구를 사용한다. 예고 숫자는 `remainingTelegraphTurns`를 그대로 표시한다.

- [ ] **Step 9: 통합 테스트 통과 확인**

Run: `npm.cmd test -- tests/integration/CombatBossIntent.int.test.js tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatBossSaveRoundTrip.int.test.js tests/integration/CombatTelegraph.int.test.js tests/integration/CombatTimedTick.int.test.js`

Expected: 신규 보스 경로와 기존 일반 몬스터 예고 테스트 모두 PASS.

- [ ] **Step 10: 커밋**

```powershell
git add js/systems/combat/CombatAiTurns.js js/systems/combat/CombatRankedEffects.js js/ui/CombatUI.js js/data/locales.js tests/integration/CombatBossIntent.int.test.js tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatBossSaveRoundTrip.int.test.js
git commit -m "feat(combat): run boss patterns through committed actions"
```

---

## Task 5: 보스 21종 최종 데이터 이관과 완전성 검증

**Files:**

- Modify: `js/data/secretEnemies.js`
- Modify: `js/data/validate.js`
- Modify: `js/data/locales.js`
- Create: `tests/unit/BossPatternRoster.test.js`
- Modify: `tests/unit/SecretEnemiesCuration.test.js`
- Replace: `tests/unit/CombatBossPatterns.test.js`

**Interfaces:**

- Consumes: Task 1 schema, Task 3 typed effects
- Produces: `SECRET_ENEMIES[*].bossPattern`

- [ ] **Step 1: 21종 roster 실패 테스트 작성**

실제 `SECRET_ENEMIES`를 import하는 완전성 테스트는 다음을 검증한다.

```js
expect(bosses).toHaveLength(21);
for (const boss of bosses) {
  expect(boss.bossPattern.basicAttacks).toHaveLength(2);
  expect(boss.bossPattern.specialSkill.category).toBe('special');
  expect(boss.bossPattern.ultimate).toMatchObject({
    category: 'ultimate',
    hpThreshold: 0.3,
    telegraphTurns: 1,
    oncePerCombat: true,
  });
  expect(boss.bossPattern).not.toHaveProperty('normalSkills');
}
```

모든 행동 ID와 `motionKey`는 보스 내부에서 고유해야 하며 모든 행동에
`impactFx`와 `movement`가 있어야 한다. 모든 effect와 passive type은 Task 3
지원 목록에 포함되어야 한다.

- [ ] **Step 2: 실패 확인**

Run: `npm.cmd test -- tests/unit/BossPatternRoster.test.js`

Expected: 현재 21종에 `bossPattern`이 없어 FAIL.

- [ ] **Step 3: 21종 데이터를 승인된 역할로 이관**

`docs/superpowers/specs/2026-07-27-boss-pattern-overhaul-design.md`의 보스별 표를 사용해 다음 네 행동만 정의한다.

- `basicAttacks[0]`: 표의 첫 번째 기본공격
- `basicAttacks[1]`: 표의 두 번째 기본공격
- `specialSkill`: 표의 특수기
- `ultimate`: 표의 HP 30% 필살기

기존 `specialSkills`, `phaseThresholds`, `summon`, `aoeAttack`, `attacksPerRound`가 새 행동이나 passive와 중복되면 보스 정의에서 제거한다. 전투 외 보상·출현·약점·저항 데이터는 유지한다.

- [ ] **Step 4: 식량 군벌 효과 교체**

`food_warlord`의 특수기 또는 필살기는 전투 식량 사용 금지 대신 다음 상태를 모든 아군에게 적용한다.

```js
{
  type: 'targetStatus',
  id: 'healing_received_down',
  name: '치료 방해',
  duration: 2,
  value: 0.5,
}
```

locale 설명은 “받는 치료와 회복 효과 50% 감소”로 통일한다.

- [ ] **Step 5: production 기반 기존 테스트 교체**

레거시 `_runEnemyAI()`를 직접 호출해 효과를 검증하는 `CombatBossPatterns.test.js`를 삭제 후 같은 경로에 production `_runSingleEnemyTurn()` 또는 `executeEnemyAction()` 경로를 호출하는 테스트를 작성한다. 최소한 다음 보스를 대표 표본으로 포함한다.

- 소환: `boss_horde_mother`
- self heal 또는 self status: `boss_frozen_giant`
- ranged/execute: `boss_phantom_sniper`
- party damage: `boss_cult_leader`
- multi-hit: `boss_sewer_king`
- 적응/반격 passive: `boss_escaped_experiment`
- 치료 감소: `food_warlord`

- [ ] **Step 6: validator에 실제 roster 검증 진입점 추가**

`validate()` 본 실행에서만 `SECRET_ENEMIES`의 보스 수 21과 `validateBossPatternSchema(SECRET_ENEMIES)` 결과를 검사한다. Task 1의 export 함수 자체는 roster 수를 알지 않는다.

- [ ] **Step 7: 데이터와 production 테스트 통과 확인**

Run: `node js/data/validate.js`

Expected: 보스 패턴 관련 오류 0.

Run: `npm.cmd test -- tests/unit/BossPatternSchema.test.js tests/unit/BossPatternRoster.test.js tests/unit/SecretEnemiesCuration.test.js tests/unit/CombatBossPatterns.test.js`

Expected: 21종 구조·효과·production 실행 테스트 모두 PASS.

- [ ] **Step 8: 커밋**

```powershell
git add js/data/secretEnemies.js js/data/validate.js js/data/locales.js tests/unit/BossPatternRoster.test.js tests/unit/SecretEnemiesCuration.test.js tests/unit/CombatBossPatterns.test.js
git commit -m "feat(combat): migrate twenty one final boss patterns"
```

---

## Task 6: 행동별 motionKey와 impactFx 보존

**Files:**

- Modify: `js/systems/combat/EnemyActionExecutor.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/ui/combat/CombatFxPlayer.js`
- Modify: `js/ui/combat/combatUiAssets.js`
- Modify: `tests/unit/EnemyActionExecutor.test.js`
- Modify: `tests/unit/CombatPhase4_animations.test.js`

**Interfaces:**

- Consumes: `committedAction.motionKey`, 행동 정의의 `impactFx`, `movement`, `camera`
- Produces: FX payload의 동일 필드

- [ ] **Step 1: FX 의미 보존 실패 테스트 작성**

총기 보스 행동을 실행했을 때 다음 payload가 변형 없이 UI 큐에 전달되는지 검증한다.

```js
expect(fx).toMatchObject({
  kind: 'enemyAction',
  actionId: 'rifle_burst',
  category: 'basic',
  motionKey: 'rifle_burst',
  impactFx: 'shot',
  movement: 'none',
  camera: 'enemy-strike',
});
```

동료 대상에서도 `motionKey`와 `impactFx`가 유지되어야 한다.

- [ ] **Step 2: 실패 확인**

Run: `npm.cmd test -- tests/unit/EnemyActionExecutor.test.js tests/unit/CombatPhase4_animations.test.js`

Expected: 현재 `_monsterImpactFx()` 추론과 `enemyAttack` 변환에서 필드가 사라져 FAIL.

- [ ] **Step 3: 실행기와 어댑터 수정**

`EnemyActionExecutor`는 definition의 `impactFx`, `movement`, `camera`, action의 `category`를 `emitFx()`에 포함한다. `CombatAiTurns`는 이를 기존 `enemyAttack`/`enemyAttackCompanion` 시각 이벤트로 변환할 때 같은 필드를 유지하고 `impactFx`가 없을 때만 `_monsterImpactFx()`를 폴백으로 사용한다.

- [ ] **Step 4: UI 모션 선택 우선순위 수정**

`CombatFxPlayer`는 `motionKey` 기반 매니페스트가 있으면 해당 행과 이동을 사용하고, 없을 때만 `impactFx` 기반 CSS 모션으로 폴백한다. `impactFx: 'shot'`은 전진 lunge가 아니라 고정 사격을 사용한다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm.cmd test -- tests/unit/EnemyActionExecutor.test.js tests/unit/CombatPhase4_animations.test.js tests/unit/CombatSpriteSheetAssets.test.js`

Expected: 총기·근접·소환/버프 모션 의미와 기존 4행 폴백 테스트 모두 PASS.

- [ ] **Step 6: 커밋**

```powershell
git add js/systems/combat/EnemyActionExecutor.js js/systems/combat/CombatAiTurns.js js/ui/combat/CombatFxPlayer.js js/ui/combat/combatUiAssets.js tests/unit/EnemyActionExecutor.test.js tests/unit/CombatPhase4_animations.test.js
git commit -m "feat(combat): preserve boss action motion and impact fx"
```

---

## Task 7: 전체 전투 회귀와 통계 검증

**Files:**

- Create: `tools/simulate_boss_patterns.mjs`
- Modify: `docs/analysis/MONSTER_MOTION_AUDIT.md`
- Test: `tests/unit/BossPatternController.test.js`
- Test: `tests/unit/BossPatternRoster.test.js`
- Test: `tests/integration/CombatBossUltimate.int.test.js`

**Interfaces:**

- Consumes: production 데이터와 순수 `BossPatternController`
- Produces: seed 기반 요약 보고서

- [ ] **Step 1: 결정적 시뮬레이터 작성**

`tools/simulate_boss_patterns.mjs`는 `--runs`, `--seed`, `--out`을 받고 각 보스에 대해 최소 500회, 각 20 보스 턴을 실행한다. 출력에는 다음 값을 기록한다.

- 기본공격 A/B 사용 횟수
- 같은 기본공격 연속 선택 횟수와 불가피한 fallback 횟수
- 특수기 조건 충족 기회와 선택 횟수
- 필살기 임계점 도달, 예약, 예고, 발동/취소 횟수
- 지원되지 않은 effect type 횟수
- 대상 없음 또는 무효 action 횟수

- [ ] **Step 2: 자동 실패 기준 추가**

다음이면 process exit code 1을 반환한다.

- 보스 수가 21이 아님
- 어느 보스든 기본공격 A 또는 B 사용 횟수가 0
- 유효한 두 기본공격의 불필요한 연속 선택이 1회 이상
- 특수기 실측 선택률이 27% 미만 또는 33% 초과
- 임계점을 통과하고 생존한 필살기 예약률이 100%가 아님
- 필살기 사용 횟수가 전투당 1회를 초과
- 지원되지 않은 effect type이 1회 이상

- [ ] **Step 3: 보스 시뮬레이션 실행**

Run: `node tools/simulate_boss_patterns.mjs --runs 500 --seed 20260728 --out tmp/boss-pattern-qa.md`

Expected: exit code 0, 21 bosses, unsupported effects 0.

- [ ] **Step 4: 동료 수동 조작 및 일반 몬스터 회귀 실행**

Run: `node tools/simulate_companion_monster_patterns.mjs --runs 500 --seed 20260728 --out tmp/companion-monster-qa.md`

Expected: companions 20, skills 60, enemies 12, manual command violations 0.

- [ ] **Step 5: 관련 전체 테스트와 build 실행**

Run: `npm.cmd test -- tests/unit/EnemyActionPlanner.test.js tests/unit/EnemyActionExecutor.test.js tests/unit/BossPatternSchema.test.js tests/unit/BossPatternController.test.js tests/unit/BossPatternRoster.test.js tests/unit/CombatBossPatterns.test.js tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatBossIntent.int.test.js tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatBossSaveRoundTrip.int.test.js tests/integration/CombatManualParty.int.test.js tests/integration/CombatNormalEnemyIntent.int.test.js`

Expected: 지정 파일 전부 PASS.

Run: `npm.cmd run build`

Expected: Vite production build exit code 0.

- [ ] **Step 6: 감사 문서 갱신**

`docs/analysis/MONSTER_MOTION_AUDIT.md`에 production 효과 경로, 보스 21종 구조, 아직 남은 전용 스프라이트 제작 범위를 실제 검사 결과로 기록한다. 생성된 `tmp/*.md`는 커밋하지 않는다.

- [ ] **Step 7: 커밋**

```powershell
git add tools/simulate_boss_patterns.mjs docs/analysis/MONSTER_MOTION_AUDIT.md
git commit -m "test(combat): verify final boss pattern behavior"
```
