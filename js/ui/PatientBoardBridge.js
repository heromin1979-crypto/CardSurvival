// === PATIENT BOARD BRIDGE ===
// PatientIntakeSystem이 emit하는 라이프사이클 이벤트를 보드 상태에 반영한다.
//   - patientDied / patientLeft → 해당 NPC의 모든 보드 인스턴스 제거
//
// 완치(patientCured)는 후속 rescued NPC 전환 단계에서 별도 처리.
// 단위 테스트 격리를 위해 PatientIntakeSystem과 분리된 경량 모듈로 둔다.

import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';

const PatientBoardBridge = {
  _initialized:      false,
  _unsubscribeDied:  null,
  _unsubscribeLeft:  null,

  init() {
    this._unsubscribeAll();

    this._unsubscribeDied = EventBus.on('patientDied', ({ npcId } = {}) => {
      this._removeBoardInstances(npcId);
    });
    this._unsubscribeLeft = EventBus.on('patientLeft', ({ npcId } = {}) => {
      this._removeBoardInstances(npcId);
    });
    this._initialized = true;
  },

  _removeBoardInstances(npcId) {
    if (!npcId) return;
    const cards = GameState.cards;
    if (!cards) return;

    const targets = Object.keys(cards).filter(
      instId => cards[instId]?.definitionId === npcId
    );
    for (const instId of targets) {
      GameState.removeCardInstance?.(instId);
    }
  },

  _unsubscribeAll() {
    if (this._unsubscribeDied) { this._unsubscribeDied(); this._unsubscribeDied = null; }
    if (this._unsubscribeLeft) { this._unsubscribeLeft(); this._unsubscribeLeft = null; }
  },

  _reset() {
    this._unsubscribeAll();
    this._initialized = false;
  },
};

export default PatientBoardBridge;
