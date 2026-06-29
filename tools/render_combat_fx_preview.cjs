const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(__dirname, 'combat_fx_preview.html');
const outPath = path.join(root, 'assets', 'images', 'combat_fx_preview_v2.png');
const userDataPath = path.join(root, 'tmp', 'electron-fx-preview');

app.setPath('userData', userDataPath);
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('no-sandbox');

async function main() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 1400,
    height: 760,
    show: false,
    backgroundColor: '#050403',
    webPreferences: {
      offscreen: true,
      sandbox: false,
    },
  });

  await win.loadFile(htmlPath);
  await new Promise(resolve => setTimeout(resolve, 600));

  const image = await win.webContents.capturePage();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, image.toPNG());

  win.destroy();
  app.quit();
}

main().catch(error => {
  console.error(error);
  app.exit(1);
});
