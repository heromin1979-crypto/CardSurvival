import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const port = 43184, base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
let browser; const errors = [];
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 250)); }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(base + '/?tool=combat', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__combatToolReady === true);
  await page.evaluate(async () => {
    const gs = (await import('/js/core/GameState.js')).default;
    const scene = (await import('/js/ui/DialogueScene.js')).default;
    scene.reset(); gs.resetForNewGame(); gs.ui.currentState = 'main'; gs.ui.modalOpen = false;
    gs.player.characterId = 'chef'; gs.location.currentDistrict = 'songpa'; gs.time.day = 271;
    gs.quests = { active: [], completed: ['mq_chef_a2_prep'] };
    for (const id of ['chef_expansion', 'chef_farm']) gs.flags.careerProjects.projects[id] = { active: true, installedInputs: {}, uses: 0 };
    for (const [id, quantity] of [['scrap_metal', 3], ['salt', 1], ['purified_water', 2]]) {
      const c = gs.createCardInstance(id, { quantity }); gs.placeCardInRow(c.instanceId, 'bottom');
    }
    (await import('/js/ui/CareerProjectScene.js')).default.open('chef_farm');
  });
  const button = page.locator('[data-scene-choice="operate"]');
  assert.match(await button.innerText(), /재배 중단기 식재료 교환/);
  assert.match(await button.innerText(), /3TP/);
  await button.click();
  assert.equal(await button.isDisabled(), true);
  const result = await page.evaluate(async () => {
    const gs = (await import('/js/core/GameState.js')).default;
    gs.deserialize(gs.serialize());
    return { uses: gs.flags.careerProjects.projects.chef_farm.uses, metal: gs.countOnBoard('scrap_metal'), salt: gs.countOnBoard('salt'), water: gs.countOnBoard('purified_water'), vegetables: gs.countOnBoard('vegetable'), tp: gs.time.totalTP };
  });
  assert.deepEqual(result, { uses: 1, metal: 0, salt: 0, water: 2, vegetables: 2, tp: 3 });
  assert.deepEqual(errors, []);
  await page.screenshot({ path: 'docs/analysis/progression-execution/task-6-winter-ui.png' });
  await writeFile('docs/analysis/progression-execution/task-6-winter-ui.json', JSON.stringify({ result, errors }, null, 2));
  console.log(JSON.stringify({ result, errors }));
} finally { await browser?.close(); server.kill(); }
