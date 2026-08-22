// @vitest-environment happy-dom
// === 덫 진행도 영속화 테스트 ===
// TrapSystem._progress가 메모리 전용 맵이라 세이브/로드마다 진행도가 0으로 돌아갔다.
// 쥐덫(8TP)을 7TP까지 채워두고 저장했다 불러오면 다음 1TP에 발동해야 한다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TrapSystem from '../../js/systems/TrapSystem.js';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import ITEMS from '../../js/data/items.js';

const TRIGGER_TP = ITEMS.rat_trap.trapData.tpToTrigger;

// init은 tpAdvance 구독을 등록한다. beforeEach마다 부르면 핸들러가 쌓여
// 1TP에 진행도가 여러 칸 오른다 — 파일당 한 번만 등록한다.
TrapSystem.init();

function resetWorld() {
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
    skills: {},
  };
  GameState.time = { day: 10, totalTP: 0, tpInDay: 0, hour: 12, isPaused: false };
  GameState.location = { currentDistrict: 'gangnam', currentLandmark: null, installedStructures: {} };
  GameState.weather = { id: 'sunny' };
  GameState.flags = {};
  GameState.debug = {};
}

/** 미끼를 채운 덫을 휴대 행에 놓는다 (미끼는 덫 인스턴스가 들고 있다) */
function setupTrap(charges = ITEMS.rat_trap.trapData.baitCapacity) {
  const trap = GameState.createCardInstance('rat_trap');
  trap._baitCharges = charges;
  GameState.board.bottom[0] = trap.instanceId;
  return { trap };
}

const advance = n => { for (let i = 0; i < n; i++) EventBus.emit('tpAdvance', {}); };

describe('덫 데이터 전제', () => {
  it('쥐덫은 미끼로 food 태그를 받는다', () => {
    expect(ITEMS.rat_trap.trapData.baitTags).toContain('food');
    expect(ITEMS.canned_food.tags).toContain('food');
  });

  // 발동 1회에 충전 1이 닳으므로, 발동선까지 도달할 충전이 있어야 시나리오가 성립한다.
  it('쥐덫 미끼 용량이 1회 이상이다', () => {
    expect(ITEMS.rat_trap.trapData.baitCapacity).toBeGreaterThan(0);
  });
});

describe('덫 진행도 누적', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it('진행도를 카드 인스턴스에 기록한다', () => {
    const { trap } = setupTrap();
    advance(3);
    expect(trap._trapProgress).toBe(3);
    expect(TrapSystem.getProgress(trap.instanceId)).toBe(3);
  });

  it('발동 시 진행도가 0으로 돌아간다', () => {
    const { trap } = setupTrap();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);   // 포획 실패
    advance(TRIGGER_TP);
    expect(trap._trapProgress).toBe(0);
  });
});

describe('덫 진행도 영속화', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  // 진행도가 모듈 메모리에만 있으면 세이브 payload에 실리지 않아 다음 세션에서 0이 된다.
  // GameState.serialize가 cards를 통째로 담으므로 인스턴스 필드인지가 곧 영속성이다.
  it('저장 payload가 진행도를 담는다', () => {
    const { trap } = setupTrap();
    advance(TRIGGER_TP - 1);

    const saved = JSON.parse(GameState.serialize());
    expect(saved.cards[trap.instanceId]._trapProgress).toBe(TRIGGER_TP - 1);
  });

  it('불러온 상태에서 남은 1TP에 발동한다', () => {
    const { trap } = setupTrap();
    advance(TRIGGER_TP - 1);
    const saved = GameState.serialize();

    resetWorld();
    GameState.deserialize(saved);
    expect(TrapSystem.getProgress(trap.instanceId)).toBe(TRIGGER_TP - 1);

    vi.spyOn(Math, 'random').mockReturnValue(0);      // 포획 성공
    advance(1);
    expect(GameState.countOnBoard('live_rat')).toBe(1);
  });
});
