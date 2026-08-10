# Task 5 완료 보고 — 보드 UI 고정 이모지 1차 SVG 전환

## 변경 목록

- `assets/images/ui/icons/`에 단색 마스크용 SVG 10종을 추가했다: `location`, `map`, `season`, `temperature`, `explore`, `quest`, `basecamp`, `weather`, `item`, `injury`.
- `js/ui/UiIcon.js`에 허용 목록 검증과 HTML attribute escape를 포함한 `uiIcon(name, { className, label })` helper를 추가했다.
- `css/ui.css`에 `currentColor` 기반 `.ui-icon` 및 SVG별 `mask`/`-webkit-mask` 규칙을 추가했다.
- `js/screens/Main.js`, `js/screens/Basecamp.js`의 지도, 위치, 계절, 날씨, 온도, 퀘스트, 탐색, 베이스캠프 고정 UI를 helper로 전환했다.
- `js/systems/SeasonSystem.js`, `js/systems/WeatherSystem.js`는 갱신 시 이름·온도 텍스트를 그대로 두고 season/weather/temperature semantic span을 다시 삽입한다.
- `js/ui/CardFactory.js`의 이미지 없는 세부 장소 씬 fallback만 `location` 아이콘으로 전환했다.

## 의도적으로 제외한 범위

- `def.icon` 기반 아이템, 동적 카드, NPC/동료, NPC 감정 이모지와 아이템 정의 데이터는 변경하지 않았다.
- 사용자가 수정 중인 `js/data/endings.js`는 읽기·수정·스테이징하지 않았다.

## TDD 및 검증

1. `tests/unit/UiIcon.test.js`를 먼저 추가했다.
2. 구현 전 `npm.cmd test -- --run tests/unit/UiIcon.test.js`는 `Cannot find module '../../js/ui/UiIcon.js'`로 실패했다. 이는 새 helper 모듈이 아직 없기 때문인 예상된 RED 결과다.
3. 구현 후 같은 테스트는 4/4 통과했다.
4. SVG 10종의 `viewBox`, `fill`, `stroke`, `stroke-width` 계약을 PowerShell 검증으로 확인했다.
5. `npm.cmd test -- --run tests/unit/UiIcon.test.js tests/unit/EndingImages.test.js tests/unit/SublocationSceneAssets.test.js`: 3개 파일, 24개 테스트 통과.
6. `npm.cmd test`: 186개 파일 통과, 2,439개 테스트 통과, 3개 skipped. 실행 시간은 287.27초였다. `HelicopterEscapeRoutes` 실패는 현재 작업 트리에서 재현되지 않았다. 출력된 유일한 경고는 `js/data/combatMotionManifest.js`의 기존 `MODULE_TYPELESS_PACKAGE_JSON` ESM 타입 경고다.
7. `git diff --check` 및 변경 JavaScript 6개 파일의 `node --check`를 통과했다.

## 커밋

`feat: add first-pass board ui icons`
