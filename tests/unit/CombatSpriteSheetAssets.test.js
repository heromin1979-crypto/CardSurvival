import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SPRITE_ROOT = path.join(ROOT, 'assets', 'images', 'combat', 'spritesheets');

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

describe('combat sprite sheet assets', () => {
  it('keeps all displayed combat sprite sheets on the 6x4 256px cell contract', () => {
    const files = walk(SPRITE_ROOT)
      .filter((filePath) => /_sheet\.png$/.test(path.basename(filePath)))
      .filter((filePath) => !/_src\.png$/.test(path.basename(filePath)));

    expect(files.length).toBeGreaterThan(0);

    const invalid = files
      .map((filePath) => ({ filePath, ...pngSize(filePath) }))
      .filter(({ width, height }) => width !== 1536 || height !== 1024);

    expect(invalid).toEqual([]);
  });

  it('keeps idle rows foot-anchored and every animation row populated', () => {
    const files = walk(SPRITE_ROOT)
      .filter((filePath) => /_sheet\.png$/.test(path.basename(filePath)))
      .filter((filePath) => !/_src\.png$/.test(path.basename(filePath)));

    const invalidRows = [];
    for (const filePath of files) {
      const image = decodePngRgba(filePath);
      for (let row = 0; row < 4; row += 1) {
        const bounds = [];
        for (let col = 0; col < 6; col += 1) {
          const cellBounds = alphaBounds(image, col * 256, row * 256, 256, 256);
          if (cellBounds) bounds.push(cellBounds);
        }
        if (bounds.length !== 6) {
          invalidRows.push({
            file: path.relative(ROOT, filePath).replaceAll(path.sep, '/'),
            row,
            reason: `expected 6 populated frames, got ${bounds.length}`,
          });
          continue;
        }
        const bottoms = bounds.map(({ bottom }) => bottom);
        const bottomSpread = Math.max(...bottoms) - Math.min(...bottoms);

        if (row === 0 && bottomSpread > 4) {
          invalidRows.push({
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
    const files = walk(SPRITE_ROOT)
      .filter((filePath) => /_sheet\.png$/.test(path.basename(filePath)))
      .filter((filePath) => !/_src\.png$/.test(path.basename(filePath)));

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

  it('uses exact six-frame background positions instead of fractional CSS steps', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css', 'screens-combat.css'), 'utf8');

    expect(css).not.toContain('steps(6, end)');
    expect(css).not.toContain('background-size: 600% 400%');
    expect(css).toContain('background-position-x: 20%');
    expect(css).toContain('background-position-x: 40%');
    expect(css).toContain('background-position-x: 60%');
    expect(css).toContain('background-position-x: 80%');
    expect(css).toContain('background-position-x: 100%');
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
