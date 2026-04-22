// === PatientIntakeSystem — 증분 4 (Contribution Engine) ===
// 검증:
//  - npcHealed 리스너: 완치된 환자 감지 → _admitted 제거 + _rescued 추가
//  - immediate 아이템: pendingLoot에 즉시 추가
//  - recurring sponsor: intervalDays 경과 후 pendingLoot 추가, maxCount 도달 후 중단
//  - 비환자 npcHealed는 무시
//  - patientCured 이벤트 발행
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus             from '../../js/core/EventBus.js';
import GameState            from '../../js/core/GameState.js';
import SystemRegistry       from '../../js/core/SystemRegistry.js';
import NPCSystem            from '../../js/systems/NPCSystem.js';
import PatientIntakeSystem  from '../../js/systems/PatientIntakeSystem.js';
import PATIENT_POOL         from '../../js/data/patientPool.js';

function resetWorld() {
  EventBus._listeners = {};
  GameState.time.totalTP = 0;
  GameState.time.day     = 10;
  GameState.time.tpInDay = 0;
  GameState.npcs        = { states: {} };
  GameState.companions  = [];
  GameState.flags       = { er_unlocked: true };
  GameState.player      = { ...(GameState.player ?? {}), characterId: 'doctor' };
  GameState.stats       = { morale: { current: 70, max: 100 } };
  GameState.pendingLoot = [];
  GameState.cards = {};
  SystemRegistry.register('NPCSystem', NPCSystem);
  PatientIntakeSystem._reset?.();
}

// 파일럿 데이터의 첫 번째 페르소나 ID (결정적 테스트용)
const PILOT_ID = Object.keys(PATIENT_POOL)[0];

function admitSpecificPatient(npcId = PILOT_ID) {
  // _rollPersona를 우회하여 지정 환자를 강제 입원
  PatientIntakeSystem.init();
  const npcSystem = SystemRegistry.get('NPCSystem');
  npcSystem.forceSpawn(npcId);
  PatientIntakeSystem._admitted = [...PatientIntakeSystem._admitted, npcId];
  PatientIntakeSystem._patientMeta = {
    ...PatientIntakeSystem._patientMeta,
    [npcId]: { admissionTP: GameState.time.totalTP, hp: 100 },
  };
  return npcId;
}

beforeEach(resetWorld);

describe('PatientIntakeSystem — 증분 4: 완치 감지', () => {
  it('환자의 npcHealed 이벤트 수신 시 _admitted에서 _rescued로 이동', () => {
    const npcId = admitSpecificPatient();
    expect(PatientIntakeSystem.getActivePatients()).toContain(npcId);

    EventBus.emit('npcHealed', { npcId });

    expect(PatientIntakeSystem.getActivePatients()).not.toContain(npcId);
    expect(PatientIntakeSystem.getRescuedRoster()).toContain(npcId);
  });

  it('patientCured 이벤트가 발행된다', () => {
    const npcId = admitSpecificPatient();
    let captured = null;
    EventBus.on('patientCured', (p) => { captured = p; });

    EventBus.emit('npcHealed', { npcId });

    expect(captured).not.toBeNull();
    expect(captured.npcId).toBe(npcId);
  });

  it('비환자 NPC의 npcHealed는 무시 (rescued에 추가되지 않음)', () => {
    PatientIntakeSystem.init();
    const nonPatientId = 'npc_nurse';

    EventBus.emit('npcHealed', { npcId: nonPatientId });

    expect(PatientIntakeSystem.getRescuedRoster()).not.toContain(nonPatientId);
  });
});

describe('PatientIntakeSystem — 증분 4: immediate 아이템 지급', () => {
  it('completion 시 contributionOnCure.immediate 아이템이 pendingLoot에 추가된다', () => {
    const npcId = admitSpecificPatient();
    const def = PATIENT_POOL[npcId];
    const expectedImmediate = def.contributionOnCure?.immediate ?? [];

    EventBus.emit('npcHealed', { npcId });

    for (const { id, qty } of expectedImmediate) {
      const found = GameState.pendingLoot.find(l => l.definitionId === id);
      expect(found).toBeDefined();
      expect(found.quantity).toBe(qty);
    }
  });
});

describe('PatientIntakeSystem — 증분 4: recurring sponsor 스케줄링', () => {
  it('intervalDays 경과 전에는 배달 없음', () => {
    GameState.time.day = 10;
    const npcId = admitSpecificPatient();
    const def = PATIENT_POOL[npcId];
    const interval = def.contributionOnCure?.recurring?.intervalDays ?? 6;

    EventBus.emit('npcHealed', { npcId });
    const loot0 = GameState.pendingLoot.length;

    // intervalDays - 1일 경과: 아직 배달 X
    GameState.time.day = 10 + interval - 1;
    EventBus.emit('tpAdvance', {});

    expect(GameState.pendingLoot.length).toBe(loot0);
  });

  it('intervalDays 정확히 경과 시 1회 배달', () => {
    GameState.time.day = 10;
    const npcId = admitSpecificPatient();
    const def = PATIENT_POOL[npcId];
    const interval = def.contributionOnCure?.recurring?.intervalDays ?? 6;
    const recurItems = def.contributionOnCure?.recurring?.items ?? [];

    EventBus.emit('npcHealed', { npcId });
    const loot0 = GameState.pendingLoot.length;

    GameState.time.day = 10 + interval;
    EventBus.emit('tpAdvance', {});

    expect(GameState.pendingLoot.length).toBe(loot0 + recurItems.length);
    for (const { id, qty } of recurItems) {
      const match = GameState.pendingLoot
        .slice(loot0)
        .find(l => l.definitionId === id && l.quantity === qty);
      expect(match).toBeDefined();
    }
  });

  it('maxCount 도달 후에는 추가 배달 없음', () => {
    GameState.time.day = 10;
    const npcId = admitSpecificPatient();
    const def = PATIENT_POOL[npcId];
    const { intervalDays, maxCount } = def.contributionOnCure?.recurring ?? {};

    EventBus.emit('npcHealed', { npcId });

    // maxCount회 진행
    for (let i = 1; i <= maxCount; i++) {
      GameState.time.day = 10 + intervalDays * i;
      EventBus.emit('tpAdvance', {});
    }
    const lootAtMax = GameState.pendingLoot.length;

    // maxCount+1회째는 배달 없음
    GameState.time.day = 10 + intervalDays * (maxCount + 1);
    EventBus.emit('tpAdvance', {});

    expect(GameState.pendingLoot.length).toBe(lootAtMax);
  });

  it('sponsorDelivery 이벤트가 매 배달마다 발행된다', () => {
    GameState.time.day = 10;
    const npcId = admitSpecificPatient();
    const def = PATIENT_POOL[npcId];
    const interval = def.contributionOnCure?.recurring?.intervalDays ?? 6;

    let deliveryCount = 0;
    EventBus.on('sponsorDelivery', () => { deliveryCount++; });

    EventBus.emit('npcHealed', { npcId });

    GameState.time.day = 10 + interval;
    EventBus.emit('tpAdvance', {});

    expect(deliveryCount).toBe(1);
  });
});

describe('PatientIntakeSystem — 증분 4: rescued 로스터 영속성', () => {
  it('완치 환자는 rescued 로스터에 누적된다 (상한 영향 없음)', () => {
    // 첫 환자 완치
    const npcId1 = admitSpecificPatient(PILOT_ID);
    EventBus.emit('npcHealed', { npcId: npcId1 });

    // 두 번째 환자는 상한 소진 X (rescued는 _admitted와 별개)
    expect(PatientIntakeSystem.getActivePatients().length).toBe(0);
    expect(PatientIntakeSystem.getRescuedRoster().length).toBe(1);
  });
});
