// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COMBAT_MOTION_MANIFEST,
  resolveCombatMotion,
  spriteRowPercent,
} from '../../js/data/combatMotionManifest.js';
import { validateCombatMotionManifest } from '../../js/data/validate.js';
import { COMBAT_SPRITE_SHEETS } from '../../js/ui/combat/combatUiAssets.js';
import {
  COMPANION_SPRITE_KEYS,
  ENEMY_SPRITE_KEYS,
  PLAYER_SPRITE_KEYS,
} from '../../js/ui/combat/combatUiAssets.js';
import {
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../../js/data/combatSkills.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';

const PLAYER_SHEET_KEYS = Object.freeze({
  'doctor:F': 'doctor_f',
  'soldier:M': 'soldier_m',
  'firefighter:M': 'firefighter_m',
  'homeless:M': 'homeless_m',
  'chef:M': 'chef_m',
  'engineer:M': 'engineer_m',
});

const PLAYER_MOTION_ROWS = Object.freeze([
  'idle',
  'melee',
  'ranged',
  'support',
  'guard',
  'move',
  'hit',
  'death',
]);

const PLAYER_SKILL_MOTIONS = Object.freeze({
  doctor_precise_cut: 'melee',
  doctor_triage: 'support',
  doctor_diagnose: 'support',
  soldier_burst_fire: 'ranged',
  soldier_suppressive_fire: 'ranged',
  soldier_tactical_shift: 'move',
  firefighter_axe_swing: 'melee',
  firefighter_rescue_guard: 'guard',
  firefighter_force_advance: 'move',
  homeless_dirty_fighting: 'melee',
  homeless_slip_away: 'move',
  homeless_scavenge_weapon: 'support',
  chef_knife_flurry: 'melee',
  chef_field_ration: 'support',
  chef_hot_pan: 'melee',
  engineer_wrench_strike: 'melee',
  engineer_improvised_cover: 'guard',
  engineer_shock_trap: 'support',
});

const COMPANION_SHEET_KEYS = Object.freeze({
  npc_old_survivor: 'old_survivor_companion',
  npc_nurse: 'nurse_companion',
  npc_soldier_deserter: 'soldier_companion',
  npc_child: 'child_companion',
  npc_mechanic: 'mechanic_companion',
  npc_student: 'student_companion',
  npc_dog: 'dog_companion',
  npc_former_colleague: 'former_colleague_companion',
  npc_minjun: 'minjun_companion',
  npc_sohee: 'sohee_companion',
  npc_jisu: 'jisu_companion',
  npc_yeongcheol: 'yeongcheol_companion',
  npc_daehan: 'daehan_companion',
  npc_tower_security: 'tower_security_companion',
  npc_tower_merchant: 'tower_merchant_companion',
  npc_tower_cook: 'tower_cook_companion',
  npc_tower_engineer: 'tower_engineer_companion',
  npc_tower_doctor: 'tower_doctor_companion',
  npc_sous_chef: 'sous_chef_companion',
  npc_kitchen_helper: 'kitchen_helper_companion',
});

const COMPANION_MOTION_ROWS = PLAYER_MOTION_ROWS;

const BOSS_MOTION_ROWS = Object.freeze([
  'idle',
  'basic_a',
  'basic_b',
  'special',
  'ultimate',
  'hit',
  'charge',
  'death',
]);

function motionFixture(overrides = {}) {
  return {
    fixture_sheet: {
      src: '/assets/images/combat/spritesheets/enemies/zombie_common_sheet.png',
      cols: 6,
      rows: 4,
      motions: {
        idle: { row: 0, loop: true, durationMs: 900, locomotion: 'stationary' },
        basic_attack: { row: 1, loop: false, durationMs: 720, locomotion: 'approach' },
        hit: { row: 2, loop: false, durationMs: 420, locomotion: 'stationary' },
        death: {
          row: 3,
          loop: false,
          durationMs: 900,
          locomotion: 'stationary',
          holdLast: true,
        },
      },
      aliases: { attack: 'basic_attack' },
      ...overrides,
    },
  };
}

describe('combat motion manifest fixture contract', () => {
  it('accepts a complete four-row fixture with an idle-only loop', () => {
    expect(validateCombatMotionManifest(motionFixture())).toEqual([]);
  });

  it.each([
    ['zero columns', fixture => { fixture.fixture_sheet.cols = 0; }, 'cols'],
    ['out-of-range row', fixture => { fixture.fixture_sheet.motions.hit.row = 4; }, 'row'],
    ['missing duration', fixture => { delete fixture.fixture_sheet.motions.hit.durationMs; }, 'durationMs'],
    ['invalid locomotion', fixture => { fixture.fixture_sheet.motions.hit.locomotion = 'teleport'; }, 'locomotion'],
    ['looping non-idle motion', fixture => { fixture.fixture_sheet.motions.hit.loop = true; }, 'loop:true'],
  ])('rejects %s', (_label, mutate, expectedError) => {
    const fixture = motionFixture();
    mutate(fixture);

    expect(validateCombatMotionManifest(fixture))
      .toEqual(expect.arrayContaining([expect.stringContaining(expectedError)]));
  });
});

describe('combat motion aliases', () => {
  it('resolves one alias step to the canonical motion', () => {
    const fixture = motionFixture();

    expect(resolveCombatMotion('fixture_sheet', 'attack', fixture)).toEqual({
      row: 1,
      loop: false,
      durationMs: 720,
      locomotion: 'approach',
    });
  });

  it.each([
    ['a two-step alias', { attack: 'basic_attack', strike: 'attack' }],
    ['a circular alias', { attack: 'strike', strike: 'attack' }],
  ])('rejects %s', (_label, aliases) => {
    const fixture = motionFixture({ aliases });

    expect(resolveCombatMotion('fixture_sheet', 'strike', fixture)).toBeNull();
    expect(validateCombatMotionManifest(fixture))
      .toEqual(expect.arrayContaining([expect.stringContaining('alias')]));
  });
});

describe('current combat motion registry', () => {
  it('validates the displayed assets and rejects a missing current-sheet path', () => {
    expect(validateCombatMotionManifest(COMBAT_MOTION_MANIFEST)).toEqual([]);

    const fixture = structuredClone(COMBAT_MOTION_MANIFEST);
    fixture.zombie_common.src = '/assets/images/combat/spritesheets/enemies/missing_sheet.png';

    expect(validateCombatMotionManifest(fixture))
      .toEqual(expect.arrayContaining([expect.stringContaining('missing_sheet.png')]));
  });

  it('maps all 60 currently displayed sheets to synchronous manifest entries', () => {
    expect(Object.keys(COMBAT_SPRITE_SHEETS)).toHaveLength(60);
    expect(Object.keys(COMBAT_SPRITE_SHEETS).sort())
      .toEqual(Object.keys(COMBAT_MOTION_MANIFEST).sort());

    for (const [sheetKey, sheet] of Object.entries(COMBAT_SPRITE_SHEETS)) {
      const manifestSheet = COMBAT_MOTION_MANIFEST[sheetKey];
      expect(sheet).toMatchObject({
        src: manifestSheet.src,
        cols: manifestSheet.cols,
        rows: manifestSheet.rows,
        motions: manifestSheet.motions,
      });
      expect(Object.keys(manifestSheet.motions)).toEqual(
        expect.arrayContaining(['hit', 'death']),
      );
      expect(resolveCombatMotion(sheetKey, 'idle')).not.toBeNull();
    }
  });

  it('derives sheet metadata immediately without requesting an async manifest', async () => {
    const originalVitest = process.env.VITEST;
    const fetchMock = vi.fn();

    try {
      delete process.env.VITEST;
      vi.stubGlobal('fetch', fetchMock);
      vi.resetModules();

      const assets = await import('../../js/ui/combat/combatUiAssets.js');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(assets.COMBAT_SPRITE_SHEETS.zombie_common.motions.idle.loop).toBe(true);
    } finally {
      if (originalVitest === undefined) delete process.env.VITEST;
      else process.env.VITEST = originalVitest;
    }
  });

  it('calculates the CSS row position from the synchronous registry dimensions', () => {
    expect(spriteRowPercent(1, 4)).toBeCloseTo(33.3333, 4);
    expect(spriteRowPercent(0, 1)).toBe(0);
  });

  it('maps all six playable character identities to dedicated player sheets', () => {
    expect(PLAYER_SPRITE_KEYS).toEqual(PLAYER_SHEET_KEYS);
  });

  it('defines the exact six-player 6x8 semantic row contract', () => {
    for (const sheetKey of Object.values(PLAYER_SHEET_KEYS)) {
      const sheet = COMBAT_MOTION_MANIFEST[sheetKey];
      expect(sheet).toBeDefined();
      expect(sheet.cols).toBe(6);
      expect(sheet.rows).toBe(8);
      expect(Object.keys(sheet.motions)).toEqual(PLAYER_MOTION_ROWS);
      expect(Object.values(sheet.motions).map(motion => motion.row))
        .toEqual(PLAYER_MOTION_ROWS.map((_, row) => row));
      expect(sheet.motions.idle.loop).toBe(true);
      for (const motionKey of PLAYER_MOTION_ROWS.slice(1)) {
        expect(sheet.motions[motionKey].loop).toBe(false);
      }
      expect(resolveCombatMotion(sheetKey, 'victory')).toMatchObject({ row: 0 });
    }
  });

  it('keeps all 18 unique player skills on their reviewed semantic rows', () => {
    expect(Object.keys(PLAYER_SKILL_MOTIONS)).toHaveLength(18);
    for (const [skillId, motionKey] of Object.entries(PLAYER_SKILL_MOTIONS)) {
      expect(COMBAT_SKILLS[skillId]?.motionKey, skillId).toBe(motionKey);
      const characterId = skillId.split('_')[0];
      const gender = characterId === 'doctor' ? 'F' : 'M';
      const sheetKey = PLAYER_SHEET_KEYS[`${characterId}:${gender}`];
      expect(resolveCombatMotion(sheetKey, motionKey), `${skillId}/${sheetKey}`)
        .toMatchObject({ row: PLAYER_MOTION_ROWS.indexOf(motionKey) });
    }
  });

  it('maps the exact 20 companion loadout IDs to 20 dedicated sprite keys', () => {
    expect(Object.keys(COMPANION_COMBAT_LOADOUTS).sort())
      .toEqual(Object.keys(COMPANION_SPRITE_KEYS).sort());
    expect(Reflect.ownKeys(COMPANION_SPRITE_KEYS).sort())
      .toEqual(Object.keys(COMPANION_COMBAT_LOADOUTS).sort());
    expect(COMPANION_SPRITE_KEYS).toEqual(COMPANION_SHEET_KEYS);
    expect(new Set(Object.values(COMPANION_SPRITE_KEYS)).size).toBe(20);
  });

  it('defines a dedicated 6x8 semantic sheet for every companion', () => {
    const sources = [];
    for (const [npcId, sheetKey] of Object.entries(COMPANION_SPRITE_KEYS)) {
      const sheet = COMBAT_MOTION_MANIFEST[sheetKey];
      expect(sheet, npcId).toBeDefined();
      expect(sheet.cols, npcId).toBe(6);
      expect(sheet.rows, npcId).toBe(8);
      expect(Object.keys(sheet.motions), npcId).toEqual(COMPANION_MOTION_ROWS);
      expect(Object.values(sheet.motions).map(motion => motion.row), npcId)
        .toEqual(COMPANION_MOTION_ROWS.map((_, row) => row));
      expect(sheet.src, npcId).toMatch(/\/assets\/images\/combat\/spritesheets\/(?:companions\/)?[^/]+_sheet\.png$/);
      sources.push(sheet.src);
    }
    expect(new Set(sources).size).toBe(20);
  });

  it('keeps all 60 companion skills on their reviewed semantic rows', () => {
    const loadoutEntries = Object.entries(COMPANION_COMBAT_LOADOUTS);
    expect(loadoutEntries.flatMap(([, skillIds]) => skillIds)).toHaveLength(60);

    for (const [npcId, skillIds] of loadoutEntries) {
      const sheetKey = COMPANION_SPRITE_KEYS[npcId];
      for (const skillId of skillIds) {
        const motionKey = COMBAT_SKILLS[skillId]?.motionKey;
        expect(COMPANION_MOTION_ROWS, skillId).toContain(motionKey);
        expect(resolveCombatMotion(sheetKey, motionKey), `${npcId}/${skillId}`)
          .toMatchObject({ row: COMPANION_MOTION_ROWS.indexOf(motionKey) });
      }
    }
  });

  it('maps the exact 21 named bosses to unique dedicated sprite sheets', () => {
    const bossIds = Object.entries(SECRET_ENEMIES)
      .filter(([, enemy]) => enemy.isBoss === true)
      .map(([enemyId]) => enemyId)
      .sort();
    const mappedBossIds = Object.keys(ENEMY_SPRITE_KEYS)
      .filter(enemyId => SECRET_ENEMIES[enemyId]?.isBoss === true)
      .sort();

    expect(bossIds).toHaveLength(21);
    expect(mappedBossIds).toEqual(bossIds);
    expect(new Set(bossIds.map(enemyId => ENEMY_SPRITE_KEYS[enemyId])).size).toBe(21);
  });

  it('defines the exact 6x8 semantic row contract for every named boss', () => {
    for (const [enemyId, enemy] of Object.entries(SECRET_ENEMIES)) {
      if (enemy.isBoss !== true) continue;
      const sheetKey = ENEMY_SPRITE_KEYS[enemyId];
      const sheet = COMBAT_MOTION_MANIFEST[sheetKey];

      expect(sheet, enemyId).toBeDefined();
      expect(sheet.cols, enemyId).toBe(6);
      expect(sheet.rows, enemyId).toBe(8);
      expect(Object.keys(sheet.motions), enemyId).toEqual(BOSS_MOTION_ROWS);
      expect(Object.values(sheet.motions).map(motion => motion.row), enemyId)
        .toEqual(BOSS_MOTION_ROWS.map((_, row) => row));
      expect(sheet.motions.idle.loop, enemyId).toBe(true);
      expect(sheet.motions.death.holdLast, enemyId).toBe(true);
      for (const motionKey of BOSS_MOTION_ROWS.slice(1)) {
        expect(sheet.motions[motionKey].loop, `${enemyId}/${motionKey}`).toBe(false);
      }
    }
  });

  it('binds each boss action key to its exact semantic row and movement contract', () => {
    const expectedRows = ['basic_a', 'basic_b', 'special', 'ultimate'];
    for (const [enemyId, enemy] of Object.entries(SECRET_ENEMIES)) {
      if (enemy.isBoss !== true) continue;
      const sheetKey = ENEMY_SPRITE_KEYS[enemyId];
      const actions = [
        ...enemy.bossPattern.basicAttacks,
        enemy.bossPattern.specialSkill,
        enemy.bossPattern.ultimate,
      ];

      expect(actions).toHaveLength(4);
      actions.forEach((action, index) => {
        const expectedMotion = expectedRows[index];
        const resolved = resolveCombatMotion(sheetKey, action.motionKey);
        expect(resolved, `${enemyId}/${action.id}`).toMatchObject({
          row: BOSS_MOTION_ROWS.indexOf(expectedMotion),
          locomotion: action.movement === 'retreat'
            ? 'retreat'
            : ['lunge', 'advance'].includes(action.movement) ? 'approach' : 'stationary',
        });
      });
      expect(resolveCombatMotion(sheetKey, 'charge'), enemyId)
        .toMatchObject({ row: 6, locomotion: 'stationary' });
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
