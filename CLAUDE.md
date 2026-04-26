# Card Survival: Rㄴㅇㅊ뉴오ㅓ츈어츙천유차어늋ㅍ유차ㅓ유ㅓuined City — Project Guide

## 기술 스택
- 바닐라 JS (모듈), CSS 변수, Vite 번들러
- 고정 해상도 1920×1080 (Scale 방식, `main.js`)
- Capacitor (Android/iOS 빌드), Electron (PC 빌드)

## 보드 레이아웃 규칙
- 장소(top) / 바닥(middle): 10칸 flex, `flex: 1 1 0` on slots
- 휴대(bottom): 20칸 `grid 10열×2행`, 기본 10칸 활성, 가방 장착 시 `extraSlots`만큼 추가 해금
- 슬롯 수 고정: `ROW_CONFIG.slots` 사용 (GameState 배열 길이 참조 금지)
- `--card-h: 155px` = 장소 행 참고값, 바닥/휴대는 flex로 결정

## 아이템/레시피 데이터 구조
- 아이템: `items.js` 애그리게이터 → `items_base`, `items_combat`, `items_misc`, `items_tech`, `items_medical`, `items_tools`, `items_structures` (7개 파일)
- 레시피: `CraftSystem.js`에서 `blueprints.js` + `blueprints_advanced.js` + `hiddenRecipes.js` 병합
- 시크릿 조합: `secretCombinations.js` (별도 시스템)
- 스택 설정: `stackConfig.js` (신규 아이템 추가 시 반드시 등록)
- 탐색 루트: `districts.js` lootTable (신규 원재료 추가 시 등록)
- 이미지 매핑: `CardFactory.js` CARD_IMAGES (신규 아이템 추가 시 등록)
- 검증: `node --input-type=module js/data/validate.js`

## 장비 슬롯 구조 (EquipmentModal)
- 활성 슬롯: head, face, body, hands, backpack, weapon_main, weapon_sub, boots
- weapon_sub = offhand + weapon_sub 겸용 (offhand 슬롯 제거됨)
- belt, accessory는 GameState에만 존재, UI에서는 표시 안 함
- 서울 지도: `GameState.flags.mapFragments` 3개 수집 시 `mapUnlocked` 플래그 해금

## NPC 시스템
- trust는 퀘스트 완료로만 증가 (대화 불가), 첫 퀘스트 triggerTrust: 0
- 영입 시 보드 카드 제거, 해제 시 카드 재생성 (NPCSystem recruit/dismiss)
- 동반자 능력: trust 기반 스케일링 ×1.0~×1.3 (식량 소모 제외)
- 부상 NPC: woundLevel 치료 후 canRecruit 해금 (NPCDialogueModal)

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
