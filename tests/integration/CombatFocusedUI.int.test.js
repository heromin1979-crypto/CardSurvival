// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

function setupFocusedCombatState(gs) {
  gs.combat = {
    active: true,
    phase: 'await_ally_input',
    roundNumber: 1,
    activeCombatantId: 'player',
    activeTurnIndex: 0,
    activeIdx: 0,
    selectedSkillId: null,
    inspectedCombatantId: null,
    formations: {
      ally: [null, null, 'npc_nurse', 'player'],
      enemy: ['enemy:0', null, null, null],
    },
    combatants: {
      player: {
        id: 'player', side: 'ally', sourceType: 'player',
        hp: 80, maxHp: 100, stress: 2,
        tokens: {}, statusEffects: [], skillIds: ['s1', 's2', 's3', 's4', 's5'],
      },
      npc_nurse: {
        id: 'npc_nurse', side: 'ally', sourceType: 'companion',
        hp: 40, maxHp: 50, stress: 1,
        tokens: {}, statusEffects: [], skillIds: ['nurse_triage'],
      },
      'enemy:0': {
        id: 'enemy:0', side: 'enemy', sourceType: 'enemy',
        hp: 30, maxHp: 30, stress: 0,
        tokens: { block: 1 }, statusEffects: [],
      },
    },
    skillsById: Object.fromEntries(
      ['s1', 's2', 's3', 's4', 's5', 'nurse_triage'].map(id => [id, {
        id,
        fallbackName: id,
        icon: 'skill',
        usableFrom: [1, 2, 3, 4],
        target: { side: id === 'nurse_triage' ? 'ally' : 'enemy', ranks: [1, 2, 3, 4], count: 1 },
      }]),
    ),
    turnQueue: [
      { combatantId: 'player', type: 'player', initiative: 8 },
      { combatantId: 'enemy:0', type: 'enemy', enemyIdx: 0, initiative: 5 },
    ],
    pendingIntentByEnemy: {
      'enemy:0': { enemyId: 'enemy:0', skillId: 'enemy_attack', targetId: 'player' },
    },
    enemies: [{ id: 'zombie_common', name: '감염자', currentHp: 30, maxHp: 30 }],
    log: ['전투 시작'],
    fxQueue: [],
  };
}

describe('Combat focused UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="screen-combat"></div>';
    CombatUI._screen = document.getElementById('screen-combat');
    GameState.player.hp = { current: 80, max: 100 };
    GameState.stats = {
      stamina: { current: 10, max: 10 },
      infection: { current: 0, max: 100 },
    };
    setupFocusedCombatState(GameState);
    CombatUI.render();
  });

  it('renders a centered battlefield with two four-slot formation sides', () => {
    expect(document.querySelector('.combat-player-panel')).toBeNull();
    expect(document.querySelector('.combat-enemy-panel')).toBeNull();
    expect(document.querySelector('.combat-battlefield')).not.toBeNull();
    expect(document.querySelectorAll('.formation-slot.ally')).toHaveLength(4);
    expect(document.querySelectorAll('.formation-slot.enemy')).toHaveLength(4);
  });

  it('renders five current ally skills and a free combat item slot', () => {
    expect(document.querySelectorAll('.combat-skill-button')).toHaveLength(5);
    expect(document.querySelector('.combat-item-slot')).not.toBeNull();
  });

  it('shows a detail popover when a combatant is inspected', () => {
    document.querySelector('[data-combatant-id="enemy:0"]').click();
    expect(document.querySelector('.combat-detail-popover')).not.toBeNull();
    expect(document.querySelector('.combat-detail-popover').textContent).toContain('enemy:0');
  });
});
