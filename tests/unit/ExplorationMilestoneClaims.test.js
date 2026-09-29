import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import { DISTRICTS } from '../../js/data/districts.js';
import EventBus from '../../js/core/EventBus.js';

describe('탐사 보상 청구', () => {
  beforeEach(() => { GameState.flags = createDefaultFlags(); vi.spyOn(ExploreSystem, '_placeLoot').mockImplementation(() => {}); });
  afterEach(() => vi.restoreAllMocks());
  it.each([[25, 30, 1], [55, 65, 1], [95, 100, 1], [25, 100, 3]])('%s→%s 구간만 청구한다', (prev, next, count) => {
    GameState.flags.districtExploration = { gangnam: prev };
    ExploreSystem._advanceExploration('gangnam', next - prev);
    expect(GameState.flags.explorationSupply.claims).toHaveLength(count);
    expect(GameState.flags.districtExploration.gangnam).toBe(next);
  });
  it('수량은 고정이며 100%에서 재청구하지 않는다', () => {
    GameState.flags.districtExploration = { gangnam: 95 };
    ExploreSystem._advanceExploration('gangnam');
    const loot = ExploreSystem._placeLoot.mock.calls[0][0];
    expect(loot[0].quantity).toBe(DISTRICTS.gangnam.explorationYields[2].items[0].qty);
    ExploreSystem._advanceExploration('gangnam');
    expect(ExploreSystem._placeLoot).toHaveBeenCalledTimes(1);
  });
  it('발견과 물품 청구는 같은 보상에서 한 번 발생하고 저장된다', () => {
    const discovered = vi.fn();
    const off = EventBus.on('supplyDiscovered', discovered);
    GameState.flags.districtExploration = { guro: 95 };
    ExploreSystem._advanceExploration('guro');
    const save = GameState.serialize();
    GameState.flags = createDefaultFlags();
    GameState.deserialize(save);
    ExploreSystem._advanceExploration('guro');
    off();
    expect(discovered).toHaveBeenCalledTimes(1);
    expect(GameState.flags.explorationSupply.discoveries).toEqual(['guro_parts']);
    expect(GameState.flags.explorationSupply.claims).toEqual(['guro:milestone_100:1']);
    expect(ExploreSystem._placeLoot).toHaveBeenCalledTimes(1);
  });
  it('만차 보상은 저장·재개 후에도 pendingLoot에 그대로 남는다', () => {
    vi.restoreAllMocks();
    GameState.cards = {};
    GameState.board = { top: Array(10).fill(null), environment: Array(10).fill(null), middle: Array(27).fill(null), bottom: Array(20).fill(null) };
    GameState.player.middlePage3Unlocked = true;
    GameState.player.extraSlots = 0;
    GameState.pendingLoot = [];
    for (let i = 0; i < 47; i++) {
      const card = GameState.createCardInstance('knife');
      GameState.placeCardInRow(card.instanceId, 'middle');
    }
    GameState.flags.districtExploration = { guro: 95 };
    ExploreSystem._advanceExploration('guro');
    const queue = structuredClone(GameState.pendingLoot);
    expect(queue.length).toBeGreaterThan(0);
    GameState.deserialize(GameState.serialize());
    ExploreSystem._advanceExploration('guro');
    expect(GameState.pendingLoot).toEqual(queue);
  });
});
