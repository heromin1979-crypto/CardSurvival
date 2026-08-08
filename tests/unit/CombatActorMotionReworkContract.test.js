import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import { verifyActorMotionRework } from '../../tools/verify_actor_motion_rework.mjs';

const ROOT = process.cwd();
const CONTRACT = path.join(ROOT, 'art_sources', 'combat', 'actor_motion_rework_contract.json');
const CLEANER = path.join(ROOT, 'tools', 'clean_combat_chroma_source.py');
const BUNDLED_PYTHON = path.join(
  process.env.USERPROFILE ?? '',
  '.cache',
  'codex-runtimes',
  'codex-primary-runtime',
  'dependencies',
  'python',
  'python.exe',
);

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

  it('cleans an unmapped art-source chroma grid without requiring a runtime manifest sheet', () => {
    const input = path.join(ROOT, 'art_sources', 'combat', 'task8_players', 'firefighter_m_ranged_chroma.png');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-chroma-cleaner-'));
    const output = path.join(tempDir, 'firefighter_m_ranged_clean.png');
    try {
      expect(fs.existsSync(BUNDLED_PYTHON)).toBe(true);
      const result = spawnSync(BUNDLED_PYTHON, [
        CLEANER,
        input,
        output,
        '--cols', '6',
        '--rows', '2',
      ], { cwd: ROOT, encoding: 'utf8' });

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
  });
});
