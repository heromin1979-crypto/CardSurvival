// @vitest-environment happy-dom
// === 통발 배선 테스트 ===
// 통발에 세 가지 배선 누락이 있었다.
//   1) _findInstalledTrap이 board.middle의 첫 통발만 반환해 2기 이상 설치가 무효였다.
//   2) districts.fishingQuality가 선언만 있고 어획률에 반영되지 않았다.
//   3) 게 통발·투망·자동 포획 장치·명인의 루어가 제작만 되고 읽는 코드가 없었다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FishingSystem from '../../js/systems/FishingSystem.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';
import { DISTRICTS } from '../../js/data/districts.js';

const B = BALANCE.fishing;

function resetWorld(districtId = 'gangnam') {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.locationFloors = {};
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, hp: { current: 80, max: 100 },
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: { fishing: { xp: 0, level: 1 } },
  };
  GameState.time = { day: 10, totalTP: 0, tpInDay: 0, hour: 12, isPaused: false };
  GameState.location = {
    currentDistrict: districtId,
    currentLandmark: `hangang_${districtId}`,
    installedStructures: {},
  };
  GameState.weather = { id: 'sunny' };
  GameState.flags = {};
  GameState.debug = {};
}

function carry(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board.bottom[GameState.board.bottom.indexOf(null)] = inst.instanceId;
  return inst;
}

function installTrap(charges = 4) {
  const inst = GameState.createCardInstance('fish_trap');
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  FishingSystem.onTrapPlaced(inst.instanceId);
  inst._baitCharges = charges;
  return inst;
}

const fishCount = () =>
  GameState.countOnBoard('fish_small') + GameState.countOnBoard('fish_medium');

describe('통발 다중 설치', () => {
  beforeEach(() => resetWorld());
  afterEach(() => vi.restoreAllMocks());

  it('설치한 통발 수만큼 독립 판정한다', () => {
    installTrap();
    installTrap();
    installTrap();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(3);
  });

  it('통발마다 미끼가 따로 소모된다', () => {
    const a = installTrap(4);
    const b = installTrap(2);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);   // 어획 실패
    FishingSystem.checkFishTrap();
    expect(a._baitCharges).toBe(3);
    expect(b._baitCharges).toBe(1);
  });

  it('미끼가 떨어진 통발은 건너뛰고 나머지는 돈다', () => {
    installTrap(0);
    installTrap(4);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(1);
  });
});

describe('구 fishingQuality 반영', () => {
  afterEach(() => vi.restoreAllMocks());

  // 송파는 fishingQuality 3, 강남은 2. 기본 0.40에 +0.10이 붙어
  // 0.45를 굴리면 송파에서만 성공해야 한다.
  it('데이터 전제 — 송파 3, 강남 2', () => {
    expect(DISTRICTS.songpa.fishingQuality).toBe(3);
    expect(DISTRICTS.gangnam.fishingQuality).toBe(B.fishingQualityBase);
  });

  it('기준치 구에서는 보정이 없다', () => {
    resetWorld('gangnam');
    installTrap();
    vi.spyOn(Math, 'random').mockReturnValue(0.45);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(0);
  });

  it('상위 구에서는 어획률이 오른다', () => {
    resetWorld('songpa');
    installTrap();
    vi.spyOn(Math, 'random').mockReturnValue(0.45);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(1);
  });
});

describe('게 통발 — 통발 어획률 보정', () => {
  beforeEach(() => resetWorld());
  afterEach(() => vi.restoreAllMocks());

  it('없으면 0.45 판정에 실패한다', () => {
    installTrap();
    vi.spyOn(Math, 'random').mockReturnValue(0.45);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(0);
  });

  it('지니고 있으면 같은 판정에 성공한다', () => {
    installTrap();
    carry('crab_trap');
    vi.spyOn(Math, 'random').mockReturnValue(0.45);
    FishingSystem.checkFishTrap();
    expect(fishCount()).toBe(1);
  });
});

describe('자동 포획 장치 — 부재 중 가동·미끼 절약', () => {
  beforeEach(() => resetWorld());
  afterEach(() => vi.restoreAllMocks());

  /** 통발을 설치한 뒤 다른 장소로 이동한 상태를 만든다 */
  function leaveTrapBehind(charges = 4) {
    const trap = installTrap(charges);
    GameState.locationFloors['hangang_gangnam'] = [...GameState.board.middle];
    GameState.board.middle = Array(GameState.board.middle.length).fill(null);
    GameState.location.currentLandmark = 'seoul_station';
    return trap;
  }

  it('장치가 없으면 두고 온 통발은 멈춘다', () => {
    const trap = leaveTrapBehind();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    FishingSystem.checkFishTrap();
    expect(trap._baitCharges).toBe(4);
  });

  it('장치를 지니면 두고 온 통발이 계속 돈다', () => {
    const trap = leaveTrapBehind();
    carry('automated_fish_trap');
    // 0 → 어획 성공, 그리고 미끼 절약 판정(0 < 0.5)에도 걸려 소모되지 않는다
    vi.spyOn(Math, 'random').mockReturnValue(0);
    FishingSystem.checkFishTrap();
    expect(trap._baitCharges).toBe(4);

    // 잡힌 물고기는 통발이 있는 바닥에 쌓인다 (플레이어 손으로 오지 않는다)
    const floor = GameState.locationFloors['hangang_gangnam'];
    const caught = floor.filter(id => {
      const defId = GameState.cards[id]?.definitionId;
      return defId === 'fish_small' || defId === 'fish_medium';
    });
    expect(caught).toHaveLength(1);
    expect(fishCount()).toBe(0);
  });

  it('절약 판정에 실패하면 미끼는 정상 소모된다', () => {
    const trap = leaveTrapBehind();
    carry('automated_fish_trap');
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    FishingSystem.checkFishTrap();
    expect(trap._baitCharges).toBe(3);
  });

  // locationFloors에는 현재 장소의 스냅샷이 남아 있어 board.middle과 겹친다.
  it('현재 바닥과 겹치는 스냅샷을 두 번 세지 않는다', () => {
    const trap = installTrap(4);
    GameState.locationFloors['hangang_gangnam'] = [...GameState.board.middle];
    carry('automated_fish_trap');
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    FishingSystem.checkFishTrap();
    expect(trap._baitCharges).toBe(3);
  });
});

describe('투망·명인의 루어 — 낚시 보정', () => {
  beforeEach(() => resetWorld());
  afterEach(() => vi.restoreAllMocks());

  function castWith(...toolIds) {
    carry('bait_worm');
    for (const id of toolIds) carry(id);
    // 0.1: 어획 성공 → 희귀 판정(0.1 < 0.15) → 루어 보유 시에만 대형어
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    FishingSystem.fish();
  }

  it('투망을 지니면 한 마리를 더 건진다', () => {
    castWith('fishing_net');
    expect(GameState.countOnBoard('fish_small') + GameState.countOnBoard('fish_medium'))
      .toBe(1 + B.netQtyBonus);
  });

  it('투망이 없으면 한 마리만 잡힌다', () => {
    castWith();
    expect(GameState.countOnBoard('fish_small') + GameState.countOnBoard('fish_medium'))
      .toBe(1);
  });

  it('루어를 지니면 희귀 대형어가 나온다', () => {
    castWith('master_angler_lure');
    expect(GameState.countOnBoard('fish_large')).toBe(1);
  });

  it('루어가 없으면 대형어가 나오지 않는다', () => {
    castWith();
    expect(GameState.countOnBoard('fish_large')).toBe(0);
  });
});
