// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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
const MATERIALIZER = path.join(ROOT, 'tools', 'materialize_boss_component_contract.py');
const CONTRACT = path.join(
  ROOT,
  'art_sources/combat/task10_bosses/detached_component_contract.json',
);
const RECIPE = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'art_sources/combat/task10_bosses/assembly_recipe.json'),
  'utf8',
));

function pythonRuntime() {
  const candidates = [
    process.env.CODEX_PYTHON,
    process.env.USERPROFILE && path.join(
      process.env.USERPROFILE,
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'python',
      'python.exe',
    ),
    process.platform === 'win32' ? 'py' : 'python3',
    'python',
  ].filter(Boolean);
  for (const command of candidates) {
    const prefix = command === 'py' ? ['-3'] : [];
    if (spawnSync(command, [...prefix, '--version'], { encoding: 'utf8' }).status === 0) {
      return { command, prefix };
    }
  }
  throw new Error('Python runtime not found');
}

function runMaterializer(args, contractPath = null) {
  const runtime = pythonRuntime();
  if (contractPath === null) {
    return spawnSync(runtime.command, [...runtime.prefix, MATERIALIZER, ...args], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  }

  const source = [
    'import sys',
    'from pathlib import Path',
    'sys.path.insert(0, sys.argv[1])',
    'import materialize_boss_component_contract as tool',
    'tool.CONTRACT_PATH = Path(sys.argv[2])',
    'sys.argv = ["materialize_boss_component_contract.py", *sys.argv[3:]]',
    'tool.main()',
  ].join('; ');
  return spawnSync(runtime.command, [
    ...runtime.prefix,
    '-c',
    source,
    path.join(ROOT, 'tools'),
    contractPath,
    ...args,
  ], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

function bossIds() {
  return Object.values(SECRET_ENEMIES)
    .filter(enemy => enemy.isBoss === true)
    .map(enemy => enemy.id);
}

describe('named boss motion asset contract', () => {
  it('accepts the checked-in detached-component contract through the authoring CLI', () => {
    const result = runMaterializer(['--check']);

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('detached component contract verified');
  }, 60000);

  it('accepts semantically identical LF and CRLF detached-component contracts', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
    const lf = `${JSON.stringify(contract, null, 2)}\n`;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boss-component-eol-'));
    try {
      for (const [name, content] of [['lf', lf], ['crlf', lf.replaceAll('\n', '\r\n')]]) {
        const contractPath = path.join(tempDir, `${name}.json`);
        fs.writeFileSync(contractPath, content, 'utf8');
        const result = runMaterializer(['--check'], contractPath);
        expect(result.status, `${name}: ${result.stderr || result.stdout}`).toBe(0);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 90000);

  it('rejects semantic detached-component contract drift', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
    contract.sources.boss_patient_zero = '0'.repeat(64);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boss-component-drift-'));
    try {
      const contractPath = path.join(tempDir, 'detached_component_contract.json');
      fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`, 'utf8');
      const result = runMaterializer(['--check'], contractPath);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('detached component contract drift');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 60000);

  it('writes deterministic LF content with the canonical provenance scheme', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boss-component-write-'));
    try {
      const contractPath = path.join(tempDir, 'detached_component_contract.json');
      const first = runMaterializer(['--write'], contractPath);
      expect(first.status, first.stderr || first.stdout).toBe(0);
      const firstContent = fs.readFileSync(contractPath, 'utf8');

      const second = runMaterializer(['--write'], contractPath);
      expect(second.status, second.stderr || second.stdout).toBe(0);
      const secondContent = fs.readFileSync(contractPath, 'utf8');

      expect(secondContent).toBe(firstContent);
      expect(firstContent).not.toContain('\r');
      expect(JSON.parse(firstContent).hashScheme).toBe('combat-provenance-sha256-v2');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 90000);

  it('declares the canonical provenance hash scheme explicitly', () => {
    expect(RECIPE.hashScheme).toBe('combat-provenance-sha256-v2');
  });

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
