import { beforeEach, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import SlotResolver from '../../js/board/SlotResolver.js';

function place(id, qty = 1, extra = {}) {
  const c = GameState.createCardInstance(id, { quantity: qty, ...extra });
  const slot = GameState.board.bottom.indexOf(null);
  GameState.board.bottom[slot] = c.instanceId;
  return c;
}
function total(id) {
  return GameState.countOnBoard(id) + GameState.pendingLoot.filter(x => x.definitionId === id).reduce((n, x) => n + x.quantity, 0);
}
beforeEach(() => {
  EventBus._listeners = {};
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: Array(10).fill(null), bottom: Array(10).fill(null) };
  GameState.pendingLoot = [];
});

it('천조각 두 스택에서 각각1개만 소비하여 붕대1개를 만든다', () => {
  const a = place('cloth_scrap', 2), b = place('cloth_scrap', 20, { contamination: 17 });
  expect(SlotResolver.resolveInteraction(a.instanceId, b.instanceId)).toBe(true);
  expect(total('cloth_scrap')).toBe(20);
  expect(total('bandage')).toBe(1);
  expect(GameState.cards[b.instanceId].contamination).toBe(17);
});
it.each([false, true])('정방향/역방향 조리는 쌀 한 개만 바꾼다: %s', reverse => {
  const rice = place('rice', 12), fire = place('campfire', 1, { durability: 20 });
  SlotResolver.resolveInteraction(reverse ? fire.instanceId : rice.instanceId, reverse ? rice.instanceId : fire.instanceId);
  expect(total('rice')).toBe(11);
  expect(total('cooked_rice')).toBe(1);
  expect(GameState.cards[fire.instanceId].definitionId).toBe('campfire');
});
it('가득 찬 보드는 변환 결과를 대기시키고 원료19개를 보존한다', () => {
  GameState.board.middle = [];
  GameState.board.bottom = Array(2).fill(null);
  const rice = place('rice', 20), fire = place('campfire');
  SlotResolver.resolveInteraction(rice.instanceId, fire.instanceId);
  expect(total('rice')).toBe(19);
  expect(total('cooked_rice')).toBe(1);
  expect(GameState.pendingLoot).toContainEqual(expect.objectContaining({ definitionId: 'cooked_rice', quantity: 1 }));
  const saved = GameState.serialize();
  GameState.deserialize(saved);
  expect(total('rice')).toBe(19);
  expect(total('cooked_rice')).toBe(1);
});
it('마지막 한 개 변환은 원래 카드 자리를 유지한다', () => {
  const rice = place('rice'), fire = place('campfire');
  SlotResolver.resolveInteraction(rice.instanceId, fire.instanceId);
  expect(GameState.cards[rice.instanceId].definitionId).toBe('cooked_rice');
  expect(total('rice')).toBe(0);
  expect(total('cooked_rice')).toBe(1);
});
it('꺼진 불은 원료와 수량을 바꾸지 않는다', () => {
  const rice = place('rice', 12), fire = place('campfire', 1, { durability: 0 });
  SlotResolver.resolveInteraction(rice.instanceId, fire.instanceId);
  expect(total('rice')).toBe(12);
  expect(total('cooked_rice')).toBe(0);
});
it('자기 자신을 두 재료처럼 사용하지 못한다', () => {
  const cloth = place('cloth_scrap', 2);
  expect(SlotResolver.resolveInteraction(cloth.instanceId, cloth.instanceId)).toBe(false);
  expect(total('cloth_scrap')).toBe(2);
  expect(total('bandage')).toBe(0);
});
it('젖은 천 한 개만 건조하고 모닥불 내구2를 소비한다', () => {
  const cloth = place('wet_cloth', 4), fire = place('campfire', 1, { durability: 20 });
  SlotResolver.resolveInteraction(cloth.instanceId, fire.instanceId);
  expect(total('wet_cloth')).toBe(3);
  expect(total('cloth')).toBe(1);
  expect(GameState.cards[fire.instanceId].durability).toBe(18);
});
it('양동이 단일 용기의 변환과 수위별 산출은 유지한다', () => {
  const bucket = place('water_bucket', 1, { _fillLevel: 2 }), fire = place('campfire');
  SlotResolver.resolveInteraction(bucket.instanceId, fire.instanceId);
  expect(GameState.cards[bucket.instanceId].definitionId).toBe('empty_bucket');
  expect(total('boiled_water')).toBe(2);
});
it('결과 배치 이벤트에서 재료 소비가 끝난 상태만 보인다', () => {
  const a = place('cloth_scrap', 2), b = place('cloth_scrap', 20);
  const seen = [];
  EventBus.on('cardPlaced', () => seen.push([total('cloth_scrap'), total('bandage')]));
  SlotResolver.resolveInteraction(a.instanceId, b.instanceId);
  expect(seen).toEqual([[20, 1]]);
});

const multiOutputs = [
  ['wood', 'campfire', 'charcoal', 2],
  ['cloth', 'knife', 'cloth_scrap', 3],
  ['tree_log', 'hand_axe', 'wood', 3],
  ['scrap_metal', 'pipe_wrench', 'nail', 5],
  ['tree_log', 'knife', 'wood', 2],
  ['tree_log', 'campfire', 'charcoal', 4],
  ['rope', 'knife', 'thread', 3],
  ['empty_bottle', 'campfire', 'glass_shard', 2],
  ['leather', 'knife', 'thread', 2],
];
for (const [material, tool, output, count] of multiOutputs) {
  for (const qty of [1, 20]) {
    it.each([false, true])(`${material} ${qty}개 중1개→${output} ${count}개, 역방향 %s`, reverse => {
      const input = place(material, qty), implement = place(tool, 1, { durability: 100 });
      SlotResolver.resolveInteraction(reverse ? implement.instanceId : input.instanceId, reverse ? input.instanceId : implement.instanceId);
      expect(total(material)).toBe(qty - 1);
      expect(total(output)).toBe(count);
    });
  }
}
it('배수 산출의 일부가 기존 스택에 합쳐져도 남은 수량만 대기한다', () => {
  GameState.board.middle = [];
  GameState.board.bottom = Array(3).fill(null);
  const input = place('cloth', 20), knife = place('knife');
  const max = GameState.getCardDef(place('cloth_scrap').instanceId).maxStack;
  const scraps = GameState.getBoardCards().find(c => c.definitionId === 'cloth_scrap');
  scraps.quantity = max - 1;
  SlotResolver.resolveInteraction(knife.instanceId, input.instanceId);
  expect(total('cloth')).toBe(19);
  expect(total('cloth_scrap')).toBe(max + 2);
  expect(GameState.pendingLoot).toContainEqual(expect.objectContaining({ definitionId: 'cloth_scrap', quantity: 2 }));
});
