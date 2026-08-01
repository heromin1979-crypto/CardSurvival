import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const PROVENANCE_HASH_SCHEME = 'combat-provenance-sha256-v2';

const TEXT_EXTENSIONS = new Set([
  '.bat', '.css', '.html', '.js', '.md', '.mjs', '.ps1', '.py', '.sh', '.txt',
]);

function canonicalJsonValue(value) {
  if (Array.isArray(value)) return value.map(canonicalJsonValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalJsonValue(value[key])]));
  }
  return value;
}

export function canonicalJsonBytes(value) {
  return Buffer.from(JSON.stringify(canonicalJsonValue(value)), 'utf8');
}

export function canonicalTextBytes(value) {
  return Buffer.from(value.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').replaceAll('\r', '\n'), 'utf8');
}

export function provenanceBytes(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.json') {
    return canonicalJsonBytes(JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')));
  }
  if (TEXT_EXTENSIONS.has(extension)) return canonicalTextBytes(fs.readFileSync(filePath, 'utf8'));
  return fs.readFileSync(filePath);
}

export function provenanceSha256(filePath) {
  return createHash('sha256').update(provenanceBytes(filePath)).digest('hex');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const filePath = process.argv[2];
  if (!filePath) throw new Error('usage: node provenance_hash.mjs <file>');
  process.stdout.write(provenanceSha256(path.resolve(filePath)) + '\n');
}
