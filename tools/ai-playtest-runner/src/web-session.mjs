import { mkdir } from 'node:fs/promises';
import path from 'node:path';

function ensureCoordinate(point, viewport) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || point.x < 0 || point.y < 0 || point.x >= viewport.width || point.y >= viewport.height) {
    throw new Error('입력 좌표가 viewport 범위를 벗어났습니다.');
  }
}

function safeLabel(label) {
  const normalized = String(label ?? 'screen').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '');
  return normalized || 'screen';
}

export async function createWebSession({
  browserLauncher,
  profileDir,
  evidenceDir,
  url,
  viewport,
  locale = 'ko-KR',
  headless = false,
}) {
  await mkdir(evidenceDir, { recursive: true });
  const launch = browserLauncher ?? (async (targetProfileDir, options) => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
    const { chromium } = await import('playwright');
    return chromium.launchPersistentContext(targetProfileDir, options);
  });
  const context = await launch(profileDir, {
    headless,
    viewport,
    locale,
    devtools: false,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  let screenshotIndex = 0;

  async function screenshot(label) {
    screenshotIndex += 1;
    const number = String(screenshotIndex).padStart(3, '0');
    const outputPath = path.join(evidenceDir, 'screenshot-' + number + '-' + safeLabel(label) + '.png');
    await page.screenshot({ path: outputPath, fullPage: false });
    return outputPath;
  }

  return {
    async screenshot(label) {
      return screenshot(label);
    },
    async click(point) {
      ensureCoordinate(point, viewport);
      await page.mouse.click(point.x, point.y);
    },
    async drag(from, to) {
      ensureCoordinate(from, viewport);
      ensureCoordinate(to, viewport);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 10 });
      await page.mouse.up();
    },
    async key(key) {
      if (typeof key !== 'string' || !key.trim()) {
        throw new Error('입력할 키가 필요합니다.');
      }
      await page.keyboard.press(key);
    },
    async type(text) {
      if (typeof text !== 'string') {
        throw new Error('입력할 텍스트가 필요합니다.');
      }
      await page.keyboard.insertText(text);
    },
    async wait(milliseconds) {
      if (!Number.isInteger(milliseconds) || milliseconds < 0 || milliseconds > 30000) {
        throw new Error('대기 시간은 0~30000ms 정수여야 합니다.');
      }
      await page.waitForTimeout(milliseconds);
    },
    async close() {
      await context.close();
    },
  };
}
