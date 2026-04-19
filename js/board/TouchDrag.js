// === TOUCH DRAG ===
// Pointer Events 기반 모바일 터치 드래그.
// HTML5 DragDrop API는 모바일에서 미지원 → PointerEvent로 구현.
// 마우스 이벤트는 제외 (HTML5 DnD가 처리).
import SlotResolver    from './SlotResolver.js';
import BoardManager    from './BoardManager.js';
import GameState       from '../core/GameState.js';
import EventBus        from '../core/EventBus.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import CraftDiscovery  from '../systems/CraftDiscovery.js';
import QuickCraftPrompt from '../ui/QuickCraftPrompt.js';

// 롱프레스 임계값 (ms) — 이 시간 이상 누르면 드래그 시작
const LONG_PRESS_MS = 180;
// 드래그로 간주할 최소 이동 픽셀
const DRAG_THRESHOLD_PX = 6;

const TouchDrag = {
  _draggingId:    null,
  _ghostEl:       null,
  _offsetX:       0,
  _offsetY:       0,
  _initialized:   false,
  _longPressTimer: null,
  _startX:        0,
  _startY:        0,
  _pendingCard:   null,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    document.addEventListener('pointerdown',   e => this._onPointerDown(e),   { passive: false });
    document.addEventListener('pointermove',   e => this._onPointerMove(e),   { passive: false });
    document.addEventListener('pointerup',     e => this._onPointerUp(e));
    document.addEventListener('pointercancel', e => this._onPointerUp(e));
  },

  _onPointerDown(e) {
    if (e.pointerType === 'mouse') return;
    const card = e.target.closest('[data-instance-id]');
    if (!card) return;

    e.preventDefault();
    this._startX      = e.clientX;
    this._startY      = e.clientY;
    this._pendingCard = card;

    // 롱프레스 후 드래그 시작
    this._longPressTimer = setTimeout(() => {
      if (this._pendingCard) this._startDrag(this._pendingCard, e);
    }, LONG_PRESS_MS);
  },

  _startDrag(card, e) {
    this._draggingId = card.dataset.instanceId;
    const rect = card.getBoundingClientRect();
    this._offsetX = e.clientX - rect.left;
    this._offsetY = e.clientY - rect.top;

    // Ghost 생성 (반투명 + 살짝 확대)
    const ghost = card.cloneNode(true);
    ghost.style.cssText = `
      position:fixed;
      top:${rect.top}px; left:${rect.left}px;
      width:${rect.width}px; height:${rect.height}px;
      opacity:0.80; pointer-events:none;
      z-index:9999; touch-action:none;
      transition:none;
      transform:scale(1.06);
      box-shadow:0 8px 24px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(ghost);
    this._ghostEl = ghost;

    card.classList.add('dragging');

    // 햅틱 피드백 (지원 시)
    try { navigator.vibrate?.(30); } catch { /* ignore */ }
  },

  _onPointerMove(e) {
    if (e.pointerType === 'mouse') return;

    // 롱프레스 대기 중: 너무 많이 움직이면 취소
    if (!this._draggingId && this._pendingCard) {
      const dx = Math.abs(e.clientX - this._startX);
      const dy = Math.abs(e.clientY - this._startY);
      if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
        clearTimeout(this._longPressTimer);
        this._pendingCard = null;
      }
      return;
    }

    if (!this._draggingId || !this._ghostEl) return;
    e.preventDefault();

    const x = e.clientX - this._offsetX;
    const y = e.clientY - this._offsetY;
    this._ghostEl.style.left = `${x}px`;
    this._ghostEl.style.top  = `${y}px`;

    // ghost를 잠깐 숨겨서 아래 요소 감지
    this._ghostEl.style.display = 'none';
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    this._ghostEl.style.display = '';

    // 슬롯 하이라이트 갱신
    document.querySelectorAll('.slot').forEach(s => {
      s.classList.remove('drag-over-valid', 'drag-over-invalid', 'can-interact');
    });

    const slot = elemBelow?.closest('.slot');
    if (!slot) return;

    const row     = slot.dataset.row;
    const slotIdx = parseInt(slot.dataset.slot, 10);
    const existingId = GameState.board[row]?.[slotIdx];

    if (existingId && existingId !== this._draggingId) {
      // 상호작용 가능 여부 체크
      const { findInteraction } = window.__interactionUtils__ ?? {};
      const srcDef = GameState.getCardDef(this._draggingId);
      const tgtDef = GameState.getCardDef(existingId);
      if (srcDef && tgtDef) {
        // 간이 체크: can-interact 클래스만 적용 (findInteraction은 DragDrop이 import)
        slot.classList.add('can-interact');
        return;
      }
    }

    const { valid } = SlotResolver.validateDrop(this._draggingId, row, slotIdx);
    slot.classList.add(valid ? 'drag-over-valid' : 'drag-over-invalid');
  },

  _onPointerUp(e) {
    clearTimeout(this._longPressTimer);
    this._pendingCard = null;
    if (e.pointerType === 'mouse' || !this._draggingId) return;

    // ghost 숨기고 아래 요소 감지
    if (this._ghostEl) this._ghostEl.style.display = 'none';
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

    // 정리
    if (this._ghostEl) { this._ghostEl.remove(); this._ghostEl = null; }
    const card = document.querySelector(`[data-instance-id="${this._draggingId}"]`);
    if (card) card.classList.remove('dragging');

    document.querySelectorAll('.slot').forEach(s => {
      s.classList.remove('drag-over-valid', 'drag-over-invalid', 'can-interact');
    });

    const slot = elemBelow?.closest('.slot');
    if (slot) {
      const row     = slot.dataset.row;
      const slotIdx = parseInt(slot.dataset.slot, 10);
      const existingId = GameState.board[row]?.[slotIdx];

      if (existingId && existingId !== this._draggingId) {
        // 부상 NPC 치료 (붕대 → 부상 NPC)
        if (this._tryWoundHeal(this._draggingId, existingId)) {
          EventBus.emit('boardChanged', {});
          this._draggingId = null;
          return;
        }
        const interacted = SlotResolver.resolveInteraction(this._draggingId, existingId);
        if (!interacted) {
          const secreted = SlotResolver.resolveSecretCombo(this._draggingId, existingId);
          if (!secreted) {
            // 스택 합산 우선 (크래프트보다 먼저)
            const srcInst = GameState.cards[this._draggingId];
            const tgtInst = GameState.cards[existingId];
            const srcDef  = GameState.getCardDef(this._draggingId);
            if (srcInst && tgtInst && srcDef?.stackable &&
                srcInst.definitionId === tgtInst.definitionId) {
              SlotResolver.executeDrop(this._draggingId, row, slotIdx);
            } else {
              // 크래프트 조합 — 재료가 모두 있을 때만
              const tgtDef = GameState.getCardDef(existingId);
              if (srcDef && tgtDef) {
                const recipes = CraftDiscovery.findRecipes(srcDef.id, tgtDef.id)
                  .filter(r => r.canStartNow);
                if (recipes.length > 0) {
                  QuickCraftPrompt.show(srcDef.id, tgtDef.id);
                } else {
                  SlotResolver.executeDrop(this._draggingId, row, slotIdx);
                }
              } else {
                SlotResolver.executeDrop(this._draggingId, row, slotIdx);
              }
            }
          }
        }
      } else {
        SlotResolver.executeDrop(this._draggingId, row, slotIdx);
      }

      EventBus.emit('boardChanged', {});
    }

    this._draggingId = null;
  },

  // ── 부상 NPC 치료 헬퍼 ─────────────────────────────────────

  _isWoundHealDrag(sourceId, targetId) {
    const srcInst = GameState.cards[sourceId];
    const tgtInst = GameState.cards[targetId];
    if (!srcInst || !tgtInst) return false;
    const tgtDef = GameState.getCardDef(targetId);
    if (tgtDef?.type !== 'npc') return false;
    const NPCSystem = SystemRegistry.get('NPCSystem');
    const npcDef = NPCSystem?.getNPCDef?.(tgtInst.definitionId);
    const npcState = NPCSystem?.getNPCState?.(tgtInst.definitionId);
    if (!npcDef?.woundHealItem || !npcState || (npcState.woundLevel ?? 0) <= 0) return false;
    return srcInst.definitionId === npcDef.woundHealItem;
  },

  _tryWoundHeal(sourceId, targetId) {
    if (!this._isWoundHealDrag(sourceId, targetId)) return false;
    const srcInst = GameState.cards[sourceId];
    const tgtInst = GameState.cards[targetId];
    const NPCSystem = SystemRegistry.get('NPCSystem');
    const npcDef = NPCSystem.getNPCDef(tgtInst.definitionId);
    const npcState = NPCSystem.getNPCState(tgtInst.definitionId);
    const healQty = npcDef.woundHealQty ?? 1;
    const srcQty = srcInst.quantity ?? 1;
    if (srcQty < healQty) {
      EventBus.emit('notify', { message: `붕대가 부족합니다 (필요: ${healQty}개)`, type: 'warn' });
      return true;
    }
    // 붕대 소모
    if (srcQty <= healQty) {
      BoardManager.removeCard(sourceId);
    } else {
      srcInst.quantity = srcQty - healQty;
    }
    // 부상 단계 감소
    const oldWound = npcState.woundLevel;
    npcState.woundLevel = Math.max(0, oldWound - 1);
    if (npcState.woundLevel <= 0) {
      npcState.healed = true;
      const prevTrust = npcState.trust ?? 0;
      npcState.trust = Math.max(prevTrust, 1);
      const comp = npcDef.companion;
      if (comp) comp.canRecruit = true;
      EventBus.emit('notify', { message: '🩹 부상이 완치되었습니다! 이제 동료로 영입할 수 있습니다.', type: 'good' });
      EventBus.emit('npcWoundHealed', { npcId: tgtInst.definitionId });
      EventBus.emit('npcHealed',      { npcId: tgtInst.definitionId });
      if (npcState.trust > prevTrust) {
        EventBus.emit('npcTrustChanged', { npcId: tgtInst.definitionId, oldTrust: prevTrust, newTrust: npcState.trust });
      }
    } else {
      EventBus.emit('notify', { message: `🩹 부상 치료 (${oldWound}단계 → ${npcState.woundLevel}단계)`, type: 'info' });
    }
    EventBus.emit('boardChanged', {});
    return true;
  },
};

export default TouchDrag;
