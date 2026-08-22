// @vitest-environment happy-dom
// === 도살 도구 배선 + 덫 발동 연기 테스트 ===
// 1) 도살·분해 6개 청사진이 requiredTools: ['sharp_blade']를 걸어두는데, sharp_blade는
//    재료 아이템이라 칼을 들고 있어도 판정을 통과하지 못했다. 칼을 분해해 재료로
//    만들어야만 도살이 가능한 상태였다 — 날붙이 무기에 toolProvides를 선언해 푼다.
// 2) 바닥과 가방이 모두 차면 placeCardInRow가 null을 주는데 _spawnTarget이 이를 보지
//    않아, 잡힌 동물이 어느 행에도 없는 유령 인스턴스로 남고 미끼만 사라졌다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TrapSystem from '../../js/systems/TrapSystem.js';
import CraftSystem from '../../js/systems/CraftSystem.js';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import ITEMS from '../../js/data/items.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import { providesTool } from '../../js/systems/toolProvision.js';

const TRIGGER_TP = ITEMS.rat_trap.trapData.tpToTrigger;

TrapSystem.init();

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.locationFloors = {};
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, hp: { current: 80, max: 100 },
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 9999, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: {},
  };
  GameState.time = { day: 10, totalTP: 0, tpInDay: 0, hour: 12, isPaused: false };
  GameState.location = { currentDistrict: 'gangnam', currentLandmark: null, installedStructures: {} };
  GameState.weather = { id: 'sunny' };
  GameState.crafting = { activeQueue: [], maxQueueSize: 3 };
  GameState.flags = {};
  GameState.debug = {};
}

function put(definitionId, row = 'bottom') {
  const inst = GameState.createCardInstance(definitionId);
  const idx = GameState.board[row].indexOf(null);
  GameState.board[row][idx] = inst.instanceId;
  return inst;
}

const advance = n => { for (let i = 0; i < n; i++) EventBus.emit('tpAdvance', {}); };

// ─── 1. 도살 도구 ────────────────────────────────────────────

const SLAUGHTER_BPS = Object.values(BLUEPRINTS)
  .filter(bp => bp.requiredTools?.includes('sharp_blade'));

describe('도살·분해 청사진 전제', () => {
  it('sharp_blade를 요구하는 청사진이 존재한다', () => {
    expect(SLAUGHTER_BPS.length).toBeGreaterThan(0);
  });

  it('sharp_blade는 무기가 아니라 재료 아이템이다', () => {
    expect(ITEMS.sharp_blade.type).toBe('material');
  });
});

describe('날붙이 무기가 sharp_blade 역할을 대신한다', () => {
  // 새 날붙이를 추가하면서 toolProvides를 빠뜨리면 그 무기로만 도살이 안 되고
  // 경고도 없다. 규칙으로 묶어 누락을 막는다.
  const BLADED = Object.values(ITEMS).filter(d =>
    d.type === 'weapon' &&
    (d.weaponType === 'blade' || d.tags?.includes('blade') || d.tags?.includes('knife')));

  it('날붙이 무기가 빠짐없이 toolProvides를 선언한다', () => {
    const missing = BLADED
      .filter(d => !d.toolProvides?.includes('sharp_blade'))
      .map(d => d.id);
    expect(missing, `미선언: ${missing.join(', ')}`).toEqual([]);
  });

  // weaponType이 없는 전설 무기들은 위 규칙에 걸리지 않아 따로 고정한다.
  it.each(['royal_katana', 'frost_blade', 'electric_blade'])('%s도 도살에 쓸 수 있다', (id) => {
    expect(providesTool(id, 'sharp_blade')).toBe(true);
  });

  it('둔기·총기는 도살에 쓸 수 없다', () => {
    for (const id of ['baseball_bat', 'pistol', 'wooden_sword']) {
      if (!ITEMS[id]) continue;
      expect(providesTool(id, 'sharp_blade'), id).toBe(false);
    }
  });
});

describe('칼을 들고 도살 청사진을 연다', () => {
  beforeEach(resetWorld);

  it('칼이 없으면 도살을 시작할 수 없다', () => {
    put('live_rat');
    const r = CraftSystem.canStartBlueprint('slaughter_rat');
    expect(r.ok).toBe(false);
  });

  it('칼을 들고 있으면 도살을 시작할 수 있다', () => {
    put('live_rat');
    put('knife');
    expect(CraftSystem.canStartBlueprint('slaughter_rat').ok).toBe(true);
  });

  it('분해도 같은 칼로 열린다', () => {
    put('rat_carcass');
    put('combat_knife');
    expect(CraftSystem.canStartBlueprint('butcher_rat_carcass').ok).toBe(true);
  });

  // 예전처럼 재료 카드를 직접 들고 있어도 여전히 통과해야 한다.
  it('날카로운 날 재료 자체도 그대로 인정된다', () => {
    put('live_rat');
    put('sharp_blade');
    expect(CraftSystem.canStartBlueprint('slaughter_rat').ok).toBe(true);
  });
});

// ─── 2. 자리 없을 때 발동 연기 ───────────────────────────────

describe('보드가 꽉 차면 덫이 발동을 미룬다', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  /** 덫 1기만 남기고 바닥·가방을 전부 채운다 */
  function fillBoard() {
    for (const row of ['middle', 'bottom']) {
      let idx;
      while ((idx = GameState.board[row].indexOf(null)) !== -1) {
        const filler = GameState.createCardInstance('scrap_metal');
        GameState.board[row][idx] = filler.instanceId;
      }
    }
  }

  it('진행도와 미끼를 그대로 두고 동물을 만들지 않는다', () => {
    const trap = put('rat_trap');
    trap._baitCharges = 4;
    fillBoard();
    vi.spyOn(Math, 'random').mockReturnValue(0);   // 굴리면 반드시 성공

    advance(TRIGGER_TP + 5);

    expect(GameState.countOnBoard('live_rat')).toBe(0);
    expect(trap._baitCharges).toBe(4);
    expect(trap._trapProgress).toBe(TRIGGER_TP);
  });

  it('유령 인스턴스를 남기지 않는다', () => {
    const trap = put('rat_trap');
    trap._baitCharges = 4;
    fillBoard();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    advance(TRIGGER_TP + 5);

    const onBoard = new Set(Object.values(GameState.board).flat().filter(Boolean));
    const orphans = Object.keys(GameState.cards).filter(id => !onBoard.has(id));
    expect(orphans).toEqual([]);
  });

  it('자리가 생기면 다음 TP에 발동한다', () => {
    const trap = put('rat_trap');
    trap._baitCharges = 4;
    fillBoard();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    advance(TRIGGER_TP + 3);
    expect(GameState.countOnBoard('live_rat')).toBe(0);

    // 바닥 한 칸을 비운다
    const freed = GameState.board.middle[0];
    GameState.board.middle[0] = null;
    GameState.removeCardInstanceSilent?.(freed) ?? delete GameState.cards[freed];

    advance(1);
    expect(GameState.countOnBoard('live_rat')).toBe(1);
    expect(trap._baitCharges).toBe(3);
  });

  it('자리 없음을 알리되 매 TP 반복하지 않는다', () => {
    const trap = put('rat_trap');
    trap._baitCharges = 4;
    fillBoard();
    const seen = [];
    const off = EventBus.on('notify', p => seen.push(p));
    vi.spyOn(Math, 'random').mockReturnValue(0);

    advance(TRIGGER_TP + 6);

    const warns = seen.filter(p => p.type === 'warning');
    expect(warns.length).toBeGreaterThan(0);
    expect(warns.length).toBeLessThan(6);
    if (typeof off === 'function') off();
  });
});
