import { describe, expect, it } from 'vitest';
import { validateCompanionPatternData } from '../../js/data/validate.js';

const validFixture = () => ({
  loadouts: { npc_test: ['test_attack', 'test_heal', 'test_guard'] },
  skills: {
    test_attack: { tacticalRole: 'damage', motionKey: 'melee', effects: [{ type: 'damage', value: [1, 2] }] },
    test_heal: { tacticalRole: 'heal', motionKey: 'support', effects: [{ type: 'heal', value: [1, 2] }] },
    test_guard: { tacticalRole: 'guard', motionKey: 'guard', effects: [{ type: 'guard', value: 0.2 }] },
  },
  tactics: { npc_test: { preferredStance: 'heal', priorities: [{ role: 'heal' }] } },
});

describe('동료 패턴 데이터 계약', () => {
  it('유효한 fixture는 오류 없이 통과한다', () => {
    expect(validateCompanionPatternData(validFixture())).toEqual([]);
  });

  it('자세와 우선순위 역할이 로드아웃에 없으면 오류를 반환한다', () => {
    const fixture = validFixture();
    fixture.tactics.npc_test = {
      preferredStance: 'guard',
      priorities: [{ role: 'damage' }, { role: 'missing' }],
    };
    fixture.loadouts.npc_test = ['test_heal'];

    expect(validateCompanionPatternData(fixture)).toEqual(expect.arrayContaining([
      '[companion tactic/npc_test] preferredStance role "guard" not found in loadout',
      '[companion tactic/npc_test] priorities[0] role "damage" not found in loadout',
      '[companion tactic/npc_test] priorities[1] role "missing" not found in loadout',
    ]));
  });

  it('selfOnly 기술은 ally 대상만 허용한다', () => {
    const fixture = validFixture();
    fixture.skills.test_guard = {
      ...fixture.skills.test_guard,
      target: { side: 'enemy', selfOnly: true },
    };

    expect(validateCompanionPatternData(fixture)).toContain(
      '[companion skill/test_guard] selfOnly target.side must be ally',
    );
  });

  it('heal 역할은 실제 heal 효과를 가져야 한다', () => {
    const fixture = validFixture();
    fixture.skills.test_heal.effects = [{ type: 'guard', value: 0.2 }];

    expect(validateCompanionPatternData(fixture)).toContain(
      '[companion skill/test_heal] heal tacticalRole must include a heal effect',
    );
  });

  it.each(['food', 'ration'])('%s 역할은 heal 효과를 가질 수 없다', (tacticalRole) => {
    const fixture = validFixture();
    fixture.skills.test_guard = {
      tacticalRole,
      motionKey: 'support',
      effects: [{ type: 'heal', value: [1, 2] }],
    };

    expect(validateCompanionPatternData(fixture)).toContain(
      `[companion skill/test_guard] ${tacticalRole} tacticalRole must not include a heal effect`,
    );
  });
});
