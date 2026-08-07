// === 방수 컨테이너 — 장착·밀폐 보존 회귀 테스트 ===
// regression: subtype 'storage'라 장착 불가 + contaminationImmunity 미배선으로
// 획득해도 아무 기능이 없던 문제. 새 컨셉: backpack 장착 + 가방 칸 식량 부패 정지.
import { describe, it, expect, beforeEach } from 'vitest';
import StatSystem from '../../js/systems/StatSystem.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';
import { BOTTOM_PAGE1_SIZE } from '../../js/data/bagSlots.js';

function resetWorld(bottomLen = 28) {
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: Array(20).fill(null), bottom: Array(bottomLen).fill(null) };
  GameState.pendingLoot = [];
  GameState.player = { ...(GameState.player ?? {}), isAlive: true, skills: {}, equipped: {} };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.season = { current: 'spring' };
  GameState.flags = GameState.flags ?? {};
}

function place(defId, row, slot) {
  const inst = GameState.createCardInstance(defId);
  GameState.board[row][slot] = inst.instanceId;
  return inst;
}

function equipContainer() {
  const inst = GameState.createCardInstance('waterproof_container');
  GameState.player.equipped.backpack = inst.instanceId;
  return inst;
}

describe('방수 컨테이너 장착', () => {
  it('subtype bag으로 backpack 슬롯에 장착 가능하다', () => {
    expect(EquipmentSystem.getSlotsForDef(ITEMS.waterproof_container)).toEqual(['backpack']);
  });

  it('밀폐 보존 플래그를 정의한다', () => {
    expect(ITEMS.waterproof_container.preservesContents).toBe(true);
  });
});

describe('방수 컨테이너 밀폐 보존 — _spoilPerishables', () => {
  beforeEach(() => resetWorld());

  it('장착 중 가방 페이지(2페이지) 칸의 음식은 부패하지 않는다', () => {
    equipContainer();
    const sealed = place('cooked_meat', 'bottom', BOTTOM_PAGE1_SIZE);
    StatSystem._spoilPerishables();
    expect(sealed.contamination ?? 0).toBe(0);
  });

  it('가방 페이지 밖(바닥·휴대 1페이지)의 음식은 그대로 부패한다', () => {
    equipContainer();
    const onFloor = place('cooked_meat', 'middle', 0);
    const onPage1 = place('cooked_meat', 'bottom', 0);
    StatSystem._spoilPerishables();
    expect(onFloor.contamination).toBe(20);
    expect(onPage1.contamination).toBe(20);
  });

  it('일반 가방(군용 배낭) 장착 시에는 가방 페이지 음식도 부패한다', () => {
    const bag = GameState.createCardInstance('military_bag');
    GameState.player.equipped.backpack = bag.instanceId;
    const inPage2 = place('cooked_meat', 'bottom', BOTTOM_PAGE1_SIZE);
    StatSystem._spoilPerishables();
    expect(inPage2.contamination).toBe(20);
  });

  it('가방 미장착 시에도 정상 부패한다', () => {
    const inst = place('cooked_meat', 'bottom', BOTTOM_PAGE1_SIZE);
    StatSystem._spoilPerishables();
    expect(inst.contamination).toBe(20);
  });
});
