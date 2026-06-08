# 한강 랜드마크 구별 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 10개 구가 공유하던 단일 한강 랜드마크를 구별 ID로 분리·연결하여, 추후 구별 전리품·분위기 차별화가 가능한 구조로 만든다(콘텐츠는 현재 공용값 복제).

**Architecture:** `landmarks.js`에 공용 base(`HANGANG_BASE`) + 빈 오버라이드 맵(`HANGANG_OVERRIDES`)을 두고 10개 구 엔트리 `hangang_<구>`를 코드로 derive한다. 카드 아이템은 `locationCardFactory.js`의 `buildAllHangangCards()`로 `lm_hangang_<구>` 10개를 생성해 `items.js`에서 병합한다. 진입 상태 판정은 `currentLandmark === 'hangang'` 리터럴을 `isHangangLandmark()` 헬퍼로 교체한다.

**Tech Stack:** 바닐라 JS(ESM), Vitest(happy-dom), `node js/data/validate.js`

> **공통 규칙:** 이 프로젝트 규칙(`.claude/rules/coding-principles.md`)에 따라 아래 코드 블록은 방향 제시용이다. 각 Step 구현 시 대상 파일의 실제 컨텍스트를 다시 읽고, 기존 스타일·들여쓰기를 그대로 맞춘다. 불변성 유지(기존 객체 변형 금지). 주석에 단계 번호·이모지 금지.

> **대상 10개 구(`districts.js`의 `hasFishing:true`):** `gangnam, gangdong, gwangjin, mapo, seocho, seongdong, songpa, yeongdeungpo, yongsan, junggoo`

---

## File Structure

| 파일 | 책임 | 변경 |
|------|------|------|
| `js/data/landmarks.js` | 한강 base·오버라이드·derive 루프, `isHangangLandmark()` 헬퍼 | 핵심 |
| `js/data/locationCardFactory.js` | `buildAllHangangCards()` — 구별 카드 derive | 추가 |
| `js/data/items.js` | 구별 카드 병합 | 1줄 |
| `js/data/items_misc.js` | 단일 `lm_hangang` 제거 | 삭제 |
| `js/systems/ExploreSystem.js` | 구별 카드 배치(`:137`) | 1블록 |
| `js/ui/CardFactory.js` | CARD_IMAGES(`:46`)·발행 키(`:821,826`) | 2블록 |
| `js/systems/FishingSystem.js` | 한강 판정(`:21`) 헬퍼화 | 1블록 |
| `js/ui/ModalManager.js` | 한강 판정(`:295`) 헬퍼화 | 1줄 |
| `tests/unit/Hangang_perDistrict.test.js` | 신규 단위 테스트 | 생성 |

점검(코드 변경은 발견 시): `tools/sim/v2/playerAI.mjs`, `tools/editor/editor.js`, `js/data/locales.js`

---

## Task 1: landmarks.js — 구별 한강 데이터 derive + 판정 헬퍼

**Files:**
- Modify: `js/data/landmarks.js` (기존 `hangang` 엔트리 ≈ `:1676-1716`, `getLandmarkData` ≈ `:2051`)
- Test: `tests/unit/Hangang_perDistrict.test.js`

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/Hangang_perDistrict.test.js` 생성:

```js
import { describe, it, expect } from 'vitest';
import LANDMARK_DATA, { getLandmarkData, isHangangLandmark } from '../../js/data/landmarks.js';

const HANGANG_DISTRICTS = ['gangnam','gangdong','gwangjin','mapo','seocho',
                           'seongdong','songpa','yeongdeungpo','yongsan','junggoo'];

describe('한강 구별 랜드마크 데이터', () => {
  it('구별 hangang_<구> 엔트리가 10개 존재한다', () => {
    for (const d of HANGANG_DISTRICTS) {
      expect(LANDMARK_DATA).toHaveProperty(`hangang_${d}`);
    }
  });

  it('단일 공용 hangang 엔트리는 더 이상 LANDMARK_DATA 키로 노출되지 않는다', () => {
    expect(LANDMARK_DATA).not.toHaveProperty('hangang');
  });

  it('각 구 엔트리는 isHangang 플래그와 sublocation 2개를 가진다', () => {
    for (const d of HANGANG_DISTRICTS) {
      const e = LANDMARK_DATA[`hangang_${d}`];
      expect(e.isHangang).toBe(true);
      expect(e.subLocations).toHaveLength(2);
    }
  });

  it('sublocation id는 구별 접미사로 유니크하다', () => {
    const e = LANDMARK_DATA['hangang_gangnam'];
    const ids = e.subLocations.map(s => s.id);
    expect(ids).toContain('hangang_fishing_spot_gangnam');
    expect(ids).toContain('hangang_riverside_gangnam');
  });

  it('낚싯대 보상 claimKey는 전 구 공유(hangang_rod)를 유지한다', () => {
    for (const d of HANGANG_DISTRICTS) {
      const e = LANDMARK_DATA[`hangang_${d}`];
      for (const sub of e.subLocations) {
        expect(sub.firstEnterReward.claimKey).toBe('hangang_rod');
      }
    }
  });

  it('getLandmarkData가 lm_hangang_<구>로 폴백 조회된다', () => {
    expect(getLandmarkData('lm_hangang_songpa')).toBe(LANDMARK_DATA['hangang_songpa']);
  });

  it('isHangangLandmark가 구별 키를 한강으로 판정한다', () => {
    expect(isHangangLandmark('hangang_gangnam')).toBe(true);
    expect(isHangangLandmark('lm_hangang_yongsan')).toBe(true);
    expect(isHangangLandmark('lm_gangnam')).toBe(false);
    expect(isHangangLandmark(null)).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js`
Expected: FAIL — `isHangangLandmark` is not a function / `hangang_gangnam` 미존재

- [ ] **Step 3: landmarks.js 구현**

기존 `hangang: { ... }` 엔트리(`:1676-1716`)를 LANDMARK_DATA 객체 리터럴에서 제거하고, 파일 상단(LANDMARK_DATA 정의 이전 모듈 스코프)에 base·구목록·오버라이드·빌더를 추가한다. 기존 sublocation 2개의 lootTable/lootCount/desc/firstEnterReward는 **그대로 복제**한다.

```js
// ── 한강(공용 base + 구별 오버라이드) ──────────────────────
const HANGANG_DISTRICTS = ['gangnam','gangdong','gwangjin','mapo','seocho',
                           'seongdong','songpa','yeongdeungpo','yongsan','junggoo'];

const HANGANG_BASE = {
  name: '한강',
  desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
  icon: '🌊',
  isHangang: true,
  subLocations: [
    {
      id: 'hangang_fishing_spot', name: '낚시터', icon: '🎣',
      desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
      dangerMod: 0.05, isFishing: true,
      firstEnterReward: { claimKey: 'hangang_rod', items: [{ id: 'fishing_rod_basic', qty: 1 }] },
      lootTable: [
        { id: 'contaminated_water', weight: 4 },
        { id: 'pebble',            weight: 3 },
        { id: 'rope',              weight: 2 },
        { id: 'bait_worm',         weight: 3 },
      ],
      lootCount: [1, 2],
    },
    {
      id: 'hangang_riverside', name: '강변 산책로', icon: '🌿',
      desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
      dangerMod: 0.08, isFishing: true,
      firstEnterReward: { claimKey: 'hangang_rod', items: [{ id: 'fishing_rod_basic', qty: 1 }] },
      lootTable: [
        { id: 'wild_garlic', weight: 4 },
        { id: 'dandelion',   weight: 3 },
        { id: 'pebble',      weight: 4 },
        { id: 'dry_grass',   weight: 3 },
        { id: 'bait_insect', weight: 2 },
      ],
      lootCount: [1, 3],
    },
  ],
};

// 차별화 시 { gangnam: { desc, subLocations:[...] } } 형태로 구 항목만 추가.
const HANGANG_OVERRIDES = {};

function buildHangangEntry(districtId) {
  const ov = HANGANG_OVERRIDES[districtId] ?? {};
  const subs = (ov.subLocations ?? HANGANG_BASE.subLocations).map(sub => ({
    ...sub,
    id: `${sub.id}_${districtId}`,
  }));
  return { ...HANGANG_BASE, ...ov, districtId, subLocations: subs };
}
```

그리고 LANDMARK_DATA 정의 이후(또는 `export default` 직전)에 구별 엔트리를 주입한다. 불변 패턴 유지를 위해 Object.assign 대신 루프 할당이 아니라 객체 합성이 어렵다면, LANDMARK_DATA가 `const LANDMARK_DATA = { ... }` 단일 리터럴이므로, 리터럴 **내부**에 전개 구문으로 합치는 방식을 우선한다:

```js
// LANDMARK_DATA 리터럴 내부, 다른 엔트리들과 같은 레벨에 전개
...Object.fromEntries(HANGANG_DISTRICTS.map(d => [`hangang_${d}`, buildHangangEntry(d)])),
```

> 주의: `buildHangangEntry`/`HANGANG_BASE`는 LANDMARK_DATA 리터럴보다 **위**(앞)에 선언되어야 전개 시점에 참조 가능하다. 함수 선언(`function`)은 호이스팅되지만 `const HANGANG_BASE`는 호이스팅되지 않으므로 선언 순서를 반드시 리터럴 앞에 둔다.

판정 헬퍼는 `getLandmarkData` 바로 아래에 추가:

```js
export function isHangangLandmark(key) {
  return !!getLandmarkData(key)?.isHangang;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/data/landmarks.js tests/unit/Hangang_perDistrict.test.js
git commit -m "feat(landmark): 한강 랜드마크 구별 데이터 derive + isHangangLandmark 헬퍼"
```

---

## Task 2: locationCardFactory.js — buildAllHangangCards()

**Files:**
- Modify: `js/data/locationCardFactory.js` (`LANDMARK_DATA` 이미 import됨 `:11`)
- Test: `tests/unit/Hangang_perDistrict.test.js` (describe 블록 추가)

- [ ] **Step 1: 실패 테스트 추가**

`tests/unit/Hangang_perDistrict.test.js`에 추가:

```js
import { buildAllHangangCards } from '../../js/data/locationCardFactory.js';

describe('한강 구별 카드 팩토리', () => {
  it('lm_hangang_<구> 카드 10개를 생성한다', () => {
    const cards = buildAllHangangCards();
    for (const d of HANGANG_DISTRICTS) {
      expect(cards).toHaveProperty(`lm_hangang_${d}`);
    }
  });

  it('각 카드는 isHangang·districtId·landmark 플래그를 가진다', () => {
    const card = buildAllHangangCards()['lm_hangang_mapo'];
    expect(card.isHangang).toBe(true);
    expect(card.districtId).toBe('mapo');
    expect(card.landmark).toBe(true);
    expect(card.type).toBe('location');
    expect(card.subtype).toBe('landmark');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js -t "팩토리"`
Expected: FAIL — `buildAllHangangCards is not a function`

- [ ] **Step 3: locationCardFactory.js 구현**

파일 상단에서 `HANGANG_DISTRICTS`를 landmarks.js와 중복 선언하지 않도록, landmarks.js에서 export하여 import한다. (Task 1에서 `export const HANGANG_DISTRICTS` 로 노출 — Task 1 Step 3 수정 시 `const` 앞에 `export` 추가)

```js
import LANDMARK_DATA, { HANGANG_DISTRICTS } from './landmarks.js';

export function buildAllHangangCards() {
  const out = {};
  for (const d of HANGANG_DISTRICTS) {
    const data = LANDMARK_DATA[`hangang_${d}`];
    out[`lm_hangang_${d}`] = {
      id: `lm_hangang_${d}`,
      name: data.name,
      type: 'location',
      subtype: 'landmark',
      landmark: true,
      isHangang: true,
      districtId: d,
      icon: data.icon,
      rarity: 'common',
      weight: 0,
      stackable: false,
      maxStack: 1,
      defaultDurability: 100,
      defaultContamination: 0,
      description: '한강변 낚시터. 낚시와 통발 설치가 가능한 구역.',
      tags: ['location', 'landmark', 'fishing'],
      requiresSlot: 'top',
      dismantle: [],
    };
  }
  return out;
}
```

> `import LANDMARK_DATA` 는 파일에 이미 존재(`:11`)하므로 named import `{ HANGANG_DISTRICTS }` 만 기존 import 구문에 추가한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js -t "팩토리"`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/data/locationCardFactory.js js/data/landmarks.js tests/unit/Hangang_perDistrict.test.js
git commit -m "feat(landmark): buildAllHangangCards 구별 한강 카드 팩토리"
```

---

## Task 3: items.js 병합 + items_misc.js 단일 정의 제거

**Files:**
- Modify: `js/data/items.js` (`ITEMS_LANDMARK` `:34-59`)
- Modify: `js/data/items_misc.js` (`lm_hangang` `:224-232`)
- Test: `tests/unit/Hangang_perDistrict.test.js`

- [ ] **Step 1: 실패 테스트 추가**

```js
import ITEMS from '../../js/data/items.js';

describe('items.js 한강 카드 병합', () => {
  it('구별 lm_hangang_<구> 카드가 ITEMS에 병합된다', () => {
    for (const d of HANGANG_DISTRICTS) {
      expect(ITEMS).toHaveProperty(`lm_hangang_${d}`);
    }
  });

  it('단일 lm_hangang 정의는 제거되었다', () => {
    expect(ITEMS).not.toHaveProperty('lm_hangang');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js -t "병합"`
Expected: FAIL — `lm_hangang_gangnam` 미존재 & `lm_hangang` 잔존

- [ ] **Step 3: 구현**

`items.js` — import 구문(`:23`)에 `buildAllHangangCards` 추가, `ITEMS_LANDMARK`에 전개:

```js
import { buildAllLocationCards, buildAllLandmarkCards, buildAllEventLandmarkCards, buildAllHangangCards } from './locationCardFactory.js';
```

```js
const ITEMS_LANDMARK = {
  ...buildAllLandmarkCards(),
  ...buildAllEventLandmarkCards(),
  ...buildAllHangangCards(),

  basecamp_landmark: { /* 기존 그대로 유지 */ },
};
```

`items_misc.js` — `lm_hangang` 블록(`:224-232`) 및 그 위 `// ─── 한강 랜드마크 카드 ───` 주석 제거.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js -t "병합"`
Expected: PASS (2 tests)

- [ ] **Step 5: 데이터 검증 실행**

Run: `node js/data/validate.js`
Expected: 신규 카드/참조 무결성 — 에러 0. (경고는 기존 수준 유지) 출력에서 `lm_hangang` 관련 신규 에러가 없는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add js/data/items.js js/data/items_misc.js tests/unit/Hangang_perDistrict.test.js
git commit -m "feat(landmark): 한강 카드 팩토리 병합 + items_misc 단일 정의 제거"
```

---

## Task 4: ExploreSystem.js — 구별 카드 배치

**Files:**
- Modify: `js/systems/ExploreSystem.js` (`:136-140`)
- Test: `tests/unit/Hangang_perDistrict.test.js` (또는 기존 ExploreSystem 테스트 스타일 참조)

- [ ] **Step 1: 실패 테스트 추가**

기존 `tests/unit/ExploreSystem_subLocationStock.test.js`의 GameState/GameData 초기화 패턴을 먼저 읽고 동일하게 셋업한다. 구별 카드 배치 검증:

```js
// (ExploreSystem 테스트 셋업 패턴을 따른다 — GameState 초기화, registerSubLocationItems 호출)
// hasFishing 구(gangnam)로 top row 갱신 후, top에 lm_hangang_gangnam 인스턴스가 존재해야 한다.
```

> 구현자 메모: ExploreSystem의 top-row 갱신은 내부 메서드다. 테스트가 과도하게 복잡하면, 이 Task는 단위 테스트 대신 Step 5의 수동 동작 확인으로 대체하고 코드 변경만 커밋한다(아래 Step 3·5). 무리한 mocking으로 테스트를 만들지 말 것.

- [ ] **Step 2: 테스트 실패 확인 (단위 테스트를 작성한 경우)**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js -t "ExploreSystem"`
Expected: FAIL

- [ ] **Step 3: 구현**

`js/systems/ExploreSystem.js:136-140` 교체:

```js
// 한강 랜드마크 카드 (hasFishing 구역만 — 구별 카드)
const hangangCardId = `lm_hangang_${districtId}`;
if (district?.hasFishing && items[hangangCardId] && slot < gs.board.top.length) {
  const hInst = gs.createCardInstance(hangangCardId);
  if (hInst) gs.board.top[slot++] = hInst.instanceId;
}
```

> `districtId`는 이 함수(`_updateTopRowForExplore` 계열, `:115` `loc_${districtId}` 참조)의 인자로 이미 사용 가능하다. 함수 진입부에서 실제 변수명을 확인하고 맞춘다.

- [ ] **Step 4: 테스트 통과 확인 (작성한 경우)**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js -t "ExploreSystem"`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add js/systems/ExploreSystem.js tests/unit/Hangang_perDistrict.test.js
git commit -m "feat(explore): hasFishing 구에 구별 한강 카드 배치"
```

---

## Task 5: CardFactory.js — 카드 이미지 + 진입 발행 키

**Files:**
- Modify: `js/ui/CardFactory.js` (`CARD_IMAGES` `:45-47`, isHangang 분기 `:811-830`)

- [ ] **Step 1: CARD_IMAGES 구별 매핑**

`js/ui/CardFactory.js` 상단 CARD_IMAGES 정의를 구별 10개로 확장한다. `HANGANG_DISTRICTS`를 landmarks.js에서 import하여 동적 등록:

```js
import { HANGANG_DISTRICTS } from '../data/landmarks.js';
```

CARD_IMAGES 정의 직후:

```js
for (const d of HANGANG_DISTRICTS) {
  CARD_IMAGES[`lm_hangang_${d}`] = 'assets/images/landmarks/lm_hangang.png';
}
```

> CARD_IMAGES가 `const`로 선언돼도 객체 프로퍼티 추가는 가능하다. 기존 `lm_hangang: '...'`(`:46`) 라인은 제거한다(더 이상 단일 카드 없음).

- [ ] **Step 2: 진입 발행 키 변경**

`:811-830`의 `def.isHangang` 분기에서 두 곳의 `landmarkRequest`를 구별 키로:

```js
el.addEventListener('click', () => {
  EventBus.emit('landmarkRequest', { districtId: def.id });
});
el.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    EventBus.emit('landmarkRequest', { districtId: def.id });
  }
});
```

> `def.id`는 `lm_hangang_<구>`이며 `getLandmarkData`의 `lm_` 폴백으로 `hangang_<구>` 데이터에 매칭된다. 렌더 분기(`:812 def.isHangang`)와 `_buildLandmarkInner(def, true)`는 그대로 둔다.

- [ ] **Step 3: 수동 동작 확인**

`npm run dev:web` 실행 → hasFishing 구(예: 강남) 진입 → 한강 카드 클릭 → 한강 랜드마크 진입(낚시터·강변 카드 표시) 확인. 다른 hasFishing 구(예: 마포)에서도 동일 동작 확인.

> CardFactory는 DOM 의존이라 단위 테스트보다 수동 확인이 적절하다. (테스트가 쉽게 작성되면 추가해도 좋다.)

- [ ] **Step 4: 커밋**

```bash
git add js/ui/CardFactory.js
git commit -m "feat(ui): 한강 카드 구별 이미지 매핑 + 구별 진입 발행 키"
```

---

## Task 6: FishingSystem.js + ModalManager.js — 판정 헬퍼화

**Files:**
- Modify: `js/systems/FishingSystem.js` (`:20-22`)
- Modify: `js/ui/ModalManager.js` (`:295`)
- Test: `tests/unit/Hangang_perDistrict.test.js`

- [ ] **Step 1: 실패 테스트 추가**

```js
import { _isInHangang } from '../../js/systems/FishingSystem.js'; // export 형태 확인 후 조정
```

> FishingSystem의 `_isInHangang`이 export되지 않으면, 대신 `isHangangLandmark`를 직접 검증(Task 1에서 이미 커버)하고, FishingSystem/ModalManager 변경은 Step 3 구현 + Step 4 수동 확인으로 처리한다. 비공개 함수를 억지로 export하지 말 것.

대안(권장) — 판정 로직이 헬퍼로 위임됐는지 통합 동작으로 확인:

```js
// currentLandmark = 'hangang_gangnam' 상태에서 낚시 가능 판정이 true 인지
// FishingSystem 공개 진입점(낚시 시작/가능 여부) 기준으로 검증
```

- [ ] **Step 2: 테스트 실패 확인 (작성한 경우)**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js -t "낚시"`
Expected: FAIL

- [ ] **Step 3: 구현**

`js/systems/FishingSystem.js:20-22`:

```js
import { isHangangLandmark } from '../data/landmarks.js'; // 상단 import에 추가

function _isInHangang() {
  return isHangangLandmark(GameState.location?.currentLandmark);
}
```

`js/ui/ModalManager.js:295`:

```js
const inHangang = isHangangLandmark(GameState.location?.currentLandmark);
```

상단 import에 `import { isHangangLandmark } from '../data/landmarks.js';` 추가(경로는 ModalManager 위치 기준으로 확인).

- [ ] **Step 4: 테스트/수동 확인**

Run: `npx vitest run tests/unit/Hangang_perDistrict.test.js`
Expected: PASS (전체)
추가 수동: 한강 진입 후 낚싯대 사용 모달이 정상 동작, 낚시 가능 판정 동작.

- [ ] **Step 5: 커밋**

```bash
git add js/systems/FishingSystem.js js/ui/ModalManager.js tests/unit/Hangang_perDistrict.test.js
git commit -m "fix(fishing): 한강 판정을 isHangangLandmark 헬퍼로 교체 (구별 ID 대응)"
```

---

## Task 7: 점검 — 시뮬·에디터·i18n + 최종 검증

**Files (발견 시 수정):**
- `tools/sim/v2/playerAI.mjs`
- `tools/editor/editor.js`
- `js/data/locales.js`

- [ ] **Step 1: 하드코딩 참조 스캔**

Run: `grep -rnE "lm_hangang\b|'hangang'|\"hangang\"" tools/ js/`
검토: 남은 참조가 의도된 것인지 확인. `tools/sim/v2/playerAI.mjs`가 `lm_hangang`/`'hangang'`을 단일 키로 가정하면 구별 ID(또는 `isHangang` 플래그/`startsWith('hangang')`) 기준으로 수정.

- [ ] **Step 2: 시뮬 동작 확인 (sim이 한강을 참조하면)**

Run: 해당 시뮬 엔트리(예: `node tools/sim/v2/...` — 실제 실행 커맨드는 `tools/sim` README 확인)
Expected: 한강 진입/낚시 경로가 에러 없이 동작.

- [ ] **Step 3: 에디터 렌더 확인**

`tools/editor/editor.js`가 `lm_hangang` 단일 카드를 특수 취급하는지 확인. 데이터 자동 렌더(objNode 재귀)면 구별 카드도 자동 노출되어 변경 불필요. 특수 분기가 있으면 구별 대응.

Run: `node tools/editor/check-help-coverage.mjs`
Expected: exit 0 (신규 필드 없음)

- [ ] **Step 4: i18n 확인**

`js/data/locales.js`에서 `hangang`/`lm_hangang` 키가 카드 이름·설명에 쓰이는지 확인. 카드 def에 name이 직접 있어 동작에 지장 없으면 변경 불필요. 이중언어(`nameEn`) 라벨이 단일 키에 묶여 있으면 구별 카드에도 반영.

- [ ] **Step 5: 전체 회귀 검증**

```bash
npx vitest run
node js/data/validate.js
```
Expected: 테스트 전체 PASS, validate 신규 에러 0.

- [ ] **Step 6: 동작 동일성 최종 확인 (콘텐츠 복제이므로 게임플레이 불변)**

`npm run dev:web` →
- hasFishing 10개 구 중 2~3곳 진입 → 한강 카드 표시
- 한강 진입 → 낚시터/강변 카드 표시
- 낚싯대 첫 진입 1회 지급 후, **다른 구 한강에서는 미지급**(claimKey 공유 확인)
- 낚시 동작 정상

- [ ] **Step 7: 커밋 + 스펙 주석 갱신**

`js/data/locationCardMeta.js:186`의 "단일 정의" 주석을 구별 분리 사실로 갱신.

```bash
git add -u
git commit -m "chore(landmark): 한강 구별 분리 — 시뮬·에디터·i18n 점검 및 주석 갱신"
```

---

## Self-Review 체크리스트 (작성자 확인 완료)

- **스펙 커버리지:** ID 체계(Task 1·2) / base+오버라이드(Task 1) / 카드 팩토리 전환(Task 2·3) / 진입 4지점(Task 4·5·6) / 낚싯대 공유(Task 1 테스트) / 검증(Task 3·7) / 점검 3파일(Task 7) — 스펙 전 항목 매핑됨.
- **타입/이름 일관성:** `HANGANG_DISTRICTS`, `buildHangangEntry`, `buildAllHangangCards`, `isHangangLandmark`, 카드 ID `lm_hangang_<구>`, 데이터 키 `hangang_<구>`, sub.id `*_<구>` — 전 Task 동일 사용.
- **플레이스홀더:** 코드 스텝은 실제 코드 포함. DOM/시뮬 의존으로 단위 테스트가 과한 Task(4·5·6)는 수동 확인으로 명시 대체(억지 mocking 금지 메모 포함).
