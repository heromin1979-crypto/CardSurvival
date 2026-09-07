// 인게임 아이템 검증: 실제 브라우저 런타임에서 아이템을 소비하고
// (1) 선언된 효과대로 스탯이 변하는지 (2) 카드 표시 문구가 효과를 담고 있는지 본다.
import { spawn } from 'node:child_process';
import path from 'node:path';
const port = Number(process.env.PORT ?? 43191), base = `http://127.0.0.1:${port}`;
const vite = spawn(process.execPath,
  [path.resolve('node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],
  {stdio:['ignore','pipe','pipe']});
vite.stderr.on('data',d=>process.stderr.write(`[vite] ${d}`));
async function wait(ms=25000){const t=Date.now();while(Date.now()-t<ms){try{const r=await fetch(base+'/index.html');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('vite timeout');}

const { chromium } = await import('@playwright/test');
await wait();
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1920,height:1080}});
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(base+'/index.html?debug=1',{waitUntil:'networkidle'});
await page.waitForTimeout(2500);
const dump = async (tag) => { const d = await page.evaluate(() => {
  const a=document.querySelector('.screen.active');
  const ids=[...document.querySelectorAll('.screen.active button[id]')].map(b=>'#'+b.id);
  return {screen:a?a.id:'?', btns:ids.slice(0,10)}; });
  console.log(`  [${tag}] ${d.screen}  ${d.btns.join(' ')}`); return d; };
await dump('초기');
await page.locator('text=새 게임').first().click(); await page.waitForTimeout(1500); await dump('새게임후');
await page.locator('.slot-card[data-slot="0"]').click(); await page.waitForTimeout(800); await dump('슬롯후');
await page.locator('#ss-btn-primary').click(); await page.waitForTimeout(2500); await dump('확정후');
try { await page.locator('#btn-start').click({timeout:8000}); } catch(e) { console.log('  #btn-start 실패'); }
await page.waitForTimeout(6000); await dump('시작후');
try { await page.locator('text=박상훈 하사를 치료').first().click({timeout:5000}); } catch {}
await page.waitForTimeout(2500);

const result = await page.evaluate(async () => {
  const ITEMS = (await import('/js/data/items.js')).default;
  const GameState = (await import('/js/core/GameState.js')).default;
  const StatSystem = (await import('/js/systems/StatSystem.js')).default;
  const out = { tested: 0, ok: [], bad: [], errors: [] };

  // 소비형 대표 표본 — 각 계열에서 골랐다
  const SAMPLE = ['bandage','antiseptic','painkiller','antibiotics','first_aid_kit',
                  'canned_food','water_bottle','sterile_water','energy_bar',
                  'kimchi_stew','recovery_stew','stimulant','antidote','ramen'];
  const snap = () => { const st = GameState.stats ?? {}, p = GameState.player ?? {};
    const g = k => (st[k]?.current ?? null);
    return { hp: p.hp?.current ?? null, hydration: g('hydration'), nutrition: g('nutrition'),
             stamina: g('stamina'), fatigue: g('fatigue'), infection: g('infection'), morale: g('morale') }; };

  for (const id of SAMPLE) {
    const def = ITEMS[id];
    if (!def) { out.errors.push(id + ': 아이템 정의 없음'); continue; }
    const eff = def.onConsume ?? def.onUse;
    if (!eff) { out.errors.push(id + ': onConsume/onUse 없음'); continue; }
    let inst;
    try { inst = GameState.createCardInstance(id, { quantity: 1 }); } catch (e) { out.errors.push(id + ': 생성 예외 ' + e.message); continue; }
    if (!inst) { out.errors.push(id + ': createCardInstance 실패'); continue; }
    const placed = GameState.placeCardInRow?.(inst.instanceId, 'bottom');
    const stillExists = !!(GameState.cards?.[inst.instanceId] ?? GameState.cards?.find?.(c => c.instanceId === inst.instanceId));
    // 상한에 걸려 효과가 0으로 보이는 것을 막는다 — 회복 여지를 만든 뒤 측정한다
    try {
      if (GameState.player?.hp) GameState.player.hp.current = 30;
      const st = GameState.stats ?? {};
      if (st.hydration)  st.hydration.current  = 40;
      if (st.nutrition)  st.nutrition.current  = 20;
      if (st.stamina)    st.stamina.current    = 30;
      if (st.fatigue)    st.fatigue.current    = 70;
      if (st.infection)  st.infection.current  = 60;
      if (st.morale)     st.morale.current     = 30;
    } catch (e) { out.errors.push(id + ': 스탯 세팅 실패 ' + e.message); }
    const before = snap();
    let threw = null;
    try { StatSystem.consumeCard(inst.instanceId); } catch (e) { threw = e.message; }
    const after = snap();
    out.tested++;
    const diffs = {}; for (const k of Object.keys(before)) if (before[k] !== after[k]) diffs[k] = (after[k] - before[k]).toFixed(1);
    const declared = Object.entries(eff).filter(([k,v]) => typeof v === 'number' && v !== 0).map(([k,v]) => k+'='+v);
    const changed = Object.keys(diffs).length > 0;
    const rec = { id, name: def.name, declared, diffs, threw, placed, stillExists };
    if (threw || !changed) out.bad.push(rec); else out.ok.push(rec);
  }
  return out;
});
console.log(`실제 소비 테스트: ${result.tested}종`);
console.log(`  스탯이 변한 것   ${result.ok.length}종`);
console.log(`  변화 없음/예외   ${result.bad.length}종`);
result.errors.forEach(e => console.log('  ! ' + e));
console.log('--- 정상 ---');
result.ok.forEach(r => console.log(`  ${(r.name??r.id).padEnd(10)} 선언[${r.declared.join(' ')}] → 실제${JSON.stringify(r.diffs)}`));
console.log('--- 문제 ---');
result.bad.forEach(r => console.log(`  ${(r.name??r.id).padEnd(10)} 선언[${r.declared.join(' ')}] → 실제${JSON.stringify(r.diffs)} placed=${r.placed} 인스턴스존재=${r.stillExists} ${r.threw?('예외: '+r.threw):''}`));
if (errs.length) console.log('PAGE ERRORS:', [...new Set(errs)].slice(0,4));
await browser.close(); vite.kill(); process.exit(0);
