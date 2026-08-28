import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function createReport({
  runId,
  mode,
  persona,
  build = {},
  status = 'prepared',
  summary = null,
} = {}) {
  if (!runId || !mode || !persona) {
    throw new Error('보고서에는 runId, mode, persona가 필요합니다.');
  }

  return {
    schemaVersion: 1,
    runId,
    mode,
    persona,
    status,
    createdAt: new Date().toISOString(),
    build,
    isolation: {
      freshProfile: true,
      freshSave: true,
      sourceVisibleToWorker: false,
    },
    summary,
    findings: [],
    checkpoints: [],
    artifacts: [],
  };
}

function valueOrDash(value) {
  return value ? String(value) : '-';
}

function renderFindings(findings) {
  if (!findings.length) {
    return '발견 사항 없음';
  }

  return findings.map((finding, index) => [
    '### ' + String(index + 1) + '. ' + (finding.title ?? finding.id ?? '발견 사항'),
    '',
    '- 영향도: ' + valueOrDash(finding.severity),
    '- 관찰: ' + valueOrDash(finding.observation),
    '- 기대: ' + valueOrDash(finding.expected),
    '- 실제: ' + valueOrDash(finding.actual),
  ].join('\n')).join('\n\n');
}

export function renderReportMarkdown(report) {
  return [
    '# AI 플레이테스트 보고서',
    '',
    '- 런 ID: ' + report.runId,
    '- 모드: ' + report.mode,
    '- 페르소나: ' + report.persona,
    '- 상태: ' + report.status,
    '- 생성 시각: ' + report.createdAt,
    '- 원본 소스 노출: ' + (report.isolation.sourceVisibleToWorker ? '예' : '아니오'),
    '',
    '## 요약',
    '',
    valueOrDash(report.summary),
    '',
    '## 발견 사항',
    '',
    renderFindings(report.findings),
    '',
  ].join('\n');
}

export async function writeReport(runDir, report) {
  const reportDir = path.resolve(runDir);
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, 'report.json');
  const markdownPath = path.join(reportDir, 'report.md');

  await Promise.all([
    writeFile(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8'),
    writeFile(markdownPath, renderReportMarkdown(report), 'utf8'),
  ]);

  return { jsonPath, markdownPath };
}
