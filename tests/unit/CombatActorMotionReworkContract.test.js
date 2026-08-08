import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import { COMBAT_MOTION_MANIFEST } from '../../js/data/combatMotionManifest.js';
import {
  validateActorMotionManifest,
  verifyActorMotionRework,
} from '../../tools/verify_actor_motion_rework.mjs';

const ROOT = process.cwd();
const CONTRACT = path.join(ROOT, 'art_sources', 'combat', 'actor_motion_rework_contract.json');
const CLEANER = path.join(ROOT, 'tools', 'clean_combat_chroma_source.py');

function resolvePythonRuntime() {
  const candidates = [
    process.env.CODEX_PYTHON,
    process.env.PYTHON,
    process.platform === 'win32' ? 'py' : null,
    'python3',
    'python',
  ].filter(Boolean);
  for (const command of candidates) {
    const prefix = path.basename(command).toLowerCase() === 'py.exe' || command === 'py' ? ['-3'] : [];
    if (spawnSync(command, [...prefix, '--version'], { encoding: 'utf8' }).status === 0) {
      return { command, prefix };
    }
  }
  return null;
}

const PYTHON_RUNTIME = resolvePythonRuntime();
const itWithPython = PYTHON_RUNTIME ? it : it.skip;

function runCleaner(args, options = {}) {
  return spawnSync(PYTHON_RUNTIME.command, [...PYTHON_RUNTIME.prefix, CLEANER, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    ...options,
  });
}

const EXPECTED_TARGETS = [
  ['firefighter_m', 2],
  ['old_survivor_companion', 5],
  ['soldier_companion', 2],
  ['child_companion', 6],
  ['mechanic_companion', 1],
  ['mechanic_companion', 4],
  ['student_companion', 4],
  ['dog_companion', 6],
  ['dog_companion', 7],
  ['minjun_companion', 6],
  ['sohee_companion', 3],
  ['sohee_companion', 5],
  ['sohee_companion', 6],
  ['sohee_companion', 7],
  ['yeongcheol_companion', 6],
  ['daehan_companion', 2],
  ['daehan_companion', 6],
  ['daehan_companion', 7],
  ['tower_doctor_companion', 6],
  ['sous_chef_companion', 5],
];

describe('combat actor motion rework contract', () => {
  it('freezes 26 sheets, 208 rows, 20 targets and 188 unchanged rows', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
    expect(contract.sheets).toHaveLength(26);
    expect(contract.sheets.flatMap(sheet => sheet.rows)).toHaveLength(208);
    expect(contract.targets.map(({ sheetKey, row }) => [sheetKey, row])).toEqual(EXPECTED_TARGETS);
    const result = verifyActorMotionRework(ROOT, contract);
    expect(result).toMatchObject({ sheets: 26, rows: 208, targets: 20, unchangedRows: 188 });
  });

  it('rejects 6x8 grid and fixed motion-row mapping drift in the actor manifest', () => {
    const badGrid = structuredClone(COMBAT_MOTION_MANIFEST);
    badGrid.firefighter_m.cols = 5;
    expect(() => validateActorMotionManifest(badGrid)).toThrow('firefighter_m must use a 6x8 grid');

    const badRows = structuredClone(COMBAT_MOTION_MANIFEST);
    badRows.sohee_companion.motions = structuredClone(badRows.sohee_companion.motions);
    badRows.sohee_companion.motions.death = { ...badRows.sohee_companion.motions.death, row: 6 };
    expect(() => validateActorMotionManifest(badRows)).toThrow('sohee_companion motion row mapping drift');
  });

  it('keeps chroma CLI runtime discovery free of a user-specific cache path', () => {
    const resolver = resolvePythonRuntime.toString();
    expect(resolver).toContain('process.env.CODEX_PYTHON');
    expect(resolver).not.toContain(['codex', 'runtimes'].join('-'));
    expect(resolver).not.toContain(['process', 'env', 'USERPROFILE'].join('.'));
  });

  itWithPython('cleans an unmapped art-source chroma grid without requiring a runtime manifest sheet', () => {
    const input = path.join(ROOT, 'art_sources', 'combat', 'task8_players', 'firefighter_m_ranged_chroma.png');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-chroma-cleaner-'));
    const output = path.join(tempDir, 'firefighter_m_ranged_clean.png');
    try {
      const result = runCleaner([
        input,
        output,
        '--cols', '6',
        '--rows', '2',
      ]);

      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout.trim())).toEqual({
        boundaryGreen: 0,
        fringeGreen: 0,
        hiddenRgb: 0,
        opaqueGreen: 0,
        removedComponents: 0,
        staleAllowlist: 0,
      });
      expect(fs.existsSync(output)).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 15_000);

  itWithPython('uses manifest-linked allowlist checks for a runtime sheet', () => {
    const input = path.join(
      ROOT,
      'assets',
      'images',
      'combat',
      'spritesheets',
      'enemies',
      'boss_feral_dog_alpha_sheet.png',
    );
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-chroma-runtime-'));
    const output = path.join(tempDir, 'runtime-clean.png');
    try {
      const missingAllowlist = path.join(tempDir, 'missing-allowlist.json');
      const result = runCleaner([input, output, '--cols', '6', '--rows', '8'], {
        env: { ...process.env, COMBAT_CHROMA_ALLOWLIST_PATH: missingAllowlist },
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('allowlist: missing');
      expect(fs.existsSync(output)).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  itWithPython('measures and neutralizes low-saturation boundary-green residue in an unmapped art source', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-chroma-boundary-'));
    const input = path.join(tempDir, 'boundary-source.png');
    const output = path.join(tempDir, 'boundary-clean.png');
    try {
      const fixture = spawnSync(PYTHON_RUNTIME.command, [
        ...PYTHON_RUNTIME.prefix,
        '-c',
        [
          'from PIL import Image',
          `image = Image.new('RGBA', (16, 16), (0, 0, 0, 0))`,
          "image.putpixel((8, 8), (55, 165, 48, 255))",
          `image.save(r'${input.replaceAll('\\', '/')}')`,
        ].join('\n'),
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(fixture.status, fixture.stderr).toBe(0);

      const inspection = spawnSync(PYTHON_RUNTIME.command, [
        ...PYTHON_RUNTIME.prefix,
        '-c',
        [
          'import json, sys',
          'from PIL import Image',
          `sys.path.insert(0, r'${path.join(ROOT, 'tools').replaceAll('\\', '/')}')`,
          'import clean_combat_chroma_source as cleaner',
          `print(json.dumps(cleaner.strict_art_source_metrics(Image.open(r'${input.replaceAll('\\', '/')}'), 1, 1)))`,
        ].join('\n'),
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(inspection.status, inspection.stderr).toBe(0);
      expect(JSON.parse(inspection.stdout).boundaryGreen).toBe(1);

      const result = runCleaner([input, output, '--cols', '1', '--rows', '1']);

      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout.trim())).toEqual({
        boundaryGreen: 0,
        fringeGreen: 0,
        hiddenRgb: 0,
        opaqueGreen: 0,
        removedComponents: 0,
        staleAllowlist: 0,
      });
      const pixel = spawnSync(PYTHON_RUNTIME.command, [
        ...PYTHON_RUNTIME.prefix,
        '-c',
        `from PIL import Image; print(Image.open(r'${output.replaceAll('\\', '/')}').getpixel((8, 8)))`,
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(pixel.status, pixel.stderr).toBe(0);
      expect(pixel.stdout.trim()).toBe('(55, 55, 48, 255)');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
