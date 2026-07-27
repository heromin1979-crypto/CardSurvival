import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('fixture와 실제 roster 검증 경계', () => {
  it('일반 몬스터 fixture 테스트는 실제 roster를 import하지 않는다', () => {
    const source = readFileSync(
      new URL('./NormalEnemyPatternData.test.js', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain("from '../../js/data/enemies.js'");
    expect(source).not.toContain('EXPECTED_PATTERNS');
    expect(source).not.toContain('EXPECTED_ACTION_CONTRACTS');
  });

  it('동료 fixture 테스트는 실제 동료 roster를 import하지 않는다', () => {
    const source = readFileSync(
      new URL('./CompanionPatternData.test.js', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain('COMPANION_COMBAT_LOADOUTS');
    expect(source).not.toContain('COMPANION_TACTICS');
  });
});
