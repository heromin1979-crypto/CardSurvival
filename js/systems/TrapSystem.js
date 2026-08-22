// === TRAP SYSTEM ===
// 미끼를 채워둔 trap 도구가 매 TP 진행도를 누적, trapData.tpToTrigger 도달 시
// successRate를 굴려 산 동물을 산출하고 미끼 충전을 1회 소모한다.
// 잡히든 놓치든 충전은 소모된다 (시도당 1회).
//
// 미끼는 카드 합치기로 덫 안에 들어간다(interactions.js의 bait_to_trap) — 예전처럼
// 같은 행에 늘어놓는 방식은 덫 여러 개가 미끼 한 장을 몰래 나눠 썼다.
//
// 진행도는 카드 인스턴스의 _trapProgress에 둔다 — GameState.serialize가 cards를
// 통째로 저장하므로 세이브/로드를 넘어 유지된다. 통발의 _baitCharges와 같은 패턴.
//
// CST 패턴 적응: rat_trap / pigeon_snare / alley_pit_trap.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData  from '../data/GameData.js';
import I18n      from '../core/I18n.js';
import { getBaitCapacity } from './baitable.js';

// 잡은 동물을 놓을 자리. TP와 미끼만 쓰고 산출물을 잃는 상황을 만들지 않으려고 미리 본다.
// placeCardInRow는 일반 카드를 middle → bottom 순으로 넣고, 둘 다 차면 null을 준다.
// GatherSystem._hasRoom과 같은 판정이다.
const NO_ROOM_WARN_INTERVAL_TP = 12;

function _hasRoom() {
  const gs = GameState;
  return gs.findEmptySlot('middle') >= 0 || gs.findEmptySlot('bottom') >= 0;
}

const TrapSystem = {
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
        result.push({ inst, def });
      }
    }
    return result;
  },

  _processTrap({ inst, def }) {
    const data = def.trapData;
    if ((inst._baitCharges ?? 0) <= 0) {
      // 미끼가 없으면 진행도를 그대로 두고 상태만 알린다 (UI에서 hasBait=false 표시)
      EventBus.emit('trapStateChange', {
        trapId: inst.instanceId,
        progress: inst._trapProgress ?? 0,
        tpToTrigger: data.tpToTrigger,
        hasBait: false,
      });
      return;
    }

    // 진행도 누적
    inst._trapProgress = (inst._trapProgress ?? 0) + 1;

    if (inst._trapProgress < data.tpToTrigger) {
      EventBus.emit('trapStateChange', {
        trapId: inst.instanceId,
        progress: inst._trapProgress,
        tpToTrigger: data.tpToTrigger,
        hasBait: true,
      });
      return;
    }

    // 놓을 자리가 없으면 발동을 미룬다 — 진행도와 미끼를 그대로 두고 다음 TP에 다시 본다.
    // 그냥 발동시키면 잡은 동물이 어느 행에도 못 들어가 유령 인스턴스로 남는다.
    if (!_hasRoom()) {
      // 발동선에 묶어둔다. 그냥 두면 대기하는 동안 진행도가 계속 쌓여 카드에 13/8이 뜬다.
      inst._trapProgress = data.tpToTrigger;
      this._warnNoRoom(inst, def);
      EventBus.emit('trapStateChange', {
        trapId: inst.instanceId,
        progress: inst._trapProgress,
        tpToTrigger: data.tpToTrigger,
        hasBait: true,
      });
      return;
    }

    // 발동: 미끼 충전 1회 소모, successRate 굴림
    inst._trapProgress = 0;
    inst._baitCharges = Math.max(0, (inst._baitCharges ?? 0) - 1);

    if (Math.random() < (data.successRate ?? 0.5)) {
      this._spawnTarget(data.targetCard, inst.instanceId);
    } else {
      EventBus.emit('trapMissed', { trapId: inst.instanceId, targetCard: data.targetCard });
      EventBus.emit('notify', {
        message: I18n.t('trap.missed', { name: def.name ?? '덫' }),
        type: 'info',
      });
    }

    if (inst._baitCharges <= 0) {
      EventBus.emit('notify', {
        message: I18n.t('trap.baitEmpty', { name: def.name ?? '덫' }),
        type: 'warning',
      });
    }

    EventBus.emit('trapStateChange', {
      trapId: inst.instanceId,
      progress: 0,
      tpToTrigger: data.tpToTrigger,
      hasBait: inst._baitCharges > 0,
    });
  },

  /** 자리 없음 경고 — 매 TP 반복되지 않게 간격을 둔다 */
  _warnNoRoom(inst, def) {
    const now = GameState.time?.totalTP ?? 0;
    if (now - (inst._noRoomWarnTP ?? -Infinity) < NO_ROOM_WARN_INTERVAL_TP) return;
    inst._noRoomWarnTP = now;
    EventBus.emit('notify', {
      message: I18n.t('trap.noRoom', { name: def.name ?? '덫' }),
      type: 'warning',
    });
  },

  /** 남은 미끼 충전 횟수와 상한 (UI 렌더용) */
  getBait(instanceId) {
    const inst = GameState.cards?.[instanceId];
    const def  = GameData?.items?.[inst?.definitionId];
    return { charges: inst?._baitCharges ?? 0, capacity: getBaitCapacity(def) };
  },

  /** 트랩 인스턴스의 현재 진행도 반환 (UI 렌더용) */
  getProgress(instanceId) {
    return GameState.cards?.[instanceId]?._trapProgress ?? 0;
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
