// === ENDING SCREEN ===
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import SaveManager  from '../persistence/SaveManager.js';
import EndingSystem from '../systems/EndingSystem.js';

const CATEGORY_LABELS = {
  death:     '사망',
  milestone: '마일스톤',
  escape:    '탈출',
  character: '캐릭터',
};

const CATEGORY_COLORS = {
  death:     '#c0392b',
  milestone: '#d4ac0d',
  escape:    '#2980b9',
  character: '#8e44ad',
};

const Ending = {
  _typewriterTimers: [],

  init() {
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'ending') this._onEnter(data);
    });
  },

  _onEnter({ endingId, ending, isFirst }) {
    const el = document.getElementById('screen-ending');
    if (!el) return;

    const gs = GameState;
    this._clearTimers();
    el.innerHTML = '';

    const cat = ending.category;
    const catColor = CATEGORY_COLORS[cat] ?? '#888';

    // Build container
    const container = document.createElement('div');
    container.className = 'ending-container';
    container.style.background = ending.gradient;
    el.appendChild(container);

    // ── Category badge ─────────────────────────────────────────
    const badge = document.createElement('div');
    badge.className = 'ending-badge';
    badge.style.borderColor = catColor;
    badge.style.color        = catColor;
    badge.textContent = CATEGORY_LABELS[cat] ?? cat;
    container.appendChild(badge);

    // ── Title ──────────────────────────────────────────────────
    const title = document.createElement('h1');
    title.className = 'ending-title';
    title.textContent = ending.title;
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'ending-subtitle';
    subtitle.textContent = ending.subtitle;
    container.appendChild(subtitle);

    // ── Stats bar ──────────────────────────────────────────────
    const stats = document.createElement('div');
    stats.className = 'ending-stats';
    stats.innerHTML = this._buildStatsHTML(gs);
    container.appendChild(stats);

    // ── Narrative ──────────────────────────────────────────────
    const narrative = document.createElement('div');
    narrative.className = 'ending-narrative';
    container.appendChild(narrative);

    // ── First-unlock badge ─────────────────────────────────────
    if (isFirst) {
      const unlock = document.createElement('div');
      unlock.className = 'ending-unlock';
      unlock.textContent = '★ 첫 달성!';
      container.appendChild(unlock);
    }

    // ── Unlock progress ────────────────────────────────────────
    const allEndings = EndingSystem.getAllWithStatus();
    const total      = allEndings.length;
    const unlocked   = EndingSystem.getUnlocked().length;
    const progress   = document.createElement('div');
    progress.className = 'ending-progress';
    progress.textContent = `엔딩 달성: ${unlocked} / ${total}`;
    container.appendChild(progress);

    // ── Action buttons ─────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'ending-actions';

    const btnRestart = document.createElement('button');
    btnRestart.className = 'ending-btn primary';
    btnRestart.textContent = '다시 시작';
    btnRestart.onclick = () => this._restart();
    actions.appendChild(btnRestart);

    const btnTitle = document.createElement('button');
    btnTitle.className = 'ending-btn';
    btnTitle.textContent = '타이틀로';
    btnTitle.onclick = () => this._goTitle();
    actions.appendChild(btnTitle);

    container.appendChild(actions);

    // ── Typewriter animation ───────────────────────────────────
    this._runTypewriter(narrative, ending.narrative ?? []);
  },

  _buildStatsHTML(gs) {
    const f  = gs.flags ?? {};
    const items = [
      { icon: '📅', label: '생존 일수',   value: `${gs.time.day}일` },
      { icon: '💀', label: '처치한 적',   value: `${f.totalKills ?? 0}명` },
      { icon: '🎒', label: '발견 아이템', value: `${f.totalItemsFound ?? 0}개` },
      { icon: '🗺', label: '방문 지역',   value: `${gs.location.districtsVisited?.length ?? 0}곳` },
      { icon: '🔨', label: '제작 횟수',   value: `${f.totalCrafted ?? 0}회` },
    ];
    return items.map(i => `
      <div class="ending-stat">
        <span class="ending-stat-icon">${i.icon}</span>
        <span class="ending-stat-label">${i.label}</span>
        <span class="ending-stat-value">${i.value}</span>
      </div>`).join('');
  },

  _runTypewriter(container, lines) {
    let lineIdx = 0;

    const showNextLine = () => {
      if (lineIdx >= lines.length) return;

      const p = document.createElement('p');
      p.className = 'ending-line';
      container.appendChild(p);

      const text    = lines[lineIdx++];
      let   charIdx = 0;

      const t = setInterval(() => {
        p.textContent += text[charIdx++];
        if (charIdx >= text.length) {
          clearInterval(t);
          const delay = setTimeout(showNextLine, 600);
          this._typewriterTimers.push(delay);
        }
      }, 35);
      this._typewriterTimers.push(t);
    };

    // Small initial delay before first line
    const init = setTimeout(showNextLine, 500);
    this._typewriterTimers.push(init);
  },

  _clearTimers() {
    this._typewriterTimers.forEach(t => clearTimeout(t) || clearInterval(t));
    this._typewriterTimers = [];
  },

  _restart() {
    this._clearTimers();
    // Delete current save slot and go to char_create
    try { SaveManager.deleteSave(GameState.ui.saveSlot ?? 0); } catch { /* ignore */ }
    GameState.ui.currentState = 'char_create';
    GameState.time.isPaused = false;
    EventBus.emit('stateTransition', { from: 'ending', to: 'char_create', data: {} });
  },

  _goTitle() {
    this._clearTimers();
    GameState.ui.currentState = 'main_menu';
    GameState.time.isPaused = false;
    EventBus.emit('stateTransition', { from: 'ending', to: 'main_menu', data: {} });
  },
};

export default Ending;
