// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import EquipmentModal from '../../js/ui/EquipmentModal.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import GameState from '../../js/core/GameState.js';
import Pause from '../../js/screens/Pause.js';
import ModalManager from '../../js/ui/ModalManager.js';

describe('장비 화면 선택과 슬롯 조작', () => {
  let saved;
  beforeEach(() => {
    saved = GameState.serialize();
    GameState.cards = {
      knife_a: { instanceId: 'knife_a', definitionId: 'knife', durability: 73, quantity: 1 },
      knife_b: { instanceId: 'knife_b', definitionId: 'knife', durability: 41, quantity: 2 },
    };
    GameState.board.bottom = ['knife_a', 'knife_b', ...Array(18).fill(null)];
    GameState.board.middle = Array(27).fill(null);
    GameState.player.equipped = {};
    EquipmentModal._selectedId = null;
    EquipmentModal._slotMenuId = null;
    EquipmentModal._activeTab = 1;
    EquipmentModal._activeMainTab = 'equip';
    document.body.innerHTML = '<div id="equip-modal"><div class="equip-modal-box"></div></div>';
    EquipmentModal._overlay = document.querySelector('#equip-modal');
    EquipmentModal._render();
  });
  afterEach(() => { EquipmentModal.close(); vi.restoreAllMocks(); GameState.deserialize(saved); });

  it('동일 정의의 인스턴스를 구분하고 선택 상세에 내구도를 표시한다', () => {
    document.querySelector('[data-inv-id="knife_b"]').click();
    expect(EquipmentModal._selectedId).toBe('knife_b');
    expect(document.querySelector('.equip-item-detail').textContent).toContain('41%');
    expect(document.querySelector('[data-inv-id="knife_b"]').getAttribute('aria-pressed')).toBe('true');
  });
  it('키보드로 선택 후 유효 슬롯에 장착하고 해제할 수 있다', () => {
    document.querySelector('[data-inv-id="knife_a"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    document.querySelector('[data-slot="weapon_sub"]').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(GameState.player.equipped.weapon_sub).toBe('knife_a');
    expect(GameState.board.bottom).not.toContain('knife_a');
    document.querySelector('.equip-slot[data-slot="weapon_sub"]').click();
    document.querySelector('[data-action="unequip"]').click();
    expect(GameState.player.equipped.weapon_sub).toBeNull();
  });
  it('시스템이 교체를 거부하면 선택을 유지한다', () => {
    vi.spyOn(EquipmentSystem, 'equip').mockReturnValue(false);
    document.querySelector('[data-inv-id="knife_a"]').click();
    document.querySelector('.equip-slot[data-slot="weapon_sub"]').click();
    expect(EquipmentModal._selectedId).toBe('knife_a');
  });
  it('아홉 유효 슬롯을 한 번씩 표시한다', () => {
    const slots = [...document.querySelectorAll('.equip-slot')].map(el => el.dataset.slot);
    expect(new Set(slots).size).toBe(9);
    expect(slots).not.toContain('belt');
  });
  it('선택 재렌더 후 해당 아이템에 키보드 포커스를 돌려준다', () => {
    const row = document.querySelector('[data-inv-id="knife_b"]');
    row.focus();
    row.click();
    expect(document.activeElement.dataset.invId).toBe('knife_b');
  });
  it('빈 필터로 전환하면 선택과 상세를 초기화한다', () => {
    document.querySelector('[data-inv-id="knife_a"]').click();
    document.querySelector('.equip-inv-tab[data-tab="0"]').click();
    expect(EquipmentModal._selectedId).toBeNull();
    expect(document.querySelector('.equip-inv-empty')).not.toBeNull();
    expect(document.querySelector('.equip-detail-empty')).not.toBeNull();
  });
  it('캐릭터 정의의 전신 자산을 사용하고 누락 이미지에 대체 표시를 남긴다', () => {
    GameState.player.characterId = 'doctor';
    EquipmentModal._render();
    const image = document.querySelector('.equip-character-image');
    expect(image.getAttribute('src')).toBe('assets/images/characters/lee_jisoo_full.png');
    image.dispatchEvent(new Event('error'));
    expect(image.hidden).toBe(true);
    expect(document.querySelector('.equip-char-silhouette').textContent).toBeTruthy();
  });
  it('Escape는 장비창만 닫고 Pause와 공용 모달로 전파되지 않는다', () => {
    document.body.insertAdjacentHTML('beforeend', '<div id="modal-overlay" class="open"><div id="modal-box"></div></div>');
    Pause.init();
    ModalManager.init();
    const pause = vi.spyOn(Pause, '_pause').mockImplementation(() => {});
    const close = vi.spyOn(ModalManager, 'close').mockImplementation(() => {});
    GameState.ui.currentState = 'main';
    GameState.ui.modalOpen = true;
    EquipmentModal.open();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(EquipmentModal._overlay.classList.contains('open')).toBe(false);
    expect(pause).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(GameState.ui.modalOpen).toBe(true);
  });
  it('열기 전 modalOpen과 포커스를 복원하고 중복 open/close에도 보존한다', () => {
    document.body.insertAdjacentHTML('afterbegin', '<button id="equip-opener">장비</button>');
    const opener = document.querySelector('#equip-opener');
    opener.focus();
    GameState.ui.modalOpen = false;
    EquipmentModal.open();
    EquipmentModal.open();
    expect(GameState.ui.modalOpen).toBe(true);
    expect(EquipmentModal._overlay.contains(document.activeElement)).toBe(true);
    EquipmentModal.close();
    EquipmentModal.close();
    expect(GameState.ui.modalOpen).toBe(false);
    expect(document.activeElement).toBe(opener);
  });
  it('Tab과 Shift+Tab은 표시 중인 장비창 조작 요소 안에서 순환한다', () => {
    EquipmentModal.open();
    const first = document.querySelector('.equip-tab-btn');
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement.dataset.invId).toBe('knife_b');
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);
  });
});
