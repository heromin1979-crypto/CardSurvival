import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { provenanceSha256 } from './provenance_hash.mjs';

const ALPHA_THRESHOLD = 12;

export const RANGED_COMPONENT_CONTRACT_RELATIVE_PATH = 'art_sources/combat/task9_companions/ranged_component_contract.json';
export const RANGED_COMPONENT_CONTRACT_SHA256 = '24e76c90729763d6ec839cd9ca141bc4eb55d20671c56f0b5eda469a257032c1';

export const COMPANION_FRAME_QUALITY_LIMITS = Object.freeze({
  minOpaquePixels: 3500,
  minMajorComponentRatio: 0.55,
  minRowAreaRatio: 0.42,
  maxRowAreaRatio: 2.4,
  minRowHeightRatio: 0.55,
  minImpactRowAreaRatio: 0.28,
  minImpactRowHeightRatio: 0.25,
  minCellPaddingPx: 2,
  maxSignificantComponents: 5,
  maxCenterStepPx: 70,
});

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function alphaAt(image, x, y) {
  return image.pixels[(y * image.width + x) * 4 + 3];
}

function componentFingerprint(component, pixelIndices) {
  const sorted = [...pixelIndices].sort((a, b) => a - b);
  const bytes = Buffer.alloc(sorted.length * 4);
  for (let index = 0; index < sorted.length; index += 1) bytes.writeUInt32LE(sorted[index], index * 4);
  const shapeSha256 = createHash('sha256').update(bytes).digest('hex');
  return `v1:${component.size}:${component.minX},${component.minY},${component.maxX},${component.maxY}:${shapeSha256}`;
}

function exactKeys(value, expected) {
  return JSON.stringify(Object.keys(value || {}).sort()) === JSON.stringify([...expected].sort());
}

export function validateRangedComponentContract(contract, expectedSheetKeys) {
  if (!exactKeys(contract, ['contract', 'sheets', 'version']) || contract.version !== 1 || contract.contract !== 'task9-ranged-detached-components-v1') {
    throw new Error('ranged component contract schema mismatch');
  }
  if (!exactKeys(contract.sheets, expectedSheetKeys)) throw new Error('ranged component contract sheet set mismatch');
  for (const sheetKey of expectedSheetKeys) {
    const sheet = contract.sheets[sheetKey];
    if (!exactKeys(sheet, ['frames']) || !Array.isArray(sheet.frames) || sheet.frames.length !== 6) {
      throw new Error(`${sheetKey} ranged component frame contract mismatch`);
    }
    for (let col = 0; col < 6; col += 1) {
      const fingerprints = sheet.frames[col];
      if (!Array.isArray(fingerprints) || new Set(fingerprints).size !== fingerprints.length) {
        throw new Error(`${sheetKey} ranged component fingerprints are invalid at col ${col}`);
      }
      if (!fingerprints.every((fingerprint) => /^v1:\d+:\d+,\d+,\d+,\d+:[0-9a-f]{64}$/.test(fingerprint))) {
        throw new Error(`${sheetKey} ranged component fingerprint is malformed at col ${col}`);
      }
      const sorted = [...fingerprints].sort();
      if (JSON.stringify(sorted) !== JSON.stringify(fingerprints)) {
        throw new Error(`${sheetKey} ranged component fingerprints are not canonical at col ${col}`);
      }
    }
  }
  return contract;
}

export function loadRangedComponentContract(root, expectedSheetKeys) {
  const contractPath = path.resolve(root, RANGED_COMPONENT_CONTRACT_RELATIVE_PATH);
  const buffer = fs.readFileSync(contractPath);
  const actualSha256 = provenanceSha256(contractPath);
  if (actualSha256 !== RANGED_COMPONENT_CONTRACT_SHA256) throw new Error('ranged component contract SHA-256 mismatch');
  return validateRangedComponentContract(JSON.parse(buffer), expectedSheetKeys);
}

export function analyzeCompanionFrame(image, row, col) {
  const x0 = col * 256;
  const y0 = row * 256;
  const mask = new Uint8Array(256 * 256);
  let opaquePixels = 0;
  let minX = 256;
  let minY = 256;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      if (alphaAt(image, x0 + x, y0 + y) <= ALPHA_THRESHOLD) continue;
      mask[y * 256 + x] = 1;
      opaquePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const components = [];
  const queue = new Int32Array(256 * 256);
  for (let start = 0; start < mask.length; start += 1) {
    if (mask[start] !== 1) continue;
    let head = 0;
    let tail = 0;
    let size = 0;
    const pixelIndices = [];
    let componentMinX = 256;
    let componentMinY = 256;
    let componentMaxX = -1;
    let componentMaxY = -1;
    queue[tail++] = start;
    mask[start] = 2;
    while (head < tail) {
      const index = queue[head++];
      size += 1;
      pixelIndices.push(index);
      const x = index % 256;
      const y = Math.floor(index / 256);
      componentMinX = Math.min(componentMinX, x);
      componentMinY = Math.min(componentMinY, y);
      componentMaxX = Math.max(componentMaxX, x);
      componentMaxY = Math.max(componentMaxY, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= 256 || ny < 0 || ny >= 256) continue;
          const next = ny * 256 + nx;
          if (mask[next] !== 1) continue;
          mask[next] = 2;
          queue[tail++] = next;
        }
      }
    }
    const component = { size, minX: componentMinX, minY: componentMinY, maxX: componentMaxX, maxY: componentMaxY };
    component.fingerprint = componentFingerprint(component, pixelIndices);
    components.push(component);
  }
  components.sort((a, b) => b.size - a.size);
  const majorPixels = components[0]?.size ?? 0;
  const significantThreshold = Math.max(48, Math.ceil(opaquePixels * 0.03));
  const edgeFragmentThreshold = Math.min(1600, Math.max(400, Math.round(majorPixels * 0.12)));
  const edgeFragments = components.slice(1).filter(component => (
    component.size <= edgeFragmentThreshold
    && (component.minX <= 24 || component.minY <= 24 || component.maxX >= 231 || component.maxY >= 231)
  ));
  const detachedComponents = components.slice(1);
  const smallFragments = components.slice(1).filter(component => component.size <= edgeFragmentThreshold);
  return {
    row,
    col,
    opaquePixels,
    majorPixels,
    majorComponentRatio: opaquePixels ? majorPixels / opaquePixels : 0,
    componentCount: components.length,
    componentAreas: components.map(component => component.size),
    componentDetails: components,
    detachedComponents,
    edgeFragments,
    smallFragments,
    significantComponents: components.filter(component => component.size >= significantThreshold).length,
    bbox: maxX < 0 ? null : {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    },
  };
}

export function analyzeCompanionSheet(image, limits = COMPANION_FRAME_QUALITY_LIMITS, context = {}) {
  if (image.width !== 1536 || image.height !== 2048 || !image.pixels) {
    throw new Error('companion quality analysis requires a decoded 1536x2048 RGBA image');
  }
  const frames = [];
  const issues = [];
  const rangedFrameContract = context.rangedContract?.sheets?.[context.sheetKey]?.frames;
  for (let row = 0; row < 8; row += 1) {
    const rowFrames = [];
    for (let col = 0; col < 6; col += 1) rowFrames.push(analyzeCompanionFrame(image, row, col));
    const medianOpaque = median(rowFrames.map(frame => frame.opaquePixels));
    const medianHeight = median(rowFrames.map(frame => frame.bbox?.height ?? 0));
    for (const frame of rowFrames) {
      frame.rowAreaRatio = medianOpaque ? frame.opaquePixels / medianOpaque : 0;
      frame.rowHeightRatio = medianHeight && frame.bbox ? frame.bbox.height / medianHeight : 0;
      const prefix = `row ${row} col ${frame.col}`;
      if (frame.opaquePixels < limits.minOpaquePixels) issues.push(`${prefix}: opaque ${frame.opaquePixels} < ${limits.minOpaquePixels}`);
      if (frame.majorComponentRatio < limits.minMajorComponentRatio) issues.push(`${prefix}: major ratio ${frame.majorComponentRatio.toFixed(3)} < ${limits.minMajorComponentRatio}`);
      const isImpactOrDeath = row >= 6;
      const minAreaRatio = isImpactOrDeath ? limits.minImpactRowAreaRatio : limits.minRowAreaRatio;
      const minHeightRatio = isImpactOrDeath ? limits.minImpactRowHeightRatio : limits.minRowHeightRatio;
      if (frame.rowAreaRatio < minAreaRatio || frame.rowAreaRatio > limits.maxRowAreaRatio) {
        issues.push(`${prefix}: row area ratio ${frame.rowAreaRatio.toFixed(3)} outside ${minAreaRatio}-${limits.maxRowAreaRatio}`);
      }
      if (frame.rowHeightRatio < minHeightRatio) issues.push(`${prefix}: row height ratio ${frame.rowHeightRatio.toFixed(3)} < ${minHeightRatio}`);
      if (frame.bbox && (frame.bbox.minX < limits.minCellPaddingPx || frame.bbox.minY < limits.minCellPaddingPx || frame.bbox.maxX > 255 - limits.minCellPaddingPx || frame.bbox.maxY > 255 - limits.minCellPaddingPx)) {
        issues.push(`${prefix}: foreground touches clipping guard (${limits.minCellPaddingPx}px)`);
      }
      if (frame.significantComponents > limits.maxSignificantComponents) {
        issues.push(`${prefix}: significant components ${frame.significantComponents} > ${limits.maxSignificantComponents}`);
      }
      if (row === 2) {
        if (!Array.isArray(rangedFrameContract?.[frame.col])) {
          issues.push(`${prefix}: ranged detached component contract is missing`);
        } else {
          const actual = frame.detachedComponents.map((component) => component.fingerprint).sort();
          const expected = rangedFrameContract[frame.col];
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            issues.push(`${prefix}: ranged detached component fingerprint mismatch`);
          }
        }
      } else if (frame.edgeFragments.length > 0) {
        issues.push(`${prefix}: ${frame.edgeFragments.length} small disconnected component(s) remain near a cell edge`);
      }
      if (row !== 2 && row !== 3 && frame.smallFragments.length > 0) {
        issues.push(`${prefix}: ${frame.smallFragments.length} small disconnected fragment(s) remain`);
      }
    }
    for (let col = 1; col < rowFrames.length; col += 1) {
      const previous = rowFrames[col - 1].bbox;
      const current = rowFrames[col].bbox;
      if (previous && current && Math.abs(current.centerX - previous.centerX) > limits.maxCenterStepPx) {
        issues.push(`row ${row} cols ${col - 1}-${col}: center step ${Math.abs(current.centerX - previous.centerX).toFixed(1)} > ${limits.maxCenterStepPx}`);
      }
    }
    frames.push(...rowFrames);
  }
  return { frames, issues };
}
