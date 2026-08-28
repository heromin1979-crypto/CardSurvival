import { access, cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function validateRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]*$/i.test(runId)) {
    throw new Error('runId는 영문, 숫자, 하이픈만 사용할 수 있습니다.');
  }
}

export async function prepareRun({ config, runId }) {
  validateRunId(runId);
  await access(config.build.outputDir);

  const runsDir = path.join(config.runnerDir, 'runs');
  const runDir = path.join(runsDir, runId);
  const gameDir = path.join(runDir, 'game');
  const evidenceDir = path.join(runDir, 'evidence');
  const profileDir = path.join(runDir, 'browser-profile');
  const logsDir = path.join(runDir, 'logs');
  const metadataPath = path.join(runDir, 'run.json');

  await mkdir(runsDir, { recursive: true });
  await mkdir(runDir);
  await Promise.all([
    cp(config.build.outputDir, gameDir, { recursive: true, errorOnExist: true }),
    mkdir(evidenceDir),
    mkdir(profileDir),
    mkdir(logsDir),
  ]);

  const metadata = {
    schemaVersion: 1,
    runId,
    createdAt: new Date().toISOString(),
    adapter: config.adapter,
    mode: config.mode,
    persona: config.persona,
    gameDir,
    sourceVisibleToWorker: false,
  };
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');

  return {
    runDir,
    gameDir,
    evidenceDir,
    profileDir,
    logsDir,
    metadataPath,
  };
}
