// === DATA EDITOR — JS object-literal (de)serializer ===
// Surgically reads/replaces a single object-literal block inside a JS module
// source file, leaving imports, comments outside the block, functions and
// exports intact. Used by both the browser editor and the Node round-trip test.
//
// Design note: data modules (districts/landmarks/mainQuests) are hand-curated
// and contain inline comments INSIDE the data block. Those inline comments are
// intentionally NOT preserved — the block is regenerated from the parsed value.
// Everything OUTSIDE the block (file header, helper functions, exports) is kept
// byte-for-byte. `node js/data/validate.js` + git diff are the safety net.

/**
 * Scan from `declString` and return the [start, end] character range of the
 * object literal `{ ... }` that follows the `=`. Brace matching skips over
 * string literals (', ", `) and comments (// and block comments) so that any
 * braces appearing inside data strings do not throw off the match.
 *
 * @param {string} text   full file source
 * @param {string} declString  e.g. "const DISTRICTS = {" or "export const LANDMARK_DATA = {"
 * @returns {{open:number, close:number}}  open = index of '{', close = index of matching '}'
 */
export function findObjectLiteralRange(text, declString) {
  const declIdx = text.indexOf(declString);
  if (declIdx === -1) throw new Error(`declaration not found: ${declString}`);
  // The '{' is the last char of declString (callers pass the trailing brace).
  const open = declIdx + declString.length - 1;
  if (text[open] !== '{') throw new Error(`declString must end with '{': ${declString}`);

  let depth = 0;
  let i = open;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    // string literals
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(text, i, c);
      continue;
    }
    // comments
    if (c === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i);
      if (i === -1) i = n;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return { open, close: i };
    }
    i++;
  }
  throw new Error(`unbalanced braces for: ${declString}`);
}

// Returns index just past the closing quote.
function skipString(text, i, quote) {
  i++; // past opening quote
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '\\') { i += 2; continue; }
    if (c === quote) return i + 1;
    if (quote === '`' && c === '$' && text[i + 1] === '{') {
      // template expression — match nested braces
      i += 2;
      let depth = 1;
      while (i < n && depth > 0) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        i++;
      }
      continue;
    }
    i++;
  }
  return n;
}

/**
 * Parse an object-literal source string into a live JS value.
 * Uses Function() so JS values like Infinity / NaN evaluate correctly
 * (JSON.parse cannot handle them). Input is trusted project source.
 */
export function parseLiteral(literalText) {
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literalText});`)();
}

/** Extract & parse the object literal for a declaration in one step. */
export function extractValue(text, declString) {
  const { open, close } = findObjectLiteralRange(text, declString);
  return parseLiteral(text.slice(open, close + 1));
}

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function serializeKey(key) {
  return IDENT_RE.test(key) ? key : JSON.stringify(key);
}

function serializeString(str) {
  // Prefer single quotes (codebase style); escape as needed.
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `'${escaped}'`;
}

/**
 * Serialize a JS value to source matching codebase style:
 * 2-space indent, single-quoted strings, unquoted identifier keys.
 * Handles Infinity / -Infinity / NaN, null, numbers, booleans, arrays, objects.
 */
export function serializeValue(value, indentLevel = 0) {
  const pad = '  '.repeat(indentLevel);
  const padInner = '  '.repeat(indentLevel + 1);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const t = typeof value;
  if (t === 'number') {
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    if (Number.isNaN(value)) return 'NaN';
    return String(value);
  }
  if (t === 'boolean') return String(value);
  if (t === 'string') return serializeString(value);
  if (t === 'function') throw new Error('cannot serialize function values');

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => padInner + serializeValue(v, indentLevel + 1));
    return `[\n${items.join(',\n')},\n${pad}]`;
  }

  // plain object
  const keys = Object.keys(value);
  if (keys.length === 0) return '{}';
  const entries = keys.map(
    (k) => `${padInner}${serializeKey(k)}: ${serializeValue(value[k], indentLevel + 1)}`,
  );
  return `{\n${entries.join(',\n')},\n${pad}}`;
}

/**
 * Replace the object literal for `declString` in `fileText` with a freshly
 * serialized version of `value`. Returns the new full file source.
 */
export function spliceObjectLiteral(fileText, declString, value) {
  const { open, close } = findObjectLiteralRange(fileText, declString);
  const literal = serializeValue(value, 0);
  return fileText.slice(0, open) + literal + fileText.slice(close + 1);
}

/** Per-file declaration markers for the editable data blocks. */
export const DATA_FILES = {
  districts: {
    path: 'js/data/districts.js',
    decl: 'const DISTRICTS = {',
    label: '장소 (구별 lootTable)',
  },
  landmarks: {
    path: 'js/data/landmarks.js',
    decl: 'export const LANDMARK_DATA = {',
    label: '랜드마크 (세부장소 lootTable)',
  },
  quests: {
    path: 'js/data/mainQuests.js',
    decl: 'const MAIN_QUESTS = {',
    label: '메인 퀘스트',
  },
};
