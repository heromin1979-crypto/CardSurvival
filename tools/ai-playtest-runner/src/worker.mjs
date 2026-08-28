import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export function buildWorkerPrompt({ mode, url }) {
  const objective = mode === 'hook'
    ? '최대 5분 동안 자연스럽게 플레이하고, 첫 이탈 지점과 직접 원인을 찾으세요.'
    : '처음 접한 플레이어처럼 자연스럽게 탐색하며, 이해하기 어려운 화면과 행동을 찾으세요.';

  return [
    '당신은 Card Survival: Ruined City의 블라인드 플레이테스터입니다.',
    objective,
    '게임 주소: ' + url,
    '제공된 playtest MCP 도구만 사용하세요.',
    '소스 코드, DOM, 개발자 도구, 콘솔, 네트워크, 저장소, 이전 보고서를 읽거나 추측하지 마세요.',
    '의미 있는 장면마다 screenshot과 checkpoint를 남기세요.',
    '종료 전에 finalize로 요약과 상태를 기록하세요.',
  ].join('\n');
}

export async function createWorkerWorkspace(prompt) {
  const workerDir = await mkdtemp(path.join(os.tmpdir(), 'card-survival-playtest-worker-'));
  await writeFile(path.join(workerDir, 'PLAYTEST.md'), prompt + '\n', 'utf8');
  return workerDir;
}

export async function removeWorkerWorkspace(workerDir) {
  await rm(workerDir, { recursive: true, force: true });
}

export function runCommand(command, args, { cwd, env, timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timeout;
    const finish = result => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      resolve(result);
    };
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => {
      if (!settled) {
        settled = true;
        if (timeout) {
          clearTimeout(timeout);
        }
        reject(error);
      }
    });
    child.on('close', code => finish({ code: code ?? 1, stdout, stderr, timedOut: false }));
    if (Number.isInteger(timeoutMs) && timeoutMs > 0) {
      timeout = setTimeout(() => {
        child.kill();
        finish({
          code: 1,
          stdout,
          stderr: stderr + '\n플레이테스트 워커가 시간 제한으로 중지되었습니다.',
          timedOut: true,
        });
      }, timeoutMs);
    }
  });
}

function tomlString(value) {
  return JSON.stringify(value);
}

export async function spawnCodexWorker({
  workerDir,
  prompt,
  mcpEntry,
  environment,
  timeoutMs,
  commandRunner = runCommand,
}) {
  const args = [
    '--ask-for-approval',
    'never',
    'exec',
    '--ephemeral',
    '--ignore-rules',
    '--skip-git-repo-check',
    '--cd',
    workerDir,
    '--sandbox',
    'read-only',
    '-c',
    'mcp_servers.playtest.command=' + tomlString(process.execPath),
    '-c',
    'mcp_servers.playtest.args=' + JSON.stringify([mcpEntry]),
    prompt,
  ];

  return commandRunner('codex', args, {
    cwd: workerDir,
    env: environment,
    timeoutMs,
  });
}
