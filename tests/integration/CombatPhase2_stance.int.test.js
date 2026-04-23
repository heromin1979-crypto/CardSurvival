// @vitest-environment happy-dom
// === Combat Overhaul Phase 2 — 동료 stance UI 통합 ===
// 목적:
//   - _renderStanceSelector HTML 구조
//   - 활성 stance 강조
//   - 클래스 스킬 쿨다운 배지 (ready vs waiting)
//   - 버튼 클릭 → state.stance 업데이트
//   - 통합 시나리오: _processAiTurns 내에서 stance 기반 동료 턴 실행
import { describe, it, expect, beforeEach } from 'vitest';
import CombatUI     from '../../js/ui/CombatUI.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';
import BALANCE      from '../../js/data/gameBalance.js';

function setupDom() {
  document.body.innerHTML = `<div id="screen-combat"></div>`;
  CombatUI._screen = document.getElementById('screen-combat');
}

describe('_renderStanceSelector — HTML 구조', () => {
  it('5개 stance 버튼 렌더 + 기본 attack 활성', () => {
    const html = CombatUI._renderStanceSelector('npc_a', { hp: 50 });
    expect(html).toContain('data-stance="attack"');
    expect(html).toContain('data-stance="heal"');
    expect(html).toContain('data-stance="support"');
    expect(html).toContain('data-stance="hold"');
    expect(html).toContain('data-stance="manual"');
    // attack에만 active
    expect(html).toMatch(/stance-btn active" data-stance="attack"/);
  });

  it('설정된 stance에 active 클래스', () => {
    const html = CombatUI._renderStanceSelector('npc_a', { hp: 50, stance: 'heal' });
    expect(html).toMatch(/stance-btn active" data-stance="heal"/);
    expect(html).not.toMatch(/stance-btn active" data-stance="attack"/);
  });

  it('클래스 스킬 ready 배지 (쿨다운 0)', () => {
    const html = CombatUI._renderStanceSelector('npc_nurse', { hp: 50, skillCooldowns: {} });
    const skill = BALANCE.combat.companionAuto.classSkills.npc_nurse;
    expect(html).toContain('skill-cd-badge ready');
    expect(html).toContain(skill.name);
    expect(html).toContain('✨');
  });

  it('클래스 스킬 쿨다운 중 배지 (숫자 표시)', () => {
    const html = CombatUI._renderStanceSelector('npc_nurse', { hp: 50, skillCooldowns: { nurse_triage: 3 } });
    expect(html).toContain('⏳3');
    expect(html).not.toMatch(/skill-cd-badge ready/);
  });

  it('클래스 스킬 없는 NPC → 배지 없음', () => {
    const html = CombatUI._renderStanceSelector('npc_unknown', { hp: 50 });
    expect(html).not.toContain('skill-cd-badge');
  });
});

describe('stance 버튼 클릭 → state 업데이트 (DOM 통합)', () => {
  beforeEach(() => {
    setupDom();
    GameState.companions = ['npc_a'];
    GameState.npcs = { states: { npc_a: { hp: 50, maxHp: 50, isCompanion: true } } };
  });

  it('클릭 후 npcs.states[id].stance가 변경된다', () => {
    // DOM 직접 구성 (CombatUI.render 전체는 과도)
    CombatUI._screen.innerHTML = CombatUI._renderStanceSelector('npc_a', GameState.npcs.states.npc_a);
    // 이벤트 바인딩 수동 재현 (렌더 후에 일반적으로 하는 작업)
    CombatUI._screen.querySelectorAll('.stance-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const npcId = btn.dataset.npcId;
        const stance = btn.dataset.stance;
        const st = GameState.npcs?.states?.[npcId];
        if (st) st.stance = stance;
      });
    });

    const healBtn = CombatUI._screen.querySelector('[data-stance="heal"]');
    expect(healBtn).not.toBeNull();
    healBtn.click();
    expect(GameState.npcs.states.npc_a.stance).toBe('heal');

    const supBtn = CombatUI._screen.querySelector('[data-stance="support"]');
    supBtn.click();
    expect(GameState.npcs.states.npc_a.stance).toBe('support');
  });
});

describe('_processAiTurns — stance 기반 동료 행동 통합', () => {
  beforeEach(() => {
    GameState.player.hp = { current: 40, max: 100 };
    GameState.companions = ['npc_nurse'];
    GameState.npcs = {
      states: {
        npc_nurse: { hp: 40, maxHp: 50, isCompanion: true, stance: 'heal' },
      },
    };
    GameState.combat = {
      active:      true,
      enemies:     [{ id: 'e', name: 'E', currentHp: 30, maxHp: 30, specialSkills: [], attack: { damage: [1, 1], accuracy: 0 }, weaknesses: [], resistances: [] }],
      targetIndex: 0,
      log:         [],
      round:       0,
      playerStatus: [], enemyStatus: [],
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'companion', id: 'npc_nurse', order: 1 },
        { type: 'enemy', enemyIdx: 0, order: 2 },
      ],
      activeIdx:   0,
      roundNumber: 1,
    };
  });

  it('heal stance 동료가 큐 순서대로 플레이어 힐', () => {
    // _processAiTurns: player(0) → advance → companion heal → enemy turn → back to player
    const before = GameState.player.hp.current;
    CombatSystem._processAiTurns();
    // 힐 발동 (player HP < 70% 조건)
    expect(GameState.player.hp.current).toBeGreaterThan(before);
    // 큐가 플레이어(0)로 복귀
    expect(GameState.combat.activeIdx).toBe(0);
  });

  it('support stance 동료 + nurse → nurse_triage 발동 및 쿨다운 설정', () => {
    GameState.npcs.states.npc_nurse.stance = 'support';
    CombatSystem._processAiTurns();
    const skill = BALANCE.combat.companionAuto.classSkills.npc_nurse;
    expect(GameState.npcs.states.npc_nurse.skillCooldowns?.nurse_triage).toBe(skill.cooldown);
  });
});
