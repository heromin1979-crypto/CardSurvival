// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COMBAT_MOTION_MANIFEST,
  resolveCombatMotion,
  spriteRowPercent,
} from '../../js/data/combatMotionManifest.js';
import { validateCombatMotionManifest } from '../../js/data/validate.js';
import { COMBAT_SPRITE_SHEETS } from '../../js/ui/combat/combatUiAssets.js';
import { PLAYER_SPRITE_KEYS } from '../../js/ui/combat/combatUiAssets.js';
import { COMBAT_SKILLS } from '../../js/data/combatSkills.js';

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

  it('maps all 28 currently displayed sheets to synchronous manifest entries', () => {
    expect(Object.keys(COMBAT_SPRITE_SHEETS)).toHaveLength(28);
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
});

afterEach(() => {
  vi.unstubAllGlobals();
});
