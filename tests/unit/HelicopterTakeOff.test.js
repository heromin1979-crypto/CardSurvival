// @vitest-environment happy-dom
// === 헬기 이륙 액션 테스트 ===
// 연료 2드럼 + 시동 열쇠가 갖춰지면 카드에서 직접 이륙할 수 있다. 어떤 엔딩으로
// 끝나는지는 직업 전용 헬기 엔딩의 조건을 그대로 재사용해 결정한다 — 퀘스트를
// 완주하지 않은 상태에서 전용 엔딩을 가로채지 않게 하기 위함.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HelicopterSystem from '../../js/systems/HelicopterSystem.js';
import EndingSystem from '../../js/systems/EndingSystem.js';
import GameState from '../../js/core/GameState.js';
import ENDINGS from '../../js/data/endings.js';
import ITEMS from '../../js/data/items.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, characterId: 'chef',
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
  };
  GameState.time = { day: 200, totalTP: 14400, tpInDay: 0, hour: 12, isPaused: false };
  GameState.location = { currentDistrict: 'yeongdeungpo', installedStructures: {} };
  GameState.ui = { ...(GameState.ui ?? {}), currentState: 'explore', saveSlot: 0 };
  GameState.flags = {};
  GameState.debug = {};
}

/** 바닥에 헬기를 놓고 연료·열쇠 상태를 지정 */
function placeHeli({ fuel = 0 } = {}) {
  const inst = GameState.createCardInstance('helicopter');
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  inst._fuelDrums = fuel;
  return inst;
}

describe('canTakeOff — 이륙 조건', () => {
  beforeEach(resetWorld);

  it('연료가 없으면 막힌다', () => {
    const h = placeHeli();
    const s = HelicopterSystem.canTakeOff(h.instanceId);
    expect(s.ok).toBe(false);
    expect(s.reason).toBeTruthy();
  });

  it('연료가 모자라면 남은 수치를 알려준다', () => {
    const h = placeHeli({ fuel: 1 });
    const s = HelicopterSystem.canTakeOff(h.instanceId);
    expect(s.ok).toBe(false);
    expect(s.fuel).toBe(1);
    expect(s.need).toBe(ITEMS.helicopter.flight.fuelDrums);
  });

  it('연료 2드럼이면 이륙할 수 있다', () => {
    const h = placeHeli({ fuel: 2 });
    expect(HelicopterSystem.canTakeOff(h.instanceId).ok).toBe(true);
  });

  it('비행체가 아닌 카드는 대상이 아니다', () => {
    const inst = GameState.createCardInstance('campfire');
    GameState.board.middle[0] = inst.instanceId;
    expect(HelicopterSystem.canTakeOff(inst.instanceId).ok).toBe(false);
  });
});

describe('takeOff — 엔딩 결정', () => {
  beforeEach(() => { resetWorld(); vi.restoreAllMocks(); });

  it('조건 미충족이면 엔딩이 발동하지 않는다', () => {
    const spy = vi.spyOn(EndingSystem, 'triggerEnding').mockImplementation(() => {});
    const h = placeHeli({ fuel: 1 });
    expect(HelicopterSystem.takeOff(h.instanceId).ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('전용 엔딩 조건을 못 채우면 범용 자력 탈출로 간다', () => {
    const spy = vi.spyOn(EndingSystem, 'triggerEnding').mockImplementation(() => {});
    const h = placeHeli({ fuel: 2 });
    const r = HelicopterSystem.takeOff(h.instanceId);
    expect(r.ok).toBe(true);
    expect(r.endingId).toBe('escape_helicopter_pilot');
    expect(spy).toHaveBeenCalledWith('escape_helicopter_pilot', GameState);
  });

  it('엔지니어가 B3를 완주했으면 전용 엔딩으로 간다', () => {
    vi.spyOn(EndingSystem, 'triggerEnding').mockImplementation(() => {});
    GameState.player.characterId = 'engineer';
    GameState.flags.mainQuestComplete_engineer = true;
    GameState.flags.engineer_ending = 'b3_heli_escape';
    const h = placeHeli({ fuel: 2 });
    expect(HelicopterSystem.takeOff(h.instanceId).endingId).toBe('mq_engineer_heli');
  });

  it('condition이 없어 일일 자동 검사에서 제외된다', () => {
    // EndingSystem._checkVictoryEndings는 typeof condition !== 'function'이면 건너뛴다.
    // 이륙 액션으로만 도달해야 하므로 조건을 두지 않는다.
    expect(typeof ENDINGS.escape_helicopter_pilot.condition).not.toBe('function');
  });

  it('구조받는 기존 엔딩과 서사가 다르다', () => {
    expect(ENDINGS.escape_helicopter_pilot.subtitle).not.toBe(ENDINGS.escape_helicopter.subtitle);
  });
});
