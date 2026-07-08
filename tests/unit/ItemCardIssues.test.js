import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import ITEMS from '../../js/data/items.js';
import GameState from '../../js/core/GameState.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import StatSystem from '../../js/systems/StatSystem.js';
import CardFactory from '../../js/ui/CardFactory.js';
import EquipmentModal from '../../js/ui/EquipmentModal.js';
import { formatCardEffectEntries } from '../../js/systems/ItemEffectSystem.js';
import { findInteraction } from '../../js/data/interactions.js';

const saved = {};

function snapshotGameState() {
  saved.cards = GameState.cards;
  saved.board = GameState.board;
  saved.stats = GameState.stats;
  saved.player = GameState.player;
  saved.pendingLoot = GameState.pendingLoot;
  saved.time = GameState.time;
  saved.combat = GameState.combat;
}

function restoreGameState() {
  GameState.cards = saved.cards;
  GameState.board = saved.board;
  GameState.stats = saved.stats;
  GameState.player = saved.player;
  GameState.pendingLoot = saved.pendingLoot;
  GameState.time = saved.time;
  GameState.combat = saved.combat;
}

function resetForConsume(definitionId) {
  GameState.cards = {
    test_card: {
      instanceId: 'test_card',
      definitionId,
      quantity: 1,
      durability: 100,
      contamination: 0,
    },
  };
  GameState.board = {
    top: [],
    environment: [],
    middle: [],
    bottom: ['test_card'],
  };
  GameState.pendingLoot = [];
  GameState.stats = {
    hydration: { current: 0, max: 300, decayPerTP: 0 },
    nutrition: { current: 0, max: 300, decayPerTP: 0 },
    temperature: { current: 40, max: 100, decayPerTP: 0 },
    morale: { current: 0, max: 100, decayPerTP: 0 },
    radiation: { current: 0, max: 100, decayPerTP: 0 },
    infection: { current: 0, max: 100, decayPerTP: 0 },
    fatigue: { current: 50, max: 100, decayPerTP: 0 },
    stamina: { current: 0, max: 100, decayPerTP: 0 },
  };
  GameState.player = {
    ...GameState.player,
    hp: { current: 50, max: 100 },
    equipped: {},
    traits: [],
    skills: GameState.player.skills,
    bandageHpBonus: 0,
    medicalUsesBonus: 0,
    zombieRepelUntilTP: 0,
    permanentInfectionImmunity: false,
    permanentDiseaseResist: 0,
  };
}

describe('아이템 카드 이슈 회귀', () => {
  beforeEach(snapshotGameState);
  afterEach(restoreGameState);

  it('body subtype 방어구와 accessory 방어구를 장착 후보로 노출한다', () => {
    expect(EquipmentSystem.getSlotsForDef(ITEMS.extreme_cold_suit)).toContain('body');
    expect(EquipmentSystem.getSlotsForDef(ITEMS.armor_plate)).toContain('body');
    expect(EquipmentSystem.getSlotsForDef(ITEMS.mothers_necklace)).toContain('accessory');
  });

  it('armor 객체만 가진 방어구도 장착 효과에 집계한다', () => {
    GameState.cards = {
      armor_inst: {
        instanceId: 'armor_inst',
        definitionId: 'armor_plate',
        durability: 100,
      },
    };
    GameState.player = {
      ...GameState.player,
      equipped: { body: 'armor_inst' },
    };

    const effects = StatSystem.getArmorEffects();

    expect(effects.damageReduction).toBeGreaterThan(0);
    expect(effects.critReduction).toBeGreaterThan(0);
  });

  it('능력치가 비어 있던 장비도 실제 장착 효과를 가진다', () => {
    expect(ITEMS.old_blanket.armor.damageReduction).toBeGreaterThan(0);
    expect(ITEMS.cloth_guard.armor.damageReduction).toBeGreaterThan(0);

    GameState.cards = {
      guard_inst: {
        instanceId: 'guard_inst',
        definitionId: 'cloth_guard',
        durability: 100,
      },
    };
    GameState.player = {
      ...GameState.player,
      equipped: { body: 'guard_inst' },
    };

    const statEffects = StatSystem.getArmorEffects();
    const modalEffects = EquipmentModal._getEffects();

    expect(statEffects.damageReduction).toBeCloseTo(0.02);
    expect(modalEffects.damageReduction).toBeCloseTo(0.02);
  });

  it('onUse만 있는 소비 아이템도 공통 소비 효과로 등록된다', () => {
    expect(ITEMS.dandelion_coffee.onConsume).toEqual(ITEMS.dandelion_coffee.onUse);
    expect(ITEMS.grilled_fish.onConsume).toEqual(ITEMS.grilled_fish.onUse);
  });

  it('소비 시 stamina, warmth, heal 효과 키를 실제 스탯에 반영한다', () => {
    resetForConsume('vitamin_complex');
    expect(StatSystem.consumeCard('test_card')).toBe(true);
    expect(GameState.stats.stamina.current).toBe(30);

    resetForConsume('kimchi_stew');
    expect(StatSystem.consumeCard('test_card')).toBe(true);
    expect(GameState.stats.temperature.current).toBe(50);

    resetForConsume('stabilizer_shot');
    expect(StatSystem.consumeCard('test_card')).toBe(true);
    expect(GameState.player.hp.current).toBe(60);
  });

  it('카드 앞면에는 효과 요약 대신 한국어 아이템 타입만 표시한다', () => {
    const blanketHtml = CardFactory._buildInner(
      { instanceId: 'blanket_inst', definitionId: 'blanket', quantity: 1, durability: 100, contamination: 0 },
      ITEMS.blanket,
    );
    const vitaminHtml = CardFactory._buildInner(
      { instanceId: 'vitamin_inst', definitionId: 'vitamin_complex', quantity: 1, durability: 100, contamination: 0 },
      ITEMS.vitamin_complex,
    );

    expect(blanketHtml).toContain('소모품');
    expect(vitaminHtml).toContain('의료품');
    expect(blanketHtml).not.toContain('사용 효과');
    expect(vitaminHtml).not.toContain('사용 효과');
    expect(blanketHtml).not.toContain('체온+0.5');
    expect(blanketHtml).not.toContain('사기+5');
    expect(vitaminHtml).not.toContain('스태+30');
  });

  it('우클릭 카드 정보용 효과 상세에는 능력치와 지속시간을 포함한다', () => {
    const queenHtml = CardFactory._buildInner(
      { instanceId: 'queen_inst', definitionId: 'queen_pheromone', quantity: 1, durability: 100, contamination: 0 },
      ITEMS.queen_pheromone,
    );
    const tranquilizerHtml = CardFactory._buildInner(
      { instanceId: 'tranq_inst', definitionId: 'veterinary_tranquilizer', quantity: 1, durability: 100, contamination: 0 },
      ITEMS.veterinary_tranquilizer,
    );
    const armorHtml = CardFactory._buildInner(
      { instanceId: 'armor_inst', definitionId: 'armor_plate', quantity: 1, durability: 100, contamination: 0 },
      ITEMS.armor_plate,
    );
    const slingHtml = CardFactory._buildInner(
      { instanceId: 'sling_inst', definitionId: 'sling', quantity: 1, durability: 100, contamination: 0 },
      ITEMS.sling,
    );

    expect(queenHtml).toContain('소모품');
    expect(tranquilizerHtml).toContain('소모품');
    expect(armorHtml).toContain('장비');
    expect(slingHtml).toContain('의료품');
    expect(queenHtml).not.toContain('특수 효과');
    expect(tranquilizerHtml).not.toContain('특수 효과');
    expect(armorHtml).not.toContain('장착 효과');
    expect(slingHtml).not.toContain('치료 효과');
    expect(queenHtml).not.toContain('좀비 회피 24TP');
    expect(tranquilizerHtml).not.toContain('기절 2턴');
    expect(armorHtml).not.toContain('피해 -20% 장착 중');
    expect(slingHtml).not.toContain('팔 골절 -2단계 즉시');

    const queenDetails = formatCardEffectEntries(ITEMS.queen_pheromone).map(entry => entry.value);
    const tranquilizerDetails = formatCardEffectEntries(ITEMS.veterinary_tranquilizer).map(entry => entry.value);
    const armorDetails = formatCardEffectEntries(ITEMS.armor_plate).map(entry => entry.value);
    const slingDetails = formatCardEffectEntries(ITEMS.sling).map(entry => entry.value);

    expect(queenDetails).toContain('좀비 회피 24TP');
    expect(tranquilizerDetails).toContain('기절 2턴');
    expect(armorDetails).toContain('피해 -20% 장착 중');
    expect(slingDetails).toContain('팔 골절 -2단계 즉시 HP+25 의료 Lv.2');
  });

  it('특수 소비 효과가 실제 지속 상태로 적용된다', () => {
    GameState.time = { ...GameState.time, totalTP: 10, day: 1 };

    resetForConsume('queen_pheromone');
    GameState.time = { ...GameState.time, totalTP: 10, day: 1 };
    expect(StatSystem.consumeCard('test_card')).toBe(true);
    expect(GameState.player.zombieRepelUntilTP).toBe(34);

    resetForConsume('vaccine');
    expect(StatSystem.consumeCard('test_card')).toBe(true);
    expect(GameState.player.permanentInfectionImmunity).toBe(true);

    resetForConsume('veterinary_tranquilizer');
    GameState.combat = {
      active: true,
      targetIndex: 0,
      enemies: [{ id: 'zombie_common', name: '좀비', currentHp: 20, maxHp: 20 }],
      combatants: {},
      log: [],
    };
    expect(StatSystem.consumeCard('test_card')).toBe(true);
    expect(GameState.combat.enemies[0]._statusEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'stun', duration: 2, effect: expect.objectContaining({ skipTurn: true }) }),
      ]),
    );
  });

  it('된장찌개는 수분 회복도 소비 효과에 포함한다', () => {
    expect(ITEMS.soybean_stew.onUse.hydration).toBe(8);
    expect(ITEMS.soybean_stew.onConsume.hydration).toBe(8);

    resetForConsume('soybean_stew');
    expect(StatSystem.consumeCard('test_card')).toBe(true);
    expect(GameState.stats.hydration.current).toBe(8);
  });

  it('대상형 강화 아이템은 드롭 상호작용으로 적용되고 카드 상세에 표시된다', () => {
    const poisonRule = findInteraction(ITEMS.poison, ITEMS.knife);
    const poisonedKnife = { instanceId: 'knife_inst', definitionId: 'knife', durability: 100 };
    expect(poisonRule.canApply({ definitionId: 'poison' }, poisonedKnife).ok).toBe(true);
    expect(poisonRule.apply({ definitionId: 'poison' }, poisonedKnife).consumeSrc).toBe(true);
    expect(poisonedKnife._poisonDamage).toBe(3);

    const scalpelRule = findInteraction(ITEMS.poison, ITEMS.scalpel);
    expect(scalpelRule.canApply({ definitionId: 'poison' }, { definitionId: 'scalpel' })).toEqual(
      expect.objectContaining({ ok: false }),
    );

    const suppressorRule = findInteraction(ITEMS.suppressor, ITEMS.rifle);
    const rifleInst = { instanceId: 'rifle_inst', definitionId: 'rifle', durability: 100 };
    expect(suppressorRule.canApply({ definitionId: 'suppressor' }, rifleInst).ok).toBe(true);
    suppressorRule.apply({ definitionId: 'suppressor' }, rifleInst);
    expect(rifleInst._suppressor).toBe(true);
    expect(rifleInst._noiseReduction).toBe(0.5);

    const salveRule = findInteraction(ITEMS.defense_salve, ITEMS.armor_plate);
    const armorInst = { instanceId: 'armor_inst', definitionId: 'armor_plate', durability: 100 };
    expect(salveRule.canApply({ definitionId: 'defense_salve' }, armorInst).ok).toBe(true);
    salveRule.apply({ definitionId: 'defense_salve' }, armorInst);
    expect(armorInst._damageReductionBonus).toBeCloseTo(0.05);

    GameState.cards = { armor_inst: armorInst };
    GameState.player = { ...GameState.player, equipped: { body: 'armor_inst' } };
    expect(StatSystem.getArmorEffects().damageReduction).toBeGreaterThan(ITEMS.armor_plate.armor.damageReduction);

    const modDetails = formatCardEffectEntries(ITEMS.rifle, rifleInst).map(entry => entry.value);
    expect(modDetails).toContain('소음 -50% 공격 시');
  });
});
