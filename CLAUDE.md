# Card Survival: Ruined City — 프로젝트 가이드

> **AI의 행동 규칙 및 프로젝트 참조 문서**

---

## 1. 기술 스택

- 바닐라 JS (모듈), CSS 변수, Vite 번들러
- 고정 해상도 1920×1080 (Scale 방식, `main.js`)
- Capacitor (Android/iOS 빌드), Electron (PC 빌드)

---

## 2. 보드 레이아웃 규칙

- 장소(상단) / 바닥(중단): 10칸 flex, 슬롯에 `flex: 1 1 0` 적용
- 휴대(하단): 20칸 `grid 10열×2행`, 기본 10칸 활성, 가방 장착 시 `extraSlots`만큼 추가 해금
- 슬롯 수 고정: `ROW_CONFIG.slots` 사용 (GameState 배열 길이 직접 참조 금지)
- `--card-h: 155px` = 장소 행 참고값, 바닥/휴대는 flex로 결정

---

## 3. 아이템/레시피 데이터 구조

- 아이템: `items.js` 애그리게이터 → `items_base`, `items_combat`, `items_misc`, `items_tech`, `items_medical`, `items_tools`, `items_structures` (7개 파일)
- 레시피: `CraftSystem.js`에서 `blueprints.js` + `blueprints_advanced.js` + `hiddenRecipes.js` 병합
- 시크릿 조합: `secretCombinations.js` (별도 시스템)
- 스택 설정: `stackConfig.js` — **신규 아이템 추가 시 반드시 등록**
- 탐색 루트: `districts.js` lootTable — **신규 원재료 추가 시 반드시 등록**
- 이미지 매핑: `CardFactory.js` CARD_IMAGES — **신규 아이템 추가 시 반드시 등록**
- 검증 명령어: `node --input-type=module js/data/validate.js`

---

## 4. 장비 슬롯 구조 (EquipmentModal)

- 활성 슬롯: `head`, `face`, `body`, `hands`, `backpack`, `weapon_main`, `weapon_sub`, `boots`
- `weapon_sub` = 보조 무기 + 방어구(offhand) 겸용 슬롯 (offhand 슬롯 제거됨)
- `belt`, `accessory`는 GameState에만 존재하며 UI에서는 표시하지 않음
- 서울 지도: `GameState.flags.mapFragments` 3개 수집 시 `mapUnlocked` 플래그 해금

---

## 5. NPC 시스템

- `trust`는 퀘스트 완료로만 증가 (대화만으로는 증가 불가), 첫 퀘스트 `triggerTrust: 0`
- 영입 시 보드 카드 제거, 해제 시 카드 재생성 (`NPCSystem.recruit` / `NPCSystem.dismiss`)
- 동반자 능력: trust 기반 스케일링 ×1.0~×1.3 (식량 소모는 스케일링 제외)
- 부상 NPC: `woundLevel` 치료 완료 후 `canRecruit` 해금 (`NPCDialogueModal`)

---

## 6. 디자인 시스템

시각적·UI 결정을 내리기 전, 반드시 **`DESIGN.md`를 먼저 읽어야 한다.**

- 폰트 선택, 색상, 간격, 전체 미적 방향은 모두 `DESIGN.md`에 정의되어 있다.
- 사용자의 명시적 승인 없이 디자인 가이드에서 이탈하지 말 것.
- QA 모드에서는 `DESIGN.md`와 일치하지 않는 코드를 반드시 지적할 것.

---

## 7. 절대 규칙

### 7.1. 코드 분석 원칙

**⚠️ 다음 행동은 절대 금지:**

- 파일 일부만 읽고 버그를 찾았다고 단정하는 것
- "~일 것이다", "~인 것 같다" 등 추측성 표현 사용
- 함수 일부만 읽고 전체를 이해한 척하는 것
- 호출 체인만 나열하고 실제 로직 분석을 생략하는 것

### 7.2. 계획 작성 원칙

계획서에는 반드시 **실제 파일 경로, 함수명, 변수명**을 사용한다.

- 관련 코드를 먼저 읽고 설계를 시작할 것
- "~하면 된다"가 아닌 **왜 그렇게 해야 하는지** 맥락을 명시할 것
- 계획에 포함된 코드 예시는 방향 제시용 슈도 코드이므로, 구현 시 반드시 실제 파일을 확인 후 해당 컨텍스트에 맞게 작성할 것

### 7.3. 주석 작성 원칙

소스 코드는 최종 결과물이다. 작업 메모판이 아니다.

1. **메타데이터 포함 금지** — 진행 상황, 이모티콘(🆕, ✅), 단계 번호 절대 금지
2. **당연한 동작 설명 금지** — 코드를 읽으면 알 수 있는 내용(What) 금지, **의도(Why)**만 작성
3. **임시 주석은 `TODO` / `FIXME`로 통일**

```js
// ❌ 🆕 Phase 1: 슬롯 초기화
// ❌ count++; // 카운트 증가
// ✅ 네트워크 지연 보정을 위해 1프레임 대기
// ✅ TODO: 슬롯 개수 동적 계산으로 교체 필요
```

### 7.4. 버그/이슈 문서 필수 항목

세션 간 연속성 확보를 위해 버그 문서에 반드시 포함할 것:

1. **증상** — 무엇이 문제인가
2. **원인** — 왜 발생하는가 (코드 흐름 설명)
3. **해결 방향** — 어떻게 고칠 것인가
4. **기대 결과** — 수정 후 무엇이 달라지는가
5. **진행 상황** — 현재 어디까지 완료되었는가

---

## 8. 스킬 라우팅

사용자의 요청이 사용 가능한 스킬과 일치하면, **스킬 도구를 첫 번째 액션으로 반드시 실행해야 한다.** 직접 답변하거나 다른 도구를 먼저 사용하지 말 것. 스킬에는 임기응변식 답변보다 더 나은 결과를 만드는 전문 워크플로우가 있다.

| 요청 유형 | 실행할 스킬 |
|-----------|-------------|
| 아이디어 제안, 기획, 브레인스토밍 | `office-hours` |
| 버그, 오류, 원인 분석 | `investigate` |
| 배포, PR 생성 | `ship` |
| QA, 사이트 테스트, 버그 탐색 | `qa` |
| 코드 리뷰, diff 확인 | `review` |
| 배포 후 문서 업데이트 | `document-release` |
| 주간 회고 | `retro` |
| 디자인 시스템, 브랜드 관련 | `design-consultation` |
| 시각적 검토, 디자인 개선 | `design-review` |
| 아키텍처 검토 | `plan-eng-review` |
