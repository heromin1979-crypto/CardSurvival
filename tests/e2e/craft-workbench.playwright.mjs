import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.CRAFT_E2E_PORT ?? 43182);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotPath = path.resolve('outputs/craft-workbench-high-fidelity.png');

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (err) {
    throw new Error(`Playwright dependency is not installed. ${err.message}`);
  }
}

function startServer() {
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const child = spawn(process.execPath, [
    viteBin,
    '--host', '127.0.0.1',
    '--port', String(port),
    '--strictPort',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', data => process.stdout.write(`[vite] ${data}`));
  child.stderr.on('data', data => process.stderr.write(`[vite] ${data}`));
  return child;
}

async function waitForServer(timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

function waitForExit(child, timeoutMs) {
  return new Promise(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve(true);
      return;
    }

    let timer;
    const finish = exited => {
      clearTimeout(timer);
      child.removeListener('exit', onExit);
      resolve(exited);
    };
    const onExit = () => finish(true);
    child.once('exit', onExit);
    timer = setTimeout(() => finish(false), timeoutMs);
  });
}

async function forceStopServer(server) {
  if (process.platform === 'win32') {
    await new Promise((resolve, reject) => {
      const taskkill = spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      taskkill.once('error', reject);
      taskkill.once('close', resolve);
    });
    return;
  }

  server.kill('SIGKILL');
}

async function stopServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) return;
  server.kill();
  if (await waitForExit(server, 3000)) return;

  await forceStopServer(server);
  if (!await waitForExit(server, 3000)) {
    throw new Error(`Vite server process ${server.pid} did not exit after forced termination`);
  }
}

async function openWorkbench(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#screen-main-menu.active');
  await page.evaluate(async () => {
    const [{ default: GameState }, { default: StateMachine }] = await Promise.all([
      import('/js/core/GameState.js'),
      import('/js/core/StateMachine.js'),
    ]);
    GameState.ui.currentState = 'slot_select';
    StateMachine.transition('main');
  });
  await page.waitForSelector('#screen-main.active');
  await page.locator('#btn-craft').click();
  await page.waitForSelector('#craft-modal.open .craft-workbench--spec');
  await page.locator('.craft-status-tab.status-lacking').click();
  await page.waitForSelector('.blueprint-list .blueprint-item');
  await page.waitForFunction(() => {
    const image = document.querySelector('.spec-figure-img');
    return image?.complete === true && image.naturalWidth > 0;
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const items = [...document.querySelectorAll('.blueprint-item')];
    const list = document.querySelector('.blueprint-list');
    const first = items[0]?.getBoundingClientRect();
    const second = items[1]?.getBoundingClientRect();
    const listRect = list?.getBoundingClientRect();
    const callouts = [...document.querySelectorAll('.spec-figure-callout')]
      .map(el => el.getBoundingClientRect());
    let calloutOverlapCount = 0;
    for (let i = 0; i < callouts.length; i++) {
      for (let j = i + 1; j < callouts.length; j++) {
        const a = callouts[i];
        const b = callouts[j];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 0 && overlapY > 0) calloutOverlapCount++;
      }
    }
    const image = document.querySelector('.spec-figure-img');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      itemCount: items.length,
      itemHeight: first?.height ?? null,
      itemGap: first && second ? second.top - first.bottom : null,
      visibleItems: listRect
        ? items.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.top >= listRect.top - 1 && rect.bottom <= listRect.bottom + 1;
        }).length
        : 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      blueprintLoaded: image?.complete === true && (image?.naturalWidth ?? 0) > 0,
      calloutCount: callouts.length,
      calloutOverlapCount,
    };
  });
}

function assertDesktop(result) {
  assert.ok(result.itemHeight >= 64 && result.itemHeight <= 68, `itemHeight=${result.itemHeight}`);
  assert.ok(result.itemGap >= 2 && result.itemGap <= 4, `itemGap=${result.itemGap}`);
  assert.ok(
    result.visibleItems >= Math.min(10, result.itemCount),
    `visibleItems=${result.visibleItems} itemCount=${result.itemCount}`,
  );
  assert.equal(result.overflowX, false, 'document has horizontal overflow');
  assert.equal(result.overflowY, false, 'document has vertical overflow');
  assert.equal(result.blueprintLoaded, true, 'blueprint image did not load');
  assert.ok(result.calloutCount > 0, 'no blueprint callouts rendered');
  assert.equal(result.calloutOverlapCount, 0, 'blueprint callouts overlap');
}

async function main() {
  const { chromium } = await loadPlaywright();
  const server = startServer();
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await openWorkbench(page);

    const desktop = await measure(page);
    assertDesktop(desktop);
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.setViewportSize({ width: 1400, height: 900 });
    await page.waitForTimeout(100);
    const compact = await measure(page);
    assert.equal(compact.overflowX, false, '1400x900 document has horizontal overflow');
    assert.equal(compact.overflowY, false, '1400x900 document has vertical overflow');

    console.log(`craft-workbench:ok desktop=${JSON.stringify(desktop)}`);
    console.log(`craft-workbench:ok compact=${JSON.stringify(compact)}`);
    console.log(`craft-workbench:ok screenshot=${screenshotPath}`);
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      await stopServer(server);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
