import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const port = 43183;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.setDefaultTimeout(10000);
  await page.goto(base + '/?tool=combat', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__combatToolReady === true);
  await page.evaluate(async () => {
    const [{ default: gs, createDefaultFlags }, { default: map }] = await Promise.all([import('/js/core/GameState.js'), import('/js/ui/SeoulMapModal.js')]);
    gs.flags = createDefaultFlags();
    gs.flags.mapUnlocked = false;
    gs.ui.currentState = 'main';
    gs.location.currentDistrict = 'junggoo';
    gs.location.currentLandmark = null;
    gs.player.hp.current = 100;
    gs.player.isAlive = true;
    gs.stats.stamina.current = 100;
    gs.cards = {};
    gs.board.middle = Array(27).fill(null);
    gs.board.bottom = Array(20).fill(null);
    gs.player.middlePage3Unlocked = true;
    gs.player.extraSlots = 0;
    gs.pendingLoot = [];
    const metal = gs.createCardInstance('scrap_metal', { quantity: 10 });
    gs.placeCardInRow(metal.instanceId, 'bottom');
    map._isMapUnlocked = () => false;
    const main = (await import('/js/screens/Main.js')).default;
    gs.ui.currentState = 'main';
    main._buildLayout();
    main._updateSidebarButtons();
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.querySelector('#screen-main').classList.add('active');
  });
  await page.locator('[data-action="open-local-supplies"]').click();
  const button = page.locator('[data-map-supply="market_salt"]');
  await button.scrollIntoViewIfNeeded();
  await button.click();
  const actual = await page.evaluate(async () => {
    const gs = (await import('/js/core/GameState.js')).default;
    const total = id => Object.values(gs.cards).filter(c => c.definitionId === id).reduce((sum, c) => sum + c.quantity, 0);
    const result = { salt: total('salt'), metal: total('scrap_metal'), stock: gs.flags.explorationSupply.stocks.market_salt.remaining };
    const saved = gs.serialize();
    gs.deserialize(saved);
    result.restoredStock = gs.flags.explorationSupply.stocks.market_salt.remaining;
    return result;
  });
  assert.deepEqual(actual, { salt: 2, metal: 8, stock: 2, restoredStock: 2 });
  assert.match(await button.locator('..').innerText(), /2\/3묶음/);
  await mkdir('docs/analysis/progression-execution', { recursive: true });
  await page.screenshot({ path: 'docs/analysis/progression-execution/task-3-supply-ui.png' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await button.scrollIntoViewIfNeeded();
  assert.equal(await button.isEnabled(), true);
  await button.click();
  assert.match(await button.locator('..').innerText(), /1\/3묶음/);
  console.log('지도 잠금 상태 공급처 UI: 1920×1080/1280×720 실제 버튼 교환, 비용·재고·저장 복원 통과', actual);
} finally {
  await browser?.close();
  server.kill();
}
