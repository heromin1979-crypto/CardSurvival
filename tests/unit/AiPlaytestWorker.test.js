import { describe, expect, it } from 'vitest';
import { buildWorkerPrompt, runCommand, spawnCodexWorker } from '../../tools/ai-playtest-runner/src/worker.mjs';

describe('AI 플레이테스트 Codex 워커', () => {
  it('hook 프롬프트에 시간 제한과 블라인드 규칙을 포함하고 원본 경로는 포함하지 않는다', () => {
    const projectRoot = 'D:/Projects/CardSurvival';
    const prompt = buildWorkerPrompt({
      mode: 'hook',
      url: 'http://127.0.0.1:43100/',
    });

    expect(prompt).toContain('5분');
    expect(prompt).toContain('3분 30초');
    expect(prompt).toContain('최대 6회');
    expect(prompt).toContain('소스 코드');
    expect(prompt).toContain('도구 검색');
    expect(prompt).not.toContain(projectRoot);
  });

  it('전달받은 워커 제한 시간을 Codex 프로세스 실행에 적용한다', async () => {
    let receivedOptions;
    let receivedArgs;
    await spawnCodexWorker({
      workerDir: 'C:/temp/playtest-worker',
      prompt: 'test',
      mcpEntry: 'C:/temp/mcp-entry.mjs',
      environment: {
        PLAYTEST_RUN_DIR: 'C:/temp/playtest-run',
      },
      timeoutMs: 300000,
      commandRunner: async (_command, args, options) => {
        receivedArgs = args;
        receivedOptions = options;
        return { code: 0, stdout: '', stderr: '' };
      },
    });

    expect(receivedOptions.timeoutMs).toBe(300000);
    expect(receivedArgs.indexOf('--approve-for-me')).toBeGreaterThanOrEqual(0);
    expect(receivedArgs.indexOf('--approve-for-me')).toBeLessThan(receivedArgs.indexOf('exec'));
    expect(receivedArgs).not.toContain('--ask-for-approval');
    expect(receivedArgs).toContain('mcp_servers.playtest.env={"PLAYTEST_RUN_DIR"="C:/temp/playtest-run"}');
    expect(receivedArgs).toContain('mcp_servers.playtest.startup_timeout_sec=30');
  });

  it('시간 제한을 넘긴 워커 프로세스를 실패 상태로 종료한다', async () => {
    const result = await runCommand(process.execPath, [
      '-e',
      'setInterval(() => {}, 1000)',
    ], {
      timeoutMs: 50,
    });

    expect(result.timedOut).toBe(true);
    expect(result.code).toBe(1);
  });
});
