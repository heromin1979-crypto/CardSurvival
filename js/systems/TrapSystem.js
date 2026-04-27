// === TRAP SYSTEM ===
// 보드에 설치된 trap 도구가 같은 행에 bait가 있으면 매 TP 진행도를 누적,
// trapData.tpToTrigger 도달 시 successRate 굴려 산 동물 산출 + bait 1개 소모.
// trap이 풀리든 실패하든 bait는 소모됨 (시도당 1개).
//
// CST 패턴 적응: rat_trap / pigeon_snare / alley_pit_trap.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData  from '../data/GameData.js';
import I18n      from '../core/I18n.js';

const TrapSystem = {
  // instanceId → 누적 TP (메모리만 보관, 세이브 안 됨)
  _progress: {},

  init() {
    EventBus.on('tpAdvance', () => this._onTP());
  },

  _onTP() {
    const traps = this._findTraps();
    for (const trap of traps) {
      this._processTrap(trap);
    }
  },

  /** 보드 위 모든 trap 카드 인스턴스 수집 */
  _findTraps() {
    const result = [];
    for (const inst of GameState.getBoardCards()) {
      const def = GameData?.items?.[inst.definitionId];
      if (def?.subtype === 'trap' && def?.trapData) {
        const row = this._findRow(inst.instanceId);
        if (row) result.push({ inst, def, row });
      }
    }
    return result;
  },

  /** instance가 어느 행에 있는지 검색 */
  _findRow(instanceId) {
    const board = GameState.board;
    for (const row of ['top', 'environment', 'middle', 'bottom']) {
      if (board[row]?.includes(instanceId)) return row;
    }
    return null;
  },

  /** 같은 행에서 baitTags 중 하나라도 일치하는 카드 검색 */
  _findBait(row, baitTags) {
    const board = GameState.board[row] ?? [];
    for (const id of board) {
      if (!id) continue;
      const inst = GameState.cards[id];
      if (!inst) continue;
      const def = GameData?.items?.[inst.definitionId];
      const tags = def?.tags ?? [];
      if (baitTags.some(t => tags.includes(t))) {
        return inst;
      }
    }
    return null;
  },

  _processTrap({ inst, def, row }) {
    const data = def.trapData;
    const bait = this._findBait(row, data.baitTags ?? []);
    if (!bait) {
      // bait 없으면 진행도 유지 (감소 없음 — 다음 TP에 다시 시도)
      return;
    }

    // 진행도 누적
    this._progress[inst.instanceId] = (this._progress[inst.instanceId] ?? 0) + 1;
    if (this._progress[inst.instanceId] < data.tpToTrigger) return;

    // 발동: bait 1개 소모, successRate 굴림
    this._progress[inst.instanceId] = 0;
    this._consumeBait(bait);

    if (Math.random() < (data.successRate ?? 0.5)) {
      this._spawnTarget(data.targetCard, inst.instanceId);
    } else {
      EventBus.emit('trapMissed', { trapId: inst.instanceId, targetCard: data.targetCard });
      EventBus.emit('notify', {
        message: I18n.t('trap.missed', { name: def.name ?? '덫' }),
        type: 'info',
      });
    }
  },

  /** bait 1개 소모: 수량 감소 또는 카드 제거 */
  _consumeBait(baitInst) {
    const qty = baitInst.quantity ?? 1;
    if (qty > 1) {
      baitInst.quantity = qty - 1;
    } else {
      GameState.removeCardInstance(baitInst.instanceId);
    }
  },

  /** 산 동물 카드 생성 후 보드에 배치 */
  _spawnTarget(targetCardId, trapInstanceId) {
    const inst = GameState.createCardInstance(targetCardId, { quantity: 1 });
    if (!inst) return;
    const placed = GameState.placeCardInRow(inst.instanceId, 'middle');
    const finalId = placed?.instanceId ?? inst.instanceId;

    const def = GameData?.items?.[targetCardId];
    EventBus.emit('trapTriggered', { trapId: trapInstanceId, targetCard: targetCardId, instanceId: finalId });
    EventBus.emit('notify', {
      message: I18n.t('trap.triggered', { name: def?.name ?? targetCardId }),
      type: 'good',
    });
    EventBus.emit('boardChanged', {});
  },
};

export default TrapSystem;
