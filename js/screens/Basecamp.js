// === BASECAMP SCREEN ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine  from '../core/TickEngine.js';
import CraftUI        from '../ui/CraftUI.js';
import BoardRenderer  from '../ui/BoardRenderer.js';
import StatRenderer   from '../ui/StatRenderer.js';
import SaveManager    from '../persistence/SaveManager.js';
import EquipmentModal  from '../ui/EquipmentModal.js';
import LandmarkModal   from '../ui/LandmarkModal.js';
import SkillModal      from '../ui/SkillModal.js';
import BasecampModal  from '../ui/BasecampModal.js';
import QuestSystem    from '../systems/QuestSystem.js';
import SeasonSystem    from '../systems/SeasonSystem.js';
import WeatherSystem   from '../systems/WeatherSystem.js';

const Basecamp = {
  _el: null,

  init() {
    this._el = document.getElementById('screen-basecamp');
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'basecamp') this._onEnter();
    });
    EventBus.on('questListChanged', () => {
      if (GameState.ui.currentState === 'basecamp') this._updateQuestPanel();
    });
    // 약탈자 협상 이벤트 리스너
    EventBus.on('raiderDemand', (data) => {
      if (GameState.ui.currentState === 'basecamp') this._showRaiderModal(data);
    });
  },

  _onEnter() {
    if (!this._el) return;
    this._buildLayout();
    StatRenderer.buildDOM();
    StatRenderer.render();
    BoardRenderer.reinit();
    // Update char name display
    const nameEl = document.getElementById('bc-char-name');
    if (nameEl) nameEl.textContent = GameState.player.name;
    // Update current district display
    const districtEl = document.getElementById('bc-district-name');
    if (districtEl) {
      const distId = GameState.location.currentDistrict ?? 'mapo';
      const node   = window.__GAME_DATA__?.nodes?.[distId];
      districtEl.textContent = `📍 ${node?.name ?? distId}`;
    }
    CraftUI.init();
    EquipmentModal.init();
    LandmarkModal.init();
    SkillModal.init();
    BasecampModal.init();
    this._updateQuestPanel();
    // 계절 배지 초기화
    const seasonInfo = SeasonSystem.getSeasonInfo();
    const seasonBadge = document.getElementById('season-badge');
    if (seasonBadge) {
      seasonBadge.textContent = `${seasonInfo.icon} ${seasonInfo.name}`;
      seasonBadge.dataset.season = seasonInfo.id;
    }
    // 날씨 표시 갱신
    WeatherSystem.renderHUD();
  },

  _buildLayout() {
    this._el.innerHTML = `
      <aside class="bc-sidebar">
        <!-- Minimap -->
        <div class="bc-minimap" data-action="open-seoul-map" title="서울 지도 보기">
          <span>🗺</span>
          <span class="bc-minimap-label">도시 지도</span>
        </div>

        <!-- Day / Time / TP -->
        <div class="bc-time-block">
          <div class="bc-day-row">
            <span id="hud-day" class="bc-day">Day 1</span>
            <span id="hud-time" class="bc-clock">06:00</span>
          </div>
          <div class="bc-tp-row">
            <span class="bc-tp-label">TP</span>
            <div class="tp-clock-track" style="flex:1;">
              <div class="tp-clock-fill" id="tp-clock-fill" style="width:0%"></div>
            </div>
            <span class="tp-clock-value" id="tp-clock-val">0</span>
          </div>
          <!-- 계절 + 날씨 행 -->
          <div class="bc-season-weather-row">
            <div id="season-badge" class="bc-season-badge" data-season="spring">🌸 봄</div>
            <div id="weather-display" class="bc-weather-badge" data-weather="sunny">☀️ 맑음</div>
          </div>
          <!-- 온도 표시 -->
          <div id="outdoor-temp" class="bc-temp-display temp-normal">🌡 --°C</div>
        </div>

        <!-- Character (클릭 → 장비 창) -->
        <div class="bc-char-block" id="bc-char-block" style="cursor:pointer;" title="장비 관리 클릭">
          <div class="bc-avatar">👤</div>
          <div class="bc-char-info">
            <div class="bc-char-name" id="bc-char-name">생존자</div>
            <div class="bc-char-sub" id="bc-district-name">📍 마포구</div>
            <div class="bc-char-hp"><span id="hud-hp">❤ 100/100</span></div>
          </div>
        </div>

        <!-- 질병 상태 표시 (DiseaseSystem이 채움) -->
        <div id="disease-status" class="bc-disease-status" style="display:none;"></div>

        <!-- Stat bars (StatRenderer fills this) -->
        <div id="hud-stat-bars" class="stat-bars"></div>

        <!-- Noise -->
        <div class="bc-noise-block">
          <div class="noise-label">
            <span>소음</span>
            <span id="noise-val">0</span>
          </div>
          <div class="noise-track" id="noise-track">
            <div class="noise-fill" id="noise-fill" style="width:0%"></div>
          </div>
        </div>

        <!-- Encumbrance -->
        <div class="bc-enc-block">⚖ <span id="hud-enc">0/30kg</span></div>

        <!-- Quest placeholder -->
        <div class="bc-quests-block">
          <div class="bc-block-title">퀘스트 및 블루프린트</div>
          <div class="bc-block-content" id="bc-quest-info">활성 퀘스트: 0개</div>
        </div>

        <!-- Action buttons -->
        <div class="bc-sidebar-btns">
          <button class="toolbar-btn" id="btn-craft">🔨 제작</button>
          <button class="toolbar-btn" id="btn-skills">📊 숙련도</button>
          <button class="toolbar-btn" id="btn-basecamp">🏕 거점 강화</button>
          <button class="toolbar-btn" id="btn-wait">⏱ 대기</button>
          <button class="toolbar-btn" id="btn-rest">💤 휴식</button>
          <button class="toolbar-btn" id="btn-save">💾 저장</button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="bc-main" id="bc-main">
        <div id="board-container"></div>
      </main>

      <!-- Equipment modal -->
      <div class="modal-overlay" id="equip-modal">
        <div class="equip-modal-box"></div>
      </div>

      <!-- Landmark modal -->
      <div class="modal-overlay" id="landmark-modal">
        <div class="landmark-modal-box"></div>
      </div>

      <!-- Skill modal -->
      <div class="modal-overlay" id="skill-modal">
        <div class="skill-modal-box"></div>
      </div>

      <!-- Basecamp upgrade modal -->
      <div class="modal-overlay" id="basecamp-upgrade-modal">
        <div class="bc-upgrade-modal-box"></div>
      </div>

      <!-- Craft modal -->
      <div class="modal-overlay" id="craft-modal">
        <div class="modal-box" style="max-width:420px;max-height:85vh;">
          <div class="modal-title">🔨 제작대</div>
          <div id="craft-panel" style="flex:1;overflow-y:auto;"></div>
          <div class="modal-actions">
            <button class="modal-btn" id="btn-craft-close">닫기</button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  },

  _bindEvents() {
    // Equipment modal open (char block 클릭)
    this._el.querySelector('#bc-char-block')?.addEventListener('click', () => {
      EquipmentModal.open();
    });

    // Skill modal open
    this._el.querySelector('#btn-skills')?.addEventListener('click', () => {
      SkillModal.open();
    });

    // Basecamp upgrade modal open
    this._el.querySelector('#btn-basecamp')?.addEventListener('click', () => {
      BasecampModal.open();
    });

    // Craft modal open
    this._el.querySelector('#btn-craft')?.addEventListener('click', () => {
      const modal = document.getElementById('craft-modal');
      modal?.classList.add('open');
      GameState.ui.basecampMode = 'CRAFT';
      CraftUI._panel = document.getElementById('craft-panel');
      CraftUI.render();
    });

    // Craft modal close (button)
    this._el.querySelector('#btn-craft-close')?.addEventListener('click', () => {
      this._closeCraftModal();
    });

    // Craft modal close (overlay click)
    this._el.querySelector('#craft-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('craft-modal')) {
        this._closeCraftModal();
      }
    });

    // Wait 1 TP
    this._el.querySelector('#btn-wait')?.addEventListener('click', () => {
      TickEngine.skipTP(1, '대기');
    });

    // Rest
    this._el.querySelector('#btn-rest')?.addEventListener('click', () => {
      StateMachine.transition('rest');
    });

    // Save
    this._el.querySelector('#btn-save')?.addEventListener('click', () => {
      SaveManager.save(GameState.ui.saveSlot ?? 0);
    });
  },

  _closeCraftModal() {
    const modal = document.getElementById('craft-modal');
    modal?.classList.remove('open');
    GameState.ui.basecampMode = 'INVENTORY';
  },

  // ── 약탈자 협상 모달 ───────────────────────────────────────────

  _showRaiderModal({ demandCardIds, demandCount, onSurrender, onRefuse }) {
    const gs    = GameState;
    const items = window.__GAME_DATA__?.items ?? {};

    // 요구 아이템 목록 생성
    const demandList = demandCardIds.map(id => {
      const inst = gs.cards[id];
      if (!inst) return '(불명)';
      const def = items[inst.definitionId];
      return `${def?.icon ?? '📦'} ${def?.name ?? inst.definitionId}`;
    }).join(', ');

    // 모달 생성
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'raider-demand-modal';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:400px;">
        <div class="modal-title">🔫 약탈자 등장!</div>
        <div style="padding:12px;line-height:1.6;">
          <p>무장한 약탈자가 거점에 나타났다.</p>
          <p>"물자를 넘기면 살려주지."</p>
          <p style="margin-top:8px;font-weight:bold;">요구 물자 (${demandCount}개):</p>
          <p style="color:#ff9800;">${demandList}</p>
        </div>
        <div class="modal-actions" style="gap:8px;">
          <button class="modal-btn" id="raider-surrender" style="background:#e65100;">물자를 넘긴다</button>
          <button class="modal-btn" id="raider-refuse" style="background:#b71c1c;">싸운다</button>
        </div>
      </div>
    `;
    this._el.appendChild(overlay);

    overlay.querySelector('#raider-surrender')?.addEventListener('click', () => {
      overlay.remove();
      onSurrender();
    });
    overlay.querySelector('#raider-refuse')?.addEventListener('click', () => {
      overlay.remove();
      onRefuse();
    });
  },

  _updateQuestPanel() {
    const el = document.getElementById('bc-quest-info');
    if (!el) return;

    const active = QuestSystem.getActiveQuests();
    if (active.length === 0) {
      el.innerHTML = '<span class="bc-quest-empty">활성 퀘스트: 0개</span>';
      return;
    }

    el.innerHTML = active.map(q => {
      const def     = q.def;
      const pct     = def ? Math.round((q.progress / def.objective.count) * 100) : 0;
      const dayLeft = q.deadline - GameState.time.day;
      return `
        <div class="bc-quest-item">
          <div class="bc-quest-title">${def?.icon ?? '📋'} ${def?.title ?? q.id}</div>
          <div class="bc-quest-progress-bar">
            <div class="bc-quest-fill" style="width:${pct}%"></div>
          </div>
          <div class="bc-quest-meta">${q.progress}/${def?.objective.count ?? '?'} · 남은 기간 ${dayLeft}일</div>
        </div>
      `;
    }).join('');
  },
};

export default Basecamp;
