import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const FIXTURE_ROOT = path.join(ROOT, 'tests', 'fixtures', 'combat-sprites');
const NORMALIZER = path.join(ROOT, 'tools', 'normalize_combat_sprite_sheets.py');
const REPORT_CHECKER = path.join(ROOT, 'tools', 'verify_combat_chroma_cleanup.py');
const NORMAL_ENEMY_ASSEMBLER = path.join(ROOT, 'tools', 'build_normal_enemy_motion_sheets.py');
const NORMAL_ENEMY_QA_CHECKER = path.join(ROOT, 'tools', 'verify_normal_enemy_motion_qa.py');
const BUILD_ONLY_SOURCE_ROOT = path.join(ROOT, 'art_sources', 'combat', 'task7_normal');
const RUNTIME_SOURCE_ROOT = path.join(
  ROOT,
  'assets',
  'images',
  'combat',
  'spritesheets',
  'sources',
  'task7_normal',
);

function pythonRuntime() {
  const candidates = [
    process.env.CODEX_PYTHON,
    process.env.PYTHON,
    process.env.USERPROFILE && path.join(
      process.env.USERPROFILE,
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'python',
      'python.exe',
    ),
    process.platform === 'win32' ? 'py' : null,
    'python3',
    'python',
  ].filter(Boolean);
  for (const command of candidates) {
    const prefix = command === 'py' ? ['-3'] : [];
    if (spawnSync(command, [...prefix, '--version'], { encoding: 'utf8' }).status === 0) {
      return { command, prefix };
    }
  }
  throw new Error('Python runtime is required for combat sprite chroma fixtures');
}

function runPython(source) {
  const runtime = pythonRuntime();
  return execFileSync(runtime.command, [...runtime.prefix, '-c', source], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

function fixture(pathname) {
  return path.join(FIXTURE_ROOT, pathname).replaceAll('\\', '/');
}

describe('combat sprite chroma cleanup', () => {
  it('removes only connected chroma, decontaminates fringe, and clears hidden RGB', () => {
    const output = runPython([
      'import importlib.util, json, sys',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('normalizer', r'${NORMALIZER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      `image = Image.open(r'${fixture('chroma-fringe.png')}').convert('RGBA')`,
      'before = module.analyze_chroma(image)',
      'cleaned, result = module.cleanup_chroma(image)',
      'after = module.analyze_chroma(cleaned)',
      "print(json.dumps({'before': before, 'after': after, 'result': result, 'fringe': cleaned.getpixel((3, 5)), 'lowAlpha': [cleaned.getpixel((3, 4)), cleaned.getpixel((3, 6))], 'hidden': cleaned.getpixel((0, 0)), 'dot': cleaned.getpixel((5, 5))}))",
    ].join('\n'));
    const result = JSON.parse(output);

    expect(result.before).toMatchObject({ opaqueGreen: expect.any(Number), fringeGreen: expect.any(Number), hiddenRgb: 1 });
    expect(result.before.opaqueGreen).toBeGreaterThan(0);
    expect(result.before.fringeGreen).toBeGreaterThan(0);
    expect(result.result.removedComponents).toBe(1);
    expect(result.after).toEqual({ opaqueGreen: 0, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0, staleAllowlist: 0 });
    expect(result.fringe[3]).toBe(180);
    expect(result.fringe[1]).toBeLessThanOrEqual(result.fringe[0] + 8);
    expect(result.lowAlpha).toEqual([[132, 68, 38, 1], [132, 68, 38, 12]]);
    expect(result.hidden).toEqual([0, 0, 0, 0]);
    expect(result.dot).toEqual([0, 0, 0, 0]);
  });

  it('preserves deliberately low-saturation green equipment', () => {
    const output = runPython([
      'import importlib.util, json, sys',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('normalizer', r'${NORMALIZER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      `image = Image.open(r'${fixture('legitimate-green.png')}').convert('RGBA')`,
      'cleaned, result = module.cleanup_chroma(image)',
      "print(json.dumps({'result': result, 'center': cleaned.getpixel((4, 4)), 'stats': module.analyze_chroma(cleaned)}))",
    ].join('\n'));
    const result = JSON.parse(output);

    expect(result.center).toEqual([78, 120, 72, 255]);
    expect(result.result.removedComponents).toBe(0);
    expect(result.stats).toEqual({ opaqueGreen: 0, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0, staleAllowlist: 0 });
  });

  it('detects and decontaminates alpha-1 frame-edge green without relying on visual bbox alpha', async () => {
    const output = runPython([
      'import importlib.util, json, sys',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('normalizer', r'${NORMALIZER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      "image = Image.new('RGBA', (3, 3), (0, 0, 0, 0)); image.putpixel((0, 1), (0, 255, 0, 1))",
      'cleaned, _ = module.cleanup_chroma(image)',
      "print(json.dumps({'before': module.analyze_chroma(image), 'after': module.analyze_chroma(cleaned), 'pixel': cleaned.getpixel((0, 1))}))",
    ].join('\n'));
    const python = JSON.parse(output);
    expect(python.before.fringeGreen).toBe(1);
    expect(python.after).toEqual({ opaqueGreen: 0, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0, staleAllowlist: 0 });
    expect(python.pixel).toEqual([0, 0, 0, 1]);

    const { chromaArtifactStats } = await import('../../tools/audit_combat_sprites.mjs');
    const rgba = Buffer.alloc(3 * 3 * 4);
    rgba.set([0, 255, 0, 1], (1 * 3) * 4);
    expect(chromaArtifactStats({ width: 3, height: 3, pixels: rgba })).toMatchObject({ fringeGreen: 1 });
  });

  it('emits a machine-readable --check-chroma report for one fixture', () => {
    const runtime = pythonRuntime();
    const output = execFileSync(runtime.command, [
      ...runtime.prefix,
      NORMALIZER,
      '--check-chroma',
      path.join(FIXTURE_ROOT, 'chroma-fringe.png'),
    ], { cwd: ROOT, encoding: 'utf8' });
    const report = JSON.parse(output);

    expect(report).toEqual([{ path: expect.stringMatching(/chroma-fringe\.png$/), opaqueGreen: 124, fringeGreen: 4, hiddenRgb: 1, removedComponents: 1, staleAllowlist: 0 }]);
  });

  it('treats an internal manifest frame edge as a chroma boundary in both tools', async () => {
    const output = runPython([
      'import importlib.util, json, sys',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('normalizer', r'${NORMALIZER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      `image = Image.open(r'${fixture('internal-frame-chroma.png')}').convert('RGBA')`,
      'cleaned, result = module.cleanup_chroma_grid(image, 2, 1)',
      "print(json.dumps({'result': result, 'stats': module.analyze_chroma_grid(cleaned, 2, 1), 'inside': cleaned.getpixel((6, 2))}))",
    ].join('\n'));
    const python = JSON.parse(output);
    expect(python.result.removedComponents).toBe(0);
    expect(python.stats).toEqual({ opaqueGreen: 0, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0, staleAllowlist: 0 });
    expect(python.inside).toEqual([0, 0, 0, 0]);

    const { chromaArtifactStats } = await import('../../tools/audit_combat_sprites.mjs');
    const rgba = Buffer.alloc(12 * 6 * 4);
    for (let y = 1; y < 6; y += 1) {
      for (let x = 6; x < 9; x += 1) rgba.set([0, 255, 0, 255], (y * 12 + x) * 4);
    }
    expect(chromaArtifactStats({ width: 12, height: 6, pixels: rgba }, { cols: 2, rows: 1 }))
      .toEqual({ opaqueGreen: 15, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0, staleAllowlist: 0 });
  });

  it('allows only the fingerprinted toxic component and rejects a stale component entry', () => {
    const output = runPython([
      'import importlib.util, json, sys',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('normalizer', r'${NORMALIZER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      "image = Image.new('RGBA', (8, 4), (0, 0, 0, 0)); image.putpixel((1, 1), (0, 255, 0, 255)); image.putpixel((5, 1), (0, 255, 0, 255))",
      'components = module._isolated_chroma_components(image)',
      "allowed = [next(component for component in components if component['bbox'] == [1, 1, 2, 2])]",
      'cleaned, result = module.cleanup_chroma(image, allowed)',
      "mutated = image.copy(); mutated.putpixel((1, 1), (20, 255, 0, 255))",
      'try:',
      '    module.cleanup_chroma(mutated, allowed)',
      '    stale = False',
      'except ValueError:',
      '    stale = True',
      "print(json.dumps({'result': result, 'allowed': cleaned.getpixel((1, 1)), 'unlisted': cleaned.getpixel((5, 1)), 'stale': stale}))",
    ].join('\n'));
    const result = JSON.parse(output);

    expect(result.result).toEqual({ removedComponents: 1, staleAllowlist: 0 });
    expect(result.allowed).toEqual([0, 255, 0, 255]);
    expect(result.unlisted).toEqual([0, 0, 0, 0]);
    expect(result.stale).toBe(true);
  });

  it('makes a stale component fingerprint a Node audit failure metric', async () => {
    const { chromaArtifactStats } = await import('../../tools/audit_combat_sprites.mjs');
    const rgba = Buffer.alloc(4 * 4 * 4);
    rgba.set([0, 255, 0, 255], (1 * 4 + 1) * 4);
    expect(chromaArtifactStats({ width: 4, height: 4, pixels: rgba }, {
      cols: 1,
      rows: 1,
      componentSpecs: new Map([['0:0', [{ bbox: [1, 1, 2, 2], pixelCount: 1, fingerprint: '0'.repeat(64) }]]]),
    })).toMatchObject({ removedComponents: 1, staleAllowlist: 1 });
  });

  it('gives Python and Node the same global allowlist diagnostics', () => {
    const runtime = pythonRuntime();
    const audit = path.join(ROOT, 'tools', 'audit_combat_sprites.mjs');
    const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'images', 'combat', 'spritesheets', 'chroma_component_allowlist.json'), 'utf8'));
    const temp = fs.mkdtempSync(path.join(ROOT, 'tmp-chroma-allowlist-'));
    const write = (name, components, version = 1) => {
      const pathname = path.join(temp, `${name}.json`);
      fs.writeFileSync(pathname, JSON.stringify({ version, components }));
      return pathname;
    };
    const check = (pathname, code) => {
      const env = { ...process.env, COMBAT_CHROMA_ALLOWLIST_PATH: pathname };
      const python = spawnSync(runtime.command, [...runtime.prefix, NORMALIZER, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env });
      const node = spawnSync(process.execPath, [audit, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env });
      expect(python.status).toBe(1);
      expect(node.status).toBe(1);
      expect(JSON.parse(python.stdout)).toEqual(JSON.parse(node.stdout));
      expect(JSON.parse(python.stdout).diagnostics).toEqual([{ code, location: expect.any(String) }]);
    };
    try {
      const [component] = source.components;
      const empty = write('empty', []);
      const emptyEnv = { ...process.env, COMBAT_CHROMA_ALLOWLIST_PATH: empty };
      const emptyPython = spawnSync(runtime.command, [...runtime.prefix, NORMALIZER, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env: emptyEnv });
      const emptyNode = spawnSync(process.execPath, [audit, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env: emptyEnv });
      expect(emptyPython.status).toBe(0);
      expect(emptyNode.status).toBe(0);
      expect(JSON.parse(emptyPython.stdout)).toEqual({ diagnostics: [] });
      expect(JSON.parse(emptyNode.stdout)).toEqual({ diagnostics: [] });
      check(write('duplicate', [component, component]), 'duplicate');
      check(write('orphan', [{ ...component, sheetKey: 'wrong_key' }]), 'orphan');
      check(write('wrong-path', [{ ...component, path: '/assets/images/combat/spritesheets/enemies/zombie_bloater_sheet.png' }]), 'orphan');
      check(write('wrong-row', [{ ...component, row: 0 }]), 'unconsumed');
      check(write('wrong-col', [{ ...component, col: 0 }]), 'unconsumed');
      check(write('stale-bbox', [{ ...component, bbox: [178, 120, 181, 121] }]), 'stale');
      check(write('stale-count', [{ ...component, pixelCount: component.pixelCount + 1 }]), 'stale');
      check(write('stale-fingerprint', [{ ...component, fingerprint: '0'.repeat(64) }]), 'stale');

      const booleanIntegerMutations = [
        ['version-true', true, source.components, 'allowlist: schema mismatch (root)'],
        ['version-false', false, source.components, 'allowlist: schema mismatch (root)'],
        ['row-true', 1, [{ ...component, row: true }], 'allowlist: schema mismatch (cell)'],
        ['row-false', 1, [{ ...component, row: false }], 'allowlist: schema mismatch (cell)'],
        ['col-true', 1, [{ ...component, col: true }], 'allowlist: schema mismatch (cell)'],
        ['col-false', 1, [{ ...component, col: false }], 'allowlist: schema mismatch (cell)'],
        ['pixel-count-true', 1, [{ ...component, pixelCount: true }], 'allowlist: schema mismatch (pixelCount)'],
        ['pixel-count-false', 1, [{ ...component, pixelCount: false }], 'allowlist: schema mismatch (pixelCount)'],
        ...component.bbox.flatMap((_, index) => [true, false].map(value => [
          `bbox-${index}-${value}`,
          1,
          [{ ...component, bbox: component.bbox.map((coordinate, coordinateIndex) => coordinateIndex === index ? value : coordinate) }],
          'allowlist: schema mismatch (bbox)',
        ])),
      ];
      for (const [name, version, components, location] of booleanIntegerMutations) {
        const pathname = write(name, components, version);
        const env = { ...process.env, COMBAT_CHROMA_ALLOWLIST_PATH: pathname };
        const python = spawnSync(runtime.command, [...runtime.prefix, NORMALIZER, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env });
        const node = spawnSync(process.execPath, [audit, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env });
        expect(python.status, `${name}: Python exit status`).toBe(1);
        expect(node.status, `${name}: Node exit status`).toBe(1);
        expect(JSON.parse(python.stdout), `${name}: diagnostics parity`).toEqual(JSON.parse(node.stdout));
        expect(JSON.parse(python.stdout).diagnostics, `${name}: exact diagnostic`).toEqual([{ code: 'invalid', location }]);
      }

      const missing = path.join(temp, 'missing.json');
      const malformed = path.join(temp, 'malformed.json');
      fs.writeFileSync(malformed, JSON.stringify({ version: 1 }));
      for (const pathname of [missing, malformed]) {
        const env = { ...process.env, COMBAT_CHROMA_ALLOWLIST_PATH: pathname };
        const python = spawnSync(runtime.command, [...runtime.prefix, NORMALIZER, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env });
        const node = spawnSync(process.execPath, [audit, '--check-allowlist'], { cwd: ROOT, encoding: 'utf8', env });
        expect(python.status).toBe(1);
        expect(node.status).toBe(1);
        const expected = pathname === missing ? 'allowlist: missing' : 'allowlist: schema mismatch (root)';
        expect(JSON.parse(python.stdout)).toEqual(JSON.parse(node.stdout));
        expect(JSON.parse(python.stdout).diagnostics).toEqual([{ code: 'invalid', location: expected }]);
      }
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }, 30000);

  it('marks and saves a cleanup-only normalize_sheet change without moving foreground pixels', () => {
    const output = runPython([
      'import importlib.util, json, sys, tempfile',
      'from pathlib import Path',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('normalizer', r'${NORMALIZER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      "with tempfile.TemporaryDirectory(prefix='combat-chroma-normalize-') as temp:",
      "    root = Path(temp); sprite_root = root / 'assets/images/combat/spritesheets'; sprite_root.mkdir(parents=True)",
      "    sheet_path = sprite_root / 'fixture_sheet.png'",
      "    image = Image.new('RGBA', (6, 6), (0, 0, 0, 0)); image.putpixel((0, 2), (0, 255, 0, 255)); image.putpixel((2, 2), (0, 255, 0, 0)); image.putpixel((4, 4), (150, 70, 40, 255)); before = image.copy(); image.save(sheet_path)",
      "    manifest_path = sprite_root / 'manifest.json'; manifest_path.write_text(json.dumps({'fixture': {'src': '/assets/images/combat/spritesheets/fixture_sheet.png', 'cols': 1, 'rows': 1, 'motions': {'idle': {'row': 0}}}}), encoding='utf-8')",
      '    module.ROOT = root; module.SPRITE_ROOT = sprite_root; module.MANIFEST_PATH = manifest_path',
      '    dry = module.normalize_sheet(sheet_path, True, False)',
      '    saved = module.normalize_sheet(sheet_path, False, False)',
      '    after = Image.open(sheet_path).convert("RGBA")',
      "    print(json.dumps({'dry': dry, 'saved': saved, 'foreground': after.getpixel((4, 4)), 'stats': module.analyze_chroma_grid(after), 'integrity': module.chroma_cleanup_integrity(before, after, 1, 1)}))",
    ].join('\n'));
    const result = JSON.parse(output);

    expect(result.dry).toMatchObject({ changed: true, changedFrames: 1 });
    expect(result.saved).toMatchObject({ changed: true, changedFrames: 1 });
    expect(result.foreground).toEqual([150, 70, 40, 255]);
    expect(result.stats).toEqual({ opaqueGreen: 0, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0, staleAllowlist: 0 });
    expect(result.integrity).toEqual({ alphaCoverageBefore: 2, alphaCoverageAfter: 1, unexpectedAlphaLoss: 0 });
  });

  it('keeps the checked-in PNG fixtures reproducible', () => {
    expect(fs.statSync(path.join(FIXTURE_ROOT, 'chroma-fringe.png')).size).toBeGreaterThan(0);
    expect(fs.statSync(path.join(FIXTURE_ROOT, 'legitimate-green.png')).size).toBeGreaterThan(0);
    expect(fs.statSync(path.join(FIXTURE_ROOT, 'internal-frame-chroma.png')).size).toBeGreaterThan(0);
    const output = runPython([
      'import json',
      'from PIL import Image',
      `fixture_root = r'${FIXTURE_ROOT.replaceAll('\\', '/')}'`,
      "fringe = Image.new('RGBA', (12, 12), (0, 255, 0, 255))",
      'for y in range(4, 8):',
      '    for x in range(4, 8): fringe.putpixel((x, y), (132, 68, 38, 255))',
      'fringe.putpixel((3, 5), (35, 220, 45, 180))',
      'fringe.putpixel((3, 4), (35, 220, 45, 1))',
      'fringe.putpixel((3, 6), (35, 220, 45, 12))',
      'fringe.putpixel((0, 0), (0, 255, 0, 0))',
      'fringe.putpixel((5, 5), (0, 255, 0, 255))',
      "legitimate = Image.new('RGBA', (9, 9), (0, 0, 0, 0))",
      'for y in range(2, 7):',
      '    for x in range(2, 7): legitimate.putpixel((x, y), (78, 120, 72, 255))',
      "internal = Image.new('RGBA', (12, 6), (0, 0, 0, 0))",
      'for y in range(1, 6):',
      '    for x in range(6, 9): internal.putpixel((x, y), (0, 255, 0, 255))',
      "print(json.dumps({'fringe': fringe.tobytes() == Image.open(fixture_root + '/chroma-fringe.png').convert('RGBA').tobytes(), 'legitimate': legitimate.tobytes() == Image.open(fixture_root + '/legitimate-green.png').convert('RGBA').tobytes(), 'internal': internal.tobytes() == Image.open(fixture_root + '/internal-frame-chroma.png').convert('RGBA').tobytes()}))",
    ].join('\n'));
    expect(JSON.parse(output)).toEqual({ fringe: true, legitimate: true, internal: true });
  });

  it('requires the committed chroma cleanup provenance report to recalculate exactly', () => {
    const runtime = pythonRuntime();
    const output = execFileSync(runtime.command, [...runtime.prefix, REPORT_CHECKER, '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(JSON.parse(output)).toMatchObject({
      sheetCount: 12,
      recipeTargetCount: 9,
      chromaArtifacts: {
        opaqueGreen: 0,
        fringeGreen: 0,
        hiddenRgb: 0,
        removedComponents: 0,
        staleAllowlist: 0,
      },
    });
  }, 120000);

  it('verifies a no-git current-runtime subset, ignores later roster assets, and rejects mutation', () => {
    const runtime = pythonRuntime();
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'task7-current-runtime-'));
    const copy = (relative) => {
      const source = path.join(ROOT, relative);
      const target = path.join(tempRoot, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.cpSync(source, target, { recursive: true });
    };
    const manifest = JSON.parse(fs.readFileSync(
      path.join(ROOT, 'assets', 'images', 'combat', 'spritesheets', 'manifest.json'),
      'utf8',
    ));
    const roster = [
      'zombie_patient_dormant', 'zombie_common', 'zombie_runner', 'zombie_brute',
      'zombie_horde', 'rabid_dog', 'zombie_acid', 'zombie_bloater',
      'zombie_screamer', 'zombie_charger', 'raider', 'raider_elite',
    ];
    try {
      copy('tools/normalize_combat_sprite_sheets.py');
      copy('tools/build_normal_enemy_motion_sheets.py');
      copy('art_sources/combat/task7_normal');
      copy('assets/images/combat/spritesheets/manifest.json');
      copy('assets/images/combat/spritesheets/chroma_component_allowlist.json');
      for (const key of roster) copy(manifest[key].src.replace(/^\//, ''));
      expect(fs.existsSync(path.join(tempRoot, '.git'))).toBe(false);
      expect(fs.existsSync(path.join(tempRoot, manifest.doctor_f.src.replace(/^\//, '')))).toBe(false);

      const report = path.join(tempRoot, 'task7-report.json');
      const written = execFileSync(runtime.command, [
        ...runtime.prefix, REPORT_CHECKER, '--root', tempRoot, '--report', report, '--write',
      ], { cwd: tempRoot, encoding: 'utf8' });
      expect(JSON.parse(written)).toMatchObject({ sheetCount: 12, recipeTargetCount: 9 });

      fs.appendFileSync(path.join(tempRoot, manifest.zombie_common.src.replace(/^\//, '')), Buffer.from([0]));
      const mutated = spawnSync(runtime.command, [
        ...runtime.prefix, REPORT_CHECKER, '--root', tempRoot, '--report', report, '--check',
      ], { cwd: tempRoot, encoding: 'utf8' });
      expect(mutated.status).not.toBe(0);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }, 180000);

  it('rebuilds all expanded normal-enemy sheets from hash-pinned sources', () => {
    const runtime = pythonRuntime();
    const output = execFileSync(runtime.command, [...runtime.prefix, NORMAL_ENEMY_ASSEMBLER, '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(JSON.parse(output)).toEqual({
      verifiedTargets: 9,
      verifiedCanonicalSources: 4,
      verifiedArchivalSources: 4,
    });
  }, 120000);

  it('keeps canonical alpha inputs and unrelated chroma archives outside runtime assets', () => {
    expect(fs.existsSync(BUILD_ONLY_SOURCE_ROOT)).toBe(true);
    expect(fs.existsSync(RUNTIME_SOURCE_ROOT)).toBe(false);

    const recipe = JSON.parse(fs.readFileSync(path.join(BUILD_ONLY_SOURCE_ROOT, 'assembly_recipe.json'), 'utf8'));
    const canonicalNames = Object.keys(recipe.canonicalSources ?? {});
    const archivalNames = Object.keys(recipe.archivalSources ?? {});
    expect(canonicalNames).toHaveLength(4);
    expect(canonicalNames.every(name => name.endsWith('_alpha.png'))).toBe(true);
    expect(archivalNames).toHaveLength(4);
    expect(archivalNames.every(name => name.endsWith('_chroma.png'))).toBe(true);
    expect(recipe.provenancePolicy).toEqual({
      canonical: 'cleaned alpha PNGs are the sole deterministic assembly inputs',
      archival: 'chroma PNGs are retained image-generation archives; no derivation relationship to canonical alpha PNGs is asserted',
    });

    const packageConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(packageConfig.build.files.some(pattern => String(pattern).includes('art_sources'))).toBe(false);
  });

  it('rejects recipe source and target paths that escape the repository root', () => {
    const output = runPython([
      'import copy, importlib.util, json, sys',
      `spec = importlib.util.spec_from_file_location('normal_enemy_assembler', r'${NORMAL_ENEMY_ASSEMBLER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      "recipe = json.loads(module.RECIPE_PATH.read_text(encoding='utf-8'))",
      'source_recipe = copy.deepcopy(recipe)',
      "source_recipe['canonicalSources']['raider_generated_alpha.png']['path'] = '/../outside.png'",
      'target_recipe = copy.deepcopy(recipe)',
      "target_recipe['targets']['raider']['path'] = '../../outside.png'",
      'rejected = []',
      'for candidate in (source_recipe, target_recipe):',
      '    try:',
      '        module.verify_recipe(candidate)',
      '        rejected.append(False)',
      '    except ValueError:',
      '        rejected.append(True)',
      "print(json.dumps({'rejected': rejected}))",
    ].join('\n'));
    expect(JSON.parse(output)).toEqual({ rejected: [true, true] });
  }, 60000);

  it('rejects an unrelated in-repository file even when its hash matches the recipe source entry', () => {
    const output = runPython([
      'import copy, importlib.util, json, sys',
      `spec = importlib.util.spec_from_file_location('normal_enemy_assembler', r'${NORMAL_ENEMY_ASSEMBLER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      "recipe = json.loads(module.RECIPE_PATH.read_text(encoding='utf-8'))",
      'candidate = copy.deepcopy(recipe)',
      "replacement = recipe['canonicalSources']['raider_elite_generated_alpha.png']",
      "candidate['canonicalSources']['raider_generated_alpha.png'] = copy.deepcopy(replacement)",
      'try:',
      '    module.verify_recipe(candidate)',
      '    rejected = False',
      'except ValueError:',
      '    rejected = True',
      "print(json.dumps({'rejected': rejected}))",
    ].join('\n'));
    expect(JSON.parse(output)).toEqual({ rejected: true });
  }, 60000);

  it('rejects deletion, addition, and field mutations in row provenance metadata', () => {
    const output = runPython([
      'import copy, importlib.util, json, sys',
      `spec = importlib.util.spec_from_file_location('normal_enemy_assembler', r'${NORMAL_ENEMY_ASSEMBLER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      "recipe = json.loads(module.RECIPE_PATH.read_text(encoding='utf-8'))",
      'candidates = []',
      'missing_retained = copy.deepcopy(recipe)',
      "missing_retained['targets']['zombie_runner']['retainedRows'].pop()",
      "candidates.append(('missingRetained', missing_retained))",
      'missing_new = copy.deepcopy(recipe)',
      "missing_new['targets']['zombie_runner']['newRows'].pop()",
      "candidates.append(('missingNew', missing_new))",
      'extra_row = copy.deepcopy(recipe)',
      "extra_row['targets']['zombie_runner']['newRows'].append(copy.deepcopy(extra_row['targets']['zombie_runner']['newRows'][0]))",
      "candidates.append(('extraRow', extra_row))",
      'row_mutation = copy.deepcopy(recipe)',
      "row_mutation['targets']['zombie_runner']['newRows'][0]['row'] = 0",
      "candidates.append(('rowMutation', row_mutation))",
      'source_mutation = copy.deepcopy(recipe)',
      "source_row = source_mutation['targets']['zombie_runner']['newRows'][0]",
      "if 'cells' in source_row:",
      "    source_row['cells'][0]['source'] = 'baseline:zombie_brute'",
      'else:',
      "    source_row['sources'][0] = 'baseline:zombie_brute:1'",
      "candidates.append(('sourceMutation', source_mutation))",
      'cell_mutation = copy.deepcopy(recipe)',
      "cell_row = cell_mutation['targets']['zombie_runner']['newRows'][0]",
      "if 'cells' in cell_row:",
      "    cell_row['cells'][0]['column'] = 5",
      'else:',
      "    cell_row['cells'] = [{'source': 'baseline:zombie_runner', 'row': 1, 'column': 5}]",
      "candidates.append(('cellMutation', cell_mutation))",
      'motion_mutation = copy.deepcopy(recipe)',
      "motion_mutation['targets']['zombie_runner']['newRows'][0]['motion'] = 'idle'",
      "candidates.append(('motionMutation', motion_mutation))",
      "validator = getattr(module, 'validate_recipe_contract', None)",
      'rejected = {}',
      'for name, candidate in candidates:',
      '    if validator is None:',
      '        rejected[name] = False',
      '        continue',
      '    try:',
      '        validator(candidate)',
      '        rejected[name] = False',
      '    except ValueError:',
      '        rejected[name] = True',
      "print(json.dumps({'rejected': rejected}))",
    ].join('\n'));
    expect(JSON.parse(output)).toEqual({
      rejected: {
        missingRetained: true,
        missingNew: true,
        extraRow: true,
        rowMutation: true,
        sourceMutation: true,
        cellMutation: true,
        motionMutation: true,
      },
    });
  }, 60000);

  it('cross-checks all 51 reviewed motion rows against the manifest and reviewed PNG hashes', () => {
    const runtime = pythonRuntime();
    const result = spawnSync(runtime.command, [
      ...runtime.prefix,
      NORMAL_ENEMY_QA_CHECKER,
      '--check',
    ], { cwd: ROOT, encoding: 'utf8' });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ verifiedSheets: 9, verifiedRows: 51 });
  }, 30000);

  it('rejects source hash mutation and foreground loss in rebuilt motion rows', () => {
    const output = runPython([
      'import hashlib, importlib.util, json, sys, tempfile',
      'from pathlib import Path',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('normal_enemy_assembler', r'${NORMAL_ENEMY_ASSEMBLER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      'with tempfile.TemporaryDirectory() as directory:',
      "    source = Path(directory) / 'source.png'",
      "    canonical = module.SOURCE_DIR / 'raider_generated_alpha.png'",
      '    source.write_bytes(canonical.read_bytes())',
      '    expected_hash = module.file_sha256(canonical)',
      '    mutated = bytearray(source.read_bytes()); mutated[-1] ^= 1; source.write_bytes(mutated)',
      '    try:',
      '        module.verify_source_hash(source, expected_hash)',
      '        hash_rejected = False',
      '    except ValueError:',
      '        hash_rejected = True',
      "image = Image.new('RGBA', (module.COLS * module.CELL, module.CELL), (0, 0, 0, 0))",
      'for col in range(module.COLS):',
      '    image.putpixel((col * module.CELL + 1, 1), (150, 70, 40, 255))',
      'expected = module.frame_foreground_coverage(image)',
      "blanked = image.copy(); blanked.paste((0, 0, 0, 0), (module.CELL, 0, module.CELL * 2, module.CELL))",
      'try:',
      '    module.validate_foreground_coverage(module.frame_foreground_coverage(blanked), expected, [0])',
      '    coverage_rejected = False',
      'except ValueError:',
      '    coverage_rejected = True',
      "print(json.dumps({'hashRejected': hash_rejected, 'coverageRejected': coverage_rejected}))",
    ].join('\n'));
    expect(JSON.parse(output)).toEqual({ hashRejected: true, coverageRejected: true });
  });

  it('flags a non-chroma alpha loss in the provenance report metrics', () => {
    const output = runPython([
      'import importlib.util, json, sys',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location('report_checker', r'${REPORT_CHECKER.replaceAll('\\', '/')}')`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      "before = Image.new('RGBA', (2, 2), (0, 0, 0, 0)); before.putpixel((1, 1), (150, 70, 40, 255))",
      "after = Image.new('RGBA', (2, 2), (0, 0, 0, 0))",
      "print(json.dumps(module.frame_metrics(before, after, lambda pixel: False)))",
    ].join('\n'));
    expect(JSON.parse(output)).toMatchObject({ alphaCoverageBefore: 1, alphaCoverageAfter: 0, unexpectedAlphaLoss: 1, changedPixels: 1 });
  });
});
