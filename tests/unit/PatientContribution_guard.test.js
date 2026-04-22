// === PatientIntakeSystem × GuardSystem — Phase 3 연동 ===
// 검증:
//  - type === 'guard' 페르소나 완치 시 GuardSystem.register 호출
//  - _rescued.assignment.status: 'idle' 초기화
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import SystemRegistry      from '../../js/core/SystemRegistry.js';
import NPCSystem           from '../../js/systems/NPCSystem.js';
import PatientIntakeSystem from '../../js/systems/PatientIntakeSystem.js';
import GuardSystem         from '../../js/systems/GuardSystem.js';
import PATIENT_POOL        from '../../js/data/patientPool.js';

function resetWorld() {
  EventBus._listeners    = {};
  GameState.time.totalTP = 0;
  GameState.time.day     = 10;
  GameState.time.tpInDay = 0;
  GameState.npcs         = { states: {} };
  GameState.companions   = [];
  GameState.flags        = { er_unlocked: true };
  GameState.player       = { ...(GameState.player ?? {}), characterId: 'doctor' };
  GameState.stats        = { morale: { current: 70, max: 100 } };
  GameState.pendingLoot  = [];
  GameState.cards        = {};
  GameState.hospital     = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };
  NPCSystem._registerNPCItems();
  SystemRegistry.register('NPCSystem', NPCSystem);
  SystemRegistry.register('GuardSystem', GuardSystem);
  GuardSystem._reset?.();
  PatientIntakeSystem._reset?.();
}

function firstGuardPersona() {
  for (const [id, def] of Object.entries(PATIENT_POOL)) {
    if (def.contributionOnCure?.type === 'guard') return id;
  }
  return null;
}

function admitSpecific(npcId) {
  PatientIntakeSystem.init();
  const npcSystem = SystemRegistry.get('NPCSystem');
  npcSystem.forceSpawn(npcId);
  PatientIntakeSystem._admitted = [...PatientIntakeSystem._admitted, npcId];
  PatientIntakeSystem._patientMeta = {
    ...PatientIntakeSystem._patientMeta,
    [npcId]: { admissionTP: GameState.time.totalTP, hp: 100 },
  };
}

beforeEach(resetWorld);

describe('PatientIntakeSystem × GuardSystem — guard 분기', () => {
  it('guard 타입 페르소나 완치 시 GuardSystem.register 호출', () => {
    const npcId = firstGuardPersona();
    if (!npcId) return;
    GuardSystem.init();
    admitSpecific(npcId);
    const spy = vi.spyOn(GuardSystem, 'register');

    EventBus.emit('npcHealed', { npcId });

    expect(spy).toHaveBeenCalledWith(npcId, PATIENT_POOL[npcId].contributionOnCure);
    expect(GuardSystem.getRegistered()).toContain(npcId);
    spy.mockRestore();
  });

  it('_rescued.assignment.status: idle 초기화', () => {
    const npcId = firstGuardPersona();
    if (!npcId) return;
    GuardSystem.init();
    admitSpecific(npcId);

    EventBus.emit('npcHealed', { npcId });

    const info = PatientIntakeSystem.getRescuedInfo(npcId);
    expect(info?.assignment?.status).toBe('idle');
  });

  it('guard 페르소나는 immediate 아이템이 pendingLoot에 추가된다', () => {
    const npcId = firstGuardPersona();
    if (!npcId) return;
    GuardSystem.init();
    admitSpecific(npcId);
    const def = PATIENT_POOL[npcId].contributionOnCure;
    const expectedImmediate = def.immediate ?? [];
    if (expectedImmediate.length === 0) return;

    EventBus.emit('npcHealed', { npcId });

    const lootIds = GameState.pendingLoot.map(l => l.definitionId);
    for (const { id } of expectedImmediate) {
      expect(lootIds).toContain(id);
    }
  });
});
