# 보스 런타임 잔여 결함 수정 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` and `superpowers:test-driven-development`.

**Goal:** 커밋 `0664ea5`의 최종 production 재리뷰에서 재현된 보스 런타임 Important 5건을 공용 전투 경계에서 해결한다.

**Architecture:** 피해는 `CombatSystem._resolveDirectEnemyDamage()`를 단일 적 피격 경계로 유지하되 상태 피해가 기존 방어 계산에 의해 다시 감소하지 않도록 명시적 옵션을 사용한다. 라운드 수명은 무조건적인 `_skipNextRoundTick` 대신 현재 turn queue에서 라운드 종료 전 남은 아군 행동 기회를 기준으로 결정한다. 소환체 소비는 현재 행동자 identity를 보존한 채 queue를 재구성하고 legacy/ranked cursor를 함께 동기화한다.

**Tech Stack:** Vanilla JavaScript ES modules, Vitest, happy-dom

## Global Constraints

- 현재 `master`에서 작업하며 원격 push는 하지 않는다.
- 보스 21종의 `basicAttacks: 2`, `specialSkill: 1`, `ultimate: 1`, 특수기 30%, 필살기 HP 30%/전투당 1회/B안 예약 계약을 변경하지 않는다.
- 동료는 항상 manual이며 기술 카드와 대상을 플레이어가 직접 선택한다.
- 새 보스별 예외 분기를 추가하지 않고 공용 상태·피해·turn queue 경계에서 해결한다.
- RED 테스트가 실제 production 호출 순서를 재현해야 하며, 내부 상태를 결함이 없는 형태로 수동 조작해 통과시키면 안 된다.
- 기존 상태 DoT의 원시 피해량은 방어력으로 다시 감소시키지 않는다. 단, 무적·incoming damage reduction·enemy damage shield·`critical_mass` 예고 피해 누적은 공용 피격 경계와 동일하게 적용한다.
- 라운드 기반 enemy self status와 enemy shield는 부여 후 라운드 종료 전 살아 있는 플레이어/동료 행동 기회가 없을 때만 다음 round tick을 한 번 유예한다.

---

## Task 1: production 피해·상태 수명·소환체 queue 경계 수정

**Files:**

- Modify: `js/systems/CombatSystem.js`
- Modify: `js/systems/CombatActions.js`
- Modify: `js/systems/combat/CombatAiTurns.js`
- Modify: `js/systems/combat/CombatRankedEffects.js`
- Modify: `tests/unit/CombatBossFinalFix.test.js`
- Modify: `tests/integration/CombatBossUltimate.int.test.js`
- Modify: `tests/integration/CombatBossSaveRoundTrip.int.test.js` only if the persisted contract changes

**Interfaces:**

- Preserve: `CombatSystem._resolveDirectEnemyDamage(enemy, rawDamage, options)`
- Extend explicitly: status damage can bypass base defense while retaining invulnerability, incoming reduction, shield absorption, HP synchronization, death state, and telegraph accumulation.
- Add or extract: a single predicate for whether the current committed boss action still accepts counter-window damage (`telegraphing` and `ready`, not completed/cancelled/executing).
- Add or extract: a single turn-queue predicate for whether a living player/companion action remains before the next wrap.
- Preserve: `tickEnemyStatusEffects()` as a reusable function; inject or pass the production damage resolver instead of importing `CombatSystem` cyclically.

- [ ] **Step 1: `critical_mass` production window RED**

Create an integration-level test that advances the real boss intent from telegraph commit to its actual `ready` state without manually forcing `telegraphing`, then damages the boss for 100 before execution.

Expected RED:

- `telegraphDamageTaken` remains 0 on the current implementation.

Expected GREEN:

- `ready` counter window accumulates actual post-shield HP damage.
- completed, cancelled, or executing actions do not accumulate.
- legacy direct and ranked skill damage use the same predicate.

- [ ] **Step 2: `mother_feast` queue cursor RED**

Use a real queue equivalent to `[player, summoned zombie, other enemy, mother boss, summoned zombie]`, with the mother boss as the current actor. Execute the summon-consumption effect through the production service.

Expected RED:

- filtered queue preserves an out-of-range/stale `activeIdx` or `activeTurnIndex`, causing the next actor to repeat or the round to wrap early.

Expected GREEN:

- the current mother boss entry is found by stable identity after filtering.
- `activeIdx`, `activeTurnIndex`, and `activeCombatantId` point to the same current boss before `_advanceTurn()`.
- the next living actor follows the original cyclic order with no repeat and no premature round increment.
- formation and ranked combatant death state remain synchronized.

- [ ] **Step 3: enemy DoT common damage boundary RED**

Cover both per-enemy `_statusEffects` and legacy `combat.enemyStatus`.

Expected RED probes:

- invulnerable enemy loses HP from DoT.
- enemy shield is not consumed by DoT.
- `critical_mass` counter-window DoT does not accumulate actual damage.

Expected GREEN:

- status damage preserves its declared raw amount without base-defense reduction.
- invulnerability and incoming reduction apply.
- shield absorbs damage before HP.
- only actual HP loss accumulates toward `critical_mass`.
- ranked/legacy HP and dead state stay synchronized.
- log output reports actual HP damage rather than requested raw damage.

- [ ] **Step 4: enemy self-status duration RED**

Reproduce the real legacy order `player action → round status tick → enemy action applies duration:1 status → next player action`.

Expected RED:

- duration-1 invulnerability blocks two player actions.

Expected GREEN:

- it blocks exactly the next eligible player/companion action window and expires at the following round tick.
- when a ranked enemy applies the same status as the final actor with no remaining ally action before wrap, the immediate wrap tick is deferred once.
- when an ally action still remains before wrap, the status is not deferred.

- [ ] **Step 5: `food_warlord` shield duration RED**

Execute healing reduction through a ranked healing command in two initiative arrangements:

1. healer is the final actor before wrap;
2. another living ally actor remains before wrap.

Expected RED:

- case 1 immediately changes `remainingRounds: 2` to 1 before any ally can interact with the shield.

Expected GREEN:

- case 1 defers the immediate tick and preserves 2.
- case 2 does not defer because an ally action opportunity remains.
- both arrangements provide the same declared two-round opportunity contract rather than initiative-dependent 1–2 rounds.
- prevented-healing conversion ratio, guard 25% reduction, source ownership, and strongest-source selection remain unchanged.

- [ ] **Step 6: focused GREEN and regression verification**

Run at minimum:

```powershell
npm.cmd test -- tests/unit/CombatBossFinalFix.test.js tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatBossSaveRoundTrip.int.test.js
npm.cmd test
node js/data/validate.js
node tools/simulate_boss_patterns.mjs --runs 500 --seed 20260728 --out tmp/boss-runtime-residual.md
node tools/simulate_companion_monster_patterns.mjs --runs 500 --seed 20260728 --out tmp/companion-runtime-residual.md
npm.cmd run build
git diff --check
git status --short
```

Expected:

- focused and full tests pass.
- validator errors 0 and boss errors 0.
- both simulators PASS with unsupported/invalid/warnings/violations 0.
- Windows portable build exits 0.
- no tracked generated output or unrelated file changes.

- [ ] **Step 7: commit**

```powershell
git add js/systems/CombatSystem.js js/systems/CombatActions.js js/systems/combat/CombatAiTurns.js js/systems/combat/CombatRankedEffects.js tests/unit/CombatBossFinalFix.test.js tests/integration/CombatBossUltimate.int.test.js tests/integration/CombatBossSaveRoundTrip.int.test.js
git commit -m "fix(combat): close boss runtime damage and timing gaps"
```

