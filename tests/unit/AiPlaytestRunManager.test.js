import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultConfig, validateConfig } from '../../tools/ai-playtest-runner/src/config.mjs';
import { prepareRun } from '../../tools/ai-playtest-runner/src/run-manager.mjs';

const temporaryDirectories = [];

async function createFixture() {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-playtest-project-'));
  temporaryDirectories.push(projectRoot);
  const buildDir = path.join(projectRoot, 'fixture-build');
  const runnerDir = path.join(projectRoot, 'runner-data');
  await mkdir(buildDir, { recursive: true });
  await writeFile(path.join(projectRoot, 'source-note.txt'), '원본은 변경하지 않는다', 'utf8');
  await writeFile(path.join(buildDir, 'index.html'), '<h1>build</h1>', 'utf8');

  const defaults = createDefaultConfig(projectRoot);
  return {
    config: validateConfig({
      ...defaults,
      runnerDir,
      build: { ...defaults.build, outputDir: buildDir },
    }),
    sourceNote: path.join(projectRoot, 'source-note.txt'),
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe('AI 플레이테스트 런 준비', () => {
  it('빌드 산출물만 새 런으로 복사하고 원본 파일을 바꾸지 않는다', async () => {
    const fixture = await createFixture();
    const run = await prepareRun({ config: fixture.config, runId: 'isolation-1' });

    expect(await readFile(path.join(run.gameDir, 'index.html'), 'utf8')).toBe('<h1>build</h1>');
    expect(await readFile(fixture.sourceNote, 'utf8')).toBe('원본은 변경하지 않는다');
    expect(JSON.parse(await readFile(run.metadataPath, 'utf8')).sourceVisibleToWorker).toBe(false);
  });

  it('런 ID로 상위 디렉터리 탈출을 시도하면 거부한다', async () => {
    const fixture = await createFixture();

    await expect(prepareRun({ config: fixture.config, runId: '../escape' }))
      .rejects.toThrow(/runId/);
  });
});
