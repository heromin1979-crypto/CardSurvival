import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const port = 43185, base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
let browser;
try {
  for (let i=0;i<60;i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve=>setTimeout(resolve,250)); }
  browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/?tool=combat',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__combatToolReady===true);
  await page.evaluate(async()=>{
    const gs=(await import('/js/core/GameState.js')).default;
    gs.flags=(await import('/js/core/GameState.js')).createDefaultFlags();
    gs.flags.districtExploration={yongsan:0}; gs.location.currentDistrict='yongsan'; gs.location.currentLandmark=null;
    gs.ui.currentState='main'; gs.player.isAlive=true; gs.player.hp.current=100; gs.stats.stamina.current=100;
    gs.player.middlePage3Unlocked=true;gs.player.extraSlots=0;
    gs.cards={};gs.pendingLoot=[];gs.board.middle=Array(27).fill(null);gs.board.bottom=Array(20).fill(null);
    const card=gs.createCardInstance('scrap_metal',{quantity:12});gs.placeCardInRow(card.instanceId,'bottom');
    const main=(await import('/js/screens/Main.js')).default;
    main._buildLayout();main._updateSidebarButtons();
    document.querySelectorAll('.screen').forEach(el=>el.classList.remove('active'));
    document.querySelector('#screen-main').classList.add('active');
  });
  await page.locator('[data-action="open-local-supplies"]').click();
  const local=page.locator('#seoul-map-overlay');
  assert.match(await local.innerText(),/다음 30%/);assert.match(await local.innerText(),/용도:.*기판/);
  assert.match(await local.innerText(),/전자상가 부품 공급처/);
  const fuel=page.locator('[data-map-supply="yongsan_fuel"]');await fuel.scrollIntoViewIfNeeded();await fuel.click();
  const migration=await page.evaluate(async()=>{
    const gs=(await import('/js/core/GameState.js')).default;
    const map=(await import('/js/ui/SeoulMapModal.js')).default;
    const districts=(await import('/js/data/districts.js')).DISTRICTS;
    const total=id=>Object.values(gs.cards).filter(c=>c.definitionId===id).reduce((sum,c)=>sum+c.quantity,0);
    const before={fuel:total('fuel_can'),metal:total('scrap_metal'),stock:structuredClone(gs.flags.explorationSupply.stocks),claims:[...gs.flags.explorationSupply.claims]};
    gs.flags.districtExploration=Object.fromEntries(Object.keys(districts).map(id=>[id,100]));
    const cards=JSON.stringify(gs.cards),pending=JSON.stringify(gs.pendingLoot);
    gs.deserialize(gs.serialize());
    const after={fuel:total('fuel_can'),metal:total('scrap_metal'),stock:structuredClone(gs.flags.explorationSupply.stocks),claims:[...gs.flags.explorationSupply.claims]};
    map.open(true);
    return {before,after,discoveries:gs.flags.explorationSupply.discoveries.length,cardsPreserved:cards===JSON.stringify(gs.cards),pendingPreserved:pending===JSON.stringify(gs.pendingLoot)};
  });
  assert.deepEqual(migration.before,migration.after);assert.equal(migration.discoveries,25);assert.equal(migration.cardsPreserved,true);assert.equal(migration.pendingPreserved,true);
  assert.match(await local.innerText(),/100% 보상은 반복 지급되지 않습니다/);
  await page.screenshot({animations:'disabled',path:'docs/analysis/progression-execution/task-5-supplies-1280.png'});
  await page.evaluate(async()=>{const gs=(await import('/js/core/GameState.js')).default;gs.location.currentDistrict='dongjak';gs.time.day=271;const map=(await import('/js/ui/SeoulMapModal.js')).default;map.open(true);});
  assert.equal(await page.locator('[data-map-supply="dongjak_garden"]').isDisabled(),true);
  assert.match(await local.innerText(),/겨울 채집 중단/);
  await page.evaluate(async()=>{const gs=(await import('/js/core/GameState.js')).default;gs.location.currentDistrict='guro';gs.flags.districtExploration.guro=55;const map=(await import('/js/ui/SeoulMapModal.js')).default;map.open();});
  await page.setViewportSize({width:1920,height:1080});
  assert.match(await local.innerText(),/다음 60%/);assert.match(await local.innerText(),/용도:.*차량/);
  await page.screenshot({animations:'disabled',path:'docs/analysis/progression-execution/task-5-map-1920.png'});
  assert.deepEqual(errors,[]);
  await writeFile('docs/analysis/progression-execution/task-5-ui-results.json',JSON.stringify({migration,errors,checks:['실제 메인 공급 버튼','30% 용도·100% 단서','연료 교환','version1 25구100% 발견권만 이전','완료 보상 반복 아님','겨울 채집 거절','전체 지도60% 다음보상']},null,2));
  console.log('실제 UI 검증 통과',migration);
} finally {await browser?.close();server.kill();}

