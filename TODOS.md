# TODOS — Card Survival: Ruined City

> Items deferred from /autoplan review pipeline (2026-04-01)

---

## Post-Launch (after first 50 active players)

### T1: Full Test Suite (Vitest)
**What:** Add Vitest as devDependency; write unit tests for GameState, EventBus, core systems.
**Why:** 0% test coverage beyond smoke test is a long-term fragility risk. Ship first, then add coverage.
**Pros:** Catch regressions fast; enables confident refactoring.
**Cons:** Setup overhead ~2 hours; CI requires Node env.
**Context:** Plan-stage decision: smoke test first, expand after playtest confirms the game is worth maintaining.
**Effort:** M (human) → S (CC+gstack)
**Priority:** P2
**Depends on:** Smoke test passing; at least 1 playtest session.

### T2: Module Bundler (Vite/Rollup)
**What:** Introduce Vite to bundle 50+ ES modules into a single chunk.
**Why:** 50+ HTTP round-trips on cold load; currently ~1-2s on fast connection, could be ~5s on mobile.
**Pros:** Faster cold start; tree-shaking; smaller payload.
**Cons:** Build step required; vanilla JS charm partially lost; yak-shaving before players exist.
**Context:** Deferred from CEO plan. Revisit when load time becomes a real player complaint.
**Effort:** M (human) → S (CC+gstack)
**Priority:** P3
**Depends on:** Real players and performance complaints.

### T3: Admin/Debug Mode
**What:** Hidden `?debug=1` URL flag that exposes GameState inspector, TP skip buttons, stat editors.
**Why:** Balance testing currently requires editing source or running simulation scripts.
**Pros:** Faster balance iteration; useful for playtester feedback sessions.
**Cons:** Not player-facing; not blocking launch.
**Context:** Deferred from CEO plan. Useful after launch when tuning based on real play data.
**Effort:** S (human) → S (CC+gstack)
**Priority:** P3

### T4: Leaderboard / Cloud Save
**What:** Server-side leaderboard and optional cloud save.
**Why:** Adds social proof and retention hook.
**Cons:** Requires server infrastructure; out of scope for browser-only phase.
**Context:** CEO plan: deferred until 50+ active players justify infrastructure cost.
**Effort:** XL (human) → L (CC+gstack)
**Priority:** P3
**Depends on:** Player base > 50 active.

---

## Performance (defer until player complaint)

### T5: skipTP Async Chunking
**What:** Break `TickEngine.skipTP(n)` into `setTimeout(0)` chunks to avoid UI freeze on large n.
**Why:** At n=2160 (30-day skip), synchronous loop blocks main thread ~300ms.
**Pros:** Smoother UX on long time-skips.
**Cons:** Async chunking complicates caller code; negligible impact at current scale.
**Context:** Eng review WARN. Acceptable at current scale. Revisit if players report freeze.
**Effort:** S (human) → S (CC+gstack)
**Priority:** P3

---

## Accessibility (phase 2)

### T6: Keyboard Navigation
**What:** Full keyboard navigation for card actions (Tab, Enter, Arrow keys).
**Why:** Accessibility requirement; also improves power-user UX.
**Context:** Design review deferred item. Not blocking launch.
**Effort:** M (human) → S (CC+gstack)
**Priority:** P2

### T7: Card ARIA Labels
**What:** Add `aria-label` attributes to all interactive card elements.
**Why:** Screen reader support.
**Context:** Design review deferred item.
**Effort:** S (human) → S (CC+gstack)
**Priority:** P2

---

## Architecture (long-term)

### T8: Window Globals → Full EventBus Refactor
**What:** Eliminate 6 `window.*` globals (NPCSystem, MentalSystem, BodySystem, EcologySystem, NightSystem, __GAME_SYSTEMS__) by resolving circular import dependencies.
**Why:** Breaks EventBus architecture contract; implicit coupling.
**Cons:** Circular import root cause requires module restructuring; non-trivial refactor.
**Context:** CEO plan ADR: late-binding is acceptable for phase 1. Fix via proper module boundaries when architecture settles.
**Effort:** L (human) → M (CC+gstack)
**Priority:** P2
