// === DRAG & DROP ===
import SlotResolver   from './SlotResolver.js';
import BoardManager   from './BoardManager.js';
import GameState      from '../core/GameState.js';
import EventBus       from '../core/EventBus.js';
import { findInteraction } from '../data/interactions.js';
import CraftDiscovery  from '../systems/CraftDiscovery.js';
import QuickCraftPrompt from '../ui/QuickCraftPrompt.js';

const DragDrop = {
  _draggingId:  null,
  _ghostEl:     null,
  _tipEl:       null,
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // document 레벨에서 위임 — board-container가 없어도 동작
    document.addEventListener('dragstart', e => this._onDragStart(e));
    document.addEventListener('dragend',   e => this._onDragEnd(e));
    document.addEventListener('dragover',  e => this._onDragOver(e));
    document.addEventListener('dragleave', e => this._onDragLeave(e));
    document.addEventListener('drop',      e => this._onDrop(e));
  },

  _onDragStart(e) {
    const card = e.target.closest('[data-instance-id]');
    if (!card) return;

    this._draggingId = card.dataset.instanceId;
    card.classList.add('dragging');

    e.dataTransfer.setData('text/plain', this._draggingId);
    e.dataTransfer.effectAllowed = 'move';

    // 커스텀 ghost
    const ghost = card.cloneNode(true);
    ghost.style.cssText = `
      position:fixed; top:-200px; left:-200px; opacity:0.85;
      width:${card.offsetWidth}px; height:${card.offsetHeight}px;
      pointer-events:none; z-index:9999;
    `;
    document.body.appendChild(ghost);
    this._ghostEl = ghost;
    e.dataTransfer.setDragImage(ghost, card.offsetWidth / 2, card.offsetHeight / 2);
  },

  _onDragEnd(e) {
    const card = document.querySelector(`[data-instance-id="${this._draggingId}"]`);
    if (card) card.classList.remove('dragging');

    if (this._ghostEl) { this._ghostEl.remove(); this._ghostEl = null; }

    this._hideInteractionTip();
    this._clearSlotHighlights();
    this._draggingId = null;
  },

  _onDragOver(e) {
    e.preventDefault();
    const slot = e.target.closest('.slot');
    if (!slot || !this._draggingId) return;

    const row     = slot.dataset.row;
    const slotIdx = parseInt(slot.dataset.slot, 10);

    // 이전 클래스 정리
    slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');

    // 슬롯에 이미 카드가 있는 경우 → 상호작용 확인 (행 무관)
    const existingId  = GameState.board[row]?.[slotIdx];

    if (existingId && existingId !== this._draggingId) {
      const srcDef = GameState.getCardDef(this._draggingId);
      const tgtDef = GameState.getCardDef(existingId);
      const rule   = findInteraction(srcDef, tgtDef);

      if (rule) {
        slot.classList.add('can-interact');
        this._showInteractionTip(slot, rule.hint);
        e.dataTransfer.dropEffect = 'move';
        return;
      }
    }

    // 스택 가능 여부 미리보기 (크래프트보다 우선)
    if (existingId && existingId !== this._draggingId) {
      const srcInst = GameState.cards[this._draggingId];
      const tgtInst = GameState.cards[existingId];
      const srcDef  = GameState.getCardDef(this._draggingId);
      if (srcInst && tgtInst && srcDef?.stackable &&
          srcInst.definitionId === tgtInst.definitionId) {
        const maxStack = srcDef.maxStack ?? 99;
        const after    = Math.min(maxStack, (tgtInst.quantity ?? 1) + (srcInst.quantity ?? 1));
        slot.classList.add('can-interact');
        this._showInteractionTip(slot, `스택 합산 → ${after}/${maxStack}`);
        e.dataTransfer.dropEffect = 'move';
        return;
      }
    }

    // 크래프트 조합 힌트 (행 무관, 상호작용·스택 아닐 때)
    if (existingId && existingId !== this._draggingId) {
      const srcDef2 = GameState.getCardDef(this._draggingId);
      const tgtDef2 = GameState.getCardDef(existingId);
      if (srcDef2 && tgtDef2) {
        const craftHint = CraftDiscovery.getQuickHint(srcDef2.id, tgtDef2.id);
        if (craftHint && craftHint.canStart) {
          slot.classList.add('can-interact');
          this._showInteractionTip(slot, craftHint.hint);
          e.dataTransfer.dropEffect = 'move';
          return;
        }
      }
    }

    this._hideInteractionTip();
    const { valid } = SlotResolver.validateDrop(this._draggingId, row, slotIdx);
    slot.classList.add(valid ? 'drag-over-valid' : 'drag-over-invalid');
    e.dataTransfer.dropEffect = valid ? 'move' : 'none';
  },

  _onDragLeave(e) {
    const slot = e.target.closest('.slot');
    if (slot) {
      slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
    }
    // 다른 슬롯으로 이동 중이면 tip 유지 (다음 dragover가 처리)
  },

  _onDrop(e) {
    e.preventDefault();
    const slot = e.target.closest('.slot');
    if (!slot || !this._draggingId) return;

    const row     = slot.dataset.row;
    const slotIdx = parseInt(slot.dataset.slot, 10);

    const existingId = GameState.board[row]?.[slotIdx];

    if (existingId && existingId !== this._draggingId) {
      // 1. 상호작용 우선 시도
      const interacted = SlotResolver.resolveInteraction(this._draggingId, existingId);
      if (!interacted) {
        // 1.5. 비밀 조합 체크
        const secreted = SlotResolver.resolveSecretCombo(this._draggingId, existingId);
        if (!secreted) {
          // 2. 같은 아이템 스택 합산 (크래프트보다 우선)
          const srcInst = GameState.cards[this._draggingId];
          const tgtInst = GameState.cards[existingId];
          const srcDef  = GameState.getCardDef(this._draggingId);
          if (srcInst && tgtInst && srcDef?.stackable &&
              srcInst.definitionId === tgtInst.definitionId) {
            SlotResolver.executeDrop(this._draggingId, row, slotIdx);
          } else {
            // 3. 크래프트 조합 체크 → 재료가 모두 있을 때만 프롬프트 표시
            const tgtDef = GameState.getCardDef(existingId);
            if (srcDef && tgtDef) {
              const recipes = CraftDiscovery.findRecipes(srcDef.id, tgtDef.id)
                .filter(r => r.canStartNow);
              if (recipes.length > 0) {
                QuickCraftPrompt.show(srcDef.id, tgtDef.id);
              } else {
                // 4. swap/move
                SlotResolver.executeDrop(this._draggingId, row, slotIdx);
              }
            } else {
              SlotResolver.executeDrop(this._draggingId, row, slotIdx);
            }
          }
        }
      }
    } else {
      // 다른 행 또는 빈 슬롯: 항상 이동/교환 허용
      SlotResolver.executeDrop(this._draggingId, row, slotIdx);
    }

    this._hideInteractionTip();
    slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
    EventBus.emit('boardChanged', {});
  },

  // ── 상호작용 미리보기 툴팁 ───────────────────────────────

  _showInteractionTip(slotEl, message) {
    this._hideInteractionTip();
    const tip = document.createElement('div');
    tip.className = 'drag-interaction-tip';
    tip.textContent = '⚡ ' + message;
    slotEl.appendChild(tip);
    this._tipEl = tip;
  },

  _hideInteractionTip() {
    this._tipEl?.remove();
    this._tipEl = null;
    // 혹시 남아 있는 여분 팁 제거
    document.querySelectorAll('.drag-interaction-tip').forEach(t => t.remove());
  },

  _clearSlotHighlights() {
    document.querySelectorAll('.slot').forEach(s => {
      s.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
    });
  },
};

export default DragDrop;
