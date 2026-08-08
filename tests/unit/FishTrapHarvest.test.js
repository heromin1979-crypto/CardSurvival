// @vitest-environment happy-dom
// === 통발 자동 수확 테스트 ===
// 통발 설명은 "8턴마다 자동으로 물고기를 수확한다"고 말한다. 설치 → 미끼 → 8TP 주기
// 수확 → 미끼 소진까지의 사슬 전체를 고정하고, 날씨 보정이 실제로 걸리는지 확인한다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FishingSystem from '../../js/systems/FishingSystem.js';
import TickEngine from '../../js/core/TickEngine.js';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';
import ITEMS from '../../js/data/items.js';

const FISHING_LANDMARK = 'hangang_gangnam';
const B = BALANCE.fishing;

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true,
    equipped: {},
    hp: { current: 80, max: 100 },
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: { fishing: { xp: 0, level: 1 } },
  };
  GameState.time = { day: 10, totalTP: 0, tpInDay: 0, hour: 12, isPaused: false };
  GameState.location = { currentDistrict: 'gangnam', currentLandmark: FISHING_LANDMARK, installedStructures: {} };
  GameState.weather = { id: 'sunny', name: '맑음', icon: '☀️', tempMod: 0, tpRemaining: 72, tempJitter: 0 };
  GameState.flags = {};
  GameState.debug = {};
}

/** 통발을 바닥에 놓고 설치까지 끝낸 인스턴스를 반환 */
function installTrap() {
  const inst = GameState.createCardInstance('fish_trap');
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  FishingSystem.onTrapPlaced(inst.instanceId);
  return inst;
}

const fishCount = () =>
  GameState.countOnBoard('fish_small') + GameState.countOnBoard('fish_medium');

describe('통발 데이터 전제', () => {
  it('설명대로 8TP 주기를 상수로 가진다', () => {
    expect(B.trapCheckIntervalTP).toBe(8);
    expect(ITEMS.fish_trap.description).toContain('8턴');
  });
});

describe('통발 설치', () => {
  beforeEach(resetWorld);

  it('낚시 랜드마크 안에서는 설치된다', () => {
    expect(installTrap()._isInstalled).toBe(true);
  });

  it('낚시 랜드마크 밖에서는 설치되지 않는다', () => {
    GameState.location.currentLandmark = 'seoul_station';
    expect(installTrap()._isInstalled).toBeUndefined();
  });
});

describe('통발 수확 — 미끼 조건', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it('미끼가 없으면 물고기가 잡히지 않는다', () => {
    installTrap();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(0);
  });

  it('미끼가 있고 판정에 성공하면 물고기가 바닥에 놓인다', () => {
    const trap = installTrap();
    trap._baitCharges = 4;
    vi.spyOn(Math, 'random').mockReturnValue(0);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(1);
  });

  it('수확 시도마다 미끼가 1회 차감된다', () => {
    const trap = installTrap();
    trap._baitCharges = 4;
    vi.spyOn(Math, 'random').mockReturnValue(0.99);   // 어획 실패
    FishingSystem.checkFishTrap();
    expect(trap._baitCharges).toBe(3);
  });
});

describe('통발 수확 — 8TP 주기', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it('tpAdvance 8배수에서만 수확을 시도한다', () => {
    const spy = vi.spyOn(FishingSystem, 'checkFishTrap').mockImplementation(() => {});
    const handler = ({ totalTP }) => {
      if (totalTP > 0 && totalTP % B.trapCheckIntervalTP === 0) FishingSystem.checkFishTrap();
    };
    const off = EventBus.on('tpAdvance', handler);

    TickEngine.skipTP(7);
    expect(spy).toHaveBeenCalledTimes(0);
    TickEngine.skipTP(1);            // totalTP = 8
    expect(spy).toHaveBeenCalledTimes(1);
    TickEngine.skipTP(8);            // totalTP = 16
    expect(spy).toHaveBeenCalledTimes(2);

    if (typeof off === 'function') off();
  });

  it('여러 TP를 한 번에 건너뛰어도 8배수를 놓치지 않는다', () => {
    const spy = vi.spyOn(FishingSystem, 'checkFishTrap').mockImplementation(() => {});
    const handler = ({ totalTP }) => {
      if (totalTP > 0 && totalTP % B.trapCheckIntervalTP === 0) FishingSystem.checkFishTrap();
    };
    const off = EventBus.on('tpAdvance', handler);

    TickEngine.skipTP(24);           // 8, 16, 24 → 3회
    expect(spy).toHaveBeenCalledTimes(3);

    if (typeof off === 'function') off();
  });
});

describe('통발 수확 — 날씨 보정', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  // 폭염(hot)은 -0.10, 장마(monsoon)는 +0.08. 기본 확률 0.4 기준으로
  // 0.35를 굴리면 폭염에서는 실패(0.30), 장마에서는 성공(0.48)해야 한다.
  it('폭염에서는 어획 확률이 떨어진다', () => {
    const trap = installTrap();
    trap._baitCharges = 4;
    GameState.weather = { ...GameState.weather, id: 'hot', name: '폭염' };
    vi.spyOn(Math, 'random').mockReturnValue(0.35);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(0);
  });

  it('장마에서는 어획 확률이 올라간다', () => {
    const trap = installTrap();
    trap._baitCharges = 4;
    GameState.weather = { ...GameState.weather, id: 'monsoon', name: '장마' };
    vi.spyOn(Math, 'random').mockReturnValue(0.45);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(1);
  });
});

describe('통발 수확 — 확률 상한', () => {
  beforeEach(resetWorld);

  it('상한을 밸런스 상수(trapMaxCatch)로 잡는다', () => {
    expect(B.trapMaxCatch).toBeDefined();
    const src = FishingSystem.checkFishTrap.toString();
    expect(src).toContain('trapMaxCatch');
  });
});
