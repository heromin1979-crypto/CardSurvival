import { describe, it, expect, vi } from 'vitest';
import BALANCE from '../../js/data/gameBalance.js';
import {
  buildEnemyProfile,
  decideEnemyIntent,
} from '../../js/systems/combat/EnemyCombatAdapter.js';
import { validateEnemyCombatProfiles } from '../../js/data/validate.js';

describe('EnemyCombatAdapter', () => {
  it('converts legacy attack and front row into a basic enemy skill', () => {
    const profile = buildEnemyProfile({
      id: 'zombie_common',
      row: 'front',
      attack: { damage: [5, 8], accuracy: 0.7 },
      aiPattern: 'normal',
    });

    expect(profile).toMatchObject({
      speed: BALANCE.combat.defaultEnemySpeed,
      startRank: 1,
      ai: 'normal',
    });
    expect(profile.skills).toHaveLength(1);
    expect(profile.skills[0]).toMatchObject({
      id: 'enemy:zombie_common:basic_attack',
      source: 'enemy',
      usableFrom: [1, 2],
      target: { side: 'ally', ranks: [1, 2], count: 1 },
      accuracy: 0.7,
    });
    expect(profile.skills[0].effects[0]).toEqual({ type: 'damage', value: [5, 8] });
  });

  it('maps legacy back row and ranged attacks to rank-wide targeting', () => {
    const profile = buildEnemyProfile({
      id: 'raider_elite',
      position: 'back',
      attackType: 'ranged',
      attack: { damage: [18, 28], accuracy: 0.72 },
      aiPattern: 'sniper',
    });

    expect(profile.startRank).toBe(3);
    expect(profile.ai).toBe('sniper');
    expect(profile.skills[0].usableFrom).toEqual([1, 2, 3, 4]);
    expect(profile.skills[0].target.ranks).toEqual([1, 2, 3, 4]);
  });

  it('uses combatProfile before legacy fields', () => {
    const profile = buildEnemyProfile({
      id: 'zombie_charger',
      attack: { damage: [1, 2] },
      combatProfile: {
        speed: 8,
        startRank: 3,
        skillIds: ['charger_prepare', 'charger_strike'],
        skills: [{
          id: 'charger_prepare',
          source: 'enemy',
          usableFrom: [1],
          target: { side: 'ally', ranks: [1], count: 1 },
          accuracy: 1,
          effects: [{ type: 'damage', value: [1, 2] }],
        }],
        ai: 'charger',
      },
    });

    expect(profile).toMatchObject({
      speed: 8,
      startRank: 3,
      skillIds: ['charger_prepare', 'charger_strike'],
      ai: 'charger',
    });
    expect(profile.skills).toHaveLength(1);
    expect(profile.skills[0].id).toBe('charger_prepare');
  });

  it('copies arrays so callers cannot mutate source data through the profile', () => {
    const enemy = {
      id: 'zombie_screamer',
      combatProfile: {
        skillIds: ['scream_charge', 'scream_call'],
        skills: [{
          id: 'scream_charge',
          source: 'enemy',
          usableFrom: [1],
          target: { side: 'ally', ranks: [1], count: 1 },
          accuracy: 1,
          effects: [{ type: 'damage', value: [1, 1] }],
        }],
      },
    };

    const profile = buildEnemyProfile(enemy);
    profile.skillIds.push('mutated');
    profile.skills[0].effects[0].value[0] = 999;

    expect(enemy.combatProfile.skillIds).toEqual(['scream_charge', 'scream_call']);
    expect(enemy.combatProfile.skills[0].effects[0].value).toEqual([1, 1]);
  });

  it('falls back to balance defaults when legacy attack data is absent', () => {
    const profile = buildEnemyProfile({ id: 'unknown' });
    const skill = profile.skills[0];

    expect(profile.speed).toBe(BALANCE.combat.defaultEnemySpeed);
    expect(skill.accuracy).toBe(BALANCE.combat.enemyBaseAccuracy);
    expect(skill.effects[0].value).toEqual(BALANCE.combat.enemyDefaultDamage);
    expect(skill.effects[0].value).not.toBe(BALANCE.combat.enemyDefaultDamage);
  });

  it('normalizes non-safe-integer speed to the enemy speed default', () => {
    expect(buildEnemyProfile({ id: 'fractional', speed: 2.5 }).speed)
      .toBe(BALANCE.combat.defaultEnemySpeed);
    expect(buildEnemyProfile({
      id: 'explicit_fractional',
      combatProfile: { speed: 2.5, skillIds: [], skills: [] },
    }).speed).toBe(BALANCE.combat.defaultEnemySpeed);
  });

  it('decides an enemy intent through the supplied AI hooks', () => {
    const skill = { id: 'enemy:zombie_common:basic_attack' };
    const context = {
      enemyProfiles: {
        'enemy:0': { ai: 'normal' },
      },
      getUsableEnemySkills: vi.fn(() => [skill]),
      pickSkill: vi.fn(() => skill),
      pickTarget: vi.fn(() => 'player'),
    };

    expect(decideEnemyIntent(context, 'enemy:0')).toEqual({
      enemyId: 'enemy:0',
      skillId: 'enemy:zombie_common:basic_attack',
      targetId: 'player',
    });
    expect(context.getUsableEnemySkills).toHaveBeenCalledWith('enemy:0', { ai: 'normal' });
    expect(context.pickSkill).toHaveBeenCalledWith('normal', [skill]);
    expect(context.pickTarget).toHaveBeenCalledWith('normal', 'enemy:0', skill);
  });

  it('returns null when profile skill or target cannot be resolved', () => {
    expect(decideEnemyIntent({}, 'enemy:0')).toBeNull();
    expect(decideEnemyIntent({
      enemyProfiles: { 'enemy:0': { ai: 'normal' } },
      getUsableEnemySkills: () => [],
      pickSkill: () => null,
      pickTarget: () => 'player',
    }, 'enemy:0')).toBeNull();
    expect(decideEnemyIntent({
      enemyProfiles: { 'enemy:0': { ai: 'normal' } },
      getUsableEnemySkills: () => [{ id: 'skill' }],
      pickSkill: () => ({ id: 'skill' }),
      pickTarget: () => null,
    }, 'enemy:0')).toBeNull();
    expect(decideEnemyIntent({
      enemyProfiles: { 'enemy:0': { ai: 'normal' } },
      getUsableEnemySkills: () => [{}],
      pickSkill: () => ({}),
      pickTarget: () => 'player',
    }, 'enemy:0')).toBeNull();
  });

  it('validates explicit combat profile speed duplicates and skill definitions', () => {
    const report = validateEnemyCombatProfiles({
      broken_enemy: {
        id: 'broken_enemy',
        combatProfile: {
          speed: 2.5,
          startRank: 1,
          skillIds: ['missing_skill', 'missing_skill'],
          skills: [],
          ai: 'normal',
        },
      },
    });

    expect(report.ok).toBe(false);
    expect(report.errors).toEqual(expect.arrayContaining([
      '[enemy/broken_enemy] combatProfile.speed must be non-negative safe integer',
      '[enemy/broken_enemy] combatProfile.skillIds must not contain duplicates',
      '[enemy/broken_enemy] combatProfile.skills must be non-empty array',
    ]));
  });
});
