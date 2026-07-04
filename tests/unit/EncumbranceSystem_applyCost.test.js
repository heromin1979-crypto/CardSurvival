import { describe, it, expect, beforeEach } from 'vitest';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';
import EncumbranceSystem from '../../js/systems/EncumbranceSystem.js';

// 무게 구간을 정밀하게 맞출 수 있도록 1kg 이하의 가벼운 아이템을 선택한다.
const [itemId, itemDef] = Object.entries(GameData.items)
  .find(([, d]) => (d.weight ?? 0) > 0 && d.weight <= 1 && d.type !== 'npc' && d.type !== 'location');

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

/** 목표 무게 비율(targetPct)에 맞춰 휴대칸에 카드를 배치하고 재계산한다 */
function carryToPct(targetPct) {
  const enc = GameState.player.encumbrance;
  const qty = Math.ceil((enc.max * targetPct) / itemDef.weight);
  const inst = GameState.createCardInstance(itemId, { quantity: qty });
  GameState.board.bottom[0] = inst.instanceId;
  GameState._updateEncumbrance();
}

describe('EncumbranceSystem.applyCost — 과적(>100%) 시에만 이동·탐색 TP 배율 적용', () => {
  beforeEach(resetBoardAndCards);

  it('빈 몸(0%)은 배율 없음', () => {
    expect(GameState.player.encumbrance.tpMult).toBe(1.0);
    expect(EncumbranceSystem.applyCost(1)).toBe(1);
    expect(EncumbranceSystem.applyCost(3)).toBe(3);
  });

  it('중간 무게(50~75%)도 배율 없음 — ceil로 인한 1TP→2TP 점프 방지', () => {
    carryToPct(0.6);
    const enc = GameState.player.encumbrance;
    expect(enc.weightPct).toBeGreaterThan(0.5);
    expect(enc.weightPct).toBeLessThanOrEqual(0.75);
    expect(enc.tpMult).toBe(1.0);
    expect(EncumbranceSystem.applyCost(1)).toBe(1);
  });

  it('적재 한계 직전(75~100%)도 배율 없음', () => {
    carryToPct(0.9);
    const enc = GameState.player.encumbrance;
    expect(enc.weightPct).toBeGreaterThan(0.75);
    expect(enc.weightPct).toBeLessThanOrEqual(1.0);
    expect(enc.tpMult).toBe(1.0);
    expect(EncumbranceSystem.applyCost(2)).toBe(2);
  });

  it('과적(100~200%)은 TP ×1.2 (정수 올림)', () => {
    carryToPct(1.5);
    const enc = GameState.player.encumbrance;
    expect(enc.weightPct).toBeGreaterThan(1.0);
    expect(enc.weightPct).toBeLessThanOrEqual(2.0);
    expect(enc.tpMult).toBe(1.2);
    expect(EncumbranceSystem.applyCost(1)).toBe(2); // ceil(1.2)
    expect(EncumbranceSystem.applyCost(3)).toBe(4); // ceil(3.6)
    expect(EncumbranceSystem.applyCost(5)).toBe(6); // ceil(6.0)
  });

  it('심각한 과적(>200%)도 TP ×1.2', () => {
    carryToPct(2.5);
    const enc = GameState.player.encumbrance;
    expect(enc.weightPct).toBeGreaterThan(2.0);
    expect(enc.tpMult).toBe(1.2);
    expect(EncumbranceSystem.applyCost(1)).toBe(2);
  });
});
