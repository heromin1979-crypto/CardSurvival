import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import SeoulMapModal from '../../js/ui/SeoulMapModal.js';
import { DISTRICTS } from '../../js/data/districts.js';
import { PROGRESSION_SUPPLIES, milestoneClaimKey } from '../../js/data/progressionSupplies.js';

const total = id => Object.values(GameState.cards).filter(card => card.definitionId === id).reduce((sum, card) => sum + card.quantity, 0) + GameState.pendingLoot.filter(item => item.definitionId === id).reduce((sum, item) => sum + item.quantity, 0);
const add = (id, quantity) => { const card = GameState.createCardInstance(id, { quantity }); GameState.placeCardInRow(card.instanceId, 'bottom'); };
function reset() {
  GameState.flags = createDefaultFlags(); GameState.flags.districtExploration = {};
  GameState.cards = {};
  GameState.board = { top: Array(10).fill(null), environment: Array(10).fill(null), middle: Array(27).fill(null), bottom: Array(20).fill(null) };
  GameState.pendingLoot = [];
  GameState.time.totalTP = 0; GameState.time.day = 1;
  GameState.ui.currentState = 'main';
  GameState.location.currentLandmark = null;
  GameState.player.isAlive = true; GameState.player.hp.current = 100;
  GameState.stats.stamina.current = 100;
  GameState.player.encumbrance.weightPct = 0;
  GameState.player.middlePage3Unlocked = true; GameState.player.extraSlots = 0;
}
describe('25구 보상과 반복 공급', () => {
  beforeEach(reset);
  afterEach(() => vi.restoreAllMocks());
  it.each(Object.keys(DISTRICTS))('%s 탐사 완료 발견 뒤 공급 실행·소진·재입고', districtId => {
    const reward = DISTRICTS[districtId].explorationYields.find(reward => reward.at === 100);
    const source = PROGRESSION_SUPPLIES[reward.discovery];
    GameState.location.currentDistrict = districtId;
    expect(ExploreSystem.getSupplyStatus(reward.discovery).ok).toBe(false);
    GameState.flags.districtExploration[districtId] = 95;
    ExploreSystem._advanceExploration(districtId);
    expect(GameState.flags.explorationSupply.discoveries).toContain(reward.discovery);
    for (const cost of source.costs ?? []) add(cost.definitionId, cost.qty * (source.capacity + 1));
    const before = source.items.map(item => total(item.definitionId));
    expect(ExploreSystem.useSupply(reward.discovery).ok).toBe(true);
    source.items.forEach((item, i) => expect(total(item.definitionId)).toBe(before[i] + item.qty));
    for (let i = 1; i < source.capacity; i++) expect(ExploreSystem.useSupply(reward.discovery).ok).toBe(true);
    expect(ExploreSystem.getSupplyStatus(reward.discovery).reason).toBe('재입고 대기');
    GameState.time.totalTP = GameState.flags.explorationSupply.stocks[reward.discovery].refillAt;
    expect(ExploreSystem.useSupply(reward.discovery).ok).toBe(true);
  });
  it.each(['gangbuk_herbs', 'gwanak_research', 'dobong_mountain', 'dongjak_garden'])('%s 겨울 채집은 재고·시간·카드를 소비하지 않는다', id => {
    const source = PROGRESSION_SUPPLIES[id];
    GameState.location.currentDistrict = source.districtId;
    GameState.flags.explorationSupply.discoveries.push(id);
    GameState.time.day = 271;
    const before = GameState.serialize();
    expect(ExploreSystem.useSupply(id).reason).toMatch(/겨울/);
    expect(GameState.serialize()).toBe(before);
  });
  it.each(['yongsan', 'seongdong', 'eunpyeong'])('%s 발전 연료는 탐사 완료 전 겨울에도 교환·재입고', district => {
    GameState.location.currentDistrict = district;
    GameState.time.day = 271; add('scrap_metal', 12);
    for (let i = 0; i < 2; i++) expect(ExploreSystem.useSupply(district + '_fuel').ok).toBe(true);
    expect(total('fuel_can')).toBe(2);
    GameState.time.totalTP = 72;
    expect(ExploreSystem.useSupply(district + '_fuel').ok).toBe(true);
    expect(total('fuel_can')).toBe(3); expect(total('scrap_metal')).toBe(0);
  });
  it.each([false, true])('공급 상태 존재=%s 25구탐사 완료 이전은 물품을 소급하지 않는다', existing => {
    GameState.flags.districtExploration = Object.fromEntries(Object.keys(DISTRICTS).map(id => [id, 100]));
    add('rotor_blade', 4);
    GameState.pendingLoot = [{ definitionId: 'generator_core', quantity: 2 }];
    if (existing) {
      GameState.flags.explorationSupply.claims = ['gangnam:milestone_30:1'];
      GameState.flags.explorationSupply.discoveries = ['guro_parts'];
      GameState.flags.explorationSupply.surveyed = ['known-room'];
      GameState.flags.explorationSupply.stocks = { guro_parts: { remaining: 1, refillAt: 100 } };
    } else delete GameState.flags.explorationSupply;
    const cards = JSON.stringify(GameState.cards), pending = JSON.stringify(GameState.pendingLoot);
    GameState.deserialize(GameState.serialize());
    const state = structuredClone(GameState.flags.explorationSupply);
    expect(state.discoveries).toHaveLength(25);
    expect(state.claims).toHaveLength(existing ? 1 : 75);
    if (existing) { expect(state.stocks.guro_parts).toEqual({ remaining: 1, refillAt: 100 }); expect(state.surveyed).toEqual(['known-room']); }
    const spy = vi.spyOn(ExploreSystem, '_placeLoot');
    for (const id of Object.keys(DISTRICTS)) ExploreSystem._advanceExploration(id);
    expect(spy).not.toHaveBeenCalled();
    expect(JSON.stringify(GameState.cards)).toBe(cards); expect(JSON.stringify(GameState.pendingLoot)).toBe(pending);
    GameState.deserialize(GameState.serialize());
    expect(GameState.flags.explorationSupply).toEqual(state);
  });
  it('30%% 청구 뒤 새 표 로드도 재지급하지 않고 다음 구간만 제공한다', () => {
    GameState.flags.districtExploration = { gangnam: 30, dongjak: 95 };
    GameState.flags.explorationSupply.claims = ['gangnam:milestone_30:1'];
    GameState.deserialize(GameState.serialize());
    expect(GameState.flags.explorationSupply.discoveries).toEqual([]);
    const spy = vi.spyOn(ExploreSystem, '_placeLoot');
    ExploreSystem._advanceExploration('gangnam', 25);
    expect(spy).not.toHaveBeenCalled();
    ExploreSystem._advanceExploration('gangnam', 5);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(GameState.flags.explorationSupply.claims).toEqual(['gangnam:milestone_30:1', 'gangnam:milestone_60:1']);
  });
  it('75개 청구 키는 버전1·원래 임계값이며 지도는 완료 보상을 재약속하지 않는다', () => {
    for (const [id, district] of Object.entries(DISTRICTS)) {
      expect(district.explorationYields.map(r => milestoneClaimKey(id,r))).toEqual([30,60,100].map(at => `${id}:milestone_${at}:1`));
      const hint = SeoulMapModal._buildProgressionHint(id);
      expect(hint).toContain('다음 30%'); expect(hint).toContain('용도:'); expect(hint).toContain('100% 공급 단서');
      GameState.flags.districtExploration[id] = 100;
      expect(SeoulMapModal._buildProgressionHint(id)).toContain('반복 지급되지 않습니다');
      expect(SeoulMapModal._buildProgressionHint(id)).not.toContain('다음 100%');
    }
  });
});

