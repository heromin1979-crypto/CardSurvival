# 동료 전투 완전 수동 조작 설계

## 상태

- 작성일: 2026-07-27
- 사용자 승인: 2026-07-27
- 대상: 일반 전투의 동료 턴과 동료 패턴 검증 경계

## 결정

1. 패턴 계약의 첫 단계는 fixture 기반 스키마만 검증한다.
2. 실제 데이터 완전성은 데이터 구현 단계에서 검증한다.
   - 일반 몬스터 12종
   - 동료 20종
   - 합계 32종
3. 전투에 참가한 모든 동료는 항상 수동으로 조작한다.
4. 동료 차례에는 반드시 기술 카드와 대상을 플레이어가 직접 선택한다.
5. `attack`, `heal`, `support`, `hold` 자세와 one-shot 자동 계획 버튼은 production 전투에서 제거한다.

## 목표

- 저장 데이터의 `stance` 값이나 동료별 `preferredStance`와 무관하게 동료 차례를 `await_ally_input`에서 멈춘다.
- 플레이어와 동료가 같은 `selectSkill()` → `selectTarget()` → `confirmAction()` 명령 경로를 사용한다.
- 동료별 세 기술의 효과, 비용, 쿨다운, 대상, 랭크, 모션은 기존 계약을 유지한다.
- 자동 전술 데이터는 데이터 품질·개발용 시뮬레이션에만 사용할 수 있고 production 턴 진행에는 관여하지 않는다.

## 비목표

- 동료 20종의 기술 구성과 개별 효과를 삭제하거나 단순화하지 않는다.
- 일반 몬스터의 AI, 의도 표시, timed threat 동작은 변경하지 않는다.
- 기존 저장 파일의 `stance` 필드를 일괄 삭제하거나 저장 마이그레이션하지 않는다.
- `COMPANION_TACTICS` 데이터 자체를 제거하지 않는다.

## 검증 책임 분리

### fixture 스키마 검증

`tests/unit/CompanionPatternData.test.js`와 `tests/unit/NormalEnemyPatternData.test.js`의 계약 테스트는 작은 fixture를 사용해 다음 구조만 검증한다.

- 필수 ID와 역할 필드
- 기술 수와 target 계약
- `motionKey`
- timed threat의 허용 상태와 counter 키
- 동료 기술의 수동 명령 실행에 필요한 효과·대상 메타데이터

이 단계는 실제 20종 또는 12종 roster 개수를 요구하지 않는다.

### 실제 데이터 완전성 검증

실제 데이터 구현 단계와 `js/data/validate.js`에서 다음을 검증한다.

- `js/data/enemies.js`: 일반 몬스터 정확히 12종과 각 행동 계약
- `js/data/combatSkills.js`: 동료 정확히 20종, 각 3기술, 고유 기술 60개
- `js/data/companionTactics.js`: 개발용 전술 프로필 20종
- locale, target side, 효과, `motionKey`, 실제 참조 ID 일치

fixture 계약 변경과 실제 roster 증감은 서로 독립적으로 실패해야 한다.

## production 턴 흐름

### 전투 시작

`js/systems/CombatSystem.js::_setupCombat()`은 저장된 `stance`를 확인해 첫 입력 대상을 결정하지 않는다. 턴 큐 순서에 따라 플레이어 또는 동료인 첫 아군 차례를 시작한다.

### 동료 차례 진입

`js/systems/CombatSystem.js::processUntilAllyTurn()`과 `_processAiTurns()`은 살아 있는 동료 차례에 도달하면 다음만 수행한다.

1. `_prepareCompanionTurn(npcId)`로 진형을 정리하고 쿨다운을 한 번 갱신한다.
2. `combat.phase = 'await_ally_input'`으로 설정한다.
3. 자동 기술 계획이나 실행 없이 반환한다.

동료의 저장 `stance`가 `attack`, `heal`, `support`, `hold` 또는 누락 상태여도 결과는 동일하다.

### 수동 행동

`js/ui/CombatUI.js`는 현재 동료의 실제 `combat.skillsById` 기술 카드만 표시한다. 플레이어는 다음 경로로 행동한다.

1. 기술 카드 선택
2. 유효한 아군·적·자기 자신 대상 선택
3. 행동 확정
4. `executeSkillCommand()`가 비용·쿨다운·효과·모션을 한 번 처리
5. 다음 턴으로 진행

`isManualCompanionTurn()`은 stance를 읽지 않고 현재 아군이 동료인지로 판정한다.

## 제거할 production 자동 경로

다음 production 인터페이스와 UI 연결을 제거한다.

- `CombatAiTurns._getCompanionStance()`
- `CombatAiTurns._runCompanionTurn()`
- `CombatAiTurns.requestCompanionPlan()`
- `CombatUI._renderStanceSelector()`
- `CombatUI._bindCompanionPlanButtons()`
- `data-plan-stance` 버튼과 관련 `.stance-btn` 스타일

`_planCompanionAction()`과 `_executePlannedCompanionAction()`이 production 외부에서만 사용된다면 CombatSystem mixin에서는 제거한다. 개발용 planner가 필요하면 `js/systems/combat/CompanionTactics.js`의 순수 함수로만 유지한다.

## UI

- 동료 차례에는 동료의 세 기술 카드와 현재 선택 가능한 대상만 표시한다.
- `attack`, `heal`, `support`, `hold`, `manual` 자세 라벨과 자동 실행 버튼을 표시하지 않는다.
- 플레이어 전용 기본공격·방어·이동 카드는 동료 차례에 숨긴다.
- 기존 `manual-companion-turn` 레이아웃과 디자인 토큰을 재사용하고 새로운 색상 체계를 만들지 않는다.
- 제거된 버튼의 빈 공간이 남지 않도록 stance 전용 컨테이너와 CSS 규칙을 함께 정리한다.

## 저장 호환성

- 과거 저장 파일의 `npcState.stance`는 읽어도 전투 판단에 사용하지 않는다.
- 이번 변경에서 저장 필드를 강제로 삭제하지 않는다.
- 새로운 전투 코드와 UI는 stance 값을 쓰지 않는다.
- 추후 저장 스키마 정리 작업에서 별도로 제거할 수 있다.

## 시뮬레이터와 E2E

`tools/simulate_companion_monster_patterns.mjs`는 production 자동 planner를 호출하지 않는다.

- 동료별 세 기술을 실제 수동 명령 경로로 실행한다.
- 각 기술에 대해 유효 대상과 유효 랭크를 구성한다.
- `selectSkill()`/`selectTarget()`/`confirmAction()` 또는 동등한 실제 command 경로를 사용한다.
- 기술별 실행 분포, 무효 대상·위치, 비용·쿨다운, 효과, `motionKey`를 기록한다.
- 20종×12종과 동료 60기술 cardinality를 계속 hard fail로 검증한다.

브라우저 E2E는 동료 차례가 자동으로 넘어가지 않는지, 세 기술 카드가 보이는지, 기술과 대상을 직접 선택한 뒤에만 턴이 진행되는지를 대표 조합에서 검증한다.

## 오류 처리

- 동료가 사용할 수 있는 기술이 없어도 자동으로 턴을 넘기지 않는다.
- 잘못된 기술·대상·랭크 선택은 기존 명령 검증 오류를 표시하고 같은 동료의 입력 상태를 유지한다.
- 동료가 기절했다면 기존 `_consumeAllyStun()` 계약대로 입력 없이 턴을 넘긴다.
- 동료가 사망했거나 전투에서 제거됐다면 턴 큐의 다음 유효 combatant로 진행한다.

## 테스트 설계

### RED

- 저장 stance가 `attack`, `heal`, `support`, `hold`, 누락 상태인 동료가 모두 자동 행동하지 않고 `await_ally_input`에서 멈춘다.
- stance selector와 one-shot 자동 계획 버튼이 렌더링되지 않는다.
- `requestCompanionPlan()` 자동 실행 진입점이 존재하지 않거나 항상 거부된다.
- fixture 검증은 축소 fixture로 통과하며 20/12 roster 개수를 요구하지 않는다.
- 실제 데이터 validator는 20/60/12 cardinality 손상 시 실패한다.

### GREEN

- 플레이어와 동료의 실제 기술 카드 수동 실행이 동일한 비용·쿨다운·피해·치료 결과를 낸다.
- 동료의 자기 전용, 아군 대상, 적 대상 기술을 각각 직접 선택할 수 있다.
- 행동 확정 전에는 턴·HP·토큰·쿨다운이 변하지 않는다.
- 행동 확정 후 정확히 한 번만 턴이 진행된다.
- 전체 Vitest, 데이터 validator, 500회 시뮬레이터, production build, pattern E2E가 통과한다.

## 완료 기준

- production 코드에서 동료 자동 행동 호출이 0개다.
- production UI에 stance/빠른 자동행동 버튼이 0개다.
- 모든 동료 차례가 기술 카드·대상 직접 선택을 요구한다.
- Task 1 fixture 검증과 실제 32종 완전성 검증이 서로 분리돼 있다.
- 기존 사용자 작업 트리의 이미지·UI·데이터 변경을 커밋에 포함하지 않는다.
