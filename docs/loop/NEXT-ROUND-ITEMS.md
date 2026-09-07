# 다음 라운드 후보

> **지금 도는 라운드는 이 파일을 읽지 않는다.** UI 라운드 SPEC 범위 밖이다.
> 여기 적힌 것은 UI 라운드가 끝난 뒤(INBOX 0건) 사람이 SPEC 을 바꾸면서
> INBOX 로 옮길 재료다. 옮기기 전까지는 아무것도 하지 않는다.
>
> 조사 근거: `node tools/audit-items.mjs`, `node tools/audit-doctor-route.mjs`,
> `node tools/test-item-ingame.mjs` (2026-09-06~07 실행)

---

## 라운드 A — 아이템 카드 정합성

**범위**: `js/data/items_*.js`, `js/data/blueprints*.js`, `js/data/districts.js`
현재 UI 라운드가 금지한 곳이다. 이 라운드를 열려면 SPEC 3절을 다시 써야 한다.

**합격 기준 후보**: `node tools/audit-items.mjs` 의 "배선 문제"가 19건에서 0건이 되면 끝이다.

### A-1. 설명은 약속하는데 효과가 없다 (4건)

가장 나쁜 종류다. 플레이어가 설명을 읽고 산 뒤 아무 일도 안 일어난다.

| 아이템 | 필드 | 상태 |
|---|---|---|
| 찌그러진 양철통 `battered_can` | `waterCapacity: 2` | 읽는 코드 없음. 설명은 물 보관을 약속 |
| 한상차림 `traditional_feast` | `companionMoraleBoost: 20` | 읽는 코드 없음 |
| 뼈 `bone` | — | 설명은 "도구·바늘·국물 재료". 재료로도 안 쓰이고 효과도 없음 |
| 지도 조각 3종 `map_fragment_{north,center,south}` | — | 설명은 지형 정보를 약속. 사용처·효과 없음 |

**둘 중 하나를 해야 한다** — 배선을 넣든지, 필드와 설명의 약속을 함께 빼든지.
지금은 설명만 맞고 동작이 없다. 어느 쪽인지는 **사람이 정한다.**

### A-2. 조합이 영구히 막혀 있다 (최우선)

**송이버섯 `matsutake_mushroom` 은 획득 경로가 전혀 없다.** 드랍표·제작·보상 어디에도 없다.
그런데 **2개 제작이 이걸 재료로 요구한다 — 원기 회복탕, 버섯 리조토.**
두 레시피는 지금 영구히 잠겨 있다.

→ `lootTable` 에 넣거나 청사진 산출물로 만들거나, 두 레시피의 재료를 바꾼다.

### A-3. 획득 경로가 없는 아이템 (8건)

커피 `coffee` / 익힌 생선 `fish_cooked` / 군밤 `chestnut_roasted` /
도토리 묵 재료 `acorn_boiled` / 대체 캐비어 `caviar_local` /
셰프 비빔밥 `bibimbap_chef` / 아이템 상자 `item_box_1`, `item_box_2`

A-2 와 달리 이걸 요구하는 레시피는 없다. 그래서 급하지 않다.
**등장시킬 계획이 없으면 카드를 지우는 것도 정리다** — 사람이 정한다.

### A-4. 효과는 있는데 플레이어가 볼 수 없다 (25건)

동작은 한다. 설명문에도 카드에도 안 나올 뿐이다.
`audit-items.mjs` 가 "표시 누락"으로 분류하고 무엇을 적으면 되는지까지 알려준다.

대표: 방한복 `coldResistMult 0.5` · `hypothermiaChanceMult 0.3`,
은밀 슈트 `noiseReduction 0.3`, 호랑이 이빨 목걸이 `critMultiplierBonus 0.5`,
찌개류 4종 `warmth 8~15`, 도구 7종 `durabilityPerUse 1`,
바리케이드·강화 벽 `encounterReduction`, 땅굴 저장고 `food_decay -0.5`

대부분 `description` 한 줄로 해결된다. **카드 UI 에 수치를 자동 표시하려면 개발 배선이 필요하다** —
그건 UI 라운드 몫이므로 이 라운드에서는 설명문만 고친다.

### A-5. 카드 표시값과 실제 효과가 다르다

인게임 측정 결과 회복량이 선언값보다 **약 10% 크다.**

```
진통제   hp 10 → 실제 +11        항생제  infection -45 → 실제 -50
구급키트 hp 50 → 실제 +55        멸균수  hydration 25 → 실제 +27.5
해독제   infection -30 → 실제 -33
```

일관된 배율이라 `ItemEffectSystem.consumeEffectMultiplier` 의 스킬 보정으로 보인다.
버그가 아니라 설계일 가능성이 크다. 다만 **카드에는 선언값만 나오므로 플레이어가 보는
숫자와 실제가 다르다.** 표시를 실측값으로 바꿀지, 그대로 둘지 **사람이 정한다.**

---

## 라운드 B — 의사 루트 진행 막힘

**범위**: `js/data/districts.js`, `js/data/landmarks.js`, `js/data/mainQuests/doctor/`
**합격 기준 후보**: `node tools/audit-doctor-route.mjs` 의 블로커가 5건에서 0건이 되면 끝이다.

### B-1. 세 아이템이 보상으로만 들어온다

`antibiotics`(항생제) · `antidote`(해독제) · `stimulant`(각성제) 는
드랍표에도 청사진에도 없다. 퀘스트·NPC 보상이 유일한 입수처다.

관악구(분기 A)와 용산구(분기 B)에서 항생제가 필요한데 현지 조달이 불가능하다.
**잃으면 복구할 수 없다.**

### B-2. 관악구가 비어 있다

현지 드랍 12종뿐이고 **랜드마크 드랍이 0종**이다. 네 지역 중 압도적으로 얇다.
그런데 분기 A 는 `survive_days 150` 을 요구한다.
`food` 타입 드랍도 없는데 `mq_doctor_end_a3` 이 식량 8개를 요구한다.

### B-3. 이지수가 플레이어이면서 NPC다

```
js/data/characters.js:7   이지수        — 플레이어 의사 캐릭터
js/data/npcs.js:1050      npc_jisu      — '이지수 의사', canRecruit: true, recruitTrust: 0
```

6개 직업 전부 동명의 NPC 카드가 있다(박영철·정대한도). 크로스오버 설계로 보인다.
문제는 **의사로 플레이할 때 `npc_jisu` 를 제외하는 가드를 찾지 못했다**는 것이다.
없다고 단정하지 못했으니 **먼저 확인부터 한다** — 있으면 이 항목은 닫는다.

---

## 라운드 C — 나머지 화면 UI

`docs/loop/reference/ui-refs/` 에 목표 이미지가 있다. 자세한 이유는 그 폴더의 `README.md`.

**UI 작업에 가깝다 (먼저 열 것)**
- `dialogue.png` — NPC 대화. 초상화 + 선택지 4개. 기존 `NPCDialogueModal.js` 위에 얹기 좋다
- `equipment-simple.png` — 장비 관리 간소판. 3패널(효과·페이퍼돌·인벤토리)
  - **가운데 페이퍼돌 패널이 위아래로 잘린다.** 머리(⛑️) 슬롯 윗단과 신발(👟) 슬롯 아랫단이
    모달 본문 높이를 넘어 보이지 않는다. 슬롯 9칸(각 108px) + 간격이 본문에 안 들어간다.
    2026-09-07 UI 라운드에서 발견했지만 **그 라운드가 만든 문제가 아니다** — 장착 강조를
    넣기 전 캡처(`reference/equip-modal-before-2026-09-07-slots.png`)에서도 똑같이 잘리고,
    전후 패널 크기가 448×621 로 같다. SPEC 3절이 모달을 범위 밖으로 뒀기 때문에 그 라운드는
    손대지 않았다. 재현: `SHOT_DIR=. node tools/capture-equip-modal.mjs`

**UI 가 아니라 시스템 작업이다 (그림만 따라 만들면 껍데기가 된다)**
- `combat.png` — 3인 파티 + 적 3마리, 전위/중위/후위 위치, 공포(Fear) 스탯.
  **현재 전투는 1대1이고 위치도 공포도 없다.**
- `equipment-detailed.png` — `전투/탐색/휴식` 프리셋 탭. 장비 세트 저장·전환 기능이 없다
- `quest-a.png`, `quest-b.png` — 보상에 EXP·스킬 포인트·평판. **셋 다 데이터에 없다**

**한/영 병기** — 목업은 모든 카드에 영문명을 병기하는데 `nameEn` 필드가 저장소 어디에도
없다 (아이템 659종 전부, i18n 디렉터리도 없음). 아이템 659 + 랜드마크 45개에 영문명을
새로 채워야 하는 별도 프로젝트다.

---

## 조사하면서 배운 것 (다음 라운드가 반복하지 말 것)

**감사 도구가 이미 있다.** `tools/audit-items.mjs` 는 배선 문제·표시 누락·참고·정상 4단계로
분류하고 수정 방법까지 알려준다. 새로 만들지 말고 이걸 쓴다.

**스탯이 상한에 걸리면 효과가 0으로 보인다.** 시작값이 HP 105/105, 감염 0이라
회복 아이템을 그대로 쓰면 "아무 변화 없음"이 나온다. 버그가 아니다.
`tools/test-item-ingame.mjs` 는 측정 전에 HP 30·감염 60 등으로 낮춰 둔다.

**같은 아이템을 새로 만들면 기존 스택에 병합된다.** `createCardInstance` 로 만든 인스턴스가
사라져 `consumeCard` 가 아무 일도 하지 않는다. 시작 인벤토리에 있는 아이템
(붕대·소독약·통조림·정수물병·에너지바)으로 시험하면 전부 실패한 것처럼 보인다.

**`collect_item_type` 은 top-level `type` 또는 `tags` 를 본다** (`QuestSystem.js:208`).
붕대는 `type: 'consumable'` 이고 `tags: ['medical']` 이다. `type` 만 보면 전부 놓친다.

**청사진 `output` 은 배열이다.** `output: [{ definitionId, qty }]`.
객체로 읽으면 제작 경로를 하나도 못 잡는다.

**랜드마크는 `districts: [...]` 배열을 갖는다.** 구 쪽의 `landmarks: [...]` 에서
역으로 찾는 편이 안전하다.
