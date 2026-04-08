// === NPC DIALOGUE MODAL ===
// Shows NPC dialogue, trust level, trade interface, and recruit/dismiss buttons.
// Opened via EventBus 'openNPCDialogue' event (fired by CardFactory on dblclick of NPC cards).

import EventBus        from '../core/EventBus.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import NPCSystem       from '../systems/NPCSystem.js';
import NPCQuestSystem  from '../systems/NPCQuestSystem.js';
import { NPC_ITEMS }   from '../data/npcs.js';
import GameData        from '../data/GameData.js';

const EMOTION_LABELS = {
  calm:    '😌 안정',
  hopeful: '🌟 희망',
  anxious: '😰 불안',
  trauma:  '💔 외상',
};

const NPCDialogueModal = {
  _overlay: null,
  _box:     null,

  init() {
    this._overlay = document.getElementById('modal-overlay');
    this._box     = document.getElementById('modal-box');

    EventBus.on('openNPCDialogue', ({ npcId }) => this.show(npcId));

    // W-3: Dilemma modal
    EventBus.on('showDilemma', (opts) => this._showDilemma(opts));
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
        const giveDef    = GameData.items[trade.give.id];
        const receiveDef = GameData.items[trade.receive.id];
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

    // Active quest section
    const activeQuest = NPCQuestSystem.getActiveQuest(npcId);
    let questHtml = '';
    if (activeQuest) {
      const stepDescs = activeQuest.steps.map(s => {
        if (s.type === 'collect') {
          const have = GameState.countOnBoard?.(s.itemId) ?? 0;
          const itemDef = GameData?.items[s.itemId];
          const iname   = I18n.itemName(s.itemId, itemDef?.name);
          return `<div class="npc-quest-step ${have >= s.qty ? 'done' : ''}">${have >= s.qty ? '✅' : '⬜'} ${iname} ${have}/${s.qty} — <em>${s.hint}</em></div>`;
        }
        if (s.type === 'visit') {
          const visited = GameState.flags?.[`visited_${s.locationId}`] ?? false;
          return `<div class="npc-quest-step ${visited ? 'done' : ''}">${visited ? '✅' : '⬜'} ${s.locationId} 방문 — <em>${s.hint}</em></div>`;
        }
        return '';
      }).join('');
      questHtml = `
        <div class="npc-quest-section">
          <div class="npc-section-title">❗ 진행 중 의뢰: ${activeQuest.title}</div>
          <div class="npc-quest-steps">${stepDescs}</div>
        </div>`;
    }

    // W-2: Emotion state display
    const emotion = npcState.emotion ?? 'calm';
    const emotionLabel = EMOTION_LABELS[emotion] ?? EMOTION_LABELS.calm;
    const emotionHtml = isCompanion
      ? `<div class="npc-emotion-badge emotion-${emotion}">${emotionLabel}</div>`
      : '';

    // W-7: Personal story arc progress
    const storySystem = SystemRegistry.get('NPCStorySystem');
    const arcProgress = storySystem?.getArcProgress(npcId);
    let arcHtml = '';
    if (arcProgress && isCompanion) {
      arcHtml = `
        <div class="npc-arc-section">
          <div class="npc-arc-title">📖 개인 서사</div>
          ${arcProgress.completed
            ? `<div class="npc-arc-complete">✨ ${arcProgress.arc.completionLine}</div>`
            : `<div class="npc-arc-hint">${arcProgress.hint}</div>`
          }
        </div>`;
    }

    // W-6: Dispatch button (companions only)
    let dispatchHtml = '';
    if (isCompanion) {
      const dispatched = npcState.dispatched ?? false;
      const groupSys = SystemRegistry.get('NPCGroupSystem');
      dispatchHtml = `
        <div class="npc-heal-section" style="margin-top:8px">
          <button class="npc-action-btn dispatch ${dispatched ? 'active disabled' : ''}"
                  id="npc-dispatch-btn" ${dispatched ? 'disabled' : ''}>
            ${dispatched ? '🎒 파견 중...' : '🎒 자원 수집 파견'}
          </button>
        </div>`;
    }

    // Companion heal section (V-5)
    let healHtml = '';
    if (isCompanion) {
      const npcDef = NPCSystem.getNPCDef(npcId);
      const maxHp  = npcDef?.maxHp ?? 50;
      const curHp  = npcState.hp ?? maxHp;
      const hpPct  = Math.round((curHp / maxHp) * 100);
      const hpCls  = hpPct > 60 ? 'good' : hpPct > 30 ? 'warn' : 'crit';
      const canHeal = GameState.countOnBoard?.('bandage') > 0 || GameState.countOnBoard?.('first_aid_kit') > 0;
      if (curHp < maxHp) {
        healHtml = `
          <div class="npc-heal-section">
            <div class="npc-section-title">❤️ HP 상태: ${curHp}/${maxHp}</div>
            <div class="npc-hp-bar-wide"><div class="npc-hp-bar ${hpCls}" style="width:${hpPct}%"></div></div>
            <button class="npc-action-btn heal ${canHeal ? '' : 'disabled'}" id="npc-heal-btn" ${canHeal ? '' : 'disabled'}>
              ${canHeal ? '붕대로 치료하기 (붕대/응급키트 소모)' : '치료 아이템 없음'}
            </button>
          </div>`;
      }
    }

    // Build full modal
    const html = `
      <div class="npc-dialogue">
        <div class="npc-portrait">
          <div class="npc-icon">${icon}</div>
          <div class="npc-name">${name}</div>
          <div class="npc-trust">${trustDots}</div>
          ${isCompanion ? `<div class="npc-companion-badge">${I18n.t('npc.companionBadge')}</div>` : ''}
          ${emotionHtml}
        </div>
        <div class="npc-dialogue-body">
          <div class="npc-speech-bubble">
            <p class="npc-greeting">"${greeting}"</p>
            ${hint ? `<p class="npc-hint">${hint}</p>` : ''}
          </div>
          ${questHtml}
          ${arcHtml}
          ${healHtml}
          ${dispatchHtml}
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

    // W-6: Dispatch button
    const dispatchBtn = document.getElementById('npc-dispatch-btn');
    if (dispatchBtn) {
      dispatchBtn.addEventListener('click', () => {
        EventBus.emit('npcDispatchForage', { npcId });
        this._close();
      });
    }

    // Heal companion button (V-5)
    const healBtn = document.getElementById('npc-heal-btn');
    if (healBtn) {
      healBtn.addEventListener('click', () => {
        // Prefer first_aid_kit (30hp), then bandage (15hp)
        const hasFAK    = (GameState.countOnBoard?.('first_aid_kit') ?? 0) > 0;
        const itemId    = hasFAK ? 'first_aid_kit' : 'bandage';
        const healAmt   = hasFAK ? 30 : 15;
        // Consume one unit
        const cards = GameState.getBoardCards?.() ?? [];
        for (const card of cards) {
          if (card.definitionId !== itemId) continue;
          if ((card.quantity ?? 1) <= 1) {
            GameState.removeCardInstance(card.instanceId);
          } else {
            card.quantity -= 1;
          }
          break;
        }
        NPCSystem.healCompanion(npcId, healAmt);
        EventBus.emit('boardChanged', {});
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

  // ── W-3: Dilemma Modal ─────────────────────────────────────────

  _showDilemma({ dilemmaId, title, body, choices, onChoice }) {
    // Create overlay
    const existing = document.getElementById('dilemma-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id        = 'dilemma-overlay';
    overlay.className = 'dilemma-overlay';

    const choicesHtml = choices.map(c => `
      <button class="dilemma-choice-btn" data-choice="${c.id}">
        ${c.label}
        ${c.effect?.memo ? `<div class="dilemma-choice-memo">${c.effect.memo}</div>` : ''}
      </button>
    `).join('');

    overlay.innerHTML = `
      <div class="dilemma-modal">
        <div class="dilemma-title">⚠️ ${title}</div>
        <div class="dilemma-body">${body}</div>
        <div class="dilemma-choices">${choicesHtml}</div>
      </div>
    `;

    document.getElementById('app')?.appendChild(overlay);

    // Bind choice buttons (no close-on-bg-click — must choose)
    overlay.querySelectorAll('.dilemma-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choiceId = btn.dataset.choice;
        overlay.remove();
        onChoice?.(choiceId);
      });
    });
  },
};

export default NPCDialogueModal;
