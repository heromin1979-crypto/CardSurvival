// 장소 행(row-top) 카드 캡처 — 카드 높이와 잘린 글자를 눈이 아니라 좌표로 잰다.
// 장소 카드 본문 빌더가 셋이라(_buildSubLocationInner / _buildLandmarkInner / _buildLocationInner)
// 한 화면만 찍으면 나머지 둘이 깨진 것을 못 본다. MODE 로 두 화면을 갈아 끼운다.
//   MODE=sub      (기본) 랜드마크 내부 — 세부장소 카드
//   MODE=district        랜드마크에서 나온 구 목록 — 구 카드 + 랜드마크 카드
// capture-sidebar.mjs 와 같은 경로로 screen-main 까지 들어간다.
import { spawn } from 'node:child_process';
import path from 'node:path';
const port=43184, base=`http://127.0.0.1:${port}`, OUT=process.env.SHOT_DIR;
const TAG=process.env.SHOT_TAG ? `-${process.env.SHOT_TAG}` : '';
const MODE=process.env.MODE ?? 'sub';
const vite=spawn(process.execPath,[path.resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
vite.stderr.on('data',d=>process.stderr.write(`[vite] ${d}`));
async function waitServer(ms=20000){const t=Date.now();while(Date.now()-t<ms){try{const r=await fetch(base+'/index.html');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('vite timeout');}
const { chromium } = await import('@playwright/test');
await waitServer();
const browser=await chromium.launch();
// ZOOM: 배지처럼 9px 안팎인 요소는 1배 캡처로는 눈으로 판정할 수 없다 (좌표는 CSS px 그대로다)
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:Number(process.env.ZOOM ?? 1)});
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

if (MODE === 'district') {
  // 랜드마크 내부 → 현재 구 카드(귀환)를 눌러 구 목록 화면으로 나온다
  const left = await page.evaluate(()=>{
    const c=document.querySelector('.location-card.landmark-return');
    if(!c) return false; c.click(); return true;
  });
  console.log('EXIT_LANDMARK', left);
  await page.waitForTimeout(2500);
  for(let i=0;i<4;i++){
    const t = await page.evaluate(()=>{
      const b=[...document.querySelectorAll('button,.btn,.modal-close,[class*=close]')]
        .find(x=>x.offsetParent && /확인|계속|닫기|OK|✕|×/i.test((x.textContent||'')+(x.className||'')));
      if(b){b.click(); return true;} return null;});
    if(!t) break; await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(1500);
}

console.log('STATE', JSON.stringify(await page.evaluate(()=>({
  screen: document.querySelector('.screen.active')?.id,
  landmark: window.GameState?.location?.currentLandmark ?? null,
  sub: window.GameState?.location?.currentSubLocation ?? null,
  district: window.GameState?.location?.currentDistrict ?? null,
}))));

const row = await page.evaluate(()=>{
  const slots = document.querySelector('.board-row.row-top .board-row-slots');
  if (!slots) return { missing: true };
  const sr = slots.getBoundingClientRect();
  const box = e => { const r = e.getBoundingClientRect();
    return { y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width) }; };
  const cards = [...slots.querySelectorAll('.location-card')].map(c => {
    const r = c.getBoundingClientRect();
    const part = sel => { const e = c.querySelector(sel); if (!e) return null;
      const st = getComputedStyle(e);
      const over = e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1;
      // line-clamp 로 말줄임된 것(설계된 축약)과 상자 밖으로 넘쳐 잘린 것을 가른다.
      const clamped = st.webkitLineClamp && st.webkitLineClamp !== 'none';
      return { ...box(e), text: e.textContent.replace(/\s+/g,' ').trim().slice(0,60),
               ellipsis: clamped && over, clipped: !clamped && over,
               // 넘쳤다면 가로인지 세로인지, 얼마나인지까지 적는다 — 눈으로는 못 가른다
               ...(over ? { over: { sw: e.scrollWidth, cw: e.clientWidth,
                                    sh: e.scrollHeight, ch: e.clientHeight } } : {}) }; };
    // 카드 한가운데 위/아래 두 점이 정말 이 카드에 닿는지 — fixed 요소가 덮은 전례가 있다
    const cx = r.x + r.width/2;
    const covered = [r.y + 8, r.bottom - 8].map(y => {
      const top = document.elementFromPoint(cx, y);
      return top && (c === top || c.contains(top)) ? null
        : (top ? (top.id || top.className || top.tagName).toString().split(' ')[0] : 'none');
    }).filter(Boolean);
    return {
      name: c.querySelector('.lc-name')?.textContent.trim() ?? '?',
      ...box(c),
      overflowsSlot: r.bottom > sr.bottom + 1,
      covered,
      scene: part('.lc-scene'), desc: part('.lc-desc'), bonus: part('.lm-bonus'),
      danger: part('.lc-danger'), meta: part('.lc-meta'), req: part('.lc-req'),
      header: part('.lc-header'),
      // 모서리 배지가 씬을 밀어내지 않는지 — 헤더가 커지면 씬이 그만큼 줄어든다
      badges: {
        left:  c.querySelectorAll('.lc-corner--left .lc-badge').length,
        right: !!c.querySelector('.lc-corner--right')?.firstElementChild,
      },
    };
  });
  const hs = [...new Set(cards.map(c => c.h))];
  const parts = c => [c.desc, c.name, c.req, c.meta, c.bonus, c.danger, c.header];
  return {
    slots: { y: Math.round(sr.y), h: Math.round(sr.height) },
    count: cards.length,
    sameHeight: hs.length <= 1, heights: hs,
    // 설명 줄 위치가 카드마다 다르면 8장이 눈에 어긋나 보인다
    descY: [...new Set(cards.map(c => c.desc?.y ?? null))],
    reqY: [...new Set(cards.map(c => c.req?.y ?? null))],
    headerH: [...new Set(cards.map(c => c.header?.h ?? null))],
    sceneH: [...new Set(cards.map(c => c.scene?.h ?? null))],
    ellipsized: cards.filter(c => parts(c).some(p => p?.ellipsis)).map(c => c.name),
    anyClipped: cards.filter(c => parts(c).some(p => p?.clipped)).map(c => c.name),
    anyCovered: cards.filter(c => c.covered.length).map(c => ({ name: c.name, by: c.covered })),
    cards,
  };
});
console.log('ROW', JSON.stringify(row, null, 2));
await page.screenshot({path:path.join(OUT,`loc-full${TAG}.png`)});
const rowEl = page.locator('.board-row.row-top');
if (await rowEl.count()) await rowEl.first().screenshot({path:path.join(OUT,`loc-row${TAG}.png`)});
if(errs.length) console.log('ERRORS', [...new Set(errs)].slice(0,6));
await browser.close(); vite.kill(); process.exit(0);
