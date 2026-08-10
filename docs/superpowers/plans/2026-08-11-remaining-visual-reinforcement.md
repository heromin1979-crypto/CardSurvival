# Remaining Visual Reinforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** 연결만 되어 있고 장면 이미지를 사용하지 않는 24개 서브 로케이션을 일러스트로 완성하고, 보드의 동적 데이터·고정 HUD 아이콘을 SVG 체계로 확장한다.

**Architecture:** 서브 로케이션은 기존 `subLocationImage(def)`의 `<id>.png` 규칙을 유지하며, 각 묶음이 자신의 파일 존재·`noSceneImage` 계약을 테스트한다. 동적 아이콘은 원본 데이터의 의미를 보존하는 resolver를 도입해 지원되는 고빈도 아이콘만 SVG로 바꾸고, 알 수 없는 데이터 아이콘은 안전하게 기존 glyph로 fallback한다. HUD는 하드코딩된 고정 이모지만 SVG로 전환한다.

**Tech Stack:** ES modules, Vitest/happy-dom, CSS mask SVG, built-in image generation.

## Global Constraints

- 모든 장면은 built-in `image_gen`으로 생성하고 `view_image`로 검수한 1376×768 PNG여야 한다.
- 공통 장면 스타일은 성인향 한국 포스트아포칼립스 그래픽 노블, 굵고 절제된 검은 외곽선, 넓고 매끈한 셀/페인터리 명암이다. 읽을 수 있는 글자·로고·워터마크·UI는 금지한다.
- 각 장면의 핵심 피사체는 16:9 화면 중앙 70% 안에 전부 들어와야 한다.
- `hiddenLocations.js`와 사용자 소유 변경 파일은 수정하지 않는다.
- SVG는 `viewBox="0 0 24 24"`, `fill="none"`, `stroke="black"`, `stroke-width="1.8"`를 사용하며 `currentColor` mask로 표시한다.
- 동적 `def.icon`을 지원하지 않는 새 SVG로 강제로 바꾸지 않는다. 지원하지 않는 값은 기존 glyph를 보존한다.

---

### Task 1: 숨김 장소 장면 — 중심/동부 8종

**Files:**
- Create: `assets/images/sublocations/sl_junggoo_cold_storage.png`, `sl_junggoo_hotel_pantry.png`, `sl_junggoo_city_hall_safe.png`, `sl_seongdong_master_workshop.png`, `sl_seongdong_bridge_shelter.png`, `sl_dongdaemun_workshop.png`, `sl_jungrang_water_control.png`, `sl_seongbuk_research_bunker.png`
- Modify: `js/data/landmarks.js`, `tests/unit/RemainingSublocationSceneAssets.test.js`, `tests/unit/HiddenLocationWiring.test.js`

**Scene prompts:** 냉동 창고(살아 있는 발전기와 성에 낀 산업 냉동고), 호텔 저장고(비밀 식량 선반과 조리 설비), 시청 시장실 금고(붕괴 시청 속 벽면 금고), 장인 작업실(공구 벽과 제작대), 다리 아래 은신처(교각·침낭·보급 상자), 재단사의 공방(재봉틀·직물·반쯤 닫힌 셔터), 정수장 컨트롤룸(배수 도면·제어 패널·저수지), 대학 지하 연구 벙커(봉인 에어록·배양기·청록 비상등).

- [ ] 추가할 8개 id가 모두 `noSceneImage !== true`이고 PNG가 존재한다는 실패 테스트를 만든다.
- [ ] 단독 테스트가 8개 이미지/플래그 누락으로 실패하는지 확인한다.
- [ ] 8개 PNG를 생성·정규화·시각 검수한다.
- [ ] 해당 8개 `landmarks.js` 플래그만 제거하고 HiddenLocation fallback 계약의 scene 목록을 갱신한다.
- [ ] 해당 테스트, `HiddenLocationWiring`, `node js/data/validate.js`를 통과시키고 커밋한다.

### Task 2: 숨김 장소 장면 — 북부/서부 8종

**Files:**
- Create: `sl_gangbuk_hidden_spring.png`, `sl_dobong_hermit_cave.png`, `sl_nowon_hidden_depot.png`, `sl_eunpyeong_fire_station.png`, `sl_mapo_club_basement.png`, `sl_yangcheon_civil_shelter.png`, `sl_guro_secret_forge.png`, `sl_geumcheon_secret_factory.png`
- Modify: `js/data/landmarks.js`, `tests/unit/RemainingSublocationSceneAssets.test.js`, `tests/unit/HiddenLocationWiring.test.js`

**Scene prompts:** 비밀 샘(비 온 뒤 바위 아래 물길), 은자의 동굴(약초·절구·촛불), 지하 비축 창고(선수촌 통로·정돈된 물자), 불광 소방서(반쯤 열린 차고·소방 장비), 홍대 라이브클럽 지하(방음벽·무대 장비), 목동 민방위 대피소(규격 보급 적재·방폭문), 데이터센터 비밀 대장간(송풍구·모루·열기), 지하 군수 라인(탄약 압착 설비·산업 조명).

- [ ] 두 번째 8개 id의 PNG·scene 플래그 실패 테스트를 추가한다.
- [ ] RED를 확인한 뒤 생성·검수·데이터 연결을 수행한다.
- [ ] 이전 Task 1 이미지와 시각 언어를 비교하고, 이 묶음의 exact id만 scene 계약으로 추가한다.
- [ ] 집중 테스트와 데이터 validator를 통과시키고 커밋한다.

### Task 3: 숨김 장소 장면 — 남부/랜드마크 8종

**Files:**
- Create: `sl_yeongdeungpo_kbs_studio.png`, `sl_63_lobby.png`, `sl_63_observatory.png`, `dongjak_bunker.png`, `sl_seocho_evidence_vault.png`, `sl_gangnam_sealed_pharmacy.png`, `sl_songpa_survivor_fort.png`, `sl_gangdong_secret_dock.png`
- Modify: `js/data/landmarks.js`, `tests/unit/RemainingSublocationSceneAssets.test.js`, `tests/unit/HiddenLocationWiring.test.js`

**Scene prompts:** KBS 비밀 방송실(예비 전원 송출 콘솔), 63빌딩 로비(뒤집힌 관광 데스크·대리석), 60층 전망대(통유리·망원경·황폐한 서울), 동작 지하 벙커(철문·군용 통신 설비), 법원 증거물 보관소(봉인 캐비닛), 봉인 약제실(잠긴 셔터·의약 보관장), 송파 생존자 요새(아케이드 바리케이드·생활 불빛), 강동 비밀 선착장(갈대·계류 고리·강변 경사로).

- [ ] 마지막 8개 id의 PNG·scene 플래그 실패 테스트를 추가한다.
- [ ] RED 확인 후 이미지 생성·검수·플래그 제거를 수행한다.
- [ ] 63빌딩의 발견 카드 fallback은 유지하면서 로비/전망대 scene만 연결한다.
- [ ] 집중 테스트와 데이터 validator를 통과시키고 커밋한다.

### Task 4: 고빈도 동적 아이템/NPC 아이콘 resolver

**Files:**
- Create: `assets/images/ui/icons/{herb,syringe,water,grain,fire,medical,vial,pill,power,gear,blade,jar,meal,meat,fish,shield,wrench,box,blood,knife,rock,microscope,can,thread,tree,bolt,rod,mushroom,sprout,brick,gun,vest,radiation,antenna,wood,person,nurse,soldier,child,mechanic,trader,student,dog}.svg`
- Create: `js/ui/DataIcon.js`, `tests/unit/DataIcon.test.js`
- Modify: `css/ui.css`, `js/ui/CardFactory.js`, `js/ui/CompanionModal.js`, `js/ui/DoctorPatientModal.js`

**Interface:** `dataIcon(iconValue, { className = '', label = '' } = {})` returns a semantic SVG span for supported high-frequency item/NPC glyphs; otherwise returns an escaped `data-icon--glyph` span containing the original glyph.

- [ ] 지원 glyph의 semantic span, 알 수 없는 glyph의 escaped fallback, label accessibility를 실패 테스트로 정의한다.
- [ ] 43 SVG와 `DataIcon` mapping을 구현한다.
- [ ] 보드 아이템 카드·NPC 카드·동료 roster·의사 환자 목록의 dynamic icon 출력만 resolver로 바꾼다. 데이터 정의는 수정하지 않는다.
- [ ] focused 테스트, 기존 UI icon 테스트, 전체 테스트를 통과시키고 커밋한다.

### Task 5: 남은 보드 HUD 고정 아이콘 확장

**Files:**
- Create: `assets/images/ui/icons/{action,manage,companion,craft,skills,rest,health,build,warning,lock}.svg`
- Modify: `js/ui/UiIcon.js`, `css/ui.css`, `js/screens/Main.js`, `js/screens/Basecamp.js`, `js/ui/QuestPanel.js`
- Test: `tests/unit/UiIcon.test.js`

- [ ] 새 10개 icon name을 실패 테스트에 추가한다.
- [ ] SVG·mask 규칙을 추가한다.
- [ ] Main/Basecamp의 고정 행동 제목·거점 관리·동료·제작·스킬·휴식·건설·HP와 QuestPanel의 고정 lock 표시만 `uiIcon()`으로 전환한다.
- [ ] quest/item/NPC 데이터에서 온 동적 아이콘은 건드리지 않는다.
- [ ] focused 테스트와 전체 테스트를 통과시키고 커밋한다.
