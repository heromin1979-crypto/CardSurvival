import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyActorMotionRework } from '../../tools/verify_actor_motion_rework.mjs';

const ROOT = process.cwd();
const CONTRACT = path.join(ROOT, 'art_sources', 'combat', 'actor_motion_rework_contract.json');

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
});
