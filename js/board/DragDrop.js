// === DRAG & DROP ===
import SlotResolver    from './SlotResolver.js';
import BoardManager    from './BoardManager.js';
import GameState       from '../core/GameState.js';
import EventBus        from '../core/EventBus.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import { findInteraction } from '../data/interactions.js';
import CraftDiscovery  from '../systems/CraftDiscovery.js';
import CraftSystem     from '../systems/CraftSystem.js';
import HiddenElementSystem from '../systems/HiddenElementSystem.js';
import SkillSystem     from '../systems/SkillSystem.js';
import QuickCraftPrompt from '../ui/QuickCraftPrompt.js';
import BodyStatusModal  from '../ui/BodyStatusModal.js';
import BoardRenderer    from '../ui/BoardRenderer.js';

const PAGER_HOVER_MS = 400;

const DragDrop = {
  _draggingId:  null,
  _ghostEl:     null,
  _tipEl:       null,
  _initialized: false,
  _pagerHover:  null,   // { dotEl, rowKey, page, timerId }

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

  // 이슈 #3 헬퍼 — NPC 카드 여부 판별
  _isNPCCard(instanceId) {
    return GameState.getCardDef?.(instanceId)?.type === 'npc';
  },

  _onDragStart(e) {
    const card = e.target.closest('[data-instance-id]');
    if (!card) return;

    // 이슈 #3 — NPC 카드는 드래그 불가 (바닥칸 고정)
    if (this._isNPCCard(card.dataset.instanceId)) {
      e.preventDefault();
      return;
    }

    // 이동 불가 구조물(캠프파이어 등)은 드래그 불가 — 필드 바닥 고정 (분해는 클릭)
    if (GameState.getCardDef?.(card.dataset.instanceId)?.immovable) {
      e.preventDefault();
      return;
    }

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

    this._cancelPagerHover();
    this._hideInteractionTip();
    this._clearSlotHighlights();
    this._draggingId = null;
  },

  _handlePagerHover(dotEl) {
    const rowKey = dotEl.dataset.row;
    const page   = parseInt(dotEl.dataset.page, 10);
    if (!rowKey || Number.isNaN(page)) return;

    // 이미 같은 도트를 추적 중이면 유지
    if (this._pagerHover && this._pagerHover.dotEl === dotEl) return;

    this._cancelPagerHover();
    dotEl.classList.add('drag-hover-pending');
    const timerId = setTimeout(() => {
      dotEl.classList.remove('drag-hover-pending');
      BoardRenderer._switchPage(rowKey, page);
      this._pagerHover = null;
    }, PAGER_HOVER_MS);
    this._pagerHover = { dotEl, rowKey, page, timerId };
  },

  _cancelPagerHover() {
    if (!this._pagerHover) return;
    clearTimeout(this._pagerHover.timerId);
    this._pagerHover.dotEl?.classList.remove('drag-hover-pending');
    this._pagerHover = null;
  },

  _onDragOver(e) {
    e.preventDefault();

    // 페이저 도트 호버 — 400ms 정지하면 해당 페이지로 전환
    if (this._draggingId) {
      const dot = e.target.closest?.('.pager-dot');
      if (dot) {
        this._handlePagerHover(dot);
        return;
      }
      this._cancelPagerHover();
    }

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
    // 페이저 도트를 벗어나면 호버 타이머 취소
    const dot = e.target.closest?.('.pager-dot');
    if (dot && this._pagerHover?.dotEl === dot) {
      this._cancelPagerHover();
    }
    // 다른 슬롯으로 이동 중이면 tip 유지 (다음 dragover가 처리)
  },

  _onDrop(e) {
    e.preventDefault();
    this._cancelPagerHover();

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
      // 이슈 #3 — NPC 타겟이면 진단/치료 이외의 swap 모두 차단
      //   (진단/치료는 바로 아래 분기에서 처리됨)
      const tgtIsNPC = this._isNPCCard(existingId);
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
      // 이슈 #3 — NPC 타겟: 진단/치료에 해당 안 되면 swap 차단 (NPC는 이동 불가)
      if (tgtIsNPC) {
        this._hideInteractionTip();
        slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
        return;
      }
      // 진행 중 제작 카드에 다음 단계 재료 드롭 → 이어서 제작 (시간 즉시 소비)
      if (CraftSystem.tryAdvanceByDrop(this._draggingId, existingId)) {
        this._hideInteractionTip();
        slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
        EventBus.emit('boardChanged', {});
        return;
      }
      // 양동이 + 물 지역(산개울 등) → 양동이 가득 채움 (오염도 = 물의 오염도)
      if (this._tryFillBucketFromSource(this._draggingId, existingId)) {
        this._hideInteractionTip();
        slot.classList.remove('drag-over-valid', 'drag-over-invalid', 'drag-over-hover', 'can-interact');
        EventBus.emit('boardChanged', {});
        return;
      }
      // Sub-spec 2A: 카드 to 카드 drop = "시도" — hidden 레시피 잠금 해제 트리거
      // hover(getQuickHint)는 영향 없음. 실제 commit된 drop만 unlock으로 간주.
      const srcDefForUnlock = GameState.getCardDef(this._draggingId);
      const tgtDefForUnlock = GameState.getCardDef(existingId);
      if (srcDefForUnlock && tgtDefForUnlock) {
        HiddenElementSystem.unlockByAttempt(srcDefForUnlock.id, tgtDefForUnlock.id);
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

  // ── 양동이 집수 헬퍼 ───────────────────────────────────────

  // 양동이 ↔ 물 지역(water_source, dry 제외) 드래그 → 양동이를 가득 채움.
  // 물 오염도는 매개 물(인스턴스 contamination, 없으면 정의 기본값)을 따른다.
  _tryFillBucketFromSource(aId, bId) {
    const a = GameState.cards[aId], b = GameState.cards[bId];
    if (!a || !b) return false;
    const aDef = GameState.getCardDef(aId), bDef = GameState.getCardDef(bId);
    if (!aDef || !bDef) return false;
    const isBucket   = d => d.id === 'empty_bucket' || d.id === 'water_bucket';
    const isWaterSrc = d => d.subtype === 'water_source' && !(d.tags || []).includes('dry');
    let bucket, srcInst, srcDef;
    if (isBucket(aDef) && isWaterSrc(bDef))      { bucket = a; srcInst = b; srcDef = bDef; }
    else if (isWaterSrc(aDef) && isBucket(bDef)) { bucket = b; srcInst = a; srcDef = aDef; }
    else return false;

    if (bucket.definitionId === 'water_bucket' && (bucket._fillLevel ?? 1) >= 4) {
      EventBus.emit('notify', { message: '양동이가 이미 가득 찼다.', type: 'info' });
      return true;
    }
    const contam = srcInst.contamination ?? srcDef.defaultContamination ?? 0;
    bucket.definitionId  = 'water_bucket';
    bucket._fillLevel    = 4;
    bucket.contamination = contam;
    bucket._rainTick     = 0;
    EventBus.emit('notify', { message: `${srcDef.name}에서 양동이를 가득 채웠다.`, type: 'good' });
    EventBus.emit('boardChanged', {});
    return true;
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
