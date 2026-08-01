// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

function makeEnemy(id, name, hp, row = 'front') {
  return {
    id,
    name,
    icon: '🧟',
    type: 'zombie',
    currentHp: hp,
    maxHp: 50,
    row,
    attack: { damage: [5, 8], accuracy: 0.65 },
    weaknesses: [],
    resistances: [],
    specialSkills: [],
  };
}

function setupCombatState() {
  document.body.innerHTML = `<div id="screen-combat"></div>`;
  CombatUI._screen = document.getElementById('screen-combat');
  vi.spyOn(CombatUI, '_playFxQueue').mockImplementation(() => {});

  GameState.player = {
    ...(GameState.player ?? {}),
    name: '강민준',
    characterId: 'soldier',
    gender: 'F',
    hp: { current: 90, max: 110 },
    equipped: {
      weapon_main: null,
      weapon_sub: null,
      body: null,
    },
  };
  GameState.stats = {
    ...(GameState.stats ?? {}),
    stamina: { current: 80, max: 100 },
    infection: { current: 0, max: 100 },
  };
  GameState.location = { ...(GameState.location ?? {}), currentDistrict: 'jongno' };
  GameState.time = { ...(GameState.time ?? {}), hour: 1 };
  GameState.weather = { icon: '🌧', name: '비' };
  GameState.noise = { level: 20 };
  GameState.cards = {};
  GameState.companions = ['npc_dog'];
  GameState.npcs = {
    states: {
      npc_dog: { hp: 42, maxHp: 50, isCompanion: true, name: '떠돌이 개', stance: 'attack' },
    },
  };
  GameState.getBoardCards = () => [];
  GameState.getCardDef = () => null;

  GameState.combat = {
    active: true,
    _isNew: true,
    round: 1,
    roundNumber: 1,
    dangerLevel: 3,
    enemies: [
      makeEnemy('zombie_common', '감염자', 35, 'front'),
      makeEnemy('zombie_runner', '러너', 28, 'front'),
      makeEnemy('zombie_brute', '거대 감염자', 50, 'back'),
    ],
    targetIndex: 0,
    playerStatus: [{ id: 'stun', name: '기절', duration: 1, effect: {} }],
    enemyStatus: [],
    fxQueue: [],
    log: ['전투 시작'],
    turnQueue: [
      { type: 'player', order: 0 },
      { type: 'companion', id: 'npc_dog', order: 1 },
      { type: 'enemy', enemyIdx: 0, order: 2 },
    ],
    activeIdx: 0,
  };
  GameState.combat.enemies[0]._statusEffects = [{ id: 'bleed', name: '출혈', duration: 2, effect: {} }];
}

describe('CombatUI rank lineup layout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupCombatState();
  });

  it('사이드 정보 패널 없이 횡렬 랭크 전장을 렌더한다', () => {
    CombatUI.render();

    expect(document.querySelector('.combat-player-panel')).toBeNull();
    expect(document.querySelector('.combat-enemy-panel')).toBeNull();
    expect(document.querySelector('.combat-stage-lineup')).not.toBeNull();
    expect(document.querySelectorAll('.cv-ally-unit').length).toBe(2);
    expect(document.querySelectorAll('.cv-enemy-sprite').length).toBe(3);
    expect(document.querySelector('.cv-player').classList.contains('player-female')).toBe(true);
    expect(document.querySelector('.cv-player').classList.contains('motion-idle')).toBe(true);
    expect(document.querySelector('.cv-player').classList.contains('motion-combat-ready')).toBe(true);
    expect(document.querySelector('.cv-player').classList.contains('motion-status-stun')).toBe(true);
    expect(document.querySelector('.cv-enemy-sprite[data-idx="0"]').classList.contains('enemy-zombie')).toBe(true);
    expect(document.querySelector('.cv-enemy-sprite[data-idx="0"]').classList.contains('motion-zombie-idle')).toBe(true);
    expect(document.querySelector('.cv-enemy-sprite[data-idx="0"]').classList.contains('motion-combat-ready')).toBe(true);
    expect(document.querySelector('.cv-enemy-sprite[data-idx="0"]').classList.contains('motion-status-bleed')).toBe(true);
  });

  it('아군과 적은 좌우 횡렬 그룹에 배치된다', () => {
    CombatUI.render();

    const allyLine = document.querySelector('.cv-ally-line');
    const enemyLine = document.querySelector('.cv-enemy-line');

    expect(allyLine).not.toBeNull();
    expect(enemyLine).not.toBeNull();
    expect(allyLine.querySelector('.cv-player')).not.toBeNull();
    expect(allyLine.querySelector('[data-companion-id="npc_dog"]')).not.toBeNull();
    expect(enemyLine.querySelectorAll('.cv-enemy-sprite').length).toBe(3);
  });

  it('renders generated combat sprite sheets for the doctor starter party', () => {
    GameState.player.characterId = 'doctor';
    GameState.player.gender = 'F';
    GameState.companions = ['npc_nurse', 'npc_wounded_soldier'];
    GameState.npcs.states = {
      npc_nurse: { hp: 50, maxHp: 50, isCompanion: true, name: 'Nurse', stance: 'support' },
      npc_wounded_soldier: { hp: 42, maxHp: 55, isCompanion: true, name: 'Wounded Soldier', stance: 'support' },
    };

    CombatUI.render();

    const playerSheet = document.querySelector('.cv-player .cv-player-sheet');
    const nurseSheet = document.querySelector('[data-companion-id="npc_nurse"] .cv-companion-sheet');
    const soldierSheet = document.querySelector('[data-companion-id="npc_wounded_soldier"] .cv-companion-sheet');

    expect(playerSheet?.getAttribute('style')).toContain('doctor_f_sheet.png');
    expect(nurseSheet?.getAttribute('style')).toContain('nurse_companion_sheet.png');
    expect(soldierSheet?.getAttribute('style')).toContain('soldier_companion_sheet.png');
  });

  it('marks non-sheet player images as blended fallback assets', () => {
    GameState.player.characterId = 'soldier';
    GameState.player.gender = 'F';

    CombatUI.render();

    const fallback = document.querySelector('.cv-player img.cv-player-fallback-img');

    expect(fallback).not.toBeNull();
    expect(fallback?.classList.contains('cv-player-img')).toBe(true);
    expect(fallback?.getAttribute('src')).toContain('assets/images/combat/player_F_cutout.png');
  });

  it('renders generated enemy sprite sheets by enemy id and type fallback', () => {
    GameState.combat.enemies = [
      makeEnemy('zombie_screamer', 'Screamer', 50, 'back'),
      { ...makeEnemy('boss_horde_mother', 'Horde Mother', 50, 'front'), type: 'zombie' },
      { ...makeEnemy('unknown_human_boss', 'Unknown Human', 50, 'front'), type: 'human' },
    ];

    CombatUI.render();

    const sheets = [...document.querySelectorAll('.cv-enemy-sheet')];

    expect(sheets.length).toBe(3);
    expect(sheets[0].getAttribute('style')).toContain('zombie_screamer_sheet.png');
    expect(sheets[1].getAttribute('style')).toContain('boss_horde_mother_sheet.png');
    expect(sheets[2].getAttribute('style')).toContain('raider_sheet.png');
  });

  it('dead front enemies are removed from the stage lineup and back enemies fill forward visually', () => {
    GameState.combat.enemies[0].currentHp = 0;
    GameState.combat.enemies[1].currentHp = 0;
    GameState.combat.targetIndex = 2;

    CombatUI.render();

    const enemyLine = document.querySelector('.cv-enemy-line');
    const stageEnemies = [...document.querySelectorAll('.cv-enemy-line .cv-enemy-sprite')];
    expect(enemyLine?.classList.contains('is-front-filled')).toBe(true);
    expect(stageEnemies.length).toBe(1);
    expect(stageEnemies[0].dataset.idx).toBe('2');
    expect(stageEnemies[0].querySelector('.cv-row-badge')).toBeNull();
  });

  it('MOVE card is an enabled combat action and shows the player rank token', () => {
    GameState.combat.playerRank = 'back';

    CombatUI.render();

    const moveCard = document.querySelector('.action-card.move');
    expect(moveCard?.dataset.action).toBe('move');
    expect(moveCard?.getAttribute('aria-disabled')).toBeNull();
    expect(moveCard?.classList.contains('disabled')).toBe(false);
    expect(document.querySelector('.cv-player')?.classList.contains('player-rank-back')).toBe(true);
    expect(document.querySelector('.cv-player .cv-rank-token')?.textContent).toMatch(/Back|후열/);
  });

  it('renders companion plates with only name and HP information', () => {
    CombatUI.render();

    const ally = document.querySelector('[data-companion-id="npc_dog"]');
    const plate = ally?.querySelector('.cv-unit-plate');

    expect(plate?.querySelector('.cv-unit-name')?.textContent).toBeTruthy();
    expect(plate?.querySelector('.cv-hp-bar-track')).not.toBeNull();
    expect(plate?.textContent).toContain('HP');
    expect(plate?.querySelector('.cv-unit-meta')).toBeNull();
  });

  it('renders sample-style action cost badges for player action cards', () => {
    CombatUI.render();

    const actionCards = [...document.querySelectorAll('.combat-action-bar > .action-card')];

    expect(actionCards.length).toBe(5);
    expect(actionCards.every(card => card.querySelector('.ac-cost'))).toBe(true);
    expect(document.querySelector('.action-card.primary .ac-cost')?.textContent).toMatch(/\d+/);
  });

  it('does not synthesize removed manual companion action cards', () => {
    GameState.combat.activeIdx = 1;
    GameState.npcs.states.npc_dog.stance = 'manual';

    CombatUI.render();

    expect(document.querySelector('.companion-action-card')).toBeNull();
  });
});
