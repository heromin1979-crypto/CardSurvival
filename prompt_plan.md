# Combat System Overhaul — Tier 1 + 2

> 시작일: 2026-04-23
> 상태: **Phase 1~3 완료 · Phase 4 대기 (Tier 1 완료점)**
> 선행 완료: Wave 3 전체 (8개 이슈 해소) · 통합 테스트 스위트 27 (→ `prompt_plan.old3.md` 아카이브)

## 배경

사용자 피드백: "NPC는 전투에서 그냥 맞아 주는 역활로만 사용되는데 전투 시스템을 보여지는 부분과 실질적인 부분 개선이 필요."

조사 결과 4가지 구조 문제:
- **P1**: NPC 독립 턴 부재 (수동 명령 + 쿨다운 의존)
- **P2**: 적이 NPC 직접 타겟 안 함 (20% 무작위 가로채기)
- **P3**: `aiPattern` 메타데이터만 존재, 코드 미구현
- **P4**: 턴 가시성 부재 (누구 차례인지 표시 없음)

## 전체 계획 — 7 Phase

| Phase | 범위 | 줄 수 | 상태 |
|------|------|-------|------|
| **1** | 턴 큐 인프라 (Q1 initiative HUD + 큐 순환) | ~350 | ✅ (26건 테스트 · 309/309) |
| 2 | 동료 스탠스 + 독립 행동 (Q2 + M2 일부) | ~500 | ✅ (23건 테스트 · 332/332) |
| 3 | 적 의도 예고 + AI 타겟 분기 (Q3 + M1) | ~300 | ✅ (30건 테스트 · 362/362) |
| 4 | 동료 애니메이션 (Q4) · **Tier 1 완료점** | ~250 | ⏳ |
| 5 | Speed 기반 initiative (M3) | ~150 | ⏳ |
| 6 | Front/Back 포지션 (M5) | ~500 | ⏳ |
| 7 | Action Points (M4) · **Tier 2 완료점** | ~700 | ⏳ |
| 합계 | | ~2750 | |

## 확정된 설계 답안 (Open Question 추천안 채택)

1. Phase 4(Tier 1) 완료 시 체감 검증 후 Phase 5~7 Go/No-Go 재평가
2. AP 기본값: **2 AP/턴** (P7)
3. 행 전환 비용: **1 AP** (P6+P7)
4. 동료 사망 처리: **기절** (incapacitated, 전투 종료 후 HP 20% 복귀)
5. 적 의도 예고: **100% 결정론** (Into the Breach 방식)
6. Speed 동점: **플레이어 > 동료 > 적** 타이브레이커
7. 작업 브랜치: **master + 작은 커밋 회귀 0 보장** (feature 브랜치 오버헤드 회피)
8. **TDD 필수** — 각 Phase 종료 조건에 "회귀 0" + 신규 테스트

## Phase 1 — 턴 큐 인프라 상세

### 목표
"플레이어 액션 → 모든 적 연쇄 공격" → "큐에 순서대로 한 엔티티씩 1 턴 소비".

### 변경 지점

**GameState.combat 확장**:
```js
turnQueue: [],      // [{type: 'player'|'companion'|'enemy', id, dead}]
activeIdx: 0,       // 활성 엔티티 인덱스
roundNumber: 1,     // 큐 한 바퀴 = 1 라운드
```

**CombatSystem 신규 메서드**:
- `_buildTurnQueue()` — 전투 시작 시 구성 (player → companions → enemies)
- `_advanceTurn()` — 다음 엔티티로 진행, 죽은 건 skip
- `_removeFromQueue(type, id)` — 사망 처리
- `_runCurrentTurn()` — 활성 엔티티 종류 분기 (Phase 1에서는 enemy만 실제 동작, companion은 stub)

**기존 메서드 변경**:
- 전투 시작 훅에서 `_buildTurnQueue` 호출
- 플레이어 행동 종료 후 `_advanceTurn` → `_runCurrentTurn` 루프
- `_allEnemiesAttack` 데드코드 제거 (Phase 1 완료 시)

**CombatUI 추가**:
- 상단 **initiative bar** — 큐 순서대로 초상화 배치 + 활성 강조 + HP mini-bar
- 죽은 엔티티: 회색 + 라인 스루

**세이브 호환**:
- `deserialize`에서 `turnQueue` 부재 시 전투 비활성 상태로 복원 (전투 중 저장 시나리오는 원래 지원 안 됨)

### Phase 1 수용 기준 (Acceptance Criteria) — 완료

- [x] 전투 시작 시 큐가 올바르게 구성 (플레이어 + 동료 0~2 + 적 1~N) ✅
- [x] 플레이어 액션 → AI 턴 처리기 → 적 각자 개별 턴 → 다시 플레이어 순환 ✅
- [x] 엔티티 사망 시 큐에서 skip, HP 0 companion은 큐 구성에서 제외 ✅
- [x] 모든 적 사망 → 승리 판정, 플레이어 사망 → 패배 판정 (기존 로직 유지) ✅
- [x] CombatUI에 initiative bar 표시 ✅
- [x] 기존 회귀 0 (283 → 309, 26 신규 모두 추가) ✅
- [x] 신규 테스트 26건 (turn queue unit 15 + integration 11) ≥ 15 목표 ✅

### Phase 1 구현 증거
- `CombatSystem._buildTurnQueue / _advanceTurn / _currentEntry / _isEntryAlive / _processAiTurns / _runCompanionTurn (stub) / _runSingleEnemyTurn`
- `_setupCombat` 에 turnQueue/activeIdx/roundNumber 필드 초기화
- `_allEnemiesAttack` → `_processAiTurns` alias (하위 호환)
- `CombatUI._renderInitiativeBar` + `initiative-bar` CSS 블록 (screens-combat.css)

## 아카이브

→ `prompt_plan.old3.md` (Wave 3 완료 + 통합 테스트 스위트)
→ `prompt_plan.old2.md` (HospitalSiegeSystem Phase 4)
→ `prompt_plan.old.md` (Wave 1 이전 전체 기획)
