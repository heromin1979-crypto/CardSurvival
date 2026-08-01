import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const rootArgument = process.argv.find((argument) => argument.startsWith('--root='))?.slice('--root='.length);
const root = resolve(rootArgument || process.cwd());
const manualPath = resolve(root, 'docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json');
const previewManifestPath = resolve(root, 'art_sources/combat/task9_companions/preview_manifest.json');
const assemblyRecipePath = resolve(root, 'art_sources/combat/task9_companions/assembly_recipe.json');

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

function requireFreshReview(condition, detail) {
  if (!condition) throw new Error(`fresh manual review required: ${detail}`);
}

function repoPath(value) {
  requireFreshReview(typeof value === 'string' && value.startsWith('/'), `invalid repository path ${value}`);
  const result = resolve(root, value.slice(1).split('/').join('/'));
  requireFreshReview(result.startsWith(root + '\\') || result.startsWith(root + '/'), `path escapes root ${value}`);
  return result;
}

const [manualBuffer, previewBuffer, assemblyBuffer] = await Promise.all([
  readFile(manualPath),
  readFile(previewManifestPath),
  readFile(assemblyRecipePath),
]);

const manual = JSON.parse(manualBuffer);
const previewManifest = JSON.parse(previewBuffer);
const assemblyRecipe = JSON.parse(assemblyBuffer);

if (manual.version !== 2 || previewManifest.version !== 2 || assemblyRecipe.version !== 2) {
  throw new Error('Task 9 evidence relinking requires version 2 manifests.');
}

if (manual.companions.length !== 20 || previewManifest.sheets.length !== 20) {
  throw new Error('Task 9 evidence relinking requires exactly 20 companion records.');
}

requireFreshReview(manual.previewManifestSha256 === sha256(previewBuffer), 'preview manifest hash changed');
requireFreshReview(manual.assemblyRecipeSha256 === sha256(assemblyBuffer), 'assembly recipe hash changed');
requireFreshReview(manual.contactPath === previewManifest.contactPath, 'contact sheet path changed');
requireFreshReview(manual.contactSha256 === previewManifest.contactSha256, 'contact sheet hash changed');
requireFreshReview(manual.contactSha256 === sha256(await readFile(repoPath(manual.contactPath))), 'contact sheet content changed');

const previewByKey = new Map(previewManifest.sheets.map((sheet) => [sheet.sheetKey, sheet]));
for (const companion of manual.companions) {
  const preview = previewByKey.get(companion.sheetKey);
  if (!preview) {
    throw new Error(`Missing preview evidence for ${companion.sheetKey}.`);
  }
  if (companion.previewPath !== preview.previewPath || companion.runtimePath !== preview.runtimePath) {
    throw new Error(`Reviewed paths changed for ${companion.sheetKey}; a fresh manual review is required.`);
  }
  const recipeTarget = assemblyRecipe.targets[companion.sheetKey];
  if (!recipeTarget || recipeTarget.path !== companion.runtimePath) {
    throw new Error(`Assembly target mismatch for ${companion.sheetKey}.`);
  }

  const rowsByMotion = new Map(preview.rows.map((row) => [row.motionKey, row]));
  requireFreshReview(companion.previewSha256 === preview.previewSha256, `${companion.sheetKey} preview hash changed`);
  requireFreshReview(companion.runtimeSha256 === preview.runtimeSha256, `${companion.sheetKey} runtime hash changed`);
  requireFreshReview(preview.previewSha256 === sha256(await readFile(repoPath(preview.previewPath))), `${companion.sheetKey} preview content changed`);
  requireFreshReview(preview.runtimeSha256 === sha256(await readFile(repoPath(preview.runtimePath))), `${companion.sheetKey} runtime content changed`);
  for (const skill of companion.skills) {
    const row = rowsByMotion.get(skill.motionKey);
    if (!row) {
      throw new Error(`Missing ${skill.motionKey} row for ${companion.npcId}/${skill.skillId}.`);
    }
    requireFreshReview(skill.rowSha256 === row.pixelSha256, `${companion.npcId}/${skill.skillId} reviewed row changed`);
  }

  for (const motion of ['hit', 'death']) {
    const row = rowsByMotion.get(companion[motion].motionKey);
    if (!row) {
      throw new Error(`Missing ${motion} row for ${companion.npcId}.`);
    }
    requireFreshReview(companion[motion].rowSha256 === row.pixelSha256, `${companion.npcId}/${motion} reviewed row changed`);
  }
}

console.log(JSON.stringify({
  companionCount: manual.companions.length,
  skillCount: manual.companions.reduce((sum, companion) => sum + companion.skills.length, 0),
  evidenceState: 'already-linked-unchanged',
  reviewStatus: manual.reviewStatus,
  openRework: manual.openRework.length,
}));
