import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultConfig, validateConfig } from './config.mjs';
import { createReport, writeReport } from './report.mjs';
import { prepareRun } from './run-manager.mjs';
import { startStaticServer } from './static-server.mjs';
import {
  buildWorkerPrompt,
  createWorkerWorkspace,
  removeWorkerWorkspace,
  runCommand,
  spawnCodexWorker,
} from './worker.mjs';

function parseArguments(argv) {
  const [command = 'doctor', ...rest] = argv;
  const options = { command, skipBuild: false };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === '--skip-build') {
      options.skipBuild = true;
      continue;
    }
    if (!['--project-root', '--mode', '--persona', '--run-id'].includes(token)) {
      throw new Error('알 수 없는 옵션입니다: ' + token);
    }
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(token + ' 옵션에는 값이 필요합니다.');
    }
    options[token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    index += 1;
  }
  return options;
}

function createRunId(mode, persona) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return stamp + '-' + mode + '-' + persona + '-' + Math.random().toString(16).slice(2, 6);
}

async function checkBrowser() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  await browser.close();
  return true;
}

export async function doctor({
  commandRunner = runCommand,
  browserChecker = checkBrowser,
  outputDir = path.resolve('dist-web'),
} = {}) {
  const diagnostics = [];
  if (Number.parseInt(process.versions.node.split('.')[0], 10) < 22) {
    diagnostics.push({ code: 'NODE_VERSION_UNSUPPORTED', message: 'Node.js 22 이상이 필요합니다.' });
  }

  try {
    const result = await commandRunner('codex', ['--version']);
    if (result.code !== 0) {
      diagnostics.push({ code: 'CODEX_CLI_MISSING', message: 'Codex CLI를 찾거나 실행할 수 없습니다.' });
    }
  } catch {
    diagnostics.push({ code: 'CODEX_CLI_MISSING', message: 'Codex CLI를 찾거나 실행할 수 없습니다.' });
  }

  try {
    await browserChecker();
  } catch {
    diagnostics.push({ code: 'PLAYWRIGHT_BROWSER_MISSING', message: 'Playwright Chromium을 실행할 수 없습니다.' });
  }

  try {
    await access(outputDir);
  } catch {
    diagnostics.push({ code: 'WEB_BUILD_MISSING', message: '웹 빌드가 없습니다. prepare 또는 npm run build:web를 실행하세요.' });
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics,
  };
}

async function runBuild(config, commandRunner) {
  const [command, ...args] = config.build.command;
  const result = await commandRunner(command, args, { cwd: config.projectRoot });
  if (result.code !== 0) {
    throw new Error('웹 빌드에 실패했습니다.\n' + result.stderr);
  }
}

function configForOptions(options) {
  const defaults = createDefaultConfig(options.projectRoot ?? process.cwd());
  return validateConfig({
    ...defaults,
    mode: options.mode ?? defaults.mode,
    persona: options.persona ?? defaults.persona,
  });
}

export async function executeCli(argv, {
  commandRunner = runCommand,
  browserChecker = checkBrowser,
} = {}) {
  const options = parseArguments(argv);
  const config = configForOptions(options);

  if (options.command === 'doctor') {
    return doctor({ commandRunner, browserChecker, outputDir: config.build.outputDir });
  }
  if (!['prepare', 'run'].includes(options.command)) {
    throw new Error('지원하지 않는 명령입니다: ' + options.command);
  }

  if (!options.skipBuild) {
    await runBuild(config, commandRunner);
  }
  const runId = options.runId ?? createRunId(config.mode, config.persona);
  const run = await prepareRun({ config, runId });
  if (options.command === 'prepare') {
    return { ok: true, run };
  }

  const readiness = await doctor({ commandRunner, browserChecker, outputDir: config.build.outputDir });
  if (!readiness.ok) {
    throw new Error('플레이테스트 실행 환경이 준비되지 않았습니다: '
      + readiness.diagnostics.map(diagnostic => diagnostic.code).join(', '));
  }

  const server = await startStaticServer({
    rootDir: run.gameDir,
    host: config.launch.host,
    port: 0,
  });
  const prompt = buildWorkerPrompt({ mode: config.mode, url: server.url });
  const workerDir = await createWorkerWorkspace(prompt);
  const fallbackReport = createReport({
    runId,
    mode: config.mode,
    persona: config.persona,
    status: 'running',
  });

  try {
    const workerResult = await spawnCodexWorker({
      workerDir,
      prompt,
      mcpEntry: fileURLToPath(new URL('./mcp-entry.mjs', import.meta.url)),
      environment: {
        PLAYTEST_RUN_DIR: run.runDir,
        PLAYTEST_URL: server.url,
        PLAYTEST_VIEWPORT: JSON.stringify(config.launch.viewport),
      },
      commandRunner,
      timeoutMs: config.mode === 'hook' ? 300000 : 900000,
    });
    await writeFile(path.join(run.logsDir, 'codex-worker.log'), [
      '종료 코드: ' + String(workerResult.code),
      '시간 제한: ' + (workerResult.timedOut ? '예' : '아니오'),
      '',
      '[stdout]',
      workerResult.stdout,
      '',
      '[stderr]',
      workerResult.stderr,
      '',
    ].join('\n'), 'utf8');
    fallbackReport.status = workerResult.code === 0 ? 'completed' : 'failed';
    fallbackReport.summary = workerResult.code === 0
      ? 'Codex 워커가 종료되었습니다.'
      : 'Codex 워커가 실패했습니다.';
    return { ok: workerResult.code === 0, run, worker: workerResult };
  } finally {
    await server.close();
    await removeWorkerWorkspace(workerDir);
    try {
      await readFile(path.join(run.runDir, 'report.json'), 'utf8');
    } catch {
      await writeReport(run.runDir, fallbackReport);
    }
  }
}

async function main() {
  try {
    const result = await executeCli(process.argv.slice(2));
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    process.stderr.write(JSON.stringify({
      ok: false,
      error: error.message,
    }, null, 2) + '\n');
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
