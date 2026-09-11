import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const port = Number(process.env.UI_E2E_PORT ?? 43185);
const base = `http://127.0.0.1:${port}`;
const output = 'tmp/ui-revamp/verified';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let browser;
const report = { errors: [], checks: [] };
try {
  await mkdir(output, { recursive: true });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(ready, '로컬 서버 시작 실패');
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => report.errors.push(e.message));
  // 외부 폰트 연결 여부가 UI 동작 검증 시간을 좌우하지 않게 한다.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(`${base}/?tool=combat`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__combatToolReady);
  const fixture = await page.evaluate(async () => {
    const { GameState: gs, CharCreate, GameData, NPCSystem, EquipmentSystem } = window.__combatTool;
    CharCreate._selectedChar = GameData.characters.find(c => c.id === 'soldier') ?? GameData.characters[1];
    CharCreate._selectedDistrict = CharCreate._selectedChar.homeDist;
    gs.ui.currentState = 'char_create';
    CharCreate._startGame('생존자');
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
    gs.ui.modalOpen = false;
    const armorIds = Object.entries(GameData.items).filter(([, def]) => def.type === 'armor' && EquipmentSystem.getSlotsForDef(def).length).slice(0, 8).map(([id]) => id);
    for (const id of armorIds) {
      const inst = gs.createCardInstance(id);
      if (inst) gs.placeCardInRow(inst.instanceId, 'middle');
    }
    const knife = gs.createCardInstance('knife');
    gs.placeCardInRow(knife.instanceId, 'bottom');
    gs.ui.middlePage = 0;
    gs.ui.bottomPage = 0;
    NPCSystem.ensureInitialized();
    NPCSystem._spawnNPC('npc_jisu', NPCSystem.getNPCDef('npc_jisu'));
    gs.npcs.states.npc_jisu.trust = 5;
    NPCSystem.recruit('npc_jisu');
    (await import('/js/ui/BoardRenderer.js')).default.reinit();
    (await import('/js/ui/CompanionPanel.js')).default.render();
    return { knife: knife.instanceId };
  });
  await page.waitForFunction(() => document.querySelectorAll('.notif-card.is-ephemeral').length === 0, null, { timeout: 15000 });
  await page.locator('.onboarding-close').click({ timeout: 500 }).catch(() => {});
  assert.equal(await page.locator('.screen.active').getAttribute('id'), 'screen-main');
  assert.equal(await page.locator('.row-bottom .slot').count(), 9);
  const beforePage = await page.evaluate(() => [...window.__combatTool.GameState.board.bottom]);
  await page.locator('.pager-bottom .pager-next').click();
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.ui.bottomPage), 1);
  assert.deepEqual(await page.evaluate(() => [...window.__combatTool.GameState.board.bottom]), beforePage);
  await page.locator('.pager-bottom .pager-prev').click();
  report.checks.push('보드 페이지 전환: 용량/카드 보존');

  await page.evaluate(async () => {
    const m = (await import('/js/ui/EquipmentModal.js')).default;
    m._activeMainTab = 'equip'; m._activeTab = 1; m.open();
  });
  await page.locator(`[data-inv-id="${fixture.knife}"]`).focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('.equip-item-detail').innerText(), /장착 위치/);
  await page.locator('.equip-slot[data-slot="weapon_sub"]').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.player.equipped.weapon_sub), fixture.knife);
  await page.locator('.equip-slot[data-slot="weapon_sub"]').click();
  await page.locator('.equip-slot [data-action="unequip"]').click();
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.player.equipped.weapon_sub), null);
  report.checks.push('장비: 실제 키보드 장착/해제 및 선택 상세');
  await page.evaluate(async () => (await import('/js/ui/EquipmentModal.js')).default.close());

  for (const [width, height] of [[1920, 1080], [1536, 864], [1366, 768], [1280, 720]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${output}/main-${width}.png` });
    for (const selector of ['.row-top', '.row-middle', '.row-bottom']) {
      const box = await page.locator(selector).boundingBox();
      assert(box && box.y >= 0 && box.y + box.height <= height + 1, `${width} ${selector} 화면 밖`);
    }
    const clippedCards = await page.locator('.board .card').evaluateAll(els => els.filter(el => {
      const r = el.getBoundingClientRect();
      const row = el.closest('.board-row-slots')?.getBoundingClientRect();
      return row && (r.left < row.left - 1 || r.right > row.right + 1);
    }).map(el => el.dataset.instanceId));
    assert.deepEqual(clippedCards, [], `${width} 보드 카드 좌우 잘림`);
    await page.evaluate(async () => {
      const m = (await import('/js/ui/EquipmentModal.js')).default;
      m._activeTab = 0; m.open();
    });
    await page.locator('.equip-inv-row').first().click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${output}/equipment-${width}.png` });
    const slotBoxes = await page.locator('.equip-slot').evaluateAll(els => els.map(el => {
      const r = el.getBoundingClientRect(); return [r.x, r.y, r.right, r.bottom];
    }));
    assert.equal(slotBoxes.length, 9);
    assert(slotBoxes.every(([x,y,right,bottom]) => x >= 0 && y >= 0 && right <= width + 1 && bottom <= height + 1), `${width} 장비 슬롯 잘림`);
    assert(await page.locator('.equip-slot[data-slot="boots"]').evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), `${width} 신발 슬롯이 다른 패널에 가려짐`);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.screen.active').getAttribute('id'), 'screen-main');
    await page.evaluate(async () => (await import('/js/ui/NPCDialogueModal.js')).default.show('npc_jisu'));
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${output}/dialogue-${width}.png` });
    assert.doesNotMatch(await page.locator('.npc-scene').innerText(), /npc\.\w+\.(greet|hint)/);
    const stateBefore = await page.evaluate(() => JSON.stringify(window.__combatTool.GameState.npcs.states.npc_jisu));
    await page.locator('.npc-scene-choices button').first().click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.__combatTool.GameState.npcs.states.npc_jisu)), stateBefore);
    const leave = await page.locator('.npc-scene-leave').boundingBox();
    assert(leave && leave.y >= 0 && leave.y + leave.height <= height + 1, `${width} 대화 닫기 잘림`);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#npc-dialogue-overlay.open').count(), 0);
    assert.equal(await page.evaluate(() => window.__combatTool.GameState.ui.modalOpen), false);
    report.checks.push(`${width}×${height}: 메인 3영역, 장비 9슬롯, 대화 탐색/닫기`);
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.evaluate(async () => {
    window.__combatTool.GameState.time.hour = 23;
    (await import('/js/ui/HeaderBar.js')).default.render();
  });
  assert.equal(await page.locator('#screen-main').getAttribute('data-time-of-day'), 'night');
  await page.screenshot({ path: `${output}/main-night.png` });
  report.checks.push('야간 화면과 시간 상태 일치');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  server.kill();
}
