import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const manualPath = resolve(root, 'docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json');
const previewManifestPath = resolve(root, 'art_sources/combat/task9_companions/preview_manifest.json');
const assemblyRecipePath = resolve(root, 'art_sources/combat/task9_companions/assembly_recipe.json');

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

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
  companion.previewSha256 = preview.previewSha256;
  companion.runtimeSha256 = preview.runtimeSha256;

  for (const skill of companion.skills) {
    const row = rowsByMotion.get(skill.motionKey);
    if (!row) {
      throw new Error(`Missing ${skill.motionKey} row for ${companion.npcId}/${skill.skillId}.`);
    }
    skill.rowSha256 = row.pixelSha256;
  }

  for (const motion of ['hit', 'death']) {
    const row = rowsByMotion.get(companion[motion].motionKey);
    if (!row) {
      throw new Error(`Missing ${motion} row for ${companion.npcId}.`);
    }
    companion[motion].rowSha256 = row.pixelSha256;
  }
}

manual.previewManifestSha256 = sha256(previewBuffer);
manual.contactSha256 = previewManifest.contactSha256;
manual.assemblyRecipeSha256 = sha256(assemblyBuffer);

await writeFile(manualPath, `${JSON.stringify(manual, null, 2)}\n`);
console.log(JSON.stringify({
  companionCount: manual.companions.length,
  skillCount: manual.companions.reduce((sum, companion) => sum + companion.skills.length, 0),
  preservedReviewStatus: manual.reviewStatus,
  openRework: manual.openRework.length,
}));
