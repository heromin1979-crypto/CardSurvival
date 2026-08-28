import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { executeCli, doctor } from '../../tools/ai-playtest-runner/src/cli.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe('AI 플레이테스트 CLI', () => {
  it('Codex CLI가 없으면 실행을 시도하지 않고 정확한 doctor 진단을 반환한다', async () => {
    const result = await doctor({
      commandRunner: async () => ({ code: 1, stdout: '', stderr: 'not found' }),
      browserChecker: async () => true,
      outputDir: path.resolve('dist-web'),
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'CODEX_CLI_MISSING',
    }));
  });

  it('skip-build prepare는 fixture build를 독립 런으로 복사한다', async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-playtest-cli-'));
    temporaryDirectories.push(projectRoot);
    const buildDir = path.join(projectRoot, 'dist-web');
    await mkdir(buildDir);
    await writeFile(path.join(buildDir, 'index.html'), '<h1>fixture</h1>', 'utf8');

    const result = await executeCli([
      'prepare',
      '--project-root',
      projectRoot,
      '--mode',
      'hook',
      '--skip-build',
    ]);

    expect(result.ok).toBe(true);
    expect(result.run.gameDir).toContain(path.join(projectRoot, '.ai-playtest', 'runs'));
    expect(result.run.runDir).not.toBe(projectRoot);
  });

  it('Codex 워커 실패 출력은 격리 런 로그에 기록한다', async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-playtest-cli-run-'));
    temporaryDirectories.push(projectRoot);
    const buildDir = path.join(projectRoot, 'dist-web');
    await mkdir(buildDir);
    await writeFile(path.join(buildDir, 'index.html'), '<h1>fixture</h1>', 'utf8');

    const result = await executeCli([
      'run',
      '--project-root',
      projectRoot,
      '--mode',
      'hook',
      '--run-id',
      'worker-failure',
      '--skip-build',
    ], {
      browserChecker: async () => true,
      commandRunner: async (_command, args) => (
        args.includes('exec')
          ? { code: 2, stdout: 'worker output', stderr: 'worker failure' }
          : { code: 0, stdout: 'codex-cli', stderr: '' }
      ),
    });

    expect(result.ok).toBe(false);
    await expect(readFile(path.join(result.run.logsDir, 'codex-worker.log'), 'utf8'))
      .resolves.toContain('worker failure');
  });
});
