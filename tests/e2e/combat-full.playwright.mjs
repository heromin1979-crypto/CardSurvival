import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.COMBAT_E2E_FULL_PORT ?? 43181);
const baseUrl = `http://127.0.0.1:${port}`;
const outDir = path.resolve('tmp/combat-full-playwright');
const reportPath = path.join(outDir, 'report.json');

const results = [];
const browserErrors = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark} ${name}${detail ? ` :: ${detail}` : ''}`);
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (err) {
    throw new Error(`Playwright dependency is not installed. ${err.message}`);
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

async function newCombatPage(browser, viewport = { width: 1280, height: 820 }) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => browserErrors.push({ type: 'pageerror', message: err.message }));
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      browserErrors.push({ type: msg.type(), message: msg.text() });
    }
  });
  page.on('requestfailed', req => {
    if (['document', 'script', 'stylesheet'].includes(req.resourceType())) {
      browserErrors.push({ type: 'requestfailed', url: req.url(), failure: req.failure()?.errorText ?? '' });
    }
  });
  await page.goto(`${baseUrl}/combat-test.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.combat-stage-lineup', { timeout: 10000 });
  return page;
}

async function screenshot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function checkSelector(page, name, selector, expectedMin = 1) {
  const count = await page.locator(selector).count();
  record(name, count >= expectedMin, `selector=${selector} count=${count}`);
}

async function scenarioInitialLayout(browser) {
  const page = await newCombatPage(browser);
  await checkSelector(page, 'initial: combat stage visible', '.combat-stage-lineup');
  await checkSelector(page, 'initial: initiative visible', '.initiative-bar .init-slot', 2);
  await checkSelector(page, 'initial: player visible', '.cv-player');
  await checkSelector(page, 'initial: enemy visible', '.cv-enemy-sprite');
  await checkSelector(page, 'initial: enemy intent visible', '.cv-intent');
  await checkSelector(page, 'initial: attack card visible', '.action-card.primary[data-action]');
  await checkSelector(page, 'initial: guard card visible', '.action-card[data-action="guard"]');
  await checkSelector(page, 'initial: move card enabled', '.action-card.move[data-action="move"]');
  await checkSelector(page, 'initial: flee card visible', '.action-card.flee[data-action="flee"]');
  const overflowDetails = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.action-card, .sec-btn, .cv-unit-plate, .cv-hp-overlay')];
    return nodes
      .filter(el => el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)
      .map(el => ({
        className: el.className,
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));
  });
  record('initial: major combat text containers do not overflow', overflowDetails.length === 0, JSON.stringify(overflowDetails));
  const file = await screenshot(page, '01-initial-desktop');
  record('initial: screenshot captured', true, file);
  await page.close();
}

async function scenarioMove(browser) {
  const page = await newCombatPage(browser);
  await page.locator('.action-card.move').click();
  await page.waitForSelector('.cv-player.player-rank-back', { timeout: 5000 });
  const state = await page.evaluate(() => ({
    playerRank: window.GameState.combat.playerRank,
    lastLog: window.GameState.combat.log.at(-1),
    logs: [...window.GameState.combat.log],
  }));
  record('move: playerRank toggles to back', state.playerRank === 'back', JSON.stringify(state));
  record('move: combat log records movement', state.logs.some(log => /\[Move\]|\[이동\]|후열|Back/.test(log ?? '')), JSON.stringify(state.logs.slice(-3)));
  const file = await screenshot(page, '02-move-back');
  record('move: screenshot captured', true, file);
  await page.close();
}

async function scenarioRanksAndTargets(browser) {
  const page = await newCombatPage(browser);
  await page.locator('#btn-form-screamer').click();
  await page.waitForFunction(() => window.GameState.combat?.enemies?.length === 3);
  await checkSelector(page, 'rank: back-row badge visible', '.cv-row-badge');
  await checkSelector(page, 'rank: enemy intent remains visible', '.cv-intent');

  const meleeBlock = await page.evaluate(() => {
    const backIdx = window.GameState.combat.enemies.findIndex(e => window.CombatSystem.rowOf(e) === 'back');
    const before = window.GameState.combat.targetIndex;
    const result = window.CombatSystem.setTarget(backIdx);
    return { backIdx, before, result, after: window.GameState.combat.targetIndex };
  });
  record('rank: melee cannot target guarded back row', meleeBlock.backIdx >= 0 && meleeBlock.result === false && meleeBlock.after === meleeBlock.before, JSON.stringify(meleeBlock));

  await page.locator('#btn-gun').click();
  const rangedReach = await page.evaluate(() => {
    const backIdx = window.GameState.combat.enemies.findIndex(e => window.CombatSystem.rowOf(e) === 'back');
    const isRanged = window.CombatSystem.isPlayerWeaponRanged();
    const result = window.CombatSystem.setTarget(backIdx);
    return { backIdx, isRanged, result, targetIndex: window.GameState.combat.targetIndex };
  });
  record('rank: loaded ranged weapon can target back row', rangedReach.backIdx >= 0 && rangedReach.isRanged && rangedReach.result === true && rangedReach.targetIndex === rangedReach.backIdx, JSON.stringify(rangedReach));
  const file = await screenshot(page, '03-rank-back-row');
  record('rank: screenshot captured', true, file);
  await page.close();
}

async function scenarioActionsAndStatus(browser) {
  const page = await newCombatPage(browser);
  await page.locator('#btn-bat').click();
  await page.evaluate(() => {
    const enemy = window.GameState.combat.enemies[0];
    enemy.currentHp = 999;
    enemy.maxHp = 999;
  });
  const hpBefore = await page.evaluate(() => window.GameState.combat.enemies[0].currentHp);
  await page.locator('.action-card.primary').click();
  await page.waitForTimeout(250);
  const attackState = await page.evaluate(hpBeforeFromNode => {
    const enemy = window.GameState.combat.enemies[0];
    return {
      hpBefore: hpBeforeFromNode,
      hpAfter: enemy.currentHp,
      lastHit: window.GameState.combat.lastHit,
      attackFxSeen: [...document.querySelectorAll('.cv-fx, .dmg-popup')].length,
      logs: [...window.GameState.combat.log],
    };
  }, hpBefore);
  record(
    'action: primary attack resolves as hit or miss with feedback',
    attackState.hpAfter < attackState.hpBefore
      || !!attackState.lastHit
      || attackState.attackFxSeen > 0
      || attackState.logs.some(log => /빗나감|miss/i.test(log)),
    JSON.stringify(attackState),
  );

  await page.evaluate(() => {
    const enemy = window.GameState.combat.enemies[0];
    window.CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'bleed',
      name: '출혈',
      duration: 2,
      chance: 1,
      effect: { hpPerRound: -4 },
    }, 0);
  });
  await page.locator('.action-card[data-action="guard"]').click();
  await page.waitForSelector('.status-badge.enemy', { timeout: 5000 });
  const statusState = await page.evaluate(() => {
    const enemy = window.GameState.combat.enemies[0];
    const bleed = enemy._statusEffects?.find(s => s.id === 'bleed');
    return {
      bleed,
      badgeText: document.querySelector('.status-badge.enemy')?.textContent ?? '',
      guardActive: !!window.GameState.combat.playerGuard?.active,
      guardMotion: document.querySelector('.cv-player')?.className ?? '',
      logs: [...window.GameState.combat.log],
    };
  });
  record('status: bleed normalizes and appears in UI', !!statusState.bleed?.effect?.hpLossPerRound && /출혈|bleed/i.test(statusState.badgeText), JSON.stringify(statusState));
  record('action: guard action is processed', statusState.guardActive === true || statusState.logs.some(log => /방어|guard/i.test(log)), JSON.stringify(statusState));
  const file = await screenshot(page, '04-action-status-guard');
  record('action/status: screenshot captured', true, file);
  await page.close();
}

async function scenarioCompanionStance(browser) {
  const page = await newCombatPage(browser);
  await page.evaluate(() => {
    window.GameState.companions = ['npc_dog'];
    window.GameState.npcs ??= { states: {} };
    window.GameState.npcs.states ??= {};
    window.GameState.npcs.states.npc_dog = {
      hp: 42,
      maxHp: 50,
      isCompanion: true,
      name: 'Dog',
      stance: 'attack',
    };
  });
  await page.locator('.action-card.move').click();
  await page.waitForTimeout(200);
  const stanceButtons = await page.locator('.stance-btn').count();
  record('companion: stance buttons removed for manual combat UI', stanceButtons === 0, `count=${stanceButtons}`);
  const companionPlate = await page.locator('[data-companion-id="npc_dog"] .cv-unit-plate').count();
  record('companion: simplified name and HP plate remains visible', companionPlate > 0, `count=${companionPlate}`);
  const file = await screenshot(page, '05-companion-stance');
  record('companion: screenshot captured', true, file);
  await page.close();
}

async function scenarioOutcomes(browser) {
  const victoryPage = await newCombatPage(browser);
  await victoryPage.evaluate(() => {
    window.GameState.combat.enemies[0].currentHp = 1;
    Math.random = () => 0;
  });
  await victoryPage.locator('.action-card.primary').click();
  await victoryPage.waitForFunction(() => !window.GameState.combat.active || window.GameState.combat.outcome === 'victory', null, { timeout: 5000 });
  const victory = await victoryPage.evaluate(() => ({
    active: window.GameState.combat.active,
    outcome: window.GameState.combat.outcome,
    activeScreen: document.querySelector('.screen.active')?.id ?? '',
  }));
  record('outcome: victory resolves combat', victory.outcome === 'victory' || victory.active === false, JSON.stringify(victory));
  await screenshot(victoryPage, '06-victory');
  await victoryPage.close();

  const defeatPage = await newCombatPage(browser);
  await defeatPage.evaluate(() => {
    window.GameState.player.hp.current = 1;
    const enemy = window.GameState.combat.enemies[0];
    enemy.attack = { damage: [100, 100], accuracy: 1 };
    Math.random = () => 0.99;
  });
  await defeatPage.locator('.action-card.primary').click();
  await defeatPage.waitForFunction(() => window.GameState.player.hp.current <= 0 || document.querySelector('#screen-game-over.active'), null, { timeout: 5000 });
  const defeat = await defeatPage.evaluate(() => ({
    playerHp: window.GameState.player.hp.current,
    active: window.GameState.combat.active,
    outcome: window.GameState.combat.outcome,
    activeScreen: document.querySelector('.screen.active')?.id ?? '',
  }));
  record('outcome: defeat/game over path is reachable', defeat.playerHp <= 0 || defeat.activeScreen === 'screen-game-over' || defeat.outcome === 'defeat', JSON.stringify(defeat));
  await screenshot(defeatPage, '07-defeat');
  await defeatPage.close();

  const fleePage = await newCombatPage(browser);
  await fleePage.evaluate(() => { Math.random = () => 0; });
  await fleePage.locator('.action-card.flee').dispatchEvent('click');
  await fleePage.waitForFunction(
    () => !window.GameState.combat.active || window.GameState.combat.outcome === 'fled',
    null,
    { timeout: 5000 },
  ).catch(() => {});
  const flee = await fleePage.evaluate(() => ({
    active: window.GameState.combat.active,
    outcome: window.GameState.combat.outcome,
    activeScreen: document.querySelector('.screen.active')?.id ?? '',
    logs: [...window.GameState.combat.log],
  }));
  record('outcome: flee success resolves combat', flee.outcome === 'fled' || flee.active === false, JSON.stringify(flee));
  await screenshot(fleePage, '08-flee');
  await fleePage.close();
}

async function scenarioResponsive(browser) {
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 820 }],
    ['tablet', { width: 768, height: 1024 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const page = await newCombatPage(browser, viewport);
    const visible = await page.locator('.combat-stage-lineup').isVisible();
    const actionVisible = await page.locator('.combat-action-bar').isVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 8);
    record(`responsive: ${name} stage/action visible`, visible && actionVisible, `viewport=${viewport.width}x${viewport.height}`);
    record(`responsive: ${name} no horizontal page overflow`, !overflow, `scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)} innerWidth=${viewport.width}`);
    const file = await screenshot(page, `09-responsive-${name}`);
    record(`responsive: ${name} screenshot captured`, true, file);
    await page.close();
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const { chromium } = await loadPlaywright();
  const server = startServer();
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    await scenarioInitialLayout(browser);
    await scenarioMove(browser);
    await scenarioRanksAndTargets(browser);
    await scenarioActionsAndStatus(browser);
    await scenarioCompanionStance(browser);
    await scenarioOutcomes(browser);
    await scenarioResponsive(browser);

    for (const err of browserErrors) {
      record(`browser ${err.type}`, false, JSON.stringify(err));
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  const summary = {
    passed: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
  };
  await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`combat-full-report=${reportPath}`);
  if (summary.failed > 0) process.exit(1);
}

main().catch(async err => {
  record('fatal: playwright combat full run', false, err.stack ?? err.message);
  await mkdir(outDir, { recursive: true });
  await writeFile(reportPath, JSON.stringify({ passed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results }, null, 2), 'utf8');
  process.exit(1);
});
