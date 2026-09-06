import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createReport,
  writeReport,
} from '../../tools/ai-playtest-runner/src/report.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe('AI 플레이테스트 보고서', () => {
  it('블라인드 세션 보고서를 JSON과 한글 Markdown으로 기록한다', async () => {
    const runDir = await mkdtemp(path.join(os.tmpdir(), 'ai-playtest-report-'));
    temporaryDirectories.push(runDir);
    const report = createReport({
      runId: 'hook-casual-001',
      mode: 'hook',
      persona: 'casual',
      build: { revision: 'abc123', command: 'npm run build:web' },
    });

    const files = await writeReport(runDir, report);
    const json = JSON.parse(await readFile(files.jsonPath, 'utf8'));
    const markdown = await readFile(files.markdownPath, 'utf8');

    expect(json.isolation.sourceVisibleToWorker).toBe(false);
    expect(json.mode).toBe('hook');
    expect(markdown).toContain('AI 플레이테스트 보고서');
    expect(markdown).toContain('hook');
  });
});
