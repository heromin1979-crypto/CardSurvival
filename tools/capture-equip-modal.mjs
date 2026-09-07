// 장비 창 캡처 — 장착 슬롯과 빈 슬롯이 갈리는지 눈으로 확인한다.
// capture-companion-panel.mjs 와 같은 경로로 screen-main 까지 들어간 뒤,
// ?tool=combat 훅(window.__combatTool)으로 몇 슬롯만 강제 장착하고 장비 탭을 연다.
// 자연 플레이로는 장착 상태를 만드는 데 여러 TP 가 들어 캡처 목적에는 맞지 않는다.
import { spawn } from 'node:child_process';
import path from 'node:path';
const port=43183, base=`http://127.0.0.1:${port}`, OUT=process.env.SHOT_DIR;
const TAG = process.env.SHOT_TAG ?? 'equip-modal';
// 빈 슬롯과의 대비를 보려면 일부만 채운다. 전부 채우면 갈리는지 판정할 수 없다.
const FILL = [['gas_mask','face'],['helmet','head'],['pistol','weapon_main'],['small_bag','backpack']];
const vite=spawn(process.execPath,[path.resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
vite.stderr.on('data',d=>process.stderr.write(`[vite] ${d}`));
async function waitServer(ms=20000){const t=Date.now();while(Date.now()-t<ms){try{const r=await fetch(base+'/index.html');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('vite timeout');}
const { chromium } = await import('@playwright/test');
await waitServer();
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,140));});
await page.goto(base+'/index.html?tool=combat',{waitUntil:'networkidle'});
await page.waitForTimeout(2500);
await page.locator('text=새 게임').first().click(); await page.waitForTimeout(1200);
await page.locator('.slot-card[data-slot="0"]').click(); await page.waitForTimeout(600);
await page.locator('#ss-btn-primary').click(); await page.waitForTimeout(2000);
await page.locator('#btn-start').click(); await page.waitForTimeout(6000);
try { await page.locator('text=박상훈 하사를 치료').first().click({timeout:5000}); } catch {}
await page.waitForTimeout(2500);
for(let i=0;i<8;i++){
  const t = await page.evaluate(()=>{
    const b=[...document.querySelectorAll('button,.btn,.modal-close,[class*=close]')]
      .find(x=>x.offsetParent && /확인|계속|닫기|시작|OK|✕|×/i.test((x.textContent||'')+(x.className||'')));
    if(b){b.click(); return (b.textContent||b.className||'').trim().slice(0,24);} return null;});
  if(!t) break; await page.waitForTimeout(1200);
}
await page.waitForTimeout(2000);
console.log('STATE', JSON.stringify(await page.evaluate(()=>({screen:document.querySelector('.screen.active')?.id}))));

console.log('EQUIP', await page.evaluate((fill)=>{
  const t = window.__combatTool;
  if(!t) return 'no __combatTool';
  const { GameState, EquipmentSystem } = t;
  return fill.map(([defId, slot])=>{
    const inst = GameState.createCardInstance(defId);
    if(!inst) return `${defId}: no def`;
    GameState.placeCardInRow(inst.instanceId);
    return `${defId}→${slot}: ${EquipmentSystem.equip(inst.instanceId, slot)}`;
  }).join(' / ');
}, FILL));
await page.waitForTimeout(600);

await page.locator('#bc-char-block').click(); await page.waitForTimeout(1200);
await page.locator('.equip-tab-btn[data-tab="equip"]').click(); await page.waitForTimeout(900);

// 라벨이 상자 밖으로 넘치는지는 눈이 아니라 치수로 본다
console.log('FIT', JSON.stringify(await page.evaluate(()=>{
  const slots=[...document.querySelectorAll('.equip-slot')];
  const clipped=slots.flatMap(s=>[s,...s.querySelectorAll('*')])
    .filter(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)
    .map(e=>`${e.className}:${e.scrollWidth}x${e.scrollHeight}>${e.clientWidth}x${e.clientHeight}`);
  const border=s=>getComputedStyle(s).borderTopColor;
  return {
    slots: slots.length,
    filled: slots.filter(s=>s.classList.contains('has-item')).map(s=>`${s.dataset.slot} ${border(s)}`),
    empty:  slots.filter(s=>!s.classList.contains('has-item')).map(s=>`${s.dataset.slot} ${border(s)}`),
    tags:   [...document.querySelectorAll('.equip-mini-tag')].map(e=>e.textContent),
    clipped,
  };
})));
await page.screenshot({path:path.join(OUT,`${TAG}-full.png`)});
await page.locator('.equip-char-panel').screenshot({path:path.join(OUT,`${TAG}-slots.png`)});
if(errs.length) console.log('ERRORS', [...new Set(errs)].slice(0,6));
await browser.close(); vite.kill(); process.exit(0);
