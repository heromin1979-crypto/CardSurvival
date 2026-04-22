// === PatientBoardBridge — 증분 6 ===
// 검증:
//  - patientDied/patientLeft 이벤트 → 해당 NPC의 보드 카드가 제거된다
//  - 해당 NPC 인스턴스가 없으면 no-op (크래시 없음)
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import NPCSystem           from '../../js/systems/NPCSystem.js';
import PatientBoardBridge  from '../../js/ui/PatientBoardBridge.js';

function resetWorld() {
  EventBus._listeners = {};
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: [null, null], bottom: [null, null] };
  GameState.player = { ...(GameState.player ?? {}), equipped: {} };
  GameState.pendingLoot = [];
  // NPC/환자 item def를 GameData.items에 등록 (createCardInstance가 작동하도록)
  NPCSystem._registerNPCItems();
  PatientBoardBridge._reset?.();
}

function placePatientCard(npcId, row = 'middle', slot = 0) {
  const inst = GameState.createCardInstance(npcId);
  if (!inst) throw new Error(`createCardInstance failed for ${npcId}`);
  GameState.board[row][slot] = inst.instanceId;
  return inst.instanceId;
}

beforeEach(resetWorld);

describe('PatientBoardBridge — 보드 카드 cleanup', () => {
  it('patientDied 발행 시 해당 NPC의 보드 인스턴스가 제거된다', () => {
    PatientBoardBridge.init();
    const npcId    = 'patient_park_jiyoung_42';
    const instId   = placePatientCard(npcId);

    expect(GameState.cards[instId]).toBeDefined();

    EventBus.emit('patientDied', { npcId });

    expect(GameState.cards[instId]).toBeUndefined();
  });

  it('patientLeft 발행 시 해당 NPC의 보드 인스턴스가 제거된다', () => {
    PatientBoardBridge.init();
    const npcId    = 'patient_park_jiyoung_42';
    const instId   = placePatientCard(npcId);

    EventBus.emit('patientLeft', { npcId });

    expect(GameState.cards[instId]).toBeUndefined();
  });

  it('존재하지 않는 npcId 이벤트는 조용히 무시', () => {
    PatientBoardBridge.init();
    expect(() => {
      EventBus.emit('patientDied', { npcId: 'nonexistent' });
    }).not.toThrow();
  });

  it('동일 npcId의 여러 인스턴스도 모두 제거된다', () => {
    PatientBoardBridge.init();
    const npcId  = 'patient_park_jiyoung_42';
    const inst1  = placePatientCard(npcId, 'middle', 0);
    const inst2  = placePatientCard(npcId, 'middle', 1);

    EventBus.emit('patientDied', { npcId });

    expect(GameState.cards[inst1]).toBeUndefined();
    expect(GameState.cards[inst2]).toBeUndefined();
  });
});
