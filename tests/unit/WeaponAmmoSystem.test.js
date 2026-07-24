import { describe, expect, it, vi } from 'vitest';
import {
  canFire,
  canReload,
  consumeRound,
  getLoadedAmmo,
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
});
