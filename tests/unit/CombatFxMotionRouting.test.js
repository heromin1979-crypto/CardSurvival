// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CombatUI from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';
import { COMBAT_SPRITE_SHEETS } from '../../js/ui/combat/combatUiAssets.js';

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
      expect(sprite.style.getPropertyValue('--sprite-row-y')).toBe('33.3333%');
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
      .toBe('33.3333%');
  });
});
