// === Electron Main Process — 모바일 시뮬레이션 버전 ===
// 갤럭시 S26 기준: 412×915 고정 창 (CSS 논리 픽셀)
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

const PORT = 18438; // 모바일 빌드는 별도 포트 사용 (PC 버전과 동시 실행 충돌 방지)

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
  // 갤럭시 S26 CSS 논리 픽셀: 412×915 (세로 모드)
  // 타이틀바 포함 높이 보정: +30px
  const win = new BrowserWindow({
    width:           412,
    height:          945,   // 915 + 30 (타이틀바)
    minWidth:        412,
    minHeight:       945,
    maxWidth:        412,
    maxHeight:       945,
    resizable:       false,
    maximizable:     false,
    fullscreenable:  false,
    title: 'Card Survival: Ruined City (Mobile)',
    backgroundColor: '#0d0d0d',
    icon: path.join(getRoot(), 'assets', 'images', 'player.jpg'),
    autoHideMenuBar: true,
    center:          true,  // 화면 중앙 배치
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
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
