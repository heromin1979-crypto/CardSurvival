import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

function textResult(value) {
  return {
    content: [{ type: 'text', text: String(value) }],
  };
}

export function createPlaytestToolHandlers(session, report, { onFinalize = async () => {} } = {}) {
  return {
    async screenshot({ label = 'screen' } = {}) {
      const artifactPath = await session.screenshot(label);
      report.artifacts.push({ kind: 'screenshot', path: artifactPath, at: new Date().toISOString() });
      const image = await readFile(artifactPath);
      return {
        content: [
          { type: 'image', data: image.toString('base64'), mimeType: 'image/png' },
          { type: 'text', text: artifactPath },
        ],
      };
    },
    async click({ x, y }) {
      await session.click({ x, y });
      return textResult('클릭 완료');
    },
    async drag({ fromX, fromY, toX, toY }) {
      await session.drag({ x: fromX, y: fromY }, { x: toX, y: toY });
      return textResult('드래그 완료');
    },
    async key({ key }) {
      await session.key(key);
      return textResult('키 입력 완료');
    },
    async type({ text }) {
      await session.type(text);
      return textResult('텍스트 입력 완료');
    },
    async wait({ milliseconds }) {
      await session.wait(milliseconds);
      return textResult('대기 완료');
    },
    async checkpoint({ label, observation = '' }) {
      report.checkpoints.push({
        label,
        observation,
        at: new Date().toISOString(),
      });
      return textResult('체크포인트 기록 완료');
    },
    async finalize({ summary = '', status = 'completed' } = {}) {
      report.summary = summary;
      report.status = status;
      await onFinalize(report);
      return textResult('플레이테스트 보고서 확정');
    },
  };
}

export async function startPlaytestMcpServer({ session, report, onFinalize }) {
  const handlers = createPlaytestToolHandlers(session, report, { onFinalize });
  const server = new McpServer({
    name: 'card-survival-playtest',
    version: '1.0.0',
  });

  server.registerTool('screenshot', {
    description: '현재 게임 화면을 캡처합니다.',
    inputSchema: { label: z.string().optional() },
  }, handlers.screenshot);
  server.registerTool('click', {
    description: '지정 좌표를 클릭합니다.',
    inputSchema: { x: z.number(), y: z.number() },
  }, handlers.click);
  server.registerTool('drag', {
    description: '두 좌표 사이를 드래그합니다.',
    inputSchema: { fromX: z.number(), fromY: z.number(), toX: z.number(), toY: z.number() },
  }, handlers.drag);
  server.registerTool('key', {
    description: '키를 입력합니다.',
    inputSchema: { key: z.string().min(1) },
  }, handlers.key);
  server.registerTool('type', {
    description: '텍스트를 입력합니다.',
    inputSchema: { text: z.string() },
  }, handlers.type);
  server.registerTool('wait', {
    description: '지정 시간만큼 기다립니다.',
    inputSchema: { milliseconds: z.number().int().min(0).max(30000) },
  }, handlers.wait);
  server.registerTool('checkpoint', {
    description: '화면 관찰을 체크포인트로 기록합니다.',
    inputSchema: { label: z.string().min(1), observation: z.string().optional() },
  }, handlers.checkpoint);
  server.registerTool('finalize', {
    description: '세션 요약과 상태를 기록합니다.',
    inputSchema: { summary: z.string().optional(), status: z.enum(['completed', 'failed', 'stopped']).optional() },
  }, handlers.finalize);

  await server.connect(new StdioServerTransport());
  return server;
}
