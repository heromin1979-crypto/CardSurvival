// === STAT RENDERER ===
// Updates HUD stat bars and TP clock
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import GameData        from '../data/GameData.js';
import I18n            from '../core/I18n.js';
import NightSystem     from '../systems/NightSystem.js';
import BodyStatusModal from './BodyStatusModal.js';

// 사이드바에 표시할 필수 스탯 (4개)
const STAT_CONFIG = [
  { key: 'hydration',   i18nKey: 'stat.hydration',   icon: '💧' },
  { key: 'nutrition',   i18nKey: 'stat.nutrition',   icon: '🥗' },
  { key: 'stamina',     i18nKey: 'stat.stamina',     icon: '💪', isGood: true },
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
      <div class="stat-bar-group hp clickable" id="statbar-hp" title="신체 상태 보기">
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
    `).join('') + `
      <div id="hud-passive-badges" class="hud-passive-badges" style="display:none;"></div>
    `;

    // HP 막대 클릭 → 신체 상태 모달 진입
    const hpBar = statsDiv.querySelector('#statbar-hp');
    hpBar?.addEventListener('click', () => BodyStatusModal.open());
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

    // 최종 방어선: state와 화면 동기화 체크
    // encounter/combat 화면이 .active인데 state가 일치하지 않으면 강제 정리
    this._syncScreenState(gs);

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
    if (noiseVal) {
      // 현재 TP당 소음 감소율 계산: base 1.0 + scaledBonus (threshold 기반) + basecamp 보너스
      const baseDecay = 1.0;
      let scaledBonus = 0;
      const lvl = gs.noise.level;
      if (lvl >= 90)      scaledBonus = 1.5;
      else if (lvl >= 80) scaledBonus = 1.0;
      else if (lvl >= 70) scaledBonus = 0.5;
      const decayRate = (baseDecay + scaledBonus).toFixed(1);
      noiseVal.textContent = `${Math.round(lvl)} (-${decayRate}/TP)`;
    }

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

    // 구역 고정 구조물 효과 표시 (installedStructures 전용, 보드 카드 의료 구조물은 제외)
    this._renderInstalledStructure(gs);

    // 패시브 능력 배지 (감염 저항 등)
    this._renderPassiveBadges(gs);
  },

  /**
   * 사이드바 HUD에 패시브 능력 배지 렌더링.
   * - 감염 rateMultiplier < 1.0 일 때 "🛡️ 감염 저항 -XX% · 티어" 형태로 표시
   * - 현재 감염 수치에 따라 티어(정상/경계/위험/치명) 색상 변화
   */
  _renderPassiveBadges(gs) {
    const el = document.getElementById('hud-passive-badges');
    if (!el) return;

    const infStat = gs.stats.infection;
    const mult    = infStat?.rateMultiplier ?? 1.0;
    const badges  = [];

    if (mult < 1.0) {
      const reducePct = Math.round((1.0 - mult) * 100);
      const cur = infStat.current ?? 0;
      let tier, tierCls;
      if      (cur >= 70) { tier = '치명'; tierCls = 'danger'; }
      else if (cur >= 40) { tier = '위험'; tierCls = 'warn';   }
      else if (cur >= 15) { tier = '경계'; tierCls = 'caution';}
      else                { tier = '안정'; tierCls = 'safe';   }
      badges.push(
        `<div class="hud-badge infection-resist ${tierCls}" title="임상 지식: 감염 진행 속도 ${reducePct}% 감소">` +
          `<span class="badge-icon">🛡️</span>` +
          `<span class="badge-text">감염 저항 -${reducePct}%</span>` +
          `<span class="badge-tier">${tier}</span>` +
        `</div>`
      );
    }

    if (badges.length === 0) {
      el.style.display = 'none';
      el.innerHTML = '';
    } else {
      el.style.display = '';
      el.innerHTML = badges.join('');
    }
  },

  _renderInstalledStructure(gs) {
    let el = document.getElementById('hud-installed-structure');
    const installed = gs.location.installedStructures?.[gs.location.currentDistrict];
    if (!installed?.id) {
      if (el) el.style.display = 'none';
      return;
    }
    const def = GameData.items?.[installed.id];
    if (!def) {
      if (el) el.style.display = 'none';
      return;
    }

    // 효과 텍스트 생성
    const tick = def.onTick ?? {};
    const parts = [];
    if (tick.hp)        parts.push(`HP+${tick.hp}`);
    if (tick.infection) parts.push(`감염${tick.infection}`);
    if (tick.morale)    parts.push(`사기+${tick.morale}`);
    if (tick.fatigue)   parts.push(`피로${tick.fatigue}`);
    const effectText = parts.length > 0 ? ` (${parts.join(', ')})` : '';

    const dur = Math.max(0, installed.durability);
    const maxDur = installed.maxDurability || 100;
    const durPct = Math.min(100, (dur / maxDur) * 100);
    const durBarHtml = `<div class="struct-dur-track" style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:2px;">
      <div style="width:${durPct}%;height:100%;background:${durPct < 20 ? 'var(--text-danger,#c44)' : durPct < 50 ? 'var(--text-warn,#ca3)' : 'var(--text-good,#4a8)'};border-radius:2px;transition:width 0.3s;"></div>
    </div>`;

    if (!el) {
      const dangerEl = document.getElementById('bc-danger-icons');
      if (!dangerEl?.parentElement) return;
      el = document.createElement('div');
      el.id = 'hud-installed-structure';
      el.style.cssText = 'font-size:10px; color:var(--text-good, #4a8); padding:2px 6px; text-align:center; cursor:pointer;';
      dangerEl.parentElement.insertBefore(el, dangerEl.nextSibling);
    }
    el.innerHTML = `${def.icon ?? '⛺'} ${def.name}${effectText} <span style="opacity:0.7">${Math.round(dur)}/${maxDur}</span>${durBarHtml}`;
    el.style.display = '';
    el.style.cursor = 'pointer';

    el.onclick = () => {
      EventBus.emit('openStructureRepair', { districtId: gs.location.currentDistrict });
    };
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

  /**
   * 화면-state 동기화 감시.
   * encounter/combat 스크린이 활성 상태인데 state가 일치하지 않으면 강제로 정리.
   * 원인: 저장 복원 시 잔존 DOM, 캐시된 구버전 JS 등.
   */
  _syncScreenState(gs) {
    const st = gs.ui?.currentState;
    if (!st) return;
    // encounter 화면 검증
    const encEl = document.getElementById('screen-encounter');
    if (encEl?.classList.contains('active') && st !== 'encounter') {
      console.warn(`[StatRenderer] 불일치 감지: screen-encounter active but state=${st} — 정리 중`);
      encEl.classList.remove('active');
      encEl.innerHTML = '';
      // 현재 state에 맞는 화면 활성화
      const mapping = { main:'screen-main', explore:'screen-explore', rest:'screen-rest', main_menu:'screen-main-menu' };
      const target = document.getElementById(mapping[st] ?? 'screen-main');
      if (target) target.classList.add('active');
    }
    // combat 화면 검증
    const combatEl = document.getElementById('screen-combat');
    if (combatEl?.classList.contains('active') && st !== 'combat') {
      console.warn(`[StatRenderer] 불일치 감지: screen-combat active but state=${st} — 정리 중`);
      combatEl.classList.remove('active');
      combatEl.innerHTML = '';
      const mapping = { main:'screen-main', explore:'screen-explore', rest:'screen-rest', main_menu:'screen-main-menu' };
      const target = document.getElementById(mapping[st] ?? 'screen-main');
      if (target) target.classList.add('active');
    }
  },

  _formatHour(h) {
    const hh = Math.floor(h) % 24;
    return `${String(hh).padStart(2,'0')}:00`;
  },
};

export default StatRenderer;
