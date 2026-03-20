// === STAT RENDERER ===
// Updates HUD stat bars and TP clock
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';

const STAT_CONFIG = [
  { key: 'hydration',   i18nKey: 'stat.hydration',   icon: '💧' },
  { key: 'nutrition',   i18nKey: 'stat.nutrition',   icon: '🥗' },
  { key: 'stamina',     i18nKey: 'stat.stamina',     icon: '💪', isGood: true },  // 높을수록 좋음
  { key: 'temperature', i18nKey: 'stat.temperature', icon: '🌡' },
  { key: 'morale',      i18nKey: 'stat.morale',      icon: '😐' },
  { key: 'radiation',   i18nKey: 'stat.radiation',   icon: '☢' },
  { key: 'infection',   i18nKey: 'stat.infection',   icon: '🦠' },
  { key: 'fatigue',     i18nKey: 'stat.fatigue',     icon: '😴' },
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
      EventBus.on('languageChanged', () => { this.buildDOM(); this.render(); });
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

    const hpBarHTML = `
      <div class="stat-bar-group hp" id="statbar-hp">
        <div class="stat-bar-label">
          <span class="stat-bar-name">❤️ HP</span>
          <span class="stat-bar-value" id="statval-hp">--</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill hp" id="statfill-hp" style="width:0%"></div>
        </div>
      </div>
    `;
    const mentalBarHTML = `
      <div class="stat-divider-label">${I18n.t('mental.sectionLabel')}</div>
      ${['anxiety','loneliness','trauma'].map(key => {
        const icon = key === 'anxiety' ? '😟' : key === 'loneliness' ? '😔' : '💔';
        return `
        <div class="stat-bar-group ${key}" id="statbar-${key}">
          <div class="stat-bar-label">
            <span class="stat-bar-name">${icon} ${I18n.t('mental.' + key)}</span>
            <span class="stat-bar-value" id="statval-${key}">0</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill mental-fill ${key}" id="statfill-${key}" style="width:0%"></div>
          </div>
        </div>`;
      }).join('')}
    `;

    statsDiv.innerHTML = hpBarHTML + STAT_CONFIG.map(s => `
      <div class="stat-bar-group ${s.key}" id="statbar-${s.key}">
        <div class="stat-bar-label">
          <span class="stat-bar-name">${s.icon} ${I18n.t(s.i18nKey)}</span>
          <span class="stat-bar-value" id="statval-${s.key}">--</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill ${s.key}" id="statfill-${s.key}" style="width:0%"></div>
        </div>
      </div>
    `).join('') + mentalBarHTML;
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
        if (s.isGood) {
          // 스태미나: 낮을수록 위험 (hydration/nutrition과 동일)
          if (pct < 15) fill.classList.add('danger');
          else if (pct < 30) fill.classList.add('warn');
        } else if (isAccum) {
          if (pct > 70) fill.classList.add('danger');
          else if (pct > 40) fill.classList.add('warn');
        } else {
          if (pct < 15) fill.classList.add('danger');
          else if (pct < 30) fill.classList.add('warn');
        }
      }
    }

    // HP bar
    const hpFill  = document.getElementById('statfill-hp');
    const hpBarVal = document.getElementById('statval-hp');
    if (hpFill && hpBarVal) {
      const hp  = gs.player.hp;
      const pct = (hp.current / hp.max) * 100;
      hpFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      hpBarVal.textContent = `${Math.round(hp.current)}/${hp.max}`;
      hpFill.classList.remove('danger', 'warn');
      if (pct < 25) hpFill.classList.add('danger');
      else if (pct < 50) hpFill.classList.add('warn');
    }

    // Mental state bars (anxiety, loneliness, trauma)
    const mental = gs.mental;
    if (mental) {
      for (const key of ['anxiety', 'loneliness', 'trauma']) {
        const val  = Math.round(mental[key] ?? 0);
        const pct  = Math.max(0, Math.min(100, val));
        const fill = document.getElementById(`statfill-${key}`);
        const vEl  = document.getElementById(`statval-${key}`);
        if (fill) {
          fill.style.width = pct + '%';
          fill.classList.remove('danger', 'warn');
          if (pct > 70) fill.classList.add('danger');
          else if (pct > 40) fill.classList.add('warn');
        }
        if (vEl) vEl.textContent = val;
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
      const enc    = gs.player.encumbrance;
      const pctVal = Math.round((enc.weightPct ?? 0) * 100);
      encEl.textContent = `${enc.current.toFixed(1)}/${enc.max}kg (${pctVal}%)`;
      // 과적 경고 색상
      encEl.style.color = enc.tier >= 4 ? 'var(--text-danger)'
                        : enc.tier >= 3 ? 'var(--text-warn)'
                        : '';
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
