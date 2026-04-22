// === DispatchSystem — Phase 1 (T2 파견 시스템) ===
// 검증:
//  - register(npcId, def): _rescued에 dispatch 타입 등록
//  - deploy(npcId): idle → deployed, returnDay 설정, 이벤트 발행
//  - recall(npcId): 조기 복귀, yield 없음
//  - dayAdvance(tpAdvance tick): returnDay 도달 시 yield chance 롤 → pendingLoot
//  - injuryChance: 재입원/사망 분기 (dispatchFailed 이벤트)
//  - maxRuns 도달 → status 'retired'
//  - patientDied/patientLeft 이벤트 구독 → cleanup
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus        from '../../js/core/EventBus.js';
import GameState       from '../../js/core/GameState.js';
import SystemRegistry  from '../../js/core/SystemRegistry.js';
import NPCSystem       from '../../js/systems/NPCSystem.js';
import DispatchSystem  from '../../js/systems/DispatchSystem.js';

function resetWorld() {
  EventBus._listeners    = {};
  GameState.time.totalTP = 0;
  GameState.time.day     = 10;
  GameState.time.tpInDay = 0;
  GameState.pendingLoot  = [];
  GameState.cards        = {};
  GameState.stats        = { morale: { current: 70, max: 100 } };
  NPCSystem._registerNPCItems();
  SystemRegistry.register('NPCSystem', NPCSystem);
  DispatchSystem._reset?.();
}

function makeDispatchDef(overrides = {}) {
  return {
    type: 'dispatch',
    immediate: [],
    dispatch: {
      targetDistrict: 'gangnam',
      intervalDays:   5,
      maxRuns:        3,
      injuryChance:   0.0,
      yield: [
        { id: 'herb',      qty: 2, chance: 1.0 },
        { id: 'herb_seed', qty: 1, chance: 1.0 },
      ],
      ...overrides.dispatch,
    },
    ...overrides,
  };
}

beforeEach(resetWorld);

describe('DispatchSystem — 등록 및 기본 API', () => {
  it('init() 후 register(npcId, def)로 NPC가 파견 가능 목록에 포함된다', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());

    expect(DispatchSystem.getDispatchable()).toContain('patient_x');
  });

  it('register는 비-dispatch 타입을 무시한다', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_y', { type: 'sponsor' });

    expect(DispatchSystem.getDispatchable()).not.toContain('patient_y');
  });

  it('deploy() 호출 시 status가 deployed로 변경되고 returnDay가 설정된다', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());
    GameState.time.day = 10;

    const ok = DispatchSystem.deploy('patient_x');

    expect(ok).toBe(true);
    expect(DispatchSystem.getDeployed()).toContain('patient_x');
    expect(DispatchSystem.getDispatchable()).not.toContain('patient_x');
    const entry = DispatchSystem.getAssignment('patient_x');
    expect(entry.status).toBe('deployed');
    expect(entry.returnDay).toBe(15);  // 10 + 5
  });

  it('deploy()는 dispatchDeployed 이벤트를 발행한다', () => {
    const spy = vi.fn();
    EventBus.on('dispatchDeployed', spy);
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());

    DispatchSystem.deploy('patient_x');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({
      npcId:    'patient_x',
      district: 'gangnam',
      returnDay: 15,
    });
  });

  it('이미 deployed인 NPC를 다시 deploy하면 false 반환', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());
    DispatchSystem.deploy('patient_x');

    expect(DispatchSystem.deploy('patient_x')).toBe(false);
  });

  it('recall()은 deployed → idle, yield 없음', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());
    DispatchSystem.deploy('patient_x');

    const ok = DispatchSystem.recall('patient_x');

    expect(ok).toBe(true);
    expect(DispatchSystem.getAssignment('patient_x').status).toBe('idle');
    expect(GameState.pendingLoot).toHaveLength(0);
  });
});

describe('DispatchSystem — 일일 틱 복귀 처리', () => {
  it('returnDay 도달 시 yield가 pendingLoot에 추가되고 status가 idle로 돌아온다', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());
    GameState.time.day = 10;
    DispatchSystem.deploy('patient_x');

    // 5일 경과 → day 15 (returnDay)
    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    expect(DispatchSystem.getAssignment('patient_x').status).toBe('idle');
    const lootIds = GameState.pendingLoot.map(l => l.definitionId);
    expect(lootIds).toContain('herb');
    expect(lootIds).toContain('herb_seed');
  });

  it('returnDay 미도달 시 pendingLoot는 변동 없음', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());
    GameState.time.day = 10;
    DispatchSystem.deploy('patient_x');

    GameState.time.day = 12;
    EventBus.emit('tpAdvance', {});

    expect(GameState.pendingLoot).toHaveLength(0);
    expect(DispatchSystem.getAssignment('patient_x').status).toBe('deployed');
  });

  it('dispatchReturned 이벤트가 발행된다', () => {
    const spy = vi.fn();
    EventBus.on('dispatchReturned', spy);
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());
    DispatchSystem.deploy('patient_x');

    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].npcId).toBe('patient_x');
    expect(spy.mock.calls[0][0].success).toBe(true);
  });

  it('chance < 1.0이면 Math.random에 따라 yield가 누락될 수 있다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);  // 모든 chance 미만 → 모두 누락
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef({
      dispatch: {
        targetDistrict: 'gangnam', intervalDays: 5, maxRuns: 3, injuryChance: 0,
        yield: [{ id: 'herb', qty: 2, chance: 0.5 }],
      },
    }));
    DispatchSystem.deploy('patient_x');
    GameState.time.day = 15;
    EventBus.emit('tpAdvance', {});

    expect(GameState.pendingLoot).toHaveLength(0);
    vi.restoreAllMocks();
  });

  it('maxRuns 도달 시 status가 retired로 고정된다', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef({
      dispatch: {
        targetDistrict: 'gangnam', intervalDays: 2, maxRuns: 1, injuryChance: 0,
        yield: [{ id: 'herb', qty: 1, chance: 1.0 }],
      },
    }));
    DispatchSystem.deploy('patient_x');

    GameState.time.day = 12;
    EventBus.emit('tpAdvance', {});

    expect(DispatchSystem.getAssignment('patient_x').status).toBe('retired');
    expect(DispatchSystem.deploy('patient_x')).toBe(false);
  });
});

describe('DispatchSystem — 부상/사망 분기', () => {
  it('injuryChance 발동 시 dispatchFailed 이벤트 발행 + status idle 복귀', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);  // < 0.1 injuryChance
    const spy = vi.fn();
    EventBus.on('dispatchFailed', spy);

    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef({
      dispatch: {
        targetDistrict: 'gangnam', intervalDays: 2, maxRuns: 3, injuryChance: 0.1,
        yield: [{ id: 'herb', qty: 1, chance: 1.0 }],
      },
    }));
    DispatchSystem.deploy('patient_x');
    GameState.time.day = 12;
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ npcId: 'patient_x', district: 'gangnam' });
    expect(GameState.pendingLoot).toHaveLength(0);

    vi.restoreAllMocks();
  });
});

describe('DispatchSystem — 로스터 cleanup', () => {
  it('patientDied 수신 시 해당 NPC 제거', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());

    EventBus.emit('patientDied', { npcId: 'patient_x' });

    expect(DispatchSystem.getDispatchable()).not.toContain('patient_x');
    expect(DispatchSystem.getAssignment('patient_x')).toBeNull();
  });

  it('patientLeft 수신 시 해당 NPC 제거', () => {
    DispatchSystem.init();
    DispatchSystem.register('patient_x', makeDispatchDef());

    EventBus.emit('patientLeft', { npcId: 'patient_x' });

    expect(DispatchSystem.getDispatchable()).not.toContain('patient_x');
  });
});
