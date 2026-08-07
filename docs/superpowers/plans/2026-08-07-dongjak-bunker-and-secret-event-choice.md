# 국립현충원 지하 벙커 + 비밀 이벤트 선택지 UI 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 숨겨진 장소를 랜드마크 세부장소로 노출하는 공용 구조를 만들고 국립현충원 지하 벙커에 적용하며, 비밀 이벤트의 선택지를 플레이어가 직접 고르도록 만든다.

**Architecture:** 세부장소 가시성 판정을 `landmarks.js`의 순수 함수 하나로 수렴시켜 3개 호출부가 공유한다. 숨겨진 장소 발견 시의 보상 지급은 `subLocationId` 연결 여부로 분기해 세부장소의 기존 `firstEnterReward` 장치에 위임한다. 비밀 이벤트는 `EventBus.hasListener`로 UI 존재를 판별해 선택지 모달과 자동 폴백을 나눈다.

**Tech Stack:** 바닐라 JS (ES 모듈), Vite, Vitest, CSS 변수

## Global Constraints

- 모든 사용자 노출 문자열은 한글. 기존 파일의 들여쓰기·따옴표 스타일을 그대로 따른다 (`js/data/*.js`는 2-space, single quote).
- 소스 주석에 진행 상황·이모지·단계 번호를 남기지 않는다. 코드로 드러나지 않는 의도(Why)만 적는다.
- 객체를 직접 변경하지 않는다. 단, `GameState.flags.*` 배열 push는 프로젝트 전반의 기존 패턴이므로 유지한다.
- 요청 범위 밖 코드를 정리하지 않는다. `js/screens/Basecamp.js`(죽은 파일)는 건드리지 않는다.
- 테스트 실행: `npx vitest run <경로>` (프로젝트 스크립트는 `npm test` = `vitest run`)
- 데이터 검증: `node js/data/validate.js`
- 에디터 도움말 검사: `node tools/editor/check-help-coverage.mjs`
- 작업 브랜치: `feat/dongjak-bunker-secret-event-choice` (이미 생성됨, 설계 문서 커밋 `f5ef303` 위)
- `git add`는 변경한 파일을 명시적으로 나열한다. `git add -A` 금지.

## 파일 구조

| 파일 | 책임 | 상태 |
|------|------|------|
| `js/data/landmarks.js` | 랜드마크·세부장소 데이터 + 조회 헬퍼. 벙커 데이터와 가시성 필터를 추가 | 수정 |
| `js/data/hiddenLocations.js` | 숨겨진 장소 정의. 벙커에 세부장소·컷씬 연결 | 수정 |
| `js/data/cinematicScenes.js` | 컷씬 장면 데이터. 발견 장면 추가 | 수정 |
| `js/data/secretEvents.js` | 비밀 이벤트 데이터. 선택지 수량 조건 교정 | 수정 |
| `js/core/EventBus.js` | pub/sub. 수신자 유무 조회 추가 | 수정 |
| `js/systems/HiddenElementSystem.js` | 숨겨진 요소 판정·적용. 컷씬 발행, 보상 위임, 선택지 조건 판정·해결 | 수정 |
| `js/systems/ExploreSystem.js` | 탐색·이동. 세부장소 조회 2곳을 공용 필터로 교체 | 수정 |
| `js/ui/LandmarkModal.js` | 랜드마크 창. 세부장소 목록을 공용 필터로 교체 | 수정 |
| `js/ui/SecretEventModal.js` | 비밀 이벤트 선택지 창 (렌더 + 선택 전달만 담당) | 신규 |
| `js/screens/Main.js` | 화면 템플릿·초기화 배선. 모달 컨테이너 추가 | 수정 |
| `css/secret-event-modal.css` | 선택지 창 스타일 | 신규 |
| `index.html` | 스타일시트 링크 | 수정 |
| `tools/editor/editor.js` | 에디터 필드 도움말 | 수정 |
| `tests/unit/HiddenSubLocationGating.test.js` | 가시성 필터 + 보상 위임 검증 | 신규 |
| `tests/unit/SecretEventChoice.test.js` | 선택지 조건 판정 + 데이터 정합성 검증 | 신규 |

**작업 순서 근거:** Task 1(가시성 필터) → Task 2(벙커 데이터)는 필터가 없으면 벙커가 즉시 노출되므로 순서가 고정된다. Task 4(EventBus)는 Task 5·6이 의존한다. Task 3(컷씬·보상 위임)과 Task 7(수량 조건)은 서로 독립적이다.

---

### Task 1: 세부장소 가시성 공용 필터

`requiresHiddenLocation` 필드를 가진 세부장소를 발견 전까지 숨기는 순수 함수를 만들고, 3개 호출부를 여기에 연결한다.

**Files:**
- Modify: `js/data/landmarks.js` (`getLandmarkData` 아래, 약 6082행)
- Modify: `js/systems/ExploreSystem.js:708`, `js/systems/ExploreSystem.js:730-733`
- Modify: `js/ui/LandmarkModal.js:69`
- Test: `tests/unit/HiddenSubLocationGating.test.js` (신규)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `getVisibleSubLocations(key: string, discoveredLocationIds?: string[]) => Array<SubLocation>` — `js/data/landmarks.js`에서 named export. `discoveredLocationIds` 기본값 `[]`. 반환 배열의 원소는 `LANDMARK_DATA[key].subLocations`의 원소와 동일한 참조.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/HiddenSubLocationGating.test.js` 생성:

```js
import { describe, expect, it } from 'vitest';
import { getVisibleSubLocations } from '../../js/data/landmarks.js';

describe('세부장소 가시성 필터', () => {
  it('requiresHiddenLocation이 없는 세부장소는 발견 목록과 무관하게 노출된다', () => {
    const visible = getVisibleSubLocations('lm_dongjak', []);
    const ids = visible.map(s => s.id);
    expect(ids).toContain('dongjak_memorial');
    expect(ids).toContain('dongjak_hall');
    expect(ids).toContain('dongjak_storage');
    expect(ids).toContain('dongjak_office');
    expect(ids).toContain('dongjak_forest');
  });

  it('발견 목록 인자를 생략해도 동작한다', () => {
    expect(getVisibleSubLocations('lm_dongjak').length).toBeGreaterThan(0);
  });

  it('존재하지 않는 랜드마크 키는 빈 배열을 반환한다', () => {
    expect(getVisibleSubLocations('lm_does_not_exist', [])).toEqual([]);
    expect(getVisibleSubLocations(null, [])).toEqual([]);
  });

  it('district-keyed 랜드마크는 lm_ 접두사를 붙여도 조회된다', () => {
    expect(getVisibleSubLocations('gangnam', []).length).toBeGreaterThan(0);
    expect(getVisibleSubLocations('lm_gangnam', []).length)
      .toBe(getVisibleSubLocations('gangnam', []).length);
  });
});
```

**`getLandmarkData`의 폴백은 한 방향뿐이다.** `LANDMARK_DATA` 키 43개 중 8개(`lm_dongjak`, `lm_boramae_hospital` 등)는 키 자체에 `lm_` 접두사를 포함하고, 나머지는 구 이름 그대로다. `getLandmarkData`는 접두사를 **제거하는** 폴백만 갖는다(`lm_gangnam` → `gangnam`). 붙이는 방향은 없으므로 `'dongjak'`으로는 조회되지 않는다.

실제 호출부는 전부 접두사가 붙은 키를 넘기므로 이 비대칭은 문제가 되지 않는다 — 랜드마크 카드 클릭은 `landmarkRequest { districtId: def.id }`(`CardFactory.js:890`)로 `lm_dongjak`을, 세부장소 카드 클릭은 `sublocationRequest { districtId: def.districtId }`(`CardFactory.js:845`)로 `registerSubLocationItems`가 넣은 `LANDMARK_DATA` 키를 그대로 넘긴다. **`getLandmarkData`에 반대 방향 폴백을 추가하지 않는다** — 필요로 하는 호출부가 없고, 오타로 잘못된 키를 넘겨도 조용히 성공해 버그를 가린다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/HiddenSubLocationGating.test.js`
Expected: FAIL — `getVisibleSubLocations is not a function`

- [ ] **Step 3: 필터 함수 구현**

`js/data/landmarks.js`의 `getLandmarkData` 함수 정의 바로 아래(`landmarkHasFishing` 앞)에 추가:

```js
/**
 * 랜드마크의 세부 장소 중 현재 플레이어에게 노출해야 할 것만 반환한다.
 * `requiresHiddenLocation`이 지정된 세부 장소는 해당 숨겨진 장소를 발견한 뒤에만 나타난다.
 * 본 모듈은 GameState를 import하지 않으므로(순환 의존 방지) 발견 목록을 인자로 받는다.
 * @param {string} key - 랜드마크 아이템 ID 또는 LANDMARK_DATA 키
 * @param {string[]} discoveredLocationIds - GameState.flags.hiddenLocationsDiscovered
 * @returns {Array<object>} 노출 대상 세부 장소 배열
 */
export function getVisibleSubLocations(key, discoveredLocationIds = []) {
  const subs = getLandmarkData(key)?.subLocations ?? [];
  return subs.filter(sub =>
    !sub.requiresHiddenLocation || discoveredLocationIds.includes(sub.requiresHiddenLocation)
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/HiddenSubLocationGating.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: `ExploreSystem` 호출부 2곳 교체**

`js/systems/ExploreSystem.js` 상단 import 수정:

```js
import { LANDMARK_DATA, getLandmarkData, getVisibleSubLocations } from '../data/landmarks.js';
```

`_updateTopRowForLandmark` 안, 세부 장소 카드 배치 루프(약 708행):

```js
    // 세부 장소 카드 → top[1..N]
    let slot = 1;
    for (const sub of getVisibleSubLocations(landmarkKey, gs.flags?.hiddenLocationsDiscovered ?? [])) {
```

`enterSubLocation` 안(약 730-733행), 아래 두 줄을

```js
    const lmData = getLandmarkData(districtId);
    const sub    = lmData?.subLocations?.find(s => s.id === subLocationId);
```

다음으로 교체:

```js
    const sub = getVisibleSubLocations(districtId, GameState.flags?.hiddenLocationsDiscovered ?? [])
      .find(s => s.id === subLocationId);
```

`lmData` 선언을 함께 지운다. `enterSubLocation`(722-862행) 안에서 `lmData`를 참조하는 곳은 교체 대상이던 그 한 줄뿐이라, 남겨두면 이 변경이 만들어낸 미사용 변수가 된다. 자기 변경이 만든 고아를 정리하는 것은 Surgical Changes 원칙에 부합한다. `getLandmarkData` import는 같은 파일의 다른 곳(`:502` 등)에서 계속 쓰이므로 유지한다.

잠긴 세부장소는 `sub`가 `undefined`가 되어 기존 `if (!sub) return;` 가드에 걸린다.

- [ ] **Step 6: `LandmarkModal` 호출부 교체**

`js/ui/LandmarkModal.js` 상단 import 수정:

```js
import LANDMARK_DATA, { rollLoot, getLandmarkData, getVisibleSubLocations } from '../data/landmarks.js';
```

`_render()` 안(약 69행):

```js
    const visibleSubs = getVisibleSubLocations(this._districtId, GameState.flags?.hiddenLocationsDiscovered ?? []);
    const subLocHtml = visibleSubs.map(loc => this._renderSubLoc(loc)).join('');
```

같은 함수 하단의 `this._bindSubLocEvents(box, data);`는 `data`를 그대로 넘기므로 변경하지 않는다. 클릭 핸들러가 `data.subLocations`에서 다시 찾더라도, 잠긴 세부장소는 DOM에 없으므로 클릭 자체가 발생하지 않는다.

- [ ] **Step 7: 전체 테스트 통과 확인**

Run: `npx vitest run`
Expected: PASS — 기존 테스트 전부 통과 (가시성 필터는 아직 아무 세부장소도 걸러내지 않으므로 동작 변화 없음)

- [ ] **Step 8: 커밋**

```bash
git add js/data/landmarks.js js/systems/ExploreSystem.js js/ui/LandmarkModal.js tests/unit/HiddenSubLocationGating.test.js
git commit -m "feat(explore): add shared sublocation visibility filter"
```

---

### Task 2: 지하 벙커 세부장소 데이터

국립현충원에 잠긴 세부장소를 추가한다. Task 1의 필터가 있어야 숨겨지므로 순서가 고정된다.

**Files:**
- Modify: `js/data/landmarks.js:3483-3484` (`lm_dongjak.subLocations` 말미)
- Test: `tests/unit/HiddenSubLocationGating.test.js` (확장)

**Interfaces:**
- Consumes: `getVisibleSubLocations(key, discoveredLocationIds)` (Task 1)
- Produces: 세부장소 ID `'dongjak_bunker'`, 최초 보상 claim 키 `'dongjak_bunker_first'`. 이 세부장소는 `requiresHiddenLocation: 'hidden_dongjak_cemetery_vault'`를 갖는다.

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/unit/HiddenSubLocationGating.test.js`의 `describe` 블록 안에 추가:

```js
  it('지하 벙커는 발견 전 노출되지 않는다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', []).map(s => s.id);
    expect(ids).not.toContain('dongjak_bunker');
  });

  it('지하 벙커는 벙커를 발견한 뒤 노출된다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', ['hidden_dongjak_cemetery_vault']).map(s => s.id);
    expect(ids).toContain('dongjak_bunker');
  });

  it('무관한 장소를 발견해도 지하 벙커는 잠긴 채다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', ['hidden_jongno_royal_vault']).map(s => s.id);
    expect(ids).not.toContain('dongjak_bunker');
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/HiddenSubLocationGating.test.js`
Expected: FAIL — "지하 벙커는 벙커를 발견한 뒤 노출된다"가 실패 (`dongjak_bunker`가 존재하지 않음). 나머지 둘은 통과한다.

- [ ] **Step 3: 벙커 세부장소 추가**

`js/data/landmarks.js` 3483행 `      },`(마지막 세부장소 `dongjak_forest`의 닫는 괄호)와 3484행 `    ],` 사이에 삽입. 주변 데이터와 동일한 축약 없는 형식을 따른다:

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
          items: [
            { id: 'military_radio_kit', qty: 1 },
          ],
        },
        lootTable: [
          {
            id: 'pistol_ammo',
            weight: 4,
          },
          {
            id: 'military_ration',
            weight: 4,
          },
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'radio',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/HiddenSubLocationGating.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: 데이터 검증**

Run: `node js/data/validate.js`
Expected: 오류 없이 종료. `military_radio_kit` / `pistol_ammo` / `military_ration` / `bandage` / `radio`가 모두 정의되어 있으므로 미정의 참조 경고가 없어야 한다.

- [ ] **Step 6: 커밋**

```bash
git add js/data/landmarks.js tests/unit/HiddenSubLocationGating.test.js
git commit -m "feat(landmark): add locked dongjak bunker sublocation"
```

---

### Task 3: 발견 컷씬 + 보상 위임

숨겨진 장소 발견 시 컷씬을 재생하고, 세부장소가 연결된 장소는 보상 지급을 세부장소에 넘긴다.

**Files:**
- Modify: `js/data/cinematicScenes.js` (파일 말미 `};` 앞)
- Modify: `js/data/hiddenLocations.js:395-427` (`hidden_dongjak_cemetery_vault`)
- Modify: `js/systems/HiddenElementSystem.js:154-202` (`_discoverHiddenLocation`)
- Test: `tests/unit/HiddenSubLocationGating.test.js` (확장)

**Interfaces:**
- Consumes: 세부장소 ID `'dongjak_bunker'` (Task 2)
- Produces: 숨겨진 장소 데이터의 신규 필드 `subLocationId: string`, `cinematicId: string`. 컷씬 장면 ID `'cin_discover_dongjak_bunker'`.

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/unit/HiddenSubLocationGating.test.js` 파일 상단 import에 추가:

```js
import { HIDDEN_LOCATIONS } from '../../js/data/hiddenLocations.js';
import CINEMATIC_SCENES from '../../js/data/cinematicScenes.js';
```

새 `describe` 블록을 파일 말미에 추가:

```js
describe('숨겨진 장소의 세부장소 · 컷씬 연결', () => {
  it('벙커는 세부장소와 컷씬이 연결되어 있다', () => {
    const loc = HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault;
    expect(loc.subLocationId).toBe('dongjak_bunker');
    expect(loc.cinematicId).toBe('cin_discover_dongjak_bunker');
  });

  it('연결된 컷씬 장면이 실제로 정의되어 있다', () => {
    for (const loc of Object.values(HIDDEN_LOCATIONS)) {
      if (!loc.cinematicId) continue;
      expect(CINEMATIC_SCENES[loc.cinematicId], loc.id).toBeDefined();
    }
  });

  it('연결된 세부장소가 실제로 존재하고 잠겨 있다', () => {
    for (const loc of Object.values(HIDDEN_LOCATIONS)) {
      if (!loc.subLocationId) continue;
      const sub = getVisibleSubLocations(`lm_${loc.district}`, [loc.id])
        .find(s => s.id === loc.subLocationId);
      expect(sub, loc.id).toBeDefined();
      expect(sub.requiresHiddenLocation, loc.id).toBe(loc.id);
    }
  });

  it('발견 메시지가 새 톤으로 교체되어 있다', () => {
    const msg = HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault.discoveryMessage;
    expect(msg).toContain('동작구를 꼼꼼히 뒤진 끝에');
    expect(msg).not.toContain('참배로 아래에서');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/HiddenSubLocationGating.test.js`
Expected: FAIL — "벙커는 세부장소와 컷씬이 연결되어 있다"에서 `subLocationId`가 `undefined`

- [ ] **Step 3: 컷씬 장면 추가**

`js/data/cinematicScenes.js` 파일 말미, 마지막 장면 정의 뒤이자 객체를 닫는 `};` 앞에 구획과 함께 추가:

```js
  // ── 숨겨진 장소 발견 ─────────────────────────────────────────────

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

`image: null`이면 `CinematicScene`이 그라디언트만 표시한다. 배경 이미지는 후속 작업에서 `assets/images/cinematic/`에 파일을 넣고 경로만 채운다.

- [ ] **Step 4: 숨겨진 장소 정의 확장**

`js/data/hiddenLocations.js`의 `hidden_dongjak_cemetery_vault`에서 `repeatCooldownDays: 0,` 다음 줄의 `discoveryMessage`를 아래처럼 교체하고 두 필드를 추가:

```js
    repeatable: false,
    repeatCooldownDays: 0,
    subLocationId: 'dongjak_bunker',
    cinematicId: 'cin_discover_dongjak_bunker',
    discoveryMessage: '⭐ 동작구를 꼼꼼히 뒤진 끝에, 국립현충원 안에서 비밀스러운 군사 벙커를 찾아냈다.',
  },
```

`rewards`와 `lootTable`은 그대로 둔다. 이 장소가 무엇을 주는 곳인지에 대한 기록이며, 실행 시 건너뛰는 것은 시스템이 담당한다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run tests/unit/HiddenSubLocationGating.test.js`
Expected: PASS (11 tests)

- [ ] **Step 6: `_discoverHiddenLocation` 수정**

`js/systems/HiddenElementSystem.js`의 `_discoverHiddenLocation`에서, 발견 알림 `EventBus.emit('notify', {...})` 블록 **다음**에 컷씬 발행과 안내를 추가하고, 보상·전리품 블록을 조건으로 감싼다. 수정 후 전체 형태:

```js
  _discoverHiddenLocation(locId, loc) {
    const gs = GameState;
    gs.flags.hiddenLocationsDiscovered.push(locId);

    // 발견 알림
    EventBus.emit('notify', {
      message: loc.discoveryMessage || I18n.t('hidden.locationFound', { name: loc.name }),
      type: 'good',
    });

    if (loc.cinematicId) {
      EventBus.emit('showCinematic', { sceneId: loc.cinematicId });
    }

    // 세부 장소가 연결된 장소는 진입 시 firstEnterReward로 지급하므로 여기서는 위치만 안내한다
    if (loc.subLocationId) {
      EventBus.emit('notify', {
        message: `🚪 ${loc.name}에 진입할 수 있게 되었다. 해당 랜드마크에서 찾아보자.`,
        type: 'info',
      });
    } else {
      // 보상 아이템 지급
      if (loc.rewards?.length) {
        for (const reward of loc.rewards) {
          const inst = gs.createCardInstance(reward.definitionId, { quantity: reward.qty ?? 1 });
          if (inst) {
            gs.placeCardInRow(inst.instanceId, 'middle');
            const def = GameData?.items?.[reward.definitionId];
            if (def) {
              EventBus.emit('notify', {
                message: I18n.t('hidden.reward', { icon: def.icon ?? '📦', name: I18n.itemName(def.id, def.name) }),
                type: 'good',
              });
            }
            // 전설 아이템 추적
            if (def?.rarity === 'legendary' || def?.legendary) {
              if (!gs.flags.legendaryItemsFound.includes(reward.definitionId)) {
                gs.flags.legendaryItemsFound.push(reward.definitionId);
              }
            }
          }
        }
      }

      // 추가 랜덤 루트
      if (loc.lootTable?.length) {
        this._rollAndPlaceLoot(loc.lootTable, 2);
      }
    }

    // 보스 전투 트리거
    if (loc.bossId && SECRET_ENEMIES[loc.bossId]) {
      this._spawnBoss(loc.bossId);
    }

    // 히든 레시피 해금 체크
    this._checkRecipeUnlocks();

    EventBus.emit('hiddenLocationDiscovered', { locationId: locId, location: loc });
    EventBus.emit('boardChanged', {});
  },
```

보스 트리거·레시피 해금·이벤트 발행은 위치와 동작 모두 그대로 유지한다.

- [ ] **Step 7: 보상 위임 동작 테스트 추가**

먼저 `tests/unit/HiddenSubLocationGating.test.js` **파일 상단 import 블록**에 추가:

```js
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
```

그다음 파일 말미에 `describe` 블록을 추가:

```js
describe('발견 시 보상 위임', () => {
  function freshFlags() {
    GameState.flags.hiddenLocationsDiscovered = [];
    GameState.flags.legendaryItemsFound = [];
    GameState.flags.hiddenRecipesUnlocked = [];
  }

  it('세부장소가 연결된 장소는 발견 즉시 카드를 놓지 않는다', () => {
    freshFlags();
    const before = GameState.getBoardCards().length;
    HiddenElementSystem._discoverHiddenLocation(
      'hidden_dongjak_cemetery_vault',
      HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault,
    );
    expect(GameState.getBoardCards().length).toBe(before);
  });

  it('세부장소가 연결된 장소도 컷씬을 발행한다', () => {
    freshFlags();
    const seen = [];
    const off = EventBus.on('showCinematic', p => seen.push(p.sceneId));
    HiddenElementSystem._discoverHiddenLocation(
      'hidden_dongjak_cemetery_vault',
      HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault,
    );
    off();
    expect(seen).toContain('cin_discover_dongjak_bunker');
  });

  it('세부장소가 없는 장소는 기존대로 보상을 지급한다', () => {
    freshFlags();
    const loc = HIDDEN_LOCATIONS.hidden_junggoo_city_hall_safe;
    expect(loc.subLocationId).toBeUndefined();
    const before = GameState.getBoardCards().length;
    HiddenElementSystem._discoverHiddenLocation('hidden_junggoo_city_hall_safe', loc);
    expect(GameState.getBoardCards().length).toBeGreaterThan(before);
  });
});
```

- [ ] **Step 8: 테스트 통과 확인**

Run: `npx vitest run tests/unit/HiddenSubLocationGating.test.js`
Expected: PASS (14 tests)

- [ ] **Step 9: 전체 테스트 + 데이터 검증**

Run: `npx vitest run`
Expected: PASS

Run: `node js/data/validate.js`
Expected: 오류 없음

- [ ] **Step 10: 커밋**

```bash
git add js/data/cinematicScenes.js js/data/hiddenLocations.js js/systems/HiddenElementSystem.js tests/unit/HiddenSubLocationGating.test.js
git commit -m "feat(hidden): play cinematic on discovery and delegate bunker rewards to sublocation"
```

---

### Task 4: `EventBus.hasListener`

비밀 이벤트 시스템이 "선택지 UI가 붙어 있는가"를 판별할 수단을 만든다.

**Files:**
- Modify: `js/core/EventBus.js`
- Test: `tests/unit/SecretEventChoice.test.js` (신규)

**Interfaces:**
- Consumes: 없음
- Produces: `EventBus.hasListener(event: string) => boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/SecretEventChoice.test.js` 생성:

```js
import { describe, expect, it } from 'vitest';
import EventBus from '../../js/core/EventBus.js';

describe('EventBus.hasListener', () => {
  it('수신자가 없으면 false', () => {
    expect(EventBus.hasListener('__no_such_channel__')).toBe(false);
  });

  it('구독하면 true, 해제하면 false', () => {
    const off = EventBus.on('__probe__', () => {});
    expect(EventBus.hasListener('__probe__')).toBe(true);
    off();
    expect(EventBus.hasListener('__probe__')).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: FAIL — `EventBus.hasListener is not a function`

- [ ] **Step 3: 구현**

`js/core/EventBus.js`의 `once` 메서드 다음에 추가:

```js
  hasListener(event) {
    return (this._listeners[event]?.length ?? 0) > 0;
  },
```

알려진 채널 주석 목록의 `secretEventTriggered` 줄 아래에 추가:

```js
// showCinematic            { sceneId, onComplete }
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/core/EventBus.js tests/unit/SecretEventChoice.test.js
git commit -m "feat(core): add EventBus.hasListener"
```

---

### Task 5: 선택지 조건 판정 + 선택 해결 API

선택지의 필요 물품을 평가하고, 플레이어가 고른 선택지를 실행하는 공개 API를 시스템에 만든다.

**Files:**
- Modify: `js/systems/HiddenElementSystem.js:418-441` (`_triggerSecretEvent`)
- Test: `tests/unit/SecretEventChoice.test.js` (확장)

**Interfaces:**
- Consumes: `EventBus.hasListener(event)` (Task 4)
- Produces:
  - `HiddenElementSystem.evaluateChoiceConditions(choice) => { ok: boolean, missing: Array<{ id: string, need: number, have: number }> }`
  - `HiddenElementSystem.resolveSecretEventChoice(eventId: string, choiceIndex: number) => boolean`

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/unit/SecretEventChoice.test.js`의 import에 추가:

```js
import GameState from '../../js/core/GameState.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import SECRET_EVENTS from '../../js/data/secretEvents.js';
```

새 `describe` 블록 추가:

```js
describe('선택지 조건 판정', () => {
  it('조건이 없으면 항상 통과', () => {
    const r = HiddenElementSystem.evaluateChoiceConditions({ id: 'x' });
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it('requiredItems는 1개 이상 보유를 요구한다', () => {
    const choice = { conditions: { requiredItems: ['__absent_item__'] } };
    const r = HiddenElementSystem.evaluateChoiceConditions(choice);
    expect(r.ok).toBe(false);
    expect(r.missing[0]).toMatchObject({ id: '__absent_item__', need: 1, have: 0 });
  });

  it('requiredItemQty는 지정 수량을 요구한다', () => {
    const choice = { conditions: { requiredItemQty: [{ id: '__absent_item__', qty: 3 }] } };
    const r = HiddenElementSystem.evaluateChoiceConditions(choice);
    expect(r.ok).toBe(false);
    expect(r.missing[0]).toMatchObject({ id: '__absent_item__', need: 3, have: 0 });
  });

  it('보유 수량이 충분하면 통과한다', () => {
    const inst = GameState.createCardInstance('canned_food', { quantity: 5 });
    GameState.placeCardInRow(inst.instanceId, 'bottom');
    const choice = { conditions: { requiredItemQty: [{ id: 'canned_food', qty: 3 }] } };
    expect(HiddenElementSystem.evaluateChoiceConditions(choice).ok).toBe(true);
    GameState.removeCardInstance(inst.instanceId);
  });
});

describe('선택지 해결', () => {
  it('존재하지 않는 이벤트·선택지는 false', () => {
    expect(HiddenElementSystem.resolveSecretEventChoice('__nope__', 0)).toBe(false);
    expect(HiddenElementSystem.resolveSecretEventChoice(SECRET_EVENTS[0].id, 99)).toBe(false);
  });

  it('조건을 만족하지 못한 선택지는 거부한다', () => {
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const idx = ev.choices.findIndex(c => c.id === 'trade');
    expect(HiddenElementSystem.resolveSecretEventChoice(ev.id, idx)).toBe(false);
  });

  it('조건 없는 선택지는 실행된다', () => {
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const idx = ev.choices.findIndex(c => c.id === 'chat_trader');
    expect(HiddenElementSystem.resolveSecretEventChoice(ev.id, idx)).toBe(true);
  });
});
```

"조건을 만족하지 못한 선택지는 거부한다"는 통조림을 보유하지 않은 초기 상태를 전제로 한다. 앞선 테스트에서 놓은 통조림은 같은 테스트 안에서 제거했다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: FAIL — `evaluateChoiceConditions is not a function`

- [ ] **Step 3: 두 메서드 구현**

`js/systems/HiddenElementSystem.js`의 `_triggerSecretEvent` 정의 **앞**에 추가:

```js
  /**
   * 선택지의 필요 물품 충족 여부를 판정한다.
   * UI가 잠금 표시에 쓰고, UI가 없는 환경의 자동 폴백도 같은 규칙을 공유한다.
   * @returns {{ ok: boolean, missing: Array<{id:string, need:number, have:number}> }}
   */
  evaluateChoiceConditions(choice) {
    const cond = choice?.conditions;
    if (!cond) return { ok: true, missing: [] };

    const missing = [];
    for (const itemId of cond.requiredItems ?? []) {
      const have = GameState.countOnBoard(itemId);
      if (have < 1) missing.push({ id: itemId, need: 1, have });
    }
    for (const { id, qty } of cond.requiredItemQty ?? []) {
      const need = qty ?? 1;
      const have = GameState.countOnBoard(id);
      if (have < need) missing.push({ id, need, have });
    }
    return { ok: missing.length === 0, missing };
  },

  /** 플레이어가 고른 비밀 이벤트 선택지를 실행한다. UI에서 호출한다. */
  resolveSecretEventChoice(eventId, choiceIndex) {
    const event  = SECRET_EVENTS.find(e => e.id === eventId);
    const choice = event?.choices?.[choiceIndex];
    if (!choice) return false;
    if (!this.evaluateChoiceConditions(choice).ok) return false;

    const outcome = this._rollOutcome(choice.outcomes ?? []);
    if (outcome) {
      EventBus.emit('notify', { message: outcome.text, type: 'info' });
      this._applyEventOutcome(outcome);
    }
    EventBus.emit('boardChanged', {});
    return true;
  },
```

- [ ] **Step 4: `_triggerSecretEvent` 분기 수정**

같은 파일의 `_triggerSecretEvent`에서, 아래 부분을

```js
    // 선택지가 없는 이벤트는 첫 번째 선택지의 첫 결과 자동 적용
    if (!event.choices?.length) return;

    // UI가 없는 경우 자동 처리 (첫 선택지, 가중치 기반 결과)
    const choice = event.choices[0];
    if (choice?.outcomes?.length) {
      const outcome = this._rollOutcome(choice.outcomes);
      if (outcome) {
        this._applyEventOutcome(outcome);
      }
    }
```

다음으로 교체:

```js
    if (!event.choices?.length) return;

    // UI가 붙어 있으면 플레이어 선택을 기다린다
    if (EventBus.hasListener('secretEventTriggered')) return;

    // UI가 없는 환경(테스트·시뮬레이션) 폴백 — 조건을 만족하는 첫 선택지
    const choice = event.choices.find(c => this.evaluateChoiceConditions(c).ok) ?? event.choices[0];
    if (choice?.outcomes?.length) {
      const outcome = this._rollOutcome(choice.outcomes);
      if (outcome) {
        this._applyEventOutcome(outcome);
      }
    }
```

- [ ] **Step 5: 폴백 동작 테스트 추가**

`tests/unit/SecretEventChoice.test.js` 말미에 추가:

```js
describe('UI 부재 시 자동 폴백', () => {
  it('조건을 만족하지 못하는 선택지를 건너뛴다', () => {
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const picked = ev.choices.find(c => HiddenElementSystem.evaluateChoiceConditions(c).ok);
    expect(picked).toBeDefined();
    expect(picked.id).not.toBe('trade');
  });

  it('UI 리스너가 있으면 자동 처리를 건너뛴다', () => {
    GameState.flags.secretEventsTriggered = [];
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const off = EventBus.on('secretEventTriggered', () => {});
    const before = GameState.getBoardCards().length;
    HiddenElementSystem._triggerSecretEvent(ev);
    off();
    expect(GameState.getBoardCards().length).toBe(before);
  });
});
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: PASS (11 tests)

- [ ] **Step 7: 전체 테스트 확인**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add js/systems/HiddenElementSystem.js tests/unit/SecretEventChoice.test.js
git commit -m "feat(hidden): evaluate secret event choice conditions and expose resolve API"
```

---

### Task 6: 비밀 이벤트 선택지 모달

플레이어가 선택지를 고르는 창을 만든다.

**Files:**
- Create: `js/ui/SecretEventModal.js`
- Create: `css/secret-event-modal.css`
- Modify: `index.html:43` 부근 (스타일시트 링크)
- Modify: `js/screens/Main.js` (import, 컨테이너, `init()` 배선)

**Interfaces:**
- Consumes: `HiddenElementSystem.evaluateChoiceConditions(choice)`, `HiddenElementSystem.resolveSecretEventChoice(eventId, choiceIndex)` (Task 5)
- Produces: `SecretEventModal.init()` — `js/screens/Main.js`의 `init()`에서 1회 호출

- [ ] **Step 1: 모달 컨테이너 추가**

`js/screens/Main.js`의 Contribution Choice modal 블록 다음에 추가:

```html
      <!-- Secret event choice modal -->
      <div class="modal-overlay" id="secret-event-modal">
        <div class="er-modal-box"></div>
      </div>
```

- [ ] **Step 2: 모달 구현**

`js/ui/SecretEventModal.js` 생성:

```js
// === SECRET EVENT MODAL ===
// 비밀 이벤트 발생 시 선택지를 표시하고 플레이어의 선택을 시스템에 전달한다.
// 필요 물품이 부족한 선택지는 잠금 표시하며, 판정 규칙은 HiddenElementSystem이 소유한다.

import EventBus          from '../core/EventBus.js';
import GameData          from '../data/GameData.js';
import HiddenElementSystem from '../systems/HiddenElementSystem.js';

const SecretEventModal = {
  _el: null,
  _box: null,
  _initialized: false,
  _event: null,

  init() {
    this._el  = document.getElementById('secret-event-modal');
    this._box = this._el?.querySelector('.er-modal-box');
    if (!this._el || this._initialized) return;
    this._initialized = true;

    this._el.addEventListener('click', e => {
      if (e.target === this._el) return;   // 바깥 클릭 닫기 금지 — 반드시 선택해야 함
      const pickEl = e.target.closest?.('[data-choice-index]');
      if (!pickEl || pickEl.dataset.locked === '1') return;
      this._pick(parseInt(pickEl.dataset.choiceIndex, 10));
    });

    EventBus.on('secretEventTriggered', ({ event }) => this._open(event));
  },

  _open(event) {
    if (!event?.choices?.length) return;
    this._event = event;
    this.render();
    this._el?.classList.add('open');
  },

  _pick(index) {
    const eventId = this._event?.id;
    if (!eventId) return;
    this._event = null;
    this._el?.classList.remove('open');
    HiddenElementSystem.resolveSecretEventChoice(eventId, index);
  },

  _itemName(id) {
    return GameData?.items?.[id]?.name ?? id;
  },

  render() {
    if (!this._box || !this._event) return;
    const ev = this._event;

    const choicesHtml = ev.choices.map((choice, idx) => {
      const { ok, missing } = HiddenElementSystem.evaluateChoiceConditions(choice);
      const lackText = missing
        .map(m => `${this._itemName(m.id)} ${m.have}/${m.need}`)
        .join(', ');
      return `
        <div class="se-choice${ok ? '' : ' locked'}"
             data-choice-index="${idx}"${ok ? '' : ' data-locked="1"'}>
          <span class="se-choice-mark">${ok ? '▶' : '🔒'}</span>
          <span class="se-choice-text">${choice.text}</span>
          ${ok ? '' : `<span class="se-choice-lack">${lackText} 부족</span>`}
        </div>`;
    }).join('');

    this._box.innerHTML = `
      <div class="er-header">
        <h2>${ev.icon ?? '❓'} ${ev.name}</h2>
      </div>
      <div class="er-body">
        <p class="se-desc">${ev.description ?? ''}</p>
        <div class="se-choices">${choicesHtml}</div>
      </div>
    `;
  },
};

export default SecretEventModal;
```

- [ ] **Step 3: 스타일 추가**

`css/secret-event-modal.css` 생성:

```css
/* 비밀 이벤트 선택지 창 — 컨테이너·헤더·본문은 er-modal 계열을 재사용한다 */

.se-desc {
  color: var(--text-dim);
  line-height: 1.6;
  margin-bottom: 16px;
}

.se-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.se-choice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.se-choice:hover {
  background: var(--bg-hover);
  border-color: var(--border-bright);
}

.se-choice.locked {
  cursor: not-allowed;
  opacity: 0.45;
}

.se-choice.locked:hover {
  background: none;
  border-color: var(--border-dim);
}

.se-choice-mark { flex: 0 0 auto; }
.se-choice-text { flex: 1 1 auto; }

.se-choice-lack {
  flex: 0 0 auto;
  font-size: 0.85em;
  color: var(--text-danger);
}
```

사용한 토큰 5개는 모두 `css/variables.css`에 정의되어 있다 — `--bg-hover`(8행), `--text-dim`(14행), `--text-danger`(15행), `--border-dim`(44행), `--border-bright`(46행). 새 토큰을 만들지 않는다.

- [ ] **Step 4: 스타일시트 링크**

`index.html`의 `<link rel="stylesheet" href="css/cinematic.css">` 다음 줄에 추가:

```html
  <link rel="stylesheet" href="css/secret-event-modal.css">
```

- [ ] **Step 5: 초기화 배선**

`js/screens/Main.js` — `ContributionChoiceModal` import 다음에:

```js
import SecretEventModal from '../ui/SecretEventModal.js';
```

`ContributionChoiceModal.init();` 다음 줄에:

```js
    SecretEventModal.init();
```

- [ ] **Step 6: 브라우저에서 동작 확인**

Run: `npm run dev:web`

브라우저 콘솔에서 강제로 이벤트를 발생시켜 창을 확인한다:

```js
const ev = (await import('/js/data/secretEvents.js')).default
  .find(e => e.id === 'event_wandering_trader');
(await import('/js/core/EventBus.js')).default.emit('secretEventTriggered', { event: ev });
```

확인 항목:
- 창이 열리고 선택지 3개가 보인다
- 통조림이 없으면 "통조림 3개로 의약품을 교환한다"가 회색·자물쇠로 잠기고 "통조림 0/3 부족"이 보인다
- 창 바깥을 클릭해도 닫히지 않는다
- 잠기지 않은 선택지를 클릭하면 창이 닫히고 결과 문구가 알림으로 뜬다

- [ ] **Step 7: 전체 테스트 확인**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add js/ui/SecretEventModal.js css/secret-event-modal.css index.html js/screens/Main.js
git commit -m "feat(ui): add secret event choice modal"
```

---

### Task 7: 선택지 수량 조건 교정

조건은 "1개 이상 보유"인데 결과가 2~3개를 소모하는 불일치 5건을 바로잡는다.

**Files:**
- Modify: `js/data/secretEvents.js:428`, `:568`, `:850`, `:1509`, `:2770`
- Test: `tests/unit/SecretEventChoice.test.js` (확장)

**Interfaces:**
- Consumes: `HiddenElementSystem.evaluateChoiceConditions(choice)` (Task 5)
- Produces: 없음 (데이터 교정)

- [ ] **Step 1: 실패하는 회귀 가드 테스트 추가**

`tests/unit/SecretEventChoice.test.js` 말미에 추가:

```js
describe('선택지 조건과 실제 소모량 정합성', () => {
  it('조건에 명시된 수량이 결과의 최대 소모량 이상이다', () => {
    const gaps = [];
    for (const ev of SECRET_EVENTS) {
      for (const ch of ev.choices ?? []) {
        const need = new Map();
        for (const id of ch.conditions?.requiredItems ?? []) need.set(id, 1);
        for (const { id, qty } of ch.conditions?.requiredItemQty ?? []) {
          need.set(id, Math.max(need.get(id) ?? 0, qty ?? 1));
        }
        if (need.size === 0) continue;

        const spend = new Map();
        for (const out of ch.outcomes ?? []) {
          for (const r of out.effects?.removeItems ?? []) {
            spend.set(r.id, Math.max(spend.get(r.id) ?? 0, r.qty ?? 1));
          }
        }
        for (const [id, max] of spend) {
          if ((need.get(id) ?? 0) < max) {
            gaps.push(`${ev.id}/${ch.id}: ${id} 조건 ${need.get(id) ?? 0} < 소모 ${max}`);
          }
        }
      }
    }
    expect(gaps).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: FAIL — 배열에 5건이 담긴다:

```
event_wandering_trader/trade: canned_food 조건 1 < 소모 3
event_survivor_camp/trade_food: canned_food 조건 1 < 소모 2
event_bridge_blockade/pay_toll: canned_food 조건 1 < 소모 3
event_underground_network_3/offer_supplies: canned_food 조건 1 < 소모 3
event_engineer_blueprint/build_prototype: scrap_metal 조건 1 < 소모 2
```

- [ ] **Step 3: 데이터 5줄 교체**

`js/data/secretEvents.js`의 아래 행을 각각 교체한다. 행 번호가 어긋나면 이벤트 ID와 선택지 ID로 위치를 확인한다.

| 행 | 이벤트 / 선택지 | 변경 후 |
|----|-----------------|---------|
| 428 | `event_wandering_trader` / `trade` | `conditions: { requiredItemQty: [{ id: 'canned_food', qty: 3 }] },` |
| 568 | `event_survivor_camp` / `trade_food` | `conditions: { requiredItemQty: [{ id: 'canned_food', qty: 2 }] },` |
| 850 | `event_bridge_blockade` / `pay_toll` | `conditions: { requiredItemQty: [{ id: 'canned_food', qty: 3 }] },` |
| 1509 | `event_underground_network_3` / `offer_supplies` | `conditions: { requiredItemQty: [{ id: 'canned_food', qty: 3 }] },` |
| 2770 | `event_engineer_blueprint` / `build_prototype` | `conditions: { requiredItemQty: [{ id: 'scrap_metal', qty: 2 }] },` |

1083행(`event_lost_child_1`)은 소모량이 1이라 불일치가 아니다. **변경하지 않는다.**

`event_engineer_blueprint`는 결과에 따라 고철 2개 또는 1개를 소모한다. 최악의 결과를 감당할 수 없는 상태에서 선택을 허용하면 같은 구멍이 남으므로 최대치인 2를 조건으로 삼는다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: PASS (12 tests)

- [ ] **Step 5: Red-Green 확인**

428행을 `conditions: { requiredItems: ['canned_food'] },`로 되돌린 뒤:

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: FAIL — `event_wandering_trader/trade` 1건이 보고된다 (테스트가 실제로 결함을 잡는다는 증거)

다시 `requiredItemQty` 형태로 복원한 뒤:

Run: `npx vitest run tests/unit/SecretEventChoice.test.js`
Expected: PASS

- [ ] **Step 6: 데이터 검증 + 전체 테스트**

Run: `node js/data/validate.js`
Expected: 오류 없음

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add js/data/secretEvents.js tests/unit/SecretEventChoice.test.js
git commit -m "fix(data): require actual consumed quantity for secret event choices"
```

---

### Task 8: 에디터 도움말 등록

신규 데이터 필드 3개의 툴팁을 등록한다. 프로젝트 규칙상 필수다.

**Files:**
- Modify: `tools/editor/editor.js:162` (`FIELD_HELP`)

**Interfaces:**
- Consumes: Task 1~3에서 도입한 필드명 `requiresHiddenLocation`, `subLocationId`, `cinematicId`
- Produces: 없음

- [ ] **Step 1: 누락 검사로 현재 상태 확인**

Run: `node tools/editor/check-help-coverage.mjs`
Expected: 현재 상태 기록 (아이템 필드 전수 대조 스크립트이므로 이번 필드가 잡히지 않을 수 있다. 잡히지 않아도 규칙상 등록한다)

- [ ] **Step 2: 도움말 3줄 추가**

`tools/editor/editor.js`의 `FIELD_HELP` 객체에서 `fragmentOf` 항목 근처, 알파벳·주제 흐름을 해치지 않는 위치에 추가:

```js
  requiresHiddenLocation: '이 숨겨진 장소를 발견해야 노출되는 세부 장소입니다.',
  subLocationId:          '보상 지급을 위임할 세부 장소 ID. 지정하면 발견 즉시 지급을 건너뜁니다.',
  cinematicId:            '발견 시 재생할 컷씬 장면 ID.',
```

- [ ] **Step 3: 누락 검사 통과 확인**

Run: `node tools/editor/check-help-coverage.mjs`
Expected: exit 0

- [ ] **Step 4: 커밋**

```bash
git add tools/editor/editor.js
git commit -m "chore(editor): document new hidden location and sublocation fields"
```

---

### Task 9: 통합 확인

실제 플레이 경로로 전체 흐름을 확인한다.

**Files:** 없음 (검증 전용)

**Interfaces:**
- Consumes: Task 1~8 전체
- Produces: 없음

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev:web`

- [ ] **Step 2: 조건 강제 충족 후 발견 확인**

브라우저 콘솔에서:

```js
const GameState = (await import('/js/core/GameState.js')).default;
const HES = (await import('/js/systems/HiddenElementSystem.js')).default;
GameState.time.day = 61;
GameState.flags.totalKills = 12;
const frag = GameState.createCardInstance('map_fragment', { quantity: 1 });
GameState.placeCardInRow(frag.instanceId, 'bottom');
HES._checkHiddenLocations('dongjak');
```

확인 항목:
- 컷씬 「잊힌 지하」가 풀스크린으로 재생되고, 클릭하면 닫힌다
- 알림 2줄: 새 발견 문구 + "국립현충원 지하 벙커에 진입할 수 있게 되었다"
- **바닥에 아이템이 떨어지지 않는다** (보상이 세부장소로 위임되었으므로)

- [ ] **Step 3: 벙커 진입 확인**

국립현충원 랜드마크 카드를 클릭해 진입한 뒤 **상단 장소 행**을 본다.

`LandmarkModal`은 현재 도달 불가능하다 — `openLandmarkModal` 이벤트를 발행하는 코드가 프로젝트에 없고(`LandmarkModal.js:41`에 수신자만 존재), 랜드마크 진입은 전부 상단 카드 경로(`CardFactory.js:890` → `landmarkRequest` → `enterLandmark`)로 처리된다. 따라서 랜드마크 창이 아니라 상단 카드로 확인한다. 모달을 되살리는 일은 이번 범위 밖이며, 나중에 살아났을 때 벙커가 잠금 없이 노출되지 않도록 Task 1에서 필터는 미리 넣어 둔다.

확인 항목:
- 🚪 지하 벙커 카드가 상단 행에 보인다 (발견 전에는 없어야 한다 — 새 게임으로 재확인)
- 진입하면 「군용 통신 키트」가 지급된다
- 나갔다 다시 들어오면 통신 키트는 다시 주지 않고 일반 전리품만 나온다

- [ ] **Step 4: 비밀 이벤트 선택 확인**

Task 6 Step 6의 콘솔 스니펫으로 이벤트를 다시 띄우고, 통조림 3개를 보유한 상태와 아닌 상태에서 잠금이 바뀌는지 확인한다.

```js
const GameState = (await import('/js/core/GameState.js')).default;
const inst = GameState.createCardInstance('canned_food', { quantity: 3 });
GameState.placeCardInRow(inst.instanceId, 'bottom');
```

- [ ] **Step 5: 최종 검증**

Run: `npx vitest run`
Expected: PASS — 전체 통과, 실패 0

Run: `node js/data/validate.js`
Expected: 오류 없음

Run: `node tools/editor/check-help-coverage.mjs`
Expected: exit 0

- [ ] **Step 6: 결과 기록**

각 명령의 실제 출력(통과 개수, 종료 코드)을 기록한다. 실패가 있으면 원인과 함께 보고하고, 통과했다고 서술하지 않는다.

---

## 완료 기준

- [ ] 발견 전 국립현충원에 지하 벙커가 보이지 않는다
- [ ] 조건 충족 후 동작구 도착 시 컷씬이 재생되고 벙커가 나타난다
- [ ] 발견 순간에는 바닥에 아이템이 떨어지지 않는다
- [ ] 벙커 첫 진입 시 군용 통신 키트를 받고, 재진입 시에는 받지 않는다
- [ ] 세부장소가 연결되지 않은 나머지 24개 숨겨진 장소는 기존대로 발견 즉시 보상을 준다
- [ ] 비밀 이벤트 발생 시 선택지 창이 열리고, 물품이 부족한 선택지는 잠긴다
- [ ] 선택 결과 문구가 알림으로 표시된다
- [ ] 선택지 수량 조건 5건이 실제 소모량과 일치한다
- [ ] `npx vitest run` 전체 통과
- [ ] `node js/data/validate.js` 오류 없음
- [ ] `node tools/editor/check-help-coverage.mjs` exit 0
