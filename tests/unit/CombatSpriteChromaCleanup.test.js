import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const FIXTURE_ROOT = path.join(ROOT, 'tests', 'fixtures', 'combat-sprites');
const NORMALIZER = path.join(ROOT, 'tools', 'normalize_combat_sprite_sheets.py');

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
      "print(json.dumps({'before': before, 'after': after, 'result': result, 'fringe': cleaned.getpixel((3, 5)), 'hidden': cleaned.getpixel((0, 0)), 'dot': cleaned.getpixel((5, 5))}))",
    ].join('\n'));
    const result = JSON.parse(output);

    expect(result.before).toMatchObject({ opaqueGreen: expect.any(Number), fringeGreen: expect.any(Number), hiddenRgb: 1 });
    expect(result.before.opaqueGreen).toBeGreaterThan(0);
    expect(result.before.fringeGreen).toBeGreaterThan(0);
    expect(result.result.removedComponents).toBe(1);
    expect(result.after).toEqual({ opaqueGreen: 0, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0 });
    expect(result.fringe[3]).toBe(180);
    expect(result.fringe[1]).toBeLessThanOrEqual(result.fringe[0] + 8);
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
    expect(result.stats).toEqual({ opaqueGreen: 0, fringeGreen: 0, hiddenRgb: 0, removedComponents: 0 });
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

    expect(report).toEqual([{ path: expect.stringMatching(/chroma-fringe\.png$/), opaqueGreen: expect.any(Number), fringeGreen: expect.any(Number), hiddenRgb: 1, removedComponents: 1 }]);
  });

  it('keeps the checked-in PNG fixtures reproducible', () => {
    expect(fs.statSync(path.join(FIXTURE_ROOT, 'chroma-fringe.png')).size).toBeGreaterThan(0);
    expect(fs.statSync(path.join(FIXTURE_ROOT, 'legitimate-green.png')).size).toBeGreaterThan(0);
    const output = runPython([
      'import json',
      'from PIL import Image',
      `fixture_root = r'${FIXTURE_ROOT.replaceAll('\\', '/')}'`,
      "fringe = Image.new('RGBA', (12, 12), (0, 255, 0, 255))",
      'for y in range(4, 8):',
      '    for x in range(4, 8): fringe.putpixel((x, y), (132, 68, 38, 255))',
      'fringe.putpixel((3, 5), (35, 220, 45, 180))',
      'fringe.putpixel((0, 0), (0, 255, 0, 0))',
      'fringe.putpixel((5, 5), (0, 255, 0, 255))',
      "legitimate = Image.new('RGBA', (9, 9), (0, 0, 0, 0))",
      'for y in range(2, 7):',
      '    for x in range(2, 7): legitimate.putpixel((x, y), (78, 120, 72, 255))',
      "print(json.dumps({'fringe': fringe.tobytes() == Image.open(fixture_root + '/chroma-fringe.png').convert('RGBA').tobytes(), 'legitimate': legitimate.tobytes() == Image.open(fixture_root + '/legitimate-green.png').convert('RGBA').tobytes()}))",
    ].join('\n'));
    expect(JSON.parse(output)).toEqual({ fringe: true, legitimate: true });
  });
});
