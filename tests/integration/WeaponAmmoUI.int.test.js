// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CardFactory from '../../js/ui/CardFactory.js';
import EquipmentModal from '../../js/ui/EquipmentModal.js';
import ModalManager from '../../js/ui/ModalManager.js';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';

const saved = {};

function saveState() {
  saved.cards = GameState.cards;
  saved.board = GameState.board;
  saved.player = GameState.player;
  saved.ui = GameState.ui;
}

function restoreState() {
  GameState.cards = saved.cards;
  GameState.board = saved.board;
  GameState.player = saved.player;
  GameState.ui = saved.ui;
}

describe('플레이어 무기 탄창 UI', () => {
  beforeEach(() => {
    saveState();
    document.body.innerHTML = '<div id="modal-overlay"><div id="modal-box"></div></div>';
    ModalManager._overlay = document.getElementById('modal-overlay');
    ModalManager._box = document.getElementById('modal-box');
    GameState.cards = {
      pistol_1: {
        instanceId: 'pistol_1', definitionId: 'pistol', loadedAmmo: 0,
        durability: 100, contamination: 0,
      },
      crossbow_1: {
        instanceId: 'crossbow_1', definitionId: 'crossbow',
        durability: 100, contamination: 0,
      },
      ammo_1: {
        instanceId: 'ammo_1', definitionId: 'pistol_ammo', quantity: 1,
        durability: 100, contamination: 0,
      },
    };
    GameState.board = {
      top: [], environment: [], middle: ['ammo_1'], bottom: [],
    };
    GameState.player = {
      ...GameState.player,
      equipped: { ...GameState.player.equipped, weapon_main: 'pistol_1', weapon_sub: null },
    };
  });

  afterEach(() => {
    restoreState();
    document.body.innerHTML = '';
  });

  it.each([
    ['pistol_1', 'pistol', 0, 'empty', '0/20'],
    ['crossbow_1', 'crossbow', undefined, 'empty', '0/20'],
    ['pistol_1', 'pistol', 27, 'loaded', '20/20'],
  ])('%s 카드에 안전하게 정규화한 탄창 값을 표시한다', (instanceId, definitionId, loadedAmmo, stateClass, expectedAmmo) => {
    if (loadedAmmo === undefined) delete GameState.cards[instanceId].loadedAmmo;
    else GameState.cards[instanceId].loadedAmmo = loadedAmmo;
    const html = CardFactory._buildInner(GameState.cards[instanceId], GameData.items[definitionId]);

    expect(html).toContain(`card-ammo-badge ${stateClass}`);
    expect(html).toContain(expectedAmmo);
  });

  it('상세 모달에 장전 탄약과 호환 탄약을 표시한다', () => {
    ModalManager.showCardInspect('pistol_1');

    expect(ModalManager._box.textContent).toContain('장전 탄약');
    expect(ModalManager._box.textContent).toContain('0/20');
    expect(ModalManager._box.textContent).toContain('호환 탄약');
    expect(ModalManager._box.textContent).toContain('권총 탄약');
  });

  it('탄약 카드 상세에 한 팩이 20발임을 표시한다', () => {
    ModalManager.showCardInspect('ammo_1');

    expect(ModalManager._box.textContent).toContain('탄약 팩');
    expect(ModalManager._box.textContent).toContain('1팩 = 20발');
  });

  it('장비 패널의 원거리 주무기에 같은 탄창 값을 표시하고 무기 슬롯을 구분한다', () => {
    const equippedWeapon = EquipmentModal._buildMiniCard('pistol_1');
    GameState.player.equipped.weapon_main = null;
    const mainSlot = EquipmentModal._renderSlot('weapon_main');
    const subSlot = EquipmentModal._renderSlot('weapon_sub');

    expect(equippedWeapon).toContain('equip-mini-ammo empty');
    expect(equippedWeapon).toContain('0/20');
    expect(mainSlot).toContain('원거리 주무기');
    expect(subSlot).toContain('근접 보조무기');
  });
});
