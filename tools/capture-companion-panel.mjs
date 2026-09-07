// 우측 동료 패널 캡처 — 빈 상태와 동료 영입 상태를 한 번에 남긴다.
// capture-main-screen.mjs 와 같은 경로로 screen-main 까지 들어간 뒤,
// ?tool=combat 훅(window.__combatTool)으로 동료를 강제 영입해 두 번째 컷을 찍는다.
// 자연 스폰은 구·일차·신뢰도 조건이 필요해 캡처 목적으로는 재현이 어렵다.
import { spawn } from 'node:child_process';
import path from 'node:path';
const port=43181, base=`http://127.0.0.1:${port}`, OUT=process.env.SHOT_DIR;
const RECRUIT = (process.env.RECRUIT_NPCS ?? 'npc_jisu,npc_nurse').split(',');
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
await page.screenshot({path:path.join(OUT,'companion-empty.png')});
await page.locator('#bc-companion').screenshot({path:path.join(OUT,'companion-empty-col.png')});
await page.locator('#bc-comp-status').screenshot({path:path.join(OUT,'companion-empty-status.png')});

const recruited = await page.evaluate((ids)=>{
  const t = window.__combatTool;
  if(!t) return 'no __combatTool';
  const { GameState, NPCSystem, NPCS } = t;
  const out=[];
  for(const id of ids){
    const def = NPCS[id];
    if(!def) { out.push(`${id}: no def`); continue; }
    if(def.companion) def.companion.canRecruit = true;   // 부상 NPC 우회 (canRecruit:false)
    NPCSystem._spawnNPC(id, def);
    GameState.npcs.states[id].trust = 5;
    out.push(`${id}: ${NPCSystem.recruit(id)}`);
  }
  NPCSystem.modBond(ids[0], 45);
  GameState.setStat('morale', 38);
  return out.join(' / ');
}, RECRUIT);
console.log('RECRUIT', recruited);
await page.waitForTimeout(1500);
// 180px 안에 들어갔는지는 눈이 아니라 치수로 확인한다
console.log('FIT', JSON.stringify(await page.evaluate(()=>{
  const p=document.getElementById('bc-companion'), s=document.getElementById('bc-comp-status');
  const pr=p.getBoundingClientRect(), sr=s.getBoundingClientRect();
  const clipped=[...s.querySelectorAll('*')].filter(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)
    .map(e=>`${e.className}:${e.scrollWidth}x${e.scrollHeight}>${e.clientWidth}x${e.clientHeight}`);
  const logBtn=document.querySelector('.notif-log-btn')?.getBoundingClientRect();
  const g=[...s.querySelectorAll('.gauge-track,.gauge-fill')].map(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return `${e.className} ${Math.round(r.width)}x${Math.round(r.height)} ${cs.backgroundImage.slice(0,40)||cs.backgroundColor}`;});
  return { panel:[pr.width,pr.height], status:[sr.width,sr.height], bottomGap: pr.bottom-sr.bottom,
           logBtnGap: logBtn ? logBtn.top - sr.bottom : null, clipped, gauges: g };
})));
await page.screenshot({path:path.join(OUT,'companion-filled.png')});
await page.locator('#bc-companion').screenshot({path:path.join(OUT,'companion-filled-col.png')});
await page.locator('#bc-comp-status').screenshot({path:path.join(OUT,'companion-filled-status.png')});
if(errs.length) console.log('ERRORS', [...new Set(errs)].slice(0,6));
await browser.close(); vite.kill(); process.exit(0);
