// 공유 모듈 — 게임 런타임과 tools/combat-fx-lab 이 같은 파일을 쓴다. 수정 시 랩에서 확인할 것.
// 이펙트 런타임 — 컴파일된 노드 체인을 파티클로 실행하고 캔버스에 그린다.
import { compileGraph } from './fxNodes.js';
import { LEGACY_FX } from './fxLibrary.js';

const DEG = Math.PI / 180;
const rand = (a, b) => a + Math.random() * (b - a);

export function hexToRgb(hex) {
  const h = (hex || '#ffffff').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const lerp = (a, b, t) => a + (b - a) * t;
function lerp3(c0, c1, c2, u) {
  if (u < 0.5) { const t = u * 2; return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)]; }
  const t = (u - 0.5) * 2;
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

// 부드러운 원형 스프라이트(색별 캐시) — 글로우·연기
const glowCache = new Map();
export function glowSprite(c) {
  const q = c.map((v) => Math.round(v / 16) * 16);
  const key = q.join(',');
  let cv = glowCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${q[0]},${q[1]},${q[2]},1)`);
    gr.addColorStop(0.35, `rgba(${q[0]},${q[1]},${q[2]},0.45)`);
    gr.addColorStop(1, `rgba(${q[0]},${q[1]},${q[2]},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    glowCache.set(key, cv);
  }
  return cv;
}

export class FxSystem {
  constructor(world) {
    this.world = world;
    this.instances = [];
    this.compiled = new Map(); // id → { chains, errors }
    this.graphs = new Map();
  }

  setLibrary(graphs) {
    this.graphs = new Map(graphs.map((g) => [g.id, g]));
    this.compiled.clear();
  }

  invalidate(id) { this.compiled.delete(id); }

  getCompiled(id) {
    if (!this.compiled.has(id)) {
      const g = this.graphs.get(id);
      this.compiled.set(id, g ? compileGraph(g) : { chains: [], errors: ['없는 이펙트'] });
    }
    return this.compiled.get(id);
  }

  clear() { this.instances = []; }

  // opts: { x, y, rot(deg), flip(1|-1), scale, follow(fn→{x,y}) }
  spawn(id, opts) {
    const legacy = LEGACY_FX[id];
    if (legacy) {
      this.instances.push({ legacy, x: opts.x, y: opts.y, age: 0, life: 700, flip: opts.flip ?? 1 });
      return;
    }
    const { chains } = this.getCompiled(id);
    if (!chains.length) return;
    this.instances.push({
      id, x: opts.x, y: opts.y, rot: (opts.rot ?? 0) * DEG, flip: opts.flip ?? 1, scale: opts.scale ?? 1,
      follow: opts.follow ?? null, age: 0,
      chains: chains.map((c) => ({ c, elapsed: 0, burstDone: false, acc: 0, fired: false })),
      particles: [],
    });
  }

  _toWorld(inst, lx, ly) {
    const cs = Math.cos(inst.rot), sn = Math.sin(inst.rot);
    const rx = (lx * cs - ly * sn) * inst.scale;
    const ry = (lx * sn + ly * cs) * inst.scale;
    return [inst.x + rx * inst.flip, inst.y + ry];
  }

  _dirWorld(inst, angRad) {
    const a = angRad + inst.rot;
    return inst.flip === 1 ? a : Math.PI - a;
  }

  _spawnParticle(inst, ch) {
    const m = ch.c.mods;
    const h = ch.c.head;
    const sh = m.shape;
    let lx = 0, ly = 0, baseOut = rand(0, Math.PI * 2);
    if (sh) {
      switch (sh.kind) {
        case 'circle': { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * sh.radius; lx = Math.cos(a) * r; ly = Math.sin(a) * r; baseOut = a; break; }
        case 'ring': { const a = rand(0, Math.PI * 2); lx = Math.cos(a) * sh.radius; ly = Math.sin(a) * sh.radius; baseOut = a; break; }
        case 'arc': { const a = (sh.arcStart + Math.random() * sh.arcSweep) * DEG; lx = Math.cos(a) * sh.radius; ly = Math.sin(a) * sh.radius; baseOut = a; break; }
        case 'line': { const t = rand(-0.5, 0.5) * sh.length, a = sh.angle * DEG; lx = Math.cos(a) * t; ly = Math.sin(a) * t; break; }
        case 'box': { lx = rand(-0.5, 0.5) * sh.length; ly = rand(-1, 1) * sh.radius; break; }
        default: break;
      }
    }
    const v = m.velocity;
    let vx = 0, vy = 0, dirA = 0;
    if (v) {
      let a;
      const spr = rand(-0.5, 0.5) * v.spread * DEG;
      if (v.dir === 'outward') a = baseOut + spr;
      else if (v.dir === 'inward') a = baseOut + Math.PI + spr;
      else if (v.dir === 'tangent') a = baseOut + Math.PI / 2 + spr;
      else a = v.angle * DEG + spr;
      const sp = rand(v.speedMin, v.speedMax) * inst.scale;
      const wa = this._dirWorld(inst, a);
      vx = Math.cos(wa) * sp; vy = Math.sin(wa) * sp; dirA = wa;
    }
    const [x, y] = this._toWorld(inst, lx, ly);
    const s = m.spin;
    const rot = s ? this._dirWorld(inst, (s.rot + rand(-s.rotRand, s.rotRand)) * DEG) : this._dirWorld(inst, 0);
    inst.particles.push({
      x, y, vx, vy, dirA, rot, spin: (s?.spin ?? 0) * DEG * inst.flip,
      age: 0, life: rand(h.lifeMin, Math.max(h.lifeMin, h.lifeMax)), seed: Math.random() * 1000, ch: ch.c,
    });
  }

  update(dtMs, frozen = false) {
    const w = this.world;
    const dt = dtMs / 1000;
    const quality = w.cfg().fx.quality ?? 1;
    const windForce = w.windForce();
    for (const inst of this.instances) {
      inst.age += dtMs;
      if (inst.legacy) continue;
      if (inst.follow) { const p = inst.follow(); inst.x = p.x; inst.y = p.y; }
      for (const ch of inst.chains) {
        ch.elapsed += dtMs;
        const h = ch.c.head;
        if (ch.c.kind === 'light') {
          if (!ch.fired && ch.elapsed >= (h.delay ?? 0)) {
            ch.fired = true;
            w.addLight({ follow: () => ({ x: inst.x, y: inst.y }), color: h.color, radius: h.radius * inst.scale, intensity: h.intensity, duration: h.duration, flicker: h.flicker });
          }
          continue;
        }
        if (ch.c.kind === 'screen') {
          if (!ch.fired && ch.elapsed >= (h.delay ?? 0)) {
            ch.fired = true;
            if (h.shake) w.addShake(h.shake);
            if (h.flash) w.flash(h.flashColor, h.flash);
          }
          continue;
        }
        if (ch.elapsed >= h.delay) {
          if (!ch.burstDone) {
            ch.burstDone = true;
            const n = Math.round(h.burst * quality);
            for (let i = 0; i < n; i += 1) this._spawnParticle(inst, ch);
          }
          if (h.rate > 0 && ch.elapsed <= h.delay + h.duration) {
            ch.acc += h.rate * quality * dt;
            while (ch.acc >= 1) { ch.acc -= 1; this._spawnParticle(inst, ch); }
          }
        }
      }
      const pdt = frozen ? dt * 0.12 : dt;
      for (const p of inst.particles) {
        p.age += pdt * 1000;
        const m = p.ch.mods;
        if (m.force) {
          p.vy += m.force.gravity * pdt;
          if (m.force.drag) { const k = Math.exp(-m.force.drag * pdt); p.vx *= k; p.vy *= k; }
          if (m.force.wind) p.vx += windForce * m.force.wind * pdt;
        }
        if (m.turbulence) {
          const t = p.age / 1000;
          p.vx += m.turbulence.amp * Math.sin(t * m.turbulence.freq * 6.28 + p.seed) * pdt;
          p.vy += m.turbulence.amp * Math.cos(t * m.turbulence.freq * 5.1 + p.seed * 1.3) * pdt;
        }
        p.x += p.vx * pdt; p.y += p.vy * pdt;
        p.rot += p.spin * pdt;
      }
      inst.particles = inst.particles.filter((p) => p.age < p.life);
    }
    this.instances = this.instances.filter((inst) => {
      if (inst.legacy) return inst.age < inst.life;
      const pending = inst.chains.some((ch) => {
        const h = ch.c.head;
        if (ch.c.kind !== 'emitter') return !ch.fired;
        return !ch.burstDone || (h.rate > 0 && ch.elapsed <= h.delay + h.duration);
      });
      return pending || inst.particles.length > 0;
    });
  }

  particleCount() {
    return this.instances.reduce((n, i) => n + (i.particles?.length ?? 1), 0);
  }

  // pass: 'normal' | 'add'
  draw(ctx, pass, sprites) {
    for (const inst of this.instances) {
      if (inst.legacy) { if (pass === 'normal') this._drawLegacy(ctx, inst, sprites); continue; }
      for (const p of inst.particles) {
        const r = p.ch.mods.render;
        if ((r.blend === 'add') !== (pass === 'add')) continue;
        this._drawParticle(ctx, p, inst, sprites);
      }
    }
  }

  _drawLegacy(ctx, inst, sprites) {
    const u = inst.age / inst.life;
    const a = u < 0.1 ? u / 0.1 : u > 0.6 ? Math.max(0, 1 - (u - 0.6) / 0.4) : 1;
    const s = u < 0.25 ? 0.6 + (u / 0.25) * 0.45 : 1.05 + (u - 0.25) * 0.08;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(inst.x, inst.y);
    ctx.scale(s * inst.flip, s);
    if (inst.legacy.img) {
      const img = sprites[inst.legacy.img];
      if (img?.complete && img.naturalWidth) ctx.drawImage(img, -img.naturalWidth * 0.45, -img.naturalHeight * 0.45, img.naturalWidth * 0.9, img.naturalHeight * 0.9);
    } else if (inst.legacy.emoji) {
      ctx.font = '56px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(inst.legacy.emoji, 0, 0);
    }
    ctx.restore();
  }

  _drawParticle(ctx, p, inst, sprites) {
    const m = p.ch.mods;
    const r = m.render;
    const u = Math.min(1, p.age / p.life);
    const col = m.color ?? { c0: '#ffffff', c1: '#ffffff', c2: '#ffffff', a0: 1, a1: 0 };
    const c = lerp3(hexToRgb(col.c0), hexToRgb(col.c1), hexToRgb(col.c2), u);
    const alpha = lerp(col.a0, col.a1, u);
    if (alpha <= 0.003) return;
    const sz = m.size ?? { s0: 6, s1: 0, stretch: 0.03 };
    const size = Math.max(0.1, lerp(sz.s0, sz.s1, u) * inst.scale);
    const add = r.blend === 'add';
    const glow = r.glow ?? 0;

    if (add && glow > 0 && r.mode !== 'smoke') {
      const gs = glowSprite(c);
      const big = r.mode === 'crescent' || r.mode === 'ring';
      const gr = (big ? size * 1.1 : size * 5) * glow;
      ctx.globalAlpha = alpha * (big ? 0.16 : 0.35) * Math.min(1, glow);
      ctx.drawImage(gs, p.x - gr, p.y - gr, gr * 2, gr * 2);
    }
    ctx.globalAlpha = 1;
    switch (r.mode) {
      case 'dot':
        ctx.fillStyle = rgba(c, alpha);
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
        break;
      case 'smoke': {
        const gs = glowSprite(c);
        ctx.globalAlpha = alpha;
        ctx.drawImage(gs, p.x - size, p.y - size, size * 2, size * 2);
        break;
      }
      case 'ring':
        ctx.strokeStyle = rgba(c, alpha);
        ctx.lineWidth = Math.max(1, (1 - u) * size * 0.12 + 1);
        ctx.beginPath(); ctx.ellipse(p.x, p.y, size, size * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'spark':
      case 'streak': {
        const sp = Math.hypot(p.vx, p.vy);
        const len = Math.max(size * 2, sp * (sz.stretch ?? 0.03));
        const ux = sp > 0 ? p.vx / sp : Math.cos(p.rot), uy = sp > 0 ? p.vy / sp : Math.sin(p.rot);
        ctx.strokeStyle = rgba(c, alpha);
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - ux * len, p.y - uy * len); ctx.stroke();
        break;
      }
      case 'crescent': {
        const arc = (r.arc ?? 130) * DEG;
        const sweep = Math.min(1, u / 0.3);
        const a0 = p.rot - arc / 2;
        const a1 = a0 + arc * sweep;
        const tail = Math.max(0, (u - 0.3) / 0.7) * arc * 0.6;
        const s0 = a0 + tail;
        if (a1 <= s0) break;
        const th = r.thick ?? 0.18;
        const R = size, Ri = size * (1 - th * 0.6), off = size * th * 0.4;
        const ox = p.x - Math.cos(p.rot) * off, oy = p.y - Math.sin(p.rot) * off;
        ctx.fillStyle = rgba(c, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, R, s0, a1, false);
        ctx.arc(ox, oy, Ri, a1, s0, true);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'sprite': {
        const img = sprites[r.sprite];
        if (!img?.complete) break;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        const wv = size * 4, hv = wv * (img.naturalHeight / img.naturalWidth);
        ctx.drawImage(img, -wv / 2, -hv / 2, wv, hv);
        ctx.restore();
        break;
      }
      default: break;
    }
    ctx.globalAlpha = 1;
  }
}
