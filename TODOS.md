# TODOS — Card Survival: Ruined City

> Items deferred from /autoplan review pipeline (2026-04-01)

---

## Post-Launch (after first 50 active players)

### T1: Full Test Suite (Vitest) ✅ DONE
**What:** Vitest 설치 + 42개 단위 테스트 (commit 40130d7)
**Status:** EventBus(9), SystemRegistry(4), GameData(9), GameState(10), TickEngine(10) — 42/42 통과.

### T2: Module Bundler (Vite/Rollup) ✅ DONE
**What:** vite.config.js 커밋 완료 (commit 2e6fb84)
**Status:** Capacitor/Web 빌드는 Vite로 번들링. Electron PC 빌드는 네이티브 ES 모듈 유지.

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

### T5: skipTP Async Chunking ✅ DONE
**What:** n ≤ 144 동기, n > 144 시 72 TP/frame 비동기 청킹 (commit 다음)
**Status:** CHUNK_THRESHOLD=144, CHUNK_SIZE=72. 일반 게임플레이(1/10/72)·테스트 동기 유지.

---

## Accessibility (phase 2)

### T6: Keyboard Navigation ✅ DONE
**What:** 방향키 보드 탐색 + Enter/Space 카드 액션 (commit 2132449)
**Status:** KeyboardNav.js 신규, CardFactory 키보드 핸들러, ModalManager 포커스 트랩, CardContextMenu Escape 닫기.

### T7: Card ARIA Labels ✅ DONE
**What:** 전체 카드 타입 aria-label/role/tabindex + 슬롯 aria-label (commit 2132449)
**Status:** 일반/location/landmark/sublocation/NPC/environment 카드 모두 적용. focus-visible CSS 추가.

---

## Architecture (long-term)

### T8: Window Globals → Full EventBus Refactor ✅ DONE
**What:** Eliminate window globals → GameData ES 모듈 싱글턴 (commit 12f2b07)
**Status:** window.__GAME_DATA__ 제거 완료 (35개 파일 마이그레이션). 시스템 전역(NPCSystem 등)은 이전 cherry-pick에서 SystemRegistry로 완료. window 전역 변수 0개 달성.
