import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { COMBAT_MOTION_MANIFEST } from '../js/data/combatMotionManifest.js';
import { readPng } from './audit_combat_sprites.mjs';

export const TARGET_ROWS = Object.freeze([
  ['firefighter_m', 2], ['old_survivor_companion', 5], ['soldier_companion', 2],
  ['child_companion', 6], ['mechanic_companion', 1], ['mechanic_companion', 4],
  ['student_companion', 4], ['dog_companion', 6], ['dog_companion', 7],
  ['minjun_companion', 6], ['sohee_companion', 3], ['sohee_companion', 5],
  ['sohee_companion', 6], ['sohee_companion', 7], ['yeongcheol_companion', 6],
  ['daehan_companion', 2], ['daehan_companion', 6], ['daehan_companion', 7],
  ['tower_doctor_companion', 6], ['sous_chef_companion', 5],
]);

const CONTRACT_PATH = path.join('art_sources', 'combat', 'actor_motion_rework_contract.json');
const ACTOR_MOTION_ROWS = Object.freeze([
  ['idle', 0], ['melee', 1], ['ranged', 2], ['support', 3],
  ['guard', 4], ['move', 5], ['hit', 6], ['death', 7],
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function rowSha256(image, row) {
  const bytes = Buffer.alloc(image.width * 256 * 4);
  const start = row * 256 * image.width * 4;
  bytes.set(image.pixels.subarray(start, start + bytes.length));
  return createHash('sha256').update(bytes).digest('hex');
}

export function validateActorMotionManifest(manifest = COMBAT_MOTION_MANIFEST) {
  const actorSheets = Object.entries(manifest)
    .filter(([, sheet]) => !sheet.src.includes('/enemies/'));
  invariant(actorSheets.length === 26, `expected 26 actor sheets, got ${actorSheets.length}`);
  for (const [sheetKey, sheet] of actorSheets) {
    invariant(sheet.cols === 6 && sheet.rows === 8, `${sheetKey} must use a 6x8 grid`);
    const actualRows = Object.entries(sheet.motions ?? {}).map(([motion, value]) => [motion, value.row]);
    invariant(JSON.stringify(actualRows) === JSON.stringify(ACTOR_MOTION_ROWS),
      `${sheetKey} motion row mapping drift`);
  }
  return actorSheets;
}

function validateContractAgainstManifest(contract, actorSheets) {
  invariant(Array.isArray(contract.sheets) && contract.sheets.length === actorSheets.length,
    `expected ${actorSheets.length} contract sheets`);
  const manifestSheets = new Map(actorSheets);
  const contractKeys = new Set();
  for (const sheet of contract.sheets) {
    invariant(!contractKeys.has(sheet.sheetKey), `duplicate contract sheet: ${sheet.sheetKey}`);
    contractKeys.add(sheet.sheetKey);
    const manifestSheet = manifestSheets.get(sheet.sheetKey);
    invariant(manifestSheet, `contract sheet missing from manifest: ${sheet.sheetKey}`);
    invariant(sheet.path === manifestSheet.src, `contract path drift: ${sheet.sheetKey}`);
    invariant(Array.isArray(sheet.rows) && sheet.rows.length === manifestSheet.rows,
      `contract row count drift: ${sheet.sheetKey}`);
    sheet.rows.forEach((baseline, row) => {
      invariant(baseline.row === row, `contract row order drift: ${sheet.sheetKey}:${row}`);
    });
  }
  invariant(contractKeys.size === manifestSheets.size, 'contract sheet set drift');
}

function imageForSheet(root, sheet) {
  const filePath = path.join(root, sheet.path.replace(/^\//, ''));
  const image = readPng(filePath);
  invariant(image.width === 1536 && image.height === sheet.rows.length * 256 && image.pixels,
    `invalid actor sheet: ${sheet.sheetKey}`);
  return image;
}

function capturedContract(root) {
  const actorSheets = validateActorMotionManifest();
  const sheets = actorSheets.map(([sheetKey, manifestSheet]) => {
    const image = readPng(path.join(root, manifestSheet.src.replace(/^\//, '')));
    invariant(image.width === 1536 && image.height === manifestSheet.rows * 256 && image.pixels,
      `invalid actor sheet: ${sheetKey}`);
    return {
      sheetKey,
      path: manifestSheet.src,
      rows: Array.from({ length: manifestSheet.rows }, (_, row) => ({
        row,
        rowPixelSha256: rowSha256(image, row),
      })),
    };
  });
  const rows = sheets.flatMap(sheet => sheet.rows).length;
  invariant(rows === 208, `expected 208 actor rows, got ${rows}`);
  return {
    sheets,
    targets: TARGET_ROWS.map(([sheetKey, row]) => ({ sheetKey, row })),
  };
}

export function verifyActorMotionRework(root, contract, options = {}) {
  const actorSheets = validateActorMotionManifest();
  validateContractAgainstManifest(contract, actorSheets);
  const targetSet = new Set(contract.targets.map(entry => `${entry.sheetKey}:${entry.row}`));
  let changedTargets = 0;
  let unchangedRows = 0;
  let rows = 0;
  for (const sheet of contract.sheets) {
    const image = imageForSheet(root, sheet);
    for (const baseline of sheet.rows) {
      const actual = rowSha256(image, baseline.row);
      const key = `${sheet.sheetKey}:${baseline.row}`;
      rows += 1;
      if (targetSet.has(key)) changedTargets += Number(actual !== baseline.rowPixelSha256);
      else {
        if (actual !== baseline.rowPixelSha256) throw new Error(`unchanged row drift: ${key}`);
        unchangedRows += 1;
      }
    }
  }
  if (options.requireTargetsChanged && changedTargets !== contract.targets.length) {
    throw new Error(`target rows changed ${changedTargets}/${contract.targets.length}`);
  }
  invariant(rows === 208, `expected 208 actor rows, got ${rows}`);
  return {
    sheets: contract.sheets.length,
    rows,
    targets: targetSet.size,
    changedTargets,
    unchangedRows,
  };
}

function main() {
  const root = path.resolve(process.cwd());
  const contractPath = path.join(root, CONTRACT_PATH);
  const capture = process.argv.includes('--capture');
  const check = process.argv.includes('--check');
  const requireTargetsChanged = process.argv.includes('--require-targets-changed');
  invariant(capture !== check, 'use exactly one of --capture or --check');

  if (capture) {
    invariant(!fs.existsSync(contractPath), `${CONTRACT_PATH} already exists`);
    const contract = capturedContract(root);
    fs.mkdirSync(path.dirname(contractPath), { recursive: true });
    fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`, 'utf8');
    console.log(`captured ${contract.sheets.length} sheets, ${contract.sheets.flatMap(sheet => sheet.rows).length} rows, ${contract.targets.length} targets`);
    return;
  }

  invariant(fs.existsSync(contractPath), `${CONTRACT_PATH} is missing`);
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const result = verifyActorMotionRework(root, contract, { requireTargetsChanged });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
