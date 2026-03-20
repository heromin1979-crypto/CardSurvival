// === NPC DIALOGUE MODAL ===
// Shows NPC dialogue, trust level, trade interface, and recruit/dismiss buttons.
// Opened via EventBus 'openNPCDialogue' event (fired by CardFactory on dblclick of NPC cards).

import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import I18n       from '../core/I18n.js';
import NPCSystem  from '../systems/NPCSystem.js';
import { NPC_ITEMS } from '../data/npcs.js';

const NPCDialogueModal = {
  _overlay: null,
  _box:     null,

  init() {
    this._overlay = document.getElementById('modal-overlay');
    this._box     = document.getElementById('modal-box');

    EventBus.on('openNPCDialogue', ({ npcId }) => this.show(npcId));
  },

  show(npcId) {
    if (!this._overlay || !this._box) return;

    const npcDef  = NPCSystem.getNPCDef(npcId);
    const npcState = NPCSystem.getNPCState(npcId);
    if (!npcDef || !npcState) return;

    const itemDef = NPC_ITEMS[npcId];
    const name    = I18n.itemName(npcId, itemDef?.name ?? npcId);
    const icon    = itemDef?.icon ?? '👤';
    const trust   = npcState.trust;

    // Talk action increases trust
    NPCSystem.talkTo(npcId);
    const greeting = NPCSystem.getDialogue(npcId, 'greet');
    const hint     = NPCSystem.getDialogue(npcId, 'hint');

    // Trust bar
    const trustDots = Array.from({ length: 5 }, (_, i) =>
      `<span class="npc-trust-dot ${i < trust ? 'filled' : ''}">${i < trust ? '★' : '☆'}</span>`
    ).join('');

    // Companion status
    const isCompanion = npcState.isCompanion;
    const canRecruit  = NPCSystem.canRecruit(npcId);
    const comp        = npcDef.companion;

    // Companion stats section
    let companionHtml = '';
    if (comp?.canRecruit) {
      const statsRows = [];
      if (comp.combatDmg > 0)           statsRows.push([I18n.t('npc.statCombat'),   `+${Math.round((comp.combatDmg - 1) * 100)}%`]);
      if (comp.healBonus > 0)            statsRows.push([I18n.t('npc.statHeal'),     `+${Math.round((comp.healBonus - 1) * 100)}%`]);
      if (comp.craftBonus > 0)           statsRows.push([I18n.t('npc.statCraft'),    `+${Math.round((comp.craftBonus - 1) * 100)}%`]);
      if (comp.carryBonus > 0)           statsRows.push([I18n.t('npc.statCarry'),    `+${comp.carryBonus}kg`]);
      if (comp.moralBonus > 0)           statsRows.push([I18n.t('npc.statMorale'),   `+${comp.moralBonus}/TP`]);
      if (comp.lonelinessReduction > 0)  statsRows.push([I18n.t('npc.statLonely'),   `-${comp.lonelinessReduction}/TP`]);
      if (comp.noiseAdd > 0)             statsRows.push([I18n.t('npc.statNoise'),    `+${comp.noiseAdd}`]);
      if (comp.foodCostPerDay > 0)       statsRows.push([I18n.t('npc.statFood'),     `${comp.foodCostPerDay}/TP`]);

      const statsHtml = statsRows.map(([k, v]) =>
        `<div class="npc-comp-stat"><span>${k}</span><span>${v}</span></div>`
      ).join('');

      const recruitTrustNeeded = comp.recruitTrust;
      const recruitLabel = isCompanion
        ? I18n.t('npc.dismiss')
        : canRecruit
          ? I18n.t('npc.recruit')
          : I18n.t('npc.trustNeeded', { trust: recruitTrustNeeded });

      companionHtml = `
        <div class="npc-companion-section">
          <div class="npc-section-title">${I18n.t('npc.companionStats')}</div>
          <div class="npc-comp-stats">${statsHtml}</div>
          <button class="npc-action-btn ${isCompanion ? 'dismiss' : canRecruit ? 'recruit' : 'disabled'}"
                  id="npc-recruit-btn" ${!isCompanion && !canRecruit ? 'disabled' : ''}>
            ${recruitLabel}
          </button>
        </div>`;
    }

    // Trade section
    let tradeHtml = '';
    const trades = NPCSystem.getAvailableTrades(npcId);
    if (trades.length > 0) {
      const tradeRows = trades.map((trade, idx) => {
        const giveDef    = window.__GAME_DATA__.items[trade.give.id];
        const receiveDef = window.__GAME_DATA__.items[trade.receive.id];
        const giveName   = I18n.itemName(trade.give.id, giveDef?.name);
        const recvName   = I18n.itemName(trade.receive.id, receiveDef?.name);
        const haveQty    = GameState.countOnBoard(trade.give.id);
        const canTrade   = haveQty >= trade.give.qty;

        return `
          <div class="npc-trade-row">
            <span class="npc-trade-give">${giveDef?.icon ?? '📦'} ${giveName} x${trade.give.qty}</span>
            <span class="npc-trade-arrow">→</span>
            <span class="npc-trade-recv">${receiveDef?.icon ?? '📦'} ${recvName} x${trade.receive.qty}</span>
            <button class="npc-trade-btn ${canTrade ? '' : 'disabled'}" data-trade-idx="${idx}"
                    ${canTrade ? '' : 'disabled'}>
              ${I18n.t('npc.trade')}
            </button>
          </div>`;
      }).join('');

      tradeHtml = `
        <div class="npc-trade-section">
          <div class="npc-section-title">${I18n.t('npc.tradeTitle')}</div>
          ${tradeRows}
        </div>`;
    }

    // Build full modal
    const html = `
      <div class="npc-dialogue">
        <div class="npc-portrait">
          <div class="npc-icon">${icon}</div>
          <div class="npc-name">${name}</div>
          <div class="npc-trust">${trustDots}</div>
          ${isCompanion ? `<div class="npc-companion-badge">${I18n.t('npc.companionBadge')}</div>` : ''}
        </div>
        <div class="npc-dialogue-body">
          <div class="npc-speech-bubble">
            <p class="npc-greeting">"${greeting}"</p>
            ${hint ? `<p class="npc-hint">${hint}</p>` : ''}
          </div>
          ${companionHtml}
          ${tradeHtml}
        </div>
      </div>
    `;

    this._box.innerHTML = `
      <div class="modal-title">${I18n.t('npc.dialogueTitle', { name })}</div>
      <div class="modal-body">${html}</div>
    `;
    this._overlay.classList.add('open');
    GameState.ui.modalOpen = true;

    // Bind events
    this._bindEvents(npcId);
  },

  _bindEvents(npcId) {
    // Recruit/Dismiss button
    const recruitBtn = document.getElementById('npc-recruit-btn');
    if (recruitBtn) {
      recruitBtn.addEventListener('click', () => {
        const state = NPCSystem.getNPCState(npcId);
        if (state?.isCompanion) {
          NPCSystem.dismiss(npcId);
        } else {
          NPCSystem.recruit(npcId);
        }
        this._close();
      });
    }

    // Trade buttons
    const tradeBtns = document.querySelectorAll('.npc-trade-btn:not(.disabled)');
    for (const btn of tradeBtns) {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.tradeIdx, 10);
        NPCSystem.executeTrade(npcId, idx);
        // Refresh modal to update trade availability
        this.show(npcId);
      });
    }

    // Close on overlay click
    const closeHandler = (e) => {
      if (e.target === this._overlay) {
        this._close();
        this._overlay.removeEventListener('click', closeHandler);
      }
    };
    this._overlay.addEventListener('click', closeHandler);
  },

  _close() {
    if (!this._overlay) return;
    this._overlay.classList.remove('open');
    GameState.ui.modalOpen = false;
  },
};

export default NPCDialogueModal;
