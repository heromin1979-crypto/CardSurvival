import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  COMBAT_MOTION_MANIFEST,
  resolveCombatMotion,
} from '../../js/data/combatMotionManifest.js';
import { spriteGridIssue, whiteOpaqueRisk } from '../../tools/audit_combat_sprites.mjs';

const ROOT = process.cwd();
const SPRITE_ROOT = path.join(ROOT, 'assets', 'images', 'combat', 'spritesheets');
const EXPORTED_MANIFEST_PATH = path.join(SPRITE_ROOT, 'manifest.json');
const NORMAL_ENEMY_MOTION_CONTRACT = Object.freeze({
  zombie_patient_dormant: ['dormant', 'wake', 'basic_attack', 'hit', 'death'],
  zombie_common: ['idle', 'basic_attack', 'hit', 'death'],
  zombie_runner: ['idle', 'basic_attack', 'telegraph', 'runner_rush', 'hit', 'death'],
  zombie_brute: ['idle', 'basic_attack', 'telegraph', 'slam', 'hit', 'death'],
  raider: ['idle', 'basic_attack', 'reload', 'hit', 'death'],
  raider_elite: ['idle', 'basic_attack', 'aim', 'aimed_shot', 'hit', 'death'],
  zombie_horde: ['idle', 'basic_attack', 'hit', 'death'],
  rabid_dog: ['idle', 'basic_attack', 'hit', 'death'],
  zombie_acid: ['idle', 'basic_attack', 'acid_lash', 'hit', 'death'],
  zombie_bloater: ['idle', 'basic_attack', 'charge', 'self_destruct', 'hit', 'death'],
  zombie_screamer: ['idle', 'basic_attack', 'charge', 'summon_horde', 'hit', 'death'],
  zombie_charger: ['idle', 'basic_attack', 'charge', 'charge_strike', 'hit', 'death'],
});

function discoverPythonRuntime() {
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
    const prefix = path.basename(command).toLowerCase() === 'py.exe' || command === 'py' ? ['-3'] : [];
    const result = spawnSync(command, [...prefix, '--version'], { encoding: 'utf8' });
    if (result.status === 0) return { command, prefix };
  }
  throw new Error(`No executable Python runtime found. Tried: ${candidates.join(', ')}`);
}

function pngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function manifestEntries() {
  return Object.entries(COMBAT_MOTION_MANIFEST).map(([sheetKey, sheet]) => ({
    sheetKey,
    sheet,
    filePath: path.join(ROOT, sheet.src.replace(/^\/+/, '')),
  }));
}

function reverseObjectKeys(value) {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).reverse().map(([key, nested]) => [key, reverseObjectKeys(nested)]),
    );
  }
  return value;
}

function decodePngRgba(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
    } else if (type === 'IDAT') {
      idat.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }

  expect(bitDepth).toBe(8);
  expect(colorType).toBe(6);

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(height * stride);
  let src = 0;

  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    return pb <= pc ? b : c;
  };

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[src];
    src += 1;
    const rowStart = y * stride;
    const prevRowStart = rowStart - stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[src + x];
      const left = x >= bytesPerPixel ? pixels[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[prevRowStart + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[prevRowStart + x - bytesPerPixel] : 0;
      let value = raw;
      if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paeth(left, up, upLeft);
      pixels[rowStart + x] = value & 0xff;
    }
    src += stride;
  }

  return { width, height, pixels };
}

function alphaBounds(image, x0, y0, width, height) {
  let minX = width;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alphaOffset = ((y0 + y) * image.width + x0 + x) * 4 + 3;
      if (image.pixels[alphaOffset] > 12) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return null;
  return { centerX: (minX + maxX) / 2, bottom: maxY };
}

function countEdgeAlpha(image, x0, y0, width, height) {
  let count = 0;
  for (let x = 0; x < width; x += 1) {
    if (image.pixels[((y0 * image.width) + x0 + x) * 4 + 3] > 12) count += 1;
    if (image.pixels[(((y0 + height - 1) * image.width) + x0 + x) * 4 + 3] > 12) count += 1;
  }
  for (let y = 1; y < height - 1; y += 1) {
    if (image.pixels[(((y0 + y) * image.width) + x0) * 4 + 3] > 12) count += 1;
    if (image.pixels[(((y0 + y) * image.width) + x0 + width - 1) * 4 + 3] > 12) count += 1;
  }
  return count;
}

describe('combat sprite sheet assets', () => {
  it('keeps all displayed combat sprite sheets on their manifest grid contract', () => {
    const entries = manifestEntries();

    expect(entries.length).toBeGreaterThan(0);

    const invalid = entries
      .map(({ sheetKey, sheet, filePath }) => ({ sheetKey, sheet, filePath, ...pngSize(filePath) }))
      .filter(({ sheet, width, height }) => (
        width % sheet.cols !== 0
        || height % sheet.rows !== 0
        || width / sheet.cols !== height / sheet.rows
      ));

    expect(invalid).toEqual([]);
  });

  it('defines the complete 12-normal-enemy row, duration, loop, locomotion, and 256px cell contract', () => {
    for (const [sheetKey, motionKeys] of Object.entries(NORMAL_ENEMY_MOTION_CONTRACT)) {
      const sheet = COMBAT_MOTION_MANIFEST[sheetKey];
      expect(sheet.cols).toBe(6);
      expect(sheet.rows).toBe(motionKeys.length);
      expect(Object.keys(sheet.motions)).toEqual(motionKeys);
      expect(Object.values(sheet.motions).map(motion => motion.row))
        .toEqual(motionKeys.map((_, index) => index));

      const dimensions = pngSize(path.join(ROOT, sheet.src.replace(/^\/+/, '')));
      expect(dimensions).toEqual({ width: 1536, height: motionKeys.length * 256 });

      for (const [motionKey, motion] of Object.entries(sheet.motions)) {
        const isRestMotion = motionKey === 'idle' || motionKey === 'dormant';
        expect(motion.loop).toBe(isRestMotion);
        expect(motion.durationMs).toBeGreaterThan(0);
        expect(['stationary', 'approach', 'retreat']).toContain(motion.locomotion);
      }
    }

    for (const [sheetKey, motionKey] of [
      ['zombie_patient_dormant', 'wake'],
      ['zombie_runner', 'telegraph'],
      ['zombie_brute', 'telegraph'],
      ['raider', 'basic_attack'],
      ['raider', 'reload'],
      ['raider_elite', 'basic_attack'],
      ['raider_elite', 'aim'],
      ['raider_elite', 'aimed_shot'],
      ['zombie_acid', 'basic_attack'],
      ['zombie_acid', 'acid_lash'],
      ['zombie_bloater', 'charge'],
      ['zombie_bloater', 'self_destruct'],
      ['zombie_screamer', 'basic_attack'],
      ['zombie_screamer', 'charge'],
      ['zombie_screamer', 'summon_horde'],
      ['zombie_charger', 'charge'],
    ]) {
      expect(COMBAT_MOTION_MANIFEST[sheetKey].motions[motionKey].locomotion).toBe('stationary');
    }

    for (const [sheetKey, motionKey] of [
      ['zombie_runner', 'runner_rush'],
      ['zombie_brute', 'slam'],
      ['zombie_charger', 'charge_strike'],
    ]) {
      expect(COMBAT_MOTION_MANIFEST[sheetKey].motions[motionKey].locomotion).toBe('approach');
    }
  });

  it('checks the production manifest before testing isolated semantic and byte drift', () => {
    const productionText = fs.readFileSync(EXPORTED_MANIFEST_PATH, 'utf8');
    const checkOutput = execFileSync(process.execPath, [
      path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
      '--check',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(checkOutput).toContain('up to date');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-motion-export-'));
    const tempManifestPath = path.join(tempDir, 'manifest.json');
    try {
      const reorderedManifest = reverseObjectKeys(COMBAT_MOTION_MANIFEST);
      fs.writeFileSync(tempManifestPath, JSON.stringify(reorderedManifest, null, 4), 'utf8');
      let result = spawnSync(process.execPath, [
        path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
        '--check',
        '--output',
        tempManifestPath,
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).not.toContain('semantic drift');
      expect(result.stderr).toContain('byte drift');

      const semanticDrift = structuredClone(COMBAT_MOTION_MANIFEST);
      semanticDrift.doctor_f.cols += 1;
      fs.writeFileSync(tempManifestPath, JSON.stringify(semanticDrift), 'utf8');
      result = spawnSync(process.execPath, [
        path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
        '--check',
        '--output',
        tempManifestPath,
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('semantic drift');

      fs.writeFileSync(tempManifestPath, JSON.stringify(COMBAT_MOTION_MANIFEST), 'utf8');
      result = spawnSync(process.execPath, [
        path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
        '--check',
        '--output',
        tempManifestPath,
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('byte drift');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    expect(fs.readFileSync(EXPORTED_MANIFEST_PATH, 'utf8')).toBe(productionText);
  });

  it('discovers an executable Python runtime without a user-specific absolute path', () => {
    const runtime = discoverPythonRuntime();
    const version = spawnSync(runtime.command, [...runtime.prefix, '--version'], { encoding: 'utf8' });

    expect(version.status).toBe(0);
    expect(`${version.stdout}${version.stderr}`).toMatch(/Python \d+/);
    const testSource = fs.readFileSync(import.meta.filename, 'utf8');
    expect(testSource).not.toMatch(/[A-Za-z]:[\\/]Users[\\/][^'"\s]+[\\/].*python\.exe/i);
    expect(testSource).not.toContain(['it', 'skipIf'].join('.'));
  });

  it('renders the monster preview from the authoritative exported sprite mapping', () => {
      const runtime = discoverPythonRuntime();
      const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-motion-preview-'));
      const previewPath = path.join(smokeDir, 'monster_motion_preview_active_sheets.png');
      const auditPath = path.join(smokeDir, 'monster_motion_audit.json');
      const modulePath = path.join(ROOT, 'tools', 'render_monster_motion_preview.py');
      const pythonScript = [
        'import importlib.util, sys',
        'sys.dont_write_bytecode = True',
        'from pathlib import Path',
        `spec = importlib.util.spec_from_file_location("combat_motion_preview", r"${modulePath.replaceAll('\\', '/')}")`,
        'module = importlib.util.module_from_spec(spec)',
        'spec.loader.exec_module(module)',
        `module.OUT_DIR = Path(r"${smokeDir.replaceAll('\\', '/')}")`,
        `module.PREVIEW_PATH = Path(r"${previewPath.replaceAll('\\', '/')}")`,
        `module.AUDIT_PATH = Path(r"${auditPath.replaceAll('\\', '/')}")`,
        `module.main(["--group", "normal", "--out", r"${previewPath.replaceAll('\\', '/')}"])`,
      ].join('\n');

      try {
        execFileSync(runtime.command, [...runtime.prefix, '-c', pythonScript], {
          cwd: ROOT,
          encoding: 'utf8',
        });
        const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
        expect(audit.group).toBe('normal');
        expect(audit.activeEnemyCount).toBe(12);
        expect(audit.activeUniqueSheetCount).toBe(12);
        expect(audit.invalidDimensions).toEqual([]);
        expect(audit.emptyRows).toEqual([]);
        expect(audit.orphanEnemySpriteMappings.filter(entry => entry.removedEnemy !== true))
          .toEqual([]);
        expect(fs.statSync(previewPath).size).toBeGreaterThan(0);
      } finally {
        fs.rmSync(smokeDir, { recursive: true, force: true });
      }
  });

  it('normalizes a mismatched source aspect ratio to the exact target grid size', () => {
    const runtime = discoverPythonRuntime();
    const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-motion-normalize-'));
    const modulePath = path.join(ROOT, 'tools', 'normalize_combat_sprite_sheets.py');
      const pythonScript = [
        'import importlib.util, json, sys',
        'sys.dont_write_bytecode = True',
      'from pathlib import Path',
      'from PIL import Image',
      `spec = importlib.util.spec_from_file_location("combat_sprite_normalizer", r"${modulePath.replaceAll('\\', '/')}")`,
      'module = importlib.util.module_from_spec(spec)',
      'sys.modules[spec.name] = module',
      'spec.loader.exec_module(module)',
      `root = Path(r"${smokeDir.replaceAll('\\', '/')}")`,
      'sprite_root = root / "assets/images/combat/spritesheets"',
      'sprite_root.mkdir(parents=True)',
      'target = sprite_root / "fixture_sheet.png"',
      'source = sprite_root / "fixture_sheet_src.png"',
      'Image.new("RGBA", (192, 128), (0, 0, 0, 0)).save(target)',
      'Image.new("RGBA", (300, 75), (255, 0, 0, 255)).save(source)',
      'manifest_path = sprite_root / "manifest.json"',
      'manifest_path.write_text(json.dumps({"fixture": {"src": "/assets/images/combat/spritesheets/fixture_sheet.png", "cols": 3, "rows": 2, "motions": {"idle": {"row": 0}, "hit": {"row": 1}}}}), encoding="utf-8")',
      'module.ROOT = root',
      'module.SPRITE_ROOT = sprite_root',
      'module.MANIFEST_PATH = manifest_path',
      'sys.argv = ["normalize_combat_sprite_sheets.py", "--from-src", "--only", "fixture"]',
      'module.main()',
      'assert Image.open(target).size == (192, 128), Image.open(target).size',
    ].join('\n');

    try {
      execFileSync(runtime.command, [...runtime.prefix, '-c', pythonScript], {
        cwd: ROOT,
        encoding: 'utf8',
      });
    } finally {
      fs.rmSync(smokeDir, { recursive: true, force: true });
    }
  });

  it('reports rectangular manifest cells as a bad grid', () => {
    expect(spriteGridIssue(1536, 800, { cols: 6, rows: 4 })).toEqual({
      code: 'bad-grid',
      message: 'sheet cells must be square; got 256x200',
    });
    expect(spriteGridIssue(1536, 1024, { cols: 6, rows: 4 })).toBeNull();
  });

  it('scopes the elite-raider white-pixel exemption to inspected muzzle-flash rows', () => {
    const inspectedRows = [
      { row: 0, whiteOpaquePixels: 52 },
      { row: 1, whiteOpaquePixels: 193 },
      { row: 2, whiteOpaquePixels: 50 },
      { row: 3, whiteOpaquePixels: 197 },
      { row: 4, whiteOpaquePixels: 15 },
      { row: 5, whiteOpaquePixels: 21 },
    ];
    expect(whiteOpaqueRisk('raider_elite', inspectedRows, 528)).toMatchObject({
      exempted: true,
      risky: false,
      scopedRows: [1, 3],
      scopedPixels: 390,
      otherPixels: 138,
    });
    expect(whiteOpaqueRisk('zombie_common', inspectedRows, 528).risky).toBe(true);
    expect(whiteOpaqueRisk('raider_elite', [
      ...inspectedRows,
      { row: 6, whiteOpaquePixels: 20 },
    ], 548).risky).toBe(true);
  });

  it('keeps idle rows foot-anchored and every animation row populated', () => {
    const entries = manifestEntries();

    const invalidRows = [];
    for (const { sheetKey, sheet, filePath } of entries) {
      const image = decodePngRgba(filePath);
      const frameWidth = image.width / sheet.cols;
      const frameHeight = image.height / sheet.rows;
      const motionRows = new Set(Object.values(sheet.motions).map(motion => motion.row));
      for (const row of motionRows) {
        const bounds = [];
        for (let col = 0; col < sheet.cols; col += 1) {
          const cellBounds = alphaBounds(image, col * frameWidth, row * frameHeight, frameWidth, frameHeight);
          if (cellBounds) bounds.push(cellBounds);
        }
        if (bounds.length !== sheet.cols) {
          invalidRows.push({
            sheetKey,
            file: path.relative(ROOT, filePath).replaceAll(path.sep, '/'),
            row,
            reason: `expected ${sheet.cols} populated frames, got ${bounds.length}`,
          });
          continue;
        }
        const bottoms = bounds.map(({ bottom }) => bottom);
        const bottomSpread = Math.max(...bottoms) - Math.min(...bottoms);

        if (row === resolveCombatMotion(sheetKey, 'idle')?.row && bottomSpread > 4) {
          invalidRows.push({
            sheetKey,
            file: path.relative(ROOT, filePath).replaceAll(path.sep, '/'),
            row,
            reason: 'idle row foot anchor drift',
            bottomSpread,
          });
        }
      }
    }

    expect(invalidRows).toEqual([]);
  });

  it('does not leave opaque chroma-key green pixels in displayed sprite sheets', () => {
    const files = manifestEntries().map(({ filePath }) => filePath);

    const filesWithChromaKey = [];
    for (const filePath of files) {
      const image = decodePngRgba(filePath);
      let chromaPixels = 0;
      for (let offset = 0; offset < image.pixels.length; offset += 4) {
        const r = image.pixels[offset];
        const g = image.pixels[offset + 1];
        const b = image.pixels[offset + 2];
        const a = image.pixels[offset + 3];
        if (a > 200 && g > 220 && r < 60 && b < 80) chromaPixels += 1;
      }
      if (chromaPixels > 0) {
        filesWithChromaKey.push({
          file: path.relative(ROOT, filePath).replaceAll(path.sep, '/'),
          chromaPixels,
        });
      }
    }

    expect(filesWithChromaKey).toEqual([]);
  });

  it('keeps displayed sprite pixels away from frame edges to avoid animation clipping', () => {
    const entries = manifestEntries();

    const clippedFrames = [];
    for (const { sheetKey, sheet, filePath } of entries) {
      const image = decodePngRgba(filePath);
      const frameWidth = image.width / sheet.cols;
      const frameHeight = image.height / sheet.rows;
      const motionRows = new Set(Object.values(sheet.motions).map(motion => motion.row));
      for (const row of motionRows) {
        for (let col = 0; col < sheet.cols; col += 1) {
          const edgePixels = countEdgeAlpha(image, col * frameWidth, row * frameHeight, frameWidth, frameHeight);
          if (edgePixels > 0) {
            clippedFrames.push({
              sheetKey,
              file: path.relative(ROOT, filePath).replaceAll(path.sep, '/'),
              row,
              col,
              edgePixels,
            });
          }
        }
      }
    }

    expect(clippedFrames).toEqual([]);
  });

  it('uses exact six-frame positions with per-sheet steps(N, jump-none)', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css', 'screens-combat.css'), 'utf8');
    const fxPlayer = fs.readFileSync(path.join(ROOT, 'js', 'ui', 'combat', 'CombatFxPlayer.js'), 'utf8');

    expect(css).not.toContain('steps(6, end)');
    expect(css).not.toContain('background-size: 600% 400%');
    expect(css).toContain('background-size: calc(var(--sprite-cols) * 100%) calc(var(--sprite-rows) * 100%)');
    expect(css).toContain('background-position-x: 20%');
    expect(css).toContain('background-position-x: 40%');
    expect(css).toContain('background-position-x: 60%');
    expect(css).toContain('background-position-x: 80%');
    expect(css).toContain('background-position-x: 100%');
    expect(fxPlayer).toContain('animation-timing-function: steps(${steps}, jump-none)');
  });

  it('renders player and companion sprite sheets from the same ally size token', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css', 'screens-combat.css'), 'utf8');

    expect(css).toContain('--combat-ally-sprite-size: clamp(250px, 34vh, 360px)');
    expect(css).toContain('--ally-sprite-size: var(--combat-ally-sprite-size)');
    expect(css.match(/width: var\(--ally-sprite-size\);/g)?.length).toBeGreaterThanOrEqual(3);
    expect(css.match(/height: var\(--ally-sprite-size\);/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps the combat sprite audit tool runnable for quality reports', () => {
    const output = execFileSync(process.execPath, [
      path.join(ROOT, 'tools', 'audit_combat_sprites.mjs'),
      '--check',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    const summary = JSON.parse(output.trim());

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.referenced).toBeGreaterThan(0);
    expect(summary.fail).toBe(0);
  }, 30000);
});
