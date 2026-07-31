import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMBAT_MOTION_MANIFEST } from '../js/data/combatMotionManifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = path.join(ROOT, 'assets', 'images', 'combat', 'spritesheets', 'manifest.json');
const expectedText = `${JSON.stringify(COMBAT_MOTION_MANIFEST, null, 2)}\n`;

function readCurrentManifest() {
  if (!fs.existsSync(OUTPUT_PATH)) return { text: null, parsed: null, parseError: null };

  const text = fs.readFileSync(OUTPUT_PATH, 'utf8');
  try {
    return { text, parsed: JSON.parse(text), parseError: null };
  } catch (error) {
    return { text, parsed: null, parseError: error };
  }
}

function checkManifest() {
  const current = readCurrentManifest();
  if (current.parseError) {
    console.error(`combat motion manifest JSON is invalid: ${current.parseError.message}`);
    process.exitCode = 1;
    return;
  }
  if (JSON.stringify(current.parsed) !== JSON.stringify(COMBAT_MOTION_MANIFEST)) {
    console.error('combat motion manifest semantic drift detected; run the exporter to regenerate it.');
    process.exitCode = 1;
    return;
  }
  if (current.text !== expectedText) {
    console.error('combat motion manifest byte drift detected; run the exporter to normalize it.');
    process.exitCode = 1;
    return;
  }
  console.log('combat motion manifest is up to date');
}

function exportManifest() {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, expectedText, 'utf8');
  console.log(path.relative(ROOT, OUTPUT_PATH).replaceAll(path.sep, '/'));
}

if (process.argv.includes('--check')) checkManifest();
else exportManifest();
