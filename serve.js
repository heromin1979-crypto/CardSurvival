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
  'js/data/gameBalance.js',
  'js/data/districts.js',
  'js/data/landmarks.js',
  'js/data/hiddenLocations.js',
  // 메인 퀘스트 — 게임 실사용 소스(mainQuests/index.js가 병합하는 19파일)
  'js/data/mainQuests/global.js',
  'js/data/mainQuests/doctor/shared.js',
  'js/data/mainQuests/doctor/branch_a.js',
  'js/data/mainQuests/doctor/branch_b.js',
  'js/data/mainQuests/soldier/shared.js',
  'js/data/mainQuests/soldier/branch_a.js',
  'js/data/mainQuests/soldier/branch_b.js',
  'js/data/mainQuests/firefighter/shared.js',
  'js/data/mainQuests/firefighter/branch_a.js',
  'js/data/mainQuests/firefighter/branch_b.js',
  'js/data/mainQuests/homeless/shared.js',
  'js/data/mainQuests/homeless/branch_a.js',
  'js/data/mainQuests/homeless/branch_b.js',
  'js/data/mainQuests/chef/shared.js',
  'js/data/mainQuests/chef/branch_a.js',
  'js/data/mainQuests/chef/branch_b.js',
  'js/data/mainQuests/engineer/shared.js',
  'js/data/mainQuests/engineer/branch_a.js',
  'js/data/mainQuests/engineer/branch_b.js',
  'js/data/locationCardMeta.js',
  'js/data/items_base.js',
  'js/data/items_combat.js',
  'js/data/items_misc.js',
  'js/data/items_tech.js',
  'js/data/items_medical.js',
  'js/data/items_tools.js',
  'js/data/items_structures.js',
  'js/data/legendaryItems.js',
  'js/data/items_environment.js',
  // UI 인스펙터 레이아웃 오버라이드 (게임 내 편집 → 디스크 기록 → 커밋)
  'css/ui-overrides.css',
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
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.m4a':  'audio/mp4',
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

// node 스크립트 실행 헬퍼 (시뮬 baseline 측정용)
function runNode(args) {
  return new Promise((resolve, reject) => {
    execFile('node', args, { cwd: ROOT, timeout: 180000, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) { err.stdout = stdout; err.stderr = stderr; reject(err); }
      else resolve({ stdout, stderr });
    });
  });
}

async function handleApi(req, res, urlPath) {
  // 읽기 전용 GET 라우트 (시뮬 결과 뷰어용)
  if (req.method === 'GET') {
    if (urlPath === '/api/sim/strategies') {
      // 전략 비교 — compareStrategies.mjs 실행
      const q = new URLSearchParams(req.url.split('?')[1] || '');
      const char = (q.get('char') || '').trim();
      const runs = String(Math.max(1, Math.min(100, Number.parseInt(q.get('runs') || '25', 10) || 25)));
      if (!/^[a-z_]+$/i.test(char)) { sendJSON(res, 400, { error: '잘못된 char 값' }); return; }
      try {
        const { stdout } = await runNode(['tools/sim/v2/compareStrategies.mjs', '--char', char, '--runs', runs]);
        let data; try { data = JSON.parse(stdout); } catch (e) { sendJSON(res, 500, { error: '전략 비교 파싱 실패', detail: (stdout || '').slice(0, 500) }); return; }
        sendJSON(res, 200, data);
      } catch (e) {
        sendJSON(res, 500, { error: '전략 비교 실행 실패: ' + e.message, detail: (e.stderr || '').slice(-1000) });
      }
      return;
    }
    if (urlPath === '/api/sim/runs') {
      // 시드별 생존 결과 목록 — listRuns.mjs 실행
      const q = new URLSearchParams(req.url.split('?')[1] || '');
      const char = (q.get('char') || '').trim();
      const runs = String(Math.max(1, Math.min(100, Number.parseInt(q.get('runs') || '25', 10) || 25)));
      const strat = (q.get('strategy') || '').trim();
      if (!/^[a-z_]+$/i.test(char)) { sendJSON(res, 400, { error: '잘못된 char 값' }); return; }
      const a = ['tools/sim/v2/listRuns.mjs', '--char', char, '--runs', runs];
      if (/^[a-z_]+$/i.test(strat)) a.push('--strategy', strat);
      try {
        const { stdout } = await runNode(a);
        let data; try { data = JSON.parse(stdout); } catch (e) { sendJSON(res, 500, { error: '런 목록 파싱 실패', detail: (stdout || '').slice(0, 500) }); return; }
        sendJSON(res, 200, data);
      } catch (e) {
        sendJSON(res, 500, { error: '런 목록 실행 실패: ' + e.message, detail: (e.stderr || '').slice(-1000) });
      }
      return;
    }
    if (urlPath === '/api/sim/trace') {
      // 단일 런 행동 타임라인 추적 — trace.mjs를 새 node 프로세스로 실행
      const q = new URLSearchParams(req.url.split('?')[1] || '');
      const char = (q.get('char') || '').trim();
      const seed = String(Number.parseInt(q.get('seed') || '0', 10) || 0);
      const strat = (q.get('strategy') || '').trim();
      if (!/^[a-z_]+$/i.test(char)) { sendJSON(res, 400, { error: '잘못된 char 값' }); return; }
      const traceArgs = ['tools/sim/v2/trace.mjs', '--char', char, '--seed', seed];
      if (/^[a-z_]+$/i.test(strat)) traceArgs.push('--strategy', strat);
      try {
        const { stdout } = await runNode(traceArgs);
        let data;
        try { data = JSON.parse(stdout); }
        catch (e) { sendJSON(res, 500, { error: 'trace 출력 파싱 실패', detail: (stdout || '').slice(0, 500) }); return; }
        sendJSON(res, 200, data);
      } catch (e) {
        sendJSON(res, 500, { error: 'trace 실행 실패: ' + e.message, detail: (e.stderr || '').slice(-1000) });
      }
      return;
    }
    if (urlPath === '/api/sim/list') {
      const dir = path.join(ROOT, 'simulation-data', 'baselines', 'raw');
      const re = /^BAL_SIM_baseline_v(\d+)_result\.json$/;
      let baselines = [];
      try {
        baselines = fs.readdirSync(dir)
          .map((f) => { const m = re.exec(f); return m ? { file: f, version: Number(m[1]), path: `simulation-data/baselines/raw/${f}` } : null; })
          .filter(Boolean)
          .sort((a, b) => b.version - a.version);
      } catch (e) { /* 디렉터리 없으면 빈 목록 */ }
      sendJSON(res, 200, { baselines });
      return;
    }
    sendJSON(res, 404, { error: 'unknown api' });
    return;
  }
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

  if (urlPath === '/api/sim/run') {
    // run_baseline.mjs를 새 node 프로세스로 실행 → 현재 디스크의 데이터로 재측정
    // 매 실행마다 다음 버전(기존 최대 +1)으로 저장해 이력을 보존한다.
    try {
      const t0 = Date.now();
      const rawDir = path.join(ROOT, 'simulation-data', 'baselines', 'raw');
      const re = /^BAL_SIM_baseline_v(\d+)_result\.json$/;
      let maxV = 0;
      try {
        for (const f of fs.readdirSync(rawDir)) {
          const m = re.exec(f);
          if (m) maxV = Math.max(maxV, Number(m[1]));
        }
      } catch (e) { /* 디렉터리 없으면 v1부터 */ }
      const nextV = maxV + 1;
      const outRel = `simulation-data/baselines/raw/BAL_SIM_baseline_v${nextV}_result.json`;
      const { stdout, stderr } = await runNode(['tools/sim/v2/run_baseline.mjs', '--out', outRel]);
      sendJSON(res, 200, {
        ok: true,
        file: outRel,
        version: nextV,
        durationMs: Date.now() - t0,
        output: (stdout || '').slice(-4000),
        stderr: (stderr || '').slice(-1000),
      });
    } catch (e) {
      const detail = (e.stderr || e.stdout || e.message || '').slice(-4000);
      const msg = e.code === 'ENOENT'
        ? 'node 실행파일을 찾을 수 없습니다 (PATH 미설정).'
        : (e.killed ? '측정이 시간 초과로 중단됐습니다 (180초).' : `측정 실패: ${e.message}`);
      sendJSON(res, 500, { ok: false, error: msg, detail });
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
    const bodyText = typeof body.body === 'string' ? body.body.trim() : '';
    const paths = (Array.isArray(body.paths) ? body.paths : [...WRITABLE]).filter((p) => WRITABLE.has(p));
    try {
      const { stdout: branchOut } = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
      const branch = branchOut.trim();
      // 데이터 파일 경로에만 한정 — 인덱스에 다른 변경이 있어도 휩쓸지 않음
      let committed = false;
      if (paths.length) {
        await git(['add', '--', ...paths]);
        const { stdout: staged } = await git(['diff', '--cached', '--name-only', '--', ...paths]);
        if (staged.trim()) {
          // 제목(-m message) + 본문(-m bodyText: 변경 요약) → 커밋 로그에 정리된 내역 기록
          const commitArgs = ['commit', '-m', message];
          if (bodyText) commitArgs.push('-m', bodyText);
          commitArgs.push('--', ...paths);
          await git(commitArgs);
          committed = true;
        }
      }
      // 새 커밋이 없어도 항상 push — 이전에 밀려있던 로컬 커밋까지 내보낸다
      const push = await git(['push', '-u', 'origin', branch]);
      const output = (push.stderr || push.stdout || '').trim();
      const upToDate = /up to date|up-to-date/i.test(output);
      sendJSON(res, 200, {
        committed,
        pushed: !upToDate,
        upToDate,
        branch,
        output,
      });
    } catch (e) {
      const detail = (e.stderr || e.stdout || e.message || '').trim();
      let msg;
      if (e.code === 'ENOENT') {
        msg = 'git 실행파일을 찾을 수 없습니다. Git 설치 후 PATH에 추가하거나, 파일은 이미 저장됐으니 수동으로 커밋하세요.';
      } else if (/403|permission to .* denied|access denied/i.test(detail)) {
        const who = (/denied to (\S+)/i.exec(detail) || [])[1];
        msg = `푸시 권한 거부(403)${who ? ` — 현재 인증된 GitHub 계정 "${who}"` : ''}에 이 저장소 쓰기 권한이 없습니다. `
            + '※ 이건 git의 user.email/이름(커밋 작성자)과 무관한 "인증 계정" 문제입니다. '
            + '쓰기 권한이 있는 계정의 자격증명/토큰으로 교체해야 합니다. (커밋은 로컬에 완료됨)';
      } else if (/could not read username|authentication failed|terminal prompts disabled/i.test(detail)) {
        msg = '인증 정보가 없거나 거부됐습니다. 쓰기 권한이 있는 계정의 토큰(PAT)으로 자격증명을 설정하세요. (커밋은 로컬에 완료됨)';
      } else {
        msg = `git 실패: ${e.message}`;
      }
      sendJSON(res, 500, { error: msg, detail });
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
  console.log(`  Tools:  http://localhost:${PORT}/tools/`);
  console.log(`  Game:   http://localhost:${PORT}/`);
  console.log(`  Editor: http://localhost:${PORT}/tools/editor/`);
  console.log(`  Sim:    http://localhost:${PORT}/tools/sim-viewer/`);
  console.log(`  Ctrl+C to stop\n`);

  // Auto-open browser (Windows) — 툴 런처
  exec(`start http://localhost:${PORT}/tools/`);
});
