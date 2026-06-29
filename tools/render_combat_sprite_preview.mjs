import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.COMBAT_PREVIEW_BASE_URL ?? 'http://127.0.0.1:58054/';
const outputPath = path.resolve('tmp/combat-sprite-preview.png');

const previewHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/screens-combat.css">
  <style>
    body { margin: 0; background: #050403; }
    .combat-wrap { height: 900px; }
    .combat-main { height: 100%; }
    .combat-visual {
      height: 100%;
      background-image: url('/assets/images/battle_bg.jpg');
      background-size: cover;
      background-position: center;
    }
  </style>
</head>
<body>
  <div class="combat-wrap">
    <div class="combat-main">
      <div class="combat-visual">
        <div class="combat-stage-lineup cv-stage">
          <div class="cv-ally-line">
            <div class="cv-ally cv-ally-unit companion-unit motion-combat-ready" data-companion-id="npc_nurse">
              <div class="cv-rank-token">A1</div>
              <div class="cv-unit-body">
                <span class="cv-ally-icon combat-sprite-sheet cv-companion-sheet"
                  style="--sprite-url:url('/assets/images/combat/spritesheets/nurse_companion_sheet.png');--sprite-cols:6;--sprite-rows:4"></span>
              </div>
              <div class="cv-unit-plate"><div class="cv-unit-name">간호사</div><div class="cv-hp-bar-track"><div class="cv-hp-bar-fill" style="width:100%"></div></div></div>
            </div>
            <div class="cv-ally cv-ally-unit companion-unit motion-firearm-shot" data-companion-id="npc_wounded_soldier">
              <div class="cv-rank-token">A2</div>
              <div class="cv-unit-body">
                <span class="cv-ally-icon combat-sprite-sheet cv-companion-sheet"
                  style="--sprite-url:url('/assets/images/combat/spritesheets/soldier_companion_sheet.png');--sprite-cols:6;--sprite-rows:4"></span>
              </div>
              <div class="cv-unit-plate"><div class="cv-unit-name">박상훈 하사</div><div class="cv-hp-bar-track"><div class="cv-hp-bar-fill" style="width:80%"></div></div></div>
            </div>
            <div class="cv-player cv-ally-unit player-unit player-rank-front player-female motion-knife-slash">
              <div class="cv-rank-token">P-전열</div>
              <div class="cv-unit-body">
                <span class="cv-player-img combat-sprite-sheet cv-player-sheet"
                  style="--sprite-url:url('/assets/images/combat/spritesheets/doctor_f_sheet.png');--sprite-cols:6;--sprite-rows:4"></span>
              </div>
              <div class="cv-unit-plate"><div class="cv-unit-name">이지수</div><div class="cv-hp-bar-track"><div class="cv-hp-bar-fill" style="width:78%"></div></div></div>
            </div>
          </div>
          <div class="cv-lineup-gap"><div class="cv-range-label">중거리</div></div>
          <div class="cv-enemy-line count-3">
            <div class="cv-enemy-sprite enemy-zombie motion-zombie-scream is-target" data-idx="0">
              <span class="cv-enemy-img combat-sprite-sheet cv-enemy-sheet"
                style="--sprite-url:url('/assets/images/combat/spritesheets/enemies/zombie_screamer_sheet.png');--sprite-cols:6;--sprite-rows:4"></span>
              <div class="cv-hp-overlay"><div class="cv-hp-name">스크리머</div><div class="cv-hp-bar-track"><div class="cv-hp-bar-fill" style="width:66%"></div></div><div class="cv-hp-text">40 / 60</div></div>
            </div>
            <div class="cv-enemy-sprite enemy-zombie motion-zombie-heavy" data-idx="1">
              <span class="cv-enemy-img combat-sprite-sheet cv-enemy-sheet"
                style="--sprite-url:url('/assets/images/combat/spritesheets/enemies/boss_horde_mother_sheet.png');--sprite-cols:6;--sprite-rows:4"></span>
              <div class="cv-hp-overlay"><div class="cv-hp-name">무리의 어미</div><div class="cv-hp-bar-track"><div class="cv-hp-bar-fill" style="width:88%"></div></div><div class="cv-hp-text">220 / 250</div></div>
            </div>
            <div class="cv-enemy-sprite enemy-human motion-zombie-lunge" data-idx="2">
              <span class="cv-enemy-img combat-sprite-sheet cv-enemy-sheet"
                style="--sprite-url:url('/assets/images/combat/spritesheets/enemies/rabid_dog_sheet.png');--sprite-cols:6;--sprite-rows:4"></span>
              <div class="cv-hp-overlay"><div class="cv-hp-name">광견병 걸린 개</div><div class="cv-hp-bar-track"><div class="cv-hp-bar-fill" style="width:72%"></div></div><div class="cv-hp-text">36 / 50</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.setContent(previewHtml, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
  const sprites = await page.evaluate(() => [...document.querySelectorAll('.combat-sprite-sheet')].map(el => ({
    className: el.className,
    backgroundImage: getComputedStyle(el).backgroundImage,
    backgroundPositionY: getComputedStyle(el).backgroundPositionY,
    width: getComputedStyle(el).width,
    height: getComputedStyle(el).height,
  })));
  console.log(JSON.stringify({ outputPath, sprites }, null, 2));
} finally {
  await browser.close();
}
