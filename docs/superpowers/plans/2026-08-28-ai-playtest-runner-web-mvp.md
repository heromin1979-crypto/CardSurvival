# AI Playtest Runner Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Card Survival의 웹 빌드를 실행별로 격리하고, 화면 기반 Playwright 제어와 Codex CLI 워커로 first_time_player·hook 세션의 증거·보고서를 생성한다.

**Architecture:** tools/ai-playtest-runner/는 게임 코드와 독립된 ESM Node 도구다. CLI가 빌드 산출물을 .ai-playtest/runs/<run-id>/game으로 복사하고, 루프백 정적 서버·신규 Chromium 프로필·MCP 화면 제어 서버를 시작한다. Codex CLI 워커에는 임시 작업공간과 화면 도구만 제공하며, 종료 시 JSON/Markdown 보고서를 남긴다.

**Tech Stack:** Node.js 내장 모듈, Playwright, @modelcontextprotocol/sdk, Zod, Vitest 4, ECMAScript Modules.

**Spec:** docs/AI_PLAYTEST_GUIDE.md

## Global Constraints

- 첫 릴리스는 adapter: web만 지원하며 Electron/Android는 unsupported로 반환한다.
- 게임 원본은 빌드 입력일 뿐이며 워커는 복사된 산출물만 실행한다.
- 블라인드 워커 프롬프트와 임시 작업공간에는 원본 소스·DOM·콘솔·기존 보고서를 넣지 않는다.
- 모든 서버는 127.0.0.1에만 바인딩하고 모든 런 데이터는 .ai-playtest/ 아래에 둔다.
- 지원 모드는 first_time_player, hook이며 qa, regression은 명시적 진단을 반환한다.
- 새 공개 함수는 Vitest 테스트를 먼저 작성하고 실패를 확인한 뒤 최소 구현한다.
- 기존 사용자의 .wt-check/와 문서 변경은 대상 밖이며 커밋은 만들지 않는다.

---

### Task 1: 구성·보고서 계약

**Files:**
- Create: tools/ai-playtest-runner/src/config.mjs
- Create: tools/ai-playtest-runner/src/report.mjs
- Create: tests/unit/AiPlaytestConfig.test.js
- Create: tests/unit/AiPlaytestReport.test.js

**Interfaces:** createDefaultConfig(projectRoot), validateConfig(config), createReport(input), writeReport(runDir, report). PlaytestConfig는 adapter, build.command, build.outputDir, launch.entry, launch.viewport, launch.locale, modes, runnerDir를 가진다. Report는 schemaVersion, runId, mode, persona, status, isolation, summary, findings, checkpoints, artifacts를 가진다.

- [ ] **Step 1: Write failing config and report tests**

~~~js
it('accepts web-only default config and rejects a native adapter', () => {
  expect(validateConfig(createDefaultConfig(root)).adapter).toBe('web');
  expect(() => validateConfig({ ...createDefaultConfig(root), adapter: 'android' })).toThrow(/web/);
});
it('writes reports without source visibility', async () => {
  const result = await writeReport(tempRunDir, createReport({ runId: 'r1', mode: 'hook', persona: 'casual' }));
  expect(JSON.parse(await readFile(result.jsonPath, 'utf8')).isolation.sourceVisibleToWorker).toBe(false);
  expect(await readFile(result.markdownPath, 'utf8')).toContain('hook');
});
~~~

- [ ] **Step 2: Run tests and verify expected missing-module failure**

Run: npm test -- tests/unit/AiPlaytestConfig.test.js tests/unit/AiPlaytestReport.test.js

Expected: FAIL because config.mjs and report.mjs do not exist.

- [ ] **Step 3: Implement config and report writers**

Use Zod for external config validation. Resolve managed paths, reject modes outside first_time_player/hook, and generate Korean Markdown solely from report fields.

- [ ] **Step 4: Run tests and verify they pass**

Run: npm test -- tests/unit/AiPlaytestConfig.test.js tests/unit/AiPlaytestReport.test.js

Expected: PASS with 0 failures.

### Task 2: 격리 런 준비와 정적 서버

**Files:**
- Create: tools/ai-playtest-runner/src/run-manager.mjs
- Create: tools/ai-playtest-runner/src/static-server.mjs
- Create: tests/unit/AiPlaytestRunManager.test.js
- Create: tests/unit/AiPlaytestStaticServer.test.js

**Interfaces:** prepareRun({ config, runId, build }) returns runDir, gameDir, evidenceDir, profileDir, metadataPath. startStaticServer({ rootDir, host, port }) returns url and close.

- [ ] **Step 1: Write failing isolation and server tests**

~~~js
it('copies only the build output into a new run and leaves the source file unchanged', async () => {
  const run = await prepareRun({ config, runId: 'isolation-1', build: false });
  expect(await readFile(path.join(run.gameDir, 'index.html'), 'utf8')).toBe('<h1>build</h1>');
  expect(await readFile(sourceIndex, 'utf8')).toBe('<h1>build</h1>');
});
it('serves copied entry on loopback and rejects traversal', async () => {
  const server = await startStaticServer({ rootDir: gameDir, host: '127.0.0.1', port: 0 });
  expect((await fetch(server.url)).status).toBe(200);
  expect((await fetch(server.url + '../secret')).status).toBe(403);
  await server.close();
});
~~~

- [ ] **Step 2: Run tests and verify expected missing-module failure**

Run: npm test -- tests/unit/AiPlaytestRunManager.test.js tests/unit/AiPlaytestStaticServer.test.js

Expected: FAIL because run-manager.mjs and static-server.mjs do not exist.

- [ ] **Step 3: Implement run preparation and loopback-only static server**

prepareRun creates only a new run ID directory, uses fs.cp from build.outputDir, creates evidence/, browser-profile/, logs/, and writes run.json. startStaticServer uses http.createServer, decodes/normalizes URL paths, rejects root escapes, and returns a 127.0.0.1 URL.

- [ ] **Step 4: Run tests and verify they pass**

Run: npm test -- tests/unit/AiPlaytestRunManager.test.js tests/unit/AiPlaytestStaticServer.test.js

Expected: PASS with 0 failures.

### Task 3: 화면 제어 세션과 MCP 도구

**Files:**
- Create: tools/ai-playtest-runner/src/web-session.mjs
- Create: tools/ai-playtest-runner/src/mcp-server.mjs
- Create: tests/unit/AiPlaytestWebSession.test.js
- Create: tests/unit/AiPlaytestMcpServer.test.js

**Interfaces:** createWebSession(options) exposes open, screenshot, click, drag, key, type, wait, close. createPlaytestToolHandlers(session, report) exposes only screenshot, click, drag, key, type, wait, checkpoint, finalize.

- [ ] **Step 1: Write failing tool-boundary tests**

~~~js
it('saves screenshots under evidence and rejects coordinates outside viewport', async () => {
  const session = await createWebSession(fakeBrowserOptions);
  await expect(session.click({ x: 1281, y: 10 })).rejects.toThrow(/viewport/);
  expect(await session.screenshot('start')).toMatch(/evidence/);
});
it('exposes screen input and checkpoints but not DOM or console tools', () => {
  expect(Object.keys(createPlaytestToolHandlers(fakeSession, report))).toEqual([
    'screenshot', 'click', 'drag', 'key', 'type', 'wait', 'checkpoint', 'finalize',
  ]);
});
~~~

- [ ] **Step 2: Run tests and verify expected missing-module failure**

Run: npm test -- tests/unit/AiPlaytestWebSession.test.js tests/unit/AiPlaytestMcpServer.test.js

Expected: FAIL because web-session.mjs and mcp-server.mjs do not exist.

- [ ] **Step 3: Implement browser session and MCP stdio server**

Launch Playwright Chromium with launchPersistentContext(profileDir), no DevTools, configured viewport and locale. Public input accepts coordinates/keys/text only and saves timestamped artifacts; it never exposes page evaluation, selectors, DOM, console, storage, or network. Use official MCP SDK stdio transport for the eight named tools.

- [ ] **Step 4: Run tests and verify they pass**

Run: npm test -- tests/unit/AiPlaytestWebSession.test.js tests/unit/AiPlaytestMcpServer.test.js

Expected: PASS with 0 failures.

### Task 4: Codex 워커·CLI·안전한 종료

**Files:**
- Create: tools/ai-playtest-runner/src/worker.mjs
- Create: tools/ai-playtest-runner/src/cli.mjs
- Create: tools/ai-playtest-runner/README.md
- Create: tests/unit/AiPlaytestWorker.test.js
- Create: tests/unit/AiPlaytestCli.test.js
- Modify: package.json
- Modify: .gitignore

**Interfaces:** commands doctor, prepare, run emit Korean JSON diagnostics and non-zero exit status on unavailable dependency or failed run. run invokes spawnCodexWorker({ run, prompt, mcpCommand, commandRunner }) and always closes session/server in finally.

- [ ] **Step 1: Write failing CLI and worker tests**

~~~js
it('doctor reports unavailable Codex CLI without attempting a run', async () => {
  const result = await doctor({ commandRunner: missingCodexRunner });
  expect(result.ok).toBe(false);
  expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'CODEX_CLI_MISSING' }));
});
it('worker prompt includes mode and blindness rules but no source path', () => {
  const prompt = buildWorkerPrompt({ mode: 'hook', url: 'http://127.0.0.1:43100/' });
  expect(prompt).toContain('5분');
  expect(prompt).not.toContain(projectRoot);
});
~~~

- [ ] **Step 2: Run tests and verify expected missing-module failure**

Run: npm test -- tests/unit/AiPlaytestWorker.test.js tests/unit/AiPlaytestCli.test.js

Expected: FAIL because worker.mjs and cli.mjs do not exist.

- [ ] **Step 3: Implement worker spawning, CLI commands, scripts, and ignored runtime data**

doctor checks Node major version, Playwright browser launchability, codex --version, and the web output directory. prepare builds only through validated config command then copies output. run uses an isolated temporary worker directory, generated MCP configuration, Korean mode prompt, spawn argument arrays, and finalizes a report on success, error, timeout, or interruption. Add playtest, playtest:doctor, playtest:prepare scripts and ignore .ai-playtest/.

- [ ] **Step 4: Run tests and verify they pass**

Run: npm test -- tests/unit/AiPlaytestWorker.test.js tests/unit/AiPlaytestCli.test.js

Expected: PASS with 0 failures.

### Task 5: 통합 검증과 운영 문서 갱신

**Files:**
- Modify: docs/AI_PLAYTEST_GUIDE.md
- Modify: docs/README.md

**Interfaces:** documents executable quick-start commands and the unsupported qa/regression/native adapter boundary.

- [ ] **Step 1: Write failing command-level smoke test**

~~~js
it('prepare creates a self-contained web run from fixture build', async () => {
  const result = await runCli(['prepare', '--config', fixtureConfig]);
  expect(result.exitCode).toBe(0);
  expect(await stat(path.join(result.runDir, 'game', 'index.html'))).toBeTruthy();
  expect(await stat(path.join(result.runDir, 'run.json'))).toBeTruthy();
});
~~~

- [ ] **Step 2: Run smoke test and verify it fails before CLI integration is complete**

Run: npm test -- tests/unit/AiPlaytestCli.test.js

Expected: FAIL until prepare is wired to fixture config.

- [ ] **Step 3: Implement CLI integration and update operating guide**

Document npm run playtest:doctor, npm run playtest:prepare -- --mode hook, and npm run playtest -- --mode first_time_player. Document required Codex CLI/Playwright availability and report location.

- [ ] **Step 4: Run focused, full, and build verification**

Run: npm test -- tests/unit/AiPlaytest*.test.js

Run: npm run check:data

Run: npm run build:web

Expected: focused tests pass, data validation exits 0, and Vite build exits 0. If local environment cannot launch a real Codex worker or Chromium, report that capability result from npm run playtest:doctor without claiming a live AI run succeeded.
