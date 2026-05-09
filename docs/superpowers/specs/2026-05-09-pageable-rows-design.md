# 휴대·바닥 행 페이지화 설계

- 작성일: 2026-05-09
- 대상 파일 추정: `js/core/GameState.js`, `js/ui/BoardRenderer.js`, `js/systems/EquipmentSystem.js`, `js/ui/EquipmentModal.js`, `js/screens/CharCreate.js`, `js/persistence/*`, `css/variables.css`, 보드 CSS
- 결과물: 페이지 단위로 확장되는 휴대(`bottom`)·바닥(`middle`) 행 + 행 우측 도트 페이저 UI

## 1. 배경

현재 보드는 세 행 모두 단일 페이지다.

- `top` (장소): 10칸 고정
- `middle` (바닥): 10칸 고정
- `bottom` (휴대): 배열 길이 20 고정. 활성 범위는 `10 + extraSlots`이며 가방으로 `+3 / +5 / +7`까지 해금. 나머지 슬롯은 disabled로 잠긴다.

채집·제작·분해 결과물이 한 번에 다량 산출되면 바닥 10칸이 즉시 가득 차 `pendingLoot`으로 빠지거나 사용자가 정리에 발목을 잡힌다. 휴대 슬롯은 가방을 끼더라도 한 행에 모두 노출되어 화면이 답답하다. 본 설계는 두 행을 페이지 단위로 확장해 시야와 수용량을 함께 늘린다.

## 2. 목표

- 휴대 기본 슬롯을 20칸으로 확대하고, 가방 착용 시 가방 칸수만큼의 2페이지를 해금한다(최대 2페이지).
- 바닥은 항상 2페이지(각 10칸)가 활성, 1페이지가 가득 차서 2페이지로 오버플로우되는 순간 3페이지(10칸)가 영속 해금된다(최대 3페이지).
- 행 우측 세로 도트 페이저로 페이지를 표시·전환한다.
- 시스템이 카드를 다른 페이지에 배치할 때 자동으로 해당 페이지로 전환한다(채집·제작·분해 등).
- 가방 해제 시 페이지 2 카드를 페이지 1 빈칸이 충분하면 자동 이주, 아니면 토스트로 차단한다.

## 3. 비목표

- 장소 행(`top`)은 변경하지 않는다.
- `environment` 사이드바·기타 사이드바 위젯은 변경하지 않는다.
- 가방 종류 추가(예: trekking_bag, expedition_bag)는 본 설계 범위 밖이다. 데이터 형식(`BAG_EXTRA_SLOTS`)은 그대로 두고 값만 재조정한다.
- 페이지 간 자동 카드 균형(예: 1페이지 빈자리에 2페이지 카드 자동 이동)은 가방 해제 시 1회 이주를 제외하고 수행하지 않는다.

## 4. 결정 사항 요약

| 항목 | 값 |
|------|----|
| 휴대 1페이지 슬롯 수 | 20 (가방 무관 항상) |
| 휴대 2페이지 슬롯 수 | 가방 칸수 (없음 시 비활성) |
| 휴대 최대 페이지 | 2 |
| 가방 칸수 재조정 | small_bag 3→8, backpack 5→14, military_bag 7→20 |
| 바닥 페이지 수 | 항상 2, 조건부 3 |
| 바닥 페이지 크기 | 모두 10칸 |
| 바닥 3페이지 해금 트리거 | 1페이지 만차 → 2페이지로 시스템 배치되는 순간 |
| 바닥 3페이지 해금 영속성 | 세션·저장에 영구 유지(축소 없음) |
| 페이지 UI | 행 우측 세로 도트 + 좌우 화살표 |
| 자동 페이지 전환 | 시스템 배치(`placeCardInRow`)에만 적용. 수동 드래그는 유지 |
| 가방 해제 정책 | B-1: 페이지 1 빈칸 ≥ 페이지 2 카드 수 → 자동 이주 후 해제 / 부족하면 토스트 차단 |
| 데이터 구조 | 평면 배열 + 페이지 메타(현재 패턴 유지) |

## 5. 데이터 모델

### 5.1 GameState 스키마 변경

```text
GameState.player.extraSlots          // 기존 — 가방 칸수(= 휴대 2페이지 길이)
GameState.player.middlePage3Unlocked // 신규 — 바닥 3페이지 해금 여부(boolean, 기본 false)
GameState.ui.bottomPage              // 신규 — 현재 보고 있는 휴대 페이지 인덱스(0|1)
GameState.ui.middlePage              // 신규 — 현재 보고 있는 바닥 페이지 인덱스(0|1|2)
```

### 5.2 board 배열 길이 규칙

- `board.bottom.length = 20 + extraSlots` (가방 미착용 시 20).
- `board.middle.length = 20` (기본). `middlePage3Unlocked` 일 때 30.
- 페이지 N의 슬롯 i는 `idx = N * pageSize + i`.
  - 휴대: 페이지 0 = `idx 0~19`, 페이지 1 = `idx 20 ~ 20+extraSlots-1`.
  - 바닥: 페이지 N = `idx N*10 ~ N*10+9`.

### 5.3 가방 칸수 매핑

`js/systems/EquipmentSystem.js`의 `BAG_EXTRA_SLOTS`:

```text
small_bag    : 3 → 8
backpack     : 5 → 14
military_bag : 7 → 20
```

`_equipBag` 흐름은 그대로(`gs.player.extraSlots = extra`), `boardReinit` 이벤트로 BoardRenderer가 길이를 다시 계산.

### 5.4 마이그레이션 (저장 호환)

`GameState.load`(또는 동등 경로)에서:

1. `board.middle.length < 20`이면 길이 20으로 확장(뒤쪽 null 채움).
2. `player.middlePage3Unlocked`가 undefined면 false. 길이 30 데이터가 있으면 true(보수적으로 둘 다 만족하면 true).
3. `player.extraSlots`는 그대로 유지하되, 장착된 가방을 보고 새 `BAG_EXTRA_SLOTS`로 재계산해 갱신. `board.bottom.length`를 `20 + extraSlots`로 맞추고, 기존 활성 슬롯(과거 0~9 = 페이지 1, 10~16 = 페이지 2)에 있던 카드는 새 페이지 인덱스로 재배치:
   - 기존 0~9 → 새 0~9 그대로(페이지 1 앞쪽).
   - 기존 10~10+oldExtra-1 → 새 20~20+oldExtra-1로 이동(페이지 2 앞쪽). 새 페이지 2 길이는 새 `extraSlots` 값.
   - 기존 disabled(과거 17~19 등)에 카드가 있었다면 안전상 페이지 1 빈칸으로 회수, 부족하면 `pendingLoot`.
4. `ui.bottomPage`, `ui.middlePage`는 0으로 초기화.

기존 세이브가 항상 `bottom.length = 20`이라는 점은 `js/core/GameState.js:679` 패딩 로직으로 보장됨. 이 로직은 새 길이(`20 + extraSlots`)로 일반화한다.

## 6. 핵심 로직 변경

### 6.1 `findEmptySlot(row)` — `js/core/GameState.js:369`

- `bottom`: `0 ~ 19` → 페이지 1 우선, 비어 있는 슬롯 없으면 `20 ~ 20+extraSlots-1` → 페이지 2.
- `middle`: 기존과 동일하게 `0`부터 순차 탐색. 길이는 `20` 또는 `30`(해금 후).
- 동작은 기존과 동일하나 `bottom` 활성 범위가 페이지 1+페이지 2로 확장된 형태.

### 6.2 페이지 인지 압축 — `_compactRowPaged(row, pageSize)`

- 기존 `_compactRow`는 행 전체에서 null을 뒤로 밀어 페이지 경계를 무시한다.
- 변경: 각 페이지를 독립 구간으로 보고 그 안에서만 null을 뒤로 민다.
  - `middle`: pageSize 10. 페이지 1(0~9)·페이지 2(10~19)·페이지 3(20~29) 각각 압축.
  - `bottom`: 페이지 1(0~19, pageSize 20) 안에서 압축, 페이지 2(20~20+extraSlots-1, pageSize=extraSlots) 안에서 압축.
- 호출 지점 변경: `js/core/GameState.js:315`(`removeCardInstance` 등 압축 호출), `js/core/GameState.js:357` 등 모든 `_compactRow` 호출처를 `_compactRowPaged`로 교체.

### 6.3 `placeCardInRow` — page3 해금 트리거

- `js/core/GameState.js:391` 근처. middle/bottom에 카드를 놓은 직후 다음 검사:

```text
if (row === 'middle' && !player.middlePage3Unlocked) {
  page1Full = board.middle.slice(0, 10).every(v => v !== null)
  landedOnPage2 = slot >= 10 && slot < 20
  if (page1Full && landedOnPage2) {
    player.middlePage3Unlocked = true
    board.middle.length = 30  // 뒤 10칸 null 채움
    EventBus.emit('middlePage3Unlocked', {})
  }
}
```

- 사용자 수동 드래그(자유로운 슬롯 클릭 이동)에서도 같은 트리거를 적용할지 — 본 설계는 시스템 배치만 트리거로 본다(`placeCardInRow` 경로). 사용자가 빈 페이지 1을 두고 페이지 2에 카드를 직접 옮긴 경우는 page3 해금하지 않는다. 이 동작은 BoardManager 드래그 핸들러에서 `placeCardInRow`를 우회해 직접 슬롯 할당하는 기존 코드 흐름과도 일치한다.

### 6.4 NPC 배치

- `placeCardInRow`의 NPC 분기는 middle만 사용하며 만차 시 `pendingLoot`. middle이 길이 20/30으로 늘어나도 동일 분기 그대로. NPC가 페이지 2 첫 슬롯에 떨어져도 위 6.3 트리거가 작동.

### 6.5 가방 해제 정책 (B-1) — `_unequipBag` (`js/systems/EquipmentSystem.js:178`)

```text
const page2Cards = board.bottom.slice(20, 20 + extraSlots).filter(v => v !== null)
const page1Free  = board.bottom.slice(0, 20).filter(v => v === null).length

if (page2Cards.length === 0) {
  proceed unequip
} else if (page1Free >= page2Cards.length) {
  for each non-null in slice(20, 20+extraSlots):
    move to first null in slice(0, 20)
  proceed unequip
} else {
  show toast 'i18n key: bag.unequip.blocked.notEnoughSpace'
  return  // 해제 차단
}

on proceed:
  player.extraSlots = 0
  board.bottom.length = 20  // 페이지 2 제거
  EventBus.emit('boardReinit', {})
```

토스트 메시지(예: "휴대 1페이지를 비우고 다시 시도하세요 / Free up Page 1 first")는 i18n 키로 등록.

## 7. UI 설계

### 7.1 페이저 컴포넌트

- 위치: 각 행의 슬롯 그리드 우측 끝.
- 구성: 세로 도트 + 좌우 화살표 `‹ ›`(가로 행이지만 페이지 이동 의미는 좌우).
- 도트 상태:
  - 현재 페이지: `--color-accent-primary`로 채운 원 `●`.
  - 점유 페이지(카드 ≥ 1): `--color-text-secondary` 채운 원.
  - 빈 페이지(해금됐지만 카드 0): `--color-border` 외곽선 원 `◌`.
- 잠긴 페이지(가방 미장착의 휴대 페이지 2, 미해금 바닥 페이지 3)는 도트 자체 미표시.
- 도트 클릭 → 페이지 전환. 화살표 `‹ ›` → 인접 페이지로 전환.

### 7.2 슬롯 영역 렌더

- 행 영역은 항상 가장 큰 페이지 기준 높이(휴대 페이지 1의 10×2, 바닥의 1×10) — 페이지 전환 시 행 높이 변동 없음.
- 휴대 페이지 2가 가방 칸수에 따라 작을 때(예: 8칸): 8칸 active 슬롯을 페이지 1과 동일한 그리드 모양으로 좌상단부터 채우고 나머지는 시각 비활성 영역(`slot-empty-bg` 등 유휴 배경)으로 표시.
- 1920×1080 고정 해상도(`main.js`)이므로 페이저 폭(약 32~40px) 추가에 따른 슬롯 그리드 폭 미세 조정만 발생. 슬롯 크기는 그대로 유지.

### 7.3 자동 페이지 전환

- `EventBus.on('cardPlaced', ({ instanceId, row, slot }))`에서:
  - row가 `middle` 또는 `bottom`이면 `pageOf(row, slot)` 계산.
  - 현재 `GameState.ui.[rowname]Page`와 다르면 `ui.[rowname]Page = pageOf(...)` 갱신, BoardRenderer 리렌더.
- `cardPlaced`는 `placeCardInRow`에서만 발행되므로 시스템 배치에만 적용된다. 사용자 드래그는 BoardManager에서 별도 경로로 처리되며 자동 전환 대상이 아니다.
- 동일 프레임에 여러 카드가 들어오면(예: 분해 다수 산출) 마지막 배치된 카드의 페이지로 전환. 일관성 유지.

### 7.4 드래그 호버 페이지 전환

- 드래그 중 페이저 도트 위에 마우스가 정지하면 400ms 후 해당 페이지로 전환. 빈 슬롯에 드롭 가능.
- 호버 해제 시 타이머 취소.
- BoardManager의 드래그 핸들러에 페이저 도트의 `data-page` 데이터를 인식하는 분기 추가.

### 7.5 i18n / 디자인 토큰

- 라벨: "휴대 1페이지", "Inventory Page 1" 등. 키 후보:
  - `board.inventory.page` ("휴대 {n}페이지" / "Inventory Page {n}")
  - `board.floor.page`     ("바닥 {n}페이지" / "Floor Page {n}")
  - `bag.unequip.blocked.notEnoughSpace`
- 색상은 `css/variables.css` 토큰만 사용. 새 색 추가 없음.

## 8. 영향 받는 파일

| 파일 | 변경 |
|------|------|
| `js/core/GameState.js` | `findEmptySlot` 페이지 인지, `_compactRowPaged` 도입, `placeCardInRow`에 page3 해금 트리거, 스키마(`ui.bottomPage`/`ui.middlePage`/`player.middlePage3Unlocked`) 추가, 로드 마이그레이션 |
| `js/ui/BoardRenderer.js` | `ROW_CONFIG.slots` 동적 계산, 페이저 DOM/이벤트, 현재 페이지만 active 영역, `cardPlaced` 자동 전환, FLIP과 페이지 전환 충돌 회피 |
| `js/systems/EquipmentSystem.js` | `BAG_EXTRA_SLOTS` 값 갱신, `_unequipBag` B-1 정책 |
| `js/ui/EquipmentModal.js` | 가방 슬롯 라벨/툴팁의 칸수 표기 검토 |
| `js/screens/CharCreate.js` | 시작 시 새 스키마 기본값 초기화 호환 확인 |
| `js/persistence/*` | 마이그레이션 1회 (가방 칸수 재계산, middle 길이 확장) |
| `css/variables.css` 사용 보드 CSS | 페이저 컴포넌트 스타일 |
| `js/data/items_tools.js` | `bagSlots` 명시 필드 도입 검토(선택, 본 설계는 코드 매핑 유지) |
| i18n 데이터 | 신규 키 추가 |

## 9. 테스트 케이스

1. 가방 미착용에서 휴대 1페이지 20칸이 active, 페이저 도트 1개.
2. small_bag 장착 → 페이저 도트 2개, 페이지 2 = 8칸 active.
3. 가방 교체(small_bag → backpack): 페이지 2 카드 보존, 빈자리 6칸 늘어남.
4. 가방 해제 — 페이지 2 비어 있으면 즉시 해제.
5. 가방 해제 — 페이지 2 카드 있고 페이지 1 빈칸 충분 → 자동 이주 후 해제.
6. 가방 해제 — 페이지 1 빈칸 부족 → 토스트 표시, 해제 차단.
7. 바닥 페이지 1 만차 → 채집 결과물 1개 추가 → 페이지 2 첫 슬롯에 들어가고 그 순간 페이지 3 해금(도트 3개), 자동 전환으로 페이지 2 표시.
8. 페이지 3 해금 후 모든 카드 제거 → 도트 3개 유지(영속).
9. 페이지 2 만차에서 페이지 3에 카드 → 페이지 3 자동 전환.
10. 페이지 3까지 모두 만차 → `pendingLoot` 폴백 그대로 작동.
11. NPC가 middle에 들어올 때 페이지 2도 사용. 페이지 1 만차 시 페이지 2 첫 슬롯에 자리 잡고 page3 해금 트리거 작동.
12. `_compactRowPaged` — 페이지 1 중간 카드 제거 시 페이지 1 안에서만 압축, 페이지 2 카드가 끌려오지 않음.
13. 도트 호버 400ms → 페이지 전환 → 빈 슬롯 드롭 성공.
14. 자동 페이지 전환은 `placeCardInRow` 경로(시스템 배치)에만 작동. 사용자 수동 드래그는 페이지 자동 전환 안 함.
15. 저장 → 로드 — 기존 세이브의 length=10 middle이 length=20으로 마이그레이션. `middlePage3Unlocked = false` 기본. 기존 가방의 `extraSlots`가 새 매핑으로 갱신.
16. 1920×1080 고정 해상도에서 페이저 추가 후 행 높이 변동 없음(스크린샷 비교).

## 10. 구현 순서 (PR 단위)

1. **데이터 레이어 (No UI)** — GameState 스키마, `findEmptySlot` 페이지 인지, `_compactRowPaged`, `placeCardInRow` page3 해금 트리거, 로드 마이그레이션, 단위 테스트.
2. **가방 리밸런싱 + B-1** — `BAG_EXTRA_SLOTS` 새 값, `_unequipBag` 자동 이주, 토스트 i18n.
3. **렌더링 + 페이저** — BoardRenderer가 현재 페이지만 active로 그리고 도트/화살표 컴포넌트 추가, `cardPlaced` 자동 전환.
4. **드래그 페이지 전환** — 도트 호버 400ms 전환, BoardManager 드래그 핸들러에 분기.
5. **검수** — 시각 회귀 스크린샷, 위 16개 케이스 수동 확인, `DESIGN.md` 토큰 일치 확인, `node --input-type=module js/data/validate.js` 통과 확인.

## 11. 위험 요소·완화

- **압축 회귀**: `_compactRow` → `_compactRowPaged` 교체 누락 시 페이지 1 카드가 페이지 2로 끌려간다. 모든 호출처(`js/core/GameState.js:315`, `:357` 등) 일괄 교체 후 페이지 압축 단위 테스트로 가드.
- **마이그레이션 데이터 손실**: 기존 활성 외 슬롯에 카드가 있는 비정상 세이브 — 로드 시 `pendingLoot` 회수 경로 유지로 보존.
- **자동 전환 스팸**: 다수 카드 동시 배치 시 화면이 점프. 마지막 배치 페이지 1회 전환으로 통일.
- **드래그 중 페이지 자동 전환 충돌**: 자동 전환은 시스템 배치 경로(`placeCardInRow`)에만 발행되므로 드래그 호버 전환과 분리됨.
- **FLIP 애니메이션**: 페이지 전환은 활성 영역 자체가 바뀌므로 FLIP을 적용하지 않고 즉시 갱신. 카드 이동 FLIP은 동일 페이지 내에서만 동작.

## 12. 미정 사항 (추후 결정)

- 신규 가방 종류(예: trekking_bag 12, expedition_bag 20)의 `BAG_EXTRA_SLOTS` 등록 시점.
- 페이저 시각 토큰의 정확한 색상 매핑(현재는 기존 토큰 재사용 가정).
- 페이지 전환 시 가벼운 슬라이드 트랜지션 적용 여부(본 설계는 즉시 갱신).
