// === DEBUG PANEL ===
// ?debug=1 URL 파라미터로만 활성화되는 밸런스 디버그 패널.
// 인스펙터, TP 스킵, 스탯 편집, 아이템 지급 기능 제공.
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import TickEngine from '../core/TickEngine.js';
import GameData   from '../data/GameData.js';

const STAT_FIELDS = [
  { key: 'hydration',   label: 'Hydration'   },
  { key: 'nutrition',   label: 'Nutrition'   },
  { key: 'morale',      label: 'Morale'      },
  { key: 'fatigue',     label: 'Fatigue'     },
  { key: 'temperature', label: 'Temperature' },
  { key: 'radiation',   label: 'Radiation'   },
];

const DebugPanel = {
  _el:        null,
  _inspector: null,
  _msgEl:     null,
  _collapsed: false,

  init() {
    // CSS 동적 삽입
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'css/debug.css';
    document.head.appendChild(link);

    const container = document.getElementById('debug-panel');
    if (!container) return;

    container.innerHTML = this._buildHTML();
    this._el        = container;
    this._inspector = container.querySelector('.dbg-inspector');
    this._msgEl     = container.querySelector('.dbg-msg');

    this._bindEvents();
    this._refresh();

    // 매 TP마다 인스펙터 갱신
    EventBus.on('tpAdvance',    () => this._refresh());
    EventBus.on('boardChanged', () => this._refresh());
    EventBus.on('statChanged',  () => this._refresh());
  },

  // ── DOM 빌드 ──────────────────────────────────────────────

  _buildHTML() {
    const statRows = STAT_FIELDS.map(({ key, label }) => `
      <div class="dbg-stat-row">
        <span class="dbg-stat-label">${label}</span>
        <input class="dbg-stat-input" type="number" data-stat="${key}" min="0" max="999" step="1">
        <button class="dbg-set-btn" data-stat="${key}">Set</button>
      </div>`).join('');

    return `
      <div class="dbg-header" id="dbg-toggle">
        <span>🛠 DEBUG</span>
        <span class="dbg-toggle-icon" id="dbg-icon">▼</span>
      </div>
      <div class="dbg-body" id="dbg-body">
        <!-- 인스펙터 -->
        <div class="dbg-section">
          <div class="dbg-section-title">Inspector</div>
          <div class="dbg-inspector"></div>
        </div>
        <!-- TP 스킵 -->
        <div class="dbg-section">
          <div class="dbg-section-title">Skip TP</div>
          <div class="dbg-btn-row">
            <button class="dbg-btn" data-skip="1">+1 TP</button>
            <button class="dbg-btn" data-skip="10">+10 TP</button>
            <button class="dbg-btn" data-skip="72">+1 Day</button>
          </div>
        </div>
        <!-- 스탯 편집 -->
        <div class="dbg-section">
          <div class="dbg-section-title">Set Stats</div>
          ${statRows}
          <div class="dbg-stat-row" style="margin-top:4px">
            <span class="dbg-stat-label">HP</span>
            <input class="dbg-stat-input" type="number" data-stat="hp" min="0" max="999" step="1">
            <button class="dbg-set-btn" data-stat="hp">Set</button>
          </div>
        </div>
        <!-- 아이템 지급 -->
        <div class="dbg-section">
          <div class="dbg-section-title">Give Item</div>
          <div class="dbg-give-row">
            <input class="dbg-item-input" id="dbg-item-id" type="text" placeholder="item_id" spellcheck="false">
            <input class="dbg-qty-input"  id="dbg-item-qty" type="number" value="1" min="1" max="99">
            <button class="dbg-give-btn" id="dbg-give-btn">Give</button>
          </div>
          <div class="dbg-msg" id="dbg-msg"></div>
        </div>
      </div>`;
  },

  // ── 이벤트 바인딩 ─────────────────────────────────────────

  _bindEvents() {
    // 접기/펼치기
    this._el.querySelector('#dbg-toggle').addEventListener('click', () => {
      this._collapsed = !this._collapsed;
      this._el.querySelector('#dbg-body').classList.toggle('hidden', this._collapsed);
      this._el.querySelector('#dbg-icon').classList.toggle('collapsed', this._collapsed);
    });

    // TP 스킵
    this._el.querySelectorAll('[data-skip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.skip, 10);
        TickEngine.skipTP(n);
      });
    });

    // 스탯 Set 버튼
    this._el.querySelectorAll('.dbg-set-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setStat(btn.dataset.stat));
    });

    // 스탯 입력 Enter 키
    this._el.querySelectorAll('.dbg-stat-input').forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') this._setStat(input.dataset.stat);
      });
    });

    // 아이템 지급
    this._el.querySelector('#dbg-give-btn').addEventListener('click', () => this._giveItem());
    this._el.querySelector('#dbg-item-id').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._giveItem();
    });
  },

  // ── 인스펙터 갱신 ─────────────────────────────────────────

  _refresh() {
    if (!this._inspector) return;
    const gs  = GameState;
    const s   = gs.stats;
    const t   = gs.time;
    const p   = gs.player;

    const row = (key, val, cls = '') =>
      `<div class="dbg-row">
        <span class="dbg-key">${key}</span>
        <span class="dbg-val ${cls}">${val}</span>
      </div>`;

    const statCls = (v, max) => v < max * 0.25 ? 'low' : v < max * 0.5 ? 'warn' : '';

    this._inspector.innerHTML = [
      row('Day / TP / Hr', `${t.day} / ${t.totalTP} / ${t.hour}:00`),
      row('HP',         `${p.hp.current}/${p.hp.max}`,    statCls(p.hp.current, p.hp.max)),
      row('Hydration',  `${Math.round(s.hydration.current)}/${s.hydration.max}`, statCls(s.hydration.current, s.hydration.max)),
      row('Nutrition',  `${Math.round(s.nutrition.current)}/${s.nutrition.max}`, statCls(s.nutrition.current, s.nutrition.max)),
      row('Morale',     `${Math.round(s.morale.current)}/${s.morale.max}`,       statCls(s.morale.current, s.morale.max)),
      row('Fatigue',    `${Math.round(s.fatigue.current)}/${s.fatigue.max}`,     s.fatigue.current > 70 ? 'warn' : ''),
      row('Noise',      `${gs.noise.level} / ${gs.noise.influxThreshold}`),
      row('Board cards',`${Object.keys(gs.cards).length}`),
    ].join('');
  },

  // ── 스탯 편집 ─────────────────────────────────────────────

  _setStat(stat) {
    const input = this._el.querySelector(`.dbg-stat-input[data-stat="${stat}"]`);
    if (!input) return;
    const raw = parseFloat(input.value);
    if (isNaN(raw)) return;

    if (stat === 'hp') {
      const max = GameState.player.hp.max;
      GameState.player.hp.current = Math.max(0, Math.min(max, raw));
    } else if (GameState.stats[stat]) {
      const max = GameState.stats[stat].max;
      GameState.stats[stat].current = Math.max(0, Math.min(max, raw));
    }

    EventBus.emit('statChanged', { stat, value: raw });
    EventBus.emit('boardChanged', {});
    this._refresh();
  },

  // ── 아이템 지급 ───────────────────────────────────────────

  _giveItem() {
    const defId = this._el.querySelector('#dbg-item-id').value.trim();
    const qty   = Math.max(1, parseInt(this._el.querySelector('#dbg-item-qty').value, 10) || 1);
    const msg   = this._el.querySelector('#dbg-msg');

    if (!defId) {
      this._showMsg('item ID를 입력하세요.', true);
      return;
    }

    if (!GameData.items[defId]) {
      this._showMsg(`❌ 알 수 없는 ID: ${defId}`, true);
      return;
    }

    const inst = GameState.createCardInstance(defId, { quantity: qty });
    if (!inst) {
      this._showMsg('❌ 카드 생성 실패', true);
      return;
    }

    const placed = GameState.placeCardInRow(inst.instanceId);
    if (!placed) {
      // 보드가 꽉 찬 경우 — 인스턴스는 cards에 존재, 보드 미배치
      this._showMsg(`⚠ 보드 꽉 참 — cards에 추가됨 (${inst.instanceId})`, false);
    } else {
      this._showMsg(`✓ ${defId} ×${qty} → ${placed.row}[${placed.slot}]`);
    }

    EventBus.emit('boardChanged', {});
  },

  _showMsg(text, isErr = false) {
    if (!this._msgEl) return;
    this._msgEl.textContent = text;
    this._msgEl.className   = `dbg-msg${isErr ? ' err' : ''}`;
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => { if (this._msgEl) this._msgEl.textContent = ''; }, 3000);
  },
};

export default DebugPanel;
