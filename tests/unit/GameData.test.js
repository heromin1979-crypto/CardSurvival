import { describe, it, expect } from 'vitest';
import GameData from '../../js/data/GameData.js';
import BLUEPRINTS   from '../../js/data/blueprints.js';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';
import ENEMIES      from '../../js/data/enemies.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';

describe('GameData 불변성 및 구조', () => {
  it('Object.freeze() 된 불변 객체다', () => {
    expect(Object.isFrozen(GameData)).toBe(true);
  });

  it('필수 키가 모두 존재한다', () => {
    const keys = ['items', 'blueprints', 'nodes', 'districts', 'subLocations',
                  'enemies', 'characters', 'hiddenLocations', 'secretEvents', 'hiddenRecipes'];
    for (const key of keys) {
      expect(GameData).toHaveProperty(key);
    }
  });

  it('items가 비어있지 않다', () => {
    expect(Object.keys(GameData.items).length).toBeGreaterThan(0);
  });

  it('characters가 비어있지 않다', () => {
    expect(Object.keys(GameData.characters).length).toBeGreaterThan(0);
  });

  it('nodes가 비어있지 않다', () => {
    expect(Object.keys(GameData.nodes).length).toBeGreaterThan(0);
  });
});

describe('GameData 데이터 머지 검증', () => {
  it('blueprints에 hiddenRecipes가 포함된다 (머지)', () => {
    const hiddenKeys = Object.keys(HIDDEN_RECIPES);
    for (const key of hiddenKeys) {
      expect(GameData.blueprints).toHaveProperty(key);
    }
  });

  it('blueprints에 기본 blueprints가 포함된다', () => {
    const baseKeys = Object.keys(BLUEPRINTS);
    for (const key of baseKeys) {
      expect(GameData.blueprints).toHaveProperty(key);
    }
  });

  it('enemies에 secretEnemies가 포함된다 (머지)', () => {
    const secretKeys = Object.keys(SECRET_ENEMIES);
    for (const key of secretKeys) {
      expect(GameData.enemies).toHaveProperty(key);
    }
  });

  it('enemies에 기본 enemies가 포함된다', () => {
    const baseKeys = Object.keys(ENEMIES);
    for (const key of baseKeys) {
      expect(GameData.enemies).toHaveProperty(key);
    }
  });
});
