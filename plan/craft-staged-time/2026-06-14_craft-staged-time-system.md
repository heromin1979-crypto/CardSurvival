# 제작 단계별 시간 소비 시스템 전환 (트로피칼 아일랜드 방식)

> **작성일:** 2026-06-14
> **유형:** context
> **상태:** 진행중 (계획 확정, 구현 전)

---

## 1. 배경

### 1.1. 문제 (최초 이슈)
밤이 되어 광원(횃불·랜턴 등)이 없으면 이동·탐색·제작·해체가 모두 차단되어, 플레이어가 **휴식/대기만 반복**하는 강제 대기 상황이 발생한다.

### 1.2. 원인 (코드 확인 결과)
- 시간은 `TickEngine.skipTP(n)`를 **명시적으로 호출하는 행동만** 진행시킨다. 자동 틱 없음 (`js/core/TickEngine.js:1-3, 12-15`).
- `skipTP`를 호출하는 행동: 이동/탐색(`ExploreSystem.js:209,307,738`), 휴식(`Rest.js:91`), 대기(`Basecamp.js:297`), 해체(`DismantleSystem.js:69`), 낚시(`FishingSystem.js:128`), 지하철(`SubwaySystem.js:194,333,429`), 랜드마크(`LandmarkModal.js:211,265`).
- **아이템 소비**(`StatSystem.consumeCard` `:604-708`)는 `skipTP`를 호출하지 않아 **시간 0**.
- **아이템 제작**(`CraftSystem`)은 `skipTP`를 호출하지 않고, `activeQueue`에 등록 후 `onTP()`가 외부 행동의 `tpAdvance`에 묻어 `tpRemaining`을 1씩 감소시킨다 (`CraftSystem.js:21,173-179`). 즉 **제작 자체로는 시간이 흐르지 않는다.**
- 야간+광원 없음이면 `NightSystem.canActAtNight('craft')`가 제작 시작을 차단 (`CraftSystem.js:27`, `NightSystem.js:72-86`).

### 1.3. 트로피칼 아일랜드(TI)와의 비교
- TI의 "단계 제작"은 **중간재 체인**이다: 각 단계가 독립된 조합 행동이고, 그 시간만큼 소비하며 중간 아이템을 산출 → 다음 조합의 재료가 된다 (`doc/card_survival_tropical_island_recipes.md:40-94` 코코넛/섬유/비누/점토 체인).
- 이 프로젝트의 멀티스테이지는 **하나의 blueprint 내부 `stages[]`가 자동 진행**되는 구조 (`CraftSystem.js:186-231`)로, 중간 산출물이 없고 플레이어 개입이 없다.

---

## 2. 목표 구조

**"스테이지 단위 즉시 시간 소비 + 자동 진행 제거 + 플레이어 주도 다음 단계"**

각 스테이지를 시작/이어갈 때 그 스테이지의 `tpCost`만큼 `TickEngine.skipTP`로 **즉시** 시간을 소비하고 그 단계만 완료한다. 다음 스테이지가 있으면 자동 진행하지 않고 **진행 중 제작 카드를 "다음 단계 대기" 상태로 보드에 유지**한다. 플레이어가 다음 단계 재료를 카드 조합(드롭) 또는 "이어서 제작" 버튼으로 투입하면 그 스테이지 `tpCost`를 다시 소비하며 진행한다. 마지막 스테이지 완료 시 `_produceOutput`으로 최종 산출.

TI의 중간재 체인 UX를 **데이터 재설계 없이**(기존 `blueprints.js`의 `stages[]` 그대로) 재현하는 것이 핵심 이점이다.

### 2.1. 확정된 결정 사항
| # | 항목 | 결정 |
|---|------|------|
| 1 | 다음 단계 트리거 | 카드 드롭 **+** "이어서 제작" 버튼 (둘 다) |
| 2 | 첫 단계 시작 | 즉시 시간 소비 |
| 3 | 큰 단일 단계 점프 | 수용 (예: 9 TP 단계 = 시작 시 9 TP 즉시 점프) |
| 4 | 야간 정책 | 각 단계 진행 시점마다 `canActAtNight('craft')` 판정. 낮에 진행한 단계는 정상 소비, 야간에 이어서 제작하려면 광원 필수. 완료된 단계는 소급 없음 |
| 5 | 세이브 호환 | 옛 세이브의 진행 중 제작을 "현재 단계 대기(`awaitingNext:true`)"로 정규화 |

---

## 3. 기술적 내용

### 3.1. 관련 파일
| 파일 | 변경 성격 |
|------|-----------|
| `js/systems/CraftSystem.js` | 핵심 로직 재작성 (시작·진행·완료) |
| `js/core/GameState.js` | `crafting.activeQueue` entry 구조 + 세이브 마이그레이션 |
| `js/board/DragDrop.js` | 진행 중 제작 카드에 재료 드롭 → 다음 단계 트리거 |
| `js/ui/CraftUI.js` | 진행률 → "다음 단계 대기 / 필요 재료" 표시 + "이어서 제작" 버튼 |
| `js/systems/NightSystem.js` | (정책 호출처만 추가, 함수 자체는 유지) |
| `js/data/blueprints.js` | **변경 거의 없음** (기존 `stages[]` 재사용) |

### 3.2. 데이터 구조 변경

**`GameState.crafting.activeQueue` entry** (현재 `CraftSystem.js:135-142`):
- 추가 필드: `awaitingNext` (boolean) — 현재 스테이지 완료 후 다음 단계 재료를 기다리는 상태.
- 의미 변화: `tpRemaining`은 "외부 TP로 1씩 깎이는 잔여량"이 아니라, 즉시 소비 모델에서는 사실상 불필요 → **제거 또는 0 고정**. 단계 진행 여부는 `stageIndex` + `awaitingNext`로 판정.
- `_craftEntry`(제작 카드, `CraftSystem.js:148-159`)에도 `awaitingNext`, `nextStageLabel`, `nextStageReqs`(다음 단계 필요 재료 요약) 동기화.

### 3.3. CraftSystem 함수 재설계

#### (a) `startBlueprint(blueprintId)` — 첫 단계 즉시 소비
- 기존 `canStartBlueprint` 게이트 유지 (야간 광원, 큐/중복/스킬/재료/도구) `:25-58`.
- stage[0] 재료 소모(`:101-124`) 유지.
- **변경**: 큐 등록 후 곧바로 `_runStage(entry, 0)` 호출 → `TickEngine.skipTP(stage.tpCost)` + 단계 완료 처리.
- 1-TP 단일 스테이지 즉시 제작 분기(`:126-133`)는 `_runStage`로 통합 가능.

#### (b) `_runStage(entry, stageIndex)` — 신규: 한 스테이지 실행
1. `NightSystem.canActAtNight('craft')` 재확인 (단계 진행 시점 야간 판정 — 결정 4).
2. 해당 스테이지 재료 충족 확인 (`_checkStageReqs` `:60-83` 재사용) + 재료 소모.
3. `TickEngine.skipTP(stage.tpCost, ...)` 로 **즉시 시간 소비**.
4. 마지막 스테이지면 `_produceOutput(bp, entry)` (`:289` 재사용) → 큐에서 제거.
5. 다음 스테이지가 있으면 `entry.stageIndex++` 하지 않고, `entry.awaitingNext = true` + 제작 카드 `_craftEntry` 동기화 후 **멈춤**.

#### (c) `advanceCraftStage(craftCardId, [providedItemIds])` — 신규: 다음 단계 진행
- "이어서 제작" 버튼/카드 드롭이 호출하는 진입점.
- entry를 `craftCardId`로 찾고, `awaitingNext`면 다음 stageIndex로 `_runStage` 호출.
- 재료 부족/야간 광원 부족 시 `notify`로 사유 표시하고 진행 중단(시간 소비 없음).

#### (d) `onTP()` — 큐 자동 진행 제거
- 기존 `:173-244`의 `tpRemaining--` 자동 진행 로직 **삭제**.
- 제작은 더 이상 `tpAdvance`에 의존하지 않으므로 `EventBus.on('tpAdvance', onTP)` 구독(`:21`)도 제거 또는 빈 처리.

### 3.4. DragDrop 연동 (`js/board/DragDrop.js`)
- `_onDrop`(`:239~`)에 분기 추가: 드롭 대상 카드가 `_crafting && _craftEntry.awaitingNext`이고, 드래그 카드가 다음 단계 필요 재료면 → `CraftSystem.advanceCraftStage(targetId, [sourceId])` 호출.
- 호버 힌트(`getQuickHint` `:193-197`)와 동일 패턴으로 "이어서 제작 가능" 힌트 표시 검토.

### 3.5. CraftUI 연동 (`js/ui/CraftUI.js`)
- `_renderQueue`(`:326-362`): 진행률 막대 대신, `awaitingNext` 상태면 **"다음 단계: {label} — 필요 재료 {…}"** 와 **"이어서 제작" 버튼** 렌더.
- 버튼 클릭 → `CraftSystem.advanceCraftStage(craftCardId)`.
- `tpAdvance` 구독으로 큐 렌더(`:44`)는 유지하되, 즉시 소비 모델에서는 `craftStarted`/신규 `craftStageAdvanced` 이벤트 기준으로 갱신하도록 조정.

### 3.6. 세이브 마이그레이션 (`js/core/GameState.js`)
- `deserialize`(`:723~`)에 보정 추가 (기존 `:734-756` 패턴 준수):
  - `this.crafting.activeQueue`의 각 entry에 `awaitingNext`가 없으면 `true`로 설정(진행 중이던 제작을 "현재 단계 대기"로 정규화).
  - `cards`의 `_craftEntry`에도 동일 정규화.
- 의도: 자동 진행이 사라졌으므로 옛 세이브의 진행 중 제작이 멈추지 않도록, 플레이어가 "이어서 제작"으로 재개할 수 있게 한다.

---

## 4. 구현 순서 (단계별)

1. **데이터/상태**: `GameState.crafting` entry에 `awaitingNext` 도입 + `deserialize` 마이그레이션. (검증: 옛 세이브 로드 시 진행 중 제작이 대기 상태로 표시)
2. **CraftSystem 코어**: `_runStage`/`advanceCraftStage` 신규 + `startBlueprint` 즉시 소비 전환 + `onTP` 자동 진행 제거. (검증: 단일/멀티 스테이지 제작 시작 시 `skipTP` 호출되어 시간 점프)
3. **야간 정책**: `_runStage`/`advanceCraftStage` 양쪽에 `canActAtNight('craft')` 적용. (검증: 야간 광원 없이 이어서 제작 시도 → 차단)
4. **UI**: `CraftUI` "다음 단계 대기 + 이어서 제작 버튼" + `DragDrop` 재료 드롭 트리거. (검증: 버튼/드롭 둘 다 다음 단계 진행)
5. **회귀 검증**: 제작 실패/품질/스킬 XP/구조물 배치(`_produceOutput` `:289-407`)가 그대로 동작하는지.

---

## 5. 검증 방법

- **데이터 검증**: `node js/data/validate.js` (blueprints 구조 무결성).
- **수동 시나리오** (combat-test 하네스 패턴 참고, `window.GameState`로 상태 확인):
  1. 캠프파이어 제작 시작 → `time.totalTP`가 3 증가(화롯대 준비 3 TP), 제작 카드 `awaitingNext=true` 확인.
  2. flame_token 드롭/버튼 → `totalTP` +1, 캠프파이어 완성.
  3. 야간(hour 0~4) + 광원 없음 상태에서 이어서 제작 시도 → 차단 알림 확인.
  4. 광원 보유 후 이어서 제작 → 정상 진행.
- **세이브 호환**: 변경 전 세이브(진행 중 제작 포함) 로드 → 대기 상태로 정규화되어 이어서 제작 가능 확인.
- **회귀**: 단일 1-TP 제작(라이터 등) 즉시 완성, 제작 실패 시 재료 환불, 품질 알림 정상.

> **주의(검증 원칙)**: 위 검증은 구현 후 실제 실행하여 결과(로그/상태 값)를 보고한 뒤 완료를 선언한다. "될 것이다"로 완료 처리하지 않는다.

---

## 6. 리스크 / 미해결

- **소비(consumeCard) 시간 부여는 이번 범위 제외.** 최초 이슈의 "소비로 시간 넘기기"는 제작 시간화로 부분 해소되나, 소비 시간화가 필요하면 별도 계획.
- **도구·숙련도 제작 시간 단축**(TI 특성)은 이번 범위 제외. `tpCost` 고정 유지.
- **큰 단계 점프**: 결정 3으로 수용했으나, 9 TP 단계는 한 번에 3시간 점프 → 그 사이 조우/이벤트가 끼어들 수 없음. 플레이 테스트로 체감 확인 필요.
- **동시 큐 동작**: 즉시 소비 모델에서 여러 제작 카드를 보드에 동시 유지하는 것은 가능하나, "한 번에 진행"이 아니라 각각 독립 진행됨 — 기존 병렬 큐와 의미가 달라지므로 UI 표현 점검.

---

## 7. 참고 자료

- 현재 제작 로직: `js/systems/CraftSystem.js`
- 시간 엔진: `js/core/TickEngine.js`
- 야간 규칙: `js/systems/NightSystem.js:72-86`
- 소비 로직: `js/systems/StatSystem.js:604-708`
- TI 레시피 자료: `doc/card_survival_tropical_island_recipes.md`
- 신규 아이템/필드 등록 규칙: `CLAUDE.md` §3
