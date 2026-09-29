import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const port = 43186, base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
let browser;
const errors = [], checks = [];
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 250)); }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(base + '/?tool=combat');
  await page.waitForFunction(() => window.__combatToolReady === true);
  await page.evaluate(async () => {
    const [{ default: gs, createDefaultFlags }, { default: dialogue }, { default: main }] = await Promise.all([import('/js/core/GameState.js'), import('/js/ui/DialogueScene.js'), import('/js/screens/Main.js')]);
    dialogue.reset(); gs.flags = createDefaultFlags(); gs.ui.currentState = 'main'; gs.ui.modalOpen = false;
    gs.location.currentDistrict = 'yongsan'; gs.location.currentLandmark = null;
    gs.player.characterId = 'engineer'; gs.player.hp.current = 100; gs.player.isAlive = true;
    gs.stats.stamina.current = 100; gs.time.day = 1; gs.time.totalTP = 0; gs.time.tpInDay = 0;
    gs.cards = {}; gs.board.middle = Array(27).fill(null); gs.board.bottom = Array(20).fill(null); gs.pendingLoot = [];
    gs.quests.active = []; gs.quests.completed = ['mq_eng_02', 'mq_eng_08'];
    for (const id of ['engineer_workbench', 'engineer_power']) gs.flags.careerProjects.projects[id] = { projectId: id, active: true, installedInputs: {}, uses: 0 };
    for (const [id, quantity] of [['fuel_can', 1], ['scrap_metal', 3], ['wire', 1]]) { const c = gs.createCardInstance(id, { quantity }); gs.placeCardInRow(c.instanceId, 'bottom'); }
    main._buildLayout(); main._updateSidebarButtons(); document.querySelectorAll('.screen').forEach(el => el.classList.remove('active')); document.querySelector('#screen-main').classList.add('active');
  });
  await page.locator('[data-action="open-career-projects"]').click();
  await page.locator('[data-scene-choice="engineer_workbench"]').click();
  assert.equal(await page.locator('[data-scene-choice="operate"]').isDisabled(), true);
  assert.match(await page.locator('[data-scene-choice="operate"]').innerText(), /전력 부족/);
  await page.locator('[data-scene-choice="back"]').click();
  await page.locator('[data-scene-choice="engineer_power"]').click();
  assert.match(await page.locator('[data-scene-choice="operate"]').innerText(), /운영 가능 3회/);
  await page.locator('[data-scene-choice="operate"]').click();
  assert.equal(await page.locator('[data-scene-choice="operate"]').isDisabled(), true);
  checks.push('실제 버튼: 전력 부족 정비 거절 → 연료 발전 재가동 → 재사용 대기');
  await page.locator('[data-scene-choice="back"]').click();
  await page.locator('[data-scene-choice="engineer_workbench"]').click();
  assert.equal(await page.locator('[data-scene-choice="operate"]').isDisabled(), false);
  await page.locator('[data-scene-choice="operate"]').click();
  const result = await page.evaluate(async () => {
    const gs = (await import('/js/core/GameState.js')).default;
    const before = JSON.stringify(gs.flags.careerProjects);
    gs.deserialize(gs.serialize());
    return { power: gs.flags.careerProjects.districtPower.yongsan, restored: before === JSON.stringify(gs.flags.careerProjects), fuel: gs.countOnBoard('fuel_can') };
  });
  assert.deepEqual(result, { power: 2, restored: true, fuel: 0 });
  checks.push('전동 정비 실제 소비: 연료1→전력3→정비1→잔량2 저장 복원');
  await page.getByText('목표 보기', { exact: true }).click();
  assert.match(await page.locator('#dialogue-scene-overlay').innerText(), /운영 가능 2\/6회/);
  await page.locator('#dialogue-scene-overlay img').evaluateAll(async imgs => Promise.all(imgs.map(img => img.decode().catch(() => {}))));
  await page.screenshot({ path: 'docs/analysis/progression-execution/task-4-power-1280.png' });
  assert.deepEqual(errors, []);
  await writeFile('docs/analysis/progression-execution/task-4-fix-ui-results.json', JSON.stringify({ checks, result, errors }, null, 2));
  console.log(JSON.stringify({ checks, result, errors }));
} finally { await browser?.close(); server.kill(); }

