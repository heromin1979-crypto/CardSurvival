// === STAT RENDERER ===
// Updates HUD stat bars and TP clock
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import I18n        from '../core/I18n.js';
import NightSystem from '../systems/NightSystem.js';

// 사이드바에 표시할 필수 스탯 (4개)
const STAT_CONFIG = [
  { key: 'hydration',   i18nKey: 'stat.hydration',   icon: '💧' },
  { key: 'nutrition',   i18nKey: 'stat.nutrition',   icon: '🥗' },
  { key: 'fatigue',     i18nKey: 'stat.fatigue',     icon: '😴' },
];

// 장비창 "캐릭터 상태" 탭에 표시할 전체 스탯
const STAT_CONFIG_FULL = [
  { key: 'hydration',   i18nKey: 'stat.hydration',   icon: '💧' },
  { key: 'nutrition',   i18nKey: 'stat.nutrition',   icon: '🥗' },
  { key: 'stamina',     i18nKey: 'stat.stamina',     icon: '💪', isGood: true },
  { key: 'temperature', i18nKey: 'stat.temperature', icon: '🌡' },
  { key: 'morale',      i18nKey: 'stat.morale',      icon: '😐' },
  { key: 'radiation',   i18nKey: 'stat.radiation',   icon: '☢' },
  { key: 'infection',   i18nKey: 'stat.infection',   icon: '🦠' },
  { key: 'fatigue',     i18nKey: 'stat.fatigue',     icon: '😴' },
];

// 위험 임계값 — 사이드바 캐릭터 블록에 경고 아이콘으로 표시
const DANGER_THRESHOLDS = [
  { key: 'radiation',   icon: '☢',  check: (s) => s.current > 30 },
  { key: 'infection',   icon: '🦠', check: (s) => s.current > 25 },
  { key: 'temperature', icon: '🌡', check: (s) => s.current < 20 || s.current > 80 },
  { key: 'morale',      icon: '😟', check: (s) => s.current < 20 },
  { key: 'stamina',     icon: '💪', check: (s) => s.current < 20, isGood: true },
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
    // 사이드바: HP + 필수 3개만 표시
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
    `).join('');
  },

  /** 장비창 "캐릭터 상태" 탭용 전체 스탯 HTML 반환 */
  buildFullStatsHTML() {
    const gs = GameState;
    const barHtml = (cfg, current, max) => {
      const pct = Math.max(0, Math.min(100, (current / max) * 100));
      const isAccum = ['radiation','infection','fatigue'].includes(cfg.key);
      let cls = '';
      if (cfg.isGood)      { if (pct < 15) cls = 'danger'; else if (pct < 30) cls = 'warn'; }
      else if (isAccum)    { if (pct > 70) cls = 'danger'; else if (pct > 40) cls = 'warn'; }
      else                 { if (pct < 15) cls = 'danger'; else if (pct < 30) cls = 'warn'; }
      return `
        <div class="stat-bar-group ${cfg.key}">
          <div class="stat-bar-label">
            <span class="stat-bar-name">${cfg.icon} ${I18n.t(cfg.i18nKey)}</span>
            <span class="stat-bar-value">${Math.round(current)}</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill ${cfg.key} ${cls}" style="width:${pct}%"></div>
          </div>
        </div>`;
    };

    const hp  = gs.player.hp;
    const hpPct = Math.max(0, Math.min(100, (hp.current / hp.max) * 100));
    const hpCls = hpPct < 25 ? 'danger' : hpPct < 50 ? 'warn' : '';

    const hpHtml = `
      <div class="stat-bar-group hp">
        <div class="stat-bar-label">
          <span class="stat-bar-name">❤️ HP</span>
          <span class="stat-bar-value">${Math.round(hp.current)}/${hp.max}</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill hp ${hpCls}" style="width:${hpPct}%"></div>
        </div>
      </div>`;

    const statHtml = STAT_CONFIG_FULL.map(s => {
      const stat = gs.stats[s.key];
      if (!stat) return '';
      return barHtml(s, stat.current, stat.max);
    }).join('');

    const mental = gs.mental ?? {};
    const mentalHtml = `
      <div class="stat-divider-label">${I18n.t('mental.sectionLabel')}</div>
      ${['anxiety','loneliness','trauma'].map(key => {
        const icon = key === 'anxiety' ? '😟' : key === 'loneliness' ? '😔' : '💔';
        const val  = Math.round(mental[key] ?? 0);
        const cls  = val > 70 ? 'danger' : val > 40 ? 'warn' : '';
        return `
          <div class="stat-bar-group ${key}">
            <div class="stat-bar-label">
              <span class="stat-bar-name">${icon} ${I18n.t('mental.' + key)}</span>
              <span class="stat-bar-value">${val}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill mental-fill ${key} ${cls}" style="width:${val}%"></div>
            </div>
          </div>`;
      }).join('')}`;

    return hpHtml + statHtml + mentalHtml;
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
        group.classList.remove('flash-bad', 'flash-good', 'critical-alert');

        const isAccum = ['radiation','infection','fatigue'].includes(s.key);
        if (s.isGood) {
          if (pct < 15) fill.classList.add('danger');
          else if (pct < 30) fill.classList.add('warn');
        } else if (isAccum) {
          if (pct > 70) fill.classList.add('danger');
          else if (pct > 40) fill.classList.add('warn');
        } else {
          if (pct < 15) { fill.classList.add('danger'); group.classList.add('critical-alert'); }
          else if (pct < 30) fill.classList.add('warn');
          // 수분 20% 이하 추가 경보
          if (s.key === 'hydration' && pct < 20) group.classList.add('critical-alert');
        }
      }
    }

    // HP bar
    const hpFill  = document.getElementById('statfill-hp');
    const hpBarVal = document.getElementById('statval-hp');
    const hpGroup  = document.getElementById('statbar-hp');
    if (hpFill && hpBarVal) {
      const hp  = gs.player.hp;
      const pct = (hp.current / hp.max) * 100;
      hpFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      hpBarVal.textContent = `${Math.round(hp.current)}/${hp.max}`;
      hpFill.classList.remove('danger', 'warn');
      hpGroup?.classList.remove('critical-alert');
      if (pct < 25) { hpFill.classList.add('danger'); hpGroup?.classList.add('critical-alert'); }
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

    // 야간 HUD 인디케이터 (색상 구분)
    const nightEl = document.getElementById('hud-night-indicator');
    if (nightEl) {
      const isNight = NightSystem.isNight();
      const hasLight = isNight && NightSystem.hasLightSource();
      nightEl.textContent = isNight ? '🌙' : '';
      nightEl.className = isNight
        ? (hasLight ? 'bc-night-indicator night-lit' : 'bc-night-indicator night-dark night-flicker')
        : 'bc-night-indicator';
      // 야간 배경 틴트 — CSS 변수 전환
      document.documentElement.style.setProperty(
        '--bg-base', isNight ? '#090d12' : '#0d0d0d'
      );
    }

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
      encEl.style.color = enc.tier >= 4 ? 'var(--text-danger)'
                        : enc.tier >= 3 ? 'var(--text-warn)'
                        : '';
    }

    // 캐릭터 블록 위험 아이콘 (숨겨진 stat 경고)
    const dangerEl = document.getElementById('bc-danger-icons');
    if (dangerEl) {
      const icons = DANGER_THRESHOLDS
        .filter(d => {
          const stat = gs.stats[d.key];
          return stat && d.check(stat);
        })
        .map(d => `<span class="bc-danger-icon" title="${d.key}">${d.icon}</span>`)
        .join('');
      dangerEl.innerHTML = icons;
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
