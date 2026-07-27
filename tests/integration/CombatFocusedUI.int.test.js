// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
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
    enemies: [{ id: 'zombie_common', name: '감염자', currentHp: 30, maxHp: 30 }],
    log: ['전투 시작'],
    fxQueue: [],
    playerStatus: [],
    enemyStatus: [],
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
    GameState.player.equipped = {};
    GameState.cards = {};
    setupFocusedCombatState(GameState);
    CombatUI.render();
  });

  it('renders a focused horizontal battlefield without side info panels', () => {
    expect(document.querySelector('.combat-player-panel')).toBeNull();
    expect(document.querySelector('.combat-enemy-panel')).toBeNull();
    expect(document.querySelector('.combat-battlefield')).not.toBeNull();
    expect(document.querySelector('.combat-focused-lineup')).not.toBeNull();
    expect(document.querySelector('.combat-rank-divider')).not.toBeNull();
    expect(document.querySelector('.combat-round-medallion')).not.toBeNull();
    expect(document.querySelectorAll('.combat-status-card')).toHaveLength(3);
    expect(document.querySelector('.combat-stage-floor')).not.toBeNull();
    expect(document.querySelectorAll('.combat-formation.ally .formation-slot')).toHaveLength(4);
    expect(document.querySelectorAll('.combat-formation.enemy .formation-slot')).toHaveLength(4);
    expect(document.querySelectorAll('.combatant-piece.ally')).toHaveLength(2);
    expect(document.querySelectorAll('.combatant-piece.enemy')).toHaveLength(1);
    expect(document.querySelector('.combat-stage-center')).not.toBeNull();
    expect(document.querySelector('.combat-focused').dataset.combatScene).toBe('jongno_subway_ruin');
    expect(document.querySelector('.combat-focused').style.getPropertyValue('--combat-bg-image')).toContain('combat_empty_battlefield.png');
    expect(document.querySelector('[data-combatant-id="player"]').dataset.spriteId).toBe('player_unarmed');
    expect(document.querySelector('[data-combatant-id="npc_nurse"]').dataset.spriteId).toBe('ally_pistol');
    expect(document.querySelector('[data-combatant-id="enemy:0"]').dataset.spriteId).toBe('enemy_zombie_common');
  });

  it('selects the player combat sprite from the equipped weapon', () => {
    const cases = [
      ['knife', 'player_knife'],
      ['combat_scalpel', 'player_scalpel'],
      ['pipe_wrench', 'player_spanner'],
      ['baseball_bat', 'player_bat'],
    ];

    for (const [definitionId, spriteId] of cases) {
      const instanceId = `inst_${definitionId}`;
      GameState.cards[instanceId] = { id: instanceId, definitionId };
      GameState.player.equipped = { weapon_main: instanceId };
      CombatUI.render();
      expect(document.querySelector('[data-combatant-id="player"]').dataset.spriteId).toBe(spriteId);
      expect(document.querySelector('[data-combatant-id="player"]').dataset.motionSrcHit)
        .toContain('combat_generated_pose_female_hit_anim_v1.png');
    }

    GameState.player.equipped = {};
    CombatUI.render();
    expect(document.querySelector('[data-combatant-id="player"]').dataset.spriteId).toBe('player_unarmed');
  });

  it('renders five current ally skill action cards and a free combat item slot', () => {
    expect(document.querySelectorAll('.combat-skill-button')).toHaveLength(5);
    expect(document.querySelectorAll('.combat-action-card')).toHaveLength(8);
    expect(document.querySelector('.combat-item-slot')).not.toBeNull();
  });

  it('renders the enemy intent badge from the execution-path _nextIntent only', () => {
    GameState.combat.enemies[0]._nextIntent = {
      action: 'attack', targetType: 'player', targetId: null,
      iconEmoji: '🗡', label: '플레이어 공격',
    };
    CombatUI.render();
    const intent = document.querySelector('.combatant-piece.enemy .combat-intent');
    expect(intent).not.toBeNull();
    expect(intent.getAttribute('title')).toBe('플레이어 공격');

    delete GameState.combat.enemies[0]._nextIntent;
    CombatUI.render();
    expect(document.querySelector('.combatant-piece.enemy .combat-intent')).toBeNull();
  });

  it('shows inspected combatant context in the battlefield ticker', () => {
    document.querySelector('[data-combatant-id="enemy:0"]').click();
    expect(document.querySelector('.combat-detail-popover')).toBeNull();
    expect(document.querySelector('.combat-event-ticker').textContent).toContain('enemy:0');
  });

  it('keeps attack controls visible after resolving the enemy turn', () => {
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.stamina = { current: 10, max: 10 };
    GameState.player.characterId = 'doctor';
    GameState.player.equipped = {};
    GameState.companions = [];
    GameState.npcs = { states: {} };
    GameState.flags = GameState.flags ?? {};

    CombatSystem._setupCombat({
      enemies: [{
        id: 'zombie_common',
        name: 'infected',
        currentHp: 100,
        maxHp: 100,
        speed: 4,
        row: 'front',
        attack: { damage: [4, 4], accuracy: 1 },
        specialSkills: [],
        weaknesses: [],
        resistances: [],
      }],
      dangerLevel: 1,
    });
    CombatUI.render();

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    document.querySelector('.combat-skill-button').click();
    document.querySelector('[data-combatant-id="enemy:0"]').click();
    randomSpy.mockRestore();

    expect(GameState.combat.activeCombatantId).toBe('player');
    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(GameState.combat.combatants.player.hp).toBe(GameState.player.hp.current);
    expect(document.querySelectorAll('.combat-skill-button').length).toBeGreaterThan(0);
  });

  it('prepares an initial fast companion exactly once before manual input', () => {
    const hadPlayerActionSpeed = Object.prototype.hasOwnProperty.call(
      GameState.player,
      'actionSpeed',
    );
    const previousPlayerActionSpeed = GameState.player.actionSpeed;

    try {
      GameState.player.hp = { current: 100, max: 100 };
      GameState.player.characterId = 'doctor';
      GameState.player.equipped = {};
      GameState.player.traits = [];
      GameState.player.actionSpeed = 1;
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
            actionSpeed: 200,
            skillCooldowns: { nurse_scalpel: 3 },
          },
        },
      };
      GameState.flags = {};

      CombatSystem._setupCombat({
        enemies: [{
          id: 'zombie_common',
          name: 'infected',
          currentHp: 100,
          maxHp: 100,
          actionSpeed: 0,
          row: 'front',
          attack: { damage: [1, 1], accuracy: 0 },
          specialSkills: [],
          weaknesses: [],
          resistances: [],
          lootTable: [],
          _skillCooldowns: {},
          _statusEffects: [],
        }],
        dangerLevel: 1,
      });

      expect(GameState.combat.activeCombatantId).toBe('npc_nurse');
      expect(GameState.combat.phase).toBe('await_ally_input');
      expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_scalpel)
        .toBe(2);

      CombatUI.render();
      CombatSystem.processUntilAllyTurn();
      CombatSystem.beginActiveTurn();
      CombatUI.render();

      expect(GameState.combat.activeCombatantId).toBe('npc_nurse');
      expect(GameState.combat.phase).toBe('await_ally_input');
      expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_scalpel)
        .toBe(2);
    } finally {
      if (hadPlayerActionSpeed) {
        GameState.player.actionSpeed = previousPlayerActionSpeed;
      } else {
        delete GameState.player.actionSpeed;
      }
    }
  });

  it('recovers to ally input when a selected skill fails its origin rank check', () => {
    GameState.combat.skillsById.s1.usableFrom = [2, 3, 4];
    GameState.combat.combatants.player.skillIds = ['s1'];
    CombatUI.render();

    const shotButton = document.querySelector('.combat-skill-button');
    expect(shotButton.disabled).toBe(true);

    expect(CombatSystem.selectSkill('s1')).toBe(true);
    expect(CombatSystem.selectTarget('enemy:0')).toBe(true);
    const result = CombatSystem.confirmAction();

    expect(result).toMatchObject({ ok: false, reason: 'invalid_origin_rank' });
    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(GameState.combat.selectedSkillId).toBeNull();
    expect(GameState.combat.selectedTargetId).toBeNull();
    expect(GameState.combat.combatants['enemy:0'].hp).toBe(30);

    CombatUI.render();
    expect(document.querySelectorAll('.combat-skill-button')).toHaveLength(1);
  });

  it('pulls a lone back-rank enemy forward before validating melee target range', () => {
    GameState.combat.formations.enemy = ['enemy:0', null, 'enemy:1', null];
    GameState.combat.combatants['enemy:0'] = {
      id: 'enemy:0', side: 'enemy', sourceType: 'enemy',
      enemyIndex: 0, hp: 0, maxHp: 30, dead: true,
      tokens: {}, statusEffects: [],
    };
    GameState.combat.combatants['enemy:1'] = {
      id: 'enemy:1', side: 'enemy', sourceType: 'enemy',
      enemyIndex: 1, hp: 30, maxHp: 30, dead: false,
      tokens: {}, statusEffects: [],
    };
    GameState.combat.skillsById.knife = {
      id: 'knife',
      fallbackName: 'knife',
      usableFrom: [1, 2],
      target: { side: 'enemy', ranks: [1, 2], count: 1 },
      costs: {},
      accuracy: 1,
      effects: [{ type: 'damage', value: [5, 5] }],
    };
    GameState.combat.combatants.player.skillIds = ['knife'];
    GameState.combat.turnQueue = [
      { combatantId: 'player', type: 'player', initiative: 9 },
    ];
    GameState.combat.activeTurnIndex = 0;
    GameState.combat.activeIdx = 0;
    GameState.combat.selectedSkillId = 'knife';
    GameState.combat.selectedTargetId = 'enemy:1';
    GameState.combat.phase = 'confirm_action';

    const result = CombatSystem.confirmAction();

    expect(result.ok).toBe(true);
    expect(GameState.combat.formations.enemy).toEqual(['enemy:1', null, null, null]);
    expect(GameState.combat.combatants['enemy:1'].hp).toBe(25);
    expect(GameState.combat.lastActionFailure).not.toBe('invalid_target_rank');
  });

  it('wires the common move command to the active move skill', () => {
    GameState.combat.turnQueue = [
      { combatantId: 'player', type: 'player', initiative: 8 },
    ];
    GameState.combat.formations.ally = [null, null, null, 'player'];
    delete GameState.combat.combatants.npc_nurse;
    GameState.combat.combatants.player.skillIds = ['s3'];
    GameState.combat.skillsById.s3 = {
      id: 's3',
      fallbackName: 'move',
      icon: 'move',
      usableFrom: [1, 2, 3, 4],
      target: { side: 'ally', ranks: [1, 2, 3, 4], count: 1 },
      costs: {},
      accuracy: 1,
      effects: [{ type: 'move', distance: 1 }],
    };
    CombatUI.render();

    document.querySelector('[data-command="move"]').click();

    expect(GameState.combat.formations.ally).toEqual([null, null, 'player', null]);
    expect(GameState.combat.phase).toBe('await_ally_input');
    expect(GameState.combat.log.at(-1)).toBe('move: 위치 이동');
  });
});
