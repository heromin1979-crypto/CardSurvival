import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  COMBAT_MOTION_MANIFEST,
  resolveCombatMotion,
} from '../js/data/combatMotionManifest.js';
import {
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../js/data/combatSkills.js';
import { COMPANION_SPRITE_KEYS } from '../js/ui/combat/combatUiAssets.js';
import { chromaArtifactStats, readPng } from './audit_combat_sprites.mjs';
import { analyzeCompanionSheet } from './companion_motion_quality.mjs';

const rootArgument = process.argv.find(arg => arg.startsWith('--root='))?.slice('--root='.length);
const ROOT = path.resolve(rootArgument || process.cwd());
const ROWS = Object.freeze(['idle', 'melee', 'ranged', 'support', 'guard', 'move', 'hit', 'death']);
const ZERO_CHROMA = Object.freeze({
  opaqueGreen: 0,
  fringeGreen: 0,
  hiddenRgb: 0,
  removedComponents: 0,
  staleAllowlist: 0,
});
const EXPECTED_RECIPE_KEYS = Object.freeze([
  'assemblyScript',
  'assemblyScriptSha256',
  'canonicalSources',
  'provenancePath',
  'provenanceSha256',
  'rowContract',
  'targets',
  'version',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(filePath, label) {
  invariant(fs.existsSync(filePath), label + ' is missing: ' + filePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function bgraBytes(image, startY = 0, height = image.height) {
  const bytes = Buffer.alloc(image.width * height * 4);
  let target = 0;
  for (let y = startY; y < startY + height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const source = (y * image.width + x) * 4;
      bytes[target++] = image.pixels[source + 2];
      bytes[target++] = image.pixels[source + 1];
      bytes[target++] = image.pixels[source];
      bytes[target++] = image.pixels[source + 3];
    }
  }
  return bytes;
}

function pixelSha256(image, startY = 0, height = image.height) {
  return createHash('sha256').update(bgraBytes(image, startY, height)).digest('hex');
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === 'object' && !Array.isArray(value), label + ' must be an object');
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(wanted), label + ' keys mismatch: ' + actual.join(','));
}

function exactSet(actual, expected, label) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  invariant(JSON.stringify(left) === JSON.stringify(right), label + ' set mismatch');
}

function repoFile(value, label) {
  invariant(typeof value === 'string' && value.startsWith('/'), label + ' must be a repository absolute path');
  const result = path.resolve(ROOT, value.slice(1).split('/').join(path.sep));
  const relative = path.relative(ROOT, result);
  invariant(relative && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), label + ' escapes root: ' + value);
  invariant(fs.existsSync(result), label + ' is missing: ' + value);
  return result;
}

function fixedFile(relative) {
  const result = path.resolve(ROOT, relative);
  const within = path.relative(ROOT, result);
  invariant(!within.startsWith('..' + path.sep) && !path.isAbsolute(within), 'fixed path escapes root');
  return result;
}

function validateRecipe(recipe, recipePath, expectedSheetKeys) {
  exactKeys(recipe, EXPECTED_RECIPE_KEYS, 'assembly recipe');
  invariant(recipe.version === 2, 'assembly recipe version must be 2');
  invariant(JSON.stringify(recipe.rowContract) === JSON.stringify(ROWS), 'assembly recipe row contract mismatch');

  const assemblyPath = repoFile(recipe.assemblyScript, 'assembly script');
  invariant(recipe.assemblyScript === '/tools/build_companion_motion_sheets.ps1', 'unexpected assembly script path');
  invariant(recipe.assemblyScriptSha256 === sha256(assemblyPath), 'assembly script SHA-256 mismatch');

  const provenancePath = repoFile(recipe.provenancePath, 'generation provenance');
  invariant(recipe.provenanceSha256 === sha256(provenancePath), 'generation provenance SHA-256 mismatch');
  invariant(path.resolve(recipePath) === fixedFile('art_sources/combat/task9_companions/assembly_recipe.json'), 'unexpected recipe location');

  const sourceEntries = Object.entries(recipe.canonicalSources || {});
  invariant(sourceEntries.length >= 20, 'canonical source inventory is incomplete');
  for (const [sourceKey, source] of sourceEntries) {
    exactKeys(source, ['alphaPath', 'alphaSha256', 'chromaPath', 'chromaSha256', 'cols', 'key', 'rows'], 'source ' + sourceKey);
    invariant(Number.isInteger(source.cols) && source.cols >= 1, sourceKey + ' invalid cols');
    invariant(Number.isInteger(source.rows) && source.rows >= 1, sourceKey + ' invalid rows');
    invariant(source.key === 'green' || source.key === 'magenta', sourceKey + ' invalid chroma key');
    const chromaPath = repoFile(source.chromaPath, sourceKey + ' chroma source');
    const alphaPath = repoFile(source.alphaPath, sourceKey + ' alpha source');
    invariant(source.chromaSha256 === sha256(chromaPath), sourceKey + ' source chroma SHA-256 mismatch');
    invariant(source.alphaSha256 === sha256(alphaPath), sourceKey + ' source alpha SHA-256 mismatch');
    const chroma = readPng(chromaPath);
    const alpha = readPng(alphaPath);
    invariant(chroma.width === alpha.width && chroma.height === alpha.height, sourceKey + ' chroma/alpha dimensions mismatch');
    invariant(chroma.width >= source.cols * 64 && chroma.height >= source.rows * 64, sourceKey + ' source dimensions are too small for declared grid');
  }

  const targetEntries = Object.entries(recipe.targets || {});
  exactSet(targetEntries.map(([key]) => key), expectedSheetKeys, 'recipe target');
  for (const [sheetKey, target] of targetEntries) {
    exactKeys(target, ['fileSha256', 'height', 'path', 'pixelSha256', 'rows', 'width'], 'target ' + sheetKey);
    invariant(target.width === 1536 && target.height === 2048, sheetKey + ' target dimensions mismatch');
    invariant(Array.isArray(target.rows) && target.rows.length === 8, sheetKey + ' row mapping count mismatch');
    const runtimePath = repoFile(target.path, sheetKey + ' runtime target');
    const runtime = readPng(runtimePath);
    invariant(runtime.width === 1536 && runtime.height === 2048 && runtime.pixels, sheetKey + ' runtime PNG format mismatch');
    invariant(target.fileSha256 === sha256(runtimePath), sheetKey + ' runtime file SHA-256 mismatch');
    invariant(/^[0-9a-f]{64}$/.test(target.pixelSha256), sheetKey + ' runtime pixel SHA-256 is malformed');

    const targetRows = [];
    for (const mapping of target.rows) {
      exactKeys(mapping, ['source', 'sourceColumns', 'sourceRow', 'targetRow'], sheetKey + ' row mapping');
      invariant(Number.isInteger(mapping.targetRow) && mapping.targetRow >= 0 && mapping.targetRow < 8, sheetKey + ' invalid target row');
      targetRows.push(mapping.targetRow);
      const source = recipe.canonicalSources[mapping.source];
      invariant(source, sheetKey + ' references unknown source ' + mapping.source);
      invariant(Number.isInteger(mapping.sourceRow) && mapping.sourceRow >= 0 && mapping.sourceRow < source.rows, sheetKey + ' invalid source row');
      invariant(Array.isArray(mapping.sourceColumns) && mapping.sourceColumns.length === 6, sheetKey + ' requires six source columns');
      invariant(new Set(mapping.sourceColumns).size === 6, sheetKey + ' source columns must be distinct');
      invariant(mapping.sourceColumns.every(column => Number.isInteger(column) && column >= 0 && column < source.cols), sheetKey + ' source column out of bounds');
    }
    exactSet(targetRows, [0, 1, 2, 3, 4, 5, 6, 7], sheetKey + ' target rows');
  }
  return { provenancePath };
}

function validateProvenance(provenance, recipe, expectedSheetKeys) {
  exactKeys(provenance, ['commonNormalizedPrompt', 'generations', 'historicalBaselines', 'mode', 'rejected', 'supplements', 'tool', 'version'], 'generation provenance');
  invariant(provenance.version === 1, 'generation provenance version mismatch');
  invariant(provenance.tool === 'built-in image_gen', 'provenance tool must be built-in image_gen');
  invariant(typeof provenance.mode === 'string' && provenance.mode.includes('no CLI/API fallback'), 'provenance mode must reject CLI/API fallback');
  invariant(JSON.stringify(provenance.commonNormalizedPrompt?.rowContract) === JSON.stringify(ROWS), 'provenance row contract mismatch');
  invariant(Array.isArray(provenance.generations) && provenance.generations.length === 20, 'provenance must contain 20 primary generations');
  exactSet(provenance.generations.map(entry => entry.sheetKey), expectedSheetKeys, 'provenance generation sheets');

  const acceptedArchives = new Map();
  for (const entry of [...provenance.generations, ...provenance.supplements]) {
    invariant(typeof entry.archive === 'string' && entry.archive.endsWith('.png'), 'provenance archive is invalid');
    invariant(!acceptedArchives.has(entry.archive), 'duplicate accepted provenance archive: ' + entry.archive);
    acceptedArchives.set(entry.archive, entry);
  }
  invariant(Array.isArray(provenance.supplements) && provenance.supplements.length >= 1, 'supplement provenance is missing');
  invariant(Array.isArray(provenance.rejected) && provenance.rejected.length >= 1, 'rejected provenance is missing');
  for (const rejected of provenance.rejected) {
    invariant(typeof rejected.archive === 'string' && typeof rejected.reason === 'string' && rejected.reason.trim(), 'rejected provenance note is incomplete');
  }
  for (const source of Object.values(recipe.canonicalSources)) {
    const archive = path.posix.basename(source.chromaPath);
    const accepted = acceptedArchives.get(archive);
    invariant(accepted, 'canonical source lacks accepted imagegen provenance: ' + archive);
    const rejected = provenance.rejected.find(entry => entry.archive === archive);
    invariant(!rejected || typeof accepted.selection === 'string', 'rejected archive reused without an explicit accepted selection: ' + archive);
  }
}

function validatePreview(preview, recipe, expectedSheetKeys) {
  exactKeys(preview, ['contactPath', 'contactSha256', 'rendererPath', 'rendererSha256', 'sheets', 'version'], 'preview manifest');
  invariant(preview.version === 2, 'preview manifest version must be 2');
  const rendererPath = repoFile(preview.rendererPath, 'preview renderer');
  invariant(preview.rendererSha256 === sha256(rendererPath), 'preview renderer SHA-256 mismatch');
  const contactPath = repoFile(preview.contactPath, 'contact sheet');
  invariant(preview.contactSha256 === sha256(contactPath), 'contact sheet SHA-256 mismatch');
  invariant(Array.isArray(preview.sheets) && preview.sheets.length === 20, 'preview manifest must contain 20 sheets');
  exactSet(preview.sheets.map(sheet => sheet.sheetKey), expectedSheetKeys, 'preview sheets');

  const byKey = new Map();
  for (const sheet of preview.sheets) {
    exactKeys(sheet, ['previewPath', 'previewSha256', 'rows', 'runtimePath', 'runtimeSha256', 'sheetKey'], 'preview sheet ' + sheet.sheetKey);
    invariant(!byKey.has(sheet.sheetKey), 'duplicate preview sheet ' + sheet.sheetKey);
    const target = recipe.targets[sheet.sheetKey];
    invariant(sheet.runtimePath === target.path, sheet.sheetKey + ' preview/runtime path mismatch');
    const runtimePath = repoFile(sheet.runtimePath, sheet.sheetKey + ' preview runtime');
    const previewPath = repoFile(sheet.previewPath, sheet.sheetKey + ' enlarged review board');
    invariant(sheet.runtimeSha256 === sha256(runtimePath), sheet.sheetKey + ' preview runtime SHA-256 mismatch');
    invariant(sheet.previewSha256 === sha256(previewPath), sheet.sheetKey + ' enlarged preview SHA-256 mismatch');
    const image = readPng(runtimePath);
    invariant(Array.isArray(sheet.rows) && sheet.rows.length === 8, sheet.sheetKey + ' preview row count mismatch');
    for (let row = 0; row < 8; row += 1) {
      const evidence = sheet.rows[row];
      exactKeys(evidence, ['motionKey', 'pixelSha256', 'row'], sheet.sheetKey + ' preview row');
      invariant(evidence.row === row && evidence.motionKey === ROWS[row], sheet.sheetKey + ' preview row contract mismatch');
      invariant(/^[0-9a-f]{64}$/.test(evidence.pixelSha256), sheet.sheetKey + ' preview row pixel SHA-256 is malformed');
    }
    byKey.set(sheet.sheetKey, sheet);
  }
  return { byKey, contactPath };
}

function validateManual(manual, manualPath, recipePath, previewPath, previewByKey, expectedNpcIds) {
  exactKeys(manual, ['assemblyRecipePath', 'assemblyRecipeSha256', 'companions', 'contactPath', 'contactSha256', 'evidenceType', 'openRework', 'previewManifestPath', 'previewManifestSha256', 'reviewStatus', 'reviewedAt', 'reviewedCounts', 'reviewerMethod', 'version'], 'manual evidence');
  invariant(manual.version === 2, 'manual evidence version must be 2');
  invariant(manual.evidenceType === 'human manual visual observation', 'manual evidence must identify human/manual observation');
  invariant(manual.reviewStatus === 'PASS', 'manual review status is not PASS');
  invariant(Array.isArray(manual.openRework) && manual.openRework.length === 0, 'manual PASS contradicts open rework');
  invariant(manual.reviewedCounts?.companions === 20 && manual.reviewedCounts?.runtimeSheets === 20 && manual.reviewedCounts?.enlargedReviewBoards === 20 && manual.reviewedCounts?.cells === 960, 'manual reviewed counts mismatch');
  invariant(typeof manual.reviewerMethod === 'string' && manual.reviewerMethod.includes('20개'), 'manual review method is incomplete');
  invariant(repoFile(manual.previewManifestPath, 'manual preview manifest') === previewPath, 'manual preview manifest path mismatch');
  invariant(manual.previewManifestSha256 === sha256(previewPath), 'manual preview manifest SHA-256 mismatch');
  invariant(repoFile(manual.assemblyRecipePath, 'manual recipe') === recipePath, 'manual recipe path mismatch');
  invariant(manual.assemblyRecipeSha256 === sha256(recipePath), 'manual recipe SHA-256 mismatch');
  const contactPath = repoFile(manual.contactPath, 'manual contact');
  invariant(manual.contactSha256 === sha256(contactPath), 'manual contact SHA-256 mismatch');
  invariant(Array.isArray(manual.companions) && manual.companions.length === 20, 'manual evidence must contain 20 companions');
  exactSet(manual.companions.map(entry => entry.npcId), expectedNpcIds, 'manual companion IDs');

  const byNpc = new Map(manual.companions.map(entry => [entry.npcId, entry]));
  invariant(byNpc.size === 20, 'manual evidence has duplicate companion IDs');
  const allSkillIds = [];
  for (const [npcId, expectedSkills] of Object.entries(COMPANION_COMBAT_LOADOUTS)) {
    const entry = byNpc.get(npcId);
    const sheetKey = COMPANION_SPRITE_KEYS[npcId];
    const preview = previewByKey.get(sheetKey);
    exactKeys(entry, ['continuityNote', 'death', 'hit', 'identityNote', 'npcId', 'previewPath', 'previewSha256', 'runtimePath', 'runtimeSha256', 'sheetKey', 'skills', 'weaponNote'], npcId + ' manual record');
    invariant(entry.sheetKey === sheetKey, npcId + ' manual sheet key mismatch');
    invariant(entry.previewPath === preview.previewPath && entry.previewSha256 === preview.previewSha256, npcId + ' manual preview hash/path mismatch');
    invariant(entry.runtimePath === preview.runtimePath && entry.runtimeSha256 === preview.runtimeSha256, npcId + ' manual runtime hash/path mismatch');
    for (const field of ['identityNote', 'weaponNote', 'continuityNote']) {
      invariant(typeof entry[field] === 'string' && entry[field].trim(), npcId + ' missing ' + field);
    }
    invariant(Array.isArray(entry.skills) && entry.skills.length === 3, npcId + ' manual skill count mismatch');
    exactSet(entry.skills.map(skill => skill.skillId), expectedSkills, npcId + ' manual skills');
    for (const skill of entry.skills) {
      exactKeys(skill, ['motionKey', 'note', 'rowSha256', 'skillId', 'status'], skill.skillId + ' manual record');
      const expectedMotion = COMBAT_SKILLS[skill.skillId]?.motionKey;
      invariant(skill.status === 'PASS' && skill.motionKey === expectedMotion, skill.skillId + ' manual motion/status mismatch');
      invariant(typeof skill.note === 'string' && skill.note.trim(), skill.skillId + ' manual note is empty');
      const row = preview.rows.find(item => item.motionKey === expectedMotion);
      invariant(skill.rowSha256 === row?.pixelSha256, skill.skillId + ' manual row hash mismatch');
      invariant(resolveCombatMotion(sheetKey, expectedMotion)?.row === ROWS.indexOf(expectedMotion), skill.skillId + ' manifest row mismatch');
      allSkillIds.push(skill.skillId);
    }
    for (const state of ['hit', 'death']) {
      const evidence = entry[state];
      exactKeys(evidence, ['motionKey', 'note', 'rowSha256', 'status'], npcId + ' manual ' + state + ' record');
      invariant(evidence?.status === 'PASS' && evidence.motionKey === state, npcId + ' manual ' + state + ' status mismatch');
      invariant(typeof evidence.note === 'string' && evidence.note.trim(), npcId + ' manual ' + state + ' note is empty');
      invariant(evidence.rowSha256 === preview.rows[ROWS.indexOf(state)].pixelSha256, npcId + ' manual ' + state + ' row hash mismatch');
    }
  }
  const expectedSkillIds = Object.values(COMPANION_COMBAT_LOADOUTS).flat();
  exactSet(allSkillIds, expectedSkillIds, 'manual skill evidence');
  invariant(allSkillIds.length === 60 && new Set(allSkillIds).size === 60, 'manual evidence must cover 60 unique skills once');
  invariant(path.resolve(manualPath) === fixedFile('docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json'), 'unexpected manual evidence location');
}

function verifyRuntimeAndManifest(recipe, expectedNpcIds, expectedSheetKeys) {
  const spriteKeys = Reflect.ownKeys(COMPANION_SPRITE_KEYS).filter(key => typeof key === 'string');
  exactSet(spriteKeys, expectedNpcIds, 'enumerable companion sprite roster');
  invariant(spriteKeys.length === 20, 'companion sprite roster must have exactly 20 own keys');
  invariant(new Set(spriteKeys.map(npcId => COMPANION_SPRITE_KEYS[npcId])).size === 20, 'companion sprite sheet keys must be unique');
  exactSet(spriteKeys.map(npcId => COMPANION_SPRITE_KEYS[npcId]), expectedSheetKeys, 'companion sheet keys');

  let cellCount = 0;
  const sheets = [];
  for (const npcId of expectedNpcIds) {
    const sheetKey = COMPANION_SPRITE_KEYS[npcId];
    const sheet = COMBAT_MOTION_MANIFEST[sheetKey];
    invariant(sheet, 'missing combat motion manifest sheet ' + sheetKey);
    invariant(sheet.cols === 6 && sheet.rows === 8, sheetKey + ' manifest grid mismatch');
    invariant(JSON.stringify(Object.keys(sheet.motions)) === JSON.stringify(ROWS), sheetKey + ' semantic row contract mismatch');
    invariant(sheet.motions.idle.loop === true && ROWS.slice(1).every(key => sheet.motions[key].loop === false), sheetKey + ' loop contract mismatch');
    invariant(sheet.src === recipe.targets[sheetKey].path, sheetKey + ' manifest/recipe path mismatch');

    const runtimePath = repoFile(sheet.src, sheetKey + ' manifest runtime');
    const image = readPng(runtimePath);
    const quality = analyzeCompanionSheet(image);
    invariant(quality.frames.length === 48, sheetKey + ' quality frame count mismatch');
    invariant(quality.issues.length === 0, sheetKey + ' quality issues: ' + quality.issues.slice(0, 4).join('; '));
    const chroma = chromaArtifactStats(image, { cols: 6, rows: 8 });
    invariant(JSON.stringify(chroma) === JSON.stringify(ZERO_CHROMA), sheetKey + ' strict chroma metrics are not zero: ' + JSON.stringify(chroma));
    cellCount += quality.frames.length;
    sheets.push({ npcId, sheetKey, path: sheet.src, cells: quality.frames.length, fileSha256: sha256(runtimePath), pixelSha256: pixelSha256(image) });
  }
  invariant(cellCount === 960, 'automatic quality check must inspect all 960 cells');
  return sheets;
}

function runBuilderCheck(recipe) {
  const script = repoFile(recipe.assemblyScript, 'builder check script');
  const command = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
  const result = spawnSync(command, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Check', '-Root', ROOT], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 180000,
  });
  invariant(!result.error, 'builder -Check failed to start: ' + result.error?.message);
  invariant(result.status === 0, 'builder -Check failed: ' + (result.stderr || result.stdout).trim());
  invariant((result.stdout || '').includes('20 deterministic targets verified'), 'builder -Check did not verify 20 targets');
}

function verify() {
  const expectedNpcIds = Object.keys(COMPANION_COMBAT_LOADOUTS);
  invariant(expectedNpcIds.length === 20, 'expected 20 companion loadouts');
  const expectedSheetKeys = expectedNpcIds.map(npcId => COMPANION_SPRITE_KEYS[npcId]);

  const recipePath = fixedFile('art_sources/combat/task9_companions/assembly_recipe.json');
  const previewPath = fixedFile('art_sources/combat/task9_companions/preview_manifest.json');
  const manualPath = fixedFile('docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json');
  const recipe = readJson(recipePath, 'assembly recipe');
  const { provenancePath } = validateRecipe(recipe, recipePath, expectedSheetKeys);
  validateProvenance(readJson(provenancePath, 'generation provenance'), recipe, expectedSheetKeys);
  const preview = validatePreview(readJson(previewPath, 'preview manifest'), recipe, expectedSheetKeys);
  validateManual(readJson(manualPath, 'manual evidence'), manualPath, recipePath, previewPath, preview.byKey, expectedNpcIds);
  const sheets = verifyRuntimeAndManifest(recipe, expectedNpcIds, expectedSheetKeys);
  runBuilderCheck(recipe);

  return {
    version: 2,
    evidenceType: 'automatic immutable manifest/source/runtime/preview linkage verification',
    manualEvidenceState: 'linked-not-authenticated',
    root: ROOT,
    counts: {
      companions: 20,
      uniqueSheets: 20,
      skills: 60,
      hitDeathRecords: 40,
      inspectedCells: 960,
      qualityIssues: 0,
      openManualRework: 0,
    },
    strictChromaTotals: { ...ZERO_CHROMA },
    assemblyRecipeSha256: sha256(recipePath),
    previewManifestSha256: sha256(previewPath),
    manualEvidenceSha256: sha256(manualPath),
    sheets,
  };
}

try {
  const result = verify();
  if (process.argv.includes('--write')) {
    const output = fixedFile('docs/analysis/COMPANION_MOTION_QA.json');
    fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', 'utf8');
  }
  console.log(JSON.stringify({ status: 'PASS', ...result.counts, manualEvidenceState: result.manualEvidenceState }));
} catch (error) {
  console.error('Companion motion QA verification failed: ' + error.message);
  process.exitCode = 1;
}
