// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COMBAT_MOTION_MANIFEST,
  resolveCombatMotion,
  spriteRowPercent,
} from '../../js/data/combatMotionManifest.js';
import { validateCombatMotionManifest } from '../../js/data/validate.js';
import { COMBAT_SPRITE_SHEETS } from '../../js/ui/combat/combatUiAssets.js';

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

  it('maps all 23 currently displayed sheets to synchronous manifest entries', () => {
    expect(Object.keys(COMBAT_SPRITE_SHEETS)).toHaveLength(23);
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
        expect.arrayContaining(['idle', 'hit', 'death']),
      );
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
});

afterEach(() => {
  vi.unstubAllGlobals();
});
