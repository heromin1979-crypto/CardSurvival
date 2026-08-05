import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.COMBAT_E2E_PORT ?? 43179);
const baseUrl = `http://127.0.0.1:${port}`;
const defaultScreenshotPath = path.resolve('tmp/combat-screen-default.png');
const selectedScreenshotPath = path.resolve('tmp/combat-screen-selected.png');
const mobileResultScreenshotPath = path.resolve('tmp/combat-result-product-mobile.png');

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

function captureBrowserDiagnostics(page, browserErrors) {
  page.on('pageerror', err => browserErrors.push({ type: 'pageerror', message: err.message }));
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      browserErrors.push({ type: msg.type(), message: msg.text() });
    }
  });
  page.on('requestfailed', request => {
    if (['document', 'script', 'stylesheet'].includes(request.resourceType())) {
      browserErrors.push({
        type: 'requestfailed',
        url: request.url(),
        failure: request.failure()?.errorText ?? '',
      });
    }
  });
}

async function main() {
  const { chromium } = await loadPlaywright();
  const server = startServer();
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    // 게임은 1920×1080 고정 해상도(Scale 방식) — 설계 해상도로 검증
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const browserErrors = [];
    captureBrowserDiagnostics(page, browserErrors);
    await page.goto(`${baseUrl}/combat-test.html`, { waitUntil: 'networkidle' });
    // focused(랭크) 레이아웃 기준 검증 — 진형 라인업 + 커맨드 덱
    await page.waitForSelector('.combat-focused-lineup');
    await page.waitForSelector('.combat-command-deck');

    // 실제 focused portrait는 정적 span을 미리 심지 않고 첫 semantic motion에서 동적 materialize한다.
    const initialFocusedSpriteCount = await page.locator('.combatant-piece[data-combatant-id="player"] .combat-sprite-sheet').count();
    await page.evaluate(async () => {
      const [{ default: CombatUI }, { default: GameState }] = await Promise.all([
        import('/js/ui/CombatUI.js'),
        import('/js/core/GameState.js'),
      ]);
      GameState.player.characterId = 'doctor';
      GameState.player.gender = 'F';
      CombatUI.render();
      CombatUI._playFx({
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
    const focusedSpriteContract = await page.locator('.combatant-piece[data-combatant-id="player"]').evaluate(actor => {
      const sprite = actor.querySelector('.combat-sprite-sheet');
      return {
        count: actor.querySelectorAll('.combat-sprite-sheet').length,
        materialized: sprite?.dataset.motionMaterialized ?? null,
        sheetKey: sprite?.dataset.spriteSheetKey ?? null,
        spriteUrl: sprite?.style.getPropertyValue('--sprite-url') ?? '',
        cols: sprite?.style.getPropertyValue('--sprite-cols') ?? '',
        rows: sprite?.style.getPropertyValue('--sprite-rows') ?? '',
        rowY: sprite?.style.getPropertyValue('--sprite-row-y') ?? '',
        iteration: sprite?.style.animationIterationCount ?? '',
        fill: sprite?.style.animationFillMode ?? '',
        movedForward: actor.classList.contains('motion-move-forward'),
      };
    });
    if (
      initialFocusedSpriteCount !== 0
      || focusedSpriteContract.count !== 1
      || focusedSpriteContract.materialized !== 'true'
      || focusedSpriteContract.sheetKey !== 'doctor_f'
      || !focusedSpriteContract.spriteUrl.includes('doctor_f_sheet.png')
      || focusedSpriteContract.cols !== '6'
      || focusedSpriteContract.rows !== '8'
      || focusedSpriteContract.rowY !== '28.5714%'
      || focusedSpriteContract.iteration !== '1'
      || focusedSpriteContract.fill !== ''
      || focusedSpriteContract.movedForward
    ) {
      throw new Error(`Focused ranged sprite contract failed: ${JSON.stringify({ initialFocusedSpriteCount, focusedSpriteContract })}`);
    }
    await page.waitForFunction(() => {
      const actor = document.querySelector('[data-combatant-id="player"]');
      const sprite = actor?.querySelector('.combat-sprite-sheet');
      return sprite?.style.getPropertyValue('--sprite-row-y') === '0.0000%'
        && sprite.style.animationIterationCount === 'infinite'
        && !actor.classList.contains('motion-move-forward');
    });
    console.log(`combat-focused-motion:ok ${JSON.stringify(focusedSpriteContract)}`);

    const computedBackdrop = await page.locator('.combat-battlefield').evaluate(element => (
      getComputedStyle(element).backgroundImage
    ));
    const backdropMatch = computedBackdrop.match(/url\(["']?([^"')]+combat_jongno_subway_clean_v2\.png)["']?\)/);
    if (!backdropMatch) {
      throw new Error(`Focused battlefield did not expose the clean backdrop URL: ${computedBackdrop}`);
    }
    const backdropResponse = await page.request.get(backdropMatch[1]);
    if (!backdropResponse.ok()) {
      throw new Error(`Focused battlefield backdrop request failed: ${backdropResponse.status()} ${backdropMatch[1]}`);
    }
    console.log(`combat-backdrop:ok status=${backdropResponse.status()} url=${backdropMatch[1]}`);

    // 초상화 스트립과 스킬 카드 스탯 표기 확인
    await page.waitForSelector('.combat-round-track .init-portrait');
    await page.waitForSelector('.combat-skill-button .skill-stat');

    const visualContracts = await page.evaluate(() => {
      const focused = document.querySelector('.combat-focused');
      const stageFloor = document.querySelector('.combat-stage-floor');
      const markers = [...document.querySelectorAll('.combat-rank-marker')];
      const medallion = document.querySelector('.combat-round-medallion');
      const icons = [...document.querySelectorAll('.skill-icon-img')];
      const actionCards = [...document.querySelectorAll('.combat-action-card')];
      const protectedElements = [
        ...document.querySelectorAll('.combatant-piece'),
        ...document.querySelectorAll('.combat-status-card'),
        document.querySelector('.combat-event-ticker'),
      ].filter(Boolean);
      const rect = element => {
        const bounds = element.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height,
        };
      };
      const overlaps = (a, b) => (
        a.left < b.right
        && a.right > b.left
        && a.top < b.bottom
        && a.bottom > b.top
      );
      const markerBoxes = markers.map(rect);
      const protectedBoxes = protectedElements.map(rect);
      return {
        cardFrameImage: getComputedStyle(focused).getPropertyValue('--combat-card-frame-image').trim(),
        actionCardCount: actionCards.length,
        actionCardBackgrounds: actionCards.map(card => getComputedStyle(card).backgroundImage),
        stageFloorDisplay: getComputedStyle(stageFloor).display,
        stageFloorVisibility: getComputedStyle(stageFloor).visibility,
        stageFloorOpacity: Number(getComputedStyle(stageFloor).opacity),
        markerDisplays: markers.map(marker => getComputedStyle(marker).display),
        markerLabels: markers.map(marker => marker.textContent.trim()),
        markerBoxes,
        markerOverlapCount: markerBoxes.reduce(
          (count, markerBox) => count + protectedBoxes.filter(box => overlaps(markerBox, box)).length,
          0,
        ),
        medallionBefore: getComputedStyle(medallion, '::before').content,
        medallionAfter: getComputedStyle(medallion, '::after').content,
        iconCount: icons.length,
        iconLoaded: icons.map(icon => icon.complete && icon.naturalWidth > 0),
        iconBlendModes: [...new Set(icons.map(icon => getComputedStyle(icon).mixBlendMode))],
      };
    });
    if (visualContracts.cardFrameImage) {
      throw new Error(`Focused wrapper still exposes a baked card frame: ${visualContracts.cardFrameImage}`);
    }
    if (
      visualContracts.stageFloorDisplay === 'none'
      || visualContracts.stageFloorVisibility !== 'visible'
      || visualContracts.stageFloorOpacity <= 0
      || visualContracts.markerLabels.join(',') !== '1,2,3,4'
      || visualContracts.markerDisplays.some(display => display === 'none')
      || visualContracts.markerBoxes.some(box => box.width <= 0 || box.height <= 0)
    ) {
      throw new Error(`Rank guides are not visible in order: ${JSON.stringify(visualContracts)}`);
    }
    if (visualContracts.markerOverlapCount > 0) {
      throw new Error(`Rank guides overlap combatants or HUD: ${JSON.stringify(visualContracts)}`);
    }
    if (
      visualContracts.medallionBefore !== 'none'
      || visualContracts.medallionAfter !== 'none'
    ) {
      throw new Error(`Round medallion connector lines remain: ${JSON.stringify(visualContracts)}`);
    }
    if (
      visualContracts.iconCount === 0
      || visualContracts.iconLoaded.some(loaded => !loaded)
      || visualContracts.iconBlendModes.some(mode => mode !== 'screen')
    ) {
      throw new Error(`Skill icons do not use screen blending: ${visualContracts.iconBlendModes.join(',')}`);
    }
    if (
      visualContracts.actionCardCount === 0
      || visualContracts.actionCardBackgrounds.some(background => background.includes('url('))
    ) {
      throw new Error(`Action cards still use a baked image: ${JSON.stringify(visualContracts.actionCardBackgrounds)}`);
    }

    await mkdir(path.dirname(defaultScreenshotPath), { recursive: true });
    await page.screenshot({ path: defaultScreenshotPath, fullPage: true });

    // 공격 스킬 선택 → 유효 타겟 하이라이트 → 대상 지정으로 피해 발생 확인
    const hpBefore = await page.evaluate(() => (
      Object.values(window.GameState.combat.combatants)
        .filter(c => c.side === 'enemy')
        .reduce((sum, c) => sum + c.hp, 0)
    ));
    await page.locator('.combat-skill-button:not(.disabled)').first().click();
    await page.waitForSelector('.combatant-piece.targetable');
    await page.waitForSelector('.combat-skill-button.selected');
    await page.mouse.move(960, 30);
    await page.screenshot({ path: selectedScreenshotPath, fullPage: true });
    await page.locator('.combatant-piece.targetable').first().click();
    await page.waitForFunction(previous => {
      const combat = window.GameState.combat;
      if (!combat?.active) return true;
      const total = Object.values(combat.combatants)
        .filter(c => c.side === 'enemy')
        .reduce((sum, c) => sum + c.hp, 0);
      return total < previous || combat.log.some(line => line.includes('빗나감') || line.includes('회피'));
    }, hpBefore);

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    captureBrowserDiagnostics(mobilePage, browserErrors);
    await mobilePage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await mobilePage.waitForSelector('#loading-overlay', { state: 'detached' });
    await mobilePage.evaluate(async () => {
      const [{ default: EventBus }, { default: GameState }] = await Promise.all([
        import('/js/core/EventBus.js'),
        import('/js/core/GameState.js'),
      ]);
      GameState.player.hp = { current: 72, max: 100 };
      GameState.player.xp = 145;
      GameState.combat.outcome = 'victory';
      GameState.combat.xpGained = 25;
      GameState.combat.rewards = [];
      GameState.combat.rewardItems = [];
      GameState.ui.currentState = 'combat_result';
      EventBus.emit('stateTransition', {
        from: 'combat',
        to: 'combat_result',
        data: { outcome: 'victory', nodeId: 'mapo' },
      });
      window.dispatchEvent(new Event('resize'));
    });
    await mobilePage.waitForSelector('#screen-combat-result.active .combat-result-shell');
    const mobileResultLayout = await mobilePage.evaluate(() => {
      const app = document.querySelector('#app').getBoundingClientRect();
      const shell = document.querySelector('.combat-result-shell').getBoundingClientRect();
      return {
        viewport: { width: innerWidth, height: innerHeight },
        app: { left: app.left, top: app.top, width: app.width, height: app.height },
        shell: { left: shell.left, right: shell.right, width: shell.width, height: shell.height },
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    if (
      mobileResultLayout.app.width < 380
      || mobileResultLayout.app.height < 820
      || mobileResultLayout.shell.width < 340
      || mobileResultLayout.shell.right > mobileResultLayout.viewport.width
      || mobileResultLayout.horizontalOverflow
    ) {
      throw new Error(`Product mobile result did not use the native viewport: ${JSON.stringify(mobileResultLayout)}`);
    }
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: mobileResultScreenshotPath, fullPage: true });
    await mobilePage.close();

    if (browserErrors.length > 0) {
      throw new Error(`Browser diagnostics failed: ${JSON.stringify(browserErrors)}`);
    }

    console.log(`combat-screen:ok default=${defaultScreenshotPath} selected=${selectedScreenshotPath}`);
    console.log(`combat-result-mobile:ok screenshot=${mobileResultScreenshotPath}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
