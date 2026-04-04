// === Electron Main Process ===
// 내장 HTTP 서버 → BrowserWindow 방식
// serve.js와 동일한 서버 로직을 인라인으로 포함
'use strict';

const { app, BrowserWindow, shell } = require('electron');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const PORT = 18437; // 고정 포트 (8080 충돌 방지)

// ── 게임 파일 루트 경로 ────────────────────────────────────────
// 패키징 여부에 따라 경로가 달라짐
function getRoot() {
  if (app.isPackaged) {
    // electron-builder: resources/app/ 또는 resources/app.asar
    return app.getAppPath();
  }
  return __dirname;
}

// ── 내장 HTTP 서버 ─────────────────────────────────────────────
function startServer(root) {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css' : 'text/css; charset=utf-8',
    '.js'  : 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png' : 'image/png',
    '.jpg' : 'image/jpeg',
    '.svg' : 'image/svg+xml',
    '.ico' : 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff' : 'font/woff',
  };

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';

      const filePath = path.normalize(path.join(root, urlPath));

      // 경로 순회 방지
      if (!filePath.startsWith(root)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        const ext  = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type });
        res.end(data);
      });
    });

    server.on('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

// ── BrowserWindow 생성 ─────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  800,
    minHeight: 600,
    title: 'Card Survival: Ruined City',
    backgroundColor: '#0d0d0d',
    icon: path.join(getRoot(), 'assets', 'images', 'player.jpg'),
    autoHideMenuBar: true,   // 메뉴바 숨김 (F10으로 토글 가능)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);

  // 외부 링크는 기본 브라우저로 열기
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// ── 앱 초기화 ──────────────────────────────────────────────────
let httpServer = null;

app.whenReady().then(async () => {
  const root = getRoot();

  try {
    httpServer = await startServer(root);
  } catch (err) {
    console.error('서버 시작 실패:', err);
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (httpServer) httpServer.close();
  if (process.platform !== 'darwin') app.quit();
});
