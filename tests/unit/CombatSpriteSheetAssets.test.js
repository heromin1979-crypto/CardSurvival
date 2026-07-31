import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync, spawnSync } from 'node:child_process';
import { COMBAT_MOTION_MANIFEST } from '../../js/data/combatMotionManifest.js';

const ROOT = process.cwd();
const SPRITE_ROOT = path.join(ROOT, 'assets', 'images', 'combat', 'spritesheets');
const EXPORTED_MANIFEST_PATH = path.join(SPRITE_ROOT, 'manifest.json');
const PYTHON_RUNTIME = 'C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const PREVIEW_SMOKE_DIR = path.join(
  ROOT,
  '.superpowers',
  'sdd',
  '2026-07-27-combat-motion-overhaul',
  'task-5-smoke',
);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
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

  it('exports a byte-identical JSON manifest from the runtime source of truth', () => {
    execFileSync(process.execPath, [
      path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    const exportedText = fs.readFileSync(EXPORTED_MANIFEST_PATH, 'utf8');
    expect(JSON.parse(exportedText)).toEqual(COMBAT_MOTION_MANIFEST);

    const checkOutput = execFileSync(process.execPath, [
      path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
      '--check',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(checkOutput).toContain('up to date');

    try {
      const semanticDrift = structuredClone(COMBAT_MOTION_MANIFEST);
      semanticDrift.doctor_f.cols += 1;
      fs.writeFileSync(EXPORTED_MANIFEST_PATH, JSON.stringify(semanticDrift), 'utf8');
      let result = spawnSync(process.execPath, [
        path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
        '--check',
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('semantic drift');

      fs.writeFileSync(EXPORTED_MANIFEST_PATH, JSON.stringify(COMBAT_MOTION_MANIFEST), 'utf8');
      result = spawnSync(process.execPath, [
        path.join(ROOT, 'tools', 'export_combat_motion_manifest.mjs'),
        '--check',
      ], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('byte drift');
    } finally {
      fs.writeFileSync(EXPORTED_MANIFEST_PATH, exportedText, 'utf8');
    }
  });

  it.skipIf(!fs.existsSync(PYTHON_RUNTIME))(
    'renders the monster preview from the authoritative exported sprite mapping',
    () => {
      const previewPath = path.join(PREVIEW_SMOKE_DIR, 'monster_motion_preview_active_sheets.png');
      const auditPath = path.join(PREVIEW_SMOKE_DIR, 'monster_motion_audit.json');
      const modulePath = path.join(ROOT, 'tools', 'render_monster_motion_preview.py');
      const pythonScript = [
        'import importlib.util',
        'from pathlib import Path',
        `spec = importlib.util.spec_from_file_location("combat_motion_preview", r"${modulePath.replaceAll('\\', '/')}")`,
        'module = importlib.util.module_from_spec(spec)',
        'spec.loader.exec_module(module)',
        `module.OUT_DIR = Path(r"${PREVIEW_SMOKE_DIR.replaceAll('\\', '/')}")`,
        `module.PREVIEW_PATH = Path(r"${previewPath.replaceAll('\\', '/')}")`,
        `module.AUDIT_PATH = Path(r"${auditPath.replaceAll('\\', '/')}")`,
        'module.main()',
      ].join('\n');

      execFileSync(PYTHON_RUNTIME, ['-c', pythonScript], {
        cwd: ROOT,
        encoding: 'utf8',
      });

      const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
      expect(audit.activeUniqueSheetCount).toBeGreaterThan(0);
      expect(audit.invalidDimensions).toEqual([]);
      expect(audit.emptyRows).toEqual([]);
      expect(fs.statSync(previewPath).size).toBeGreaterThan(0);
    },
  );

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

        if (row === sheet.motions.idle.row && bottomSpread > 4) {
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
  });
});
