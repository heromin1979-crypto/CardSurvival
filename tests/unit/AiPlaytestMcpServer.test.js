import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlaytestToolHandlers } from '../../tools/ai-playtest-runner/src/mcp-server.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe('AI 플레이테스트 MCP 도구 경계', () => {
  it('화면 입력과 체크포인트만 노출하고 DOM 또는 콘솔 도구를 제공하지 않는다', () => {
    const report = { checkpoints: [], artifacts: [], status: 'running' };
    const handlers = createPlaytestToolHandlers({
      screenshot: vi.fn(),
      click: vi.fn(),
      drag: vi.fn(),
      key: vi.fn(),
      type: vi.fn(),
      wait: vi.fn(),
    }, report);

    expect(Object.keys(handlers)).toEqual([
      'screenshot',
      'click',
      'drag',
      'key',
      'type',
      'wait',
      'checkpoint',
      'finalize',
    ]);
    expect(handlers).not.toHaveProperty('evaluate');
    expect(handlers).not.toHaveProperty('console');
    expect(handlers).not.toHaveProperty('dom');
  });

  it('screenshot 결과에 화면 이미지와 증적 경로를 함께 제공한다', async () => {
    const evidenceDir = await mkdtemp(path.join(os.tmpdir(), 'ai-playtest-mcp-'));
    temporaryDirectories.push(evidenceDir);
    const screenshotPath = path.join(evidenceDir, 'screen.png');
    await writeFile(screenshotPath, Buffer.from([137, 80, 78, 71]));
    const report = { checkpoints: [], artifacts: [], status: 'running' };
    const handlers = createPlaytestToolHandlers({
      screenshot: async () => screenshotPath,
    }, report);

    const result = await handlers.screenshot({ label: 'opening' });

    expect(result.content).toEqual([
      expect.objectContaining({ type: 'image', mimeType: 'image/png' }),
      expect.objectContaining({ type: 'text', text: screenshotPath }),
    ]);
    expect(report.artifacts).toHaveLength(1);
  });

  it('finalize 호출 시 보고서를 즉시 저장할 수 있도록 완료 콜백을 실행한다', async () => {
    const report = { checkpoints: [], artifacts: [], status: 'running', summary: '' };
    const onFinalize = vi.fn();
    const handlers = createPlaytestToolHandlers({}, report, { onFinalize });

    await handlers.finalize({ summary: '완료', status: 'completed' });

    expect(report).toMatchObject({ summary: '완료', status: 'completed' });
    expect(onFinalize).toHaveBeenCalledWith(report);
  });
});
