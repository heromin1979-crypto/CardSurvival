// 카드/슬롯의 실제 좌표를 재서 겹침을 수치로 판정한다.
import { spawn } from 'node:child_process';
import path from 'node:path';
const port = Number(process.env.PORT ?? 43195), base = `http://127.0.0.1:${port}`;
const vite = spawn(process.execPath,
  [path.resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],
  {stdio:['ignore','pipe','pipe']});
vite.stderr.on('data',d=>process.stderr.write(`[vite] ${d}`));
async function wait(ms=25000){const t=Date.now();while(Date.now()-t<ms){try{const r=await fetch(base+'/index.html');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('vite timeout');}
const { chromium } = await import('@playwright/test');
await wait();
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1920,height:1080}});
await page.goto(base+'/index.html',{waitUntil:'networkidle'});
await page.waitForTimeout(2500);
await page.locator('text=새 게임').first().click(); await page.waitForTimeout(1500);
await page.locator('.slot-card[data-slot="0"]').click(); await page.waitForTimeout(800);
await page.locator('#ss-btn-primary').click(); await page.waitForTimeout(2500);
await page.locator('#btn-start').click(); await page.waitForTimeout(6000);
try { await page.locator('text=박상훈 하사를 치료').first().click({timeout:5000}); } catch {}
await page.waitForTimeout(3000);

const r = await page.evaluate(() => {
  const scale = (() => { const app = document.getElementById('app');
    const t = app ? getComputedStyle(app).transform : 'none';
    const m = t && t !== 'none' ? t.match(/matrix\(([^,]+)/) : null; return m ? parseFloat(m[1]) : 1; })();
  const rows = [...document.querySelectorAll('.board-row')].map(row => {
    const label = row.querySelector('.board-row-label')?.textContent?.trim() ?? '?';
    const slots = [...row.querySelectorAll('.slot')].map(s => {
      const b = s.getBoundingClientRect();
      const card = s.querySelector('.card');
      const cb = card ? card.getBoundingClientRect() : null;
      return { x:+(b.x/scale).toFixed(1), w:+(b.width/scale).toFixed(1),
               cx: cb?+(cb.x/scale).toFixed(1):null, cw: cb?+(cb.width/scale).toFixed(1):null };
    });
    // 줄바꿈 지점(다음 슬롯이 왼쪽으로 되돌아감)은 간격이 아니라 행 바뀜이다 — 건너뛴다
    const gaps = []; for (let i=1;i<slots.length;i++) { const g = slots[i].x - (slots[i-1].x + slots[i-1].w);
      if (slots[i].x < slots[i-1].x) continue; gaps.push(+g.toFixed(1)); }
    const cardGaps = []; const filled = slots.filter(s=>s.cx!=null);
    for (let i=1;i<filled.length;i++) { if (filled[i].cx < filled[i-1].cx) continue;
      cardGaps.push(+(filled[i].cx - (filled[i-1].cx + filled[i-1].cw)).toFixed(1)); }
    return { label, n: slots.length, filled: filled.length, gaps, cardGaps,
             slotW: slots[0]?.w ?? null, cardW: filled[0]?.cw ?? null };
  });
  return { scale, rows, cssSlotW: getComputedStyle(document.documentElement).getPropertyValue('--slot-w').trim(),
           cssCardW: getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim(),
           cssGapSm: getComputedStyle(document.documentElement).getPropertyValue('--gap-sm').trim() };
});
console.log(`scale=${r.scale}  토큰: --slot-w ${r.cssSlotW} / --card-w ${r.cssCardW} / --gap-sm ${r.cssGapSm}`);
for (const row of r.rows) {
  const minG = row.gaps.length ? Math.min(...row.gaps) : null;
  const minC = row.cardGaps.length ? Math.min(...row.cardGaps) : null;
  console.log(`\n[${row.label}] 슬롯 ${row.n}칸(카드 ${row.filled}) 슬롯폭 ${row.slotW} 카드폭 ${row.cardW}`);
  console.log(`   슬롯 간격: ${JSON.stringify(row.gaps)}  최소 ${minG}`);
  console.log(`   카드 간격: ${JSON.stringify(row.cardGaps)}  최소 ${minC}`);
  if (minG !== null && minG < 0) console.log(`   ★ 슬롯이 겹친다 (${minG}px)`);
  if (minC !== null && minC < 0) console.log(`   ★ 카드가 겹친다 (${minC}px)`);
}
await browser.close(); vite.kill(); process.exit(0);
