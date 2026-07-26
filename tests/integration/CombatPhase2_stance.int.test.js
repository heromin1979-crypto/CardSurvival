// @vitest-environment happy-dom
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';

function setupDom() {
  document.body.innerHTML = '<div id="screen-combat"></div>';
  CombatUI._screen = document.getElementById('screen-combat');
}

function setupManualNurseTurn() {
  GameState.player.hp = { current: 10, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.equipped = {};
  GameState.player.traits = [];
  GameState.stats.stamina = { current: 10, max: 10, decayPerTP: 0 };
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0 };
  GameState.noise = { level: 0 };
  GameState.companions = ['npc_nurse'];
  GameState.npcs = {
    states: {
      npc_nurse: {
        hp: 50,
        maxHp: 50,
        isCompanion: true,
        stance: 'manual',
      },
    },
  };
  GameState.flags = {};
  CombatSystem._setupCombat({
    dangerLevel: 1,
    enemies: [{
      id: 'zombie_common',
      name: '감염자',
      currentHp: 100,
      maxHp: 100,
      row: 'front',
      defense: 0,
      attack: { damage: [1, 1], accuracy: 0 },
      specialSkills: [],
      weaknesses: [],
      resistances: [],
      lootTable: [],
      _skillCooldowns: {},
      _statusEffects: [],
    }],
  });

  const combat = GameState.combat;
  combat.turnQueue = [
    { type: 'companion', id: 'npc_nurse', combatantId: 'npc_nurse', order: 0 },
    { type: 'player', combatantId: 'player', order: 1 },
    { type: 'enemy', enemyIdx: 0, combatantId: 'enemy:0', order: 2 },
  ];
  combat.activeIdx = 0;
  combat.activeTurnIndex = 0;
  combat.activeCombatantId = 'npc_nurse';
  CombatSystem.beginActiveTurn();
  return combat;
}

beforeEach(() => {
  setupDom();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('동료 빠른 계획 UI', () => {
  it('영구 stance 표시와 분리된 네 개 one-shot 계획 버튼을 렌더한다', () => {
    const html = CombatUI._renderStanceSelector('npc_nurse', {
      hp: 50,
      stance: 'manual',
    });

    expect(html).toContain('data-current-stance="manual"');
    expect(html).toContain('data-plan-stance="attack"');
    expect(html).toContain('data-plan-stance="heal"');
    expect(html).toContain('data-plan-stance="support"');
    expect(html).toContain('data-plan-stance="hold"');
    expect(html).not.toContain('data-plan-stance="manual"');
  });

  it('빠른 치료 클릭은 실제 계획을 실행하고 저장 stance는 manual로 유지한다', () => {
    const combat = setupManualNurseTurn();
    CombatUI._screen.innerHTML = CombatUI._renderStanceSelector(
      'npc_nurse',
      GameState.npcs.states.npc_nurse,
    );
    CombatUI._bindCompanionPlanButtons?.();

    const healButton = CombatUI._screen.querySelector('[data-plan-stance="heal"]');
    expect(healButton).not.toBeNull();
    healButton?.click();

    expect(GameState.player.hp.current).toBe(18);
    expect(GameState.npcs.states.npc_nurse.stance).toBe('manual');
    expect(combat.activeCombatantId).toBe('player');
  });
});

describe('manual 동료 실제 스킬 카드', () => {
  it('현재 combat.skillsById의 실제 loadout 카드를 노출한다', () => {
    const combat = setupManualNurseTurn();
    const html = CombatUI._renderSkillBar(
      combat.combatants.npc_nurse,
      combat,
    );

    expect(html).toContain('data-skill-id="nurse_scalpel"');
    expect(html).toContain('data-skill-id="nurse_triage"');
    expect(html).toContain('data-skill-id="nurse_encourage"');
  });

  it('실제 스킬 쿨다운 중인 카드는 비활성 상태와 남은 턴을 표시한다', () => {
    const combat = setupManualNurseTurn();
    combat.skillsById.nurse_scalpel.cooldown = 3;
    GameState.npcs.states.npc_nurse.skillCooldowns = { nurse_scalpel: 2 };

    const html = CombatUI._renderSkillBar(
      combat.combatants.npc_nurse,
      combat,
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    const scalpelCard = host.querySelector('[data-skill-id="nurse_scalpel"]');

    expect(scalpelCard?.disabled).toBe(true);
    expect(scalpelCard?.textContent).toContain('쿨다운 2');
  });
});
