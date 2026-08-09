// === HELICOPTER SYSTEM ===
// 헬기 이륙 판정과 실행. 기체는 제작(엔지니어 B3)과 발견(63빌딩) 두 경로가
// 같은 helicopter 카드를 공유하고, 가동 상태는 인스턴스 플래그로 들고 있다.
//   _fuelDrums : 주입된 항공 가솔린 드럼 수 (avgas_to_helicopter 상호작용)
//   _keyed     : 시동 열쇠 장착 여부       (key_to_helicopter 상호작용)
// 필요 수치는 def.flight { fuelDrums, needsKey }에 선언한다.
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import I18n         from '../core/I18n.js';
import EndingSystem from './EndingSystem.js';
import ENDINGS      from '../data/endings.js';

// 자력 조종 탈출은 엔지니어 전용 서사다. 군인은 기체를 만들지도 몰지도 않고
// 방송으로 구조기를 불러들인다(escape_helicopter). 조건을 통과하는 전용 엔딩이
// 있으면 그쪽을 쓰고, 없으면 범용 자력 탈출로 떨어진다. 조건 검사를 재사용하므로
// 퀘스트 미완료 상태에서 전용 엔딩을 가로채는 일이 없다.
const CHARACTER_HELI_ENDINGS = ['mq_engineer_heli'];
const FALLBACK_ENDING = 'escape_helicopter_pilot';

const HelicopterSystem = {

  /**
   * 지금 이륙할 수 있는지. 버튼 활성 판정과 실행 판정이 갈리지 않도록
   * UI와 takeOff가 같은 함수를 본다.
   * @returns {{ ok: boolean, reason: string, fuel: number, need: number, keyed: boolean }}
   */
  canTakeOff(instanceId) {
    const gs   = GameState;
    const inst = gs.cards?.[instanceId];
    const def  = gs.getCardDef?.(instanceId);
    const spec = def?.flight;
    const base = { fuel: 0, need: 0, keyed: false };

    if (!inst || !spec) {
      return { ok: false, reason: I18n.t('heli.notFlyable'), ...base };
    }

    const need  = spec.fuelDrums ?? 0;
    const fuel  = inst._fuelDrums ?? 0;
    const keyed = inst._keyed === true;
    const state = { fuel, need, keyed };

    if (fuel < need) {
      return { ok: false, reason: I18n.t('heli.needFuel', { have: fuel, need }), ...state };
    }
    if (spec.needsKey && !keyed) {
      return { ok: false, reason: I18n.t('heli.needKey'), ...state };
    }
    return { ok: true, reason: '', ...state };
  },

  /** 이 상황에서 발동할 엔딩 id */
  resolveEndingId(gs = GameState) {
    for (const id of CHARACTER_HELI_ENDINGS) {
      const cond = ENDINGS[id]?.condition;
      if (typeof cond === 'function') {
        try {
          if (cond(gs)) return id;
        } catch { /* 조건 평가 실패는 폴백으로 넘긴다 */ }
      }
    }
    return FALLBACK_ENDING;
  },

  /** 이륙 실행 — 조건을 만족하면 해당 엔딩으로 게임을 마친다 */
  takeOff(instanceId) {
    const status = this.canTakeOff(instanceId);
    if (!status.ok) {
      EventBus.emit('notify', { message: status.reason, type: 'warn' });
      return { ok: false, endingId: null };
    }

    const gs = GameState;
    const endingId = this.resolveEndingId(gs);
    EventBus.emit('notify', { message: I18n.t('heli.takeOff'), type: 'good' });
    EndingSystem.triggerEnding(endingId, gs);
    return { ok: true, endingId };
  },
};

export default HelicopterSystem;
