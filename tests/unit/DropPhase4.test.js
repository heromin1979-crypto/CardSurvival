// === 드랍 개편 Phase 4 — 부패(perishability) + 도난(theft) ===
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import StatSystem from '../../js/systems/StatSystem.js';
import TheftSystem from '../../js/systems/TheftSystem.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: Array(20).fill(null), bottom: Array(20).fill(null) };
  GameState.pendingLoot = [];
  GameState.player = { ...(GameState.player ?? {}), isAlive: true, skills: {} };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.season = { current: 'spring' };
  GameState.location = { ...(GameState.location ?? {}), currentLandmark: null };
  GameState.flags = GameState.flags ?? {};
}
function place(defId, row = 'middle', slot = 0) {
  const inst = GameState.createCardInstance(defId);
  GameState.board[row][slot] = inst.instanceId;
  return inst;
}
function countOnMiddle(defId) {
  return GameState.board.middle.filter(Boolean)
    .map(id => GameState.cards[id]).filter(c => c?.definitionId === defId).length;
}

describe('부패 — _spoilPerishables (일 1회)', () => {
  beforeEach(resetWorld);

  it('일반 음식(cooked_meat)은 dayEnd마다 contamination이 오른다 (봄 food 5일 → +20)', () => {
    const inst = place('cooked_meat');
    expect(inst.contamination ?? 0).toBe(0);
    StatSystem._spoilPerishables();
    expect(inst.contamination).toBe(20);  // round(100/5)×1
    StatSystem._spoilPerishables();
    expect(inst.contamination).toBe(40);
  });

  it('보존품(preserved 태그, dried_meat)은 부패하지 않는다', () => {
    const inst = place('dried_meat');
    StatSystem._spoilPerishables();
    expect(inst.contamination ?? 0).toBe(0);
  });

  it('비음식(cloth)은 부패 대상이 아니다', () => {
    const inst = place('cloth');
    StatSystem._spoilPerishables();
    expect(inst.contamination ?? 0).toBe(0);
  });

  it('contamination은 100에서 멈춘다', () => {
    const inst = place('cooked_meat');
    for (let i = 0; i < 20; i++) StatSystem._spoilPerishables();
    expect(inst.contamination).toBe(100);
  });

  it('여름에는 부패가 더 빠르다 (×2 → +40)', () => {
    GameState.season = { current: 'summer' };
    const inst = place('cooked_meat');
    StatSystem._spoilPerishables();
    expect(inst.contamination).toBe(40);  // round(100/5)×2
  });
});

describe('도난 — TheftSystem', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it('바닥 음식이 도난되면 animal_nest(_stolenLoot)로 옮겨진다', () => {
    place('cooked_meat');
    vi.spyOn(Math, 'random').mockReturnValue(0);  // 항상 도난 발생
    TheftSystem.onDayEnd();
    expect(countOnMiddle('cooked_meat')).toBe(0);          // 음식 사라짐
    const nest = GameState.board.middle.filter(Boolean)
      .map(id => GameState.cards[id]).find(c => c?.definitionId === 'animal_nest');
    expect(nest).toBeDefined();
    expect(nest._stolenLoot[0].definitionId).toBe('cooked_meat');
  });

  it('recoverNest로 도난물을 되찾고 둥지가 사라진다', () => {
    place('cooked_meat');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    TheftSystem.onDayEnd();
    const nest = GameState.board.middle.filter(Boolean)
      .map(id => GameState.cards[id]).find(c => c?.definitionId === 'animal_nest');
    const r = TheftSystem.recoverNest(nest.instanceId);
    expect(r.success).toBe(true);
    expect(countOnMiddle('cooked_meat')).toBe(1);          // 회수됨
    expect(countOnMiddle('animal_nest')).toBe(0);          // 둥지 제거
  });

  it('베이스캠프에서는 도난이 일어나지 않는다', () => {
    GameState.location.currentLandmark = 'basecamp';
    place('cooked_meat');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    TheftSystem.onDayEnd();
    expect(countOnMiddle('cooked_meat')).toBe(1);
    expect(countOnMiddle('animal_nest')).toBe(0);
  });

  it('바닥에 음식이 없으면 no-op', () => {
    place('cloth');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    TheftSystem.onDayEnd();
    expect(countOnMiddle('animal_nest')).toBe(0);
  });
});
