// === PatientIntakeSystem × DispatchSystem — Phase 3 연동 ===
// 검증:
//  - type === 'dispatch' 페르소나 완치 시 DispatchSystem.register 호출
//  - _rescued.assignment가 초기화된다 (status: 'idle')
//  - immediate 아이템은 기존대로 pendingLoot에 추가
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import SystemRegistry      from '../../js/core/SystemRegistry.js';
import NPCSystem           from '../../js/systems/NPCSystem.js';
import PatientIntakeSystem from '../../js/systems/PatientIntakeSystem.js';
import DispatchSystem      from '../../js/systems/DispatchSystem.js';
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
  NPCSystem._registerNPCItems();
  SystemRegistry.register('NPCSystem', NPCSystem);
  SystemRegistry.register('DispatchSystem', DispatchSystem);
  DispatchSystem._reset?.();
  PatientIntakeSystem._reset?.();
}

function firstDispatchPersona() {
  // altContributions가 없는(선택 UI로 지연되지 않는) dispatch 페르소나 우선
  for (const [id, def] of Object.entries(PATIENT_POOL)) {
    if (def.contributionOnCure?.type === 'dispatch'
        && !Array.isArray(def.altContributions)) return id;
  }
  // fallback
  for (const [id, def] of Object.entries(PATIENT_POOL)) {
    if (def.contributionOnCure?.type === 'dispatch') return id;
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

describe('PatientIntakeSystem × DispatchSystem — dispatch 분기', () => {
  it('dispatch 타입 페르소나 완치 시 DispatchSystem에 등록된다', () => {
    const npcId = firstDispatchPersona();
    if (!npcId) {
      // 파일럿 데이터에 아직 dispatch 페르소나가 없으면 skip
      return;
    }
    DispatchSystem.init();
    admitSpecific(npcId);
    const spy = vi.spyOn(DispatchSystem, 'register');

    EventBus.emit('npcHealed', { npcId });

    expect(spy).toHaveBeenCalledWith(npcId, PATIENT_POOL[npcId].contributionOnCure);
    expect(DispatchSystem.getDispatchable()).toContain(npcId);
    spy.mockRestore();
  });

  it('_rescued entry에 assignment.status: idle 초기화', () => {
    const npcId = firstDispatchPersona();
    if (!npcId) return;
    DispatchSystem.init();
    admitSpecific(npcId);

    EventBus.emit('npcHealed', { npcId });

    const info = PatientIntakeSystem.getRescuedInfo(npcId);
    expect(info?.assignment?.status).toBe('idle');
  });

  it('sponsor 타입은 DispatchSystem.register를 호출하지 않는다', () => {
    // 모든 페르소나에서 sponsor 찾기
    let sponsorId = null;
    for (const [id, def] of Object.entries(PATIENT_POOL)) {
      if (def.contributionOnCure?.type === 'sponsor') { sponsorId = id; break; }
    }
    if (!sponsorId) return;
    DispatchSystem.init();
    admitSpecific(sponsorId);
    const spy = vi.spyOn(DispatchSystem, 'register');

    EventBus.emit('npcHealed', { npcId: sponsorId });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
