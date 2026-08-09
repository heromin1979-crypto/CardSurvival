// @vitest-environment happy-dom
// === 덫 설명 ↔ 실제 미끼 판정 일치 테스트 ===
// 비둘기 올가미 설명은 "곡물 미끼 필요"였지만 '곡물 미끼'라는 아이템은 없고,
// TrapSystem._findBait는 baitTags를 OR로 본다(baitTags.some(...)). 'food' 하나만
// 맞아도 통과하므로 통조림·김치까지 전부 미끼가 된다. 설명이 실제보다 훨씬 좁아
// 플레이어가 쓸 수 없는 아이템을 찾게 만들었다.
//
// 미끼를 덫에 드래그하는 게 아니라 같은 행에 놓아두면 되는 것도 올가미 설명에는
// 빠져 있었다.
import { describe, it, expect } from 'vitest';
import TrapSystem from '../../js/systems/TrapSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const TRAPS = Object.values(ITEMS).filter(d => d.trapData);

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player = { ...(GameState.player ?? {}), isAlive: true, equipped: {}, structureDurabilityBonus: 1.0 };
}

/** middle 행에 카드를 놓고 인스턴스를 반환 */
function place(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

describe('덫 데이터 전제', () => {
  it('trapData를 가진 덫이 존재한다', () => {
    expect(TRAPS.length).toBeGreaterThan(0);
  });

  it('모든 덫이 baitTags를 선언한다', () => {
    for (const d of TRAPS) expect(d.trapData.baitTags?.length).toBeGreaterThan(0);
  });
});

describe('덫 설명이 실제 판정과 어긋나지 않는다', () => {
  // baitTags에 'food'가 있으면 아무 음식이나 통과한다. 설명이 곡물·고기로
  // 한정하는 것처럼 읽히면 안 된다.
  it.each(TRAPS.map(d => [d.name, d.id]))('%s 설명이 미끼를 좁게 한정하지 않는다', (_name, id) => {
    const d = ITEMS[id];
    if (!d.trapData.baitTags.includes('food')) return;
    expect(d.description).not.toMatch(/곡물 미끼|고기 미끼/);
  });

  it.each(TRAPS.map(d => [d.name, d.id]))('%s 설명이 배치 방식(같은 행)을 알려준다', (_name, id) => {
    expect(ITEMS[id].description).toContain('같은 행');
  });

  it.each(TRAPS.map(d => [d.name, d.id]))('%s 설명이 미끼로 음식을 지목한다', (_name, id) => {
    const d = ITEMS[id];
    if (!d.trapData.baitTags.includes('food')) return;
    expect(d.description).toContain('음식');
  });
});

describe('_findBait — 실제 판정 (설명이 맞는지 코드로 확인)', () => {
  it('같은 행의 일반 음식이 미끼로 인정된다', () => {
    resetWorld();
    const trap = place('pigeon_snare');
    place('canned_food');   // 곡물이 아닌 평범한 음식
    const row = TrapSystem._findRow(trap.instanceId);
    expect(TrapSystem._findBait(row, ITEMS.pigeon_snare.trapData.baitTags)).toBeTruthy();
  });

  it('쌀도 미끼로 인정된다', () => {
    resetWorld();
    const trap = place('pigeon_snare');
    place('rice');
    const row = TrapSystem._findRow(trap.instanceId);
    expect(TrapSystem._findBait(row, ITEMS.pigeon_snare.trapData.baitTags)).toBeTruthy();
  });

  it('음식이 없으면 미끼로 인정되지 않는다', () => {
    resetWorld();
    const trap = place('pigeon_snare');
    place('scrap_metal');
    const row = TrapSystem._findRow(trap.instanceId);
    expect(TrapSystem._findBait(row, ITEMS.pigeon_snare.trapData.baitTags)).toBeNull();
  });

  it('다른 행의 음식은 미끼로 잡히지 않는다', () => {
    resetWorld();
    const trap = place('pigeon_snare');
    const food = GameState.createCardInstance('canned_food');
    GameState.board.bottom[0] = food.instanceId;   // 배낭에 있는 음식
    const row = TrapSystem._findRow(trap.instanceId);
    expect(TrapSystem._findBait(row, ITEMS.pigeon_snare.trapData.baitTags)).toBeNull();
  });
});
