import { describe, it, expect } from 'vitest';
import GameData from '../../js/data/GameData.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';

const REMOVED_LOW_COMPLETENESS_ENEMIES = [
  'food_raider',
  'black_market_dealer',
  'boss_summer_inferno',
  'boss_monsoon_leviathan',
  'boss_acid_rain_horror',
  'boss_train_conductor',
  'boss_military_ai',
  'boss_engineer_rival',
];

describe('secret enemy curation', () => {
  it('removes low-completeness enemies from the active enemy registry', () => {
    for (const enemyId of REMOVED_LOW_COMPLETENESS_ENEMIES) {
      expect(SECRET_ENEMIES).not.toHaveProperty(enemyId);
      expect(GameData.enemies).not.toHaveProperty(enemyId);
    }
  });

  it('keeps all remaining summon references valid', () => {
    for (const enemy of Object.values(SECRET_ENEMIES)) {
      const pattern = enemy.bossPattern;
      const actions = [
        ...(pattern?.basicAttacks ?? []),
        pattern?.specialSkill,
        pattern?.ultimate,
      ].filter(Boolean);
      const summonIds = actions.flatMap(action =>
        (action.effects ?? [])
          .filter(effect => effect?.type === 'summon' && effect.enemyId)
          .map(effect => effect.enemyId),
      );

      for (const summonId of summonIds) {
        expect(GameData.enemies, `${enemy.id} summons ${summonId}`).toHaveProperty(summonId);
      }
    }
  });
});
