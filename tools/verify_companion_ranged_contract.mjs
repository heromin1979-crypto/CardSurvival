import path from 'node:path';

import { readPng } from './audit_combat_sprites.mjs';
import {
  analyzeCompanionSheet,
  loadRangedComponentContract,
} from './companion_motion_quality.mjs';

const argument = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const root = path.resolve(argument('root') || process.cwd());
const allowedRoot = path.resolve(argument('allowed-root') || root);
const sheetKey = argument('sheet');
const filePath = path.resolve(argument('file') || '');
const expectedSheetKeys = (argument('expected') || '').split(',').filter(Boolean);

if (!sheetKey || !filePath || expectedSheetKeys.length !== 20) {
  throw new Error('ranged contract verifier requires --sheet, --file and 20 --expected keys');
}

const relative = path.relative(allowedRoot, filePath);
if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
  throw new Error('ranged contract verifier file escapes root');
}

const rangedContract = loadRangedComponentContract(root, expectedSheetKeys);
const analysis = analyzeCompanionSheet(readPng(filePath), undefined, { sheetKey, rangedContract });
if (analysis.issues.length > 0) {
  throw new Error(`${sheetKey} quality contract failed: ${analysis.issues.join('; ')}`);
}

console.log(JSON.stringify({ sheetKey, cells: analysis.frames.length, rangedContract: 'PASS' }));
