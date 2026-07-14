# Crafting Workbench High-Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 제작 모달을 샘플의 촘촘한 3열 워크벤치와 카테고리별 황동색 설계도 이미지로 재현하면서 기존 제작 기능을 유지한다.

**Architecture:** `CraftUI.js`가 청사진 카테고리를 대표 PNG 경로로 매핑하고 기존 제작 데이터를 중앙 콜아웃과 오른쪽 단계 패널에 공급한다. 제작 로직은 `CraftSystem`을 변경하지 않으며, 모달 전용 CSS와 통합 테스트로 표현 계층만 확장한다.

**Tech Stack:** Vanilla JavaScript ES modules, CSS, Vitest + jsdom, Playwright, built-in image generation + chroma-key removal

## Global Constraints

- 대상 카테고리는 `weapon`, `armor`, `tool`, `structure`, `food`, `medical`, `material`, `upgrade`, `consumable` 9개다.
- 이미지에는 글자, 로고, 워터마크를 넣지 않는다.
- 기존 검색, 정렬, 상태 필터, 목록 스크롤, `CraftSystem.startBlueprint()` 경로를 유지한다.
- 기준 화면은 1920x1080이며 가로와 세로 오버플로가 없어야 한다.
- 개별 아이템 전용 설계도 생성과 `CraftSystem` 변경은 범위 밖이다.

---

### Task 1: 카테고리 대표 설계도 자산

**Files:**
- Create: `assets/images/ui/crafting-blueprints/weapon.png`
- Create: `assets/images/ui/crafting-blueprints/armor.png`
- Create: `assets/images/ui/crafting-blueprints/tool.png`
- Create: `assets/images/ui/crafting-blueprints/structure.png`
- Create: `assets/images/ui/crafting-blueprints/food.png`
- Create: `assets/images/ui/crafting-blueprints/medical.png`
- Create: `assets/images/ui/crafting-blueprints/material.png`
- Create: `assets/images/ui/crafting-blueprints/upgrade.png`
- Create: `assets/images/ui/crafting-blueprints/consumable.png`

**Interfaces:**
- Consumes: 각 제작 청사진의 `bp.category` 문자열
- Produces: `assets/images/ui/crafting-blueprints/<category>.png` 투명 PNG 9개

- [ ] **Step 1: 생성 프롬프트를 카테고리별로 확정**

공통 프롬프트:

```text
Use case: stylized-concept
Asset type: survival game crafting blueprint overlay
Primary request: Create a precise technical blueprint line drawing of <SUBJECT> assembled from scavenged post-apocalyptic materials.
Style/medium: realistic industrial engineering sketch, thin brass and burnt-orange contour lines, fine mechanical detail, orthographic three-quarter view
Composition/framing: one centered object filling 72 percent of a 3:2 landscape canvas, generous clean margin for UI callout labels
Lighting/mood: no lighting or shading, line art only
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background
Constraints: crisp separated contours, no text, no numbers, no logo, no watermark, no cast shadow, no reflection, do not use green in the subject
Avoid: cartoon icon, emoji, photorealistic background, UI frame, labels, handwriting
```

`<SUBJECT>` 값은 다음을 사용한다.

```text
weapon: a compact improvised tactical crossbow
armor: a reinforced scavenger body armor vest
tool: a rugged multipurpose hand tool and field repair kit
structure: a modular survivor workbench shelter frame
food: a sealed field ration cooking set
medical: an emergency trauma kit with bandages and instruments
material: bundled wood, cloth, wire and scrap metal components
upgrade: a precision weapon upgrade assembly with scope and reinforced parts
consumable: a compact smoke bomb and utility canister assembly
```

- [ ] **Step 2: built-in image generation으로 9개 원본 생성**

각 프롬프트를 별도 호출하고 생성 결과를 `tmp/imagegen/crafting-blueprints/<category>-chroma.png`로 복사한다. 한 호출에서 서로 다른 카테고리를 묶지 않는다.

- [ ] **Step 3: 크로마키를 투명 PNG로 변환**

각 카테고리에 다음 명령을 실행한다.

```powershell
python "$env:USERPROFILE\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py" --input "tmp/imagegen/crafting-blueprints/<category>-chroma.png" --out "assets/images/ui/crafting-blueprints/<category>.png" --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

Expected: 9개 파일이 RGBA PNG로 생성되고 네 모서리 alpha 값이 0이다.

- [ ] **Step 4: 자산 규격 검증**

```powershell
node -e "const fs=require('fs');const p='assets/images/ui/crafting-blueprints';const cats=['weapon','armor','tool','structure','food','medical','material','upgrade','consumable'];const missing=cats.filter(x=>!fs.existsSync(`${p}/${x}.png`));console.log(JSON.stringify({count:cats.length-missing.length,missing}));process.exitCode=missing.length?1:0"
```

Expected: `{"count":9,"missing":[]}`

- [ ] **Step 5: 자산 커밋**

```powershell
git add assets/images/ui/crafting-blueprints
git commit -m "feat(craft): add category blueprint artwork"
```

### Task 2: 이미지 매핑과 실제 제작 상태 연결

**Files:**
- Modify: `tests/integration/CraftWorkbench.int.test.js`
- Modify: `js/ui/CraftUI.js`

**Interfaces:**
- Consumes: `bp.category`, `bp.stages`, `GameState.crafting.activeQueue`, `CraftSystem.getQueueProgress()`
- Produces: `CRAFT_BLUEPRINT_IMAGES`, `_blueprintImage(category) -> string`, `.spec-figure-img`, 동적 `.craft-stage-header-main`

- [ ] **Step 1: 실패하는 통합 테스트 작성**

`tests/integration/CraftWorkbench.int.test.js`에 다음 검증을 추가한다.

```js
it('maps every crafting category to blueprint artwork', () => {
  CraftUI.render();
  const image = document.querySelector('.spec-figure-img');
  expect(image).not.toBeNull();
  expect(image.getAttribute('src')).toMatch(/^assets\/images\/ui\/crafting-blueprints\/(weapon|armor|tool|structure|food|medical|material|upgrade|consumable)\.png$/);
});

it('uses a stages header until every stage is complete', () => {
  CraftUI.render();
  expect(document.querySelector('.craft-stage-header-main')?.textContent)
    .toContain('CRAFTING STAGES');
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```powershell
node node_modules/vitest/vitest.mjs run tests/integration/CraftWorkbench.int.test.js
```

Expected: `.spec-figure-img` 부재 또는 헤더 문자열 차이로 FAIL.

- [ ] **Step 3: 카테고리 이미지 매핑 구현**

`js/ui/CraftUI.js` 모듈 상단에 다음 상수를 추가한다.

```js
const CRAFT_BLUEPRINT_IMAGES = Object.freeze({
  weapon: 'assets/images/ui/crafting-blueprints/weapon.png',
  armor: 'assets/images/ui/crafting-blueprints/armor.png',
  tool: 'assets/images/ui/crafting-blueprints/tool.png',
  structure: 'assets/images/ui/crafting-blueprints/structure.png',
  food: 'assets/images/ui/crafting-blueprints/food.png',
  medical: 'assets/images/ui/crafting-blueprints/medical.png',
  material: 'assets/images/ui/crafting-blueprints/material.png',
  upgrade: 'assets/images/ui/crafting-blueprints/upgrade.png',
  consumable: 'assets/images/ui/crafting-blueprints/consumable.png',
});
```

`_renderSpecSheet(bp)`의 이모지 figure를 다음 이미지로 교체한다.

```js
<img class="spec-figure-img"
     src="${CRAFT_BLUEPRINT_IMAGES[bp.category] ?? CRAFT_BLUEPRINT_IMAGES.tool}"
     alt="">
```

- [ ] **Step 4: 단계 헤더를 실제 상태로 계산**

`_renderStagePanel(bp)`에서 다음 값을 계산해 헤더에 사용한다.

```js
const stageProgress = queueEntry ? CraftSystem.getQueueProgress(queueEntry) : 0;
const allDone = Boolean(queueEntry) && (bp.stages ?? []).length > 0
  && (bp.stages ?? []).every((_, idx) => (
    idx < queueEntry.stageIndex
    || (idx === queueEntry.stageIndex && !queueEntry.awaitingNext && stageProgress >= 1)
  ));
const header = allDone
  ? 'CRAFTING COMPLETE / 제작 완료'
  : 'CRAFTING STAGES / 제작 단계';
```

DOM은 다음 값을 출력한다.

```js
<span class="craft-stage-header-main">${header}</span>
```

- [ ] **Step 5: 통합 테스트와 구문 검사**

```powershell
node node_modules/vitest/vitest.mjs run tests/integration/CraftWorkbench.int.test.js
node --check js/ui/CraftUI.js
```

Expected: 통합 테스트 전부 PASS, 구문 검사 exit code 0.

- [ ] **Step 6: 기능 커밋**

```powershell
git add js/ui/CraftUI.js tests/integration/CraftWorkbench.int.test.js
git commit -m "feat(craft): connect blueprint artwork to workbench"
```

### Task 3: 목록 밀도와 샘플 비율 정밀 조정

**Files:**
- Modify: `css/screens-game.css`
- Modify: `tests/integration/CraftWorkbench.int.test.js`
- Create: `outputs/craft-workbench-high-fidelity.png`

**Interfaces:**
- Consumes: Task 2의 `.spec-figure-img`, 기존 `.blueprint-item`, `.bp-item-icon`, `.craft-stage-step`
- Produces: 1920x1080에서 촘촘한 목록과 샘플 비율을 갖는 제작 모달

- [ ] **Step 1: 구조 회귀 검증 추가**

```js
it('renders the dense sample-style list structure', () => {
  CraftUI.render();
  expect(document.querySelector('.blueprint-list')).not.toBeNull();
  expect(document.querySelectorAll('.blueprint-item').length).toBeGreaterThan(5);
  expect(document.querySelector('.blueprint-item .bp-item-icon')).not.toBeNull();
  expect(document.querySelector('.blueprint-item .bp-mat-row')).not.toBeNull();
});
```

- [ ] **Step 2: 목록과 3열 CSS 수정**

`css/screens-game.css`의 `.craft-workbench--spec` 규칙을 다음 기준으로 조정한다.

```css
.craft-workbench--spec {
  grid-template-columns: minmax(360px, 23%) minmax(720px, 1fr) minmax(390px, 25%);
  gap: 14px;
}

.craft-workbench--spec .blueprint-list {
  padding: 2px 5px 10px 0;
  gap: 3px;
}

.craft-workbench--spec .blueprint-item {
  height: 66px;
  min-height: 66px;
  padding: 5px 9px;
  border-left-width: 6px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.craft-workbench--spec .bp-item-icon {
  width: 42px;
  height: 42px;
  flex-basis: 42px;
  font-size: 27px;
}

.craft-workbench--spec .blueprint-name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  font-size: 16px;
}
```

중앙 이미지에는 다음 가시성 규칙을 적용한다.

```css
.craft-workbench--spec .spec-figure-img {
  width: min(72%, 680px);
  max-width: none;
  max-height: 78%;
  opacity: 0.94;
  filter: drop-shadow(0 0 2px #ffd09a) drop-shadow(0 0 14px rgba(224,138,78,.5));
}
```

- [ ] **Step 3: 통합 테스트 실행**

```powershell
node node_modules/vitest/vitest.mjs run tests/integration/CraftWorkbench.int.test.js
```

Expected: 전부 PASS.

- [ ] **Step 4: 1920x1080 Playwright 캡처와 치수 검사**

개발 서버를 실행하고 제작 모달을 연 뒤 다음 값을 평가한다.

```js
const result = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.blueprint-item')];
  const list = document.querySelector('.blueprint-list');
  const first = items[0]?.getBoundingClientRect();
  const second = items[1]?.getBoundingClientRect();
  return {
    itemHeight: first?.height,
    itemGap: first && second ? second.top - first.bottom : null,
    visibleItems: items.filter(el => el.getBoundingClientRect().bottom <= list.getBoundingClientRect().bottom).length,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    blueprintLoaded: document.querySelector('.spec-figure-img')?.complete === true,
  };
});
```

Expected: `itemHeight` 64-68, `itemGap` 2-4, `visibleItems >= 10`, `overflowX=false`, `overflowY=false`, `blueprintLoaded=true`.

스크린샷을 `outputs/craft-workbench-high-fidelity.png`로 저장한다.

- [ ] **Step 5: 샘플과 시각 비교 후 단일 조정 반복**

`제작대_샘플.png`와 결과를 나란히 보고 목록 밀도, 중앙 이미지 점유율, 오른쪽 단계 카드 높이 중 가장 큰 차이 하나만 수정한 뒤 Step 3과 Step 4를 다시 실행한다.

- [ ] **Step 6: 최종 커밋**

```powershell
git add css/screens-game.css tests/integration/CraftWorkbench.int.test.js
git commit -m "style(craft): match dense blueprint workbench layout"
```

### Task 4: 최종 회귀 검증

**Files:**
- Verify: `js/ui/CraftUI.js`
- Verify: `js/screens/Basecamp.js`
- Verify: `js/screens/Main.js`
- Verify: `tests/integration/CraftWorkbench.int.test.js`

**Interfaces:**
- Consumes: Tasks 1-3의 최종 자산, DOM, CSS
- Produces: 검증 결과와 최종 스크린샷

- [ ] **Step 1: 관련 테스트와 구문 검사 실행**

```powershell
node node_modules/vitest/vitest.mjs run tests/integration/CraftWorkbench.int.test.js
node --check js/ui/CraftUI.js
node --check js/screens/Basecamp.js
node --check js/screens/Main.js
```

Expected: 테스트 전부 PASS, 모든 구문 검사 exit code 0.

- [ ] **Step 2: 최종 상태 확인**

```powershell
git status --short --branch
git diff --stat HEAD~3
```

Expected: 현재 브랜치가 `codex-crafting-window-sample-ui`이고 `.claude/settings.local.json`은 기존 미추적 상태로 보존된다.
