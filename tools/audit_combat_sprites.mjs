import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const { COMBAT_MOTION_MANIFEST } = require('../js/data/combatMotionManifest.js');
const ROOT = process.cwd();
const OUT_JSON = path.join(ROOT, 'output', 'combat', 'sprite_audit.json');
const OUT_MD = path.join(ROOT, 'docs', 'analysis', 'COMBAT_SPRITE_AUDIT.md');
const ALPHA_THRESHOLD = 12;
const CHROMA_ALPHA_THRESHOLD = 200;
const CHROMA_HUE_MIN = 78;
const CHROMA_HUE_MAX = 162;
const CHROMA_SATURATION_MIN = 0.72;
const CHROMA_VALUE_MIN = 150;
const ISOLATED_CHROMA_COMPONENT_AREA = 12;

function normalizeAssetPath(assetPath) {
  return assetPath.replace(/^\/+/, '').replace(/^\.\//, '').replaceAll('/', path.sep);
}

function toPosixRel(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function manifestSheets() {
  return Object.entries(COMBAT_MOTION_MANIFEST).map(([sheetKey, sheet]) => ({
    sheetKey,
    sheet,
    filePath: path.normalize(path.join(ROOT, normalizeAssetPath(sheet.src))),
  }));
}

function readPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${filePath} is not a PNG file`);

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
    } else if (type === 'IDAT') idat.push(buffer.subarray(dataStart, dataEnd));
    else if (type === 'IEND') break;
    offset = dataEnd + 4;
  }
  if (bitDepth !== 8 || colorType !== 6) return { width, height, bitDepth, colorType, pixels: null };

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(height * stride);
  let sourceOffset = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    return pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowStart = y * stride;
    const prevRowStart = rowStart - stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
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
    sourceOffset += stride;
  }
  return { width, height, bitDepth, colorType, pixels };
}

function pixelOffset(image, x, y) {
  return (y * image.width + x) * 4;
}

function hueAndSaturation(r, g, b) {
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  if (maximum === 0) return { hue: 0, saturation: 0, value: 0 };
  const chroma = maximum - minimum;
  if (chroma === 0) return { hue: 0, saturation: 0, value: maximum };
  let hue;
  if (maximum === r) hue = 60 * (((g - b) / chroma) % 6);
  else if (maximum === g) hue = 60 * (((b - r) / chroma) + 2);
  else hue = 60 * (((r - g) / chroma) + 4);
  return { hue, saturation: chroma / maximum, value: maximum };
}

function isGreenScreenPixel(pixel) {
  const [r, g, b, a] = pixel;
  if (a <= ALPHA_THRESHOLD) return false;
  const { hue, saturation, value } = hueAndSaturation(r, g, b);
  return hue >= CHROMA_HUE_MIN && hue <= CHROMA_HUE_MAX
    && saturation >= CHROMA_SATURATION_MIN && value >= CHROMA_VALUE_MIN;
}

function isOpaqueChroma(pixel) {
  return pixel[3] > CHROMA_ALPHA_THRESHOLD && isGreenScreenPixel(pixel);
}

function nearbyEdgeChroma(image, x, y, edge) {
  for (let ny = Math.max(0, y - 2); ny <= Math.min(image.height - 1, y + 2); ny += 1) {
    for (let nx = Math.max(0, x - 2); nx <= Math.min(image.width - 1, x + 2); nx += 1) {
      if (edge[ny * image.width + nx]) return true;
    }
  }
  return false;
}

export function chromaArtifactStats(image) {
  const opaque = new Uint8Array(image.width * image.height);
  let hiddenRgb = 0;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = y * image.width + x;
      const pixel = image.pixels.subarray(pixelOffset(image, x, y), pixelOffset(image, x, y) + 4);
      if (isOpaqueChroma(pixel)) opaque[index] = 1;
      if (pixel[3] === 0 && (pixel[0] !== 0 || pixel[1] !== 0 || pixel[2] !== 0)) hiddenRgb += 1;
    }
  }
  const edge = new Uint8Array(opaque.length);
  const stack = [];
  for (let x = 0; x < image.width; x += 1) stack.push([x, 0], [x, image.height - 1]);
  for (let y = 0; y < image.height; y += 1) stack.push([0, y], [image.width - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    const index = y * image.width + x;
    if (edge[index] || !opaque[index]) continue;
    edge[index] = 1;
    if (x > 0) stack.push([x - 1, y]);
    if (x + 1 < image.width) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y + 1 < image.height) stack.push([x, y + 1]);
  }
  let opaqueGreen = 0;
  let fringeGreen = 0;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = y * image.width + x;
      const pixel = image.pixels.subarray(pixelOffset(image, x, y), pixelOffset(image, x, y) + 4);
      if (edge[index]) {
        opaqueGreen += 1;
      } else if (isGreenScreenPixel(pixel) && nearbyEdgeChroma(image, x, y, edge)) {
        fringeGreen += 1;
      }
    }
  }

  const seen = new Uint8Array(opaque.length);
  let removedComponents = 0;
  for (let start = 0; start < opaque.length; start += 1) {
    if (!opaque[start] || edge[start] || seen[start]) continue;
    const component = [start];
    seen[start] = 1;
    for (let cursor = 0; cursor < component.length; cursor += 1) {
      const index = component[cursor];
      const x = index % image.width;
      const y = Math.floor(index / image.width);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= image.width || ny >= image.height) continue;
        const neighbor = ny * image.width + nx;
        if (opaque[neighbor] && !edge[neighbor] && !seen[neighbor]) {
          seen[neighbor] = 1;
          component.push(neighbor);
        }
      }
    }
    if (component.length <= ISOLATED_CHROMA_COMPONENT_AREA) removedComponents += 1;
  }
  return { opaqueGreen, fringeGreen, hiddenRgb, removedComponents };
}

function frameBounds(image, frameX, frameY, frameW, frameH) {
  let minX = frameW;
  let minY = frameH;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < frameH; y += 1) {
    for (let x = 0; x < frameW; x += 1) {
      if (image.pixels[pixelOffset(image, frameX + x, frameY + y) + 3] > ALPHA_THRESHOLD) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return null;
  return {
    minX, minY, maxX, maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    centerX: (minX + maxX) / 2,
    bottom: maxY,
  };
}

function countFrameEdgeOpaque(image, frameX, frameY, frameW, frameH) {
  let count = 0;
  for (let x = 0; x < frameW; x += 1) {
    if (image.pixels[pixelOffset(image, frameX + x, frameY) + 3] > ALPHA_THRESHOLD) count += 1;
    if (image.pixels[pixelOffset(image, frameX + x, frameY + frameH - 1) + 3] > ALPHA_THRESHOLD) count += 1;
  }
  for (let y = 1; y < frameH - 1; y += 1) {
    if (image.pixels[pixelOffset(image, frameX, frameY + y) + 3] > ALPHA_THRESHOLD) count += 1;
    if (image.pixels[pixelOffset(image, frameX + frameW - 1, frameY + y) + 3] > ALPHA_THRESHOLD) count += 1;
  }
  return count;
}

function spread(values) {
  return values.length ? Math.max(...values) - Math.min(...values) : null;
}

function analyzePixels(image, sheet, frameW, frameH) {
  let opaquePixels = 0;
  let whiteOpaquePixels = 0;
  for (let offset = 0; offset < image.pixels.length; offset += 4) {
    const [r, g, b, a] = image.pixels.subarray(offset, offset + 4);
    if (a > ALPHA_THRESHOLD) {
      opaquePixels += 1;
      if (a > 200 && r > 235 && g > 235 && b > 235) whiteOpaquePixels += 1;
    }
  }

  const motionKeysByRow = new Map();
  for (const [motionKey, motion] of Object.entries(sheet.motions)) {
    const current = motionKeysByRow.get(motion.row) ?? [];
    current.push(motionKey);
    motionKeysByRow.set(motion.row, current);
  }
  const rows = [];
  for (const [row, motionKeys] of [...motionKeysByRow.entries()].sort(([a], [b]) => a - b)) {
    const rowBounds = [];
    let edgeOpaque = 0;
    for (let col = 0; col < sheet.cols; col += 1) {
      const bounds = frameBounds(image, col * frameW, row * frameH, frameW, frameH);
      edgeOpaque += countFrameEdgeOpaque(image, col * frameW, row * frameH, frameW, frameH);
      if (bounds) rowBounds.push(bounds);
    }
    rows.push({
      row,
      motionKeys,
      populatedFrames: rowBounds.length,
      centerSpreadPx: spread(rowBounds.map(bounds => bounds.centerX)),
      bottomSpreadPx: spread(rowBounds.map(bounds => bounds.bottom)),
      heightSpreadPx: spread(rowBounds.map(bounds => bounds.height)),
      widthSpreadPx: spread(rowBounds.map(bounds => bounds.width)),
      edgeOpaque,
    });
  }
  return {
    transparentPct: Number(((1 - opaquePixels / (image.width * image.height)) * 100).toFixed(2)),
    whiteOpaquePixels,
    ...chromaArtifactStats(image),
    rows,
  };
}

function severityFor(issues) {
  if (issues.some(issue => issue.level === 'fail')) return 'fail';
  if (issues.some(issue => issue.level === 'warn')) return 'warn';
  return 'pass';
}

export function spriteGridIssue(width, height, sheet) {
  const frameW = width / sheet.cols;
  const frameH = height / sheet.rows;
  if (!Number.isInteger(frameW) || !Number.isInteger(frameH)) {
    return { code: 'bad-grid', message: `sheet is not divisible by ${sheet.cols}x${sheet.rows}` };
  }
  if (frameW !== frameH) {
    return { code: 'bad-grid', message: `sheet cells must be square; got ${frameW}x${frameH}` };
  }
  return null;
}

function analyzeFile({ sheetKey, sheet, filePath }) {
  const issues = [];
  const image = readPng(filePath);
  const frameW = image.width / sheet.cols;
  const frameH = image.height / sheet.rows;
  const gridIssue = spriteGridIssue(image.width, image.height, sheet);
  if (gridIssue) issues.push({ level: 'fail', ...gridIssue });
  if (image.bitDepth !== 8 || image.colorType !== 6 || !image.pixels) {
    issues.push({ level: 'fail', code: 'unsupported-png', message: `bitDepth=${image.bitDepth} colorType=${image.colorType}` });
    return { sheetKey, path: toPosixRel(filePath), referenced: true, width: image.width, height: image.height, frameW, frameH, rows: [], issues, severity: severityFor(issues) };
  }
  if (gridIssue) {
    return { sheetKey, path: toPosixRel(filePath), referenced: true, width: image.width, height: image.height, frameW, frameH, rows: [], issues, severity: severityFor(issues) };
  }

  const pixelStats = analyzePixels(image, sheet, frameW, frameH);
  for (const row of pixelStats.rows) {
    if (row.populatedFrames !== sheet.cols) {
      issues.push({ level: 'fail', code: 'empty-frame', message: `${row.motionKeys.join(', ')} has ${row.populatedFrames}/${sheet.cols} frames` });
    }
    if (row.row === sheet.motions.idle.row && row.bottomSpreadPx > 4) {
      issues.push({ level: 'fail', code: 'idle-foot-drift', message: `idle bottom spread ${row.bottomSpreadPx}px` });
    }
    if (row.centerSpreadPx > 34) issues.push({ level: 'warn', code: 'center-drift', message: `${row.motionKeys.join(', ')} center spread ${row.centerSpreadPx}px` });
    if (row.edgeOpaque > 0) issues.push({ level: 'warn', code: 'edge-touch', message: `${row.motionKeys.join(', ')} has ${row.edgeOpaque} edge pixels` });
  }
  if (pixelStats.whiteOpaquePixels > 500) issues.push({ level: 'warn', code: 'white-bg-risk', message: `${pixelStats.whiteOpaquePixels} opaque white pixels` });
  if (pixelStats.opaqueGreen > 0 || pixelStats.fringeGreen > 0) {
    issues.push({
      level: 'fail',
      code: 'chroma-artifact',
      message: `opaque=${pixelStats.opaqueGreen} fringe=${pixelStats.fringeGreen} hiddenRgb=${pixelStats.hiddenRgb} isolated=${pixelStats.removedComponents}`,
    });
  } else if (pixelStats.hiddenRgb > 0 || pixelStats.removedComponents > 0) {
    issues.push({
      level: 'warn',
      code: 'chroma-review',
      message: `hiddenRgb=${pixelStats.hiddenRgb} isolated=${pixelStats.removedComponents}; normalize only after visual confirmation`,
    });
  }
  return {
    sheetKey,
    path: toPosixRel(filePath),
    referenced: true,
    width: image.width,
    height: image.height,
    frameW,
    frameH,
    ...pixelStats,
    issues,
    severity: severityFor(issues),
  };
}

function renderMarkdown(audit) {
  const rows = audit.sheets.map((sheet) => {
    const idle = sheet.rows.find(row => row.motionKeys?.includes('idle')) ?? {};
    const maxCenter = Math.max(...sheet.rows.map(row => row.centerSpreadPx ?? 0), 0);
    const maxEdge = sheet.rows.reduce((sum, row) => sum + (row.edgeOpaque ?? 0), 0);
    const issues = sheet.issues.length ? sheet.issues.map(issue => issue.code).join(', ') : 'none';
    return `| ${sheet.severity} | \`${sheet.sheetKey}\` | \`${sheet.path}\` | ${sheet.width}x${sheet.height} | ${sheet.frameW}x${sheet.frameH} | ${sheet.transparentPct ?? 'n/a'} | ${idle.bottomSpreadPx ?? 'n/a'} | ${maxCenter} | ${maxEdge} | ${issues} |`;
  }).join('\n');
  const issues = audit.sheets.filter(sheet => sheet.severity !== 'pass').map((sheet) => (
    `- \`${sheet.path}\` - ${sheet.issues.map(issue => `${issue.code}: ${issue.message}`).join('; ')}`
  )).join('\n') || '- none';
  return `# Combat Sprite Audit

Generated by \`node tools/audit_combat_sprites.mjs\` at ${new Date().toISOString()}.

## Contract

- Each displayed sheet uses its own \`cols\`, \`rows\`, and \`motions\` from \`combatMotionManifest.js\`.
- PNG dimensions must divide evenly into the declared grid; cells must be square.
- Frame anchor is bottom-center. Idle row foot drift should stay within 4 px.
- Transparent PNG is required. Edge-connected high-saturation chroma green and fringe spill are failures. Hidden transparent RGB and isolated saturated green dots remain review warnings because they can also be intentional effects or anti-aliased asset metadata.

## Summary

- Sheets scanned: ${audit.summary.total}
- Referenced by the combat motion registry: ${audit.summary.referenced}
- Pass: ${audit.summary.pass}
- Warn: ${audit.summary.warn}
- Fail: ${audit.summary.fail}

## Issues

${issues}

## Sheet Metrics

| Status | Key | Path | Sheet | Cell | Transparent % | Idle bottom spread | Max center spread | Edge pixels | Issues |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
${rows}
`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const sheets = manifestSheets().map(analyzeFile);
  const summary = {
    total: sheets.length,
    referenced: sheets.length,
    pass: sheets.filter(sheet => sheet.severity === 'pass').length,
    warn: sheets.filter(sheet => sheet.severity === 'warn').length,
    fail: sheets.filter(sheet => sheet.severity === 'fail').length,
  };
  const audit = { summary, sheets };
  if (!checkOnly) {
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
    fs.writeFileSync(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
    fs.writeFileSync(OUT_MD, renderMarkdown(audit), 'utf8');
  }
  console.log(JSON.stringify(summary));
  if (summary.fail > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
