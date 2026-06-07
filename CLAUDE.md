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
- **신규 아이템 추가 시**: `stackConfig.js` + `districts.js` lootTable + `CardFactory.js` CARD_IMAGES 반드시 등록
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
