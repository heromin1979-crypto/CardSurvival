// 좌측 사이드바 캡처 — 섹션 순서를 눈이 아니라 좌표로 잰다.
// 사이드바는 overflow-y:auto 라서 블록이 늘어나면 조용히 스크롤 밖으로 밀린다.
// 그래서 순서뿐 아니라 "잘렸는지"(clipped)까지 함께 찍는다.
// capture-header-chip.mjs 와 같은 경로(일반 플레이 흐름)로 screen-main 까지 들어간다.
import { spawn } from 'node:child_process';
import path from 'node:path';
// NOISE / ENC_MAX 를 주면 소음·무게를 그 값으로 밀어 넣고 찍는다 (낮을 때/높을 때 비교용).
// 훅은 기존 ?tool=combat 핸들(window.__combatTool)을 그대로 쓴다 — 새 디버그 경로를 만들지 않는다.
const port=43183, base=`http://127.0.0.1:${port}`, OUT=process.env.SHOT_DIR;
const TAG=process.env.SHOT_TAG ? `-${process.env.SHOT_TAG}` : '';
const NOISE=process.env.NOISE, ENC_MAX=process.env.ENC_MAX;
const NEEDS_HOOK = NOISE !== undefined || ENC_MAX !== undefined;
const vite=spawn(process.execPath,[path.resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
vite.stderr.on('data',d=>process.stderr.write(`[vite] ${d}`));
async function waitServer(ms=20000){const t=Date.now();while(Date.now()-t<ms){try{const r=await fetch(base+'/index.html');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('vite timeout');}
const { chromium } = await import('@playwright/test');
await waitServer();
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,140));});
await page.goto(base+'/index.html'+(NEEDS_HOOK?'?tool=combat':''),{waitUntil:'networkidle'});
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
if(NEEDS_HOOK){
  const applied = await page.evaluate(({noise,encMax})=>{
    const h=window.__combatTool; if(!h) return {hook:false};
    if(noise!==undefined) h.GameState.noise.level=Number(noise);
    // 무게는 상한만 낮추고 GameState._updateEncumbrance() 가 pct·tier 를 다시 계산하게 둔다.
    // 도구가 구간을 직접 정하면 밸런스와 갈린 화면을 찍게 된다.
    if(encMax!==undefined){
      h.GameState.player.encumbrance.max=Number(encMax);
      h.GameState._updateEncumbrance();
    }
    h.EventBus.emit('statChanged',{stat:'noise'});
    return {hook:true, noise:h.GameState.noise.level, enc:{...h.GameState.player.encumbrance}};
  },{noise:NOISE,encMax:ENC_MAX});
  console.log('APPLIED', JSON.stringify(applied));
  await page.waitForTimeout(600);
}
console.log('STATE', JSON.stringify(await page.evaluate(()=>({screen:document.querySelector('.screen.active')?.id}))));

const sidebar = await page.evaluate(()=>{
  const bar = document.querySelector('.bc-sidebar');
  if (!bar) return { missing: true };
  const br = bar.getBoundingClientRect();
  // 섹션 이름은 제목이 있으면 제목, 없으면 대표 클래스로 적는다
  const label = e => e.querySelector('.bc-side-title')?.textContent.replace(/\s+/g,' ').trim()
    ?? (e.className || e.id || e.tagName).toString().split(' ')[0];
  const rows = [...bar.children].filter(e => e.getBoundingClientRect().height > 0).map(e => {
    const r = e.getBoundingClientRect();
    return { name: label(e), y: Math.round(r.y), h: Math.round(r.height),
             clipped: r.bottom > br.bottom + 1 };
  });
  return {
    box: { x: Math.round(br.x), w: Math.round(br.width), h: Math.round(br.height) },
    scrolls: bar.scrollHeight > bar.clientHeight + 1,
    contentH: bar.scrollHeight, viewH: bar.clientHeight,
    order: rows,
    actionMenuLast: bar.lastElementChild?.classList.contains('bc-sidebar-btns'),
    // 퀘스트 블록(INBOX 2군)이 들어갈 수 있는 세로 여백. 0 이 되면 다음 블록은 잘린다.
    freeBelow: Math.round(br.bottom - parseFloat(getComputedStyle(bar).paddingBottom)
                          - (bar.lastElementChild?.getBoundingClientRect().bottom ?? br.bottom)),
    // 가로로 넘쳐 잘린 글자 — 200px 컬럼에서 라벨이 조용히 잘린 전례가 있다
    overflowX: [...bar.querySelectorAll('.bc-side-title, .toolbar-btn')]
      .filter(e => e.scrollWidth > e.clientWidth + 1)
      .map(e => e.textContent.replace(/\s+/g,' ').trim()),
    // 두 줄로 접힌 섹션 제목 (한 줄 높이의 1.6배 초과)
    wrappedTitles: [...bar.querySelectorAll('.bc-side-title')]
      .filter(e => e.getBoundingClientRect().height > parseFloat(getComputedStyle(e).lineHeight) * 1.6)
      .map(e => e.textContent.replace(/\s+/g,' ').trim()),
    // 지도 블록 — 그려진 지도가 블록을 꽉 채우는지(letterbox 없음), 마커가 몇 개인지.
    // 눈으로는 "지도가 커졌다"를 못 잰다. svg 가 preview 보다 낮으면 위아래에 빈 띠가 남은 것이다.
    map: (()=>{
      const pv = document.getElementById('minimap-preview');
      const svg = pv?.querySelector('svg');
      if (!pv) return null;
      const pr = pv.getBoundingClientRect(), sr = svg?.getBoundingClientRect();
      return {
        preview: { w: Math.round(pr.width), h: Math.round(pr.height) },
        svg: sr ? { w: Math.round(sr.width), h: Math.round(sr.height) } : null,
        viewBox: svg?.getAttribute('viewBox') ?? null,
        letterbox: sr ? Math.round(pr.height - sr.height) : null,
        fillsWidth: sr ? Math.abs(sr.width - pr.width) <= 1 : false,
        markers: pv.querySelectorAll('.sm-mini-marker').length,
        markersShown: [...pv.querySelectorAll('.sm-mini-marker')]
          .filter(g => g.getBoundingClientRect().height > 0).length,
      };
    })(),
    // 소음·무게 블록의 실제 표시값 — 캡처를 눈으로 읽지 않고 문자열로 확인한다
    noise: (()=>{
      const t=(id)=>document.getElementById(id);
      const f=t('noise-fill'), w=t('noise-warn');
      return { pct: t('noise-val')?.textContent, decay: t('noise-decay')?.textContent,
               fillClass: f?.className, fillW: f?.style.width,
               trackH: f ? Math.round(f.getBoundingClientRect().height) : null,
               warnShown: !!(w && w.getBoundingClientRect().height > 0) };
    })(),
    weight: (()=>{
      const t=(id)=>document.getElementById(id);
      const f=t('hud-enc-fill');
      return { value: t('hud-enc')?.textContent, tier: t('hud-enc-tier')?.textContent,
               tierClass: t('hud-enc-tier')?.className, fillClass: f?.className, fillW: f?.style.width };
    })(),
  };
});
console.log('SIDEBAR', JSON.stringify(sidebar, null, 2));
await page.screenshot({path:path.join(OUT,`sidebar-full${TAG}.png`)});
await page.locator('.bc-sidebar').screenshot({path:path.join(OUT,`sidebar${TAG}.png`)});
if(errs.length) console.log('ERRORS', [...new Set(errs)].slice(0,6));
await browser.close(); vite.kill(); process.exit(0);
