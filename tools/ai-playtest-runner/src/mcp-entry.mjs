import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createReport, writeReport } from './report.mjs';
import { createLazyWebSession } from './lazy-web-session.mjs';
import { startPlaytestMcpServer } from './mcp-server.mjs';
import { createWebSession } from './web-session.mjs';

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(name + ' 환경 변수가 필요합니다.');
  }
  return value;
}

const runDir = requireEnvironment('PLAYTEST_RUN_DIR');
const evidenceDir = path.join(runDir, 'evidence');
const logPath = path.join(runDir, 'logs', 'mcp-server.log');
const metadata = JSON.parse(await readFile(path.join(runDir, 'run.json'), 'utf8'));
const report = createReport({
  runId: metadata.runId,
  mode: metadata.mode,
  persona: metadata.persona,
  status: 'running',
});
async function writeMcpLog(message) {
  await appendFile(logPath, new Date().toISOString() + ' ' + message + '\n', 'utf8');
}

await writeMcpLog('MCP 서버 초기화 시작');
let session;
let server;
try {
  session = createLazyWebSession(async () => {
    await writeMcpLog('브라우저 세션 초기화 시작');
    const webSession = await createWebSession({
      profileDir: path.join(runDir, 'browser-profile'),
      evidenceDir,
      url: requireEnvironment('PLAYTEST_URL'),
      viewport: JSON.parse(requireEnvironment('PLAYTEST_VIEWPORT')),
      locale: 'ko-KR',
    });
    await writeMcpLog('브라우저 세션 초기화 완료');
    return webSession;
  });
  server = await startPlaytestMcpServer({
    session,
    report,
    onFinalize: finalizedReport => writeReport(runDir, finalizedReport),
  });
  await writeMcpLog('MCP 서버 연결 준비 완료');
} catch (error) {
  await writeMcpLog('MCP 서버 초기화 실패: ' + (error.stack || error.message));
  throw error;
}
let shuttingDown = false;

async function shutdown(status) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  if (report.status === 'running') {
    report.status = status;
  }
  await writeReport(runDir, report);
  await server.close();
  await session.close();
}

process.once('SIGINT', () => { shutdown('stopped').finally(() => process.exit(0)); });
process.once('SIGTERM', () => { shutdown('stopped').finally(() => process.exit(0)); });
