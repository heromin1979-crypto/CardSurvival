// === SLOT RESOLVER ===
// 드랍 유효성 검사 및 카드 상호작용 실행
import EventBus                from '../core/EventBus.js';
import GameState               from '../core/GameState.js';
import I18n                    from '../core/I18n.js';
import BoardManager            from './BoardManager.js';
import NoiseSystem             from '../systems/NoiseSystem.js';
import { findInteraction }     from '../data/interactions.js';
import SecretCombinationSystem from '../systems/SecretCombinationSystem.js';
import GameData                from '../data/GameData.js';
import { isUnlitFire }         from '../systems/toolProvision.js';

// 이동 불가 판정 — 태그 'immovable' 기본 + 필드 immovable:true 하위호환 (preserved 패턴)
export function isImmovable(def) {
  return !!(def && (def.immovable === true || def.tags?.includes('immovable')));
}

// 휴대 불가 판정 — 잔해(subtype:'salvage')는 분해해서 자재를 뜯어내는 노드지 소지품이 아니다.
// 태그가 아니라 subtype으로 보는 이유는 신규 잔해가 추가돼도 규칙이 자동으로 따라붙게 하기 위함.
// 바닥(middle) 안에서의 이동은 막지 않는다 — 배낭(bottom) 진입만 차단한다.
export function isUncarriable(def) {
  return def?.type === 'structure' && def.subtype === 'salvage';
}

// 꺼진 화기는 열을 쓰는 상호작용(조리·가열·건조)에 참여할 수 없다.
// 재점화·연료 보충·수리는 꺼진 불이 바로 그 대상이므로 규칙 쪽에서 allowUnlit로 면제한다.
function blocksOnUnlitFire(srcInst, tgtInst) {
  return isUnlitFire(srcInst.definitionId, srcInst.durability)
      || isUnlitFire(tgtInst.definitionId, tgtInst.durability);
}

const SlotResolver = {

  // 드래그 중인 카드를 (row, slot)에 드랍할 수 있는지 검사
  validateDrop(instanceId, toRow, toSlot) {
    const def = GameState.getCardDef(instanceId);
    if (!def) return { valid: false, reason: I18n.t('slot.unknownCard') };

    // 장소 카드: 드래그 불가 (클릭으로만 사용)
    if (def.type === 'location') {
      return { valid: false, reason: I18n.t('slot.cantMoveLocation') };
    }

    // 환경물(개울 등): 그 자리에 존재하는 자연 노드지 소지품이 아니다.
    // 급수·집수 상호작용은 resolveInteraction/_tryFillBucketFromSource가 executeDrop보다
    // 먼저 처리하고 return하므로, 여기서 막아도 물 뜨기는 그대로 동작한다.
    if (def.type === 'environment') {
      return { valid: false, reason: I18n.t('slot.cantMoveEnvironment') };
    }

    // 이동 불가 구조물(캠프파이어 등): 바닥 고정 — 드래그 이동/배낭 수납 불가 (분해는 클릭)
    if (isImmovable(def)) {
      return { valid: false, reason: I18n.t('slot.cantMoveImmovable') };
    }

    // 상단(장소) 행: 일반 아이템 배치 불가
    if (toRow === 'top') {
      return { valid: false, reason: I18n.t('slot.cantPlaceOnLocation') };
    }

    // 환경 행: 일반 아이템 배치 불가
    if (toRow === 'environment') {
      return { valid: false, reason: I18n.t('slot.cantPlaceOnEnvironment') };
    }

    // 잔해: 배낭 수납 불가 (바닥에 둔 채 분해해야 한다)
    if (toRow === 'bottom' && isUncarriable(def)) {
      return { valid: false, reason: I18n.t('slot.cantCarrySalvage') };
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
      // 이동 불가 카드가 목적지에 있으면 swap 차단 (캠프파이어를 배낭/다른 칸으로 밀어내기 방지)
      // 상호작용·크래프트·스택은 이 시점 이전(DragDrop/TouchDrag)에서 처리되므로 여기 도달 = 순수 swap 시도
      const tgtDef = GameState.getCardDef(targetId);
      if (isImmovable(tgtDef)) {
        EventBus.emit('notify', { message: I18n.t('slot.cantDisplaceImmovable'), type: 'warn' });
        return false;
      }
      // 스왑은 목적지 카드를 드래그 원본 자리로 보낸다. 휴대 칸에서 끌어온 카드를
      // 잔해 위에 떨어뜨리면 잔해가 배낭으로 밀려 들어가므로 그 경로도 막는다.
      if (isUncarriable(tgtDef) && BoardManager.findCard(instanceId)?.row === 'bottom') {
        EventBus.emit('notify', { message: I18n.t('slot.cantCarrySalvage'), type: 'warn' });
        return false;
      }
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
    EventBus.emit('notify', { message: I18n.t('slot.stackMerge', { name: I18n.itemName(def.id, def.name), qty: tgtInst.quantity, max: maxStack }), type: 'info' });
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

    if (!rule.allowUnlit && blocksOnUnlitFire(srcInst, tgtInst)) {
      EventBus.emit('notify', { message: I18n.t('slot.fireUnlit'), type: 'warn' });
      return true;
    }

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
      const newDef = GameData?.items[result.transformSrc];
      if (newDef) {
        srcInst.definitionId = result.transformSrc;
        if (newDef.defaultContamination !== undefined) srcInst.contamination = newDef.defaultContamination;
        if (newDef.defaultDurability   !== undefined) srcInst.durability    = newDef.defaultDurability;
      }
    }
    if (result.transformTgt && !result.consumeTgt) {
      const newDef = GameData?.items[result.transformTgt];
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

    // 아이템 생성 (양동이 물 끓이기·정수 등 — 용기는 유지하고 결과물만 생성)
    if (result.spawnItem) {
      const qty = result.spawnQty ?? 1;
      for (let i = 0; i < qty; i++) {
        const inst = gs.createCardInstance(result.spawnItem,
          result.spawnContamination != null ? { contamination: result.spawnContamination } : {});
        if (inst) gs.placeCardInRow(inst.instanceId);
      }
    }

    // 소음 추가
    if (result.noise) NoiseSystem.addNoise(result.noise);

    EventBus.emit('notify', { message: result.message, type: 'good' });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // 비밀 조합 체크 및 실행
  // 반환값: true = 비밀 조합 발동, false = 없음
  resolveSecretCombo(sourceId, targetId) {
    const gs      = GameState;
    const srcDef  = gs.getCardDef(sourceId);
    const tgtDef  = gs.getCardDef(targetId);
    if (!srcDef || !tgtDef) return false;

    const check = SecretCombinationSystem.checkCombination(srcDef, tgtDef);
    if (!check.found) return false;

    if (check.reason) {
      EventBus.emit('notify', { message: check.reason, type: 'warn' });
      return true;  // 매칭됐지만 조건 불충족
    }

    const srcInst = gs.cards[sourceId];
    const tgtInst = gs.cards[targetId];
    if (!srcInst || !tgtInst) return false;

    if (blocksOnUnlitFire(srcInst, tgtInst)) {
      EventBus.emit('notify', { message: I18n.t('slot.fireUnlit'), type: 'warn' });
      return true;
    }

    const result = SecretCombinationSystem.applyCombination(check.combo, srcInst, tgtInst, check.reversed);

    if (result.consumeSrc) {
      BoardManager.removeCard(sourceId);
      gs.removeCardInstance(sourceId);
    }
    if (result.consumeTgt) {
      BoardManager.removeCard(targetId);
      gs.removeCardInstance(targetId);
    }

    EventBus.emit('boardChanged', {});
    return true;
  },
};

export default SlotResolver;
