import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import GameState from '../../js/core/GameState.js';

describe('플레이어 무기 슬롯 정책', () => {
  let initialSave;

  beforeEach(() => {
    initialSave = GameState.serialize();
    GameState.cards = {
      pistol_1: { instanceId: 'pistol_1', definitionId: 'pistol' },
      crossbow_1: { instanceId: 'crossbow_1', definitionId: 'crossbow' },
      knife_1: { instanceId: 'knife_1', definitionId: 'knife' },
      shield_1: { instanceId: 'shield_1', definitionId: 'reinforced_shield' },
      molotov_1: { instanceId: 'molotov_1', definitionId: 'molotov_cocktail' },
    };
  });

  afterEach(() => {
    GameState.deserialize(initialSave);
  });

  it.each(['pistol_1', 'crossbow_1'])('%s은 원거리 주무기에만 들어간다', id => {
    expect(EquipmentSystem.canEquip(id, 'weapon_main').ok).toBe(true);
    expect(EquipmentSystem.canEquip(id, 'weapon_sub').ok).toBe(false);
  });

  it('근접 무기는 근접 보조무기에만 들어간다', () => {
    expect(EquipmentSystem.canEquip('knife_1', 'weapon_main').ok).toBe(false);
    expect(EquipmentSystem.canEquip('knife_1', 'weapon_sub').ok).toBe(true);
  });

  it.each(['shield_1', 'molotov_1'])('%s은 무기 슬롯 모두에서 거부된다', id => {
    expect(EquipmentSystem.getSlotsForDef(GameState.getCardDef(id)))
      .not.toEqual(expect.arrayContaining(['weapon_main', 'weapon_sub']));
  });

  it('구버전 반대 슬롯 장착은 올바른 슬롯으로 교환하고 탄창을 초기화한다', () => {
    const save = JSON.parse(GameState.serialize());
    save.cards = {
      pistol_old: { instanceId: 'pistol_old', definitionId: 'pistol', durability: 90 },
      knife_old: { instanceId: 'knife_old', definitionId: 'knife', durability: 80 },
    };
    save.player.equipped.weapon_main = 'knife_old';
    save.player.equipped.weapon_sub = 'pistol_old';
    save.board.middle = Array(20).fill(null);
    save.board.bottom = Array(20).fill(null);
    save.pendingLoot = [];

    GameState.deserialize(JSON.stringify(save));

    expect(GameState.player.equipped.weapon_main).toBe('pistol_old');
    expect(GameState.player.equipped.weapon_sub).toBe('knife_old');
    expect(GameState.cards.pistol_old.loadedAmmo).toBe(0);
  });

  it('부적합 방패를 장착 해제해 보드로 복구한다', () => {
    const save = JSON.parse(GameState.serialize());
    save.cards = {
      shield_old: { instanceId: 'shield_old', definitionId: 'reinforced_shield', durability: 75 },
    };
    save.player.equipped.weapon_sub = 'shield_old';
    save.board.middle = Array(20).fill(null);
    save.board.bottom = Array(20).fill(null);

    GameState.deserialize(JSON.stringify(save));

    expect(GameState.player.equipped.weapon_sub).toBeNull();
    expect(GameState.getBoardCards().map(card => card.instanceId)).toContain('shield_old');
  });

  it('보드가 가득 차면 부적합 장비를 pendingLoot으로 보존한다', () => {
    const save = JSON.parse(GameState.serialize());
    const fillerIds = Array.from({ length: 40 }, (_, index) => `filler_${index}`);
    save.cards = Object.fromEntries([
      ['shield_old', {
        instanceId: 'shield_old',
        definitionId: 'reinforced_shield',
        durability: 75,
      }],
      ...fillerIds.map(instanceId => [instanceId, {
        instanceId,
        definitionId: 'scrap_metal',
        quantity: 1,
      }]),
    ]);
    save.player.equipped.weapon_sub = 'shield_old';
    save.board.middle = fillerIds.slice(0, 20);
    save.board.bottom = fillerIds.slice(20, 40);
    save.pendingLoot = [];

    GameState.deserialize(JSON.stringify(save));

    expect(GameState.player.equipped.weapon_sub).toBeNull();
    expect(GameState.pendingLoot).toEqual(expect.arrayContaining([
      expect.objectContaining({ definitionId: 'reinforced_shield', quantity: 1 }),
    ]));
  });

  it('만차 슬롯 마이그레이션은 무기의 내구도와 잔탄을 저장 왕복과 보드 복구 뒤에도 보존한다', () => {
    const save = JSON.parse(GameState.serialize());
    const fillerIds = Array.from({ length: 40 }, (_, index) => `filler_${index}`);
    save.cards = Object.fromEntries([
      ['pistol_keep', {
        instanceId: 'pistol_keep',
        definitionId: 'pistol',
        durability: 91,
        loadedAmmo: 8,
      }],
      ['shotgun_overflow', {
        instanceId: 'shotgun_overflow',
        definitionId: 'shotgun',
        durability: 37,
        loadedAmmo: 6,
      }],
      ...fillerIds.map(instanceId => [instanceId, {
        instanceId,
        definitionId: 'scrap_metal',
        quantity: 1,
      }]),
    ]);
    save.player.equipped.weapon_main = 'pistol_keep';
    save.player.equipped.weapon_sub = 'shotgun_overflow';
    save.board.middle = fillerIds.slice(0, 20);
    save.board.bottom = fillerIds.slice(20, 40);
    save.pendingLoot = [];

    GameState.deserialize(JSON.stringify(save));
    expect(GameState.cards.shotgun_overflow).toBeUndefined();
    expect(GameState.pendingLoot).toEqual(expect.arrayContaining([
      expect.objectContaining({
        definitionId: 'shotgun',
        instanceOverrides: expect.objectContaining({
          durability: 37,
          loadedAmmo: 6,
        }),
      }),
    ]));

    GameState.deserialize(GameState.serialize());
    GameState.removeCardInstanceSilent(fillerIds[0]);
    GameState.flushPendingLoot();

    const restored = Object.values(GameState.cards)
      .find(card => card.definitionId === 'shotgun');
    expect(restored).toMatchObject({
      definitionId: 'shotgun',
      durability: 37,
      loadedAmmo: 6,
    });
    expect(GameState.pendingLoot).toHaveLength(0);
  });
});
