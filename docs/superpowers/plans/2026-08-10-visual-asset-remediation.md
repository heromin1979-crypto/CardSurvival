# 시각 에셋 복구 및 UI 아이콘 1차 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 끊어진 이미지 참조와 캐릭터 엔딩 이미지 충돌을 복구하고 Chef 엔딩 3종, 핵심 세부 장소 8종, 영구 UI 아이콘 1차를 추가한다.

**Architecture:** 엔딩 이미지는 `characterId`와 `subEndingCode`를 모두 키로 사용하는 중첩 맵으로 바꾼다. 새 장소 일러스트는 기존 `assets/images/sublocations/<id>.png` 규칙을 유지한다. UI 아이콘은 CSS mask SVG로 구현하여 기존 색상 토큰을 그대로 쓴다.

**Tech Stack:** ES modules, Vitest 4, CSS custom properties, SVG, PNG, built-in image generation.

## Global Constraints

- UI 아이콘은 `assets/images/ui/icons/`의 단색 SVG이며 `currentColor`와 기존 CSS 토큰만 사용한다.
- 새 장면에는 읽을 수 있는 문구, 로고, 워터마크, UI를 넣지 않는다.
- `noSceneImage`는 대응 PNG가 존재하는 장소에서만 해제한다.
- 기존 아이템 카드 아트 및 데이터의 `def.icon`은 이번 범위에서 변경하지 않는다.
- 기존 작업 트리 변경은 수정·스테이징하지 않는다.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `js/data/endingImages.js` | 캐릭터/엔딩 코드별 이미지 메타데이터 |
| `js/screens/Ending.js`, `js/screens/EndingGallery.js` | 캐릭터 맥락을 전달해 엔딩 이미지 표시 |
| `js/ui/CombatUI.js` | 존재하는 기본 전투 배경 사용 |
| `assets/endings/chef_*.png` | Chef 활성 엔딩 3종 아트 |
| `assets/images/sublocations/*.png` | 우선순위 장소 장면 8종 |
| `js/data/landmarks.js` | 생성된 장면의 아이콘 폴백 해제 |
| `assets/images/ui/icons/*.svg`, `js/ui/UiIcon.js`, `css/ui.css` | CSS mask SVG 아이콘 시스템 |
| `js/screens/Main.js`, `js/screens/Basecamp.js`, `js/ui/CardFactory.js` | 영구 UI 고정 이모지 교체 |
| `tests/unit/EndingImages.test.js`, `tests/unit/SublocationSceneAssets.test.js`, `tests/unit/UiIcon.test.js` | 매핑·장면·아이콘 회귀 검증 |

### Task 1: 캐릭터별 엔딩 이미지 매핑 복구

**Files:**

- Create: `tests/unit/EndingImages.test.js`
- Modify: `js/data/endingImages.js`, `js/screens/Ending.js`, `js/screens/EndingGallery.js`

**Interfaces:**

- Produces: `getEndingImage(characterId, subEndingCode): { src: string, alt: string } | null`

- [ ] **Step 1: 실패하는 매핑 테스트를 작성한다.**

```js
import { describe, expect, it } from 'vitest';
import { getEndingImage } from '../../js/data/endingImages.js';

describe('character ending image lookup', () => {
  it('keeps identical ending codes scoped to their character', () => {
    expect(getEndingImage('doctor', 'a1_vaccine')?.src).toBe('assets/endings/doctor_a1_vaccine.png');
    expect(getEndingImage('firefighter', 'b3_escape')?.src).toBe('assets/endings/firefighter_b3_escape.png');
  });
  it('resolves active chef ending assets', () => {
    expect(getEndingImage('chef', 'a1_network')?.src).toBe('assets/endings/chef_a1_network.png');
    expect(getEndingImage('chef', 'a2_farm')?.src).toBe('assets/endings/chef_a2_farm.png');
    expect(getEndingImage('chef', 'b1_ascension')?.src).toBe('assets/endings/chef_b1_ascension.png');
  });
  it('returns null for an invalid pair', () => expect(getEndingImage('doctor', 'b3_escape')).toBeNull());
});
```

- [ ] **Step 2: 실패를 확인한다.**

Run: `npm.cmd test -- --run tests/unit/EndingImages.test.js`

Expected: FAIL. 현 함수는 한 인자만 받는다.

- [ ] **Step 3: 중첩 맵과 호출부를 구현한다.**

```js
export const ENDING_IMAGES = {
  doctor: { a1_vaccine: { src: 'assets/endings/doctor_a1_vaccine.png', alt: '의사가 백신 약병을 들어 보인다' } },
  firefighter: { b3_escape: { src: 'assets/endings/firefighter_b3_escape.png', alt: '소방관과 동료가 서울 외곽으로 걸어간다' } },
  chef: {
    a1_network: { src: 'assets/endings/chef_a1_network.png', alt: 'Chef가 식량 배급 거점에서 생존자에게 음식을 나눈다' },
    a2_farm: { src: 'assets/endings/chef_a2_farm.png', alt: 'Chef가 옥상 온실과 채소밭을 돌본다' },
    b1_ascension: { src: 'assets/endings/chef_b1_ascension.png', alt: 'Chef가 복원된 식당에서 식사를 차린다' },
  },
};

export function getEndingImage(characterId, subEndingCode) {
  if (!characterId || !subEndingCode) return null;
  return ENDING_IMAGES[characterId]?.[subEndingCode] ?? null;
}
```

기존 Soldier, Doctor, Firefighter, Homeless, Engineer의 메타데이터를 각 캐릭터 하위로 옮기고 `src`, `alt`, `prompt`를 보존한다. `Ending.js` 한 곳과 `EndingGallery.js` 두 곳을 `getEndingImage(ending.characterId, subEndingCode)` 호출로 바꾼다.

- [ ] **Step 4: 테스트를 통과시키고 커밋한다.**

Run: `npm.cmd test -- --run tests/unit/EndingImages.test.js tests/unit/CardImageMapping.test.js`

Expected: PASS.

```powershell
git add tests/unit/EndingImages.test.js js/data/endingImages.js js/screens/Ending.js js/screens/EndingGallery.js
git commit -m "fix: scope ending images by character"
```

### Task 2: 기본 전투 배경의 끊어진 참조 복구

**Files:**

- Create: `tests/unit/CombatUiFallbackAsset.test.js`
- Modify: `js/ui/CombatUI.js:880`

**Interfaces:**

- Consumes: `this._combatScene().backdrop`
- Produces: 기본값 `./assets/images/combat_jongno_subway_clean_v2.png`

- [ ] **Step 1: 실패하는 기본 배경 참조 테스트를 작성한다.**

```js
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const FALLBACK = './assets/images/combat_jongno_subway_clean_v2.png';

describe('combat fallback backdrop', () => {
  it('references an existing fallback asset instead of the removed subway file', () => {
    const source = readFileSync('js/ui/CombatUI.js', 'utf8');
    expect(existsSync(FALLBACK.slice(2))).toBe(true);
    expect(source).toContain(`?? '${FALLBACK}'`);
    expect(source).not.toContain("?? './assets/images/subway_ruined.jpg'");
  });
});
```

- [ ] **Step 2: 현재 파일 상태와 테스트 실패를 확인한다.**

Run: `Test-Path assets/images/subway_ruined.jpg; Test-Path assets/images/combat_jongno_subway_clean_v2.png; npm.cmd test -- --run tests/unit/CombatUiFallbackAsset.test.js`

Expected: `False`, `True`, then FAIL because the source still uses `subway_ruined.jpg`.

- [ ] **Step 3: 실제 존재하는 파일을 기본값으로 사용한다.**

```js
const battleBg = this._combatScene().backdrop
  ?? './assets/images/combat_jongno_subway_clean_v2.png';
```

- [ ] **Step 4: 검증하고 커밋한다.**

Run: `npm.cmd test -- --run tests/unit/CombatUiFallbackAsset.test.js tests/unit/CombatMotionManifest.test.js; node js/data/validate.js`

Expected: PASS, validator 오류 0건.

```powershell
git add tests/unit/CombatUiFallbackAsset.test.js js/ui/CombatUI.js
git commit -m "fix: use existing combat fallback backdrop"
```

### Task 3: Chef 엔딩 일러스트 3종 생성

**Files:**

- Create: `assets/endings/chef_a1_network.png`
- Create: `assets/endings/chef_a2_farm.png`
- Create: `assets/endings/chef_b1_ascension.png`

**Interfaces:**

- Consumes: Task 1의 Chef 파일 경로
- Produces: 1376×768 PNG 세 개

- [ ] **Step 1: `chef_a1_network.png`를 생성하고 검수한다.**

```text
Use case: illustration-story
Asset type: 1376×768 character-ending image for a browser survival card game.
Primary request: Korean male chef in a ruined Seoul emergency food-distribution hub, beside a hand-drawn supply route map and insulated food crates, survivors in an orderly queue.
Style/medium: mature Korean post-apocalyptic graphic novel, sharp ink outlines, restrained painterly shading.
Composition: wide 16:9; chef and crates within the central 70%.
Lighting: warm amber work lamps against a charcoal ruined interior, hopeful but sober.
Constraints: no readable letters, no signs, no logos, no UI, no watermark, no title text.
```

- [ ] **Step 2: `chef_a2_farm.png`를 생성하고 검수한다.**

```text
Use case: illustration-story
Asset type: 1376×768 character-ending image for a browser survival card game.
Primary request: the same Korean male chef tending a compact rooftop greenhouse and vegetable beds above ruined Seoul, practical irrigation barrels and a small community meal table.
Style/medium: mature Korean post-apocalyptic graphic novel, sharp ink outlines, restrained painterly shading.
Composition: wide 16:9; chef, greenhouse entrance, and plants inside the central 70%.
Lighting: muted dawn green and amber, quiet self-reliance.
Constraints: no readable letters, no signs, no logos, no UI, no watermark, no title text.
```

- [ ] **Step 3: `chef_b1_ascension.png`를 생성하고 검수한다.**

```text
Use case: illustration-story
Asset type: 1376×768 character-ending image for a browser survival card game.
Primary request: the same Korean male chef plating a refined emergency meal in a restored improvised Seoul hotel dining room, a small survivor community at candlelit tables, ruined city windows behind.
Style/medium: mature Korean post-apocalyptic graphic novel, sharp ink outlines, restrained painterly shading.
Composition: wide 16:9; chef, plated meal, and table inside the central 70%.
Lighting: charcoal industrial shadows and warm golden table light, dignified recovery.
Constraints: no readable letters, no signs, no logos, no UI, no watermark, no title text.
```

- [ ] **Step 4: 세 파일의 존재를 확인하고 커밋한다.**

Run: `Get-ChildItem assets/endings/chef_a1_network.png,assets/endings/chef_a2_farm.png,assets/endings/chef_b1_ascension.png | Select-Object Name,Length`

Expected: 세 파일 모두 0바이트가 아님.

```powershell
git add assets/endings/chef_a1_network.png assets/endings/chef_a2_farm.png assets/endings/chef_b1_ascension.png
git commit -m "feat: add chef ending illustrations"
```

### Task 4: 핵심 세부 장소 장면 8종 연결

**Files:**

- Create: `assets/images/sublocations/sl_jongno_royal_vault.png`, `sl_yongsan_armory.png`, `sl_gwangjin_zoo_lab.png`, `sl_seodaemun_p4_lab.png`
- Create: `assets/images/sublocations/sl_gwanak_reactor.png`, `sl_songpa_penthouse.png`, `sl_63_helipad.png`, `sl_gangseo_hangar.png`
- Create: `tests/unit/SublocationSceneAssets.test.js`
- Modify: `js/data/landmarks.js`

**Interfaces:**

- Consumes: `subLocationImage(def)`의 `assets/images/sublocations/${subLocationId}.png` 규칙
- Produces: 여덟 장소에서 `noSceneImage !== true`

- [ ] **Step 1: 실패하는 장면 검증을 작성한다.**

```js
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { LANDMARK_DATA } from '../../js/data/landmarks.js';

const IDS = ['sl_jongno_royal_vault', 'sl_yongsan_armory', 'sl_gwangjin_zoo_lab', 'sl_seodaemun_p4_lab', 'sl_gwanak_reactor', 'sl_songpa_penthouse', 'sl_63_helipad', 'sl_gangseo_hangar'];
const scenes = Object.values(LANDMARK_DATA).flatMap(x => x.subLocations ?? []).filter(x => IDS.includes(x.id));

describe('priority sublocation scene assets', () => {
  it('uses files instead of icon fallbacks', () => {
    expect(scenes).toHaveLength(8);
    for (const scene of scenes) {
      expect(scene.noSceneImage, scene.id).not.toBe(true);
      expect(existsSync(`assets/images/sublocations/${scene.id}.png`), scene.id).toBe(true);
    }
  });
});
```

- [ ] **Step 2: 실패를 확인한다.**

Run: `npm.cmd test -- --run tests/unit/SublocationSceneAssets.test.js`

Expected: FAIL. 여덟 장소가 이모지 폴백 상태다.

- [ ] **Step 3: 장면 8종을 생성한다.**

모든 프롬프트에 `wide 16:9, mature Korean post-apocalyptic graphic-novel, central subject inside the inner 70%, no readable text, logo, watermark, or UI`를 포함한다. 장면 주제는 차례로 왕실 금고, 미군기지 무기고, 동물 검역 연구소, P4 연구실, 연구용 원자로, 123층 펜트하우스, 63빌딩 헬리패드, 김포 격납고다. 각 생성 결과는 대응 파일명으로 저장하고 `view_image`로 카드 크롭·이미지 내 문구를 검수한다.

- [ ] **Step 4: 해당 여덟 장소의 `noSceneImage: true`만 제거한다.**

`hiddenLocations.js`의 `sl_63_helipad` 발견 카드 폴백은 별도 목적이므로 유지한다.

- [ ] **Step 5: 검증하고 커밋한다.**

Run: `npm.cmd test -- --run tests/unit/SublocationSceneAssets.test.js tests/unit/HiddenLocationWiring.test.js; node js/data/validate.js`

Expected: PASS, validator 오류 0건.

```powershell
git add assets/images/sublocations/sl_jongno_royal_vault.png assets/images/sublocations/sl_yongsan_armory.png assets/images/sublocations/sl_gwangjin_zoo_lab.png assets/images/sublocations/sl_seodaemun_p4_lab.png assets/images/sublocations/sl_gwanak_reactor.png assets/images/sublocations/sl_songpa_penthouse.png assets/images/sublocations/sl_63_helipad.png assets/images/sublocations/sl_gangseo_hangar.png js/data/landmarks.js tests/unit/SublocationSceneAssets.test.js
git commit -m "feat: add priority sublocation scenes"
```

### Task 5: 영구 UI 아이콘 1차를 SVG mask로 교체

**Files:**

- Create: `assets/images/ui/icons/{location,map,season,temperature,explore,quest,basecamp,weather,item,injury}.svg`
- Create: `js/ui/UiIcon.js`, `tests/unit/UiIcon.test.js`
- Modify: `css/ui.css`, `js/screens/Main.js`, `js/screens/Basecamp.js`, `js/systems/SeasonSystem.js`, `js/systems/WeatherSystem.js`, `js/ui/CardFactory.js`

**Interfaces:**

- Produces: `uiIcon(name, { className, label }): string`

- [ ] **Step 1: 실패하는 마크업 테스트를 작성한다.**

```js
import { describe, expect, it } from 'vitest';
import { uiIcon } from '../../js/ui/UiIcon.js';

describe('uiIcon', () => {
  it('renders a decorative semantic icon', () => {
    expect(uiIcon('location')).toBe('<span class="ui-icon ui-icon--location" aria-hidden="true"></span>');
  });
  it('renders an accessible labeled icon', () => {
    expect(uiIcon('temperature', { className: 'hud-icon', label: '온도' })).toBe('<span class="ui-icon ui-icon--temperature hud-icon" role="img" aria-label="온도"></span>');
  });
  it('rejects an unknown name', () => expect(() => uiIcon('unknown')).toThrow('Unknown UI icon: unknown'));
});
```

- [ ] **Step 2: 실패를 확인한다.**

Run: `npm.cmd test -- --run tests/unit/UiIcon.test.js`

Expected: FAIL. `UiIcon.js`가 없다.

- [ ] **Step 3: SVG, 마크업 생성기, CSS mask를 구현한다.**

각 SVG는 `viewBox="0 0 24 24"`, `fill="none"`, `stroke="black"`, `stroke-width="1.8"`를 사용한다.

```js
const UI_ICON_NAMES = new Set(['location', 'map', 'season', 'temperature', 'explore', 'quest', 'basecamp', 'weather', 'item', 'injury']);

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);
}

export function uiIcon(name, { className = '', label = '' } = {}) {
  if (!UI_ICON_NAMES.has(name)) throw new Error(`Unknown UI icon: ${name}`);
  const classes = ['ui-icon', `ui-icon--${name}`, className].filter(Boolean).join(' ');
  return label
    ? `<span class="${classes}" role="img" aria-label="${escapeHtml(label)}"></span>`
    : `<span class="${classes}" aria-hidden="true"></span>`;
}
```

```css
.ui-icon { display:inline-block; inline-size:1em; block-size:1em; background-color:currentColor; vertical-align:-0.13em; }
.ui-icon--location { -webkit-mask:url('../assets/images/ui/icons/location.svg') center / contain no-repeat; mask:url('../assets/images/ui/icons/location.svg') center / contain no-repeat; }
```

- [ ] **Step 4: 보드/거점의 고정 이모지를 치환한다.**

`Main.js`와 `Basecamp.js`의 위치·지도·계절·온도·베이스캠프·탐색·퀘스트를 `uiIcon()`으로 바꾼다. `CardFactory.js`는 세부 장소·환경의 고정 폴백 위치 아이콘, 범용 상자, 부상 표식만 바꾼다. `def.icon`, NPC 감정, 아이템 아트는 유지한다.

- [ ] **Step 5: 테스트·시각 검수·커밋을 수행한다.**

Run: `npm.cmd test -- --run tests/unit/UiIcon.test.js tests/unit/EndingImages.test.js tests/unit/SublocationSceneAssets.test.js; npm.cmd test`

Expected: PASS.

Run: `npm.cmd run dev:web -- --host 127.0.0.1`

Verify: 1920×1080 베이스캠프·탐색 보드·엔딩 갤러리·전투에서 아이콘이 텍스트 기준선에 맞고, 기본색이 `--text-secondary`이며, 깨진 이미지와 고정 HUD의 큰 컬러 이모지가 없다.

```powershell
git add assets/images/ui/icons css/ui.css js/ui/UiIcon.js js/screens/Main.js js/screens/Basecamp.js js/ui/CardFactory.js tests/unit/UiIcon.test.js
git commit -m "feat: add first-pass board ui icons"
```

## 계획 자체 검토

- 실제 누락 전투 배경, 엔딩 충돌, Chef 활성 엔딩 3종, 장소 1차 8종, UI 1차 아이콘이 Task 1~5에 각각 대응한다.
- 남은 24개 장소와 전투·장비·동료 모달의 전체 아이콘은 명세의 제외 범위를 유지한다.
- 이후 작업이 사용하는 인터페이스는 `getEndingImage(characterId, subEndingCode)`와 `uiIcon(name, options)`로 일관되게 정의했다.
- `TODO`, `TBD`, 모호한 후속 구현 지시는 사용하지 않았다.
