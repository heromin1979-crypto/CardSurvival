import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

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

const ROOT = process.cwd();
const ROWS = Object.freeze(['idle', 'melee', 'ranged', 'support', 'guard', 'move', 'hit', 'death']);
const DEFAULT_MANUAL = path.join(ROOT, 'docs', 'analysis', 'COMPANION_MOTION_MANUAL_OBSERVATIONS.json');
const DEFAULT_RECIPE = path.join(ROOT, 'art_sources', 'combat', 'task9_companions', 'assembly_recipe.json');
const DEFAULT_PROVENANCE = path.join(ROOT, 'art_sources', 'combat', 'task9_companions', 'generation_provenance.json');
const DEFAULT_CONTACT = path.join(ROOT, 'art_sources', 'combat', 'task9_companions', 'companion_motion_contact_sheet.png');
const AUTO_OUT = path.join(ROOT, 'docs', 'analysis', 'COMPANION_MOTION_QA.json');
const ZERO_CHROMA = Object.freeze({
  opaqueGreen: 0,
  fringeGreen: 0,
  hiddenRgb: 0,
  removedComponents: 0,
  staleAllowlist: 0,
});

function argumentPath(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
  return value ? path.resolve(ROOT, value) : fallback;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function manifestPath(src) {
  invariant(typeof src === 'string' && src.startsWith('/'), `invalid manifest src: ${src}`);
  return path.join(ROOT, src.slice(1).split('/').join(path.sep));
}

function pixelAlpha(image, x, y) {
  return image.pixels[(y * image.width + x) * 4 + 3];
}

function inspectCells(image) {
  const cellWidth = image.width / 6;
  const cellHeight = image.height / 8;
  let populatedCells = 0;
  let transparentCorners = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const x0 = col * cellWidth;
      const y0 = row * cellHeight;
      const corners = [
        [x0, y0],
        [x0 + cellWidth - 1, y0],
        [x0, y0 + cellHeight - 1],
        [x0 + cellWidth - 1, y0 + cellHeight - 1],
      ];
      if (corners.every(([x, y]) => pixelAlpha(image, x, y) === 0)) transparentCorners += 1;
      let populated = false;
      for (let y = y0; y < y0 + cellHeight && !populated; y += 1) {
        for (let x = x0; x < x0 + cellWidth; x += 1) {
          if (pixelAlpha(image, x, y) > 12) {
            populated = true;
            break;
          }
        }
      }
      if (populated) populatedCells += 1;
    }
  }
  return { populatedCells, transparentCorners };
}

function verify() {
  const manualPath = argumentPath('manual', DEFAULT_MANUAL);
  const recipePath = argumentPath('recipe', DEFAULT_RECIPE);
  const provenancePath = argumentPath('provenance', DEFAULT_PROVENANCE);
  const contactPath = argumentPath('contact', DEFAULT_CONTACT);
  const manual = readJson(manualPath);
  const recipe = readJson(recipePath);
  const provenance = readJson(provenancePath);
  const loadoutEntries = Object.entries(COMPANION_COMBAT_LOADOUTS);
  const spriteEntries = Object.entries(COMPANION_SPRITE_KEYS);

  invariant(loadoutEntries.length === 20, `expected 20 companion loadouts, got ${loadoutEntries.length}`);
  invariant(spriteEntries.length === 20, `expected 20 companion sprite mappings, got ${spriteEntries.length}`);
  invariant(JSON.stringify(loadoutEntries.map(([id]) => id).sort()) === JSON.stringify(spriteEntries.map(([id]) => id).sort()), 'loadout/sprite ID set mismatch');
  invariant(new Set(spriteEntries.map(([, key]) => key)).size === 20, 'companion sprite keys must be unique');
  invariant(Object.keys(recipe.targets ?? {}).length === 20, 'assembly recipe must have 20 targets');
  invariant((provenance.generations ?? []).length === 20, 'generation provenance must have 20 primary generations');

  const skillIds = loadoutEntries.flatMap(([, ids]) => ids);
  invariant(skillIds.length === 60 && new Set(skillIds).size === 60, 'companion loadouts must contain 60 unique skill IDs');
  invariant((manual.companions ?? []).length === 20, 'manual evidence must contain 20 companions');
  invariant(manual.contactSheetSha256 === sha256(contactPath), 'manual contact-sheet SHA-256 mismatch');
  invariant(manual.assemblyRecipeSha256 === sha256(recipePath), 'manual assembly-recipe SHA-256 mismatch');
  invariant(manual.evidenceType === 'manual visual observation', 'manual evidence type is not independent visual observation');

  const manualByNpc = new Map(manual.companions.map(entry => [entry.npcId, entry]));
  invariant(manualByNpc.size === 20, 'manual evidence has duplicate companion IDs');
  const manualSkillIds = [];
  let hitDeathPass = 0;
  const sheets = [];

  for (const [npcId, expectedSkills] of loadoutEntries) {
    const sheetKey = COMPANION_SPRITE_KEYS[npcId];
    const sheet = COMBAT_MOTION_MANIFEST[sheetKey];
    const observation = manualByNpc.get(npcId);
    invariant(sheet, `missing manifest sheet for ${npcId}`);
    invariant(observation, `missing manual evidence for ${npcId}`);
    invariant(observation.sheetKey === sheetKey, `manual sheet key mismatch for ${npcId}`);
    invariant(typeof observation.identity === 'string' && observation.identity.trim(), `missing identity observation for ${npcId}`);
    invariant(typeof observation.weapon === 'string' && observation.weapon.trim(), `missing weapon observation for ${npcId}`);
    invariant(typeof observation.continuity === 'string' && observation.continuity.trim(), `missing continuity observation for ${npcId}`);
    invariant(sheet.cols === 6 && sheet.rows === 8, `${sheetKey} manifest grid is not 6x8`);
    invariant(JSON.stringify(Object.keys(sheet.motions)) === JSON.stringify(ROWS), `${sheetKey} semantic row contract mismatch`);
    invariant(sheet.motions.idle.loop === true, `${sheetKey} idle must loop`);
    invariant(ROWS.slice(1).every(key => sheet.motions[key].loop === false), `${sheetKey} only idle may loop`);

    const observedSkills = observation.skills ?? [];
    invariant(observedSkills.length === 3, `${npcId} must have three manual skill observations`);
    invariant(JSON.stringify(observedSkills.map(item => item.skillId).sort()) === JSON.stringify([...expectedSkills].sort()), `${npcId} manual skill set mismatch`);
    for (const item of observedSkills) {
      const expectedMotion = COMBAT_SKILLS[item.skillId]?.motionKey;
      invariant(item.status === 'PASS', `${item.skillId} manual status is not PASS`);
      invariant(typeof item.observation === 'string' && item.observation.trim(), `${item.skillId} manual observation is empty`);
      invariant(item.motionKey === expectedMotion, `${item.skillId} manual motion key mismatch`);
      invariant(resolveCombatMotion(sheetKey, expectedMotion)?.row === ROWS.indexOf(expectedMotion), `${item.skillId} manifest row mismatch`);
      manualSkillIds.push(item.skillId);
    }
    for (const state of ['hit', 'death']) {
      invariant(observation[state]?.status === 'PASS', `${npcId}/${state} manual status is not PASS`);
      invariant(typeof observation[state]?.observation === 'string' && observation[state].observation.trim(), `${npcId}/${state} manual observation is empty`);
      invariant(resolveCombatMotion(sheetKey, state)?.row === ROWS.indexOf(state), `${npcId}/${state} manifest row mismatch`);
      hitDeathPass += 1;
    }

    const filePath = manifestPath(sheet.src);
    const image = readPng(filePath);
    invariant(image.width === 1536 && image.height === 2048, `${sheetKey} PNG dimensions are not 1536x2048`);
    invariant(image.bitDepth === 8 && image.colorType === 6 && image.pixels, `${sheetKey} PNG is not 8-bit RGBA`);
    const cells = inspectCells(image);
    invariant(cells.populatedCells === 48, `${sheetKey} has ${cells.populatedCells}/48 populated cells`);
    invariant(cells.transparentCorners === 48, `${sheetKey} has ${cells.transparentCorners}/48 transparent-corner cells`);
    const chroma = chromaArtifactStats(image, { cols: 6, rows: 8 });
    invariant(JSON.stringify(chroma) === JSON.stringify(ZERO_CHROMA), `${sheetKey} strict chroma metrics are not exact zero: ${JSON.stringify(chroma)}`);
    const target = recipe.targets[sheetKey];
    invariant(target?.path === sheet.src, `${sheetKey} recipe/manifest path mismatch`);
    invariant(target.width === 1536 && target.height === 2048, `${sheetKey} recipe dimensions mismatch`);
    invariant(target.fileSha256 === sha256(filePath), `${sheetKey} runtime SHA-256 does not match recipe`);
    invariant((target.rows ?? []).length === 8, `${sheetKey} recipe row provenance incomplete`);
    sheets.push({ npcId, sheetKey, path: sheet.src, ...cells, chroma, sha256: target.fileSha256 });
  }

  invariant(manualSkillIds.length === 60 && new Set(manualSkillIds).size === 60, 'manual evidence must cover 60 unique skills exactly once');
  invariant(JSON.stringify([...manualSkillIds].sort()) === JSON.stringify([...skillIds].sort()), 'manual evidence skill set differs from loadouts');
  invariant(hitDeathPass === 40, `manual hit/death evidence must contain 40 PASS records, got ${hitDeathPass}`);

  return {
    version: 1,
    evidenceType: 'automatic manifest/PNG/chroma/provenance verification',
    manualEvidence: path.relative(ROOT, manualPath).split(path.sep).join('/'),
    counts: { companions: 20, uniqueSheets: 20, skills: 60, hitDeath: 40, populatedCells: 960, transparentCornerCells: 960 },
    strictChromaTotals: { ...ZERO_CHROMA },
    contactSheetSha256: sha256(contactPath),
    assemblyRecipeSha256: sha256(recipePath),
    sheets,
  };
}

try {
  const result = verify();
  if (process.argv.includes('--write')) fs.writeFileSync(AUTO_OUT, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ status: 'PASS', ...result.counts, strictChroma: result.strictChromaTotals }));
} catch (error) {
  console.error(`Companion motion QA verification failed: ${error.message}`);
  process.exitCode = 1;
}
