// @vitest-environment happy-dom
// === 낚싯대 3단계 티어 테스트 ===
// fishing_rod_advanced가 fishing_rod_improved와 한글명이 같은 '개량 낚싯대'였고,
// 어획 보너스는 improved에만 하드코딩돼 상위 티어가 성능·내구도 전면 열등이었다.
// 또한 낚싯대 판정이 subtype==='fishing'이라 게 통발·투망·루어까지 낚싯대로 집혔다.
import { describe, it, expect, beforeEach } from 'vitest';
import FishingSystem, { isFishingRod } from '../../js/systems/FishingSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';
import BALANCE from '../../js/data/gameBalance.js';

const B = BALANCE.fishing;
const RODS = ['fishing_rod', 'fishing_rod_improved', 'fishing_rod_advanced'];
const TIERED_RODS = RODS;
const NOT_RODS = ['fish_trap', 'automated_fish_trap', 'fishing_net', 'crab_trap', 'master_angler_lure'];

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
    isAlive: true, equipped: {}, hp: { current: 80, max: 100 },
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: { fishing: { xp: 0, level: 1 } },
  };
  GameState.time = { day: 10, totalTP: 0, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'gangnam', currentLandmark: 'hangang_gangnam', installedStructures: {} };
  GameState.weather = { id: 'sunny' };
  GameState.flags = {};
  GameState.debug = {};
}

function carry(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board.bottom[GameState.board.bottom.indexOf(null)] = inst.instanceId;
  return inst;
}

describe('낚싯대 데이터 — 이름·수치 티어', () => {
  it('낚싯대들의 한글명이 서로 다르다', () => {
    const names = RODS.map(id => ITEMS[id].name);
    expect(new Set(names).size).toBe(RODS.length);
  });

  it('상위 티어일수록 내구도가 높다', () => {
    expect(ITEMS.fishing_rod_improved.defaultDurability)
      .toBeGreaterThan(ITEMS.fishing_rod.defaultDurability);
    expect(ITEMS.fishing_rod_advanced.defaultDurability)
      .toBeGreaterThan(ITEMS.fishing_rod_improved.defaultDurability);
  });

  it('낚싯대 전부 rod 태그를 가진다', () => {
    for (const id of RODS) expect(ITEMS[id].tags).toContain('rod');
  });

  it('접미사 없는 낚싯대도 설명대로 낚시에 쓸 수 있다', () => {
    expect(ITEMS.fishing_rod.description).toContain('물고기를 잡을 수 있다');
    expect(isFishingRod(ITEMS.fishing_rod)).toBe(true);
  });

  it('기본 낚싯대(fishing_rod_basic)는 제거되어 낚싯대로 통일됐다', () => {
    expect(ITEMS.fishing_rod_basic).toBeUndefined();
  });

  it('이름이 낚싯대 → 고급 → 전설 순으로 붙는다', () => {
    expect(ITEMS.fishing_rod.name).toBe('낚싯대');
    expect(ITEMS.fishing_rod_improved.name).toBe('고급 낚싯대');
    expect(ITEMS.fishing_rod_advanced.name).toBe('전설 낚싯대');
  });

  it('전설 낚싯대는 등급도 legendary다', () => {
    expect(ITEMS.fishing_rod_advanced.rarity).toBe('legendary');
  });

  it('낚시 도구지만 낚싯대가 아닌 것에는 rod 태그가 없다', () => {
    for (const id of NOT_RODS) expect(ITEMS[id].tags ?? []).not.toContain('rod');
  });
});

describe('isFishingRod — 판정 범위', () => {
  it('낚싯대는 전부 낚싯대로 인정된다', () => {
    for (const id of RODS) expect(isFishingRod(ITEMS[id])).toBe(true);
  });

  it('통발·투망·게 통발·루어는 낚싯대가 아니다', () => {
    for (const id of NOT_RODS) expect(isFishingRod(ITEMS[id])).toBe(false);
  });
});

describe('어획 보너스 — 티어별 상승', () => {
  it('1티어 낚싯대는 보너스가 없다', () => {
    expect(FishingSystem.getRodBonus('fishing_rod')).toBe(0);
  });

  it('개량은 밸런스 상수만큼 준다', () => {
    expect(FishingSystem.getRodBonus('fishing_rod_improved')).toBe(B.rodImprovedBonus);
  });

  it('강화는 개량보다 높다', () => {
    expect(FishingSystem.getRodBonus('fishing_rod_advanced')).toBe(B.rodAdvancedBonus);
    expect(B.rodAdvancedBonus).toBeGreaterThan(B.rodImprovedBonus);
  });

  it('낚싯대가 없으면 0이다', () => {
    expect(FishingSystem.getRodBonus(null)).toBe(0);
  });

  it('티어가 오를수록 보너스가 커진다', () => {
    const vals = TIERED_RODS.map(id => FishingSystem.getRodBonus(id));
    expect(vals).toEqual([...vals].sort((a, b) => a - b));
    expect(new Set(vals).size).toBe(TIERED_RODS.length);
  });
});

describe('getRodId — 보유 낚싯대 탐색', () => {
  beforeEach(resetWorld);

  it('아무것도 없으면 null이다', () => {
    expect(FishingSystem.getRodId()).toBeNull();
  });

  it('강화 낚싯대를 인식한다', () => {
    carry('fishing_rod_advanced');
    expect(FishingSystem.getRodId()).toBe('fishing_rod_advanced');
  });

  it('게 통발만 있으면 낚싯대로 치지 않는다', () => {
    carry('crab_trap');
    expect(FishingSystem.getRodId()).toBeNull();
  });

  it('투망·루어도 낚싯대로 치지 않는다', () => {
    carry('fishing_net');
    carry('master_angler_lure');
    expect(FishingSystem.getRodId()).toBeNull();
  });

  it('낚시 도구가 섞여 있어도 낚싯대만 고른다', () => {
    carry('crab_trap');
    carry('fishing_rod_improved');
    expect(FishingSystem.getRodId()).toBe('fishing_rod_improved');
  });

  it('낚싯대를 인식한다', () => {
    carry('fishing_rod');
    expect(FishingSystem.getRodId()).toBe('fishing_rod');
  });

  // 여러 자루를 들고 다닐 때 먼저 찾은 것을 쓰면 즉석 낚싯대(0%)가 강화(25%)를
  // 밀어낸다. 항상 가장 좋은 낚싯대를 쓴다.
  it('여러 낚싯대를 가지면 보너스가 가장 높은 것을 쓴다', () => {
    carry('fishing_rod');
    carry('fishing_rod_advanced');
    expect(FishingSystem.getRodId()).toBe('fishing_rod_advanced');
  });

  it('배치 순서가 반대여도 결과가 같다', () => {
    carry('fishing_rod_advanced');
    carry('fishing_rod');
    expect(FishingSystem.getRodId()).toBe('fishing_rod_advanced');
  });
});
