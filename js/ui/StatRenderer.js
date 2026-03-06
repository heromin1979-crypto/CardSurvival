// === STAT RENDERER ===
// Updates HUD stat bars and TP clock
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const STAT_CONFIG = [
  { key: 'hydration',   label: '수분',   icon: '💧' },
  { key: 'nutrition',   label: '영양',   icon: '🥗' },
  { key: 'temperature', label: '체온',   icon: '🌡' },
  { key: 'morale',      label: '사기',   icon: '😐' },
  { key: 'radiation',   label: '방사선', icon: '☢' },
  { key: 'infection',   label: '감염',   icon: '🦠' },
  { key: 'fatigue',     label: '피로',   icon: '😴' },
];

const StatRenderer = {
  _hud: null,

  _listenersRegistered: false,

  init() {
    if (!this._listenersRegistered) {
      this._listenersRegistered = true;
      EventBus.on('statChanged',   () => this.render());
      EventBus.on('tpAdvance',     () => this.render());
      EventBus.on('miniTick',      () => this._updateTPClock());
      EventBus.on('loaded',        () => { this.buildDOM(); this.render(); });
    }
  },

  // Called by Basecamp after it creates the HUD DOM
  buildDOM() {
    this._buildDOM();
  },

  _buildDOM() {
    // Build stat bars into hud-stat-bars (created by Basecamp layout)
    const statsDiv = document.getElementById('hud-stat-bars');
    if (!statsDiv) return;

    statsDiv.innerHTML = STAT_CONFIG.map(s => `
      <div class="stat-bar-group ${s.key}" id="statbar-${s.key}">
        <div class="stat-bar-label">
          <span class="stat-bar-name">${s.icon} ${s.label}</span>
          <span class="stat-bar-value" id="statval-${s.key}">--</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill ${s.key}" id="statfill-${s.key}" style="width:0%"></div>
        </div>
      </div>
    `).join('');
  },

  render() {
    const gs = GameState;

    // Update stat bars
    for (const s of STAT_CONFIG) {
      const stat = gs.stats[s.key];
      if (!stat) continue;

      const pct  = (stat.current / stat.max) * 100;
      const fill = document.getElementById(`statfill-${s.key}`);
      const val  = document.getElementById(`statval-${s.key}`);
      const group= document.getElementById(`statbar-${s.key}`);

      if (fill) fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      if (val)  val.textContent  = Math.round(stat.current);

      if (fill && group) {
        fill.classList.remove('danger', 'warn');
        group.classList.remove('flash-bad', 'flash-good');

        const isAccum = ['radiation','infection','fatigue'].includes(s.key);
        if (isAccum) {
          if (pct > 70) fill.classList.add('danger');
          else if (pct > 40) fill.classList.add('warn');
        } else {
          if (pct < 15) fill.classList.add('danger');
          else if (pct < 30) fill.classList.add('warn');
        }
      }
    }

    // Day/hour display
    const dayEl  = document.getElementById('hud-day');
    const timeEl = document.getElementById('hud-time');
    if (dayEl)  dayEl.textContent  = `Day ${gs.time.day}`;
    if (timeEl) timeEl.textContent = this._formatHour(gs.time.hour);

    // HP
    const hpEl = document.getElementById('hud-hp');
    if (hpEl) {
      const hp = gs.player.hp;
      hpEl.textContent = `HP ${hp.current}/${hp.max}`;
    }

    // Noise
    const noiseEl   = document.getElementById('noise-fill');
    const noiseVal  = document.getElementById('noise-val');
    const noiseTrack= document.getElementById('noise-track');
    if (noiseEl) {
      const n = gs.noise;
      noiseEl.style.width = Math.min(100, n.level) + '%';
      noiseEl.classList.toggle('critical', n.level >= n.influxThreshold);
    }
    if (noiseVal) noiseVal.textContent = Math.round(gs.noise.level);

    // Encumbrance
    const encEl = document.getElementById('hud-enc');
    if (encEl) {
      const enc = gs.player.encumbrance;
      encEl.textContent = `${enc.current.toFixed(1)}/${enc.max}kg`;
    }
  },

  _updateTPClock() {
    const gs     = GameState;
    const miniPct = (gs.time.totalTP % 1) * 100; // 0-100 within current TP
    const fill    = document.getElementById('tp-clock-fill');
    if (fill) {
      fill.style.width = miniPct + '%';
      fill.classList.add('tick');
      setTimeout(() => fill.classList.remove('tick'), 200);
    }
    const val = document.getElementById('tp-clock-val');
    if (val) val.textContent = `TP ${Math.floor(gs.time.totalTP)}`;
  },

  _formatHour(h) {
    const hh = Math.floor(h) % 24;
    return `${String(hh).padStart(2,'0')}:00`;
  },
};

export default StatRenderer;
