// === HospitalSiegeSystem × GuardSystem — 플레이어 현장 분기 ===
// 검증:
//  - 플레이어 부재: GuardSystem이 siege 자동 시뮬 → siegeResolved 발행
//  - 플레이어 현장: GuardSystem은 skip, HospitalSiegeSystem이 StateMachine.transition 호출
//  - siegeTriggered payload.playerPresent 플래그 정확성
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import StateMachine        from '../../js/core/StateMachine.js';
import SystemRegistry      from '../../js/core/SystemRegistry.js';
import GuardSystem         from '../../js/systems/GuardSystem.js';
import HospitalSiegeSystem from '../../js/systems/HospitalSiegeSystem.js';
import PatientIntakeSystem from '../../js/systems/PatientIntakeSystem.js';

function resetWorld() {
  EventBus._listeners    = {};
  GameState.time.totalTP = 0;
  GameState.time.day     = 15;
  GameState.time.tpInDay = 0;
  GameState.stats        = { morale: { current: 50, max: 100 } };
  GameState.cards        = {};
  GameState.pendingLoot  = [];
  GameState.flags        = { er_unlocked: true, nextSiegeDay: null, siegeCount: 0 };
  GameState.location     = { currentDistrict: 'dongjak', currentLandmark: null, currentSubLocation: null };
  GameState.noise        = { level: 0 };
  GameState.ui           = { currentState: 'main' };
  GameState.combat       = { active: false };
  GameState.landmarkOverrides = {};
  GameState.hospital     = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };

  SystemRegistry.register('GuardSystem',         GuardSystem);
  SystemRegistry.register('PatientIntakeSystem', PatientIntakeSystem);
  GuardSystem._reset?.();
  PatientIntakeSystem._reset?.();
  HospitalSiegeSystem._reset?.();
}

beforeEach(resetWorld);

describe('플레이어 부재 분기', () => {
  it('siegeTriggered payload에 playerPresent: false', () => {
    GuardSystem.init();
    HospitalSiegeSystem.init();
    GameState.location.currentLandmark = null;   // 부재
    GameState.flags.nextSiegeDay = 15;

    const spy = vi.fn();
    EventBus.on('siegeTriggered', spy);
    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].playerPresent).toBe(false);
  });

  it('GuardSystem이 siegeResolved 발행 (자동 시뮬)', () => {
    GuardSystem.init();
    HospitalSiegeSystem.init();
    GameState.location.currentLandmark = null;
    GameState.flags.nextSiegeDay = 15;

    const spy = vi.fn();
    EventBus.on('siegeResolved', spy);
    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalled();
  });
});

describe('플레이어 현장 분기', () => {
  it('siegeTriggered payload에 playerPresent: true', () => {
    GuardSystem.init();
    HospitalSiegeSystem.init();
    GameState.location.currentLandmark = 'dongjak';   // 현장
    GameState.flags.nextSiegeDay = 15;

    const spy = vi.fn();
    EventBus.on('siegeTriggered', spy);
    // StateMachine 전환은 실제 로직을 피하기 위해 mock
    const stMock = vi.spyOn(StateMachine, 'transition').mockImplementation(() => {});
    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].playerPresent).toBe(true);
    stMock.mockRestore();
  });

  it('GuardSystem은 siegeResolved 발행 안 함 (CombatSystem 경로)', () => {
    GuardSystem.init();
    HospitalSiegeSystem.init();
    GameState.location.currentLandmark = 'dongjak';
    GameState.flags.nextSiegeDay = 15;

    const spy = vi.fn();
    EventBus.on('siegeResolved', spy);
    const stMock = vi.spyOn(StateMachine, 'transition').mockImplementation(() => {});
    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    expect(spy).not.toHaveBeenCalled();
    stMock.mockRestore();
  });

  it('HospitalSiegeSystem이 StateMachine.transition을 encounter로 호출', () => {
    GuardSystem.init();
    HospitalSiegeSystem.init();
    GameState.location.currentLandmark = 'dongjak';
    GameState.flags.nextSiegeDay = 15;

    const stMock = vi.spyOn(StateMachine, 'transition').mockImplementation(() => {});
    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    const call = stMock.mock.calls.find(c => c[0] === 'encounter');
    expect(call).toBeTruthy();
    expect(call[1].isSiege).toBe(true);
    expect(typeof call[1].siegeId).toBe('string');
    stMock.mockRestore();
  });
});
