// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { COMBAT_MOTION_MANIFEST } from '../../js/data/combatMotionManifest.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';
import { ENEMY_SPRITE_KEYS } from '../../js/ui/combat/combatUiAssets.js';
import {
  validateBossFrameContinuity,
  validateBossMotionSourceBindings,
} from '../../tools/boss_motion_source_contract.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const RECIPE = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'art_sources/combat/task10_bosses/assembly_recipe.json'),
  'utf8',
));

function bossIds() {
  return Object.values(SECRET_ENEMIES)
    .filter(enemy => enemy.isBoss === true)
    .map(enemy => enemy.id);
}

describe('named boss motion asset contract', () => {
  it('binds every boss to its own exact canonical manifest and recipe path', () => {
    expect(validateBossMotionSourceBindings({
      manifest: COMBAT_MOTION_MANIFEST,
      spriteKeys: ENEMY_SPRITE_KEYS,
      bossIds: bossIds(),
      recipeTargets: RECIPE.targets,
    })).toEqual([]);
  });

  it('rejects a boss manifest source aliased to another boss file', () => {
    const manifest = structuredClone(COMBAT_MOTION_MANIFEST);
    manifest.boss_patient_zero.src = manifest.boss_radiation_colossus.src;

    expect(validateBossMotionSourceBindings({
      manifest,
      spriteKeys: ENEMY_SPRITE_KEYS,
      bossIds: bossIds(),
      recipeTargets: RECIPE.targets,
    })).toEqual(expect.arrayContaining([
      expect.stringContaining('boss_patient_zero'),
      expect.stringContaining('duplicate'),
    ]));
  });

  it('uses frame-level detached effect selection instead of blanket row preservation', () => {
    const selection = JSON.parse(fs.readFileSync(
      path.join(ROOT, 'art_sources/combat/task10_bosses/detached_component_selection.json'),
      'utf8',
    ));

    expect(selection.version).toBe(2);
    expect(selection.selectedRows).toBeUndefined();
    expect(Array.isArray(selection.selectedFrames)).toBe(true);
    for (const frame of selection.selectedFrames) {
      expect(frame).toEqual(expect.objectContaining({
        bossId: expect.any(String),
        motionKey: expect.any(String),
        col: expect.any(Number),
        componentIndexes: expect.any(Array),
        rationale: expect.any(String),
      }));
    }
  });

  it('keeps a primary body in every frame without edge clipping', () => {
    expect(validateBossFrameContinuity(RECIPE.targets)).toEqual([]);
  });

  it('rejects a tiny body fragment and a frame-edge sliver mutation', () => {
    const targets = structuredClone(RECIPE.targets);
    const frames = targets.boss_patient_zero.quality.frames;
    frames.find(frame => frame.row === 1 && frame.col === 5).components[0] = {
      bbox: [120, 120, 124, 124],
      area: 12,
      maskSha256: 'fragment-mutation',
    };
    frames.find(frame => frame.row === 2 && frame.col === 4).bbox[0] = 0;

    expect(validateBossFrameContinuity(targets)).toEqual(expect.arrayContaining([
      expect.stringContaining('primary body area discontinuity'),
      expect.stringContaining('primary body bbox discontinuity'),
      expect.stringContaining('touches a frame edge'),
    ]));
  });
});
