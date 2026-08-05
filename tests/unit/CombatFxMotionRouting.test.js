// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';
import {
  applyCombatSpriteManifest,
  COMBAT_SPRITE_SHEETS,
} from '../../js/ui/combat/combatUiAssets.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="screen-combat">
      <div class="combat-visual"></div>
      <div class="cv-player" data-combatant-id="player"></div>
      <div class="cv-enemy-sprite" data-idx="0" data-combatant-id="enemy:0"></div>
      <div class="cv-ally" data-companion-id="npc_nurse" data-combatant-id="ally:npc_nurse"></div>
    </div>
  `;
  CombatUI._screen = document.getElementById('screen-combat');
}

describe('combat FX motion routing', () => {
  beforeEach(setupDom);

  afterEach(() => {
    GameState.combat = null;
    vi.useRealTimers();
  });

  it.each([
    'ranged',
    'acid_lash',
    'scream',
    'heal',
    'buff',
    'summon',
    'trap',
  ])('%s action remains stationary even when legacy movement requests a lunge', (motionKey) => {
    expect(CombatUI._enemyMovementClass(
      { motionKey, movement: 'lunge' },
      { locomotion: 'stationary' },
    )).toBeNull();
  });

  it('only an approach locomotion declaration produces a forward movement class', () => {
    expect(CombatUI._enemyMovementClass(
      { movement: 'lunge' },
      { locomotion: 'approach' },
    )).toBe('motion-move-forward');
    expect(CombatUI._enemyMovementClass(
      { movement: 'advance' },
      { locomotion: 'stationary' },
    )).toBeNull();
  });

  it('plays the requested manifest row without tying a stationary acid action to forward movement', () => {
    const sheet = COMBAT_SPRITE_SHEETS.zombie_acid;
    const previousMotions = sheet.motions;
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');
    enemy.innerHTML = '<span class="combat-sprite-sheet"></span>';
    GameState.combat = { enemies: [{ id: 'zombie_acid' }] };
    sheet.motions = {
      ...previousMotions,
      acid_lash: {
        row: 1,
        loop: false,
        durationMs: 700,
        locomotion: 'stationary',
      },
    };

    try {
      CombatUI._playFx({
        kind: 'enemyAttack',
        enemyIdx: 0,
        motionKey: 'acid_lash',
        movement: 'lunge',
        impactFx: 'acid',
        dmg: 8,
      });

      const sprite = enemy.querySelector('.combat-sprite-sheet');
      expect(sprite.style.getPropertyValue('--sprite-row-y')).toBe('25.0000%');
      expect(enemy.classList.contains('motion-move-forward')).toBe(false);
      expect(enemy.classList.contains('lunging')).toBe(false);
    } finally {
      sheet.motions = previousMotions;
    }
  });

  it('reuses the generic manifest row player for non-enemy combatants', () => {
    const player = document.querySelector('.cv-player');
    player.innerHTML = '<span class="combat-sprite-sheet"></span>';

    expect(CombatUI._playSpriteMotion(player, 'doctor_f', 'basic_attack')).toMatchObject({
      row: 1,
      locomotion: 'approach',
    });
    expect(player.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y'))
      .toBe('14.2857%');
  });

  it('resolves a one-step runtime alias and rejects chained or circular aliases', () => {
    const player = document.querySelector('.cv-player');
    const sheet = COMBAT_SPRITE_SHEETS.doctor_f;
    const previousAliases = sheet.aliases;
    player.innerHTML = '<span class="combat-sprite-sheet"></span>';

    try {
      expect(applyCombatSpriteManifest({
        'doctor_f_sheet.png': { aliases: { quick_strike: 'melee' } },
      })).toMatchObject({ ok: true });
      expect(CombatUI._playSpriteMotion(player, 'doctor_f', 'quick_strike')).toMatchObject({
        row: 1,
        locomotion: 'approach',
      });

      applyCombatSpriteManifest({
        'doctor_f_sheet.png': { aliases: { quick_strike: 'strike', strike: 'melee' } },
      });
      expect(CombatUI._resolveSpriteMotion('doctor_f', 'quick_strike')).toBeNull();

      applyCombatSpriteManifest({
        'doctor_f_sheet.png': { aliases: { quick_strike: 'strike', strike: 'quick_strike' } },
      });
      expect(CombatUI._resolveSpriteMotion('doctor_f', 'quick_strike')).toBeNull();
    } finally {
      if (previousAliases === undefined) delete sheet.aliases;
      else sheet.aliases = previousAliases;
    }
  });

  it('restarts the same action row from frame zero and protects the newer playback from stale cleanup', () => {
    vi.useFakeTimers();
    const player = document.querySelector('.cv-player');
    player.innerHTML = '<span class="combat-sprite-sheet"></span>';
    const sprite = player.querySelector('.combat-sprite-sheet');
    let reflowCount = 0;
    Object.defineProperty(sprite, 'offsetWidth', {
      configurable: true,
      get: () => {
        reflowCount += 1;
        return 1;
      },
    });

    CombatUI._playSpriteMotion(player, 'doctor_f', 'basic_attack');
    vi.advanceTimersByTime(360);
    CombatUI._playSpriteMotion(player, 'doctor_f', 'basic_attack');
    vi.advanceTimersByTime(360);

    expect(reflowCount).toBe(2);
    expect(sprite.style.getPropertyValue('--sprite-row-y')).toBe('14.2857%');
    vi.advanceTimersByTime(360);
    expect(sprite.style.getPropertyValue('--sprite-row-y')).toBe('');
  });

  it('returns non-loop motions to idle CSS while holdLast motions retain their final row', () => {
    vi.useFakeTimers();
    const player = document.querySelector('.cv-player');
    player.innerHTML = '<span class="combat-sprite-sheet"></span>';
    const sprite = player.querySelector('.combat-sprite-sheet');

    CombatUI._playSpriteMotion(player, 'doctor_f', 'basic_attack');
    vi.advanceTimersByTime(720);
    expect(sprite.style.getPropertyValue('--sprite-row-y')).toBe('');
    expect(sprite.style.animationName).toBe('');

    CombatUI._playSpriteMotion(player, 'doctor_f', 'death');
    vi.advanceTimersByTime(900);
    expect(sprite.style.getPropertyValue('--sprite-row-y')).toBe('100.0000%');
    expect(sprite.style.animationFillMode).toBe('forwards');
  });

  it('holds the death row for downed actors and preserves true player death', () => {
    vi.useFakeTimers();
    const player = document.querySelector('.cv-player');
    const ally = document.querySelector('[data-companion-id="npc_nurse"]');
    player.innerHTML = '<span class="combat-sprite-sheet"></span>';
    ally.innerHTML = '<span class="combat-sprite-sheet"></span>';
    GameState.player = { characterId: 'doctor', gender: 'F' };

    CombatUI._playFx({ kind: 'downed', target: 'player' });
    expect(player.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y'))
      .toBe('100.0000%');
    expect(player.querySelector('.combat-sprite-sheet').style.animationFillMode).toBe('forwards');
    vi.advanceTimersByTime(900);
    expect(player.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y')).toBe('100.0000%');

    CombatUI._playFx({ kind: 'downed', target: 'ally', targetId: 'npc_nurse' });
    expect(ally.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y'))
      .toBe('100.0000%');
    expect(player.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y'))
      .toBe('100.0000%');

    vi.advanceTimersByTime(900);
    expect(player.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y')).toBe('100.0000%');
    expect(ally.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y')).toBe('100.0000%');

    CombatUI._playFx({ kind: 'playerDeath' });
    vi.advanceTimersByTime(2200);
    expect(player.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y'))
      .toBe('100.0000%');
    expect(player.querySelector('.combat-sprite-sheet').style.animationFillMode).toBe('forwards');
  });

  it('replaces a temporary downed row with the idle victory row at combat end', () => {
    vi.useFakeTimers();
    const player = document.querySelector('.cv-player');
    player.innerHTML = '<span class="combat-sprite-sheet"></span>';
    GameState.player = { characterId: 'doctor', gender: 'F' };

    CombatUI._playFx({ kind: 'downed', target: 'player' });
    CombatUI._playFx({ kind: 'victory' });
    vi.advanceTimersByTime(1800);

    expect(player.querySelector('.combat-sprite-sheet').style.getPropertyValue('--sprite-row-y'))
      .toBe('0.0000%');
    expect(player.querySelector('.combat-sprite-sheet').style.animationFillMode).toBe('forwards');
  });
});
