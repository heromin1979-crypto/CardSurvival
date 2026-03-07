// === MAIN MENU SCREEN ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import StateMachine  from '../core/StateMachine.js';
import SaveManager   from '../persistence/SaveManager.js';
import EndingSystem  from '../systems/EndingSystem.js';

const SLOT_COUNT = 3;

const MainMenu = {
  _el: null,

  init() {
    this._el = document.getElementById('screen-main-menu');
    this._render();
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'main_menu') this._render();
    });
  },

  _render() {
    if (!this._el) return;

    const slotsHtml   = Array.from({ length: SLOT_COUNT }, (_, i) => this._buildSlotCard(i)).join('');
    const unlocked    = EndingSystem.getUnlocked().length;
    const totalEndings = 24;
    const pct         = Math.round((unlocked / totalEndings) * 100);

    this._el.innerHTML = `
      <div style="text-align:center;margin-bottom:28px;">
        <div class="main-menu-title-big">RUINED CITY</div>
        <div class="main-menu-subtitle">CARD SURVIVAL · 2099</div>
      </div>

      <div class="save-slots-grid">${slotsHtml}</div>

      <div class="mm-gallery-row">
        <button class="mm-gallery-btn" id="mm-gallery-btn">
          <span class="mm-gallery-icon">📖</span>
          <span class="mm-gallery-label">엔딩 컬렉션</span>
          <span class="mm-gallery-count">${unlocked} / ${totalEndings}</span>
          <div class="mm-gallery-bar">
            <div class="mm-gallery-fill" style="width:${pct}%"></div>
          </div>
        </button>
      </div>

      <div class="main-menu-version">v0.2 prototype</div>
    `;

    this._bindSlotEvents();
  },

  _buildSlotCard(slot) {
    const meta = SaveManager.getMeta(slot);
    if (meta) {
      const saved   = this._relativeTime(meta.savedAt);
      const dayStr  = `Day ${meta.day}`;
      const nameStr = meta.playerName ?? 'Survivor';
      const isDead  = !!meta.isDead;
      const icon    = isDead ? '💀' : '🧍';
      const loadBtn = isDead
        ? `<button class="menu-btn save-slot-load disabled" data-slot="${slot}" disabled title="사망한 캐릭터는 이어할 수 없습니다">이어하기 불가</button>`
        : `<button class="menu-btn primary save-slot-load" data-slot="${slot}">이어하기</button>`;
      return `
        <div class="save-slot-card occupied${isDead ? ' is-dead' : ''}" data-slot="${slot}">
          <div class="save-slot-header">
            <span class="save-slot-num">슬롯 ${slot + 1}</span>
            <button class="save-slot-delete" data-slot="${slot}" title="삭제">✕</button>
          </div>
          <div class="save-slot-icon">${icon}</div>
          <div class="save-slot-name">${nameStr}</div>
          <div class="save-slot-day">${dayStr}${isDead ? ' — 사망' : ''}</div>
          <div class="save-slot-time">${saved}</div>
          ${loadBtn}
        </div>
      `;
    } else {
      return `
        <div class="save-slot-card empty" data-slot="${slot}">
          <div class="save-slot-header">
            <span class="save-slot-num">슬롯 ${slot + 1}</span>
          </div>
          <div class="save-slot-icon">➕</div>
          <div class="save-slot-name" style="color:var(--text-dim);">빈 슬롯</div>
          <div class="save-slot-day" style="color:var(--text-dim);">—</div>
          <div class="save-slot-time"></div>
          <button class="menu-btn save-slot-new" data-slot="${slot}">새 게임</button>
        </div>
      `;
    }
  },

  _bindSlotEvents() {
    // 엔딩 갤러리 버튼
    document.getElementById('mm-gallery-btn')?.addEventListener('click', () => {
      StateMachine.transition('ending_gallery');
    });
    // 이어하기
    this._el.querySelectorAll('.save-slot-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot, 10);
        if (SaveManager.load(slot)) {
          GameState.ui.saveSlot = slot;
          // deserialize가 currentState를 'basecamp'로 복원하므로
          // StateMachine이 from===to 조건으로 조기 리턴하는 것을 방지
          GameState.ui.currentState = 'main_menu';
          StateMachine.transition('basecamp');
        }
      });
    });

    // 새 게임
    this._el.querySelectorAll('.save-slot-new').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot, 10);
        GameState.ui.saveSlot = slot;
        StateMachine.transition('char_create');
      });
    });

    // 삭제
    this._el.querySelectorAll('.save-slot-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = parseInt(btn.dataset.slot, 10);
        if (confirm(`슬롯 ${slot + 1}의 저장 파일을 삭제하시겠습니까?`)) {
          SaveManager.deleteSave(slot);
          this._render();
        }
      });
    });
  },

  _relativeTime(isoStr) {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days  > 0)  return `${days}일 전`;
    if (hours > 0)  return `${hours}시간 전`;
    if (mins  > 0)  return `${mins}분 전`;
    return '방금 전';
  },
};

export default MainMenu;
