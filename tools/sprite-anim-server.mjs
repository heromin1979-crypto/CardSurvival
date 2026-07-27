// Sprite Animation Editor — local server
// Zero-dependency Node HTTP server. Serves the editor, lists combat spritesheets,
// and saves aligned sheets back to assets/images/combat/spritesheets/.
// Run via: node tools/sprite-anim-server.mjs
//   or:    tools/sprite-anim-editor.sh / .bat
// Opens http://localhost:PORT in the default browser.

import { createServer } from 'node:http';
import { readFile, writeFile, readdir, stat, copyFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, extname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const PORT = parseInt(process.env.SPRITE_ANIM_PORT || '7333', 10);
const HOST = '127.0.0.1';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

function findProjectRoot(startDir) {
  let cur = resolve(startDir);
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(cur, 'assets', 'images', 'combat', 'spritesheets'))) return cur;
    if (existsSync(join(cur, 'js', 'data', 'districts.js'))) return cur;
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

const ROOT = findProjectRoot(SCRIPT_DIR) || findProjectRoot(process.cwd());
if (!ROOT) {
  console.error('[sprite-anim] ERROR: assets/images/combat/spritesheets 를 찾을 수 없습니다.');
  console.error('  탐색 시작점: ' + SCRIPT_DIR);
  process.exit(1);
}
const SHEET_DIR = join(ROOT, 'assets', 'images', 'combat', 'spritesheets');
console.log(`[sprite-anim] project root: ${ROOT}`);
console.log(`[sprite-anim] sheet dir:    ${SHEET_DIR}`);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

async function readJsonBody(req, limit = 40 * 1024 * 1024) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let len = 0;
    req.on('data', (c) => {
      len += c.length;
      if (len > limit) { rejectBody(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { rejectBody(e); }
    });
    req.on('error', rejectBody);
  });
}

// Recursively walk a directory, returning files relative to ROOT (posix paths).
async function walkPng(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...await walkPng(full));
    } else if (e.isFile() && extname(e.name).toLowerCase() === '.png') {
      out.push(full);
    }
  }
  return out;
}

async function handleListSheets(_req, res) {
  try {
    const files = await walkPng(SHEET_DIR);
    const items = [];
    for (const full of files) {
      const rel = relative(ROOT, full).split('\\').join('/');
      const name = basename(full);
      const isSrc = /_src\.png$/i.test(name);
      const baseName = name.replace(/_src\.png$/i, '.png');
      const st = await stat(full);
      items.push({
        path: '/' + rel,                 // url-servable, e.g. /assets/images/combat/spritesheets/...
        name,
        baseName,                        // the in-game sheet name (src counterpart)
        isSrc,
        bytes: st.size,
      });
    }
    items.sort((a, b) => a.path.localeCompare(b.path));
    sendJson(res, 200, { ok: true, sheets: items, root: ROOT });
  } catch (err) {
    sendJson(res, 500, { error: String(err.message || err) });
  }
}

// Resolve & validate a save target path. Must live under SHEET_DIR.
function resolveSheetTarget(relPath) {
  const clean = String(relPath || '').replace(/^\/+/, '').split('\\').join('/');
  if (clean.includes('..')) return null;
  const full = resolve(ROOT, clean);
  if (!full.startsWith(SHEET_DIR)) return null;
  if (extname(full).toLowerCase() !== '.png') return null;
  return full;
}

async function handleSaveSheet(req, res) {
  try {
    const body = await readJsonBody(req);
    const target = resolveSheetTarget(body?.path);
    if (!target) { sendJson(res, 400, { error: 'path must be a .png under assets/images/combat/spritesheets/' }); return; }
    const dataUrl = String(body?.dataUrl || '');
    const m = dataUrl.match(/^data:image\/png;base64,(.+)$/);
    if (!m) { sendJson(res, 400, { error: 'dataUrl (data:image/png;base64,...) required' }); return; }
    const buf = Buffer.from(m[1], 'base64');

    // Safety: preserve the original as *_src.png the first time we overwrite a non-src sheet.
    if (!/_src\.png$/i.test(target) && existsSync(target)) {
      const srcSibling = target.replace(/\.png$/i, '_src.png');
      if (!existsSync(srcSibling)) {
        try { await copyFile(target, srcSibling); console.log(`[sprite-anim] backup → ${basename(srcSibling)}`); }
        catch (e) { console.warn('[sprite-anim] backup failed:', e.message); }
      }
    }

    const tmp = target + '.tmp';
    await writeFile(tmp, buf);
    await rename(tmp, target);
    console.log(`[sprite-anim] saved: ${relative(ROOT, target)} (${buf.length} bytes)`);

    // Merge frame-count metadata into the manifest the game reads (keyed by in-game basename).
    let manifestPath = null;
    if (body?.meta && Number(body.meta.cols) > 0) {
      manifestPath = join(SHEET_DIR, 'manifest.json');
      let manifest = {};
      try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* new manifest */ }
      const name = basename(target).replace(/_src\.png$/i, '.png');
      manifest[name] = {
        cols: Number(body.meta.cols),
        rows: Number(body.meta.rows) || 4,
        ...(Array.isArray(body.meta.rowFrames) ? { rowFrames: body.meta.rowFrames } : {}),
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`[sprite-anim] manifest: ${name} → cols ${manifest[name].cols}`);
    }
    sendJson(res, 200, { ok: true, bytes: buf.length, path: '/' + relative(ROOT, target).split('\\').join('/'), manifest: manifestPath ? true : false });
  } catch (err) {
    console.error('[sprite-anim] save failed:', err);
    sendJson(res, 500, { error: String(err.message || err) });
  }
}

async function handleReveal(req, res) {
  try {
    const body = await readJsonBody(req);
    const clean = String(body?.path || '').replace(/^\/+/, '').split('\\').join('/');
    if (clean.includes('..')) { sendJson(res, 400, { error: 'bad path' }); return; }
    const abs = resolve(ROOT, clean);
    if (!abs.startsWith(ROOT) || !existsSync(abs)) { sendJson(res, 404, { error: '파일 없음' }); return; }
    const cmd = process.platform === 'darwin' ? `open -R "${abs}"`
      : process.platform === 'win32' ? `explorer /select,"${abs}"` : `xdg-open "${dirname(abs)}"`;
    exec(cmd, () => { /* best-effort */ });
    sendJson(res, 200, { ok: true });
  } catch (err) { sendJson(res, 500, { error: String(err.message || err) }); }
}

async function serveFile(res, full, type) {
  try {
    const st = await stat(full);
    if (!st.isFile()) { sendText(res, 404, 'not found'); return; }
    const buf = await readFile(full);
    res.writeHead(200, {
      'Content-Type': type || MIME[extname(full).toLowerCase()] || 'application/octet-stream',
      'Content-Length': buf.length,
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  } catch {
    sendText(res, 404, 'not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = decodeURIComponent(url.pathname);
  try {
    if (req.method === 'GET' && p === '/api/ping') {
      sendJson(res, 200, { ok: true, root: ROOT, sheetDir: SHEET_DIR }); return;
    }
    if (req.method === 'GET' && p === '/api/sheets') { await handleListSheets(req, res); return; }
    if (req.method === 'POST' && p === '/api/save-sheet') { await handleSaveSheet(req, res); return; }
    if (req.method === 'POST' && p === '/api/reveal') { await handleReveal(req, res); return; }

    if (req.method === 'GET') {
      if (p === '/' || p === '/index.html') {
        await serveFile(res, join(SCRIPT_DIR, 'sprite-anim-editor.html')); return;
      }
      // Project assets (images) served from ROOT.
      if (p.startsWith('/assets/')) {
        const full = resolve(ROOT, '.' + p);
        if (!full.startsWith(ROOT)) { sendText(res, 400, 'bad path'); return; }
        await serveFile(res, full); return;
      }
      // Tool files served from SCRIPT_DIR.
      const safe = p.replace(/^\/+/, '').split('\\').join('/');
      if (safe.includes('..')) { sendText(res, 400, 'bad path'); return; }
      await serveFile(res, join(SCRIPT_DIR, safe)); return;
    }
    sendText(res, 405, 'method not allowed');
  } catch (err) {
    console.error('[sprite-anim] unhandled:', err);
    sendText(res, 500, String(err.message || err));
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`[sprite-anim] listening at ${url}`);
  console.log('[sprite-anim] 종료: Ctrl+C');
  openBrowser(url);
});

function openBrowser(url) {
  if (process.env.SPRITE_ANIM_NO_OPEN) return;
  const cmd = process.platform === 'win32'
    ? `cmd /c start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.warn('[sprite-anim] 브라우저 자동 오픈 실패 — 수동으로 ' + url + ' 열어주세요.');
  });
}

process.on('SIGINT', () => {
  console.log('\n[sprite-anim] 종료 중...');
  server.close(() => process.exit(0));
});
