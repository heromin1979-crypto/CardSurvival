# 전투 모션 라이브러리화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 애니메이션 툴에서 저장한 모션 메타(cols/rows/rowFrames/frameDur)를 게임이 부팅 시 자동 로드하고, 에디터 작업본(.anim.json)을 서버 라이브러리에 저장·자동 복원한다.

**Architecture:** 에디터 오버라이드는 새 파일 `assets/images/combat/spritesheets/motionLibrary.json`(시트 파일명 키)에 기록한다 — `manifest.json`은 `tools/export_combat_motion_manifest.mjs --check`가 JS 레지스트리와의 일치를 강제하는 export 산출물이므로 절대 건드리지 않는다. 게임은 부팅 시 이 파일을 fetch해 기존 `applyCombatSpriteManifest()`로 병합한다. 서버 로직은 CJS 공용 모듈 2개(`tools/motionLibraryStore.cjs`, `tools/animProjectStore.cjs`)로 추출해 `serve.js`(CJS)와 `tools/sprite-anim-server.mjs`(ESM — Node는 CJS named import 지원)가 공유하고, vitest로 직접 테스트한다.

**Tech Stack:** 바닐라 JS(브라우저 ESM), Node 내장 모듈만 사용하는 zero-dep 서버, vitest.

## Global Constraints

- `assets/images/combat/spritesheets/manifest.json` 무변경 — `node tools/export_combat_motion_manifest.mjs --check`가 계속 통과해야 한다 (`tests/unit/CombatSpriteSheetAssets.test.js:253`이 실행).
- 주석은 Why만, 메타데이터·이모지·단계번호 금지 (`.claude/rules/coding-principles.md`).
- 커밋은 관련 파일만 명시적으로 add (`git add -A` 금지).
- 에디터 프로젝트 저장 위치: `art_sources/combat/anim_projects/<시트파일명>.anim.json` (게임 빌드 미포함).
- motionLibrary 키는 시트 파일 basename(예: `doctor_f_sheet.png`) — `applyCombatSpriteManifest`의 조회 키 `sheet.src.split('/').pop()`과 일치해야 한다.
- 응답/문서는 한글.

---

### Task 1: motionLibraryStore.cjs — 시트 메타 기록 모듈 (frameDur 유실 버그 수정 포함)

**Files:**
- Create: `tools/motionLibraryStore.cjs`
- Test: `tests/unit/MotionLibraryStore.test.js`

**Interfaces:**
- Produces: `mergeMotionLibrary(sheetDir: string, targetPngPath: string, meta: {cols, rows?, rowFrames?, frameDur?} | null | undefined) → { libraryPath, name, entry } | null`, `LIBRARY_FILENAME = 'motionLibrary.json'`. Task 2의 두 서버가 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/MotionLibraryStore.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeMotionLibrary, LIBRARY_FILENAME } from '../../tools/motionLibraryStore.cjs';

describe('motionLibraryStore', () => {
  let sheetDir;
  beforeEach(() => { sheetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motionlib-')); });
  afterEach(() => { fs.rmSync(sheetDir, { recursive: true, force: true }); });

  it('meta가 없거나 cols가 0이면 null을 반환하고 파일을 만들지 않는다', () => {
    expect(mergeMotionLibrary(sheetDir, path.join(sheetDir, 'a_sheet.png'), null)).toBeNull();
    expect(mergeMotionLibrary(sheetDir, path.join(sheetDir, 'a_sheet.png'), { cols: 0 })).toBeNull();
    expect(fs.existsSync(path.join(sheetDir, LIBRARY_FILENAME))).toBe(false);
  });

  it('cols/rows/rowFrames/frameDur를 시트 파일명 키로 기록한다', () => {
    const meta = { cols: 6, rows: 4, rowFrames: [6, 6, 4, 5], frameDur: [[100, 100, 100, 100, 100, 100]] };
    const result = mergeMotionLibrary(sheetDir, path.join(sheetDir, 'zombie_sheet.png'), meta);
    expect(result.name).toBe('zombie_sheet.png');
    const saved = JSON.parse(fs.readFileSync(path.join(sheetDir, LIBRARY_FILENAME), 'utf8'));
    expect(saved['zombie_sheet.png']).toEqual({
      cols: 6, rows: 4, rowFrames: [6, 6, 4, 5], frameDur: [[100, 100, 100, 100, 100, 100]],
    });
  });

  it('_src.png 저장도 게임 시트 파일명 키로 정규화한다', () => {
    const result = mergeMotionLibrary(sheetDir, path.join(sheetDir, 'doctor_f_sheet_src.png'), { cols: 6, rows: 8 });
    expect(result.name).toBe('doctor_f_sheet.png');
  });

  it('기존 항목을 보존하며 병합하고 manifest.json은 만들지 않는다', () => {
    mergeMotionLibrary(sheetDir, path.join(sheetDir, 'a_sheet.png'), { cols: 6, rows: 4 });
    mergeMotionLibrary(sheetDir, path.join(sheetDir, 'b_sheet.png'), { cols: 5, rows: 8 });
    const saved = JSON.parse(fs.readFileSync(path.join(sheetDir, LIBRARY_FILENAME), 'utf8'));
    expect(Object.keys(saved).sort()).toEqual(['a_sheet.png', 'b_sheet.png']);
    expect(fs.existsSync(path.join(sheetDir, 'manifest.json'))).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/MotionLibraryStore.test.js`
Expected: FAIL — `Cannot find module '../../tools/motionLibraryStore.cjs'`

- [ ] **Step 3: 구현**

`tools/motionLibraryStore.cjs`:

```js
const fs = require('node:fs');
const path = require('node:path');

const LIBRARY_FILENAME = 'motionLibrary.json';

// 에디터가 저장하는 시트 메타(cols/rows/rowFrames/frameDur)를 시트 파일명 키로 병합 기록한다.
// manifest.json은 export_combat_motion_manifest.mjs --check의 drift 검사 대상이라 별도 파일을 쓴다.
function mergeMotionLibrary(sheetDir, targetPngPath, meta) {
  if (!meta || !(Number(meta.cols) > 0)) return null;
  const libraryPath = path.join(sheetDir, LIBRARY_FILENAME);
  let library = {};
  try { library = JSON.parse(fs.readFileSync(libraryPath, 'utf8')); } catch (e) { /* 신규 파일 */ }
  const name = path.basename(targetPngPath).replace(/_src\.png$/i, '.png');
  library[name] = {
    cols: Number(meta.cols),
    rows: Number(meta.rows) || 4,
    ...(Array.isArray(meta.rowFrames) ? { rowFrames: meta.rowFrames } : {}),
    ...(Array.isArray(meta.frameDur) ? { frameDur: meta.frameDur } : {}),
  };
  fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));
  return { libraryPath, name, entry: library[name] };
}

module.exports = { mergeMotionLibrary, LIBRARY_FILENAME };
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/unit/MotionLibraryStore.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add tools/motionLibraryStore.cjs tests/unit/MotionLibraryStore.test.js
git commit -m "feat(tools): add motion library store with frameDur persistence"
```

---

### Task 2: 두 서버의 save-sheet를 motionLibrary.json 기록으로 전환

**Files:**
- Modify: `serve.js` (require 추가 + `/api/save-sheet` 내 manifest 블록 교체, 약 313~326행)
- Modify: `tools/sprite-anim-server.mjs` (import 추가 + `handleSaveSheet` 내 manifest 블록 교체, 약 166~181행)
- Modify: `tools/sprite-anim-editor.html` (안내문·토스트 문구 2곳)

**Interfaces:**
- Consumes: Task 1의 `mergeMotionLibrary(sheetDir, targetPngPath, meta)`.
- Produces: `/api/save-sheet` 응답의 `manifest` 필드 의미가 "라이브러리 기록됨"으로 변경(필드명은 에디터 호환을 위해 유지).

- [ ] **Step 1: serve.js 수정**

상단 require 블록(`const { exec, execFile } = require('child_process');` 아래)에 추가:

```js
const { mergeMotionLibrary } = require('./tools/motionLibraryStore.cjs');
```

`/api/save-sheet` 핸들러에서 아래 기존 블록을:

```js
      fs.writeFileSync(target, buf);
      let manifestWritten = false;
      if (body.meta && Number(body.meta.cols) > 0) {
        const manifestPath = path.join(sheetDir, 'manifest.json');
        let manifest = {};
        try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (e) { /* new */ }
        const name = path.basename(target).replace(/_src\.png$/i, '.png');
        manifest[name] = {
          cols: Number(body.meta.cols),
          rows: Number(body.meta.rows) || 4,
          ...(Array.isArray(body.meta.rowFrames) ? { rowFrames: body.meta.rowFrames } : {}),
        };
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        manifestWritten = true;
      }
```

다음으로 교체:

```js
      fs.writeFileSync(target, buf);
      let manifestWritten = false;
      try { manifestWritten = !!mergeMotionLibrary(sheetDir, target, body.meta); }
      catch (e) { /* 라이브러리 기록 실패가 시트 저장을 막지 않도록 */ }
```

- [ ] **Step 2: tools/sprite-anim-server.mjs 수정**

상단 import 블록에 추가 (Node ESM은 CJS named import를 지원한다):

```js
import { mergeMotionLibrary } from './motionLibraryStore.cjs';
```

`handleSaveSheet`에서 아래 기존 블록을:

```js
    // Merge frame-count metadata into the manifest the game reads (keyed by in-game basename).
    let manifestPath = null;
    if (body?.meta && Number(body.meta.cols) > 0) {
      manifestPath = join(SHEET_DIR, 'manifest.json');
      let manifest = {};
      try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* new manifest */ }
      const name = basename(target).replace(/_src\.png$/i, '.png');
      manifest[name] = {
        cols: Number(body.meta.cols),
        rows: Number(body.meta.rows) || 4,
        ...(Array.isArray(body.meta.rowFrames) ? { rowFrames: body.meta.rowFrames } : {}),
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`[sprite-anim] manifest: ${name} → cols ${manifest[name].cols}`);
    }
    sendJson(res, 200, { ok: true, bytes: buf.length, path: '/' + relative(ROOT, target).split('\\').join('/'), manifest: manifestPath ? true : false });
```

다음으로 교체:

```js
    let libraryWritten = false;
    try {
      const merged = mergeMotionLibrary(SHEET_DIR, target, body?.meta);
      if (merged) { libraryWritten = true; console.log(`[sprite-anim] library: ${merged.name} → cols ${merged.entry.cols}`); }
    } catch (e) { console.warn('[sprite-anim] library write failed:', e.message); }
    sendJson(res, 200, { ok: true, bytes: buf.length, path: '/' + relative(ROOT, target).split('\\').join('/'), manifest: libraryWritten });
```

`readFile` import가 이 파일의 다른 곳(정적 서빙)에서 여전히 쓰이므로 import 정리는 하지 않는다.

- [ ] **Step 3: 에디터 문구 갱신 (tools/sprite-anim-editor.html)**

사이 텀 카드 힌트(약 190행)의 `저장 시 <code>manifest.frameDur</code>로 기록돼` 를 `저장 시 <code>motionLibrary.json</code>에 기록돼` 로 변경.

`saveToServer()`의 토스트(약 860행) `', manifest 갱신'` 을 `', 라이브러리 갱신'` 으로 변경.

- [ ] **Step 4: 검증**

Run: `npx vitest run tests/unit/MotionLibraryStore.test.js && node tools/export_combat_motion_manifest.mjs --check && node -e "require('./tools/motionLibraryStore.cjs')" && node --check serve.js`
Expected: 테스트 PASS, `combat motion manifest is up to date`, 문법 오류 없음.

- [ ] **Step 5: 커밋**

```bash
git add serve.js tools/sprite-anim-server.mjs tools/sprite-anim-editor.html
git commit -m "fix(tools): persist editor frameDur to motionLibrary.json instead of manifest"
```

---

### Task 3: 런타임 로더 motionLibraryLoader.js

**Files:**
- Create: `js/ui/combat/motionLibraryLoader.js`
- Test: `tests/unit/MotionLibraryLoader.test.js`

**Interfaces:**
- Consumes: `applyCombatSpriteManifest(manifest)` (`js/ui/combat/combatUiAssets.js:62`) — `{ok, errors}` 반환, cols/rows/frameDur/motions/aliases 병합 + keyframe 재주입.
- Produces: `loadCombatMotionLibrary(fetchImpl?) → Promise<{ok: boolean, reason?: string, errors?: string[]}>`, `MOTION_LIBRARY_URL`. Task 4의 main.js가 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/MotionLibraryLoader.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { loadCombatMotionLibrary, MOTION_LIBRARY_URL } from '../../js/ui/combat/motionLibraryLoader.js';
import { COMBAT_SPRITE_SHEETS } from '../../js/ui/combat/combatUiAssets.js';

describe('motionLibraryLoader', () => {
  it('fetch 성공 시 라이브러리를 COMBAT_SPRITE_SHEETS에 적용한다', async () => {
    const frameDur = [[120, 120, 120, 120, 120, 300]];
    const library = { 'doctor_f_sheet.png': { cols: 6, rows: 8, frameDur } };
    const fetchImpl = async (url) => {
      expect(url).toBe(MOTION_LIBRARY_URL);
      return { ok: true, json: async () => library };
    };
    const result = await loadCombatMotionLibrary(fetchImpl);
    expect(result.ok).toBe(true);
    expect(COMBAT_SPRITE_SHEETS.doctor_f.frameDur).toEqual(frameDur);
  });

  it('HTTP 실패(404) 시 기본값을 유지하고 ok:false를 반환한다', async () => {
    const before = COMBAT_SPRITE_SHEETS.soldier_m.cols;
    const result = await loadCombatMotionLibrary(async () => ({ ok: false, status: 404 }));
    expect(result.ok).toBe(false);
    expect(COMBAT_SPRITE_SHEETS.soldier_m.cols).toBe(before);
  });

  it('fetch 예외를 삼키고 ok:false를 반환한다 (부팅 비차단)', async () => {
    const result = await loadCombatMotionLibrary(async () => { throw new Error('network down'); });
    expect(result.ok).toBe(false);
  });

  it('fetch 미지원 환경이면 ok:false를 반환한다', async () => {
    const result = await loadCombatMotionLibrary(null);
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/MotionLibraryLoader.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`js/ui/combat/motionLibraryLoader.js`:

```js
import { applyCombatSpriteManifest } from './combatUiAssets.js';

// 모든 배포 환경(Electron 로컬 HTTP·Vite dev·Capacitor)이 HTTP 기반이라 상대경로 fetch가 동작한다.
export const MOTION_LIBRARY_URL = 'assets/images/combat/spritesheets/motionLibrary.json';

// 에디터가 저장한 모션 오버라이드를 부팅 시 1회 적용한다.
// 파일 없음·네트워크 오류·검증 실패 모두 조용히 기본값(JS 레지스트리)으로 폴백한다.
export async function loadCombatMotionLibrary(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'no-fetch' };
  try {
    const res = await fetchImpl(MOTION_LIBRARY_URL, { cache: 'no-cache' });
    if (!res || !res.ok) return { ok: false, reason: 'http' };
    const library = await res.json();
    const applied = applyCombatSpriteManifest(library);
    if (!applied.ok) return { ok: false, reason: 'invalid', errors: applied.errors };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'error' };
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/unit/MotionLibraryLoader.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/ui/combat/motionLibraryLoader.js tests/unit/MotionLibraryLoader.test.js
git commit -m "feat(combat): add runtime motion library loader"
```

---

### Task 4: 부팅 연결 — main.js에서 라이브러리 로드

**Files:**
- Modify: `js/main.js` (import 1줄 + 부팅 경로 2곳, 약 688~713행)

**Interfaces:**
- Consumes: Task 3의 `loadCombatMotionLibrary()`.

- [ ] **Step 1: main.js 수정**

상단 import 구역(`import CombatUI from './ui/CombatUI.js';` 근처)에 추가:

```js
import { loadCombatMotionLibrary } from './ui/combat/motionLibraryLoader.js';
```

부팅 경로 2곳(DOMContentLoaded 리스너와 else 분기 — 둘 다 `await initPurchaseManager();`와 `init();` 사이)에 동일하게 추가:

```js
      await loadCombatMotionLibrary();
```

로더는 절대 throw하지 않으므로 기존 try/catch 오류 화면 흐름에 영향이 없다.

- [ ] **Step 2: 검증**

Run: `npx vitest run && node tools/export_combat_motion_manifest.mjs --check`
Expected: 전체 테스트 PASS, manifest up to date.

- [ ] **Step 3: 커밋**

```bash
git add js/main.js
git commit -m "feat(combat): load motion library at boot"
```

---

### Task 5: animProjectStore.cjs — 에디터 프로젝트 저장소 모듈

**Files:**
- Create: `tools/animProjectStore.cjs`
- Test: `tests/unit/AnimProjectStore.test.js`

**Interfaces:**
- Produces: `listProjects(root) → [{name, sheetPath, mtimeMs}]`, `readProject(root, name) → object | null`, `writeProject(root, name, project) → {name, path}` (잘못된 입력은 throw), `PROJECT_SUBDIR = path.join('art_sources', 'combat', 'anim_projects')`. Task 6의 두 서버가 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/AnimProjectStore.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listProjects, readProject, writeProject } from '../../tools/animProjectStore.cjs';

describe('animProjectStore', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'animproj-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('저장 후 같은 이름으로 다시 읽을 수 있다', () => {
    const project = { v: 3, path: '/assets/images/combat/spritesheets/doctor_f_sheet.png', cols: 6 };
    const saved = writeProject(root, 'doctor_f_sheet.anim.json', project);
    expect(saved.name).toBe('doctor_f_sheet.anim.json');
    expect(readProject(root, 'doctor_f_sheet.anim.json')).toEqual(project);
  });

  it('목록에 이름·시트 경로·수정시각을 반환한다', () => {
    writeProject(root, 'a_sheet.anim.json', { path: '/assets/a.png' });
    writeProject(root, 'b_sheet.anim.json', { path: '/assets/b.png' });
    const list = listProjects(root);
    expect(list.map((p) => p.name)).toEqual(['a_sheet.anim.json', 'b_sheet.anim.json']);
    expect(list[0].sheetPath).toBe('/assets/a.png');
    expect(list[0].mtimeMs).toBeGreaterThan(0);
  });

  it('경로 탈출·비정상 이름을 거부한다', () => {
    expect(() => writeProject(root, '../evil.anim.json', {})).toThrow();
    expect(() => writeProject(root, 'a/b.anim.json', {})).toThrow();
    expect(() => writeProject(root, 'x.json', {})).toThrow();
    expect(readProject(root, '../evil.anim.json')).toBeNull();
  });

  it('없는 프로젝트는 null, 빈 디렉터리는 빈 목록', () => {
    expect(readProject(root, 'none_sheet.anim.json')).toBeNull();
    expect(listProjects(root)).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/AnimProjectStore.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`tools/animProjectStore.cjs`:

```js
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_SUBDIR = path.join('art_sources', 'combat', 'anim_projects');
// 시트 파일명 유래 이름만 허용 — 경로 구분자·상위 탈출 차단
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*\.anim\.json$/;

function projectDir(root) { return path.join(root, PROJECT_SUBDIR); }

function safeName(name) {
  const n = String(name || '');
  return NAME_RE.test(n) && !n.includes('..') ? n : null;
}

function listProjects(root) {
  const dir = projectDir(root);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.anim.json'))
    .map((f) => {
      const file = path.join(dir, f);
      let sheetPath = null;
      try { sheetPath = JSON.parse(fs.readFileSync(file, 'utf8')).path || null; } catch (e) { /* 손상 파일도 목록에는 노출 */ }
      return { name: f, sheetPath, mtimeMs: fs.statSync(file).mtimeMs };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readProject(root, name) {
  const n = safeName(name);
  if (!n) return null;
  const file = path.join(projectDir(root), n);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeProject(root, name, project) {
  const n = safeName(name);
  if (!n) throw new Error('잘못된 프로젝트 이름: ' + name);
  if (!project || typeof project !== 'object' || Array.isArray(project)) throw new Error('project 객체가 필요합니다');
  const dir = projectDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, n);
  fs.writeFileSync(file, JSON.stringify(project, null, 2));
  return { name: n, path: file };
}

module.exports = { listProjects, readProject, writeProject, safeName, projectDir, PROJECT_SUBDIR };
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/unit/AnimProjectStore.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add tools/animProjectStore.cjs tests/unit/AnimProjectStore.test.js
git commit -m "feat(tools): add anim project store for editor library"
```

---

### Task 6: 두 서버에 anim-project API 라우트 추가

**Files:**
- Modify: `serve.js` (`handleApi` GET 블록 + POST 구역)
- Modify: `tools/sprite-anim-server.mjs` (요청 디스패치, 약 218~244행)

**Interfaces:**
- Consumes: Task 5의 `listProjects/readProject/writeProject`.
- Produces: `GET /api/anim-projects → {ok, projects}`, `GET /api/anim-project?name= → {ok, project}` 또는 404, `POST /api/save-anim-project {name, project} → {ok, name}`. Task 7의 에디터가 사용.

- [ ] **Step 1: serve.js 라우트 추가**

상단 require에 추가:

```js
const animProjects = require('./tools/animProjectStore.cjs');
```

`handleApi`의 `if (req.method === 'GET') {` 블록 안, `sendJSON(res, 404, { error: 'unknown api' });` 직전에 추가:

```js
    if (urlPath === '/api/anim-projects') {
      // 스프라이트 애니 에디터 — 프로젝트 라이브러리 목록
      try { sendJSON(res, 200, { ok: true, projects: animProjects.listProjects(ROOT) }); }
      catch (e) { sendJSON(res, 500, { error: e.message }); }
      return;
    }
    if (urlPath === '/api/anim-project') {
      const q = new URLSearchParams(req.url.split('?')[1] || '');
      try {
        const project = animProjects.readProject(ROOT, q.get('name'));
        if (!project) { sendJSON(res, 404, { error: '프로젝트 없음' }); return; }
        sendJSON(res, 200, { ok: true, project });
      } catch (e) { sendJSON(res, 500, { error: e.message }); }
      return;
    }
```

POST 구역(`if (urlPath === '/api/save-sheet')` 블록 뒤)에 추가:

```js
  if (urlPath === '/api/save-anim-project') {
    // 스프라이트 애니 에디터 — 프로젝트 라이브러리 저장
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: `잘못된 요청: ${e.message}` }); return; }
    try {
      const saved = animProjects.writeProject(ROOT, body.name, body.project);
      sendJSON(res, 200, { ok: true, name: saved.name });
    } catch (e) { sendJSON(res, 400, { error: e.message }); }
    return;
  }
```

- [ ] **Step 2: tools/sprite-anim-server.mjs 라우트 추가**

상단 import에 추가:

```js
import { listProjects, readProject, writeProject } from './animProjectStore.cjs';
```

디스패치에서 `if (req.method === 'POST' && p === '/api/reveal')` 라인 뒤에 추가:

```js
    if (req.method === 'GET' && p === '/api/anim-projects') {
      try { sendJson(res, 200, { ok: true, projects: listProjects(ROOT) }); }
      catch (err) { sendJson(res, 500, { error: String(err.message || err) }); }
      return;
    }
    if (req.method === 'GET' && p === '/api/anim-project') {
      try {
        const project = readProject(ROOT, url.searchParams.get('name'));
        if (!project) { sendJson(res, 404, { error: '프로젝트 없음' }); return; }
        sendJson(res, 200, { ok: true, project });
      } catch (err) { sendJson(res, 500, { error: String(err.message || err) }); }
      return;
    }
    if (req.method === 'POST' && p === '/api/save-anim-project') {
      try {
        const body = await readJsonBody(req);
        const saved = writeProject(ROOT, body?.name, body?.project);
        sendJson(res, 200, { ok: true, name: saved.name });
      } catch (err) { sendJson(res, 400, { error: String(err.message || err) }); }
      return;
    }
```

- [ ] **Step 3: 검증**

Run: `node --check serve.js && node --check tools/sprite-anim-server.mjs && npx vitest run tests/unit/AnimProjectStore.test.js`
Expected: 문법 오류 없음, 테스트 PASS.

- [ ] **Step 4: 커밋**

```bash
git add serve.js tools/sprite-anim-server.mjs
git commit -m "feat(tools): serve anim project library endpoints"
```

---

### Task 7: 에디터 UI — 라이브러리 저장 버튼 + 시트 선택 시 자동 복원

**Files:**
- Modify: `tools/sprite-anim-editor.html` (내보내기 카드 HTML, 상태 `S`, `saveProject` 분리, `selectedSheetLoad`, `onImageReady`, 이벤트 바인딩)

**Interfaces:**
- Consumes: Task 6의 `/api/anim-project?name=`, `/api/save-anim-project`.
- Produces: 없음 (말단 UI).

- [ ] **Step 1: 상태 필드 추가**

`S` 객체 리터럴의 `layers: [], activeLayer: null,` 라인 뒤에 추가:

```js
  pendingProject: null,  // 시트 선택 시 라이브러리에서 미리 받아둔 프로젝트 (onImageReady에서 적용)
```

- [ ] **Step 2: 내보내기 카드에 버튼 추가**

`<div class="row"><button id="saveProj" ...` 행 바로 위에 추가:

```html
      <div class="row"><button id="saveLib" style="flex:1">라이브러리 저장</button></div>
```

같은 카드 하단 힌트(`'서버 저장'은 원본을...`) 끝에 문장 추가: `‘라이브러리 저장’은 작업본(.anim.json)을 저장소 art_sources/combat/anim_projects/에 보관하며, 같은 시트를 다시 선택하면 자동 복원됩니다.`

- [ ] **Step 3: buildProjectJson 추출 + saveToLibrary 구현**

기존 `saveProject()`를 아래처럼 분리:

```js
function buildProjectJson() {
  const frames = S.frames.map(f => ({ box: f.box || null, dx: f.dx | 0, dy: f.dy | 0, rot: +f.rot || 0, scale: f.scale > 0 ? +f.scale : 1 }));
  const layers = S.layers.map(L => ({ name: L.name, dataUrl: L.dataUrl, frame: L.frame, x: L.x, y: L.y, scale: L.scale, rot: L.rot }));
  return { v: 3, src: S.saveName, path: S.saveTargetPath, cols: S.cols, rows: S.rows, rowDur: S.rowDur, frameDur: S.frameDur, bg: S.bg, removeBg: S.removeBg, isolate: S.isolate, anchorMode: S.anchorMode, frames, layers };
}
function saveProject() {
  const a = document.createElement('a');
  a.download = S.saveName.replace(/\.png$/i, '') + '.anim.json';
  a.href = URL.createObjectURL(new Blob([JSON.stringify(buildProjectJson(), null, 2)], { type: 'application/json' })); a.click();
}
async function saveToLibrary() {
  if (!S.serverOn) { toast('서버 미연결 — 프로젝트 저장(다운로드)을 사용하세요'); return; }
  if (!S.saveTargetPath) { toast('저장 대상 경로 없음 — 파일 열기로 로드한 시트는 라이브러리 저장 불가'); return; }
  const name = S.saveTargetPath.split('/').pop().replace(/\.png$/i, '.anim.json');
  try {
    const j = await fetch('/api/save-anim-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, project: buildProjectJson() }) }).then(r => r.json());
    toast(j.ok ? `라이브러리 저장됨: ${name}` : '저장 실패: ' + (j.error || ''));
  } catch (e) { toast('저장 오류: ' + e.message); }
}
```

- [ ] **Step 4: 시트 선택 시 라이브러리 자동 로드**

기존 `selectedSheetLoad`를 async로 교체:

```js
async function selectedSheetLoad(basePath) {
  if (!basePath) return;
  const srcPath = basePath.replace(/\.png$/i, '_src.png');
  const hasSrc = S.sheets.some(s => s.path === srcPath);
  const loadPath = ($('preferSrc').checked && hasSrc) ? srcPath : basePath;
  S.pendingProject = null;
  if (S.serverOn) {
    const name = basePath.split('/').pop().replace(/\.png$/i, '.anim.json');
    try {
      const r = await fetch('/api/anim-project?name=' + encodeURIComponent(name));
      if (r.ok) { const j = await r.json(); if (j.ok && j.project) S.pendingProject = j.project; }
    } catch (e) { /* 라이브러리 미존재 — 신규 작업으로 진행 */ }
  }
  loadFromUrl(loadPath, basePath.split('/').pop(), basePath);
}
```

`onImageReady` 끝(`selectFrame(0);` 뒤)에 추가:

```js
  if (S.pendingProject && S.pendingProject.path === S.saveTargetPath) {
    const p = S.pendingProject; S.pendingProject = null;
    applyProject(p);
    toast('라이브러리 프로젝트 자동 복원: ' + (p.src || S.saveName));
  }
```

- [ ] **Step 5: 이벤트 바인딩 추가**

`$('saveProj').onclick = saveProject;` 근처에 추가:

```js
$('saveLib').onclick = saveToLibrary;
```

- [ ] **Step 6: 수동 검증 (에디터 스모크)**

```bash
node serve.js
```

브라우저에서 `http://localhost:8080/tools/sprite-anim-editor.html` 접속 →
1) 시트 선택 → 완급 몇 개 수정 → "라이브러리 저장" → 토스트 확인, `art_sources/combat/anim_projects/`에 파일 생성 확인
2) 다른 시트 선택 후 다시 원래 시트 선택 → "라이브러리 프로젝트 자동 복원" 토스트와 수정값 복원 확인
3) "정렬 시트 저장" → `assets/images/combat/spritesheets/motionLibrary.json`에 frameDur 포함 항목 확인
4) 게임(`http://localhost:8080/`) 부팅 → 콘솔 오류 없음 확인

- [ ] **Step 7: 커밋**

```bash
git add tools/sprite-anim-editor.html
git commit -m "feat(tools): editor project library save and auto-restore"
```

---

### Task 8: 최종 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 테스트**

Run: `npx vitest run`
Expected: 전체 PASS (기존 실패가 있었다면 본 작업 이전과 동일한지 대조).

- [ ] **Step 2: manifest drift-check**

Run: `node tools/export_combat_motion_manifest.mjs --check`
Expected: `combat motion manifest is up to date`

- [ ] **Step 3: git 상태 확인**

Run: `git status --short`
Expected: 본 작업 파일 외 새 변경 없음 (기존 WIP 변경은 그대로).
