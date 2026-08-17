// === 채집 액션 ===
// 마른 풀 뭉치를 카드에서 직접 채집해 미끼를 얻는다. 확정 수량을 주던 미끼 청사진 2개를
// 대체하는 경로라, 한 번에 하나씩 확률로 나오고 3회를 쓰면 카드가 사라진다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GatherSystem from '../../js/systems/GatherSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const GRASS = 'grass_1';

// 실제 보드는 빈 칸이 null로 채워져 있다 — findEmptySlot이 null만 빈 칸으로 본다
const emptyRow = (n, ...filled) => [...filled, ...Array(n - filled.length).fill(null)];

function placeGrass(extra = {}) {
  GameState.cards = {
    [GRASS]: { instanceId: GRASS, definitionId: 'dry_grass', durability: 100, ...extra },
  };
  GameState.board = {
    top: emptyRow(10),
    environment: emptyRow(10),
    middle: emptyRow(10),
    bottom: emptyRow(10, GRASS),
  };
  return GameState.cards[GRASS];
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: emptyRow(10), environment: emptyRow(10), middle: emptyRow(10), bottom: emptyRow(10),
  };
});

describe('채집 데이터 선언', () => {
  it('마른 풀 뭉치가 채집 규칙을 선언한다', () => {
    const f = ITEMS.dry_grass.gather;
    expect(f).toBeTruthy();
    expect(f.uses).toBe(3);
    expect(f.tpCost).toBe(1);
  });

  it('산출물은 지렁이 미끼 60 / 곤충 미끼 40 비중이다', () => {
    const y = ITEMS.dry_grass.gather.yields;
    expect(y).toEqual([
      { definitionId: 'bait_worm', qty: 1, weight: 60 },
      { definitionId: 'bait_insect', qty: 1, weight: 40 },
    ]);
  });

  it('산출물이 실제 아이템으로 존재한다', () => {
    for (const y of ITEMS.dry_grass.gather.yields) {
      expect(ITEMS[y.definitionId], `${y.definitionId} 없음`).toBeTruthy();
    }
  });
});

describe('채집 가능 판정', () => {
  it('채집 규칙이 있는 카드는 채집할 수 있다', () => {
    placeGrass();
    expect(GatherSystem.canGather(GRASS).ok).toBe(true);
  });

  it('채집 규칙이 없는 카드는 채집할 수 없다', () => {
    GameState.cards = { x: { instanceId: 'x', definitionId: 'scrap_metal' } };
    expect(GatherSystem.canGather('x').ok).toBe(false);
  });

  it('남은 횟수가 0이면 채집할 수 없다', () => {
    placeGrass({ _gatherUses: 0 });
    expect(GatherSystem.canGather(GRASS).ok).toBe(false);
  });

  it('남은 횟수를 보고할 수 있다', () => {
    placeGrass();
    expect(GatherSystem.remainingUses(GRASS)).toBe(3);
    placeGrass({ _gatherUses: 1 });
    expect(GatherSystem.remainingUses(GRASS)).toBe(1);
  });
});

describe('채집 실행', () => {
  it('굴림이 낮으면 지렁이 미끼가 나온다', () => {
    placeGrass();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);   // 0~59 구간
    const r = GatherSystem.gather(GRASS);
    vi.restoreAllMocks();

    expect(r.ok).toBe(true);
    expect(r.definitionId).toBe('bait_worm');
  });

  it('굴림이 높으면 곤충 미끼가 나온다', () => {
    placeGrass();
    vi.spyOn(Math, 'random').mockReturnValue(0.9);   // 60~99 구간
    const r = GatherSystem.gather(GRASS);
    vi.restoreAllMocks();

    expect(r.definitionId).toBe('bait_insect');
  });

  it('채집한 미끼가 실제 카드로 보드에 생긴다', () => {
    placeGrass();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    GatherSystem.gather(GRASS);
    vi.restoreAllMocks();

    const baits = Object.values(GameState.cards).filter(c => c.definitionId === 'bait_worm');
    expect(baits.length).toBe(1);
  });

  it('채집할 때마다 남은 횟수가 준다', () => {
    const grass = placeGrass();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    GatherSystem.gather(GRASS);
    expect(grass._gatherUses).toBe(2);
    GatherSystem.gather(GRASS);
    expect(grass._gatherUses).toBe(1);
    vi.restoreAllMocks();
  });

  it('3회를 다 쓰면 마른 풀 카드가 사라진다', () => {
    placeGrass();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    GatherSystem.gather(GRASS);
    GatherSystem.gather(GRASS);
    GatherSystem.gather(GRASS);
    vi.restoreAllMocks();

    expect(GameState.cards[GRASS]).toBeUndefined();
  });

  it('소진된 카드는 더 채집되지 않는다', () => {
    placeGrass({ _gatherUses: 0 });
    expect(GatherSystem.gather(GRASS).ok).toBe(false);
  });
});

describe('가방이 꽉 찼을 때', () => {
  it('놓을 자리가 없으면 채집을 막고 TP를 쓰지 않는다', () => {
    const grass = placeGrass();
    // 휴대 행을 가득 채워 놓을 자리를 없앤다
    vi.spyOn(GameState, 'findEmptySlot').mockReturnValue(-1);

    const r = GatherSystem.gather(GRASS);

    expect(r.ok).toBe(false);
    expect(grass._gatherUses ?? 3).toBe(3);   // 횟수가 줄지 않는다
    vi.restoreAllMocks();
  });
});
