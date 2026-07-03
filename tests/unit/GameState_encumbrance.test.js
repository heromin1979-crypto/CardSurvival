import { describe, it, expect, beforeEach } from 'vitest';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';

// 데이터 밸런스 변경에 깨지지 않도록 무게 있는 아이템을 동적으로 선택한다.
const [itemId, itemDef] = Object.entries(GameData.items)
  .find(([, d]) => (d.weight ?? 0) > 0 && d.type !== 'npc' && d.type !== 'location');

function resetBoardAndCards() {
  GameState.cards = {};
  GameState.pendingLoot = [];
  GameState.locationFloors = {};
  for (const row of ['top', 'environment', 'middle', 'bottom']) {
    GameState.board[row] = GameState.board[row].map(() => null);
  }
  for (const slot of Object.keys(GameState.player.equipped)) {
    GameState.player.equipped[slot] = null;
  }
  GameState._updateEncumbrance();
}

describe('GameState._updateEncumbrance — 적재량은 소지분(휴대+장착)만 합산', () => {
  beforeEach(resetBoardAndCards);

  it('휴대(bottom) 카드는 합산된다', () => {
    const inst = GameState.createCardInstance(itemId);
    GameState.board.bottom[0] = inst.instanceId;
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBeCloseTo(itemDef.weight, 2);
  });

  it('장착(equipped) 카드는 합산된다', () => {
    const inst = GameState.createCardInstance(itemId);
    GameState.player.equipped.weapon_main = inst.instanceId;
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBeCloseTo(itemDef.weight, 2);
  });

  it('휴대 카드의 quantity가 무게에 반영된다', () => {
    const inst = GameState.createCardInstance(itemId, { quantity: 3 });
    GameState.board.bottom[0] = inst.instanceId;
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBeCloseTo(itemDef.weight * 3, 2);
  });

  it('바닥(middle) 카드는 합산되지 않는다', () => {
    const inst = GameState.createCardInstance(itemId);
    GameState.board.middle[0] = inst.instanceId;
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBe(0);
  });

  it('타지역 locationFloors에 잔존하는 인스턴스는 합산되지 않는다', () => {
    // 지역 이동 시 board.middle → locationFloors 스왑을 재현:
    // 카드 인스턴스는 cards에 남지만 어떤 행에도 배치되지 않은 상태
    const inst = GameState.createCardInstance(itemId);
    GameState.locationFloors['mapo'] = [inst.instanceId];
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.current).toBe(0);
  });

  it('바닥에 무거운 카드가 있어도 휴대가 비어 있으면 이동 차단 조건(weightPct>=2.0)에 걸리지 않는다', () => {
    // 적재 상한의 250%가 넘는 무게를 바닥에 배치해 차단 임계(200%)를 확실히 넘긴다
    const enc = GameState.player.encumbrance;
    const qty = Math.ceil((enc.max * 2.5) / itemDef.weight);
    const inst = GameState.createCardInstance(itemId, { quantity: qty });
    GameState.board.middle[0] = inst.instanceId;
    GameState._updateEncumbrance();
    expect(GameState.player.encumbrance.weightPct).toBeLessThan(2.0);
    expect(GameState.player.encumbrance.tier).toBe(0);
  });
});
