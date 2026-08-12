# Card Survival: Ruined City — 프로젝트 가이드

> AI 행동 규칙 및 참조 문서

## 1. 기술 스택

- 바닐라 JS (모듈), CSS 변수, Vite 번들러
- 고정 해상도 1920×1080 (Scale 방식, `main.js`)
- Capacitor (Android/iOS), Electron (PC)

## 2. 보드 레이아웃 규칙

- 장소/바닥: 10칸 flex, `flex: 1 1 0` 적용
- 휴대: 20칸 `grid 10열×2행`, 가방 시 `extraSlots` 추가 해금
- 슬롯 수 → `ROW_CONFIG.slots` (GameState 배열 직접 참조 금지)

## 3. 아이템/레시피 데이터 구조

- 아이템: `items.js` 애그리게이터 → `items_base/combat/misc/tech/medical/tools/structures` (7개)
- 레시피: `blueprints.js` + `blueprints_advanced.js` + `hiddenRecipes.js` (CraftSystem.js 병합)
- **신규 아이템 추가 시**: `stackConfig.js` + `districts.js` lootTable + `CardFactory.js` CARD_IMAGES 반드시 등록. 세 곳 모두 **중복 키 금지** — 객체/배열 뒤 값이 조용히 이긴다 (`tests/unit/CardImageMapping.test.js`가 차단)
- **히든 레시피 추가 시**: `hidden: true`만 넣고 `unlockConditions`를 빠뜨리면 `_checkRecipeUnlocks`가 건너뛰어 조합 시도(`unlockByAttempt`)로만 발견된다. 관례는 `minSkillLevel = requiredSkills` (`tests/unit/HiddenRecipeUnlock.test.js`가 누락 검사)
- **신규 세부장소 추가 시**: `landmarks.js`에 데이터를 넣으면 카드 정의는 `registerSubLocationItems`가 자동 생성하지만, 배경 이미지는 `assets/images/sublocations/<subLocationId>.png`를 직접 넣어야 한다. 없으면 빈 카드로 렌더되고 404가 발생한다 (`CardFactory.js`의 `subLocationImage`가 경로를 무조건 생성).
- 환경 오브젝트(`type:'environment'`): `items_misc.js` 등록 (stream_spring/dry_stream 패턴)
- 검증: `node js/data/validate.js`
- **신규 필드/개념 추가 시 (에디터 설명)**: 데이터에 새 필드를 넣으면 에디터(`tools/editor/`)는 `objNode` 재귀로 **자동 렌더**되지만 마우스오버 *설명(툴팁)*은 사전 등록이 있어야 뜬다. `tools/editor/editor.js`의 도움말 사전에 한 줄 등록 — **아이템 필드 → `ITEM_HELP`**, **밸런스 필드 → `BAL_HELP`**, **공용(구·랜드마크·퀘스트 등) → `FIELD_HELP`**. 누락 검사: `node tools/editor/check-help-coverage.mjs` (아이템 필드 전수 대조, 누락 시 exit 1)

## 4. 장비 슬롯 · NPC · 시스템

- 활성 슬롯: `head`, `face`, `body`, `hands`, `backpack`, `weapon_main`, `weapon_sub`, `boots`
- `weapon_sub` = 보조 무기 + offhand 겸용 (`belt`, `accessory`는 GameState에만, UI 미표시)
- NPC `trust`: 퀘스트 완료로만 증가, 영입/해제는 `NPCSystem.recruit/dismiss`
- NPC `spawnLandmark` (선택): 특정 랜드마크 한정 (예: 응급실 환자). 미지정 시 `spawnDistrict`만 매칭
- NPC 카드 배치: `placeCardInRow`가 middle만 허용, 만차 시 `pendingLoot` 자동 재배치 (bottom 폴백 차단)
- 가방 활성 범위: `findEmptySlot('bottom')`은 `10 + extraSlots`까지만 사용
- `WeatherSystem._refillDryStreams()`: non-rainy→rainy 전환 시에만 호출 (연속 폭풍 중복 방지)
- `--z-notify: 9000`: 알림은 모달(8000) 위, 사망 배너(9999) 아래 유지
- `hydrationDecayPerTP: 1.0` — TP당 갈증 소모량 (gameBalance.js)
- Sublocation 1회 한정 보상: `landmarks.js`의 `firstEnterReward`(claimKey + items) → `ExploreSystem._grantFirstEnterReward`가 `GameState.flags.firstEnterRewardsClaimed`로 중복 차단
- 구조물 지속 효과 `def.effect`(감염 저항·휴식 배율·차단 플래그)는 `onTick`과 경로가 다르다. `StructureEffectSystem`이 집계해 `player.structureEffects`에 캐시하고 소비처가 읽는다 — **집계·소비 배선 없이 `effect`만 선언하면 아무 동작도 하지 않는다**
- 도구 역할 대체: `def.toolProvides: ['medical_station']` → 청사진 `requiredTools` 판정에서 id 일치와 동등 (`toolProvision.js`, CraftSystem·CraftDiscovery 양쪽 반영 필수)
- 현재 날씨는 **`GameState.weather.id`**, 현재 계절은 **`GameState.season.current`** — 필드명이 서로 다르다. 날씨를 `.current`/`.currentWeather`로 읽으면 `?? 'sunny'` 폴백에 조용히 걸려 보정이 통째로 죽는다 (에러도 로그도 없음). 값도 `'rain'`이 아니라 **`'rainy'`**다. 비 계열 판정은 리터럴을 새로 쓰지 말고 `WeatherSystem`이 export하는 `isRainyWeather(id)` / `RAINY_WEATHER_IDS`를 쓴다
- 크로스오버 메인 퀘스트(`objective.type: 'npc_quest_complete'`)의 `subObjectives`는 **`npcStep: <index>`로 대상 NPC 의뢰 steps에 묶는다**. 자체 `match`를 쓰면 완료 게이트(NPC 의뢰)와 표시(체크리스트)가 서로 다른 카운터를 보게 되어 "대화창 미완료 / 퀘스트창 완료"로 갈린다 (`validate.js`가 범위·중복 선언 차단, `tests/unit/QuestNpcCrossoverSync.test.js`가 판정 동기화 검사)
- 구 이동은 **`GameState.recordDistrictArrival(districtId)` 하나로만 기록한다** (`ExploreSystem`·`SubwaySystem` 도착 지점). 이 함수가 `districtsVisited`(생애 누적)와 `districtArrivals`(최근 도착 TP)를 함께 남긴다 — 시스템마다 카운터를 따로 들면 시작 구가 한쪽에만 잡혀 판정이 갈린다
- 메인 퀘스트 `visit_district`(objective·subObjective 모두)는 **`districtArrivals[구] > quest.startTp`**로 판정한다. `districtsVisited`는 비워지지 않는 생애 목록이라 그걸로 판정하면 예전에 스쳐간 구·시작 구까지 "가라" 조건을 충족시킨다 (`tests/unit/QuestVisitDistrictArrival.test.js`가 차단). 단 **NPC 의뢰의 `visit` step은 여전히 `districtsVisited`(생애 누적) 기준**이다 — 의뢰에는 시작 시각 개념이 없다
- **조용히 실패하는 배선 누락 주의**: 데이터에 필드·태그를 선언해도 읽는 코드가 없으면 아무 일도 일어나지 않고 경고도 없다. 신규 필드 추가 시 소비처를 grep으로 확인할 것 (실제 사례: `tags:'temp'` 3턴 소멸, `def.effect` 지속 효과, `toolProvides` 요리 도구 — 셋 다 선언만 있고 배선이 없었다)

## 5. 디자인 시스템

시각적·UI 결정 전 반드시 **`DESIGN.md`를 먼저 읽는다.** 사용자 명시적 승인 없이 이탈 금지.

## 6. 코딩 규칙 · 버그/이슈 형식

→ `.claude/rules/coding-principles.md` 참조

## 7. 스킬 라우팅

일치하는 스킬이 있으면 **스킬 도구를 첫 번째 액션으로 실행한다.**

| 요청 유형 | 스킬 |
|-----------|------|
| 아이디어/브레인스토밍 | `office-hours` |
| 버그/오류 분석 | `investigate` |
| 배포/PR 생성 | `ship` |
| QA/사이트 테스트 | `qa` |
| 코드 리뷰/diff | `review` |
| 배포 후 문서 | `document-release` |
| 디자인 시스템 | `design-consultation` |
| 시각적 검토 | `design-review` |
| 아키텍처 검토 | `plan-eng-review` |
