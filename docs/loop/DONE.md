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

- [x] [2026-09-06] **섹션 헤더를 목표 형식으로 바꾼다.** (3군)
  → [2026-09-07] 보드 세 행 헤더를 `장소 (LOCATIONS)` / `바닥 (GROUND ITEMS)` /
  `휴대 (CARRIED INVENTORY)` 로 바꿨다. 영문은 `ROW_CONFIG` 의 `labelEn` 리터럴이다 —
  `locales.js` 는 `js/data/` 라 SPEC 3절에 걸리고, 헤더가 3개뿐이라 INBOX 도 하드코딩을
  허락했다. 카드 이름은 손대지 않았다 (SPEC 4절).
  **한글 이름과 영문 병기를 각각 제 span 에 넣었다** (`.board-row-label-ko` /
  `.board-row-label-en`). 한 노드에 합치면 `_updateFloorLabel()` 의 `textContent` 교체가
  영문 병기를 함께 지운다 — 구에 들어가 바닥 이름이 `바닥 — 동작구` 로 바뀌는 동안에만
  사라지므로 베이스캠프 캡처로는 안 잡히는 회귀다. 그 함수의 셀렉터도 `-ko` 로 옮겼다.
  `휴 대` 의 공백은 문자열이 아니라 `.board-row-label { letter-spacing: 2px }` 였다
  (`locales.js` 의 값은 `'휴대'` 로 멀쩡하다). 0 으로 내렸다.
  ※ **좌측 사이드바 `.bc-side-title` 도 같이 고쳤다** — 같은 2px 이 `지 도` `상 태` 를
    벌리고 있었고, 한 캡처 안에서 보드는 `휴대`, 사이드바는 `휴 대 무 게` 로 갈렸다.
    자간을 줄이면 폭만 좁아져 세로 여백은 그대로다 (`freeBelow` 13px 유지).
  `js/ui/BoardRenderer.js` + `css/board.css` + `css/layout.css` +
  `tests/unit/BoardSectionHeader.test.js`(8건 신설)
  검증: `reference/main-screen-header-2026-09-07.png` · `sidebar-header-2026-09-07.png` —
  `scrolls: false` · `clipped` 없음 · `overflowX: []` · `freeBelow: 13`,
  `npm test` 3461건 전건 통과, `validate.js` Errors 0 / d823a91

- [x] [2026-09-06] **지도 영역을 키우고 목표의 밀도에 맞춘다.** (2군)
  → [2026-09-07] 지도 블록을 `지도 (MAP)` 제목 붙은 섹션으로 바꾸고(조각 배지는 제목 오른쪽
  끝, 퀘스트 `+N` 과 같은 자리) 지도가 블록을 꽉 채우게 했다. **165 → 176px.**
  블록보다 크게 달라진 것은 그려지는 지도 자체다. 아트워크(1376×768)를 통째로 넣고 있어
  181px 폭에서 높이 102px 로 그려지고 위아래 30px 은 빈 띠였다 — 뷰박스를 구 25개 폴리곤의
  외곽(x 201..1150)에 맞춰 `193 0 965 768` 로 잘라 **같은 폭에서 1.43배**로 키웠다.
  캡처 측정: `letterbox: 0` · `fillsWidth: true` · 지도 181×144.
  마커는 구마다 하나씩 25개(현재 구는 현재 위치 아이콘, 나머지는 랜드마크 아이콘, 가 본 구는
  또렷하게·아닌 구는 흐리게). 새 정보를 만들지 않았다 — 구 지도 창이 이미 25개 구의 랜드마크를
  다 보여준다. 마커는 구 이름 위로 44유닛 올려 찍는다(아트워크에 인쇄된 이름과 겹치지 않게).
  자리는 `상태`(스탯 바 간격·캐릭터 행 여백 −12px)와 `시간`(행 사이 여분 margin −5px)에서
  가져왔다. 표시하는 정보는 하나도 줄이지 않았다 — 스탯 막대 5개·캐릭터 행 그대로다.
  여백 7 → **13px**.
  `js/ui/SeoulMapModal.js` + `js/screens/Main.js` + `css/layout.css` + `css/screens-game.css` +
  `css/mobile.css` + `tools/capture-sidebar.mjs`(지도 측정 추가) +
  `tests/unit/SidebarMapBlock.test.js`(14건 신설) + `tests/unit/SidebarSectionOrder.test.js`(제목 갱신)
  검증: `reference/sidebar-map-2026-09-07.png` · `main-screen-map-2026-09-07.png` ·
  `minimap-zoom-2026-09-07.png`(마커 확인용 3배) — `scrolls: false`, `clipped` 없음 / da3c892

- [x] [2026-09-06] **퀘스트 체크리스트를 사이드바에 상시 노출한다.** (2군)
  → [2026-09-06] `퀘스트 (QUESTS)` 섹션을 행동 메뉴 바로 위에 넣고 진행 중인 퀘스트를
  목표와 같은 `☑ 제목 (상태)` 한 줄로 그린다. 캡처 확인: `☑ 응급실의 첫 환자 (D-3)`(빨강,
  마감 3일 이하) / `☑ 첫 주 생존 (0/7)`(초록). **두 줄까지만** 그리고 나머지는 제목 오른쪽
  `+N` 으로 접는다 — 남은 여백이 76px 뿐이라 세 줄이면 맨 아래 `저장` 버튼이 잘린다.
  섹션 전체가 클릭 상자라 누르면 기존 퀘스트 창(`QuestPanel`)이 그대로 열린다 (확인: 클릭 후
  `#quest-modal.open`, 목록 8건).
  목록·분류·진행도는 사이드바가 다시 정하지 않는다. `QuestPanel.activeSummary()` 를 새로
  만들어 모달과 **같은 `_collect()`** 를 쓰게 했다 — 긴급/메인 판정(마감 3일)과 진행도 계산이
  두 곳에 복사되면 사이드바와 퀘스트 창이 서로 다른 말을 한다. 모달의 정렬 선택(`_ui.sort`)에도
  기대지 않는다. 창에서 이름순을 골랐다고 사이드바 두 줄의 순서가 바뀌면 안 된다.
  `js/ui/QuestSidebar.js`(신설) + `js/ui/QuestPanel.js` + `js/screens/Main.js` +
  `css/layout.css` + `tests/unit/SidebarQuestBlock.test.js`(14건) +
  `tests/unit/SidebarSectionOrder.test.js`(순서 갱신)
  검증: `reference/sidebar-quest-2026-09-06.png` · `main-screen-quest-2026-09-06.png`
  (`scrolls: false`, `clipped` 없음, 여백 76 → **7px**) / af700e0

- [x] [2026-09-06] **소음을 독립 블록으로 승격한다.** (2군)
  → [2026-09-06] `소음 0 (-1.0/TP)` 회색 한 줄을 **퍼센트(오른쪽, 구간 색) + 8px 게이지 +
  임계 초과 시 `위험! 소음 발생`** 으로 바꿨다. 구간을 가르는 값은 화면이 다시 정하지 않고
  `BALANCE.noise.warnLevel`(40) · `GameState.noise.influxThreshold`(60) ·
  `scaledDecayBreakpoints` 를 그대로 읽는다 — `StatRenderer` 가 90/80/70 과 1.5/1.0/0.5 를
  리터럴로 복사해 두고 있어서 밸런스를 고치면 화면만 옛 구간을 말하게 돼 있었다.
  TP당 감소율은 왼쪽에 작게 남겼다. 소음이 저절로 잦아든다는 것을 알려 주는 유일한 표시다.
  검증: 낮을 때(0%, calm, 경고문 없음)와 높을 때(72%, critical, 경고문 표시) 캡처 2장 —
  `reference/sidebar-noise-calm-2026-09-06.png` / `-loud-`. / 7a46aa3

- [x] [2026-09-06] **휴대 무게를 독립 블록으로 승격한다.** (2군)
  → [2026-09-06] `3.0/32kg (9%)` 를 **`3.0 / 32kg` + 8px 게이지 + 구간 라벨**로 바꿨다.
  라벨은 `EncumbranceSystem.getTierLabel()` 이 정한 말(`여유·약간 무거움·무거움·과부하`)을
  쓴다. 그 표에 **tier 4(>200%, 이동 불가)가 빠져 있어** 폴백이 걸리면 가장 무거운 상태가
  `여유` 로 표시됐다 — 이번에 채웠다 (`getTierLabel()` 은 그동안 아무도 부르지 않아
  드러난 적이 없다). 색은 `tpMult` 1.2 페널티가 붙는 tier 3 부터 갈린다.
  퍼센트 숫자는 게이지가 대신하므로 뺐다 — `current`·`max` 가 둘 다 보이니 값은 사라지지 않는다.
  검증: 정상(9%, `여유`, 초록)과 과적(147%, `과부하`, 앰버) 캡처 2장. / 7a46aa3

- [x] [2026-09-06] **좌측 사이드바를 목표 구조로 재편한다.** (1군)
  → [2026-09-06] 흩어져 있던 캐릭터·스탯·소음·무게를 제목 붙은 섹션으로 묶어
  `지도 → Day/시각/계절/날씨/온도 → 상태 → 소음 수치 → 휴대 무게 → (퀘스트 자리) → 행동 메뉴`
  순으로 만들었다. 목표에 없는 캐릭터 행(이름·위치 브레드크럼·장비 창 진입)은 지우지 않고
  `상태 (STATUS)` 섹션의 머리로 흡수했다 — 지우면 장비 창 진입 경로가 함께 사라진다.
  행동 메뉴는 맨 아래에 남기되 **1열 → 2열 그리드**로 눕혔다. 제목 3개가 붙으면서 1열
  메뉴로는 200px 컬럼에 안 들어가 맨 아래 `저장` 버튼이 스크롤 밖으로 잘렸다
  (측정: 내용 1068px > 보이는 높이 1024px → 2열 전환 후 948px, 여백 90px).
  모바일은 사이드바를 가로 2행 바로 눕히고 `.bc-sidebar > *` 에 `order` 를 거는데 섹션
  껍데기가 그 order 를 통째로 죽여서, 모바일 두 브레이크포인트에 `display: contents` 를 넣었다.
  `js/screens/Main.js` + `css/layout.css` + `css/mobile.css` +
  `tests/unit/SidebarSectionOrder.test.js`(8건) + `tools/capture-sidebar.mjs` / facb225

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

## 결정과 근거 (STATUS 에서 내려옴 — 상한 20개를 넘겨서)

- [2026-09-06] **헤더 띠의 좌우(위치 브레드크럼 · 계절/날씨 아이콘)를 걷어냈다** /
  목표 이미지의 띠에는 가운데 칩 하나뿐이고, 좌우는 이미 온보딩 안내 칩과 알림 패널
  (`#notification-container`, top/right 16px)이 쓰는 자리다. 정보가 사라지지도 않는다 —
  브레드크럼은 사이드바 `#bc-district-name`, 계절·날씨·온도는 `#season-badge`/`#weather-display`/
  `#outdoor-temp` 가 그대로 보여준다. 이 셋은 어차피 화면에 뜬 적이 없었다(위 항목).
  ※ 이 정리로 `locationPath.js` 의 `locationKey()` 가 소비처를 잃어 같이 지웠다.
  ※ 내려온 이유: 헤더 띠 작업이 끝났고 3군은 보드 카드 작업이라 이 띠를 건드리지 않는다.
- [2026-09-06] **사기와 유대를 한 블록에 두되 게이지 구조를 다르게 했다** /
  레퍼런스는 둘을 나란히 그렸지만 사기는 플레이어 한 명의 전역 수치(`GameState.stats.morale`),
  유대는 동료마다 따로 쌓이는 수치(`NPCSystem` bond)다. 같은 모양으로 그리면 "동료의 사기"로
  읽힌다. 그래서 **사기는 게이지 하나에 주인 표시 `나`**, **유대는 동료 수만큼 이름표를 단
  게이지**로 나눴고, 블록 제목 아래에 `사기는 나 전체 · 유대는 동료마다` 한 줄을 고정했다.
  동료가 없으면 사기는 그대로 보이고 유대만 점선 `동행 중인 동료 없음`이 된다.
  ※ 확인해 보니 `state.morale`(동료 개별 사기)이 실제로 존재한다 — `NPCSystem.modNpcMorale`,
    팀 리더십·요리 품질 계산용이고 `CompanionModal`이 이미 보여준다. 이 블록은 INBOX 지시대로
    **전역 사기**를 쓴다. 나중에 동료별 사기를 여기 넣고 싶으면 `나` 자리에 이름표를 붙이면 된다.
- [2026-09-06] 사기 구간 문구(`높음/보통/낮음/절망`)를 `gameBalance.moraleTiers` 판정
  (`StatSystem.getMoraleTier()`)에 붙였다 / 임계값을 UI가 다시 정하면 밸런스를 고칠 때
  화면만 옛 구간을 말하게 된다. 문구는 그 구간의 실제 효과(accBonus·craftFailMult·blockExplore)를
  옮긴 것뿐이다.
- [2026-09-06] 동료 목록만 스크롤하고 `동료 상태`는 컬럼 아래 **고정**으로 뒀다 /
  처음엔 패널 전체를 스크롤시켰더니 동료가 2명일 때 블록이 화면 밖으로 밀려 아예 안 보였다
  (캡처로 확인). 늘 보여야 하는 수치라 목록(`.bc-comp-list`)만 `overflow-y:auto`로 뺐다.
- [2026-09-06] 좌측 `동료 (0)` 메뉴 버튼을 지우지 않았다 /
  패널은 현황만 보여주고 상세·장착·해제는 기존 모달이 한다. 버튼을 지우면 그 경로가 사라진다.
  ※ 위 넷이 함께 내려온 이유: 우측 동료 패널이 1군에서 끝났고 남은 3군은 보드 카드 작업이라
    이 컬럼을 건드리지 않는다. `.gauge-row` 폭 0 함정만 STATUS 에 남겼다 — 3군의
    `Qty`·`Durability` 게이지가 같은 공용 컴포넌트를 쓸 수 있어서다.

- [2026-09-06] **목표 이미지가 v2 로 갱신됐다** / 사람이 레퍼런스 7장을 새로 넘겼다.
  `reference/ui-refs/main-screen-v2.png` 가 이번 라운드의 기준이고, 구버전
  `reference/main-screen-target.jpg` 와 다르면 v2 가 이긴다. 나머지 6장(전투·장비×2·
  퀘스트×2·대화)은 다음 라운드 후보다 — **이번 라운드에 손대지 마라.**
  v2 에서 새로 생긴 둘을 INBOX 에 추가했다: 우측 `동료 상태`(사기·유대) 블록,
  장소 카드 모서리 배지. 그래서 남은 항목이 11 → 13건으로 늘었다.
  자세한 이유는 `reference/ui-refs/README.md`.
  ※ 내려온 이유: 같은 내용이 SPEC 2절에 그대로 적혀 있다. SPEC 은 매 바퀴 읽는다.
- [2026-09-06] 동료 패널 폭을 180px 로 잡고 `--slot-w` 를 161→143px 로 재계산했다 /
  보드가 1540px 로 좁아지는데 슬롯 폭을 그대로 두면 10칸이 한 줄에 안 들어간다.
  산식은 `css/variables.css` 주석에 남겼다. 패널 폭을 바꾸면 이 값도 같이 바꿔야 한다.
  ※ 내려온 이유: 산식과 경고가 `css/variables.css` 주석에 있다 — 값을 고치는 사람이 거기서 본다.
- [2026-09-06] 온보딩 안내를 **상단 헤더 띠의 왼쪽(사이드바 오른쪽)** 에 뒀다 /
  1920×1080에서 보드가 화면을 거의 다 채워 "보드를 덮지 않는 자리"는 비어 있던 헤더 띠뿐이었다.
  가운데를 비워 둔 이유는 다음 바퀴가 거기에 HUD 칩(`Day | 시각 | 온도`)을 넣기 때문이고,
  오른쪽은 알림 패널(`#notification-container`, top/right 16px) 자리다.
  HUD 칩 작업 때 `game-header__left`(위치 브레드크럼)와 겹치면 그때 다시 옮긴다.
  ※ 내려온 이유: 칩 작업이 끝나면서 `game-header__left` 자체가 걷어내졌다. 겹칠 것이 없다.
- [2026-09-06] 툴팁을 세로 카드에서 **한 줄 가로 칩**으로 눕혔다 /
  헤더 띠 높이가 56px이라 기존 3단 세로 카드(약 110px)는 들어가지 않는다. 문구는 그대로 두었다.
- [2026-09-06] 닫기 버튼을 넣되 별도 핸들러를 달지 않았다 /
  기존 `overlay.addEventListener('click', dismiss)` 로 버블링돼 같은 경로로 닫힌다.
  경로가 둘이면 한쪽만 고쳐질 수 있다.
- [2026-09-06] 좌표 검사 대신 **CSS 선언 + DOM 검사**로 회귀를 막았다 /
  테스트 환경(happy-dom)은 레이아웃을 계산하지 않아 "카드를 덮는지"를 좌표로 잴 수 없다.
  대신 `#onboarding-board-tooltip` 블록이 다시 `align-items/justify-content: center` 로
  돌아가는지와 닫기 버튼 존재·동작을 검사한다. 되돌리면 빨간불이 뜨는 것은 확인했다.

---

## 끝난 것 (STATUS 에서 내려옴)

- [2026-09-06] 퀘스트 요약을 사이드바에 상시 노출 (INBOX 2군 마지막 건). 목록·긴급 판정·
  진행도를 사이드바가 다시 만들지 않고 `QuestPanel.activeSummary()`(신설, 모달과 같은
  `_collect()`)에서 읽는다. 두 줄 + `+N`, 섹션 클릭 → 기존 퀘스트 창. 회귀 검사 14건 신설,
  순서 검사 1건 갱신. 여백 76 → **7px** / af700e0
- [2026-09-06] 소음·무게를 게이지 블록으로 승격 (INBOX 2군 두 건). 구간 판정을 화면이
  복사해 두지 않고 `BALANCE.noise` · `EncumbranceSystem.getTierLabel()` 에서 읽게 했다.
  그 과정에서 tier 4(이동 불가)가 라벨 표에서 빠져 있던 것을 채웠다. 회귀 검사 16건,
  캡처 도구에 `NOISE`/`ENC_MAX`/`SHOT_TAG`/`freeBelow` 추가. 여백 90 → **76px** / 7a46aa3
- [2026-09-06] 상단 중앙 HUD 칩 복구. `Main._buildLayout()`의 innerHTML 교체가 `#game-header`
  노드를 지워 HeaderBar 가 떨어져 나간 노드에 그리고 있던 것을 고쳤다. 같이 드러난 배선 오류
  2건(온도가 없는 필드 `weather.temp`를 읽어 늘 0°C / 분 산식이 60을 넘어 잘림)도 잡았다.
  회귀 검사 8건, 좌표 측정 캡처 도구 `tools/capture-header-chip.mjs` 신설 / ce8676d
- [2026-09-06] 우측 컬럼 아래에 `동료 상태` 블록(사기·유대) 고정. 동료 목록만 스크롤하도록 분리,
  게이지 폭 0 버그·알림 로그 버튼 가림 해결, 회귀 검사 6건 추가,
  동료 영입 상태 캡처 도구(`tools/capture-companion-panel.mjs`) 신설 / f6a587a
- [2026-09-06] 우측 동료 패널 컬럼 신설(180px). 3컬럼 그리드 전환, 슬롯·카드 폭 재계산,
  빈 상태 안내, DOM 회귀 검사 6건 추가 / e72e7e5, b648048
- [2026-09-06] 온보딩 첫 드래그 안내를 화면 정중앙 → 상단 헤더 띠로 이동, `✕` 닫기 버튼 추가,
  재중앙화 회귀 검사(`tests/unit/OnboardingBoardTooltip.test.js`) 추가 / d59957e
