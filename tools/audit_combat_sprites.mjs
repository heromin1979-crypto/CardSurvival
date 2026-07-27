import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const SPRITE_ROOT = path.join(ROOT, 'assets', 'images', 'combat', 'spritesheets');
// 시트 참조 테이블이 combatUiAssets.js로 분리됨 — 두 파일 모두 스캔해 하위호환 유지
const COMBAT_UI_PATHS = [
  path.join(ROOT, 'js', 'ui', 'combat', 'combatUiAssets.js'),
  path.join(ROOT, 'js', 'ui', 'CombatUI.js'),
];
const OUT_JSON = path.join(ROOT, 'output', 'combat', 'sprite_audit.json');
const OUT_MD = path.join(ROOT, 'docs', 'analysis', 'COMBAT_SPRITE_AUDIT.md');

const COLS = 6;
const ROWS = 4;
const FRAME_SIZE = 256;
const ALPHA_THRESHOLD = 12;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function toPosixRel(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function normalizeAssetPath(assetPath) {
  return assetPath.replace(/^\/+/, '').replace(/^\.\//, '').replaceAll('/', path.sep);
}

function referencedSpritePaths() {
  const paths = new Set();
  for (const sourcePath of COMBAT_UI_PATHS) {
    if (!fs.existsSync(sourcePath)) continue;
    const js = fs.readFileSync(sourcePath, 'utf8');
    for (const match of js.matchAll(/spriteSheet\('([^']+\.png)'\)/g)) {
      paths.add(path.normalize(path.join(ROOT, normalizeAssetPath(match[1]))));
    }
  }
  return paths;
}

function readPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${filePath} is not a PNG file`);
  }

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

  if (bitDepth !== 8 || colorType !== 6) {
    return { width, height, bitDepth, colorType, pixels: null };
  }

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

  return { width, height, bitDepth, colorType, pixels };
}

function pixelOffset(image, x, y) {
  return (y * image.width + x) * 4;
}

function frameBounds(image, frameX, frameY, frameW, frameH) {
  let minX = frameW;
  let minY = frameH;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < frameH; y += 1) {
    for (let x = 0; x < frameW; x += 1) {
      const alpha = image.pixels[pixelOffset(image, frameX + x, frameY + y) + 3];
      if (alpha > ALPHA_THRESHOLD) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < 0) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    centerX: (minX + maxX) / 2,
    bottom: maxY,
    bottomMargin: frameH - 1 - maxY,
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

function analyzePixels(image, frameW, frameH) {
  let opaquePixels = 0;
  let whiteOpaquePixels = 0;
  let chromaKeyPixels = 0;
  const frames = [];
  const rows = [];

  for (let offset = 0; offset < image.pixels.length; offset += 4) {
    const r = image.pixels[offset];
    const g = image.pixels[offset + 1];
    const b = image.pixels[offset + 2];
    const a = image.pixels[offset + 3];
    if (a > ALPHA_THRESHOLD) {
      opaquePixels += 1;
      if (a > 200 && r > 235 && g > 235 && b > 235) whiteOpaquePixels += 1;
      if (a > 200 && g > 220 && r < 80 && b < 100) chromaKeyPixels += 1;
    }
  }

  for (let row = 0; row < ROWS; row += 1) {
    const rowBounds = [];
    let rowEdgeOpaque = 0;
    for (let col = 0; col < COLS; col += 1) {
      const frameX = col * frameW;
      const frameY = row * frameH;
      const bounds = frameBounds(image, frameX, frameY, frameW, frameH);
      const edgeOpaque = countFrameEdgeOpaque(image, frameX, frameY, frameW, frameH);
      rowEdgeOpaque += edgeOpaque;
      frames.push({ row, col, bounds, edgeOpaque });
      if (bounds) rowBounds.push(bounds);
    }

    const centers = rowBounds.map((bounds) => bounds.centerX);
    const bottoms = rowBounds.map((bounds) => bounds.bottom);
    const heights = rowBounds.map((bounds) => bounds.height);
    const widths = rowBounds.map((bounds) => bounds.width);
    const spread = (values) => values.length ? Math.max(...values) - Math.min(...values) : null;
    rows.push({
      row,
      populatedFrames: rowBounds.length,
      centerSpreadPx: spread(centers),
      bottomSpreadPx: spread(bottoms),
      heightSpreadPx: spread(heights),
      widthSpreadPx: spread(widths),
      edgeOpaque: rowEdgeOpaque,
    });
  }

  return {
    opaquePixels,
    transparentPct: Number(((1 - opaquePixels / (image.width * image.height)) * 100).toFixed(2)),
    whiteOpaquePixels,
    chromaKeyPixels,
    frames,
    rows,
  };
}

function severityFor(issues) {
  if (issues.some((issue) => issue.level === 'fail')) return 'fail';
  if (issues.some((issue) => issue.level === 'warn')) return 'warn';
  return 'pass';
}

function analyzeFile(filePath, referenced) {
  const issues = [];
  const relPath = toPosixRel(filePath);
  const image = readPng(filePath);
  const expectedWidth = COLS * FRAME_SIZE;
  const expectedHeight = ROWS * FRAME_SIZE;
  const frameW = image.width / COLS;
  const frameH = image.height / ROWS;

  if (image.width !== expectedWidth || image.height !== expectedHeight) {
    issues.push({ level: 'fail', code: 'bad-size', message: `expected ${expectedWidth}x${expectedHeight}` });
  }
  if (!Number.isInteger(frameW) || !Number.isInteger(frameH)) {
    issues.push({ level: 'fail', code: 'bad-grid', message: 'sheet is not divisible by 6x4' });
  }
  if (image.bitDepth !== 8 || image.colorType !== 6 || !image.pixels) {
    issues.push({ level: 'fail', code: 'unsupported-png', message: `bitDepth=${image.bitDepth} colorType=${image.colorType}` });
    return {
      path: relPath,
      referenced,
      width: image.width,
      height: image.height,
      frameW,
      frameH,
      transparentPct: null,
      whiteOpaquePixels: null,
      chromaKeyPixels: null,
      rows: [],
      issues,
      severity: severityFor(issues),
    };
  }

  const pixelStats = analyzePixels(image, frameW, frameH);
  for (const row of pixelStats.rows) {
    if (row.populatedFrames !== COLS) {
      issues.push({ level: 'fail', code: 'empty-frame', message: `row ${row.row} has ${row.populatedFrames}/${COLS} frames` });
    }
    if (row.row === 0 && row.bottomSpreadPx > 4) {
      issues.push({ level: 'fail', code: 'idle-foot-drift', message: `idle bottom spread ${row.bottomSpreadPx}px` });
    }
    if (row.centerSpreadPx > 34) {
      issues.push({ level: 'warn', code: 'center-drift', message: `row ${row.row} center spread ${row.centerSpreadPx}px` });
    }
    if (row.edgeOpaque > 0) {
      issues.push({ level: 'warn', code: 'edge-touch', message: `row ${row.row} has ${row.edgeOpaque} edge pixels` });
    }
  }
  if (pixelStats.whiteOpaquePixels > 500) {
    issues.push({ level: 'warn', code: 'white-bg-risk', message: `${pixelStats.whiteOpaquePixels} opaque white pixels` });
  }
  if (pixelStats.chromaKeyPixels > 0) {
    issues.push({ level: 'warn', code: 'chroma-key-green', message: `${pixelStats.chromaKeyPixels} chroma-key pixels` });
  }

  return {
    path: relPath,
    referenced,
    width: image.width,
    height: image.height,
    frameW,
    frameH,
    transparentPct: pixelStats.transparentPct,
    whiteOpaquePixels: pixelStats.whiteOpaquePixels,
    chromaKeyPixels: pixelStats.chromaKeyPixels,
    rows: pixelStats.rows,
    issues,
    severity: severityFor(issues),
  };
}

function renderMarkdown(audit) {
  const generatedAt = new Date().toISOString();
  const rows = audit.sheets.map((sheet) => {
    const idle = sheet.rows.find((row) => row.row === 0) ?? {};
    const maxCenter = Math.max(...sheet.rows.map((row) => row.centerSpreadPx ?? 0));
    const maxEdge = sheet.rows.reduce((sum, row) => sum + (row.edgeOpaque ?? 0), 0);
    const issues = sheet.issues.length ? sheet.issues.map((issue) => issue.code).join(', ') : 'none';
    return `| ${sheet.severity} | ${sheet.referenced ? 'yes' : 'no'} | \`${sheet.path}\` | ${sheet.width}x${sheet.height} | ${sheet.frameW}x${sheet.frameH} | ${sheet.transparentPct ?? 'n/a'} | ${idle.bottomSpreadPx ?? 'n/a'} | ${maxCenter} | ${maxEdge} | ${issues} |`;
  }).join('\n');

  const failList = audit.sheets
    .filter((sheet) => sheet.severity !== 'pass')
    .map((sheet) => {
      const issues = sheet.issues.map((issue) => `${issue.code}: ${issue.message}`).join('; ');
      return `- \`${sheet.path}\` - ${issues}`;
    })
    .join('\n') || '- none';

  return `# Combat Sprite Audit

Generated by \`node tools/audit_combat_sprites.mjs\` at ${generatedAt}.

## Contract

- Displayed combat sheets use a 6x4 grid.
- Each cell is 256x256 px, for a full sheet size of 1536x1024 px.
- Frame anchor is bottom-center. Idle row foot drift should stay within 4 px.
- Transparent PNG is required. Opaque chroma-key green is a normalization warning.
- Edge-touching pixels are warnings because they can cause visible clipping during CSS animation.

## Summary

- Sheets scanned: ${audit.summary.total}
- Referenced by \`CombatUI.js\`: ${audit.summary.referenced}
- Pass: ${audit.summary.pass}
- Warn: ${audit.summary.warn}
- Fail: ${audit.summary.fail}

## Issues

${failList}

## Sheet Metrics

| Status | Referenced | Path | Sheet | Cell | Transparent % | Idle bottom spread | Max center spread | Edge pixels | Issues |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
${rows}

## Next Use

Use this report before Phase 2 baseline tuning. Any sheet with \`bad-size\` or
\`idle-foot-drift\` must be fixed before layout tuning. Sheets with
\`chroma-key-green\`, \`center-drift\`, or high \`edge-touch\` should be
normalized or regenerated before CSS scale values are treated as final.
`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const refs = referencedSpritePaths();
  const files = walk(SPRITE_ROOT)
    .filter((filePath) => /_sheet\.png$/.test(path.basename(filePath)))
    .filter((filePath) => !/_src\.png$/.test(path.basename(filePath)))
    .sort();

  const sheets = files.map((filePath) => analyzeFile(filePath, refs.has(path.normalize(filePath))));
  const summary = {
    total: sheets.length,
    referenced: sheets.filter((sheet) => sheet.referenced).length,
    pass: sheets.filter((sheet) => sheet.severity === 'pass').length,
    warn: sheets.filter((sheet) => sheet.severity === 'warn').length,
    fail: sheets.filter((sheet) => sheet.severity === 'fail').length,
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

main();
