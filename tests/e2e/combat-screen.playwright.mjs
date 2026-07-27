import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.COMBAT_E2E_PORT ?? 43179);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotPath = path.resolve('tmp/combat-screen-playwright.png');

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

    // 공격 스킬 선택 → 유효 타겟 하이라이트 → 대상 지정으로 피해 발생 확인
    const hpBefore = await page.evaluate(() => (
      Object.values(window.GameState.combat.combatants)
        .filter(c => c.side === 'enemy')
        .reduce((sum, c) => sum + c.hp, 0)
    ));
    await page.locator('.combat-skill-button:not(.disabled)').first().click();
    await page.waitForSelector('.combatant-piece.targetable');
    await page.locator('.combatant-piece.targetable').first().click();
    await page.waitForFunction(previous => {
      const combat = window.GameState.combat;
      if (!combat?.active) return true;
      const total = Object.values(combat.combatants)
        .filter(c => c.side === 'enemy')
        .reduce((sum, c) => sum + c.hp, 0);
      return total < previous || combat.log.some(line => line.includes('빗나감') || line.includes('회피'));
    }, hpBefore);

    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`combat-screen:ok screenshot=${screenshotPath}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
