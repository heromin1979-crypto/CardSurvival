// 상단 중앙 HUD 칩 캡처 — 칩이 보드 첫 행·온보딩 안내 칩·알림 패널과 겹치는지 좌표로 잰다.
// capture-main-screen.mjs 와 같은 경로(일반 플레이 흐름)로 screen-main 까지 들어간다.
// ?tool=combat 훅은 쓰지 않는다 — 그 플래그가 붙으면 의사 오프닝(응급실 진입)을 건너뛰어
// 보드 내용이 실제 플레이와 달라진다 (CharCreate.js `_startGame`).
import { spawn } from 'node:child_process';
import path from 'node:path';
const port=43182, base=`http://127.0.0.1:${port}`, OUT=process.env.SHOT_DIR;
const vite=spawn(process.execPath,[path.resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
vite.stderr.on('data',d=>process.stderr.write(`[vite] ${d}`));
async function waitServer(ms=20000){const t=Date.now();while(Date.now()-t<ms){try{const r=await fetch(base+'/index.html');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('vite timeout');}
const { chromium } = await import('@playwright/test');
await waitServer();
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,140));});
await page.goto(base+'/index.html',{waitUntil:'networkidle'});
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
await page.waitForTimeout(2500);
console.log('STATE', JSON.stringify(await page.evaluate(()=>({screen:document.querySelector('.screen.active')?.id}))));

// 겹침은 눈이 아니라 좌표로 판정한다 — 화면에 fixed 로 떠 있는 요소가 새 블록을 덮은 전례가 있다
console.log('FIT', JSON.stringify(await page.evaluate(()=>{
  const box = e => { if(!e) return null; const r=e.getBoundingClientRect();
    return { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height),
             right:Math.round(r.right), bottom:Math.round(r.bottom) }; };
  const overlaps = (a,b) => !!(a&&b) && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
  const chipEl = document.querySelector('.game-header__center');
  const chip = box(chipEl);
  return {
    text: chipEl?.textContent.replace(/\s+/g,' ').trim(),
    chip, header: box(document.getElementById('game-header')),
    offCenterPx: chip ? Math.round(chip.x + chip.w/2 - 960) : null,
    timeOfDay: document.getElementById('screen-main')?.dataset.timeOfDay,
    hitsFirstRow:    overlaps(chip, box(document.querySelector('#board-container .board-row'))),
    hitsOnboarding:  overlaps(chip, box(document.querySelector('.onboarding-tooltip-card'))),
    hitsNotify:      overlaps(chip, box(document.getElementById('notification-container'))),
    sidebarTemp: document.getElementById('outdoor-temp')?.textContent.trim(),
  };
})));
await page.screenshot({path:path.join(OUT,'header-chip.png')});
await page.locator('#game-header').screenshot({path:path.join(OUT,'header-chip-band.png')});
if(errs.length) console.log('ERRORS', [...new Set(errs)].slice(0,6));
await browser.close(); vite.kill(); process.exit(0);
