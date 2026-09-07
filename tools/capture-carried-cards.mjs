// 휴대 행(row-bottom) 카드 캡처 — 수량·내구도 게이지가 아트를 얼마나 먹는지 좌표로 잰다.
// 일반 아이템 카드는 빌더가 하나(_buildInner)뿐이라 화면은 하나지만, 표시 분기는 넷이다.
//   (1) 스택 소모품(붕대·통조림) — 수량 게이지만
//   (2) 도구/무기(수술용 메스·메스) — 내구 게이지만
//   (3) 스택 재료(산딸기) — 둘 다 (내구도 최대치가 100이 아닌 표본)
//   (4) 둘 다 없는 카드 — 시작 소지품이 그대로 남아 섞인다
// 그래서 표본을 휴대 행에 직접 꽂고(placeCardInRow) 한 화면에서 넷을 같이 본다.
// 세 행의 빈 슬롯 플레이스홀더(`::after`)도 같이 잰다 — 계산된 값이라 DOM 검사로는 안 잡힌다.
// capture-location-cards.mjs 와 같은 경로로 screen-main 까지 들어간다.
import { spawn } from 'node:child_process';
import path from 'node:path';
const port=43185, base=`http://127.0.0.1:${port}`, OUT=process.env.SHOT_DIR;
const TAG=process.env.SHOT_TAG ? `-${process.env.SHOT_TAG}` : '';
const vite=spawn(process.execPath,[path.resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
vite.stderr.on('data',d=>process.stderr.write(`[vite] ${d}`));
async function waitServer(ms=20000){const t=Date.now();while(Date.now()-t<ms){try{const r=await fetch(base+'/index.html');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('vite timeout');}
const { chromium } = await import('@playwright/test');
await waitServer();
const browser=await chromium.launch();
// ZOOM: 게이지 글자는 8px 안팎이라 1배 캡처로는 눈으로 판정할 수 없다 (좌표는 CSS px 그대로다)
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

// 표본을 휴대 행에 꽂는다. placeCardInRow 가 cardPlaced 를 쏘고 BoardRenderer 가 다시 그린다.
const seeded = await page.evaluate(async () => {
  const GameState = (await import('/js/core/GameState.js')).default;
  const SAMPLE = [
    ['bandage',       { quantity: 3 }],                    // 스택 소모품 — 내구도 없음
    ['canned_food',   { quantity: 5 }],                    // 스택 가득 참
    ['scalpel',       { durability: 45 }],                 // 도구 — 최대 100
    ['combat_scalpel',{ durability: 12 }],                 // 무기 — 위험 구간
    ['wild_berry',    { quantity: 7 }],                    // 재료 — 최대 내구도 20
  ];
  const out = [];
  for (const [id, over] of SAMPLE) {
    const inst = GameState.createCardInstance(id, over);
    if (!inst) { out.push([id, 'create-fail']); continue; }
    const r = GameState.placeCardInRow(inst.instanceId, 'bottom');
    out.push([id, r ? `${r.row}:${r.slot}` : 'place-fail']);
  }
  return out;
});
console.log('SEEDED', JSON.stringify(seeded));
await page.waitForTimeout(1500);

const row = await page.evaluate(()=>{
  const slots = document.querySelector('.board-row.row-bottom .board-row-slots');
  if (!slots) return { missing: true };
  const sr = slots.getBoundingClientRect();
  const box = e => { const r = e.getBoundingClientRect();
    return { y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width) }; };
  const cards = [...slots.querySelectorAll('.card')].map(c => {
    const r = c.getBoundingClientRect();
    const part = sel => { const e = c.querySelector(sel); if (!e) return null;
      const st = getComputedStyle(e);
      const over = e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1;
      const clamped = st.webkitLineClamp && st.webkitLineClamp !== 'none';
      return { ...box(e), text: e.textContent.replace(/\s+/g,' ').trim().slice(0,40),
               ellipsis: clamped && over, clipped: !clamped && over,
               ...(over ? { over: { sw: e.scrollWidth, cw: e.clientWidth,
                                    sh: e.scrollHeight, ch: e.clientHeight } } : {}) }; };
    const cx = r.x + r.width/2;
    const covered = [r.y + 8, r.bottom - 8].map(y => {
      const top = document.elementFromPoint(cx, y);
      return top && (c === top || c.contains(top)) ? null
        : (top ? (top.id || top.className || top.tagName).toString().split(' ')[0] : 'none');
    }).filter(Boolean);
    // 게이지 채움 폭이 실제 비율과 맞는지 — 최대치가 100이 아닌 아이템에서 어긋난다
    const fill = sel => { const e = c.querySelector(sel); return e ? e.style.width : null; };
    return {
      name: c.querySelector('.card-name')?.textContent.trim() ?? '?',
      ...box(c),
      overflowsSlot: r.bottom > sr.bottom + 1,
      covered,
      header: part('.card-header'), art: part('.card-art'), footer: part('.card-footer'),
      qty: part('.card-gauge--qty'), dur: part('.card-gauge--dur'),
      qtyFill: fill('.card-gauge--qty .card-gauge-fill'),
      durFill: fill('.card-gauge--dur .card-gauge-fill'),
      nameQty: !!c.querySelector('.card-name-qty')?.offsetParent,
      nameDur: !!c.querySelector('.card-name-dur')?.offsetParent,
    };
  });
  const hs = [...new Set(cards.map(c => c.h))];
  const parts = c => [c.header, c.art, c.footer, c.qty, c.dur];
  return {
    slots: { y: Math.round(sr.y), h: Math.round(sr.height) },
    count: cards.length,
    sameHeight: hs.length <= 1, heights: hs,
    // 게이지가 카드마다 다른 높이에 서면 한 행에 선 카드들이 어긋나 보인다
    artH: [...new Set(cards.map(c => c.art?.h ?? null))],
    qtyH: [...new Set(cards.map(c => c.qty?.h ?? null))],
    durH: [...new Set(cards.map(c => c.dur?.h ?? null))],
    ellipsized: cards.filter(c => parts(c).some(p => p?.ellipsis)).map(c => c.name),
    anyClipped: cards.filter(c => parts(c).some(p => p?.clipped)).map(c => c.name),
    anyCovered: cards.filter(c => c.covered.length).map(c => ({ name: c.name, by: c.covered })),
    cards,
  };
});
console.log('ROW', JSON.stringify(row, null, 2));

// 빈 슬롯 플레이스홀더 — 세 행 모두. ::after 는 DOM 검사로 안 잡히므로 계산된 값을 읽는다.
// 재는 순서가 중요하다: 마우스는 **마지막 클릭 자리에 남아** 그 칸만 hover 상태로 찍힌다
// (실제로 바닥 행 한 칸이 hover 문구로 나왔다). 보드 밖으로 치우고 잰다.
await page.mouse.move(1919, 1);
await page.waitForTimeout(300);
const hints = await page.evaluate(() => {
  const out = {};
  for (const key of ['top', 'middle', 'bottom']) {
    const slots = [...document.querySelectorAll(`.board-row.row-${key} .slot`)]
      .filter(s => !s.classList.contains('slot-empty-bg') && !s.children.length);
    const s = slots[0];
    if (!s) { out[key] = { empty: 0 }; continue; }
    const st = getComputedStyle(s, '::after');
    out[key] = { empty: slots.length, hint: s.getAttribute('data-hint'),
                 content: st.content, fontSize: st.fontSize, opacity: st.opacity, color: st.color };
  }
  return out;
});
console.log('EMPTY_SLOT_HINTS', JSON.stringify(hints));
await page.screenshot({path:path.join(OUT,`carried-full${TAG}.png`)});
const rowEl = page.locator('.board-row.row-bottom');
if (await rowEl.count()) await rowEl.first().screenshot({path:path.join(OUT,`carried-row${TAG}.png`)});
if(errs.length) console.log('ERRORS', [...new Set(errs)].slice(0,6));
await browser.close(); vite.kill(); process.exit(0);
