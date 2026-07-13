import { describe, expect, it } from 'vitest';
import {
  compactEnemyFormation,
  createFormations,
  getRank,
  moveCombatant,
  validateSkillPosition,
} from '../../js/systems/combat/FormationSystem.js';

describe('createFormations', () => {
  it.each([null, undefined, {}, 'player'])(
    'normalizes non-array ally input %p to a dense empty formation',
    (allyIds) => {
      const formations = createFormations(allyIds, []);

      expect(formations.ally).toEqual([null, null, null, null]);
      expect(Object.keys(formations.ally)).toEqual(['0', '1', '2', '3']);
    },
  );

  it.each([null, undefined, {}, 'enemy'])(
    'normalizes non-array enemy input %p to a dense empty formation',
    (enemies) => {
      const formations = createFormations([], enemies);

      expect(formations.enemy).toEqual([null, null, null, null]);
      expect(Object.keys(formations.enemy)).toEqual(['0', '1', '2', '3']);
    },
  );

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

  it('filters invalid and sparse ally IDs before applying the three ally limit', () => {
    const allyIds = [];
    allyIds[1] = null;
    allyIds[2] = 'player';
    allyIds[4] = undefined;
    allyIds[5] = '';
    allyIds[6] = ' ';
    allyIds[7] = 'npc_nurse';
    allyIds[8] = 'npc_soldier';

    expect(createFormations(allyIds, []).ally).toEqual([
      null,
      'npc_nurse',
      ' ',
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

  it('filters invalid and sparse enemies before applying the four enemy limit', () => {
    const enemies = [];
    enemies[1] = null;
    enemies[2] = { combatantId: 'front_a', row: 'front' };
    enemies[4] = { row: 'front' };
    enemies[5] = { combatantId: '' };
    enemies[6] = { combatantId: ' ', row: 'back' };
    enemies[7] = { combatantId: 'front_b', row: 'front' };
    enemies[8] = { combatantId: 'back_b', row: 'back' };
    enemies[9] = { combatantId: 'ignored', row: 'front' };

    expect(createFormations([], enemies).enemy).toEqual([
      'front_a',
      'front_b',
      ' ',
      'back_b',
    ]);
  });
});

describe('compactEnemyFormation', () => {
  it('pulls surviving back-rank enemies forward when front ranks are empty', () => {
    const formations = {
      ally: [null, null, null, 'player'],
      enemy: [null, null, 'enemy_back', null],
    };
    const combatants = {
      enemy_back: { id: 'enemy_back', side: 'enemy', hp: 40, dead: false },
    };

    expect(compactEnemyFormation(formations, combatants)).toBe(true);
    expect(formations.enemy).toEqual(['enemy_back', null, null, null]);
    expect(getRank(formations, 'enemy_back')).toBe(1);
  });

  it('removes dead enemies while preserving living enemy order', () => {
    const formations = {
      ally: [null, null, null, 'player'],
      enemy: ['dead_front', null, 'back_a', 'back_b'],
    };
    const combatants = {
      dead_front: { id: 'dead_front', side: 'enemy', hp: 0, dead: true },
      back_a: { id: 'back_a', side: 'enemy', hp: 15, dead: false },
      back_b: { id: 'back_b', side: 'enemy', hp: 20, dead: false },
    };

    expect(compactEnemyFormation(formations, combatants)).toBe(true);
    expect(formations.enemy).toEqual(['back_a', 'back_b', null, null]);
  });

  it('does not report movement when the enemy formation is already compact', () => {
    const formations = {
      ally: [null, null, null, 'player'],
      enemy: ['front_a', 'front_b', null, null],
    };
    const combatants = {
      front_a: { id: 'front_a', side: 'enemy', hp: 10, dead: false },
      front_b: { id: 'front_b', side: 'enemy', hp: 10, dead: false },
    };

    expect(compactEnemyFormation(formations, combatants)).toBe(false);
    expect(formations.enemy).toEqual(['front_a', 'front_b', null, null]);
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

  it.each([null, undefined])(
    'does not treat the empty slot value %p as a combatant ID',
    (combatantId) => {
      const formations = {
        ally: [null, undefined, null, 'player'],
        enemy: [null, null, null, null],
      };

      expect(getRank(formations, combatantId)).toBeNull();
    },
  );

  it.each([42, {}, '', null, undefined])(
    'returns null for invalid slot value %p',
    (invalidSlot) => {
      const formations = {
        ally: [invalidSlot, null, null, 'player'],
        enemy: [null, null, null, null],
      };

      expect(getRank(formations, invalidSlot)).toBeNull();
    },
  );

  it.each([null, undefined, {}, [], 'invalid'])(
    'returns null for malformed formations %p',
    (formations) => {
      expect(getRank(formations, 'player')).toBeNull();
    },
  );
});

describe('moveCombatant', () => {
  it('moves into an empty rank and preserves the vacated slot', () => {
    const formations = createFormations(['player'], []);

    expect(moveCombatant(formations, 'player', 3)).toBe(true);
    expect(formations.ally).toEqual([null, 'player', null, null]);
  });

  it('moves through invalid slots and normalizes only the moved formation', () => {
    const enemy = [undefined, 'enemy', 9];
    const formations = {
      ally: [42, {}, '', 'player'],
      enemy,
    };
    const enemyBefore = structuredClone(enemy);

    expect(moveCombatant(formations, 'player', 4)).toBe(true);
    expect(formations.ally).toEqual(['player', null, null, null]);
    expect(formations.enemy).toBe(enemy);
    expect(formations.enemy).toEqual(enemyBefore);
  });

  it.each([
    ['ally forward', { ally: [null, null, null, 'player'], enemy: [] }, 'player', 3],
    ['ally backward', { ally: [null, 'player', null, null], enemy: [] }, 'player', 1],
    ['enemy forward', { ally: [], enemy: ['enemy', null, null, null] }, 'enemy', 3],
    ['enemy backward', { ally: [], enemy: [null, null, 'enemy', null] }, 'enemy', 1],
  ])('supports %s movement and normalizes only the moved formation', (
    _case,
    formations,
    combatantId,
    destinationRank,
  ) => {
    const movedSide = combatantId === 'player' ? 'ally' : 'enemy';
    const otherSide = movedSide === 'ally' ? 'enemy' : 'ally';
    const otherFormation = formations[otherSide];
    const otherBefore = structuredClone(otherFormation);

    expect(moveCombatant(formations, combatantId, destinationRank)).toBe(true);
    expect(formations[movedSide]).toHaveLength(4);
    expect(Object.keys(formations[movedSide])).toEqual(['0', '1', '2', '3']);
    expect(formations[movedSide].every((slot) => slot !== undefined)).toBe(true);
    expect(formations[otherSide]).toBe(otherFormation);
    expect(formations[otherSide]).toEqual(otherBefore);
    expect(getRank(formations, combatantId)).toBe(destinationRank);
  });

  it('swaps with a same-side occupant in an adjacent rank', () => {
    const formations = createFormations(['player', 'npc_nurse'], []);

    expect(moveCombatant(formations, 'player', 2)).toBe(true);
    expect(getRank(formations, 'player')).toBe(2);
    expect(getRank(formations, 'npc_nurse')).toBe(1);
  });

  it('refuses to swap into a non-adjacent occupied rank', () => {
    const formations = { ally: ['npc_a', null, null, 'player'], enemy: [] };
    const before = structuredClone(formations);

    expect(moveCombatant(formations, 'player', 4)).toBe(false);
    expect(formations).toEqual(before);
  });

  it.each([
    ['rank below range', 'player', 0],
    ['rank above range', 'player', 5],
    ['missing combatant', 'missing', 2],
    ['null combatant', null, 3],
  ])('fails without mutation for %s', (_case, combatantId, destinationRank) => {
    const formations = createFormations(['player', 'npc_nurse'], []);
    const before = structuredClone(formations);

    expect(moveCombatant(formations, combatantId, destinationRank)).toBe(false);
    expect(formations).toEqual(before);
  });

  it('leaves external formations unchanged when movement fails', () => {
    const formations = {
      ally: ['blocker', {}, '', 'player'],
      enemy: [undefined, 'enemy', 9],
    };
    const ally = formations.ally;
    const enemy = formations.enemy;
    const before = structuredClone(formations);

    expect(moveCombatant(formations, 'player', 4)).toBe(false);
    expect(formations).toEqual(before);
    expect(formations.ally).toBe(ally);
    expect(formations.enemy).toBe(enemy);
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

  it('does not allow an enemy to move through another combatant', () => {
    const formations = {
      ally: [null, null, null, null],
      enemy: ['enemy_front', 'enemy_blocker', null, null],
    };
    const before = structuredClone(formations);

    expect(moveCombatant(formations, 'enemy_front', 3)).toBe(false);
    expect(formations).toEqual(before);
  });

  it.each([null, undefined, {}, [], 'invalid'])(
    'fails without throwing for malformed formations %p',
    (formations) => {
      const before = typeof formations === 'object'
        ? structuredClone(formations)
        : formations;

      expect(moveCombatant(formations, 'player', 3)).toBe(false);
      expect(formations).toEqual(before);
    },
  );
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
    ['missing skill', undefined],
    ['null skill', null],
    ['primitive skill', 1],
    ['missing usableFrom', {}],
    ['string usableFrom', { usableFrom: '1' }],
    ['object usableFrom', { usableFrom: {} }],
  ])('rejects %s as invalid_origin_rank', (_case, testedSkill) => {
    expect(
      validateSkillPosition(
        formations,
        'player',
        'enemy_front',
        testedSkill,
      ),
    ).toEqual({ ok: false, reason: 'invalid_origin_rank' });
  });

  it.each([
    ['missing target', { usableFrom: [1] }],
    ['null target', { usableFrom: [1], target: null }],
    ['primitive target', { usableFrom: [1], target: 1 }],
    [
      'missing target side',
      { usableFrom: [1], target: { ranks: [1] } },
    ],
    [
      'non-string target side',
      { usableFrom: [1], target: { side: 1, ranks: [1] } },
    ],
  ])('rejects %s as invalid_target_side', (_case, testedSkill) => {
    expect(
      validateSkillPosition(
        formations,
        'player',
        'enemy_front',
        testedSkill,
      ),
    ).toEqual({ ok: false, reason: 'invalid_target_side' });
  });

  it.each([
    ['missing target ranks', undefined],
    ['null target ranks', null],
    ['string target ranks', '1'],
    ['number target ranks', 1],
    ['object target ranks', {}],
  ])('rejects %s as invalid_target_rank', (_case, ranks) => {
    const testedSkill = {
      usableFrom: [1],
      target: { side: 'enemy', ranks },
    };

    expect(
      validateSkillPosition(
        formations,
        'player',
        'enemy_front',
        testedSkill,
      ),
    ).toEqual({ ok: false, reason: 'invalid_target_rank' });
  });

  it('validates actor and target existence before the skill contract', () => {
    expect(
      validateSkillPosition(formations, 'missing', 'enemy_front', null),
    ).toEqual({ ok: false, reason: 'invalid_actor' });
    expect(
      validateSkillPosition(formations, 'player', 'missing', null),
    ).toEqual({ ok: false, reason: 'invalid_target' });
  });

  it.each([null, undefined])(
    'rejects empty actor ID %p as invalid_actor',
    (actorId) => {
      expect(
        validateSkillPosition(formations, actorId, null, skill),
      ).toEqual({ ok: false, reason: 'invalid_actor' });
    },
  );

  it.each([null, undefined, {}, [], 'invalid'])(
    'rejects malformed formations %p as invalid_actor',
    (malformedFormations) => {
      expect(
        validateSkillPosition(
          malformedFormations,
          'player',
          'enemy_front',
          skill,
        ),
      ).toEqual({ ok: false, reason: 'invalid_actor' });
    },
  );

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
