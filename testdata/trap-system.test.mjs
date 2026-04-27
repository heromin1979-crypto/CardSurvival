// === TrapSystem 단위 테스트 ===
// trap 도구가 같은 행에 bait가 있을 때 tpToTrigger TP 후 successRate로 발동.
// CST 패턴 적응: bait 있을 때만 진행, bait 없으면 진행 보류.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { ebMock, gsMock, gdMock, i18nMock } = vi.hoisted(() => ({
  ebMock: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    once: vi.fn(),
  },
  gsMock: {
    board: {
      top:         [null, null, null, null, null, null, null, null, null, null],
      environment: [null, null, null],
      middle:      [null, null, null, null, null, null, null, null, null, null],
      bottom:      [null, null, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null],
    },
    cards: {},
    _nextId: 1,
    getBoardCards: vi.fn(),
    createCardInstance: vi.fn(),
    placeCardInRow: vi.fn(),
    removeCardInstance: vi.fn(),
  },
  gdMock: { items: {} },
  i18nMock: { t: vi.fn((k, p) => p ? `${k}:${JSON.stringify(p)}` : k) },
}));

vi.mock('../js/core/EventBus.js', () => ({ default: ebMock }));
vi.mock('../js/core/GameState.js', () => ({ default: gsMock }));
vi.mock('../js/data/GameData.js', () => ({ default: gdMock }));
vi.mock('../js/core/I18n.js', () => ({ default: i18nMock }));

import TrapSystem from '../js/systems/TrapSystem.js';

function setupBoard({ trap, bait, baitRow = 'middle' }) {
  // 보드 슬롯 초기화
  for (const row of ['top', 'environment', 'middle', 'bottom']) {
    gsMock.board[row] = gsMock.board[row].map(() => null);
  }
  gsMock.cards = {};

  if (trap) {
    gsMock.cards[trap.instanceId] = trap;
    gsMock.board.middle[0] = trap.instanceId;
  }
  if (bait) {
    gsMock.cards[bait.instanceId] = bait;
    gsMock.board[baitRow][1] = bait.instanceId;
  }

  gsMock.getBoardCards.mockImplementation(() => {
    const out = [];
    for (const row of ['top', 'environment', 'middle', 'bottom']) {
      for (const id of gsMock.board[row]) {
        if (id && gsMock.cards[id]) out.push(gsMock.cards[id]);
      }
    }
    return out;
  });
}

const TRAP_DEF = {
  id: 'rat_trap', name: '쥐덫', subtype: 'trap',
  trapData: { targetCard: 'live_rat', baitTags: ['food', 'grain'], tpToTrigger: 3, successRate: 1.0 },
};
const BAIT_DEF = { id: 'rice', name: '쌀', tags: ['food', 'grain'] };
const TARGET_DEF = { id: 'live_rat', name: '산 쥐' };

describe('TrapSystem', () => {
  beforeEach(() => {
    TrapSystem._progress = {};
    vi.clearAllMocks();
    gdMock.items = {
      rat_trap: TRAP_DEF,
      rice: BAIT_DEF,
      live_rat: TARGET_DEF,
    };
    gsMock.createCardInstance.mockImplementation((defId, opts) => ({
      instanceId: `inst_${gsMock._nextId++}`,
      definitionId: defId,
      quantity: opts?.quantity ?? 1,
    }));
    gsMock.placeCardInRow.mockImplementation((id) => ({ instanceId: id }));
  });

  it('init은 tpAdvance 이벤트를 청취한다', () => {
    TrapSystem.init();
    expect(ebMock.on).toHaveBeenCalledWith('tpAdvance', expect.any(Function));
  });

  it('bait 없으면 진행도 누적 안 함', () => {
    const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
    setupBoard({ trap, bait: null });

    TrapSystem._onTP();

    expect(TrapSystem._progress.t1).toBeUndefined();
  });

  it('bait 있으면 매 TP마다 진행도 +1', () => {
    const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
    const bait = { instanceId: 'b1', definitionId: 'rice', quantity: 5 };
    setupBoard({ trap, bait });

    TrapSystem._onTP();
    expect(TrapSystem._progress.t1).toBe(1);

    TrapSystem._onTP();
    expect(TrapSystem._progress.t1).toBe(2);
  });

  it('tpToTrigger 도달 시 발동: 산 동물 spawn + bait 1개 소모 + 진행도 리셋', () => {
    const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
    const bait = { instanceId: 'b1', definitionId: 'rice', quantity: 5 };
    setupBoard({ trap, bait });

    // tpToTrigger=3, successRate=1.0 → 3번째 TP에 확정 발동
    TrapSystem._onTP();
    TrapSystem._onTP();
    TrapSystem._onTP();

    expect(TrapSystem._progress.t1).toBe(0);
    expect(bait.quantity).toBe(4); // 5 → 4
    expect(gsMock.createCardInstance).toHaveBeenCalledWith('live_rat', { quantity: 1 });
    expect(ebMock.emit).toHaveBeenCalledWith('trapTriggered', expect.objectContaining({
      trapId: 't1', targetCard: 'live_rat',
    }));
  });

  it('bait quantity 1일 때 발동하면 카드 자체 제거', () => {
    const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
    const bait = { instanceId: 'b1', definitionId: 'rice', quantity: 1 };
    setupBoard({ trap, bait });

    for (let i = 0; i < 3; i++) TrapSystem._onTP();

    expect(gsMock.removeCardInstance).toHaveBeenCalledWith('b1');
  });

  it('successRate 0 → 발동해도 산 동물 spawn 안 함, trapMissed emit', () => {
    const trapDef = {
      ...TRAP_DEF,
      trapData: { ...TRAP_DEF.trapData, successRate: 0.0 },
    };
    gdMock.items.rat_trap = trapDef;

    const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
    const bait = { instanceId: 'b1', definitionId: 'rice', quantity: 5 };
    setupBoard({ trap, bait });

    for (let i = 0; i < 3; i++) TrapSystem._onTP();

    expect(gsMock.createCardInstance).not.toHaveBeenCalled();
    expect(bait.quantity).toBe(4); // bait는 여전히 소모됨 (시도 비용)
    expect(ebMock.emit).toHaveBeenCalledWith('trapMissed', expect.objectContaining({
      trapId: 't1',
    }));
  });

  it('subtype: trap이 아닌 카드는 처리 안 함', () => {
    const notTrap = {
      instanceId: 'n1', definitionId: 'flashlight', quantity: 1,
    };
    gdMock.items.flashlight = { id: 'flashlight', subtype: 'utility' };
    setupBoard({ trap: notTrap, bait: null });

    TrapSystem._onTP();

    expect(TrapSystem._progress.n1).toBeUndefined();
  });

  it('baitTags 매칭 안 되면 bait 인식 안 함', () => {
    const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
    const wrongBait = { instanceId: 'b1', definitionId: 'rope', quantity: 5 };
    gdMock.items.rope = { id: 'rope', name: '로프', tags: ['material'] };
    setupBoard({ trap, bait: wrongBait });

    TrapSystem._onTP();

    expect(TrapSystem._progress.t1).toBeUndefined();
  });

  // 트랙 H — UI 시각화 지원
  describe('트랙 H — getProgress + trapStateChange', () => {
    it('getProgress는 진행도 0 또는 누적값 반환', () => {
      expect(TrapSystem.getProgress('unknown')).toBe(0);

      TrapSystem._progress.t1 = 5;
      expect(TrapSystem.getProgress('t1')).toBe(5);
    });

    it('bait 있으면 trapStateChange emit (hasBait: true + progress)', () => {
      const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
      const bait = { instanceId: 'b1', definitionId: 'rice', quantity: 5 };
      setupBoard({ trap, bait });

      TrapSystem._onTP();

      const stateCall = ebMock.emit.mock.calls.find(c => c[0] === 'trapStateChange');
      expect(stateCall).toBeDefined();
      expect(stateCall[1]).toEqual(expect.objectContaining({
        trapId: 't1',
        progress: 1,
        tpToTrigger: 3,
        hasBait: true,
      }));
    });

    it('bait 없어도 trapStateChange emit (hasBait: false)', () => {
      const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
      setupBoard({ trap, bait: null });

      TrapSystem._onTP();

      const stateCall = ebMock.emit.mock.calls.find(c => c[0] === 'trapStateChange');
      expect(stateCall).toBeDefined();
      expect(stateCall[1]).toEqual(expect.objectContaining({
        trapId: 't1',
        progress: 0,
        hasBait: false,
      }));
    });

    it('발동 후 trapStateChange는 progress: 0 + hasBait: false', () => {
      const trap = { instanceId: 't1', definitionId: 'rat_trap', quantity: 1 };
      const bait = { instanceId: 'b1', definitionId: 'rice', quantity: 5 };
      setupBoard({ trap, bait });

      // tpToTrigger=3, successRate=1.0 → 3번째에 발동
      TrapSystem._onTP();
      TrapSystem._onTP();
      ebMock.emit.mockClear();
      TrapSystem._onTP();

      const finalState = ebMock.emit.mock.calls.find(c => c[0] === 'trapStateChange');
      expect(finalState).toBeDefined();
      expect(finalState[1]).toEqual(expect.objectContaining({
        trapId: 't1',
        progress: 0,
        hasBait: false,
      }));
    });
  });
});
