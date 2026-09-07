// @vitest-environment happy-dom
// === 장착 슬롯 강조 회귀 테스트 ===
// INBOX 3군 마지막 항목: 장착 중인 아이템을 장비 창 안에서 강조한다 (사람이 (B)로 결정).
//
// 지키는 것 넷:
//  1. 강조는 장비 창 안에서만 한다. EquipmentSystem.equip() 이 카드를 보드에서 지우는
//     규칙(휴대 칸 수·무게가 함께 움직인다)은 건드리지 않는다.
//  2. 장착 슬롯과 빈 슬롯이 갈린다 — 앰버 테두리 + `장착품` 라벨.
//  3. 새 색을 만들지 않는다 (--accent-primary 재사용, SPEC 3절).
//  4. 카드를 든 동안의 초록(highlight-valid)이 앰버를 이긴다. CSS 규칙 순서가 그걸 정한다.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import GameState from '../../js/core/GameState.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import EquipmentModal from '../../js/ui/EquipmentModal.js';
import I18n from '../../js/core/I18n.js';

const EQUIP_CSS = fs.readFileSync(path.resolve(__dirname, '../../css/equipment.css'), 'utf8');

const saved = {};

function frag(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  return box;
}

beforeEach(() => {
  saved.cards  = GameState.cards;
  saved.player = GameState.player;
  saved.board  = GameState.board;
  GameState.cards = {};
  GameState.player = { ...GameState.player, equipped: {} };
  EquipmentModal._selectedId = null;
  EquipmentModal._slotMenuId = null;
});

afterEach(() => {
  GameState.cards  = saved.cards;
  GameState.player = saved.player;
  GameState.board  = saved.board;
});

function equipInto(definitionId, slotId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.player.equipped[slotId] = inst.instanceId;
  return inst;
}

describe('장비 창 — 장착 슬롯 강조', () => {
  it('장착된 슬롯에 장착품 라벨이 붙는다', () => {
    equipInto('gas_mask', 'face');
    const el = frag(EquipmentModal._renderSlot('face'));
    expect(el.querySelector('.equip-mini-tag')?.textContent).toBe(I18n.t('equip.equipped'));
  });

  it('빈 슬롯에는 라벨이 없고 슬롯 이름만 선다', () => {
    const el = frag(EquipmentModal._renderSlot('face'));
    expect(el.querySelector('.equip-mini-tag')).toBeNull();
    expect(el.querySelector('.equip-slot-empty-icon')).not.toBeNull();
  });

  it('장착 슬롯만 has-item 을 단다 — 테두리가 갈리는 근거다', () => {
    equipInto('helmet', 'head');
    expect(frag(EquipmentModal._renderSlot('head')).querySelector('.equip-slot').className)
      .toContain('has-item');
    expect(frag(EquipmentModal._renderSlot('body')).querySelector('.equip-slot').className)
      .not.toContain('has-item');
  });

  it('무기 슬롯처럼 탄약·내구 줄이 있어도 라벨이 함께 선다', () => {
    equipInto('pistol', 'weapon_main');
    const el = frag(EquipmentModal._renderSlot('weapon_main'));
    expect(el.querySelector('.equip-mini-tag')).not.toBeNull();
    expect(el.querySelector('.equip-mini-name')).not.toBeNull();
  });

  it('강조는 장비 창 안에서만 한다 — equip() 은 여전히 보드에서 카드를 지운다', () => {
    GameState.board = { top: [null], middle: [null], bottom: [null, null] };
    const inst = GameState.createCardInstance('gas_mask');
    GameState.board.bottom[0] = inst.instanceId;
    expect(EquipmentSystem.equip(inst.instanceId, 'face')).toBe(true);
    expect(GameState.board.bottom.includes(inst.instanceId)).toBe(false);
    expect(GameState.player.equipped.face).toBe(inst.instanceId);
  });
});

describe('장비 창 — 강조 서식', () => {
  it('앰버 테두리는 기존 토큰을 쓴다 (새 색 없음)', () => {
    const rule = EQUIP_CSS.match(/\.equip-slot\.has-item\s*\{[^}]*\}/)[0];
    expect(rule).toContain('var(--accent-primary)');
    expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('라벨 색도 토큰이다', () => {
    const rule = EQUIP_CSS.match(/\.equip-mini-tag\s*\{[^}]*\}/)[0];
    expect(rule).toContain('var(--accent-primary)');
    expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('호버가 앰버를 accent-dim 으로 내리지 않는다', () => {
    expect(EQUIP_CSS).toMatch(/\.equip-slot\.has-item:hover:not\(\.locked\):not\(\.highlight-valid\)/);
  });

  it('highlight-valid 가 has-item 뒤에 온다 — 같은 특이도라 순서가 승자를 정한다', () => {
    expect(EQUIP_CSS.indexOf('.equip-slot.highlight-valid'))
      .toBeGreaterThan(EQUIP_CSS.indexOf('.equip-slot.has-item {'));
  });
});
