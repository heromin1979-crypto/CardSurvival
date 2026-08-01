const CANONICAL_ROOT = '/assets/images/combat/spritesheets/enemies';

export function canonicalBossMotionPath(bossId) {
  return `${CANONICAL_ROOT}/${bossId}_sheet.png`;
}

export function validateBossMotionSourceBindings({
  manifest,
  spriteKeys,
  bossIds,
  recipeTargets,
}) {
  const errors = [];
  const manifestSources = new Map();
  const recipePaths = new Map();

  if (!Array.isArray(bossIds) || bossIds.length !== 21 || new Set(bossIds).size !== 21) {
    errors.push(`boss roster must contain exactly 21 unique IDs, got ${bossIds?.length ?? 0}`);
  }

  for (const bossId of bossIds || []) {
    const sheetKey = spriteKeys?.[bossId];
    const sheet = manifest?.[sheetKey];
    const expected = canonicalBossMotionPath(bossId);
    const actual = sheet?.src;
    const recipePath = recipeTargets?.[bossId]?.path;

    if (sheetKey !== bossId) errors.push(`${bossId} sprite key must equal its boss ID`);
    if (actual !== expected) errors.push(`${bossId} manifest src must be ${expected}, got ${actual}`);
    if (recipePath !== expected) errors.push(`${bossId} recipe target must be ${expected}, got ${recipePath}`);
    if (recipePath !== actual) errors.push(`${bossId} manifest/recipe path mismatch`);

    if (typeof actual === 'string') {
      const owner = manifestSources.get(actual);
      if (owner) errors.push(`${bossId} duplicate manifest src shared with ${owner}: ${actual}`);
      else manifestSources.set(actual, bossId);
    }
    if (typeof recipePath === 'string') {
      const owner = recipePaths.get(recipePath);
      if (owner) errors.push(`${bossId} duplicate recipe target shared with ${owner}: ${recipePath}`);
      else recipePaths.set(recipePath, bossId);
    }
  }

  return errors;
}

const MOTION_ROWS = Object.freeze(['idle', 'basic_a', 'basic_b', 'special', 'ultimate', 'hit', 'charge', 'death']);

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

export function validateBossFrameContinuity(recipeTargets) {
  const errors = [];
  for (const [bossId, target] of Object.entries(recipeTargets ?? {})) {
    const frames = target?.quality?.frames;
    if (!Array.isArray(frames) || frames.length !== 48) {
      errors.push(`${bossId} must contain 48 quality frames`);
      continue;
    }
    for (let row = 0; row < MOTION_ROWS.length; row += 1) {
      const rowFrames = frames.filter(frame => frame.row === row).sort((left, right) => left.col - right.col);
      if (rowFrames.length !== 6) {
        errors.push(`${bossId}:${MOTION_ROWS[row]} must contain six frames`);
        continue;
      }
      const primary = rowFrames.map(frame => frame.components?.[0]).filter(Boolean);
      if (primary.length !== 6) {
        errors.push(`${bossId}:${MOTION_ROWS[row]} has a missing primary body`);
        continue;
      }
      const widths = primary.map(component => component.bbox[2] - component.bbox[0]);
      const heights = primary.map(component => component.bbox[3] - component.bbox[1]);
      const areas = primary.map(component => component.area);
      const reference = { width: median(widths), height: median(heights), area: median(areas) };
      rowFrames.forEach((frame, col) => {
        const [left, top, right, bottom] = frame.bbox;
        if (left <= 0 || top <= 0 || right >= 256 || bottom >= 256) {
          errors.push(`${bossId}:${MOTION_ROWS[row]}:${col} touches a frame edge`);
        }
        const width = widths[col];
        const height = heights[col];
        const areaRatio = row === 7 ? 0.25 : 0.40;
        if (areas[col] < reference.area * areaRatio) {
          errors.push(`${bossId}:${MOTION_ROWS[row]}:${col} primary body area discontinuity`);
        }
        const bboxDiscontinuous = row === 7
          ? ((width < reference.width * 0.35 && height < reference.height * 0.35)
            || width * height < reference.width * reference.height * 0.25)
          : width < reference.width * 0.35 || height < reference.height * 0.35;
        if (bboxDiscontinuous) {
          errors.push(`${bossId}:${MOTION_ROWS[row]}:${col} primary body bbox discontinuity`);
        }
      });
    }
  }
  return errors;
}
