import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createDefaultConfig,
  validateConfig,
} from '../../tools/ai-playtest-runner/src/config.mjs';

describe('AI 플레이테스트 구성', () => {
  it('기본 웹 구성은 유효하고 프로젝트 루트를 기준으로 산출물을 찾는다', () => {
    const root = path.resolve('fixtures/playtest-project');
    const config = validateConfig(createDefaultConfig(root));

    expect(config.adapter).toBe('web');
    expect(config.projectRoot).toBe(root);
    expect(config.build.outputDir).toBe(path.join(root, 'dist-web'));
    expect(config.launch.entry).toBe('index.html');
  });

  it('웹이 아닌 어댑터와 지원하지 않는 모드를 거부한다', () => {
    const config = createDefaultConfig(path.resolve('fixtures/playtest-project'));

    expect(() => validateConfig({ ...config, adapter: 'android' })).toThrow(/web/);
    expect(() => validateConfig({ ...config, mode: 'regression' })).toThrow(/지원하지 않는 모드/);
  });
});
