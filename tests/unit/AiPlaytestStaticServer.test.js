import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { startStaticServer } from '../../tools/ai-playtest-runner/src/static-server.mjs';

const temporaryDirectories = [];
const runningServers = [];

afterEach(async () => {
  await Promise.all(runningServers.splice(0).map(server => server.close()));
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe('AI 플레이테스트 정적 서버', () => {
  it('복사된 entry를 루프백에서 제공하고 인코딩된 경로 탈출을 거부한다', async () => {
    const gameDir = await mkdtemp(path.join(os.tmpdir(), 'ai-playtest-static-'));
    temporaryDirectories.push(gameDir);
    await writeFile(path.join(gameDir, 'index.html'), '<h1>isolated</h1>', 'utf8');

    const server = await startStaticServer({ rootDir: gameDir, host: '127.0.0.1', port: 0 });
    runningServers.push(server);

    expect((await fetch(server.url)).status).toBe(200);
    expect(await (await fetch(server.url)).text()).toContain('isolated');
    expect((await fetch(server.url + '%2e%2e%2fsecret')).status).toBe(403);
  });
});
