import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { COMBAT_MOTION_MANIFEST } from '../js/data/combatMotionManifest.js';
import { SECRET_ENEMIES } from '../js/data/secretEnemies.js';
import { ENEMY_SPRITE_KEYS } from '../js/ui/combat/combatUiAssets.js';
import { chromaArtifactStats, readPng } from './audit_combat_sprites.mjs';

const ROOT = path.resolve(process.argv.find(arg => arg.startsWith('--root='))?.slice(7) || process.cwd());
const ART = 'art_sources/combat/task10_bosses';
const ROWS = Object.freeze(['idle', 'basic_a', 'basic_b', 'special', 'ultimate', 'hit', 'charge', 'death']);
const REVIEWED_ROWS = Object.freeze(ROWS.slice(1));
const LOCOMOTION = Object.freeze({ none: 'stationary', lunge: 'approach', advance: 'approach', retreat: 'retreat' });

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function fixedFile(relative, label = relative) {
  const result = path.resolve(ROOT, relative.split('/').join(path.sep));
  const within = path.relative(ROOT, result);
  invariant(!path.isAbsolute(within) && !within.startsWith(`..${path.sep}`), `${label} escapes root`);
  invariant(fs.existsSync(result), `${label} is missing`);
  return result;
}

function repoFile(relative, label = relative) {
  invariant(typeof relative === 'string' && relative.startsWith('/'), `${label} must use a repository-absolute path`);
  return fixedFile(relative.slice(1), label);
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(fixedFile(relative), 'utf8'));
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function exactSet(actual, expected, label) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  invariant(JSON.stringify(left) === JSON.stringify(right), `${label} set mismatch`);
}

function cellHash(image, row, col) {
  const bytes = Buffer.alloc(256 * 256 * 4);
  let target = 0;
  let opaque = 0;
  for (let y = row * 256; y < (row + 1) * 256; y += 1) {
    for (let x = col * 256; x < (col + 1) * 256; x += 1) {
      const source = (y * image.width + x) * 4;
      image.pixels.copy(bytes, target, source, source + 4);
      if (image.pixels[source + 3] > 8) opaque += 1;
      target += 4;
    }
  }
  return { hash: createHash('sha256').update(bytes).digest('hex'), opaque };
}

function validateManifest(bossIds) {
  for (const bossId of bossIds) {
    const sheet = COMBAT_MOTION_MANIFEST[bossId];
    invariant(sheet, `${bossId} manifest entry missing`);
    invariant(ENEMY_SPRITE_KEYS[bossId] === bossId, `${bossId} UI sprite key missing`);
    invariant(sheet.cols === 6 && sheet.rows === 8, `${bossId} grid mismatch`);
    exactSet(Object.keys(sheet.motions), ROWS, `${bossId} semantic rows`);
    ROWS.forEach((row, index) => invariant(sheet.motions[row].row === index, `${bossId} ${row} row mismatch`));
    invariant(sheet.motions.idle.loop === true, `${bossId} idle must loop`);
    for (const row of REVIEWED_ROWS) invariant(sheet.motions[row].loop === false, `${bossId} ${row} must not loop`);
    invariant(sheet.motions.death.holdLast === true, `${bossId} death must hold last frame`);

    const pattern = SECRET_ENEMIES[bossId].bossPattern;
    const actions = [...pattern.basicAttacks, pattern.specialSkill, pattern.ultimate];
    const semanticRows = ['basic_a', 'basic_b', 'special', 'ultimate'];
    invariant(actions.length === 4, `${bossId} must have exactly four boss actions`);
    actions.forEach((action, index) => {
      const row = semanticRows[index];
      invariant(action.motionKey === action.id, `${bossId} ${row} motionKey must equal action id`);
      invariant(sheet.aliases[action.motionKey] === row, `${bossId} ${action.motionKey} alias mismatch`);
      invariant(LOCOMOTION[action.movement] === sheet.motions[row].locomotion, `${bossId} ${row} locomotion mismatch`);
    });
  }
}

function validateProvenance(provenance, recipe, bossIds) {
  invariant(provenance.version === 1 && provenance.tool === 'built-in image_gen', 'generation provenance header mismatch');
  invariant(provenance.mode.includes('no CLI/API fallback'), 'generation provenance must reject CLI/API fallback');
  exactSet(provenance.generations.map(item => item.sheetKey), bossIds, 'generation provenance');
  for (const item of provenance.generations) {
    invariant(item.sourceCols === 6 || item.sourceCols === 7, `${item.sheetKey} invalid source columns`);
    invariant(Array.isArray(item.actions) && item.actions.length === 8, `${item.sheetKey} action prompt contract mismatch`);
    const chromaPath = fixedFile(`${ART}/${item.chroma}`, `${item.sheetKey} chroma source`);
    const alphaPath = fixedFile(`${ART}/${item.alpha}`, `${item.sheetKey} alpha source`);
    invariant(sha256(chromaPath) === item.chromaSha256, `${item.sheetKey} chroma provenance hash mismatch`);
    invariant(sha256(alphaPath) === item.alphaSha256, `${item.sheetKey} alpha provenance hash mismatch`);
    const target = recipe.targets[item.sheetKey];
    invariant(target.sourceChromaSha256 === item.chromaSha256, `${item.sheetKey} recipe chroma hash mismatch`);
    invariant(target.sourceAlphaSha256 === item.alphaSha256, `${item.sheetKey} recipe alpha hash mismatch`);
  }
  invariant(provenance.historicalBaselines.length === 7, 'Task 6 baseline count mismatch');
  for (const baseline of provenance.historicalBaselines) {
    invariant(sha256(fixedFile(`${ART}/${baseline.archive}`)) === baseline.sha256, `${baseline.sheetKey} Task 6 baseline hash mismatch`);
  }
}

function validateRuntime(recipe, bossIds) {
  exactSet(recipe.bossIds, bossIds, 'recipe boss IDs');
  exactSet(Object.keys(recipe.targets), bossIds, 'recipe targets');
  invariant(JSON.stringify(recipe.rowContract) === JSON.stringify(ROWS), 'recipe row contract mismatch');
  invariant(sha256(repoFile(recipe.assemblyScript)) === recipe.assemblyScriptSha256, 'assembly script hash mismatch');
  const detached = recipe.detachedComponentContract;
  invariant(sha256(repoFile(detached.path)) === detached.sha256, 'detached component contract hash mismatch');
  invariant(sha256(repoFile(detached.selectionPath)) === detached.selectionSha256, 'detached component selection hash mismatch');

  let inspectedCells = 0;
  for (const bossId of bossIds) {
    const target = recipe.targets[bossId];
    const runtimePath = repoFile(target.path, `${bossId} runtime`);
    invariant(sha256(runtimePath) === target.fileSha256, `${bossId} runtime hash mismatch`);
    const image = readPng(runtimePath);
    invariant(image.width === 1536 && image.height === 2048 && image.bitDepth === 8 && image.colorType === 6 && image.pixels, `${bossId} must be 1536x2048 RGBA`);
    const chroma = chromaArtifactStats(image, { cols: 6, rows: 8 });
    for (const [key, value] of Object.entries(chroma)) invariant(value === 0, `${bossId} ${key} must be zero, got ${value}`);
    for (let row = 0; row < 8; row += 1) {
      const hashes = [];
      for (let col = 0; col < 6; col += 1) {
        const cell = cellHash(image, row, col);
        invariant(cell.opaque >= 64, `${bossId} ${ROWS[row]}:${col} is empty`);
        hashes.push(cell.hash);
        inspectedCells += 1;
      }
      invariant(new Set(hashes).size === 6, `${bossId} ${ROWS[row]} contains duplicate frames`);
    }
  }
  return inspectedCells;
}

function validateManualEvidence(evidence, bossIds) {
  invariant(evidence.evidenceType === 'human-authored full-resolution visual observation', 'manual evidence type mismatch');
  invariant(JSON.stringify(evidence.reviewContract.semanticRows) === JSON.stringify(REVIEWED_ROWS), 'manual row contract mismatch');
  exactSet(evidence.reviews.map(item => item.sheetKey), bossIds, 'manual reviews');
  for (const review of evidence.reviews) {
    invariant(review.status === 'PASS', `${review.sheetKey} has open manual rework`);
    invariant(typeof review.note === 'string' && review.note.trim().length >= 20, `${review.sheetKey} manual note is incomplete`);
    invariant(JSON.stringify(review.passedRows) === JSON.stringify(REVIEWED_ROWS), `${review.sheetKey} manual row verdicts mismatch`);
    const previewPath = fixedFile(`${ART}/${review.preview}`, `${review.sheetKey} review preview`);
    invariant(sha256(previewPath) === review.previewSha256, `${review.sheetKey} preview changed; fresh manual review required`);
  }
}

function main() {
  const bossIds = Object.values(SECRET_ENEMIES).filter(enemy => enemy.isBoss).map(enemy => enemy.id);
  invariant(bossIds.length === 21, `expected 21 bosses, got ${bossIds.length}`);
  const recipe = readJson(`${ART}/assembly_recipe.json`);
  const provenance = readJson(`${ART}/generation_provenance.json`);
  const evidencePath = fixedFile(`${ART}/manual_review_evidence.json`);
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

  validateManifest(bossIds);
  validateProvenance(provenance, recipe, bossIds);
  const inspectedCells = validateRuntime(recipe, bossIds);
  validateManualEvidence(evidence, bossIds);

  const qaDocument = fs.readFileSync(fixedFile('docs/analysis/BOSS_MOTION_QA.md'), 'utf8');
  for (const [label, relative] of [
    ['assembly recipe', `${ART}/assembly_recipe.json`],
    ['detached contract', `${ART}/detached_component_contract.json`],
    ['generation provenance', `${ART}/generation_provenance.json`],
    ['manual evidence', `${ART}/manual_review_evidence.json`],
    ['contact sheet', `${ART}/boss_motion_contact_sheet.png`],
  ]) invariant(qaDocument.includes(sha256(fixedFile(relative))), `QA document has stale ${label} hash`);

  console.log(JSON.stringify({
    bosses: bossIds.length,
    semanticRows: bossIds.length * REVIEWED_ROWS.length,
    inspectedCells,
    manualEvidenceState: 'linked-not-authenticated',
    openManualRework: 0,
    strictChromaIssues: 0,
  }));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
