// === 특수 석궁 화살 장전 ===
// regression: 석궁이 요구하는 탄약이 crossbow_bolt 하나뿐이라, 제작할 수 있는
// 강화·화염·폭발 화살을 탄창에 넣을 방법이 없었다. 셋 다 카드 이미지 외에는
// 코드 참조가 0건인 사문화 아이템이었다.
import { describe, expect, it, vi } from 'vitest';
import {
  MAGAZINE_CAPACITY,
  canReload,
  getMagazineState,
  reload,
} from '../../js/systems/WeaponAmmoSystem.js';
import GameData from '../../js/data/GameData.js';

const SPECIAL_ARROWS = ['improved_crossbow_bolt', 'fire_bolt', 'explosive_bolt'];

function makeState({ ammoId = 'crossbow_bolt', ammoQuantity = 1, loadedAmmo = 0 } = {}) {
  const cards = {
    bow_1: { instanceId: 'bow_1', definitionId: 'crossbow', durability: 100, loadedAmmo },
  };
  if (ammoQuantity > 0) {
    cards.ammo_1 = { instanceId: 'ammo_1', definitionId: ammoId, quantity: ammoQuantity };
  }
  return {
    cards,
    getCardDef: id => GameData.items[cards[id]?.definitionId] ?? null,
    getBoardCards: () => Object.values(cards),
    removeCardInstance: vi.fn(id => { delete cards[id]; }),
  };
}

describe('탄약 데이터 — 화살이 자기 용도를 선언한다', () => {
  it.each(SPECIAL_ARROWS)('%s가 석궁 탄종으로 선언되어 있다', id => {
    expect(GameData.items[id].ammoType).toBe('crossbow_bolt');
  });

  it('화살마다 한 팩이 채우는 발수가 다르다', () => {
    expect(GameData.items.crossbow_bolt.roundsPerPack ?? MAGAZINE_CAPACITY).toBe(20);
    expect(GameData.items.improved_crossbow_bolt.roundsPerPack).toBe(12);
    expect(GameData.items.fire_bolt.roundsPerPack).toBe(8);
    expect(GameData.items.explosive_bolt.roundsPerPack).toBe(4);
  });
});

describe('호환 판정', () => {
  it.each(SPECIAL_ARROWS)('%s로 석궁을 재장전할 수 있다', id => {
    expect(canReload(makeState({ ammoId: id }), 'bow_1')).toMatchObject({ ok: true });
  });

  it('기본 석궁 화살은 그대로 호환된다', () => {
    expect(canReload(makeState({ ammoId: 'crossbow_bolt' }), 'bow_1')).toMatchObject({ ok: true });
  });

  it('다른 탄종은 여전히 거부한다', () => {
    expect(canReload(makeState({ ammoId: 'pistol_ammo' }), 'bow_1'))
      .toMatchObject({ ok: false, reason: 'missing_ammo_pack' });
  });
});

describe('장전 — 팩별 발수와 장전 화살 기록', () => {
  it.each([
    ['crossbow_bolt', 20],
    ['improved_crossbow_bolt', 12],
    ['fire_bolt', 8],
    ['explosive_bolt', 4],
  ])('%s 한 팩은 %i발을 채운다', (id, rounds) => {
    const gs = makeState({ ammoId: id, ammoQuantity: 2 });
    expect(reload(gs, 'bow_1')).toMatchObject({ ok: true, loadedAmmo: rounds });
    expect(gs.cards.ammo_1.quantity).toBe(1);
  });

  it('장전한 화살 종류를 무기 인스턴스에 기록한다', () => {
    const gs = makeState({ ammoId: 'fire_bolt' });
    reload(gs, 'bow_1');
    expect(gs.cards.bow_1.loadedAmmoId).toBe('fire_bolt');
  });

  it('기본 화살로 장전하면 기록도 기본 화살이다', () => {
    const gs = makeState({ ammoId: 'crossbow_bolt' });
    reload(gs, 'bow_1');
    expect(gs.cards.bow_1.loadedAmmoId).toBe('crossbow_bolt');
  });

  it('탄창 용량 상한을 넘지 않는다', () => {
    const gs = makeState({ ammoId: 'crossbow_bolt' });
    gs.cards.bow_1._ammoCapacityBonus = 0;
    expect(reload(gs, 'bow_1').loadedAmmo).toBeLessThanOrEqual(MAGAZINE_CAPACITY);
  });

  it('탄창 잔탄이 있으면 화살을 바꿔 끼울 수 없다', () => {
    const gs = makeState({ ammoId: 'explosive_bolt', loadedAmmo: 5 });
    expect(reload(gs, 'bow_1')).toMatchObject({ ok: false, reason: 'magazine_not_empty' });
  });

  it('탄창 상태 조회에 장전 화살이 함께 나온다', () => {
    const gs = makeState({ ammoId: 'explosive_bolt' });
    reload(gs, 'bow_1');
    expect(getMagazineState(gs, 'bow_1')).toMatchObject({
      ok: true, loadedAmmo: 4, loadedAmmoId: 'explosive_bolt',
    });
  });
});
