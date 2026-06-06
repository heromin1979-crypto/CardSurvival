// Simple local server — no npm install needed, pure Node.js built-ins
// Usage: node serve.js
//   - 게임:       http://localhost:8080/
//   - 데이터 에디터: http://localhost:8080/tools/editor/
//
// 데이터 에디터용 로컬 API (POST):
//   /api/info   → 현재 git 브랜치 등 정보
//   /api/save   → 수정된 데이터 파일을 로컬 디스크에 기록 (화이트리스트만 허용)
//   /api/push   → git add/commit/push (현재 브랜치)
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');

const PORT = 8080;
const ROOT = __dirname;

// 에디터가 디스크에 쓸 수 있는 파일 화이트리스트 (그 외 경로 기록 거부)
const WRITABLE = new Set([
  'js/data/districts.js',
  'js/data/landmarks.js',
  'js/data/mainQuests.js',
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 8 * 1024 * 1024) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// git 헬퍼 — execFile로 셸 인젝션 회피
function git(args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: ROOT, ...opts }, (err, stdout, stderr) => {
      if (err) { err.stdout = stdout; err.stderr = stderr; reject(err); }
      else resolve({ stdout, stderr });
    });
  });
}

async function handleApi(req, res, urlPath) {
  if (req.method !== 'POST') { sendJSON(res, 405, { error: 'POST only' }); return; }

  if (urlPath === '/api/info') {
    // git이 없어도 읽기/저장은 가능하므로 200으로 응답하고 git 가용 여부만 전달
    try {
      const { stdout } = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
      const branch = stdout.trim();
      const { stdout: st } = await git(['status', '--porcelain']);
      sendJSON(res, 200, { git: true, branch, dirty: st.trim().split('\n').filter(Boolean) });
    } catch (e) {
      const reason = e.code === 'ENOENT'
        ? 'git 실행파일을 찾을 수 없습니다 (PATH 미설정 또는 미설치)'
        : e.message;
      sendJSON(res, 200, { git: false, branch: null, reason });
    }
    return;
  }

  if (urlPath === '/api/save') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: `잘못된 요청: ${e.message}` }); return; }
    const files = Array.isArray(body.files) ? body.files : [];
    const written = [];
    for (const f of files) {
      const rel = String(f.path || '').replace(/\\/g, '/');
      if (!WRITABLE.has(rel)) { sendJSON(res, 403, { error: `쓰기 불가 경로: ${rel}` }); return; }
      const abs = path.join(ROOT, rel);
      if (!abs.startsWith(ROOT)) { sendJSON(res, 403, { error: 'path traversal' }); return; }
      try { fs.writeFileSync(abs, String(f.content), 'utf8'); written.push(rel); }
      catch (e) { sendJSON(res, 500, { error: `기록 실패 ${rel}: ${e.message}` }); return; }
    }
    sendJSON(res, 200, { written });
    return;
  }

  if (urlPath === '/api/push') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: `잘못된 요청: ${e.message}` }); return; }
    const message = String(body.message || 'data: 에디터에서 데이터 수정');
    const paths = (Array.isArray(body.paths) ? body.paths : [...WRITABLE]).filter((p) => WRITABLE.has(p));
    try {
      const { stdout: branchOut } = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
      const branch = branchOut.trim();
      // 데이터 파일 경로에만 한정 — 인덱스에 다른 변경이 있어도 휩쓸지 않음
      await git(['add', '--', ...paths]);
      const { stdout: staged } = await git(['diff', '--cached', '--name-only', '--', ...paths]);
      if (!staged.trim()) { sendJSON(res, 200, { committed: false, pushed: false, message: '변경 사항 없음' }); return; }
      await git(['commit', '-m', message, '--', ...paths]);
      const push = await git(['push', '-u', 'origin', branch]);
      sendJSON(res, 200, { committed: true, pushed: true, branch, output: (push.stderr || push.stdout || '').trim() });
    } catch (e) {
      const msg = e.code === 'ENOENT'
        ? 'git 실행파일을 찾을 수 없습니다. Git 설치 후 PATH에 추가하거나, 파일은 이미 저장됐으니 수동으로 커밋하세요.'
        : `git 실패: ${e.message}`;
      sendJSON(res, 500, { error: msg, detail: (e.stderr || e.stdout || '').trim() });
    }
    return;
  }

  sendJSON(res, 404, { error: 'unknown api' });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  if (urlPath.startsWith('/api/')) { handleApi(req, res, urlPath); return; }

  if (urlPath === '/') urlPath = '/index.html';
  // 디렉터리 URL(끝이 '/')은 해당 폴더의 index.html로 연결
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(ROOT, urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Card Survival: Ruined City`);
  console.log(`  ──────────────────────────`);
  console.log(`  Game:   http://localhost:${PORT}/`);
  console.log(`  Editor: http://localhost:${PORT}/tools/editor/`);
  console.log(`  Ctrl+C to stop\n`);

  // Auto-open browser (Windows)
  exec(`start http://localhost:${PORT}/tools/editor/`);
});
