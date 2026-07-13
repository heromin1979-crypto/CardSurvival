import { describe, expect, it, vi } from 'vitest';
import {
  CHARACTER_COMBAT_LOADOUTS,
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
  getCombatSkill,
} from '../../js/data/combatSkills.js';
import {
  buildAllyLoadout,
  buildEquipmentSkill,
  executeSkillCommand,
  useCombatItem,
  validateSkillCommand,
} from '../../js/systems/combat/CombatSkillSystem.js';
import { en, ko } from '../../js/data/locales.js';
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

function makeCommandContext(overrides = {}) {
  const actor = {
    id: 'player',
    side: 'ally',
    rank: 1,
    currentHp: 20,
  };
  const target = {
    id: 'zombie',
    side: 'enemy',
    rank: 1,
    currentHp: 15,
  };
  const skill = {
    id: 'strike',
    costs: {},
    accuracy: 1,
    effects: [{ type: 'damage', value: [4, 4] }],
  };

  return {
    activeCombatantId: 'player',
    combatants: [actor, target],
    skillsById: { strike: skill },
    validatePosition: () => ({ ok: true }),
    getStamina: () => 10,
    getAmmo: () => 1,
    getDurability: () => 5,
    consumeCosts: vi.fn(() => ({ ok: true })),
    applyEffect: vi.fn(() => ({ ok: true })),
    consumeCombatItem: vi.fn(() => ({ ok: true, effects: ['patched'] })),
    ...overrides,
  };
}

const strikeCommand = {
  actorId: 'player',
  targetId: 'zombie',
  skillId: 'strike',
};

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

  it('has localized labels for every declared combat skill', () => {
    for (const skill of Object.values(COMBAT_SKILLS)) {
      expect(ko[skill.nameKey], `${skill.id} ko label`).toBeTypeOf('string');
      expect(ko[skill.nameKey], `${skill.id} ko label`).not.toBe(skill.nameKey);
      expect(en[skill.nameKey], `${skill.id} en label`).toBeTypeOf('string');
      expect(en[skill.nameKey], `${skill.id} en label`).not.toBe(skill.nameKey);
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

describe('validateSkillCommand', () => {
  it.each([
    ['invalid actor', { actorId: 'missing' }, 'invalid_actor'],
    ['dead actor', { mutate: (ctx) => { ctx.combatants[0].dead = true; } }, 'invalid_actor'],
    ['not active actor', { activeCombatantId: 'companion' }, 'not_active_actor'],
    ['invalid target', { targetId: 'missing' }, 'invalid_target'],
    ['dead target', { mutate: (ctx) => { ctx.combatants[1].dead = true; } }, 'invalid_target'],
    ['invalid skill', { skillId: 'missing' }, 'invalid_skill'],
    ['position error', { validatePosition: () => ({ ok: false, reason: 'out_of_range' }) }, 'out_of_range'],
    ['insufficient stamina', { skill: { costs: { stamina: 4 } }, getStamina: () => 3 }, 'insufficient_stamina'],
    ['insufficient ammo', { skill: { costs: { ammo: 'pistol_ammo' } }, getAmmo: () => 0 }, 'insufficient_ammo'],
    ['insufficient durability', { skill: { costs: { durability: 2 }, equipmentInstanceId: 'knife_1' }, getDurability: () => 1 }, 'insufficient_durability'],
  ])('rejects %s', (_, setup, reason) => {
    const overrides = {};
    for (const key of [
      'activeCombatantId',
      'validatePosition',
      'getStamina',
      'getAmmo',
      'getDurability',
    ]) {
      if (Object.hasOwn(setup, key)) overrides[key] = setup[key];
    }
    const ctx = makeCommandContext(overrides);
    if (setup.skill) {
      ctx.skillsById.strike = {
        ...ctx.skillsById.strike,
        ...setup.skill,
      };
    }
    setup.mutate?.(ctx);

    const result = validateSkillCommand(ctx, {
      ...strikeCommand,
      actorId: setup.actorId ?? strikeCommand.actorId,
      targetId: setup.targetId ?? strikeCommand.targetId,
      skillId: setup.skillId ?? strikeCommand.skillId,
    });

    expect(result).toEqual({ ok: false, reason });
  });

  it('returns invalid_context for malformed context or command without throwing', () => {
    expect(validateSkillCommand(null, strikeCommand))
      .toEqual({ ok: false, reason: 'invalid_context' });
    expect(validateSkillCommand(makeCommandContext(), null))
      .toEqual({ ok: false, reason: 'invalid_context' });
    expect(validateSkillCommand(makeCommandContext(), { ...strikeCommand, actorId: '' }))
      .toEqual({ ok: false, reason: 'invalid_context' });
  });

  it('returns position callback failures unchanged', () => {
    const positionFailure = {
      ok: false,
      reason: 'blocked_by_ally',
      lane: 1,
    };
    const ctx = makeCommandContext({
      validatePosition: () => positionFailure,
    });

    expect(validateSkillCommand(ctx, strikeCommand)).toBe(positionFailure);
  });

  it('treats deathsDoor targets as valid when they are not dead', () => {
    const ctx = makeCommandContext();
    ctx.combatants[1].currentHp = 0;
    ctx.combatants[1].deathsDoor = true;

    const result = validateSkillCommand(ctx, strikeCommand);

    expect(result.ok).toBe(true);
    expect(result.target).toBe(ctx.combatants[1]);
  });

  it('returns actor target and skill references on success', () => {
    const ctx = makeCommandContext();

    const result = validateSkillCommand(ctx, strikeCommand);

    expect(result).toEqual({
      ok: true,
      actor: ctx.combatants[0],
      target: ctx.combatants[1],
      skill: ctx.skillsById.strike,
    });
  });

  it('does not call execution callbacks when validation fails', () => {
    const ctx = makeCommandContext({ getStamina: () => 0 });
    ctx.skillsById.strike = {
      ...ctx.skillsById.strike,
      costs: { stamina: 1 },
    };

    const result = executeSkillCommand(ctx, strikeCommand, () => 0);

    expect(result).toEqual({ ok: false, reason: 'insufficient_stamina' });
    expect(ctx.consumeCosts).not.toHaveBeenCalled();
    expect(ctx.applyEffect).not.toHaveBeenCalled();
  });
});

describe('executeSkillCommand', () => {
  it('consumes costs and applies no effects on a miss', () => {
    const ctx = makeCommandContext();
    ctx.skillsById.strike.accuracy = 0.25;

    const result = executeSkillCommand(ctx, strikeCommand, () => 0.8);

    expect(result).toEqual({
      ok: true,
      hit: false,
      turnConsumed: true,
      costsConsumed: true,
      effectsApplied: 0,
      partialApplied: false,
    });
    expect(ctx.consumeCosts).toHaveBeenCalledOnce();
    expect(ctx.consumeCosts).toHaveBeenCalledWith(ctx.combatants[0], ctx.skillsById.strike);
    expect(ctx.applyEffect).not.toHaveBeenCalled();
  });

  it('applies all effects in order on hit', () => {
    const ctx = makeCommandContext();
    ctx.skillsById.strike.effects = [
      { type: 'damage', value: [2, 2] },
      { type: 'status', status: { id: 'bleed' } },
    ];
    const random = () => 0.1;

    const result = executeSkillCommand(ctx, strikeCommand, random);

    expect(result).toEqual({
      ok: true,
      hit: true,
      turnConsumed: true,
      costsConsumed: true,
      effectsApplied: 2,
      partialApplied: false,
    });
    expect(ctx.applyEffect.mock.calls.map(([effect]) => effect)).toEqual(ctx.skillsById.strike.effects);
    expect(ctx.applyEffect.mock.calls[0].slice(1)).toEqual([
      ctx.combatants[0],
      ctx.combatants[1],
      random,
    ]);
  });

  it('treats malformed effects as an empty list', () => {
    const ctx = makeCommandContext();
    ctx.skillsById.strike.effects = null;

    const result = executeSkillCommand(ctx, strikeCommand, () => 0);

    expect(result).toEqual({
      ok: true,
      hit: true,
      turnConsumed: true,
      costsConsumed: true,
      effectsApplied: 0,
      partialApplied: false,
    });
    expect(ctx.applyEffect).not.toHaveBeenCalled();
  });

  it('reports consumeCost throws as retry-safe pre-execution failures', () => {
    const consumeCtx = makeCommandContext({
      consumeCosts: vi.fn(() => {
        throw new Error('consume failed');
      }),
    });

    expect(executeSkillCommand(consumeCtx, strikeCommand, () => 0))
      .toEqual({
        ok: false,
        reason: 'execution_error',
        turnConsumed: false,
        costsConsumed: false,
        partialApplied: false,
        effectsApplied: 0,
      });
    expect(consumeCtx.applyEffect).not.toHaveBeenCalled();
  });

  it('preserves consumeCosts soft-fail reasons before applying effects', () => {
    const ctx = makeCommandContext({
      consumeCosts: vi.fn(() => ({ ok: false, reason: 'stamina_spent_elsewhere' })),
    });

    expect(executeSkillCommand(ctx, strikeCommand, () => 0))
      .toEqual({
        ok: false,
        reason: 'stamina_spent_elsewhere',
        turnConsumed: false,
        costsConsumed: false,
        partialApplied: false,
        effectsApplied: 0,
      });
    expect(ctx.applyEffect).not.toHaveBeenCalled();
  });

  it('reports effect throws after consumed costs with partial execution metadata', () => {
    const effectCtx = makeCommandContext({
      applyEffect: vi.fn(() => {
        throw new Error('effect failed');
      }),
    });

    expect(executeSkillCommand(effectCtx, strikeCommand, () => 0))
      .toEqual({
        ok: false,
        reason: 'execution_error',
        turnConsumed: true,
        costsConsumed: true,
        partialApplied: false,
        effectsApplied: 0,
      });
    expect(effectCtx.consumeCosts).toHaveBeenCalledOnce();
  });

  it('reports effect soft-fails after prior effects with partial execution metadata', () => {
    const ctx = makeCommandContext();
    ctx.skillsById.strike.effects = [
      { type: 'damage', value: [2, 2] },
      { type: 'status', status: { id: 'bleed' } },
    ];
    ctx.applyEffect = vi.fn()
      .mockReturnValueOnce({ ok: true })
      .mockReturnValueOnce({ ok: false, reason: 'status_resisted' });

    expect(executeSkillCommand(ctx, strikeCommand, () => 0))
      .toEqual({
        ok: false,
        reason: 'status_resisted',
        turnConsumed: true,
        costsConsumed: true,
        partialApplied: true,
        effectsApplied: 1,
      });
  });

  it('does not consume costs when applyEffect callback is missing for a hitting effect skill', () => {
    const ctx = makeCommandContext({ applyEffect: undefined });

    const result = executeSkillCommand(ctx, strikeCommand, () => 0);

    expect(result).toEqual({
      ok: false,
      reason: 'execution_error',
      turnConsumed: false,
      costsConsumed: false,
      partialApplied: false,
      effectsApplied: 0,
    });
    expect(ctx.consumeCosts).not.toHaveBeenCalled();
  });

  it('uses strict hit checks and makes invalid random rolls miss safely', () => {
    const zeroAccuracyCtx = makeCommandContext();
    zeroAccuracyCtx.skillsById.strike.accuracy = 0;
    const invalidRollCtx = makeCommandContext();
    invalidRollCtx.skillsById.strike.accuracy = 1;
    const clampedFiniteCtx = makeCommandContext();
    clampedFiniteCtx.skillsById.strike.accuracy = 1;
    const defaultCtx = makeCommandContext();
    defaultCtx.skillsById.strike.accuracy = Number.NaN;

    expect(executeSkillCommand(zeroAccuracyCtx, strikeCommand, () => 0))
      .toEqual({
        ok: true,
        hit: false,
        turnConsumed: true,
        costsConsumed: true,
        effectsApplied: 0,
        partialApplied: false,
      });
    expect(executeSkillCommand(invalidRollCtx, strikeCommand, () => Number.NaN))
      .toEqual({
        ok: true,
        hit: false,
        turnConsumed: true,
        costsConsumed: true,
        effectsApplied: 0,
        partialApplied: false,
      });
    expect(executeSkillCommand(clampedFiniteCtx, strikeCommand, () => 1))
      .toEqual({
        ok: true,
        hit: true,
        turnConsumed: true,
        costsConsumed: true,
        effectsApplied: 1,
        partialApplied: false,
      });
    expect(executeSkillCommand(defaultCtx, strikeCommand, () => 0.75))
      .toEqual({
        ok: true,
        hit: false,
        turnConsumed: true,
        costsConsumed: true,
        effectsApplied: 0,
        partialApplied: false,
      });
  });
});

describe('useCombatItem', () => {
  it('uses a combat item as a free action once per turn', () => {
    const ctx = makeCommandContext();

    const result = useCombatItem(ctx, 'player', 'bandage_1');

    expect(result).toEqual({
      ok: true,
      turnConsumed: false,
      effects: ['patched'],
    });
    expect(ctx.consumeCombatItem).toHaveBeenCalledWith('bandage_1', ctx.combatants[0]);
    expect(ctx.combatants[0].itemUsedThisTurn).toBe(true);
    expect(useCombatItem(ctx, 'player', 'bandage_2'))
      .toEqual({ ok: false, reason: 'item_already_used' });
  });

  it.each([
    ['invalid actor', { actorId: 'missing' }, 'invalid_actor'],
    ['not active actor', { activeCombatantId: 'companion' }, 'not_active_actor'],
    ['missing callback', { consumeCombatItem: undefined }, 'item_unavailable'],
  ])('rejects %s without setting itemUsedThisTurn', (_, setup, reason) => {
    const ctx = makeCommandContext(setup);

    const result = useCombatItem(ctx, setup.actorId ?? 'player', 'bandage_1');

    expect(result).toEqual({ ok: false, reason });
    expect(ctx.combatants[0].itemUsedThisTurn).toBeUndefined();
  });

  it('does not set itemUsedThisTurn when callback fails', () => {
    const itemFailure = {
      ok: false,
      reason: 'no_charge',
      itemInstanceId: 'bandage_1',
    };
    const ctx = makeCommandContext({
      consumeCombatItem: vi.fn(() => itemFailure),
    });

    const result = useCombatItem(ctx, 'player', 'bandage_1');

    expect(result).toBe(itemFailure);
    expect(ctx.combatants[0].itemUsedThisTurn).toBeUndefined();
  });

  it.each([
    ['undefined', undefined, 'item_unavailable'],
    ['null', null, 'item_unavailable'],
    ['empty object', {}, 'item_unavailable'],
    ['false without reason', { ok: false }, 'item_unavailable'],
  ])('requires explicit ok:true item callback result for %s', (_, callbackResult, reason) => {
    const ctx = makeCommandContext({
      consumeCombatItem: vi.fn(() => callbackResult),
    });

    const result = useCombatItem(ctx, 'player', 'bandage_1');

    expect(result).toEqual({ ok: false, reason });
    expect(ctx.combatants[0].itemUsedThisTurn).toBeUndefined();
  });

  it('wraps consumeCombatItem throws as item_error', () => {
    const ctx = makeCommandContext({
      consumeCombatItem: vi.fn(() => {
        throw new Error('broken item');
      }),
    });

    const result = useCombatItem(ctx, 'player', 'bandage_1');

    expect(result).toEqual({ ok: false, reason: 'item_error' });
    expect(ctx.combatants[0].itemUsedThisTurn).toBeUndefined();
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
      weaponType: null,
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
  it('uses equipped weapons as the player attacks before non-attack character skills', () => {
    const gs = makeGameState();

    const loadout = buildAllyLoadout({ sourceType: 'player' }, gs);

    expect(loadout.map((skill) => skill.id)).toEqual([
      'equipment:knife_instance',
      'equipment:pistol_instance',
      'doctor_triage',
      'doctor_diagnose',
    ]);
  });

  it('scales companion attacks with equipped weapons, keeping utility skills', () => {
    const gs = makeGameState();

    const loadout = buildAllyLoadout({
      sourceType: 'companion',
      sourceId: 'npc_nurse',
    }, gs);

    // 장비 장착 동료: 장비 공격 스킬이 내재 공격(nurse_scalpel)을 대체하고 지원 스킬은 유지
    expect(loadout.map((skill) => skill.id)).toEqual([
      'equipment:knife_instance',
      'equipment:pistol_instance',
      'nurse_triage',
      'nurse_encourage',
    ]);
  });

  it('keeps innate companion attacks when no weapon is equipped', () => {
    const gs = makeGameState();
    gs.npcs.states.npc_nurse = {};

    const loadout = buildAllyLoadout({
      sourceType: 'companion',
      sourceId: 'npc_nurse',
    }, gs);

    expect(loadout.map((skill) => skill.id)).toEqual(COMPANION_COMBAT_LOADOUTS.npc_nurse);
  });

  it('gives combat-flavored attacks to companions that have no equipment concept', () => {
    const gs = makeGameState();
    gs.npcs.states = {};

    expect(buildAllyLoadout({
      sourceType: 'companion',
      sourceId: 'npc_dog',
    }, gs).map((skill) => skill.id)).toEqual([
      'dog_bite',
      'dog_guard',
      'dog_track_weakness',
    ]);

    expect(buildAllyLoadout({
      sourceType: 'companion',
      sourceId: 'npc_soldier_deserter',
    }, gs).map((skill) => skill.id)).toEqual([
      'deserter_rifle_shot',
      'deserter_covering_fire',
      'deserter_reposition',
    ]);
  });

  it('does not grant soldier shot skills without an equipped firearm', () => {
    const gs = makeGameState();
    gs.player.characterId = 'soldier';
    gs.player.equipped = {};

    expect(buildAllyLoadout({ sourceType: 'player' }, gs)
      .map((skill) => skill.id)).toEqual([
      'basic_strike',
      'soldier_tactical_shift',
    ]);
  });

  it('uses the equipped melee weapon attack instead of soldier shot skills', () => {
    const gs = makeGameState();
    gs.player.characterId = 'soldier';
    gs.player.equipped = { weapon_main: 'knife_instance' };

    expect(buildAllyLoadout({ sourceType: 'player' }, gs)
      .map((skill) => skill.id)).toEqual([
      'equipment:knife_instance',
      'soldier_tactical_shift',
    ]);
  });

  it('uses the equipped firearm attack instead of innate soldier shot skills', () => {
    const gs = makeGameState();
    gs.player.characterId = 'soldier';
    gs.player.equipped = { weapon_main: 'pistol_instance' };

    expect(buildAllyLoadout({ sourceType: 'player' }, gs)
      .map((skill) => skill.id)).toEqual([
      'equipment:pistol_instance',
      'soldier_tactical_shift',
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
      .toHaveLength(3);

    gs.player.equipped.weapon_main = 'missing_instance';
    gs.player.equipped.weapon_sub = null;

    expect(buildAllyLoadout({ sourceType: 'player' }, gs)
      .map((skill) => skill.id)).toEqual([
      'basic_strike',
      'doctor_triage',
      'doctor_diagnose',
    ]);
  });

  it('returns fallback attack and non-attack character skills when getCardDef is missing or throws', () => {
    const withoutGetter = makeGameState();
    delete withoutGetter.getCardDef;

    expect(buildAllyLoadout({ sourceType: 'player' }, withoutGetter)
      .map((skill) => skill.id)).toEqual([
      'basic_strike',
      'doctor_triage',
      'doctor_diagnose',
    ]);

    const throwingGetter = makeGameState();
    throwingGetter.getCardDef = () => {
      throw new Error('broken registry');
    };

    expect(buildAllyLoadout({ sourceType: 'player' }, throwingGetter)
      .map((skill) => skill.id)).toEqual([
      'basic_strike',
      'doctor_triage',
      'doctor_diagnose',
    ]);
  });

  it('isolates every returned loadout from skill data and other calls', () => {
    const first = buildAllyLoadout({ sourceType: 'player' }, makeGameState());
    const second = buildAllyLoadout({ sourceType: 'player' }, makeGameState());
    const original = buildEquipmentSkill('knife_instance', makeGameState().getCardDef('knife_instance'));

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

describe('executeSkillCommand with context.resolveHit (ranked pipeline)', () => {
  it('uses resolveHit verdict instead of the internal accuracy roll', () => {
    const resolveHit = vi.fn(() => ({ hit: false, dodged: true }));
    const ctx = makeCommandContext({ resolveHit });

    const result = executeSkillCommand(ctx, strikeCommand, () => 0);

    expect(resolveHit).toHaveBeenCalledWith(
      ctx.combatants[0],
      ctx.combatants[1],
      ctx.skillsById.strike,
      expect.any(Function),
    );
    expect(result).toMatchObject({
      ok: true,
      hit: false,
      dodged: true,
      turnConsumed: true,
      costsConsumed: true,
      effectsApplied: 0,
    });
    expect(ctx.applyEffect).not.toHaveBeenCalled();
  });

  it('passes hit metadata (crit) through to applyEffect as fifth argument', () => {
    const hitInfo = { hit: true, dodged: false, crit: true, critMultiplier: 2 };
    const ctx = makeCommandContext({ resolveHit: vi.fn(() => hitInfo) });

    const result = executeSkillCommand(ctx, strikeCommand, () => 0);

    expect(result).toMatchObject({ ok: true, hit: true, crit: true });
    expect(ctx.applyEffect).toHaveBeenCalledOnce();
    expect(ctx.applyEffect.mock.calls[0][4]).toBe(hitInfo);
  });

  it('treats resolveHit throws as post-cost execution errors', () => {
    const ctx = makeCommandContext({
      resolveHit: vi.fn(() => {
        throw new Error('broken resolver');
      }),
    });

    expect(executeSkillCommand(ctx, strikeCommand, () => 0)).toEqual({
      ok: false,
      reason: 'execution_error',
      turnConsumed: true,
      costsConsumed: true,
      partialApplied: false,
      effectsApplied: 0,
    });
  });
});
