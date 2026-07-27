import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.COMBAT_E2E_PORT ?? 43179);
const baseUrl = `http://127.0.0.1:${port}`;
const defaultScreenshotPath = path.resolve('tmp/combat-screen-default.png');
const selectedScreenshotPath = path.resolve('tmp/combat-screen-selected.png');

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
    // 게임은 1920×1080 고정 해상도(Scale 방식) — 설계 해상도로 검증
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`${baseUrl}/combat-test.html`, { waitUntil: 'networkidle' });
    // focused(랭크) 레이아웃 기준 검증 — 진형 라인업 + 커맨드 덱
    await page.waitForSelector('.combat-focused-lineup');
    await page.waitForSelector('.combat-command-deck');

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
      const markers = [...document.querySelectorAll('.combat-rank-marker')];
      const medallion = document.querySelector('.combat-round-medallion');
      const icons = [...document.querySelectorAll('.skill-icon-img')];
      return {
        cardFrameImage: getComputedStyle(focused).getPropertyValue('--combat-card-frame-image').trim(),
        markerDisplays: markers.map(marker => getComputedStyle(marker).display),
        markerLabels: markers.map(marker => marker.textContent.trim()),
        medallionBefore: getComputedStyle(medallion, '::before').content,
        medallionAfter: getComputedStyle(medallion, '::after').content,
        iconBlendModes: [...new Set(icons.map(icon => getComputedStyle(icon).mixBlendMode))],
      };
    });
    if (visualContracts.cardFrameImage) {
      throw new Error(`Focused wrapper still exposes a baked card frame: ${visualContracts.cardFrameImage}`);
    }
    if (
      visualContracts.markerLabels.join(',') !== '1,2,3,4'
      || visualContracts.markerDisplays.some(display => display === 'none')
    ) {
      throw new Error(`Rank guides are not visible in order: ${JSON.stringify(visualContracts)}`);
    }
    if (
      visualContracts.medallionBefore !== 'none'
      || visualContracts.medallionAfter !== 'none'
    ) {
      throw new Error(`Round medallion connector lines remain: ${JSON.stringify(visualContracts)}`);
    }
    if (visualContracts.iconBlendModes.some(mode => mode !== 'screen')) {
      throw new Error(`Skill icons do not use screen blending: ${visualContracts.iconBlendModes.join(',')}`);
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

    console.log(`combat-screen:ok default=${defaultScreenshotPath} selected=${selectedScreenshotPath}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
