import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const FIXTURE_ROOT = path.join(ROOT, 'tests', 'fixtures', 'combat-sprites');
const NORMALIZER = path.join(ROOT, 'tools', 'normalize_combat_sprite_sheets.py');
const REPORT_CHECKER = path.join(ROOT, 'tools', 'verify_combat_chroma_cleanup.py');

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

    expect(report).toEqual([{ path: expect.stringMatching(/chroma-fringe\.png$/), opaqueGreen: expect.any(Number), fringeGreen: expect.any(Number), hiddenRgb: 1, removedComponents: 1, staleAllowlist: 0 }]);
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
    expect(JSON.parse(output)).toMatchObject({ changedSheetCount: 20, unexpectedAlphaLoss: 0 });
  }, 30000);

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
