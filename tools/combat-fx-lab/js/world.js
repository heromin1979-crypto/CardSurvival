// 전투 FX 랩 — 월드(한 개의 전투 장면). 개선 전/후 각각 World 하나씩 돌려 비교한다.
import { img, imgReady } from './assets.js';
import { FxSystem, glowSprite, hexToRgb } from './fxRuntime.js';
import { BACKDROPS, LEGACY_FX_MAP } from './presets.js';

export const W = 1280;
export const H = 720;
const DEG = Math.PI / 180;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// 소켓: 캐릭터 발(앵커) 기준, 그려진 키(h) 대비 비율. x는 바라보는 방향 기준.
export const SOCKETS = {
  weapon: [0.2, -0.5], hand: [0.12, -0.47], feet: [0.0, -0.02], center: [0.0, -0.4], head: [0.0, -0.74],
};
export const SOCKET_LABELS = {
  weapon: '무기', hand: '손', feet: '발', center: '몸 중심', head: '머리',
  target_center: '대상 중심', target_feet: '대상 발', target_head: '대상 머리',
};

const TINT = { day: '#f1f2f5', dusk: '#f7d2ae', night: '#aebbdc' };
const AMB = { day: [10, 10, 14], dusk: [34, 16, 8], night: [6, 10, 26] };
const AMB_A = { day: 0.05, dusk: 0.3, night: 0.5 };
const RIM = { day: '#fff2dc', dusk: '#ffc690', night: '#9cc2ff' };

// ── 스프라이트 배우 ───────────────────────────────────────────
class Actor {
  constructor(world, sheetKey, side, baseX, baseY, scale) {
    this.world = world;
    this.side = side;
    this.facing = side === 'ally' ? 1 : -1;
    this.baseX = baseX; this.baseY = baseY; this.scale = scale;
    this.setSheet(sheetKey);
    this.reset();
  }

  setSheet(key) {
    this.sheetKey = key;
    this.def = this.world.manifest[key];
    this.image = this.def ? img(this.def.src) : null;
  }

  reset() {
    this.motion = 'idle'; this.mt = Math.random() * 400; this.ox = 0;
    this.kbT = 1e9; this.kbAmp = 0; this.rcT = 1e9; this.rcAmp = 0;
    this.flashT = 0; this.jitterMs = 0; this.ghosts = []; this.ghostAcc = 0; this.trail = false;
    this.dead = false; this.alpha = 1; this.respawnAt = 0;
  }

  resolve(name) {
    const d = this.def;
    if (!d) return null;
    const m = d.motions;
    if (m[name]) return { name, ...m[name] };
    if (d.aliases?.[name] && m[d.aliases[name]]) return { name: d.aliases[name], ...m[d.aliases[name]] };
    if (name === 'attack') {
      const k = ['basic_attack', 'basic_a', 'melee'].find((x) => m[x]) ?? Object.keys(m).find((x) => /attack|basic/.test(x));
      if (k) return { name: k, ...m[k] };
    }
    if (name === 'hit') { const k = Object.keys(m).find((x) => x.startsWith('hit')); if (k) return { name: k, ...m[k] }; }
    return m.idle ? { name: 'idle', ...m.idle } : null;
  }

  play(name) { this.motion = name; this.mt = 0; }

  get cur() { return this.resolve(this.motion); }

  update(dt, frozen) {
    if (!frozen) this.mt += dt;
    const m = this.cur;
    if (m && !m.loop && this.mt >= m.durationMs && !m.holdLast && this.motion !== 'idle' && !this.world.actionOwns(this)) {
      if (!this.dead) this.play('idle');
    }
    if (!frozen) { this.kbT += dt; this.rcT += dt; }
    this.flashT = Math.max(0, this.flashT - dt);
    this.jitterMs = Math.max(0, this.jitterMs - dt);
  }

  frame() {
    const m = this.cur;
    if (!m || !this.image?.naturalWidth) return null;
    const cols = this.def.cols;
    const fw = this.image.naturalWidth / cols;
    const fh = this.image.naturalHeight / this.def.rows;
    const p = this.mt / m.durationMs;
    const f = m.loop ? Math.floor(p * cols) % cols : Math.min(cols - 1, Math.floor(p * cols));
    return { sx: f * fw, sy: m.row * fh, sw: fw, sh: fh, f };
  }

  // 그려질 크기 (프레임 256px 기준 380px)
  get drawH() { return 380 * this.scale; }

  offsetX() {
    const feel = this.world.cfg().feel;
    let kb = 0;
    if (this.kbT < 700) {
      const t = this.kbT;
      kb = this.kbAmp * (t < 90 ? easeOut(t / 90) : Math.max(0, 1 - easeInOut(Math.min(1, (t - 90) / 360))));
    }
    let rc = 0;
    if (this.rcT < 260) { const t = this.rcT; rc = this.rcAmp * (t < 50 ? t / 50 : Math.max(0, 1 - (t - 50) / 210)); }
    let jit = 0;
    if (this.jitterMs > 0 && feel.targetJitter) jit = (Math.random() * 2 - 1) * feel.targetJitter;
    return this.ox + kb + rc + jit;
  }

  get x() { return this.baseX + this.offsetX(); }
  get y() { return this.baseY; }

  socket(name) {
    const s = SOCKETS[name] ?? SOCKETS.center;
    return { x: this.x + s[0] * this.drawH * this.facing, y: this.y + s[1] * this.drawH };
  }
}

// ── 월드 ─────────────────────────────────────────────────────
export class World {
  constructor({ manifest, cfg, scene, sprites, label }) {
    this.manifest = manifest;
    this.cfg = cfg; // () => 이 월드의 설정
    this.scene = scene; // () => 공용 장면 설정
    this.sprites = sprites;
    this.label = label;
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.dark = document.createElement('canvas');
    this.dark.width = W; this.dark.height = H;
    this.scratch = document.createElement('canvas');
    this.fx = new FxSystem(this);
    this.lights = [];
    this.shakes = [];
    this.flashes = [];
    this.texts = [];
    this.freezeMs = 0; this.slowMs = 0; this.slowScale = 1;
    this.zoomT = 1e9; this.zoomAmp = 0; this.zoomAt = { x: W / 2, y: H / 2 };
    this.cam = { x: 0 };
    this.time = 0;
    this.action = null;
    this.weather = { drops: [], flakes: [], splashes: [], debris: [], clouds: [], lightning: 0, nextBolt: 2500, bolt: null };
    this.motes = Array.from({ length: 80 }, () => ({ x: rand(0, W), y: rand(0, H), vx: rand(-6, 6), vy: rand(-8, 4), r: rand(0.6, 2.2), ph: rand(0, 6) }));
    this.fogPhase = rand(0, 1000);
    this._bgKey = '';
    this.buildActors();
  }

  get bd() { return BACKDROPS[this.scene().backdrop] ?? BACKDROPS.jongno; }

  buildActors() {
    const sc = this.scene();
    const gy = H * 0.905;
    this.player = new Actor(this, sc.player, 'ally', W * 0.3, gy, 1);
    this.enemies = [new Actor(this, sc.enemy, 'enemy', W * 0.655, gy, 1)];
    if (sc.enemy2 && sc.enemy2 !== 'none') this.enemies.push(new Actor(this, sc.enemy2, 'enemy', W * 0.83, gy - 26, 0.84));
    this.action = null;
  }

  actionOwns(actor) { return this.action && this.action.attacker === actor; }

  // ── 외부 API (이펙트 런타임이 호출) ────────────────────────
  addLight(l) { if (this.cfg().env.dynamicLights && this.cfg().env.enabled) this.lights.push({ ...l, age: 0 }); }
  addShake(amp, dur = 260) { this.shakes.push({ amp, dur, t: 0, ph: rand(0, 100) }); }
  flash(color, alpha, dur = 160) { this.flashes.push({ c: hexToRgb(color), a: alpha, dur, t: 0 }); }
  windForce() { const e = this.cfg().env; return e.enabled ? e.wind * 520 : 0; }

  // ── 액션 재생 ────────────────────────────────────────────
  startAction(key, opts = {}) {
    const b = this.cfg().bind[key];
    if (!b) return;
    const attacker = b.actor === 'player' ? this.player : this.enemies[0];
    const target = b.target === 'player' ? this.player : this.enemies[0];
    if (!attacker || !target || attacker.dead) return;
    if (target.dead) { target.reset(); }
    attacker.play(b.motion);
    const m = attacker.cur;
    this.action = { key, b, attacker, target, t: 0, dur: m?.durationMs ?? 700, fired: new Set(), crit: !!opts.crit, kill: !!opts.kill };
  }

  get busy() { return !!this.action || this.freezeMs > 0; }

  _eventPos(ev, a) {
    const s = ev.socket ?? 'center';
    if (s.startsWith('target_')) return a.target.socket(s.slice(7));
    return a.attacker.socket(s);
  }

  _mapFx(id) {
    if (this.cfg().fx.mode === 'legacy') return LEGACY_FX_MAP[id] ?? (id.startsWith('legacy_') ? id : null);
    return id;
  }

  _fire(ev, a) {
    if (ev.type === 'trail') { a.trailUntil = ev.until; return; }
    if (ev.type === 'fx') {
      const id = this._mapFx(ev.fx);
      if (!id) return;
      const pos = this._eventPos(ev, a);
      const s = ev.socket ?? 'center';
      const follow = s.startsWith('target_') ? null : () => a.attacker.socket(s);
      this.fx.spawn(id, { x: pos.x + (ev.dx ?? 0) * a.attacker.facing, y: pos.y + (ev.dy ?? 0), rot: ev.rot ?? 0, flip: a.attacker.facing, scale: ev.scale ?? 1, follow: s === 'feet' ? null : follow });
      return;
    }
    if (ev.type === 'hit') this._hit(ev, a);
  }

  _hit(ev, a) {
    const feel = this.cfg().feel;
    const { target, attacker, crit, kill } = a;
    const power = ev.power ?? 1;
    const c = target.socket('center');
    const seen = new Set();
    for (const raw of ev.fx ?? []) {
      const id = this._mapFx(raw);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      this.fx.spawn(id, { x: c.x, y: c.y, rot: 0, flip: attacker.facing, scale: Math.sqrt(power) * (crit ? 1.2 : 1) });
    }
    target.play('hit');
    const dmg = Math.round((crit ? 2.1 : 1) * power * rand(11, 16));
    this.texts.push({ x: c.x, y: target.socket('head').y - 10, v: dmg, crit, t: 0, dir: attacker.facing, mode: this.cfg().fx.dmgNumbers });
    this.freezeMs = crit ? feel.critHitstop : feel.hitstop;
    target.jitterMs = this.freezeMs;
    target.kbT = 0; target.kbAmp = feel.knockback * power * (crit ? 1.4 : 1) * attacker.facing;
    attacker.rcT = 0; attacker.rcAmp = -feel.recoil * attacker.facing;
    target.flashT = feel.hitFlashMs; target.flashMax = feel.hitFlashMs;
    if (feel.shakeEveryHit || crit || kill) this.addShake(crit || kill ? feel.critShake : feel.shake * power, feel.shakeMs);
    if (crit && feel.zoomPunch) { this.zoomT = 0; this.zoomAmp = feel.zoomPunch; this.zoomAt = c; }
    if (crit && feel.critFlash) this.flashes.push({ c: [255, 214, 140], a: 0.3, dur: 280, t: 0, radial: true });
    if (kill && target.side === 'enemy') {
      target.dead = true;
      target.deathAt = this.time + 380;
      if (feel.killSlowmo < 1) { this.slowMs = feel.killSlowmoMs; this.slowScale = feel.killSlowmo; }
    }
  }

  // ── 업데이트 ─────────────────────────────────────────────
  update(realDt) {
    const speed = this.scene().speed ?? 1;
    let dt = realDt * speed;
    if (this.slowMs > 0) { this.slowMs -= realDt; dt *= this.slowScale; }
    this.time += dt;
    const frozen = this.freezeMs > 0;
    if (frozen) this.freezeMs -= realDt * speed;

    const a = this.action;
    if (a && !frozen) {
      a.t += dt;
      const p = Math.min(1, a.t / a.dur);
      const lo = a.b.loco;
      if (lo?.kind === 'approach') {
        const dist = Math.max(0, Math.abs(a.target.baseX - a.attacker.baseX) - lo.gap);
        let k;
        if (p < lo.outEnd) k = easeOut(p / lo.outEnd);
        else if (p < lo.holdEnd) k = 1;
        else k = 1 - easeInOut((p - lo.holdEnd) / (1 - lo.holdEnd));
        a.attacker.ox = dist * k * a.attacker.facing;
      }
      a.attacker.trail = a.trailUntil != null && p < a.trailUntil;
      a.b.events.forEach((ev, i) => {
        if (!a.fired.has(i) && p >= ev.t) { a.fired.add(i); this._fire(ev, a); }
      });
      if (p >= 1) {
        a.attacker.ox = 0; a.attacker.trail = false;
        if (!a.attacker.dead) a.attacker.play('idle');
        this.action = null;
      }
    }

    for (const ac of this.allActors()) {
      ac.update(dt, frozen);
      if (ac.dead && ac.motion !== 'death' && this.time >= ac.deathAt) ac.play('death');
      if (ac.dead && ac.motion === 'death' && ac.mt > (ac.cur?.durationMs ?? 900) + 700) { ac.reset(); ac.alpha = 0; }
      if (!ac.dead && ac.alpha < 1) ac.alpha = Math.min(1, ac.alpha + dt / 300);
      // 잔상
      const feel = this.cfg().feel;
      if (ac.trail && feel.afterimage && !frozen) {
        ac.ghostAcc += dt;
        while (ac.ghostAcc >= feel.ghostInterval) {
          ac.ghostAcc -= feel.ghostInterval;
          const fr = ac.frame();
          if (fr) ac.ghosts.push({ x: ac.x, y: ac.y, fr, age: 0 });
          if (ac.ghosts.length > feel.ghostCount) ac.ghosts.shift();
        }
      }
      ac.ghosts.forEach((g) => { g.age += dt; });
      ac.ghosts = ac.ghosts.filter((g) => g.age < feel.ghostFade);
    }

    this.fx.update(dt, frozen);
    this.lights.forEach((l) => { l.age += dt; });
    this.lights = this.lights.filter((l) => l.age < l.duration);
    this.shakes.forEach((s) => { s.t += realDt; });
    this.shakes = this.shakes.filter((s) => s.t < s.dur);
    this.flashes.forEach((f) => { f.t += realDt; });
    this.flashes = this.flashes.filter((f) => f.t < f.dur);
    this.texts.forEach((t) => { t.t += dt; });
    this.texts = this.texts.filter((t) => t.t < 900);
    this.zoomT += realDt;

    // 카메라: 행동 중심을 살짝 따라가 패럴랙스가 보이게
    const focus = a ? (a.attacker.x + a.target.x) / 2 : (this.player.x + this.enemies[0].x) / 2;
    this.cam.x += ((focus - W * 0.48) * 0.18 - this.cam.x) * Math.min(1, realDt / 220);

    this._updateWeather(realDt * speed);
  }

  allActors() { return [...this.enemies.slice().reverse(), this.player]; }

  // ── 날씨 시뮬 ───────────────────────────────────────────
  _updateWeather(dt) {
    const e = this.cfg().env;
    const wz = this.weather;
    const s = dt / 1000;
    const bd = this.bd;
    const gy = H * 0.905;
    const id = e.enabled ? e.weather : 'none';
    const rainy = ['rainy', 'storm', 'monsoon', 'acid_rain'].includes(id);
    const snowy = ['snow', 'blizzard'].includes(id);
    const inShafts = bd.indoor && bd.shafts.length;
    const spawnX = () => {
      if (inShafts) { const sx = bd.shafts[Math.floor(Math.random() * bd.shafts.length)] * W; return sx + rand(-80, 80); }
      return rand(-200, W + 200);
    };
    const indoorK = bd.indoor ? 0.32 : 1;
    const wantDrops = rainy ? Math.round(e.intensity * indoorK * ({ rainy: 480, storm: 760, monsoon: 950, acid_rain: 420 }[id])) : 0;
    while (wz.drops.length < wantDrops) wz.drops.push({ x: spawnX(), y: rand(-H, H), l: rand(16, 34), v: rand(1100, 1600), a: rand(0.18, 0.45), gy: gy + rand(-110, 60) });
    if (wz.drops.length > wantDrops) wz.drops.length = wantDrops;
    const windX = e.wind * (id === 'monsoon' || id === 'storm' ? 900 : 520);
    for (const d of wz.drops) {
      d.y += d.v * s; d.x += windX * s;
      if (d.y > d.gy) {
        if (wz.splashes.length < 220 && Math.random() < 0.7) wz.splashes.push({ x: d.x, y: d.gy, t: 0 });
        d.y = rand(-120, -10); d.x = spawnX() - windX * 0.5;
      }
    }
    wz.splashes.forEach((p) => { p.t += dt; });
    wz.splashes = wz.splashes.filter((p) => p.t < 180);

    const wantFlakes = snowy ? Math.round(e.intensity * indoorK * (id === 'blizzard' ? 800 : 300)) : 0;
    while (wz.flakes.length < wantFlakes) wz.flakes.push({ x: spawnX(), y: rand(-H, H), r: rand(0.8, 3.4), v: rand(50, 140), ph: rand(0, 6) });
    if (wz.flakes.length > wantFlakes) wz.flakes.length = wantFlakes;
    const flakeWind = e.wind * (id === 'blizzard' ? 1100 : 300);
    for (const f of wz.flakes) {
      f.y += f.v * s * (id === 'blizzard' ? 2.2 : 1); f.x += (flakeWind + Math.sin(this.time / 600 + f.ph) * 30) * s;
      if (f.y > H + 10 || f.x > W + 220) { f.y = rand(-60, -5); f.x = spawnX() - flakeWind * 0.4; }
    }

    const wantDebris = id === 'windy' ? Math.round(40 * e.intensity) : 0;
    while (wz.debris.length < wantDebris) wz.debris.push({ x: rand(-W, 0), y: rand(H * 0.4, H), v: rand(300, 700), r: rand(0, 6), s: rand(3, 8), ph: rand(0, 6) });
    if (wz.debris.length > wantDebris) wz.debris.length = wantDebris;
    for (const d of wz.debris) {
      d.x += d.v * s * (0.4 + e.wind); d.y += Math.sin(this.time / 300 + d.ph) * 40 * s; d.r += 6 * s;
      if (d.x > W + 40) { d.x = rand(-200, -20); d.y = rand(H * 0.4, H); }
    }

    // 번개
    if ((id === 'storm') && e.lightning) {
      wz.nextBolt -= dt;
      if (wz.nextBolt <= 0) {
        wz.nextBolt = rand(2600, 6000);
        wz.boltT = 0;
        wz.bolt = this._makeBolt();
        this.addShake(3, 300);
      }
    }
    if (wz.boltT != null) {
      wz.boltT += dt;
      const t = wz.boltT;
      wz.lightning = t < 70 ? 1 : t < 130 ? 0.15 : t < 230 ? 0.85 : Math.max(0, 0.85 - (t - 230) / 400);
      if (t > 700) { wz.boltT = null; wz.lightning = 0; wz.bolt = null; }
    }
    for (const m of this.motes) {
      m.x += (m.vx + windX * 0.05) * s; m.y += (m.vy + Math.sin(this.time / 900 + m.ph) * 6) * s;
      if (m.x < -10) m.x = W + 10; if (m.x > W + 10) m.x = -10; if (m.y < -10) m.y = H; if (m.y > H + 10) m.y = 0;
    }
  }

  _makeBolt() {
    const pts = [];
    let x = rand(W * 0.15, W * 0.85);
    let y = 0;
    const endY = H * (this.bd.indoor ? 0.3 : 0.42);
    while (y < endY) { pts.push([x, y]); x += rand(-40, 40); y += rand(20, 50); }
    return pts;
  }

  // ── 렌더 ─────────────────────────────────────────────────
  render() {
    const ctx = this.ctx;
    const cfg = this.cfg();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#060402';
    ctx.fillRect(0, 0, W, H);

    // 카메라 행렬
    let sx = 0, sy = 0;
    for (const s of this.shakes) {
      const k = (1 - s.t / s.dur) ** 2;
      sx += Math.sin(s.t * 0.19 + s.ph) * s.amp * k;
      sy += Math.cos(s.t * 0.23 + s.ph * 1.7) * s.amp * k * (cfg.feel.shakeEveryHit ? 0.6 : 0);
    }
    let zoom = 1;
    if (this.zoomT < 220) zoom = 1 + this.zoomAmp * (1 - this.zoomT / 220) ** 2;
    const zx = this.zoomAt.x, zy = this.zoomAt.y;
    const m = new DOMMatrix().translate(sx, sy).translate(zx, zy).scale(zoom).translate(-zx, -zy);
    this.camMatrix = m;
    ctx.setTransform(m);

    this._drawBackground(ctx, cfg);
    if (cfg.bg.legacyOverlay) this._drawLegacyOverlay(ctx);
    if (cfg.bg.layered && cfg.bg.shafts > 0) this._drawShafts(ctx, cfg);
    if (cfg.bg.layered) this._drawReflections(ctx, cfg);
    this._drawFog(ctx, cfg, 'back');
    if (cfg.bg.contactShadow) this._drawShadows(ctx);
    for (const ac of this.allActors()) this._drawActor(ctx, ac, cfg);
    ctx.globalCompositeOperation = 'source-over';
    this.fx.draw(ctx, 'normal', this.sprites);
    this._drawRain(ctx, cfg);
    if (cfg.env.enabled) this._drawLighting(ctx, cfg);
    ctx.globalCompositeOperation = 'lighter';
    this.fx.draw(ctx, 'add', this.sprites);
    if (cfg.bg.dust) this._drawMotes(ctx, cfg);
    ctx.globalCompositeOperation = 'source-over';
    this._drawSnowAndDebris(ctx, cfg);
    this._drawFog(ctx, cfg, 'front');
    this._drawTexts(ctx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (cfg.env.enabled && cfg.env.weather === 'hot') this._heatShimmer(ctx, cfg);
    if (cfg.bg.layered) this._drawGradeAndVignette(ctx, cfg);
    this._drawFlashes(ctx);
  }

  // 배경 ─────────────────────────────────────────────
  _bgGeom() {
    const bd = this.bd;
    const im = img(bd.src);
    if (!im.naturalWidth) return null;
    const k = Math.max(W / im.naturalWidth, H / im.naturalHeight) * 1.1;
    const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
    const dy = H / 2 - dh * (bd.focusY ?? 0.5);
    return { im, dw, dh, dx: (W - dw) / 2, dy, horizonY: dy + dh * bd.horizon };
  }

  _prepareLayers(cfg, g) {
    const key = `${this.scene().backdrop}|${cfg.bg.dof}|${g.im.naturalWidth}`;
    if (key === this._bgKey) return;
    this._bgKey = key;
    const far = document.createElement('canvas');
    far.width = W; far.height = H;
    const f = far.getContext('2d');
    f.filter = `blur(${cfg.bg.dof}px) brightness(0.82) saturate(0.85)`;
    f.drawImage(g.im, g.dx, g.dy, g.dw, g.dh);
    f.filter = 'none';
    f.globalCompositeOperation = 'destination-in';
    const gr = f.createLinearGradient(0, 0, 0, H);
    const hy = g.horizonY / H;
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(clamp01(hy - 0.02), 'rgba(0,0,0,1)');
    gr.addColorStop(clamp01(hy + 0.1), 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    f.fillStyle = gr;
    f.fillRect(0, 0, W, H);
    this._far = far;
  }

  _drawBackground(ctx, cfg) {
    const g = this._bgGeom();
    if (!g) return;
    if (!cfg.bg.layered) {
      ctx.drawImage(g.im, g.dx, g.dy, g.dw, g.dh);
      return;
    }
    this._prepareLayers(cfg, g);
    const px = -this.cam.x * cfg.bg.parallax;
    ctx.drawImage(g.im, g.dx + px, g.dy, g.dw, g.dh); // 바닥(근경)
    ctx.drawImage(this._far, px * 0.35, 0); // 원경(흐림)
    // 톤: 시간대·날씨 색보정
    if (cfg.bg.grade > 0) {
      const e = cfg.env;
      const tint = e.enabled ? TINT[e.time] : '#dcd4c8';
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = cfg.bg.grade;
      ctx.fillStyle = tint;
      ctx.fillRect(-40, -40, W + 80, H + 80);
      ctx.globalCompositeOperation = 'screen';
      const haze = ctx.createLinearGradient(0, g.horizonY - 180, 0, g.horizonY + 60);
      const hz = e.enabled && e.time === 'dusk' ? '120,60,30' : e.enabled && e.time === 'day' ? '80,80,90' : '30,40,70';
      haze.addColorStop(0, `rgba(${hz},0)`); haze.addColorStop(0.7, `rgba(${hz},${0.35 * cfg.bg.grade})`); haze.addColorStop(1, `rgba(${hz},0)`);
      ctx.fillStyle = haze;
      ctx.fillRect(-40, g.horizonY - 180, W + 80, 240);
      ctx.restore();
    }
  }

  _drawLegacyOverlay(ctx) {
    ctx.save();
    let gr = ctx.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0.62)'); gr.addColorStop(0.28, 'rgba(0,0,0,0)'); gr.addColorStop(0.72, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.68)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(0,0,0,0.48)'); gr.addColorStop(0.42, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    // ::after 바닥 띠
    const bx = W * 0.07, bw = W * 0.86, by = H - 64 - 150, bh = 150;
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(bw / 2, bh / 2);
    const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    rg.addColorStop(0, 'rgba(0,0,0,0.78)'); rg.addColorStop(0.72, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(-1, -1, 2, 2);
    ctx.setTransform(this.camMatrix);
    gr = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    gr.addColorStop(0, 'rgba(200,160,96,0)'); gr.addColorStop(0.5, 'rgba(200,160,96,0.16)'); gr.addColorStop(1, 'rgba(200,160,96,0)');
    ctx.fillStyle = gr; ctx.fillRect(bx, by, bw, bh);
    ctx.restore();
  }

  _drawShafts(ctx, cfg) {
    const bd = this.bd;
    const g = this._bgGeom();
    if (!g) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const col = cfg.env.enabled && cfg.env.time === 'dusk' ? '255,190,130' : cfg.env.enabled && cfg.env.time === 'day' ? '255,245,225' : '150,180,230';
    const shafts = bd.indoor ? bd.shafts : [0.72];
    shafts.forEach((fx, i) => {
      const x = fx * W - this.cam.x * cfg.bg.parallax * 0.6;
      const topW = bd.indoor ? 70 : 160, botW = bd.indoor ? 260 : 520;
      const flick = 0.85 + 0.15 * Math.sin(this.time / 700 + i * 2);
      const gr = ctx.createLinearGradient(0, 0, 0, H * 0.95);
      gr.addColorStop(0, `rgba(${col},${0.2 * cfg.bg.shafts * flick})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(x - topW / 2, -10); ctx.lineTo(x + topW / 2, -10);
      ctx.lineTo(x + botW / 2 + 60, H * 0.95); ctx.lineTo(x - botW / 2 + 60, H * 0.95);
      ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  _wetness(cfg) {
    const e = cfg.env;
    const rainy = e.enabled && ['rainy', 'storm', 'monsoon', 'acid_rain'].includes(e.weather);
    return cfg.bg.wetFloor * (rainy ? 1 : 0.35);
  }

  _drawReflections(ctx, cfg) {
    const wet = this._wetness(cfg);
    if (wet <= 0.01) return;
    ctx.save();
    for (const ac of this.allActors()) {
      const fr = ac.frame();
      if (!fr) continue;
      const dh = ac.drawH, dw = dh * (fr.sw / fr.sh);
      ctx.save();
      ctx.globalAlpha = 0.28 * wet * ac.alpha;
      ctx.translate(ac.x, ac.y);
      ctx.scale(1, -0.5);
      ctx.drawImage(ac.image, fr.sx, fr.sy, fr.sw, fr.sh, -dw / 2, -dh * 0.97, dw, dh);
      ctx.restore();
    }
    // 광원 바닥 반사
    const e = cfg.env;
    if (e.enabled) {
      ctx.globalCompositeOperation = 'lighter';
      for (const l of this._staticLights(cfg)) {
        if (l.cone) continue;
        const col = hexToRgb(l.color);
        const gs = glowSprite(col);
        ctx.globalAlpha = 0.35 * wet * l.intensity;
        ctx.drawImage(gs, l.x - 60, H * 0.93 - 10, 120, 26);
      }
    }
    ctx.restore();
  }

  _drawShadows(ctx) {
    ctx.save();
    for (const ac of this.allActors()) {
      const w = ac.drawH * 0.34;
      ctx.globalAlpha = 0.6 * ac.alpha;
      ctx.translate(ac.x, ac.y - 4);
      ctx.scale(w, 16 * ac.scale);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, 'rgba(0,0,0,0.85)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(-1, -1, 2, 2);
      ctx.setTransform(this.camMatrix);
    }
    ctx.restore();
  }

  _tinted(fr, image, dw, dh, color) {
    const c = this.scratch;
    const cw = Math.ceil(dw), ch = Math.ceil(dh);
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    const g = c.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, cw, ch);
    g.drawImage(image, fr.sx, fr.sy, fr.sw, fr.sh, 0, 0, cw, ch);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, cw, ch);
    return c;
  }

  _drawActor(ctx, ac, cfg) {
    const fr = ac.frame();
    if (!fr) return;
    const dh = ac.drawH, dw = dh * (fr.sw / fr.sh);
    const feel = cfg.feel;
    // 잔상
    for (const gh of ac.ghosts) {
      const k = 1 - gh.age / feel.ghostFade;
      const t = this._tinted(gh.fr, ac.image, dw, dh, feel.ghostTint);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 * k * k;
      ctx.translate(gh.x, gh.y);
      ctx.drawImage(t, -dw / 2, -dh * 0.97, dw, dh);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = ac.alpha;
    ctx.translate(ac.x, ac.y);
    // 시트는 이미 진영 방향(아군→오른쪽, 적→왼쪽)으로 그려져 있어 뒤집지 않는다
    // 림라이트: 밝은 실루엣을 살짝 어긋나게 먼저 그림
    if (cfg.bg.rimLight > 0) {
      const col = cfg.env.enabled ? RIM[cfg.env.time] : '#e8dcc8';
      const t = this._tinted(fr, ac.image, dw, dh, col);
      ctx.globalAlpha = ac.alpha * cfg.bg.rimLight * 0.75;
      ctx.drawImage(t, -dw / 2 - 3 * ac.facing, -dh * 0.97 - 2, dw, dh);
      ctx.globalAlpha = ac.alpha;
    }
    ctx.drawImage(ac.image, fr.sx, fr.sy, fr.sw, fr.sh, -dw / 2, -dh * 0.97, dw, dh);
    // 피격 섬광(화이트 플래시)
    if (ac.flashT > 0 && ac.flashMax) {
      const t = this._tinted(fr, ac.image, dw, dh, '#ffffff');
      ctx.globalAlpha = (ac.flashT / ac.flashMax) * 0.9;
      ctx.drawImage(t, -dw / 2, -dh * 0.97, dw, dh);
    }
    ctx.restore();
  }

  // 날씨 ─────────────────────────────────────────────
  _drawRain(ctx, cfg) {
    const e = cfg.env;
    if (!e.enabled) return;
    const wz = this.weather;
    if (!wz.drops.length) return;
    const acid = e.weather === 'acid_rain';
    const col = acid ? '170,255,120' : '195,210,235';
    const windX = e.wind * (e.weather === 'monsoon' || e.weather === 'storm' ? 900 : 520);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.3;
    for (const d of wz.drops) {
      const k = d.l / d.v;
      ctx.strokeStyle = `rgba(${col},${d.a})`;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - windX * k, d.y - d.l); ctx.stroke();
    }
    ctx.lineWidth = 1;
    for (const p of wz.splashes) {
      const u = p.t / 180;
      ctx.strokeStyle = `rgba(${col},${0.5 * (1 - u)})`;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 2 + u * 9, 1 + u * 2.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  _drawSnowAndDebris(ctx, cfg) {
    const e = cfg.env;
    if (!e.enabled) return;
    const wz = this.weather;
    ctx.save();
    for (const f of wz.flakes) {
      ctx.fillStyle = `rgba(235,242,255,${0.55 + f.r * 0.1})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const d of wz.debris) {
      ctx.save();
      ctx.translate(d.x, d.y); ctx.rotate(d.r);
      ctx.fillStyle = 'rgba(120,96,60,0.8)';
      ctx.fillRect(-d.s, -d.s * 0.4, d.s * 2, d.s * 0.8);
      ctx.restore();
    }
    // 번개 볼트(실외)
    if (wz.bolt && !this.bd.indoor && wz.lightning > 0.5) {
      ctx.strokeStyle = 'rgba(230,240,255,0.95)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#bcd6ff'; ctx.shadowBlur = 18;
      ctx.beginPath();
      wz.bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  _fogAmount(cfg) {
    const e = cfg.env;
    let f = cfg.bg.fog;
    if (e.enabled) f += { foggy: 0.7, blizzard: 0.45, monsoon: 0.2, storm: 0.15, rainy: 0.1, snow: 0.15, acid_rain: 0.2 }[e.weather] ?? 0;
    return Math.min(1.2, f);
  }

  _drawFog(ctx, cfg, layer) {
    const amt = this._fogAmount(cfg);
    if (amt <= 0.01) return;
    const e = cfg.env;
    const col = !e.enabled ? [120, 115, 110]
      : e.weather === 'acid_rain' ? [90, 140, 80]
        : e.weather === 'blizzard' || e.weather === 'snow' ? [200, 210, 225]
          : e.time === 'night' ? [70, 84, 110] : e.time === 'dusk' ? [150, 110, 90] : [170, 170, 175];
    const gs = glowSprite(col);
    const t = (this.time + this.fogPhase) / 1000;
    ctx.save();
    // 뒤 안개는 캐릭터 뒤(깊이), 앞 안개는 발목 높이에 얇게만 — 캐릭터가 뿌옇게 묻히지 않게
    const bands = layer === 'back'
      ? [{ y: H * 0.6, h: 240, sp: 14, a: 0.42 }, { y: H * 0.45, h: 260, sp: 8, a: 0.3 }]
      : [{ y: H * 0.95, h: 120, sp: -22, a: 0.28 }];
    for (const b of bands) {
      for (let i = -1; i < 4; i += 1) {
        const x = ((i * 520 + t * b.sp * 4) % 2080 + 2080) % 2080 - 520;
        ctx.globalAlpha = b.a * amt;
        ctx.drawImage(gs, x - 200, b.y - b.h / 2, 900, b.h);
      }
    }
    ctx.restore();
  }

  _drawMotes(ctx, cfg) {
    const gs = glowSprite([255, 230, 190]);
    ctx.save();
    for (const m of this.motes) {
      const tw = 0.5 + 0.5 * Math.sin(this.time / 500 + m.ph);
      ctx.globalAlpha = 0.18 * tw;
      ctx.drawImage(gs, m.x - m.r * 3, m.y - m.r * 3, m.r * 6, m.r * 6);
    }
    ctx.restore();
  }

  // 광원 ─────────────────────────────────────────────
  _staticLights(cfg) {
    const e = cfg.env;
    const bd = this.bd;
    const out = [];
    const t = this.time;
    if (e.flashlight) {
      const h = this.player.socket('hand');
      const tg = this.enemies[0].socket('center');
      const dir = Math.atan2(tg.y - h.y, tg.x - h.x);
      // 가장자리가 부드럽게 보이도록 폭이 다른 원뿔 3겹
      for (const [k, it] of [[1, 0.28], [0.72, 0.3], [0.45, 0.32]]) out.push({ x: h.x, y: h.y, cone: true, dir, spread: 24 * DEG * k, radius: 720, color: '#fff1d0', intensity: it });
    }
    if (e.fire && bd.fire) {
      const fl = 0.8 + 0.12 * Math.sin(t / 60) + 0.08 * Math.sin(t / 23 + 1.3);
      out.push({ x: bd.fire.x * W, y: bd.fire.y * H, radius: 360 * fl, color: '#ff9a40', intensity: fl, fire: true });
    }
    if (e.emergency && bd.emergency) {
      const on = (t % 1400) < 700 ? 1 : 0.25;
      out.push({ x: bd.emergency.x * W, y: bd.emergency.y * H, radius: 330, color: '#ff3030', intensity: 0.75 * on });
    }
    return out;
  }

  _allLights(cfg) {
    const out = this._staticLights(cfg);
    for (const l of this.lights) {
      const p = l.follow ? l.follow() : l;
      const u = l.age / l.duration;
      const fl = l.flicker ? 1 - l.flicker * Math.random() : 1;
      out.push({ x: p.x, y: p.y, radius: l.radius, color: l.color, intensity: l.intensity * (1 - u) ** 1.5 * fl });
    }
    return out;
  }

  _ambient(cfg) {
    const e = cfg.env;
    let a = AMB_A[e.time] + (this.bd.indoor ? 0.05 : 0);
    a += { storm: 0.1, monsoon: 0.1, cloudy: 0.06, overcast: 0.06, foggy: 0.04, blizzard: 0.05, rainy: 0.05, acid_rain: 0.06, sunny: -0.05, clear: -0.04, hot: -0.06 }[e.weather] ?? 0;
    a *= 1 - this.weather.lightning * 0.85;
    return { c: AMB[e.time], a: clamp01(a) };
  }

  _drawLighting(ctx, cfg) {
    const e0 = cfg.env;
    const lights = this._allLights(cfg);
    const amb = this._ambient(cfg);
    const d = this.dark.getContext('2d');
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    d.fillStyle = `rgba(${amb.c[0]},${amb.c[1]},${amb.c[2]},${amb.a})`;
    d.fillRect(0, 0, W, H);
    d.setTransform(this.camMatrix);
    d.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (l.intensity <= 0.01) continue;
      const rg = d.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius);
      rg.addColorStop(0, `rgba(0,0,0,${clamp01(l.intensity)})`);
      rg.addColorStop(0.55, `rgba(0,0,0,${clamp01(l.intensity) * 0.45})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = rg;
      if (l.cone) {
        d.save();
        d.beginPath(); d.moveTo(l.x, l.y);
        d.arc(l.x, l.y, l.radius, l.dir - l.spread, l.dir + l.spread);
        d.closePath(); d.clip();
        d.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
        d.restore();
      } else d.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
    }
    // 캐릭터 키라이트: 배우 주변 어둠을 덜어 배경보다 캐릭터가 먼저 읽히게
    if (e0.actorKey > 0) {
      for (const ac of this.allActors()) {
        const cx = ac.x, cy = ac.y - ac.drawH * 0.42, r = ac.drawH * 0.62;
        d.save();
        d.translate(cx, cy); d.scale(0.62, 1);
        const rg = d.createRadialGradient(0, 0, 0, 0, 0, r);
        rg.addColorStop(0, `rgba(0,0,0,${e0.actorKey * ac.alpha})`);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = rg;
        d.fillRect(-r, -r, r * 2, r * 2);
        d.restore();
      }
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.dark, 0, 0);
    ctx.restore();
    // 색광 가산
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const e = cfg.env;
    const volumetric = ['rainy', 'storm', 'monsoon', 'foggy', 'acid_rain', 'snow', 'blizzard'].includes(e.weather) ? 1 : 0.4;
    for (const l of lights) {
      if (l.intensity <= 0.01) continue;
      const c = hexToRgb(l.color);
      if (l.cone) {
        ctx.save();
        ctx.beginPath(); ctx.moveTo(l.x, l.y);
        ctx.arc(l.x, l.y, l.radius, l.dir - l.spread, l.dir + l.spread);
        ctx.closePath(); ctx.clip();
        const rg = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius);
        rg.addColorStop(0, `rgba(${c},${0.07 * volumetric})`);
        rg.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = rg;
        ctx.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
        ctx.restore();
        continue;
      }
      const rg = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius * 0.8);
      rg.addColorStop(0, `rgba(${c},${0.3 * l.intensity})`);
      rg.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
    }
    ctx.restore();
    // 번개 섬광
    if (this.weather.lightning > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(210,225,255,${0.35 * this.weather.lightning})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  _heatShimmer(ctx, cfg) {
    const g = this._bgGeom();
    const top = g ? Math.max(0, g.horizonY - 40) : H * 0.4;
    const t = this.time / 1000;
    const amp = 2.2 * cfg.env.intensity;
    for (let y = top; y < H; y += 5) {
      const off = Math.sin(y * 0.06 + t * 5) * amp;
      ctx.drawImage(this.canvas, 0, y, W, 5, off, y, W, 5);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255,170,90,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _drawGradeAndVignette(ctx, cfg) {
    const v = cfg.bg.vignette;
    if (v > 0) {
      const rg = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.72);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(1, `rgba(0,0,0,${0.85 * v})`);
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _drawFlashes(ctx) {
    for (const f of this.flashes) {
      const k = 1 - f.t / f.dur;
      if (f.radial) {
        const rg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.6);
        rg.addColorStop(0, `rgba(${f.c},${f.a * k})`);
        rg.addColorStop(0.42, `rgba(${f.c},${f.a * 0.33 * k})`);
        rg.addColorStop(1, `rgba(${f.c},0)`);
        ctx.fillStyle = rg;
      } else ctx.fillStyle = `rgba(${f.c},${f.a * k})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _drawTexts(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      const u = t.t / 900;
      if (t.mode === 'plain') {
        if (t.t > 700) continue;
        const k = t.t / 700;
        ctx.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
        ctx.font = 'bold 30px "Malgun Gothic", sans-serif';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = t.crit ? '#ffd27a' : '#ffffff';
        const y = t.y - k * 46;
        ctx.strokeText(`-${t.v}`, t.x, y); ctx.fillText(`-${t.v}`, t.x, y);
        continue;
      }
      const pop = t.t < 90 ? 0.3 + (t.t / 90) * 1.5 : t.t < 180 ? 1.8 - ((t.t - 90) / 90) * 0.8 : 1;
      const x = t.x + t.dir * easeOut(Math.min(1, t.t / 500)) * 40;
      const y = t.y - easeOut(Math.min(1, t.t / 500)) * 58 + (t.t > 500 ? ((t.t - 500) / 400) * 16 : 0);
      ctx.globalAlpha = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
      ctx.save();
      ctx.translate(x, y); ctx.scale(pop, pop);
      const size = t.crit ? 56 : 40;
      ctx.font = `900 ${size}px "Malgun Gothic", sans-serif`;
      ctx.lineWidth = 7; ctx.strokeStyle = t.crit ? '#4a1200' : '#1a0000';
      const grd = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      if (t.crit) { grd.addColorStop(0, '#fff6b0'); grd.addColorStop(1, '#ff8a1a'); } else { grd.addColorStop(0, '#ffffff'); grd.addColorStop(1, '#ffc9b0'); }
      ctx.fillStyle = grd;
      ctx.strokeText(String(t.v), 0, 0); ctx.fillText(String(t.v), 0, 0);
      if (t.crit) {
        ctx.font = '900 18px "Malgun Gothic", sans-serif';
        ctx.lineWidth = 4; ctx.strokeStyle = '#2a0800'; ctx.fillStyle = '#ffe07a';
        ctx.strokeText('CRITICAL', 0, -size * 0.72); ctx.fillText('CRITICAL', 0, -size * 0.72);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

export async function preloadScene(manifest, scene) {
  const srcs = [BACKDROPS[scene.backdrop]?.src];
  for (const k of [scene.player, scene.enemy, scene.enemy2]) if (k && manifest[k]) srcs.push(manifest[k].src);
  await Promise.all(srcs.filter(Boolean).map(imgReady));
}
