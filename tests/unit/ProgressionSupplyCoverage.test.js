import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import GameData from '../../js/data/GameData.js';
import EventBus from '../../js/core/EventBus.js';
import { DISTRICTS } from '../../js/data/districts.js';
import { LANDMARK_DATA } from '../../js/data/landmarks.js';
import { PROGRESSION_SUPPLIES, migrateExplorationSupply } from '../../js/data/progressionSupplies.js';
import { validateProgressionSupplies } from '../../js/data/validateProgressionSupplies.js';
import CHARACTERS from '../../js/data/characters.js';
import BLUEPRINTS from '../../js/data/blueprints.js';

function reset() {
  GameState.flags = createDefaultFlags();
  GameState.cards = {};
  GameState.board = { top: Array(10).fill(null), environment: Array(10).fill(null), middle: Array(27).fill(null), bottom: Array(20).fill(null) };
  GameState.pendingLoot = [];
  GameState.time.totalTP = 0;
  GameState.time.day = 1;
  GameState.ui.currentState = 'main';
  GameState.location.currentDistrict = 'junggoo';
  GameState.location.currentLandmark = null;
  GameState.player.isAlive = true;
  GameState.player.hp.current = 100;
  GameState.stats.stamina.current = 100;
  GameState.player.encumbrance.weightPct = 0;
  GameState.player.middlePage3Unlocked = true;
  GameState.player.extraSlots = 0;
}
function add(id, quantity) {
  const card = GameState.createCardInstance(id, { quantity });
  GameState.placeCardInRow(card.instanceId, 'bottom');
  return card;
}
function total(id) { return Object.values(GameState.cards).filter(c => c.definitionId === id).reduce((sum, c) => sum + c.quantity, 0); }

describe('공급처 실행과 저장', () => {
  beforeEach(reset);
  afterEach(() => vi.restoreAllMocks());
  it('물품 부족이면 시간·재고·카드가 변하지 않는다', () => {
    add('scrap_metal', 1);
    const before = GameState.serialize();
    expect(ExploreSystem.useSupply('market_salt').ok).toBe(false);
    expect(GameState.serialize()).toBe(before);
  });
  it.each(['dead', 'hp', 'district', 'combat', 'locked'])('%s 조건 실패도 무소비다', condition => {
    add('scrap_metal', 10);
    if (condition === 'dead') GameState.player.isAlive = false;
    if (condition === 'hp') GameState.player.hp.current = 0;
    if (condition === 'district') GameState.location.currentDistrict = 'guro';
    if (condition === 'combat') GameState.ui.currentState = 'combat';
    const before = GameState.serialize();
    expect(ExploreSystem.useSupply(condition === 'locked' ? 'junggu_market' : 'market_salt').ok).toBe(false);
    expect(GameState.serialize()).toBe(before);
  });
  it('교환은 비용과 재고를 한 번 소비하고 저장 후 이어진다', () => {
    add('scrap_metal', 6);
    expect(ExploreSystem.useSupply('market_salt').ok).toBe(true);
    expect(total('scrap_metal')).toBe(4);
    expect(total('salt')).toBe(2);
    expect(GameState.pendingLoot).toEqual([]);
    expect(GameState.time.totalTP).toBe(1);
    const saved = GameState.serialize();
    GameState.flags = createDefaultFlags();
    GameState.deserialize(saved);
    expect(ExploreSystem.getSupplyStatus('market_salt').stock.remaining).toBe(2);
  });
  it('재입고 전에는 소진되고 주기 후 재생된다', () => {
    add('scrap_metal', 12);
    for (let i = 0; i < 3; i++) expect(ExploreSystem.useSupply('market_salt').ok).toBe(true);
    expect(ExploreSystem.useSupply('market_salt').ok).toBe(false);
    GameState.time.totalTP = 72;
    expect(ExploreSystem.useSupply('market_salt').ok).toBe(true);
    expect(total('salt')).toBe(8);
  });
  it('유한 회수는 시간이 지나도 재생하지 않는다', () => {
    GameState.location.currentDistrict = 'guro';
    for (let i = 0; i < 3; i++) expect(ExploreSystem.useSupply('guro_recovery').ok).toBe(true);
    GameState.time.totalTP = 9999;
    expect(ExploreSystem.useSupply('guro_recovery').ok).toBe(false);
  });
  it('만차에서도 보상이 pendingLoot에 전량 남는다', () => {
    GameState.location.currentDistrict = 'gangdong';
    for (let i = 0; i < 47; i++) add('knife', 1);
    GameState.player.encumbrance.weightPct = 0;
    expect(ExploreSystem.useSupply('garden_materials').ok).toBe(true);
    expect(GameState.pendingLoot).toHaveLength(2);
    expect(GameState.pendingLoot).toEqual(expect.arrayContaining([
      expect.objectContaining({ definitionId: 'soil_bag', quantity: 3 }),
      expect.objectContaining({ definitionId: 'vegetable_seed', quantity: 2 }),
    ]));
  });
  it('만차에서 기존 스택에 일부 합산되면 남은 수량만 대기한다', () => {
    const max = GameData.items.salt.maxStack;
    add('salt', max - 1);
    for (let i = 0; i < 46; i++) add('knife', 1);
    ExploreSystem._placeLoot([{ definitionId: 'salt', quantity: 3 }]);
    expect(total('salt')).toBe(max);
    expect(GameState.pendingLoot).toEqual([expect.objectContaining({ definitionId: 'salt', quantity: 2 })]);
  });
  it('겨울에도 보존식 교환이 가능하다', () => {
    GameState.time.day = 271;
    add('scrap_metal', 3);
    expect(ExploreSystem.useSupply('market_food').ok).toBe(true);
    expect(total('canned_food')).toBe(1);
  });
  it('cardPlaced 구독자에게 비용·재고·전체 산출이 확정된 상태만 보인다', () => {
    GameState.location.currentDistrict = 'gangdong';
    const snapshots = [];
    const off = EventBus.on('cardPlaced', () => snapshots.push([total('soil_bag'), total('vegetable_seed'), GameState.flags.explorationSupply.stocks.garden_materials.remaining]));
    ExploreSystem.useSupply('garden_materials');
    off();
    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots.every(row => row.join(',') === '3,2,1')).toBe(true);
  });
});

describe('공급 데이터와 이전 정책', () => {
  beforeEach(reset);
  afterEach(() => vi.restoreAllMocks());
  it('전체 데이터 참조가 유효하다', () => {
    expect(validateProgressionSupplies(DISTRICTS, LANDMARK_DATA, PROGRESSION_SUPPLIES, GameData.items)).toEqual([]);
  });
  it('네 공급 축은 100% 전에 사용할 경로를 가진다', () => {
    const early = Object.values(PROGRESSION_SUPPLIES).filter(source => !source.discoveryRequired).flatMap(source => source.items.map(item => item.definitionId));
    for (const id of ['circuit_board', 'salt', 'water_filter', 'soil_bag', 'vegetable_seed']) expect(early).toContain(id);
    const chef = CHARACTERS.find(character => character.id === 'chef');
    expect(chef.abilities.flatMap(ability => ability.effect?.startingItems ?? []).filter(id => id === 'salt')).toHaveLength(3);
    expect(BLUEPRINTS.assemble_water_filter.output).toEqual([{ definitionId: 'water_filter', qty: 1 }]);
  });
  it('잘못된 버전·수량·발견 ID를 오류로 반환한다', () => {
    const districts = { ...DISTRICTS, gangnam: { explorationYields: [{ at: 100, items: [{ definitionId: 'cloth', qty: 0 }], discovery: 'missing' }] } };
    const errors = validateProgressionSupplies(districts, LANDMARK_DATA, PROGRESSION_SUPPLIES, GameData.items);
    expect(errors.some(e => e.includes('청구 버전'))).toBe(true);
    expect(errors.some(e => e.includes('고정 수량'))).toBe(true);
    expect(errors.some(e => e.includes('discovery'))).toBe(true);
  });
  it('구세이브 100%는 기존 보상 청구와 접근권만 복구한다', () => {
    const old = JSON.parse(GameState.serialize());
    delete old.flags.explorationSupply;
    old.flags.districtExploration = { guro: 100 };
    old.location.subLocationsLooted = ['lm_guro:guro_parts_store'];
    GameState.deserialize(JSON.stringify(old));
    expect(GameState.flags.explorationSupply.claims).toHaveLength(3);
    expect(GameState.flags.explorationSupply.discoveries).toContain('guro_parts');
    expect(GameState.flags.explorationSupply.surveyed).toContain('guro_parts_store');
    expect(total('circuit_board')).toBe(0);
    ExploreSystem._completeSubLocationSurvey('guro_parts_store', 'guro');
    expect(GameState.flags.districtExploration.guro).toBe(100);
  });
  it('신규게임에는 이전 청구·발견 이력이 없다', () => {
    const old = migrateExplorationSupply({ districtExploration: { guro: 100 } }, {}, DISTRICTS);
    expect(old.claims.length).toBe(3);
    expect(createDefaultFlags().explorationSupply).toEqual({ version: 1, claims: [], discoveries: [], surveyed: [], stocks: {} });
  });
  it('세부장소 조사는 구 키 표기와 무관하게 최초 완료만 증가한다', () => {
    ExploreSystem._completeSubLocationSurvey('guro_parts_store', 'guro');
    ExploreSystem._completeSubLocationSurvey('guro_parts_store', 'guro');
    expect(GameState.flags.districtExploration.guro).toBe(5);
  });
  it('전투로 중단된 세부장소는 기여하지 않고 완료 후에만 증가한다', () => {
    GameState.location.currentDistrict = 'guro';
    GameState.location.currentLandmark = 'lm_guro';
    GameState.location.currentSubLocation = null;
    GameState.location.subLocationsLooted = [];
    GameState.locationFloors = {};
    GameState.subLocationStock = {};
    vi.spyOn(ExploreSystem, '_checkNight').mockReturnValue(true);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    ExploreSystem.enterSubLocation('lm_guro', 'guro_parts_store');
    expect(GameState.ui.currentState).toBe('encounter');
    expect(GameState.flags.explorationSupply.surveyed).toEqual([]);
    expect(GameState.flags.districtExploration?.guro ?? 0).toBe(0);
    GameState.location.currentSubLocation = null;
    GameState.ui.currentState = 'main';
    Math.random.mockReturnValue(0.999);
    ExploreSystem.enterSubLocation('lm_guro', 'guro_parts_store');
    expect(GameState.flags.districtExploration.guro).toBe(5);
    expect(total('circuit_board')).toBe(2);
    GameState.location.currentSubLocation = null;
    ExploreSystem.enterSubLocation('guro', 'guro_parts_store');
    expect(GameState.flags.districtExploration.guro).toBe(5);
    expect(total('circuit_board')).toBe(2);
  });
  it('로비는 유한/재생/교환을 각각 적용한다', () => {
    for (let i = 0; i < 20; i++) ExploreSystem._generateLandmarkLoot('lm_guro');
    expect(ExploreSystem._generateLandmarkLoot('guro')).toEqual([]);
    expect(ExploreSystem._generateLandmarkLoot('junggoo')).toEqual([]);
    const natural = Object.keys(LANDMARK_DATA).find(key => LANDMARK_DATA[key].supplyPolicy?.type === 'renewable');
    expect(natural).toBeTruthy();
    for (let i = 0; i < 10; i++) ExploreSystem._generateLandmarkLoot(natural);
    expect(ExploreSystem._generateLandmarkLoot(natural)).toEqual([]);
    GameState.time.totalTP = 72;
    expect(ExploreSystem._generateLandmarkLoot(natural).length).toBeGreaterThan(0);
    expect(ExploreSystem._generateLandmarkLoot('lm_boramae_hospital').length).toBeGreaterThan(0);
  });
});
