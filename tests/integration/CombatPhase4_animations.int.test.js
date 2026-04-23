// @vitest-environment happy-dom
// === Combat Overhaul Phase 4 — 동료 애니메이션 통합 ===
// 목적:
//   - companionAction 이벤트 → 카드 glow 클래스 적용 (action별 색상)
//   - heal 시 플레이어 위에 녹색 플로팅 텍스트
//   - attack 시 적 스프라이트 위에 데미지 플로팅 텍스트
//   - skill 시 .combat-visual에 skill-flash 클래스
//   - enemyAttackCompanion → companion-hit 클래스 + 데미지 플로팅
//   - setTimeout으로 클래스 정리 (애니메이션 종료 후)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus  from '../../js/core/EventBus.js';
import CombatUI  from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="screen-combat">
      <div class="combat-visual"></div>
      <div class="cv-player"></div>
      <div class="cv-enemy-sprite" data-idx="0"></div>
      <div class="cv-enemy-sprite" data-idx="1"></div>
      <div class="cpp-companion-row" data-companion-id="npc_nurse" style="position:relative;"></div>
      <div class="cpp-companion-row" data-companion-id="npc_soldier" style="position:relative;"></div>
    </div>
  `;
  CombatUI._screen = document.getElementById('screen-combat');
}

function resetEventBus() {
  EventBus._listeners = {};
}

describe('companionAction — 카드 glow 적용', () => {
  beforeEach(() => {
    setupDom();
    resetEventBus();
    CombatUI.init();   // 리스너 재등록
  });

  it('attack 액션 → companion-glow-attack 클래스 적용 후 600ms에 제거', () => {
    vi.useFakeTimers();
    EventBus.emit('companionAction', { npcId: 'npc_nurse', action: 'attack', targetIdx: 0, damage: 8 });
    const card = document.querySelector('[data-companion-id="npc_nurse"]');
    expect(card.classList.contains('companion-glow-attack')).toBe(true);
    vi.advanceTimersByTime(620);
    expect(card.classList.contains('companion-glow-attack')).toBe(false);
    vi.useRealTimers();
  });

  it('heal 액션 → companion-glow-heal + 플레이어 위 녹색 플로팅 +N', () => {
    EventBus.emit('companionAction', { npcId: 'npc_nurse', action: 'heal', amount: 15 });
    const card = document.querySelector('[data-companion-id="npc_nurse"]');
    expect(card.classList.contains('companion-glow-heal')).toBe(true);
    const popup = document.querySelector('.cv-player .dmg-popup.heal');
    expect(popup).not.toBeNull();
    expect(popup.textContent).toBe('+15');
  });

  it('hold 액션 → companion-glow-hold 클래스', () => {
    EventBus.emit('companionAction', { npcId: 'npc_soldier', action: 'hold' });
    const card = document.querySelector('[data-companion-id="npc_soldier"]');
    expect(card.classList.contains('companion-glow-hold')).toBe(true);
  });

  it('skill 액션 → combat-visual에 skill-flash + 동료 카드 glow-skill', () => {
    EventBus.emit('companionAction', { npcId: 'npc_nurse', action: 'skill', skillId: 'nurse_triage' });
    const card = document.querySelector('[data-companion-id="npc_nurse"]');
    expect(card.classList.contains('companion-glow-skill')).toBe(true);
    const visual = document.querySelector('.combat-visual');
    expect(visual.classList.contains('skill-flash')).toBe(true);
  });

  it('attack 시 타겟 적 위에 -N 플로팅 텍스트', () => {
    EventBus.emit('companionAction', { npcId: 'npc_nurse', action: 'attack', targetIdx: 1, damage: 12 });
    const popup = document.querySelector('.cv-enemy-sprite[data-idx="1"] .dmg-popup');
    expect(popup).not.toBeNull();
    expect(popup.textContent).toBe('-12');
  });

  it('존재하지 않는 npcId → 안전하게 no-op (에러 없음)', () => {
    expect(() => EventBus.emit('companionAction', { npcId: 'npc_nonexistent', action: 'attack' })).not.toThrow();
  });
});

describe('enemyAttackCompanion — 동료 카드 hit flash', () => {
  beforeEach(() => {
    setupDom();
    resetEventBus();
    CombatUI.init();
  });

  it('이벤트 수신 시 companion-hit 클래스 + 350ms 후 제거', () => {
    vi.useFakeTimers();
    EventBus.emit('enemyAttackCompanion', { enemyId: 'zombie', npcId: 'npc_nurse', damage: 7 });
    const card = document.querySelector('[data-companion-id="npc_nurse"]');
    expect(card.classList.contains('companion-hit')).toBe(true);
    vi.advanceTimersByTime(400);
    expect(card.classList.contains('companion-hit')).toBe(false);
    vi.useRealTimers();
  });

  it('동료 카드 위에 -N 플로팅 텍스트', () => {
    EventBus.emit('enemyAttackCompanion', { enemyId: 'zombie', npcId: 'npc_nurse', damage: 9 });
    const popup = document.querySelector('[data-companion-id="npc_nurse"] .dmg-popup');
    expect(popup).not.toBeNull();
    expect(popup.textContent).toBe('-9');
  });
});

describe('_spawnFloatText — 플로팅 텍스트 생성 + 제거', () => {
  beforeEach(setupDom);

  it('heal variant → .dmg-popup.heal 클래스', () => {
    const anchor = document.querySelector('.cv-player');
    CombatUI._spawnFloatText(anchor, '+10', 'heal');
    const popup = anchor.querySelector('.dmg-popup.heal');
    expect(popup).not.toBeNull();
    expect(popup.textContent).toBe('+10');
  });

  it('dmg variant → .dmg-popup (heal 클래스 없음)', () => {
    const anchor = document.querySelector('.cv-player');
    CombatUI._spawnFloatText(anchor, '-5', 'dmg');
    const popup = anchor.querySelector('.dmg-popup');
    expect(popup).not.toBeNull();
    expect(popup.classList.contains('heal')).toBe(false);
  });

  it('900ms 후 자동 제거', () => {
    vi.useFakeTimers();
    const anchor = document.querySelector('.cv-player');
    CombatUI._spawnFloatText(anchor, '-5', 'dmg');
    expect(anchor.querySelector('.dmg-popup')).not.toBeNull();
    vi.advanceTimersByTime(950);
    expect(anchor.querySelector('.dmg-popup')).toBeNull();
    vi.useRealTimers();
  });

  it('anchor=null 이면 no-op', () => {
    expect(() => CombatUI._spawnFloatText(null, 'x', 'dmg')).not.toThrow();
  });
});
