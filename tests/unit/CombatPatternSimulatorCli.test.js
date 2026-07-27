import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SIMULATORS = [
  'tools/simulate_boss_patterns.mjs',
  'tools/simulate_companion_monster_patterns.mjs',
];

describe.each(SIMULATORS)('%s CLI 정수 계약', (script) => {
  it.each([
    ['500tail'],
    ['1.5'],
    ['-1'],
    ['0'],
  ])('--runs %s를 거부하고 사용법을 출력한다', (value) => {
    const result = spawnSync(process.execPath, [
      script,
      '--runs',
      value,
      '--out',
      `tmp/cli-contract-${script.split('/').at(-1)}.md`,
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/사용법|Usage/);
  });

  it('--seed 값 누락을 거부하고 사용법을 출력한다', () => {
    const result = spawnSync(process.execPath, [
      script,
      '--seed',
      '--out',
      `tmp/cli-contract-${script.split('/').at(-1)}.md`,
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/사용법|Usage/);
  });

  it.each([
    ['20260728tail'],
    ['1.5'],
    ['-1'],
    ['0'],
  ])('--seed %s를 거부하고 사용법을 출력한다', (value) => {
    const result = spawnSync(process.execPath, [
      script,
      '--seed',
      value,
      '--out',
      `tmp/cli-contract-${script.split('/').at(-1)}.md`,
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/사용법|Usage/);
  });
});
