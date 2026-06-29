import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.COMBAT_E2E_PORT ?? 43179);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotPath = path.resolve('tmp/combat-screen-playwright.png');

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (err) {
    throw new Error(
      `Playwright dependency is not installed. Install playwright or @playwright/test before running this check. ${err.message}`,
    );
  }
}

function startServer() {
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const child = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', data => process.stdout.write(`[vite] ${data}`));
  child.stderr.on('data', data => process.stderr.write(`[vite] ${data}`));
  return child;
}

async function waitForServer(timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/combat-test.html`);
      if (res.ok) return;
    } catch {
      // Server not ready yet.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function main() {
  const { chromium } = await loadPlaywright();
  const server = startServer();
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    await page.goto(`${baseUrl}/combat-test.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.combat-stage-lineup');

    const moveCard = page.locator('.action-card.move');
    await moveCard.waitFor();
    const action = await moveCard.getAttribute('data-action');
    const ariaDisabled = await moveCard.getAttribute('aria-disabled');
    const className = await moveCard.getAttribute('class');
    if (action !== 'move') throw new Error(`MOVE card data-action mismatch: ${action}`);
    if (ariaDisabled != null || /\bdisabled\b/.test(className ?? '')) {
      throw new Error(`MOVE card is still disabled: ${className}`);
    }

    await moveCard.click();
    await page.waitForSelector('.cv-player.player-rank-back');
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`combat-screen:ok screenshot=${screenshotPath}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
