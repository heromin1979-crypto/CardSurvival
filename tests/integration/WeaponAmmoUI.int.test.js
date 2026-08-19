// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CardFactory from '../../js/ui/CardFactory.js';
import EquipmentModal from '../../js/ui/EquipmentModal.js';
import ModalManager from '../../js/ui/ModalManager.js';
import CombatUI from '../../js/ui/CombatUI.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import GameState from '../../js/core/GameState.js';
import GameData from '../../js/data/GameData.js';

const saved = {};

function saveState() {
  saved.cards = GameState.cards;
  saved.board = GameState.board;
  saved.player = GameState.player;
  saved.ui = GameState.ui;
  saved.stats = GameState.stats;
  saved.companions = GameState.companions;
  saved.npcs = GameState.npcs;
  saved.flags = GameState.flags;
  saved.combat = GameState.combat;
}

function restoreState() {
  GameState.cards = saved.cards;
  GameState.board = saved.board;
  GameState.player = saved.player;
  GameState.ui = saved.ui;
  GameState.stats = saved.stats;
  GameState.companions = saved.companions;
  GameState.npcs = saved.npcs;
  GameState.flags = saved.flags;
  GameState.combat = saved.combat;
}

function setupFocusedPistolUi({ loadedAmmo = 0, ammoQuantity = 0, melee = false } = {}) {
  document.body.innerHTML = '<div id="screen-combat"></div>';
  CombatUI._screen = document.getElementById('screen-combat');
  GameState.cards = {
    pistol_1: {
      instanceId: 'pistol_1', definitionId: 'pistol', loadedAmmo,
      durability: 100, contamination: 0,
    },
  };
  if (melee) {
    GameState.cards.knife_1 = {
      instanceId: 'knife_1', definitionId: 'knife', durability: 100, contamination: 0,
    };
  }
  if (ammoQuantity > 0) {
    GameState.cards.ammo_1 = {
      instanceId: 'ammo_1', definitionId: 'pistol_ammo', quantity: ammoQuantity,
      durability: 100, contamination: 0,
    };
  }
  GameState.board = {
    top: [], environment: [], middle: ammoQuantity > 0 ? ['ammo_1'] : [], bottom: [],
  };
  GameState.player = {
    ...GameState.player,
    hp: { current: 100, max: 100 },
    characterId: 'doctor',
    equipped: { weapon_main: 'pistol_1', weapon_sub: melee ? 'knife_1' : null },
  };
  GameState.stats = {
    ...GameState.stats,
    stamina: { current: 10, max: 10, decayPerTP: 0 },
    morale: { current: 50, max: 100, decayPerTP: 0 },
  };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.flags = {};
  CombatSystem._setupCombat({
    enemies: [{
      id: 'zombie_common', name: 'infected', currentHp: 100, maxHp: 100,
      speed: 1, row: 'front', defense: 0,
      attack: { damage: [0, 0], accuracy: 0 }, specialSkills: [],
      weaknesses: [], resistances: [], _skillCooldowns: {}, _statusEffects: [], lootTable: [],
    }],
    dangerLevel: 1,
  });
  GameState.combat.formations.ally = [null, null, 'player', null];
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

  it.each(['pistol_ammo', 'shotgun_ammo', 'crossbow_bolt'])('%s처럼 무기가 참조하는 탄약 팩 상세에 한 팩이 20발임을 표시한다', definitionId => {
    GameState.cards.ammo_1.definitionId = definitionId;
    ModalManager.showCardInspect('ammo_1');

    expect(ModalManager._box.textContent).toContain('탄약 팩');
    expect(ModalManager._box.textContent).toContain('1팩 = 20발');
  });

  // 특수 화살도 석궁 탄종으로 편입되면서 팩 정보가 표시된다. 다만 희소할수록 적게 들어가므로
  // '20발'을 그대로 쓰면 안 되고 화살별 발수를 보여줘야 한다.
  it.each([
    ['improved_crossbow_bolt', 12],
    ['fire_bolt', 8],
    ['explosive_bolt', 4],
  ])('%s는 팩 정보에 %i발을 표시한다', (definitionId, rounds) => {
    GameState.cards.ammo_1.definitionId = definitionId;
    ModalManager.showCardInspect('ammo_1');

    expect(ModalManager._box.textContent).toContain('탄약 팩');
    expect(ModalManager._box.textContent).toContain(`1팩 = ${rounds}발`);
    expect(ModalManager._box.textContent).not.toContain('1팩 = 20발');
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
  it('장전된 원거리 무기는 탄창 수를 표시하며 공격 명령을 활성화한다', () => {
    setupFocusedPistolUi({ loadedAmmo: 2, ammoQuantity: 1 });
    CombatUI.render();

    const button = document.querySelector('[data-skill-id="equipment:pistol_1"]');
    expect(button.dataset.command).toBe('attack');
    expect(button.textContent).toContain('2/20');
    expect(button.disabled).toBe(false);
  });

  it('빈 탄창과 호환 탄약 팩은 같은 원거리 카드에서 재장전 명령이 된다', () => {
    setupFocusedPistolUi({ loadedAmmo: 0, ammoQuantity: 1 });
    CombatUI.render();

    const button = document.querySelector('[data-skill-id="equipment:pistol_1"]');
    expect(button.dataset.command).toBe('reload');
    expect(button.classList.contains('is-reload')).toBe(true);
    expect(button.disabled).toBe(false);
    button.click();
    expect(GameState.cards.pistol_1.loadedAmmo).toBe(20);
  });

  it('빈 탄창에 호환 탄약 팩이 없으면 원거리 카드를 비활성화한다', () => {
    setupFocusedPistolUi({ loadedAmmo: 0 });
    CombatUI.render();

    const button = document.querySelector('[data-skill-id="equipment:pistol_1"]');
    expect(button.dataset.command).toBe('attack');
    expect(button.classList.contains('is-empty')).toBe(true);
    expect(button.disabled).toBe(true);
  });

  it('빈 원거리 카드와 별개로 장착된 근접 무기 카드는 활성 상태를 유지한다', () => {
    setupFocusedPistolUi({ loadedAmmo: 0, melee: true });
    CombatUI.render();

    expect(document.querySelector('[data-skill-id="equipment:pistol_1"]').disabled).toBe(true);
    expect(document.querySelector('[data-skill-id="equipment:knife_1"]').disabled).toBe(false);
  });

  it('무기를 장착 해제하고 다시 장착해도 인스턴스의 탄창 수를 보존한다', () => {
    GameState.board.middle = Array(20).fill(null);
    GameState.board.bottom = Array(20).fill(null);
    GameState.player.equipped.weapon_main = null;
    const pistol = GameState.createCardInstance('pistol', { loadedAmmo: 9 });

    expect(GameState.placeCardInRow(pistol.instanceId, 'middle')).toBeTruthy();
    expect(EquipmentSystem.equip(pistol.instanceId, 'weapon_main')).toBe(true);
    expect(EquipmentSystem.unequip('weapon_main')).toBe(true);
    expect(GameState.cards[pistol.instanceId].loadedAmmo).toBe(9);
    expect(EquipmentSystem.equip(pistol.instanceId, 'weapon_main')).toBe(true);
    expect(GameState.cards[pistol.instanceId].loadedAmmo).toBe(9);
  });
});
