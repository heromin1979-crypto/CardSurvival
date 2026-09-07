# INBOX — 사람이 던지는 지시

> 여기 적힌 것을 매 바퀴 가장 먼저 처리한다. SPEC·STATUS 보다 우선한다.
> 끝낸 항목은 지우지 않는다. `DONE.md` 맨 위로 옮긴다. 지우면 왜 그렇게 됐는지가 사라진다.
>
> **이 문서의 "처리할 것" 개수가 곧 합격 기준(①)이다.** 0건이 되면 라운드가 끝난다.
> 비어 있으면 루프는 아무것도 만들지 않고 대기한다.
>
> 위에서부터 순서대로 처리한다. 뒤 항목이 앞 항목의 레이아웃에 얹히므로 순서를 바꾸지 않는다.
> 1군이 끝났다 — 우측 컬럼(동료 + 동료 상태), 상단 HUD 칩, 좌측 사이드바 골격.
> **2군이 전부 끝났다** — 소음·무게·퀘스트 블록과 지도 확대까지.
> 3군은 다섯 건(섹션 헤더, 장소 카드 설명·요구치, 모서리 배지, 수량·내구도 게이지,
> 빈 슬롯 플레이스홀더)이 끝났다. **남은 것은 1건이고 그 1건은 막혀 있다** — 아래 항목의
> ⛔ 표시와 STATUS `막힌 것` 을 먼저 읽을 것. 사람이 정하기 전에는 루프가 대기한다.
> 목표: `reference/ui-refs/main-screen-v2.png` (구버전 `reference/main-screen-target.jpg` 보다 우선)
> 현재: **`reference/main-screen-2026-09-07.png`** (화면 전체, 1배)
> 부분 확대: `reference/carried-gauge-2026-09-07.png` (휴대 행 게이지) ·
> `reference/emptyslot-carried-2026-09-07.png` (빈 칸 `+` 표식) ·
> `reference/loccard-badge-sub-2026-09-07.png` / `reference/loccard-badge-district-2026-09-07.png`
> (확대본이 따로 있는 이유 — 배지 9px · 게이지 글자 8px 라 1배로는 눈으로 판정할 수 없다)

## 처리할 것

### 3군 — 섹션·카드 정보

> **사이드바에 남은 세로 여백은 13px 다** (`tools/capture-sidebar.mjs` 의 `freeBelow`).
> 3군은 보드 쪽 작업이라 사이드바를 건드릴 일이 없지만, 건드리게 되면 어디서 얼마를
> 가져왔는지는 새 결정이라 STATUS `결정과 근거` 에 남겨야 한다. 남기지 않으면 다음 바퀴가
> 되돌린다. 커밋 전 `scrolls: false` · `clipped` 없음을 매번 확인할 것.

- [ ] [2026-09-07] **장착 중 아이템을 장비 창에서 강조한다.** (사람이 (B)로 결정)
  목표 이미지는 휴대 행 카드에 앰버 테두리와 `(Equipped)` 를 붙여 놨지만,
  **그 방식은 채택하지 않는다.** 사람이 "장착 아이템은 기존 방식대로 유지"로 정했다.

  기존 방식이란 이것이다 — `EquipmentSystem.equip()` 이 카드를 보드에서 지우고
  (`js/systems/EquipmentSystem.js:82-84`) `player.equipped[slotId]` 가 인스턴스를 잡는다.
  `gs.cards` 의 인스턴스는 그대로 살아 있고 `unequip()` 이 `placeCardInRow` 로 돌려놓는다.
  **이 규칙을 건드리지 마라.** 휴대 칸 수·무게 계산이 함께 움직인다.

  그래서 강조는 **장비 창 안에서** 한다. `js/ui/EquipmentModal.js` 의 `_renderSlot()` 이
  장착 슬롯을 그리고, 차 있으면 `_buildMiniCard(equipped)` 로 미니 카드를 넣는다.
  그 슬롯에 앰버 테두리(`--accent-primary`)와 `(Equipped)` 라벨을 붙인다.
  빈 슬롯(`equip-slot-empty-icon`)과 한눈에 구분되면 된다. 새 색을 만들지 않는다.

  ※ SPEC 3절이 "모달은 이번 라운드 범위 밖"이라고 했지만 **이 항목에 한해 예외**다.
    SPEC 3절에도 적어 뒀다. 다른 모달은 여전히 건드리지 마라.

  검증: 장비 창을 연 캡처에서 장착 슬롯과 빈 슬롯이 구분된다.
  장착 상태를 만드는 방법은 `tools/capture-companion-panel.mjs` 의 `?tool=combat` 훅 참고.
  `npm test` 통과.
