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
});
