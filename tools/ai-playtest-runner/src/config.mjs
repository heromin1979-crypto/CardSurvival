import path from 'node:path';
import { z } from 'zod';

export const SUPPORTED_MODES = ['first_time_player', 'hook'];

const configSchema = z.object({
  schemaVersion: z.literal(1),
  projectRoot: z.string().min(1),
  runnerDir: z.string().min(1),
  adapter: z.string().refine(value => value === 'web', {
    message: '현재는 web 어댑터만 지원합니다.',
  }),
  mode: z.string().refine(value => SUPPORTED_MODES.includes(value), {
    message: '지원하지 않는 모드입니다. first_time_player 또는 hook을 사용하세요.',
  }),
  persona: z.string().min(1),
  build: z.object({
    command: z.array(z.string().min(1)).min(1),
    outputDir: z.string().min(1),
  }),
  launch: z.object({
    entry: z.string().min(1),
    host: z.literal('127.0.0.1'),
    viewport: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
    locale: z.literal('ko-KR'),
  }),
});

function resolveFromProject(projectRoot, target) {
  return path.isAbsolute(target) ? path.normalize(target) : path.resolve(projectRoot, target);
}

export function createDefaultConfig(projectRoot) {
  const resolvedProjectRoot = path.resolve(projectRoot);

  return {
    schemaVersion: 1,
    projectRoot: resolvedProjectRoot,
    runnerDir: path.join(resolvedProjectRoot, '.ai-playtest'),
    adapter: 'web',
    mode: 'first_time_player',
    persona: 'casual',
    build: {
      command: ['npm', 'run', 'build:web'],
      outputDir: path.join(resolvedProjectRoot, 'dist-web'),
    },
    launch: {
      entry: 'index.html',
      host: '127.0.0.1',
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
    },
  };
}

export function validateConfig(config) {
  const parsed = configSchema.parse(config);
  const projectRoot = path.resolve(parsed.projectRoot);
  const outputDir = resolveFromProject(projectRoot, parsed.build.outputDir);
  const runnerDir = resolveFromProject(projectRoot, parsed.runnerDir);

  return {
    ...parsed,
    projectRoot,
    runnerDir,
    build: {
      ...parsed.build,
      outputDir,
    },
  };
}
