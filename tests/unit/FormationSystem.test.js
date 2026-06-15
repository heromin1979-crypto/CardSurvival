import { describe, expect, it } from 'vitest';
import {
  createFormations,
  getRank,
  moveCombatant,
  validateSkillPosition,
} from '../../js/systems/combat/FormationSystem.js';

describe('createFormations', () => {
  it.each([
    [['player'], [null, null, null, 'player']],
    [['player', 'npc_nurse'], [null, null, 'npc_nurse', 'player']],
    [
      ['player', 'npc_nurse', 'npc_soldier'],
      [null, 'npc_soldier', 'npc_nurse', 'player'],
    ],
  ])('places up to three allies from rank 1', (allyIds, expected) => {
    expect(createFormations(allyIds, []).ally).toEqual(expected);
  });

  it('limits allies to three combatants', () => {
    const formations = createFormations(
      ['player', 'npc_nurse', 'npc_soldier', 'npc_extra'],
      [],
    );

    expect(formations.ally).toEqual([
      null,
      'npc_soldier',
      'npc_nurse',
      'player',
    ]);
  });

  it('places front and back enemies without collisions', () => {
    const enemies = [
      { combatantId: 'front_a', row: 'front' },
      { combatantId: 'back_a', row: 'back' },
      { combatantId: 'front_b', row: 'front' },
      { combatantId: 'back_b', row: 'back' },
    ];

    expect(createFormations([], enemies).enemy).toEqual([
      'front_a',
      'front_b',
      'back_a',
      'back_b',
    ]);
  });

  it('limits enemies to four combatants', () => {
    const enemies = [
      { combatantId: 'e1', row: 'front' },
      { combatantId: 'e2', row: 'front' },
      { combatantId: 'e3', row: 'back' },
      { combatantId: 'e4', row: 'back' },
      { combatantId: 'e5', row: 'front' },
    ];

    expect(createFormations([], enemies).enemy).toEqual([
      'e1',
      'e2',
      'e3',
      'e4',
    ]);
  });
});

describe('getRank', () => {
  it('accounts for opposite ally and enemy array directions', () => {
    const formations = {
      ally: ['ally_rank_4', null, null, 'ally_rank_1'],
      enemy: ['enemy_rank_1', null, null, 'enemy_rank_4'],
    };

    expect(getRank(formations, 'ally_rank_1')).toBe(1);
    expect(getRank(formations, 'ally_rank_4')).toBe(4);
    expect(getRank(formations, 'enemy_rank_1')).toBe(1);
    expect(getRank(formations, 'enemy_rank_4')).toBe(4);
    expect(getRank(formations, 'missing')).toBeNull();
  });
});

describe('moveCombatant', () => {
  it('moves into an empty rank and preserves the vacated slot', () => {
    const formations = createFormations(['player'], []);

    expect(moveCombatant(formations, 'player', 3)).toBe(true);
    expect(formations.ally).toEqual([null, 'player', null, null]);
  });

  it.each([
    ['occupied destination', 'player', 2],
    ['rank below range', 'player', 0],
    ['rank above range', 'player', 5],
    ['missing combatant', 'missing', 2],
  ])('fails without mutation for %s', (_case, combatantId, destinationRank) => {
    const formations = createFormations(['player', 'npc_nurse'], []);
    const before = structuredClone(formations);

    expect(moveCombatant(formations, combatantId, destinationRank)).toBe(false);
    expect(formations).toEqual(before);
  });

  it('does not allow movement through another combatant', () => {
    const formations = {
      ally: [null, null, 'npc_nurse', 'player'],
      enemy: [null, null, null, null],
    };
    const before = structuredClone(formations);

    expect(moveCombatant(formations, 'player', 3)).toBe(false);
    expect(formations).toEqual(before);
  });
});

describe('validateSkillPosition', () => {
  const formations = {
    ally: [null, null, 'npc_nurse', 'player'],
    enemy: ['enemy_front', null, 'enemy_back', null],
  };

  const skill = {
    usableFrom: [1],
    target: {
      side: 'enemy',
      ranks: [1],
    },
  };

  it('accepts a skill with a valid origin, target side, and target rank', () => {
    expect(
      validateSkillPosition(formations, 'player', 'enemy_front', skill),
    ).toEqual({ ok: true });
  });

  it.each([
    ['missing actor', 'missing', 'enemy_front', skill, 'invalid_actor'],
    ['missing target', 'player', 'missing', skill, 'invalid_target'],
    [
      'invalid origin rank',
      'npc_nurse',
      'enemy_front',
      skill,
      'invalid_origin_rank',
    ],
    [
      'invalid target side',
      'player',
      'npc_nurse',
      skill,
      'invalid_target_side',
    ],
    [
      'invalid target rank',
      'player',
      'enemy_back',
      skill,
      'invalid_target_rank',
    ],
  ])(
    'rejects %s without mutating inputs',
    (_case, actorId, targetId, testedSkill, reason) => {
      const formationsBefore = structuredClone(formations);
      const skillBefore = structuredClone(testedSkill);

      expect(
        validateSkillPosition(formations, actorId, targetId, testedSkill),
      ).toEqual({ ok: false, reason });
      expect(formations).toEqual(formationsBefore);
      expect(testedSkill).toEqual(skillBefore);
    },
  );
});
