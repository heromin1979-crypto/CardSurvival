# DONE — 끝난 것 보관소

> **루프는 이 파일을 읽지 않는다.** 사람이 나중에 되짚어 볼 때만 연다.
>
> 완료 기록을 INBOX·STATUS 에서 여기로 내리는 이유는 지우기 위해서가 아니다.
> 루프는 매 바퀴 그 두 파일을 통째로 읽는데, 이미 끝난 일은 다음 판단에 쓰이지 않으면서
> 턴만 먹는다. 기록은 남기고 읽는 부담만 덜어 낸다.
>
> 최신이 위. 옮길 때 내용을 요약하거나 고치지 않는다. 그대로 내린다.

---

## 완료한 지시 (INBOX 에서 내려옴)

- [x] [2026-09-06] **상단 중앙 HUD 칩을 만든다.** (1군)
  → [2026-09-06] 칩을 "만든" 게 아니라 **죽어 있던 것을 살렸다.** `HeaderBar.js`에는 이미
  중앙 `Day | HH:MM | Temp` 마크업이 있었고 `main.js`가 init 도 했지만, `Main._buildLayout()`이
  `#screen-main`의 innerHTML 을 통째로 갈아 끼우면서 `index.html`이 선언한 `#game-header`
  노드를 지웠다. HeaderBar 는 init 때 잡아 둔 참조를 계속 들고 있어 **떨어져 나간 노드에**
  그리고 있었다 — 그래서 56px 띠만 비어 있었다.
  고친 것: (1) 헤더 껍데기를 `_buildLayout()` 템플릿 안으로 옮기고 `index.html`에서 뺐다
  (2) `HeaderBar.render()`가 매번 노드를 다시 찾는다 (3) `_onEnter()`가 레이아웃을 만든 뒤
  `HeaderBar.render()`를 명시적으로 부른다 — HeaderBar 자신의 `stateTransition` 리스너는
  Main 보다 먼저 등록돼 있어 헛돈다.
  덤으로 같이 드러난 배선 오류 둘: 온도가 `gs.weather.temp`(없는 필드)를 읽어 늘 `0°C`가 될
  참이었고(→ `WeatherSystem.getOutdoorTemperature()`), 분이 `tpInDay * (60/18)`이라 값이
  60을 넘어 `Math.min(59,…)`로 잘리고 있었다(→ 3 TP = 1시간이므로 `(tpInDay % 3) * 20`).
  띠의 좌우(브레드크럼·계절/날씨 아이콘)는 걷어냈다 — 목표 이미지에 없고, 그 자리는 이미
  온보딩 안내 칩과 알림 패널이 쓴다.
  `js/ui/HeaderBar.js` + `js/screens/Main.js` + `index.html` + `css/header.css` +
  `js/ui/locationPath.js` + `tests/unit/HeaderHudChip.test.js` +
  `tools/capture-header-chip.mjs` / ce8676d

- [x] [2026-09-06] **온보딩 툴팁이 바닥 카드를 가린다.** (0군)
  → [2026-09-06] 오버레이를 화면 정중앙에서 상단 헤더 띠(56px, 사이드바 200px 오른쪽)로 옮기고
  카드를 한 줄로 눕혔다. 드래그 말고도 나갈 수 있게 `✕` 닫기 버튼을 넣었다.
  안내 문구는 그대로 두었다. `css/onboarding.css` + `js/systems/OnboardingSystem.js` / d59957e

- [x] [2026-09-06] **우측에 `동료 상태` 블록을 덧붙인다.** (1군)
  → [2026-09-06] 동료 컬럼 맨 아래에 고정 블록으로 붙였다. 사기는 게이지 하나(`나`),
  유대는 동료마다 이름표를 단 게이지로 나눠 범위 차이를 드러냈다. 블록 제목 아래
  `사기는 나 전체 · 유대는 동료마다` 한 줄을 못 박았다. 동료가 없어도 사기는 그대로 보이고
  유대만 점선 `동행 중인 동료 없음`이 된다.
  덤으로 세 가지를 고쳤다 — (1) 동료가 둘이면 블록이 화면 밖으로 밀려서 목록만 스크롤하게
  분리했다 (2) 공용 `.gauge-row` 3열 그리드 탓에 게이지 폭이 0이던 것을 덮어썼다
  (3) 알림 로그 버튼(fixed, 우하단)이 마지막 줄을 가려 컬럼 아래 56px을 비웠다.
  `js/ui/CompanionPanel.js` + `css/companion-panel.css` +
  `tools/capture-companion-panel.mjs`(동료 영입 상태 캡처) / (해시는 STATUS 참조)

- [x] [2026-09-06] **우측 동료 패널 컬럼을 만든다.** (1군)
  → [2026-09-06] 3컬럼 그리드(200px / 1fr / 180px)로 바꾸고 `js/ui/CompanionPanel.js` 신설.
  보드가 1720→1540px 로 좁아져 `--slot-w` 161→143px, `--card-w` 151→133px 재계산.
  좌측 `동료 (0)` 메뉴 버튼은 그대로 뒀다 (상세·해제가 거기 있다).
  `css/companion-panel.css` + `css/layout.css` + `css/variables.css` + `index.html` +
  `js/screens/Main.js` / e72e7e5, b648048
  ※ 60턴 소진으로 루프가 장부를 못 닫아 사람이 이어서 커밋·정리했다.
  ※ **육안 검증은 빈 상태(동료 0명)만 했다.** 초상화·장비·스킬이 실제로 그려지는지는
     DOM 테스트(`CompanionSidePanel.test.js`)로만 확인됐다. 동료를 영입한 화면은 아직 못 봤다.

---

## 끝난 것 (STATUS 에서 내려옴)

- [2026-09-06] 우측 컬럼 아래에 `동료 상태` 블록(사기·유대) 고정. 동료 목록만 스크롤하도록 분리,
  게이지 폭 0 버그·알림 로그 버튼 가림 해결, 회귀 검사 6건 추가,
  동료 영입 상태 캡처 도구(`tools/capture-companion-panel.mjs`) 신설 / (이번 커밋)
- [2026-09-06] 우측 동료 패널 컬럼 신설(180px). 3컬럼 그리드 전환, 슬롯·카드 폭 재계산,
  빈 상태 안내, DOM 회귀 검사 6건 추가 / e72e7e5, b648048
- [2026-09-06] 온보딩 첫 드래그 안내를 화면 정중앙 → 상단 헤더 띠로 이동, `✕` 닫기 버튼 추가,
  재중앙화 회귀 검사(`tests/unit/OnboardingBoardTooltip.test.js`) 추가 / d59957e
