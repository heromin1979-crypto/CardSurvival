# Task 4 — 전투 결과 화면 개선 보고서

## 상태

완료. `CombatResult._render()`가 실제 전투 상태를 사용하는 결산 패널 구조를 렌더링하며, Task 1의 마지막 CombatResult RED 계약과 보강한 outcome/reward 계약이 GREEN이다.

## 구현 내용

- `js/screens/CombatResult.js`
  - `.combat-result-shell[data-outcome]` 아래에 header, overview, rewards, actions 영역을 구성했다.
  - 기존 실제 데이터인 outcome, 현재/최대 HP, 현재 총 XP, 승리 XP, `GameState.combat.rewards`, 복귀 장소만 표시한다.
  - 실제 reward instance ID, 정의의 icon/name, instance quantity를 전리품 카드에 유지했다.
  - 보상이 없으면 기존 `combatResult.noLoot` 문구를 전용 empty state로 렌더링한다.
  - XP progress를 inline style 없이 `<progress>` 값으로 갱신하고, reduced-motion에서는 즉시 최종 값으로 표시한다.
- `css/screens-combat.css`
  - clean 전장 이미지 `combat_jongno_subway_clean_v2.png`를 낮은 대비 배경으로 사용하고 암막을 적용했다.
  - 최대 폭 920px의 header / 결산 본문 / actions 3영역 패널을 구성했다.
  - victory / defeat / fled를 각각 `--text-good`, `--text-danger`, `--text-warn`으로 구분했다.
  - 전리품 카드 최소 크기, 복귀 버튼 focus-visible, 모바일 단일 열/내부 세로 스크롤, reduced-motion 규칙을 추가했다.
- `tests/integration/CombatFocusedUI.int.test.js`
  - fled의 `data-outcome`, 필수 5영역, no-loot, 실제 복귀 장소를 검증한다.
  - victory XP와 실제 bandage reward instance의 name/quantity를 검증한다.

## TDD

1. 기존 focused UI 계약 실행:
   - `npm.cmd test -- tests/integration/CombatFocusedUI.int.test.js`
   - 15건 중 14건 통과, `.combat-result-shell` 부재로 1건 RED.
2. outcome/no-loot/reward 계약 보강 후 production 수정 전 실행:
   - `npm.cmd test -- tests/integration/CombatFocusedUI.int.test.js -t "result"`
   - 2건 모두 `data-outcome`/shell 부재로 RED.
3. 최소 production 구현 후:
   - 결과 관련 2건 GREEN.
   - focused UI 전체 16건 GREEN.

## 실제 렌더 검증

Playwright Chromium에서 `combat-test.html`의 실제 `GameState`, `StateMachine`, `CombatResult` 경로로 victory 상태를 렌더링했다.

- Desktop 1440×900: `tmp/combat-result-desktop.png`
  - shell x=260~1180, 화면 가로 overflow 없음.
  - action 버튼 y=624.5~672.5로 viewport 안에 노출.
- Mobile 390×844: `tmp/combat-result-mobile.png`
  - shell x=12~378, 화면 가로 overflow 없음.
  - action 버튼 y=669.3~717.3으로 viewport 안에 노출.
- 두 렌더 모두 clean backdrop 요청 HTTP 200, reward card 1개, XP counter 최종값 45를 확인했다.

## 범위 및 우려사항

- 전투 로직, 데이터 원본, locale 데이터, unrelated 화면은 변경하지 않았다.
- 전체 프로젝트 test suite는 이 Task의 범위를 넘어 실행하지 않았고, focused UI integration 16건과 실제 Chromium 렌더를 검증했다.
- 작업 시작 시 존재하던 unrelated dirty 파일은 수정하거나 스테이징하지 않는다.
