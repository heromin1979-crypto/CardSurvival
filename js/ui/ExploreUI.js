// === EXPLORE UI — 서울 25구 탐색 화면 ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import I18n          from '../core/I18n.js';
import StateMachine  from '../core/StateMachine.js';
import ExploreSystem from '../systems/ExploreSystem.js';
import { DISTRICTS } from '../data/districts.js';

const DANGER_COLORS = ['#336633', '#4a7a33', '#886622', '#882222', '#550000', '#330000'];

const ExploreUI = {
  _screen: null,

  init() {
    this._screen = document.getElementById('screen-explore');

    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'explore') this.renderMap();
    });

    EventBus.on('districtChanged', () => {
      if (GameState.ui.currentState === 'explore') this.renderMap();
    });

    EventBus.on('locationChanged', () => {
      if (GameState.ui.currentState === 'explore') this.renderMap();
    });

    EventBus.on('languageChanged', () => {
      if (GameState.ui.currentState === 'explore') this.renderMap();
    });
  },

  // ── 메인 렌더 ────────────────────────────────────────────

  renderMap() {
    if (!this._screen) return;

    const gs       = GameState;
    const currentId = gs.location.currentDistrict ?? 'mapo';
    const current   = DISTRICTS[currentId];
    const visited   = new Set(gs.location.districtsVisited ?? []);
    const looted    = new Set(gs.location.districtsLooted  ?? []);
    const adjacent  = ExploreSystem.getAccessibleDistricts();
    const isLooted  = looted.has(currentId);

    const danger  = current?.dangerLevel ?? 1;
    const color   = DANGER_COLORS[Math.min(danger, DANGER_COLORS.length - 1)];
    const encPct  = Math.round((current?.encounterChance ?? 0) * 100);

    this._screen.innerHTML = `
      <div class="explore-layout">

        <!-- HUD -->
        <div class="explore-hud">
          <div class="hud-day">${I18n.t('explore.hud', { day: gs.time.day, time: this._fmtHour(gs.time.hour) })}</div>
          <div class="explore-hud-right">
            <span class="explore-location">${I18n.t('explore.location', { name: I18n.districtName(currentId, current?.name ?? currentId) })}</span>
            <span class="explore-noise">${I18n.t('explore.noise', { val: Math.round(gs.noise.level) })}</span>
            <button class="explore-map-btn" data-action="open-seoul-map" title="${I18n.t('explore.mapBtn')}">🗺</button>
          </div>
        </div>

        <!-- 현재 지역 배너 -->
        <div class="explore-current-banner" style="border-left:3px solid ${color}; padding:10px 14px; margin-bottom:8px; display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.3);">
          <span style="font-size:28px;">${current?.icon ?? '🗺'}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-size:15px; font-weight:bold; color:var(--text-primary);">${I18n.districtName(currentId, current?.name ?? currentId)}</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${(current?.description ?? '').slice(0, 70)}</div>
          </div>
          <div style="text-align:right; font-size:11px; flex-shrink:0;">
            <div style="color:${color};">${I18n.t('explore.dangerBar')} ${'█'.repeat(Math.min(danger, 5))}${'░'.repeat(Math.max(0, 5 - danger))}</div>
            <div style="color:var(--text-dim);">${I18n.t('explore.encounterPct', { pct: encPct })}</div>
            ${current?.radiation > 0 ? `<div class="radiation-badge">${I18n.t('explore.radiation', { val: current.radiation })}</div>` : ''}
            ${isLooted ? `<div class="node-visited-badge">${I18n.t('explore.explored')}</div>` : ''}
          </div>
        </div>

        <!-- 탐색 버튼 -->
        <div style="margin-bottom:12px;">
          <button class="toolbar-btn primary" id="btn-explore-district" style="width:100%; padding:10px; font-size:13px;">
            ${I18n.t('explore.exploreBtn')}${isLooted ? I18n.t('explore.reExplore') : ''}
          </button>
        </div>

        <!-- 인접 지역 이동 -->
        <div class="explore-section">
          <div class="explore-map-label">${I18n.t('explore.adjacent', { count: adjacent.length })}</div>
          <div class="district-grid">
            ${adjacent.map(d => this._buildDistrictCard(d, visited)).join('')}
          </div>
        </div>

        <!-- 툴바 -->
        <div class="explore-toolbar">
          <button class="toolbar-btn" id="btn-return-base">${I18n.t('explore.returnHome')}</button>
          <span class="explore-hint">${I18n.t('explore.hint')}</span>
        </div>

      </div>
    `;

    // 탐색 버튼
    this._screen.querySelector('#btn-explore-district')?.addEventListener('click', () => {
      ExploreSystem.exploreCurrentDistrict();
    });

    // 지역 이동 클릭
    this._screen.querySelectorAll('.district-card').forEach(el => {
      el.addEventListener('click', () => {
        ExploreSystem.travelToDistrict(el.dataset.districtId);
      });
    });

    // 귀환 버튼
    this._screen.querySelector('#btn-return-base')?.addEventListener('click', () => {
      StateMachine.transition('main');
    });
  },

  // ── 지역 이동 카드 ────────────────────────────────────────

  _buildDistrictCard(district, visitedSet) {
    const isVisited = visitedSet.has(district.id);
    const danger    = district.dangerLevel ?? 1;
    const color     = DANGER_COLORS[Math.min(danger, DANGER_COLORS.length - 1)];
    const encPct    = Math.round((district.encounterChance ?? 0) * 100);

    return `
      <div class="district-card" data-district-id="${district.id}"
           style="border-color:${color};">
        <div class="district-icon">${district.icon}</div>
        <div class="district-name">${I18n.districtName(district.id, district.name)}</div>
        <div class="district-desc">${(district.description ?? '').slice(0, 45)}…</div>
        <div class="node-meta">
          <span>🕒 ${district.travelCostTP}TP</span>
          <span>💀 ${encPct}%</span>
          ${district.radiation > 0 ? `<span class="radiation-badge">☢ ${district.radiation}</span>` : ''}
          ${isVisited ? `<span class="node-visited-badge">${I18n.t('map.visited')}</span>` : ''}
        </div>
      </div>
    `;
  },

  // 레거시 stub (showLootOverlay 호출부 호환)
  showLootOverlay() {},

  _fmtHour(h) {
    return `${String(Math.floor(h) % 24).padStart(2, '0')}:00`;
  },
};

export default ExploreUI;
