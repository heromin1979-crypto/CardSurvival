import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const port = 43185, base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
const output = 'docs/analysis/progression-execution';
let browser; const errors = [], checks = [];
try {
  for (let i=0;i<60;i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve=>setTimeout(resolve,250)); }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(base + '/?tool=combat', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__combatToolReady === true);
  await page.evaluate(async () => {
    const [{ default: gs, createDefaultFlags }, { default: dialogue }, { default: main }] = await Promise.all([import('/js/core/GameState.js'), import('/js/ui/DialogueScene.js'), import('/js/screens/Main.js')]);
    dialogue.reset(); gs.flags=createDefaultFlags(); gs.ui.currentState='main'; gs.ui.modalOpen=false;
    gs.location.currentDistrict='yongsan'; gs.location.currentLandmark=null;
    gs.player.characterId='soldier'; gs.player.hp.current=100; gs.player.isAlive=true;
    gs.stats.stamina.current=100; gs.time.day=1; gs.time.totalTP=9; gs.time.tpInDay=9;
    gs.cards={}; gs.board.middle=Array(27).fill(null); gs.board.bottom=Array(20).fill(null); gs.pendingLoot=[];
    gs.player.middlePage3Unlocked=true; gs.player.extraSlots=0;
    gs.quests={active:[{id:'mq_soldier_04', progress:0,startDay:1,startTp:0,deadline:Infinity}],completed:['mq_soldier_01','mq_soldier_02','mq_soldier_03'],pendingBranches:[]};
    for(const [id,quantity] of [['electronic_parts',2],['wire',1]]) {const c=gs.createCardInstance(id,{quantity});gs.placeCardInRow(c.instanceId,'bottom');}
    main._buildLayout();main._updateSidebarButtons();
    document.querySelectorAll('.screen').forEach(el=>el.classList.remove('active'));document.querySelector('#screen-main').classList.add('active');
  });
  await page.locator('[data-action="open-career-projects"]').click();
  await page.locator('[data-scene-choice="soldier_radio"]').click();
  assert.equal(await page.locator('[data-scene-choice="power"]').isDisabled(),true);
  assert.match(await page.locator('[data-scene-choice="power"]').innerText(),/배터리/);
  await page.locator('[data-scene-choice="restore"]').click();
  assert.equal(await page.locator('[data-scene-choice="restore"]').isDisabled(),true);
  assert.equal(await page.locator('[data-scene-choice="activate"]').isDisabled(),true);
  checks.push('실제 메뉴 → 프로젝트 → 부족 배터리 안내 → 수신계통 실제 투입');
  await page.evaluate(async()=>{const gs=(await import('/js/core/GameState.js')).default; const c=gs.createCardInstance('battery');gs.placeCardInRow(c.instanceId,'bottom');});
  await page.locator('[data-scene-choice="back"]').click(); await page.locator('[data-scene-choice="soldier_radio"]').click();
  await page.locator('[data-scene-choice="power"]').click();
  await page.locator('#dialogue-scene-overlay img').evaluateAll(async imgs => { await Promise.all(imgs.map(img => img.decode().catch(()=>{}))); });
  for(const [width,height] of [[1920,1080],[1280,720]]){
    await page.setViewportSize({width,height});
    const box=await page.locator('#dialogue-scene-overlay .npc-scene-panel').boundingBox();
    assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
    await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/task-4-project-${width}.png`});
  }
  await page.locator('[data-scene-choice="activate"]').click();
  const result=await page.evaluate(async()=>{
    const gs=(await import('/js/core/GameState.js')).default;
    const before=JSON.stringify(gs.flags.careerProjects.projects.soldier_radio);
    const saved=gs.serialize();gs.deserialize(saved);
    return {completed:gs.quests.completed.includes('mq_soldier_04'),power:gs.countOnBoard('battery'),stateRestored:JSON.stringify(gs.flags.careerProjects.projects.soldier_radio)===before};
  });
  assert.deepEqual(result,{completed:true,power:1,stateRestored:true});
  checks.push('1280 화면 실제 전원 투입·가동·퀘스트 완료·배터리 보상 1개·저장 복원');
  await page.locator('.npc-scene-leave').click();
  // 완료 보고 큐를 닫은 뒤 QuestPanel의 동일 공정 접근도 확인한다.
  await page.locator('[data-scene-choice="continue"]').click();
  for (let i=0;i<12;i++) {
    if (!await page.locator('[data-scene-choice="continue"]').count()) break;
    await page.locator('[data-scene-choice="continue"]').click();
  }
  await page.evaluate(async()=>{const panel=(await import('/js/ui/QuestPanel.js')).default;const modal=document.getElementById('quest-modal');modal.classList.add('open');panel.mount(document.getElementById('quest-modal-mount'));});
  await page.locator('[data-quest-id="mq_soldier_04"]').click();
  await page.locator('[data-career-project="soldier_radio"]').click();
  assert.equal(await page.locator('[data-scene-choice="operate"]').count(),1);
  checks.push('QuestPanel 완료 목표 공정 보기 → 반복 운영 장면 접근');
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/task-4-ui-results.json`,JSON.stringify({checks,errors,result},null,2));
  console.log(JSON.stringify({checks,errors,result},null,2));
} finally {await browser?.close();server.kill();}
