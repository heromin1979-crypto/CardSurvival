// === SLOT RESOLVER ===
// 드랍 유효성 검사 및 카드 상호작용 실행
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import BoardManager from './BoardManager.js';
import NoiseSystem from '../systems/NoiseSystem.js';
import { findInteraction } from '../data/interactions.js';

const SlotResolver = {

  // 드래그 중인 카드를 (row, slot)에 드랍할 수 있는지 검사
  validateDrop(instanceId, toRow, toSlot) {
    const def = GameState.getCardDef(instanceId);
    if (!def) return { valid: false, reason: '알 수 없는 카드' };

    // 장소 카드: 드래그 불가 (클릭으로만 사용)
    if (def.type === 'location') {
      return { valid: false, reason: '장소 카드는 이동할 수 없습니다.' };
    }

    // 상단(장소) 행: 일반 아이템 배치 불가
    if (toRow === 'top') {
      return { valid: false, reason: '장소 행에는 아이템을 놓을 수 없습니다.' };
    }

    // ✅ 휴대(bottom) → 바닥(middle): 허용 (아이템을 바닥에 버리기)
    // ✅ 바닥(middle) → 휴대(bottom): 허용 (아이템 줍기)
    // 장소 이동 시 바닥(middle) 아이템은 _clearFloor()에 의해 제거됨

    return { valid: true };
  },

  // 드랍 실행: 이동 또는 배치
  executeDrop(instanceId, toRow, toSlot) {
    const check = this.validateDrop(instanceId, toRow, toSlot);
    if (!check.valid) {
      EventBus.emit('notify', { message: check.reason, type: 'warn' });
      return false;
    }

    // 이동 전 definitionId 보존 (작업 중 카드가 제거될 수 있음)
    const defId = GameState.cards[instanceId]?.definitionId;

    // 스택 병합 우선 시도: 같은 정의 ID + stackable + maxStack 여유 있을 때
    const targetId = GameState.board[toRow]?.[toSlot];
    if (targetId && targetId !== instanceId) {
      if (this._tryStack(instanceId, targetId)) {
        // 같은 타입의 나머지 카드도 전부 targetId 슬롯으로 합산
        if (defId) BoardManager.consolidateSameType(defId, targetId);
        return true;
      }
    }

    const currentPos = BoardManager.findCard(instanceId);
    let success;
    if (currentPos) {
      success = BoardManager.moveCard(instanceId, toRow, toSlot);
    } else {
      success = BoardManager.addCard(instanceId, toRow, toSlot);
    }

    // 이동 성공 시 보드 전체의 같은 타입 카드를 목적지(instanceId)로 합산
    if (success && defId) {
      BoardManager.consolidateSameType(defId, instanceId);
    }

    return success;
  },

  // 스택 병합: 같은 아이템이면 수량을 합산. 소스가 0이 되면 제거.
  // 반환값: true = 스택 처리됨, false = 스택 불가 (교환으로 진행)
  _tryStack(srcId, tgtId) {
    const gs      = GameState;
    const srcInst = gs.cards[srcId];
    const tgtInst = gs.cards[tgtId];
    if (!srcInst || !tgtInst) return false;
    if (srcInst.definitionId !== tgtInst.definitionId) return false;

    const def = gs.getCardDef(srcId);
    if (!def?.stackable) return false;

    const maxStack  = def.maxStack ?? 99;
    const tgtQty    = tgtInst.quantity ?? 1;
    const available = maxStack - tgtQty;
    if (available <= 0) return false; // 대상이 이미 꽉 참

    const srcQty  = srcInst.quantity ?? 1;
    const transfer = Math.min(available, srcQty);

    tgtInst.quantity = tgtQty + transfer;
    srcInst.quantity = srcQty - transfer;

    if (srcInst.quantity <= 0) {
      BoardManager.removeCard(srcId);
      gs.removeCardInstance(srcId);
    }

    gs._updateEncumbrance();
    EventBus.emit('notify', { message: `${def.name} 스택: ${tgtInst.quantity}/${maxStack}`, type: 'info' });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // 카드-위-카드 드랍: 상호작용 규칙 테이블로 처리
  // 반환값: true = 상호작용 발생(성공/실패 무관), false = 상호작용 없음
  resolveInteraction(sourceId, targetId) {
    const gs      = GameState;
    const srcDef  = gs.getCardDef(sourceId);
    const tgtDef  = gs.getCardDef(targetId);
    if (!srcDef || !tgtDef) return false;

    const rule = findInteraction(srcDef, tgtDef);
    if (!rule) return false;

    const srcInst = gs.cards[sourceId];
    const tgtInst = gs.cards[targetId];
    if (!srcInst || !tgtInst) return false;

    // 적용 가능 여부 확인
    const check = rule.canApply(srcInst, tgtInst);
    if (!check.ok) {
      EventBus.emit('notify', { message: check.reason, type: 'warn' });
      return true; // 규칙은 매칭됐지만 조건 불충족 — 드랍 차단
    }

    // 상호작용 실행
    const result = rule.apply(srcInst, tgtInst, gs);

    // 카드 변환 처리 (소모보다 먼저 — 소모될 카드는 변환하지 않음)
    if (result.transformSrc && !result.consumeSrc) {
      const newDef = window.__GAME_DATA__?.items[result.transformSrc];
      if (newDef) {
        srcInst.definitionId = result.transformSrc;
        if (newDef.defaultContamination !== undefined) srcInst.contamination = newDef.defaultContamination;
        if (newDef.defaultDurability   !== undefined) srcInst.durability    = newDef.defaultDurability;
      }
    }
    if (result.transformTgt && !result.consumeTgt) {
      const newDef = window.__GAME_DATA__?.items[result.transformTgt];
      if (newDef) {
        tgtInst.definitionId = result.transformTgt;
        if (newDef.defaultContamination !== undefined) tgtInst.contamination = newDef.defaultContamination;
        if (newDef.defaultDurability   !== undefined) tgtInst.durability    = newDef.defaultDurability;
      }
    }

    // 소모 처리
    if (result.consumeSrc) {
      BoardManager.removeCard(sourceId);
      gs.removeCardInstance(sourceId);
    }
    if (result.consumeTgt) {
      BoardManager.removeCard(targetId);
      gs.removeCardInstance(targetId);
    }

    // 소음 추가
    if (result.noise) NoiseSystem.addNoise(result.noise);

    EventBus.emit('notify', { message: result.message, type: 'good' });
    EventBus.emit('boardChanged', {});
    return true;
  },
};

export default SlotResolver;
