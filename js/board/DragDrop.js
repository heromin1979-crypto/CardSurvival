// === DRAG & DROP ===
import SlotResolver    from './SlotResolver.js';
import BoardManager    from './BoardManager.js';
import GameState       from '../core/GameState.js';
import EventBus        from '../core/EventBus.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import { findInteraction } from '../data/interactions.js';
import CraftDiscovery  from '../systems/CraftDiscovery.js';
import SkillSystem     from '../systems/SkillSystem.js';
import QuickCraftPrompt from '../ui/QuickCraftPrompt.js';
import BodyStatusModal  from '../ui/BodyStatusModal.js';

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

    // BodyStatusModal 부위 카드 드롭 타겟 하이라이트
    const partCard = e.target.closest('[data-body-part]');
    if (partCard && this._draggingId) {
      const srcDef = GameState.getCardDef(this._draggingId);
      const partKey = partCard.dataset.bodyPart;
      const ok = srcDef?.treatPart?.parts?.includes(partKey);
      partCard.classList.toggle('drop-ok', !!ok);
      partCard.classList.toggle('drop-bad', !ok);
      e.dataTransfer.dropEffect = ok ? 'move' : 'none';
      return;
    }

    const slot = e.target.closest('.slot');
    if (!slot || !this._draggingId) return;

    const row     = slot.dataset.row;
    const slotIdx = parseInt(slot.dataset.slot, 10);

    // 이전 클래스 정리
    slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');

    // 슬롯에 이미 카드가 있는 경우 → 상호작용 확인 (행 무관)
    const existingId  = GameState.board[row]?.[slotIdx];

    if (existingId && existingId !== this._draggingId) {
      // 부상 NPC 진단 힌트 (진단 도구 → 미진단 부상 NPC)
      if (this._isNPCDiagnoseDrag(this._draggingId, existingId)) {
        slot.classList.add('can-interact');
        this._showInteractionTip(slot, '🩺 부상 진단');
        e.dataTransfer.dropEffect = 'move';
        return;
      }

      // 부상 NPC 치료 힌트 (붕대 → 부상 NPC)
      if (this._isWoundHealDrag(this._draggingId, existingId)) {
        slot.classList.add('can-interact');
        this._showInteractionTip(slot, '🩹 부상 치료');
        e.dataTransfer.dropEffect = 'move';
        return;
      }

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
    const partCard = e.target.closest('[data-body-part]');
    if (partCard) {
      partCard.classList.remove('drop-ok', 'drop-bad');
    }
    // 다른 슬롯으로 이동 중이면 tip 유지 (다음 dragover가 처리)
  },

  _onDrop(e) {
    e.preventDefault();

    // BodyStatusModal 부위 카드 드롭 처리
    const partCard = e.target.closest('[data-body-part]');
    if (partCard && this._draggingId) {
      partCard.classList.remove('drop-ok', 'drop-bad');
      BodyStatusModal.tryTreatPart(partCard.dataset.bodyPart, this._draggingId);
      EventBus.emit('boardChanged', {});
      return;
    }

    const slot = e.target.closest('.slot');
    if (!slot || !this._draggingId) return;

    const row     = slot.dataset.row;
    const slotIdx = parseInt(slot.dataset.slot, 10);

    const existingId = GameState.board[row]?.[slotIdx];

    if (existingId && existingId !== this._draggingId) {
      // 0-a. 부상 NPC 진단 (진단 도구 → 미진단 부상 NPC)
      if (this._tryNPCDiagnose(this._draggingId, existingId)) {
        this._hideInteractionTip();
        slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
        EventBus.emit('boardChanged', {});
        return;
      }
      // 0. 부상 NPC 치료 (붕대 → 부상 NPC)
      if (this._tryWoundHeal(this._draggingId, existingId)) {
        this._hideInteractionTip();
        slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
        EventBus.emit('boardChanged', {});
        return;
      }
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

  // ── 부상 NPC 진단 헬퍼 ─────────────────────────────────────

  _isNPCDiagnoseDrag(sourceId, targetId) {
    const srcInst = GameState.cards[sourceId];
    const tgtInst = GameState.cards[targetId];
    if (!srcInst || !tgtInst) return false;
    const srcDef = GameState.getCardDef(sourceId);
    const tgtDef = GameState.getCardDef(targetId);
    if (tgtDef?.type !== 'npc') return false;
    if (!srcDef?.diagnose) return false;
    const NPCSystem = SystemRegistry.get('NPCSystem');
    const npcState = NPCSystem?.getNPCState?.(tgtInst.definitionId);
    if (!npcState || (npcState.woundLevel ?? 0) <= 0) return false;
    return npcState.woundDiscovered !== true;
  },

  _tryNPCDiagnose(sourceId, targetId) {
    if (!this._isNPCDiagnoseDrag(sourceId, targetId)) return false;
    const srcInst = GameState.cards[sourceId];
    const tgtInst = GameState.cards[targetId];
    const NPCSystem = SystemRegistry.get('NPCSystem');
    if (!NPCSystem) return false;

    const ok = NPCSystem.diagnoseNPC(tgtInst.definitionId);
    if (!ok) return false;

    // 진단 도구 1개 소비
    const srcQty = srcInst.quantity ?? 1;
    if (srcQty <= 1) {
      BoardManager.removeCard(sourceId);
    } else {
      srcInst.quantity = srcQty - 1;
    }
    return true;
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
    SkillSystem.gainXp('medicine', 3);
    if (npcState.woundLevel <= 0) {
      // 완치
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

export default DragDrop;
