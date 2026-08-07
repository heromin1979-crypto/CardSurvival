# 국립현충원 지하 벙커 연출 강화 + 비밀 이벤트 선택지 UI 설계

**작성일:** 2026-08-07
**범위:** 숨겨진 장소의 세부장소화(공용 구조), 발견 컷씬, 비밀 이벤트 선택지 모달, 선택지 수량 조건 정합성
**범위 밖:** 나머지 숨겨진 장소 28곳의 세부장소 데이터 작성, 컷씬 배경 이미지 제작, 발견 목록 조회 UI

---

## 1. 진단

### 사용자가 보고한 통증

1. 국립현충원 지하 벙커가 "발견"만 되고 **실제로 갈 수 있는 장소가 생기지 않음**
2. 발견 순간에 **연출이 없음** — 토스트 알림 한 줄이 전부
3. 발견 메시지가 설정과 겉돎 — "참배로 아래에서 군사 벙커를 발견했다"
4. 비밀 이벤트의 **선택지가 플레이어에게 노출되지 않음** (라디오 속삭임 / 떠돌이 상인 / 약탈자 동맹 제안)

### 코드 사실 확인

**세부장소 카드는 자동 생성된다**
- `landmarks.js:6098` `registerSubLocationItems(items)`가 `LANDMARK_DATA` 전체를 순회하며 `sl_<subId>` 아이템 정의를 런타임 생성
- `main.js`에서 GameData 초기화 직후 1회 호출
- → 세부장소 추가 시 `items_*.js` / `stackConfig.js` / `CardFactory.js` 등록이 **불필요**

**세부장소 잠금 개념이 존재하지 않는다**
- `LandmarkModal._render()` (`:69`) — `data.subLocations.map(...)` 무조건 전량 렌더
- `ExploreSystem._updateTopRowForLandmark()` (`:708`) — `lmData?.subLocations ?? []` 전량을 top row에 배치
- `ExploreSystem.enterSubLocation()` (`:731`) — `find(s => s.id === subLocationId)`, 가시성 검사 없음
- `locationPath.js:36` — 이름 조회 전용
- → 잠금 판정을 4곳에 흩뿌리면 패치워크가 됨. **공용 헬퍼 1개**로 수렴시켜야 함

**발견 보상은 29곳 공용 경로를 탄다**
- `HiddenElementSystem._discoverHiddenLocation()` (`:154-202`)가 `rewards` 확정 지급 + `_rollAndPlaceLoot(lootTable, 2)`를 무조건 실행
- → 벙커만 보상을 옮기려면 **위임 분기**가 필요. 무조건 제거하면 나머지 28곳이 보상을 잃음

**비밀 이벤트 UI는 의도적 미완성 스텁이다**
- `git log -S "secretEventTriggered" -- js` → 커밋 `cf19272` (8대 시스템 확장) 단 1건. 데이터 + 시스템만 도입, UI 미포함
- `HiddenElementSystem.js:427-437` 주석: `// 이벤트 선택지 UI 표시를 위해 이벤트 발행` / `// UI가 없는 경우 자동 처리 (첫 선택지, 가중치 기반 결과)`
- `EventBus.on('secretEventTriggered'` 수신자 **0건** (프로젝트 전체 grep)
- → 버그가 아니라 "나중에 붙일 자리"로 남겨진 스텁. 임시 자동처리가 그대로 프로덕션 동작이 됨

**`choice.conditions`는 읽히지 않는다**
- `HiddenElementSystem.js`에서 `choice`를 참조하는 지점은 `:431`, `:434`, `:435`, `:436` 뿐 — 전부 자동 선택 경로
- `conditions.requiredItems`를 평가하는 코드가 프로젝트 전체에 없음

**재사용 가능한 자산 3개**
- `js/ui/ContributionChoiceModal.js` (87줄) — "신호 수신 → 렌더 → 선택 전달" 패턴의 최소 구현체
- `js/ui/CinematicScene.js` (207줄) + `js/data/cinematicScenes.js` (624줄, 장면 40여 개) — `EventBus.emit('showCinematic', { sceneId, onComplete })`로 호출. `image: null`이면 그라디언트만 표시하므로 에셋 없이 동작
- `HiddenElementSystem.js:94-98` `requiredItemQty: [{ id, qty }]` — 프로젝트에 이미 존재하는 수량 조건 표현

**죽은 파일**
- `js/screens/Basecamp.js`는 `js/screens/Main.js`의 옛 복사본. `main.js:97`이 `screens/Main.js`를 `Basecamp`라는 이름으로 import
- 근거: `contribution-choice-modal` 컨테이너가 `Main.js:239`에만 존재하고 `Basecamp.js`에는 없음
- **이번 작업에서 건드리지 않는다** (요청 범위 밖 정리)

### 설계 분기 (사용자와 합의)

| 항목 | 결정 |
|------|------|
| 적용 범위 | 공용 구조로 설계하되 **현충원 벙커 1곳만** 데이터를 채운다 |
| 해금 연출 | 새 팝업을 만들지 않고 **기존 CinematicScene 재사용** |
| 선택지 UI 적용 대상 | **비밀 이벤트 전체** (30여 개) |
| 벙커 보상 | **첫 진입 확정 보상 + 이후 일반 세부장소 탐색** |
| 수량 조건 불일치 | **이번 작업에 포함** (5건 전량) |

---

## 2. 시스템 아키텍처

```
[동작구 도착 / 동작구 탐색 완료]
          │
          ▼
HiddenElementSystem._checkHiddenLocations('dongjak')
          │  조건: Day 60+ / 10킬+ / map_fragment 보유
          ▼
_discoverHiddenLocation()
   ├─ flags.hiddenLocationsDiscovered.push(locId)
   ├─ notify (톤 교체된 discoveryMessage)
   ├─ loc.cinematicId 있으면 → EventBus.emit('showCinematic')   [신규]
   ├─ loc.subLocationId 있으면 → 보상/전리품 지급 건너뜀        [신규]
   │                            없으면 → 기존대로 즉시 지급
   └─ emit('hiddenLocationDiscovered')
          │
          ▼
[국립현충원 랜드마크 진입]
          │
          ▼
getVisibleSubLocations(lmKey)   ← 공용 필터 [신규]
   requiresHiddenLocation 필드가 있으면
   flags.hiddenLocationsDiscovered에 포함될 때만 통과
          │
          ├─→ ExploreSystem._updateTopRowForLandmark()  (상단 카드)
          ├─→ LandmarkModal._render()                   (랜드마크 창)
          └─→ ExploreSystem.enterSubLocation()          (진입 가드)
          │
          ▼
[지하 벙커 진입]
          │
          ▼
_grantFirstEnterReward(sub, subKey)   ← 기존 장치 그대로
   최초 1회만 firstEnterReward.items 지급
   이후는 일반 lootTable + subLocationStock 재고 소진
```

```
[TP 3회마다 / 구역 이동]
          │
          ▼
HiddenElementSystem._checkSecretEvents()
          │
          ▼
_triggerSecretEvent(event)
   ├─ notify (이벤트 이름)
   ├─ emit('secretEventTriggered', { event })
   └─ EventBus.hasListener('secretEventTriggered') ?     [신규]
        ├─ true  → 반환. SecretEventModal의 응답을 기다린다
        └─ false → 기존 자동 처리 (첫 선택지 + 가중치 추첨)
                   ※ 시뮬레이션·테스트 환경 보호
          │
          ▼
SecretEventModal (신규)
   ├─ 선택지 렌더 + evaluateChoiceConditions()로 잠금 판정
   └─ 클릭 → HiddenElementSystem.resolveSecretEventChoice(eventId, idx)
                └─ _rollOutcome() → _applyEventOutcome()
```

---

## 3. 컴포넌트 상세

### 3-1. `getVisibleSubLocations(key)` — 공용 가시성 필터

**위치:** `js/data/landmarks.js` (export)

**책임:** 랜드마크 키를 받아 "현재 플레이어에게 보여야 할" 세부장소 배열만 반환한다.

**규칙:** 세부장소에 `requiresHiddenLocation` 필드가 있으면, 해당 ID가 `GameState.flags.hiddenLocationsDiscovered`에 포함될 때만 통과시킨다. 필드가 없으면 항상 통과.

**의존성:** `GameState` 직접 import는 순환 의존을 만들 수 있으므로(landmarks.js는 GameData·GameState를 import하지 않는 모듈), **발견 목록 배열을 인자로 받는다.**

```js
export function getVisibleSubLocations(key, discoveredLocationIds = []) {
  const subs = getLandmarkData(key)?.subLocations ?? [];
  return subs.filter(sub =>
    !sub.requiresHiddenLocation || discoveredLocationIds.includes(sub.requiresHiddenLocation)
  );
}
```

**호출 지점 3곳**
- `ExploreSystem._updateTopRowForLandmark()` — `lmData?.subLocations` → `getVisibleSubLocations(landmarkKey, gs.flags.hiddenLocationsDiscovered)`
- `ExploreSystem.enterSubLocation()` — `lmData?.subLocations?.find(...)` → 동일 헬퍼 결과에서 `find`. 잠긴 곳은 `sub`가 undefined가 되어 기존 `if (!sub) return;` 가드에 걸림
- `LandmarkModal._render()` — `data.subLocations.map(...)` → 동일 헬퍼 결과를 `map`

`locationPath.js:36`은 이름 조회 전용이므로 **변경하지 않는다.** 이미 방문한 곳의 경로 표시가 잠금 때문에 깨지면 안 되기 때문이다.

`registerSubLocationItems()`도 **변경하지 않는다.** 아이템 정의가 미리 존재해도 카드가 배치되지 않으면 플레이어에게 노출되지 않으며, 정의를 조건부로 만들면 세이브 로드 순서에 따라 카드 복원이 깨질 수 있다.

### 3-2. 지하 벙커 세부장소 데이터

**위치:** `js/data/landmarks.js` → `lm_dongjak.subLocations` 말미

```js
{
  id: 'dongjak_bunker',
  name: '지하 벙커',
  icon: '🚪',
  desc: '관리 창고 뒤편 철문 아래. 군용 통신 장비가 남아 있는 비상 벙커.',
  dangerMod: 0.15,
  requiresHiddenLocation: 'hidden_dongjak_cemetery_vault',
  firstEnterReward: {
    claimKey: 'dongjak_bunker_first',
    items: [{ id: 'military_radio_kit', qty: 1 }],
  },
  lootTable: [
    { id: 'pistol_ammo',     weight: 4 },
    { id: 'military_ration', weight: 4 },
    { id: 'bandage',         weight: 4 },
    { id: 'radio',           weight: 2 },
  ],
  lootCount: [2, 3],
}
```

`lootTable`은 `hiddenLocations.js`의 벙커 전리품(권총탄/군용식량/붕대/라디오, 가중치 20/20/20/10)을 세부장소 형식(`{ id, weight }`)으로 옮긴 것이다. 비율을 유지하되 정수로 축약했다.

`dangerMod: 0.15`는 같은 랜드마크에서 가장 위험한 관리 창고(0.10)보다 높고, `LandmarkModal`의 `mid` 임계(0.20) 미만이다. 군 시설이지만 현충원 전체가 "감염자가 기피하는 조용한 구역"이라는 설정과 충돌하지 않는 값이다.

**상단 슬롯 여유:** 현충원 세부장소는 현재 5개(현충탑·기념관·관리 창고·관리소·숲) + 귀환 카드 1개 = 6칸. 벙커 추가 시 7칸으로, 장소 행 10칸 이내다.

**자동 진입 영향 없음:** `ExploreSystem`의 랜드마크 자동 진입(`:673`)은 top row의 **첫 번째** 세부장소를 고른다. 벙커는 배열 말미이므로 자동 진입 대상이 되지 않는다.

### 3-3. 숨겨진 장소 정의 확장

**위치:** `js/data/hiddenLocations.js` → `hidden_dongjak_cemetery_vault`

| 필드 | 값 | 의미 |
|------|-----|------|
| `subLocationId` | `'dongjak_bunker'` | 보상 지급을 이 세부장소에 위임 |
| `cinematicId` | `'cin_discover_dongjak_bunker'` | 발견 시 재생할 컷씬 |
| `discoveryMessage` | 아래 문구로 교체 | 톤 정합 |

```
변경 전: '⭐ 국립현충원 참배로 아래에서 군사 벙커를 발견했다!'
변경 후: '⭐ 동작구를 꼼꼼히 뒤진 끝에, 국립현충원 안에서 비밀스러운 군사 벙커를 찾아냈다.'
```

`rewards`와 `lootTable`은 **데이터에 그대로 남긴다.** 삭제하면 이 장소가 무엇을 주는 곳인지 데이터만 보고 알 수 없어지고, 나중에 세부장소 연결을 끊었을 때 되돌릴 근거가 사라진다. 실행 시 건너뛰는 것은 시스템 분기가 담당한다.

### 3-4. `HiddenElementSystem._discoverHiddenLocation()` 확장

두 지점만 바뀐다.

**① 컷씬 발행** — `discoveryMessage` notify 직후

```js
if (loc.cinematicId) {
  EventBus.emit('showCinematic', { sceneId: loc.cinematicId });
}
```

**② 보상 위임 분기** — `rewards` / `lootTable` 처리 전체를 감싼다

```js
// 세부장소가 연결된 장소는 진입 시 firstEnterReward로 지급하므로 여기서 건너뛴다
if (!loc.subLocationId) {
  // ... 기존 rewards 지급 + _rollAndPlaceLoot ...
}
```

**③ 안내 문구** — 세부장소가 연결된 경우, 어디로 가야 하는지 한 줄 안내

```js
if (loc.subLocationId) {
  EventBus.emit('notify', {
    message: `🚪 ${loc.name}에 진입할 수 있게 되었다. 해당 랜드마크에서 찾아보자.`,
    type: 'info',
  });
}
```

`_checkRecipeUnlocks()`, `hiddenLocationDiscovered` 발행, `boardChanged` 발행은 **변경하지 않는다.** 강화 쉘터 설계도 해금은 발견 시점 기준을 유지한다.

### 3-5. 발견 컷씬

**위치:** `js/data/cinematicScenes.js` — 새 구획 `// ── 숨겨진 장소 발견 ──`

```js
cin_discover_dongjak_bunker: {
  id: 'cin_discover_dongjak_bunker',
  image: null,
  gradient: 'linear-gradient(160deg,#060a08 0%,#101812 60%,#070b09 100%)',
  title: '잊힌 지하',
  subtitle: '국립현충원 · 동작구',
  lines: [
    '동작구를 며칠에 걸쳐 샅샅이 뒤졌다.',
    '관리 창고 뒤편, 낙엽에 덮인 철문이 드러난다.',
    '손에 쥔 지도 조각의 도면과 정확히 겹친다.',
  ],
  displayMs: 0,
},
```

`image: null`이므로 그라디언트만으로 동작한다. 후속 작업에서 `assets/images/cinematic/discover_dongjak_bunker.webp`를 추가하고 `image` 경로만 채우면 배경이 붙는다.

### 3-6. `EventBus.hasListener(event)`

**위치:** `js/core/EventBus.js`

```js
hasListener(event) {
  return (this._listeners[event]?.length ?? 0) > 0;
},
```

`_listeners` 내부 구조를 외부에서 들여다보는 대신 EventBus가 스스로 답하게 한다. 알려진 채널 주석 목록에도 한 줄 추가한다.

### 3-7. `SecretEventModal` (신규)

**위치:** `js/ui/SecretEventModal.js` — 목표 120줄 이내
**컨테이너:** `js/screens/Main.js:239` 인근에 `<div class="modal-overlay" id="secret-event-modal">` 추가

**구조:** `ContributionChoiceModal`을 본으로 삼는다.

| 요소 | 내용 |
|------|------|
| 헤더 | `event.icon` + `event.name` |
| 본문 | `event.description` |
| 선택지 | `event.choices[]`를 행으로. 클릭 시 `data-choice-index` 전달 |
| 잠긴 선택지 | 회색 처리 + 클릭 불가 + 부족한 물품 표시 |
| 바깥 클릭 | 닫기 금지 — 반드시 선택해야 진행 |

**잠금 판정:** `HiddenElementSystem.evaluateChoiceConditions(choice)`를 호출한다. 판정 로직을 UI가 아니라 시스템에 두는 이유는, 자동 처리 경로(UI 없는 환경)도 같은 규칙을 써야 하기 때문이다.

```js
// HiddenElementSystem
evaluateChoiceConditions(choice) {
  const cond = choice?.conditions;
  if (!cond) return { ok: true, missing: [] };

  const missing = [];
  for (const itemId of cond.requiredItems ?? []) {
    if (GameState.countOnBoard(itemId) < 1) missing.push({ id: itemId, need: 1 });
  }
  for (const { id, qty } of cond.requiredItemQty ?? []) {
    if (GameState.countOnBoard(id) < qty) missing.push({ id, need: qty });
  }
  return { ok: missing.length === 0, missing };
}
```

**선택 처리 공개 API**

```js
// HiddenElementSystem
resolveSecretEventChoice(eventId, choiceIndex) {
  const event = SECRET_EVENTS.find(e => e.id === eventId);
  const choice = event?.choices?.[choiceIndex];
  if (!choice) return false;
  if (!this.evaluateChoiceConditions(choice).ok) return false;   // 잠긴 선택 방어

  const outcome = this._rollOutcome(choice.outcomes);
  if (outcome) {
    EventBus.emit('notify', { message: outcome.text, type: 'info' });
    this._applyEventOutcome(outcome);
  }
  EventBus.emit('boardChanged', {});
  return true;
}
```

**결과 텍스트 노출:** 지금은 `outcome.text`(예: "신호의 출처를 찾았다!")가 어디에도 표시되지 않는다. 선택 결과를 모르면 선택의 의미가 사라지므로 notify로 내보낸다.

**`_triggerSecretEvent` 변경**

```js
EventBus.emit('secretEventTriggered', { event });

if (!event.choices?.length) return;
if (EventBus.hasListener('secretEventTriggered')) return;   // UI가 처리한다

// UI가 없는 환경(테스트·시뮬레이션) 폴백 — 조건을 만족하는 첫 선택지
const choice = event.choices.find(c => this.evaluateChoiceConditions(c).ok) ?? event.choices[0];
```

폴백 경로도 조건 판정을 타게 바꾼다. 기존에는 무조건 `choices[0]`이라, 물품이 없어도 소모 효과가 실행됐다.

### 3-8. 선택지 수량 조건 정합성 수정

`conditions.requiredItems`는 "1개 이상 보유"만 의미하는데, 결과는 2~3개를 소모한다. 소모 처리(`_applyEventOutcome`의 `removeItems`)는 부족하면 있는 만큼만 빼므로, 조건을 통과한 뒤 대가를 덜 치르는 구멍이 생긴다.

프로젝트에 이미 존재하는 `requiredItemQty: [{ id, qty }]` 표현으로 교체한다.

| 이벤트 | 선택지 | 변경 후 조건 |
|--------|--------|--------------|
| `event_wandering_trader` | `trade` | `canned_food` × 3 |
| `event_survivor_camp` | `trade_food` | `canned_food` × 2 |
| `event_bridge_blockade` | `pay_toll` | `canned_food` × 3 |
| `event_underground_network_3` | `offer_supplies` | `canned_food` × 3 |
| `event_engineer_blueprint` | `build_prototype` | `scrap_metal` × 2 |

`event_engineer_blueprint`는 결과에 따라 고철 2개 또는 1개를 소모한다. **최대치인 2를 조건으로 삼는다** — 최악의 결과를 감당할 수 없는 상태에서 선택을 허용하면 같은 구멍이 남는다.

검출 방법(재현 가능): `secretEvents.js`를 import해 각 선택지의 `conditions.requiredItems`와 하위 `outcomes[].effects.removeItems` 최대 수량을 대조. 전수 검사 결과 위 5건 외 불일치 없음.

---

## 4. 데이터 흐름 — 플레이어 시점

1. Day 60 이후, 10킬 이상, 지도 조각을 지닌 채 동작구에 도착
2. 화면이 어두워지며 컷씬 「잊힌 지하」 재생 → 클릭하여 닫음
3. 토스트 2줄: 발견 메시지 + "국립현충원 지하 벙커에 진입할 수 있게 되었다"
4. 국립현충원 랜드마크로 이동 → 상단에 🚪 지하 벙커 카드가 새로 보임
5. 벙커 진입 → 군용 통신 키트 확정 지급 + 첫 탐색 전리품
6. 재진입 → 남은 재고 범위에서 일반 탐색. 고갈 시 배지 표시

---

## 5. 오류 처리

| 상황 | 처리 |
|------|------|
| 컷씬 장면 ID가 없음 | `CinematicScene.show()`가 무시. 토스트는 정상 출력 |
| 세부장소 진입 시 보드 만차 | `_placeLoot`의 `pendingLoot` 큐로 폴백 (기존 동작) |
| 잠긴 세부장소 강제 진입 시도 | `getVisibleSubLocations`에서 걸러져 `if (!sub) return;` |
| 선택지 창 컨테이너 없음 | `init()`에서 조기 반환 → `hasListener` false → 자동 폴백 |
| 잠긴 선택지 클릭 | UI에서 차단 + `resolveSecretEventChoice`에서 재검증 |
| 세이브 로드 시 `hiddenLocationsDiscovered` 없음 | `GameState.js:935`가 빈 배열로 초기화 (기존) |

---

## 6. 테스트 계획

`tests/unit/` 신규 파일 2개.

**`HiddenSubLocationGating.test.js`**
- 발견 전 `getVisibleSubLocations('lm_dongjak', [])` → 벙커 미포함, 나머지 3개 포함
- 발견 후 `getVisibleSubLocations('lm_dongjak', ['hidden_dongjak_cemetery_vault'])` → 4개 전부
- `requiresHiddenLocation`이 없는 세부장소는 목록과 무관하게 항상 포함
- `subLocationId`가 연결된 숨겨진 장소 발견 시 보드에 아이템이 추가되지 않음
- `subLocationId`가 없는 숨겨진 장소는 기존대로 보상 지급

**`SecretEventChoice.test.js`**
- `evaluateChoiceConditions` — `requiredItems` / `requiredItemQty` 각각의 충족·미충족
- 수량 조건 5건이 실제 `removeItems` 최대 수량과 일치 (데이터 회귀 가드, 전수 대조)
- `resolveSecretEventChoice`가 잠긴 선택지를 거부
- UI 리스너가 없을 때 자동 폴백이 **조건을 만족하는** 선택지를 고름
- `EventBus.hasListener` 동작

**Red-Green 확인:** 수량 조건 테스트는 데이터를 원래 값(`requiredItems`)으로 되돌렸을 때 실패해야 한다.

**데이터 검증:** `node js/data/validate.js` 통과 확인.

---

## 7. 에디터 도움말 등록 (프로젝트 규칙)

신규 필드 3개를 `tools/editor/editor.js`에 등록한다. 미등록 시 에디터 툴팁이 뜨지 않는다.

| 필드 | 사전 | 설명 |
|------|------|------|
| `requiresHiddenLocation` | `FIELD_HELP` | 이 숨겨진 장소를 발견해야 노출되는 세부장소. |
| `subLocationId` | `FIELD_HELP` | 보상 지급을 위임할 세부장소 ID. 지정 시 발견 즉시 지급을 건너뛴다. |
| `cinematicId` | `FIELD_HELP` | 발견 시 재생할 컷씬 장면 ID. |

`node tools/editor/check-help-coverage.mjs`로 누락 검사.

---

## 8. 변경 파일 요약

| 파일 | 변경 |
|------|------|
| `js/data/landmarks.js` | 벙커 세부장소 추가, `getVisibleSubLocations()` export |
| `js/data/hiddenLocations.js` | `subLocationId` / `cinematicId` 추가, `discoveryMessage` 교체 |
| `js/data/cinematicScenes.js` | `cin_discover_dongjak_bunker` 추가 |
| `js/data/secretEvents.js` | 선택지 수량 조건 5건 교체 |
| `js/systems/HiddenElementSystem.js` | 컷씬 발행, 보상 위임 분기, `evaluateChoiceConditions`, `resolveSecretEventChoice`, 폴백 조건화 |
| `js/systems/ExploreSystem.js` | 세부장소 조회 2곳을 공용 필터로 교체 |
| `js/ui/LandmarkModal.js` | 세부장소 목록을 공용 필터로 교체 |
| `js/ui/SecretEventModal.js` | **신규** |
| `js/screens/Main.js` | 선택지 모달 컨테이너 추가, `SecretEventModal.init()` 배선 |
| `js/core/EventBus.js` | `hasListener()` 추가 |
| `css/` | 선택지 모달 스타일 (기존 `.modal-overlay` / `.er-*` 계열 재사용) |
| `tools/editor/editor.js` | 신규 필드 3개 도움말 |
| `tests/unit/` | 신규 테스트 2개 |

---

## 9. 후속 과제 (이번 범위 밖)

- 나머지 숨겨진 장소 28곳의 세부장소 데이터 작성 — 구는 정해져 있으나 소속 랜드마크가 미지정인 곳이 많아 설정 작업이 선행되어야 함
- 발견 컷씬 배경 이미지 제작
- 발견한 숨겨진 장소 목록 조회 UI — `HiddenElementSystem.getDiscoveredLocations()` / `getProgress()`가 구현되어 있으나 호출하는 화면이 없음
- `js/screens/Basecamp.js` 죽은 파일 정리
- `SeoulMapModal.js:11` `DEV_FORCE_MAP_UNLOCK = true` — 지도 조각 수집과 무관하게 전체 지도가 열려 있는 개발용 강제 플래그. 헤더 배지는 이 플래그를 보지 않아 `0/3` 표시와 불일치
