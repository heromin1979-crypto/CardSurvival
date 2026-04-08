// === NPC PANEL ===
// Side panel showing companions (permanent) and location NPCs (transient).
// NPCs no longer occupy board.middle slots — they live exclusively here.

import EventBus  from '../core/EventBus.js';
import NPCSystem from '../systems/NPCSystem.js';
import { NPC_ITEMS } from '../data/npcs.js';
import I18n      from '../core/I18n.js';

const EMOTION_ICONS = {
  calm:    { icon: '😌', label: '안정' },
  hopeful: { icon: '🌟', label: '희망' },
  anxious: { icon: '😰', label: '불안' },
  trauma:  { icon: '💔', label: '외상' },
};

const NPCPanel = {
  _panel:            null,
  _toggle:           null,
  _companionList:    null,
  _locationList:     null,

  init() {
    this._panel         = document.getElementById('npc-panel');
    this._toggle        = document.getElementById('npc-panel-toggle');
    this._companionList = document.getElementById('npc-panel-companions-list');
    this._locationList  = document.getElementById('npc-panel-location-list');

    if (!this._panel) return;

    // Toggle collapse
    this._toggle?.addEventListener('click', () => {
      this._panel.classList.toggle('collapsed');
    });

    // NPCSystem events
    EventBus.on('npcPanelAdd',    ({ npcId, section })  => this._addCard(npcId, section));
    EventBus.on('npcPanelRemove', ({ npcId })            => this._removeCard(npcId));
    EventBus.on('npcPanelUpdate', ({ npcId })            => this._updateCard(npcId));
    EventBus.on('npcRecruited',   ({ npcId })            => this._onRecruited(npcId));
    EventBus.on('npcDismissed',   ({ npcId })            => this._removeCard(npcId));
    EventBus.on('npcTrustChanged',({ npcId })            => this._updateCard(npcId));
    EventBus.on('npcSpawned',     ()                     => this._refresh());
    EventBus.on('npcEmotionSet',   ({ npcId })   => this._updateCard(npcId));
    EventBus.on('npcDispatched',   ({ npcId })   => this._updateCard(npcId));
    EventBus.on('npcForageReturn', ({ npcId })   => this._updateCard(npcId));
    EventBus.on('groupStatsUpdated', ({ stats }) => this._updateGroupStats(stats));

    // Show panel when first NPC appears
    EventBus.on('npcPanelAdd', () => this._panel.classList.remove('hidden'));
  },

  // ── Full refresh (on game load / district change) ───────────────

  _refresh() {
    if (!this._companionList || !this._locationList) return;
    this._companionList.innerHTML = '';
    this._locationList.innerHTML  = '';

    const visibles = NPCSystem.getVisibleNPCs();
    for (const { npcId, state } of visibles) {
      const section = state.isCompanion ? 'companion' : 'location';
      this._renderCard(npcId, section);
    }
    this._updateEmptyStates();
  },

  // ── Add / Remove / Update ───────────────────────────────────────

  _addCard(npcId, section) {
    if (document.getElementById(`npc-mini-${npcId}`)) {
      this._updateCard(npcId);
      return;
    }
    const container = section === 'companion' ? this._companionList : this._locationList;
    if (!container) return;
    this._renderCard(npcId, section, container);
    this._updateEmptyStates();
  },

  _removeCard(npcId) {
    document.getElementById(`npc-mini-${npcId}`)?.remove();
    this._updateEmptyStates();
  },

  _updateCard(npcId) {
    const existing = document.getElementById(`npc-mini-${npcId}`);
    if (!existing) return;
    const state = NPCSystem.getNPCState(npcId);
    const section = state?.isCompanion ? 'companion' : 'location';
    const newEl = this._buildMiniCard(npcId, section);
    existing.replaceWith(newEl);
  },

  _onRecruited(npcId) {
    // Move from location section → companion section
    this._removeCard(npcId);
    this._addCard(npcId, 'companion');
    this._panel.classList.remove('collapsed');
  },

  // ── Build card elements ─────────────────────────────────────────

  _renderCard(npcId, section, container = null) {
    const target = container
      ?? (section === 'companion' ? this._companionList : this._locationList);
    if (!target) return;
    const el = this._buildMiniCard(npcId, section);
    target.appendChild(el);
  },

  _buildMiniCard(npcId, section) {
    const def   = NPC_ITEMS[npcId];
    const state = NPCSystem.getNPCState(npcId);

    const el = document.createElement('div');
    el.id        = `npc-mini-${npcId}`;
    el.className = `npc-mini-card ${section}`;

    if (!def || !state) return el;

    const name  = I18n.itemName(npcId, def.name);
    const icon  = def.icon ?? '👤';
    const trust = state.trust ?? 0;
    const stars = '★'.repeat(trust) + '☆'.repeat(5 - trust);

    // HP bar (companions only)
    const npcDef = NPCSystem.getNPCDef(npcId);
    const maxHp  = npcDef?.maxHp ?? 50;
    const curHp  = state.hp ?? maxHp;
    const hpPct  = Math.round((curHp / maxHp) * 100);
    const hpCls  = hpPct > 60 ? 'good' : hpPct > 30 ? 'warn' : 'crit';
    const hpBar  = state.isCompanion
      ? `<div class="npc-mini-hp">
           <div class="npc-mini-hp-fill ${hpCls}" style="width:${hpPct}%"></div>
         </div>`
      : '';

    // Neglect warning badge
    const neglect = state.neglectDays ?? 0;
    if (neglect >= 3) el.classList.add('neglect-warn');
    if (neglect >= 5) el.classList.add('neglect-crit');

    // Dispatched state
    const dispatched = state.dispatched ?? false;
    if (dispatched) el.classList.add('dispatched');

    // Quest indicator
    const hasQuest   = (state.activeQuest != null);
    const questBadge = hasQuest ? `<div class="npc-mini-quest-badge">❗</div>` : '';

    // Emotion badge
    const emotion     = state.emotion ?? 'calm';
    const emoData     = EMOTION_ICONS[emotion] ?? EMOTION_ICONS.calm;
    const emotionBadge = `<div class="npc-emotion-badge emotion-${emotion}">${emoData.icon} ${emoData.label}</div>`;

    el.innerHTML = `
      ${questBadge}
      <div class="npc-mini-icon">${icon}</div>
      <div class="npc-mini-name">${name}</div>
      <div class="npc-mini-trust">${stars}</div>
      ${emotionBadge}
      ${hpBar}
    `;
    el.addEventListener('click', () => {
      if (!dispatched) EventBus.emit('openNPCDialogue', { npcId });
    });
    return el;
  },

  // ── W-9: Group Stats update ─────────────────────────────────────

  _updateGroupStats(stats) {
    const panel = document.getElementById('npc-panel-group-stats');
    if (!panel) return;

    const companions = window.__GAME_DATA__ ? (window.GameState?.companions ?? []) : [];
    panel.style.display = companions.length > 0 ? 'block' : 'none';

    const set = (id, valId, val) => {
      const fill = document.getElementById(id);
      const span = document.getElementById(valId);
      if (fill) fill.style.width = `${val}%`;
      if (span) span.textContent = val;
    };

    set('gs-morale',   'gs-morale-val',   stats.morale   ?? 50);
    set('gs-cohesion', 'gs-cohesion-val', stats.cohesion ?? 50);
    set('gs-food',     'gs-food-val',     stats.food     ?? 50);
    set('gs-safety',   'gs-safety-val',   stats.safety   ?? 50);
  },

  // ── Empty states ────────────────────────────────────────────────

  _updateEmptyStates() {
    if (this._companionList) {
      const empty = this._companionList.children.length === 0;
      this._companionList.classList.toggle('is-empty', empty);
    }
    if (this._locationList) {
      const empty = this._locationList.children.length === 0;
      this._locationList.classList.toggle('is-empty', empty);
    }
  },
};

export default NPCPanel;
