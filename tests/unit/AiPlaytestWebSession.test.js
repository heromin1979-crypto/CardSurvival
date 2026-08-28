import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWebSession } from '../../tools/ai-playtest-runner/src/web-session.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe('AI 플레이테스트 웹 세션', () => {
  it('viewport 밖 좌표를 거부하고 증거 폴더에 스크린샷을 요청한다', async () => {
    const evidenceDir = await mkdtemp(path.join(os.tmpdir(), 'ai-playtest-evidence-'));
    temporaryDirectories.push(evidenceDir);
    const screenshot = vi.fn(async ({ path: outputPath }) => {
      await mkdir(path.dirname(outputPath), { recursive: true });
    });
    const mouse = { click: vi.fn(), move: vi.fn(), down: vi.fn(), up: vi.fn() };
    const page = {
      goto: vi.fn(),
      screenshot,
      mouse,
      keyboard: { press: vi.fn(), insertText: vi.fn() },
      waitForTimeout: vi.fn(),
    };
    const context = { newPage: vi.fn(async () => page), close: vi.fn() };
    const browserLauncher = vi.fn(async () => context);
    const session = await createWebSession({
      browserLauncher,
      profileDir: path.join(evidenceDir, 'profile'),
      evidenceDir,
      url: 'http://127.0.0.1:43100/',
      viewport: { width: 1280, height: 720 },
    });

    await expect(session.click({ x: 1280, y: 20 })).rejects.toThrow(/viewport/);
    const outputPath = await session.screenshot('first-state');

    expect(outputPath).toContain(evidenceDir);
    expect(screenshot).toHaveBeenCalledWith({ path: outputPath, fullPage: false });
    await session.close();
  });
});
