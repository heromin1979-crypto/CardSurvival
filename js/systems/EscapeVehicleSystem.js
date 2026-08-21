// === ESCAPE VEHICLE SYSTEM ===
// 탈것·장비로 서울을 빠져나가는 엔딩의 공통 판정과 실행.
//
// 헬기(HelicopterSystem)는 연료 드럼을 인스턴스에 하나씩 누적하고 시동 열쇠를 따로 꽂는
// 고유 절차가 있어 그대로 둔다. 여기서 다루는 것은 "준비물을 보드에 모아 한 번에 떠나는"
// 나머지 경로다. 세 경로(한강 보트·경비행기·구조 신호)가 판정을 공유하므로 카드마다
// 코드를 두지 않고 데이터 스펙 하나로 처리한다.
//
// 데이터 계약 — def.escapeVehicle:
//   endingId            : 발동할 ENDINGS 키 (필수)
//   requires            : [{ definitionId, qty }] — 출발 시 보드에서 소모할 준비물
//   requiresSubLocation : 이 세부장소 안에서만 출발 가능 (선택)
//   minDay              : 이 날짜 이후에만 출발 가능 (선택)
//   labelKey            : 카드 액션 버튼 문구 키 (선택)
//   confirmKey          : 출발 직전 확인 문구 키 (선택)
//
// 엔딩은 되돌릴 수 없으므로 UI(ModalManager)가 confirmKey로 한 번 더 묻는다.
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import GameData     from '../data/GameData.js';
import I18n         from '../core/I18n.js';
import EndingSystem from './EndingSystem.js';

const EscapeVehicleSystem = {
  /** 이 카드가 탈출 수단인지 */
  getSpec(instanceId, gs = GameState) {
    return gs.getCardDef?.(instanceId)?.escapeVehicle ?? null;
  },

  /**
   * 지금 출발할 수 있는지. UI 버튼 활성 판정과 launch가 같은 함수를 본다 —
   * 헬기에서 두 판정이 갈리지 않게 한 것과 같은 이유다.
   * @returns {{ ok: boolean, reason: string, missing: Array }}
   */
  canLaunch(instanceId, gs = GameState) {
    const spec = this.getSpec(instanceId, gs);
    if (!spec?.endingId) {
      return { ok: false, reason: I18n.t('escapeVehicle.notUsable'), missing: [] };
    }

    if (spec.requiresSubLocation && gs.location?.currentSubLocation !== spec.requiresSubLocation) {
      return { ok: false, reason: I18n.t('escapeVehicle.wrongPlace'), missing: [] };
    }

    if (spec.minDay && (gs.time?.day ?? 0) < spec.minDay) {
      return {
        ok: false,
        reason: I18n.t('escapeVehicle.tooEarly', { day: spec.minDay }),
        missing: [],
      };
    }

    const missing = [];
    for (const req of spec.requires ?? []) {
      const have = gs.countOnBoard(req.definitionId);
      if (have < req.qty) {
        const def = GameData?.items?.[req.definitionId];
        missing.push({
          definitionId: req.definitionId,
          name: I18n.itemName(req.definitionId, def?.name ?? req.definitionId),
          have,
          need: req.qty,
        });
      }
    }
    if (missing.length > 0) {
      const text = missing.map(m => `${m.name} ${m.have}/${m.need}`).join(', ');
      return { ok: false, reason: I18n.t('escapeVehicle.needItems', { items: text }), missing };
    }

    return { ok: true, reason: '', missing: [] };
  },

  /**
   * 출발 실행. 준비물을 소모하고 엔딩을 발동한다.
   * 소모 전에 canLaunch로 모든 차단 조건을 검사하므로 실패 시 부작용이 없다.
   */
  launch(instanceId, gs = GameState) {
    const status = this.canLaunch(instanceId, gs);
    if (!status.ok) {
      EventBus.emit('notify', { message: status.reason, type: 'warn' });
      return { ok: false, endingId: null };
    }

    const spec = this.getSpec(instanceId, gs);
    for (const req of spec.requires ?? []) {
      this._consumeFromBoard(req.definitionId, req.qty, gs);
    }

    EndingSystem.triggerEnding(spec.endingId, gs);
    return { ok: true, endingId: spec.endingId };
  },

  /** 보드에서 정해진 수량만큼 덜어낸다. 스택은 수량을 깎고, 다 쓰면 카드를 지운다. */
  _consumeFromBoard(definitionId, qty, gs) {
    let remaining = qty;
    for (const card of gs.getBoardCards()) {
      if (remaining <= 0) break;
      if (card.definitionId !== definitionId) continue;
      const have = card.quantity ?? 1;
      if (have <= remaining) {
        remaining -= have;
        gs.removeCardInstance(card.instanceId);
      } else {
        card.quantity = have - remaining;
        remaining = 0;
      }
    }
  },
};

export default EscapeVehicleSystem;
