import { describe, expect, it, vi } from 'vitest';
import {
  canFire,
  canReload,
  consumeRound,
  getLoadedAmmo,
  getMagazineCapacity,
  getMagazineState,
  isMagazineWeapon,
  reload,
} from '../../js/systems/WeaponAmmoSystem.js';
import GameData from '../../js/data/GameData.js';

function makeState({ loadedAmmo, ammoQuantity = 0 } = {}) {
  const weapon = {
    instanceId: 'pistol_1',
    definitionId: 'pistol',
    durability: 100,
  };
  if (loadedAmmo !== undefined) weapon.loadedAmmo = loadedAmmo;
  const cards = { pistol_1: weapon };
  const boardIds = [];
  if (ammoQuantity > 0) {
    cards.ammo_1 = {
      instanceId: 'ammo_1',
      definitionId: 'pistol_ammo',
      quantity: ammoQuantity,
    };
    boardIds.push('ammo_1');
  }
  return {
    cards,
    getCardDef: vi.fn(id => id === 'pistol_1'
      ? { id: 'pistol', type: 'weapon', subtype: 'firearm', combat: { requiresAmmo: 'pistol_ammo' } }
      : null),
    getBoardCards: () => boardIds.map(id => cards[id]).filter(Boolean),
    removeCardInstance: vi.fn(id => { delete cards[id]; }),
  };
}

describe('WeaponAmmoSystem', () => {
  it.each([
    'pistol',
    'shotgun',
    'crossbow',
    'crossbow_plus',
    'rifle',
    'm4_carbine',
    'confiscated_sniper',
    'warlord_rifle',
    'silenced_pistol',
  ])('%s를 20발 탄창 적용 무기로 판정한다', definitionId => {
    expect(isMagazineWeapon(GameData.items[definitionId])).toBe(true);
  });

  it.each([
    [undefined, 0],
    [-3, 0],
    [Number.NaN, 0],
    [7.9, 7],
    [27, 20],
  ])('loadedAmmo=%p를 %i로 정규화한다', (loadedAmmo, expected) => {
    const gs = makeState({ loadedAmmo });
    expect(getLoadedAmmo(gs, 'pistol_1')).toBe(expected);
    expect(gs.cards.pistol_1.loadedAmmo).toBe(expected);
  });

  it('빈 탄창은 발사할 수 없고 탄약 세트가 있을 때만 재장전 가능하다', () => {
    expect(canFire(makeState({ loadedAmmo: 0 }), 'pistol_1'))
      .toMatchObject({ ok: false, reason: 'empty_magazine' });
    expect(canReload(makeState({ loadedAmmo: 0 }), 'pistol_1'))
      .toMatchObject({ ok: false, reason: 'missing_ammo_pack' });
    expect(canReload(makeState({ loadedAmmo: 0, ammoQuantity: 1 }), 'pistol_1'))
      .toMatchObject({ ok: true, ammoDefinitionId: 'pistol_ammo' });
  });

  it('중첩 탄약 한 세트를 소비해 20발을 장전한다', () => {
    const gs = makeState({ loadedAmmo: 0, ammoQuantity: 6 });
    expect(reload(gs, 'pistol_1')).toMatchObject({ ok: true, loadedAmmo: 20 });
    expect(gs.cards.ammo_1.quantity).toBe(5);
  });

  it('마지막 탄약 세트를 소비하면 카드 인스턴스를 제거한다', () => {
    const gs = makeState({ loadedAmmo: 0, ammoQuantity: 1 });
    expect(reload(gs, 'pistol_1').ok).toBe(true);
    expect(gs.removeCardInstance).toHaveBeenCalledWith('ammo_1');
    expect(gs.cards.ammo_1).toBeUndefined();
  });

  it('탄창이 남아 있으면 탄약 세트와 잔탄을 변경하지 않는다', () => {
    const gs = makeState({ loadedAmmo: 3, ammoQuantity: 2 });
    expect(reload(gs, 'pistol_1')).toMatchObject({ ok: false, reason: 'magazine_not_empty' });
    expect(gs.cards.pistol_1.loadedAmmo).toBe(3);
    expect(gs.cards.ammo_1.quantity).toBe(2);
  });

  it('호환되지 않는 탄약 카드는 재장전에 사용하지 않는다', () => {
    const gs = makeState({ loadedAmmo: 0 });
    gs.cards.rifle_ammo_1 = {
      instanceId: 'rifle_ammo_1',
      definitionId: 'rifle_ammo',
      quantity: 3,
    };
    gs.getBoardCards = () => [gs.cards.rifle_ammo_1];
    expect(reload(gs, 'pistol_1'))
      .toMatchObject({ ok: false, reason: 'missing_ammo_pack' });
    expect(gs.cards.rifle_ammo_1.quantity).toBe(3);
    expect(gs.cards.pistol_1.loadedAmmo).toBe(0);
  });

  it('발사 명령 하나당 정확히 1발만 소비한다', () => {
    const gs = makeState({ loadedAmmo: 2 });
    expect(consumeRound(gs, 'pistol_1')).toMatchObject({ ok: true, loadedAmmo: 1 });
    expect(consumeRound(gs, 'pistol_1')).toMatchObject({ ok: true, loadedAmmo: 0 });
    expect(consumeRound(gs, 'pistol_1')).toMatchObject({ ok: false, reason: 'empty_magazine' });
  });

  it('실패한 발사와 재장전 검증은 비정상 탄창 수량을 정규화하지 않는다', () => {
    const emptyMagazine = makeState({ loadedAmmo: -3 });
    expect(canFire(emptyMagazine, 'pistol_1'))
      .toMatchObject({ ok: false, reason: 'empty_magazine', loadedAmmo: 0 });
    expect(emptyMagazine.cards.pistol_1.loadedAmmo).toBe(-3);

    const fullMagazine = makeState({ loadedAmmo: 27, ammoQuantity: 2 });
    expect(reload(fullMagazine, 'pistol_1'))
      .toMatchObject({ ok: false, reason: 'magazine_not_empty', loadedAmmo: 20 });
    expect(fullMagazine.cards.pistol_1.loadedAmmo).toBe(27);
    expect(fullMagazine.cards.ammo_1.quantity).toBe(2);
  });
});

// 탄약 개조 키트 장착으로 붙는 인스턴스 보정. 용량이 전역 상수 하나로 고정돼 있어
// "이 총만 23발"을 표현할 수 없던 것을 카드별 계산으로 바꾼다.
describe('WeaponAmmoSystem — 탄창 인스턴스 보정', () => {
  function makeModdedState({ loadedAmmo = 0, bonus = 3, ammoQuantity = 0 } = {}) {
    const gs = makeState({ loadedAmmo, ammoQuantity });
    gs.cards.pistol_1._ammoCapacityBonus = bonus;
    return gs;
  }

  it('보정이 없는 무기는 기본 20발을 유지한다', () => {
    expect(getMagazineState(makeState({ loadedAmmo: 0 }), 'pistol_1').capacity).toBe(20);
    expect(getMagazineCapacity(GameData.items.pistol)).toBe(20);
  });

  it('_ammoCapacityBonus가 붙은 무기는 용량이 그만큼 늘어난다', () => {
    expect(getMagazineState(makeModdedState(), 'pistol_1').capacity).toBe(23);
    expect(getMagazineCapacity(GameData.items.pistol, { _ammoCapacityBonus: 3 })).toBe(23);
  });

  it('재장전은 늘어난 용량까지 채운다', () => {
    const gs = makeModdedState({ loadedAmmo: 0, ammoQuantity: 2 });
    expect(reload(gs, 'pistol_1')).toMatchObject({ ok: true, loadedAmmo: 23, capacity: 23 });
    expect(gs.cards.ammo_1.quantity).toBe(1);
  });

  it('잔탄 정규화 상한도 늘어난 용량을 따른다', () => {
    const gs = makeModdedState({ loadedAmmo: 30 });
    expect(getLoadedAmmo(gs, 'pistol_1')).toBe(23);
    expect(gs.cards.pistol_1.loadedAmmo).toBe(23);
  });

  it('보정값이 음수여도 기본 용량 아래로 내려가지 않는다', () => {
    expect(getMagazineState(makeModdedState({ bonus: -5 }), 'pistol_1').capacity).toBe(20);
  });

  it('탄창을 쓰지 않는 아이템은 보정과 무관하게 용량이 0이다', () => {
    expect(getMagazineCapacity(GameData.items.scrap_metal, { _ammoCapacityBonus: 3 })).toBe(0);
  });
});
