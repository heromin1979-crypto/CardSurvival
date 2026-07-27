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
    await page.waitForSelector('.combat-stage-lineup', { timeout: 10000 });
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
          stance: 'attack',
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
      const companionIndex = combat.turnQueue.findIndex(entry =>
        entry.type === 'companion' && entry.id === config.companionId
      );
      combat.roundNumber = (combat.roundNumber ?? 0) + 1;
      combat.activeIdx = companionIndex;
      combat.activeTurnIndex = companionIndex;
      combatSystem.beginActiveTurn();
      return companionIndex;
    };
    window.__patternCompanionAction = stance => {
      window.__patternActivateCompanion();
      combatSystem._prepareCompanionTurn(config.companionId);
      const plan = combatSystem._planCompanionAction(config.companionId, stance);
      const result = plan
        ? combatSystem._executePlannedCompanionAction(plan)
        : { ok: false, reason: 'no_plan', turnConsumed: false };
      return {
        plan,
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
    const action = window.__patternCompanionAction('heal');
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
    nurseResult.action.plan?.skillId === 'nurse_triage'
      && nurseResult.action.plan?.targetId === 'npc_nurse'
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
    const action = window.__patternCompanionAction('support');
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
    deserterResult.action.plan?.skillId === 'deserter_covering_fire'
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
    const hide = window.__patternCompanionAction('hold');
    // 공격 태세도 사용 가능한 지원·방어 우선순위를 먼저 따르므로, 다음 턴에는 그 선택지를 cooldown으로 잠가 아이의 공격 정체성을 검증한다.
    window.GameState.npcs.states.npc_child.skillCooldowns.child_warning = 2;
    window.GameState.npcs.states.npc_child.skillCooldowns.reposition = 2;
    window.GameState.npcs.states.npc_child.skillCooldowns.child_hide = 2;
    window.GameState.npcs.states.npc_child.skillCooldowns.guard = 2;
    const hpBefore = enemy.currentHp;
    const attack = window.__patternCompanionAction('attack');
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
    childResult.hide.plan?.skillId === 'child_hide'
      && childResult.hide.plan?.targetId === 'npc_child'
      && childResult.hide.result.ok
      && childResult.childBlock > 0,
    JSON.stringify(childResult),
  );
  record(
    'pattern: child debris remains a low-damage ranged identity',
    childResult.attack.plan?.skillId === 'child_throw_debris'
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
    const action = window.__patternCompanionAction('support');
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
    rescueResult.action.plan?.skillId === 'yeongcheol_rescue'
      && rescueResult.action.plan?.targetId === 'player'
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
    const tripwire = window.__patternCompanionAction('support');
    const enemyStatuses = combat.combatants['enemy:0'].statusEffects.map(status => status.id);
    combat.combatants.player.hp = 500;
    combat.combatants.player.maxHp = 1000;
    window.GameState.player.hp = { current: 500, max: 1000 };
    const hpBeforeRepair = combat.combatants.player.hp;
    const repair = window.__patternCompanionAction('support');
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
    mechanicResult.tripwire.plan?.skillId === 'mechanic_tripwire'
      && mechanicResult.tripwire.result.ok
      && mechanicResult.enemyStatuses.includes('rooted')
      && mechanicResult.threat?.actionId === 'self_destruct',
    JSON.stringify(mechanicResult),
  );
  record(
    'pattern: mechanic field repair grants cover without healing',
    mechanicResult.repair.plan?.skillId === 'mechanic_field_repair'
      && mechanicResult.repair.plan?.targetId === 'player'
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
    const action = window.__patternCompanionAction('hold');
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
    dogResult.action.plan?.skillId === 'dog_guard'
      && dogResult.action.plan?.targetId === 'player'
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
  const patternOnly = process.argv.includes('--pattern-only');
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
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
