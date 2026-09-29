// 전투 파티클 캔버스 — .combat-visual 위에 캔버스 한 장을 얹어 노드 이펙트(js/ui/combat/fx)를 그린다.
// 화면은 innerHTML로 자주 다시 그려지므로 캔버스는 싱글턴으로 두고, 매 스폰 때 현재 .combat-visual에 다시 붙인다.
// 이펙트가 하나도 없으면 rAF 루프를 멈춘다(유휴 비용 0).
import SettingsManager from '../../core/SettingsManager.js';
import { FxSystem } from './fx/fxRuntime.js';
import { builtinLibrary } from './fx/fxLibrary.js';
import { COMBAT_FX_QUALITY, SOCKET_OVERRIDES } from '../../data/combatFxConfig.js';

const FX_SPRITE_SRC = {
  slash: './assets/images/fx/combat_fx_slash_v1.png',
  impact: './assets/images/fx/combat_fx_impact_v1.png',
  claw: './assets/images/fx/combat_fx_claw_v1.png',
  shot: './assets/images/fx/combat_fx_shot_v1.png',
  acid: './assets/images/fx/combat_fx_acid_v1.png',
};
// 랩 무대에서 캐릭터 키 ≈ 380px 기준으로 만든 이펙트 → 실제 스프라이트 키에 비례해 축소/확대
const LAB_ACTOR_HEIGHT = 380;
const SOCKETS = {
  weapon: [0.2, 0.5], hand: [0.12, 0.53], feet: [0, 0.98], center: [0, 0.55], head: [0, 0.2],
};

function canUseCanvas() {
  if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return false;
  try {
    const c = document.createElement('canvas');
    return typeof c.getContext === 'function' && !!c.getContext('2d');
  } catch { return false; }
}

const CombatFxCanvas = {
  canvas: null,
  ctx: null,
  fx: null,
  sprites: null,
  lights: [],
  flashes: [],
  freezeUntil: 0,
  slowUntil: 0,
  slowScale: 1,
  _raf: 0,
  _last: 0,
  _supported: null,

  // 설정: combatFx.enhanced (기본 켜짐). 끄면 기존 PNG 오버레이만 쓴다.
  enabled() {
    if (this._supported === null) this._supported = canUseCanvas();
    return this._supported && SettingsManager.get('combatFx.enhanced') !== false;
  },

  reduceShake() { return SettingsManager.get('combatFx.reduceShake') === true; },

  // FxSystem이 부르는 월드 인터페이스
  cfg() { return { fx: { quality: COMBAT_FX_QUALITY }, env: { enabled: false } }; },
  windForce() { return 0; },
  addLight(l) { this.lights.push({ ...l, age: 0 }); },
  addShake() { /* 흔들림은 CombatFxPlayer의 타격감 테이블이 담당 */ },
  flash(color, alpha, dur = 160) { this.flashes.push({ color, alpha, dur, t: 0 }); },

  _init() {
    if (this.fx) return;
    this.fx = new FxSystem(this);
    this.fx.setLibrary(builtinLibrary());
    this.sprites = {};
    for (const [k, src] of Object.entries(FX_SPRITE_SRC)) {
      const im = new Image();
      im.src = src;
      this.sprites[k] = im;
    }
  },

  attach(visual) {
    if (!visual) return false;
    this._init();
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'combat-fx-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');
    }
    if (this.canvas.parentElement !== visual) visual.appendChild(this.canvas);
    const r = visual.getBoundingClientRect();
    const w = Math.max(1, Math.min(2560, Math.round(r.width)));
    const h = Math.max(1, Math.min(1440, Math.round(r.height)));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    return true;
  },

  // 스프라이트 본체(보이는 것) 우선 — 숨겨진 폴백 이미지 등 크기 0인 후보는 건너뛴다
  bodyRect(el) {
    const list = el.querySelectorAll?.('.combat-sprite-sheet, .cv-player-img, .cv-enemy-img, .cv-ally-icon, .combatant-portrait, img') ?? [];
    for (const c of list) {
      const r = c.getBoundingClientRect();
      if (r.width > 4 && r.height > 4) return r;
    }
    return el.getBoundingClientRect();
  },

  // 액터 엘리먼트의 소켓 위치(캔버스 좌표)와 크기 배율
  locate(el, socket = 'center', facing = 1) {
    if (!el || !this.canvas) return null;
    const r = this.bodyRect(el);
    const cr = this.canvas.getBoundingClientRect();
    if (!r.width || !cr.width) return null;
    const k = this.canvas.width / cr.width;
    const sheetKey = el.querySelector?.('[data-sprite-sheet-key]')?.dataset?.spriteSheetKey ?? el.dataset?.spriteSheetKey;
    const s = SOCKET_OVERRIDES[sheetKey]?.[socket] ?? SOCKETS[socket] ?? SOCKETS.center;
    const h = r.height * k;
    return {
      x: (r.left - cr.left + r.width / 2) * k + s[0] * h * facing,
      y: (r.top - cr.top) * k + s[1] * h,
      h,
      scale: Math.max(0.35, Math.min(1.8, h / LAB_ACTOR_HEIGHT)),
    };
  },

  // id: fxLibrary 이펙트 id. opts: { socket, facing, rot, dx, power }
  spawnOn(visual, el, id, opts = {}) {
    if (!this.enabled() || !this.attach(visual)) return false;
    const facing = opts.facing ?? 1;
    const p = this.locate(el, opts.socket ?? 'center', facing);
    if (!p) return false;
    const power = opts.power ?? 1;
    this.fx.spawn(id, {
      x: p.x + (opts.dx ?? 0) * p.h * facing,
      y: p.y,
      rot: opts.rot ?? 0,
      flip: facing,
      scale: p.scale * Math.sqrt(power),
    });
    this._kick();
    return true;
  },

  freeze(ms) { this.freezeUntil = Math.max(this.freezeUntil, performance.now() + ms); },

  // 처치 슬로모션: 파티클 시간을 scale 배로 늦춘다
  slowmo(scale, ms) {
    this.slowScale = scale;
    this.slowUntil = performance.now() + ms;
  },

  clear() {
    this.fx?.clear();
    this.lights = [];
    this.flashes = [];
    if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  _kick() {
    if (this._raf) return;
    this._last = performance.now();
    this._raf = requestAnimationFrame((t) => this._frame(t));
  },

  _frame(now) {
    this._raf = 0;
    let dt = Math.min(50, now - this._last);
    if (now < this.slowUntil) dt *= this.slowScale;
    this._last = now;
    const frozen = now < this.freezeUntil;
    this.fx.update(dt, frozen);
    this.lights.forEach((l) => { l.age += dt; });
    this.lights = this.lights.filter((l) => l.age < l.duration);
    this.flashes.forEach((f) => { f.t += dt; });
    this.flashes = this.flashes.filter((f) => f.t < f.dur);
    this._draw();
    const alive = this.fx.instances.length || this.lights.length || this.flashes.length;
    if (alive && this.canvas?.isConnected) this._kick();
    else if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  _draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.fx.draw(ctx, 'normal', this.sprites);
    ctx.globalCompositeOperation = 'lighter';
    // 동적 광원: 어둠 레이어가 들어오기 전까지는 주변을 밝히는 가산 광만 그린다
    for (const l of this.lights) {
      const p = l.follow ? l.follow() : l;
      const u = l.age / l.duration;
      const a = 0.3 * l.intensity * (1 - u) ** 1.5 * (l.flicker ? 1 - l.flicker * Math.random() : 1);
      if (a <= 0.01) continue;
      const hex = (l.color || '#ffffff').replace('#', '');
      const n = parseInt(hex, 16);
      const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, l.radius);
      g.addColorStop(0, `rgba(${rgb},${a})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(p.x - l.radius, p.y - l.radius, l.radius * 2, l.radius * 2);
    }
    this.fx.draw(ctx, 'add', this.sprites);
    ctx.globalCompositeOperation = 'source-over';
    for (const f of this.flashes) {
      const hex = (f.color || '#ffffff').replace('#', '');
      const n = parseInt(hex, 16);
      ctx.fillStyle = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${f.alpha * (1 - f.t / f.dur)})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },
};

export default CombatFxCanvas;
