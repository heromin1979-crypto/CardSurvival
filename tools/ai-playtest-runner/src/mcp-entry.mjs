import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createReport, writeReport } from './report.mjs';
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
const metadata = JSON.parse(await readFile(path.join(runDir, 'run.json'), 'utf8'));
const report = createReport({
  runId: metadata.runId,
  mode: metadata.mode,
  persona: metadata.persona,
  status: 'running',
});
const session = await createWebSession({
  profileDir: path.join(runDir, 'browser-profile'),
  evidenceDir,
  url: requireEnvironment('PLAYTEST_URL'),
  viewport: JSON.parse(requireEnvironment('PLAYTEST_VIEWPORT')),
  locale: 'ko-KR',
});
const server = await startPlaytestMcpServer({ session, report });
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
