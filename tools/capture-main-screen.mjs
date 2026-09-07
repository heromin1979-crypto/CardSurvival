import { spawn } from 'node:child_process';
import path from 'node:path';
const port=43180, base=`http://127.0.0.1:${port}`, OUT=process.env.SHOT_DIR;
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
// 오프닝 딜레마: 첫 선택지 고르기
try { await page.locator('text=박상훈 하사를 치료').first().click({timeout:5000}); } catch {}
await page.waitForTimeout(2500);
// 남은 모달 닫기
for(let i=0;i<8;i++){
  const t = await page.evaluate(()=>{
    const b=[...document.querySelectorAll('button,.btn,.modal-close,[class*=close]')]
      .find(x=>x.offsetParent && /확인|계속|닫기|시작|OK|✕|×/i.test((x.textContent||'')+(x.className||'')));
    if(b){b.click(); return (b.textContent||b.className||'').trim().slice(0,24);} return null;});
  if(!t) break; await page.waitForTimeout(1200);
}
await page.waitForTimeout(2500);
const info = await page.evaluate(()=>{
  const a=document.querySelector('.screen.active');
  const ov=document.getElementById('modal-overlay');
  return {screen:a?a.id:'?', modalOpen: ov ? getComputedStyle(ov).display!=='none' : null};});
console.log('STATE', JSON.stringify(info));
await page.screenshot({path:path.join(OUT,'06-board.png')});
if(errs.length) console.log('ERRORS', [...new Set(errs)].slice(0,6));
await browser.close(); vite.kill(); process.exit(0);
