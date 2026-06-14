// === 드랍 개편 Phase 3 — 지역 탐사도(%) + 임계값 특수자원 + POI 해금 ===
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DISTRICTS } from '../../js/data/districts.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';

const TID = '__test_expl__';

function resetWorld() {
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: Array(20).fill(null), bottom: Array(20).fill(null) };
  GameState.pendingLoot = [];
  GameState.flags = { districtExploration: {} };
  GameState.player = { ...(GameState.player ?? {}), skills: {} };
  DISTRICTS[TID] = {
    id: TID, name: 'TEST', icon: '🧪', dangerLevel: 1, radiation: 0, adjacentDistricts: [],
    lootTable: [{ definitionId: 'cloth', weight: 1, minQty: 1, maxQty: 1 }],
    exploreIncrement: 5,
    explorationYields: [
      { at: 30, items: [{ definitionId: 'scrap_metal', qty: 2 }] },
      { at: 60, items: [{ definitionId: 'scrap_metal', qty: 2 }] },
      { at: 100, items: [{ definitionId: 'scrap_metal', qty: 1 }] },
    ],
  };
}
afterEach(() => { delete DISTRICTS[TID]; });

describe('ExploreSystem 탐사도 누적', () => {
  beforeEach(resetWorld);

  it('탐사할 때마다 exploreIncrement만큼 오르고 100%에서 멈춘다', () => {
    expect(ExploreSystem.getExploration(TID)).toBe(0);
    ExploreSystem._advanceExploration(TID);
    expect(ExploreSystem.getExploration(TID)).toBe(5);
    for (let i = 0; i < 100; i++) ExploreSystem._advanceExploration(TID);
    expect(ExploreSystem.getExploration(TID)).toBe(100);  // 캡
  });
});

describe('임계값 특수자원 — 고정 산출(확률 아님)', () => {
  beforeEach(resetWorld);

  it('28%→탐사(+5%)→33%로 30% 통과 시 정해진 수량(2) 1회 산출', () => {
    GameState.flags.districtExploration[TID] = 28;
    const before = GameState.board.middle.filter(Boolean).length;
    ExploreSystem._advanceExploration(TID);  // 28 → 33, 30% 통과
    expect(ExploreSystem.getExploration(TID)).toBe(33);
    const scrap = GameState.board.middle.filter(Boolean)
      .map(id => GameState.cards[id]).filter(c => c?.definitionId === 'scrap_metal');
    const total = scrap.reduce((s, c) => s + (c.quantity ?? 1), 0);
    expect(total).toBe(2);  // 30% 임계값 고정 수량
    expect(GameState.board.middle.filter(Boolean).length).toBe(before + scrap.length);
  });

  it('임계값을 지나지 않으면 산출 없음 (10%→15%)', () => {
    GameState.flags.districtExploration[TID] = 10;
    ExploreSystem._advanceExploration(TID);  // 10 → 15, 임계값 없음
    const scrap = GameState.board.middle.filter(Boolean)
      .map(id => GameState.cards[id]).filter(c => c?.definitionId === 'scrap_metal');
    expect(scrap.length).toBe(0);
  });

  it('100% 도달 후 추가 탐사해도 특수자원 안 나옴', () => {
    GameState.flags.districtExploration[TID] = 100;
    ExploreSystem._advanceExploration(TID);
    const scrap = GameState.board.middle.filter(Boolean)
      .map(id => GameState.cards[id]).filter(c => c?.definitionId === 'scrap_metal');
    expect(scrap.length).toBe(0);
  });

  it('한 번에 여러 임계값을 건너뛰면 통과한 임계값 모두 산출 (55%→105→100)', () => {
    GameState.flags.districtExploration[TID] = 55;
    DISTRICTS[TID].exploreIncrement = 50;  // 55 → 100 (60·100 동시 통과)
    ExploreSystem._advanceExploration(TID);
    const total = GameState.board.middle.filter(Boolean)
      .map(id => GameState.cards[id]).filter(c => c?.definitionId === 'scrap_metal')
      .reduce((s, c) => s + (c.quantity ?? 1), 0);
    expect(total).toBe(3);  // 60%(2) + 100%(1)
  });
});

describe('POI 해금 — explorationThreshold 조건', () => {
  beforeEach(resetWorld);

  it('탐사도가 임계값 미만이면 POI 미해금, 이상이면 해금 가능', () => {
    const loc = { district: TID, unlockConditions: { explorationThreshold: 45 } };
    GameState.flags.districtExploration[TID] = 30;
    expect(HiddenElementSystem._meetsLocationConditions(loc)).toBe(false);
    GameState.flags.districtExploration[TID] = 50;
    expect(HiddenElementSystem._meetsLocationConditions(loc)).toBe(true);
  });
});
