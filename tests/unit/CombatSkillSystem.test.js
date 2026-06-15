import { describe, expect, it } from 'vitest';
import {
  CHARACTER_COMBAT_LOADOUTS,
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
  getCombatSkill,
} from '../../js/data/combatSkills.js';
import {
  buildAllyLoadout,
  buildEquipmentSkill,
} from '../../js/systems/combat/CombatSkillSystem.js';
import { validateCombatSkillContracts } from '../../js/data/validate.js';

const PLAYER_IDS = [
  'doctor',
  'soldier',
  'firefighter',
  'homeless',
  'chef',
  'engineer',
];

const COMPANION_IDS = [
  'npc_old_survivor',
  'npc_nurse',
  'npc_soldier_deserter',
  'npc_child',
  'npc_mechanic',
  'npc_student',
  'npc_dog',
  'npc_former_colleague',
  'npc_minjun',
  'npc_sohee',
  'npc_jisu',
  'npc_yeongcheol',
  'npc_daehan',
  'npc_tower_security',
  'npc_tower_merchant',
  'npc_tower_cook',
  'npc_tower_engineer',
  'npc_tower_doctor',
  'npc_sous_chef',
  'npc_kitchen_helper',
];

const ALLOWED_EFFECT_TYPES = new Set([
  'damage',
  'heal',
  'token',
  'status',
  'move',
  'stress',
  'guard',
  'flee',
]);

function makeGameState() {
  const definitions = {
    knife_instance: {
      id: 'knife',
      name: 'Knife',
      icon: 'knife',
      combat: {
        damage: [8, 14],
        accuracy: 0.85,
        noiseOnUse: 0,
        durabilityLoss: 3,
        critChance: 0.3,
        critMultiplier: 2,
      },
    },
    pistol_instance: {
      id: 'pistol',
      name: 'Pistol',
      icon: 'pistol',
      multiTarget: 2,
      combat: {
        damage: [30, 45],
        accuracy: 0.7,
        noiseOnUse: 30,
        durabilityLoss: 1,
        requiresAmmo: 'pistol_ammo',
        critChance: 0.2,
        critMultiplier: 2,
        statusInflict: {
          id: 'bleed',
          duration: 2,
          chance: 0.4,
          effect: { hpPerRound: -4 },
        },
      },
    },
  };

  return {
    player: {
      characterId: 'doctor',
      equipped: {
        weapon_main: 'knife_instance',
        weapon_sub: 'pistol_instance',
      },
    },
    npcs: {
      states: {
        npc_nurse: {
          equippedWeapon: 'knife_instance',
          equippedTool: 'pistol_instance',
        },
      },
    },
    getCardDef(instanceId) {
      return definitions[instanceId] ?? null;
    },
  };
}

describe('combat skill data', () => {
  it('declares the common fallback skills', () => {
    expect(Object.keys(COMBAT_SKILLS)).toEqual(expect.arrayContaining([
      'basic_strike',
      'guard',
      'reposition',
    ]));
  });

  it.each(PLAYER_IDS)('%s has exactly three unique declared skills', (id) => {
    const skillIds = CHARACTER_COMBAT_LOADOUTS[id];

    expect(skillIds).toHaveLength(3);
    expect(new Set(skillIds).size).toBe(3);
    expect(skillIds.every((skillId) => getCombatSkill(skillId))).toBe(true);
  });

  it.each(COMPANION_IDS)('%s has exactly three unique declared skills', (id) => {
    const skillIds = COMPANION_COMBAT_LOADOUTS[id];

    expect(skillIds).toHaveLength(3);
    expect(new Set(skillIds).size).toBe(3);
    expect(skillIds.every((skillId) => getCombatSkill(skillId))).toBe(true);
  });

  it('contains only valid skill schema entries', () => {
    expect(Object.keys(COMBAT_SKILLS)).toHaveLength(81);

    for (const [skillId, skill] of Object.entries(COMBAT_SKILLS)) {
      expect(skill.id).toBe(skillId);
      expect(typeof skill.nameKey).toBe('string');
      expect(skill.nameKey.length).toBeGreaterThan(0);
      expect(skill.icon).toMatch(/^[\x20-\x7E]+$/);
      expect(skill.source).toBe('character');
      expect(Array.isArray(skill.usableFrom)).toBe(true);
      expect(skill.usableFrom.length).toBeGreaterThan(0);
      expect(skill.usableFrom.every((rank) => (
        Number.isInteger(rank) && rank >= 1 && rank <= 4
      ))).toBe(true);
      expect(['ally', 'enemy']).toContain(skill.target.side);
      expect(Array.isArray(skill.target.ranks)).toBe(true);
      expect(skill.target.ranks.length).toBeGreaterThan(0);
      expect(skill.target.ranks.every((rank) => (
        Number.isInteger(rank) && rank >= 1 && rank <= 4
      ))).toBe(true);
      expect(Number.isInteger(skill.target.count)).toBe(true);
      expect(skill.target.count).toBeGreaterThan(0);
      expect(skill.costs).toBeTypeOf('object');
      expect(skill.accuracy).toBeGreaterThanOrEqual(0);
      expect(skill.accuracy).toBeLessThanOrEqual(1);
      expect(Array.isArray(skill.effects)).toBe(true);
      expect(skill.effects.length).toBeGreaterThan(0);
      expect(skill.effects.every((effect) => (
        ALLOWED_EFFECT_TYPES.has(effect.type)
      ))).toBe(true);

      for (const effect of skill.effects) {
        if (effect.type === 'damage' || effect.type === 'heal') {
          expect(effect.value).toHaveLength(2);
          expect(effect.value.every(Number.isFinite)).toBe(true);
          expect(effect.value[0]).toBeLessThanOrEqual(effect.value[1]);
        }
        if (effect.type === 'token') {
          expect(Number.isInteger(effect.stacks)).toBe(true);
          expect(effect.stacks).toBeGreaterThan(0);
          expect(effect).not.toHaveProperty('amount');
        }
      }
    }
  });

  it('validator rejects token effects without positive integer stacks', () => {
    const result = validateCombatSkillContracts({
      bad_token: {
        id: 'bad_token',
        nameKey: 'combat.skill.bad_token',
        icon: 'token',
        source: 'character',
        usableFrom: [1],
        target: { side: 'enemy', ranks: [1], count: 1 },
        costs: {},
        accuracy: 1,
        effects: [{ type: 'token', token: 'vulnerable', amount: 1 }],
      },
    }, {}, {});

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      '[combat skill/bad_token] effects[0].stacks must be positive integer',
      '[combat skill/bad_token] effects[0].amount is not allowed for token effects',
    ]));
  });

  it('does not put ammo definition IDs on character firearm skills', () => {
    const firearmSkillIds = [
      'soldier_burst_fire',
      'soldier_suppressive_fire',
      'deserter_rifle_shot',
      'deserter_covering_fire',
      'minjun_pistol',
      'sohee_precise_shot',
    ];

    for (const skillId of firearmSkillIds) {
      expect(COMBAT_SKILLS[skillId].costs.ammo).toBeUndefined();
    }
  });

  it('returns null for unknown skill IDs', () => {
    expect(getCombatSkill('missing_skill')).toBeNull();
    expect(getCombatSkill('toString')).toBeNull();
    expect(getCombatSkill(null)).toBeNull();
  });
});

describe('buildEquipmentSkill', () => {
  it.each([
    [null, { combat: {} }],
    ['', { combat: {} }],
    ['knife_instance', null],
    ['knife_instance', {}],
    ['knife_instance', { combat: null }],
    ['knife_instance', { combat: [] }],
  ])('returns null for invalid input %#', (instanceId, definition) => {
    expect(buildEquipmentSkill(instanceId, definition)).toBeNull();
  });

  it('converts a legacy melee weapon without mutating its definition', () => {
    const definition = makeGameState().getCardDef('knife_instance');
    const before = structuredClone(definition);

    const skill = buildEquipmentSkill('knife_instance', definition);

    expect(skill).toEqual({
      id: 'equipment:knife_instance',
      nameKey: null,
      fallbackName: 'Knife',
      icon: 'knife',
      source: 'equipment',
      equipmentInstanceId: 'knife_instance',
      usableFrom: [1, 2],
      target: { side: 'enemy', ranks: [1, 2], count: 1 },
      costs: { ammo: null, durability: 3, noise: 0 },
      accuracy: 0.85,
      critChance: 0.3,
      critMultiplier: 2,
      effects: [{ type: 'damage', value: [8, 14] }],
    });
    expect(definition).toEqual(before);
  });

  it('uses nullish fallbackName precedence for equipment skills', () => {
    const baseDefinition = {
      combat: { damage: [1, 2] },
    };

    expect(buildEquipmentSkill('empty_name', {
      ...baseDefinition,
      name: '',
      id: 'fallback_id',
    }).fallbackName).toBe('');
    expect(buildEquipmentSkill('definition_id', {
      ...baseDefinition,
      name: null,
      id: 'fallback_id',
    }).fallbackName).toBe('fallback_id');
    expect(buildEquipmentSkill('instance_id', baseDefinition).fallbackName)
      .toBe('instance_id');
  });

  it('converts ranged, multi-target, and status data with isolated clones', () => {
    const definition = makeGameState().getCardDef('pistol_instance');

    const skill = buildEquipmentSkill('pistol_instance', definition);

    expect(skill.usableFrom).toEqual([2, 3, 4]);
    expect(skill.target).toEqual({
      side: 'enemy',
      ranks: [1, 2, 3, 4],
      count: 2,
    });
    expect(skill.costs).toEqual({
      ammo: 'pistol_ammo',
      durability: 1,
      noise: 30,
    });
    expect(skill.effects).toEqual([
      { type: 'damage', value: [30, 45] },
      {
        type: 'status',
        status: {
          id: 'bleed',
          duration: 2,
          chance: 0.4,
          effect: { hpPerRound: -4 },
        },
      },
    ]);
    expect(skill.effects[0].value).not.toBe(definition.combat.damage);
    expect(skill.effects[1].status).not.toBe(definition.combat.statusInflict);
    expect(skill.effects[1].status.effect)
      .not.toBe(definition.combat.statusInflict.effect);
  });

  it.each([
    false,
    '',
    {},
    [],
  ])('treats malformed requiresAmmo %# as melee with no ammo cost', (requiresAmmo) => {
    const skill = buildEquipmentSkill('bad_ammo', {
      id: 'bad_ammo',
      combat: {
        damage: [3, 5],
        requiresAmmo,
        statusInflict: [{ id: 'bleed' }],
      },
    });

    expect(skill.usableFrom).toEqual([1, 2]);
    expect(skill.target.ranks).toEqual([1, 2]);
    expect(skill.costs.ammo).toBeNull();
    expect(skill.effects).toEqual([{ type: 'damage', value: [3, 5] }]);
  });

  it.each([
    null,
    ['bleed'],
    'bleed',
  ])('ignores malformed statusInflict %#', (statusInflict) => {
    const skill = buildEquipmentSkill('bad_status', {
      id: 'bad_status',
      combat: {
        damage: [3, 5],
        statusInflict,
      },
    });

    expect(skill.effects).toEqual([{ type: 'damage', value: [3, 5] }]);
  });

  it('normalizes malformed combat values to safe defaults', () => {
    const skill = buildEquipmentSkill('broken', {
      id: 'broken',
      combat: {
        damage: [9, 2],
        accuracy: Number.NaN,
        durabilityLoss: -3,
        noiseOnUse: Infinity,
        critChance: 4,
        critMultiplier: 0,
      },
    });

    expect(skill.nameKey).toBeNull();
    expect(skill.fallbackName).toBe('broken');
    expect(skill.icon).toBe('weapon');
    expect(skill.costs).toEqual({
      ammo: null,
      durability: 0,
      noise: 0,
    });
    expect(skill.accuracy).toBe(0.7);
    expect(skill.critChance).toBe(1);
    expect(skill.critMultiplier).toBe(1.5);
    expect(skill.effects).toEqual([{ type: 'damage', value: [1, 2] }]);
  });
});

describe('buildAllyLoadout', () => {
  it('returns three player skills followed by up to two equipment skills', () => {
    const gs = makeGameState();

    const loadout = buildAllyLoadout({ sourceType: 'player' }, gs);

    expect(loadout.map((skill) => skill.id)).toEqual([
      ...CHARACTER_COMBAT_LOADOUTS.doctor,
      'equipment:knife_instance',
      'equipment:pistol_instance',
    ]);
  });

  it('returns three companion skills followed by companion equipment', () => {
    const gs = makeGameState();

    const loadout = buildAllyLoadout({
      sourceType: 'companion',
      sourceId: 'npc_nurse',
    }, gs);

    expect(loadout.map((skill) => skill.id)).toEqual([
      ...COMPANION_COMBAT_LOADOUTS.npc_nurse,
      'equipment:knife_instance',
      'equipment:pistol_instance',
    ]);
  });

  it('uses exactly the common fallback loadout for unknown combatants', () => {
    const loadout = buildAllyLoadout({
      sourceType: 'enemy',
      sourceId: 'zombie',
    }, makeGameState());

    expect(loadout.map((skill) => skill.id)).toEqual([
      'basic_strike',
      'guard',
      'reposition',
    ]);
  });

  it('uses the common fallback for an unknown player character ID', () => {
    const gs = makeGameState();
    gs.player.characterId = 'toString';
    gs.player.equipped = {};

    expect(buildAllyLoadout({ sourceType: 'player' }, gs)
      .map((skill) => skill.id)).toEqual([
      'basic_strike',
      'guard',
      'reposition',
    ]);
  });

  it('deduplicates equipment IDs and skips missing definitions safely', () => {
    const gs = makeGameState();
    gs.player.equipped.weapon_sub = 'knife_instance';

    expect(buildAllyLoadout({ sourceType: 'player' }, gs))
      .toHaveLength(4);

    gs.player.equipped.weapon_main = 'missing_instance';
    gs.player.equipped.weapon_sub = null;

    expect(buildAllyLoadout({ sourceType: 'player' }, gs))
      .toHaveLength(3);
  });

  it('returns character skills when getCardDef is missing or throws', () => {
    const withoutGetter = makeGameState();
    delete withoutGetter.getCardDef;

    expect(buildAllyLoadout({ sourceType: 'player' }, withoutGetter))
      .toHaveLength(3);

    const throwingGetter = makeGameState();
    throwingGetter.getCardDef = () => {
      throw new Error('broken registry');
    };

    expect(buildAllyLoadout({ sourceType: 'player' }, throwingGetter))
      .toHaveLength(3);
  });

  it('isolates every returned loadout from skill data and other calls', () => {
    const first = buildAllyLoadout({ sourceType: 'player' }, makeGameState());
    const second = buildAllyLoadout({ sourceType: 'player' }, makeGameState());
    const original = COMBAT_SKILLS[CHARACTER_COMBAT_LOADOUTS.doctor[0]];

    first[0].usableFrom.push(99);
    first[0].target.ranks.push(99);
    first[0].costs.stamina = 999;
    first[0].effects[0].value[0] = 999;

    expect(second[0]).toEqual(original);
    expect(first[0]).not.toBe(second[0]);
    expect(first[0].usableFrom).not.toBe(second[0].usableFrom);
    expect(first[0].target).not.toBe(second[0].target);
    expect(first[0].target.ranks).not.toBe(second[0].target.ranks);
    expect(first[0].costs).not.toBe(second[0].costs);
    expect(first[0].effects).not.toBe(second[0].effects);
    expect(first[0].effects[0]).not.toBe(second[0].effects[0]);
    expect(first[0].effects[0].value).not.toBe(second[0].effects[0].value);
  });
});
