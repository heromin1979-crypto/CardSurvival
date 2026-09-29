// 전투 무대 연출 — 배경 깊이(③)와 날씨·광원(④).
// tools/combat-fx-lab 의 ③·④ 개선안을 DOM 전투 화면에 옮긴 것.
//   · 뒤 캔버스(z 0, 캐릭터 뒤): 시간대 색보정 · 어둠 + 광원 구멍(손전등·불·비상등·이펙트 광원) · 빛줄기 · 뒤 안개 · 먼지 · 발밑 그림자
//   · 앞 캔버스(z 20, 캐릭터 앞 · 파티클 캔버스 아래): 비·눈·잔해 · 발목 안개 · 번개 섬광
//   · 캐릭터는 CSS 변수(--env-actor-bright, --env-rim)로 밝기와 림라이트만 조정 — HP·의도 UI는 어둡게 하지 않는다
// 입력: GameState.weather.id (isRainyWeather), GameState.time.hour + NightSystem.isNight(), 보드의 광원 카드, 전투 배경의 env 메타.
import GameState from '../../core/GameState.js';
import SettingsManager from '../../core/SettingsManager.js';
import NightSystem from '../../systems/NightSystem.js';
import { isRainyWeather } from '../../systems/WeatherSystem.js';
import { combatAssetManifest } from '../../data/combatAssets.js';
import CombatFxCanvas from './CombatFxCanvas.js';

const DEFAULT_ENV = { indoor: true, horizon: 0.5, shafts: [0.2, 0.61], fire: { x: 0.845, y: 0.62 }, emergency: { x: 0.9, y: 0.16 } };
const AMB = { day: [10, 10, 14], dusk: [34, 16, 8], night: [6, 10, 26] };
const AMB_A = { day: 0.05, dusk: 0.28, night: 0.46 };
const RIM = { day: 'rgba(255,242,220,0.55)', dusk: 'rgba(255,198,144,0.6)', night: 'rgba(156,194,255,0.6)' };
const ACTOR_BRIGHT = { day: 1, dusk: 0.93, night: 0.85 };
const WEATHER_AMB = { storm: 0.1, monsoon: 0.1, cloudy: 0.06, overcast: 0.06, foggy: 0.04, blizzard: 0.05, rainy: 0.05, acid_rain: 0.06, sunny: -0.04, clear: -0.03, hot: -0.05 };
const WEATHER_FOG = { foggy: 0.7, blizzard: 0.45, monsoon: 0.2, storm: 0.15, rainy: 0.1, snow: 0.15, acid_rain: 0.2 };
const RAIN_COUNT = { rainy: 420, storm: 680, monsoon: 850, acid_rain: 380 };
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = v => Math.max(0, Math.min(1, v));

function glow(ctx, x, y, r, rgb, a) {
  if (a <= 0.005 || r <= 1) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

const CombatStageRenderer = {
  visual: null,
  back: null,
  front: null,
  env: null,
  _raf: 0,
  _last: 0,
  _t: 0,
  wz: null,
  _far: null,
  _farKey: '',
  _camX: 0,

  enabled() {
    return CombatFxCanvas.enabled() && SettingsManager.get('combatFx.enhanced') !== false;
  },

  // CombatUI 렌더 직후마다 호출 — 새 .combat-visual 에 캔버스를 옮겨 붙인다
  mount(visual) {
    if (!visual) return;
    if (!this.enabled()) { this.unmount(visual); return; }
    this.visual = visual;
    this.env = this.readEnv();
    if (!this.back) {
      this.back = this._makeCanvas('combat-env-back');
      this.front = this._makeCanvas('combat-env-front');
      this.wz = { drops: [], splashes: [], flakes: [], debris: [], motes: [], lightning: 0, nextBolt: 2500, boltT: null, bolt: null };
    }
    if (this.back.parentElement !== visual) visual.insertBefore(this.back, visual.firstChild);
    if (this.front.parentElement !== visual) visual.appendChild(this.front);
    const e = this.env;
    visual.classList.add('env-enhanced');
    visual.dataset.envWeather = e.weather;
    visual.dataset.envTime = e.time;
    visual.style.setProperty('--env-actor-bright', String(ACTOR_BRIGHT[e.time]));
    visual.style.setProperty('--env-rim', RIM[e.time]);
    this._resize();
    if (!this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame(t => this._frame(t)); }
  },

  unmount(visual) {
    visual?.classList.remove('env-enhanced');
    this.back?.remove();
    this.front?.remove();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  },

  readEnv() {
    const gs = GameState;
    const weather = gs.weather?.id ?? 'sunny';
    const hour = gs.time?.hour ?? 12;
    let night = false;
    try { night = NightSystem.isNight(); } catch { /* 테스트 환경 */ }
    const time = night || hour >= 21 || hour < 5 ? 'night' : (hour >= 17 || hour < 7) ? 'dusk' : 'day';
    let scene = null;
    try { scene = combatAssetManifest.scene(gs.combat?.sceneId); } catch { /* 기본값 */ }
    const meta = { ...DEFAULT_ENV, ...(scene?.env ?? {}) };
    let flashlight = false;
    try {
      flashlight = (gs.getBoardCards?.() ?? []).some(c => {
        const tags = gs.getCardDef?.(c.instanceId)?.tags ?? [];
        return (tags.includes('light_source') || tags.includes('light')) && (c.durability ?? 100) > 0;
      });
    } catch { /* 보드 없음 */ }
    return { weather, time, flashlight, rainy: isRainyWeather(weather), backdrop: scene?.backdrop ?? null, ...meta };
  },

  _makeCanvas(cls) {
    const c = document.createElement('canvas');
    c.className = cls;
    c.setAttribute('aria-hidden', 'true');
    return c;
  },

  _resize() {
    const r = this.visual.getBoundingClientRect();
    // 반해상도로 그리고 CSS로 늘린다 — 안개·어둠은 부드러운 그라데이션이라 품질 차이가 거의 없다
    const w = Math.max(2, Math.round(Math.min(1920, r.width) * 0.6));
    const h = Math.max(2, Math.round(Math.min(1080, r.height) * 0.6));
    for (const c of [this.back, this.front]) {
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    }
  },

  // 액터 위치(캔버스 좌표)
  _actors() {
    const out = [];
    if (!this.visual) return out;
    const cr = this.back.getBoundingClientRect();
    if (!cr.width) return out;
    const k = this.back.width / cr.width;
    this.visual.querySelectorAll('.combatant-piece, .cv-player, .cv-enemy-sprite, .cv-ally').forEach(el => {
      const r = CombatFxCanvas.bodyRect(el);
      if (!r.width) return;
      out.push({
        el,
        enemy: el.matches('.enemy, .cv-enemy-sprite') || !!el.closest('.combat-line-zone-enemy'),
        player: el.matches('.cv-player, [data-combatant-id="player"]'),
        x: (r.left - cr.left + r.width / 2) * k,
        top: (r.top - cr.top) * k,
        feet: (r.bottom - cr.top) * k,
        w: r.width * k,
        h: r.height * k,
      });
    });
    return out;
  },

  _frame(now) {
    this._raf = 0;
    if (!this.visual?.isConnected || !this.enabled()) { this.unmount(this.visual); return; }
    const dt = now - this._last;
    // 30fps로 충분 — 모바일 발열 억제
    if (dt >= 32) {
      this._last = now;
      this._t += Math.min(80, dt);
      this._update(Math.min(80, dt));
      this._draw();
    }
    this._raf = requestAnimationFrame(t => this._frame(t));
  },

  _update(dt) {
    const e = this.env;
    const wz = this.wz;
    const W = this.front.width, H = this.front.height;
    const s = dt / 1000;
    const k = H / 720; // 랩 무대(720p) 기준 비율
    const shaftsX = e.indoor && e.shafts?.length ? e.shafts : null;
    const spawnX = () => (shaftsX ? shaftsX[Math.floor(Math.random() * shaftsX.length)] * W + rand(-60, 60) * k : rand(-0.15 * W, 1.15 * W));
    const indoorK = e.indoor ? 0.32 : 1;
    const wind = e.weather === 'storm' || e.weather === 'monsoon' ? 0.5 : e.weather === 'windy' ? 0.8 : 0.25;
    const windX = wind * 700 * k;
    const gy = H * 0.84;

    const wantDrops = Math.round((RAIN_COUNT[e.weather] ?? 0) * indoorK * 0.7);
    while (wz.drops.length < wantDrops) wz.drops.push({ x: spawnX(), y: rand(-H, H), l: rand(16, 32) * k, v: rand(1100, 1600) * k, a: rand(0.15, 0.4), gy: gy + rand(-90, 50) * k });
    if (wz.drops.length > wantDrops) wz.drops.length = wantDrops;
    for (const d of wz.drops) {
      d.y += d.v * s; d.x += windX * s;
      if (d.y > d.gy) {
        if (wz.splashes.length < 160 && Math.random() < 0.6) wz.splashes.push({ x: d.x, y: d.gy, t: 0 });
        d.y = rand(-100, -10) * k; d.x = spawnX() - windX * 0.4;
      }
    }
    wz.splashes.forEach(p => { p.t += dt; });
    wz.splashes = wz.splashes.filter(p => p.t < 180);

    const snowy = e.weather === 'snow' || e.weather === 'blizzard';
    const wantFlakes = snowy ? Math.round((e.weather === 'blizzard' ? 650 : 240) * indoorK) : 0;
    while (wz.flakes.length < wantFlakes) wz.flakes.push({ x: spawnX(), y: rand(-H, H), r: rand(0.8, 3) * k, v: rand(50, 140) * k, ph: rand(0, 6) });
    if (wz.flakes.length > wantFlakes) wz.flakes.length = wantFlakes;
    const flakeWind = (e.weather === 'blizzard' ? 900 : 200) * k;
    for (const f of wz.flakes) {
      f.y += f.v * s * (e.weather === 'blizzard' ? 2.2 : 1);
      f.x += (flakeWind + Math.sin(this._t / 600 + f.ph) * 30 * k) * s;
      if (f.y > H + 10 || f.x > W + 200) { f.y = rand(-60, -5) * k; f.x = spawnX() - flakeWind * 0.4; }
    }

    const wantDebris = e.weather === 'windy' ? 30 : 0;
    while (wz.debris.length < wantDebris) wz.debris.push({ x: rand(-W, 0), y: rand(H * 0.4, H), v: rand(300, 700) * k, r: rand(0, 6), s: rand(3, 7) * k, ph: rand(0, 6) });
    if (wz.debris.length > wantDebris) wz.debris.length = wantDebris;
    for (const d of wz.debris) {
      d.x += d.v * s; d.y += Math.sin(this._t / 300 + d.ph) * 40 * k * s; d.r += 6 * s;
      if (d.x > W + 40) { d.x = rand(-200, -20); d.y = rand(H * 0.4, H); }
    }

    if (wz.motes.length < 60) wz.motes.push({ x: rand(0, W), y: rand(0, H), vx: rand(-6, 6) * k, vy: rand(-8, 4) * k, r: rand(0.6, 2) * k, ph: rand(0, 6) });
    for (const m of wz.motes) {
      m.x += m.vx * s; m.y += (m.vy + Math.sin(this._t / 900 + m.ph) * 6 * k) * s;
      if (m.x < -10) m.x = W + 10; if (m.x > W + 10) m.x = -10; if (m.y < -10) m.y = H; if (m.y > H + 10) m.y = 0;
    }

    if (e.weather === 'storm') {
      wz.nextBolt -= dt;
      if (wz.nextBolt <= 0) {
        wz.nextBolt = rand(3000, 7000);
        wz.boltT = 0;
        const pts = [];
        let x = rand(W * 0.15, W * 0.85), y = 0;
        while (y < H * (e.indoor ? 0.3 : 0.42)) { pts.push([x, y]); x += rand(-40, 40) * k; y += rand(20, 50) * k; }
        wz.bolt = pts;
      }
    }
    if (wz.boltT != null) {
      wz.boltT += dt;
      const t = wz.boltT;
      wz.lightning = t < 70 ? 1 : t < 130 ? 0.15 : t < 230 ? 0.85 : Math.max(0, 0.85 - (t - 230) / 400);
      if (t > 700) { wz.boltT = null; wz.lightning = 0; wz.bolt = null; }
    }
  },

  _lights(actors) {
    const e = this.env;
    const W = this.back.width, H = this.back.height;
    const k = H / 720;
    const t = this._t;
    const out = [];
    if (e.flashlight) {
      const p = actors.find(a => a.player);
      const tgt = actors.find(a => a.enemy);
      if (p && tgt) {
        const hx = p.x + p.h * 0.12, hy = p.top + p.h * 0.47;
        const dir = Math.atan2(tgt.top + tgt.h * 0.55 - hy, tgt.x - hx);
        for (const [m, it] of [[1, 0.28], [0.72, 0.3], [0.45, 0.32]]) out.push({ x: hx, y: hy, cone: true, dir, spread: 0.42 * m, radius: 720 * k, rgb: '255,241,208', i: it });
      }
    }
    if (e.fire) {
      const fl = 0.8 + 0.12 * Math.sin(t / 60) + 0.08 * Math.sin(t / 23 + 1.3);
      out.push({ x: e.fire.x * W, y: e.fire.y * H, radius: 360 * k * fl, rgb: '255,154,64', i: fl });
    }
    if (e.emergency && e.indoor) {
      const on = (t % 1400) < 700 ? 1 : 0.25;
      out.push({ x: e.emergency.x * W, y: e.emergency.y * H, radius: 330 * k, rgb: '255,48,48', i: 0.75 * on });
    }
    // 이펙트 동적 광원(총구·타격·충격파) — 파티클 캔버스 좌표 → 이 캔버스 좌표
    const fxc = CombatFxCanvas.canvas;
    if (fxc?.width && CombatFxCanvas.lights.length) {
      const sx = W / fxc.width, sy = H / fxc.height;
      for (const l of CombatFxCanvas.lights) {
        const p = l.follow ? l.follow() : l;
        const u = l.age / l.duration;
        const n = parseInt((l.color || '#ffffff').slice(1), 16);
        out.push({ x: p.x * sx, y: p.y * sy, radius: l.radius * sx, rgb: `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`, i: l.intensity * (1 - u) ** 1.5 });
      }
    }
    return out;
  },

  _draw() {
    const e = this.env;
    const wz = this.wz;
    const b = this.back.getContext('2d');
    const f = this.front.getContext('2d');
    const W = this.back.width, H = this.back.height;
    const k = H / 720;
    const actors = this._actors();
    const lights = this._lights(actors);

    // ── 뒤 캔버스 ──
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalCompositeOperation = 'source-over';
    b.globalAlpha = 1;
    b.clearRect(0, 0, W, H);
    // 원경: 배경 윗부분(지평선 위)을 흐리게 다시 깔고, 카메라 연출 방향으로 살짝 밀어 패럴랙스를 만든다
    const far = this._farLayer(W, H);
    if (far) {
      const cls = this.visual.classList;
      const target = [...cls].some(c => c.startsWith('camera-ally')) ? -10 * k : [...cls].some(c => c.startsWith('camera-enemy')) ? 10 * k : 0;
      this._camX += (target - this._camX) * 0.12;
      b.drawImage(far, this._camX, 0);
    }
    // 어둠 (배경만) — 광원 자리를 뚫는다
    let amb = AMB_A[e.time] + (e.indoor ? 0.05 : 0) + (WEATHER_AMB[e.weather] ?? 0);
    amb = clamp01(amb * (1 - wz.lightning * 0.85));
    b.fillStyle = `rgba(${AMB[e.time]},${amb})`;
    b.fillRect(0, 0, W, H);
    b.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (l.i <= 0.01) continue;
      const g = b.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius);
      g.addColorStop(0, `rgba(0,0,0,${clamp01(l.i)})`);
      g.addColorStop(0.55, `rgba(0,0,0,${clamp01(l.i) * 0.45})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = g;
      b.save();
      if (l.cone) { b.beginPath(); b.moveTo(l.x, l.y); b.arc(l.x, l.y, l.radius, l.dir - l.spread, l.dir + l.spread); b.closePath(); b.clip(); }
      b.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
      b.restore();
    }
    // 빛줄기
    b.globalCompositeOperation = 'lighter';
    const shaftRgb = e.time === 'dusk' ? '255,190,130' : e.time === 'day' ? '255,245,225' : '150,180,230';
    for (const [i, fx] of (e.indoor ? e.shafts ?? [] : [0.72]).entries()) {
      const x = fx * W;
      const topW = (e.indoor ? 70 : 160) * k, botW = (e.indoor ? 260 : 520) * k;
      const flick = 0.85 + 0.15 * Math.sin(this._t / 700 + i * 2);
      const g = b.createLinearGradient(0, 0, 0, H * 0.95);
      g.addColorStop(0, `rgba(${shaftRgb},${0.12 * flick})`);
      g.addColorStop(1, `rgba(${shaftRgb},0)`);
      b.fillStyle = g;
      b.beginPath();
      b.moveTo(x - topW / 2, 0); b.lineTo(x + topW / 2, 0);
      b.lineTo(x + botW / 2 + 60 * k, H * 0.95); b.lineTo(x - botW / 2 + 60 * k, H * 0.95);
      b.closePath(); b.fill();
    }
    // 광원 색 번짐 + 손전등 체적광(비·안개일 때 진하게)
    const volumetric = e.rainy || ['foggy', 'snow', 'blizzard'].includes(e.weather) ? 1 : 0.4;
    for (const l of lights) {
      if (l.i <= 0.01) continue;
      if (l.cone) {
        b.save();
        b.beginPath(); b.moveTo(l.x, l.y); b.arc(l.x, l.y, l.radius, l.dir - l.spread, l.dir + l.spread); b.closePath(); b.clip();
        glow(b, l.x, l.y, l.radius, l.rgb, 0.07 * volumetric);
        b.restore();
      } else glow(b, l.x, l.y, l.radius * 0.8, l.rgb, 0.3 * l.i);
    }
    // 떠다니는 먼지
    for (const m of wz.motes) glow(b, m.x, m.y, m.r * 3, '255,230,190', 0.16 * (0.5 + 0.5 * Math.sin(this._t / 500 + m.ph)));
    // 뒤 안개 (캐릭터 뒤)
    b.globalCompositeOperation = 'source-over';
    const fogAmt = Math.min(1.2, 0.3 + (WEATHER_FOG[e.weather] ?? 0));
    const fogRgb = e.weather === 'acid_rain' ? '90,140,80' : snowFog(e) ? '200,210,225' : e.time === 'night' ? '70,84,110' : e.time === 'dusk' ? '150,110,90' : '170,170,175';
    this._fog(b, [{ y: 0.58, h: 240, sp: 14, a: 0.34 }, { y: 0.44, h: 260, sp: 8, a: 0.24 }], fogAmt, fogRgb);
    // 발밑 그림자
    for (const a of actors) {
      b.save();
      b.translate(a.x, a.feet - 4 * k);
      b.scale(Math.max(10, a.w * 0.42), 14 * k);
      const g = b.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = g; b.fillRect(-1, -1, 2, 2);
      b.restore();
    }
    // 젖은 바닥: 광원 반사 줄
    if (e.rainy) {
      b.globalCompositeOperation = 'lighter';
      for (const l of lights) if (!l.cone && l.i > 0.05) {
        b.save(); b.translate(l.x, H * 0.9); b.scale(70 * k, 12 * k);
        glow(b, 0, 0, 1, l.rgb, 0.3 * l.i); b.restore();
      }
    }

    // ── 앞 캔버스 ──
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'source-over';
    f.globalAlpha = 1;
    f.clearRect(0, 0, W, H);
    if (wz.drops.length) {
      const col = e.weather === 'acid_rain' ? '170,255,120' : '195,210,235';
      const windX = (e.weather === 'storm' || e.weather === 'monsoon' ? 0.5 : 0.25) * 700 * k;
      f.lineCap = 'round';
      f.lineWidth = Math.max(0.8, 1.2 * k);
      for (const d of wz.drops) {
        const kk = d.l / d.v;
        f.strokeStyle = `rgba(${col},${d.a})`;
        f.beginPath(); f.moveTo(d.x, d.y); f.lineTo(d.x - windX * kk, d.y - d.l); f.stroke();
      }
      f.lineWidth = 1;
      for (const p of wz.splashes) {
        const u = p.t / 180;
        f.strokeStyle = `rgba(${col},${0.45 * (1 - u)})`;
        f.beginPath(); f.ellipse(p.x, p.y, (2 + u * 9) * k, (1 + u * 2.5) * k, 0, 0, Math.PI * 2); f.stroke();
      }
    }
    for (const fl of wz.flakes) {
      f.fillStyle = `rgba(235,242,255,${0.55 + fl.r * 0.08})`;
      f.beginPath(); f.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2); f.fill();
    }
    for (const d of wz.debris) {
      f.save(); f.translate(d.x, d.y); f.rotate(d.r);
      f.fillStyle = 'rgba(120,96,60,0.8)'; f.fillRect(-d.s, -d.s * 0.4, d.s * 2, d.s * 0.8);
      f.restore();
    }
    this._fog(f, [{ y: 0.96, h: 110, sp: -22, a: 0.24 }], fogAmt, fogRgb);
    if (wz.lightning > 0) {
      if (wz.bolt && !e.indoor && wz.lightning > 0.5) {
        f.strokeStyle = 'rgba(230,240,255,0.95)';
        f.lineWidth = 3 * k;
        f.beginPath(); wz.bolt.forEach(([x, y], i) => (i ? f.lineTo(x, y) : f.moveTo(x, y))); f.stroke();
      }
      f.fillStyle = `rgba(210,225,255,${0.28 * wz.lightning})`;
      f.fillRect(0, 0, W, H);
    }
    if (e.weather === 'hot') {
      f.globalCompositeOperation = 'soft-light';
      f.fillStyle = 'rgba(255,170,90,0.3)';
      f.fillRect(0, 0, W, H);
    }
  },

  // 배경 이미지를 CSS(background-size: cover, center)와 같은 배치로 그린 흐린 원경 레이어 — 크기별 1회 생성
  _farLayer(W, H) {
    const src = this.env?.backdrop;
    if (!src) return null;
    if (!this._farImg || this._farImg.dataset.src !== src) {
      this._farImg = new Image();
      this._farImg.dataset.src = src;
      this._farImg.src = src;
    }
    const im = this._farImg;
    if (!im.complete || !im.naturalWidth) return null;
    const key = `${src}|${W}|${H}`;
    if (key === this._farKey) return this._far;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * 1.04; // 패럴랙스로 밀어도 가장자리가 비지 않게 4% 크게
    const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;
    if ('filter' in g) g.filter = `blur(${Math.max(1, Math.round(2.5 * H / 720))}px) brightness(0.85) saturate(0.85)`;
    g.drawImage(im, dx, dy, dw, dh);
    if ('filter' in g) g.filter = 'none';
    const hy = (dy + dh * (this.env.horizon ?? 0.5)) / H;
    g.globalCompositeOperation = 'destination-in';
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(clamp01(hy - 0.04), 'rgba(0,0,0,1)');
    grad.addColorStop(clamp01(hy + 0.08), 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    this._far = c;
    this._farKey = key;
    return c;
  },

  _fog(ctx, bands, amt, rgb) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const k = H / 720;
    const t = this._t / 1000;
    for (const band of bands) {
      for (let i = -1; i < 4; i += 1) {
        const span = 520 * k;
        const x = (((i * span + t * band.sp * 4 * k) % (span * 4)) + span * 4) % (span * 4) - span;
        const cx = x + 250 * k, cy = band.y * H;
        ctx.save();
        ctx.translate(cx, cy); ctx.scale(450 * k, (band.h / 2) * k);
        glow(ctx, 0, 0, 1, rgb, band.a * amt);
        ctx.restore();
      }
    }
  },
};

function snowFog(e) { return e.weather === 'snow' || e.weather === 'blizzard'; }

export default CombatStageRenderer;
