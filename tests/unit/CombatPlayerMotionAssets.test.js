import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const RECIPE = path.join(ROOT, 'art_sources', 'combat', 'task8_players', 'assembly_recipe.json');
const BUILDER = path.join(ROOT, 'tools', 'build_player_motion_sheets.py');
const QA_VERIFIER = path.join(ROOT, 'tools', 'verify_player_motion_qa.py');
const MANUAL_OBSERVATIONS = path.join(ROOT, 'docs', 'analysis', 'PLAYER_MOTION_MANUAL_OBSERVATIONS.json');

function pythonRuntime() {
  const candidates = [
    process.env.CODEX_PYTHON,
    process.env.USERPROFILE && path.join(
      process.env.USERPROFILE,
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'python',
      'python.exe',
    ),
    process.platform === 'win32' ? 'py' : 'python3',
    'python',
  ].filter(Boolean);
  for (const command of candidates) {
    const prefix = command === 'py' ? ['-3'] : [];
    if (spawnSync(command, [...prefix, '--version'], { encoding: 'utf8' }).status === 0) {
      return { command, prefix };
    }
  }
  throw new Error('Python runtime not found');
}

function runBuilder(args) {
  const runtime = pythonRuntime();
  return spawnSync(runtime.command, [...runtime.prefix, BUILDER, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

function runQaVerifier(args) {
  const runtime = pythonRuntime();
  return spawnSync(runtime.command, [...runtime.prefix, QA_VERIFIER, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

function runPython(code) {
  const runtime = pythonRuntime();
  return spawnSync(runtime.command, [...runtime.prefix, '-c', code], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

describe('Task 8 player motion assembly provenance', () => {
  it('accepts the committed automatic metrics and manual observations', () => {
    const result = runQaVerifier([]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('verified 6 player motion QA records with 48 manual row observations');
  }, 60000);

  it('verifies all six canonical 6x8 outputs deterministically', () => {
    const result = runBuilder(['--check']);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('verified 6 player motion sheets');
  }, 60000);

  it('rejects source-hash, row-provenance, and target-pixel drift', () => {
    const recipe = JSON.parse(fs.readFileSync(RECIPE, 'utf8'));
    const mutations = [
      draft => { draft.canonicalSources.soldier_m_generated_alpha.sha256 = '0'.repeat(64); },
      draft => { draft.targets.doctor_f.rows[0].sourceRow = 7; },
      draft => { draft.targets.engineer_m.pixelSha256 = 'f'.repeat(64); },
    ];
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task8-player-recipe-'));
    try {
      for (const [index, mutate] of mutations.entries()) {
        const draft = structuredClone(recipe);
        mutate(draft);
        const tempRecipe = path.join(tempDir, `recipe-${index}.json`);
        fs.writeFileSync(tempRecipe, JSON.stringify(draft), 'utf8');
        const result = runBuilder(['--check', '--recipe', tempRecipe]);
        expect(result.status, `mutation ${index}`).not.toBe(0);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 90000);

  it('rejects missing manual rows and forged PASS observations', () => {
    const observations = JSON.parse(fs.readFileSync(MANUAL_OBSERVATIONS, 'utf8'));
    const mutations = [
      {
        mutate: draft => { draft.characters[0].rows.pop(); },
        expectedError: 'manual row count mismatch: doctor_f',
      },
      {
        mutate: draft => { draft.characters[1].imageSha256 = '0'.repeat(64); },
        expectedError: 'manual image hash drift: soldier_m',
      },
      {
        mutate: draft => { draft.characters[2].rows[1].rework = 'weapon clipping remains'; },
        expectedError: 'manual row remains open: firefighter_m/melee',
      },
    ];
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task8-player-manual-qa-'));
    try {
      for (const [index, { mutate, expectedError }] of mutations.entries()) {
        const draft = structuredClone(observations);
        mutate(draft);
        const tempObservations = path.join(tempDir, `observations-${index}.json`);
        fs.writeFileSync(tempObservations, JSON.stringify(draft), 'utf8');
        const result = runQaVerifier(['--observations', tempObservations]);
        expect(result.status, `manual QA mutation ${index}`).not.toBe(0);
        expect(result.stderr.trim(), `manual QA mutation ${index}`).toBe(expectedError);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 90000);

  it('keeps strict chroma metrics at zero in every firefighter ranged runtime frame', () => {
    const script = [
      'import json, sys',
      'from pathlib import Path',
      'from PIL import Image',
      `sys.path.insert(0, r'${path.join(ROOT, 'tools').replaceAll('\\', '/')}')`,
      'import normalize_combat_sprite_sheets as normalizer',
      `image = Image.open(r'${path.join(ROOT, 'assets/images/combat/spritesheets/firefighter_m_sheet.png').replaceAll('\\', '/')}').convert('RGBA')`,
      'metrics = []',
      'for col in range(6):',
      '    frame = image.crop((col * 256, 2 * 256, (col + 1) * 256, 3 * 256))',
      '    metrics.append(normalizer.analyze_chroma(frame, strict_boundary=True))',
      'print(json.dumps(metrics))',
    ].join('\n');
    const result = runPython(script);
    expect(result.status, result.stderr).toBe(0);
    const qa = JSON.parse(fs.readFileSync(
      path.join(ROOT, 'docs', 'analysis', 'PLAYER_MOTION_QA.json'),
      'utf8',
    ));
    expect(qa.characters.find(character => character.sheetKey === 'firefighter_m').strictBoundaryRows)
      .toEqual([2]);
    const zeroMetrics = {
      opaqueGreen: 0,
      fringeGreen: 0,
      hiddenRgb: 0,
      boundaryGreen: 0,
      removedComponents: 0,
      staleAllowlist: 0,
    };
    expect(JSON.parse(result.stdout)).toEqual(Array(6).fill(zeroMetrics));
  }, 60000);

  it('scopes fitted-cell chroma postprocessing to the reworked source without alpha loss', () => {
    const script = [
      'import json, sys',
      'from pathlib import Path',
      'from PIL import Image',
      `sys.path.insert(0, r'${path.join(ROOT, 'tools').replaceAll('\\', '/')}')`,
      'import build_player_motion_sheets as builder',
      'import normalize_combat_sprite_sheets as normalizer',
      'results = {}',
      "for source_key in ('firefighter_m_ranged_rework_alpha', 'firefighter_m_ranged_alpha'):",
      '    filename = builder.SOURCE_GRIDS[source_key][0]',
      '    source = Image.open(builder.SOURCE_DIR / filename).convert(\'RGBA\')',
      '    frames = builder.simple_row_cells(source, source_key)[0]',
      '    records = []',
      '    for raw in frames:',
      '        fitted = builder.fit_cell(raw)',
      '        processed, diagnostic = builder.postprocess_fitted_cell(source_key, fitted)',
      '        records.append({',
      "            'samePixels': processed.tobytes() == fitted.tobytes(),",
      "            'sameAlpha': processed.getchannel('A').tobytes() == fitted.getchannel('A').tobytes(),",
      "            'diagnostic': diagnostic,",
      "            'strictMetrics': normalizer.analyze_chroma(processed, strict_boundary=True),",
      '        })',
      '    results[source_key] = records',
      "fixture = Image.new('RGBA', (256, 256), (0, 0, 0, 0))",
      "fixture.putpixel((128, 128), (30, 220, 35, 255))",
      "fixture.putpixel((129, 128), (30, 220, 35, 255))",
      "future, diagnostic = builder.postprocess_fitted_cell('future_green_equipment', fixture)",
      "results['future_green_equipment'] = {",
      "    'samePixels': future.tobytes() == fixture.tobytes(),",
      "    'diagnostic': diagnostic,",
      '}',
      'print(json.dumps(results))',
    ].join('\n');
    const result = runPython(script);
    expect(result.status, result.stderr).toBe(0);
    const records = JSON.parse(result.stdout);
    const target = records.firefighter_m_ranged_rework_alpha;
    expect(target).toHaveLength(6);
    expect(target.every(record => record.sameAlpha)).toBe(true);
    expect(target.every(record => record.diagnostic.operation === 'neutralize_strict_green')).toBe(true);
    expect(target.every(record => record.diagnostic.alphaPixelsRemoved === 0)).toBe(true);
    expect(target.every(record => Object.values(record.strictMetrics).every(value => value === 0))).toBe(true);

    const legacy = records.firefighter_m_ranged_alpha;
    expect(legacy).toHaveLength(6);
    expect(legacy.every(record => record.samePixels)).toBe(true);
    expect(legacy.every(record => record.diagnostic.operation === 'none')).toBe(true);
    expect(legacy.every(record => record.diagnostic.alphaPixelsRemoved === 0)).toBe(true);
    expect(records.future_green_equipment).toEqual({
      samePixels: true,
      diagnostic: { operation: 'none', changedPixels: 0, alphaPixelsRemoved: 0 },
    });
  }, 60000);
});
