// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { COMBAT_MOTION_MANIFEST } from '../../js/data/combatMotionManifest.js';
import { COMPANION_SPRITE_KEYS } from '../../js/ui/combat/combatUiAssets.js';
import { readPng } from '../../tools/audit_combat_sprites.mjs';
import {
  analyzeCompanionSheet,
  loadRangedComponentContract,
  RANGED_COMPONENT_CONTRACT_RELATIVE_PATH,
} from '../../tools/companion_motion_quality.mjs';
import { canonicalJsonBytes } from '../../tools/provenance_hash.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const VERIFIER = path.join(ROOT, 'tools', 'verify_companion_motion_qa.mjs');
const RELINKER = path.join(ROOT, 'tools', 'relink_companion_motion_manual_evidence.mjs');
const RECIPE_RELATIVE = 'art_sources/combat/task9_companions/assembly_recipe.json';
const PREVIEW_RELATIVE = 'art_sources/combat/task9_companions/preview_manifest.json';
const MANUAL_RELATIVE = 'docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json';
const BUILDER_RELATIVE = 'tools/build_companion_motion_sheets.ps1';

function repoPath(root, value) {
  return path.join(root, value.replace(/^\//, '').split('/').join(path.sep));
}

function copyFile(root, relative) {
  const source = path.join(ROOT, relative);
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function verifier(root) {
  return spawnSync(process.execPath, [VERIFIER, '--root=' + root], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 180000,
  });
}

function relinker(root) {
  return spawnSync(process.execPath, [RELINKER, '--root=' + root], {
    cwd: root,
    encoding: 'utf8',
    timeout: 180000,
  });
}

function withDetachedSquare(image, row, col, x0, y0, size = 20) {
  const changed = { ...image, pixels: Uint8Array.from(image.pixels) };
  for (let y = y0; y < y0 + size; y += 1) {
    for (let x = x0; x < x0 + size; x += 1) {
      const offset = ((row * 256 + y) * changed.width + col * 256 + x) * 4;
      changed.pixels[offset] = 255;
      changed.pixels[offset + 1] = 0;
      changed.pixels[offset + 2] = 255;
      changed.pixels[offset + 3] = 255;
    }
  }
  return changed;
}

describe('Task 9 companion motion quality and immutable provenance', () => {
  let fixtureRoot;
  let recipe;
  let preview;
  let rangedContract;

  beforeAll(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'task9-companion-fixture-'));
    recipe = JSON.parse(fs.readFileSync(path.join(ROOT, RECIPE_RELATIVE), 'utf8'));
    preview = JSON.parse(fs.readFileSync(path.join(ROOT, PREVIEW_RELATIVE), 'utf8'));
    rangedContract = loadRangedComponentContract(ROOT, preview.sheets.map((sheet) => sheet.sheetKey));
    const paths = new Set([
      RECIPE_RELATIVE,
      PREVIEW_RELATIVE,
      'art_sources/combat/task9_companions/generation_provenance.json',
      'art_sources/combat/task9_companions/companion_motion_contact_sheet.png',
      MANUAL_RELATIVE,
      BUILDER_RELATIVE,
      RANGED_COMPONENT_CONTRACT_RELATIVE_PATH,
      recipe.qualityAnalyzerPath.replace(/^\//, ''),
      recipe.rangedValidatorPath.replace(/^\//, ''),
      'tools/audit_combat_sprites.mjs',
      'js/data/combatMotionManifest.js',
      'tools/render_companion_motion_preview.ps1',
      'tools/provenance_hash.mjs',
    ]);
    for (const source of Object.values(recipe.canonicalSources)) {
      paths.add(source.chromaPath.replace(/^\//, ''));
      paths.add(source.alphaPath.replace(/^\//, ''));
    }
    for (const target of Object.values(recipe.targets)) paths.add(target.path.replace(/^\//, ''));
    for (const sheet of preview.sheets) paths.add(sheet.previewPath.replace(/^\//, ''));
    for (const relative of paths) copyFile(fixtureRoot, relative);
  }, 180000);

  afterAll(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it('inspects all 960 runtime cells with fragment, area, clipping and continuity diagnostics', () => {
    let cells = 0;
    const failures = [];
    for (const sheetKey of Object.values(COMPANION_SPRITE_KEYS)) {
      const sheet = COMBAT_MOTION_MANIFEST[sheetKey];
      const analysis = analyzeCompanionSheet(readPng(repoPath(ROOT, sheet.src)), undefined, { sheetKey, rangedContract });
      cells += analysis.frames.length;
      failures.push(...analysis.issues.map(issue => sheetKey + ': ' + issue));
    }
    expect(cells).toBe(960);
    expect(failures).toEqual([]);
  }, 180000);

  it('passes in a checkout fixture without .git', () => {
    expect(fs.existsSync(path.join(fixtureRoot, '.git'))).toBe(false);
    const result = verifier(fixtureRoot);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('"status":"PASS"');
    expect(result.stdout).toContain('"inspectedCells":960');
  }, 180000);

  it('keeps provenance valid when a tracked JSON contract is checked out with CRLF instead of LF', () => {
    const contractPath = path.join(fixtureRoot, RANGED_COMPONENT_CONTRACT_RELATIVE_PATH);
    const original = fs.readFileSync(contractPath);
    try {
      fs.writeFileSync(
        contractPath,
        original.toString('utf8').replaceAll('\r\n', '\n').replaceAll('\n', '\r\n'),
        'utf8',
      );
      const result = verifier(fixtureRoot);
      expect(result.status, result.stderr || result.stdout).toBe(0);
    } finally {
      fs.writeFileSync(contractPath, original);
    }
  }, 180000);

  it('keeps already-linked manual evidence byte-for-byte unchanged', () => {
    const manualPath = path.join(fixtureRoot, MANUAL_RELATIVE);
    const original = fs.readFileSync(manualPath);
    const result = relinker(fixtureRoot);
    expect(result.status).toBe(0);
    expect(fs.readFileSync(manualPath)).toEqual(original);
  }, 180000);

  it.each([
    ['runtime content', () => repoPath(fixtureRoot, preview.sheets[0].runtimePath), 'append'],
    ['preview content', () => repoPath(fixtureRoot, preview.sheets[0].previewPath), 'append'],
    ['row content hash', () => path.join(fixtureRoot, PREVIEW_RELATIVE), 'row'],
  ])('rejects changed %s without relinking stale PASS evidence', (_label, filePathFor, mutation) => {
    const manualPath = path.join(fixtureRoot, MANUAL_RELATIVE);
    const filePath = filePathFor();
    const originalManual = fs.readFileSync(manualPath);
    const originalChangedFile = fs.readFileSync(filePath);
    try {
      if (mutation === 'row') {
        const changed = JSON.parse(originalChangedFile.toString('utf8'));
        changed.sheets[0].rows[1].pixelSha256 = '0'.repeat(64);
        fs.writeFileSync(filePath, JSON.stringify(changed, null, 2));
      } else {
        fs.appendFileSync(filePath, Buffer.from([0]));
      }
      const result = relinker(fixtureRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('fresh manual review required');
      expect(fs.readFileSync(manualPath)).toEqual(originalManual);
    } finally {
      fs.writeFileSync(filePath, originalChangedFile);
      fs.writeFileSync(manualPath, originalManual);
    }
  }, 180000);

  it.each([
    [20, 'edge', 5, 100],
    [20, 'internal', 25, 100],
    [40, 'edge', 5, 100],
    [40, 'internal', 25, 100],
    [41, 'edge', 5, 100],
    [41, 'internal', 25, 100],
    [45, 'edge', 5, 100],
    [45, 'internal', 25, 100],
  ])('rejects an arbitrary %ipx square at the %s of a ranged frame', (size, _label, x, y) => {
    const image = readPng(path.join(ROOT, 'assets/images/combat/spritesheets/nurse_companion_sheet.png'));
    const issues = analyzeCompanionSheet(withDetachedSquare(image, 2, 0, x, y, size), undefined, {
      sheetKey: 'nurse_companion',
      rangedContract,
    }).issues;
    expect(issues).toContain('row 2 col 0: ranged detached component fingerprint mismatch');
  });

  it('continues to reject the same detached fragment in a melee frame', () => {
    const image = readPng(path.join(ROOT, 'assets/images/combat/spritesheets/nurse_companion_sheet.png'));
    const issues = analyzeCompanionSheet(withDetachedSquare(image, 1, 0, 5, 5), undefined, {
      sheetKey: 'nurse_companion',
      rangedContract,
    }).issues;
    expect(issues.some(issue => issue.includes('small disconnected'))).toBe(true);
  });

  it('rejects a stale ranged fingerprint entry that no current component satisfies', () => {
    const staleContract = structuredClone(rangedContract);
    staleContract.sheets.nurse_companion.frames[0].push(`v1:400:5,5,24,24:${'0'.repeat(64)}`);
    const image = readPng(path.join(ROOT, 'assets/images/combat/spritesheets/nurse_companion_sheet.png'));
    const issues = analyzeCompanionSheet(image, undefined, {
      sheetKey: 'nurse_companion',
      rangedContract: staleContract,
    }).issues;
    expect(issues).toContain('row 2 col 0: ranged detached component fingerprint mismatch');
  });

  it('rejects a committed ranged component contract mutation', () => {
    const filePath = path.join(fixtureRoot, RANGED_COMPONENT_CONTRACT_RELATIVE_PATH);
    const original = fs.readFileSync(filePath);
    try {
      const changed = JSON.parse(original.toString('utf8'));
      changed.contract = `${changed.contract}-mutated`;
      fs.writeFileSync(filePath, JSON.stringify(changed, null, 2));
      const result = verifier(fixtureRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/ranged component contract .*SHA-256 mismatch/);
    } finally {
      fs.writeFileSync(filePath, original);
    }
  }, 180000);

  it('rejects a canonical source mutation without relying on git', () => {
    const filePath = repoPath(fixtureRoot, Object.values(recipe.canonicalSources)[0].chromaPath);
    const original = fs.readFileSync(filePath);
    try {
      fs.appendFileSync(filePath, Buffer.from([0]));
      const result = verifier(fixtureRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('source chroma SHA-256 mismatch');
    } finally {
      fs.writeFileSync(filePath, original);
    }
  }, 180000);

  it('rejects a runtime target mutation', () => {
    const filePath = repoPath(fixtureRoot, Object.values(recipe.targets)[0].path);
    const original = fs.readFileSync(filePath);
    try {
      fs.appendFileSync(filePath, Buffer.from([0]));
      const result = verifier(fixtureRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('runtime file SHA-256 mismatch');
    } finally {
      fs.writeFileSync(filePath, original);
    }
  }, 180000);

  it('rejects a recipe row-mapping mutation through deterministic builder check', () => {
    const filePath = path.join(fixtureRoot, RECIPE_RELATIVE);
    const manualPath = path.join(fixtureRoot, MANUAL_RELATIVE);
    const original = fs.readFileSync(filePath);
    const originalManual = fs.readFileSync(manualPath);
    try {
      const changed = JSON.parse(original.toString('utf8'));
      const firstTarget = Object.values(changed.targets)[0];
      firstTarget.rows[0].sourceColumns = [1, 0, 2, 3, 4, 5];
      fs.writeFileSync(filePath, JSON.stringify(changed, null, 2));
      const manual = JSON.parse(originalManual.toString('utf8'));
      manual.assemblyRecipeSha256 = createHash('sha256').update(canonicalJsonBytes(changed)).digest('hex');
      fs.writeFileSync(manualPath, JSON.stringify(manual, null, 2));
      const result = verifier(fixtureRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('builder -Check failed');
    } finally {
      fs.writeFileSync(filePath, original);
      fs.writeFileSync(manualPath, originalManual);
    }
  }, 180000);

  it('rejects an assembly builder mutation', () => {
    const filePath = path.join(fixtureRoot, BUILDER_RELATIVE);
    const original = fs.readFileSync(filePath);
    try {
      fs.appendFileSync(filePath, Buffer.from('\n# semantic mutation\n'));
      const result = verifier(fixtureRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('assembly script SHA-256 mismatch');
    } finally {
      fs.writeFileSync(filePath, original);
    }
  }, 180000);

  it('rejects a manual preview-hash mutation', () => {
    const filePath = path.join(fixtureRoot, MANUAL_RELATIVE);
    const original = fs.readFileSync(filePath);
    try {
      const changed = JSON.parse(original.toString('utf8'));
      changed.companions[0].previewSha256 = '0'.repeat(64);
      fs.writeFileSync(filePath, JSON.stringify(changed, null, 2));
      const result = verifier(fixtureRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('manual preview hash/path mismatch');
    } finally {
      fs.writeFileSync(filePath, original);
    }
  }, 180000);
});
