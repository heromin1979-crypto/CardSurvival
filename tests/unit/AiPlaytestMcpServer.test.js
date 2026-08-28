import { describe, expect, it, vi } from 'vitest';
import { createPlaytestToolHandlers } from '../../tools/ai-playtest-runner/src/mcp-server.mjs';

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
});
