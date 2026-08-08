// @vitest-environment happy-dom
// === 잔해 휴대 금지 테스트 ===
// 잔해(subtype:'salvage')는 분해 전용 노드다. 15~30kg짜리 구조물이 배낭에 들어가는 것이
// 어색하고 적재량을 통째로 잡아먹어 휴대(bottom) 진입을 막는다. 바닥(middle) 안에서의
// 이동은 그대로 허용한다. 스왑은 대상 카드를 드래그 원본 자리로 밀어내므로,
// 휴대 카드를 잔해 위로 떨어뜨리는 우회로도 함께 막아야 한다.
import { describe, it, expect, beforeEach } from 'vitest';
import SlotResolver, { isUncarriable } from '../../js/board/SlotResolver.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

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
    isAlive: true,
    equipped: {},
    skills: {},
    hp: { current: 80, max: 100 },
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.flags = {};
  GameState.debug = {};
}

function place(definitionId, row, slot) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board[row][slot] = inst.instanceId;
  return inst;
}

const rowOf = (id) => ['top', 'environment', 'middle', 'bottom']
  .find(r => GameState.board[r].includes(id)) ?? null;

describe('잔해 데이터 전제 — 분해 전용 노드', () => {
  const salvage = Object.values(ITEMS).filter(d => d.type === 'structure' && d.subtype === 'salvage');

  it('salvage 구조물이 존재한다', () => {
    expect(salvage.length).toBeGreaterThan(0);
  });

  it('전부 분해 외의 용도가 없다', () => {
    const withOtherUse = salvage.filter(d =>
      d.onUse || d.onConsume || d.onWear || d.onTick || d.equipSlot || d.toolProvides || d.forage || d.harvest);
    expect(withOtherUse.map(d => d.id)).toEqual([]);
  });

  it('전부 분해 테이블을 가진다', () => {
    expect(salvage.filter(d => !d.dismantle?.length).map(d => d.id)).toEqual([]);
  });
});

describe('isUncarriable — 판정 범위', () => {
  it('잔해 구조물은 휴대 불가다', () => {
    expect(isUncarriable(ITEMS.destroyed_kiosk)).toBe(true);
    expect(isUncarriable(ITEMS.wrecked_bus)).toBe(true);
  });

  it('분해 산출물(재료)은 휴대할 수 있다', () => {
    expect(isUncarriable(ITEMS.glass_shard)).toBe(false);
    expect(isUncarriable(ITEMS.scrap_metal)).toBe(false);
  });

  it('salvage가 아닌 구조물은 이 규칙 대상이 아니다', () => {
    expect(isUncarriable(ITEMS.campfire)).toBe(false);
    expect(isUncarriable(ITEMS.weed_patch)).toBe(false);
  });
});

describe('validateDrop — 휴대 칸 진입 차단', () => {
  beforeEach(resetWorld);

  it('잔해는 휴대(bottom)로 옮길 수 없다', () => {
    const inst = place('destroyed_kiosk', 'middle', 0);
    const result = SlotResolver.validateDrop(inst.instanceId, 'bottom', 0);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('바닥(middle) 안에서의 이동은 그대로 허용한다', () => {
    const inst = place('destroyed_kiosk', 'middle', 0);
    expect(SlotResolver.validateDrop(inst.instanceId, 'middle', 3).valid).toBe(true);
  });

  it('일반 아이템의 휴대는 막지 않는다', () => {
    const inst = place('scrap_metal', 'middle', 0);
    expect(SlotResolver.validateDrop(inst.instanceId, 'bottom', 0).valid).toBe(true);
  });
});

describe('executeDrop — 스왑 우회로 차단', () => {
  beforeEach(resetWorld);

  it('휴대 카드를 잔해 위로 떨어뜨려도 잔해가 배낭으로 밀려나지 않는다', () => {
    const wreck = place('destroyed_kiosk', 'middle', 0);
    const carried = place('scrap_metal', 'bottom', 0);

    expect(SlotResolver.executeDrop(carried.instanceId, 'middle', 0)).toBe(false);
    expect(rowOf(wreck.instanceId)).toBe('middle');
    expect(rowOf(carried.instanceId)).toBe('bottom');
  });

  it('바닥 카드끼리의 스왑은 정상 동작한다', () => {
    const wreck = place('destroyed_kiosk', 'middle', 0);
    const other = place('scrap_metal', 'middle', 1);

    expect(SlotResolver.executeDrop(other.instanceId, 'middle', 0)).toBe(true);
    expect(rowOf(wreck.instanceId)).toBe('middle');
    expect(rowOf(other.instanceId)).toBe('middle');
  });

  it('잔해를 직접 휴대 칸으로 끌면 실패하고 자리를 지킨다', () => {
    const wreck = place('destroyed_kiosk', 'middle', 0);
    expect(SlotResolver.executeDrop(wreck.instanceId, 'bottom', 0)).toBe(false);
    expect(rowOf(wreck.instanceId)).toBe('middle');
  });
});
