// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

function spriteRow(element) {
  return element.querySelector('.combat-sprite-sheet')?.style.getPropertyValue('--sprite-row-y');
}

function setupCombat() {
  document.body.innerHTML = `
    <div id="screen-combat">
      <div class="combat-visual"></div>
      <div class="cv-player" data-combatant-id="player" data-sprite-id="doctor_f" data-motion-state="idle">
        <span class="cv-player-img combat-sprite-sheet"></span>
      </div>
      <div class="cv-ally" data-combatant-id="npc_nurse" data-companion-id="npc_nurse">
        <span class="cv-ally-icon combat-sprite-sheet"></span>
      </div>
      <div class="cv-enemy-sprite" data-combatant-id="enemy:0" data-idx="0" data-sprite-id="zombie_common" data-motion-state="idle">
        <span class="cv-enemy-img combat-sprite-sheet"></span>
      </div>
      <div class="cv-enemy-sprite" data-combatant-id="enemy:1" data-idx="1" data-sprite-id="zombie_common" data-motion-state="idle">
        <span class="cv-enemy-img combat-sprite-sheet"></span>
      </div>
    </div>
  `;

  CombatUI._screen = document.getElementById('screen-combat');
  CombatUI._fxSpeed = 1;
  CombatUI._fxTimers = [];
  GameState.player = {
    characterId: 'doctor',
    gender: 'F',
    hp: { current: 100, max: 100 },
    isAlive: true,
  };
  GameState.npcs = {
    states: { npc_nurse: { hp: 50, maxHp: 50 } },
  };
  GameState.combat = {
    active: true,
    outcome: null,
    fxQueue: [],
    enemies: [
      { id: 'zombie_common', currentHp: 30, maxHp: 30 },
      { id: 'zombie_common', currentHp: 30, maxHp: 30 },
    ],
    combatants: {
      player: { id: 'player', sourceType: 'player', hp: 100, maxHp: 100, dead: false, deathsDoor: false },
      npc_nurse: { id: 'npc_nurse', sourceType: 'companion', sourceId: 'npc_nurse', hp: 50, maxHp: 50, dead: false, deathsDoor: false },
      'enemy:0': { id: 'enemy:0', sourceType: 'enemy', enemyIndex: 0, hp: 30, maxHp: 30, dead: false },
      'enemy:1': { id: 'enemy:1', sourceType: 'enemy', enemyIndex: 1, hp: 30, maxHp: 30, dead: false },
    },
  };
}

describe('combat motion lifecycle ownership', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupCombat();
  });

  afterEach(() => {
    CombatUI.skipFxQueue();
    CombatUI._screen = null;
    GameState.combat = null;
    vi.useRealTimers();
  });

  it('returns finite attack and hit motions to each manifest idle row', () => {
    const player = document.querySelector('.cv-player');
    const enemy = document.querySelector('[data-idx="0"]');

    CombatUI._playFx({ kind: 'playerAttack', fx: 'slash', targetIdx: 0, dmg: 8 });
    expect(spriteRow(player)).toBe('14.2857%');
    expect(spriteRow(enemy)).toBe('66.6667%');

    vi.advanceTimersByTime(900);

    expect(spriteRow(player)).toBe('0.0000%');
    expect(player.querySelector('.combat-sprite-sheet').style.animationIterationCount).toBe('infinite');
    expect(player.classList.contains('motion-knife-slash')).toBe(false);
    expect(player.classList.contains('attacking')).toBe(false);
    expect(spriteRow(enemy)).toBe('0.0000%');
    expect(enemy.classList.contains('motion-zombie-hit')).toBe(false);
    expect(enemy.classList.contains('hit')).toBe(false);
  });

  it('prevents an earlier action cleanup from interrupting a later action', () => {
    const player = document.querySelector('.cv-player');

    CombatUI._playSpriteMotion(player, 'doctor_f', 'melee');
    CombatUI._motion(player, 'motion-knife-slash', 720);
    vi.advanceTimersByTime(300);
    CombatUI._playSpriteMotion(player, 'doctor_f', 'ranged');
    CombatUI._motion(player, 'motion-firearm-shot', 680);

    vi.advanceTimersByTime(420);
    expect(spriteRow(player)).toBe('28.5714%');
    expect(player.classList.contains('motion-firearm-shot')).toBe(true);

    vi.advanceTimersByTime(260);
    expect(spriteRow(player)).toBe('0.0000%');
    expect(player.classList.contains('motion-firearm-shot')).toBe(false);
  });

  it('keeps class and sprite cleanup slots independent on the same actor', () => {
    const player = document.querySelector('.cv-player');

    CombatUI._playSpriteMotion(player, 'doctor_f', 'melee');
    CombatUI._motion(player, 'motion-knife-slash', 300);
    vi.advanceTimersByTime(300);

    expect(player.classList.contains('motion-knife-slash')).toBe(false);
    expect(spriteRow(player)).toBe('14.2857%');

    vi.advanceTimersByTime(420);
    expect(spriteRow(player)).toBe('0.0000%');
  });

  it('holds player and enemy death while stale hit cleanup finishes', () => {
    const player = document.querySelector('.cv-player');
    const enemy = document.querySelector('[data-idx="0"]');

    CombatUI._playSpriteMotion(enemy, 'zombie_common', 'hit');
    CombatUI._animate(enemy, 'hit', 520);
    GameState.combat.enemies[0].currentHp = 0;
    Object.assign(GameState.combat.combatants['enemy:0'], { hp: 0, dead: true });
    enemy.classList.add('is-dead');
    CombatUI._deathBurst(enemy);

    Object.assign(GameState.combat.combatants.player, { hp: 0, dead: true });
    GameState.player.hp.current = 0;
    GameState.player.isAlive = false;
    GameState.combat.outcome = 'defeat';
    CombatUI._playFx({ kind: 'playerDeath' });
    vi.runAllTimers();

    expect(spriteRow(enemy)).toBe('100.0000%');
    expect(enemy.querySelector('.combat-sprite-sheet').style.animationFillMode).toBe('forwards');
    expect(spriteRow(player)).toBe('100.0000%');
    expect(player.querySelector('.combat-sprite-sheet').style.animationFillMode).toBe('forwards');
    expect(player.classList.contains('motion-player-death')).toBe(true);
  });

  it('holds the death row for downed player and companion actors', () => {
    const player = document.querySelector('.cv-player');
    const ally = document.querySelector('[data-companion-id="npc_nurse"]');
    GameState.combat.combatants.player.deathsDoor = true;
    GameState.combat.combatants.player.hp = 0;
    GameState.player.hp.current = 0;
    GameState.combat.combatants.npc_nurse.deathsDoor = true;
    GameState.combat.combatants.npc_nurse.hp = 0;
    GameState.npcs.states.npc_nurse.hp = 0;

    CombatUI._playFx({ kind: 'downed', target: 'player' });
    CombatUI._playFx({ kind: 'downed', target: 'ally', targetId: 'npc_nurse' });
    vi.runAllTimers();

    expect(spriteRow(player)).toBe('100.0000%');
    expect(spriteRow(ally)).toBe('100.0000%');
    expect(player.classList.contains('motion-downed')).toBe(true);
    expect(ally.classList.contains('motion-downed')).toBe(true);
  });

  it('releases a downed terminal marker only after combat state confirms recovery', () => {
    const player = document.querySelector('.cv-player');
    Object.assign(GameState.combat.combatants.player, { hp: 0, deathsDoor: true });
    GameState.player.hp.current = 0;
    CombatUI._playFx({ kind: 'downed', target: 'player' });

    CombatUI._motion(player, 'motion-heal-pulse', 300);
    expect(player.classList.contains('motion-downed')).toBe(true);
    expect(player.classList.contains('motion-heal-pulse')).toBe(false);

    Object.assign(GameState.combat.combatants.player, { hp: 10, deathsDoor: false, dead: false });
    GameState.player.hp.current = 10;
    CombatUI._motion(player, 'motion-heal-pulse', 300);

    expect(player.dataset.motionTerminal).toBeUndefined();
    expect(spriteRow(player)).toBe('0.0000%');
    expect(player.classList.contains('motion-downed')).toBe(false);
    expect(player.classList.contains('motion-heal-pulse')).toBe(true);
  });

  it('holds the final idle-row frame and overlay class for victory', () => {
    const player = document.querySelector('.cv-player');
    GameState.combat.active = false;
    GameState.combat.outcome = 'victory';

    CombatUI._playFx({ kind: 'victory' });
    vi.runAllTimers();

    expect(spriteRow(player)).toBe('0.0000%');
    expect(player.querySelector('.combat-sprite-sheet').style.animationIterationCount).toBe('1');
    expect(player.querySelector('.combat-sprite-sheet').style.animationFillMode).toBe('forwards');
    expect(player.classList.contains('motion-victory')).toBe(true);
  });

  it('skip cancels queued callbacks and active timers, then restores current actor states idempotently', () => {
    const player = document.querySelector('.cv-player');
    const ally = document.querySelector('[data-companion-id="npc_nurse"]');
    const aliveEnemy = document.querySelector('[data-idx="0"]');
    const deadEnemy = document.querySelector('[data-idx="1"]');

    GameState.combat.fxQueue = [{ kind: 'enemyAttack', enemyIdx: 0, dmg: 5 }];
    CombatUI._playFxQueue();
    CombatUI._playSpriteMotion(aliveEnemy, 'zombie_common', 'basic_attack');
    CombatUI._motion(aliveEnemy, 'motion-zombie-lunge', 720);
    Object.assign(GameState.combat.combatants.npc_nurse, { hp: 0, deathsDoor: true });
    GameState.npcs.states.npc_nurse.hp = 0;
    CombatUI._playFx({ kind: 'downed', target: 'ally', targetId: 'npc_nurse' });
    Object.assign(GameState.combat.combatants['enemy:1'], { hp: 0, dead: true });
    GameState.combat.enemies[1].currentHp = 0;
    deadEnemy.classList.add('is-dead');
    CombatUI._deathBurst(deadEnemy);
    GameState.combat.active = false;
    GameState.combat.outcome = 'victory';
    CombatUI._playFx({ kind: 'victory' });

    expect(CombatUI.skipFxQueue()).toBe(true);
    expect(CombatUI.skipFxQueue()).toBe(false);

    expect(spriteRow(aliveEnemy)).toBe('0.0000%');
    expect(aliveEnemy.classList.contains('motion-zombie-lunge')).toBe(false);
    expect(spriteRow(ally)).toBe('100.0000%');
    expect(spriteRow(deadEnemy)).toBe('100.0000%');
    expect(spriteRow(player)).toBe('0.0000%');
    expect(player.classList.contains('motion-victory')).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('applies fast mode to motion lifetime and ignores cleanup on a detached screen', () => {
    const player = document.querySelector('.cv-player');
    CombatUI._fxSpeed = 2;
    CombatUI._playSpriteMotion(player, 'doctor_f', 'melee');
    CombatUI._motion(player, 'motion-knife-slash', 720);
    vi.advanceTimersByTime(360);
    expect(spriteRow(player)).toBe('0.0000%');
    expect(player.classList.contains('motion-knife-slash')).toBe(false);

    CombatUI._fxSpeed = 1;
    CombatUI._playSpriteMotion(player, 'doctor_f', 'melee');
    const oldScreen = CombatUI._screen;
    oldScreen.remove();
    CombatUI._screen = document.createElement('div');
    CombatUI._screen.id = 'screen-combat-replacement';
    document.body.appendChild(CombatUI._screen);
    vi.runAllTimers();

    expect(spriteRow(player)).toBe('14.2857%');
    expect(vi.getTimerCount()).toBe(0);
  });
});
