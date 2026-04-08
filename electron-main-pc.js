// === Electron Main Process — PC 버전 ===
// 스팀 게임 기준: 1920×1080 최대화 시작, 최소 1280×720
'use strict';

const { app, BrowserWindow, shell } = require('electron');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

if (!app.isPackaged) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron.cmd'),
    awaitWriteFinish: true,
    watched: [
      path.join(__dirname, 'js'),
      path.join(__dirname, 'css'),
      path.join(__dirname, 'index.html'),
    ],
  });
}

const PORT = 18437;

function getRoot() {
  return app.isPackaged ? app.getAppPath() : __dirname;
}

function killPortSync(port) {
  try {
    const { execSync } = require('child_process');
    const out = execSync(
      `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
      { encoding: 'utf8' }
    ).trim();
    if (out) {
      out.split(/\r?\n/).forEach(pid => {
        pid = pid.trim();
        if (pid && pid !== String(process.pid)) {
          try { execSync(`powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`); } catch (_) {}
        }
      });
    }
  } catch (_) {}
}

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

function createWindow() {
  const win = new BrowserWindow({
    title: 'Card Survival: Ruined City',
    backgroundColor: '#000000',
    icon: path.join(getRoot(), 'assets', 'images', 'player.jpg'),
    fullscreen: true,          // 타이틀바·작업표시줄 모두 덮는 진짜 전체화면
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // F11: 전체화면 토글 (개발·긴급 탈출용)
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      win.setFullScreen(!win.isFullScreen());
    }
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

let httpServer = null;

app.whenReady().then(async () => {
  const root = getRoot();

  try {
    httpServer = await startServer(root);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`포트 ${PORT} 충돌 — 기존 프로세스 종료 후 재시도...`);
      killPortSync(PORT);
      await new Promise(r => setTimeout(r, 500));
      try {
        httpServer = await startServer(root);
      } catch (err2) {
        console.error('서버 시작 실패:', err2);
        app.quit();
        return;
      }
    } else {
      console.error('서버 시작 실패:', err);
      app.quit();
      return;
    }
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
