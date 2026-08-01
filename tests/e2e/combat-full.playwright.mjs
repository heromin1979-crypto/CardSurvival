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
  try {
    await page.waitForSelector('.combat-focused-lineup', { timeout: 10000 });
  } catch (err) {
    const diagnostics = {
      title: await page.title().catch(() => ''),
      bodyText: await page.locator('body').innerText().catch(() => ''),
      browserErrors: browserErrors.slice(-8),
    };
    throw new Error(`${err.message}\ncombat page diagnostics=${JSON.stringify(diagnostics)}`);
  }
  return page;
}

async function newPatternPage(browser, viewport = { width: 1280, height: 820 }) {
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

  await page.goto(`${baseUrl}/js/core/GameState.js`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    document.head.innerHTML = '<meta charset="UTF-8"><title>Combat pattern E2E</title>';
    document.body.innerHTML = [
      '<div id="screen-combat" class="screen active"></div>',
      '<div id="screen-combat-result" class="screen"></div>',
      '<div id="screen-game-over" class="screen"></div>',
      '<div id="notification-container"></div>',
    ].join('');
    const [
      { default: GameState },
      { default: CombatSystem },
    ] = await Promise.all([
      import('/js/core/GameState.js'),
      import('/js/systems/CombatSystem.js'),
    ]);
    window.GameState = GameState;
    window.CombatSystem = CombatSystem;
  });
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
  await checkSelector(page, 'initial: focused combat stage visible', '.combat-focused-lineup');
  await checkSelector(page, 'initial: initiative visible', '.initiative-bar .init-slot', 2);
  await checkSelector(page, 'initial: player visible', '.cv-player');
  await checkSelector(page, 'initial: enemy visible', '.cv-enemy-sprite');
  await checkSelector(page, 'initial: enemy intent visible', '.combat-intent');
  await checkSelector(page, 'initial: attack skill visible', '.combat-skill-button[data-command="attack"]');
  await checkSelector(page, 'initial: guard skill visible', '.combat-skill-button[data-skill-id="guard"]');
  await checkSelector(page, 'initial: move command enabled', '.combat-common-command[data-command="move"]:not([disabled])');
  await checkSelector(page, 'initial: flee command visible', '.combat-common-command[data-command="flee"]');
  const overflowDetails = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.combat-action-card, .combat-status-card')];
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
  await page.locator('.combat-common-command[data-command="move"]').dispatchEvent('click');
  await page.waitForFunction(() => window.GameState.combat.formations.ally.indexOf('player') === 2);
  const state = await page.evaluate(async () => ({
    playerRank: (await import('/js/systems/combat/FormationSystem.js'))
      .getRank(window.GameState.combat.formations, 'player'),
    lastLog: window.GameState.combat.log.at(-1),
    logs: [...window.GameState.combat.log],
  }));
  record('move: player advances from rank 1 to rank 2', state.playerRank === 2, JSON.stringify(state));
  record('move: combat log records movement', state.logs.some(log => /\[Move\]|\[이동\]|후열|Back|위치 변경|위치 이동/.test(log ?? '')), JSON.stringify(state.logs.slice(-3)));
  const file = await screenshot(page, '02-move-back');
  record('move: screenshot captured', true, file);
  await page.close();
}

async function scenarioRanksAndTargets(browser) {
  const page = await newCombatPage(browser);
  await page.locator('#btn-form-screamer').click();
  await page.waitForFunction(() => window.GameState.combat?.enemies?.length === 3);
  await checkSelector(page, 'rank: combatant rank badges visible', '.combatant-rank-badge', 4);
  await checkSelector(page, 'rank: enemy intent remains visible', '.combat-intent');

  const meleeBlock = await page.evaluate(() => {
    const backIdx = window.GameState.combat.enemies.findIndex(e => window.CombatSystem.rowOf(e) === 'back');
    const before = window.GameState.combat.targetIndex;
    const result = window.CombatSystem.setTarget(backIdx);
    return { backIdx, before, result, after: window.GameState.combat.targetIndex };
  });
  record('rank: melee cannot target guarded back row', meleeBlock.backIdx >= 0 && meleeBlock.result === false && meleeBlock.after === meleeBlock.before, JSON.stringify(meleeBlock));

  await page.locator('#btn-gun').click();
  await page.evaluate(async () => {
    const { default: CombatUI } = await import('/js/ui/CombatUI.js');
    const pistol = Object.values(window.GameState.cards).find(card => card.definitionId === 'pistol');
    if (!pistol) throw new Error('Test pistol was not created');
    window.GameState.player.equipped ??= {};
    window.GameState.player.equipped.weapon_main = pistol.instanceId;
    window.CombatSystem.reloadActiveWeapon(pistol.instanceId);
    CombatUI.render();
  });
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
  await page.locator('.combat-skill-button[data-command="attack"]:not([disabled])').first().dispatchEvent('click');
  await page.locator('.combatant-piece.targetable').first().dispatchEvent('click');
  await page.waitForFunction(previous => {
    const enemy = window.GameState.combat.enemies[0];
    return enemy.currentHp < previous
      || window.GameState.combat.log.some(log => /빗나감|miss/i.test(log));
  }, hpBefore);
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
  await page.locator('.combat-skill-button[data-skill-id="guard"]:not([disabled])').dispatchEvent('click');
  const guardTarget = page.locator('.combatant-piece.targetable[data-combatant-id="player"]');
  if (await guardTarget.count()) await guardTarget.dispatchEvent('click');
  await page.waitForSelector('.combatant-piece[data-combatant-id="enemy:0"] .combat-status-orbs i', { timeout: 5000 });
  const statusState = await page.evaluate(() => {
    const enemy = window.GameState.combat.enemies[0];
    const bleed = enemy._statusEffects?.find(s => s.id === 'bleed');
    return {
      bleed,
      badgeText: document.querySelector('.combatant-piece[data-combatant-id="enemy:0"] .combat-status-orbs')?.textContent ?? '',
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
  await setupFocusedMotionCombat(page, {
    enemyIds: ['zombie_common'],
    companionIds: ['npc_dog'],
  });
  const stanceButtons = await page.locator('.stance-btn').count();
  record('companion: stance buttons removed for manual combat UI', stanceButtons === 0, `count=${stanceButtons}`);
  const companionPlate = await page.locator('.combatant-piece[data-companion-id="npc_dog"] .combatant-name, .combatant-piece[data-companion-id="npc_dog"] .combatant-hp').count();
  record('companion: name and HP remain visible', companionPlate === 2, `count=${companionPlate}`);
  const file = await screenshot(page, '05-companion-stance');
  record('companion: screenshot captured', true, file);
  await page.close();
}

async function setupFocusedMotionCombat(page, {
  enemyIds = ['zombie_common'],
  companionIds = [],
  characterId = 'doctor',
  gender = 'F',
} = {}) {
  const setup = await page.evaluate(async config => {
    const [
      { ENEMIES, instantiateEnemy },
      { SECRET_ENEMIES },
      { default: CombatUI },
      { default: CombatSystem },
      { default: GameState },
    ] = await Promise.all([
      import('/js/data/enemies.js'),
      import('/js/data/secretEnemies.js'),
      import('/js/ui/CombatUI.js'),
      import('/js/systems/CombatSystem.js'),
      import('/js/core/GameState.js'),
    ]);

    CombatUI.skipFxQueue();
    CombatUI._fxSpeed = 1;
    CombatUI._screen = document.getElementById('screen-combat');
    GameState.player.characterId = config.characterId;
    GameState.player.gender = config.gender;
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.isAlive = true;
    GameState.companions = [...config.companionIds];
    GameState.npcs ??= { states: {} };
    GameState.npcs.states ??= {};
    for (const id of config.companionIds) {
      GameState.npcs.states[id] = {
        hp: 50,
        maxHp: 50,
        isCompanion: true,
        name: id,
        statusEffects: [],
        skillCooldowns: {},
      };
    }

    const enemies = config.enemyIds.map(id => {
      const definition = ENEMIES[id] ?? SECRET_ENEMIES[id];
      if (!definition) throw new Error(`Unknown focused motion enemy: ${id}`);
      const enemy = instantiateEnemy(definition);
      enemy.lootTable = [];
      enemy.infectionChance = 0;
      return enemy;
    });
    CombatSystem._setupCombat({
      enemies,
      dangerLevel: 3,
      nodeId: 'motion-e2e',
    });
    CombatUI.render();
    window.__motionE2E = { CombatUI, CombatSystem, GameState };
    return {
      enemyIds: enemies.map(enemy => enemy.id),
      companionIds: [...config.companionIds],
      focused: CombatUI._screen?.querySelector('.combat-focused') != null,
    };
  }, { enemyIds, companionIds, characterId, gender });
  await page.waitForSelector('.combat-focused-lineup');
  return setup;
}

async function motionSnapshot(page, selector) {
  return page.locator(`.combatant-piece${selector}`).evaluate(element => {
    const sprite = element.querySelector('.combat-sprite-sheet');
    return {
      actorClasses: [...element.classList],
      terminal: element.dataset.motionTerminal ?? null,
      spriteCount: element.querySelectorAll('.combat-sprite-sheet').length,
      materialized: sprite?.dataset.motionMaterialized ?? null,
      sheetKey: sprite?.dataset.spriteSheetKey ?? null,
      spriteUrl: sprite?.style.getPropertyValue('--sprite-url') ?? '',
      cols: sprite?.style.getPropertyValue('--sprite-cols') ?? '',
      rows: sprite?.style.getPropertyValue('--sprite-rows') ?? '',
      rowY: sprite?.style.getPropertyValue('--sprite-row-y') ?? '',
      duration: sprite?.style.getPropertyValue('--sprite-duration') ?? '',
      animationName: sprite?.style.animationName ?? '',
      iteration: sprite?.style.animationIterationCount ?? '',
      fill: sprite?.style.animationFillMode ?? '',
    };
  });
}

async function scenarioFocusedRangedAndNurseMotions(browser) {
  const page = await newCombatPage(browser);
  const setup = await setupFocusedMotionCombat(page, {
    enemyIds: ['zombie_common'],
    companionIds: ['npc_nurse'],
  });
  record('motion focused: production combat renderer is active', setup.focused, JSON.stringify(setup));

  await page.evaluate(() => {
    window.__motionE2E.CombatUI._playFx({
      kind: 'playerAttack',
      targetIdx: 0,
      motionKey: 'ranged',
      fx: 'shot',
      miss: true,
    });
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-combatant-id="player"] .combat-sprite-sheet')
      ?.style.getPropertyValue('--sprite-row-y') === '28.5714%'
  ));
  const ranged = await motionSnapshot(page, '[data-combatant-id="player"]');
  record(
    'motion: ranged player attack uses row 2 without approach',
    ranged.materialized === 'true'
      && ranged.sheetKey === 'doctor_f'
      && ranged.spriteUrl.includes('doctor_f_sheet.png')
      && ranged.cols === '6'
      && ranged.rows === '8'
      && ranged.rowY === '28.5714%'
      && ranged.iteration === '1'
      && ranged.fill === ''
      && !ranged.actorClasses.includes('motion-move-forward'),
    JSON.stringify(ranged),
  );
  await page.waitForFunction(() => {
    const actor = document.querySelector('[data-combatant-id="player"]');
    const sprite = actor?.querySelector('.combat-sprite-sheet');
    return sprite?.style.getPropertyValue('--sprite-row-y') === '0.0000%'
      && sprite.style.animationIterationCount === 'infinite'
      && !actor.classList.contains('motion-move-forward');
  });

  await page.evaluate(() => {
    window.__motionE2E.CombatUI._playFx({
      kind: 'companionAttack',
      npcId: 'npc_nurse',
      targetIdx: 0,
      motionKey: 'melee',
      fx: 'slash',
      miss: true,
    });
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-combatant-id="npc_nurse"] .combat-sprite-sheet')
      ?.style.getPropertyValue('--sprite-row-y') === '14.2857%'
  ));
  const nurseMelee = await motionSnapshot(page, '[data-combatant-id="npc_nurse"]');
  await page.waitForFunction(() => (
    document.querySelector('[data-combatant-id="npc_nurse"] .combat-sprite-sheet')
      ?.style.getPropertyValue('--sprite-row-y') === '0.0000%'
  ));
  await page.evaluate(() => {
    window.__motionE2E.CombatUI._playFx({
      kind: 'companionHeal',
      npcId: 'npc_nurse',
      targetId: 'player',
      skillId: 'nurse_triage',
      motionKey: 'support',
      amount: 5,
    });
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-combatant-id="npc_nurse"] .combat-sprite-sheet')
      ?.style.getPropertyValue('--sprite-row-y') === '42.8571%'
  ));
  const nurseSupport = await motionSnapshot(page, '[data-combatant-id="npc_nurse"]');
  record(
    'motion: nurse melee and triage use distinct semantic rows',
    nurseMelee.sheetKey === 'nurse_companion'
      && nurseMelee.rowY === '14.2857%'
      && nurseMelee.actorClasses.includes('motion-move-forward')
      && nurseSupport.sheetKey === 'nurse_companion'
      && nurseSupport.rowY === '42.8571%'
      && nurseSupport.iteration === '1'
      && !nurseSupport.actorClasses.includes('motion-move-forward')
      && !nurseSupport.actorClasses.includes('attacking'),
    JSON.stringify({ nurseMelee, nurseSupport }),
  );
  await screenshot(page, '16-motion-ranged-nurse');
  await page.close();
}

async function scenarioFocusedHitDeathAndDormantWake(browser) {
  const hitPage = await newCombatPage(browser);
  await setupFocusedMotionCombat(hitPage, { enemyIds: ['zombie_common'] });
  await hitPage.evaluate(() => {
    const { CombatUI } = window.__motionE2E;
    CombatUI._playSpriteMotion(
      document.querySelector('[data-combatant-id="enemy:0"]'),
      'zombie_common',
      'hit',
    );
  });
  await hitPage.waitForFunction(() => (
    document.querySelector('[data-combatant-id="enemy:0"] .combat-sprite-sheet')
      ?.style.getPropertyValue('--sprite-row-y') === '66.6667%'
  ));
  const hit = await motionSnapshot(hitPage, '[data-combatant-id="enemy:0"]');
  await hitPage.evaluate(() => {
    const { CombatUI, GameState } = window.__motionE2E;
    const actor = document.querySelector('[data-combatant-id="enemy:0"]');
    GameState.combat.enemies[0].currentHp = 0;
    Object.assign(GameState.combat.combatants['enemy:0'], { hp: 0, dead: true });
    actor.classList.add('is-dead');
    CombatUI._deathBurst(actor);
  });
  await hitPage.waitForFunction(() => (
    document.querySelector('[data-combatant-id="enemy:0"]')?.dataset.motionTerminal === 'death'
  ));
  const death = await motionSnapshot(hitPage, '[data-combatant-id="enemy:0"]');
  record(
    'motion: enemy hit returns a distinct terminal death row',
    hit.rowY === '66.6667%'
      && hit.iteration === '1'
      && death.rowY === '100.0000%'
      && death.iteration === '1'
      && death.fill === 'forwards'
      && death.terminal === 'death',
    JSON.stringify({ hit, death }),
  );
  await hitPage.close();

  const wakePage = await newCombatPage(browser);
  await setupFocusedMotionCombat(wakePage, { enemyIds: ['zombie_patient_dormant'] });
  const wakeQueue = await wakePage.evaluate(() => {
    const { CombatSystem, GameState } = window.__motionE2E;
    CombatSystem._runSingleEnemyTurn(0);
    const wakeFx = GameState.combat.fxQueue.filter(fx => (
      fx.kind === 'enemyMotion' && fx.motionKey === 'wake'
    ));
    GameState.combat.fxQueue = [];
    return wakeFx;
  });
  await wakePage.evaluate(fx => window.__motionE2E.CombatUI._playFx(fx), wakeQueue[0]);
  await wakePage.waitForFunction(() => (
    document.querySelector('[data-combatant-id="enemy:0"] .combat-sprite-sheet')
      ?.style.getPropertyValue('--sprite-row-y') === '25.0000%'
  ));
  const wake = await motionSnapshot(wakePage, '[data-combatant-id="enemy:0"]');
  const wakeReplay = await wakePage.evaluate(() => {
    const { CombatSystem, GameState } = window.__motionE2E;
    CombatSystem._runSingleEnemyTurn(0);
    return {
      wakeMotionPlayed: GameState.combat.enemies[0]._wakeMotionPlayed,
      queuedWakeCount: GameState.combat.fxQueue.filter(fx => (
        fx.kind === 'enemyMotion' && fx.motionKey === 'wake'
      )).length,
    };
  });
  record(
    'motion: dormant patient queues and plays wake exactly once',
    wakeQueue.length === 1
      && wake.sheetKey === 'zombie_patient_dormant'
      && wake.rowY === '25.0000%'
      && wake.iteration === '1'
      && wake.fill === ''
      && wakeReplay.wakeMotionPlayed === true
      && wakeReplay.queuedWakeCount === 0,
    JSON.stringify({ wakeQueue, wake, wakeReplay }),
  );
  await wakePage.close();
}

async function scenarioFocusedBloaterAndFeralBoss(browser) {
  const bloaterPage = await newCombatPage(browser);
  await setupFocusedMotionCombat(bloaterPage, { enemyIds: ['zombie_bloater'] });
  await bloaterPage.evaluate(() => {
    window.__motionE2E.CombatUI._playFx({
      kind: 'explode',
      enemyIdx: 0,
      actionId: 'self_destruct',
      motionKey: 'self_destruct',
      dmg: 0,
    });
  });
  await bloaterPage.waitForFunction(() => (
    document.querySelector('[data-combatant-id="enemy:0"] .combat-sprite-sheet')
      ?.style.getPropertyValue('--sprite-row-y') === '60.0000%'
  ));
  const bloaterBody = await motionSnapshot(bloaterPage, '[data-combatant-id="enemy:0"]');
  const overlayBefore = await bloaterPage.locator('.combatant-piece[data-combatant-id="enemy:0"] .cv-fx-explode').count();
  await bloaterPage.waitForSelector('.combatant-piece[data-combatant-id="enemy:0"] .cv-fx-explode');
  const bodyDuringImpact = await bloaterPage.locator('.combatant-piece[data-combatant-id="enemy:0"]').count();
  await bloaterPage.waitForSelector('.combatant-piece[data-combatant-id="enemy:0"]', { state: 'detached' });
  record(
    'motion: bloater self-destruct plays body row before impact and removal',
    bloaterBody.sheetKey === 'zombie_bloater'
      && bloaterBody.rowY === '60.0000%'
      && bloaterBody.iteration === '1'
      && bloaterBody.fill === 'forwards'
      && overlayBefore === 0
      && bodyDuringImpact === 1,
    JSON.stringify({ bloaterBody, overlayBefore, bodyDuringImpact }),
  );
  await bloaterPage.close();

  const bossPage = await newCombatPage(browser);
  await setupFocusedMotionCombat(bossPage, { enemyIds: ['boss_feral_dog_alpha'] });
  const feralCases = [
    ['neck_bite', '14.2857%', true],
    ['frenzy_bite', '28.5714%', true],
    ['pack_howl', '42.8571%', false],
    ['alpha_hunt', '57.1429%', true],
    ['charge', '85.7143%', false],
  ];
  const feralObserved = [];
  for (const [motionKey, rowY, approaches] of feralCases) {
    await bossPage.evaluate(key => {
      window.__motionE2E.CombatUI._playFx({
        kind: 'enemyAttack',
        enemyIdx: 0,
        actionId: key,
        motionKey: key,
        fx: 'claw',
        miss: true,
      });
    }, motionKey);
    await bossPage.waitForFunction(expected => (
      document.querySelector('[data-combatant-id="enemy:0"] .combat-sprite-sheet')
        ?.style.getPropertyValue('--sprite-row-y') === expected
    ), rowY);
    const snapshot = await motionSnapshot(bossPage, '[data-combatant-id="enemy:0"]');
    feralObserved.push({ motionKey, rowY, approaches, snapshot });
    await bossPage.waitForFunction(() => (
      document.querySelector('[data-combatant-id="enemy:0"] .combat-sprite-sheet')
        ?.style.getPropertyValue('--sprite-row-y') === '0.0000%'
    ));
  }
  record(
    'motion: feral alpha maps four actions and charge to five semantic rows',
    feralObserved.every(({ rowY, approaches, snapshot }) => (
      snapshot.sheetKey === 'boss_feral_dog_alpha'
      && snapshot.spriteUrl.includes('boss_feral_dog_alpha_sheet.png')
      && snapshot.cols === '6'
      && snapshot.rows === '8'
      && snapshot.rowY === rowY
      && snapshot.iteration === '1'
      && snapshot.fill === ''
      && snapshot.actorClasses.includes('motion-move-forward') === approaches
    )),
    JSON.stringify(feralObserved),
  );
  await screenshot(bossPage, '17-motion-feral-alpha');
  await bossPage.close();
}

async function scenarioFocusedSpeedSkipAndOwnership(browser) {
  const page = await newCombatPage(browser);
  await setupFocusedMotionCombat(page, {
    enemyIds: ['zombie_common', 'zombie_common'],
    companionIds: ['npc_nurse'],
  });
  const speedStart = await page.evaluate(() => {
    const { CombatUI } = window.__motionE2E;
    CombatUI._fxSpeed = 2;
    const player = document.querySelector('[data-combatant-id="player"]');
    CombatUI._playSpriteMotion(player, 'doctor_f', 'melee');
    CombatUI._motion(player, 'motion-knife-slash', 720);
    return performance.now();
  });
  await page.waitForFunction(() => {
    const player = document.querySelector('[data-combatant-id="player"]');
    return player?.querySelector('.combat-sprite-sheet')?.style.getPropertyValue('--sprite-row-y') === '0.0000%'
      && !player.classList.contains('motion-knife-slash');
  });
  const speedDone = await page.evaluate(() => performance.now());
  record(
    'motion lifecycle: speed 2 halves finite lifetime and restores idle',
    speedDone - speedStart >= 250 && speedDone - speedStart < 650,
    `elapsedMs=${Math.round(speedDone - speedStart)}`,
  );

  const skipResult = await page.evaluate(() => {
    const { CombatUI, GameState } = window.__motionE2E;
    const player = document.querySelector('[data-combatant-id="player"]');
    const ally = document.querySelector('[data-combatant-id="npc_nurse"]');
    const deadEnemy = document.querySelector('[data-combatant-id="enemy:0"]');
    const aliveEnemy = document.querySelector('[data-combatant-id="enemy:1"]');
    CombatUI._playSpriteMotion(aliveEnemy, 'zombie_common', 'basic_attack');
    CombatUI._motion(aliveEnemy, 'motion-zombie-lunge', 720);
    Object.assign(GameState.combat.combatants['enemy:0'], { hp: 0, dead: true });
    GameState.combat.enemies[0].currentHp = 0;
    deadEnemy.classList.add('is-dead');
    CombatUI._deathBurst(deadEnemy);
    Object.assign(GameState.combat.combatants.npc_nurse, { hp: 0, deathsDoor: true });
    GameState.npcs.states.npc_nurse.hp = 0;
    CombatUI._playFx({ kind: 'downed', target: 'ally', targetId: 'npc_nurse' });
    GameState.combat.active = false;
    GameState.combat.outcome = 'victory';
    CombatUI._playFx({ kind: 'victory' });
    const hadPending = CombatUI.skipFxQueue();
    const snapshot = element => {
      const sprite = element.querySelector('.combat-sprite-sheet');
      return {
        rowY: sprite?.style.getPropertyValue('--sprite-row-y') ?? '',
        fill: sprite?.style.animationFillMode ?? '',
        iteration: sprite?.style.animationIterationCount ?? '',
        terminal: element.dataset.motionTerminal ?? null,
        classes: [...element.classList],
      };
    };
    return {
      hadPending,
      player: snapshot(player),
      ally: snapshot(ally),
      deadEnemy: snapshot(deadEnemy),
      aliveEnemy: snapshot(aliveEnemy),
      activeActors: CombatUI._activeMotionActors.size,
      fxTimers: CombatUI._fxTimers.length,
    };
  });
  record(
    'motion lifecycle: skip restores alive idle and preserves terminal actors',
    skipResult.hadPending
      && skipResult.aliveEnemy.rowY === '0.0000%'
      && skipResult.aliveEnemy.iteration === 'infinite'
      && skipResult.aliveEnemy.terminal === null
      && skipResult.deadEnemy.rowY === '100.0000%'
      && skipResult.deadEnemy.fill === 'forwards'
      && skipResult.deadEnemy.terminal === 'death'
      && skipResult.ally.rowY === '100.0000%'
      && skipResult.ally.terminal === 'downed'
      && skipResult.player.rowY === '0.0000%'
      && skipResult.player.terminal === 'victory'
      && skipResult.activeActors === 0
      && skipResult.fxTimers === 0,
    JSON.stringify(skipResult),
  );

  const defeat = await page.evaluate(() => {
    const { CombatUI, GameState } = window.__motionE2E;
    const player = document.querySelector('[data-combatant-id="player"]');
    GameState.combat.outcome = 'defeat';
    Object.assign(GameState.combat.combatants.player, { hp: 0, dead: true });
    GameState.player.isAlive = false;
    CombatUI._playFx({ kind: 'defeat' });
    CombatUI.skipFxQueue();
    const sprite = player.querySelector('.combat-sprite-sheet');
    return {
      terminal: player.dataset.motionTerminal ?? null,
      rowY: sprite?.style.getPropertyValue('--sprite-row-y') ?? '',
      fill: sprite?.style.animationFillMode ?? '',
      classes: [...player.classList],
    };
  });
  record(
    'motion lifecycle: defeat remains a terminal death-row state',
    defeat.terminal === 'defeat'
      && defeat.rowY === '100.0000%'
      && defeat.fill === 'forwards'
      && defeat.classes.includes('motion-defeat'),
    JSON.stringify(defeat),
  );
  await page.close();

  const ownershipPage = await newCombatPage(browser);
  await setupFocusedMotionCombat(ownershipPage, { enemyIds: ['zombie_common'] });
  const sameRoot = await ownershipPage.evaluate(async () => {
    const { CombatUI, GameState } = window.__motionE2E;
    GameState.combat.fxQueue = [{
      kind: 'playerAttack', targetIdx: 0, motionKey: 'melee', fx: 'slash', miss: true,
    }];
    CombatUI._playFxQueue();
    CombatUI.render();
    await new Promise(resolve => setTimeout(resolve, 180));
    const player = document.querySelector('[data-combatant-id="player"]');
    return {
      spriteCount: player?.querySelectorAll('.combat-sprite-sheet').length ?? -1,
      attacking: player?.classList.contains('attacking') ?? true,
      fxTimers: CombatUI._fxTimers.length,
    };
  });
  record(
    'motion lifecycle: same-root rerender drops stale queued callback',
    sameRoot.spriteCount === 0 && !sameRoot.attacking && sameRoot.fxTimers === 0,
    JSON.stringify(sameRoot),
  );
  const replacedScreen = await ownershipPage.evaluate(async () => {
    const { CombatUI, GameState } = window.__motionE2E;
    GameState.combat.fxQueue = [{
      kind: 'playerAttack', targetIdx: 0, motionKey: 'melee', fx: 'slash', miss: true,
    }];
    CombatUI._playFxQueue();
    const oldScreen = CombatUI._screen;
    const replacement = oldScreen.cloneNode(false);
    replacement.id = 'screen-combat-replacement';
    replacement.innerHTML = '<div class="combat-focused replacement-focused"></div>';
    oldScreen.replaceWith(replacement);
    CombatUI._screen = replacement;
    await new Promise(resolve => setTimeout(resolve, 180));
    return {
      replacementMutated: replacement.querySelector('.combat-sprite-sheet, .attacking') != null,
      fxTimers: CombatUI._fxTimers.length,
      activeActors: CombatUI._activeMotionActors.size,
    };
  });
  record(
    'motion lifecycle: detached-screen callback cannot mutate replacement screen',
    !replacedScreen.replacementMutated
      && replacedScreen.fxTimers === 0
      && replacedScreen.activeActors === 0,
    JSON.stringify(replacedScreen),
  );
  await ownershipPage.close();
}

async function setupPatternCombat(page, {
  companionId,
  enemyId,
  companionHp = 50,
  companionMaxHp = 50,
  companionStatusEffects = [],
  playerHp = 100,
  playerMaxHp = 100,
}) {
  return page.evaluate(async config => {
    const [{ ENEMIES, instantiateEnemy }, { default: NPCSystem }, { default: SystemRegistry }] = await Promise.all([
      import('/js/data/enemies.js'),
      import('/js/systems/NPCSystem.js'),
      import('/js/core/SystemRegistry.js'),
    ]);
    const gs = window.GameState;
    const combatSystem = window.CombatSystem;

    Math.random = () => 0;
    SystemRegistry.register('NPCSystem', NPCSystem);

    gs.player.characterId = 'soldier';
    gs.player.hp = { current: config.playerHp, max: config.playerMaxHp };
    gs.player.isAlive = true;
    gs.player.traits = [];
    gs.player.diseases = [];
    gs.player.equipped = {
      ...gs.player.equipped,
      weapon_main: null,
      weapon_sub: null,
    };
    gs.stats.stamina = { ...gs.stats.stamina, current: 100, max: 100 };
    gs.stats.morale = { ...gs.stats.morale, current: 100, max: 100 };
    gs.noise.level = 0;
    gs.companions = [config.companionId];
    gs.npcs = {
      ...(gs.npcs ?? {}),
      states: {
        [config.companionId]: {
          hp: config.companionHp,
          maxHp: config.companionMaxHp,
          isCompanion: true,
          name: config.companionId,
          statusEffects: config.companionStatusEffects.map(status => ({ ...status })),
          skillCooldowns: {},
        },
      },
    };

    const enemy = instantiateEnemy(ENEMIES[config.enemyId]);
    enemy.currentHp = 1000;
    enemy.maxHp = 1000;
    enemy.lootTable = [];
    enemy.infectionChance = 0;
    combatSystem._setupCombat({
      enemies: [enemy],
      dangerLevel: 3,
      nodeId: 'pattern-e2e',
    });

    window.__patternActivateCompanion = () => {
      const combat = gs.combat;
      const companionEntry = combat.turnQueue.find(entry =>
        entry.type === 'companion' && entry.id === config.companionId
      );
      const playerEntry = combat.turnQueue.find(entry => entry.type === 'player');
      const enemyEntries = combat.turnQueue.filter(entry => entry.type === 'enemy');
      combat.turnQueue = [companionEntry, playerEntry, ...enemyEntries].filter(Boolean);
      combat.roundNumber = (combat.roundNumber ?? 0) + 1;
      combat.activeIdx = 0;
      combat.activeTurnIndex = 0;
      return 0;
    };
    window.__patternCompanionAction = (skillId, targetId) => {
      window.__patternActivateCompanion();
      combatSystem.processUntilAllyTurn();
      const activeCombatantId = gs.combat.activeCombatantId;
      const selected = activeCombatantId === config.companionId
        && combatSystem.selectSkill(skillId);
      const targeted = selected && combatSystem.selectTarget(targetId);
      const result = targeted
        ? combatSystem.confirmAction()
        : { ok: false, reason: 'manual_selection_failed', turnConsumed: false };
      return {
        skillId,
        targetId,
        activeCombatantId,
        selected,
        targeted,
        result: {
          ok: result?.ok === true,
          reason: result?.reason ?? null,
          turnConsumed: result?.turnConsumed === true,
        },
      };
    };

    return {
      companionId: config.companionId,
      enemyId: enemy.id,
      initialIntent: enemy._nextIntent,
      formation: {
        ally: [...gs.combat.formations.ally],
        enemy: [...gs.combat.formations.enemy],
      },
    };
  }, {
    companionId,
    enemyId,
    companionHp,
    companionMaxHp,
    companionStatusEffects,
    playerHp,
    playerMaxHp,
  });
}

async function scenarioCompanionMonsterPatterns(browser) {
  const nursePage = await newPatternPage(browser);
  const nurseSetup = await setupPatternCombat(nursePage, {
    companionId: 'npc_nurse',
    enemyId: 'zombie_acid',
    companionHp: 40,
    companionMaxHp: 80,
    companionStatusEffects: [{
      id: 'bleed',
      duration: 2,
      effect: { hpLossPerRound: 3 },
    }],
  });
  const nurseResult = await nursePage.evaluate(() => {
    const action = window.__patternCompanionAction('nurse_triage', 'npc_nurse');
    const state = window.GameState.npcs.states.npc_nurse;
    const combatant = window.GameState.combat.combatants.npc_nurse;
    return {
      action,
      hp: state.hp,
      stateStatuses: state.statusEffects.map(status => status.id),
      combatantStatuses: combatant.statusEffects.map(status => status.id),
      intent: window.GameState.combat.enemies[0]._nextIntent,
    };
  });
  record(
    'pattern: acid predator commits to the bleeding nurse',
    nurseSetup.initialIntent?.targetIds?.includes('npc_nurse') === true,
    JSON.stringify(nurseSetup.initialIntent),
  );
  record(
    'pattern: nurse triage heals herself and removes bleed',
    nurseResult.action.skillId === 'nurse_triage'
      && nurseResult.action.targetId === 'npc_nurse'
      && nurseResult.action.selected
      && nurseResult.action.targeted
      && nurseResult.action.result.ok
      && nurseResult.hp > 40
      && !nurseResult.stateStatuses.includes('bleed')
      && !nurseResult.combatantStatuses.includes('bleed'),
    JSON.stringify(nurseResult),
  );
  await screenshot(nursePage, '10-pattern-nurse-acid');
  await nursePage.close();

  const deserterPage = await newPatternPage(browser);
  const deserterSetup = await setupPatternCombat(deserterPage, {
    companionId: 'npc_soldier_deserter',
    enemyId: 'raider_elite',
  });
  const deserterResult = await deserterPage.evaluate(() => {
    const enemy = window.GameState.combat.enemies[0];
    window.CombatSystem._runSingleEnemyTurn(0);
    const telegraphBefore = enemy._telegraph
      ? { ...enemy._telegraph, targetRanks: { ...(enemy._telegraph.targetRanks ?? {}) } }
      : null;
    const committedBefore = enemy._enemyActionState?.committedAction
      ? {
          actionId: enemy._enemyActionState.committedAction.actionId,
          targetIds: [...enemy._enemyActionState.committedAction.targetIds],
          state: enemy._enemyActionState.committedAction.state,
        }
      : null;
    const action = window.__patternCompanionAction(
      'deserter_covering_fire',
      'enemy:0',
    );
    return {
      action,
      telegraphBefore,
      committedBefore,
      telegraphAfter: enemy._telegraph,
      aimedShotCooldown: enemy._skillCooldowns?.aimed_shot ?? 0,
      hesitation: window.GameState.combat.combatants['enemy:0'].tokens.hesitation ?? 0,
    };
  });
  record(
    'pattern: elite aimed shot preserves its committed target through telegraph',
    deserterSetup.initialIntent?.actionId === 'aimed_shot'
      && deserterResult.committedBefore?.actionId === 'aimed_shot'
      && JSON.stringify(deserterResult.committedBefore?.targetIds)
        === JSON.stringify(deserterSetup.initialIntent?.targetIds),
    JSON.stringify({ initial: deserterSetup.initialIntent, executed: deserterResult.committedBefore }),
  );
  record(
    'pattern: deserter covering fire applies hesitation and cancels aimed shot',
    deserterResult.action.skillId === 'deserter_covering_fire'
      && deserterResult.action.targetId === 'enemy:0'
      && deserterResult.action.selected
      && deserterResult.action.targeted
      && deserterResult.action.result.ok
      && deserterResult.telegraphBefore?.skillId === 'aimed_shot'
      && deserterResult.telegraphAfter === null
      && deserterResult.aimedShotCooldown > 0
      && deserterResult.hesitation > 0,
    JSON.stringify(deserterResult),
  );
  await screenshot(deserterPage, '11-pattern-deserter-elite');
  await deserterPage.close();

  const childPage = await newPatternPage(browser);
  await setupPatternCombat(childPage, {
    companionId: 'npc_child',
    enemyId: 'rabid_dog',
    companionHp: 20,
    companionMaxHp: 50,
  });
  const childResult = await childPage.evaluate(async () => {
    const { COMBAT_SKILLS } = await import('/js/data/combatSkills.js');
    const child = window.GameState.combat.combatants.npc_child;
    const enemy = window.GameState.combat.enemies[0];
    const hide = window.__patternCompanionAction('child_hide', 'npc_child');
    const hpBefore = enemy.currentHp;
    const attack = window.__patternCompanionAction(
      'child_throw_debris',
      'enemy:0',
    );
    const childBlock = child.tokens.block ?? 0;
    const childHpBeforeRabidAttack = child.hp;
    const rabidDamageEvents = [];
    let rabidExecutionAction = null;
    const originalExecuteEnemyAction = window.CombatSystem._executeEnemyCommittedAction;
    window.CombatSystem._executeEnemyCommittedAction = function observeRabidAttack(
      observedEnemy,
      committedAction,
    ) {
      const result = originalExecuteEnemyAction.call(this, observedEnemy, committedAction);
      rabidExecutionAction = {
        actionId: committedAction.actionId,
        targetIds: [...committedAction.targetIds],
        hitCount: committedAction.hitCount,
      };
      rabidDamageEvents.push(...(result?.damageResults ?? []).map(entry => ({
        targetId: entry.targetId,
        amount: entry.amount,
      })));
      return result;
    };
    try {
      window.CombatSystem._runSingleEnemyTurn(0);
    } finally {
      window.CombatSystem._executeEnemyCommittedAction = originalExecuteEnemyAction;
    }
    return {
      hide,
      attack,
      childBlock,
      damage: hpBefore - enemy.currentHp,
      childDamageRange: COMBAT_SKILLS.child_throw_debris.effects
        .find(effect => effect.type === 'damage')?.value,
      rifleDamageRange: COMBAT_SKILLS.deserter_rifle_shot.effects
        .find(effect => effect.type === 'damage')?.value,
      rabidExecutionAction,
      rabidDamageEvents,
      childHpBeforeRabidAttack,
      childHpAfterRabidAttack: child.hp,
    };
  });
  record(
    'pattern: child hide is a self-targeted defensive action',
    childResult.hide.skillId === 'child_hide'
      && childResult.hide.targetId === 'npc_child'
      && childResult.hide.selected
      && childResult.hide.targeted
      && childResult.hide.result.ok
      && childResult.childBlock > 0,
    JSON.stringify(childResult),
  );
  record(
    'pattern: child debris remains a low-damage ranged identity',
    childResult.attack.skillId === 'child_throw_debris'
      && childResult.attack.targetId === 'enemy:0'
      && childResult.attack.selected
      && childResult.attack.targeted
      && childResult.attack.result.ok
      && childResult.damage >= childResult.childDamageRange[0]
      && childResult.damage <= childResult.childDamageRange[1]
      && childResult.childDamageRange[1] < childResult.rifleDamageRange[1],
    JSON.stringify(childResult),
  );
  record(
    'pattern: rabid dog production turn executes both committed hits on the child',
    childResult.rabidExecutionAction?.actionId === 'basic_attack'
      && childResult.rabidExecutionAction?.hitCount === 2
      && childResult.rabidExecutionAction?.targetIds?.length === 1
      && childResult.rabidExecutionAction.targetIds[0] === 'npc_child'
      && childResult.rabidDamageEvents.length === 2
      && childResult.rabidDamageEvents.every(event => event.targetId === 'npc_child')
      && childResult.childHpAfterRabidAttack < childResult.childHpBeforeRabidAttack,
    JSON.stringify(childResult),
  );
  await screenshot(childPage, '12-pattern-child-rabid');
  await childPage.close();

  const rescuePage = await newPatternPage(browser);
  const rescueSetup = await setupPatternCombat(rescuePage, {
    companionId: 'npc_yeongcheol',
    enemyId: 'zombie_charger',
    playerHp: 500,
    playerMaxHp: 1000,
  });
  const rescueResult = await rescuePage.evaluate(async () => {
    const { getRank } = await import('/js/systems/combat/FormationSystem.js');
    const combat = window.GameState.combat;
    const enemy = combat.enemies[0];
    const initialAction = enemy._enemyActionState?.committedAction;
    const initialSnapshot = initialAction
      ? {
          actionId: initialAction.actionId,
          targetIds: [...initialAction.targetIds],
        }
      : null;
    const rankBefore = getRank(combat.formations, 'player');
    const action = window.__patternCompanionAction(
      'yeongcheol_rescue',
      'player',
    );
    const rankAfterRescue = getRank(combat.formations, 'player');
    const blockAfterRescue = combat.combatants.player.tokens.block ?? 0;
    window.CombatSystem._runSingleEnemyTurn(0);
    const chargingAction = enemy._enemyActionState?.committedAction;
    const chargeSnapshot = chargingAction
      ? {
          actionId: chargingAction.actionId,
          targetIds: [...chargingAction.targetIds],
          state: chargingAction.state,
          remainingTelegraphTurns: chargingAction.remainingTelegraphTurns,
        }
      : null;
    window.CombatSystem._runSingleEnemyTurn(0);
    return {
      action,
      initialSnapshot,
      chargeSnapshot,
      rankBefore,
      rankAfterRescue,
      rankAfterImpact: getRank(combat.formations, 'player'),
      blockAfterRescue,
      playerHpAfterImpact: combat.combatants.player.hp,
    };
  });
  record(
    'pattern: yeongcheol rescue moves and guards the wounded player',
    rescueResult.action.skillId === 'yeongcheol_rescue'
      && rescueResult.action.targetId === 'player'
      && rescueResult.action.selected
      && rescueResult.action.targeted
      && rescueResult.action.result.ok
      && rescueResult.rankBefore === 1
      && rescueResult.rankAfterRescue === 2
      && rescueResult.blockAfterRescue > 0,
    JSON.stringify(rescueResult),
  );
  record(
    'pattern: charger keeps the committed target and pushes it on impact',
    rescueSetup.initialIntent?.actionId === 'charge_strike'
      && rescueResult.initialSnapshot?.actionId === 'charge_strike'
      && rescueResult.chargeSnapshot?.actionId === 'charge_strike'
      && JSON.stringify(rescueResult.initialSnapshot?.targetIds)
        === JSON.stringify(rescueResult.chargeSnapshot?.targetIds)
      && rescueResult.rankAfterImpact === 3,
    JSON.stringify(rescueResult),
  );
  await screenshot(rescuePage, '13-pattern-rescue-charger');
  await rescuePage.close();

  const mechanicPage = await newPatternPage(browser);
  await setupPatternCombat(mechanicPage, {
    companionId: 'npc_mechanic',
    enemyId: 'zombie_bloater',
  });
  const mechanicResult = await mechanicPage.evaluate(() => {
    const combat = window.GameState.combat;
    const tripwire = window.__patternCompanionAction(
      'mechanic_tripwire',
      'enemy:0',
    );
    const enemyStatuses = combat.combatants['enemy:0'].statusEffects.map(status => status.id);
    combat.combatants.player.hp = 500;
    combat.combatants.player.maxHp = 1000;
    window.GameState.player.hp = { current: 500, max: 1000 };
    const hpBeforeRepair = combat.combatants.player.hp;
    const repair = window.__patternCompanionAction(
      'mechanic_field_repair',
      'player',
    );
    return {
      tripwire,
      repair,
      enemyStatuses,
      playerBlock: combat.combatants.player.tokens.block ?? 0,
      hpBeforeRepair,
      hpAfterRepair: combat.combatants.player.hp,
      threat: combat.enemies[0]._enemyActionState?.committedAction,
    };
  });
  record(
    'pattern: mechanic tripwire roots the charging bloater threat',
    mechanicResult.tripwire.skillId === 'mechanic_tripwire'
      && mechanicResult.tripwire.targetId === 'enemy:0'
      && mechanicResult.tripwire.selected
      && mechanicResult.tripwire.targeted
      && mechanicResult.tripwire.result.ok
      && mechanicResult.enemyStatuses.includes('rooted')
      && mechanicResult.threat?.actionId === 'self_destruct',
    JSON.stringify(mechanicResult),
  );
  record(
    'pattern: mechanic field repair grants cover without healing',
    mechanicResult.repair.skillId === 'mechanic_field_repair'
      && mechanicResult.repair.targetId === 'player'
      && mechanicResult.repair.selected
      && mechanicResult.repair.targeted
      && mechanicResult.repair.result.ok
      && mechanicResult.playerBlock > 0
      && mechanicResult.hpAfterRepair === mechanicResult.hpBeforeRepair,
    JSON.stringify(mechanicResult),
  );
  await screenshot(mechanicPage, '14-pattern-mechanic-bloater');
  await mechanicPage.close();

  const dogPage = await newPatternPage(browser);
  const dogSetup = await setupPatternCombat(dogPage, {
    companionId: 'npc_dog',
    enemyId: 'zombie_horde',
    playerHp: 500,
    playerMaxHp: 1000,
  });
  const dogResult = await dogPage.evaluate(async () => {
    const { getRank } = await import('/js/systems/combat/FormationSystem.js');
    const combat = window.GameState.combat;
    combat.formations.ally = [null, null, 'player', 'npc_dog'];
    const action = window.__patternCompanionAction('dog_guard', 'player');
    const playerBlock = combat.combatants.player.tokens.block ?? 0;
    const playerHpBeforeHordeAttack = combat.combatants.player.hp;
    const dogHpBeforeHordeAttack = combat.combatants.npc_dog.hp;
    const hordeDamageEvents = [];
    let hordeExecutionAction = null;
    const originalExecuteEnemyAction = window.CombatSystem._executeEnemyCommittedAction;
    window.CombatSystem._executeEnemyCommittedAction = function observeHordeAttack(
      observedEnemy,
      committedAction,
    ) {
      const result = originalExecuteEnemyAction.call(this, observedEnemy, committedAction);
      hordeExecutionAction = {
        actionId: committedAction.actionId,
        targetIds: [...committedAction.targetIds],
        hitCount: committedAction.hitCount,
      };
      hordeDamageEvents.push(...(result?.damageResults ?? []).map(entry => ({
        targetId: entry.targetId,
        amount: entry.amount,
      })));
      return result;
    };
    try {
      window.CombatSystem._runSingleEnemyTurn(0);
    } finally {
      window.CombatSystem._executeEnemyCommittedAction = originalExecuteEnemyAction;
    }
    return {
      action,
      playerRank: getRank(combat.formations, 'player'),
      dogRank: getRank(combat.formations, 'npc_dog'),
      playerBlock,
      intent: combat.enemies[0]._nextIntent,
      hordeExecutionAction,
      hordeDamageEvents,
      playerHpBeforeHordeAttack,
      playerHpAfterHordeAttack: combat.combatants.player.hp,
      dogHpBeforeHordeAttack,
      dogHpAfterHordeAttack: combat.combatants.npc_dog.hp,
    };
  });
  record(
    'pattern: horde intent exposes multi-target and multi-hit behavior',
    dogSetup.initialIntent?.targetIds?.includes('player')
      && dogSetup.initialIntent?.targetIds?.includes('npc_dog')
      && dogSetup.initialIntent?.targetIds?.length === 2
      && dogSetup.initialIntent?.hitCount === 2,
    JSON.stringify(dogSetup.initialIntent),
  );
  record(
    'pattern: dog guard swaps forward and protects the wounded player',
    dogResult.action.skillId === 'dog_guard'
      && dogResult.action.targetId === 'player'
      && dogResult.action.selected
      && dogResult.action.targeted
      && dogResult.action.result.ok
      && dogResult.playerRank === 1
      && dogResult.dogRank === 2
      && dogResult.playerBlock > 0,
    JSON.stringify(dogResult),
  );
  record(
    'pattern: horde production turn spreads both committed hits across player and dog',
    dogResult.hordeExecutionAction?.actionId
      === dogSetup.initialIntent?.actionId
      && dogResult.hordeExecutionAction?.hitCount === 2
      && JSON.stringify(dogResult.hordeExecutionAction?.targetIds)
        === JSON.stringify(dogSetup.initialIntent?.targetIds)
      && dogResult.hordeDamageEvents.length === 2
      && dogResult.hordeDamageEvents.some(event => event.targetId === 'player')
      && dogResult.hordeDamageEvents.some(event => event.targetId === 'npc_dog')
      && dogResult.playerHpAfterHordeAttack < dogResult.playerHpBeforeHordeAttack
      && dogResult.dogHpAfterHordeAttack < dogResult.dogHpBeforeHordeAttack,
    JSON.stringify({ setup: dogSetup, result: dogResult }),
  );
  await screenshot(dogPage, '15-pattern-dog-horde');
  await dogPage.close();
}

async function scenarioOutcomes(browser) {
  const victoryPage = await newCombatPage(browser);
  await victoryPage.evaluate(() => {
    window.GameState.combat.enemies[0].currentHp = 1;
    window.GameState.combat.combatants['enemy:0'].hp = 1;
    Math.random = () => 0;
  });
  await victoryPage.locator('.combat-skill-button[data-command="attack"]:not([disabled])').first().dispatchEvent('click');
  await victoryPage.locator('.combatant-piece.targetable').first().dispatchEvent('click');
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
    window.GameState.combat.combatants.player.hp = 1;
    const enemy = window.GameState.combat.enemies[0];
    enemy.attack = { damage: [100, 100], accuracy: 1 };
    Math.random = () => 0;
  });
  await defeatPage.locator('.combat-skill-button[data-command="attack"]:not([disabled])').first().dispatchEvent('click');
  await defeatPage.locator('.combatant-piece.targetable').first().dispatchEvent('click');
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
  await fleePage.locator('.combat-common-command[data-command="flee"]').dispatchEvent('click');
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
    const visible = await page.locator('.combat-focused-lineup').isVisible();
    const actionVisible = await page.locator('.combat-command-deck').isVisible();
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
  const patternOnly = process.argv.includes('--pattern-only');
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    await scenarioFocusedRangedAndNurseMotions(browser);
    await scenarioFocusedHitDeathAndDormantWake(browser);
    await scenarioFocusedBloaterAndFeralBoss(browser);
    await scenarioFocusedSpeedSkipAndOwnership(browser);
    await scenarioCompanionMonsterPatterns(browser);
    if (!patternOnly) {
      await scenarioInitialLayout(browser);
      await scenarioMove(browser);
      await scenarioRanksAndTargets(browser);
      await scenarioActionsAndStatus(browser);
      await scenarioCompanionStance(browser);
      await scenarioOutcomes(browser);
      await scenarioResponsive(browser);
    }

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
