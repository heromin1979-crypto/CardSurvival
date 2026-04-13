// === ENDING SCREEN ===
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import I18n         from '../core/I18n.js';
import SaveManager  from '../persistence/SaveManager.js';
import EndingSystem from '../systems/EndingSystem.js';
import { getEndingImage } from '../data/endingImages.js';

const CATEGORY_LABEL_KEYS = {
  death:     'ending.catDeath',
  milestone: 'ending.catMilestone',
  escape:    'ending.catEscape',
  character: 'ending.catCharacter',
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
    badge.textContent = CATEGORY_LABEL_KEYS[cat] ? I18n.t(CATEGORY_LABEL_KEYS[cat]) : cat;
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

    // ── Character ending image ─────────────────────────────────
    if (ending.category === 'character' && ending.characterId) {
      const subCode  = gs.flags?.[ending.characterId + '_ending'] ?? null;
      const imgData  = subCode ? getEndingImage(subCode) : null;
      if (imgData) {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'ending-img-wrap';

        const img = document.createElement('img');
        img.className = 'ending-img';
        img.src = imgData.src;
        img.alt = imgData.alt;
        img.loading = 'eager';
        // Graceful fallback: hide wrapper if image fails to load
        img.onerror = () => { imgWrap.style.display = 'none'; };

        imgWrap.appendChild(img);
        container.appendChild(imgWrap);
      }
    }

    // ── Narrative ──────────────────────────────────────────────
    const narrative = document.createElement('div');
    narrative.className = 'ending-narrative';
    container.appendChild(narrative);

    // ── First-unlock badge ─────────────────────────────────────
    if (isFirst) {
      const unlock = document.createElement('div');
      unlock.className = 'ending-unlock';
      unlock.textContent = I18n.t('ending.firstUnlock');
      container.appendChild(unlock);
    }

    // ── Unlock progress ────────────────────────────────────────
    const allEndings = EndingSystem.getAllWithStatus();
    const total      = allEndings.length;
    const unlocked   = EndingSystem.getUnlocked().length;
    const progress   = document.createElement('div');
    progress.className = 'ending-progress';
    progress.textContent = I18n.t('ending.progress', { done: unlocked, total });
    container.appendChild(progress);

    // ── Action buttons ─────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'ending-actions';

    const btnRestart = document.createElement('button');
    btnRestart.className = 'ending-btn primary';
    btnRestart.textContent = I18n.t('ending.restart');
    btnRestart.onclick = () => this._restart();
    actions.appendChild(btnRestart);

    const btnTitle = document.createElement('button');
    btnTitle.className = 'ending-btn';
    btnTitle.textContent = I18n.t('ending.toTitle');
    btnTitle.onclick = () => this._goTitle();
    actions.appendChild(btnTitle);

    container.appendChild(actions);

    // ── Typewriter animation ───────────────────────────────────
    this._runTypewriter(narrative, ending.narrative ?? []);
  },

  _buildStatsHTML(gs) {
    const f  = gs.flags ?? {};
    const items = [
      { icon: '📅', label: I18n.t('ending.survivalDays'),      value: `${gs.time.day}${I18n.t('ending.dayUnit')}` },
      { icon: '💀', label: I18n.t('ending.enemiesKilled'),     value: `${f.totalKills ?? 0}${I18n.t('ending.killUnit')}` },
      { icon: '🎒', label: I18n.t('ending.itemsFound'),        value: `${f.totalItemsFound ?? 0}${I18n.t('ending.itemUnit')}` },
      { icon: '🗺', label: I18n.t('ending.districtsVisited'),  value: `${gs.location.districtsVisited?.length ?? 0}${I18n.t('ending.placeUnit')}` },
      { icon: '🔨', label: I18n.t('ending.craftCount'),        value: `${f.totalCrafted ?? 0}${I18n.t('ending.craftUnit')}` },
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
