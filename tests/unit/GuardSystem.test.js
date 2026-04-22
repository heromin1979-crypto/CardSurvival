// === GuardSystem — Phase 2 (T3 수비대 시스템) ===
// 검증:
//  - register(npcId, def): guard 타입만 수락
//  - station(npcId): stationedGuards 추가, defenseRating 재계산
//  - dismiss(npcId): 제거, defenseRating 재계산
//  - dayAdvance (tpAdvance day 변경): foodCostPerDay 만큼 식량 소모
//  - 식량 부족 시 guardStarved 이벤트 + 자동 이탈
//  - onSiege / siegeTriggered 훅: defenseRating vs threat 비교
//  - patientDied/patientLeft 수신 시 cleanup
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus      from '../../js/core/EventBus.js';
import GameState     from '../../js/core/GameState.js';
import GuardSystem   from '../../js/systems/GuardSystem.js';

function resetWorld() {
  EventBus._listeners    = {};
  GameState.time.totalTP = 0;
  GameState.time.day     = 10;
  GameState.time.tpInDay = 0;
  GameState.stats        = { morale: { current: 70, max: 100 } };
  GameState.cards        = {};
  GameState.pendingLoot  = [];
  GameState.hospital     = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };
  GuardSystem._reset?.();
}

function makeGuardDef(overrides = {}) {
  return {
    type: 'guard',
    immediate: [],
    guard: {
      combatDmg:       12,
      safetyAdd:       0.05,
      foodCostPerDay:  1,
      moraleBonus:     2,
      ...overrides.guard,
    },
    ...overrides,
  };
}

function addFoodCard(quantity = 5) {
  const id = 'c_food_' + Math.random().toString(36).slice(2, 6);
  GameState.cards[id] = {
    instanceId: id,
    definitionId: 'canned_food',
    quantity,
    durability: 100,
    contamination: 0,
  };
  return id;
}

beforeEach(resetWorld);

describe('GuardSystem — 등록 및 station/dismiss', () => {
  it('init 후 register는 guard 타입만 수락', () => {
    GuardSystem.init();
    expect(GuardSystem.register('npc_a', makeGuardDef())).toBe(true);
    expect(GuardSystem.register('npc_b', { type: 'sponsor' })).toBe(false);
    expect(GuardSystem.getRegistered()).toContain('npc_a');
    expect(GuardSystem.getRegistered()).not.toContain('npc_b');
  });

  it('station() 시 stationedGuards에 추가 + defenseRating 재계산', () => {
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());

    const ok = GuardSystem.station('npc_a');

    expect(ok).toBe(true);
    expect(GameState.hospital.stationedGuards).toContain('npc_a');
    // combatDmg 12 × 10 + safetyAdd 0.05 × 100 = 125
    expect(GuardSystem.getDefenseRating()).toBe(125);
  });

  it('station은 guardStationed 이벤트 발행', () => {
    const spy = vi.fn();
    EventBus.on('guardStationed', spy);
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());

    GuardSystem.station('npc_a');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].npcId).toBe('npc_a');
  });

  it('dismiss() 시 stationedGuards 제거 + defenseRating 재계산', () => {
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');

    GuardSystem.dismiss('npc_a');

    expect(GameState.hospital.stationedGuards).not.toContain('npc_a');
    expect(GuardSystem.getDefenseRating()).toBe(0);
  });

  it('이미 stationed 상태에서 다시 station하면 false', () => {
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');

    expect(GuardSystem.station('npc_a')).toBe(false);
  });
});

describe('GuardSystem — 일일 식량 소모', () => {
  it('day 변경 시 수비대당 foodCostPerDay만큼 식량 차감', () => {
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');
    const foodId = addFoodCard(5);

    GameState.time.day = 11;
    EventBus.emit('tpAdvance', {});

    expect(GameState.cards[foodId].quantity).toBe(4);
  });

  it('식량 부족 시 guardStarved 이벤트 + 자동 dismiss', () => {
    const spy = vi.fn();
    EventBus.on('guardStarved', spy);
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');
    // 식량 없음

    GameState.time.day = 11;
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalledOnce();
    expect(GameState.hospital.stationedGuards).not.toContain('npc_a');
  });

  it('같은 day 내 tpAdvance 반복 호출은 식량을 중복 차감하지 않는다', () => {
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');
    const foodId = addFoodCard(5);

    GameState.time.day = 11;
    EventBus.emit('tpAdvance', {});
    EventBus.emit('tpAdvance', {});
    EventBus.emit('tpAdvance', {});

    expect(GameState.cards[foodId].quantity).toBe(4);  // 1회만 차감
  });
});

describe('GuardSystem — Siege 훅', () => {
  it('siegeTriggered 수신 시 defenseRating 기반 승패 판정', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);  // threat ×0.8 고정
    const resolvedSpy = vi.fn();
    EventBus.on('siegeResolved', resolvedSpy);

    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');  // defenseRating 125

    // threat = 2 × 2 × 15 = 60, ×0.8 = 48 → 125 승리
    EventBus.emit('siegeTriggered', { numEnemies: 2, danger: 2 });

    expect(resolvedSpy).toHaveBeenCalledOnce();
    expect(resolvedSpy.mock.calls[0][0].outcome).toBe('victory');

    vi.restoreAllMocks();
  });

  it('defenseRating이 threat보다 낮으면 defeat + casualties 발생', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const resolvedSpy = vi.fn();
    const killedSpy   = vi.fn();
    EventBus.on('siegeResolved', resolvedSpy);
    EventBus.on('guardKilled', killedSpy);

    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef({
      guard: { combatDmg: 1, safetyAdd: 0.0, foodCostPerDay: 1, moraleBonus: 0 },
    }));
    GuardSystem.station('npc_a');  // defenseRating = 10

    // threat = 10 × 3 × 15 = 450 → 10 패배
    EventBus.emit('siegeTriggered', { numEnemies: 10, danger: 3 });

    expect(resolvedSpy.mock.calls[0][0].outcome).toBe('defeat');
    expect(resolvedSpy.mock.calls[0][0].casualties).toBeGreaterThanOrEqual(1);
    vi.restoreAllMocks();
  });

  it('siegeHistory에 결과 누적', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');

    EventBus.emit('siegeTriggered', { numEnemies: 2, danger: 2 });

    expect(GameState.hospital.siegeHistory).toHaveLength(1);
    expect(GameState.hospital.siegeHistory[0].outcome).toBe('victory');
    vi.restoreAllMocks();
  });
});

describe('GuardSystem — 로스터 cleanup', () => {
  it('patientDied 수신 시 수비대에서 제거', () => {
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');

    EventBus.emit('patientDied', { npcId: 'npc_a' });

    expect(GameState.hospital.stationedGuards).not.toContain('npc_a');
    expect(GuardSystem.getRegistered()).not.toContain('npc_a');
  });

  it('patientLeft 수신 시 제거', () => {
    GuardSystem.init();
    GuardSystem.register('npc_a', makeGuardDef());
    GuardSystem.station('npc_a');

    EventBus.emit('patientLeft', { npcId: 'npc_a' });

    expect(GameState.hospital.stationedGuards).not.toContain('npc_a');
  });
});
