// District Loot Editor — local server
// Zero-dependency Node HTTP server that auto-loads js/data/* and saves edits back.
// Run via: node tools/loot-editor-server.mjs
//   or:    tools/loot-editor.bat / .sh
// Opens http://localhost:PORT in the default browser.

import { createServer } from 'node:http';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const PORT = parseInt(process.env.LOOT_EDITOR_PORT || '7321', 10);
const HOST = '127.0.0.1';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

function findProjectRoot(startDir) {
  let cur = resolve(startDir);
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(cur, 'js', 'data', 'districts.js'))) return cur;
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

const ROOT = findProjectRoot(SCRIPT_DIR) || findProjectRoot(process.cwd());
if (!ROOT) {
  console.error('[loot-editor] ERROR: js/data/districts.js를 찾을 수 없습니다.');
  console.error('  탐색 시작점: ' + SCRIPT_DIR);
  console.error('  카드 서바이벌 프로젝트 루트 또는 그 하위에서 실행하세요.');
  process.exit(1);
}
const DATA_DIR = join(ROOT, 'js', 'data');
console.log(`[loot-editor] project root: ${ROOT}`);
console.log(`[loot-editor] data dir:     ${DATA_DIR}`);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

async function readJsonBody(req, limit = 10 * 1024 * 1024) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let len = 0;
    req.on('data', (c) => {
      len += c.length;
      if (len > limit) {
        rejectBody(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { rejectBody(e); }
    });
    req.on('error', rejectBody);
  });
}

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

async function serveStatic(req, res, urlPath) {
  let rel = urlPath.replace(/^\/+/, '');
  if (rel === '' || rel === 'index.html') rel = 'loot-editor.html';
  const safe = rel.replace(/\\/g, '/');
  if (safe.includes('..')) { sendText(res, 400, 'bad path'); return; }
  const full = join(SCRIPT_DIR, safe);
  if (!full.startsWith(SCRIPT_DIR)) { sendText(res, 400, 'bad path'); return; }
  try {
    const st = await stat(full);
    if (!st.isFile()) { sendText(res, 404, 'not found'); return; }
    const buf = await readFile(full);
    res.writeHead(200, {
      'Content-Type': MIME[extname(full).toLowerCase()] || 'application/octet-stream',
      'Content-Length': buf.length,
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  } catch {
    sendText(res, 404, 'not found');
  }
}

async function handleGetData(_req, res) {
  try {
    const districtsText = await readFile(join(DATA_DIR, 'districts.js'), 'utf8');
    const itemTexts = {};
    const files = await readdir(DATA_DIR);
    for (const name of files) {
      if (/^items_.+\.js$/.test(name)) {
        itemTexts[name] = await readFile(join(DATA_DIR, name), 'utf8');
      }
    }
    let gameBalanceText = null;
    try { gameBalanceText = await readFile(join(DATA_DIR, 'gameBalance.js'), 'utf8'); }
    catch { /* optional */ }
    sendJson(res, 200, { districtsText, itemTexts, gameBalanceText, dataDir: DATA_DIR });
  } catch (err) {
    sendJson(res, 500, { error: String(err.message || err) });
  }
}

async function handleSave(req, res) {
  try {
    const body = await readJsonBody(req);
    if (!body || typeof body.districtsText !== 'string') {
      sendJson(res, 400, { error: 'districtsText (string) required' });
      return;
    }
    const target = join(DATA_DIR, 'districts.js');
    const tmp = target + '.tmp';
    await writeFile(tmp, body.districtsText, 'utf8');
    // atomic-ish replace
    const { rename } = await import('node:fs/promises');
    await rename(tmp, target);
    console.log(`[loot-editor] saved: ${target} (${body.districtsText.length} bytes)`);
    sendJson(res, 200, { ok: true, bytes: body.districtsText.length });
  } catch (err) {
    console.error('[loot-editor] save failed:', err);
    sendJson(res, 500, { error: String(err.message || err) });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/data') {
      await handleGetData(req, res); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/save') {
      await handleSave(req, res); return;
    }
    if (req.method === 'GET' && url.pathname === '/api/ping') {
      sendJson(res, 200, { ok: true, root: ROOT, dataDir: DATA_DIR });
      return;
    }
    if (req.method === 'GET') {
      await serveStatic(req, res, url.pathname); return;
    }
    sendText(res, 405, 'method not allowed');
  } catch (err) {
    console.error('[loot-editor] unhandled:', err);
    sendText(res, 500, String(err.message || err));
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`[loot-editor] listening at ${url}`);
  console.log('[loot-editor] 종료: Ctrl+C');
  openBrowser(url);
});

function openBrowser(url) {
  if (process.env.LOOT_EDITOR_NO_OPEN) return;
  const cmd = process.platform === 'win32'
    ? `cmd /c start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.warn('[loot-editor] 브라우저 자동 오픈 실패 — 수동으로 ' + url + ' 열어주세요.');
  });
}

process.on('SIGINT', () => {
  console.log('\n[loot-editor] 종료 중...');
  server.close(() => process.exit(0));
});
