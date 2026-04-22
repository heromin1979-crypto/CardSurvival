// === HospitalSiegeSystem — Phase 4 (보라매병원 습격 오케스트레이터) ===
// 검증:
//  - init(): tpAdvance / siegeResolved 구독
//  - er_unlocked === false → 트리거 안 함
//  - Day 10 이전 → 트리거 안 함
//  - Day 10 (startDay) 하루 첫 TP에 nextSiegeDay 초기화
//  - 예정일 도달 → siegeTriggered 발행 (numEnemies, danger, siegeId, scheduledDay)
//  - 적 수 스케일: baseEnemies=2 + siegeCount×0.5 (round, 최대 maxEnemies=7)
//  - siegeCount 증가 + nextSiegeDay 갱신
//  - siegeResolved(victory): pendingLoot + morale +victoryMorale
//  - siegeResolved(defeat): patientDied × N + structureDamage 이벤트 + dangerMod 누적
//  - moraleBonus 일일 합산: 상주 수비대 moraleBonus 합 → morale 증가
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import SystemRegistry      from '../../js/core/SystemRegistry.js';
import GuardSystem         from '../../js/systems/GuardSystem.js';
import HospitalSiegeSystem from '../../js/systems/HospitalSiegeSystem.js';
import PatientIntakeSystem from '../../js/systems/PatientIntakeSystem.js';
import BALANCE             from '../../js/data/gameBalance.js';

function resetWorld() {
  EventBus._listeners    = {};
  GameState.time.totalTP = 0;
  GameState.time.day     = 10;
  GameState.time.tpInDay = 0;
  GameState.stats        = { morale: { current: 50, max: 100 } };
  GameState.cards        = {};
  GameState.pendingLoot  = [];
  GameState.flags        = { er_unlocked: true, nextSiegeDay: null, siegeCount: 0 };
  GameState.location     = { currentDistrict: 'mapo', currentLandmark: null, currentSubLocation: null };
  GameState.landmarkOverrides = {};
  GameState.hospital     = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };
  GameState.ui           = { currentState: 'main' };
  GameState.combat       = { active: false };

  SystemRegistry.register('GuardSystem', GuardSystem);
  SystemRegistry.register('PatientIntakeSystem', PatientIntakeSystem);
  GuardSystem._reset?.();
  PatientIntakeSystem._reset?.();
  HospitalSiegeSystem._reset?.();
}

function advanceToDay(day, tpInDay = 0) {
  GameState.time.day = day;
  GameState.time.tpInDay = tpInDay;
  EventBus.emit('tpAdvance', {});
}

beforeEach(resetWorld);

describe('HospitalSiegeSystem — 초기화 및 스케줄링', () => {
  it('init 후 tpAdvance / siegeResolved 구독', () => {
    HospitalSiegeSystem.init();
    expect(HospitalSiegeSystem._initialized).toBe(true);
  });

  it('er_unlocked 플래그 없으면 트리거하지 않음', () => {
    GameState.flags.er_unlocked = false;
    HospitalSiegeSystem.init();
    const spy = vi.fn();
    EventBus.on('siegeTriggered', spy);
    advanceToDay(100, 0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('startDay 이전에는 스케줄 초기화 안 함', () => {
    HospitalSiegeSystem.init();
    advanceToDay(BALANCE.hospitalSiege.startDay - 1, 0);
    expect(GameState.flags.nextSiegeDay).toBeNull();
  });

  it('startDay 도달 시 nextSiegeDay 초기화 (variance 범위 내)', () => {
    HospitalSiegeSystem.init();
    advanceToDay(BALANCE.hospitalSiege.startDay, 0);
    const b = BALANCE.hospitalSiege;
    expect(GameState.flags.nextSiegeDay).toBeGreaterThanOrEqual(b.startDay - b.intervalVariance);
    expect(GameState.flags.nextSiegeDay).toBeLessThanOrEqual(b.startDay + b.intervalVariance);
  });
});

describe('HospitalSiegeSystem — siegeTriggered 발행', () => {
  it('예정일 도달 시 siegeTriggered 발행 (첫 습격: baseEnemies)', () => {
    HospitalSiegeSystem.init();
    // 강제 트리거: nextSiegeDay = 10, siegeCount = 0
    GameState.flags.nextSiegeDay = 10;
    GameState.flags.siegeCount = 0;
    const spy = vi.fn();
    EventBus.on('siegeTriggered', spy);

    advanceToDay(10, 0);

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = spy.mock.calls[0][0];
    expect(payload.numEnemies).toBe(BALANCE.hospitalSiege.baseEnemies);
    expect(typeof payload.siegeId).toBe('string');
    expect(payload.scheduledDay).toBe(10);
  });

  it('siegeCount에 비례하여 적 수 증가 (round)', () => {
    HospitalSiegeSystem.init();
    GameState.flags.nextSiegeDay = 15;
    GameState.flags.siegeCount = 2;  // 3번째 습격
    const spy = vi.fn();
    EventBus.on('siegeTriggered', spy);

    advanceToDay(15, 0);

    const b = BALANCE.hospitalSiege;
    const expected = Math.min(b.maxEnemies, Math.round(b.baseEnemies + 2 * b.enemiesPerWave));
    expect(spy.mock.calls[0][0].numEnemies).toBe(expected);
  });

  it('적 수는 maxEnemies를 넘지 않음', () => {
    HospitalSiegeSystem.init();
    GameState.flags.nextSiegeDay = 100;
    GameState.flags.siegeCount = 100;  // 매우 큰 값
    const spy = vi.fn();
    EventBus.on('siegeTriggered', spy);

    advanceToDay(100, 0);

    expect(spy.mock.calls[0][0].numEnemies).toBe(BALANCE.hospitalSiege.maxEnemies);
  });

  it('siegeCount 증가 및 nextSiegeDay 갱신', () => {
    HospitalSiegeSystem.init();
    GameState.flags.nextSiegeDay = 12;
    GameState.flags.siegeCount = 0;

    advanceToDay(12, 0);

    expect(GameState.flags.siegeCount).toBe(1);
    const b = BALANCE.hospitalSiege;
    expect(GameState.flags.nextSiegeDay).toBeGreaterThanOrEqual(12 + b.intervalDays - b.intervalVariance);
    expect(GameState.flags.nextSiegeDay).toBeLessThanOrEqual(12 + b.intervalDays + b.intervalVariance);
  });

  it('같은 날 두 번 발행되지 않음 (하루 첫 TP에만)', () => {
    HospitalSiegeSystem.init();
    GameState.flags.nextSiegeDay = 10;
    const spy = vi.fn();
    EventBus.on('siegeTriggered', spy);

    advanceToDay(10, 0);
    advanceToDay(10, 5);  // 같은 날 추가 tpAdvance

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('HospitalSiegeSystem — siegeResolved 후처리', () => {
  it('victory: victoryItems pendingLoot 추가 + morale +victoryMorale', () => {
    HospitalSiegeSystem.init();
    const before = GameState.stats.morale.current;

    EventBus.emit('siegeResolved', {
      outcome:       'victory',
      casualties:    0,
      defenseRating: 150,
      threat:        100,
    });

    const b = BALANCE.hospitalSiege;
    expect(GameState.stats.morale.current).toBe(before + b.victoryMorale);
    const loot = GameState.pendingLoot.map(l => l.definitionId);
    for (const it of b.victoryItems) {
      expect(loot).toContain(it.id);
    }
  });

  it('defeat: structureDamage 이벤트 발행 + morale +defeatMorale', () => {
    HospitalSiegeSystem.init();
    const before = GameState.stats.morale.current;
    const dmgSpy = vi.fn();
    EventBus.on('structureDamage', dmgSpy);

    EventBus.emit('siegeResolved', {
      outcome:       'defeat',
      casualties:    1,
      defenseRating: 50,
      threat:        150,
    });

    const b = BALANCE.hospitalSiege;
    expect(dmgSpy).toHaveBeenCalledWith({ damagePercent: b.structureDamage });
    expect(GameState.stats.morale.current).toBe(before + b.defeatMorale);
  });

  it('defeat: admitted 환자 중 1~2명 patientDied emit', () => {
    HospitalSiegeSystem.init();
    PatientIntakeSystem._admitted = ['patient_a', 'patient_b', 'patient_c'];
    const spy = vi.fn();
    EventBus.on('patientDied', spy);

    EventBus.emit('siegeResolved', {
      outcome:       'defeat',
      casualties:    0,
      defenseRating: 0,
      threat:        100,
    });

    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(BALANCE.hospitalSiege.casualtiesMin);
    expect(spy.mock.calls.length).toBeLessThanOrEqual(BALANCE.hospitalSiege.casualtiesMax);
  });

  it('defeat: 보라매 서브로케이션 dangerMod 누적 증가', () => {
    HospitalSiegeSystem.init();

    EventBus.emit('siegeResolved', {
      outcome:       'defeat',
      casualties:    1,
      defenseRating: 0,
      threat:        100,
    });

    const delta = GameState.getLandmarkDangerModDelta('lm_boramae_hospital', 'boramae_emergency');
    expect(delta).toBeCloseTo(BALANCE.hospitalSiege.dangerModDelta);
  });

  it('defeat 반복 시 dangerMod 누적', () => {
    HospitalSiegeSystem.init();

    for (let i = 0; i < 3; i++) {
      EventBus.emit('siegeResolved', { outcome: 'defeat', casualties: 0, defenseRating: 0, threat: 100 });
    }

    const delta = GameState.getLandmarkDangerModDelta('lm_boramae_hospital', 'boramae_emergency');
    expect(delta).toBeCloseTo(BALANCE.hospitalSiege.dangerModDelta * 3);
  });
});

describe('HospitalSiegeSystem — moraleBonus 일일 합산', () => {
  it('상주 수비대 moraleBonus 합이 매일 morale에 추가', () => {
    GuardSystem.init();
    HospitalSiegeSystem.init();

    const def = {
      type: 'guard',
      immediate: [],
      // foodCostPerDay: 0 — 식량 소모로 인한 자동 이탈 방지 (moraleBonus 테스트용)
      guard: { combatDmg: 10, safetyAdd: 0.05, foodCostPerDay: 0, moraleBonus: 3 },
    };
    GuardSystem.register('g1', def);
    GuardSystem.station('g1');
    GuardSystem.register('g2', def);
    GuardSystem.station('g2');

    const before = GameState.stats.morale.current;
    advanceToDay(11, 0);

    // moraleBonus 합: 3 + 3 = 6. 단, er_unlocked인 Day 10 초과 상태에서 습격 스케줄도 돌아가므로
    // siegeTriggered가 발행될 수 있는데 nextSiegeDay=null이면 초기화만 하고 트리거는 안 됨.
    // day 11일 때 처음 이 틱이 돌며 nextSiegeDay가 초기화된다 (10~... 사이).
    // 따라서 siegeTriggered로 인한 morale 변동 없음 → +6만 기대.
    expect(GameState.stats.morale.current).toBe(before + 6);
  });

  it('수비대 없으면 morale 변동 없음', () => {
    GuardSystem.init();
    HospitalSiegeSystem.init();

    const before = GameState.stats.morale.current;
    advanceToDay(11, 0);
    expect(GameState.stats.morale.current).toBe(before);
  });
});

describe('HospitalSiegeSystem — W1-1 연승 보너스 (streakBonus)', () => {
  it('1연승: 보너스 없음 (victoryMorale만)', () => {
    HospitalSiegeSystem.init();
    const before = GameState.stats.morale.current;

    EventBus.emit('siegeResolved', { outcome: 'victory', casualties: 0, defenseRating: 150, threat: 100 });

    const b = BALANCE.hospitalSiege;
    expect(GameState.stats.morale.current).toBe(before + b.victoryMorale);
    expect(GameState.flags.siegeWinStreak).toBe(1);
  });

  it('2연승: victoryMorale + streakBonus.at2', () => {
    HospitalSiegeSystem.init();
    GameState.flags.siegeWinStreak = 1;
    const before = GameState.stats.morale.current;

    EventBus.emit('siegeResolved', { outcome: 'victory', casualties: 0, defenseRating: 150, threat: 100 });

    const b = BALANCE.hospitalSiege;
    expect(GameState.stats.morale.current).toBe(before + b.victoryMorale + b.streakBonus.at2);
    expect(GameState.flags.siegeWinStreak).toBe(2);
  });

  it('5연승: victoryMorale + streakBonus.at5 (at2는 중복 안 함)', () => {
    HospitalSiegeSystem.init();
    GameState.flags.siegeWinStreak = 4;
    const before = GameState.stats.morale.current;

    EventBus.emit('siegeResolved', { outcome: 'victory', casualties: 0, defenseRating: 150, threat: 100 });

    const b = BALANCE.hospitalSiege;
    expect(GameState.stats.morale.current).toBe(before + b.victoryMorale + b.streakBonus.at5);
    expect(GameState.flags.siegeWinStreak).toBe(5);
  });

  it('defeat 시 streak 0으로 리셋', () => {
    HospitalSiegeSystem.init();
    GameState.flags.siegeWinStreak = 3;

    EventBus.emit('siegeResolved', { outcome: 'defeat', casualties: 0, defenseRating: 0, threat: 100 });

    expect(GameState.flags.siegeWinStreak).toBe(0);
  });
});

describe('HospitalSiegeSystem — W1-2 hordeWave 중첩 완화', () => {
  it('siege 발동 시 minGap 내 예정된 nextHordeDay를 뒤로 미룸', () => {
    HospitalSiegeSystem.init();
    GameState.flags.nextSiegeDay = 28;
    GameState.flags.siegeCount = 3;
    GameState.flags.nextHordeDay = 30;   // siege 2일 뒤 horde 예정

    advanceToDay(28, 0);

    const minGap = BALANCE.hospitalSiege.minGapWithHordeDays;
    expect(GameState.flags.nextHordeDay).toBe(28 + minGap);
    expect(GameState.flags.lastSiegeDay).toBe(28);
  });

  it('siege 발동 시 minGap 밖 예정된 nextHordeDay는 그대로', () => {
    HospitalSiegeSystem.init();
    GameState.flags.nextSiegeDay = 20;
    GameState.flags.siegeCount = 2;
    GameState.flags.nextHordeDay = 40;   // 충분히 멀리

    advanceToDay(20, 0);

    expect(GameState.flags.nextHordeDay).toBe(40);
  });
});
