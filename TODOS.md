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

## UX (deferred)

### T9: 다중 랜드마크 구 — 랜드마크 선택 UI 가이드라인
**What:** 한 구에 랜드마크가 2개 이상인 경우(현재 동작구: 보라매병원/국립현충원) 플레이어가 어느 랜드마크로 진입할지 명확히 선택할 수 있는 일관된 UX 가이드라인 정립.
**Why:** 현재는 top row에 각 랜드마크 카드가 나란히 노출되고 개별 클릭 진입이 가능한 구조로 기능적으로는 동작함. 다만 향후 다른 구에도 복수 랜드마크가 추가되면 슬롯 압박(인접 구 카드와 경합)과 시각적 혼란이 예상됨.
**Context:**
- `districts.dongjak.landmarks = ['lm_boramae_hospital', 'lm_dongjak']` (배열 형식)
- `LANDMARK_DATA`는 단수 구는 `'guro'`, 복수 구는 `'lm_*'` 키로 분기 — 네이밍 규칙은 이미 확립됨
- `ExploreSystem._updateTopRowCards`와 `CharCreate` 초기 배치 모두 `landmarks` 배열을 지원하도록 정리됨 (2026-04-19)
- 버그 이력: 의사(이지수) 오프닝에서 `enterLandmark('dongjak')`이 null을 반환해 응급실 진입이 실패했던 케이스 — `enterLandmark('lm_boramae_hospital')`로 수정
**Options to consider:**
1. **모달 진입**: 구 랜드마크 카드 클릭 시 "보라매병원 / 국립현충원" 선택 모달 (인접 구 슬롯 경합 해소)
2. **탭/토글**: 구 진입 중 top row에 랜드마크 토글 버튼 추가
3. **현상 유지**: 카드 개별 노출 — 동작구만 특별 케이스로 허용
**Effort:** S (human) → S (CC)
**Priority:** P3 (플레이어 피드백 발생 시)

---

## Architecture (long-term)

### T8: Window Globals → Full EventBus Refactor ✅ DONE
**What:** Eliminate window globals → GameData ES 모듈 싱글턴 (commit 12f2b07)
**Status:** window.__GAME_DATA__ 제거 완료 (35개 파일 마이그레이션). 시스템 전역(NPCSystem 등)은 이전 cherry-pick에서 SystemRegistry로 완료. window 전역 변수 0개 달성.
