import { describe, expect, it } from 'vitest';
import { createLazyWebSession } from '../../tools/ai-playtest-runner/src/lazy-web-session.mjs';

describe('AI 플레이테스트 지연 웹 세션', () => {
  it('첫 도구 호출에서만 브라우저 세션을 만들고 이후 호출은 같은 세션을 사용한다', async () => {
    const calls = [];
    let created = 0;
    const session = createLazyWebSession(async () => {
      created += 1;
      return {
        screenshot: async label => calls.push(['screenshot', label]),
        click: async point => calls.push(['click', point]),
        close: async () => calls.push(['close']),
      };
    });

    expect(created).toBe(0);
    await session.screenshot('opening');
    await session.click({ x: 10, y: 20 });

    expect(created).toBe(1);
    expect(calls).toEqual([
      ['screenshot', 'opening'],
      ['click', { x: 10, y: 20 }],
    ]);
  });

  it('한 번도 사용하지 않은 세션은 브라우저를 시작하지 않고 종료한다', async () => {
    let created = 0;
    const session = createLazyWebSession(async () => {
      created += 1;
      return { close: async () => {} };
    });

    await session.close();

    expect(created).toBe(0);
  });
});
