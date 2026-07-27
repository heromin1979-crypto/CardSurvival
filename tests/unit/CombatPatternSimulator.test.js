import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('수동 동료 패턴 simulator 경계', () => {
  it('production 자동 planner API를 호출하지 않는다', () => {
    const source = readFileSync(
      new URL('../../tools/simulate_companion_monster_patterns.mjs', import.meta.url),
      'utf8',
    );

    expect(source).not.toContain('CombatSystem._planCompanionAction(');
    expect(source).not.toContain('CombatSystem._executePlannedCompanionAction(');
    expect(source).not.toContain('CombatSystem.requestCompanionPlan(');
    expect(source).not.toContain('CombatSystem._getCompanionStance(');
  });
});
